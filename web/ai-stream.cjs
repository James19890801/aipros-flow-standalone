;(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.AIStream=factory()})(typeof globalThis==='object'?globalThis:this,function(){
 function makeLineParser(emit){let buffer='';return {push(chunk){buffer+=chunk;let i;while((i=buffer.indexOf('\n'))!==-1){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);if(line.trim())emit(JSON.parse(line))}},end(){if(buffer.trim())emit(JSON.parse(buffer));buffer=''}}}
 function displayText(text){const fence=text.indexOf('```');return (fence>=0?text.slice(0,fence):text).replace(/`{1,2}$/,'').trim()}
 return {makeLineParser,displayText}
})
