// Enforce center ports, non-overlapping shapes and non-crossing orthogonal routes.
export function validateSwimlaneGeometry(doc) {
  const byId=doc.diagram.elements.elements, all=Object.values(byId)
  const nodes=all.filter(e=>!['linker','horizontalPool','horizontalLane','text'].includes(e.name))
  const links=all.filter(e=>e.name==='linker'), errors=new Set(), segments=[]
  for(const link of links){
    const a=byId[link.from?.id], b=byId[link.to?.id]
    if(!a||!b || link.from.x!==a.props.x+a.props.w || link.to.x!==b.props.x){errors.add('连线必须右出左入');continue}
    if(link.from.y!==Math.round(a.props.y+a.props.h/2)||link.to.y!==Math.round(b.props.y+b.props.h/2))errors.add('连线必须从左右中心进出')
    const pts=[link.from,...(link.points||[]),link.to]
    const first=pts.find((p,i)=>i>0&&(p.x!==pts[0].x||p.y!==pts[0].y))
    const last=[...pts].reverse().find((p,i)=>i>0&&(p.x!==link.to.x||p.y!==link.to.y))
    if(!first||!last||first.y!==link.from.y||first.x<=link.from.x||last.y!==link.to.y||last.x>=link.to.x)errors.add('连线必须从左右中心水平出入')
    for(let i=0;i<pts.length-1;i++){
      const p=pts[i],q=pts[i+1]; if(p.x===q.x&&p.y===q.y)continue
      if(p.x!==q.x && p.y!==q.y){errors.add('连线必须为正交线');continue}
      segments.push({p,q,link,index:i,last:pts.length-2})
      for(const node of nodes){const r=node.props, inset=2
        if(p.x===q.x && p.x>r.x+inset && p.x<r.x+r.w-inset && Math.min(p.y,q.y)<r.y+r.h-inset && Math.max(p.y,q.y)>r.y+inset) errors.add('连线穿过活动')
        if(p.y===q.y && p.y>r.y+inset && p.y<r.y+r.h-inset && Math.min(p.x,q.x)<r.x+r.w-inset && Math.max(p.x,q.x)>r.x+inset) errors.add('连线穿过活动')
      }
    }
  }
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i].props,b=nodes[j].props;if(a.x<b.x+b.w && b.x<a.x+a.w && a.y<b.y+b.h && b.y<a.y+a.h) errors.add('活动重叠')}
  const between=(v,a,b)=>v>=Math.min(a,b)&&v<=Math.max(a,b)
  for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
    const a=segments[i],b=segments[j];if(a.link.id===b.link.id)continue
    const ah=a.p.y===a.q.y,bh=b.p.y===b.q.y
    const sharedStart=a.index===0&&b.index===0&&a.link.from.id===b.link.from.id
    const sharedEnd=a.index===a.last&&b.index===b.last&&a.link.to.id===b.link.to.id
    if(ah===bh){const same=ah?a.p.y===b.p.y:a.p.x===b.p.x;if(!same)continue;const a0=ah?a.p.x:a.p.y,a1=ah?a.q.x:a.q.y,b0=ah?b.p.x:b.p.y,b1=ah?b.q.x:b.q.y;const overlap=Math.min(Math.max(a0,a1),Math.max(b0,b1))-Math.max(Math.min(a0,a1),Math.min(b0,b1));if(overlap>0&&!sharedStart&&!sharedEnd)errors.add(ah?'连线水平重叠':'连线竖线重叠');continue}
    const h=ah?a:b,v=ah?b:a;if(!between(v.p.x,h.p.x,h.q.x)||!between(h.p.y,v.p.y,v.q.y))continue
    const x=v.p.x,y=h.p.y;const common=(a.link.from.id===b.link.from.id&&x===a.link.from.x&&y===a.link.from.y)||(a.link.to.id===b.link.to.id&&x===a.link.to.x&&y===a.link.to.y)
    const branch=(h.link.from.id===v.link.from.id && h.index===0 && v.index===1 && x===v.p.x && y===v.p.y)
    const merge=(h.link.to.id===v.link.to.id && h.index===h.last && v.index===v.last-1 && x===v.q.x && y===v.q.y)
    if(!common && !branch && !merge)errors.add('连线交叉')
  }
  return [...errors]
}
