# DSL Parser Bundle Readme

本目录是 DSL 解析器的打包产物，供外部项目直接集成。

## Files

- `dsl-parser.umd.js`：UMD 版本（浏览器 script / CommonJS）
- `dsl-parser.esm.js`：ES Module 版本（import）

## Exports

两个版本都提供相同导出：

- `default`：`DslParser` 类
- `parseDsl(dsl, options?)`
- `detectDslType(dsl)`

`detectDslType` 返回：

```js
{ editor: 'smart' | '', type: 'timeline' | 'orgchart' | 'pyramid' | 'sample' | '' }
```

说明：`sample` 对应 `infographic/list/process/relationship`。

补充：

- 当首条有效语句仅为 `smart` 时，`detectDslType` 返回 `{ editor: 'smart', type: 'sample' }`

文本值归一化规则：

- 当字段值为 `undefined`（大小写不敏感，含引号也适用）时，解析结果统一为 `""`

## Parse Result (sample)

当 DSL type 属于 `list/process/relationship` 时，解析结果结构为：

```json
{
  "content": {
    "title": "",
    "nodeList": [{ "title": "", "description": "" }]
  },
  "icons": [{ "name": "" }],
  "types": [""],
  "themes": [""]
}
```

## Usage (ESM)

```js
import DslParser, { detectDslType, parseDsl } from './dsl-parser.esm.js';

const dsl = `smart timeline\ndata {\n  - 节点\n    time: 2026\n    desc: 内容\n}`;

const typeInfo = detectDslType(dsl);
const result = parseDsl(dsl);

const parser = new DslParser();
const finalResult = parser.parse(dsl);
```

## Usage (UMD in Browser)

```html
<script src="./dsl-parser.umd.js"></script>
<script>
  const { default: DslParser, detectDslType, parseDsl } = window.SmartDslParser;
  const typeInfo = detectDslType('smart orgchart\ndata {');
  console.log(typeInfo);
</script>
```

## Usage (CommonJS)

```js
const parserLib = require('./dsl-parser.umd.js');
const DslParser = parserLib.default;

const parser = new DslParser();
const typeInfo = parser.getDslType('smart list xxx\ndata {');
```

## Build

在仓库根目录执行：

```bash
npm run build:parser
```

会生成：

- `dist/parser/dsl-parser.umd.js`
- `dist/parser/dsl-parser.esm.js`
- `dist/parser/README.md`
