// AIPROS 流程图 — ELK 自动布局（与官方引擎内置布局内核同源）

import { elementsOf, shapeAnchorPoint } from './model.js'

export async function applyLayout(doc, { direction = 'DOWN', nodeGap = 40, rankGap = 70 } = {}) {
  const { default: ELK } = await import('elkjs')
  const elk = new ELK()
  const els = elementsOf(doc)

  const nodes = Object.values(els).filter(e => e.name !== 'linker')
  const linkers = Object.values(els).filter(e => e.name === 'linker')

  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.spacing.nodeNode': String(nodeGap),
      'elk.layering.spacing.nodeNodeBetweenLayers': String(rankGap),
      'elk.edgeRouting': 'ORTHOGONAL',
    },
    children: nodes.map(n => ({ id: n.id, width: n.props.w, height: n.props.h })),
    edges: linkers
      .filter(l => l.from?.id && l.to?.id)
      .map(l => ({ id: l.id, sources: [l.from.id], targets: [l.to.id] })),
  }

  const laid = await elk.layout(graph)
  const byId = new Map(laid.children.map(c => [c.id, c]))

  for (const n of nodes) {
    const c = byId.get(n.id)
    if (c) { n.props.x = Math.round(c.x); n.props.y = Math.round(c.y) }
  }

  for (const l of linkers) {
    const from = els[l.from.id]
    const to = els[l.to.id]
    if (from && to) {
      Object.assign(l.from, anchorToward(from, to))
      Object.assign(l.to, anchorToward(to, from))
    }
    const edge = (laid.edges ?? []).find(ed => ed.id === l.id)
    l.points = []
    if (edge) {
      for (const sec of edge.sections ?? []) {
        for (const bp of sec.bendPoints ?? []) l.points.push({ x: Math.round(bp.x), y: Math.round(bp.y) })
        if (sec.startPoint) { l.from.x = Math.round(sec.startPoint.x); l.from.y = Math.round(sec.startPoint.y) }
        if (sec.endPoint) { l.to.x = Math.round(sec.endPoint.x); l.to.y = Math.round(sec.endPoint.y) }
      }
    }
  }

  // 画布尺寸自适应
  const page = doc.diagram.elements.page
  let x1 = 0, y1 = 0
  for (const n of nodes) { x1 = Math.max(x1, n.props.x + n.props.w); y1 = Math.max(y1, n.props.y + n.props.h) }
  if (x1 > 0) { page.width = x1 + (page.padding ?? 20); page.height = y1 + (page.padding ?? 20) }
  return { nodes: nodes.length, edges: linkers.length }
}

function anchorToward(from, to) {
  const f = from.props, t = to.props
  const dx = (t.x + t.w / 2) - (f.x + f.w / 2)
  const dy = (t.y + t.h / 2) - (f.y + f.h / 2)
  if (Math.abs(dy) >= Math.abs(dx)) {
    return dy >= 0 ? shapeAnchorPoint(from, 'bottom') : shapeAnchorPoint(from, 'top')
  }
  return dx >= 0 ? shapeAnchorPoint(from, 'right') : shapeAnchorPoint(from, 'left')
}
