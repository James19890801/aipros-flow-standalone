# 独立流程图与 AI 助手

此版本是本机单用户的流程图编辑器，包含 AI 悬浮球、对话项目、自动生成泳道图、跨部门连线与退回标识、文本/图片/PDF/DOCX 输入、流式输出、Codex CLI 本地桥接、Qoder Cloud Agent 接口和 `aipros-flowchart` Skill。无需其他平台账号。

## 环境与启动

需要 Node.js 20 或更高版本。解压后在本目录执行：

```bash
npm ci --omit=dev
node server/index.js
```

在浏览器打开 http://localhost:3900/。首次启动会自动创建空白画布和本地 `data/` 目录；AI 项目、画布和配置均保存在该目录。服务只监听本机回环地址，不提供多用户登录，不要直接将它暴露到公网。

## 连接本机 Codex CLI

安装并登录 Codex CLI，另开一个终端，在本目录执行：

```bash
AIPROS_BRIDGE_TOKEN_FILE=data/local-bridge-token node scripts/local-agent-bridge.cjs
```

保持该终端运行。在页面点击 AI 悬浮球 → 智能体配置 → 选择“本地 CLI” → “重新连接”。如需指定已有模型或代理，可设置 `AIPROS_CODEX_MODEL`、`AIPROS_CODEX_PROXY`；桥接仅修改子进程环境。Windows PowerShell 示例：

```powershell
$env:AIPROS_BRIDGE_TOKEN_FILE='data/local-bridge-token'
node scripts/local-agent-bridge.cjs
```

本机 CLI 使用本目录 `skills/aipros-flowchart/` 中的 Skill。不要把自己真实的 `data/` 目录或令牌放进公开仓库。

## 配置 Qoder Cloud Agent

打开悬浮球的智能体配置，选择“Qoder Cloud Agent”，填写自己的区域、Agent ID、Environment ID 和访问令牌并保存；也可以选择“本地优先，云端兜底”。此包未包含任何云端账号、令牌、Agent 或已预置的云端服务。需要自行在 Qoder 创建配置，云端调用会消耗自己的额度；如果 Agent 绑定自己的云端 Skill，可上传本包中的 `skills/aipros-flowchart/`。独立版也会向 QCA 请求提供本包 Skill 规则。凭据以本机生成的密钥加密后保存在 `data/`，不要将该目录分享给他人。

## 其他说明

- 每个对话项目绑定一个画布；点击“＋”可创建新项目。生成完整 JSON 并通过验证后自动打开画布。
- 附件支持 PNG/JPEG/WebP、文本型 PDF 和 DOCX；扫描版 PDF 请先 OCR 或转成图片。
- `bin/aipros-flow.js` 是绘图 CLI；项目 Skill 位于 `skills/aipros-flowchart/`，可按需安装到本地智能体。
- 没有预置对话、业务文档、账号数据、私有仓库链接或云端凭据。`npm ci` 需要联网下载公开依赖。

## 第三方组件

编辑器资源 `vendor/renderer` 含有 ProcessOn 相关引用，其来源和再分发许可尚未核实。根目录 MIT 许可仅适用于项目作者有权授权的原创代码；第三方组件不因此获得 MIT 授权。详见 [第三方说明](THIRD_PARTY_NOTICE.md)。
