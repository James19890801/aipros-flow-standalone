import Constant from './../constant'
import "./../../../css/pc/contextMenu.less"
// 当前显示的子菜单索引
let menuList = Constant.menuList;
let menuWidth = 160; // 默认菜单宽度
let subMenuWidth = 150; // 默认子菜单宽度
// 生成菜单
const createMenu = () => {
    const $contextMenu = $('<div id="contextMenu" class="contextMenu"></div>');
    menuList.forEach((item, index) => {
        const $li = $('<li>');
        if (item.type === 'devider') {
            $li.append('<div class="devider"></div>');
        } else {
            const $item = $(`
								<div class="context_item  ${item.addClass || ''}" 
									 data-btn-i="${item.data}" 
                                     data-hasSub="${item.subMenu && item.subMenu.length > 0}"
									 data-category="${item.category}">
									<span class="context_img">
										<img src="${item.iconsImg}" />
									</span>
									<span class="context_text">${item.title}</span>
									${item.subMenu ? '<img style="margin-left: auto; margin-right: 0px;" src="src/assets/images/icon/newbuild/arrow.svg" />' : ''}
								</div>
							`);

            if (item.subMenu) {
                const $subMenu = $('<div class="context_sub_menu"></div>');
                const $subUl = $('<ul>');
                item.subMenu.forEach(subItem => {
                    $subUl.append(`
										<li>
											<div class="sub_item"  data-category="${subItem.category}">
												<img class="sub_context_img" src="${subItem.iconsImg}" />
												<span class="sub_text">${subItem.title}</span>
											</div>
										</li>
									`);
                });

                $subMenu.append($subUl);
                $item.append($subMenu);
            }

            $li.append($item);
        }

        $contextMenu.append($li);
    });
    $('body').append($contextMenu)
}


// 显示/隐藏子菜单
function toggleSubMenu(event) {
    // 隐藏所有子菜单
    $('.context_sub_menu').hide();

    const $menuItem = $(event.currentTarget).closest('.context_item');
    const hasSubMenu = $menuItem.data('hassub') === true;

    if (!hasSubMenu) return;

    const $subMenu = $menuItem.find('.context_sub_menu');
    if (!$subMenu.length) return;

    // 显示当前子菜单
    $subMenu.show();

    // 调整子菜单位置 - 这里只需要传递两个参数
    adjustMenuPosition($menuItem, $subMenu);
}

// 调整子菜单位置
function adjustMenuPosition($menuItem, $subMenu) {
    const windowWidth = $(window).width();
    const windowHeight = $(window).height();
    const menuWidth = $menuItem.outerWidth() || 160;
    const menuRect = $menuItem[0].getBoundingClientRect();
    const subMenuHeight = $subMenu.outerHeight();
    const subMenuWidth = $subMenu.outerWidth();

    // 判断一级菜单是否在左侧显示
    const isMenuOnLeft = $menuItem.closest('.contextMenu').offset().left > menuRect.left;

    // 计算水平位置
    if (isMenuOnLeft) {
        // 一级菜单在左侧，二级菜单也显示在左侧
        $subMenu.css({
            left: 'auto',
            right: menuWidth + 10 + 'px'
        });
    } else if (menuRect.right + subMenuWidth > windowWidth) {
        // 显示在左侧
        $subMenu.css({
            left: -menuWidth - 10 + 'px',
            right: 'auto'
        });
    } else {
        // 显示在右侧
        $subMenu.css({
            left: menuWidth + 10 + 'px',
            right: 'auto'
        });
    }

    // 计算垂直位置（保持不变）
    if (menuRect.bottom + subMenuHeight > windowHeight) {
        // 显示在上方
        $subMenu.css({
            top: - (subMenuHeight - menuRect.height) + 'px',
            bottom: 'auto'
        });
    } else {
        // 显示在下方
        $subMenu.css({
            top: '0',
            bottom: 'auto'
        });
    }
}

function showContextMenu(event) {
    event.preventDefault();

    const $contextMenu = $('#contextMenu');
    const windowWidth = $(window).width();
    const windowHeight = $(window).height();
    // 计算一级菜单位置
    let left = event.pageX;
    let top = event.pageY;

    // 水平方向调整
    if (left + menuWidth > windowWidth) {
        left = left - menuWidth;
    }

    // 垂直方向调整
    if (top + $contextMenu.outerHeight() > windowHeight) {
        top = top - $contextMenu.outerHeight();
    }

    $contextMenu.css({
        left: left + 'px',
        top: top + 'px',
        display: 'block'
    });

    // 隐藏所有子菜单
    $('.context_sub_menu').hide();
    // 点击其他地方隐藏菜单
    $(document).one('click', function () {
        $contextMenu.hide();
    });
}


const bindMenuEvent = () => {
    // 绑定事件
    $(document).on('contextmenu', function (e) {
        // e.preventDefault()
        if(e.target.closest('.file-list-item') || e.target.closest('.list-item')){
            return
        }
        if (e.target.closest('.tempateCreateGirdWarp') || e.target.closest('#po-files-list')) {
            showContextMenu(e)
        }
    });

    // 菜单项鼠标进入事件
    $('#contextMenu').on('mouseenter', '.context_item', function (e) {
        toggleSubMenu(e);
    });

    // 菜单项点击事件
    $('#contextMenu').on('click', '.context_item, .sub_item', function (e) {
        e.stopPropagation();

        // 如果是主菜单项且有子菜单，不关闭菜单
        if ($(this).hasClass('context_item') && $(this).find('.context_sub_menu').length > 0) {
            return;
        }

        $('#contextMenu').hide()
        const category = $(this).data('category')
        console.log('菜单项被点击:',);
        if (category == 'folder') {
            pageContext.createFolder();
        } else if (category == 'temp') {
            shell.openExternal(
                `${ipc.sendSync("getGlobal", "host")}/template`
            )
        } else {
            if (['flow', 'uml', 'er', 'graph', 'plana', 'gantt', 'swimlane', 'framework', 'bpmn', 'venn', 'network'].includes(category)) { //打开流程图
                pageContext.createChart("flow", category, "首页左上角", category);
            } else if (category == 'outline') {//打开思维导图
                pageContext.createChart("outline", category, "首页左上角", category);
            } else {
                pageContext.createChart("mind", category, "首页左上角", category);
            }
        }
    });
}

const initContextMenu = () => {
    console.log('initContextMenu')
    // 创建右键菜单
    createMenu()

    // 获取实际菜单宽度
    const $contextMenu = $('#contextMenu');
    $contextMenu.show(); // 临时显示以测量尺寸
    menuWidth = $contextMenu.outerWidth();
    subMenuWidth = $('.context_sub_menu', $contextMenu).outerWidth();
    $contextMenu.hide(); // 测量完隐藏

    // 事件
    bindMenuEvent()
}


export {
    initContextMenu
}