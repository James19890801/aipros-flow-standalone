import DBUtil from '../pc/db/db.js'
import { saveAs,uploadOnline } from './upload.js'
import { isOnlineToast } from './common.js'
// 初始化监听
const initIpcOn = () => {

  // 设置tabId
  ipc.on('setId', (_evt, obj) => {
    window.TABGROUPID = obj
  })
  // 键盘按键回传
  ipc.on('keydown', (_evt, e, a) => {

    const event = new KeyboardEvent('keydown', {
      metaKey: e.metaKey, shiftKey: e.shiftKey, altKey: e.altKey, key: e.key, ctrlKey: e.ctrlKey
    });
    document.dispatchEvent(event)
    // if (window.isMyFile) {
    //   console.log('e', e)
    //   if ((e.metaKey || e.ctrlKey) && e.key == 's') {
    //     save()
    //   }
    // }
  })
  // 获取tabId
  ipc.sendToHost('getId')
  /** -start- 接收ws */
  ipc.on("pong_event", (e, m) => {
    if (m.k == 'close') {
      let isAllClose = sessionStorage.getItem('isAllClose')
      window.saveType = isAllClose == "1" ? "关闭客户端" : "关闭文件"
      window.cefQuery.saveDef()
    } else if (m.k == 'updateSaveName') {
      window.saveName = m.args[0]
    }
  });
  /** -end- 接收ws */
  // 刷新vip结果
  ipc.on('refreshVipStatus', (e, userInfo) => { // 0 是有网情况 1是从外部传输
    console.log('refreshVipStatus...')

    setTimeout(() => {
      const user = JSON.parse(userInfo)
      if (window.isMember()) {

        window.PoEditorInsert.isMember = true;
        window.memberObj = user
        $('.topics-nums.page-topics-nums').hide()

        vipState.poPrivileges = {
          flowShapeNum: 100000, //图形数量(100000不限)
          mindShapeNum: Infinity,//图形数量(100000不限)
          themesCustomise: Infinity, //自定义主题(1,100000不限)
          backgroundImage: true, //设置背景图
          Latex: true,//公式
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
      } else {
        window.PoEditorInsert.isMember = false;
        window.memberObj = user
        if (!$('.topics-nums.page-topics-nums').length) {
          $('.topics-nums').before(`<div class="topics-nums page-topics-nums">主题限制：<span id="shape-number">80</span></div>`)
        } else {
          $('.topics-nums.page-topics-nums').show()
        }
        vipState.poPrivileges = {
          flowShapeNum: 60, //图形数量(Infinity不限)
          mindShapeNum: 80,//图形数量(Infinity不限)
          themesCustomise: 1, //自定义主题(1,100000不限)
          backgroundImage: false, //设置背景图
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
      }

      pcUtil.isOnline()
    }, 500);

  })
  // 保存弹框回传
  ipc.on('saveFile_callback', (evt, obj) => {
    if (obj == '') {
      sessionStorage.removeItem('isClose')
      ipc.sendToHost('myFileCloseCancel', window.TABGROUPID)
      // 按键
    }
    else if (obj.saveAs) {
      // 本地文件
      if (window.isMyFile) {
        if (obj.type == 1) {
          saveAs.saveAsLocal(obj)
        }
        else {
          saveAs.saveAsOnline(obj)
        }
      }
      // 云文件
      else {
        if (obj.type == 1) {
          saveAs.saveAsLocalByOnline(obj)
        }
        else {
          saveAs.saveAsOnlineByOnline(obj)
        }
      }
    }
    else {
      window.new = false

      if (obj.type == 1) {
        window.filepath = obj.path
        // 读取最近目录
        ipc1.sendSync('loadFileB64', { type: 'cache', path: 'history/cache.json' }).then((resHis) => {
          // 制作最近数据
          if (resHis == '') {
            resHis = '[]'
          }
          let history = JSON.parse(resHis);
          const title = obj.path.lastIndexOf('/') > -1 ?
            obj.path.substring(obj.path.lastIndexOf('/') + 1, obj.path.lastIndexOf('.')) :
            obj.path.substring(obj.path.lastIndexOf('\\') + 1, obj.path.lastIndexOf('.'))
          window.saveName = title
          const hisI = history.findIndex(hisd => hisd.chartId == chartObj.chartId)
          if (hisI > -1) {
            history[hisI].title = window.saveName
            history[hisI].lastModify = pcUtil.getCurrentTimeString()
            history[hisI].filepath = window.filepath
            history[hisI].type = 2
          }
          else {

            const historyC = {
              "chartId": chartObj.chartId,
              "title": window.saveName,
              "category": chartObj.category,
              "definitionId": chartObj.mainCanvasId ? chartObj.mainCanvasId : chartObj.chartId,
              "owner": {
                "userId": userId,
                "userName": fullName,
                "fullName": fullName
              },
              "ownerId": "1001",
              "description": "",
              "thumbImage": "",
              "lastModify": pcUtil.getCurrentTimeString(),
              "filepath": window.filepath,
              "type": 2
            }
            history.push(historyC)
          }
          const result = importClass.stringToBase64String(JSON.stringify(history));
          // 存储最近文件
          ipc1.sendSync('saveFileB64',
            { type: 'cache', data: result, path: 'history/cache.json', suffix: '' }).then(() => {
              ipc1.send('setTabTitle', title)
              ipc.sendToHost('setIdOrFilePath', window.TABGROUPID, chartObj.id, window.filepath)
              ipc.sendToHost('setFileIcon', window.TABGROUPID, window.isMyFile)
              window.editorGlobalConfig.onBeforeExport({
                type: window.fileType == 'markdown' ? window.fileType : 'pos_all', call: () => {
                  if (sessionStorage.getItem('isClose')) {
                    ipc.sendToHost('myFileClose', window.TABGROUPID)
                  }
                  else
                    if (window.fileType == 'flow') {
                      let isAllClose = parseInt(localStorage.getItem('isAllClose'))
                      if (isAllClose == 1) {
                        ipc.sendToHost('myFileClose', window.TABGROUPID)
                        return
                      }
                      const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                        `http://localhost:5173/src/v5_editor/source/compile/diagrams/index.html?token=token&chartId=&dbId=undefined&filepath=${window.filepath}`
                        : encodeURI(`file:///${webRoot}/v5_editor/source/compile/diagrams/index.html?token=token&chartId=&dbId=undefined&filepath=${window.filepath}`)
                      ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
                    }
                    else if ((window.fileType == 'mind')) {
                      const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                        `http://localhost:5173/src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=&dbId=undefined&filepath=${window.filepath}`
                        : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/index.html?token=token&chartId=&dbId=undefined&filepath=${window.filepath}`)
                      ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
                    }
                    else if ((window.fileType == 'markdown')) {
                      const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                        `http://localhost:5173/src/markdown-editor/index.html?token=token&chartId=&dbId=undefined&filepath=${window.filepath}`
                        : encodeURI(`file:///${webRoot}/markdown-editor/index.html?token=token&chartId=&dbId=undefined&filepath=${window.filepath}`)
                      ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
                    }
                    else {
                      const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                        `http://localhost:5173/src/v5_editor/source/compile/outline/index.html?token=token&chartId=$&dbId=undefined&filepath=${window.filepath}`
                        : encodeURI(`file:///${webRoot}/v5_editor/source/compile/outline/index.html?token=token&chartId=&dbId=undefined&filepath=${window.filepath}`)
                      ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
                    }
                }, isSave: true
              })
              window.defVersion.forEach((d) => {
                d.isSave = true
              })
            })
        })
      }
      else {
        if (isOnlineToast()) {
          uploadOnline(obj)
        }
        else {
          window.new = true
        }
      }
    }
  })
  // 上云结果回传
  ipc.on('localUpload_callback', (e, res) => {
    if (isOnlineToast()) {
      const fileId = res.data.id
      if (chartObj.chartId == fileId && res.code == 200) {
        if (window.newDir != undefined && window.newDir !== 'root') {
          $.ajax({
            url: host + '/api/personal/folder/move',
            type: 'post',
            data: { fileType: 'chart', fileId: res.data.newId, targetFolderId: window.newDir },
            success: function (res1) {
              window.toast_.uploadSuccess()
              ipc.sendToHost('setTitle', window.TABGROUPID, chartObj.title)
              const newFileId = res.data.newId
              ipc.sendToHost("saveStatus", window.TABGROUPID, "saved")
              ipc.sendToHost('setIdOrFilePath', window.TABGROUPID, newFileId, '')
              if (sessionStorage.getItem('isClose')) {
                ipc.sendToHost('myFileClose', window.TABGROUPID)
              }
              else
                if (window.fileType == 'flow') {
                  const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                    `http://localhost:5173/src/v5_editor/source/compile/diagrams/index.html?token=token&chartId=${newFileId}&dbId=undefined`
                    : encodeURI(`file:///${webRoot}/v5_editor/source/compile/diagrams/index.html?token=token&chartId=${newFileId}&dbId=undefined`)
                  ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
                }
                else if ((window.fileType == 'mind')) {
                  const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                    `http://localhost:5173/src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${newFileId}&dbId=undefined`
                    : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${newFileId}&dbId=undefined`)
                  ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
                }
                else {
                  const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                    `http://localhost:5173/src/v5_editor/source/compile/outline/index.html?token=token&chartId=${newFileId}&dbId=undefined`
                    : encodeURI(`file:///${webRoot}/v5_editor/source/compile/outline/index.html?token=token&chartId=${newFileId}&dbId=undefined`)
                  ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
                }
            },
            error: function () {
              window.toast_.uploadError()
            }
          })
        }
        else {
          window.toast_.uploadSuccess()
          ipc.sendToHost('setTitle', window.TABGROUPID, chartObj.title)
          ipc.sendToHost("saveStatus", window.TABGROUPID, "saved")
          const newFileId = res.data.newId
          ipc.sendToHost('setIdOrFilePath', window.TABGROUPID, newFileId, '')
          if (sessionStorage.getItem('isClose')) {
            ipc.sendToHost('myFileClose', window.TABGROUPID)
          }
          else
            if (window.fileType == 'flow') {
              const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                `http://localhost:5173/src/v5_editor/source/compile/diagrams/index.html?token=token&chartId=${newFileId}&dbId=undefined`
                : encodeURI(`file:///${webRoot}/v5_editor/source/compile/diagrams/index.html?token=token&chartId=${newFileId}&dbId=undefined`)
              ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
            }
            else if ((window.fileType == 'mind')) {
              const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                `http://localhost:5173/src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${newFileId}&dbId=undefined`
                : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${newFileId}&dbId=undefined`)
              ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
            }
            else {
              const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                `http://localhost:5173/src/v5_editor/source/compile/outline/index.html?token=token&chartId=${newFileId}&dbId=undefined`
                : encodeURI(`file:///${webRoot}/v5_editor/source/compile/outline/index.html?token=token&chartId=${newFileId}&dbId=undefined`)
              ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
            }
        }
      }
      else if (chartObj.chartId == fileId && res.code != 200) {
        sessionStorage.removeItem('isClose')
        ipc.sendToHost('myFileCloseCancel', window.TABGROUPID)
        window.toast_.uploadError()
        ipc.sendToHost('hideSaving')
        // uploadCopyFile.uploadError()
      }
    }
    else ipc.sendToHost('hideSaving')
  })
  // 文件删除回传
  ipc.on('listenRemoveFile', (_, _obj) => {
    window.oldfilepath = window.filepath
    window.filepath = ''
    window.new = true
  })
  // 文件恢复回传
  ipc.on('listenRestoreFile', (_, _obj) => {
    if (window.oldfilepath) {
      window.filepath = window.oldfilepath
      window.new = false
    }
  })
}

// ipc通信
const ipc1 = {
  /**
   * 页面异步
   * @param {*} channel 
   * @param {*} data 
   */
  send: function (channel, data) {
    console.log(channel, data)
    switch (channel) {
      case 'win_opts': // 页面窗口操作 fullScreen
        if (data == 'unFullScreen') {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
          } else if (document.webkitExitFullscreen) { /* Chrome, Safari 和 Opera */
            document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
          }
        }
        if (data == 'fullScreen') {
          if (document.body.requestFullscreen) {
            document.body.requestFullscreen();
          } else if (document.body.mozRequestFullScreen) { /* Firefox */
            document.body.mozRequestFullScreen();
          } else if (document.body.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            document.body.webkitRequestFullscreen();
          } else if (document.body.msRequestFullscreen) { /* IE/Edge */
            document.body.msRequestFullscreen();
          }
        }
        break;
      case 'exportLog': // 日志 { str: `同步 - 请求, success-res = ${JSON.stringify(data)}` }
        break;
      case 'addTab': // 添加tab
        window.appConfig.createTab(JSON.stringify(data))
        break;
      case 'setTabTitle': // 设置tab的title
        const regex = /^.*<span\s+[^>].*>(.*?)<\/span>(.*)+/;
        const match = data.match(regex);
        setTimeout(() => {
          // ipc.sendToHost("ping_event", 0, { k: 'setTitle', args: [false, window.saveName] });
          ipc.sendToHost('setTitle', window.TABGROUPID, match ? match[1].trim() : data)
        }, 100);
        // window.appConfig.setTabTitle(data)
        break;
      case 'closeTab': // 设置tab的title
        ipc.sendToHost('myFileClose', window.TABGROUPID)
        // window.appConfig.closeTab('')
        break;
      case 'print': // 打印
        // window.appConfig.printImage(JSON.stringify(data))
        break;
      case 'createTab': // 新建
        // window.appConfig.createTab(JSON.stringify(data))
        break;
      case 'openFile': // 新建
        // window.appConfig.openFile(data.replace('file:///', ''))
        break;
    }
  },
  /**
   * tab页相关
   * @param {*} channel 
   * @param  {...any} data 
   */
  sendToHost: function (channel, ...data) {
    switch (channel) {
      // 页面消息
      case 'ping_event': // 
        // 'ping_event', 0, { k: 'updataChart', args: [chart] })
        // 'ping_event', 0, { k: 'setTitle', args: [false, msg.title] }
        // "ping_event", 0, { k: "loadFile" }
        break;
      // 思维导图笔记相互切换
      case 'changeTabUrl': // 'changeTabUrl', chartId, 'mind', chartTitle
        break;
      // 选中某一个tab
      case 'changeTabUrl': // 'selectTab', 0, true
        break;
      // 隐藏index框
      case 'hideTabMore': // "hideTabMore"
        break;
      // 新增标签页
      case 'addTab': // 'addTab', { src, title, type, isReplace, index, notLoad ,chartDef}
        break;
    }

  },
  /**
   * 页面同步
   * @param {*} channel 
   * @param {*} data 
   * @returns 
   */
  sendSync: (channel, data) => {
    return new Promise((reslove, reject) => {
      switch (channel) {
        // 初始化数据
        case 'initData':
          // 判断是否有参数
          if (data) {
            reslove(importClass.fileToDef(data))
          }
          // const url = window.location.href;
          // // 流程图
          // if (url.indexOf('/diagrams/index.html') > -1) {


          //   // window.appConfig.GetPosInitData()
          //   // .then(function onFulfilled(value) {
          //   //   // console.log('------------------- initData >> ' + value);
          //   //   let initData = JSON.parse(value)
          //   //   const defs=initData.def
          //   //   initData.def =defs[0];

          //   //   // 更新indexedDB中数据
          //   //   DBUtil.save('charts', initData.chartObj)
          //   //   defs.forEach((d, i) => {
          //   //     DBUtil.save('charts_def', { id: initData.chartDefIds[i].definitionId, definition: JSON.stringify(d) })
          //   //   })
          //   //   DBUtil.save('charts_multiple_defIds', {
          //   //     id: initData.chartObj.chartId,
          //   //     chartCanvas: initData.chartDefIds,
          //   //     chartDefIds: initData.chartDefIds,
          //   //     mainCanvasId: initData.mainCanvasId
          //   //   })
          //   //   $(".diagram_title, title").text(initData.chartObj.title);
          //   //   reslove(initData)
          //   // }).catch(function onRejected(error) {
          //   //     console.log('error: ' + error);
          //   // });

          //   const def = [
          //     '{"elements":{"RoAYzBQFXF742490":{"parent":"","link":"","shapeStyle":{"alpha":1},"textBlock":[{"position":{"w":"w-20","x":10,"h":"h","y":0},"text":""}],"anchors":[{"x":"w/2","y":"0"},{"x":"w/2","y":"h"},{"x":"0","y":"h/2"},{"x":"w","y":"h/2"}],"title":"开始/结束","fontStyle":{},"dataAttributes":[{"name":"序号","id":"EsYskeFSKT932959","type":"number","category":"default","value":""},{"name":"名称","id":"pQNAMDALaA615781","type":"string","category":"default","value":""},{"name":"所有者","id":"QsojfpzTRp710534","type":"string","category":"default","value":""},{"name":"连接","id":"TJtzgbuaGO632514","type":"link","category":"default","value":""},{"name":"便笺","id":"EioMmPrXRS621231","type":"string","category":"default","value":""}],"props":{"zindex":5,"w":100,"x":142.08331298828125,"h":50,"y":149,"angle":0},"path":[{"actions":[{"x":"Math.min(w,h)/3","action":"move","y":"0"},{"x":"w-Math.min(w,h)/3","action":"line","y":"0"},{"y1":"0","x":"w-Math.min(w,h)/3","action":"curve","x1":"w+Math.min(w,h)/3/3","y2":"h","y":"h","x2":"w+Math.min(w,h)/3/3"},{"x":"Math.min(w,h)/3","action":"line","y":"h"},{"y1":"h","x":"Math.min(w,h)/3","action":"curve","x1":"-Math.min(w,h)/3/3","y2":"0","y":"0","x2":"-Math.min(w,h)/3/3"},{"action":"close"}]}],"lineStyle":{"lineWidth":1.5},"children":[],"resizeDir":["tl","tr","br","bl","l","t","r","b"],"name":"start","fillStyle":{},"theme":{},"id":"RoAYzBQFXF742490","attribute":{"container":false,"rotatable":true,"visible":true,"fixedLink":false,"collapsable":false,"collapsed":false,"linkable":true,"markerOffset":5},"category":"basic","locked":false,"group":""},"eHqacUTbxI666320":{"parent":"","link":"","shapeStyle":{"alpha":1},"anchors":[{"x":"w/2","y":"0"},{"x":"w/2","y":"h"},{"x":"0","y":"h/2"},{"x":"w","y":"h/2"}],"textBlock":[],"title":"","fontStyle":{},"dataAttributes":[],"props":{"zindex":2,"w":100.5,"x":141.83331298828125,"h":91,"y":15,"angle":0},"path":[{"lineStyle":{"lineWidth":0},"actions":[{"x":"0","action":"move","y":"0"},{"x":"w","action":"line","y":"0"},{"x":"w","action":"line","y":"h"},{"x":"0","action":"line","y":"h"},{"action":"close"}]}],"lineStyle":{},"children":[],"resizeDir":["tl","tr","br","bl","l","t","r","b"],"name":"standardImage","theme":{},"fillStyle":{"imageW":1200,"display":"stretch","imageH":1419,"type":"image","fileId":"https://cdn.processon.com/64c8d0d863879354a5d12291-653f0f7551aa957bc500b3d4?e=1698635142&token=trhI0BY8QfVrIGn9nENop6JAc6l5nZuxhjQ62UfM:MoJid7CJgc_JcT1QduLiLHgYv6g="},"id":"eHqacUTbxI666320","attribute":{"container":false,"rotatable":true,"visible":false,"fixedLink":false,"collapsable":false,"collapsed":false,"linkable":true,"markerOffset":5},"locked":false,"category":"standard","group":""},"VNkBpQjpby266637":{"parent":"","link":"","shapeStyle":{"alpha":1},"textBlock":[{"position":{"w":"w-20","x":10,"h":"h","y":0},"text":""}],"anchors":[{"x":"w/2","y":"0"},{"x":"w/2","y":"h"},{"x":"0","y":"h/2"},{"x":"w","y":"h/2"}],"title":"开始/结束","fontStyle":{},"dataAttributes":[{"name":"序号","id":"BWXnypqWZi483665","type":"number","category":"default","value":""},{"name":"名称","id":"UQFdEiwlou245244","type":"string","category":"default","value":""},{"name":"所有者","id":"CXzdZwgSTH507351","type":"string","category":"default","value":""},{"name":"连接","id":"SjjTyaMYQI138528","type":"link","category":"default","value":""},{"name":"便笺","id":"eaXOwtMYJg088100","type":"string","category":"default","value":""}],"props":{"zindex":4,"w":100,"x":27.33331298828125,"h":50,"y":149,"angle":0},"path":[{"actions":[{"x":"Math.min(w,h)/3","action":"move","y":"0"},{"x":"w-Math.min(w,h)/3","action":"line","y":"0"},{"y1":"0","x":"w-Math.min(w,h)/3","action":"curve","x1":"w+Math.min(w,h)/3/3","y2":"h","y":"h","x2":"w+Math.min(w,h)/3/3"},{"x":"Math.min(w,h)/3","action":"line","y":"h"},{"y1":"h","x":"Math.min(w,h)/3","action":"curve","x1":"-Math.min(w,h)/3/3","y2":"0","y":"0","x2":"-Math.min(w,h)/3/3"},{"action":"close"}]}],"lineStyle":{"lineWidth":1.5},"children":[],"resizeDir":["tl","tr","br","bl","l","t","r","b"],"name":"start","fillStyle":{},"theme":{},"id":"VNkBpQjpby266637","attribute":{"container":false,"rotatable":true,"visible":true,"fixedLink":false,"collapsable":false,"collapsed":false,"linkable":true,"markerOffset":5},"category":"basic","locked":false,"group":""},"OCJfHKJTLE864595":{"parent":"","link":"","shapeStyle":{"alpha":1},"anchors":[{"x":"w/2","y":"0"},{"x":"w/2","y":"h"},{"x":"0","y":"h/2"},{"x":"w","y":"h/2"}],"textBlock":[],"title":"","fontStyle":{},"dataAttributes":[],"props":{"zindex":1,"w":100.5,"x":17.83331298828125,"h":91,"y":15,"angle":0},"path":[{"lineStyle":{"lineWidth":0},"actions":[{"x":"0","action":"move","y":"0"},{"x":"w","action":"line","y":"0"},{"x":"w","action":"line","y":"h"},{"x":"0","action":"line","y":"h"},{"action":"close"}]}],"lineStyle":{},"children":[],"resizeDir":["tl","tr","br","bl","l","t","r","b"],"name":"standardImage","theme":{},"fillStyle":{"imageW":1200,"display":"stretch","imageH":1419,"type":"image","fileId":"https://cdn.processon.com/64c8d0d863879354a5d12291-653f0f7551aa957bc500b3d4?e=1698635142&token=trhI0BY8QfVrIGn9nENop6JAc6l5nZuxhjQ62UfM:MoJid7CJgc_JcT1QduLiLHgYv6g="},"id":"OCJfHKJTLE864595","attribute":{"container":false,"rotatable":true,"visible":false,"fixedLink":false,"collapsable":false,"collapsed":false,"linkable":true,"markerOffset":5},"locked":false,"category":"standard","group":""},"UhRHhUnlOE142735":{"parent":"","link":"","shapeStyle":{"alpha":1},"textBlock":[{"position":{"w":"w+40","x":"-20","h":"30","y":"h"}}],"anchors":[{"x":"w/2","y":"0"},{"x":"w/2","y":"h"},{"x":"0","y":"h/2"},{"x":"w","y":"h/2"}],"title":"Access Point","fontStyle":{},"dataAttributes":[],"props":{"zindex":3,"w":80,"x":304.33331298828125,"h":58,"y":31.5,"angle":0},"path":[{"lineStyle":{"lineWidth":0},"fillStyle":{"display":"stretch","type":"image","fileId":"/assets/images/designer/network/accessPoint.svg"},"actions":[{"x":"0","action":"move","y":"0"},{"x":"w","action":"line","y":"0"},{"x":"w","action":"line","y":"h"},{"x":"0","action":"line","y":"h"},{"action":"close"}]}],"lineStyle":{"lineWidth":0},"children":[],"resizeDir":["tl","tr","br","bl","l","t","r","b"],"name":"access point","fillStyle":{},"theme":{},"id":"UhRHhUnlOE142735","attribute":{"container":false,"rotatable":true,"visible":true,"fixedLink":false,"collapsable":false,"collapsed":false,"linkable":true,"markerOffset":5},"category":"network","locked":false,"group":""}},"page":{"padding":20,"backgroundColor":"transparent","orientation":"portrait","gridSize":15,"width":765,"showGrid":true,"lineJumps":false,"height":719},"version":17}',
          //     '{ "elements": { "XMfuGMdluG518588": { "parent": "", "link": "", "shapeStyle": { "alpha": 1 }, "textBlock": [{ "position": { "w": "w-20", "x": 10, "h": "h", "y": 0 }, "text": "" }], "anchors": [{ "x": "w/2", "y": "0" }, { "x": "w/2", "y": "h" }, { "x": "0", "y": "h/2" }, { "x": "w", "y": "h/2" }], "title": "矩形", "fontStyle": {}, "dataAttributes": [{ "name": "序号", "id": "FGmmTRqjyk807013", "type": "number", "category": "default", "value": "" }, { "name": "名称", "id": "MZXXZtkBnk119449", "type": "string", "category": "default", "value": "" }, { "name": "所有者", "id": "MkPJOzLbtr815275", "type": "string", "category": "default", "value": "" }, { "name": "连接", "id": "CVgfFYYzvu376312", "type": "link", "category": "default", "value": "" }, { "name": "便笺", "id": "TynBgZHZJH453414", "type": "string", "category": "default", "value": "" }], "props": { "zindex": 1, "w": 96, "x": 131, "h": 54, "y": 67, "angle": 0 }, "path": [{ "actions": [{ "x": "0", "action": "move", "y": "0" }, { "x": "w", "action": "line", "y": "0" }, { "x": "w", "action": "line", "y": "h" }, { "x": "0", "action": "line", "y": "h" }, { "action": "close" }] }], "lineStyle": { "lineWidth": 1.5 }, "children": [], "resizeDir": ["tl", "tr", "br", "bl", "l", "t", "r", "b"], "name": "rectangle", "fillStyle": {}, "theme": {}, "id": "XMfuGMdluG518588", "attribute": { "container": false, "rotatable": true, "visible": true, "fixedLink": false, "collapsable": false, "collapsed": false, "linkable": true, "markerOffset": 5 }, "category": "basic", "locked": false, "group": "" } }, "page": { "padding": 20, "backgroundColor": "transparent", "orientation": "portrait", "gridSize": 15, "width": 1727, "showGrid": true, "lineJumps": false, "height": 761 }, "version": 4 }'
          //   ]
          //   const initData = {
          //     chartObj: {
          //       "deleted": false,
          //       "parentDeleted": false,
          //       "dbId": "",
          //       "id": "6544a4bf4f06142be77de3b0",
          //       "chartId": "6544a4bf4f06142be77de3b0",
          //       "title": "test01",
          //       "definitionId": "6544a4bf4f06142be77de3ad",
          //       "owner": {
          //         "userId": "",
          //         "userName": "",
          //         "fullName": window.pcName
          //       },
          //       "ownerId": null,
          //       "description": "",
          //       "category": "flow",
          //       "thumbnail": "6544a4bf4f06142be77de3ae",
          //       "imgOriginal": null,
          //       "shapeCount": 0,
          //       "status": "private",
          //       "folderId": "root",
          //       "language": null,
          //       "version": 0,
          //       "tags": null,
          //       "teamId": null,
          //       "schema": [
          //         "standard",
          //         "basic",
          //         "flow",
          //         "lane",
          //         "network"
          //       ],
          //       "viewLinkId": null,
          //       "cloneId": null,
          //       "cloneTime": null,
          //       "newCreate": true,
          //       "corpid": null,
          //       "sortNum": 0,
          //       "likeCount": 0,
          //       "commentCount": 0,
          //       "favouriteCount": 0,
          //       "viewCount": 0,
          //       "cloneCount": 0,
          //       "publicClonePrice": 0,
          //       "orgId": null,
          //       "collaRole": null,
          //       "sourceName": null,
          //       "createTime": "",
          //       "lastModify": "",
          //       "publicClone": false,
          //       "canvasCount": 2,
          //       "favourite": false,
          //       "belongtoTeam": false,
          //       "openColla": false,
          //       "openLinkColla": false,
          //       "userId": ""
          //     }, // chart 信息
          //     authObj: {
          //       "userConfigId": "64c8d0da63879354a5d12292",
          //       "userId": "64c8d0d863879354a5d12291",
          //       "fileSort": null,
          //       "fileView": "list",
          //       "folderId": null,
          //       "orgId": null,
          //       "orgFolderId": null,
          //       "teamId": null,
          //       "teamFolderId": null,
          //       "collaborationSort": null,
          //       "newDiagramLanguage": null,
          //       "newDiagramIndustry": null,
          //       "newDiagramCategory": "flow",
          //       "showToolbar": true,
          //       "dock": null,
          //       "designerTutorial": false,
          //       "mindTutorial": false,
          //       "mindCanvas": "false",
          //       "mindGuide": false,
          //       "mindTheme": null,
          //       "schema": null,
          //       "showCommentIco": true,
          //       "timeZone": null,
          //       "emailNotification": null,
          //       "showSettingPanel": false,
          //       "newFileCollection": null,
          //       "waterMark": null,
          //       "waterMarks": null,
          //       "outlineConfig": null,
          //       "newFileCategory": null,
          //       "mindConfig": "{\"tags\":[\"{\\\"text\\\":\\\"待定\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(122, 0, 242)\\\"}\",\"{\\\"text\\\":\\\"已确认\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(80, 194, 139)\\\"}\",\"{\\\"text\\\":\\\"已完成\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(109, 109, 109)\\\"}\",\"{\\\"text\\\":\\\"已关闭\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(196, 196, 196)\\\"}\",\"{\\\"text\\\":\\\"进行中\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(39, 96, 242)\\\"}\"]}",
          //       "flowBasicConfig": null,
          //       "leftButton": null,
          //       "shapeSelectPart": null
          //     },
          //     userObj: {
          //       "id": "64c8d0d863879354a5d12291",
          //       "userId": "64c8d0d863879354a5d12291",
          //       "userName": "64c8d0d863879354a5d12290",
          //       "password": null,
          //       "email": "",
          //       "phone": "133****2205",
          //       "emailValid": true,
          //       "fullName": window.pcName,
          //       "photoFileName": null,
          //       "profile": {
          //         "occupation": null,
          //         "companyIndustry": null,
          //         "company": null,
          //         "country": null,
          //         "introduction": null,
          //         "schoolName": null,
          //         "specialty": null,
          //         "signature": null,
          //         "province": null,
          //         "city": null
          //       },
          //       "lastLogin": "2023-11-03 15:38:31",
          //       "registDate": "2023-08-01 17:31:04",
          //       "loginAddress": "192.168.10.13",
          //       "updateTime": "2023-10-30 14:01:27",
          //       "identity": "",
          //       "userSource": null,
          //       "registerType": "phone",
          //       "openId": null,
          //       "tutorial": true,
          //       "firstCreateChart": false,
          //       "locale": "zh",
          //       "dateFormat": "yyyy-MM-dd",
          //       "goldCoins": 0,
          //       "weeklyPublishCount": 0,
          //       "fieldHadGetCoins": null,
          //       "bgImg": null,
          //       "inviteCount": 0,
          //       "inviteClientCount": 0,
          //       "fromUrl": null,
          //       "photoUrl": "../../../../../src/assets/images/icon/empty_user.svg",
          //       "wpsUID": null,
          //       "guide": null,
          //       "teamGuide": null,
          //       "orgGuide": null,
          //       "boardGuide": null,
          //       "corpid": null,
          //       "channelType": null,
          //       "terminalType": null,
          //       "beforeLogin": "2023-10-30 11:34:13",
          //       "expert": false,
          //       "usedMind": false,
          //       "totalFileCount": 9,
          //       "auth": {
          //       },
          //       "usedFileCount": 3,
          //       "member": true,
          //       "orgMember": false,
          //       "balanceUserdFileCount": 0,
          //       "expireTime": "2024-09-26 23:59:59",
          //       "orgExpireTime": null
          //     },
          //     chartDefIds: [
          //       {
          //         "canvasId": "6544a4bf4f06142be77de3b0",
          //         "definitionId": "6544a4bf4f06142be77de3ad",
          //         "title": "画布s1"
          //       },
          //       {
          //         "canvasId": "6544a64b4f06142be77de3b9",
          //         "definitionId": "6544a64b4f06142be77de3b9",
          //         "title": "画布2"
          //       }
          //     ], // 多画布用
          //     mainCanvasId: '6544a4bf4f06142be77de3ad', // 主画布 id
          //     def: def[0] // 定义
          //   }
          //   // 更新indexedDB中数据
          //   DBUtil.save('charts', initData.chartObj)
          //   def.forEach((d, i) => {
          //     DBUtil.save('charts_def', { id: initData.chartDefIds[i].definitionId, definition: d })
          //   })
          //   DBUtil.save('charts_multiple_defIds', {
          //     id: initData.chartObj.chartId,
          //     chartCanvas: initData.chartDefIds,
          //     chartDefIds: initData.chartDefIds,
          //     mainCanvasId: initData.mainCanvasId
          //   })

          //   reslove(initData)
          // }
          // // 思维导图
          // if (url.indexOf('/mindmap/index.html') > -1) {

          //   const def = [
          //     '{"id":"root","leftChildren":[{"id":"9ea87c706d7983c9","parent":"root","children":[],"title":"分支主题","link":{"value":"http://www.baidu.com","type":"url","title":"测试"}}],"children":[{"id":"489d35ff04187d67","parent":"root","children":[],"title":"分支主题","image":{"w":300,"h":253.6997885835095,"direction":"up","url":"https://cdn.processon.com/64c8d0d863879354a5d12291-654d9620ac52e155ccc1adc5?e=1699587121&token=trhI0BY8QfVrIGn9nENop6JAc6l5nZuxhjQ62UfM:vfOL_pxqEHPmsUAwc9y1K5URgM8="}},{"id":"e213c8b3a6f6032e","parent":"root","children":[],"title":"分支主题","link":{},"file":{"value":"https://po-files.ks3-cn-beijing.ksyun.com/654d9521bdf29538ef403927_654d962ebdf29538ef40392a.js","type":"file","title":"789.js"}}],"title":"未命名文件","structure":"mind_free","root":true,"theme":"theme3","version":6,"showWatermark":false}',
          //     '{"leftChildren":[],"children":[],"root":true,"theme":"theme3","id":"root","title":"未命名文件","version":1,"structure":"mind_free"}'
          //   ]
          //   const initData = {
          //     chartObj: {
          //       "id": "654d9521bdf29538ef403927",
          //       "dbId": "2JAxGL61z8",
          //       "chartId": "654d9521bdf29538ef403927",
          //       "userId": "64c8d0d863879354a5d12291",
          //       "category": "mind_free",
          //       "owner": {
          //         "userId": "64c8d0d863879354a5d12291"
          //       },
          //       "deleted": false,
          //       "parentDeleted": false,
          //       "createDate": "2023-11-10 10:27:50",
          //       "lastModify": "2023-11-10 10:33:12",
          //       "folderId": "root",
          //       "folderDbId": "root",
          //       "version": 0,
          //       "template": false,
          //       "status": "private",
          //       "title": "未命名文件",
          //       "definitionId": "654d9521bdf29538ef403924",
          //       "definitionDbId": "41aaS1HsXf",
          //       "thumbnail": "654d9521bdf29538ef403925"
          //     }, // chart 信息
          //     authObj: {
          //       "userConfigId": "64c8d0da63879354a5d12292",
          //       "userId": "64c8d0d863879354a5d12291",
          //       "fileSort": null,
          //       "fileView": "list",
          //       "folderId": null,
          //       "orgId": null,
          //       "orgFolderId": null,
          //       "teamId": null,
          //       "teamFolderId": null,
          //       "collaborationSort": null,
          //       "newDiagramLanguage": null,
          //       "newDiagramIndustry": null,
          //       "newDiagramCategory": "flow",
          //       "showToolbar": true,
          //       "dock": null,
          //       "designerTutorial": false,
          //       "mindTutorial": false,
          //       "mindCanvas": "false",
          //       "mindGuide": false,
          //       "mindTheme": null,
          //       "schema": null,
          //       "showCommentIco": true,
          //       "timeZone": null,
          //       "emailNotification": null,
          //       "showSettingPanel": false,
          //       "newFileCollection": null,
          //       "waterMark": null,
          //       "waterMarks": null,
          //       "outlineConfig": null,
          //       "newFileCategory": null,
          //       "mindConfig": "{\"tags\":[\"{\\\"text\\\":\\\"待定\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(122, 0, 242)\\\"}\",\"{\\\"text\\\":\\\"已确认\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(80, 194, 139)\\\"}\",\"{\\\"text\\\":\\\"已完成\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(109, 109, 109)\\\"}\",\"{\\\"text\\\":\\\"已关闭\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(196, 196, 196)\\\"}\",\"{\\\"text\\\":\\\"进行中\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(39, 96, 242)\\\"}\"]}",
          //       "flowBasicConfig": null,
          //       "leftButton": null,
          //       "shapeSelectPart": null
          //     },
          //     userObj: {
          //       "id": "64c8d0d863879354a5d12291",
          //       "userId": "64c8d0d863879354a5d12291",
          //       "userName": "64c8d0d863879354a5d12290",
          //       "password": null,
          //       "email": "",
          //       "phone": "133****2205",
          //       "emailValid": true,
          //       "fullName": "PO_192205",
          //       "photoFileName": null,
          //       "profile": {
          //         "occupation": null,
          //         "companyIndustry": null,
          //         "company": null,
          //         "country": null,
          //         "introduction": null,
          //         "schoolName": null,
          //         "specialty": null,
          //         "signature": null,
          //         "province": null,
          //         "city": null
          //       },
          //       "lastLogin": "2023-11-09 11:33:18",
          //       "registDate": "2023-08-01 17:31:04",
          //       "loginAddress": "192.168.10.13",
          //       "updateTime": "2023-11-09 11:33:18",
          //       "identity": "",
          //       "userSource": null,
          //       "registerType": "phone",
          //       "openId": null,
          //       "tutorial": true,
          //       "firstCreateChart": false,
          //       "locale": "zh",
          //       "dateFormat": "yyyy-MM-dd",
          //       "goldCoins": 0,
          //       "weeklyPublishCount": 0,
          //       "fieldHadGetCoins": null,
          //       "bgImg": null,
          //       "inviteCount": 0,
          //       "inviteClientCount": 0,
          //       "fromUrl": null,
          //       "photoUrl": "../../../../../src/assets/images/icon/empty_user.svg",
          //       "wpsUID": null,
          //       "guide": null,
          //       "teamGuide": null,
          //       "orgGuide": null,
          //       "boardGuide": null,
          //       "corpid": null,
          //       "channelType": null,
          //       "terminalType": null,
          //       "beforeLogin": "2023-11-09 10:25:03",
          //       "expert": false,
          //       "usedMind": false,
          //       "totalFileCount": 9,
          //       "auth": {
          //         "userConfigId": "64c8d0da63879354a5d12292",
          //         "userId": "64c8d0d863879354a5d12291",
          //         "fileSort": null,
          //         "fileView": "list",
          //         "folderId": null,
          //         "orgId": null,
          //         "orgFolderId": null,
          //         "teamId": null,
          //         "teamFolderId": null,
          //         "collaborationSort": null,
          //         "newDiagramLanguage": null,
          //         "newDiagramIndustry": null,
          //         "newDiagramCategory": "flow",
          //         "showToolbar": true,
          //         "dock": null,
          //         "designerTutorial": false,
          //         "mindTutorial": false,
          //         "mindCanvas": "false",
          //         "mindGuide": false,
          //         "mindTheme": null,
          //         "schema": null,
          //         "showCommentIco": true,
          //         "timeZone": null,
          //         "emailNotification": null,
          //         "showSettingPanel": false,
          //         "newFileCollection": null,
          //         "waterMark": null,
          //         "waterMarks": null,
          //         "outlineConfig": null,
          //         "newFileCategory": null,
          //         "mindConfig": "{\"tags\":[\"{\\\"text\\\":\\\"待定\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(122, 0, 242)\\\"}\",\"{\\\"text\\\":\\\"已确认\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(80, 194, 139)\\\"}\",\"{\\\"text\\\":\\\"已完成\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(109, 109, 109)\\\"}\",\"{\\\"text\\\":\\\"已关闭\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(196, 196, 196)\\\"}\",\"{\\\"text\\\":\\\"进行中\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(39, 96, 242)\\\"}\"]}",
          //         "flowBasicConfig": null,
          //         "leftButton": null,
          //         "shapeSelectPart": null
          //       },
          //       "usedFileCount": 2,
          //       "member": true,
          //       "orgMember": false,
          //       "balanceUserdFileCount": 0,
          //       "expireTime": "2024-09-26 23:59:59",
          //       "orgExpireTime": null
          //     },
          //     chartDefIds: [
          //       {
          //         "canvasId": "654d9521bdf29538ef403927",
          //         "definitionId": "654d9521bdf29538ef403924",
          //         "title": "画布1"
          //       },
          //       {
          //         "canvasId": "654d9ab0bdf29538ef40392d",
          //         "definitionId": "654d9ab0bdf29538ef40392d",
          //         "title": "画布2"
          //       }
          //     ], // 多画布用
          //     mainCanvasId: '654d9521bdf29538ef403924', // 主画布 id
          //     def: def[0] // 定义
          //   }
          //   // 更新indexedDB中数据
          //   DBUtil.save('charts', initData.chartObj)
          //   def.forEach((d, i) => {
          //     DBUtil.save('charts_def', { id: initData.chartDefIds[i].definitionId, definition: d })
          //   })
          //   DBUtil.save('charts_multiple_defIds', {
          //     id: initData.chartObj.chartId,
          //     chartCanvas: initData.chartDefIds,
          //     chartDefIds: initData.chartDefIds,
          //     mainCanvasId: initData.mainCanvasId
          //   })

          //   reslove(initData)
          // }
          // // 思维导图
          // if (url.indexOf('/outline/index.html') > -1) {

          //   const def = [
          //     '{"id":"root","leftChildren":[{"id":"9ea87c706d7983c9","parent":"root","children":[],"title":"分支主题","link":{"value":"http://www.baidu.com","type":"url","title":"测试"}}],"children":[{"id":"489d35ff04187d67","parent":"root","children":[],"title":"分支主题","image":{"w":300,"h":253.6997885835095,"direction":"up","url":"https://cdn.processon.com/64c8d0d863879354a5d12291-654d9620ac52e155ccc1adc5?e=1699587121&token=trhI0BY8QfVrIGn9nENop6JAc6l5nZuxhjQ62UfM:vfOL_pxqEHPmsUAwc9y1K5URgM8="}},{"id":"e213c8b3a6f6032e","parent":"root","children":[],"title":"分支主题","link":{},"file":{"value":"https://po-files.ks3-cn-beijing.ksyun.com/654d9521bdf29538ef403927_654d962ebdf29538ef40392a.js","type":"file","title":"789.js"}}],"title":"未命名文件","structure":"mind_free","root":true,"theme":"theme3","version":6,"showWatermark":false}',
          //     '{"leftChildren":[],"children":[],"root":true,"theme":"theme3","id":"root","title":"未命名文件","version":1,"structure":"mind_free"}'
          //   ]
          //   const initData = {
          //     chartObj: {
          //       "id": "654d9521bdf29538ef403927",
          //       "dbId": "2JAxGL61z8",
          //       "chartId": "654d9521bdf29538ef403927",
          //       "userId": "64c8d0d863879354a5d12291",
          //       "category": "mind_free",
          //       "owner": {
          //         "userId": "64c8d0d863879354a5d12291"
          //       },
          //       "deleted": false,
          //       "parentDeleted": false,
          //       "createDate": "2023-11-10 10:27:50",
          //       "lastModify": "2023-11-10 10:33:12",
          //       "folderId": "root",
          //       "folderDbId": "root",
          //       "version": 0,
          //       "template": false,
          //       "status": "private",
          //       "title": "未命名文件",
          //       "definitionId": "654d9521bdf29538ef403924",
          //       "definitionDbId": "41aaS1HsXf",
          //       "thumbnail": "654d9521bdf29538ef403925"
          //     }, // chart 信息
          //     authObj: {
          //       "userConfigId": "64c8d0da63879354a5d12292",
          //       "userId": "64c8d0d863879354a5d12291",
          //       "fileSort": null,
          //       "fileView": "list",
          //       "folderId": null,
          //       "orgId": null,
          //       "orgFolderId": null,
          //       "teamId": null,
          //       "teamFolderId": null,
          //       "collaborationSort": null,
          //       "newDiagramLanguage": null,
          //       "newDiagramIndustry": null,
          //       "newDiagramCategory": "flow",
          //       "showToolbar": true,
          //       "dock": null,
          //       "designerTutorial": false,
          //       "mindTutorial": false,
          //       "mindCanvas": "false",
          //       "mindGuide": false,
          //       "mindTheme": null,
          //       "schema": null,
          //       "showCommentIco": true,
          //       "timeZone": null,
          //       "emailNotification": null,
          //       "showSettingPanel": false,
          //       "newFileCollection": null,
          //       "waterMark": null,
          //       "waterMarks": null,
          //       "outlineConfig": null,
          //       "newFileCategory": null,
          //       "mindConfig": "{\"tags\":[\"{\\\"text\\\":\\\"待定\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(122, 0, 242)\\\"}\",\"{\\\"text\\\":\\\"已确认\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(80, 194, 139)\\\"}\",\"{\\\"text\\\":\\\"已完成\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(109, 109, 109)\\\"}\",\"{\\\"text\\\":\\\"已关闭\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(196, 196, 196)\\\"}\",\"{\\\"text\\\":\\\"进行中\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(39, 96, 242)\\\"}\"]}",
          //       "flowBasicConfig": null,
          //       "leftButton": null,
          //       "shapeSelectPart": null
          //     },
          //     userObj: {
          //       "id": "64c8d0d863879354a5d12291",
          //       "userId": "64c8d0d863879354a5d12291",
          //       "userName": "64c8d0d863879354a5d12290",
          //       "password": null,
          //       "email": "",
          //       "phone": "133****2205",
          //       "emailValid": true,
          //       "fullName": "PO_192205",
          //       "photoFileName": null,
          //       "profile": {
          //         "occupation": null,
          //         "companyIndustry": null,
          //         "company": null,
          //         "country": null,
          //         "introduction": null,
          //         "schoolName": null,
          //         "specialty": null,
          //         "signature": null,
          //         "province": null,
          //         "city": null
          //       },
          //       "lastLogin": "2023-11-09 11:33:18",
          //       "registDate": "2023-08-01 17:31:04",
          //       "loginAddress": "192.168.10.13",
          //       "updateTime": "2023-11-09 11:33:18",
          //       "identity": "",
          //       "userSource": null,
          //       "registerType": "phone",
          //       "openId": null,
          //       "tutorial": true,
          //       "firstCreateChart": false,
          //       "locale": "zh",
          //       "dateFormat": "yyyy-MM-dd",
          //       "goldCoins": 0,
          //       "weeklyPublishCount": 0,
          //       "fieldHadGetCoins": null,
          //       "bgImg": null,
          //       "inviteCount": 0,
          //       "inviteClientCount": 0,
          //       "fromUrl": null,
          //       "photoUrl": "../../../../../src/assets/images/icon/empty_user.svg",
          //       "wpsUID": null,
          //       "guide": null,
          //       "teamGuide": null,
          //       "orgGuide": null,
          //       "boardGuide": null,
          //       "corpid": null,
          //       "channelType": null,
          //       "terminalType": null,
          //       "beforeLogin": "2023-11-09 10:25:03",
          //       "expert": false,
          //       "usedMind": false,
          //       "totalFileCount": 9,
          //       "auth": {
          //         "userConfigId": "64c8d0da63879354a5d12292",
          //         "userId": "64c8d0d863879354a5d12291",
          //         "fileSort": null,
          //         "fileView": "list",
          //         "folderId": null,
          //         "orgId": null,
          //         "orgFolderId": null,
          //         "teamId": null,
          //         "teamFolderId": null,
          //         "collaborationSort": null,
          //         "newDiagramLanguage": null,
          //         "newDiagramIndustry": null,
          //         "newDiagramCategory": "flow",
          //         "showToolbar": true,
          //         "dock": null,
          //         "designerTutorial": false,
          //         "mindTutorial": false,
          //         "mindCanvas": "false",
          //         "mindGuide": false,
          //         "mindTheme": null,
          //         "schema": null,
          //         "showCommentIco": true,
          //         "timeZone": null,
          //         "emailNotification": null,
          //         "showSettingPanel": false,
          //         "newFileCollection": null,
          //         "waterMark": null,
          //         "waterMarks": null,
          //         "outlineConfig": null,
          //         "newFileCategory": null,
          //         "mindConfig": "{\"tags\":[\"{\\\"text\\\":\\\"待定\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(122, 0, 242)\\\"}\",\"{\\\"text\\\":\\\"已确认\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(80, 194, 139)\\\"}\",\"{\\\"text\\\":\\\"已完成\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(109, 109, 109)\\\"}\",\"{\\\"text\\\":\\\"已关闭\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(196, 196, 196)\\\"}\",\"{\\\"text\\\":\\\"进行中\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(39, 96, 242)\\\"}\"]}",
          //         "flowBasicConfig": null,
          //         "leftButton": null,
          //         "shapeSelectPart": null
          //       },
          //       "usedFileCount": 2,
          //       "member": true,
          //       "orgMember": false,
          //       "balanceUserdFileCount": 0,
          //       "expireTime": "2024-09-26 23:59:59",
          //       "orgExpireTime": null
          //     },
          //     chartDefIds: [
          //       {
          //         "canvasId": "654d9521bdf29538ef403927",
          //         "definitionId": "654d9521bdf29538ef403924",
          //         "title": "画布1"
          //       },
          //       {
          //         "canvasId": "654d9ab0bdf29538ef40392d",
          //         "definitionId": "654d9ab0bdf29538ef40392d",
          //         "title": "画布2"
          //       }
          //     ], // 多画布用
          //     mainCanvasId: '654d9521bdf29538ef403924', // 主画布 id
          //     def: def[0] // 定义
          //   }
          //   // 更新indexedDB中数据
          //   DBUtil.save('charts', initData.chartObj)
          //   def.forEach((d, i) => {
          //     DBUtil.save('charts_def', { id: initData.chartDefIds[i].definitionId, definition: d })
          //   })
          //   DBUtil.save('charts_multiple_defIds', {
          //     id: initData.chartObj.chartId,
          //     chartCanvas: initData.chartDefIds,
          //     chartDefIds: initData.chartDefIds,
          //     mainCanvasId: initData.mainCanvasId
          //   })

          //   reslove(initData)
          // }
          break;
        // 获取系统配置
        case 'getGlobal': // data= brhost / host / avatar / appPath
          break;
        case 'loadFileB64':
          ipc.invoke('loadFileB64', data).then((res) => {
            const result = res
            result.code == 201 && reslove('')
            if (data.path.indexOf('.json') > -1) {
              result.code == 200 && reslove(importClass.base64stringToString(result.data))
            }
            else {
              result.code == 200 && reslove(result.data)
            }
          })
          break;
        case 'loadFileUtf8B64':
          ipc.invoke('loadFileUtf8B64', data).then((res) => {
            const result = res
            result.code == 201 && reslove('')
            if (data.path.indexOf('.json') > -1) {
              result.code == 200 && reslove(importClass.base64stringToString(result.data))
            }
            else {
              result.code == 200 && reslove(result.data)
            }
          })
          break;
        // 保存文件
        case 'saveFileB64':
          if (data && data.type === 'save' && window.poExportWait) {
            window.poExportWait.closeForSave()
          }
          ipc.invoke('saveFileB64', data).then((res) => {
            reslove(res.path)
          })
          break;
        case 'saveFileB64BYEMF':
          // console.log('begin',Date.now())
          ipc.invoke('saveFileB64BYEMF', data).then((res) => {
            reslove(res.path)
          })
          break;
        case 'webRoot':
          ipc.invoke('webRoot').then((res) => {
            reslove(res)
          })
          break;
        case 'SystemUserName':
          ipc.invoke('SystemUserName').then((res) => {
            reslove(res)
          })
          break;
        case 'DeviceGuid': // 机器码
          ipc.invoke('DeviceGuid').then((res) => {
            reslove(res)
          })
          break;
        case 'cachePath': // 缓存目录
          ipc.invoke('cachePath').then((res) => {
            reslove(res)
          })
          break;
        case 'copyFile':
          ipc.invoke('copyFile', data).then((res) => {
            reslove(res)
          })
          break;
        case 'copyDir':
          ipc.invoke('copyDir', data).then((res) => {
            reslove(res)
          })
          break;
        case 'removeFile':
          ipc.invoke('removeFile', data).then((res) => {
            reslove(res)
          })
          break;
      }
    })
  },
  /**
   * 监听方法
   * @param {*} channel 
   * @param {*} data 
   */
  on: function (channel, data) {

  }
}

// 导入类
const importClass = {

  /**
   * 根据文件名走不同定义转化
   * @param {*} path 
   */
  fileToDef(path) {
    const posM = /.*(\.pos|\.posf|\.posm|\.poso|\.bak)$/g
    const xmindM = /.*\.xmind$/g
    const mmapM = /.*\.mmap$/g
    const mmM = /.*\.mm$/g
    const kmM = /.*\.km$/g
    const txtM = /.*\.txt$/g
    const opmlM = /.*\.opml$/g
    const excelM = /.*(\.csv|\.xlsx|\.xls)$/g
    const visioM = /.*(\.vsdx|\.vsd)$/g
    const eddxM = /.*(\.eddx)$/g
    const markdownM = /.*(\.md)$/g

    if (posM.test(path)) {
      return posToDef.load(path)
    }
    else if (xmindM.test(path)) {
      return xmindToDef.newload(path)
    }
    else if (mmapM.test(path)) {
      return mmapToDef.load(path)
    }
    else if (mmM.test(path)) {
      return mmToDef.load(path)
    }
    else if (kmM.test(path)) {
      return kmToDef.load(path)
    }
    else if (txtM.test(path)) {
      return txtToDef.load(path)
    }
    else if (opmlM.test(path)) {
      return opmlToDef.load(path)
    }
    else if (excelM.test(path)) {
      return excelToDef.load(path)
    }
    else if (visioM.test(path)) {
      return visioToDef.load(path)
    }
    else if (eddxM.test(path)) {
      return eddxToDef.load(path)
    }
    else if (markdownM.test(path)) {
      return markdownToDef.load(path)
    }
    else {
      new Toast({ type: "error", msg: "当前格式不支持" })
      return
    }
  },
  /**
   * 字符串转base64字符串
   * @param {*} str 
   * @returns 
   */
  stringToBase64String(str) {
    return btoa(unescape(encodeURIComponent(str)))
  },
  /**
   * base64字符串转字符串
   * @param {*} str 
   * @returns 
   */
  base64stringToString(str) {
    return decodeURIComponent(escape(atob(str)))
  },
  /**
   * file对象转Base64字符串
   * @param {*} file 
   * @returns 
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  },
  base64ToArrayBuffer(base64, isCSV = false) {
    let binaryString = !isCSV ? window.atob(base64) : decodeURIComponent(escape(atob(base64)));
    let len = binaryString.length;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  },
  /**
   * 生成新的id
   * @param {"Number"} n
   * @returns {string}
   */
  newId: function (n) {
    n = n || 10;
    var chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
    var res = "";
    for (var i = 0; i < n; i++) {
      var id = Math.ceil(Math.random() * 62);
      res += chars[id] || "";
    }
    return res;
  },
  /**
   * 生成空的chart信息
   * @param {*} id chartId
   * @param {flow,mind,outline} id chart类型
   */
  newChart: function (id, type, isChartDefIds = false) {
    const obj = {
      chartObj: {},// 文件定义
      authObj: {}, //  身份信息
      userObj: {},//  用户信息
      chartDefIds: [],// 多画布文件定义 id集合 不传默认defenitionId
      mainCanvasId: '',// 主画布id
      def: '' //当前打开的文件定义
    }
    let mindConfig = localStorage.getItem('mindConfig')
    mindConfig = mindConfig ? mindConfig : "{\"tags\":[\"{\\\"text\\\":\\\"待定\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(122, 0, 242)\\\"}\",\"{\\\"text\\\":\\\"已确认\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(80, 194, 139)\\\"}\",\"{\\\"text\\\":\\\"已完成\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(109, 109, 109)\\\"}\",\"{\\\"text\\\":\\\"已关闭\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(196, 196, 196)\\\"}\",\"{\\\"text\\\":\\\"进行中\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(39, 96, 242)\\\"}\"]}"
    let outlineConfig = localStorage.getItem('outlineConfig')
    outlineConfig = outlineConfig ? outlineConfig : null
    // 权限对象
    obj.authObj = {
      "userConfigId": "1",
      "userId": window.userId || localStorage.getItem('processon_userKey') || '',
      "fileSort": null,
      "fileView": "list",
      "folderId": null,
      "orgId": null,
      "orgFolderId": null,
      "teamId": null,
      "teamFolderId": null,
      "collaborationSort": null,
      "newDiagramLanguage": null,
      "newDiagramIndustry": null,
      "newDiagramCategory": "flow",
      "showToolbar": true,
      "dock": null,
      "designerTutorial": false,
      "mindTutorial": false,
      "mindCanvas": "false",
      "mindGuide": false,
      "mindTheme": null,
      "schema": null,
      "showCommentIco": true,
      "timeZone": null,
      "emailNotification": null,
      "showSettingPanel": false,
      "newFileCollection": null,
      "waterMark": null,
      "waterMarks": null,
      "outlineConfig": outlineConfig,
      "newFileCategory": null,
      "mindConfig": mindConfig,
      "flowBasicConfig": null,
      "leftButton": null,
      "shapeSelectPart": false
    }
    // 用户对象

    obj.userObj = {
      "id": window.userId || localStorage.getItem('processon_userKey') || '',
      "userId": window.userId || localStorage.getItem('processon_userKey') || '',
      "userName": "",
      "password": null,
      "email": "",
      "phone": "133****2205",
      "emailValid": true,
      "fullName": window.fullName,
      "photoFileName": null,
      "profile": {
        "occupation": null,
        "companyIndustry": null,
        "company": null,
        "country": null,
        "introduction": null,
        "schoolName": null,
        "specialty": null,
        "signature": null,
        "province": null,
        "city": null
      },
      "lastLogin": "2023-11-03 15:38:31",
      "registDate": "2023-08-01 17:31:04",
      "loginAddress": "192.168.10.13",
      "updateTime": "2023-10-30 14:01:27",
      "identity": "",
      "userSource": null,
      "registerType": "phone",
      "openId": null,
      "tutorial": true,
      "firstCreateChart": false,
      "locale": "zh",
      "dateFormat": "yyyy-MM-dd",
      "goldCoins": 0,
      "weeklyPublishCount": 0,
      "fieldHadGetCoins": null,
      "bgImg": null,
      "inviteCount": 0,
      "inviteClientCount": 0,
      "fromUrl": null,
      "photoUrl": "../../../../../src/assets/images/icon/empty_user.svg",
      "wpsUID": null,
      "guide": null,
      "teamGuide": null,
      "orgGuide": null,
      "boardGuide": null,
      "corpid": null,
      "channelType": null,
      "terminalType": null,
      "beforeLogin": "2023-10-30 11:34:13",
      "expert": false,
      "usedMind": false,
      "totalFileCount": 9,
      "auth": {
      },
      "usedFileCount": 0,
      "member": true,
      "orgMember": false,
      "balanceUserdFileCount": 0,
      "expireTime": "2024-09-26 23:59:59",
      "orgExpireTime": null
    }

    let category = ''
    if (type == 'flow') {
      category = 'flow'
      obj.chartObj = {
        "deleted": false,
        "parentDeleted": false,
        "dbId": id,
        "id": id,
        "chartId": id,
        "title": "未命名文件",
        "definitionId": id,
        "owner": {
          "userId": window.userId,
          "userName": "",
          "fullName": window.pcName
        },
        "ownerId": null,
        "description": "",
        "category": category,
        "thumbnail": "6544a4bf4f06142be77de3ae",
        "imgOriginal": null,
        "shapeCount": 0,
        "status": "private",
        "folderId": "root",
        "language": null,
        "version": 0,
        "tags": null,
        "teamId": null,
        "schema": [
          "standard",
          "basic",
          "flow",
          "lane",
        ],
        "viewLinkId": null,
        "cloneId": null,
        "cloneTime": null,
        "newCreate": true,
        "corpid": null,
        "sortNum": 0,
        "likeCount": 0,
        "commentCount": 0,
        "favouriteCount": 0,
        "viewCount": 0,
        "cloneCount": 0,
        "publicClonePrice": 0,
        "orgId": null,
        "collaRole": null,
        "sourceName": null,
        "createTime": "",
        "lastModify": "",
        "publicClone": false,
        "canvasCount": 2,
        "favourite": false,
        "belongtoTeam": false,
        "openColla": false,
        "openLinkColla": false,
        "userId": window.userId
      } // chart 信息
    }
    // 思维导图/思维笔记/markdown的chartObj
    else {
      category = type == 'mind' ? 'mind_free' : type == 'markdown' ? 'markdown' : 'outline'
      obj.chartObj = {
        "id": id,
        "dbId": id,
        "chartId": id,
        "userId": window.userId,
        "category": category,
        "owner": {
          "userId": window.userId
        },
        "deleted": false,
        "parentDeleted": false,
        "createDate": "2023-11-10 10:27:50",
        "lastModify": "2023-11-10 10:33:12",
        "folderId": "root",
        "folderDbId": "root",
        "version": 0,
        "template": false,
        "status": "private",
        "title": "未命名文件",
        "definitionId": id,
        "definitionDbId": id,
        "thumbnail": ""
      }
    }
    if (isChartDefIds) {
      obj.chartDefIds = this.newChartDefIds(obj.chartObj.id)
      obj.mainCanvasId = obj.chartDefIds[0].canvasId
      obj.chartObj.definitionId = obj.mainCanvasId
    }
    return obj
  },
  newChartDefIds: function (id = importClass.newId()) {
    const canvasId = id
    const definitionId = canvasId
    return [{
      canvasId,
      definitionId,
      title: '画布1'
    }]
  },
  /**
   * 保存indexDB
   * @param {*} obj 
   * @param {*} defs 
   */
  dbSave(obj, defs) {
    DBUtil.save('charts', obj.chartObj)
    defs.forEach((d, i) => {
      if (!Object.hasOwnProperty.call(d, 'title') && !Object.hasOwnProperty.call(d, 'page') &&
        !Object.hasOwnProperty.call(d, 'element')) {
        const index = obj.chartDefIds.findIndex(dc => dc.definitionId === d.id)
        if (index > -1) {
          DBUtil.save('charts_def', { id: obj.chartDefIds[index].definitionId, definition: JSON.stringify(d.data) })
        }
      }
      else {
        DBUtil.save('charts_def', { id: obj.chartDefIds[i].definitionId, definition: JSON.stringify(d) })
      }
    })
    DBUtil.save('charts_multiple_defIds', {
      id: obj.chartObj.chartId,
      chartCanvas: obj.chartDefIds,
      chartDefIds: obj.chartDefIds,
      mainCanvasId: obj.mainCanvasId
    })
  },
  /**
   * 图片保存
   * @param {*} str 
   * @param {*} id 
   * @param {*} imagesUrls 
   * @returns 
   */
  savePngByBase64(str, id, imagesUrls) {
    const fileId = this.newId()
    return new Promise((reslove) => {
      ipc1.sendSync('saveFileB64', { type: 'cache', data: str.split(',')[1], path: `back/${id}/${fileId}.png`, suffix: '' }).then((res) => {
        let img = new Image();
        let base64Image = str;
        // 当图片加载完成后，我们可以获取其宽度和高度  
        img.onload = function () {
          let width = img.width;
          let height = img.height;
          console.log("Width: " + width + ", Height: " + height);
          if (width > 300) {
            width = 300;
            height = 200;
          }

          imagesUrls.push({ name: name, path: `/${fileId}?`, url: `file:///${res}` })
          reslove({
            "w": width,
            "h": height,
            "url": `file:///${res}`,
            "direction": "up"
          })
        };
        img.src = base64Image
      })
    })
  },
  /**
   * html转义
   * @param {*} html 
   * @returns 
   */
  htmlEncode: function (html) {
    //1.首先动态创建一个容器标签元素，如DIV
    var temp = document.createElement("div");
    //2.然后将要转换的字符串设置为这个元素的innerText(ie支持)或者textContent(火狐，google支持)
    (temp.textContent != undefined) ? (temp.textContent = html) : (temp.innerText = html);
    //3.最后返回这个元素的innerHTML，即得到经过HTML编码转换的字符串了
    var output = temp.innerHTML;
    temp = null;
    return output;
  },
  arrayBufferToBase64: function (buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  },
  base64ToBlob(base64Str, contentType = '') {
    // 去除Base64字符串的前缀，如"data:image/png;base64,"  
    const byteString = atob(base64Str);

    // 创建一个表示字节的Uint8Array  
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    // 如果提供了contentType，则使用它；否则，默认为空字符串  
    return new Blob([ab], { type: contentType });
  },
  base64ToFile(base64Url, filename) {
    // 获取到base64编码
    const arr = base64Url.split(',');

    // 检查 MIME 类型是否存在
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : ''; // 如果匹配失败，设置 mime 为空字符串

    // 将 Base64 编码转为字符串
    const bstr = atob(arr.length > 1 ? arr[1] : arr[0]);
    let n = bstr.length;

    // 创建包含 length 个元素的 Uint8Array
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    // 返回 File 对象
    return new File([u8arr], filename, { type: mime });
  },
  fileSVGToBase64Png(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const svgString = e.target.result;
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = function () {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png'); // 将Canvas转换为Base64编码的PNG图像
          resolve(dataUrl)
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))); // 将SVG转换为Data URL格式并解码为Base64
      };
      reader.readAsText(file);
    })
  },
  blobToBase64Simple(blob){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        // 移除 data URL 前缀（如：data:image/png;base64,）
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      
      reader.onerror = reject;
      
      // 读取 Blob 为 Data URL
      reader.readAsDataURL(blob);
    });
  }
}

/**
 * pos转换
 */
const posToDef = {
  /**
  * pos内容转定义
  * @param { 例子：C:/usr/123.pos  } path 绝对路径
  */
  load(path) {
    return new Promise((reslove, reject) => {
      let isLoadHistory = false
      let type = ''
      let history = []
      let newFile = false
      if ((/.*(\.pof|\.posm)$/g).test(path)) {
        type = 'mind'
      } else if ((/.*(\.poso)$/g).test(path)) {
        type = 'outline'
      } else if ((/.*(\.pos|\.posf)$/g).test(path)) {
        type = 'flow'
      } else {
        type = 'flow'
      }
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'history/cache.json' }).then((hisD) => {
        isLoadHistory = true
        if (hisD != '') {
          history = JSON.parse(hisD)
        }
      })
      // 读取文件内容
      ipc1.sendSync('loadFileB64', { type: 'local', path: path }).then((data) => {
        // 线上pos文件
        if ((/.*\.pos$/g).test(path)) {
          try {
            data = JSON.parse(importClass.base64stringToString(data))
            if (data.meta.id == '') {
              data.meta.id = importClass.newId()
              data.meta.diagramInfo.category = 'flow'
            }
            // 返回定义
            const obj = {
              chartObj: {},// 文件定义
              authObj: {}, //  身份信息
              userObj: {},//  用户信息
              chartDefIds: [],// 多画布文件定义 id集合 不传默认defenitionId
              mainCanvasId: '',// 主画布id
              def: '' //当前打开的文件定义
            }
            let id = '';
            let title = '';
            let category = '';
            const defs = []
            const meta = data.meta
            if (!meta.id || meta.id.length > 13) {
              id = importClass.newId()
              data.meta.id = id
              ipc1.sendSync('saveFileB64',
                { type: 'local', path: path, data: importClass.stringToBase64String(JSON.stringify(data)), suffix: '' }
              )
            }
            else {
              id = meta.id
            }
            title = meta.diagramInfo.title
            category = meta.diagramInfo.category
            if (Object.hasOwn(data.diagram.elements, 'children') && category == 'flow') {
              category = 'mind_free'
              data.meta.diagramInfo.category = category
            }
            if (category == 'outline') {
              type = 'outline'
              if (window.location.href.indexOf('diagrams') > -1) {
                ipc.sendToHost('updateTabUrl', { id: window.TABGROUPID, url: decodeURIComponent(window.location.href.replace('diagrams', 'outline')) })
              }
            }
            if ((category.indexOf("mind") >= 0 || ['fishbone', 'timeline', 'ishikawa'].includes(category))
              && type == 'flow') {
              if (window.location.href.indexOf('diagrams') > -1) {
                // window.location.href = window.location.href.replace('diagrams', 'mindmap')
                ipc.sendToHost('updateTabUrl', { id: window.TABGROUPID, url: decodeURIComponent(window.location.href.replace('diagrams', 'mindmap')) })
              }
              type = 'mind'
            }
            obj.mainCanvasId = meta.id
            obj.chartDefIds = [{
              canvasId: id,
              definitionId: id,
              title: '画布1',
              sort: 0
            }]
            if (type == 'flow') {
              data.diagram.elements.page.richText = true
            }
          
            defs.push({ id: id, data: data.diagram.elements })
            obj.def = JSON.stringify(defs[0].data)
            const newObj = importClass.newChart(id, type)
            obj.authObj = newObj.authObj
            obj.userObj = newObj.userObj
            obj.chartObj = newObj.chartObj
            this.posToPosf(obj, defs, path, type, id).then((res) => {
              importClass.dbSave(res.obj, res.defs)
              reslove(res.obj)
            })
            return
          }
          catch { 
          }
        }
        // 读取压缩内容
        JSZip.loadAsync(data, { base64: true }).then((res) => {
          let count = 0;
          for (const filename in res.files) {
            count++
          }
          let index = 0;
          // 返回定义
          const obj = {
            chartObj: {},// 文件定义
            authObj: {}, //  身份信息
            userObj: {},//  用户信息
            chartDefIds: [],// 多画布文件定义 id集合 不传默认defenitionId
            mainCanvasId: '',// 主画布id
            def: '' //当前打开的文件定义
          }
          let id = '';
          if (window.istemp) {
          }
          let title = '';
          let category = '';
          const imagesPath = []
          let imagesUrls = []
          const filesPath = []
          let filesUrls = []
          let defs = []
          const posFile = []

          // 先读取meta.json获取基础信息
          res.files['meta.json'].async('string').then((content) => {
            index++;
            const meta = JSON.parse(content)
            id = meta.id
            if (window.istemp) {
              id = importClass.newId()
              meta.id = id
              meta.pages[0].canvasId = id
              meta.pages[0].definitionId = id
            }
            title = meta.diagramInfo.title
            category = meta.diagramInfo.category
            if ((category.indexOf("mind") >= 0 || ['fishbone', 'timeline', 'ishikawa'].includes(category)) && type == 'flow') {
              if (window.location.href.indexOf('diagrams') > -1) {
                ipc.sendToHost('updateTabUrl', { id: window.TABGROUPID, url: decodeURIComponent(window.location.href.replace('diagrams', 'mindmap')) })
                // window.location.href = window.location.href.replace('diagrams', 'mindmap')
              }
              type = 'mind'
            }
            if (path.endsWith('.bak')) {
              if (category.indexOf("mind") >= 0 || ['fishbone', 'timeline', 'ishikawa'].includes(category)) {
                type = 'mind'
              }
              else {
                type = 'flow'
              }
            }
            obj.mainCanvasId = window.istemp ? id : meta.mainCanvasId

            obj.chartDefIds = meta.pages
            // 遍历文件
            for (let filename in res.files) {
              // 文件夹不解析
              if (res.files[filename].dir) {
                index++;
              } else {
                // meta.json跳过
                if (filename == 'meta.json') {

                }
                // json和pos文件直接当成字符串解析
                else if (filename.indexOf('.json') > -1 || (filename.indexOf('.pos') > -1 && filename.indexOf('files/') != 0)) {

                  res.files[filename].async('string').then((contentc) => {
                    // 文件obj
                    if (filename == 'chartObj.json') {
                      obj.chartObj = JSON.parse(contentc)
                    }
                    // pos文件
                    else {
                      const posData = JSON.parse(contentc)
                      // 储存
                      defs.push({ id: posData.meta.id, data: posData.diagram.elements })
                      posFile.push({ id: posData.meta.id, data: posData })
                    }
                    index++;
                  })
                }
                // 图片或者附件
                else if (filename.indexOf('attachment/') == 0 || filename.indexOf('files/') == 0) {
                  new Promise((reslove, reject) => {

                    // console.log('file-load-begin', Date.now())
                    res.files[filename].async('base64').then((content) => {
                      // console.log('file-load-end', Date.now())
                      // console.log('file-load-tohex', Date.now())
                      let newfilename = filename.replace('attachment/', '').replace('files/', '')
                      // 判断是否已经下载避免重复请求
                      if (imagesPath.length == 0 || imagesPath.findIndex(d => d.name == newfilename) < 0) {
                        let savePath = ''
                        if (newfilename.lastIndexOf('.') > -1) {
                          let imageData = ''
                          try {
                            imageData = importClass.base64stringToString(content)
                          } catch (e) {
                          }
                          if (imageData.startsWith('<svg') || imageData.startsWith('< svg')) {
                            savePath = `back/${id}/${newfilename.substring(0, newfilename.lastIndexOf('.'))}.svg`
                            if (!newfilename.endsWith('.svg')) {
                              newfilename = newfilename.substring(0, newfilename.lastIndexOf('.')) + '.svg'
                            }
                          }
                          else {
                            savePath = `back/${id}/${newfilename}`
                          }
                        }
                        else {
                          savePath = `back/${id}/${newfilename}`
                        }
                        // console.log('file-begin', Date.now())
                        // window.appConfig.logd('file-begin-' + newfilename)
                        ipc1.sendSync('saveFileB64',
                          { type: 'cache', path: savePath, data: content, suffix: '' }
                        ).then((ipcres) => {
                          // window.appConfig.logd('file-end-' + newfilename)
                          // console.log('file-end', Date.now())
                          // 图片
                          if (filename.indexOf('attachment/') == 0) {
                            imagesPath.push({ name: newfilename, path: ipcres })
                          }
                          // 附件
                          if (filename.indexOf('files/') == 0) {
                            filesPath.push({ name: newfilename, path: ipcres })
                          }
                          reslove()
                          // index++;
                        })
                        // reslove()
                      }
                      else {
                        reslove()
                        // index++;
                      }
                    })
                  }).then(() => {
                    index++;
                  })
                }
                else {
                  index++
                }
              }
            }

            // 定时查看是否读取完成
            const intelval = setInterval(() => {
              // console.log(count)
              // console.log(index)
              if (count == index && isLoadHistory) {
                clearInterval(intelval)
                const newzip = new JSZip()
                // 判断是否需要修改导入文件
                if (!path.endsWith('.bak')) {
                  if (id.length > 16) {
                    newFile = true
                  }
                  else if (history.length > 0) {
                    const nowHistory = history.find(dt => dt.chartId == id)
                    if (nowHistory) {
                      if (nowHistory.filepath != path) {
                        newFile = true
                      }
                    }
                  }
                  else if (id == '') {
                    newFile = true
                  }
                }
                if (newFile) {
                  const newPosFile = []
                  const newDefs = []
                  id = importClass.newId()
                  obj.chartDefIds.forEach((dt) => {
                    const posData = posFile.find(dd => dd.id == dt.definitionId)
                    dt.canvasId = importClass.newId()
                    dt.definitionId = dt.canvasId
                    posData.data.meta.id = dt.canvasId
                    posData.data.meta.mainCanvasId = dt.canvasId
                    newPosFile.push({ id: dt.canvasId, data: posData.data })
                    newDefs.push({ id: dt.canvasId, data: posData.data.diagram.elements })
                  })
                  obj.mainCanvasId = obj.chartDefIds[0].canvasId
                  obj.chartObj.chartId = id
                  obj.chartObj.id = id
                  obj.chartObj.definitionId = obj.chartDefIds[0].definitionId
                  obj.chartObj.title = title
                  defs = newDefs


                  meta.id = id
                  meta.mainCanvasId = obj.mainCanvasId
                  meta.pages = obj.chartDefIds

                  const imgs = newzip.folder('attachment')
                  const files = newzip.folder('files')
                  newzip.file('meta.json', JSON.stringify(meta))
                  Object.keys(res.files).forEach((filename) => {
                    if (filename.startsWith('attachment/') && !res.files[filename].dir) {
                      imgs.file(filename.replace('attachment/', ''), res.file(filename).async('base64'), { base64: true })
                    }
                    else if (filename.startsWith('files/') && !res.files[filename].dir) {
                      files.file(filename.replace('files/', ''), res.file(filename).async('base64'), { base64: true })
                    }
                  })
                  newPosFile.forEach((dt) => {
                    newzip.file(`${dt.id}.pos`, JSON.stringify(dt.data))
                  })
                  newzip.generateAsync({ type: 'base64' }).then((content) => {
                    ipc1.sendSync('saveFileB64', { type: 'local', path: path, data: content }).then(() => {

                      // if (themes.length > 0) {
                      //   ipc1.sendSync('saveFileB64', { type: 'cache', path: 'theme/config.json', data: importClass.stringToBase64String(JSON.stringify(themes)) })
                      // }
                      // 赋值
                      const newObj = importClass.newChart(id, type)
                      obj.authObj = newObj.authObj
                      obj.userObj = newObj.userObj
                      // 如果没有chartObj.json文件
                      if (!Object.hasOwnProperty.call(obj.chartObj, 'category')) {
                        obj.chartObj = newObj.chartObj
                      }
                      if (meta.mainCanvasId != obj.chartObj.mainCanvasId) {
                        obj.chartObj.mainCanvasId = meta.mainCanvasId
                      }
                      if (meta.pages[0].definitionId != obj.chartObj.definitionId) {
                        obj.chartObj.definitionId = meta.pages[0].definitionId
                        obj.chartObj.definitionDbId = meta.pages[0].definitionId
                      }
                      if (title != obj.chartObj.title) {
                        obj.chartObj.title = title
                      }
                      obj.chartObj.category = category

                      var pageId = localStorage.getItem("page_local_" + obj.chartObj.chartId);
                      const maindefinitionId = pageId && obj.chartDefIds.find((item) => item.definitionId == pageId) ?
                        obj.chartDefIds.find((item) => item.definitionId == pageId).canvasId : obj.chartDefIds[0].canvasId;
                      obj.mainCanvasId = maindefinitionId
                      // 修改节点对应的上传图片和附件
                      defs.forEach((d, i) => {
                        if (window.istemp && i == 0) {
                          d.id = id
                        }
                        // 流程图遍历
                        if (type == 'flow') {
                          window.defVersion.push({ id: d.id, version: 1, isSave: true })
                          // window.defVersion.push({ id: d.id, version: d.data.version })
                          for (const k in d.data.elements) {
                            // 图片类型节点
                            if (d.data.elements[k].name == 'standardImage') {
                              let a = imagesPath.filter(f => d.data.elements[k].fillStyle.fileId.indexOf('/' + f.name.substring(0, f.name.lastIndexOf('.'))) > -1);
                              if (a.length > 0) {
                                imagesUrls.push({
                                  name: a[0].name, path: d.data.elements[k].fillStyle.fileId, url: a[0].path
                                })
                                d.data.elements[k].fillStyle.fileId = 'file:///' + a[0].path
                              }
                            }
                          }
                        }
                        // 思维导图和思维笔记
                        else {
                          window.defVersion.push({ id: d.id, version: 1, isSave: true })
                          const urls = this.mindImagesFiles(d.data, imagesPath, filesPath, imagesUrls, filesUrls)
                          imagesUrls = urls.imagesUrls
                          filesUrls = urls.filesUrls
                        }
                        // 如果是主画布
                        if (d.id == obj.mainCanvasId) {
                          obj.def = JSON.stringify(d.data)
                        }
                      });
                      window.cacheImages = imagesUrls
                      window.cacheFiles = filesUrls

                      // 保存路径备份
                      ipc1.sendSync('saveFileB64',
                        { type: 'cache', path: `back/${id}/attachment.json`, data: importClass.stringToBase64String(JSON.stringify(imagesUrls)), suffix: '' }
                      )
                      ipc1.sendSync('saveFileB64',
                        { type: 'cache', path: `back/${id}/files.json`, data: importClass.stringToBase64String(JSON.stringify(filesUrls)), suffix: '' }
                      )
                      // console.log(Date.now())
                      importClass.dbSave(obj, defs)
                      reslove(obj)
                    })
                  })
                }
                else {
                  // 赋值
                  const newObj = importClass.newChart(id, type)
                  obj.authObj = newObj.authObj
                  obj.userObj = newObj.userObj
                  // 如果没有chartObj.json文件
                  if (!Object.hasOwnProperty.call(obj.chartObj, 'category')) {
                    obj.chartObj = newObj.chartObj
                  }
                  if (meta.mainCanvasId != obj.chartObj.mainCanvasId) {
                    obj.chartObj.mainCanvasId = meta.mainCanvasId
                  }
                  if (meta.pages[0].definitionId != obj.chartObj.definitionId) {
                    obj.chartObj.definitionId = meta.pages[0].definitionId
                    obj.chartObj.definitionDbId = meta.pages[0].definitionId
                  }
                  if (title != obj.chartObj.title) {
                    obj.chartObj.title = title
                  }
                  obj.chartObj.category = category

                  var pageId = localStorage.getItem("page_local_" + obj.chartObj.chartId);
                  const maindefinitionId = pageId && obj.chartDefIds.find((item) => item.definitionId == pageId) ?
                    obj.chartDefIds.find((item) => item.definitionId == pageId).canvasId : obj.chartDefIds[0].canvasId;
                  obj.mainCanvasId = maindefinitionId
                  // 修改节点对应的上传图片和附件
                  defs.forEach((d, i) => {
                    if (window.istemp && i == 0) {
                      d.id = id
                    }
                    // 流程图遍历
                    if (type == 'flow') {
                      window.defVersion.push({ id: d.id, version: 1, isSave: true })
                      // window.defVersion.push({ id: d.id, version: d.data.version })
                      for (const k in d.data.elements) {
                        // 图片类型节点
                        if (d.data.elements[k].name == 'standardImage') {
                          let a = imagesPath.filter(f => d.data.elements[k].fillStyle.fileId.indexOf('/' + f.name.substring(0, f.name.lastIndexOf('.')) + '?') > -1);
                          if (a.length > 0) {
                            imagesUrls.push({
                              name: a[0].name, path: d.data.elements[k].fillStyle.fileId, url: a[0].path
                            })
                            d.data.elements[k].fillStyle.fileId = 'file:///' + a[0].path
                          }
                        } else if (d.data.elements[k].name.indexOf('image_search_') == 0) {
                          let a = imagesPath.filter(f => d.data.elements[k].fillStyle.fileId.indexOf('/' + f.name.substring(0, f.name.lastIndexOf('.'))) > -1);
                          if (a.length > 0) {
                            let uri = '/' + a[0].name.substring(0, a[0].name.lastIndexOf('.')) + '?';
                            imagesUrls.push({
                              name: a[0].name,
                              path: uri,
                              url: a[0].path
                            })
                            d.data.elements[k].name = 'standardImage'
                            d.data.elements[k].fillStyle.fileId = 'file:///' + a[0].path
                          }
                        }
                      }
                    }
                    // 思维导图和思维笔记
                    else {
                      window.defVersion.push({ id: d.id, version: 1, isSave: true })
                      const urls = this.mindImagesFiles(d.data, imagesPath, filesPath, imagesUrls, filesUrls)
                      imagesUrls = urls.imagesUrls
                      filesUrls = urls.filesUrls
                    }
                    // 如果是主画布
                    if (d.id == obj.mainCanvasId) {
                      obj.def = JSON.stringify(d.data)
                    }
                    else if (obj.chartDefIds.filter(di => di.definitionId == d.id)[0].canvasId == obj.mainCanvasId) {
                      const newData1 = obj.chartDefIds.filter(di => di.definitionId == d.id)
                      const newData2 = obj.chartDefIds.filter(di => di.canvasId == d.id)
                      if (newData1.length > 0 && newData1[0].canvasId == obj.mainCanvasId) {
                        obj.def = JSON.stringify(d.data)
                      }
                      if (newData2.length > 0 && newData2[0].definitionId == obj.mainCanvasId) {
                        obj.def = JSON.stringify(d.data)
                      }
                    }
                  });
                  window.cacheImages = imagesUrls
                  window.cacheFiles = filesUrls
                  // 保存路径备份
                  ipc1.sendSync('saveFileB64',
                    { type: 'cache', path: `back/${id}/attachment.json`, data: importClass.stringToBase64String(JSON.stringify(imagesUrls)), suffix: '' }
                  )
                  ipc1.sendSync('saveFileB64',
                    { type: 'cache', path: `back/${id}/files.json`, data: importClass.stringToBase64String(JSON.stringify(filesUrls)), suffix: '' }
                  )
                  // console.log(Date.now())
                  importClass.dbSave(obj, defs)
                  reslove(obj)
                }
              }
            }, 100);
          })
        })
        .catch(()=>{
          markdownToDef.load(path).then(res=>reslove(res))
        })
      })
    })
  },

  /**
   * 解析思维导图定义图片附件
   * @param {*} data 
   */
  mindImagesFiles(data, imagesPath, filesPath, imagesUrls, filesUrls) {
    // 是否有图片
    if (Object.hasOwnProperty.call(data, 'image') && Object.hasOwnProperty.call(data.image, 'url')) {
      let a = imagesPath.filter(f => data.image.url.indexOf('/' + f.name.substring(0, f.name.lastIndexOf('.'))) > -1);
      if (a.length > 0) {
        imagesUrls.push({
          name: a[0].name, path: data.image.url, url: a[0].path
        })
        data.image.url = 'file:///' + a[0].path
      }
    }
    // 是否有附件
    if (Object.hasOwnProperty.call(data, 'file') && Object.hasOwnProperty.call(data.file, 'value')) {
      let a = filesPath.filter(f => data.file.value.indexOf('/' + f.name) > -1);
      if (a.length > 0) {
        filesUrls.push({
          name: a[0].name, path: data.file.value, url: a[0].path
        })
        data.file.value = 'file:///' + a[0].path
      }
    }
    // 是否左侧节点
    if (Object.hasOwnProperty.call(data, 'leftChildren')) {
      if (data.leftChildren.length > 0) {
        data.leftChildren.forEach((d) => {
          d = this.mindImagesFiles(d, imagesPath, filesPath, imagesUrls, filesUrls)
        })
      }
    }
    // 是否有节点
    if (Object.hasOwnProperty.call(data, 'children')) {
      if (data.children.length > 0) {
        data.children.forEach((d) => {
          d = this.mindImagesFiles(d, imagesPath, filesPath, imagesUrls, filesUrls)
        })
      }
    }
    return { imagesUrls, filesUrls }
  },


  /**
   * 单画布文件转多画布文件
   * @param {*} obj 
   * @param {*} defs 
   * @param {*} path 
   */
  posToPosf(obj, defs, path, type, id) {
    return new Promise((reslove) => {
      const fileName = path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'))
      const zip = new window.JSZip1();
      const meta = {
        "pages": obj.chartDefIds,
        "mainCanvasId": obj.mainCanvasId,
        "exportTime": pcUtil.getCurrentTimeString(),
        "member": "",
        "diagramInfo": {
          "creator": "",
          "created": pcUtil.getCurrentTimeString(),
          "modified": pcUtil.getCurrentTimeString(),
          "title": fileName,
          "category": obj.chartObj.category
        },
        "id": obj.chartObj.chartId,
        "type": "AIPROS Schema File",
        "version": "5.0"
      }
      const posDetail = {
        "diagram": {
          "elements": defs[0].data
        },
        "meta": {
          "mainCanvasId": obj.mainCanvasId,
          "exportTime": pcUtil.getCurrentTimeString(),
          "member": "",
          "diagramInfo": {
            "creator": "",
            "created": pcUtil.getCurrentTimeString(),
            "modified": pcUtil.getCurrentTimeString(),
            "title": obj.chartObj.title,
            "category": type
          },
          "id": obj.chartDefIds[0].definitionId,
          "type": "AIPROS Schema File",
          "version": "5.0"
        }
      }
      zip.file('meta.json', JSON.stringify(meta))
      zip.file(`${obj.chartDefIds[0].definitionId}.pos`, JSON.stringify(posDetail))
      this.getPosOnlineFile(zip, obj, defs, type, id).then((res) => {
        obj = res.obj
        defs = res.defs
        zip.generateAsync({ type: 'base64' }).then((content) => {
          ipc1.sendSync('saveFileB64', { type: 'local', path: path, data: content })
          reslove({ obj, defs })
        })
      })
    })
  },
  getPosOnlineFile(zip, obj, defs, type, id) {
    return new Promise((reslove) => {
      const imagesUrls = []
      const filesUrls = []
      const d = defs[0]
      const imgs = zip.folder('attachment')
      const files = zip.folder('files')
      if (type == 'flow') {
        window.defVersion.push({ id: d.id, version: 1, isSave: true })
        // window.defVersion.push({ id: d.id, version: d.data.version })
        Promise.all(
          Object.keys(d.data.elements).map((k) => {
            return new Promise((reslove1) => {
              if (d.data.elements[k].name == 'standardImage') {
                this.getFlowFileByElment(d.data.elements[k], id, imgs).then((path) => {
                  const name = path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'))
                  imagesUrls.push({
                    name: name, path: d.data.elements[k].fillStyle.fileId, url: path
                  })
                  d.data.elements[k].fillStyle.fileId = `file:///${path}`
                  reslove1()
                })
                // 图片类型节点
              }
              else {
                reslove1()
              }
            })
          })
        ).then(() => {
          ipc1.sendSync('saveFileB64',
            { type: 'cache', path: `back/${id}/attachment.json`, data: importClass.stringToBase64String(JSON.stringify(imagesUrls)), suffix: '' }
          )
          ipc1.sendSync('saveFileB64',
            { type: 'cache', path: `back/${id}/files.json`, data: importClass.stringToBase64String(JSON.stringify(filesUrls)), suffix: '' }
          )
          defs[0] = d
          reslove({ obj, defs })
        })
      }
      else {
        window.defVersion.push({ id: d.id, version: 1, isSave: true })
        this.getMindFile(d.data, imagesUrls, filesUrls, id, imgs, files).then(() => {
          obj.def = JSON.stringify(d.data)
          reslove({ obj, defs })
        })
      }
    })
  },
  getFlowFileByElment(data, id, imgs) {
    return new Promise((reslove) => {
      let fileId = data.fillStyle.fileId.substring(data.fillStyle.fileId.lastIndexOf('/') + 1)
      if (fileId.indexOf('?') > -1) {
        fileId = fileId.substring(0, fileId.lastIndexOf('?'))
      }
      window.fetch(data.fillStyle.fileId).then((res) => {
        const contentType = res.headers.get('content-type')
        switch (contentType) {
          case 'image/svg+xml': name = `${fileId}.svg`; break;
          default: name = `${fileId}.${contentType.replace('image/', '')}`; break;
        }
        res.arrayBuffer().then((resData) => {
          const saveBase = importClass.arrayBufferToBase64(resData)
          // 保存图片或者附件
          const saveData = { type: 'cache', data: saveBase, path: `back/${id}/${name}`, suffix: '' }
          ipc1.sendSync('saveFileB64', saveData).then((resPath) => {
            imgs.file(name, saveBase, { base64: true })
            reslove(resPath)
          })
        })
      })
    })
  },
  getMindFile(data, imagesUrls, filesUrls, id, imgs, files) {
    return new Promise((reslove) => {
      Promise.all(
        [
          Object.hasOwnProperty.call(data, 'image') && Object.hasOwnProperty.call(data.image, 'url') &&
          new Promise((reslove1) => {
            const result = imagesUrls.find(d => d.path == data.image.url)
            if (result) {
              data.image.url = result.url
              reslove1()
            }
            else {
              let fileId = data.image.url.substring(data.image.url.lastIndexOf('/') + 1)
              if (fileId.indexOf('?') > -1) {
                fileId = fileId.substring(0, fileId.lastIndexOf('?'))
              }
              window.fetch(data.image.url).then((res) => {
                const contentType = res.headers.get('content-type')
                let name = ''
                switch (contentType) {
                  case 'image/svg+xml': name = `${fileId}.svg`; break;
                  default: name = `${fileId}.${contentType.replace('image/', '')}`; break;
                }
                res.arrayBuffer().then((resData) => {
                  const saveBase = importClass.arrayBufferToBase64(resData)
                  // 保存图片或者附件
                  const saveData = { type: 'cache', data: saveBase, path: `back/${id}/${name}`, suffix: '' }
                  ipc1.sendSync('saveFileB64', saveData).then((resPath) => {
                    imagesUrls.push({
                      name: fileId, path: data.image.url, url: resPath
                    })
                    data.image.url = 'file:///' + resPath
                    imgs.file(name, saveBase, { base64: true })
                    reslove1()
                  })
                })
              })
            }
          }),
          Object.hasOwnProperty.call(data, 'file') && Object.hasOwnProperty.call(data.file, 'value') &&
          new Promise((reslove1) => {
            const result = filesUrls.find(d => d.path == data.file.value)
            if (result) {
              data.file.value = result.url
              reslove1()
            }
            else {
              window.fetch(data.file.value).then((res) => {
                const fileId = data.file.value.substring(data.file.value.lastIndexOf('/') + 1)
                const contentType = res.headers.get('content-type')
                let name = ''
                switch (contentType) {
                  case 'image/svg+xml': name = `${fileId}.svg`; break;
                  default: name = `${fileId}.${contentType.replace('image/', '')}`; break;
                }
                res.arrayBuffer().then((resData) => {
                  const saveBase = importClass.arrayBufferToBase64(resData)
                  // 保存图片或者附件
                  const saveData = { type: 'cache', data: saveBase, path: `back/${id}/${name}`, suffix: '' }
                  ipc1.sendSync('saveFileB64', saveData).then((resPath) => {
                    filesUrls.push({
                      name: fileId, path: data.file.value, url: resPath
                    })
                    data.file.value = 'file:///' + resPath
                    files.file(name, saveBase, { base64: true })
                    reslove1()
                  })
                })
              })
            }
          }),
          Object.hasOwnProperty.call(data, 'leftChildren') &&
          new Promise((reslove1) => {
            Promise.all(data.leftChildren.map((d) => {
              return new Promise((reslove11) => {
                this.getMindFile(d, imagesUrls, filesUrls, id, imgs, files).then((resData) => {
                  d = resData.data
                  // imagesUrls.concat(resData.imagesUrls)
                  // filesUrls.concat(resData.filesUrls)
                  reslove11()
                })
              })
            })).then(() => {
              reslove1()
            })
          }),
          Object.hasOwnProperty.call(data, 'children') &&
          new Promise((reslove1) => {
            Promise.all(data.children.map((d) => {
              return new Promise((reslove11) => {
                this.getMindFile(d, imagesUrls, filesUrls, id, imgs, files).then((resData) => {
                  d = resData.data
                  // imagesUrls.concat(resData.imagesUrls)
                  // filesUrls.concat(resData.filesUrls)
                  reslove11()
                })
              })
            })).then(() => {
              reslove1()
            })
          })
        ]
      ).then(() => {
        reslove({ data, imagesUrls, filesUrls })
      })
    })
  },
  v6posTov5pos(topicDef) {
    var that = {
      opts: {
        canvasW: 20000,
        canvasH: 20000,
        //当前版本支持的结构
        // supportStructure: ['mind', 'mind_free','mind_free_layout', 'mind_left', 'mind_right','mind_org', 'mind_tree','mind_ishikawa_left', 'mind_ishikawa_right', 'mind_timeline_h', 'mind_tree_free', 'mind_tree_left', 'mind_tree_right'],
        supportStructure: {
          'basics': ['mind', 'mind_free', 'mind_free_layout', 'mind_left', 'mind_right'], //基础图形
          'org': ['mind_org', 'mind_org_multistage'], //组织结构
          'tree_org': ['mind_tree'], //树状组织结构
          'tree': ['mind_tree_free', 'mind_tree_left', 'mind_tree_right', 'mind_tree_right_mobi'], //树形图
          'ishikawa': ['mind_ishikawa_left', 'mind_ishikawa_right'], //鱼骨图（石川图）
          'timeline': ['mind_timeline_h', 'mind_timeline_h_top', 'mind_timeline_h_down', 'mind_timeline_v'], //时间轴
          'brace': ["mind_brace_left", "mind_brace_right"]// 括号图
        },
        readonly: false
      },
      icons: {
        icons: {
          "priority": [{
            "index": "301",
            "text": "&#xea2e;",
            "color": "#F85767"
          }, {
            "index": "302",
            "text": "&#xea31;",
            "color": "#FF863C"
          }, {
            "index": "303",
            "text": "&#xea37;",
            "color": "#FFB60A"
          }, {
            "index": "304",
            "text": "&#xea27;",
            "color": "#28BF5A"
          }, {
            "index": "305",
            "text": "&#xea34;",
            "color": "#21B1DF"
          }, {
            "index": "306",
            "text": "&#xea20;",
            "color": "#1E90F4"
          }, {
            "index": "307",
            "text": "&#xea1e;",
            "color": "#135CEA"
          }, {
            "index": "308",
            "text": "&#xea22;",
            "color": "#7F68DA"
          }, {
            "index": "309",
            "text": "&#xea6e;",
            "color": "#6D7E9E"
          }, {
            "index": "394",
            "text": "&#xea21;",
            "color": "#6D7E9E"
          }, {
            "index": "395",
            "text": "&#xea29;",
            "color": "#6D7E9E"
          }, {
            "index": "396",
            "text": "&#xea32;",
            "color": "#6D7E9E"
          }, {
            "index": "397",
            "text": "&#xea24;",
            "color": "#6D7E9E"
          }, {
            "index": "398",
            "text": "&#xea2a;",
            "color": "#6D7E9E"
          }, {
            "index": "399",
            "text": "&#xea23;",
            "color": "#6D7E9E"
          }, {
            "index": "400",
            "text": "&#xea25;",
            "color": "#6D7E9E"
          }],
          "completion": [{
            "index": "310",
            "text": "&#xea64;",
            "color": "#F85767"
          }, {
            "index": "311",
            "text": "&#xea5a;",
            "color": "#FF6610"
          }, {
            "index": "312",
            "text": "&#xea54;",
            "color": "#FF900D"
          }, {
            "index": "313",
            "text": "&#xea4c;",
            "color": "#FFBC0F"
          }, {
            "index": "314",
            "text": "&#xea5d;",
            "color": "#7ECC00"
          }, {
            "index": "315",
            "text": "&#xea65;",
            "color": "#35CB00"
          }, {
            "index": "316",
            "text": "&#xea62;",
            "color": "#00BA3F"
          }, {
            "index": "317",
            "text": "&#xea60;",
            "color": "#00BA4A"
          }],
          "face": [{
            "index": "118",
            "text": "#icon-biaoqing-weixiao-wubaibian"
          }, {
            "index": "119",
            "text": "#icon-biaoqing-bugaoxing-wubaibian"
          }, {
            "index": "120",
            "text": "#icon-biaoqing-xiaoku-wubaibian"
          }, {
            "index": "121",
            "text": "#icon-biaoqing-xihuan-wubaibian"
          }, {
            "index": "122",
            "text": "#icon-biaoqing-xiao-wubaibian"
          }, {
            "index": "123",
            "text": "#icon-biaoqing-shengqi-wubaibian"
          }, {
            "index": "194",
            "text": "#icon-biaoqing-ku-wubaibian"
          }, {
            "index": "124",
            "text": "#icon-biaoqing-heixian-wubaibian"
          }, {
            "index": "125",
            "text": "#icon-biaoqing-kun-wubaibian"
          }, {
            "index": "126",
            "text": "#icon-biaoqing-douyan-wubaibian"
          }, {
            "index": "127",
            "text": "#icon-biaoqing-yun-wubaibian"
          }, {
            "index": "128",
            "text": "#icon-biaoqing-goutou-wubaibian"
          }, {
            "index": "201",
            "text": "#icon-biaoqing-heshi-wubaibian"
          }, {
            "index": "202",
            "text": "#icon-biaoqing-zan-wubaibian"
          }, {
            "index": "203",
            "text": "#icon-biaoqing-jiayou-wubaibian"
          }, {
            "index": "204",
            "text": "#icon-biaoqing-bishi-wubaibian"
          }],
          "arrow": [{
            "index": "329",
            "text": "&#xea56;",
            "color": "#FF863B"
          }, {
            "index": "330",
            "text": "&#xea50;",
            "color": "#FF863B"
          }, {
            "index": "331",
            "text": "&#xea5f;",
            "color": "#FF863B"
          }, {
            "index": "332",
            "text": "&#xea57;",
            "color": "#FF863B"
          }, {
            "index": "333",
            "text": "&#xea4f;",
            "color": "#FF863B"
          }, {
            "index": "334",
            "text": "&#xea58;",
            "color": "#FF863B"
          }, {
            "index": "405",
            "text": "&#xea53;",
            "color": "#FF863B"
          }, {
            "index": "406",
            "text": "&#xea5b;",
            "color": "#FF863B"
          }],
          "flag": [{
            "index": "335",
            "text": "&#xea63;",
            "color": "#F85767"
          }, {
            "index": "336",
            "text": "&#xea63;",
            "color": "#FF863B"
          }, {
            "index": "408",
            "text": "&#xea63;",
            "color": "#FFB60A"
          }, {
            "index": "337",
            "text": "&#xea63;",
            "color": "#28BF5A"
          }, {
            "index": "338",
            "text": "&#xea63;",
            "color": "#1E90F4"
          }, {
            "index": "339",
            "text": "&#xea63;",
            "color": "#995AFF"
          }, {
            "index": "340",
            "text": "&#xea63;",
            "color": "#DC51BD"
          }, {
            "index": "341",
            "text": "&#xea63;",
            "color": "#6D7E9E"
          }],
          "star": [{
            "index": "342",
            "text": "&#xea5c",
            "color": "#F85767"
          }, {
            "index": "343",
            "text": "&#xea5c",
            "color": "#FF863B"
          }, {
            "index": "407",
            "text": "&#xea5c",
            "color": "#FFB60A"
          }, {
            "index": "344",
            "text": "&#xea5c",
            "color": "#28BF5A"
          }, {
            "index": "345",
            "text": "&#xea5c",
            "color": "#1E90F4"
          }, {
            "index": "346",
            "text": "&#xea5c",
            "color": "#995AFF"
          }, {
            "index": "347",
            "text": "&#xea5c",
            "color": "#DC51BD"
          }, {
            "index": "348",
            "text": "&#xea5c",
            "color": "#6D7E9E"
          }],
          "month": [{
            "index": "349",
            "text": "&#xea2b;",
            "color": "#067BEF"
          }, {
            "index": "350",
            "text": "&#xea38;",
            "color": "#067BEF"
          }, {
            "index": "351",
            "text": "&#xea30;",
            "color": "#067BEF"
          }, {
            "index": "352",
            "text": "&#xea2d;",
            "color": "#067BEF"
          }, {
            "index": "353",
            "text": "&#xea2f;",
            "color": "#067BEF"
          }, {
            "index": "354",
            "text": "&#xea2c;",
            "color": "#067BEF"
          }, {
            "index": "355",
            "text": "&#xea33;",
            "color": "#067BEF"
          }, {
            "index": "356",
            "text": "&#xea36;",
            "color": "#067BEF"
          }, {
            "index": "357",
            "text": "&#xea35;",
            "color": "#067BEF"
          }, {
            "index": "358",
            "text": "&#xea28;",
            "color": "#067BEF"
          }, {
            "index": "359",
            "text": "&#xea26;",
            "color": "#067BEF"
          }, {
            "index": "360",
            "text": "&#xea1f;",
            "color": "#067BEF"
          }],
          "day": [{
            "index": "361",
            "text": "&#xea6d;",
            "color": "#6D7E9E"
          }, {
            "index": "362",
            "text": "&#xea6c;",
            "color": "#6D7E9E"
          }, {
            "index": "363",
            "text": "&#xea69;",
            "color": "#6D7E9E"
          }, {
            "index": "364",
            "text": "&#xea6b;",
            "color": "#6D7E9E"
          }, {
            "index": "365",
            "text": "&#xea67;",
            "color": "#6D7E9E"
          }, {
            "index": "366",
            "text": "&#xea68;",
            "color": "#6D7E9E"
          }, {
            "index": "367",
            "text": "&#xea6a;",
            "color": "#6D7E9E"
          }],
          "other": [{
            "index": "368",
            "text": "&#xea41;",
            "color": "#28BF5A"
          }, {
            "index": "369",
            "text": "&#xea3b;",
            "color": "#F85767"
          }, {
            "index": "370",
            "text": "&#xea52;",
            "color": "#995AFF"
          }, {
            "index": "371",
            "text": "&#xea4b;",
            "color": "#1E90F4"
          }, {
            "index": "372",
            "text": "&#xea44;",
            "color": "#F85767"
          }, {
            "index": "373",
            "text": "&#xea49;",
            "color": "#7ECC00"
          }, {
            "index": "374",
            "text": "&#xea47;",
            "color": "#7F68DA"
          }, {
            "index": "375",
            "text": "&#xea42;",
            "color": "#FF863B"
          }, {
            "index": "376",
            "text": "&#xea4d;",
            "color": "#DC51BD"
          }, {
            "index": "377",
            "text": "&#xea5e;",
            "color": "#1E90F4"
          }, {
            "index": "378",
            "text": "&#xea43;",
            "color": "#7F68DA"
          }, {
            "index": "379",
            "text": "&#xea4a;",
            "color": "#28BF5A"
          }, {
            "index": "380",
            "text": "&#xea3c;",
            "color": "#995AFF"
          }, {
            "index": "381",
            "text": "&#xea40;",
            "color": "#1E90F4"
          }, {
            "index": "382",
            "text": "&#xea59;",
            "color": "#FF863B"
          }, {
            "index": "383",
            "text": "&#xea55;",
            "color": "#5D8DE7"
          }, {
            "index": "384",
            "text": "&#xea4e;",
            "color": "#125CEA"
          }, {
            "index": "385",
            "text": "&#xea3a;",
            "color": "#DC51BD"
          }, {
            "index": "386",
            "text": "&#xea61;",
            "color": "#28BF5A"
          }, {
            "index": "387",
            "text": "&#xea3d;",
            "color": "#1E90F4"
          }, {
            "index": "388",
            "text": "&#xea3e;",
            "color": "#7F68DA"
          }, {
            "index": "389",
            "text": "&#xea39;",
            "color": "#F85767"
          }, {
            "index": "390",
            "text": "&#xea48;",
            "color": "#125CEA"
          }, {
            "index": "391",
            "text": "&#xea45;",
            "color": "#FF863B"
          }, {
            "index": "392",
            "text": "&#xea66;",
            "color": "#5D8DE7"
          }, {
            "index": "393",
            "text": "&#xea3f;",
            "color": "#7F68DA"
          }, {
            "index": "409",
            "text": "&#xea51;",
            "color": "#28BF5A"
          }, {
            "index": "410",
            "text": "&#xea46;",
            "color": "#F85767"
          }]
        }
      }
    }
    var check1 = false, check2 = false, check3 = false, check4 = false;
    var supportStructure = [];
    if (that.opts.supportStructure) {
      supportStructure = Object.values(that.opts.supportStructure).flat();
    }
    //老数据structure结构兼容
    if (topicDef.structure.indexOf("mind_") < 0 || supportStructure.indexOf(topicDef.structure) < 0) {
      check1 = true;
    }
    var children, len;
    if (topicDef.structure == "mind" && (topicDef.root == null || topicDef.classic)) {
      topicDef.leftChildren = [], children = topicDef.children, len = children.length - 1;
      var count = Math.floor(len / 2), topics = [];
      for (var i = count; i < len; i++) {
        var tp = children[i];
        topics.push(tp);
      }
      children.splice(count, len - count);
      topicDef.leftChildren = topicDef.leftChildren.concat(topics);
      topicDef.structure = "mind_free";
    } else if (supportStructure.indexOf(topicDef.structure) < 0) {
      var children = topicDef.children, leftChildren = topicDef.leftChildren || [];
      var list = children.concat(leftChildren);
      for (var i = 0; i < list.length; i++) {
        var tp = list[i];
        if (!tp.free && tp.pos) {
          delete tp.pos;
        }
      }
      topicDef.structure = "mind_free";
    }
    // 主题风格字段兼容  旧 classic  ， 新 theme
    if (topicDef.classic) {
      var theme = topicDef.classic;
      if (theme.indexOf("defaultClassic") >= 0) {
        theme = "theme3";
      }
      delete topicDef.classic;
      topicDef.theme = theme;
    }
    //兼容root null 的情况
    if (topicDef.root == null) {
      topicDef.root = true;
    }


    //是否是新版脑图
    let isV6File = false;
    //判断是否是老文件    老版本定义中没有topicDef.freeChildren
    if (topicDef.freeChildren || topicDef.data || !topicDef.leftChildren) {
      isV6File = true;
    }

    if (isV6File) {
      function setSumsOrBounds(topic, isRoot) {
        let rightIndex = topicDef.data ? topicDef.data['right-content-index'] : 0
        let summaries = topic.summaries || []
        //概要 外框范围&样式兼容
        if (summaries.length > 0) {
          topic.summaries = summaries.map(summ => {
            if (summ.style) {
              if (summ.style.summaryLineColor) {
                summ.style.lineColor = summ.style.summaryLineColor
                delete summ.style.summaryLineColor
              }
              if (summ.style.summaryLineWidth) {
                summ.style.lineWidth = summ.style.summaryLineWidth
                delete summ.style.summaryLineWidth
              }
              if (summ.style.summaryLineType) {
                summ.style.lineType = summ.style.summaryLineType
                delete summ.style.summaryLineType
              }
            }
            //中心主题上的概要 range需要调整
            if (isRoot) {
              let range = summ.range
              r1 = Number(range.split(",")[0]),
                r2 = Number(range.split(",")[1]);
              if (r2 > rightIndex || r1 > rightIndex) {
                summ.range = `${r1 - rightIndex}, ${r2 - rightIndex}`
                summ.part = 'left'
              } else {
                summ.part = 'right';
              }
            }
            return summ
          })
        }
        let boundaries = topic.boundaries || []
        if (isRoot && boundaries.length > 0) {
          topicDef.boundaries = topicDef.boundaries.map(bound => {
            //中心主题上的概要 range需要调整
            if (isRoot) {
              let range = bound.range
              r1 = Number(range.split(",")[0]),
                r2 = Number(range.split(",")[1]);
              if (r2 > rightIndex || r1 > rightIndex) {
                bound.range = `${r1 - rightIndex}, ${r2 - rightIndex}`
                bound.part = 'left'
              } else {
                bound.part = 'right';
              }
            }
            return bound
          })
        }
        let children = [...topic.children]
        children.forEach(topicDef => {
          setSumsOrBounds(topicDef)
        })
      }
      //概要外框处理
      setSumsOrBounds(topicDef, true)
      //结构上兼容
      let structure = topicDef.structure
      //如果是自由分支主题结构 转换为mind_free  enableFreeDrag为 true
      if (structure === "mind_free" && topicDef.enableFreeDrag) {
        // topicDef.structure = "mind_free_layout";

        //如果是新版的组织结构图 转为 mind_org结构  设置hideSelf为 true
      } else if (structure === "mind_org" && topicDef.hideSelf) {
        topicDef.structure = "mind_org_multistage";
      }
      topicDef.leftChildren = []
      //处理左右结构数据
      if (topicDef.data && topicDef.structure === 'mind_free') {
        let rightIndex = topicDef.data['right-content-index']
        topicDef.leftChildren = topicDef.children.splice(rightIndex)
        delete topicDef.data
      }
      if (topicDef.structure === 'mind_left' || topicDef.structure === 'mind_brace_left' || topicDef.structure === 'mind_ishikawa_right') {
        topicDef.leftChildren = topicDef.children
        topicDef.children = []
      }
      //兼容新版本 自由主题
      if (topicDef.freeChildren) {
        //自由主题合并到 children下
        topicDef.children.push(...topicDef.freeChildren)
        delete topicDef.freeChildren
      }

      check1 = true
    }


    //线条字段为空时，删除该字段
    if ($.isEmptyObject(topicDef.lines)) {
      delete topicDef.lines;
    } else {
      //线条字段不为空时，循环遍历，对起点 、 重点 进行 数据兼容和 范围判断等
      var lines = topicDef.lines;
      for (var id in lines) {
        var line = topicDef.lines[id];
        var start = line.start, end = line.end;
        if ((start.p || end.p) && line.canvasPos != null) {
          for (var i = 0; i < line.points.length; i++) {
            var point = line.points[i];
            if (point.x > 2000) {
              //delete line.points;
              line.points = [];
              check2 = true;
              break;
            }
          }
          if (start.p == "bottom") {
            start = {
              x: 0.5,
              y: 1
            };

          } else if (start.p == "top") {
            start = {
              x: 0.5,
              y: 0
            };
          } else if (start.p == "left") {
            start = {
              x: 0,
              y: 0.5
            };
          } else if (start.p == "right") {
            start = {
              x: 1,
              y: 0.5
            };
          }
          if (end.p == "bottom") {
            end = {
              x: 0.5,
              y: 1
            };
          } else if (end.p == "top") {
            end = {
              x: 0.5,
              y: 0
            };
          } else if (end.p == "left") {
            end = {
              x: 0,
              y: 0.5
            };
          } else if (end.p == "right") {
            end = {
              x: 1,
              y: 0.5
            };
          }
          if (start.x == null) {
            start.x = 0;
            start.y = 0;
          }
          if (end.x == null) {
            end.x = 0;
            end.y = 0;
          }
          if (start.x > 2000) {
            start.x = 1;
          }
          if (end.x > 2000) {
            end.x = 1;
          }
          if (start.y > 2000) {
            start.y = 1;
          }
          if (end.y > 2000) {
            end.y = 1;
          }
        }
        if (line.canvasPos && line.start.p) {
          var cpos = line.canvasPos;
          if (line.points != null && line.points.length > 0) {
            if (line.points[0].x != null && line.points[0].y != null) {
              line.points[0].x += cpos.x;
              line.points[0].y += cpos.y;
            }
            if (line.points[0].x != null && line.points[0].y != null) {
              line.points[1].x += cpos.x;
              line.points[1].y += cpos.y;
            }
          }
          if (Math.abs(line.start.x) > 1 || Math.abs(line.start.y) > 1) {
            line.realStart = {};
            line.realStart.x = line.canvasPos.x + start.x;
            line.realStart.y = line.canvasPos.y + start.y;
            line.start.x = line.start.x / line.canvasPos.w;
            line.start.y = line.start.y / line.canvasPos.h;
          }
          if (Math.abs(line.end.x) > 1 || Math.abs(line.end.y) > 1) {
            line.realEnd = {};
            line.realEnd.x = line.canvasPos.x + end.x;
            line.realEnd.y = line.canvasPos.y + end.y;
            line.end.x = line.end.x / line.canvasPos.w;
            line.end.y = line.end.y / line.canvasPos.h;
          }
          delete line.canvasPos;
        }
      }
    }
    // 背景色数据处理  如果 背景色 值为空、null或者niupizhi 则删除background字段
    if (topicDef.background == "" || topicDef.background == null) {
      delete topicDef.background;
    } else if (topicDef.background.indexOf("niupizhi.png") > 0) {
      delete topicDef.background;
    }
    getTopicDef(topicDef);
    //更新概要数据
    getTopicSumsDef(topicDef);
    function setSums(topic, part) {
      if (topic.summaries != null && topic.summaries.length > 0) {
        for (var j = 0; j < topic.summaries.length; j++) {
          var sum = topic.summaries[j];
          var sumR = sum.range + "";
          if (sum.range != null && sumR.indexOf(",") < 0) {
            var newSum = $.extend(true, {}, sum);
            sum.range = 0 + "," + 0;
            if (part) {
              newSum.part = "right";
            }
            check3 = true;
          }
          if (sum.range && sum.range.indexOf("-1") > -1) {
            sum.range = 0 + "," + 0;
            check3 = true;
          }
          getTopicSumsDef(sum);
        }
      }
    }
    function getTopicSumsDef(topic) {
      if (topic.free) {
        setSums(topic);
      }
      if (topic.summaries != null && topic.root) {
        setSums(topic, true);
      } else if (topic.summaries != null) {
        setSums(topic);
      }
      var children = topic.children;
      for (var i = 0; i < children.length; i++) {
        var child = children[i], isSub = false;
        if (child.parent == "root") {
          isSub = true;
        }
        if (child.summary) {
          delete child.summary;
          delete child.range;
        }
        if (child.summaries != null && child.summaries.length > 0) {
          for (var j = 0; j < child.summaries.length; j++) {
            var sum = child.summaries[j];
            var sumR = sum.range + "";
            if (sum.range != null && sumR.indexOf(",") < 0) {
              var newSum = $.extend(true, {}, sum);
              if (!child.free) {
                newSum.parent = topic.id;
                newSum.range = i + "," + i;
              } else {
                var count_ = sum.children.length;
                sum.range = 0 + "," + (count_ - 1) < 0 ? 0 : (count_ - 1);
                //自由节点概要，如果概要中没有子节点，自动生成
                if (child.children.length == 0) {
                  sum.range = 0 + "," + 0;
                  var newTp = {
                    id: importClass.newId(),
                    parent: child.id,
                    children: [],
                    title: i18next.t('js.Subtopic')
                  };
                  child.children.push(newTp);
                }
              }
              if (isSub) {
                newSum.part = "right";
              }
              check3 = true;
              if (!child.free) {
                child.summaries.splice(j, 1);
                if (topic.summaries == null) {
                  topic.summaries = [];
                  topic.summaries.push(newSum);
                  //如果child下有summaries的情况会删除并添加到topic上，topic如果添加summaries后不会再次添加
                  getTopicSumsDef(topic);
                  break;
                } else {
                  topic.summaries.push(newSum);
                }
              }
            }
            getTopicSumsDef(sum);
          }
        }
        getTopicSumsDef(child);
      }

      var leftChildren = topic.leftChildren || [];
      if (leftChildren.length > 0) {
        for (var i = 0; i < leftChildren.length; i++) {
          var child = leftChildren[i], isSub = false;
          if (child.parent == "root") {
            isSub = true;
          };
          if (child.summaries != null && child.summaries.length > 0) {
            for (var j = 0; j < child.summaries.length; j++) {
              var sum = child.summaries[j];
              var sumR = sum.range + "";
              if (sum.range != null && sumR.indexOf(",") < 0) {
                var newSum = $.extend(true, {}, sum);
                newSum.parent = topic.id;
                newSum.range = i + "," + i;
                if (isSub) {
                  newSum.part = "left";
                }
                check3 = true;
                child.summaries.splice(j, 1);
                if (!child.free) {
                  child.summaries.splice(j, 1);
                  if (topic.summaries == null) {
                    topic.summaries = [];
                    topic.summaries.push(newSum);
                    //如果child下有summaries的情况会删除并添加到topic上，topic如果添加summaries后不会再次添加
                    getTopicSumsDef(topic);
                    break;
                  } else {
                    topic.summaries.push(newSum);
                  }
                }
              }
              getTopicSumsDef(sum);
            }
          }
          getTopicSumsDef(child);
        }
      }
    }
    function getTopicDef(topicDef) {
      // tag字段兼容，新字段为tags
      if (topicDef.tag != null) {
        var text = topicDef.tag;
        var tags = [];
        var tag = {
          text: text,
          color: "#276F86",
          background: "#d6f0f8"
        }
        tags.push(tag);
        topicDef.tags = tags;
        delete topicDef.tag;
      }
      if (topicDef.task != null) {
        if (topicDef.task.start == "") {
          delete topicDef.task.start;
        }
        if (topicDef.task.end == "") {
          delete topicDef.task.end;
        }
      }
      if (topicDef.link != null) {
        if (topicDef.link.value == "") {
          delete topicDef.link;
        }
      }
      if (topicDef.file != null) {
        if (topicDef.file.value == "") {
          delete topicDef.file;
        }
      }
      if (topicDef.icons != null) {
        //将所有图标保存到对象中
        var allicons = that.icons.icons;
        if (allicons != null) {
          for (var i = 0, len = topicDef.icons.length; i < len; i++) {
            var icon = topicDef.icons[i];
            if (icon == null) {
              continue;
            }
            var group = allicons[icon.name];
            if (group == null) {
              continue;
            }
            for (var j = 0; j < group.length; j++) {
              var g = group[icon.index];
              if (g == null) {
                g = group[group.length - 1];
                icon.text = g.text;
                break;
              } else if (g.index == icon.index) {
                icon.text = g.text;
                break;
              }

            }
          }
        }
      }
      if (topicDef.code != null) {
        if (topicDef.code.language) {
          topicDef.code.curLanguage = topicDef.code.language
        }
      }
      var children = topicDef.children, len = children.length;
      for (var i = 0; i < len; i++) {
        var child = children[i];
        getTopicDef(child);
      }
    }
    //检测外框
    try {
      checkBound(topicDef);
    } catch (e) {
      console.log("error=" + e);
    }
    //外框 数据兼容与处理  范围等出现问题
    function checkBound(topic) {
      if (!topic) {
        return;
      }
      var bounds = topic.boundaries || [];
      var lr = topic.children, ll = topic.leftChildren || [],
        children = lr.concat(ll);
      //删除自由主题
      for (var len = children.length, j = len - 1; j >= 0; j--) {
        if (children[j].free) {
          children.splice(j, 1);
        }
      }
      //检测外框的range是否正确
      var newBound = [], ranges = [], changeRange = false;
      for (var i = 0; i < bounds.length; i++) {
        var bon = bounds[i], boundRange = bounds[i].range,
          boundR1 = Number(boundRange.split(",")[0]),
          boundR2 = Number(boundRange.split(",")[1]);
        if (boundR1 < 0) {
          boundR1 = 0;
          changeRange = true;
        }
        if (boundR2 > children.length - 1) {
          boundR2 = children.length - 1;
          changeRange = true;
        }
        if (boundR1 > boundR2) {
          boundR1 = boundR2;
        }
        bon.range = boundR1 + "," + boundR2;
        if (ranges.indexOf(bon.range) == -1) {
          newBound.push(bon);
          ranges.push(bon.range);
        }
      }
      if (changeRange) {
        topic.boundaries = newBound;
        check4 = true;
      }
      for (var k = 0; k < children.length; k++) {
        var tp = children[k];
        checkBound(tp);
      }
    }
    return topicDef;
  }

}

const markdownToDef = {
  load(path) {
    return new Promise((reslove, reject) => {
      // 读取文件内容
      ipc1.sendSync('loadFileB64', { type: 'local', path: path }).then((data) => {
        // 线上pos文件
        try {
          const def = importClass.base64stringToString(data)
          const defs = []
          // 返回定义
          const obj = {
            chartObj: {},// 文件定义
            authObj: {}, //  身份信息
            userObj: {},//  用户信息
            chartDefIds: [],// 多画布文件定义 id集合 不传默认defenitionId
            mainCanvasId: '',// 主画布id
            def: '', //当前打开的文件定义
            needMustColl:false
          }
          let id = importClass.newId();
          let title = path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'));
          obj.mainCanvasId = id
          obj.chartDefIds = [{
            canvasId: id,
            definitionId: id,
            title: '画布1',
            sort: 0
          }]

          defs.push({ id: id, data: def })
          obj.def = { def: JSON.stringify({ version: 1, def: def, category: 'markdown' }), isLocalFile: true }
          const newObj = importClass.newChart(id, 'markdown')
          obj.authObj = newObj.authObj
          obj.userObj = newObj.userObj
          obj.chartObj = newObj.chartObj
          obj.chartObj.title = title
          obj.chartObj.collaRole = 'editor'
          importClass.dbSave(obj, defs)
          reslove(obj)
        }
        catch { }
      })
    })
  }
}

/**
 * xmind转换
 */
const xmindToDef = {
  newload(path) {
    return new Promise((reslove, reject) => {
      const loadData = { type: 'local', path }
      ipc1.sendSync('loadFileB64', loadData).then((data) => {
        const file = importClass.base64ToFile(data, path.split('/').pop())
        const obj = {
          chartObj: {},// 文件定义
          authObj: {}, //  身份信息
          userObj: {},//  用户信息
          chartDefIds: [],// 多画布文件定义 id集合 不传默认defenitionId
          mainCanvasId: '',// 主画布id
          def: '' //当前打开的文件定义
        }
        if (window.istemp) {

        }
        // 图片或者附件
        const imagesPath = []
        let imagesUrls = []
        const filesPath = []
        let filesUrls = []
        let defs = []
        let id = '';
        id = importClass.newId()

        const handleFiles = (file, type) => {
          return new Promise((reslove) => {
            const newfileName = `${file.name}`
            if (filesUrls.length == 0 || filesUrls.findIndex(d => d.name == newfileName) < 0) {
              // 判断是否不是图片
              const savePath = `back/${id}/${newfileName}`
              const reader = new FileReader()
              importClass.fileToBase64(file).then((res)=>{
                const base64 =  res.split(',')[1]
                ipc.sendSync('saveFileB64', {
                  type: 'cache',
                  path: savePath,
                  data: base64,
                  suffix: ''
                }).then((ipcres) => {
                  const item = type === 'img' ? imagesUrls : filesUrls
                  item.push({
                    name: newfileName,
                    path: ipcres
                  })
                  filesPath.push({
                    name: newfileName,
                    path: ipcres
                  })
                  reslove(ipcres)
                })
              })
            } else {
              reslove()
            }
          })
        }
        xmindToPo.loadFile({
          file,
          handleImage: function (id, img) {
            return new Promise((resolve, reject) => {
              resolve(img)
            })
          },
          handleFile: function (file) {
            return new Promise((resolve, reject) => {
              handleFiles(file, 'file').then((res) => {
                resolve(res)
              })
            })
          }
        }).then((content) => {
          console.log("content----", content)

          const result = this.parseDef(content)
          defs = result.defs
          console.log("defs----", defs)
          obj.chartDefIds = result.chartDefIds
          obj.mainCanvasId = result.mainCanvasId
          const newObj = importClass.newChart(id, 'mind')
          obj.authObj = newObj.authObj
          obj.userObj = newObj.userObj
          obj.chartObj = newObj.chartObj
          defs.forEach(d => {
            const urls = this.mindImagesFiles(d, imagesPath, filesPath, imagesUrls, filesUrls)
            imagesUrls = urls.imagesUrls
            filesUrls = urls.filesUrls
          });
          obj.def = JSON.stringify(defs[0])
          window.cacheImages = imagesUrls
          window.cacheFiles = filesUrls
          // 保存路径备份
          ipc1.sendSync('saveFileB64',
            { type: 'cache', path: `back/${id}/attachment.json`, data: importClass.stringToBase64String(JSON.stringify(imagesUrls)), suffix: '' }
          )
          ipc1.sendSync('saveFileB64',
            { type: 'cache', path: `back/${id}/files.json`, data: importClass.stringToBase64String(JSON.stringify(filesUrls)), suffix: '' }
          )
          importClass.dbSave(obj, defs)
          reslove(obj)

        }).catch((error) => {
          console.log(error)
        })
      })
    })
  },
  /**
   * xmind内容转定义
   * @param {*} path 
   * @returns 
   */
  load(path) {
    return new Promise((reslove, reject) => {
      const id = importClass.newId()
      const loadData = { type: 'local', path: path }
      ipc1.sendSync('loadFileB64', loadData).then((data) => {
        // const data = importClass.base64stringToString(res)

        // 读取压缩内容
        JSZip.loadAsync(data, { base64: true }).then((res) => {
          let count = 0;
          for (const filename in res.files) {
            count++
          }
          let index = 0
          // 返回定义
          const obj = {
            chartObj: {},// 文件定义
            authObj: {}, //  身份信息
            userObj: {},//  用户信息
            chartDefIds: [],// 多画布文件定义 id集合 不传默认defenitionId
            mainCanvasId: '',// 主画布id
            def: '' //当前打开的文件定义
          }
          let id = '';
          if (window.istemp) {

          }
          // 图片或者附件
          const imagesPath = []
          let imagesUrls = []
          const filesPath = []
          let filesUrls = []
          let defs = []
          res.files['content.json'].async('string').then((content) => {
            const result = this.parseDef(JSON.parse(content))
            defs = result.defs
            obj.chartDefIds = result.chartDefIds
            obj.mainCanvasId = result.mainCanvasId
            id = obj.mainCanvasId

            // 遍历文件
            for (let filename in res.files) {
              // 文件夹不解析
              if (res.files[filename].dir) {
                index++;
              } else {
                // 图片或者附件
                if (filename.indexOf('resources/') == 0) {
                  new Promise((reslove, reject) => {
                    res.files[filename].async('base64').then((content) => {
                      const newfilename = filename.replace('resources/', '')
                      // 判断是否已经下载避免重复请求
                      if (imagesPath.length == 0 || imagesPath.findIndex(d => d.name == newfilename) < 0) {
                        // 判断是否不是图片
                        const savePath = `back/${id}/${newfilename}`
                        ipc1.sendSync('saveFileB64',
                          { type: 'cache', path: savePath, data: content, suffix: '' }
                        ).then((ipcres) => {
                          // 图片
                          if (filename.indexOf('.png') > -1 ||
                            filename.indexOf('.gif') > -1 ||
                            filename.indexOf('.jpg') > -1
                          ) {
                            imagesPath.push({ name: newfilename, path: ipcres })
                          }
                          // 附件
                          else {
                            filesPath.push({ name: newfilename, path: ipcres })
                          }
                          reslove()
                        })
                      }
                      else {
                        reslove()
                      }
                    })
                  }).then(() => {
                    index++;
                  })
                }
                // 其他文件不处理
                else {
                  index++
                }
              }
            }

            // 定时查看是否读取完成
            const intelval = setInterval(() => {
              // console.log(count)
              // console.log(index)
              if (count == index) {
                clearInterval(intelval)
                // 赋值
                const newObj = importClass.newChart(id, 'mind')
                obj.authObj = newObj.authObj
                obj.userObj = newObj.userObj
                obj.chartObj = newObj.chartObj
                // 修改节点对应的上传图片和附件
                defs.forEach(d => {
                  const urls = this.mindImagesFiles(d, imagesPath, filesPath, imagesUrls, filesUrls)
                  imagesUrls = urls.imagesUrls
                  filesUrls = urls.filesUrls
                });
                obj.def = JSON.stringify(defs[0])
                window.cacheImages = imagesUrls
                window.cacheFiles = filesUrls
                // 保存路径备份
                ipc1.sendSync('saveFileB64',
                  { type: 'cache', path: `back/${id}/attachment.json`, data: importClass.stringToBase64String(JSON.stringify(imagesUrls)), suffix: '' }
                )
                ipc1.sendSync('saveFileB64',
                  { type: 'cache', path: `back/${id}/files.json`, data: importClass.stringToBase64String(JSON.stringify(filesUrls)), suffix: '' }
                )
                // console.log(Date.now())
                importClass.dbSave(obj, defs)
                reslove(obj)
              }
            }, 100);
          })
        })

        // const obj = importClass.newChart(id, 'flow', true)
        // obj.def = JSON.stringify(this.init().getEntries(data))
        // importClass.dbSave(obj, [obj.def])
        // reslove(obj)
      })
    })
  },
  /**
   * 
   * @param {*} defs 
   * @returns 
   */
  parseDef(defs) {

    const result = {
      defs: [],
      chartDefIds: [],
      mainCanvasId: ''
    }
    defs.forEach((def, i) => {
      def.page.id = importClass.newId()
      // 画布定义
      result.chartDefIds.push({
        "canvasId": def.page.id,
        "definitionId": def.page.id,
        "title": def.page.name
      },)
      if (i == 0) {
        result.mainCanvasId = def.page.id
      }

      result.defs.push(def.elements)

    })
    return result;
  },
  /**
   * 解析思维导图定义图片附件
   * @param {*} data 
   */
  mindImagesFiles(data, imagesPath, filesPath, imagesUrls, filesUrls) {
    // 是否有图片
    if (Object.hasOwnProperty.call(data, 'image')) {
      let a = imagesPath.filter(f => data.image.url.indexOf(f.name) > -1);
      if (a.length > 0) {
        let path = data.image.url.replace('xap:resources/', '')
        path = '/' + path.substring(0, path.lastIndexOf('.')) + '?'
        imagesUrls.push({
          name: a[0].name, path, url: a[0].path
        })
        data.image.url = 'file:///' + a[0].path
      }
    }
    // 是否有附件
    if (Object.hasOwnProperty.call(data, 'file')) {
      let a = filesPath.filter(f => data.file.value.indexOf(f.name) > -1);
      if (a.length > 0) {
        let path = data.image.value.replace('xap:resources/', '')
        path = '/' + path.substring(0, path.lastIndexOf('.'))
        filesUrls.push({
          name: a[0].name, path: data.file.value, url: a[0].path
        })
        data.file.value = 'file:///' + a[0].path
      }
    }
    // 是否左侧节点
    if (Object.hasOwnProperty.call(data, 'leftChildren')) {
      if (data.leftChildren.length > 0) {
        data.leftChildren.forEach((d) => {
          d = this.mindImagesFiles(d, imagesPath, filesPath, imagesUrls, filesUrls)
        })
      }
    }
    // 是否有节点
    if (Object.hasOwnProperty.call(data, 'children')) {
      if (data.children.length > 0) {
        data.children.forEach((d) => {
          d = this.mindImagesFiles(d, imagesPath, filesPath, imagesUrls, filesUrls)
        })
      }
    }
    return { imagesUrls, filesUrls }
  },
}

/**
 * mmap转换
 */
// 
const mmapToDef = {
  /**
   * mmap内容转定义
   * @param {*} path 
   * @returns 
   */
  load(path) {
    return new Promise((reslove, reject) => {
      const id = importClass.newId()
      const loadData = { type: 'local', path: path }
      ipc1.sendSync('loadFileB64', loadData).then((res) => {
        const data = importClass.base64stringToString(res)

        console.log(this.init().getEntries(data))

        const obj = importClass.newChart(id, 'flow', true)
        obj.def = JSON.stringify(this.init().getEntries(data))
        importClass.dbSave(obj, [JSON.parse(obj.def)])
        reslove(obj)
      })
    })
  },
  init() {

  }
}

// mm内容转定义
const mmToDef = {
  /**
   * mm内容转定义
   * @param {*} path 
   * @returns 
   */
  load(path) {
    return new Promise((reslove, reject) => {
      const id = importClass.newId()
      const loadData = { type: 'local', path: path }
      ipc1.sendSync('loadFileB64', loadData).then((res) => {
        const data = importClass.base64stringToString(res)

        console.log(this.init().getEntries(data))

        const obj = importClass.newChart(id, 'mind', true)
        obj.def = JSON.stringify(this.init().getEntries(data))
        importClass.dbSave(obj, [JSON.parse(obj.def)])
        reslove(obj)
      })
    })
  },
  init() {
    // 标签 map
    var markerMap = {
      "full-1": ["priority", 0],
      "full-2": ["priority", 1],
      "full-3": ["priority", 2],
      "full-4": ["priority", 3],
      "full-5": ["priority", 4],
      "full-6": ["priority", 5],
      "full-7": ["priority", 6],
      "full-8": ["priority", 7]
    };
    var def = {
      "structure": "mind_free",
      "background": "",
      "lines": {},
      'comments': [],
      'watermark': '',
      "data": {
        "right-content-index": 1
      },
      "collapsed": false,
      "showWatermark": false,
      "version": 0,
      "freeChildren": [],
      "root": true,
      "theme": "theme3",
      "id": "root",
      "free": false
    };

    const xssFilter = (val) => {
      if (val == null || val == '') {
        return ''
      }
      val = val.toString()
      val = val.replace(/</g, '&lt;')
      val = val.replace(/%3C/g, '&lt;')
      val = val.replace(/>/g, '&gt;')
      val = val.replace(/%3E/g, '&gt;')
      val = val.replace(/'/g, '&apos;')
      val = val.replace(/"/g, '&quot;')
      return val
    }

    function processTopic(topic, obj, pid) {
      //处理文本
      obj.id = importClass.newId();
      if (pid === "" && def && obj) {
        obj.id = "root";
        var type = "";
        for (var i in def) {
          type = def[i];
          if (type) obj[i] = type;
        }
        obj.title = `${topic.TEXT}` || ""
      }
      else {
        obj.parent = pid;
        obj.title = ''
        if (!topic.TEXT && topic.richcontent) {
          for (var i in topic.richcontent.html.body) {
            if (i == 'p') {
              if (topic.richcontent.html.body[i]) {
                obj.title += `${xssFilter(topic.richcontent.html.body[i])} <br>`
              }
            }
          }
        } else {

          obj.title = `${xssFilter(topic.TEXT)}` || "";
        }
      }
      obj.free = false;
      obj.collapsed = false

      // 处理标签
      if (topic.icon) {
        obj.icons = [];
        var icons = topic.icon;
        type = "";
        if (icons.length && icons.length > 0) {
          for (i in icons) {
            type = markerMap[icons[i].BUILTIN];
            if (type) obj.icons.push({ index: type[1], name: type[0] });
          }
        } else {
          type = markerMap[icons.BUILTIN];
          if (type) obj.icons.push({ index: type[1], name: type[0] });
        }
      }
      // 处理超链接
      if (topic.LINK) {
        obj.link = { value: topic.LINK, type: "url" };
      }
      //处理子节点
      obj.children = [];
      if (topic.node) {
        var tmp = topic.node;
        if (tmp.length && tmp.length > 0) { //多个子节点

          for (i in tmp) {
            if (typeof tmp[i] != "object")
              continue;
            obj.children.push({});
            processTopic(tmp[i], obj.children[i], obj.id);
            if (obj.id == 'root') {
              obj.data = {
                "right-content-index": tmp.length
              }
            }
          }
        } else { //一个子节点
          if (typeof tmp != "object")
            return;
          obj.children = [{}];
          processTopic(tmp, obj.children[0], obj.id);
          if (obj.id == 'root') {
            obj.data = {
              "right-content-index": 1
            }
          }
        }
      }
    }
    function xml2pos(xml) {
      var json = xmlToJson.xml2json(xml);
      var result = {};
      var node = json.node;
      processTopic(node, result, "");
      return result;
    }

    return {
      fileDescription: 'FreeMind',
      fileExtension: '.mm',
      dataType: 'txt',
      getEntries: function (xml) {
        return xml2pos(xml);
      }
    };
  }
}

// km内容转定义
const kmToDef = {
  /**
   * km内容转定义
   * @param {*} path 
   * @returns 
   */
  load(path) {
    return new Promise((reslove, reject) => {
      const id = importClass.newId()
      const loadData = { type: 'local', path: path }
      ipc1.sendSync('loadFileB64', loadData).then((res) => {
        const data = importClass.base64stringToString(res)

        console.log(this.init().getEntries(data))

        const obj = importClass.newChart(id, 'mind', true)
        obj.def = JSON.stringify(this.init().getEntries(data))
        importClass.dbSave(obj, [JSON.parse(obj.def)])
        reslove(obj)
      })
    })
  },
  init() {

    // 标签 map
    var def = {
      "structure": "mind_free",
      "background": "",
      "lines": {},
      'comments': [],
      'watermark': '',
      "data": {
        "right-content-index": 1
      },
      "collapsed": false,
      "showWatermark": false,
      "version": 0,
      "freeChildren": [],
      "root": true,
      "theme": "theme3",
      "id": "root",
      "free": false
    };

    function processTopic(topic, obj, pid) {
      //处理文本
      obj.id = importClass.newId();
      if (pid === "" && def && obj) {
        obj.id = "root";
        var type = "";
        for (var i in def) {
          type = def[i];
          if (type) obj[i] = type;
        }
        obj.title = topic.data.text || "<@i18n resource='mind.centertopic'/>";
      }
      else {
        obj.parent = pid;
        obj.title = topic.data.text || "<@i18n resource='mind.fenzhitopic'/>";
      }
      obj.free = false;
      obj.collapsed = false

      // 处理标签
      if (topic.data.priority || topic.data.progress) {
        obj.icons = [];
        if (topic.data.priority)
          obj.icons.push({ index: topic.data.priority - 1, name: "priority" });

        if (topic.data.progress)
          obj.icons.push({ index: topic.data.progress + 16, name: "completion" });
      }
      // 处理超链接
      if (topic.data.hyperlink) {
        obj.link = { value: topic.data.hyperlink, type: "url" };
      }
      //处理子节点
      obj.children = [];
      if (topic.children) {
        var tmp = topic.children;
        if (tmp.length) { //多个子节点
          for (var i in tmp) {
            if (typeof tmp[i] != "object")
              return;
            obj.children.push({});
            processTopic(tmp[i], obj.children[i], obj.id);
            if (obj.id == 'root') {
              obj.data = {
                "right-content-index": tmp.length
              }
            }
          }
          // } else { //一个子节点
          // 	if(typeof tmp != "object")
          // 		return;
          // 	obj.children = [{}];
          // 	processTopic(tmp, obj.children[0], obj.id);
        }
      }
    }
    function json2pos(json) {
      var result = {};
      processTopic(json.root, result, "");
      return result;
    }

    return {
      fileDescription: 'KityMinder',
      fileExtension: '.km',
      dataType: 'txt',
      getEntries: function (json) {
        return json2pos(eval("(" + json + ")"));
      }
    };
  }
}

// txt内容转定义
const txtToDef = {
  /**
   * txt内容转定义
   * @param {*} path 
   * @returns 
   */
  load(path) {
    return new Promise((reslove, reject) => {
      const id = importClass.newId()
      const loadData = { type: 'local', path: path }
      ipc1.sendSync('loadFileB64', loadData).then((res) => {
        const data = importClass.base64stringToString(res)

        console.log(this.init().getEntries(data))
        const obj = importClass.newChart(id, 'mind', true)
        obj.def = JSON.stringify(this.init().getEntries(data))
        importClass.dbSave(obj, [JSON.parse(obj.def)])
        reslove(obj)
      })
    })
  },
  init() {
    /**
     * 默认定义
     */
    var def = {
      'comments': [],
      'watermark': '',
      "data": {
        "right-content-index": 1
      },
      "collapsed": false,
      "showWatermark": false,
      "version": 0,
      "freeChildren": [],
      "root": true,
      "theme": "theme3",
      "id": "root",
      "free": false
    };

    var plaintext = {};
    /**
     * 将文本内容转换成思维导图数据对象
     */
    plaintext.from = function (data) {
      //分割换行
      var lines = data.split("\n").filter(function (line) {
        //			console.log(line.match(/\S/));
        return line.match(/\S/);
      });
      var items = plaintext._parseItems(lines);
      //如果只有一个缩进，说明有中心主题
      if (items.length == 1) {
        var result = items[0];
      } else {
        //有多个没有缩进的主题，默认为分支主题
        var result = {
          title: "中心主题",
          children: items
        }
      }
      result.id = "root";
      result.structure = "mind_free";
      return result;
    }
    /**
     * 将每行数据转义
     */
    plaintext._parseItems = function (lines) {
      var items = [];
      if (!lines.length) {
        return items;
      }
      //记录第一行数据的空格
      var firstPrefix = plaintext._parsePrefix(lines[0]);
      var currentItem = null;
      var childLines = [];
      /* finalize a block of sub-children by converting them to items and appending */
      var convertChildLinesToChildren = function () {
        if (!currentItem || !childLines.length) {
          return;
        }
        var children = plaintext._parseItems(childLines);
        if (children.length) {
          currentItem.children = children;
        }
        childLines = [];
      }
      /**
       * 遍历所有行
       */
      lines.forEach(function (line, index) {
        //与第一行数据缩进量相同，可以视为同级父主题
        if (plaintext._parsePrefix(line) == firstPrefix) {
          convertChildLinesToChildren.call(this);
          currentItem = { title: line.match(/^\s*(.*)/)[1] };
          items.push(currentItem);
        } else {
          /* prepare as a future child */
          childLines.push(line);
        }
      }, this);
      convertChildLinesToChildren.call(this);
      return items;
    }

    //获取空格
    plaintext._parsePrefix = function (line) {
      return line.match(/^\s*/)[0];
    }
    /**
     * 将转义的对象转成processon专用的对象
     */
    plaintext._changeToTopic = function (obj, parentId) {
      if (obj.id == "root") {
        obj = $.extend(obj, def);
      } else {
        obj.id = importClass.newId();
        obj.parent = parentId;
        obj.collapsed = false;
      }
      var children = obj.children;
      if (children && children.length > 0) {
        $.each(children, function (i, child) {
          plaintext._changeToTopic(child, obj.id);
        });
        if (obj.id == "root") {
          obj.data = {
            "right-content-index": children.length
          }
        }
      } else {
        obj.children = [];
      }
    }
    /**
     * 将文本解析成思维导图
     */
    function processTopic(txt) {
      var result = plaintext.from(txt);
      plaintext._changeToTopic(result);
      return result;
    }

    return {
      fileDescription: 'Text',
      fileExtension: '.txt',
      dataType: 'txt',
      getEntries: function (result) {
        return processTopic(result);
      }
    };
  }
}

// opml内容转定义
const opmlToDef = {
  /**
   * opml内容转定义
   * @param {*} path 
   * @returns 
   */
  load(path) {
    return new Promise((reslove, reject) => {
      const id = importClass.newId()
      const loadData = { type: 'local', path: path }
      ipc1.sendSync('loadFileB64', loadData).then((res) => {
        const data = importClass.base64stringToString(res)
        const imagesUrls = []
        const def = this.init().getEntries(data)
        console.log(def)
        this.mindImagesFiles(def, [], [], id).then((data) => {
          const obj = importClass.newChart(id, 'mind', true)
          obj.def = JSON.stringify(data.data)

          window.cacheImages = imagesUrls
          window.cacheFiles = []
          // 图片或者附件保存路径转化
          ipc1.sendSync('saveFileB64',
            { type: 'cache', path: `back/${id}/attachment.json`, data: importClass.stringToBase64String(JSON.stringify(data.imagesUrls)), suffix: '' }
          )
          ipc1.sendSync('saveFileB64',
            { type: 'cache', path: `back/${id}/files.json`, data: importClass.stringToBase64String(JSON.stringify(data.filesUrls)), suffix: '' }
          )
          importClass.dbSave(obj, [JSON.parse(obj.def)])
          reslove(obj)
        })
      })
    })
  },
  init() {
    /**
   * 默认定义
   */
    var def = {
      "structure": "mind_free",
      "lines": {},
      id: "root",
      root: true,
      children: [],
      comments: [],
      watermark: '',
      collapsed: false,
      showWatermark: '',
      "theme": "theme3",
      freeChildren: [],
      textAutoWrapWidth: 900,
      "data": {
        "right-content-index": 1
      },
      version: 0,
      free: false,
    };
    var plaintext = {};
    /**
     * 将文本内容转换成思维导图数据对象
     */
    plaintext.from = function (obj, parentId) {
      if (obj.id == "root") {
        obj.title = filterXss(obj.title);
        // console.log(obj)
        obj = $.extend(obj, def);
      } else {
        obj.id = importClass.newId();
        obj.title = (filterXss(obj.text[0]) || "");
        delete obj.text;
        obj.parent = parentId;
        if (obj.image) {
          var imgobj = decodeURI(obj.image);
          if (typeof imgobj == 'string') {
            if (imgobj.indexOf(';base64,') == -1) {
              if (imgobj.startsWith('http')) {
                imgobj = {
                  "w": 300,
                  "h": 200,
                  "url": imgobj,
                  "direction": "up"
                }
              }
              else {
                imgobj = JSON.parse(imgobj);
              }
            }
            else {
              imgobj = {
                "w": 300,
                "h": 200,
                "url": imgobj,
                "direction": "up"
              }
            }
          }
          obj.image = imgobj;
        }
        obj.collapsed = false;
        obj.free = false;
      }
      obj.children = [];
      if (obj.outline) {
        if (obj.outline instanceof Array) {
          var len = obj.outline.length;
          if (len > 0) {
            for (var i = 0; i < len; i++) {
              obj.children.push(obj.outline[i]);
            }
            if (obj.id == "root") {
              obj.data = {
                'right-content-index': len
              }
            }
          }
        } else {
          obj.children.push(obj.outline);
          if (obj.id == "root") {
            obj.data = {
              'right-content-index': 1
            }
          }
        }
        delete obj.outline;
      }
      var children = obj.children;
      if (children && children.length > 0) {
        $.each(children, function (i, child) {
          return plaintext.from(child, obj.id);
        });
      }
      return obj;
    }
    //转义不能识别的符号
    function filterXss(val) {
      if (val == null || val == "") {
        return "";
      }
      // val = val.toString();
      // // val = val.replace(/&/g,'&amp;');
      // val = val.replace(/</g, '&lt;');
      // val = val.replace(/%3C/g, '&lt;');
      // val = val.replace(/%3E/g, '&gt;');
      // val = val.replace(/'/g, '&#39;');
      // val = val.replace(/"/g, '&quot;');
      // val = val.replace(/&nbsp;/g, " ");
      // // console.log(val)
      return val;
    }
    /**
     * 将文本解析成思维导图
     */
    function processTopic(xml) {
      var json = xmlToJson.xml2json(xml);
      var result = $.extend(true, {}, json.body);
      result.title = (json.head.title || "").replace(/ /g, '&nbsp;');
      result.id = 'root';
      result.structure = 'mind_free';
      result = plaintext.from(result);
      return result;
    }
    return {
      fileDescription: 'opml',
      fileExtension: 'opml',
      dataType: 'opml',
      getEntries: function (result) {
        return processTopic(result);
      }
    };
  },
  /**
   * 解析思维导图定义图片附件
   * @param {*} data 
   */
  mindImagesFiles(data, imagesUrls, filesUrls, id) {
    return new Promise((reslove) => {
      let isImage = false;
      // 是否有图片
      if (Object.hasOwnProperty.call(data, 'image')) {
        isImage = true
        const fileId = importClass.newId()
        let name = `${fileId}.png`
        if (data.image.url.startsWith('data:')) {
          // 保存图片或者附件
          const saveData = { type: 'cache', data: data.image.url.split(',')[1], path: `back/${id}/${name}`, suffix: '' }
          ipc1.sendSync('saveFileB64', saveData).then((resPath) => {
            imagesUrls.push({ name: name, path: `/${fileId}?`, url: `file:///${resPath}` })
            data.image.url = `file:///${resPath}`
            isImage = false
          })
        }
        else if (data.image.url.startsWith('http')) {
          try {
            window.fetch(data.image.url).then((res) => {
              const contentType = res.headers.get('content-type')
              switch (contentType) {
                case 'image/svg+xml': name = `${fileId}.svg`; break;
                default: name = `${fileId}.${contentType.replace('image/', '')}`; break;
              }
              res.arrayBuffer().then((resData) => {
                // 保存图片或者附件
                const saveData = { type: 'cache', data: importClass.arrayBufferToBase64(resData), path: `back/${id}/${name}`, suffix: '' }
                ipc1.sendSync('saveFileB64', saveData).then((resPath) => {
                  imagesUrls.push({ name: name, path: `/${fileId}?`, url: `file:///${resPath}` })
                  data.image.url = `file:///${resPath}`
                  isImage = false
                })
              })
            })
          }
          catch { }
        }
      }
      // 是否左侧节点
      const count = data.children.length;
      let index = 0;
      // 是否有节点
      if (Object.hasOwnProperty.call(data, 'children')) {
        if (data.children.length > 0) {
          data.children.forEach((d) => {
            this.mindImagesFiles(d, imagesUrls, filesUrls, id).then((res) => {
              d = res.data
              imagesUrls = res.imagesUrls
              filesUrls = res.filesUrls
              index++
            })
          })
        }
      }
      const inte = setInterval(() => {
        if (count == index && !isImage) {
          clearInterval(inte)
          reslove({ data, imagesUrls, filesUrls })
        }
      }, 100)
    })
  }
}

// visio内容转定义
const visioToDef = {
  /**
   * visio内容转定义
   * @param {*} path 
   * @returns 
   */
  load(path) {
    return new Promise((reslove, reject) => {
      if (typeof VisioPo != 'object') {
        bigPipe.render({ js: [staticBasePath + '/assets/js/visio.sdk.umd.js'] }, function () {
          getDef(path).then((res) => {
            reslove(res)
          })
        })
      } else {
        this.getDef(path).then((res) => {
          reslove(res)
        })
      }
    })
  },
  getDef(path) {
    return new Promise((reslove, reject) => {
      const id = importClass.newId()
      const loadData = { type: 'local', path: path }
      const imagesUrls = []
      const filesUrls = []
      ipc1.sendSync('loadFileB64', loadData).then((res) => {
        const fileName = path.split('/').pop()
        const fileData = importClass.base64ToFile(res, fileName)


        VisioPo.exportPo({
          file: fileData,
          url: `${ipc.sendSync('getGlobal', "host")}/api/pc/diagraming/visio/2vsdx`,
          mfUrl: `${ipc.sendSync('getGlobal', "host")}/api/pc/diagraming/visio/wmf2png/base64`,
          handleMedia: (res) => {
            // 图片或者附件保存到本地
            return new Promise((resolve, _) => {
              const fileId = importClass.newId()
              const name = `${fileId}.${res.ext}`
              // 保存图片或者附件
              const saveData = { type: 'cache', data: res.data, path: `back/${id}/${name}`, suffix: '' }
              ipc1.sendSync('saveFileB64', saveData).then((resPath) => {
                // 判断文件类型存储不同集合
                if (res.ext == 'png' || res.ext == 'jpg' || res.ext == 'jpeg' || res.ext == 'gif') {
                  imagesUrls.push({ name: name, path: `/${fileId}?`, url: `${resPath}` })
                } else {
                  filesUrls.push({ name: name, path: `/${name}`, url: `${resPath}` })
                }
                resolve(`file:///${resPath}`)
              })
            })
          }
        })
          .then((_res) => {
            window.cacheImages = imagesUrls
            window.cacheFiles = filesUrls
            // 图片或者附件保存路径转化
            ipc1.sendSync('saveFileB64',
              { type: 'cache', path: `back/${id}/attachment.json`, data: importClass.stringToBase64String(JSON.stringify(imagesUrls)), suffix: '' }
            )
            ipc1.sendSync('saveFileB64',
              { type: 'cache', path: `back/${id}/files.json`, data: importClass.stringToBase64String(JSON.stringify(filesUrls)), suffix: '' }
            )
            // 创建空chart
            const obj = importClass.newChart(id, 'flow', false)
            obj.mainCanvasId = id
            _res.forEach((d, i) => {
              const canvasId = i == 0 ? id : importClass.newId()
              obj.chartDefIds.push({
                canvasId,
                definitionId: canvasId,
                title: '画布' + (i + 1)
              })
            })
            obj.def = JSON.stringify(_res[0])
            importClass.dbSave(obj, _res)
            reslove(obj)
          })
          .catch((ex) => {
            new Toast({ type: 'main', msg: '文件解析失败' })
          })
      })
    })
  }
}

// excel内容转定义
const excelToDef = {
  /**
   * excel内容转定义
   * @param {*} path 
   * @returns 
   */
  load(path) {
    return new Promise((reslove, reject) => {
      const id = importClass.newId()
      const loadData = { type: 'local', path: path }
      ipc1.sendSync('loadFileB64', loadData).then((res) => {
        // const data = importClass.base64ToArrayBuffer(res,true)
        const fileTitle = excelToDef.getFileTitle(path)
        handleImportExcleByArrayBuffer(res, fileTitle).then((res) => {
          res[0].theme = 'basic'
          res[0].structure = 'mind_free'
          res[0].root = true;
          res[0].comments = [];
          res[0].watermark = '';
          res[0].collapsed = false;
          res[0].showWatermark = '';
          res[0].theme = "theme3";
          res[0].freeChildren = [];
          res[0].textAutoWrapWidth = 900;
          res[0].data = {
            "right-content-index": res[0].children.length
          }
          res[0].version = 0
          res[0].free = false
          delete res[0].parent

          console.log(res[0])
          const obj = importClass.newChart(id, 'mind', true)
          obj.def = JSON.stringify(res[0])
          importClass.dbSave(obj, [JSON.parse(obj.def)])
          reslove(obj)
        })
      })
    })
  },
  getFileTitle(path) {
    var reg = /\/([^\/.]+)\.[^.]+$/
    var match = path.match(reg)
    return match[1]
  }
}

// eddx内容转定义
const eddxToDef = {
  /**
   * eddx内容转定义
   * @param {*} path 
   * @returns 
   */
  load(path) {
    return new Promise((reslove, reject) => {
      const id = importClass.newId()
      const loadData = { type: 'local', path: path }
      ipc1.sendSync('loadFileB64', loadData).then((resData) => {
        const data = importClass.base64ToArrayBuffer(resData)
        let t = new XMLJS({ log: true }); //进行转换
        t.init(data).then(res => {
          const obj = importClass.newChart(id, 'flow', true)
          obj.mainCanvasId = id
          res.forEach((d, i) => {
            if (i != 0) {
              const canvasId = importClass.newId()
              const definitionId = canvasId
              obj.chartDefIds.push({
                canvasId,
                definitionId: i == 0 ? id : definitionId,
                title: '画布' + (i + 1)
              })
            }
          })
          obj.def = JSON.stringify(res[0])
          importClass.dbSave(obj, res)
          reslove(obj)
        })
      })
    })
  }
}

const xmlToJson = {

  // converts xml documents and xml text to json object
  xml2json: function (xml, extended) {
    if (!xml) return {}; // quick fail

    //### PARSER LIBRARY
    // Core function
    function parseXML(node, simple) {
      if (!node) return null;
      var txt = '', obj = null, att = null;
      var nt = node.nodeType, nn = jsVar(node.localName || node.nodeName);
      var nv = node.text || node.nodeValue || '';
      /*DBG*/ //if(window.console) console.log(['x2j',nn,nt,nv.length+' bytes']);
      if (node.childNodes) {
        if (node.childNodes.length > 0) {
          /*DBG*/ //if(window.console) console.log(['x2j',nn,'CHILDREN',node.childNodes]);
          $.each(node.childNodes, function (n, cn) {
            var cnt = cn.nodeType, cnn = jsVar(cn.localName || cn.nodeName);
            var cnv = cn.text || cn.nodeValue || '';
            /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>a',cnn,cnt,cnv]);
            if (cnt == 8) {
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>b',cnn,'COMMENT (ignore)']);
              return; // ignore comment node
            }
            else if (cnt == 3 || cnt == 4 || !cnn) {
              // ignore white-space in between tags
              if (cnv.match(/^\s+$/)) {
                /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>c',cnn,'WHITE-SPACE (ignore)']);
                return;
              };
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>d',cnn,'TEXT']);
              txt += cnv.replace(/^\s+/, '').replace(/\s+$/, '');
              // make sure we ditch trailing spaces from markup
            }
            else {
              try {
                /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>e',cnn,'OBJECT']);
                obj = obj || {};
                if (obj[cnn]) {
                  /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>f',cnn,'ARRAY']);
                  if (!obj[cnn].length) obj[cnn] = myArr(obj[cnn]);
                  obj[cnn][obj[cnn].length] = parseXML(cn, true/* simple */);
                  obj[cnn].length = obj[cnn].length;
                }
                else {
                  /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>g',cnn,'dig deeper...']);
                  obj[cnn] = parseXML(cn);
                };
              }
              catch (e) {
                console.log(e)
              }
            };
          });
        };//node.childNodes.length>0
      };//node.childNodes
      if (node.attributes) {
        if (node.attributes.length > 0) {
          /*DBG*/ //if(window.console) console.log(['x2j',nn,'ATTRIBUTES',node.attributes])
          att = {}; obj = obj || {};
          $.each(node.attributes, function (a, at) {
            var atn = jsVar(at.name), atv = at.value;
            att[atn] = atv;
            if (obj[atn]) {
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'attr>',atn,'ARRAY']);
              if (!obj[atn].length) obj[atn] = myArr(obj[atn]);//[ obj[ atn ] ];
              obj[atn][obj[atn].length] = atv;
              obj[atn].length = obj[atn].length;
            }
            else {
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'attr>',atn,'TEXT']);
              obj[atn] = atv;
            };
          });
          //obj['attributes'] = att;
        };//node.attributes.length>0
      };//node.attributes
      if (obj) {
        obj = $.extend((txt != '' ? new String(txt) : {}),/* {text:txt},*/ obj || {}/*, att || {}*/);
        if (txt) {
          txt = (obj.text) ? (typeof (obj.text) == 'object' ? obj.text : [obj.text || '']).concat([txt]) : txt;
        } else {
          txt = (obj.text) ? (typeof (obj.text) == 'object' ? obj.text : [obj.text || '']) : '';
        }
        if (txt) obj.text = txt;
        txt = '';
      };
      var out = obj || txt;
      //console.log([extended, simple, out]);
      if (extended) {
        if (txt) out = {};//new String(out);
        txt = out.text || txt || '';
        if (txt) out.text = txt;
        if (!simple) out = myArr(out);
      };
      // console.log(out)
      return out;
    };// parseXML
    // Core Function End
    // Utility functions
    var jsVar = function (s) { return String(s || '').replace(/-/g, "_"); };
    var isNum = function (s) { return (typeof s == "number") || String((s && typeof s == "string") ? s : '').test(/^((-)?([0-9]*)((\.{0,1})([0-9]+))?$)/); };
    var myArr = function (o) {
      if (!o.length) o = [o]; o.length = o.length;
      // here is where you can attach additional functionality, such as searching and sorting...
      return o;
    };
    // Utility functions End
    //### PARSER LIBRARY END

    // Convert plain text to xml
    if (typeof xml == 'string') xml = this.text2xml(xml);

    // Quick fail if not xml (or if this is a node)
    if (!xml.nodeType) return;
    if (xml.nodeType == 3 || xml.nodeType == 4) return xml.nodeValue;

    // Find xml root node
    var root = (xml.nodeType == 9) ? xml.documentElement : xml;

    // Convert xml to json
    var out = parseXML(root, true /* simple */);

    // Clean-up memory
    xml = null; root = null;

    // Send output
    return out;
  },

  // Convert text to XML DOM
  text2xml: function (str) {
    // NOTE: I'd like to use jQuery for this, but jQuery makes all tags uppercase
    //return $(xml)[0];
    var out;
    try {
      var xml =
        // ($.browser.msie) ? new ActiveXObject("Microsoft.XMLDOM") : 
        new DOMParser();
      xml.async = false;
    } catch (e) { throw new Error("XML Parser could not be instantiated") };
    try {
      // if ($.browser.msie) out = (xml.loadXML(str)) ? xml : false;
      // else 
      out = xml.parseFromString(str, "text/xml");
    } catch (e) { throw new Error("Error parsing XML string") };
    return out;
  }
}

const history = {
  /**
 * 保存历史版本
 * @param {*} remarkText 
 * @returns 
 */
  saveHistoryVersion(remarkText = null) {
    const pId = editorGlobal.poPagination.pageId;
    const cId = editorGlobal.poPagination.data[pId].canvasId;
    return new Promise((reslove, reject) => {
      const hvId = importClass.newId();
      const listFile = 'back/' + chartId + '/' + cId + '/list.json';
      const hvFile = 'back/' + chartId + '/' + cId + '/' + hvId;

      DBUtil.findOne('charts_def', pId, (res) => {
        const currDef = res.definition;

        ipc1.sendSync('loadFileB64', { type: 'cache', path: listFile }).then((hvList) => {
          if (hvList != '') {
            hvList = JSON.parse(hvList);
          } else {
            hvList = [];
          }

          let obj = {
            tmlType: "web",
            canvasId: cId,
            addType: (remarkText == null) ? "auto" : "manual", // [auto, manual]
            photoUrl: "",
            chartId: chartId,
            fullName: "本地缓存",
            remark: (remarkText == null) ? "自动存储_" : remarkText,
            _id: {
              $oid: cId + '/' + hvId
            },
            userId: "",
            definitionId: "",
            // suffix: suff,
            createDate: pcUtil.getDateTimeLocal()
          };

          hvList.unshift(obj);
          const hvListB64 = importClass.stringToBase64String(JSON.stringify(hvList));
          const currDefB64 = importClass.stringToBase64String(currDef);

          ipc1.sendSync('saveFileB64',
            { type: 'cache', data: hvListB64, path: listFile }).then(() => {
              ipc1.sendSync('saveFileB64',
                { type: 'cache', data: currDefB64, path: hvFile }).then(() => {
                  reslove();
                });
            })
        });
      });
    });
  },

  /**
 * 获取历史版本列表
 * @param {*} param {chartId, canvasId}
 * @returns 
 */
  listHistoryVersion(param) {
    return new Promise((reslove, reject) => {
      const listFile = 'back/' + param.chartId + '/' + param.canvasId + '/list.json';

      ipc1.sendSync('loadFileB64', { type: 'cache', path: listFile }).then((hvList) => {
        if (hvList != '') {
          hvList = JSON.parse(hvList);
        } else {
          hvList = [];
        }

        let resData = { cursor: null, sign: null, nextPage: '-1', rsList: hvList };
        if (hvList.length > 0) {
          resData.cursor = param.canvasId + '__' + hvList.length;
        }

        reslove(resData);
      });

    });
  },

  /**
   * 获取历史版本
   * @param {*} param {chartId, versionId}
   * @returns 
   */
  getHistoryVersion(param) {
    return new Promise((reslove, reject) => {
      const canvasId = param.versionId.split('/')[0];
      const hvId = param.versionId.split('/')[1];
      const hvFile = 'back/' + param.chartId + '/' + canvasId + '/' + hvId;

      ipc1.sendSync('loadFileB64', { type: 'cache', path: hvFile }).then((currDefB64) => {
        reslove(importClass.base64stringToString(currDefB64));
      });
    });
  },

  /**
   * 删除历史版本
   * @param {*} param {chartId, versionId} 
   * @returns 
   */
  removeHistoryVersion(param) {
    return new Promise((reslove, reject) => {
      const canvasId = param.versionId.split('/')[0];
      const hvId = param.versionId.split('/')[1];
      const listFile = 'back/' + param.chartId + '/' + canvasId + '/list.json';
      const hvFile = 'back/' + param.chartId + '/' + canvasId + '/' + hvId;

      ipc1.sendSync('loadFileB64', { type: 'cache', path: listFile }).then((hvList) => {
        if (hvList != '') {
          hvList = JSON.parse(hvList);
        } else {
          hvList = [];
        }

        hvList.forEach((obj, i) => {
          if (obj._id.$oid == param.versionId) {
            hvList.splice(i, 1);
            return;
          }
        })

        const hvListB64 = importClass.stringToBase64String(JSON.stringify(hvList));

        ipc1.sendSync('saveFileB64',
          { type: 'cache', data: hvListB64, path: listFile }).then(() => {

            ipc1.invoke('removeFile',
              { type: 'cache', path: hvFile }).then((code) => {
                reslove();
              });
          });
      });
    });
  },
}

export { ipc1, importClass, history, initIpcOn }