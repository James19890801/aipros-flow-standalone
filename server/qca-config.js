import fs from 'node:fs'
import path from 'node:path'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
const filename=dir=>path.join(dir,'qca.json')
function encryptionKey(key){if(typeof key!=='string'||!/^[a-f0-9]{64}$/i.test(key))throw Error('QCA 服务端加密密钥未配置');return Buffer.from(key,'hex')}
function validate(value){
 if(!value||!['cn','global'].includes(value.region)||!/^agent_[\w-]{1,120}$/.test(value.agent||'')||!/^env_[\w-]{1,120}$/.test(value.environment||'')||typeof value.token!=='string'||value.token.length<1||value.token.length>4096||/[\r\n]/.test(value.token))throw Error('QCA 配置无效')
 if(value.authMode!==undefined && (value.authMode!=='service-account'||value.region!=='cn'))throw Error('QCA 配置无效')
 if(value.agentVersion!==undefined&&(!Number.isSafeInteger(value.agentVersion)||value.agentVersion<1))throw Error('QCA 配置无效')
 return {region:value.region,agent:value.agent,environment:value.environment,token:value.token,...(value.authMode?{authMode:value.authMode}:{}),...(value.agentVersion?{agentVersion:value.agentVersion}:{})}
}
export function saveQcaConfig(directory,key,input){
 const config=validate(input),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',encryptionKey(key),iv)
 const ciphertext=Buffer.concat([cipher.update(JSON.stringify(config),'utf8'),cipher.final()])
 const payload=JSON.stringify({version:1,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:ciphertext.toString('base64')})
 const target=filename(directory),temp=target+'.'+randomBytes(8).toString('hex')+'.tmp'
 try{fs.writeFileSync(temp,payload,{mode:0o600,flag:'wx'});fs.renameSync(temp,target)}finally{try{fs.unlinkSync(temp)}catch{}}
}
export function loadQcaConfig(directory,key){
 const target=filename(directory);if(!fs.existsSync(target))return null
 const data=JSON.parse(fs.readFileSync(target,'utf8'));if(data.version!==1)throw Error('QCA 配置版本无效')
 const decipher=createDecipheriv('aes-256-gcm',encryptionKey(key),Buffer.from(data.iv,'base64'));decipher.setAuthTag(Buffer.from(data.tag,'base64'))
 return validate(JSON.parse(Buffer.concat([decipher.update(Buffer.from(data.data,'base64')),decipher.final()]).toString('utf8')))
}
export function publicQcaConfig(config){return config?{configured:true,region:config.region,agent:config.agent,environment:config.environment}:{configured:false}}
