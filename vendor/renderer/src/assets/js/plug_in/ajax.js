
import { ipc1, importClass } from './ipc.js'
import { Toast } from '../pc/class.js'
import UserOperation from '../pc/db/user.js'
import FileDatabase from '../pc/operation/fileDatabase.js'
import ServerUtil from '../pc/server/server.js'
import DBUtil from '../pc/db/db.js'
import { handleInject } from './injectInsert.js'
import { injectCommon } from './injectCommon.js'
import { getNewSetDef, fileCache, history } from './common.js'
import { exportFile1 } from './export.js'
const isMyFileInit = () => {
  // 复写fetch防止程序不支持 fetch API
  window.oldfetch = window.fetch
  window.fetch = (url, init) => {
    const fetchUrl = typeof url === 'string' ? url : (url && url.url) || ''
    if (fetchUrl.startsWith('data:') || fetchUrl.startsWith('blob:')) {
      return window.oldfetch(url, init)
    }
    return new Promise((reslove, reject) => {
      const isAiConsume = typeof url === 'string' && (url.indexOf('/api/personal/ai/point/process/ai/consume') > -1 || url.indexOf('/api/org/ai/consume') > -1)
      const rejectAiOffline = () => {
        try { new Toast({ type: "warning", msg: "网络已断开" }) } catch (e) {}
        reject(new TypeError('Failed to fetch'))
      }
      if (url.startsWith('//iconsapi.com')) {
        window.oldfetch('http:' + url, init).then((res) => {
          reslove(res)
        })
      }
      else if ((url.indexOf('http://') == 0 || url.indexOf('https://') == 0)
        && url.indexOf('http://localhost:5173') < 0) {
        if (isAiConsume && !navigator.onLine) {
          rejectAiOffline()
          return
        }
        window.toast_ && window.toast_.testOnline && window.toast_.testOnline();
        window.oldfetch(url, init).then((res) => {
          reslove(res)
        }).catch((err) => {
          if (isAiConsume) {
            try { !navigator.onLine && new Toast({ type: "warning", msg: "网络已断开" }) } catch (e) {}
            reject(err)
          }
        })
      }
      else if (url.indexOf('//') == 0 && url.indexOf('///') == -1
        && url.indexOf('http://localhost:5173') < 0) {
        if (isAiConsume && !navigator.onLine) {
          rejectAiOffline()
          return
        }
        window.toast_ && window.toast_.testOnline && window.toast_.testOnline();
        window.oldfetch('http:' + url, init).then((res) => {
          reslove(res)
        }).catch((err) => {
          if (isAiConsume) {
            try { !navigator.onLine && new Toast({ type: "warning", msg: "网络已断开" }) } catch (e) {}
            reject(err)
          }
        })
      }
      else {
        if (url.indexOf('http://localhost:5173') > -1 || url.indexOf('https://localhost') > -1) {
          window.oldfetch(url, init).then((res) => {
            reslove(res)
          })
          return
        }
        let isEditor = false
        if (url.startsWith('./../../staticfile:///')) {
          isEditor = true
          url = url.replace('./../../staticfile:///', '')
        }
        if (url.indexOf('file:///') > -1) {
          isEditor = true
          url = url.replace('file:///', '');
        }
        if (url.indexOf('///') > -1) {
          isEditor = true
          url = url.replace('///', '');
        }
        if (url.startsWith('../../../fonts/')) {
          isEditor = true
          if (window.location.href.startsWith('http://localhost:5173')) {
            url = url.replace('font//', 'http://localhost:5173/src/v5_editor/fonts/')
            window.oldfetch(url, init).then((res) => {
              reslove(res)
            })
            return
          }
          else {
            url = url.replace('../../../fonts/', webRoot + '/v5_editor/fonts/')
          }
        }
        if (url.indexOf('./../../static//assetsfile:///') > -1) {
          isEditor = true
          url = url.replace('./../../static//assets', '')
        }
        if (url.indexOf('./../../static/') > -1) {
          isEditor = true
          url = url.replace('./../../static/', webRoot + '/v5_editor/source/static/')
        }
        if (url.indexOf('./../../.../../../v5_editor/source/static/') > -1) {
          isEditor = true
          if (window.location.href.startsWith('http://localhost:5173')) {
            url = url.replace('./../../../../v6_editor', 'http://localhost:5173/src/v6_editor')
            window.oldfetch(url, init).then((res) => {
              reslove(res)
            })
            return
          }
          else {
            url = url.replace('./../../../.../../../v5_editor/source/static/', webRoot + './../../v5_editor/source/static/')
          }
        }
        if (url.indexOf('qt:///assets/images') > -1 || url.indexOf('file:///assets/images') > -1) {
          isEditor = true
          url = url.replace('qt:///', webRoot + '/v5_editor/source/static/').replace('file:///', webRoot + '/v5_editor/source/static/')
        }
        if (url.lastIndexOf('?_') > -1) {
          url = url.substring(0, url.lastIndexOf('?_'))
        }

        ipc1.sendSync('loadFileB64', { type: 'local', path: url }).then((data) => {
          const headers = new window.Headers();
          if (url.indexOf('.svg') > -1) {
            headers.append('content-type', 'image/svg+xml')
            base64SvgToPngArrayBuffer(data).then(arrayBuffer => {
              // 在这里处理ArrayBuffer，例如将其发送到服务器或进行其他操作
              console.log(arrayBuffer);

              reslove({
                body:
                  !isEditor ? data : atob(data),
                bodyUsed: 'false',
                headers: headers,
                ok: true,
                redirected: false,
                status: 200,
                statusText: 'OK',
                type: 'cors',
                url,
                text: () => {
                  return atob(data)
                },
                arrayBuffer: () => {
                  return new Promise((reslove) => {
                    reslove(arrayBuffer)
                  })
                }
              })
            }).catch(error => {
              reslove({
                body: '',
                // new ArrayBuffer(atob(data).length),
                bodyUsed: 'false',
                headers: headers,
                ok: true,
                redirected: false,
                status: 200,
                statusText: 'OK',
                type: 'cors',
                url,
                text: () => {
                  return ''
                },
                arrayBuffer: () => {
                  return new Promise((reslove) => {
                    reslove(null)
                  })
                }
              })
              console.error('Error converting SVG to PNG ArrayBuffer:', error);
            });
          } else {
            if (url.endsWith('woff2')) {
              headers.append('content-type', 'font/woff')
            }
            else if (url.endsWith('ttf')) {
              headers.append('content-type', 'font/ttf')
            }
            else if (url.endsWith('otf')) {
              headers.append('content-type', 'font/otf')
            }
            else if (url.endsWith('ttc')) {
              headers.append('content-type', 'font/ttc')
            }
            else if (url.endsWith('eot')) {
              headers.append('content-type', 'font/eot')
            }
            else {
              headers.append('content-type', 'image/png')
            }
            reslove({
              body:
                !isEditor ? data : atob(data),
              bodyUsed: 'false',
              headers: headers,
              ok: true,
              redirected: false,
              status: 200,
              statusText: 'OK',
              type: 'cors',
              url,
              text: () => {
                return atob(data)
              },
              blob: () => {
                return importClass.base64ToBlob(data, 'image/png')
              },
              arrayBuffer: () => {
                return new Promise((reslove) => {
                  reslove(importClass.base64ToArrayBuffer(data))
                })
              }
            })
          }
        })
      }

    })
  }

  function base64SvgToPngArrayBuffer(base64Svg) {
    return new Promise((resolve, reject) => {
      // 解码Base64字符串为Uint8Array
      const svgBytes = atob(base64Svg);
      const svgData = new Uint8Array(svgBytes.length);
      for (let i = 0; i < svgBytes.length; i++) {
        svgData[i] = svgBytes.charCodeAt(i);
      }

      // 将Uint8Array转换为Blob
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });

      // 创建一个URL对象，以便可以将其用作<img>元素的源
      const svgUrl = URL.createObjectURL(svgBlob);

      // 创建一个新的Image对象，并设置其源为SVG的URL
      const img = new Image();
      img.onload = function () {
        // 创建canvas元素并设置其大小
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        // 将图片绘制到canvas上
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // 将canvas内容转换为Blob
        canvas.toBlob(function (blob) {
          // 读取Blob为ArrayBuffer
          const reader = new FileReader();
          reader.onloadend = function () {
            resolve(reader.result); // reader.result 是ArrayBuffer
            URL.revokeObjectURL(svgUrl); // 释放URL对象
          };
          if (blob) {
            reader.readAsArrayBuffer(blob);
          } else {
            reject(new Error('Failed to create Blob from canvas'));
          }
        }, 'image/png');
      };
      img.onerror = function (error) {
        reject(error);
        URL.revokeObjectURL(svgUrl); // 释放URL对象
      };
      img.src = svgUrl;
    });
  }
}
const queryString = window.location.search
const urlParams = new URLSearchParams(queryString);
if (window.isMyFile == undefined) {
  window.isMyFile = false
  let filepath = urlParams.get('filepath')
  if (filepath || filepath == '' || window.isTemp || window.location.href.indexOf('tempId=') > -1) {
    window.isMyFile = true
  }
}
if (window.isMyFile) {
  let filepath = urlParams.get('filepath')
  if (filepath && filepath.endsWith('.bak')) {
    filepath = decodeURI(filepath)
    ipc1.sendSync('loadFileB64', { type: 'cache', path: 'history/cache.json' }).then((resHis) => {

      if (resHis !== '') {
        const data = JSON.parse(resHis)
        const result = data.filter(d => d.filepath == filepath)
        if (result.length > 0) {
          result[0].type == 4 ? window.isMyFile = false : isMyFileInit()
          setTimeout(() => {
            if (!window.new)
              ipc.sendToHost('setFileIcon', window.TABGROUPID, window.isMyFile, 0, true)
          }, 400);
        }
        else {
          isMyFileInit()
          setTimeout(() => {
            if (!window.new)
              ipc.sendToHost('setFileIcon', window.TABGROUPID, window.isMyFile, 0, true)
          }, 400);
        }
      }
      else {
        setTimeout(() => {
          if (!window.new)
            ipc.sendToHost('setFileIcon', window.TABGROUPID, window.isMyFile, 0, true)
        }, 400);
      }
    })
  }
  else {
    isMyFileInit()
    // 文件tab的标识云文件/本地文件 图标
    setTimeout(() => {
      if (!window.new)
        ipc.sendToHost('setFileIcon', window.TABGROUPID, window.isMyFile, 0, true)
    }, 400);
  }
}
else {
  setTimeout(() => {
    !window.isMyFile && ipc.sendToHost('setFileIcon', window.TABGROUPID, window.isMyFile, 0, true)
  }, 400);
}

/**
 * 检测当前操作是否可以发送
 * @param {*} params
 * @param {*} callback
 * @returns
 */
function checkbeforeSendMsg(params, callback) {
  return new Promise((reslove) => {
    let flag = true
    const msgData = JSON.parse(params.msgStr)
    const { isImage, isFile, imageData, fileData } = checkMsg(msgData, params)
    // 云文件
    if (!window.isMyFile) {
      if (isImage > 1 || isFile > 1) {
        new Toast({ type: "warning", msg: "无法从本地文件复制带有多张图片或者附件的内容到云文件" })
        flag = false
        callback({
          offline: true
        })
        setTimeout(() => {
          if (window.fileType == 'flow') {
            MessageSource.undo()
          }
          else {
            editorGlobal.mindMap.messageSource.undo(mind)
          }
        }, 100);
        reslove({ flag, params })
      }
      else if (pcUtil.isOnline() && isImage == 1) {
        const isUploadCopyFile = ipc.sendSync('isUploadCopyFile')
        if (isUploadCopyFile) {
          const d = imageData[0]
          ipc1.sendSync('loadFileB64', { type: 'local', path: d.url.replace('file:///', '') }).then((res) => {
            let suffix = d.url.endsWith('.png') ? 'data:image/png;base64,' : d.url.endsWith('.svg') ?
              'data:image/svg+xml;base64,' : d.url.endsWith('.jpg') ?
                'data:image/jpeg;base64,' : `data:image/${d.url.substring(d.url.lastIndexOf('.') + 1)};base64,`
            pcUtil.ajax({
              url: "/api/personal/user/image/upload/base64",
              data: { img: suffix + res },
              success: function (data) {
                if (data.code == '200') {
                  let nowData
                  params.msgStr = params.msgStr.replace(d.url, data.data.url)
                  switch (window.fileType) {
                    case 'flow':
                      for (let k in Model.define.elements) {
                        if (Model.define.elements[k].name == 'standardImage') {
                          if (Model.define.elements[k].fillStyle.fileId == d.url) {
                            Model.define.elements[k].fillStyle.fileId = data.data.url
                          }
                        }
                      }
                      nowData = Model.define
                      break;
                    case 'mind':
                    case 'outline':
                      nowData = replaceMindImageUrl(window.PoEditorClient.getDef(), d.url, data.data.url)
                      window.PoEditorClient.updateDef(nowData.data)

                      break;
                  }
                  ipc.send('canUploadCopyFile')
                  reslove({ flag, params, nowData })
                }
              },
              error: function () {
                flag = false
                window.toast_.noUse()
                callback({
                  offline: true
                })
                setTimeout(() => {
                  if (window.fileType == 'flow') {
                    MessageSource.undo()
                  }
                  else {
                    editorGlobal.mindMap.messageSource.undo(mind)
                  }
                }, 100);
                reslove({ flag, params })
              }
            })
          })
        }
        else {
          new Toast({ type: "warning", msg: "操作过于频繁" })
          flag = false
          callback({
            offline: true
          })
          setTimeout(() => {
            if (window.fileType == 'flow') {
              MessageSource.undo()
            }
            else {
              editorGlobal.mindMap.messageSource.undo(mind)
            }
          }, 100)
          reslove({ flag, params })
        }
      }
      else if (!pcUtil.isOnline() && (isImage > 0 || isFile > 0)) {
        const data = imageData.concat(fileData)
        ipc.send('saveUploadCopyFile', data)
        flag = true
        reslove({ flag, params })
      }
      else {
        flag = true
        reslove({ flag, params })
      }
    }
    // 本地文件
    else {
      // if (isImage || isFile) {
      //   new Toast({ type: "warning", msg: "无法从云文件复制带有图片或者附件的内容到本地文件" })
      //   flag = false
      //   callback({
      //     offline: true
      //   })
      //   setTimeout(() => {
      //     if (window.fileType == 'flow') {
      //       MessageSource.undo()
      //     }
      //     else {
      //       editorGlobal.mindMap.messageSource.undo(mind)
      //     }
      //   }, 100);
      // }
      reslove({ flag, params })
    }
  })
}

function checkMsg(msgData, params) {
  let isImage = 0
  let isFile = 0
  let imageData = []
  let fileData = []
  msgData.map((msg) => {
    // 流程图操作
    if (msg.action == 'command') {
      msg.messages.map((m) => {
        // 新增
        if (m.action == 'create') {
          m.content.map((d) => {
            // 图片
            if (Object.hasOwnProperty.call(d, 'name') && d.name == 'standardImage') {
              // 云文件
              if (!window.isMyFile) {
                if (!d.fillStyle.fileId.startsWith('http')) {
                  isImage++
                  imageData.push({
                    chartId: params.chartId,
                    canvasId: params.canvasId,
                    nodeId: d.id,
                    type: 1,
                    url: d.fillStyle.fileId
                  })
                }
              }
              // 本地文件
              else {
                if (d.fillStyle.fileId.startsWith('http') && !(d.fillStyle.fileId.startsWith('https://iconsapi.com/') || d.fillStyle.fileId.startsWith('http://iconsapi.com/'))) {
                  isImage++
                }
              }
            }
          })
        }
      })
    }
    // 思维导图修改操作
    if (msg.action == 'update') {
      // 思维导图添加图片或者附件
      if (msg.content.type == 'image' || msg.content.type == 'file') {
        msg.content.content.map((d) => {
          // 图片
          if (Object.hasOwnProperty.call(d, 'image')) {
            // 云文件
            if (!window.isMyFile) {
              if (!d.image.url.startsWith('http')) {
                isImage++
                imageData.push({
                  chartId: params.chartId,
                  canvasId: params.canvasId,
                  nodeId: d.id,
                  type: 1,
                  url: d.image.url
                })
              }
            }
            // 本地文件
            else {
              if (d.image.url.startsWith('http') && !(d.image.url.startsWith('https://iconsapi.com/') || d.image.url.startsWith('http://iconsapi.com/'))) {
                isImage++
              }
            }
          }
          // 附件
          if (Object.hasOwnProperty.call(d, 'file')) {
            // 云文件
            if (!window.isMyFile) {
              if (d.file.value.startsWith('file://')) {
                isFile++
                fileData.push({
                  chartId: params.chartId,
                  canvasId: params.canvasId,
                  nodeId: d.id,
                  type: 2,
                  url: d.file.value
                })
              }
            }
            // 本地文件
            else {
              if (d.file.value.startsWith('http')) {
                isFile++
              }
            }
          }
        })
      }
      else if (msg.content.key == 'image') {
        msg.content.nodes.map((d) => {
          // 图片
          if (Object.hasOwnProperty.call(d, 'image')) {
            // 云文件
            if (!window.isMyFile) {
              if (!d.image.url.startsWith('http')) {
                isImage++
                imageData.push({
                  chartId: params.chartId,
                  canvasId: params.canvasId,
                  nodeId: d.id,
                  type: 1,
                  url: d.image.url
                })
              }
            }
            // 本地文件
            else {
              if (d.image.url.startsWith('http') && !(d.image.url.startsWith('https://iconsapi.com/') || d.image.url.startsWith('http://iconsapi.com/'))) {
                isImage++
              }
            }
          }
          // 附件
          if (Object.hasOwnProperty.call(d, 'file')) {
            // 云文件
            if (!window.isMyFile) {
              if (d.file.value.startsWith('file://')) {
                isFile++
                fileData.push({
                  chartId: params.chartId,
                  canvasId: params.canvasId,
                  nodeId: d.id,
                  type: 2,
                  url: d.file.value
                })
              }
            }
            // 本地文件
            else {
              if (d.file.value.startsWith('http')) {
                isFile++
              }
            }
          }
        })
      }
    }
    if (msg.action == 'create') {
      msg.content.content.map((d) => {
        const { isImage1, isFile1, imageData1, fileData1 } = checkMindCreateMsg(d, isImage, isFile, [], [], params)
        if (isImage1) isImage = isImage1
        if (isFile1) isFile = isFile1
        if (imageData1) imageData = imageData1
        if (fileData1) fileData = fileData1
      })
    }
  })
  return ({ isImage, isFile, imageData, fileData })
}

function checkMindCreateMsg(d, isImage, isFile, imageData = [], fileData = [], params) {

  // 图片
  if (Object.hasOwnProperty.call(d, 'image')) {
    // 云文件
    if (!window.isMyFile) {
      if (!d.image.url.startsWith('http')) {
        isImage++
        imageData.push({
          chartId: params.chartId,
          canvasId: params.canvasId,
          nodeId: d.id,
          type: 1,
          url: d.image.url
        })
      }
    }
    // 本地文件
    else {
      if (d.image.url.startsWith('http') && !(d.image.url.startsWith('https://iconsapi.com/') || d.image.url.startsWith('http://iconsapi.com/'))) {
        isImage++
      }
    }
  }
  // 附件
  if (Object.hasOwnProperty.call(d, 'file')) {
    // 云文件
    if (!window.isMyFile) {
      if (!d.file.value.startsWith('http')) {
        isFile++
        fileData.push({
          chartId: params.chartId,
          canvasId: params.canvasId,
          nodeId: d.id,
          type: 2,
          url: d.file.value
        })
      }
    }
    // 本地文件
    else {
      if (d.file.value.startsWith('http')) {
        isFile++
      }
    }
  }
  // 附件
  if (Object.hasOwnProperty.call(d, 'children')) {
    d.children.map((d1) => {
      const { isImage1, isFile1, imageData1, fileData1 } = checkMindCreateMsg(d1, isImage, isFile)
      if (isImage1) isImage = isImage1
      if (isFile1) isFile = isFile1
      if (imageData1) imageData = imageData1
      if (fileData1) fileData = fileData1
    })
  }
  return ({ isImage1: isImage, isFile1: isFile, imageData1: imageData, fileData1: fileData })
}

function replaceMindImageUrl(data, ourl, nurl) {
  // 是否有图片
  if (Object.hasOwnProperty.call(data, 'image') && Object.hasOwnProperty.call(data.image, 'url') && !data.image.url.startsWith('data:image')) {
    if (data.image.url == ourl) {
      data.image.url = nurl
    }
  }
  if (Object.hasOwnProperty.call(data, 'leftChildren')) {
    if (data.leftChildren.length > 0) {
      data.leftChildren.forEach((d) => {
        d = replaceMindImageUrl(d, ourl, nurl)
      })
    }
  }
  // 是否有节点
  if (Object.hasOwnProperty.call(data, 'children')) {
    if (data.children.length > 0) {
      data.children.forEach((d) => {
        d = replaceMindImageUrl(d, ourl, nurl)
      })
    }
  }
  // 是否有节点
  if (Object.hasOwnProperty.call(data, 'freeChildren')) {
    if (data.freeChildren.length > 0) {
      data.freeChildren.forEach((d) => {
        d = replaceMindImageUrl(d, ourl, nurl)
      })
    }
  }
  return { data }
}

// shapes转svg
async function shapesToSvg(shapes) {
  // 调用部分导出逻辑
  var els = {};
  for (var i = 0; i < shapes.length; i++) {
    var shape = shapes[i];
    els[shape.id] = shape;
  }
  const exportData = await PoEditorClient.shapesToImage({
    type: 'png',
    fileType: 'flow',
    elements: els,
    eqBase64: true,
    background: "transparent",
  });
  return exportData.img;
}

const hostConfig = ipc.sendSync('getHost') || {}
const othterUrl = hostConfig.host || ipc.sendSync('getGlobal', 'host')
const aiUrl = hostConfig.aiConversationUrl || ''
const aiSseUrl = hostConfig.aiSseUrl || ''

function requestAiSse(path, method, params, cb, raw) {
  window.serveApiObj.getGenerateTokenHistory(params, function (res) {
    if (res.result === 'error' || !res.token) {
      cb({ result: 'error', res: res });
      return;
    }
    var isPost = method === 'POST' || method === 'post';
    pcUtil.ajax({
      url: aiSseUrl + path,
      type: method,
      data: isPost ? JSON.stringify(params) : params,
      ...(isPost ? { contentType: 'application/json' } : {}),
      headers: {
        ...(isPost ? {} : { 'Content-Type': 'application/json' }),
        Authorization: 'Bearer ' + res.token,
        ...(res.appId != null ? { appId: res.appId } : {}),
      },
      success: function (data) {
        if (raw) cb && cb(data);
        else cb({ result: 'success', data: data });
      },
      error: function (data) {
        cb({ result: 'error', data: data });
      }
    });
  });
}

function aiShowPayLimit() {
  new Toast({ type: 'error', msg: '今日免费使用次数已达上限' });
  var pointPtype = location.pathname.indexOf('mindmap') > -1 ? '思维导图' : '流程图';
  ipc.sendToHost('showDlgPayWebView', { pay_position: pointPtype + '编辑页', pointssource: pointPtype + 'AI生成次数不足pc', title: '升级会员解锁全部下载格式', aiPay: true });
}

window.serveApiObj = {
  //保存
  sendMsg: async function (params, callback) {
    if (params.canvasId == '') {
      params.canvasId = editorGlobal.poPagination.pageId
    }
    params.chartId = window.chartId
    const isshowOffLineToast = localStorage.getItem('isshowOffLineToast')
    if (!window.isMyFile && !navigator.onLine && !isshowOffLineToast) {
      window.confirmIn({
        onlyConfrim: true,
        okval: '知道了',
        title: "风险提示",
        content: "网络异常，您可以继续对当前文件进行编辑操作，网络恢复后数据将实时同步至云端，为了保证您的数据安全请尽快恢复网络"
      })
      localStorage.setItem('isshowOffLineToast', "1")
    }
    checkbeforeSendMsg(params, callback).then((result) => {
      if (result.flag) {
        params = result.params
        let version = ''
        if (window.fileType === 'mind') {
          version = editorGlobal.sendMessage.version
        } else if (window.fileType === 'outline') {
          version = sendMessage.version
        } else {
          version = sendMessage.version
        }
        const msgFn = () => {
          // 添加 Ajax 默认请求类型

          // 获取上传的指令
          const msgStr = JSON.parse(params.msgStr)

          // 是否需要更新 lastModify
          let hasLastModify = true

          // 检测是否包含需要添加本地处理的请求, 并给每条指令添加 category 属性
          msgStr.map((msg) => {
            msg.category = 'flow'
            // 修改标题
            if (msg.action == 'changeTitle') {
              hasLastModify = false
              FileDatabase.getChartById(window.chartId, (chart) => {
                chart.title = msg.title
                FileDatabase.updateChart(window.chartId, false, chart, (chart) => {
                })
              })
            }
            // 修改 图形管理
            else if (msg.action == 'changeSchema') {
              hasLastModify = false
              const schema = msg.categories.split(',')
              if (window.chartObj) window.chartObj.schema = schema
              FileDatabase.updateChart(window.chartId, false, { schema })
            }
            else if (msg.action == 'insertTemp') {
              const title = msg.content.content.title
              if (title != '' && window.saveName == '未命名文件') {
                window.saveName = title
                ipc1.send('setTabTitle', window.saveName)
              }
            }
          })

          params.msgStr = JSON.stringify(msgStr)
          // 更新本地文件定义到最新
          let updateData = {}
          if (window.fileType === 'mind') {
            updateData = { ...editorGlobal.mindMap.getData(), version }
          } else if (window.fileType === 'outline') {
            updateData = { ...outlineObj.model.data, version }
          } else {
            updateData = { ...Model.define, version }
          }
          FileDatabase.updateChartDef(window.chartId, params.canvasId, {
            definition: JSON.stringify(updateData)
          }, () => {
            hasLastModify && FileDatabase.updateChart(window.chartId, 'lastModify', null, () => {
              fileCache.add(chartObj.chartId)
            })
          })
          if (pcUtil.isOnline()) {
            if (window.isMyFile) {
              setTimeout(() => {
                callback({ result: 'success', data: { version } })
              }, 100);
            }
            else {
              let msgversion = ""
              let url = `/api/personal/diagraming/canvas/v2/msg`;
              if (fileType == 'outline') {
                url = `/api/personal/outline/canvas/msg`;
              }
              if (fileType == "mind") {
                url = "/api/personal/mindmap/canvas/msg";
                msgversion = "v6"
              }
              pcUtil.ajax({
                url: `${url}?mlfffid=${window.chartId}&mlffcid=${params.canvasId}`,
                data: { msgStr: params.msgStr, canvasId: params.canvasId, chartId: window.chartId, ignore: 'msgStr', msgversion: msgversion },
                type: 'POST',
                cache: false,
                success(data) {
                  callback({ result: 'success', data: data })
                },
                error(data) {
                  callback(data)
                }
              })
            }
          } else {
            setTimeout(() => {
              callback({
                offline: true
              })
            }, 100);
          }
        }
        if (!window.isMyFile) {
          if (pcUtil.isOnline() && (!window.chartId || window.chartId.length <= 12)) {
            FileDatabase.getChartById(window.chartId, (chart) => {
              if (chart && chart.chartId && chart.chartId.length > 12) {
                window.chartId = chart.chartId
                params.chartId = chart.chartId
                msgFn(chart)
              } else {
                new Toast({ type: "error", msg: "保存失败" });
                // 更新本地文件定义到最新
                FileDatabase.updateChartDef(params.chartId, {
                  definition: JSON.stringify({
                    ...Model.define,
                    comments: Model.comments,
                    version
                  })
                })
              }
            })
          } else {
            if (pcUtil.isOnline()) {
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
            msgFn()
          }
        }
        else {
          let isUpdate = false
          const msgData = JSON.parse(params.msgStr)
          console.log(params)
          // if ((window.filepath == '' && !window.isFirst) || window.filepath !== '') {
          if (window.defVersion.length > 0) {
            const index = window.defVersion.findIndex(d => d.id == params.canvasId)
            if (index > -1) {
              window.defVersion[index].version++
              window.defVersion[index].isSave = false
            } else {
              window.defVersion.push({ id: params.canvasId, version: 1, isSave: false })
            }
          }
          else {
            window.defVersion.push({ id: params.canvasId, version: 1, isSave: false })
          }
          ipc.sendToHost("saveStatus", window.TABGROUPID, "unsave")
          // }
          // else {
          //   window.isFirst = false
          // }
          msgData.map((msg) => {
            // 流程图操作
            if (msg.action == 'command') {
              msg.messages.map((m) => {
                // 新增
                if (m.action == 'create') {
                  m.content.map((d) => {
                    // 插入文本
                    if (Object.hasOwnProperty.call(d, 'name') && d.name == 'standardText') {
                      setTimeout(() => {
                        $('.eq-tip-vip').hide()
                      }, 10)
                    }
                    // 图片
                    if (Object.hasOwnProperty.call(d, 'name') && d.name == 'standardImage') {
                      const url = d.fillStyle.fileId.replace('file:///', '')
                      const index = window.cacheImages.findIndex(i => i.url == url)
                      if (index == -1) {
                        const name = url.substring(url.lastIndexOf('/') + 1)
                        const path = '/' + name.substring(0, name.lastIndexOf('.')) + '?'
                        window.cacheImages.push({ name, path, url })
                        isUpdate = true
                        console.log('add_fileId', d.fillStyle.fileId)
                      }
                    }
                  })
                }
                // 删除
                if (m.action == 'remove') {
                  m.content.map((d) => {
                    // 图片
                    if (Object.hasOwnProperty.call(d, 'name') && d.name == 'standardImage') {
                      const url = d.fillStyle.fileId.replace('file:///', '')
                      const index = window.cacheImages.findIndex(i => i.url == url)
                      if (index > -1) {
                        window.cacheImages.splice(index, 1)
                        isUpdate = true
                        console.log('remove_fileId', d.fillStyle.fileId)
                      }
                    }
                  })
                }
              })
            }
            // 思维导图操作
            if (msg.action == 'update') {
              // 思维导图添加图片或者附件
              if (msg.content.type == 'image' || msg.content.type == 'file') {
                msg.content.original.map((d) => {
                  // 图片
                  if (Object.hasOwnProperty.call(d, 'image')) {
                    const url = d.image.url.replace('file:///', '')
                    const index = window.cacheImages.findIndex(i => i.url == url)
                    if (index > -1) {
                      window.cacheImages.splice(index, 1)
                      isUpdate = true
                      console.log('remove_image', d.image.url)
                    }
                  }
                  // 附件
                  if (Object.hasOwnProperty.call(d, 'file')) {
                    const url = d.file.value.replace('file:///', '')
                    const index = window.cacheFiles.findIndex(i => i.url == url)
                    if (index > -1) {
                      window.cacheFiles.splice(index, 1)
                      isUpdate = true
                      console.log('remove_file', d.file.value)
                    }
                  }
                })
                msg.content.content.map((d) => {
                  // 图片
                  if (Object.hasOwnProperty.call(d, 'image')) {
                    const url = d.image.url.replace('file:///', '')
                    const index = window.cacheImages.findIndex(i => i.url == url)
                    if (index == -1) {
                      const name = url.substring(url.lastIndexOf('/') + 1)
                      const path = '/' + name.substring(0, name.lastIndexOf('.')) + '?'
                      window.cacheImages.push({ name, path, url })
                      isUpdate = true
                      console.log('add_image', d.image.url)
                    }
                  }
                  // 附件
                  if (Object.hasOwnProperty.call(d, 'file')) {
                    const url = d.file.value.replace('file:///', '')
                    const index = window.cacheFiles.findIndex(i => i.url == url)
                    if (index == -1) {
                      const name = url.substring(url.lastIndexOf('/') + 1)
                      const path = '/' + name
                      window.cacheFiles.push({ name, path, url })
                      isUpdate = true
                      console.log('add_file', d.file.value)
                    }
                    isUpdate = true
                  }
                })
              }
              // 思维笔记添加图片或者附件
              if (msg.content.key == 'image' || msg.content.key == 'file') {
                msg.content.oldNodes.map((d) => {
                  // 图片
                  if (Object.hasOwnProperty.call(d, 'image')) {
                    const url = d.image.url.replace('file:///', '')
                    const index = window.cacheImages.findIndex(i => i.url == url)
                    if (index > -1) {
                      window.cacheImages.splice(index, 1)
                      isUpdate = true
                      console.log('remove_image', d.image.url)
                    }
                  }
                  // 附件
                  if (Object.hasOwnProperty.call(d, 'file')) {
                    const url = d.file.value.replace('file:///', '')
                    const index = window.cacheFiles.findIndex(i => i.url == url)
                    if (index > -1) {
                      window.cacheFiles.splice(index, 1)
                      isUpdate = true
                      console.log('remove_file', d.file.value)
                    }
                  }
                })
                msg.content.nodes.map((d) => {
                  // 图片
                  if (Object.hasOwnProperty.call(d, 'image')) {
                    const url = d.image.url.replace('file:///', '')
                    const index = window.cacheImages.findIndex(i => i.url == url)
                    if (index == -1) {
                      const name = url.substring(url.lastIndexOf('/') + 1)
                      const path = '/' + name.substring(0, name.lastIndexOf('.')) + '?'
                      window.cacheImages.push({ name: name.replace('.svg', '.png'), path, url })
                      isUpdate = true
                      console.log('add_image', d.image.url)
                    }
                  }
                  // 附件
                  if (Object.hasOwnProperty.call(d, 'file')) {
                    const url = d.file.value.replace('file:///', '')
                    const index = window.cacheFiles.findIndex(i => i.url == url)
                    if (index == -1) {
                      const name = url.substring(url.lastIndexOf('/') + 1)
                      const path = '/' + name
                      window.cacheFiles.push({ name, path, url })
                      isUpdate = true
                      console.log('add_file', d.file.value)
                    }
                    isUpdate = true
                  }
                })
              }
            }
          })
          if (isUpdate) {
            ipc1.sendSync('saveFileB64',
              { type: 'cache', path: `back/${window.chartId}/attachment.json`, data: importClass.stringToBase64String(JSON.stringify(window.cacheImages)), suffix: '' }
            )
            ipc1.sendSync('saveFileB64',
              { type: 'cache', path: `back/${window.chartId}/files.json`, data: importClass.stringToBase64String(JSON.stringify(window.cacheFiles)), suffix: '' }
            )
          }
          msgFn()
        }
      }
    })
  },
  //全量保存
  saveOnline: async function (params, callback) {
    if (window.isMyFile && window.fileType == 'markdown') {
      // if(window.filepath == ''){
      FileDatabase.updateChartDef(window.chartId, window.chartId, {
        definition: params.def
      }, () => {
        fileCache.add(window.chartId)
      })
      // }
      callback({ version: 2 })
      return
    }
    else if (window.isMyFile) {
      const def = JSON.parse(params.def)
      callback({ version: def.version++ })
      return
    }
    const currentCanvasId = params.canvasId || editorGlobal.poPagination.pageId
    let chartId = window.chartId
    params.chartId = chartId;
    const ajaxData = {
      data: params,
      type: 'POST',
      cache: false
    }
    let url = '/mindmap/canvas/saveonline'
    if (['designer', 'flow'].indexOf(fileType) > -1) {
      url = `/diagraming/canvas/v2/saveonline`
    } else if (fileType === 'markdown') {
      url = `/diagraming/md/msg`
      ajaxData.contentType = "application/json",
        ajaxData.data = JSON.stringify(ajaxData.data)
    }
    ajaxData.url = `/api/personal` + url
    pcUtil.ajax({
      url: ajaxData.url,
      data: ajaxData.data,
      type: 'POST',
      cache: false,
      contentType: ajaxData.contentType,
      success(data) {
        FileDatabase.updateChartDef(window.chartId, currentCanvasId, {
          definition: params.def
        }, () => {
          callback({ result: 'success', data: data })
        })
      },
      error() { callback(data) }
    })
  },
  //获取云版本
  getYunVersion: function (params, callback) {
    if (!window.isMyFile) {
      params.chartId = chartObj.chartId;
      pcUtil.ajax({
        url: `/api/personal/chart/get/canvas/v2/def/version`,
        data: params,
        type: 'GET',
        cache: false,
        success(data) {
          callback(data.data)
        },
        error() { }
      })
    }
    else {
      callback({})
    }
  },
  //获取画布定义信息
  getDefById: async function (params, callback) {
    if (typeof window.outlineObj !== 'undefined') {
      setTimeout(() => {
        handleInject(window.outlineObj)
      }, 500);
    }
    const { definitionId: defId = '' } = params
    if (!window.isMyFile) {
      // 在线-请求当前画布的信息
      if (pcUtil.isOnline()) {
        // 先获取canvasId
        FileDatabase.getCanvasIdByDefId(chartId, defId).then((canvasId) => {
          console.log('getCanvasIdByDefId', canvasId)
          // 根据编辑器返回的defId 拿到本地的chartDef
          FileDatabase.getChartDefById(chartId, defId, async (chartDef) => {
            console.log('getChartDefById', chartDef)
            const def = await getNewSetDef({ chartId, chartDef, defId, canvasId }, false, true)
            console.log('getNewSetDef', def)
            callback({ def })
          })
        })
        // 请求当前这个画布信息 对比版本号 同步msg
      } else {
        // 直接读数据库
        FileDatabase.getChartDefById(chartId ? chartId : '', defId, async (chartDef) => {
          callback({ def: chartDef.definition })
        })
      }
    }
    else {
      // 直接读数据库
      FileDatabase.getChartDefById('', defId, async (chartDef) => {
        callback({ def: chartDef.definition })
      })
    }
  },
  //
  getMindTheme: async function (params, callback) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: "/api/personal/mindmap/gettheme",
        data: params,
        type: 'GET',
        cache: false,
        success(data) {
          callback({ theme: data.data })
        },
        error(data) { callback(data) }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'theme/config.json' }).then((data) => {
        if (data == '') {
          data = '[]'
        }
        data = JSON.parse(data)
        data = data.filter(item => item.themeId === params.id)
        if (data.length > 0) {
          callback({ theme: data[0].theme })
        }
        else {
          if (pcUtil.isOnline()) {
            pcUtil.ajax({
              url: "/api/personal/mindmap/gettheme",
              data: params,
              type: 'GET',
              cache: false,
              success(data) {
                callback({ theme: data.data })
              },
              error() { callback(data) }
            })
          }
          else {
            callback(null)
          }
        }
      })
    }
  },
  //新增多页
  addCanvas: async function (params, callback) {
    // 先判断是否是会员 普通用户只能一个画布 不能新建
    if (typeof window.outlineObj !== 'undefined') {
      setTimeout(() => {
        handleInject(window.outlineObj)
      }, 500);
    }
    UserOperation.getUserPrivilege(
      false,
      (user = {}) => {
        const { member, orgMember } = user
        if (member || orgMember) {
          if (!window.isMyFile) {
            if (pcUtil.isOnline()) {
              // 在线直接新建
              ServerUtil.createCanvas(
                chartId,
                (res) => {
                  // 成功以后需要立马更新中间表
                  FileDatabase.updateChartMultipleDef(chartId, res, () => {
                    // 2-3 获取当前更新画布的信息 新增后一定是初始的且是最后一个 不用对比了

                    const { chartCanvas = [] } = res
                    const defId = chartCanvas[chartCanvas.length - 1].definitionId //获取画布信息是传 defid 原因是历史问题 以后会改 canvasId
                    FileDatabase.getChartDefByCanvasId(chartId, defId, async (res) => {
                      fileCache.add(chartObj.chartId)
                      callback({
                        chartDefIds: chartCanvas,
                        def: res.definition,
                        defId
                      })
                    })
                  })
                },
                (err) => { }
              )
            } else {
              // 不在线直接更新一个"假"数据 增加到中间表 后存入指令集
              // 先获取本地的数据
              FileDatabase.getCanvasList(chartId, (data) => {
                // 假数据
                console.log(data)
                const { chartCanvas = [], chartDefIds = [] } = data
                const id = FileDatabase.newId()
                const canvasItemInfo = {
                  canvasId: id,
                  definitionId: id,
                  title: `离线画布` // todo 名称可能要改
                }
                // 更新到中间表中
                chartCanvas.push(canvasItemInfo)
                chartDefIds.push(canvasItemInfo)
                FileDatabase.updateChartMultipleDef(chartId, data, async () => {
                  // 更新成功后 需要增加一个离线多画布指令 等联网后同步

                  await FileDatabase.addInstruct({
                    action: 'create',
                    context: window.chartObj.title,
                    chartId: chartId,
                    canvasId: canvasItemInfo.canvasId,
                    definitionId: canvasItemInfo.definitionId
                  })
                  // 增加一个 初始化 def 信息
                  const chartDef = FileDatabase.newChartDef(
                    window.fileType,
                    undefined,
                    canvasItemInfo.definitionId
                  )
                  DBUtil.save('charts_def', chartDef, (chartDef) => {
                    //最后返回 callback
                    FileDatabase.getCanvasList(chartId, (data) => {
                      const { chartCanvas = [] } = data
                      fileCache.add(chartObj.chartId)
                      callback({
                        chartDefIds: chartCanvas,
                        def: chartDef.definition,
                        defId: canvasItemInfo.definitionId
                      })
                    })
                  })
                })
              })
            }
          }
          else {
            ipc.sendToHost("saveStatus", window.TABGROUPID, "unsave")
            // 先获取本地的数据
            FileDatabase.getCanvasList(chartId, (data) => {
              // 假数据
              console.log(data)
              const { chartCanvas = [] } = data
              const id = FileDatabase.newId()
              const canvasItemInfo = {
                canvasId: id,
                definitionId: id,
                title: `画布${chartCanvas.length + 1}` // todo 名称可能要改
              }
              window.defVersion.push({ id: canvasItemInfo.canvasId, version: 1, isSave: false })
              // 更新到中间表中
              chartCanvas.push(canvasItemInfo)
              FileDatabase.updateChartMultipleDef(chartId, data, async () => {
                ipc1.sendSync('loadFileB64', { type: 'cache', path: 'editor/config.json' }).then((res) => {
                  if (res != '') res = JSON.parse(res)
                  // 增加一个 初始化 def 信息
                  const chartDef = res['theme'] ?
                    FileDatabase.newChartDef(
                      window.fileType,
                      undefined,
                      canvasItemInfo.definitionId,
                      res['theme']
                    ) :
                    FileDatabase.newChartDef(
                      window.fileType,
                      undefined,
                      canvasItemInfo.definitionId
                    )
                  DBUtil.save('charts_def', chartDef, (chartDef) => {
                    //最后返回 callback
                    FileDatabase.getCanvasList(chartId, (data) => {
                      const { chartCanvas = [] } = data
                      fileCache.add(chartObj.chartId)
                      callback({
                        chartDefIds: chartCanvas,
                        def: chartDef.definition,
                        defId: canvasItemInfo.definitionId
                      })
                    })
                  })
                })
              })
            })
          }
        }
      })
  },
  //复制多页
  copyCanvas: async function (params, callback) {
    const { canvasId = '', title = '', definitionId = '' } = params
    if (window.isMember()) {
      if (!window.isMyFile) {
        if (pcUtil.isOnline()) {
          ServerUtil.copyCanvas(
            { chartId, canvasId },
            (res) => {
              FileDatabase.saveChartDef(res.defId, res.def, () => {
                FileDatabase.updateChartMultipleDef(chartId, res.canvas, () => {
                  const {
                    canvas: { chartCanvas = [] },
                    def = '',
                    defId
                  } = res
                  fileCache.add(chartObj.chartId)
                  callback({
                    chartDefIds: chartCanvas,
                    def,
                    defId
                  })
                })
              })
            },
            (err) => { }
          )
        } else {
          // 不在线直接更新一个"假"数据 增加到中间表 后存入指令集
          // 先获取本地的数据

          FileDatabase.getCanvasList(chartId, (data) => {
            // 假数据
            console.log(data)
            const { chartCanvas = [], chartDefIds = [] } = data
            const canvasItemInfo = {
              canvasId: FileDatabase.newId(),
              definitionId: FileDatabase.newId(),
              title: `复制离线画布` // todo 名称可能要改
            }
            chartCanvas.push(canvasItemInfo)
            chartDefIds.push(canvasItemInfo)
            FileDatabase.updateChartMultipleDef(chartId, data, async () => {
              // 更新成功后 需要增加一个离线多画布指令 等联网后同步
              await FileDatabase.addInstruct({
                action: 'create',
                context: canvasItemInfo.title,
                chartId,
                canvasId: canvasItemInfo.canvasId,
                definitionId: canvasItemInfo.definitionId
              })
              // 增加一个 被复制的文件定义
              FileDatabase.getChartDefByCanvasId(chartId, canvasId, async (sourceChartDef) => {
                const copyCharDef = sourceChartDef
                copyCharDef.id = canvasItemInfo.definitionId
                DBUtil.save('charts_def', copyCharDef, (chartDef) => {
                  //最后返回 callback
                  FileDatabase.getCanvasList(chartId, (data) => {
                    const { chartCanvas = [] } = data
                    fileCache.add(chartObj.chartId)
                    callback({
                      chartDefIds: chartCanvas,
                      def: chartDef.definition,
                      defId: canvasItemInfo.definitionId
                    })
                  })
                })
              })
            })
          })
        }
      }
      else {
        ipc.sendToHost("saveStatus", window.TABGROUPID, "unsave")
        FileDatabase.getCanvasList(chartId, (data) => {
          // 假数据
          console.log(data)
          const { chartCanvas = [] } = data
          let target = chartCanvas.find(d => d.canvasId == canvasId)
          let newTitle;
          let oldTitle = target.title;
          const allTitle = chartCanvas.map(i => i.title)

          function getMaxSuffix(target, titles) {
            const regex = new RegExp(`^${target}副本(\\d+)$`);
            let maxSuffix = 1;

            titles.forEach(title => {
              const match = title.match(regex);
              if (match && match[1]) {
                const suffix = parseInt(match[1], 10);
                if (suffix <= maxSuffix) {
                  maxSuffix = suffix + 1;
                }
              }
            });

            return maxSuffix;
          }
          // 判断 allTitle 中是否有 [oldTitle+'副本'] 如果没有就增加一个
          if (allTitle.includes(`${oldTitle}副本`)) {
            // 如果有 截取length 长度+1的 判断数字最大后 再加1
            const maxSuffix = getMaxSuffix(oldTitle, allTitle);
            newTitle = `${oldTitle}副本${maxSuffix}`
          } else {
            newTitle = `${oldTitle}副本`
          }
          const canvasItemInfo = {
            canvasId: FileDatabase.newId(),
            definitionId: FileDatabase.newId(),
            title: newTitle // todo 名称可能要改
          }

          chartCanvas.push(canvasItemInfo)
          FileDatabase.updateChartMultipleDef(chartId, data, async () => {
            // 增加一个 被复制的文件定义
            FileDatabase.getChartDefByCanvasId(chartId, canvasId, async (sourceChartDef) => {
              const copyCharDef = sourceChartDef
              copyCharDef.id = canvasItemInfo.definitionId
              DBUtil.save('charts_def', copyCharDef, (chartDef) => {
                //最后返回 callback
                FileDatabase.getCanvasList(chartId, (data) => {
                  const { chartCanvas = [] } = data
                  fileCache.add(chartObj.chartId)
                  callback({
                    chartDefIds: chartCanvas,
                    def: chartDef.definition,
                    defId: canvasItemInfo.definitionId
                  })
                })
              })
            })
          })
        })
      }
    }
  },
  //删除多页
  deleteCanvas: async function (params, callback) {
    // 在线删除

    //   canvasId: "64cca4f04366513dd47984c2"
    // definitionId: "64cca4f04366513dd47984c2"
    // sort: 1
    // title: "画布2"
    const { canvasId = '', definitionId = '' } = params
    if (!window.isMyFile) {
      if (pcUtil.isOnline()) {
        ServerUtil.deletedCanvas(chartId, canvasId, (res) => {
          // 删除后更新中间表
          FileDatabase.updateChartMultipleDef(chartId, res, ({ chartCanvas }) => {
            fileCache.add(chartObj.chartId)
            // 2-3 获取当前更新画布的信息 删除后的
            callback({
              chartDefIds: chartCanvas
            })
          })
        })
      } else {
        // 离线需要增加一个删除指令 同时去掉更新中间表
        // 先获取当前的中间表
        FileDatabase.getCanvasList(chartId, (data) => {
          // 过滤掉删除的item
          const { chartCanvas = [], mainCanvasId = '' } = data
          const newCharCanvas = chartCanvas.filter((i) => i.canvasId !== canvasId)
          if (mainCanvasId === definitionId) {
            data.mainCanvasId = newCharCanvas[0].definitionId
          }
          // 更新到中间表中
          data.chartCanvas = newCharCanvas
          data.chartDefIds = newCharCanvas
          FileDatabase.updateChartMultipleDef(chartId, data, async () => {
            // 更新成功后 需要增加一个离线多画布指令 等联网后同步
            await FileDatabase.addInstruct({
              action: 'delete',
              chartId: chartId,
              canvasId
            })
            fileCache.add(chartObj.chartId)
            callback({
              chartDefIds: data.chartCanvas
            })
          })
        })
      }
    }
    else {
      ipc.sendToHost("saveStatus", window.TABGROUPID, "unsave")
      // 先获取当前的中间表
      FileDatabase.getCanvasList(chartId, (data) => {
        // 过滤掉删除的item
        const { chartCanvas = [], mainCanvasId = '' } = data
        const newCharCanvas = chartCanvas.filter((i) => i.canvasId !== canvasId)
        if (mainCanvasId === definitionId) {
          data.mainCanvasId = newCharCanvas[0].definitionId
        }
        const index = window.defVersion.findIndex(d => d.id == canvasId)
        if (index !== -1) {
          window.defVersion.push({ id: canvasId, version: 1, isSave: false })
        }
        // 更新到中间表中
        data.chartCanvas = newCharCanvas
        FileDatabase.updateChartMultipleDef(chartId, data, async () => {
          fileCache.add(chartObj.chartId)
          callback({
            chartDefIds: data.chartCanvas
          })
        })
      })
    }
  },
  //重命名多页
  canvasRename: async function (params, callback) {
    const {
      pageData: { canvasId = '' },
      title = ''
    } = params
    if (!window.isMyFile) {
      if (pcUtil.isOnline()) {
        ServerUtil.updateCanvasTitle({ chartId, title, canvasId }, (res) => {
          const { chartCanvas = [] } = res
          FileDatabase.updateChartMultipleDef(chartId, res, async () => {
            callback({
              chartDefIds: chartCanvas
            })
          })
        }, err => {
          new Toast({ type: 'error', msg: err.msg })
          fileCache.add(chartObj.chartId)
          callback({
            chartDefIds: null
          })
        })
      } else {
        // 不在线 应该更新中间表 然后添加指令集
        FileDatabase.getCanvasList(chartId, (data) => {
          data.chartCanvas.map((item) => {
            if (item.canvasId === canvasId) {
              if (item.title == title) {
                callback({
                  chartDefIds: null
                })
                return
              } else {
                item.title = title
              }

            } else {
              if (item.title == title) {
                callback({
                  chartDefIds: null
                })
                return
              }
            }
          })
          data.chartDefIds = data.chartCanvas
          FileDatabase.updateChartMultipleDef(chartId, data, async ({ chartCanvas }) => {
            // 更新成功后 需要增加一个离线多画布指令 等联网后同步
            await FileDatabase.addInstruct({
              action: 'rename',
              context: title,
              chartId,
              canvasId
            })
            fileCache.add(chartObj.chartId)
            callback({
              chartDefIds: chartCanvas
            })
          })
        })
        //
      }
    }
    else {
      ipc.sendToHost("saveStatus", window.TABGROUPID, "unsave")
      FileDatabase.getCanvasList(chartId, (data) => {
        // 循环画布抛出自身
        const filterTitle = data.chartCanvas.map(d => d.canvasId !== canvasId && d.title)
        // 当前这个title是否出现在其中
        if (filterTitle.includes(title)) {
          // 出现了不能修改 还原以前的 return
          new Toast({ type: 'error', msg: '名称已存在' })
          callback({
            chartDefIds: data.chartCanvas
          })
          return
        } else {
          data.chartCanvas.map(item => {
            if (item.canvasId === canvasId) {
              item.title = title
            }
          })
        }
        FileDatabase.updateChartMultipleDef(chartId, data, async ({ chartCanvas }) => {
          fileCache.add(chartObj.chartId)
          callback({
            chartDefIds: chartCanvas
          })
        })
      })
    }
  },
  //排序多页
  canvasSort: async function (params, callback) {
    const { source, target } = params
    if (!window.isMyFile) {
      if (pcUtil.isOnline()) {
        ServerUtil.updateCanvasSort({ chartId, source, target }, (res) => {
          const { chartCanvas = [] } = res
          FileDatabase.updateChartMultipleDef(chartId, res, async () => {
            callback({
              chartDefIds: chartCanvas
            })
          })
        }, err => {
          new Toast({ type: 'error', msg: err.msg })
          fileCache.add(chartObj.chartId)
          callback({
            chartDefIds: null
          })
        })
      } else {
        window.toast_.offLine()
        callback({
          chartDefIds: null
        })
      }
    }
    else {
      ipc.sendToHost("saveStatus", window.TABGROUPID, "unsave")
      FileDatabase.getCanvasList(chartId, (data) => {
        const chartCanvas = data.chartCanvas
        const canvas = chartCanvas[source]
        chartCanvas.splice(source, 1)
        chartCanvas.splice(target, 0, canvas)
        data.chartCanvas = chartCanvas
        data.chartDefIds = chartCanvas
        FileDatabase.updateChartMultipleDef(chartId, data, () => {
          fileCache.add(chartObj.chartId)
          callback({ chartDefIds: chartCanvas })
        })
      })
    }
  },
  //获取协作成员列表
  getListUsers: async function (params, callback) {
    if (window.isMyFile) {
      return callback()
    }
    pcUtil.ajax({
      url: '/api/personal/collaboration/list_users',
      data: { type: 'chart', id: window.chartId },
      type: "POST",
      success(res) {
        res = res.data
        let collaData = [];
        let data = [res.owner || [], ...res.collaborations || []];
        data.forEach(item => {
          if (!item.userId) {
            item = { ...item, ...item.user }
          }
          item.userName = item.fullName
          collaData.push(item)
        })
        callback && callback(collaData)
      },
      error() {
        callback && callback([])
      }
    })
  },
  // 获取联系人文档列表 用于@功能
  getListData: async function (data, callback) {
    if (pcUtil.isOnline()) {
      let { searchVal, target, type, setData } = data;
      injectCommon.currentTabType = type;
      if (!searchVal) {
        // 0全部 1联系人 2文档
        if (type === 0) {
          injectCommon.dealAllData("", "all", 0, callback)
        } else if (type === 1) {
          console.log('type', type)
          // console.log('setData', type)
          if (!window.isMyFile) {
            injectCommon.dealAllContacts(1, callback)
          }
          else {
            $(target).remove()
          }
        } else if (type === 2) {
          injectCommon.dealSearchFile("", "chart", 2, callback)
        }
      } else {
        if (type === 0) {
          injectCommon.dealSearchAllData(searchVal, "find", 0, callback)
        } else if (type === 1) {
          injectCommon.dealSearchPeople(searchVal, 1, callback)
        } else if (type === 2) {
          injectCommon.dealSearchFile(searchVal, "find", 2, callback)
        }
      }
      //暂时屏蔽从通讯录选择
      // 5.8,2 todo:从我的空间选择屏蔽
      target.find('.address-sel-btn').hide();
      /*target.find('.address-sel-btn').off('click').on('click', function() {
      })*/
      target.find('.space-sel-btn').off('click').on('click', function () {
        personalInsert.chooseMyfile.init();
      })
      // console.log(target,type)
      // if(type == 2){
      //   target.find('.space-sel-btn').hide();
      //   $('#mention_box').css('height','288px')
      // }else{
      //   $('#mention_box').css('height','313px')
      // }
    }
  },
  //历史版本
  addHistory: function (params, cb) {
    if (!window.isMyFile) {
      if (!pcUtil.isOnline()) {
        window.toast_.offLine()
      }
      params.chartId = window.chartId;
      var url = params.isAuto ? `/api/personal/hst/ver/auto/add` : `/api/personal/hst/ver/manual/add`;
      pcUtil.ajax({
        url: url + `?mlfffid=${chartId}&mlffcid=${params.canvasId}`,
        data: JSON.stringify(params),
        contentType: 'application/json',
        type: 'POST',
        cache: false,
        success(data) {
          cb(data)
        },
        error(data) {
          // cb(false)
        }
      })
    }
    else {
      history.addHistory(params).then((res) => {
        cb(res)
      })
    }
  },
  getHistories: function (params, cb) {
    if (!window.isMyFile) {
      params.chartId = window.chartId;
      if (params.pages == 1) {
        window.hisCursor = "";
        window.hisSign = "";
      }
      params.cursor = window.hisCursor;
      params.sign = window.hisSign;
      pcUtil.ajax({
        url: `/api/personal/hst/ver/list`,
        data: JSON.stringify(params),
        contentType: 'application/json',
        type: 'POST',
        cache: false,
        success(data) {
          window.hisCursor = data.data.cursor;
          window.hisSign = data.data.sign;
          cb(data.data)
        }
      })
    }
    else {
      history.getHistorys(params).then((res) => {
        cb(res)
      })
    }
  },
  getHistory: function (params, cb) {
    if (!window.isMyFile) {
      params.chartId = window.chartId;
      pcUtil.ajax({
        url: `/api/personal/version/get/history/definition`,
        data: params,
        contentType: 'application/json',
        type: 'GET',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      history.getHistory(params).then((res) => {
        cb(res)
      })
    }
  },
  removeHistory: function (params, cb) {
    if (!window.isMyFile) {
      params.chartId = window.chartId;
      pcUtil.ajax({
        url: `/api/personal/version/delete/history/canvas`,
        data: params,
        type: 'POST',
        cache: false,
        success(data) {
          cb(data)
        }
      })
    }
    else {
      history.removeHistory(params).then((res) => {
        cb(res)
      })
    }
  },
  revertHistory: function (params, cb) {
    if (!window.isMyFile) {
      params.chartId = window.chartId;
      pcUtil.ajax({
        url: `/api/personal/version/update/history/canvas`,
        data: params,
        type: 'POST',
        cache: false,
        success(data) {
          cb(data)
        },
        error(data) {
          $.toast({ type: 'error', text: i18next.t('js.Failed_to_restore_historical_version') })
        }
      })
    }
    else {
      history.revertHistory(params).then((res) => {
        cb(res)
      })
    }
  },
  //我的图形
  addMyshapes: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/diagraming/shapes/add`,
        data: params,
        type: 'POST',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      const def = JSON.parse(params.content)
      // 修改字段
      def.elements.forEach((d) => {
        d.groupName = ''
      })
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/flow-config.json' }).then((data) => {
        if (data && data != '') {
          data = JSON.parse(data)
          data = data.filter(d => d.id != def.id)
        }
        else data = []
        data.push(def)
        ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/flow-config.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
        cb({})
      })
    }
  },
  getMyshapes: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/diagraming/shapes/page?`,
        data: { page: params.page, size: 10 },
        type: 'GET',
        cache: false,
        success(data) {
          cb(data.data)
        },
        error: function () {
          $.toast({
            type: "error",
            text: i18next.t('js.Graph_addition_failed')
          });
        }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/flow-config.json' }).then((data) => {
        if (data != '') data = JSON.parse(data)
        else data = []
        cb({
          curPage: '1',
          pageCount: 1,
          definition: data,
        })
      })
    }
  },
  myShapeUpdateTitle: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/diagraming/shapes/update/title`,
        data: params,
        type: 'POST',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      const title = params.title
      const shapeId = params.shapeId
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/flow-config.json' }).then((data) => {
        if (data && data != '') {
          data = JSON.parse(data)
          data.forEach((d) => {
            if (d.id == shapeId) {
              d.title = title
            }
          })
        }
        ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/flow-config.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
        cb({})
      })
    }
  },
  myShapeRemoveShape: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/diagraming/shapes/remove`,
        data: params,
        type: 'GET',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      const shapeId = params.shapeId
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/flow-config.json' }).then((data) => {
        if (data && data != '') {
          data = JSON.parse(data)
          data = data.filter((d) => d.id !== shapeId)
        }
        ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/flow-config.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
        cb()
      })
    }
  },
  myShapeUpdateSort: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/diagraming/shapes/update/sort`,
        data: params,
        type: 'POST',
        cache: false,
        success(data) {
          cb(data)
        }
      })
    }
    else {
      const offset = params.offset.split('-')
      const shapeId = params.shapeId
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/flow-config.json' }).then((data) => {
        if (data && data != '') {
          data = JSON.parse(data)
          const shapeData = data.filter((d) => d.id == shapeId)[0]
          data = data.filter((d) => d.id !== shapeId)
          data.splice(parseInt(offset[1]), 0, shapeData)
        }
        ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/flow-config.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
        cb({})
      })
    }
  },
  //水印
  addWaterMark: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/diagraming/add_watermark`,
        data: params,
        isErr: true,
        type: 'POST',
        cache: false,
        success(data) {
          if (data.code == 200) {
            cb()
          } else if (data.code == 832) {
            $.toast({
              type: "error",
              text: "最多可添加10条自定义水印，如需添加新水印请先删除多余水印"
            });
          } else if (data.code == 618) {
            //自己接入会员限制
            // that.events.push('vip-limit', 'insert_watermark');
          }

        }
      })
    }
    else {
      const data = window.localStorage.getItem('watermarks');
      const marks = data && data.length > 0 ? data.split(',') : [];
      const merged = [...new Set(marks.concat([params.watermark]))];
      window.localStorage.setItem('watermarks', merged.toString());
      ipc1.sendSync('saveFileB64', {
        type: 'cache',
        path: 'watermarks/config.json',
        data: importClass.stringToBase64String(merged.toString())
      })
      cb({
        data: {}
      })
    }
  },
  getWaterMark: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/diagraming/watermarks`,
        data: params,
        type: 'GET',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      // 获取水印信息
      ipc1.sendSync('loadFileB64', {
        type: 'cache',
        path: 'watermarks/config.json'
      }).then((data) => {
        // 放置缓存中
        const marks = data && data.length > 0 ? data.split(',') : [];
        window.localStorage.setItem('watermarks', marks.toString());
        cb({
          watermarks: marks
        })
      });

    }
  },
  delWaterMark: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/diagraming/del/watermark`,
        data: params,
        isErr: true,
        type: 'POST',
        cache: false,
        success(data) {
          if (data.code == 200) {
            cb()
          }
        }
      })
    }
    else {
      const data = window.localStorage.getItem('watermarks');
      const marks = data && data.length > 0 ? data.split(',') : [];
      const merged = marks.filter(item => item !== params.watermark);
      window.localStorage.setItem('watermarks', merged.toString());
      ipc1.sendSync('saveFileB64', {
        type: 'cache',
        path: 'watermarks/config.json',
        data: importClass.stringToBase64String(merged.toString())
      })
      cb({
        data: {}
      })
    }
  },
  //图片上传
  uploadImageForm: function (formData, cb) {
    const fileFieldName = 'image';
    const MAX_FILES = 20;
    const allFiles = formData.getAll(fileFieldName);

    function buildSingleFormData(file) {
      const fd = new FormData();
      fd.append(fileFieldName, file);
      for (let [key, value] of formData.entries()) {
        if (key !== fileFieldName) fd.append(key, value);
      }
      return fd;
    }

    function saveOfflineLocal(fd) {
      return new Promise((resolve, reject) => {
        const imgFile = fd.get('image');
        if (!imgFile) { reject(new Error('no image')); return; }
        const type = fd.get('type');
        const isSaveAs = fd.get('isSaveAs');
        const ext = imgFile['name'].substring(imgFile['name'].lastIndexOf('.'));
        if ((type == 'flow') || type == undefined && isSaveAs == 'false') {
          importClass.fileToBase64(imgFile).then((data) => {
            const path = `uploadCopy/${chartObj.chartId}/${FileDatabase.newId()}${ext}`;
            ipc1.sendSync('saveFileB64', { type: 'cache', path, data: data.split(',')[1] }).then((res) => {
              const fileId = "file:///" + res;
              resolve({ url: fileId, "userImage": { "imageId": fileId, "userId": "", "name": null, "type": "mind", "fileId": fileId, "imageW": 100, "imageH": 100 } });
            });
          });
        } else if (type == 'mind' || isSaveAs == 'true') {
          importClass.fileToBase64(imgFile).then((data) => {
            const path = `uploadCopy/${chartObj.chartId}/${FileDatabase.newId()}${ext}`;
            ipc1.sendSync('saveFileB64', { type: 'cache', path, data: data.split(',')[1] }).then((res) => {
              resolve({ "userImage": { "imageId": res, "userId": "", "name": null, "type": "mind", "fileId": res, "imageW": 100, "imageH": 100 }, "url": res });
            });
          });
        } else {
          importClass.fileToBase64(imgFile).then((data) => {
            const path = `uploadCopy/${chartObj.chartId}/${FileDatabase.newId()}${ext}`;
            ipc1.sendSync('saveFileB64', { type: 'cache', path, data: data.split(',')[1] }).then((res) => {
              const fileId = "file:///" + res;
              resolve({ "url": fileId, "userImage": { "imageId": fileId, "userId": "", "name": null, "type": "mind", "fileId": fileId, "imageW": 100, "imageH": 100 } });
            });
          });
        }
      });
    }

    function saveIsMyFileLocal(fd) {
      return new Promise((resolve, reject) => {
        const imgFile = fd.get('image');
        if (!imgFile) { reject(new Error('no image')); return; }
        if (imgFile.size > (1024 * 1024 * 2)) { reject(new Error('too large')); return; }
        const type = fd.get('type');
        const isSaveAs = fd.get('isSaveAs');
        const ext = imgFile['name'].substring(imgFile['name'].lastIndexOf('.'));
        if ((type == 'flow' && isSaveAs == 'false') || type == undefined && isSaveAs == 'false') {
          importClass.fileToBase64(imgFile).then((data) => {
            const path = `flow/image/${FileDatabase.newId()}${ext}`;
            ipc1.sendSync('saveFileB64', { type: 'cache', path, data: data.split(',')[1] }).then((res) => {
              resolve({ url: 'file:///' + res });
            });
          });
        } else if (type == 'mind' || isSaveAs == 'true') {
          importClass.fileToBase64(imgFile).then((data) => {
            const path = `mind/image/${FileDatabase.newId()}${ext}`;
            ipc1.sendSync('saveFileB64', { type: 'cache', path, data: data.split(',')[1] }).then((res) => {
              const imageId = FileDatabase.newId();
              const fileId = "file:///" + res;
              ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/mind-config.json' }).then((shapeData) => {
                if (shapeData && shapeData != '') { shapeData = JSON.parse(shapeData); } else shapeData = [];
                shapeData.push({ imageId, fileId });
                ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/mind-config.json', data: importClass.stringToBase64String(JSON.stringify(shapeData)) });
                resolve({ "userImage": { "imageId": fileId, "userId": "", "name": null, "type": "mind", "fileId": fileId, "imageW": 100, "imageH": 100 }, "url": fileId });
              }).catch(() => {
                const shapeData = [{ imageId, fileId }];
                ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/mind-config.json', data: importClass.stringToBase64String(JSON.stringify(shapeData)) });
                resolve({ "userImage": { "imageId": fileId, "userId": "", "name": null, "type": "mind", "fileId": fileId, "imageW": 100, "imageH": 100 }, "url": fileId });
              });
            });
          });
        } else {
          importClass.fileToBase64(imgFile).then((data) => {
            const path = `outline/image/${FileDatabase.newId()}${ext}`;
            ipc1.sendSync('saveFileB64', { type: 'cache', path, data: data.split(',')[1] }).then((res) => {
              resolve({ "url": "file:///" + res });
            });
          });
        }
      });
    }

    if (!window.isMyFile) {
      if (pcUtil.isOnline()) {
        if (allFiles.length === 1) {
          pcUtil.ajax({
            url: `/api/personal/user/image/upload`,
            contentType: false,
            processData: false,
            data: formData,
            success: function (data) {
              if (data.data == null || data.data.url == null) {
                cb({ result: "error", data: { url: '' } })
              } else {
                cb({ result: "success", data: data.data })
              }
            },
            error: function (data) {
              cb({ result: "error", data: data.data })
              if (data.code == "803") {
                $.toast({ type: "error", text: i18next.t('js.The_file_format_is_not_supported') })
              }
            }
          })
          return;
        }
        if (!window.isMember()) {
          ipc.sendToHost('showDlgPayWebView1', { pay_position: '添加图片', pointspage: '客户端编辑器', pointssource: '上传多张图片', title: "开通会员享全部会员权益" })
          cb({ result: "error", data: 'close' })
          return;
        }
        const files = allFiles.slice(0, MAX_FILES);
        if (allFiles.length > MAX_FILES) {
          $.toast({ type: 'warning', text: `选择了 ${allFiles.length} 个文件，但只会上传前 ${MAX_FILES} 个` });
        }
        const requests = files.map(file => ({ formData: buildSingleFormData(file), type: file.type, name: file.name }));
        var index = 0;
        var urls = [];
        function fnOnline(request) {
          pcUtil.ajax({
            url: `/api/personal/user/image/multiple/upload`,
            contentType: false,
            processData: false,
            data: request.formData,
            success: function (data) {
              if (data.data != null && data.data.url != null) {
                data.data.type = request.type;
                urls.push(data.data);
              }
              index++;
              if (requests[index]) { fnOnline(requests[index]); } else { cb({ result: "success", data: urls }); }
            },
            error: function (data) {
              index++;
              if (requests[index]) { fnOnline(requests[index]); } else { cb({ result: "success", data: urls }); }
              if (data.code == "803") {
                $.toast({ type: "error", text: i18next.t('js.The_file_format_is_not_supported') })
              } else {
                $.toast({ type: "error", text: request.name + '-上传失败' })
              }
            }
          })
        }
        fnOnline(requests[0]);
      }
      else {
        if (allFiles.length === 1) {
          saveOfflineLocal(formData).then(data => cb({ result: "success", data })).catch(() => cb({ result: "error", data: { url: '' } }));
        } else {
          const files = allFiles.slice(0, MAX_FILES);
          const urls = [];
          var offlineIndex = 0;
          function fnOffline() {
            if (offlineIndex >= files.length) { cb({ result: "success", data: urls }); return; }
            saveOfflineLocal(buildSingleFormData(files[offlineIndex])).then(data => {
              urls.push(data);
            }).catch(() => { }).finally(() => { offlineIndex++; fnOffline(); });
          }
          fnOffline();
        }
      }
    }
    else {
      if (allFiles.length === 1) {
        saveIsMyFileLocal(formData).then(data => cb({ result: 'success', data })).catch(() => cb({ result: "error", data: { url: '' } }));
      } else {
        const files = allFiles.slice(0, MAX_FILES);
        const urls = [];
        var myFileIndex = 0;
        function fnMyFile() {
          if (myFileIndex >= files.length) { cb({ result: "success", data: urls }); return; }
          saveIsMyFileLocal(buildSingleFormData(files[myFileIndex])).then(data => {
            urls.push(data);
          }).catch(() => { }).finally(() => { myFileIndex++; fnMyFile(); });
        }
        fnMyFile();
      }
    }
  },
  uploadImage64: async function (params, cb) {
    const arr = params.img.split(',')
    const base64Data = arr[1] || ''
    const padding = (base64Data.match(/=*$/) || [''])[0].length
    const sizeInBytes = Math.floor(base64Data.length * 3 / 4) - padding
    if (sizeInBytes > 10 * 1024 * 1024) {
      new Toast({ type: 'error', msg: '文件大小不能超过10M' })
      return
    }
    if (!(!window.isMyFile && pcUtil.isOnline()) && (arr[0].indexOf('png') > -1 || arr[0].indexOf('jpg') > -1)) {
      const data = base64Data
      const path = `back/${window.chartId}/${importClass.newId()}.png`

      let formula = await ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${window.chartId}/formula.json` })
      if (formula != '') formula = JSON.parse(formula)
      else formula = []

      ipc1.sendSync('saveFileB64', { type: 'cache', path, data: data }).then((res) => {
        formula.push(res)
        ipc1.sendSync('saveFileB64',
          { type: 'cache', path: `back/${window.chartId}/formula.json`, data: importClass.stringToBase64String(JSON.stringify(formula)) })
        cb({
          result: "success", data: {
            url: 'file:///' + res
          }
        })
      })
    }
    else {
      pcUtil.ajax({
        url: `/api/personal/user/image/upload/base64`,
        data: params,
        type: 'POST',
        cache: false,
        success: function (data) {
          cb({ result: "success", data: data.data })
        },
        error: function (data) {
          cb({ result: "error", data: data.data })
        }
      })
    }
  },
  processCorsImage: function (params, cb) {
    params.urls = params.urls[0]
    pcUtil.ajax({
      url: `/api/personal/user/image/cors/image`,
      data: params,
      type: 'POST',
      cache: false,
      success: function (data) {
        cb({ result: "success", data: data.data })
      }
    })
  },
  uploadUserImage: function (params, cb) {
    pcUtil.ajax({
      url: `/api/personal/user/image/generate/thumbnail`,
      data: params,
      type: 'POST',
      cache: false,
      success: function (data) {
        cb({ result: "success", data: data.data })
      },
      error: function (data) {
        cb({ result: "error", data: data.data })
      }
    })
  },
  getSvgText: function (params, cb) {
    // /v5_editor/static/assets/images/designer/network_aliyun/Security/DDOSIP.svg
    console.log('getSvgText', params)
    $.ajax({
      url: params.url,
      type: 'GET',
      dataType: 'text',
      success: function (svgData) {
        cb({ result: "success", data: svgData })
      },
      error: function (error) {
        cb({ result: "error", data: params.url })
        console.error('Error loading SVG:', error);
      }
    });
  },
  //搜索图片(第三方)
  getSearchImages: async function (params, cb) {
    // //随机appkey
    // let appkeys = ['5eed8a83e4b0b8982239fcab', '5f576558e4b0c94f9b1b76a7', '64ed8c59e4b0bf419b63e6e2'];
    // let appkey = appkeys[Math.round((appkeys.length - 1) * Math.random())];
    // let size = 25;
    // if (params.source == "dialog") {//弹出窗是dialog、流程图左侧图形面板是panel
    //   size = 24;
    // }
    // $.getJSON("https://iconsapi.com/api/search?appkey=" + appkey + "&query=" + params.keywords + "&page=" + params.currentPage + "&size=" + size, function (data) {
    //   cb({ result: "success", data })
    // }).error(function () {
    //   cb({ result: "error" })
    // });
    let size = 25;
    if (params.source == "dialog") {//弹出窗是dialog、流程图左侧图形面板是panel
      size = 24;
    }
    async function generateSign(params, appSecret) {
      // 1. 过滤掉值为空的参数 和 sign 自身（如果有）
      const filteredParams = Object.entries(params)
        .filter(([key, value]) => {
          return key !== 'sign' && value !== null && value !== undefined && value !== '';
        })
        .map(([key, value]) => [key, String(value)]); // 统一转字符串

      // 2. 按 key 的 ASCII 码升序排序
      filteredParams.sort((a, b) => a[0].localeCompare(b[0]));

      // 3. 拼接成 key1=value1&key2=value2...
      const paramString = filteredParams
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      // 4. 拼接 appSecret（直接拼接，不作为参数）
      const stringToSign = paramString + appSecret;
      console.log(stringToSign)

      // 将输入字符串编码为 UTF-8 的 Uint8Array
      const encoder = new TextEncoder();
      const data = encoder.encode(stringToSign);

      // 使用 Web Crypto API 计算 SHA-256 哈希
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);

      // 将 ArrayBuffer 转换为 十六进制字符串
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      // 5. 计算 SHA256 哈希，返回十六进制字符串
      console.log(hashHex)
      return hashHex;
    }
    const appKey = "po_app_key";
    const curPage = params.currentPage;
    const iconName = decodeURIComponent(params.keywords);
    const iconType = "search";
    const pageSize = size;
    const timestamp = new Date().getTime();
    var sign = await generateSign({ appKey, curPage, iconName, iconType, pageSize, timestamp }, "&appSecret=prod_app_secret_996985")
    var url = "https://icon.processon.com";
    // if (location.origin.indexOf('192.168') > -1 || location.origin.indexOf('127.0.0') > -1 || location.origin.indexOf('localhost') > -1) {
    //   url = "https://wpstest.processon.com"
    // }
    pcUtil.ajax({
      url: url + "/icon/search?curPage=" + curPage + "&pageSize=" + pageSize + "&iconName=" + iconName + "&iconType=search",
      data: {},
      type: "GET",
      headers: { "sign": sign, appKey, timestamp },
      cache: true,
      success: function (res) {
        cb({ result: "success", data: res.data })
      },
      error: function () {
        cb({ result: "error", })
      }
    })
  },
  getSearchGroup: async function (params = {}, cb) {
    async function generateSign(params, appSecret) {
      // 1. 过滤掉值为空的参数 和 sign 自身（如果有）
      const filteredParams = Object.entries(params)
        .filter(([key, value]) => {
          return (
            key !== 'sign' &&
            value !== null &&
            value !== undefined &&
            value !== ''
          );
        })
        .map(([key, value]) => [key, String(value)]); // 统一转字符串

      // 2. 按 key 的 ASCII 码升序排序
      filteredParams.sort((a, b) => a[0].localeCompare(b[0]));

      // 3. 拼接成 key1=value1&key2=value2...
      const paramString = filteredParams
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      // 4. 拼接 appSecret（直接拼接，不作为参数）
      const stringToSign = paramString + appSecret;

      // 将输入字符串编码为 UTF-8 的 Uint8Array
      const encoder = new TextEncoder();
      const data = encoder.encode(stringToSign);

      // 使用 Web Crypto API 计算 SHA-256 哈希
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);

      // 将 ArrayBuffer 转换为 十六进制字符串
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      // 5. 计算 SHA256 哈希，返回十六进制字符串
      return hashHex;
    }
    const appKey = 'po_app_key';
    const iconName = params ? decodeURIComponent(params.iconName) : '';
    const iconType = params ? decodeURIComponent(params.iconType) : '';
    const timestamp = new Date().getTime();
    var sign = await generateSign(
      { appKey, iconName, iconType, timestamp },
      '&appSecret=prod_app_secret_996985'
    );
    var url = "https://icon.processon.com";
    if (
      location.origin.indexOf('192.168') > -1 ||
      location.origin.indexOf('127.0.0') > -1 ||
      location.origin.indexOf('localhost') > -1
    ) {
      url = '//wpstest.processon.com';
    }
    pcUtil.ajax({
      url:
        url +
        `/icon/search/group?iconName=${iconName}&iconType=${iconType}`,
      data: {},
      type: 'GET',
      cache: true,
      headers: { sign: sign, appKey, timestamp },
      success: function (res) {
        cb({ result: 'success', data: res.data });
      },
      error: function () {
        cb({ result: 'error' });
      },
    });

  },
  //上传附件
  uploadAtta: function (formData, cb) {
    if (!window.isMyFile && pcUtil.isOnline()) {
      pcUtil.ajax({
        url: `/api/personal/diagraming/upload/atta`,
        contentType: false,
        processData: false,
        data: formData,
        success: function (data) {
          cb({ result: "success", data: data.data })
        },
        error: function () {
          cb({ result: "success", data: {} });
        }
      })
    }
    else {
      importClass.fileToBase64(formData.get('file')).then((data) => {
        const filename = formData.get('file')['name']
        const path = `files/${FileDatabase.newId()}/${filename}`;
        // 图片保存到本地
        ipc1.sendSync('saveFileB64', { type: 'cache', path, data: data.split(',')[1] }).then((res) => {
          // 返回结果
          cb({
            result: "success",
            data: {
              "file_name": filename,
              "file_url": 'file:///' + res
            }
          })
        })
      })
    }
  },
  //获取七牛token
  getQiniuToken: function (params, cb) {
    pcUtil.ajax({
      url: `/api/personal/user/image/get/token`,
      data: params,
      type: 'GET',
      cache: false,
      success(data) {
        cb(data.data)
      }
    })
  },
  //用户图片管理
  getUserImages: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/user/image/list`,
        data: params,
        type: 'POST',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/mind-config.json' }).then((data) => {
        if (data != '') data = JSON.parse(data)
        else data = []
        // window.localStorage.setItem('shapes-mind', JSON.stringify(data))
        cb(data)
      })
    }
  },
  removeUserImages: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/user/image/remove`,
        data: params,
        type: 'GET',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      const imageId = params.imageId
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/mind-config.json' }).then((data) => {
        if (data != '') data = JSON.parse(data)
        else data = []
        data = data.filter((d) => d.imageId !== imageId)
        ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/mind-config.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
        cb({})
      })
      // let data = window.localStorage.getItem('shapes-mind')
      // if (data && data != '') {
      //   data = JSON.parse(data)
      //   data = data.filter((d) => d.imageId !== imageId)
      // }
      // window.localStorage.setItem('shapes-mind',JSON.stringify(data))
      // ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/mind-config.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
      // cb({})
    }
  },
  //流程图配置设置
  setFlowConfig: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/diagraming/config`,
        data: params,
        type: 'POST',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'editor/config.json' }).then((data) => {
        if (data != '') data = JSON.parse(data)
        else data = {}
        data[params.field] = params.value
        ipc1.sendSync('saveFileB64', { type: 'cache', path: 'editor/config.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
        cb('')
      })
    }
  },
  setFlowBasicConfig: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/user/save/flow/config`,
        data: params,
        type: 'POST',
        success(data) {
          cb(data.data)
        }
      })
    }
  },
  //思维导图自定义主题
  getMindCustomTheme: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/mindmap/getthemes`,
        data: params,
        type: 'GET',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'theme/config.json' }).then((data) => {
        if (data != '') data = JSON.parse(data)
        else data = []
        cb(data.length == 0 ? null : data)
      })
    }
  },
  saveMindCustomTheme: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/mindmap/savetheme`,
        data: params,
        type: 'POST',
        cache: false,
        success(data) {
          cb(data)
        },
        error() {
          $.toast({ type: 'error', text: i18next.t('js.Save_failed') })
        }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'theme/config.json' }).then(data => {
        if (data != '') data = JSON.parse(data)
        else data = []
        const result = {
          id: importClass.newId(9),
          themeId: params.id,
          theme: params.theme,
          themeName: null,
          userId: '',
          createTime: pcUtil.getCurrentTimeString(),
          updateTime: pcUtil.getCurrentTimeString()
        }
        data.push(result)
        ipc1.sendSync('saveFileB64', { type: 'cache', path: 'theme/config.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
        cb(result)
      })
    }
  },
  deleteMindTheme: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/mindmap/deletetheme`,
        data: params,
        type: 'GET',
        cache: false,
        success(data) {
          cb(data)
        },
        error() {
          $.toast({
            type: 'error',
            text: i18next.t('js.Delete_failed')
          });
        }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'theme/config.json' }).then(data => {
        if (data != '') {
          data = JSON.parse(data)
          data = data.filter(item => item.themeId !== params.id)
        }
        else data = []
        ipc1.sendSync('saveFileB64', { type: 'cache', path: 'theme/config.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
        cb({})
      })
    }
  },
  mindThemeImage: function (params, cb) {
    pcUtil.ajax({
      url: `/api/personal/mindmap/theme/image`,
      data: { def: params.def, chartId: window.chartId },
      type: 'POST',
      cache: false,
      success(data) {
        cb(data.data)
      }
    })
  },
  getMindCustomThemesUrl: function (params, cb) {
    //设置自定义主题预览的地址
    cb()
  },
  //演示
  getSliders: function (params, cb) {
    if (!window.isMyFile) {
      params.chartId = window.chartId;
      pcUtil.ajax({
        url: `/api/personal/mindmap/canvas/getsliders`,
        data: params,
        type: 'GET',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', {
        type: 'cache', path: `back/${window.chartId}/demo.json`,
      }).then((res) => {
        cb({
          def: res != '' ? res : '[]',
          mindConfig: null,
          version: null,
        })
      })
    }
  },
  saveSliders: function (params, cb) {
    if (!window.isMyFile) {
      params.chartId = window.chartId;
      pcUtil.ajax({
        url: `/api/personal/mindmap/canvas/savesliders`,
        data: JSON.stringify(params),
        contentType: 'application/json',
        type: 'POST',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      ipc1.sendSync('saveFileB64', {
        type: 'cache', path: `back/${window.chartId}/demo.json`,
        data: importClass.stringToBase64String(params.def)
      })
      cb(null)
    }
  },
  //思维导图配置设置
  setMindConfig: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/mindmap/config`,
        data: params,
        type: 'POST',
        cache: false,
        success(data) {
          cb(data)
        }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'editor/config.json' }).then((data) => {
        if (data != '') data = JSON.parse(data)
        else data = {}
        data[params.field] = params.value
        ipc1.sendSync('saveFileB64', { type: 'cache', path: 'editor/config.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
        cb('')
      })
    }
  },
  //思维导图我的标签
  saveMindMyTags: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/mindmap/add/tag`,
        data: params,
        type: 'POST',
        cache: false,
        success(data) {
          cb(data.data)
        },
        error() {
          cb('error')
        }
      })
    }
    else {
      window.localStorage.setItem('mindConfig', params.mindConfig)
      cb({ def: null, version: null, mindConfig: params.mindConfig })
    }
  },
  //思维笔记配置设置
  setOutlineConfig: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: `/api/personal/outline/config`,
        data: params,
        type: 'POST',
        cache: false,
        success(data) {
          cb(data)
        }
      })
    }
    else {
      window.localStorage.setItem('outlineConfig', params.outlineConfig)
      cb('')
    }
  },
  //思维导图修复后的文件定义需要各端保存
  updateMindDef: function (params, cb) {
    if (!window.isMyFile) {
      params.chartId = window.chartId;
      pcUtil.ajax({
        url: `/api/personal/mindmap/canvas/updatedef`,
        data: JSON.stringify(params),
        type: 'POST',
        contentType: 'application/json',
        cache: false,
        success(data) {
          cb(data)
        }
      })
    }
    else if (window.isMyFile && window.filepath != '') {
      if (window.filepath.endsWith('.pos') || window.filepath.endsWith('.posf') || window.filepath.endsWith('.posm') || window.filepath.endsWith('.poso')) {
        ipc1.sendSync('loadFileB64', { type: 'local', path: window.filepath }).then((data) => {
          console.log(params)
          JSZip.loadAsync(data, { base64: true }).then((res) => {
            res.files[`${params.canvasId}.pos`].async('string').then((content) => {
              const newData = JSON.parse(content)
              newData.diagram.elements = JSON.parse(params.def)

              Promise.all([
                ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${newData.meta.id}/attachment.json` }),
                ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${newData.meta.id}/files.json` })])
                .then((res1) => {
                  const imagesUrls = res1[0] == '' ? [] : JSON.parse(res1[0])
                  const filesUrls = res1[1] == '' ? [] : JSON.parse(res1[1])
                  let imagesPath = [];
                  let filesPath = [];
                  if (window.fileType == 'flow') {
                    const d = exportFile1.flowImageJson(c.data.diagram.elements, imagesPath, imagesUrls)
                    newData.diagram.elements = d.data;
                  }
                  else {
                    const d = exportFile1.mindImagesFilesJson(newData.diagram.elements, imagesPath, filesPath, imagesUrls, filesUrls)
                    newData.diagram.elements = d.data;
                  }
                  res.file(`${params.canvasId}.pos`, JSON.stringify(newData))
                  res.generateAsync({ type: 'base64' }).then((newcontent) => {
                    ipc1.sendSync('saveFileB64', { type: 'local', path: window.filepath, data: newcontent }).then(() => {
                      cb()
                    })
                  })
                })
            })
          })
        })
      }
      else {
        cb()
      }
    }
    else {
      cb()
    }
  },
  //获取AI用户数据
  getAIUseInfo: function (params, cb) {
    pcUtil.ajax({
      url: '/api/personal/aigc/get/use/power',
      type: "GET",
      success: function (res) {
        if (res.code == 200) {
          cb({ result: "success", data: res.data })
        } else {
          if (res.code == 61680 || res.code == 61681) {
            cb({ result: "error", data: res.data })
            $.toast({
              type: 'error',
              text: '今日免费使用次数已达上限',
            })
            var pointPosition = ""
            var pointPtype = "流程图"
            var timesStr = ""
            if (location.pathname.indexOf("mindmap") > -1) {
              pointPtype = "思维导图"
            }
            timesStr = "AI生成次数不足web"
            pointPosition = pointPtype + timesStr
            ipc.sendToHost('showDlgPayWebView', { pay_position: pointPtype + "编辑页", pointssource: "AI生成次数不足pc", title: '升级会员解锁全部下载格式', aiPay: true })
          } else {
            cb({ result: "error", data: res.data })
          }
        }
      },
      error: function (data) {
        cb({ result: "error", data: data.data })
      }
    })
  },
  //ocr
  onOcr: function (params, cb) {
    var that = this;
    var { timestamp, fileType, imgBase64 } = params;
    pcUtil.ajax({
      url: '/api/personal/sign/ocr',
      type: "GET",
      data: { timestamp },
      success: function (res) {
        params.userId = localStorage.getItem('processon_userKey');
        pcUtil.ajax({
          type: "POST",
          contentType: 'application/json',
          headers: { Authorization: res.data },
          url: '/ocr/extract/image/content',
          isOcr: true,
          processData: false,
          data: JSON.stringify(params),
          success: function (data) {
            cb({ result: "success", data: data.data })
          },
          error: function (data) {
            cb({ result: "error", data: data.data })
          }
        })
      },
      error: function (data) {
        cb({ result: "error", data: data.data })
      }
    })
  },
  // ai文档上传
  uploadDocumentFile: function (params, cb) {
    pcUtil.ajax({
      url: '/api/personal/import/document/file',
      contentType: false,
      processData: false,
      data: params,
      success: function (data) {
        cb({ result: "success", data: data.data })
      },
      error: function () {
        cb({ result: "success", data: "" });
      }
    })
  },
  // ai音频、图片上传
  uploadMediaFile: function (params, cb) {
    pcUtil.ajax({
      url: '/api/personal/import/media/file',
      contentType: false,
      processData: false,
      data: params,
      success: function (data) {
        cb({ result: "success", data: data.data })
      },
      error: function () {
        cb({ result: "success", data: "" });
      }
    })
  },
  // 我的文件列表
  getUserFiles: function (params, cb) {
    pcUtil.ajax({
      url: '/api/personal/folder/user/files',
      data: params,
      type: 'get',
      success: function (data) {
        cb({ result: "success", data: data.data })
      },
      error: function () {
        cb({ result: "success", data: "" });
      }
    })
  },
  // 获取文件定义（画布1）
  getChartDef: function (params, cb) {
    pcUtil.ajax({
      url: '/api/personal/canvas/get/chartdefids',
      data: { chartId: params.chartId },
      type: 'get',
      success: function (data) {
        if (data.data.canvas && data.canvas.chartCanvas && data.data.canvas.chartCanvas[0].definitionId) {
          const defId = data.data.canvas.chartCanvas[0].definitionId;
          pcUtil.ajax({
            url: '/api/personal/diagraming/get/chart/def',
            data: { chartId: params.chartId, defId },
            type: 'get',
            success: function (data) {
              if (data.data.def) {
                cb(data.data.def);
                return;
              }
              cb({ result: "success", data: "" })
            },
            error: function () {
              cb({ result: "success", data: "" });
            }
          })
          return;
        }
        cb({ result: "success", data: "" })
      },
      error: function () {
        cb({ result: "success", data: "" });
      }
    })
  },
  //我的组件
  //新增分类
  addComponentCategory: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: othterUrl + `/api/personal/graph/manager/add/graph/class`,
        data: JSON.stringify(params),
        contentType: 'application/json',
        type: 'POST',
        cache: false,
        isErr: true,
        success(data) {
          if (data.code == "200") {
            cb(data.data)
          } else if (data.code == "61691") {
            ipc.sendToHost('showDlgPayWebView1', { pay_position: '组件库', pointspage: '客户端编辑器', pointssource: '组件库', title: "开通会员享全部会员权益" })
          } else if (data.code == "61692") {
            $.toast({
              text: "已超出组件分类10个的上限",
              type: 'error'
            });
          } else {
            $.toast({
              text: data.msg,
              type: 'error'
            });
          }
        }
      })
    }
    else {
      UserOperation.getUserPrivilege(
        false,
        (user = {}) => {
          const { member } = user
          ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/class.json' }).then((data) => {
            if (data && data != '') {
              data = JSON.parse(data)
            }
            else data = []
            if (member && data.length >= 10) {
              $.toast({
                text: "已超出组件分类10个的上限",
                type: 'error'
              });
            }
            else if (!member && data.length >= 1) {
              $.toast({
                text: "已超出组件分类1个的上限",
                type: 'error'
              });
              ipc.sendToHost('showDlgPayWebView1', { pay_position: '组件库', pointspage: '客户端编辑器', pointssource: '组件库', title: "开通会员享全部会员权益" })
            }
            else {
              const insert = {
                componentItemId: importClass.newId(),
                title: params.title
              }
              data.push(insert)
              ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/class.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
              cb(insert)
            }
          })
        })
    }
  },
  //获取分类
  getComponentCategories: function (params, cb) {
    if (!window.isMyFile) {
      pcUtil.ajax({
        url: othterUrl + `/api/personal/graph/manager/get/graph/clas`,
        type: 'GET',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/class.json' }).then((data) => {
        if (data && data != '') {
          data = JSON.parse(data)
        }
        else data = []
        if (data.length > 0) {
          data = data.reverse()
        }
        cb(data)
      })
    }
  },
  //修改分类名称
  renameComponentCategory: function (params, cb) {
    if (!window.isMyFile) {
      var paramsData = {
        title: params.title,
        graphClasId: params.componentItemId
      }
      pcUtil.ajax({
        url: othterUrl + `/api/personal/graph/manager/rename/graph/clas`,
        data: JSON.stringify(paramsData),
        contentType: 'application/json',
        type: 'POST',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/class.json' }).then((data) => {
        if (data && data != '') {
          data = JSON.parse(data)
        }
        else data = []
        if (data.length == 0) {
          cb(null)
        }
        else {
          const index = data.findIndex(d => d.componentItemId == params.componentItemId)
          data[index].title = params.title
          ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/class.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
          cb(null)
        }
      })
    }
  },
  //排序分类
  sortComponentCategory: function (params, cb) {
    params.moveId = params.componentItemId;
    if (!window.isMyFile) {
      if (params.afterId == "bottom") {
        delete params.afterId
      }
      if (params.beforeId == "top") {
        delete params.beforeId
      }
      pcUtil.ajax({
        url: othterUrl + `/api/personal/graph/manager/sort/graph/clas`,
        data: JSON.stringify(params),
        contentType: 'application/json',
        type: 'POST',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/class.json' }).then((data) => {
        if (data && data != '') {
          data = JSON.parse(data)
        }
        else data = []
        if (data.length == 0) {
          cb(null)
        }
        else {
          const itemData = data.find(d => d.componentItemId == params.componentItemId)
          data = data.filter(d => d.componentItemId != params.componentItemId)
          const id = params.afterId == "bottom" ? params.beforeId : params.afterId
          const index = data.findIndex(d => d.componentItemId == id)
          if (index !== -1 && itemData) {
            if (params.afterId != "bottom") {
              data.splice(index + 1, 0, itemData);
            }
            else {
              data.splice(0, 0, itemData);
            }
          }
          ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/class.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
          cb(null)
        }
      })
    }
  },
  //删除分类
  removeComponentCategory: function (params, cb) {
    if (!window.isMyFile) {
      params.graphClasId = params.componentItemId;
      pcUtil.ajax({
        url: othterUrl + `/api/personal/graph/manager/del/graph/clas`,
        data: JSON.stringify(params),
        contentType: 'application/json',
        type: 'POST',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/class.json' }).then((data) => {
        if (data && data != '') {
          data = JSON.parse(data)
        }
        else data = []
        if (data.length == 0) {
          cb(null)
        }
        else {
          data = data.filter(d => d.componentItemId != params.componentItemId)
          ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/class.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
          cb(null)
        }
      })
    }
  },
  //导入
  importComponent: function (params, cb) {
    var input = $(`<input type="file"  accept=".posc,${(!window.isMyFile ? ' .vssx,' : '')} .png, .jpg, .svg" name="file" id="po-import-component-input" />`);
    input.trigger('click');
    input.off('change').on('change', function (e) {
      var form = $('<form enctype="multipart/form-data"><input type="hidden"  name="componentItemId" value=' + params.componentItemId + '></form>').append(input)
      let file = e.target.files[0];
      var isDlg = $("#po-flow-shapes-dialog").is(":visible");
      $.loading({ text: "导入中", target: isDlg ? null : $('#designer_viewport') })
      if (!window.isMyFile) {
        if (file.name.includes('posc')) {
          var form = new FormData();
          form.append("graphFile", file);
          form.append("graphClasId", params.componentItemId);
          pcUtil.ajax({
            url: othterUrl + '/api/personal/graph/manager/import/graph/class',
            type: "POST",
            data: form,
            cache: false,
            contentType: false,
            processData: false,
            isErr: true,
            success: function (data) {
              if (data.code == "200") {
                cb(data);
              } else if (data.code == "61691") {
                cb(data);
                ipc.sendToHost('showDlgPayWebView1', { pay_position: '组件库', pointspage: '客户端编辑器', pointssource: '组件库', title: "开通会员享全部会员权益" })
              } else if (data.code == "61692") {
                $.toast({
                  text: "已超出组件数量100个的上限",
                  type: 'error'
                });
              }
              $.loading('close');
            }
          })
          return
        }
        if (file.name.includes('vssx')) {
          VisioPo.exportPo({
            file: file, // File对象 或者 Arraybuffer
            mfUrl: othterUrl + '/api/org/visio/wmf2png_base64'
          }).then(async res => {
            var components = [];
            for (var i = 0; i < res.length; i++) {
              var item = res[i];
              var shapes = [];
              for (var k in item.elements) {
                var el = item.elements[k];
                shapes.push(el);
              }
              shapes.sort(function (a, b) {
                return a.props.zindex - b.props.zindex
              })
              components.push({
                title: item.title,
                definition: JSON.stringify(shapes),
                thumbFileStr: await shapesToSvg(shapes),
              })
            }
            pcUtil.ajax({
              url: othterUrl + '/api/personal/graph/manager/add/graph/visio',
              type: "POST",
              data: JSON.stringify({ "graphClasId": params.componentItemId, visioContent: components }),
              contentType: 'application/json',
              isErr: true,
              success: function (data) {
                if (data.code == "200") {
                  cb(data)
                } else if (data.code == "61691") {
                  ipc.sendToHost('showDlgPayWebView1', { pay_position: '组件库', pointspage: '客户端编辑器', pointssource: '组件库', title: "开通会员享全部会员权益" })
                } else if (data.code == "61692") {
                  $.toast({
                    text: "已超出组件数量100个的上限",
                    type: 'error'
                  });
                }
                $.loading('close');
              }
            })
          })
          return
        }
      }
      else {
        if (file.name.includes('posc')) {
          UserOperation.getUserPrivilege(
            false,
            (user = {}) => {
              const { member } = user
              ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/component.json' }).then(async (data) => {
                if (data && data != '') {
                  data = JSON.parse(data)
                }
                else data = []
                if (data.length > 0) {
                  const itemData = data.filter(d => d.componentItemId == params.componentItemId)
                  if (member && itemData.length >= 100) {
                    $.loading('close');
                    $.toast({
                      text: "已超出组件数量100个的上限",
                      type: 'error'
                    });
                    return
                  }
                  else if (!member && itemData.length >= 10) {
                    $.loading('close');
                    ipc.sendToHost('showDlgPayWebView1', { pay_position: '组件库', pointspage: '客户端编辑器', pointssource: '组件库', title: "开通会员享全部会员权益" })
                    return
                  }
                }
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                  JSZip.loadAsync(reader.result.split(',')[1], { base64: true }).then((res) => {
                    const dataLength = Object.keys(res.files).length / 2
                    let index = 0
                    let index1 = 0
                    const interval = setInterval(() => {
                      if (index1 == index) {
                        clearInterval(interval)
                        $.loading('close');
                        ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/component.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
                        cb('0x' + Date.now())
                        return;
                      }
                    }, 1000);
                    const itemData = data.filter(d => d.componentItemId == params.componentItemId)
                    for (let filename in res.files) {
                      if (filename.endsWith('component_meta.json')) {
                        index1++
                        if (member && (itemData.length + index1) > 100) {
                          setTimeout(() => {
                            $.loading('close');
                            $.toast({
                              text: "已超出组件数量100个的上限",
                              type: 'error'
                            });
                            index = index1
                          }, 1000);
                          break;
                        }
                        else if (!member && (itemData.length + index1) > 10) {
                          setTimeout(() => {
                            $.loading('close');
                            ipc.sendToHost('showDlgPayWebView1', { pay_position: '组件库', pointspage: '客户端编辑器', pointssource: '组件库', title: "开通会员享全部会员权益" })
                            index = index1
                          }, 1000);
                          break;
                        }
                        const componentId = filename.substring(0, filename.indexOf('/'))
                        const thumbName = `${componentId}/thumb.png`
                        const attachName = `${componentId}/attachment_map.json`
                        const result = {
                          componentItemId: params.componentItemId,
                          componentId: componentId,
                          definition: '',
                          thumb: '',
                          title: ''
                        }

                        res.files[filename].async('string').then((contentc) => {
                          console.log(filename)
                          const fileData = JSON.parse(contentc)
                          result.title = fileData.title
                          // 存在图片
                          if (res.files[attachName]) {
                            const id = importClass.newId()
                            res.files[attachName].async('string').then((attachmentContent) => {
                              const attachmentJson = JSON.parse(attachmentContent)
                              const attachPath = `shapes/Detail/${id}/attachment_map.json`
                              const attachmentData = []
                              for (let k in attachmentJson) {
                                attachmentData.push({
                                  key: k, value: attachmentJson[k]
                                })
                              }
                              Promise.all(attachmentData.map((d) => {
                                return new Promise((reslove) => {
                                  const attachCName = `${componentId}/attachment/${d.value}`
                                  const newId = `${importClass.newId()}${d.value.substring(d.value.lastIndexOf('.'))}`
                                  const attachCPath = `shapes/Detail/${id}/attachment/${newId}`
                                  res.files[attachCName].async('base64').then(async (attachContent) => {
                                    ipc1.sendSync('saveFileB64', { type: 'cache', path: attachCPath, data: attachContent })
                                      .then((attachmenRes) => {
                                        reslove({ oldPath: d.key, newPath: attachmenRes, newId })
                                      })
                                  })
                                })
                              })).then((attachmentAll) => {
                                const newAttachmentContent = {}
                                attachmentAll.forEach((d) => {
                                  fileData.definition = fileData.definition.replaceAll(d.oldPath, 'file://' + d.newPath)
                                  newAttachmentContent[d.newPath] = d.newId
                                })
                                ipc1.sendSync('saveFileB64', { type: 'cache', path: attachPath, data: importClass.stringToBase64String(JSON.stringify(newAttachmentContent)) })
                                  .then(() => {
                                  })
                                result.definition = fileData.definition
                                res.files[thumbName].async('base64').then(async (contentt) => {
                                  result.thumb = contentt;
                                  result.def = result.definition;
                                  let defPath = `shapes/Detail/${id}/component_meta.json`
                                  let thumbPath = `shapes/Detail/${id}/thumb.png`
                                  ipc1.sendSync('saveFileB64', { type: 'cache', path: defPath, data: importClass.stringToBase64String(result.def) })
                                    .then((defres) => {
                                      if (defres != '') {
                                        defPath = defres
                                        ipc1.sendSync('saveFileB64', { type: 'cache', path: thumbPath, data: result.thumb })
                                          .then((thumbres) => {
                                            if (thumbres != '') {
                                              thumbPath = thumbres
                                              const result1 = {
                                                componentId: id,
                                                componentItemId: result.componentItemId,
                                                defUrl: defPath,
                                                index: Date.now(),
                                                thumbUrl: thumbPath,
                                                title: result.title,
                                                isImages: true
                                              }
                                              data.push(result1)
                                              index++
                                            }
                                          })
                                      }
                                    })
                                })
                              })
                            })

                          }
                          else {
                            result.definition = fileData.definition
                            res.files[thumbName].async('base64').then(async (contentt) => {
                              result.thumb = contentt;
                              result.def = result.definition;
                              const id = importClass.newId()
                              let defPath = `shapes/Detail/${id}/component_meta.json`
                              let thumbPath = `shapes/Detail/${id}/thumb.png`
                              ipc1.sendSync('saveFileB64', { type: 'cache', path: defPath, data: importClass.stringToBase64String(result.def) })
                                .then((defres) => {
                                  if (defres != '') {
                                    defPath = defres
                                    ipc1.sendSync('saveFileB64', { type: 'cache', path: thumbPath, data: result.thumb })
                                      .then((thumbres) => {
                                        if (thumbres != '') {
                                          thumbPath = thumbres
                                          const result1 = {
                                            componentId: id,
                                            componentItemId: result.componentItemId,
                                            defUrl: defPath,
                                            index: Date.now(),
                                            thumbUrl: thumbPath,
                                            title: result.title,
                                            isImages: false
                                          }
                                          data.push(result1)
                                          index++
                                        }
                                      })
                                  }
                                })
                              // window.serveApiObj.addComponent(result, (resultData) => {
                              //   index++;
                              //   console.log(index)
                              //   //   $.loading('close');
                              //   //   cb('0x' + Date.now())
                              // })
                            })
                          }
                        })
                      }
                    }
                  })
                }
                reader.onerror = error => {
                  $.loading('close');
                  $.toast({
                    text: "文件不存在",
                    type: "error"
                  })
                };
              })
            })

          return
        }
        if (file.name.includes('vssx')) {
          $.loading('close');
          $.toast({
            text: "vssx文件只能联网导入",
            type: "error"
          })
          return
        }
      }
      if (file.name.includes('.png') || file.name.includes('.jpg') || file.name.includes('.svg')) {
        var title = file.name.split('.')[0];
        if (/[\\/"':*?<>|&]/.test(title)) {
          $.toast({
            text: i18next.t('js.File_names_cannot_have'),
            type: "warning"
          });
          $.loading('close');
          return false;
        }
        var form = new FormData();
        form.append("image", file);
        form.append("isSaveAs", false);
        form.append("type", 'flow');
        window.serveApiObj.uploadImageForm(form, function (res) {
          if (res.result == "success" && res.data) {
            var url = res.data.url;
            var shape = {
              "id": "id",
              "name": "standardImage",
              "title": "",
              "category": "standard",
              "group": "",
              "locked": false,
              "link": "",
              "children": [],
              "parent": "",
              "resizeDir": ["tl", "tr", "br", "bl", "l", "t", "r", "b"],
              "attribute": { "container": false, "visible": false, "rotatable": true, "linkable": true, "collapsable": false, "collapsed": false, "fixedLink": false, "markerOffset": 5 },
              "dataAttributes": [],
              "props": { "x": 0, "y": 0, "w": 100, "h": 70, "zindex": 0, "angle": 0 },
              "shapeStyle": { "alpha": 1 },
              "lineStyle": {},
              "fillStyle": {},
              "theme": {},
              "path": [{ "lineStyle": { "lineWidth": 0 }, "actions": [{ "action": "move", "x": "0", "y": "0" }, { "action": "line", "x": "w", "y": "0" }, { "action": "line", "x": "w", "y": "h" }, { "action": "line", "x": "0", "y": "h" }, { "action": "close" }] }],
              "fontStyle": {},
              "textBlock": [],
              "anchors": [{ "x": "w/2", "y": "0" }, { "x": "w/2", "y": "h" }, { "x": "0", "y": "h/2" }, { "x": "w", "y": "h/2" }]
            };
            var image = new Image();
            image.src = url;
            image.onload = function () {
              shape.fillStyle = {
                display: "stretch",
                fileId: url,
                imageH: image.width || 100,
                imageW: image.height || 100,
                type: "image"
              }
              shape.props.w = image.width || 100;
              shape.props.h = image.height || 100;
              if (file.name.includes('.svg')) {
                importClass.fileSVGToBase64Png(file).then((baseRes) => {
                  window.serveApiObj.addComponent({
                    definition: JSON.stringify([shape]), componentItemId: params.componentItemId, title, thumb: baseRes
                  }, function (data) {
                    cb({ type: 'image', data });
                  })
                })
              }
              else {
                window.serveApiObj.addComponent({
                  definition: JSON.stringify([shape]), componentItemId: params.componentItemId, title
                }, function (data) {
                  cb({ type: 'image', data });
                })
              }
              $.loading('close');
            }

          } else {
            $.toast({
              text: i18next.t('js.Upload_failed_on'),
              type: "error"
            })
            $.loading('close');
          }
        })
        return
      }
      $.loading('close');
      $.toast({
        text: "文件格式错误",
        type: "error"
      })
    })
  },
  //导出
  exportComponent: function (params, cb) {
    if (!window.isMyFile) {
      var graphClasId = params.componentItemId;
      var title = params.title;
      var params = {
        graphClasId: graphClasId
      }
      const token = localStorage.getItem('processon_token');
      var isDlg = $("#po-flow-shapes-dialog").is(":visible");
      $.loading({ text: "导出中", target: isDlg ? null : $('#designer_viewport') })
      const xhr = new XMLHttpRequest();
      const url = othterUrl + '/api/personal/graph/manager/export/graph/class';
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('token', token);
      xhr.responseType = 'blob';
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              // 调试信息：打印响应头
              console.log('Response Headers:', xhr.getAllResponseHeaders());

              // 创建Blob对象
              const blob = new Blob([xhr.response], { type: 'application/zip' });

              // 创建下载链接
              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(blob);
              let fileName = title + ".posc";
              // 尝试从响应头获取文件名
              // const contentDisposition = xhr.getResponseHeader('Content-Disposition');
              // if (contentDisposition) {
              //     const fileNameMatch = contentDisposition.match(/filename="?(.+?)"?(;|$)/);
              //     if (fileNameMatch && fileNameMatch.length > 1) {
              //         fileName = fileNameMatch[1];
              //     }
              // }
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              // 释放Blob对象
              setTimeout(() => window.URL.revokeObjectURL(link.href), 100);
              $.loading('close')
            } catch (error) {
              console.error('处理响应时出错:', error);
            }
          } else {
            console.error('下载失败:', xhr.statusText);
            // 打印响应内容（如果是文本）
            if (xhr.responseText) {
              console.error('响应内容:', xhr.responseText);
            }
          }
        }

      };
      // 发送请求
      xhr.send(JSON.stringify({ "graphClasId": graphClasId }));
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/component.json' }).then((data) => {
        if (data && data != '') {
          data = JSON.parse(data)
        }
        else data = []
        if (data.length > 0) {
          const itemData = data.filter(d => d.componentItemId == params.componentItemId)

          if (itemData.length > 0) {
            const count = itemData.length
            let index = 0
            const zip = new window.JSZip1();
            itemData.forEach((d) => {
              const folder = zip.folder(d.componentId)
              const metaJson = {
                "lastModify": Date.now(),
                "index": Date.now(),
                "definition": '',
                "title": d.title,
                "thumbUrl": `https://po-files.ks3-cn-beijing.ksyuncs.com/c_my_graph/64c8d0d863879354a5d12291/thumb/${d.componentId}.png`
              }
              let thumbStr = ''

              ipc1.sendSync('loadFileB64', { type: 'local', path: d.defUrl }).then((defdata) => {
                ipc1.sendSync('loadFileB64', { type: 'local', path: d.thumbUrl }).then((thumbdata) => {
                  //存在图片
                  if (d.isImages) {
                    const attachFolder = folder.folder('attachment')
                    ipc1.sendSync('loadFileB64', { type: 'cache', path: `shapes/Detail/${d.componentId}/attachment_map.json` }).then((imagesdata) => {
                      folder.file('attachment_map.json', imagesdata)
                      const attachData = JSON.parse(imagesdata)
                      const attachJson = []
                      for (let k in attachData) {
                        attachJson.push({ key: k, value: attachData[k] })
                      }
                      Promise.all(attachJson.map((d1) => {
                        return new Promise((reslove) => {
                          ipc1.sendSync('loadFileB64', { type: 'cache', path: `shapes/Detail/${d.componentId}/attachment/${d1.value}` }).then((attachContent) => {
                            attachFolder.file(d1.value, attachContent, { base64: true })
                            reslove()
                          })
                        })
                      })).then(() => {
                        metaJson.definition = defdata
                        thumbStr = thumbdata
                        folder.file('component_meta.json', JSON.stringify(metaJson))
                        folder.file('thumb.png', thumbStr, { base64: true })
                        index++
                      })
                    })
                  }
                  else {
                    metaJson.definition = defdata
                    thumbStr = thumbdata
                    folder.file('component_meta.json', JSON.stringify(metaJson))
                    folder.file('thumb.png', thumbStr, { base64: true })
                    index++
                  }
                })
              })
            })
            const interval = setInterval(() => {
              if (count == index) {
                clearInterval(interval)
                zip.generateAsync({ type: 'base64' }).then((content) => {
                  const saveData = {
                    type: 'save', data: content, path: params.title, suffix: 'posc',
                  }
                  ipc1.sendSync('saveFileB64', saveData).then((res) => {
                    if (res != '') {
                      $.toast({
                        text: "导入成功",
                        type: 'success'
                      });
                    }
                  })
                })
              }
            }, 1000);
          }
          else {
            $.toast({
              text: "不存在图形，无法导出",
              type: 'error'
            });
          }
        }
        else {
          $.toast({
            text: "不存在图形，无法导出",
            type: 'error'
          });
        }
      })
    }
  },
  //获取组件
  getComponents: function (params, cb) {
    if (!window.isMyFile) {
      params.graphClasId = params.componentItemId;
      pcUtil.ajax({
        url: othterUrl + `/api/personal/graph/manager/get/graph/content`,
        data: params,
        type: 'GET',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/component.json' }).then((data) => {

        if (data && data != '') {
          data = JSON.parse(data)
        }
        else data = []
        if (data.length > 0) {
          const itemData = data.filter(d => d.componentItemId == params.componentItemId)
          if (itemData.length > 0) {
            cb(itemData)
          }
          else {
            cb([])
          }
        }
        else {
          cb([])
        }
      })
    }
  },
  getComponentById: function (params, cb) {
    if (!window.isMyFile) {
      $.get(params.defUrl, function (data) {
        cb(data)
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'local', path: params.defUrl }).then((defdata) => {
        cb(defdata)
      })
    }
  },
  //组件搜索
  searchComponent: function (params, cb) {
    if (!window.isMyFile) {
      var paramsData = {
        searchWord: params.keyword
      }
      pcUtil.ajax({
        url: othterUrl + `/api/personal/graph/manager/search/graph/content`,
        data: paramsData,
        contentType: 'application/json',
        type: 'get',
        cache: false,
        success(data) {
          var newData = [];
          for (var i = 0; i < data.data.length; i++) {
            var item = data.data[i];
            item.componentItemTitle = "我的组件";
            newData.push(item);
          }
          cb(newData)
        }
      })
    }
    else {

      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/component.json' }).then((data) => {

        if (data && data != '') {
          data = JSON.parse(data)
        }
        else data = []
        if (data.length > 0) {
          const itemData = data.filter(d => d.title.indexOf(params.keyword) != -1)
          if (itemData.length > 0) {
            cb(itemData)
          }
          else {
            cb([])
          }
        }
        else {
          cb([])
        }
      })
    }
  },
  //新增组件
  addComponent: async function (params, cb) {
    var def = params.definition,
      defObj = JSON.parse(def);
    if (defObj && defObj.length > 200) {
      $.toast({
        text: "组件组合图形不能超出200",
        type: "error"
      });
      return;
    }
    if (!window.isMyFile) {
      params.def = def;
      params.graphClasId = params.componentItemId;
      delete params.definition;
      delete params.componentItemId;
      params.thumb = await shapesToSvg(defObj);
      pcUtil.ajax({
        url: othterUrl + `/api/personal/graph/manager/add/graph/content`,
        data: JSON.stringify(params),
        contentType: 'application/json',
        type: 'POST',
        cache: false,
        isErr: true,
        success(data) {
          if (data.code == "200") {
            cb(data.data)
          } else if (data.code == "61691") {
            ipc.sendToHost('showDlgPayWebView1', { pay_position: '组件库', pointspage: '客户端编辑器', pointssource: '组件库', title: "开通会员享全部会员权益" })
          } else if (data.code == "61692") {
            $.toast({
              text: "已超出组件数量100个的上限",
              type: 'error'
            });
          } else {
            $.toast({
              text: data.msg,
              type: 'error'
            });
          }
        }
      })
    }
    else {
      UserOperation.getUserPrivilege(
        false,
        (user = {}) => {
          const { member } = user
          ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/component.json' }).then(async (data) => {
            if (data && data != '') {
              data = JSON.parse(data)
            }
            else data = []
            if (data.length > 0) {
              const itemData = data.filter(d => d.componentItemId == params.componentItemId)
              if (member && itemData.length >= 100) {
                $.loading('close');
                $.toast({
                  text: "已超出组件数量100个的上限",
                  type: 'error'
                });
                return
              }
              else if (!member && itemData.length >= 10) {
                $.loading('close');
                ipc.sendToHost('showDlgPayWebView1', { pay_position: '组件库', pointspage: '客户端编辑器', pointssource: '组件库', title: "开通会员享全部会员权益" })
                return
              }
            }
            if (!params.thumb) {
              params.thumb = await shapesToSvg(defObj);
            }
            params.def = def;
            const id = importClass.newId()
            let defPath = `shapes/Detail/${id}/component_meta.json`
            let thumbPath = `shapes/Detail/${id}/thumb.png`
            ipc1.sendSync('saveFileB64', { type: 'cache', path: defPath, data: importClass.stringToBase64String(params.def) })
              .then((defres) => {
                if (defres != '') {
                  defPath = defres
                  ipc1.sendSync('saveFileB64', { type: 'cache', path: thumbPath, data: params.thumb.split(',')[1] })
                    .then((thumbres) => {
                      if (thumbres != '') {
                        thumbPath = thumbres
                        const result = {
                          componentId: id,
                          componentItemId: params.componentItemId,
                          defUrl: defPath,
                          index: Date.now(),
                          thumbUrl: thumbPath,
                          title: params.title
                        }
                        data.push(result)
                        ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/component.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
                        cb(result)
                      }
                    })
                }
              })
          })
        }
      )
    }
  },
  editComponent: function (params, cb) {
    // params.thumbUrl = 'https://po-files.ks3-cn-beijing.ksyuncs.com/c_my_graph/5e6727fe75b7a85083a1b5d3/thumb/6811c89d3883283a99757a12.png';
    if (!window.isMyFile) {
      var paramsData = {
        contentId: params.componentId,
        def: params.definition,
        thumb: params.thumbFileStr
      }
      pcUtil.ajax({
        url: othterUrl + `/api/personal/graph/manager/edit/graph/content`,
        data: JSON.stringify(paramsData),
        contentType: 'application/json',
        type: 'POST',
        cache: false,
        isErr: true,
        success(data) {
          cb(params)
        }
      })
    }
    else {
      const id = importClass.newId()
      let defPath = `shapes/Detail/${id}/component_meta.json`
      let thumbPath = `shapes/Detail/${id}/thumb.png`
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/component.json' }).then((data) => {
        if (data && data != '') {
          data = JSON.parse(data)
        }
        else data = []
        if (data.length > 0) {
          const index = data.findIndex(d => d.componentId == params.componentId)
          if (index > -1) {
            ipc1.sendSync('saveFileB64', { type: 'cache', path: defPath, data: importClass.stringToBase64String(params.definition) })
              .then((defres) => {
                if (defres != '') {
                  defPath = defres
                  ipc1.sendSync('saveFileB64', { type: 'cache', path: thumbPath, data: importClass.stringToBase64String(params.thumbFileStr.split(',')[1]) })
                    .then((thumbres) => {
                      if (thumbres != '') {
                        thumbPath = thumbres
                        data[index].defPath = defPath
                        data[index].thumbUrl = thumbPath
                        ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/component.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
                        cb(params)
                      }
                    })
                }
              })
          }
          else {
            cb(params)
          }
        }
        else {
          cb(params)
        }
      })
    }
  },
  //删除
  removeComponent: function (params, cb) {
    if (!window.isMyFile) {
      var paramsData = {
        contentId: params.componentId
      }
      pcUtil.ajax({
        url: othterUrl + `/api/personal/graph/manager/del/graph/content`,
        data: JSON.stringify(paramsData),
        contentType: 'application/json',
        type: 'POST',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {

      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/component.json' }).then((data) => {
        if (data && data != '') {
          data = JSON.parse(data)
        }
        else data = []
        if (data.length > 0) {
          data = data.filter(d => d.componentId != params.componentId)
          ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/component.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
          cb(null)
        }
        else {
          cb(null)
        }
      })
    }
  },
  //复制组件
  copyComponent: function (params, cb) {
    if (!window.isMyFile) {
      var paramsData = {
        graphContentId: params.componentId
      }
      pcUtil.ajax({
        url: othterUrl + `/api/personal/graph/manager/copy/graph/content`,
        data: JSON.stringify(paramsData),
        contentType: 'application/json',
        type: 'POST',
        cache: false,
        isErr: true,
        success(data) {
          if (data.code == "200") {
            cb(data.data)
          } else if (data.code == "61691") {
            ipc.sendToHost('showDlgPayWebView1', { pay_position: '组件库', pointspage: '客户端编辑器', pointssource: '组件库', title: "开通会员享全部会员权益" })
          } else if (data.code == "61692") {
            $.toast({
              text: "已超出组件数量100个的上限",
              type: 'error',
            });
          } else {
            $.toast({
              text: data.msg,
              type: 'error'
            });
          }
        }
      })
    }
    else {
      UserOperation.getUserPrivilege(
        false,
        (user = {}) => {
          const { member } = user
          ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/component.json' }).then((data) => {
            if (data && data != '') {
              data = JSON.parse(data)
            }
            else data = []
            if (data.length > 0) {
              const itemData = data.filter(d => d.componentItemId == params.componentItemId)
              if (member && itemData.length >= 100) {
                $.toast({
                  text: "已超出组件数量100个的上限",
                  type: 'error'
                });
                return
              }
              else if (!member && itemData.length >= 10) {
                ipc.sendToHost('showDlgPayWebView1', { pay_position: '组件库', pointspage: '客户端编辑器', pointssource: '组件库', title: "开通会员享全部会员权益" })
                return
              }
            }
            const copyData = data.find(d => d.componentId == params.componentId)
            if (copyData) {
              const id = importClass.newId()
              let defPath = `shapes/Detail/${id}/component_meta.json`
              let thumbPath = `shapes/Detail/${id}/thumb.png`
              const componentMeta = `shapes/Detail/${id}/attachment_map.json`
              const componentDir = `shapes/Detail/${id}/attachment`
              ipc1.sendSync('loadFileB64', { type: 'local', path: copyData.defUrl }).then((defdata) => {
                ipc1.sendSync('saveFileB64', { type: 'cache', path: defPath, data: importClass.stringToBase64String(defdata) })
                  .then((defres) => {
                    if (defres != '') {
                      defPath = defres
                      ipc1.sendSync('loadFileB64', { type: 'local', path: copyData.thumbUrl }).then((thumbdata) => {
                        ipc1.sendSync('saveFileB64', { type: 'cache', path: thumbPath, data: thumbdata })
                          .then((thumbres) => {
                            if (thumbres != '') {
                              thumbPath = thumbres
                              const result = {
                                componentId: id,
                                componentItemId: params.componentItemId,
                                defUrl: defPath,
                                index: Date.now(),
                                thumbUrl: thumbPath,
                                title: params.title,
                                isImages: copyData.isImages
                              }
                              data.push(result)
                              // 如果存在图片
                              if (result.isImages) {
                                ipc1.sendSync('copyFile', { type: 'cache', src: `shapes/Detail/${copyData.componentId}/attachment_map.json`, dest: componentMeta })
                                ipc1.sendSync('copyDir', { type: 'cache', src: `shapes/Detail/${copyData.componentId}/attachment`, dest: componentDir }).then(() => {
                                  ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/component.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
                                  cb(result)
                                })
                              }
                              else {
                                ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/component.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
                                cb(result)
                              }
                            }
                          })
                      })
                    }
                  })
              })
            }
          })
        }
      )
    }
  },
  //组件重命名
  renameComponent: function (params, cb) {
    if (!window.isMyfile) {
      var paramsData = {
        title: params.title,
        graphContentId: params.componentId
      }
      pcUtil.ajax({
        url: othterUrl + `/api/personal/graph/manager/rename/graph/content`,
        data: JSON.stringify(paramsData),
        contentType: 'application/json',
        type: 'POST',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {
      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/component.json' }).then((data) => {
        if (data && data != '') {
          data = JSON.parse(data)
        }
        else data = []
        const index = data.findIndex(d => d.componentId == params.componentId)
        if (index > -1) {
          data[index].title = params.title
          ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/component.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
          cb(data[index])
        }
      })
    }
  },
  //移动组件
  moveComponent: function (params, cb) {
    if (!window.isMyFile) {
      var paramsData = {
        contentId: params.componentId,
        sourceClasId: params.componentItemId,
        targetClasId: params.toComponentItemId
      }
      pcUtil.ajax({
        url: othterUrl + `/api/personal/graph/manager/drag/graph/content`,
        data: JSON.stringify(paramsData),
        contentType: 'application/json',
        type: 'POST',
        cache: false,
        isErr: true,
        success(data) {
          if (data.code == "200") {
            cb(data.data)
          } else if (data.code == "61691") {
            ipc.sendToHost('showDlgPayWebView1', { pay_position: '组件库', pointspage: '客户端编辑器', pointssource: '组件库', title: "开通会员享全部会员权益" })
          } else if (data.code == "61692") {
            $.toast({
              text: "该分类下已超出组件数量100个的上限",
              type: 'error'
            });
          } else {
            $.toast({
              text: data.msg,
              type: 'error'
            });
          }
        }
      })
    }
    else {

      UserOperation.getUserPrivilege(
        false,
        (user = {}) => {
          const { member } = user
          ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/component.json' }).then((data) => {
            if (data && data != '') {
              data = JSON.parse(data)
            }
            else data = []
            if (data.length > 0) {
              const itemData = data.filter(d => d.componentItemId == params.toComponentItemId)
              if (member && itemData.length >= 100) {
                $.toast({
                  text: "已超出组件数量100个的上限",
                  type: 'error'
                });
                return
              }
              else if (!member && itemData.length >= 10) {
                ipc.sendToHost('showDlgPayWebView1', { pay_position: '组件库', pointspage: '客户端编辑器', pointssource: '组件库', title: "开通会员享全部会员权益" })
                return
              }
            }
            const moveIndex = data.findIndex(d => d.componentId == params.componentId)
            if (moveIndex > -1) {
              data[moveIndex].componentItemId = params.toComponentItemId
              ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/component.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
              cb(data[moveIndex])
            }
          })
        }
      )
    }
  },
  //组件排序
  sortComponent: function (params, cb) {
    if (!window.isMyfile) {
      if (params.afterId == "bottom" || params.afterId == params.componentId) {
        delete params.afterId
      }
      if (params.beforeId == "top" || params.beforeId == params.componentId) {
        delete params.beforeId
      }
      var paramsData = {
        moveId: params.componentId,
        beforeId: params.beforeId,
        afterId: params.afterId
      }
      pcUtil.ajax({
        url: othterUrl + `/api/personal/graph/manager/sort/graph/content`,
        data: JSON.stringify(paramsData),
        contentType: 'application/json',
        type: 'POST',
        cache: false,
        success(data) {
          cb(data.data)
        }
      })
    }
    else {

      ipc1.sendSync('loadFileB64', { type: 'cache', path: 'shapes/component.json' }).then((data) => {
        if (data && data != '') {
          data = JSON.parse(data)
        }
        else data = []
        if (data.length == 0) {
          cb(null)
        }
        else {
          const itemData = data.find(d => d.componentId == params.componentId)
          data = data.filter(d => d.componentId != params.componentId)
          const id = params.afterId == "bottom" ? params.beforeId : params.afterId
          const index = data.findIndex(d => d.componentId == id)
          if (index !== -1 && itemData) {
            if (params.afterId != "bottom") {
              data.splice(index + 1, 0, itemData);
            }
            else {
              data.splice(0, 0, itemData);
            }
          }
          ipc1.sendSync('saveFileB64', { type: 'cache', path: 'shapes/component.json', data: importClass.stringToBase64String(JSON.stringify(data)) })
          cb(null)
        }
      })
    }
  },
  getFederationToken: function (params, cb) {
    window.serveApiObj.getGenerateTokenHistory(params, function (res) {
      if (res.result === 'error' || !res.token) {
        cb({ result: 'error', res: res });
        return;
      }
      pcUtil.ajax({
        url: aiSseUrl + '/token/federation',
        type: "POST",
        headers: {
          Authorization: 'Bearer ' + res.token,
          ...(res.appId != null ? { appId: res.appId } : {}),
        },
        data: JSON.stringify({ uid: params.uid }),
        contentType: 'application/json',
        success: function (data) {
          cb && cb(data.data);
        },
        error: function (data) {
          cb({ result: 'error', data: data });
        },
      });
    });
  },
  getGenerateTokenHistory: (function () {
    var isRequesting = false;
    var callbackQueue = [];
    var aiTokenHistory = "";
    var tokenTimer = null;
    function requestToken(terminalType) {
      pcUtil.ajax({
        url: '/api/personal/aigc/ai/sse/hsv/power',
        type: "GET",
        data: { terminalType: terminalType, reqSource: 'lQSQtnKuzY270306' },
        success: function (res) {
          if (res.code == 509) {
            setTimeout(function () {
              requestToken(terminalType);
            }, 3000);
            return;
          }
          isRequesting = false;
          if (res.code == 200) {
            aiTokenHistory = res.data;
            if (tokenTimer) {
              clearTimeout(tokenTimer);
            }
            tokenTimer = setTimeout(function () {
              aiTokenHistory = "";
              tokenTimer = null;
            }, 3000);
            callbackQueue.forEach(function (fn) { fn({ token: aiTokenHistory, appId: "po" }); });
          } else {
            callbackQueue.forEach(function (fn) { fn({ result: "error", data: res.data }); });
            if (res.code == 61680 || res.code == 61681) {
              new Toast({
                type: 'error',
                msg: '今日免费使用次数已达上限',
              });
              var pointPosition = "";
              var pointPtype = "流程图";
              var timesStr = "";
              if (location.pathname.indexOf("mindmap") > -1) {
                pointPtype = "思维导图";
              }
              timesStr = "AI生成次数不足pc";
              pointPosition = pointPtype + timesStr;
              ipc.sendToHost('showDlgPayWebView', { pay_position: pointPtype + "编辑页", pointssource: pointPosition, title: '升级会员解锁全部下载格式', aiPay: true });
            }
          }
          callbackQueue = [];
        },
        error: function (res) {
          isRequesting = false;
          callbackQueue.forEach(function (fn) { fn({ result: "error", res: res }); });
          callbackQueue = [];
        }
      });
    }
    return function (params, cb) {
      var terminalType = "web";
      if (window.navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)) {
        terminalType = "h5";
      }
      if (aiTokenHistory) {
        cb({ token: aiTokenHistory, appId: 'po' });
        return;
      }
      if (isRequesting) {
        callbackQueue.push(cb);
        return;
      }
      isRequesting = true;
      callbackQueue.push(cb);
      requestToken(terminalType);
    };
  })(),
  getGenerateToken: (function () {
    var isRequesting = false;
    var callbackQueue = [];
    var aiToken = '';
    var tokenTimer = null;
    function requestToken(terminalType) {
      pcUtil.ajax({
        url: '/api/personal/aigc/ai/sse/edit/power',
        type: 'GET',
        data: { terminalType: terminalType, reqSource: 'lQSQtnKuzY270306' },
        success: function (res) {
          if (res.code == 509) {
            setTimeout(function () { requestToken(terminalType); }, 3000);
            return;
          }
          isRequesting = false;
          if (res.code == 200) {
            aiToken = res.data;
            if (tokenTimer) clearTimeout(tokenTimer);
            tokenTimer = setTimeout(function () { aiToken = ''; tokenTimer = null; }, 3000);
            callbackQueue.forEach(function (fn) { fn({ token: aiToken, appId: 'po' }); });
          } else {
            callbackQueue.forEach(function (fn) { fn({ result: 'error', msg: res.msg, code: res.code }); });
            if (res.code == 61680 || res.code == 61681 || res.code == 618) aiShowPayLimit();
          }
          callbackQueue = [];
        },
        error: function (res) {
          isRequesting = false;
          callbackQueue.forEach(function (fn) { fn({ result: 'error', res: res }); });
          callbackQueue = [];
        }
      });
    }
    return function (params, cb) {
      var terminalType = window.navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i) ? 'h5' : 'web';
      if (aiToken) { cb({ token: aiToken, appId: 'po' }); return; }
      if (isRequesting) { callbackQueue.push(cb); return; }
      isRequesting = true;
      callbackQueue.push(cb);
      requestToken(terminalType);
    };
  })(),
  getVisualToken: (function () {
    var isRequesting = false;
    var callbackQueue = [];
    var aiToken = '';
    var tokenTimer = null;
    var lastVisualQuota = null;
    function decodeJwtPayload(tokenStr) {
      if (!tokenStr || typeof tokenStr !== 'string') return null;
      var parts = tokenStr.split('.');
      if (parts.length < 2) return null;
      try {
        var base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';
        return JSON.parse(atob(base64));
      } catch (e) {
        return null;
      }
    }
    function mergeQuotaFromJwt(parsed) {
      if (parsed.uCount != null && parsed.maxCount != null) return parsed;
      var claims = decodeJwtPayload(parsed.tokenStr);
      if (!claims) return parsed;
      if (claims.uCount != null && claims.maxCount != null) {
        parsed.uCount = claims.uCount;
        parsed.maxCount = claims.maxCount;
      }
      return parsed;
    }
    function parseVisualTokenPayload(data) {
      if (data != null && typeof data === 'object') {
        return mergeQuotaFromJwt({ tokenStr: data.token || data.access_token || '', uCount: data.uCount, maxCount: data.maxCount });
      }
      return mergeQuotaFromJwt({ tokenStr: data || '', uCount: undefined, maxCount: undefined });
    }
    function requestToken(terminalType) {
      pcUtil.ajax({
        url: '/api/personal/aigc/ai/sse/edit/power',
        type: 'GET',
        data: { terminalType: terminalType, reqSource: 'WfenLaTqKi625742' },
        success: function (res) {
          if (res.code == 509) {
            setTimeout(function () { requestToken(terminalType); }, 3000);
            return;
          }
          isRequesting = false;
          if (res.code == 200) {
            var parsed = parseVisualTokenPayload(res.data);
            aiToken = parsed.tokenStr;
            if (parsed.uCount != null && parsed.maxCount != null) {
              lastVisualQuota = { uCount: parsed.uCount, maxCount: parsed.maxCount };
            }
            if (tokenTimer) clearTimeout(tokenTimer);
            tokenTimer = setTimeout(function () { aiToken = ''; tokenTimer = null; lastVisualQuota = null; }, 3000);
            var payload = { token: aiToken, appId: 'po' };
            if (lastVisualQuota) {
              payload.uCount = lastVisualQuota.uCount;
              payload.maxCount = lastVisualQuota.maxCount;
            }
            callbackQueue.forEach(function (fn) { fn(payload); });
          } else {
            callbackQueue.forEach(function (fn) { fn({ result: 'error', msg: res.msg, code: res.code }); });
          }
          callbackQueue = [];
        },
        error: function () {
          isRequesting = false;
          callbackQueue.forEach(function (fn) { fn({ result: 'error', msg: '网络异常，请稍后重试', code: '' }); });
          callbackQueue = [];
        }
      });
    }
    return function (params, cb) {
      var terminalType = window.navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i) ? 'h5' : 'web';
      if (aiToken) {
        var hit = { token: aiToken, appId: 'po' };
        if (lastVisualQuota) {
          hit.uCount = lastVisualQuota.uCount;
          hit.maxCount = lastVisualQuota.maxCount;
        }
        cb(hit);
        return;
      }
      if (isRequesting) { callbackQueue.push(cb); return; }
      isRequesting = true;
      callbackQueue.push(cb);
      requestToken(terminalType);
    };
  })(),
  getMermaidToken: (function () {
    var isRequesting = false;
    var callbackQueue = [];
    var aiToken = '';
    var tokenTimer = null;
    function requestToken(terminalType) {
      pcUtil.ajax({
        url: '/api/personal/aigc/v2/get/mermaid/use/power',
        type: 'GET',
        data: { terminalType: terminalType, reqSource: 'lQSQtnKuzY270306' },
        success: function (res) {
          if (res.code == 509) {
            setTimeout(function () { requestToken(terminalType); }, 3000);
            return;
          }
          isRequesting = false;
          if (res.code == 200) {
            aiToken = res.data;
            if (tokenTimer) clearTimeout(tokenTimer);
            tokenTimer = setTimeout(function () { aiToken = ''; tokenTimer = null; }, 3000);
            callbackQueue.forEach(function (fn) { fn({ token: aiToken, appId: 'po' }); });
          } else {
            callbackQueue.forEach(function (fn) { fn({ result: 'error', msg: res.msg, code: res.code }); });
            if (res.code == 61680 || res.code == 61681 || res.code == 618) aiShowPayLimit();
          }
          callbackQueue = [];
        },
        error: function (res) {
          isRequesting = false;
          callbackQueue.forEach(function (fn) { fn({ result: 'error', res: res }); });
          callbackQueue = [];
        }
      });
    }
    return function (params, cb) {
      var terminalType = 'web';
      if (aiToken) { cb({ token: aiToken, appId: 'po' }); return; }
      if (isRequesting) { callbackQueue.push(cb); return; }
      isRequesting = true;
      callbackQueue.push(cb);
      requestToken(terminalType);
    };
  })(),
  fixMermaid: function (params, cb) {
    window.serveApiObj.getMermaidToken(params, function (res) {
      if (res.result === 'error' || !res.token) {
        cb(res);
        return;
      }
      pcUtil.ajax({
        url: '/api/personal/mermaid/deal/v4/handle/input',
        headers: {
          mermaidUserInfo: res.token,
          ...(res.appId != null ? { appId: res.appId } : {}),
        },
        data: JSON.stringify({ content: '优化下方mermaid代码\n ' + params.mermaid }),
        contentType: 'application/json',
        success: function (data) { cb && cb(data); },
        error: function (data) { cb({ result: 'error', data: data, msg: data.msg }); },
      });
    });
  },
  getNewSdkToken: function (params, cb) {
    var token = localStorage.getItem('processon_token') || '';
    cb && cb({
      result: token ? 'success' : 'error',
      data: { access_token: token },
    });
  },
  getNewSdkOptions: function (params, cb) {
    var host = (othterUrl || '').replace(/\/$/, '');
    cb && cb({
      aiServerUrl: host + '/api/personal/ai/point/process/ai/consume',
      renderUrl: host,
    });
  },
  getSdkToken: (function () {
    var sdkTokenData = null;
    var sdkTokenTimer = null;
    var isRequesting = false;
    var callbackQueue = [];
    function flushQueue(result) {
      callbackQueue.forEach(function (fn) { fn && fn(result); });
      callbackQueue = [];
    }
    function requestSdkToken(params) {
      window.serveApiObj.getGenerateTokenHistory(params, function (res) {
        if (res.result === 'error' || !res.token) {
          isRequesting = false;
          flushQueue({ result: 'error', res: res });
          return;
        }
        pcUtil.ajax({
          url: aiSseUrl + '/token/smart/access_token',
          type: 'GET',
          data: params,
          headers: {
            Authorization: 'Bearer ' + res.token,
            ...(res.appId != null ? { appId: res.appId } : {}),
          },
          success: function (data) {
            isRequesting = false;
            sdkTokenData = data;
            if (sdkTokenTimer) clearTimeout(sdkTokenTimer);
            sdkTokenTimer = setTimeout(function () {
              sdkTokenData = null;
              sdkTokenTimer = null;
            }, 3000);
            flushQueue({ result: 'success', data: data });
          },
          error: function (data) {
            isRequesting = false;
            flushQueue({ result: 'error', data: data });
          }
        });
      });
    }
    return function (params, cb) {
      if (sdkTokenData) {
        cb && cb({ result: 'success', data: sdkTokenData });
        return;
      }
      if (isRequesting) {
        callbackQueue.push(cb);
        return;
      }
      isRequesting = true;
      callbackQueue.push(cb);
      requestSdkToken(params);
    };
  })(),
  getSdkOptions: function (params, cb) {
    if (hostConfig.aiSdkServerUrl) {
      cb && cb({
        aiServerUrl: hostConfig.aiSdkServerUrl,
        renderUrl: hostConfig.aiSdkRenderUrl,
      });
    } else {
      cb && cb();
    }
  },
  _ensureAiUserId: function (params) {
    var realId = (window.userObj && window.userObj.userId)
      || window.userId
      || localStorage.getItem('processon_userKey')
      || ''
    if (!params) params = {}
    if (!params.userId || params.userId === '1001') {
      params.userId = realId
    }
    return params
  },
  getAiHistoryV2: function (params, cb) {
    window.serveApiObj.requestAiHistory('/v2/conversation/session', 'GET', window.serveApiObj._ensureAiUserId(params), cb);
  },
  searchAiHistoryV2: function (params, cb) {
    window.serveApiObj.requestAiHistory('/v2/conversation/session/search', 'GET', window.serveApiObj._ensureAiUserId(params), cb);
  },
  getAiHistoryContentV2: function (params, cb) {
    window.serveApiObj.requestAiHistory('/v2/conversation/session/message', 'GET', window.serveApiObj._ensureAiUserId(params), cb, false);
  },
  saveAiHistoryContentV2: function (params, cb) {
    window.serveApiObj.requestAiHistory('/v2/conversation/session/message/save', 'POST', window.serveApiObj._ensureAiUserId(params), cb, false);
  },
  aiHistoryUpdateV2: function (params, cb) {
    window.serveApiObj.requestAiHistory('/v2/conversation/session/message/rename', 'POST', window.serveApiObj._ensureAiUserId(params), cb, false);
  },
  aiHistoryDeleteV2: function (params, cb) {
    window.serveApiObj.requestAiHistory('/v2/conversation/session/message/del', 'POST', window.serveApiObj._ensureAiUserId(params), cb, false);
  },
  importFileV2: function (params, cb) {
    window.serveApiObj.getGenerateTokenHistory(params, function (res) {
      if (res.result === 'error' || !res.token) {
        cb({ result: 'error', res: res });
        return;
      }
      pcUtil.ajax({
        url: aiUrl + '/v2/import/file',
        type: 'POST',
        contentType: false,
        processData: false,
        data: params,
        headers: {
          Authorization: 'Bearer ' + res.token,
          ...(res.appId != null ? { appId: res.appId } : {}),
        },
        success: function (data) {
          cb({ result: 'success', data: data });
        },
        error: function (data) {
          cb({ result: 'error', data: data });

        }
      });
    });
  },
  requestAiHistory: function (url, method, params, cb, requireChartId) {
    if (requireChartId !== false && !params.chartId) {
      cb({ result: 'error', data: { msg: '缺少文件 ID' } });
      return;
    }
    window.serveApiObj.getGenerateTokenHistory(params, function (res) {
      if (res.result === 'error' || !res.token) {
        cb({ result: 'error', data: { msg: '历史记录鉴权失败' } });
        return;
      }
      pcUtil.ajax({
        url: aiUrl + url,
        isErr: true,
        type: method,
        data: method === 'POST' ? JSON.stringify(params) : params,
        ...(method === 'POST' ? { contentType: 'application/json' } : {}),
        headers: {
          Authorization: 'Bearer ' + res.token,
          ...(res.appId != null ? { appId: res.appId } : {}),
        },
        success: function (data) {
          cb({ result: 'success', data });
        },
        error: function () {
          cb({ result: 'error', data: { msg: '历史记录请求失败' } });
        }
      });
    });
  },
  getAiHistory: function (params, cb) {
    requestAiSse('/conversation/threads', 'GET', params, cb);
  },
  aiHistoryUpdate: function (params, cb) {
    requestAiSse('/conversation/thread/update', 'POST', params, cb);
  },
  aiHistoryDelete: function (params, cb) {
    requestAiSse('/conversation/thread/del', 'POST', params, cb);
  },
  getAiHistoryContent: function (params, cb) {
    requestAiSse('/conversation/thread/messages', 'GET', params, cb);
  },
  saveAiHistoryContent: function (params, cb) {
    requestAiSse('/conversation/thread/save', 'POST', params, cb);
  },
  getAiWritingHistory: function (params, cb) {
    requestAiSse('/conversation/history/quick', 'GET', params, function (res) {
      if (res.result === 'success') cb({ result: 'success', data: res.data && res.data.data });
      else cb(res);
    });
  },
  updateAiWritingHistory: function (params, cb) {
    requestAiSse('/conversation/history/quick/update', 'POST', params, cb);
  },
  removeAiWritingHistory: function (params, cb) {
    requestAiSse('/conversation/history/quick/del', 'POST', params, cb);
  },
  addAiWritingHistory: function (params, cb) {
    requestAiSse('/conversation/history/quick/save', 'POST', params, cb);
  },
  getTemplateList: function (params, cb) {
    requestAiSse('/template/query', 'POST', params, cb, true);
  },
  getTemplateDef: function (params, cb) {
    requestAiSse('/template/def', 'GET', params, cb, true);
  },
  getSnapshotList: function (params, cb) {
    requestAiSse('/conversation/thread/snapshot', 'GET', params, cb, true);
  },
  saveSnapshotList: function (params, cb) {
    requestAiSse('/conversation/thread/snapshot/save', 'POST', params, cb, true);
  },
  // markdown文件导入生成新文件
  uploadMarkdownFile: function (params, cb) {
    pcUtil.ajax({
      url: '/api/personal/import/markdown',
      type: 'POST',
      async: false,
      contentType: false,
      processData: false,
      data: params,
      success: function (data) {
        cb({ result: "success", data: data.data })
      },
      error: function () {
        cb({ result: "success", data: "" });
      }
    })
  },
  importFile: function (params, cb) {
    window.serveApiObj.getGenerateTokenHistory(params, function (res) {
      if (res.result === 'error' || !res.token) {
        cb({ result: 'error', res });
        return;
      }
      pcUtil.ajax({
        url: aiSseUrl + '/import/file',
        type: 'POST',
        contentType: false,
        processData: false,
        data: params,
        headers: {
          Authorization: 'Bearer ' + res.token,
          ...(res.appId != null ? { appId: res.appId } : {}),
        },
        success: function (data) {
          cb({ result: "success", data:data.data })
        },
        error: function (data) {
          cb({ result: "error", data });
        }
      })
    });
  },
  resetFileUrl: function (params, cb) {
    var origin = "https://icon.processon.com";
    if (location.origin.indexOf('192.168') > -1 || location.origin.indexOf('127.0.0') > -1 || location.origin.indexOf('localhost') > -1) {
      origin = "//wpstest.processon.com"
    }
    var fileIds = params.fileIds || [];
    var i = 0;
    reset(fileIds[i])
    async function reset(fileId) {
      if (fileId) {
        if (fileId.url.includes('://iconsapi.com')) {
          const appKey = "po_app_key";
          const iconName = (fileId.title);
          const url = fileId.url;
          const urlObj = new URL(url);
          const path = urlObj.pathname;
          const fileNameWithExt = path.substring(1);
          const iconId = fileNameWithExt.replace('.svg', '');
          const timestamp = new Date().getTime();
          var sign = await generateSign({ appKey, iconName, url, iconId, timestamp }, "&appSecret=prod_app_secret_996985")
          pcUtil.ajax({
            url: origin + "/icon/convert",
            data: { iconName, url, iconId },
            type: "GET",
            cache: true,
            headers: { "sign": sign, appKey, timestamp },
            success: function (res) {
              fileId.url = res.data
              i++
              reset(fileIds[i])
            },
          })
        } else {
          i++
          reset(fileIds[i])
        }
      } else {
        cb({ fileIds })
      }
    }
    async function generateSign(params, appSecret) {
      // 1. 过滤掉值为空的参数 和 sign 自身（如果有）
      const filteredParams = Object.entries(params)
        .filter(([key, value]) => {
          return key !== 'sign' && value !== null && value !== undefined && value !== '';
        })
        .map(([key, value]) => [key, String(value)]); // 统一转字符串

      // 2. 按 key 的 ASCII 码升序排序
      filteredParams.sort((a, b) => a[0].localeCompare(b[0]));

      // 3. 拼接成 key1=value1&key2=value2...
      const paramString = filteredParams
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

      // 4. 拼接 appSecret（直接拼接，不作为参数）
      const stringToSign = paramString + appSecret;

      // 将输入字符串编码为 UTF-8 的 Uint8Array
      const encoder = new TextEncoder();
      const data = encoder.encode(stringToSign);

      // 使用 Web Crypto API 计算 SHA-256 哈希
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);

      // 将 ArrayBuffer 转换为 十六进制字符串
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      // 5. 计算 SHA256 哈希，返回十六进制字符串
      return hashHex;
    }
  },
}