# 泳道图规范校验脚本（基础校验；另须检查中心点、独立连线交叉及水平重叠）

开始节点与结束节点必须处于同一条泳道；存在多个开始或结束节点时，它们均须位于这一泳道。共同泳道不强制为第一条。网页 JSON 的 `start` 与 `end` 节点 `laneId` 必须一致，生成前由应用校验；非网页模式也须核对终止符所在泳道，不能只依赖下方几何校验。

```js
// node check.js <file.posf>
import { parsePosfBuffer } from '<项目>/src/posf.js'
import fs from 'node:fs'
const r = await parsePosfBuffer(fs.readFileSync(process.argv[2]))
const byId = r.docs[0].diagram.elements.elements
const els = Object.values(byId)
const acts = els.filter(e => e.name !== 'linker' && e.name !== 'horizontalPool' && e.name !== 'horizontalLane')
const links = els.filter(e => e.name === 'linker')
let bad = []

// 1. 右出左入
for (const l of links) {
  const f = byId[l.from.id], t = byId[l.to.id]
  if (l.from.x !== f.props.x + f.props.w) bad.push('非右出')
  if (l.to.x !== t.props.x) bad.push('非左入')
}

// 2. 活动不重叠
for (let i = 0; i < acts.length; i++) for (let j = i + 1; j < acts.length; j++) {
  const a = acts[i].props, b = acts[j].props
  if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) bad.push('活动重叠')
}

// 3. 线不穿活动（线段-矩形求交采样）
for (const l of links) {
  const pts = [l.from, ...l.points, l.to]
  outer: for (let s = 0; s < pts.length - 1; s++) for (const a of acts) {
    for (let t = 0.05; t < 1; t += 0.05) {
      const x = pts[s].x + (pts[s+1].x - pts[s].x) * t, y = pts[s].y + (pts[s+1].y - pts[s].y) * t
      if (x > a.props.x + 2 && x < a.props.x + a.props.w - 2 && y > a.props.y + 2 && y < a.props.y + a.props.h - 2) { bad.push('穿活动'); break outer }
    }
  }
}

// 4. 竖线零重叠
const verts = []
for (const l of links) for (let i = 0; i + 1 < l.points.length; i += 2) {
  if (Math.abs(l.points[i].x - l.points[i+1].x) < 2)
    verts.push({ x: l.points[i].x, y1: Math.min(l.points[i].y, l.points[i+1].y), y2: Math.max(l.points[i].y, l.points[i+1].y) })
}
let ov = 0
for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++)
  if (Math.abs(verts[i].x - verts[j].x) < 2 && verts[i].y1 < verts[j].y2 && verts[j].y1 < verts[i].y2) ov++
if (ov) bad.push('竖线重叠 x' + ov)

console.log(bad.length ? '✗ ' + [...new Set(bad)].join('; ') : '✓ 4 项规范校验全部通过')
process.exit(bad.length ? 1 : 0)
```

## 两遍路由要点（写新生成器时照抄）

1. 先收集所有 link（只记录 from/to/text），后统一计算几何
2. 所有连线固定活动框左右边缘正中心：右侧出线的第一段必须水平向右，左侧入线的最后一段必须水平向右；不得从上下边或偏离中心的位置连接，也不得在边缘直接转为竖线。多条线重合在同一中心点，允许在活动外分流或汇流；优先直线，再考虑少量正交折弯，独立连线不得交叉或重叠。
3. 按源列号分组；组内竖线 x 在列间隙 `[源右边缘+4, 目标左边缘-4]` 上均匀散开（1 条取中点，n 条取 (i+1)/(n+1) 分位）
4. 出入 y 差 < 3px 时画直线（无折点）
5. 判断分支（是/否）的文字放在竖直段中点
