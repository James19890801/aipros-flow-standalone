import UserOperation from "../db/user.js";
import DBUtil from "../db/db.js";
import ServerUtil from "../server/server.js";

/**
 * 文件数据逻辑操作相关
 * 		与页面元素0耦合度的文件操作
 * 包含: 文件数据的 查找\新建\克隆...
 * 		文件夹数据的 查找\新建\克隆...
 * 		文件定义数据的 查找\新建\克隆...
 */
const FileDatabase = {
	/**
	 * 生成新的id
	 * @param {"Number"} n
	 * @returns {string}
	 */
	newId: function (n) {
		n = n || 10;
		var chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
		var res = "";
		for (var i = 0; i < n; i++) {
			var id = Math.ceil(Math.random() * 62);
			res += chars[id] || "";
		}
		return res;
	},

	/* -start- 文件相关*/
	/**
	 * 通过文件 id/dbId 获取文件数据
	 * @param {"文件id/dbId"} chartId
	 * @param {"返回 chart"} callback
	 * @param {"其他参数：notS(不保存本地)"} op
	 */
	getChartById: function (chartId, callback = function () { }, op = {}) {
		if (chartId)
			DBUtil.findOne("charts", chartId, chart => {
				if (!chart) DBUtil.find("charts", "charts", { dbId: chartId }, charts => {
					console.log("getChartById", charts)
					if (!!charts && charts.constructor == Array && charts.length) callback(charts[0]);
					else ServerUtil.getChartById(chartId, callback, e => callback(), op);
				});
				else callback(chart);
			});
		else callback(false);
	},
	/**
	 * 获取文件列表
	 * @param {"数据库查询条件"} query
	 * 		search[String] "标题模糊搜索"
	 * @param {"回调函数 charts[Array]"} callback
	 */
	getCharts: function (query = {}, callback = function () { }) {
		let dbQuery = { userId: UserOperation.getUk(), deleted: false, ...query };

		if (dbQuery.folderId && dbQuery.folderId != "root") {
			FileDatabase.getFolderById(dbQuery.folderId, parentFolder => {
				dbQuery.folderId = parentFolder.folderId;

				DBUtil.find("charts", "charts", dbQuery, function (charts) {
					if (query.search && query.search != "") charts.filter(chart => (chart.title.indexOf(query.search) < 0));

					if (charts && charts instanceof Array) {
						if (dbQuery.folderId != parentFolder.dbId) {
							dbQuery.folderId = parentFolder.dbId;
							DBUtil.find("charts", "charts", dbQuery, function (_charts) {
								if (query.search && query.search != "") _charts.filter(chart => (chart.title.indexOf(query.search) < 0));

								if (_charts && _charts instanceof Array) {
									charts = [...charts, ..._charts];
									callback(charts);
								}
								else callback(charts);
							});
						}
						else callback(charts);
					}
					else callback(false);
				});
			})
		}
		else {
			DBUtil.find("charts", "charts", dbQuery, function (charts) {
				if (query.search && query.search != "") charts.filter(chart => (chart.title.indexOf(query.search) < 0));
				console.log(charts)
				if (charts && charts instanceof Array) callback(charts);
				else callback(false);
			});
		}
	},
	/**
	 * 文件更新"业务操作"
	 * @param {"文件id/dbId"} chartId
	 * @param {"操作类型"} type [lastModify | id]
	 * @param {"需要更新的数据"} val
	 * @param {"回调函数"} callback
	 */
	updateChart: function (chartId, type, val, callback = function () { }) {
		FileDatabase.getChartById(chartId, chart => {
			if (chart) {
				switch (type) {
					case "lastModify":
						chart["lastModify"] = DBUtil.util.getCurrentTimeString();
						DBUtil.put("charts", chart, callback);
						break;
					case "id":
						DBUtil.putAll("charts", chartId, val, callback);
						break;
					default:
						chart = val ? { ...chart, ...val } : chart;
						chart["lastModify"] = DBUtil.util.getCurrentTimeString();
						DBUtil.put("charts", chart, callback);
						break;
				}
			}
			else callback({ chartId, id: chartId });
		})
	},
	/**
	 * 删除文件数据
	 * @param {"文件id/dbId"} chartId
	 * @param {"回调函数"} callback
	 */
	removeChart: function (chartId, callback = function () { }) {
		FileDatabase.getChartById(chartId, chart => {
			if (chart) {
				let definitionId = chart.definitionId;
				DBUtil.remove("charts_def", definitionId, () => {
					DBUtil.remove("charts", chart.id, remove => {
						callback(chart);
					})
				});
			}
			else callback({});
		});
	},
	/**
	 * 新建文件
	 * @param {"新文件定义的类型"} type ["包含mind" | outline]
	 * @param {"文件详细类型"} category [flow | bpmn | venn | uml | evc | epc | org | ios | andriod | ui | network ]
	 * @param {"所在文件夹id"} folderId
	 * @param {"回调函数"} callback [返回生成的新文件数据]
	 * @param {"禁止推送 create 指令"} noPush [false]
	 */
	newChart: function (type, category, folderId, callback = function () { }, noPush) {
		var uk = UserOperation.getUk();

		FileDatabase.hasFileNum(false).then(no => {
			FileDatabase.getFolderById(folderId, async parentFolder => {
				let chartDef = FileDatabase.newChartDef(category);
				if (!parentFolder) parentFolder = { folderId: "root" };
				/**新建文件时获取本地默认主题设置文件定义的默认主题*/
				if (!category.includes('flow')) {
					await mindTheme().then((e) => {
						if (e) {
							let _chartDef = JSON.parse(chartDef.definition);
							_chartDef.theme = e
							chartDef.definition = JSON.stringify(_chartDef)
						}
					})
				}

				/**新建文件时获取本地默认主题设置文件定义的默认主题*/
				DBUtil.save("charts_def", chartDef, chartDef => {
					if (chartDef && chartDef.id) {
						var nowTime = DBUtil.util.getCurrentTimeString();
						let cid = FileDatabase.newId();
						let schema = null;

						switch (category) {
							case "flow": schema = ["basic", "flow", "lane"]; break;
							case "bpmn": schema = ["basic", "bpmn", "lane"]; break;
							case "venn": schema = ["basic", "venn"]; break;
							case "uml": schema = ["basic", "uml_common", "uml_usecase", "uml_sequence", "uml_class", "uml_stateactivity", "uml_deployment", "uml_component", "er"]; break;
							case "evc": schema = ["basic", "evc"]; break;
							case "epc": schema = ["basic", "epc"]; break;
							case "org": schema = ["basic", "org"]; break;
							case "ios": schema = ["basic", "ios_devices", "ios_elements", "ios_controls", "ios_icons"]; break;
							case "andriod": schema = ["basic", "andriod_devices", "andriod_elements", "andriod_controls", "andriod_icons"]; break;
							case "ui": schema = ["basic", "ui", "ui_input"]; break;
							case "network": schema = ["basic", "network"]; break;
						};

						let chart = {
							id: cid, dbId: cid, chartId: cid, userId: uk, category, owner: { userId: uk },
							deleted: false, parentDeleted: false, createDate: nowTime, lastModify: nowTime,
							folderId: parentFolder.folderId, folderDbId: parentFolder.folderId, version: 0, template: false, status: "private",
							title: "未命名文件", definitionId: chartDef.id
						};
						if (schema) chart["schema"] = schema;
						DBUtil.save("charts", chart, chart => {
							if (!pcUtil.isOnline()) {
								// 如果是离线的 还需要新增一个多画布的中间表信息 并存入对应的假 chartId
								let canvas = FileDatabase.newCanvas(chart.id, chartDef.id);
								FileDatabase.updateChartMultipleDef(chart.id, canvas, async () => {

									// 然后还需要保存一条待推送的新建指令 作为之后的推送多画布指令
									await FileDatabase.addInstruct({
										"action": "create",
										"context": '离线画布',
										"chartId": chart.id,
										"canvasId": FileDatabase.newId(),
										"definitionId": chartDef.id
									})
									callback(chart);
								})


							}
						});
					}
				});
			});
		})
	},
	// 用于循环新增画布本地定义
	copyCharDefFormCanvas: function (tempMainCanvasId, newChartId, chartCanvas) {
		//给我一组原来的定义 id
		return new Promise((resolve) => {
			let mainCanvasId = undefined
			let mainCopyCharDef = {}
			let newChartCanvas = []
			let pList = []

			// 获取定义
			function revertItem(item) {
				return new Promise((resove) => {

					DBUtil.findOne("charts_def", item.definitionId, def => {
						const copyCharDef = def
						copyCharDef.id = FileDatabase.newId();
						copyCharDef.dbId = FileDatabase.newId();

						DBUtil.save("charts_def", copyCharDef, async copyCharDef => {
							let canvasId = FileDatabase.newId()

							newChartCanvas.push({
								canvasId,
								definitionId: copyCharDef.id,
								title: item.title
							})

							// 主画布 id 的文件定义 不需要指令集了，它会在同步文件 chart 新增指令里更新
							if (tempMainCanvasId === item.definitionId) {
								mainCanvasId = copyCharDef.id
								mainCopyCharDef = copyCharDef
								resove()
							} else {
								await FileDatabase.addInstruct({
									"action": "create",
									"context": item.title,
									"chartId": newChartId,
									"canvasId": canvasId,
									"definitionId": copyCharDef.id
								})
								resove()
							}

						})


					})
				})
			}

			chartCanvas.forEach(item => {
				// 循环创建 一样 的定义
				pList.push(revertItem(item))
			});

			Promise.all(pList).then(res => {
				resolve({
					newChartCanvas,
					mainCanvasId,
					mainCopyCharDef
				})
			})
		})


	},

	/**
	 * 复制文件(包括文件定义)
	 * @param {"源文件id/dbId"} sourceChartId
	 * @param {"复制到的目标文件夹id"} targetFolderId ["默认为源文件所在文件夹"]
	 * @param {"回调函数"} callback [复制后的文件数据]
	 * @param {"回调函数"} error [复制后的文件数据]
	 */
	copyChart: async function (sourceChartId, targetFolderId, callback = function () { }, error = function () { }) {
		var uk = UserOperation.getUk();
		FileDatabase.hasFileNum(true).then(({ no, isMember }) => {
			FileDatabase.getChartById(sourceChartId, sourceChart => {
				console.log("copyChart", sourceChart)
				if (sourceChart) {
					// 免费
					if (isMember) {
						// 复制所有所有画布 
						FileDatabase.getCanvasList(sourceChartId, async res => {

							const tempMainCanvasId = res.mainCanvasId

							// 给你一组copy 的定义 ids 集合 和主画布id
							// 创建完一样的定义以后，返回假定义集合 也就是中间表数据 [{canvansId,definitionId,title}]
							// 把刚刚给的主画布定义 id 替换新的以后在返回，用作中间表的主画布定义 id
							let copyChartId = FileDatabase.newId();
							const { newChartCanvas, mainCanvasId, mainCopyCharDef } = await FileDatabase.copyCharDefFormCanvas(tempMainCanvasId, copyChartId, res.chartCanvas)

							// 复制chart 需要主画布 id
							let copyChart = { targetFolderId: "root", folderId: "root", deleted: false, parentDeleted: false, ...sourceChart, id: copyChartId, chartId: copyChartId, definitionId: mainCanvasId, userId: uk, status: "private" };
							// 存 chart
							DBUtil.save("charts", copyChart, copyChart => {
								// 存中间表 做好id 关联 是新的copyChartId哦～
								FileDatabase.updateChartMultipleDef(copyChartId, {
									chartCanvas: newChartCanvas,
									mainCanvasId,
								}, async () => {
									callback(copyChart, mainCopyCharDef);
									// PushOperation.chart["create"](copyChartId, copyChart.title, copyChart.definitionId, mainCopyCharDef.definition, copyChart.category, copyChart.folderId, () => {
									// 	FileDatabase.getChartById(copyChartId, chart => {
									// 		if (chart) ipc.sendToHost("ping_event", 0, { k: "updataChart", args: [chart] });
									// 	})
									// });
								})


							});

						})






						// 添加中间表


						// push



					} else {
						FileDatabase.getChartDefById(sourceChartId, sourceChart.definitionId, sourceChartDef => {
							let copyCharDef = sourceChartDef;
							copyCharDef.id = FileDatabase.newChartDef(sourceChart.category).id;

							DBUtil.save("charts_def", copyCharDef, copyCharDef => {
								let copyChartId = FileDatabase.newId();
								let copyChart = { targetFolderId: "root", folderId: "root", deleted: false, parentDeleted: false, ...sourceChart, id: copyChartId, chartId: copyChartId, definitionId: copyCharDef.id, userId: uk, status: "private" };

								if (!copyChart.schema) copyChart.schema = ["basic", "flow", "lane"];
								if (copyChart.owner) delete copyChart.owner;
								if (targetFolderId) copyChart.folderId = targetFolderId;

								FileDatabase.getFolderById(copyChart.folderId, folder => {
									if (!folder) copyChart.folderId = "root";

									console.log("copyChart", sourceChart, copyChart)
									DBUtil.save("charts", copyChart, copyChart => {
										callback(copyChart, copyCharDef);
										// PushOperation.chart["create"](copyChart.id, copyChart.title, copyChart.definitionId, copyCharDef.definition, copyChart.category, copyChart.folderId, () => {
										// 	FileDatabase.getChartById(copyChart.id, chart => {
										// 		if (chart) ipc.sendToHost("ping_event", 0, { k: "updataChart", args: [chart] });
										// 	})
										// });
									});
								})
							});
						}, error);
					}

				}
				else error();
			});
		});
	},
	/**
	 * 导入文件(包括文件定义)
	 * @param {"解析后的 pos 文件数据"} parsingPos
	 * @param {"导入到的目标文件夹id"} targetFolderId
	 * @param {"回调函数"} callback [复制后的文件数据]
	 */
	ExportChart: function (parsingPos, targetFolderId, callback = function () { }, fileName) {
		var uk = UserOperation.getUk();

		FileDatabase.hasFileNum(true).then(no => {
			let diagramInfo = parsingPos.meta.diagramInfo;
			let newDefId = FileDatabase.newId();

			let copyCharDef = { id: newDefId, dbId: newDefId, definition: JSON.stringify(parsingPos.diagram.elements) };
			// let title = diagramInfo.title || '未命名文件';
			let title = fileName || diagramInfo.title || '未命名文件';
			DBUtil.save("charts_def", copyCharDef, copyCharDef => {
				var nowTime = DBUtil.util.getCurrentTimeString();
				let copyChartId = FileDatabase.newId();
				let schema = null;

				switch (diagramInfo.category) {
					case "flow": schema = ["flow", "lane", "basic"]; break;
					case "bpmn": schema = ["bpmn", "lane", "basic"]; break;
					case "venn": schema = ["venn", "basic"]; break;
					case "uml": schema = ["uml_common", "uml_usecase", "uml_sequence", "uml_class", "uml_stateactivity", "uml_deployment", "uml_component", "er", "basic"]; break;
					case "evc": schema = ["evc", "basic"]; break;
					case "epc": schema = ["epc", "basic"]; break;
					case "org": schema = ["org", "basic"]; break;
					case "ios": schema = ["ios_devices", "ios_elements", "ios_controls", "ios_icons", "basic"]; break;
					case "andriod": schema = ["andriod_devices", "andriod_elements", "andriod_controls", "andriod_icons", "basic"]; break;
					case "ui": schema = ["ui", "ui_input", "basic"]; break;
					case "network": schema = ["network", "basic"]; break;
				};

				let chart = {
					id: copyChartId, dbId: copyChartId, chartId: copyChartId,
					userId: uk, category: diagramInfo.category,
					deleted: false, parentDeleted: false, createDate: nowTime, lastModify: nowTime,
					folderId: targetFolderId, version: 0, template: false, status: "private",
					title: title, definitionId: copyCharDef.id
				};
				if (schema) chart["schema"] = schema;
				DBUtil.save("charts", chart, chart => {
					callback(chart);
					// PushOperation.chart["create"](chart.id, chart.title, chart.definitionId, JSON.stringify(parsingPos.diagram.elements), chart.category, chart.folderId);
				});
			});
		}).catch(callback);
	},
	/**
	 * 保存文件数据到本地
	 * @param {"文件数据"} chartInfo
	 * @param {"回调函数"} callback [保存后的文件数据]
	 */
	saveChartToDB: function (chartInfo, callback = function () { }) {
		let dbId = FileDatabase.newId();
		let chart = { deleted: false, parentDeleted: false, dbId, id: chartInfo.chartId, ...chartInfo };

		chart.userId = (chart.owner && chart.owner.userId) ? chart.owner.userId : chart.userId;
		chart.owner = chart.owner ? chart.owner : { userId: chart.userId };

		DBUtil.save("charts", chart, callback);
	},
	/**
	 * 线上文件与本地文件列表对比，线上存在，本地不存在的数据保存到本地
	 * @param {"文件列表"} charts
	 * @param {"返回"} callback
	 */
	compareCharts: function (charts = [], callback = function () { }) {
		if (charts && charts.constructor == Array) {
			let fn = i => {
				if (i < charts.length) {
					FileDatabase.getChartById(charts[i].id, chart => {
						if (!chart || chart.constructor !== Object) FileDatabase.saveChartToDB(charts[i], () => fn(++i));
						else fn(++i);
					});
				}
				else callback();
			};
			fn(0);
		}
	},
	/* -end- 文件相关*/

	/* -start- 文件定义相关*/
	/**
	 * 通过文件定义 id/dbId 获取文件定义数据
	 * 		优先从本地数据库查找:
	 * 			本地数据库存在该文件定义, 直接返回数据库内的数据
	 *			本地数据库不存在该文件定义, 从线上获取文件定义数据, 更新到本地数据库内, 并返回
	 * @param {"文件id/dbId"} chartId
	 * @param {"文件定义id/dbId"} chartDefId
	 * @param {"返回 chart_def"} callback
	 */
	getChartDefById: function (chartId = '', chartDefId, callback = () => { }, error = () => { }, type = 'flow') {
		if (chartDefId)
			DBUtil.findOne("charts_def", chartDefId, chartDef => {
				if (!chartDef) DBUtil.find("charts_def", "charts_def", { dbId: chartDefId }, chartDefs => {
					if (!!chartDefs && chartDefs.constructor == Array && chartDefs.length) callback(chartDefs[0]);
					else if (type == 'markdown') { ServerUtil.getChartDefByIdForMarkdown(chartId, chartDefId, callback, error); }
					else { ServerUtil.getChartDefById(chartId, chartDefId, callback, error); }
				});
				else callback(chartDef);
			});
		else error(false);
	},
	/**
	 * 通过文件 id/dbId 获取文件定义数据
	 * 其实也是主画布对应的文件定义
	 * @param {"文件id/dbId"} chartId
	 * @param {"返回 chart_def"} callback
	 */
	getChartDefByChartId: function (chartId, callback = function () { }, error = function () { }) {
		FileDatabase.getChartById(chartId, chart => {
			DBUtil.find("charts_def", "charts_def", { id: chart.definitionId }, chartDef => {
				if (!!chartDef && chartDef.constructor == Array && chartDef.length) callback(chartDef[0]);
				else DBUtil.find("charts_def", "charts_def", { definitionDbId: chart.definitionId }, chartDef => {
					if (!!chartDef && chartDef.constructor == Array && chartDef.length) callback(chartDef[0]);
					else FileDatabase.getChartDefById(chartId, chart.definitionId, callback, error);
				});
			});
		});
	},

	getCanvasList: function (chartId, callback = () => { }) {

		DBUtil.findOne('charts_multiple_defIds', chartId, res => {

			callback(res)
		})
	},
	/**
	 * 通过文件画布信息中的 canvasId 获取文件定义主数据
	 * @param {"文件id/canvasId"} chartId
	 * @param {"返回 chart_def"} callback
	 */
	getChartDefByDefId: function (chartId, defId, callback = function () { }, error = function () { }) {
		//先通过 chartId 和 canvasId 在中间表 拿到文件定义 Id
		FileDatabase.getCanvasList(chartId, canvasList => {
			//然后在chart_def表中获取 文件定义
			const { chartCanvas = [] } = canvasList
			let curDefId = undefined
			const item = chartCanvas.find(i => i.definitionId === defId)
			if (item) {
				curDefId = item.definitionId
			}
			FileDatabase.getChartDefById(chartId, curDefId, res => {
				callback(res)
			}, err => { })
		})
	},
	/**
	 * 通过文件画布信息中的 canvasId 获取文件定义主数据
	 * @param {"文件id/canvasId"} chartId
	 * @param {"返回 chart_def"} callback
	 */
	getChartDefByDefIdForPro: function (chartId, defId) {
		return new Promise((reslove, reject) => {
			FileDatabase.getChartDefById(chartId, defId, res => {
				reslove(res)
			}, err => { reject(err) })
		})
	},

	getChartDefByCanvasId: function (chartId, canvasId, callback = function () { }, error = function () { }) {
		//先通过 chartId 和 canvasId 在中间表 拿到文件定义 Id
		FileDatabase.getCanvasList(chartId, canvasList => {
			//然后在chart_def表中获取 文件定义
			const { chartCanvas = [] } = canvasList
			let curDefId = undefined
			const item = chartCanvas.find(i => i.canvasId === canvasId)
			if (item) {
				curDefId = item.definitionId
			}
			FileDatabase.getChartDefById(chartId, curDefId, res => {
				callback(res)
			}, err => { })
		})
	},

	/**
	 * 文件定义保存到本地数据库
	 * @param {"文件定义 id/dbId"} chartDefId
	 * @param {"文件定义内容"} chartDefStr
	 * @param {"返回保存后的 chartDef 数据"} callback
	 */
	saveChartDef: function (chartDefId, chartDefStr, callback = function () { }) {
		let data = { id: chartDefId, definition: chartDefStr };
		//更新最新时间
		DBUtil.save("charts_def", data, callback);
	},
	/**
	 * 文件定义保存到本地数据库
	 * @param {"文件 id"} chartId
	 * @param {"文件定义对象"} val
	 * @param {"返回保存后的 chartDef 数据"} callback
	 */
	updateChartDef: function (chartId, canvasId, val, callback = function () { }) {
		FileDatabase.getChartDefByCanvasId(chartId, canvasId, chartDef => {
			if (!val.hasOwnProperty('id')) {
				val.id = chartDef.id;
			}
			DBUtil.putAll("charts_def", chartDef.id, val, callback);
		});
	},
	/**
	 * 获取新的文件定义
	 * @param {"新文件定义的类型"} type ["包含mind" | outline]
	 * @returns {"文件定义数据"} defObj
	 */
	newChartDef: function (type, title = "未命名文件", newDefId, theme = 'theme3') {

		let defId = newDefId || FileDatabase.newId();
		var defObj = { id: defId, dbId: defId };
		let def = {};

		if (type.indexOf("mind") >= 0)
			def = {
				id: "root", data: {
					'right-content-index': 0
				}, children: [], free: false, freeChildren: [], collapsed: false, title: title, structure: 'mind_free', root: true, theme: theme, version: 0
			};
		else if (type == "outline")
			def = {
				id: "root", data: {
					'right-content-index': 0
				}, children: [], free: false, freeChildren: [], collapsed: false, title: title, structure: 'mind_free', root: true, theme: theme, version: 0
			}
		else if (type == "markdown")
			def = { def: JSON.stringify({ version: 1, def: '', category: 'markdown' }), isLocalFile: true }
		else
			def = {
				page: {
					backgroundColor: "transparent", width: 1050, height: 1000, padding: 20,
					showGrid: true, gridSize: 15, orientation: "portrait", lineJumps: false
				}, elements: {}, version: 0
			};

		defObj["definition"] = type == "markdown" ? def : JSON.stringify(def);
		return defObj;
	},
	// 离线中间表数据 用于离线新建
	newCanvas: function (canvasId, definitionId) {
		return {
			chartCanvas: [{
				canvasId,
				definitionId,
				title: `离线画布` // todo 名称可能要改
			}],
			mainCanvasId: definitionId
		};
	},

	/**
	 * 清空文件定义指令
	 * @param {"文件id/dbId"} chartId
	 */
	clearChartDefBase: function (chartId) {
		var uk = UserOperation.getUk();

		if (chartId)
			FileDatabase.getChartById(chartId, chart => {
				DBUtil.findOne("base_def_config", uk, base_def_config => {
					let msgsObj = base_def_config ? base_def_config.msgs : {};
					msgsObj[chart.chartId] = [];
					DBUtil.save("base_def_config", { id: uk, msgs: msgsObj });
				})
			})
	},
	/* -end- 文件定义相关*/

	/* -start- 文件夹相关*/
	/**
	 * 新建文件夹
	 * @param {"所在文件夹id"} parentId
	 * @param {"新建文件夹 title"} folderTitle
	 * @param {"回调函数，返回创建的folder"} callback
	 */
	newFolder: function (parentId, folderTitle = "未命名文件", callback = function () { }) {
		// 数据库偶现储存完成后无法马上获取问题 ？
		ServerUtil.createFolder({ parentId, folderTitle }, res => {
			if (res) {
				const folder = res.data.folder
				DBUtil.save("folders", folder, () => {
					callback(folder)
				})
			}
		}, err => { console.log(err) })
	},
	/**
	 * 通过文件 id/dbId 获取文件夹数据
	 * @param {"文件夹id/dbId"} folderId
	 * @param {"返回 folder"} callback
	 */
	getFolderById: function (folderId, callback = function () { }) {
		if (folderId) {
			if (folderId == "root") callback({ folderId: "root" });
			else DBUtil.findOne("folders", folderId, folder => {
				if (!folder) DBUtil.find("folders", "folders", { dbId: folderId }, folders => {
					if (!!folders && folders.constructor == Array && folders.length) callback(folders[0]);
					else callback(false)
				});
				else callback(folder);
			});
		}
		else callback(false);
	},
	/**
	 * 文件夹更新"业务操作"
	 * @param {"文件夹id"} folderId
	 * @param {"操作类型"} type [title | id]
	 * @param {"需要更新的数据"} val
	 * @param {"回调函数"} callback
	 */
	updateFolder: function (folderId, type, val, callback = function () { }) {
		FileDatabase.getFolderById(folderId, folder => {
			switch (type) {
				case "id":
					DBUtil.putAll("folders", folder.id, val, callback);
					break;
				default:
					folder = { ...folder, ...val };
					folder["lastModify"] = DBUtil.util.getCurrentTimeString();
					DBUtil.put("folders", folder, callback);
					break;
			}
		})
	},
	/**
	 * 获取文件夹下所有文件夹及文件
	 * @param {"文件夹id/dbId"} folderId
	 * @param {"其他筛选条件"} query
	 * @param {"回调函数 返回文件和文件夹列表"} callback
	 */
	getFolderFindAll: function (folderId, query = {}, callback = function () { }) {
		let file = { folders: [], charts: [] };
		let recursionFile = (folderId, folderDbId, end = function () { }) => {
			let getFiles = () => {
				DBUtil.find("folders", "folders", { parentId: folderId, ...query }, folders => {
					if (!!folders && folders.constructor == Array && folders.length) {
						file.folders = [...file.folders, ...folders];

						let visavis = (folders, i) => {
							if (folders[i]) recursionFile(folders[i].folderId, folders[i].dbId, () => visavis(folders, i + 1));
							else end()
						};
						visavis(folders, 0);
					}
					else end();
				});
			};

			DBUtil.find("charts", "charts", { folderId: folderId, ...query }, charts => {
				if (!!charts && charts.constructor == Array && charts.length) file.charts = [...file.charts, ...charts];
				if (folderDbId && folderId != folderDbId) {
					DBUtil.find("charts", "charts", { folderDbId: folderDbId, ...query }, charts => {
						if (!!charts && charts.constructor == Array && charts.length) file.charts = [...file.charts, ...charts];

						getFiles();
					});
				}
				else getFiles();
			})
		};
		FileDatabase.getFolderById(folderId, folder => recursionFile(folder.folderId, folder.dbId, () => callback(file)))
	},
	/**
	 * 保存文件夹数据到本地
	 * @param {"文件夹数据"} folderInfo
	 * @param {"回调函数"} callback [保存后的文件数据]
	 */
	saveFolderToDB: function (folderInfo, callback = function () { }) {
		// folderInfo.id = UserOperation.getUk();
		DBUtil.save("folders", folderInfo, callback);
	},
	/* -end- 文件夹相关*/

	/* -start- 文件工具*/
	/**
	 * 判断用户文件数量是否达到上限
	 * @param {"是否在文件数不足时提供提示"} isToast
	 * @param {"还需要添加的数量"} addNum
	 * @returns {Promise<unknown>}
	 */
	hasFileNum: function (isToast, addNum = 1, canCreate = false, pay_position, category = 'flow') {
		return new Promise((resolve, reject) => {
			UserOperation.getUserPrivilege(false, user => {
				if (category == 'markdown') {
					resolve({ no: false, isMember: false })
					return
				}
				let no = false;
				let isMember = false
				user = user || {};
				if (user.member || user.orgMember) { no = false; isMember = true; }
				else if (pcUtil.isOnline() && (user.usedFileCount + addNum) > user.totalFileCount) no = true;
				else if (!pcUtil.isOnline() && (user.usedFileCount + (!Object.hasOwn(user, 'balanceUserdFileCount') ? 0 : user.balanceUserdFileCount) + addNum) > user.fileCount) no = true;
				if (no && isToast) {
					// 直接打开升级页面
					ipc.sendToHost('upgradeDlg', { dlgType: canCreate ? 3 : 1, pay_position })
				}
				if (no) reject("文件数不足");
				else resolve({ no, isMember });
			}, true);
		});
	},
	/**
	 * 编辑器内修改文件名称
	 * @param chartId
	 * @param title
	 * @param callback
	 */
	changeTitle: function (chartId, title, callback = function () { }) {
		FileDatabase.getChartById(chartId, chart => {
			chart.title = title;
			FileDatabase.updateChart(chartId, false, chart, chart => {
				// PushOperation.folder["rename"](chartId, chart.title);
				ipc.sendToHost("ping_event", 1, { k: "loadFile" });
				ipc.sendToHost("ping_event", 1, { k: 'setTitle', args: [false, chart.title] });
				callback && callback();
			})
		});
	},
	/* -end- 文件工具*/

	/* -start- 多画布 */
	getBaseMultipleInstruct: function (chartId, callback = function () { }) {
		if (chartId)
			DBUtil.findOne("base_multiple_Instruct", chartId, msg => {
				callback(msg)
			});
		else callback(false);
	},
	// 增加多画布指令集
	updateMultipleInstruct: function (chartId, val, callback) {
		if (chartId) {
			DBUtil.save("base_multiple_Instruct", { id: chartId, ...val }, callback);
		}
	},
	updateChartMultipleDef: function (chartId, val, callback = () => { }) {
		DBUtil.save("charts_multiple_defIds", { id: chartId, ...val }, callback);
	},
	getCanvasIdByDefId: function (chartId, defId) {
		return new Promise((resolve) => {
			FileDatabase.getCanvasList(chartId, canvasList => {
				const { chartCanvas = [] } = canvasList
				const item = chartCanvas.find(i => i.definitionId === defId)
				if (chartCanvas.length && item) {
					resolve(item.canvasId)
				}
				else {
					ServerUtil.getChartCanvas(chartId, (data) => {
						this.updateChartMultipleDef(chartId, data.canvas, () => {
							const { chartCanvas = [] } = data.canvas
							const item = chartCanvas.find(i => i.definitionId === defId)
							resolve((chartCanvas.length && item) ? item.canvasId : null)
						})
					}, () => {
						resolve(null)
					})
				}
			})
		})

	},
	addInstruct(params) {
		return new Promise((resolve) => {
			FileDatabase.getBaseMultipleInstruct(params.chartId, instruct => {

				let data = []

				if (instruct) {
					data = instruct.msg || []
				}
				data = data.filter(d => d != undefined)
				const otherData = data.filter(d => d.canvasId !== params.canvasId)
				let nowData = data.filter(d => d.canvasId === params.canvasId)
				switch (params.action) {
					case 'delete':
						nowData = []
						if (params.canvasId.length > 12) {
							nowData.push(params)
						}
						break;
					case 'create':
						nowData = []
						nowData.push(params)
						break;
					case 'rename':
						nowData = nowData.filter(d => d.action !== 'rename')
						nowData.push(params)
						nowData = instructSort(nowData)
						break;
					case 'sort':
						nowData = nowData.filter(d => d.action !== 'sort')
						nowData.push(params)
						nowData = instructSort(nowData)
						break;
				}
				data = otherData.concat(nowData)
				console.log(data)
				FileDatabase.updateMultipleInstruct(params.chartId, { msg: data }, () => {
					resolve()
				})
			})
		})

		// push
	}
	/* -end- 多画布 */
};

function mindTheme() {
	return new Promise((resolve, reject) => {
		UserOperation.getUser(false, res => {
			if (res.auth && res.auth.mindTheme) {
				resolve(res.auth.mindTheme)
			} else {
				resolve(false)
			}
		});
	})
}

function instructSort(data) {
	let createData = []
	let renameData = []
	let sortData = []
	data.forEach((d) => {
		switch (d.action) {
			case 'create':
				createData.push(d)
				break;
			case 'rename':
				renameData.push(d)
				break;
			case 'sort':
				sortData.push(d)
				break;
		}
	})
	return ([...createData, ...renameData, ...sortData])
}
export default FileDatabase;
