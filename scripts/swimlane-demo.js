// AIPROS 流程图 — 跨部门泳道图生成器（招聘全流程 · 规范版）
// 规范：泳道自上而下；顺序活动的纵轴（列）不重叠；连线一律左进右出；
//       连线竖直段走列间隙，不穿过任何活动；含流程标题。

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadCatalog, resolveShapePath } from '../src/catalog.js'
import { genId, createDocument, elementsOf } from '../src/model.js'
import { buildPosfBuffer } from '../src/posf.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const catalog = loadCatalog()
const shapeDef = name => catalog.shapes.get(name)

/* ---------------- 画布几何 ---------------- */
const POOL_X = 80, POOL_Y = 110
const POOL_HEADER = 40
const LANE_HEADER = 30
const LANE_H = 130
const COL_PITCH = 210
const NODE_W = 140, NODE_H = 50
const DEC_W = 120, DEC_H = 80
const TERM_W = 130, TERM_H = 46
const TITLE_H = 60

const LANES = ['用人部门', '部门负责人', 'HR 招聘组', '候选人', 'HRBP（薪酬）']
const N_COL = 11
const POOL_W = POOL_HEADER + LANE_HEADER + N_COL * COL_PITCH + 60
const POOL_H = LANES.length * LANE_H

const colX = c => POOL_X + POOL_HEADER + LANE_HEADER + 20 + c * COL_PITCH
const rowY = laneIdx => POOL_Y + laneIdx * LANE_H + (LANE_H - NODE_H) / 2

/* ---------------- 文档 ---------------- */
const doc = createDocument('招聘流程泳道图')
const els = elementsOf(doc)
const page = doc.diagram.elements.page
page.width = POOL_W + 160
page.height = POOL_H + POOL_Y + TITLE_H + 80
page.showGrid = false

function makeElement(def, { x, y, w, h, text, parent, container, extraProps, fill, font }) {
  const path = resolveShapePath(def, catalog.commands, catalog.pathFuns, w, h)
  const el = {
    id: genId(), name: def.name, category: def.category,
    parent: parent ?? '', link: '', group: '', children: [],
    props: { x: Math.round(x), y: Math.round(y), w, h, zindex: 10, angle: 0, ...(extraProps ?? {}) },
    shapeStyle: { alpha: 1 },
    textBlock: (def.textBlock?.length ? def.textBlock : [{ position: { x: 5, y: 0, w: 'w-10', h: 'h' } }])
      .map(tb => ({ position: { ...tb.position }, text: text ?? '' })),
    anchors: (def.anchors ?? []).map(a => ({ ...a })),
    fontStyle: { fontFamily: '微软雅黑', size: 13, color: '50,50,50', bold: false, italic: false, underline: false, textAlign: 'center', vAlign: 'middle', ...(def.fontStyle ?? {}), ...(font ?? {}) },
    fillStyle: def.fillStyle ? { ...def.fillStyle } : {},
    lineStyle: { lineWidth: 1, rounding: 4, lineColor: '100,116,139', lineStyle: 'solid', ...(def.lineStyle ?? {}) },
    path, dataAttributes: [],
    resizeDir: def.resizeDir ?? ['tl', 'tr', 'br', 'bl', 'l', 't', 'r', 'b'],
    attribute: { container: false, rotatable: true, visible: true, fixedLink: false, collapsable: false, collapsed: false, linkable: true, markerOffset: 5, ...(def.attribute ?? {}) },
    theme: {}, locked: false,
  }
  if (container) el.container = container
  if (fill) el.fillStyle = { ...el.fillStyle, ...fill }
  els[el.id] = el
  return el
}

/* ---------------- 标题 ---------------- */
const titleDef = shapeDef('text')
makeElement(titleDef, {
  x: POOL_X + POOL_W / 2 - 260, y: 30, w: 520, h: 50,
  text: '招聘流程泳道图（需求提出 → 需求满足）',
  font: { size: 22, bold: true, color: '30,41,59' },
})

/* ---------------- 泳池与泳道 ---------------- */
const pool = makeElement(shapeDef('horizontalPool'), {
  x: POOL_X, y: POOL_Y, w: POOL_W, h: POOL_H,
  text: '招聘', extraProps: { height: [POOL_HEADER] },
})
pool.attribute = { ...pool.attribute, container: true, rotatable: false, linkable: false, visible: true }
pool.fontStyle = { ...pool.fontStyle, size: 15, bold: true }

const laneByName = {}
LANES.forEach((title, i) => {
  const lane = makeElement(shapeDef('horizontalLane'), {
    x: POOL_X + POOL_HEADER, y: POOL_Y + i * LANE_H,
    w: POOL_W - POOL_HEADER, h: LANE_H,
    text: title, parent: pool.id, container: pool.id,
    extraProps: { height: [LANE_HEADER] },
  })
  lane.attribute = { ...lane.attribute, container: true, rotatable: false, linkable: false }
  pool.children.push(lane.id)
  laneByName[title] = lane
})

function node(laneTitle, c, kind, text, opts = {}) {
  const laneIdx = LANES.indexOf(laneTitle)
  const def = shapeDef(kind)
  const w = opts.w ?? (kind === 'decision' ? DEC_W : kind === 'terminator' ? TERM_W : NODE_W)
  const h = opts.h ?? (kind === 'decision' ? DEC_H : kind === 'terminator' ? TERM_H : NODE_H)
  const x = colX(c) + (COL_PITCH - 30 - w) / 2
  const y = POOL_Y + laneIdx * LANE_H + (LANE_H - h) / 2
  const el = makeElement(def, { x, y, w, h, text, container: laneByName[laneTitle].id, parent: laneByName[laneTitle].id, fill: opts.fill })
  el._col = c
  laneByName[laneTitle].children.push(el.id)
  return el
}

/* ---------------- 流程节点（每格一个，列不重叠） ---------------- */
const P = 'process', D = 'decision', T = 'terminator'
const END_FILL = { type: 'solid', color: '226, 232, 240' }
const BAD_FILL = { type: 'solid', color: '252, 238, 238' }

const n1  = node('用人部门', 0, T, '招聘需求提出', { fill: END_FILL })
const d1  = node('部门负责人', 1, D, '编制与\n预算审批？')
const n2  = node('用人部门', 2, T, '需求关闭', { fill: BAD_FILL })
const n3  = node('HR 招聘组', 2, P, 'JD 撰写与\n多渠道发布')
const n4  = node('候选人', 3, P, '投递简历 /\n被动触达')
const d2  = node('HR 招聘组', 4, D, '简历初筛\n通过？')
const n5  = node('候选人', 5, T, '人才库储备', { fill: BAD_FILL })
const n6  = node('HR 招聘组', 5, P, 'HR 初面')
const n7  = node('用人部门', 6, P, '业务面试与\n终面评估')
const n8  = node('HRBP（薪酬）', 7, P, '谈薪与\n发放 Offer')
const n9  = node('候选人', 8, P, '确认 Offer /\n入职准备')
const n10 = node('HR 招聘组', 9, P, '入职手续办理')
const n11 = node('用人部门', 10, T, '招聘需求满足', { fill: END_FILL })

/* ---------------- 连线路由（两遍：先收集，再整体优化） ---------------- */
// 规范：一律左进右出；竖直段走列间隙；
// 优雅化：同源多出线错开出点、同列间隙多竖线横向散开、入点错开，尽量消除重叠与交叉
const LINKS = []
function link(from, to, { text = '' } = {}) {
  LINKS.push({ from, to, text })
}

function routeLinks() {
  const outgoing = new Map(), incoming = new Map(), gapGroups = new Map()
  for (const l of LINKS) {
    if (!outgoing.has(l.from)) outgoing.set(l.from, [])
    outgoing.get(l.from).push(l)
    if (!incoming.has(l.to)) incoming.set(l.to, [])
    incoming.get(l.to).push(l)
  }
  // 出/入点在边缘上错开
  const stagger = (list, el) => {
    const n = list.length
    list.forEach((l, i) => {
      const off = (i - (n - 1) / 2) * 16
      if (l.from === el) l._exitOff = off
      if (l.to === el) l._entryOff = -off
    })
  }
  for (const [el, list] of outgoing) stagger(list, el)
  for (const [el, list] of incoming) stagger(list, el)

  // 按列间隙分组（源列号即间隙号）
  for (const l of LINKS) {
    const key = l.from._col
    if (!gapGroups.has(key)) gapGroups.set(key, [])
    gapGroups.get(key).push(l)
  }
  for (const [, group] of gapGroups) {
    // 间隙横向范围（组内取并集的安全区）
    let start = -Infinity, end = Infinity
    for (const l of group) {
      start = Math.max(start, l.from.props.x + l.from.props.w + 4)
      end = Math.min(end, l.to.props.x - 4)
    }
    if (end <= start) { start = 0; end = 1 } // 兜底
    // 组内按竖线跨度排序（短跨度在内侧，长跨度在外侧，减少交叉）
    group.sort((a, b) => Math.abs((a._exitOff ?? 0)) - Math.abs((b._exitOff ?? 0)))
    const n = group.length
    group.forEach((l, i) => {
      const gx = n === 1 ? (start + end) / 2 : start + ((i + 1) / (n + 1)) * (end - start)
      const exitY = l.from.props.y + l.from.props.h / 2 + (l._exitOff ?? 0)
      const entryY = l.to.props.y + l.to.props.h / 2 + (l._entryOff ?? 0)
      const p1 = { x: l.from.props.x + l.from.props.w, y: exitY }
      const p2 = { x: l.to.props.x, y: entryY }
      const points = Math.abs(exitY - entryY) < 3 ? [] : [{ x: Math.round(gx), y: Math.round(exitY) }, { x: Math.round(gx), y: Math.round(entryY) }]
      const el = {
        id: genId(), name: 'linker',
        from: { id: l.from.id, x: Math.round(p1.x), y: Math.round(p1.y) },
        to: { id: l.to.id, x: Math.round(p2.x), y: Math.round(p2.y) },
        points: points.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) })),
        text: l.text, linkerType: 'broken',
        props: { zindex: 5 },
        lineStyle: { lineWidth: 1, rounding: 6, lineColor: '71, 85, 105', lineStyle: 'solid', beginArrowStyle: 'none', endArrowStyle: 'solidArrow' },
        fontStyle: { fontFamily: '微软雅黑', size: 12, color: '100,116,139', bold: false, italic: false, underline: false, textAlign: 'center' },
        dataAttributes: [], parent: '', group: '', locked: false,
      }
      els[el.id] = el
    })
  }
}

link(n1, d1)
link(d1, n3, { text: '是' })
link(d1, n2, { text: '否' })
link(n3, n4)
link(n4, d2)
link(d2, n6, { text: '通过' })
link(d2, n5, { text: '未通过' })
link(n6, n7)
link(n7, n8)
link(n8, n9)
link(n9, n10)
link(n10, n11)

// 两遍路由：整体优化出/入点与竖线分布
routeLinks()

/* ---------------- 输出 ---------------- */
const nodes = Object.values(els).filter(e => e.name !== 'linker')
const links = Object.values(els).filter(e => e.name === 'linker')
console.log(`泳道图: 1 泳池 / ${LANES.length} 泳道 / ${nodes.length - LANES.length - 2} 个流程元素 / ${links.length} 条连线（全部左进右出）`)

const outDir = path.join(ROOT, 'data', 'docs')
fs.mkdirSync(outDir, { recursive: true })
const buf = await buildPosfBuffer(doc)
fs.writeFileSync(path.join(outDir, '招聘流程泳道图.posf'), buf)
console.log(`已生成: data/docs/招聘流程泳道图.posf (${(buf.length / 1024).toFixed(1)} KB)`)
