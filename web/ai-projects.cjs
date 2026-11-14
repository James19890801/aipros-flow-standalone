;(function(root,factory){if(typeof module==='object' && module.exports)module.exports=factory();else root.AIProjects=factory()})(typeof globalThis==='object'?globalThis:this,function(){
 function empty(){return {version:1,active:null,order:[],projects:{}}}
 function newProject(s,id){if(!id||s.projects[id])throw Error('项目 ID 无效');return {...s,active:id,order:[id,...s.order],projects:{...s.projects,[id]:{id,title:'新项目',messages:[],canvas:null}}}}
 function selectProject(s,id){if(!s.projects[id])throw Error('项目不存在');return {...s,active:id}}
 function recordMessage(s,id,message){const p=s.projects[id];if(!p)throw Error('项目不存在');return {...s,projects:{...s.projects,[id]:{...p,messages:[...p.messages,message]}}}}
 function bindCanvas(s,id,canvas,title){const p=s.projects[id];if(!p||p.canvas)throw Error('项目已经绑定画布或不存在');return {...s,projects:{...s.projects,[id]:{...p,canvas,title:title||p.title}}}}
 return {empty,newProject,selectProject,recordMessage,bindCanvas}
})
