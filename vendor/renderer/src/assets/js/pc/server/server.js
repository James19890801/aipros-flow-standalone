import DBUtil from '../db/db.js'
import UserOperation from '../db/user.js'
import FileDatabase from '../operation/fileDatabase.js'
import { Toast } from '../class.js'
// const fs = require("fs");
/**
 * 与服务器进行通讯
 */
const ServerUtil = {
	/* -start-------------------------------------------- 请求 loading 适应显示 --------------------------------------------- */
	_toastLoading: null,
	_timoutLoading: null,
	_preTimeLoading: null,
	_preLoading: function (toastType = 'loading', $con = $('body')) {
		ServerUtil._timoutLoading && clearTimeout(ServerUtil._timoutLoading)
		ServerUtil._toastLoading && ServerUtil._toastLoading.close()

		ServerUtil._toastLoading = null
		ServerUtil._timoutLoading = null
		ServerUtil._preTimeLoading = new Date().getTime()
		ServerUtil._timoutLoading = setTimeout(
			() => (ServerUtil._toastLoading = new Toast(toastType, $con)),
			150
		)
		// ServerUtil._timoutLoading = setTimeout(() => ServerUtil._toastLoading = new Toast({autoClose: false, msg: 222}, $con), 150);
	},
	_endLoading: function () {
		if (ServerUtil._toastLoading) {
			const minShowToast = 1500
			const time = new Date().getTime()

			setTimeout(
				() => {
					if (ServerUtil._toastLoading) {
						ServerUtil._toastLoading.close()
						ServerUtil._toastLoading = null
						ServerUtil._timoutLoading && clearTimeout(ServerUtil._timoutLoading)
						ServerUtil._timoutLoading = null
					}
				},
				minShowToast - (time - ServerUtil._preTimeLoading - 300)
			)
		} else {
			ServerUtil._timoutLoading && clearTimeout(ServerUtil._timoutLoading)
			ServerUtil._timoutLoading = null
		}
	},
	/* -end-------------------------------------------- 请求 loading 适应显示 --------------------------------------------- */

	/* -start-------------------------------------------- 请求返回数据格式校验 --------------------------------------------- */
	resVerify: {
		// code 对照表
		codes: function () { },
		// 统一格式校验
		unify: function (name, res) {
			return new Promise((resolve, reject) => {
				// 返回数据是否存在
				if (!res) {
					reject()
					console.log(
						`%c接口返回校验 - 失败%c, ${name} 接口 res = ${res}`,
						logStyle.error,
						logStyle.default
					)
				}
				// 返回数据是否是 Object 类型
				else if (res.constructor !== Object) {
					reject()
					console.log(
						`%c接口返回校验 - 失败%c, ${name} 接口 res = ${res}`,
						logStyle.error,
						logStyle.default
					)
				}
				// code 是否存在
				else if (!res.code && res.code !== 0) {
					reject()
					console.log(
						`%c接口返回校验 - 失败%c, ${name} 接口 res.code = ${res.code}`,
						logStyle.error,
						logStyle.default
					)
				}
				// code 数据类型是否是 Number
				else if (res.code.constructor !== Number) {
					reject()
					console.log(
						`%c接口返回校验 - 失败%c, ${name} 接口 res.code = ${res.code}`,
						logStyle.error,
						logStyle.default
					)
				}
				// msg 是否存在
				else if (!res.msg && res.msg !== 0) {
					reject()
					console.log(
						`%c接口返回校验 - 失败%c, ${name} 接口 res.msg = ${res.msg}`,
						logStyle.error,
						logStyle.default
					)
				} else resolve(res)
			})
		},
		// 用户登录
		login: function (res) {
			return new Promise((resolve, reject) => {
				ServerUtil.resVerify
					.unify('login', res)
					.then(() => {
						if (!res.data || res.data.constructor !== Object) {
							reject()
							console.log(
								`%c接口返回校验 - 失败%c, login 接口 res.data = ${res.data}`,
								logStyle.error,
								logStyle.default
							)
						} else if (!res.data.token || res.data.token.constructor !== String) {
							reject()
							console.log(
								`%c接口返回校验 - 失败%c, login 接口 res.token = ${res.token}`,
								logStyle.error,
								logStyle.default
							)
						} else resolve(res)
					})
					.catch(reject)
			})
		}
	},
	/* -end-------------------------------------------- 请求返回数据格式校验 --------------------------------------------- */

	/**
	 * 账号密码登录
	 * @param {"用户名，邮箱或手机号格式"} account
	 * @param {"密码"} password
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	login: function (account = '', password = '', callback = function () { }, error = function () { }) {
		if (!pcUtil.isOnline()) {
			error('offline')
			return
		}
		ServerUtil._preLoading('login', $('body'))

		const host = ipc.sendSync('getGlobal', 'host')
		$.ajax({
			url: `${host}/api/pc/login/v2/account`,
			type: 'post',
			contentType: 'application/json',
			data: JSON.stringify({businessType:'login', account, password }),
			complete: ServerUtil._endLoading,
			success: callback,
			error: error
		})
	},
	/**
	 * 验证码登录
	 * @param {"手机号码"} phone
	 * @param {"验证码"} code
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	quickLogin: function (phone = '', code = '', callback = function () { }, error = function () { }) {
		if (!pcUtil.isOnline()) {
			error('offline')
			return
		}
		ServerUtil._preLoading('login', $('body'))

		const host = ipc.sendSync('getGlobal', 'host')
		$.ajax({
			url: `${host}/api/pc/login/phone/code`,
			type: 'post',
			data: { phone, code },
			complete: ServerUtil._endLoading,
			success: callback,
			error: error
		})
	},
	/**
	 * 退出登录
	 */
	logout: function () {
		pcUtil.ajax({ url: `/api/pc/login/out`, type: 'get' })
		window.localStorage.removeItem("processon_userKey")
		api.ipcRenderer.send('deleteUser', window.localStorage.getItem("processon_userPhone"))
		window.localStorage.removeItem("processon_userPhone")
		ipc.send('logout')
	},
	/**
	 * 重置密码
	 * @param {"手机号码"} account
	 * @param {"密码"} password
	 * @param {"验证码"} code
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	retrievePwd: function (
		account = '',
		password = '',
		code = '',
		callback = function () { },
		error = function () { }
	) {
		if (!pcUtil.isOnline()) {
			error('offline')
			return
		}

		const host = ipc.sendSync('getGlobal', 'host')
		$.ajax({
			url: `${host}/api/pc/user/reset/pwd`,
			type: 'post',
			data: { account, password, code },
			success: callback,
			error: error
		})
	},
	/**
	 * 获取微信登录二维码
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	getWechatQrcode: function (callback = function () { }, error = function () { }) {
		if (!pcUtil.isOnline()) {
			error('offline')
			return
		}
		// ServerUtil._preLoading("login", $("body"));

		const wxhost = ipc.sendSync('getGlobal', 'wxhost')
		$.ajax({
			// url: `${wxhost}/wechat/public/get_qrcode`,
			url: `${wxhost}/api/pc/wechat/qr`,
			type: 'GET',
			success: callback,
			error: error
		})
	},
	/**
	 * 查询微信登录结果
	 * @param {"sceneId"} sceneId
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	checkWechatScanPc: function (sceneId, callback = function () { }, error = function () { }) {
		if (!pcUtil.isOnline()) {
			error('offline')
			return
		}
		// ServerUtil._preLoading("login", $("body"));

		const wxhost = ipc.sendSync('getGlobal', 'wxhost')
		$.ajax({
			url: `${wxhost}/api/pc/wechat/scan/callback`,
			type: 'GET',
			cache: false,
			data: { sceneId: sceneId },
			success: callback,
			error: error
		})
	},
	/**
	 * 获取手机验证码
	 * @param {"验证码类型"} type ["signup": "注册", "bind": "绑定", "retrieve": "找回", "safe": "身份验证", "update_password": "修改密码", "quick_login": "手机验证码登录"]
	 * @param {"手机号"} phone
	 * @param {"腾讯滑块验证信息"} signup_ticket
	 * @param {"腾讯滑块验证信息"} randstr
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	getValidCode: function (
		type = '',
		phone = '',
		signup_ticket = '',
		randstr = '',
		callback = function () { },
		error = function () { }
	) {
		if (!pcUtil.isOnline()) {
			error('offline')
			return
		}

		const host = ipc.sendSync('getGlobal', 'host')

		$.ajax({
			url: `${host}/api/pc/user/v3/send/phone/code`,
			type: 'post',
			contentType: 'application/json',
			data: JSON.stringify({ type, phone, signupTicket: signup_ticket, randstr }),
			success: callback,
			error: error
		})
	},
	/**
	 * appleId登录
	 * @param {"token"} token
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	appleLogin: function (token, callback = function () { }, error = function () { }) {
		if (!pcUtil.isOnline()) {
			error('offline')
			return
		}
		ServerUtil._preLoading('login', $('body'))

		const host = ipc.sendSync('getGlobal', 'host')
		const cfg = ipc.sendSync('getGlobal', 'CONFIG') || {}
		const channelType = cfg.CHANNELTYPE === 'mas' ? 'app_store' : (cfg.CHANNELTYPE || 'po')
		$.ajax({
			url: host + '/api/pc/login/v3/apple',
			type: 'post',
			headers: {
				'Content-Type': 'application/json',
			},
			data: JSON.stringify({
				code: token,
				businessType: 'register',
				userSource: 'register',
				registerType: 'apple',
				terminalType: 'pc',
				channelType: channelType
			}),
			complete: ServerUtil._endLoading,
			success: callback,
			error: error
		})
	},
	/**
	 * qq登录
	 * @param {"token"} token
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	qqLogin: function (token, callback = function () { }, error = function () { }) {
		if (!pcUtil.isOnline()) {
			error('offline')
			return
		}
		ServerUtil._preLoading('login', $('body'))

		const host = ipc.sendSync('getGlobal', 'host')
		$.ajax({
			url: host + '/api/pc/login/qq',
			type: 'post',
			data: { accessToken: token },
			complete: ServerUtil._endLoading,
			success: callback,
			error: error
		})
	},
	/**
	 * 查询通知数量
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	notificationCount: function (callback = function () { }, error = function () { }) {
		pcUtil.ajax({
			url: '/api/pc/notification/count',
			type: 'get',
			detectLine: true,
			success: callback,
			error: error
		})
	},
	/**
	 * 获取通知列表
	 * @param {"接口请求"} params
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	notificationList: function (params = {}, callback = function () { }, error = function () { }) {
		pcUtil.ajax({
			url: '/api/pc/notification/getlist',
			type: 'get',
			data: params,
			detectLine: true,
			success: callback,
			error: error
		})
	},
	/**
	 * 删除所有通知
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	notificationRemoveAll: function (callback = function () { }, error = function () { }) {
		pcUtil.ajax({
			url: '/api/pc/notification/remove/all',
			type: 'post',
			detectLine: true,
			success: callback,
			error: error
		})
	},
	/**
	 * 删除通知
	 * @param {"通知id"} notificationId
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	notificationRemove: function (
		notificationId = '',
		callback = function () { },
		error = function () { }
	) {
		pcUtil.ajax({
			url: '/api/pc/notification/remove',
			type: 'post',
			data: { id: notificationId },
			success: callback,
			error: error
		})
	},
	/**
	 * 标记通知为已读
	 * @param {"通知id"} notificationId
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	notificationRead: function (
		notificationId = '',
		callback = function () { },
		error = function () { }
	) {
		pcUtil.ajax({
			url: '/api/pc/notification/read',
			type: 'post',
			data: { notificationId },
			success: callback,
			error: error
		})
	},
	/**
	 * 标记所有通知为已读
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	notificationReadAll: function (callback = function () { }, error = function () { }) {
		pcUtil.ajax({
			url: '/api/pc/notification/read/all',
			type: 'post',
			success: callback,
			error: error
		})
	},
	/**
	 * 团队文件/文件夹移动到回收站
	 * @param {"文件类型"} fileType ["folder", "chart"]
	 * @param {"文件id"} fileId
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	teamDelNote: function (
		fileType = '',
		fileId = '',
		callback = function () { },
		error = function () { }
	) {
		pcUtil.ajax({
			url: '/team/del_note',
			data: { fileType, fileId, resource: '' },
			success: callback,
			error: error
		})
	},
	/**
	 * 退出协作
	 * @param {"文件/文件夹Id"} id
	 * @param {"类型"} type ["chart": "文件", "folder": "文件夹"]
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	quitColla: function (id = '', type = 'chart', callback = function () { }, error = function () { }) {
		pcUtil.ajax({
			url: '/api/pc/collaboration/quit/colla',
			data: { id, type },
			success: function (res) {
				if (res && res.code == 200) callback(res)
				else error(res)
			},
			error: error
		})
	},
	/**
	 * 收藏/取消收藏文件
	 * @param {"文件Id"} chartId
	 * @param {"类型"} chartType ["chart": "文件", "template": "模板"]
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	favourite: function (
		chartId = '',
		chartType = 'chart',
		callback = function () { },
		error = function () { }
	) {
		pcUtil.ajax({
			url: '/api/pc/view/favourite/chart',
			data: { chartId, chartType },
			success: function (res) {
				if (res && res.code == 200) callback(res)
				else error(res)
			},
			error: error
		})
	},
	/**
	 * 将文件导出至个人文件根目录中
	 * @param {"文件id"} chartId
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	movetouser: function (chartId = '', callback = function () { }, error = function () { }) {
		pcUtil.ajax({
			url: '/folder/movetouser',
			data: { chartId },
			success: callback,
			error: error
		})
	},
	/**
	 * 【复制/移动】获取文件夹结构
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	getfolderdata: function (callback = function () { }, error = function () { }) {
		pcUtil.ajax({
			type: "get",
			url: '/api/pc/folder/get/all',
			success: function (res) {
				if (res && res.code == 200) callback(res.data)
				else error(res)
			},
			error: error
		})
	},
	/**
	 * 获取通知内容【？】
	 * @param {"通知id"} notificationId
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	notificationMsg: function (
		notificationId = '',
		callback = function () { },
		error = function () { }
	) {
		pcUtil.ajax({
			url: '/notification/msg',
			data: { notificationId },
			success: callback,
			error: error
		})
	},
	/**
	 * 我的文件列表
	 * @param {"文件夹id"} folderId [默认 root]
	 * @param {"文件类型"} category [默认 root]
	 * @param {"排序字段"} sidx ["title": "标题", "lastModify": "最后修改时间", "createTime": "创建时间", "free": "自定义排序"]
	 * @param {"排序规则("} sort ["asc": "正序", "desc": "倒序"]
	 * @param {"条件检索"} keyword []
	 * @param {"当前页"} page ["1"]
	 * @param {"每页行数"} pageSize ["15"]
	 * @param {"返回请求返回的数据"} callback
	 * @param {"失败回调"} error
	 */
	loadFiles: function (
		folderId = 'root',
		category = '',
		sidx = 'lastModify',
		sort = 'desc',
		keyword = '',
		page = '1',
		pageSize = '15',
		callback = function () { },
		error = function () { }
	) {
		pcUtil.ajax({
			url: '/api/pc/folder/load/files',
			type: 'get',
			data: { folderId, category, sidx, sort, keyword, page, pageSize },
			timeout: 60000,
			success: function (res) {
				callback(res)
			},
			error: function (err) {
				callback(err)
			}
		})
	},
	//我的最近列表
	loadHistory: function (params = {}, callback = () => { }) {
		pcUtil.ajax({
			url: '/api/pc/folder/history/files',
			type: 'get',
			data: params,
			timeout: 60000,
			success: function (res) {
				callback(res)
			},
			error: function (err) {
				callback(err)
			}
		})
	},
	moveCharts: function (params = {}, callback = () => { }) {
		// todo personal 替换 pc
		pcUtil.ajax({
			url: '/api/personal/folder/move',
			type: 'post',
			data: params,
			timeout: 60000,
			success: function (res) {
				callback(res)
			},
			error: function (err) {
				callback(err)
			}
		})
	},
	/**
	 * 协作文件列表
	 * @param {"文件夹id"} folderId [默认 "root"]
	 * @param {"当前页"} page ["1"]
	 * @param {"每页行数"} pageSize ["15"]
	 * @param {"返回请求返回的数据"} callback
	 * @param {"失败回调"} error
	 */
	getCollaborationFiles: function (
		folderId = 'root',
		page = '1',
		pageSize = '15',
		callback = function () { },
		error = function () { },
		isWithMe = 1 //1 与我协作 0 我的协作
	) {
		if (!pcUtil.isOnline()) {
			error('offline')
			return
		}

		pcUtil.ajax({
			url: isWithMe ? '/api/pc/folder/collaboration/files' : '/api/personal/folder/my/collaboration/page',
			type: 'get',
			data: { folderId, page, pageSize },
			complete: ServerUtil._endLoading,
			success: (res) => {
				if (res && res.code == 200) callback(res.data)
				else error('error')
			},
			error: () => error('error')
		})
	},
	/**
	 * 收藏文件列表
	 * @param {"当前页"} page ["1"]
	 * @param {"每页行数"} pageSize ["15"]
	 * @param {"文件类型"} chartType [默认 "chart": "文件", "template": "模板"]
	 * @param {"返回请求返回的数据"} callback
	 * @param {"失败回调"} error
	 */
	getFavFiles: function (
		page = '1',
		pageSize = '15',
		chartType = '',
		callback = function () { },
		error = function () { }
	) {
		if (!pcUtil.isOnline()) {
			error('offline')
			return
		}

		pcUtil.ajax({
			url: '/api/pc/folder/fav/files',
			type: 'get',
			data: { chartType, page, pageSize },
			complete: ServerUtil._endLoading,
			success: (res) => {
				if (res && res.code == 200) callback(res.data)
				else error('error')
			},
			error: () => error('error')
		})
	},
	/**
	 * 回收站文件列表
	 * @param {"用户Id"} userId []
	 * @param {"文件夹Id"} folderId []
	 * @param {"当前页"} page ["1"]
	 * @param {"每页行数"} pageSize ["15"]
	 * @param {"返回请求返回的数据"} callback
	 * @param {"失败回调"} error
	 */
	getTrashFiles: function (
		params,
		callback = function () { },
		error = function () { }
	) {
		if (!pcUtil.isOnline()) {
			error('offline')
			return
		}

		if (!params.userId) params.userId = UserOperation.getUk()
		pcUtil.ajax({
			url: '/api/pc/folder/trash/files',
			type: 'get',
			data:params,
			success: (res) => {
				callback(res)
			},
			error: () => error('error')
		})
	},
	/**
	 * 通过文件 id 获取线上文件 &&文件定义
	 * @param {"文件id"} chartId
	 * @param {"返回 chart & def & favourite"} callback
	 * @param {"请求错误的返回"} error
	 * @param {"不将返回的数据保存到数据库"} stopSave
	 */
	getChartDefById: function (
		chartId,
		defId,
		callback = function () { },
		error = function () { },
		stopSave = false
	) {
		if (!pcUtil.isOnline() || chartId.length < 12) {
			error('offline')
			return
		}
		pcUtil.ajax({
			url: `/api/personal/diagraming/get/chart/def`,
			type: 'get',
			data: { chartId, defId },
			success: function (res) {
				if (res && res.code == 200) {
					const chartDef = { id: res.data.chart.definitionId, definition: res.data.def }
					FileDatabase.updateChart(
						res.data.chart.chartId,
						false,
						{ schema: res.data.chart.schema, favourite: res.data.chart.favourite },
						() => {
							if (!stopSave) {
								FileDatabase.saveChartDef(defId, chartDef.definition, callback)
							} else callback(chartDef)
						}
					)
				} else error('error')
			},
			error: (err) => error('error')
		})
	},
	/**
	 * 通过文件 id 获取线上文件 &&文件定义
	 * @param {"文件id"} chartId
	 * @param {"返回 chart & def & favourite"} callback
	 * @param {"请求错误的返回"} error
	 * @param {"不将返回的数据保存到数据库"} stopSave
	 */
	getChartDefByIdForMarkdown: function (
		chartId,
		defId,
		callback = function () { },
		error = function () { },
		stopSave = false
	) {
		if (!pcUtil.isOnline() || chartId.length < 12) {
			error('offline')
			return
		}
		pcUtil.ajax({
			url: `/api/personal/diagraming/get/chart/def/deltas`,
			type: 'get',
			data: { chartId, defId },
			success: function (res) {
				if (res && res.code == 200) {
					const def = JSON.parse(res.data.def).def
					const chartDef = { id: res.data.chart.definitionId, definition: def }
					FileDatabase.updateChart(
						res.data.chart.chartId,
						false,
						{ schema: res.data.chart.schema, favourite: res.data.chart.favourite },
						() => {
							if (!stopSave) {
								// DBUtil.save("charts_def", chartDef, callback)
								FileDatabase.saveChartDef(defId, chartDef.definition, callback)
							} else callback(chartDef)
						}
					)
				} else error('error')
			},
			error: (err) => error('error')
		})
	},
	/**
	 * 通过文件 id 获取线上文件数据
	 * @param {"文件id"} chartId
	 * @param {"返回 chart"} callback
	 * @param {"请求错误的返回"} error
	 * @param {"其他参数：notS(不保存本地)"} op
	 */
	getChartById: function (chartId, callback = function () { }, error = function () { }, op = {}) {
		error = error || function () { }
		if (!pcUtil.isOnline()) {
			error('offline')
			return
		}
		pcUtil.ajax({
			url: `/api/pc/diagraming/chart`,
			type: 'post',
			data: { chartId },
			success: function (res) {
				if (res && res.code == 200) {
					const { chart } = res.data
					chart.id = chart.chartId
					chart.thumbnail = chart.thumbnail
					chart.parentDeleted = false
					chart.deleted = false
					chart.userId = chart.owner ? chart.owner.userId : chart.userId
					callback(chart)
				} else error(res)

			},
			error: error
		})
	},
	// /**
	//  * 获取文件预览页线上地址
	//  * @param {"文件id"} chartId
	//  * @param {"图形类型"} category
	//  * @returns {"返回预览页面地址"}
	//  */
	// getOnlineViewUrl:function(chartId, category){
	// 	let linkUrl;
	// 	// 思维导图本地编辑器地址
	// 	if (category.indexOf('mind') >= 0) linkUrl = `./v5_editor/source/compile/mindmap/view.html?chartId=${chartId}`;
	// 	// 思维笔记本地编辑器地址
	// 	else if(category.indexOf('outline') >= 0) linkUrl = `./v5_editor/source/compile/outline/view.html?chartId=${chartId}`;
	// 	// 流程图本地编辑器地址
	// 	else if(category.indexOf('flow') >= 0) linkUrl = `./v5_editor/source/compile/diagrams/view.html?chartId=${chartId}`;
	// 	// 鱼骨图本地编辑器地址
	// 	else if(category == "uncategorized") linkUrl = `./v5_editor/source/compile/diagrams/view.html?chartId=${chartId}`;
	// 	// 其他新增类型依靠思维导图展示（如：树形图）
	// 	else linkUrl = `./v5_editor/source/compile/diagrams/view.html?chartId=${chartId}`;
	//
	// 	return `${linkUrl}`;
	// },
	/**
	 * 判断文件数量是否超出
	 * @param {"返回 user 数据"} callback
	 * @param {"是否开启文件不足提示"} isToast [默认: false]
	 */
	hasFileNum: function (callback = function () { }, isToast) {
		UserOperation.getUserPrivilege((user) => {
			const { member, orgMember, usedFileCount, fileCount, balanceUserdFileCount } = user

			// 会员用户文件数量没有上线
			if (member || orgMember) callback(user)
			else if (pcUtil.isOnline() && usedFileCount >= fileCount && isToast)
				new Toast({ msg: '您的文件数量不足，无法创建新的文件', type: 'error' })
			// else if(!pcUtil.isOnline() && (usedFileCount + balanceUserdFileCount) >= fileCount && isToast) new Toast({msg:"您的文件数量不足，无法创建新的文件", type: "error"});
			else callback && callback(user)
		})
	},
	/**
	 * 获取线上文件定义版本号
	 * @param {"文件Id"} chartId
	 * @param {"返回"} callback
	 * @param {"错误返回"} error
	 */
	getDefVersion: function (chartId, canvasId, callback = function () { }, error = function () { }) {
		pcUtil.ajax({
			url: '/api/personal/chart/get/canvas/v2/def/version', //todo 改成 pc
			type: 'get',
			data: { chartId, canvasId },
			success: function (res) {
				if (res && res.code == 200) callback(res.data)
				else error(res)
			},
			error: error
		})
	},
	/**
	 * 添加历史版本
	 * @param {"文件Id"} chartId
	 * @param {"备注"} remark
	 * @param {"文件定义"} def
	 * @param {"返回"} callback
	 * @param {"返回"} error
	 */
	addDefVersion: function (
		chartId,
		remark = '客户端自动同步',
		def,
		canvasId,
		callback = function () { },
		error = function () { }
	) {
		if (remark == null || remark == '') remark = '客户端自动同步'

		pcUtil.ajax({
			contentType: 'application/json',
			url: '/api/personal/hst/ver/auto/add',
			// todo 多画布需要传 canvasId 画布id,单画布时默认是chartId值，多画布时不能为空
			data: JSON.stringify({
				chartId: chartId,
				def: def,
				canvasId,
				terminal: 'web'
			}),
			type: 'post',
			success: function (res) {
				if (res && res.code == 200) callback(res)
				else error(res)
			},
			error: error
		})
	},
	/**
	 * 发布/取消发布 文件
	 * @param {"文件Id"} chartId
	 * @param {"操作类型"} status
	 * @param {"成功返回"} callback
	 * @param {"失败返回"} error
	 */
	publish: function (chartId, status, callback = function () { }, error = function () { }) {
		if (!pcUtil.isOnline()) {
			error('offline')
			return
		}
		pcUtil.ajax({
			url: '/api/pc/folder/publish',
			data: { id: chartId, status },
			success: function (res) {
				if (res.result == 'error_ticket') new Toast({ type: 'error', msg: '操作频繁，请稍后重试' })
				else if (res.result == 'error_owner') new Toast({ type: 'error', msg: '操作失败[200]' })
				else if (res.result == 'error_ticket') new Toast({ type: 'error', msg: '操作失败[201]' })
				else if (res.result == 'tag') new Toast({ type: 'error', msg: '操作失败[202]' })
				else if (res.result == 'error_des') new Toast({ type: 'error', msg: '操作失败[203]' })
				else if (res.result == 'error_text') new Toast({ type: 'error', msg: '操作失败[204]' })
				else if (res.result == 'error') new Toast({ type: 'error', msg: '操作失败' })
				else if (res.result == 'error_clone')
					new Toast({ type: 'error', msg: '不支持发布克隆文件' })
				else if (res.result == 'rename') new Toast({ type: 'error', msg: '不支持发布未命名文件' })
				else if (res.result == 'error_activity')
					new Toast({ type: 'error', msg: '活动模板不支持取消发布' })
				else callback(res)
			}
		})
	},
	/**
	 * 获取用户信息
	 * @param {"成功返回"} callback
	 * @param {"失败返回"} error
	 */
	userInfo: function (callback = function () { }, error = function () { }) {
		pcUtil.ajax({
			url: '/api/pc/user/info',
			type: 'get',
			success: callback,
			error: error
		})
	},
	/**
	 * 获取用户会员状态和文件数量
	 * @param {"成功返回"} callback
	 * @param {"失败返回"} error
	 */
	userPrivilege: function (callback = function () { }, error = function () { }) {
		pcUtil.ajax({
			url: '/api/pc/user/privilege',
			type: 'get',
			success: callback,
			error: error
		})
	},
	/**
	 * 推送文件定义指令
	 * @param {"指令"} params
	 * @param {"成功返回"} callback
	 * @param {"失败返回"} error
	 */
	syncChartDefStreamPush: function (
		params = {},
		callback = function () { },
		error = function () { }
	) {
		pcUtil.ajax({
			url: '/client/pc/sync_chart_def_stream_push',
			type: 'post',
			data: params,
			success: callback,
			error: error
		})
	},
	/**
	 * 文件搜索
	 * @param {"标题名称"} title
	 * @param {"文件类型"} category
	 * @param {"文件类型"} type ["my": "我的文件", "与我协作": "colla"]
	 * @param {"搜索结果是否保存本地"} save
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	searchGlobalFiles: function (
		title = '',
		category = '',
		type = '',
		save = false,
		callback = function () { },
		error = function () { }
	) {
		pcUtil.ajax({
			url: `/api/personal/folder/global_files`,
			type: 'get',
			data: { title, category, type },
			success: function (res) {
				if (res && res.code == 200) {
					if (save) FileDatabase.compareCharts(res.data.charts, () => callback(res))
					else callback(res)
				} else error('error')
			},
			error: error
		})
	},
	/**
	 * 根据chartId 返回多画布信息
	 * @param {"文件ID/文件夹ID ,用逗号分隔"} ids
	 * @param {"数据类型"} type ["chart", "folder"]
	 * @param {"返回"} callback
	 * @param {"请求错误的返回"} error
	 */
	getCanvasInfoByChartId: function (
		chartId = '',
		callback = function () { },
		error = function () { }
	) {
		pcUtil.ajax({
			url: `/api/personal/canvas/get/chartdefids`,
			type: 'get',
			data: { chartId },
			success: function (res) {
				if (res && res.code == 200) {
					callback(res.data)
				} else error('error')
			},
			error: error
		})
	},
	/**
	 * 新增画布
	 *
	 */
	createCanvas: function (chartId, callback, error) {
		pcUtil.ajax({
			url: `/api/personal/canvas/create`, // todo
			type: 'post',
			data: { chartId },
			success: function (res) {
				if (res && res.code == 200) {
					callback(res.data)
				} else error('error')
			},
			error: error
		})
	},
	/**
	 * 删除画布
	 *
	 */
	deletedCanvas: function (chartId, canvasId, callback, error) {
		pcUtil.ajax({
			url: `/api/personal/canvas/delete/canvas`,
			type: 'post',
			data: { chartId, canvasId },
			success: function (res) {
				if (res && res.code == 200) {
					callback(res.data)
				} else error('error')
			},
			error: error
		})
	},
	/**
	 * 推送多画布指令
	 *
	 *
	 */
	pushBaseMultipleInstruct: function (msgStr, callback, error) {
		pcUtil.ajax({
			url: `/api/pc/client/stream/canvas/push`,
			type: 'post',
			data: { msgStr },
			success: function (res) {
				if (res && res.code == 200) {
					callback(res.data)
				} else error('error')
			},
			error: error
		})
	},
	/**
	 * 拉取同步后的数据 todo
	 *
	 */
	getChartCanvas: function (chartId, callback, error) {
		pcUtil.ajax({
			url: `/api/pc/canvas/get/chartCanvas`,
			type: 'get',
			data: { chartId },
			success: function (res) {
				if (res && res.code == 200) {
					callback(res.data)
				} else error('error')
			},
			error: error
		})
	},
	/**
	 * 复制画布
	 */
	folderCopy:function({fileId,targetFolderId},callback,error){
		pcUtil.ajax({
			url: `/api/personal/folder/copy`,
			type: 'post',
			data: { fileType:'folder',fileId, targetFolderId },
			success: function (res) {
				if (res && res.code == 200) {
					callback(res.data)
				} else error(res?.msg || '未知错误')
			},
			error: error
		})
	},
	copyCanvas: function ({ chartId, canvasId }, callback, error = () => { }) {
		pcUtil.ajax({
			url: `/api/personal/canvas/copy`,
			type: 'post',
			data: { chartId, canvasId },
			success: function (res) {
				if (res && res.code == 200) {
					callback(res.data)
				} else error('error')
			},
			error: error
		})
	},
	/**
	 * 重命名
	 */

	updateCanvasTitle: function ({ chartId, canvasId, title }, callback, error = () => { }) {
		pcUtil.ajax({
			url: `/api/personal/canvas/update/title`,
			type: 'post',
			data: { chartId, canvasId, title },
			success: function (res) {
				if (res && res.code == 200) {
					callback(res.data)
				} else error(res)
			},
			error: error
		})
	},
	/**
	 * 画布移动
	 */

	updateCanvasSort: function ({ chartId, source, target }, callback, error = () => { }) {
		pcUtil.ajax({
			url: `/api/personal/canvas/sort`,
			type: 'post',
			data: { chartId, source, target },
			success: function (res) {
				if (res && res.code == 200) {
					callback(res.data)
				} else error(res)
			},
			error: error
		})
	},
	getFloderAndfiles: function ({folderId,pageCur,pageSize}, callback, error) {
		pcUtil.ajax({
			url: `/api/personal/folder/load_files`, //todo pc?
			type: 'get',
			data: {
				folderId,
				sidx: 'lastModify',
				sort: 'desc',
				page:pageCur,
				pageSize
			},
			success: function (res) {
				if (res && res.code == 200) {
					callback(res.data)
				} else error('error')
			},
			error: error
		})
	},
	/**删除文件 文件夹 */
	deletedFiles: function (params, callback, error = () => { }) {
		pcUtil.ajax({
			url: `/api/personal/folder/remove_from_trash`,
			type: 'post',
			data: params,
			success: function (res) {
				if (res && res.code == 200) {
					callback(res.data)
				} else error('error')
			},
			error: error
		})
	},
	restoreFiles: function ({ fileType, fileId }, callback, error = () => { }) {
		pcUtil.ajax({
			url: `/api/personal/folder/restore`,
			type: 'post',
			data: { fileType, fileId },
			success: function (res) {
				if (res && res.code == 200) {
					callback(res)
				} else error('error')
			},
			error: error
		})
	},
	createFolder: function (params, callback, error) {
		pcUtil.ajax({
			url: `/api/personal/folder/new`,
			type: 'post',
			data: { folderId: params.parentId, title: params.folderTitle },
			success: function (res) {
				if (res && res.code == 200) {
					callback(res)
				} else error('error')
			},
			error: error
		})
	},
	deleteFileOrFolder: function (params, callback, error) {
		pcUtil.ajax({
			url: `/api/personal/folder/to_trash`,
			type: 'post',
			data: params,
			success: function (res) {
				if (res && res.code == 200) {
					callback(res)
				} else error('error')
			},
			error: error
		})
	},

	batchOperation: function (params, callback,error) {
		pcUtil.ajax({
			url: `/api/personal/folder/batch_operation`,
			type: 'post',
			data: params,
			success: function (res) {
				if (res && res.code == 200) {
					callback(res)
				} else error('error')
			}
		})
	},
	moveOperation: function (params, callback,error) {
		pcUtil.ajax({
			url: `/api/personal/folder/move`,
			type: 'post',
			data: params,
			success: function (res) {
				if (res && res.code == 200) {
					callback(res)
				} else error('error')
			}
		})
	},
	folderRename: function (params, callback) {
		pcUtil.ajax({
			url: `/api/pc/folder/rename`,
			type: 'post',
			data: params,
			success: function (res) {
				if (res && res.code == 200) {
					callback(res)
				} else error('error')
			}
		})
	},
	chartRename: function (params, callback) {
		pcUtil.ajax({
			url: `/api/pc/chart/rename`,
			type: 'post',
			data: params,
			success: function (res) {
				if (res && res.code == 200) {
					callback(res)
				} else error('error')
			}
		})
	},
	createChart: function (params, callback, error) {
		pcUtil.ajax({
			url: `/api/personal/diagraming/create`,
			type: 'post',
			data: { folderId: params.folderId, category: params.category },
			success: function (res) {
				if (res && res.code == 200) {
					callback(res)
				} else {
          new Toast({type:'error' ,msg:res.msg})
					error('error')
				}
			},
			error: error
		})
	},
	saveSort: function (params, callback, error) {
		pcUtil.ajax({
			url: `/api/personal/folder/sort`,
			type: 'post',
			data: {fileId:params.fileId, index:params.index,fileType:params.fileType},
			success: function (res) {
				if (res && res.code == 200) {
					callback(res)
				} else error('error')
			},
			error: error
		})
	},
	/**
	 * 通过文件 id 获取线上文件数据
	 * @param {"文件id"} chartId
	 * @param {"返回 chart"} callback
	 * @param {"请求错误的返回"} error
	 * @param {"其他参数：notS(不保存本地)"} op
	 */
	getChartByShare: function (chartId, callback = function () { }, error = function () { }, op = {}) {
		error = error || function () { }
		if (!pcUtil.isOnline()) {
			error('offline')
			return
		}
		pcUtil.ajax({
			url: `/api/personal/collaboration/join_link/${chartId}`,
			type: 'get',
			success: function (res) {
				if (res && res.code == 200) {
					callback(res.data)
				} else error(res)

			},
			error: error
		})
	},
}

export default ServerUtil
