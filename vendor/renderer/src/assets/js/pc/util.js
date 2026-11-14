var pcUtil = {};
window.oldAjax = $.ajax
pcUtil.setCookie = function (c_name, value, expiredays) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + expiredays);
	document.cookie = c_name + "=" + escape(value) + ((expiredays == null) ? "" : ";path=/;expires=" + exdate.toGMTString());
};
pcUtil.getCookies = function (c_name) {
	if (document.cookie.length > 0) {
		var c_start = document.cookie.indexOf(c_name + "=");
		if (c_start != -1) {
			c_start = c_start + c_name.length + 1;
			var c_end = document.cookie.indexOf(";", c_start);
			if (c_end == -1) {
				c_end = document.cookie.length;
			}
			return unescape(document.cookie.substring(c_start, c_end));
		}
	}
	return ""
};
/**
 * 封装的ajax，对$.ajax结果进行了过滤
 *
 * @param {Object}
 *            options
 */
pcUtil.ajaxTimeoutObj = [];
pcUtil.ajax = function (options) {
	if (!navigator.onLine) {
		let kt = window.localStorage.getItem("keyt") || 0;

		let time = new Date().valueOf();
		let calc = (time - kt) / 1000 / 3600 / 24;

		//默认7天后过期(cookie)
		if (calc > 14 || calc < 0) {
			window.localStorage.removeItem("processon_token");
			window.localStorage.removeItem("processon_userKey");
			return;
		}
	}
	let host = ipc.sendSync('getGlobal', "host");
	let id = window.localStorage.getItem("processon_userKey");
	let token = window.localStorage.getItem("processon_token");
	// let clientId = window.localStorage.getItem("pc_clientId");
	let clientId = "";
	let timeout = 30000;
	let dataType = "json";

	if (options.timeout) timeout = options.timeout;
	if (options.dataType) dataType = options.dataType;

	if (options.onSend) {
		if (options.onSend() == false) {
			return;
		}
	}
	var defaults = { type: "POST", processData: true, contentType: 'application/x-www-form-urlencoded; charset=UTF-8',cache:false };
	options = $.extend(defaults, options);

	if (options.url.indexOf("sync_stream_pull") > -1 || options.url.indexOf("sync_stream_push") > -1) {
		ipc.send("exportLog", { str: `同步 - 请求, data = ${JSON.stringify(options.data)}` });
	}
	let _ajax = false;
	_ajax = window.oldAjax({
		url: options.url.indexOf('http') >= 0 ? options.url : host + options.url,
		type: options.type,
		traditional: true,
		dataType: dataType,
		timeout: timeout,
		data: options.data,
		cache:	options.cache,
		headers: {
			ajaxRequestSource: 'pcClient',
			...options.headers
		},
		processData: options.processData,
		contentType: options.contentType,
		beforeSend: function (xhr) {
			xhr.setRequestHeader("x-requested-with", "XMLHttpRequest");
			xhr.setRequestHeader("token", token);
			// xhr.setRequestHeader("User-Agent", "PC");
		},
		complete: function (xhr, status) {
			options.complete && options.complete();
			try {
				let result = JSON.parse(xhr.responseText).result;
				if (result == "token_error") {
					Toast && new Toast({ type: "error", msg: "登录过期，请重新登录" });

					// 退出登录
					let host = ipc.sendSync('getGlobal', "host");
					window.oldAjax({ url: `${host}/client/pc/out`, type: "post" });
					setTimeout(() => {
						window.localStorage.removeItem("processon_userKey");
						ipc.send("logout");
					}, 2000);
				}
			}
			catch (e) { }
		},
		success: function (data) {
			if (options.url.indexOf("sync_stream_pull") > -1 || options.url.indexOf("sync_stream_push") > -1) {
				ipc.send("exportLog", { str: `同步 - 请求, success-res = ${JSON.stringify(data)}` });
			}

			if (data.code == 403 || data.code == 408) {

				window.localStorage.removeItem("processon_token");
				window.localStorage.removeItem("processon_userKey");
				try {
					if (options.success) {
						options.success(data);
					}
					new Toast({ msg: "登录过期，请重新登录", type: "error" });
					ipc.send("logout");
				}
				catch (e) { }
				return;
			}

			if (data.error == "error" || data.code == '510' || data.code == '509') {
				if (data.msg && data.msg != "" && data.msg != "调用失败") new Toast({ msg: data.msg, type: "error" });
				if (options.error) {
					options.error(data);
				}
			} else if (data.error == "notlogin") {
				// 由AOP拦截处理的登录验证
				// if(options.loginValidate){
				// 	options.loginValidate(data);
				// }
				// pcUtil.loginWindow("open", function(){
				// 	// 登录成功再次执行本次请求.
				// 	pcUtil.ajax(options);
				// });
			} else {
				if (options.success) {
					options.success(data);
				}
			}
		},
		error: function (data) {
			if (options.url.indexOf("sync_stream_pull") > -1 || options.url.indexOf("sync_stream_push") > -1) {
				ipc.send("exportLog", { str: `同步 - 请求, error-res = ${JSON.stringify(data)}` });
			}

			if (data.statusText == "timeout" || data.statusText == "error") options.error && options.error(data.statusText, options);
			else options.error && options.error(data, options);
		}
	});
	return _ajax;
};
pcUtil.get = function (url, params, callback) {
	let host = ipc.sendSync('getGlobal', "host");
	let id = window.localStorage.getItem("processon_userKey");
	let token = window.localStorage.getItem("processon_token");
	let clientId = window.localStorage.getItem("pc_clientId");
	let data = { uk: id, token, clientId, ...params };

	window.oldAjax({
		url: url.startsWith('http') ? url : host + url,
		type: "GET",
		data: data,
		success: function (data) {
			if (data.error == "error") {
				$.simpleAlert("暂时无法处理您的请求，请稍候重试。", "error", 3000);
			} else if (data.error == "notlogin") {
				// 由AOP拦截处理的登录验证
				pcUtil.loginWindow("open", function () {
					// 再次执行
					pcUtil.get(url, params, callback);
				});
			} else {
				callback(data);
			}
		},
		error: function (data) {
			// $.simpleAlert("<@i18n resource='global.error'/>","error",3000);
		}
	});
};
/**
 * 用户头像补全
 *
 * @param ""
 * 			  uk 用户id
 * */
pcUtil.Avatar = function (uk) {
	let host = ipc.sendSync('getGlobal', "avatar");
	// if(process.env.NODE_ENV == 'devTools') host = ipc.sendSync('getGlobal',"host");

	return `${host}/${uk}.png?t=${new Date().getTime()}`;
};

// json数字精度补全
pcUtil.precision = function (json) {
	return json.replace(/\"streamId\":(\d+)/g, '"streamId": "$1"').replace('\\"context\\":\\"\"', '\\"context\\":\\"\\"}\"');
};

/**
 * 头部弹窗插件
 *
 * @param {}
 *            content 显示的内容
 * @param {}
 *            type 显示的样式（top_success/ top_error）
 * @param {}
 *            delay 默认7000
 */
pcUtil.globalTopTip = function (content, type, delay, dom, noarrow) {
	if (Toast) {
		let t = "main";
		if (type.indexOf("success")) t = "success";
		else if (type.indexOf("error")) t = "success";
		else if (type.indexOf("warning")) t = "warning";

		new Toast({ type: t, msg: content, time: delay }, dom);
		return;
	}
	if (typeof content == "undefined") {
		return;
	}
	if (delay == null) {
		delay = 5000;
	}
	if (type == null) {
		type = "top_success";
	}
	var globalTopTipBox = $("#global_top_dialog");
	if (globalTopTipBox.length > 0) {
		globalTopTipBox.remove();
	}
	globalTopTipBox = $('<div id="global_top_dialog" class="global_top_dialog"><div class="left_arrow"></div>' + content + '<div class="right_arrow"></div></div>').appendTo("body");
	globalTopTipBox.addClass(type);
	if (noarrow) {
		globalTopTipBox.find(".left_arrow").remove();
		globalTopTipBox.find(".right_arrow").remove();
		globalTopTipBox.addClass("noarrow");
	}
	var outerW = globalTopTipBox.outerWidth();
	if (dom) {
		globalTopTipBox.css("top", $(dom).offset().top + "px");
	} else {
		if ($("#header").length == 0) {
			globalTopTipBox.css("top", "0px");
		}
	}
	globalTopTipBox.css({
		"margin-left": -(outerW * 0.5) + "px"
	}).show();
	setTimeout(function () {
		globalTopTipBox.addClass("show");
		setTimeout(function () {
			globalTopTipBox.removeClass("show");
			setTimeout(function () {
				globalTopTipBox.fadeOut("slow").remove();
			}, 250);
		}, delay);
	}, 50);
};
/**
 * 全局gloabaltip
 *
 * @param {}
 *            content 显示的内容 type 显示的样式（left-bot-default） delay 默认5000
 */
pcUtil.globalLeftTip = function (params) {
	var options = params;
	if (typeof options.content == "undefined") {
		return;
	}
	if (!options.delay) {
		options.delay = 5000;
	}
	if (options.type == null) {
		options.type = "left-bot-default";
	}
	var globalTopTipBox = $("#global-leftbot-dialog");
	if (globalTopTipBox.length > 0) {
		globalTopTipBox.remove();
	}
	globalTopTipBox = $('<div id="global-leftbot-dialog" class="global-leftbot-dialog">' + options.content + '</div>').appendTo("body");
	globalTopTipBox.addClass(options.type);
	globalTopTipBox.show();
	setTimeout(function () {
		globalTopTipBox.addClass("show");
		setTimeout(function () {
			globalTopTipBox.removeClass("show");
			setTimeout(function () {
				globalTopTipBox.fadeOut("slow").remove();
			}, 250);
		}, options.delay);
	}, 50);
};


/**
 * 全局顶部loading效果 author lyp
 *
 * @param options
 */
pcUtil.loading = function (options) {
	var defaults = {
		content: "loading...",
		show: 1000,
		delay: 0,
		model: false
	};
	if (typeof (options) == "string" && options == "close") {
		$("#top_loading_tip").remove(); this.indexOf(elem)
		$("#dialog_model").remove()
		return;
	};
	options = $.extend(defaults, options);
	if ($("#top_loading_tip").length > 0) {
		$("#top_loading_tip").remove();
	}
	var $html = $("<div id='top_loading_tip' class='loadingTop'><p><b>" + options.content + "</b></p></div>").appendTo("body");
	if (options.model) {
		$("body").append("<div id='dialog_model'></div>");
		$("#dialog_model").css({
			"width": "100%", "height": "100%", "position": "fixed", "top": 0, "left": 0,
			"z-index": options.zIndex - 1, "opacity": 0.6, "background": "#FFF", "display": "none"
		});
	}
	if (typeof (options.show) == "number") {
		$("#top_loading_tip").delay(options.delay).show(0, function () {
			if (options.model)
				$("#dialog_model").show();
		}).delay(options.show).fadeOut(500, function () {
			if (options.model)
				$("#dialog_model").hide();
		});
	}
	else if (options.show === true) {
		$("#top_loading_tip").delay(options.delay).show(0, function () {
			if (options.model)
				$("#dialog_model").show();
		});
	}
};
/**
 * loadingball
 *
 * @param {}
 *            {close:true,con:$dom,css:{background:'#aaa',width:'10px',height:'10px'}}
 *            样式在global.css
 */
pcUtil.loadingball = function (params) {
	if (params.close) {
		$('.ball-spinner').hide();
		return;
	}
	var $Dom = params.con;
	if (!$Dom) {
		$Dom = $('body');
	}
	var ballSpinner = $Dom.children('.ball-spinner');
	if (ballSpinner.length > 0) {
		ballSpinner.show();
	} else {
		$('<div class="ball-spinner center-middle"><div class="ball1"></div><div class="ball2"></div><div class="ball3"></div>').appendTo($Dom);
	}
	if (params.css && typeof (params.css) == 'object') {
		$('.ball-spinner>div').css(params.css);
	}
};
pcUtil.messageNoPrivilege = function (content, dowhat) {
	$.confirm({
		content: "<div class='filecheck-con'><span class='icons'>&#xe656;</span><div class='filecheck-right'><div>" + content + "</div><div>您可以 <a target='_blank' href='/upgrade'>" + dowhat + "</a></div></div>",
		onConfirm: function () {
			window.location = "/upgrade";
		}
	});
};
pcUtil.checkOrgExpire = function (callback, params) {
	pcUtil.ajax({
		url: "/organizations/check_expire", data: params, success: function (e) {
			if (e.expire) {
				$.imgtoast({ tid: params.orgId });
				callback(false);
				return;
			}
			callback(true);
		}
	});
};

// 字节转换
pcUtil.byteConvert = function (b) {
	let kb = b / 1024;
	let mb = kb / 1024;
	let gb = mb / 1024;

	if (mb < 0.1) return { unit: "KB", n: kb.toFixed(1) };
	else 
		// if (gb < 0.1)
			 return { unit: "M", n: mb.toFixed(1) };
	// else return { unit: "G", n: gb.toFixed(1) };
};
/**
 * 创建随机密码
 *
 * @param {[type]}
 *            len [description]
 * @return {[type]} [description]
 */
pcUtil.creatCode = function (len) {
	var seed = ['abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '123456789'];
	var idx, i;
	var result = '';
	for (i = 0; i < len; i++) {
		idx = Math.floor(Math.random() * 3);
		result += seed[idx].substr(Math.floor(Math.random() * (seed[idx].length)), 1);
	}
	return result;
}
pcUtil.loadAvatar = function (userId) {
	if (!userId) {
		return '<img src="/src/assets/images/on.png"/>';
	} else {
		return '<img src="' + pcUtil.Avatar(userId) + '.png"/>';
	}
}
/**
 * 获取元素距离文档边框距离
 */
pcUtil.getDistance = function (obj, preinstall = {}) {
	if (!obj instanceof jQuery) {
		obj = $(obj);
	}
	let top = !isNaN(preinstall.top) ? preinstall.top : obj.offset().top;
	let left = !isNaN(preinstall.left) ? preinstall.left : obj.offset().left;

	let distance = {};
	distance.top = (top - $(document).scrollTop());
	distance.bottom = ($(window).height() - distance.top - obj.outerHeight());
	distance.left = (left - $(document).scrollLeft());
	distance.right = ($(window).width() - distance.left - obj.outerWidth());
	return distance;
}
/*
 * 说明：过滤XSS 模板中使用<!--{}-->标签输出变量则自动添加XSS过滤 使用<!--@@-->标签则不进行xss过滤 使用：
 * initnode.filter.xss(val);
 */
pcUtil.filterXss = function (val) {
	if (val == null || val == "") {
		return "";
	}
	val = val.toString();
	val = val.replace(/</g, '&lt;');
	val = val.replace(/%3C/g, '&lt;');
	val = val.replace(/>/g, '&gt;');
	val = val.replace(/%3E/g, '&gt;');
	val = val.replace(/'/g, '&apos;');
	val = val.replace(/"/g, '&quot;');
	return val;
};
pcUtil.restoreXss = function (val) {
	if (val == null || val == "") {
		return "";
	}
	val = val.replace(/&amp;/g, '&');
	val = val.replace(/&lt;/g, "<");
	val = val.replace(/&gt;/g, ">");
	val = val.replace(/&apos;/g, '\'');
	val = val.replace(/&quot;/g, '"');
	return val;
};
/**
 * 扩展js String
 */
String.prototype.isEmpty = function () {
	if (this.replace(/(^\s*)|(\s*$)/g, '').length <= 0) {// null
		return true;
	}
	else {// not null
		return false;
	}
};
String.prototype.notEmpty = function () {
	return !this.isEmpty();
};

String.prototype.isEmail = function () {
	var regex = /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
	if (this.isEmpty()) {
		return false;
	}
	if (regex.test(this)) {
		return true;
	} else {
		return false;
	}
};
String.prototype.replaceAll = function (s1, s2) {
	return this.replace(new RegExp(s1, "gm"), s2);
};

// Array 功能扩展：获取元素下标、判断包含、删除指定元素
Array.prototype.inArray = function (elem) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] == elem) return true;
	}
	return false;
};
Array.prototype.indexOf = function (elem) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] == elem) return i;
	}
	return -1;
};
// Array.prototype.remove = function(elem){
// 	var index = this.indexOf(elem);
// 	if(index > -1){
// 		this.splice(index, 1);
// 	}
// };
if (!Array.prototype.forEach) {
	Array.prototype.forEach = function (callback, thisArg) {
		var T, k;
		if (this == null) {
			throw new TypeError(" this is null or not defined");
		}
		var O = Object(this);
		var len = O.length >>> 0; // Hack to convert O.length to a UInt32
		if ({}.toString.call(callback) != "[object Function]") {
			throw new TypeError(callback + " is not a function");
		}
		if (thisArg) {
			T = thisArg;
		}
		k = 0;
		while (k < len) {
			var kValue;
			if (k in O) {
				kValue = O[k];
				callback.call(T, kValue, k, O);
			}
			k++;
		}
	};
};
pcUtil.getUrlParams = function (name, url) {
	// 创建一个 URL 对象
	if (!url) url = window.location.href

	let urlObj = new URL(url);

	// 使用 URLSearchParams 来提取查询参数
	let params = new URLSearchParams(urlObj.search);

	// 获取参数值
	let paramValue = params.get(name);

	// 如果参数存在，解码成中文字符
	if (paramValue) {
		paramValue = decodeURIComponent(paramValue);
	}

	return paramValue;
};
/**
 * 计算shape数量
 */
pcUtil.shapesCount = function (index) {
	var designer_canvas = $("#designer_canvas"), shapesCount = designer_canvas.find(".shape_box").length;
	if (shapesCount > 600) {
		if (UI != null) {
			UI.showTip("本文件的图形数量已足够绘制一艘航空母舰，为了好的作图体验，建议您不要制作过大的文件哦");
		}
	}
}
/**
 * 获取当前日期下几个月的日期 {param:number } monthNum 月数
 */
pcUtil.GetNextMonthDay = function (now, monthNum) {
	var date = new Date();
	if (now) date = new Date(now);
	let days = date.getDate(); // 获取当前日期中的月的天数
	var year2 = date.getFullYear();
	var month2 = parseInt(date.getMonth() + 1) + parseInt(monthNum);
	if (month2 > 12) {
		year2 = parseInt(year2) + parseInt((parseInt(month2) / 12 == 0 ? 1 : parseInt(month2) / 12));
		month2 = parseInt(month2) % 12;
	}
	var day2 = date.getDate();
	var days2 = new Date(year2, month2, 0);
	days2 = days2.getDate();
	if (day2 > days2) {
		day2 = days2;
	}
	if (month2 < 10) {
		month2 = '0' + month2;
	}

	var t2 = year2 + '年' + month2 + '月' + day2 + '日';
	return t2;
}
pcUtil.GetNextDay = function (dayNum, date) {
	if (date) {
		var date1 = new Date(date);
	} else {
		var date1 = new Date();
	}
	var date2 = new Date(date1);
	date2.setDate(date1.getDate() + dayNum);
	return date2.getFullYear() + "年" + (date2.getMonth() + 1) + "月" + date2.getDate() + '日';
}
// 数组前后对调
pcUtil.arrFlashback = function (arr) {
	let length = arr.length;
	let newArr = [];
	for (let i = length - 1; i >= 0; i--) {
		newArr.push(arr[i]);
	}
	return newArr;
};
/**
 * 获取日期，参数dates（int）表示几天前或者几天后的日期
 * @param {} dates
 * @return {}
 */
pcUtil.getDate = function (dates) {
	var date = new Date();
	date.setDate(date.getDate() + dates);
	var y = date.getFullYear();
	var m = date.getMonth() + 1;
	var d = date.getDate();
	return y + "-" + m + "-" + d;
}
/**
 * 获取周一
 * @param {"取值 7 为上周周一日期"} n
 * @returns {number}
 */
pcUtil.getPreviousMonday = function (n = 0) {
	let date = new Date();
	let day = date.getDay();
	let prevMonday;
	if (date.getDay() == 0) {
		prevMonday = new Date().setDate(date.getDate() - 7);
	}
	else {
		prevMonday = new Date().setDate(date.getDate() - day - n);
	}

	return prevMonday;
}
/**
 * 获取月份一号
 * @param {"是否获取上月一号"} isPre
 * @returns {number}
 */
pcUtil.getPreviousMonth = function (isPre = false) {
	let now = new Date();
	let nowMonth = now.getMonth(); //当前月
	let nowYear = now.getFullYear(); //当前年
	//本月的开始时间
	let monthStartDate = new Date(nowYear, nowMonth, 1);

	//上月的开始时间
	if (isPre) {
		nowMonth -= 1;
		if (nowMonth < 0) {
			nowYear = ~~nowYear - 1;
			nowMonth = 11;
		}

		monthStartDate = new Date(nowYear, nowMonth, 1);
	}

	return monthStartDate;
}

/**
 * 通过 category 获取icons标签
 * @param {"chart.category"} category
 * @returns {"icons标签"}
 */
pcUtil.getIconsByCate = function (category, listType, chart = {}) {
	var icons = "";
	if (!category) {
		icons = `<span class='icons_web ${listType == "list" ? "icons_web_flow" : ""}' style="color:${listType == "list" ? "#fff" : "#067BEF"}">&#xe6b0;</span>`;
		return icons;
	}
	if (category.indexOf("mind") >= 0 || ['fishbone', 'timeline', 'ishikawa'].includes(category)) {
		if (chart != {} && Object.hasOwnProperty.call(chart, 'filepath') && chart.filepath.endsWith('.poso')) {
			icons = `<span class='icons_web ${listType == "list" ? "icons_web_outline" : ""}' style="color:${listType == "list" ? "#fff" : "#54608A"}">&#xe6af;</span>`
		}
		else icons = `<span class='icons_web ${listType == "list" ? "icons_web_mind" : ""}' style="color:${listType == "list" ? "#fff" : "#3BC8B6"}">&#xe6b1;</span>`
	}
	else if (category.indexOf("markdown") > -1) {
		icons = `<span class='icons_web ${listType == "list" ? "icons_web_markdown" : ""}'  style="color:rgb(175, 91, 244"}">${listType == "list" ? "&#xe776;" : "&#xe777;"}</span>`
	}
	else if (category == "ui") icons = "<span class='icons'>&#xe78b;</span>";
	else if (category == "board") icons = "<span class='icons'>&#xe67d;</span>";
	else if (category == "outline") icons = `<span class='icons_web ${listType == "list" ? "icons_web_outline" : ""}' style="color:${listType == "list" ? "#fff" : "#54608A"}">&#xe6af;</span>`;
	else icons = `<span class='icons_web ${listType == "list" ? "icons_web_flow" : ""}' style="color:${listType == "list" ? "#fff" : "#067BEF"}">&#xe6b0;</span>`;

	return icons;
};

/**
 * 图片加载失败处理
 * @param {"img jquery对象"} $img
 */
pcUtil.loadListError = function ($img = $("img")) {
	let path = ipc.sendSync('getGlobal', "appPath");
	var url = "";
	$img.one("error", function () {
		var pt = $(this).parent().parent();
		let cate = pt.attr("data-cate") || "";

		if (cate.indexOf("mind") >= 0) url = "file:///" + path + "/src/assets/images/mind/file_mind.png";
		else if (cate == "outline") url = "file:///" + path + "/src/assets/images/outline/file_outline.png";
		else url = "file:///" + path + "/src/assets/images/flow/file_flow.png";

		if (url != "") this.src = url;
	});
};

/**
 * 获取文件公开状态标签
 * @param {"文件数据"} chart
 * @param {"文件来源"} resource
 */
pcUtil.getPubIcon = function (chart, isAuthor, listType) {
	let pubIcon = '';
	if (chart.status == "public") {
		if (isAuthor) {
			if (chart.publicClone != 0) {
				if (chart.publicClonePrice && chart.publicClonePrice - 0 > 0) {
					pubIcon = `<span class="pubicon free canclick ${listType == 'icon' ? 'pubicon_icon' : ''}" title="克隆价格：￥${chart.publicClonePrice}">公开</span>`;
				} else {
					pubIcon = `<span class="pubicon canclick free ${listType == 'icon' ? 'pubicon_icon' : ''}" title="免费克隆">公开</span>`;
				}
			} else {
				pubIcon = `<span class="pubicon canclick ${listType == 'icon' ? 'pubicon_icon' : ''}" title="免费克隆">公开</span>`;
			}
		}
		else {
			if (chart.publicClone != 0) {
				if (chart.publicClonePrice && chart.publicClonePrice - 0 > 0) {
					pubIcon = `<span class="pubicon free ${listType == 'icon' ? 'pubicon_icon' : ''}">¥ ${chart.publicClonePrice}</span>`;
				} else {
					pubIcon = `<span class="pubicon canclick free ${listType == 'icon' ? 'pubicon_icon' : ''}" title="免费克隆">公开</span>`;
				}
			}
			else pubIcon = `<span class="pubicon onlready ${listType == 'icon' ? 'pubicon_icon' : ''}">仅查看</span>`;
		}
	}
	else if (chart.status == "verifying") pubIcon = `<span class="pubicon ${listType == 'icon' ? 'pubicon_icon' : ''}">审核中</span>`;
	return pubIcon;
};
/**
 * 检测是否是 JSON 格式
 * @param str [String] 被检测字符串
 * */
pcUtil.isJSON = function (str) {
	if (typeof str == 'string') {
		try {
			var obj = JSON.parse(str);
			if (typeof obj == 'object' && obj) {
				return true;
			} else {
				return false;
			}

		} catch (e) {
			return false;
		}
	}
}
pcUtil.getEidtorCateZNch =  function(url=''){
	let cate = '其他页面'
	if (url.indexOf("/diagrams/index.html") >  -1) 
	    cate = "流程图";
	else if (url.indexOf("/mindmap/index.html") > -1) 
     	cate = "思维导图";
	else if (url.indexOf("/outline/index.html") > -1) 
	    cate = "思维笔记";
	else if (url.indexOf("/markdown-editor/index.html") > -1) 
	    cate = "markdwon编辑器";

		return cate
}
/**
 * 打开新的窗口/标签页
 * */
pcUtil.openWin = function (params = {}, index) {
	let src = params.url;
	let title = params.title || "未命名文件";
	let type = params.type;
	let isReplace = params.isReplace;
	let notLoad = params.notLoad;
	let chartDef = params.chartDef;

	window.poCollect('进入编辑器前',{'类型':pcUtil.getEidtorCateZNch(src)}) 
	// busClient.send(JSON.stringify({
	// 	k: 'addTab', args: [{ src, title, type, isReplace }]
	// }))
	ipc.sendToHost('addTab', { src, title, type, isReplace, index, notLoad, chartDef });
}

/**
 * 判断系统类型
 * */
pcUtil.isMac = function () {
	var agent = navigator.userAgent.toLowerCase();
	var isMac = /macintosh|mac os x/i.test(navigator.userAgent);

	if (agent.indexOf("win32") >= 0 || agent.indexOf("wow32") >= 0) {
		return false;
	}
	if (agent.indexOf("win64") >= 0 || agent.indexOf("wow64") >= 0) {
		return false;
	}
	if (isMac) {
		return true;
	}
}

pcUtil.isWin = function () {
	var agent = navigator.userAgent.toLowerCase();
	return agent.includes('win32') || agent.includes('win64')
}

/**
 * url 替换
 */
pcUtil.urlReplace = function (url, replaced, change) {
	if (url && typeof url == "string") {
		if (url.indexOf(replaced) > -1) return url.replace(replaced, change);
		else {
			replaced = replaced.replace("https", "http");
			console.log(replaced)
			return url.replace(replaced, change);
		}
	}
	else return '';
}

const isOnline = true
if ('connection' in navigator) {
	navigator.connection.addEventListener('change', () => {
		console.log(`Effective connection type is now ${navigator.connection.effectiveType}`);
	});
} else {
	console.log("Network Information API not supported");
}

/**
 * 检测网络
 */
pcUtil.isOnline = function () {
	return navigator.onLine
	// return navigator.onLine;
}
pcUtil.setOnlie = function (is) {
	if (is) window.localStorage.setItem("isOnLine", true);
	else window.localStorage.removeItem("isOnLine");
}

/**
 * 替换页面img路径
 * */
pcUtil.imgError = function (parent = document) {
	let n = 0;
	parent.addEventListener("error", function (e) {
		var elem = e.target;
		if (n > 1000) return;

		if (elem.tagName.toLowerCase() === 'img' && !$(elem).attr("anewed")) {
			n++
			let src = elem.src;
			let isSeted = 0;
			// 图片地址内,存在 "%22"
			if (src.indexOf("%22") > -1) {
				src = src.replace(/%22/g, "");
				isSeted = 1;
			}
			else {
				src = src.replace(/\//g, "\\");
				let srcs = src.split(/images\\/);
				let imgSrc = srcs[1];
				// console.log("imgSrc", imgSrc, `${ipc.sendSync('getGlobal',"appPath")}/src/assets/images/${imgSrc}`)
				src = `${ipc.sendSync('getGlobal', "appPath")}/src/assets/images/${imgSrc}`;
				isSeted = 1;
			}

			if (isSeted) $(elem).attr({ "anewed": isSeted, src });
		}
		else if (elem.tagName.toLowerCase() === 'img' && $(elem).attr("anewed") < 2) {
			n++
			let src = $(elem).attr("error");
			if (!src || src == "") src = `${ipc.sendSync('getGlobal', "appPath")}/src/assets/images/on.png`;

			$(elem).attr({ "src": src, "anewed": 2 });
		}
		if (elem.tagName.toLowerCase() === 'img') {
			let removeAnewed = function (e) { $(this).removeAttr("anewed") };
			$(elem).off("load", removeAnewed).on("load", removeAnewed);
		}
	}, true);
}

pcUtil.imgReplace = function (src) {
	src = src.replace(/\//g, "\\");
	let srcs = src.split(/images\\/);
	let imgSrc = srcs[1];
	// console.log("imgSrc", imgSrc, `${ipc.sendSync('getGlobal',"appPath")}/src/assets/images/${imgSrc}`)
	return `${ipc.sendSync('getGlobal', "appPath")}/src/assets/images/${imgSrc}`;
};

pcUtil.getCurrentTimeString = function (time) {
	var date = time ? new Date(time) : new Date();
	var y = date.getFullYear();
	var m = date.getMonth() + 1;
	var d = date.getDate();
	var hour = date.getHours();
	var minute = date.getMinutes();
	var seconds = date.getSeconds();

	if (m < 10) m = '0' + m;
	if (d < 10) d = '0' + d;
	if (hour < 10) hour = '0' + hour;
	if (minute < 10) minute = '0' + minute;
	if (seconds < 10) seconds = '0' + seconds;

	return y + "-" + m + "-" + d + ' ' + hour + ':' + minute + ':' + seconds;
};

/**
 * 从 url 中提取 host
 * @param {"需要提取host的链接"} url
 */
pcUtil.getHostToUrl = function (url = "") {
	let ip = `((([1-9][0-9])|([0-9])|((1[0-9][0-9])|(2[0-4][0-9])|(25[0-5])))\\.){3}(((1[0-9][0-9])|(2[0-4][0-9])|(25[0-5]))|([1-9][0-9])|([0-9]))`;
	let org = `(www\\.){0,1}[a-zA-Z0-9]{0,62}\\.[a-zA-Z0-9]{0,62})`;
	let reg = eval(`/^(https?:\\/\\/)?((${ip})|(${org})(:[0-9]+){0,1}/g`);
	let host = url.match(reg)

	return host;
}

// /**
//  * 简单 提示 showTip
//  * @param {*} content 提示内容  支持富文本
//  * @param {*} delay  延时时间
//  * @param {*} position 显示位置  默认中部（移动端） 可选顶部
//  */
// $.showTip = function (content, delay, position) {
// 	var domTop = '50%';
// 	if (position == 'top') {
// 		domTop = '80px';
// 	}
// 	var mask = $('#body-mask'), cssZindex = '';
// 	if (mask.length > 0) {
// 		var zIndex = $('#body-mask').css('zIndex') - 0 + 1;
// 		cssZindex = 'z-index: ' + zIndex + ';';
// 	}
// 	var html = '<div class="global-tip" style="border-radius:3px;padding:10px;font-size:14px;position:fixed;top:' + domTop + ';left:50%;letter-spacing: 0.5px;transform:translate(-50%, -50%);background:#333;opacity:.6;color:#fff;' + cssZindex + '">' + content + '</div>';
// 	$(".global-tip").fadeOut();
// 	$(html).appendTo("body");
// 	if (typeof showTiping != "undefined") {
// 		window.clearTimeout(showTiping);
// 	}
// 	showTiping = setTimeout(function () {
// 		$(".global-tip").remove();
// 	}, delay || 2000);
// };

/**
 * 数字缩进
 * @param {"数字"} n
 * @returns {"返回"}
 */
pcUtil.numAbb = function (n) {
	if (n < 1000) {
		return n;
	}
	else if (n >= 10000000) {
		return (n / 10000000).toFixed(2) + 'kw';
	}
	else if (n >= 1000000) {
		return (n / 1000000).toFixed(2) + 'bw';
	}
	else if (n >= 10000) {
		return (n / 10000).toFixed(2) + 'w';
	}
	else if (n >= 1000) {
		return (n / 1000).toFixed(2) + 'k';
	}
};

/**
 * 选择文件夹
 */
pcUtil.selectDir = function (isdir, callback = function () { }) {
	// 创建input标签
	var inputObj = document.createElement('input')

	// 设置属性
	inputObj.setAttribute('id', '_ef');
	inputObj.setAttribute('type', 'file');
	inputObj.setAttribute("style", 'visibility:hidden');

	if (isdir) { // 如果要选择路径，则添加以下两个属性
		inputObj.setAttribute('webkitdirectory', "");
		inputObj.setAttribute('directory', "");
	}

	// 添加到DOM中
	document.body.appendChild(inputObj);

	// 添加事件监听器
	inputObj.addEventListener("change", function () {
		var inputObj = document.getElementById("_ef");
		var files = inputObj.files;
		console.log(files, inputObj)
		try {
			if (files.length > 1) {
				alert('当前仅支持选择一个文件')
			}
			else {
				switch (this.btntype) {
					case 'store':
						// 临时变量的值赋给输出路径
						this.outpath = files[0].path;
						break;
					case 'add':
						// 添加文件操作
						this.filepath = files[0].path;
						if (this.addFile(this.filepath)) {
							alert("添加成功")
						}
						break;
					default:
						break;
				}
			}
			// 移除事件监听器
			inputObj.removeEventListener("change", function () { });
			// 从DOM中移除input
			document.body.removeChild(inputObj);
		}
		catch (error) {
			alert(error)
		}
	});
	// 模拟点击
	inputObj.click();
};

pcUtil.perfectUpFile = function ($form, $file, folderId) {
	let formdata = new FormData($form[0]);
	let file = $file.val();
	let fileName = $file[0].files[0].name;
	let sys = /macintosh|mac os x/i.test(navigator.userAgent) ? 'mac' : 'win';
	let type = file.substring(file.lastIndexOf(".") + 1);
	let id = window.localStorage.getItem("processon_userKey");
	let token = window.localStorage.getItem("processon_token");
	let clientId = window.localStorage.getItem("pc_clientId");

	formdata.set("sys", sys);
	formdata.set("type", type);
	formdata.set("fileName", fileName);
	formdata.set("folder", folderId);
	formdata.set("uk", id);
	formdata.set("token", token);
	// formdata.set("clientId", clientId);

	return formdata;
};

// 检测是否是网址
pcUtil.isUrl = function (str) {
	let reg = /^(?:(http|https|ftp):\/\/)?((?:[\w-]+\.)+[a-z0-9]+)((?:\/[^/?#]*)+)?(\?[^#]+)?(#.+)?$/i;
	return reg.exec(str);
};

// js错误监控
pcUtil.onJsError = function () {
	console.error = function (tempErrorMsg) {
		var errorMsg = (arguments[0] && arguments[0].message) || tempErrorMsg;
		var lineNumber = 0;
		var columnNumber = 0;
		var errorObj = arguments[0] && arguments[0].stack;
		if (!errorObj) {
			if (typeof errorMsg == "object") {
				try {
					errorMsg = JSON.stringify(errorMsg)
				} catch (e) {
					errorMsg = "错误无法解析"
				}
			}
			// siftAndMakeUpMessage("console_error", errorMsg, WEB_LOCATION, lineNumber, columnNumber, "CustomizeError: " + errorMsg);
			ipc.send("exportLog", { str: `js错误监控 - console_error, errorMsg = ${errorMsg},lineNumber = ${lineNumber}, columnNumber = ${columnNumber}` });
		} else {
			// 如果报错中包含错误堆栈，可以认为是JS报错，而非自定义报错
			// siftAndMakeUpMessage("on_error", errorMsg, WEB_LOCATION, lineNumber, columnNumber, errorObj);
			ipc.send("exportLog", { str: `js错误监控 - on_error, errorMsg = ${errorMsg}, lineNumber = ${lineNumber}, columnNumber = ${columnNumber}, errorObj = ${JSON.stringify(errorObj)}` });
		}
		// return oldError.apply(console, arguments);
	};

	window.onunhandledrejection = function (e) {
		var errorMsg = "";
		var errorStack = "";
		if (typeof e.reason === "object") {
			errorMsg = e.reason.message;
			errorStack = e.reason.stack;
		} else {
			errorMsg = e.reason;
			errorStack = "";
		}
		//处理上报
		// siftAndMakeUpMessage("on_error", errorMsg, WEB_LOCATION, 0, 0, "UncaughtInPromiseError: " + errorStack);
		ipc.send("exportLog", { str: `js错误监控 - onunhandledrejection, errorMsg = ${errorMsg}, errorStack = ${errorStack}` });
	};
};


document.ondragstart = function () { return false; };
// 禁用ajax缓存
$.ajaxSetup({
	cache: false
});
/** ************启动Title自定义提示************** */

var fromUrl = document.referrer;
if (fromUrl && fromUrl.indexOf("processon.com") < 0) {
	// 如果有来源地址，并且不是processon的地址，记录cookie
	pcUtil.setCookie("processon_referrer", encodeURI(fromUrl), 1);
}
/**
 * 短提示，2000毫秒关闭
 *
 * @param {Object}
 *            msg
 * @param {Object}
 *            type [info,error,ok]
 */
$.simpleAlert = function (msg, type, delay) {
	if (msg == "close") {
		$("#simplealert").remove();
		return;
	}
	if ($("#simplealert").length) {
		$("#simplealert").remove();
	}
	var alertType = "simplealert-icon-info";
	if (type) {
		alertType = "simplealert-icon-" + type;
	}
	var simpleAlert = $("<div id='simplealert' class='simplealert'></div>").appendTo("body");
	var html = "<div class='" + alertType + "'>";
	if (type == "loading") {
		html += "<img src='/images/default/designer/loading.gif' style='margin:10px 0px 0px 12px'/>";
	}
	html += "</div><div class='simplealert-msg'>" + msg + "</div><div class='simplealert-right'></div>";
	simpleAlert.html(html);
	simpleAlert.css("top", ($(window).height() - simpleAlert.height()) / 2 + $(window).scrollTop() + "px");
	simpleAlert.css("left", ($(window).width() - simpleAlert.width()) / 2 + $(window).scrollLeft() + "px");
	simpleAlert.show();
	if (delay != "no") {
		setTimeout(function () {
			simpleAlert.fadeOut(200);
		}, delay ? delay : 3500);
	}
};
/**
 * 置为不可用
 */
$.fn.disable = function (grow, zindex) {
	$(this).attr("disable", true);
	// $(".disabled-mask").remove();
	$(this).addClass("opacity disable");
	for (var i = 0; i < $(this).length; i++) {
		var dom = $(this)[i];
		$(dom).unbind("mouseover.disable").bind("mouseover.disable", function () {
			var mask = $("<div class='disabled-mask'></div>").appendTo("body");
			if (!grow) {
				grow = 2;
			}
			mask.css({
				width: $(dom).outerWidth() + grow,
				height: $(dom).outerHeight() + 4,
				top: $(dom).offset().top,
				left: $(dom).offset().left,
				"z-index": 9999
			});
			if (zindex) {
				mask.css("z-index", zindex);
			}
			mask.on("mouseout", function () {
				$(this).remove();
			}).on("mouseup", function (e) {
				e.stopPropagation();
			});
		});
	}
	return this;
};
/**
 * 激活
 *
 * @param {Object}
 *            fn 重新绑定的事件
 */
$.fn.enable = function () {
	$(this).attr("disable", false);
	$(this).removeClass("opacity disable");
	for (var i = 0; i < $(this).length; i++) {
		var dom = $(this)[i];
		$(dom).unbind("mouseover.disable").unbind("focus");
	}
	// $(".disabled-mask").remove();
	return this;
};

/**
 * 打开登录窗口
 *
 * @param {Object}
 *            method
 * @param {Object}
 *            callback
 */
pcUtil.loginWindow = function (method, callback) {
	if (typeof method == "undefined") {
		method = "open";
	}
	if (method == "open") {
		if ($("#loginWindow").length) {
			$("#loginWindow").remove();
		}
		var loginWindow = $("<div id='loginWindow' style='margin-top:-120px;' class='loginWindow'></div>").appendTo("body");
		loginWindow.append("<div id='loginWindow-content' class='loginWindow-content'><img src='/images/ajaxload.gif' style='margin:80px 0px 0px 45%'/></div>");
		$("#loginWindow-content").load("/login/window", function () {
			loginCallback = callback;
		});
		loginWindow.dialog({
			onClose: function () {
				// location.reload()
			}
		});
	} else if (method = "close") {
		$("#loginWindow").dialog("close");
	}
};

/**
 * 打开一个遮罩
 *
 * @param {Object}
 *            method
 */
var maskStackCount = 0;
$.mask = function (method) {
	if (typeof method == "undefined") {
		method = "open";
	}
	if (method == "open") {
		if (maskStackCount == 0) {
			var mask = $("<div id='window-mask' class='window-mask po-dlg-mask' style='display:none'></div>").appendTo("body");
			mask.off("click").on("click", function () {
				return false;
			});
			mask.css({
				width: $(window).width() + "px",
				height: $(window).height() + "px",
				filter: "alpha(opacity=60)"
			}).show();
			$(window).bind("resize.mask", function () {
				mask.css({
					width: $(window).width() + "px",
					height: $(window).height() + "px"
				});
			});
		}
		maskStackCount++;
	}
	else if (method == "close") {
		maskStackCount--;
		if (maskStackCount == 0) {
			$("#window-mask").remove();
			$(window).unbind("resize.mask");
		}
	}
};
/**
 * 弹出窗口 ---options--- width heiht title onClose
 */
$.fn.dialog = function (options) {
	var dialogWin = $(this);
	// 如果是字符串类型，则调用方法
	if (typeof options == "string") {
		// 关闭
		if (options == "close") {
			dialogWin.find(".dialog-close").trigger("click");
			if ($("#window-mask") != null) {
				$("#window-mask").hide();
			}
		}
	} else {
		var defaults = {
			fixed: true,
			closable: true,
			mask: true
		};
		options = $.extend(defaults, options);
		// 初始化，打开
		if (!options) {
			options = {};
		}
		var title = "";
		if (options.title) {
			title = options.title;
		} else if (dialogWin.attr("title")) {
			title = dialogWin.attr("title");
			dialogWin.attr("title", "");
		}
		// dialogWin.css({
		// "width": dialogWidth,
		// "height": dialogHeight
		// })
		dialogWin.addClass("dialog-box").show();
		var dialogClose = $("<div class='dialog-close icons_web'>&#xe728;</div>").appendTo(dialogWin);
		dialogClose.bind("click", function () {
			$(document).off('keyup.confirm');
			if (options.onClose) {
				if (options.onClose() == false) {
					return;
				}
			}
			$.mask("close");
			dialogWin.hide();
			dialogWin.removeClass("dialog-box").find(".dialog-close").remove();
			var title = dialogWin.find(".dialog-title");
			dialogWin.attr("title", title.text());
			title.remove();
			$(window).unbind("resize.dialog");
		});
		dialogWin.find(".close").on("click", function () {
			dialogClose.click();
			// dialogWin.dialog("close");
			return;
		});
		if (options.closable) {
			dialogClose.show();
		}
		if (options.hideable) {
			dialogClose.hide();
		}
		if (title != "") {
			dialogWin.prepend("<h2 class='dialog-title'>" + title + "</h2>");
		}
		// 遮罩
		if (options.mask) {
			if (!$('#window-mask').length)
				$.mask();
		}
		$(window).off("resize.dialog").bind("resize.dialog", function () {
			var dialogWidth = dialogWin.outerWidth();
			var dialogHeight = dialogWin.outerHeight();
			var top = 0;
			if (options.fixed) {
				dialogWin.css("position", "fixed");
				top = ($(window).height() - dialogHeight) / 2 + "px";
				// console.log($(this),dialogWin, top)
			} else {
				dialogWin.css("position", "absolute");
				top = ($(window).height() - dialogHeight) / 2 + $(document).scrollTop() + "px";
			}
			var left = ($(window).width() - dialogWidth) / 2 + "px";
			dialogWin.css({
				// top: top,
				// left: left
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)'
			});
		});
		$(window).trigger("resize.dialog");
		dialogWin.find(".dialog-title").draggable({ target: dialogWin });
	}
	return dialogWin;
};

$.fn.draggable = function (options) {
	var defaults = {
		target: "default",
		clone: false,
		undrag: "",
		scroll: true,
		// callback
		start: function () { },
		drag: function () { },
		end: function () { }
	};
	var opt = $.extend(defaults, options);
	$(this).off("mousedown.drag").on("mousedown.drag", function (e) {
		$(document).on("selectstart.drag dragstart", function () { return false; });
		var $this = $(this);
		var target = typeof opt.target == "string" && opt.target == "default" ? $this : opt.target;
		var downX = e.pageX;
		var downY = e.pageY;
		var downLeft = target.offset().left;
		var downTop = target.offset().top;
		if (opt.clone) {
			target = $this.clone().removeAttr("id").css("position", "absolute")
				.offset({
					left: downLeft,
					top: downTop
				});
			if (typeof opt.clone == "function") {
				opt.clone.call(target, e);
				downLeft = target.css("left").replace("px", "") * 1;
				downTop = target.css("top").replace("px", "") * 1;
			}
			if (opt.opacity) {
				target.css("opacity", opt.opacity);
			}
		}
		$(document).on("mousemove.drag", function (e) {
			if (!$this.hasClass("ondrag")) {
				$this.addClass("ondrag");
				if (opt.clone)
					target.appendTo($this.parent());
				opt.start.call($this[0], e);
			}
			var left = e.pageX - downX + downLeft;
			var top = e.pageY - downY + downTop;
			if (opt.bounding) {
				var boundingleft = opt.bounding.offset().left;
				var boundingtop = opt.bounding.offset().top;
				if (left > boundingleft && top > boundingtop
					&& left < boundingleft + opt.bounding.outerWidth() - target.outerWidth()
					&& top < boundingtop + opt.bounding.outerHeight() - target.outerHeight()) {
					target.offset({
						left: left,
						top: top
					});
				}
			} else {
				target.offset({
					left: left,
					top: top
				});
			}
			opt.drag.call($this[0], e);
		});
		$(document).on("mouseup.drag", function (e) {
			opt.end.call($this[0], e);
			if (opt.clone) {
				target.remove();
			}
			$(document).off("selectstart.drag dragstart");
			$(document).off("mousemove.drag");
			$(document).off("mouseup.drag");
			if (!$(".drop-hover").length) {
				$this.removeClass("ondrag");
			}
		});
		$(this).on("mouseup.drag", function (e) {
			$(document).trigger("mouseup.drag");
			$(this).off("mouseup.drag");
		});
	});
	if (!!opt.undrag) {
		$(this).find(opt.undrag).off("mousemove.drag").on("mousemove.drag", function (e) {
			e.stopPropagation();
		}).on("dragstart", function () { return false });
	}
	return this;
};

$.confirm = function (options) {
	var confirmWin = $("#global_confirm_window");
	var okval = "确定";
	var tokenClass = " ";
	if (options.okval) {
		okval = options.okval;
	}
	if (options.tokenClass) {
		tokenClass = options.tokenClass;
	}
	if (!confirmWin.length) {
		confirmWin = $(`
		<div id='global_confirm_window' tabindex='-1' class='confirm-box ${tokenClass}' title='请确认'>
		    <div class='dlg-content'>${options.content}</div>
			<div class='dlg-buttons'>
			<span class='pro-btn basic cancelbtn close'>取消</span>
			  &nbsp;&nbsp;
			  <span class='pro-btn default okbtn'>${okval}</span>
			 </div>
		</div>`).appendTo("body");
	} else {
		confirmWin.find(".dlg-content").html(options.content);
		confirmWin.find(".okbtn").html(okval);
	}
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
	$(document).off('keyup.confirm').on('keyup.confirm', function (e) {
		if (e.keyCode == 13)
			confirmWin.find(".okbtn").trigger('click');
	});
	confirmWin.find(".okbtn").off().on("click", function () {
		confirmWin.dialog("close");
		if (options.onConfirm) {
			options.onConfirm();
		}
		$(document).off('keyup.confirm');
	});
	confirmWin.find(".cancelbtn").off("click.cancel").on("click.cancel", function () {
		if (options.onCancel) {
			options.onCancel();
		}
		$(document).off('keyup.confirm');
	});
};
/**
 * 升级提示
 *
 */
$.imgtoast = function (options) {
	var toastWin = $("#upgrade_dlg");
	if (!toastWin.length) {
		var upgradWin = '<div id="upgrade_dlg" class="dialog" style="background:#fff;box-shadow:none;">' +
			'<div class="upgrade-box">' +
			'<h3 class="upgrade-box-title">升级团队版</h3>' +
			'<p class="upgrade-box-content">' +
			'更好的保证团队数据安全与协作效率<br>' +
			'专注工作与协作' +
			'</p>' +
			'<ul class="upgrade-ul">' +
			'<li><span class="icons">&#xe658;</span>无限量小组使用，各项目同时推进</li>' +
			'<li><span class="icons">&#xe658;</span>免费克隆系统付费模板</li><li>' +
			'<span class="icons">&#xe658;</span>团队成员高级权限设置灵活协作</li>' +
			'<li><span class="icons">&#xe658;</span>团队数据安全，实时备份</li>' +
			'</ul>' +
			'<a class="button" href="/upgrade">立即升级</a>' +
			'<img src="/src/assets/images/about/upgrade_bg_right.png"/>' +
			'</div>' +
			'</div>';
		toastWin = $(upgradWin).appendTo("body");
	}
	if (options.tid) {
		toastWin.find(".button").attr("href", "/upgrade?tid=" + options.tid + "&addu=pay");
	}
	toastWin.dialog();
};
/**
 * 下拉菜单
 *
 * @param options{
 *            position: left, center, right offsetX 左右偏移 offsetY 上下偏移 zindex
 *            zindex值，默认2 autoClose 是否点击其他区域后自动关闭 closeAfterClick 点击后是否自动关闭
 *            target 相对的某个元素弹出 onClose 关闭时执行的函数 autoPosition
 *            是否当显示位置超出浏览器窗口时，自动移动 }
 */
$.fn.popMenu = function (options) {
	var menu = $(this);
	if (typeof options == "string") {
		// 关闭
		if (options == "close") {
			menu.hide().removeClass("popover");
			$(window).unbind("resize.popmenu");
		}
		return;
	}
	var defaults = {
		position: "left",
		fixed: false,
		offsetX: 0,
		offsetY: 0,
		zindex: 2,
		autoClose: true,
		closeAfterClick: false,
		autoPosition: true
	};
	var opt = $.extend(defaults, options);
	var target = $(opt.target);
	menu.addClass("popover").css("z-index", opt.zindex);
	if (opt.fixed) {
		menu.css("position", "fixed");
	}
	if (opt.autoClose) {
		if (opt.closeAfterClick == false) {
			menu.unbind("mouseup.popmenu").bind("mouseup.popmenu", function (e) {
				e.stopPropagation();
			});
		}
		$(document).bind("mouseup.popmenu", function () {
			menu.popMenu("close");
			$(document).unbind("mouseup.popmenu");
			if (opt.onClose) {
				opt.onClose();
			}
		});
	}
	$(window).bind("resize.popmenu", function () {
		menu.popMenu(options);
	});
	menu.show();
	var left = 0;
	if (opt.position == "center") {
		left = target.offset().left + target.outerWidth() / 2 - menu.outerWidth() / 2;
	} else if (opt.position == "right") {
		left = target.offset().left + target.outerWidth() - menu.outerWidth();
	} else {
		left = target.offset().left;
	}
	if (left + menu.outerWidth() > $(window).width()) {
		left = $(window).width() - menu.outerWidth();
	}
	var top = target.offset().top + target.outerHeight();
	if (opt.autoPosition && top + opt.offsetY + menu.outerHeight() > $(window).height() + $(document).scrollTop()) {
		menu.css({
			top: $(window).height() - menu.outerHeight() + $(document).scrollTop(),
			left: left + opt.offsetX
		});
	} else {
		menu.css({
			top: top + opt.offsetY,
			left: left + opt.offsetX
		});
	}
};
$.fn.suggest = function (options) {
	var target = $(this);
	var defaults = {
		valueField: "value",
		offsetX: 0,
		offsetY: 0,
		width: target.outerWidth(),
		format: function (item) {
			return item.text;
		}
	};
	var opt = $.extend(defaults, options);
	var suggest = $(".suggest-menu");
	if (suggest.length < 1)
		suggest = $("<ul class='suggest-menu'></ul>").appendTo("body");
	suggest.width(opt.width);
	var index = -1;
	var last = "";
	target.off("keydown.suggest").on("keydown.suggest", function (e) {
		if (e.keyCode == 40) {
			// 向下
			e.preventDefault();
			if (index < suggest.children().length - 1) {
				index++;
				suggest.find(".active").removeClass("active");
				suggest.find("li[index=" + index + "]").addClass("active");
			}
		} else if (e.keyCode == 38) {
			// 向上
			e.preventDefault();
			suggest.find(".active").removeClass("active");
			if (index >= 0) {
				index--;
				suggest.find("li[index=" + index + "]").addClass("active");
			}
		} else if (e.keyCode == 13) {
			var active = suggest.find(".active");
			if (active.length) {
				target.val(active.attr("val"));
			}
			if (opt.onEnter) {
				opt.onEnter(target);
			}
			suggest.hide();
			value = "";
		}
	}).off("keyup.suggest").on("keyup.suggest", function (e) {
		var value = target.val();
		if (value == "") {
			suggest.hide();
		} else if (value != last) {
			index = -1;
			$.get(opt.url, { q: value }, function (data) {
				suggest.empty();
				var items = data.items;
				if (items.length == 0) {
					suggest.hide();
					value = "";
				} else {
					for (var i = 0; i < items.length; i++) {
						var item = items[i];
						var itemHtml = "<li index='" + i + "' class='suggest-item' val='" + item[opt.valueField] + "'>";
						itemHtml += opt.format(item);
						itemHtml += "</li>";
						suggest.append(itemHtml);
					}
					suggest.show();
					suggest.attr("tabindex", 0);
					var left = 0;
					if (opt.position == "center") {
						left = target.offset().left + target.outerWidth() / 2 - suggest.outerWidth() / 2;
					} else if (opt.position == "right") {
						left = target.offset().left + target.outerWidth() - suggest.outerWidth();
					} else {
						left = target.offset().left;
					}
					if (left + suggest.outerWidth() > $(window).width()) {
						left = $(window).width() - suggest.outerWidth();
					}
					var top = target.offset().top + target.outerHeight();
					if (opt.autoPosition && top + opt.offsetY + suggest.outerHeight() > $(window).height() + $(document).scrollTop()) {
						suggest.css({
							top: $(window).height() - suggest.outerHeight() + $(document).scrollTop(),
							left: left + opt.offsetX
						});
					} else {
						suggest.css({
							top: top + opt.offsetY,
							left: left + opt.offsetX
						});
					}
					suggest.find(".suggest-item").off("mousedown").on("mousedown", function (e) {
						e.preventDefault();
						target.val($(this).attr("val"));
						if (opt.onEnter) {
							opt.onEnter(target);
						}
						suggest.hide();
						last = value = "";
					});
				}
			});
		}
		last = value;
	}).off("blur.suggest").on("blur.suggest", function (e) {
		suggest.hide();
		last = "";
	});
};
/**
 * dom边缘动态数字提示
 */
$.fn.numberTip = function (opts) {
	var defaults = $.extend({
		val: "+1",
		size: 14,
		color: "red",
		time: 1000, // ms
		pos: "right"
	}, opts);
	var obj = $(this);
	var num = $("<span class='number-tip'>" + defaults.val + "</span>").appendTo("body");
	var left = obj.offset().left;
	if (defaults.pos == "right") {
		left = obj.offset().left + obj.outerWidth() / 2;
	}
	num.css({
		left: left,
		top: obj.offset().top,
		opacity: 1
	}).show();
	num.animate({
		top: "-=14px",
		opacity: 0
	}, 400, function () {
		num.remove();
	});
};
/**
 * dom输入框等进行提示
 */
$.fn.inputTip = function (opts) {
	var defaults = $.extend({
		text: "",
		time: 500, // ms
		pos: "rightin" // rightin,rightout,leftin,leftout
	}, opts);
	var obj = $(this), tip = $(".input-tip");
	if (tip.length) {
		tip.show();
		return;
	}
	tip = $("<span class='input-tip'>" + defaults.text + "</span>").appendTo("body");
	var left = obj.offset().left;
	if (defaults.pos == "rightin") {
		left = obj.offset().left + obj.outerWidth() - obj.width();
	} else if (defaults.pos == "rightout") {
		left = obj.offset().left + obj.outerWidth() + 5;
	}
	tip.css({
		left: left,
		top: defaults.top || obj.offset().top,
		opacity: 1
	}).show();
	setTimeout(function () {
		tip.fadeOut(function () {
			tip.remove();
		});
	}, defaults.time);
};

$.toast = function (params = {}, $con = $('body')) {
	if(Object.hasOwn(params,'text')){
		params.msg = params.text
	}
	let opt = {
		$con: $('body'),
		type: 'main',
		msg: '',
		autoClose: true,
		time: 3000,
		timeout: false,
		shadow: false,
		icon: true,
		transition: 300,
		$toast: false,
		$shadow: false,
		preinstall: false,
		position: 'fixed',
		shadowCss: {},
		toastCss: {},
		icons: {
			success: '&#xe976;',
			error: '&#xe996;',
			warning: '&#xe996;',
			main: '&#xe996;',
			load: '&#xe649;',
		},
	}
	const newId = () => {
		let n = 10
		var chars = [
			'0',
			'1',
			'2',
			'3',
			'4',
			'5',
			'6',
			'7',
			'8',
			'9',
			'A',
			'B',
			'C',
			'D',
			'E',
			'F',
			'G',
			'H',
			'I',
			'J',
			'K',
			'L',
			'M',
			'N',
			'O',
			'P',
			'Q',
			'R',
			'S',
			'T',
			'U',
			'V',
			'W',
			'X',
			'Y',
			'Z',
			'a',
			'b',
			'c',
			'd',
			'e',
			'f',
			'g',
			'h',
			'i',
			'j',
			'k',
			'l',
			'm',
			'n',
			'o',
			'p',
			'q',
			'r',
			's',
			't',
			'u',
			'v',
			'w',
			'x',
			'y',
			'z',
		]
		var res = ''
		for (var i = 0; i < n; i++) {
			var id = Math.ceil(Math.random() * 62)
			res += chars[id] || ''
		}
		return res
	}
	const open = () => {
		let sIcon = opt.icon
			? `<span class="toast_icon icons_web">${opt.icons[opt.type] || opt.icons.main
			}</span>`
			: ''
		let $toast = $(
			`<div id="toast_${opt.id}" class="toast-pc ${opt.type}" data-author="mt">${sIcon}<span>${opt.msg}</span></div>`
		)
		let $shadow = $(
			`<div id="toast_shadow_${opt.id}" class="toast_shadow" data-author="mt"></div>`
		)

		$toast.css({ position: opt.position })
		if (opt.shadowCss && Object.keys(opt.shadowCss).length)
			$shadow.css({
				cssText: `${$shadow.attr('style')};${opt.shadowCss}`,
			})
		else
			$shadow.css({
				position: opt.position,
			})

		if (opt.toastCss && Object.keys(opt.toastCss).length)
			$toast.css(opt.toastCss)

		opt.$toast = $toast
		this.$toast = $toast
		opt.$shadow = $shadow

		closeAll(0)

		opt.$con.append($toast)

		if (opt.shadow) opt.$con.append($shadow)
		if (!opt.transition) {
			$toast.show()
			$shadow.show()
		} else {
			$toast.fadeIn(opt.transition)
			$shadow.fadeIn(opt.transition)
		}

		if (opt.autoClose)
			setTimeout(() => {
				close()
			}, opt.time)
		return opt.id
	}
	const close = (ms = 300) => {
		opt.$toast.fadeOut(ms || opt.transition)
		opt.$shadow.fadeOut(ms || opt.transition)

		// setTimeout(() => {
		//     opt.$toast.remove()
		//     opt.$shadow.remove()
		// }, ms)
		opt.timeout = false
	}
	const closeAll = (ms = 300) => {
		let $toast = $('.toast-pc[data-author=mt]')
		let $shadow = $('.toast_shadow')
		$toast.fadeOut(ms || opt.transition)
		$shadow.fadeOut(ms || opt.transition)
		setTimeout(() => {
			$toast.remove()
			$shadow.remove()
		}, ms)
		opt.timeout = false
	}

	let new_opt = {
		id: newId(),
		...opt,
	}
	if (typeof params == 'string') {
		$con = $con || opt.$con
		switch (params) {
			case 'login':
				new_opt = {
					...new_opt,
					$con,
					type: 'main',
					icon: false,
					autoClose: false,
					shadow: false,
					msg: '正在登录...',
				}
				break
			case 'dbUp':
				new_opt = {
					...new_opt,
					$con,
					type: 'warning',
					autoClose: false,
					shadow: true,
					msg: '正在升级数据库...',
				}
				break
			case 'connectionless':
				new_opt = {
					...new_opt,
					$con,
					type: 'error',
					msg: '网络连接失败，请恢复后再尝试',
				}
				break
			case 'needNetwork':
				new_opt = {
					...new_opt,
					$con,
					type: 'warning',
					msg: '无法连接到服务器，请检查您的网络设置',
				}
				break
			case 'un_online_file':
				new_opt = {
					...new_opt,
					$con,
					type: 'error',
					msg: '云端文件，请检查您的网络连接状态',
				}
				break
			case 'operation':
				new_opt = {
					...new_opt,
					$con,
					autoClose: false,
					shadow: true,
					type: 'warning',
					msg: '正在操作',
				}
				break
			case 'loading':
				// new_opt = { ...new_opt, $con, autoClose: false, shadow: true, type: "success", msg: "加载中" };
				let divStr = `
                        <div class="loadingView">
                            <div id="global_top_dialog" ref="global_top_dialog" class="po-loadingTop" style="display: block;">
                                <div class="sk-wave">
                                    <div class="sk-rect sk-rect-1"></div>
                                    <div class="sk-rect sk-rect-2"></div>
                                    <div class="sk-rect sk-rect-3"></div>
                                    <div class="sk-rect sk-rect-4"></div>
                                    <div class="sk-rect sk-rect-5"></div>
                                </div>
                            </div>
                        </div>`
				new_opt = {
					...new_opt,
					$con,
					icon: false,
					autoClose: false,
					shadow: true,
					type: 'loading',
					msg: divStr,
					transition: 0,
				}
				break
			case 'synchronization':
				new_opt = {
					...new_opt,
					$con,
					icon: false,
					autoClose: false,
					shadow: true,
					type: 'warning',
					msg: '正在同步',
					shadowCss: 'background: none !important',
				}
				break
		}
	} else
		new_opt = {
			...new_opt,
			...params,
			$con: $con,
		}

	if (params.$con || $con) new_opt.position = 'absolute'

	opt = new_opt

	// if ($(".toast[data-author=mt]").length > 0) $(".toast[data-author=mt]").remove();
	// if ($("#toast_shadow[data-author=mt]").length > 0) $("#toast_shadow[data-author=mt]").remove();
	open()
}
/** -end- web注入css集合 */

/** -start- jsp i18n 国际化html转义 */

pcUtil.$getPoTime = function (time) {
	let rtn = ''
	// 时间戳的情况
	if (/^\d+$/g.test(time)) {
		time = new Date(Number(time))
	}
	let timer = typeof time === 'object' ? time : new Date(time.replace(/-/g, '/'))
	let timerTime = Math.ceil(timer.getTime() / 1000)
	let nowTime = Math.ceil(new Date().getTime() / 1000)
	let TimeDifference = nowTime - timerTime
	// 
	if (TimeDifference <= 0) {
		// 针对脏数据处理
		rtn = '刚刚'
	} else if (TimeDifference < 3600) {
		rtn = Math.ceil(TimeDifference / 60) + "分钟前"
	} else if (TimeDifference > 3600 && TimeDifference < 86400) {
		// 一天内
		rtn = Math.ceil(TimeDifference / 3600) + "小时前"
	} else if (TimeDifference > 86400 && TimeDifference < (86400 * 30)) {
		// 30天内
		rtn = Math.ceil(TimeDifference / 86400) + "天前"
	} else if (TimeDifference > (86400 * 30) && TimeDifference < (86400 * 30 * 12)) {
		// 一年内
		rtn = Math.ceil(TimeDifference / (86400 * 30)) + "个月前"
	} else {
		rtn = getFullMonth(timer)
	}
	// 转换过内月份
	function getFullMonth(timer) {
		let zhMonth = timer.getMonth() + 1
		zhMonth = zhMonth < 10 ? ('0' + zhMonth) : zhMonth
		return timer.getFullYear() + '-' + zhMonth + '-' + timer.getDate()
	}
	return rtn
}
/** -end- jsp i18n 国际化html转义 */
/**
 * 获取日期字符串：yyyy-MM-dd HH:mm:ss
 * @return {}
 */
pcUtil.getDateTimeLocal = function () {
	const date = new Date();
	const year = date.getFullYear().toString().padStart(4, '0');
	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const hour = date.getHours().toString().padStart(2, '0');
	const minute = date.getMinutes().toString().padStart(2, '0');
	const second = date.getSeconds().toString().padStart(2, '0');
	return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// 获得真实文字长度[字母1文字2]
pcUtil.getCharLength = function (str) {
	if (typeof str == "string") {
		var len = 0
		for (var i = 0; i < str.length; i++) {
			if ((str.charCodeAt(i) < 0) || (str.charCodeAt(i) > 255))
				len = len + 2
			else {
				len = len + 1
			}
		}
		return len
	} else {
		return 0
	}
}
pcUtil.localChange = function (e) { var t = $.extend({ tmp: Math.random() }, e); localStorage.setItem("po_local_change_edit", JSON.stringify(t)) }
