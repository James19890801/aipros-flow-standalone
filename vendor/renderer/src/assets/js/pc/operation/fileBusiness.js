import ServerUtil from "../server/server.js";
import FileDatabase from "./fileDatabase.js";
import UserOperation from "../db/user.js";
import { Toast } from "../class.js";
/**
 * 文件业务逻辑操作相关
 * 		与页面元素高耦合度的文件操作
 * @param {"chart/folder"} fileType
 * @param {"chartId/folderId"} fileId
 */
const FileBusiness = {};
/**
 * 中转函数
 * @param {"FileBusiness方法名"} k
 * @param {"文件id，folderId/chartId"} fileId
 * @param {"文件类型 chart/folder"} fileType
 * @param {"回调"} callback
 */
FileBusiness.func = function (k, fileId, fileType, callback = function () { }, chart) {
	if (!k || !FileBusiness[k]) callback()
	else FileBusiness[k](fileId, fileType, callback, chart);
};
// 定位到文件所在位置
FileBusiness.location = function (fileId, fileType, callback = function () { }) {
	FileDatabase.getChartById(fileId, chart => {
		if (chart) callback(chart);
		else callback(null);
	});
};
// 跳转预览页
FileBusiness.view = function (fileId, fileType, callback,nowChart) {
	let name = "folders";
	if (fileType == "chart") name = "charts";
	FileDatabase.getChartById(fileId, chart => {
		let chartType = ''
		if(!chart && nowChart){
			chart = nowChart
		}
		if (chart.category.indexOf("mind") >= 0 || ['fishbone', 'timeline', 'ishikawa'].includes(chart.category)) 
			chartType = { url: `./src/v5_editor/source/compile/mindmap/view.html?${nowChart.filepath ? `filepath=${nowChart.filepath}`:`chartId=${fileId}`}` };
		else if (chart.category == "outline") 
			chartType = { url: `./src/v5_editor/source/compile/outline/view.html?${nowChart.filepath ? `filepath=${nowChart.filepath}`:`chartId=${fileId}`}#outline` };
		else if (chart.category == "markdown") 
			chartType = { url: `./src/markdown-editor/view.html?${nowChart.filepath ? `filepath=${nowChart.filepath}`:`chartId=${fileId}`}` };
		else chartType = { url: `./src/v5_editor/source/compile/diagrams/view.html?${nowChart.filepath ? `filepath=${nowChart.filepath}`:`chartId=${fileId}`}` };
		if (chart) pcUtil.openWin(chartType);
		else new Toast({ type: "error", msg: "获取文件数据失败" });
	});
};
// 特殊字符转换
FileBusiness.filterXss = function (val) {
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
// 重命名
FileBusiness.rename = function (fileId, fileType, callback) {
	if (!navigator.onLine) {
		new Toast({ type: "warning", msg: "无法连接到服务器，请检查您的网络设置" });
		return;
	}
	var $file = $("#" + fileId), name = $file.find("label:first").text();

	$("#dlg_new_folder").attr("title", "重命名");
	$("#dlg_new_folder").dialog();
	$("#folder_new_title").val(name).select();

	// 确定按钮
	$("#btn_submit_folder").off().on("click", function () {
		//如果正在提交，不进行提交，防止重复提交
		if ($("#folder_new_title").attr("submitting")) return;

		var title = FileBusiness.filterXss($.trim($("#folder_new_title").val()));
		// 新名称与旧名称相同
		if (title == name) $("#dlg_new_folder").dialog("close");
		else if (title != "") {
			$("#folder_new_title").attr("submitting", "true"); //标识正在提交

			if (title.length > 60) title = title.substring(0, 60);
			if (fileType == "folder") {
				FileDatabase.updateFolder(fileId, false, { title }, callback);
				// PushOperation.folder["rename"](fileId, title);
				ServerUtil.folderRename({ folderId: fileId, title }, res => {
					if (res.code == 200)
						new Toast({ type: "success", msg: "操作成功" });
				})
			}
			else {
				FileDatabase.updateChart(fileId, false, { title }, callback);
				// // ipc.sendToHost('setTitle', false, title);
				// PushOperation.chart["rename"](fileId, title);
				ServerUtil.chartRename({ chartId: fileId, title }, res => {
					if (res.code == 200)
						new Toast({ type: "success", msg: "操作成功" });
				})
				// 是否有这个文件打开的tab 要同时修改 Title
				ipc.sendToHost('setTitleByChartId', fileId, title)
			}

			$("#dlg_new_folder").dialog("close");
			$("#folder_new_title").val("");
			$("#folder_new_title").removeAttr("submitting");

			$file.find("label:first").text(title);
		}
		else $("#folder_new_title").focus();
	});

	// 回车触发确定事件
	$("#folder_new_title").off("keyup").on("keyup", function (e) {
		e.stopPropagation();
		if (e.keyCode == 13) $("#btn_submit_folder").trigger("click");
	});
};
// 协作
FileBusiness.colla = function (fileId, fileType, callback) {
	collaboration.init(fileId, fileType);
	$("#colla_add").dialog();
	$("#colla_add .colla-suggest-box").empty();
	$("#add_step2").hide();
	$("#add_step1").show();
};
// 移动到回收站
FileBusiness.del = function (fileId, fileType, callback, chart) {
	if (!navigator.onLine && fileId.length >= 13) {
		new Toast('needNetwork')
		return
	}
	let userId = UserOperation.getUk();
	let delFail = [];
	let tabs = [];
	var con = $("#" + fileId), title = pcUtil.filterXss(con.find("label").text());

	let content = "您将把&nbsp;<i><b>" + title + "</b></i>&nbsp;&nbsp;移除到垃圾箱中，是否继续？<br><br>删除后，您可以从回收站恢复文件。";
	if (fileId.length <= 13 && fileType == 'chart') {
		const { filepath } = chart
		ipc.invoke('loadFileB64', { type: 'local', path: filepath }).then((result) => {
			if (result.code == 200) {
				if (pcUtil.isMac()) {
					content = `您将把 【${title}】移除到系统废纸篓中，是否继续？<br/>
					删除后，您可从废纸篓中恢复文件。`
				} else {
					content = `您将把 【${title}】移除到系统回收站中，是否继续？<br/>
					删除后，您可从回收站中恢复文件。`
				}
				$.confirm({
					content,
					onConfirm: function () {
						ipc.invoke('deleteFile', filepath).then((res) => {
							if (res && res.code == 200) {
								new Toast({ type: "success", msg: "删除成功" });
								pageContext.resetAndloadFiles()
							} else {
								new Toast({ type: "error", msg: "删除失败" });
							}
						})
					}
				});
			}
			else {
				ipc.invoke('deleteFile', filepath).then((res) => {
					pageContext.resetAndloadFiles()
				})
			}
		})
		return
	}
	// title = Util.filterXss(title);
	//小组文档del操作
	if (fileType == 'notes') {
		$.confirm({
			content: "您将把&nbsp;<i><b>" + title + "</b></i>&nbsp;&nbsp;删除，是否继续？<br><br>删除后文件无法恢复。",
			onConfirm: function () {
				let delete_tost = new Toast({ autoClose: false, shadow: true, type: "main", msg: "正在删除..." });
				ServerUtil.teamDelNote(fileType, fileId, function (res) {
					if (res.result == "success") {
						con.remove();
					}
					delete_tost.close();
					new Toast({ type: "success", msg: "删除成功" });
				})
			}
		});
		return;
	}
	if (fileId.split(",").length > 1) {
		content = "您将把文件批量移除到垃圾箱中，是否继续？<br><br>删除后，您可以从回收站恢复文件。";
	}

	ipc.sendToHost('getTabChartIds');
	ipc.once("getTabChartIds_callback", (e, tabFileIds) => {
		tabs = tabFileIds.split(",");

		$.confirm({
			content: content,
			onConfirm: function () {
				let delete_tost = new Toast({ autoClose: false, shadow: false, type: "main", msg: "正在删除..." });
				let name = "folders";
				if (fileType == "chart") { name = "charts" };

				let endFn = (file = {}) => {
					delete_tost.close();

					setTimeout(() => {
						if (fileType == "chart" && delFail.length > 0 && fileId.split(",").length > 1) {
							new Toast({ type: "success", msg: "除已打开文件外，其他文件已删除" });
							callback(file);
						}
						else if (fileType == "chart" && delFail.length > 0 && fileId.split(",").length == 1) new Toast({ type: "warning", msg: "文件已打开，请关闭后再试" });
						else {
							new Toast({ type: "success", msg: "删除成功" });
							callback(file);
						}
					}, 500)
				};
				let idArr = fileId.split(",");
				idArr.map((item_id, i) => {
					let query = { userId, deleted: false, id: item_id };
					console.log(`本地删除文件夹操作：id=${item_id}`);

					if (fileType == "chart") {
						FileDatabase.getChartById(item_id, chart => {

							if (chart) {
								if (
									tabs.indexOf(chart.id) >= 0 ||
									tabs.indexOf(chart.dbId) >= 0 ||
									tabs.indexOf(chart.chartId) >= 0
								) {
									delFail.push(chart);
									endFn(chart);
								}
								else {
									chart.deleted = true;
									ServerUtil.deleteFileOrFolder({
										fileType,
										fileId: item_id,
										resource: $('.con-left-btn a.active').attr('data-nav')
									}, res => {
										endFn(chart)
									}, err => {
										endFn(chart)
									})
									// FileDatabase.updateChart(chart.id, false, chart, chart => {
									// 	PushOperation.chart["delete"](chart.id);
									// 	if(i == (idArr.length - 1)) endFn(chart);
									// });
								}
							}
							else {
								if (i == (idArr.length - 1)) endFn(chart);
							}
						});
					}
					else {
						ServerUtil.deleteFileOrFolder({
							fileType,
							fileId: item_id,
							resource: $('.con-left-btn a.active').attr('data-nav')
						}, res => {
							endFn()
						}, err => {
							endFn()
						})
					}
				});
				ipc.invoke('loadFileB64', { type: 'cahce', path: 'history/cache.json' }).then((result) => {
					if (result.code == 200) {
						let history = JSON.parse(decodeURIComponent(escape(atob(result.data))))
						history = history.filter(d => !idArr.includes(d.chartId))
						ipc.invoke("saveFileB64",
							{ type: 'cache', path: "history/cache.json", data: btoa(unescape(encodeURIComponent(JSON.stringify(history)))) }).then(() => {
							})
					}
				})
			}
		});
	})
};
// 退出协作
FileBusiness.uncolla = function (fileId, fileType, callback) {
	var con = $("#" + fileId), title = con.find("label").text();
	$.confirm({
		content: "您将退出<b>&nbsp;<i>" + title + "</i>&nbsp;</b><br><br>的协作状态，退出后您无法查看或者编辑",
		onConfirm: function () {
			// Util.loading({ show: true, content: "操作中..." });
			ServerUtil.quitColla(fileId, fileType, function (res) {
				con.remove();
				// Util.loading("close");
				new Toast({ type: "success", msg: "退出成功" });
				callback()
			}, function (err) {
				// Util.loading("close");
				new Toast({ type: "success", msg: "退出失败" });
				callback()
			});
		}
	});
};
// 取消收藏
FileBusiness.unfav = function (fileId, fileType, callback) {
	var con = $("#" + fileId), title = con.find("label").text(), kvId = con.attr("data-kv");
	var param = { fileType: fileType, fileId: kvId, resource: "fav" };
	$.confirm({
		content: "您确认取消收藏&nbsp;<b><i>" + title + "</i></b>&nbsp; 文件？",
		onConfirm: function () {
			// Util.loading({ show: true, content: "操作中..." });
			ServerUtil.favourite(fileId, fileType, function (res) {
				con.remove();
				// Util.loading("close");
				new Toast({ type: "success", msg: "取消成功" });
				callback();
			}, function (err) {
				// Util.loading("close");
				new Toast({ type: "error", msg: "取消失败" });
				callback();
			})
		}
	});
};
// 彻底删除
FileBusiness["delete"] = function (fileId, fileType, callback) {
	let userId = UserOperation.getUk();
	var con = $("#" + fileId), title = pcUtil.filterXss(con.find("label").text());
	var param = { fileType: "", fileId: "" };
	var content = "您将把&nbsp;<b><i>" + title + "</i></b>&nbsp;&nbsp;从垃圾箱中彻底删除，是否继续？<br>此操作不可恢复。";

	param.fileId = fileId;
	param.fileType = fileType;

	$.confirm({
		content: content,
		onConfirm: function () {
			let delete_tost = new Toast({ autoClose: false, shadow: false, type: "main", msg: "正在删除..." });
			let name = "folders";
			if (fileType == "chart") name = "charts";

			console.log(`开始执行 彻底删除 ${fileType}, id=${fileId}`);
			FileDatabase.removeChart(fileId, chart => {
				callback(chart);
				delete_tost.close();
				new Toast({ type: "success", msg: "删除成功" });
				//换删除接口
				ServerUtil.deletedFiles({
					...param,
				}, res => {
					console.log(res)
					pageContext.loadFiles()
				}, err => {

				})

				// PushOperation.chart["trash_delete"](fileId);
			});

		}
	});
};
// 恢复
FileBusiness.restore = function (fileId, fileType, callback) {
	var con = $("#" + fileId), title = pcUtil.filterXss(con.find("label").text());
	var content = "您将把&nbsp;<b><i>" + title + "</i></b>&nbsp;&nbsp;从垃圾箱中还原，是否继续？";
	$.confirm({
		content: content,
		onConfirm: function () {
			if (fileType == "chart") { name = "charts" }
			console.log(`本地恢复文件操作：id=${fileId}`);
			ServerUtil.restoreFiles({ fileType, fileId }, res => {
				if (res) {
					new Toast({ type: "success", msg: "操作成功" });
					callback()
				}
			})
		}
	});
};
// 克隆
FileBusiness.clone = function (fileId, fileType, callback) {
	var con = $("#" + fileId);

	FileDatabase.copyChart(fileId, false, res => {
		new Toast({ type: "success", msg: "操作成功" });
		callback(res);
	}, error => {
		if (error == "offline") new Toast("un_online_file");
		else new Toast({ type: "error", msg: "获取文件数据失败" })
	});
};
FileBusiness.export = function (id, tp, callback) {
	if (!id) return;
	$.confirm({
		content: "您将要将文件导出至个人文件根目录中",
		onConfirm: function () {
			// Util.loading({ show: true, content: "正在导出至个人文件中..." });
			ServerUtil.movetouser(id, function (res) {
				// Util.loading("close");
				if (res.result == "success") {
					setTimeout(function () {
						new Toast({ type: "success", msg: "成功到处至个人文件" });
					}, 2000);
				}
				else if (res.result == "files") {
					new Toast({ type: "error", msg: "导出失败，请检查个人文件容量后重试" });
				}
			})
		}
	});

};
// 发布
FileBusiness.pubpo = function (fileId, fileType, callback, data) {
	if (data) pageContext.files.pubpoWin({ width: "744px", height: '644px', type: 'pubpo', title: '发布', data });
};
// 取消发布
FileBusiness.unpubpo = function (fileId, callback) {
	ServerUtil.publish(fileId, "private", res => {
		new Toast({ type: "success", msg: "取消发布成功，已处于私密状态" });
		callback && callback(res);
	}, error => {
		if (error == "offline") new Toast("needNetwork");
	})
};
// 分享
FileBusiness.share = function (fileId, fileType, callback) {
	pageContext.files.shareWin(fileId);
};
// 分享协作
FileBusiness.sharecolla = function (fileId, fileType, callback) {
	pageContext.files.sharecollaWin(fileType, fileId);
};
// 复制 和 移动
FileBusiness.copy = function (id, tp, callback,chartData) {
	let orgId, opType;
	let userId = window.localStorage.getItem("processon_userKey");
	let chartCopyUrl = "", chartMoveUrl = "";
	var folderCopyUrl = chartCopyUrl = "/folder/copy", folderMoveUrl = chartMoveUrl = "/folder/move";

	// if (tp == "chart") $("#dlg_copy #btn_submit_copy").show();
	// else $("#dlg_copy #btn_submit_copy").hide();

	$("#dlg_copy").dialog().css({ 'width': '556px' });
	var menu = $("#dlg_copy .content-menu"), fId = $(".dir .active").data("f-id"), nextFolderList = {};
	initFolderList();

	// 文件移动
	$("#btn_submit_move").off().on("click", function () {
		if (!menu.find(".copy-folder-name h2").hasClass("active")) {
			new Toast({ type: "error", msg: "请选择文件夹" }, $("#dlg_copy"));
			return;
		}
		if (typeof pageContext.params.teamId != "undefined" || typeof orgId != "undefined") {
			var params = {};
			params.teamId = typeof pageContext.params.teamId != "undefined" ? pageContext.params.teamId : "";
			params.orgId = typeof orgId != "undefined" ? orgId : "";
			Util.checkOrgExpire(function (result) {
				if (!result) {
					return false;
				} else {
					if (tp == "folder") {
						move_copy(folderMoveUrl, "move");
					} else {
						move_copy(chartMoveUrl, "move");
					}
				}
			}, params);
		} else {
			if (tp == "folder") {
				move_copy(folderMoveUrl, "move");
			} else {
				move_copy(chartMoveUrl, "move");
			}
		}
	});
	// 文件复制
	$("#btn_submit_copy").off().on("click", function () {
		if (tp == 'folder') {
			if (!pcUtil.isOnline()) {
				new Toast("needNetwork");
				return;
			}
			var folderId = menu.find("h2.active").parent().hasClass("team-folder") || menu.find("h2.active").parent().hasClass("org-folder") ? "" : menu.find("h2.active").attr("folderId");

			ServerUtil.folderCopy({ fileId: id, targetFolderId: folderId }, (res) => {
				$("#dlg_copy").dialog("close");
				new Toast({ type: "success", msg: "操作成功" });
				$(document).trigger("click.file-op");
				callback({}, { type: 'copy' });
			}, error => {
				new Toast({ type: "error", msg: error });
			})
			return
		}
		var chartCategory = (chartData && chartData.category) || "flow";
		FileDatabase.hasFileNum(true, id.split(",").length, true, `newfile-copyfile`, chartCategory).then(res => {
			if (res.no) return;
			if (!menu.find(".copy-folder-name h2").hasClass("active")) {
				new Toast({ type: "error", msg: "请选择文件夹" }, $("#dlg_copy"));
				return;
			}

			move_copy('', "copy");
			// var ACDom = menu.find(".active");

			// if (ACDom.parents().hasClass("person-folder")) {
			// 	if (tp == "folder") {
			// 		move_copy(folderCopyUrl, '', 'person');
			// 	} else {
			// 		move_copy(chartCopyUrl, "copy", 'person');
			// 	}
			// }
			// else {
			// 	if (tp == "folder") {
			// 		move_copy(folderCopyUrl, "copy");
			// 	} else {
			// 		move_copy(chartCopyUrl, "copy");
			// 	}
			// }
		}).catch(err => {
			if (chartCategory == "markdown") {
				if (!menu.find(".copy-folder-name h2").hasClass("active")) {
					new Toast({ type: "error", msg: "请选择文件夹" }, $("#dlg_copy"));
					return;
				}

				move_copy('', "copy");
			}
			else {
				$("#dlg_copy").dialog("close")
			}
		});
	});
	function move_copy(url, type, person) {
		var folderId = menu.find("h2.active").parent().hasClass("team-folder") || menu.find("h2.active").parent().hasClass("org-folder") ? "" : menu.find("h2.active").attr("folderId");
		// var teamId = menu.find("h2.active").parents(".team-folder").children("h2").attr("folderId");
		if (folderId == userId) { //团队文件复制到个人跟目录时要对文件夹ID置空,个人文件夹树在团队内展示为根节点为userId的目录树
			folderId = ''
		}
		let operation_toast = new Toast("operation", $("#dlg_copy"));
		var moveParams = { fileType: tp, fileId: id, target: folderId, teamId: (typeof pageContext.params.teamId != "undefined" ? pageContext.params.teamId : ""), orgId: (typeof orgId != "undefined" ? orgId : "") }
		if (person == 'person') {
			moveParams.orgId = ''
		}

		let name = "folders";
		if (tp == "chart") name = "charts";

		// 离线状态不允许文件夹复制
		if (!pcUtil.isOnline()) {
			new Toast("needNetwork");
			return;
		}
		let endLoad = (file = {}) => {
			$("#dlg_copy").dialog("close");
			operation_toast.close();
			new Toast({ type: "success", msg: "操作成功" });
			//清空选中
			$(document).trigger("click.file-op");

			callback(file, { type });
		};
		let errLoad = err => {
			$("#dlg_copy").dialog("close");
			operation_toast.close();

			if (pcUtil.isOnline()) new Toast({ type: "error", msg: "操作失败" });
			else new Toast("un_online_file");

			//清空选中
			$(document).trigger("click.file-op");
		};


		if (type == "copy") {

			let obj = {
				type,
				fileIds: id,
				targetFolderId: folderId,
			}

			ServerUtil.batchOperation(obj, res => {
				if (res.code == "200") {
					endLoad();
				} else if (res.code == '815') {
					// ipc.
					console.log("815")
				}
			},res => {
				errLoad();
			})


		}
		// 移动
		else if (type == "move") {
			let obj = {
				fileType: tp,
				fileId: id,
				targetFolderId: folderId,
			}
			console.log(moveParams)

			const isPatch = id.split(",").length > 1

			if (isPatch) {
				obj.type = "move"
				obj.fileIds = id
				ServerUtil.batchOperation(obj, res => {
					if (res.code == "200") {
						endLoad();
					}
				},res => {
				errLoad();
			})
			} else {
				ServerUtil.moveCharts(obj, res => {
					if (res.code == "200") {
						endLoad();
					}

				},res => {
				errLoad();
			})
			}

		}

	}
	function initFolderList() {
		menu.empty().html('<div class="copy-folder-name diagram-folder" style="padding-left:0px;"><h2 class="file-rotate" folderId="root"><span class="icons arrow">&#xe618;</span><span class="icons_web" style="color:#9aa5b8;margin-right:10px;">&#xe882;</span>我的云文件' + ((fId == "root" && !pageContext.params.teamId) ? "<span style='float:right;color:#ccc;font-size:12px;'>当前目录</span>" : "") + '</h2><div class="innerFolder"><div></div>');
		$(".no-auth").parent().find(".icons:not(.arrow)").css("color", "#cccccc");
		$(".no-auth").parent().css("color", "#cccccc");
		$(".copy-content-menu").scrollTop("0")
	}
	function loadPersonFileList() {
		ServerUtil.getfolderdata(function (res) {
			RenderFolderList(res, userId, "root")
		});
	}
	function loadOrgsFileList() {
		pcUtil.ajax({
			url: "/folder/getOrgfolder",
			data: { orgId: pageContext.orgId },
			success: function (data) {
				RenderFolderList(data, pageContext.orgId, "root")
			}
		});
	}
	function loadTeamsFileList(id) {
		pcUtil.ajax({
			url: "/folder/getTeamfolder",
			data: { teamId: id },
			success: function (data) {
				RenderFolderList(data, id, "root")
			}
		});
	}
	function loadDiagramsFileList(id) {
		ServerUtil.getfolderdata(function (res) {
			RenderFolderList(res, "root", "root")
		});
	}
	RenderFolderList(null, "root");
	// 初始当前目录所在根目录展开
	if (orgId && !pageContext.params.teamId) {
		$("#dlg_copy .copy-folder-name h2[folderId = " + pageContext.orgId + "]").click();
	} else if (pageContext.params.teamId) {
		$("#dlg_copy .copy-folder-name h2[folderId = " + pageContext.params.teamId + "]").click();
	} else {
		$("#dlg_copy .copy-folder-name h2[folderId = root]").click();
	}
	var dirIndex = 0;
	function RenderFolderList(data, $folderId, root) {
		if (data) {
			if (root == "root") {
				let newData = JSON.parse(JSON.stringify(data.folders));
				delete newData.root;
				for (var i in newData) {
					nextFolderList[i] = newData[i]
				}
				var $folders = data.folders.root;
			} else {
				var $folders = nextFolderList[$folderId];
			}
			var $rootFolder = menu.find("h2[folderId=" + $folderId + "]").next(".innerFolder");
			if ($folders && $folders.length > 0) {
				for (var i = 0; i < $folders.length; i++) {
					$rootFolder.append('<div class="copy-folder-name"><h2 class="file-rotate" folderId="' + $folders[i].folderId + '"><span class="icons arrow">&#xe618;</span><span class="floderBg"></span>' + $folders[i].title + (($folders[i].folderId == fId) ? "<span class='curFolder' style='float:right;color:#ccc;font-size:12px;'>当前目录</span>" : "") + '</h2><div class="innerFolder"><div></div>');
				}
			} else {
				menu.find("h2[folderId=" + $folderId + "]").addClass("none")
			}
			var $pl = $rootFolder.prev().css('paddingLeft');
			if ($pl) {
				$pl = $pl.substr(0, $pl.length - 2);
				$rootFolder.find('.copy-folder-name').children("h2").css('paddingLeft', $pl * 1 + 18 + 'px');
			}
		}
		$("#dlg_copy .copy-folder-name h2").off("click").on("click", function (e) {
			e.stopPropagation();
			var $this = $(this), pId = $this.attr("folderId");
			$("#btn_submit_move,#btn_submit_copy").enable();
			$('.copy-folder-name h2').removeClass('active');
			$this.addClass('active');
			if (opType == "batch") {
				var newId = id.split(",")[0]
			} else {
				var newId = id
			}
			//$this.parents(".copy-folder-name").children("h2[folderId = "+ newId +"]").length > 0
			if (pId == fId || pId == newId || (fId == "root" && pId == pageContext.params.teamId) || (fId == "root" && pId == orgId && !pageContext.params.teamId)) {
				$("#btn_submit_move").disable();
			}
			if ($this.parents().hasClass("person-folder")) {
				$("#btn_submit_move").disable();
			}
			if ($this.children(".no-auth").length > 0) {
				$("#btn_submit_move,#btn_submit_copy").disable();
				return
			}
			$this.toggleClass('file-rotate');
			if ($this.next('.innerFolder').find('h2').length > 0) {
				$this.next('.innerFolder').toggle(500);
			} else {
				if ($this.parent().hasClass("org-folder")) {
					loadOrgsFileList()
				} else if ($this.parent().hasClass("person-folder")) {

					loadPersonFileList()
				} else if ($this.parent().hasClass("team-folder") || ($this.parent().hasClass("diagram-folder") && pageContext.params.teamId)) {
					loadTeamsFileList($this.attr("folderId"))
				} else if ($this.parent().hasClass("diagram-folder")) {
					loadDiagramsFileList($this.attr("folderId"))
				} else {
					RenderFolderList(data, $this.attr("folderId"));
				}

			}
		})
		//	    当前目录所属文件夹展开
		if (orgId) {
			var dirList = $(".dir .files-nav-item");
		} else {
			var dirList = $(".dir .item");
		}
		if (dirIndex < dirList.length) {
			dirIndex++;
			$("#dlg_copy .copy-folder-name h2[folderId = " + dirList.eq(dirIndex).data("f-id") + "]").click();
		}
	}
};

//新建按钮组
FileBusiness["all"] = [];
FileBusiness["all"][7] = {
	nav: "all",
	events: {
		click: function (e) {
			e.stopPropagation();
			var obj = e.data.obj;
			var win = $(this).find(".popwin");
			win.toggleClass("active").find(".notifi-list .win-content").empty().data("curPage", 0);
			notification.count();
			win.off("click.popwin").on("click.popwin", function (e) {
				e.stopPropagation();
			});
			$(document).off("click.popwin").on("click.popwin", function (e) {
				var win = $(this).find(".popwin");
				win.removeClass("active").find(".win-content").empty().data("curPage", 0);
				notification.count();
			});
			if (!win.hasClass('active')) {
				return;
			}
			//加载更多 废弃
			// .find(".win-content").off("scroll.popwin").on("scroll.popwin", function(e){
			// 	if($(this).scrollTop() + $(this).height() >= this.scrollHeight && $(this).attr("isloading") == "false"){
			// 		notification.unreadList();
			// 	}
			// });
			this.focus();
			notification.unreadList(function () {
				win.find(".win-content-item").off("click.notifi").on("click.notifi", { obj: obj }, obj.itemClick);
				win.find(".notifi-target .win-header .icons").off("click.notifi").on("click.notifi", { obj: obj }, obj.backList);
			});
		},
		blur: function (e) {
			// var win = $(this).find(".popwin");
			// win.removeClass("active").find(".win-content").empty().data("curPage", 0);
			// notification.count();
			// $(this).removeAttr("tabindex");
		}
	},
	itemClick: function (e) {
		$(this).parents(".notifi-list")
			.css({
				position: "absolute",
				left: "-100%"
			}).delay(500)
			.hide(0);
		$(this).parents(".notifi-list").siblings('.notifi-target')
			.show(0)
			.css({
				position: "absolute",
				left: 0
			});
		ServerUtil.notificationMsg($(this).attr("detail-id"), function (res) {
			var type = res.notification.type;
			var str;
			if (res.error)
				str = '<span class="error-link">抱歉，展示通知详细信息时发生了错误，一些数据可能被发起者删除了</span>';
			else
				str = '<div>' + NOTIFICATION_TYPE[type].detail.call("simple", res) + '</div>';

			$(".notifi-target .win-content").html(str);
			if (NOTIFICATION_TYPE[type].execute) {
				NOTIFICATION_TYPE[type].execute.call($(".notifi-target .win-content"), res);
			}
		})
	},
	backList: function () {
		$(this).parents(".notifi-target")
			.css({
				left: ""
			}).delay(500)
			.hide(0);
		$(this).parents(".notifi-target").siblings('.notifi-list')
			.show(0)
			.css({
				left: ""
			});
	}
};

export default FileBusiness;
