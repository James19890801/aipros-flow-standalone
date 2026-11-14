# Smart Graphics DSL 通用语法规范（抽象层）

## 一、设计目标

本规范定义 Smart Graphics DSL 的通用骨架，不约束具体图形 type 的 data 语义。

---

## 二、DSL 标准结构

返回 DSL 头格式：`smart + type + variant`

```dsl
smart <type> <variant?>

[theme <theme-id-or-name>]            %% 二选一
[theme <theme-id-or-name> {
  <key>: <value>
}]                                     %% 二选一

[title: <text><style?>]                %% 可选，全局标题

data {
  <type specific structure>
}
```

说明：

1. `theme` 可写 0 次、1 次
2. `theme <id>` 表示启用主题
3. `theme <id> { ... }` 表示对该主题做局部覆盖（对象内配置覆盖指定主题样式）
4. `title` 为全局标题，可选，必须写在 `data` 之前
5. `data` 必须存在

---

## 三、字段级规范

### 1. `smart`（必须）

```dsl
smart <type> <variant?>
```

规则：

1. 必须为第一行
2. `type` 必填
3. `variant` 选填；当 `type` 为 `list/process/relationship` 时必填，取值见 `infographic.md` 的支持图形表

示例：

```dsl
smart timeline
smart list slp_ser_topcard
smart process pr_ss_s_flow
smart relationship rl_vs_items_pk
```

### 2. `theme`（可选，最多一次）

语法 1（仅声明主题）：

```dsl
theme basic-theme
theme "brand theme"
theme 'brand theme'
theme `brand theme`
```

语法 2（声明 + 覆盖）：

```dsl
theme basic-theme {
  primaryColor: "#2F6BFF"
  borderRadius: 8
}
```

规则：

1. 主题 id/name 支持无引号文本，以及 `"`、`'`、`` ` `` 三种引号文本
2. 只能声明一次主题；如需覆盖样式，使用 `theme <id> { ... }` 同一条声明
3. 覆盖对象支持常见 value（string/number/boolean/object/array）

### 3. `data`（必须）

```dsl
data {
  <type specific structure>
}
```

规则：

1. 必须存在
2. 语义由 `type` 自定义
3. 通用层只保证块结构完整

### 4. `title`（可选，全局）

```dsl
title: <text><style?>
```

规则：

1. 只能声明一次
2. 必须写在 `data` 块之前
3. 支持样式（例如 `icon`）

---

## 四、内容与特殊字符规则

### 1. 引号包裹

默认可不加引号，解析器按宽松容错处理普通文本。

解析器支持 `"`、`'`、`` ` `` 三种引号包裹文本。

文档推荐统一使用：`` ` ``（反引号）。

推荐使用引号的场景：

1. 文本包含 `:`、`{`、`}`、`[`、`]`
2. 文本包含 `,`（非必须，但更清晰）
3. 需保留前后空格

### 2. 保留关键字

保留关键字：

- `smart`
- `theme`
- `data`
- `nodes`
- `node`
- `end`
- `root`
- `parent`

与关键字同名的普通文本应使用引号（推荐反引号）。

### 3. 转义（废弃）

转义能力为兼容历史 DSL 保留，解析器仍支持。

推荐：

1. 新 DSL 优先使用引号表达文本，不再依赖转义
2. 仅在存量内容迁移或兼容场景中继续使用转义

兼容支持的转义字符：

`\\`、`\"`、`\'`、`\``、`\n`、`\t`、`\:`、`\,`、`\[`、`\]`、`\{`、`\}`

### 4. 注释

以 `%%` 开头的整行视为注释。

---

## 五、示例

```dsl
smart list slp_ser_topcard

theme basic-theme {
  primaryColor: "#2F6BFF"
}

title: 企业战略框架[icon:target]

data {
  - 愿景与使命[icon:flag]
    desc: 定义企业长期发展方向
}
```
