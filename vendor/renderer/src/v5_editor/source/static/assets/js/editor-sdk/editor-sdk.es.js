var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
/*!
 * name: editor-sdk
 * version: 0.0.0
 * commit: f75747c
 * buildTime: 2026-10-13T01:44:57.958Z
 * env: production
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};
const COLORS = {
  // 时间戳：暗灰色
  timestamp: "color: #6a6a6a; font-weight: normal",
  // 模块名：统一浅灰色
  module: "color: #cccccc; font-weight: normal",
  // 日志级别颜色
  debug: "color: #858585",
  // 灰色，类似注释
  info: "color: #4fc1ff",
  // 亮蓝，类似字符串
  warn: "color: #dcdcaa",
  // 黄色，类似函数名
  error: "color: #f48771",
  // 橙红，类似错误
  // 重置样式
  reset: "color: inherit"
};
class Logger {
  constructor(config) {
    __publicField(this, "config");
    this.config = config;
  }
  shouldLog(level) {
    if (!this.config.enabled) return false;
    if (LOG_LEVELS[level] < LOG_LEVELS.warn) {
      return false;
    }
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }
  getTimestamp() {
    const now = /* @__PURE__ */ new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }
  formatMessage(level, message, ...args) {
    const timestamp = this.getTimestamp();
    const modulePrefix = `[${this.config.module}]`;
    const formattedMessage = `%c[${timestamp}] %c${modulePrefix}%c ${message}`;
    const consoleMethod = level === "debug" ? console.log : level === "info" ? console.log : level === "warn" ? console.warn : console.log;
    consoleMethod(
      formattedMessage,
      COLORS.timestamp,
      // 时间戳样式
      COLORS.module,
      // 模块名样式
      COLORS[level],
      ...args
    );
  }
  debug(message, ...args) {
    if (this.shouldLog("debug")) {
      this.formatMessage("debug", message, ...args);
    }
  }
  info(message, ...args) {
    if (this.shouldLog("info")) {
      this.formatMessage("info", message, ...args);
    }
  }
  warn(message, ...args) {
    if (this.shouldLog("warn")) {
      this.formatMessage("warn", message, ...args);
    }
  }
  error(message, ...args) {
    if (this.shouldLog("error")) {
      this.formatMessage("error", message, ...args);
    }
  }
}
const sdkLogger = new Logger({
  module: "SDK",
  minLevel: "debug",
  enabled: true
});
const DEFAULT_RENDER_ORDERING_GUARD_CLEANUP_MS = 6e5;
const SMART_UPLOAD_FILES_WINDOW_KEY = "__PO_SMART_UPLOAD_FILES__";
const TOKEN_ERROR_CODE = "UNAUTHORIZED";
const DEFAULT_API_BASE_URL = "https://smart.processon.com";
function createErrorWithCode(message, code, reason, details) {
  const error = new Error(message);
  error.code = code;
  if (reason) {
    error.reason = reason;
  }
  if (details) {
    error.details = details;
  }
  return error;
}
function getErrorReason(error) {
  if (error instanceof Error && "reason" in error) {
    return error.reason;
  }
  return void 0;
}
function createSdkErrorFromPayload(payload) {
  const payloadRecord = payload && typeof payload === "object" ? payload : {};
  const rawMessage = payloadRecord.message ?? payloadRecord.error;
  const message = rawMessage !== void 0 ? String(rawMessage) : "Unknown error";
  const error = new Error(message);
  const rawDetails = payloadRecord.details;
  const details = rawDetails && typeof rawDetails === "object" && !Array.isArray(rawDetails) ? { ...rawDetails } : {};
  for (const [key, value] of Object.entries(payloadRecord)) {
    if (key === "error" || key === "message" || key === "code" || key === "name" || key === "originalType" || key === "details") {
      continue;
    }
    details[key] = value;
  }
  if (payloadRecord.code !== void 0 && payloadRecord.code !== null) {
    error.code = String(payloadRecord.code);
  }
  if (typeof payloadRecord.name === "string" && payloadRecord.name) {
    error.name = payloadRecord.name;
  }
  if (typeof payloadRecord.originalType === "string" && payloadRecord.originalType) {
    error.originalType = payloadRecord.originalType;
  }
  if (Object.keys(details).length > 0) {
    error.details = details;
  }
  return error;
}
function createSdkErrorEventPayload(error) {
  return {
    message: error.message,
    ...error.code ? { code: error.code } : {},
    ...error.name ? { name: error.name } : {},
    ...error.originalType ? { originalType: error.originalType } : {},
    ...error.details ? { details: error.details } : {},
    error
  };
}
const normalizeTrailingSlash = (value) => value.replace(/\/+$/, "");
const normalizeAssetBaseUrl = (value) => `${normalizeTrailingSlash(value)}/`;
const resolveBundleTargets = (raw) => {
  const resolved = { smart: false, flow: false, mindmap: false };
  for (const part of raw.split(",")) {
    const normalized = part.trim();
    if (!normalized) continue;
    if (normalized === "smart" || normalized === "flow" || normalized === "mindmap") {
      resolved[normalized] = true;
    }
  }
  return resolved;
};
const stringifyBundleTargets = (targets) => {
  if (!targets) return void 0;
  const enabled = [];
  if (targets.smart) enabled.push("smart");
  if (targets.flow) enabled.push("flow");
  if (targets.mindmap) enabled.push("mindmap");
  return enabled.length > 0 ? enabled.join(",") : void 0;
};
class EditorAPISDK {
  constructor(options) {
    __publicField(this, "container");
    __publicField(this, "mode");
    __publicField(this, "apiBaseUrl");
    __publicField(this, "runtimeConfig");
    __publicField(this, "timeout");
    __publicField(this, "accessToken");
    __publicField(this, "getAccessToken");
    __publicField(this, "maxUnauthorizedRetries");
    __publicField(this, "tokenRequestTimeout");
    __publicField(this, "editorOptions", { showToolbar: false, showExport: true });
    __publicField(this, "renderOrderingGuardCleanupMs");
    __publicField(this, "fastDslDetection");
    __publicField(this, "disableAnalytics");
    __publicField(this, "iframe", null);
    __publicField(this, "callbackMap", {});
    __publicField(this, "callIdCounter", 0);
    __publicField(this, "messageHandler", null);
    __publicField(this, "readyPromise");
    __publicField(this, "resolveReady");
    __publicField(this, "rejectReady");
    __publicField(this, "eventListeners", {});
    __publicField(this, "universalListeners", []);
    __publicField(this, "isActive", true);
    // @ts-expect-error - tokenVerified is used for internal state tracking
    __publicField(this, "tokenVerified", false);
    // snapshotId -> callback 映射，等待 iframe 回传 result 消息
    __publicField(this, "resultCallbackMap", /* @__PURE__ */ new Map());
    // 需要抑制对外透传 renderComplete 的 renderAiData 中间片段 renderId（value 为注册时间戳）
    __publicField(this, "suppressedRenderCompleteIds", /* @__PURE__ */ new Map());
    __publicField(this, "aiSnapshotMarker", "renderAiData");
    __publicField(this, "clientId");
    __publicField(this, "visualEditFetchCallbacks", /* @__PURE__ */ new Map());
    __publicField(this, "visualEditFetchAbortControllers", /* @__PURE__ */ new Map());
    __publicField(this, "currentVisualFetchId", null);
    __publicField(this, "uploadFiles");
    var _a, _b;
    this.container = options.container;
    this.mode = options.mode || "edit";
    this.isActive = options.active ?? true;
    const rawApiBaseUrl = (options.apiBaseUrl || DEFAULT_API_BASE_URL).trim();
    const resolvedApiUrl = new URL(rawApiBaseUrl, window.location.href);
    this.apiBaseUrl = normalizeTrailingSlash(resolvedApiUrl.toString());
    const bundleTargets = resolveBundleTargets(
      "smart"
    );
    this.runtimeConfig = {
      mode: this.mode,
      apiBaseUrl: this.apiBaseUrl,
      apiOrigin: resolvedApiUrl.origin,
      smartEditorUrl: `${this.apiBaseUrl}/smart_editor/`.replace(/([^:]\/)\/+/g, "$1"),
      processOnEditorUrl: `${this.apiBaseUrl}/processon_editor/`.replace(/([^:]\/)\/+/g, "$1"),
      ...bundleTargets ? { bundleTargets } : {},
      needToken: false
    };
    this.timeout = options.timeout || 12e4;
    this.accessToken = options.accessToken;
    this.getAccessToken = options.getAccessToken;
    this.maxUnauthorizedRetries = Math.max(0, ((_a = options.tokenRetry) == null ? void 0 : _a.maxUnauthorizedRetries) ?? 1);
    this.tokenRequestTimeout = Math.max(1e3, ((_b = options.tokenRetry) == null ? void 0 : _b.requestTimeout) ?? 1e4);
    this.editorOptions = { showToolbar: false, showExport: true, ...options.editorOptions || {} };
    this.renderOrderingGuardCleanupMs = this.normalizeRenderOrderingGuardCleanupMs(options.renderOrderingGuardCleanupMs);
    this.fastDslDetection = options.fastDslDetection ?? true;
    this.disableAnalytics = options.disableAnalytics || false;
    this.uploadFiles = options.uploadFiles;
    this.clientId = this.generateClientId();
    this.readyPromise = new Promise((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
  }
  async init() {
    this.runtimeConfig.mode = this.mode;
    this.iframe = document.createElement("iframe");
    this.iframe.style.width = "100%";
    this.iframe.style.height = "100%";
    this.iframe.style.border = "none";
    this.iframe.style.pointerEvents = "all";
    const iframeUrl = this.buildIframeUrl();
    sdkLogger.info(`加载 iframe: ${iframeUrl}`);
    this.iframe.src = iframeUrl;
    this.container.innerHTML = "";
    this.container.appendChild(this.iframe);
    if (!this.isActive) {
      this.setActive(false);
    }
    this.messageHandler = this.handleMessage.bind(this);
    window.addEventListener("message", this.messageHandler);
    await this.waitForReady();
    this.injectUploadFilesHook();
    await this.applyEditorOptions();
    sdkLogger.info("SDK initialized");
  }
  destroy() {
    if (!this.iframe && !this.messageHandler) {
      return;
    }
    this.callbackMap = {};
    this.resultCallbackMap.clear();
    this.suppressedRenderCompleteIds.clear();
    this.cleanupVisualEditResources();
    this.clearUploadFilesHook();
    this.off();
    if (this.messageHandler) {
      window.removeEventListener("message", this.messageHandler);
      this.messageHandler = null;
    }
    if (this.iframe) {
      this.iframe.remove();
      this.iframe = null;
    }
    this.container.innerHTML = "";
    sdkLogger.info("SDK destroyed");
  }
  async initEditor(editorType) {
    await this.readyPromise;
    return this.sendMessage("initEditor", { editorType });
  }
  /**
   * 渲染 AI 数据
   * @param content AI 原始字符串数据
   * @param options 渲染选项
   */
  async renderAiData(content, options) {
    const isEnd = (options == null ? void 0 : options.isEnd) ?? true;
    const streamRenderStart = options == null ? void 0 : options.streamRenderStart;
    const time = (options == null ? void 0 : options.time) || 300;
    const onResult = options == null ? void 0 : options.callback;
    const outputSvg = (options == null ? void 0 : options.outputSvg) ?? false;
    const renderId = this.generateRenderId();
    const guardPayload = this.buildRenderOrderingGuardPayload(options);
    await this.readyPromise;
    if (!isEnd) {
      this.suppressedRenderCompleteIds.set(renderId, Date.now());
      this.pruneSuppressedRenderCompleteIds();
    }
    const snapshotId = onResult && this.mode === "edit" ? this.generateSnapshotId() : void 0;
    if (snapshotId && onResult) {
      const internalResultCallback = outputSvg ? (payload) => {
        var _a;
        const thumbSrc = ((_a = payload.thumb) == null ? void 0 : _a.src) || "";
        const svg = payload.content.type === "svg" ? payload.content.value : this.buildRenderAiSvg(thumbSrc, content);
        try {
          ;
          onResult(svg);
        } catch (err) {
          sdkLogger.error("Result SVG callback error:", err);
        }
      } : onResult;
      this.resultCallbackMap.set(snapshotId, internalResultCallback);
    }
    try {
      return await this.sendMessage("renderAiData", {
        content,
        isEnd,
        time,
        streamRenderStart,
        renderId,
        ...(options == null ? void 0 : options.thumb) ? { thumb: options.thumb } : {},
        ...guardPayload || {},
        ...snapshotId ? { saveSnapshot: true, snapshotId } : {}
      });
    } catch (error) {
      if (!isEnd) {
        this.suppressedRenderCompleteIds.delete(renderId);
      }
      throw error;
    }
  }
  /**
   * 生成 renderAiData 对应的 SVG（包含 thumbUrl 渲染与 content 元数据）
   * @param thumbUrl 快照图片地址
   * @param content AI 原始字符串数据
   */
  buildRenderAiSvg(thumbUrl, content) {
    return this.buildAiSnapshotSvg(thumbUrl, content);
  }
  /**
   * 从 renderAiData 生成的 SVG 中提取 AI content
   * @param svg SVG 字符串
   */
  getAiContentFromSvg(svg) {
    return this.extractAiContentFromSnapshotSvg(svg);
  }
  /**
   * 判断是否为 renderAiData 生成的 SVG
   * @param svg SVG 字符串
   */
  isRenderAiSvg(svg) {
    return this.getAiContentFromSvg(svg) !== null;
  }
  /**
   * 从 renderAiData 生成的 SVG 中提取 AI content 并渲染
   * @param svg SVG 字符串
   * @param options 渲染选项
   */
  async renderAiDataFromSvg(svg, options) {
    const extracted = this.getAiContentFromSvg(svg);
    if (!extracted) {
      throw new Error("不是 renderAiData 生成的 SVG");
    }
    return this.renderAiData(extracted, options);
  }
  async renderEditorData(data, onResultOrOptions) {
    await this.readyPromise;
    const normalizedOptions = typeof onResultOrOptions === "function" ? { callback: onResultOrOptions } : onResultOrOptions || {};
    const onResult = normalizedOptions.callback;
    const snapshotId = onResult && this.mode === "edit" ? this.generateSnapshotId() : void 0;
    if (snapshotId && onResult) {
      this.resultCallbackMap.set(snapshotId, onResult);
    }
    return this.sendMessage("renderEditorData", {
      data,
      ...normalizedOptions.thumb ? { thumb: normalizedOptions.thumb } : {},
      ...snapshotId ? { saveSnapshot: true, snapshotId } : {}
    });
  }
  async correctDsl(dsl, options = {}) {
    await this.readyPromise;
    return await this.sendMessage("correctDsl", {
      dsl,
      options
    });
  }
  async getAiData() {
    await this.readyPromise;
    return this.sendMessage("getAiData");
  }
  async getRawData() {
    await this.readyPromise;
    return this.sendMessage("getRawData");
  }
  async getAiDiagramType() {
    await this.readyPromise;
    return this.sendMessage("getAiDiagramType");
  }
  /**
   * 通过 AI 数据更新编辑器（用于 AI 二次编辑）
   * @param content AI 数据字符串
   * @param onSnapshot 快照回调
   * @param saveSnapshot 是否保存快照
   */
  async updateEditorByAiData(content, onResultOrOptions) {
    await this.readyPromise;
    const normalizedOptions = this.normalizeUpdateEditorByAiDataOptions(onResultOrOptions);
    const onResult = normalizedOptions.callback;
    const snapshotId = onResult && this.mode === "edit" ? this.generateSnapshotId() : void 0;
    if (snapshotId && onResult) {
      this.resultCallbackMap.set(snapshotId, onResult);
    }
    const guardPayload = this.buildRenderOrderingGuardPayload(normalizedOptions);
    return this.sendMessage("updateEditorByAiData", {
      content,
      ...normalizedOptions.thumb ? { thumb: normalizedOptions.thumb } : {},
      ...guardPayload || {},
      ...snapshotId ? { saveSnapshot: true, snapshotId } : {}
    });
  }
  normalizeRenderOrderingGuardCleanupMs(cleanupMs) {
    return typeof cleanupMs === "number" && Number.isFinite(cleanupMs) && cleanupMs > 0 ? cleanupMs : DEFAULT_RENDER_ORDERING_GUARD_CLEANUP_MS;
  }
  buildRenderOrderingGuardPayload(options) {
    const generationId = typeof (options == null ? void 0 : options.generationId) === "string" ? options.generationId.trim() : "";
    if (!generationId) {
      return null;
    }
    return {
      generationId,
      guardCleanupMs: this.normalizeRenderOrderingGuardCleanupMs((options == null ? void 0 : options.cleanupMs) ?? this.renderOrderingGuardCleanupMs)
    };
  }
  normalizeUpdateEditorByAiDataOptions(options) {
    if (typeof options === "function") {
      return { callback: options };
    }
    return options || {};
  }
  async exportFile(options = {}) {
    await this.readyPromise;
    const exportOptions = {};
    if (options.type) {
      exportOptions.type = options.type;
    }
    if (options.fileType) {
      exportOptions.fileType = options.fileType;
    }
    if (options.watermark) {
      exportOptions.watermark = options.watermark;
    }
    if (typeof options.pixelRatio === "number") {
      exportOptions.pixelRatio = options.pixelRatio;
    }
    if (typeof options.preferVisualSourceUrl === "boolean") {
      exportOptions.preferVisualSourceUrl = options.preferVisualSourceUrl;
    }
    return this.sendMessage("exportFile", { options: exportOptions });
  }
  async export(options = {}) {
    return this.exportFile(options);
  }
  async setMode(mode) {
    if (this.mode === mode) {
      return;
    }
    const fromMode = this.mode;
    this.mode = mode;
    this.runtimeConfig.mode = mode;
    if (!this.iframe) {
      throw new Error("iframe 未初始化");
    }
    this.tokenVerified = false;
    this.suppressedRenderCompleteIds.clear();
    this.clearUploadFilesHook();
    this.readyPromise = new Promise((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });
    const iframeUrl = this.buildIframeUrl();
    this.iframe.src = iframeUrl;
    await this.waitForReady();
    this.injectUploadFilesHook();
    await this.applyEditorOptions();
    this.emit("modeChange", { from: fromMode, to: mode });
    sdkLogger.info("Mode switched to:", mode);
  }
  on(event, listener) {
    if (event === "*") {
      this.universalListeners.push(listener);
      sdkLogger.debug("Universal event listener registered");
      return () => this.off("*", listener);
    }
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(listener);
    sdkLogger.debug(`Event listener registered: ${event}`);
    return () => this.off(event, listener);
  }
  off(event, listener) {
    if (!event) {
      this.eventListeners = {};
      this.universalListeners = [];
      sdkLogger.debug("All event listeners removed");
      return;
    }
    if (event === "*") {
      if (!listener) {
        this.universalListeners = [];
        sdkLogger.debug("All universal event listeners removed");
        return;
      }
      const index = this.universalListeners.indexOf(listener);
      if (index > -1) {
        this.universalListeners.splice(index, 1);
        sdkLogger.debug("Universal event listener removed");
      }
      return;
    }
    if (!listener) {
      delete this.eventListeners[event];
      sdkLogger.debug(`All listeners removed for event: ${event}`);
      return;
    }
    const listeners = this.eventListeners[event];
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
        sdkLogger.debug(`Event listener removed: ${event}`);
      }
      if (listeners.length === 0) {
        delete this.eventListeners[event];
      }
    }
  }
  /**
   * 监听一次性事件
   * @param event 事件类型（不支持 '*'）
   * @param listener 事件监听器
   * @returns 取消监听的函数
   */
  once(event, listener) {
    const wrappedListener = (payload) => {
      listener(payload);
      this.off(event, wrappedListener);
    };
    return this.on(event, wrappedListener);
  }
  /**
   * 设置编辑器活跃状态
   * @param active true 为活跃（可交互），false 为不活跃（不可交互）
   */
  setActive(active) {
    const stateChanged = this.isActive !== active;
    this.isActive = active;
    if (this.iframe) {
      this.iframe.style.pointerEvents = active ? "all" : "none";
    }
    if (stateChanged) {
      sdkLogger.debug(`Editor ${active ? "activated" : "deactivated"}`);
    }
  }
  /**
   * 获取编辑器活跃状态
   * @returns 当前活跃状态
   */
  getActive() {
    return this.isActive;
  }
  /**
   * 缩放控制
   * @param action 缩放操作类型：'in' 放大 | 'out' 缩小 | 'fit' 适应屏幕 | number 设置具体缩放值
   * @returns Promise<number | undefined> 返回操作后的缩放比例（无法获取时返回undefined）
   */
  async zoom(action) {
    await this.readyPromise;
    return this.sendMessage("zoom", { action });
  }
  async getThemeListView(options) {
    if (!options || !Array.isArray(options.themes) || options.themes.length === 0) {
      throw new Error("getThemeListView 需要至少一个主题名称");
    }
    await this.readyPromise;
    return this.sendMessage("getThemeListView", { options });
  }
  async setMindStructure(structure) {
    if (typeof structure !== "string" || structure.length === 0) {
      throw new Error("structure 参数必须为非空字符串");
    }
    await this.readyPromise;
    return this.sendMessage("setMindStructure", { structure });
  }
  async applyMindTheme(theme) {
    if (theme === void 0 || theme === null) {
      throw new Error("theme 参数不能为空");
    }
    await this.readyPromise;
    return this.sendMessage("applyMindTheme", { theme });
  }
  async manageVisualEdit(options) {
    if (!options) {
      throw new Error("manageVisualEdit 需要有效参数");
    }
    await this.readyPromise;
    const payload = { ...options };
    if (typeof options.fetchTexts === "function") {
      if (this.currentVisualFetchId) {
        this.visualEditFetchCallbacks.delete(this.currentVisualFetchId);
      }
      const fetchId = this.generateCallId();
      this.visualEditFetchCallbacks.set(fetchId, options.fetchTexts);
      this.currentVisualFetchId = fetchId;
      payload.fetchTextsId = fetchId;
      delete payload.fetchTexts;
    } else if ("fetchTexts" in payload) {
      delete payload.fetchTexts;
    }
    if (options.enable === false) {
      this.cleanupVisualEditResources();
      return this.sendMessage("manageVisualEdit", payload);
    }
    return this.sendMessage("manageVisualEdit", payload);
  }
  async flushVisualEditData(options = {}) {
    await this.readyPromise;
    return this.sendMessage("flushVisualEditData", { options });
  }
  buildAiSnapshotSvg(thumbUrl, content) {
    const safeThumbUrl = this.escapeXmlAttribute(thumbUrl);
    return [
      `<svg xmlns="http://www.w3.org/2000/svg"`,
      `xmlns:xlink="http://www.w3.org/1999/xlink"`,
      `data-processon-ai="${this.aiSnapshotMarker}"`,
      `width="100%" height="100%"`,
      `preserveAspectRatio="xMidYMid meet">`,
      `<metadata data-processon-ai="${this.aiSnapshotMarker}"><![CDATA[${content}]]></metadata>`,
      `<image href="${safeThumbUrl}" preserveAspectRatio="xMidYMid meet" />`,
      `</svg>`
    ].join(" ");
  }
  extractAiContentFromSnapshotSvg(svg) {
    try {
      if (typeof DOMParser !== "undefined") {
        const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
        const meta = doc.querySelector(`metadata[data-processon-ai="${this.aiSnapshotMarker}"]`);
        const raw = meta == null ? void 0 : meta.textContent;
        if (typeof raw === "string") {
          return raw;
        }
        return null;
      }
    } catch (err) {
      sdkLogger.debug("Failed to parse snapshot svg via DOMParser:", err);
    }
    const metaMatch = svg.match(/<metadata[^>]*data-processon-ai=["']renderAiData["'][^>]*>([\s\S]*?)<\/metadata>/i);
    if (metaMatch && metaMatch[1]) {
      try {
        const raw = metaMatch[1].replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "");
        return raw;
      } catch (err) {
        sdkLogger.debug("Failed to extract snapshot svg content:", err);
      }
    }
    return null;
  }
  escapeXmlAttribute(value) {
    return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&apos;");
  }
  /**
   * 触发事件
   * @param event 事件类型
   * @param payload 事件数据
   */
  emit(event, payload) {
    const listeners = this.eventListeners[event];
    if (listeners && listeners.length > 0) {
      listeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (err) {
          sdkLogger.error(`Event listener error (${event}):`, err);
        }
      });
    }
    if (this.universalListeners.length > 0) {
      this.universalListeners.forEach((listener) => {
        try {
          listener(event, payload);
        } catch (err) {
          sdkLogger.error(`Universal event listener error (${event}):`, err);
        }
      });
    }
  }
  waitForReady() {
    const timeout = setTimeout(() => {
      this.rejectReady(new Error("SDK 初始化超时"));
    }, this.timeout);
    return this.readyPromise.finally(() => {
      clearTimeout(timeout);
    });
  }
  /**
   * 同源将 uploadFiles 挂到 iframe window；失败仅 warn，不阻断 init
   * 依赖 FlowEditor 后续读取构造参数 / window 钩子
   */
  injectUploadFilesHook() {
    var _a;
    if (!this.uploadFiles) {
      return;
    }
    try {
      const iframeWindow = (_a = this.iframe) == null ? void 0 : _a.contentWindow;
      if (!iframeWindow) {
        sdkLogger.warn("injectUploadFilesHook: iframe contentWindow 不可用，跳过");
        return;
      }
      iframeWindow[SMART_UPLOAD_FILES_WINDOW_KEY] = this.uploadFiles;
      sdkLogger.info("uploadFiles 已挂载到 iframe window");
    } catch (error) {
      sdkLogger.warn("injectUploadFilesHook 失败，跳过", error);
    }
  }
  clearUploadFilesHook() {
    var _a;
    try {
      const iframeWindow = (_a = this.iframe) == null ? void 0 : _a.contentWindow;
      if (!iframeWindow) {
        return;
      }
      delete iframeWindow[SMART_UPLOAD_FILES_WINDOW_KEY];
    } catch (error) {
      sdkLogger.warn("clearUploadFilesHook 失败，跳过", error);
    }
  }
  async resolveAccessToken(context) {
    if (this.getAccessToken) {
      sdkLogger.debug("使用 getAccessToken 函数获取令牌", context);
      let token;
      try {
        token = await this.getAccessToken(context);
      } catch (error) {
        const message = error instanceof Error ? error.message : "获取访问令牌失败";
        throw createErrorWithCode(message, TOKEN_ERROR_CODE, "TOKEN_FETCH_FAILED", {
          type: "token_provider_failed",
          source: "sdk.resolveAccessToken",
          stage: context.reason,
          attempt: context.attempt,
          provider: "getAccessToken"
        });
      }
      if (!token || !token.trim()) {
        throw createErrorWithCode("获取访问令牌失败，请返回有效 token", TOKEN_ERROR_CODE, "TOKEN_EMPTY", {
          type: "token_empty",
          source: "sdk.resolveAccessToken",
          stage: context.reason,
          attempt: context.attempt,
          provider: "getAccessToken"
        });
      }
      return {
        token: token.trim(),
        provider: "getAccessToken",
        canRetry: true
      };
    }
    if (this.accessToken && this.accessToken.trim()) {
      sdkLogger.debug("使用静态 accessToken");
      return {
        token: this.accessToken.trim(),
        provider: "accessToken",
        canRetry: false
      };
    }
    throw createErrorWithCode("Token 是必需的，请提供 accessToken 或 getAccessToken", TOKEN_ERROR_CODE, "TOKEN_REQUIRED", {
      type: "token_required",
      source: "sdk.resolveAccessToken",
      stage: context.reason,
      attempt: context.attempt
    });
  }
  async handleTokenRequest(payload) {
    const requestId = payload == null ? void 0 : payload.requestId;
    if (!requestId) {
      this.postMessage("tokenResponseError", {
        requestId: "",
        code: TOKEN_ERROR_CODE,
        message: "Token 请求无效，缺少 requestId",
        retryable: false,
        reason: "TOKEN_REQUEST_INVALID",
        details: {
          type: "token_request_invalid",
          source: "sdk.handleTokenRequest"
        }
      });
      return;
    }
    try {
      const resolvedToken = await this.resolveAccessToken({
        reason: (payload == null ? void 0 : payload.reason) || "init",
        attempt: (payload == null ? void 0 : payload.attempt) || 1,
        ...(payload == null ? void 0 : payload.lastError) ? { lastError: payload.lastError } : {}
      });
      const response = {
        requestId,
        token: resolvedToken.token,
        provider: resolvedToken.provider,
        canRetry: resolvedToken.canRetry,
        maxUnauthorizedRetries: this.maxUnauthorizedRetries
      };
      this.postMessage("tokenResponse", { ...response });
    } catch (error) {
      const message = error instanceof Error ? error.message : "获取访问令牌失败";
      const response = {
        requestId,
        code: TOKEN_ERROR_CODE,
        message,
        retryable: false,
        reason: getErrorReason(error) || "TOKEN_FETCH_FAILED",
        details: error instanceof Error && "details" in error ? error.details : void 0
      };
      this.postMessage("tokenResponseError", { ...response });
    }
  }
  handleMessage(event) {
    var _a;
    if (event.origin !== this.runtimeConfig.apiOrigin) {
      return;
    }
    if (!this.iframe || event.source !== this.iframe.contentWindow) {
      return;
    }
    const { type, callId, clientId } = event.data;
    if (clientId && clientId !== this.clientId) {
      return;
    }
    const payload = (_a = event.data) == null ? void 0 : _a.data;
    if (type === "tokenRequest") {
      void this.handleTokenRequest(payload);
      return;
    }
    if (type === "manageVisualEditFetchRequest") {
      this.handleVisualEditFetchRequest(payload);
      return;
    }
    if (type === "manageVisualEditFetchAbort") {
      const requestId = payload == null ? void 0 : payload.requestId;
      this.handleVisualEditFetchAbort(requestId);
      return;
    }
    if (type === "ready") {
      const mode = payload == null ? void 0 : payload.mode;
      sdkLogger.info("Received ready message, mode:", mode);
      this.resolveReady();
      this.emit("ready", { mode: mode || "edit" });
      return;
    }
    if (type === "dataChange") {
      const dataChange = payload;
      sdkLogger.debug("Data change received");
      this.emit("dataChange", { data: dataChange == null ? void 0 : dataChange.data });
      return;
    }
    if (type === "renderComplete") {
      const renderPayload = payload;
      if ((renderPayload == null ? void 0 : renderPayload.source) === "renderAiData" && renderPayload.renderId && this.suppressedRenderCompleteIds.has(renderPayload.renderId)) {
        this.suppressedRenderCompleteIds.delete(renderPayload.renderId);
        sdkLogger.debug("Skip renderComplete emit for renderAiData intermediate chunk");
        return;
      }
      this.emit("renderComplete", {
        source: renderPayload == null ? void 0 : renderPayload.source,
        content: renderPayload == null ? void 0 : renderPayload.content
      });
      return;
    }
    if (type === "zoom") {
      const zoomPayload = payload;
      this.emit("zoom", {
        action: zoomPayload == null ? void 0 : zoomPayload.action,
        scale: zoomPayload == null ? void 0 : zoomPayload.scale,
        requestId: zoomPayload == null ? void 0 : zoomPayload.requestId
      });
      return;
    }
    if (type === "result") {
      const result = payload;
      if (result == null ? void 0 : result.snapshotId) {
        const cb = this.resultCallbackMap.get(result.snapshotId);
        if (cb) {
          this.resultCallbackMap.delete(result.snapshotId);
          try {
            cb({
              source: result.source,
              content: result.content,
              thumb: result.thumb
            });
          } catch (err) {
            sdkLogger.error("Result callback error:", err);
          }
        }
      }
      this.emit("result", {
        source: result == null ? void 0 : result.source,
        content: (result == null ? void 0 : result.content) || { value: "", type: "editorData" },
        thumb: result == null ? void 0 : result.thumb
      });
      return;
    }
    if (callId && this.callbackMap[callId]) {
      const callback = this.callbackMap[callId];
      if (type === "error") {
        const errorObj = createSdkErrorFromPayload(payload);
        callback.reject(errorObj);
        if (errorObj.code === TOKEN_ERROR_CODE) {
          this.emitUnauthorized(errorObj.message, errorObj.details);
        } else {
          this.emit("error", createSdkErrorEventPayload(errorObj));
        }
      } else {
        callback.resolve(payload);
      }
      delete this.callbackMap[callId];
      return;
    }
    if (type === "error") {
      const errorObj = createSdkErrorFromPayload(payload);
      this.rejectReady(errorObj);
      if (errorObj.code === TOKEN_ERROR_CODE) {
        this.emitUnauthorized(errorObj.message, errorObj.details);
        return;
      }
      this.emit("error", createSdkErrorEventPayload(errorObj));
    }
  }
  emitUnauthorized(message, details) {
    this.emit("UNAUTHORIZED", { message, code: TOKEN_ERROR_CODE, ...details ? { details } : {} });
  }
  generateCallId() {
    return `call_${this.clientId}_${++this.callIdCounter}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
  generateClientId() {
    return `sdk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
  generateSnapshotId() {
    return `snap_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  }
  generateRenderId() {
    return `render_${this.clientId}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
  pruneSuppressedRenderCompleteIds() {
    if (this.suppressedRenderCompleteIds.size === 0) return;
    const expireBefore = Date.now() - this.timeout * 2;
    this.suppressedRenderCompleteIds.forEach((createdAt, renderId) => {
      if (createdAt < expireBefore) {
        this.suppressedRenderCompleteIds.delete(renderId);
      }
    });
  }
  buildIframeUrl() {
    const params = new URLSearchParams();
    params.set("t", Date.now().toString());
    if (this.disableAnalytics) {
      params.set("da", "1");
    }
    params.set("fd", this.fastDslDetection ? "1" : "0");
    if (typeof this.editorOptions.blockedWheelMove === "boolean") {
      params.set("bwm", this.editorOptions.blockedWheelMove ? "1" : "0");
    }
    const rightPanelOptions = this.editorOptions.rightPanelOptions;
    if (rightPanelOptions && typeof rightPanelOptions === "object" && !Array.isArray(rightPanelOptions)) {
      const open = rightPanelOptions.open;
      if (open === void 0 || open === "manual" || open === "auto") {
        params.set("rpo", open === "auto" ? "a" : "m");
        if (typeof rightPanelOptions.minWidth === "number" && Number.isFinite(rightPanelOptions.minWidth) && rightPanelOptions.minWidth > 0) {
          params.set("rpm", String(rightPanelOptions.minWidth));
        }
      } else {
        sdkLogger.warn("Invalid rightPanelOptions.open ignored", { open });
      }
    }
    params.set("trr", this.maxUnauthorizedRetries.toString());
    params.set("trt", this.tokenRequestTimeout.toString());
    params.set("clientId", this.clientId);
    {
      params.set("seu", normalizeAssetBaseUrl(this.runtimeConfig.smartEditorUrl));
      params.set("peu", normalizeAssetBaseUrl(this.runtimeConfig.processOnEditorUrl));
      params.set("nt", this.runtimeConfig.needToken === false ? "0" : "1");
      const bt = stringifyBundleTargets(this.runtimeConfig.bundleTargets);
      if (bt) {
        params.set("bt", bt);
      }
      return `${this.apiBaseUrl}/api/${this.mode}.html?${params.toString()}`;
    }
  }
  async applyEditorOptions() {
    if (Object.keys(this.editorOptions).length === 0) {
      return;
    }
    await this.sendMessage("setEditorOptions", {
      editorOptions: this.editorOptions
    });
  }
  sendMessage(type, payload = {}) {
    if (!this.iframe || !this.iframe.contentWindow) {
      return Promise.reject(new Error("iframe 未就绪"));
    }
    const callId = this.generateCallId();
    const apiOrigin = this.runtimeConfig.apiOrigin;
    return new Promise((resolve, reject) => {
      this.callbackMap[callId] = {
        resolve,
        reject,
        type
      };
      this.iframe.contentWindow.postMessage({
        type,
        callId,
        clientId: this.clientId,
        data: payload
      }, apiOrigin);
      setTimeout(() => {
        if (this.callbackMap[callId]) {
          delete this.callbackMap[callId];
          reject(new Error(`调用 ${type} 超时`));
        }
      }, this.timeout);
    });
  }
  postMessage(type, data) {
    if (!this.iframe || !this.iframe.contentWindow) return;
    const apiOrigin = this.runtimeConfig.apiOrigin;
    this.iframe.contentWindow.postMessage({
      type,
      clientId: this.clientId,
      data
    }, apiOrigin);
  }
  handleVisualEditFetchRequest(payload) {
    var _a, _b, _c;
    const fetchFn = payload.fetchId ? this.visualEditFetchCallbacks.get(payload.fetchId) : void 0;
    if (!fetchFn) {
      this.postMessage("manageVisualEditFetchError", {
        requestId: payload.requestId,
        error: "fetch handler not found"
      });
      return;
    }
    const controller = new AbortController();
    this.visualEditFetchAbortControllers.set(payload.requestId, controller);
    fetchFn({
      config: (_a = payload.options) == null ? void 0 : _a.pluginData,
      pluginData: (_b = payload.options) == null ? void 0 : _b.pluginData,
      url: (_c = payload.options) == null ? void 0 : _c.url,
      signal: controller.signal
    }).then((result) => {
      this.visualEditFetchAbortControllers.delete(payload.requestId);
      this.postMessage("manageVisualEditFetchResponse", {
        requestId: payload.requestId,
        result
      });
    }).catch((error) => {
      this.visualEditFetchAbortControllers.delete(payload.requestId);
      this.postMessage("manageVisualEditFetchError", {
        requestId: payload.requestId,
        error: error instanceof Error ? error.message : String(error)
      });
    });
  }
  handleVisualEditFetchAbort(requestId) {
    if (!requestId) return;
    const controller = this.visualEditFetchAbortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.visualEditFetchAbortControllers.delete(requestId);
    }
  }
  cleanupVisualEditResources() {
    this.visualEditFetchCallbacks.clear();
    this.visualEditFetchAbortControllers.forEach((controller) => controller.abort());
    this.visualEditFetchAbortControllers.clear();
    this.currentVisualFetchId = null;
  }
}
export {
  EditorAPISDK,
  SMART_UPLOAD_FILES_WINDOW_KEY
};
