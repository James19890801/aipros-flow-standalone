

export const injectCommon = {
    currentListData: [],
    callSearchTimor: null, // @功能搜索定时
    currentTabType: 0,
    utils: {
        pobToast: function (opt, name) {
            //name 为空时关闭所有空name的toast； name存在时关闭指定toast，name为all时关闭全部toast。
            if (typeof opt != "object") {
                if (typeof opt == "string") {
                    if (opt == "close") {
                        if (name) {
                            if (name == "all") {
                                $(".pob_toast").remove();
                            } else {
                                $(".pob_toast[name=" + name + "]").remove();
                            }
                        } else {
                            $(".pob_toast[name=name]").remove();
                        }
                    }
                }
                return
            }
            let timer = null
            var opt = $.extend({
                type: "success",
                text: "操作成功",
                delay: 5000,
                name: "name",
                autoClose: true,
                zIndex: 9999,
                target: $("body"),
                isHoverTimeOut: false
            }, opt);
            // if($toast.length > 0){
            //     $toast.remove()
            // };
            let icon = "";
            if (opt.icon) {
                icon = "<span class='po-diagraming-icons'>" + opt.icon + "</span>"
            } else {
                if (opt.type == "success") {
                    icon = "<span class='po-diagraming-icons'>&#xe976;</span>"
                } else if (opt.type == "error") {
                    icon = "<span class='po-diagraming-icons'>&#xe995;</span>"
                } else if (opt.type == "warning") {
                    icon = "<span class='po-diagraming-icons'>&#xe977;</span>"
                } else if (opt.type == "secondary") {
                    icon = "<span class='po-diagraming-icons'>&#xe996;</span>"
                } else if (opt.type == "cancelsecondary") {
                    icon = "<span class='po-diagraming-icons'>&#xe996;</span>"
                } else if (opt.type == "notify") {
                    icon = "<span class='po-diagraming-icons'>&#xe748;</span>"
                }
            }
            let leng = $('.pob_toast').length
            let top = 0
            let opacity = 0
            // 叠加展示距离处理
            if (leng > 0) {
                let lastToast = $('.pob_toast').eq(leng - 1)
                top = parseInt(parseInt(lastToast.attr('top')) + lastToast.outerHeight())
                opacity = 0
                opt.zIndex -= 1
            }
            let $toast = $("<div style='opacity:" + opacity + ";z-index:" + opt.zIndex + ";top:" + top + "px' name=" + opt.name + " class='pob_toast po-toast-" + opt.type + "'>" + icon + '<span class="wrap_text">' + opt.text + "</span></div>");
            $toast.appendTo(opt.target);
            // 据顶部距离
            if (opt.marginTop) {
                $toast.css("margin-top", opt.marginTop + "px");
            }
            // 是否自动关闭
            if (opt.autoClose) {
                setTimer()
            }
            if (opt.isHoverTimeOut) {
                // 划过离开触发
                $toast.on('mouseenter', function () {
                    clearTimeout(timer)
                    timer = null;
                }).on('mouseleave', function () {
                    if (typeof opt.onClose == "function") {
                        return
                    }
                    setTimer()
                })
            }
            if (leng > 0) {
                $toast.attr('top', top + 16)
                $toast.animate({
                    top: top + 16 + 'px',
                    opacity: 1,
                    zIndex: opt.zIndex - leng
                })
            } else {
                $toast.attr('top', '16')
                $toast.animate({
                    top: '16px',
                    opacity: 1,
                    zIndex: opt.zIndex + 1
                })
            }
            // 设置角色
            if (opt.showSetRole) {
                let showSetRole = $("<div class='set_role' role='editor'>编辑者</div>").appendTo($toast);
                showSetRole.off("mousedown").on("mousedown", function (e) {
                    $(document).off("mousedown.showSetRole").on("mousedown.showSetRole", function (e) {
                        //页面下拉背景色屏蔽
                        $('.set_role').removeClass('active');
                        $('.role_lists').hide();
                    });
                    if ($(this).hasClass('active')) {
                        return
                    }
                    $('.set_role').removeClass('active');
                    $('.set_role .role_lists').remove()
                    $(this).addClass('active');
                    let roleClone = $('<ul class="role_lists" style="display: none;"> <li class="active" role="editor">编辑者</li> <li role="viewer">查看者</li> </ul>')
                    roleClone.appendTo(showSetRole)
                    roleClone.find('li[role=' + $(this).attr("role") + ']').addClass('active').siblings().removeClass('active');
                    roleClone.css({
                        display: 'block'
                    })
                    roleClone.find('li').on('mousedown', function () {
                        $(this).addClass('active').siblings().removeClass('active');
                        $(this).parents('.set_role').removeClass('active').text($(this).text()).attr('role', $(this).attr('role'));
                        $('.role_lists').hide();
                        setTimer()
                        return false
                    })
                    return false
                })
            }
            // 取消授权
            if (opt.cancelEmpower) {
                let cancelEmpower = $("<div style='margin-right:5px;' class='cancel_empower'>撤回</div>").appendTo($toast);
                cancelEmpower.off("click").on("click", function (e) {
                    typeof opt.activeColseCallBack == 'function' && opt.activeColseCallBack($toast);
                    $toast.remove()
                    injectCommon.utils.pobToast({
                        text: "已取消授权，被@用户将不会收到消息提醒",
                        type: "warning"
                    })
                })
            }
            // 撤销提醒
            if (opt.recallReminder) {
                $("<div>并且提醒对方</div>").appendTo($toast);
            }

            if (opt.showCancle) {
                let recallReminder = $("<div class='cancel_empower'>撤回</div>").appendTo($toast);
                recallReminder.off("click").on("click", function (e) {
                    typeof opt.activeColseCallBack == 'function' && opt.activeColseCallBack($toast);
                    $toast.remove()
                    injectCommon.utils.pobToast({
                        text: "已取消",
                        type: "cancelsecondary"
                    })
                })
            }

            // 通知
            if (opt.notify) {
                let notify = $("<div class='look_notify'>查看</div>").appendTo($toast);
                notify.off("click").on("click", function (e) {
                    $toast.remove()
                    // 定位@节点
                    PoEditorClient.posMentionTarget({ id: opt.notifyId })
                })
            }
            // 带关闭按钮展示
            if (typeof opt.onClose == "function") {
                var closeBtn = $("<div class='po-diagraming-icons po-close-btn'>&#xe6b9;</div>").appendTo($toast);
                $toast.addClass("po-toast-close");
                closeBtn.off("click").on("click", function (e) {
                    $toast.remove();
                    opt.onClose();
                })
            }
            // 设置定时器关闭
            function setTimer() {
                timer = setTimeout(function () {
                    clearTimeout(timer);
                    typeof opt.autoColseCallBack == 'function' && opt.autoColseCallBack($toast);
                    toastRemove($toast);
                }, opt.delay);
            }
            // 删除提示
            function toastRemove(that) {
                // 循环提示当前提示删除 当前提示下面提示上移
                let thisHei = 0
                $('.pob_toast').each(function () {
                    let top = $(this).attr('top');
                    if (that.index() == $(this).index()) {
                        thisHei = $(this).outerHeight() + 16
                        $(this).attr('top', top - thisHei)
                        $(this).animate({
                            top: top - thisHei + 'px',
                            opacity: 0
                        }, function () {
                            that.remove()
                        })
                    } else {
                        if ($(this).index() > that.index()) {
                            $(this).attr('top', top - thisHei)
                            $(this).animate({
                                top: top - thisHei + 'px'
                            })
                        }
                    }
                })
            }
        },
    },
    getUrlParams: function (name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) {
            return unescape(r[2]);
        }
        return null;
    },
    getCookies: function (c_name) {
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
    },
    setCookies: function (c_name, value, expiredays) {
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + expiredays);
        document.cookie = c_name + "=" + escape(value) + ((expiredays == null) ? "" : ";path=/;expires=" + exdate.toGMTString());
    },
    createDom: function (str) {
        // 创建一个临时的容器元素
        var tempContainer = document.createElement('div');
        // 将 HTML 字符串赋值给容器元素的 innerHTML 属性
        tempContainer.innerHTML = str;
        // 获取生成的 DOM 元素
        var generatedElement = tempContainer.firstElementChild;
        return generatedElement;
    },

    /*获取协作信息*/
    getCollaboration: function (id, cb) {
        pcUtil.ajax({
            url: '/api/personal/collaboration/join_link/' + id,
            noToken: true,
            cache: false,
            type: "GET",
            success: function (data) {
                cb(data.shareCollaboration.chartId);
            },
            error: function () {

            }
        })

    },


    // 记录团队版最近访问
    addRecord: function (chartId, cb) {
        var token = Util.getUrlParams("token") || Util.getCookies("token");
        var platform = Util.getCookies("po-last-platform");
        if (!chartId || !token) {
            return;
        }
        if (platform && platform !== 'personal') {
            pcUtil.ajax({
                url: "/api/org/chart/record/add",
                type: "post",
                data: {
                    chartId: chartId
                },
                noToken: true,
                isErr: true,
                function(res) {
                    cb(res);
                }
            })
        }
    },
    //判断是手机端还是pc端
    isMobile: function () {
        if (window.navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)) {
            return true; // 移动端
        } else {
            return false; // PC端
        }
    },
    //判断是否是手机
    isPhone: function () {
        if (window.navigator.userAgent.match(/Android|iPhone|SymbianOS|Windows\sPhone/i)) {
            return true; // 手机
        } else {
            return false; // pad或PC端
        }
    },
    // 校验是否是微信
    isWeiXin: function () {
        var ua = window.navigator.userAgent.toLowerCase();
        if (ua.match(/MicroMessenger/i) == 'micromessenger') {
            return true;
        } else {
            return false;
        }
    },


    //替代特殊符号为空
    replaceSpecialCharsWithSpace(str) {
        return str.replace(/[^\w\s]/g, '');
    },
    getRandomChartId(num) {
        var random = Math.floor((Math.random() + Math.floor(Math.random() * 9 + 1)) * Math.pow(10, num - 1));
        return random + new Date().getTime();
    },
    /**
     * @description 获取最近联系人
     * @param {content} 输入框内容
     * @return {Object} array
     */
    getCollaborationRecent: ({ content = '' }) => {
        return new Promise((resolve) => {
            pcUtil.ajax({
                url: '/api/personal/collaboration_recent/list',
                cache: false,
                data: { content },
                type: "GET",
                success: function (data) {
                    resolve(data.data)
                },
                error: function () {

                }
            })
        })

    },
    /**
     * @description 获取最近打开文档
     * @param {content} 输入框内容
     * @return {Object} array
     */
    getRecentChart: ({ pageSize = '' }) => {
        return new Promise((resolve) => {
            pcUtil.ajax({
                url: '/api/personal/folder/history_files',
                cache: false,
                data: { pageSize: pageSize },
                type: "GET",
                success: function (data) {
                    resolve(data.data)
                },
                error: function () {

                }
            })
        })
    },
    /**
     * @description 搜索最近文档打开
     * @param {content} 输入框内容
     * @return {Object} array
     * all:全部，chart：文件，find：查找
     */
    getSearchRecentChart: (title, type) => {
        return new Promise((resolve) => {
            pcUtil.ajax({
                url: '/api/personal/folder/at/chart',
                cache: false,
                data: JSON.stringify({ title: title, type: type }),
                type: "post",
                contentType: "application/json",
                success: function (data) {
                    resolve(data.data)
                },
                error: function () {

                }
            })
        })
    },
    // @功能选择最近联系人加入到协作中
    choosePeople: function (data, fn) {
        let { id, role, remind, targetId } = data
        let userIds = id.join(',')
        // 是否在协作中？不用管 以后做 都提示 todo
        // 17310885720
        // 是否通知？ remind = true | false
        injectCommon.utils.pobToast({
            text: "被@的人将会成为",
            type: "secondary",
            marginTop: '80',
            showSetRole: true,
            autoClose: true,
            showCancle: true,
            recallReminder: remind,
            isHoverTimeOut: true,
            cancelEmpower: false,
            activeColseCallBack: ($toast) => {
                fn(false)
            },
            autoColseCallBack: ($toast) => {
                var nftTpye = localStorage.getItem("remind") ? localStorage.getItem("remind") : "true";
                pcUtil.ajax({
                    url: '/api/personal/collaboration/at/add',
                    cache: false,
                    contentType: "application/json",
                    data: JSON.stringify({
                        chartId: chartObj.chartId,
                        role: role || $toast.find('.set_role').attr('role'),
                        mentUserId: userIds,
                        position: targetId,
                        nftTpye: nftTpye,
                        canvasId: editorGlobal?.poPagination?.pageId,
                    }),
                    type: "POST",
                    success: function () {
                        if (remind) {
                            const userInfo = injectCommon.currentListData.find(i => i.uid === userIds)
                            injectCommon.utils.pobToast({
                                text: userInfo.name + " 将收到消息提醒",
                                type: "secondary",
                                recallReminder: false,
                                autoClose: true,
                                isHoverTimeOut: false
                            })
                            fn(true)
                        } else {
                            fn(false)
                        }
                    },
                    error: function () {
                        fn(false)
                    }
                })


            }
        })
    },
    // 触发@查看功能
    triggerLookTip: function (targetId, userName, userId) {
        // if(poEditoB.calldeObject[userId]?.bool) {
        //     return
        // } else {
        //     poEditoB.calldeObject[userId] = {}
        //     poEditoB.calldeObject[userId].bool = true
        //     poEditoB.calldeObject[userId].timor = setTimeout(() => {
        //         poEditoB.calldeObject[userId].bool = false
        //         clearTimeout(poEditoB.calldeObject[userId].timor);
        //         poEditoB.calldeObject[userId].timor = null
        //     }, 1000 * 60 * 3)
        // }
        // let name = userName
        injectCommon.utils.pobToast({
            text: userName + " 提到了你",
            type: "notify",
            notify: true,
            notifyId: targetId,
            isHoverTimeOut: true
        })
    },

    //base64转Blob
    dataURIToBlob(dataURI, sufix) {
        var binStr = atob(dataURI.split(',')[1]),
            len = binStr.length,
            arr = new Uint8Array(len);

        for (var i = 0; i < len; i++) {
            arr[i] = binStr.charCodeAt(i);
        }
        return new Blob([arr], { type: "image/" + sufix });
    },
    //@功能获取全部数据
    async dealAllData(val, type, tabType, callback) {
        let collaData = [];
        let fileData = [];
        let num = 0;
        let callData = {
            data: [],
            totalPage: 1
        };
        injectCommon.dealAllContacts(0, function (res) {
            num += 1
            collaData = res.data
            if (num == 2) {
                if (injectCommon.currentTabType != tabType) {
                    return
                }
                callData.data = [...collaData, ...fileData]
                callback(callData)
            }
        })
        injectCommon.dealSearchFile(val, type, 0, function (res) {
            num += 1
            fileData = res.data
            if (num == 2) {
                if (injectCommon.currentTabType != tabType) {
                    return
                }
                callData.data = [...collaData, ...fileData]
                callback(callData)
            }
        })
    },
    //@功能获取所有联系人
    async dealAllContacts(tabType, callback) {
        const collaborationList = await debounceFunctions.getCollaborationList({})
        let arr = []
        collaborationList.forEach(item => {
            arr.push({
                uid: item.user.userId,
                icon: `https://user-photo.ks3-cn-beijing.ksyuncs.com/${item.user.userId}.png`,
                name: item.user.fullName,
                phone: item.phone,
                email: item.email,
                type: 0,
            })
        })
        injectCommon.currentListData = arr;
        let callData = {
            data: arr,
            totalPage: 1
        }
        if (injectCommon.currentTabType != tabType) {
            return
        }
        callback(callData)
    },
    //@功能获取全部文档
    async dealAllFiles(pageSize, tabType, callback) {
        const recentChartList = await debounceFunctions.getRecentChartList({ pageSize: pageSize })
        var fileData = [...recentChartList.charts];
        fileData.forEach(item => {
            item.chartType = injectCommon.dealFileType(item)
            item.name = item.title
            item.url = injectCommon.getFileUrl(item)
            item.time = injectCommon.friendlyTime(item.lastModify)
            item.icon = `../../../../assets/images/calledIcon/${item.chartType}_circular.svg`
            item.type = 1
            item.uid = item.chartId
        })
        let callData = {
            data: fileData,
            totalPage: 1
        }
        if (injectCommon.currentTabType != tabType) {
            return
        }
        callback(callData)
    },
    //@搜索全部
    async dealSearchAllData(val, type, tabType, callback) {

        let collaData = [];
        let fileData = [];
        let num = 0;
        let callData = {
            data: [],
            totalPage: 1
        };
        injectCommon.dealSearchPeople(val, tabType, function (res) {
            num += 1
            collaData = res.data
            if (num == 2) {
                if (fileData && fileData.length > 0 && collaData && collaData.length > 0) {
                    callData.data = [...collaData, ...fileData]
                } else {
                    if (fileData && fileData.length > 0) {
                        callData.data = fileData
                    } else if (collaData && collaData.length > 0) {
                        callData.data = collaData
                    }
                    else {
                        callData.data = []
                    }
                }
                if (injectCommon.currentTabType != tabType) {
                    return
                }
                callback(callData)
            }
        })
        injectCommon.dealSearchFile(val, type, tabType, function (res) {
            num += 1
            fileData = res.data
            if (num == 2) {
                if (fileData && fileData.length > 0 && collaData && collaData.length > 0) {
                    callData.data = [...collaData, ...fileData]
                } else {
                    if (fileData && fileData.length > 0) {
                        callData.data = fileData
                    } else if (collaData && collaData.length > 0) {
                        callData.data = collaData
                    }
                    else {
                        callData.data = []
                    }
                }
                if (injectCommon.currentTabType != tabType) {
                    return
                }
                callback(callData)
            }
        })
    },
    //@ 搜索联系人
    async dealSearchPeople(val, tabType, callback) {
        const collaborationList = await debounceFunctions.getCollaborationList({ content: val })
        let arr = []
        collaborationList.forEach(item => {
            arr.push({
                uid: item.user.userId,
                icon: `https://user-photo.ks3-cn-beijing.ksyuncs.com/${item.user.userId}.png`,
                name: item.user.fullName,
                phone: item.phone,
                email: item.email,
                type: 0,
            })
        })
        injectCommon.currentListData = arr;
        let callData = {
            data: arr,
            totalPage: 1
        }
        if (injectCommon.currentTabType != tabType) {
            return
        }
        callback(callData)
    },
    //@搜索文档
    async dealSearchFile(val, type, tabType, callback) {
        val = injectCommon.replaceSpecialCharsWithSpace(val);
        const searchRecentChartList = await debounceFunctions.getSearchRecentChartList(val, type)
        var fileData = searchRecentChartList;
        fileData && fileData.forEach(item => {
            item.chartType = injectCommon.dealFileType(item)
            item.name = item.title
            item.url = injectCommon.getFileUrl(item)
            item.time = injectCommon.friendlyTime(item.lastModify)
            item.icon = `../../../../assets/images/calledIcon/${item.chartType}_circular.svg`
            item.type = 1
            item.uid = item.chartId
        })
        let callData = {
            data: fileData ? fileData : [],
            totalPage: 1
        }
        if (injectCommon.currentTabType != tabType) {
            return
        }
        callback(callData)
    },
    // 获取文件类型
    dealFileType: function (item) {
        let type = item.category
        if (type.includes('mind')) {
            type = 'mind'
        } else if (type !== 'ui' && type !== 'outline' && type !== 'board') {
            type = 'flow'
        }
        return type || 'flow'
    },
    getFileUrl: function (item) {
        let jumpUrl = window.host
        if (item.orgId) {
            jumpUrl += '/f/' // 针对f路由
        } else if (item.category.indexOf('mind') > -1) {
            jumpUrl += '/mindmap/'
        } else if (item.category.indexOf('outline') > -1) {
            jumpUrl += '/outline/'
        } else if (item.category.indexOf('board') > -1) {
            jumpUrl += '/f/' // 针对f路由
        } else {
            jumpUrl += '/diagraming/'
        }
        jumpUrl += item.chartId
        return jumpUrl
    },
    friendlyTime: function (date) {
        const minute = 60000;
        const hour = 60 * minute;
        const day = 24 * hour;
        const month = 31 * day;
        const year = 12 * month;
        let r = 0;
        let diff = 0; //获取当前时间与date相差的毫秒数
        if (date == null) {
            return '';
        }
        try {
            diff = new Date().getTime() - new Date(date.replace(/-/g, '/')).getTime();
        } catch (e) {
            return ''
        }
        let beforeText = '更新于'
        if (diff > year) {
            r = Math.floor(diff / year)
            return beforeText + r + "年前";
        }
        if (diff > month) {
            r = Math.floor(diff / month);
            return beforeText + r + "月前";
        }
        if (diff > day) {
            r = Math.floor(diff / day);
            return beforeText + r + "天前";
        }
        if (diff > hour) {
            r = Math.floor(diff / hour);
            return beforeText + r + "小时前";
        }
        if (diff > minute) {
            r = Math.floor(diff / minute);
            return beforeText + r + "分钟前";
        }
        let text = '刚刚更新'
        return text;
    }

}

window.personalInsert = {
    iframeDlgPms: {},
    chooseMyfile: {
        init: function (opt) {
            var opt_ = $.extend({
                width: "820px",
                height: "558px",
                type: "dlgChooseFile",
                callback: function (data) {

                }
            }, opt);
            PoEditorInsert.iframeDlg(opt_);
        },
    },
    iframeDlg: function (opt) {
        var _this = this;
        if (opt.fdata) {
            orgId = JSON.parse(opt.fdata).orgId;
        }
        var opt = $.extend({
            url: window.host + "/dlgapi",
            width: "770px",
            height: "537px",
            type: "dlgPay",
            title: "支付"
        }, opt)
        var params = "?";
        if (opt.type) {
            params = params + "type=" + opt.type;
            if (opt.type == "dlgPay") {
                params += "&pointspage=" + opt.pointsPage
                params += "&pointssource=" + opt.pointsSource
            }
        }
        if (opt.title) {
            params = params + "&title=" + opt.title;
        }
        if (opt.fdata) {
            params = params + "&fdata=" + encodeURIComponent(opt.fdata);
        }
        if (opt.pattern) {
            params += "&pattern=" + opt.pattern;
        }
        // 团队支付相关参数
        // 支付弹窗展示类型
        if (opt.pageStatus) {
            params = params + "&pageStatus=" + opt.pageStatus;
        }
        // 支付弹窗会员功能下拉展示文案
        if (opt.payTitle) {
            params = params + "&payTitle=" + opt.payTitle;
        }
        // 团队信息 orgId
        if (opt.orgInfo) {
            params = params + "&orgInfo=" + JSON.stringify(opt.orgInfo);
        }

        $("#po-dialog-iframe-" + opt.type).remove();
        var $iframe = $("#po-dialog-iframe-" + opt.type + " iframe");
        if ($iframe.length == 0) {
            var $iframeDlg = $('<div id="po-dialog-iframe-' + opt.type + '" class="po-dialog po-dialog-iframe"><div class="po-iframe-loading-wrap"><img src="' + staticBasePath + '/assets/images/iframe_loading.gif"></div><div class="po-dialog-header" style="position: absolute;width: calc(100% - 42px);height: 20px"></div><iframe></iframe></div>').appendTo("body")
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
                    var msgObj = JSON.parse(msg || "{}");
                    if (_this.prevMsg === msg && msgObj.instructs !== "resize") {
                        return;
                    }
                    _this.prevMsg = msg
                    if (msgObj.optType == "dlgChooseFile") {
                        _this.prevMsg = null
                        if (msgObj.instructs == "save") {
                            let { file } = msgObj.chooseFile
                            file.chartType = injectCommon.dealFileType(file)
                            file.text = file.title
                            file.url = injectCommon.getFileUrl(file)
                            file.time = injectCommon.friendlyTime(file.lastModify)
                            file.icon = location.origin + `/src/assets/images/calledIcon/${file.chartType}_circular.svg`
                            file.type = 1
                            file.uid = file.chartId
                            let arr = [file]
                            $("#po-dialog-iframe-dlgChooseFile").dialog("close");
                            PoEditorClient.getSelectData(arr)
                        }
                        $("#po-dialog-iframe-dlgChooseFile").dialog("close");
                    }
                }
            );
        }
        if (opt.isHide) {
            return
        }
        $.mask();
        $("#po-dialog-iframe-" + opt.type + "").width(opt.width).height(parseInt(opt.height)).dialog({
            onClose: function () {
                $.mask("close");
            }
        });
        var that = this;
        $iframe.off("load").on("load", function () {
            $(".po-iframe-loading-wrap").fadeOut("500");
            var timer = setTimeout(function () {
                $(".po-iframe-loading-wrap").remove();
                clearTimeout(timer);
            }, 500)
            if (typeof that.iframeDlgPms[opt.type].messengerIframe != "undefined") {
                var sendData = {
                    type: opt.type,
                    instructs: 'init'
                }
                that.iframeDlgPms[opt.type].messengerIframe.targets['filelist'].send(JSON.stringify(sendData));
            }

        });
        if (opt.type === 'pubpo') {
            $("#po-dialog-iframe-" + opt.type + "").css({
                // top: '50%',
                // marginTop: -opt.height/2 + 'px'
            })
        }

    },
}

//编辑器底部插入模版
window.outDesignerInsertTemp = {
    init: function (chartObj, params) {
        if (typeof DesignerInsertTemp == "undefined") {
            import("../pc/designerInsertTemp/designer_insert_temp.js").then(result => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = "../../../../assets/js/pc/designerInsertTemp/designer_insert_temp.css";
                document.head.appendChild(link);
                if (params.type == "dialog") {
                    if (chartObj && chartObj.category.indexOf("mind") > -1) {
                        DesignerInsertTemp.fileType = "mind";
                    }
                    DesignerInsertTemp.renderDlgTemp();
                } else {
                    outDesignerInsertTemp.editorTemplateInit(chartObj, params);
                }
            })

        } else {
            if (params.type == "dialog") {
                if (chartObj && chartObj.category.indexOf("mind") > -1) {
                    DesignerInsertTemp.fileType = "mind";
                }
                DesignerInsertTemp.renderDlgTemp();
            } else {
                outDesignerInsertTemp.editorTemplateInit(chartObj, params);
            }
        }
    },
    editorTemplateInit(chartObj, params) {
        if (chartObj && window.fileType.indexOf("mind") > -1) {
            DesignerInsertTemp.init("mind", params);
        } else if (chartObj && chartObj.category.indexOf("outline") > -1) { }
        else {
            DesignerInsertTemp.init("flow", params);
        }
    }
}
// 建议带有延迟的频繁触发的接口放到这里
const debounceFunctions = {
    getCollaborationList: debounce(injectCommon.getCollaborationRecent, 800),
    getSearchRecentChartList: debounce(injectCommon.getSearchRecentChart, 400),
    getRecentChartList: debounce(injectCommon.getRecentChart, 800),

}

function debounce(fn, delay) {
    let timer;
    return async function () {
        clearTimeout(timer);
        return new Promise((resolve) => {
            timer = setTimeout(async () => {
                const result = await fn.apply(this, arguments);
                resolve(result);
            }, delay);
        });
    };
}

$(function () {
    // 重写dialog
    $.fn.clientDialog = function (options) {
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
            var dialogClose = $("<div class='po-dialog-close po-diagraming-icons'>&#xe728;</div>").appendTo(dialogWin);
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
})


