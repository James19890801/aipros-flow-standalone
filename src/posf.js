// AIPROS 流程图 — .posf / .pos 文档读写
// .posf = ZIP { meta.json + <canvasId>.pos + attachment/ + files/ }

import fs from 'node:fs'
import JSZip from 'jszip'

export async function parsePosfBuffer(buf) {
  const zip = await JSZip.loadAsync(buf)
  const metaFile = zip.file('meta.json')
  if (!metaFile) throw new Error('缺少 meta.json, 不是合法的 .posf 文件')
  const meta = JSON.parse(await metaFile.async('string'))
  const docs = []
  for (const p of meta.pages) {
    const posFile = zip.file(`${p.definitionId}.pos`)
    if (!posFile) throw new Error(`缺少页面文件 ${p.definitionId}.pos`)
    docs.push(JSON.parse(await posFile.async('string')))
  }
  return { meta, docs }
}

export async function buildPosfBuffer(doc) {
  const finalMeta = doc.meta
  const zip = new JSZip()
  zip.file('meta.json', JSON.stringify(finalMeta))
  zip.file(`${finalMeta.id}.pos`, JSON.stringify(doc))
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
}

export async function readDocument(file) {
  const buf = fs.readFileSync(file)
  if (file.endsWith('.pos') || file.endsWith('.json')) {
    return { kind: 'pos', docs: [JSON.parse(buf.toString('utf8'))] }
  }
  const r = await parsePosfBuffer(buf)
  return { kind: 'posf', ...r }
}

export async function writeDocument(file, doc) {
  if (file.endsWith('.pos')) {
    fs.writeFileSync(file, JSON.stringify(doc))
    return
  }
  fs.writeFileSync(file, await buildPosfBuffer(doc))
}

export function emptyMeta(id, title, category = 'flow') {
  const now = formatTime(new Date())
  return {
    pages: [{ canvasId: id, definitionId: id, title: '画布1', sort: 0 }],
    mainCanvasId: id,
    exportTime: now,
    member: '',
    diagramInfo: { creator: '', created: now, modified: now, title, category },
    id,
    type: 'AIPROS Schema File',
    version: '5.0',
  }
}

function formatTime(d) {
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
