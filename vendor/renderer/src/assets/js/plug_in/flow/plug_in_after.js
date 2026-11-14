import FileDatabase from '../../pc/operation/fileDatabase.js'
import { Toast } from '../../pc/class.js'


// window.ajax = $.ajax

/** -start- 添加 监听网络状态 附加逻辑 */
// 网络恢复
const online = function () {
  if (!window.isMyFile) {
    FileDatabase.getChartById(chartId, (chart) => {
      chartId = chart.id
      if (chartId.length > 12) sendMessage.saveOnline()
    })
  }
}
window.addEventListener('online', online)
/** -end- 添加 监听网络状态 附加逻辑 */

/**
 * -start- 添加 初始化完毕事件 附加逻辑
 * */
$(function () {
  // 隐藏index弹窗
  const hideIndexMenu = function () {
    ipc.sendToHost('hideTabMore')
  }
  $('body')
    .off('mouseup', hideIndexMenu)
    .on('mouseup', hideIndexMenu)

  $('.share_container>div.user').remove()
  $('.ico_fullscreen')
    .off()
    .on('click', function () {
      ipc.send('win_opts', 'fullScreen')
    })

  // let chartId = pcUtil.getUrlParams("chartId");
  FileDatabase.getChartById(chartId, (chart) => $('.diagram_title, title').text(chart.title))

  $('#collaborators img').attr('src', pcUtil.Avatar(userId))

  // 全屏
  $('.btn_back')
    .off()
    .on('click', (e) => {
      e.stopPropagation()
      ipc.sendToHost('selectTab', 0, true)
      return false
    })
  // 退出全屏
  const isFullScreen = () => {
    return !!(
      document.fullscreen ||
      document.mozFullScreen ||
      document.webkitIsFullScreen ||
      document.webkitFullScreen ||
      document.msFullScreen
    )
  }
  function exitFullscreen() {
    if (document.exitFullScreen) {
      document.exitFullScreen()
      //兼容Firefox
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen()
      //兼容Chrome, Safari and Opera等
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
      //兼容IE/Edge
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  }
  $(window).on('keydown', function (e) {
    // if(e.keyCode == 27) {
    //     ipc.send("win_opts", "unFullScreen");
    //     isFullScreen() && exitFullscreen();
    // }
    // F10 快捷键 预览
    if (e.keyCode == 121) {
      Dock.enterPresentation()
      return false
    }
    // F11 快捷键 全屏
    if (e.keyCode == 122) {
      ipc.send('win_opts', 'fullScreen')
    }
  })
  ipc.on('pong_event', (e, m) => {
    if (m.k == 'unFullScreen') {
      // ipc.send("win_opts", "unFullScreen");
      isFullScreen() && exitFullscreen()
    }
  })
  ipc.on('pong_event', (e, m) => {
    if (m.k == 'unFullScreen') {
      // ipc.send("win_opts", "unFullScreen");
      isFullScreen() && exitFullscreen()
    }
  })
  $('#po-flow-back').on('mouseup', function (e) {
    e.stopPropagation()
    ipc.sendToHost('selectTab', 0, true)
    return false
  })

  $('#po-flow-user-photo').remove()
  //离线版未制作功能
  $('#po-flow-dock-layout').attr('style', 'top:89px')
})
/** -end- 添加 初始化完毕事件 附加逻辑 */

/** -start- 修改 关闭 方法 */
$('#menu_bar_file').on('mousedown', () => {
  setTimeout(() => {
    $('li[ac=close]').on('mousedown', (e) => {
      e.stopPropagation()
      ipc.sendToHost('selectTab', 0, true)
      return false
    })
  }, 0)
})
/** -end- 修改 关闭 方法 */

/*隐藏底部操作栏模版*/
// hideTemplate()
function hideTemplate() {
  let interNum = 0
  if ($('#po-designer-foot').is(':visible')) {
    const interval = setInterval(() => {
      interNum += 1
      $('#open-insert-temp').remove()
      if (interNum >= 50) {
        clearInterval(interval)
      }
    }, 100)
  }
}
/*隐藏底部操作栏模版*/

// 导出部分图形拦截
Designer.events.addEventListener('downloadPart', function () {
  window.editorGlobalConfig.onBeforeExport({ type: 'download_part', call: () => { }, isSave: false, partIds: [] })
})
if (document.body.offsetWidth <= 1280) {
  $('.po-toolbar-center').css('width', '1000px')
}
window.addEventListener('resize', function () {
  if (document.body.offsetWidth <= 1280) {
    $('.po-toolbar-center').css('width', '1000px')
  }
  else {
    $('.po-toolbar-center').css('width', 'auto')
  }
})