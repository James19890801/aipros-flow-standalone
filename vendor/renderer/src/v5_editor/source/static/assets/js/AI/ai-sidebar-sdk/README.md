# ProcessOn AI 侧边栏 SDK：脑图编辑器接入指南

## 1. 交付文件

部署 SDK 文件，并将 React 18.3.1 放到同一静态资源根目录下：

```text
assets/js/
├── AI/ai-sidebar-sdk/
│   ├── processon-ai-sidebar-sdk.min.js
│   ├── processon-ai-sidebar-sdk.min.css
│   └── README.md
└── react/18.3.1/
    ├── react.production.min.js
    └── react-dom.production.min.js
```

SDK 是浏览器 IIFE 包，不要求接入方使用 npm、Webpack 或 ES Module。JavaScript 只包含公共侧边栏、ProcessOn 平台服务和语音识别器，不包含流程图的 Dock、入口按钮及画布适配代码。

## 2. 页面引入

```html
<link rel="stylesheet" href="/your-static/ai-sidebar-sdk/processon-ai-sidebar-sdk.min.css">
<script src="/your-static/ai-sidebar-sdk/processon-ai-sidebar-sdk.min.js"></script>
```

脚本加载后提供全局对象：

```js
window.ProcessOnAISidebarSDK
```

主要导出：

- `createProcessOnAISidebar(options)`：ProcessOn 编辑器推荐入口，内置历史、附件、语音、AI 点数及鉴权桥接。
- `createProcessOnHostServices(options)`：单独创建 ProcessOn 平台服务。
- `createAISidebar(options)`：完全自定义平台服务时使用的底层入口。
- `processOnRuntimeConfig`：默认 AI SDK Runtime 地址。

## 3. 容器要求

SDK 不负责打开或关闭脑图编辑器的侧栏。接入方创建自己的 Dock，并为挂载容器提供明确宽高：

```html
<div id="mind-ai-sidebar"></div>

<style>
    #mind-ai-sidebar {
        width: 416px;
        height: 100%;
    }
</style>
```

## 4. 最小接入示例

```js
const {createProcessOnAISidebar} = window.ProcessOnAISidebarSDK;

const mindAdapter = {
    // 每次发送及读取历史前都会重新获取，不能缓存文件或画布信息。
    getRequestContext({selectionReference} = {}) {
        const selectedIds = selectionReference?.ids || [];
        return {
            chartId: window.chartId || '',
            defId: getCurrentMindPageId(),
            selectedShapeIds: JSON.stringify(selectedIds),
        };
    },

    // 必须由脑图编辑器实现：operation 已由 SDK 统一判断。
    applyDiagramArtifact({operation, content, diagramType, editContext, selectedShapeIds, isEnd}) {
        return applyMindArtifact({operation, content, diagramType, editContext, selectedShapeIds, isEnd});
    },

    // 可选：新会话时清理脑图侧的 AI 会话状态。
    reset() {},

    // 可选：销毁侧边栏时解绑 Adapter 自己创建的监听。
    destroy() {},
};

const sidebar = createProcessOnAISidebar({
    container: document.getElementById('mind-ai-sidebar'),
    editorType: 'mindmap',
    platform: {
        getUserId: () => (
            window.editorGlobalConfig?.userObj?.userId ||
            window.editorGlobal?.authObj?.userId ||
            window.userObj?.userId ||
            ''
        ),
    },
    editorAdapter: mindAdapter,
    // 初始只读状态；只读页仍可手动展开面板，但不可发起 AI 操作。
    readOnly: Boolean(getMindReadonly()),
    showAiPoints: false, // 可选；优先于宿主 showAiPoints 配置
    skillEntry: {
        title: '技能',
        icon: {name: 'skill'}, // 也支持 {src} 或 {className, text}
    },
    welcome: {
        title: '今天想用 AI 做点什么呢',
        description: '描述你想创建或调整的脑图内容',
        placeholder: '你可以这样提问：生成一份产品规划脑图。',
        recommendations: [
            {
                label: '生成产品规划',
                prompt: '生成一份产品规划脑图',
            },
            {
                label: '梳理项目风险',
                prompt: '梳理项目风险和应对措施',
            },
            {
                label: '整理会议纪要',
                prompt: '整理一份会议纪要脑图',
            },
            {
                label: '生成学习计划',
                prompt: '生成学习计划脑图',
            },
        ],
    },
    events: {
        onClose() {
            hideMindAiDock();
        },
        onSkillEntryClick({anchor, event}) {
            // 菜单内容、定位和后续技能逻辑均由脑图接入方实现。
            openMindAiSkillMenu({anchor, event});
        },
        onCollect(name, data) {
            // 使用脑图项目现有的埋点入口；SDK 不直接依赖具体采集库。
            window.poCollect?.(name, {pageName: '脑图', ...data});
        },
    },
});

sidebar.ready.catch(error => {
    console.error('AI 侧边栏初始化失败', error);
});
```

`readOnly` 仅设置初始状态。脑图编辑器的只读状态发生变化时，需要继续调用 `sidebar.setReadOnly(readOnly)` 同步。建议放在脑图统一的只读切换方法中，同时覆盖只读页和技能执行期间的临时只读。进入只读时 SDK 会停止当前生成、关闭历史面板并禁用会发起 AI 操作的交互，保留点数和关闭入口。

`showAiPoints` 可省略。显式配置时优先使用；省略时读取 `injectExtraAsynCall('showAiPoints')`，只有宿主严格返回 `false` 才隐藏顶部 AI 点数入口，未配置或返回 `undefined` 时默认显示。隐藏后按钮和对应交互事件均不创建。

`welcome.recommendations` 使用 `{label, prompt?}` 对象数组：欢迎页展示 `label`，点击后将 `prompt` 写入输入框；未配置或传入空 `prompt` 时写入 `label`。

AI 请求发出前，SDK 通过 `events.onCollect` 触发 `ai_draw_function`，携带 `requestContent` 和 `attachmentType`。`attachmentType` 无附件时为 `null`；图片、表格、文档、音频、网址和框选内容依次映射为 `image`、`excel`、`document`、`audio`、`web_link`、`po_file_selection`，多个类型使用 `/` 分隔。请求结束后触发 `ai_draw_result`，携带 `requestContent`、`edit_create`（`create` / `edit`）、`result`（`成功` / `手动关闭` / `错误关闭` / `AI权益不足`）和 `reason`（成功为空字符串，其他为 msg 或 code）；随后触发 `ai_draw_result_end`，携带 `edit_create`、`ai_duration`（秒）、`ai_credit_cost`、`diagramType`、`artifact_count`、`artifact_type` 和 `spawn_agent_name`。多个产物的图表类型和产物类型只取第一个，产物数量按完成态产物 ID 去重；多个派发智能体 ID 去重后使用 `/` 分隔。产物 DSL 分析或画布渲染失败时触发 `ai_sidebar_render_error`，顶层字段为 `diagram_type`、`action`、`failure_stage`、`error_code`、`error_message`、终态失败时的 `fail_streak` 和 `error_detail`。其中 `error_detail` 是可单字段导出的 JSON 字符串，包含请求/会话/用户/消息/产物 ID（`user_id` 取错误产生时的会话用户 ID，缺失时省略）、帧状态、完整错误分类、原始 DSL 和按场景出现的解析、编辑、operation、diff、泳道诊断；DSL 超过 20000 个字符时保留首尾片段并记录原始长度和截断状态。通用图形编辑逐条跳过失效目标、非法或不支持的 operation；最终有有效变更时应用合法操作并成功收口，跳过数量保留在诊断中。最终没有有效变更且包含非法或不支持的 operation 时按 DSL 错误上报；其余空 operation、目标已失效或合法操作未产生实际变化的结果以 `noChange` 成功收口，不显示渲染失败，也不上报 `ai_sidebar_render_error`。解析、布局或画布写入实际抛出的异常仍保留错误态。脑图接入方继续原样转发 `events.onCollect(name, data)`，不要再次序列化或展开已经是 JSON 字符串的 `error_detail`。用户手动停止后的收口失败不上报。AI 点数不足并成功调用宿主权益弹窗时触发 `ai_page_popup_show`，参数为 `popupName: 'limit_show'`。侧边栏按钮点击触发 `ai_page_click`，参数固定为 `{button, btn_pos}`；顶部与历史区、输入区、消息操作栏的 `btn_pos` 依次为 `side_bar`、`index_input_area`、`genpage_message_area`。`pageName` 等公共参数由接入方统一补充。

AI Client 返回 `failed`、`timeout`、`protocol_error` 或 `chat()` 自身抛出异常时，新增 `ai_sidebar_request_error`，每轮一次；接入方继续通过 `events.onCollect(name, data)` 原样转发，或判断该事件名监听。参数为 `request_id`、`thread_id`、`document_type`、`terminal_state`、`error_category`、`error_code`、`error_message`（最多 500 字符）、`http_status`、`biz_code`、`failure_stage`。错误码来自 ai-client，业务码和 HTTP 状态分别保留；阶段沿用 `error.details.stage`，用于区分本地校验、Token 和服务端错误。缺失分类/错误码分别补 `unknown` / `AI_REQUEST_FAILED`，HTTP 状态缺失为 `null`，其他缺失字段为空字符串；无错误对象时文案使用终态。该事件在预览补保存前采集，因此补保存成功时仍记录原始请求异常，而 `ai_draw_result` 继续返回成功。正常完成、停止、请求准备和渲染/收尾错误不触发，主动取消或切会话/销毁后的迟到异常不触发，不改变渲染连续失败计数；采集失败不影响原有请求处理。

上传文件、拖入/粘贴文件、长文本转 TXT 或添加网址遇到 SDK 本地数量/格式/大小限制时，触发 `ai_upload_file_limit`，一批只上报一次，部分接收也上报。参数如下，接入方通过现有 `events.onCollect(name, data)` 原样转发，不需额外接入；公共参数仍由接入方补充。

| 参数 | 类型与说明 |
| --- | --- |
| `limit_type` | String。`file_count_limit`、`invalid_file_format`、`file_size_limit` 按此顺序去重，以 `/` 连接。整批检查格式和大小，原有接收顺序和名额占用规则不变；不支持的格式不额外判断大小。 |
| `total_file_count` | int。操作前已有附件数 + 本次尝试添加数，包含上传中/失败项、网址及本次被拒绝项，排除零字节文件。 |
| `file_info_size` | String。已有附件在前、本次附件在后，以英文逗号连接，不加空格。单位 MB（字节除以 `1024 * 1024`，最多保留 4 位小数），网址为 `0`，无法获取的文件大小为 `unknown`；不扩展 AI 请求或历史协议。 |
| `file_info_format` | String。与大小一一对应，小写后缀、不带点，网址为 `url`，无后缀为 `unknown`；无需额外序列化。 |

名额满时点击网址按钮，按新增一个大小为 `0`、格式为 `url` 的尝试统计；名额未满仅打开输入框不触发。零字节文件、网址自身格式错误、服务端限制、网络/鉴权/上传失败和重试不纳入该事件。采集失败不影响上传。脑图及其他 SDK 接入方只需更新 SDK 包，无需修改上传服务。

`fail_streak` 表示同一会话内按图形产物最终结果通知顺序累计的连续失败次数：首次为 1，连续失败为 2、3……，筛选 `>= 2` 可定位连续失败。DSL 分析和画布写入的终态失败都计入，同一产物终态只累计一次；最终成功（包括 `noChange`）清零。流式中间帧失败、纯文字回复、请求/权益错误及用户停止不改变计数；新会话、切换历史、文件或用户变化后清零，不追溯历史。该值同时出现在顶层和 `error_detail` 中，中间帧错误不携带。一个请求有多个图形时按产物分别计算，不按提问轮次计算；接入方无需额外维护计数。

`skillEntry` 和 `events.onSkillEntryClick` 均为可选配置，只有两者同时有效时才显示输入框底部的单个技能图标。`skillEntry.title` 配置提示文字；`icon` 可使用内置 `{name: 'skill'}`、通过 `{src}` 传入图片 URL 或 Data URL，也可通过 `{className, text}` 复用宿主 Iconfont。SDK 不创建技能菜单，点击后仅回传原始事件和入口 DOM `anchor`，脑图接入方自行负责菜单内容、定位、关闭和技能逻辑。回调同步抛错或返回被拒绝的 Promise 时，错误会由侧边栏统一提示。

底部工具按“附件 → 技能（如有）→ 语音”排列在左侧，发送/停止按钮保持在右侧。prompt 非空或至少有一个附件已就绪时可发送；上传中、失败或正在编辑网址的附件仍会阻止发送，选区引用和技能入口本身不作为空 prompt 的发送条件。用户消息发出后到首条 AI 消息返回前，对话流显示“正在思考”提示。编辑历史用户消息时，SDK 会通过 `focusSelectionReference()` 复用点击引用标签的校验和定位；部分失效时使用警告提示并只回填有效引用，全部失效时只回填文字与附件。

示例里的 `getCurrentMindPageId`、`getMindReadonly`、`applyMindArtifact`、`hideMindAiDock` 和 `openMindAiSkillMenu` 是脑图编辑器需要替换的业务方法，不属于 SDK。

## 5. 产物写入协议

`editorAdapter.applyDiagramArtifact(artifact)` 是必需方法。参数结构如下：

```js
{
    id: '产物ID',
    title: '产物标题',
    operation: 'create', // create 或 edit，由 SDK 统一判断
    content: 'SDK 提取后的产物内容；编辑包装存在时为其中的 data',
    diagramType: '',     // 编辑时来自 editContext.diagramType；新建时可能为空
    editContext: undefined, // AI 返回编辑上下文时透传
    selectedShapeIds: undefined,
    isEnd: false         // 新建产物可能多次流式写入，最后一次为 true
}
```

实现要求：

- `operation === 'create'`：支持流式调用；`isEnd` 表示是否为最终帧。
- 脑图 POS 主题定义的顶层 `id` 必须为 `'root'`，且 `children` 必须为数组，才会在完整终帧以 `operation: 'create'` 原样传入。接入方的新建方法需要识别并插入该定义；现有 Markdown / `@` 层级流解析器不能直接渲染 POS。
- 图片还原返回完整流程图 `{elements, page, version}` POS 定义时，也仅在完整终帧以 `operation: 'create'` 原样传入；`elements` 为非空图形对象映射，图形包含 `id`、`name`、`props`。接入方需在新建方法中识别该格式，复用流程图插件的插入及静默预览能力。带 `editContext` 的编辑包装仍按 `operation: 'edit'` 处理，不改变已有编辑逻辑。
- 用户点击停止，或请求异常中断、缺少完整产物终帧、终帧渲染失败时，SDK 会将最后一份已接受的新建预览再次交给此方法并传入 `isEnd: true`，等待在途渲染且只补交一次；已正常保存的终帧不会重复提交。接入方支持按普通终帧保存即可，不需要改现有方法签名。新会话、切换历史和销毁不补交，编辑操作不提交部分结果。
- 可选实现 `finalizeDiagramArtifact(artifact, {reason})`，其中 `reason` 为 `user` 或 `interrupted`。SDK 优先使用该方法；适配器如需修复截断 DSL 或导出临时预览，请在此处理，随后复用自己的普通终帧保存方法。没有可保存内容或保存失败应返回 `false` / reject，不能仅因画布存在旧图形就返回成功。
- `operation === 'edit'`：只会在 SDK 判断出编辑且产物完整后调用，使用 `content`、`editContext` 和 `selectedShapeIds`。
- 流式内容尚不足以判断 `operation` 时，SDK 会等待后续帧，不会提前调用 Adapter。
- 脑图接入只需根据 `operation` 选择新建或编辑方法，不需要重复解析 DSL 来判断操作类型。
- 同步成功可返回任意非 `false` 值；同步拒绝返回 `false`。
- 异步渲染应返回 Promise；Promise resolve 表示接受本帧，无预览/跳过应返回或 resolve `false`，真实错误应 reject。终帧 resolve 必须代表实际已提交保存，不能仅代表预览已显示。SDK 不直接负责脑图持久化。
- 新建产物类型由脑图编辑器根据 DSL 判断；编辑产物使用 `editContext.diagramType`。

建议先将脑图的实际落图方法包装为 Promise，再从 Adapter 返回，以便侧边栏正确展示最终成功或失败状态。

异常收尾保存成功后，SDK 使用正常渲染成功态，不上报 `ai_sidebar_render_error`，并清零 `fail_streak`。原始终帧的失败仅在恢复也失败时才反馈；一个请求的产物全部保存成功后，绘图结果按成功处理，原始请求 `error` 仍保留供诊断。部分产物失败及权益错误不被覆盖。手动停止的警告交互不变，历史仍重放原始生成段，不补造完整产物。若脑图目前终帧只支持完整 DSL，则需要接入方在上述可选收尾方法中兼容截断数据；公共 SDK 不会替脑图修复结构。

## 6. 选区接入（可选）

SDK 只识别以下公共选区结构：

```js
{
    type: 'selection',
    ids: ['topic-id-1', 'topic-id-2'],
    count: 2,
    label: '选中了2个主题'
}
```

有两种同步方式，选择一种即可。

方式一：脑图选区变化时主动通知：

```js
sidebar.setSelectionReference({
    ids: getSelectedMindTopicIds(),
    label: '选中的脑图主题',
});
```

方式二：Adapter 提供订阅方法：

```js
const mindAdapter = {
    subscribeSelection(notify) {
        const unsubscribe = mindEvents.on('selection-change', ids => {
            notify({ids, label: `选中了${ids.length}个主题`});
        });
        return unsubscribe;
    },
};
```

如果希望点击历史消息里的选区标签后重新定位，需要额外实现：

```js
mindAdapter.focusSelectionReference = function (reference) {
    const validIds = reference.ids.filter(id => mindModel.hasTopic(id));
    focusMindTopics(validIds);
    return {
        found: validIds.length,
        total: reference.count,
        reference: validIds.length
            ? {ids: validIds, label: `选中了${validIds.length}个主题`}
            : null,
    };
};
```

`reference` 必须是过滤删除节点后的有效引用。SDK 使用 `found/total` 判断是否展示部分或全部失效警告，并在编辑回填时使用返回的 `reference`。示例中的 `mindModel.hasTopic()` 和 `focusMindTopics()` 需替换为脑图项目的实际校验与定位方法。

## 7. ProcessOn 平台依赖

使用 `createProcessOnAISidebar` 时默认复用以下宿主能力：

- `injectExtraAsynCall('onServerApi', ...)`：历史、附件上传和语音鉴权。
- `injectExtraAsynCall('onBeforeAIWebsocket', ...)`：允许宿主覆盖 AI 请求地址。
- `injectExtraAsynCall('aiServiceBaseInfo')`：追加 AI 基础字段。
- `injectExtraAsynCall('showAiPoints')`：控制顶部 AI 点数入口；严格返回 `false` 时隐藏，未配置时默认显示。
- `injectExtraAsynCall('onAiPointTip', ...)`：AI 点数点击交互；SDK 不转发悬浮事件。
- `injectExtraAsynCall('onShowVipLimit', ...)`：AI 点数不足提示。
- `injectExtraAsynCall('onAIError', data, callback)`：每次触发 `ai_sidebar_request_error` 时通知宿主，`data` 与该埋点的字段一致。通知异步派发且不等待返回；桥接缺失、同步抛错或返回 Promise 拒绝均不影响原有埋点、错误提示和请求收尾。可通过 `platform.onAIError(data)` 覆盖，自行提供完整 `hostServices` 时可配置 `hostServices.onAIError`。
- `Util.getCookies('token')` 或 `token` Cookie：AI SDK Token。
- ProcessOn 默认 `getBaseInfo()` 会根据 `editorType` 设置请求来源，并在 `baseInfo` 中携带 `aiV: '3.0'`；如果脑图自行覆盖 `getBaseInfo`，需要自行提供完整 `baseInfo` 并保留该字段。
- 通用 Toast、内联 Alert 和确认弹窗均由 SDK 自己渲染，不需要宿主注入 Toast 或确认框。AI 点数和权益不足仍使用平台能力。

脑图页面如果没有默认桥接，可以通过 `platform` 覆盖：

```js
platform: {
    getUserId,
    callServerApi,
    getEndpoint,
    getToken,
    getBaseInfo,
    uploadAttachment,
    getSpeechCredentials,
    onAiPointTip,
    onEntitlementInsufficient,
    onAIError,
}
```

## 8. Runtime 配置

侧边栏包不内置 React、message-ui-sdk 和 AI client。`createProcessOnAISidebar()` 默认从
`${window.staticBasePath}/assets/js/react/18.3.1/` 加载 React，因此 ProcessOn 标准目录不需要重复配置。
页面没有提供 `staticBasePath` 时改从根路径 `/assets/js/react/18.3.1/` 加载。接入方使用不同的
静态资源目录时，可通过 `runtime` 覆盖地址：

```js
const sidebar = createProcessOnAISidebar({
    editorType: 'mindmap',
    // 其他配置省略
    runtime: {
        manifestUrl: 'https://static.example.com/processon-ai/manifest.json',
        reactUrl: 'https://static.example.com/react/18.3.1/react.production.min.js',
        reactDOMUrl: 'https://static.example.com/react/18.3.1/react-dom.production.min.js',
    },
});
```

`runtime` 与平台默认配置按字段合并，可以只覆盖其中一个字段。宿主已经提供兼容的全局
`React` / `ReactDOM` 时不会重复加载上述文件。manifest 必须包含 `files.client` 和
`files.messageUI`；侧边栏只读取包地址，忽略 manifest 中的 `integrity`，加载 React、ReactDOM、
client 和 messageUI 脚本时均不执行 SRI 校验。HTTPS 编辑器页面不能加载 HTTP Runtime。

## 9. 生命周期

```js
// 打开时无需重复创建，显示已有 Dock 即可。

// 新建空白会话。
sidebar.newSession();

// 文件、画布或脑图页签切换时，终止旧请求并清理当前会话。
sidebar.newSession({force: true});

// 更新选区。
sidebar.setSelectionReference({ids: ['topic-id']});

// 脑图进入/退出只读状态时同步 SDK，包括技能执行期间的临时只读。
sidebar.setReadOnly(readOnly);

// 页面卸载或永久移除侧边栏。
sidebar.destroy();
```

SDK 不接管脑图 Dock 的自动展开逻辑。顶部“更多”会在本浏览器按 `mindmap` 保存自动展开偏好，不区分账号或文件；设置仅影响自动展开，用户手动点击入口始终可打开。脑图宿主应在原有屏宽、入口可用、非只读判断后再检查偏好。由于脑图 SDK 在首次打开面板时才加载，自动展开判断不能依赖尚未加载的 `window.ProcessOnAISidebarSDK`；宿主可在原有自动展开分支中读取相同的本地存储：

```js
function shouldAutoOpenMindSidebar() {
    try {
        const value = JSON.parse(localStorage.getItem('po-ai-sidebar-sdk:auto-open:mindmap'));
        if (value?.mode === 'never') return false;
        if (value?.mode === 'pause' && Number.isFinite(value.until) && value.until > Date.now()) return false;
    } catch (error) {
        // 本地存储不可用时维持默认自动展开。
    }
    return true;
}
```

`pause` 自选择时起 7 天有效，到期自动恢复默认；`auto` 不留存储项。只读页仍可保留 AI 入口，用户手动点击后展示禁用状态的面板。

`destroy()` 后实例不可复用，需要重新调用 `createProcessOnAISidebar()`。

## 10. 历史记录与接口参数

- 历史默认开启；传入 `platform: {history: false}` 可禁用。
- 历史列表、搜索携带 `userId`、`chartId`；详情、保存、重命名和删除携带 `userId`、`conversationId`。
- 历史列表默认每页 10 条并支持滚动加载；搜索结果不分页。
- `editorType: 'mindmap'` 是必填项，SDK 据此设置 `reqSourceLocation: 'mind_editor'`、`documentType: 'mindmap'` 和 `reverseType: 'mindmap'`。
- 编辑器请求由 SDK 固定带上 `cancelSaveChart: true`。
- 历史继续对话只复用 `threadId`，不需要前端发送完整历史。
- 用户附件使用 `attachments`，选中主题使用 `selectedShapeIds`。
- 收到首个 `streaming/complete` AI 响应或可落库折叠段后，SDK 先将用户消息加入串行保存队列，再保存后续 AI 折叠段；AI 直接报错、无消息终态或尚未响应即停止时不创建历史。
- 详情响应中的消息数组位于 `data.messages.messages`，SDK 严格按接口数组顺序恢复。

脑图宿主的 `onServerApi` 桥接需要支持以下名称：

| `apiName` | 方法与地址 | 参数 |
| --- | --- | --- |
| `getAiHistoryV2` | GET `/v2/conversation/session` | `userId`、`page`、`pageSize`、`chartId` |
| `searchAiHistoryV2` | GET `/v2/conversation/session/search` | `userId`、`keyword`、`chartId` |
| `getAiHistoryContentV2` | GET `/v2/conversation/session/message` | `userId`、`conversationId` |
| `saveAiHistoryContentV2` | POST `/v2/conversation/session/message/save` | `userId`、`conversationId`、`messages` |
| `aiHistoryUpdateV2` | POST `/v2/conversation/session/message/rename` | `userId`、`conversationId`、`title` |
| `aiHistoryDeleteV2` | POST `/v2/conversation/session/message/del` | `userId`、`conversationId` |
| `importFileV2` | POST `/v2/import/file` | FormData：`file`、`userId` |

上述请求发送前通过 `/api/personal/aigc/ai/sse/hsv/power` 获取鉴权信息；宿主可使用 3 秒 Token 缓存和并发合并逻辑。

### 附件限制

- `jpg,jpeg,png,bmp` 图片单文件不超过 5MB。
- `pdf,txt,md,doc,docx,ppt,pptx,csv,xlsx,mp3` 单文件不超过 5MB。
- 粘贴的普通文本超过 4000 字符时，侧边栏自动转为 UTF-8 的 `粘贴文本.txt` 附件；恰好 4000 字符仍保留在输入框。
- 文件图标与侧边栏 Iconfont 统一生成内联 SVG Symbol Sprite 并打入 SDK JavaScript，接入方不需要单独拷贝图标目录。

### 消息反馈

- AI 消息完成或停止后常显复制、点赞、踩和意见反馈，图标为 16×16，按钮区域为 24×24；`message.usage.aiPoints` 为有效非负数时，末尾显示本次 AI 消耗点数，字段缺失时不占位。
- 复制 AI 回答时，SDK 仅复制用户可见正文，并在正文后追加当前回答中全部已完成的可编辑图表源码；思考、工具信息、图片、内部标记、未完成产物和 Markdown 文件产物均跳过。正文和图表都为空时提示“暂无可复制内容”，不覆盖剪贴板；用户消息仍按原文复制。
- 多个图表共用一个“图表描述语言DSL:”标题，并按展示顺序分别输出产物名称和带语言标记的独立代码块。历史消息复制其存储时的产物快照，编辑结果复制完整 `data`，接入方无需额外拼装 DSL。
- 点赞默认选中“满意”，踩默认选中“不满”，意见反馈默认不选择评分且不能提交；1～3 分显示同一组可多选原因，4～5 分隐藏原因。
- 弹窗位于侧边栏范围内并适配窄屏。提交成功后关闭并提示，不保存或回显已提交状态；再次打开仍按入口使用默认评分。
- 提交时 SDK 调用 `events.onCollect('ai_feedback_result', data)`，由接入方转发到自己的埋点实现。`data` 包含 `feeback_score`、`feedback_reason_choice`、`artifactId`、`user_id`、`threadId`、`feedback_comment`；其中 `feeback_score` 沿用埋点表中的字段拼写，多选原因以英文枚举逗号连接。
- 5 个评分表情以 5 份 SVG Symbol 打入 SDK，灰色和选中态通过共享颜色与渐变切换，接入方不需要部署 `feedback/` 资源目录。

评分对照：

| 星星顺序 | 当前文案 | `feeback_score` | 入口默认值 |
| --- | --- | ---: | --- |
| 1 | 很不满 | 1 | — |
| 2 | 不满 | 2 | 踩 |
| 3 | 一般 | 3 | — |
| 4 | 满意 | 4 | 点赞 |
| 5 | 很满意 | 5 | — |

原因对照：

| 当前文案 | `feedback_reason_choice` 稳定值 |
| --- | --- |
| 理解错误 | `misunderstanding_instructions` |
| 文件解析不对 | `failed_to_parse_uploaded_files_urls` |
| 消耗点数太多 | `much_credits_consumed` |
| 生图太慢 | `too_slow` |
| 生图不够美观 | `not_beautiful` |
| 内容不满意 | `not_as_expected` |
| 生图不够专业 | `unprofessional` |

上述协议直接维护在 `portable/ui/FeedbackDialog.js` 的 key/value 映射中。key 只负责埋点，value 只负责显示；修改文案或接入多语言时只替换 value，不要修改稳定分数和英文 key。多选原因按映射顺序输出，不受用户点击顺序影响。

## 11. 联调检查清单

1. JS、CSS 只加载一次，挂载容器具有实际高度。
2. `sidebar.ready` 成功，Runtime manifest、React、client 和 messageUI 均可访问。
3. `editorType` 固定为 `mindmap`，`getUserId()`、`chartId`、`defId` 返回当前脑图真实值。
4. 新建脑图产物支持流式帧与最终帧，成功/失败以脑图落图结果为准。
5. 二次编辑能消费 `editContext`、`selectedShapeIds`，并且不会新建一份图形。
6. 历史列表只查询当前 `chartId`，加载详情后可以继续对话。
7. 附件、语音、AI 点数点击、停止生成和新会话分别验证；手动停止后应中止请求、以 `isEnd: true` 保存已生成部分，并显示“已停止生成”警告提示。
   同时验证断流、EOF 缺终帧、终帧解析失败后的部分保存；成功后刷新画布确认数据保留，保存失败仍反馈错误，重复终态不重复落图。切文件/销毁时不得补写到新画布。
8. 切换文件或页签时调用 `newSession({force: true})`，页面卸载时调用 `destroy()`。
9. 只读页不自动展开侧边栏；手动展开后面板禁用。执行脑图技能时调用 `setReadOnly(true)`，技能结束按编辑器真实状态恢复。
10. 自动展开前检查 `shouldAutoOpenMindSidebar()`；选择“7 天内不自动展开”或“始终不自动展开”后刷新页面不弹出，但入口仍可手动打开；流程图和脑图的设置互不影响。

## 12. 重新构建

在编辑器仓库根目录执行：

```bash
node script/build-ai-sidebar-sdk.js
```

构建脚本不会修改 `package.json`，输出目录为：

```text
app/v5_editor/static/assets/js/AI/ai-sidebar-sdk/
app/v5_editor/static/assets/js/react/18.3.1/
```
