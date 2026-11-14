import { resolveShapePath } from './catalog.js'
import { genId, createDocument, elementsOf } from './model.js'
import { validateFlow } from './flow-validation.js'
import { validateSwimlaneGeometry } from './swimlane-quality.js'
export function generateSwimlane(flow, catalog) {
 const errors=validateFlow(flow); if(errors.length) throw new Error(errors.join('；'))
 const shapeDef=name=>catalog.shapes.get(name)
const POOL_X = 80, POOL_Y = 110
const POOL_HEADER = 40
const LANE_HEADER = 30
const returnMultiplicity = new Map()
for(const edge of flow.edges.filter(e=>e.kind==='return')) returnMultiplicity.set(edge.to,(returnMultiplicity.get(edge.to)||0)+1)
const LANE_H = 130 + Math.max(0,...returnMultiplicity.values())*60 - (returnMultiplicity.size?60:0)
const COL_PITCH = 280
const NODE_W = 140, NODE_H = 50
const DEC_W = 120, DEC_H = 80
const TERM_W = 130, TERM_H = 46
const TITLE_H = 60


 const LANES=flow.lanes.map(l=>l.name), N_COL=flow.nodes.length
 const POOL_W=POOL_HEADER+LANE_HEADER+N_COL*COL_PITCH+60, POOL_H=LANES.length*LANE_H
 const colX=c=>POOL_X+POOL_HEADER+LANE_HEADER+20+c*COL_PITCH
 const doc=createDocument(flow.title), els=elementsOf(doc), page=doc.diagram.elements.page
 page.width=POOL_W+160; page.height=POOL_H+POOL_Y+TITLE_H+180; page.showGrid=false
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


 makeElement(shapeDef('text'),{x:POOL_X+POOL_W/2-260,y:30,w:520,h:50,text:flow.title,font:{size:22,bold:true}})
 const pool=makeElement(shapeDef('horizontalPool'),{x:POOL_X,y:POOL_Y,w:POOL_W,h:POOL_H,text:flow.title,extraProps:{height:[POOL_HEADER]}})
 pool.attribute={...pool.attribute,container:true,rotatable:false,linkable:false}
 const laneByName={}
 LANES.forEach((title,i)=>{const lane=makeElement(shapeDef('horizontalLane'),{x:POOL_X+POOL_HEADER,y:POOL_Y+i*LANE_H,w:POOL_W-POOL_HEADER,h:LANE_H,text:title,parent:pool.id,container:pool.id,extraProps:{height:[LANE_HEADER]}}); lane.attribute={...lane.attribute,container:true,rotatable:false,linkable:false};pool.children.push(lane.id);laneByName[title]=lane})
function node(laneTitle, c, kind, text, opts = {}) {
  const laneIdx = LANES.indexOf(laneTitle)
  const def = shapeDef(kind)
  const w = opts.w ?? (kind === 'parallelGateway' ? 50 : kind === 'decision' ? DEC_W : kind === 'terminator' ? TERM_W : NODE_W)
  const h = opts.h ?? (kind === 'decision' ? DEC_H : kind === 'terminator' ? TERM_H : NODE_H)
  const x = colX(c) + (COL_PITCH - 30 - w) / 2
  const y = POOL_Y + laneIdx * LANE_H + (LANE_H - h) / 2
  const el = makeElement(def, { x, y, w, h, text, container: laneByName[laneTitle].id, parent: laneByName[laneTitle].id, fill: opts.fill })
  el._col = c
  laneByName[laneTitle].children.push(el.id)
  return el
}

const LINKS = []
const returnInputs = new Map()
const returnCounts = returnMultiplicity
function link(from,to,{text='',kind='forward'}={}) { LINKS.push({from,to,text,kind}) }
function returnMarkers(from,to,edge,index) {
  const key='R'+(index+1), size=24, offset=40
  const existing=returnInputs.get(edge.to)||[], count=returnCounts.get(edge.to)
  function marker(parent,role,x) {
    const shift=role==='out'?-40:count===1?0:(existing.length-(count-1)/2)*60
    const y=Math.round(parent.props.y+parent.props.h/2-size/2+shift)
    const shape=makeElement(shapeDef('triangle'),{x,y,w:size,h:size,text:'',parent:parent.parent,container:parent.container,extraProps:{angle:Math.PI/2}})
    shape.returnMarker={key,role,from:edge.from,to:edge.to,label:edge.label||'退回'}
    const lane=els[parent.container]; if(lane?.children)lane.children.push(shape.id)
    makeElement(shapeDef('text'),{x:role==='out'?x+size+5:x-90,y:role==='out'?y-5:shift>0?y+size+2:y-29,w:role==='out'?260:204,h:22,text:role==='out'?key+' '+(edge.label||'退回')+' → '+(flow.nodes.find(n=>n.id===edge.to)?.label||'前序步骤'):key+' 退回接入',font:{size:11,color:'71,85,105',textAlign:role==='out'?'left':'center'}})
    return shape
  }
  const out=marker(from,'out',from.props.x+from.props.w+offset)
  const input=marker(to,'in',to.props.x-(count===1?offset:90)-size)
  returnInputs.set(edge.to,[...existing,input])
  link(from,out,{kind:'return_stub'})
  link(input,to,{kind:'return_stub'})
}
function routeLinks(){
  // Prioritise short return stubs; test straight paths before 2- and 4-bend paths.
  const ordered=[...LINKS].sort((a,b)=>((a.kind==='return_stub'?-1:0)-(b.kind==='return_stub'?-1:0)) || ((b.to.props.x-b.from.props.x)-(a.to.props.x-a.from.props.x)))
  for(const l of ordered){
    const p1={x:Math.round(l.from.props.x+l.from.props.w),y:Math.round(l.from.props.y+l.from.props.h/2)}
    const p2={x:Math.round(l.to.props.x),y:Math.round(l.to.props.y+l.to.props.h/2)}
    if(p2.x<=p1.x)throw new Error('泳道图规范校验未通过：连线无法保持左进右出')
    const el={id:genId(),name:'linker',from:{id:l.from.id,...p1,angle:0},to:{id:l.to.id,...p2,angle:Math.PI},points:[],text:l.text,linkerType:'normal',props:{zindex:5},lineStyle:{lineWidth:1,rounding:0,lineColor:'71,85,105',lineStyle:'solid',beginArrowStyle:'none',endArrowStyle:'solidArrow'},fontStyle:{fontFamily:'微软雅黑',size:12,color:'100,116,139',bold:false,italic:false,underline:false,textAlign:'center'},dataAttributes:[],parent:'',group:'',locked:false}
    els[el.id]=el
    const candidates=[]
    if(p1.y===p2.y)candidates.push([])
    const gap=p2.x-p1.x
    for(const fraction of [0.5,0.25,0.75,0.1,0.9]) {const x=Math.round(p1.x+gap*fraction); if(x>p1.x&&x<p2.x)candidates.push([{x,y:p1.y},{x,y:p2.y}])}
    const ys=[POOL_Y-20,POOL_Y+POOL_H+20,...Array.from({length:LANES.length-1},(_,i)=>POOL_Y+(i+1)*LANE_H)]
    for(const y of ys)for(const off of [10,18,26,34]) {const x1=p1.x+off,x2=p2.x-off;if(x1<x2)candidates.push([{x:x1,y:p1.y},{x:x1,y},{x:x2,y},{x:x2,y:p2.y}])}
    let found=false
    for(const points of candidates){
      // Opposite-side inputs must merge at distinct x positions: otherwise their
      // vertical segments form a visual cross on the shared incoming line.
      if(l.from.returnMarker?.role==='in'&&points.length){const mergeX=points.at(-1).x;const occupied=Object.values(els).some(other=>other.name==='linker'&&other.id!==el.id&&other.to.id===el.to.id&&els[other.from.id]?.returnMarker?.role==='in'&&other.points?.length&&other.points.at(-1).x===mergeX);if(occupied)continue}
      el.points=points;el.linkerType=points.length?'broken':'normal';if(!validateSwimlaneGeometry(doc).length){found=true;break}
    }
    if(!found)throw new Error('泳道图规范校验未通过：无法生成不交叉且中心进出的连线：'+(l.from.textBlock?.[0]?.text||l.from.returnMarker?.key)+'→'+(l.to.textBlock?.[0]?.text||l.to.returnMarker?.key)+' ('+validateSwimlaneGeometry(doc).join(',')+')')
  }
}


 const forward=flow.edges.filter(e=>e.kind!=='return')
 const degree=new Map(flow.nodes.map(n=>[n.id,0])); for(const e of forward) degree.set(e.to,degree.get(e.to)+1)
 const ready=flow.nodes.filter(n=>degree.get(n.id)===0), sorted=[]
 while(ready.length){const n=ready.shift();sorted.push(n);for(const e of forward.filter(e=>e.from===n.id)){degree.set(e.to,degree.get(e.to)-1);if(degree.get(e.to)===0) ready.push(flow.nodes.find(x=>x.id===e.to))}}
 const map=new Map(); sorted.forEach((n,i)=>{const lane=flow.lanes.find(l=>l.id===n.laneId);map.set(n.id,node(lane.name,i,n.type==='decision'?'decision':n.type==='activity'?'process':n.type.startsWith('parallel_')?'parallelGateway':'terminator',n.label))})
 let returnIndex=0;for(const e of flow.edges.filter(e=>e.kind==='return')) returnMarkers(map.get(e.from),map.get(e.to),e,returnIndex++);for(const e of forward) {const inputs=returnInputs.get(e.to);link(map.get(e.from),inputs?.length===1?inputs[0]:map.get(e.to),{text:e.label||''})}routeLinks(); const quality=validateSwimlaneGeometry(doc); if(quality.length) throw new Error('泳道图规范校验未通过：'+quality.join('；')); return doc
}
