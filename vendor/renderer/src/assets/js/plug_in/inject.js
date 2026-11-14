import UserOperation from '../pc/db/user.js'
import DBUtil from '../pc/db/db.js'
import FileDatabase from '../pc/operation/fileDatabase.js'
import FileBusiness from '../pc/operation/fileBusiness.js'
import { Toast } from '../pc/class.js'
import { ipc1, importClass, initIpcOn } from './ipc.js'
import exportInit from './export/exportInit.js'
// import outlineToPptNew from './ppt/mind.convert.ppt.js'
import { injectCommon } from './injectCommon.js'
import { markdownHelpMenu, mardownNewGuide, } from './markdown/markdownGuide/index.js'
import {
  getChart, getUserInfo, getCanvasInfo, createNew, fileCache,
  handleCrash, isOnlineToast, deepCopy, addHeaderTitle, pointerEventsInit,
  newExportPower, beginUploadDetails
} from './common.js'
import {
  handleExportCsv,
  handleExportDocx,
  handleExportOpml,
  exportPPTX,
  exportFile1,
  onlineDownload
} from './export.js'
import { fileUpload } from './upload.js'
import HtmlStr from '../pc/htmlStr.js'

exportInit.init()
initIpcOn()

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString);
window.TABGROUPID = 1
window.JSZip1 = window.JSZip
window.uploadOnline = []
window.uploadedOnline = { canvasIdMap: {}, defIdMap: {}, index: 0 }
window.chartObj = {}
window.pcName = '客户端'
window.device = 'pc_client'
window.cachePath = ''
window.Toast = Toast
var poKatexFontCssPromise = null
function poKatexFontCss() {
  if (poKatexFontCssPromise) return poKatexFontCssPromise
  poKatexFontCssPromise = (async function () {
    var jobs = []
    var seen = {}
    var sheets = document.styleSheets
    for (var i = 0; i < sheets.length; i++) {
      var sheet = sheets[i]
      var rules
      try { rules = sheet.cssRules } catch (e) { continue }
      if (!rules) continue
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j]
        if (!rule.style || !rule.style.getPropertyValue) continue
        var family = (rule.style.getPropertyValue('font-family') || '').replace(/['"]/g, '')
        if (family.indexOf('KaTeX') !== 0) continue
        var src = rule.style.getPropertyValue('src') || ''
        var m = src.match(/url\((['"]?)([^'")]+)\1\)\s*format\((['"]?)woff2\3\)/i)
        if (!m) continue
        var url = m[2]
        try { url = new URL(url, sheet.href || location.href).href } catch (e) {}
        if (!seen[url]) {
          seen[url] = fetch(url).then(function (r) { return r.blob() }).then(function (b) {
            return new Promise(function (res, rej) {
              var fr = new FileReader()
              fr.onload = function () { res(fr.result) }
              fr.onerror = rej
              fr.readAsDataURL(b)
            })
          }).catch(function () { return '' })
        }
        jobs.push({
          url: url,
          family: family,
          style: rule.style.getPropertyValue('font-style') || 'normal',
          weight: rule.style.getPropertyValue('font-weight') || '400',
          range: rule.style.getPropertyValue('unicode-range') || ''
        })
      }
    }
    var css = ''
    for (var k = 0; k < jobs.length; k++) {
      var data = await seen[jobs[k].url]
      if (!data) continue
      css += '@font-face{font-family:"' + jobs[k].family + '";font-style:' + jobs[k].style + ';font-weight:' + jobs[k].weight + ';src:url("' + data + '") format("woff2");' + (jobs[k].range ? 'unicode-range:' + jobs[k].range + ';' : '') + '}'
    }
    return css
  })()
  return poKatexFontCssPromise
}
window.__poFixExportClone = async function (root) {
  if (!root || !root.querySelectorAll) return
  root.style.setProperty('visibility', 'visible', 'important')
  root.style.setProperty('opacity', '1', 'important')
  root.querySelectorAll('[contenteditable], .cm-content, .cm-line').forEach(function (el) {
    el.removeAttribute('contenteditable')
    el.style.setProperty('-webkit-user-modify', 'read-only', 'important')
  })
  var css = ''
  try { css = await poKatexFontCss() } catch (e) {}
  if (!css || root.querySelector('style[data-po-katex-font]')) return
  var style = document.createElement('style')
  style.setAttribute('data-po-katex-font', '1')
  style.textContent = css
  root.insertBefore(style, root.firstChild)
}
window.isMyFile = false
window.nowId = ''
window.isTemp = urlParams.get('istemp');
window.isUpload = urlParams.get('isUpload');
window.action = urlParams.get('action');
window.downType = urlParams.get('downtype');
if (window.action == 'down' && window.downType && !document.getElementById('po-outer-down-style')) {
  document.documentElement.classList.add('po-outer-down')
  const outerDownStyle = document.createElement('style')
  outerDownStyle.id = 'po-outer-down-style'
  outerDownStyle.textContent = 'html.po-outer-down,html.po-outer-down body{background:#fff!important;overflow:hidden!important}#po-outer-down-mask{position:fixed;left:0;top:0;right:0;bottom:0;background:#fff;z-index:100000;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:#212930;font-size:14px}#po-outer-down-mask .po-outer-down-spin{width:28px;height:28px;border:3px solid #e6e7eb;border-top-color:#067bef;border-radius:50%;animation:po-outer-down-spin .8s linear infinite}@keyframes po-outer-down-spin{to{transform:rotate(360deg)}}html.po-outer-down .water_mark_bg{z-index:100001!important}'
  document.documentElement.appendChild(outerDownStyle)
  if (!document.getElementById('po-outer-down-mask')) {
    var poOuterDownMask = document.createElement('div')
    poOuterDownMask.id = 'po-outer-down-mask'
    poOuterDownMask.innerHTML = '<span class="po-outer-down-spin"></span><span>加载中</span>'
    document.body.appendChild(poOuterDownMask)
  }
}
window.isFirst = true
window.new = urlParams.get('new')
window.new = (!window.new || window.new == '') ? false : true
window.newDir = ''
window.webRoot = ''
  ; (function () {
    var token = localStorage.getItem('processon_token') || ''
    if (token) document.cookie = 'token=' + token + ';path=/'
    var bindUtil = function () {
      if (!window.Util || window.Util.__poTokenPatched) return !!window.Util
      var raw = window.Util.getCookies
      window.Util.getCookies = function (name, opts) {
        if (name === 'token') return localStorage.getItem('processon_token') || (raw ? raw.call(this, name, opts) : '') || ''
        return raw ? raw.call(this, name, opts) : ''
      }
      window.Util.__poTokenPatched = true
      return true
    }
    bindUtil()
    var n = 0
    var timer = setInterval(function () {
      if (bindUtil() || ++n > 80) clearInterval(timer)
    }, 200)
  })()
window.DeviceGuid = ''
window.saveName = '未命名文件'
window.defOrgVersion = []
window.defVersion = []
window.cacheImages = []
window.cacheFiles = []
window.userId = localStorage.getItem('processon_userKey') ? localStorage.getItem('processon_userKey') : ''
const fullName = localStorage.getItem('processon_fullName') ? localStorage.getItem('processon_fullName') : ''
window.fullName = fullName
window.cloudTimer
window.cloudTimer1
window.cloudTimer2
let chartId = urlParams.get('chartId');
window.saveType = '' // 保存来源 ctrls tab关闭 文件下拉 关闭程序
let exportType = '' // 导出的来源 可能是文件-导出 右上角导出 画布右键导出
const exportPdfWithConfig = async (type, partIds, isOnline, pdfConfig = {}) => {
  let realType = type
  if (type == 'pdfhd') {
    realType = 'svg'
  }
  if (isOnline && (type == 'pdfhd' || type == 'pdfHD')) {
    onlineDownload(type, { format: pdfConfig.format, orientation: pdfConfig.orientation })
    return
  }
  if (!isOnline && window.fileType == 'markdown') {
    const svgData = await PoEditorClient.exportView.init({
      watermark: { download: '', custom: {} }
    })
    const svg = svgData.content.replace(/pattern_mark/g, '')
    exportFile1.markdownImagePdf(exportFile1.extractSvgImageDataUrl(svg))
    return
  }
  window.PoEditorClient.exportFile(realType, (partIds ? partIds : []), function (img) {
    exportFile1.pngOrSvg(window.chartId, type, img, chartObj.title, false, isOnline, pdfConfig)
  })
}
if (navigator.onLine) {
  localStorage.setItem('isshowOffLineToast', "")
}
// 本地文件还是云文件
let filepath = urlParams.get('filepath')
if (filepath || filepath == '' || window.isTemp || window.location.href.indexOf('tempId=') > -1) {
  window.isMyFile = true
}
window.filepath = ''
;(function () {
  try {
    const neverKeys = {
      'po-ai-sidebar-sdk:auto-open:flowchart': 1,
      'po-ai-sidebar-sdk:auto-open:mindmap': 1
    }
    const neverValue = '{"mode":"never"}'
    const proto = Object.getPrototypeOf(window.localStorage)
    const rawGet = proto.getItem
    const rawSet = proto.setItem
    const rawRemove = proto.removeItem
    const isNeverKey = function (key) {
      return window.isMyFile && neverKeys[key]
    }
    proto.getItem = function (key) {
      if (isNeverKey(key)) return neverValue
      return rawGet.call(this, key)
    }
    proto.setItem = function (key, value) {
      if (isNeverKey(key)) return
      return rawSet.call(this, key, value)
    }
    proto.removeItem = function (key) {
      if (isNeverKey(key)) return
      return rawRemove.call(this, key)
    }
  } catch (e) {}
})()

// 键盘事件
window.document.addEventListener('keydown', function (event) {
  if (event.key === 'F11') {
    console.log('禁止全屏')
    event.stopImmediatePropagation()
    event.preventDefault()
  }
  if ((event.ctrlKey || event.metaKey) && (event.key === 's' || event.key === 'S') && !window.filepath.endsWith('.bak')) {
    if (window.isMyFile) {
      event.stopImmediatePropagation()
      // 在这里执行你想要的操作  
      save()
    } else if (window.fileType == 'markdown') {
      new Toast({ type: 'success', msg: '保存成功' })
      ipc.sendToHost("saveStatus", window.TABGROUPID, "saved")
    }
  }

});
window.addEventListener('online', () => {
  window.toast_.onLine()
  if (isMyFile) {
    setTimeout(() => {
      PoNetwork.status = 'offline'
    }, 300);
    fileUpload()
  }
  if (!isMyFile) {
    if (window.location.href.indexOf('&filepath=') == -1) {
      if (window.fileType == 'markdown') {
        PoEditorClient.saveOnline()
      }
      else {
        ipc.sendToHost('reload')
      }
    }
    else {
      if (window.fileType == 'flow') {
        const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
          `http://localhost:5173/src/v5_editor/source/compile/diagrams/index.html?token=token&chartId=${chartObj.chartId}&dbId=undefined`
          : encodeURI(`file:///${webRoot}/v5_editor/source/compile/diagrams/index.html?token=token&chartId=${chartObj.chartId}&dbId=undefined`)
        ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
      }
      else if ((window.fileType == 'mind')) {
        const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
          `http://localhost:5173/src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${chartObj.chartId}&dbId=undefined`
          : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${chartObj.chartId}&dbId=undefined`)
        ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
      }
      else if ((window.fileType == 'outline')) {
        const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
          `http://localhost:5173/src/v5_editor/source/compile/outline/index.html?token=token&chartId=${chartObj.chartId}&dbId=undefined`
          : encodeURI(`file:///${webRoot}/v5_editor/source/compile/outline/index.html?token=token&chartId=${chartObj.chartId}&dbId=undefined`)
        ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
      }
    }
    // window.location.reload()
  }
})
window.addEventListener('offline', () => {
  PoNetwork.status = 'offline'
  window.toast_.offLine()
  pointerEventsInit()
})

// 本地文件初始化
function InitInfo(params, callback) {
  getUserInfo()
  Promise.all([ipc1.sendSync('webRoot'), ipc1.sendSync('SystemUserName'),
  ipc1.sendSync('DeviceGuid'), ipc1.sendSync('cachePath'),
  ipc1.sendSync('loadFileB64', { type: 'cache', path: 'editor/config.json' })]).then((res) => {
    window.webRoot = res[0]
    window.pcName = res[1]
    window.DeviceGuid = res[2]
    window.cachePath = res[3]
    window.editorConfig = res[4] == '' ? {} : JSON.parse(res[4])

    let filepath = urlParams.get('filepath')
    let istemp = urlParams.get('istemp')
    let tempId = urlParams.get('tempId')
    // 如果不带参数的话创建空对象
    if (tempId) {
      const tempCate = pcUtil.getUrlParams('tempCate')
      createNew(false).then((data) => {
        window.saveName = decodeURIComponent(urlParams.get('title'))
        chartId = data.chartObj.id;
        window.chartId = data.chartObj.id;
        data.chartObj.title = window.saveName
        window.nowId = data.mainCanvasId
        $.ajax({
          url: host + '/api/personal/canvas/get/template/chartdefids?chartId=' + tempId + '&template=true',
          type: 'get',
          success: function (res1) {
            const getDefs = res1.data.chartCanvas.map((d, i) => {
              return new Promise((reslove) => {
                $.ajax({
                  url: `${host}/api/personal/diagraming/get/template/def?chartId=${tempId}&template=true&defId=${d.definitionId}`,
                  type: 'get',
                  success: function (res2) {
                    reslove({ id: i == 0 ? data.mainCanvasId : importClass.newId(), definition: res2.data.def })
                  }
                })
              })
            })
            Promise.all(
              [
                new Promise((reslove) => {
                  $.ajax({
                    url: `${host}/api/personal/view/chart_view?chartId=${tempId}&cteamId=&corgId=`,
                    type: 'get',
                    success: function (res2) {
                      reslove({ title: res2.data.chart.title })
                    }
                  })
                }),

                ...getDefs]
            ).then((res3) => {
              data.def = res3[1].definition
              ipc1.send('setTabTitle', res3[0].title)
              data.chartObj.title = res3[0].title
              window.saveName = data.chartObj.title
              if (tempCate) {
                data.chartObj.category = tempCate
              }
              addHeaderTitle()
              DBUtil.save('charts', data.chartObj)
              res3.forEach((d, i) => {
                if (i > 0) {
                  DBUtil.save('charts_def', { id: d.id, definition: data.def })
                  if (i != 1) {
                    data.chartDefIds.push({
                      canvasId: d.id,
                      definitionId: d.id,
                      title: "画布" + (i),
                    })
                  }
                }
              })
              window.filepath = ''
              window.defVersion.push({ id: data.chartDefIds[0].canvasId, version: 1, isSave: false })
              const { chartObj, userObj } = data
              // window.editorTabBar.init({ chartObj, userObj })
              // 加载数据
              fileCache.add(window.chartId).then(() => { ipc.sendToHost('refresh') })
              pointerEventsInit()
              window.chartId = chartObj.chartId
              callback(data)
            })
          }
        })
      })
    }
    else if (!filepath || filepath == '') {
      createNew().then((data) => {
        if (Object.hasOwnProperty.call(window.editorConfig, 'theme')) {
          data.authObj.mindTheme = window.editorConfig.theme
        }
        if (window.fileType != 'flow') {
          window.isFirst = false
        }
        addHeaderTitle()
        pointerEventsInit()
        window.chartId = chartObj.chartId
        callback(data)
      })
    }
    else {
      if ((filepath.indexOf('pos') > -1 || filepath.indexOf('pof') > -1 ||
        filepath.indexOf('posf') > -1 || filepath.indexOf('poso') > -1 || filepath.indexOf('poso') > -1
        || filepath.indexOf('md') > -1)
        && (!istemp)) {
        try {
          window.filepath = decodeURI(filepath);
        }
        catch {
          window.filepath = filepath
        }
      }
      else {
        window.filepath = ''
      }
      if (istemp == '1') {
        window.istemp = true
      }
      importClass.fileToDef(decodeURI(filepath)).then((data) => {
        try {
          filepath = decodeURI(filepath);
        }
        catch {
          filepath = filepath
        }
        // 设置tabtitle
        if (filepath && !filepath.endsWith('.bak')) {
          if (filepath.indexOf('\\') > -1) {
            window.saveName = filepath.substring(filepath.lastIndexOf('\\') + 1)
          }
          else {
            window.saveName = filepath.substring(filepath.lastIndexOf('/') + 1)
          }
          window.saveName = window.saveName.substring(0, window.saveName.lastIndexOf('.'))
          addHeaderTitle()
          // ipc.sendToHost("ping_event", 0, { k: 'setTitle', args: [false, window.saveName] });
          // ipc.sendToHost('setTitle',window.TABGROUPID,window.saveName)
          ipc1.send('setTabTitle', window.saveName)

          // 设置chartId
          chartId = data.chartObj.id;
          window.chartId = data.chartObj.id;
          window.chartObj = data.chartObj;
          data.chartObj.title = window.saveName
          window.nowId = data.mainCanvasId
          const { chartObj, userObj } = data
          if (Object.hasOwnProperty.call(window.editorConfig, 'theme')) {
            data.authObj.mindTheme = window.editorConfig.theme
          }
          window.editorTabBar.init({ chartObj, userObj })
          // if (filepath.endsWith('.posf') || filepath.endsWith('.posm') || filepath.endsWith('.poso')) {
          // }
          // 加载数据
          if (window.fileType == 'markdown') {
            setTimeout(() => {
              fileCache.add(window.chartId).then(() => { ipc.sendToHost('refresh') })
            }, 1000)
          }
          else {
            fileCache.add(window.chartId).then(() => { ipc.sendToHost('refresh') })
          }
          window.isFirst = false
          pointerEventsInit()
          callback(data)
        }
        else {
          ipc1.sendSync('loadFileB64', { type: 'cache', path: 'history/cache.json' }).then((resHis) => {

            if (resHis !== '') {
              let chartId = urlParams.get('chartId')
              const data = JSON.parse(resHis)
              const result = data.filter(d => d.filepath == filepath || (window.chartId && d.chartId == chartId))
              if (result.length > 0 && result[0].type == 4) {
                ipc1.send('setTabTitle', result[0].title)
                window.isMyFile = false
                if (!pcUtil.isOnline()) {
                  pointerEventsInit()
                }
              }
              else if (result.length > 0 && filepath != result[0].filepath && chartId.length < 13) {
                window.filepath = result[0].filepath
                window.isMyFile = true
                if (!pcUtil.isOnline()) {
                  pointerEventsInit()
                }
              }
            }

            // 设置chartId
            chartId = data.chartObj.id;
            window.chartId = data.chartObj.id;
            window.nowId = data.mainCanvasId
            window.saveName = data.chartObj.title;
            window.chartObj = data.chartObj;
            addHeaderTitle()
            const { chartObj, userObj } = data
            if (Object.hasOwnProperty.call(window.editorConfig, 'theme')) {
              data.authObj.mindTheme = window.editorConfig.theme
            }
            window.editorTabBar.init({ chartObj, userObj })
            if (window.fileType == 'markdown') {
              setTimeout(() => {
                fileCache.add(window.chartId).then(() => { ipc.sendToHost('refresh') })
              }, 1000)
            }
            else {
              fileCache.add(window.chartId).then(() => { ipc.sendToHost('refresh') })
            }
            window.chartDefIds = data.chartDefIds || []
            callback(data)
          })
        }
      })
    }
  })

}
async function ViewInitInfo(params, callback) {
  if (window.fileType != 'markdown') {
    window.editorGlobal.isView = true
  }
  window.isView = true

  ipc1.sendSync('webRoot').then((res) => {
    window.webRoot = res
  })

  let filepath = urlParams.get('filepath')
  // window.filepath = filepath
  let tempId = urlParams.get('tempId')
  let chartId = urlParams.get('chartId')
  // 如果不带参数的话创建空对象
  if (tempId) {
    window.saveName = decodeURIComponent(urlParams.get('title'))
    $.ajax({
      url: host + '/api/personal/canvas/get/template/chartdefids?chartId=' + tempId + '&template=true',
      type: 'get',
      success: function (res1) {
        const getDefs = res1.data.chartCanvas.map((d, i) => {
          return new Promise((reslove) => {
            $.ajax({
              url: `${host}/api/personal/diagraming/get/template/def?chartId=${tempId}&template=true&defId=${d.definitionId}`,
              type: 'get',
              success: function (res2) {
                reslove({ id: i == 0 ? data.mainCanvasId : importClass.newId(), definition: res2.data.def })
              }
            })
          })
        })
        Promise.all(
          [
            new Promise((reslove) => {
              $.ajax({
                url: `${host}/api/personal/view/chart_view?chartId=${tempId}&cteamId=&corgId=`,
                type: 'get',
                success: function (res2) {
                  reslove({ title: res2.data.chart.title })
                }
              })
            }),

            ...getDefs]
        ).then((res3) => {
          data.def = res3[1].definition
          ipc1.send('setTabTitle', res3[0].title)
          window.saveName = data.chartObj.title
          DBUtil.save('charts', data.chartObj)
          res3.forEach((d, i) => {
            if (i > 0) {
              DBUtil.save('charts_def', { id: d.id, definition: data.def })
              if (i != 1) {
                data.chartDefIds.push({
                  canvasId: d.id,
                  definitionId: d.id,
                  title: "画布" + (i),
                })
              }
            }
          })
          callback(data)
        })
      }
    })
  }
  else if (chartId) {
    window.chartId = chartId
    const paddingData = async () => {
      const userInfo = await getUserInfo()
      const chartObj = await getChart()
      const { chartDefIds = [], mainCanvasId = '', def = '' } = await getCanvasInfo(chartObj.definitionId)
      return {
        chartObj,
        authObj: userInfo.authObj,
        userObj: userInfo.userObj,
        chartDefIds, // 多画布用
        mainCanvasId, // 主画布 id
        def, // 定义
        isTemp: false,
        isPure: false
      }
    }
    const data = await paddingData()
    window.saveName = data.chartObj.title
    ipc1.send('setTabTitle', window.saveName)
    callback(data)

  }
  else {
    importClass.fileToDef(decodeURI(filepath)).then((data) => {
      try {
        filepath = decodeURI(filepath);
      }
      catch {
        filepath = filepath
      }
      // 设置tabtitle
      if (filepath && !filepath.endsWith('.bak')) {
        if (filepath.indexOf('\\') > -1) {
          window.saveName = filepath.substring(filepath.lastIndexOf('\\') + 1)
        }
        else {
          window.saveName = filepath.substring(filepath.lastIndexOf('/') + 1)
        }
        window.saveName = window.saveName.substring(0, window.saveName.lastIndexOf('.'))
        ipc1.send('setTabTitle', window.saveName)
        // 加载数据
        callback(data)
      }
    })
  }
}

// 编辑器初始化方法
window.editorGlobalConfig.onInitInfo = async function (params, callback) {
  setTimeout(() => {
    ipc.sendToHost('isMyFile', window.TABGROUPID, window.isMyFile)
  }, 300);
  // try {
  if (window.location.href.indexOf('/view.html') > -1) {
    ViewInitInfo(params, callback)
    return
  }
  // 在线路径
  if (!isMyFile) {
    ipc1.sendSync('webRoot').then((res) => {
      window.webRoot = res
    })
    ipc1.sendSync('cachePath').then((res) => {
      window.cachePath = res
    })
    window.chartId = urlParams.get('chartId')
    const paddingData = async () => {
      const userInfo = await getUserInfo()
      const chartObj = await getChart()
      const { chartDefIds = [], chart, mainCanvasId = '', def = '', defs = [] } = await getCanvasInfo(window.chartId)
      window.nowId = mainCanvasId
      return {
        chartObj: chart, // chart 信息
        authObj: userInfo.authObj,
        userObj: userInfo.userObj,
        chartDefIds, // 多画布用
        mainCanvasId, // 主画布 id
        def // 定义
      }
    }
    const data = await paddingData()
    window.saveName = data.chartObj.title
    ipc1.send('setTabTitle', window.saveName)
    addHeaderTitle()
    const { chartObj, userObj } = data
    if (window.fileType == 'markdown') {
      // chartObj.collaRole = 'editor'
      setTimeout(() => {
        fileCache.add(window.chartId, data.chartObj.definitionId).then(() => { ipc.sendToHost('refresh') })
      }, 1000)
    }
    else {
      fileCache.add(window.chartId, data.chartObj.definitionId).then(() => { ipc.sendToHost('refresh') })
    }
    window.editorTabBar.init({ chartObj, userObj })
    if (!navigator.onLine) pointerEventsInit()
    beginUploadDetails()
    window.chartId = chartObj.chartId
    window.chartObj = chartObj
    window.chartDefIds = data.chartDefIds || []
    callback(data)
  }
  else if (window.isTemp) {
    window.chartId = urlParams.get('chartId')
    ipc1.sendSync('webRoot').then((res) => {
      window.webRoot = res
    })
    ipc1.sendSync('cachePath').then((res) => {
      window.cachePath = res
    })
    const paddingData = async () => {
      const userInfo = await getUserInfo()
      const chartObj = await getChart()
      const { chartDefIds = [], mainCanvasId = '', def = '', defs = [] } = await getCanvasInfo()
      window.nowId = mainCanvasId
      chartId = importClass.newId()
      chartObj.chartId = chartId
      chartObj.id = chartId
      chartObj.definitionId = defs[0].id
      importClass.dbSave({
        chartObj, // chart 信息
        authObj: userInfo.authObj,
        userObj: userInfo.userObj,
        chartDefIds, // 多画布用
        mainCanvasId, // 主画布 id
        def // 定义
      }, defs)
      return {
        chartObj, // chart 信息
        authObj: userInfo.authObj,
        userObj: userInfo.userObj,
        chartDefIds, // 多画布用
        mainCanvasId, // 主画布 id
        def // 定义
      }
    }
    const data = await paddingData()
    const { chartObj, userObj } = data
    window.editorTabBar.init({ chartObj, userObj })
    ipc.sendToHost('refresh')
    window.chartId = chartObj.chartId
    window.chartObj = chartObj
    window.chartDefIds = data.chartDefIds || []
    callback(data)
  }
  else {
    InitInfo(params, callback)
  }
  // }
  // catch {
  //   new Toast({ type: 'error', msg: '文件解析失败' })
  // }
}// 编辑器初始化方法
window.editorGlobalConfig.onViewInitInfo = function (params, callback) {
  try {
    ViewInitInfo(params, callback)
  }
  catch {
    new Toast({ type: 'error', msg: '文件解析失败' })
  }
}
function disableAiForLocalFile() {
  if (!window.isMyFile || document.getElementById('po-ai-local-off')) return
  const css = document.createElement('style')
  css.id = 'po-ai-local-off'
  css.textContent = 'body.po-ai-local-off #po-tool-ai-button,body.po-ai-local-off #outline-aigc-btn,body.po-ai-local-off .ai-action,body.po-ai-local-off #ai-toolbar,body.po-ai-local-off #ai-topic-entry-for-pad-pc,body.po-ai-local-off .aigc-po-tool-button-bg,body.po-ai-local-off .po-tool-button[tit="aigc"],body.po-ai-local-off .header-right-item[tit="aigc"],body.po-ai-local-off .mind-corner [tit="aigc"],body.po-ai-local-off .mind-right-aigc,body.po-ai-local-off [ac="aigc"],body.po-ai-local-off [tit^="aigc-"],body.po-ai-local-off .po-ai-copilot{opacity:.35;filter:grayscale(1);pointer-events:none;cursor:not-allowed;}'
  document.head.appendChild(css)
  document.body.classList.add('po-ai-local-off')
  document.addEventListener('click', function (e) {
    if (!window.isMyFile) return
    const el = e.target && e.target.closest && e.target.closest('#po-tool-ai-button,#outline-aigc-btn,.ai-action,#ai-toolbar,#ai-topic-entry-for-pad-pc,.aigc-po-tool-button-bg,.po-tool-button[tit="aigc"],.header-right-item[tit="aigc"],.mind-right-aigc,[ac="aigc"],[tit^="aigc-"],.po-ai-copilot')
    if (!el) return
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
  }, true)
  setTimeout(function () {
    try { window.Dock && Dock.isOpen && Dock.openView === 'aigc' && Dock.hide() } catch (e) {}
    $('.mind-right-aigc,#po-flow-dock-layout-aigc').hide()
  }, 1500)
}
// 编辑器加载完成
window.editorGlobalConfig.onRanderComplete = function () {
  disableAiForLocalFile()
  console.log('onRanderComplete=======')
  window.poCollect('进入编辑器后', { '类型': pcUtil.getEidtorCateZNch(location.href) })
  UserOperation.getUserPrivilege(
    false,
    (user = {}) => {
      window.memberObj = user
      if (window.action) {
        if (window.action == 'down' && window.downType) {
          if (window.downType == 'opml') {
            setTimeout(() => {
              window.editorGlobalConfig.onBeforeExport({
                type: window.downType, call: () => {
                }, isSave: false, partIds: null
              })
            }, 3000);
          }
          else if (window.downType == 'svg') {
            setTimeout(() => {
              window.editorGlobalConfig.onBeforeExport({
                type: window.downType, call: () => {
                }, isSave: false, partIds: null
              })
            }, 1000);
          }
          else {
            var outerExportStart = Date.now()
            var outerExportTimer = setInterval(function () {
              var nodes = document.querySelectorAll('.node-code')
              var pending = false
              for (var i = 0; i < nodes.length; i++) {
                if (!nodes[i].querySelector('.CodeMirror')) pending = true
              }
              var loading = !window.CodeMirror && !!document.querySelector('script[src*="codemirror.js"]')
              var elapsed = Date.now() - outerExportStart
              var ready = !pending && !loading && (nodes.length || elapsed > 600)
              if (!ready && elapsed < 5000) return
              clearInterval(outerExportTimer)
              document.querySelectorAll('.CodeMirror').forEach(function (el) {
                try { el.CodeMirror && el.CodeMirror.refresh() } catch (e) {}
              })
              setTimeout(function () {
                window.editorGlobalConfig.onBeforeExport({
                  type: window.downType, call: () => {
                  }, isSave: false, partIds: null
                })
              }, 200)
            }, 100)
          }
        }
      }

      if (!window.isMember() && window.fileType != 'markdown') {
        const today = new Date().toISOString().slice(0, 10);
        const lastRun = localStorage.getItem('dailyEventLastRun');
        $("body").append(`
        <div class="free_user_pay_poupe">
        <img class="free_user_image" src="./../../../../assets/images/editor/free_${window.fileType}.svg">
        <div class="free_user_title"></div>
        <div class="free_user_tip"></div>
        <div class="free_user_butt">
            <span class="icons_c free_user_icons">&#xe7fb;</span>
            <span>升级个人版，畅享全部精彩</span>
        </div>
    </div>
        `)
        if (lastRun !== today) {
          localStorage.setItem('dailyEventLastRun', today);
          $(".free_user_pay_poupe").dialog();
          var freeTitle = "";
          var freetext = "";
          var pointEditor = "";
          if (chartObj.category.indexOf("mind") > -1) {
            freeTitle = "14种骨架的专业思维导图";
            freetext = "头脑风暴、知识整理、业务分析，一个脑图统统搞定";
            pointEditor = "思维导图";
          } else if (chartObj.category == "outline") {
            freeTitle = "脑图、大纲模式随时切换";
            freetext = "不只是记录笔记的利器更是结构化思考的源泉";
            pointEditor = "思维笔记";
          } else {

            freeTitle = "操作超简单，但做出的流程图并不简单";
            freetext = "11年匠心打磨，成就超易用绘图利器";
            pointEditor = "流程图";
          }
          // buried_point_fn("click", "activity_show", "编辑页", { "弹窗名称": pointEditor + "编辑器-进入付费提示弹窗" });
          $(".free_user_title").text(freeTitle);
          $(".free_user_tip").text(freetext);
          $(".free_user_butt").on("click", function () {
            $(".free_user_pay_poupe").dialog("close");
            window.poCollect('展示支付弹窗', { '触发位置': '编辑器-刚进入的提示弹窗' })
            ipc.sendToHost('showDlgPayWebView', { pay_position: '编辑器-进入付费提示弹窗', title: '升级会员解锁全部下载格式' })
            // insert.pay.init({title: "升级会员享无限文件数", pointsSource: pointEditor + "编辑器-进入付费提示弹窗"})
            // buried_point_fn("click", );
          })
          $("#po-dlg-mask").on("click", function () {
            $(".free_user_pay_poupe").dialog("close");
          })
        }
      }

      setTimeout(() => {
        $('#domLoading').remove()
      }, 500);

      // 渲染后删除内容
      if (window.fileType == 'mind') {
        setTimeout(() => {
          // 语音备注删除
          $('.po-menu-item[op=voice_note]').remove()
          $('.free-limited[tit=mind-picture-topic]').hide()
          $('.po-menu-item[tit=voice_note]').remove()
          $('#po-mind-more-list').css({ height: '290px' })
          let cleaning = false
          const cleanMindMenu = () => {
            if (cleaning) return
            cleaning = true
            $('.po-menu-item[op="copy-topic-link"]').remove()
            $('.po-menu-item[op="copy-canvas-link"]').remove()
            cleaning = false
          }
          cleanMindMenu()
          new MutationObserver(cleanMindMenu).observe(document.body, { childList: true, subtree: true })
        }, 2000);
      }

      if (window.fileType == 'flow') {
        setTimeout(() => {
          // 删除复制画布链接
          $('.po-menu-item[ac=themes]').remove()
          let cleaning = false
          const cleanLinkMenu = () => {
            if (cleaning) return
            cleaning = true
            const menu = document.getElementById('po-link-address-menu')
            if (menu) {
              $(menu).children().not('[ac=address]').remove()
            }
            $('li[data-type="copyCanvasLink"]').remove()
            $('.po-menu-item[ac=copyLink]').remove()
            $('.po-menu-item[ac=copyCanvasLink]').remove()
            cleaning = false
          }
          cleanLinkMenu()
          new MutationObserver(cleanLinkMenu).observe(document.body, { childList: true, subtree: true })
        }, 1500);
      }

      if (window.fileType == 'mind') {
        const patchMindPrint = () => {
          const poPrint = editorGlobal?.mindMap?.poPrint
          if (!poPrint || poPrint.__poOfflinePrintPatched) return !!poPrint
          const originCallPrint = poPrint.callPrint.bind(poPrint)
          poPrint.callPrint = function (iframe, closeDelay) {
            if (iframe) iframe.id = 'printIframe'
            originCallPrint(iframe, closeDelay)
          }
          poPrint.__poOfflinePrintPatched = true
          return true
        }
        if (!patchMindPrint()) {
          const timer = setInterval(() => {
            if (patchMindPrint()) clearInterval(timer)
          }, 200)
          setTimeout(() => clearInterval(timer), 10000)
        }
      }
    },
  )
}
// api方法
window.editorGlobalConfig.onServerApi = function (data, cb) {
  if (!window.isMyFile) {
    window.toast_.testOnline();
  }
  var { apiName, params } = data;
  console.log('api', apiName)
  window.serveApiObj[apiName] && window.serveApiObj[apiName].call(this, params, cb);
}
// 思维导图切换思维笔记
window.editorGlobalConfig.onLinkToOutline = function (obj, callback) {
  window.onbeforeunload = null
  //该方法拦截工具内提示， 接入方处理自己业务逻辑
  let filepath = urlParams.get('filepath')
  if (window.isMyFile && filepath == '') {
    window.toast_.noSave()
  }
  else if (window.isMyFile && filepath != '') {
    if (window.isView) {
      const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
        `http://localhost:5173/src/v5_editor/source/compile/outline/view.html?token=token&chartId=&dbId=undefined&filepath=${filepath}`
        : encodeURI(`file:///${webRoot}/v5_editor/source/compile/outline/view.html?token=token&chartId=&dbId=undefined&filepath=${filepath}`)
      ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
    } else {
      const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
        `http://localhost:5173/src/v5_editor/source/compile/outline/index.html?token=token&chartId=&dbId=undefined&filepath=${window.filepath}`
        : encodeURI(`file:///${webRoot}/v5_editor/source/compile/outline/index.html?token=token&chartId=&dbId=undefined&filepath=${window.filepath}`)
      ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
    }
  }
  else {
    if (navigator.onLine) {
      if (window.isView) {
        const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
          `http://localhost:5173/src/v5_editor/source/compile/outline/view.html?token=token&chartId=${window.chartId}&dbId=undefined#outline`
          : encodeURI(`file:///${webRoot}/v5_editor/source/compile/outline/view.html?token=token&chartId=${window.chartId}&dbId=undefined#outline`)
        ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
      } else {
        ipc.sendToHost('changeTabUrl', window.chartId, 'outline', window.saveName)
      }
    }
    else {
      window.toast_.offLine()
    }
  }
}
// 思维笔记切换思维导图
window.editorGlobalConfig.onLinkToMindmap = function (obj) {
  window.onbeforeunload = null
  //该方法拦截工具内提示， 接入方处理自己业务逻辑
  let filepath = urlParams.get('filepath')
  // 情况一 ：中间态文件
  if (window.isMyFile && filepath == '') {
    window.toast_.noSave()
  }
  // 情况二 本地文件
  else if (window.isMyFile && filepath != '') {
    window.onbeforeunload = null
    if (window.isView) {
      const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
        `http://localhost:5173/src/v5_editor/source/compile/mindmap/view.html?token=token&chartId=&dbId=undefined&filepath=${filepath}`
        : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/view.html?token=token&chartId=&dbId=undefined&filepath=${filepath}`)
      ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
    } else {
      const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
        `http://localhost:5173/src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=&dbId=undefined&filepath=${window.filepath}`
        : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/index.html?token=token&chartId=&dbId=undefined&filepath=${window.filepath}`)
      ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
    }
  }
  else {
    // 情况三 云文件 
    if (navigator.onLine) {
      if (window.isView) {
        const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
          `http://localhost:5173/src/v5_editor/source/compile/mindmap/view.html?token=token&chartId=${window.chartId}&dbId=undefined`
          : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/view.html?token=token&chartId=${window.chartId}&dbId=undefined}`)
        ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
      } else {
        ipc.sendToHost('changeTabUrl', window.chartId, 'mind', window.saveName)
      }
    }
    else {
      window.toast_.offLine()
    }
  }
}
function resolveBlobExportFileName(params) {
  const title = params.title || window.saveName || 'export'
  const dot = title.lastIndexOf('.')
  if (dot > 0) {
    return { path: title.slice(0, dot), suffix: title.slice(dot + 1) }
  }
  return { path: title, suffix: params.type || 'bin' }
}

async function exportLocalBlobFromEditor(params) {
  const scene = params.scence || params.scene
  if (!scene || !(params.content instanceof Blob)) {
    return false
  }
  const { path, suffix } = resolveBlobExportFileName(params)
  const base64 = await importClass.blobToBase64Simple(params.content)
  const res = await ipc1.sendSync('saveFileB64', {
    type: 'save',
    data: base64,
    path,
    suffix,
  })
  if (res != '') {
    new Toast({ type: 'success', msg: '保存成功' })
  }
  params.call && params.call()
  ipc.sendToHost('downed')
  return true
}

//编辑器导出文件前钩子 todo 未完成 还差一些图片类型没做
window.editorGlobalConfig.onBeforeExport = async function (params) {
  const scene = params.scence || params.scene
  if (scene === 'ganttTemplate') {
    try {
      const res = await fetch('https://pocdn.processon.com/template/gantt-sample.zip')
      const data = await res.arrayBuffer()
      const resPath = await ipc1.sendSync('saveFileB64', {
        type: 'save',
        data: importClass.arrayBufferToBase64(data),
        path: 'gantt-sample',
        suffix: 'zip',
      })
      if (resPath != '') {
        new Toast({ type: 'success', msg: '保存成功' })
      }
    } catch (e) {
      new Toast({ type: 'error', msg: '下载失败' })
    }
    params.call && params.call()
    ipc.sendToHost('downed')
    return
  }
  if (await exportLocalBlobFromEditor(params)) {
    return
  }
  let { type = '', call, isSave = false, partIds, chart } = params
  let fixType = () => {
    let itype = type
    if (type == "download_part") {
      itype = "partImage"
    }
    return itype
  }
  if (type == "download_part" || type == "download_partth") {
    exportType = "画布右键导出"
  }
  if (window.fileType == 'mind' && type == 'png') {
    type = 'download_part'
  }
  if (type == 'png1') {
    type = 'png'
  }
  if (type == 'pdfHD') {
    type = 'pdfhd'
  }
  if (!params.fromWaterMark && window.fileType != 'outline' && (
    type == "png" || type == "jpg" || type == "pnghd" || type == "jpghd" || type == "svg" || type == "pdf" || type == "pdfhd" || type == "download_part" || type == "download_parthd"
  )) {
    PoEditorInsert.comeFromDownloadPart = false
    PoEditorInsert.selectedIds = []
    if (type == "download_part" || type == "download_parthd") {
      PoEditorInsert.comeFromDownloadPart = true
      PoEditorInsert.selectedIds = PoEditorClient.getSelectedIds();
      type = "png"
      PoEditorInsert.imageSufix = "png"
    }
    if (type == "pdfhd") type = "pdf"
    exportInit.waterMarkPoupe(type)
    return
  }

  if (!window.isMember()) {
    if (type == 'pdfhd' || type == 'pdf' || type == 'svg' || type == 'pnghd' || type == 'jpghd'
      || type == 'xmind' || type == 'fmind' || type == 'word' || type == 'csv' || type == 'ppt'
    ) {
      const mapPositon = {
        'pdfhd': 'PDF_hd',
        'pnghd': 'PNG_hd',
        'jpghd': 'JPG_hd',
        'xmind': 'xmind',
        'fmind': 'freemind',
        'pdf': 'PDF',
        'svg': 'svg',
        'word': 'word',
        'csv': 'excle',
        'ppt': 'ppt'
      }
      const pay_position = `Down-${mapPositon[type]}`
      window.poCollect('展示支付弹窗', { '触发位置': `主动导出文件-类型${type}` })
      ipc.sendToHost('showDlgPayWebView', { pay_position, title: '升级会员解锁全部下载格式' })
      window.poExportWait && window.poExportWait.stop()
      return
    }
  }
  if (window.saveName.indexOf('</span>') > -1) {
    window.saveName = $('#topic-root .po-richtext-node-wrap').text().trim()
  }
  if (type == 'pdf' || type == 'pdfhd' || type == 'pdfHD') {
    const isCloudOnline = !window.isMyFile && pcUtil.isOnline()
    if (isCloudOnline) {
      exportPdfWithConfig(type, partIds, true, {})
    } else if (window.fileType == 'markdown') {
      exportPdfWithConfig(type, partIds, false, {})
    } else {
      exportPdfWithConfig(type, partIds, false, { format: 'original', orientation: 'portrait' })
    }
    return
  }
  if (type == 'md' || type == 'mdfull') {
    let def = PoEditorClient.getDef()
    const { posDocumentToMarkdown } = window.posmToMd;
    let doc = {
      diagram: { elements: def }
    }
    let markdown = posDocumentToMarkdown(doc, { style: 'heading', meta: type == 'mdfull' ? 'mdfull' : 'clean' });
    const fileImgReg = /!\[[^\]]*\]\((file:\/\/[^)]+)\)/g
    const fileUrls = []
    let match
    while ((match = fileImgReg.exec(markdown)) !== null) {
      if (fileUrls.indexOf(match[1]) === -1) {
        fileUrls.push(match[1])
      }
    }
    for (const fileUrl of fileUrls) {
      const path = fileUrl.replace('file:///', '').replace('file://', '')
      const ipcres = await ipc1.sendSync('loadFileB64', { type: 'local', path })
      if (ipcres) {
        const suffix = fileUrl.substring(fileUrl.lastIndexOf('.') + 1)
        markdown = markdown.replaceAll(fileUrl, `data:image/${suffix};base64,${ipcres}`)
      }
    }
    let blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    PoEditorInsert.triggerDownload(url, (window.saveName || "未命名文件") + `.md`)
    ipc.sendToHost('downed')
    return
  }

  if (!window.isMyFile && pcUtil.isOnline()) {
    newExportPower(type).then(async (powerRes) => {
      if (powerRes) {
        if (['pos', 'pos_all', 'all_pos'].includes(type)) {
          if (window.fileType == 'markdown') {
            const def = await PoEditorClient.getDef('pos')
            let blob;
            if (type === 'pos') {
              var jsonString = JSON.stringify(def);
              blob = new Blob([jsonString], { type: 'text/json' });
            } else {
              blob = new Blob([def], { type });
            }
            const url = URL.createObjectURL(blob);
            PoEditorInsert.triggerDownload(url, window.saveName + `.pos`)
            ipc.sendToHost('downed')
          }
          else if (type === 'pos_all' || type == 'all_pos') {
            onlineDownload(type)
          }
          else {
            let defs
            if (window.fileType === 'mind') {
              defs = JSON.stringify(editorGlobal.mindMap.getData())
            } else if (window.fileType === 'outline') {
              defs = JSON.stringify(outlineObj.model.data)
            } else {
              defs = JSON.stringify(Model.define)
            }
            const content = {
              "diagram": {
                "elements": JSON.parse(defs)
              },
              "meta": {
                "mainCanvasId": window.chartId,
                "exportTime": pcUtil.getCurrentTimeString(),
                "member": "",
                "diagramInfo": {
                  "creator": "",
                  "created": pcUtil.getCurrentTimeString(),
                  "modified": pcUtil.getCurrentTimeString(),
                  "title": chartObj.title,
                  "category": chartObj.category
                },
                "id": chartId,
                "type": "AIPROS Schema File",
                "version": "5.0"
              }
            }
            let saveData = {}
            saveData = {
              type: 'save', data: importClass.stringToBase64String(JSON.stringify(content)), path: window.saveName, suffix: 'pos',
            }
            console.log('save-file-begin', Date.now())
            // 保存
            ipc1.sendSync('saveFileB64', saveData).then((res) => {
              if (res != '') {
                new Toast({ type: 'success', msg: '保存成功' })
              }
            })
          }
        }
      }
      if (type.startsWith('visio')) {
        let i = 0
        let visioData = []
        function getDef(page) {
          //当前页面导出
          if (type.indexOf('all') == -1) {
            visioData = Model.define
            exportVisio()
            return
          }
          //所有页面导出
          if (page) {
            const canvas = []
            console.log(editorGlobal.poPagination.data)
            for (const k in editorGlobal.poPagination.data) {
              canvas.push(editorGlobal.poPagination.data[k])
            }

            Promise.all(canvas.map(d => {
              return new Promise(resolve => {
                // 读取画布内容
                FileDatabase.getChartDefById(window.chartId, d.definitionId, (def) => {
                  // .pos文件集合
                  resolve(JSON.parse(def.definition))
                })
              })
            })
            ).then((res) => {
              visioData = res
              exportVisio()
            })
          } else {
            exportVisio()
          }
        }
        function exportVisio() {
          // 修改矢量图地址
          if (visioData.length) {
            visioData.forEach((d) => {
              for (const k in d.elements) {
                if (d.elements[k].path && d.elements[k].path[0] &&
                  d.elements[k].path.length > 0 && d.elements[k].path[0].hasOwnProperty('fillStyle')) {
                  if (d.elements[k].path[0].fillStyle.fileId) {
                    d.elements[k].path[0].fillStyle.fileId = './../../static' + d.elements[k].path[0].fillStyle.fileId
                  }
                }
                else if (d.elements[k].hasOwnProperty('fillStyle')) {
                  if (d.elements[k].fillStyle.fileId) {
                    d.elements[k].fillStyle.fileId = './../../static' + d.elements[k].fillStyle.fileId
                  }
                }
              }
            })
          }
          else {
            for (const k in visioData.elements) {
              if (visioData.elements[k].path && visioData.elements[k].path[0] &&
                visioData.elements[k].path.length > 0 && visioData.elements[k].path[0].hasOwnProperty('fillStyle')) {
                if (visioData.elements[k].path[0].fillStyle.fileId) {
                  visioData.elements[k].path[0].fillStyle.fileId = './../../static' + visioData.elements[k].path[0].fillStyle.fileId
                }
              }
              else if (visioData.elements[k].hasOwnProperty('fillStyle')) {
                if (visioData.elements[k].fillStyle.fileId) {
                  visioData.elements[k].fillStyle.fileId = './../../static' + visioData.elements[k].fillStyle.fileId
                }
              }
            }
          }
          VisioPo.exportVsdx({
            type: 'base64',
            data: visioData,
            handleMedia: async function ({ data, ext }) {
              console.log(data, ext)
            },
          }).then(function (blob) {
            // 修改矢量图地址修改矢量图地址
            if (visioData.length) {
              visioData.forEach((d) => {
                for (const k in d.elements) {
                  if (d.elements[k].path && d.elements[k].path[0] &&
                    d.elements[k].path.length > 0 && d.elements[k].path[0].hasOwnProperty('fillStyle')) {
                    if (d.elements[k].path[0].fillStyle.fileId) {
                      d.elements[k].path[0].fillStyle.fileId = d.elements[k].path[0].fillStyle.fileId.replace('./../../static', '')
                    }
                  }
                  else if (d.elements[k].hasOwnProperty('fillStyle')) {
                    if (d.elements[k].fillStyle.fileId) {
                      d.elements[k].fillStyle.fileId = d.elements[k].fillStyle.fileId.replace('./../../static', '')
                    }
                  }
                }
              })
            }
            else {
              for (const k in visioData.elements) {
                if (visioData.elements[k].path && visioData.elements[k].path[0] &&
                  visioData.elements[k].path.length > 0 && visioData.elements[k].path[0].hasOwnProperty('fillStyle')) {
                  if (visioData.elements[k].path[0].fillStyle.fileId) {
                    visioData.elements[k].path[0].fillStyle.fileId = visioData.elements[k].path[0].fillStyle.fileId.replace('./../../static', '')
                  }
                }
                else if (visioData.elements[k].hasOwnProperty('fillStyle')) {
                  if (visioData.elements[k].fillStyle.fileId) {
                    visioData.elements[k].fillStyle.fileId = visioData.elements[k].fillStyle.fileId.replace('./../../static', '')
                  }
                }
              }
            }
            const saveData = {
              type: 'save', data: blob, path: (window.saveName || '未命名文件'), suffix: 'vsdx',
            }
            console.log('save-visio-btoa-end', Date.now())
            if (window.downType) {
              ipc.sendToHost('down')
            }
            ipc1.sendSync('saveFileB64', saveData).then((res) => {
              console.log('save-visio-end', Date.now())
              if (res != '') {
                new Toast({ type: 'success', msg: '保存成功' })
                console.log(Date.now())
                if (window.downType) {
                  ipc.sendToHost('downed')
                }
              }
              else {
                if (window.downType) {
                  ipc.sendToHost('cancel')
                }
              }
            })
          })
        }
        if (typeof VisioPo != 'object') {
          bigPipe.render({ js: [staticBasePath + '/assets/js/visio.sdk.umd.js'] }, function () {
            getDef(editorGlobal.poPagination.list[i])
          })
        } else {
          getDef(editorGlobal.poPagination.list[i])
        }
        return
      }
      if (type.startsWith('csv')) {
        onlineDownload(type)
        return
      }
      if (type.startsWith('word')) {
        onlineDownload(type, chart ? chart : {})
        return
      }
      if (type.startsWith('opml')) {
        let defs = deepCopy()
        handleExportOpml(defs).then((res) => {
          const saveData = {
            type: 'save', data: res, path: chartObj.title, suffix: type,
          }
          ipc1.sendSync('saveFileB64', saveData).then((res) => {
            if (res != '') {
              new Toast({ type: 'success', msg: '保存成功' })
              console.log(Date.now())
            }
          })
        })
        return
      }
      if (['xmind', 'fmind', 'ppt'].includes(type)) {
        if (window.fileType == 'markdown') {
          let pos = await PoEditorClient.getDef('pos')
          let def = pos.diagram.elements
          if (def == undefined) {
            def = JSON.parse(FileDatabase.newChartDef(
              'mind',
              '',
              ''
            ).definition)
          }
          exportFile1.xmind({ def })
        }
        else {
          onlineDownload(type)
        }
        return
      }
      if (['md', 'markdown'].includes(type)) {
        const def = await PoEditorClient.getDef()
        const blob = new Blob([def], { type: 'md' });
        const url = URL.createObjectURL(blob);
        PoEditorInsert.triggerDownload(url, window.saveName + `.md`)
        ipc.sendToHost('downed')
        return
      }
      let realType = type
      window.PoEditorClient.exportFile(realType, (partIds ? partIds : []), function (img) {
        exportFile1.pngOrSvg(window.chartId, type, img, chartObj.title, false, true)
      })
    })
  }
  else {
    console.log(Date.now())
    if (['pos', 'pos_all', 'all_pos'].includes(type)) {
      if (window.fileType == 'markdown') {
        const def = await PoEditorClient.getDef('pos')
        const jsonString = JSON.stringify(def);
        const blob = new Blob([jsonString], { type: 'text/json' });
        const url = URL.createObjectURL(blob);
        PoEditorInsert.triggerDownload(url, window.saveName + `.pos`)
        ipc.sendToHost('downed')
      }
      else {
        // 初始化数据集
        const data = { type: 'pos', canvas: [], meta: [], chartObj: [] }
        let defs = ''
        // 判断pos类型导出方式并获取def数据
        if (window.fileType === 'mind') {
          defs = JSON.stringify(editorGlobal.mindMap.getData())
          data.type = 'pof'
          if (type == 'pos_all' || type == 'all_pos') { data.type = window.filepath && window.filepath != '' && window.filepath.endsWith('poso') ? 'poso' : 'posm' }

        } else if (window.fileType === 'outline') {
          defs = JSON.stringify(outlineObj.model.data)
          data.type = 'pof'
          if (type == 'pos_all' || type == 'all_pos') { data.type = window.filepath && window.filepath != '' && window.filepath.endsWith('posm') ? 'posm' : 'poso' }
        } else {
          defs = JSON.stringify(Model.define)
          data.type = 'pos'
          if (type == 'pos_all' || type == 'all_pos') data.type = 'posf'
        }
        const canvas = []
        if (type == 'pos_all' || type == 'all_pos') {
          console.log(editorGlobal.poPagination.data)
          for (const k in editorGlobal.poPagination.data) {
            canvas.push(editorGlobal.poPagination.data[k])
          }
        }
        else {
          canvas.push({
            canvasId: editorGlobal.poPagination.pageId,
            definitionId: editorGlobal.poPagination.pageId,
            title: '画布1',
            sort: 0
          })
        }
        // meta.json
        data.meta = [
          {
            name: 'meta.json',
            data: {
              "pages": canvas,
              "mainCanvasId": canvas[0].definitionId,
              "exportTime": pcUtil.getCurrentTimeString(),
              "member": "",
              "diagramInfo": {
                "creator": "",
                "created": pcUtil.getCurrentTimeString(),
                "modified": pcUtil.getCurrentTimeString(),
                "title": chartObj.title,
                "category": chartObj.category
              },
              "id": window.chartId,
              "type": "AIPROS Schema File",
              "version": "5.0"
            }
          }
        ]
        // chartObj.json
        data.chartObj = [
          {
            name: 'chartObj.json',
            data: chartObj
          }
        ]
        // 遍历画布
        canvas.forEach(d => {
          // 读取画布内容
          FileDatabase.getChartDefById(window.chartId, d.definitionId, (def) => {
            // .pos文件集合
            data.canvas.push({
              name: `${d.definitionId}.pos`,
              data:
              {
                "diagram": {
                  "elements": JSON.parse(def.definition)
                },
                "meta": {
                  "mainCanvasId": d.definitionId,
                  "exportTime": pcUtil.getCurrentTimeString(),
                  "member": "",
                  "diagramInfo": {
                    "creator": "",
                    "created": pcUtil.getCurrentTimeString(),
                    "modified": pcUtil.getCurrentTimeString(),
                    "title": chartObj.title,
                    "category": chartObj.category
                  },
                  "id": d.definitionId,
                  "type": "AIPROS Schema File",
                  "version": "5.0"
                }
              }
            })
          })
        });
        Promise.all(canvas.map(d => {
          return new Promise(resolve => {
            // 读取画布内容
            FileDatabase.getChartDefById(window.chartId, d.definitionId, (def) => {
              // .pos文件集合
              resolve({
                name: `${d.definitionId}.pos`,
                data:
                {
                  "diagram": {
                    "elements": JSON.parse(def.definition)
                  },
                  "meta": {
                    "mainCanvasId": d.definitionId,
                    "exportTime": pcUtil.getCurrentTimeString(),
                    "member": "",
                    "diagramInfo": {
                      "creator": "",
                      "created": pcUtil.getCurrentTimeString(),
                      "modified": pcUtil.getCurrentTimeString(),
                      "title": chartObj.title,
                      "category": chartObj.category
                    },
                    "id": d.definitionId,
                    "type": "AIPROS Schema File",
                    "version": "5.0"
                  }
                }
              })
            })
          })
        })
        ).then((res) => {
          data.canvas = res
          exportFile1.pos(data, window.fileType, isSave, canvas).then(() => {
            call && call()
          })
        })
      }
      return
    }
    if (type.startsWith('md') || type.startsWith('markdown')) {
      exportFile1.markdown(isSave).then(() => {
        call && call()
      })
      return
    }
    if (type.startsWith('visio')) {
      let i = 0
      let visioData = []
      function getDef(page) {
        //当前页面导出
        if (type.indexOf('all') == -1) {
          visioData = Model.define
          exportVisio()
          return
        }
        //所有页面导出
        if (page) {
          const canvas = []
          console.log(editorGlobal.poPagination.data)
          for (const k in editorGlobal.poPagination.data) {
            canvas.push(editorGlobal.poPagination.data[k])
          }

          Promise.all(canvas.map(d => {
            return new Promise(resolve => {
              // 读取画布内容
              FileDatabase.getChartDefById(window.chartId, d.definitionId, (def) => {
                // .pos文件集合
                resolve(JSON.parse(def.definition))
              })
            })
          })
          ).then((res) => {
            visioData = res
            exportVisio()
          })
        } else {
          exportVisio()
        }
      }
      function exportVisio() {
        // 修改矢量图地址
        if (visioData.length) {
          visioData.forEach((d) => {
            for (const k in d.elements) {
              if (d.elements[k].path && d.elements[k].path[0] &&
                d.elements[k].path.length > 0 && d.elements[k].path[0].hasOwnProperty('fillStyle')) {
                if (d.elements[k].path[0].fillStyle.fileId) {
                  d.elements[k].path[0].fillStyle.fileId = './../../static' + d.elements[k].path[0].fillStyle.fileId
                }
              }
              else if (d.elements[k].hasOwnProperty('fillStyle')) {
                if (d.elements[k].fillStyle.fileId) {
                  d.elements[k].fillStyle.fileId = './../../static' + d.elements[k].fillStyle.fileId
                }
              }
            }
          })
        }
        else {
          for (const k in visioData.elements) {
            if (visioData.elements[k].path && visioData.elements[k].path[0] &&
              visioData.elements[k].path.length > 0 && visioData.elements[k].path[0].hasOwnProperty('fillStyle')) {
              if (visioData.elements[k].path[0].fillStyle.fileId) {
                visioData.elements[k].path[0].fillStyle.fileId = './../../static' + visioData.elements[k].path[0].fillStyle.fileId
              }
            }
            else if (visioData.elements[k].hasOwnProperty('fillStyle')) {
              if (visioData.elements[k].fillStyle.fileId
              ) {
                visioData.elements[k].fillStyle.fileId = './../../static' + visioData.elements[k].fillStyle.fileId
              }
            }
          }
        }
        VisioPo.exportVsdx({
          type: 'base64',
          data: visioData,
          handleMedia: async function ({ data, ext }) {
            console.log(data, ext)
          },
        }).then(function (blob) {
          // 修改矢量图地址修改矢量图地址
          if (visioData.length) {
            visioData.forEach((d) => {
              for (const k in d.elements) {
                if (d.elements[k].path && d.elements[k].path[0] &&
                  d.elements[k].path.length > 0 && d.elements[k].path[0].hasOwnProperty('fillStyle')) {
                  if (d.elements[k].path[0].fillStyle.fileId) {
                    d.elements[k].path[0].fillStyle.fileId = d.elements[k].path[0].fillStyle.fileId.replace('./../../static', '')
                  }
                }
                else if (d.elements[k].hasOwnProperty('fillStyle')) {
                  if (d.elements[k].fillStyle.fileId) {
                    d.elements[k].fillStyle.fileId = d.elements[k].fillStyle.fileId.replace('./../../static', '')
                  }
                }
              }
            })
          }
          else {
            for (const k in visioData.elements) {
              if (visioData.elements[k].path && visioData.elements[k].path[0] &&
                visioData.elements[k].path.length > 0 && visioData.elements[k].path[0].hasOwnProperty('fillStyle')) {
                if (visioData.elements[k].path[0].fillStyle.fileId) {
                  visioData.elements[k].path[0].fillStyle.fileId = visioData.elements[k].path[0].fillStyle.fileId.replace('./../../static', '')
                }
              }
              else if (visioData.elements[k].hasOwnProperty('fillStyle')) {
                if (visioData.elements[k].fillStyle.fileId) {
                  visioData.elements[k].fillStyle.fileId = visioData.elements[k].fillStyle.fileId.replace('./../../static', '')
                }
              }
            }
          }
          const saveData = {
            type: 'save', data: blob, path: (window.saveName || '未命名文件'), suffix: 'vsdx',
          }
          console.log('save-visio-btoa-end', Date.now())
          if (window.downType) {
            ipc.sendToHost('down')
          }
          ipc1.sendSync('saveFileB64', saveData).then((res) => {
            console.log('save-visio-end', Date.now())
            if (res != '') {
              new Toast({ type: 'success', msg: '保存成功' })
              console.log(Date.now())
              if (window.downType) {
                ipc.sendToHost('downed')
              }
            }
            else {
              if (window.downType) {
                ipc.sendToHost('cancel')
              }
            }
          })
        })
      }
      // getDef(editorGlobal.poPagination.list[i])
      if (typeof VisioPo != 'object') {
        bigPipe.render({ js: [staticBasePath + '/assets/js/visio.sdk.umd.js'] }, function () {
          getDef(editorGlobal.poPagination.list[i])
        })
      } else {
        getDef(editorGlobal.poPagination.list[i])
      }
      return
    }
    if (type.startsWith('csv')) {
      let defs = deepCopy()
      handleExportCsv(defs).then((res) => {
        const saveData = {
          type: 'save', data: res, path: window.saveName, suffix: type,
        }
        if (window.downType) {
          ipc.sendToHost('down')
        }
        ipc1.sendSync('saveFileB64', saveData).then((res) => {
          if (res != '') {
            new Toast({ type: 'success', msg: '保存成功' })
            console.log(Date.now())
            if (window.downType) {
              ipc.sendToHost('downed')
            }
          }
          else {
            if (window.downType) {
              ipc.sendToHost('cancel')
            }
          }
        })
      })
      return
    }
    if (type.startsWith('word')) {
      let defs = chart || deepCopy()
      handleExportDocx(defs).then((res) => {
        const saveData = {
          type: 'save', data: res, path: window.saveName, suffix: 'docx',
        }
        if (window.downType) {
          ipc.sendToHost('down')
        }
        ipc1.sendSync('saveFileB64', saveData).then((res) => {
          if (res != '') {
            new Toast({ type: 'success', msg: '保存成功' })
            console.log(Date.now())
            if (window.downType) {
              ipc.sendToHost('downed')
            }
          }
          else {
            if (window.downType) {
              ipc.sendToHost('cancel')
            }
          }
        })
      })
      return
    }
    if (type.startsWith('opml')) {
      let defs = deepCopy()
      handleExportOpml(defs).then((res) => {
        const saveData = {
          type: 'save', data: res, path: chartObj.title, suffix: type,
        }
        if (window.downType) {
          ipc.sendToHost('down')
        }
        ipc1.sendSync('saveFileB64', saveData).then((res) => {
          if (res != '') {
            new Toast({ type: 'success', msg: '保存成功' })
            if (window.downType) {
              ipc.sendToHost('downed')
            }
          }
          else {
            if (window.downType) {
              ipc.sendToHost('cancel')
            }
          }
        })
      })
      return
    }
    if (type.startsWith('ppt')) {
      let defs = deepCopy()
      exportPPTX.init(defs)
      return
    }
    if (['xmind', 'fmind'].includes(type)) {
      let def = ''
      if (window.fileType === 'outline') {
        def = outlineObj.model.data
      } else if (window.fileType == 'markdown') {
        let pos = await PoEditorClient.getDef('pos')
        def = pos.diagram.elements
      } else {
        def = editorGlobal.mindMap.getData()
      }
      def = JSON.stringify(def)
      if (def == undefined) {
        def = JSON.parse(FileDatabase.newChartDef(
          'mind',
          '',
          ''
        ).definition)
      }
      exportFile1.xmind({ def })
      return
    }
    let realType = type
    window.PoEditorClient.exportFile(realType, (partIds ? partIds : []), function (img) {
      exportFile1.pngOrSvg(window.chartId, type, img, chartObj.title)
    })
  }
}
// 检测用户权益
window.editorGlobalConfig.onTestPrivilege = function (params, callback) {
  const privilege = JSON.parse(localStorage.getItem('privilege'))
  const memberPrivilege = {
    flowShapeNum: 100000, //图形数量(100000不限)
    mindShapeNum: Infinity,//图形数量(100000不限)
    themesCustomise: Infinity, //自定义主题(1,100000不限)
    backgroundImage: true, //设置背景图
    Latex: true,//公式
    historyNum: 999999,
    download: true,//会员导出
    watermark: true,
    pasteImage: true,//粘贴截图
    myShape: true,//插入水印
    clipboardImage: true,
    insert_watermark: true,//插入水印
    mindTheme: true,
    uploadFile: true, //上传附件
    AIGC: true,//AIGC
    canvasNum: 30,//画布数量
    OCR: 0,//限免
    uploadCoverImg: true, //上传大图	
    handDrawn: true, //手绘
    skeleton: true, //思维导图骨架
    themereuse: true, //风格复用
    themeReuse: true, //风格复用
  }
  const noMemberPrivilege = {
    flowShapeNum: 60, //图形数量(Infinity不限)
    mindShapeNum: 80,//图形数量(Infinity不限)
    themesCustomise: 1, //自定义主题(1,100000不限)
    backgroundImage: false, //设置背景图
    historyNum: 5,
    Latex: false, //公式
    download: false, //会员导出
    downloadPart: true, //部分导出
    watermark: true, //插入水印
    myShape: true,//我的图形
    flowTemplate: false, //模板
    mindTemplate: false, //模板
    mindTheme: false, //风格
    clipboardImage: false, //粘贴截图
    insert_watermark: false, //po水印
    uploadFile: false, //上传附件
    AIGC: false,
    canvasNum: 1, //多画布画布数量
    OCR: 0,//限免
    uploadCoverImg: false, //上传大图
    handDrawn: false, //手绘
    skeleton: false, //思维导图骨架
    themereuse: false, //风格复用
    themeReuse: false, //风格复用
  }
  if (!window.isMyFile) {
    // 有网 获取线上 Privilege
    if (pcUtil.isOnline()) {
      UserOperation.getUserPrivilege(
        false,
        (user = {}) => {
          window.memberObj = user
          localStorage.setItem('privilege', JSON.stringify(user))
          if (window.isMember()) {
            callback(memberPrivilege)

          }
          else {
            callback(noMemberPrivilege)
          }
        },
        pcUtil.isOnline()
      )
    } else {
      window.memberObj = privilege
      if (window.isMember()) {
        callback(memberPrivilege)
      }
      else {
        callback(noMemberPrivilege)
      }
    }
  }
  else {
    if (pcUtil.isOnline()) {
      UserOperation.getUserPrivilege(
        false,
        (user = {}) => {
          window.memberObj = user
          localStorage.setItem('privilege', JSON.stringify(user))
          if (window.isMyFile) {
            memberPrivilege.AIGC = false
            noMemberPrivilege.AIGC = false
          }
          if (window.isMember()) {
            callback(memberPrivilege)
          }
          else {
            callback(noMemberPrivilege)
          }
        },
        pcUtil.isOnline()
      )
    } else {
      window.memberObj = privilege
      if (window.isMyFile) {
        memberPrivilege.AIGC = false
        noMemberPrivilege.AIGC = false
      }
      if (window.isMember()) {
        callback(memberPrivilege)
      }
      else {
        callback(noMemberPrivilege)
      }
    }

  }
}
// vip支付弹框
window.editorGlobalConfig.onShowVipLimit = function (params, callback) {
  console.log(params)

  if (isOnlineToast()) {
    const { title, vipLimit, pointsSource, type } = params
    console.log(vipLimit)

    let pay_position = `Value-${vipLimit}`
    if (!vipLimit && pointsSource) {
      if (pointsSource === '设置主题风格') {
        pay_position = `Value-style`
      }
      if (pointsSource === "插入附件") {
        pay_position = `Value-insert_annex`
      }
    }

    window.poCollect('展示支付弹窗', { '触发位置': pointsSource })
    if (type === 'aiPoint') {
      if (!window.isMember()) {
        ipc.sendToHost('showDlgPayWebView', {
          pay_position: params.pointspage || pay_position,
          pointssource: params.pointssource || pointsSource || 'AI生成次数不足pc',
          title: title || '支付'
        })
      } else {
        ipc.sendToHost('showDlgPayWebView', {
          pay_position: params.pointspage || pay_position,
          pointssource: params.pointssource || pointsSource || 'AI生成次数不足pc',
          title: title || '支付',
          aiPay: true
        })
      }
      return
    }
    ipc.sendToHost('showDlgPayWebView1', { pay_position, pointspage: params.pointspage, pointssource: params.pointssource, title })
  }
}
window.editorGlobalConfig.onBuyAiPoints = function (detail) {
  if (!isOnlineToast()) return
  var d = detail || {}
  var isMember = typeof d.isMember === 'boolean' ? d.isMember : window.isMember()
  var isPackage = d.kind === 'package' || isMember
  var pointPtype = location.pathname.indexOf('mindmap') > -1 ? '思维导图' : '流程图'
  ipc.sendToHost('showDlgPayWebView', {
    pay_position: d.pay_position || (pointPtype + '编辑页'),
    pointssource: d.triggerPos || d.pointssource || 'AI生成次数不足pc',
    title: isPackage ? (d.title || '支付') : (d.title || '升级畅享全部会员权益'),
    aiPay: isPackage
  })
}
// 编辑器版本低提示
window.editorGlobalConfig.onEditorVersion = function (data) {
  new Toast({ autoClose: false, type: "warning", msg: "当前编辑器版本过低，暂不支持文件编辑，请更新客户端后再试" })
}
// 图片链接
window.editorGlobalConfig.getImageText = function (params, cb) {
  if (params.url.startsWith('data')) {
    cb({ text: '', type: '' })
  }
  else if (params.url.startsWith('http')) {
    cb({ text: '', type: '' })
  }
  else {
    if (params.url.indexOf('.svg') == -1) {
      if (params.url.indexOf('.gif') > -1) {
        params.url = encodeURI(params.url)
        cb({ text: '123', type: 'image/gif' })
      } else {
        cb({ text: '', type: 'png' })
      }
    }
    else {
      let url = `${webRoot}/v5_editor/source/static/${params.url.replace(window.staticBasePath + '/', '')}`
      if (url.lastIndexOf('?_') > -1) {
        url = url.substring(0, url.lastIndexOf('?_'))
      }
      ipc1.sendSync('loadFileB64', { type: 'local', path: url }).then((data) => {
        cb({ text: atob(data), type: 'svg' })
      })
    }
  }
}
// @功能给最近联系人发通知钩子
window.editorGlobalConfig.mentionNotice = function (data, callback) {
  if (data.remind !== undefined) {
    injectCommon.choosePeople(data, callback)
  } else {
    injectCommon.triggerLookTip(data.targetId, data.userName, data.userId)
  }
}
//  文档打开钩子
window.editorGlobalConfig.openFileUrl = function (data, cb) {
  const { url = '', type = '', title = '' } = data
  if (type == '') {
    let linkUrl = '', chartId = ''
    const regex = /\/([a-f0-9]{24})$/;
    let match = url.match(regex);

    if (match) {
      chartId = match[1];
    } else {
      new Toast({ type: 'error', msg: '操作失败' })
    }
    if (url.indexOf('diagraming') > -1 || url.indexOf('uncategorized') > -1) {
      linkUrl = './src/v5_editor/source/compile/diagrams/index.html'
    } else if (url.indexOf('outline') > -1) {
      linkUrl = './src/v5_editor/source/compile/outline/index.html'
    } else {
      linkUrl = './src/v5_editor/source/compile/mindmap/index.html'
    }
    ipc.sendToHost('addTab', { src: `${linkUrl}?token=token&chartId=${chartId}&dbId=` })
  }
  else if (type == 'file') {
    fetch(url).then((res) => {
      res.arrayBuffer().then(data1 => {
        let title1 = title == '' ? '123' : title.substring(0, title.lastIndexOf('.'))
        let suffix = title == '' ? 'bak' : title.substring(title.lastIndexOf('.') + 1)
        // 保存
        ipc1.sendSync('saveFileB64', { type: 'save', data: importClass.arrayBufferToBase64(data1), path: title1, suffix: suffix }).then((resPath) => {
          if (resPath != '') {
            new Toast({ type: 'success', msg: '保存成功' })
          }
        })
      })
    })
  }
  else if (type == 'url') {
    const maskId = '#po_open_url_confirm_mask'
    if ($(maskId).length === 0) {
      $('body').append(HtmlStr.openUrlConfirm())
    }
    const maskEl = $(maskId)
    maskEl.find('.po-open-url-link').text(url)
    const closeDialog = function () {
      maskEl.hide()
    }
    maskEl.off('click.poOpenUrlConfirm').on('click.poOpenUrlConfirm', function (e) {
      if (e.target.id === 'po_open_url_confirm_mask') {
        closeDialog()
      }
    })
    maskEl.find('.po-open-url-cancel').off('click').on('click', function () {
      closeDialog()
    })
    maskEl.find('.po-open-url-continue').off('click').on('click', function () {
      closeDialog()
      ipc.send('openFileFor', url)
    })
    maskEl.show()
  } else {
    cb && cb()
  }
}
// 模板展示
window.editorGlobalConfig.onShowInsertTemplate = function (params) {
  if (pcUtil.isOnline()) {
    if (localStorage.getItem('current_category') == params.category && $("#designer_insert_temp_wrap .bottom_temp_box").length > 0) {
      return
    }
    outDesignerInsertTemp.init(chartObj, params);
    if (params && params.category) {
      localStorage.setItem('current_category', params.category);
    }
  }
  else {
    window.toast_.offLine()
    return
  }
}
function stopAiUiOnOffline() {
  try { new Toast({ type: "warning", msg: "网络已断开" }) } catch (e) { }
  try {
    var $stop = $('.po-ai-copilot .copilot_footer .generate-stop')
    if ($stop.length && $stop.is(':visible')) {
      $stop.trigger('click')
    } else {
      $('.po-ai-copilot .copilot_footer .send').removeClass('loading').show()
      $stop.hide()
      $('.po-ai-copilot .copilot_footer .copilot-footer-item').removeClass('disabled')
    }
  } catch (e) { }
}
document.addEventListener('click', function (e) {
  var el = e.target && e.target.closest && e.target.closest('.po-ai-copilot .copilot_footer .send')
  if (!el || navigator.onLine) return
  e.preventDefault()
  e.stopPropagation()
  e.stopImmediatePropagation()
  stopAiUiOnOffline()
}, true)
// ai的Websocket
window.editorGlobalConfig.onBeforeAIWebsocket = function (params, cb) {
  var token = localStorage.getItem('processon_token') || ''
  if (token) document.cookie = 'token=' + token + ';path=/'
  var host = (ipc.sendSync('getGlobal', 'host') || '').replace(/\/$/, '')
  cb({ url: host + '/api/personal/ai/point/process/ai/consume' })
}
window.editorGlobalConfig.onBeforeAIWebsocketNew = function (params, cb) {
  var token = localStorage.getItem('processon_token') || ''
  if (token) document.cookie = 'token=' + token + ';path=/'
  var host = (ipc.sendSync('getGlobal', 'host') || '').replace(/\/$/, '')
  cb({ url: host + '/api/personal/ai/point/process/ai/consume' })
}
// 修改title
window.editorGlobalConfig.saveTitle = function (title) {
  if (window.fileType == 'markdown') {
    window.MarkdownBar.rename(title)
  }
}
// markdown-创建文件
window.editorGlobalConfig.createFile = function (params) {
  const { data, success, error } = params
  pcUtil.ajax({
    url: `/api/personal/diagraming/${chartObj.folderId}/new`,
    data: data,
    timeout: 1000 * 60, //超时时间设置，单位毫秒
    type: 'post',
    noJump: true,
    success: function (data) {
      success(data.data)
    }, error: function (data) {
      error(data.data)
    }
  });
}
// markdown-查询我的文件
window.editorGlobalConfig.queryUserFile = function (params) {
  const { data, success, error, complete } = params
  pcUtil.ajax({
    url: '/api/personal/folder/user/files',
    data: data,
    timeout: 1000 * 60, //超时时间设置，单位毫秒
    type: 'get',
    success: function (e) {
      success(e.data)
      setTimeout(() => {
        const dataL = $('div[data-type=myfile] .item-thumb .thumb-img')
        for (let i = 0; i < dataL.length; i++) {
          $(dataL[i]).attr('src', 'https://www.processon.com' + $(dataL[i]).attr('src'))
        }
      }, 300);
    }, error: function () {
      error()
    }, complete: function (XMLHttpRequest, status) { //请求完成后最终执行参数
      complete(XMLHttpRequest, status)
    }
  });
}
// markdown-插入流程图/插入思维导图
window.editorGlobalConfig.getInsertFlowOrMindUrl = function (params) {
  const { type, chartId } = params
  if (type == 'flow') {
    const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
      `http://localhost:5173/src/v5_editor/source/compile/diagrams/index.html?token=token&chartId=${chartId}&dbId=undefined`
      : encodeURI(`file:///${webRoot}/v5_editor/source/compile/diagrams/index.html?token=token&chartId=${chartId}&dbId=undefined`)
    return baseUrl
  }
  else {
    const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
      `http://localhost:5173/src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${chartId}&dbId=undefined`
      : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${chartId}&dbId=undefined`)
    return baseUrl
  }
}
// markdown的sock地址
window.editorGlobalConfig.onBeforeCreateWebsocketForMarkdown = function (params, cb) {
  cb({ url: ipc.sendSync('getGlobal', 'markdownSocketUrl'), token: localStorage.getItem('processon_token') })
}
// markdown的公共资源路径
window.editorGlobalConfig.getCreateStaticUrl = function (params, cb) {
  cb({ url: '../v5_editor/source/static' })
}
// 思维导图-演示导出png和pdf
window.editorGlobalConfig.onBeforeExportPresentFile = function (data) {
  importClass.blobToBase64Simple(data.content).then((base64) => {
    const saveData = {
      type: 'save', data: base64, path: data.title, suffix: data.type == 'png' ? 'zip' : 'pdf',
    }
    ipc1.sendSync('saveFileB64', saveData).then((res) => {
      if (res != '') {
        // 触发保存逻辑
        new Toast({
          type: "success",
          msg: "保存成功"
        });
      }
    })
  })
}
// markwown 内容更改回调
window.editorGlobalConfig.onChange = function (data) {
  if (window.isView) {
    return
  }
  if (window.defVersion.length > 0) {
    ipc.sendToHost("saveStatus", window.TABGROUPID, "unsave")
    if (window.isMyFile && window.defVersion.length > 0) {
      const index = window.defVersion.findIndex(d => d.id == window.chartId)
      if (index > -1) {
        window.defVersion[index].version++
        window.defVersion[index].isSave = false
      }
    } else {
      window.defVersion.push({ id: window.chartId, version: 1, isSave: false })
    }
  } else {
    window.defVersion.push({ id: window.chartId, version: 1, isSave: true })
  }

  fileCache.add(chartObj.chartId)
  if (!window.isMyFile && pcUtil.isOnline()) {
    console.log('cloudTimer', window.cloudTimer)
    console.log('cloudTimer', window.cloudTimer1)
    if (window.cloudTimer) {
      clearTimeout(cloudTimer)
    }
    if (window.cloudTimer1) {
      clearTimeout(window.cloudTimer1)
    }
    if (window.cloudTimer2) {
      clearTimeout(window.cloudTimer2)
    }
    ipc.sendToHost('setFileIcon', window.TABGROUPID, window.isMyFile, 0)
    ipc.sendToHost("saveStatus", window.TABGROUPID, "unsave")
    window.cloudTimer = setTimeout(() => {
      ipc.sendToHost('setFileIcon', window.TABGROUPID, window.isMyFile, 1)
      ipc.sendToHost("saveStatus", window.TABGROUPID, "saved")
      window.cloudTimer1 = setTimeout(() => {
        ipc.sendToHost('setFileIcon', window.TABGROUPID, window.isMyFile, 2)
        window.cloudTimer2 = setTimeout(() => {
          ipc.sendToHost('setFileIcon', window.TABGROUPID, window.isMyFile, 0)
        }, 2000);
      }, 2000);
    }, 3000);
  }
}
window.editorGlobalConfig.pluginsConfig = []

window.editorGlobalConfig.aiServiceBaseInfo = {
  userType: 'REAL',
  reqChannel: 'c',
  reqSourceClient: 'pc',
  reqSourceLocation: window.fileType == 'mind' ? 'mind_editor' : 'flow_editor',
}

window.editorGlobalConfig.getAiRequestInfoConfig = function (params, cb) {
  cb && cb({
    baseInfo: {
      reqChannel: 'c',
      reqSourceClient: 'pc',
    },
  })
}

window.editorGlobalConfig.onAiPointTip = function (data, callback) {
  var $self = $(data.currentTarget || data.target);
  if (data && data.type === "mouseleave") {
    var timer = setTimeout(function () {
      window.hideAiPointPopup && window.hideAiPointPopup();
    }, 300);
    $self.data('aiPopupTimer', timer);
  } else if (data && (data.type === "click" || data.type === "mouseenter")) {
    clearTimeout($self.data('aiPopupTimer'));
    var host = ipc.sendSync('getGlobal', 'host');
    if (!window.__aiPointAjaxPatched) {
      window.__aiPointAjaxPatched = true;
      var rawAjax = window.oldAjax || $.ajax;
      $.ajax = function (opts) {
        if (opts && typeof opts.url === 'string' && opts.url.indexOf('http') < 0) {
          opts.url = host + opts.url;
          var token = window.localStorage.getItem('processon_token') || '';
          opts.headers = Object.assign({}, opts.headers || {}, { token: token });
        }
        return rawAjax.apply(this, arguments);
      };
    }
    if (!window.__aiPointPopupClickPatched) {
      window.__aiPointPopupClickPatched = true;
      $('body').on('click.aiPointOffline', '.ai-point-link', function (e) {
        var text = ($(this).text() || '').trim();
        if (text.includes('查看更多')) {
          e.stopImmediatePropagation();
          e.preventDefault();
          $('.float-popup').hide();
          window.hideAiPointPopup && window.hideAiPointPopup();
          ipc.invoke('open-childWindow', { section: 'orderInfo', tab: '4' });
          return false;
        }
        if (text.includes('获取更多')) {
          e.stopImmediatePropagation();
          e.preventDefault();
          $('.float-popup').hide();
          window.hideAiPointPopup && window.hideAiPointPopup();
          ipc.sendToHost('showDlgPayWebView', {
            title: '升级畅享全部会员权益',
            pay_position: 'AI点数menu',
            pointssource: 'AI点数menu'
          });
          return false;
        }
      });
      $('body').on('click.aiPointOffline', '.float-popup .purple-link:not(.disabled)', function (e) {
        e.stopImmediatePropagation();
        e.preventDefault();
        $('.float-popup').hide();
        window.hideAiPointPopup && window.hideAiPointPopup();
        ipc.sendToHost('showDlgPayWebView', {
          title: '升级畅享全部会员权益',
          pay_position: 'AI点数menu',
          pointssource: 'AI点数menu',
          aiPay: true
        });
        return false;
      });
    }
    if (typeof getAiPointShowPopup == "undefined" || !getAiPointShowPopup) {
      var jsUrl = host + '/assets/js/ai-point-detail-popup.js';
      var cssUrl = host + '/assets/css/ai-point-detail-popup.css';
      if (!document.querySelector('link[href*="ai-point-detail-popup.css"]')) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = cssUrl;
        document.head.appendChild(link);
      }
      var script = document.createElement("script");
      script.src = jsUrl;
      script.charset = "UTF-8";
      script.onload = function () {
        if (typeof getAiPointShowPopup == "function") {
          getAiPointShowPopup($self, 'bottom');
        }
      };
      document.body.appendChild(script);
    } else {
      getAiPointShowPopup($self, 'bottom');
    }
    $('body').off('mouseenter.aiPointTipPopup').on('mouseenter.aiPointTipPopup', '.float-popup', function () {
      clearTimeout($self.data('aiPopupTimer'));
    });
    $(document).on('mousedown.aiPointPopupHide', function (e) {
      if (!window.hideAiPointPopup) return;
      if (!$('.float-popup').is(':visible')) return;
      if ($(e.target).closest('.float-popup').length > 0) return;
      if ($(e.target).closest('.ai-point-tip').length > 0) return;
      window.hideAiPointPopup();
    });
  }
}
// confirm对象
window.confirmIn = function (options) {
  var confirmWin = $("#global_confirm_window");
  var okval = "确定";
  var tokenClass = " ";
  if (options.okval) {
    okval = options.okval;
  }
  if (options.tokenClass) {
    tokenClass = options.tokenClass;
  }
  if (confirmWin.length) {
    $(confirmWin).remove()
  }
  confirmWin = $(`
    <div id='global_confirm_window' tabindex='1' class='confirm-box ${tokenClass}'>
      <div class='dialog-title' style="font-size:18px;font-weight:400;">${options.title}</div>
      <div class='dlg-content'>${options.content}</div>
      <div class='dlg-buttons'>
         ${options.onlyConfrim ?
      `<span class='pro-btn default okbtn'>${okval}</span>` :
      `<span class='pro-btn basic cancelbtn close' style='margin-right:16px;color:#212930'>取消</span>
             <span class='pro-btn basic nosaveBtn close' style='padding:0 14px;margin-right:16px;color:#212930'>不保存</span>
             <span class='pro-btn default okbtn'>${okval}</span>
            `
    }
      </div>
    </div>`).appendTo("body");
  if (options.width) {
    confirmWin.css("width", options.width);
  }
  if (options.height) {
    confirmWin.css("height", options.height);
  }
  if (options.hiddenOK) {
    confirmWin.find(".okbtn").css("visibility", "hidden")
  } else {
    confirmWin.find(".okbtn").css("visibility", "visible")
  }
  if (options.hiddenCancel) {
    confirmWin.find(".cancelbtn").css("display", "none")
  } else {
    confirmWin.find(".cancelbtn").css("visibility", "inline-block")
  }
  confirmWin.dialog();
  $('#po-dlg-mask').css('z-index', '1000')
  $('#global_confirm_window').css('z-index', '1001')
  $(document).off('keyup.confirm').on('keyup.confirm', function (e) {
    if (e.keyCode == 13)
      confirmWin.find(".okbtn").trigger('click');
  });
  confirmWin.find(".okbtn").off().on("click", function () {
    if (options.onConfirm) {
      options.onConfirm();
    }
    $(confirmWin).remove()
    $.mask("close");
    $(document).off('keyup.confirm');
  });
  confirmWin.find(".cancelbtn").off("click.cancel").on("click.cancel", function () {
    if (options.onCancel) {
      options.onCancel();
    }
    confirmWin.dialog("close");
  });

  confirmWin.find(".nosaveBtn").off("click").on('click', function () {
    if (options.onNotSave) {
      options.onNotSave();
    }
    $(confirmWin).remove()
    $.mask("close");
    $(document).off('keyup.confirm');
  })

  confirmWin.find(".po-dialog-close").on('click', function () {
    if (options.onClose) {
      options.onClose();
    }
    confirmWin.dialog("close");
  })
  confirmWin.find('.po-dialog-close').css('z-index', '2')
};
// open方法重写
window.open = function (url, ...args) {
  console.log(url);
  if (typeof url == 'string') {
    const mdMatch = url.match(/\/markdown_editor\/([a-f0-9]{24})/i)
    if (mdMatch) {
      const chartId = mdMatch[1]
      ipc.sendToHost('addTab', {
        src: `./src//markdown-editor/index.html?token=token&chartId=${chartId}&dbId=`,
        title: '未命名文件'
      })
      return null
    }
    switch (url) {
      case '/support':
        ipc.send('openFileFor', window.host + url)
        //  ipc.sendToHost('addTab', { src: window.host + url, title: '详细用户手册' }); 
        break;
    }
  }
  return null;
};
// 另存为
window.saveAs = () => {
  // 新建文件走保存
  if ((window.new
    || (!window.new && window.filepath == '' && chartObj.chartId.length < 13)) && window.fileType != 'markdown'
  ) {
    save()
  }
  else {



    if (window.fileType == 'mind') {
      const title = $('#topic-root .po-richtext-node-wrap').text().trim();
      window.saveName = title == '' ? '未命名文件' : title
    }



    // if (window.defVersion.length != 0 && window.defVersion.filter((d) => d.isSave == false).length > 0) {
    //   new Toast({ type: "warning", msg: "请先保存文件" });
    //   return
    // }

    ipc.sendToHost('showDlgSaveWebView',
      {
        id: TABGROUPID,
        savepath: window.saveName,
        suffix: window.fileType == 'flow' ? 'posf' : window.fileType == 'outline' ? 'poso' : window.fileType == 'markdown' ? 'posm' : 'posm',
        saveAs: true

      }
    )
  }
}
// 流程图工具栏
window.FlowBar = {
  chart: {},
  user: {},
  init: function (options) {
    this.chart = options.chartObj;
    this.user = options.userObj;
    console.log("flowbar init")
    this.render();
    this.initEvent();
  },
  domData: {
    //分享协作
    clb: `<div id="po-clb-button" class="po-clb-buttom po-button primary">分享协作</div>`,
    //发布
    public: `<div id="po-publish-button" class="po-tool-button" title="发布"><span class="po-diagraming-icons">&#xe6d1;</span></div>`,
    //导出
    export: `<div id="header-export" class="po-tool-button" title="导出为"><span class="po-diagraming-icons">&#xe939;</span></div>`,
    //导出菜单
    exportMenu: `<ul id="header-export-menu" class="po-menu large header-export-menu">
      <li class="po-menu-item" ac="export" type="png">
          <div class="po-menu-item-box">
              <span class="po-menu-icon po-diagraming-icons">&#xe981;</span>
              <span class="text">图片（PNG/JPG）</span>
          </div>
      </li>
      <li class="po-menu-item" ac="export" type="svg">
          <div class="po-menu-item-box">
              <span class="po-menu-icon po-diagraming-icons">&#xe986;</span>
              <span class="text">SVG</span>
              <img class="export-list-vip-icon" src="../../static/assets/images/vip-tip.svg">
          </div>
      </li>
      <li class="po-menu-item" ac="export" type="pdfHD">
          <div class="po-menu-item-box">
              <span class="po-menu-icon po-diagraming-icons">&#xe982;</span>
              <span class="text">高清PDF</span>
              <img class="export-list-vip-icon" src="../../static/assets/images/vip-tip.svg">
          </div>
      </li>
      <li class="po-menu-item disabled" ac="export" type="download_part">
          <div class="po-menu-item-box">
              <span class="po-menu-icon po-diagraming-icons">&#xe981;</span>
              <span class="text">导出所选图形</span>
          </div>
      </li>
      <li class="devider"></li>
      <li class="po-menu-item" ac="export" type="pos">
          <div class="po-menu-item-box">
              <span class="po-menu-icon po-diagraming-icons">&#xe983;</span>
              <span class="text">POS文件</span>
          </div>
      </li>
      <li class="po-menu-item" ac="export" type="visio">
        <div class="po-menu-item-box">
          <span class="po-menu-icon po-diagraming-icons">&#xe842;</span>
          <span class="text">VISIO文件</span>
        </div>
      </li>
      <li class="po-menu-item" ac="export" type="pos_all">
          <div class="po-menu-item-box">
              <span class="po-menu-icon po-diagraming-icons">&#xe983;</span>
              <span class="text">导出全部画布为POSF文件<span>（.posf）</span></span>
          </div>
      </li>
      <li class="po-menu-item" ac="export" type="visio_all">
          <div class="po-menu-item-box">
              <span class="po-menu-icon po-diagraming-icons">&#xe842;</span>
              <span class="text">导出全部画布为VISIO文件</span>
          </div>
      </li>
      <div style="dispaly:none">
          <iframe name="export_iframe" style="display: none"></iframe>
          <form id="export_form" action="/chart_image/diagram_export/mindmap" target="export_iframe" method="post">
              <input id="export_type" type="hidden" name="type">
              <input id="export_definition" type="hidden" name="definition">
              <input id="export_defs" type="hidden" name="defs">
              <input id="export_title" type="hidden" name="title">
              <input id="export_width" type="hidden" name="width">
              <input id="export_height" type="hidden" name="height">
              <input id="export_id" type="hidden" name="chartId">
              <input id="export_source" type="hidden" name="source">
              <input type="hidden" name="ignore" value="definition">
              <input id="export_uuid" type="hidden" name="powerStr">  
          </form>
      </div>
  </ul>`,
    //头像
    photo: ``,
    //返回
    back: ``,
    //logo
    logo: ``,
    //重命名
    rename: ``,
    //收藏
    fav: ``,
    //保存状态
    save: ``,
    //文件
    file: `<div id="header-file" class="po-tool-button">文件</div>`,
    //文件菜单
    fileMenu: `<ul id="header-file-menu" class="header-file-menu large po-menu" style="width:186px">
                  <li class="extend po-menu-item">
                      <div class="po-menu-item-box">
                          <span class="po-diagraming-icons po-menu-icon">&#xe6c2;</span>
                          <span class="text">新建</span>
                          <span class="extend-icon po-diagraming-icons">&#xe6b7;</span>
                      </div>
                      <ul class="extend-menu po-menu" style="width:160px">
                          <li class="po-menu-item" ac="creat" data-key="diagrams" cate="flow">
                              <div class="po-menu-item-box">
                                  <img src="./../../static/assets/images/flow.png" class="po-menu-icon">
                                  <span class="text">流程图</span>
                              </div>
                          </li>
                          <li class="po-menu-item" ac="creat" data-key="mindmap"  cate="mind_free">
                              <div class="po-menu-item-box">
                                  <img src="./../../static/assets/images/mind.png" class="po-menu-icon">
                                  <span class="text">思维导图</span>
                              </div>
                          </li>
                          <li class="po-menu-item" ac="creat" data-key="diagrams" cate="ui">
                              <div class="po-menu-item-box">
                                  <img src="./../../static/assets/images/ui.png" class="po-menu-icon">
                                  <span class="text">原型图</span>
                              </div>
                          </li>
                          <li class="po-menu-item" ac="creat" data-key="diagrams" cate="uml">
                              <div class="po-menu-item-box">
                                  <img src="./../../static/assets/images/UML.png" class="po-menu-icon">
                                  <span class="text">UML</span>
                              </div>
                          </li>
                          <li class="po-menu-item" ac="creat" data-key="diagrams" cate="network">
                              <div class="po-menu-item-box">
                                  <img src="./../../static/assets/images/network.png" class="po-menu-icon">
                                  <span class="text">网络拓扑图</span>
                              </div>
                          </li>
                          <li class="po-menu-item" ac="creat"  data-key="mindmap" cate="mind_org">
                              <div class="po-menu-item-box">
                                  <img src="./../../static/assets/images/org.png" class="po-menu-icon">
                                  <span class="text">组织结构图</span>
                              </div>
                          </li>
                          <li class="po-menu-item" ac="creat" data-key="diagrams" cate="bpmn">
                              <div class="po-menu-item-box">
                                  <img src="./../../static/assets/images/BPMN.png" class="po-menu-icon">
                                  <span class="text">BPMN</span>
                              </div>
                          </li>
                      </ul>
                  </li>
                  <li class="po-menu-item" ac="rename">
                      <div class="po-menu-item-box">
                          <span class="po-diagraming-icons po-menu-icon">&#xe6ae;</span>
                          <span class="text">重命名</span>
                      </div>
                  </li>
                  <li class="po-menu-item" ac="view">
                      <div class="po-menu-item-box">
                          <span class="po-diagraming-icons po-menu-icon">&#xe6d4;</span>
                          <span class="text">预览</span>
                      </div>
                  </li>
                  <li class="po-menu-item" ac="save">
                      <div class="po-menu-item-box">
                          <span class="po-diagraming-icons po-menu-icon">&#xe6a0;</span>
                          <span class="text">保存</span>
                          <span class="po-menu-hotkey">Ctrl+S</span>
                      </div>
                  </li>
                  <li class="devider"></li>
                
                  <li class="po-menu-item" ac="save-as">
                      <div class="po-menu-item-box">
                          <span class="po-iconfont-icons po-menu-icon">&#xea77;</span>
                          <span class="text">另存为</span>
                      </div>
                  </li>
                  <li class="extend po-menu-item" ac="export-file">
                      <div class="po-menu-item-box">
                          <span class="po-diagraming-icons po-menu-icon">&#xe939;</span>
                          <span class="text">导出为</span>
                          <span class="extend-icon po-diagraming-icons">&#xe6b7;</span>
                      </div>
                      <ul class="extend-menu header-file-extend-menu normal po-menu">
                          <li class="po-menu-item" ac="export" type="png">
                              <div class="po-menu-item-box">
                                  <span class="po-diagraming-icons po-menu-icon">&#xe981;</span>
                                  <span class="text">PNG</span>
                              </div>
                          </li>
                          <li class="po-menu-item" ac="export" type="jpg">
                              <div class="po-menu-item-box">
                                  <span class="po-diagraming-icons po-menu-icon">&#xe981;</span>
                                  <span class="text">JPG</span>
                              </div>
                          </li>
                          <li class="po-menu-item" ac="export" type="pos">
                              <div class="po-menu-item-box">
                                  <span class="po-diagraming-icons po-menu-icon">&#xe983;</span>
                                  <span class="text">POS文件</span>
                              </div>
                          </li>
                          <li class="po-menu-item" ac="export" type="visio">
                              <div class="po-menu-item-box">
                                  <span class="po-diagraming-icons po-menu-icon">&#xe842;</span>
                                  <span class="text">VISIO文件</span>
                              </div>
                          </li>
                          <li class="po-menu-item" ac="export" type="pdfhd">
                              <div class="po-menu-item-box">
                                  <span class="po-diagraming-icons po-menu-icon">&#xe982;</span>
                                  <span class="text">高清PDF</span>
              <img class="export-list-vip-icon" src="../../static/assets/images/vip-tip.svg">
                              </div>
                          </li>
                          <li class="po-menu-item" ac="export" type="svg">
                              <div class="po-menu-item-box">
                                  <span class="po-diagraming-icons po-menu-icon">&#xe986;</span>
                                  <span class="text">SVG</span>
              <img class="export-list-vip-icon" src="../../static/assets/images/vip-tip.svg">
                              </div>
                          </li>
                          <li class="disabled po-menu-item" ac="export" type="download_part">
                              <div class="po-menu-item-box">
                                  <span class="po-diagraming-icons po-menu-icon">&#xe981;</span>
                                  <span class="text">导出所选图形为PNG</span>
                              </div>
                          </li>
                          <li class="devider"></li>
                          <li class="po-menu-item" ac="export" type="pnghd">
                              <div class="po-menu-item-box">
                                  <span class="po-diagraming-icons po-menu-icon">&#xe981;</span>
                                  <span class="text">高清PNG</span>
              <img class="export-list-vip-icon" src="../../static/assets/images/vip-tip.svg">
                              </div>
                          </li>
                          <li class="devider"></li>
                          <li class="po-menu-item" ac="export" type="pos_all">
                              <div class="po-menu-item-box">
                              <span class="po-menu-icon po-diagraming-icons">&#xe983;</span>
                                  <span class="text">导出全部画布（.posf）</span>
                              </div>
                          </li>
                          <li class="po-menu-item" ac="export" type="visio_all">
                              <div class="po-menu-item-box">
                                  <span class="po-menu-icon po-diagraming-icons">&#xe842;</span>
                                  <span class="text">导出全部画布（.vsdx)</span>
                              </div>
                          </li>
                      </ul>
                  </li>
                  <li class="po-menu-item" ac="publish">
                      <div class="po-menu-item-box">
                          <span class="po-diagraming-icons po-menu-icon">&#xe6d1;</span>
                          <span class="text">发布</span>
                      </div>
                  </li>
                  <li class="po-menu-item" ac="share">
                      <div class="po-menu-item-box">
                          <span class="po-diagraming-icons po-menu-icon">&#xe6d8;</span>
                          <span class="text">分享协作</span>
                      </div>
                  </li>
                  <li class="devider"></li>
                  <li class="po-menu-item" ac="history">
                      <div class="po-menu-item-box">
                          <span class="po-diagraming-icons po-menu-icon">&#xe6af;</span>
                          <span class="text">历史记录</span>
                      </div>
                  </li>
                  <li class="po-menu-item" ac="print">
                      <div class="po-menu-item-box">
                          <span class="po-diagraming-icons po-menu-icon">&#xe99c;</span>
                          <span class="text">打印</span>
                          <span class="po-menu-hotkey">Ctrl+P</span>
                      </div>
                  </li>
                 
              </ul>`,
    //立即上云
    uploadOnlineBtn: `<div id="po-uploadOnline-button" class="po-clb-buttom po-button primary">立即上云</div>`,
  },
  render: function () {
    var rightBox = PoEditorClient.getRightBar();
    var rightDomStr = (window.isMyFile ? this.domData.uploadOnlineBtn : '') + this.domData.clb + this.domData.export + this.domData.public + this.domData.photo;
    rightBox.append(rightDomStr);
    var leftBox = PoEditorClient.getLeftBar();
    leftBox.prepend(this.domData.back + this.domData.logo);
    var leftTopBox = leftBox.find('.header-container-top');
    var leftTopDomStr = this.domData.rename + this.domData.fav + this.domData.save;
    leftTopBox.append(leftTopDomStr);
    leftBox.find('.header-container-bottom').prepend(this.domData.file);
    $('body').append(this.domData.fileMenu + this.domData.exportMenu);
    $('.header-container').css("margin-left", '14px')
    if (window.isMyFile || filepath) {
      $('.po-clb-user-photo-list').remove()
    }
    $('.po-menu-small.normal, .po-menu.normal').css("width", "auto")
    $('.po-menu-item[ac=copyImage]').remove()
    if (this.chart.collaRole == 'viewer') {
      leftBox.find('#header-file').addClass('disabled').css('pointer-events', 'none')
      $('.header-container-bottom .po-tool-button').css('opacity', '0.4')
    }
    $('#po-uploadOnline-button').off('click').on('click', () => {
      if (window.fileType == 'mind') {
        const title = $('#topic-root .po-richtext-node-wrap').text().trim();
        window.saveName = title == '' ? '未命名文件' : title
      }
      ipc.sendToHost('showDlgSaveWebView',
        {
          id: TABGROUPID, savepath: window.saveName, suffix: window.fileType == 'flow' ? 'posf' : window.fileType == 'outline' ? 'poso' : window.fileType == 'markdown' ? 'md' : 'posm'
          , islocal: false
        }
      )
    })

    setTimeout(() => {
      const privilege = JSON.parse(localStorage.getItem('privilege'))
      window.memberObj = privilege
      if (!window.isMember()) {
        $('.po-foot-shape-select-total.statistics').before(`<div class="po-foot-shape-select-total">图形限制：<span id="shape-number">${60}</span></div>`)
      }
    }, 1000);

  },
  initEvent: function () {
    var that = this;
    //导出
    $("#header-export").button({
      onClick: function (e, target) {
        $("#header-export-menu").dropdown({
          target: target,
          position: "right",
          onSelect: function (item) {
            var type = item.attr("type");
            let partIds = undefined
            if (type == 'download_part') {
              partIds = PoEditorClient.getSelectedIds()
              // type = 'png'
            }
            exportType = "右上角导出"
            window.editorGlobalConfig.onBeforeExport({ type, call: () => { }, isSave: false, partIds })
          }
        })
      }
    })
    /*分享协作*/
    $("#po-clb-button").off().on("click", function (e) {
      if (window.isMyFile) {
        window.toast_.noYun()
        return
      }
      if (!navigator.onLine) {
        new Toast('needNetwork')
        return
      }
      ipc.sendToHost('showShareWebView', 'chart', window.chartId)
    })
    /*发布*/
    $("#po-publish-button").off().on("click", function () {
      if (window.isMyFile) {
        window.toast_.noYun()
        return
      }
      if (!navigator.onLine) {
        new Toast('needNetwork')
        return
      }
      PoEditorInsert.publish();
    })
    //历史版本
    $("#header-history").button({
      onClick: function (e, target) {
        // if (window.isMyFile) {
        //   window.toast_.noYun()
        //   return
        // }
        // if (!navigator.onLine) {
        //   new Toast('needNetwork')
        //   return
        // }
        if (e.target.tagName !== "A") {
          PoEditorClient.openHistory();
        }
      }
    });
    //文件
    $("#header-file").button({
      onClick: function (e, target) {
        if (that.chart.collaRole == 'viewer') {
          return
        }
        $("#header-file-menu").dropdown({
          target: target,
          onSelect: function (item) {
            var ac = item.attr("ac");
            if (!navigator.onLine && !window.isMyFile && ac != "export" && ac != "print" && ac != "creat") {
              new Toast('needNetwork')
              return
            }
            if (ac == "creat") {
              var cate = item.attr("cate");
              that.newFile(cate, item);
            } else if (ac == "save") {
              window.saveType = "文件-保存"
              if (window.isMyFile) {
                save()
              }
              else {
                PoEditorClient.saveOnline();
              }
            } else if (ac == "view") {
              if (window.isMyFile && !window.filepath) {
                window.toast_.noYun()
                return
              }
              FileBusiness.view(window.chartId, 'chart', () => { }, { category: window.fileType, filepath: window.filepath })
              return
            } else if (ac == "copy") {
              if (window.isMyFile) {
                window.toast_.noYun()
                return
              }
              that.copyFile();
            } else if (ac == "export") {
              var type = item.attr("type");
              const partIds = PoEditorClient.getSelectedIds()
              if (type == 'download_part') {
                type = 'png'
              }
              exportType = "文件-导出"
              window.editorGlobalConfig.onBeforeExport({ type, call: () => { }, isSave: false, partIds })
            } else if (ac == "history") {
              // if (window.isMyFile) {
              //   window.toast_.noYun()
              //   return
              // }
              PoEditorClient.openHistory()
            } else if (ac == "publish") {
              if (window.isMyFile) {
                window.toast_.noYun()
                return
              }
              PoEditorInsert.publish()
            } else if (ac == "share") {
              if (window.isMyFile) {
                window.toast_.noYun()
                return
              }
              ipc.sendToHost('showShareWebView', 'chart', window.chartId)
            } else if (ac == "print") {
              PoEditorClient.openPrint()
            } else if (ac == "save-as") {
              window.saveAs()
            } else if (ac == "rename") {
              if (window.isMyFile) {
                window.toast_.noYun()
                return
              }
              ipc.sendToHost('rename', window.TABGROUPID, window.isMyFile)
            }
          }
        })
      }
    });
  },
  newFile: async function (cate, target) {
    const query = '&type=' + cate
    const dataKey = $(target).data("key");
    const baseUrl = window.location.href.startsWith('http://localhost:5173/') ? 'http://localhost:5173/src' : `file:///${webRoot}`
    const url = `${baseUrl}/v5_editor/source/compile/${dataKey}/index.html?token=token&chartId=&dbId=jGthTGDM5R${query}&filepath=&new=true`
    const arg = { url };
    pcUtil.openWin(arg);
  },
  copyFile: function () {
    var that = this;
    //自己文件到当前文件所在文件夹下， 其他情况在root下
    var folderId = that.user.userId == that.chart.owner.userId && that.chart.folderId ? that.chart.folderId : "root";
    pcUtil.ajax({
      url: "/api/personal/diagraming/create",
      data: { folderId: folderId, templateId: that.chart.chartId },
      success: function (data) {
        if (data && data.code == 200) {
          var id = data.data.chart.chartId;
          const arg = { url: `${window.location.origin}${window.location.pathname}?token=token&chartId=${id}&dbId=jGthTGDM5R` };
          pcUtil.openWin(arg);
        }
        else {
          new Toast({ type: 'error', msg: data.msg })
        }
      }
    })
  },
  save: function () {
    PoEditorClient.saveOnline();
  }
}
// 思维导图工具栏
window.MindBar = {
  chart: {},
  user: {},
  init: function (options) {
    this.chart = options.chartObj;
    this.user = options.userObj;
    this.render();
    this.initEvent();
    if (window.isMyFile) {
    }
    else[
      // 键盘事件
      window.document.addEventListener('keydown', function (event) {
        if (!event.ctrlKey && event.shiftKey && event.key === 'R') {
          event.stopImmediatePropagation()
          event.preventDefault()
          PoEditorClient.openHistory();
        }
      })
    ]
  },
  domData: {
    //分享协作
    clb: `<div class="po-clb-btn po-button primary" tit="colla">分享协作</div>`,
    //发布
    public: `<div class="po-tool-button" title="发布" tit="publish"><span class="po-diagraming-icons">&#xe6d1;</span></div>`,
    //导出
    export: `<div class="po-tool-button" tit="export" title="导出为"><span class="po-diagraming-icons">&#xe939;</span></div>`,
    //导出菜单
    exportMenu: `<ul id="header-export-menu" class="po-menu-icon po-menu" style="width:220px">
                      <li class="po-menu-item"  tit="png">
                          <div class="po-menu-item-box">
                              <span class="po-menu-icon po-diagraming-icons">&#xe981;</span>
                              <span class="text">图片（PNG/JPG）</span>
                          </div>
                      </li>
                      <li class="po-menu-item"  tit="svg">
                          <div class="po-menu-item-box vip-tip">
                              <span class="po-menu-icon po-diagraming-icons">&#xe986;</span>
                              <span class="text">SVG</span>
                          </div>
                      </li>
                      <li class="po-menu-item"  tit="pdfHD">
                          <div class="po-menu-item-box vip-tip">
                              <span class="po-menu-icon po-diagraming-icons">&#xe982;</span>
                              <span class="text">高清PDF</span>
                          </div>
                      </li>
                      <li class="devider devi-clip"></li>
                      <li class="po-menu-item"  tit="pos">
                          <div class="po-menu-item-box">
                              <span class="po-menu-icon po-diagraming-icons">&#xe983;</span>
                              <span class="text">POS文件</span>
                          </div>
                      </li>
                      <li class="po-menu-item"  tit="xmind">
                          <div class="po-menu-item-box vip-tip">
                              <span class="po-menu-icon po-diagraming-icons">&#xe985;</span>
                              <span class="text">XMind文件</span>
                          </div>
                      </li>
                      <li class="po-menu-item"  tit="fmind">
                          <div class="po-menu-item-box vip-tip">
                              <span class="po-menu-icon po-diagraming-icons">&#xe97f;</span>
                              <span class="text">FreeMind文件<span>（.mm）</span></span>
                          </div>
                      </li>
                      <li class="po-menu-item"  tit="word">
                          <div class="po-menu-item-box vip-tip">
                              <span class="po-menu-icon po-diagraming-icons">&#xe980;</span>
                              <span class="text">Word<span>（.docx）</span></span>
                          </div>
                      </li>
                      <li class="po-menu-item"  tit="csv">
                          <div class="po-menu-item-box vip-tip">
                              <span class="po-menu-icon po-diagraming-icons">&#xe97d;</span>
                              <span class="text">Excel<span>（.csv）</span></span>
                          </div>
                      </li>
                      <li class="po-menu-item"  tit="ppt">
                          <div class="po-menu-item-box vip-tip">
                              <span class="po-menu-icon po-diagraming-icons">&#xe97e;</span>
                              <span class="text">PPT文件</span>
                          </div>
                      </li>
                        <li class="po-menu-item"  tit="md">
                            <div class="po-menu-item-box">
                                <span class="po-menu-icon po-diagraming-icons">&#xe903;</span>
                                <span class="text">Markdown</span>
                            </div>
                        </li>
                        <li class="po-menu-item" tit="mdfull">
                            <div class="po-menu-item-box">
                                <span class="po-menu-icon po-diagraming-icons">&#xe903;</span>
                                <span class="text">Markdown（含扩展信息<span class="po-menu-icon po-diagraming-icons" style="position: relative; left:0;vertical-align: top;font-size:16px" original-title="【拓展语法：标签、备注、提及等】">&#xe6c7;</span>）</span>
                            </div>
                        </li>
                      <li class="po-menu-item"  tit="pos_all">
                          <div class="po-menu-item-box">
                              <span class="po-menu-icon po-diagraming-icons">&#xe983;</span>
                              <span class="text">导出全部画布<span>（.posm）</span></span>
                          </div>
                      </li>
                      <li style="display:none">
                          <iframe name="export_iframe" style="display: none"></iframe>
                          <form id="export_form"  target="export_iframe" action="/chart_image/diagram_export/mindmap" method="post">
                              <input id="export_definition" type="hidden" name="definition"/>
                              <input id="export_title" type="hidden" name="title"/>
                              <input id="export_width" type="hidden" name="width"/>
                              <input id="export_height" type="hidden" name="height"/>
                              <input id="export_id" type="hidden" name="chartId">
                              <input type="hidden" name="ignore" value="definition"/>
                              <input id="export_type" type="hidden" name="type">
                              <input id="export_source" type="hidden" name="source">
                              <input id="export_uuid" type="hidden" name="powerStr"> 
                          </form>
                      </li>
                  </ul>`,
    //头像
    photo: "",
    //返回
    back: "",
    //文件
    file: `<div id="header-file" class="header-file"> <div class="header-logo"></div>
          <ul id="header-file-menu" class="po-menu po-menu-icon header-file-menu">
              <li class="po-menu-item extend" ac="new">
                  <div class="po-menu-item-box">
                      <span class="po-diagraming-icons po-menu-icon">&#xe6c2;</span>
                      <span class="text">新建</span>
                      <span class="extend-icon po-diagraming-icons">&#xe6b7;</span>
                  </div>
                  <ul class="po-menu extend-menu" style="width:160px">
                      <li class="po-menu-item" ac="mind_free" data-key="mindmap">
                          <div class="po-menu-item-box">
                              <img src="./../../static/assets/images/mind.png" class="po-menu-icon">
                              <span class="text">思维导图</span>
                          </div>
                      </li>
                      <li class="po-menu-item"  ac="flow" data-key="diagrams">
                          <div class="po-menu-item-box">
                              <img src="./../../static/assets/images/flow.png" class="po-menu-icon">
                              <span class="text">流程图</span>
                          </div>
                      </li>
                      <li class="po-menu-item"  ac="ui" data-key="diagrams">
                          <div class="po-menu-item-box">
                              <img src="./../../static/assets/images/ui.png" class="po-menu-icon">
                              <span class="text">原型图</span>
                          </div>
                      </li>
                      <li class="po-menu-item"  ac="uml" data-key="diagrams">
                          <div class="po-menu-item-box">
                              <img src="./../../static/assets/images/UML.png" class="po-menu-icon">
                              <span class="text">UML</span>
                          </div>
                      </li>
                      <li class="po-menu-item"  ac="network" data-key="diagrams">
                          <div class="po-menu-item-box">
                              <img src="./../../static/assets/images/network.png" class="po-menu-icon">
                              <span class="text">网络拓扑图</span>
                          </div>
                      </li>
                      <li class="po-menu-item"  ac="mind_org" data-key="mindmap">
                          <div class="po-menu-item-box">
                              <img src="./../../static/assets/images/org.png" class="po-menu-icon">
                              <span class="text">组织结构图</span>
                          </div>
                      </li>
                      <li class="po-menu-item"  ac="bpmn" data-key="diagrams">
                          <div class="po-menu-item-box">
                              <img src="./../../static/assets/images/BPMN.png" class="po-menu-icon">
                              <span class="text">BPMN</span>
                          </div>
                      </li>
                  </ul>
              </li>
              <li class="po-menu-item" ac="rename">
                  <div class="po-menu-item-box">
                      <span class="po-diagraming-icons po-menu-icon">&#xe6ae;</span>
                      <span class="text">重命名</span>
                  </div>
              </li>
                <li class="po-menu-item" ac="view">
                    <div class="po-menu-item-box">
                        <span class="po-diagraming-icons po-menu-icon">&#xe6d4;</span>
                        <span class="text">预览</span>
                    </div>
                </li>
             
              <li class="po-menu-item" ac="save">
                  <div class="po-menu-item-box">
                      <span class="po-diagraming-icons po-menu-icon">&#xe6a0;</span>
                      <span class="text">保存</span>
                      <span class="po-menu-hotkey">Ctrl+S</span>
                  </div>
              </li>
              <li class="po-menu-item" ac="save-as">
                  <div class="po-menu-item-box">
                      <span class="po-iconfont-icons po-menu-icon">&#xea77;</span>
                      <span class="text">另存为</span>
                  </div>
              </li>
              <li class="po-menu-item" ac="search">
                  <div class="po-menu-item-box">
                      <span class="po-diagraming-icons po-menu-icon">&#xe72d;</span>
                      <span class="text">查找替换</span>
                      <span class="po-menu-hotkey">Ctrl+F</span>
                  </div>
              </li>
              <li class="po-menu-item" ac="history">
                  <div class="po-menu-item-box">
                      <span class="po-diagraming-icons po-menu-icon">&#xe6af;</span>
                      <span class="text">历史记录</span>
                      <span class="po-menu-hotkey">Shift+R</span>
                  </div>
              </li>
              <li class="po-menu-item extend" ac="print">
              <div class="po-menu-item-box">
                  <span class="po-diagraming-icons po-menu-icon">&#xe99c;</span>
                  <span class="text">打印</span>
                  <span class="extend-icon po-diagraming-icons">&#xe6b7;</span>
              </div>
               <ul class="extend-menu po-menu" style="width:170px;">
                  <li class="po-menu-item" ac="print_single">
                      <div class="po-menu-item-box extend-item-box-print">
                          <span class="text">单页打印 <span class="text-sm">(缩放适应)</span></span>
                          <span class="text-limit"><label>限免</label></span>
                      </div>
                  </li>
                  <li class="po-menu-item" ac="print_double">
                      <div class="po-menu-item-box extend-item-box-print">
                          <span class="text">多页打印 <span class="text-sm">(实际大小)</span></span>
                          <span class="text-limit"><label>限免</label></span>
                      </div>
                  </li>
              </ul>
          </li>
          </ul>
      </div>`,
    //重命名
    rename: ``,
    //收藏
    fav: ``,
    //保存状态
    save: ``,
    uploadOnlineBtn: `<div id="po-uploadOnline-button" class="po-clb-btn po-button primary" tit="" style="margin-right:10px">立即上云</div>`,
  },
  render: function () {
    var rightBox = PoEditorClient.getRightBar();
    var rightDomStr = this.domData.export + this.domData.public + this.domData.photo;
    rightBox.append(rightDomStr);
    rightBox.children(".po-clb-user-photo-list").after(this.domData.clb).after((window.isMyFile ? this.domData.uploadOnlineBtn : ''));
    var leftBox = PoEditorClient.getLeftBar();
    leftBox.children(".toolbar-filling").after(this.domData.back + this.domData.file + this.domData.rename + this.domData.fav + this.domData.save);
    $('body').append(this.domData.exportMenu);
    var collaRole = this.chart.collaRole;
    if (collaRole == 'viewer') {
      rightBox.find('[tit=publish]').addClass('disabled');
      rightBox.find('[tit=export]').addClass('disabled');
      leftBox.find('#header-file').addClass('disabled').css('pointer-events', 'none');
    };
    if (window.isMyFile) {
      // ppt
      // $('.po-menu-item[tit=ppt]').remove();
      $('#sliders-export-menu').find('.po-menu-item[tit=ppt]').remove();
      // 聚焦模式tip
      $('.po-menu-item[op=focus]').children().children('.mind-tip').remove()
      $('.img-tab-list').children('.active').attr('style', 'border-bottom:none')

      /**  自定义主题风格按钮*/
      $('.mind-right-theme').children('.con').attr('style', 'height:calc(100% - 44px)')

      // $('.mind-header-right').attr('style', 'padding:0px;')
      $('.po-tool-button[tit=export]').attr('style', 'margin:3px 6px;padding:6px')

      // 思维笔记暂时隐藏
      $('.po-menu-item[ac=outline]').remove()
      // 右键按钮隐藏
      $('.po-menu-item[op=tonew]').remove()
    }
    $('.po-menu-item[op=copyImage]').remove()
  },
  initEvent: function () {
    var that = this;
    $(".mind-header [tit]").on("click", function (e) {
      e.stopPropagation();
      var $this = $(this), tit = $this.attr("tit");
      switch (tit) {
        case "back":
          var url = localStorage.getItem("po_file_source");
          localStorage.removeItem("po_file_source");
          var backUrl = url ? url : "/diagrams";
          window.location.href = backUrl;
          break;
        case "history":
          // if (window.isMyFile) {
          //   window.toast_.noYun()
          //   return
          // }
          if (!window.isMyFile && !navigator.onLine) {
            new Toast('needNetwork')
            return
          }
          PoEditorClient.openHistory();
          break;
        case "export":
          $("#header-export-menu").dropdown({
            target: $this,
            zindex: 4,
            position: "right",
            onSelect: function (item) {
              var type = item.attr("tit");
              const partIds = PoEditorClient.getSelectedIds()
              exportType = "右上角导出"
              window.editorGlobalConfig.onBeforeExport({ type: type == 'png' ? 'png1' : type, call: () => { }, isSave: false, partIds })
            }
          })
          break;
        case "publish":
          if (window.isMyFile) {
            window.toast_.noYun()
            return
          }
          if (!navigator.onLine) {
            new Toast('needNetwork')
            return
          }

          PoEditorInsert.publish();
          break;
        case "colla":
          if (window.isMyFile) {
            window.toast_.noYun()
            return
          }
          if (!navigator.onLine) {
            new Toast('needNetwork')
            return
          }

          PoEditorInsert.share()
          break;
        case "head":
          if (window.isMyFile) {
            window.toast_.noYun()
            return
          }
          if (!navigator.onLine) {
            new Toast('needNetwork')
            return
          }

          PoEditorInsert.userPhotoMenu.init($this, { "user": { icon: that.user.photoUrl, text: that.user.fullName } });
          break;
        default:
          break;
      }
    });
    $("#header-file").off().on("mousedown", function (e) {
      e.stopPropagation();
    }).on("mouseenter", function (e) {
      if (that.chart.collaRole == 'viewer') {
        return false
      }
      $("#header-file-menu").show().find("li").off().on("click", function () {

        var item = $(this);
        var ac = item.attr("ac");
        if (!navigator.onLine && !window.isMyFile && ac != "creat" && ac != "search" && ac != "print_single" && ac != "print_double") {
          new Toast('needNetwork')
          return
        }
        if (window.mind) {
          mind.events.push("hideRightMoreList");
        }

        if (ac == "save") {
          window.saveType = "文件-保存"

          $("#header-file-menu").hide()
          if (window.isMyFile) {
            save()
          }
          else {
            PoEditorClient.saveOnline();
          }
        } else if (ac == "save-as") {
          window.saveAs()
        } else if (ac == "view") {
          if (window.isMyFile && !window.filepath) {
            window.toast_.noYun()
            return
          }
          FileBusiness.view(window.chartId, 'chart', () => { }, { category: window.fileType, filepath: window.filepath })
          return
        } else if (ac == "clone") {
          if (window.isMyFile) {
            window.toast_.noYun()
            return
          }
          that.copyFile();
        } else if (ac == "history") {
          // if (window.isMyFile) {
          //   window.toast_.noYun()
          //   return
          // }
          PoEditorClient.openHistory();
        } else if (ac == "search") {
          PoEditorClient.openSearch();
        } else if (item.parent().parent().attr("ac") == "new") {
          that.newFile(ac, item);
        } else if (ac == "rename") {
          if (window.isMyFile) {
            window.toast_.noYun()
            return
          }
          $("#header-file-menu").hide()
          ipc.sendToHost('rename', window.TABGROUPID, window.isMyFile)
        } else if (ac == "print_single") {
          PoEditorClient.openPrint({ mode: 'single' })
        } else if (ac == "print_double") {
          PoEditorClient.openPrint({ mode: 'multi' })
        }
      });
    }).on("mouseleave", function (e) {
      $("#header-file-menu").dropdown("close")
    })

    $('#po-uploadOnline-button').off('click').on('click', () => {
      if (window.fileType == 'mind') {
        const title = $('#topic-root .po-richtext-node-wrap').text().trim();
        window.saveName = title == '' ? '未命名文件' : title
      }
      ipc.sendToHost('showDlgSaveWebView',
        {
          id: TABGROUPID, savepath: window.saveName, suffix: window.fileType == 'flow' ? 'posf' : window.fileType == 'outline' ? 'poso' : window.fileType == 'markdown' ? 'md' : 'posm'
          , islocal: false
        }
      )
    })
  },
  newFile: async function (cate, target) {
    const query = '&type=' + cate
    const dataKey = $(target).data("key");
    const baseUrl = window.location.href.startsWith('http://localhost:5173/') ? 'http://localhost:5173/src' : `file:///${webRoot}`
    const url = `${baseUrl}/v5_editor/source/compile/${dataKey}/index.html?token=token&chartId=&dbId=jGthTGDM5R${query}&filepath=&new=true`
    const arg = { url };
    pcUtil.openWin(arg);
    // }
  },
  copyFile: function () {
    var that = this;
    //自己文件到当前文件所在文件夹下， 其他情况在root下
    var folderId = that.user.userId == that.chart.owner.userId && that.chart.folderId ? that.chart.folderId : "root";
    pcUtil.ajax({
      url: "/api/personal/diagraming/create",
      data: { folderId: folderId, templateId: that.chart.chartId },
      success: function (data) {
        if (data && data.code == 200) {
          var id = data.data.chart.chartId;
          const arg = { url: `${window.location.origin}${window.location.pathname}?token=token&chartId=${id}&dbId=jGthTGDM5R` };
          pcUtil.openWin(arg);
        }
        else {
          new Toast({ type: 'error', msg: data.msg })
        }
      }
    })
  },
  save: function () {
    PoEditorClient.saveOnline();
  },
}
// 大纲工具栏
window.outlineBar = {
  chart: {},
  user: {},
  init: function (options) {
    this.chart = options.chartObj;
    this.user = options.userObj;
    this.render();
    this.initEvent();
  },
  domData: {
    //分享协作
    clb: `<a id="btn_colla_share" class="nav-i"  tit="btn_colla_share" title="分享协作"  class="icon-button header-item"><i class="ol-icons">&#xe60b;</i></a>`,
    uploadOnlineBtn: `<a id="po-uploadOnline-button" class="nav-i"  title="立即上云"  class="icon-button header-item"
    style="padding:0 8px;margin:3px 0 3px 10px;line-height:32px;height:32px;"><i class="icons_web">&#xe684;</i></a>`,
  },
  render: function () {
    var rightBox = PoEditorClient.getRightBar();
    var rightDomStr = (window.isMyFile ? this.domData.uploadOnlineBtn : '') + this.domData.clb //+ this.domData.search + this.domData.export;
    rightBox.prepend(rightDomStr);
    // rightBox.children(".po-clb-user-photo-list").after(this.domData.clb).after(this.domData.uploadOnlineBtn);
    if (!navigator.onLine && !window.isMyFile) {
      $('#btn_colla_share').css('pointer-events', 'none')
      $('#btn_colla_share').css('opacity', 0.5)
    }
    $('#outline-hl-menu').children('#btn_shortkey').before($('<a id="btn_rename" op="btn_rename" class="outline-item"><span class="po-diagraming-icons ol-icons">&#xe6ae;</span><span>重命名</span></a>'))
    $('#btn_rename').off('mousedown').on('mousedown', () => {
      if (window.isMyFile) {
        window.toast_.noYun()
        return
      }
      ipc.sendToHost('rename', window.TABGROUPID, window.isMyFile)
    })
    if (this.chart.collaRole == 'viewer') {
      $('#header-file').addClass('disabled').css('pointer-events', 'none')
    }
    $('.outline-item[type=pdf]').append($('<img src="../../static/assets/images/vip-tip.svg" style="width:25px;position:absolute;right:10px;top:9px">'));
    $('.outline-item[type=word]').append($('<img src="../../static/assets/images/vip-tip.svg" style="width:25px;position:absolute;right:10px;top:9px">'));
    $('.outline-item[type=ppt]').append($('<img src="../../static/assets/images/vip-tip.svg" style="width:25px;position:absolute;right:10px;top:9px">'));
    $('.outline-item[type=csv]').append($('<img src="../../static/assets/images/vip-tip.svg" style="width:25px;position:absolute;right:10px;top:9px">'));
    $('.outline-item[type=xmind]').append($('<img src="../../static/assets/images/vip-tip.svg" style="width:25px;position:absolute;right:10px;top:9px">'));
  },
  initEvent: function () {
    //协作分享新
    $('#btn_colla_share').off('mousedown').on('mousedown', function (e) {
      if (window.isMyFile) {
        window.toast_.noYun()
        return
      }
      if (!navigator.onLine) {
        new Toast('needNetwork')
        return
      }
      const pattern = document.body.classList.contains('dark-mode') ? "black" : "white";
      PoEditorInsert.share({ pattern });
    });
    $('#po-uploadOnline-button').off('click').on('click', () => {
      if (window.fileType == 'mind') {
        const title = $('#topic-root .po-richtext-node-wrap').text().trim();
        window.saveName = title == '' ? '未命名文件' : title
      }
      ipc.sendToHost('showDlgSaveWebView',
        {
          id: TABGROUPID, savepath: window.saveName, suffix: window.fileType == 'flow' ? 'posf' : window.fileType == 'outline' ? 'poso' : window.fileType == 'markdown' ? 'md' : 'posm'
          , islocal: false
        }
      )
    })
  },
}
// markdown工具栏
window.MarkdownBar = {
  chart: {},
  user: {},
  init: function (options) {
    console.log(chartObj)
    this.chart = options.chartObj;
    this.user = options.userObj;
    this.render();
    this.initEvent();
  },
  domData: {
    //导出
    export: `<div class="po-tool-button" tit="export" title="导出为"><span class="po-diagraming-icons">&#xe939;</span></div>`,
    //导出菜单
    exportMenu: `<ul id="header-export-menu" class="po-menu-icon po-menu" style="width:220px">
                    <li class="po-menu-item" tit="saveMind">
                        <div class="po-menu-item-box">
                            <span class="po-menu-icon po-diagraming-icons">&#xe6a0;</span>
                            <span class="text">另存为思维导图</span>
                        </div>
                    </li>
                    <li class="sp-line">
                    </li>
                    <li class="po-menu-item"  tit="png">
                        <div class="po-menu-item-box">
                            <span class="po-menu-icon po-diagraming-icons">&#xe981;</span>
                            <span class="text">图片（PNG/JPG）</span>
                        </div>
                    </li>
                    <li class="po-menu-item"  tit="pdfHD">
                            <div class="po-menu-item-box vip-tip">
                                <span class="po-menu-icon po-diagraming-icons">&#xe982;</span>
                                <span class="text">高清PDF</span>
                            </div>
                    </li>
                    <li class="sp-line"></li>
                    <li class="po-menu-item"  tit="pos">
                        <div class="po-menu-item-box">
                            <span class="po-menu-icon po-diagraming-icons">&#xe983;</span>
                            <span class="text">POS文件</span>
                        </div>
                    </li>
                    <li class="po-menu-item"  tit="md">
                        <div class="po-menu-item-box">
                            <span class="po-menu-icon po-diagraming-icons">&#xe903;</span>
                            <span class="text">Markdown(.md)</span>
                        </div>
                    </li>
                    <li class="po-menu-item"  tit="xmind">
                        <div class="po-menu-item-box vip-tip">
                            <span class="po-menu-icon po-diagraming-icons">&#xe985;</span>
                            <span class="text">XMind文件</span>
                        </div>
                    </li>
                    <li class="po-menu-item"  tit="fmind">
                        <div class="po-menu-item-box vip-tip">
                            <span class="po-menu-icon po-diagraming-icons">&#xe97f;</span>
                            <span class="text">FreeMind文件<span>（.mm）</span></span>
                        </div>
                    </li>
                    <li style="display:none">
                        <iframe name="export_iframe" style="display: none"></iframe>
                        <form id="export_form"  target="export_iframe" action="/chart_image/diagram_export/mindmap" method="post">
                            <input id="export_definition" type="hidden" name="definition"/>
                            <input id="export_title" type="hidden" name="title"/>
                            <input id="export_width" type="hidden" name="width"/>
                            <input id="export_height" type="hidden" name="height"/>
                            <input id="export_canvasId" type="hidden" name="canvasId">
                            <input id="export_id" type="hidden" name="chartId">
                            <input type="hidden" name="ignore" value="definition"/>
                            <input id="export_type" type="hidden" name="type">
                            <input id="export_source" type="hidden" name="source">
                            <input id="export_uuid" type="hidden" name="powerStr"> 
                        </form>
                    </li>
                </ul>`,
    //返回
    back: ``,
    //文件
    file: `<div id="header-file" class="header-file"> <div class="header-logo"><img src="../v5_editor/source/static/assets/images/logo-react.svg" alt=""></div>
    <ul id="header-file-menu" class="po-menu po-menu-icon header-file-menu">
        <li class="po-menu-item extend" ac="new">
            <div class="po-menu-item-box">
                <span class="po-diagraming-icons po-menu-icon">&#xe6c2;</span>
                <span class="text">新建</span>
                <span class="extend-icon po-diagraming-icons">&#xe6b7;</span>
            </div>
            <ul class="po-menu extend-menu" style="width:160px;max-height:600px;overflow-y:auto;">
                <li class="po-menu-item" ac="markdown">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/markdown.png" class="po-menu-icon">
                        <span class="text">Markdown</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="mind_free">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/mind.png" class="po-menu-icon">
                        <span class="text">思维导图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="flow">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/flow.png" class="po-menu-icon">
                        <span class="text">流程图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="outline">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/outline.png" class="po-menu-icon">
                        <span class="text">思维笔记</span>
                    </div>
                </li>
                <li class="devider"></li>
                <li class="po-menu-item" ac="mind_timeline_h">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/sxt.png" class="po-menu-icon">
                        <span class="text">时间轴</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="mind_ishikawa_left">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/sjz.png" class="po-menu-icon">
                        <span class="text">鱼骨图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="mind_org">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/szjgt.png" class="po-menu-icon">
                        <span class="text">组织结构图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="mind_tree_free">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/ygt.png" class="po-menu-icon">
                        <span class="text">树形图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="mind_brace_right">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/kht.png" class="po-menu-icon">
                        <span class="text">括号图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="uml">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/uml.png" class="po-menu-icon">
                        <span class="text">UML图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="er">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/er.png" class="po-menu-icon">
                        <span class="text">ER图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="graph">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/graph.png" class="po-menu-icon">
                        <span class="text">图表/表格</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="plana">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/plana.png" class="po-menu-icon">
                        <span class="text">平面图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="gantt">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/gantt.png" class="po-menu-icon">
                        <span class="text">甘特图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="framework">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/framework.png" class="po-menu-icon">
                        <span class="text">架构图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="network">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/wltpt.png" class="po-menu-icon">
                        <span class="text">网络拓扑图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="swimlane">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/swimlane.png" class="po-menu-icon">
                        <span class="text">泳道图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="circuit">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/circuit.png" class="po-menu-icon">
                        <span class="text">电路图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="venn">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/wnt.png" class="po-menu-icon">
                        <span class="text">韦恩图</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="bpmn">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/bpmn.png" class="po-menu-icon">
                        <span class="text">BPMN</span>
                    </div>
                </li>
                <li class="po-menu-item" ac="ui">
                    <div class="po-menu-item-box">
                        <img src="./../assets/images/editor/yxt.png" class="po-menu-icon">
                        <span class="text">原型图</span>
                    </div>
                </li>
            </ul>
        </li>
        <li class="po-menu-item" ac="view">
            <div class="po-menu-item-box">
                <span class="po-diagraming-icons po-menu-icon">&#xe6d4;</span>
                <span class="text">预览</span>
            </div>
        </li>
        <li class="po-menu-item" ac="save">
            <div class="po-menu-item-box">
                <span class="po-diagraming-icons po-menu-icon">&#xe6a0;</span>
                <span class="text">保存</span>
                <span class="po-menu-hotkey">Ctrl+S</span>
            </div>
        </li>
        <li class="po-menu-item" ac="search">
            <div class="po-menu-item-box">
                <span class="po-diagraming-icons po-menu-icon">&#xe72d;</span>
                <span class="text">查找替换</span>
                <span class="po-menu-hotkey">Ctrl+F</span>
            </div>
        </li> 
    </ul>
</div>`,
    //重命名
    rename: `<div id="header-title" class="title" contenteditable="true"></div>`,
    // html模式预览
    htmlMode: `<div class="po-tool-button" title="分屏预览" tit="htmlMode"><span class="po-diagraming-icons">&#xe906;</span></div>`,
    // 思维导图模式预览
    mindMode: `<div class="po-tool-button" title="脑图预览" tit="mindMode"><span class="po-diagraming-icons">&#xe901;</span></div>`,
    wsMode: `<div class="po-tool-button active" title="可视化编辑" tit="wysiwygMode"><span class="po-diagraming-icons">&#xe9d1;</span></div>`,
    // 全屏模式预览
    allScreenMode: `<div class="po-tool-button" title="全屏编辑" tit="allScreenEditMode"><span class="po-diagraming-icons">&#xe902;</span></div>`,
    split: `<div class="split"></div>`,
    //保存状态
    save: `<div id="header-history" class="history-button po-tool-button" tit="history" style="line-height: 1"><img id="save_img" class="save_img" src="./.../../../v5_editor/source/static/images/saved.gif" /><span id="save-tip">已保存</span></div>`,
    saveBtn: `<div class="po-tool-button sava-btn" tit="save" title="保存" ><span class="po-diagraming-icons">&#xe920;</span></div>`,
    share: `<div class="po-text-button" tit="share" >分享</div>`,
    uploadOnlineBtn: `<div id="po-uploadOnline-button" class="po-tool-button" tit="export" title="立即上云"><i class="icons_web" style="font-size:22px;color:#24292e;">&#xe684;</i></div>`,
  },
  render: function () {
    var rightBox = $(PoEditorClient.getRightBar());
    var rightDomStr = this.domData.wsMode + this.domData.mindMode + this.domData.htmlMode + this.domData.allScreenMode + this.domData.split + (window.isMyFile ? this.domData.uploadOnlineBtn : '') + this.domData.export + this.domData.split + this.domData.share
    rightBox.append(rightDomStr);

    $("#user_photo_now").on("error", function () {
      $(this).attr("src", "\/\/cdn.processon.com/62a9b02c6376893f4929f1d2");
    })
    rightBox.children(".po-clb-user-photo-list").after(this.domData.clb);
    var leftBox = $(PoEditorClient.getLeftBar());
    leftBox.children(".toolbar-filling").after(this.domData.back + this.domData.file + this.domData.rename + this.domData.save);
    $('body').append(this.domData.exportMenu);
    if (navigator.userAgent.indexOf("app/tencent_wemeet") > -1) {
      $("#header-export").hide();
    }
    var collaRole = this.chart.collaRole;
    if (collaRole == 'viewer') {
      rightBox.find('[tit=export]').addClass('disabled');
      leftBox.find("#header-title").addClass('disabled');
      leftBox.find('#header-file').addClass('disabled').css('pointer-events', 'none');
    };
    markdownHelpMenu.init(function () {
      PoEditorClient.showShortcut()
    })
    mardownNewGuide.init()
    if (window.fileType == 'markdown') {
      $('.toolbar').find('.icon-liuchengtu').parent().parent().parent().hide()
      $('.toolbar').find('.icon-zuzhijiegoutu1').parent().parent().parent().hide()
    }
  },
  initEvent: function () {
    var that = this;
    // 文件重命名
    var headerTitle = $("#header-title");
    let chartTitle = that.chart.title;

    headerTitle.text(chartTitle);
    headerTitle.on("blur", function (e) {
      e.stopPropagation();
      var newTitle = $(this).text();
      $(this).removeClass("empty");
      headerTitle.html("");
      if (newTitle == "") {
        $(this).text(Util.restoreXss(that.chart.title));
        return
      }
      setTimeout(function () {
        headerTitle.text(newTitle);
      }, 60)
      if (newTitle != "") {
        that.rename(newTitle)
      }
    }).on("keydown", function (e) {
      e.stopPropagation();
      if (e.keyCode == 13) {
        $(this).blur();
      }
    }).on("focus", function () {
      if ($(this).text() == "未命名文件") {
        $(this).html("").addClass("empty")
      }
    });
    // 点击顶部菜单
    $(".mind-header [tit]").on("click", function (e) {
      if (editorGlobalConfig && editorGlobalConfig.noFilesNum) {
        ipc.sendToHost('showDlgPayWebView1', { pay_position: 'Editor-NewFile', pointspage: 'Markdown编辑器', pointssource: "三方文件数不足", title: "升级畅享全部会员权益" })
        return
      }
      e.stopPropagation();
      var $this = $(this), tit = $this.attr("tit");
      const setSelected = function () {
        $this.siblings().removeClass('active')
        $this.addClass('active')
        PoEditorClient.setMarkdownShowMode(tit.replace('Mode', ''))
      }
      switch (tit) {
        case "save":
          that.save()
          break;
        case "export":
          $("#header-export-menu").dropdown({
            target: $this,
            zindex: 4,
            position: "right",
            onSelect: async function (item) {
              var type = item.attr("tit");
              let flagTitle = ''
              let blob
              let def
              console.log(type)
              switch (type) {
                case 'pos':
                case 'md':
                  def = await PoEditorClient.getDef(type)
                  if (type === 'pos') {
                    var jsonString = JSON.stringify(def);
                    blob = new Blob([jsonString], { type: 'text/json' });
                  } else {
                    blob = new Blob([def], { type });
                  }
                  const url = URL.createObjectURL(blob);
                  PoEditorInsert.triggerDownload(url, MarkdownBar.chart.title + `.${type}`)
                  break;
                case 'png':
                case 'pnghd':
                case 'jpghd':
                case 'jpg':
                case 'png':
                case 'pdfHD':
                case 'word':
                case 'xmind':
                case 'csv':
                case 'fmind':
                case 'ppt':
                  window.editorGlobalConfig.onBeforeExport({ type, call: () => { }, isSave: false, partIds: null })
                  break;
                case 'saveMind':
                  window.saveAs()
              }
            }
          })
          break;
        case "allScreenEditMode":
          setSelected()
          break
        case "htmlMode":
          setSelected()
          break
        case "mindMode":
          setSelected()
          break;
        case "wysiwygMode":
          setSelected()
          break;
        case "share":
          if (window.isMyFile) {
            window.toast_.noYun()
            return
          }
          if (!navigator.onLine) {
            new Toast('needNetwork')
            return
          }
          PoEditorInsert.share()
          break;
        default:
          break;
      }
    });
    var fileOver = false;
    $("#header-file").off().on("mousedown", function (e) {
      e.stopPropagation();
    }).on("mouseenter", function (e) {
      if (that.chart.collaRole == 'viewer') {
        return false
      }
      if (editorGlobalConfig && editorGlobalConfig.noFilesNum) {
        ipc.sendToHost('showDlgPayWebView1', { pay_position: 'Editor-NewFile', pointspage: 'Markdown编辑器', pointssource: "三方文件数不足", title: "升级畅享全部会员权益" })
        return
      }
      fileOver = true;
      $("#header-file-menu").show().find("li").off().on("click", function () {
        var item = $(this);
        var ac = item.attr("ac");
        if (window.mind) {
          mind.events.push("hideRightMoreList");
        }
        if (ac == "view") {
          if (window.isMyFile && !window.filepath) {
            window.toast_.noYun()
            return
          }
          FileBusiness.view(window.chartId, 'chart', () => { }, { category: window.fileType, filepath: window.filepath })
          return
        } else if (ac == "save") {
          that.save()
        } else if (ac == "search") {
          PoEditorClient.openSearch();
        } else if (item.parent().parent().attr("ac") == "new") {
          that.newFile(ac);
        }
      });
    }).on("mouseleave", function (e) {
      fileOver = false;
      // debugger
      $("#header-file-menu").dropdown('close')
    })
    //点击更多
    $("#more-file").on("click", function () {
      window.open("/history")
    })

    $('#po-uploadOnline-button').off('click').on('click', () => {
      if (window.fileType == 'mind') {
        const title = $('#topic-root .po-richtext-node-wrap').text().trim();
        window.saveName = title == '' ? '未命名文件' : title
      }
      ipc.sendToHost('showDlgSaveWebView',
        {
          id: TABGROUPID, savepath: window.saveName, suffix: window.fileType == 'flow' ? 'posf' : window.fileType == 'outline' ? 'poso' : window.fileType == 'markdown' ? 'md' : 'posm'
          , islocal: false
        }
      )
    })
  },
  markdownOutHandle: function (type) {
    let blob
    let def
    console.log(type)
    switch (type) {
      case 'pos':
      case 'md':
        def = PoEditorClient.getDef(type)
        if (type === 'pos') {
          var jsonString = JSON.stringify(def);
          blob = new Blob([jsonString], { type: 'text/json' });
        } else {
          blob = new Blob([def], { type });
        }
        const url = URL.createObjectURL(blob);
        PoEditorInsert.triggerDownload(url, MarkdownBar.chart.title + `.${type}`)
        break;
      case 'pdfHD':
      case 'word':
      case 'xmind':
      case 'csv':
      case 'fmind':
      case 'ppt':
        window.editorGlobalConfig.onBeforeExport({ type, call: () => { }, isSave: false, partIds: null })
        // let defTarget = (PoEditorClient.getDef('pos'))?.diagram?.elements
        // PoEditorInsert.outHandleExport(type, MarkdownBar.chart, "mind", 'fromMarkdown', defTarget,);
        break;

    }
  },
  rename: function (newTitle) {
    const that = this
    const { chartId } = this.chart
    if (newTitle && chartId != "") {
      var str = pcUtil.restoreXss(newTitle);
      var len = pcUtil.getCharLength(str);
      if (len > 128) {
        $.toast({
          type: "error",
          text: "文件名不能超过128个字符",
        })
        return
      }
      if (window.isMyFile) {
        chartObj.title = newTitle
        that.chart.title = newTitle;
        $("title").html(newTitle + "-ProcessOn");
        $("#header-title").text(newTitle)
        window.saveName = newTitle
        fileCache.add(window.chartId)
        ipc.sendToHost('setTitle', window.TABGROUPID, chartObj.title)
      }
      else {
        pcUtil.ajax({
          url: "/api/personal/chart/rename",
          data: { title: str, ignore: 'title', chartId },
          success: function (data) {
            chartObj.title = newTitle
            that.chart.title = newTitle;
            $("title").html(newTitle + "-ProcessOn");
            $("#header-title").text(newTitle)
            pcUtil.localChange({
              type: 'rename',
              chartId: that.chart.chartId,
              title: that.chart.title,
            })
            window.saveName = newTitle
            fileCache.add(window.chartId)
            ipc.sendToHost('setTitle', window.TABGROUPID, chartObj.title)
          }
        })
      }
    }
  },
  newFile: function (cate) {
    const query = '&type=' + cate
    let dataKey = '';
    const baseUrl = window.location.href.startsWith('http://localhost:5173/') ? 'http://localhost:5173/src' : `file:///${webRoot}`
    if (cate.indexOf("mind") >= 0 || ['fishbone', 'timeline', 'ishikawa'].includes(cate)) {
      dataKey = 'mindmap'
    }
    else if (cate == "outline") {
      dataKey = 'outline'
    }
    else if (cate == "markdown") {
      dataKey = 'markdown'
    }
    else {
      dataKey = 'diagrams'
    }
    const url = cate.indexOf("markdown") > -1 ?
      `${baseUrl}/markdown-editor/index.html?token=token&chartId=&dbId=jGthTGDM5R${query}&filepath=&new=true`
      : `${baseUrl}/v5_editor/source/compile/${dataKey}/index.html?token=token&chartId=&dbId=jGthTGDM5R${query}&filepath=&new=true`

    const arg = { url: url };
    pcUtil.openWin(arg);
  },
  save: function () {
    if (window.isMyFile) {
      window.save();
    }
    else {
      PoEditorClient.saveOnline();
    }
  },
}
// 工具栏初始化
window.editorTabBar = {
  init: function (options) {
    // window.PoEditorClient = new PoEditorApi("body",{

    // })
    if (fileType == 'flow') {
      FlowBar.init(options)
    }
    if (fileType == 'mind') {
      MindBar.init(options)
    }
    if (fileType == 'outline') {
      $('#po-org-outline').show();
      //移除流程图编辑器html
      if ($('#po-org-flow').length > 0) {
        $('#po-org-flow').remove();
      }
      //移除大纲编辑器html
      if ($('#po-org-mind').length > 0) {
        $('#po-org-mind').remove();
      }
      outlineBar.init(options);
    }
    if (fileType == 'markdown') {
      MarkdownBar.init(options)
    }
  }
}
// 初始方法
window.PoEditorInsert = {
  scale: 1,
  scaleFactor: 0.15,
  isDragging: false,
  imageSvgs: [],
  allChartCanvas: [],
  currentCanvasList: [],
  svgCache: {},
  canvasDefCache: {},
  canvasDefInflight: {},
  designatedCanvasLoading: false,
  comeFromDownloadPart: false,
  pendingWatermark: null,
  xPadding: 25,
  yPadding: 25,
  pageLayout: 'shape',
  previewCardSize: 340,
  previewCardGap: 16,
  previewTopOffset: 16,
  chartObj: window.chartObj,
  //发布
  publish: function (opt) {
    if (editorGlobalConfig && editorGlobalConfig.noFilesNum) {
      PoEditorInsert.pay({ title: "升级会员享无限文件数", pointsSource: "三方文件数不足" })
      return
    }
    var that = this;
    PoEditorInsert.userBlack(function (result) {
      if (result) {
        $.toast({
          type: "error",
          text: "您的账号因违反《ProcessOn服务条款-内容发布以及使用权》，已被限制相关功能及权益",
        })
        return
      }
    })
    if (userObj && !userObj.phone) {
      if (typeof phoneBind == "undefined") {
        bigPipe.render({ js: [staticBasePath + "/assets/js/users/phonebind.js"], css: [staticBasePath + "/assets/css/users/phonebind.css"] }, function () {
          phoneBind.init(function (phone) {
            userObj.phone = phone;
            that.iframeDlg({
              width: "742px",
              height: "530px",
              type: "pubpo",
              fdata: JSON.stringify(window.chartObj),
              callback: function (data) {

              }
            })
          })
        })
      } else {
        phoneBind.init(function (phone) {
          userObj.phone = phone;
          that.iframeDlg({
            width: "742px",
            height: "530px",
            type: "pubpo",
            fdata: JSON.stringify(chartObj),
            callback: function (data) {

            }
          })
        })
      }
    } else {
      that.iframeDlg({
        width: "742px",
        height: "600px",
        type: "pubpo",
        fdata: JSON.stringify(chartObj),
        callback: function (data) {

        }
      })
    }
  },
  //分享协作
  share: function (opt) {
    ipc.sendToHost('showShareWebView', 'chart', chartObj.chartId)
    // if (editorGlobalConfig && editorGlobalConfig.noFilesNum) {
    //   PoEditorInsert.pay({ title: "升级会员享无限文件数", pointsSource: "三方文件数不足" })
    //   return
    // }
    // var that = this;
    // that.iframeDlg({
    //   width: "680px",
    //   height: "533px",
    //   type: "share",
    //   fdata: JSON.stringify(chartObj),
    //   cid: editorGlobal.poPagination.pageId,
    //   ...opt,
    //   callback: function (data) {

    //   }
    // })

  },
  iframeDlgPms: {},
  prevMsg: "",
  iframeDlg: function (opt) {
    var _this = this;
    var orgId = null;
    if (opt.fdata) {
      orgId = JSON.parse(opt.fdata).orgId;
    }
    var dlgdomain = window.host
    var opt = $.extend({
      url: dlgdomain + (orgId ? "/org" : "") + "/dlgapi",
      width: "770px",
      height: "537px",
      type: "dlgPay",
      title: "支付"
    }, opt)
    var params = "?";
    if (opt.type) {
      params = params + "type=" + opt.type;
      if (opt.type == "dlgPay") {
        params += "&pointspage=" + opt.pointsPage
        params += "&pointssource=" + opt.pointsSource
      }
    }
    if (opt.title) {
      params = params + "&title=" + opt.title;
    }
    if (opt.fdata) {
      params = params + "&fdata=" + encodeURIComponent(opt.fdata);
    }
    if (opt.pattern) {
      params += "&pattern=" + opt.pattern;
    }
    // 团队支付相关参数
    // 支付弹窗展示类型
    if (opt.pageStatus) {
      params = params + "&pageStatus=" + opt.pageStatus;
    }
    // 支付弹窗会员功能下拉展示文案
    if (opt.payTitle) {
      params = params + "&payTitle=" + opt.payTitle;
    }
    // 团队信息 orgId
    if (opt.orgInfo) {
      params = params + "&orgInfo=" + JSON.stringify(opt.orgInfo);
    }
    $("#po-dialog-iframe-" + opt.type).remove();
    var $iframe = $("#po-dialog-iframe-" + opt.type + " iframe");
    if ($iframe.length == 0) {
      var $iframeDlg = $('<div id="po-dialog-iframe-' + opt.type + '" class="po-dialog po-dialog-iframe"><div class="po-iframe-loading-wrap"><img src="' + staticBasePath + '/assets/images/iframe_loading.gif"></div><div class="po-dialog-header" style="position: absolute;width: calc(100% - 42px);height: 20px"></div><iframe></iframe></div>').appendTo("body")
      $iframe = $iframeDlg.find("iframe");
      $iframe.width(opt.width).height(opt.height).attr("src", opt.url + params);
    }

    if (!this.iframeDlgPms[opt.type]) {
      this.iframeDlgPms[opt.type] = {};
    }
    if (!this.iframeDlgPms[opt.type].messengerIframe) {
      this.iframeDlgPms[opt.type].messengerIframe = new Messenger(
        'edit',
        'v5',
        [{ target: $iframe[0].contentWindow, targetName: 'filelist' }, { target: window, targetName: 'edit' }],
        function (msg) {
          var msgObj = JSON.parse(msg || "{}");
          if (_this.prevMsg === msg && msgObj.instructs !== "resize") {
            return;
          }
          _this.prevMsg = msg
          // console.log('v5msg', msgObj)
          if (msgObj.type == "dlgShare" || msgObj.type == "share") {
            if (msgObj.instructs == "close") {
              personalInsert.publish.init()
              var w = msgObj.width, h = msgObj.height;
              $("#po-dialog-iframe-" + opt.type).css({
                width: w,
                height: h
              });
              $iframe.width(w).height(h);
            } else if (msgObj.instructs == "orgClose") {
              window.location.reload();
            }
            if (injectExtraAsynCall('openMention')) {
              if (msgObj.instructs == 'addCollaMember') {
                let arr = msgObj.userIds.split(',');
                arr.forEach(item => {
                  mention.mentionStatus(item, true)
                })
              } else if (msgObj.instructs == 'delCollaMember') {
                let arr = msgObj.userIds.split(',');
                arr.forEach(item => {
                  mention.mentionStatus(item, false)
                })
              }
            }
          } else if (msgObj.type == "dlgPubpo") {
            if (msgObj.instructs == "close") {
              $("#po-dialog-iframe-pubpo").dialog("close");
            }
          } else if (msgObj.type == "dlgPay") {
            if (msgObj.instructs == "close") {
              window.location.reload();
            } else if (msgObj.instructs == "paySuccess") {

            }
          } else if (msgObj.type == "dlgFeedback") {
            if (msgObj.instructs == "close") {
              $("#po-dialog-iframe-dlgFeedback").dialog("close");
            }
          } else if (msgObj.optType == 'copyAndMove') {
            _this.prevMsg = null
            if (msgObj.instructs == "close") {
              $("#po-dialog-iframe-copy").dialog("close");
              return
            }
            if (msgObj.type == "move") {
              // 复制文件对象
              chartObj.folderId = msgObj.targetFolderId || 'root'
              chartObj.teamId = msgObj.teamId || ''
            }
            let text = msgObj.type == "move" ? '移动成功' : '复制成功'
            $.toast({
              text: text
            })
            $("#po-dialog-iframe-copy").dialog("close");
          } else if (msgObj.optType == "dlgChooseFile") {
            _this.prevMsg = null
            if (msgObj.instructs == "save") {
              let { file } = msgObj.chooseFile
              file.chartType = injectCommon.dealFileType(file)
              file.text = file.title
              file.url = injectCommon.getFileUrl(file)
              file.time = injectCommon.friendlyTime(file.lastModify)
              file.icon = location.origin + `/assets/images/calledIcon/${file.chartType}_circular.svg`
              file.type = 1
              file.uid = file.chartId
              let arr = [file]
              $("#po-dialog-iframe-dlgChooseFile").dialog("close");
              PoEditorClient.getSelectData(arr)
            }
            $("#po-dialog-iframe-dlgChooseFile").dialog("close");
          }
          //针对resize处理
          if (msgObj.instructs == "resize") {
            var w = msgObj.width, h = msgObj.height;
            var _dlgName = msgObj.type;
            // 兼容 dlgShare
            if (_dlgName === `dlgShare`) {
              _dlgName = `share`;
            }
            $("#po-dialog-iframe-" + _dlgName).css({
              // top: '50%',
              marginTop: -h / 2 + 'px',
              width: w,
              height: h,
              marginLeft: -w / 2 + 'px',

            });
            $("#po-dialog-iframe-" + _dlgName).children('iframe').width(w).height(h);
          }
        }
      );
    }
    if (opt.isHide) {
      return
    }
    $.mask();
    $("#po-dialog-iframe-" + opt.type + "").width(opt.width).height(parseInt(opt.height)).dialog({
      onClose: function () {
        $.mask("close");
      }
    });
    var that = this;
    $iframe.off("load").on("load", function () {
      $(".po-iframe-loading-wrap").fadeOut("500");
      var timer = setTimeout(function () {
        $(".po-iframe-loading-wrap").remove();
        clearTimeout(timer);
      }, 500)
      if (typeof that.iframeDlgPms[opt.type].messengerIframe != "undefined") {
        var sendData = {
          type: opt.type,
          instructs: 'init'
        }
        that.iframeDlgPms[opt.type].messengerIframe.targets['filelist'].send(JSON.stringify(sendData));
      }

    });
    if (opt.type === 'pubpo') {
      $("#po-dialog-iframe-" + opt.type + "").css({
        // top: '50%',
        // marginTop: -opt.height/2 + 'px'
      })
    }

  },
  userPhotoMenu: {
    tar: null,
    menus: {
      "user": {
        icon: "https://user-photo.ks3-cn-beijing.ksyuncs.com/518dcca57b584c3285cc3fa6330894a5",
        text: "123"
      },
      "topay": { icon: "&#xe96b;", text: "升级" },
      "file": { icon: "&#xe70f;", text: "我的文件" },
      "logout": { icon: "&#xe94e;", text: "退出" },
    },
    init: function (tar, menus) {
      var that = this;
      that.tar = tar;
      $.extend(that.menus, menus)
      this.render();
    },
    render: function () {
      var that = this;
      var menu = $("#po-user-photo-menu");
      for (var key in that.menus) {
        var item = that.menus[key]
        if (key == "user") {
          menu.find("[tit=" + key + "]").find("img").attr("src", item.icon);
          menu.find("[tit=" + key + "]").find(".text").html(item.text);
        } else {
          menu.find("[tit=" + key + "]").find(".po-diagraming-icons").html(item.icon);
          menu.find("[tit=" + key + "]").find(".text").html(item.text);
        }
      }
      menu.dropdown({
        target: that.tar,
        zindex: 10,
        position: "right",
        onSelect: function (item) {
          let tit = item.attr('tit')
          switch (tit) {
            case "user":
              if (typeof jsbridge != "undefined" && jsbridge.getLaunchOptions()) {

              } else {
                location.href = "/setting"
              }
              break;
            case "topay":
              if (PoEditorInsert.isLoginOrNot()) {
                return
              }
              PoEditorInsert.pay({ title: "开通会员享全部会员权益", pointsSource: "头像_升级" });
              break;
            case "file":
              var jumpUrl = "/diagrams";
              if (chartObj.orgId) {
                jumpUrl = "/org";
              }
              location.href = jumpUrl;
              break;
            case "logout":
              poAjax({
                type: "GET",
                success: function (res) {
                  Util.setCookies("token", "", -1);
                  if (typeof randerComplete == "function") {
                    randerComplete(viewChart);
                  }
                  location.href = "/login"
                }
              }, 'logOut')
              break;
          }
        }
      });
    }
  },
  //黑名单
  userBlack: function (callback) {
    pcUtil.ajax({
      url: "/api/personal/user/publish/black",
      type: "get",
      old: true,
      success: function (res) {
        callback(res.data)
      }
    })

  },
  //处理宽高
  handleWidthHeightPx(str) {
    if (str.indexOf("px") > 0) {
      str = str.replace("px", "")
    }
    return str
  },
  imageType(type) {
    var newType = type;
    if (type == "pdfhd" || type == "pdfHD") {
      newType = "pdf"
    } else if (type == "pnghd" || type == "pngHD") {
      newType = "png"
    } else if (type == "jpghd") {
      newType = "jpg"
    }
    return newType

  },
  //base64转Blob
  dataURIToBlob(dataURI, sufix) {
    var binStr = atob(dataURI.split(',')[1]),
      len = binStr.length,
      arr = new Uint8Array(len);

    for (var i = 0; i < len; i++) {
      arr[i] = binStr.charCodeAt(i);
    }
    return new Blob([arr], { type: "image/" + sufix });
  },
  getExportButtonLabel() {
    const sufix = String(PoEditorInsert.imageSufix || '').replace(/hd$/i, '')
    if (sufix === 'pdf') return '导出 PDF'
    if (sufix === 'svg') return '导出'
    return '导出图片'
  },
  syncExportButtonText() {
    const loading = !!PoEditorInsert.exportButtonLoading
    const label = loading ? '导出中...' : PoEditorInsert.getExportButtonLabel()
    $('.w_m_start_out').text(label)
    $('.w_m_pdf_split_main').text(loading ? '导出中...' : '导出 PDF')
  },
  syncPdfSplitButton() {
    const sufix = PoEditorInsert.imageSufix || ''
    const isPdf = sufix === 'pdf' || sufix === 'pdfhd' || sufix === 'pdfHD'
    const isMulti = (PoEditorInsert.imageSvgs || []).length > 1
    const showSplit = isPdf && isMulti
    $('.w_m_pdf_split').toggleClass('is-on', showSplit)
    if (showSplit) {
      $('.w_m_start_out').hide()
    } else {
      $('.w_m_start_out').show()
    }
    PoEditorInsert.syncExportButtonText()
  },
  syncCopyImageButton() {
    const sufix = String(PoEditorInsert.imageSufix || '').replace(/hd$/i, '')
    const isRaster = sufix === 'png' || sufix === 'jpg'
    const pageCount = Math.max(
      (PoEditorInsert.imageSvgs || []).length,
      (PoEditorInsert.currentCanvasList || []).length
    )
    if (isRaster && pageCount <= 1) {
      $('.w_m_copy_image').show()
    } else {
      $('.w_m_copy_image').hide()
    }
  },
  resetWaterMarkPoupe() {
    PoEditorInsert.currentCanvasList = []
    PoEditorInsert.allChartCanvas = []
    PoEditorInsert.svgCache = {}
    PoEditorInsert.pageLayout = 'shape'
    PoEditorInsert.xPadding = 25
    PoEditorInsert.yPadding = 25
    PoEditorInsert.scale = 1
    PoEditorInsert.imageSvgs = []
    PoEditorInsert.pendingWatermark = null
    $('.water_image_ontainer').empty().css({
      transform: 'none',
      top: 'auto',
      left: 'auto',
      width: 'auto',
      height: 'auto'
    })
    $('.water_mark_current_canvas .current_text').text('当前画布')
    $('.water_mark_current_canvas .canvas_select').hide()
    $('.canvas_select .canvas_item').removeClass('active')
    $('.canvas_select .canvas_item[data-canvas="current"]').addClass('active')
    $('.designated_canvas_list').hide().empty()
    $('.canvas_item .icons_arrow_canvas').removeClass('icons_arrow_up')
    $('.w_m_radio_canvas_item .radio-single[name="option_canvas"]').prop('checked', false)
    $('.w_m_radio_canvas_item .radio-single[name="option_canvas"]').eq(0).prop('checked', true)
    $('.wm_margin_set_up_title').show()
    $('.w_m_margin_set_up').show()
    $('.w_m_input_up_down').val(25)
    $('.w_m_input_left_right').val(25)
    $('.w_m_pdf_split').removeClass('is-on is-loading')
    $('.w_m_pdf_split_arrow').removeClass('is-open')
    $('.w_m_pdf_split_menu').removeClass('is-open')
  },
  _wmAssetCache: {},
  async resolveWatermarkAssetUrl(url) {
    if (!url || String(url).indexOf('data:') === 0) return url
    const key = String(url)
    if (PoEditorInsert._wmAssetCache[key]) return PoEditorInsert._wmAssetCache[key]
    if (!window.webRoot) {
      try { window.webRoot = await ipc1.sendSync('webRoot') } catch (e) {}
    }
    const root = window.webRoot || ''
    const fileName = decodeURIComponent(key.split('/').pop().split('?')[0].split('#')[0])
    const candidates = []
    if (root && fileName) {
      candidates.push(root + '/assets/images/watermark/' + fileName)
      candidates.push(root + '/v5_editor/source/static/assets/images/watermark/' + fileName)
    }
    try {
      const abs = new URL(key, window.location.href)
      if (abs.protocol === 'file:') {
        let p = decodeURIComponent(abs.pathname)
        if (/^\/[A-Za-z]:\//.test(p)) p = p.slice(1)
        candidates.push(p)
      }
    } catch (e) {}
    for (let i = 0; i < candidates.length; i++) {
      const path = candidates[i]
      if (!path) continue
      const b64 = await ipc1.sendSync('loadFileB64', { type: 'local', path })
      if (b64) {
        const ext = (fileName.split('.').pop() || 'svg').toLowerCase()
        const mime = ext === 'svg' ? 'image/svg+xml' : ('image/' + (ext === 'jpg' ? 'jpeg' : ext))
        const dataUrl = 'data:' + mime + ';base64,' + b64
        PoEditorInsert._wmAssetCache[key] = dataUrl
        return dataUrl
      }
    }
    return url
  },
  async inlineSvgAssets(content) {
    if (!content) return content
    const found = new Set()
    const re = /(?:href|xlink:href)=["']([^"']+)["']|url\((['"]?)([^)'"]+)\1\)/g
    let m
    while ((m = re.exec(content))) {
      const url = m[1] || m[3]
      if (!url || url.indexOf('data:') === 0 || url.charAt(0) === '#') continue
      found.add(url)
    }
    const fileUrlToPath = (href) => {
      let p = decodeURIComponent(href.split('?')[0].split('#')[0]).replace(/^file:\/+/, '')
      if (/^\/[A-Za-z]:\//.test(p)) p = p.slice(1)
      else if (p[0] !== '/' && !/^[A-Za-z]:/.test(p)) p = '/' + p
      return p
    }
    let next = content
    for (const url of found) {
      let dataUrl = ''
      try {
        if (url.indexOf('watermark/') > -1 || url.indexOf('wm_type_') > -1) {
          dataUrl = await PoEditorInsert.resolveWatermarkAssetUrl(url)
          if (dataUrl === url) dataUrl = ''
        }
        if (dataUrl) {
          next = next.split(url).join(dataUrl)
          continue
        }
        const abs = new URL(url, window.location.href)
        let b64 = ''
        if (abs.protocol === 'file:' || (window.webRoot && url.indexOf('assets/images/') > -1)) {
          const assetRel = url.split('assets/images/')[1]
          const paths = []
          if (assetRel && window.webRoot) paths.push(window.webRoot + '/assets/images/' + decodeURIComponent(assetRel.split('?')[0]))
          if (abs.protocol === 'file:') paths.push(fileUrlToPath(abs.href))
          for (const path of paths) {
            b64 = await ipc1.sendSync('loadFileB64', { type: 'local', path })
            if (b64) break
          }
          if (b64) {
            const suffix = (url.split('.').pop() || '').split('?')[0].toLowerCase()
            const mime = suffix === 'svg' ? 'image/svg+xml' : ('image/' + (suffix === 'jpg' ? 'jpeg' : suffix || 'png'))
            dataUrl = 'data:' + mime + ';base64,' + b64
          }
        } else {
          const res = await fetch(abs.href)
          const blob = await res.blob()
          dataUrl = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result || '')
            reader.onerror = () => resolve('')
            reader.readAsDataURL(blob)
          })
        }
      } catch (e) {}
      if (dataUrl) next = next.split(url).join(dataUrl)
    }
    return next
  },
  async exportSvgFromPreview(list, title) {
    const pages = list || []
    if (!pages.length) return false
    const safeName = (title || 'export').replace(/[\\/:*?"<>|]/g, '_')
    const saveSvg = async (content, name) => {
      const inlined = await PoEditorInsert.inlineSvgAssets(content)
      const data = importClass.stringToBase64String(inlined || '')
      if (window.downType) ipc.sendToHost('down')
      const res = await ipc1.sendSync('saveFileB64', { type: 'save', data, path: name, suffix: 'svg' })
      return res != ''
    }
    if (pages.length === 1) {
      const ok = await saveSvg(pages[0].content, window.saveName || safeName)
      if (ok) new Toast({ type: 'success', msg: '保存成功' })
      else if (window.downType) ipc.sendToHost('cancel')
      return ok
    }
    if (!window.JSZip1) return false
    const zip = new window.JSZip1()
    const folder = zip.folder(safeName)
    for (let index = 0; index < pages.length; index++) {
      const svg = pages[index]
      const name = (svg.title || ('page_' + (index + 1))).replace(/[\\/:*?"<>|]/g, '_')
      const inlined = await PoEditorInsert.inlineSvgAssets(svg.content || '')
      folder.file(name + '.svg', inlined)
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const b64 = await importClass.blobToBase64Simple(blob)
    window.poExportWait && window.poExportWait.closeForSave()
    if (window.downType) ipc.sendToHost('down')
    const res = await ipc1.sendSync('saveFileB64', { type: 'save', data: b64, path: window.saveName || safeName, suffix: 'zip' })
    if (res != '') {
      new Toast({ type: 'success', msg: '保存成功' })
      return true
    }
    if (window.downType) ipc.sendToHost('cancel')
    return false
  },
  async rasterizeSvgParamsToPng(params) {
    const res = await PoEditorClient.exportView.svgToImage(
      { content: params.content, w: params.w, h: params.h },
      params.scale || 2,
      'pnghd'
    )
    if (res.status !== 'success' || !res.img) return null
    return res.img
  },
  async exportMultiCanvasPdf(paramsList, title, options = {}) {
    if (!paramsList || !paramsList.length || !window.jspdf && typeof jsPDF === 'undefined') {
      new Toast({ type: 'error', msg: '导出失败' })
      return false
    }
    const makeDoc = (w, h) => {
      const cfg = { unit: 'px', format: [w, h], orientation: w > h ? 'landscape' : 'portrait' }
      return window.jspdf ? new jspdf.jsPDF(cfg) : new jsPDF(cfg)
    }
    const safeName = (title || 'export').replace(/[\\/:*?"<>|]/g, '_')
    const buildOnePdfBase64 = async (params) => {
      const imgData = await PoEditorInsert.rasterizeSvgParamsToPng(params)
      if (!imgData) return null
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imgData
      })
      const w = params.w || img.width || 800
      const h = params.h || img.height || 600
      const doc = makeDoc(w, h)
      doc.addImage(imgData, 'PNG', 0, 0, w, h, '', 'FAST')
      return doc.output('datauristring').replace('data:application/pdf;filename=generated.pdf;base64,', '')
    }
    if (options.asZip) {
      if (!window.JSZip1) {
        new Toast({ type: 'error', msg: '导出失败' })
        return false
      }
      const zip = new window.JSZip1()
      const folder = zip.folder(safeName)
      for (let i = 0; i < paramsList.length; i++) {
        const b64 = await buildOnePdfBase64(paramsList[i])
        if (!b64) continue
        const name = (paramsList[i].title || ('page_' + (i + 1))).replace(/[\\/:*?"<>|]/g, '_')
        folder.file(name + '.pdf', b64, { base64: true })
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      window.poExportWait && window.poExportWait.closeForSave()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = safeName + '.zip'
      a.click()
      URL.revokeObjectURL(url)
      new Toast({ type: 'success', msg: '保存成功' })
      return true
    }
    let mergedDoc = null
    for (let i = 0; i < paramsList.length; i++) {
      const imgData = await PoEditorInsert.rasterizeSvgParamsToPng(paramsList[i])
      if (!imgData) continue
      const w = paramsList[i].w || 800
      const h = paramsList[i].h || 600
      if (!mergedDoc) {
        mergedDoc = makeDoc(w, h)
      } else {
        mergedDoc.addPage([w, h], w > h ? 'landscape' : 'portrait')
      }
      mergedDoc.addImage(imgData, 'PNG', 0, 0, w, h, '', 'FAST')
    }
    if (!mergedDoc) {
      new Toast({ type: 'error', msg: '导出失败' })
      return false
    }
    const result = mergedDoc.output('datauristring').replace('data:application/pdf;filename=generated.pdf;base64,', '')
    if (window.downType) ipc.sendToHost('down')
    const res1 = await ipc1.sendSync('saveFileB64', { type: 'save', path: window.saveName || safeName, data: result, suffix: 'pdf' })
    if (res1 != '') {
      new Toast({ type: 'success', msg: '保存成功' })
      return true
    }
    if (window.downType) ipc.sendToHost('cancel')
    return false
  },
  persistCanvasDef(item, def) {
    if (!item || !def) return
    item.def = def
    if (item.definitionId) {
      PoEditorInsert.canvasDefCache[item.definitionId] = def
    }
    ;(PoEditorInsert.allChartCanvas || []).forEach(function (meta) {
      if (meta.canvasId === item.canvasId || meta.definitionId === item.definitionId) {
        meta.def = def
      }
    })
  },
  fetchChartDef(defId, title, chartId) {
    if (!defId) return Promise.reject(new Error('missing defId'))
    if (PoEditorInsert.canvasDefCache[defId]) {
      return Promise.resolve(PoEditorInsert.canvasDefCache[defId])
    }
    if (PoEditorInsert.canvasDefInflight[defId]) {
      return PoEditorInsert.canvasDefInflight[defId]
    }
    const p = PoEditorInsert.apiChartDefGet({
      chartId: chartId || (window.chartObj && window.chartObj.chartId) || window.chartId,
      defId: defId
    }, title).then(function (def) {
      PoEditorInsert.canvasDefCache[defId] = def
      delete PoEditorInsert.canvasDefInflight[defId]
      return def
    }).catch(function (err) {
      delete PoEditorInsert.canvasDefInflight[defId]
      return Promise.reject(err)
    })
    PoEditorInsert.canvasDefInflight[defId] = p
    return p
  },
  getLocalCanvasList() {
    const items = []
    try {
      const pg = window.editorGlobal && editorGlobal.poPagination
      if (pg && pg.data) {
        const order = (pg.list && pg.list.length) ? pg.list.slice() : Object.keys(pg.data)
        order.forEach(function (k, i) {
          const d = pg.data[k]
          if (!d) return
          items.push({
            canvasId: d.canvasId || k,
            definitionId: d.definitionId || d.id || k,
            title: d.title || d.name || ('画布' + (i + 1))
          })
        })
      }
    } catch (e) { }
    if (items.length) return items
    try {
      const fromInit = (window.editorGlobalConfig && editorGlobalConfig.chartDefIds)
        || window.chartDefIds
        || []
      if (fromInit.length) {
        return fromInit.map(function (item, i) {
          return {
            canvasId: item.canvasId || item.id,
            definitionId: item.definitionId || item.id,
            title: item.title || ('画布' + (i + 1))
          }
        })
      }
    } catch (e2) { }
    return items
  },
  syncCanvasSelectAvailability() {
    const n = (PoEditorInsert.allChartCanvas || []).length
    const $items = $('.canvas_select .canvas_item')
    if (n <= 1 && !PoEditorInsert.comeFromDownloadPart) {
      $items.filter('[data-canvas="all"], [data-canvas="designated"]').addClass('disabled')
    } else {
      $items.filter('[data-canvas="all"], [data-canvas="designated"]').removeClass('disabled')
    }
  },
  getCanvasDefIds(callback) {
    const apply = (list) => {
      PoEditorInsert.allChartCanvas = (list || []).slice()
      PoEditorInsert.renderDesignatedCanvasList(PoEditorInsert.allChartCanvas)
      PoEditorInsert.syncCanvasSelectAvailability()
      if (typeof callback === 'function') callback(PoEditorInsert.allChartCanvas)
    }
    const chartId = (window.chartObj && window.chartObj.chartId) || window.chartId
    const local = PoEditorInsert.getLocalCanvasList()
    if (local.length > 1) {
      apply(local)
      return
    }
    const tryDatabase = () => {
      if (!chartId || typeof FileDatabase === 'undefined') {
        if (local.length) apply(local)
        else apply([])
        return
      }
      FileDatabase.getCanvasList(chartId, function (data) {
        const dbList = (data && data.chartCanvas) ? data.chartCanvas : []
        if (dbList.length) {
          apply(dbList)
        } else if (local.length) {
          apply(local)
        } else {
          apply([])
        }
      })
    }
    const tryRemote = () => {
      if (!chartId) {
        tryDatabase()
        return
      }
      pcUtil.ajax({
        url: '/api/personal/canvas/get/chartdefids',
        data: { chartId: chartId },
        type: 'get',
        success: function (result) {
          if (result.canvas && result.canvas.chartCanvas && result.canvas.chartCanvas.length) {
            apply(result.canvas.chartCanvas)
          } else {
            tryDatabase()
          }
        },
        error: function () {
          tryDatabase()
        }
      })
    }
    if (navigator.onLine && typeof pcUtil !== 'undefined' && (!pcUtil.isOnline || pcUtil.isOnline())) {
      tryRemote()
      return
    }
    tryDatabase()
  },
  apiChartDefGet(chartDefData, title) {
    return new Promise((resolve, reject) => {
      const chartId = chartDefData.chartId || (window.chartObj && window.chartObj.chartId) || window.chartId
      const defId = chartDefData.defId
      const finish = (defResult) => {
        try {
          let chartDefItem = typeof defResult === 'string' ? JSON.parse(defResult) : defResult
          if (window.fileType === 'flow' && title && chartDefItem.page) {
            chartDefItem.page.name = title
            for (var id in chartDefItem.elements) {
              var shape = chartDefItem.elements[id]
              if (shape.name === 'sequenceLifeLine') {
                shape.path = [
                  {
                    actions: [{ action: 'move', x: '0', y: '0' }, { action: 'line', x: 'w', y: '0' }, { action: 'line', x: 'w', y: '30' }, { action: 'line', x: '0', y: '30' }, { action: 'close' }]
                  },
                  {
                    lineStyle: { lineWidth: 2, lineStyle: 'dot' }, fillStyle: { type: 'none' },
                    actions: [{ action: 'move', x: 'w*(1/2)', y: '30' }, { action: 'line', x: 'w*(1/2)', y: 'h' }]
                  },
                  {
                    actions: [{ action: 'move', x: '0', y: '0' }, { action: 'line', x: 'w', y: '0' }, { action: 'line', x: 'w', y: '30' }, { action: 'line', x: '0', y: '30' }, { action: 'close' }], fillStyle: { type: 'none' }, lineStyle: { lineWidth: 0 }
                  }
                ]
              }
            }
          }
          resolve(chartDefItem)
        } catch (e) {
          reject(e)
        }
      }
      const tryLocal = () => {
        if (typeof FileDatabase === 'undefined') {
          reject(new Error('def load failed'))
          return
        }
        FileDatabase.getChartDefById(chartId, defId, (def) => {
          if (def && def.definition) finish(def.definition)
          else reject(new Error('def not found'))
        })
      }
      if (navigator.onLine && typeof pcUtil !== 'undefined') {
        pcUtil.ajax({
          url: '/api/personal/diagraming/get/chart/def',
          data: { chartId: chartId, defId: defId },
          type: 'get',
          success: function (defResult) {
            const raw = defResult && defResult.def != null
              ? defResult.def
              : (defResult && defResult.data && defResult.data.def)
            if (raw != null) finish(raw)
            else tryLocal()
          },
          error: function () {
            tryLocal()
          }
        })
        return
      }
      tryLocal()
    })
  },
  loadCanvasDefs(canvasList) {
    const list = canvasList || []
    if (!list.length) return Promise.resolve([])
    const chartId = (window.chartObj && window.chartObj.chartId) || window.chartId
    return Promise.all(list.map(function (item) {
      if (item.def) return Promise.resolve(item)
      return PoEditorInsert.fetchChartDef(item.definitionId, item.title, chartId).then(function (def) {
        PoEditorInsert.persistCanvasDef(item, def)
        return item
      })
    }))
  },
  renderDesignatedCanvasList(canvasList) {
    var $list = $('.designated_canvas_list')
    $list.empty()
    ;(canvasList || []).forEach(function (item, index) {
      var val = String(item.canvasId || item.definitionId || ('canvas_' + index))
      var inputId = 'wm_designated_' + val.replace(/[^a-zA-Z0-9_-]/g, '_')
      var title = item.title || ('画布' + (index + 1))
      $list.append(
        '<div class="checkbox-item">' +
        '<input type="checkbox" id="' + inputId + '" value="' + val + '">' +
        '<label for="' + inputId + '">' + title + '</label>' +
        '</div>'
      )
    })
  },
  cloneExportSvg(svg) {
    try {
      return JSON.parse(JSON.stringify(svg || {}))
    } catch (e) {
      return Object.assign({}, svg)
    }
  },
  async takeCanvasSvg(config, canvasId, define) {
    const id = canvasId || 'current'
    const pageLayout = PoEditorInsert.pageLayout || 'shape'
    const useCache = !(PoEditorInsert.selectedIds || []).length
    const key = id + '|' + pageLayout
    const cached = useCache ? PoEditorInsert.svgCache[key] : null
    if (cached && cached.svg) {
      return {
        svg: PoEditorInsert.cloneExportSvg(cached.svg),
        bakedPadding: { x: cached.xPadding, y: cached.yPadding }
      }
    }
    const initConfig = Object.assign({}, config)
    initConfig.watermark = { download: '', custom: null }
    if (define) {
      initConfig.define = define
    } else {
      delete initConfig.define
    }
    const svg = await PoEditorClient.exportView.init(initConfig)
    const plain = PoEditorInsert.cloneExportSvg(svg)
    const bakedPadding = {
      x: PoEditorInsert.xPadding,
      y: PoEditorInsert.yPadding
    }
    if (useCache) {
      PoEditorInsert.svgCache[key] = {
        svg: plain,
        xPadding: bakedPadding.x,
        yPadding: bakedPadding.y
      }
      return {
        svg: PoEditorInsert.cloneExportSvg(plain),
        bakedPadding: bakedPadding
      }
    }
    return { svg: plain, bakedPadding: bakedPadding }
  },
  applyPaddingThenWatermark(svg, watermark, textStr, imageStr, bakedPadding) {
    if (window.fileType === 'markdown') return svg
    let next = svg
    const padChanged = !bakedPadding
      || bakedPadding.x !== PoEditorInsert.xPadding
      || bakedPadding.y !== PoEditorInsert.yPadding
    if (padChanged) {
      const padded = PoEditorClient.exportView.setPagePadding(next, PoEditorInsert.xPadding, PoEditorInsert.yPadding)
      if (padded && typeof padded === 'object') {
        next = Object.assign({}, next, padded)
      } else if (typeof padded === 'string') {
        next = Object.assign({}, next, { content: padded })
      }
    }
    if (textStr || imageStr) {
      const result = PoEditorClient.exportView.setWatermark(watermark, next)
      if (result && result.content != null) {
        next = Object.assign({}, next, { content: result.content })
      }
    }
    return next
  },
  async watermarkMarkdownAfterRender() {
    const pending = PoEditorInsert.pendingWatermark
    if (window.fileType !== 'markdown' || !pending) return
    if (!pending.textStr && !pending.imageStr) return
    const $svg = $('.water_image_ontainer .water_svg_card svg').first()
    if (!$svg.length || !$svg[0].getBoundingClientRect().width) return
    try {
      let imgUrl = pending.imageStr
      if (imgUrl) imgUrl = await PoEditorInsert.resolveWatermarkAssetUrl(imgUrl)
      PoEditorClient.exportView.setWatermark({
        download: '',
        custom: {
          text: { content: pending.textStr, color: PoEditorInsert.isWaterTextColor, size: 12, angle: 315 },
          img: { url: imgUrl, angle: 315 },
          w: 200,
          h: 200
        }
      })
      const html = $svg[0].outerHTML || ''
      PoEditorInsert.imageSvgs = (PoEditorInsert.imageSvgs || []).map(function (svg, index) {
        return index === 0 ? Object.assign({}, svg, { content: html }) : svg
      })
      if (PoEditorInsert.imageSvgs[0]) PoEditorInsert.imageSvg = PoEditorInsert.imageSvgs[0]
    } catch (error) {
      console.error('[export] markdown watermark failed', error)
    }
  },
  reinitPreviewKeepWatermark() {
    const ridioVal = $('.w_m_radio_item').index($('input[name="option"]:checked').closest('.w_m_radio_item'))
    if (ridioVal === 0) {
      PoEditorInsert.addWaterMarkNow($('.w_m_system_tip_text').text(), '', 'isInit')
    } else if (ridioVal === 2) {
      PoEditorInsert.addWaterMarkNow($('.w_m_input_custom').val(), PoEditorInsert.getWaterImageSvg(), 'isInit', 85, 54)
    } else {
      PoEditorInsert.addWaterMarkNow('', '', 'isInit')
    }
  },
  upDownLeftRightPadding() {
    PoEditorInsert.imageSvgs = (PoEditorInsert.imageSvgs || []).map(function (svg) {
      const padded = PoEditorClient.exportView.setPagePadding(svg, PoEditorInsert.xPadding, PoEditorInsert.yPadding)
      if (padded && typeof padded === 'object') return Object.assign({}, svg, padded)
      if (typeof padded === 'string') return Object.assign({}, svg, { content: padded })
      return svg
    })
    PoEditorInsert.renderImageSvgsPreview()
    if (PoEditorInsert.imageSvgs[0]) PoEditorInsert.imageSvg = PoEditorInsert.imageSvgs[0]
  },
  bindWaterMarkExportRegion($wm) {
    const $root = $wm && $wm.length ? $wm : $('.water_mark_bg').first()
    $root.find('.w_m_radio_canvas_item .radio-single[name="option_canvas"]').eq(0).prop('checked', true)
    $root.find('.w_m_radio_canvas_item').off('click.wmExpRegion').on('click.wmExpRegion', function () {
      var $radio = $(this).find('.radio-single[name="option_canvas"]')
      if (!$radio.prop('checked')) {
        $radio.prop('checked', true).trigger('change')
      }
    })
    $root.find('.w_m_radio_canvas_item .radio-single[name="option_canvas"]').off('change.wmExpRegion').on('change.wmExpRegion', function () {
      const val = $(this).val()
      if (val === 'option_canvas_1') {
        PoEditorInsert.pageLayout = 'shape'
        $('.wm_margin_set_up_title').show()
        $('.w_m_margin_set_up').show()
      } else if (val === 'option_canvas_2') {
        PoEditorInsert.pageLayout = 'canvas'
        $('.wm_margin_set_up_title').hide()
        $('.w_m_margin_set_up').hide()
      }
      PoEditorInsert.reinitPreviewKeepWatermark()
    })
    $root.find('.w_m_margin_up').off('click.wmExpMargin').on('click.wmExpMargin', function () {
      let type = $(this).data('type')
      let $input = null
      if (type === 'updown_up') {
        $input = $(this).closest('.w_m_margin_input_wrap').find('.w_m_input_up_down')
      } else if (type === 'leftright_up') {
        $input = $(this).closest('.w_m_margin_input_wrap').find('.w_m_input_left_right')
      }
      var val = parseInt($input.val(), 10) || 0
      var max = parseInt($input.attr('max'), 10)
      if (isNaN(max)) max = 100
      val += 1
      if (val > max) {
        val = max
        new Toast({ type: 'error', msg: '页边距最大设置100' })
      }
      $input.val(val)
      $input.trigger('change')
    })
    $root.find('.w_m_margin_down').off('click.wmExpMargin').on('click.wmExpMargin', function () {
      let type = $(this).data('type')
      let $input = null
      if (type === 'updown_down') {
        $input = $(this).closest('.w_m_margin_input_wrap').find('.w_m_input_up_down')
      } else if (type === 'leftright_down') {
        $input = $(this).closest('.w_m_margin_input_wrap').find('.w_m_input_left_right')
      }
      var val = parseInt($input.val(), 10) || 0
      var min = parseInt($input.attr('min'), 10) || 0
      val -= 1
      if (val < min) {
        val = min
        new Toast({ type: 'error', msg: '页边距最小设置0' })
      }
      $input.val(val)
      $input.trigger('change')
    })
    $root.find('.w_m_input_up_down').off('change.wmExpMargin').on('change.wmExpMargin', function (e) {
      e.stopPropagation()
      var $this = $(this)
      var val = parseInt($this.val(), 10) || 0
      var min = parseInt($this.attr('min'), 10) || 0
      var max = parseInt($this.attr('max'), 10)
      if (isNaN(max)) max = 100
      if (val < min) {
        val = min
        new Toast({ type: 'error', msg: '页边距最小设置0' })
      }
      if (val > max) {
        val = max
        new Toast({ type: 'error', msg: '页边距最大设置100' })
      }
      PoEditorInsert.yPadding = val
      $this.val(val)
      PoEditorInsert.upDownLeftRightPadding()
    })
    $root.find('.w_m_input_left_right').off('change.wmExpMargin').on('change.wmExpMargin', function (e) {
      e.stopPropagation()
      var $this = $(this)
      var val = parseInt($this.val(), 10) || 0
      var min = parseInt($this.attr('min'), 10) || 0
      var max = parseInt($this.attr('max'), 10)
      if (isNaN(max)) max = 100
      if (val < min) {
        val = min
        new Toast({ type: 'error', msg: '页边距最小设置0' })
      }
      if (val > max) {
        val = max
        new Toast({ type: 'error', msg: '页边距最大设置100' })
      }
      PoEditorInsert.xPadding = val
      $this.val(val)
      PoEditorInsert.upDownLeftRightPadding()
    })
  },
  bindWaterMarkCanvasSelect($wm) {
    const $root = $wm && $wm.length ? $wm : $('.water_mark_bg').first()
    const resetDesignated = function () {
      $('.designated_canvas_list input[type="checkbox"]').prop('checked', false)
      $('.canvas_item .icons_arrow_canvas').removeClass('icons_arrow_up')
    }
    const setCanvasItemActive = function (canvas) {
      $('.canvas_select .canvas_item').removeClass('active')
      if (canvas) {
        $('.canvas_select .canvas_item[data-canvas="' + canvas + '"]').addClass('active')
      }
    }
    $root.find('.water_mark_current_canvas').off('click.wmExpCanvas').on('click.wmExpCanvas', function (e) {
      e.stopPropagation()
      let $canvasSelect = $('.water_mark_current_canvas .canvas_select')
      const toggleSelect = function () {
        $canvasSelect.css('display', $canvasSelect.css('display') === 'none' ? 'flex' : 'none')
      }
      if (!(PoEditorInsert.allChartCanvas || []).length || !$('.designated_canvas_list .checkbox-item').length) {
        PoEditorInsert.getCanvasDefIds(toggleSelect)
      } else {
        toggleSelect()
      }
    })
    $root.find('.canvas_select .canvas_item').off('click.wmExpCanvasItem').on('click.wmExpCanvasItem', function (e) {
      e.stopPropagation()
      if ($(this).hasClass('disabled')) return
      let canvas = $(this).data('canvas')
      let $canvasSelect = $('.water_mark_current_canvas .canvas_select')
      if (canvas === 'current') {
        $('.designated_canvas_list').css('display', 'none')
        resetDesignated()
        setCanvasItemActive('current')
        $('.water_mark_current_canvas .current_text').text('当前画布')
        $canvasSelect.css('display', 'none')
        PoEditorInsert.selectedIds = []
        PoEditorInsert.currentCanvasList = []
        PoEditorInsert.reinitPreviewKeepWatermark()
        PoEditorInsert.syncCopyImageButton()
      } else if (canvas === 'all') {
        $('.designated_canvas_list').css('display', 'none')
        resetDesignated()
        setCanvasItemActive('all')
        $('.water_mark_current_canvas .current_text').text('全部画布')
        $canvasSelect.css('display', 'none')
        PoEditorInsert.selectedIds = []
        if ((PoEditorInsert.allChartCanvas || []).length) {
          PoEditorInsert.currentCanvasList = PoEditorInsert.allChartCanvas.slice()
        }
        $('.water_loading_board').show()
        PoEditorInsert.syncCopyImageButton()
        const applyAll = function (list) {
          PoEditorInsert.loadCanvasDefs(list || []).then(function (loaded) {
            PoEditorInsert.currentCanvasList = loaded.slice()
            PoEditorInsert.reinitPreviewKeepWatermark()
          }).catch(function () {
            $('.water_loading_board').hide()
            new Toast({ type: 'error', msg: '画布数据加载失败，请重试' })
          })
        }
        if ((PoEditorInsert.allChartCanvas || []).length) {
          applyAll(PoEditorInsert.allChartCanvas)
        } else {
          PoEditorInsert.getCanvasDefIds(applyAll)
        }
      } else if (canvas === 'designated') {
        const openDesignatedPanel = function () {
          if (!(PoEditorInsert.allChartCanvas || []).length) {
            new Toast({ type: 'warning', msg: '暂无画布列表' })
            return
          }
          let designatedCanvasListDom = $('.designated_canvas_list')
          let canvansArrow = $('.designated_canvas .icons_arrow_canvas')
          setCanvasItemActive('designated')
          PoEditorInsert.syncCopyImageButton()
          $('.water_mark_current_canvas .current_text').text('指定的画布')
          if (designatedCanvasListDom.css('display') === 'none') {
            designatedCanvasListDom.css('display', 'flex')
            canvansArrow.addClass('icons_arrow_up')
          } else {
            designatedCanvasListDom.css('display', 'none')
            canvansArrow.removeClass('icons_arrow_up')
          }
        }
        if (!(PoEditorInsert.allChartCanvas || []).length || !$('.designated_canvas_list .checkbox-item').length) {
          PoEditorInsert.getCanvasDefIds(openDesignatedPanel)
        } else {
          openDesignatedPanel()
        }
      } else if (canvas === 'selected-part') {
        const ids = (PoEditorClient.getSelectedIds && PoEditorClient.getSelectedIds()) || []
        if (!ids.length) {
          new Toast({ type: 'warning', msg: '请先选中图形' })
          return
        }
        $('.designated_canvas_list').css('display', 'none')
        resetDesignated()
        setCanvasItemActive('selected-part')
        PoEditorInsert.comeFromDownloadPart = true
        $('.water_mark_current_canvas .current_text').text('当前选中图形')
        $canvasSelect.css('display', 'none')
        const prevIds = PoEditorInsert.selectedIds || []
        const sameIds = ids.length === prevIds.length && ids.every(function (id, i) {
          return id === prevIds[i]
        })
        const needReload = !sameIds || (PoEditorInsert.currentCanvasList || []).length > 0
        PoEditorInsert.selectedIds = ids.slice()
        PoEditorInsert.currentCanvasList = []
        if (needReload) PoEditorInsert.reinitPreviewKeepWatermark()
        PoEditorInsert.syncCopyImageButton()
      }
    })
    const $canvasItems = $root.find('.canvas_select .canvas_item')
    const selectedIdsNow = (PoEditorClient.getSelectedIds && PoEditorClient.getSelectedIds()) || []
    PoEditorInsert.syncCanvasSelectAvailability()
    if (selectedIdsNow.length) {
      $canvasItems.filter('[data-canvas="selected-part"]').removeClass('disabled')
    } else {
      $canvasItems.filter('[data-canvas="selected-part"]').addClass('disabled')
    }
    if (PoEditorInsert.comeFromDownloadPart && selectedIdsNow.length) {
      $canvasItems.filter('[data-canvas="selected-part"]').trigger('click')
    }
    $root.find('.designated_canvas_list').off('click.wmExpDesignatedStop').on('click.wmExpDesignatedStop', function (e) {
      e.stopPropagation()
    })
    $root.off('click.wmExpCanvasBg').on('click.wmExpCanvasBg', function (e) {
      if (!$(e.target).closest('.water_mark_current_canvas').length) {
        $('.water_mark_current_canvas .canvas_select').css('display', 'none')
      }
    })
    $root.find('.designated_canvas_list').off('change.wmExpDesignated', 'input[type="checkbox"]').on('change.wmExpDesignated', 'input[type="checkbox"]', function (e) {
      e.stopPropagation()
      if (PoEditorInsert.designatedCanvasLoading) return
      var result = []
      $root.find('.designated_canvas_list input[type="checkbox"]:checked').each(function () {
        result.push($(this).val())
      })
      let chartCanvas = (PoEditorInsert.allChartCanvas || []).filter(function (item, index) {
        const id = String(item.canvasId || item.definitionId || ('canvas_' + index))
        return result.includes(id)
      })
      if (!chartCanvas.length) {
        PoEditorInsert.selectedIds = []
        PoEditorInsert.currentCanvasList = []
        $('.water_mark_current_canvas .current_text').text('指定的画布')
        setCanvasItemActive('designated')
        PoEditorInsert.reinitPreviewKeepWatermark()
        return
      }
      $('.water_mark_current_canvas .current_text').text('指定的画布')
      setCanvasItemActive('designated')
      PoEditorInsert.selectedIds = []
      $('.water_loading_board').show()
      PoEditorInsert.designatedCanvasLoading = true
      PoEditorInsert.loadCanvasDefs(chartCanvas).then(function (loaded) {
        PoEditorInsert.currentCanvasList = loaded.slice()
        PoEditorInsert.reinitPreviewKeepWatermark()
      }).catch(function () {
        $('.water_loading_board').hide()
        new Toast({ type: 'error', msg: '画布数据加载失败，请重试' })
      }).finally(function () {
        PoEditorInsert.designatedCanvasLoading = false
      })
    })
  },
  getImageParamsList(scale = 1) {
    const outScale = (PoEditorInsert.imageSufix === 'pnghd' || PoEditorInsert.imageSufix === 'jpghd') ? 2 : scale
    return (PoEditorInsert.imageSvgs || []).map(function (svg, index) {
      const paddingX = svg.paddingX || 0
      const paddingY = svg.paddingY || 0
      return {
        content: (svg.content || '').replace(/url\(#pattern_mark\)/g, 'transparent'),
        w: (parseFloat(svg.w) || 0) + (paddingX || 0) * 2,
        h: (parseFloat(svg.h) || 0) + (paddingY || 0) * 2,
        scale: outScale,
        title: svg.title || ('page_' + (index + 1))
      }
    })
  },
  getImageParams(scale = 1) {
    const list = PoEditorInsert.getImageParamsList(scale)
    return list[0] || null
  },
  async exportImagesAsZip(paramsList, title) {
    if (!window.JSZip1 || !paramsList || !paramsList.length) return null
    const zip = new window.JSZip1()
    const safeTitle = (title || 'export').replace(/[\\/:*?"<>|]/g, '_')
    const folder = zip.folder(safeTitle)
    const exportSufix = PoEditorInsert.imageSufix || 'png'
    const fileExt = PoEditorInsert.imageType(exportSufix.replace(/hd$/i, ''))
    for (let i = 0; i < paramsList.length; i++) {
      const p = paramsList[i]
      const res = await PoEditorClient.exportView.svgToImage(
        { content: p.content, w: p.w, h: p.h },
        p.scale || 1,
        exportSufix
      )
      if (res.status === 'success' && res.img) {
        const base64 = res.img.split(',')[1]
        const name = (p.title || ('page_' + (i + 1))).replace(/[\\/:*?"<>|]/g, '_')
        folder.file(name + '.' + fileExt, base64, { base64: true })
      }
    }
    return zip.generateAsync({ type: 'blob' })
  },
  getPreviewLayoutSize() {
    const n = (PoEditorInsert.imageSvgs || []).length
      || $('.water_image_ontainer .water_svg_card').length
      || 0
    const card = PoEditorInsert.previewCardSize || 340
    const gap = PoEditorInsert.previewCardGap || 16
    if (!n) return { w: 0, h: 0 }
    return {
      w: card,
      h: n * card + Math.max(0, n - 1) * gap
    }
  },
  getMultiSvgSize() {
    const list = PoEditorInsert.imageSvgs || []
    let maxW = 0
    let totalH = 0
    if (!list.length) return { w: 0, h: 0 }
    list.forEach(function (svg) {
      const w = Math.floor((parseFloat(svg.w) || 0) + (parseFloat(svg.paddingX) || 0) * 2)
      const h = Math.floor((parseFloat(svg.h) || 0) + (parseFloat(svg.paddingY) || 0) * 2)
      maxW = Math.max(maxW, w)
      totalH += h
    })
    return { w: maxW, h: totalH }
  },
  centerPreviewInPerview() {
    const $perview = $('.water_perview')
    const $box = $('.water_image_ontainer')
    if (!$perview.length || !$box.length) return
    const n = (PoEditorInsert.imageSvgs || []).length
      || $box.find('.water_svg_card').length
      || 0
    const isSingle = n <= 1
    const size = PoEditorInsert.getPreviewLayoutSize()
    const pw = $perview.width()
    const ph = $perview.height()
    const left = Math.round((pw - (size.w || 0)) / 2)
    const top = isSingle
      ? Math.round((ph - (size.h || 0)) / 2)
      : (PoEditorInsert.previewTopOffset || 16)
    $perview
      .toggleClass('is-single-preview', isSingle)
      .toggleClass('is-multi-preview', !isSingle)
    $box.css({
      position: 'absolute',
      left: left,
      top: top,
      transformOrigin: isSingle ? 'center center' : 'center top'
    })
  },
  fitPreviewSvgCards() {
    const CARD = PoEditorInsert.previewCardSize || 340
    const pad = PoEditorInsert.previewCardPadding || 12
    const inner = Math.max(1, CARD - pad * 2)
    const list = PoEditorInsert.imageSvgs || []
    $('.water_image_ontainer .water_svg_card').each(function (i) {
      const $stage = $(this).children('.water_svg_stage')
      const $svg = $stage.find('> svg').first()
      if (!$svg.length) return
      const meta = list[i] || {}
      let w = meta.w || parseFloat($svg.attr('width')) || $svg.width() || 1
      let h = meta.h || parseFloat($svg.attr('height')) || $svg.height() || 1
      w = parseFloat(w) || 1
      h = parseFloat(h) || 1
      w += (meta.paddingX || 0) * 2
      h += (meta.paddingY || 0) * 2
      const s = Math.min(inner / w, inner / h)
      const displayW = Math.max(1, w * s)
      const displayH = Math.max(1, h * s)
      $stage.css({ width: displayW, height: displayH })
      $svg.css({
        position: 'absolute',
        top: 0,
        left: 0,
        width: w,
        height: h,
        transform: 'scale(' + s + ')',
        transformOrigin: 'top left',
        margin: 0,
        background: 'transparent'
      })
    })
  },
  syncImageContainerSize() {
    const size = PoEditorInsert.getPreviewLayoutSize()
    $('.water_image_ontainer').css({
      width: size.w || 'auto',
      height: size.h || 'auto'
    })
    return size
  },
  getTransparentStageClass() {
    const type = PoEditorInsert.imageType(PoEditorInsert.imageSufix || '')
    if (type === 'png') return 'water_svg_stage is-mosaic-bg'
    if (type === 'jpg' || type === 'svg' || type === 'pdf') return 'water_svg_stage is-white-bg'
    return 'water_svg_stage'
  },
  renderImageSvgsPreview() {
    const html = (PoEditorInsert.imageSvgs || []).map(function (svg) {
      const content = (svg.content || '').replace(/pattern_mark/g, '')
      const isTransparent = String(svg.bg || '').toLowerCase() === 'transparent'
      const stageClass = isTransparent
        ? PoEditorInsert.getTransparentStageClass()
        : 'water_svg_stage'
      return '<div class="water_svg_card"><div class="' + stageClass + '">' + content + '</div></div>'
    }).join('')
    $('.water_image_ontainer').html(html)
    PoEditorInsert.fitPreviewSvgCards()
    PoEditorInsert.syncImageContainerSize()
    PoEditorInsert.centerPreviewInPerview()
    PoEditorInsert.syncCopyImageButton()
    PoEditorInsert.syncPdfSplitButton()
  },
  refreshPreviewFromImageSvg() {
    if (!PoEditorInsert.imageSvg) return
    PoEditorInsert.imageSvgs = [{
      content: PoEditorInsert.imageSvg.content,
      w: PoEditorInsert.imageSvg.w,
      h: PoEditorInsert.imageSvg.h,
      bg: PoEditorInsert.imageSvg.bg || ''
    }]
    PoEditorInsert.renderImageSvgsPreview()
    PoEditorInsert.scale = 1
    PoEditorInsert.resizeSvg($('.water_perview'))
  },
  //设置显示宽高高清*2
  showImageWH(num) {
    const size = PoEditorInsert.getMultiSvgSize()
    $('.water_m_image_w').text((size.w || 0) * num)
    $('.water_m_image_h').text((size.h || 0) * num)
  },
  async addWaterMarkNow(textStr, imageStr, isSystem, wmImageW, wmImageH) {
    textStr = textStr == null ? '' : String(textStr)
    imageStr = imageStr == null ? '' : String(imageStr)
    if (!textStr.trim()) textStr = ''
    if (!imageStr.trim()) imageStr = ''
    if (!textStr && !imageStr) isSystem = 'isInit'
    let config = {
      ids: PoEditorInsert.selectedIds,
      fileType: window.fileType.indexOf('flow') > -1 ? 'flow' : 'mind',
      watermark: {
        download: '',
        custom: {
          text: {
            content: textStr,
            color: PoEditorInsert.isWaterTextColor,
            size: 12,
            angle: 315,
          },
          img: {
            url: imageStr,
            w: wmImageW,
            h: wmImageH,
            angle: 315,
          },
          w: 200,
          h: 200,
        }
      },
      pageLayout: PoEditorInsert.pageLayout || 'shape',
      pagePaddingX: PoEditorInsert.xPadding,
      pagePaddingY: PoEditorInsert.yPadding,
    }
    if (imageStr) {
      imageStr = await PoEditorInsert.resolveWatermarkAssetUrl(imageStr)
      config.watermark.custom.img.url = imageStr
    }
    if (window.fileType === 'markdown') {
      PoEditorInsert.pendingWatermark = { textStr: textStr, imageStr: imageStr }
      if ((PoEditorInsert.imageSvgs || []).length) {
        PoEditorInsert.renderImageSvgsPreview()
        PoEditorInsert.watermarkMarkdownAfterRender()
        return
      }
      isSystem = 'isInit'
    }
    const $wm = $('.water_mark_bg').first()
    if (isSystem == 'isInit') {
      const list = PoEditorInsert.currentCanvasList || []
      const editorDefinitionId = (window.editorGlobal && editorGlobal.poPagination && editorGlobal.poPagination.pageId)
        || localStorage.getItem('currentCanvasId')
        || ''
      const ordered = []
      if (list.length == 0) {
        const canvasId = editorDefinitionId || 'current'
        const taken = await PoEditorInsert.takeCanvasSvg(config, canvasId, null)
        ordered.push({
          svg: Object.assign({}, taken.svg, {
            title: (PoEditorInsert.chartObj && PoEditorInsert.chartObj.title) || '当前画布',
            canvasId: canvasId
          }),
          bakedPadding: taken.bakedPadding
        })
      } else {
        for (const item of list) {
          const isEditorCanvas = !!(editorDefinitionId && (item.definitionId === editorDefinitionId || item.canvasId === editorDefinitionId))
          if (isEditorCanvas) {
            const pageLayout = PoEditorInsert.pageLayout || 'shape'
            delete PoEditorInsert.svgCache[item.canvasId + '|' + pageLayout]
            if (item.definitionId) delete PoEditorInsert.svgCache[item.definitionId + '|' + pageLayout]
          }
          const taken = await PoEditorInsert.takeCanvasSvg(
            config,
            item.canvasId,
            isEditorCanvas ? null : (item.def || null)
          )
          ordered.push({
            svg: Object.assign({}, taken.svg, {
              title: item.title || item.canvasId || ('page_' + (ordered.length + 1)),
              canvasId: item.canvasId
            }),
            bakedPadding: taken.bakedPadding
          })
        }
      }
      PoEditorInsert.imageSvgs = ordered.map(function (item) {
        return PoEditorInsert.applyPaddingThenWatermark(
          item.svg,
          config.watermark,
          textStr,
          imageStr,
          item.bakedPadding
        )
      })
      PoEditorInsert.renderImageSvgsPreview()
    } else if (isSystem == 'isSystem') {
      PoEditorInsert.imageSvgs = (PoEditorInsert.imageSvgs || []).map(function (svg) {
        const result = PoEditorClient.exportView.setWatermark(config.watermark, svg)
        return Object.assign({}, svg, { content: result.content })
      })
      PoEditorInsert.renderImageSvgsPreview()
    } else {
      PoEditorInsert.imageSvgs = (PoEditorInsert.imageSvgs || []).map(function (svg) {
        const result = PoEditorClient.exportView.setWatermark(config.watermark, svg)
        return Object.assign({}, svg, { content: result.content })
      })
      PoEditorInsert.renderImageSvgsPreview()
    }
    if (PoEditorInsert.imageSvgs && PoEditorInsert.imageSvgs[0]) {
      PoEditorInsert.imageSvg = PoEditorInsert.imageSvgs[0]
    }
    $wm.find('.water_loading_board').hide()
    if (PoEditorInsert.imageSufix == 'png' || PoEditorInsert.imageSufix == 'jpg' || PoEditorInsert.imageSufix == 'pnghd' || PoEditorInsert.imageSufix == 'jpghd') {
      PoEditorInsert.showImageWH(PoEditorInsert.isVipImageType ? 2 : 1)
    } else {
      PoEditorInsert.showImageWH(2)
    }
    PoEditorInsert.resizeSvg($('.water_perview'))
    PoEditorInsert.scale = 1
    PoEditorInsert.zoomAll()
    PoEditorInsert.centerPreviewInPerview()
    PoEditorInsert.watermarkMarkdownAfterRender()
  },
  //获取水印颜色
  getWaterMarkBgColor(bgColor) {
    if (bgColor.indexOf("rgba") > -1 || bgColor.indexOf("rgb") > -1) {

    } else if (bgColor.indexOf("#") > -1) {
      bgColor = PoEditorInsert.hexToRgba(bgColor)
    } else if (bgColor.indexOf("#") == -1) {
      //透明色
      if (bgColor == 'transparent') {
        bgColor = "rgba(255, 255, 255, 0)";
      } else {
        //纯数字颜色
        var color = bgColor.split(",");
        if (color[3]) {
          bgColor = "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + color[3] + ")";
        } else {
          bgColor = "rgba(" + color[0] + "," + color[1] + "," + color[2] + ")";
        }
      }
    }
    const rgbRegex = /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i;
    // 使用正则表达式匹配颜色值
    const match = bgColor.match(rgbRegex);
    if (match) {
      var newColorDict = {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] ? parseFloat(match[4]) : 1 // 如果有透明度值，则转换为浮点数，否则默认为1
      };
      const brightness = newColorDict.r * 0.299 + newColorDict.g * 0.587 + newColorDict.b * 0.114;
      // 判断颜色是浅色还是深色
      if (brightness >= 192 || brightness == 0) {
        // 浅色背景，使用半透明黑色水印
        return 'shallow'//{ r: 0, g: 0, b: 0, a: 0.1 };
      } else {
        // 深色背景，使用半透明白色水印
        return 'deep'//{ r: 255, g: 255, b: 255, a: 0.2 };
      }
    }
  },
  resizeSvg(div) {
    var $div = div && div.jquery ? div : $('.water_perview')
    PoEditorInsert.fitPreviewSvgCards()
    var size = PoEditorInsert.syncImageContainerSize()
    var divW = $div.width()
    var divH = $div.height()
    if (!size.w || !size.h || !divW || !divH) {
      return
    }
    var scale = Math.min(divW / size.w, divH / size.h)
    const cardCount = (PoEditorInsert.imageSvgs || []).length
      || $('.water_image_ontainer .water_svg_card').length
      || 0
    if (cardCount > 1) {
      const offset = (PoEditorInsert.previewTopOffset || 16) * 2
      const usableH = Math.max(1, divH - offset)
      scale = Math.min(divW / size.w, usableH / size.h)
    }
    PoEditorInsert.scale = scale
    $('.water_image_ontainer').css({
      transform: 'scale(' + scale + ')'
    })
    PoEditorInsert.centerPreviewInPerview()
  },
  zoom() {
    $('.water_image_ontainer').css('transform', `scale(${PoEditorInsert.scale})`)
    PoEditorInsert.syncImageContainerSize()
  },
  zoomAll() {
    const size = PoEditorInsert.syncImageContainerSize()
    $('.water_image_ontainer').css('transform', `scale(${PoEditorInsert.scale})`)
    if (size.w) {
      $('.water_image_ontainer').css('width', size.w)
      $('.water_image_ontainer').css('height', size.h)
    }
    PoEditorInsert.centerPreviewInPerview()
  },
  //返回水印图
  getWaterImageSvg() {
    var waterImageUrl = ''
    if (!PoEditorInsert.isWaterImageDeep) {
      waterImageUrl = $(".w_m_type_item_active").find('.w_m_type_item_image').attr("data-src")
    } else {
      waterImageUrl = $(".w_m_type_item_active").find('.w_m_type_item_image').attr("data-src-sh")
    }
    return waterImageUrl
  },
  //#转成rgba
  hexToRgba(hex) {
    if (hex === 'transparent') return 'rgba(0, 0, 0, 0)';

    // 3 digits 形式转换成 6 位数形式
    if (hex.length === 4) {
      let extendedHex = '#';
      for (let i = 1; i < hex.length; i++) {
        extendedHex += hex.charAt(i) + hex.charAt(i);
      }
      hex = extendedHex;
    }

    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const a = hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1;

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  },
  stringToSvg(str) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'image/svg+xml');
    const svgElement = doc.documentElement;
    return svgElement;
  },
  triggerDownload(imgURI, fileName) {
    var evt = new MouseEvent("click", {
      view: window,
      bubbles: false,
      cancelable: true
    });
    var a = document.createElement("a");
    a.setAttribute("download", fileName);
    a.setAttribute("href", imgURI);
    a.setAttribute("target", '_blank');
    a.dispatchEvent(evt);
  },
}
// toast弹框
window.toast_ = {
  onLine: function () {
    new Toast({ type: "success", msg: "网络已恢复连接" })
    localStorage.setItem('isshowOffLineToast', '')
  },
  offLine: function () {
    new Toast({ type: "warning", msg: "无法连接到服务器，请检查您的网络设置" })

  },
  testOnline: function () {
    if (!pcUtil.isOnline()) {
      this.noUse();
      $('#po-loading').remove();
    }
  },
  noUse: function () {
    new Toast({ type: "warning", msg: "无法连接到服务器，请检查您的网络设置" })
  },
  noYun: function () {
    confirmIn({
      onlyConfrim: true,
      okval: '立即上传',
      title: "文件上云",
      content: "请先将当前文件上传至我的云文件后重试",
      onConfirm: () => {
        if (window.new) {
          // document.addEventListener('keydown', removeKeyTab, true);
          save()
        }
        else {
          // document.addEventListener('keydown', removeKeyTab, true);
          ipc.sendToHost('showDlgSaveWebView',
            { id: TABGROUPID, savepath: window.saveName, suffix: window.fileType == 'flow' ? 'posf' : window.fileType == 'outline' ? 'poso' : 'posm', islocal: false }
          )
        }
      }
    })
    // new Toast({ type: "warning", msg: "请上传至云文件后重试" })
  },
  noSave: function () {
    new Toast({ type: "warning", msg: "请保存文件后重试" })
  },
  uploadError: function () {
    window.new = true
    ipc.sendToHost('hideSaving')
    const id = importClass.newId()
    const id1 = importClass.newId()
    const tot = new Toast({ type: "error", msg: `文件上云失败,请<span id='${id}' style='color:#067bef;cursor:pointer;padding:0px 5px;position:relative;top:-2px'>重试</span><!--<span id='${id1}' class="icons_web" style='cursor:pointer;'>&#xe6b9;</span>-->`, autoClose: false })
    $('#' + id).off().on('click', () => {
      tot.closeAll()
      if (window.fileType == 'mind') {
        const title = $('#topic-root .po-richtext-node-wrap').text().trim();
        window.saveName = title == '' ? '未命名文件' : title
      }
      const obj = { path: window.saveName, dir: { ir: 'root' } }
      uploadOnline(obj)
    })
    $('#' + id1).off().on('click', () => {
      tot.close()
    })
  },
  uploadSuccess: function () {
    ipc.sendToHost('hideSaving')
    new Toast({ type: "success", msg: "文件上云成功" })
  },
  saveSuccess: function () {
    new Toast({ type: 'success', msg: '保存成功' })
  },
  saveError: function () {
    new Toast({ type: 'error', msg: '保存失败' })
  }
}
// 思维导图演示模式导出
window.demoSave = {
  pdf(doc, title) {
    const result = doc.output('datauristring').replace('data:application/pdf;filename=generated.pdf;base64,', '')
    const saveData = {
      type: 'save', data: result, path: title, suffix: 'pdf',
    }
    ipc1.sendSync('saveFileB64', saveData).then((res) => {
      if (res != '') {
        new Toast({ type: 'success', msg: '保存成功' })
      }
    })
  },
  png(zip, title) {
    zip.generateAsync({ type: 'base64' }).then((content) => {
      const saveData = {
        type: 'save', data: content, path: title, suffix: 'zip',
      }
      ipc1.sendSync('saveFileB64', saveData).then((res) => {
        if (res != '') {
          new Toast({ type: 'success', msg: '保存成功' })
        }
      })
    })
  }
}
window.cefQuery = {}
// 页面关闭触发保存提示事件
window.cefQuery.saveDef = () => {
  if (!window.isMyFile) {
    ipc1.sendSync('loadFileB64', { type: 'cache', path: 'history/cache.json' }).then((resHis) => {
      if (!resHis) resHis = '[]'
      let history = JSON.parse(resHis);
      handleCrash({ history, id: window.chartId, type: "remove" }).then(() => {
        ipc.sendToHost('closeTab')
        ipc.sendToHost('myFileClose', window.TABGROUPID)
      })
    })

  }
  else {
    // 判断是否需要更新
    if (window.defVersion.length != 0) {
      if (window.defVersion.filter((d) => d.isSave == false).length > 0) {
        confirmIn({
          okval: '保存',
          onlyConfrim: false,
          title: "提示",
          content: "关闭前是否保存?",
          onConfirm: function (e) {
            const isAllClose = sessionStorage.getItem('isAllClose')
            save(true)

          },
          onNotSave: function () {
            //选择了不保存 就代表不需要保存，应去掉崩溃缓存
            ipc1.sendSync('loadFileB64', { type: 'cache', path: 'history/cache.json' }).then((resHis) => {
              if (!resHis) resHis = '[]'
              let history = JSON.parse(resHis);
              handleCrash({ history, id: window.chartId, type: "remove" }).then(() => {
                ipc.sendToHost('myFileClose', window.TABGROUPID)
              })
            })
          },
          onCancel: function () {
            ipc.sendToHost('myFileCloseCancel', window.TABGROUPID)
            // ipc.sendToHost('myFileClose', window.TABGROUPID)
          },
          onClose: function () {
            ipc.sendToHost('myFileCloseCancel', window.TABGROUPID)
          }
        })
      }
      else {
        ipc1.sendSync('loadFileB64', { type: 'cache', path: 'history/cache.json' }).then((resHis) => {
          if (!resHis) resHis = '[]'
          let history = JSON.parse(resHis);
          handleCrash({ history, id: window.chartId, type: "remove" }).then(() => {
            ipc.sendToHost('myFileClose', window.TABGROUPID)
          })
        })
      }
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'history/cache.json' }).then((resHis) => {
        if (!resHis) resHis = '[]'
        let history = JSON.parse(resHis);
        handleCrash({ history, id: window.chartId, type: "remove" }).then(() => {
          ipc.sendToHost('myFileClose', window.TABGROUPID)
        })
      })
      // confirmIn({
      //   title: "提示",
      //   content: "关闭前是否保存?",
      //   onConfirm: function (e) {
      //     save(true)
      //   },
      //   onCancel: function () {
      //   },
      //   onClose: function () {
      //     ipc.sendToHost('myFileCloseCancel', window.TABGROUPID)
      //   }
      // })
    }
  }
}
// 打印
window.cefQuery.print = () => {
  const iframe = document.getElementById('printIframe') || document.querySelector('iframe[title="mindmap-print"]')
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.print()
  }
}
// 是否会员
window.isMember = function () {
  if (window.memberObj.member == false) {
    return false
  }
  else {
    return true
  }
}
// 保存方法
window.save = (isClose = false) => {
  ipc1.sendSync('loadFileB64', { type: 'cache', path: 'history/cache.json' }).then((resHis) => {
    if (!resHis) resHis = '[]'
    let history = JSON.parse(resHis);
    handleCrash({ history, id: window.chartId, type: "remove" });
  })
  if (window.new
    || (!window.new && window.filepath == '' && chartObj.chartId.length < 13)
  ) {
    isClose && sessionStorage.setItem('isClose', 1)
    if (window.fileType == 'mind') {
      const title = $('#topic-root .po-richtext-node-wrap').text().trim();
      window.saveName = title == '' ? '未命名文件' : title
    }
    ipc.sendToHost('showDlgSaveWebView',
      { id: TABGROUPID, savepath: window.saveName, suffix: window.fileType == 'flow' ? 'posf' : window.fileType == 'outline' ? 'poso' : window.fileType == 'markdown' ? 'md' : 'posm' }
    )
  }
  else {

    if (!window.filepath.endsWith('.bak') && window.isMyFile) {
      // 触发保存逻辑
      new Toast({ type: "main", msg: "保存中" });
      let type = window.fileType == 'markdown' ? 'markdown' : 'pos_all'
      window.editorGlobalConfig.onBeforeExport({
        type, call: () => {
          isClose && ipc.sendToHost('myFileClose', window.TABGROUPID)
        }, isSave: true
      })
    }
  }
}

//反馈
setTimeout(() => {
  if (window.editorGlobal && window.editorGlobal.insert) {
    window.editorGlobal.insert.feedback.init = function (params) {
      window.PoEditorInsert.iframeDlg({
        height: "471px",
        title: "感谢您的反馈",
        type: "dlgFeedback",
        width: "600px"
      })
    }
  }
}, 3000);
// 编辑器服务化api 初始化
document.ready = function () {
  if (window.PoEditorApi) {
    window.PoEditorClient = new PoEditorApi()
  }
}
if (window.fileType == 'mind') {
  window.mindEditor1 = new window.mindEditor(window.editorGlobalConfig);
  mindEditor1.bulid({ el: document.querySelector('#mind_con') })
}
if (window.isMyFile) {
  window.editorGlobalConfig.openMention = false
}
window.loadInject = true

  // 拦截编辑器压缩代码中通过 <a> + blob URL 模拟点击下载的行为（txt/md 等），
  // 转为客户端 saveFileB64 保存，不修改编辑器源码。
  ; (function interceptBlobDownload() {
    const _HANDLED_SUFFIXES = ['txt', 'md', 'markdown', 'csv', 'json', 'html']

    function getSuffixFromFilename(filename) {
      if (!filename) return ''
      const parts = filename.split('.')
      return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
    }

    async function handleBlobAnchor(a) {
      const href = a.getAttribute('href') || a.href || ''
      const filename = a.getAttribute('download') || a.download || ''
      if (!href.startsWith('blob:') && !href.startsWith('data:')) return false
      const suffix = getSuffixFromFilename(filename)
      if (!_HANDLED_SUFFIXES.includes(suffix)) return false

      try {
        const res = await fetch(href)
        const blob = await res.blob()
        const arrayBuf = await blob.arrayBuffer()
        const base64 = importClass.arrayBufferToBase64(arrayBuf)
        const saveName = filename.replace(/\.[^.]+$/, '') || window.saveName || '未命名文件'
        ipc1.sendSync('saveFileB64', { type: 'save', data: base64, path: saveName, suffix }).then((resPath) => {
          if (resPath !== '') {
            new Toast({ type: 'success', msg: '保存成功' })
            if (window.downType) ipc.sendToHost('downed')
          } else {
            if (window.downType) ipc.sendToHost('cancel')
          }
        })
      } catch (e) {
        console.error('[interceptBlobDownload] failed', e)
        return false
      }
      return true
    }

    // 拦截 a.click()
    const _origClick = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = function () {
      const a = this
      const href = a.getAttribute('href') || a.href || ''
      const filename = a.getAttribute('download') || a.download || ''
      const suffix = getSuffixFromFilename(filename)
      if ((href.startsWith('blob:') || href.startsWith('data:')) && _HANDLED_SUFFIXES.includes(suffix)) {
        handleBlobAnchor(a)
        return
      }
      _origClick.call(a)
    }

    // 拦截 a.dispatchEvent(MouseEvent 'click')
    const _origDispatchEvent = HTMLAnchorElement.prototype.dispatchEvent
    HTMLAnchorElement.prototype.dispatchEvent = function (event) {
      const a = this
      const href = a.getAttribute('href') || a.href || ''
      const filename = a.getAttribute('download') || a.download || ''
      const suffix = getSuffixFromFilename(filename)
      if (
        event instanceof MouseEvent &&
        event.type === 'click' &&
        (href.startsWith('blob:') || href.startsWith('data:')) &&
        _HANDLED_SUFFIXES.includes(suffix)
      ) {
        handleBlobAnchor(a)
        return true
      }
      return _origDispatchEvent.call(a, event)
    }
  })()