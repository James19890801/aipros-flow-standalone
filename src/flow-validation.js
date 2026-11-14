export function validateFlow(f) {
  const errors=[]
  if (!f || typeof f !== 'object') return ['需要流程对象']
  if (typeof f.title !== 'string' || !f.title.trim()) errors.push('缺少标题')
  if (!Array.isArray(f.lanes) || !f.lanes.length || f.lanes.length > 20 || !Array.isArray(f.nodes) || !f.nodes.length || f.nodes.length > 100 || !Array.isArray(f.edges) || f.edges.length > 200) return [...errors,'泳道、节点或连线格式不正确']
  const lanes=new Set(), laneNames=new Set(), nodes=new Map()
  for (const l of f.lanes) { if (!l?.id || !l?.name || lanes.has(l.id) || laneNames.has(l.name)) errors.push('泳道名称或 ID 无效'); else { lanes.add(l.id); laneNames.add(l.name) } }
  for (const n of f.nodes) { if (!n?.id || nodes.has(n.id) || !lanes.has(n.laneId) || !['start','activity','decision','end','parallel_split','parallel_join'].includes(n.type) || !n.label) errors.push('节点无效'); else nodes.set(n.id,n) }
  if (![...nodes.values()].some(n=>n.type==='start') || ![...nodes.values()].some(n=>n.type==='end')) errors.push('缺少起点或终点')
  const terminals=[...nodes.values()].filter(n=>n.type==='start'||n.type==='end')
  if (terminals.some(n=>n.type==='start') && terminals.some(n=>n.type==='end') && new Set(terminals.map(n=>n.laneId)).size>1) errors.push('开始节点和结束节点必须位于同一泳道')
  for (const e of f.edges) if (!nodes.has(e?.from)||!nodes.has(e?.to)||e.from===e.to || (e.kind && !['forward','return'].includes(e.kind))) errors.push('连线引用或类型无效')
  if(errors.some(e=>['节点无效','连线引用或类型无效'].includes(e)))return [...new Set(errors)]
  const forward=f.edges.filter(e=>e.kind!=='return'), returning=f.edges.filter(e=>e.kind==='return')
  const out=id=>forward.filter(e=>e.from===id), incoming=id=>forward.filter(e=>e.to===id)
  const reaches=(from,to,stop)=>{const seen=new Set([from]),q=[from];while(q.length){const id=q.shift();if(id===to)return true;if(id===stop)continue;for(const e of out(id))if(!seen.has(e.to)){seen.add(e.to);q.push(e.to)}}return false}
  for(const n of nodes.values()) {
    const total=f.edges.filter(e=>e.from===n.id)
    if(n.type==='decision' && (total.length<2 || total.some(e=>!e.label))) errors.push('判断节点需要至少两个标注分支')
    if(!['decision','parallel_split'].includes(n.type) && total.length>1) errors.push('普通节点不能隐式拆分并行或多分支')
    if(n.type==='parallel_split' && (out(n.id).length<2 || incoming(n.id).length!==1)) errors.push('并行拆分需要一个入口和至少两个前向分支')
    if(n.type==='parallel_join' && (incoming(n.id).length<2 || out(n.id).length!==1)) errors.push('并行汇合需要至少两个入口和一个出口')
  }
  const starts=[...nodes.values()].filter(n=>n.type==='start').map(n=>n.id)
  for(const id of nodes.keys()) if(!starts.some(s=>reaches(s,id)))errors.push('存在无法从起点经前向流程到达的节点')
  const degree=new Map([...nodes.keys()].map(k=>[k,0]));for(const e of forward)degree.set(e.to,degree.get(e.to)+1)
  const ready=[...degree].filter(([,v])=>!v).map(([k])=>k);let count=0
  while(ready.length){const id=ready.shift();count++;for(const e of out(id)){degree.set(e.to,degree.get(e.to)-1);if(!degree.get(e.to))ready.push(e.to)}}
  if(count!==nodes.size)errors.push('前向流程存在循环，请明确标记退回线')
  for(const e of returning)if(!e.label || !reaches(e.to,e.from))errors.push('退回线必须有名称且指向前序节点')
  const allPathsReach=(from,target)=>{const memo=new Map(),visiting=new Set();function visit(id){if(id===target)return true;if(memo.has(id))return memo.get(id);if(visiting.has(id))return false;const steps=out(id);if(!steps.length)return false;visiting.add(id);const ok=steps.every(e=>visit(e.to));visiting.delete(id);memo.set(id,ok);return ok}return visit(from)}
  const splits=[...nodes.values()].filter(n=>n.type==='parallel_split'), joins=[...nodes.values()].filter(n=>n.type==='parallel_join')
  const paired=new Map()
  for(const split of splits){const branches=out(split.id);const matches=joins.filter(j=>branches.length>=2 && branches.every(b=>allPathsReach(b.to,j.id)));const nearest=matches.filter(j=>!matches.some(other=>other.id!==j.id && reaches(other.id,j.id)));if(nearest.length!==1)errors.push('并行拆分必须对应唯一的汇合网关');else if(paired.has(nearest[0].id))errors.push('并行汇合不能同时匹配多个拆分');else paired.set(nearest[0].id,split.id)}
  for(const join of joins)if(!paired.has(join.id))errors.push('并行汇合缺少对应拆分网关')
  return [...new Set(errors)]
}
