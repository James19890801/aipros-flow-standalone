// AIPROS 流程图 — 形状路径解析（纯函数，浏览器/Node 通用）
// 内置指令表 + ref 解析 + pathFun 动态路径

export const BUILTIN_COMMANDS = {
  rectangle: [{ action: 'move', x: '0', y: '0' }, { action: 'line', x: 'w', y: '0' }, { action: 'line', x: 'w', y: 'h' }, { action: 'line', x: '0', y: 'h' }, { action: 'close' }],
  round: [{ action: 'move', x: '0', y: 'h/2' }, { action: 'curve', x1: '0', y1: '-h/6', x2: 'w', y2: '-h/6', x: 'w', y: 'h/2' }, { action: 'curve', x1: 'w', y1: 'h+h/6', x2: '0', y2: 'h+h/6', x: '0', y: 'h/2' }, { action: 'close' }],
  roundRectangle: [{ action: 'move', x: '0', y: '4' }, { action: 'quadraticCurve', x1: '0', y1: '0', x: '4', y: '0' }, { action: 'line', x: 'w-4', y: '0' }, { action: 'quadraticCurve', x1: 'w', y1: '0', x: 'w', y: '4' }, { action: 'line', x: 'w', y: 'h-4' }, { action: 'quadraticCurve', x1: 'w', y1: 'h', x: 'w-4', y: 'h' }, { action: 'line', x: '4', y: 'h' }, { action: 'quadraticCurve', x1: '0', y1: 'h', x: '0', y: 'h-4' }, { action: 'close' }],
}

export function resolveShapePath(shape, commands = BUILTIN_COMMANDS, pathFuns = null, w, h) {
  const pathFun = pathFuns?.get(shape.name)
  if (pathFun && typeof pathFun.updatePath === 'function') {
    try {
      const dynamic = pathFun.updatePath(w ?? shape.props?.w, h ?? shape.props?.h)
      if (Array.isArray(dynamic)) return dynamic.map(cloneSubPath)
    } catch { /* pathFun 失败时回退静态 path */ }
  }
  return (shape.path ?? []).map(cloneSubPath).map(p => {
    if (p.actions && !Array.isArray(p.actions) && p.actions.ref) {
      const cmd = commands.get ? commands.get(p.actions.ref) : commands[p.actions.ref]
      p.actions = cmd ? cmd.map(a => ({ ...a })) : []
    }
    return p
  })
}

function cloneSubPath(p) {
  return {
    lineStyle: p.lineStyle ? { ...p.lineStyle } : undefined,
    fillStyle: p.fillStyle ? { ...p.fillStyle } : undefined,
    actions: Array.isArray(p.actions) ? p.actions.map(a => ({ ...a })) : p.actions ? { ...p.actions } : [],
  }
}
