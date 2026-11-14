const {spawn}=require('node:child_process')
const readline=require('node:readline')
const path=require('node:path')
function runAgent({cwd,model,env,prompt,images=[],onEvent,timeoutMs=120000}){
 const child=spawn('codex',['app-server'],{cwd,env,stdio:['pipe','pipe','pipe']})
 let threadId,finished=false,lastText='',visibleIds=new Set(),lastDeltas=new Map(),stderr=''
 const send=(method,id,params)=>child.stdin.write(JSON.stringify({method,id,params})+'\n')
 let resolveResult;const result=new Promise(resolve=>{resolveResult=resolve})
 const finish=(ok,error)=>{if(finished)return;finished=true;clearTimeout(timer);resolveResult({ok,text:lastText,error});child.kill()}
 const timer=setTimeout(()=>finish(false,'智能体响应超时'),timeoutMs)
 child.on('error',()=>finish(false,'无法启动 Codex CLI'))
 child.on('close',()=>finish(false,'Codex 进程意外退出'))
 child.stderr.on('data',c=>{stderr=(stderr+c).slice(-4096)})
 readline.createInterface({input:child.stdout}).on('line',line=>{
  let e;try{e=JSON.parse(line)}catch{return}
  if(e.id&&e.error)return finish(false,'智能体接口错误：'+(e.error.message||'未知错误'))
  if(e.id===1){send('thread/start',2,{cwd,model:model||null,sandbox:'read-only',approvalPolicy:'never',ephemeral:true});return}
  if(e.id===2){threadId=e.result?.thread?.id;if(!threadId)return finish(false,'智能体会话创建失败');const input=[{type:'skill',name:'aipros-flowchart',path:path.join(cwd,'skills/aipros-flowchart/SKILL.md')},{type:'text',text:prompt},...images.map(url=>({type:'image',url}))];send('turn/start',3,{threadId,input});onEvent({type:'status',text:'已连接智能体，正在分析材料…'});return}
  if(e.method==='item/agentMessage/delta'){const id=e.params.itemId,delta=e.params.delta||'';lastDeltas.set(id,(lastDeltas.get(id)||'')+delta);visibleIds.add(id);onEvent({type:'delta',id,text:delta});return}
  if(e.method==='item/completed'&&e.params?.item?.type==='agentMessage'){const item=e.params.item;lastText=item.text||lastDeltas.get(item.id)||'';onEvent({type:'message',id:item.id,text:lastText,hadDelta:visibleIds.has(item.id)});return}
  if(e.method==='turn/completed'){const t=e.params?.turn;if(t?.status==='completed'&&lastText)finish(true);else finish(false,t?.error?.message||'智能体未完成任务')}
 })
 send('initialize',1,{clientInfo:{name:'aipros-flow-bridge',version:'1.0'}})
 return {result,cancel:()=>finish(false,'已取消')}
}
module.exports={runAgent}
