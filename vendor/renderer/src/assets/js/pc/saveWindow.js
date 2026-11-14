import ServerUtil from "./server/server.js";
import UserOperation from "./db/user.js";
import Setting from "./db/setting.js";
import HtmlStr from "./htmlStr.js";
import FileDatabase from "./operation/fileDatabase.js";

import { Toast, ChartDom, FolderDom } from "./class.js";
import "@/assets/css/pc/iconfont/iconfont.css";

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString);
let id = urlParams.get('id')
let path = urlParams.get('path')
let suffix = urlParams.get('suffix')
let saveAs = urlParams.get('saveAs')
let isLocal = urlParams.get('isLocal')
// $('#saveName').val(suffix == '' ? decodeURI(path) : `${decodeURI(path)}.${suffix}`)
$('#saveName').val(decodeURI(path))
/**
 * 页面对象
 */
window.pageContext = {
  /* -start-------------------------------------------- 数据集合 --------------------------------------------- */
  data: {
    // 数据左侧分类
    pateTypeKeys: { "history": "最近打开", "diagrams": "我的文件", "colla": "与我协作", "fav": "我的收藏", "trash": "回收站" },
    // 页面类型 [history | diagrams | colla | fav | trash]
    pageType: "diagrams",
    // 列表展示形式 [list | icon]
    listType: "icon",
    // 列表排序方式 [title | free | lastModify]
    listSort: "lastModify",
    // 筛选方式 
    category: "",
    // 页面正在加载
    isLoading: false,
    // 页面正在加载更多
    isLoadingMore: false,
    // icons 集合
    icons: {
      // 列表方式展示
      "list_type_list": "&#xe70b;",
      // 缩略图方式展示
      "list_type_icon": "&#xe70a;",
      // 排序对勾
      "list_sort": "&#xe658;",
      // 思维导图标志
      "mind": "&#xe623;",
      // 原型图标志
      "ui": "&#xe608;",
      // board图标志
      "board": "&#xe67d;",
      // 思维笔记图标志
      "outline": "&#xe7c3;",
      // 流程图标志
      "flow": "&#xe60b;"
    },
    // 当前列表页数 默认:1
    pageCur: 1,
    // 每页多少个
    pageSize: 15,
    // 总页数
    pageCount: 1,
    // 文件列表数据 包含属性:{charts, folders, dir, sort, userView}
    filesObj: { charts: [], folders: [] },
    // 总文件列表数据，主要用于合并分页数据 包含属性:{charts, folders}
    totalFilesObj: { charts: [], folders: [] },
    // 当前访问的路径 [folderObj]
    dirs: [],
    // 页面内文件与文件夹的 class 模型
    ChartClass: false,
    FolderClass: false,
    user: {},
    // 是否是搜索模式
    isSearch: false,
    // 上次点击同步时间
    beforeClickSync: 0,
    // 正在执行同步
    syncing: false,
    // 文件类型集合
    categores: {
      "flow": "流程图", "bpmn": "", "mind_free": "思维导图", "ui": "", "uml": "", "mind_org": "", "outline": "思维笔记"
    },
    mouseDownVersionS: 0,
    lastCloseSetALertTime: 0,
    mouseDownInterval: null
  },
  /* -start-------------------------------------------- 初始化 --------------------------------------------- */
  init: function () {
    // Setting.initialize();
    // 添加图片加载失败处理
    // pcUtil.imgError();
    // 初始化当前访问的路径
    pageContext.data.dirs = [{ id: "root", title: pageContext.data.pateTypeKeys[pageContext.data.pageType] }];
    // 事件绑定
    pageContext.bindEvent();
    // 初始化样式
    pageContext.initCss();


    // 添加全局对象
    window.Toast = Toast;

    // 线上文件\文件夹数据保存到本地
    pageContext.data.isLoading = true;

    // 获取用户权益
    pageContext.updataFileNum();

    UserOperation.getUser(false, user => {
      window.user = user;
      pageContext.data.user = user;
      ipc.sendToHost('sendUserInfo', user)
      // 自动触发同步
      pageContext.data.isLoading = false;
      pageContext.renderDir("refresh").then(() => {
        pageContext.loadFiles(true)
      })
      // });
    }, true);


    window.addEventListener('online', function () {
      setTimeout(() => {
        // new Toast({ type: "success", msg: "网络已恢复连接", $con: $(".con-right") });
        $('.con-mask').hide()
      }, 500)
    })
    window.addEventListener('offline', function () {
      setTimeout(() => {
        // new Toast({ type: "warning", msg: "网络连接中断", $con: $(".con-right") });
        $('.loadingView').remove()
        $('.con-mask').show()
      }, 500);
    })
  },

  // 初始化样式
  initCss: function () {
    let conRightH = $(".con-right").height();
    let fileListH = conRightH - 70;
    $(".con-right .file-list").css({ height: `${fileListH}px` });
    if (isLocal == 'false') {
      $('a[data-nav="save"]').css('pointer-events', 'none')
      $('a[data-nav="save"]').css('opacity', 0.5)
    }
  },
  /* -end---------------------------------------------- 初始化 --------------------------------------------- */

  /* -start-------------------------------------------- 事件绑定 --------------------------------------------- */
  // 页面事件
  bindEvent: function () {

    // 左侧导航按钮点击, 切换 pageType
    $(".con-left .con-left-btn").off().on("click", "a", e => {
      // 当点击同步按钮时，禁止点击左侧导航按钮
      $(".con-right").show()
      if ($("#btn_sync").hasClass("rotate1")) return;

      let obj = $(e.currentTarget);
      let nav = obj.attr("data-nav");
      if (nav == 'save') {

        ipc.invoke('getSaveFilePath', { path: path, suffix: suffix }).then((res) => {
          if (res !== '') {
            const filepath = suffix == '' ? res : res.endsWith(`.${suffix}`) ? res : `${res}.${suffix}`
            ipc.sendToHost('saveFile', { id: id, type: 1, path: filepath, dir: '', saveAs: saveAs ? true : false })
            window.poCollect('保存文件',{'保存方式':'手动选择保存到本地'})
            ipc.sendToHost('close')
          }
        })
      }
      else {
        pageContext.data.ChartClass = false;
        pageContext.data.FolderClass = false;
        pageContext.data.pageCur = 1;
        pageContext.data.isLoadingMore = true
        pageContext.data.filesObj = { charts: [], folders: [] };
        // pageContext.data.pageCount = 1;
        $(".file-list").html("");
        pageContext.renderDir("refresh").then(() => {
          // 在这里清空数据显示
          pageContext.loadFiles(true, nav).then(() => {
            pageContext.data.isLoadingMore = false
          })
        })
      }
    });
    $(".file_num_updata").off().on("click", function () {
      pageContext.files.showPayWin()
    });
    $('#saveCancel').off().on("click", function () {
      ipc.sendToHost('close')
    });
    $('#saveSave').off().on("click", function () {


      if (!navigator.onLine) {
        new Toast('needNetwork')
        return
      }

      FileDatabase.hasFileNum(false).then(res => {
        if (!res.no || res.isMember) { // ！no是可以保存 
          const filepath = suffix == '' ? $('#saveName').val() : $('#saveName').val().endsWith(`.${suffix}`) ? $('#saveName').val() : `${$('#saveName').val()}.${suffix}`
          ipc.sendToHost('saveFile',
            {
              id: id,
              type: 2, path: filepath,
              dir: pageContext.data.dirs[pageContext.data.dirs.length - 1],
              saveAs: saveAs ? true : false
            })
          ipc.sendToHost('close')
        }
      }).catch(err => {
        if(suffix == 'md'){
          const filepath = suffix == '' ? $('#saveName').val() : $('#saveName').val().endsWith(`.${suffix}`) ? $('#saveName').val() : `${$('#saveName').val()}.${suffix}`
          ipc.sendToHost('saveFile',
            {
              id: id,
              type: 2, path: filepath,
              dir: pageContext.data.dirs[pageContext.data.dirs.length - 1],
              saveAs: saveAs ? true : false
            })
          ipc.sendToHost('close')
        }
        else if (!isLocal) {
          const filepath = suffix == '' ? $('#saveName').val() : $('#saveName').val().endsWith(`.${suffix}`) ? $('#saveName').val() : `${$('#saveName').val()}.${suffix}`
          ipc.sendToHost('upgradeDlg', { dlgType: 4, id, res: filepath, suffix, saveAs: saveAs ? true : false })
          ipc.sendToHost('close')
        }
        else {
          ipc.sendToHost('showDlgPayWebView')
          // ipc.sendToHost('close')
        }
      });

    });

    // 网络列表滚动加载
    $(".file-list").off("scroll").on("scroll", function () {
      let { pageCur, pageCount, isLoadingMore, pageType, ChartClass } = pageContext.data;
      // ChartClass.hasShowThumbnail($(".file-list"));

      if (pageCur >= pageCount || isLoadingMore) return;

      let hCon = $(".file-list").height();
      let scrollTop = $(".file-list")[0].scrollTop;
      let scrollHeight = $(".file-list")[0].scrollHeight;
      console.log((hCon + scrollTop) >= (scrollHeight - 200))

      if ((hCon + scrollTop) >= (scrollHeight - 200)) {
        pageContext.data.isLoadingMore = true;
        pageContext.data.pageCur += 1;
        console.log("33333333")
        // pageContext.loadMore($(".file-list"));
        console.log(`加载第${pageContext.data.pageCur}页`)
        pageContext.loadFiles(false, pageType).then(() => {
          pageContext.data.isLoadingMore = false;
          // pageContext.loadMoreClose();
        });
      }
    });
  },
  // class 事件
  bindClassEvent: function () {
    let { FolderClass, ChartClass, isSearch, searchType, pageType } = pageContext.data;

    // 文件夹-打开文件夹事件
    FolderClass && FolderClass.on('click', (folderId, folderTitle) => {
      if (isSearch) {
        pageContext.data.pageType = 'diagrams';
        pageContext.renderDir("refresh")
          .then(() => {
            pageContext.renderDir("push", { id: folderId, title: folderTitle })
              .then(() => {
                // $(".file-list:first").html("");
                pageContext.resetAndloadFiles(true, pageContext.data.pageType)
              })
              .catch(() => {
              });
          })
          .catch(() => {
          });
      }
      else {
        pageContext.renderDir("push", { id: folderId, title: folderTitle })
          .then(() => {
            $(".file-list:first").html("");
            pageContext.resetAndloadFiles(true, pageType)
          });
      }
    });
    // 文件夹-下拉框点击事件
    FolderClass && FolderClass.on('menuClick', (tit, folderId, folder) => {
      switch (tit) {
        case "location":
          pageContext.renderDir("location", { id: folder.id })
            .then(() => pageContext.resetAndloadFiles());
          break;
        case "del":
        case "delete":
        case "restore":
        case "copy":
        case "unfav":
        case "uncolla":
          pageContext.loadFiles();
          break;
      }
    });

    // 文件-下拉框点击事件
    ChartClass && ChartClass.on('menuClick', (tit, chartId, chart, $chart) => {
      switch (tit) {
        case "localUpload":
          const filePath = $chart.attr('data-filepath')
          ipc.invoke('loadFileB64', { type: 'local', path: filePath }).then((result) => {
            const data = result
            if (data.code == 200) {
              FileDatabase.hasFileNum(false).then(() => {
                const $Icon = $chart.find('.uploadStatus')
                const loadingIcon = {
                  "loading": "./src/assets/images/home/loading.png"
                }
                //如果有不让在上传了
                if (pageContext.getUploadingFileIds().includes(chartId)) {
                  return
                }
                ipc.send('localUpload', chartId)
                const curFildIds = pageContext.getUploadingFileIds()
                curFildIds.push(chartId)
                window.localStorage.setItem('uploadingFileIds', JSON.stringify(curFildIds));
                $Icon.css({ backgroundImage: `url(${loadingIcon['loading']})` }).addClass('rotating-element').show()
              })
                .catch(() => {
                  ipc.sendToHost('upgradeDlg', { dlgType: 1 })
                })
            }
          });


          break;
        case "location":
          const isMyFile = chart.chartId.length <= 13;
          if (isMyFile) {
            ipc.send('openFileDir', $($chart).data('filepath'))
          } else {
            pageContext.renderDir("location", { id: chart.folderId }).then(() => pageContext.loadFiles(true));
          }
          break;
        case "restore":
        case "copy":
        case "clone":
          pageContext.loadFiles();
          break;

        case "uncolla":
        case "unfav":
          pageContext.data.pageCur = 1;
          pageContext.loadFiles();
          break;
        case "del":
        case "delete":
          break;
      }
    });


    // 文件-多选
    ChartClass && ChartClass.on('check', e => {
      var that = $(e.target);
      var parent = that.parents(".file-list");
      var chartParent = that.parents(".file-list-item, .list-item");
      var id = chartParent.attr("id"), tp = chartParent.attr("tp");
      pageContext.getSelNum(parent)
      if (chartParent.find(".check").is(":checked")) {
        if ($(".select-op").length <= 0) {
          pageContext.showBatch(parent, tp);
        }
        if (pageContext.selNum == parent.find(".check").length) {
          $(".select-op input").prop("checked", true);
        }
      } else {
        $(".select-op input").prop("checked", false);
        if (pageContext.selNum == 0) {
          pageContext.removeBatch();
        }
      }
    });
  },
  /* -end---------------------------------------------- 事件绑定 --------------------------------------------- */

  /* -start-------------------------------------------- 逻辑处理 --------------------------------------------- */
  /**
   * 加载文件列表
   * @param {"是否显示 loading"} toast [true || [Toast]]
   * @param {"页面类型"} pageType
   * @returns {Promise<"渲染完成">}
   */
  resetAndloadFiles: function (toast = false, pageType) {
    pageContext.data.pageCur = 1;
    pageContext.data.isLoadingMore = true
    pageContext.data.filesObj = { charts: [], folders: [] };
    $(".file-list").html("");
    $(".con-right").show()
    // 在这里清空数据显示
    pageContext.loadFiles(toast, pageType).then(() => {
      pageContext.data.isLoadingMore = false
    })
  },
  loadFiles: function (toast, pageType = pageContext.data.pageType) {
    let { pageCur, dirs, category, pageSize } = pageContext.data;
    let dirLastObj = dirs[dirs.length - 1];
    let loadingToastTime = false;

    if (toast) loadingToastTime = setTimeout(() => toast = new Toast("loading", $(".con-right")), 150);
    return new Promise(async (resolve, reject) => {

      // pageContext.data.isLoading = true;
      if (toast === true) toast = new Toast("loading", $(".con-right"));
      else if (toast instanceof Toast) toast = toast;
      else toast = false;

      pageContext.data.pageType = pageType;
      pageContext.data.searchType = pageType;
      $(".con-left .con-left-btn").find("[data-nav=" + pageContext.data.pageType + "]").addClass("active").siblings().removeClass("active");

      if (!$(`.con-left-btn a[data-nav=${pageType}]`).hasClass("active")) {
        $(`.con-left-btn a[data-nav].active`).removeClass("active");
        $(`.con-left-btn a[data-nav=${pageType}]`).addClass("active");
      }

      let getDataEnd = () => {
        pageContext.renderList(pageType, () => {
          let pageCur = pageContext.data.pageCur || 1;
          if (pageCur == 1) pageContext.data.totalFilesObj = pageContext.data.filesObj;
          else pageContext.data.totalFilesObj.charts = [...pageContext.data.totalFilesObj.charts, ...pageContext.data.filesObj.charts];

          pageContext.data.isLoading = false;

          if (loadingToastTime) {
            clearTimeout(loadingToastTime);
            loadingToastTime = false;
          }

          toast && toast.closeAll();
          resolve();
        });
      };

      switch (pageType) {
        case "diagrams":
          ServerUtil.loadFiles(dirLastObj.id || dirLastObj.folderId, category, "title", "desc", "", pageCur, pageSize, res => {
            let data = res.data;
            if (res && res.code) {
              toast && toast.closeAll();
              pageContext.data.filesObj.charts = data.charts
              pageContext.data.filesObj.folders = data.folders;
              pageContext.data.filesObj = pageContext.filesToSort(pageContext.data.filesObj, pageContext.data.listSort);
              if (data.pageInfo) pageContext.data.pageCount = data.pageInfo.pageCount || 1;
              resolve();
            }
            getDataEnd();
          });
          break;
      };
    }).catch(e => { });
  },
  // 构建文件列表, 分类中心
  renderList: function (pageType, callback = function () { }, isCover) {
    pageContext._renderFiles(pageType, callback, true, true);
    // 绑定 class 事件
    pageContext.bindClassEvent();
  },
  // 构建 我的\协作\收藏\回收站 列表
  _renderFiles: function (pageType, callback = function () { }, isAppend, isDrag) {
    let { filesObj, listType, searchTitle, pageCur, pageCount, dirs } = pageContext.data;
    let dirLastObj = dirs[dirs.length - 1];
    let $filesCon = $(".file-list:first");
    let isNull = true;
    let online = !!(pageType == "fav" || pageType == "colla");
    let ChartClass = new ChartDom({ listType, $ChartsCon: $filesCon, pageType: pageType, isSearch: (searchTitle && searchTitle != ""), online, folderId: dirLastObj.id, isShowMenu: false });
    let FolderClass = new FolderDom({ listType, $FoldersCon: $filesCon, pageType: pageType, isSearch: (searchTitle && searchTitle != ""), online, parentId: dirLastObj.id, isShowMenu: false });

    pageContext.data.ChartClass = ChartClass;
    pageContext.data.FolderClass = FolderClass;

    // 阻止不符合最新类型的渲染进程
    if ($(".con-left-btn a.active").attr("data-nav") != pageType) {
      callback && callback();
      return;
    }
    if (!isAppend || (isAppend && pageCur == 1)) $filesCon.html("");

    if (listType == "list" && !$filesCon.find(".list-title").length) $filesCon.append(HtmlStr["fileListTitle"]("list"));
    // 构建文件夹 & 只在第一页构建文件夹列表
    if (filesObj.folders && filesObj.folders.length && pageCur == 1) {
      let hasChartFileTitle = !!$filesCon.find(".file-list-title[data-name=文件]").length;

      isNull = false;
      if (listType == "icon" && !$filesCon.find(".file-list-title[data-name=文件夹]").length) $filesCon.prepend(HtmlStr["fileListTitle"](listType, "文件夹"));

      filesObj.folders.map(folder => {
        if (hasChartFileTitle) $filesCon.find(".file-list-title[data-name=文件]").before(FolderClass.createFolder(folder));
        else if (listType == "list" && $filesCon.find(".list-item[tp=folder]").length) $filesCon.find(".list-item[tp=folder]:last").after(FolderClass.createFolder(folder));
        else if (listType == "list") $filesCon.find(".list-title").after(FolderClass.createFolder(folder));
        else $filesCon.append(FolderClass.createFolder(folder));
      });
      FolderClass.resize();
    }
    // 构建文件
    if (filesObj.charts && filesObj.charts.length) {
      isNull = false;
      if (listType == "icon" && !$filesCon.find(".file-list-title[data-name=文件]").length) $filesCon.append(HtmlStr["fileListTitle"](listType, "文件"));
      filesObj.charts.map(chart => $filesCon.append(ChartClass.createChart(chart)));
      // ChartClass.hasShowThumbnail($filesCon);
      ChartClass.resize();
    }

    // 空文件处理
    if (
      isNull &&
      $filesCon.find(".file-list-item, .list-item").length == 0
    ) {
      if (pageType == "fav" || pageType == "colla") {
        if (pageCur >= pageCount) pageContext.fileListNull();
      }
      else pageContext.fileListNull();
    }

    $('.file-list-item .icons_web.op').remove()
    $('.file-list-item .check-outer').remove()
    $('.file-list-item  .po-star.icons_web ').remove()
    callback && callback();
  },
  // 构建内容区域导航
  renderDir: function (t = "refresh", dirObj = {}) {
    let { pateTypeKeys, pageType, dirs, searchTitle } = pageContext.data;
    let $dirBox = $("#dir_box");
    let _dirObj = {};

    return new Promise((resolve, reject) => {
      let dirEnd = (dirs = pageContext.data.dirs) => {

        // 点击导航路径文件名
        $dirBox.off().on('click', ".item", function () {
          if ($(this).hasClass("active")) return;

          if (pageType == 'colla') {
            $(this).addClass("active").css({ color: "#212930" }).siblings().removeClass("active").css({ color: "#666" });
          }
          let folderId = $(this).attr("data-f-id");
          pageContext.renderDir("skip", { id: folderId });
        });

        $dirBox.html("");

        dirs.map((dir, index) => {
          $dirBox.append(HtmlStr["dir"](dir, dir.notIcon, dirs, index));
        });
        if (pageType !== 'colla') {
          $dirBox.find(".item:last-child").addClass("active");
        }
        resolve();
      };
      switch (t) {
        // 重置导航
        case "refresh":
          pageContext.data.dirs = [{ id: "root", title: pateTypeKeys[pageType] }];
          dirEnd();
          break;
        // 尾部添加导航
        case "push":
          let searchIdx = pageContext.data.dirs.findIndex(dir => dir.id === "search");

          if (searchIdx > -1) pageContext.data.dirs.splice(searchIdx, 1);
          _dirObj = { id: dirObj.id, title: dirObj.title };
          pageContext.data.dirs.push(_dirObj);
          dirEnd();
          pageContext.emptySearch(true, false)
          break;
        // 转转到当行列表内的位置
        case "skip":
          let idx = dirs.findIndex(dir => (dir.id || dir.folderId) == dirObj.id);
          pageContext.data.dirs.splice(idx + 1, dirs.length);
          $(".file-list:first").html("");
          pageContext.resetAndloadFiles(true)
          if (pageType !== 'colla') {
            dirEnd();
          }
          break;
        // 定位到文件位置（本地）
        case "location":
          pageContext.data.pageType = 'diagrams'
          if (dirObj.id == "root") {
            pageContext.data.dirs = [{ id: "root", title: pateTypeKeys['diagrams'] }];
            pageContext.emptySearch(true);
            dirEnd();
            break;
          }
          else {
            // 获取 dir数据
            ServerUtil.getFloderAndfiles(dirObj.id, res => {
              if (res) {
                const { dir = [] } = res
                let sortFolder = pcUtil.arrFlashback(dir);
                pageContext.data.dirs = [{ id: "root", title: pateTypeKeys['diagrams'] }, ...sortFolder];
                pageContext.emptySearch(true);
                dirEnd();
                // pageContext.loadFile(true)
              }
            })
          }
          break;
        // 定位到文件位置（协作）
        case "location_colla":
          pageContext.data.dirs = [
            { id: "root", title: pateTypeKeys[pageType] },
            { id: dirObj.id, title: dirObj.title }
          ];
          pageContext.emptySearch(true);
          dirEnd();
          break;
        // 导航切换到搜索模式
        case "search":
          dirEnd([{ id: "search", title: `搜索 “${searchTitle}”`, notIcon: true }]);
          break;
        // 导航取消搜索模式
        case "unSearch":
          dirEnd();
          break;
      }
    });
  },
  // 文件列表为空状态
  fileListNull: function ($filesCon = $(".file-list:first"), searchType) {
    let { pageType } = pageContext.data;
    let type = searchType || pageType;
    let $null = !pcUtil.isOnline() && type != 'history' ? $(HtmlStr["noOnline"](type)) : $(HtmlStr["null"](type));

    // 快捷创建 - 思维导图
    $null.find(".null_entrance[type=mind]").off().on("click", function () {
      pageContext.createChart("mind", "mind_free");
    });
    // 快捷创建 - 流程图
    $null.find(".null_entrance[type=flow]").off().on("click", function () {
      pageContext.createChart("flow", "flow");
    });
    // 快捷创建 - 思维笔记
    $null.find(".null_entrance[type=outline]").off().on("click", function () {
      pageContext.createChart("outline", "outline");
    });
    // 快捷创建 - 导入
    $null.find(".null_entrance[type=import]").off().on("click", function () {
      FileDatabase.hasFileNum(true).then(() => $("#dlg_import").dialog());
    });
    // 快捷创建 - 文件夹
    $null.find(".null_entrance[type=folder]").off().on("click", function () {
      pageContext.createFolder();
    });

    $filesCon.html($null);
  },

  // 更新文件数 dom
  updataFileNum: function () {
    // 获取文件数量
    UserOperation.getUserPrivilege(false, (user = {}) => {
      let $con;
      let totalFileCount;
      let usedFileCount = user.usedFileCount;
      let sFileNumMax = '';

      // if(!pcUtil.isOnline()) usedFileCount = user.usedFileCount + user.balanceUserdFileCount;
      localStorage.setItem('privilege', JSON.stringify(user))
      user = user || {};
      if (new Date(user.expireTime).getTime() > new Date('2100/01/01').getTime() && user.member) {
        $con = $(".con-left-num[data-member=3]");
        $(".con-left-num[data-member=0]").hide();
        $(".con-left-num[data-member=1]").hide();
        $(".con-left-num[data-member=2]").hide();
        totalFileCount = 10000;
        sFileNumMax = '';
        $con.find(".file_num_n").html(`<span class="icons" style="color: #ff9800;">&#xe664;</span><span style="color: #A6B9CD;padding-left: 4px;">终身版</span>`);
        if (!$(".p-menu-left .logo_user_member span:first-child").hasClass("lifelong")) {
          $(".p-menu-left .logo_user_member span:first-child").addClass("lifelong");
        }
        $(".p-menu-left .logo_user_member span:first-child").text("终身版");
        $(".p-menu-left .logo_user_member span:last-child").text("续费");
      } else if (user.orgMember) {
        $con = $(".con-left-num[data-member=2]");
        $(".con-left-num[data-member=0]").hide();
        $(".con-left-num[data-member=1]").hide();
        $(".con-left-num[data-member=3]").hide();
        totalFileCount = 10000;
        sFileNumMax = '';
        // $con.find(".file_num_n").html(`<span class="icons" style="color: #ff9800;">&#xe65d;</span><span style="color: #A6B9CD;padding-left: 4px;">团队版</span>`);
        $con.find(".file_num_n").html(`<span class="icons" style="color: #ff9800;">&#xe664;</span><span style="color: #A6B9CD;padding-left: 4px;">个人版</span>`);
        if (!$(".p-menu-left .logo_user_member span:first-child").hasClass("member")) {
          $(".p-menu-left .logo_user_member span:first-child").addClass("member");
        }
        // $(".p-menu-left .logo_user_member span:first-child").text("团队版");
        $(".p-menu-left .logo_user_member span:first-child").text("个人版");
        $(".p-menu-left .logo_user_member span:last-child").text("续费");
      }
      else if (user.member && new Date(user.expireTime).getTime() <= new Date('2100/01/01').getTime()) {
        $con = $(".con-left-num[data-member=1]");
        $(".con-left-num[data-member=0]").hide();
        $(".con-left-num[data-member=2]").hide();
        $(".con-left-num[data-member=3]").hide();
        totalFileCount = 10000;
        sFileNumMax = '';
        $con.find(".file_num_n").html(`<span class="icons" style="color: #ff9800;">&#xe664;</span><span style="color: #A6B9CD;padding-left: 4px;">个人版</span>`);
        if (!$(".p-menu-left .logo_user_member span:first-child").hasClass("member")) {
          $(".p-menu-left .logo_user_member span:first-child").addClass("member");
        }
        $(".p-menu-left .logo_user_member span:first-child").text("个人版");
        $(".p-menu-left .logo_user_member span:last-child").text("续费");
      }
      else {
        $con = $(".con-left-num[data-member=0]");
        $(".con-left-num[data-member=1]").hide();
        $(".con-left-num[data-member=2]").hide();
        $(".con-left-num[data-member=3]").hide();
        totalFileCount = user.totalFileCount;
        sFileNumMax = `${totalFileCount}`;
        $con.find(".file_num_n").html(`文件数: <span>${usedFileCount}</span> / <span>${sFileNumMax}个</span>`);
        if (!$(".p-menu-left .logo_user_member span:first-child").hasClass("member")) {
          $(".p-menu-left .logo_user_member span:first-child").removeClass("member");
        }
        $(".p-menu-left .logo_user_member span:first-child").text("免费版");
        $(".p-menu-left .logo_user_member span:last-child").text("升级");
        $con.show();
      }

      $(".p-menu-left .logo_user_member").removeClass("hide");
      let per = parseInt(usedFileCount / totalFileCount * 100);
      if (per > 100) per = 100;
      $con.find(".file_line_top").css({ width: `${per}%` });
      if (per >= 50) $con.find(".file_line_top").css({ background: "rgb(255, 85, 85)" });
      else $con.find(".file_line_top").css({ background: "#067BEF" });
      // }, isOnline);
    });
  },
  /**
   * 文件数据排序
   * @param {"接口返回的文件列表数据"} filesObj
   * @returns {"排序后的filesObj对象"}
   */
  filesToSort: function (filesObj = { charts: [], folders: [] }, listSort = pageContext.data.listSort) {
    if (!filesObj.folders || filesObj.folders.constructor != Array) filesObj.folders = [];
    if (!filesObj.charts || filesObj.charts.constructor != Array) filesObj.charts = [];

    switch (listSort) {
      case "title": // 按标题排序
        filesObj.folders.sort(function (a, b) {
          return (a.title || "null").localeCompare((b.title || ""), "zh");
        });
        filesObj.charts.sort(function (a, b) {
          return (a.title || "null").localeCompare((b.title || ""), "zh");
        });
        break;
      case "lastModify": // 按标最后修改时间排序
        filesObj.folders.sort(function (a, b) {
          return (new Date(b.lastModify).getTime()) - (new Date(a.lastModify).getTime());
        });
        filesObj.charts.sort(function (a, b) {
          return (new Date(b.lastModify).getTime()) - (new Date(a.lastModify).getTime());
        });
        break;
      case "free": // 按标自定义排序
        filesObj.folders.sort(function (a, b) {
          return a.sortNum - b.sortNum;
        });
        filesObj.charts.sort(function (a, b) {
          return a.sortNum - b.sortNum;
        });
        break;
      case "diagrams":
        filesObj.folders.sort(function (a, b) {
          return (new Date(b.lastModify).getTime()) - (new Date(a.lastModify).getTime());
        });
        break;
    };

    filesObj.sort = pageContext.data.listSort;
    return filesObj;
  },

  /* -start-------------------------------------------- 待合并区域 --------------------------------------------- */
  params: {},
  util: {
    /**
     * 获取日期，参数dates（int）表示几天前或者几天后的日期
     * @param {} dates
     * @return {}
     */
    getDate: function (dates) {
      var date = new Date();
      date.setDate(date.getDate() + dates);
      var y = date.getFullYear();
      var m = date.getMonth() + 1;
      var d = date.getDate();
      return y + "-" + m + "-" + d;
    },
    getSelected: function () {
      return $(".file-list-item.active, .list-item.active");
    },
    getBaseUrl: "",
    isOnline: function () {
      return pcUtil.isOnline()
    }
  },
  files: {
    iframeDlgPms: {},
    showPayWin: function () {
      ipc.sendToHost("showDlgPayWebView")
    }
  },
  /* -end---------------------------------------------- 待合并区域 --------------------------------------------- */
};

$(document).ready(function () {
  pageContext.init();
  window.addEventListener("keydown", (event) => {
    if (event.key == 'Tab') {
      if (event.preventDefault) { event.preventDefault(); }
      else { event.returnValue = false; }
    }
  })
})