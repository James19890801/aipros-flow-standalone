// AIPROS 流程图 — Web 编辑器
// 与 CLI 共享引擎（浏览器直接 import /src 下的纯 JS 模块）

import { createDocument, addNode, addLinker, genId, elementsOf } from '/src/model.js'
import { renderShape, renderLinker, renderSVG } from '/src/render.js'

const $ = s => document.querySelector(s)
const svg = $('#canvas'), view = $('#view')

/* ---------------- 状态 ---------------- */
let doc = null            // { meta, diagram: { elements: { page, elements } } }
let selectedId = null
let connectSource = null  // 连线模式起点
let undoStack = []
const viewState = { x: 0, y: 0, scale: 1 }
let dragging = null, panning = null
let shapesCache = []

/* ---------------- 工具 ---------------- */
function els() { return doc.diagram.elements.elements }
function nodes() { return Object.values(els()).filter(e => e.name !== 'linker') }
function linkers() { return Object.values(els()).filter(e => e.name === 'linker') }
function nodeCount() { return nodes().length }

function toast(msg) {
  const t = $('#toast')
  t.textContent = msg
  t.classList.remove('hidden')
  clearTimeout(t._tm)
  t._tm = setTimeout(() => t.classList.add('hidden'), 2200)
}

function pushUndo() {
  undoStack.push(JSON.stringify(els()))
  if (undoStack.length > 40) undoStack.shift()
}
function undo() {
  if (!undoStack.length) return toast('没有可撤销的操作')
  const snap = undoStack.pop()
  Object.keys(els()).forEach(k => delete els()[k])
  Object.assign(els(), JSON.parse(snap))
  selectedId = null
  render()
  saveLocal()
}

function screen2doc(sx, sy) {
  const r = svg.getBoundingClientRect()
  return { x: (sx - r.left - viewState.x) / viewState.scale, y: (sy - r.top - viewState.y) / viewState.scale }
}
function doc2screen(x, y) {
  const r = svg.getBoundingClientRect()
  return { x: x * viewState.scale + viewState.x + r.left, y: y * viewState.scale + viewState.y + r.top }
}

function applyView() {
  view.setAttribute('transform', `translate(${viewState.x} ${viewState.y}) scale(${viewState.scale})`)
  $('#grid-bg').setAttribute('x', -viewState.x / viewState.scale)
  $('#grid-bg').setAttribute('y', -viewState.y / viewState.scale)
  $('#grid-bg').setAttribute('width', svg.clientWidth / viewState.scale)
  $('#grid-bg').setAttribute('height', svg.clientHeight / viewState.scale)
  $('#zoom-level').textContent = Math.round(viewState.scale * 100) + '%'
}

function zoomAt(factor, cx, cy) {
  const ns = Math.min(3, Math.max(0.25, viewState.scale * factor))
  viewState.x = cx - (cx - viewState.x) * ns / viewState.scale
  viewState.y = cy - (cy - viewState.y) * ns / viewState.scale
  viewState.scale = ns
  applyView()
}

function fitView() {
  const ns = nodes()
  if (!ns.length) { viewState.x = 0; viewState.y = 0; viewState.scale = 1; return applyView() }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const n of ns) {
    x0 = Math.min(x0, n.props.x); y0 = Math.min(y0, n.props.y)
    x1 = Math.max(x1, n.props.x + n.props.w); y1 = Math.max(y1, n.props.y + n.props.h)
  }
  const pad = 80
  const s = Math.min((svg.clientWidth - pad * 2) / (x1 - x0), (svg.clientHeight - pad * 2) / (y1 - y0), 1.5)
  viewState.scale = s
  viewState.x = (svg.clientWidth - (x1 - x0) * s) / 2 - x0 * s
  viewState.y = (svg.clientHeight - (y1 - y0) * s) / 2 - y0 * s
  applyView()
}

/* ---------------- 文档 ---------------- */
function newDoc(title = '未命名文件') {
  doc = createDocument(title)
  selectedId = null
  undoStack = []
}

async function loadShapes(category = '', q = '') {
  const res = await fetch(`/api/shapes?category=${encodeURIComponent(category)}&q=${encodeURIComponent(q)}`)
  const data = await res.json()
  shapesCache = data.shapes
  const list = $('#shape-list')
  list.innerHTML = ''
  for (const s of data.shapes) {
    const item = document.createElement('div')
    item.className = 'shape-item'
    item.dataset.name = s.name
    item.title = s.title
    item.innerHTML = `${s.preview}<span class="shape-label">${s.title}</span>`
    item.addEventListener('click', () => addShapeAtCenter(s))
    list.appendChild(item)
  }
}

async function addShapeAtCenter(s) {
  // 取完整形状定义（含解析后的 path actions），保证官方引擎可渲染
  const def = s.def ?? (await (await fetch(`/api/shape/${encodeURIComponent(s.name)}`)).json()).shape
  pushUndo()
  const c = screen2doc(svg.clientWidth / 2, svg.clientHeight / 2)
  const id = addNode(doc, def, {
    text: '', x: Math.round(c.x - def.props.w / 2), y: Math.round(c.y - def.props.h / 2),
    commands: null, pathFuns: null,
  })
  selectedId = id
  render()
  saveLocal()
  $('#hint').classList.add('hidden')
}

function removeSelected() {
  if (!selectedId) return
  pushUndo()
  const e = els()[selectedId]
  if (e.name === 'linker') {
    delete els()[selectedId]
  } else {
    for (const [k, v] of Object.entries(els())) {
      if (v.name === 'linker' && (v.from?.id === selectedId || v.to?.id === selectedId)) delete els()[k]
    }
    delete els()[selectedId]
  }
  selectedId = null
  render()
  saveLocal()
}

/* ---------------- 连线路由 ---------------- */
function anchorOf(el, side) {
  const { x, y, w, h } = el.props
  switch (side) {
    case 'top': return { x: x + w / 2, y }
    case 'bottom': return { x: x + w / 2, y: y + h }
    case 'left': return { x, y: y + h / 2 }
    case 'right': return { x: x + w, y: y + h / 2 }
  }
}

function routeLinker(l) {
  const from = els()[l.from?.id], to = els()[l.to?.id]
  if (!from || !to) return
  const fc = { x: from.props.x + from.props.w / 2, y: from.props.y + from.props.h / 2 }
  const tc = { x: to.props.x + to.props.w / 2, y: to.props.y + to.props.h / 2 }
  const dx = tc.x - fc.x, dy = tc.y - fc.y
  let sp, tp, points
  if (Math.abs(dy) >= Math.abs(dx)) {
    const fs = dy >= 0 ? 'bottom' : 'top', ts = dy >= 0 ? 'top' : 'bottom'
    sp = anchorOf(from, fs); tp = anchorOf(to, ts)
    const mid = (sp.y + tp.y) / 2
    points = [{ x: sp.x, y: mid }, { x: tp.x, y: mid }]
  } else {
    const fs = dx >= 0 ? 'right' : 'left', ts = dx >= 0 ? 'left' : 'right'
    sp = anchorOf(from, fs); tp = anchorOf(to, ts)
    const mid = (sp.x + tp.x) / 2
    points = [{ x: mid, y: sp.y }, { x: mid, y: tp.y }]
  }
  l.from = { ...l.from, x: Math.round(sp.x), y: Math.round(sp.y) }
  l.to = { ...l.to, x: Math.round(tp.x), y: Math.round(tp.y) }
  l.points = l.points?.length ? l.points : points
  // 手动拖动过的点保留, 否则重新计算
  if (!l._manual) l.points = points
}

/* ---------------- 渲染 ---------------- */
function render() {
  view.innerHTML = ''
  const ls = linkers().map(l => { routeLinker(l); return l })
  for (const l of ls) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('class', 'el-linker' + (selectedId === l.id ? ' selected' : ''))
    g.dataset.id = l.id
    g.innerHTML = renderLinker(l) + `<path class="lk-hit" d="${hitPath(l)}"/>`
    view.appendChild(g)
  }
  const sorted = nodes().sort((a, b) => (a.props?.zindex ?? 0) - (b.props?.zindex ?? 0))
  for (const e of sorted) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.setAttribute('class', 'el-shape' + (selectedId === e.id ? ' selected' : ''))
    g.dataset.id = e.id
    const ring = `<rect class="select-ring" x="${e.props.x - 5}" y="${e.props.y - 5}" width="${e.props.w + 10}" height="${e.props.h + 10}" rx="4"/>`
    g.innerHTML = renderShape(e) + ring
    view.appendChild(g)
  }
  $('#hint').classList.toggle('hidden', nodeCount() > 0)
}

function hitPath(l) {
  const pts = [l.from, ...(l.points ?? []), l.to].filter(p => p && p.x != null)
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}

/* ---------------- 交互 ---------------- */
svg.addEventListener('mousedown', ev => {
  const shapeEl = ev.target.closest('g.el-shape, g.el-linker')
  if (ev.button !== 0) return
  if (!shapeEl) {
    selectedId = null
    panning = { sx: ev.clientX, sy: ev.clientY, vx: viewState.x, vy: viewState.y }
    render()
    return
  }
  const id = shapeEl.dataset.id
  const e = els()[id]
  if (connectSource) {
    if (e.name !== 'linker' && id !== connectSource) {
      pushUndo()
      addLinker(doc, connectSource, id, { text: '' })
      connectSource = null
      svg.classList.remove('linking')
      $('#connect-tip').classList.add('hidden')
      render(); saveLocal()
      return
    }
  }
  selectedId = id
  render()
  if (e.name === 'linker') return
  const start = screen2doc(ev.clientX, ev.clientY)
  dragging = { id, ox: e.props.x - start.x, oy: e.props.y - start.y, moved: false, snapshot: JSON.stringify(els()) }
})

window.addEventListener('mousemove', ev => {
  if (panning) {
    viewState.x = panning.vx + ev.clientX - panning.sx
    viewState.y = panning.vy + ev.clientY - panning.sy
    applyView()
  }
  if (dragging) {
    const e = els()[dragging.id]
    if (!e) return
    const p = screen2doc(ev.clientX, ev.clientY)
    e.props.x = Math.round(p.x + dragging.ox)
    e.props.y = Math.round(p.y + dragging.oy)
    dragging.moved = true
    // 拖动时增量更新, 不整体重绘
    const g = view.querySelector(`g.el-shape[data-id="${dragging.id}"] > g`)
    if (g) g.setAttribute('transform', `translate(${e.props.x} ${e.props.y})`)
    linkers().forEach(l => { if (l.from?.id === dragging.id || l.to?.id === dragging.id) l._manual = false })
    redrawLinkers()
  }
})

window.addEventListener('mouseup', () => {
  if (dragging?.moved) {
    undoStack.push(dragging.snapshot)
    if (undoStack.length > 40) undoStack.shift()
    saveLocal()
  }
  dragging = null
  panning = null
})

svg.addEventListener('dblclick', ev => {
  const shapeEl = ev.target.closest('g.el-shape, g.el-linker')
  if (!shapeEl) return
  openTextEditor(shapeEl.dataset.id)
})

svg.addEventListener('click', ev => {
  const shapeEl = ev.target.closest('g.el-shape')
  if (shapeEl && connectSource === null) {
    // click 已在 mousedown 处理选中
  }
})

svg.addEventListener('wheel', ev => {
  ev.preventDefault()
  if (ev.ctrlKey || ev.metaKey) {
    const r = svg.getBoundingClientRect()
    zoomAt(ev.deltaY < 0 ? 1.1 : 0.9, ev.clientX - r.left, ev.clientY - r.top)
  } else {
    viewState.x -= ev.deltaX
    viewState.y -= ev.deltaY
    applyView()
  }
}, { passive: false })

window.addEventListener('keydown', ev => {
  if (ev.target.matches('input, select, textarea')) return
  if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); removeSelected() }
  if (ev.key === 'Escape') {
    connectSource = null
    svg.classList.remove('linking')
    $('#connect-tip').classList.add('hidden')
    selectedId = null
    render()
  }
  if ((ev.metaKey || ev.ctrlKey) && ev.key === 'z') { ev.preventDefault(); undo() }
  if ((ev.metaKey || ev.ctrlKey) && ev.key === 'l') { ev.preventDefault(); doLayout() }
})

function redrawLinkers() {
  for (const g of view.querySelectorAll('g.el-linker')) {
    const l = els()[g.dataset.id]
    if (!l) continue
    routeLinker(l)
    g.innerHTML = renderLinker(l) + `<path class="lk-hit" d="${hitPath(l)}"/>`
    if (selectedId === l.id) g.classList.add('selected')
  }
}

/* ---------------- 文字编辑 ---------------- */
const textEditor = $('#text-editor')
let editingId = null

function openTextEditor(id) {
  const e = els()[id]
  if (!e) return
  editingId = id
  const isLink = e.name === 'linker'
  const text = isLink ? (e.text ?? '') : (e.textBlock?.[0]?.text ?? '')
  const c = isLink
    ? { x: (e.from.x + e.to.x) / 2, y: (e.from.y + e.to.y) / 2 - 14 }
    : { x: e.props.x + e.props.w / 2, y: e.props.y + e.props.h / 2 }
  const p = doc2screen(c.x, c.y)
  textEditor.value = text
  textEditor.style.left = (p.x - 70) + 'px'
  textEditor.style.top = (p.y - 16) + 'px'
  textEditor.style.width = Math.max(90, (e.props?.w ?? 100) * viewState.scale) + 'px'
  textEditor.classList.remove('hidden')
  textEditor.focus()
  textEditor.select()
}

function commitTextEditor() {
  if (!editingId) return
  const e = els()[editingId]
  if (e) {
    pushUndo()
    if (e.name === 'linker') e.text = textEditor.value
    else if (e.textBlock?.length) e.textBlock[0].text = textEditor.value
    saveLocal()
  }
  editingId = null
  textEditor.classList.add('hidden')
  render()
}

textEditor.addEventListener('keydown', ev => {
  if (ev.key === 'Enter') { ev.preventDefault(); commitTextEditor() }
  if (ev.key === 'Escape') { editingId = null; textEditor.classList.add('hidden') }
})
textEditor.addEventListener('blur', commitTextEditor)

/* ---------------- 自动布局 ---------------- */
async function doLayout() {
  if (!nodeCount()) return toast('画布为空')
  const r = svg.getBoundingClientRect()
  r  // no-op
  const body = {
    nodes: nodes().map(n => ({ id: n.id, w: n.props.w, h: n.props.h })),
    edges: linkers().filter(l => l.from?.id && l.to?.id).map(l => ({ id: l.id, from: l.from.id, to: l.to.id })),
  }
  pushUndo()
  const res = await fetch('/api/layout', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  const data = await res.json()
  if (data.error) return toast('布局失败: ' + data.error)
  for (const n of data.nodes) {
    const e = els()[n.id]
    if (e) { e.props.x = n.x; e.props.y = n.y }
  }
  for (const ed of data.edges) {
    const l = els()[ed.id]
    if (l) {
      l._manual = true
      l.points = ed.points
      if (ed.start) Object.assign(l.from, ed.start)
      if (ed.end) Object.assign(l.to, ed.end)
    }
  }
  // 边界归零（ELK 坐标从 0 开始）
  let x0 = Infinity, y0 = Infinity
  for (const n of nodes()) { x0 = Math.min(x0, n.props.x); y0 = Math.min(y0, n.props.y) }
  if (isFinite(x0)) for (const n of nodes()) { n.props.x -= x0 - 40; n.props.y -= y0 - 40 }
  render()
  fitView()
  saveLocal()
  toast(`自动布局完成: ${data.nodes.length} 节点 / ${data.edges.length} 连线`)
}

/* ---------------- 导入导出 ---------------- */
function download(blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

async function exportSVG() {
  if (!nodeCount()) return toast('画布为空')
  const svgStr = renderSVG(doc, { grid: false })
  download(new Blob([svgStr], { type: 'image/svg+xml' }), titleSafe() + '.svg')
  toast('已导出 SVG')
}

async function exportPosf() {
  const res = await fetch('/api/export', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doc }),
  })
  if (!res.ok) return toast('导出失败')
  const buf = await res.arrayBuffer()
  download(new Blob([buf], { type: 'application/octet-stream' }), titleSafe() + '.posf')
  toast('已导出 .posf（可用官方桌面客户端打开）')
}

function importPosf(file) {
  file.arrayBuffer().then(async buf => {
    const res = await fetch('/api/import', {
      method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: buf,
    })
    const data = await res.json()
    if (data.error) return toast('导入失败: ' + data.error)
    doc = data.doc
    doc.meta = data.meta ?? doc.meta
    $('#doc-title').value = doc.meta?.diagramInfo?.title ?? '未命名文件'
    selectedId = null
    undoStack = []
    render()
    fitView()
    saveLocal()
    toast(`已导入: ${nodeCount()} 节点`)
  })
}

async function saveToServer() {
  doc.meta.diagramInfo.title = $('#doc-title').value
  const res = await fetch('/api/docs', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: titleSafe(), doc }),
  })
  const data = await res.json()
  data.error ? toast('保存失败: ' + data.error) : toast(`已保存到服务器: ${data.name}`)
}

async function openModal() {
  const res = await fetch('/api/docs')
  const data = await res.json()
  const list = $('#doc-list')
  list.innerHTML = ''
  if (!data.docs.length) list.innerHTML = '<div class="doc-empty">服务器上还没有文档，先保存一个吧</div>'
  for (const d of data.docs) {
    const row = document.createElement('div')
    row.className = 'doc-row'
    row.innerHTML = `<span class="doc-name">${d.name}</span><span class="doc-time">.posf</span>`
    row.addEventListener('click', async () => {
      const r = await fetch(`/api/docs/${encodeURIComponent(d.name)}`)
      const data = await r.json()
      if (data.error) return toast('打开失败')
      doc = data.doc
      $('#doc-title').value = doc.meta?.diagramInfo?.title ?? d.name
      selectedId = null; undoStack = []
      render(); fitView(); saveLocal()
      $('#modal-backdrop').classList.add('hidden')
      toast(`已打开: ${d.name}`)
    })
    list.appendChild(row)
  }
  $('#modal-backdrop').classList.remove('hidden')
}

function titleSafe() {
  const t = $('#doc-title').value.trim() || '未命名文件'
  return t.replace(/[^\w\u4e00-\u9fff-]/g, '_')
}

/* ---------------- 本地自动保存 ---------------- */
let saveTm
function saveLocal() {
  clearTimeout(saveTm)
  saveTm = setTimeout(() => {
    try {
      localStorage.setItem('aipros-flow-doc', JSON.stringify({ doc, title: $('#doc-title').value }))
    } catch { /* 忽略配额错误 */ }
  }, 400)
}

/* ---------------- 工具栏绑定 ---------------- */
$('#btn-layout').addEventListener('click', doLayout)
$('#btn-export-svg').addEventListener('click', exportSVG)
$('#btn-export-posf').addEventListener('click', exportPosf)
$('#btn-save').addEventListener('click', saveToServer)
$('#btn-open').addEventListener('click', openModal)
$('#btn-undo').addEventListener('click', undo)
$('#modal-close').addEventListener('click', () => $('#modal-backdrop').classList.add('hidden'))
$('#btn-clear').addEventListener('click', () => {
  if (!nodeCount()) return
  if (!confirm('清空画布？此操作可撤销')) return
  pushUndo()
  Object.keys(els()).forEach(k => delete els()[k])
  selectedId = null
  render(); saveLocal()
})
$('#btn-import').addEventListener('click', () => $('#file-input').click())
$('#file-input').addEventListener('change', ev => {
  if (ev.target.files[0]) importPosf(ev.target.files[0])
  ev.target.value = ''
})
$('#zoom-in').addEventListener('click', () => zoomAt(1.2, svg.clientWidth / 2, svg.clientHeight / 2))
$('#zoom-out').addEventListener('click', () => zoomAt(0.83, svg.clientWidth / 2, svg.clientHeight / 2))
$('#zoom-fit').addEventListener('click', fitView)
$('#doc-title').addEventListener('input', saveLocal)

let searchTm
$('#shape-search').addEventListener('input', () => {
  clearTimeout(searchTm)
  searchTm = setTimeout(() => loadShapes($('#shape-category').value, $('#shape-search').value), 250)
})
$('#shape-category').addEventListener('change', () => loadShapes($('#shape-category').value, $('#shape-search').value))

// 连线模式: Alt+点击节点 或 按住 L 后点击
let linkMode = false
window.addEventListener('keydown', ev => { if (ev.key === 'l' && !ev.target.matches('input')) linkMode = true })
window.addEventListener('keyup', ev => { if (ev.key === 'l') linkMode = false })
svg.addEventListener('mousedown', ev => {
  if (ev.altKey) {
    const shapeEl = ev.target.closest('g.el-shape')
    if (shapeEl) {
      ev.preventDefault()
      connectSource = shapeEl.dataset.id
      svg.classList.add('linking')
      $('#connect-tip').classList.remove('hidden')
    }
  }
}, true)

/* ---------------- 启动 ---------------- */
async function boot() {
  // 分类下拉
  try {
    const res = await fetch('/api/categories')
    const data = await res.json()
    const sel = $('#shape-category')
    for (const c of data.categories.slice(0, 60)) {
      const opt = document.createElement('option')
      opt.value = c.name
      opt.textContent = `${c.text || c.name} (${c.count})`
      sel.appendChild(opt)
    }
  } catch { /* 分类加载失败不影响使用 */ }

  // 恢复本地草稿
  let restored = false
  try {
    const raw = localStorage.getItem('aipros-flow-doc')
    if (raw) {
      const saved = JSON.parse(raw)
      if (saved?.doc?.diagram?.elements) {
        doc = saved.doc
        $('#doc-title').value = saved.title || '未命名文件'
        restored = true
      }
    }
  } catch { /* 损坏的草稿直接丢弃 */ }
  if (!restored) newDoc()
  await loadShapes()
  render()
  applyView()
}

boot()
