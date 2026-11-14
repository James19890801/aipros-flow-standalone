# Smart Graphics DSL - list/process/relationship 类型 data 语法规则

## 一、支持图形与 DSL 头格式

支持图形来源：

1. `src/parser/syntactic/smart_type.xlsx`
2. `src/parser/syntactic/smart_type.json`

DSL 头统一为：

```dsl
smart + type + variant
```

其中 `variant` 对应 `smart_type.xlsx` / `smart_type.json` 中的 alias 值。

示例：

```dsl
smart list slp_ser_topcard
smart process pr_ss_s_flow
smart relationship rl_vs_items_pk
```

---

## 二、支持图形表

| variant | type | 描述 |
|---|---|---|
| dcp_circular_track | list | 中间圆形扩散图片,两侧列表,<br>任务标签（字母），短句描述，无编号，顺序排列 |
| grp_topimg_card_ns | list | 每项垂直排列，序号、标题、描述、图片， 图片辅助 |
| grp_ser_under_st | list | 基本标题描述块列表，顶部编号，每项宽度一致，最后一行默认宽度拉伸整行，序号突出 |
| grp_ser_under_ns | list | 基本标题描述块列表，顶部编号，每项宽度一致，最后一行不拉伸，序号突出 |
| grp_text_under_st | list | 基本标题描述块列表，顶部编号，每项宽度一致，最后一行默认宽度拉伸整行，序号不突出 |
| grp_text_under_ns | list | 基本标题描述块列表，顶部编号，每项宽度一致，最后一行不拉伸，序号不突出 |
| grp_jobimg_card_ns | list | 图片列表，照片，人物介绍 |
| scp_ser_underline_ns | list | 数字序号，阶段标题，详细描述文本，流程步骤图标，分级标题 |
| scp_palace | list | 主标题居中，子标题加粗，大段占位文本，无图标或连接线 |
| scp_key_graph | list | 钥匙图形主视觉,线性描边插画风格,多色区分要点,图标化提示箭头,要点列表结构,视觉聚焦明显,留白充足 |
| scp_house_graph | list | 左图右文布局,图文分栏结构,,单页信息图布局，图为多个小房子，对应多个块 |
| scp_target_graph | list | 左图右文布局,图文分栏结构,,单页信息图布局，箭头靶心/指示图标,留白充足,视觉重心明确 |
| scp_rainbow | list | 弧形图形,颜色区分区块,文本配套 |
| scp_spiral_ladder | list | 螺旋状，图文列表，图标在文本块前 |
| scp_watchtower | list | 瞭望塔，图文列表，塔中有图标 |
| scp_column_rise | list | 彩色柱，阶段柱，图文列表 |
| scp_serial_ns | list | 编号卡片，阶段标题，详细描述段落，流程步骤指示器，结构化文本块 |
| scp_serial_card | list | 阶段标题，描述段落，右侧大号数字，空白分隔区域，流程步骤指示 |
| scp_icon_top_ns | list | 无边框，优势标题 |
| scp_icon_ns | list | 标题区块 |
| scp_curve_list | list | 表格行，阿拉伯数字序号，步骤标题，英文描述文本，结构化流程条目 |
| scp_only_arrow | list | 分级标题，数字编号，简短说明，缩进文本，步骤化条目 |
| scp_arrow_list | list | 中英混杂文本，数字编号，简短描述，并列标题，结构性列表 |
| scp_basic_ns | list | 加粗项目符号条目，段落描述 |
| slp_ser_topcard | list | 数字序号标识，文字说明模块，色块区分阶段，宫格布局模块，文字分段展示 |
| slp_text_window | list | 数字编号列表, 中英双语内容, 多级信息区块, 子标题加粗, 编号与文字结合 |
| slp_paper_cut | list | 中英双语标题, 小标题加粗, 分块内容, 描述性文本段落, 无装饰性图表 |
| slp_paper_icon | list | 中英双语内容,重复性结构,标题与副标题配对,文本段落 |
| slp_question | list | 竖向引导线, 圆点锚点, 图标符号, 左侧主视觉元素, 多栏文本模块, 颜色区分分组, 扁平化设计 |
| slp_rect_arrow | list | 竖向引导线, 圆点锚点, 图标符号, 左侧主视觉元素, 多栏文本模块, 颜色区分分组, 扁平化设计 |
| slp_icon_train | list | 竖向引导线, 圆点锚点, 图标符号, 左侧主视觉元素, 多栏文本模块, 颜色区分分组, 扁平化设计 |
| slp_series_rect_ns | list | 多级标题，序号编码，描述性段落，阶段流程分解 |
| slp_title_rect_st | list | 标题区块,分节序号,项目符号,段落文本,阶段性标题 |
| slp_ser_rectleft | list | 数字序号标题，无复杂图形或图表，模块化排列，强序列感,<br>分区明确 |
| slp_title_bg | list | 序号,每项标题特别突出,纯文本段落，模块化区块，信息层级分明 |
| slp_icon_arrow | list | 每项图标化元素,图标圆形突出显示,  等距排列, 图文分区, 标题和图标变化颜色 |
| slp_icon_line | list | 规整排列的矩形区域，统一的视觉区块,标题和图标变化颜色 |
| slp_icon_flower | list | 信息块重复结构 标题突出, 条目化排列,盆花从小到大 |
| slp_rect_msg | list | 区块化内容, 小标题加粗或突出, 问答结构, 说明性文本, 标题与正文分隔 |
| slp_icon_temple | list | 标题与子项缩进关系, 项目符号列表, 标题与说明文字配对, 结构化条目 |
| slp_text_rect | list | 中英双语内容混合, 分段标题, 多段描述性文本, 无序号列表 |
| pr_hh_order_arrow | process | 每个流程项内容上中下排列，图标、图形（序号）、内容块 |
| pr_hh_uni_arrow | process | 箭头型模块,色块区分阶段，图文分区清晰 |
| pr_ll_linear | process | 极简抽象阶梯、台阶图形，只有标题和图标，无描述 |
| pr_ll_color_lad | process | 阶梯、台阶图形，只有标题和图标，无描述 |
| pr_ll_var_ladder | process | 左右分栏，左栏为层级列表，右栏为数字纵向排列， 立柱形台阶 |
| pr_lt_area_trend | process | 底部蓝色区域向上，块级区分，标题、描述<br> |
| pr_lt_up_trend | process | 向上箭头，分块排列，阶段编号 |
| pr_lv_curve_right | process | 大号编号，标题行，图标，描述文本截断， |
| pr_pv_stair_list | process | 递进式模块结构，左右分栏布局,色彩分区展示,图标装饰节点,文本配套对应 |
| pr_ss_s_flow | process | 简易直线箭头连接，每项图标在轴上，文本分块 |
| pr_ss_u_flow | process | 序号编号，标题描述，文本分块，简易直线箭头连接 |
| pr_vv_arrow_ns | process | 左图右文，图形内编号 |
| rl_vs_items_pk | relationship | 方案标题（A/B），对比标志“VS” |
| rl_ring_common | relationship | 基本循环，直线均分，短句描述，图标在环形内,<br>二级标题与描述对应， |
| rl_ring_doticon | relationship | 短句描述，标题层级清晰，无图标，无连接线,二级标题与描述对应， |
| rl_ring_round | relationship | 插件形状组成循环，短句描述，图标在环形内,<br>二级标题与描述对应， |
| rl_ring_wheel | relationship | 任务标签（，短句描述，标题层级清晰，图标在环形内,<br>二级标题与描述对应， |
| rl_halfcircle_icon | relationship | 标题,描述，图标半圆形内添加标题 |
| rl_half_ring | relationship | 主标题，任务标签顺序排列，图标在循环图形内,无任何描述 |
| rl_ring_arrow | relationship | 基本循环，折线均分，短句描述，图标在环形内,<br>二级标题与描述对应，突出箭头指向 |
| rl_ring_loop | relationship | 基本循环，折线均分，短句描述，图标在环形内,<br>二级标题与描述对应，弱箭头指向 |
| rl_ring_cycle | relationship | 二级标题，短句描述，标签,箭头流程,箭头指向 |
| rl_ring_noicon | relationship | 主标题，无描述或装饰,<br>箭头流程,箭头指向 |
| rl_matrix_poly | relationship | 标题加粗，段落描述，无编号，编号位为图标<br>标题与描述段落对应，中间插入“添加标题”占位行 |
| rl_radial_right | relationship | 标题错位重复，描述段落重复，文本断裂，无编号，结构混乱 |

---

## 三、data 整体结构

```dsl
title: <text><style?>   %% 可选，全局标题，必须在 data 前

data {
  - <node><style?>
    desc: <desc-text><style?>
    desc: <desc-text><style?>
}
```

---

## 四、节点规则

### 1. `title`（可选，全局）

```dsl
title: <text><style?>
```

说明：

1. 整张图标题，可省略
2. 仅支持单行
3. 可附加样式
4. 必须写在 `data` 之前

### 2. 节点列表（必须）

```dsl
- <node><style?>
  desc: <desc-text><style?>
```

规则：

1. 节点以 `-` 开始
2. 每个节点至少包含一行 `desc`
3. `desc` 支持多行，解析时按 `\n` 合并
4. `desc` 支持样式（可选）

---

## 五、完整示例

```dsl
title: 企业战略框架[icon:target]

data {
  - 愿景与使命[icon:flag]
    desc: 定义企业长期发展方向
    desc: 强调长期价值与增长路径[icon:note]

  - 战略目标[icon:list]
    desc: 设定阶段性业务指标
}
```
