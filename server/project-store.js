import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
export function emptyProjects(){return {version:1,active:null,order:[],projects:{}}}
export function validateProjects(data){
 if(!data||data.version!==1||!Array.isArray(data.order)||data.order.length>100||!data.projects||Array.isArray(data.projects)||typeof data.projects!=='object'||JSON.stringify(data).length>1024*1024||new Set(data.order).size!==data.order.length||data.order.some(id=>typeof id!=='string'||id.length>100||!Object.hasOwn(data.projects,id))||(data.active!==null&&!data.order.includes(data.active))||Object.keys(data.projects).length!==data.order.length)return false
 return data.order.every(id=>{const p=data.projects[id];return p&&p.id===id&&typeof p.title==='string'&&p.title.length<=200&&Array.isArray(p.messages)&&p.messages.length<=200&&(p.canvas===null||(typeof p.canvas==='string'&&/^[\w\u4e00-\u9fff-]+$/.test(p.canvas)))&&p.messages.every(m=>m&&['user','assistant'].includes(m.role)&&typeof m.text==='string'&&m.text.length<=50000&&(m.material===undefined||(typeof m.material==='string'&&m.material.length<=50000)))})
}
export function readProjects(directory){const file=path.join(directory,'ai-projects.json');return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):emptyProjects()}
export function writeProjects(directory,data){
 if(!validateProjects(data))throw Error('invalid projects')
 const target=path.join(directory,'ai-projects.json'),temp=target+'.'+randomUUID()+'.tmp'
 try{fs.writeFileSync(temp,JSON.stringify(data),{mode:0o600,flag:'wx'});fs.renameSync(temp,target)}finally{try{fs.unlinkSync(temp)}catch{}}
}
