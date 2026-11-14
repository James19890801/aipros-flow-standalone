;(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AgentRuntime=factory()})(typeof globalThis==='object'?globalThis:this,function(){
 const options=[{id:'local',label:'本地 CLI'},{id:'qca',label:'Qoder Cloud Agent'},{id:'auto',label:'本地优先，云端兜底'}]
 function normalize(value){return options.some(option=>option.id===value)?value:'local'}
 async function chooseRuntime({mode,local,cloud}){if(mode==='qca')return await cloud()?'qca':null;if(await local())return 'local';if(mode==='auto'&&await cloud())return 'qca';return null}
 return {options,normalize,chooseRuntime}
})
