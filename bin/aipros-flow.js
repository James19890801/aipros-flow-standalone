#!/usr/bin/env node
// AIPROS 流程图 — 命令行入口

import { program } from 'commander'
import fs from 'node:fs'
import path from 'node:path'
import { loadCatalog, findShape, DEFAULT_CATALOG } from '../src/catalog.js'
import { createDocument, addNode, addLinker, elementsOf, pageOf } from '../src/model.js'
import { readDocument, writeDocument, emptyMeta } from '../src/posf.js'
import { renderSVG } from '../src/render.js'
import { applyLayout } from '../src/layout.js'

const BRAND = 'AIPROS 流程图'
const VERSION = '0.1.0'

program
  .name('aipros-flow')
  .description(`${BRAND} v${VERSION}\n  命令行流程图工具 · 原生流程图文档格式 (.posf)`)
  .version(`${BRAND} v${VERSION}`)

program.command('init')
  .description('新建空白流程图文档')
  .argument('<file>', '输出 .posf 路径')
  .option('-t, --title <title>', '文档标题', '未命名文件')
  .action(async (file, opts) => {
    const doc = createDocument(opts.title)
    await writeDocument(file, doc, doc.meta)
    done(`已创建 ${file}（画布 ${pageOf(doc).width}x${pageOf(doc).height}）`)
  })

program.command('node')
  .description('添加节点（返回节点 ID）')
  .argument('<file>', '.posf 文档路径')
  .requiredOption('-s, --shape <name>', '形状名，如 terminator / process / decision')
  .option('--text <text>', '节点文字')
  .option('-x, --x <x>', 'X 坐标', '0')
  .option('-y, --y <y>', 'Y 坐标', '0')
  .option('-w, --width <w>', '宽度（默认取形状默认值）')
  .option('-h, --height <h>', '高度')
  .option('--id <id>', '自定义节点 ID')
  .action(async (file, opts) => {
    const { doc } = await loadOne(file)
    const catalog = loadCatalog()
    const shape = findShape(catalog, opts.shape)
    const id = addNode(doc, shape, {
      text: opts.text,
      x: Number(opts.x), y: Number(opts.y),
      w: opts.width != null ? Number(opts.width) : undefined,
      h: opts.height != null ? Number(opts.height) : undefined,
      id: opts.id,
      commands: catalog.commands,
      pathFuns: catalog.pathFuns,
    })
    await save(file, doc)
    out(id)
  })

program.command('link')
  .description('连接两个节点')
  .argument('<file>', '.posf 文档路径')
  .argument('<fromId>', '起点节点 ID')
  .argument('<toId>', '终点节点 ID')
  .option('--text <text>', '连线文字（如 是/否）')
  .option('--type <type>', '线型: broken(折线) | curve', 'broken')
  .option('--dash', '虚线')
  .action(async (file, fromId, toId, opts) => {
    const { doc } = await loadOne(file)
    const lineStyle = opts.dash ? { lineStyle: 'dash' } : undefined
    const id = addLinker(doc, fromId, toId, { text: opts.text, linkerType: opts.type, lineStyle })
    await save(file, doc)
    out(id)
  })

program.command('layout')
  .description('ELK 自动布局（与官方引擎布局内核同源）')
  .argument('<file>', '.posf 文档路径')
  .option('-d, --direction <dir>', 'DOWN | RIGHT', 'DOWN')
  .action(async (file, opts) => {
    const { doc } = await loadOne(file)
    const r = await applyLayout(doc, { direction: opts.direction })
    await save(file, doc)
    done(`布局完成：${r.nodes} 节点 / ${r.edges} 连线`)
  })

program.command('export')
  .description('导出为 SVG 或 JSON')
  .argument('<file>', '.posf 文档路径')
  .option('-o, --output <out>', '输出路径（默认同名 .svg / .pos）')
  .option('--format <fmt>', 'svg | pos', 'svg')
  .option('--no-grid', '不画网格')
  .action(async (file, opts) => {
    const { doc } = await loadOne(file)
    if (opts.format === 'pos') {
      const out = opts.output ?? file.replace(/\.posf$/, '') + '.pos'
      fs.writeFileSync(out, JSON.stringify(doc, null, 1))
      done(`已导出 ${out}`)
    } else {
      const out = opts.output ?? file.replace(/\.posf$/, '') + '.svg'
      fs.writeFileSync(out, renderSVG(doc, { grid: opts.grid }))
      done(`已导出 ${out}`)
    }
  })

program.command('info')
  .description('查看文档结构')
  .argument('<file>', '.posf 文档路径')
  .action(async (file) => {
    const { doc } = await loadOne(file)
    const els = elementsOf(doc)
    const nodes = Object.values(els).filter(e => e.name !== 'linker')
    const links = Object.values(els).filter(e => e.name === 'linker')
    console.log(`${BRAND} · 文档信息`)
    console.log(`  标题: ${doc.meta?.diagramInfo?.title ?? '-'}`)
    console.log(`  画布: ${pageOf(doc).width} x ${pageOf(doc).height}`)
    console.log(`  节点: ${nodes.length}  连线: ${links.length}`)
    for (const n of nodes) {
      console.log(`  · [${n.id}] ${n.name} "${(n.textBlock?.[0]?.text ?? '').trim()}" @(${n.props.x},${n.props.y})`)
    }
  })

program.command('shapes')
  .description('列出可用形状目录')
  .option('-c, --category <cat>', '按分类过滤')
  .action(async (opts) => {
    const catalog = loadCatalog()
    const cats = [...catalog.categories.entries()].sort()
    for (const [name, c] of cats) {
      if (opts.category && name !== opts.category) continue
      const shapes = [...catalog.shapes.values()].filter(s => s.category === name)
      if (!shapes.length) continue
      console.log(`\n${c.text || name} (${name}, ${shapes.length})`)
      console.log('  ' + shapes.map(s => s.name).join(', '))
    }
    if (catalog.failures.length) warn(`${catalog.failures.length} 个分类文件加载失败`)
  })

program.command('open')
  .description('用官方桌面客户端打开（roundtrip 验证）')
  .argument('<file>', '.posf 文档路径')
  .action(async (file) => {
    const abs = path.resolve(file)
    const { execSync } = await import('node:child_process')
    execSync(`open "${abs}"`)
    done(`已在官方桌面客户端打开 ${file}`)
  })

program.parseAsync(process.argv)

async function loadOne(file) {
  const r = await readDocument(file)
  return { doc: r.docs[0], meta: r.meta }
}

async function save(file, doc) {
  doc.meta.diagramInfo.modified = formatNow()
  if (r_isPos(file)) return writeDocument(file, doc)
  await writeDocument(file, doc, doc.meta)
}

function r_isPos(file) {
  return file.endsWith('.pos')
}

function out(s) { process.stdout.write(s + '\n') }
function done(s) { process.stdout.write(`✓ ${s}\n`) }
function warn(s) { process.stderr.write(`⚠ ${s}\n`) }
function err(s) { process.stderr.write(`✗ ${s}\n`); process.exit(1) }

function formatNow() {
  const d = new Date(), p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
