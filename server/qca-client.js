// Qoder Managed API adapter. Credentials never leave this backend.
import { createQcaTokenProvider } from './qca-token.js'
const BASES = { global:'https://api.qoder.com/api/v1/cloud', cn:'https://api.qoder.com.cn/api/v1/cloud' }
const getAccessToken=createQcaTokenProvider()
export async function getQcaSkillVersion({config,skillId,fetchImpl=fetch,tokenProvider=getAccessToken,signal}){
 const base=BASES[config?.region]
 if(!base||!config.token||typeof skillId!=='string'||!/^skill_[\w-]{1,120}$/.test(skillId))throw Error('QCA 技能配置无效')
 try{
  const token=await tokenProvider(config)
  const response=await fetchImpl(base+'/skills/'+encodeURIComponent(skillId),{headers:{Authorization:`Bearer ${token}`},redirect:'error',signal:signal||AbortSignal.timeout(10000)})
  if(!response.ok)throw Error()
  const data=await response.json()
  if(data.id!==skillId||typeof data.latest_version!=='string'||!/^\d{1,24}$/.test(data.latest_version))throw Error()
  return data.latest_version
 }catch{throw Error('QCA 云端技能暂不可用')}
}
// Cumulative values are reported by Qoder to two decimals, rounded down.
// They must not be presented as an exact real-time daily hard limit.
export async function getQcaSessionUsage({config,session,fetchImpl=fetch,tokenProvider=getAccessToken,signal}) {
 const base=BASES[config?.region]
 if(!base||!config.token||typeof session!=='string'||!/^sess_[\w-]{1,120}$/.test(session))throw Error('QCA 会话配置无效')
 const token=await tokenProvider(config)
 let response,data
 try{
  response=await fetchImpl(base+'/sessions/'+encodeURIComponent(session),{headers:{Authorization:`Bearer ${token}`},redirect:'error',signal:signal||AbortSignal.timeout(10000)})
  if(!response.ok)throw Error()
  data=await response.json()
 }catch{throw Error('QCA 用量暂不可用')}
 const total=data?.usage?.total_credits
 if(data?.id!==session||typeof data.status!=='string'||!data.status||typeof total!=='number'||!Number.isFinite(total)||total<0)throw Error('QCA 用量数据无效')
 return {session,status:data.status,totalCredits:total}
}
export async function runQcaTurn({ config, prompt, images=[], session, fetchImpl=fetch, tokenProvider=getAccessToken, onEvent=()=>{}, onSession=()=>{}, signal }) {
  const base=BASES[config.region]
  if (!base || !config.token || !/^agent_[\w-]+$/.test(config.agent) || !/^env_[\w-]+$/.test(config.environment)) throw Error('QCA 配置不完整')
  if(config.agentVersion!==undefined&&(!Number.isSafeInteger(config.agentVersion)||config.agentVersion<1))throw Error('QCA 智能体版本无效')
  if (config.sessionCreditBudget !== undefined && (typeof config.sessionCreditBudget !== 'string' || !/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(config.sessionCreditBudget) || Number(config.sessionCreditBudget)<=0)) throw Error('QCA 会话预算无效')
  if (typeof prompt!=='string' || !prompt.trim() || prompt.length>50000) throw Error('对话内容无效')
  const accessToken=await tokenProvider(config)
  const headers={Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'}
  const request=async (url,opts={})=>{
    const response=await fetchImpl(url,{...opts,headers:{...headers,...opts.headers},redirect:'error',signal})
    if (!response.ok) {const error=Error(`QCA 请求失败 (${response.status})`);error.status=response.status;throw error}
    return response
  }
  if (!session) {
    const budget=config.sessionCreditBudget ? {budget:{type:'limit',max_credit_cost:config.sessionCreditBudget}} : {}
    const agent=config.agentVersion?{type:'agent',id:config.agent,version:config.agentVersion}:config.agent
    const r=await request(base+'/sessions',{method:'POST',body:JSON.stringify({agent,environment_id:config.environment,...budget})})
    session=(await r.json()).id
    if (!/^sess_[\w-]{1,120}$/.test(session)) throw Error('QCA 会话无效')
    await onSession(session)
  }
  if (!/^sess_[\w-]{1,120}$/.test(session)) throw Error('QCA 会话无效')
  const eventURL=base+'/sessions/'+encodeURIComponent(session)+'/events'
  const streamURL=eventURL+'/stream?event_deltas%5B%5D=agent.message'
  let stream=await request(streamURL,{headers:{Accept:'text/event-stream'}})
  if (!stream.body) throw Error('QCA 未返回事件流')
  const content=[{type:'text',text:prompt},...images.map(i=>({type:'image',source:{type:'base64',media_type:i.mediaType,data:i.data}}))]
  let submitted=false,finished=false
  try {
    submitted=true
    try{await request(eventURL,{method:'POST',body:JSON.stringify({events:[{type:'user.message',content}]})})}catch(error){if(error.status)submitted=false;throw error}
    let reader=stream.body.getReader(), decoder=new TextDecoder()
    const messages=new Map(), deltaIds=new Set()
    let pending='', started=false, ended=false, turnFailed=false, cursor='', reconnects=0
    try {
      while (!ended) {
        let part
        try{part=await reader.read()}catch(error){if(signal?.aborted)throw error;part={done:true}}
        pending=(pending+decoder.decode(part.value||new Uint8Array(),{stream:!part.done})).replace(/\r\n/g,'\n')
        let idx
        while ((idx=pending.indexOf('\n\n'))>=0) {
          const raw=pending.slice(0,idx);pending=pending.slice(idx+2)
          const data=raw.split('\n').filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart()).join('\n')
          if(!data)continue
          let e;try{e=JSON.parse(data)}catch{throw Error('QCA 事件格式无效')}
          const frameId=raw.split('\n').find(line=>line.startsWith('id:'))?.slice(3).trim()
          if(frameId && /^evt_[\w-]{1,120}$/.test(frameId))cursor=frameId
          if(e.type==='session.status_running')started=true
          if(e.type==='event_delta' && e.delta?.content?.type==='text' && typeof e.delta.content.text==='string') {started=true;deltaIds.add(e.event_id);onEvent({type:'delta',id:e.event_id,text:e.delta.content.text})}
          if(e.type==='agent.message' && typeof e.id==='string') {started=true;const text=(e.content||[]).filter(x=>x.type==='text').map(x=>x.text||'').join('');if(!messages.has(e.id)){messages.set(e.id,text);onEvent({type:'message',id:e.id,text,hadDelta:reconnects===0&&deltaIds.has(e.id)})}}
          if(e.type==='session.error') {started=true;if(e.error?.retry_status?.type==='retrying')onEvent({type:'status',text:'云端正在重试，请稍候…'});else turnFailed=true}
          if(e.type==='session.status_idle' && started) {if(turnFailed || (e.stop_reason?.type && e.stop_reason.type!=='end_turn'))throw Error('QCA 任务未正常完成');ended=true;break}
          if(['session.status_terminated','session.status_error','session.status_failed'].includes(e.type))throw Error('QCA 任务执行失败')
        }
        if(part.done&&!ended){
          if(!cursor||reconnects>=2||signal?.aborted)throw Error('QCA 事件流中断')
          await reader.cancel().catch(()=>{});reader.releaseLock()
          onEvent({type:'status',text:'连接中断，正在恢复云端回复…'})
          stream=await request(streamURL,{headers:{Accept:'text/event-stream','Last-Event-ID':cursor}})
          if(!stream.body)throw Error('QCA 未返回事件流')
          reader=stream.body.getReader();decoder=new TextDecoder();pending='';reconnects++
        }
      }
    } finally {await reader.cancel().catch(()=>{});reader.releaseLock()}
    finished=true
    const text=[...messages.values()].join('\n\n')
    if (!text) throw Error('QCA 没有返回有效回复')
    onEvent({type:'done',text})
    return {session,text}
  } finally {
    if(submitted&&!finished){try{await fetchImpl(base+'/sessions/'+encodeURIComponent(session)+'/cancel',{method:'POST',headers,redirect:'error',signal:AbortSignal.timeout(5000)})}catch{}}
    if (!stream.body.locked) await stream.body.cancel().catch(()=>{})
  }
}
