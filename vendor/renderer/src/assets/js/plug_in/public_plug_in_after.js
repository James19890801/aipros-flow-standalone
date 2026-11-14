import ServerUtil from "../pc/server/server.js";
import FileDatabase from "./../pc/operation/fileDatabase.js";

const hostUrl = ipc.sendSync('getHost')
//隐藏pos文件之后的所有下载形式
// $('#header-export-menu .po-menu-item[tit=pos]').nextAll().remove()
// $('#header-export-menu .po-menu-item[type=pos]').nextAll().remove()
/** 修改websocket地址 */

/** 修改websocket地址 */
window.wemeetCommon = {
  init: function () {
    return;
  }
}

$.confirm = function (options) {
  var confirmWin = $("#global_confirm_window");
  var okval = "确定";
  var tokenClass = " ";
  if (options.okval) {
    okval = options.okval;
  }
  if (options.tokenClass) {
    tokenClass = options.tokenClass;
  }
  if (!confirmWin.length) {
    confirmWin = $("<div id='global_confirm_window' tabindex='-1' class='confirm-box " + tokenClass + "' title='请确认'><div class='dlg-content'>" + options.content + "</div><div class='dlg-buttons'><span class='pro-btn default okbtn'>" + okval + "</span>&nbsp;&nbsp;<span class='pro-btn basic cancelbtn close'>取消</span></div></div>").appendTo("body");
  } else {
    confirmWin.find(".dlg-content").html(options.content);
    confirmWin.find(".okbtn").html(okval);
  }
  if (options.width) {
    confirmWin.css("width", options.width);
  }
  if (options.height) {
    confirmWin.css("height", options.height);
  }
  if (options.hiddenOK) {
    confirmWin.find(".okbtn").css("visibility", "hidden")
  } else {
    confirmWin.find(".okbtn").css("visibility", "visible")
  }
  if (options.hiddenCancel) {
    confirmWin.find(".cancelbtn").css("display", "none")
  } else {
    confirmWin.find(".cancelbtn").css("visibility", "inline-block")
  }
  confirmWin.dialog();
  $('#po-dlg-mask').css('z-index', '4')
  $(document).off('keyup.confirm').on('keyup.confirm', function (e) {
    if (e.keyCode == 13)
      confirmWin.find(".okbtn").trigger('click');
  });
  confirmWin.find(".okbtn").off().on("click", function () {
    confirmWin.dialog("close");
    if (options.onConfirm) {
      options.onConfirm();
    }
    $(document).off('keyup.confirm');
  });
  confirmWin.find(".cancelbtn").off("click.cancel").on("click.cancel", function () {
    if (options.onCancel) {
      options.onCancel();
    }
    $(document).off('keyup.confirm');
  });
};



// window.insert.feedback.init = function (opt) {
//   if (!navigator.onLine) {
//     new Toast('needNetwork')
//     return
//   }
//   ipc.sendToHost("showFeedBackWin")
// }


window.PoNetwork.init = () => { }
window.PoNetwork.test = () => { }
// 离线提示
// window.configCollaSave.offlineDialog = () => { console.log('离线提示') }
$('#header-history').hide()
$('#po-header a.reconn').css('display', 'none !important')


const filepath = pcUtil.getUrlParams('filepath')
const __toast = $.toast;
$.toast = (opt, e) => {
  console.log(opt)
  if (opt == "close") {
    __toast(opt, e);
    return;
  }
  if (window.isMyFile) {
    if (opt.text == '保存成功' || opt.text == '当前文件仅可查看' || opt.text == '画布上字数过多') {
      return
    }
  }
  if (!window.isMyFile && filepath) {
    if (opt.text == '保存成功' || opt.text == '图形添加失败' || opt.text == '当前文件仅可查看' || opt.text == '画布上字数过多') {
      return
    }
  }
  if (!window.isMyFile && !filepath) {
    if (opt.text == '当前文件仅可查看' || opt.text == '画布上字数过多') {
      return
    }
    if (opt && opt.text && opt.text.indexOf("网络已断开") < 0) {
      __toast(opt, e);
    }
  }
  if (typeof opt != "object") return;
  if (opt && opt.text && opt.text.indexOf("网络已断开") < 0) __toast(opt, e);
};

console.log('+++++', window.Server)
/*收藏*/
try {
  window.Server.favChart = function (cb) {
    Util.ajax({
      url: ipc.sendSync('getGlobal', "host") + "/api/personal/view/favourite/chart",
      type: 'post',
      data: { chartId: chartId, chartType: "chart" },
      success: function (res) {
        FileDatabase.getChartById(chartId, chart => {
          chart.favourite = chart.favourite != null || chart.favourite != undefined ? !chart.favourite : false;
          FileDatabase.updateChart(chart.chartId, false, chart, chart => {
          })
        });
        cb(res)
      },
      error: function () {
        cb("error")
      }
    })
  }
} catch (e) {

}

