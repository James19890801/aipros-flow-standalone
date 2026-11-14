import path from 'node:path'

// Shared credentials live outside user storage; budget is mandatory in shared mode.
export function createQcaConfigLoader({sharedDirectory,sessionCreditBudget,loadConfig}) {
 if (!sharedDirectory) return directory=>loadConfig(directory)
 if (!path.isAbsolute(sharedDirectory)) throw Error('QCA 共享目录必须使用绝对路径')
 if (typeof sessionCreditBudget!=='string'||!/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(sessionCreditBudget)||Number(sessionCreditBudget)<=0) throw Error('QCA 共享会话预算无效')
 return ()=>{const config=loadConfig(sharedDirectory);if(config&&(!Number.isSafeInteger(config.agentVersion)||config.agentVersion<1))throw Error('QCA 共享智能体版本未固定');return config?{...config,sessionCreditBudget}:null}
}
