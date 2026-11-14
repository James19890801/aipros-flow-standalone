import { ipc1, importClass } from './ipc.js'
import { exportFile1 } from './export.js'
import { isOnlineToast } from './common.js'
import ServerUtil from '../pc/server/server.js'
import FileDatabase from '../pc/operation/fileDatabase.js'
// 上云方法1
async function uploadOnline(obj) {
  const fileName = obj.path.lastIndexOf('.') > -1 ? obj.path.substring(0, obj.path.lastIndexOf('.')) : obj.path
  switch (window.fileType) {
    case 'flow':
      if (!obj.path.endsWith('.posf')) {
        obj.path = obj.path + '.posf'
      }
      break;
    case 'mind':
      if (!obj.path.endsWith('.posm')) {
        obj.path = obj.path + '.posm'
      }
      break;
    case 'outline':
      if (!obj.path.endsWith('.poso')) {
        obj.path = obj.path + '.poso'
      }
      break;
    case 'markdown':
      if (!obj.path.endsWith('.md')) {
        obj.path = obj.path + '.md'
      }
      break;
  }
  ipc.sendToHost('showSaving')
  window.newDir = obj.dir.id
  if (window.fileType != 'markdown') {
    exportFile1.posSaveBak().then(() => {
      ipc.sendToHost('localUpload', { chartId: chartObj.chartId, tabId: TABGROUPID })
      ipc.send('localUpload', chartObj.chartId + ',,,' + obj.path)
      chartObj.title = obj.path.substring(0, obj.path.lastIndexOf('.'))
    }).catch(() => {
      window.toast_.uploadError()
    })
  }
  else {
    const def = await PoEditorClient.getDef()
    if (def == '') {
      ServerUtil.createChart({ folderId: obj.dir.id, category: 'markdown' },
        (data) => {
          var chartId = data.data.chart.chartId
          $.ajax({
            url: host + '/api/personal/chart/rename',
            type: 'post',
            data: { title: fileName, ignore: 'title', chartId: chartId },
            success: function (res2) {
              ipc.sendToHost('hideSaving')
              const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                `http://localhost:5173/src/markdown-editor/index.html?token=token&chartId=${chartId}&dbId=undefined`
                : encodeURI(`file:///${webRoot}/markdown-editor/index.html?token=token&chartId=${chartId}&dbId=undefined`)
              ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
            },
            error: function () {
              new Toast({ type: "error", msg: "服务异常请重试" });
              ipc.sendToHost('hideSaving')
            }
          })
        },
        () => {
          createChart(type, category, origin, originBtnName)
        }, () => {
          new Toast({ type: "error", msg: "服务异常请重试" });
          ipc.sendToHost('hideSaving')
        })
    }
    else {
      const blob = new Blob([await PoEditorClient.getDef()], { type: 'text/json' });
      var file = new File([blob], obj.path)
      var folderId = obj.dir.id;
      var formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", "markdown");
      formData.append("folder", folderId);
      var importUrl = '/api/personal/import/markdown'
      pcUtil.ajax({
        url: importUrl,
        type: 'post',
        async: false,
        contentType: false,
        processData: false,
        data: formData,
        success: function (res) {
          ipc.sendToHost('hideSaving')
          var chartId = res && res.data.chartId
          if (chartId) {
            const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
              `http://localhost:5173/src/markdown-editor/index.html?token=token&chartId=${chartId}&dbId=undefined`
              : encodeURI(`file:///${webRoot}/markdown-editor/index.html?token=token&chartId=${chartId}&dbId=undefined`)
            ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
          }
        },
        error: function (res) {
          ipc.sendToHost('hideSaving')
        }
      });
    }
  }
}
// 上云方法
const uploadCopyFile = {
  init: (chartId, defId, def) => {
    return new Promise((reslove) => {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'uploadCopyFile/data.json' }).then((res) => {
        let data = res == '' ? [] : JSON.parse(res)
        if (data.length == 0) {
          uploadCopyFile.canUploadFile(true)
          reslove(def)
        }
        data = data.filter(d => d.chartId == chartId && d.canvasId == defId)
        if (data.length == 0) {
          uploadCopyFile.canUploadFile(true)
          reslove(def)
        }
        else {
          uploadCopyFile.isUploadFile().then(() => {
            let imageIndex = 0
            let fileIndex = 0
            Promise.all(data.map((d, i) => {
              return new Promise((reslove) => {
                if (d.type == 1) {
                  if (imageIndex == 0) {
                    uploadCopyFile.uploadImage(d).then((result) => {
                      reslove(result)
                    }).catch((result) => {
                      new Toast({ type: "success", msg: "图片上云失败" })
                      // const flag = uploadCopyFile.uploadError()
                      // flag && 
                      reslove(result)
                    })
                    imageIndex++
                  }
                  else {
                    setTimeout(() => {
                      uploadCopyFile.uploadImage(d).then((result) => {
                        reslove(result)
                      }).catch((result) => {
                        new Toast({ type: "success", msg: "图片上云失败" })
                        // const flag = uploadCopyFile.uploadError()
                        // flag && 
                        reslove(result)
                      })
                    }, 3400 * i);
                    imageIndex++
                  }
                }
                else if (d.type == 2) {
                  if (fileIndex == 0) {
                    uploadCopyFile.uploadFile(d).then((result) => {
                      reslove(result)
                    }).catch((result) => {
                      new Toast({ type: "success", msg: "附件上云失败" })
                      // const flag = uploadCopyFile.uploadError()
                      // flag && 
                      reslove(result)
                    })
                    fileIndex++
                  }
                  else {
                    setTimeout(() => {
                      uploadCopyFile.uploadFile(d).then((result) => {
                        reslove(result)
                      }).catch((result) => {
                        new Toast({ type: "success", msg: "附件上云失败" })
                        // const flag = uploadCopyFile.uploadError()
                        // flag && 
                        reslove(result)
                      })
                    }, 3400 * i);
                    fileIndex++
                  }
                }
              })
            }))
              .then((newData) => {
                newData.forEach((d) => {
                  while (def.indexOf(d.url) > -1) {
                    def = def.replace(d.url, d.newUrl)
                  }
                })
                uploadCopyFile.canUploadFile()
                reslove(def)
              })
          })
        }
      })
    })
  },
  isUploadFile: () => {
    return new Promise((reslove) => {
      let isUpload = ipc.sendSync('isUploadCopyFile')
      if (isUpload) {
        reslove(isUpload)
      }
      else {
        const uploadInterval = setInterval(() => {
          isUpload = ipc.sendSync('isUploadCopyFile')
          if (isUpload) {
            clearInterval(uploadInterval)
            reslove(isUpload)
          }
        }, 1000);
      }
    })
  },
  canUploadFile: (flag = false) => {
    ipc.send('canUploadCopyFile', flag)
  },
  uploadImage: (d) => {
    return new Promise((reslove) => {

      ipc1.sendSync('loadFileB64', { type: 'local', path: d.url.replace('file:///', '') }).then((res) => {
        let suffix = d.url.endsWith('.png') ? 'data:image/png;base64,' : d.url.endsWith('.svg') ?
          'data:image/svg+xml;base64,' : d.url.endsWith('.jpg') ?
            'data:image/jpeg;base64,' : `data:image/${d.url.substring(d.url.lastIndexOf('.') + 1)};base64,`
        pcUtil.ajax({
          url: "/api/personal/user/image/upload/base64",
          data: { img: suffix + res },
          success: function (data) {
            if (data.code == '200') {
              d.newUrl = data.data.url
              reslove(d)
            }
            else {
              d.newUrl = ''
              reslove(d)
            }
          },
          error: function () {
            d.newUrl = ''
            reslove(d)
          }
        })
      })
    })
  },
  uploadFile: (d) => {
    return new Promise((reslove, reject) => {

      ipc1.sendSync('loadFileB64', { type: 'local', path: d.url.replace('file:///', ''), isMIME: true }).then((res) => {
        const fileName = d.url.substr(d.url.lastIndexOf('/') + 1)
        const file = importClass.base64ToFile(res, fileName)
        const formData = new FormData()
        formData.append('file', file)
        formData.append('chartId', d.chartId)
        formData.append('topicId', '')
        pcUtil.ajax({
          url: "/api/personal/diagraming/upload/atta",
          contentType: false,
          data:
            formData,
          processData: false,
          success: function (data) {
            if (data.code == '200') {
              d.newUrl = data.data.file_url
              reslove(d)
            }
            else {
              d.newUrl = ''
              reject(d)
            }
          },
          error: function () {
            d.newUrl = ''
            reject(d)
          }
        })
      })
    })
  },
  removeUploadFile: (id) => {
    ipc.send('removeUploadCopyFile', id)
  },
  uploadError() {
    let flag = false
    let reloadIndex = localStorage.getItem(TABGROUPID + '_tab')
    if (reloadIndex) {
      reloadIndex = parseInt(reloadIndex)
      console.log('reloadIndex', reloadIndex)
      reloadIndex++
      localStorage.setItem(TABGROUPID + '_tab', reloadIndex)
      if (reloadIndex >= 4) {
        flag = true
        ipc.sendToHost('hideSaving')
        return flag
      }

      if (window.isUpload) {
        window.fileUpload()
      }
      else {
        window.location.reload()
      }

    }
    else {
      localStorage.setItem(TABGROUPID + '_tab', 1)
      if (window.isUpload) {
        window.fileUpload()
      }
      else {
        window.location.reload()
      }
      return flag
    }
  },
  clearUploadError(flag) {
    let reloadIndex = localStorage.getItem(TABGROUPID + '_tab')
    if (reloadIndex) {
      reloadIndex = parseInt(reloadIndex)
      console.log('reloadIndex1', reloadIndex)
      if (reloadIndex >= 4 || flag) {
        localStorage.removeItem(TABGROUPID + '_tab')
      }
    }
  }
}
// 另存为方法
const saveAs = {
  /**
   * 本地到本地，云到本地
   */
  async saveAsLocal(obj) {
    if (window.fileType != 'markdown') {
      const canvas = []
      for (const k in editorGlobal.poPagination.data) {
        canvas.push(editorGlobal.poPagination.data[k])
      }

      Promise.all(canvas.map(d => {
        return new Promise(resolve => {
          // 读取画布内容
          FileDatabase.getChartDefById(window.chartId, d.definitionId, (def) => {
            // .pos文件集合
            resolve({
              name: `${d.definitionId}.pos`,
              title: d.title,
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
      ).then((resData) => {
        const zip = new window.JSZip1();
        const meta = this.newMeta()
        const pages = []
        resData.forEach((d, i) => {
          const newId = i == 0 ? meta.id : importClass.newId()
          pages.push({ canvasId: newId, definitionId: newId, title: d.title })
          d.data.meta.id = newId
          d.data.meta.mainCanvasId = newId
          // d.data.meta.diagramInfo.title = newId
          d.name = `${newId}.pos`
          // zip.file(`${id}.pos`, JSON.stringify(d.data))
        })
        meta.pages = pages
        zip.file(`meta.json`, JSON.stringify(meta))
        const imgs = zip.folder('attachment')
        const files = zip.folder('files')

        let imagesPath = [];
        let filesPath = [];
        let imagesCount = 0;
        let imagesIndex = 0;
        let filesCount = 0;
        let filesIndex = 0;
        let canvasIndex = 0;
        let canvasCount = 0
        // 读取图片原有地址
        Promise.all([
          ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${chartObj.chartId}/attachment.json` }),
          ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${chartObj.chartId}/files.json` }),
          window.isMyFile && window.fileType !== 'flow' && ipc1.sendSync('loadFileB64', { type: 'cache', path: 'theme/config.json' })]).
          then((res) => {
            canvasCount = resData.length
            const imagesUrls = res[0] == '' ? [] : JSON.parse(res[0])
            const filesUrls = res[1] == '' ? [] : JSON.parse(res[1])
            let themes = []
            if (window.isMyFile) {
              themes = res[2] == '' ? [] : JSON.parse(res[2])
            }
            // 根据类型导出图片和附件
            if (window.fileType == 'flow') {
              resData.forEach((c) => {
                const d = exportFile1.flowImageJson(c.data.diagram.elements, imagesPath, imagesUrls)
                c.data.diagram.elements = d.data;
                imagesPath = d.imagesPath;
                zip.file(c.name, JSON.stringify(c.data))
                canvasIndex++
              })
            }
            else {
              resData.forEach((c) => {
                const d = exportFile1.mindImagesFilesJson(c.data.diagram.elements, imagesPath, filesPath, imagesUrls, filesUrls)
                c.data.diagram.elements = d.data;
                imagesPath = d.imagesPath;
                filesPath = d.filesPath;
                if (c.data.diagram.elements.theme.startsWith('customise_')) {
                  let nowtheme = themes.find(item => item.themeId == c.data.diagram.elements.theme)
                  if (nowtheme) {
                    const theme = JSON.parse(nowtheme.theme)
                    theme.thumbUrl = ''
                    delete theme.id
                    c.data.diagram.elements.theme = JSON.stringify(theme)
                    zip.file(c.name, JSON.stringify(c.data))
                    // zip.file(c.data.diagram.elements.theme, JSON.stringify(nowtheme))
                    canvasIndex++
                  }
                  else {
                    pcUtil.ajax({
                      url: `/api/personal/mindmap/gettheme?id=${c.data.diagram.elements.theme}`,
                      type: 'GET',
                      success: function (data) {
                        if (data.code == 200) {
                          const theme = JSON.parse(data.data)
                          theme.thumbUrl = ''
                          delete theme.id
                          c.data.diagram.elements.theme = JSON.stringify(theme)
                        }
                        zip.file(c.name, JSON.stringify(c.data))
                        canvasIndex++
                      },
                      error: function () {
                        zip.file(c.name, JSON.stringify(c.data))
                        canvasIndex++
                      }
                    })
                  }
                }
                else {
                  zip.file(c.name, JSON.stringify(c.data))
                  canvasIndex++
                }
              })
            }
            // 压缩图片
            imagesCount = imagesPath.length;
            filesCount = filesPath.length;
            imagesPath.forEach((d) => {
              ipc1.sendSync('loadFileB64', { type: 'local', path: d.name, }).then((ipcres) => {
                if (ipcres != '') {
                  imgs.file(`${d.id.replace('svg', 'png')}`, ipcres, { base64: true })
                }
                imagesIndex++;
              })
            })
            filesPath.forEach((d) => {
              ipc1.sendSync('loadFileB64', { type: 'local', path: d.name, }).then((ipcres) => {
                if (ipcres != '') {
                  files.file(`${d.id}`, ipcres, { base64: true })
                }
                filesIndex++;
              })
            })
            // 定时等待其他文件压缩完成
            const inet = setInterval(() => {
              console.log(imagesCount, imagesIndex, filesCount, filesIndex)
              if (imagesCount == imagesIndex && filesCount == filesIndex && canvasIndex == canvasCount) {
                clearInterval(inet)
                // 压缩完成导出base64数据
                zip.generateAsync({ type: 'base64' }).then((content) => {
                  console.log('zip-file-end', Date.now())
                  let saveData = {
                    type: 'local', data: content, path: obj.path, suffix: '',
                  }
                  // 保存
                  ipc1.sendSync('saveFileB64', saveData).then((res) => {
                    if (res != '') {
                      window.toast_.saveSuccess()
                      if (window.fileType == 'flow') {
                        const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                          `http://localhost:5173/src/v5_editor/source/compile/diagrams/index.html?token=token&chartId=&dbId=undefined&filepath=${res}`
                          : encodeURI(`file:///${webRoot}/v5_editor/source/compile/diagrams/index.html?token=token&chartId=&dbId=undefined&filepath=${res}`)
                        ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
                        ipc.sendToHost("saveStatus", window.TABGROUPID, "saved")
                      }
                      else if ((window.fileType == 'mind')) {
                        const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                          `http://localhost:5173/src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=&dbId=undefined&filepath=${res}`
                          : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/index.html?token=token&chartId=&dbId=undefined&filepath=${res}`)
                        ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
                        ipc.sendToHost("saveStatus", window.TABGROUPID, "saved")
                      }
                      else {
                        const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                          `http://localhost:5173/src/v5_editor/source/compile/outline/index.html?token=token&chartId=$&dbId=undefined&filepath=${res}`
                          : encodeURI(`file:///${webRoot}/v5_editor/source/compile/outline/index.html?token=token&chartId=&dbId=undefined&filepath=${res}`)
                        ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
                      }
                    }
                  })
                })
              }
            }, 300)
          })
      })
    }
    else {
      const zip = new window.JSZip1();
      const imgs = zip.folder('attachment');
      const files = zip.folder('files');
      // meta信息
      const meta = this.newMeta();
      const fileName = obj.path.substring(0, obj.path.lastIndexOf('.'))
      meta.diagramInfo.title = fileName
      meta.diagramInfo.category = 'mind_free'
      meta.pages.push({ canvasId: meta.id, definitionId: meta.id, title: window.saveName })
      zip.file(`meta.json`, JSON.stringify(meta))
      // def
      const def = await PoEditorClient.getDef('pos');
      if (!def.diagram.elements) {
        def.diagram.elements = {
          id: "root", data: {
            'right-content-index': 0
          }, children: [], free: false, freeChildren: [], collapsed: false, title: '未命名文件', structure: 'mind_free', root: true, theme: 'theme3', version: 0
        }
      }
      let imagesUrls = []
      const imagesData = this.mindImagesFiles(def, imagesUrls)
      imagesUrls = imagesData.imagesUrls

      Promise.all(imagesUrls.map((d) => {
        return new Promise((reslove) => {
          ipc1.sendSync('loadFileB64', { type: 'local', path: d.oldUrl }).then((ipcres) => {
            if (ipcres != '') {
              imgs.file(`${d.id.replace('svg', 'png')}`, ipcres, { base64: true })
              def.replaceAll(d.oldUrl, d.newUrl)
            }
          })
        })
      }))
        .then(() => {
          def.meta.diagramInfo.category = 'mind_free'
          def.meta.mainCanvasId = meta.id;
          def.meta.exportTime = "2025-08-11 11:19:08";
          def.meta.member = "";
          def.meta.id = meta.id;
          def.meta.type = "AIPROS Schema File";
          def.meta.version = "5.0";
          zip.file(`${meta.id}.pos`, JSON.stringify(def))
          // 压缩完成导出base64数据
          zip.generateAsync({ type: 'base64' }).then((content) => {
            console.log('zip-file-end', Date.now())
            let saveData = {
              type: 'local', data: content, path: obj.path, suffix: '',
            }
            // 保存
            ipc1.sendSync('saveFileB64', saveData).then((res) => {
              if (res != '') {
                window.toast_.saveSuccess()
                const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                  `http://localhost:5173/src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=&dbId=undefined&filepath=${res}`
                  : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/index.html?token=token&chartId=&dbId=undefined&filepath=${res}`)
                ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
              }
            })
          })
        })
    }
  },
  mindImagesFiles(data, imagesUrls) {
    // 是否有图片
    if (Object.hasOwnProperty.call(data, 'image') && Object.hasOwnProperty.call(data.image, 'url')) {
      const fileName = data.image.url.substring(data.image.url.lastIndexOf('/') + 1, data.image.url.lastIndexOf('.'))
      imagesUrls.push({
        oldUrl: data.image.url,
        newUrl: `/${fileName}`,
        fileName: fileName
      })
      data.image.url = `/${fileName}`
    }
    // 是否有节点
    if (Object.hasOwnProperty.call(data, 'children')) {
      if (data.children.length > 0) {
        data.children.forEach((d) => {
          this.mindImagesFiles(d, imagesUrls)
        })
      }
    }
    return ({ data, imagesUrls })
  },
  newMeta() {
    const id = importClass.newId()
    return ({
      "pages": [],
      "mainCanvasId": id,
      "exportTime": pcUtil.getCurrentTimeString(),
      "member": "",
      "diagramInfo": {
        "creator": "",
        "created": pcUtil.getCurrentTimeString(),
        "modified": pcUtil.getCurrentTimeString(),
        "title": chartObj.title,
        "category": chartObj.category
      },
      "id": id,
      "type": "AIPROS Schema File",
      "version": "5.0"

    })
  },
  /**
   * 本地到云
  */
  async saveAsOnline(obj) {
    if (isOnlineToast()) {
      ipc.sendToHost('showSaving')
      if (window.fileType != 'markdown') {
        window.newDir = obj.dir.id
        exportFile1.posSaveBak().then(() => {
          ipc.sendToHost('localUpload', { chartId: chartObj.chartId, tabId: TABGROUPID })
          ipc.send('localUpload', chartObj.chartId + ',,,' + obj.path)
          chartObj.title = obj.path.substring(0, obj.path.lastIndexOf('.'))
        }).catch(() => {
          window.toast_.uploadError()
        })
      }
      else {
        const zip = new window.JSZip1();
        const imgs = zip.folder('attachment');
        const files = zip.folder('files');
        // meta信息
        const meta = this.newMeta();
        const fileName = obj.path.substring(0, obj.path.lastIndexOf('.'))
        meta.diagramInfo.title = fileName
        meta.diagramInfo.category = 'mind_free'
        meta.pages.push({ canvasId: meta.id, definitionId: meta.id, title: window.saveName })
        zip.file(`meta.json`, JSON.stringify(meta))
        // def
        const def = await PoEditorClient.getDef('pos');
        if (!def.diagram.elements) {
          def.diagram.elements = {
            id: "root", data: {
              'right-content-index': 0
            }, children: [], free: false, freeChildren: [], collapsed: false, title: '未命名文件', structure: 'mind_free', root: true, theme: 'theme3', version: 0
          }
        }
        let imagesUrls = []
        const newDef = this.mindImagesFiles(def.diagram.elements, imagesUrls)
        def.diagram.elements = newDef.data
        imagesUrls = newDef.imagesUrls

        Promise.all(imagesUrls.map((d) => {
          return new Promise((reslove) => {
            ipc1.sendSync('loadFileB64', { type: 'local', path: d.oldUrl }).then((ipcres) => {
              if (ipcres != '') {
                imgs.file(`${d.fileName}.png`, ipcres, { base64: true })
                def.replaceAll(d.oldUrl, d.newUrl)
              }
              imagesIndex++;
            })
          })
        }))
          .then(() => {
            def.meta.id = meta.id
            zip.file(`${meta.id}.pos`, JSON.stringify(def))
            // 压缩完成导出base64数据
            zip.generateAsync({ type: 'base64' }).then((content) => {
              var file = this.base64ToFile(content, obj.path)
              var folderId = obj.dir.id;
              var formData = new FormData();
              formData.append("file", file);
              formData.append("fileType", "pos");
              formData.append("folder", folderId);
              var importUrl = '/api/personal/import/file'
              pcUtil.ajax({
                url: importUrl,
                type: 'post',
                async: false,
                contentType: false,
                processData: false,
                data: formData,
                success: function (res) {
                  ipc.sendToHost('hideSaving')
                  var chartId = res && res.data.chartId
                  if (chartId) {
                    const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                      `http://localhost:5173/src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${chartId}&dbId=undefined`
                      : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${chartId}&dbId=undefined`)
                    ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
                  }
                },
                error: function (res) {
                  ipc.sendToHost('hideSaving')
                }
              });
            })
          })
      }
    }
    else {
      window.new = true
    }
  },
  base64ToFile(base64Data, filename, mimeType = "application/zip") {
    // 移除可能的 Base64 前缀（如 "data:application/zip;base64,"）
    const base64WithoutPrefix = base64Data.split(",")[1] || base64Data;

    // 解码 Base64 为二进制数据
    const byteCharacters = atob(base64WithoutPrefix);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      byteArrays.push(new Uint8Array(byteNumbers));
    }

    // 先创建 Blob，再转为 File
    const blob = new Blob(byteArrays, { type: mimeType });
    return new File([blob], filename, { type: mimeType });
  },
  /**
   * 云文件复制(云到云)
   * @param {*} obj 
   */
  async saveAsOnlineByOnline(obj) {
    if (window.fileType != 'markdown') {
      const newName = obj.path.substring(0, obj.path.lastIndexOf('.'))
      $.ajax({
        url: host + '/api/personal//diagraming/create',
        type: 'post',
        data: { folderId: obj.dir.id, category: chartObj.category, templateId: chartObj.chartId },
        success: function (res1) {
          if (res1.code == 200) {
            if (chartObj.title != newName) {
              $.ajax({
                url: host + '/api/personal/chart/rename',
                type: 'post',
                data: { title: newName, ignore: 'title', chartId: res1.data.chart.chartId },
                success: function (res2) {
                  if (res2.code == 200) {
                    window.toast_.saveSuccess()
                    ipc1.send('setTabTitle', newName)
                    if (window.fileType == 'flow') {
                      const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                        `http://localhost:5173/src/v5_editor/source/compile/diagrams/index.html?token=token&chartId=${res1.data.chart.chartId}&dbId=undefined`
                        : encodeURI(`file:///${webRoot}/v5_editor/source/compile/diagrams/index.html?token=token&chartId=${res1.data.chart.chartId}&dbId=undefined`)
                      ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
                    }
                    else if ((window.fileType == 'mind')) {
                      const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                        `http://localhost:5173/src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${res1.data.chart.chartId}&dbId=undefined`
                        : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${res1.data.chart.chartId}&dbId=undefined`)
                      ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
                    }
                    else {
                      const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                        `http://localhost:5173/src/v5_editor/source/compile/outline/index.html?token=token&chartId=${res1.data.chart.chartId}$&dbId=undefined`
                        : encodeURI(`file:///${webRoot}/v5_editor/source/compile/outline/index.html?token=token&chartId=${res1.data.chart.chartId}&dbId=undefined`)
                      ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
                    }
                  }
                  else {
                    window.toast_.saveError()
                  }
                },
                error: function () {
                  window.toast_.saveError()
                }
              })
            }
            else {
              window.toast_.saveSuccess()

              if (window.fileType == 'flow') {
                const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                  `http://localhost:5173/src/v5_editor/source/compile/diagrams/index.html?token=token&chartId=${res1.data.chart.chartId}&dbId=undefined`
                  : encodeURI(`file:///${webRoot}/v5_editor/source/compile/diagrams/index.html?token=token&chartId=${res1.data.chart.chartId}&dbId=undefined`)
                ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
              }
              else if ((window.fileType == 'mind')) {
                const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                  `http://localhost:5173/src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${res1.data.chart.chartId}&dbId=undefined`
                  : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${res1.data.chart.chartId}&dbId=undefined`)
                ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
              }
              else if ((window.fileType == 'markdown')) {
                const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                  `http://localhost:5173/src/markdown-editor/index.html?token=token&chartId=${res1.data.chart.chartId}&dbId=undefined`
                  : encodeURI(`file:///${webRoot}/markdown-editor/index.html?token=token&chartId=${res1.data.chart.chartId}&dbId=undefined`)
                ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
              }
              else {
                const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                  `http://localhost:5173/src/v5_editor/source/compile/outline/index.html?token=token&chartId=${res1.data.chart.chartId}$&dbId=undefined`
                  : encodeURI(`file:///${webRoot}/v5_editor/source/compile/outline/index.html?token=token&chartId=${res1.data.chart.chartId}&dbId=undefined`)
                ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
              }
            }
          }
          else {
            window.toast_.saveError()
          }
        },
        error: function () {
          window.toast_.saveError()
        }
      })
    }
    else {
      let def = await PoEditorClient.getDef('pos')
      if (!def.diagram.elements) {
        def.diagram.elements = {
          "root": "true",
          "showWatermark": false,
          "structure": "mind_free",
          "title": chartObj.title,
          "id": "root",
          "children": [],
        }
      }
      var jsonString = JSON.stringify(def);
      const blob = new Blob([jsonString], { type: 'application/json' });
      var file = new File([blob], obj.path)
      var folderId = obj.dir.id;
      var formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", "pos");
      formData.append("folder", folderId);
      var importUrl = '/api/personal/import/file'
      pcUtil.ajax({
        url: importUrl,
        type: 'post',
        async: false,
        contentType: false,
        processData: false,
        data: formData,
        success: function (res) {
          var chartId = res && res.data.chartId
          if (chartId) {
            window.toast_.saveSuccess()
            const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
              `http://localhost:5173/src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${chartId}&dbId=undefined`
              : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/index.html?token=token&chartId=${chartId}&dbId=undefined`)
            ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
          }
        }
      });
    }
  },
  async saveAsLocalByOnline(obj) {
    if (window.fileType != 'markdown') {
      const type = 'pos_all'
      const newName = obj.path.substring(0, obj.path.lastIndexOf('.'))
      const _url = chartObj.orgId
        ? '/api/org/diagram/export/mindmap'
        : '/chart_image/diagram_export/mindmap'
      let export_url = window.host + _url
      const sData = { type, title: newName, chartId: chartObj.chartId, definition: '', source: '', width: '', height: '', }
      // const form = new FormData();
      // form.append('type', type)
      // form.append('title', window.saveName)
      // form.append('chartId', chartObj.chartId)
      let defs
      let source
      if (window.fileType === 'mind') {
        defs = JSON.stringify(editorGlobal.mindMap.getData())
        source = 'official_old_pos'
      } else if (window.fileType === 'outline') {
        defs = JSON.stringify(outlineObj.model.data)
        source = 'official_old_pos'
      } else {
        defs = JSON.stringify(Model.define)
        source = 'official_old_pos'
      }
      sData.source = source
      export_url = host + '/chart_image/export/file'
      switch (window.fileType) {
        case 'flow': sData.source = 'official_flow_pos'; break;
        case 'mind': sData.source = 'official_mind_pos'; break;
        case 'outline': sData.source = 'official_outline_pos'; break;
      }

      const body = new URLSearchParams(sData).toString();
      window.fetch(export_url, {
        method: 'POST', headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      }).then((res) => {
        res.arrayBuffer().then((data) => {
          let title = window.saveName
          let suffix
          switch (type) {
            case 'all_pos':
            case 'pos_all':
              switch (window.fileType) {
                case 'flow': suffix = 'posf'; break;
                case 'mind': suffix = 'posm'; break;
                case 'outline': suffix = 'poso'; break;
              };
              break;
          }
          // 保存
          ipc1.sendSync('saveFileB64', { type: 'local', data: importClass.arrayBufferToBase64(data), path: obj.path, suffix: '' }).then((resPath) => {
            if (resPath != '') {
              new Toast({ type: 'success', msg: '保存成功' })

              if (window.fileType == 'flow') {
                const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                  `http://localhost:5173/src/v5_editor/source/compile/diagrams/index.html?token=token&chartId=&dbId=undefined&filepath=${resPath}`
                  : encodeURI(`file:///${webRoot}/v5_editor/source/compile/diagrams/index.html?token=token&chartId=&dbId=undefined&filepath=${resPath}`)
                ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
              }
              else if ((window.fileType == 'mind')) {
                const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                  `http://localhost:5173/src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=&dbId=undefined&filepath=${resPath}`
                  : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/index.html?token=token&chartId=&dbId=undefined&filepath=${resPath}`)
                ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
              }
              else {
                const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                  `http://localhost:5173/src/v5_editor/source/compile/outline/index.html?token=token&chartId=$&dbId=undefined&filepath=${resPath}`
                  : encodeURI(`file:///${webRoot}/v5_editor/source/compile/outline/index.html?token=token&chartId=&dbId=undefined&filepath=${resPath}`)
                ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
              }
            }
          })
        })
      })
    }
    else {
      const zip = new window.JSZip1();
      const imgs = zip.folder('attachment');
      const files = zip.folder('files');
      // meta信息
      const meta = this.newMeta();
      const fileName = obj.path.substring(0, obj.path.lastIndexOf('.'))
      meta.diagramInfo.title = fileName
      meta.diagramInfo.category = 'mind_free'
      meta.pages.push({ canvasId: meta.id, definitionId: meta.id, title: window.saveName })
      zip.file(`meta.json`, JSON.stringify(meta))
      // def
      const def =await PoEditorClient.getDef('pos');
      let imagesUrls = []
      const newDef = this.mindImagesFiles(def.diagram.elements, imagesUrls)
      def.diagram.elements = newDef.data
      imagesUrls = newDef.imagesUrls

      Promise.all(imagesUrls.map((d) => {
        return new Promise((reslove) => {
          ipc1.sendSync('loadFileB64', { type: 'local', path: d.oldUrl.replaceAll('file:///', '').replaceAll('file://', '') }).then((res) => {
            if (res != '') {
              imgs.file(`${d.fileName}.png`, res, { base64: true })
              reslove()
            }
          })
        })
      }))
        .then(() => {
          def.meta.diagramInfo.category = 'mind_free'
          def.meta.mainCanvasId = meta.id;
          def.meta.exportTime = "2025-08-11 11:19:08";
          def.meta.member = "";
          def.meta.id = meta.id;
          def.meta.type = "AIPROS Schema File";
          def.meta.version = "5.0";
          zip.file(`${meta.id}.pos`, JSON.stringify(def))
          // 压缩完成导出base64数据
          zip.generateAsync({ type: 'base64' }).then((content) => {
            console.log('zip-file-end', Date.now())
            let saveData = {
              type: 'local', data: content, path: obj.path, suffix: '',
            }
            // 保存
            ipc1.sendSync('saveFileB64', saveData).then((res) => {
              if (res != '') {
                window.toast_.saveSuccess()
                const baseUrl = window.location.href.indexOf('http://localhost') > -1 ?
                  `http://localhost:5173/src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=&dbId=undefined&filepath=${res}`
                  : encodeURI(`file:///${webRoot}/v5_editor/source/compile/mindmap/index.html?token=token&chartId=&dbId=undefined&filepath=${res}`)
                ipc.sendToHost('updateTabUrl', { id: TABGROUPID, url: baseUrl })
              }
            })
          })
        })
    }
  }
}
// 文件上云
function fileUpload() {
  if (window.isUpload) {
    const folderId = pcUtil.getUrlParams('folderId')
    if (window.fileType == 'mind') {
      const title = $('#topic-root .po-richtext-node-wrap').text().trim();
      window.saveName = title == '' ? '未命名文件' : title
    }
    const obj = { path: window.saveName, dir: { id: folderId ? folderId : 'root' } }
    uploadOnline(obj)
  }
}
export { fileUpload, uploadCopyFile, saveAs, uploadOnline }