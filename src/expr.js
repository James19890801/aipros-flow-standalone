// AIPROS 流程图 — 坐标表达式求值器
// 兼容官方形状定义中的表达式: "w-16" / "0.2*h" / "Math.min(w,h)/3" / 三元与比较运算

const FUNCS = { Math }

export function evalExpr(expr, scope = {}) {
  if (typeof expr === 'number') return expr
  if (expr == null || expr === '') return 0
  const tokens = tokenize(String(expr))
  const parser = new Parser(tokens, scope)
  const value = parser.parseTernary()
  parser.expectEnd()
  return value
}

function tokenize(src) {
  const tokens = []
  let i = 0
  while (i < src.length) {
    const c = src[i]
    if (/\s/.test(c)) { i++; continue }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let j = i
      while (j < src.length && /[0-9.]/.test(src[j])) j++
      tokens.push({ t: 'num', v: parseFloat(src.slice(i, j)) })
      i = j
      continue
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i
      while (j < src.length && /[A-Za-z0-9_$]/.test(src[j])) j++
      tokens.push({ t: 'id', v: src.slice(i, j) })
      i = j
      continue
    }
    const two = src.slice(i, i + 2)
    if (['<=', '>=', '==', '!=', '&&', '||'].includes(two)) {
      tokens.push({ t: 'op', v: two })
      i += 2
      continue
    }
    if ('+-*/%().,:?<>!'.includes(c)) {
      tokens.push({ t: 'op', v: c })
      i++
      continue
    }
    throw new Error(`无法识别的表达式字符: "${c}" (于 "${src}")`)
  }
  return tokens
}

class Parser {
  constructor(tokens, scope) {
    this.tokens = tokens
    this.pos = 0
    this.scope = scope
  }

  peek() { return this.tokens[this.pos] }
  next() { return this.tokens[this.pos++] }
  isOp(v) { const t = this.peek(); return t && t.t === 'op' && t.v === v }
  eatOp(v) { if (!this.isOp(v)) throw new Error(`期望 "${v}"`); this.pos++ }

  expectEnd() {
    if (this.pos < this.tokens.length) throw new Error(`表达式存在多余内容: "${this.tokens.map(t => t.v).join(' ')}"`)
  }

  parseTernary() {
    const cond = this.parseOr()
    if (this.isOp('?')) {
      this.next()
      const a = this.parseTernary()
      this.eatOp(':')
      const b = this.parseTernary()
      return cond ? a : b
    }
    return cond
  }

  parseOr() {
    let left = this.parseAnd()
    while (this.isOp('||')) { this.next(); left = this.parseAnd() || left ? 1 : 0 }
    return left
  }

  parseAnd() {
    let left = this.parseCompare()
    while (this.isOp('&&')) { this.next(); left = (this.parseCompare() && left) ? 1 : 0 }
    return left
  }

  parseCompare() {
    let left = this.parseAdd()
    const t = this.peek()
    if (t && t.t === 'op' && ['<', '>', '<=', '>=', '==', '!='].includes(t.v)) {
      const op = this.next().v
      const right = this.parseAdd()
      switch (op) {
        case '<': return left < right
        case '>': return left > right
        case '<=': return left <= right
        case '>=': return left >= right
        case '==': return left === right
        case '!=': return left !== right
      }
    }
    return left
  }

  parseAdd() {
    let v = this.parseMul()
    while (this.isOp('+') || this.isOp('-')) {
      const op = this.next().v
      const r = this.parseMul()
      v = op === '+' ? v + r : v - r
    }
    return v
  }

  parseMul() {
    let v = this.parseUnary()
    while (this.isOp('*') || this.isOp('/') || this.isOp('%')) {
      const op = this.next().v
      const r = this.parseUnary()
      v = op === '*' ? v * r : op === '/' ? v / r : v % r
    }
    return v
  }

  parseUnary() {
    if (this.isOp('-')) { this.next(); return -this.parseUnary() }
    if (this.isOp('+')) { this.next(); return this.parseUnary() }
    if (this.isOp('!')) { this.next(); return this.parseUnary() ? 0 : 1 }
    return this.parsePrimary()
  }

  parsePrimary() {
    const t = this.next()
    if (t.t === 'num') return t.v
    if (t.t === 'id') {
      let value = this.resolve(t.v)
      while (this.isOp('.')) {
        this.next()
        const prop = this.next()
        if (prop.t !== 'id') throw new Error(`非法成员访问: "${prop.v}"`)
        value = value?.[prop.v]
      }
      if (this.isOp('(')) {
        this.next()
        const args = []
        if (!this.isOp(')')) {
          args.push(this.parseTernary())
          while (this.isOp(',')) { this.next(); args.push(this.parseTernary()) }
        }
        this.eatOp(')')
        if (typeof value !== 'function') throw new Error(`"${t.v}" 不是函数`)
        return value(...args)
      }
      return value
    }
    if (t.t === 'op' && t.v === '(') {
      const v = this.parseTernary()
      this.eatOp(')')
      return v
    }
    throw new Error(`非法 token: "${t.v}"`)
  }

  resolve(name) {
    if (name in this.scope) return this.scope[name]
    if (name in FUNCS) return FUNCS[name]
    throw new Error(`未知变量: "${name}"`)
  }
}
