/** 配置文件 **/
/**
 * -start- console.log 样式配置
 * @params success 成功
 * @params error   失败
 * */
const logStyle = {
  success: 'color: green;font-weight: bold;',
  error: 'color: red;font-weight: bold;',
  default: `color: #000;font-weight: 400;`
}
/** -end- console.log 样式配置 */

/**
 * -start- 模块统一引入常量
 * */
const shell = window.api.shell
const path = window.api.path
const ipc = window.electron.ipcRenderer
const wsPort = window.api.wsPort
const qq_clientId = '100485241'
const __dirname = window.api.__dirname
const process = window.electron.process
if(window.fileType == 'mind'){
  window.staticBasePath = './../../../.../../../v5_editor/source/static'
}
else {
  window.staticBasePath = './../../static'
}
// 编辑器请求 host
window.domain = ipc.sendSync('getGlobal', 'host')
window.host = window.domain
const hostConfig = ipc.sendSync('getHost') || {}
window.editorGlobalConfig = {
  showPage: true,
  showComment: true,
  showPlan: true,
  showCodeBlock: 1,
  openMention: true,
  mentionConfig: {
    mentionDoc: true,//是否支持@文档
    defaultBox: true//是否支持@默认弹窗
  },
  showAIGC: true,
  prePathApi: '/api/personal',
  beforeCreateIndexdb: () => { },
  beforeSaveIndexdb: () => { },
  showOCR: true,
  showCharts: true,
  showGantt: true,
  showMermaid: true,
  flowNote: true,
  showSmartGraph: true,
  showThemeReuse: true,
  flowConfig: {
    antline: false
  },
  aiSidebarSDK: {
    runtime: {
      manifestUrl: hostConfig.aiManifestUrl || `${String(window.domain || '').replace(/\/+$/, '')}/editor-kit/processon-ai/manifest.json`
    }
  },
  markdownPreview: {
    css: '../../../../markdown-editor/assets/css/markdownPreview.css',
    js: '../../../../markdown-editor/markdownPreview.js'
  },
  fontFamily: {
    defaults: "微软雅黑",
    list: [
      {
        type: "思源黑体", // 字体类型（必填）
        display: "../../../fonts/思源黑体/display.svg", // 列表展示（可选，默认与type相同）
        packageUrl: "../../../fonts/思源黑体/sy-heiti.woff2",// 字体包链接（可选，默认无字体包，看系统支持）
        isFree: true, //免费商用（可选，默认false）
      },
      {
        type: "思源宋体",
        display: "../../../fonts/思源宋体/display.svg",
        packageUrl: "../../../fonts/思源宋体/sy-songti.woff2",
        isFree: true,
      },
      {
        type: "阿里巴巴普惠",
        display: "../../../fonts/阿里巴巴普惠/display.svg",
        packageUrl: "../../../fonts/阿里巴巴普惠/ali-puhui.woff2",
        isFree: true,
      },
      {
        type: "苍耳与墨",
        display: "../../../fonts/苍耳与墨/display.svg",
        packageUrl: "../../../fonts/苍耳与墨/cangeryumo.ttf",
        isFree: true,
      },
      {
        type: "Beau",
        display: "../../../fonts/Beau/display.svg",
        packageUrl: "../../../fonts/Beau/fonts/beau.ttf",
        isFree: true,
      },
      {
        type: "Bertha",
        display: "../../../fonts/Bertha/display.svg",
        packageUrl: "../../../fonts/Bertha/bertha.ttf",
        isFree: true,
      },
      {
        type: "Brela",
        display: "../../../fonts/Brela/display.svg",
        packageUrl: "../../../fonts/Brela/brela.otf",
        isFree: true,
      },
      {
        type: "黑体",
        // display: "../../../fonts/黑体/display.svg",
        // packageUrl: "../../../fonts/黑体/hei.ttf",
      },
      {
        type: "楷体",
        // display: "../../../fonts/楷体/display.svg",
        // packageUrl: "../../../fonts/楷体/kai.ttf",
      },
      {
        type: "宋体",
        // display: "../../../fonts/宋体/display.svg",
        // packageUrl: "../../../fonts/宋体/sun.ttc",
      },
      {
        type: "微软雅黑",
        // display: "../../../fonts/微软雅黑/display.svg",
        // packageUrl: "../../../fonts/微软雅黑/yahei.ttc",
      },
      {
        type: "Arial"
      },
      {
        type: "Times New Roman"
      },
      {
        type: "Comic Sans MS"
      },
      {
        type: "Courier New"
      },
      {
        type: "Verdana"
      },
      {
        type: "Garamond"
      },
      {
        type: "Georgia"
      },
      {
        type: "Impact"
      },
      {
        type: "Tahoma"
      },
      {
        type: "Lucida Console"
      }
    ]
  },
  mindToolbarConfig: {
    footerBarLeft: ["outline", "devider", "pageBox"],
    footerBarRight: ["textsNums", "topicNums", "devider", "boxChoose", "devider", "insertTemp", "focus", "devider", "mindCanvas", "devider", "zoomPage", "fullPage", "helper"]
  },
  vipIcons: {
    primaryBtn: `./../../static/assets/images/vip-tip.svg`, //功能按钮上的vip标识
    default: `./../../static/assets/images/vip-tip.svg`, //默认
  },
  showBooleanOp:false, // 流程图布尔操作是否显示（默认隐藏）false、true

}