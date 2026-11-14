# Smart Graphics DSL - pyramid 类型 data 语法规则

## 一、整体结构

```dsl
title: <text><style?>   %% 可选，全局标题，必须在 data 前

data {
  - <node><style?>
    desc: <desc-text><style?>
}
```

---

## 二、节点规则

### 0. 全局标题（可选）

```dsl
title: <text><style?>
```

规则：

1. 只能声明一次
2. 必须写在 `data` 之前

```dsl
- <node><style?>
  desc: <desc-text><style?>
```

规则：

1. 节点以 `-` 开始
2. 每个节点至少包含一行 `desc`
3. `desc` 支持多行，解析时按 `\n` 合并
4. `node/desc` 的 value 都可附加样式
5. 节点顺序决定金字塔层级顺序

---

## 三、完整示例

```dsl
title: 需求层次模型[icon:target]

data {
  - 愿景与使命[icon:flag]
    desc: 定义企业长期发展方向
    desc: 强调长期价值与增长路径[icon:note]

  - 战略目标[icon:list]
    desc: 设定阶段性业务指标
}
```
