import { createHash } from 'node:crypto'

// SA keys never leave the server or go to the Cloud Agents API directly.
export function createQcaTokenProvider({fetchImpl=fetch,now=Date.now}={}) {
 const cache=new Map(),pending=new Map()
 return async config=>{
  if(config.authMode!=='service-account')return config.token
  if(config.region!=='cn')throw Error('服务账号暂不支持该区域')
  const key=createHash('sha256').update(config.region+'\0'+config.token).digest('hex')
  const saved=cache.get(key)
  if(saved && now()<saved.expiresAt-60000)return saved.token
  if(pending.has(key))return pending.get(key)
  const exchange=(async()=>{
   try{
    const started=now()
    const response=await fetchImpl('https://openapi.qoder.com.cn/api/v1/serviceToken/exchange',{method:'POST',headers:{Authorization:`Bearer ${config.token}`,'Content-Type':'application/json'},body:JSON.stringify({grant_type:'client_credentials',audience:'qoder',scope:'qca.access',ttl_seconds:43200}),redirect:'error',signal:AbortSignal.timeout(10000)})
    if(!response.ok)throw Error()
    const data=await response.json()
    if(typeof data.access_token!=='string'||!data.access_token||/[\r\n]/.test(data.access_token)||!Number.isFinite(data.expires_in)||data.expires_in<=60||data.expires_in>43200)throw Error()
    if(cache.size>=64)cache.delete(cache.keys().next().value)
    cache.set(key,{token:data.access_token,expiresAt:started+data.expires_in*1000})
    return data.access_token
   }catch{throw Error('QCA 服务账号令牌获取失败')}
  })()
  pending.set(key,exchange)
  try{return await exchange}finally{pending.delete(key)}
 }
}
