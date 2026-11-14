// AIPROS 流程图 — Web 服务端
// 静态编辑器 + 形状/布局/导入导出 API，与 CLI 共享同一套引擎

import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadCatalog, resolveShapePath } from '../src/catalog.js'
import { previewShapeSVG, renderSVG } from '../src/render.js'
import { buildPosfBuffer, parsePosfBuffer } from '../src/posf.js'
import { createDocument } from '../src/model.js'
import { generateSwimlane } from '../src/swimlane-generator.js'
import { createHash, randomUUID, randomBytes } from 'node:crypto'
import bridgeAuth from '../scripts/local-bridge-auth.cjs'
import { loadQcaConfig, saveQcaConfig, publicQcaConfig } from './qca-config.js'
import { createQcaStreamHandler } from './qca-stream.js'
import { createQcaConfigLoader } from './qca-shared-config.js'
import { runQcaTurn, getQcaSessionUsage, getQcaSkillVersion } from './qca-client.js'
import { createDailyBudget } from './qca-daily-budget.js'
import { loadSession, saveSession } from './qca-session-store.js'
import { readProjects, writeProjects, validateProjects } from './project-store.js'
import { atomicWrite } from './atomic-write.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

/* ---- 官方编辑器引擎：完整 v5_editor（100% 复刻，随仓库 vendor 自包含） ---- */
const PO_RENDERER = path.resolve(process.env.AIPROS_PO_RENDERER || path.join(ROOT, 'vendor', 'renderer'))
const PORT = process.env.PORT || 3900
const DOCS_DIR = process.env.AIPROS_DOCS || path.join(ROOT, 'data', 'docs')
const LEGACY_DOCS_DIR = DOCS_DIR
fs.mkdirSync(DOCS_DIR, { recursive: true })

console.log('加载形状目录…')
const catalog = loadCatalog()
console.log(`形状目录就绪: ${catalog.shapes.size} 形状 / ${catalog.categories.size} 分类` +
  (catalog.failures.length ? ` (${catalog.failures.length} 个文件加载失败)` : ''))

const app = express()
const BASE_PATH = process.env.AIPROS_BASE_PATH || ''
if (BASE_PATH && !/^\/[a-zA-Z0-9_-]+$/.test(BASE_PATH)) throw new Error('Invalid AIPROS_BASE_PATH')
if (BASE_PATH) app.use((req, res, next) => {
  if (req.url === BASE_PATH) return res.redirect(BASE_PATH + '/')
  if (!req.url.startsWith(BASE_PATH + '/') && !req.url.startsWith(BASE_PATH + '?')) return res.sendStatus(404)
  req.url = req.url.slice(BASE_PATH.length) || '/'
  next()
})
// Single-user, loopback-only storage for the standalone edition.
const localDir = path.join(ROOT, 'data')
const keyFile = path.join(localDir, 'qca.key')
fs.mkdirSync(localDir, { recursive: true, mode: 0o700 })
if (!process.env.AIPROS_QCA_ENCRYPTION_KEY) {
  try { fs.writeFileSync(keyFile, randomBytes(32).toString('hex'), {mode:0o600, flag:'wx'}) } catch (e) { if(e.code!=='EEXIST') throw e }
  process.env.AIPROS_QCA_ENCRYPTION_KEY=fs.readFileSync(keyFile,'utf8').trim()
}
app.use((req,res,next)=>{
  if (!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) return res.sendStatus(403)
  if (!['GET','HEAD','OPTIONS'].includes(req.method) && (req.headers['sec-fetch-site']==='cross-site' || (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`))) return res.sendStatus(403)
  req.flowStore={directory:localDir,docs:DOCS_DIR}
  next()
})
app.use(express.json({ limit: '20mb' }))
app.use(express.raw({ type: 'application/octet-stream', limit: '20mb' }))
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message })
  next()
})

// 写操作限流（每 IP 每分钟 300 次；本机放行，防外部滥用）
const rateBuckets = new Map()
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of rateBuckets) if (now - v.t > 120000) rateBuckets.delete(k)
}, 60000)
app.set('trust proxy', true)
app.use('/api', (req, res, next) => {
  if (req.method !== 'POST') return next()
  const ip = req.ip
  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return next()
  const now = Date.now()
  const b = rateBuckets.get(ip) || { t: now, n: 0 }
  if (now - b.t > 60000) { b.t = now; b.n = 0 }
  b.n++
  rateBuckets.set(ip, b)
  if (b.n > 300) return res.status(429).json({ error: '请求过于频繁，请稍后再试' })
  next()
})

// 静态资源：编辑器页面 + 引擎模块（浏览器直接 import）
// 根路径直达官方引擎编辑器（默认打开泳道图）
app.get('/', (req, res) => res.redirect('/editor'))
app.use('/src', express.static(path.join(ROOT, 'src')))
app.get('/ai-stream.js', (req,res) => res.type('application/javascript').sendFile(path.join(ROOT, 'web', 'ai-stream.cjs')))
app.get('/ai-projects.js', (req,res) => res.type('application/javascript').sendFile(path.join(ROOT, 'web', 'ai-projects.cjs')))
app.get('/flow-repair.js', (req,res) => res.type('application/javascript').sendFile(path.join(ROOT, 'web', 'flow-repair.cjs')))
app.get('/agent-runtime.js', (req,res) => res.type('application/javascript').sendFile(path.join(ROOT, 'web', 'agent-runtime.cjs')))
app.use(express.static(path.join(ROOT, 'web')))

/* ---- 官方编辑器引擎：完整官方 v5_editor 引擎（100% 复刻，vendor 自包含） ---- */
const EDITOR_HTML = 'src/v5_editor/source/compile/diagrams/index.html'

app.use('/app', (req, res, next) => {
  if (req.path === '/' + EDITOR_HTML) {
    let html = fs.readFileSync(path.join(PO_RENDERER, EDITOR_HTML), 'utf8')
    html = html.replace(/<head([^>]*)>/i, '<head$1>\n<script src="/po-shim.js"></script>\n<script defer src="/ai-projects.js"></script>\n<script defer src="/agent-runtime.js?v=20261114i"></script>\n<script defer src="/flow-repair.js"></script>\n<script defer src="/ai-stream.js"></script>\n<script defer src="/ai-assistant.js?v=20261114i"></script>')
    html = html.replace('<head>', `<head>\n<script>window.aiprosUserKey='local'; window.aiprosQcaEnabled=true; window.aiprosQcaShared=false;</script>`)
    res.type('html').send(html)
    return
  }
  next()
}, express.static(PO_RENDERER))

// 编辑器内部使用根相对路径 /v5_editor/... 引用资源
app.use('/v5_editor', express.static(path.join(PO_RENDERER, 'src', 'v5_editor')))
app.use('/assets', express.static(path.join(PO_RENDERER, 'src', 'assets')))

// 官方引擎虚拟文件系统
const PO_FS_FILE = path.join(DOCS_DIR, '..', 'po-fs.json')
const legacyPoFS = { data: fs.existsSync(PO_FS_FILE) ? JSON.parse(fs.readFileSync(PO_FS_FILE, 'utf8')) : {} }

// 串行写锁：避免并发保存把 JSON 状态文件写坏
let writeChain = Promise.resolve()
function serializedWrite(fn) {
  writeChain = writeChain.then(fn, fn)
  return writeChain
}
function poFSSave(store) {
  return serializedWrite(() => atomicWrite(store?.fsFile || PO_FS_FILE, JSON.stringify((store?.poFS || legacyPoFS).data)))
}

const MAX_ASSET_BYTES = 20 * 1024 * 1024
function safeReadWithin(root, rel, maxBytes = MAX_ASSET_BYTES) {
  const resolved = path.resolve(root, String(rel).replace(/^[/\\]+/, ''))
  if (!resolved.startsWith(path.resolve(root) + path.sep)) return null
  try {
    const st = fs.statSync(resolved)
    if (!st.isFile() || st.size > maxBytes) return null
    return fs.readFileSync(resolved)
  } catch { return null }
}

function assetLookup(p) {
  // 本地静态资源（编辑器图标/形状图）→ 读磁盘并转 base64（限制在 vendor 目录内，防路径穿越）
  const rel = String(p)
    .replace(/^file:\/*/, '')
    .replace(/^.*(out\/renderer\/)/, '')
    .replace(/^\/?assets\//, 'src/assets/')
  for (const cand of [rel, path.join('src', String(p).replace(/^.*?renderer\/?/, ''))]) {
    const buf = safeReadWithin(PO_RENDERER, cand)
    if (buf) return buf.toString('base64')
  }
  return null
}

function docLookup(p, docs = DOCS_DIR) {
  const m = String(p).match(/\/?docs\/(.+\.pos[fmso]?)$/i)
  if (!m) return null
  const name = path.basename(m[1]).replace(/[^\w\u4e00-\u9fff.-]/g, '')
  if (!name) return null
  const buf = safeReadWithin(docs, name, 50 * 1024 * 1024)
  return buf ? buf.toString('base64') : null
}

app.post('/api/po/fs', async (req, res) => {
  const poFS = req.flowStore?.poFS || legacyPoFS
  const DOCS_DIR = req.flowStore?.docs || LEGACY_DOCS_DIR
  const { op, type, path: p, data, suffix } = req.body || {}
  if (op === 'load') {
    const key = `load:${type}:${p}`
    if (type === 'local') {
      const asset = assetLookup(p)
      if (asset) { poFS.data[key] = undefined; return res.json({ code: 200, data: asset }) }
      const doc = docLookup(p, DOCS_DIR)
      if (doc) return res.json({ code: 200, data: doc })
      return res.json({ code: 201 })
    }
    // cache / 其它类型：虚拟 FS
    const hit = poFS.data[`${type}:${p}`]
    if (hit != null) return res.json({ code: 200, data: hit })
    return res.json({ code: 201 })
  }
  if (op === 'save') {
    if (type === 'save' || type === 'local') {
      // 文档保存：文件名净化后写入 docs 目录（限定在 DOCS_DIR 内）
      const name = (path.basename(String(p || '')) || `文档-${Date.now()}`).replace(/[^\w\u4e00-\u9fff.-]/g, '')
      if (!name) return res.status(400).json({ code: 400, message: '非法文件名' })
      const safeName = /\.pos[fmso]?$/.test(name) ? name : name + (suffix || '.posf').replace(/[^.\w]/g, '')
      const file = path.join(DOCS_DIR, safeName)
      if (!path.resolve(file).startsWith(path.resolve(DOCS_DIR) + path.sep)) {
        return res.status(400).json({ code: 400, message: '非法路径' })
      }
      const buf = Buffer.from(String(data || ''), 'base64')
      if (buf.length > 50 * 1024 * 1024) return res.status(413).json({ code: 413, message: '文档过大' })
      atomicWrite(file, buf)
      logPo(`官方引擎保存文档: ${safeName} (${(buf.length / 1024).toFixed(0)}KB)`)
      return res.json({ code: 200, path: `/docs/${safeName}` })
    }
    // cache
    poFS.data[`${type}:${p}`] = data
    await poFSSave(req.flowStore)
    return res.json({ code: 200, path: p })
  }
  res.status(400).json({ code: 400, message: '未知操作' })
})

/* ---- 官方编辑器虚拟数据库（IndexedDB 桥） ---- */
const PO_DB_FILE = path.join(DOCS_DIR, '..', 'po-db.json')
const poDB = { tables: fs.existsSync(PO_DB_FILE) ? JSON.parse(fs.readFileSync(PO_DB_FILE, 'utf8')) : {} }
function poDBSave(store) {
  return serializedWrite(() => atomicWrite(store?.dbFile || PO_DB_FILE, JSON.stringify((store?.poDB || poDB).tables)))
}
function table(name, db = poDB) {
  if (typeof name !== 'string' || !/^[\w-]+$/.test(name)) throw new Error(`非法表名: ${name}`)
  return db.tables[name] || (db.tables[name] = [])
}

function dbFind(name, query, db) {
  const rows = table(name, db)
  if (!query || Object.keys(query).length === 0) return rows
  return rows.filter(r => Object.entries(query).every(([k, v]) => r[k] === v))
}

app.post('/api/po/db', async (req, res) => {
  const db = req.flowStore?.poDB || poDB
  const { op, dbName, data, key, query, oldId } = req.body || {}
  try {
    switch (op) {
      case 'saveData': {
        const rows = table(dbName, db)
        const idx = rows.findIndex(r => r.id === data.id)
        if (idx > -1) rows[idx] = data; else rows.push(data)
        await poDBSave(req.flowStore)
        logPo(`DB save ${dbName}.${data.id}`)
        return res.json(data)
      }
      case 'findOneData': {
        const rows = table(dbName, db)
        const hit = rows.find(r => r.id === key || r.key === key)
        return res.json(hit ?? null)
      }
      case 'findData':
        return res.json(dbFind(dbName, query, db))
      case 'removeData': {
        const rows = table(dbName, db)
        const i = rows.findIndex(r => r.id === key || r.key === key)
        if (i > -1) { rows.splice(i, 1); await poDBSave(req.flowStore) }
        return res.json({ ok: true })
      }
      case 'putAllData': {
        const rows = table(dbName, db)
        const i = rows.findIndex(r => r.id === oldId)
        if (i > -1) rows[i] = data; else rows.push(data)
        await poDBSave(req.flowStore)
        return res.json(data)
      }
      case 'clearData':
        db.tables = {}
        await poDBSave(req.flowStore)
        return res.json({ ok: true })
      case 'removeFileData': {
        for (const t of Object.keys(db.tables)) db.tables[t] = db.tables[t].filter(r => !r.dbId || !String(key) || r.userId !== key)
        await poDBSave(req.flowStore)
        return res.json({ ok: true })
      }
      default:
        return res.status(400).json({ error: `未知 DB 操作 ${op}` })
    }
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

function logPo(msg) { console.log('[官方引擎]', msg) }

/* ---- 官方编辑器在线接口（云端版 canned 响应：全功能会员） ---- */
const MEMBER_PRIVILEGE = {
  member: true, memberName: "詹", expireTime: 0,
  fileCount: 999999, totalFileCount: 999999,
  flowShapeNum: 100000, mindShapeNum: 100000, outlineShapeNum: 100000,
  themesCustomise: 100000, backgroundImage: true, Latex: true,
  download: true, watermark: true, pasteImage: true, myShape: true,
  clipboardImage: true, vip: true, chartCount: 999999, imageCount: 999999,
}
app.get('/api/pc/user/info', (req, res) => {
  const profile = req.flowProfile || { id: 'aipros-zhan', name: '詹' }
  res.json({ code: 200, data: { user: { userId: profile.id, fullName: profile.name, member: true, memberName: profile.name }, auth: { fileCount: MEMBER_PRIVILEGE.fileCount, privilege: MEMBER_PRIVILEGE } } })
})
app.get('/api/pc/user/privilege', (req, res) => {
  res.json({ code: 200, data: { privilege: MEMBER_PRIVILEGE } })
})
app.get('/api/personal/template/official_mark_templates', (req, res) => res.json({ code: 200, data: [] }))
app.get('/api/personal/diagraming/get/chart/def', (req, res) => {
  res.json({ code: 200, data: null })
})

// ---- 形状目录 ----
const PALETTE_CATEGORY = 'flow'
app.get('/api/shapes', (req, res) => {
  const q = String(req.query.q || '').toLowerCase()
  const cat = req.query.category || null
  const out = []
  for (const s of catalog.shapes.values()) {
    if (cat && s.category !== cat) continue
    if (!cat && s.category !== PALETTE_CATEGORY) continue
    const name = s.name.toLowerCase()
    const title = String(s.title || '').toLowerCase()
    if (q && !name.includes(q) && !title.includes(q)) continue
    out.push({
      name: s.name,
      title: s.title || s.name,
      category: s.category,
      w: s.props?.w ?? 100,
      h: s.props?.h ?? 60,
      preview: previewShapeSVG(s, catalog.commands, catalog.pathFuns),
    })
  }
  out.sort((a, b) => a.name.localeCompare(b.name))
  res.json({ shapes: out.slice(0, 200), total: out.length })
})

app.get('/api/shape/:name', (req, res) => {
  const s = catalog.shapes.get(req.params.name)
  if (!s) return res.status(404).json({ error: `形状 ${req.params.name} 不存在` })
  const def = {
    name: s.name, title: s.title, category: s.category,
    props: s.props ? { ...s.props } : undefined,
    textBlock: s.textBlock?.map(tb => ({ position: { ...tb.position } })),
    anchors: s.anchors?.map(a => ({ ...a })),
    fontStyle: s.fontStyle ? { ...s.fontStyle } : undefined,
    fillStyle: s.fillStyle ? { ...s.fillStyle } : undefined,
    lineStyle: s.lineStyle ? { ...s.lineStyle } : undefined,
    attribute: s.attribute ? { ...s.attribute } : undefined,
    path: resolveShapePath(s, catalog.commands, catalog.pathFuns, s.props?.w, s.props?.h),
  }
  res.json({ shape: def })
})

app.get('/api/categories', (req, res) => {
  const out = [...catalog.categories.values()]
    .map(c => ({ name: c.name, text: c.text, count: [...catalog.shapes.values()].filter(s => s.category === c.name).length }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
  res.json({ categories: out })
})

// 从仓库 Skill 读取流程建模规范，绘图与校验仍由服务端控制。
app.get('/api/ai/flow-skill', (req, res) => {
  try {
    const skill=fs.readFileSync(path.join(ROOT,'skills/aipros-flowchart/SKILL.md'),'utf8')
    const match=skill.match(/## 泳道图（规范铁律，必须逐条遵守）([\s\S]*?)(?=\n## )/)
    if(!match) throw new Error('missing skill rules')
    res.json({name:'aipros-flowchart', rules:match[1].trim()})
  } catch {res.status(503).json({error:'流程图 Skill 规范不可用'})}
})

// Persist conversations and canvas bindings within the authenticated user's store.
app.get('/api/ai/projects', (req, res) => {
  if (!req.flowStore) return res.status(403).json({error:'本地存储不可用'})
  res.set('Cache-Control','no-store')
  try { const state=readProjects(req.flowStore.directory);res.set('ETag',projectETag(state));res.set('X-AIPROS-Revision',projectETag(state));return res.json(state) }
  catch { return res.status(500).json({error:'无法读取项目，请稍后重试'}) }
})
function projectETag(state){return '"'+createHash('sha256').update(JSON.stringify(state)).digest('hex')+'"'}
app.put('/api/ai/projects', async (req, res) => {
  if (!req.flowStore) return res.status(403).json({error:'本地存储不可用'})
  if (!validateProjects(req.body)) return res.status(400).json({error:'项目数据无效或过大'})
  const previous=req.headers['if-match']
  if (!previous) return res.status(428).json({error:'请刷新后保存项目'})
  try {
    const result=await serializedWrite(()=>{
      if(projectETag(readProjects(req.flowStore.directory))!==previous)return null
      writeProjects(req.flowStore.directory,req.body)
      return projectETag(req.body)
    })
    if(!result)return res.status(409).json({error:'项目已在其他页面更新，请刷新后继续'})
    res.set('ETag',result);res.set('X-AIPROS-Revision',result);return res.json({ok:true})
  }
  catch { return res.status(500).json({error:'项目保存失败，请稍后重试'}) }
})

// QCA credentials are encrypted per authenticated platform user. Secret material is
// write-only to the browser, never returned by the configuration endpoint.
const qcaEnabled=true
const qcaSharedDirectory=undefined
const loadEffectiveQcaConfig=createQcaConfigLoader({sharedDirectory:qcaEnabled?qcaSharedDirectory:undefined,sessionCreditBudget:process.env.AIPROS_QCA_SESSION_CREDIT_LIMIT,loadConfig:directory=>loadQcaConfig(directory,process.env.AIPROS_QCA_ENCRYPTION_KEY)})
const dailyBudget=qcaEnabled&&qcaSharedDirectory?createDailyBudget({directory:qcaSharedDirectory,limit:200,getUsage:(session,config)=>getQcaSessionUsage({config,session})}):null
const qcaSkillRoot=path.join(ROOT,'skills','aipros-flowchart')
app.post('/api/ai/qca/stream', createQcaStreamHandler({
 enabled:qcaEnabled,
 loadConfig:loadEffectiveQcaConfig,
 runTurn:runQcaTurn,
 dailyBudget,
 remoteSkillId:qcaEnabled&&qcaSharedDirectory?process.env.AIPROS_QCA_REMOTE_SKILL_ID:undefined,
 resolveSkillVersion:getQcaSkillVersion,
 hasProject:(directory,id)=>Object.hasOwn(readProjects(directory).projects,id),
 loadSession,saveSession,
 skillText:qcaEnabled?fs.readFileSync(path.join(qcaSkillRoot,'SKILL.md'),'utf8'):'',
 rulesText:qcaEnabled?fs.readFileSync(path.join(qcaSkillRoot,'references','swimlane-rules.md'),'utf8'):''
}))
app.get('/api/ai/qca/config', (req, res) => {
  
  res.set('Cache-Control', 'no-store')
  if (!req.flowStore) return res.status(403).json({error:'本地存储不可用'})
  try { const config=loadEffectiveQcaConfig(req.flowStore.directory);return res.json(qcaSharedDirectory?{configured:!!config,shared:true}:publicQcaConfig(config)) }
  catch { return res.status(503).json({error:'QCA 配置暂不可用'}) }
})
app.post('/api/ai/qca/config', (req, res) => {
  
  res.set('Cache-Control', 'no-store')
  if (!req.flowStore) return res.status(403).json({error:'本地存储不可用'})
  if (qcaSharedDirectory) return res.status(403).json({error:'共享智能体由平台配置'})
  try { saveQcaConfig(req.flowStore.directory, process.env.AIPROS_QCA_ENCRYPTION_KEY, req.body); return res.json({ok:true}) }
  catch (err) { return res.status(err.message==='QCA 配置无效'?400:503).json({error:err.message==='QCA 配置无效'?'QCA 配置无效':'QCA 配置暂不可用'}) }
})

// 验证版：仅生成新文档，不执行模型代码
app.post('/api/ai/local-bridge', (req, res) => {
  res.set('Cache-Control', 'no-store')
  if (!bridgeAuth.isLocalBridgeRequest(req)) return res.status(403).json({error:'仅限本机页面连接'})
  try {
    const token = fs.readFileSync(path.join(ROOT, 'data', 'local-bridge-token'), 'utf8').trim()
    if (!/^[a-f0-9]{48}$/.test(token)) throw new Error('invalid')
    res.json({ token })
  } catch { res.status(503).json({error:'本机桥接未启动'}) }
})
app.get('/api/ai/bridge-script', (req, res) => res.type('text/plain').sendFile(path.join(ROOT, 'scripts/local-agent-bridge.cjs')))
app.post('/api/ai/flow', async (req, res) => {
  const DOCS_DIR = req.flowStore?.docs || LEGACY_DOCS_DIR
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)) return res.status(403).json({ error: '验证版仅允许本机使用' })
  try {
    const doc = generateSwimlane(req.body.flow, catalog)
    const name = `ai-${randomUUID()}`
    const buf = await buildPosfBuffer(doc)
    fs.writeFileSync(path.join(DOCS_DIR, `${name}.posf`), buf, { flag: 'wx' })
    res.json({ name, url: `${BASE_PATH}/editor?doc=${encodeURIComponent(name)}` })
  } catch (e) { res.status(400).json({ error: e.message }) }
})

// ---- 自动布局 ----
app.post('/api/layout', async (req, res) => {
  try {
    const { nodes, edges, direction = 'DOWN' } = req.body
    const { default: ELK } = await import('elkjs')
    const elk = new ELK()
    const graph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': direction,
        'elk.spacing.nodeNode': '40',
        'elk.layering.spacing.nodeNodeBetweenLayers': '70',
        'elk.edgeRouting': 'ORTHOGONAL',
      },
      children: nodes.map(n => ({ id: n.id, width: n.w, height: n.h })),
      edges: edges.filter(e => e.from && e.to).map(e => ({ id: e.id, sources: [e.from], targets: [e.to] })),
    }
    const laid = await elk.layout(graph)
    res.json({
      nodes: laid.children.map(c => ({ id: c.id, x: Math.round(c.x), y: Math.round(c.y) })),
      edges: (laid.edges ?? []).map(e => ({
        id: e.id,
        points: (e.sections ?? []).flatMap(s => (s.bendPoints ?? []).map(b => ({ x: Math.round(b.x), y: Math.round(b.y) }))),
        start: (e.sections ?? []).map(s => s.startPoint && { x: Math.round(s.startPoint.x), y: Math.round(s.startPoint.y) })[0] || null,
        end: (e.sections ?? []).map(s => s.endPoint && { x: Math.round(s.endPoint.x), y: Math.round(s.endPoint.y) })[0] || null,
      })),
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ---- 导出 ----
app.post('/api/render', (req, res) => {
  try {
    res.type('image/svg+xml').send(renderSVG(req.body.doc, { grid: req.body.grid !== false }))
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.post('/api/export', async (req, res) => {
  try {
    const buf = await buildPosfBuffer(req.body.doc)
    res.type('application/octet-stream').send(buf)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// ---- 导入 ----
app.post('/api/import', async (req, res) => {
  try {
    const r = await parsePosfBuffer(req.body)
    res.json({ meta: r.meta, doc: r.docs[0] })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

// ---- 服务端文档 ----
app.get('/api/docs', (req, res) => {
  const DOCS_DIR = req.flowStore?.docs || LEGACY_DOCS_DIR
  const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.posf'))
  res.json({ docs: files.map(f => ({ name: f.replace(/\.posf$/, '') })) })
})

app.post('/api/docs', async (req, res) => {
  const DOCS_DIR = req.flowStore?.docs || LEGACY_DOCS_DIR
  const name = String(req.body.name || '').replace(/[^\w\u4e00-\u9fff-]/g, '_')
  if (!name) return res.status(400).json({ error: '名称不能为空' })
  const file = path.join(DOCS_DIR, `${name}.posf`)
  const buf = await buildPosfBuffer(req.body.doc)
  atomicWrite(file, buf)
  res.json({ ok: true, name })
})

app.get('/api/docs/:name', async (req, res) => {
  if (!/^[\w\u4e00-\u9fff-]+$/.test(req.params.name)) return res.status(400).json({error:'非法文档名称'})
  const DOCS_DIR = req.flowStore?.docs || LEGACY_DOCS_DIR
  const file = path.join(DOCS_DIR, `${req.params.name}.posf`)
  if (!fs.existsSync(file)) return res.status(404).json({ error: '文档不存在' })
  const r = await parsePosfBuffer(fs.readFileSync(file))
  res.json({ meta: r.meta, doc: r.docs[0] })
})

// 官方引擎编辑器入口：默认打开初始化文档（招聘流程泳道图）
const INIT_DOC = '招聘流程泳道图'
app.get('/', (req, res) => res.redirect(`${BASE_PATH}/editor`))
app.get('/editor', async (req, res) => {
  const DOCS_DIR = req.flowStore?.docs || LEGACY_DOCS_DIR
  const doc = String(req.query.doc || '新建流程图').replace(/[^\w\u4e00-\u9fff-]/g, '')
  const file = path.join(DOCS_DIR, `${doc}.posf`)
  if (doc === '新建流程图' && !fs.existsSync(file)) {
    try { fs.writeFileSync(file, await buildPosfBuffer(createDocument('新画布')), {flag:'wx'}) } catch (err) { if (err.code !== 'EEXIST') throw err }
  }
  if (!fs.existsSync(file)) {
    return res.status(404).send(`文档不存在: ${doc}。<a href="/">返回首页</a>`)
  }
  const url = `${BASE_PATH}/app/${EDITOR_HTML}?token=token&chartId=&dbId=undefined&filepath=/docs/${encodeURIComponent(doc)}.posf`
  res.redirect(url)
})

app.get('/api/health', (req, res) => res.json({ ok: true, brand: 'AIPROS 流程图', shapes: catalog.shapes.size }))

const HOST = '127.0.0.1'
app.listen(PORT, HOST, () => {
  console.log(`AIPROS 流程图 已启动: http://${HOST === '127.0.0.1' ? 'localhost' : HOST}:${PORT} (PID ${process.pid})`)
})
