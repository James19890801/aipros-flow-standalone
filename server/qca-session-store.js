import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { atomicWrite } from './atomic-write.js'

const file=dir=>path.join(dir,'qca-sessions.json')
const validProject=id=>typeof id==='string'&&/^[\w-]{1,100}$/.test(id)
const fingerprint=config=>createHash('sha256').update(JSON.stringify([config.region,config.agent,config.environment,config.token,config.sessionCreditBudget,config.authMode,config.agentVersion,config.skillId,config.skillRevision])).digest('hex')
function read(dir){const p=file(dir);return fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):{}}
export function loadSession(dir,project,config){
 if(!validProject(project))throw Error('项目无效')
 const entry=read(dir)[project]
 return entry&&entry.fingerprint===fingerprint(config)&&/^sess_[\w-]{1,120}$/.test(entry.session)?entry.session:null
}
export function saveSession(dir,project,config,session){
 if(!validProject(project)||typeof session!=='string'||!/^sess_[\w-]{1,120}$/.test(session))throw Error('会话无效')
 const entries=read(dir);entries[project]={fingerprint:fingerprint(config),session};atomicWrite(file(dir),JSON.stringify(entries))
}
