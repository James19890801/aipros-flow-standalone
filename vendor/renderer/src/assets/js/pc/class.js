import UserOperation from './db/user.js'
import Setting from './db/setting.js'
import ServerUtil from './server/server.js'
import FileDatabase from './operation/fileDatabase.js'
import FileBusiness from './operation/fileBusiness.js'
import HtmlStr from './htmlStr.js'
import { importClass } from '../plug_in/ipc.js';
/**
 * ws
 * WebSocket 通信，端口：12123
 * */
export class wsTool {
    #onKey = {}
    constructor(params = {}) {
        // 获取订阅者
        if (params == 'sub') {
            return new WebSocket(`ws://127.0.0.1:${wsPort}/`)
        }
        // 获取广播者
        else {
            this.wss = new WebSocket.Server({
                port: wsPort,
                ...params,
            })

            // ws链接创建成功
            this.wss.on('open', (ws) => {
                this.ws = ws
            })
            // 有客户端连接时
            this.wss.on('connection', (ws) => {
                this.ws = ws
                this.clients = this.wss.clients
                this.msg()
                // 通知所有人员新客户端链接成功
                this.send(
                    JSON.stringify({
                        k: 'connect-success',
                    })
                )
            })
        }
    }
    // 创建 'message' 监听
    msg() {
        this.ws.on('message', (data) => {
            this.send(data)
            this.#onKey['message'] && this.#onKey['message'](data)
        })
    }
    // 发送消息
    send(data) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data)
            }
        })
    }
    // 外部事件绑定
    on(key, fn) {
        this.#onKey[key] = fn
    }
}

/**
 * toast
 * 提示信息
 * @param  {Object} $con 容器元素
 * @param {String} type 类型 ["success", "error"]
 * @param {String} msg  提示文字
 * */
export class Toast {
    #opt = {
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
    #newId = function () {
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

    constructor(params = {}, $con = $('body')) {

        let opt = this.#opt
        let new_opt = {
            id: this.#newId(),
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

        this.#opt = new_opt

        // if ($(".toast[data-author=mt]").length > 0) $(".toast[data-author=mt]").remove();
        // if ($("#toast_shadow[data-author=mt]").length > 0) $("#toast_shadow[data-author=mt]").remove();
        this.open()
    }
    open() {
        let opt = this.#opt
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

        this.#opt.$toast = $toast
        this.$toast = $toast
        this.#opt.$shadow = $shadow

        this.closeAll(0)

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
                this.close()
            }, opt.time)
        return opt.id
    }
    close(ms = 300) {
        let opt = this.#opt
        opt.$toast.fadeOut(ms || opt.transition)
        opt.$shadow.fadeOut(ms || opt.transition)

        // setTimeout(() => {
        //     opt.$toast.remove()
        //     opt.$shadow.remove()
        // }, ms)
        this.#opt.timeout = false
    }
    closeAll(ms = 300) {
        let opt = this.#opt
        let $toast = $('.toast-pc[data-author=mt]')
        let $shadow = $('.toast_shadow')
        $toast.fadeOut(ms || opt.transition)
        $shadow.fadeOut(ms || opt.transition)
        setTimeout(() => {
            $toast.remove()
            $shadow.remove()
        }, ms)
        this.#opt.timeout = false
    }
}

/**
 * 文件卡片模型
 * @param {"容器元素"} $ChartsCon
 * @param {"列表类型 list | icon"} listType
 * @param {"pageType"} pageType
 * @param {"卡片环境"} environment [search: 搜索结果 | ]
 */
export class ChartDom {
    vip_svg = `<img width='25' height='14' src='./src/assets/images/vip.svg' />`
    #params = {
        listType: 'icon',
        pageType: '',
        $ChartsCon: null,
        environment: '',
        isSearch: false,
        online: false,
        isCheck: false,
        folderId: 'root',
        isShowMenu: true
    }
    #user = {}
    #onKeys = {
        /**
         * 绑定卡片外框点击事件
         * @param {"文件对象"} chart
         * @param {"跳转的地址"} chartType
         * @param {"打开的页面类型 view | edit"} viewType
         * @param {"event"} event
         */
        click: function (chart, chartType, viewType, event) { },
        /**
         * 下拉框点击事件
         * @param {"事件类型"} tit
         * @param {"文件 id"} chartId
         * @param {"文件对象"} chart
         */
        menuClick: function (tit, chartId, chart) { },
        /**
         * 文件卡片点击多选
         * @param {"event"} event
         */
        check: function (event) { },
    }
    #fileOps = {
        view: "<li tit='view'><span class='icons_web'>&#xe6d4;</span> <div>浏览</div></li>",
        rename: "<li tit='rename'><span class='icons_web'>&#xe6d5;</span> <div>重命名</div></li>",
        colla: "<li tit='colla'><span class='icons_web'>&#xe71b;</span><div> 协作</div></li>",
        uncolla: "<li tit='uncolla'><span class='icons_web'>&#xe932;</span> <div>退出协作</div></li>",
        pubpo: "<li tit='pubpo'><span class='icons_web'>&#xe6d7;</span> <div>发布和公开</div></li>",
        share: "<li tit='share'><span class='icons_web'>&#xe90a;</span> <div>分享</div></li>",
        sharecolla:
            "<li tit='sharecolla'><span class='icons_web'>&#xe90a;</span> <div>分享协作</div></li>",
        down: "<li tit='down'><span class='icons_web'>&#xe939;</span> <div>下载</div><span class='icons_web' style='position:absolute;right:0;color:rgb(154, 165, 184)'>&#xe971;</span>",
        clone: "<li tit='clone'><span class='icons_web'>&#xe6d9;</span> <div>克隆</div></li>",
        copy: "<li tit='copy'><span class='icons_web'>&#xe6db;</span> <div>复制或移动</div></li>",
        restore: "<li tit='restore'><span class='icons_web'>&#xe931;</span> <div>恢复</div></li>",
        delete: "<li tit='delete'><span class='icons_web'>&#xe934;</span> <div>彻底删除</div></li>",
        unfav: "<li tit='unfav'><span class='icons_web'>&#xe936;</span> <div>取消收藏</div></li>",
        del: "<li tit='del'><span class='icons_web'>&#xe712;</span> <div>删除</div></li>",
        location:
            "<li tit='location'><span class='icons_web'>&#xe9e5;</span> 打开文件位置</li>",
        localUpload: "<li tit='localUpload'><span class='icons_web'>&#xe6f4;</span> 文件上云</li>"
    }
    #downOps = {
        png: `<li tit="png"><div class="icons_web1">&#xe981;</div><span>PNG</span></li>`,
        jpg: `<li tit="jpg"><div class="icons_web1">&#xe981;</div><span>JPG</span></li>`,
        image: `<li tit="png"><div class="icons_web1">&#xe981;</div><span style="font-weight:400">图片（PNG/JPG）</span></li>`,
        sep: `<li class="sep"></li>`,
        pos: `<li tit="pos"><div class="icons_web1">&#xe983;</div><span>POS文件</span></li>`,
        xmind: `<li tit="xmind"><div class="icons_web1">&#xe985;</div><span>Xmind文件</span><div style="width:25px;height:14px;position:absolute;right:0px">${this.vip_svg}</div></li>`,
        word: `<li tit="word"><div class="icons_web1">&#xe980;</div><span style="font-weight:400">Word(.docx)</span><div style="width:25px;height:14px;position:absolute;right:0px">${this.vip_svg}</div></li>`,
        csv: `<li tit="csv"><div class="icons_web1">&#xe97d;</div><span style="font-weight:400">Excel(.csv)</span><div style="width:25px;height:14px;position:absolute;right:0px">${this.vip_svg}</div></li>`,
        ppt: `<li tit="ppt"><div class="icons_web1">&#xe97e;</div><span style="font-weight:400">PPT</span><div style="width:25px;height:14px;position:absolute;right:0px">${this.vip_svg}</div></li>`,
        pdf: `<li tit="pdf"><div class="icons_web1">&#xe982;</div><span style="font-weight:400">PDF</span></li>`,
        pdfHD: `<li tit="pdfhd"><div class="icons_web1">&#xe982;</div><span style="font-weight:400">高清PDF</span><div style="width:25px;height:14px;position:absolute;right:0px">${this.vip_svg}</div></li>`,
        svg: `<li tit="svg"><div class="icons_web1">&#xe986;</div><span style="font-weight:400">SVG</span><div style="width:25px;height:14px;position:absolute;right:0px">${this.vip_svg}</div></li>`,
        pnghd: `<li tit="pnghd"><div class="icons_web1">&#xe981;</div><span style="font-weight:400">高清PNG</span><div style="width:25px;height:14px;position:absolute;right:0px">${this.vip_svg}</div></li>`,
        pos_all_flow: `<li tit="pos_all"><div class="icons_web1">&#xe984;</div><span style="font-weight:400">导出全部画布 (.posf)</span></li>`,
        pos_all_mind: `<li tit="pos_all"><div class="icons_web1">&#xe984;</div><span style="font-weight:400">导出全部画布 (.posm)</span></li>`,
        pos_all_outline: `<li tit="pos_all"><div class="icons_web1">&#xe984;</div><span style="font-weight:400">导出全部画布 (.posm)</span></li>`,
        visio: `<li tit="visio"><div class="icons_web1">&#xe792;</div><span style="font-weight:400">VISIO文件</span></li>`,
        visio_all: `<li tit="visio_all"><div class="icons_web1">&#xe792;</div><span style="font-weight:400">导出全部画布 (.vsdx)</span></li>`,
        opml: `<li tit="opml"><div class="icons_web1">&#xe984;</div><span style="font-weight:400">OPML文件(.opml)</span></li>`,
        fmind: `<li tit="fmind"><div class="icons_web1">&#xe97f;</div><span style="font-weight:400">Freemind文件(.mm)</span><div style="width:25px;height:14px;position:absolute;right:0px">${this.vip_svg}</div></li>`,
        md: `<li tit="md"><div class="icons_web1">&#xe783;</div><span style="font-weight:400">Markdown</span></li>`,
        mdfull: `<li tit="mdfull"><div class="icons_web1">&#xe783;</div><span style="font-weight:400" title="【拓展语法：标签、备注、提及等】">Markdown（含扩展信息）</span></li>`,
        markdown: `<li tit="markdown"><div class="icons_web1">&#xe903;</div><span style="font-weight:400">Markdown(.md)</span></li>`,
        jpghd: `<li tit="jpghd"><div class="icons_web1">&#xe981;</div><span style="font-weight:400">高清JPG</span><div style="width:25px;height:14px;position:absolute;right:0px">${this.vip_svg}</div></li>`,
    }

    #lastOpenTime = 0
    // 设置卡片宽度
    #setChartWidth = ($chart) => {
        let { $ChartsCon } = this.#params
        let w = $ChartsCon.width()
        let count = Math.ceil(w / 200)

        if ($chart)
            $chart.css({
                width: `calc(${100 / count}% - 16px);`,
            })
        else {
            let items = document.getElementsByClassName('file-list-item')
            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i]

                if (item.getAttribute('tp') == 'chart')
                    item.style.cssText =
                        'width:-webkit-calc(' +
                        100 / count +
                        '% - 16px);width:calc(' +
                        100 / count +
                        '% - 16px);'
            }
        }
    }
    // 事件绑定
    #bindEvent = ($chart, chart) => {
        let that = this
        // 点击展示下拉菜单
        let showMenu = (e) => {
            e.stopPropagation()
            let { listType } = this.#params
            if (listType == 'icon') {
                $('.file-list-item .menu, .list-item .menu').css({
                    right: 0,
                    top: '40px',
                })
            } else {
                $('.file-list-item .menu, .list-item .menu').css({
                    right: 0,
                    top: '40px',
                })
            }
            let $thatChart
            if (
                $(e.target).hasClass('file-list-item') ||
                $(e.target).hasClass('list-item')
            ) {
                $thatChart = $(e.target)
            } else {
                $thatChart = $(e.target).parents(
                    '.file-list-item, .list-item'
                )
            }
            that.#showMenu($thatChart, e.clientX, e.clientY)

            let hideMenu = function (e) {
                if (e && $(e.target).parents('.menu').length) return
                $(document).off('mousedown', hideMenu)
                that.#hideMenu(e)
            }
            $(document).on('mousedown', hideMenu)
        }
        $chart.find('.op').off().on('click', showMenu)
        $chart.find('.share').off().on('click', e => {
            e.stopPropagation()
            $chart.find('.menu li[tit=sharecolla]').click()
        })
        $chart.find('.po-star').off().on('click', e => {
            e.stopPropagation()
            console.log(chart)
            ServerUtil.favourite(chart.chartId, 'chart', (res) => {
                console.log(res)

                if (res.code == '200') {
                    const isSave = res.data.return === 'save'
                    if (pageContext) {
                        pageContext.data.searchType == 'fav' && pageContext.resetAndloadFiles(true)
                    }
                    new Toast({
                        type: 'success',
                        msg: isSave ? '收藏成功' : '取消收藏成功',
                    })
                    if (isSave) {
                        $chart.find('.po-star').html('&#xe71e;').css({ color: '#f93' }).addClass('isActive')
                    } else {
                        $chart.find('.po-star').html('&#xe711;').css({ color: '#f93' }).removeClass('isActive')
                    }
                }
            })
        })

        $chart.off('mousedown', showMenu).on('mousedown', function (e) {
            console.log(1)
            if (e.button == 2) {
                if (that.#params.isShowMenu) {
                    if ($(this).hasClass('active')) {
                        that.#hideMenu(e)
                        return
                    } else {
                        showMenu(e)
                    }
                }
            }
        })

        //下拉菜单中的事件
        $chart.find('.menu li[tit]').on('click', function (e) {
            $('#send-colla-invite').show()
            $('#send-colla-invite-loading').hide()
            e.stopPropagation()
            let tit = $(this).attr('tit')
            let chartId = $(this)
                .parents('.file-list-item, .list-item')
                .attr('id')
            const isOnLineFile = $chart.attr('id').length >= 13
            if (!that.#hasNeedNetwork(tit) && isOnLineFile) return
            if (!!tit && tit != 'down')
                FileBusiness.func(tit, chartId, 'chart', (chart, res) => {
                    if (chartId.length < 13) {

                    }
                    switch (tit) {
                        case 'rename':
                            // that.updataChart(chart)
                            break
                        case 'clone':
                        case 'restore':
                            break
                        case 'del':
                        case 'delete':
                            that.removeChart(chart)
                            break
                        case 'copy':
                            if (res.type == 'move')
                                that.removeChart(chart)
                            break
                    }
                    that.#onKeys['menuClick'](tit, chartId, chart, $chart)
                }, chart)
            that.#hideMenu()
        })

        //下拉菜单中的事件
        $chart.find('.menu li[tit]').on('mouseover', function (e) {
            let tit = $(this).attr('tit')
            if (tit == 'down') {
                $chart.find('.child-menu').show()
            }
            else {
                $chart.find('.child-menu').hide()
            }
        })

        // 点击文件
        $chart.off('mouseup').on('click',

            function (e) {
                e.stopPropagation(); // 阻止事件冒泡
                let { pageType, isCheck } = that.#params
                // 禁止打开文件的 pageType
                const isSearch = $('.searchBody').length // search状态可以打开

                let forbidOpen = ['trash']
                let currTime = new Date().getTime()
                if (pageContext.drag.isMovingMode && !isSearch) {
                    return
                }
                if (!isCheck) {
                    if (currTime - that.#lastOpenTime < 300) return
                }
                //
                that.#lastOpenTime = currTime
                // 判断文件是否已经在标签页打开
                ipc.sendToHost('getTabChartIds')
                ipc.once('getTabChartIds_callback', (_e, tabFileIds) => {
                    let chartId = $(this).attr('id')
                    let category = $(this).attr('data-cate')
                    let filepath = $(this).attr('data-filepath')
                    // 判断点击事件性质是不是多选选中
                    if (isCheck) {
                        let checked = $chart.find('.check').is(':checked')

                        $chart.find('.check').prop('checked', !checked)
                        that.#onKeys['check'](e)
                        return false
                    }
                    // 判断当前打开操作是否在禁止打开队列内
                    if (forbidOpen.indexOf(pageType) > -1 && !isSearch) return
                    // 文件已经在标签页打开，直接切换到该文件标签页

                    let fileIds = tabFileIds.split(",");

                    const has = fileIds.some(item => {
                        return ((chartId && item == chartId) || (filepath && item === filepath))
                    })

                    if (has && (chartId || filepath)) {
                        ipc.sendToHost('selectTabByChartId', chartId, filepath)
                        return
                    }

                    that.#toChartPage(chartId, category, e).then((res) => {
                        if (res) {
                            let { chart, chartType, viewType } = res
                            that.#onKeys['click'](chart, chartType, viewType, e)
                        }
                    })
                })

                return false
            })

        // 取消发布
        $chart
            .off('click', '.pubicon.canclick')
            .on('click', '.pubicon.canclick', function (e) {
                let chartId = $(this)
                    .parents('.file-list-item, .list-item')
                    .attr('id')

                FileBusiness.unpubpo(chartId, (data) => {
                    if (data && data.result == 'success')
                        FileDatabase.updateChart(
                            chartId,
                            false,
                            {
                                status: 'private',
                            },
                            (chart) => {
                                $('#hover_tip').remove()
                                that.updataChart(chart)
                            }
                        )
                })
                return false
            })

        // 文件批量操作
        $chart.find('.check').on('click', function (e) {
            e.stopPropagation()
            if (
                $(e.target).parents('.file-list').find('.check:checked')
                    .length
            )
                that.#params.isCheck = true
            else that.#params.isCheck = false
            that.#onKeys['check'](e)
        })

        $chart.find('.check').on('mousedown.drag', function (e) {
            e.stopPropagation()
        })
        $chart.find('.check').on('mouseup.drag', function (e) {
            e.stopPropagation()
        })

        // 下载操作
        $chart.find('.child-menu li[tit]').on('click', function (e) {
            let tit = $(this).attr('tit')
            let chartId = $(this)
                .parents('.file-list-item, .list-item')
                .attr('id')
            let category = $(this)
                .parents('.file-list-item, .list-item')
                .attr('data-cate')
            let filepath = $(this)
                .parents('.file-list-item, .list-item')
                .attr('data-filepath')
            let fileType = 'flow'
            switch (category) {
                case 'mind':
                case 'mind_free':
                case 'mind_org':
                case 'fishbone':
                case 'timeline':
                case 'mind_right':
                case 'mind':
                case 'mind_org_multistage':
                case 'mind_ishikawa_left':
                case 'mind_timeline_h':
                case 'mind_brace_right':
                case 'mind_tree_free':
                    fileType = 'mind'
                    break;
                case 'outline':
                    fileType = 'outline'
                    break;
            }
            UserOperation.getUserPrivilege(false, (user) => {
                if ((tit == 'pdfhd' || tit == 'svg' || tit == 'pnghd' || tit == 'jpghd' || tit == 'xmind' || tit == 'fmind' || tit == 'word' || tit == 'csv' || tit == 'ppt')
                    && !user.member && !user.orgMember) {
                    ipc.sendToHost("showDlgPayWebView", { pay_position: `home_down_${tit}` })
                    return
                }
                let chartUrl = ''
                let source = ''
                let type = ''
                if (category.indexOf("mind") >= 0 || ['fishbone', 'timeline', 'ishikawa'].includes(category)) {
                    // chartUrl = "http://192.168.10.135/mindmap/";
                    chartUrl = "./src/v5_editor/source/compile/mindmap/index.html";
                    source = 'official_mind_pos'
                    type = 'mind'
                }
                else if (category == "outline") {
                    chartUrl = "./src/v5_editor/source/compile/outline/index.html";
                    source = 'official_outline_pos'
                    type = 'outline'
                }
                else if (category == "markdown") {
                    chartUrl = "./src/markdown-editor/index.html";
                    source = 'official_outline_pos'
                    type = 'markdown'
                }
                else {
                    chartUrl = "./src/v5_editor/source/compile/diagrams/index.html";
                    source = 'official_flow_pos'
                    type = 'flow'
                }
                if (chartId.length > 13) {
                    chartUrl += `?token=token&chartId=${chartId}`
                    // chartUrl += `${chartId}`
                    switch (tit) {
                        case 'png':
                        case 'jpg':
                        case 'pnghd':
                        case 'jpghd':
                        case 'svg':
                        case 'pdfhd':
                        case 'pdf':
                            chartUrl += `&action=down&downtype=${tit}`
                            if (category.indexOf("outline") > -1) {
                                ipc.sendToHost('showDlgDownWebView', { type: 3, url: chartUrl })
                            }
                            else {
                                ipc.sendToHost('showDlgDownWebView', { type: 1, url: chartUrl })
                            }
                            break;
                        case 'opml':
                        case 'visio':
                        case 'fmind':
                        case 'md':
                        case 'mdfull':
                            if ((!pcUtil.isOnline() && filepath && !filepath.endsWith('.bak')) || (pcUtil.isOnline())) {
                                // chartUrl += `?action=down&type=${tit}&token=${localStorage.getItem('processon_token')}`
                                // chartUrl += `&action=down&downtype=${tit != 'pdfhd' ? tit : 'pdfHD'}`
                                chartUrl += `&action=down&downtype=${tit}`
                                ipc.sendToHost('showDlgDownWebView', { type: 3, url: chartUrl })
                            }
                            else if (!pcUtil.isOnline()) {
                                new Toast({
                                    type: 'warning',
                                    msg: '无法连接到服务器，请检查您的网络设置',
                                })
                            }
                            break
                        case 'ppt':
                            if (pcUtil.isOnline()) {
                                chartUrl = `${window.host}/mindmap/ppt/${chartId}`
                                ipc.sendToHost('showDlgDownWebView', { type: 2, url: chartUrl })
                            }
                            else {
                                new Toast({
                                    type: 'warning',
                                    msg: '无法连接到服务器，请检查您的网络设置',
                                })
                            }
                            break
                        default:
                            if ((tit == 'pos' || tit == 'markdown' || tit == 'xmind') && category == 'markdown') {
                                chartUrl += `&action=down&downtype=${tit}`
                                ipc.sendToHost('showDlgDownWebView', { type: 3, url: chartUrl })
                                break;
                            }
                            const to = new Toast({
                                type: 'warning',
                                msg: '下载中,请稍后',
                                autoClose: false
                            })
                            const _url = tit == 'pos_all' ? '/chart_image/export/file' : (tit != 'pdfhd') ?
                                '/chart_image/diagram_export/mindmap' :
                                "/chart_image/diagram_export/flow"
                            let export_url = window.host + _url
                            const sData = { type: tit, title: '', chartId: chartId, definition: '', source: '', width: '', height: '', }
                            sData.source = source
                            ServerUtil.getCanvasInfoByChartId(chartId, (data) => {
                                const definitionId = data.canvas.mainCanvasId
                                // const definitionId = data.canvas.chartCanvas.filter(d => d.canvasId == canvasId)[0].definitionId
                                const title = data.chart.title
                                sData.title = title
                                ServerUtil.getChartDefById(chartId, definitionId, (def) => {
                                    sData.definition = def.definition
                                    const body = new URLSearchParams(sData).toString();
                                    window.fetch(export_url, {
                                        method: 'POST', headers: {
                                            'Content-Type': 'application/x-www-form-urlencoded',
                                        },
                                        body: body,
                                    }).then((res) => {
                                        res.arrayBuffer().then((data) => {
                                            let suffix
                                            switch (tit) {
                                                case 'xmind': suffix = 'xmind'; break;
                                                case 'visio':
                                                case 'visio_all':
                                                    suffix = 'vsdx'; break;
                                                case 'pdfHD':
                                                case 'pdfhd':
                                                    suffix = 'pdf'; break;
                                                case 'pos':
                                                    suffix = 'pos'; break;
                                                case 'pos_all':
                                                    switch (type) {
                                                        case 'flow': suffix = 'posf'; break;
                                                        case 'mind': suffix = 'posm'; break;
                                                        case 'outline': suffix = 'poso'; break;
                                                    };
                                                    break;
                                                case 'word':
                                                    suffix = 'docx'
                                                    break
                                                case 'csv':
                                                    suffix = 'csv'
                                                    break
                                                case 'opml':
                                                    suffix = 'opml'
                                                    break
                                            }
                                            // 保存
                                            ipc.invoke('saveFileB64', { type: 'save', data: importClass.arrayBufferToBase64(data), path: title, suffix: suffix }).then((resPath) => {
                                                to.close()
                                                if (resPath.path != '') {
                                                    new Toast({ type: 'success', msg: '下载成功' })
                                                }
                                            })
                                        })
                                    })
                                }, () => {
                                    new Toast({
                                        type: 'warning',
                                        msg: '无法连接到服务器，请检查您的网络设置',
                                    })
                                })
                            }, () => {
                                new Toast({
                                    type: 'warning',
                                    msg: '无法连接到服务器，请检查您的网络设置',
                                })
                            })
                            break
                    }
                }
                else {
                    ipc.invoke('loadFileB64',
                        {
                            type: "cache",
                            path: "history/cache.json"
                        }
                    ).then((res) => {
                        const data = res
                        if (data.code == 201) {
                            new Toast({
                                type: 'warning',
                                msg: '出现异常请重试',
                            })
                        } else {
                            let realData = JSON.parse(decodeURIComponent(escape(atob(data.data))))
                            realData = realData.filter(d => d.chartId == chartId)
                            if (realData.length > 0) {
                                chartUrl += `?token=token&action=down&downtype=${tit}&filepath=${realData[0].filepath}`
                                switch (tit) {
                                    case 'png':
                                    case 'jpg':
                                    case 'pnghd':
                                    case 'jpghd':
                                    case 'svg':
                                    case 'pdfhd':
                                    case 'pdf':
                                        if (category.indexOf("outline") > -1) {
                                            ipc.sendToHost('showDlgDownWebView', { type: 3, url: chartUrl })
                                        }
                                        else {
                                            ipc.sendToHost('showDlgDownWebView', { type: 1, url: chartUrl })
                                        }
                                        break;
                                    default:
                                        ipc.sendToHost('showDlgDownWebView', { type: 3, url: chartUrl })
                                        break;
                                }
                            }
                            else {
                                new Toast({
                                    type: 'warning',
                                    msg: '出现异常请重试',
                                })
                            }
                        }

                    })
                        .catch((err) => {
                            new Toast({
                                type: 'warning',
                                msg: '出现异常请重试',
                            })
                        });
                }

            })
        })

        // 文件名称出现 ... 鼠标 hover展示全称提示
        $chart.find('.title.ct label').on('mouseenter', function (e) {
            let elOffset = e.target.getBoundingClientRect()
            let targetWidth = e.target.offsetWidth
            let parentNodeW = e.target.parentNode.offsetWidth;
            let preIconNodeW = e.target.previousElementSibling.offsetWidth
            let nextIconNodeW = e.target.nextElementSibling.offsetWidth
            // 文字是否超过
            let isExceed = preIconNodeW + targetWidth + nextIconNodeW + 16 >= parentNodeW
            console.log(isExceed)
            if (isExceed) {
                let dom = document.createElement('div')
                let tipWidth = dom.clientWidth,
                    tipHeight = dom.clientHeight

                dom.setAttribute('id', 'hover_tip')
                let _top = elOffset.top, _left = elOffset.left
                dom.innerHTML = "<div class='tip_arrow'></div><div class='tip_content radius3'></div>"
                dom.lastChild.innerText = e.target.innerText
                document.body.appendChild(dom)

                let domChild = dom.getElementsByClassName('tip_arrow')[0]

                _top = _top - tipHeight - 30;
                _left = _left - ((dom.offsetWidth - targetWidth) / 2)
                domChild.setAttribute('class', 'tip_arrow tip_top')
                let dH = document.documentElement.clientHeight
                if ((_top + 32) >= dH) {
                    domChild.setAttribute('class', 'tip_arrow tip_top')
                    _top = _top - 32 - tipHeight - 4
                }
                if (_left <= 5) {
                    _left = 5
                }
                if ((_left + tipWidth) > window.innerWidth) {
                    _left = window.innerWidth - tipWidth - 5
                }
                dom.setAttribute('style', 'top:' + _top + 'px;left:' + _left + 'px')
            }
        })

        const removeDom = () => {
            $('#hover_tip').remove()
        }
        $chart.find('.title.ct label').on('mouseleave', function (e) {
            removeDom()
        })

        $chart.find('.title.ct label').on('click', function (e) {
            removeDom()
        })

        $chart.find('.title.ct label').on('mousedown', function (e) {
            removeDom()
        })



        // 缩略图加载失败
        // if ($chart.find(".file-img-container img").length)
        //     $chart.find(".file-img-container img")[0].addEventListener("error", function (e) {
        //         var elem = e.target;
        //         $(elem).attr({ "src": "assets/images/thumb.png" });
        //     }, true);
    }
    // 判断该功能在当前网络环境下是否可用
    #hasNeedNetwork = (tit) => {
        let needNetwork = ['copy', 'rename', 'view', 'colla', 'pubpo', 'sharecolla', 'uncolla', 'unfav']
        if (needNetwork.includes(tit) && !navigator.onLine) {
            new Toast('needNetwork')
            this.#hideMenu()
            return false
        } else return true
    }
    // 显示下拉
    #showMenu = ($chart, clientX, clientY) => {
        if (!clientX || !clientY) {
            // 当引导的时候会tigger这个方法 此时没有clientx 需要找到第一个本地文件模拟位置
            var targetSpan = $('.file-list .col2 span').filter(function () {
                return $(this).text() === '本地文件';
            }).first();
            const offset = targetSpan.offset()
            console.log(offset)
            clientX = offset.left - 30
            clientY = offset.top
        }
        this.#hideMenu()
        $('.menu, .help_shade, .shade_box, #noti-win').hide()
        $('.create-btn-list').removeClass('popover')
        ipc.sendToHost('hideTabMore')
        $chart.addClass('active')
        $chart.find('.menu').show()
        this.#setMenuPos($chart.find('.menu'), $chart, clientX, clientY)
    }
    // 隐藏下拉
    #hideMenu = () => {
        $('.file-list-item .menu, .list-item .menu').hide()
        $('.file-list-item .menu .child-menu, .list-item .menu .child-menu').hide()
        $('.file-list-item.active, .list-item.active').removeClass('active')
    }
    // 构建卡片下拉
    #createMenu = ($chart, chart) => {
        let $menu = $chart.find('.menu')
        $menu.css({ 'overflow': 'initial' })
        let $setIcon = $chart.find('.op')
        let $ul = $('<ul></ul>')
        let $lis = this.#getMenuList(chart)

        if ($lis.length < 1) {
            $ul.html('<li>无更多操作</li>')
            if (this.#params.environment == 'search')
                $ul.append("<li tit='location'>文件位置</li>")
        } else {
            if (this.#params.environment == 'search')
                $lis.push(
                    "<li tit='location'><span class='icons'>&#xec32;</span> 文件位置</li>"
                )
            $lis.map(($li) => $ul.append($li))
        }

        $menu.html($ul)
    }
    // 获取下拉内容
    #getMenuList = (chart) => {
        let list = [],
            ops = this.#fileOps
        let { pageType, listType, isSearch, folderId } = this.#params
        switch (pageType) {

            case 'diagrams':
                list.push(ops['view'])
                list.push(ops['rename'])
                list.push(ops['sharecolla'])
                // list.push(ops["colla"]);
                if (chart.category != 'markdown') {
                    list.push(ops['pubpo'])
                }
                // list.push(ops["share"]);
                // list.push(ops['clone'])
                list.push((`${ops["down"]}${this.#createDownList(chart)}</li>`));
                list.push(ops['copy'])
                list.push(ops['sep'])
                list.push(ops['del'])
                if (isSearch) list.push(ops['location'])
                if (chart.category == 'board') {
                    list = []
                    list.push(ops['rename'])
                    list.push(ops['copy'])
                    list.push(ops['del'])
                }
                break
            case 'history':
                const isMyFile = chart.chartId.length <= 13
                if (isMyFile) {
                    list.push(ops['view'])
                    list.push(ops['localUpload'])
                    list.push(ops['location'])
                    list.push((`${ops["down"]}${this.#createDownList(chart)}</li>`));
                    list.push(ops['del'])
                    break;
                }
                list.push(ops['location'])
                list.push(ops['view'])
                list.push(ops['rename'])
                list.push(ops['sharecolla'])
                // list.push(ops["colla"]);
                if (chart.category != 'markdown') {
                    list.push(ops['pubpo'])
                }
                list.push((`${ops["down"]}${this.#createDownList(chart)}</li>`));
                list.push(ops['copy'])
                list.push(ops['sep'])
                list.push(ops['del'])
                if (isSearch) list.push(ops['location'])
                break
            case 'fav':
                list.push(ops['view'])
                list.push(ops['unfav'])
                break
            case 'colla':
                const target = $('#dir_box').find('div.active')
                const isWithMe = $(target).attr('id') == 'colla_my' ? 0 : 1; //1 与我协作 0 我的协作
                if (!isWithMe) {
                    list.push(ops['location'])
                    list.push(ops['view'])
                    list.push(ops['rename'])
                    list.push(ops['sharecolla'])
                    // list.push(ops["colla"]);
                    list.push(ops['pubpo'])
                    // list.push(ops["share"]);
                    // list.push(ops["down"]);
                    list.push(ops['copy'])
                    list.push(ops['sep'])
                    list.push(ops['del'])
                } else {
                    list.push(ops['view'])
                    //如果是在子目录中，文件和文件夹都没有取消协作的操作
                    if (folderId == 'root') list.push(ops['uncolla'])
                }
                break
            case 'trash':
                list.push(ops['restore'])
                list.push(ops['delete'])
                break
        }
        return list
    }
    #createDownList = (chart) => {
        console.log(chart.category)
        const ops = this.#downOps
        let menuli = ''
        switch (chart.category) {
            case 'mind':
            case 'mind_free':
            case 'mind_org':
            case 'fishbone':
            case 'timeline':
            case 'mind_right':
            case 'mind':
            case 'mind_org_multistage':
            case 'mind_ishikawa_left':
            case 'mind_timeline_h':
            case 'mind_brace_right':
            case 'mind_tree_free':
                menuli += ops['image'] + ops['svg'] + ops['pdfHD'] + ops['sep'] + ops['pos'] + ops['xmind'] + ops['fmind'] + ops['word'] + ops['csv'] + ops['ppt'] + ops['md'] + ops['mdfull'] + ops['pos_all_mind']
                break;
            case 'outline':
                menuli += ops['opml'] + ops['png'] + ops['jpg'] + ops['pdf'] + ops['pos'] + ops['word'] + ops['ppt'] + ops['csv'] + ops['xmind'] + ops['pos_all_outline']
                break;
            case 'markdown':
                menuli += ops['image'] + ops['pdfHD'] + ops['sep'] + ops['pos'] + ops['markdown'] + ops['xmind'] + ops['fmind']
                break;
            case 'flow':
            case 'ui':
            case 'uml':
            case 'network':
            case 'bpmn':
            case 'er':
            case 'venn':
            case 'swimlane':
            case 'flowbase':
            default:
                menuli += ops['image'] + ops['svg'] + ops['pdfHD'] + ops['sep'] + ops['pos'] + ops['visio'] + ops['pos_all_flow'] + ops['visio_all']
                break;
        }
        return `<div class="child-menu" style="position:absolute;top:0px;left:157px;display:none"><ul>${menuli}</url></div>`
    }
    // 设置下拉定位
    #setMenuPos = ($menu, $chart, clientX, clientY) => {
        let _clientX = clientX //鼠标点击坐标x
        let _clientY = clientY + 56 //鼠标点击的坐标y,56为搜索框高度
        let _menuWidth = $menu.width() // 获取当前列下菜单的宽度
        let _menuHeight = $menu.height() // 获取当前列下菜单的高度
        let _con_left = $('.con-left').width() //获取左侧导航的宽度
        let _con_right = $('.con-right').width() //获取右侧主体的宽度
        let windowWidth = document.documentElement.clientWidth
        let windowHeight = document.documentElement.clientHeight

        let { listType } = this.#params
        let { top, left } = pcUtil.getDistance($chart)
        let {
            top: oTop,
            left: oLeft,
            right: oRight,
        } = pcUtil.getDistance($chart.find('.op'))
        let { right: mRight, bottom: mBottom } = pcUtil.getDistance($menu, {
            top: oTop + 10,
            left:
                oLeft +
                $chart.find('.op').outerWidth() -
                $menu.outerWidth() / 2,
        })
        $menu.find('li[tit=down]')
        if (listType == 'icon') {
            if (mRight < 10) {
                $menu.css({
                    right: `${$menu.outerWidth() / 2}px`,
                })
                $menu.find('.child-menu').css({ left: '-175px' })
                // $menu.css({ "right": `0px` });
            }
            if (mBottom <= 10) {
                $menu.css({
                    top: `-${$menu.outerHeight() + (10 - (oTop - top))}px`,
                })
            }
            let childHeight = $menu.find('.child-menu').height()
            const menuClientY = _clientY + parseFloat($menu.css('top').replace('px', ''))
            let childClientY = menuClientY + 80
            if (windowHeight < (childHeight + childClientY)) {
                $menu.find('.child-menu').css({ top: `${windowHeight - childHeight - childClientY}px` })
            }
        } else if (listType == 'list' || listType == 'localList') {
            // $menu.css({ "left": `${_clientX}px` });
            if (windowWidth - _clientX <= _menuWidth) {
                $menu.css({
                    right: `${$menu.outerWidth() / 2 + 20}px`,
                })
                // $menu.css({ "top": `${_clientY}px` });
            }
            if (windowHeight - _clientY <= _menuHeight) {
                $menu.css({
                    top: `-${$menu.outerHeight() + 20}px`,
                })
            }
            if (_clientX <= _con_left + _menuWidth) {
                $menu.css({
                    right: `${_con_right - _menuWidth - 24}px`,
                })
            }
            if (
                windowWidth - _clientX > _menuWidth &&
                _clientX > _con_left + _menuWidth
            ) {
                $menu.css({
                    right: `${windowWidth - _clientX - ($menu.outerWidth() / 2)}px`,
                })
            }
            let childHeight = $menu.find('.child-menu').height()
            const menuClientY = _clientY + parseFloat($menu.css('top').replace('px', ''))
            let childClientY = menuClientY + 120
            if (windowHeight < (childHeight + childClientY)) {
                $menu.find('.child-menu').css({ top: `${windowHeight - childHeight - childClientY}px` })
            }
        }
    }
    //进入文件编辑/预览页面
    // {"期望进入的页面类型"} expViewType ["view" | "edit"] *实际进入页面根据 用户Id与作者Id 决定
    #toChartPage = (chartId, category, e) => {
        let that = this
        let { pageType, online } = that.#params
        let chartType = that.#getChartType(category)
        let linkUrl
        let viewType = 'edit'
        let expViewType = 'edit'
        let openWinObj = {}
        let trackType = ''
        // UserOperation.getUser(false, function () { }, true);
        // 思维导图本地编辑器地址
        if (category.indexOf('mind') >= 0 || ['fishbone', 'timeline', 'ishikawa'].includes(category)) {
            trackType = 'mind_page_visit'
            linkUrl = './src/v5_editor/source/compile/mindmap/index.html'
        }

        // 思维笔记本地编辑器地址 
        else if (category.indexOf('outline') >= 0) {
            trackType = 'note_page_visit'
            linkUrl = './src/v5_editor/source/compile/outline/index.html'
        }

        // 流程图本地编辑器地址
        else if (category.indexOf('flow') >= 0) {
            trackType = 'process_page_visit'
            linkUrl = './src/v5_editor/source/compile/diagrams/index.html'
        }

        // 鱼骨图本地编辑器地址
        else if (category == 'uncategorized') {
            trackType = 'process_page_visit'
            linkUrl = './src/v5_editor/source/compile/diagrams/index.html'
        }

        // markdown编辑器
        else if (category == 'markdown') {
            trackType = 'process_page_visit'
            linkUrl = './src//markdown-editor/index.html'
        }

        // 其他新增类型依靠思维导图展示（如：树形图）
        else {
            trackType = 'process_page_visit'
            linkUrl = './src/v5_editor/source/compile/diagrams/index.html'
        }
        if (pageType == 'colla' || pageType == 'fav') {
            if (!pcUtil.isOnline()) {
                new Toast({
                    type: 'warning',
                    msg: '无法连接到服务器，请检查您的网络设置',
                })
                return
            }
        }
        return new Promise((resolve, reject) => {
            /**
             * 打开文件逻辑
             * 在这里做数据分析 在 inject 中打开最终的文件本地
             *
             */

            const isMyFile = (chartId.length <= 13 || $(e.currentTarget).data('filepath') != '')
            if (isMyFile) {
                let obj = $(e.currentTarget);
                let res = obj.data("filepath");
                if (res != '') {
                    ipc.invoke('loadFileB64', { type: 'local', path: res }).then((result) => {
                        const data = result
                        if (data.code !== 200) {
                            this.confirmDelete(res).then((result) => {
                                resolve(result)
                            })
                        }
                        // 文件存在
                        else {

                            const title = res.substring(res.lastIndexOf('/') + 1, res.lastIndexOf('.'))
                            let chartType = pageContext.getChartType(category);
                            pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=${encodeURIComponent(res)}`, title: title });
                        }
                    })
                }
            } else {
                if (pcUtil.isOnline()) {
                    ServerUtil.getChartById(chartId, chart => {
                        if (chart) {
                            let ownerId = chart.owner ? chart.owner.userId : chart.userId;
                            let isCollaboration = chart.collaboration && chart.collaboration.indexOf(that.#user.userId) > -1;
                            // 判断当前文件是否是协作文件,写作文件需要判断当前用户在协作中的角色
                            if (pageType == "colla") {
                                if (!pcUtil.isOnline()) {
                                    new Toast({ type: "warning", msg: "无法连接到服务器，请检查您的网络设置" });
                                    return;
                                }
                                if (chart.orgId) {
                                    new Toast({ type: "warning", msg: "团队文件暂不支持" });
                                    return;
                                }
                                pcUtil.openWin({ url: linkUrl + `?token=token&chartId=${chart.chartId}&dbId=${chart.dbId}`, title: chart.title });
                                resolve({ chart, chartType, viewType });
                            }
                            else if (pageType == "fav") {
                                if (!pcUtil.isOnline()) {
                                    new Toast({ type: "warning", msg: "无法连接到服务器，请检查您的网络设置" });
                                    return;
                                }
                                if (chart.owner && chart.owner.userId == user.userId) {
                                    openWinObj = { url: linkUrl + `?token=token&chartId=${chart.chartId}&dbId=${chart.dbId}`, title: chart.title };
                                    pcUtil.openWin(openWinObj);
                                    resolve({ chart, chartType, viewType: "edit" });
                                } else {
                                    ipc.send("openUrl", `/view/${chartId}`)
                                    // pcUtil.openWin({ url: `/view/${chartId}`, title: chart.title, type: "url" });
                                    resolve({ chart, chartType, viewType: "view" });
                                }
                            }
                            else {
                                if (expViewType == "edit" && (ownerId == that.#user.userId || isCollaboration)) viewType = "edit";
                                else if (expViewType == "edit" && ownerId != that.#user.userId) viewType = "view";
                                else if (expViewType == "view") viewType = "view";
                                openWinObj = { url: linkUrl + `?token=token&chartId=${chart.chartId}&dbId=${chart.dbId}`, title: chart.title };

                                pcUtil.openWin(openWinObj);

                                resolve({ chart, chartType, viewType });
                            }
                        }
                        else {
                            // openToast && openToast.close();
                            new Toast({ msg: "文件不存在", type: "error" });
                        }
                    }, err => {
                        new Toast({
                            type: 'warning',
                            msg: err.msg || '未知错误'
                        })
                    });
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
                            const target = cache.find(c => c.chartId == chartId)
                            if (target && target.filepath) {

                                let chartType = pageContext.getChartType(target.category);
                                pcUtil.openWin({ url: chartType.url + `?token=token&chartId=&dbId=&filepath=${encodeURIComponent(target.filepath)}`, title: target.title });
                            } else {
                                new Toast({ type: "warning", msg: "该文件暂不支持离线编辑,请联网后打开再重试" });
                            }
                        } else {
                            new Toast({ type: "warning", msg: "该文件暂不支持离线编辑,请联网后打开再重试" });
                        }
                    })

                }
            }
            const NavMap = {
                'templateCreate': '从模版新建',
                'history': '最近',
                'diagrams': '云文件',
                'colla': '协作',
                'fav': '我的收藏',
                'trash': '回收站'
            }

        })
    }
    // 获取文件对应的编辑器页面
    #getChartType = (category) => {
        let chartType = {}

        if (category.indexOf('mind') >= 0)
            chartType = {
                url: 'mind.html',
            }
        else if (category == 'outline')
            chartType = {
                url: 'outline.html',
            }
        else chartType = { url: 'flow.html' }

        return chartType
    }

    // 设置模型参数
    constructor(params = {}) {
        this.#params = {
            ...this.#params,
            ...params,
        }
        this.#user.fullName = UserOperation.getFullName()
        this.#user.userId = UserOperation.getUk()
    }

    // 创建卡片dom
    createChart(chart) {
        let that = this
        let { pageType, listType, isSearch } = this.#params
        let icons = pcUtil.getIconsByCate(chart.category, listType, chart)
        let pubIcon = ''
        let fullName = 'ProcessOn'
        let dCheckOuter = ``
        let kv = ''
        let sColla = ''
        let lastModify = chart.lastModify || chart.createDate
        let ownerId = chart.owner ? chart.owner.userId : chart.userId
        chart.title = pcUtil.filterXss(chart.title)
        // if(pageType == "fav") chart.favouriteTime || lastModify;
        // lastModify = pcUtil.getCurrentTimeString(lastModify)

        if (chart.userId && chart.userId == UserOperation.getUk())
            fullName = this.#user.fullName
        else if (chart.owner && chart.owner.fullName)
            fullName = chart.owner.fullName

        if (chart.kvId && chart.kvId != '') kv = `data-kv="${chart.kvId}"`
        if (pageType == 'diagrams') {
            dCheckOuter = `<span class="check-outer"><input type="checkbox" class="check"></span>`
        }
        if (
            pageType == 'diagrams' ||
            pageType == 'history' ||
            pageType == 'colla'
        ) {
            pubIcon = pcUtil.getPubIcon(chart, that.#user.userId == ownerId, listType)
        }
        if (pageType == 'colla') {
            let collaboration = chart.collaboration
                ? chart.collaboration
                : []
            sColla = "<div class='file_list_item_collas'>"
            sColla += "<div class='file_list_item_collas_bg'>"
            collaboration.map((userid, i) => {
                if (userid != this.#user.userId && i < 5)
                    sColla +=
                        "<div class='file_list_item_collas_box'><img src='" +
                        pcUtil.Avatar(userid) +
                        "'/></div>"
            })
            sColla +=
                "<div class='file_list_item_collas_box'><img src='" +
                pcUtil.Avatar(ownerId) +
                "'/></div>"
            sColla +=
                "<div class='file_list_item_collas_num'>" +
                collaboration.length +
                '</div>'
            sColla += '</div>'
            sColla += '</div>'
        }
        if (pageType == 'fav') {
            pubIcon = pcUtil.getPubIcon(chart, that.#user.userId == ownerId, listType)
        }

        let dbId = chart.dbId
        if (!dbId || dbId == '') dbId = chart.chartId
        const isMyFile = chart.chartId.length <= 13
        const showIcon = pageType == 'history' || pageType == 'diagrams'
        let $chart = $(`
                    <div class="list-item" data-filepath="${chart.filepath || ''}" data-cate="${chart.category}" ${kv} tp="chart" id="${chart.chartId}" data-dbid="${dbId}">
                        <div class="col1">
                           <!--  <span class="icons">${icons}</span>
                            <label>${chart.title}</label>
                            <a><label>${chart.title}</label></a>-->
                            <div class="line">
                                <span class="icons t-icons">${icons}</span>
                                <label>${chart.title}</label>
                                ${pubIcon}
                                ${!isMyFile && showIcon ? `<span class="po-star icons_web ${chart.favourite ? "isActive" : ""}">${chart.favourite ? "&#xe71e;" : "&#xe711;"}</span>` : ''}
                            </div>
                            <div class="po-ops">
                               ${!isMyFile && showIcon ? '<span class="icons_web share">&#xe90a;</span>' : ''}
                                <span class="icons_web op">&#xe904;</span>
                            </div>
                            <div class='menu' style="display: none;"></div>
                         
                        </div>
                        <div class="col2 chartFileType" style="display:${(pageType === 'history' || isSearch) ? 'flex' : 'none'}">
                        ${isMyFile ? `<span data-id=${chart.chartId}>本地文件</span><span class='icons_web uploadStatus'></span>` : '<span>云文件</span>'}</div>
                        <div class="col3"><span>${isMyFile ? localStorage.getItem('pcName') : fullName}</span></div>
                        <div class="col4 col4local"><span>${pcUtil.$getPoTime(lastModify)}</span></div>
                        ${dCheckOuter}
                    </div>`)
        if (listType == 'icon') {
            let imgSrc;
            let path = ipc.sendSync('getGlobal', 'appPath')
            let imgDeSrc = 'file:///' + path + '/assets/images/flow/file_flow.png'
            const isMyFile = chart.chartId.length <= 13;
            if (!isMyFile) {
                let thumbnail = chart.thumbnail
                let imgHost = ipc.sendSync('getGlobal', 'imageUrl')
                if (chart.category.indexOf('markdown') > -1) {
                    imgDeSrc = './src/assets/images/markdown.png'
                }
                else if (!thumbnail || thumbnail == '') {
                    if (chart.category.indexOf('mind') >= 0) {
                        imgDeSrc = HtmlStr.errorImage
                    }

                    else if (chart.category.indexOf('outline') >= 0) {
                        imgDeSrc = HtmlStr.errorImage
                    }
                } else {
                    if (chart.category.indexOf('mind') >= 0) {
                        imgDeSrc = `${imgHost}/chart_image/thumb/mind/${thumbnail}.png?cid=${chart.chartId}&t=${new Date().getTime()}`;
                    } else {
                        imgDeSrc = `${imgHost}/chart_image/thumb/${thumbnail}.png?cid=${chart.chartId}&t=${new Date().getTime()}`;
                    }
                }
            } else {
                if (chart.category.indexOf('markdown') > -1) {
                    imgDeSrc = './src/assets/images/markdown.png'
                }
                else {
                    imgDeSrc = 'file://' + chart.thumbImage
                }
            }
            $chart = $(`
                    <div class="file-list-item" data-filepath="${chart.filepath || ''}" data-cate="${chart.category}" ${kv} tp="chart" id="${chart.chartId}" data-dbid="${dbId}">
                        <div class="file-img-container">
                            <img src="${imgDeSrc}" data-src="${imgSrc}"/>
<!--                            ${sColla}-->
                            ${pubIcon} 
                        </div>
                        <div class="title ct">
                            <a href="javascript:;">
                                ${icons}
                                <label>${chart.title}</label>
                                ${!isMyFile ? `<span class="po-star icons_web ${chart.favourite ? "isActive" : ""}">${chart.favourite ? "&#xe71e;" : "&#xe711;"}</span>` : ''}
                            </a>
                        </div>
                        <span class="icons_web op">&#xe904;</span>
                        <div class='menu' style="display: none;"></div>
                        ${dCheckOuter}
                    </div>`)
        }

        this.resize($chart)
        this.#createMenu($chart, chart)
        this.#bindEvent($chart, chart)

        return $chart
    }
    filterXss(val) {
        if (val == null || val == '') {
            return ''
        }
        val = val.toString()
        val = val.replace(/</g, '&lt;')
        val = val.replace(/%3C/g, '&lt;')
        val = val.replace(/>/g, '&gt;')
        val = val.replace(/%3E/g, '&gt;')
        val = val.replace(/'/g, '&apos;')
        val = val.replace(/"/g, '&quot;')
        return val
    }
    // 更新卡片dom
    updataChart(chart) {
        let $oldChart = $(`#${chart.chartId}`)
        let $newChart = this.createChart(chart)

        if (!$oldChart.length) $oldChart = $(`#${chart.dbId}`)

        $newChart.replaceAll($oldChart)
        this.resize()
    }
    // 删除卡片
    removeChart(chart) {
        let $oldChart = $(`#${chart.chartId}`)

        $oldChart.remove()
    }
    // 切换多选状态
    cutCheck(check) {
        this.#params.isCheck = check
    }
    // 隐藏所有下拉窗
    hideAllMenu = () => {
        $('.file-list-item .menu, .list-item .menu').hide()
        $('.file-list-item.active, .list-item.active').removeClass('active')
    }
    // 判断是否显示缩略图
    // hasShowThumbnail = ($content, $chart) => {
    //     const calc = ($chart) => {
    //         if (typeof $chart == 'object') {
    //             let $thumbnail = $chart.find('.file-img-container img')
    //             if ($chart[0] && !$thumbnail.attr('data-thumbnailed')) {
    //                 if (typeof $chart[0] == 'object') {
    //                     let { top, bottom } =
    //                         $chart[0].getBoundingClientRect()
    //                     let clientHeight = $content[0].clientHeight
    //                     if (bottom > 0 && top < clientHeight + 100) {
    //                         let $thumbnail = $chart.find(
    //                             '.file-img-container img'
    //                         )
    //                         pcUtil.loadListError($chart.find('img'))
    //                         $thumbnail.attr(
    //                             'src',
    //                             `${$thumbnail.attr(
    //                                 'data-src'
    //                             )}?t=${new Date().getTime()}`
    //                         )
    //                         $thumbnail.attr('data-thumbnailed', '1')
    //                     }
    //                 }
    //             }
    //         }
    //     }

    //     if ($chart) calc($chart)
    //     else if ($('.file-list-item[tp=chart]').length)
    //         Object.keys($('.file-list-item[tp=chart]')).map((k) =>
    //             calc($($('.file-list-item[tp=chart]')[k]))
    //         )
    // }

    // 重置卡片size
    resize($chart) {
        let { listType } = this.#params
        if (listType == 'icon') this.#setChartWidth($chart)
    }

    /**
     * 自定义绑定事件
     * @param {"事件标识"} k
     * @param {"回调函数"} callback
     */
    on(k, callback = function () { }) {
        this.#onKeys[k] = callback
    }
    menuOffset(that, clientX, clientY) {
        let _that = that
        let itemListWidth = _that.width() //获取当前列表项的宽度,
        let itemListHeight = _that.height() //获取当前列表项的高度， 减去一定的数，保持原有样式menu的顶部距离
        let _clientX = clientX //鼠标点击坐标x
        let _clientY = clientY //鼠标点击的坐标y
        let _menuWidth = _that.find('.menu').width() // 获取当前列下菜单的宽度
        let _menuHeight = _that.find('.menu').height() // 获取当前列下菜单的高度
        let _con_left = $('.con-left').width() + 47 //获取左侧导航的宽度
    }
    confirmDelete(res) {
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
                                    { type: 'cache', path: "history/cache.json", data: importClass.stringToBase64String(JSON.stringify(renderData.DataList)) }).then(() => {
                                        pageContext.resetAndloadFiles()
                                        resolve()
                                    })
                            }
                            // window.pageContext.renderHistoryWarp()

                        })
                        .catch((err) => {
                            console.log("获取文件列表失败---", err);
                            renderData.DataList = [];
                            resolve(renderData);
                        });
                }
            });
        })
    }
}

/**
 * 文件夹卡片模型
 * @param {"容器元素"} $FilesCon
 * @param {"listType"} listType
 * @param {"pageType"} pageType
 * @param {"卡片环境"} environment [search: 搜索结果 | ]
 */
export class FolderDom {
    #params = {
        listType: 'icon',
        pageType: '',
        $FoldersCon: null,
        environment: '',
        isSearch: false,
        parentId: 'root',
        isShowMenu: true
    }
    #onKeys = {
        /**
         * 绑定卡片外框点击事件
         * @returns {"文件夹 id"} folderId
         * @returns {"文件夹标题"} folderTitle
         * @returns {"event"} event
         */
        click: function (folderId, folderTitle, event) { },
        /**
         * 下拉框点击事件
         * @param {"事件类型"} tit
         * @param {"文件夹 id"} folderId
         * @param {"文件夹对象"} folder
         */
        menuClick: function (tit, folderId, folder) { },
    }
    #user = window.user || {}
    #fileOps = {
        view: "<li tit='view'><span class='icons_web'>&#xe6d4;</span> <div>浏览</div></li>",
        rename: "<li tit='rename'><span class='icons_web'>&#xe6d5;</span> <div>重命名</div></li>",
        colla: "<li tit='colla'><span class='icons_web'>&#xe71b;</span> <div>协作</div></li>",
        sharecolla:
            "<li tit='sharecolla'><span class='icons_web'>&#xe90a;</span> <div>分享协作</div></li>",
        uncolla: "<li tit='uncolla'><span class='icons_web'>&#xe932;</span> <div>退出协作</div></li>",
        open: "<li tit='open'><span class='icons_web'>&#xe932;</span> <div>打开</div></li>",
        pubpo: "<li tit='pubpo'><span class='icons_web'>&#xe6d7;</span> <div>发布和公开</div></li>",
        share: "<li tit='share'><span class='icons_web'>&#xe90a;</span> <div>分享</div></li>",
        down: "<li tit='down'><span class='icons_web'>&#xe939;</span> <div>下载</div></li>",
        clone: "<li tit='clone'><span class='icons_web'>&#xe6d9;</span> <div>克隆</div></li>",
        copy: "<li tit='copy'><span class='icons_web'>&#xe6db;</span> 复制或移动</li>",
        restore: "<li tit='restore'><span class='icons_web'>&#xe931;</span> <div>恢复</div></li>",
        delete: "<li tit='delete'><span class='icons_web'>&#xe934;</span> <div>彻底删除</div></li>",
        unfav: "<li tit='unfav'><span class='icons_web'>&#xe936;</span> <div>取消收藏</div></li>",
        del: "<li tit='del'><span class='icons_web'>&#xe712;</span> <div>删除</div></li>",
        location:
            "<li tit='location'><span class='icons'>&#xec32;</span> <div>文件位置</div></li>",
    }
    // 设置卡片宽度
    #setFolderWidth = ($folder) => {
        let { $FoldersCon } = this.#params
        let w = $FoldersCon.width()
        let count = Math.ceil(w / 200)

        if ($folder) {
            $folder.css({
                width: `${w / count - 16}px`,
            })
        } else {
            let items = document.getElementsByClassName('file-list-item')
            for (var i = 0, len = items.length; i < len; i++) {
                var item = items[i]

                if (item.getAttribute('tp') == 'folder')
                    item.style.cssText =
                        'width:-webkit-calc(' +
                        100 / count +
                        '% - 16px);width:calc(' +
                        100 / count +
                        '% - 16px);'
            }
        }
    }
    // 事件绑定
    #bindEvent = ($folder, folder) => {
        let that = this

        // 点击展示下拉菜单
        let showMenu = (e) => {
            e.stopPropagation()
            let { listType } = this.#params
            if (listType == 'icon') {
                $('.file-list-item .menu, .list-item .menu').css({
                    right: 0,
                    top: '40px',
                })
            } else {
                $('.file-list-item .menu, .list-item .menu').css({
                    right: 0,
                    top: '50px',
                })
            }
            let $thatFolder

            if (
                $(e.target).hasClass('file-list-item') ||
                $(e.target).hasClass('list-item')
            ) {
                $thatFolder = $(e.target)
            } else {
                $thatFolder = $(e.target).parents(
                    '.file-list-item, .list-item'
                )
            }
            that.#showMenu($thatFolder, e.clientX, e.clientY)

            let hideMenu = function (e) {
                if (e && $(e.target).parents('.menu').length) return
                $(document).off('mousedown', hideMenu)
                that.#hideMenu(e)
            }
            $(document).on('mousedown', hideMenu)
        }
        $folder.find('.op').off().on('click', showMenu)

        $folder.off('contextmenu', showMenu).on('contextmenu', function (e) {
            e.preventDefault()
            if (that.#params.isShowMenu) {
                if ($(this).hasClass('active')) {
                    that.#hideMenu(e)
                    return
                } else {
                    showMenu(e)
                }
            }
        })

        //下拉菜单中的事件
        $folder.find('.menu li[tit]').on('click', function (e) {

            $('#send-colla-invite').show()
            $('#send-colla-invite-loading').hide()
            e.stopPropagation()
            let tit = $(this).attr('tit')
            let folderId = $(this)
                .parents('.file-list-item, .list-item')
                .attr('id')

            if (tit == 'open') {
                $folder.click()
                return
            }
            if (!!tit)
                FileBusiness.func(
                    tit,
                    folderId,
                    'folder',
                    (folder, res) => {
                        switch (tit) {
                            case 'rename':
                                that.updataFolder(folder)
                                break
                            case 'location':
                            case 'del':
                            case 'delete':
                            case 'restore':
                                break
                            case 'copy':
                                if (res.type == 'move')
                                    that.removeFolder(folder)
                                break
                        }
                        that.#onKeys['menuClick'](
                            tit,
                            folderId,
                            folder,
                            res
                        )
                    }
                )
            that.#hideMenu()
        })

        // 打开文件夹
        $folder.off('click').on('click', function (e) {
            console.log(111)
            // 禁止打开文件的 pageType
            let folderId = $(this).attr('id')
            let folderTitle = $(this).find('label').text().trim()
            that.#onKeys['click'](folderId, folderTitle, e)
        })
    }
    // 显示下拉
    #showMenu = ($folder, clientX, clientY) => {
        this.#hideMenu()
        $('.menu, .help_shade, .shade_box, #noti-win').hide()
        $('.create-btn-list').removeClass('popover')
        ipc.sendToHost('hideTabMore')
        $folder.addClass('active')
        $folder.find('.menu').show()
        this.#setMenuPos($folder.find('.menu'), $folder, clientX, clientY)
    }
    // 隐藏下拉
    #hideMenu = () => {
        $('.file-list-item .menu, .list-item .menu').hide()
        $('.file-list-item.active, .list-item.active').removeClass('active')
    }
    // 构建卡片下拉
    #createMenu = ($folder, folder) => {
        let $menu = $folder.find('.menu')
        let $setIcon = $folder.find('.op')
        let $ul = $('<ul></ul>')
        let $lis = this.#getMenuList(folder)

        if ($lis.length < 1) {
            $ul.html('<li tit="">无更多操作</li>')
            if (this.#params.environment == 'search')
                $ul.append("<li tit='location'>文件位置</li>")
        } else {
            if (this.#params.environment == 'search')
                $lis.push(
                    "<li tit='location'><span class='icons'>&#xec32;</span> 文件位置</li>"
                )
            $lis.map(($li) => $ul.append($li))
        }

        $menu.html($ul)
    }
    // 获取下拉内容
    #getMenuList = (folder) => {
        let list = [],
            ops = this.#fileOps
        let { pageType, listType, isSearch, parentId, folderId } = this.#params

        if (pageType == 'trash') {
            list.push(ops['restore'])
            list.push(ops['delete'])
        } else if (pageType == 'colla') {
            const target = $('#dir_box').find('div.active')
            const isWithMe = $(target).attr('id') == 'colla_my' ? 0 : 1; //1 与我协作 0 我的协作
            if (isWithMe) {
                if (parentId == 'root') list.push(ops['uncolla'])
            } else {
                list.push(ops['rename'])
                list.push(ops['copy'])
                list.push(ops['sep'])
                list.push(ops['del'])
            }
        } else {
            list.push(ops['rename'])
            list.push(ops['sharecolla'])
            list.push(ops['copy'])
            list.push(ops['del'])
        }


        return list
        // switch (pageType) {
        //     case 'diagrams':
        //         list.push(ops['rename'])
        //         // list.push(ops["colla"]);
        //         // list.push(ops["sharecolla"]);

        //         if (folder.category == 'board') {
        //             list = []
        //             list.push(ops['rename'])
        //             list.push(ops['copy'])
        //             list.push(ops['del'])
        //         }
        //         break
        //     case 'history':
        //         list.push(ops['view'])
        //         list.push(ops['rename'])
        //         // list.push(ops["colla"]);
        //         // list.push(ops["sharecolla"]);
        //         list.push(ops['pubpo'])
        //         list.push(ops['share'])
        //         list.push(ops['down'])
        //         list.push(ops['copy'])
        //         list.push(ops['sep'])
        //         list.push(ops['del'])
        //         break
        //     case 'fav':
        //         list.push(ops['view'])
        //         list.push(ops['unfav'])
        //         break
        //     case 'colla':
        //         if (listType == 'chart') list.push(ops['view'])
        //         //如果是在子目录中，文件和文件夹都没有取消协作的操作
        //         if (parentId == 'root') list.push(ops['uncolla'])
        //         else list.push(ops['open'])
        //         break
        //     case 'trash':
        //         list.push(ops['restore'])
        //         list.push(ops['delete'])
        //         break
        // }
        return list
    }
    // 设置下拉定位
    #setMenuPos = ($menu, $folder, clientX, clientY) => {
        let _clientX = clientX //鼠标点击坐标x
        let _clientY = clientY //鼠标点击的坐标y
        let _menuWidth = $menu.width() // 获取当前列下菜单的宽度
        let _menuHeight = $menu.height() // 获取当前列下菜单的高度
        let _con_left = $('.con-left').width() //获取左侧导航的宽度
        let _con_right = $('.con-right').width() //获取左侧导航的宽度
        let windowWidth = document.documentElement.clientWidth
        let windowHeight = document.documentElement.clientHeight

        let { listType } = this.#params
        let { top } = pcUtil.getDistance($folder)
        let { right: mRight, bottom: mBottom } = pcUtil.getDistance($menu)
        let { top: oTop } = pcUtil.getDistance($folder.find('.op'))
        if (listType == 'icon') {
            if (mRight < 10) {
                $menu.css({
                    right: `${$menu.outerWidth() / 2}px`,
                })
                // $menu.css({ "right": `0px` });
            }
            if (mBottom <= 10) {
                $menu.css({
                    top: `-${$menu.outerHeight() + (10 - (oTop - top))}px`,
                })
            }
        } else if (listType == 'list' || listType == 'localList') {
            if (windowWidth - _clientX <= _menuWidth) {
                $menu.css({
                    right: `${$menu.outerWidth() / 2 + 20}px`,
                })
                // $menu.css({ "top": `${_clientY}px` });
            }
            if (windowHeight - _clientY <= _menuHeight) {
                $menu.css({
                    top: `-${$menu.outerHeight() + 40}px`,
                })
            }
            if (_clientX <= _con_left + _menuWidth) {
                $menu.css({
                    right: `${_con_right - _menuWidth - 24}px`,
                })
            }
            if (
                windowWidth - _clientX > _menuWidth &&
                _clientX > _con_left + _menuWidth
            ) {
                $menu.css({
                    right: `${windowWidth - _clientX - ($menu.outerWidth() / 2)}px`,
                })
            }
        }
    }

    // 设置模型参数
    constructor(params = {}) {
        this.#params = {
            ...this.#params,
            ...params,
        }
        this.#user.fullName = UserOperation.getFullName()
    }

    // 创建卡片dom
    createFolder(folder, flag) {
        let { listType, isSearch } = this.#params
        let fullName = !folder.creator
            ? this.#user.fullName
            : folder.creator.fullName
        let lastModify = folder.lastModify || folder.createDate

        if (folder.creator && folder.creator.userId == UserOperation.getUk())
            fullName = this.#user.fullName

        // lastModify = pcUtil.getCurrentTimeString(lastModify)
        folder.title = pcUtil.filterXss(folder.title)
        let $folder = $(`
                    <div class="list-item" data-sortnum="${folder.sortNum}"  tp="folder" id="${folder.folderId}">
                        <div class="col1">
                            <!-- <span class="icons_web" style="margin-right: 10px"><img src="src/assets/images/icon/folder_icon.svg" alt=""></span>
                           <div>${folder.title}</div>
                            <a><label>${folder.title}</a><label>-->
                            <div class="line">
                                <span class="icons_web"><img src="src/assets/images/icon/folder_icon.svg" alt=""></span>
                                <!--                            <div>${folder.title}</div>-->
                                                            <a><label>${folder.title}</label></a>
                            </div>
                            <div class="po-ops">
                             <span class="icons_web op">&#xe904;</span>
                            </div>
                        </div>
                        ${flag ? '<div class="col2"></div>' : ''}
                        
                        <div class="col3">
                        <span>${fullName}</span>
                        </div>
                        <div class="col4local">  <span>${pcUtil.$getPoTime(lastModify)}</span></div>
<!--                        <span class="icons op">&#xe742;</span>-->
                        <div class='menu' style="display: none;"></div>
                    </div>'`)
        if (listType == 'icon')
            $folder = $(`
                    <div class="file-list-item" data-sortnum="${folder.sortNum}" tp="folder" id="${folder.folderId}">
                        <div class="folder">
                            <span class="icons_web folder-ico"><img src="src/assets/images/icon/folder_icon.svg" alt=""></span>
                            <a class="title" href="javascript:;">
                                <label>${folder.title}</label>
                            </a>
                        </div>
                        <span class="icons_web op">&#xe904;</span>
                        <div class='menu' style="display: none;"></div>
                    </div>`)

        this.resize($folder)
        this.#createMenu($folder, folder)
        this.#bindEvent($folder, folder)

        return $folder
    }
    // 更新卡片dom
    updataFolder(folder) {
        let $oldFolder = $(`#${folder.folderId}`)
        let $newFolder = this.createFolder(folder)

        $newFolder.replaceAll($oldFolder)
    }
    // 删除卡片
    removeFolder(folder) {
        let $oldFolder = $(`#${folder.folderId}`)

        $oldFolder.remove()
    }
    // 隐藏所有下拉窗
    hideAllMenu = () => {
        $('.file-list-item .menu, .list-item .menu').hide()
        $('.file-list-item.active, .list-item.active').removeClass('active')
    }

    // 重置卡片size
    resize($folder) {
        let { listType } = this.#params
        if (listType == 'icon') this.#setFolderWidth($folder)
    }

    /**
     * 自定义绑定事件
     * @param {"事件标识"} k
     * @param {"回调函数"} callback
     */
    on(k, callback = function () { }) {

        this.#onKeys[k] = callback
    }
}

/**
 * 弹窗模型
 * @param {"容器元素"} $AlertCon
 * @param {"弹窗内容 string|$dom"} content
 * @param {"是否点击遮罩关闭"} maskClose [false]
 * @return {"弹窗 $dom"} $alertBox
 */
export class Alert {
    /* 内部变量 */
    #user = window.user || {}
    #params = {
        $AlertCon: $('body'),
        content: null,
        maskClose: false,
        notClose: false,
        title: '',
    }
    #onKeys = {
        /**
         * 弹窗关闭事件
         */
        close: function () { },
        /**
         * 弹窗打开事件
         */
        show: function () { },
    }
    // 事件绑定
    #bindEvent = ($alertBox, $alertMask) => {
        let { maskClose } = this.#params

        // 点击遮罩关闭
        $alertMask.off().on('click', () => {
            maskClose && this.close($alertBox, $alertMask)
        })

        // 点击叉号关闭
        $alertBox
            .find('.alert_close')
            .off()
            .on('click', () => this.close($alertBox, $alertMask))
    }

    /* 全局变量 */
    $alertBox = null
    $alertMask = null

    // 设置模型参数
    constructor(params = {}) {
        this.#params = {
            ...this.#params,
            ...params,
        }

        let { $AlertCon, content, title, notClose } = this.#params

        if ($('#alert_box').length) $('#alert_box').remove()

        this.$alertBox = $(HtmlStr['alertBox']())
        this.$alertBox.find('.alert_head').html(title)
        this.$alertBox.find('.alert_body').html(content)
        if ($('#alert_mask').length) this.$alertMask = $('#alert_mask')
        if (!$('#alert_mask').length)
            this.$alertMask = $(HtmlStr['alertMask']())
        if (notClose) {
            this.$alertBox.find('.alert_close').remove()
            this.$alertBox.find('.button[data-type=cancel]').remove()
        }

        $AlertCon.append(this.$alertBox)
        if (!$('#alert_mask').length) $AlertCon.append(this.$alertMask)

        this.#bindEvent(this.$alertBox, this.$alertMask)
    }

    open() {
        this.$alertMask.show()
        this.$alertBox.show()
        this.#onKeys['show']()
    }
    close(cancelDownload = true) {
        this.$alertMask.hide()
        this.$alertBox.hide()
        this.$alertMask.remove()
        this.$alertBox.remove()
        this.#onKeys['close']()
        if (cancelDownload) ipc.send('cancelDownload')
    }

    /**
     * 自定义绑定事件
     * @param {"事件标识"} k
     * @param {"回调函数"} callback
     */
    on(k, callback = function () { }) {
        console.log(callback)
        this.#onKeys[k] = callback
    }
}

/**
 * 软件更新弹窗
 * @return {"提示 $dom"} $tip
 */
export class Updata {
    #params = { $con: $(window), AlertClass: null }
    #restartShown = false
    #data = {
        backgroundUpdate: false,
        version: null,
        $upData: null,
        wgtURL: null,
        ws: null,
        description: '暂无',
    }
    #onKeys = {}

    // 初始化数据
    #init = () => {
        let { $upData, description = '' } = this.#data
        $upData
            .find('.v_upData[data-type=0] .newly .content')
            .html(description)
    }
    #isBackground = () => {
        const v = this.#data.backgroundUpdate
        return v === true || v === 1 || v === '1' || v === 'true'
    }
    #startBackgroundDownload = () => {
        window.__poTabUpdateBar = true
        const totalSize = this.#data.files?.[0]?.size || this.#data.files?.find?.((f) => f.size)?.size || 0
        window.__poUpdateProgress?.({ percent: 0, transferred: 0, receive: 0, total: totalSize }, 'progressing')
        const done = () => {
            window.__poTabUpdateBar = false
            this.#showRestartPrompt()
        }
        ipc.once('update_end', done)
        ipc.once('update_fail', () => {
            window.__poTabUpdateBar = false
            window.__poUpdateProgress?.('', 'update_fail')
        })
        ipc.send('beginDownLoad')
    }
    #showRestartPrompt = () => {
        if (this.#restartShown) return
        this.#restartShown = true
        Setting.updateSetting({ awaitRestart: true })
        const alert = new Alert({
            content: `
                <div class="v_upData" data-type="2">
                    <div class="title">更新完成</div>
                    <div class="newly"><div class="content">新版本已下载，是否立即重启？</div></div>
                    <div class="footer">
                        <div class="button" data-type="later">稍后</div>
                        <div class="button main" data-type="restartNow">立即重启</div>
                    </div>
                </div>
            `,
        })
        alert.$alertBox.css({ padding: '0px' })
        alert.$alertBox.find('.alert_head').remove()
        alert.$alertBox.find('.alert_close').off().on('click', () => alert.close(false))
        alert.$alertBox.find('.button[data-type=later]').on('click', () => alert.close(false))
        alert.$alertBox.find('.button[data-type=restartNow]').on('click', () => {
            alert.close(false)
            window.__poRestartForUpdate?.()
        })
        alert.open()
    }
    // 事件绑定
    #bindEvent = () => {
        let that = this
        let { AlertClass } = this.#params
        let { $upData, version, description = '' } = this.#data

        // 更新
        $upData
            .find('.v_upData[data-type=0] .button[data-type=update]')
            .off()
            .on('click', function () {
                if (that.#isBackground()) {
                    AlertClass.close(false)
                    that.#startBackgroundDownload()
                    return
                }
                let $progress = $(HtmlStr['upData'](1, version))
                $progress.find('.progress_line>div').css({
                    width: '0%',
                })
                $progress.find('.newly .content').html(description)
                const totalSize = that.#data.files?.[0]?.size || that.#data.files?.find?.((f) => f.size)?.size || 0
                if (totalSize) {
                    const total = pcUtil.byteConvert(totalSize)
                    $progress.find('.progress_num .progress_total').text(`${total.n}${total.unit}`)
                }
                AlertClass.$alertBox.find('.alert_close').remove()
                $progress
                    .find('.button[data-type=restart]')
                    .addClass('hide')
                $upData.html($progress)
                ipc.send('beginDownLoad')
            })
        // 取消
        $upData
            .find('.v_upData[data-type=0] .button[data-type=cancel]')
            .off()
            .on('click', function () {
                AlertClass.close()
            })
        // 重启
        let restart = () => {
            window.__poRestartForUpdate?.()
        }
        $upData
            .off(restart)
            .on(
                'click',
                '.v_upData[data-type=1] .button[data-type=restart]',
                restart
            )
    }

    // 设置模型参数
    constructor(params = {}) {
        this.#data = params
        let AlertClass = new Alert({
            content: HtmlStr['upData'](0, this.#data.version),
            notClose: this.#isBackground() ? false : this.#data.updateType,
        })
        AlertClass.$alertBox.css({
            padding: '0px',
        })
        AlertClass.$alertBox.find('.alert_head').remove()
        if (this.#isBackground()) {
            AlertClass.$alertBox.find('.button[data-type=update]').text('后台更新')
        }
        AlertClass.open()

        this.#params.AlertClass = AlertClass
        this.#data.$upData = AlertClass.$alertBox.find('.alert_body')

        this.#init()
        this.#bindEvent()
    }
    // 打开
    // 关闭

    /**
     * 自定义绑定事件
     * @param {"事件标识"} k
     * @param {"回调函数"} callback
     */
    on(k, callback = function () { }) {
        this.#onKeys[k] = callback
    }
}