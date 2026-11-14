# Smart Graphics DSL - orgchart 类型 data 语法规范（v1.1）

## 一、整体结构

```dsl
title: <text><style?>   %% 可选，全局标题，必须在 data 前

data {
  - <node><style?>
    parent: <node-title|root>
    <field-key>: <field-value>
    <field-key>: <field-value>
}
```

说明：

1. 节点使用 `-` 开始
2. 节点关系通过 `parent` 建立
3. 顶层 `root: <node-title>` 不再使用
4. 根节点通过 `parent: root` 声明

---

## 二、字段规则

### 0. 全局标题（可选）

```dsl
title: <text><style?>
```

规则：

1. 只能声明一次
2. 必须写在 `data` 之前

### 1. 节点标题（必须）

```dsl
- <node><style?>
```

规则：

1. 同一 data 内允许重复，重复标题是多个独立节点
2. 可附样式
3. 节点 id 按出现顺序分配，不取标题

### 2. parent（必须）

```dsl
parent: <node-title>
parent: root
```

规则：

1. 每个节点都必须声明 `parent`
2. 允许一个或多个节点声明 `parent: root`，这些节点都视为根节点
3. 其他节点的 `parent` 必须引用同一 data 内节点（允许前向引用）
4. 标题重复时，`parent` 绑定到该节点上方最近的同名节点；上方没有时，绑定到后文第一次出现的同名节点
5. `parent` 不支持样式

### 3. 扩展字段（可选）

```dsl
role: 首席执行官
department: 总裁办
```

规则：

1. 支持任意 `<field-key>: <field-value>`
2. 常见字段：`role`、`department`、`phone`、`email`、`location`

---

## 三、合法性约束

1. 至少一个节点
2. 至少一个根节点（`parent: root`），允许多个根节点并列
3. 禁止环

---

## 四、完整示例

```dsl
title: 组织架构[icon:org]

data {
  - 张伟[icon:ceo]
    parent: root
    role: 首席执行官
    department: 总裁办

  - 李明[icon:cto]
    parent: 张伟
    role: 首席技术官
    department: 技术中心

  - 王芳[icon:cfo]
    parent: 张伟
    role: 首席财务官
    department: 财务中心

  - 陈静[icon:director]
    parent: 李明
    role: 技术总监
}
```
