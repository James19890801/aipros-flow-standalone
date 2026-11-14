# ProcessOn Smart Graphic Editor SDK Full Bundle

当前包名：`processon-smart-graphic-sdk-full-smart`

## 包含能力

- `smart` - Smart 编辑器能力已包含
- `flow` - 当前压缩包未包含
- `mindmap` - 当前压缩包未包含

## 包含文件

- `editor-sdk.es.js` - ES Module SDK 产物
- `editor-sdk.umd.js` - UMD SDK 产物
- `api/` - SDK iframe 入口页与运行时资源
- `smart_editor/` - Smart 编辑器静态资源

## token 模式

- `needToken=false`
- `needToken=true`：保持真实 token 校验
- `needToken=false`：仅跳过校验逻辑，token 协议仍保留，第三方仍需传任意非空 token

## 接入方式

部署后的静态目录示例：

```text
/your-static/processon-smart-graphic-sdk-full-smart/
  editor-sdk.umd.js
  api/
  smart_editor/
```

初始化示例：

```js
const sdk = new window.POSmartEditor.EditorAPISDK({
  container: document.getElementById('editor'),
  mode: 'edit',
  apiBaseUrl: '/your-static/processon-smart-graphic-sdk-full-smart',
  accessToken: 'any-non-empty-token'
})
```

## 说明

- `apiBaseUrl` 在 full bundle 模式下表示“静态资源根目录”
- 部署路径支持多层级目录
- 压缩包解压后的目录名（例如 `processon-smart-graphic-sdk-full-smart`）只是默认示例名，可以按第三方自己的静态资源目录规范重命名；只要最终 `apiBaseUrl` 指向重命名后的资源根目录即可
- 当前包的能力边界由 `bundleTargets` 决定，未包含的编辑器类型调用时必须显式报错
