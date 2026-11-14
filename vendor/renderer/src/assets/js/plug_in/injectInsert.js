/**
 * 思维笔记插入流程图、思维导图
 * 拦截改造
 */
import { ipc1, importClass } from './ipc.js'

async function renderTemplates(that) {
    var type = that.insertType;
    var data = await Util.getTemplate(type)
    var txt = '';
    var fileList = $('.dlg-tab-content[data-type=newfile]').find('.file-list');
    var defaultCategory = (type == "mind" ? "mind_free" : 'flow'),
        emptyFileTip = (type == "mind" ? "空白思维导图" : '空白流程图');
    if (data && data.length > 0) {
        txt += '<div class="chart_item  empty_file"  category="' + defaultCategory + '">' +
            '<a class="item-thumb"><span></span><span></span></a>' +
            '<span class=" empty_file_title chart_title">' + emptyFileTip + '</span></div>';
        data.forEach(function (d, i) {
            txt += `<div class="chart_item "  category="${d.category}" chartid="${d.chartId}">'
                <a class="item-thumb"><img class="thumb-img thumbed"  src="${Util.$getThumbForBgClass(d)}"></a>' 
                <span class="chart_title">${d.title}</span></div>`;
        })
        fileList.html(txt);
    }
    initFileListEvent(this);
}

async function renderMyFiles(data, more, search) {
    const that = this
    var charts = data;
    var fileList = $('.dlg-tab-content[data-type=myfile]').find('.file-list');

    var htmls = [],
        dates = {
            today: [],
            yestoday: [],
            lastWeek: [],
            lastMongth: [],
            longago: []
        };
    if (search == "search") {
        fileList = $('.dlg-tab-content[data-type=searchfile]').find('.file-list');
    }
    if (charts.length == 0 && more != 'more') {
        fileList.html("<div class='search-none'><img src='" + staticBasePath + "/assets/images/icon/empty_file.svg'/>未找到文件</div>");
        return;
    }
    var td = new Date(that.getDate(0)),
        ysd = new Date(that.getDate(-1)),
        weekd = new Date(that.getDate(-7)),
        mongthd = new Date(that.getDate(-30));
    for (var i = 0, len = charts.length; i < len; i++) {
        var chart = charts[i], date = new Date(chart['lastModify']);
        if (date >= td) {
            dates.today.push(chart);
        } else if (date >= ysd) {
            dates.yestoday.push(chart);
        } else if (date >= weekd) {
            dates.lastWeek.push(chart);
        } else if (date >= mongthd) {
            dates.lastMongth.push(chart);
        } else {
            dates.longago.push(chart);
        }
    }
    if (that.view == "list") {
        $.each(dates, function (i, v) {
            if (v.length > 0) {
                $('.list-title').hide()
                if (search != 'search') {
                    var text = (i == "today") ? "今天" : (i == "yestoday") ? "昨天" : (i == "lastWeek") ? "7天内" : (i == "lastMongth") ? "一个月内" : "很早"
                    if (that.myfiles.timeTitle.indexOf(text) < 0) {
                        that.myfiles.timeTitle += text;
                        htmls.push('<div class="file-date-list" ><span>' + text + '</span> <div></div></div>');
                    }

                }
                for (var j = 0; j < v.length; j++) {
                    var c = v[j];
                    var cate = c.category.indexOf('mind') > -1 ? 'mind' : 'flow';
                    var lastTime = that.getLastTime(c.lastModify)
                    var gotoDom = ''
                    var cateIcon = that.getIcons(c.category)
                    if (c.sourceName) {
                        gotoDom = '来自' + c.sourceName + '文件夹'
                    } else {
                        gotoDom = '来自个人文件'
                    }
                    htmls.push('<div class="list-item chart_item"   chartid="' + c.chartId + '"  ><div class="col1">' + cateIcon + '<label>' + c.title + '</label></div>' +
                        '<div class="col2"><span>' + gotoDom + '</span></div><div class="col3"><span>' + lastTime + '</span></div></div>');
                }
            }
        });
    } else {
        $.each(dates, function (i, v) {
            if (v.length > 0) {
                if (search != 'search') {
                    var text = (i == "today") ? "今天" : (i == "yestoday") ? "昨天" : (i == "lastWeek") ? "7天内" : (i == "lastMongth") ? "一个月内" : "很早"
                    if (that.myfiles.timeTitle.indexOf(text) < 0) {
                        that.myfiles.timeTitle += text;
                        htmls.push('<div class="file-date"><span>' + text + '</span></div>');
                    }
                }
                for (var j = 0; j < v.length; j++) {
                    var c = v[j];
                    var cate = c.category.indexOf('mind') > -1 ? 'mind' : 'flow';
                    var cateIcon = '&#xe623;';
                    if (cate == 'flow') {
                        cateIcon = '&#xe610;';
                    }
                    htmls.push('<div class="chart_item " category="' + c.category + '" chartid="' + c.chartId + '">' +
                        '<a class="item-thumb"><img class="thumb-img thumbed"  src="' + window.host + '/chart_image/thumb/' + c.thumbnail + '.png"></a>' +
                        '<span class="chart_title"><span class="ol-icons ' + cate + '">' + cateIcon + '</span>' + c.title + '</span></div>');
                }
            }
        });
    }
    if (more == 'more') {
        fileList.append(htmls.join(""));
    } else {
        fileList.html(htmls.join(""));
    }

}

// function getLocalHistory(category) {
//     return new Promise((resolve) => {
//         ipc.invoke('loadFileB64',
//             {
//                 type: "cache",
//                 path: "history/cache.json"
//             }
//         ).then((res) => {
//             const data = res
//             if (data.code == 201) {
//                 resolve([]);
//             } else {
//                 const DataList = JSON.parse(decodeURIComponent(escape(atob(data.data))));
//                 const result = []
//                 DataList.map(d => {
//                     // 4 云文件bak //5未保存bak //2 本地文件
//                     if ((d.type != 5 && d.type != 4) ||
//                         (d.type == 4 && d.owner && d.owner.userId == window.localStorage.getItem('processon_userKey'))) {

//                         if (d.chartId.length <= 13) {
//                             if (category) {
//                                 if (category == 'mind_free' && ['mind_org', 'fishbone', 'mind_tree', 'timeline', 'mind_right', 'mind'].includes(d.category)) {
//                                     result.push(d)
//                                 } else {
//                                     if (d.category == category) {
//                                         result.push(d)
//                                     }
//                                 }
//                             } else {
//                                 result.push(d)
//                             }
//                         }
//                     }
//                 });
//                 resolve(result);
//             }

//         })
//     })

// }

async function queryUserFile(cate, more) {
    var that = window.outlineObj.oplugins.mindflow;
    var _this = window.outlineObj.oplugins.mindflow.server
    if (_this.queryFileing) {
        return
    }
    _this.queryFileing = true;
    $.loadingball({ con: $('.files-wrapper') });
    var params = {
        category: cate,
        page: 1,
        pageSize: 30,
        category: that.insertType == 'flow' ? 'flow' : 'mind'
    }
    var myfiles = that.myfiles;
    if (more == 'more') {
        params.page = ++myfiles.curPage
    }
    if (myfiles.searchTitle) {
        params.searchTitle = myfiles.searchTitle;
    }

    pcUtil.ajax({
        url: '/api/personal/folder/user/files',
        data: params,
        timeout: 1000 * 60, //超时时间设置，单位毫秒
        type: 'get',
        success: async function (res) {
            // const localHistoryData = await getLocalHistory(params.category)
            // console.log("1", localHistoryData)
            _this.queryFileing = false;
            const elements = res.data.pageInfo.elements || [];
            console.log("2", elements)
            $.loadingball({ close: true });
            if (myfiles.searchTitle) {
                that.renderMyFiles(elements, more, 'search');
            } else {
                myfiles.curPage = res.data.pageInfo.curPage;
                myfiles.totalPage = res.data.pageInfo.pageCount;
                that.renderMyFiles(elements, more);
            }

        }, error: function () {
            _this.queryFileing = false;
            $.loadingball({ close: true });
            $.showTip("请求失败", 2000, 'top');
        }, complete: function (XMLHttpRequest, status) { //请求完成后最终执行参数
            _this.queryFileing = false;
            $.loadingball({ close: true });
            if (status == 'timeout') { //超时,status还有success,error等值的情况
                $.showTip("请求超时，请重新尝试", 2000, 'top');
            }
        }
    });
}
// 页面事件
function initListPageEvent() {
    var _this = this,
        mindFlowDlg = $('#mind-flow-dlg'),
        listWrapper = $(mindFlowDlg.find('.files-wrapper')[1]);
    var wraperH = listWrapper.outerHeight();
    //滚动加载更多
    listWrapper.off('scroll.more').on('scroll.more', function (e) {
        e.stopPropagation();
        var wraperScrollTop = listWrapper.scrollTop(),
            listDom = listWrapper.children('.myfile-list')[0],
            listH = $(listDom).outerHeight(),
            hasMore = '';
        // hasMore  // querying  // 离底部小于50px
        if (_this.pageType == 'myfile') {
            hasMore = (_this.myfiles.curPage >= _this.myfiles.totalPage ? false : true);
        } else {
            hasMore = (_this.orgfiles.curPage >= _this.orgfiles.totalPage ? false : true);
        }
        if (hasMore && !_this.server.queryFileing && wraperScrollTop + wraperH + 60 > listH) {
            if (_this.pageType == 'myfile') {
                _this.server.queryUserFile(_this.insertType, 'more');
            } else {
                _this.server.queryOrgFile(_this.insertType, 'more');
            }
        }
    });
}
// 点击事件
function initFileListEvent() {
    var _this = window.outlineObj.oplugins.mindflow, mindFlowDlg = $('#mind-flow-dlg');
    var templateList = mindFlowDlg.find('.template-list'), myfileList = mindFlowDlg.find('.myfile-list');

    // 左侧模板点击
    templateList.off('mousedown.new').on('mousedown.new', '.chart_item', function (e) {
        e.stopPropagation();
        if (!pcUtil.isOnline()) {
            window.toast_.offLine()
        }
        else {
            var $this = $(this),
                category = $this.attr('category'),
                templateId = '',
                chartTitle = '未命名文件';
            //空白文件
            if (!$this.hasClass('empty_file')) {
                //非空白模板
                templateId = $this.attr('chartid'),
                    chartTitle = $this.find('.chart_title').text();
            }

            var params = {
                category: category,
                title: chartTitle
            }
            if (templateId) {
                params.templateId = templateId;
            }
            if (window.orgId) {
                params.org = window.orgId;
            }
            if (window.teamId) {
                params.team = teamId;
            }

            // mock
            // const data = {
            //     chart: {
            //         chartId: '66c54e412c54350c6d5b9975'
            //     }
            // }
            // const chartType = Util.getChartType(category)
            // let obj = { url: chartType.url + `?chartId=${data.chart.chartId}&token=token&dbId=dbId`, title: chartTitle }
            // $('#mind-flow-dlg').dialog('close');
            // ipc.sendToHost('showInsertEditor', obj.url, 'flow', true)
            pcUtil.ajax({
                url: `/api/personal/diagraming/${window.chartObj.folderId || "root"}/new`,
                data: params,
                timeout: 1000 * 60, //超时时间设置，单位毫秒
                type: 'post',
                noJump: true,
                success: function (res) {
                    const data = res.data;
                    if (!data) {
                        new Toast({ type: 'warning', msg: res.msg || '数据异常' })
                        return
                    }
                    var targetId = _this.targetId
                    const chartType = Util.getChartType(category)

                    const chartId = data.chart.id || data.chart.chartId
                    if (!chartId) {
                        new Toast({ type: 'warning', msg: '数据异常' })
                        return
                    }
                    let obj = { url: chartType.url + `?chartId=${chartId}&token=token&dbId=dbId&insert=true`, title: chartTitle }
                    //如果正在生成SVG文件, 提示稍后重试
                    if ($('.node-image.loading').length > 0) {
                        $.showTip('正在更新编辑后的图片，请3s后在尝试', 2000, 'top');
                        return
                    }
                    // index 创建webview

                    const type = category.indexOf('mind') > -1 ? 'mind' : 'flow'

                    let targetNode = outlineObj.model.getNodeById(targetId),
                        idx = outlineObj.model.getNodeIndex(targetId, targetNode.parent),
                        part = null;

                    if (targetNode.parent == 'root') {
                        part = outlineObj.model.getRootSubPart(targetId);
                    }

                    var typeData = {
                        // image:{
                        //     url: e.imgURL.replace('https://', 'http://')
                        // }
                    };

                    typeData[type] = {
                        chartid: data.chart.chartId,
                        lastModify: data.chart.lastModify
                    }
                    var nodeId = outlineObj.controller.add(idx, targetNode.parent, part, type, typeData);
                    _this.targetId = outlineObj.util.currentId = nodeId;

                    $('#mind-flow-dlg').dialog('close');
                    ipc.sendToHost('showInsertEditor', obj.url, type)

                }, error: function (data) {
                    $.showTip("创建文件失败", 2000, 'top');
                }
            });
        }
    });

    //右侧文件点击
    myfileList.off('mousedown.insert').on('mousedown.insert', '.chart_item', function (e) {
        e.stopPropagation();
        if (!pcUtil.isOnline()) {
            window.toast_.offLine()
        }
        else {
            var $this = $(this), chartId = $this.attr('chartid')
            const chartType = Util.getChartType(_this.insertType)
            let obj = { url: chartType.url + `?chartId=${chartId}&token=token&dbId=dbId&insert=true`, title: '' }
            $('#mind-flow-dlg').dialog('close');
            var type = _this.insertType;
            var targetId = _this.targetId,
                targetNode = outlineObj.model.getNodeById(targetId),
                idx = outlineObj.model.getNodeIndex(targetId, targetNode.parent),
                part = null;
            if (targetNode.parent == 'root') {
                part = outlineObj.model.getRootSubPart(targetId);
            }
            var typeData = {
                image: {
                    url: host + '/chart_image/id/' + chartId + '.png'
                }
            };
            typeData[type] = {
                chartid: chartId
            }
            var nodeId = outlineObj.controller.add(idx, targetNode.parent, part, type, typeData);
            //关闭插入弹框
            _this.targetId = outlineObj.util.currentId = nodeId;
            _this.showUpdateSVGLoading(chartId, nodeId);
            $('#mind-flow-dlg').dialog('close');
            ipc.sendToHost('showInsertEditor', obj.url, _this.insertType, false)
            // 打开隐藏的， 然后发送截图 message
            // 返回 然后关闭
        }
    });
}

function updateFileImage(chartId, type, nodeId, updateType) {
    // 刷新会经历这里方法
    // 重新走 webview 逻辑
    var _this = this;
    if (!chartId) {
        return
    }
    this.targetId = outlineObj.util.currentId = nodeId;
    _this.showUpdateSVGLoading(chartId, nodeId);
    const chartType = Util.getChartType(type)
    let obj = { url: chartType.url + `?chartId=${chartId}&token=token&dbId=dbId&insert=true`, title: '' }
    ipc.sendToHost('showInsertEditor', obj.url, type, false)
}

function queryTemplate() {
    const _this = window.outlineObj.oplugins.mindflow
    renderTemplates(_this);
}

function initTabEvent() {
    var _this = window.outlineObj.oplugins.mindflow
    var mindFlowDlg = $('#mind-flow-dlg');
    if (window.isInTeam != 'true') {
        $('.org-type-nav').hide();
        $('.ol-new-info').hide();
    }
    mindFlowDlg.find('.pop-nav').off('mousedown').on('mousedown', '.nav-i', function (e) {
        e.stopPropagation();
        var $this = $(this), type = $this.attr('type'),
            curTab = mindFlowDlg.find('.dlg-tab-content[data-type=' + type + ']');
        mindFlowDlg.find('.nav-i').removeClass('active');
        mindFlowDlg.find('.dlg-tab-content').removeClass('active');
        $this.addClass('active');
        curTab.addClass('active');
        mindFlowDlg.find('.dlg-tab-header').hide();
        $("#myfile_search_input").val("");
        $('.del-icon').hide();
        $('#file_show_type').removeClass('disable')
        $('.tab-header-text').text('最近文件')
        _this.myfiles.searchTitle = '';
        _this.orgfiles.searchTitle = '';
        _this.pageType = type;
        $('.files-wrapper').css('height', '601px')
        if (type == 'myfile' || type == 'orgfile') {
            mindFlowDlg.find('.dlg-tab-header').show();
            $('.files-wrapper').css('height', '545px')
        }
        if (type == 'myfile') {
            if (curTab.find('.chart_item').length == 0) {
                queryUserFile(_this.insertType);
            }
            initListPageEvent();
            _this.searchEvent();
        }
        if (type == 'orgfile') {
            if (curTab.find('.chart_item').length == 0) {
                queryOrgFile(_this.insertType);
            }
            initListPageEvent();
            _this.searchEvent();
        }
        if (type == 'newfile' && curTab.find('.chart_item').length == 0) {
            queryTemplate();
        }
    });

}

function popInsert(type) {
    this.targetId = window.outlineObj.util.currentId;
    this.myfiles.searchTitle = '';
    if (!type) {
        $.showTip("请选择插入类型", 2000, 'top');
        return
    }
    var oldInsertType = this.insertType;
    this.insertType = type;
    var mindFlowDlg = $('#mind-flow-dlg');
    if (oldInsertType != type) {
        if (mindFlowDlg.length > 0) {
            mindFlowDlg.remove();
        }
    }
    var mindFlowDlg = $('#mind-flow-dlg');
    if (mindFlowDlg.length == 0) {
        mindFlowDlg = this.renderDlg();
        initTabEvent();
        mindFlowDlg.find('.nav-i').eq(0).trigger('mousedown');
    } else {
        $('.pop-nav .nav-i[type=myfile]').text('我的' + this.typeForChinese[type]);
        $('#myfile_search_input').attr('placeholder', '搜索个人文件中的' + this.typeForChinese[type]);
    }
    mindFlowDlg.dialog();
    //关闭操作栏
    // render.hideMenu();
}

export async function handleInject(outlineObj) {
    console.log(outlineObj)
    outlineObj.controller.menuClick.insert = (tp) => {        
        const that = outlineObj.controller.menuClick
        if (tp == 'image') {
            that.image();
        }
        if (tp == 'flow' || tp == 'mind') {
            if (!pcUtil.isOnline()) {
                window.toast_.offLine()
            }
            else {
                popInsert.call(window.outlineObj.oplugins.mindflow, tp);
            }
        }
    }
    $('#mind-flow-dlg').remove()
    const _this = window.outlineObj.oplugins.mindflow
    _this.renderTemplates = renderTemplates.bind(_this)
    _this.initTabEvent = initTabEvent
    _this.server.queryUserFile = queryUserFile.bind(_this)
    _this.server.queryTemplate = queryTemplate
    _this.popInsert = popInsert.bind(_this)
    _this.renderMyFiles = renderMyFiles.bind(_this)
    _this.renderMyFiles = renderMyFiles.bind(_this)
    _this.initListPageEvent = initListPageEvent.bind(_this)
    _this.initFileListEvent = initFileListEvent.bind(_this)
    _this.updateFileImage = updateFileImage.bind(_this)
    // _this.templateConfig =  {
    //     mind: [
    //         { "id": "5f17e7597621315c2b23c637", "title": "我自己的", "definitionId": "definitionId", "tags": ["思维导图", "通用模版", "风格样式"], "description": "思维导图模版", "createTime": "2019-06-26 17:20:14", "publishTime": "2020-02-17 17:41:32", "owner": null, "cloneCount": 931, "viewCount": 8012, "likeCount": 12, "publicClonePrice": 5.0, "category": "mind_free", "thumbnail": "5f17e7597621315c2b23c635", "thumbUrl": null, "status": "public", "lastModify": "2019-06-26 17:21:05", "wpsUseCount": 372558, "wpsViewCount": 1330778, "wpsStatus": "visible", "wpsStatusTime": "2020-02-17 17:41:40", "wpsPrice": 5.0, "lastUseTime": "2020-11-23 11:09:04", "themeTags": ["风格样式"], "score": 0.0, "ratedLevel1Count": 0, "ratedLevel2Count": 0, "ratedLevel3Count": 0, "ratedLevel4Count": 0, "ratedLevel5Count": 0, "rateAvg": 0.0, "schema": null, "chartId": "5f17e7597621315c2b23c637", "deleted": false }
    //     ]
    // }

    Util.changeStyle()

    //图片编辑
    $(document).off("mousedown.imgedit").on("mousedown.imgedit", '.img-op-edit', function (e) {
        e.stopImmediatePropagation();
        console.log(123)
        var nodeDom = $(this).parents('.node-element'),
            id = nodeDom.attr('id'),
            node = outlineObj.model.getNodeById(id)
        _this.targetId = id;

        if ((node.type && (node.type == 'flow' || node.type == 'mind'))) {
            var chartId = nodeDom.data('chartid'), type = nodeDom.attr('type');
            // oplugins.mindflow.popEditor(chatId, type, id);
            const chartType = Util.getChartType(type)
            let obj = { url: chartType.url + `?chartId=${chartId}&token=token&dbId=dbId&insert=true`, title: '' }
            ipc.sendToHost('showInsertEditor', obj.url, node.type, true)

            //poCollect("功能触发", {"功能名称": "编辑流程图、脑图", "触发位置": "图片右侧编辑按钮", "类型": type, "当前页面":"outline-editor"});
            return
        }
        $("#mind_hover_tip").hide();
    });

}


var Util = {
    getTemplate: function (type) {
        return new Promise((resolve, reject) => {
            pcUtil.ajax({
                url: '/api/personal/search/official',
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({ category: type, keyword: '', pagesize: 300 }),
                success: function (res) {
                    if (res.code = "200") {
                        const data = res.data.rows.filter(chart => {
                            const isVip = !chart.ownerId && !chart.owner && chart.publicClonePrice > 0
                            const paytemplate = chart.publicClonePrice != null && chart.publicClonePrice > 0
                            if (!isVip && !paytemplate) return chart
                        })
                        resolve(data)
                        return
                    }
                    resolve([])
                },
                error: function () {

                }
            })
        })

    },
    $getThumbForBgClass(chart) {
        let thumbnailUrl = "https://po-img.processon.com"

        let _category = typeof category === 'undefined' ? chart.category : category

        let imgsrc = thumbnailUrl + "/chart_image/template/thumb/" + chart.thumbnail + ".png?cid=" + chart.chartId;
        if (_category.indexOf("board") >= 0) {
            imgsrc = chart.thumbUrl || "";
        }
        return imgsrc
    },
    changeStyle() {
        const styles = `
        <style>
        .thumb-img{
            height:160px;
            width:auto !important;
        }
        </style>`
        $('body').append(styles);
    },
    getChartType: function (category) {
        let chartType = {};
        const baseUrl = window.location.href.startsWith('http://localhost:5173/') ? 'http://localhost:5173/src' : `file:///${webRoot}`

        if (category.indexOf("mind") >= 0 || ['fishbone', 'timeline', 'ishikawa'].includes(category)) chartType = { url: "/v5_editor/source/compile/mindmap/index.html" };
        else if (category == "outline") chartType = { url: "/v5_editor/source/compile/outline/index.html" };
        else chartType = { url: "/v5_editor/source/compile/diagrams/index.html" };
        chartType.url = baseUrl + chartType.url
        return chartType;
    }
}


$(function () {
    let checkObj = setInterval(() => {
        console.log('outlineObj',window.outlineObj)
        if (typeof window.outlineObj !== 'undefined') {            
            clearInterval(checkObj)
            handleInject(outlineObj)
        }
        if(window.fileType!='outline'){
            clearInterval(checkObj)
        }
    }, 1000)

})

/**
 * 在流程图和思维导图中的插入思维笔记的逻辑
 * 这段 js 是在另一个位面
 */
window.initInsertBtn = function (flag = true) {
    console.log("window.initInsertBtn--------------------------------")
    if (!flag) {

        setTimeout(() => {
            window.PoEditorClient.exportFile('svg', [], function (content) {
                var formData = new FormData();
                formData.append('svg', content);
                pcUtil.ajax({
                    url:'/api/personal/user_image/upload_svg',
                    data:formData,
                        processData: false,
                        contentType: false,
                    success: function (e) {
                        ipc.sendToHost('returnSVG', { url: e.data.url, chartId: window.chartId })
                    }, error: function () {
                        // window.parent.postMessage(JSON.stringify({'eventName': 'returnSVG','data': 'error', 'chartId': postChartId}), '*');
    
                    }
                })
            })
        }, 500);

        return
    }
    // 生成一个插入按钮
    const dialogWin = $('body')
    var closeBtn = dialogWin.find(".insertIcon");
    if (closeBtn.length == 0) {
        closeBtn = $(`<div  style=" position:fixed;
                        cursor: pointer;
                        position: absolute;
                        right: 50px;
                        top: 11px;
                        color:#999;
                        z-index: 10;">
                        <svg t="1729763426795" class="icon" viewBox="0 0 1025 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="32668" width="16" height="16"><path d="M193.23733333 183.18506667a25.6 25.6 0 0 1 36.1984 0l613.4784 613.5296a25.6 25.6 0 1 1-36.1984 36.1984L193.23733333 219.43466667a25.6 25.6 0 0 1 0-36.1984z" fill="#999999" p-id="32669"></path><path d="M842.70933333 180.21546667a25.6 25.6 0 0 1 0 36.1984L229.23093333 829.94346667a25.6 25.6 0 0 1-36.2496-36.1984L806.51093333 180.21546667a25.6 25.6 0 0 1 36.1984 0z" fill="#999999" p-id="32670"></path></svg> 
                    </div>`);
        closeBtn.appendTo(dialogWin);
    }
    // 点击按钮 
    closeBtn.off('click').on("click", async function () {
        window.PoEditorClient.exportFile('svg', [], function (content) {
            var formData = new FormData();
            formData.append('svg', content);
            pcUtil.ajax({
                url:'/api/personal/user_image/upload_svg',
                data:formData,
                    processData: false,
                    contentType: false,
                success: function (e) {
                    ipc.sendToHost('returnSVG', { url: e.data.url, chartId: window.chartId })
                }, error: function () {
                    // window.parent.postMessage(JSON.stringify({'eventName': 'returnSVG','data': 'error', 'chartId': postChartId}), '*');

                }
            })
        })

    })

    // 监听postmessage
}

ipc.on('returnSvgCallback', (e, url) => {
    if(!window.isMyFile){
        window.self.postMessage(JSON.stringify({ 'eventName': 'returnSVG', 'data': url, 'chartId': window.chartId }), '*');
    }
    else {
        window.fetch(url, {
            method: 'GET', headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        }).then((res) => {
            const newId = importClass.newId()
            const name = `${newId}.svg`
            const path = `back/${window.chartId}/${name}`;
            res.arrayBuffer().then(data => {
                ipc1.sendSync('saveFileB64', { type: 'cache', path, data: importClass.arrayBufferToBase64(data) }).then((imgRes) => {
                    ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${window.chartId}/attachment.json` }).then(res => {
                        const imagesUrls = res == '' ? [] : JSON.parse(res)
                        imagesUrls.push({ name: `${newId}.png`, path: `/${newId}?`, url: `file:///${imgRes}` })
                        ipc1.sendSync('saveFileB64',
                            {
                                type: 'cache', path: `back/${window.chartId}/attachment.json`,
                                data: importClass.stringToBase64String(JSON.stringify(imagesUrls)),
                                suffix: ''
                            }).then((res) => {
                                window.self.postMessage(JSON.stringify({ 'eventName': 'returnSVG', 'data': `file:///${imgRes}`, 'chartId': window.chartId }), '*');
                            })
                    })
                })
            })
        })
    }
})