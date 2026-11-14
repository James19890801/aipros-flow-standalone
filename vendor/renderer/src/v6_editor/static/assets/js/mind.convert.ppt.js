/* 极墨智能PPT转换 */
import {Util} from '@common/util.js'
window.outlineToPpt = {
    options:{
        fileType: 'ppt',
        source: 'processon',
        appId: 'wps_jmppt',
        clientVersion: '1.0.0',
        accessKey: '17057ceea06e45f0b5eaf5af64119a50'
    },
    docId:'',
    init: function(data){
    	var userAgent = navigator.userAgent,
			isIE = userAgent.indexOf("MSIE ") > -1 || userAgent.indexOf("Trident/") > -1;
		if(isIE){
			$.showTip("IE浏览器暂不支持导出PPT", 3000);
			return
		}
        var pptCon = $('.mind-downloadPPT-dlg');
        if(pptCon.length == 0){
        	var pptConHtml = '<div class="mind-downloadPPT-dlg mind-dlg">'+
        						 '<h3 >智能PPT美化风格</h3>'+
								 '<div class="ppt-theme-main">'+
									 '<div class="ppt-theme-list">'+
										 '<div class="ppt-theme-header">'+
											 '<ul class="ppt-tag-list-container">'+
											 '</ul>'+
										 '</div>'+
										 '<div class="ppt-theme-img-box">'+
											 '<ul class="ppt-theme-img-list">'+
											 '</ul>'+
										 '</div>'+
									 '</div>'+
									 '<div class="ppt-theme-preview">'+
										 '<div class="ppt-theme-preview-title">'+
											 '效果预览'+
										 '</div>'+
										 '<div class="ppt-theme-preview-box">'+
											 '<ul class="ppt-theme-preview-list">'+
											 '</ul>'+
										 '</div>'+
									 '</div>'+
								 '</div>'+
								 '<div class="po-buttons" style="text-align:right">'+
									 '<span id="btn-edit-ppt"  class="po-button mind-disable gray">在线编辑</span>&nbsp;&nbsp;'+
									 '<span id="btn-download-ppt" class="po-button mind-disable primary">下载</span>&nbsp;&nbsp;'+
								 '</div>'+
							 '</div>';
			pptCon = $(pptConHtml).appendTo('body')
        }
        pptCon.dialog();
        var OutlineToPptData = outlineToPpt.getOutlineToPptData(data);
        //初始化ppt导出
        var options = outlineToPpt.options;
        var jimoSDK = new JIMO(options);
        var convert = jimoSDK.convert;
        outlineToPpt.outlineConvert(OutlineToPptData,convert);//生成空白模板PPT
        //加载PPT分类
		var themeTags = jimoSDK.theme.getTags();
		themeTags.then(function(res) {
			outlineToPpt.renderPptTab(res.link.subtags[0].subtags)
		}, function(err) {
			console.log(err)
		});
        // zhuge.track('极墨智能PPT弹窗',{'来源': '思维导图'});//触发诸葛埋点事件
        //绑定tab切换事件
        $('.mind-downloadPPT-dlg .ppt-tag-list-container').off("click .downPPT").on("click .downPPT",function(e){
            if (e.target.nodeName == "LI") {
                var $liDom = $(e.target),
                    index = $liDom.index(),
                    styleText = $liDom.attr('tit'),
                    filter = {},
                    topRecs = $liDom.attr('recs').split(',');
                if(styleText != ""){
                    filter.styleTags = [styleText];
                }
                $liDom.addClass('active').siblings('li').removeClass('active');
                var optObj = {
                    "appId": "wps_jmppt",
                    "aspectRatio": "16:9",
                    "aspectRatioAdapt": "16:9",
                    "withMasterThumb": false,
                    "withColorSchemes": true,
                    "clientVersion": "1.0.0",
                    "fetchSlideType": "title",
                    "page": 1,
                    "pageNum": 18,
                    "protocolVersion": "1.4",
                    "filter":filter,
                    "topRecs": [
                        "easy_wpp_jmppt_style_top"
                    ],
                    "sort": "upload_time_desc",
                    "usedStyleIds": [	]
                };
				var themeList = jimoSDK.theme.getList(optObj);
				themeList.then(function(res) {
					//渲染PPT模板类型
					outlineToPpt.renderStylembs(index, res.data.slides, styleText);
				}, function(err) {
					console.log(err)
				});
            }
        });
        //绑定模板切换事件
        $('.mind-downloadPPT-dlg .ppt-theme-img-box').off("click").on("click",function(e){
            if (e.target.nodeName == "IMG") {
                var $liDom = $(e.target);
                $('.mind-downloadPPT-dlg .ppt-theme-img-box li').removeClass('active');
                $liDom.parent('li').addClass('active');
                if ($liDom.parent('li').attr('data-stylemb')) {
                    //切换模板
                    var themeItem = JSON.parse($liDom.parent('li').attr('data-stylemb'));
                    outlineToPpt.convertChangeStyle(themeItem, convert);
                } else{
                    //空白模板
                    outlineToPpt.outlineConvert(OutlineToPptData,convert);
                }
                $('#btn-download-ppt').addClass('mind-disable');
                $('#btn-edit-ppt').addClass('mind-disable');

            }
        });
        //查看大图
        $('.ppt-theme-preview-list').off('click').on('click',function(e){
            if (e.target.nodeName == "IMG") {
                var $liDom = $(e.target).parent('li'),
                    index = $liDom.index();
                var listHtml = 	$('.ppt-theme-preview-list').html();
                outlineToPpt.showThumbBigImg(index,listHtml);
                // zhuge.track('极墨智能PPT查看大图',{'模板标识': index});//触发诸葛埋点事件
            }
        })
        //下载
        $('#btn-download-ppt').off('click').on('click', function(e){
        	if($(this).hasClass('mind-disable')){
        		return
        	}
            //下载PPT
        	$('#btn-download-ppt').addClass('mind-disable');
        	var con = $(".mind-downloadPPT-dlg");
        	$.loading({
                text:'正在下载中'
            })
			if(editorGlobal.isView){
				buried_point_fn("click","export_result","个人文件页",{"操作":"下载文件","触发位置":"年终总结活动弹窗", "文件类型":"思维导图","下载格式" : "PPT","操作结果":"成功",});
			}
            // zhuge.track('极墨智能PPT下载',{'模板标识': outlineToPpt.docId});//触发诸葛埋点事件
            convert.exportConvertDoc(outlineToPpt.docId, function(res){
                if (res.type == "document_export_result") {
                    $.loading("close");
                    $('#btn-download-ppt').removeClass('mind-disable');
                    location.href = res.data.file_url;
                    if(window.top !== window.self){
                       Util.localChange({type: 'closedlg',name: "dlgppt", url: res.data.file_url});
                    }
                    con.dialog("close");
                    setTimeout(function () {
                        localStorage.removeItem("po_local_change_edit");
                    }, 3000)
                }
            })
        });
		 //在线编辑
		$('#btn-edit-ppt').off('click').on('click', function(e){
		    //下载PPT
            // zhuge.track('极墨智能PPT在线编辑',{'模板标识': outlineToPpt.docId});//触发诸葛埋点事件
			var editUrl = convert.getConvertEditUrl({id : outlineToPpt.docId})
			window.open(editUrl);
		});
        //取消下载
        $("#btn-download-ppt-cancel").off('click').on("click", function(){
            var con = $(".mind-downloadPPT-dlg");
            con.dialog("close");
        });
    },
    renderPptTab: function (data) {
        var pptTypeTabHtml = "", themeListHtml = "";
        for (var i = 0; i < data.length; i++) {
            var dataItem = data[i];
            var topRecs = dataItem.top_rec ? dataItem.top_rec : dataItem.top_recs.join(',')
            pptTypeTabHtml += '<li class="' + (dataItem.content ? "" : "active") + '" tit="' + dataItem.content + '" recs = "' + topRecs + '">' + (dataItem.content ? dataItem.content : "全部") + '</li>'
            themeListHtml += '<ul class="ppt-theme-img-list"></ul>'
            $('.ppt-theme-img-box').html(themeListHtml)
        }
        $('.mind-downloadPPT-dlg .ppt-tag-list-container').html(pptTypeTabHtml);
        $('.mind-downloadPPT-dlg .ppt-tag-list-container li').eq(0).trigger('click');

    },
    renderStylembs: function (index,data,styleText){
        var  $themeList = $('.mind-downloadPPT-dlg .ppt-theme-img-list').eq(index);
        if ($themeList.children('li').length > 0) {
            $themeList.css('display','block').html(stylembsHtml).siblings('ul').css('display','none');
            return
        }
        var stylembsHtml = "";
        // if (styleText == '') {
        //     stylembsHtml = '<li class="active" data-stylemb="" class><img src="/assets/images/mind/ppt_blank_template.png"/></li>';
        // }
        for (var i = 0; i < data.length; i++) {
            var dataItem = data[i];
            var stylembObj = {
                tid:dataItem.tid,
                tdx:dataItem.tdx,
                cat:dataItem.cat,
                colorSchemes:dataItem.colorSchemes
            }
            var stylembStr = JSON.stringify(stylembObj);
            stylembsHtml += '<li data-stylemb=' + stylembStr + '>' +
                ' <img src="' + dataItem.thumbUrl + '">' +
                '</li>'
        }
        $themeList.css('display','block').html(stylembsHtml).siblings('ul').css('display','none');
    },
    //生成空白PPT
    outlineConvert: function (OutlineToPptData,convert){
		$('.ppt-theme-preview-box').append('<img class="preview-loading-img" style="width: 100px;margin: auto;display: block;margin-top: 160px;" src="https://xiaohuazhuo.com/board/images/spinner.gif" />');
        convert.outlineConvert(OutlineToPptData, function(res){
        	if(res.type == "error"){
        		var con = $(".mind-downloadPPT-dlg");
        		$.toast({
                    text:"生成PPT失败、请稍后再试.....",
                    type:"error",
                    target:con
                })
        	}else if (res.type == "outline_convert_num") {
				$('.ppt-theme-preview-box .preview-loading-img').remove();
                $('.ppt-theme-preview-list').html('');
                var convertNum = res.data.num;
                for (var i = 0; i < convertNum; i++) {
                    $('.ppt-theme-preview-list').append('<li><img class="loading-img" src="https://xiaohuazhuo.com/board/images/spinner.gif" /></li>')
                }
            }else if (res.type == "outline_thumb") {
                $('.ppt-theme-preview-list li').eq(res.data.index).html('<img src="' + res.data.thumb_url + '"/>')
            }else if (res.type == "outline_doc") {
                $('#btn-download-ppt').removeClass('mind-disable');
				$('#btn-edit-ppt').removeClass('mind-disable');
                outlineToPpt.docId = res.data.doc_id;
            }
        })
    },
    //改变主题风格
    convertChangeStyle: function (themeItem, convert){
        if ($('#btn-download-ppt').hasClass('mind-disable')) {
            return
        }
        convert.convertChangeStyle({doc_id :outlineToPpt.docId, theme_item : themeItem, preview : false}, function(res){
            if (res.type == "outline_convert_num") {
                $('.ppt-theme-preview-list').html('');
                var convertNum = res.data.num;
                for (var i = 0; i < convertNum; i++) {
                    $('.ppt-theme-preview-list').append('<li><img class="loading-img" src="https://xiaohuazhuo.com/board/images/spinner.gif" /></li>')
                }
            }else if (res.type == "outline_thumb") {
                $('.ppt-theme-preview-list li').eq(res.data.index).html('<img src="' + res.data.thumb_url + '"/>')
            }else if (res.type == "outline_doc") {
                $('#btn-download-ppt').removeClass('mind-disable');
                $('#btn-edit-ppt').removeClass('mind-disable');
                outlineToPpt.docId = res.data.doc_id
            }
        })
    },
    //预览PPT缩略图大图
    showThumbBigImg: function(index, listHtml){
        if ($('#btn-download-ppt').hasClass('mind-disable')) {
            return
        }
        var bigImgWrap = '<div class="big-img-wrap" style="position: absolute;z-index: 3;left: 0;right: 0;top:0;bottom: 0;background-color: rgba(0,0,0,0.3);">'
            +'<div class="close-big-img-wrap" style="position: absolute; top: 40px; right: 60px;width: 30px; height: 30px; border-radius:15px;background:rgba(29,33,41,0.5);text-align: center;line-height: 28px;">'
            +'<i style="font-size: 20px;color: #FFFFFF;" class="po-diagraming-icons">&#xe6b9;</i>'
            +'</div>'
            +'<ul class="big-img-box">'
            + listHtml
            +'</ul>'
            +'<div class="left-btn" style="cursor: pointer; position: absolute; left: 25px; top: 50%;margin-top: -40px;text-align: center;line-height: 80px; width: 30px; height: 80px; background:rgba(29,33,41,0.5);border-radius:4px;">'
            +'<i style="font-size: 16px; color: #FFFFFF;" class="po-diagraming-icons">&#xe6cf;</i>'
            +'</div>'
            +'<div class="right-btn" style="cursor: pointer; position: absolute; right: 25px; top: 50%;margin-top: -40px;text-align: center;line-height: 80px; width: 30px; height: 80px; background:rgba(29,33,41,0.5);border-radius:4px;">'
            +'<i style="font-size: 16px; color: #FFFFFF;" class="po-diagraming-icons">&#xe6cd;</i>'
            +'</div>'
            +'</div>'
        var pptCon = $('.mind-downloadPPT-dlg')
        pptCon.append(bigImgWrap);
        var $liDom = $('.mind-downloadPPT-dlg .big-img-box li'),
        len = $liDom.length;
        $liDom.css({
            "width":"800px",
            "margin":"auto",
            "margin-top":"85px",
            "display":"none",
        })
        $liDom.children('img').css({
            "width":"800px",
            "display":"block"
        });
        $liDom.eq(index).css("display", "block");

        $(".mind-downloadPPT-dlg .left-btn").click(function(){
            $liDom.eq(index).css("display", "none");
            index--
            if (index == -1) {
                index = len - 1
            }
            $liDom.eq(index).css("display", "block");
        });
        $(".mind-downloadPPT-dlg .right-btn").click(function(){
            $liDom.eq(index).css("display", "none");
            index++
            if (index == len) {
                index = 0
            }
            $liDom.eq(index).css("display", "block");
        });

        $(".close-big-img-wrap").click(function(){
            $(".big-img-wrap").remove()
        })

    },
    getOutlineToPptData: function (data){
        //数据
    	var topicData = data;
    	if(typeof mind != "undefined"){
    		topicData = mind.util.copy(mind.model.topic );
    	}
        var leftChildren = topicData.leftChildren || [],
        	summaries = topicData.summaries || [];
        topicData.children = topicData.children.concat(leftChildren).concat(summaries);
        function resetData(data) {
            if (data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    //去除富文本HTML标签
                    function deleteHtmlTag(title){
                        var domText = '';
                        var dom = $("<div>" + title + "</div>").appendTo("body");
                        function restNode(nodes){
                            for (var i = 0, len = nodes.length; i < len; i++) {
                                if (nodes[i].nodeName == '#text') { //当节点为文本时把内容和父节点的style取出来放到textArr中
                                    domText += nodes[i].data
                                }
                                restNode(nodes[i].childNodes)
                            }
                        }
                        restNode(dom[0].childNodes)
                        dom.remove();
                        return domText
                    }
                    var cSummaries = data[i].summaries || [];
					var text = deleteHtmlTag(data[i].title)
					var obj = {"type": "outline","text": text, children : data[i].children};
					if (data[i].image) {
						obj.img_url = data[i].image.url;
					}
					data[i] = obj;
					if(cSummaries.length > 0){
						data[i].children = data[i].children.concat(cSummaries)
					}
					resetData(data[i].children)
                }
            }
        }
        resetData(topicData.children)
        topicData = {"outline": {"type": "outline","text": topicData.title,"children":topicData.children}};
        return topicData
        //数据
    }
}
