/** -start- 修改 jquery 扩展功能 */
let oldIsEmptyObject = $.isEmptyObject;
$.isEmptyObject = function (arr) {
  if (arr && arr instanceof Array) return !arr.length;
  else return oldIsEmptyObject(arr);
}
/** -end- 修改 jquery 扩展功能 */


/** -start- 添加 初始化完毕事件 附加逻辑 */
$(function () {
  // ESC退出全屏
  $("body").on("keydown", function (e) {
    if (e.keyCode == 27) ipc.send("win_opts", "unFullScreen");
  });

  // 隐藏index弹窗
  let hideIndexMenu = function () {
    ipc.sendToHost("hideTabMore");
  };
  $("body").off("mouseup", hideIndexMenu).on("mouseup", hideIndexMenu)

  // 进入全屏显示
  let full = function () {
    ipc.send("win_opts", "fullScreen");
  };
  $(".mind-icons[tit=full]").off("click", full).on("click", full);
});
/** -end- 添加 初始化完毕事件 附加逻辑 */

const targetNode = document.documentElement
const config = { childList: true, subtree: true }

const observer = new MutationObserver((mutationsList) => {
  for (const mutation of mutationsList) {
    const addedNodes = mutation.addedNodes
    for (const node of addedNodes) {
      if (node.nodeType === 1) {
        if ($(node).is('.po-footer-right')) {
          const privilege = JSON.parse(localStorage.getItem('privilege'))
          if ((!privilege.member && !privilege.orgMember)) {
            $('.topics-nums').before(`<div class="topics-nums page-topics-nums">主题限制：<span id="shape-number">80</span></div>`)
          }
        }
        // if ($(node).is('.mention-bottom')) {
        //   $('.mention-bottom').remove()
        // }
        // $(checkDoms(node)).remove()
      }
    }
  }
})

observer.observe(targetNode, config)


