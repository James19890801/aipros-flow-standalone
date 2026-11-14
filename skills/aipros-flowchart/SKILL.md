---
name: aipros-flowchart
description: 用 aipros-flow CLI 绘制标准流程图与跨部门泳道图（生成 .posf/.svg/PNG）。触发词：画流程图、绘制流程图、泳道图、跨部门流程、swimlane、flowchart、aipros-flow、招聘流程图。支持官方引擎级渲染、ELK 自动布局、规范校验。
---

# AIPROS 流程图绘制 Skill

通过 aipros-flow CLI 与生成器脚本，产出**符合规范的流程图/泳道图**（.posf 文档，可导出 SVG/PNG，可用官方桌面客户端打开）。

## 网页对话 JSON 模式（当请求明确要求此模式时）

先完整阅读本文件，并读取 references/swimlane-rules.md。此模式下只识别业务，输出对话或一个符合请求指定结构的 JSON 代码块；不执行绘图脚本、不访问用户私有文件、不自行保存画布。应用负责验证、布局、生成和保存。依据用户输入保持原始步骤、分支、回退及并行语义，禁止为满足图形规范而删改业务；退回使用 kind="return" 指向前序节点；多条退回可以指向同一个前序活动，不要为此新增重复活动或更改目标；并行必须使用 parallel_split、parallel_join 网关，所有并行分支均在汇合网关合流后继续。常规边使用 kind="forward"，前向图必须无环。不能确定回退目标、分支或汇合条件时先追问。绘图质量规则适用于应用的布局和校验，不允许模型编造坐标。

## 环境定位（仓库自包含，克隆即用）

```bash
# 从解压后的工具根目录运行
PROJ="$(pwd)"
node "$PROJ/bin/aipros-flow.js" --help
```

形状库（4924 形状）随仓库 `vendor/renderer` 自带，CLI 克隆即可离线使用。
Web 服务：`node server/index.js`（端口 3900），浏览器打开 `http://localhost:3900/editor`。

## 快速流程图（CLI 命令）

```bash
aipros-flow init f.posf -t "标题"
aipros-flow node f.posf -s terminator --text "开始" --id n1   # 形状: terminator/process/decision/document/data...
aipros-flow link f.posf n1 n2 --text "是"                     # 连线（可加标签）
aipros-flow layout f.posf                                      # ELK 自动布局
aipros-flow export f.posf -o f.svg                             # 导出 SVG
aipros-flow info f.posf                                        # 查看结构
aipros-flow shapes -c flow                                     # 查看形状目录（4924 个）
aipros-flow open f.posf                                        # 官方客户端打开（roundtrip 验证）
```

节点 ID 用 `--id` 自定义（n1/n2 便于引用）。返回值为节点 ID。

## 泳道图（规范铁律，必须逐条遵守）

1. **泳道自上而下**：horizontalPool + horizontalLane，每条泳道一个部门/角色
2. **纵轴不重叠**：每个（泳道×列）格子最多一个活动；有先后顺序的活动必须在不同列
3. **连线只左进右出**：活动框的所有出线必须从右侧边缘的正中心水平向右离开，所有入线必须从左侧边缘的正中心水平向右进入；严禁从上边、下边或偏离中心的位置连接，也不能在边缘立即转为竖线。多条线连接同一活动时共享同一个中心点，在活动外分流或汇流；连线不能交叉。
4. **线不穿活动**：连线的竖直段只能走在两列之间的间隙里
5. **必须有标题**：图顶部加大字号 text 节点 + meta 标题
6. **活动必须有名称**：官方目录中 process/decision/terminator 不带 textBlock，生成时必须补默认 `[{position:{x:5,y:0,w:"w-10",h:"h"}}]`
7. **保留业务逻辑**：克制活动数量；确有退回重审时，标记退回线并绕过活动，不得为了排版删除回退。非网页模式如生成器不支持回退，应说明限制。
8. **开始与结束同泳道**：所有开始节点和结束节点都放在同一条泳道；例如开始位于第一条泳道，结束也位于第一条泳道。共同泳道不强制必须是第一条，其他业务活动仍按实际责任部门放置。

## 泳道图生成方法

不要手写坐标，复制模板改内容：

```bash
cp "$PROJ/scripts/swimlane-demo.js" /tmp/my-swimlane.js
# 修改: LANES 数组（泳道名）、node() 调用（泳道名、列号、形状类型、文字）、link() 调用
node /tmp/my-swimlane.js    # 产出 data/docs/<名称>.posf
```

模板已内置：两遍正交路由（从中心点出入并在节点外部分流、同列竖线横向散开）、格子约束。
几何约定：`COL_PITCH=210`、节点 140×50、判断 120×80、泳道高 130。

**生成后必须跑规范校验**（右出左入/不重叠/不穿活动/竖线重叠），校验脚本见 [references/swimlane-rules.md](references/swimlane-rules.md)，4 项全过才算交付。

## 导出

- SVG：`aipros-flow export f.posf -o f.svg`
- 高清 PNG（≥3x）：浏览器打开 `http://localhost:3900/editor?doc=<名称>` → 文件 → 导出为 → 图片（PNG/JPG），或 SVG/PDF/POS
- .posf 本身可直接交给用户在官方客户端编辑

## 注意

- 文档 `type` 字段写 `AIPROS Schema File`（引擎已验证兼容）
- 品牌一律"詹 · AIPROS 流程图"；不要在产物中出现对方品牌字样
- 多行活动文字用 `\n`；颜色 fillStyle 用 "R,G,B" 字符串
