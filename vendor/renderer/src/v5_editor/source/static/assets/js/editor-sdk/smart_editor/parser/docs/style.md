# Smart Graphics DSL 样式语法规则（独立规范）

## 一、语法定义

节点样式使用中括号 `[]` 表示，紧跟在节点之后：
```dsl
<node>[key:value, key:value]
```
---

## 二、核心规则（强约束）

### 1. 使用条件

- **只有存在样式属性时才允许使用 `[]`**
- **禁止出现空 `[]`**

✅ 合法：
```dsl
title[icon:target]
```
❌ 非法：
```dsl
title[]
```
---

### 2. 紧贴规则

- `[]` 必须紧贴节点
- **前后不允许换行**

✅ 合法：
```dsl
title[icon:target]
```
❌ 非法：
```dsl
title  
[icon:target]
```
---

### 3. 键值格式

- 使用 `:` 连接 key 和 value
- 不允许使用 `=`

✅ 合法：
```dsl
[icon:target]
```
❌ 非法：
```dsl
[icon=target]
```
---

### 4. 多属性规则

- 多个属性使用 `,` 分隔
- 不允许尾随逗号

✅ 合法：
```dsl
node[icon:target,color:red]
```
❌ 非法：
```dsl
node[icon:target,]
```
---

### 5. 当前支持字段

仅支持以下字段：

- icon

示例：
```dsl
node[icon:name]
```
---

### 6. 值类型

value 支持：

- 字符串（默认不加引号）
- 不允许包含未转义空格或特殊分隔符

---

### 7. 闭合规则

- `[]` 必须完整闭合

❌ 非法：
```dsl
node[icon:target
```
---

## 三、适用范围

样式可作用于任意节点，包括但不限于：

- key
- value
- 对象节点
- 数组元素
- 文本节点

---

## 四、合法示例
```dsl
title[icon:target]

节点[icon:name]:

title: 企业战略框架[icon:target]

愿景与使命[icon:flag]
```
---

## 五、非法示例
```dsl
node[]    
node[icon:target,]  
node[icon=target  
```
---

## 六、规则总结

节点样式必须满足：

1. 非空（禁止 `[]`）
2. 紧贴节点（无换行）
3. 使用 `key:value`
4. 多属性用 `,` 分隔
5. 必须闭合
6. 当前仅支持 `icon`