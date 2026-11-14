

import { tabGroup } from './utils'
import { Toast } from './../class.js'
import FileDatabase from "./../operation/fileDatabase.js";
import HtmlStr from "./../htmlStr.js";
import Pay from "./tempCreate/pay/pay";
import { createApp } from 'vue'
import ImportDlg from './components/modal/dlgImport/index.vue'
import install from './tempCreate/Poui.js'
import Import from './components/modal/dlgImport/import.js'

import ServerUtil from '../server/server.js'
import { isMasSubmissionLite, masUnsupportedToast } from '../masSubmission.js'
const CONFIG = ipc.sendSync('getGlobal', 'CONFIG')
// let isOpenSave = false

let tabData = {
    workTypes: { 流程图: 'flow', 思维导图: 'mind', 思维笔记: 'outline', Markdown: 'markdown' },
    newType: localStorage.getItem('new_type') || 'flow',
    preRefreshTabId: [], // 支付成功后可能要刷新的tabid
    maxTab: 20,
    tabTimeoutMin: 2000,
    tabTimeoutMax: 60000,
    homeTabId: 0,
    icon_lock: `./src/assets/images/chose_lock.png`,
    newTabButtonText: '', // 下拉框内容
    localUploadArr: [],
    tabsPadding: 14,
}
sessionStorage.setItem('tabArr', '[]')
localStorage.setItem('isAllClose', '0')
localStorage.setItem('logout', '0')
function tabPreHideOrder() {
    setTimeout(() => {
        $('.active_pre').removeClass('active_pre')
        $('.etabs-tab.active').prev(':not(.hide)').addClass('active_pre')
    }, 100)
}


function initText() {
    let { workTypes, newType, newTabButtonText, icon_lock } = tabData
    // // 下拉框内容

    if (
        window.localStorage.getItem("new_type") &&
        window.localStorage.getItem("new_type") != "" &&
        window.localStorage.getItem("new_type") != "undefined"
    ) newType = window.localStorage.getItem("new_type");

    Object.keys(workTypes).map((k) => {
        if (workTypes[k] == newType) {
            $('.etabs-tab-button-new>span').text(`新建${k}`)
        }
        newTabButtonText += `<div class="shade_item" data-id="${workTypes[k]
            }"><img src="${icon_lock}" style="${workTypes[k] == newType ? '' : 'display: none;'
            };"/>${k}</div>`
    })
    let newTabTitle = "新建流程图";
    Object.keys(workTypes).map(k => {
        if (workTypes[k] == newType) newTabTitle = `新建${k}`;
    });
    $(".etabs-buttons").html(HtmlStr["etabsNewTab"](newTabButtonText, newTabTitle));
    $("body > .shade_box").html(newTabButtonText);
}

// 滚动存在 新建tab时候的逻辑
function moveTabToScrollableContainer(newTabElement) {
    const electronTabs = document.querySelector('tab-group');
    const shadowRoot = electronTabs.shadowRoot;
    const tabContainer = shadowRoot.querySelector('.etabs .tabs'); // 根据实际情况调整选择器
    const scrollableTabsContainer = tabContainer.querySelector('.scrollable-tabs-container'); // 确保选择正确的容器
    // 将新增的tab移入scrollableTabsContainer
    newTabElement.style.flexShrink = '0';
    newTabElement.style.minWidth = '106px';
    scrollableTabsContainer.appendChild(newTabElement);
    // setTimeout(() => {
    //     scrollableTabsContainer.scrollLeft = scrollableTabsContainer.scrollWidth + tabData.tabsPadding;
    // }, 100);
}

// 激活时候的滚动
function ensureTabVisible(tabElement) {
    const electronTabs = document.querySelector('tab-group');
    const shadowRoot = electronTabs.shadowRoot;
    const tabContainer = shadowRoot.querySelector('.etabs .tabs'); // 根据实际情况调整选择器
    const scrollableTabsContainer = tabContainer.querySelector('.scrollable-tabs-container'); // 确保选择正确的容器
    const tabRect = tabElement.getBoundingClientRect();
    const containerRect = scrollableTabsContainer.getBoundingClientRect();

    if (tabRect.left < containerRect.left) {
        // tab 在可视区域左侧不可见
        scrollableTabsContainer.scrollLeft -= (containerRect.left - tabRect.left + 30);
    } else if (tabRect.right > containerRect.right) {
        // tab 在可视区域右侧不可见
        scrollableTabsContainer.scrollLeft += (tabRect.right - containerRect.right + 30);
    }
}


export function checkScrollableTabs() {
    const electronTabs = document.querySelector('tab-group');
    const shadowRoot = electronTabs.shadowRoot;
    const tabContainer = shadowRoot.querySelector('.etabs .tabs');
    const scrollableTabsContainer = shadowRoot.querySelector('.scrollable-tabs-container');
    const allTabs = tabContainer.querySelectorAll('.etabs .tabs .scrollable-tabs-container .tab');
    const leftScroll = shadowRoot.querySelector('.etabs .nav .leftScroll');
    const rightScroll = shadowRoot.querySelector('.etabs .nav .rightScroll');
    const slideDownButton = shadowRoot.querySelector('.etabs .nav .slideDownButton');
    const slideDownArea = shadowRoot.querySelector('.etabs .nav .slideDownArea');

    if (!scrollableTabsContainer) return

    let totalWidth = 0;
    allTabs.forEach(tab => {
        totalWidth += tab.offsetWidth;
        console.log(tab.offsetWidth, totalWidth)
    });


    if (totalWidth > scrollableTabsContainer.offsetWidth) {
        scrollableTabsContainer.style.overflowX = 'scroll'; // 显示滚动条
        scrollableTabsContainer.style.overflowY = 'hidden'; // 显示滚动条
        leftScroll.style.display = 'flex';
        rightScroll.style.display = 'flex';
        slideDownButton.style.display = 'flex';
        scrollableTabsContainer.style.padding = `0 ${tabData.tabsPadding}px`;

        // 支持触控板左右滑动
        // scrollableTabsContainer.removeEventListener('wheel', wheelFun)
        // scrollableTabsContainer.addEventListener('wheel', wheelFun);

    } else {
        scrollableTabsContainer.style.overflow = 'initial'; // 隐藏滚动条
        leftScroll.style.display = 'none';
        rightScroll.style.display = 'none';
        scrollableTabsContainer.style.padding = '0';
        slideDownButton.style.display = 'none';
        setTimeout(() => {
            slideDownArea.style.display = 'none';
        }, 10);

        // 支持触控板左右滑动
        // scrollableTabsContainer.removeEventListener('wheel', wheelFun)

    }
}
// 监听事件
function initEvent() {

    tabGroup.on('tab-added', (tab, tg) => {
        // if (tg.tabContainer.childNodes.length > 1 && tg.tabContainer.childNodes[1].clientWidth <= 90) {
        //     $(tg.tabContainer).find('.tab-icon').css('display', 'none')
        // }
        // if (tg.tabContainer.childNodes.length > 1 && tg.tabContainer.childNodes[1].clientWidth <= tabData.tabsPadding) {
        //     $(tg.tabContainer).find('.tab-title').css('margin-left', '0px')
        //     $(tg.tabContainer).find('.tab-close').css('margin-left', '0px')
        // }
        if (tab.id == 0) {
            window.addEventListener('click', () => {
                tabGroup.getTab(0).webview.send("hideHome");
            })
        }
        // 判断是否需要加入到滑动的div中？
        if (tabGroup.showSlider) {
            const newTabElement = tab.element;
            moveTabToScrollableContainer(newTabElement);
        }
        setTimeout(() => {
            checkScrollableTabs();
        }, 500);

    })

    tabGroup.on("tab-removed", (tab, tg) => {
        if (tg.tabContainer.childNodes.length > 1 && tg.tabContainer.childNodes[1].clientWidth > 90) {
            $(tg.tabContainer).find('.tab-icon').css('display', 'block')
        }
        if (tg.tabContainer.childNodes.length > 1 && tg.tabContainer.childNodes[1].clientWidth > tabData.tabsPadding) {
            $(tg.tabContainer).find('.tab-title').css('margin-left', '12px')
            $(tg.tabContainer).find('.tab-close').not('.listAreaClose').css('margin-left', '10px')
        }

    });
    // 切换标签页回调
    tabGroup.on('tab-active', (tab) => {
        const { preRefreshTabId } = tabData
        // 当支付完成需要在对应的未刷新的webview relaod 一下，获取状态
        if (preRefreshTabId && preRefreshTabId.length) {
            const curId = tab.element.getAttribute('data-id')
            if (preRefreshTabId.includes(curId)) {
                tabGroup.getTab(Number(curId)).webview.reload()
                const curInd = preRefreshTabId.findIndex((item) => item === curId)
                preRefreshTabId.splice(curInd, 1)
            }
        }
        tabPreHideOrder()
        if (tabGroup.showSlider && tab.id) {
            ensureTabVisible(tab.element)
        }
        tabGroupExtend.handleVisibleInsertEditor()
        if (tab.id !== tabData.homeTabId) {
            tabGroupExtend.hideAiCreateWebviewTemp()
        } else {
            tabGroupExtend.restoreAiCreateWebview()
        }
        // tab.activate()
        // setTimeout(() => {
        //     tab.webview.focus()
        // }, 1000);

    })

    tabGroup.on('active', (tab) => {
        console.log('tabGroup ---- active')
    })

    tabGroup.on('webview-dom-ready', (tab) => {
        console.log('tabGroup ---- webview-dom-ready')
    })

    window.addEventListener('resize', () => {
        console.log('checkScrollableTabs')
        checkScrollableTabs();
        tabGroupExtend.updateAiCreateWebviewBounds()
    });
    window.addEventListener('online', () => {
        tabGroupExtend.handleAiCreateNetworkChange(true)
    })
    window.addEventListener('offline', () => {
        tabGroupExtend.handleAiCreateNetworkChange(false)
    })

    window.addEventListener('keydown', (e) => {
        const tab = tabGroup.getActiveTab()
        // if (tab.id != 0) {
        console.log('id', tab.id)
        console.log('down', e)
        // if (isOpenSave && e.code == 'Tab') return
        tab.webview.send('keydown', { metaKey: e.metaKey, shiftKey: e.shiftKey, altKey: e.altKey, key: e.key, ctrlKey: e.ctrlKey })
        // }
    })
}

function wheelFun(event) {
    if (event.deltaY === 0) {
        scrollableTabsContainer.scrollLeft += event.deltaX;
    }
}


function setStyle() {
    // 新建鼠标移入/移出前一个标签
    $('.etabs-buttons')
        .off('mouseover')
        .on('mouseover', function () {
            if (
                !$(this)
                    .parents('.etabs-tabgroup')
                    .find('.etabs-tabs .etabs-tab:last-child')
                    .hasClass('hover_pre')
            ) {
                $(this)
                    .parents('.etabs-tabgroup')
                    .find('.etabs-tabs .etabs-tab:last-child')
                    .addClass('hover_pre')
            }
        })
    $('.etabs-buttons')
        .off('mouseout')
        .on('mouseout', function () {
            $(this)
                .parents('.etabs-tabgroup')
                .find('.etabs-tabs .etabs-tab:last-child')
                .removeClass('hover_pre')
        })
    // 鼠标移入/移出标签
    $('.tabs')
        .off('mouseover', '.tab')
        .on('mouseover', '.tab', function () {
            if (!$(this).prev().hasClass('hover_pre')) {
                $('.tabs').find('.hover_pre').removeClass('hover_pre')
                $(this).prev().addClass('hover_pre')
            }
            if (!$(this).hasClass('homeTab')) {
                $(this)
                    .find('.etabs-tab-buttons .etabs-tab-button-close')
                    .addClass('icons')
                    .html('&#xe781;')
            }
        })
    $('.tabs')
        .off('mouseout', '.tab')
        .on('mouseout', '.tab', function () {
            $('.tabs').find('.hover_pre').removeClass('hover_pre')
        })

}

function newTab() {
    let homeWebview = tabGroup.getTab(0).webview;
    const { newType = 'flow' } = tabData
    switch (newType) {
        // 流程图
        case "flow":
            homeWebview.send("pong_event", { k: "createChart", args: ["flow", "flow", "新建流程图"] });
            break;
        // 思维导图
        case "mind":
            homeWebview.send("pong_event", { k: "createChart", args: ["mind", "mind_free", "新建思维导图"] });
            break;
        // 思维笔记
        case "outline":
            homeWebview.send("pong_event", { k: "createChart", args: ["outline", "outline", "新建思维笔记"] });
            break;
        // markdown
        case "markdown":
            homeWebview.send("pong_event", { k: "createChart", args: ["markdown", "markdown", "新建Markdown"] });
            break;
        // 从模板新建
        case "template":
            tabGroupExtend.addTab({ title: "模板社区", src: `/diagrams/new#template`, type: "url" });
            break;
        // 未选择时展开下拉框
        default:
            $(".tab_more").click();
            break;
    }
};

function dropDown() {

    // 展开选择框
    $(".tab_more").off().on("click", function () {
        let hide = function () {
            $(".shade_box").hide();
            $(".shade_bg").hide();
            $(".tab_more").removeClass("up");
        };

        if (!$(".shade_box").is(":hidden")) {
            hide();
            return false;
        }
        var btnRect = $(".etabs-tab-button-new")[0].getBoundingClientRect();
        var shadeBox = $(".shade_box");
        shadeBox.show();
        var shadeW = shadeBox.outerWidth();
        shadeBox.css({
            top: btnRect.bottom + "px",
            left: (btnRect.left + btnRect.width / 2 - shadeW / 2) + "px"
        });
        $(".tab_more").addClass("up")
        event.stopPropagation();
        $(document).off("click", hide).on("click", hide);
    });

    $(".shade_item").off().on("click", function () {
        let id = $(this).attr("data-id");
        let { newType, workTypes } = tabData
        if (id != newType) {
            $(`.shade_item img`).hide();
            $(`.shade_item[data-id=${id}] img`).show();
            Object.keys(workTypes).map(k => {
                if (workTypes[k] == id) {
                    $(".etabs-tab-button-new>span").text(`新建${k}`);
                }
            });
            tabData.newType = id;
            window.localStorage.setItem("new_type", id);
        }
        $(".shade_box").hide();
        $(".shade_bg").hide();
        $(".tab_more").removeClass("up");


        newTab();
        hideTabMore();
        event.stopPropagation();
        return false;
    });
    $('.etabs-tab-button-new').off().on('click', function (e) {
        if (e.target.className != 'tab_more') {
            newTab()
        }
    })
}


export function showTabSlider() {
    const electronTabs = document.querySelector('tab-group');

    // 获取Shadow DOM根节点
    const shadowRoot = electronTabs.shadowRoot;
    const etabContainer = shadowRoot.querySelector('.etabs nav');
    const tabContainer = shadowRoot.querySelector('.etabs .tabs'); // 根据实际情况调整选择器
    const scrollable = shadowRoot.querySelector('.scrollable-tabs-container');
    if (scrollable) return

    const style = document.createElement('style');
    style.textContent = `
     @font-face {
        font-family: 'iconfont'; /* Project id 142592 */
        src: url('./src/assets/css/pc/iconfont/iconfont.woff2') format('woff2'),
          url('./src/assets/css/pc/iconfont/iconfont.woff') format('woff'),
          url('./src/assets/css/pc/iconfont/iconfont.ttf') format('truetype');
      }

      .icons_web {
        font-family: 'iconfont' !important;
        font-size: 16px;
        font-style: normal;
        cursor: pointer;
      }
      ::-webkit-scrollbar {
         width: 8px;
         height: 5px;
         border-width: 0;
         border-color: #fff;
         border-radius: 4px;
      }


      ::-webkit-scrollbar-thumb {
        border-width: 2px;
        border-style: solid;
        border-color: #fff;
        border-radius: 12px;
        background-color: #c6c6c6;
    }
    `;
    shadowRoot.appendChild(style);

    const leftScroll = document.createElement('div');
    leftScroll.innerHTML = '<span class="icons_web">&#xe970;</span>';
    leftScroll.style.cssText = 'color:#6C7D8F;position: absolute; left: 104px; top: 0; bottom: 0; width: 28px; height:32px;background-image:url("./src/assets/images/Subtract.png"); z-index: 1000; cursor: pointer; display: none; align-items: center; justify-content: center;';
    leftScroll.classList.add('leftScroll');
    const rightScroll = document.createElement('div');
    rightScroll.innerHTML = '<span class="icons_web">&#xe971;</span>';
    rightScroll.style.cssText = 'color:#6C7D8F;position: absolute; right: -8px; top: 0; bottom: 0; width: 28px; height:32px; background-image:url("./src/assets/images/Subtract.png"); z-index: 1000; cursor: pointer; display: none; align-items: center; justify-content: center;';
    rightScroll.classList.add('rightScroll');

    // 创建一个新的容器，包裹住除第一个tab外的其他tabs
    const scrollableTabsContainer = document.createElement('div');
    scrollableTabsContainer.style.display = 'flex';
    // scrollableTabsContainer.style.padding = '0 32px';
    scrollableTabsContainer.style.overflowX = 'auto'; // 允许滚动
    scrollableTabsContainer.style.overflowY = 'hidden';
    scrollableTabsContainer.style.flexGrow = '1';
    scrollableTabsContainer.style.whiteSpace = 'nowrap'; // 防止换行
    scrollableTabsContainer.style.scrollBehavior = 'smooth'; // 添加平滑滚动

    // 自定义滚动条样式
    scrollableTabsContainer.style.msOverflowStyle = 'none';  // IE and Edge
    scrollableTabsContainer.style.scrollbarWidth = 'none';  // Firefox
    scrollableTabsContainer.style.overflow = '-moz-hidden-unscrollable'; // Firefox
    scrollableTabsContainer.style.width = 'calc(100% - 222px)'; // Firefox

    scrollableTabsContainer.classList.add('no-scrollbar');
    scrollableTabsContainer.classList.add('scrollable-tabs-container');

    // 5.13.1 展示当前已经打开的 tab
    const slideDownButton = document.createElement('div')
    slideDownButton.innerHTML = '<span class="icons_web">&#xe70b;</span>';
    slideDownButton.style.cssText = `
    color:#212930;
    width: 40px;
    transform: translateX(-4px);
    height:32px;background-image:url("./src/assets/images/Subtract2.png");
    z-index: 1001; cursor: pointer; display: none;
    align-items: center; justify-content: center;
    `;
    slideDownButton.classList.add('slideDownButton')


    // 当前tab 的下拉文件列表
    const slideDownArea = $("<div>", {
        css: {
            display: 'none',
            width: '240px',
            zIndex: '2',
            maxHeight: '338px',
            boxSizing: 'border-box',
            padding: '16px 8px 10px 8px',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '8px',
            overflowY: 'scroll',
            overflowX: 'hidden',
            borderRadius: '8px',
            background: '#ffffff',
            position: 'absolute',
            top: '100%',
            left: "0",
            boxShadow: '0px 12px 32px 0px rgba(0, 0, 0, 0.08)'
        }
    });
    slideDownArea.addClass('slideDownArea')

    const renderSlideDownArea = () => {
        const firstDivOffset = $(slideDownButton).position();
        const firstDivHeight = $(slideDownButton).outerHeight();
        // 处理当前打开的tab 数据
        let tabArr = tabGroup.getTabs()
        console.log(tabArr)
        $(slideDownArea).empty()
        const listNumberEl = $(`<div style='padding:6px 8px;font-weight:500;'>打开的文件  <span style='font-weight:400;color: #9AA5B8;font-size: 13px;margin-left:8px'>${tabArr.length - 1}个</span></div>`)
        $(slideDownArea).append(listNumberEl[0])
        tabArr.map(item => {

            if (item.id !== 0) {
                const categoryIconEl = $(item.element).find('span.tab-icon').clone()
                const titleEl = $(item.element).find('span.tab-title').clone()
                $(titleEl).css({
                    width: '130px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer'
                })
                $(titleEl).off('click')
                $(titleEl).on('click', () => {
                    let tab = tabGroup.getTab(item.id);
                    tab.activate();
                })
                const fileTypeIconEl = $(item.element).find('span.icons_web.tab-file-icon').clone()
                const tabClose = $("<span class='tab-close listAreaClose' style='margin-left:auto !important;margin-right:15px !important'><button>×</button></span>")
                $(tabClose).off('click')
                $(tabClose).on('click', () => {
                    const nowTab = tabGroup.getTab(item.id)
                    if (nowTab) { nowTab.close() }
                    $(tabClose).parent().detach()
                    setTimeout(() => {
                        renderSlideDownArea()
                    }, 50);
                })
                const appendDom = fileTypeIconEl.length ? [categoryIconEl[0], titleEl[0], fileTypeIconEl[0], tabClose[0]] : [categoryIconEl[0], titleEl[0], tabClose[0]]

                const listWarp = $("<div class='slideDwonAreaItem'>").append(appendDom)
                $(listWarp).css({
                    padding: '6px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '13px',
                    width: '220px'
                })
                $(slideDownArea).append(listWarp)
            }

        })

        $(slideDownArea).css({
            display: 'flex',
            position: 'absolute',
            top: firstDivOffset.top + firstDivHeight + 'px',
            left: firstDivOffset.left + 'px'
        });
    }
    $(slideDownButton).on('mouseenter', (e) => {
        console.log('mousein')
        renderSlideDownArea()
        // append 到容器中
    })
    $(slideDownArea).on('mouseleave', () => {
        $(slideDownArea).hide()
        // console.log('mouseout')
    })

    // 获取所有tabs
    const allTabs = tabContainer.querySelectorAll('.etabs .tabs .tab');
    console.log("allTabs", allTabs)
    const homeTab = allTabs[0];
    homeTab.style.flexShrink = '0'; // 确保homeTab不会被缩小

    // // 将除第一个tab外的其他tabs移入scrollableTabsContainer
    for (let i = 1; i < allTabs.length; i++) {
        allTabs[i].style.flexShrink = '0'; // 确保其他tabs不会被缩小
        allTabs[i].style.minWidth = '106px'; // 设置tabs的最小宽度
        scrollableTabsContainer.appendChild(allTabs[i]);
    }


    // // 将homeTab和scrollableTabsContainer插回tabContainer
    tabContainer.innerHTML = '';
    tabContainer.appendChild(homeTab);
    tabContainer.appendChild(slideDownButton)
    tabContainer.appendChild(slideDownArea[0])
    tabContainer.appendChild(scrollableTabsContainer);


    // // 将按钮插入到shadowRoot中
    etabContainer.appendChild(leftScroll);
    etabContainer.appendChild(rightScroll);
    // 滚动量
    const scrollAmount = 106;

    // 监听按钮点击事件，进行左右滚动
    leftScroll.addEventListener('click', () => {
        scrollableTabsContainer.scrollLeft -= scrollAmount;
    });

    rightScroll.addEventListener('click', () => {
        scrollableTabsContainer.scrollLeft += scrollAmount;
    });

    scrollableTabsContainer.addEventListener('wheel', wheelFun);

    tabGroup.showSlider = true
    // 设置 tab 的新增和关闭事件处理


}



export function initTabGroup() {
    // 初始化
    initText()
    dropDown()
    initEvent()

    // setStyle()
    // return { tabGroup, tabGroupExtend }
}

const hideTabMore = function (e) {
    if (!e || !$(e.target).parents().hasClass("popWindow")) {
        $(".popWindow").hide();
    }
    if (e && $(e.target).hasClass("tab_more")) return;
    $(".shade_box").hide();
    $(".shade_bg").hide();
    $(".shade_user_box").hide();
    $(".float-popup.dir-left").hide();
    window.hideAiPointPopup && window.hideAiPointPopup();

    if (!e || $(e.target).hasClass("popWindow")) {
        $(".popWindow").hide();
    }
    $(".tab_more").removeClass("up");
};


let handlerEvent = {
    element: []
}

const NavMap = {
    'templateCreate': '从模版新建',
    'history': '最近',
    'diagrams': '云文件',
    'colla': '协作',
    'fav': '我的收藏',
    'trash': '回收站'
}
let homeNav = ''
const AI_CREATE_OVERLAY_ID = 'ai_create_overlay_wrap'
const AI_CREATE_OVERLAY_WEBVIEW_ID = 'ai_create_overlay_webview'
const AI_CREATE_OFFLINE_ID = 'ai_create_offline_state'
const AI_WEBVIEW_CLEAR_PAY_MASK_BODY = `
    try {
        const dlgPayEl = document.getElementById('po-dialog-dlgPay-21');
        if (dlgPayEl) {
            if (dlgPayEl.__vue__ && typeof dlgPayEl.__vue__.toClose === 'function') {
                dlgPayEl.__vue__.toClose();
            } else {
                const closeBtn = dlgPayEl.querySelector('.dialog-close');
                closeBtn && closeBtn.click();
            }
            dlgPayEl.style.display = 'none';
        }
        const iframeDlg = document.getElementById('po-dialog-iframe-dlgPay');
        if (iframeDlg) {
            const iframeCloseBtn = iframeDlg.querySelector('.dialog-close');
            iframeCloseBtn && iframeCloseBtn.click();
            iframeDlg.remove();
        }
        const app = document.querySelector('#app');
        const root = app && app.__vue__;
        if (root && root.$getComponents) {
            try {
                const popMain = root.$getComponents('popMain');
                if (popMain) {
                    ['dlgPay', 'dlgPayActivity', 'dlgPaySave'].forEach((name) => {
                        if (popMain.digShow && Object.prototype.hasOwnProperty.call(popMain.digShow, name)) {
                            popMain.digShow[name] = false;
                        }
                        if (popMain.emDigShow) popMain.emDigShow({ name, value: false });
                    });
                    popMain.maskShow = false;
                }
            } catch (_e) {}
        }
        document.querySelectorAll('#window-mask,.window-mask,.ui-widget-overlay,.dlg-twice-bg,.shade_box,.shade_bg,.po-dlg-mask').forEach((el) => {
            try { el.remove(); } catch (_e) {}
        });
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
    } catch (_e) {}
`
const AI_WEBVIEW_CLEAR_PAY_MASK_SCRIPT = `(() => {${AI_WEBVIEW_CLEAR_PAY_MASK_BODY}})();`
const CREATE_BTN_LIST_OVERLAY_ID = 'create_btn_list_overlay'
const INDEX_NEW_FOLDER_DLG_ID = 'dlg_new_folder'
const INDEX_MODAL_MASK_ID = 'index_modal_mask'
let aiCreateWebviewOpened = false
let aiCreateLastUrl = ''
let aiCreateSuspended = false
let createBtnListDocClickBinded = false
let indexDialogDocClickBinded = false
let indexImportInited = false
let indexFolderDlgCssText = ''
let importFileInterceptors = null

function getCreateBtnListOverlayWrap() {
    let wrap = document.getElementById(CREATE_BTN_LIST_OVERLAY_ID)
    if (!wrap) {
        wrap = document.createElement('div')
        wrap.id = CREATE_BTN_LIST_OVERLAY_ID
        wrap.style.cssText = 'display:none;position:fixed;z-index:20;left:0;top:0;pointer-events:auto;'
        wrap.addEventListener('click', (e) => {
            const target = e.target && e.target.closest ? e.target.closest('div[data-btn]') : null
            if (!target) return
            const btn = target.getAttribute('data-btn') || ''
            const homeTab = tabGroup.getTab(tabData.homeTabId)
            if (homeTab && homeTab.webview) {
                const safeBtn = btn.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
                homeTab.webview.executeJavaScript(`(()=>{var el=document.querySelector(".create-btn-list div[data-btn='${safeBtn}']");if(el){el.click();}})();`)
            }
            tabGroupExtend.hideCreateBtnListOverlay()
            e.stopPropagation()
        })
        document.body.appendChild(wrap)
    }
    return wrap
}

function closeCreateBtnListInHomeWebview() {
    const homeTab = tabGroup.getTab(tabData.homeTabId)
    if (!homeTab || !homeTab.webview) return
    homeTab.webview.executeJavaScript(`(()=>{if(window.pageContext&&pageContext._hideAlert&&pageContext._hideAlert.hideNewMenu){pageContext._hideAlert.hideNewMenu();}})();`)
}

function clearWindowMaskEverywhere() {
    try {
        document.querySelectorAll('#window-mask,.window-mask').forEach((el) => {
            try { el.style.display = 'none' } catch (_e) { }
            try { el.remove() } catch (_e) { }
        })
    } catch (_e) { }
    try {
        const homeTab = tabGroup.getTab(tabData.homeTabId)
        if (homeTab && homeTab.webview) {
            homeTab.webview.executeJavaScript(`(()=>{try{document.querySelectorAll('#window-mask,.window-mask').forEach((el)=>{try{el.style.display='none'}catch(_e){};try{el.remove()}catch(_e){}})}catch(_e){}})();`)
        }
    } catch (_e) { }
}

function getIndexModalMask() {
    let mask = document.getElementById(INDEX_MODAL_MASK_ID)
    if (!mask) {
        mask = document.createElement('div')
        mask.id = INDEX_MODAL_MASK_ID
        mask.style.cssText = 'display:none;position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(33,41,48,.35);z-index:24;'
        mask.addEventListener('click', () => {
            closeIndexLayerDialogs()
        })
        document.body.appendChild(mask)
    }
    return mask
}

function closeIndexLayerDialogs() {
    clearWindowMaskEverywhere()
    const folderDlg = document.getElementById(INDEX_NEW_FOLDER_DLG_ID)
    if (folderDlg) {
        try {
            if ($(folderDlg).hasClass('dialog-box')) {
                $(folderDlg).dialog('destroy')
            }
        } catch (_e) { }
        folderDlg.style.display = 'none'
    }
    const importCover = document.getElementById('importRootCover')
    const importRoot = document.getElementById('importRoot')
    if (importCover) importCover.style.display = 'none'
    if (importRoot) importRoot.style.display = 'none'
    if (window.VueImportApp) {
        try {
            window.VueImportRoot = null
            window.VueImportApp.unmount()
            window.VueImportApp = null
        } catch (_e) { }
    }
    if (importRoot) importRoot.innerHTML = ''
    const mask = document.getElementById(INDEX_MODAL_MASK_ID)
    if (mask) mask.remove()
    clearWindowMaskEverywhere()
    try {
        $('.ui-widget-overlay').remove()
    } catch (_e) { }
    if (importFileInterceptors) {
        document.removeEventListener('change', importFileInterceptors.change, true)
        document.removeEventListener('drop', importFileInterceptors.drop, true)
        importFileInterceptors = null
    }
}

function getIndexFolderDlgCssText() {
    if (indexFolderDlgCssText) return indexFolderDlgCssText
    let cssText = ''
    const hitSelectors = [
        '#dlg_new_folder',
        '#folder_new_title',
        '#btn_submit_folder',
        '.close-block',
        '.close-btn',
        '.close-icons',
        '.dlg-content',
        '.dlg-buttons',
        '.pro-btn',
        '.input',
        '.dialog',
        '.dialog-close',
        '.window-mask'
    ]
    try {
        const sheets = Array.from(document.styleSheets || [])
        sheets.forEach((sheet) => {
            let rules = []
            try {
                rules = Array.from(sheet.cssRules || [])
            } catch (_e) {
                return
            }
            rules.forEach((rule) => {
                const selector = rule && rule.selectorText ? rule.selectorText : ''
                if (!selector) return
                if (hitSelectors.some(item => selector.indexOf(item) > -1)) {
                    cssText += '\n' + rule.cssText
                }
            })
        })
    } catch (_e) { }
    indexFolderDlgCssText = cssText
    return cssText
}

function mapAiWindowOpenUrlToEditorSrc(rawUrl = '') {
    if (!rawUrl) return null
    const hostObj = ipc.sendSync('getHost') || {}
    const host = hostObj.host || ipc.sendSync('getGlobal', 'host') || ''
    let parsed
    try {
        parsed = new URL(rawUrl, host)
    } catch (_e) {
        return null
    }
    const pathname = parsed.pathname || ''
    let editorPath = ''
    let isMind = false
    if (pathname.startsWith('/diagraming')) {
        editorPath = './src/v5_editor/source/compile/diagrams/index.html'
    } else if (pathname.startsWith('/mindmap')) {
        editorPath = './src/v5_editor/source/compile/mindmap/index.html'
        isMind = true
    } else {
        return null
    }
    const match = pathname.match(/^\/(?:diagraming|mindmap)\/([^/?#]+)/)
    const chartId = (match && match[1]) ? match[1] : (parsed.searchParams.get('chartId') || '')
    // 云文件编辑链接必须带 chartId
    if (!chartId) return null
    return {
        src: `${editorPath}?token=token&chartId=${encodeURIComponent(chartId)}`,
        title: isMind ? '未命名思维导图' : '未命名流程图'
    }
}

function openAiLocalEditorTab(rawUrl = '') {
    const mapped = mapAiWindowOpenUrlToEditorSrc(rawUrl)
    if (!mapped) return false
    let chartId = ''
    const idMatch = String(mapped.src).match(/[?&]chartId=([^&]+)/)
    if (idMatch) chartId = decodeURIComponent(idMatch[1])
    if (chartId) {
        const tabs = tabGroup.getTabs()
        for (let i = 0; i < tabs.length; i++) {
            const tab = tabs[i]
            if (tab.element && tab.element.getAttribute('data-chartid') === chartId) {
                tab.activate()
                return true
            }
        }
    }
    hideTabMore()
    tabGroupExtend.hideCreateBtnListOverlay()
    tabGroupExtend.addTab({
        src: mapped.src,
        title: mapped.title
    }).then((tab) => {
        if (tab && tab.element && chartId) tab.element.setAttribute('data-chartid', chartId)
    })
    return true
}

function openMermaidOnlineFileTab(rawUrl = '') {
    if (!rawUrl) return
    const hostObj = ipc.sendSync('getHost') || {}
    const host = hostObj.host || ipc.sendSync('getGlobal', 'host') || ''
    let parsed
    try {
        parsed = new URL(rawUrl, host)
    } catch (_e) {
        return
    }
    const match = (parsed.pathname || '').match(/^\/(diagraming|mindmap|outline)\/([^/?#]+)/)
    if (!match) return
    const kind = match[1]
    const chartId = match[2]
    if (!chartId) return
    const tabs = tabGroup.getTabs()
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i]
        if (tab.element && tab.element.getAttribute('data-chartid') === chartId) {
            tab.activate()
            return
        }
    }
    const titleMap = { mindmap: '未命名思维导图', outline: '未命名大纲', diagraming: '未命名流程图' }
    hideTabMore()
    tabGroupExtend.hideCreateBtnListOverlay()
    tabGroupExtend.addTab({
        src: `/${kind}/${chartId}`,
        type: 'url',
        title: titleMap[kind] || '未命名流程图'
    }).then((tab) => {
        if (tab && tab.element) {
            tab.element.setAttribute('data-chartid', chartId)
        }
    })
}

function appendUtmChannelParams(url) {
    if (!url || typeof url !== 'string' || url.indexOf('utm_source=') === -1) return url
    if (url.indexOf('channelType=') > -1 || url.indexOf('sourceType=') > -1) return url
    return url + '&channelType=po&sourceType=pc'
}

function normalizeAiUrl(rawUrl = '') {
    if (!rawUrl) return ''
    const hostObj = ipc.sendSync('getHost') || {}
    const host = hostObj.host || ipc.sendSync('getGlobal', 'host') || ''
    try {
        return appendUtmChannelParams(new URL(rawUrl, host).toString())
    } catch (_e) {
        return ''
    }
}

function isAiRouteUrl(rawUrl = '') {
    const fullUrl = normalizeAiUrl(rawUrl)
    if (!fullUrl) return false
    try {
        const parsed = new URL(fullUrl)
        return parsed.pathname.startsWith('/ai')
    } catch (_e) {
        return false
    }
}

function getAiCreateOverlayElements() {
    let wrap = document.getElementById(AI_CREATE_OVERLAY_ID)
    if (!wrap) {
        wrap = document.createElement('div')
        wrap.id = AI_CREATE_OVERLAY_ID
        wrap.style.cssText = 'display:none;position:fixed;left:240px;top:40px;right:0;bottom:0;z-index:8;background:#fff;overflow:hidden;'
        document.body.appendChild(wrap)
    }

    let webview = document.getElementById(AI_CREATE_OVERLAY_WEBVIEW_ID)
    if (!webview) {
        webview = document.createElement('webview')
        webview.id = AI_CREATE_OVERLAY_WEBVIEW_ID
        webview.setAttribute('disablewebsecurity', 'true')
        webview.setAttribute('nodeintegration', 'false')
        webview.setAttribute('disable-http-cache', 'true')
        webview.setAttribute('allowpopups', 'true')
        webview.setAttribute('enableblinkfeatures', 'ClipboardAPI')
        webview.setAttribute('preload', "file://" + path.resolve(`${__dirname}/index.js`))
        webview.style.cssText = 'position:absolute;left:0;top:0;right:0;bottom:0;width:100%;height:100%;border:0;display:block;background:#fff;'
        webview.style.width = `${Math.max(0, window.innerWidth - 240)}px`
        webview.style.height = `${Math.max(0, window.innerHeight - 40)}px`
        wrap.appendChild(webview)
        webview.addEventListener('console-message', (e) => {
            console.log('[ai-webview-console]', e.message)
        })
        webview.addEventListener('did-navigate', () => {
            if (CONFIG.isOpenDevTool) webview.openDevTools()
        })
        webview.addEventListener('ipc-message', (e) => {
            if (e.channel === 'showDlgPayWebView') {
                tabGroupExtend.showDlgPayWebView(e.args[0] || {})
                return
            }
            if (e.channel === 'hideTabMore') {
                hideTabMore()
                tabGroupExtend.hideCreateBtnListOverlay()
                return
            }
            if (e.channel === 'goHomeDiagrams') {
                hideTabMore()
                tabGroupExtend.hideCreateBtnListOverlay()
                tabGroupExtend.closeAiCreateWebview()
                const chartId = e.args && e.args[0] ? String(e.args[0]).trim() : ''
                const homeTab = tabGroup.getTab(tabData.homeTabId)
                if (homeTab && homeTab.webview) {
                    if (chartId) {
                        homeTab.webview.send('pong_event', { k: 'locateChart', args: [chartId] })
                    } else {
                        homeTab.webview.executeJavaScript(`(() => {
                            const el = document.querySelector('.con-left .con-left-btn a[data-nav="diagrams"]');
                            if (el) el.click();
                        })();`)
                    }
                }
            }
            if (e.channel === 'openMermaidOnlineFile') {
                openMermaidOnlineFileTab(e.args && e.args[0] ? String(e.args[0]) : '')
            }
            if (e.channel === 'openAiLocalChart' || e.channel === 'windowOpenBlocked') {
                openAiLocalEditorTab(e.args && e.args[0] ? String(e.args[0]) : '')
            }
        })
        webview.addEventListener('dom-ready', () => {
            webview.executeJavaScript(`
                (() => {
                    if (!document.getElementById('__aiHideChrome')) {
                        const css = document.createElement('style');
                        css.id = '__aiHideChrome';
                        css.textContent = '.workspace-chrome.workspace-chrome--header,.workspace-chrome.workspace-chrome--footer{display:none!important;}';
                        (document.head || document.documentElement).appendChild(css);
                    }
                    const send = function() {
                        const fn = window.api && window.api.ipcRenderer && window.api.ipcRenderer.sendToHost;
                        if (fn) fn.apply(window.api.ipcRenderer, arguments);
                    };
                    const killWebPay = function() {
                        var noop = function() {};
                        var patch = function(obj) {
                            if (!obj) return;
                            try { obj.iframeDlg = noop; } catch (_e) {}
                            try {
                                if (!obj.pay) obj.pay = {};
                                obj.pay.init = noop;
                            } catch (_e2) {}
                        };
                        patch(window.insert);
                        patch(window.insert_c);
                        document.querySelectorAll('#po-dialog-iframe-dlgPay,.po-dialog-iframe[id*=\"dlgPay\"],#po-dialog-dlgPay-21').forEach(function(el) {
                            try { el.remove(); } catch (_e) {}
                        });
                        document.querySelectorAll('iframe').forEach(function(f) {
                            try {
                                var w = f.contentWindow;
                                if (!w) return;
                                patch(w.insert);
                                patch(w.insert_c);
                                if (w.PoEditorInsert && typeof w.PoEditorInsert.pay === 'function' && !w.PoEditorInsert.pay.__aiMuted) {
                                    w.PoEditorInsert.pay = function(opt) {
                                        try {
                                            window.parent.postMessage({ type_pay: 'download_member', pay_data: opt || {} }, '*');
                                        } catch (_e) {}
                                    };
                                    w.PoEditorInsert.pay.__aiMuted = true;
                                }
                            } catch (_e) {}
                        });
                    };
                    killWebPay();
                    if (!window.__aiKillWebPayTimer) {
                        window.__aiKillWebPayTimer = setInterval(killWebPay, 600);
                    }
                    const getToken = function() {
                        try {
                            var t = localStorage.getItem('processon_token') || '';
                            if (t) return t;
                        } catch (_e) {}
                        try {
                            var m = (document.cookie || '').match(/(?:^|;\\\\s*)token=([^;]*)/);
                            return m ? decodeURIComponent(m[1]) : '';
                        } catch (_e2) { return ''; }
                    };
                    const patchMermaidIframe = function(iframe) {
                        if (!iframe) return;
                        try {
                            var doc = iframe.contentDocument;
                            if (!doc) return;
                            var token = getToken();
                            if (token) {
                                try { doc.cookie = 'token=' + token + ';path=/'; } catch (_e) {}
                            }
                            if (!doc.getElementById('__aiPanelZ')) {
                                var style = doc.createElement('style');
                                style.id = '__aiPanelZ';
                                style.textContent = '.ai-panel-container{z-index:99999!important;}';
                                (doc.head || doc.documentElement).appendChild(style);
                            }
                            var win = iframe.contentWindow;
                            if (win && !win.__aiMermaidTokenPatched) {
                                win.__aiMermaidTokenPatched = true;
                                win.addEventListener('message', function(e) {
                                    try {
                                        if (e.data && e.data.token) {
                                            doc.cookie = 'token=' + e.data.token + ';path=/';
                                            if (win.Util && win.Util.setCookie) win.Util.setCookie('token', e.data.token);
                                        }
                                    } catch (_e) {}
                                });
                                if (token) {
                                    try {
                                        doc.cookie = 'token=' + token + ';path=/';
                                        if (win.Util && win.Util.setCookie) win.Util.setCookie('token', token);
                                        win.postMessage({ token: token, userId: window.userId, member: window.member }, '*');
                                    } catch (_e) {}
                                }
                            } else if (win && token) {
                                try {
                                    doc.cookie = 'token=' + token + ';path=/';
                                    if (win.Util && win.Util.setCookie) win.Util.setCookie('token', token);
                                } catch (_e) {}
                            }
                        } catch (_e) {}
                    };
                    const syncAllMermaidIframes = function() {
                        document.querySelectorAll('#content_mermaid iframe, .right_content_box.mermaid iframe, #content_latex iframe, .right_content_box.latex iframe, iframe[src*=\"mermaid\"], iframe[src*=\"latex\"]').forEach(patchMermaidIframe);
                        document.querySelectorAll('iframe').forEach(function(iframe) {
                            try { hookChartOpen(iframe.contentWindow); } catch (err) {}
                        });
                    };
                    if (!window.__aiClickBound) {
                        window.__aiClickBound = true;
                        document.addEventListener('click', function(e) {
                            send('hideTabMore');
                        }, true);
                    }
                    const isLocalChartOpenUrl = function(url) {
                        try {
                            var u = new URL(String(url || ''), location.origin);
                            return /^\\/(?:mindmap|diagraming)\\/[^/?#]+/.test(u.pathname);
                        } catch (err) {
                            return false;
                        }
                    };
                    const hookChartOpen = function(win) {
                        if (!win) return;
                        try {
                            if (win.open && win.open.__aiChartOpen) return;
                            var raw = win.open;
                            var wrapped = function(url) {
                                var s = String(url || '');
                                try {
                                    var u = new URL(s, location.origin);
                                    if (u.pathname === '/diagrams' || u.pathname === '/diagrams/') {
                                        send('goHomeDiagrams', (u.searchParams.get('chartId') || '').trim());
                                        return null;
                                    }
                                } catch (err) {}
                                if (isLocalChartOpenUrl(s)) {
                                    send('openAiLocalChart', s);
                                    return null;
                                }
                                if (typeof raw === 'function') return raw.apply(win, arguments);
                                return null;
                            };
                            wrapped.__aiChartOpen = true;
                            win.open = wrapped;
                        } catch (err) {}
                    };
                    if (!window.__aiOpenBound) {
                        window.__aiOpenBound = true;
                        hookChartOpen(window);
                    }
                    if (!window.__aiMermaidIframeWatch) {
                        window.__aiMermaidIframeWatch = true;
                        syncAllMermaidIframes();
                        setInterval(syncAllMermaidIframes, 1000);
                        document.addEventListener('load', function(e) {
                            var t = e.target;
                            if (t && t.tagName === 'IFRAME') {
                                patchMermaidIframe(t);
                                try { hookChartOpen(t.contentWindow); } catch (err) {}
                            }
                        }, true);
                    }
                    const bind = () => {
                        window.editorGlobalConfig = window.editorGlobalConfig || {};
                        if (!window.editorGlobalConfig.onPrepareChatBaseInfo || !window.editorGlobalConfig.onPrepareChatBaseInfo.__aiPcHooked) {
                            var prevPrepare = window.editorGlobalConfig.onPrepareChatBaseInfo;
                            window.editorGlobalConfig.onPrepareChatBaseInfo = function(baseInfo) {
                                var next = typeof prevPrepare === 'function' ? prevPrepare(baseInfo) : Object.assign({}, baseInfo || {});
                                next = Object.assign({}, next || {}, { reqChannel: 'c', reqSourceClient: 'pc' });
                                return next;
                            };
                            window.editorGlobalConfig.onPrepareChatBaseInfo.__aiPcHooked = true;
                        }
                        if (window.processOnAIWorkspaceServerApi && window.processOnAIWorkspaceServerApi.aiBaseInfo) {
                            window.processOnAIWorkspaceServerApi.aiBaseInfo.reqChannel = 'c';
                            window.processOnAIWorkspaceServerApi.aiBaseInfo.reqSourceClient = 'pc';
                        }
                        if (window.editorGlobalConfig.onBuyAiPoints && window.editorGlobalConfig.onBuyAiPoints.__aiHooked) return;
                        window.editorGlobalConfig.onBuyAiPoints = function(detail) {
                            console.log('[ai-webview] onBuyAiPoints', detail);
                            var d = detail || {};
                            var sendPay = window.api && window.api.ipcRenderer && window.api.ipcRenderer.sendToHost;
                            if (!sendPay) return;
                            if (d.kind === 'package' || d.isMember === true) {
                                sendPay('showDlgPayWebView', {
                                    pay_position: 'index',
                                    pointssource: 'AI生成次数不足pc',
                                    title: '支付',
                                    aiPay: true
                                });
                                return;
                            }else{
                                sendPay('showDlgPayWebView', {
                                    pay_position: 'AI新建页-编辑',
                                    pointssource: d.triggerPos || 'freebag_buy_credits',
                                    title: '升级会员'
                                });
                            }
                            
                        };
                        window.editorGlobalConfig.onBuyAiPoints.__aiHooked = true;
                    };
                    bind();
                    setInterval(bind, 500);
                })();
            `).then(() => {
                console.log('[ai-webview] executeJavaScript success')
            }).catch((err) => {
                console.log('[ai-webview] executeJavaScript failed', err && err.message ? err.message : err)
            })
        })
    }
    let offline = document.getElementById(AI_CREATE_OFFLINE_ID)
    if (!offline) {
        offline = document.createElement('div')
        offline.id = AI_CREATE_OFFLINE_ID
        offline.style.cssText = 'display:none;position:absolute;left:0;top:0;right:0;bottom:0;z-index:10;background:#f6f7f8;'
        offline.innerHTML = HtmlStr.noOnline()
        wrap.appendChild(offline)
    }
    return { wrap, webview, offline }
}

function showAiCreateOfflineState() {
    const { webview, offline } = getAiCreateOverlayElements()
    if (webview) webview.style.display = 'none'
    if (offline) offline.style.display = 'block'
}

function hideAiCreateOfflineState() {
    const { webview, offline } = getAiCreateOverlayElements()
    if (offline) offline.style.display = 'none'
    if (webview) webview.style.display = 'block'
}

function clearAiWebviewPayMask() {
    const wrap = document.getElementById(AI_CREATE_OVERLAY_ID)
    if (!wrap || wrap.style.display === 'none') return
    const webview = document.getElementById(AI_CREATE_OVERLAY_WEBVIEW_ID)
    if (!webview) return
    webview.executeJavaScript(`(() => {
        window.__aiClientPayLock = false;
        ${AI_WEBVIEW_CLEAR_PAY_MASK_BODY}
        const clearPayNodes = (doc) => {
            if (!doc) return;
            doc.querySelectorAll('#po-dialog-dlgPay-21,#po-dialog-iframe-dlgPay,.po-dialog-iframe').forEach((el) => {
                try { el.remove(); } catch (_e) {}
            });
        };
        clearPayNodes(document);
        document.querySelectorAll('iframe').forEach((f) => {
            try { clearPayNodes(f.contentDocument); } catch (_e) {}
        });
    })();`).catch(() => { })
}

const DOUBLE_ELEVEN_AC_PATH = '/ac/261111'

function isDoubleElevenAcUrl(url = '') {
    return String(url).includes(DOUBLE_ELEVEN_AC_PATH)
}

function getDoubleElevenAcInjectScript() {
    return `(() => {
        const patch = () => {
            try {
                if (window.insert && typeof window.insert.iframeDlg === 'function' && !window.insert.iframeDlg.__poAcHooked) {
                    const orig = window.insert.iframeDlg.bind(window.insert);
                    window.insert.iframeDlg = function(opt) {
                        opt = opt || {};
                        if (opt.type === 'dlgPay') {
                            const send = window.api && window.api.ipcRenderer && window.api.ipcRenderer.sendToHost;
                            if (send) {
                                send.call(window.api.ipcRenderer, 'showDlgPayWebView', {
                                    pay_position: opt.pointsPage || opt.pointspage || '',
                                    pointssource: opt.pointsSource || opt.pointssource || '',
                                    title: opt.title || '升级会员'
                                });
                            }
                            return;
                        }
                        return orig(opt);
                    };
                    window.insert.iframeDlg.__poAcHooked = true;
                }
            } catch (_e) {}
            try {
                if (window.open && window.open.__poAcHooked) return;
                window.open = function(url) {
                    if (typeof url === 'string') {
                        if (url.indexOf('http') < 0) url = location.origin + url;
                        window.api.shell.openExternal(url);
                    }
                    return null;
                };
                window.open.__poAcHooked = true;
            } catch (_e2) {}
        };
        patch();
        if (window.__poAc261111Poll) return;
        window.__poAc261111Poll = true;
        let n = 0;
        const timer = setInterval(() => {
            patch();
            if (++n >= 60) clearInterval(timer);
        }, 500);
    })();`
}

function injectDoubleElevenAcHooks(webview) {
    if (!webview) return
    const script = getDoubleElevenAcInjectScript()
    const run = () => webview.executeJavaScript(script).catch(() => { })
    webview.addEventListener('dom-ready', run)
    webview.addEventListener('did-finish-load', run)
}

function openExternalUrl(rawUrl = '') {
    if (!rawUrl) return
    let href = String(rawUrl)
    if (href.indexOf('http') < 0) {
        const host = ipc.sendSync('getGlobal', 'host') || ''
        href = host + href
    }
    window.api.shell.openExternal(href)
}

function localDayKey(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function tryShowDoubleElevenPopup(user) {
    if (CONFIG.CHANNELTYPE == 'lenovo_ly') return
    if (!user || user === false) return
    if ($('#po-double11-mask').length) return
    const year = new Date().getFullYear()
    if (Date.now() >= new Date(`${year}-12-01T00:00:00`).getTime()) return
    const isMember = !!(user.member || user.orgMember)
    const intervalDays = isMember ? 3 : 1
    const userId = user.userId || user.id || localStorage.getItem('processon_userKey') || ''
    if (!userId) return
    const storageKey = `double11_popup_v3_${userId}`
    const today = localDayKey()
    const lastShow = localStorage.getItem(storageKey)
    if (lastShow) {
        const lastDate = new Date(`${lastShow}T00:00:00`)
        const todayDate = new Date(`${today}T00:00:00`)
        const diffDays = Math.floor((todayDate - lastDate) / 86400000)
        if (diffDays < intervalDays) return
    }
    const imgName = Date.now() < new Date(`${year}-11-11T00:00:00`).getTime() ? '1101.png' : '1102.png'
    showDoubleElevenPopupLayer({ imgName, storageKey, today })
}

function showDoubleElevenPopupLayer({ imgName = '1101.png', storageKey = '', today = '' } = {}) {
    if ($('#po-double11-mask').length) return
    const imgSrc = `./src/assets/images/home/${imgName}`
    const closePopup = () => {
        $('#po-double11-mask').remove()
    }
    const $mask = $(`
        <div id="po-double11-mask" class="po-double11-mask">
            <div class="po-double11-dialog">
                <span class="po-double11-close icons_web">&#xe728;</span>
                <img class="po-double11-img" src="${imgSrc}" alt="" draggable="false" />
            </div>
        </div>
    `)
    $('body').append($mask)
    if (storageKey && today) {
        try { localStorage.setItem(storageKey, today) } catch (_e) { }
    }
    $mask.find('.po-double11-close').on('click', (e) => {
        e.stopPropagation()
        closePopup()
    })
    $mask.find('.po-double11-dialog').on('click', (e) => {
        e.stopPropagation()
    })
    $mask.find('.po-double11-img').on('click', () => {
        closePopup()
        tabGroupExtend.addTab({ src: '/ac/261111', title: '双十一', type: 'url' })
    })
}

function forceInternalWebviewIframeSize(webview, width, height) {
    try {
        const internalIframe = webview && webview.shadowRoot ? webview.shadowRoot.querySelector('iframe') : null
        if (!internalIframe) return
        internalIframe.style.width = `${width}px`
        internalIframe.style.height = `${height}px`
        internalIframe.style.minHeight = `${height}px`
        internalIframe.style.maxHeight = `${height}px`
        internalIframe.style.display = 'block'
        internalIframe.style.flex = '0 0 auto'
    } catch (e) {
        // ignore
    }
}

let downShowTimer = null
function revealDownView() {
    const webviewWrap = $("#downing")[0]
    if (!webviewWrap) return
    webviewWrap.style.display = 'flex'
    $(webviewWrap).css({ position: 'absolute', left: null, top: null, zIndex: 10 })
    $('.downing_d').show()
    $('.downing').show()
}

export const tabGroupExtend = {
    "addTab": (opt = {}) => {
        window.focus()
        return new Promise((resolve, reject) => {
            const CONFIG = ipc.sendSync('getGlobal', 'CONFIG')
            const { maxTab } = tabData
            let startTime = new Date().getTime();
            if (!tabGroup) {
                console.warn(`tabGroup实例不存在`);
                return;
            }
            let tabLeng = tabGroup.getTabs();
            if (tabLeng.length >= (maxTab + 1)) {
                new Toast({ msg: "标签已经达到最大数量，请关闭不需要的标签后再试", type: "error" });
                console.warn(`[tabGroup]已达到最大数量`);
                return;
            }

            if (!opt.src) {
                console.warn('缺失页面地址');
                return;
            }

            if (opt.type && opt.type == 'url') {
                const { host } = ipc.sendSync('getHost')
                opt.src = `${host}${opt.src}`

            }

            if (isDoubleElevenAcUrl(opt.src)) {
                const existTabs = tabGroup.getTabs()
                for (let i = 0; i < existTabs.length; i++) {
                    const existTab = existTabs[i]
                    let existSrc = ''
                    try {
                        existSrc = existTab.webview && (existTab.webview.getURL ? existTab.webview.getURL() : existTab.webview.src)
                    } catch (_e) { }
                    if (isDoubleElevenAcUrl(existSrc)) {
                        existTab.activate()
                        resolve(existTab)
                        return
                    }
                }
            }

            let options = {
                title: "标签页",
                visible: true,
                active: true,
                loading: true,
                webviewAttributes: {
                    disablewebsecurity: true,
                    nodeintegration: true,
                    "disable-http-cache": true,
                    preload: "file://" + path.resolve(`${__dirname}/index.js`),
                },
                ...opt
            };


            if (options.src.indexOf('/home.html') == -1) {
                let iconURL = `./src/assets/images/icon/favicon.ico`;
                if (options.src.indexOf("/diagrams/index.html") > -1 || options.src.indexOf("/diagrams/view.html") > -1)
                    iconURL = "./src/assets/images/icon/tab_flow.png";
                else if (options.src.indexOf("/mindmap/index.html") > -1 || options.src.indexOf("/mindmap/view.html") > -1)
                    iconURL = "./src/assets/images/icon/tab_mind.png";
                else if (options.src.indexOf("/outline/index.html") > -1 || options.src.indexOf("/outline/view.html") > -1)
                    iconURL = "./src/assets/images/icon/tab_outline.png";
                else if (options.src.indexOf("/markdown-editor/index.html") > -1 || options.src.indexOf("/markdown-editor/view.html") > -1)
                    iconURL = "./src/assets/images/icon/tab_markdown.png";
                options.iconURL = iconURL
                // options.webviewAttributes.disablewebsecurity= false; //沙盒模式运行，否则二维码无法正常加载
                // options.webviewAttributes.partition= 'persist:main';
                options.webviewAttributes.webSecurity = false;
                // options.webviewAttributes.allowRunningInsecureContent= true;
                options.webviewAttributes.enableBlinkFeatures = 'ClipboardAPI'
            }
            if ((opt.src.startsWith('http') || opt.src.startsWith('https')) && !opt.src.startsWith('http://localhost:5173')) {
                options.iconURL = './src/assets/images/icon/favicon.ico'
                const electronTabs = document.querySelector('tab-group');
                const shadowRoot = electronTabs.shadowRoot;
                const tabContainer = shadowRoot.querySelector('.etabs .tabs'); // 根据实际情况调整选择器
                const scrollableTabsContainer = tabContainer.querySelector('.scrollable-tabs-container');

                setTimeout(() => {
                    scrollableTabsContainer.scrollLeft = scrollableTabsContainer.scrollWidth + tabData.tabsPadding;
                }, 500);
            }

            let tab_load = false;


            let loadTimeout = false;

            // 打开页面时是否需要加载过渡页面

            let tab = tabGroup.addTab(options);
            console.log("打开页面数据:", options)




            let wb = tab.webview;
            if (isDoubleElevenAcUrl(options.src)) {
                injectDoubleElevenAcHooks(wb)
            }
            // 跳转加载失败标签页
            let skipFailTab = (url) => {
                return;
                // if (loadTimeout) {
                //     clearTimeout(loadTimeout);
                //     loadTimeout = false;
                // }
                // if (tab_load) {
                //     tab_load.close(true);
                //     tab_load = false;
                // };
                // tab && tab.close();
                // tabGroupExtend.addTab({ title: "加载失败", src: `./fail.html?url=${encodeURIComponent(url)}`, iconURL: "../../images/icon/tab_default.png" })
            };
            // 标签页加载成功后的工作
            let succeedLoadWork = () => {

                if (loadTimeout) {
                    clearTimeout(loadTimeout);
                    loadTimeout = false;
                }

                let load_id = tab_load.id;
                let isClosed = !tabGroup.getTab(load_id);
                let endTime = new Date().getTime();
                const { tabTimeoutMin } = tabData
                let timeout = tabTimeoutMin - (endTime - startTime);

                // 为标签页 webview 添加 tab 标识
                // tab.webview.executeJavaScript(`window.TABGROUPID = ${tab.id};`);
                // 将焦点获取到页面dom
                tab.webview.focus();



                if (opt.type == "url" || opt.type == "httpUrl") {
                    if (window.localStorage.getItem("isOnLine")) {
                        // 为网络页面注入 js & css 附加逻辑
                    }
                    else {
                        skipFailTab(options.src)
                    }
                }

                // 强制标签页加载事件大于 2s
                if (timeout < 0 || (opt.type != "url" && opt.type != "httpUrl")) timeout = 0;
                setTimeout(() => {
                    // 在加载过程中标签页被关闭
                    if (isClosed) {
                        tab_load = false;
                        tab.close();
                    }
                    else {
                        let activeTab = tabGroup.getActiveTab();
                        let isActive = activeTab && (activeTab.id == load_id);

                        // 加载过程中没有切换标签，url页面标签直接替换load标签的默认选中状态
                        if (tab_load) {
                            tab_load.close();
                            tab_load = false;
                        }
                        tab.show(true);
                        if (isActive) {
                            tab.activate();
                        }

                        // tabTurning.addTabedDetection(tab);
                    }
                }, timeout);
            };
            // tab加载事件
            tab.on("close", (ttab) => {
                let isAllClose = parseInt(localStorage.getItem('isAllClose'))
                let tabArr = JSON.parse(sessionStorage.getItem('tabArr'))
                let logout = localStorage.getItem('logout')
                if (isAllClose == 1 && tabArr.length == 0) {
                    if (logout == '1') {
                        ipc.send('win_opts', 'unmax')
                        ServerUtil.logout()
                    }
                    else if (localStorage.getItem('pendingUpdateRestart') == '1') {
                        window.__poFinishUpdateRestart && window.__poFinishUpdateRestart()
                        return
                    }
                    else {
                        ipc.send('win_opts', 'close')
                        return
                    }
                }
                if (isAllClose == 1 && tabArr.length > 0) {
                    tabGroup.getTab(tabArr[tabArr.length - 1].id).activate()
                    return
                }
            })
            tab.on("closing", (ttab, abort) => {
                let tabArr = JSON.parse(sessionStorage.getItem('tabArr'))
                const nowTabArr = tabArr.find(a => a.id == ttab.id)
                const nowTabArrIndex = tabArr.findIndex(a => a.id == ttab.id)
                if (nowTabArr != undefined && nowTabArr.isMyFile && !nowTabArr.isClose) {
                    $('.dlgSaving-d').hide()
                    $('#dlgSaving').hide()
                    ttab.webview.send('pong_event', { k: 'close' })
                    ttab.activate()
                    abort()

                }
                else {
                    tabArr.splice(nowTabArrIndex, 1)
                    sessionStorage.setItem('tabArr', JSON.stringify(tabArr))
                    if (tabGroup.showSlider) {
                        const electronTabs = document.querySelector('tab-group');
                        const shadowRoot = electronTabs.shadowRoot;
                        const tabContainer = shadowRoot.querySelector('.etabs .tabs'); // 根据实际情况调整选择器
                        const scrollableTabsContainer = tabContainer.querySelector('.scrollable-tabs-container'); // 确保选择正确的容器

                        const removedTabElement = ttab.element;
                        const parent = removedTabElement.parentElement;

                        // 这些代码是用来重写 源码中 closing逻辑 因为源码无法指定“tabContainer”
                        // 而现在的tabContainer 是我们自己写的滑动div
                        ttab.isClosed = true;
                        const tabGroup = ttab.tabGroup;
                        // tabGroup.tabContainer.removeChild(event.element);
                        if (parent && scrollableTabsContainer.contains(removedTabElement)) {
                            try {
                                parent.removeChild(removedTabElement);
                            } catch (e) {
                                console.error("Failed to remove child node: ", e);
                            }
                        }

                        tabGroup.viewContainer.removeChild(ttab.webview);
                        const activeTab = ttab.tabGroup.getActiveTab();
                        // 先清空崩溃缓存在关闭
                        ipc.invoke('loadFileB64', { type: 'cache', path: 'crash/data.json' }).then((res) => {
                            if (res.code == 200) {
                                let resHis = res.data
                                if (!resHis) resHis = 'W10='

                                let crashData = JSON.parse(decodeURIComponent(escape(atob(resHis))));
                                const id = activeTab.element.getAttribute('data-chartid')

                                const isExist = crashData.findIndex(c => c.chartId === id)

                                if (isExist > -1) {
                                    crashData.splice(isExist, 1)
                                }
                                // 更新
                                const result = btoa(unescape(encodeURIComponent(JSON.stringify(crashData))));
                                tabGroup.removeTab(ttab, true);
                                ttab.emit("close", ttab);
                                if (activeTab.id === ttab.id) tabGroup.activateRecentTab();

                                setTimeout(() => {
                                    ipc.invoke('saveFileB64',{ type: 'cache', data: result, path: 'crash/data.json' })
                                }, 1000);
                            } else {
                                tabGroup.removeTab(ttab, true);
                                ttab.emit("close", ttab);
                                if (activeTab.id === ttab.id) tabGroup.activateRecentTab();
                                abort()
                            }

                        })

                    }
                }
                checkScrollableTabs();
            })

            // 在导航加载完成时触发，也就是tab 的 spinner停止spinning，并且加载事件处理.
            wb.addEventListener("did-finish-load", (e) => {
                succeedLoadWork();
            });
            // 在加载失败或取消是触发，例如提出 window.stop()
            // wb.addEventListener("did-fail-load", (e) => {
            //     if (e.errorDescription == "ERR_NAME_NOT_RESOLVED") skipFailTab(e.validatedURL);
            // });
            // 当指定的frame文档加载完毕时触发.
            wb.addEventListener("dom-ready", (e) => {
                succeedLoadWork();
            });
            // 当导航中的页面title被设置时触发.在title通过文档路径异步加载时explicitSet为false.
            wb.addEventListener("page-title-updated", (e) => {
                let title = e.title;
                const isHttp = (tab.webview.src.startsWith('http://') || tab.webview.src.startsWith('https://'))
                const diyTitles = ['我的文件', '账户中心', '个人主页', '交易记录', '使用手册', '福利中心']
                if (isHttp && tab.webview.src.includes('/view/')) { //预览不做处理
                    return
                }
                if (isHttp && diyTitles.some(t => title.includes(t))) {
                    return;
                }
                if (isHttp && (!tab.webview.src.startsWith('http://localhost'))) {
                    tabGroupExtend.setTitle(tab.id, title);
                }
            });

            // wb.addEventListener("new-window", (e) => {
            //     resetSkipLink(e.url, true);
            // });
            // 当用户或page尝试开始导航时触发.它能在 window.location 变化或者用户点击连接的时候触发.
            wb.addEventListener("did-start-navigation", (e) => {
                console.log('did-start-navigation', e)
                // wb.closeDevTools()
                // if (wb.src != e.url) {
                //     wb.stop();
                //     e.preventDefault();
                //     // resetSkipLink(e.url);
                // }
                ipc.send("set_cookie", window.localStorage.getItem("processon_token"));
            });
            // 当导航结束时触发.
            wb.addEventListener("did-navigate", (e) => {
                // 给 tab 添加自定义标识
                let { homeTabId } = tabData
                $(tab.element).attr("data-id", tab.id);
                console.log('tab.id', tab.id)
                console.log('homeTabId', homeTabId)
                if (tab.id != homeTabId) {
                    const chartId = pcUtil.getUrlParams("chartId", e.url, homeTabId)
                    if (chartId) {
                        $(tab.element).attr("data-chartid", chartId);
                    } else {
                        let filepath = pcUtil.getUrlParams("filepath", e.url)
                        if (filepath) {
                            $(tab.element).attr("data-filepath", filepath);
                            tabGroupExtend.isListenFileStatus(filepath, tab.id)
                        }
                    }
                }

                if (CONFIG.isOpenDevTool) wb.openDevTools();
                if (opt.type == "url" || opt.type == "httpUrl") {
                    if (window.localStorage.getItem("isOnLine")) {
                        // 加载超时跳转加载失败标签页
                        loadTimeout = setTimeout(() => skipFailTab(url), tabData.tabTimeoutMax);
                    }
                    else skipFailTab(url);

                    ipc.send("set_cookie", window.localStorage.getItem("processon_token"));
                }
            });

            // 在 guest page 向嵌入页发送一个异步消息的时候触发.
            wb.addEventListener("ipc-message", (e) => {
                console.log("ipc-message", e)
                switch (e.channel) {
                    // 获取所有已打开标签页的文件id
                    case "setTabChartId":

                        break;
                    case "getTabChartIds":
                        let tabs = tabGroup.getTabs();
                        let fileIds = [];
                        console.log(tabs)
                        tabs.map(tab => {
                            if (tab.element.getAttribute("data-chartid")) {
                                fileIds.push(tab.element.getAttribute("data-chartid"))
                            }

                            if (tab.element.getAttribute("data-filepath")) {
                                fileIds.push(decodeURIComponent(tab.element.getAttribute("data-filepath")))
                            }
                        });
                        wb.send('getTabChartIds_callback', fileIds.join(","));
                        break;
                    case "hideTabMore":
                        hideTabMore();
                        break;
                    case "toast":
                        let params = e.args[0];
                        let $con = $(".etabs-views");

                        // if(typeof params == "object") params.toastCss = {top: "50px"}
                        new Toast(params, $con);
                        break;
                    case "preRefreshing":
                        const RefreshTabs = tabGroup.getTabs()
                        const user = localStorage.getItem('privilege')
                        RefreshTabs.forEach((d) => {
                            if (d.id) {
                                tabGroup.getTab(d.id).webview.send("refreshVipStatus", user);
                            }
                        })
                        break;
                    case "refresh":
                        tabGroup.getTab(0).webview.send('pong_event', { k: 'loadFile', args: [] })
                        break;
                    case "ping_event":
                        const { homeTabId } = tabData
                        let targetTabId = homeTabId;
                        if (e.args[0] && !isNaN(e.args[0])) targetTabId = e.args[0];
                        tabGroup.getTab(targetTabId).webview.send("pong_event", e.args[1]);
                        break;
                    case "notificationCount":
                        let $msg = $(".icon_btn.msg .global-tip");
                        if (Number(e.args[0]) > 0) {
                            $msg.text(e.args[0]);
                            $('.notice-count').show();
                        }
                        else $('.notice-count').hide();
                        break;
                    case "userLogoImg":
                        //头像
                        $('.user-logo-img').html('<div class="user-logo-img"><img src="' + e.args[0] + '" error="src/assets/images/on.png"/></div>')
                        // $('.user-logo-img img').attr('src', e.args[0])
                        break;
                    case 'isMyFile':
                        var tabArr = JSON.parse(sessionStorage.getItem('tabArr'))
                        console.log('tabargs', e.args)
                        if (tabArr.length == 0 || tabArr.find(i => i.id == e.args[0]) == undefined || tabArr.find(i => i.id == e.args[0]).length == 0) {
                            tabArr.push({ id: e.args[0], isMyFile: e.args[1], isClose: false })
                            localStorage.setItem('isAllClose', '0')
                        }
                        sessionStorage.setItem('tabArr', JSON.stringify(tabArr))
                        break
                    case 'myFileClose':
                        let filepath = pcUtil.getUrlParams("filepath", e.target.src)
                        if (filepath) {
                            tabGroupExtend.removeListenFileStatus(filepath)
                        }
                        var tabArr = JSON.parse(sessionStorage.getItem('tabArr'))
                        const nowIndex = tabArr.findIndex(i => i.id == e.args[0])
                        tabArr[nowIndex].isClose = true
                        const nowTab = tabGroup.getTab(tabArr[nowIndex].id)
                        sessionStorage.setItem('tabArr', JSON.stringify(tabArr))
                        nowTab.close()
                        break
                    case 'myFileCloseCancel':
                        localStorage.getItem('logout', '0')
                        localStorage.setItem('isAllClose', '0')
                        localStorage.removeItem('pendingUpdateRestart')
                        break
                    case 'upgradeDlg':
                        window.upgradeDlg(e.args)
                        break;
                    case 'hideIndex':
                        $('.shade_user_box').hide()
                        $('.popWindow').hide()
                        break;
                    case 'showFeedBackWin':
                        tabGroupExtend.showFeedBackWin(e.args[0])
                        break;
                    case 'showDlgSaveWebView':
                        tabGroupExtend.showDlgSaveWebView(e.args[0])
                        // isOpenSave = true
                        break;
                    case 'openAiCreateWebview':
                        tabGroupExtend.openAiCreateWebview(e.args[0] || {}, tab.id)
                        break;
                    case 'closeAiCreateWebview':
                        tabGroupExtend.closeAiCreateWebview()
                        break;
                    case 'showIndexCreateFolderDlg':
                        tabGroupExtend.showIndexCreateFolderDlg(e.args[0] || {})
                        break;
                    case 'showIndexImportDlg':
                        tabGroupExtend.showIndexImportDlg()
                        break;
                    case 'localUpload':
                        tabData.localUploadArr.push(e.args[0])
                        break;
                    case 'updateTabUrl':
                        tabGroupExtend.updateTabUrl(e.args[0].id, e.args[0].url)
                        break;
                    case 'showSaving':
                        $('.dlgSaving-d').show()
                        $('#dlgSaving').show()
                        break;
                    case 'hideSaving':
                        $('.dlgSaving-d').hide()
                        $('#dlgSaving').hide()
                        break;
                    case 'showDlgPayWebView1':
                        // 兼容新老支付传参
                        if (e.args[0].pay_position) {
                            tabGroupExtend.showDlgPayWebView({ pay_position: e.args[0].pay_position, title: e.args[0].title })
                        } else {
                            tabGroupExtend.showDlgPayWebView({ pointspage: e.args[0].pointspage, pointssource: e.args[0].pointssource, title: e.args[0].title })
                        }
                        break;
                    case 'getId':
                        tabGroup.getTab(tab.id).webview.send("setId", tab.id);
                        break;
                    case 'reload':
                        tabGroup.getTab(tab.id).webview.reload();
                        break;
                    case 'openFileFor':
                        ipc.send("openFileFor", e.args[0])
                        break;
                    case 'updateTabUrl':
                        tabGroupExtend.updateTabUrl(...e.args, e.url)
                        break;
                    case 'showDlgDownWebView':
                        tabGroupExtend.showDlgDownWebView(e.args[0])
                        break;
                    case 'showDoubleElevenPopup':
                        showDoubleElevenPopupLayer(e.args[0] || {})
                        break;
                    case 'windowOpenBlocked':
                        if (isDoubleElevenAcUrl(tab.webview && tab.webview.src)) {
                            openExternalUrl(e.args && e.args[0] ? String(e.args[0]) : '')
                            break
                        }
                        openAiLocalEditorTab(e.args && e.args[0] ? String(e.args[0]) : '')
                        break;
                    default:
                        tabGroupExtend[e.channel] && tabGroupExtend[e.channel](...e.args);
                        break;
                }
            });
            // 崩溃
            wb.addEventListener("render-process-gone", (e) => {
                // 记录崩溃日志
                ipc.send("exportLog", { str: `页面[${tab.title}]崩溃,原因：${e.reason}` })
                wb.reload()
            })
            // 插件崩溃
            wb.addEventListener("plugin-crashed", (e) => {
                // 记录崩溃日志
                ipc.send("exportLog", { str: `页面[${tab.title}]插件崩溃` })
                wb.reload()
            })

            resolve(tab)
        })
    },
    "changeTabUrl": (chartId, category, title) => {
        const { homeTabId } = tabData
        const index = $('.etabs-tabs .active').index() + 1
        tabGroup.getActiveTab().close()
        ipc.send('win_opts', 'unFullScreen')
        const homeWebview = tabGroup.getTab(homeTabId).webview
        homeWebview.send('pong_event', { k: 'editChart', args: [chartId, category, title, index] })
    },
    "selectTabByChartId": (chartId, filepath) => {

        let tabs = tabGroup.getTabs();
        tabs.forEach(tab => {
            let curfilepath = decodeURIComponent(tab.element.getAttribute('data-filepath'))
            let curChartId = tab.element.getAttribute('data-chartid')
            // 导入本地的情况
            if (filepath && curfilepath === filepath) {
                tab.activate();
                return
            }
            // 点击云文件
            if (chartId && curChartId === chartId) {
                tab.activate();
                return
            }
        })
    },
    setTitleByChartId: (chartId, title) => {
        let tabs = tabGroup.getTabs();
        tabs.forEach(tab => {
            if (tab.element.getAttribute('data-chartid') == chartId
                && tab.webview.src.indexOf('/source/compile') > -1
            ) {
                tab.setTitle(pcUtil.filterXss(title))
            }
        })
    },
    // 修改标签页标签
    setTitle: (id, t = '') => {
        let tab
        if (id && id != '') tab = tabGroup.getTab(id)
        else tab = tabGroup.getActiveTab()

        tab.setTitle(pcUtil.filterXss(t))
        const electronTabs = document.querySelector('tab-group');
        const shadowRoot = electronTabs.shadowRoot;
        const tabContainer = shadowRoot.querySelector('.etabs .tabs'); // 根据实际情况调整选择器
        const scrollableTabsContainer = tabContainer.querySelector('.scrollable-tabs-container');

        scrollableTabsContainer.scrollLeft = scrollableTabsContainer.scrollWidth + tabData.tabsPadding;
    },
    sendUserInfo: (user) => {
        const newId = function () {
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
        $("#user-logo img").attr("src", user.photoUrl + '?v=' + newId());
        tryShowDoubleElevenPopup(user)
    },
    preloadSetup: (jsStr) => {
        console.log('preloadSetup1')
        const tabWebview = tabGroup.getActiveTab().webview
        tabWebview.executeJavaScript(jsStr).then((result) => {
            // 在 JavaScript 执行完成后的回调函数
            console.log('JavaScript execution result:', result);
        })
            .catch((error) => {
                // 如果 JavaScript 执行出错，则会在这里捕获到错误
                console.error('JavaScript execution error:', error);
            });

    },
    showDlgPayWebView: ({ pay_position = '', pointssource, title = '升级会员', aiPay = false }) => {
        if (!navigator.onLine) {
            new Toast('needNetwork')
            return
        }
        if (isMasSubmissionLite(CONFIG)) {
            masUnsupportedToast(Toast)
            return
        }
        // 已在展示则不再重建，避免 download_member 连发 / 关导出时反复弹
        if (window.__poDlgPayShowing || ($('.upgrade-d').is(':visible') && $('#dlgPayWindow').children().length > 0)) {
            return
        }
        window.__poDlgPayShowing = true
        clearAiWebviewPayMask()
        if ($('.upgrade-d').is(':visible')) {
            $('#dlgPayWindow').empty().hide()
            $('.upgrade-d').hide()
        }

        const webviewWrap = $("#dlgPayWindow")

        webviewWrap.empty();
        const wrapHeight = aiPay ? '580px' : (CONFIG.CHANNELTYPE == 'lenovo_ly' ? '540px' : '616px')
        if (aiPay || CONFIG.CHANNELTYPE == 'lenovo_ly') {
            $('#dlgPayWindow').css({ height: wrapHeight })
        }
        const webviewEle = $('<webview>', {
            disablewebsecurity: "true",
            nodeintegration: "true",
            disableHttpCache: "true",
            css: {
                display: 'flex',
                background: '#fff',
                width: '840px',
                height: wrapHeight,
                zIndex: 21
            }
        });
        webviewWrap.append(webviewEle)
        let sys = /macintosh|mac os x/i.test(navigator.userAgent) ? 'mac' : 'win';
        const curTab = tabGroup.getActiveTab()
        let curTabSrc = curTab.webview.src
        let page = ''
        if (curTabSrc.includes('home')) {
            page = 'diagrams'
        } else if (curTabSrc.includes('compile/mindmap')) {
            page = 'mindedit'
        } else if (curTabSrc.includes('compile/diagrams')) {
            page = 'flowedit'
        } else if (curTabSrc.includes('compile/outline')) {
            page = 'outlineedit'
        }
        let url = ''
        const host = ipc.sendSync("getGlobal", "host")
        const pay_csource = `${sys}-pc-${page}-po`
        const positionParam = `${page}-${pay_position}`
        if (aiPay) {
            url = `${host}/dlgapi?type=dlgPay&pointspage=${pay_position}&pointssource=${pointssource}&overd=false&title=支付&ai_pay=true&sourceType=pc&channelType=${CONFIG.CHANNELTYPE}`;
        }
        else if (pointssource) {
            url = `${host}/dlgapi?type=dlgPay&pointspage=${pay_position}&pointssource=${pointssource}&sourceType=pc&channelType=${CONFIG.CHANNELTYPE}`;
        } else {
            url = `${host}/dlgapi?type=dlgPay&pay_position=${positionParam}&pay_csource=${pay_csource}&titletype=1&sourceType=pc&channelType=${CONFIG.CHANNELTYPE}`;
        }
        if (CONFIG.CHANNELTYPE === 'mas') {
            ipc.invoke('resolve-mas-pay-page').then((payUrl) => {
                url = payUrl + (payUrl.indexOf('?') >= 0 ? '&' : '?') + 'from=dialog'
                endShowDlgPayWebView()
            }).catch(() => {
                window.__poDlgPayShowing = false
                new Toast({ type: 'warning', msg: '支付页加载失败' })
            })
        } else if (CONFIG.CHANNELTYPE == 'lenovo_ly') {
            ipc.invoke('getLenovoDeviceId').then((result) => {
                if (!result) {
                    window.__poDlgPayShowing = false
                    new Toast({ type: "warning", msg: "设备id获取失败，请联系客服" });
                    return
                }
                if (url.indexOf('pay_position=') < 0) {
                    url += `&pay_position=${positionParam}`
                }
                if (url.indexOf('pay_csource=') < 0) {
                    url += `&pay_csource=${pay_csource}`
                }
                if (url.indexOf('titletype=') < 0) {
                    url += `&titletype=1`
                }
                url += `&channel=${CONFIG.CHANNEL}&deviceId=${result}`
                endShowDlgPayWebView()
            })
        } else {
            endShowDlgPayWebView()
        }

        function endShowDlgPayWebView() {
            console.log(url)

            const preload = "file://" + path.resolve(`${__dirname}/index.js`)
            const webview = $(webviewEle)[0]
            webview.setAttribute('preload', preload);
            webview.setAttribute('src', url);

            const resetPayWebviewZoom = () => {
                try { webview.setZoomFactor(1) } catch (e) { }
            }
            webview.addEventListener('dom-ready', resetPayWebviewZoom)
            if (CONFIG.CHANNELTYPE === 'mas') {
                webview.addEventListener('dom-ready', () => {
                    const payToken = localStorage.getItem('processon_token') || ''
                    webview.executeJavaScript(`try{localStorage.setItem('processon_token',${JSON.stringify(payToken)})}catch(e){}`).catch(() => { })
                })
            }

            $('.upgrade-d').show()
            let toast = new Toast('loading', $('body'))
            $('.toast-pc.loading').addClass('payLoding')
            $('.toast-pc.loading.payLoding').css({ top: '40%' })

            setTimeout(() => {
                $(webviewWrap).css({ display: 'flex' })
                toast && toast.closeAll();
            }, 1000);

            var dialogClose = $("<div class='dialog-close icons_web'>&#xe728;</div>")
            dialogClose.appendTo(webviewWrap);
            dialogClose.css({ zIndex: '22' }).show();
            let isClosingDlgPay = false;
            const closeDlgPayWindow = function () {
                $('.upgrade-d').hide()
                $('.toast-pc.loading').removeClass('payLoding')
                webviewWrap.empty();
                $('#dlgPayWindow').hide();
                if (aiPay || CONFIG.CHANNELTYPE == 'lenovo_ly') {
                    $('#dlgPayWindow').css({ height: '616px' })
                }
                clearAiWebviewPayMask()
                isClosingDlgPay = false;
                window.__poDlgPayShowing = false;
            };
            dialogClose.bind("click", function () {
                if (isClosingDlgPay) {
                    return;
                }
                isClosingDlgPay = true;
                closeDlgPayWindow();
            });

            webview.removeEventListener('did-finish-load', () => { })
            webview.addEventListener('did-finish-load', () => {
                console.log('Webview content loaded');
                resetPayWebviewZoom()
                const CONFIG = ipc.sendSync('getGlobal', 'CONFIG')
                if (CONFIG.isOpenDevTool) webview.openDevTools();
                webview.insertCSS(`
                    #po-dialog-dlgPay-21 > .dialog-close,
                    #po-dialog-dlgPay-21 .dialog-close,
                    .po-dialog-iframe .dialog-close,
                    .dlg-pay .dialog-close,
                    .dlg-personal-pay .dialog-close,
                    .dlg-pay-point .dialog-close {
                        display: none !important;
                        visibility: hidden !important;
                        pointer-events: none !important;
                    }
                `).catch(() => {})
                const script = `
                function isAiDetailClick(target) {
                    let el = target;
                    while (el && el !== document.body) {
                        if ((el.textContent || '').trim() === 'AI详情') return true;
                        el = el.parentElement;
                    }
                    return false;
                }
                function openAiPointDetail() {
                    window.api.ipcRenderer.sendToHost('openAiPointDetail');
                }
                window.open = function(url) {
                    console.log(url);
                    if(typeof url == 'string'){
                        if(url.indexOf('aiPointDetail') >= 0){
                            openAiPointDetail();
                            return null;
                        }
                        if(url.indexOf('http')<0){
                            url = location.origin + url
                        }
                        window.api.shell.openExternal(url);
                    }
                    return null;
                };
                document.removeEventListener('click',()=>{})
                document.addEventListener('click', (event) => {
                    const target = event.target;
                    if (isAiDetailClick(target)) {
                      event.preventDefault();
                      event.stopPropagation();
                      openAiPointDetail();
                      return;
                    }
                    if (target.tagName === 'A') {
                      event.preventDefault();
                      let href = target.getAttribute('href');
                      if (href) {
                        if(href.indexOf('http')<0){
                            href = location.origin + href
                        }
                        window.api.shell.openExternal(href);
                      }
                    }
                  }, true);
                `;
                webview.executeJavaScript(script).catch(err => console.error('Script failed to execute:', err));
            });

            webview.addEventListener("ipc-message", (e) => {
                switch (e.channel) {
                    case 'selectTab':
                        tabGroupExtend.selectTab(0)
                        break;
                    case 'closePopup':
                        closeDlgPayWindow();
                        clearAiWebviewPayMask()
                        break
                    case 'openAiPointDetail':
                        ipc.invoke('open-childWindow', { section: 'orderInfo', tab: '4' })
                        break
                    case 'masApplePay':
                        ipc.invoke('mas-iap-purchase', e.args[0]).then((data) => {
                            webview.send('masApplePayResult', { ok: true, data })
                        }).catch((err) => {
                            webview.send('masApplePayResult', {
                                ok: false,
                                message: (err && err.message) ? err.message : '苹果支付失败'
                            })
                        })
                        break
                }
            })
        }
    },
    showFeedBackWin: function () {
        const webviewWrap = $("#feedBack_win")[0]
        const webview = $("#feedBack_win webview")[0]
        if (webview.hasAttribute('preload')) {
            $('.upgrade-d').show()
            $('#feedBack_win').show()
            return
        }
        webview.removeEventListener('did-finish-load', () => { })
        webview.addEventListener('did-finish-load', () => {
            console.log('Webview content loaded');
            const CONFIG = ipc.sendSync('getGlobal', 'CONFIG')
            if (CONFIG.isOpenDevTool) webview.openDevTools();
            const script = `
            document.removeEventListener('click',()=>{})
            document.addEventListener('click', (event) => {
                const target = event.target;
                if (target.tagName === 'A') {
                  event.preventDefault();
                  let href = target.getAttribute('href');
                  if (href) {
                    if(href.indexOf('http')<0){
                        href = location.origin + href
                    }
                    window.api.shell.openExternal(href);
                  }
                }
                // if(target.tab)
              }, true);
              const closebtn = document.querySelector('.po-button.po-btn-primary.is-nobg')
              closebtn.addEventListener('click',event=>{
                window.api.ipcRenderer.sendToHost('hideFeedBackWind')
              })
            // document.querySelector('.dlgfeedback').style.transform='none';
            const targetNode = document.documentElement
            const config = { childList: true, subtree: true }
            const observer = new MutationObserver((mutationsList) => {
                for (const mutation of mutationsList) {
                const addedNodes = mutation.addedNodes
                for (const node of addedNodes) {
                    if (node.nodeType === 1) {
                        if(node.className.includes('po-message--success')){
                            setTimeout(() => {
                                window.api.ipcRenderer.sendToHost('hideFeedBackWind')
                            }, 300);
                        }
                        }
                    }
                }
            })
            observer.observe(targetNode, config)
            `;
            webview.executeJavaScript(script).catch(err => console.error('Script failed to execute:', err));
        });
        const url = `${ipc.sendSync("getGlobal", "host")}/dlgapi?type=dlgFeedback&title=意见反馈&terminalType=pc`;
        const preload = "file://" + path.resolve(`${__dirname}/index.js`)
        webview.setAttribute('preload', preload);
        webview.setAttribute('src', url);
        webviewWrap.style.display = 'flex';
        $('.upgrade-d').show()
        var dialogClose = $("<div class='dialog-close icons_web'>&#xe728;</div>")
        dialogClose.appendTo(webviewWrap);
        dialogClose.css({ zIndex: '22' }).show();
        dialogClose.bind("click", function () {
            $('.upgrade-d').hide()
            $("#feedBack_win").hide()
            webview.removeAttribute('preload')
            webview.removeAttribute('src');
        });
        webview.addEventListener("ipc-message", (e) => {
            switch (e.channel) {
                case 'hideFeedBackWind':
                    $('.upgrade-d').hide()
                    $("#feedBack_win").hide()
                    webview.removeAttribute('preload')
                    webview.removeAttribute('src');
                    break;

            }
        })
    },

    showDlgSaveWebView: (obj) => {
        const { id, savepath, suffix, islocal = true } = obj
        console.log(ipc.sendSync("getGlobal"))
        const webviewWrap = $("#dlgSaveWindow")[0]


        const webview = $("#dlgSaveWindow webview")[0]
        // if (webview.hasAttribute('preload')) {
        //     $('.dlgSaveWindow-d').show()
        //     $('#dlgSaveWindow').show()
        //     return
        // }
        if (!webview.hasAttribute('preload')) {
            webview.removeEventListener('did-finish-load', () => { })
            webview.addEventListener('did-finish-load', () => {
            });
            webview.addEventListener("did-navigate", (e) => {
                if (CONFIG.isOpenDevTool) webview.openDevTools();
            })

            webview.addEventListener("ipc-message", (e) => {
                switch (e.channel) {
                    case 'close':
                        // isOpenSave = false
                        dialogClose.click();
                        window.focus()
                        break;
                    case 'saveFile':
                        tabGroup.getTab(parseInt(e.args[0].id)).webview.send("saveFile_callback", e.args[0]);
                        break;
                    case 'showDlgPayWebView':
                        tabGroupExtend.showDlgPayWebView({ pay_position: `space-file-ins` })
                        break;
                    case 'upgradeDlg':
                        window.upgradeDlg(e.args)
                        break;
                }
            })

        }
        let other = ''
        if (Object.hasOwnProperty.call(obj, 'saveAs')) {
            other = '&saveAs=true'
        }
        if($(webviewWrap).find('.dialog-close').length){
            const  dialogClose =$(webviewWrap).find('.dialog-close')
            dialogClose.off()
            dialogClose.on("click",  ()=> {
                $('.dlgSaveWindow-d').hide()
                $('#dlgSaveWindow').hide()
                webview.setAttribute('preload', '');
                webview.setAttribute('src', '');
                tabGroup.getTab(parseInt(id)).webview.send("saveFile_callback", '');
            });
        }else{
            var dialogClose = $("<div class='dialog-close icons_web'>&#xe728;</div>")
            dialogClose.appendTo(webviewWrap);
            dialogClose.css({ zIndex: '20' }).show();
            dialogClose.on("click",  ()=> {
                $('.dlgSaveWindow-d').hide()
                $('#dlgSaveWindow').hide()
                webview.setAttribute('preload', '');
                webview.setAttribute('src', '');
                tabGroup.getTab(parseInt(id)).webview.send("saveFile_callback", '');
            });
        }

        const url = `./saveWindow.html?id=${id}&path=${encodeURI(savepath)}&suffix=${suffix}&isLocal=${islocal}${other}`;
        const preload = "file://" + path.resolve(`${__dirname}/index.js`)
        webview.setAttribute('preload', preload);
        webview.setAttribute('src', url);
        webviewWrap.style.display = 'flex';
        $('.dlgSaveWindow-d').show()


    },
    showShareWebView: (type, id) => {
        var webviewWrap = $("#sharecolle_win");
        webviewWrap.empty();
        const webviewEle = $('<webview>', {
            disablewebsecurity: "true",
            nodeintegration: "true",
            disableHttpCache: "true",
            css: {
                background: '#fff',
                width: '680px',
                height: '540px',
                zIndex: 21
            }
        });
        webviewWrap.append(webviewEle)

        const preload = "file://" + path.resolve(`${__dirname}/index.js`)
        const webview = $(webviewEle)[0]
        webview.setAttribute('preload', preload);

        setTimeout(() => {
            $('.upgrade-d').show()
            $(webviewWrap).css({ display: 'flex' })
        }, 500);

        var dialogClose = $("<div class='dialog-close icons_web'>&#xe728;</div>")
        dialogClose.appendTo(webviewWrap);
        dialogClose.css({ zIndex: '22' }).show();
        dialogClose.bind("click", function () {
            webviewWrap.empty();
            $('.upgrade-d').hide()
            $('#sharecolle_win').hide();
        });

        if (type == "chart") {
            if (id.length < 12) {
                new Toast({ type: "warning", msg: "文件未同步，此功能无法使用" });
                return;
            }
            FileDatabase.getChartById(id, chart => {
                var fdata = encodeURIComponent(JSON.stringify(chart));
                const url = `${ipc.sendSync('getGlobal', "host")}/dlgapi?type=share&title=邀请协作&source=khd&fdata=${fdata}`;
                webview.setAttribute('src', url);

                webview.removeEventListener('did-finish-load', () => { })
                webview.addEventListener('did-finish-load', () => {
                    console.log('Webview content loaded');
                    const CONFIG = ipc.sendSync('getGlobal', 'CONFIG')
                    if (CONFIG.isOpenDevTool) webview.openDevTools();
                    const script = `
                    $('.dialog-win-left li[tit=emb]').on('click',function(){
                        setTimeout(function(){
                            $('.ic-item').eq(0).hide();
                            $('.ic-item').eq(2).hide();
                            $('.ic-item').eq(3).hide();
                            $('.ic-item').eq(4).hide();
                        },100)
                    })
                    $('.dialog-win-left li[tit=image]').on('click',function(){
                        setTimeout(function(){
                            const frame = $('#embed_dom')
                           const title = frame[0].contentWindow.document.querySelector('.embed_title')
                            $(title).hide();
                        },1000)
                    })
                   `;
                    webview.executeJavaScript(script).catch(err => console.error('Script failed to execute:', err));
                });
            })
        }
        else {
            FileDatabase.getFolderById(id, folder => {
                var fdata = JSON.stringify({
                    ...folder,
                    _filesType: 'folder',
                    _id: folder.folderId,
                    category: ''
                });
                const url = `${ipc.sendSync('getGlobal', "host")}/dlgapi?type=share&title=邀请协作&source=khd&fdata=${fdata}`;

                webview.setAttribute('src', url);
                con.dialog();

                // con.height = 520
            })
        }



    },
    updateTabUrl(id, url, oldurl) {
        // setTimeout(() => {
        let filepath
        if (oldurl && oldurl != undefined) {
            filepath = oldurl.startsWith('http') ? pcUtil.getUrlParams("filepath", oldurl) : decodeURI(pcUtil.getUrlParams("filepath", oldurl))
        }
        let index1 = url.indexOf('&filepath=')
        if (filepath && index1 > -1) {
            let newfilepath = url.substring(index1 + 10)
            newfilepath = url.startsWith('http') ? newfilepath : decodeURI(newfilepath)
            filepath != newfilepath && ipc.send('updateListenFileStatus', { oldfilepath: filepath, newfilepath })
        }
        else if (filepath && index1 == -1) {
            ipc.send('removeListenFileStatus', filepath)
        }
        else if (!filepath && index1 > -1) {
            let newfilepath = url.substring(index1 + 10)
            newfilepath = url.startsWith('http') ? newfilepath : decodeURI(newfilepath)
            ipc.send('listenFileStatus', { filepath: newfilepath, tabId: id })
        }
        // }, 2000);
        let iconURL = ''
        if (url.indexOf("/diagrams/index.html") > -1 || url.indexOf("/diagrams/view.html") > -1) iconURL = "./src/assets/images/icon/tab_flow.png";
        else if (url.indexOf("/mindmap/index.html") > -1 || url.indexOf("/mindmap/view.html") > -1) iconURL = "./src/assets/images/icon/tab_mind.png";
        else if (url.indexOf("/outline/index.html") > -1 || url.indexOf("/outline/view.html") > -1) iconURL = "./src/assets/images/icon/tab_outline.png";
        const tabElement = tabGroup.getTab(id).element
        $(tabElement.querySelector('.tab-title')).removeAttr('style')
        // $(`.tab.visible[data-id="${id}"] .tab-icon img`).attr('src', url)
        $(tabElement).attr("data-filepath", url.substring(index1 + 10));
        if(index1 > -1){
            $(tabElement).attr("data-chartid","")
        }else{
            $(tabElement).attr("data-filepath","")
        }
        tabGroup.getTab(id).setIcon(iconURL)
        tabGroup.getTab(id).webview.src = ''
        tabGroup.getTab(id).webview.loadURL(url)
    },
    selectTab: function (id) {
        let tab = tabGroup.getTab(id);
        tab.activate();
    },
    dlgViewTemplate(url, title, btnTitle, info) {
        const webviewWrap = $("#dlgViewTemplateWin")
        $('#dlgViewTemplateWin .contentHtmlbox').empty();
        const webviewEle = $('<webview>', {
            disablewebsecurity: "true",
            nodeintegration: "true",
            disableHttpCache: "true",
            css: {
                display: 'flex',
                border: '1px solid #e9edf2',
                background: '#fff',
                boxSizing: 'content-box',
                width: '100%',
                height: '646px',
                zIndex: 21
            }
        });

        $('.contentHtmlbox').append(webviewEle)

        const preload = "file://" + path.resolve(`${__dirname}/index.js`)
        const webview = $(webviewEle)[0]
        webview.setAttribute('preload', preload);
        webview.setAttribute('src', url);

        $(webviewWrap).show()
        $('#useTemplate').off().on('click', () => {
            $('#dlgViewTemplateWin').hide()
            $('.upgrade-d').hide()
            tabGroup.getTab(0).webview.send('useTemplate', info)
        })
        $('#templateViewClose').off().on('click', () => {
            $('#dlgViewTemplateWin').hide()
            $('.upgrade-d').hide()
        })

        $('#useTemplate').html(btnTitle)
        if (btnTitle == 'VIP免费使用') {
            $('#useTemplate').css({
                color: '#985a10',
                fontWeight: 'bold',
                background: 'linear-gradient(223.8deg,#ffc988,#ffe4c2)'
            })
        } else {
            $('#useTemplate').css({
                color: '#fff',
                background: '#067bef',
            })
        }
        $('#templateViewTitle').text(title)
        $('.upgrade-d').show()




        webview.removeEventListener('did-finish-load', () => { })
        webview.addEventListener('did-finish-load', () => {
            console.log('Webview content loaded');
            const CONFIG = ipc.sendSync('getGlobal', 'CONFIG')
            if (CONFIG.isOpenDevTool) webview.openDevTools();
            // const script = `
            // document.removeEventListener('click',()=>{})
            // document.addEventListener('click', (event) => {
            //     const target = event.target;
            //     if (target.tagName === 'A') {
            //       event.preventDefault();
            //       let href = target.getAttribute('href');
            //       if (href) {
            //         if(href.indexOf('http')<0){
            //             href = location.origin + href
            //         }
            //         window.api.shell.openExternal(href);
            //       }
            //     }
            //   }, true);
            // `;
            // webview.executeJavaScript(script).catch(err => console.error('Script failed to execute:', err));
        });
    },
    showTabSlider,
    setFileIcon: function (tabId, isMyFile, upload = 0, isFirst = false) {
        console.log("tabId", tabId)
        const tabElement = tabGroup.getTab(tabId).element
        console.log("tabElement", tabElement)
        const tabCloseElement = tabElement.querySelector('.tab-close')
        const tabTitleElement = tabElement.querySelector('.tab-title')
        const fileIconEle = tabElement.querySelector('span.tab-file-icon')

        const electronTabs = document.querySelector('tab-group');
        const shadowRoot = electronTabs.shadowRoot;
        const tabContainer = shadowRoot.querySelector('.etabs .tabs'); // 根据实际情况调整选择器
        const scrollableTabsContainer = tabContainer.querySelector('.scrollable-tabs-container');

        let icon = isMyFile ? '&#xe697;' : upload == 0 ? '&#xe772;' : upload == 1 ? '&#xe6f4;' : '&#xe976;'
        if (!tabElement.contains(fileIconEle)) {
            const fileIcon = $(`<span class="icons_web tab-file-icon ${isMyFile ? 'isMyFile' : ''}" style="margin-left:6px;margin-right:-6px;font-weight:500;${upload == 2 ? 'color:#00B786' : ''}">${icon}</span>`)[0]
            tabElement.insertBefore(fileIcon, tabCloseElement)
        }
        else {
            fileIconEle.remove()
            const fileIcon = $(`<span class="icons_web tab-file-icon  ${isMyFile ? 'isMyFile' : ''}" style="margin-left:6px;margin-right:-6px;font-weight:500;${upload == 2 ? 'color:#00B786' : ''}">${icon}</span>`)[0]
            tabElement.insertBefore(fileIcon, tabCloseElement)
        }

        if (isFirst) {
            $(tabElement.querySelector('.tab-input')).remove()
            $(tabTitleElement).off('dblclick')
            let oldName = $(tabGroup.getTab(tabId).element.querySelector('.tab-title')).html()
            const input = $(`<input class='tab-input' type='text' value='${oldName}' style='display:none'>`)[0]
            tabElement.insertBefore(input, tabElement.querySelector('.tab-badge'))
            $(input).off('blur').on('blur', () => {
                oldName = $(tabGroup.getTab(tabId).element.querySelector('.tab-title')).html()
                const newName = $(input).val()
                if (newName !== oldName) {
                    const chartId = $(tabElement).attr('data-chartid')
                    ServerUtil.chartRename({ chartId: $(tabElement).attr('data-chartid'), title: newName }, res => {
                        if (res.code == 200) {
                            ipc.invoke('loadFileB64',
                                {
                                    type: "cache",
                                    path: "history/cache.json"
                                }
                            ).then((res) => {
                                const data = res
                                console.log("最近列表数据：", data);
                                if (data.code == 201) {
                                } else {
                                    const history = JSON.parse(decodeURIComponent(escape(atob(data.data))))
                                    const hisI = history.findIndex(d => d.chartId == chartId)
                                    if (hisI > 0) {
                                        const nowHis = history[hisI]
                                        nowHis.title = newName
                                        history.splice(hisI, 1)
                                        history.push(nowHis)
                                    }
                                    ipc.invoke("saveFileB64",
                                        { type: 'cache', path: "history/cache.json", data: btoa(unescape(encodeURIComponent(JSON.stringify(history)))) }).then(() => {
                                        })
                                    tabGroup.getTab(0).webview.send('pong_event', { k: 'loadFile', args: [] })
                                }

                            })
                                .catch((err) => {
                                });
                            FileDatabase.changeTitle(chartId, newName, () => { })
                            new Toast({ type: "success", msg: "操作成功" });
                        }
                    })
                }
                $(tabTitleElement).html(newName)
                $(tabTitleElement).attr('title', newName)
                $(tabTitleElement).show()
                $(input).hide()
            })

            const handleInputChange = () => {
                const newName = $(input).val()
                if (newName !== oldName) {
                    const chartId = $(tabElement).attr('data-chartid')
                    ServerUtil.chartRename({ chartId: $(tabElement).attr('data-chartid'), title: newName }, res => {
                        if (res.code == 200) {
                            ipc.invoke('loadFileB64',
                                {
                                    type: "cache",
                                    path: "history/cache.json"
                                }
                            ).then((res) => {
                                const data = res
                                console.log("最近列表数据：", data);
                                if (data.code == 201) {
                                } else {
                                    const history = JSON.parse(decodeURIComponent(escape(atob(data.data))))
                                    const hisI = history.findIndex(d => d.chartId == chartId)
                                    if (hisI > 0) {
                                        const nowHis = history[hisI]
                                        nowHis.title = newName
                                        history.splice(hisI, 1)
                                        history.push(nowHis)
                                    }
                                    ipc.invoke("saveFileB64",
                                        { type: 'cache', path: "history/cache.json", data: btoa(unescape(encodeURIComponent(JSON.stringify(history)))) }).then(() => {
                                        })
                                    tabGroup.getTab(0).webview.send('pong_event', { k: 'loadFile', args: [] })
                                    tabGroup.getTab(tabId).webview.send('pong_event', { k: 'updateSaveName', args: [newName] })
                                }

                            })
                                .catch((err) => {
                                });
                            FileDatabase.changeTitle(chartId, newName, () => { })
                            new Toast({ type: "success", msg: "操作成功" });
                        }
                    })
                }
                $(tabTitleElement).html(newName)
                $(tabTitleElement).attr('title', newName)
                $(tabTitleElement).show()
                $(input).hide()
            }

            $(input).off('keydown').on('keydown', function (event) {
                if (event.keyCode === 13 || event.which === 13) {
                    handleInputChange();
                }
            });

            $(input).off('blur').on('blur', function () {
                handleInputChange();
            });
            $(tabTitleElement).off('dblclick').on('dblclick', () => {
                if (!isMyFile) {
                    $(tabTitleElement).hide()
                    $(input).html($(tabTitleElement).html())
                    $(input).show()
                    $(input).focus()
                    $(input).select()
                }
            })
        }
        else {
            // $(tabElement.querySelector('.tab-input')).remove()
            // $(tabTitleElement).off('dblclick')
        }

        checkScrollableTabs();

        scrollableTabsContainer.scrollLeft = scrollableTabsContainer.scrollWidth + tabData.tabsPadding;
    },
    saveStatus: function (tabId, status) {
        const tabElement = tabGroup.getTab(tabId).element;
        const closeEle = tabElement.querySelector('.tab-close button');
        let saveStatusEle = tabElement.querySelector('.saveStatus');
        if (status === 'unsave') {
            if (!saveStatusEle) {
                saveStatusEle = $(`<div class="saveStatus" style="
                left: 50%;
                position: absolute;
                width: 6px;
                visibility: hidden;
                height: 6px;
                border: 2px solid #ffffff;
                background: #EB5555;
                border-radius: 50%;
                top: 50%;
                cursor: pointer;
                transform: translate(-50%,-50%);
            "></div>`)[0];
                closeEle.parentElement.appendChild(saveStatusEle);
            }
            closeEle.parentElement.style.position = 'relative';
            saveStatusEle.style.visibility = 'visible';
            closeEle.style.visibility = 'hidden';
        } else if (status === 'saved') {
            closeEle.style.visibility = 'visible';
            if (saveStatusEle) {
                saveStatusEle.style.visibility = 'hidden';
            }
        }
        const item = {
            tabId,
            closeEle,
            saveStatusEle,
            status,
            handleMouseEnter: () => {
                item.saveStatusEle.style.visibility = 'hidden';
                item.closeEle.style.visibility = 'visible';
            },
            handleMouseLeave: () => {
                if (item.status === 'unsave') {
                    item.saveStatusEle.style.visibility = 'visible';
                    item.closeEle.style.visibility = 'hidden';
                } else {
                    item.saveStatusEle.style.visibility = 'hidden';
                    item.closeEle.style.visibility = 'visible';
                }
            }
        }


        saveStatusEle.removeEventListener('mouseenter', item.handleMouseEnter);
        closeEle.removeEventListener('mouseleave', item.handleMouseLeave);

        saveStatusEle.addEventListener('mouseenter', item.handleMouseEnter);
        closeEle.addEventListener('mouseleave', item.handleMouseLeave);

        handlerEvent.element.push(item)

        saveStatusEle.addEventListener('mouseenter', handlerEvent.handleMouseEnter);
        closeEle.addEventListener('mouseleave', handlerEvent.handleMouseLeave);
    },
    showPayTemplate: function (data) {
        if (isMasSubmissionLite(CONFIG)) {
            masUnsupportedToast(Toast)
            return
        }
        console.log("show pay")
        const activeTab = tabGroup.getActiveTab()
        const { sourceChartId, price, title, isDlg, memberFree, ownerId } = data
        new Pay({
            id: sourceChartId,
            price: price,
            pay_type: "", //  designer--编辑页支付模板 / ""
            pay_cteamId: "",
            memberFree,
            ownerId,
            chartTitle: title,
            from: isDlg ? "templateCreateView" : "templateCreate",
            errorFn: function (e) { },
            successFn: function (res) {
                activeTab.webview.send("showPayTemplate_callback", "done")
            },
        });
    },
    handleVisibleInsertEditor: function () {
        const activeTab = tabGroup.getActiveTab()
        const insertEditorTabId = $("#insertEditorView").attr("tab-id");
        if (activeTab.id == insertEditorTabId && $("#insertEditorView webview").length > 0) {
            $("#insertEditorView").show()
        } else {
            $("#insertEditorView").hide()
        }
    },
    showInsertEditor: function (url, type, show = true) {
        const webviewWrap = $("#insertEditorView")
        $(webviewWrap).empty();
        const webview = $(`<webview disablewebsecurity="true" nodeintegration="true" disable-http-cache="true"
        style="background:#fff;width:100%; height: 100%; z-index:999;">
    </webview>`)[0]
        $(webviewWrap).append(webview)
        const activeTab = tabGroup.getActiveTab()
        // tab-id 不会重复 这样就和当前tab 绑定关系了
        $(webviewWrap).attr("tab-id", activeTab.id)
        $('#insertEditorView').fadeIn().css("left", (show ? '0%' : '-100%'))
        const preload = "file://" + path.resolve(`${__dirname}/index.js`)
        webview.setAttribute('preload', preload);
        webview.setAttribute('src', url);
        webview.addEventListener("did-navigate", (e) => {
            if (CONFIG.isOpenDevTool) webview.openDevTools();
        })

        // 向 webview 中的页面发送消息


        const ipcMessage = (e) => {
            switch (e.channel) {
                case 'returnSVG':
                    // 通知当前 tab 的 outline 返回结果
                    const activeTab = tabGroup.getActiveTab()
                    activeTab.webview.send('returnSvgCallback', e.args[0].url)
                    // 存图片
                    // 关闭窗口
                    $('#insertEditorView').fadeOut()
                    $(webviewWrap).empty();
                    break;
            }
        }

        const ready = () => {
            webview.contentWindow.postMessage(JSON.stringify({
                eventName: "updateViewUI",
                type
            }), '*');
            webview.executeJavaScript(`
                window.initInsertBtn(${show})
            `);
        }
        webview.addEventListener('dom-ready', ready);
        webview.addEventListener("ipc-message", ipcMessage)
    },
    setIdOrFilePath: function (tabId, chartId, filepath) {
        const tabElement = tabGroup.getTab(tabId).element
        $(tabElement).attr('data-chartid', chartId)
        $(tabElement).attr('data-filepath', filepath)
    },
    homeNav: function (nav) {
        homeNav = NavMap[nav] || '未知'
    },
    updateAiCreateWebviewBounds: function () {
        const wrap = document.getElementById(AI_CREATE_OVERLAY_ID)
        if (!wrap || wrap.style.display === 'none') return
        const webview = document.getElementById(AI_CREATE_OVERLAY_WEBVIEW_ID)
        if (!webview) return
        const activeTab = tabGroup.getActiveTab()
        if (!activeTab || !activeTab.webview || activeTab.id !== tabData.homeTabId) return
        const rect = activeTab.webview.getBoundingClientRect()
        const leftSidebarWidth = 240
        const left = Math.max(0, rect.left + leftSidebarWidth)
        const top = Math.max(0, rect.top)
        const width = Math.max(0, rect.width - leftSidebarWidth)
        const height = Math.max(0, rect.height)
        // 某些时机下 webview 的初始布局会回退到默认 300x150，这里做窗口级兜底
        const fallbackTop = 40
        const finalTop = top > 0 ? top : fallbackTop
        const finalWidth = width > 300 ? width : Math.max(0, window.innerWidth - leftSidebarWidth)
        const finalHeight = height > 300 ? height : Math.max(0, window.innerHeight - finalTop)
        wrap.style.left = `${left}px`
        wrap.style.top = `${finalTop}px`
        wrap.style.width = `${finalWidth}px`
        wrap.style.height = `${finalHeight}px`
        // 给 webview 写死像素尺寸，避免内部 iframe 回退到默认 300x150
        webview.style.left = '0px'
        webview.style.top = '0px'
        webview.style.right = 'auto'
        webview.style.bottom = 'auto'
        webview.style.width = `${finalWidth}px`
        webview.style.height = `${finalHeight}px`
        forceInternalWebviewIframeSize(webview, finalWidth, finalHeight)
    },
    showCreateBtnListOverlay: function (payload = {}) {
        if (!aiCreateWebviewOpened) return
        const { left = 0, top = 0, width = 467, height = 494, html = '', cssText = '' } = payload
        if (!html) return
        const homeTab = tabGroup.getTab(tabData.homeTabId)
        if (!homeTab || !homeTab.webview) return
        const rect = homeTab.webview.getBoundingClientRect()
        const wrap = getCreateBtnListOverlayWrap()
        wrap.style.left = `${rect.left + left}px`
        wrap.style.top = `${rect.top + top}px`
        wrap.style.width = `${width}px`
        wrap.style.height = `${height}px`
        wrap.innerHTML = `<style>${cssText || ''}</style><div class="create-btn-list popover" style="left:0;top:0;width:${width}px;height:${height}px;">${html}</div>`
        wrap.style.display = 'block'

        if (!createBtnListDocClickBinded) {
            createBtnListDocClickBinded = true
            document.addEventListener('click', (e) => {
                const cur = document.getElementById(CREATE_BTN_LIST_OVERLAY_ID)
                if (!cur || cur.style.display === 'none') return
                if (e.target && cur.contains(e.target)) return
                tabGroupExtend.hideCreateBtnListOverlay()
                closeCreateBtnListInHomeWebview()
            }, true)
        }
    },
    showIndexCreateFolderDlg: function (payload = {}) {
        let dlg = document.getElementById(INDEX_NEW_FOLDER_DLG_ID)
        const { html = '', cssText = '', style = 'width:350px;padding:24px 24px 24px 24px;', title = '新建文件夹' } = payload || {}
        if (!dlg) {
            dlg = document.createElement('div')
            dlg.id = INDEX_NEW_FOLDER_DLG_ID
            dlg.className = 'dialog'
            dlg.style.cssText = `display:none;${style}`
            dlg.innerHTML = `<style>${cssText || getIndexFolderDlgCssText()}</style>${html}`
            document.body.appendChild(dlg)
        } else {
            dlg.style.cssText = `display:none;${style}`
            if (html) {
                dlg.innerHTML = `<style>${cssText || getIndexFolderDlgCssText()}</style>${html}`
            }
        }
        $(dlg).removeAttr('title')
        const mask = document.getElementById(INDEX_MODAL_MASK_ID)
        if (mask) mask.remove()
        if (!indexDialogDocClickBinded) {
            indexDialogDocClickBinded = true
            document.addEventListener('mousedown', (e) => {
                const aiWrap = document.getElementById(AI_CREATE_OVERLAY_ID)
                if (!aiWrap || aiWrap.style.display === 'none') return
                if (e.target && aiWrap.contains(e.target)) {
                    closeIndexLayerDialogs()
                }
            }, true)
        }
        const input = dlg.querySelector('#folder_new_title')
        if (input) input.value = ''
        const submitFolder = () => {
            const title = (input && input.value ? input.value : '').trim()
            if (!title) return
            const homeTab = tabGroup.getTab(tabData.homeTabId)
            if (homeTab && homeTab.webview) {
                const safe = title.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
                homeTab.webview.executeJavaScript(`(()=>{if(window.pageContext&&pageContext.createFolderByTitle){pageContext.createFolderByTitle('${safe}');}})();`)
            }
            closeIndexLayerDialogs()
        }
        $(dlg).dialog({
            title: title || '新建文件夹',
            mask: false,
            onClose: function () {
                closeIndexLayerDialogs()
            }
        })
        $(dlg).find('#btn_submit_folder').off('click').on('click', submitFolder)
        $(dlg).find('.close').off('click').on('click', closeIndexLayerDialogs)
        $(dlg).find('.close-btn').off('click').on('click', () => {
            if (input) input.value = ''
            if ($(dlg).hasClass('dialog-box')) $(dlg).dialog('close')
        })
        clearWindowMaskEverywhere()
        $('#window-mask,.window-mask').remove()
        let winMask = $("<div id='window-mask' class='window-mask po-dlg-mask' style='display:none'></div>").appendTo("body")
        winMask.show().css('z-index', 9).on('click', closeIndexLayerDialogs)
        $(dlg).css('z-index', 10)
        $(dlg).find('.dialog-close').off('click.indexFolder').on('click.indexFolder', () => {
            closeIndexLayerDialogs()
        })
        if (input) {
            input.focus()
            input.onkeyup = function (e) {
                if (e.keyCode == 13) submitFolder()
            }
        }
    },
    showIndexImportDlg: function () {
        const mask = getIndexModalMask()
        mask.style.display = 'block'
        let cover = document.getElementById('importRootCover')
        if (!cover) {
            cover = document.createElement('div')
            cover.id = 'importRootCover'
            cover.style.cssText = 'display:none;position:fixed;left:0;top:0;right:0;bottom:0;z-index:25;'
            document.body.appendChild(cover)
        }
        let root = document.getElementById('importRoot')
        if (!root) {
            root = document.createElement('div')
            root.id = 'importRoot'
            root.style.cssText = 'display:none;position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:26;'
            document.body.appendChild(root)
        }
        cover.style.display = 'block'
        root.style.display = 'block'
        if (!indexImportInited) {
            Import.importInit()
            indexImportInited = true
        }
        // Keep toEditor override only for Markdown/Mermaid text-input path (runs in index context)
        window.minder.toEditor = function (category, filepath, title) {
            let url = './src/v5_editor/source/compile/diagrams/index.html'
            if (category.indexOf('mind') >= 0 || ['fishbone', 'timeline', 'ishikawa'].includes(category)) {
                url = './src/v5_editor/source/compile/mindmap/index.html'
            } else if (category === 'outline') {
                url = './src/v5_editor/source/compile/outline/index.html'
            } else if (category === 'markdown') {
                url = './src/markdown-editor/index.html'
            }
            pcUtil.openWin({ url: url + `?token=token&chartId=&dbId=&filepath=${encodeURIComponent(filepath)}`, title: title })
            closeIndexLayerDialogs()
        }
        if (!window.VueImportRoot) {
            const app = createApp(ImportDlg)
            install(app)
            const vm = app.mount('#importRoot')
            window.VueImportRoot = vm
            window.VueImportApp = app
        }
        // Intercept file-based import: forward file path to home webview
        if (!importFileInterceptors) {
            const forwardFileToHome = (filePath) => {
                if (!filePath) return
                const homeTab = tabGroup.getTab(tabData.homeTabId)
                closeIndexLayerDialogs()
                if (homeTab && homeTab.webview) {
                    homeTab.webview.executeJavaScript(`pageContext.importFileByPath(${JSON.stringify(filePath)})`)
                }
            }
            const changeHandler = function (e) {
                if (e.target && e.target.id === 'share_doc_input') {
                    const file = e.target.files && e.target.files[0]
                    if (file && file.path) {
                        e.stopImmediatePropagation()
                        $(e.target).val('')
                        forwardFileToHome(file.path)
                    }
                }
            }
            const dropHandler = function (e) {
                const form = document.getElementById('share_upload_form')
                if (form && e.dataTransfer && e.dataTransfer.files.length) {
                    const file = e.dataTransfer.files[0]
                    if (file && file.path) {
                        e.stopImmediatePropagation()
                        e.preventDefault()
                        forwardFileToHome(file.path)
                    }
                }
            }
            document.addEventListener('change', changeHandler, true)
            document.addEventListener('drop', dropHandler, true)
            importFileInterceptors = { change: changeHandler, drop: dropHandler }
        }
        if (window.VueImportRoot && !window.VueImportRoot.__indexClosePatched) {
            const originClose = window.VueImportRoot.eDlgClose ? window.VueImportRoot.eDlgClose.bind(window.VueImportRoot) : null
            window.VueImportRoot.eDlgClose = function (...args) {
                if (originClose) originClose(...args)
                closeIndexLayerDialogs()
            }
            window.VueImportRoot.__indexClosePatched = true
        }
        if (!indexDialogDocClickBinded) {
            indexDialogDocClickBinded = true
            document.addEventListener('mousedown', (e) => {
                const aiWrap = document.getElementById(AI_CREATE_OVERLAY_ID)
                if (!aiWrap || aiWrap.style.display === 'none') return
                if (e.target && aiWrap.contains(e.target)) {
                    closeIndexLayerDialogs()
                    tabGroupExtend.hideCreateBtnListOverlay()
                    closeCreateBtnListInHomeWebview()
                }
            }, true)
        }
    },
    hideCreateBtnListOverlay: function () {
        const wrap = document.getElementById(CREATE_BTN_LIST_OVERLAY_ID)
        if (!wrap) return
        wrap.style.display = 'none'
    },
    openAiCreateWebview: function (opt = {}, sourceTabId) {
        if (isMasSubmissionLite(CONFIG)) {
            masUnsupportedToast(Toast)
            return
        }
        if (sourceTabId !== tabData.homeTabId) return
        const activeTab = tabGroup.getActiveTab()
        if (!activeTab || activeTab.id !== tabData.homeTabId) return
        aiCreateSuspended = false
        const { wrap, webview } = getAiCreateOverlayElements()
        const token = localStorage.getItem("processon_token") || ''
        if (token) {
            ipc.send("set_cookie", token)
        }
        const fallbackUrl = `${ipc.sendSync("getGlobal", "host")}/ai?hide_left&hide_tool&token=${token}&channelType=${CONFIG.CHANNELTYPE}&sourceType=pc`
        const targetUrl = opt.url || fallbackUrl
        aiCreateLastUrl = targetUrl
        aiCreateWebviewOpened = true
        wrap.style.display = 'block'
        ipc.send('setAiCreateWindowMin')
        this.updateAiCreateWebviewBounds()
        requestAnimationFrame(() => this.updateAiCreateWebviewBounds())
        setTimeout(() => this.updateAiCreateWebviewBounds(), 80)
        if (!navigator.onLine) {
            showAiCreateOfflineState()
            return
        }
        hideAiCreateOfflineState()
        if (webview.getAttribute('src') !== targetUrl) {
            webview.setAttribute('src', targetUrl)
        }
    },
    closeAiCreateWebview: function () {
        if (aiCreateSuspended) {
            this.hideAiCreateWebviewTemp()
            return
        }
        const wrap = document.getElementById(AI_CREATE_OVERLAY_ID)
        aiCreateWebviewOpened = false
        aiCreateLastUrl = ''
        this.hideCreateBtnListOverlay()
        ipc.send('restoreWindowMinSize')
        if (!wrap) return
        wrap.style.display = 'none'
        hideAiCreateOfflineState()
    },
    hideAiCreateWebviewTemp: function () {
        const wrap = document.getElementById(AI_CREATE_OVERLAY_ID)
        if (!wrap) return
        wrap.style.display = 'none'
        ipc.send('restoreWindowMinSize')
    },
    restoreAiCreateWebview: function () {
        if (!aiCreateWebviewOpened && !aiCreateSuspended) return
        const activeTab = tabGroup.getActiveTab()
        if (!activeTab || activeTab.id !== tabData.homeTabId) return
        const { wrap } = getAiCreateOverlayElements()
        aiCreateWebviewOpened = true
        wrap.style.display = 'block'
        ipc.send('setAiCreateWindowMin')
        this.updateAiCreateWebviewBounds()
        if (!aiCreateSuspended) {
            this.handleAiCreateNetworkChange(navigator.onLine)
        }
    },
    handleAiCreateNetworkChange: function (isOnline) {
        if (!aiCreateWebviewOpened) return
        const activeTab = tabGroup.getActiveTab()
        if (!activeTab || activeTab.id !== tabData.homeTabId) return
        const { webview } = getAiCreateOverlayElements()
        if (!webview) return
        if (!isOnline) {
            showAiCreateOfflineState()
            return
        }
        hideAiCreateOfflineState()
        const targetUrl = aiCreateLastUrl || webview.getAttribute('src') || ''
        if (!targetUrl) return
        if (webview.getAttribute('src') !== targetUrl) {
            webview.setAttribute('src', targetUrl)
        } else {
            webview.reload()
        }
    },
    isListenFileStatus: function (filepath = '', tabId) {
        if (!filepath.endsWith('.bak') && filepath != '') {
            ipc.send('listenFileStatus', { filepath, tabId })
        }
    },
    removeListenFileStatus: function (filepath) {
        if (!filepath.endsWith('.bak')) {
            ipc.send('removeListenFileStatus', filepath)
        }
    },
    rename: function (tabId, isMyFile) {
        if (!isMyFile) {
            const tabElement = tabGroup.getTab(tabId).element
            const tabTitleElement = tabElement.querySelector('.tab-title')
            const input = tabElement.querySelector('.tab-input')
            $(tabTitleElement).hide()
            $(input).html($(tabTitleElement).html())
            $(input).show()
            $(input).focus()
            $(input).select()
        }
    },
    showDoubleElevenPopup: (opts = {}) => {
        showDoubleElevenPopupLayer(opts)
    },
    showDlgDownWebView: (obj) => {
        const { type, url } = obj
        
        console.log(ipc.sendSync("getGlobal"))
        const webviewWrap = $("#downing")[0]
        const webview = $("#downing webview")[0]
        var dialogClose = $("<div class='dialog-close icons_web'>&#xe728;</div>")
        if (type == 1) {
            $(webviewWrap).removeAttr('style')
            $(webviewWrap).css({ width: '852px', height: '640px', background: '#fff', overflow: 'hidden' })
            $(webview).css({ width: '852px', height: '640px', background: '#fff' })
        }
        else if (type == 2) {
            $(webviewWrap).css({ width: '1018px', height: '650px' })
            $(webview).css({ width: '1018px', height: '650px' })
        }
        let to
        if (type == 3) {
            to = new Toast({
                type: 'warning',
                msg: '下载中,请稍后',
                autoClose: false
            })
        }
        if (!webview.hasAttribute('preload')) {
            webview.removeEventListener('did-finish-load', () => { })
            webview.addEventListener('did-finish-load', () => {
            });
            webview.addEventListener("did-navigate", (e) => {
                if (CONFIG.isOpenDevTool) webview.openDevTools();
            })

            webview.addEventListener("ipc-message", (e) => {
                console.log(e)
                switch (e.channel) {
                    case 'copyDownImage':
                        ipc.invoke('cliCopyImage', e.args && e.args[0]).then((ok) => {
                            new Toast({ type: ok ? 'success' : 'error', msg: ok ? '图片复制成功' : '图片复制失败' })
                        }).catch(() => {
                            new Toast({ type: 'error', msg: '图片复制失败' })
                        })
                        break;
                    case 'downDialogReady':
                        if (downShowTimer) {
                            clearTimeout(downShowTimer)
                            downShowTimer = null
                        }
                        revealDownView()
                        break;
                    case 'down':
                        to = new Toast({
                            type: 'warning',
                            msg: '下载中,请稍后',
                            autoClose: false
                        })
                        break;
                    case 'cancel':
                        to && to.close()
                        new Toast({
                            type: 'warning',
                            msg: '下载取消'
                        })
                        setTimeout(() => {
                            to = null
                        }, 500);
                        $('.downing_d').hide()
                        $('.downing').hide()
                        webview.setAttribute('preload', '');
                        webview.setAttribute('src', '');
                        break;
                    case 'downed':
                        to && to.close()
                        new Toast({
                            type: 'success',
                            msg: '下载成功'
                        })
                        setTimeout(() => {
                            to = null
                        }, 500);
                        $('.downing_d').hide()
                        $('.downing').hide()
                        webview.setAttribute('preload', '');
                        webview.setAttribute('src', '');
                        break;
                    case 'showDlgPayWebView':
                        tabGroupExtend.showDlgPayWebView(e.args[0] || {})
                        break;
                    case 'showDlgPayWebView1':
                        if (e.args[0].pay_position) {
                            tabGroupExtend.showDlgPayWebView({ pay_position: e.args[0].pay_position, title: e.args[0].title })
                        } else {
                            tabGroupExtend.showDlgPayWebView({ pointspage: e.args[0].pointspage, pointssource: e.args[0].pointssource, title: e.args[0].title })
                        }
                        break;
                }
            })
            dialogClose.appendTo(webviewWrap);
            dialogClose.css({ zIndex: '20' }).show();
            dialogClose.bind("click", function () {
                if (to) {
                    to.close()
                    setTimeout(() => {
                        to = null
                    }, 500);
                }
                $('.downing_d').hide()
                $('.downing').hide()
                webview.setAttribute('preload', '');
                webview.setAttribute('src', '');
            });
        }
        else {
            webview.setAttribute('preload', '');
            webview.setAttribute('src', '');
        }

        const preload = "file://" + path.resolve(`${__dirname}/index.js`)
        webview.setAttribute('preload', preload);
        webview.setAttribute('src', url);
        if (type != 3) {
            downShowTimer = setTimeout(() => {
                downShowTimer = null
                revealDownView()
            }, 1000);
        }
        else {
            webviewWrap.style.display = 'flex';
            $(webviewWrap).css({ position: 'fixed', left: null, top: null, zIndex: -1 });
            $('.downing').show()
        }
    },
}
window.tabGroupExtend = tabGroupExtend

window.upgradeDlg = (res) => {
    console.log(res)
    const el = $('.upgrade')
    const eld = $('.upgrade-d')
    $('.button.upgrade-button-continue').text('继续创建')
    if (res[0].dlgType == 1 || res[0].dlgType == 5) {
        el.find('.upgrade-top1').html('云文件数量已达上限')
        el.find('.upgrade-top2').html('免费云文件数量已达上限，新建将限制形状、节点数量以及文件保存方式')
        $('.button.upgrade-button-continue').show()
    } else if (res[0].dlgType == 3) {
        el.find('.upgrade-top1').html('云文件数量已达上限')
        el.find('.upgrade-top2').html('免费云文件数量已达上限，新建将限制形状、节点数量以及文件保存方式')
        $('.button.upgrade-button-continue').hide()
    }
    else if (res[0].dlgType == 4) { // 编辑器保存弹框的
        el.find('.upgrade-top1').html('云文件数量已达上限')
        el.find('.upgrade-top2').html('免费云文件数量已达上限，该文件仅支持保存到本地桌面')
        $('.button.upgrade-button-continue').text('保存到本地').show()
    } else {
        el.find('.upgrade-top1').html('形状已达上限')
        el.find('.upgrade-top2').html('形状数量已达上限，升级账号后数量不受限')
        $('.button.upgrade-button-continue').hide()
    }
    el.find('.upgrade-close').off().on('click', () => {
        el.hide()
        eld.hide()
    })
    el.find('.upgrade-button-continue').off().on('click', () => {
        el.hide()
        eld.hide()
        if (res[0].dlgType == 5) {
            tabGroup.getTab(0).webview.send("isClonePayButOverd");
            return
        }
        if (res[0].dlgType == 4) {
            ipc.invoke('getSaveFilePath', { path: res[0].res, suffix: res[0].suffix }).then((result) => {
                if (result !== '') {
                    tabGroup.getTab(parseInt(res[0].id)).webview.send("saveFile_callback", { type: 1, path: result, saveAs: res[0].saveAs });
                }
            })
            return
        }
        let url = ''
        if (res[0].type.indexOf("mind") >= 0) url = './src/v5_editor/source/compile/mindmap/index.html';
        else if (res[0].type == "outline") url = './src/v5_editor/source/compile/outline/index.html';
        else if (res[0].type == "markdown") url = './src/markdown-editor/index.html';
        else url = './src/v5_editor/source/compile/diagrams/index.html';
        let path = `?token=token&chartId=&dbId=&filepath=&type=${res[0].category}&new=true`
        if (res[0].tempId) {
            path += `&tempId=${res[0].tempId}`
        }
        if (res[0].filepath) {
            path = `?token=token&chartId=&dbId=&filepath=${res[0].filepath}`
        }
        tabGroupExtend.addTab({ src: url + path, title: '未命名文件' })
    })
    el.find('.upgrade-button-upgrade').off().on('click', () => {
        el.hide()
        eld.hide()
        window.poCollect('展示支付弹窗', { '触发位置': '首页新建文件不足点击立即升级' })
        tabGroupExtend.showDlgPayWebView({ pay_position: res[0].pay_position })
    })
    el.show()
    eld.show()
}

ipc.on('associated', (_, url) => {
    console.log("associatedurl", url)
    let path = `./src/v5_editor/source/compile/diagrams/index.html?token=token&chartId=&dbId=&filepath=${encodeURIComponent(url)}`
    if (url.endsWith('.posm') || url.endsWith('xmind') || url.endsWith('mmap') || url.endsWith('mm') || url.endsWith('km') || url.endsWith('csv')) {
        path = `./src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=&dbId=&filepath=${encodeURIComponent(url)}`
    } else if (url.endsWith('.poso') || url.endsWith('opml')) {
        path = `./src/v5_editor/source/compile/outline/index.html?token=token&chartId=&dbId=&filepath=${encodeURIComponent(url)}`
    } else if (url.endsWith('.md')) {
        path = `./src/markdown-editor/index.html?token=token&chartId=&dbId=&filepath=${encodeURIComponent(url)}`
    }
    else if (url == 'new_flow') {
        path = `./src/v5_editor/source/compile/diagrams/index.html?token=token&chartId=&dbId=&filepath=`
    }
    else if (url == 'new_mind') {
        path = `./src/v5_editor/source/compile/mindmap/index.html?token=token&chartId=&dbId=&filepath=`
    }
    else if (url == 'new_outline') {
        path = `./src/v5_editor/source/compile/outline/index.html?token=token&chartId=&dbId=&filepath=`
    }


    let tabs = tabGroup.getTabs();
    let fileIds = [];

    tabs.map(tab => {
        if (tab.element.getAttribute("data-chartid")) {
            fileIds.push(tab.element.getAttribute("data-chartid"))
        }

        if (tab.element.getAttribute("data-filepath")) {
            fileIds.push(decodeURIComponent(tab.element.getAttribute("data-filepath")))
        }
    });

    const has = fileIds.some(item => { return item === url })

    if (url && has) {
        tabGroupExtend.selectTabByChartId('', url)
        return
    }


    tabGroupExtend.addTab({
        src: path,
        title: url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.'))
    })
})


ipc.on('preRefreshing', () => {
    const RefreshTabs = tabGroup.getTabs()
    const user = localStorage.getItem('privilege')
    RefreshTabs.forEach((d) => {
        if (d.id) {
            tabGroup.getTab(d.id).webview.send("refreshVipStatus", user);
        }
    })
})


ipc.on('localUpload_callback', (e, res) => {
    const fileId = res.data.id
    const index = tabData.localUploadArr.findIndex((a) => a.chartId === fileId)
    if (index > -1 && res.code == 200) {
        tabGroup.getTab(tabData.localUploadArr[index].tabId).webview.send('localUpload_callback', res)
        tabData.localUploadArr.splice(index, 1)
    }
    else if (index > -1 && res.code != 200) {
        tabGroup.getTab(tabData.localUploadArr[index].tabId).webview.send('localUpload_callback', res)
        tabData.localUploadArr.splice(index, 1)
    }
})


ipc.on('startInterVal_callback', (e, res) => {
    tabGroup.getTab(0).webview.send("startInterVal_callback", res)
})

ipc.on('listenRemoveFile', (_, obj) => {
    const tabElement = tabGroup.getTab(obj.tabId).element
    $(tabElement.querySelector('.tab-title')).attr('style', 'color:#bbbbbb;text-decoration:line-through')
    tabGroup.getTab(obj.tabId).webview.send("listenRemoveFile");
})

ipc.on('listenRestoreFile', (_, obj) => {
    const tabElement = tabGroup.getTab(obj.tabId).element
    $(tabElement.querySelector('.tab-title')).removeAttr('style')
    tabGroup.getTab(obj.tabId).webview.send("listenRestoreFile");
})

ipc.on('endCheckFile', (_evt, e) => {
    tabGroup.getTab(0).webview.send("endCheckFile", e)
})