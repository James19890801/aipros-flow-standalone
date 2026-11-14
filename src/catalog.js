// AIPROS 流程图 — 官方形状目录加载器（Node 侧）
// categories/*.js 是明文 Schema.addShape/addCategory 调用, 用 shim 直接收割全部形状库

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { BUILTIN_COMMANDS, resolveShapePath } from './shapepath.js'

export { resolveShapePath }

export const DEFAULT_CATALOG = path.resolve(
  process.env.AIPROS_CATALOG ||
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'vendor', 'renderer', 'src', 'v5_editor', 'source', 'static', 'diagrams', 'categories')
)

export function loadCatalog(dir = DEFAULT_CATALOG) {
  const shapes = new Map()
  const categories = new Map()
  const commands = new Map(Object.entries(BUILTIN_COMMANDS))
  const pathFuns = new Map()
  const Schema = {
    addCategory(c) { categories.set(c.name, c) },
    addShape(s) { if (s && s.name) shapes.set(s.name, s) },
    addGlobalCommand(name, actions) { commands.set(name, actions) },
    addPathFun(fn) { if (fn && fn.name) pathFuns.set(fn.name, fn) },
  }
  const i18next = { t: s => s }
  const failures = []
  for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort()) {
    const code = fs.readFileSync(path.join(dir, file), 'utf8')
    try {
      // eslint-disable-next-line no-new-func
      new Function('Schema', 'i18next', 'window', 'document', code)(Schema, i18next, undefined, undefined)
    } catch (e) {
      failures.push(`${file}: ${e.message}`)
    }
  }
  return { shapes, categories, commands, pathFuns, failures }
}

export function findShape(catalog, name) {
  const s = catalog.shapes.get(name)
  if (!s) throw new Error(`形状 "${name}" 不存在。可用 aipros-flow shapes 查看全部形状`)
  return s
}
