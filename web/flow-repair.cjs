;(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.FlowRepair=factory()})(typeof globalThis==='object'?globalThis:this,function(){
 const extract=text=>String(text||'').match(/```json\s*([\s\S]*?)```/i)
 async function createValidatedFlow({response,context,build,repair}){
  let output=response
  for(let attempt=0;attempt<2;attempt++){
   const match=extract(output)
   if(!match)return {question:String(output||'').trim()}
   let flow,error
   try{flow=JSON.parse(match[1])}catch{error='返回的 JSON 格式无效'}
   if(!error){const result=await build(flow);if(result.ok)return {flow,created:result};error=String(result.error||'流程校验失败');if(result.retryable===false)throw Error(error)}
   if(attempt===1)throw Error('流程尚未通过校验：'+error)
   const correction='上一次流程 JSON 校验未通过：'+error+'。请完整调用流程图 Skill，保留用户原有业务步骤、判断、退回目标和并行汇合，不得删减或虚构业务；修正错误并重新输出完整 JSON。如业务信息不足，请向用户提问，不输出 JSON。\n原请求和对话：\n'+context+'\n上次 JSON：\n'+match[1]
   if(correction.length>49000)throw Error('对话内容过长，无法自动修正；请新建会话后重试')
   output=await repair(correction)
  }
 }
 return {createValidatedFlow}
})
