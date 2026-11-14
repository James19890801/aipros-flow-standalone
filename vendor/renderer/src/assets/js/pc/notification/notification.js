import FileDatabase from "../operation/fileDatabase.js";
import ServerUtil from "../server/server.js";
import { Toast } from "../class.js";
import { tabGroup } from '../useIndex/utils'

let host = ipc.sendSync('getGlobal', "host");
var notification = {
	params: {
		page: 1,
		tp: "unread"
	},
	$badge: $(".icon_btn.msg .global-tip"),
	count: function () {
		var badge = $(".icon_btn.msg .global-tip");

		ServerUtil.notificationCount(function (res) {
			if (res.data.count > 0) {
				if (badge.length > 0) {
					badge.text(res.data.count);
				} else {
					$("<span class='badge warning global-tip'>" + res.data.count + "</span>").appendTo(".notice-icon .icon-warp");
				}
			} else {
				$('.notice-count').hide();
			}
		}, function (err) {

		});
	},
	initEvent: function () {
		var con = $("#noti-win"), content = con.find(".noti-content");
		con.find(".noti-nav a").off().on("click", function () {
			var obj = $(this), hasClass = obj.hasClass("active"), tit = obj.attr("tit");
			if (!hasClass) {
				content.empty();
				$(this).addClass("active").siblings().removeClass("active");
				if (tit == "read") {
					notification.params.tp = "read";
				} else {
					notification.params.tp = "unread";
				}
				notification.params.page = 1;
				notification.getNotiList(content, function () {
					notification.initEvent();
				});
			}
		});
		con.find(".noti-nav span").off().on("click", function (e) {
			var menu = $(".noti-menu");
			if (menu.length == 0) {
				menu = $("<ul class='noti-menu menu noarrow'></ul>").appendTo("#noti-win");
				var html = "<li><a href='javascript:;' tit='read'>全部已读</a></li><li><a href='javascript:;' tit='del'>全部删除</a></li>";
				menu.html(html);
			}
			menu.popMenu({
				target: this,
				position: "right",
				fixed: true,
				onClose: function () {
					$(".noti-nav span").removeClass("active");
				}
			});
			menu.find("a").off().on("click", function () {
				var type = $(this).attr("tit");
				if (type == "read") {
					notification.readAll();
				} else {
					notification.removeAll();
				}
				menu.popMenu("close");
			});
		});
		content.find(".noti-item").off().on("click", function (e) {
			var item = $(this);
			if (item.hasClass("read") || item.hasClass("disabled")) {
				return;
			}
			if (!notification.params.tp) {
				item.addClass('disabled');
			}
			var notiId = item.attr("tit");
			notification.read(notiId, item);
		});
		content.find(".noti-item span.close").off().on("click", function (e) {
			e.stopPropagation();
			var item = $(this).parents(".noti-item");
			var notiId = item.attr("tit");
			notification.remove(notiId, item);
		});
		$(".noti-item-more").off().on("click", function () {
			notification.params.page++;
			notification.getNotiList(content, function () {
				notification.initEvent();
			});
			setTimeout(function () {
				var scrollTop = content.scrollTop();
				content.animate({ scrollTop: scrollTop + 500 + 'px' }, 500);
			}, 200);
		});
	},
	/**
	 * 加载效果
	 * @param {} obj
	 * close:true,
	 * con:$dom,
	 * css:{} ——
		 * background:'#aaa',
		 * width:'10px',
		 * height:'10px'
	 */
	loadingball: function (params) {
		if (params.close) {
			$('.ball-spinner').hide();
			return;
		}
		var $Dom = params.con;
		if (!$Dom) {
			return;
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
	},
	/**
	 * 构建通知容器
	 * @param {} obj
	 */
	hideMenu: function (e) {
		if (e && $(e.target).hasClass("notice-icon")) return;
		$("#noti-win").hide();
		notification.count();
		$(document).off("click", notification.hideMenu);
	},
	renderCon: function (obj) {

		var con = $("#noti-win");
		if (con.length == 0) {
			con = $("<div id='noti-win' class='popWindow'></div>").appendTo("body");
			var html = "<div class='noti-head'><div class='noti-nav'><a tit='unread' class='active'>未读通知</a><a tit='read'>已读通知</a><span class='icons'>&#xe69b;</span></div></div><div class='noti-content'><span class='icons con-loading'>加载中...</span></div>";
			con.html(html);
		}
		// $(document).off("click", notification.hideMenu).on("click", notification.hideMenu);
		$("input").off("click", notification.hideMenu).on("click", notification.hideMenu);
		$("#noti-win").off("click.noti").on("click.noti", function (e) {
			e.stopPropagation();
		});
		var content = con.find(".noti-content").empty();
		var tit = con.find('.noti-nav .active').attr("tit");
		notification.params.page = 1;
		if (tit == 'read') {
			notification.params.tp = "read";
		} else {
			notification.params.tp = "unread";
		}
		notification.getNotiList(content, function () {
			notification.initEvent();
		});
		con.show();
	},
	/**
	 * 获取通知
	 * @param {} content
	 */
	getNotiList: function (content, callback) {
		notification.loadingball({ con: content });
		if (notification.isLoading) {
			return;
		}
		notification.isLoading = true;

		ServerUtil.notificationList(notification.params, function (res) {
			notification.loadingball({ close: true });
			if (!res.data) {
				$('.noti-item-more').hide();
				notification.isLoading = false;
				return;
			} else {
				$('.noti-item-more').show();
			}
			var list = res.data.list || [], count = list.length, users = res.data.users, pg = res.data.pageInfo.pageCount;
			if (pg == 0 && count == 0) {
				content.html("<div class='empty-link'><img class='notification' src='./src/assets/images/notification.svg' /><div></div>没有新通知</div>");
			} else {
				notification.renderNotiList(list, users, content, pg);
			}
			notification.isLoading = false;
			if (callback != null) {
				callback();
			}
		}, function (err) {
			notification.loadingball({ close: true });
			notification.isLoading = false;
		});
	},
	/**
	 * 构建通知列表
	 * @param {} list
	 * @param {} users
	 * @param {} content
	 */
	renderNotiList: function (list, users, content, count) {
		var html = "";
		for (var i = 0; i < list.length; i++) {
			var item = list[i];
			html += notification.renderNotiItem(item, users);
		}
		if (content.find(".noti-item").length == 0) {
			content.empty();
		}
		content.append(html);

		content.find("a").off().on("click", function () {

			let href = $(this).attr("href");
			let reference = $(this).attr("reference");
			let notification = $(this).attr("notification");
			let type = $(this).attr("data-type");
			let at = $(this).attr("data-at")
			let targetId = $(this).attr("data-targetId")
			let title = $(this).attr("data-title")
			$(this).parents(".noti-item").click();
			if (reference && type == "invite") {
				if (!pcUtil.isOnline()) new Toast({ msg: "协作文件请连接网络后访问", type: "error" });
				else {
					ServerUtil.notificationRead(notification, function (res) {
						console.log(res)
						if (res.code == 200) {
							let { chart, folder } = res.data;

							if (chart) {
								if (chart.deleted) {
									new Toast({ msg: "协作文件已删除", type: "error" });
									return;
								}
								if (chart.orgId) {
									new Toast({ msg: "团队文件，暂不支持", type: "error" });
									return;
								}

								let linkUrl = ''
								let category = chart.category
								if (category.indexOf('mind') >= 0)
									linkUrl = './src/v5_editor/source/compile/mindmap/index.html'
								// 思维笔记本地编辑器地址 
								else if (category.indexOf('outline') >= 0)
									linkUrl = './src/v5_editor/source/compile/outline/index.html'
								// 流程图本地编辑器地址
								else if (category.indexOf('flow') >= 0)
									linkUrl = './src/v5_editor/source/compile/diagrams/index.html'
								// 鱼骨图本地编辑器地址
								else if (category == 'uncategorized')
									linkUrl = './src/v5_editor/source/compile/diagrams/index.html'
								// 其他新增类型依靠思维导图展示（如：树形图）
								else linkUrl = './src/v5_editor/source/compile/diagrams/index.html'
								tabGroupExtend.addTab({ src: linkUrl + `?token=token&chartId=${chart.chartId}&dbId=${chart.dbId}`, title: chart.title });
								$(".popWindow").hide();
							}
							else if (folder) {
								if (folder.deleted) {
									new Toast({ msg: "协作文件已删除", type: "error" });
									return;
								}
								if (folder.orgId) {
									new Toast({ msg: "团队文件，暂不支持", type: "error" });
									return;
								}
								FileDatabase.saveFolderToDB(folder, folder => {
									let folederId = folder.folderId;
									let folderTitle = folder.title;
									tabGroup.getTab(0).webview.send("notificationRenderDirHome", { id: folederId, title: folderTitle });
									$(".popWindow").hide();
									tabGroupExtend.selectTab(0, false)
								});
							} else if (at) {
								const linkUrl = './src/v5_editor/source/compile/mindmap/index.html'
								tabGroupExtend.addTab({ src: linkUrl + `?token=token&chartId=${reference}&dbId=&targetId=${targetId}`, title: title });
								$(".popWindow").hide();
							}
						}
						else new Toast({ msg: "文件不存在", type: "error" });
					}, function (err) {
						new Toast({ msg: "文件不存在", type: "error" });
					})

				}
				return false
			}
			else if (type && type == 'myself') {
				tabGroupExtend.addTab({ src: `${href.startsWith('http') ? '' : host}${href}`, title: (title ? title : 'Processon') });
			}
			else {
				window.api.ipcRenderer.send('openUrl', `${href.startsWith('http') ? '' : host}${href}`);
				$(".popWindow").hide();
				return false
			}
		});

		var more = content.find(".noti-item-more");
		if (count > 1 && notification.params.page < count && more.length == 0) {
			more = $("<div class='noti-item-more'>更多</div>");
			more.appendTo(content);
		} else if (notification.params.page >= count) {
			more.remove();
		} else {
			more.appendTo(content);
		}
	},
	/**
	 * 生成具体通知的html代码
	 * @param {} item
	 * @param {} users
	 * @param {} content
	 * @return {}
	 */
	renderNotiItem: function (item, users) {
		var html = [], leftHtml = "", rightHtml = "";
		var user = { userId: "" };
		if (notification.type[item.type] == null || notification.type[item.type].sender == "system") {
			user.fullName = "ProcessOn";
		} else if (!item.senderId) {
			user.fullName = "[已注销]";
		} else if (!users[item.senderId]) {
			user.fullName = item.senderId;
		} else {
			user = users[item.senderId];
		}
		var text = notification.type[item.type] ? notification.type[item.type].text : "";
		if (item.type == "collaboration_invite" || item.type == "collaboration_joined") {
			text += "<div class='accept'><a data-type='invite'  href='/collaboration/invite/" + item.reference + "' reference='" + item.reference + "' notification='" + item.notificationId + "' target='_blank'>" + (!!item.referenceDes ? item.referenceDes : "未命名文件") + "</a></div>";
		} else if (item.type === "colla_chart_at") {
			let arr = item.referenceDes.split('丨')
			text += `<div><a data-type='invite' 
			data-at='true'
			data-title='${arr[0]}'
			data-targetId=${arr[1]}
			reference='${item.reference}'
			notification='${item.notificationId}' 
		    target='_blank'>${arr[0]}</a></div>`
		}
		else if (item.type === "chart_at") {
			let arr = item.referenceDes.split('丨')
			let arr1 = arr[1].split('&')
			let targetId = arr1[0]
			let pageId = arr1[1]
			text += `<div><a data-type='invite' 
			data-at='true' 
			data-title='${arr[0]}' 
			data-targetId=${targetId}
			reference='${item.reference}' 
			notification='${item.notificationId}' 
			href='/f/${item.reference}?targetId=${targetId}&pageId=${pageId}' 
			target='_blank'
			>${arr[0]}</a></div>`
		} else if (item.type == "org_join_invite" || item.type == "org_leave") {
			text += "<div class='accept'><a href='/organizations/" + item.reference + "' target='_blank'>" + (!!item.referenceDes ? item.referenceDes : "未命名团队") + "</a></div>";
		} else if (item.type == "org_set_role") {
			text += "<div class='accept'><a href='/organizations/" + item.reference + "' target='_blank'>" + (!!item.referenceDes ? notification.roleMap[item.referenceDes] : "查看详情") + "</a></div>";
		} else if (item.type == "team_join_invite" || item.type == "team_leave") {
			text += "<div class='accept'><a href='/team/" + item.reference + "' reference='" + item.reference + "' target='_blank'>" + (!!item.referenceDes ? item.referenceDes : "未命名小组") + "</a></div>";
		} else if (item.type == "set_role") {
			text += "<div class='accept'><a href='/team/" + item.reference + "' reference='" + item.reference + "' target='_blank'>" + (!!item.referenceDes ? notification.roleMap[item.referenceDes] : "查看详情") + "</a></div>";
		} else if (item.type == "diagram_comment") {
			text += "<div class='accept'><a href='/view/" + item.reference + "' reference='" + item.reference + "' target='_blank'>" + (!!item.referenceDes ? item.referenceDes : "查看详情") + "</a></div>";
		} else if (item.type == "diagram_zan") {
			text += "<div class='accept'><a href='/view/" + item.reference + "' reference='" + item.reference + "' target='_blank'>查看详情</a></div>";
		} else if (item.type == "question_reply") {
			text += "<div class='accept'><span>" + (!!item.referenceDes ? item.referenceDes : "") + "</span></div>";
		} else if (item.type == "give_coupon" || item.type == "give_coupon_expire") {
			text = "<div class='accept'><span>" + text + "</span></div>";
		} else if (item.type == "reward_privatefile" || item.type == "add_member_date") {
			//兼容旧数据
			var txt = item.referenceDes == "365" ? "12" : item.referenceDes;
			txt = txt == "30" ? "1" : txt;
			text = text[0] + (!!txt ? txt + "个" : "") + text[1];
		} else if (item.type == "ac_add_member_days") {
			text = text[0] + item.referenceDes + text[1];
		} else if (item.type == "verify_success") {
			text += "<div class='accept'><a href='/view/" + item.reference + "' reference='" + item.reference + "' target='_blank'>" + (!!item.referenceDes ? item.referenceDes : "未命名文件") + "</a></div>";
		} else if (item.type == "add_file_count") {
			text += "<div class='accept'><a href='/diagraming/" + item.reference + "' reference='" + item.reference + "' target='_blank'>" + (!!item.referenceDes ? item.referenceDes : "未命名文件") + "</a></div>";
		} else if (item.type == "verify_fail" || item.type == "publish_off") {
			var t1 = item.referenceDes.split(":_back_:")[0];
			var t2 = item.referenceDes.split(":_back_:")[1];
			text = text[0] + "<a href='/view/" + item.reference + "' reference='" + item.reference + "' target='_blank'>" + (!!t1 ? t1 : "未命名文件") + "</a>" + text[1] +
				"<div class='accept'><span>" + t2 + "</span></div>";
		} else if (item.type == "clone_file") {
			var t1 = item.referenceDes.split(":_file_:")[0];
			var t2 = item.referenceDes.split(":_file_:")[1];
			text = text[0] + "<a href='/view/" + item.reference + "' reference='" + item.reference + "' target='_blank'>" + (!!t1 ? t1 : "未命名文件") + "</a>" + text[1] +
				"<div class='accept'>收益<span style='font-weight:600;font-style:italic'>￥" + t2 + "</span></div>";
		} else if (item.type == "coupon_used_other_success") {
			text = text.replace(new RegExp("\\{1\\}", "g"), '<b>' + item.referenceDes.split(":_param_:")[1] + '</b>');
		} else if (item.reference == "zhihu" || item.reference == "xhz" || item.reference == "wps" || item.reference == "ckt_org" || item.reference == "ckt_user" || item.reference == "jsj" || item.reference == "xsz") {
			var text = notification.type[item.type].text[item.reference];
			text += item.referenceDes;
		} else if (item.type == "system_upgrade") {
			text += item.referenceDes;
		} else if (item.type == "activity_welfare") {
			var text = '';
			text += item.referenceDes + " <a class='open_notification' target='_blank' href='/upgrade'>立即使用</a>";
		} else if (item.type == "p0_coupon_msg") {
			var text = '';
			text += item.referenceDes;
		} else if (item.type == "pay_success" || item.type == "st" || item.type == "upgrade_team_success" ) {
			var text = '';
			text = notification.type[item.type].text
		} else if (item.type == "handover_personal_space") {
			var text = '';
			let orgid = item.reference.split("|")[0];
			let teamid = item.reference.split("|")[1];
			text += `<a target='_blank' href='org?orgid=${orgid}&teamid=${teamid}'>${item.referenceDes}</a>`;
		} else if (
			item.reference === "zhihu" ||
			item.reference === "xhz" ||
			item.reference === "wps" ||
			item.reference === "ckt_org" ||
			item.reference === "ckt_user" ||
			item.reference === "jsj" ||
			item.reference === "xsz"
		) {
			text = this.type[item.type].text[item.reference]
			text += item.referenceDes
		}  else {
			if (item.referenceDes) {
				var text = '';
				text += item.referenceDes;
			} else {
				if (!notification.type[item.type]) {
					text = `不支持的通知类型`;
					// return text;
				}
				else text = notification.type[item.type].text || `不支持的通知类型 `;
			}
		}

		if (!notification.type[item.type] || notification.type[item.type].sender == "system") {
			leftHtml += '<img src="./src/assets/images/on.png"/>';
		} else {
			leftHtml += pcUtil.loadAvatar(user.userId);
		}
		rightHtml += '<div class="title">' + (typeof (pageContext) != "undefined" && pageContext.nickNameData && pageContext.nickNameData[user.userId] ? pageContext.nickNameData[user.userId] : user.fullName) + '</div>';
		rightHtml += '<div class="con">' + text + '</div>';
		rightHtml += '<div class="time">' + item.createTime + '</div>';
		// rightHtml += '<span title="点击删除" class="icons close">&#xe637;</span>';
		rightHtml += '<span class="icons close">&#xe637;</span>';
		var className = item.read ? "read" : "";
		html.push('<div class="noti-item ' + className + '" tit="' + item.notificationId + '">');
		html.push('<div class="noti-item-left">' + leftHtml + '</div>');
		html.push('<div class="noti-item-right">' + rightHtml + '</div>');
		html.push('</div>');

		return html.join("");
	},
	//用户存储所有通知类型的key
	type: {
		"chart_at": { text: "我在以下文件中提到了你：", sender: "user" },
		"colla_chart_at": { text: "我在以下文件中提到了你：", sender: "user" },
		"collaboration_invite": { text: "邀请你一起编辑文件:", sender: "user" },
		"collaboration_joined": { text: "加入了您的协作", sender: "user" },
		"org_join_invite": { text: "邀请您加入团队:", sender: "user" },
		"org_leave": { text: "已经退出团队", sender: "user" },
		"org_set_role": { text: "将您的团队角色设置为", sender: "user" },
		"team_join_invite": { text: "邀请您加入小组:", sender: "user" },
		"team_leave": { text: "已经退出小组", sender: "user" },
		"set_role": { text: "将您的小组角色设置为", sender: "user" },
		"diagram_comment": { text: "评论了你的文件：", sender: "user" },
		"diagram_zan": { text: "感觉你的文件很棒", sender: "user" },
		"follow": { text: "关注了你", sender: "user" },
		"invite_joined": { text: "接受您的邀请加入ProcessOn", sender: "user" },//缺失
		"question_reply": { text: "管理员：", sender: "system" },
		"reward_privatefile": { text: ["系统赠送的", "文件已经到达您的账户"], sender: "system" },
		"add_member_date": { text: ["恭喜您的个人版已经延长 ", "月，谢谢您的支持"], sender: "system" },
		"ac_add_member_days": { text: ["恭喜您的个人版已经延长 ", "天，谢谢您的支持"], sender: "system" },
		"pay_success": { text: "您已付费成功，升级为个人版，<a href='/upgrade'>点击查看您的vip特权</a>", sender: "system" },
		"st": { text: "您已付费成功，升级为团队版，<a href='/upgrade'>点击查看您的vip特权</a>", sender: "system" },
		"give_coupon": { text: "恭喜您获得1张优惠码！您可以去<a target='_blank' href='/setting#coupon' data-type='myself' data-title='福利中心'>我的优惠码</a>查看", sender: "system" },
		"give_coupon_expire": { text: "您有即将过期的优惠码尚未使用！您可以去<a target='_blank' href='/setting#coupon' data-type='myself' data-title='福利中心'>我的优惠码</a>查看", sender: "system" },
		"coupon_used_success": { text: "您的优惠码被用户使用，您获得了一个月的个人版奖励", sender: "system" },
		"coupon_used_other_success": { text: "您的优惠码被用户{1}使用了", sender: "system" },
		"upgrade_team_success": { text: "恭喜您已经成功升级到团队版，<a href='/upgrade/team'>点击查看您小组的vip特权</a>", sender: "system" },
		"verify_success": { text: "您提交的申请已经通过", sender: "system" },
		"verify_fail": { text: ["您提交的文件 ", " 未通过审核"], sender: "system" },
		"publish_off": { text: ["您公开文件 ", " 已被下架"], sender: "system" },
		"clone_file": { text: ["您的文件 ", " 被克隆"], sender: "system" },
		"member_expire": { text: "您的会员权限即将到期，会员到期后现有文件仍然可以浏览与编辑。为了方便您继续使用，<a href='/upgrade'>赶快去升级吧</a>", sender: "system" },
		"member_expired": { text: "您的会员权限已经到期，会员到期后现有文件仍然可以浏览与编辑。为了方便您继续使用，<a href='/upgrade'>赶快去升级吧</a>", sender: "system" },
		"team_expire": { text: "您的团队版权限即将到期，会员到期后现有文件仍然可以浏览与编辑。为了方便您继续使用，<a href='/upgrade'>赶快去升级吧</a>", sender: "system" },
		"team_expired": { text: "您的团队版权限已经到期，会员到期后现有文件仍然可以浏览与编辑。为了方便您继续使用，<a href='/upgrade'>赶快去升级吧</a>", sender: "system" },
		"system_upgrade": { text: " ", sender: "system" },
		"zhihu_code_month": {
			text: {
				"xhz": "恭喜你获得1个月小画桌高级版会员，快来兑换领取吧。<br/>兑换码：",
				"wps": "恭喜你获得1个月WPS超级会员，快来兑换领取吧。<br/>兑换码：",
				"ckt_user": "恭喜你获得1个月创客贴会员，快来兑换领取吧。<br/>兑换码：",
				"ckt_org": "恭喜你获得1个月创客贴会员，快来兑换领取吧。<br/>兑换码：",
				"jsj": "恭喜你获得1个月金数据会员，快来兑换领取吧。<br/>兑换码：",
				"xsz": "恭喜你获得学术志SPSS课程，快来兑换领取吧。<br/>兑换码：",
				"zhihu": "恭喜你获得1个月知乎盐选会员，快来兑换领取吧。<br/>兑换码："
			}, sender: "system"
		},
		"add_file_count": { text: "点赞量达到5个，您获得1个系统赠送的文件数，快去分享文件吧", sender: "system" },
		"activity_welfare": { text: "恭喜您获得", sender: "system" },
		"p0_coupon_msg": { text: "你有一张7.5折专属优惠券等待领取，现在领取，最少为你节省40元，请于2023年03月17日前领取使用。", sender: "system" },
		"handover_personal_space": { text: "微信二维码", sender: "system" },
		"activity_xhz_welfare": { text: "恭喜！「小画桌标准版会员（45天）」已到账，立即领取，开启高效白板协作新模式！<a target='_blank' href='https://xiaohuazhuo.com/i/5ed477db345db779d6f297f7'>立即领取</a>", sender: "system" }
	},
	roleMap: {
		"1_owner": "创建者", "2_admin": "管理员", "3_editor": "编辑者", "4_author": "作者", "5_reader": "浏览者"
	},
	removeAll: function () {
		notification.hideMenu();
		$.confirm({
			width: '320px',
			content: "您确定要删除所有的通知信息吗？",
			onConfirm: function () {
				$(".notice-icon .icon-warp .badge").remove();
				ServerUtil.notificationRemoveAll(function (res) {
					notification.$badge.hide();
					notification.count();
				});
			}
		});
	},
	remove: function (id, item) {
		ServerUtil.notificationRemove(id, function (res) {
			if (!item.hasClass('read')) {
				notification.count();
			}
			item.remove();
		});
	},
	read: function (notiId, item) {
		ServerUtil.notificationRead(notiId, function (res) {
			notification.count();
			if (res.code == 200) {
				item.addClass("read");
			}
		});
	},
	readAll: function () {
		ServerUtil.notificationReadAll(function (res) {
			notification.count();
			if (res.code == 200) {
				var noticeItems = $(".noti-item");
				noticeItems.addClass("read");
				if (notification.params.tp == 'unread') {
					noticeItems.addClass("disabled");
				}

				notification.$badge.hide();
			}
		})
	}
};
const Notification = notification;

export default Notification;
