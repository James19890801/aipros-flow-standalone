window.DesignerInsertTemp = {
	fileType: "",
	params: null,
	chartNewCategory: "",
	show: function () {

		$(".mind-menu").hide();
		$(".mind-topic-box").remove();
		//节点限制
		var len = mind.util.getTopicsLen.call(mind);
		if (mindNodeLimit != 2) {
			if (len >= poPrivileges.mindShapeNum) {
				mindUI.showVipLimitDlg('addtopic');
				return
			}
		}
		//改变升级按钮埋点type
		editInsertType = "edittab";
		DesignerInsertTemp.showDlgTemp();

	},
	init: function (type, params) {
		var that = this;
		that.params = params;
		that.fileType = type;
		if (chartObj.category == "uncategorized") {
			chartObj.category = "flow"
		}
		if (that.params.category) {
			that.chartNewCategory = that.params.category;
		} else {
			that.chartNewCategory = chartObj.category;
		}
		if (type == "mind" || type == "flow") {
			if (that.params.keyword) {
				that.updataBottomTemp()
			} else {
				that.renderBottomTemp()
			}
		}

	},
	renderBottomTemp: function (container) {
		var that = this;
		$(".bottom_temp_wrap").empty();
		setTimeout(function () {
			that.model.getIsmember.call(that);
		}, 3000);
		//TODO
		var $bottomTempWrap = that.params.container;
		$bottomTempWrap.addClass("bottom_temp_wrap");
		if (that.fileType == "mind") {
			$bottomTempWrap.addClass("bottom_temp_wrap_mind");
		} else {
			//$bottomTempWrap.addClass("bottom_temp_wrap_mind");
		}
		if (that.fileType == "mind") {
			//$bottomTempWrap.append("<p class='title'>直接新建 或者选择一个模板</p>");
			$bottomTempWrap.append("<div class='temp-top-conent'><p class='title'>直接新建 或者选择一个模板</p> <div class='close'>收起<span class='po-diagraming-icons icons'>&#xe6ce;</span></div></div>");
		} else {
			//$bottomTempWrap.append("<p class='title'>直接新建 或者选择一个模板</p>");
			$bottomTempWrap.append("<div class='temp-top-conent'><p class='title'>直接新建 或者选择一个模板</p> <div class='close'>收起<span class='po-diagraming-icons icons'>&#xe6ce;</span></div></div>");
		}
		var $box = $("<div class='bottom_temp_box'></div>").appendTo($bottomTempWrap);
		var category = ["mind_right", "mind", "outline"].includes(that.chartNewCategory) ? "mind_free" : that.chartNewCategory;
		pcUtil.ajax({
			type: "GET",
			url: "/api/personal/template/official_mark_templates",
			data: {
				category: category
			},
			success: function (res) {
				if (chartObj && chartObj.orgId) {
					var orgRes = res.data.filter(item => item.publicClonePrice == 0 || !item.owner);
					that.model.markTemplates = orgRes;
					render(that.model.markTemplates)
				} else {
					that.model.markTemplates = res.data;
					render(that.model.markTemplates)
				}

			}
		});
		function render(templates) {
			if (templates.length == 0) {
				// $.toast({
				// 	text: "该类型模板不存在，夜以继日更新模板中...",
				// 	delay: 5000,
				// 	type: "warning"
				// });
				// $(".bottom_temp_wrap").remove();
				return
			}
			var windowW = that.params.container.width();//$(window).width();
			var num = parseInt(windowW / 155) - 1;
			//$(".bottom_temp_wrap").css("display", "block")
			var boxHtml = "";
			var moreImg = '';
			var boxW = 150;
			for (var i = 0; i < templates.length; i++) {
				var template = templates[i];
				if (i < num) {
					var vipHtml = ""
					// vip
					if (template.status === 'public' && template.publicClone === true) {
						// vip
						if (template.publicClonePrice > 0) {
							// || typeof v.owner === 'undefined'
							if (template.owner === null) {
								vipHtml += "<span class='iconVip'>VIP免费</span>";
							} else {
								vipHtml = ""
							}
						} else {
							vipHtml = ""
						}
					} else {
						vipHtml = ""
					}
					var className = "temp_show"
					if (i > num - 2) {
						className = "temp_hide"
					} else {
						boxW += 170;
					}
					if (that.fileType == "flow") {
						className = ""
					}
					var ownerid = template.owner ? template.owner.userId : 0;
					var tempVip = ""
					if (ownerid == 0 && template.publicClonePrice > 0) {
						//tempVip = "<img class='po-temp-vip' src='"+ staticBasePath +"/assets/images/temp-vip.svg' />"
						tempVip = "<span class='iconVip'>VIP免费</span>"
					}
					boxHtml += "<div class='item_box " + className + "' price=" + template.publicClonePrice + " tempid=" + template.chartId + " ownerid=" + ownerid + " tempTitle=" + template.title + " category=" + template.category + " status=" + template.status + "><div class='img_box'>" + vipHtml + tempVip + "<img src='https://po-img.processon.com/chart_image/template/thumb/" + template.thumbnail + ".png?tid=" + template.chartId + "'/></div><div class='item_tit'>" + template.title + "</div></div>";
				} else if (i < num + 4) {
					moreImg += "<img class='more_img' src='https://po-img.processon.com/chart_image/template/thumb/" + template.thumbnail + ".png?tid=" + template.chartId + "'/>"
				}
			}
			boxHtml += "<div class='item_box more_item_box'><div class='img_box' style='padding:5px;width:120px;height:120px;'>" + moreImg + "</div><div class='item_tit'>更多模板</div></div>";
			$box.html(boxHtml);
			$(".bottom_temp_wrap_mind").css("margin", "auto");
			let bottomTempBoxWidth = $(".bottom_temp_box").width();
			$(".temp-top-conent").css("width", bottomTempBoxWidth);
			if (that.fileType == "flow") {
				var flowBoxW = $box.width() + 100;
				var flowN = parseInt(flowBoxW / 170);
				$box.children(".item_box").each(function (index, item) {
					if (index < flowN) {
						$(item).addClass("temp_show")
					} else {
						$(item).addClass("temp_hide")
					}
					if ($(item).hasClass("more_item_box")) {
						$(item).addClass("temp_show")
					}
				});
			}
		}
		$box.off().on("click", function (e) {
			e.stopPropagation()
			if(!pcUtil.isOnline()){
				window.toast_.offLine()
				return 
			}

			var $ItemBox = $(e.target).parents(".item_box");
			if ($ItemBox.length == 0) {
				return
			}
			var id = $ItemBox.attr("tempid");
			var price = $ItemBox.attr("price");
			var ownerId = $ItemBox.attr("ownerid");
			var tempTitle = $ItemBox.attr("temptitle");
			if (that.fileType == "mind") {
				if (id) {
					that.mindInsert(id, price, ownerId, tempTitle);
				} else {
					that.renderDlgTemp();
				}
			} else {
				if (id) {
					that.flowInsert(id, price, ownerId, tempTitle);
				} else {
					that.renderDlgTemp()
				}
			}

		})
		/*var closeBtn = $("<div class='close'>收起<span class='po-diagraming-icons icons'>&#xe6ce;</span></div>").appendTo($bottomTempWrap);*/
		//$(".temp-top-conent .close")
		$(".temp-top-conent .close").off().on("click", function () {
			PoEditorClient.hideInsertTemplate()
		})
		$box.on("mousedown", function (e) {
			e.stopPropagation()
		});
		window.poPoint && window.poPoint.collect("editor_template_show", { "弹窗名称": "编辑器模板", "当前页面": window.fileType == "mind" ? "思维导图编辑器" : "流程图编辑器" });
	},
	updataBottomTemp: function () {
		var that = this;
		var keyword = $.trim(that.params.keyword);
		var category = "mind";
		pcUtil.ajax({
			url: "/api/personal/search/suggest",
			data: JSON.stringify({
				keyword,
				category
			}),
			type: "POST",
			contentType: "application/json",
			success: function (res) {
				const data = res.data
				that.model.markTemplates = data.rows;
				render(data.rows);
			}
		})
		function render(templates) {
			if (templates.length == 0) {
				/*$.toast({
					text: "该类型模板不存在，夜以继日更新模板中...",
					delay: 5000,
					type: "warning"
				});
				$(".bottom_temp_wrap").remove();*/
				return;
			}
			var i = 0;
			$(".bottom_temp_wrap .bottom_temp_box .item_box").each(function (index, item) {
				var $item = $(item);
				var template = templates[i];
				if (!$item.hasClass("temp_hide")) {
					if (template) {
						var vipHtml = ""
						// vip
						if (template.status === 'public' && template.publicClone === true) {
							// vip
							if (template.publicClonePrice > 0) {
								// || typeof v.owner === 'undefined'
								if (template.owner === null) {
									vipHtml += "<span class='iconVip'>VIP免费</span>";
								} else {
									vipHtml = ""
								}
							} else {
								vipHtml = ""
							}
						} else {
							vipHtml = ""
						}
						var ownerid = template.owner ? template.owner.userId : 0;
						var tempVip = ""
						/*if (i == 0){
							tempVip = "<img class='po-temp-vip' src='"+ staticBasePath +"/assets/images/temp-vip.svg' />"
						}*/
						var boxHtml = "<div class='img_box'>" + vipHtml + tempVip + "<img src='https://po-img.processon.com/chart_image/template/thumb/" + template.thumbnail + ".png?tid=" + template.chartId + "'/></div><div class='item_tit'>" + template.title + "</div>";
						$item.html(boxHtml).attr({
							"price": template.publicClonePrice,
							"tempid": template.chartId,
							"ownerid": ownerid,
							"tempTitle": template.title,
							"status": template.status
						});
					}
					i++
				}
			})
		}
	},
	// 编辑器弹窗部分
	renderDlgTemp: function () {
		// 方法初始化
		this.dlgTempCode.init();
	},
	// 模板弹窗核心代码
	dlgTempCode: {
		data: {
			collectionLoding: false, // 收藏加载中
			collectionChartId: {} // 收藏缓存
			// ,isIntroduction:true //是否是推荐
			, listStatus: 1 // 列表状态 1 推荐，2定制，3使用，4收藏，5关注
			, tagName: '' // 左侧定制标签
			, searchPage: 1
			, searchPageSize: 15
			, isTempLoading: false // 模板加载状态
			, scrollEnd: false
			, tempCustData: [] //临时定制数据
			, isMind: false
			, categoryIndex: 0 // 栏目下标

		},
		init: function () {
			var _this = this;
			// test ----- 记得删除
			// this.data.listStatus = 5;
			// this.changeDlgPage('')
			// test ----- 记得删除

			//数据初始化
			this.initData();
			// 初始化弹窗模板
			this.initTempData();
			window.poPoint && window.poPoint.collect("editor_template_show", { "弹窗名称": "编辑器模板_更多模板", "当前页面": window.fileType == "mind" ? "思维导图编辑器" : "流程图编辑器" });
		},
		destory: function (popElm) {
			popElm.find("*").remove();
		},
		// 初始化数据
		initData: function () {
			this.data.isMind = typeof editorGlobal.mindMap === 'undefined' ? false : true;
			var _this = this;

			//数据初始化
			// DesignerInsertTemp.model.popData.categoryName = typeof cateType !== 'undefined' ? cateType : 'flow';
			// console.log(DesignerInsertTemp.model.popData, this.data.isMind)
			var popData = DesignerInsertTemp.model.popData;
			DesignerInsertTemp.model.popData.categoryIndex = 0;
			// 流程图
			if (!this.data.isMind) {
				$(popData.categoryList).each(function (i, v) {
					if (v.dataCategory === DesignerInsertTemp.model.popData.categoryName) {
						DesignerInsertTemp.model.popData.categoryIndex = i;
						// console.log(i,v)
						return true
					}
				});
			} else {
				// 思维导图
				$(popData.categoryListB).each(function (i, v) {
					// console.log(v)
					if (v.dataCategory === DesignerInsertTemp.model.popData.categoryName) {
						DesignerInsertTemp.model.popData.categoryIndex = i;
						return true
					}
				});
			}

			// 左侧菜单初始化
			DesignerInsertTemp.model.popData.leftMenuIndex = 0;
			this.data.listStatus = 1;
			this.data.searchPage = 1;
			this.data.isTempLoading = false;
		},
		// 创建新文件
		newFile: function (url) {
			Util.checkFileCount(function (result) {
				if (result == false) {
					url = "/upgrade";
				}
				window.location.href = url;
			});
		},
		// 初始化模板弹窗
		initTempData: function (type) {
			var that = this, popData = DesignerInsertTemp.model.popData;
			var menuActiveIndex = DesignerInsertTemp.model.popData.categoryIndex;
			var myCollectionIndex = 0;
			// console.log(DesignerInsertTemp.model.popData.categoryIndex);
			// 模板部分
			var $dlg = $("<div id='dlg_temp' class='dialog-win dialog dialog-box mind-dlg' style='z-index: 11;'><h3></h3><div class='dlg-content'></div></div>").appendTo("body");
			// 弹窗模板内容
			var tempHtml = '<div class="dlgTempBox" id="dlgTempBox" >' // style="display:none;"
				+ "<div class='dlg_temp_left'><h4 class='dialog-title'>去往模板首页 <span class='goToTemp po-diagraming-icons icons'>&#xe6bb;</span></h4><ul class='left_bar' id='dlg_left_bar'>";
			// 左侧菜单
			popData.leftMenuList = []; //清除左侧数据
			var leftMenuList = popData.leftMenuList
			for (var i = 0, len = leftMenuList.length; i < len; i++) {
				var _classActive = i === popData.leftMenuIndex ? 'active' : '';
				tempHtml += "<li class='" + _classActive + "'>" + leftMenuList[i].name + "</li>"
			}
			tempHtml += "</ul><div class='icons custom customed dlg_btn'>更多场景定制&nbsp;<span class='po-diagraming-icons icons'>&#xe6ae;</span></div><div class='po-diagraming-icons icons custom collect dlg_btn' id='dlgCustomBtn'>收藏、关注的模板</div></div>";
			// 右侧列表
			tempHtml += "<div class='dlg_temp_right'>";
			tempHtml += "<div class='searchBox'><span class='po-diagraming-icons icons'>&#xe6c9;</span><input name='tempSearch' placeholder='搜索模版' id='tempSearch' type='text' /></div>";
			// 右侧顶部菜单
			tempHtml += "<ul class='dlg_temp_top' id='dlg_categoryList'>";
			if (!that.data.isMind) {
				var categoryData = popData.categoryList;
			} else {
				var categoryData = popData.categoryListB;
			}
			for (var i = 0, len = categoryData.length; i < len; i++) {
				var _classActive = i === menuActiveIndex ? 'active' : '';
				tempHtml += "<li class='" + _classActive + "' _category='" + categoryData[i]['dataCategory'] + "'><span class='po-diagraming-icons icons'>" + categoryData[i].icon + "</span><span class='name'>" + categoryData[i].name + "</span></li>"
			}
			tempHtml += "</ul>";
			// 我的收藏列表
			tempHtml += "<ul class='dlg_temp_top myCollection' id='dlg_myCollection'>"
			var myCollectionData = popData.myCollection
			// tempHtml += "<li><span class='icons'></span></li>";
			for (var i = 0, len = myCollectionData.length; i < len; i++) {
				var _classActive = i === myCollectionIndex ? 'active' : '';
				tempHtml += "<li class='" + _classActive + "' _category='" + myCollectionData[i]['dataCategory'] + "'><span class='po-diagraming-icons icons'>" + myCollectionData[i].icon + "</span><span class='name'>" + myCollectionData[i].name + "</span></li>"
			}
			tempHtml += "</ul>";
			//** 右侧下面start */
			tempHtml += "<div class='dlg_temp_con' id='dlg_temp_con'>";
			tempHtml += "<div class='temp_con_wrap' id='temp_con_wrap'></div>";
			tempHtml += '<div class="loading"><img src="https://v3.processon.com/assets/images/new/loading.gif">加载中...</div>';
			tempHtml += '<span class="loadtip" style="display: none;">所有模板已经加载完毕</span>';
			tempHtml += '<div class="notemp" style="display: none;"><span class="notemp-icon"><img src="https://v3.processon.com/assets/images/new/empty.png"><br>夜以继日更新模板中...</span></div>';
			tempHtml += "</div></div>";
			//** 右侧下面end */
			$dlg.children('.dlg-content').append(tempHtml);

			// 绑定弹窗事件
			this.bindEventTemp($dlg);
			// 个人专属数据
			this.getUserCustomTags(function (tags) {
				// console.log('个人专属数据----',res)
				var menuActiveIndex = 0;
				DesignerInsertTemp.model.popData.leftMenuList = tags;
				$.extend(that.data.tempCustData, tags);
				// console.log('asdasdasdasd----',that.data.tempCustData)
				var li = '<li class="active">为你推荐</li>';
				$(tags).each(function (i, v) {
					var index = i + 1
					var _classActive = index === menuActiveIndex ? 'active' : '';
					li += "<li class='" + _classActive + "'>" + v + "</li>"
				});
				$('.left_bar').html(li);
				toMakeCustomization(); // 创建定制数据
			});
			// 初始化栏目列表数据
			this.changeCategoryDataList();

			// **** 定制 **** //
			function toMakeCustomization() {
				var useCust = DesignerInsertTemp.model.popData.leftMenuList;
				// 初始化模板
				var customizedHtml = '<div class="customized" id="dlgCustomized">';
				customizedHtml += '<h2 class="dialog-title"><span class="goback po-diagraming-icons icons">&#xe726;</span>Hi, 为你定制专属内容推荐</h2>';
				customizedHtml += '<span class="des"> 选择5个以上标签，推荐更精准 </span>';
				customizedHtml += '<div class="custom-content">';
				customizedHtml += '</div>';
				customizedHtml += '<div class="bot-line">';
				customizedHtml += '<div class="dlg-buttons">';
				customizedHtml += '<span class="call">更多场景需求，请<a target="_blank" href="http://mzz479f6oqxzaeds.mikecrm.com/BOtrbmT" >告知我们</a ></span>';
				customizedHtml += '<span class="pro-btn default custom-btn btn po-button-small primary">已选' + useCust.length + '个</span>';
				customizedHtml += '</div>';
				customizedHtml += '</div>';
				customizedHtml += '</div>';
				$dlg.children('.dlg-content').append(customizedHtml);
				// 获得官方模板定制标签
				that.getOfficialTags(function (categories) {
					var customizedHtml = '';
					$(categories).each(function (i, v) {
						customizedHtml += '<div class="type">' + v.name + '</div>';
						v.tagNames = v.tagNames ? v.tagNames : [];
						if (v.tagNames.length > 0) {
							customizedHtml += '<ul>';
							$(v.tagNames).each(function (i2, v2) {
								var ids = v.tagIds;
								var _active = that.checkCustomizationActive(v2) ? 'active' : '';
								customizedHtml += '<li class="' + _active + '" data-tagIds="' + ids[i2] + '" data-parent="' + v.name + '">' + v2 + '</li>';
							});
							customizedHtml += '</ul>';
						}
					});
					$('#dlgCustomized .custom-content').html(customizedHtml);
					that.bindEventCustomization();
				});
				// 定制化
				//that.bindEventCustomization($dlg);
			}
		},
		// 绑定模板部分事件
		bindEventTemp: function ($dlg) {
			var _this = this;
			// 去模板首页
			$dlg.find('.goToTemp,.dialog-title').off('click').on("click", function (e) {
				// window.location.href = '/template';
				ipc.send('openUrl', '/template')
			});
			// 个人定制列表
			$dlg.find('.left_bar').off('click').on("click", 'li', function (e) {
				// 状态改变
				$(this).addClass('active').siblings('li').removeClass('active');
				$dlg.find('.collect').removeClass('active');
				$('#dlg_myCollection').hide();
				$('#dlg_categoryList').show();
				_this.data.scrollEnd = false; // 重置滚动状态
				DesignerInsertTemp.model.popData.leftMenuIndex = $(this).index();

				var _val = $.trim($(this).text());
				if ($(this).index() === 0) {
					// _this.data.isIntroduction = true;
					_this.data.listStatus = 1; //改变列表状态
				} else {
					// _this.data.isIntroduction = false; // 定制
					_this.data.listStatus = 2; //改变列表状态
					_this.data.searchPage = 1; //重置分页数据
				}
				_this.data.tagName = _val;
				_this.changeCategoryDataList();
			});
			// 定制场景
			$dlg.find('.customed').off('click').bind("click", function (e) {
				// $(this).addClass('active');
				// 切换分页
				_this.changeDlgPage('customized');
			});
			// 收藏关注模板
			$('#dlgCustomBtn').off('click').bind("click", function (e) {
				$(this).addClass('active');
				$('#dlg_left_bar li').removeClass('active');

				$('#dlg_myCollection').show();
				$('#dlg_categoryList').hide();

				$("#dlg_myCollection li").eq(0).trigger('click');
			});
			// 收藏栏目相关
			$("#dlg_myCollection li").off('click').bind("click", function (e) {
				$(this).addClass('active').siblings('li').removeClass('active');
				var index = $(this).index();
				var category = $(this).attr('_category');
				_this.changeMyCollection(category);
			});
			// 栏目列表
			$('#dlg_categoryList li').off('click').bind("click", function (e) {
				$(this).addClass('active').siblings('li').removeClass('active');
				DesignerInsertTemp.model.popData.categoryName = $(this).attr('_category');
				_this.data.searchPage = 1; //重置分页数据
				_this.data.scrollEnd = false; // 重置滚动数据
				DesignerInsertTemp.model.popData.categoryIndex = $(this).index();
				_this.changeCategoryDataList();
			});
			// 模板相关事件
			$('#temp_con_wrap').off('click').on('click', '.item_box', function (e) {
				// console.log(e);
				var etype = $(this).attr('_etype');
				var price = $(this).attr('_price');
				var $this = $(this);
				//for 埋点
				var ownerid = $(this).attr('_ownerid');
				var tempTitle = $(this).attr('_temptitle');
				var tempCategory = $(this).attr('_category');



				// console.log($(e.target).attr('_etype'));
				if ($(e.target).attr('_etype') === 'setFlow' || $(e.target).attr('class') === 'iconCollection') {
					etype = 'setFlow';
				}
				// else if($(e.target).attr('_etype') === 'preview'){
				// 	etype = 'preview';
				// }
				// 历史逻辑区分
				if ($(e.target).attr('_etype')) {
					var eTarget = $(e.target).attr('_etype');
					switch (eTarget) {
						case 'preview':
							etype = 'preview';
							break;
						case 'setFlow':
							etype = 'setFlow';
							break;
					}
				}
				// _etype='setFlow'
				var tempid = $(this).attr('tempid');
				switch (etype) {
					case 'plus': // 添加
						var category = $("#dlg_categoryList .active").attr("_category");
						// 团队版判断
						if (chartObj && chartObj.orgId) {
							DesignerInsertTemp.cloneOrgFile('', function (data) {
								var id = data.chart.chartId,
									url = (fileType === 'flow' ? "/diagraming/" : "/mindmap/") + id;
								Util.localChange({
									type: 'newfile',
									chartId: id,
								})
								window.open(url, id);
							});
							$("#dlg_temp").dialog("close");
							return;
						}
						$("#dlg_temp").dialog("close");

						// 通过权益接口判断是否满了
						pcUtil.ajax({
							url: "/api/pc/user/privilege",
							type: 'get',
							success: function (res) {
								const data = res.data.privilege
								let cannoOpen = true;
								if (data.member || data.orgMember) {
									cannoOpen = true
								}else if ((data.usedFileCount + 1) > data.fileCount) {
									cannoOpen = false
								}else{
									cannoOpen = true
								}
								if (cannoOpen) {
									// 可以直接新建
									let url = category.indexOf('mind') > -1 ? 
									    './src/v5_editor/source/compile/mindmap/index.html' :
										'./src/v5_editor/source/compile/diagrams/index.html';
									let path = `?token=token&chartId=&dbId=&filepath=&type=${category}&new=true&tempCate=${chartObj.category}`


									ipc.sendToHost('addTab', { src: url + path, title: '未命名文件' })
									return
								} else {
									// 文件数不足中间弹框
									const cate = category.indexOf('mind') > -1 ?'mind_free':'flow'
									ipc.sendToHost('upgradeDlg', { dlgType: 1, type: cate, category:cate })
								}
								
							}
						})
						break;
					case 'item': // 单个模板实列
						_this.addTemp(tempid, price, ownerid, tempTitle, $dlg);
						break;
					case 'setFlow':
						_this.setToFollow(function (res) {
							if (res.return === 'save') {
								$this.children('.iconCollection').find('i').eq(1).show();
								$this.children('.iconCollection').find('i').eq(0).hide();
							} else {
								$this.children('.iconCollection').find('i').eq(0).show();
								$this.children('.iconCollection').find('i').eq(1).hide();
							}
							// poCollect("编辑器-模板弹窗收藏",{"收藏": res.result === 'save' ? "收藏" : "取消"})
						}, tempid);
						break;
					case 'preview': //预览
						_this.toPreview(tempid);
						break;
				}
				// console.log(e, etype);
			});

			// 我的关注用户信息
			$('#temp_con_wrap').on('click', '.user-info', function (e) {
				// console.log('.user-info ---------', e);
				var eventType = $(e.target).attr('_etype');
				switch (eventType) {
					case 'myflow':
						var userId = $(e.target).parent('span.name').attr('_userId');
						var isFlow = $(e.target).attr('_isflow');
						var flowPms = false;
						if (isFlow !== '1') {
							flowPms = true
							_this.setMyFlow(function (res) {
								$(e.target).hide().siblings('i.autoPlus').show();
							}, userId, flowPms);
						} else {
							// $.confirm({
							// 	content:"确定取消关注当前好友吗？",
							// 	onConfirm : function() {
							_this.setMyFlow(function (res) {
								// console.log('我的关注----', res)
								$(e.target).hide().siblings('i.autoPlus').show();
							}, userId, flowPms);
							// }
							// });
						}

						// console.log(e.target, userId);
						break;
				}
			});

			// 针对顶部菜单hover动画
			$('.dialog-title').off('mouseenter').on('mouseenter', function (e) {
				$(this).children('span').addClass('anmAutoLR');
			});
			$('.dialog-title').off('mouseleave').on('mouseleave', function (e) {
				$(this).children('span').removeClass('anmAutoLR');
			});

			// 绑定收藏触发
			$('#temp_con_wrap').off('mouseenter').on('mouseenter', '.item_box', function (e) {
				var tempid = $(this).attr('tempid');
				var isliked = $(this).attr('isliked');
				var $this = $(this);
				$this.children('.iconCollection').css('display', 'flex');
				if (isliked) {
					return false;
				}
				_this.checkTemp(tempid, function (res) {
					// console.log('已经收藏----',res)
					if (res.liked) {
						$this.children('.iconCollection').find('i').eq(1).show().siblings('i').hide();
					} else {
						$this.children('.iconCollection').find('i').eq(0).show().siblings('i').hide();
					}
					$this.attr('isliked', '1');
				});
			});
			$('#temp_con_wrap').off('mouseleave').on('mouseleave', '.item_box', function (e) {
				var $this = $(this);
				$this.children('.iconCollection').hide();
			});
			// 搜索跳转模板
			$('#tempSearch').off().bind('keyup', function (e) {
				localStorage.setItem("keyword", $(this).val());
				if (e.keyCode === 13) {
					ipc.send("openUrl", `/template/search/${$(this).val()}`)
					// window.location.href = '/template';
				}
			});
			// 搜索ICON
			$('#tempSearch').siblings('span.icons').off('click').bind('click', function () {
				localStorage.setItem("keyword", $('#tempSearch').val());
				ipc.send("openUrl", `/template/search/${$('#tempSearch').val()}`)
			});
			// 滚动条事件
			$('#dlg_temp_con').off('scroll').bind('scroll', function () {
				// _this.data.listStatus = 1; //改变列表状态
				// console.log(_this.data.listStatus, _this.data.isTempLoading, _this.data.scrollEnd);
				if (_this.data.listStatus !== 2 || _this.data.isTempLoading || _this.data.scrollEnd) {
					return;
				}

				// 边界
				if ($(this).scrollTop() + $(this).height() >= $('#temp_con_wrap').height()) {
					_this.data.searchPage++;
					// console.log($(this).scrollTop() + $(this).height() >= $('#temp_con_wrap').height());
					_this.changeCategoryDataList('add');
				}
			});
			//**** 定制化相关事件 */

			// 绑定事件
			$dlg.dialog({
				onClose: function () {
					_this.destory($dlg);
					$dlg.remove();
				}
			});
		},
		// 绑定定制相关事件
		bindEventCustomization: function ($dlg) {
			var _this = this;
			$('#dlgCustomized').find('.goback').off('click').bind('click', function (e) {
				_this.changeDlgPage('temp', false);
			});
			// 绑定点击事件
			$('#dlgCustomized .custom-content').find('li').off('click').bind('click', function (e) {
				var isAdd;
				if ($(this).hasClass('active')) {
					// console.log('存在')
					isAdd = false;
				} else {
					isAdd = true;
				}
				var _nowData = _this.changeTempCustData($.trim($(this).text()), isAdd);
				$('#dlgCustomized').find('.pro-btn').html('已选' + _nowData.length + '个');
				// 状态改变
				$(this).toggleClass('active');
			});

			// 保存个人定制信息
			$('#dlgCustomized').find('.pro-btn').off().bind('click', function (e) {
				_this.toSaveCustomTags(function (res) {
					// console.log(res);
					DesignerInsertTemp.model.popData.leftMenuList = [];
					$.extend(DesignerInsertTemp.model.popData.leftMenuList, _this.data.tempCustData);
					_this.changeLeftTempCust();
					_this.changeDlgPage('temp', true);
				});
			});

		},
		// 改变左侧定制数据
		changeLeftTempCust: function () {
			var menuActiveIndex = 0;
			var _data = DesignerInsertTemp.model.popData.leftMenuList;
			var li = '<li class="active">为你推荐</li>';
			$(_data).each(function (i, v) {
				var index = i + 1
				var _classActive = index === menuActiveIndex ? 'active' : '';
				li += "<li class='" + _classActive + "'>" + v + "</li>"
			});
			$('.left_bar').html(li);
		},
		// 改变临时操作定制数据
		changeTempCustData: function (tagName, isAdd) {
			var _this = this;
			if (isAdd) {
				_this.data.tempCustData.push(tagName);
			} else {
				// 删除
				for (var i = 0, len = _this.data.tempCustData.length; i < len; i++) {
					if (_this.data.tempCustData[i] === tagName) {
						_this.data.tempCustData.splice(i, 1);
						break;
					}
				}
			}
			return _this.data.tempCustData;
		},
		// 预览
		toPreview: function (chartId) {
			ipc.send('openUrl', '/view/' + chartId)
		},
		// 模板插入
		addTemp: function (tempid, price, ownerId, tempTitle, $dlg) {
			$dlg.find('.po-dialog-close').trigger('click');

			// $.mask('close');
			// console.log(this.getPageType())
			if (this.getPageType() === 'a') {
				DesignerInsertTemp.flowInsert(tempid, price, ownerId, tempTitle);
			} else {
				DesignerInsertTemp.mindInsert(tempid, price, ownerId, tempTitle);
			}
		},
		// 获得页面类型 a 流程图 b 思维导图
		getPageType: function () {
			var cateGoryA = DesignerInsertTemp.model.popData.categoryList;
			var cateGoryB = DesignerInsertTemp.model.popData.categoryListB;
			var rtn = '';
			for (var i = 0, len = cateGoryA.length; i < len; i++) {
				if (cateGoryA[i].dataCategory === DesignerInsertTemp.model.popData.categoryName) {
					rtn = 'a';
					break;
				}
			}
			for (var i = 0, len = cateGoryB.length; i < len; i++) {
				if (cateGoryB[i].dataCategory === DesignerInsertTemp.model.popData.categoryName) {
					rtn = 'b';
					break;
				}
			}
			return rtn;
		},
		// 针对收藏，使用,当前维度数据错误问题
		checkData: function (items) {
			var newData = [];
			var _this = this;
			// for(var i = 0,len=items.length; i< len; i++){
			// 	if(_this.checkItemShow(items[i].category)){
			// 		newData.push(items[i]);
			// 	}
			// }
			$(items).each(function (i, v) {
				if (_this.checkItemShow(v.category)) {
					newData.push(v);
				}
			});
			return newData;
		},
		// 检测列表下相关联维度显示隐藏
		checkItemShow: function (_category) {
			// console.log(_category)
			var rtn = false;
			if (!_category || _category === 'outline') {
				return rtn;
			}
			// 思维导图
			if (this.data.isMind) {
				if (_category.indexOf('mind') > -1) {
					rtn = true;
				} else {
					rtn = false;
				}
			} else {
				// 流程图
				if (_category.indexOf('mind') === -1 && _category !== 'outline') {
					rtn = true;
				} else {
					rtn = false;
				}

			}

			// 思维导图
			// if (this.data.isMind){
			// 	$(DesignerInsertTemp.model.popData.categoryListB).each(function(i,v){
			// 		if (_category === v.dataCategory){
			// 			rtn = true;
			// 			return true;
			// 		}
			// 	});
			// }else{
			// 	// 流程图
			// 	$(DesignerInsertTemp.model.popData.categoryList).each(function(i,v){
			// 		if (_category === v.dataCategory){
			// 			rtn = true;
			// 			return true;
			// 		}
			// 	});
			// }
			return rtn;
		},
		// 改变收藏
		changeMyCollection: function (category) {
			// console.log('收藏~~~~~', category);
			switch (category) {
				case 'myused': // 使用
					this.data.listStatus = 3;
					this.changeCategoryDataList();
					break;
				case 'myCollection': // 收藏
					this.data.listStatus = 4;
					this.changeCategoryDataList();
					break;
				case 'myfollow': // 关注
					this.data.listStatus = 5;
					this.changeCategoryDataList();
					break;
			}

		},
		// 改变弹窗页面
		changeDlgPage: function (dlgPage, isChange) {
			switch (dlgPage) {
				case 'temp': // 模板
					$('#dlgTempBox').css({
						opacity: 1,
						'transform': 'translateX(0px)'
					});
					$('#dlgCustomized').css({
						opacity: 1,
						'transform': 'translateX(980px)'
					});
					// 是否改变
					if (typeof isChange === 'boolean' && isChange === true) {
						// 初始化操作
						this.data.searchPage = 1;

						// DesignerInsertTemp.model.popData.categoryName = 'flow';
						// DesignerInsertTemp.model.popData.leftMenuIndex = 0;
						// this.data.isIntroduction = true;

						if (this.data.listStatus === 3 || this.data.listStatus === 4 || this.data.listStatus === 5) {

						} else {
							this.data.listStatus = 1; //改变列表状态
							$('#dlg_myCollection').hide();
							$('#dlg_categoryList').show();
						}


						// $('#dlg_categoryList li').eq(0).addClass('active').siblings('li').removeClass('active');

						$('#dlgCustomBtn').removeClass('active');
						// 调用数据
						this.changeCategoryDataList();
					}

					break;
				case 'customized': // 定制
					$('#dlgTempBox').css({
						opacity: 0.1,
						'transform': 'translateX(-980px)'
					});
					$('#dlgCustomized').css({
						opacity: 1,
						'transform': 'translateX(0px)'
					});
					break;
			}
		},
		//改变category
		changeCategoryDataList: function (type) {
			var _this = this;
			// $("#temp_con_wrap").hide();$("#temp_con_wrap").next('.loading').css('display','flex');return;
			// notemp
			if (type !== 'add') {
				$("#temp_con_wrap").hide();
			}
			$("#temp_con_wrap").next('.loading').css('display', 'flex');
			$("#dlg_temp_con").find('.loadtip').hide();

			_this.data.isTempLoading = true; //开启加载
			// 检测列表状态
			switch (_this.data.listStatus) {
				case 1: //推荐
					// 调用推荐数据
					this.getTempData(function (res) {
						// console.log('模板数据----', res)
						makeDom(res);
					});
					break;
				case 2: //定制
					// 调用搜索数据
					var searchPms = {
						category: DesignerInsertTemp.model.popData.categoryName,
						page: _this.data.searchPage,
						rows: _this.data.searchPageSize,
						tag: _this.data.tagName
					}
					this.getSearchTemp(searchPms, function (res) {
						$("#temp_con_wrap").next('.loading').hide();
						if (res.rows.length <= 0) {
							_this.data.scrollEnd = true;
							$("#dlg_temp_con").find('.loadtip').show();
						}
						makeDom(res.rows);
					});
					break;
				case 3: //使用
					this.getLastUsed(function (rows) {
						var _data = rows;
						makeDom(_this.checkData(_data));
					});
					break;
				case 4: //收藏
					this.getMyLoadfiles(function (res) {
						var _data = res.charts;
						makeDom(_this.checkData(_data));
					});
					break;
				case 5: //关注
					this.getMyNewFollowTemplates(function (data) {
						var _data = data;
						// followUserArray
						makeFollowDom(_data);
					});
					break;
			}

			// 创建模板
			function makeDom(resData) {
				DesignerInsertTemp.model.popData.categoryListData = resData; // 赋值数据
				// 改变dom
				var _data = resData;
				var addTitle = '';
				if (!_this.data.isMind) {
					addTitle = DesignerInsertTemp.model.popData.categoryList[DesignerInsertTemp.model.popData.categoryIndex].name;
				} else {
					addTitle = DesignerInsertTemp.model.popData.categoryListB[DesignerInsertTemp.model.popData.categoryIndex].name;
				}

				var tempHtml = "<div class='item_box btnItemPlus' _etype='plus'><span class='po-diagraming-icons icons'>&#xe6ee;</span><span class='info'>新建" + addTitle + "</span></div>";

				if (type === 'add' && $('#temp_con_wrap .item_box').length > 0 || _this.data.listStatus === 3 || _this.data.listStatus === 4) {
					var tempHtml = "";
				}
				$(_data).each(function (i, v) {
					var template = v;

					// 判断显示隐藏
					if (!_this.checkItemShow(v.category)) {
						return false;
					}
					var _ownerid = 0;
					if (template.owner) {
						_ownerid = template.owner.userId
					} else if (template.ownerId) {
						_ownerid = template.ownerId
					}
					//var _ownerid = template.owner ?template.owner.userId :0;
					// img
					tempHtml += "<div class='item_box' tempid=" + template.chartId + " _price=" + template.publicClonePrice + " _category=" + template.category + " _ownerid=" + _ownerid + " _tempTitle=" + template.title + " _status=" + template.status + " _etype='item'><div class='img_box'><img src='https://po-img.processon.com/chart_image/template/thumb/" + template.thumbnail + ".png?tid=" + template.chartId + "'/></div>";
					// vip
					if (v.status === 'public') {
						// vip
						if (v.publicClonePrice > 0) {
							// || typeof v.owner === 'undefined'
							// 推荐数据,使用,关注
							if (_this.data.listStatus === 1 || _this.data.listStatus === 3 || _this.data.listStatus === 4) {
								if (typeof v.owner === 'undefined' || v.owner === null) {
									tempHtml += "<span class='iconVip'>VIP免费</span>";
								}
							} else {
								// 模板和关注数据 2
								if (typeof v.ownerId === 'undefined' || v.ownerId === null) {
									tempHtml += "<span class='iconVip'>VIP免费</span>";
								}
							}

						}
					}
					// 收藏部分
					tempHtml += "<span class='iconCollection'><i class='po-diagraming-icons icons' _etype='setFlow'>&#xe6b2;</i><i class='po-diagraming-icons icons' _etype='setFlow' style='display:none;'>&#xe71e;</i> 收藏</span>";
					// 遮罩部分
					tempHtml += "<div class='itemMask' _etype='item'><a class='btn btnView' _etype='preview'>预览</a><a class='btn btnToUse' _etype='item'>使用</a></div>";
					tempHtml += "<div class='item_titBox'><div class='item_tit'>" + template.title + "</div>";

					// 判断收付费
					var _vipName = '免费', _statusClass = 'gratis';
					if (v.status === 'public') {
						// vip
						if (v.publicClonePrice > 0) {
							_vipName = '￥' + v.publicClonePrice;
							_statusClass = 'price'
							// if(v.owner === null){
							// 	_vipName = 'vip';
							// }
						}
					}
					tempHtml += "<span class='priceInfo " + _statusClass + "'>" + _vipName + "</span>"
					tempHtml += "</div></div>"
				});
				// 判断追加还是塞数据
				if (type === 'add') {
					$('#temp_con_wrap').append(tempHtml);
				} else {
					$('#temp_con_wrap').html(tempHtml);
					// 状态
					$("#temp_con_wrap").show();
					// 空数据
					if (resData.length <= 0) {
						$('#dlg_temp_con').find('.notemp').show();
						$('#dlg_temp_con').find('.loadtip').hide();
					}
				}
				if (resData.length > 0) {
					$('#dlg_temp_con').find('.notemp').hide();
				}
				$("#temp_con_wrap").next('.loading').hide();
				_this.data.isTempLoading = false; //关闭登录状态
			}
			// 创建关注模板 <span class="follow followed"></span>
			function makeFollowDom(resData) {
				// console.log('获得关注数据-----', resData);
				var temHtml = '<ul class="temp-tag-list manage" style="height: auto">';
				$(resData).each(function (i, v) {
					var memberData = _this.checkData(v.templates);
					// console.log('获得关注数据----2-', memberData);
					if (memberData.length <= 0) {
						return true;
					}
					// console.log(i, v);
					temHtml += '<li class="temp-item-user" userid="' + v.userId + '">';
					temHtml += '<div class="user-info">';
					temHtml += '<span class="face"><a class="" href="/u/' + v.userId + '/profile" target="_blank">';
					if (v.isTalent) {
						temHtml += '<img class="dr"/ src="https://www.processon.com/assets/images/new/talent_lab.svg">';
					}
					temHtml += '<img src="/photo/' + v.userId + '.png"/>';
					temHtml += '</a></span>';
					temHtml += '<div class="userInfo">';
					temHtml += '<span class="name" _userId="' + v.userId + '"><a href="/u/' + v.userId + '/profile" target="_blank">' + v.fullName + '</a>';
					if (v.isFlow) {
						temHtml += '<i class="po-diagraming-icons icons autoPlus" title="已关注" _isflow="1" _etype="myflow">&#xe75b;</i><i class="po-diagraming-icons icons noflow autoPlus" title="未关注" _isflow="2" _etype="myflow" style="display:none;">&#xe640;</i>';
					} else {
						temHtml += '<i class="po-diagraming-icons icons autoPlus" title="已关注" _isflow="1" _etype="myflow" style="display:none;">&#xe75b;</i><i class="po-diagraming-icons icons noflow autoPlus" title="未关注" _isflow="2" _etype="myflow" >&#xe640;</i>';
						// temHtml+='<i class="icons noflow autoPlus">&#xe640;</i>';
					}
					temHtml += '</span>';
					temHtml += '<span class="intro">' + (v.introduction == '' ? '这个人很懒，什么都没留下' : v.introduction) + '</span>';

					temHtml += '<div class="btn-group">';
					temHtml += '<span class="sub"></span>';
					temHtml += '<a href="/u/' + v.userId + '/profile" target="_blank">模板：<span>' + v.templateTotal + '</span></a>';
					temHtml += '<a href="/u/' + v.userId + '/profile" target="_blank">粉丝：<span>' + v.flowMes + '</span></a>';
					temHtml += '</div>';

					temHtml += '</div>';
					temHtml += '</div>';

					temHtml += '<div class="file-list">';
					// 会员数据

					$(memberData).each(function (i2, v2) {
						if (i2 >= 3) { return false; }
						// 判断显示隐藏
						if (!_this.checkItemShow(v2.category)) {
							return false;
						}
						// img
						temHtml += "<div class='item_box' tempid='" + v2.chartId + "' _price='" + v2.publicClonePrice + "' _etype='item'><div class='img_box'><img src='https://po-img.processon.com/chart_image/template/thumb/" + v2.thumbnail + ".png?tid=" + template.chartId + "'/></div>";
						// var _ownerid = v2.owner?v2.owner.userId :"";
						// temHtml += "<div class='item_box' tempid='"+ v2.chartId +"' _price='"+v2.publicClonePrice+"' _price='"+v2.publicClonePrice+"' _category='"+v2.category +"' _ownerid='"+_ownerid +"' _tempTitle='"+v2.title +"' _status='"+v2.status +"' _etype='item'><div class='img_box'><img src='https://po-img.processon.com/chart_image/template/thumb/" + v2.thumbnail + ".png'/></div>";
						// vip
						if (v2.status === 'public' && v2.publicClone === true) {
							// vip
							if (v2.publicClonePrice > 0) {

								if (typeof v2.ownerId === 'undefined' || v2.ownerId === null) {
									temHtml += "<span class='iconVip'>VIP免费</span>";
								}
							}
						}
						// 收藏部分
						temHtml += "<span class='iconCollection'><i class='po-diagraming-icons icons' _etype='setFlow'>&#xe6b2;</i><i class='po-diagraming-icons icons' _etype='setFlow' style='display:none;'>&#xe71e;</i> 收藏</span>";
						// 遮罩部分
						temHtml += "<div class='itemMask' _etype='item'><a class='btn btnView' _etype='preview'>预览</a><a class='btn btnToUse' _etype='item'>使用</a></div>";
						temHtml += "<div class='item_titBox'><div class='item_tit'>" + v2.title + "</div>";

						// 判断收付费
						var _vipName = '免费', _statusClass = 'gratis';
						if (v2.status === 'public' && v2.publicClone === true) {
							// vip
							if (v2.publicClonePrice > 0) {
								_vipName = '￥' + v2.publicClonePrice;
								_statusClass = 'price'
								// if(v.owner === null){
								// 	_vipName = 'vip';
								// }
							}
						}
						temHtml += "<span class='priceInfo " + _statusClass + "'>" + _vipName + "</span>"
						temHtml += "</div></div>"
					});

					temHtml += '</div>';
					temHtml += '</li>';
				});
				temHtml += '</ul>';

				$('#temp_con_wrap').show().html(temHtml);
				// 判断数据长度
				if ($('#temp_con_wrap .temp-tag-list li.temp-item-user').length <= 0) {
					resData = [];
				}
				// 状态改变
				$("#temp_con_wrap").next('.loading').hide();
				// 空数据
				if (resData.length <= 0) {
					$('#dlg_temp_con').find('.notemp').show();
					$('#dlg_temp_con').find('.loadtip').hide();
				}
				_this.data.isTempLoading = false; //关闭登录状态
			}
		},
		// 改变关注数据
		// 反向校验tag是否存在
		checkCustomizationActive: function (tagName) {
			var _data = DesignerInsertTemp.model.popData.leftMenuList;
			var rtn = false;
			$(_data).each(function (i, v) {
				if (v === tagName) {
					rtn = true;
					return true;
				}
			});
			return rtn;
		},
		// ***** api专区 ******/
		/**
		 * 获得数据
		 * @param {*} category
		 */
		getTempData: function (fn) {
			var category = DesignerInsertTemp.model.popData.categoryName;
			category = ["mind_right", "mind", "outline"].includes(category) ? "mind_free" : category;
			// 数据调用
			pcUtil.ajax({
				type: "GET",
				url: "/api/personal/template/official_mark_templates",
				data: { category },
				success: function (res) {
					const msg = res.data
					var newMsg = []
					if (chartObj && chartObj.orgId) {
						newMsg = msg.filter(item => item.publicClonePrice == 0 || !item.owner);
					} else {
						newMsg = msg
					}
					typeof fn === 'function' && fn(newMsg); // 针对初始化回调
				}
			});
		},
		// 搜索模板
		// page:当前页数,
		// rows:每页条数,
		// payType:付费类型（free-免费、memberFree-会员免费、pay-付费）,
		// tag:标签,
		// sidx:排序(默认选填 cloneCount),
		// keyword:检索词
		getSearchTemp: function (seachPms, fn) {
			var category = seachPms.category;
			category = ["mind_free", "mind"].includes(category) ? "mindbase" : category
			var _seachPms = {
				category: category,
				page: seachPms.page,
				rows: seachPms.rows,
				tag: seachPms.tag,
				sidx: "cloneCount"
			}
			pcUtil.ajax({
				url: "/api/personal/search/template",
				type: "POST",
				data: JSON.stringify(_seachPms),
				contentType: "application/json",
				success: function (res) {
					typeof fn === 'function' && fn(res.data); // 针对初始化回调
				}
			});
		},
		// 获取个人专属定制标签列表
		getUserCustomTags: function (fn) {
			// 数据调用
			pcUtil.ajax({
				type: "GET",
				url: "/api/personal/user/social/getUserCustomTags",
				data: { userId: userObj.userId },
				success: function (res) {
					typeof fn === 'function' && fn(res.data);
				}
			});
		},
		// 模板是否已经收藏
		checkTemp: function (chartId, fn) {
			var _this = this;
			if (this.data.collectionLoding) {
				return false
			}
			this.data.collectionLoding = true;
			pcUtil.ajax({
				type: "GET",
				url: "/api/personal/template/liked",
				data: { chartId: chartId, userid: userObj.userId },
				success: function (res) {
					typeof fn === 'function' && fn(res.data); // 针对初始化回调
					_this.data.collectionLoding = false;
				}
			});
		},
		// 获取官方场景分类+标签列表
		getOfficialTags: function (fn) {
			// 数据调用
			pcUtil.ajax({
				type: "GET",
				url: "/api/personal/tags/category/getOfficialCategories",
				success: function (res) {
					typeof fn === 'function' && fn(res.data);
				}
			});
		},
		// 保存个人定制
		toSaveCustomTags: function (fn) {
			var pdata = {
				tagName: this.data.tempCustData.toString(),
				userId: userObj.userId
			};
			// 数据储存
			pcUtil.ajax({
				type: "POST",
				url: "/api/personal/user/social/saveUserCustomTags",
				data: pdata,
				success: function (data) {
					typeof fn === 'function' && fn(data.msg);
				}
			});
		},
		// 获得我的关注    sort:排序(publishTime-最新发布，activeTime-最受欢迎，默认最新发布排序)
		getMyNewFollowTemplates: function (fn, sort) {
			var pms = {
				sort: typeof sort === 'string' ? srot : 'publishTime',
				userId: userObj.userId
			}
			// 数据调用
			pcUtil.ajax({
				type: "GET",
				url: "/api/personal/user/social/getNewFollowTemplates",
				data: pms,
				success: function (res) {
					typeof fn === 'function' && fn(res.data);
				}
			});
		},
		// 获得最近收藏
		getMyLoadfiles: function (fn) {
			var pms = {
				chartType: 'template',
				page: 1
			}
			// 数据调用
			pcUtil.ajax({
				type: "GET",
				url: "/api/personal/folder/fav_files",
				data: pms,
				success: function (res) {
					typeof fn === 'function' && fn(res.data);
				}
			});
		},
		// 最近使用
		getLastUsed: function (fn) {
			var pms = {
				userId: userObj.userId,
				page: 1
			}
			// 数据调用
			pcUtil.ajax({
				type: "GET",
				url: "/api/personal/chart/getTemplateUsed",
				data: pms,
				success: function (res) {
					// if (msg.result !== 'success'){
					// 	return false;
					// }
					typeof fn === 'function' && fn(res.data);
				}
			});
		},
		// 收藏
		setToFollow: function (fn, chartId) {
			var pms = {
				chartId: chartId,
				chartType: "template"
			}
			// 数据调用
			pcUtil.ajax({
				type: "POST",
				url: "/api/personal/view/favourite_chart",
				data: pms,
				success: function (res) {
					// if (msg.result !== 'success'){
					// 	return false;
					// }
					typeof fn === 'function' && fn(res.data);
				}
			});
		},
		// 关注
		setMyFlow: function (fn, followId, type) {
			var pms = {};
			if (type) {
				pms = { followIds: followId }
			} else {
				pms = { followId: followId }
			}
			// 数据调用
			pcUtil.ajax({
				type: "GET",
				isTemp: true,
				url: type ? "/start/savefollow" : "/start/unfollow",
				data: pms,
				success: function (msg) {
					if (msg.result !== 'success') {
						return false;
					}
					typeof fn === 'function' && fn(msg);
				}
			});

		}

		// ***** api专区 ******/
	},
	//清除编辑器插入模板
	clear: function (type) {
		var that = this;
		$(".bottom_temp_wrap").remove();
		$("#dlg_temp").remove();
		var openDom = $("#open-insert-temp");
		if (openDom.length == 0) {
			openDom = $("<div id='open-insert-temp' class='po-tool-button-small' title='模板' title-pos='top'><span class='po-diagraming-icons'>&#xe809;</span></div>").prependTo(".po-footer, .po-navigation-op");
		}
		openDom.button("unselect");
		openDom.button({
			onClick: function (e, target) {
				if (target.button("isSelected") || $('.bottom_temp_wrap_mind').length) {
					that.clear(type);
				} else {
					that.init(type);
				}
			}
		})

	},
	cloneCheck: function (id, price, ownerId, tempTitle, type, tempCate) {
		var that = this;
		pcUtil.ajax({
			url: "/api/personal/diagraming/clone_check",
			data: {
				chartId: id
			},
			type: "POST",
			success: function (res) {
				const data = res.data
				if (data.result == "clone") {
					that.clonFile(id, tempCate, tempTitle)
				} else if (data.result == "cloneBuy") {
					that.clonePayPoupe(id, data.price, ownerId, tempTitle, "clone")
				}
				else if (data.result == "overd") {
					// 如果有定义 需要支持本地创建
					if (PoEditorClient.getDefCount() > 0 && (!price || price == '0')) {
						ipc.sendToHost('upgradeDlg', { dlgType: 1, tempId: id, category: tempCate, type })
						return
					}
					window.poCollect('展示支付弹窗',{'触发位置':'编辑器下方模版弹窗中的VIP模版'})
					ipc.sendToHost("showDlgPayWebView",{})
					// window.PoEditorInsert.pay({ title: "购买个人版", overd: true });
				} else if (data.result == "chart_error") {
					// $.confirm({
					// 	content: "<div class='filecheck-con'><span class='icons'>&#xe656;</span><div class='filecheck-right'><div>很抱歉，该模板已被作者取消公开或删除。请继续浏览并使用其他模板～</div></div></div>",
					// 	okval:"确认",
					// 	hiddenCancel:true
					// });
					return;
				}
			}
		})
	},
	clonFile: function (id, tempCate, title) {
		if (chartObj.orgId) {
			this.cloneOrgFile(id);
			return;
		}
		//自己文件到当前文件所在文件夹下， 其他情况在root下
		let url = ''
		if (window.fileType.indexOf("mind") >= 0) url = './src/v5_editor/source/compile/mindmap/index.html';
		else url = './src/v5_editor/source/compile/diagrams/index.html';
		let path = `?token=token$chartId=&tempId=${id}&dbId=&type=${tempCate}&new=true&tempCate=${chartObj.category}`
		if (window.fileType == "mind") {
			// window.open("/mindmap/" + data.chart.chartId);
			ipc.sendToHost('addTab', { src: url + path, title })

		} else {
			// window.open("/diagraming/" + data.chart.chartId);
			ipc.sendToHost('addTab', { src: url + path, title })

		}
	},
	// 复制团队文件
	cloneOrgFile: function (tempId, fn) {
		var that = this;
		let orgId = poEditoB.utils.getCookies('po-last-platform');
		let teamId = poEditoB.utils.getCookies('po-last-teamId');
		let data = {
			category: $("#dlg_categoryList .active").attr("_category") || fileType,
			templateId: tempId,
			title: '',
			orgId: orgId,
			teamId: teamId
		}
		pcUtil.ajax({
			url: "/api/org/file/chart/new",
			data: data,
			type: "POST",
			success: function (data) {
				if (typeof fn === 'function') {
					fn(data);
				} else {
					if (that.fileType == "mind") {
						window.open("/mindmap/" + data.chart.chartId);
					} else {
						window.open("/diagraming/" + data.chart.chartId);
					}
				}
			}
		})
	},
	// 流程图插入
	flowInsert: function (id, price, ownerId, tempTitle, payResult) {
		var that = this;
		var temp = that.model.getTemplatesById(id);
		var cate = that.model.getCategoryListByName(chartObj.category);
		var tempCate = {};
		if (temp) {
			tempCate = that.model.getCategoryListByName(temp.category);
		}
		var payStatus = {}
		if (payResult == 1) {
			payStatus = {
				"文件类型": "流程图",
				"模板ID": id,
				"作者ID": temp && temp.ownerId || "po",
				"模板名称": temp && temp.title,
				"模板分类": tempCate && tempCate.name || "flow",
				"模板价格": temp && temp.publicClonePrice,
				"模板类型": price ? "付费克隆" : "免费克隆",
				"支付结果": "成功"
			}
		} else {
			payStatus = {
				"文件类型": "流程图",
				"模板ID": id,
				"作者ID": temp && temp.ownerId || "po",
				"模板名称": temp && temp.title,
				"模板分类": tempCate && tempCate.name || "flow",
				"模板价格": temp && temp.publicClonePrice,
				"模板类型": price ? "付费克隆" : "免费克隆"
			}
		}
		window.poPoint && window.poPoint.collect("editor_template_function", payStatus);
		if (PoEditorClient.getDefCount() > 0) {
			this.cloneCheck(id, price, ownerId, tempTitle, window.fileType, temp.category);
			return;
		}
		pcUtil.ajax({
			data: { chartId: id },
			type: "GET",
			isErr: true,
			url: "/api/personal/template/insert_official_mark_template",
			success: function (d) {
				if (d.code == "913") {
					//poCollect("编辑器-模板支付弹窗",{"文件类型": cate ? cate.name : "空", "模板分类": tempCate ? tempCate.name : "空", "模板id": id, "模板价格": price, "用户属性": that.model.ismember ? "会员用户" : "普通用户"})
					//that.clonePayPoupe(id,price,ownerId,tempTitle,"flow")
					that.cloneCheck(id, price, ownerId, tempTitle, "flow", tempCate?.dataCategory)
				} else if (d.code == "200") {
					/*if(d.result != "success"){
						Util.globalTopTip(d.msg, "top_error", 3000, $("#designer"), true);
						return
					}*/
					poCollect("编辑器-模板使用", { "文件类型": cate ? cate.name : "空", "模板分类": tempCate ? tempCate.name : "空", "模板id": id, "模板价格": price, "用户属性": that.model.ismember ? "会员用户" : "普通用户" })
					var def = d.data;
					PoEditorClient.insertTemplate({ def, id })
				}else{
					new Toast({ type: "warning", msg:d.msg})
				}

			}
		});
	},
	// 思维导图插入
	mindInsert: function (id, price, ownerId, tempTitle, payResult) {
		var that = this;
		var temp = that.model.getTemplatesById(id);
		var tempCate = {};
		if (temp) {
			tempCate = that.model.getCategoryListByName(temp.category);
		}
		var payStatus = {}
		if (payResult == 1) {
			payStatus = {
				"文件类型": "思维导图",
				"模板ID": id,
				"作者ID": temp && temp.ownerId || "po",
				"模板名称": temp && temp.title || "",
				"模板分类": tempCate && tempCate.name || "mind",
				"模板价格": temp && temp.publicClonePrice,
				"模板类型": price ? "付费克隆" : "免费克隆",
				"支付结果": "成功"
			}
		} else {
			payStatus = {
				"文件类型": "思维导图",
				"模板ID": id,
				"作者ID": temp && temp.ownerId || "po",
				"模板名称": temp && temp.title || "",
				"模板分类": tempCate && tempCate.name || "mind",
				"模板价格": temp && temp.publicClonePrice,
				"模板类型": price ? "付费克隆" : "免费克隆"
			}
		}
		if (PoEditorClient.getDefCount() > 1) {
			this.cloneCheck(id, price, ownerId, tempTitle, window.fileType, temp.category);
			return;
		}
		window.poPoint && window.poPoint.collect("editor_template_function", payStatus);
		pcUtil.ajax({
			data: { chartId: id },
			type: "GET",
			isErr: true,
			url: "/api/personal/template/insert_official_mark_template",
			success: function (d) {

				if (d.code == "913") {
					/*poCollect("编辑器-模板支付弹窗",{"文件类型": cate ? cate.name : "空", "模板分类": tempCate ? tempCate.name : "空", "模板id": id, "模板价格": price, "用户属性": that.model.ismember ? "会员用户" : "普通用户"})*/
					that.cloneCheck(id, price, ownerId, tempTitle, "mind", tempCate?.dataCategory)
					//that.clonePayPoupe(id, price,ownerId,tempTitle,"mind")
				} else if (d.code == "200") {
					/*poCollect("编辑器-模板使用",{"文件类型": "思维导图", "模板id": id, "模板价格": price, "用户属性": that.model.ismember ? "会员用户" : "普通用户"})*/
					var def = d.data;
					PoEditorClient.insertTemplate({ def, id })
					if (window.fileType == 'mind') {
						setTimeout(() => {
							const title = $('#topic-root .po-richtext-node-wrap').text().trim();
							window.saveName = title == '' ? '未命名文件' : title
						}, 1000);
					}
				}
			}
		});
	},
	//调起支付弹窗 type mind flow clone
	clonePayPoupe: function (id, price, ownerId, chartTitle, type) {
		let that = this;
		var memberFree = ownerId == 0 ? true : false;
		if (memberFree) {
			ipc.sendToHost("showDlgPayWebView",{})
			return
		}
		ipc.once("showPayTemplate_callback", (e, msg) => {
			if (that.fileType == "mind") {
				that.mindInsert(id, price, ownerId, chartTitle, 1);
			} else if (that.fileType == "flow") {
				that.flowInsert(id, price, ownerId, chartTitle, 1);
			}
		})
		ipc.sendToHost("showPayTemplate", { sourceChartId: id, price, title: chartTitle, isDlg: false, memberFree, ownerId })
	},
	model: {
		// 弹窗数据
		popData: {
			//模板左侧数据
			leftMenuIndex: 0,
			leftMenuList: [
				{ name: '为你推荐' },
				{ name: '软件开发' },
				{ name: '产品经理' },
				{ name: '学习笔记' },
				{ name: '活动运营' },
				{ name: '知识管理' }
			],
			categoryName: chartObj.category, //当前栏目名称
			categoryListData: [],
			categoryIndex: 0,
			// 栏目数据
			categoryList: [
				{ name: '流程图', icon: '&#xe7fc;', dataCategory: 'flow' },
				// { name: '思维导图', icon: '&#xe7f4;', dataCategory: 'mind_free'},
				// { name: '思维笔记', icon: '&#xe7f3;', dataCategory: 'outline'},
				{ name: '原型图', icon: '&#xe802;', dataCategory: 'ui' },
				// { name: '组织结构-树状图', icon: '&#xe7f9;', dataCategory: 'mind_org'},
				{ name: '组织结构-流程图', icon: '&#xe801;', dataCategory: 'org' },
				{ name: 'UML', icon: '&#xe7fe;', dataCategory: 'uml' },
				{ name: 'BPMN', icon: '&#xe803;', dataCategory: 'bpmn' },
				{ name: '网络拓扑图', icon: '&#xe7ff;', dataCategory: 'network' },
				{ name: 'Venn韦恩图', icon: '&#xe807;', dataCategory: 'venn' },
				{ name: 'EVC企业价值链', icon: '&#xe804;', dataCategory: 'evc' },
				{ name: 'EPC事件过程链图', icon: '&#xe806;', dataCategory: 'epc' },
				{ name: '魏朱商业模式', icon: '&#xe808;', dataCategory: 'weizhu_bm' },
			],
			categoryListB: [
				{ name: '思维导图', icon: '&#xe7fd;', dataCategory: 'mind_free' },
				// { name: '思维笔记', icon: '&#xe7f3;', dataCategory: 'outline'},
				{ name: '组织结构-树状图', icon: '&#xe800;', dataCategory: 'mind_org' }
			],
			// 我的收藏
			myCollection: [
				{ name: '最近使用', icon: '&#xe6af;', dataCategory: 'myused' },
				{ name: '我的收藏', icon: '&#xe6b1;', dataCategory: 'myCollection' },
				{ name: '我的关注', icon: '&#xe6b2;', dataCategory: 'myfollow' }
			]
		},
		// 推荐数据
		markTemplates: [],
		/**
		 * 预置的id映射，在copy之后，预置paste时会使用的新id，控制连接线所需
		 * @type {}
		 */
		presetedIds: {},
		/**
		 * 预置id映射
		 */
		presetIds: function (shapes) {
			this.presetedIds = {};
			for (key in shapes) {
				//初始化一些属性为默认值
				var shape = shapes[key];
				this.presetedIds[shape.id] = Utils.newId();
				//建立新的group映射
				if (shape.group && !this.presetedIds[shape.group]) {
					this.presetedIds[shape.group] = Utils.newId();
				}
			}
		},
		getTemplatesById: function (id) {
			var templates = this.markTemplates.concat(this.popData.categoryListData);
			var temp = null;
			for (var i = 0, len = templates.length; i < len; i++) {
				var template = templates[i];
				if (template.id == id || template.chartId == id) {
					temp = template;
					break
				}
			}
			return temp;
		},
		getCategoryListByName: function (name) {
			var categoryList = this.popData.categoryList.concat(this.popData.categoryListB);
			var cate = {};
			for (var i = 0, len = categoryList.length; i < len; i++) {
				var category = categoryList[i];
				if (category.dataCategory == name) {
					cate = category;
					break
				}
			}
			return cate;
		},
		/**
		 * 会员状态
		 */
		ismember: false,
		getIsmember: function () {
			this.model.ismember = editorGlobalConfig.isMember;
		},
		updataCataType: function (cate, cb) {
			var that = this;
			cateType = cate;
			that.updataSchameByCate(cate, cb);
			/*$.post("/templates/insert_official_mark_template", {chartId: id}, function(res){
				if(res.result == "success"){
					catetype = cate;
					that.updataSchameByCate(cate);
				}else{

				}

			})*/

		},
		updataSchameByCate: function (cate, cb) {
			var list = this.cataSchameMap[cate];
			if (!list) {
				typeof cb == "function" && cb("err")
				return
			}
			var msgObj = {
				action: "changeSchema",
				categories: list.join(",")
			};
			sendMessage.send(msgObj);
			Designer.setSchema(list, function () {
				typeof cb == "function" && cb()
			});
		},
		cataSchameMap: {
			"flow": ["basic", "flow", "lane"],
			"ui": ["ui", "ui_input"],
			"uml": ["basic", "uml_common", "uml_usecase", "uml_sequence", "uml_class", "uml_stateactivity", "uml_deployment", "uml_component", "er"],
			"network": ["basic", "network"],
			"bpmn": ["basic", "bpmn", "lane"],
			"org": ["basic", "org"],
			"venn": ["venn", "basic"],
			"evc": ["standard", "evc", "basic"],
			"epc": ["standard", "basic", "epc", "org", "lane"],
			"weizhu_bm": ["weizhu_bm", "basic", "standard"]
		}

	}
}
