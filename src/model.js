// AIPROS 流程图 — 文档模型与元素构造

import { resolveShapePath } from './shapepath.js'

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export function genId() {
  let s = ''
  for (let i = 0; i < 14; i++) s += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
  return s
}

export function createDocument(title = '未命名文件') {
  const id = genId()
  return {
    meta: {
      pages: [{ canvasId: id, definitionId: id, title: '画布1', sort: 0 }],
      mainCanvasId: id,
      exportTime: null,
      member: '',
      diagramInfo: { creator: '', created: null, modified: null, title, category: 'flow' },
      id,
      type: 'AIPROS Schema File',
      version: '5.0',
    },
    diagram: {
      elements: {
        page: {
          backgroundColor: 'transparent', width: 946, height: 639,
          padding: 20, showGrid: true, gridSize: 15,
          orientation: 'portrait', lineJumps: false,
        },
        elements: {},
        comments: [],
        plugins: {},
        theme: {},
      },
    },
  }
}

export function elementsOf(doc) {
  return doc.diagram.elements.elements
}

export function pageOf(doc) {
  return doc.diagram.elements.page
}

export function maxZIndex(doc) {
  const els = elementsOf(doc)
  let z = 0
  for (const e of Object.values(els)) if (e.props?.zindex > z) z = e.props.zindex
  return z
}

const SHAPE_DEFAULTS = {
  props: { x: 0, y: 0, w: 120, h: 80, zindex: 0, angle: 0 },
  shapeStyle: { alpha: 1 },
  lineStyle: { lineWidth: 1, rounding: 4, lineColor: '0,0,0', lineStyle: 'solid' },
  fillStyle: { type: 'solid', color: '255,255,255' },
  fontStyle: {
    fontFamily: '微软雅黑', size: 13, lineHeight: 1.25, color: '50,50,50',
    bold: false, italic: false, underline: false,
    textAlign: 'center', vAlign: 'middle', orientation: 'vertical',
  },
  textBlock: [{ position: { x: 10, y: 0, w: 'w-20', h: 'h' }, text: '' }],
  anchors: [{ x: 'w/2', y: '0' }, { x: 'w/2', y: 'h' }, { x: '0', y: 'h/2' }, { x: 'w', y: 'h/2' }],
}

export function addNode(doc, shape, { text, x = 0, y = 0, w, h, id, commands, pathFuns } = {}) {
  const els = elementsOf(doc)
  const finalW = w ?? shape.props?.w ?? SHAPE_DEFAULTS.props.w
  const finalH = h ?? shape.props?.h ?? SHAPE_DEFAULTS.props.h
  const path = commands || pathFuns
    ? resolveShapePath(shape, commands, pathFuns, finalW, finalH)
    : (shape.path ?? []).map(p => ({ ...p, actions: Array.isArray(p.actions) ? p.actions.map(a => ({ ...a })) : p.actions }))
  const textBlock = (shape.textBlock ?? SHAPE_DEFAULTS.textBlock).map(tb => ({
    position: { ...tb.position },
    text: text != null ? text : (tb.text ?? ''),
  }))
  const element = {
    id: id || genId(),
    name: shape.name,
    category: shape.category || 'basic',
    parent: '',
    link: '',
    group: '',
    children: [],
    props: {
      x, y,
      w: finalW,
      h: finalH,
      zindex: maxZIndex(doc) + 1,
      angle: 0,
    },
    shapeStyle: { ...SHAPE_DEFAULTS.shapeStyle, ...(shape.shapeStyle ?? {}) },
    textBlock,
    anchors: (shape.anchors ?? SHAPE_DEFAULTS.anchors).map(a => ({ ...a })),
    fontStyle: { ...SHAPE_DEFAULTS.fontStyle, ...(shape.fontStyle ?? {}) },
    fillStyle: shape.fillStyle ? { ...shape.fillStyle } : {},
    lineStyle: { lineWidth: 1.5, rounding: SHAPE_DEFAULTS.lineStyle.rounding, ...(shape.lineStyle ?? {}) },
    path,
    dataAttributes: [],
    resizeDir: shape.resizeDir ?? ['tl', 'tr', 'br', 'bl', 'l', 't', 'r', 'b'],
    attribute: {
      container: false, rotatable: true, visible: true, fixedLink: false,
      collapsable: false, collapsed: false, linkable: true, markerOffset: 5,
      ...(shape.attribute ?? {}),
    },
    theme: {},
    locked: false,
  }
  els[element.id] = element
  return element.id
}

export function addLinker(doc, fromId, toId, { text = '', linkerType = 'broken', lineStyle } = {}) {
  const els = elementsOf(doc)
  const from = els[fromId]
  const to = els[toId]
  if (!from || !to) throw new Error(`节点不存在: ${!from ? fromId : toId}`)
  const element = {
    id: genId(),
    name: 'linker',
    from: { id: fromId, ...shapeAnchorPoint(from, 'bottom') },
    to: { id: toId, ...shapeAnchorPoint(to, 'top') },
    points: [],
    text,
    linkerType,
    props: { zindex: 0 },
    lineStyle: {
      lineWidth: 1, rounding: 4, lineColor: '0,0,0', lineStyle: 'solid',
      beginArrowStyle: 'none', endArrowStyle: 'solidArrow',
      ...(lineStyle ?? {}),
    },
    fontStyle: {
      fontFamily: '微软雅黑', size: 13, color: '50,50,50',
      bold: false, italic: false, underline: false, textAlign: 'center',
    },
    dataAttributes: [],
    parent: '', group: '',
    locked: false,
  }
  els[element.id] = element
  return element.id
}

export function shapeAnchorPoint(el, side) {
  const { x, y, w, h } = el.props
  switch (side) {
    case 'top': return { x: x + w / 2, y }
    case 'bottom': return { x: x + w / 2, y: y + h }
    case 'left': return { x, y: y + h / 2 }
    case 'right': return { x: x + w, y: y + h / 2 }
    default: return { x: x + w / 2, y: y + h / 2 }
  }
}
