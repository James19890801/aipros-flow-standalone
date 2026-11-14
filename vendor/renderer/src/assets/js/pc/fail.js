import DBUtil from "./db/db.js";
import UserOperation from "./db/user.js";

var fail = {
    init: function() {
        let url = pcUtil.getUrlParams("url");
        $('.main').off().on("click", function() {
            ipc.sendToHost("selectTab", 0, true);
        })
        $('.refer').off().on("click", function() {
            pcUtil.openWin({type: "httpUrl", url: url, isReplace: true});
        })
    }
};
fail.init();
