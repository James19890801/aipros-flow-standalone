import { Toast } from './../../../../class.js'
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
let _importLoadFile = null
function init() {

  window.minder = {}
  var info = {}, Import = {}, File = {};
  // VUE参数初始化
  // var pageContext = {
  //   params: {
  //     folderId: "",
  //     page: 1,
  //     resource: "diagrams",
  //     searchTitle: "",
  //     sort: "free",
  //     view: "icon"
  //   }
  // }
  // 新接口 importConf.urlprefix  importConf.import
  // 针对v5vue接口注入校验
  if (typeof v5VueCom === 'undefined') {
    console.error('vueAPI出错');
  }
  // VUE调用全局回调
  var v5VueApi = {
    /**
     * 导入成功后统一处理
     * @param {*} chartId 
     * @param {*} category 
     */
    callback: function (chartId, category, dataList) {
      // console.log('v5VueApi.callback', chartId, category, info)
      try {
        v5VueCom.eDlgClose();
      } catch (e) {
        console.error(e);
      }
    },
    // 修改文件按钮名称 v5VueApi.changeBtnName
    changeBtnName: function (str) {
      $("#import_btn .po-button__label").html(str);
    },
    // 修改文件按钮名称 v5VueApi.changeBtnName
    changeMubuBtnName: function (str) {
      $("#importmubu_btn .po-button__label").html(str);
    },
    // 导入前钩子 
    handleBeforeImport(info) {
      // 上报打点
      var category = info.category ? (v5VueCom.$PoConfigs.pointFileTyle[info.category] ? v5VueCom.$PoConfigs.pointFileTyle[info.category] : '') : '';
      // buried_point_fn('click', 'new_function', '', {
      //   '操作': '新建文件',
      //   '新建类型': '导入文件',
      //   '文件类型': category,
      //   '文件属性': '私人文件',
      //   '触发位置': v5VueCom.pointSource === 'top-left' ? '个人文件页-左上新建' : '个人文件页-中间新建'
      // })
    },
  }
  var HtmlUtil = {
    /*1.用浏览器内部转换器实现html转码*/
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
    /*2.用浏览器内部转换器实现html解码*/
    htmlDecode: function (text) {
      //1.首先动态创建一个容器标签元素，如DIV
      var temp = document.createElement("div");
      //2.然后将要转换的字符串设置为这个元素的innerHTML(ie，火狐，google都支持)
      temp.innerHTML = text;
      //3.最后返回这个元素的innerText(ie支持)或者textContent(火狐，google支持)，即得到经过HTML解码的字符串了。
      var output = temp.innerText || temp.textContent;
      temp = null;
      return output;
    },
    /*3.用正则表达式实现html转码*/
    htmlEncodeByRegExp: function (str) {
      var s = "";
      if (str.length == 0) return "";
      s = str.replace(/&/g, "&amp;");
      s = s.replace(/</g, "&lt;");
      s = s.replace(/>/g, "&gt;");
      s = s.replace(/ /g, "&nbsp;");
      s = s.replace(/\'/g, "&#39;");
      s = s.replace(/\"/g, "&quot;");
      return s;
    },
    /*4.用正则表达式实现html解码*/
    htmlDecodeByRegExp: function (str) {
      var s = "";
      if (str.length == 0) return "";
      s = str.replace(/&amp;/g, "&");
      s = s.replace(/&lt;/g, "<");
      s = s.replace(/&gt;/g, ">");
      s = s.replace(/&nbsp;/g, " ");
      s = s.replace(/&#39;/g, "\'");
      s = s.replace(/&quot;/g, "\"");
      return s;
    },
    textEncodeByRegExp: function (str) {
      var s = "";
      if (str.length == 0) {
        return "";
      }
      s = str.replace(/&/g, "&amp;");
      s = s.replace(/&nbsp;/g, " ");
      return s;
    }
  };

  window.minder.isArray = function (arr) {
    return Object.prototype.toString.call(arr) === "[object Array]";
  };
  window.minder.newId = function () {
    function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (S4() + S4() + "" + S4());
  };
  window.minder.onerr = function (msg) {
    // var dialogCon = $('#dlg_import')
    // $("#import_btn").html("添加文件");
    if (msg.indexOf("File") > -1) {
      msg = "文档无法解析";
    }
    v5VueApi.changeBtnName("添加文件");
    // Util.globalTopTip(msg, 'top_error', '3000', dialogCon, true);
    v5VueCom.$globalTopTip({ content: msg, type: "error" })

  };
  // 根据文件定义保存缓存文件
  window.minder.saveToCache = function (defs = [], type, fileName, chartId = minder.newId(), chartDefIds = []) {
    return new Promise((reslove, reject) => {
      try {        
        let category = ''
        const isMoreChartDefIds = (chartDefIds.length > 0)
        const userId = localStorage.getItem('processon_userKey') ? localStorage.getItem('processon_userKey') : ''
        const fullName = localStorage.getItem('processon_fullName') ? localStorage.getItem('processon_fullName') : ''
        switch (type) {
          case 'txt':
          case 'opml':
          case 'excel':
          case 'xmind':
          case 'md':
            category = 'mind_free'
            break;
          case 'visio':
          case 'mermaid':
            category = 'flow'
            break;
        }
        chartDefIds = chartDefIds.length > 0 ? chartDefIds : [
          {
            "canvasId": chartId,
            "definitionId": chartId,
            "title": "画布1"
          }
        ]
        const zip = new window.JSZip();
        // 图片文件夹
        const imgs = zip.folder('attachment')
        // 附件文件夹
        const files = zip.folder('files')
        // pos文件
        defs.forEach((def, index) => {
          const chartDefId = index == 0 ? chartDefIds[0] :
            !isMoreChartDefIds ?
              {
                "canvasId": chartId,
                "definitionId": chartId,
                "title": "画布" + i
              } :
              {}
          index > 0 && !isMoreChartDefIds && chartDefIds.push(chartDefId)
          const childChartId = index == 0 ? chartId : !isMoreChartDefIds ? minder.newId() : chartDefIds[index].definitionId
          const data =
          {
            "diagram": {
              "elements": def
            },
            "meta": {
              "mainCanvasId": childChartId,
              "exportTime": pcUtil.getCurrentTimeString(),
              "member": "",
              "diagramInfo": {
                "creator": "",
                "created": pcUtil.getCurrentTimeString(),
                "modified": pcUtil.getCurrentTimeString(),
                "title": fileName,
                "category": category
              },
              "id": childChartId,
              "type": "AIPROS Schema File",
              "version": "5.0"
            }
          }
          zip.file(`${childChartId}.pos`, JSON.stringify(data))
        })
        // meta.json
        const meta = {
          "pages": chartDefIds,
          "mainCanvasId": chartId,
          "exportTime": pcUtil.getCurrentTimeString(),
          "member": "",
          "diagramInfo": {
            "creator": "",
            "created": pcUtil.getCurrentTimeString(),
            "modified": pcUtil.getCurrentTimeString(),
            "title": fileName,
            "category": category,
          },
          "id": chartId,
          "type": "AIPROS Schema File",
          "version": "5.0"
        }
        zip.file('meta.json', JSON.stringify(meta))
        // 压缩完成导出base64数据
        zip.generateAsync({ type: 'base64' }).then((content) => {
          let saveData;
          saveData = { type: 'cache', data: content, path: `back/${chartId}/${chartId}.bak` }
          // 保存
          ipc.invoke('saveFileB64', saveData).then((res) => {
            if (res.code == 200) {
              // 添加最近数据
              const history = {
                "chartId": chartId,
                "title": fileName,
                "category": category,
                "definitionId": chartId,
                "owner": {
                  "userId": userId,
                  "userName": fullName,
                  "fullName": fullName
                },
                "ownerId": userId,
                "description": "",
                "thumbImage": "",
                "lastModify": pcUtil.getCurrentTimeString(),
                "filepath": res.path,
                "type": 5
              }
              // 读取最近目录
              ipc.invoke('loadFileB64', { type: 'cache', path: 'history/cache.json' }).then((resHis) => {
                if (resHis.code == 200) {
                  const historyList = JSON.parse(decodeURIComponent(escape(atob(resHis.data))))
                  historyList.push(history)
                  // 存储最近数据
                  ipc.invoke("saveFileB64",
                    { type: 'cache', path: "history/cache.json", data: btoa(unescape(encodeURIComponent(JSON.stringify(historyList)))) })
                    .then((resSave) => {
                      if (resSave.code == 200) {
                        reslove(res.path)
                      }
                      else {
                        reject('')
                      }
                    })
                }
                else {
                  reject('')
                }
              })
            }
            else {
              reject('')
            }
          })
        })
      }
      catch {
        reject('')
      }
    })
  }
  // 打开编辑器
  window.minder.toEditor = function (category, filepath, title) {
    const chartType = pageContext.getChartType(category);
    pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=${encodeURIComponent(filepath)}`, title: title });
    $('#importRootCover').hide()
    window.VueImportRoot = null
    window.VueImportApp.unmount()
  }
  window.minder.error = function (error = '文档无法解析') {
    new Toast({ type: "error", msg: error });
    v5VueApi.changeBtnName("添加文件");
  }
  //获取文件信息
  Import.getFile = function (file) {
    File.local = file.name.indexOf(".xmind.zip") >= 0 ? file.name.substring(0, file.name.indexOf(".zip")) : file.name;
    File.extension = File.local.substr(File.local.lastIndexOf(".") + 1);
    File.name = File.local.substr(0, File.local.lastIndexOf("."));
    File.safari = file.name.indexOf(".xmind.zip") >= 0 ? true : false;
  };
  Import.safari = function () {
    return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  };
  //加载文件内容
  Import.loadFile = function (file) {
    const filepath = file.path.replaceAll('\\\\', '//')
    v5VueApi.changeBtnName("解析中...");
    $("#share_upload_form .upload-contents").attr("for", "");

    var fIndex = file.name.lastIndexOf('.');
    const fileName = file.name.substring(0, fIndex)

    Import.getFile(file);
    info.file_name = File.name;
    if (typeof File.extension == undefined || typeof File.extension == "undefined") {
      File.extension = "";
    }
    File.extension = File.extension.toLowerCase();
    var type = File.extension;

    let category = 'flow'
    const reader = new FileReader();
    const chartId = minder.newId()
    for (var i in Import) {
      if (type == Import[i].fileExtension) {        
        info.file_type = Import[i].fileDescription;
        switch (Import[i].dataType) {
          case 'pos':
          case 'posf':
          case 'posm':
          case 'poso':
            category = Import[i].dataType == "posm" ? 'mind' : Import[i].dataType == "poso" ? 'outline' : 'flow';
            minder.toEditor(category, filepath, fileName)
            break;
          case 'txt':
          case 'opml':
            try {
              category = Import[i].dataType == 'opml' ? 'outline' : 'mind_free'
              reader.onload = function (file) {
                //读取完成后执行
                var txt = this.result;
                if (!txt) {
                  window.minder.error()
                  return;
                }
                // return
                var im = Import[i];
                var result = im.getEntries(txt);
                if (!result) {
                  window.minder.error()
                  return;
                }
                minder.saveToCache([result], Import[i].dataType, fileName).then((resPath) => {
                  minder.toEditor(category, resPath, fileName)
                }).catch(() => {
                  window.minder.error()
                })
              };
              //异步读取
              reader.readAsText(file, "utf-8");
              return
            }
            catch {
              window.minder.error()
              return
            }
            break;
          case 'excel':
            try {
              category = 'mind_free'
              reader.onload = function (file) {
                //读取完成后执行
                var txt = this.result;
                if (!txt) {
                  window.minder.error()
                  return;
                }
                // return
                var im = Import[i];
                im.getEntries(txt, fileName).then((result) => {
                  if (!result) {
                    window.minder.error()
                    return;
                  }
                  minder.saveToCache([result], Import[i].dataType, fileName).then((resPath) => {
                    minder.toEditor(category, resPath, fileName)
                  }).catch(() => {
                    window.minder.error()
                  })
                }).catch(() => {
                  window.minder.error()
                });
              };
              //异步读取
              reader.readAsArrayBuffer(file);
              return
            }
            catch {
              window.minder.error()
              return
            }
            break;
          case 'xmind':
          case 'visio':
            try {
              category = Import[i].dataType == 'xmind' ? 'mind_free' : 'flow'
              Import[i].getEntries(file, chartId).then((result) => {
                if (!result) {
                  window.minder.error()
                  return;
                }
                minder.saveToCache(result.defs, Import[i].dataType, fileName, chartId, result.chartDefIds).then((resPath) => {
                  minder.toEditor(category, resPath, fileName)
                }).catch(() => {
                  window.minder.error()
                })
              }).catch(() => {
                window.minder.error()
              });
              return
            }
            catch {
              window.minder.error()
              return
            }
            break;
          case 'md':
            minder.toEditor('markdown', file.path, fileName)
            // mdToPosm({ value: file, type: 'file' }).then((result) => {
            //   // 成功处理
            //   minder.saveToCache([result.elements], Import[i].dataType, fileName).then((resPath) => {
            //     minder.toEditor(category, resPath, fileName)
            //   }).catch(() => {
            //     window.minder.error()
            //   })
            // }).catch((error) => {
            //   window.minder.error('转换失败')
            // })
            return;
            break;
          case 'blob':
            try {
              category = 'mind_free'
              reader.onload = function (file) {
                //读取完成后执行
                var txt = this.result;
                if (!txt) {
                  window.minder.error()
                  return;
                }
                // return
                var im = Import[i];
                im.getEntries(txt).then((result)=>{
                  if (!result) {
                    window.minder.error()
                    return;
                  }
                  minder.saveToCache([result], Import[i].dataType, fileName).then((resPath) => {
                    minder.toEditor(category, resPath, fileName)
                  }).catch(() => {
                    window.minder.error()
                  })
                }).catch(()=>{
                  window.minder.error()
                })
              };
              //异步读取
              reader.readAsArrayBuffer(file);
              return
            }
            catch {
              window.minder.error()
              return
            }
            break
        }
      }
    }
    window.minder.error('不支持的文档格式')
  };

  /**
   * file_name：文件名
   * file_type：导入文件类型
   * content：全名
   * team_id：文件类型
   * folder：文件名
   * category：全名
   */
  info = {
    file_name: "",
    file_type: "",
    content: "",
    team_id: "",
    org_id: "",
    folder: "",
    category: ""
  };

  /**
   * extension：文件类型
   * name：文件名
   * local：全名
   * @type {Object}
   */
  File = {
    extension: "",
    name: "",
    local: "",
    safari: false
  }

  // pos相关 begin
  // pos 文件导入
  Import.pos = (function () {
    /**
     * 默认定义
     */
    var def = {
      "structure": "mind_free",
      "lines": {},
      id: "root",
      root: true,
      children: [],
      leftChildren: [],
      "theme": "basic"
    };
    /**
     * 将文本解析成思维导图
     */
    function processTopic(txt) {
      var defStr = JSON.parse(txt);
      var elements = defStr.diagram.elements;
      var category = defStr.meta.diagramInfo.category;
      //脑图文件
      if (elements != null && elements.id == "root") {
        return {
          category: category != "outline" ? "mind_free" : category,
          def: elements
        };
      } else if (elements != null) {
        return {
          category: category,
          def: elements
        };
      } else {
        return "";
      }
    }

    return {
      fileDescription: 'pos',
      fileExtension: 'pos',
      dataType: 'pos',
      getEntries: function (result) {
        return processTopic(result);
      }
    };
  })();
  // 流程图pos导入
  Import.posf = (function () {
    return {
      fileDescription: 'posf',
      fileExtension: 'posf',
      dataType: 'posf',
    };
  })();
  // 思维导图pos导入
  Import.posm = (function () {
    return {
      fileDescription: 'posm',
      fileExtension: 'posm',
      dataType: 'posm',
    };
  })();
  // 思维笔记pos导入
  Import.poso = (function () {
    return {
      fileDescription: 'poso',
      fileExtension: 'poso',
      dataType: 'poso',
    };
  })();
  // pos相关 end

  // txt导入
  Import.txt = (function () {
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
        obj.id = minder.newId();
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
      fileExtension: 'txt',
      dataType: 'txt',
      getEntries: function (result) {
        return processTopic(result);
      }
    };
  })();

  // opml导入
  Import.opml = (function () {
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
        obj.id = minder.newId();
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
      val = val.toString();
      // val = val.replace(/&/g,'&amp;');
      val = val.replace(/</g, '&lt;');
      val = val.replace(/%3C/g, '&lt;');
      val = val.replace(/%3E/g, '&gt;');
      val = val.replace(/'/g, '&#39;');
      val = val.replace(/"/g, '&quot;');
      val = val.replace(/&nbsp;/g, " ");
      // console.log(val)
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
  })();

  // excel/csv导入 begin
  Import.csv = (function () {
    function processTopic(result, title) {
      return new Promise((reslove, reject) => {
        try {
          handleImportExcleByArrayBuffer(result, title).then((res) => {
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
            reslove(res[0])
          }).catch(() => {
            reject(null)
          })
        }
        catch {
          reject(null)
        }
      })
    }
    return {
      fileDescription: 'csv',
      fileExtension: 'csv',
      dataType: 'excel',
      getEntries: function (result, title) {
        return processTopic(result, title);
      }
    };
  })();
  Import.xls = (function () {
    return {
      fileDescription: 'xls',
      fileExtension: 'xls',
      dataType: 'excel',
      getEntries: function (result, title) {
        return Import.xls.processTopic(result, title);
      }
    };
  })();
  Import.xlsx = (function () {
    return {
      fileDescription: 'xlsx',
      fileExtension: 'xlsx',
      dataType: 'excel',
      getEntries: function (result, title) {
        return Import.xls.processTopic(result, title);
      }
    };
  })();
  // excel/csv导入 end

  // xmind导入
  Import.xmind = (function () {
    const filesPath = []
    let filesUrls = []
    const imagesPath = []
    let imagesUrls = []
    function handleFiles(fileId, content, type, chartId) {
      return new Promise((reslove) => {
        if (filesUrls.length == 0 || filesUrls.findIndex(d => d.name == newfilename) < 0) {
          // 判断是否不是图片
          const newfileName = `${fileId}${content.name}`
          const savePath = `back/${chartId}/${newfileName}`
          const reader = new FileReader()
          reader.readAsDataURL(content)
          reader.onload = () => {
            const base64 = reader.result.split(',')[1]
            ipc.invoke('saveFileB64',
              { type: 'cache', path: savePath, data: base64, suffix: '' }
            ).then((ipcres) => {
              const item = type === 'img' ? imagesUrls : filesUrls
              item.push({ name: newfileName, path: ipcres.path })
              filesPath.push({ name: newfileName, path: ipcres.path })
              reslove(content)
            })
          }


        }
        else {
          reslove()
        }
      })

    }
    function processTopic(file, chartId) {
      return new Promise((reslove, reject) => {
        try {
          xmindToPo.loadFile({
            file,
            handleImage: function (id, img) {
              return new Promise((resolve, reject) => {
                resolve(id)
              })
            },
            handleFile: async function (id, file) {

              await handleFiles(id, file, 'file', chartId)
            }
          }).then((content) => {
            console.log("content----", content)

            const result = parseDef(content, chartId)
            result.defs.forEach(d => {
              const urls = mindImagesFiles(d, imagesPath, filesPath, imagesUrls, filesUrls)
              imagesUrls = urls.imagesUrls
              filesUrls = urls.filesUrls
            });
            // 保存路径备份
            ipc.invoke('saveFileB64',
              { type: 'cache', path: `back/${chartId}/attachment.json`, data: btoa(unescape(encodeURIComponent(JSON.stringify(imagesUrls)))), suffix: '' }
            )
            ipc.invoke('saveFileB64',
              { type: 'cache', path: `back/${chartId}/files.json`, data: btoa(unescape(encodeURIComponent(JSON.stringify(filesUrls)))), suffix: '' }
            )
            reslove(result)

          }).catch((err) => {
            console.error(err)
            reject(null)
          })
        }
        catch {
          reject(null)
        }
      })
    }
    function parseDef(defs, chartId) {
      const result = {
        defs: [],
        chartDefIds: [],
        mainCanvasId: ''
      }
      defs.forEach((def, i) => {
        def.page.id = i == 0 ? chartId : minder.newId()
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
    }
    /**
    * 解析思维导图定义图片附件
    * @param {*} data 
    */
    function mindImagesFiles(data, imagesPath, filesPath, imagesUrls, filesUrls) {
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
            d = mindImagesFiles(d, imagesPath, filesPath, imagesUrls, filesUrls)
          })
        }
      }
      // 是否有节点
      if (Object.hasOwnProperty.call(data, 'children')) {
        if (data.children.length > 0) {
          data.children.forEach((d) => {
            d = mindImagesFiles(d, imagesPath, filesPath, imagesUrls, filesUrls)
          })
        }
      }
      return { imagesUrls, filesUrls }
    }
    return {
      fileDescription: 'xmind',
      fileExtension: 'xmind',
      dataType: 'xmind',
      getEntries: function (file, chartId) {
        return processTopic(file, chartId);
      }
    };
  })();

  // visio导入 begin
  Import.vsd = (function () {
    const imagesUrls = []
    const filesUrls = []
    function processTopic(file, chartId) {
      return new Promise((reslove, reject) => {
        const host = ipc.sendSync('getGlobal', "host")
        VisioPo.exportPo({
          file: file,
          url: `${host}/api/pc/diagraming/visio/2vsdx`,
          mfUrl: `${host}/api/pc/diagraming/visio/wmf2png/base64`,
          handleMedia: (res) => {
            // 图片或者附件保存到本地
            return new Promise((resolve, _) => {              
              const fileId = minder.newId()
              const name = `${fileId}.${res.ext}`
              // 保存图片或者附件
              const saveData = { type: 'cache', data: res.data, path: `back/${chartId}/${name}`, suffix: '' }
              ipc.invoke('saveFileB64', saveData).then((resPath) => {
                // 判断文件类型存储不同集合
                if (res.ext == 'png' || res.ext == 'jpg' || res.ext == 'jpeg' || res.ext == 'gif') {
                  imagesUrls.push({ name: name, path: `/${fileId}?`, url: `${resPath.path}` })
                } else {
                  filesUrls.push({ name: name, path: `/${name}`, url: `${resPath.path}` })
                }
                resolve(`file:///${resPath.path}`)
              })
            })
          }
        })
          .then((_res) => {
            // 图片或者附件保存路径转化
            ipc.invoke('saveFileB64',
              { type: 'cache', path: `back/${chartId}/attachment.json`, data: btoa(unescape(encodeURIComponent(JSON.stringify(imagesUrls)))), suffix: '' }
            )
            ipc.invoke('saveFileB64',
              { type: 'cache', path: `back/${chartId}/files.json`, data: btoa(unescape(encodeURIComponent(JSON.stringify(filesUrls)))), suffix: '' }
            )
            // 创建空chart
            const obj = {
              mainCanvasId: chartId,
              chartDefIds: [],
              defs: _res
            }
            _res.forEach((d, i) => {
              const canvasId = i == 0 ? chartId : minder.newId()
              obj.chartDefIds.push({
                canvasId,
                definitionId: canvasId,
                title: '画布' + (i + 1)
              })
            })
            reslove(obj)
          })
          .catch((ex) => {
            console.error(ex)
            reject(null)
          })
      })
    }
    return {
      fileDescription: 'Visio',
      fileExtension: 'vsd',
      dataType: 'visio',
      repeat: 1,
      getEntries: function (result, chartId) {
        return processTopic(result, chartId);
      }
    };
  })();
  Import.vdx = (function () {
    return {
      fileDescription: 'Visio',
      fileExtension: 'vdx',
      dataType: 'visio',
      repeat: 1,
      getEntries: function (result, chartId) {
        return Import.vsd.getEntries(result, chartId);
      }
    };
  })();
  Import.vsdx = (function () {
    return {
      fileDescription: 'Visio',
      fileExtension: 'vsdx',
      dataType: 'visio',
      getEntries: function (result, chartId) {
        return Import.vsd.getEntries(result, chartId);
      }
    };
  })();
  Import.vstx = (function () {
    return {
      fileDescription: 'Visio',
      fileExtension: 'vstx',
      dataType: 'visio',
      repeat: 1,
      getEntries: function (result, chartId) {
        return Import.vsd.getEntries(result, chartId);
      }
    };
  })();
  Import.vsx = (function () {
    return {
      fileDescription: 'Visio',
      fileExtension: 'vsx',
      dataType: 'visio',
      repeat: 1,
      getEntries: function (result, chartId) {
        return Import.vsd.getEntries(result, chartId);
      }
    };
  })();
  Import.vtx = (function () {
    return {
      fileDescription: 'Visio',
      fileExtension: 'vtx',
      dataType: 'visio',
      repeat: 1,
      getEntries: function (result, chartId) {
        return Import.vsd.getEntries(result, chartId);
      }
    };
  })();
  Import.vssx = (function () {
    return {
      fileDescription: 'Visio',
      fileExtension: 'vssx',
      dataType: 'visio',
      repeat: 1,
      getEntries: function (result, chartId) {
        return Import.vsd.getEntries(result, chartId);
      }
    };
  })();
  Import.vsdm = (function () {
    return {
      fileDescription: 'Visio',
      fileExtension: 'vsdm',
      dataType: 'visio',
      repeat: 1,
      getEntries: function (result, chartId) {
        return Import.vsd.getEntries(result, chartId);
      }
    };
  })();
  Import.vssm = (function () {
    return {
      fileDescription: 'Visio',
      fileExtension: 'vssm',
      dataType: 'visio',
      repeat: 1,
      getEntries: function (result, chartId) {
        return Import.vsd.getEntries(result, chartId);
      }
    };
  })();
  Import.vstm = (function () {
    return {
      fileDescription: 'Visio',
      fileExtension: 'vstm',
      dataType: 'visio',
      repeat: 1,
      getEntries: function (result, chartId) {
        return Import.vsd.getEntries(result, chartId);
      }
    };
  })();
  // visio导入 end

  // mm导入
  Import.freemind = (function () {
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
      "lines": {},
      id: "root",
      root: true,
      children: [],
      leftChildren: [],
      "theme": "basic"
    };

    function processTopic(topic, obj, pid) {
      //处理文本
      obj.id = minder.newId();
      if (pid === "" && def && obj) {
        obj.id = "root";
        var type = "";
        for (var i in def) {
          type = def[i];
          if (type) obj[i] = type;
        }
        obj.title = topic.TEXT || "中心主题";
      }
      else {
        obj.parent = pid;
        obj.title = topic.TEXT || "分支主题";
      }

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
          }
        } else { //一个子节点
          if (typeof tmp != "object")
            return;
          obj.children = [{}];
          processTopic(tmp, obj.children[0], obj.id);
        }
      }
    }
    function xml2pos(xml) {
      var json = xmlToJson.xml2json(HtmlUtil.textEncodeByRegExp(xml));
      var result = {};
      var node = json.node;
      processTopic(node, result, "");
      return result;
    }

    return {
      fileDescription: 'FreeMind',
      fileExtension: 'mm',
      dataType: 'txt',
      getEntries: function (xml) {
        return xml2pos(xml);
      }
    };
  })();

  // km导入
  Import.kityminder = (function () {
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
      obj.id = minder.newId();
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
      fileExtension: 'km',
      dataType: 'txt',
      getEntries: function (json) {
        return json2pos(eval("(" + json + ")"));
      }
    };
  })();

  // Markdown导入
  Import.markdown = (function () {
    return {
      fileDescription: 'md',
      fileExtension: 'md',
      dataType: 'md',
      getEntries: function (json) {
        return json2pos(eval("(" + json + ")"));
      }
    };
  })();

  // 
  Import.mindmanager = (function () {
    // 标签 map
    var markerMap = {
      "urn:mindjet:Prio1": ["priority", 1],
      "urn:mindjet:Prio2": ["priority", 2],
      "urn:mindjet:Prio3": ["priority", 3],
      "urn:mindjet:Prio4": ["priority", 4],
      "urn:mindjet:Prio5": ["priority", 5],

      "0": ["completion", 18],
      "25": ["completion", 20],
      "50": ["completion", 22],
      "75": ["completion", 24],
      "100": ["completion", 26]
    };
    var def = {
      "structure": "mind_free",
      "lines": {},
      id: "root",
      root: true,
      children: [],
      leftChildren: [],
      "theme": "basic"
    };

    function processTopic(topic, obj, pid) {
      //处理文本
      obj.id = minder.newId();
      if (pid === "" && def && obj) {
        obj.id = "root";
        var type = "";
        for (var i in def) {
          type = def[i];
          if (type) obj[i] = type;
        }
        obj.title = topic.Text && (topic.Text.PlainText || topic.Text["@PlainText"]) || "中心主题";
      } else if (pid == "free") {
        obj.parent = "root";
        obj.free = true;
        obj.title = topic.Text && (topic.Text.PlainText || topic.Text["@PlainText"]) || "自由主题";
        if (!obj.pos) {
          obj.pos = { x: 10000 + topic.Offset.CX * 1, y: 10000 + topic.Offset.CY * 1 }
        }
      } else {
        obj.parent = pid;
        obj.title = topic.Text && (topic.Text.PlainText || topic.Text["@PlainText"]) || "分支主题";
      }

      // 处理标签
      if (topic.Task) {
        type = "";
        obj.icons = [];
        if (topic.Task.TaskPriority) {
          type = markerMap[topic.Task.TaskPriority];
          if (type) obj.icons.push({ index: type[1], name: type[0] });
        }

        if (topic.Task.TaskPercentage) {
          type = markerMap[topic.Task.TaskPercentage];
          if (type) obj.icons.push({ index: type[1], name: type[0] });
        }
      }
      // 处理超链接
      if (topic.Hyperlink) {
        obj.link = { value: topic.Hyperlink.Url, type: "url" };
      }
      // 处理Tag
      if (topic.TextLabels && topic.TextLabels.TextLabel) {
        var tmp = topic.TextLabels.TextLabel;
        var tags = [];
        if (tmp.length && tmp.length > 0) { //多个子节点
          for (var i in tmp) {
            type = tmp[i].TextLabelName;
            if (type) tags.push(tmp[i].TextLabelName);
          }
        } else { //一个子节点
          type = tmp.TextLabelName;
          if (type) tags.push(tmp.TextLabelName);
        }
        obj.tag = tags.join(",");
      }
      // 处理Note
      if (topic.NotesGroup && topic.NotesGroup.NotesXhtmlData) {
        obj.note = topic.NotesGroup.NotesXhtmlData.PreviewPlainText;
      }
      if (pid != "" && topic.FloatingTopics && topic.FloatingTopics.Topic) {
        var tmpTopic = topic.FloatingTopics.Topic;
        if (tmpTopic != null && 'PlainText' in tmpTopic) {
          obj.note = topic.FloatingTopics.Topic.Text.PlainText;
        }
      }
      // //处理子节点
      // obj.children = [];
      // if (topic.SubTopics && topic.SubTopics.Topic) {
      // 	var tmp = topic.SubTopics.Topic;
      // 	if (tmp.length && tmp.length > 0) { //多个子节点
      // 		for (var i in tmp) {
      // 			if(typeof tmp[i] != "object")
      // 				continue;
      // 			obj.children.push({});
      // 			processTopic(tmp[i], obj.children[i], obj.id);
      // 		}
      // 	} else { //一个子节点
      // 		if(typeof tmp != "object")
      // 			return;
      // 		obj.children = [{}];
      // 		processTopic(tmp, obj.children[0], obj.id);
      // 	}
      // }
      //处理子节点
      var subTopics = topic.SubTopics && topic.SubTopics.Topic;
      var freeTopics = pid === "" && topic.FloatingTopics && topic.FloatingTopics.Topic;
      obj.children = [];
      if (subTopics) {
        getSubTopics.call(this, subTopics, obj);
      }
      if (freeTopics) {
        getFreeTopic.call(this, freeTopics, obj);
      }
    }

    function getSubTopics(subTopics, obj) {
      if (subTopics.length && subTopics.length > 0) { //多个子节点
        for (var i in subTopics) {
          var tmp = subTopics[i];
          if (typeof tmp != "object")
            continue;
          getTopic.call(this, tmp, obj);
        }
      } else {
        if (typeof subTopics != "object")
          return;
        getTopic.call(this, subTopics, obj);
      }
    }

    function getFreeTopic(topic, obj) {
      if (topic.length && topic.length > 0) { //多个子节点
        for (var i in topic) {
          if (typeof topic[i] != "object")
            continue;
          this.children.push({});
          processTopic.call(this, topic[i], this.children[this.children.length - 1], "free");
        }
      } else {
        if (typeof topic != "object")
          return;
        if (obj.free) {
          this.children.push({ pos: { x: obj.pos.x + topic.Offset.CX * 1, y: obj.pos.y + topic.Offset.CY * 1 } });
        }
        this.children.push({});
        processTopic.call(this, topic, this.children[this.children.length - 1], "free");
      }
    }

    function getTopic(topic, obj) {
      if (topic.length && topic.length > 0) { //多个子节点
        for (var i in topic) {
          if (typeof topic[i] != "object")
            continue;
          obj.children.push({});
          processTopic.call(this, topic[i], obj.children[i], obj.id);
        }
      } else { //一个子节点
        if (typeof topic != "object")
          return;
        obj.children.push({});
        processTopic.call(this, topic, obj.children[obj.children.length - 1], obj.id);
      }
    }

    function xml2pos(xml) {
      var json = xmlToJson.xml2json(xml);
      var result = {};
      var topic = json.OneTopic.Topic;
      processTopic.call(result, topic, result, "");
      return result;
    }

    return {
      fileDescription: 'MindManager',
      fileExtension: 'mmap',
      dataType: 'blob',
      getEntries: function (file) {
        return new Promise((reslove, reject) => {
          try {
            JSZip.loadAsync(file).then((res) => {
              res.files['Document.xml'].async('string').then((content) => {
                var json = xml2pos(content);
                reslove(json);
              })
            })
          }
          catch {
            reject(null)
          }
        })
      }
    }
  })();

  // 导入初始化
  var importExport = function () {
    var imgs = "";
    var accepts = [];
    for (var i in Import) {
      var ext = Import[i].fileExtension;
      if (ext) {
        if (!Import[i].repeat) {
          // if (ext == "opml") {
          // 	imgs += "<span class='mindtypes-text' title='" + ext + "'>opml</span>";
          // } else if (ext == "xlsx" || ext == "xls" || ext == "csv") {
          // 	var excelImgs = "<span class='mindtypes-text icons' style='font-size:24px;color:#47c247;vertical-align:-11px; border:0;' title='Excel'>&#xe657;</span>";
          // } else {
          if (ext == "xls" || ext == "xlsx") {
            continue;
          }
          imgs += "<span class='mindtypes p-" + i + "' title='*" + ext + "'></span>";
          // }
        }
        accepts.push('.' + Import[i].fileExtension);
      }
    }
    // **** 准备上传
    $("#share_doc_input").attr("accept", accepts.join());

    // 绑定fileinput上传事件
    var fileInputChange = function () {
      //加载文件内容
      if (this.files[0]) {
        Import.loadFile(this.files[0]);
      }
      $(this).val('');
    };
    $("body").on("change", '#share_doc_input', fileInputChange);
    // 绑定fileinput上传事件 - end
    var dom = $("body")[0];
    var dragoverCbk = function (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    var dropCbk = function (e) {
      if (e.dataTransfer.files.length) {
        e.preventDefault();
        e.stopPropagation();
        //加载文件内容
        $("#share_doc_input")[0].files = e.dataTransfer.files
        Import.loadFile(e.dataTransfer.files[0]);
      }
    }
    // 清除历史事件
    dom.removeEventListener("dragover", dragoverCbk, false);
    dom.removeEventListener("drop", dropCbk, false);
    // 开始绑定
    dom.addEventListener("dragover", dragoverCbk, false);

    dom.addEventListener('drop', dropCbk, false);
  }
  importExport();
  _importLoadFile = Import.loadFile
}

export default {
  importInit() { init() },
  loadFile(file) { if (_importLoadFile) _importLoadFile(file) }
}
