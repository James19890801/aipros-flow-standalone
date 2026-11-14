# Smart Graphics DSL - timeline 类型 data 语法规则

## 一、整体结构

```dsl
title: <text><style?>   %% 可选，全局标题，必须在 data 前
type?: layeredHorizontal  type 可选，有代表是分层时间轴 layeredHorizontal ｜ layeredVertical 
data {
  - <node><style?>
    time: <time-text><style?>
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

### 1. 节点标题

```dsl
- <node><style?>
```

### 2. 时间字段（必须）

```dsl
time: <time-text><style?>
```

### 3. 描述字段（必须）

```dsl
desc: <desc-text><style?>
desc: <desc-text><style?>
```

规则：

1. 每个节点必须包含且仅包含一个 `time`
2. 每个节点至少包含一行 `desc`
3. `desc` 多行按 `\n` 合并
4. `node/time/desc` 的 value 都可附加样式

---

## 三、完整示例

```dsl
title: 项目里程碑[icon:target]

data {
  - 愿景与使命[icon:flag]
    time: 阶段1[icon:clock]
    desc: 定义企业长期发展方向
    desc: 强调长期价值与增长路径[icon:note]

  - 战略目标[icon:list]
    time: 2026-10-01
    desc: 设定阶段性业务指标
}
```
