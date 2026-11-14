
import FileDatabase from '../pc/operation/fileDatabase.js'
import UserOperation from '../pc/db/user.js'
import ServerUtil from '../pc/server/server.js'
import StreamOperation from '../pc/streams/stream.js'
import { ipc1, importClass } from './ipc.js'
import { uploadCopyFile } from './upload.js'
import DBUtil from '../pc/db/db.js'

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString);

// 获取 chart 信息
function getChart() {
  return new Promise((resolve, reject) => {
    FileDatabase.getChartById(window.chartId, (chart) => {
      window.chart = chart
      resolve(chart)
      if (chart) {
        if (chart.favourite) {
          $('.header-fav').addClass('active')
          $('.header-fav .po-diagraming-icons').html('&#xe71e;')
          $('.header-fav').attr('original-title', '取消收藏')
        } else {
          $('.header-fav').removeClass('active')
          $('.header-fav .po-diagraming-icons').html('&#xe6b2;')
          $('.header-fav').attr('original-title', '收藏')
        }
      }
    })
  })
}
// 获取用户信息
function getUserInfo() {
  return new Promise((resolve, reject) => {
    UserOperation.getUser(false, (res) => {
      window.userObj = res
      window.authObj = res.auth
      resolve({ userObj: res, authObj: res.auth })
    })
  })
}
function getNewSetDef({ chartId, chartDef, defId, canvasId }, isMain = false, isSave = false) {
  return new Promise((resolve) => {
    // 拿到当前数据库中的 def version
    const version = JSON.parse(chartDef.definition).version
    // 做一次版本号对比
    StreamOperation.pushDefStreams(
      { chartId, defId, version: version, type: 'flow', canvasId },
      (type) => {
        console.log('canvasType', type)
        // fullUpdate 需要全量更新 saveOnline
        if (type == 'fullUpdate') {
          if (isMain || isSave) {
            $.ajax({
              url: host + '/api/personal/mindmap/canvas/saveonline',
              type: 'post',
              data: { chartId: chartId, def: chartDef.definition, canvasId: canvasId },
              success: function (res1) {
                let newDef = JSON.parse(chartDef.definition)
                newDef.version = newDef.version + 1
                newDef = JSON.stringify(newDef)
                FileDatabase.updateChartDef(window.chartId, canvasId, {
                  definition: newDef
                }, () => {
                })
                resolve(newDef)
              }
            })
          }
          else {
            resolve(true)
          }
        }
        // fullPull 线上大于本地 此时已经更新了，数据库直接拿 返回
        // equality 不做更改 直接获取数据库
        if (type === 'equality' || type == 'fullPull' || type == 'pushConfig') {
          //更新完成 相同 拉去完成后 直接读取最新的本地 def
          FileDatabase.getChartDefByDefId(window.chartId, defId, (chartDef) => {
            // 返回定义ƒ
            resolve(chartDef.definition)
          })
        }
      }
    )
  })
}
// 获取当前文件画布信息
function getCanvasInfo(defId) {
  return new Promise((resolve, reject) => {
    if (window.fileType != 'markdown') {
      // 多画布打开逻辑：
      //  **多画布指令集表  - 操作多画布的指令集合
      //  ** 中间表        - chartId 对应的 canvas 集合 + chart 集合
      //                  - canvas 中包含 chartDefIds 每个画布的数据 +  mainCanvasId

      //  1、查看是否有指令集
      if (pcUtil.isOnline()) {
        FileDatabase.getBaseMultipleInstruct(window.chartId, (instruct) => {
          console.log('有指令集吗？', instruct)
          if (instruct && instruct.msg && instruct.msg.length > 0) {

            window.uploadOnline = instruct.msg
            //  3-1、在线 && 如果有指令 ->推送指令集
            // instruct
            uploadCanvas().then(() => {
              FileDatabase.updateMultipleInstruct(window.chartId, { msg: [] }, () => { })
              // res:本地假数据替换线上真实数据
              FileDatabase.getCanvasList(window.chartId, (data) => {
                const { chartCanvas = [] } = data
                const { canvasIdMap = {}, defIdMap = {}, index = 0 } = window.uploadedOnline
                const chartCanvasOld = chartCanvas
                // 循环画布信息
                chartCanvasOld.map((item) => {
                  if (canvasIdMap[item.canvasId]) {
                    //如果map 中存在则替换
                    item.canvasId = canvasIdMap[item.canvasId]
                  }
                  if (defIdMap[item.definitionId]) {
                    //如果map 中存在则替换
                    DBUtil.putAll('charts_def', item.definitionId, {
                      id: defIdMap[item.definitionId],
                      dbId: item.definitionId
                    })
                    item.definitionId = defIdMap[item.definitionId]
                    // DBUtil.putAll("charts_def", pushBase.definitionId, { id: newFileVal.definitionId, dbId: pushBase.definitionId }, pullDbFile);
                  }
                  // 替换完成 还需要替换 chardef 吗？ 没想好 应该不用 此时是联网的直接自己会获取
                })

                // 拉最新中间表
                // 获取最新数据 覆盖本地中间表
                ServerUtil.getChartCanvas(window.chartId, (data) => {
                  // 获取最新的中间表信息 然后拿去定义 resovle
                  const {
                    canvas: { chartCanvas = [] },
                    canvas = {}
                  } = data

                  var pageId = localStorage.getItem("page_local_" + window.chartId);

                  const maindefinitionId = pageId && chartCanvas.find((item) => item.definitionId == pageId) ? pageId : chartCanvas[0].definitionId;

                  FileDatabase.updateChartMultipleDef(window.chartId, canvas, () => {
                    Promise.all(chartCanvas.map(async (d, u) => {
                      return new Promise((resolve1) => {
                        FileDatabase.getChartDefByDefId(window.chartId, d.definitionId, async (res) => {
                          let defId = undefined
                          let canvasId = undefined
                          const item = chartCanvas.find((i) => i.definitionId === d.definitionId) //todo
                          if (item) {
                            defId = item.definitionId
                            canvasId = item.canvasId
                          }
                          uploadCopyFile.init(window.chartId, canvasId, res.definition).then((newdef) => {
                            uploadCopyFile.removeUploadFile(window.chartId)
                            const isSave = res.definition != newdef
                            res.definition = newdef
                            if (isSave) {
                              FileDatabase.updateChartDef(window.chartId, canvasId, {
                                definition: res.definition
                              }, () => {
                              })
                            }
                            // 然后 根据数据库中的定义和线上最新的做版本对比最终返回一个可用def
                            getNewSetDef({ chartDef: res, chartId: window.chartID, defId, canvasId }, d.definitionId == maindefinitionId, isSave).then((def) => {
                              let nowdef1 = JSON.parse(def)
                              if (d.definitionId == maindefinitionId) {
                                resolve1({ chartDefIds: chartCanvas, mainCanvasId: maindefinitionId, def: JSON.stringify(nowdef1) })
                              }
                              else {
                                if (def) {
                                  resolve1({ chartId: window.chartId, canvasId })
                                }
                                else {
                                  // 是否是推流添加的画布
                                  resolve1({ def: '' })
                                }
                              }
                            })
                          })
                        })
                      })
                    })).then((res) => {
                      const uploadDetail = res.filter(d => Object.hasOwnProperty.call(d, 'canvasId'))
                      if (uploadDetail.length > 0) {
                        ipc1.sendSync('loadFileB64', { type: 'cache', path: 'uploadOnline/data.json' }).then((uploadRes) => {
                          let saveUploadRes = []
                          if (uploadRes != '') saveUploadRes = JSON.parse(uploadRes)
                          saveUploadRes = saveUploadRes.filter(d => d.chartId != uploadDetail[0].chartId)
                          saveUploadRes = saveUploadRes.concat(uploadDetail)
                          ipc1.sendSync('saveFileB64',
                            { type: 'cache', path: 'uploadOnline/data.json', data: importClass.stringToBase64String(JSON.stringify(saveUploadRes)) })
                            .then(() => {
                              resolve(res.find(resd => resd.def != ''))
                            })
                        })
                      }
                      else {
                        resolve(res.find(resd => resd.def != ''))
                      }
                    })
                  })
                })
              })
            })
          } else {
            //  2-1  正常联网情况：多画布指令集表没有待推送指令 直接拉取接口数据 赋值到编辑器
            console.log('no instruct')
            ServerUtil.getCanvasInfoByChartId(window.chartId, (data) => {
              const {
                canvas: { chartCanvas = [] },
                canvas = {},
                chart = {}
              } = data
              FileDatabase.updateChart(window.chartId, '', chart, () => { })
              var pageId = localStorage.getItem("page_local_" + window.chartId);
              const maindefinitionId = pageId && chartCanvas.find((item) => item.definitionId == pageId) ? pageId : chartCanvas[0].definitionId;
              //  2-2  返回的数据覆盖到 中间表

              FileDatabase.updateChartMultipleDef(window.chartId, canvas, () => {
                if (!window.isTemp) {
                  // 2-3 获取当前主画布的 def 如果数据库有返回数据库的也就是可能是旧的
                  //  这里传 mainCanvasId 是因为后端把这个当做了 defId 所以获取定义 一律用 defId
                  Promise.all(chartCanvas.map(async (d, u) => {
                    return new Promise((resolve1) => {
                      FileDatabase.getChartDefByDefId(window.chartId, d.definitionId, async (res) => {
                        let defId = undefined
                        let canvasId = undefined
                        const item = chartCanvas.find((i) => i.definitionId === d.definitionId) //todo
                        if (item) {
                          defId = item.definitionId
                          canvasId = item.canvasId
                        }
                        uploadCopyFile.init(window.chartId, canvasId, res.definition).then((newdef) => {
                          console.log('1111' + Date.now())
                          uploadCopyFile.removeUploadFile(window.chartId)
                          // uploadCopyFile.clearUploadError(true)
                          const isSave = res.definition != newdef
                          res.definition = newdef
                          if (isSave) {
                            FileDatabase.updateChartDef(window.chartId, canvasId, {
                              definition: res.definition
                            }, () => {
                            })
                          }
                          // 然后 根据数据库中的定义和线上最新的做版本对比最终返回一个可用def
                          getNewSetDef({ chartDef: res, chartId: window.chartId, defId, canvasId }, d.definitionId == maindefinitionId, isSave).then((def) => {
                            let nowdef1 = JSON.parse(def)
                            if (d.definitionId == maindefinitionId) {
                              resolve1({ chartDefIds: chartCanvas,chart:chart, mainCanvasId: maindefinitionId, def: JSON.stringify(nowdef1) })
                            }
                            else {
                              resolve1({ def: '' })
                            }
                          })
                        })
                      })
                    })
                  })).then((res) => {
                    resolve(res.find(resd => resd.def != ''))
                  })

                }
                // 模板数据全部取出
                else {
                  getTempDef(chartCanvas).then((res) => {
                    resolve(res)
                  })
                }
              })
            })
          }
        })
      } else {
        // 断网状态
        // 直接打开数据库中的 无需操作指令
        FileDatabase.getCanvasList(window.chartId, (data) => {
          const { chartCanvas = [], mainCanvasId = '' } = data
          FileDatabase.getChartDefById(window.chartId, mainCanvasId, async (def) => {
            resolve({ chartDefIds: chartCanvas, mainCanvasId, def: def.definition })
          })
        })
      }
    }
    else {
      pcUtil.ajax({
        url: `/api/personal/canvas/get/chartdefids`,
        type: 'GET',
        data: { chartId: window.chartId },
        success: (canvas) => {
          FileDatabase.updateChartMultipleDef(window.chartId, canvas.data.canvas.chartCanvas, () => {
            pcUtil.ajax({
              url: `/api/personal/diagraming/get/chart/def/deltas`,
              type: 'GET',
              data: { chartId: window.chartId, defId: canvas.data.canvas.mainCanvasId },
              success: (data) => {
                FileDatabase.updateChartDef(window.chartId, canvas.data.canvas.mainCanvasId, {
                  definition: data.data
                }, () => {
                })
                resolve({ chartDefIds: canvas.data.canvas.chartCanvas,chart:canvas.data.chart, mainCanvasId: canvas.data.canvas.mainCanvasId, def: data.data, defs: [] })
              }
            })
          })
        }
      })
    }
  })
}

// 创建空对象
function createNew() {
  return new Promise((reslove) => {
    ipc1.sendSync('loadFileB64', { type: 'cache', path: 'editor/config.json' }).then((res) => {
      if (res != '') res = JSON.parse(res)
      // 创建Id
      console.log(window.fileType);
      const id = FileDatabase.newId();
      window.chartId = id;
      const obj = {
        chartObj: {},// 文件定义
        authObj: {}, //  身份信息
        userObj: {},//  用户信息
        chartDefIds: [],// 多画布文件定义 id集合 不传默认defenitionId
        mainCanvasId: id,// 主画布id
        def: '' //当前打开的文件定义
      }
      let category = urlParams.get('type')
      switch (window.fileType) {
        case 'flow':
          // 左侧图形配置
          let schema = ["standard", "basic", "flow", "lane"];
          switch (category) {
            case 'flow':
              schema = ["standard", "basic", "flow", "lane"];
              break;
            case 'ui':
              schema = ["standard", 'ui', 'ui_input'];
              break;
            case 'uml':
              schema = ["standard", "basic", 'uml_common', 'uml_usecase', 'uml_sequence', 'uml_class', 'uml_stateactivity', 'uml_deployment', 'uml_component', 'er'];
              break;
            case 'network':
              schema = ["standard", "basic", 'network'];
              break;
            case 'bpmn':
              schema = ["standard", "basic", "bpmn", "lane"];
              break;
            case 'er':
              schema = ["standard", "basic", "er"];
              break;
            case 'venn':
              schema = ["standard", "basic", "venn"];
              break;
            case 'swimlane':
              schema = ["standard", "basic", "lane"];
              break;
          }
          if (!category) category = 'flow'
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
            "schema": schema,
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
          break;
        case 'mind':
        case 'outline':
          category = window.fileType == 'mind' ? category ? category : 'mind_free' : 'outline'
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
          break;
        case 'markdown':
          obj.chartObj = {
            "chartId": id,
            "title": "未命名文件",
            "definitionId": id,
            "owner": {
              "userId": window.userId,
              "userName": "",
              "fullName": ""
            },
            "ownerId": window.userId,
            "description": "",
            "category": "markdown",
            "thumbnail": "6895b9ba6b6861270e387f2d",
            "imgOriginal": "6895b9ba6b6861270e387f2e",
            "shapeCount": 0,
            "status": "private",
            "folderId": "root",
            "language": null,
            "version": 0,
            "tags": null,
            "teamId": null,
            "schema": null,
            "viewLinkId": null,
            "cloneId": null,
            "cloneTime": null,
            "newCreate": true,
            "corpid": null,
            "sortNum": -509,
            "likeCount": 0,
            "commentCount": 0,
            "favouriteCount": 0,
            "viewCount": 0,
            "cloneCount": 0,
            "publicClonePrice": 0,
            "orgId": null,
            "collaRole": "editor",
            "sourceName": null,
            "createTime": "2025-08-08 16:47:54",
            "lastModify": "2025-08-08 16:47:54",
            "publicClone": false,
            "canvasCount": 0,
            "deleteTime": null,
            "belongtoTeam": false,
            "addShortAccess":false,
            "category":"markdown",
            "categoryParent":null,
            "openColla": false,
            "openLinkColla": false,
            "favourite": false,
            "version":0
          }
          obj.needMustColl = false
          break;
      }
      let mindConfig = localStorage.getItem('mindConfig')
      mindConfig = mindConfig ? mindConfig : "{\"tags\":[\"{\\\"text\\\":\\\"待定\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(122, 0, 242)\\\"}\",\"{\\\"text\\\":\\\"已确认\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(80, 194, 139)\\\"}\",\"{\\\"text\\\":\\\"已完成\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(109, 109, 109)\\\"}\",\"{\\\"text\\\":\\\"已关闭\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(196, 196, 196)\\\"}\",\"{\\\"text\\\":\\\"进行中\\\",\\\"color\\\":\\\"rgb(255, 255, 255)\\\",\\\"background\\\":\\\"rgb(39, 96, 242)\\\"}\"]}"
      let outlineConfig = localStorage.getItem('outlineConfig')
      outlineConfig = outlineConfig ? outlineConfig : null
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
      obj.chartDefIds = [
        {
          "canvasId": id,
          "definitionId": id,
          "title": "画布1"
        },
      ]
      // 根据不同类型创建空定义
      obj.def = res['theme'] ?
        FileDatabase.newChartDef(
          window.fileType,
          undefined,
          id,
          res['theme']
        ).definition
        :
        FileDatabase.newChartDef(
          window.fileType,
          undefined,
          id
        ).definition
      if (window.fileType == 'mind' && category) {
        let def = JSON.parse(obj.def)
        let structure = 'mind_free'
        switch (category) {
          case 'mind_tree':
            structure = 'mind_tree'
            break;
          case 'mind_org':
            structure = 'mind_org'
            break;
          case 'fishbone':
          case 'mind_ishikawa_left':
            structure = 'mind_ishikawa_left'
            break;
          case 'timeline':
          case 'mind_timeline_h':
            structure = 'mind_timeline_h'
            break;
          case 'mind_right':
          case 'mind_tree_free':
            structure = 'mind_tree_free'
            break;
          case 'mind':
          case 'mind_brace_right':
            structure = 'mind_brace_right'
            break;
          case 'mind_org_multistage':
            structure = 'mind_org_multistage'
            def = { "leftChildren": [], "children": [{ "parent": "root", "children": [], "id": importClass.newId(), "title": "<b>Name</b><br>CEO" }], "root": true, "theme": "theme3", "showWatermark": false, "id": "root", "isBackground": true, "title": "未命名文件", version: 0, "structure": "mind_org_multistage" }
            break;
        }
        def.structure = structure
        obj.def = JSON.stringify(def)
      }
      
      // 存储indexDB
      ipc1.sendSync('saveFileB64',
        { type: 'cache', path: `back/${id}/attachment.json`, data: importClass.stringToBase64String(JSON.stringify([])), suffix: '' }
      )
      ipc1.sendSync('saveFileB64',
        { type: 'cache', path: `back/${id}/files.json`, data: importClass.stringToBase64String(JSON.stringify([])), suffix: '' }
      )
      DBUtil.save('charts', obj.chartObj)
      DBUtil.save('charts_def', { id: id, definition: obj.def })
      DBUtil.save('charts_multiple_defIds', {
        id: obj.chartObj.chartId,
        chartCanvas: obj.chartDefIds,
        chartDefIds: obj.chartDefIds,
        mainCanvasId: obj.mainCanvasId
      })
      window.chartId = obj.chartObj.id;
      window.chartObj = obj.chartObj;

      switch (window.fileType) {
        case 'flow':
          ipc1.send('setTabTitle', '未命名文件')
          break;
        case 'mind':
          ipc1.send('setTabTitle', '未命名文件')
          break;
        case 'outline':
          ipc1.send('setTabTitle', '未命名文件')
          break;
      }
      const { chartObj, userObj } = obj
      window.editorTabBar.init({ chartObj, userObj })
      if (window.fileType == 'markdown') {
        setTimeout(() => {
          fileCache.add(id).then(() => { ipc.sendToHost('refresh') })
        }, 2000)
        reslove(obj)
      }else{
        fileCache.add(id).then(() => { ipc.sendToHost('refresh') })
        reslove(obj)

      }
    })
  })
}

// 画布指令上传
function uploadCanvas() {
  return new Promise((resolve) => {
    ServerUtil.getChartCanvas(window.chartId, (data) => {
      const {
        canvas: { chartCanvas = [] },
      } = data
      window.uploadOnline.forEach((d) => {
        if (d.action == 'rename') {

          // 循环画布抛出自身
          const filterTitle = chartCanvas.map(d1 => d1.canvasId !== d.canvasId && d1.title)
          // 当前这个title是否出现在其中 
          if (filterTitle.includes(d.context)) {
            for (let i = 1; i <= chartCanvas.length; i++) {
              if (!filterTitle.includes(d.context + '(' + i + ')')) {
                d.context = d.context + '(' + i + ')';
                break;
              }
            }
          }
        }
      })
      let canvasIndex = 0
      let canvasIndexId = ''
      let upload = []
      if (window.uploadOnline.length > 9) {
        for (let i = 0; i < window.uploadOnline.length; i++) {
          if (canvasIndexId != window.uploadOnline[i].canvasId) {
            canvasIndex++
            canvasIndexId = window.uploadOnline[i].canvasId
          }
          if (canvasIndex == 4) {
            canvasIndex = i
            break;
          }
          else {
            upload.push(window.uploadOnline[i])
          }
        }
        upload = window.uploadOnline.splice(0, canvasIndex)
      }
      else {
        upload = window.uploadOnline
        window.uploadOnline = []
      }
      ServerUtil.pushBaseMultipleInstruct(JSON.stringify(upload), (res) => {
        const { canvasIdMap = {}, defIdMap = {}, index = 0 } = res
        for (let i in canvasIdMap) {
          window.uploadedOnline.canvasIdMap[i] = canvasIdMap[i]
        }
        for (let i in defIdMap) {
          window.uploadedOnline.defIdMap[i] = defIdMap[i]
        }
        window.uploadedOnline.index = window.uploadedOnline.index + index
        if (window.uploadOnline.length > 0) {
          uploadCanvas().then(() => {
            resolve()
          })
        }
        else {
          resolve()
        }
      })
    })
  })
}

// 获取模板所有数据
function getTempDef(chartCanvas) {
  return new Promise((resolve) => {
    ServerUtil.getCanvasInfoByChartId(window.chartId, (data) => {

      // 获取模板所有画布数据
      const getCanvasDef = chartCanvas.map(async (d) => {
        const res = await FileDatabase.getChartDefByDefIdForPro(window.chartId, d.definitionId)
        return { id: d.definitionId, data: res.definition }
      })

      Promise.all(getCanvasDef).then((res) => {
        const newChartCanvas = []
        // 模板Id替换成所有随机本地Id
        res.forEach((d, i) => {
          const item = chartCanvas.find((i) => i.definitionId === d.id)
          if (item) {
            const canvasId = importClass.newId()
            const definitionId = importClass.newId()
            d.id = definitionId
            newChartCanvas.push({ canvasId: canvasId, definitionId: definitionId, title: `画布${i}` })
          }
        })
        resolve({ chartDefIds: newChartCanvas, mainCanvasId: newChartCanvas[0].definitionId, def: res[0].data, defs: res })
      })
    })
  })
}

// 缓存方法
const fileCache = {
  add(id, defId = id) {
    return new Promise(async (reslove) => {
      if (window.downType) {
        reslove()
        return
      }
      if (window.fileType != 'markdown') {
        ipc1.sendSync('loadFileB64', { type: 'cache', path: 'theme/config.json' }).then((themes) => {
          if (themes != '') themes = JSON.parse(themes)

          // 准备压缩数据
          // 整合缓存zip
          // 遍历文件并删除
          const zip = new window.JSZip1();
          // 读取所有画布数据
          const canvas = []
          console.log(editorGlobal.poPagination.data)
          for (const k in editorGlobal.poPagination.data) {
            canvas.push(editorGlobal.poPagination.data[k])
          }
          const meta = {
            "pages": canvas,
            "mainCanvasId": canvas[0].canvasId,
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
          }
          zip.file(`meta.json`, JSON.stringify(meta),)
          zip.file('chartObj.json', JSON.stringify(chartObj))
          // 添加文件定义文件
          // 遍历画布


          Promise.all(canvas.map(d => {
            return new Promise((res) => {
              // 读取画布内容
              FileDatabase.getChartDefById(id, d.definitionId, (def) => {
                const elements = JSON.parse(def.definition)
                // .pos文件集合
                zip.file(`${d.definitionId}.pos`,
                  JSON.stringify({
                    "diagram": {
                      "elements": elements
                    },
                    "meta": {
                      "mainCanvasId": d.canvasId,
                      "exportTime": pcUtil.getCurrentTimeString(),
                      "member": "",
                      "diagramInfo": {
                        "creator": "",
                        "created": pcUtil.getCurrentTimeString(),
                        "modified": pcUtil.getCurrentTimeString(),
                        "title": chartObj.title,
                        "category": chartObj.category
                      },
                      "id": d.canvasId,
                      "type": "AIPROS Schema File",
                      "version": "5.0"
                    }
                  })
                )
                if (window.fileType == 'mind' || window.fileType == 'outline') {
                  if (themes != '') {
                    let nowtheme = themes.find(item => item.themeId == elements.theme)
                    if (nowtheme) {
                      zip.file(elements.theme, JSON.stringify(nowtheme))
                      res()
                    }
                    else {
                      res()
                    }
                  }
                  else {
                    res()
                  }
                }
                else {
                  res()
                }
              })
            })
          })).then(() => {
            // 压缩文件打包
            zip.generateAsync({ type: 'base64' }).then((zipdata) => {
              // 版本文件存缓存
              ipc1.sendSync('saveFileB64',
                { type: 'cache', path: `back/${id}/${id}.bak`, data: zipdata, suffix: '' }
              ).then((backPath) => {

                // 读取最近目录
                ipc1.sendSync('loadFileB64', { type: 'cache', path: 'history/cache.json' }).then((resHis) => {
                  // 制作最近数据
                  if (resHis == '') {
                    resHis = '[]'
                  }
                  let history = JSON.parse(resHis);
                  const index = history.findIndex(hisd => (
                    hisd.chartId == id ||
                    (hisd.chartId != id && hisd.filepath == window.filepath && window.filepath != ''))
                    && (hisd.type == 4 || hisd.type == 5 || hisd.type == 2))
                  if (history.length == 0 || index == -1) {
                    const historyC = {
                      "chartId": id,
                      "title": window.saveName,
                      "category": meta.diagramInfo.category,
                      "definitionId": meta.mainCanvasId,
                      "owner": {
                        "userId": userId,
                        "userName": fullName,
                        "fullName": fullName
                      },
                      "ownerId": "1001",
                      "description": "",
                      "thumbImage": "",
                      "lastModify": pcUtil.getCurrentTimeString(),
                      "filepath": filepath && (filepath.endsWith('.posf') || filepath.endsWith('.posm') || filepath.endsWith('.poso') || filepath.endsWith('.pos')) ?
                        window.filepath : `${window.cachePath}/back/${id}/${id}.bak`,
                      "type":
                        filepath ? (filepath.endsWith('.posf') || filepath.endsWith('.posm') || filepath.endsWith('.poso') || filepath.endsWith('.pos') ? 2 : 5) :
                          window.isMyFile ? 5 : 4
                    }
                    history.push(historyC)
                    const result = importClass.stringToBase64String(JSON.stringify(history));
                    // 存储最近文件
                    ipc1.sendSync('saveFileB64',
                      { type: 'cache', data: result, path: 'history/cache.json', suffix: '' }).then(() => {
                        // 崩溃临时缓存
                        handleCrash({ history, id, type: 'save' })
                        reslove()
                      })
                  }
                  else if (index > -1) {
                    if (history[index].chartId != id) {
                      history[index].chartId = id
                      history[index].mainCanvasId = chartObj.definitionId
                    }
                    if (!filepath || !filepath.endsWith('.bak')) {
                      history[index].title = window.saveName
                    }
                    if (history[index].type == 5 && !window.filepath.endsWith('.bak')) {
                      history[index].type == 2
                    }
                    history[index].lastModify = pcUtil.getCurrentTimeString()
                    history[index].filepath = filepath != null && filepath != '' && !filepath.endsWith('.bak') && (filepath.endsWith('.posf') || filepath.endsWith('.posm') || filepath.endsWith('.poso') || filepath.endsWith('.pos'))
                      ? window.filepath : window.isMyFile && window.filepath != '' ? window.filepath : `${window.cachePath}/back/${id}/${id}.bak`
                    const result = importClass.stringToBase64String(JSON.stringify(history));
                    // 存储最近文件
                    ipc1.sendSync('saveFileB64',
                      { type: 'cache', data: result, path: 'history/cache.json', suffix: '' }).then(() => {
                        // 崩溃临时缓存
                        handleCrash({ history, id, type: 'save' })
                        reslove()
                      })
                  }
                })
              })
            })
          })
        })
      }
      else {
        // 版本文件存缓存
        const md = await PoEditorClient.getDef('md')
        ipc1.sendSync('saveFileB64',
          { type: 'cache', path: `back/${id}/${window.saveName}.bak`, data: importClass.stringToBase64String(md), suffix: '' }
        ).then((backPath) => {

          // 读取最近目录
          ipc1.sendSync('loadFileB64', { type: 'cache', path: 'history/cache.json' }).then((resHis) => {
            // 制作最近数据
            if (resHis == '') {
              resHis = '[]'
            }
            let history = JSON.parse(resHis);
            const index = history.findIndex(hisd => (
              hisd.chartId == id ||
              (hisd.chartId != id && hisd.filepath == window.filepath && window.filepath != ''))
              && (hisd.type == 4 || hisd.type == 5 || hisd.type == 2))
            if (history.length == 0 || index == -1) {
              const historyC = {
                "chartId": id,
                "title": window.saveName,
                "category": 'markdown',
                "definitionId": id,
                "owner": {
                  "userId": userId,
                  "userName": fullName,
                  "fullName": fullName
                },
                "ownerId": "1001",
                "description": "",
                "thumbImage": "",
                "lastModify": pcUtil.getCurrentTimeString(),
                "filepath": filepath && (filepath.endsWith('.posf') || filepath.endsWith('.posm') || filepath.endsWith('.poso') || filepath.endsWith('.pos') || filepath.endsWith('.md')) ?
                  window.filepath : `${window.cachePath}/back/${id}/${window.saveName}.bak`,
                "type":
                  filepath ? (filepath.endsWith('.posf') || filepath.endsWith('.posm') || filepath.endsWith('.poso') || filepath.endsWith('.pos') || filepath.endsWith('.md') ? 2 : 5) :
                    window.isMyFile ? 5 : 4
              }
              history.push(historyC)
              const result = importClass.stringToBase64String(JSON.stringify(history));
              // 存储最近文件
              ipc1.sendSync('saveFileB64',
                { type: 'cache', data: result, path: 'history/cache.json', suffix: '' }).then(() => {
                  // 崩溃临时缓存
                  handleCrash({ history, id, type: 'save' })
                  reslove()
                })
            }
            else if (index > -1) {
              if (history[index].chartId != id) {
                history[index].chartId = id
                history[index].mainCanvasId = chartObj.definitionId
              }
              if (!filepath || !filepath.endsWith('.bak')) {
                history[index].title = window.saveName
              }
              if (history[index].type == 5 && !window.filepath.endsWith('.bak')) {
                history[index].type == 2
              }
              history[index].lastModify = pcUtil.getCurrentTimeString()
              history[index].filepath = filepath != null && filepath != '' && !filepath.endsWith('.bak') && (filepath.endsWith('.posf') || filepath.endsWith('.posm') || filepath.endsWith('.poso') || filepath.endsWith('.pos') || filepath.endsWith('.md'))
                ? window.filepath : window.isMyFile && window.filepath != '' ? window.filepath : `${window.cachePath}/back/${id}/${id}.bak`
              const result = importClass.stringToBase64String(JSON.stringify(history));
              // 存储最近文件
              ipc1.sendSync('saveFileB64',
                { type: 'cache', data: result, path: 'history/cache.json', suffix: '' }).then(() => {
                  // 崩溃临时缓存
                  handleCrash({ history, id, type: 'save' })
                  reslove()
                })
            }
          })
        })
      }
    })
  },
  isSave(id, save = false) {
    // 记录历史版本
    ipc1.sendSync('loadFileB64',
      { type: 'cache', path: `back/${id}/config.json` }
    ).then((configres) => {
      let config = {}
      if (configres !== '') {
        config == JSON.parse(configres)
      }
      config.isSave = save
      // 保存历史版本
      ipc1.sendSync('saveFileB64',
        { type: 'cache', path: `back/${id}/config.json`, data: importClass.stringToBase64String(JSON.stringify(history)), suffix: '' }
      )
    })
  }
}

// 崩溃存储
function handleCrash({ history, id, type }) {
  // 当前数据
  return new Promise(function (resolve, reject) {
    if (window.downType) {
      reslove()
      return
    }
    const curFileList = history.filter(item => item.chartId == id)
    if (curFileList.length > 0) {
      curFileList[0].tabId = TABGROUPID
      if (window.fileType != 'markdown') {
        curFileList[0].filepath = `${window.cachePath}/back/${id}/${id}.bak`
      }
      else {
        curFileList[0].filepath = `${window.cachePath}/back/${id}/${window.saveName}.bak`
      }

      // 判断已存在
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'crash/data.json' }).then((res = []) => {
        console.log("崩溃数据：", res);
        if (!res) res = '[]'
        res = JSON.parse(res)

        const isExist = res.findIndex(c => c.chartId === id)

        if (type == 'save' && !window.location.href.includes('insert=true')) {
          isExist > -1 ? res.splice(isExist, 1, curFileList[0]) : res.push(curFileList[0])
        }

        if (type == 'remove' && isExist > -1) {
          res.splice(isExist, 1)
        }

        // 更新
        const result = importClass.stringToBase64String(JSON.stringify(res));
        ipc1.sendSync('saveFileB64',
          { type: 'cache', data: result, path: 'crash/data.json' }).then(() => {
            resolve()
          })
      })
    }
    else {
      resolve()
    }
  })


}

// title替换
function replaceTitle(str) {
  return str.replace(/<\/?span[^>]*>/g, "");
}

// 是否联网toast
function isOnlineToast() {
  if (pcUtil.isOnline()) {
    return true
  }
  else {
    window.toast_.offLine()
    return false
  }
}

// 对象复制
function deepClone(obj, hash = new WeakMap()) {
  if (obj === null) return null; // null 的情况  
  if (obj instanceof Date) return new Date(obj); // 日期对象直接返回一个新的日期对象  
  if (obj instanceof RegExp) return new RegExp(obj); // 正则对象直接返回一个新的正则对象  
  // 如果循环引用则直接返回  
  if (hash.has(obj)) return hash.get(obj);

  let allDesc = Object.getOwnPropertyDescriptors(obj);
  let cloneObj = Object.create(Object.getPrototypeOf(obj), allDesc);
  hash.set(obj, cloneObj);

  for (let key of Reflect.ownKeys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      cloneObj[key] = deepClone(obj[key], hash); // 递归复制  
    } else {
      cloneObj[key] = obj[key];
    }
  }
  return cloneObj;
}

// 定义复制
function deepCopy() {
  let defs
  if (window.fileType === 'mind') {
    defs = deepClone(editorGlobal.mindMap.getData())

  } else if (window.fileType === 'outline') {
    defs = deepClone(outlineObj.model.data)
  } else {
    defs = deepClone(Model.define)
  }
  return defs
}

// 是否有表单，没有添加
function isForm() {
  if (!$('#export_form').is('#export_form')) {
    const element = document.createElement('div')
    element.innerHTML = '<iframe name="export_iframe" style="display: none"></iframe>' +
      '<form id="export_form" target="export_iframe" action="/chart_image/diagram_export/mindmap" method="post">' +
      '<input id="export_definition" type="hidden" name="definition">' +
      '<input id="export_title" type="hidden" name="title">' +
      '<input id="export_width" type="hidden" name="width">' +
      '<input id="export_height" type="hidden" name="height">' +
      '<input id="export_id" type="hidden" name="chartId">' +
      '<input type="hidden" name="ignore" value="definition">' +
      '<input id="export_type" type="hidden" name="type">' +
      '<input id="export_source" type="hidden" name="source">' +
      '<input id="export_uuid" type="hidden" name="powerStr">' +
      '</form>'
    element.style.display = 'none'
    document.body.append(element)
  }
}

// 添加title
function addHeaderTitle() {
  const element = document.createElement('div')
  element.id = 'header-title'
  element.style = 'position:fixed;left:-1000px;top:-1000px'
  element.innerHTML = window.saveName
  document.body.appendChild(element)
}

// 按钮禁用初始化
function pointerEventsInit() {
  if (!isMyFile) {
    $('.po-tool-button[tit="present"]').css('pointer-events', 'none')
    $('.po-tool-button[tit="present"]').css('opacity', 0.5)
    $('#po-flow-fill-color').on('click', pointerEvents)
    $('#btn_colla_share').css('pointer-events', 'none')
    $('#btn_colla_share').css('opacity', 0.5)

    $('#btn_colla_share').css('pointer-events', 'none')
    $('#btn_colla_share').css('opacity', 0.5)
    setTimeout(() => {
      window.onbeforeunload = null
    }, 1000);
  }
  else {
    setTimeout(() => {
      $('#btn_history').remove()
    }, 500);
  }
  $('.po-menu-item[op="torefresh"]').remove()
}
// 按钮初始化
function pointerEvents() {
  setTimeout(() => {
    $('#po-flow-fill-img').css('pointer-events', 'none')
    $('#po-flow-fill-img').css('opacity', 0.5)
  }, 300);
}

// 导出权限获取
function newExportPower(type) {
  return new Promise((reslove) => {
    const isOwner = chartObj?.owner?.userId !== userObj?.userId;
    if (isOwner) {
      pcUtil.ajax({
        url: "/api/personal/chart/export/get/export/power",
        data: { chartId: window.chartId, exportType: type },
        type: "get",
        success: function (data) {
          if (data.code == 200) {
            reslove(true)
          } else {
            new Toast({ type: "error", msg: "您今日下载导出次数已达上限" });
            reslove(false)
          }
        }, error: function (data) {
          new Toast({ type: "error", msg: "系统错误，请稍后再试" });
          reslove(false)
        }
      })
    }
    else {
      reslove(true)
    }
  })
}

// 内容上传
function beginUploadDetails() {

  ipc1.sendSync('loadFileB64', { type: 'cache', path: 'uploadOnline/data.json' }).then((uploadRes) => {
    let saveUploadRes = []
    if (uploadRes != '') {
      saveUploadRes = JSON.parse(uploadRes)
      const result = saveUploadRes.filter(d => d.chartId == chartObj.chartId)
      if (result.length > 0) {
        const count = result.length
        let index = 0
        let intervalIndex = 0
        result.forEach((d) => {
          setTimeout(() => {
            FileDatabase.getChartDefByDefId(d.chartId, d.canvasId, async (res) => {
              // 然后 根据数据库中的定义和线上最新的做版本对比最终返回一个可用def
              getNewSetDef({ chartDef: res, chartId: d.chartId, defId: d.canvasId, canvasId: d.canvasId }, false, true).then((def) => {
                index++
              })
            })
          }, 2000);
        })
        const interval = setInterval(() => {
          if (count == index) {
            clearInterval(interval)
            ipc1.sendSync('saveFileB64',
              {
                type: 'cache', path: 'uploadOnline/data.json',
                data: importClass.stringToBase64String(JSON.stringify(saveUploadRes.filter(d => d.chartId !== chartObj.chartId)))
              })
              .then(() => {
                resolve(res.find(resd => resd.def != ''))
              })
          }
          else if (intervalIndex == 3) {
            clearInterval(interval)
          }
          else {
            intervalIndex++
          }
        }, result.length * 2000);
      }
    }
  })
}

const history = {
  addHistory(params) {
    return new Promise((reslove) => {
      const { canvasId = '', def = '', remark = '自动存储', terminal = 'web' } = params
      const chartId = window.chartId
      const fileId = importClass.newId()
      const data = {
        addType: remark == '自动存储' ? 'auto' : 'manual',
        canvasId,
        chartId,
        createDate: pcUtil.getDateTimeLocal(),
        definitionId: fileId,
        fullName: window.fullName,
        photoUrl: '',
        remark,
        tmlType: terminal,
        userId: window.userId,
        _id: {
          $oid: canvasId + '/' + fileId
        },
      }
      const listPath = `back/${chartId}/history/${canvasId}/list.json`
      const filePath = `back/${chartId}/history/${canvasId}/${fileId}.bak`
      ipc1.sendSync('loadFileB64', { type: 'cache', path: listPath }).then((res) => {
        let listData = []
        if (res != '') {
          listData = JSON.parse(res)
        }
        listData.push(data)
        ipc1.sendSync('saveFileB64', { type: 'cache', path: listPath, data: importClass.stringToBase64String(JSON.stringify(listData)) }).then(() => {
          ipc1.sendSync('saveFileB64', { type: 'cache', path: filePath, data: importClass.stringToBase64String(def) }).then(() => {
            reslove({ code: '200', data: null, msg: '调用成功' })
          })
        })
      })
    })
  },
  getHistorys(params) {
    return new Promise((reslove) => {
      const { canvasId = '' } = params
      const chartId = window.chartId
      const listPath = `back/${chartId}/history/${canvasId}/list.json`
      ipc1.sendSync('loadFileB64', { type: 'cache', path: listPath }).then((res) => {
        let listData = []
        if (res != '') {
          listData = JSON.parse(res)
        }
        const resultData = {
          cursor: `${canvasId}_${listData.length}`,
          nextPage: '-1',
          rsList: listData,
          msg: '调用成功'
        }
        reslove(resultData)
      })
    })
  },
  getHistory(parmas) {
    return new Promise((reslove) => {
      const { versionId = '' } = parmas
      const chartId = window.chartId
      const canvasId = versionId.split('/')[0];
      const fileId = versionId.split('/')[1];
      const filePath = `back/${chartId}/history/${canvasId}/${fileId}.bak`
      ipc1.sendSync('loadFileB64', { type: 'cache', path: filePath }).then((res) => {
        reslove({ definition: importClass.base64stringToString(res) })
      })
    })
  },
  removeHistory(parmas) {
    return new Promise((reslove) => {
      const { versionId = '' } = parmas
      const chartId = window.chartId
      const canvasId = versionId.split('/')[0];
      const fileId = versionId.split('/')[1];
      const listPath = `back/${chartId}/history/${canvasId}/list.json`
      const filePath = `back/${chartId}/history/${canvasId}/${fileId}.bak`
      ipc1.sendSync('loadFileB64', { type: 'cache', path: listPath }).then((res) => {
        let listData = []
        if (res != '') {
          listData = JSON.parse(res)
        }
        listData = listData.filter(d => d._id.$oid != versionId)
        ipc1.sendSync('saveFileB64', { type: 'cache', path: listPath, data: importClass.stringToBase64String(JSON.stringify(listData)) }).then(() => {
          ipc1.sendSync('removeFile', filePath).then(() => {
            reslove({ code: '200', data: null, msg: '调用成功' })
          })
        })
      })
    })
  },
  revertHistory(parmas) {
    return new Promise((reslove) => {
      const { definitionId = '', versionId = '' } = parmas
      const chartId = window.chartId
      const canvasId = versionId.split('/')[0];
      const fileId = versionId.split('/')[1];
      const filePath = `back/${chartId}/history/${canvasId}/${fileId}.bak`
      const fileBak = `back/${chartId}/${chartId}.bak`
   
      ipc1.sendSync('loadFileB64', { type: 'cache', path: filePath }).then((res) => {
        const def = importClass.base64stringToString(res)
        let newDef = {
          id:definitionId,
          definition:def
        }
        DBUtil.save('charts_def',newDef)
        ipc1.sendSync('loadFileB64', { type: 'cache', path: fileBak }).then((data) => {
          JSZip.loadAsync(data, { base64: true }).then(async (res) => {
            const newzip = new JSZip()

            for (let filename in res.files) {
              if (filename.endsWith('meta.json')) {
                const contentc = await res.files[filename].async('string')
                newzip.file('meta.json', contentc)
              }
              else if (filename.endsWith('.pos')) {
                if (filename.startsWith(definitionId) || filename.startsWith(canvasId)) {
                  newzip.file(filename, def)
                }
                else {
                  const contentc = await res.files[filename].async('string')
                  newzip.file(filename, contentc)
                }
              }
            }
            newzip.generateAsync({ type: 'base64' }).then((content) => {
              ipc1.sendSync('saveFileB64', { type: 'cache', path: fileBak, data: content }).then(() => {
                if (window.defVersion.length > 0) {
                  const index = window.defVersion.findIndex(d => d.id == canvasId)
                  if (index > -1) {
                    window.defVersion[index].version++
                    window.defVersion[index].isSave = false
                  } else {
                    window.defVersion.push({ id: canvasId, version: 1, isSave: false })
                  }
                }
                else {
                  window.defVersion.push({ id: canvasId, version: 1, isSave: false })
                }
                ipc.sendToHost("saveStatus", window.TABGROUPID, "unsave")
                reslove({ code: '200', data: null, msg: '调用成功' })
              })
            })
          })
        })
      })
    })
  }
}

export {
  getChart, getUserInfo, getCanvasInfo, createNew, fileCache, getNewSetDef,
  handleCrash, replaceTitle, isOnlineToast, deepCopy, isForm, addHeaderTitle, pointerEventsInit,
  newExportPower, beginUploadDetails, history
}