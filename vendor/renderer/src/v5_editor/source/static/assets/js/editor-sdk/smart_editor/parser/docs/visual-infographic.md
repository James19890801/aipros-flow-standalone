# Smart Graphics DSL - visual 类型 data 语法规则

## 一、适用范围

用于“视觉信息图（visual）”场景：DSL 需要同时满足两点：

1. 可明确判定为 `visual` 类型
2. 在 `data` 中携带图片 URL

---

## 二、与公共规范的关系

`visual` 类型遵循 `common.md` 的公共骨架（`smart -> theme -> data`），并在本类型中收紧为“最小必填字段”：

1. `smart` 固定为 `smart visual`
2. `theme` 必填且仅一次
3. `data.url` 必填且仅一次
4. `data.ratio` 可选
5. 不要求 `variant`、`title`、`prompt`、`negative`、`size`

---

## 三、整体结构

```dsl
smart visual

theme <theme-id>                  %% 必填，且不使用引号

data {
  url: <image-url>                %% 必填，建议使用 http/https
  [ratio: <ratio>]                %% 可选，枚举值见下文
}
```

---

## 四、字段规则

### 1. `smart`（必须）

```dsl
smart visual
```

规则：

1. 必须为第一条有效语句
2. `visual` 不使用 `variant`

### 2. `theme`（必须，且仅一次）

```dsl
theme modern-clean-v1
```

规则：

1. 必须声明且仅能声明一次
2. value 表示主题风格 id（style id）
3. `theme-id` 必须为无引号文本，不允许 `"`、`'`、`` ` `` 包裹

### 3. `data`（必须）

```dsl
data {
  url: <image-url>
  [ratio: <ratio>]
}
```

规则：

1. 必须包含且仅包含一个 `url`
2. `url` 必须为非空文本
3. 建议使用 `http://` 或 `https://` 开头
4. 由于 URL 可能包含特殊字符，建议使用引号或反引号包裹
5. `ratio` 为可选字段，若出现则仅允许以下值：`1:1`、`16:9`、`9:16`、`4:3`

`ratio` 取值说明：

| ratio | 比例类型 | 建议分辨率 | 典型场景 |
|---|---|---|---|
| `1:1` | 方形 | `1024x1024` | Instagram、小红书 |
| `16:9` | 宽屏 | `1920x1080` | PPT、B站封面 |
| `9:16` | 竖屏 | `1080x1920` | 抖音、朋友圈 |
| `4:3` | 标准 | `1024x768` | 课件、文档配图 |

---

## 五、返回约定

`visual` 类型处理成功后，返回结果使用 DSL 文本，且仅保证以下结构：

```dsl
smart visual

theme <theme-id>

data {
  url: <image-url>
  [ratio: <ratio>]
}
```

---

## 六、完整示例

```dsl
smart visual

theme modern-clean-v1

data {
  url: `https://cdn.example.com/visual/ai-overview.png`
  ratio: 16:9
}
```

---

## 七、`ratio` 位置选择优缺点

### 方案 A：放在 `data`（`data.ratio`）

优点：

1. 与 `url` 同属“出图请求参数”，语义一致
2. 单次请求可独立指定比例，不受主题耦合
3. 解析与校验简单，规则清晰
4. 与当前 `visual` 最小协议一致，改动最小

缺点：

1. 同一主题在多次请求中需要重复填写 `ratio`
2. 无法在主题层天然沉淀“默认比例”

### 方案 B：放在 `theme` 覆盖块（`theme <id> { ratio: ... }`）

优点：

1. 可将比例作为主题默认配置，减少重复填写
2. 对“固定风格 + 固定画幅”的场景更友好

缺点：

1. `ratio` 从请求参数变为主题参数，语义边界变弱
2. 需要新增优先级规则（例如 `data.ratio > theme.ratio`）
3. 会增加解析器与文档复杂度，且与当前最小协议不一致

结论：

1. 当前推荐 `ratio` 放在 `data`
2. 若未来要支持主题默认比例，可增量支持 `theme.ratio`，并明确优先级：`data.ratio > theme.ratio > 默认值`
