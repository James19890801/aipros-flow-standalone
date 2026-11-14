// AIPROS 流程图 — 无头 SVG 渲染器
// path actions → SVG path data; 表达式坐标在 {w,h} 作用域下求值

import { evalExpr } from './expr.js'
import { resolveShapePath } from './shapepath.js'

const SVGNS = 'http://www.w3.org/2000/svg'

// 形状预览 SVG（调色板用）：单形状居中缩放
export function previewShapeSVG(shape, commands, pathFuns, boxW = 46, boxH = 34) {
  const w = shape.props?.w ?? 100
  const h = shape.props?.h ?? 60
  const path = resolveShapePath(shape, commands, pathFuns, w, h)
  const element = {
    id: 'preview',
    name: shape.name,
    props: { x: 0, y: 0, w, h, zindex: 1, angle: 0 },
    shapeStyle: { alpha: 1 },
    textBlock: [],
    anchors: [],
    fontStyle: {},
    fillStyle: shape.fillStyle ?? {},
    lineStyle: shape.lineStyle ?? { lineWidth: 1, lineColor: '100,116,139' },
    path,
  }
  const s = Math.min(boxW / (w + 8), boxH / (h + 8))
  const tw = Math.round(w * s), th = Math.round(h * s)
  const body = renderShape(element)
  return `<svg xmlns="${SVGNS}" width="${tw}" height="${th}" viewBox="0 0 ${w} ${h}">${body}</svg>`
}

export function renderSVG(doc, { grid = true } = {}) {  const page = doc.diagram.elements.page
  const els = doc.diagram.elements.elements
  const pad = page.padding ?? 20

  const shapes = []
  const linkers = []
  for (const e of Object.values(els)) {
    (e.name === 'linker' ? linkers : shapes).push(e)
  }
  shapes.sort((a, b) => (a.props?.zindex ?? 0) - (b.props?.zindex ?? 0))

  const bounds = computeBounds(page, shapes)
  const parts = []
  parts.push(`<svg xmlns="${SVGNS}" width="${bounds.w}" height="${bounds.h}" viewBox="0 0 ${bounds.w} ${bounds.h}">`)
  parts.push(`<rect x="0" y="0" width="${bounds.w}" height="${bounds.h}" fill="${cssColor(page.backgroundColor) || '#ffffff'}"/>`)
  if (grid && page.showGrid !== false) parts.push(gridPattern(page, bounds))
  parts.push(arrowMarkerDefs())
  for (const e of shapes) parts.push(renderShape(e))
  for (const e of linkers) parts.push(renderLinker(e))
  parts.push('</svg>')
  return parts.join('\n')
}

function computeBounds(page, shapes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const e of shapes) {
    const p = e.props
    if (!p) continue
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y)
    x1 = Math.max(x1, p.x + p.w); y1 = Math.max(y1, p.y + p.h)
  }
  if (!isFinite(x0)) return { w: page.width, h: page.height }
  const pad = page.padding ?? 20
  return { w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2, x: x0 - pad, y: y0 - pad }
}

function gridPattern(page, bounds) {
  const size = page.gridSize ?? 15
  const id = 'po-grid'
  return `<defs><pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">` +
    `<path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="#e8e8e8" stroke-width="0.5"/></pattern></defs>` +
    `<rect width="${bounds.w}" height="${bounds.h}" fill="url(#${id})" opacity="0.6"/>`
}

function arrowMarkerDefs() {
  const mk = (id, fill) =>
    `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">` +
    `<path d="M 0 0 L 10 5 L 0 10 z" fill="${fill}"/></marker>`
  return '<defs>' + mk('po-arrow-end', '#333') + mk('po-arrow-begin', '#333') + '</defs>'
}

export function renderShape(e) {
  const { x, y, w, h, angle } = e.props
  const scope = { w, h, x, y, t: w, i: h }
  const elFill = (e.fillStyle?.type === 'none') ? 'none' : (cssColor(e.fillStyle?.color) || '#ffffff')
  const elStroke = (e.lineStyle?.lineWidth === 0) ? 'none' : (cssColor(e.lineStyle?.lineColor) || '#333')
  const elStrokeW = e.lineStyle?.lineWidth ?? 1
  const opacity = e.shapeStyle?.alpha ?? 1

  const bodies = (e.path ?? []).map(sub => {
    let d = ''
    for (const a of sub.actions ?? []) {
      switch (a.action) {
        case 'move': d += `M ${num(a.x, scope)} ${num(a.y, scope)} `; break
        case 'line': d += `L ${num(a.x, scope)} ${num(a.y, scope)} `; break
        case 'curve':
          d += `C ${num(a.x1, scope)} ${num(a.y1, scope)} ${num(a.x2, scope)} ${num(a.y2, scope)} ${num(a.x, scope)} ${num(a.y, scope)} `
          break
        case 'quadraticCurve':
          d += `Q ${num(a.x1, scope)} ${num(a.y1, scope)} ${num(a.x, scope)} ${num(a.y, scope)} `
          break
        case 'rect':
          d += `M ${num(a.x, scope)} ${num(a.y, scope)} h ${num(a.w ?? a.width, scope)} v ${num(a.h ?? a.height, scope)} h ${-num(a.w ?? a.width, scope)} z `
          break
        case 'close': d += 'Z '; break
      }
    }
    if (!d.trim()) return ''
    const fill = sub.fillStyle?.type === 'none' ? 'none' : (cssColor(sub.fillStyle?.color) || elFill)
    const stroke = sub.lineStyle?.lineWidth === 0
      ? 'none'
      : (cssColor(sub.lineStyle?.lineColor) || (sub.lineStyle?.lineWidth != null ? elStroke : elStroke))
    const strokeWidth = sub.lineStyle?.lineWidth ?? elStrokeW
    return `<path d="${d.trim()}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>`
  }).filter(Boolean)

  const transform = `transform="translate(${x} ${y})${angle ? ` rotate(${angle} ${w / 2} ${h / 2})` : ''}"`
  return `<g ${transform} opacity="${opacity}">${bodies.join('')}${renderText(e, scope)}</g>`
}

function renderText(e, scope) {
  const blocks = e.textBlock ?? []
  if (!blocks.length) return ''
  const out = []
  for (const tb of blocks) {
    const text = (tb.text ?? '').trim()
    if (!text) continue
    const pos = tb.position ?? {}
    const x = num(pos.x, scope) + num(pos.w, scope) / 2
    const y = num(pos.y, scope) + num(pos.h, scope) / 2
    const fs = e.fontStyle ?? {}
    const size = fs.size ?? 13
    const anchor = (fs.textAlign === 'left') ? 'start' : (fs.textAlign === 'right') ? 'end' : 'middle'
    const lines = text.split('\n')
    const lh = (fs.lineHeight ?? 1.25) * size
    const dy0 = -(lines.length - 1) * lh / 2
    const tspans = lines.map((ln, i) =>
      `<tspan x="${x}" y="${y}" dy="${(dy0 + i * lh).toFixed(1)}">${esc(ln)}</tspan>`).join('')
    out.push(`<text font-family="${esc(fs.fontFamily ?? '微软雅黑')}" font-size="${size}" fill="${cssColor(fs.color) || '#333'}"` +
      `${fs.bold ? ' font-weight="bold"' : ''}${fs.italic ? ' font-style="italic"' : ''}` +
      ` text-anchor="${anchor}" dominant-baseline="middle">${tspans}</text>`)
  }
  return out.join('')
}

export function renderLinker(e) {
  const pts = [e.from, ...(e.points ?? []), e.to].filter(p => p && p.x != null)
  if (pts.length < 2) return ''
  const ls = e.lineStyle ?? {}
  const stroke = cssColor(ls.lineColor) || '#333'
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const markerEnd = ls.endArrowStyle && ls.endArrowStyle !== 'none' ? ' marker-end="url(#po-arrow-end)"' : ''
  const markerBegin = ls.beginArrowStyle && ls.beginArrowStyle !== 'none' ? ' marker-start="url(#po-arrow-begin)"' : ''
  const line = `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${ls.lineWidth ?? 1}"${markerEnd}${markerBegin}/>`
  let label = ''
  const text = (e.text ?? '').trim()
  if (text && pts.length >= 2) {
    const mid = pts[Math.floor(pts.length / 2)]
    const prev = pts[Math.floor(pts.length / 2) - 1] ?? pts[0]
    const cx = (mid.x + prev.x) / 2, cy = (mid.y + prev.y) / 2
    const fs = e.fontStyle ?? {}
    label = `<text x="${cx}" y="${cy - 6}" text-anchor="middle" font-family="${esc(fs.fontFamily ?? '微软雅黑')}"` +
      ` font-size="${fs.size ?? 13}" fill="${cssColor(fs.color) || '#333'}">${esc(text)}</text>`
  }
  return `<g>${line}${label}</g>`
}

function num(v, scope) {
  return round(evalExpr(v, scope))
}

function round(n) {
  return Math.round(n * 100) / 100
}

function cssColor(c) {
  if (!c || typeof c !== 'string') return null
  const m = c.match(/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*$/)
  if (m) return `rgb(${m[1]},${m[2]},${m[3]})`
  if (c === 'transparent') return 'none'
  return c
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
