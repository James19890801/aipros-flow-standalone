import ServerUtil from "./server/server.js";
import UserOperation from "./db/user.js";
import Setting from "./db/setting.js";
import HtmlStr from "./htmlStr.js";
import FileDatabase from "./operation/fileDatabase.js";
import FileBusiness from "./operation/fileBusiness.js";
import Notification from "./notification/notification.js";
import ProShare from "./share.js";
import { createApp } from 'vue'
import TemplateCreate from './useIndex/tempCreate/index.vue'
import GlobalDlg from './useIndex/components/globalDlg.vue'
import ImportDlg from './useIndex/components/modal/dlgImport/index.vue'
import install from './useIndex/tempCreate/Poui.js'
import useGuide from './guide'
import Import from './useIndex/components/modal/dlgImport/import.js'
import Constant from './constant'
import { Toast, ChartDom, FolderDom, Alert } from "./class.js";
import { isMasSubmissionLite, masUnsupportedToast } from "./masSubmission.js";
import { initContextMenu } from './operation/contextMenu'
import "@/assets/css/pc/iconfont/iconfont.css";
window.host = ipc.sendSync('getGlobal', 'host')
const CONFIG = ipc.sendSync('getGlobal', 'CONFIG')
/**
 * 页面对象
 */
pageContext = {
	/* -start-------------------------------------------- 数据集合 --------------------------------------------- */
	data: {
		// 是否全局开启同步保底逻辑
		openSyncBaoDi: false,
		// 数据左侧分类
		pateTypeKeys: { "history": "最近", "diagrams": "我的云文件", "colla": "与我协作", "fav": "我的收藏", "trash": "回收站" },
		// 搜索页面类型 [diagrams | colla | fav]
		searchType: "diagrams",
		// 搜索内容
		searchTitle: "",
		templateSearchTitle: "",
		// 页面类型 [history | diagrams | colla | fav | trash]
		pageType: "templateCreate",
		// 列表展示形式 [list | icon]
		listType: "icon",
		// 列表排序方式 [title | free | lastModify]
		listSort: "lastModify",
		// 列表排序正/倒 [asc | desc]
		listDesc: "desc",
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
		pageSize: 30,
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
		mouseDownInterval: null,
		locateTimer: null
	},
	/* -start-------------------------------------------- 初始化 --------------------------------------------- */
	init: function () {
		// 初始化设置数据
		// Setting.initialize();
		// 添加图片加载失败处理
		// pcUtil.imgError();
		// 初始化当前访问的路径
		pageContext.data.dirs = [{ id: "root", title: pageContext.data.pateTypeKeys[pageContext.data.pageType] }];
		// 通信初始化
		pageContext.globalWs.init();
		// 检验登录
		pageContext.verifyLogin();
		// 事件绑定
		pageContext.bindEvent();
		// 初始化页面元素
		pageContext.initHtml();
		// 初始化样式
		pageContext.initCss();
		// 重置等待重启状态为 false
		// Setting.updateSetting({ awaitRestart: false });



		// 添加全局对象
		window.Toast = Toast;

		// 线上文件\文件夹数据保存到本地
		// pageContext.data.isLoading = true;

		// 获取文件排序方式





		UserOperation.getUser(false, user => {
			window.user = user;
			pageContext.data.user = user;

			ipc.sendToHost('sendUserInfo', user)
			window.localStorage.setItem("userPhoto", user.photoUrl);
			// 自动触发同步
			pageContext.data.isLoading = false;
			window.localStorage.setItem("authInfo", JSON.stringify(user.auth));

			pageContext.getUserActivityTime();

			// 获取用户权益
			pageContext.updataFileNum((data) => {
				const timeFormat = (date) => {
					if (date) {
						let newDate = /\d{4}-\d{1,2}-\d{1,2}/g.exec(date)
						return newDate[0]
					} else {
						return ''
					}
				}
				const totalInfo = Object.assign(user, data)
				/// 是不是终身会员？
				const isLongMember = user.expireTime && new Date(user.expireTime).getTime() > new Date('2100/01/01').getTime()

				if (!isLongMember) {
					// 加载广告
					pageContext.initAdvertise()
				}
				console.log("totalInfo", totalInfo)
				// 触发用户画像
				const CONFIG = ipc.sendSync('getGlobal', "CONFIG")
				try {

					let identify = {
						"团队版": totalInfo.orgMember,
						"用户昵称": totalInfo.fullName,
						"公司": totalInfo.profile?.company,
						"个人版到期时间": timeFormat(totalInfo.expireTime),
						"个人版": totalInfo.member,
						//"国籍":this.User.profile?.country,
						"userName": totalInfo.userName,
						"userId": totalInfo.userId,
						"UID_L1": totalInfo.userId[totalInfo.userId.length - 1],
						"团队版到期时间": totalInfo.orgExpireTime,
						"职位": totalInfo.profile?.specialty,
						"是否创作者": totalInfo.createChartStatus,
						"限制文件量": totalInfo.fileCount,
						"个人版累计创建文件数量": totalInfo.usedFileCount,
						"剩余文件数量": totalInfo.fileCount - totalInfo.usedFileCount,
						"最后登录时间": timeFormat(totalInfo.lastLogin),
						"注册时间": timeFormat(totalInfo.registDate),
						"注册方式": totalInfo.registerType,
						"行业": Constant.industryItem[totalInfo.profile?.companyIndustry]?.name,
						"登录过客户端": true,
						"当前渠道": CONFIG.CHANNELTYPE || 'po',
					};
					if (identify && identify.userId) {
						window.identifyUser(identify.userId, identify);
					}
				} catch (e) {
				}
			});

			pageContext.renderDir("refresh").then(() => {
				const userId = window.localStorage.getItem("processon_userKey");
				// 检查是否需要新手引导
				if (!localStorage.getItem('guideSkipped_' + userId)) {
					pageContext.data.pageType = 'history'
					pageContext.loadFiles(true)
				}
				else {
					pageContext.showTemplatePage()
				}
				// 右键菜单
				initContextMenu()
				// pageContext.loadFiles(true)
			})
			// });
		}, true);


		window.addEventListener('online', function () {
			const user = localStorage.getItem('privilege')
			const keyt = localStorage.getItem('keyt')
			ipc.send('startInterVal', { user: JSON.parse(user), keyt })
			setTimeout(() => {
				new Toast({ type: "success", msg: "网络已恢复连接", $con: $(".con-right") });
			}, 500)
		})
		window.addEventListener('offline', function () {
			setTimeout(() => {
				pageContext.noOnLine()
				$('.loadingView').remove()
			}, 500);
		})
		// 开启滚动tab
		ipc.sendToHost("showTabSlider")
		ipc.sendToHost('homeNav', pageContext.data.pageType)
		Import.importInit()
	},

	// 初始化样式
	initCss: function () {
		let conRightH = $(".con-right").height();
		let fileListH = conRightH - $(".con-right .dir").outerHeight();
		let conLeftT = $(".p-head").outerHeight();

		$(".con-right,#root").css({ height: `calc( 100% - ${conLeftT}px)` });
		$(".con-right #po-files-list").css({ height: `${fileListH}px` });

	},
	// 初始化页面元素
	initHtml: function () {
		// 首页lottie的动画
		if ($('.createFoloderBtn')) {
			let createFoloderBtn = lottie.loadAnimation({
				container: $('.createFoloderBtn')[0], // 挂载动画的容器dom元素
				renderer: 'svg', // 渲染方式，svg、canvas、html（轻量版仅svg渲染）
				loop: false, // 是否循环播放
				autoplay: false, // 是否自动播放
				path: './src/assets/js/pc/animation/createModal/data.json', // 动画json文件路径
			});

			$('.createFoloderBtn').off('mouseenter').on('mouseenter', () => {
				createFoloderBtn.play()
			})
			$('.createFoloderBtn').off('mouseleave').on('mouseleave', () => {
				createFoloderBtn.stop()
			})
		}
		if ($('.importBtn')) {
			let createFoloderBtn = lottie.loadAnimation({
				container: $('.importBtn')[0], // 挂载动画的容器dom元素
				renderer: 'svg', // 渲染方式，svg、canvas、html（轻量版仅svg渲染）
				loop: false, // 是否循环播放
				autoplay: false, // 是否自动播放
				path: './src/assets/js/pc/animation/importModal/data.json', // 动画json文件路径
			});

			$('.importBtn').off('mouseenter').on('mouseenter', () => {
				createFoloderBtn.play()
			})
			$('.importBtn').off('mouseleave').on('mouseleave', () => {
				createFoloderBtn.stop()
			})
		}


	},
	getUploadingFileIds: function () {
		return JSON.parse(window.localStorage.getItem('uploadingFileIds') || '[]')
	},
	/* -end---------------------------------------------- 初始化 --------------------------------------------- */

	/* -start-------------------------------------------- 事件绑定 --------------------------------------------- */
	// 隐藏弹窗集合
	_hideAlert: {
		hideSortBy: () => { },
		hideHelpBtn: () => { },
		hideUserShade: () => { },
		hideNewMenu: () => { }
	},
	reloadHome: function (needReloadTab = false, data = '') {
		const user = localStorage.getItem('privilege')
		const keyt = localStorage.getItem('keyt')
		ipc.send('startInterVal', { user: JSON.parse(user), keyt })

		if (!navigator.onLine && !needReloadTab) {
			new Toast('needNetwork')
			return
		}
		if (pageContext.data.pageType == 'templateCreate' && needReloadTab == false) {
			return
		}
		let { syncing, beforeClickSync, isLoading } = pageContext.data;
		let time = new Date().getTime();
		let sync = () => {
			pageContext.data.beforeClickSync = time;
			// pageContext.data.isLoading = true;
			pageContext.data.syncing = true;

			$(this).addClass("rotate1");
			$(this).next(".text").text("正在刷新...");
			$(this).next(".text").fadeIn();

			// 获取用户权益
			pageContext.updataFileNum(() => {
				if (needReloadTab) { // 编辑器 更新
					if (data) {
						const payData = JSON.parse(data)
						window.poCollect('支付成功信息', payData.paypms)
					}
					ipc.sendToHost('preRefreshing')
				}
			});

			pageContext.initAdvertise()

			setTimeout(() => {
				// 更新用户信息
				UserOperation.getUser(false, user => {
					// $("#user-logo img").attr("src", pcUtil.Avatar(user.userId));
					window.user = user;
					pageContext.data.user = user;
					window.localStorage.setItem("authInfo", JSON.stringify(user.auth));
					ipc.sendToHost('sendUserInfo', user)
				}, true);
			}, 1000);

			// FileDatabase.hasFileNum(false).catch(() => {
			// 	pageContext.updataFileNum(true);
			// });
			// pageContext.renderDir('refresh').then(() => {
			pageContext.data.isLoading = false;
			pageContext.data.syncing = false;
			$(this).removeClass("rotate1");
			$(this).next(".text").text("刷新完成");
			setTimeout(() => {
				$(this).next(".text").fadeOut();
			}, 3000);
			pageContext.resetAndloadFiles(true)
			// });
		};
		const fastClickTime = time - beforeClickSync > 2000

		if (isLoading && typeof isLoading == "object") isLoading.abort();
		if (isLoading || syncing || !fastClickTime) return;
		sync();
	},
	showTemplatePage: function () {
		console.log('templateCreate')
		$('#btn_sync').hide()
		$(".con-right").show()
		$('.p-menu').show()
		ipc.sendToHost('closeAiCreateWebview')
		if (!window.VueRoot) {
			const app = createApp(TemplateCreate)
			install(app);
			app.directive('imgError', {
				beforeMount(el, binding) {
					el.onerror = function (e) {
						e.target.src = 'https://assets.processon.com/chart_image/thumb/582c2ea7e4b0645c0e9f1cad.png';
					}
				}
			});
			app.component('GlobalDlg', GlobalDlg);
			const vm = app.mount('#root')
			window.VueApp = app
			window.VueRoot = vm
		}
		$('#root').show();
		$(".con-right").hide()
		const templateSearchTitle = pageContext.data.templateSearchTitle || "";
		$("#search-con input").val(templateSearchTitle);
		$("#search-con .icon_cancel_search")[templateSearchTitle ? "show" : "hide"]();
		$("#search-con input").attr('placeholder', '搜索模板/搜索文件链接');
		$(".con-left .con-left-btn").find("[data-nav='templateCreate']").addClass("active").siblings().removeClass("active");

	},
	showAICreatePage: function () {
		$(".con-left .con-left-btn").find("[data-nav='aiCreate']").addClass("active").siblings().removeClass("active");
		$('#root').hide();
		$('#btn_sync').hide()
		$(".con-right").hide()
		$('.p-menu').hide()
		$('#aiCreateIframe').hide()
		const token = localStorage.getItem('processon_token') || ''
		const url = `${window.host}/ai?hide_left&hide_tool&token=${token}&channelType=${CONFIG.CHANNELTYPE}&sourceType=pc`
		if (token) {
			ipc.send("set_cookie", token);
		}
		ipc.sendToHost('openAiCreateWebview', { url })


	},
	showImportDlg: function () {
		$('#importRootCover').show()
		if (!window.VueImportRoot) {
			const app = createApp(ImportDlg)
			install(app);
			app.directive('imgError', {
				beforeMount(el, binding) {
					el.onerror = function (e) {
						e.target.src = 'https://assets.processon.com/chart_image/thumb/582c2ea7e4b0645c0e9f1cad.png';
					}
				}
			});
			const vm = app.mount('#importRoot')

			window.VueImportRoot = vm
			window.VueImportApp = app
		}
		else {
			$('#importRoot').show()
		}
	},
	// 页面事件
	bindEvent: function () {
		// 隐藏index弹窗
		let hideIndexMenu = function () {
			ipc.sendToHost("hideTabMore");
		};
		$(document).off("click", hideIndexMenu).on("click", hideIndexMenu);

		// 切换列表展示形式: icon <--> list
		$("#dir_sort").off().on("click", () => {
			if (pageContext.data.listType == "icon") pageContext.data.listType = "list";
			else pageContext.data.listType = "icon";
			pageContext.setConfig('diagrams_listType', pageContext.data.listType)
			pageContext.resetAndloadFiles();
			pageContext.renderListType();
			// pageContext.data.pageCur = 1;
			// pageContext.loadFiles(true).then(() => {
			// 	pageContext.data.filesObj.charts = pageContext.data.totalFilesObj.charts;
			// 	pageContext.data.filesObj.folders = pageContext.data.totalFilesObj.folders;
			// 
			// 	pageContext.renderList(false, () => { }, true);
			// })
		});

		// 网络列表滚动加载
		$("#po-files-list").off("scroll").on("scroll", function () {
			let { pageCur, pageCount, isLoadingMore, pageType, isSearch } = pageContext.data;
			// ChartClass.hasShowThumbnail($(".file-list"));

			if (pageCur >= pageCount || isLoadingMore || isSearch) return;

			let hCon = $("#po-files-list").height();
			let scrollTop = $("#po-files-list")[0].scrollTop;
			let scrollHeight = $("#po-files-list")[0].scrollHeight;
			console.log((hCon + scrollTop) >= (scrollHeight - 200))

			if ((hCon + scrollTop) >= (scrollHeight - 200) && navigator.onLine) {
				pageContext.data.isLoadingMore = true;
				pageContext.data.pageCur += 1;
				console.log("33333333")
				pageContext.loadMore($(".file-list"));
				console.log(`加载第${pageContext.data.pageCur}页`)
				pageContext.loadFiles(false, pageType).then(() => {
					pageContext.data.isLoadingMore = false;
					pageContext.loadMoreClose();
				});
			}
		});

		// 左侧导航按钮点击, 切换 pageType
		$(".con-left .con-left-btn").off().on("click", "a", (e, from = '') => {
			// 当点击同步按钮时，禁止点击左侧导航按钮
			if ($("#btn_sync").hasClass("rotate1")) return;

			let obj = $(e.currentTarget);
			let nav = obj.attr("data-nav");

			if (isMasSubmissionLite(CONFIG) && (nav === 'aiCreate' || nav === 'templateCreate')) {
				masUnsupportedToast(Toast)
				return
			}

			if (nav == 'import') {
				if (isAICreateActive()) {
					ipc.sendToHost('showIndexImportDlg')
					return
				}
				pageContext.showImportDlg()
				return

				// let suffix = 'vsd,xmind,txt,xlsx,xls,csv,vsdx,vstx,vsx,vtx,vssx,opml,mm,km'
				// ipc.invoke('getFilePath', { type: 'open', suffix: suffix }).then((res) => {
				// 	if (res != '') {
				// 		const title = res.substring(res.lastIndexOf('/') + 1, res.lastIndexOf('.'))
				// 		let category = 'mind'
				// 		if (res.endsWith('vsd') || res.endsWith('vsdx') || res.endsWith('vstx')
				// 			|| res.endsWith('vsx') || res.endsWith('vtx') || res.endsWith('vssx') || res.endsWith('vdx')
				// 			|| res.endsWith('eddx')) {
				// 			category = 'flow'
				// 		}
				// 		let chartType = pageContext.getChartType(category);
				// 		pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=${encodeURIComponent(res)}`, title: title });
				// 	}
				// })
				// return
			}

			const currentSearchText = $("#search-con input").val().trim();
			if (pageContext.data.pageType === "templateCreate" && currentSearchText) {
				pageContext.data.templateSearchTitle = currentSearchText;
			}
			$("#search-con input").attr('placeholder', '搜索文件/文件夹/文件链接');
			// 禁止左侧重复点击
			// if (pageContext.data.isLoading) return;

			$('#po-head-select .po-select-icons').hide();
			$('#po-head-select > span.icons_btn').show()

			pageContext.data.category = ''
			if (nav != 'import' && nav != 'openFile') {
				pageContext.data.pageType = nav
				$(".con-right").show()
				ipc.sendToHost('homeNav', nav)
			}



			pageContext.emptySearch()
			// 判断是否强制需要网络
			// if (!pcUtil.isOnline() && ["colla", "fav", "templateCreate"].indexOf(nav) >= 0) {
			// 	new Toast("needNetwork");
			// 	return;
			// }
			$('#btn_sync').show()
			if (nav === "templateCreate") {
				if (from == '') {
					pageContext.data.dirs = [{ id: "root", title: pageContext.data.pateTypeKeys['diagrams'] }];
				}
				pageContext.showTemplatePage()
				return
			}
			if (nav === 'aiCreate') {
				pageContext.showAICreatePage()
				return
			}
			$('#root').hide()
			$('#aiCreateIframe').hide()
			$(".con-right").show()
			$('.p-menu').show()
			ipc.sendToHost('closeAiCreateWebview')



			// if(obj.hasClass("active") || !nav) return;

			pageContext.data.ChartClass = false;
			pageContext.data.FolderClass = false;
			pageContext.data.pageCur = 1;
			pageContext.data.isLoadingMore = true
			pageContext.data.isLoadingMore = true
			pageContext.data.category = ''
			pageContext.data.filesObj = { charts: [], folders: [] };

			let config = pageContext.getConfig()
			if (config) {
				config = JSON.parse(config)
				if (config.diagrams_listType) pageContext.data.listType = config.diagrams_listType;
				if (config.diagrams_listSort) pageContext.data.listSort = config.diagrams_listSort;
				if (config.diagrams_listDesc) pageContext.data.listDesc = config.diagrams_listDesc;
				((config.diagrams_listSort || config.diagrams_listDesc) && nav == 'diagrams') && pageContext.renderListType()
				// if (config.diagrams_category) {
				// 	pageContext.data.category = config.diagrams_category;
				// 	let { icons } = pageContext.data;
				// 	// setTimeout(() => {
				// 	const $category = $("#select_by_menu");
				// 	$category.find(`li[data-category] span.icons`).html("");
				// 	$category.find(`li[data-category=${pageContext.data.category}] span.icons`).html(icons["list_sort"]);
				// 	$('#po-head-select > span.icons_btn').hide()
				// 	const val = $('#select_by_menu').find(`li[data-category=${pageContext.data.category}] span:last`).text()
				// 	$('#po-head-select > div.po-select-icons .po-select-icons__lebel').text(val)
				// 	$('#po-head-select > div.po-select-icons').css({ display: 'flex' }).show()
				// 	$("#select_by_menu").hide();
				// 	// }, 1000);
				// }
			}
			// pageContext.data.pageCount = 1;
			$(".file-list").html("");
			pageContext.renderDir("refresh").then(() => {
				// 在这里清空数据显示
				pageContext.loadFiles(true, nav).then(() => {
					pageContext.data.isLoadingMore = false
				})
			})

		});

		// "最近" slide 切换收起/展开
		$(".file-list").on("click", ".file-line-text", e => {
			let isShow = !$(e.currentTarget).find(".slide_icons").hasClass("up");
			let id = $(e.currentTarget).attr("data-id");

			if (isShow) {
				$(e.currentTarget).find(".slide_icons").addClass("up");
				$(".file-list-box[data-id=" + id + "]").slideUp(200);
			}
			else {
				$(e.currentTarget).find(".slide_icons").removeClass("up");
				$(".file-list-box[data-id=" + id + "]").slideDown(200);
			}
		});

		//点击同步操作
		$("#btn_sync").off("click").on("click", function () {
			pageContext.reloadHome()
		});

		//新建文件列表
		const isAICreateActive = function () {
			return $(".con-left .con-left-btn").find("[data-nav='aiCreate']").hasClass("active");
		};
		$(".create-btn-list div[data-btn]").off('click').on("click", function (e) {
			e.stopPropagation();
			$(".create-btn-list").removeClass("popover");
			$(".create-btn-list").css("visibility", "visible");
			ipc.sendToHost('hideCreateBtnListOverlay');
			var type = $(this).data("btn");
			let uk = UserOperation.getUk();
			if (uk == null) return;


			if (type === 'floder') {
				if (!pcUtil.isOnline()) {
					new Toast('needNetwork')
					return
				}
				if (isAICreateActive()) {
					ipc.sendToHost('showIndexCreateFolderDlg', getFolderDlgPayload());
					return
				}
				pageContext.createFolder();
				return
			}

			if (type === 'import') {
				if (isAICreateActive()) {
					ipc.sendToHost('showIndexImportDlg');
					return
				}
				pageContext.showImportDlg()
				// let suffix = 'vsd,xmind,txt,xlsx,xls,csv,vsdx,vstx,vsx,vtx,vssx,opml,mm,km'
				// ipc.invoke('getFilePath', { type: 'open', suffix: suffix }).then((res) => {
				// 	if (!navigator.onLine) {
				// 		pageContext.noOnLine()
				// 	}
				// 	else {
				// 		if (res != '') {
				// 			const title = res.substring(res.lastIndexOf('/') + 1, res.lastIndexOf('.'))
				// 			let category = 'mind'
				// 			if (res.endsWith('vsd') || res.endsWith('vsdx') || res.endsWith('vstx')
				// 				|| res.endsWith('vsx') || res.endsWith('vtx') || res.endsWith('vssx') || res.endsWith('vdx')
				// 				|| res.endsWith('eddx')) {
				// 				category = 'flow'
				// 			}
				// 			let chartType = pageContext.getChartType(category);
				// 			pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=${encodeURIComponent(res)}`, title: title });
				// 		}
				// 	}
				// })
				return
			}

			const btnName = $(this).find('.btnName').text()
			if (['flow', 'uml', 'er', 'swimlane', 'bpmn', 'venn', 'network'].includes(type)) { //打开流程图
				pageContext.createChart("flow", type, "首页左上角", btnName);
			} else if (type == 'outline') {//打开思维导图
				pageContext.createChart("outline", type, "首页左上角", btnName);
			} else if (type == 'markdown') {//打开思维导图
				pageContext.createChart("markdown", type, "首页左上角", btnName);
			} else {
				pageContext.createChart("mind", type, "首页左上角", btnName);
			}
		});

		// 新建文件夹
		// $("#file_create").off().on("click", function () {
		// 	pageContext.createFolder();
		// });

		// 新建按钮 - 展开新建列表
		const getCreateBtnListCssText = function () {
			if (pageContext._createBtnListCssText) return pageContext._createBtnListCssText;
			let cssText = ".create-btn-list.popover{display:block;position:absolute;} .create-btn-list{position:absolute;}";
			const hitSelectors = [".create-btn-list", ".createModel-", ".top-", ".temp-in", ".list-text", ".createFoloderBtn"];
			const resolveUrls = function (text, base) {
				if (!base) return text;
				return text.replace(/url\(["']?((?!data:|https?:|file:)[^"')]+)["']?\)/g, function (m, u) {
					try { return 'url("' + new URL(u.trim(), base).href + '")'; } catch (_e) { return m; }
				});
			};
			try {
				const sheets = Array.from(document.styleSheets || []);
				sheets.forEach((sheet) => {
					let rules = [];
					try {
						rules = Array.from(sheet.cssRules || []);
					} catch (_e) {
						return;
					}
					const base = sheet.href || document.baseURI || location.href;
					rules.forEach((rule) => {
						const selector = rule && rule.selectorText ? rule.selectorText : "";
						if (!selector) return;
						if (hitSelectors.some(item => selector.indexOf(item) > -1)) {
							cssText += "\n" + resolveUrls(rule.cssText, base);
						}
					});
				});
			} catch (_e) { }
			pageContext._createBtnListCssText = cssText;
			return cssText;
		};
		const getFolderDlgPayload = function () {
			let cssText = "";
			const hitSelectors = [
				"#dlg_new_folder", "#folder_new_title", "#btn_submit_folder",
				".close-block", ".close-btn", ".close-icons",
				".dlg-content", ".dlg-buttons", ".pro-btn",
				".input", ".dialog", ".dialog-close", ".window-mask"
			];
			try {
				const sheets = Array.from(document.styleSheets || []);
				sheets.forEach((sheet) => {
					let rules = [];
					try {
						rules = Array.from(sheet.cssRules || []);
					} catch (_e) {
						return;
					}
					rules.forEach((rule) => {
						const selector = rule && rule.selectorText ? rule.selectorText : "";
						if (!selector) return;
						if (hitSelectors.some(item => selector.indexOf(item) > -1)) {
							cssText += "\n" + rule.cssText;
						}
					});
				});
			} catch (_e) { }
			const dlg = $("#dlg_new_folder");
			return {
				html: dlg.html() || "",
				cssText: cssText,
				style: dlg.attr("style") || "width:350px;padding:24px 24px 24px 24px;",
				title: dlg.attr("title") || "新建文件夹"
			};
		};
		pageContext._hideAlert.hideNewMenu = function (e) {
			if (e && ($(e.target).parents("#new-file").length || $(e.target).attr("id") == "new-file")) return;
			$(document).off("click", pageContext._hideAlert.hideNewMenu);
			$(".create-btn-list").removeClass("popover");
			$(".create-btn-list").css("visibility", "visible");
			ipc.sendToHost('hideCreateBtnListOverlay');
		};
		$("#new-file").on("click", function (e) {
			var list = $(".create-btn-list"), that = $(this);
			list.css({
				top: that.offset().top + 38,
				left: that.offset().left
			}).addClass("popover");
			const menuEl = list[0];
			const rect = menuEl && menuEl.getBoundingClientRect ? menuEl.getBoundingClientRect() : null;
			if (rect) {
				ipc.sendToHost('showCreateBtnListOverlay', {
					left: rect.left,
					top: rect.top,
					width: rect.width,
					height: rect.height,
					html: menuEl.innerHTML,
					cssText: getCreateBtnListCssText()
				});
			}
			if (isAICreateActive()) {
				list.css("visibility", "hidden");
			}
			$(document).off("click", pageContext._hideAlert.hideNewMenu).on("click", pageContext._hideAlert.hideNewMenu);
		});

		$('#open-file').on("click", function (e) {
			let suffix = 'posf,posm,poso,pos,md'
			ipc.invoke('getFilePath', { type: 'open', suffix: suffix }).then((res) => {
				if (res != '') {
					const title = res.substring(res.lastIndexOf('/') + 1, res.lastIndexOf('.'))
					let category = 'mind'
					if (res.endsWith('posf') || res.endsWith('pos')) {
						category = 'flow'
					}
					if (res.endsWith('poso')) {
						category = 'outline'
					}
					if (res.endsWith('md')) {
						category = 'markdown'
					}
					let chartType = pageContext.getChartType(category);
					ipc.sendToHost('getTabChartIds')
					ipc.once("getTabChartIds_callback", (e, tabFileIds) => {
						let fileIds = tabFileIds.split(",");
						const has = fileIds.some(item => { return item === res })
						if (res && has) {
							ipc.sendToHost("selectTabByChartId", '', res)
							return
						} else {
							pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=${encodeURIComponent(res)}`, title: title });

						}

					})
				}
			})
			return
		})


		// 排序下拉点击
		$("#sort_by_menu").find("li").off().on("click", function (e) {
			// e.stopPropagation();
			let listSort = $(this).data("sort");
			let listDesc = $(this).data("desc");
			let changeSort, changeDesc
			if (listSort) {
				changeSort = pageContext.data.listSort != listSort
				if (changeSort) {
					$('#sort_by_menu li[data-desc]').css({
						'opacity': listSort == 'free' ? '0.5' : '1',
						'pointer-events': listSort == 'free' ? 'none' : 'initial'
					})
					pageContext.data.listSort = listSort;
					pageContext.setConfig('diagrams_listSort', listSort)
				}
			}
			if (listDesc) {
				changeDesc = pageContext.data.listDesc != listDesc
				if (changeDesc) {
					pageContext.data.listDesc = listDesc;
					pageContext.setConfig('diagrams_listDesc', listDesc)
				}
			}

			pageContext.data.totalFilesObj = { charts: [], folders: [] };
			if (changeSort || changeDesc) {
				$(".file-list").html("");
				pageContext.data.pageCur = 1
				pageContext.data.isLoadingMore = true
				pageContext.loadFiles(true).then(() => {
					pageContext.data.isLoadingMore = false
					pageContext.renderListType()
				});
				$("#sort_by_menu").hide();
			}
		});

		$('#po-head-select .po-select-close').off().on("click", function (e) {
			$('#po-head-select .po-select-icons').hide();
			$('#po-head-select > span.icons_btn').show()
			pageContext.data.category = ''
			pageContext.setConfig('diagrams_category', '')
			const $category = $("#select_by_menu");
			$category.find(`li[data-category] span.icons`).html("");
			$category.find(`li[data-category=${pageContext.data.category}] span.icons`).html(pageContext.data.icons["list_sort"]);
			pageContext.resetAndloadFiles(true);
		})

		// 筛选下拉点击
		$("#select_by_menu").find("li").off().on("click", function (e) {
			// e.stopPropagation();

			let category = $(this).data("category");
			if (pageContext.data.category != category) {
				let { icons } = pageContext.data;
				pageContext.data.category = category;
				pageContext.setConfig('diagrams_category', category)
				const $category = $("#select_by_menu");
				$category.find(`li[data-category] span.icons`).html("");
				$category.find(`li[data-category=${category}] span.icons`).html(icons["list_sort"]);
				$('#po-head-select > span.icons_btn').hide()
				const val = $(this).find('span:last').text()
				$('#po-head-select > div.po-select-icons .po-select-icons__lebel').text(val)
				$('#po-head-select > div.po-select-icons').css({ display: 'flex' }).show()
				pageContext.resetAndloadFiles(true);
				$("#select_by_menu").hide();
			}
		});

		//排序事件
		pageContext._hideAlert.hideSortBy = function (e) {
			if (e && ($(e.target).parents("#sort_by").length || $(e.target).attr("id") == "sort_by")) return;
			$(document).off("click", pageContext._hideAlert.hideSortBy);
			$("#sort_by_menu").hide();
		};
		pageContext._hideAlert.hideSelectBy = function (e) {
			if (e && ($(e.target).parents("#select_by_menu").length || $(e.target).attr("id") == "select_by_menu") || $(e.target).is('.po-select-icons__lebel')) return;
			$(document).off("click", pageContext._hideAlert.hideSelectBy);
			$("#select_by_menu").hide();
		};
		$(document).off("click", "#sort_by").on("click", "#sort_by", function () {
			$("#sort_by_menu").show();
			$(document).off("click", pageContext._hideAlert.hideSortBy).on("click", pageContext._hideAlert.hideSortBy);
		});

		// 筛选
		$(document).off("click", "#po-head-select").on("click", "#po-head-select", function () {

			const { data: { pageType, category, icons } } = pageContext
			if (pageType == "history") {
				$("#select_by_menu").css({ right: "33px" })
			} else {
				$("#select_by_menu").css({ right: "102px" })
			}
			const $category = $("#select_by_menu");
			$category.find(`li[data-category] span.icons`).html("");
			$category.find(`li[data-category=${category}] span.icons`).html(icons["list_sort"]);
			$category.show();
			$(document).off("click", pageContext._hideAlert.hideSelectBy).on("click", pageContext._hideAlert.hideSelectBy);
		});

		//清空回收站
		$("#clear_trash").off().on("click", function (e) {
			let { user } = pageContext.data;
			$.confirm({
				content: "您将要清空回收站内所有文件，清空后文件无法恢复！<br><br>是否继续？",
				onConfirm: function () {
					let delete_toast = new Toast("operation", $(".con-right"));
					let trashEnd = () => {
						pageContext.resetAndloadFiles();
						delete_toast.closeAll();
						new Toast({ type: "success", msg: "回收站已清空", $con: $(".con-right") });
					};
					ServerUtil.deletedFiles({ fileType: 'all' }, () => {
						trashEnd()
					})


				}
			});
		});


		pageContext._hideAlert.hideHelpBtn = function (e) {
			if (e && $(e.target).parents("#help").length) return;
			$(document).off("click", pageContext._hideAlert.hideHelpBtn);
			$("#help .help_shade").hide();
		};
		$(document).off("click", ".help_btn").on("click", ".help_btn", function () {
			$("#help .help_shade").show();

			$(document).off("click", pageContext._hideAlert.hideHelpBtn).on("click", pageContext._hideAlert.hideHelpBtn);
		});

		// 帮助列表
		$("#help .help_item").off().on("click", function (e) {
			let type = $(this).attr("data-type");
			if (!navigator.onLine) {
				new Toast('needNetwork')
				return
			}
			switch (type) {
				// 	帮助中心
				case "help":
					shell.openExternal(
						`${ipc.sendSync("getGlobal", "host")}/support`
					)
					// pcUtil.openWin({ url: "supportcenter.html", title: "帮助中心" });
					// pcUtil.openWin({ url: "/support", title: "帮助中心", type: "url" });
					break;
				//	服务条款
				case "clause":
					// pcUtil.openWin({ url: "supportcenter.html", title: "帮助中心" });
					pcUtil.openWin({ url: "/tos", title: "服务条款", type: "url" });
					break;
				//	用户反馈
				case "feedback":
					pageContext.feedback.init();
					break;
				//	在线客服
				case "service":
					shell.openExternal("https://kefu.easemob.com/webim/im.html?configId=4a1146cf-e7d9-4dea-98bd-921192252b7c");
					break;
				//	快捷键说明
				case "keys":
					$('#keyDescription').addClass('key-description-show')
					$('#keyDescriptionClose').off('click').on('click', function (e) {
						$('#keyDescription').removeClass('key-description-show')
					})
					break;
			}
			$("#help .help_shade").hide();
		});


		// 点击设置
		// $(".icon_btn.set").off().on("click", function (e) {
		// 	pageContext.setAlert();
		// });

		// 打开个人弹窗
		// $("#user-logo img").off().on("click", function(e){
		// 	$("#user-logo").find(".shade_box").show();
		// 	// pageContext.alertCon(() => $("#user-logo").find(".shade_box").hide());
		// 	setTimeout(() => { $(window).one('click', () => $("#user-logo").find(".shade_box").hide())}, 300);
		// });
		pageContext._hideAlert.hideUserShade = function (e) {
			if (e && $(e.target).parents("#user-logo").length) return;
			$(document).off("click", pageContext._hideAlert.hideUserShade);
			$("#user-logo").find(".shade_box").hide();
		};
		$(document).off("click", "#user-logo img").on("click", "#user-logo img", function () {
			$("#user-logo").find(".shade_box").show();

			$(document).off("click", pageContext._hideAlert.hideUserShade).on("click", pageContext._hideAlert.hideUserShade);
		});

		// 升级会员
		$(".con-left-num .file_num_updata").off().on("click", function () {
			// ipc.send('openPopup')
			window.poCollect('展示支付弹窗', { '触发位置': '首页左下角升级按钮' })
			pageContext.files.showPayWin({ pay_position: `entrance-leftBottom` })
		});

		$(".p-menu-left .logo_user_member span:last-child").off().on("click", function () {
			// ipc.send('openPopup')
			window.poCollect('展示支付弹窗', { '触发位置': '首页左上角升级按钮' })
			pageContext.files.showPayWin({ pay_position: `entrance-leftToplogo` })
		});

		//从模板中新建
		$(".temp-in").off('click').on('click', function (e) {
			e.stopPropagation();
			var category = $(this).parent().data('category');
			//设置Session Storage
			sessionStorage.setItem("navigationType", "my");
			sessionStorage.setItem("navigationValue", "");
			sessionStorage.setItem('ur_resource', 'diagram_new_tem');
			pageContext.newFile("/operation/new?category=" + category);
		});

		// 打开模板页
		$("#template, .toTemplate").off().on("click", e => {
			if (isMasSubmissionLite(CONFIG)) {
				masUnsupportedToast(Toast)
				return
			}
			var url = `/diagrams/new#template`;
			pcUtil.openWin({ url, title: "模板社区", type: 'url' });
		});

		if (isMasSubmissionLite(CONFIG)) {
			$('.con-left-btn a[data-nav=aiCreate], .con-left-btn a[data-nav=templateCreate]').hide()
			$('#template, .toTemplate').hide()
		}

		// 显示/隐藏 search cancel icon
		let showSearchCancel = () => $("#search-con .icon_cancel_search").show();
		let hideSearchCancel = () => $("#search-con .icon_cancel_search").hide();
		//搜索
		let search = function (e) {
			var input = $(e.target).parent().find("input");
			pageContext.data.searchTitle = pcUtil.filterXss(input.val().trim());
			if (pageContext.data.pageType === "templateCreate") {
				pageContext.data.templateSearchTitle = pageContext.data.searchTitle;
			}
			pageContext.fileSearch();
		};
		// $("#search-con>span").on("click",()=>{
		// 	search()
		// } );
		$("#search-con").children("input").on("click", function (e) {
			e.stopPropagation();
		});
		$("#search-con").children("input").on("keyup", function (e) {
			if (e.keyCode == 13) search(e);
		});

		// 搜索框输入
		$("#search-con")
			.children("input")
			.on("input", function (e) {
				if ($("#search-con input").val() && $("#search-con input").val().length) {
					showSearchCancel();
				} else {
					hideSearchCancel();
					console.log("hideSearchCancel");
					pageContext.data.searchTitle = "";
					pageContext.data.templateSearchTitle = "";
					if (pageContext.data.pageType == 'templateCreate') {
						pageContext.resetAndloadFiles();
						pageContext.emptySearch();
						window.VueRoot = null
						window.VueApp.unmount()
						pageContext.showTemplatePage()
					}
					else {
						pageContext.resetAndloadFiles();
						pageContext.emptySearch();
					}
				}

				// if (pageContext.data.pageType != 'templateCreate') {
				// 	search(e);
				// }
			});

		// 搜索收入框切换焦点
		$("#search-con").children("input").on("focus", function (e) {
			if ($("#search-con input").val() && $("#search-con input").val().length) showSearchCancel();
		});
		$("#search-con").children("input").on("blur", function (e) {
			if (!$("#search-con input").val() || !$("#search-con input").val()) hideSearchCancel();
		});

		// 清空搜索内容
		$("#search-con .icon_cancel_search").off('click').on("click", e => {
			pageContext.data.searchTitle = "";
			pageContext.data.templateSearchTitle = "";
			if (pageContext.data.pageType == 'templateCreate') {
				pageContext.resetAndloadFiles();
				pageContext.emptySearch();
				window.VueRoot = null
				window.VueApp.unmount()
				pageContext.showTemplatePage()
			}
			else {
				pageContext.resetAndloadFiles();
				pageContext.emptySearch();
			}
		})

		// 监听窗口大小改变
		$(window).on('resize', function () {
			let { ChartClass, FolderClass } = pageContext.data;
			ChartClass && ChartClass.resize();
			FolderClass && FolderClass.resize();

			pageContext.initCss();
		});




		ipc.on('localUpload_callback', (e, res) => {
			const fileId = res.data.id
			const $chart = $(`.file-list .list-item[id=${fileId}]`)
			const $Icon = $chart.find('.uploadStatus')
			const $Col = $Icon.parent()
			const loadingIcon = {
				"success": "./src/assets/images/home/success.png",
				"loading": "./src/assets/images/home/loading.png",
				"fail": "./src/assets/images/home/fail.png"
			}
			const failTip = $(`
					<div class="failTip-Warp">
						<div class="failTip-triangle"></div>
						<div class="failTip-msg">上传失败</div>
					</div>
				`)

			if (res.code == '200') {
				Toast && new Toast({ type: "success", msg: `文件上传成功`, $con: $(".con-right") });
				window.poCollect('保存文件', { '保存方式': '手动选择云保存' })
				const curUploadingFileIds = pageContext.getUploadingFileIds();
				// 删除当前文件的加载中的状态
				console.log('curUploadingFileIds', curUploadingFileIds)
				if (curUploadingFileIds.includes(fileId)) {
					const newFilesIds = curUploadingFileIds.filter(f => f !== fileId);
					window.localStorage.setItem('uploadingFileIds', JSON.stringify(newFilesIds));
				}

				pageContext.data.pageCur = 1;
				pageContext.data.isLoadingMore = true
				pageContext.data.filesObj = { charts: [], folders: [] };
				// pageContext.data.pageCount = 1;
				$(".file-list").html("");

				pageContext.loadFiles(false).then(() => {
					// 恢复没有上传完的文件的加载中的状态
					pageContext.data.isLoadingMore = false
					const curUploadingFileIds = pageContext.getUploadingFileIds();
					curUploadingFileIds.map(c => {
						const $curChart = $(`.file-list .list-item[id=${c}]`)
						if ($curChart) {
							$curChart.find('.uploadStatus').css({ backgroundImage: `url(${loadingIcon['loading']})` }).addClass('rotating-element').show()
						}
					})
				})
			} else {
				Toast && new Toast({ type: "error", msg: `文件上传失败`, $con: $(".con-right") });
				const curUploadingFileIds = pageContext.getUploadingFileIds();
				const newFilesIds = curUploadingFileIds.filter(f => f !== fileId);
				window.localStorage.setItem('uploadingFileIds', JSON.stringify(newFilesIds));
				var targetPosition = $Icon.offset();
				$Icon.css({ backgroundImage: `url(${loadingIcon['fail']})`, cursor: 'pointer' })
					.removeClass('rotating-element')
					.hover(() => {
						$Col.append(failTip)
						$('.failTip-Warp').css({
							left: targetPosition.left + 18,
							top: targetPosition.top - 9
						});
					}, () => {
						$Col.find('.failTip-Warp').remove()
					})
			}
		})

		window.addEventListener('message', (ev) => {
			console.log(ev)
			// 是ai嵌套页面返回
			if (ev.origin != window.host) {
				return;
			}
			const eventData = ev.data
			const indexString = 'po_ai_create'
			if (typeof eventData !== 'string' || !eventData.startsWith(indexString)) return;
			try {
				const data = JSON.parse(eventData.slice(indexString.length));
				const msgType = data.msgType;
				const msgData = data.msgData
				switch (msgType) {
					// 打开编辑器
					case 'toEdit': {
						const chartId = msgData.substring(msgData.lastIndexOf('/') + 1)
						let chartType = msgData.indexOf('flow') > -1 ? pageContext.getChartType('flow') : pageContext.getChartType('mind')
						pcUtil.openWin({ url: chartType.url + `?token=token&chartId=${chartId}&dbId=`, title: '未命名文件' });
					}
					// 复制为图片
					case 'exportFile': {
						pageContext.copyBase64ImageToClipboard(msgData)
					}
				}
			}
			catch {

			}
		})
	},
	createFolderByTitle: function (title = '') {
		let { dirs, pageType } = pageContext.data;
		var folderTitle = pcUtil.filterXss($.trim(title));
		if (!folderTitle || folderTitle.length > 40) return;
		let parentId = dirs[dirs.length - 1].id;
		if (pageType == "colla") parentId = "root";
		FileDatabase.newFolder(parentId, folderTitle, folder => {
			pageContext.data.dirs = pageContext.data.pageType == 'diagrams' ? pageContext.data.dirs : [{ id: "root", title: pageContext.data.pateTypeKeys['diagrams'] }]
			pageContext.data.pageType = 'diagrams';
			pageContext.renderDir("push", { id: folder.folderId, title: folder.title })
				.then(() => {
					pageContext.resetAndloadFiles()
				});
		});
	},
	openImportFileFromHost: function (filePath = '') {
		if (!filePath) return;
		const title = filePath.substring(filePath.lastIndexOf('/') + 1, filePath.lastIndexOf('.'))
		let category = 'mind'
		if (filePath.endsWith('vsd') || filePath.endsWith('vsdx') || filePath.endsWith('vstx')
			|| filePath.endsWith('vsx') || filePath.endsWith('vtx') || filePath.endsWith('vssx') || filePath.endsWith('vdx')
			|| filePath.endsWith('eddx') || filePath.endsWith('posf') || filePath.endsWith('pos')) {
			category = 'flow'
		}
		if (filePath.endsWith('poso')) {
			category = 'outline'
		}
		if (filePath.endsWith('md')) {
			category = 'markdown'
		}
		let chartType = pageContext.getChartType(category);
		pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=${encodeURIComponent(filePath)}`, title: title });
	},
	importFileByPath: async function (filePath) {
		if (!filePath) return
		const normalPath = filePath.replace(/\\/g, '/')
		const fileName = normalPath.split('/').pop() || '文件'
		const res = await ipc.invoke('loadFileB64', { type: 'local', path: filePath })
		if (!res || res.code !== 200 || !res.data) return
		const binary = atob(res.data)
		const bytes = new Uint8Array(binary.length)
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
		const blob = new Blob([bytes])
		const file = new File([blob], fileName)
		try { Object.defineProperty(file, 'path', { value: filePath }) } catch (_e) { }
		if (!window.VueImportApp) window.VueImportApp = { unmount: () => { } }
		Import.loadFile(file)
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
								$(".file-list:first").html("");
								pageContext.resetAndloadFiles(true, pageContext.data.pageType)
							})
							.catch(() => {
							});
					})
					.catch(() => {
					});
			}
			else {
				if (pageType === 'colla') {
					if (!pcUtil.isOnline()) {
						new Toast('needNetwork')
						return
					}
					const target = $('#dir_box').find('div.active')
					const isWithMe = $(target).attr('id') == 'colla_my' ? 0 : 1; //1 与我协作 0 我的协作
					pageContext.data.pageCur = 1;
					pageContext.data.isLoadingMore = true
					pageContext.data.filesObj = { charts: [], folders: [] };
					$(".file-list").html("");
					if (isWithMe) {
						pageContext.data.dirs.push({ id: folderId, title: folderTitle })
						pageContext.loadFiles(false).then(() => {
							pageContext.data.isLoadingMore = false
						})
					} else {
						pageContext.renderDir("location", { id: folderId })
							.then(() => {
								pageContext.loadFiles(true).then(() => {
									pageContext.data.isLoadingMore = false
								})
							});
					}
					return
				}
				pageContext.renderDir("push", { id: folderId, title: folderTitle })
					.then(() => {
						// $(".file-list:first").html("");
						pageContext.resetAndloadFiles(true, pageType)
					});
			}
		});
		// 文件夹-下拉框点击事件
		FolderClass && FolderClass.on('menuClick', (tit, folderId, folder) => {
			switch (tit) {
				case "location":
					pageContext.renderDir("location", { id: folder.id })
						.then(() => {
							pageContext.resetAndloadFiles()
						});
					break;
				case "del":
				case "delete":
				case "restore":
				case "copy":
				case "unfav":
				case "uncolla":
					pageContext.resetAndloadFiles();
					break;
			}
		});

		// 文件-下拉框点击事件
		ChartClass && ChartClass.on('menuClick', (tit, chartId, chart, $chart) => {
			const filePath = $chart.attr('data-filepath')
			const isMyFile = chartId.length <= 13;
			switch (tit) {
				case "localUpload":
					if (!pcUtil.isOnline()) {
						new Toast('needNetwork')
						return
					}
					ipc.invoke('loadFileB64', { type: 'local', path: filePath }).then((result) => {
						const data = result
						if (data.code == 200) {
							FileDatabase.hasFileNum(false).then((res) => {
								const $Icon = $chart.find('.uploadStatus')
								const loadingIcon = {
									"loading": "./src/assets/images/home/loading.png"
								}
								//如果有不让在上传了
								if (pageContext.getUploadingFileIds().includes(chartId)) {
									return
								}
							if(filePath.endsWith('md')){
								const curFildIds = pageContext.getUploadingFileIds()
								curFildIds.push(chartId)
								window.localStorage.setItem('uploadingFileIds', JSON.stringify(curFildIds));
								$Icon.css({ backgroundImage: `url(${loadingIcon['loading']})` }).addClass('rotating-element').show()

								const $Col = $Icon.parent()
								const fileName = filePath.split('/').pop().replace(/\.md$/i, '')
								const def = decodeURIComponent(escape(atob(data.data)))

								const onMdUploadDone = (success) => {
									const curUploadingFileIds = pageContext.getUploadingFileIds();
									const newFilesIds = curUploadingFileIds.filter(f => f !== chartId);
									window.localStorage.setItem('uploadingFileIds', JSON.stringify(newFilesIds));
									if (success) {
										Toast && new Toast({ type: "success", msg: `文件上传成功`, $con: $(".con-right") });
										window.poCollect('保存文件', { '保存方式': '手动选择云保存' })
										pageContext.data.pageCur = 1;
										pageContext.data.isLoadingMore = true
										pageContext.data.filesObj = { charts: [], folders: [] };
										$(".file-list").html("");
										pageContext.loadFiles(false).then(() => {
											pageContext.data.isLoadingMore = false
											const ids = pageContext.getUploadingFileIds();
											ids.map(c => {
												const $c = $(`.file-list .list-item[id=${c}]`)
												if ($c) {
													$c.find('.uploadStatus').css({ backgroundImage: `url(${loadingIcon['loading']})` }).addClass('rotating-element').show()
												}
											})
										})
									} else {
										Toast && new Toast({ type: "error", msg: `文件上传失败`, $con: $(".con-right") });
										var targetPosition = $Icon.offset();
										const failTip = $(`
											<div class="failTip-Warp">
												<div class="failTip-triangle"></div>
												<div class="failTip-msg">上传失败</div>
											</div>
										`)
										$Icon.css({ backgroundImage: `url(./src/assets/images/home/fail.png)`, cursor: 'pointer' })
											.removeClass('rotating-element')
											.hover(() => {
												$Col.append(failTip)
												$('.failTip-Warp').css({
													left: targetPosition.left + 18,
													top: targetPosition.top - 9
												});
											}, () => {
												$Col.find('.failTip-Warp').remove()
											})
									}
								}

								if (def == '') {
									ServerUtil.createChart({ folderId: 'root', category: 'markdown' },
										(cdata) => {
											var newChartId = cdata.data.chart.chartId
											$.ajax({
												url: host + '/api/personal/chart/rename',
												type: 'post',
												data: { title: fileName, ignore: 'title', chartId: newChartId },
												success: function (res2) {
													onMdUploadDone(true)
												},
												error: function () {
													onMdUploadDone(false)
												}
											})
										})
								}
								else {
									const blob = new Blob([def], { type: 'text/json' });
									var file = new File([blob], fileName+'.md')
									var folderId = 'root'
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
											onMdUploadDone(true)
										},
										error: function (res) {
											onMdUploadDone(false)
										}
									});
								}
								return
							}
							
								ipc.send('localUpload', chartId)
								const curFildIds = pageContext.getUploadingFileIds()
								curFildIds.push(chartId)
								window.localStorage.setItem('uploadingFileIds', JSON.stringify(curFildIds));
								$Icon.css({ backgroundImage: `url(${loadingIcon['loading']})` }).addClass('rotating-element').show()
							})
								.catch(() => {
									pageContext.files.showPayWin({ pay_position: `space-file-ins` })
								})
						}
						else {
							pageContext.confirmDelete()
						}
					});


					break;
				case "location":
					if (isMyFile) {
						ipc.invoke('loadFileB64', { type: 'local', path: filePath }).then((result) => {
							const data = result
							if (data.code == 200) {
								ipc.send('openFileDir', $($chart).data('filepath'))
							}
							else {
								pageContext.confirmDelete()
							}
						});
					} else {
						if (!pcUtil.isOnline()) {
							new Toast('needNetwork')
							return
						}
						pageContext.renderDir("location", { id: chart.folderId }).then(() => {
							pageContext.resetAndloadFiles()
						}
						);
					}
					break;
				case "restore":
				case "copy":
				case "clone":
					pageContext.resetAndloadFiles();
					break;

				case "uncolla":
				case "unfav":
					pageContext.resetAndloadFiles();
					break;
				case "del":
				case "delete":
					pageContext.resetAndloadFiles();
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
	// 检验登录
	verifyLogin: function () {
		let uk = UserOperation.getUk();
		if (!uk) {
			pageContext.globalWs.send["logout"]();
			return;
		}
	},
	getUserActivityTime: function () {
		if (!pcUtil.isOnline()) return;
		pcUtil.ajax({
			url: '/api/personal/user/get/tmp/user/activity/time',
			type: 'get',
			data: {},
			success: function () { },
			error: function (e) {
				console.error('用户活跃接口调用异常', e);
			}
		});
	},
	applyLocateHighlight: function (chartId) {
		$('.file-list .is-locate, .file-list .is-locate-pulse').removeClass('is-locate is-locate-pulse')
		const $el = $(`.file-list [tp=chart][id="${chartId}"]`)
		if (!$el.length) return false
		$el.addClass('is-locate is-locate-pulse')
		const el = $el[0]
		if (el && typeof el.scrollIntoView === 'function') {
			el.scrollIntoView({ block: 'center', inline: 'nearest' })
		}
		if (pageContext.data.locateTimer) clearTimeout(pageContext.data.locateTimer)
		pageContext.data.locateTimer = setTimeout(() => {
			$el.removeClass('is-locate-pulse')
			pageContext.data.locateTimer = null
		}, 5000)
		return true
	},
	loadMoreUntilLocateChart: function (chartId, retry) {
		retry = retry || 0
		setTimeout(() => {
			if (pageContext.applyLocateHighlight(chartId)) return
			const inData = [...(pageContext.data.totalFilesObj.charts || []), ...(pageContext.data.filesObj.charts || [])]
				.some(item => item && item.chartId === chartId)
			if (inData && retry < 12) {
				pageContext.loadMoreUntilLocateChart(chartId, retry + 1)
				return
			}
			if (retry < 8 && pageContext.data.pageCur < pageContext.data.pageCount) {
				pageContext.data.pageCur += 1
				pageContext.loadFiles(false, 'diagrams').then(() => {
					pageContext.loadMoreUntilLocateChart(chartId, retry + 1)
				})
				return
			}
			if (retry < 12) {
				pageContext.loadMoreUntilLocateChart(chartId, retry + 1)
			}
		}, 80)
	},
	locateChartById: function (chartId) {
		chartId = String(chartId || '').trim()
		$('#root').hide()
		$('#aiCreateIframe').hide()
		$('.con-right').show()
		$('.p-menu').show()
		if (typeof pageContext.emptySearch === 'function') pageContext.emptySearch()
		const goDiagrams = () => {
			const el = document.querySelector('.con-left .con-left-btn a[data-nav="diagrams"]')
			if (el) el.click()
		}
		if (!chartId) {
			goDiagrams()
			return
		}
		if (!pcUtil.isOnline()) {
			new Toast('needNetwork')
			goDiagrams()
			return
		}
		ServerUtil.getChartById(chartId, (chart) => {
			const folderId = chart && chart.folderId ? String(chart.folderId) : 'root'
			pageContext.data.pageType = 'diagrams'
			$('.con-left-btn a[data-nav].active').removeClass('active')
			$('.con-left-btn a[data-nav="diagrams"]').addClass('active')
			pageContext.renderDir('location', { id: folderId }).then(() => {
				pageContext.data.pageCur = 1
				pageContext.data.searchTitle = ''
				pageContext.data.isSearch = false
				pageContext.data.isLoadingMore = true
				pageContext.data.filesObj = { charts: [], folders: [] }
				pageContext.data.totalFilesObj = { charts: [], folders: [] }
				$('.file-list').html('')
				pageContext.loadFiles(true, 'diagrams').then(() => {
					pageContext.data.isLoadingMore = false
					pageContext.loadMoreUntilLocateChart(chartId)
				})
			})
		}, () => {
			goDiagrams()
		})
	},
	resetAndloadFiles: function (toast = false, pageType) {
		pageContext.data.pageCur = 1;
		pageContext.data.searchTitle = ''
		pageContext.data.isSearch = false
		$('#search-con input').val('')
		pageContext.data.isLoadingMore = true
		pageContext.data.filesObj = { charts: [], folders: [] };
		pageContext.data.totalFilesObj = { charts: [], folders: [] };
		$(".file-list").html("");
		$(".con-right").show()
		// 在这里清空数据显示
		pageContext.loadFiles(toast, pageType).then(() => {
			pageContext.data.isLoadingMore = false
		})
	},
	/**
	 * 加载文件列表
	 * @param {"是否显示 loading"} toast [true || [Toast]]
	 * @param {"页面类型"} pageType
	 * @returns {Promise<"渲染完成">}
	 */
	loadFiles: function (toast, pageType = pageContext.data.pageType) {
		interval.event['message'].callback();
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

					pageContext.data.totalFilesObj.charts = [...pageContext.data.totalFilesObj.charts, ...pageContext.data.filesObj.charts];
					pageContext.data.totalFilesObj.folders = [...pageContext.data.totalFilesObj.folders, ...pageContext.data.filesObj.folders];

					pageContext.data.isLoading = false;
					pageContext.updataFileNum();
					pageContext.filesMinToolCut();

					if (loadingToastTime) {
						clearTimeout(loadingToastTime);
						loadingToastTime = false;
					}

					toast && toast.closeAll();
					const testloadMore = () => {
						let { pageCur, pageCount } = pageContext.data;

						if (pageCur >= pageCount) return

						let hCon = $("#po-files-list").height();
						let scrollTop = $("#po-files-list")[0].scrollTop;
						let scrollHeight = $("#po-files-list")[0].scrollHeight;

						const needLoad = (hCon + scrollTop) >= (scrollHeight - 200) && navigator.onLine
						if (needLoad) {
							needLoadMore()
						}
					}
					const needLoadMore = () => {
						pageContext.data.isLoadingMore = true;
						pageContext.data.pageCur += 1;
						console.log("33333333")
						pageContext.loadMore($(".file-list"));
						console.log(`加载第${pageContext.data.pageCur}页`)
						pageContext.loadFiles(false, pageType).then(() => {
							pageContext.data.isLoadingMore = false;
							pageContext.loadMoreClose();
						});
					}

					// 检测第一页是否需要多次请求 大分辨率的情况
					testloadMore()
					if ($('.list-item.file-sel').length > 0) {
						$('.list-item').not('.file-sel').addClass('file-sel')
					}
					resolve();
				});
			};
			let getDataError = (status) => {
				pageContext.data.isLoading = false;

				if (loadingToastTime) {
					clearTimeout(loadingToastTime);
					loadingToastTime = false;
				}
				let $dom = $(HtmlStr["ajaxError"](status));
				$dom.off().on("click", "span", () => {
					pageContext.loadFiles(true, pageType).then(resolve).catch(reject);
				});

				$(".con-right .file-list").html($dom);
				toast && toast.closeAll();
				pageContext.fileListNull()
				reject();
			};
			if (pageType != 'diagrams') {
				pageContext.drag.clearEvent();
			}
			$('.null.null_file').remove()
			switch (pageType) {
				case "fav":
					const targetDom = $('#dir_box').find('div.active')
					const chartType = $(targetDom).attr('id') == 'fav_file' ? 'chart' : 'template';
					ServerUtil.getFavFiles(pageCur, pageSize, chartType, filesObj => {
						pageContext.data.filesObj = pageContext.filesToSort(filesObj, "favouriteTime");
						pageContext.data.pageCount = 0
						if (filesObj.pageInfo) {
							pageContext.data.pageCount = filesObj.pageInfo.pageCount;
						}
						getDataEnd();
					}, getDataError);
					break;
				case "colla":
					const target = $('#dir_box').find('div.active')
					const isWithMe = $(target).attr('id') == 'colla_my' ? 0 : 1; //1 与我协作 0 我的协作
					ServerUtil.getCollaborationFiles(dirLastObj.id, pageCur, 50, _filesObj => {
						// 过滤团队和白板
						_filesObj.charts = _filesObj.charts.filter(f => f.category !== 'board' && !f.orgId)
						_filesObj.folders = _filesObj.folders.filter(f => !f.orgId)
						pageContext.data.filesObj = _filesObj
						pageContext.data.filesObj = pageContext.filesToSort(pageContext.data.filesObj, "favouriteTime");
						// 子文件夹下返回数据不包含分页信息
						pageContext.data.pageCount = 0
						if (_filesObj.pageInfo) pageContext.data.pageCount = _filesObj.pageInfo.pageCount || 1;
						resolve()
						getDataEnd();
					}, getDataError, isWithMe);
					break;
				case "history":
					// 合并本地数据
					const { DataList = [] } = await pageContext.getHistoryData();
					console.log("本地数据:", DataList)

					if (!navigator.onLine) {
						toast && toast.closeAll();
						pageContext.data.filesObj = {
							charts: DataList
						}
						pageContext.data.filesObj = pageContext.filesToSort(pageContext.data.filesObj, "lastModify");
						console.log("没有网络的最近数据", pageContext.data.filesObj)
						resolve();
						getDataEnd();
						return
					}
					ServerUtil.loadHistory({ page: pageCur, pageSize, category }, res => {
						let data = res.data;
						if (res && res.code) {
							console.log("线上数据:", data.charts)
							if (pageCur === 1) {
								DataList.map(d => {
									if ((d.chartId && d.chartId.length <= 13) || d.type == 2) {
										if (category) {
											if (category == 'mind_free' && ['mind_org', 'fishbone', 'mind_tree', 'timeline', 'mind_right', 'mind', 'ishikawa'].includes(d.category)) {
												pageContext.data.filesObj.charts.push(d)
											} else {
												if (d.category == category) {
													pageContext.data.filesObj.charts.push(d)
												}
											}
										} else {
											pageContext.data.filesObj.charts.push(d)
										}
									}
								})
								pageContext.data.filesObj.charts = [...pageContext.data.filesObj.charts, ...data.charts]
								console.log("合并后排序数据", pageContext.data.filesObj)
							} else {
								pageContext.data.filesObj.charts = data.charts;
							}
							toast && toast.closeAll();
							pageContext.data.filesObj = pageContext.filesToSort(pageContext.data.filesObj, "lastModify");
							pageContext.data.pageCount = 0
							if (data.pageInfo) pageContext.data.pageCount = data.pageInfo.pageCount || 1;
						}
						getDataEnd();
					}, getDataError);

					break;
				case "diagrams":
					ServerUtil.loadFiles(dirLastObj.id || dirLastObj.folderId, category, pageContext.data.listSort, pageContext.data.listDesc, "", pageCur, pageSize, res => {
						let data = res.data;
						if (res && res.code) {
							toast && toast.closeAll();
							pageContext.data.filesObj.charts = data.charts
							pageContext.data.filesObj.folders = data.folders;
							// pageContext.data.filesObj = pageContext.filesToSort(pageContext.data.filesObj, pageContext.data.listSort);
							pageContext.data.pageCount = 0

							if (data.pageInfo) pageContext.data.pageCount = data.pageInfo.pageCount || 1;
							resolve();
						}
						if (data) {
							data.folders && data.folders.map((item) => {
								FileDatabase.saveFolderToDB({ id: item.folderId, ...item })
							})
						}
						getDataEnd();
					});
					break;
				case "trash":
					ServerUtil.getTrashFiles({ userId: UserOperation.getUk(), folderId: dirLastObj.id, page: pageCur, pageSize }, res => {
						let data = res.data;
						if (res && res.code) {
							toast && toast.closeAll();
							pageContext.data.filesObj = pageContext.filesToSort(data, "lastModify");
						}
						pageContext.data.pageCount = 0
						if (res.pageInfo) pageContext.data.pageCount = res.pageInfo.pageCount || 1;
						resolve();
						getDataEnd();
					}, () => {
						getDataEnd();
					});
					break;
			};
		}).catch(e => { });
	},
	// 构建文件列表, 分类中心
	renderList: function (pageType, callback = function () { }, isCover) {
		$('.po-nofiles').remove();
		let isAppend = isCover ? false : true;
		pageType = pageType || pageContext.data.pageType;
		switch (pageType) {
			case "history": // 最近
				pageContext._renderHistory(pageType, callback);
				break;
			case "diagrams": // 我的云文件
				pageContext._renderFiles(pageType, callback, true, true);
				break;
			case "fav": // 收藏
				pageContext._renderFiles(pageType, callback, isAppend);
				break;
			case "colla": // 协作
				pageContext._renderFiles(pageType, callback, isAppend);
				break;
			case "trash": // 回收站
				pageContext._renderFiles(pageType, callback, true, false);
				break;
		};

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
		let ChartClass = new ChartDom({ listType, $ChartsCon: $filesCon, pageType: pageType, isSearch: (searchTitle && searchTitle != ""), online, folderId: dirLastObj.id });
		let FolderClass = new FolderDom({ listType, $FoldersCon: $filesCon, pageType: pageType, isSearch: (searchTitle && searchTitle != ""), online, parentId: dirLastObj.id });

		pageContext.data.ChartClass = ChartClass;
		pageContext.data.FolderClass = FolderClass;

		// $filesCon.html('')

		// 阻止不符合最新类型的渲染进程
		if ($(".con-left-btn a.active").attr("data-nav") != pageType) {
			callback && callback();
			return;
		}
		if (!isAppend || (isAppend && pageCur == 1)) $filesCon.html("");

		if (listType == "list" && !$filesCon.find(".list-title").length &&
			((filesObj.folders && filesObj.folders.length) || (filesObj.charts && filesObj.charts.length))
		) {
			$filesCon.append(HtmlStr["fileListTitle"]("list"));
		}
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
		// 拖拽绑定
		if (isDrag && pageContext.data.pageType == 'diagrams') {
			pageContext.drag.initEvent();
		}

		callback && callback();
	},
	// 构建最近文件列表
	_renderHistory: function (pageType, callback = function () { }) {
		let { filesObj, listType } = pageContext.data;
		listType = 'list'
		let $filesCon = $(".file-list:first");
		let dates = { today: [], yestoday: [], week: [], lastWeek: [], mongth: [], lastMongth: [], longago: [] };
		let names = { today: "今天", yestoday: "昨天", week: "本周", lastWeek: "上周", mongth: "本月", lastMongth: "上个月", longago: "很久以前" };
		let td = new Date(pcUtil.getDate(0)), ysd = new Date(pcUtil.getDate(-1)),
			week = new Date(pcUtil.getPreviousMonday()), weekd = new Date(pcUtil.getPreviousMonday(7)),
			mongth = new Date(pcUtil.getPreviousMonth()), mongthd = new Date(pcUtil.getPreviousMonth(true));


		let isNull = true;
		let ChartClass = new ChartDom({ listType, $ChartsCon: $filesCon, pageType: pageType });
		pageContext.data.ChartClass = ChartClass;
		if (listType == "icon") {
			filesObj.charts.map(chart => {
				let lastModify = new Date(chart.lastModify);

				if (lastModify >= td) dates.today.push(chart);
				else if (lastModify >= ysd) dates.yestoday.push(chart);
				else if (lastModify >= week) dates.week.push(chart);
				else if (lastModify >= weekd) dates.lastWeek.push(chart);
				else if (lastModify >= mongth) dates.mongth.push(chart);
				else if (lastModify >= mongthd) dates.lastMongth.push(chart);
				else dates.longago.push(chart);
			});

			Object.keys(dates).map((k, i) => {
				let charts = dates[k];

				if (charts.length) {
					let $chartsFileLine = $(HtmlStr["history_slide"](i, names[k], charts.length, true));
					let $chartsBox = $(HtmlStr["history_box"](i, true));

					charts.map(chart => $chartsBox.append(ChartClass.createChart(chart)));

					$filesCon.append($chartsFileLine);
					$filesCon.append($chartsBox);

					ChartClass.resize();
					isNull = false;
				}
			});
			// ChartClass.hasShowThumbnail($filesCon);
		}
		else {
			if (listType == "list" && !$filesCon.find(".list-title").length) $filesCon.append(HtmlStr["fileListTitle"]("localList"));
			// 构建文件
			if (filesObj.charts && filesObj.charts.length) {
				isNull = false;
				if (listType == "icon" && !$filesCon.find(".file-list-title[data-name=文件]").length) $filesCon.append(HtmlStr["fileListTitle"](listType, "文件"));
				filesObj.charts.map(chart => { console.log(chart); $filesCon.append(ChartClass.createChart(chart)) });
				ChartClass.resize();
			}
		}

		if (isNull) pageContext.fileListNull();
		callback && callback();
	},
	// 构建搜索文件列表
	_renderSearch: function ($searchBody, filesObj, searchType, callback = function () { }) {
		let { listType, pageType } = pageContext.data;
		let isNull = true;
		let online = !!(searchType == "fav" || searchType == "colla");
		let ChartClass = new ChartDom({ listType, $ChartsCon: $searchBody, pageType: pageType, isSearch: true, online });
		let FolderClass = new FolderDom({ listType, $FoldersCon: $searchBody, pageType: pageType, isSearch: true, online });

		pageContext.data.ChartClass = ChartClass;
		pageContext.data.FolderClass = FolderClass;

		$searchBody.html("");
		// 构建文件夹
		if (filesObj.folders && filesObj.folders.length) {
			isNull = false;
			$searchBody.append(HtmlStr["fileListTitle"](listType, "文件夹"));
			filesObj.folders.map(folder => $searchBody.append(FolderClass.createFolder(folder, listType)));
			FolderClass.resize();
		}
		// 构建文件
		if (filesObj.charts && filesObj.charts.length) {
			isNull = false;
			if (listType == "icon") $searchBody.append(HtmlStr["fileListTitle"](listType, "文件"));
			filesObj.charts.map(chart => $searchBody.append(ChartClass.createChart(chart)));
			// ChartClass.hasShowThumbnail($(".file-list"));
			ChartClass.resize();
		}
		// 空文件处理
		if (isNull) {
			pageContext.fileListNull($searchBody, "search");
		} else {
			$('.null_file').remove()
		}

		// 绑定 class 事件
		pageContext.bindClassEvent();
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

					if (pageType == 'colla' || pageType == 'fav') {
						$(this).addClass("active").css({ color: "#212930" }).siblings().removeClass("active").css({ color: "#9aa5b8" });
					}
					let folderId = $(this).attr("data-f-id");
					pageContext.renderDir("skip", { id: folderId });
				});

				$dirBox.html("");

				dirs.map((dir, index) => {
					$dirBox.append(HtmlStr["dir"](dir, dir.notIcon, dirs, index));
				});
				if (pageType !== 'colla' && pageType !== 'fav') {
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
					pageContext.data.pageCur = 1;
					pageContext.data.isLoadingMore = true
					pageContext.data.filesObj = { charts: [], folders: [] };
					// pageContext.data.pageCount = 1;
					$(".file-list").html("");
					pageContext.loadFiles(true).then(() => {
						pageContext.data.isLoadingMore = false
					})
					if (pageType !== 'colla' && pageType !== 'fav') {
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
						const { pageCur, pageSize } = pageContext.data
						ServerUtil.getFloderAndfiles({ folderId: dirObj.id, pageCur, pageSize }, res => {
							if (res) {
								const { dir = [] } = res
								let sortFolder = pcUtil.arrFlashback(dir);
								pageContext.data.dirs = [{ id: "root", title: pateTypeKeys['diagrams'] }, ...sortFolder];
								dirEnd();
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
					// pageContext.data.dirs = [
					// 	// {id: "root", title: pateTypeKeys[pageType]},
					// 	{id: "search", title: `搜索 “${searchTitle}”`}
					// ];
					// dirEnd();
					dirEnd([{ id: "search", title: `搜索 “${searchTitle}”`, notIcon: true }]);
					break;
				// 导航取消搜索模式
				case "unSearch":
					// pageContext.data.dirs = [{id: "root", title: pateTypeKeys[pageType]}];
					dirEnd();
					break;
			}
		});
	},
	// 文件列表为空状态
	fileListNull: function ($filesCon = $(".po-files-list"), searchType) {
		let { pageType } = pageContext.data;
		let type = searchType || pageType;
		let $null = !pcUtil.isOnline() && type != 'history' ? $(HtmlStr["noOnline"](type)) : $(HtmlStr["null"](type));

		$filesCon.append($null);
		$('.po-nofiles-create-list .nofiles-item').off().on('click', function (e) {
			e.stopPropagation();
			// if (!pcUtil.isOnline()) {
			// 	new Toast({ type: "error", msg: "服务异常请重试" });
			// 	return
			// }
			var type = $(this).data("btn");
			if (["flow", "mind_free", "outline", "markdown"].includes(type)) {
				const auto_upload = localStorage.getItem('auto_upload')
				if (auto_upload && auto_upload == '1') {
					FileDatabase.hasFileNum(false).then(() => {
						const folderId = pageContext.data.dirs[pageContext.data.dirs.length - 1].id
						const chartType = pageContext.getChartType(type)
						if (pcUtil.isOnline()) {
							ServerUtil.createChart(
								{ folderId, category: type },
								(data) => {
									pcUtil.openWin({ url: chartType.url + `?token=token&chartId=${data.data.chart.chartId}&dbId=`, title: data.data.chart.title });
								},
								() => {
									new Toast({ type: "error", msg: "服务异常请重试" });
								})
						}
						else {
							pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=&new=true&isUpload=true&folderId=${folderId}`, title: '未命名文件' });
						}
						pageContext.data.isLoading = false
					}).catch(err => {
						const pay_position = `newfile-${category}-ins`
						ipc.sendToHost('upgradeDlg', { dlgType: 1, type, category, pay_position })
						pageContext.data.isLoading = false
					});
				}
				else {
					const chartType = pageContext.getChartType(type)
					pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=&new=true`, title: '未命名文件' });
				}
			} else if (type == 'floder') {
				pageContext.createFolder();
			} else if (type == 'import') {
				let suffix = 'vsd,xmind,txt,xlxs,xls,csv,vsdx,vstx,vsx,vtx,vssx,opml,mm,km'
				ipc.invoke('getFilePath', { type: 'open', suffix: suffix }).then((res) => {
					if (!navigator.onLine) {
						pageContext.noOnLine()
					}
					else {
						if (res != '') {
							const title = res.substring(res.lastIndexOf('/') + 1, res.lastIndexOf('.'))
							let category = 'mind'
							if (res.endsWith('vsd') || res.endsWith('vsdx') || res.endsWith('vstx')
								|| res.endsWith('vsx') || res.endsWith('vtx') || res.endsWith('vssx') || res.endsWith('vdx')
								|| res.endsWith('eddx')) {
								category = 'flow'
							}
							if (res.endsWith('md')) {
								category = 'markdown'
							}
							let chartType = pageContext.getChartType(category);
							pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=${encodeURIComponent(res)}`, title: title });
						}
					}
				})
			} else if (type == 'templateCreate') {
				if (isMasSubmissionLite(CONFIG)) {
					masUnsupportedToast(Toast)
					return
				}
				$('.con-left-btn a[data-nav=templateCreate]').trigger("click", ["fromTempCreate"])
				const folderId = pageContext.data.dirs[pageContext.data.dirs.length - 1].id
				window.localStorage.setItem('tempCreateDirId', folderId)
			}
		})
	},
	/**
	 * 新建文件
	 * @param {"新文件定义的类型"} type ["包含mind" | outline]
	 * @param {"文件详细类型"} category [flow | bpmn | venn | uml | evc | epc | org | ios | andriod | ui | network ]
	 */
	createChart: function (type, category, origin, originBtnName) {
		// if (pageContext.data.isLoading) return;
		// else pageContext.data.isLoading = true;

		let chartType = pageContext.getChartType(type);

		if (pcUtil.isOnline()) {
			FileDatabase.hasFileNum(false).then(() => {
				const auto_upload = localStorage.getItem('auto_upload')
				if (auto_upload && auto_upload == '1') {
					const curFloderId = pageContext.data.dirs[pageContext.data.dirs.length - 1]?.id
					ServerUtil.createChart({ folderId: curFloderId || 'root', category: category },
						(data) => {
							window.poCollect('保存文件', { '保存方式': '新建直接上云' })
							pcUtil.openWin({ url: chartType.url + `?token=token&chartId=${data.data.chart.chartId}&dbId=`, title: data.data.chart.title });
						},
						() => {
							createChart(type, category, origin, originBtnName)
						}, () => {
							new Toast({ type: "error", msg: "服务异常请重试" });
						})
				}
				else {
					pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=&type=${category}&new=true`, title: '未命名文件' });
				}
				pageContext.data.isLoading = false
			}).catch(err => {
				if (type == 'markdown') {
					const auto_upload = localStorage.getItem('auto_upload')
					if (auto_upload && auto_upload == '1') {
						const curFloderId = pageContext.data.dirs[pageContext.data.dirs.length - 1]?.id
						ServerUtil.createChart({ folderId: curFloderId || 'root', category: category },
							(data) => {
								pcUtil.openWin({ url: chartType.url + `?token=token&chartId=${data.data.chart.chartId}&dbId=`, title: data.data.chart.title });
							},
							() => {
								createChart(type, category, origin, originBtnName)
							}, () => {
								new Toast({ type: "error", msg: "服务异常请重试" });
							})
					}
					else {
						pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=&type=${category}&new=true`, title: '未命名文件' });
					}
					pageContext.data.isLoading = false
				}
				else {
					const pay_position = `newfile-${category}-ins`
					ipc.sendToHost('upgradeDlg', { dlgType: 1, type, category, pay_position })
					//todo 超过文件数量弹支付
					// pageContext.updataFileNum();
					pageContext.data.isLoading = false
				}
			});
		} else {
			FileDatabase.hasFileNum(false).then(() => {
				const auto_upload = localStorage.getItem('auto_upload')
				if (auto_upload && auto_upload == '1') {
					pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=&type=${category}&new=true&isUpload=true`, title: '未命名文件' });
				}
				else {
					pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=&type=${category}&new=true`, title: '未命名文件' });
				}
				pageContext.data.isLoading = false
			}).catch(err => {
				if (type == 'markdown') {
					const auto_upload = localStorage.getItem('auto_upload')
					if (auto_upload && auto_upload == '1') {
						pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=&type=${category}&new=true&isUpload=true`, title: '未命名文件' });
					}
					else {
						pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=&type=${category}&new=true`, title: '未命名文件' });
					}
					pageContext.data.isLoading = false
				}
				else {
					const pay_position = `newfile-${category}-ins`
					ipc.sendToHost('upgradeDlg', { dlgType: 1, type, category, pay_position })
					//todo 超过文件数量弹支付
					// pageContext.updataFileNum();
					pageContext.data.isLoading = false
				}
			});
		}

	},
	// 新建文件夹
	createFolder: function () {
		let { dirs, pageType } = pageContext.data;

		$("#folder_new_title").val("");
		$("#dlg_new_folder").attr("title", "新建文件夹");
		$("#dlg_new_folder").dialog();
		$("#folder_new_title").focus();

		$("#btn_submit_folder").off().on("mouseup", function () {
			if ($("#folder_new_title").attr("submitting")) {
				return; //如果正在提交，不进行提交，防止重复提交
			}
			var title = pcUtil.filterXss($.trim($("#folder_new_title").val()));
			if (!title) {
				$("#folder_new_title").focus();
				return;
			}
			if (title.length > 40) {
				$("#folder_new_title").select();
				return;
			}
			$("#folder_new_title").attr("submitting", "true"); //标识正常提交
			// 在协作中创建的文件夹，会创建在我的文件列表
			let parentId = dirs[dirs.length - 1].id;
			if (pageType == "colla") parentId = "root";
			FileDatabase.newFolder(parentId, title, folder => {
				$("#dlg_new_folder").dialog("close");
				$("#folder_new_title").removeAttr("submitting");
				pageContext.data.dirs = pageContext.data.pageType == 'diagrams' ? pageContext.data.dirs : [{ id: "root", title: pageContext.data.pateTypeKeys['diagrams'] }]
				pageContext.data.pageType = 'diagrams';
				pageContext.renderDir("push", { id: folder.folderId, title: folder.title })
					.then(() => {
						pageContext.resetAndloadFiles()
					});
			});
		});

		$("#folder_new_title").off("keyup").on("keyup", function (e) {
			if (e.keyCode == 13) {
				$("#btn_submit_folder").trigger("mouseup");
				return;
			}
			if ($.trim($(this).val()) != "") {
				$("#btn_submit_folder").attr("disabled", false);
			} else {
				$("#btn_submit_folder").attr("disabled", true);
			}
			if ($.trim($(this).val()).length > 60) {
				$(this).val($.trim($(this).val()).substring(0, 60));
			}
			e.stopPropagation();
		});
	},
	// file 根据搜索内容筛选
	fileSearch: function (isBlur, callback = function () { }) {
		pageContext.data.searchType = ""
		// if (pageContext.data.pageType != "templateCreate") pageContext.data.pageType = 'history'
		let { searchTitle, searchType, pageType } = pageContext.data;
		const searchUrlRegs = [
			`https://www.processon.com/outline/([^/]{24})`, 'https://www.processon.com/diagraming/([^/]{24})([^/]+)', 'https://www.processon.com/mindmap/([^/]{24})',
			'http://www.processon.com/outline/([^/]{24})', 'http://www.processon.com/diagraming/([^/]{24})', 'http://www.processon.com/mindmap/([^/]{24})',
			'https://www.processon.com/v/([^/]{24})', 'http://www.processon.com/v/([^/]{24})'
		]
		let isMatchs = false
		searchUrlRegs.forEach((d, i) => {
			const matchs = searchTitle.match(d)
			if (matchs) {
				isMatchs = true
				const chartId = matchs[1]
				if (pcUtil.isOnline()) {
					if (i >= 6) {
						ServerUtil.getChartByShare(chartId, (success) => {
							pcUtil.openWin({ url: searchTitle, title: success.collaboration.title });
						}, (error) => {
							new Toast({ type: "warning", msg: "找不到对应文件", $con: $(".con-right") });
						})
					}
					else {
						ServerUtil.getChartById(chartId, (success) => {
							let chartType = pageContext.getChartType(success.category);
							pcUtil.openWin({ url: chartType.url + `?token=token&chartId=${chartId}&dbId=`, title: success.title });
						}, (error) => {
							new Toast({ type: "warning", msg: "找不到对应文件", $con: $(".con-right") });
						})
					}
				}
				else {
					pageContext.noOnLine()
				}
			}
		})
		if (isMatchs) return
		if (searchTitle && searchTitle != "") {
			if (pageType === 'templateCreate') {
				if (!navigator.onLine) {
					new Toast("connectionless")
					return
				}
				pageContext.data.templateSearchTitle = searchTitle;
				window.VueRoot.searchingHide = true;
				window.VueRoot.showCategory = false
				window.VueRoot.searchTitle = searchTitle;
				window.VueRoot.fetchTemplate()
				// pcUtil.openWin({ url: `/template/search/${searchTitle}?from=template_create`, title: '模板社区', type: 'url' })
				return
			}


			let $filesCon = $(".file-list:first");
			let $searchCon = null;
			let $searchBody = null;
			let $searchTabs = null;

			let loadSearch = () => { };

			pageContext.data.isSearch = true;

			if (searchType != 'diagrams' && searchType != 'colla' && searchType != 'fav') pageContext.data.searchType = 'diagrams';

			pageContext.renderDir("search");
			pageContext.filesMinToolCut();

			$filesCon.html(HtmlStr["searchTab"](searchType));
			$searchCon = $filesCon.find(".searchBox");
			$searchTabs = $searchCon.find(".searchTabs");
			$searchBody = $searchCon.find(".searchBody");

			// if(pageType != 'diagrams' && pageType != 'colla' && pageType != 'fav') pageContext.data.pageType = 'diagrams';


			loadSearch = async (searchType = "") => {

				let toast = new Toast('loading', $('.file-list'));
				pageContext.data.listType = 'localList'
				if (!navigator.onLine) {
					const { DataList = [] } = await pageContext.getHistoryData();
					const localData = {
						charts: DataList.filter(c => c.title.includes(searchTitle)),
						folder: []
					}
					pageContext._renderSearch($searchBody, localData, searchType, () => {
						toast && toast.closeAll();
					});
					return
				}
				ServerUtil.searchGlobalFiles(searchTitle, "", searchType, false, async (res) => {
					let onlineFilesObj = res.data;
					if (searchType == "my" || searchType == "") {
						const { DataList = [] } = await pageContext.getHistoryData();

						onlineFilesObj.charts.push(...DataList.filter(c => c.title.includes(searchTitle) && c.type !== 4))
						console.log(onlineFilesObj.charts);
						//排除 org
						onlineFilesObj.charts = onlineFilesObj.charts.filter(c => !c.orgId)
					}
					pageContext._renderSearch($searchBody, onlineFilesObj, searchType, () => {
						toast && toast.closeAll();
					});
				}, () => new Toast("connectionless"));
			};

			loadSearch(searchType);
			$searchTabs.off().on('click', ".searchTab", function () {
				let searchType = $(this).attr("data-type");

				if (!pcUtil.isOnline() && ["colla", "fav"].indexOf(searchType) >= 0) {
					new Toast("connectionless");
					return;
				}

				// if (searchType == $(".searchTab.active").attr("data-type")) return;

				$(".searchTab.active").removeClass("active");
				$(this).addClass("active");

				loadSearch(searchType);
			});
		}
		else {
			if (pageType === 'templateCreate') {
				if (window.VueRoot) {
					pageContext.data.templateSearchTitle = "";
					window.VueRoot.showCategory = false
					window.VueRoot.fetchCategory()
					$("#search-con input").val(null).blur();
				}
			}
			else {
				pageContext.emptySearch(true, false, false);
			}
		}
	},
	// 清空搜索内容
	emptySearch: function (isToast, notLoadFiles, notBlur) {
		pageContext.data.searchTitle = "";
		pageContext.data.searchType = pageContext.data.pageType;
		pageContext.data.isSearch = false;
		// if (pageContext.data.pageType == "templateCreate" && window.VueRoot ) {
		// 	window.VueRoot.fetchCategory()
		// }
		if (!notBlur) $("#search-con input").val(null).blur();
		$("#search-con .icon_cancel_search").hide();

		pageContext.renderDir("unSearch").then(() => {
			if (notBlur) pageContext.resetAndloadFiles();
		});
	},
	// 打开导入文件
	associated: function (data) {
		let errFn = () => {
			new Toast({ type: "error", msg: "导入失败", cover: true, $con: $(".con-right") });
		};
		let endFn = chart => {
			if (!chart) errFn();
			else {
				pageContext.editChart(chart.chartId, chart.category, chart.title);
				pageContext.resetAndloadFiles(false, "diagrams");
			}
		};
		if (data && data.pos) FileDatabase.ExportChart(data.pos, "root", endFn);
		else errFn();
	},
	/* -end---------------------------------------------- 逻辑处理 --------------------------------------------- */

	/* -start-------------------------------------------- 弹窗相关 --------------------------------------------- */
	// "设置" 弹窗
	setAlert: function () {
		let { mouseDownVersionS, lastCloseSetALertTime, mouseDownInterval } = pageContext.data;

		Setting.getSetting(false, setting => {
			let alertClass = new Alert({ content: HtmlStr["setAlert"], title: "设置" });
			let $alert = alertClass.$alertBox;

			// 自动启动
			if (setting.basic.indexOf("auto_start") > -1) $alert.find("input#set_auto_start").attr("checked", true);
			else $alert.find("input#set_auto_start").attr("checked", false);
			// 自动更新
			if (setting.basic.indexOf("auto_update") > -1) $alert.find("input#set_auto_update").attr("checked", true);
			else $alert.find("input#set_auto_update").attr("checked", false);
			// 随系统自动切换
			if (setting.aspect == "follow_system") {
				$alert.find("input#set_follow_system").attr("checked", true);
				$alert.find(".aspect").addClass("disabled");
			}
			else {
				$alert.find("input#set_follow_system").attr("checked", false);
				$alert.find(".aspect.disabled").removeClass("disabled");

				if (setting.aspect == "light_color") $alert.find("input#set_light_color").attr("checked", true);
				else $alert.find("input#set_light_color").attr("checked", false);
				if (setting.aspect == "dark_color") $alert.find("input#set_dark_color").attr("checked", true);
				else $alert.find("input#set_dark_color").attr("checked", false);

				// 深色功能暂时禁用
				$alert.find("#set_dark_color").parents(".aspect").addClass("disabled");
				$alert.find("input#set_dark_color").attr("disabled", true);
			}
			// 语言
			$alert.find("[name=language]").val(setting.language);
			// 日期格式
			$alert.find("[name=date_format]").val(setting.date_format);
			// 文件输出
			$alert.find("[name=file_output]").attr("title", setting.file_output).val(setting.file_output.replace("undefined", ""));
			// 当前版本
			$alert.find(".versions span").text(ipc.sendSync('getGlobal', "versions"));
			// 是否已下载，等待重启
			if (setting.awaitRestart) {
				$alert.find(".software_item[data-t=version_updating] .button.checkUpdate").addClass("hide");
				$alert.find(".software_item[data-t=version_updating] .button.awaitRestart").removeClass("hide");
			}
			else {
				$alert.find(".software_item[data-t=version_updating] .button.checkUpdate").removeClass("hide");
				$alert.find(".software_item[data-t=version_updating] .button.awaitRestart").addClass("hide");
			}

			// 修改基本设置
			$alert.find("[name=basic]").off().on("change", function (e) {
				let basic = [];
				$.each($alert.find("[name=basic]:checked"), function () {
					basic.push($(this).val());
				});

				if (basic.indexOf("auto_start") > -1) ipc.send("auto_start");
				else ipc.send("un_auto_start");

				Setting.updateSetting({ basic });
			});
			// 修改外观
			$alert.find("[name=aspect_follow_system]").off().on("change", function (e) {
				let aspect = $alert.find("[name=aspect_follow_system]:checked").val();
				Setting.updateSetting({ aspect });
			});
			$alert.find("[name=aspect]").off().on("change", function (e) {
				let aspect = $alert.find("[name=aspect]:checked").val();
				Setting.updateSetting({ aspect });
			});
			// 修改语言
			$alert.find("[name=language]").off().on("change", function (e) {
				let language = $alert.find("[name=language]").val();
				Setting.updateSetting({ language });
			});
			// 修改日期格式
			$alert.find("[name=date_format]").off().on("change", function (e) {
				let date_format = $alert.find("[name=date_format]").val();
				Setting.updateSetting({ date_format });
			});
			// 修改文件输出
			$alert.find("[name=file_output]").off().on("mousedown", e => {
				e.cancelable && e.preventDefault();
				ipc.send("file_output", $alert.find("[name=file_output]").val());
			});
			// 查看文件输出
			$alert.find("[data-t=file_output] .button").off().on("click", () => ipc.send("file_output_readonly", $alert.find("[name=file_output]").val()));
			// 收到选择文件夹后的回调
			pageContext.globalWs.acceptCallback["file_output_callback"] = filePaths => {
				let file_output = filePaths[0];

				$alert.find("[name=file_output]").attr("title", file_output).val(file_output);
				Setting.updateSetting({ file_output });
			};
			// 检查更新
			$alert.find("[data-t=version_updating] .button.checkUpdate").off().on("click", function (e) {
				console.log(1)
			});
			// 重启
			$alert.find("[data-t=version_updating] .button.awaitRestart").off().on("click", function (e) {
				Setting.updateSetting({ awaitRestart: false }, () => ipc.send("restart"));
			});
			// 长按30秒
			$alert.find("[data-t=version_updating] .versions").off().on("mousedown", function (e) {
				if (mouseDownInterval) {
					clearInterval(mouseDownInterval);
					pageContent.data.mouseDownInterval = null;
					pageContent.data.mouseDownVersionS = 0;
				}
				pageContent.data.mouseDownInterval = setInterval(() => {
					pageContent.data.mouseDownVersionS += 1;
				}, 1000);
			});
			$alert.find("[data-t=version_updating] .versions").off().on("mouseup", function (e) {
				if (mouseDownInterval) clearInterval(mouseDownInterval);
				pageContent.data.mouseDownInterval = null;
				pageContent.data.mouseDownVersionS = 0;
			});
			$alert.find("[data-t=version_updating] .versions").off().on("mouseout", function (e) {
				if (mouseDownInterval) clearInterval(mouseDownInterval);
				pageContent.data.mouseDownInterval = null;
				pageContent.data.mouseDownVersionS = 0;
			});


			// 监听弹窗关闭事件
			alertClass.on("close", () => pageContent.data.lastCloseSetALertTime = new Date().getTime());
			// 监听弹窗打开事件
			alertClass.on("show", () => {
				let nowTime = new Date().getTime();
				console.log(mouseDownVersionS, lastCloseSetALertTime, nowTime - lastCloseSetALertTime)
				if (mouseDownVersionS > 3 && nowTime - lastCloseSetALertTime < 5000) {
					// 重启
					$alert.find("[data-t=clearDB]").show();
					$alert.find("[data-t=clearDB] .button.awaitRestart").off().once("click", function (e) {
						if (mouseDownInterval) clearInterval(mouseDownInterval);
						pageContent.data.mouseDownInterval = null;
						pageContent.data.mouseDownVersionS = 0;
						$alert.find("[data-t=clearDB]").remove();
					});
				}
			});

			alertClass.open();
		});
	},
	// "升级" 弹窗
	upgradeAlert: function () {
		pageContext.files.showPayWin({ pay_position: "" })
	},
	// 弹窗容器(显示遮罩，并设置点击关闭)
	alertCon: function (callback = function () { }, zIndex = 998) {
		$("#win_mark").css({ "z-index": zIndex }).show();
		$("#win_mark").one("click", () => {
			$("#win_mark").hide();
			callback()
		});
	},
	/* -end---------------------------------------------- 弹窗相关 --------------------------------------------- */

	/* -start-------------------------------------------- 工具 --------------------------------------------- */
	// 获取文件对应的编辑器页面
	getChartType: function (category) {
		let chartType = {};
		if (category.indexOf("mind") >= 0 || ['fishbone', 'timeline', 'ishikawa'].includes(category)) chartType = { url: "./src/v5_editor/source/compile/mindmap/index.html" };
		else if (category == "outline") chartType = { url: "./src/v5_editor/source/compile/outline/index.html" };
		else if (category == "markdown") chartType = { url: "./src/markdown-editor/index.html" };
		else chartType = { url: "./src/v5_editor/source/compile/diagrams/index.html" };

		return chartType;
	},
	// 文件列表右上角小工具栏的展示控制
	filesMinToolCut: function () {
		let { pageType, isSearch } = pageContext.data;
		let $searchCon = $("#search-con"),
			$searchInput = $("#search-con input"),
			$fileSort = $("#sort_by"),
			$clearTrash = $("#clear_trash"),
			// $fileCreate = $("#file_create"),
			$fileListType = $("#dir_sort");
		$('#po-head-select').show()
		$fileSort.hide();
		switch (pageType) {
			case "diagrams":
				$fileSort.show();
				$searchCon.removeClass("disable");
				// $fileCreate.removeClass("disable");
				$fileSort.removeClass("disable");
				$fileListType.removeClass("disable");
				$clearTrash.hide();
				break;
			case "history":
				$searchCon.removeClass("disable");
				$fileListType.removeClass("disable");
				// $fileCreate.addClass("disable");
				$fileSort.addClass("disable");
				$fileListType.hide();
				$clearTrash.hide();
				// $searchInput.val(null);
				break;
			case "colla":
				$searchCon.removeClass("disable");
				// $fileCreate.addClass("disable");
				$fileSort.addClass("disable");
				$fileListType.removeClass("disable");
				$clearTrash.hide();
				$('#po-head-select').hide();
				break;
			case "fav":
				// $fileCreate.addClass("disable");
				$fileSort.addClass("disable");
				$fileListType.removeClass("disable");
				$clearTrash.hide();
				$('#po-head-select').hide()
				// $searchInput.val(null);
				break;
			case "trash":
				$searchCon.removeClass("disable");
				$fileListType.removeClass("disable");
				// $fileCreate.addClass("disable");
				$fileSort.hide();
				$fileListType.hide();
				$clearTrash.show();
				$('#po-head-select').hide()
				break;
		}

		if (isSearch) {
			$fileListType.hide()
			$fileListType.addClass("disable");
			// $fileCreate.addClass("disable");
			$fileSort.addClass("disable");
		} else {
			if (pageType !== 'history')
				$fileListType.show()
		}
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
		pageContext.renderListType();
		return filesObj;
	},
	// 更新文件数 dom
	updataFileNum: function (callback) {
		// 获取文件数量
		UserOperation.getUserPrivilege(false, (user = {}) => {
			let $con;
			let totalFileCount;
			let usedFileCount = user.usedFileCount;
			let sFileNumMax = '';
			console.log("user", user)
			// if(!pcUtil.isOnline()) usedFileCount = user.usedFileCount + user.balanceUserdFileCount;
			localStorage.setItem('privilege', JSON.stringify(user))


			callback && callback(user)

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
				pageContext.renderMemberTime(user, true)
			}
			// else if (user.orgMember) {
			// 	$con = $(".con-left-num[data-member=2]");
			// 	$(".con-left-num[data-member=0]").hide();
			// 	$(".con-left-num[data-member=1]").hide();
			// 	$(".con-left-num[data-member=3]").hide();
			// 	totalFileCount = 10000;
			// 	sFileNumMax = '';
			// 	// $con.find(".file_num_n").html(`<span class="icons" style="color: #ff9800;">&#xe65d;</span><span style="color: #A6B9CD;padding-left: 4px;">团队版</span>`);
			// 	$con.find(".file_num_n").html(`<span class="icons" style="color: #ff9800;">&#xe664;</span><span style="color: #A6B9CD;padding-left: 4px;">个人版</span>`);
			// 	if (!$(".p-menu-left .logo_user_member span:first-child").hasClass("member")) {
			// 		$(".p-menu-left .logo_user_member span:first-child").addClass("member");
			// 	}
			// 	// $(".p-menu-left .logo_user_member span:first-child").text("团队版");
			// 	$(".p-menu-left .logo_user_member span:first-child").text("个人版");
			// 	$(".p-menu-left .logo_user_member span:last-child").text("续费");
			// 	pageContext.renderMemberTime(user)
			// }
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
				pageContext.renderMemberTime(user)
			}
			else {
				$con = $(".con-left-num[data-member=0]");
				$(".con-left-num[data-member=1]").hide();
				$(".con-left-num[data-member=2]").hide();
				$(".con-left-num[data-member=3]").hide();
				totalFileCount = user.totalFileCount;
				sFileNumMax = `${totalFileCount}`;
				$con.find(".file_num_n").html(`云端文件数: <span>${usedFileCount}</span> / <span>${sFileNumMax}</span>`);
				if ($(".p-menu-left .logo_user_member span:first-child").hasClass("member")) {
					$(".p-menu-left .logo_user_member span:first-child").removeClass("member");
				}
				$(".p-menu-left .logo_user_member span:first-child").text("免费版");
				$(".p-menu-left .logo_user_member span:last-child").text("升级");
				$con.show();
				pageContext.renderMemberTime(user, true)
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
	renderMemberTime: function (user, isRemove = false) {
		if ($(".p-menu-left .logo_user_member").find('.member_time').length != 0 || isRemove) {
			$(".p-menu-left .logo_user_member .member_time").remove()
		}
		if (!isRemove) {
			let timeStr = ''
			let type = 1
			// // showDlgDownWebView
			// if (user.orgMember) {
			// 	const time = (new Date(user.orgExpireTime)).getTime() - Date.now()
			// 	if (time <= 0) {
			// 		timeStr = ''
			// 	}
			// 	else if (time <= (1000 * 3600 * 24 * 15)) {
			// 		type = 2
			// 		timeStr = '会员还有' + parseInt(time / (1000 * 3600 * 24 * 15)) + '天到期，请尽快续费'
			// 	}
			// 	else {
			// 		timeStr = `到期时间: ${user.orgExpireTime.substring(0, 10)}`
			// 	}
			// }
			// // 个人会员
			// else
			if (user.member) {
				const time = (new Date(user.expireTime)).getTime() - Date.now()
				if (time <= 0) {
					timeStr = ''
				}
				else if (time <= (1000 * 3600 * 24 * 15)) {
					type = 2
					timeStr = '会员还有' + parseInt(time / (1000 * 3600 * 24 * 15)) + '天到期，请尽快续费'
				}
				else {
					timeStr = `到期时间: ${user.expireTime.substring(0, 10)}`
				}
			}
			if (timeStr != '') {
				const element = document.createElement('div')
				element.className = 'member_time'
				element.innerHTML = timeStr
				$(".p-menu-left .logo_user_member").append(element)
				type == 2 && $(".p-menu-left .logo_user_member .member_time").attr('style', 'left:-66px')
			}
		}
	},
	// 渲染 listType & listSort icon
	renderListType: function () {
		let { icons, listType, listSort, listDesc } = pageContext.data;
		let $sort = $("#sort_by_menu");
		let $type = $("#dir_sort");

		if (listType == "icon") {
			let title = "切换列表";
			$type.attr("original-title", title).html(icons["list_type_list"]);
		}
		else {
			let title = "切换视图";
			$type.attr("original-title", title).html(icons["list_type_icon"]);
		}
		$sort.find(`li[data-sort] span.icons`).html("");
		$sort.find(`li[data-sort=${listSort}] span.icons`).html(icons["list_sort"]);

		$sort.find(`li[data-desc] span.icons`).html("");
		$sort.find(`li[data-desc=${listDesc}] span.icons`).html(icons["list_sort"]);
	},
	getIcons: function (category) {
		let { data } = pageContext.data;
		let icons = "";
		switch (category) {
			case category.indexOf("mind") >= 0 || ['fishbone', 'timeline', 'ishikawa'].includes(category):
				icons = "<span class='icons' style='color:#0f9d58;font-size:18px;' >" + data.icons["mind"] + "</span>";
				break;
			case "ui":
				icons = "<span class='icons' style='color:#ff7c75;font-size:18px;'>" + data.icons["ui"] + "</span>";
				break;
			case "board":
				icons = "<span class='icons' style='color:#1D2129;font-size:17px;'>" + data.icons["board"] + "</span>";
				break;
			case "outline":
				icons = "<span class='icons' style='color:#515A67;font-size:18px;'>" + data.icons["outline"] + "</span>";
				break;
			default:
				icons = "<span class='icons' style='color:#4386f5;font-size:17px;'>" + data.icons["flow"] + "</span>";
		}
		return icons;
	},
	editChart: function (chartId, category, title, index) {
		let chartType = pageContext.getChartType(category);
		console.log(chartType, chartId, category, title, index)
		pcUtil.openWin({ url: chartType.url + `?token=token&chartId=${chartId}`, title: title }, index);
	},
	loadMore: function ($con = $("body")) {
		let $more = $con.find("#loadMore");
		if ($more.length) return;

		$more = HtmlStr["loadMore"]();
		$con.append($more);
		$("#loadMore").slideDown();
	},
	loadMoreClose: function () {
		$("#loadMore").slideUp();
	},
	/* -end---------------------------------------------- 工具 --------------------------------------------- */

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
		getCurrentTimeString: function () {
			var date = new Date();
			var y = date.getFullYear();
			var m = date.getMonth() + 1;
			var d = date.getDate();
			var hour = date.getHours();
			var minute = date.getMinutes();
			var seconds = date.getSeconds();
			return y + "-" + m + "-" + d + ' ' + hour + ':' + minute + ':' + seconds;
		},
		paramsInit: function () {
			pageContext.params = {
				resource: "",
				folderId: "root",
				searchTitle: "",
				sort: "",
				view: "icon",
				page: 1
			}
		},
		getTextByResource: function (res) {
			var text = (res == "colla") ? "分享给我" : (res == "fav") ? "我的收藏" : (res == "history") ? "最近" : (res == "trash") ? "回收站" : "我的云文件";
			return text;
		},
		getSelected: function () {
			return $(".file-list-item.active, .list-item.active");
		},
		getSelectedState: function () {
			var selected = pageContext.util.getSelected();
			if (selected.length == 1)
				return selected.attr("tp");
			else
				return "all";
		},
		getBaseUrl: "",
		getUserIcon: function (user) {
			var url = this.getBaseUrl + "/src/assets/images/default/profile-full-male.png";
			if (user != null && user.photoFileName != null) {
				url = this.getBaseUrl + "/file/" + user.photoFileName + "/photo";
			}
			return url;
		},
		isOnline: function () {
			return pcUtil.isOnline()
		}
	},
	files: {
		iframeDlgPms: {},
		//显示发布dialog
		pubpoWin: function (options) {
			const { pateTypeKeys, pageType } = pageContext.data
			if (!pcUtil.isOnline()) {
				new Toast("connectionless");
				return;
			} else if (options.data.chartId.length <= 12) {
				$.toast({
					type: 'warning',
					text: '文件未同步'
				})
				return
			}
			UserOperation.getUser(false, user => {
				window.user = user;
				pageContext.data.user = user;

				if (!pageContext.data.user.phone) {
					$.confirm({
						okval: '立即前往',
						content: "「请先前往账户中心绑定手机号」<br/>点击立即前往跳转至账户中心，点击闭关按钮隐藏弹窗",
						onConfirm: function () {
							pcUtil.openWin({ url: "/setting", title: "账户中心", type: "url" });
						}
					})
					return
				} else {
					var _this = this;
					var orgId = options.data.orgId;
					var dlgdomain = ipc.sendSync('getGlobal', "host");
					let opt = $.extend({
						url: dlgdomain + (orgId ? "/org" : "") + "/dlgapi",
						width: "770px",
						height: "537px",
						type: "share",
						title: "分享"
					}, options)
					var params = "?";
					if (opt.type) {
						params = params + "type=" + opt.type;
						if (opt.type == "dlgPay") {
							params += "&pointspage=" + opt.pointsPage
							params += "&pointssource=" + opt.pointsSource
						}
					}

					if (opt.data) {
						params += "&fdata=" + encodeURIComponent(JSON.stringify(opt.data))
					}
					if (opt.title) {
						params = params + "&title=" + opt.title;
					}
					if (opt.pattern) {
						params += "&pattern=" + opt.pattern;
					}
					$("#po-dialog-iframe-" + opt.type).remove();
					var $iframe = $("#po-dialog-iframe-" + opt.type + " iframe");
					if ($iframe.length == 0) {
						var $iframeDlg = $('<div id="po-dialog-iframe-' + opt.type + '" class="po-dialog po-dialog-iframe"><div class="po-iframe-loading-wrap"></div><div class="po-dialog-header" style="position: absolute;width: calc(100% - 42px);height: 20px"></div><iframe></iframe></div>').appendTo("body")
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
								console.log("msg: " + msg)
								var msgObj = JSON.parse(msg || "{}");
								if (_this.prevMsg === msg && msgObj.instructs !== "resize") {
									return;
								}
								_this.prevMsg = msg
								// console.log('v5msg', msgObj)
								if (msgObj.type == "dlgShare" || msgObj.type == "share") {
									if (msgObj.instructs == "close") {
										// insert.publish.init()
										var w = msgObj.width, h = msgObj.height;
										$("#po-dialog-iframe-" + opt.type).css({
											width: w,
											height: h
										});
										$iframe.width(w).height(h);
									}
								} else if (msgObj.type == "dlgPubpo") {
									if (msgObj.instructs == "close") {
										$("#po-dialog-iframe-pubpo").dialog("close");
									}
								} else if (msgObj.type == "dlgPay") {
									if (msgObj.instructs == "close") {
										window.location.reload();
									} else if (msgObj.instructs == "paySuccess") {
										if (memberObj) { memberObj.member = true; }
									}
								} else if (msgObj.type == "dlgFeedback") {
									if (msgObj.instructs == "close") {
										$("#po-dialog-iframe-dlgFeedback").dialog("close");
									}
								}
								//针对resize处理
								if (msgObj.instructs == "resize") {
									console.log(msgObj)
									var w = msgObj.width, h = msgObj.height;
									var _dlgName = msgObj.type;
									// 兼容 dlgShare
									if (_dlgName === `dlgShare`) {
										_dlgName = `share`;
									}
									$("#po-dialog-iframe-" + _dlgName).css({
										// top: '50%',
										// marginTop: -h/2 + 'px',
										width: w,
										height: h
									});
									$("#po-dialog-iframe-" + _dlgName).children('iframe').width(w).height(h);
								}
							}
						);
					}



					if (typeof this.iframeDlgPms[opt.type].messengerIframe != "undefined") {
						var sendData = {
							type: opt.type,
							instructs: 'init'
						}
						this.iframeDlgPms[opt.type].messengerIframe.targets['filelist'].send(JSON.stringify(sendData));
					}
					if (opt.isHide) {
						return
					}
					$.mask();
					$("#po-dialog-iframe-" + opt.type + "").width(opt.width).height(parseInt(opt.height)).dialog({
						onClose: function () {
							// messengerIframe = nu ll;
							// $iframe.removeAttr("src");
							// $.mask("close");
							pageContext.resetAndloadFiles()
						}
					});
					$iframe.off("load").on("load", function () {
						$(".po-iframe-loading-wrap").fadeOut("500");
						var timer = setTimeout(function () {
							$(".po-iframe-loading-wrap").remove();
							clearTimeout(timer);
						}, 500)

					});
					// 针对团队调整 orgId
					// if(orgId && opt.type === 'share') {
					//     var _orgShareUrl = opt.url + params + "&v="+Math.random();
					//     $("#po-dialog-iframe-" + opt.type + "").css({
					//         with: 680, height: 540
					//     });
					//     $("#po-dialog-iframe-" + opt.type + "").find("iframe").attr('src', _orgShareUrl);
					// }
					if (opt.type === 'pubpo') {
						$("#po-dialog-iframe-" + opt.type + "").css({
							// top: '50%',
							// marginTop: -opt.height/2 + 'px'
						})
					}
				}
			}, true);
		},
		//显示分享dialog
		shareWin: function (id) {
			var con = $("#share_win");
			con.dialog();
			var left = con.find(".dialog-win-left"), right = con.find(".dialog-win-right"), width = con.outerWidth();
			left.find("li").off("click").on("click", function () {
				var tit = $(this).attr("tit");
				$(this).addClass("active").siblings().removeClass("active");
				right.empty();
				right.html(ProShare[tit].source);
				ProShare[tit].execute(id);
			});
			left.find("li:eq(0)").trigger('click');
		},

		//显示分享协作dialog
		sharecollaWin: function (type, id) {
			const { pateTypeKeys, pageType } = pageContext.data
			if (!navigator.onLine) {
				new Toast({ type: "warning", msg: "无法连接到服务器，请检查您的网络设置" });
				return;
			}
			ipc.sendToHost("showShareWebView", type, id)

		},
		showPayWin: function (params) {
			ipc.sendToHost("showDlgPayWebView", params)
		}
	},
	//拖拽操作
	drag: {
		moveDom: null,
		sameFile: false,
		moveObj: {
			id: null,
			type: null
		},
		startTime: 0,
		endTime: 0,
		isMovingMode: false,
		selectedItem: null,
		moveType: "",
		moveHoverLine: false,
		mTop: 0,
		mPx: 0,
		mLeft: 0,
		mMovedTop: 0,
		mMovedLeft: 0,
		currentDiv: null,
		startX: 0,
		startY: 0,
		lastMove: null,
		delayTime: 100,
		sortTarget: null,// 当前拖拽的排序 dom
		createDom: function (item) {
			if (!item) return;
			let mDom = $("<div></div>")
			mDom.attr("id", "po_list_move_dom");
			mDom.css({
				position: "fixed",
				zIndex: 10,
				display: "none",
				pointerEvents: "none"
			})
			this.moveDom = mDom;
			$('body').append(mDom);
			var dombg = $('<div></div>');
			dombg.css({
				width: "148px",
				height: "20px",
				lineHeight: "20px",
				color: "#212930",
				padding: "10px 0 10px 12px",
				background: "#FFF",
				borderRadius: "3px",
				display: "flex",
				border: '1px solid var(--line-01-e-9-edf-2, #E9EDF2)',
				boxShadow: '0 8px 20px 0 #0000001a',
				flexDirection: 'row',
				alignItems: 'center'
			});
			$('#po_list_move_dom').append(dombg);
			var iconStr = 'lct';
			if (!item.chartId) {
				iconStr = 'xjwjj'
			} else if (item.category.indexOf('mind') > -1) {
				iconStr = 'swdt'
			} else if (item.category.indexOf('outline') > -1) {
				iconStr = 'swbj'
			}
			// 新增图标
			var iconSpan = $(`<img src="src/assets/images/icon/newbuild/${iconStr}.svg"/>`);
			iconSpan.css({
				'margin-right': '5px',
				'width': '18px',
				'height': '18px'
			});

			dombg.prepend(iconSpan);

			// 创建文字容器
			var textContainer = $('<div></div>');
			textContainer.css({
				'width': '113px', // 148 - 18（图标宽度） - 5（右边距）
				'overflow': 'hidden',
				'textOverflow': 'ellipsis',
				'whiteSpace': 'nowrap'
			});

			// 设置文字内容
			textContainer.text(item.title);

			dombg.append(textContainer);

			// 创建小红点容器
			var dotContainer = $('<div></div>');
			dotContainer.css({
				'width': '22px',
				'height': '22px',
				'background-color': '#eb5555',
				'border-radius': '50%',
				'display': 'flex',
				'justifyContent': 'center',
				'alignItems': 'center',
				'position': 'absolute',
				'top': '-11px',
				'left': '-11px',
				'zIndex': 1000
			});
			var selectItems = $('.file-list').find('.check:checked').length
			var selectCount = selectItems > 1 ? selectItems : '1'
			// 创建数字1
			var dotNumber = $('<div>' + selectCount + '</div>');
			dotNumber.css({
				'fontSize': '13px',
				'color': '#ffffff'
			});

			dotContainer.append(dotNumber);

			dombg.prepend(dotContainer);

			if (selectCount > 1) {
				var alldoms = $('<div></div>');
				alldoms.css({
					'width': '151px',
					'height': '31px',
					'border-radius': '3.6px',
					'background': '#FFFFFF',
					'border': '0.9px solid var(--line-01-e-9-edf-2, #E9EDF2)',
					'box-shadow': '0 7.2px 18px 0 #0000001a',
					'position': 'absolute',
					'bottom': '-5px',
					'left': '4px',
					'zIndex': -1
				});
				dombg.prepend(alldoms);
			}
		},
		rmDom: function () {
			this.mPx = 0
			if ($('#po_list_move_dom').length) {
				$('#po_list_move_dom').remove()
			}
			$('.file-list-item').removeClass('opacity')
			$('.list-item').removeClass('opacity')
			this.selectedItem = null
		},
		toMoveDom() {
			if (this.moveDom && this.mPx > 10) {
				$(this.moveDom).css({
					top: this.mTop - 20 + "px",
					left: this.mLeft - 20 + "px",
					display: "flex"
				})
			}
			this.mPx = this.mPx + 1
		},
		handleChangeSort: function (e) {
			const that = this
			const iconType = pageContext.data.listType == 'icon'

			// 目标点的dom
			const target = $(e.target)
			if (!target.hasClass('refer-con')) {
				return
			}
			const tp = $(that.sortTarget).attr("tp")
			const targetParent = iconType ? target.parents(`.file-list-item[tp=${tp}]`) : target.parents(`.list-item[tp=${tp}]`)
			if (targetParent.length == 0) {
				return
			}

			let targetItemData;
			let targetItemIndex;

			if (tp == 'chart') {
				targetItemData = pageContext.data.totalFilesObj.charts.find(i => i.chartId == targetParent.attr('id'))
				targetItemIndex = pageContext.data.totalFilesObj.charts.findIndex(i => i.chartId == targetParent.attr('id'))
			} else {
				targetItemData = pageContext.data.totalFilesObj.folders.find(i => i.folderId == targetParent.attr('id'))
				targetItemIndex = pageContext.data.totalFilesObj.folders.findIndex(i => i.folderId == targetParent.attr('id'))
			}

			let sortNum = targetItemData.sortNum;

			if (!sortNum) return;
			// 拖拽的 dom
			const fileId = $(that.sortTarget).attr("id")

			// 目标是否是最上边或者最左边的
			if (target.hasClass('top') || target.hasClass('left')) {
				sortNum = sortNum - 30
			} else {
				let sNext = tp === "chart" ? pageContext.data.totalFilesObj.charts[targetItemIndex + 1] : pageContext.data.totalFilesObj.folders[targetItemIndex + 1]
				// 下节点null
				if (!sNext) {
					sortNum = sortNum + 30
				} else {
					// 正常下节点
					sortNum = sortNum + (sNext.sortNum - sortNum) / 2
				}
			}



			if (!navigator.onLine) {
				new Toast('needNetwork')
				return
			}

			ServerUtil.saveSort({
				fileId,
				index: sortNum,
				fileType: tp
			}, res => {
				if (res.code == '200') {
					// 替换 dom 排序
					pageContext.resetAndloadFiles()
				}
			})

		},
		binMouseEvent: function () {
			const _this = this
			$(document).on("mousemove.drag", function (e) {
				_this.mTop = e.clientY
				_this.mLeft = e.clientX
				_this.toMoveDom()
			})
			console.log("binMouseEvent")
			$(document).on("mouseup.select", function (e) {
				const moveY = e.clientY - _this.mMovedTop
				const moveX = e.clientX - _this.mMovedLeft
				if (Math.abs(moveY) <= 20 && Math.abs(moveX) <= 20) {
					_this.rmDom()
					_this.isMovingMode = false
					return
				}
				_this.moveType = ""
				_this.moveHoverLine = false
				$(document).off("mousemove.drag")
				$(document).off("mouseup.select")
				_this.endTime = Date.now();

				// 如果大于 delayTime 毫秒就属于移动模式 
				console.log("mouseup.select")
				if (_this.endTime - _this.startTime > _this.delayTime) {
					_this.isMovingMode = true
				} else {
					_this.rmDom()
					_this.isMovingMode = false
					return
				}

				// 移动逻辑
				if (pageContext.data.listSort == 'free') {
					_this.handleChangeSort(e)
					$('.refer-con').remove()
				}

				console.log(_this.selectedItem)

				if (!_this.selectedItem) {
					return
				}


				const iconType = pageContext.data.listType == 'icon'

				const parent = iconType ? $(e.target).parents('.file-list-item') : $(e.target).parents('.list-item')
				const tp = parent.attr('tp')
				const targetFolderId = parent.attr('id')
				// 如果有tp 是 floder 有id 就可以松开走批量移动接口
				const fileIds = $(_this.selectedItem).map(function () {
					return $(this).attr("id");
				}).get().join(',');



				if (tp == 'folder' && targetFolderId && fileIds) {
					if (!navigator.onLine) {
						new Toast('needNetwork')
						return
					}
					if (_this.selectedItem.length >= 1) {
						ServerUtil.batchOperation({
							type: 'move',
							fileIds,
							targetFolderId
						}, (res) => {
							if (res.code == '200') {
								new Toast({ type: "success", msg: "操作成功" });
								pageContext.resetAndloadFiles()
							}
						})

					} else {
						ServerUtil.moveOperation({
							fileId: fileIds,
							targetFolderId,
							fileType: tp
						}, (res) => {
							if (res.code == '200') {
								new Toast({ type: "success", msg: "操作成功" });
								pageContext.resetAndloadFiles()
							}
						}, () => { })
					}

				}
				_this.rmDom()

			})
		},
		applyHoverEffect() {
			const rect = this.currentDiv[0].getBoundingClientRect();
			const items = $('.file-list-item, .list-item').not('.is-folder').not('div[tp=folder]');
			items.each((index, item) => {
				const itemRect = item.getBoundingClientRect();
				if (
					itemRect.left < rect.right &&
					itemRect.right > rect.left &&
					itemRect.top < rect.bottom &&
					itemRect.bottom > rect.top
				) {
					// 如果元素在框选区域内，添加hover类
					$(item).addClass('hover');
					$(item).addClass('active');
				} else {
					$(item).removeClass('hover');
					$(item).removeClass('active');
				}
			});
		},
		elistbgMouseMove: function (e) {
			if (this.currentDiv) {
				this.lastMove = e;
				// 计算鼠标当前位置相对初始点的偏移量
				const offsetX = e.pageX - this.startX - $('.file-list').offset().left;
				const offsetY = e.pageY - this.startY - $('.file-list').offset().top;

				// 根据偏移量计算宽度、高度，并动态调整框的位置
				const width = Math.abs(offsetX);
				const height = Math.abs(offsetY);

				this.currentDiv.css({
					width: width,
					height: height,
					top: offsetY >= 0 ? this.startY : this.startY + offsetY, // 根据鼠标方向调整 top
					left: offsetX >= 0 ? this.startX : this.startX + offsetX, // 根据鼠标方向调整 left
				});
				this.applyHoverEffect();
				// 滚动容器的引用
				var $poFilesList = $('#po-files-list');

				// 滚动容器的总高度
				var totalHeight = $poFilesList.prop('scrollHeight');

				// 容器的可视高度
				var visibleHeight = $poFilesList.height();

				var listHeight = $('.file-list').height();
				// 滚动触发的阈值
				var triggerThreshold = 50;
				// 检查是否接近底部
				if (listHeight > $poFilesList.scrollTop() + visibleHeight
					&& window.innerHeight - e.pageY < triggerThreshold
					&& $poFilesList.scrollTop() + visibleHeight < totalHeight - 50) {
					// 竖向滚动10px
					$poFilesList.scrollTop($poFilesList.scrollTop() + 6 - (window.innerHeight - e.pageY) / 10);
				} else if ($poFilesList.scrollTop() > 0 && e.pageY - $poFilesList.offset().top < triggerThreshold) {
					$poFilesList.scrollTop($poFilesList.scrollTop() - 6 + (e.pageY - $poFilesList.offset().top) / 10);
				}

			}
		},
		elistbgMouseUp: function (e) {
			e.stopPropagation();
			e.preventDefault();
			$(document).off('mousemove.elistbg')
			$(document).off('mouseup.elistbg')
			$('#po-files-list').off('scroll.elistbg')

			var currentDiv = this.currentDiv; // 保存当前的currentDiv引用
			if (!currentDiv) return
			if (this.currentDiv.height() < 20 && this.currentDiv.width() < 20) {
				currentDiv.remove();
				this.currentDiv = null
				return
			}
			// 移除currentDiv之前，先获取所有需要的数据list-item
			var selectedElements = $('body').find('.file-list-item[tp=chart], .list-item[tp=chart]').filter(function () {
				var $element = $(this);
				var elementOffset = $element.offset();
				var elementWidth = $element.outerWidth();
				var elementHeight = $element.outerHeight();
				var divOffset = currentDiv.offset();
				$element.removeClass('hover');
				// 检查元素是否在框选区域内
				return (
					elementOffset.left + elementWidth > divOffset.left &&
					elementOffset.top + elementHeight > divOffset.top &&
					elementOffset.left < divOffset.left + currentDiv.outerWidth() &&
					elementOffset.top < divOffset.top + currentDiv.outerHeight()
				);
			});

			console.log(selectedElements.length)
			$(selectedElements).find('.check').prop("checked", true)
			var parent = $(".file-list");
			var chartParent = $(".file-list-item, .list-item");
			var tp = chartParent.attr("tp");
			pageContext.getSelNum(parent)
			setTimeout(() => {
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
				currentDiv.remove();
				currentDiv = null
			}, 100);

		},
		initEvent: function () {
			var that = this
			// 按下

			$(".file-list-item img, .list-item .line").off("mousedown.drag").on("mousedown.drag", function (e) {
				that.mMovedTop = e.clientY;
				that.mMovedLeft = e.clientX;
				that.startTime = Date.now();
				pageContext.drag.isMovingMode = true
				// e.stopPropagation(); // prevent
				$('#contextMenu').hide();
				setTimeout(() => {
					// 这里isMovingMode 的逻辑是文件点击打开时候 就直接打开，让它继续走click
					// 而不是拖拽逻辑，不需要createDom
					if (e.button == 2 || !that.isMovingMode) return;
					// 如果是sort 模式，激活左右小蓝框
					const iconType = pageContext.data.listType == 'icon'
					const parent = iconType ? $(this).parents('.file-list-item') : $(this).parents('.list-item')
					that.sortTarget = parent
					const tp = parent.attr('tp')
					if (pageContext.data.listSort == 'free') {
						if (iconType) {
							const referCon = $(`<div class="refer-con refer-con__iconchart"/>`)
							$(`.file-list-item[tp=${tp}]`).append(referCon)
							$(`.file-list-item[tp=${tp}]`).eq(0).prepend($(`<div class="refer-con con__iconchart left"/>`))
						} else {
							const referCon = $(`<div class="refer-con line"/>`)
							$(`.list-item[tp=${tp}]`).append(referCon)
							$(`.list-item[tp=${tp}]`).eq(0).prepend($(`<div class="refer-con line top"/>`))
						}
						// 1、createDom
						const id = parent.attr("id")
						const dataList = tp == 'chart' ? pageContext.data.totalFilesObj.charts : pageContext.data.totalFilesObj.folders
						that.createDom(dataList.find(i => tp == 'chart' ? i.chartId == id : i.folderId == id))
					}
					// 看看当前是否有被勾选的
					const isCheckingItem = $('.file-list').find('.check:checked')
					const isChecking = isCheckingItem.length > 0

					if (isChecking) {
						// 当前这个是不是被勾选的？
						const curIsChecked = parent.find('.check').is(':checked')
						if (!curIsChecked) {
							$(document).off("mouseup.select").on("mouseup.select", function (e) {
								that.moveType = ""
								that.moveHoverLine = false
								that.rmDom()
							})
							return
						}
						isCheckingItem.parents('.file-list-item,.list-item').addClass('opacity')
					} else {
						parent.addClass("opacity")
					}
					const data = iconType ? isCheckingItem.parents('.file-list-item') : isCheckingItem.parents('.list-item')

					that.selectedItem = isChecking ? data : parent

				}, that.delayTime + 20)
				// 2、bindMove
				that.binMouseEvent()

			});
			// 框选
			$('.file-list').on('mousedown.elistbg', function (e) {
				if (pageContext.data.listSort != 'free') {
					// 每次点击先清除
					if (that.currentDiv) {
						that.currentDiv.remove();
						that.currentDiv = null
					}
					that.startX = e.pageX - $('.file-list').offset().left;
					that.startY = e.pageY - $('.file-list').offset().top;
					$('.file-list').css('position', 'relative')
					that.currentDiv = $('<div id="diagrams-current-div"></div>').css({
						position: 'absolute',
						border: '1px solid #067BEF', // 可选，为了更清楚地看到div
						width: 0,
						height: 0,
						top: that.startY, // 设置初始y坐标，减去滚动条的距离
						left: that.startX,  // 设置初始x坐标，减去滚动条的距离
						pointerEvents: 'none',
						zIndex: 20,
						background: 'rgba(6, 123, 239, 0.1)'
					}).appendTo('.file-list')
					// 绑定全局mousemove和mouseup事件 监听器

					$(document).on('mousemove.elistbg', function (e) {
						that.elistbgMouseMove(e)
					});
					$(document).on('mouseup.elistbg', function (e) {
						that.elistbgMouseUp(e)
					});
					$('#po-files-list').on('scroll.elistbg', function (e) {
						that.elistbgMouseMove(that.lastMove)
					});
				}
			})

		},
		clearEvent: function () {
			pageContext.drag.isMovingMode = false
			$(".file-list-item, .list-item .line").off("mousedown.drag")
			$('.file-list').off('mousedown.elistbg')
		},
		saveDrag: function (targetId) {
			let { ChartClass, FolderClass } = pageContext.data;
			let type = this.moveObj.type;
			let moveId = this.moveObj.id;

			if (moveId == targetId) return;

			ServerUtil.moveCharts({
				fileType: type, // folder chart
				fileId: moveId,
				targetFolderId: targetId
			}, res => {
				if (res.code == "200")
					ChartClass.removeChart({ chartId: moveId });
			})


		},
	},
	// 反馈
	feedback: {
		loadedfile: false,
		init: function () {
			// var _this = this;
			ipc.sendToHost("showFeedBackWin")
		}
	},
	/**
	 * 多选的核心方法
	 * @param {} clear 是否清除以选中的项
	 * @param {} obj 当前选择的项
	 */
	multiSelectValues: {
		id: [],
		types: {}
	},
	/**
	 * 多选的核心方法
	 * @param {} clear 是否清除以选中的项
	 * @param {} obj 当前选择的项
	 */
	multiSelect: function (clear, obj, callback) {
		var tp = obj.attr("tp");
		var id = obj.attr("id");
		if (clear) {
			$(".file-list-item.active,.list-item.active").removeClass("active");
			pageContext.clearMultiSelectValues();
		}
		if (obj.hasClass("active")) {
			pageContext.unSelect(obj);
		} else {
			pageContext.multiSelectValues.id.push(id);
			pageContext.multiSelectValues.types[id] = tp;
			obj.addClass("active");
		}
		if (callback != null) {
			callback();
		}
	},
	unSelect: function (obj) {
		var id = obj.attr("id");
		delete pageContext.multiSelectValues.id.remove(id);
		delete pageContext.multiSelectValues.types[id];
		obj.removeClass("active");
	},
	getMultiSelectFilesText: function (tp1, tp2) {
		tp1 = tp1 == null ? "chart" : tp1;
		tp2 = tp2 == null ? "folder" : tp2;
		var folderCount = $(".file-list-item[tp=" + tp2 + "].active").length;
		folderCount = folderCount == 0 ? "" : folderCount + "个文件夹";
		var chartCount = $(".file-list-item[tp=" + tp1 + "].active").length;
		chartCount = chartCount == 0 ? "" : chartCount + "个文件";
		var result = chartCount + " " + folderCount;
		return result;
	},
	getResourceByURL: function (href) {
		if (!href)
			href = location.href;
		if (href != null && href != "") {
			if (href.indexOf("trash") >= 0) {
				return "trash";
			} else if (href.indexOf("fav") >= 0) {
				return "fav";
			} else if (href.indexOf("colla") >= 0) {
				return "colla";
			} else if (href.indexOf("history") >= 0) {
				return "history";
			} else if (href.indexOf("operation") >= 0) {
				return "operation";
			}
		} else {
			return null;
		}
	},
	clearMultiSelectValues: function () {
		pageContext.multiSelectValues.id = [];
		pageContext.multiSelectValues.types = {};
	},
	/**
	 * 初始化文件操作
	 */
	selNum: 0,
	showBatch: function (dom, tp) {
		$(dom).find("[tp = chart] ").addClass("file-sel");
		$(dom).find(".op").addClass("none");
		$(dom).children().removeClass("active")
		$(dom).find(".menu").hide()
		pageContext.data.ChartClass && pageContext.data.ChartClass.cutCheck(true);
		$("#new-file").disable()
		$(".con-right").prepend('<div class="select-op"><input type="checkbox" class="check">全选<span class="split">|</span>已选择<span class="select-num">' + pageContext.selNum + '</span>项<div class="btn"><span class="copy">移动或复制</span><span class="del">删除</span><span class="cancel">取消批量操作</span></div></div>')
		$(".con-right .dir").hide();

		// 批量删除
		$(".select-op .del").off().on("click", function (e) {
			e.stopPropagation()
			FileBusiness.del(pageContext.getSelInput($(".file-list")), "chart", () => {
				pageContext.resetAndloadFiles();
			});
		})
		// 取消批量操作
		$(".select-op .cancel").off().on("click", function (e) {
			e.stopPropagation()
			pageContext.removeBatch()
		})
		// 批量全选
		$(".select-op input").off().on("click", function (e) {
			e.stopPropagation()
			if ($(this).is(":checked")) {
				dom.find(".check").prop("checked", true);
			} else {
				pageContext.removeBatch()
			}
			pageContext.getSelNum(dom)
		})
		// 批量 复制或移动
		$(".select-op .copy").off().on("click", function (e) {
			e.stopPropagation()
			FileBusiness.copy(pageContext.getSelInput(dom), "chart", () => {
				pageContext.resetAndloadFiles();
			}, pageContext.getSelChartData(dom))
		})
		let bodyClick = function (e) {
			if (
				!$(e.target).hasClass("close")
				&& !$(e.target).hasClass("dialog-close")
				&& !$(e.target).parents(".file-list-item[tp=chart]").length > 0
			) {
				pageContext.removeBatch()
			}
		}
		$(document).on("click.clear", bodyClick);
	},
	removeBatch: function () {
		let { ChartClass } = pageContext.data;
		$(".select-op").remove();
		$("#new-file").enable()
		$(document).off("click.clear")
		$(".con-right .file-list").find(".op").removeClass("none");
		$(".con-right .dir").show();
		$(".con-right .file-list .file-sel").removeClass("file-sel");
		$(".con-right .file-list").find(".check").prop("checked", false);
		$('.file-list-item').removeClass('opacity')
		ChartClass && ChartClass.cutCheck(false);
	},
	getSelNum: function (dom) {
		pageContext.selNum = $(dom).find(".check:checked").length;
		$(".select-op .select-num").text(pageContext.selNum);
	},
	getSelInput: function (dom) {
		var filesId = [];
		for (var i = 0; i < $(dom).find(".check:checked").length; i++) {
			filesId.push($(dom).find(".check:checked").eq(i).parent().parent().attr("id"))
		}
		return filesId.join();
	},
	getSelChartData: function (dom) {
		var $row = $(dom).find(".check:checked").first().closest(".file-list-item, .list-item");
		var cate = $row.attr("data-cate");
		return { category: cate || "flow" };
	},
	/* -end---------------------------------------------- 待合并区域 --------------------------------------------- */

	/* -start-------------------------------------------- ws通信逻辑 --------------------------------------------- */
	globalWs: {
		ws: null,
		acceptCallback: {
			// 重新加载列表
			loadFile: () => {
				const { isSearch } = pageContext.data
				if (isSearch) { // 搜索不刷新
					return
				}
				if ((!navigator.onLine && pageContext.data.pageType == 'history') || navigator.onLine) {
					// setTimeout(() => {
					pageContext.data.pageCur = 1;
					pageContext.data.isLoadingMore = true
					pageContext.data.filesObj = { charts: [], folders: [] };
					// pageContext.data.pageCount = 1;
					$(".file-list").html("");
					pageContext.loadFiles(false).then(() => {
						pageContext.data.isLoadingMore = false
					})
					// }, 3000);
				}
			},
			// 更新单个文件dom
			updataChart: chart => pageContext.data.ChartClass.updataChart(chart),
			// 创建文件
			createChart: (type, category, originBtnName) => pageContext.createChart(type, category, "Tab页签", originBtnName),
			// 进入文件编辑器
			editChart: (chartId, category, title, index) => pageContext.editChart(chartId, category, title, index),
			locateChart: (chartId) => pageContext.locateChartById(chartId),
			// 收到选择文件夹后的回调
			file_output_callback: filePaths => { },
			// 执行同步
			sync: (needReloadTab = false, data = '') => {
				pageContext.reloadHome(needReloadTab, data)
			},
			// 关联文件打开 —— 导入
			associated: (data) => {
				pageContext.associated(data)
			},
			// 隐藏所有弹窗
			hideMenu: () => {
				pageContext.data.ChartClass && pageContext.data.ChartClass.hideAllMenu();
				pageContext.data.FolderClass && pageContext.data.FolderClass.hideAllMenu();

				Object.keys(pageContext._hideAlert).map(k => { pageContext._hideAlert[k] && pageContext._hideAlert[k]() });

				$("#noti-win").hide();
				Notification.count();
				$(document).off("click.noti");
			},
			// 显示设置弹窗
			showsetting: () => {
				$(".icon_btn.set").click();
			},
			// 升级
			upgrade: () => pageContext.upgradeAlert(),
			// 退出登录
			logout: () => {
				$.confirm({
					content: "您将退出登录，是否继续？",
					onConfirm: function () {
						ServerUtil.logout();
					}
				})
			}
		},
		init: function () {
			// pageContext.globalWs.ws = new wsTool("sub");
			pageContext.globalWs.accept();
		},
		accept: function () {
			let that = pageContext.globalWs;

			ipc.on("pong_event", (e, m) => {
				console.log(m)
				let callback = that.acceptCallback[m.k];
				if (m.k === "sync") {
					callback(m.needReloadTab, m.data ?? '');
					return
				}
				let args = m.isJson ? JSON.parse(m.args || []) : (m.args || [])
				if (!callback) callback = function () { };
				if (!args || args.constructor != Array) callback();
				else callback(...args);
			});
		},
		send: {
			// 退出登录
			"logout": function () {
				$.confirm({
					content: "您将退出登录，是否继续？",
					onConfirm: function () {
						ServerUtil.logout();
					}
				})
			}
		}
	},
	initAdvertise: function () {
		if (CONFIG.CHANNELTYPE == 'lenovo_ly') return

		Promise.all([pageContext.getTopAdvertise(), pageContext.getLetfAdvertise()]).then(() => {
			setTimeout(() => {
				/*点击活动图片跳转*/
				$('body').on('click', '.toLinkWebHome', function () {
					const url = $(this).data('url')
					// 端内呼出支付
					if (url === "dialogfn:upgrade") {
						pageContext.files.showPayWin({ pay_position: "" })
						return
					}
					if (url.startsWith('http')) {
						shell.openExternal(url)
					} else {
						shell.openExternal(`${ipc.sendSync("getGlobal", "host")}${$(this).data('url')}`)
					}
				})
			}, 1000);
		})
	},
	/*调用顶部banner*/
	getTopAdvertise: function () {
		return new Promise((reslove) => {
			pcUtil.ajax({
				url: "/api/pc/advertise/get/list",
				type: 'GET',
				data: { terminalType: 'pc', systemType: pcUtil.isMac() ? 'mac' : 'win', pageType: 'personal_file_rt', limit: 2 },
				success: function (res) {
					if (res.code === '200') {
						pageContext.readyGo('rootBanner', 'topcontainer', res.data)
					}
					const hasAd = res.data && res.data.length > 0
					$("#rootBanner").css("cursor", hasAd ? "pointer" : "initial")
					reslove()
				}
			});
		})
	},
	/*调用左侧banner*/
	getLetfAdvertise: function () {
		return new Promise((reslove) => {
			pcUtil.ajax({
				url: "/api/pc/advertise/get/list",
				type: 'GET',
				data: { terminalType: 'pc', systemType: pcUtil.isMac() ? 'mac' : 'win', pageType: 'personal_file_lb', limit: 2 },
				success: function (res) {
					if (res.code === '200') {
						pageContext.readyGo('leftBanner', 'leftcontainer', res.data, 2.35, true)
						reslove()
					}
				}
			});
		})
	},
	/*轮播图方法*/
	readyGo: function (dom = 'root', subClass = 'topContainer', images = [], ratio = 7.5, isRadius = false) {
		$('#' + dom).empty();
		let imagesCommon = images.map(item => {
			var i = {
				tagName: "img",
				attrs: {
					class: "toLinkWebHome",
					"data-type": item.adGotoType,
					"data-url": item.adGotoUrl,
					src: item.adImgUrl,
					style: `width:100%; height: 100%;`
				}
			}
			return i
		})
		var root = document.getElementById(dom);
		function appendContainer(text) {
			var container = document.createElement("div");
			container.className = subClass;
			root.appendChild(container);
			return container;
		}

		var fns = [
			function () {
				var text = "";
				var container = appendContainer(text);
				var awesomeSlider = new AwesomeSlider(imagesCommon, container, {
					autoplay: true,
					ratio: ratio,
					interval: 5000,
					indicator: 3000
				});
			},
		];

		for (var i = 0; i < fns.length; i++) {
			fns[i]();
		}
	},
	getHistoryData: function () {
		return new Promise((resolve) => {
			let renderData = {}
			ipc.invoke('loadFileB64',
				{
					type: "cache",
					path: "history/cache.json"
				}
			).then((res) => {
				const data = res
				console.log("最近列表数据：", data);
				if (data.code == 201) {
					renderData.DataList = [];
					renderData.type = 'history';
					renderData.subTitle = '最近'
					resolve(renderData);
				} else {
					renderData.subTitle = '最近'
					renderData.type = 'history';
					renderData.DataList = JSON.parse(decodeURIComponent(escape(atob(data.data))));
					renderData.DataList = renderData.DataList.filter(d => {
						// 4 云文件bak //5未保存bak //2 本地文件
						return (d.type != 5 && d.type != 4) ||
							(d.type == 4 && d.owner && d.owner.userId == window.localStorage.getItem('processon_userKey'))
					});
					const watchFileData = renderData.DataList.filter(d => d.type == 2 && !d.filepath.endsWith('.bak')).map((d) => {
						return { chartId: d.chartId, filepath: d.filepath }
					})
					// 检测文件是否存在
					setTimeout(() => {
						console.log("watchFile", watchFileData)
						ipc.send('watchFile', watchFileData)
					}, 1000);
					resolve(renderData);
				}

			})
				.catch((err) => {
					console.log("获取文件列表失败---", err);
					renderData.DataList = [];
					resolve(renderData);
				});
		})
	},
	/* -end---------------------------------------------- ws通信逻辑 --------------------------------------------- */
	noOnLine: function () {
		new Toast({ type: "warning", msg: "网络连接中断", $con: $(".con-right") });
	},
	confirmDelete() {
		return new Promise((resolve) => {
			let renderData = {
				type: 'history',
				subTitle: '', // 这里用 state 中的可以保持原来的数据
			};

			$.confirm({
				content: "文件不存在，是否从最近中删除该文件?",
				onConfirm: function () {
					ipc.invoke(
						"loadFileB64",
						{
							type: "cache",
							path: "history/cache.json",
						}
					)
						.then((res1) => {
							// const data = JSON.parse(res);
							// console.log("最近列表数据：", data);
							if (res1.code != 201) {
								renderData.DataList = JSON.parse(decodeURIComponent(escape(atob(res1.data))));
								renderData.DataList = renderData.DataList.filter(d => d.filepath != res || (d.filepath == '' && d.type == 2))
								ipc.invoke("saveFileB64",
									{ type: 'cache', path: "history/cache.json", data: btoa(unescape(encodeURIComponent(JSON.stringify(renderData.DataList)))) }).then(() => {
										pageContext.resetAndloadFiles()
										resolve()
									})
							}
							// window.pageContext.renderHistoryWarp()

						})
						.catch((err) => {
							console.log("获取文件列表失败---", err);
							renderData.DataList = [];
							resolve();
						});
				}
			});
		})
	},
	setConfig(key, value) {
		if ((key && value) || (key && !value)) {
			const userId = localStorage.getItem('processon_userKey')
			let pageConfig = localStorage.getItem(`${userId}_pageConfig`)
			pageConfig ? pageConfig = JSON.parse(pageConfig) : pageConfig = {}
			if (key && value) { pageConfig[key] = value }
			(key && !value) && delete pageConfig[key]
			localStorage.setItem(`${userId}_pageConfig`, JSON.stringify(pageConfig))
		}
	},
	getConfig() {
		const userId = localStorage.getItem('processon_userKey')
		return localStorage.getItem(`${userId}_pageConfig`)
	},
	async copyBase64ImageToClipboard(base64String) {
		ipc.invoke('cliCopyImage', base64String).then((res) => {
			if (res) {
				new Toast({ type: "success", msg: "图片复制成功", $con: $(".con-right") });
			}
			else {
				new Toast({ type: "error", msg: "图片复制失败", $con: $(".con-right") });
			}
		})
	}
};
/**
 * 首页生命计时器
 * @type {{interval: "interval 对象", event: {message: {callback: "定时执行事件", time: "执行间隔时间", pause: "是否暂停此事件定时执行"}}}}
 */
var interval = {
	// interval 对象
	interval: null,
	// 挂载在生命计时器上的定时任务
	event: {
		// 定时查询通知数量
		"message": {
			time: 1000 * 60 * 10,
			callback: () => {
				if (!navigator.onLine) return
				ServerUtil.notificationCount(function (res) {
					if (res.code == 200) {
						pcUtil.setOnlie(true);
						ipc.sendToHost('notificationCount', res.data.count)
						let $msg = $(".icon_btn.msg .global-tip");
						if (res.data.count > 0) $msg.text(res.data.count).show();
						else $msg.hide();
					}
				}, function (err) {
					if (err == "timeout" || !navigator.onLine) pcUtil.setOnlie(false);
					if (err == "error") pcUtil.setOnlie(false);
				});
				// 支付成功 & 退款 的被动接收逻辑
				ServerUtil.notificationList({
					page: 1,
					tp: "unread"
				}, function (res) {
					const { code, data: { list = [] } } = res
					if (code == '200') {
						// 退款、支付成功
						// const needRefrshVipStatus = list.some(i => {
						// 	const isPaySuccess = i.type == 'pay_success'
						// 	const isRefund = i.type == 'system_upgrade' && i.referenceDes.includes('退款成功')
						// 	return isPaySuccess || isRefund
						// })
						const needRefrshVipStatus = []
						list.forEach(i => {
							const isPaySuccess = i.type == 'pay_success'
							const isRefund = i.type == 'system_upgrade' && i.referenceDes.includes('退款成功')
							if (isPaySuccess || isRefund) {
								needRefrshVipStatus.push({ notificationId: i.notificationId })
							}
						})
						if (needRefrshVipStatus.length > 0) {

							ipc.invoke('loadFileB64',
								{
									type: "cache",
									path: "notification/data.json",
								}
							).then((res) => {
								const data = res
								let realData = []
								if (data.code == 200 && res.data !== '') {
									const data = JSON.parse(decodeURIComponent(escape(atob(res.data))));
									// 云文件 不同账号不展示 其他展示
									if (Array.isArray(data) && data.length > 0) {
										needRefrshVipStatus.forEach(d => {
											if (data.findIndex(di => di.notificationId == d.notificationId) == -1) {
												realData.push(d)
											}
										})
										if (realData.length > 0) {
											realData = data.concat(realData)
											ipc.invoke("saveFileB64", { type: 'cache', path: "notification/data.json", data: btoa(unescape(encodeURIComponent(JSON.stringify(realData)))) }).then(() => {
												ipc.send('paySuccessRefreshing')
											})
										}
									}

								} else {
									realData = needRefrshVipStatus
									ipc.invoke("saveFileB64", { type: 'cache', path: "notification/data.json", data: btoa(unescape(encodeURIComponent(JSON.stringify(realData)))) }).then((res1) => {
										ipc.send('paySuccessRefreshing')
									})
								}
							})
						}
					}
				})

			}
		}
	},
	init: function () {
		if (interval.interval) {
			clearInterval(interval.interval)
		}
		interval.interval = setInterval(() => {
			interval.event.message.callback()
		}, interval.event.message.time);
	}
};

// 崩溃
function checkCrash() {

	ipc.invoke('loadFileB64',
		{
			type: "cache",
			path: "crash/data.json",
		}
	).then((res) => {
		const data = res

		if (data.code == 200 && res.data !== '') {
			const data = JSON.parse(decodeURIComponent(escape(atob(res.data))));
			// 云文件 不同账号不展示 其他展示
			if (Array.isArray(data) && data.length > 0) {
				const shouldShow = data.filter(d => {
					// 4 云文件bak //5未保存bak //2 本地文件
					return d.type == 2 || d.type == 5 || (
						d.type == 4 && d.owner.userId == localStorage.getItem('processon_userKey')
					)
				})
				if (shouldShow.length > 0) {
					console.log("崩溃文件数据", data);

					$.confirm({
						content: `<div style="font-size:14px;">
									<span class='icons_web' style='color:#EB5555;width:20px;height:20px;'>&#xe996;</span>
									程序意外关闭，是否要恢复文件
								</div>`,
						okval: `恢复(${shouldShow.length})`,
						onConfirm: function () {
							// ipc.invoke("saveFileB64",
							//   { type: 'cache', path: "history/cache.json", data: importClass.stringToBase64String(JSON.stringify(renderData.DataList)) }).then(() => {
							//     pageContext.resetAndloadFiles()
							//   })
							shouldShow.sort((a, b) => a.tabId - b.tabId)
							shouldShow.forEach(item => {
								const isMyFile = item.chartId.length <= 13
								// 本地文件是否存在
								let chartType = pageContext.getChartType(item.category);

								if (isMyFile) {
									ipc.invoke('loadFileB64', { type: 'local', path: item.filepath }).then((res) => {
										if (res.code == 200) {
											pcUtil.openWin({ url: chartType.url + `?token=token&chartId=${item.chartId}&dbId=&filepath=${encodeURIComponent(item.filepath)}`, title: item.title });
										}
									})
								} else {
									if (pcUtil.isOnline()) {
										pcUtil.openWin({ url: chartType.url + `?token=token&chartId=${item.chartId}&dbId=${item.dbId}`, title: item.title });
									} else {
										ipc.invoke(
											"loadFileB64",
											{
												type: "cache",
												path: "history/cache.json",
											}
										).then((res1) => {
											console.log(res1)
											if (res1.code == 200) {
												const cache = JSON.parse(decodeURIComponent(escape(atob(res1.data))));
												const target = cache.find(c => c.chartId == item.chartId)
												if (target && target.filepath) {
													pcUtil.openWin({ url: chartType.url + `?token=token&chartId=${target.chartId}&dbId=&filepath=${encodeURIComponent(target.filepath)}`, title: target.title });
												}
											}
										})
									}
								}
							})
							ipc.invoke("saveFileB64", { type: 'cache', path: "crash/data.json", data: '' })
							// 清空崩溃数据
						},
						onCancel: function () {
							ipc.invoke("saveFileB64", { type: 'cache', path: "crash/data.json", data: '' })
						}
					});
				}
			}

		} else {
			console.log("无崩溃")
		}
	})
}
// 轮训vip装备
function intervalVipStatus() {
	// 前端负责 通知轮询
	interval.init()
	// 主进程通知	
	const user = localStorage.getItem('privilege')
	const keyt = localStorage.getItem('keyt')
	ipc.send('startInterVal', { user: JSON.parse(user), keyt })
	ipc.on('startInterVal_callback', (e, userInfo) => {
		console.log("startInterVal_callback", JSON.stringify(userInfo))
		localStorage.setItem('privilege', JSON.stringify(userInfo))
		ipc.send('paySuccessRefreshing')
	})


}
$(document).ready(function () {
	pageContext.init();

	// pageContext.getTopAdvertise()
	// pageContext.getLetfAdvertise()

	intervalVipStatus() // 轮训vip和通知控制 vip状态
	useGuide() // 用户引导
	// 测试埋点
	window.poCollect('进入首页')
	ipc.invoke('isInit').then((res) => {
		if (res) {
			checkCrash() // 检测崩溃
		}
	})
	// 快捷键添加cmmond提示
	if (pcUtil.isMac()) {
		$('.description-item .keysi').html('<span class="icons_web icon_search">&#xe6bd;</span>')
	}
})

window.addEventListener('keydown', (e) => {
	// 最大化
	if ((e.key == '=' || e.key == '+') && (e.ctrlKey || e.metaKey) && e.shiftKey) {
		ipc.send('win_opts', 'max')
	}
	// 最小化
	else if ((e.key == '-' || e.key == '_') && (e.ctrlKey || e.metaKey) && e.shiftKey) {
		ipc.send('win_opts', 'min')
	}
	// 新建流程图
	else if ((e.key == 'n' || e.key == 'N') && (e.ctrlKey || e.metaKey)) {
		pageContext.createChart('flow', 'flow', 'keys', '快捷键')
	}
	// 新建思维导图
	else if ((e.key == 'm' || e.key == 'M') && (e.ctrlKey || e.metaKey)) {
		e.stopPropagation()
		pageContext.createChart('mind_free', 'mind_free', 'keys', '快捷键')
	}
	// 新建思维笔记
	else if ((e.key == 't' || e.key == 'T') && (e.ctrlKey || e.metaKey)) {
		pageContext.createChart('outline', 'outline', 'keys', '快捷键')
	}
	// 新建文件夹
	else if ((e.key == 'f' || e.key == 'F') && (e.ctrlKey || e.metaKey) && e.shiftKey) {
		$('.createModel-middle-item[data-btn=floder]').click()
	}
	// 打开
	else if ((e.key == 'o' || e.key == 'O') && (e.ctrlKey || e.metaKey)) {
		$('#share_doc_input').click()
		// $('#import_btn').click()
	}
	// 关闭
	else if ((e.key == 'w' || e.key == 'W') && (e.ctrlKey || e.metaKey)) {
		ipc.send('win_opts', 'close')
	}
	// 刷新页面
	else if ((e.key == 'r' || e.key == 'R') && (e.ctrlKey || e.metaKey)) {
		window.location.reload()
	}
	// 搜索
	else if ((e.key == 'f' || e.key == 'F') && (e.ctrlKey || e.metaKey)) {
		$('#search-con input').focus()
	}
	// 切换列表模式
	else if ((e.key == 'l' || e.key == 'L') && (e.ctrlKey || e.metaKey)) {
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
			return
		}
		pageContext.data.listType = "list"
		pageContext.setConfig('diagrams_listType', pageContext.data.listType)
		if (["diagrams", "colla", "fav", "trash"].includes(pageContext.data.pageType)) {
			pageContext.resetAndloadFiles();
			pageContext.renderListType();
		}
	}
	// 切换视图模式
	else if ((e.key == 'v' || e.key == 'V') && (e.ctrlKey || e.metaKey)) {
		if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
			return
		}
		pageContext.data.listType = "icon"
		pageContext.setConfig('diagrams_listType', pageContext.data.listType)
		if (["diagrams", "colla", "fav", "trash"].includes(pageContext.data.pageType)) {
			pageContext.resetAndloadFiles();
			pageContext.renderListType();
		}
	}
})

ipc.on('notificationRenderDirHome', function (e, opt) {
	pageContext.renderDir("refresh").then(() => {
		pageContext.loadFiles(true, "colla")
			.then(() => pageContext.renderDir("location_colla", { id: opt.id, title: opt.title }));
	})
})
ipc.on('notificationEditorHome', function (e, opt) {

	pageContext.editChart(opt.chartId, opt.category, opt.title)

})
/*监听index.html顶部头像点击的相应路径*/
ipc.on("openWinPage", (e, id, params) => {
	window.poCollect('展示支付弹窗', { '触发位置': '右上角下拉菜单中的升级' })
	if (!navigator.onLine) {
		new Toast('needNetwork')
		return
	}
	switch (id) {
		// 账号中心
		case "account":
			ipc.invoke('open-childWindow')
			// shell.openExternal(
			// 	`${ipc.sendSync("getGlobal", "host")}/setting`
			// )
			// pcUtil.openWin({ url: "/setting", title: "账户中心", type: "url" });
			break;
		// 个人主页
		case "user":
			shell.openExternal(
				`${ipc.sendSync("getGlobal", "host")}/u/${window.user.userId}`
			)
			// pcUtil.openWin({ url: `/u/${window.user.userId}/profile`, title: "个人主页", type: "url" });
			break;
		// 升级
		case "upgrade":
			pageContext.files.showPayWin(params)
			// pageContext.upgradeAlert()
			// pcUtil.openWin({ url: "/upgrade?pos=2_2", title: "升级", type: "url" });
			break;
		// 退出登录
		case "logout":
			$.confirm({
				content: "您将退出登录，是否继续？",
				onConfirm: function () {
					ipc.send("win_opts", "unmax")
					ServerUtil.logout();
				}
			})
			break;
		case "payment":
			shell.openExternal(
				`${ipc.sendSync("getGlobal", "host")}/setting#payment`
			)
			// pcUtil.openWin({ url: "/setting#payment", title: " 交易记录", type: "url" });
			break;
		case "coupon":
			shell.openExternal(
				`${ipc.sendSync("getGlobal", "host")}/setting#coupon`
			)
			// pcUtil.openWin({ url: "/setting#coupon", title: " 福利中心", type: "url" });
			break;
		case "support":
			shell.openExternal(
				`${ipc.sendSync("getGlobal", "host")}/support`
			)
			// pcUtil.openWin({ url: "/support", title: " 入门教程", type: "url" });
			break;
		case "home":
			ipc.sendToHost('selectTab', 0, false);
			break;
	};
	/*监听index.html顶部头像点击的相应路径*/

	/*监听index.html顶部头像点击的相应路径*/
});
ipc.on('hideHome', () => {
	$('.help_shade').hide()
	$('.menu').hide()
	$('#sort_by_menu').hide()
	$('#select_by_menu').hide()

	$('.create-btn-list').removeClass('popover')
})
ipc.on('showDiagrams', (e) => {
	pageContext.data.pageType = 'diagrams'
	pageContext.data.dirs = [{ id: "root", title: pageContext.data.pateTypeKeys['diagrams'] }];
	pageContext.renderDir()
	pageContext.resetAndloadFiles()
	ipc.sendToHost('closeAiCreateWebview')
})

ipc.on("createChart", (e, type) => {
	if (["flow", "mind_free", "outline"].includes(type)) {
		const auto_upload = localStorage.getItem('auto_upload')
		if (auto_upload && auto_upload == '1') {
			FileDatabase.hasFileNum(false).then(() => {
				const folderId = pageContext.data.dirs[pageContext.data.dirs.length - 1].id
				const chartType = pageContext.getChartType(type)
				if (pcUtil.isOnline()) {
					ServerUtil.createChart(
						{ folderId, category: type },
						(data) => {
							pcUtil.openWin({ url: chartType.url + `?token=token&chartId=${data.data.chart.chartId}&dbId=`, title: data.data.chart.title });
						},
						() => {
							new Toast({ type: "error", msg: "服务异常请重试" });
						})
				}
				else {
					pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=&new=true&isUpload=true&folderId=${folderId}`, title: '未命名文件' });
				}
				pageContext.data.isLoading = false
			}).catch(err => {
				const pay_position = `newfile-${category}-ins`
				ipc.sendToHost('upgradeDlg', { dlgType: 1, type, category, pay_position })
				pageContext.data.isLoading = false
			});
		}
		else {
			const chartType = pageContext.getChartType(type)
			pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=&new=true`, title: '未命名文件' });
		}
	}
})

ipc.on('keydown', (_evt, e, a) => {

	const event = new KeyboardEvent('keydown', {
		metaKey: e.metaKey, shiftKey: e.shiftKey, altKey: e.altKey, key: e.key, ctrlKey: e.ctrlKey
	});
	document.dispatchEvent(event)
})

ipc.on('endCheckFile', (_evt, e) => {
	e.forEach((d) => {
		$('.list-item[id=' + d.chartId + ']').addClass('fileRmove')
	})
})