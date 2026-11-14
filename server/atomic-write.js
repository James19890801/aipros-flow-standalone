import fs from 'node:fs'
import {randomUUID} from 'node:crypto'
export function atomicWrite(file,data){
 const temp=file+'.'+randomUUID()+'.tmp'
 try{fs.writeFileSync(temp,data,{mode:0o600,flag:'wx'});fs.renameSync(temp,file)}finally{try{fs.unlinkSync(temp)}catch{}}
}
