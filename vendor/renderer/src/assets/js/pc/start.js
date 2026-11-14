import DBUtil from "./db/db.js";
import UserOperation from "./db/user.js";
import ServerUtil from "./server/server.js";

var start = {
  clearToken:function(flag = true){
    window.localStorage.removeItem("processon_token");
    window.localStorage.removeItem("processon_ws_token");
    window.localStorage.removeItem("processon_userKey");
    flag && api.ipcRenderer.send('deleteUser', window.localStorage.getItem("processon_userPhone"))
    flag && window.localStorage.removeItem("processon_userPhone")
    api.ipcRenderer.send("logout");
  },
  init: function () {
    const isOnline = navigator.onLine
    let startTime = (new Date()).getTime();

    let uk = window.localStorage.getItem("processon_userKey");
    api.ipcRenderer.invoke('getAuth').then((obj) => {
      if (obj.code != 200) {
        start.clearToken(false)
      }
      else if (obj.data.REMAINAUTHDAYS <= 0) {
        start.clearToken(false)
      }
      else {
        DBUtil.init(null, () => {
          // 没token 没网 不让登录需要联网登录过一次
          if (!isOnline && !uk) {
            start.clearToken(false)
            return
          }
          if (uk && isOnline) {
            UserOperation.getUser(uk, function (result) {
              if (result != null && result.id && result.id == uk) {
                api.ipcRenderer.send("token", window.localStorage.getItem("processon_token"));
                let kt = window.localStorage.getItem("keyt") || 0;
                let time = new Date().valueOf();
                let calc = (time - kt) / 1000 / 3600 / 24;
                //默认14天后过期(cookie)
                if (calc > 14 || calc < 0) {
                  //是否用户名和密码登录
                  start.login()
                }
                else {
                  //符合条件，直接登录
                  let endTime = (new Date()).getTime();
                  setTimeout(() => ipc.send("loginSuccess"), 3000 - (endTime - startTime));
                }
              }
              else start.clearToken(false);
            });
          }
          // 有token 没网 可以登陆
          else if(!uk && isOnline){
            start.login()
          }
          else if (uk && !isOnline) {
            let kt = window.localStorage.getItem("keyt") || 0;
            let time = new Date().valueOf();
            let calc = (time - kt) / 1000 / 3600 / 24;
            //默认14天后过期(cookie)
            if (calc > 14 || calc < 0) {
              start.clearToken(false);
              return;
            }
            api.ipcRenderer.send("loginSuccess")
            api.ipcRenderer.send("token", window.localStorage.getItem("processon_token"));
          }

        });

      }
    })
  },
  login(){
    const phone = window.localStorage.getItem("processon_userPhone");
    const isAutoLogin = localStorage.getItem('isAutoLogin')
    if (phone && phone != '' && (isAutoLogin == null || isAutoLogin == '1')) {
      // 获取数据
      api.ipcRenderer.invoke('getUser', phone).then((resPhone) => {
        if (Object.hasOwn(resPhone, 'user')) {
          // 模拟登录
          ServerUtil.login(resPhone.user, hex_md5(resPhone.password), (res) => {
            if (res.data && res.data.token != null) {
              //处理登录后的逻辑
              if (res.data.token != null) {
                var token = res.data["token"];

                //装载数据库
                window.localStorage.setItem("processon_token", token);
                // 发送全局token
                api.ipcRenderer.send("token", token);
                api.ipcRenderer.send("set_cookie", token);
                UserOperation.getUser(false, user => {
                  if (user) {
                    window.localStorage.setItem("processon_userKey", user.id);
                    window.localStorage.setItem("keyt", new Date().valueOf());
                    window.localStorage.setItem("userView", user.auth.fileView || "icon");
                    window.localStorage.setItem("authInfo", JSON.stringify(user.auth));
                    //通知主要进程，进行页面跳转
                    api.ipcRenderer.send("loginSuccess");
                  }
                  else {
                    start.clearToken();
                    return;
                  }
                }, true);
              }
              else {
                start.clearToken();
                return;
              }
            }
            else {
              start.clearToken();
              return;
            }
          }, () => {
            start.clearToken();
            return;
          })
        }
        else {
          start.clearToken();
          return;
        }
      })
    }
    else {
      start.clearToken(false);
    }
  }
};

start.init();
