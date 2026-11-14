import fs from 'node:fs'
import path from 'node:path'
import {atomicWrite} from './atomic-write.js'

// Best-effort admission control, not a supplier-enforced limit. The ledger uses
// Qoder's rounded, potentially delayed session totals; a running turn can overshoot.
export function createDailyBudget({directory,limit,now=()=>new Date(),getUsage}){
 if(!path.isAbsolute(directory)||!Number.isFinite(limit)||limit<=0||typeof getUsage!=='function')throw Error('每日预算配置无效')
 const file=path.join(directory,'qca-daily-budget.json');let active=false
 const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(now())
 const read=()=>fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{version:1,days:{},sessions:{},sessionDays:{},pending:null}
 const write=state=>atomicWrite(file,JSON.stringify(state))
 const updateSession=async(state,session,date,config)=>{
  const usage=await getUsage(session,config)
  if(usage.session!==session||!['idle','terminated','archived'].includes(usage.status)||!Number.isFinite(usage.totalCredits)||usage.totalCredits<0)throw Error('云端任务尚未完成或用量不可用')
  const prior=state.sessions[session]||0
  if(usage.totalCredits<prior)throw Error('云端用量异常')
  state.days[date]=(state.days[date]||0)+(usage.totalCredits-prior);state.sessions[session]=usage.totalCredits;state.sessionDays[session]=date
 }
 const reconcile=async(state,config)=>{
  if(!state.pending)return
  if(state.pending.session)await updateSession(state,state.pending.session,state.pending.day,config)
  state.pending=null;write(state)
 }
 return {async begin(config){
  if(active)throw Error('云端正在处理其他请求，请稍后重试')
  active=true
  try{
   const state=read();if(state.version!==1||!state.days||!state.sessions)throw Error('云端预算记录无效');state.sessionDays??={}
   await reconcile(state,config)
   const today=day()
   for(const [session,date] of Object.entries(state.sessionDays))if(date===today)await updateSession(state,session,date,config)
   write(state)
   if((state.days[today]||0)>=limit)throw Error('云端今日已达到每日预算，请明天再试')
   state.pending={day:today,session:null};write(state)
   let finished=false
   return {
    setSession(session){if(!/^sess_[\w-]{1,120}$/.test(session))throw Error('QCA 会话无效');state.pending.session=session;write(state)},
    async finish(){if(finished)return;finished=true;try{await reconcile(state,config)}finally{active=false}}
   }
  }catch(error){active=false;throw error}
 }}
}
