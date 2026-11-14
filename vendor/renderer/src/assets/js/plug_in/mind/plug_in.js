import UserOperation from "../../pc/db/user.js";
import FileDatabase from "../../pc/operation/fileDatabase.js";
import { Toast } from "../../pc/class.js";
window.domain = ''
// 添加全局对象
window.Toast = Toast;
window.chartId = pcUtil.getUrlParams("chartId");
window.userId = UserOperation.getUk();
window.chartTitle = "未命名文件";
window.chart = undefined;
window.FileOperation = FileDatabase;
window.userName = localStorage.getItem("processon_fullName");
// window.websocketUrl = ipc.sendSync('getGlobal',"websocketUrl");
window.websocketToken = UserOperation.getWsToken();
window.version = 0;
window.pc_host = ipc.sendSync('getGlobal', "host");
window.isOpenPublish2Owner = pcUtil.getUrlParams("colla") == "true" ? "false" : "                                                                                                                   ";
// FileDatabase.getChartDefByChartId(chartId, chartDef => {
//     window.currDef = JSON.parse(chartDef.definition);
// })

/** 覆盖获取用户信息方法*/
// UserOperation.getUser(false, res => {
//     window.userObj = res;
//     window.authObj = res.auth;
//     window.mindConfig = JSON.parse(authObj.mindConfig);
//     window.mindCanvas = authObj.mindCanvas;
// });
// Server.getUserInfo = function () {
//     UserOperation.getUser(false, res => {
//         window.userObj = res;
//         window.authObj = res.auth;
//         window.mindConfig = JSON.parse(authObj.mindConfig);
//         window.mindCanvas = authObj.mindCanvas;
//         window.leftButton = authObj.leftButton || "move";

//         if(window.configCollaSave) {
//             configCollaSave.init(deviceType, fileType);
//         }
//         window.rightTollabarList = localStorage.getItem("rightTollabarList") || rightTollabarList;
//         mindUI.initRightOpStatus();
//     });
// }
/** 覆盖获取用户信息方法*/
/** 覆盖用户获取用户信息接口，用于本地化处理*/
$(document).ready(function () {
    //隐藏编辑器哪预览,更多
    $('#header-file-menu .po-menu-item[ac=clone]').nextAll().hide()
    // $('body').delegate('.link-to-outline', "mouseenter", function () {
    //     $('.outline-thumbnail img').attr('src', '../../../source/static/images/outline-thumbnail.png')
    // })
    //隐藏协作人数6
    // $('.po-clb-user-photo-list').hide()
})

/** 覆盖用户获取用户信息接口，用于本地化处理*/
let errTip = function () {
    if (pcUtil.isOnline()) $("#savetip").html("保存失败，已切换到离线模式");
    else $("#savetip").html("网络中断，已保存至本地，将在下次联网时与云端同步");
}

/**
 * -start- 添加 ajax 附加逻辑
 * */
let online = () => { };

/** -start- 添加 监听网络状态 附加逻辑 */
online = function () {
    FileDatabase.getChartById(chartId, chart => {
        chartId = chart.id;
        sendMessage.chartId = chart.id;
        console.log('@@@@@@@@@@', chart)
        if (chartId.length > 12) {
            // let toast = new Toast("synchronization", $("body"));
            // $("#savetip").html("正在同步...");
            sendMessage.saveOnline()
            // mindColla.doSync(chartId, function(){}, toast);
        }
    })
    $('.po-loading').remove();
};
window.addEventListener('online', online);
window.addEventListener('offline', function () {
    $("#savetip").text("网络中断，已保存至本地，将在下次联网时与云端同步");
});

document.ready = function () {
    mindColla.showTip = function () {
        if (mindColla.collaUsers.length > 1) {
            this.renderOff();
        } else {
            if (pcUtil.isOnline() && chartId && chartId.length > 12) $("#savetip").html("所有更改已保存");
            else errTip()
        }
    };
}
/** -end- 添加 监听网络状态 附加逻辑 */

/** -start- 添加 全部变量 附加逻辑 */
// UserOperation.getUser(false, user => {
//     window.userName = user.fullName;
//     window.fullName = user.userName;
//     window.userId = user.userId;
// });
// FileDatabase.getChartById(pcUtil.getUrlParams("chartId"), chart => {
//     // $("input.title").val(mindUI.restoreXss(chart.title));
//     // $("title").text(mindUI.restoreXss(chart.title));
//     // chartTitle = mindUI.restoreXss(chart.title);
//     window.chartId = chart.chartId
//     window.chart = chart;

//     if(chart.favourite) {
//         $(".header-fav").addClass("active");
//         $(".header-fav .po-diagraming-icons").html("&#xe71e;");
//         $(".header-fav").attr("original-title", "取消收藏");
//     }
//     else {
//         $(".header-fav").removeClass("active");
//         $(".header-fav .po-diagraming-icons").html("&#xe6b2;");
//         $(".header-fav").attr("original-title", "收藏");
//     }
// });

// let getOnlineChartId = setInterval(() => {
//     if (!window.chart) return;
//     if(window.chart.id.length > 10) {
//         clearInterval(getOnlineChartId);
//         return;
//     };

//     FileDatabase.getChartById(chartId, chart => {
//         window.chart = chart;
//         window.chartId = chart.chartId
//     });
// }, 2000);
// FileDatabase.updateChart(chartId, "lastModify");
window.i18nJS = { get: (s) => s };
/** -end- 添加 全部变量 附加逻辑 */

