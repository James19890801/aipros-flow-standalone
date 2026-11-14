/**
 * -start- 自定义模块统一引入常量
 * */
import DBUtil from "./db/db.js";
import UserOperation from "./db/user.js";
import ServerUtil from "./server/server.js";
import { Toast } from "./class.js";
import { EaseOutElastic } from "./animation/animation.js";
/** -end- 自定义模块统一引入常量 */
// 根据运行环境设置顶部操作条
let setOptBox = function () {
    var agent = navigator.userAgent.toLowerCase();
    var isMac = /macintosh|mac os x/i.test(navigator.userAgent);

    if (agent.indexOf("win32") >= 0 || agent.indexOf("wow32") >= 0) {
        isMac = false;
    }
    if (agent.indexOf("win64") >= 0 || agent.indexOf("wow64") >= 0) {
        isMac = false;
    }

    if (isMac) $("html").attr("data-system", "mac");
    else $("html").attr("data-system", "win");
};
setOptBox();

/**
 * 登录对象
 */
var login = {
    signWay: 'phone',
    timer: null,
    bindBtn: 'false',
    clientId: null,
    //二维码登录前的登录方式
    loginway: 'pc',
    /**
     * 切换登录方式
     * @param way 要切换的登录方式 ['weixin' | 'phone' | 'pc' | 'auto' | 'signup']
     */
    cutLoginWay: function (way) {
        var $loginWayIcons = $('#loginway-icons');
        //tab pc
        var $headItemPc = $('.login-head-item[data-type="pc"]');
        //tab phone
        var $headItemPhone = $('.login-head-item[data-type="phone"]');
        //pc form
        var $loginform_pc = $('#loginform');
        //phone form
        var $loginform_phone = $('#loginform_phone');
        //processon icon
        var $iconOn = $('.icon-on-box[data-type="icon_on"]');
        //weixin icon
        var $iconWeixin = $('span[data-type="icon_weixin"]');
        //pc and phone login box
        var $loginPcPh = $('.login-box div[data-type="login_pc_phone"]');
        //QRcode login box
        var $loginCode = $('.login-box div[data-type="login_code"]');

        if (way === 'auto') {
            way = $loginWayIcons.attr('data-type');
            if (way === "weixin" && !$("input[name=terms_service]").is(":checked")) {
                new Toast({ type: "warning", msg: "请同意ProcessOn服务条款、隐私政策", toastCss: { "white-space": "nowrap" } });
                EaseOutElastic($(".terms_service"));
                $(".terms_service").addClass("easeOutElastic");
                setTimeout(() => $(".terms_service").removeClass("easeOutElastic"), 1000);
                return;
            };
            login.animation.cutLoginWay(way === 'weixin' ? login.loginway : 'weixin');
        }

        //切换到微信二维码登录
        if (way === 'weixin') {
            if (!$("input[name=terms_service]").is(":checked")) {
                new Toast({ type: "warning", msg: "请同意ProcessOn服务条款、隐私政策", toastCss: { "white-space": "nowrap" } });
                EaseOutElastic($(".terms_service"));
                $(".terms_service").addClass("easeOutElastic");
                setTimeout(() => $(".terms_service").removeClass("easeOutElastic"), 1000);
                return;
            }
            login.cutToWx();
            login.weixin.init();
            login.animation.cutLoginWay(login.loginway);
        }
        // 手机号
        else if (way === "phone") {
            login.cutToPhone();
            login.animation.cutLoginWay('weixin');
            login.loginway = 'phone';

            login.weixin.temer && clearInterval(login.weixin.temer);
        }
        //切换到账号密码登录
        else {
            login.cutToAccount();
            login.animation.cutLoginWay('weixin');
            login.loginway = 'pc';

            login.weixin.temer && clearInterval(login.weixin.temer);
        }
    },
    cutToAccount: function () {
        $("[tit=forget]").hide();
        $(".signup").show();
        $("[tit=wx]").attr("data-active", "0").hide();
        $("[tit=signin]").attr("data-active", "0").hide();
        $("[tit=signup]").attr("data-active", "1").show();
        $("[tit=signup]").find("input:first").focus();
        $(".signup").removeClass("first").addClass("last");
        $(".loginway-icon-box").show();
        $("#third_party").show();
        $(".terms_service").show();
        $("#wx-text").hide();
        $("#logo-text").show();
        $("#logo-img").show();
        $("#weixin_login").show();
        $("#processon_login").hide();
        $("#forget-text").hide();
        $("#third_party").css("margin-top", "98px");
        let val = $("#login_phone").val();
        if (val != "") {
            $("#login_email").val(val);
            $(".close-block .close-btn").show();
        } else {
            $(".close-block .close-btn").hide();
        }
        this.resetPhone(false)
    },
    cutToWx: function () {
        $("[tit=signup]").attr("data-active", "0").hide();
        $("[tit=signup]").find("input").val("");
        $("[tit=signin]").attr("data-active", "0").hide();
        $(".signup").hide();
        $("[tit=wx]").attr("data-active", "1").show();
        // $(".terms_service").hide();
        $("#processon_login").css({ "display": "inline-block" });
        $("#weixin_login").hide();
        $("#logo-text").hide();
        $("#logo-img").hide();
        $("#wx-text").show();
        $("#third_party").css("margin-top", "120px");
    },
    cutToForget: function () {
        $("[tit=wx]").attr("data-active", "0").hide();
        $("[tit=signup]").attr("data-active", "0").hide();
        $("[tit=signup]").find("input").val("");
        $("[tit=signin]").attr("data-active", "0").hide();
        $("[tit=forget]").show();
        $("[tit=forget]").find("input:first").focus();
        $(".signup").hide();
        $("#third_party").hide();
        // $(".terms_service").hide();
        $(".loginway-icon-box").hide();
        $("#wx-text").hide();
        // $("#logo-text").hide();
        // $("#logo-img").hide();
        $("#forget-text").show();
        $("#weixin_login").show();
        $("#processon_login").hide();

        $(".signup").removeClass("first").addClass("last");
    },
    cutToPhone: function () {
        $("[tit=forget]").hide();
        $(".signup").show();
        $("[tit=wx]").attr("data-active", "0").hide();
        $("[tit=signup]").attr("data-active", "0").hide();
        $("[tit=signup]").find("input").val("");
        $("[tit=signin]").attr("data-active", "1").show();
        $("[tit=signin]").find("input:first").focus();
        $(".signup").removeClass("last").addClass("first");
        $(".loginway-icon-box").show();
        $("#third_party").show();
        $(".terms_service").show();
        $("#wx-text").hide();
        $("#logo-text").show();
        $("#logo-img").show();
        $("#weixin_login").show();
        $("#processon_login").hide();
        $("#third_party").css("margin-top", "98px");
        let val = $("#login_email").val();
        if (val != "") {
            $("#login_phone").val(val);
        }
    },
    // 获取input下tip dom
    getNextTipDom: function (dom) {
        let $tip = dom.parent().find(".error-tip");

        if ($tip.length) return $tip;
        else return dom.parents(".close-block").parent().find(".error-tip");
    },
    //动画
    animation: {
        /**
         * 右上角登录方式icon切换动画
         * @param way 要切换的登录方式 ['weixin' | 'phone' | 'pc']
         */
        cutLoginWay: function (way) {
            var $wayIcons = $('#loginway-icons');
            var $wayIcon_0 = $('.loginway-icon').eq(0);
            var $wayIcon_1 = $('.loginway-icon').eq(1);
            var window_w = $(window).width();
            var suffix = '.png';
            var speed = 200;
            var css = { top: '-56px', left: '-56px' };

            if (window_w <= 760) {
                suffix = '.png';
            }

            if (way == 'weixin') {
                css = { top: '0px', left: '0px' };
            } else {
                let icon = "pc_hover";
                if (way == "pc") icon = "pc_hover";
                else if (way == "phone") icon = "phone_hover";

                $wayIcon_1.css({
                    background: 'url(./src/assets/images/login/' + icon + suffix + ') no-repeat',
                    backgroundSize: '100%'
                });
                if (way == "pc") {
                    $wayIcon_1.hover(function () {
                        $wayIcon_1.css({
                            background: 'url(./src/assets/images/login/' + icon + suffix + ') no-repeat',
                            backgroundSize: '100%'
                        });
                    }, function () {
                        $wayIcon_1.css({
                            background: 'url(./src/assets/images/login/pc_login.png) no-repeat',
                            backgroundSize: '100%'
                        });
                    })
                }
            }

            $wayIcons.attr('data-type', way).animate(css, speed);
        }
    },
    //全局初始化入口
    init: function () {
        pcUtil.setOnlie(true);
        window.localStorage.removeItem("processon_userKey");
        // 是否显示apple登录
        if ($("html").attr("data-system") != "mac") $("#apple_login").hide();
        else $("#apple_login").show();
        //
        $(".loginway-icon-box, #weixin_login").off("click").on("click", function () {
            login.isExpire().then((isExpire) => {
                if (!isExpire) {
                    login.cutLoginWay('auto');
                }
            })
        });
        //
        $("#processon_login").off("click").on("click", function () {
            login.isExpire().then((isExpire) => {
                if (!isExpire) {
                    login.cutLoginWay('auto')
                }
            })
        });
        //
        $(".terms_service input").on("change", function (e) {
            let isChecked = $(this).parents(".terms_service").find("input").is(":checked");
            $(".terms_service").find("[name=terms_service]").prop("checked", isChecked);
            if (isChecked) $(".terms_service me").text("我已阅读并同意ProcessOn");
            else $(".terms_service me").text("请同意ProcessOn");
        });
        $(".terms_service>span").off().on("click", function () {
            let isChecked = $(".terms_service input[name=terms_service]").is(":checked");
            $(".terms_service").find("[name=terms_service]").prop("checked", !isChecked);
            if (!isChecked) $(".terms_service me").text("我已阅读并同意ProcessOn");
            else $(".terms_service me").text("请同意ProcessOn");
        });
        // 服务条款
        $(".terms_service .serve").off().on("click", function () {
            shell.openExternal("https://www.processon.com/tos");
            return false;
        });
        // 隐私条款
        $(".terms_service .privacy").off().on("click", function () {
            shell.openExternal("https://processon.com/privacy-policy");
            return false;
        });
        // 窗口操作（最小化、最大化、关闭）
        $(".win_opts").off().on("click", function (e) {
            let id = $(e.target).attr("data-id");

            ipc.send("win_opts", id);
        });
        //切换到 账号密码
        $("#signin-with-account, .to_account").off('click').on('click', function () {
            login.cutToAccount();
            login.cutLoginWay("pc");
        });
        //切换到 手机验证
        $("#signin-with-phone").off('click').on('click', function () {
            login.cutToPhone();
            login.cutLoginWay("phone");
        });
        //切换到 忘记密码
        $("#signin-with-forget").off('click').on('click', () => {
            login.isExpire().then(async (isExpire) => {
                if (!isExpire) {
                    login.cutToForget()
                }
            })
        });
        //点击验证码
        document.getElementById("tencent_btn").addEventListener("click", function () {
            login.isExpire().then((isExpire) => {
                if (!isExpire) {
                    if ($(this).hasClass("notclick")) return;
                    var that = this;
                    var phoneDom = $("#login_phone"), phoneVal = $.trim(phoneDom.val());
                    var phoneValid = login.isValid(phoneDom, phoneVal, "phone");

                    if (!phoneValid) return;
                    var captcha = new TencentCaptcha('2039741519', function (res) {
                        if (res.ret === 0) {
                            var tk = res.ticket;
                            $("#signup_ticket").val(tk);
                            $("#randstr").val(res.randstr);

                            login.getValidCode(phoneVal, that);
                        }
                    });
                    captcha.show();
                }
            })
        });
        //点击验证码 - 重置密码
        document.getElementById("tencent_forget_btn").addEventListener("click", function () {
            if ($(this).hasClass("notclick")) return;
            var that = this;
            var phoneDom = $("#forget_email"), phoneVal = $.trim(phoneDom.val());
            var phoneValid = login.isValid(phoneDom, phoneVal, "phone");
            if (!phoneValid) return;

            var passwordDom = $("#forget_pass"), passVal = $.trim(passwordDom.val());
            var passValid = login.isValid(passwordDom, passVal, "password");
            if (!passValid) return;

            var captcha = new TencentCaptcha('2039741519', function (res) {
                if (res.ret === 0) {
                    var tk = res.ticket;
                    $("#signup_ticket").val(tk);
                    $("#randstr").val(res.randstr);

                    login.getValidCode(phoneVal, that, "retrieve");
                }
            });
            captcha.show();
        });
        //qq登录
        document.getElementById("qq_login").addEventListener("click", function () {
            login.isExpire().then(async (isExpire) => {
                if (!isExpire) {
                    if (!$("input[name=terms_service]").is(":checked")) {
                        new Toast({ type: "warning", msg: "请同意ProcessOn服务条款、隐私政策", toastCss: { "white-space": "nowrap" } });
                        EaseOutElastic($(".terms_service"));
                        $(".terms_service").addClass("easeOutElastic");
                        setTimeout(() => $(".terms_service").removeClass("easeOutElastic"), 1000);
                        return;
                    }
                    var url = "https://graph.qq.com/oauth2.0/authorize?client_id=" + qq_clientId + "&response_type=token&scope=all&redirect_uri=https://www.processon.com/qq.jsp";
                    // let windowUrl = BrowserWindow.getAllWindows();
                    let windowUrl = await ipc.invoke("getAllWindows")

                    let isNewWindow = windowUrl.some(i => {
                        if (i.url.indexOf('https://graph.qq.com') >= 0 || i.url.indexOf('appleLogin.html') >= 0) {
                            return true;
                        } else {
                            return false
                        }
                    })
                    if (isNewWindow) {
                        let toast = new Toast({ type: "error", msg: "登录窗口已打开" });
                    } else {
                        login.showWin(url);
                    }
                }
            })
        });

        document.getElementById("apple_login").addEventListener("click", async function () {
            login.isExpire().then(async (isExpire) => {
                if (isExpire) return
                if ($("input[name=terms_service]").length && !$("input[name=terms_service]").is(":checked")) {
                    new Toast({ type: "warning", msg: "请同意ProcessOn服务条款、隐私政策", toastCss: { "white-space": "nowrap" } });
                    EaseOutElastic($(".terms_service"));
                    $(".terms_service").addClass("easeOutElastic");
                    setTimeout(() => $(".terms_service").removeClass("easeOutElastic"), 1000);
                    return;
                }
                let windowUrl = await ipc.invoke("getAllWindows")
                let isNewWindow = windowUrl.some(i => {
                    if (i.url.indexOf('https://graph.qq.com') >= 0 || i.url.indexOf('appleLogin.html') >= 0) {
                        return true;
                    } else {
                        return false
                    }
                })
                if (isNewWindow) {
                    new Toast({ type: "error", msg: "登录窗口已打开" });
                } else {
                    ipc.send("createAppleWindow");
                }
            })
        });

        //获取用户标识，用于验证用户是否登录
        let uk = window.localStorage.getItem("processon_userKey");
        //点击登录
        $(".signin_btn").off().on("click", function () {
            login.isExpire().then((isExpire) => {
                if (!isExpire) {
                    login.login(function (res) {
                        if (res.data && res.data.token != null) {
                            //处理登录后的逻辑
                            if (res.data.token != null) {
                                var token = res.data["token"];

                                //装载数据库
                                window.localStorage.setItem("processon_token", token);
                                window.localStorage.setItem("processon_token_sig", res.data['_sid']);
                                // 发送全局token
                                ipc.send("token", token);
                                ipc.send("set_cookie", token);
                                UserOperation.getUser(false, user => {
                                    if (user) {
                                        window.localStorage.setItem("processon_userKey", user.id);
                                        window.localStorage.setItem("keyt", new Date().valueOf());
                                        window.localStorage.setItem("userView", user.auth.fileView || "icon");
                                        window.localStorage.setItem("authInfo", JSON.stringify(user.auth));

                                        // ipc.invoke('saveFileB64',
                                        //     { type: 'cache', data: '', path: 'crash/data.json' }).then(() => {
                                        //         resolve()
                                        //     })
                                        //通知主要进程，进行页面跳转
                                        ipc.send("loginSuccess");
                                    }
                                    else {
                                        login.showTip("请求发生错误，请稍候重试", $(".verify-tip"));
                                        let toast = new Toast({ type: "error", msg: "请求发生错误，请稍候重试" });
                                    }
                                }, true);
                                // UserOperation.saveUser({ userId: res.data.processon_userKey }, function(result){
                                //  if(result != null){
                                //      window.localStorage.setItem("processon_userKey", result.id);
                                //      window.localStorage.setItem("processon_token", token);
                                //      window.localStorage.setItem("processon_ws_token", res.data.user_token);
                                //      window.localStorage.setItem("keyt", new Date().valueOf());
                                //      window.localStorage.setItem("userView", result.fileView || "icon");
                                //      //通知主要进程，进行页面跳转
                                //      ipc.send("loginSuccess");
                                //  }else{
                                //      login.showTip("请求发生错误，请稍候重试", $(".verify-tip"));
                                //      let toast = new Toast({ type: "error", msg: "请求发生错误，请稍候重试" });
                                //  }
                                // })
                            }
                        }
                    });
                }
            })
        });
        //点击重置密码
        $(".forget_btn").off().on("click", login.forget);
        //input 键盘事件
        $('.page-con input').off("keydown").on('keydown', function (e) {
            if (e.keyCode == 13) {
                $(".signin_btn").click();
            }
        });
        //查看是否登录状态;
        let clearToken = () => {
            window.localStorage.removeItem("processon_token");
            window.localStorage.removeItem("processon_userKey");
            DBUtil.init(null);
        };
        if (uk != null && uk != "") {
            let toast = new Toast("login");
            UserOperation.getUser(uk, function (result) {
                toast.close();
                if (result != null && result.id == uk) {
                    let kt = window.localStorage.getItem("keyt");
                    if (kt == null) {
                        return;
                    }
                    let time = new Date().valueOf();
                    let calc = (time - kt) / 1000 / 3600 / 24;

                    //默认14天后过期(cookie)
                    if (calc > 14 || calc < 0) {
                        return;
                    }
                    //符合条件，直接登录
                    ipc.send("loginSuccess");
                }
                else clearToken();
            });
        }
        else clearToken();


        //输入框显示清除按钮
        $(".close-block input").off("input").on("input", function (e) {
            if ($.trim(e.target.value) != "") {
                $(this).parents(".close-block").find(".close-btn").show()
            } else {
                $(this).parents(".close-block").find(".close-btn").hide()
            }
        })
        //点击清除按钮情况账号
        $(".close-btn").off("click").on("click", function () {
            $(this).parents(".close-block").find("input").val("");
            $(this).parents(".close-block").find(".close-btn").hide()
        })

        $("#login_verify").off("input").on("input", function (e) {
            if ($.trim(e.target.value) != "") {
                $(".verify-close-btn").show()
            } else {
                $(".verify-close-btn").hide()
            }
        })
        $(".verify-close-btn").off("click").on("click", function () {
            $("#login_verify").val("");
            $(".verify-close-btn").hide()
        })
        $(".auto_login span").off("click").on("click", function () {
            $('input[name=auto_login]').click()
        })
        this.resetPhone()
        this.resetLogin()
    },
    //全局显示窗口
    showWin: function (url) {
        ipc.send("showWin", {
            width: 800,
            height: 600,
            title: "第三方登录",
            closable: true,
            webPreferences: {
                sandbox: true, //沙盒模式运行，否则二维码无法正常加载
                allowDisplayingInsecureContent: true,
                enableRemoteModule: true,
                allowRunningInsecureContent: true
            },
            frame: true,
            minWidth: 800,
            minHeight: 600,
            titleBarStyle: 'default'
        }, url, "url");
    },
    //提醒
    showTip: function (text, dom) {
        dom = dom[0] || dom;
        dom.innerHTML = text;
    },
    //手机正则
    isPhone: function (str) {
        if (!(/^1[0-9]{10}$/.test(str))) {
            return false;
        } else {
            return true;
        }
    },
    //校验dom
    isValid: function (dom, val, type) {
        if (type == "phone") {
            var tip = login.getNextTipDom(dom);
            if (val == "") {
                login.showTip("请输入手机号", tip);
                dom.focus();
                return false;
            }
            else if (!login.isPhone(val)) {
                login.showTip("手机号码格式错误", tip);
                dom.select();
                return false;
            }
            else {
                tip.html("");
            }
        }
        else if (type == "email") {
            var tip = login.getNextTipDom(dom);
            if (val == "") {
                login.showTip("请输入邮箱或手机号", tip);
                dom.focus();
                return false;
            }
            else {
                tip.html("");
            }
        }
        else if (type == "verify") {
            var tip = login.getNextTipDom(dom);
            if (val == "") {
                login.showTip("请输入验证码", tip);
                dom.focus();
                return false;
            }
            else if (isNaN(val)) {
                login.showTip("验证码不正确", tip);
                dom.focus();
                return false;
            }
            else {
                tip.html("");
            }
        }
        else if (type == "password") {
            var tip = login.getNextTipDom(dom);
            if (val == "") {
                login.showTip("请输入密码", tip);
                dom.focus();
                return false;
            }
            else {
                tip.html("");
            }
        }

        return true;
    },
    isLogining: false,
    //点击登录
    login: function (callback) {
        let isPassLogin = false;
        if (login.isLogining) return;
        login.isLogining = true;
        var tit = $("[tit][data-active=1]").attr("tit");
        var phoneDom = $("#login_phone"), phoneVal = $.trim(phoneDom.val());
        var verifyDom = $("#login_verify"), verifyVal = $.trim(verifyDom.val());
        var emailDom = $("#login_email"), emailVal = $.trim(emailDom.val());
        var passwordDom = $("#login_pass"), passVal = $.trim(passwordDom.val());

        var phoneValid = false;
        var verifyValid = false;
        var passValid = false;
        var emailValid = false;

        if (!navigator.onLine) {
            new Toast("connectionless");
            login.isLogining = false;
            return;
        }
        if (tit == "signin") {
            phoneValid = login.isValid(phoneDom, phoneVal, "phone");
            if (!phoneValid) {
                login.isLogining = false;
                return;
            }

            verifyValid = login.isValid(verifyDom, verifyVal, "verify");
            if (!verifyValid) {
                login.isLogining = false;
                return;
            }
        }
        else {
            emailValid = login.isValid(emailDom, emailVal, "email");
            if (!emailValid) {
                login.isLogining = false;
                return;
            }

            passValid = login.isValid(passwordDom, passVal, "password");
            if (!passValid) {
                login.isLogining = false;
                return;
            }
        }

        if (!$("input[name=terms_service]").is(":checked")) {
            new Toast({ type: "warning", msg: "请同意ProcessOn服务条款、隐私政策", toastCss: { "white-space": "nowrap" } });
            EaseOutElastic($(".terms_service"));
            $(".terms_service").addClass("easeOutElastic");
            setTimeout(() => $(".terms_service").removeClass("easeOutElastic"), 1000);
            login.isLogining = false;
            return;
        }
        if ($("input[name=auto_login]").is(":checked") && $(".signup").hasClass("last")) {
            localStorage.setItem('isAutoLogin', 1)
        }
        else if (!$("input[name=auto_login]").is(":checked") && $(".signup").hasClass("last")) {
            localStorage.setItem('isAutoLogin', 0)
        }

        let login_success = function (res) {
            login.isLogining = false;

            if (res && res.code == 200) {
                api.ipcRenderer.send('saveUser', { user: emailVal, password: passVal })
                localStorage.setItem('processon_userPhone', emailVal)
                if (callback != null) callback(res);
            }
            // 验证码相关
            else if ([612, 609].indexOf(res.code) >= 0) {
                var tip = login.getNextTipDom(verifyDom);
                login.showTip(res.msg, tip);
                verifyDom.select();
            }
            // 账号相关
            else if ([605, 606, 608, 611, 618, 621, 622, 623, 624, 625, 650, 901].indexOf(res.code) >= 0) {
                if ($(".signup").hasClass("last")) {
                    var tip = login.getNextTipDom(emailDom);
                    login.showTip(res.msg, tip);
                    emailDom.select();
                }
                else {
                    var tip = login.getNextTipDom(phoneDom);
                    login.showTip(res.msg, tip);
                    phoneDom.select();
                }
            }
            // 密码相关
            else if ([604, 607, 610, 616, 408].indexOf(res.code) >= 0) {
                var tip = login.getNextTipDom(passwordDom);
                login.showTip(res.msg, tip);
                passwordDom.select();
            }
            // 邮箱相关
            else if ([613, 614, 615, 617].indexOf(res.code) >= 0) {
                var tip = login.getNextTipDom(emailDom);
                login.showTip(res.msg, tip);
                emailDom.select();
            }
            else {
                var tip = login.getNextTipDom(verifyDom);
                login.showTip(res.msg, tip);
            }
        };
        let login_error = function (res) {
            new Toast({ msg: "请求过程中发生异常，请稍后再试", type: "error" });
            login.isLogining = false;
        }

        // 账号密码登录
        if ($(".signup").hasClass("last")) isPassLogin = true, ServerUtil.login(emailVal, hex_md5(passVal), login_success, login_error);
        // 验证码登录
        else ServerUtil.quickLogin(phoneVal, verifyVal, login_success, login_error);
    },
    //点击重置密码
    forget: function (callback) {
        if (login.isLogining) return;
        login.isLogining = true;
        var emailDom = $("#forget_email"), emailVal = $.trim(emailDom.val());
        var verifyDom = $("#forget_verify"), verifyVal = $.trim(verifyDom.val());
        // var emailDom = $("#login_email"), emailVal = $.trim(emailDom.val());
        var passwordDom = $("#forget_pass"), passVal = $.trim(passwordDom.val());

        var verifyValid = false;
        var passValid = false;
        var emailValid = false;

        emailValid = login.isValid(emailDom, emailVal, "email");
        if (!emailValid) {
            login.isLogining = false;
            return;
        }

        passValid = login.isValid(passwordDom, passVal, "password");
        if (!passValid) {
            login.isLogining = false;
            return;
        }

        verifyValid = login.isValid(verifyDom, verifyVal, "verify");
        if (!verifyValid) {
            login.isLogining = false;
            return;
        }

        let toast = new Toast({ autoClose: false, shadow: true, msg: "正在重置密码..." });
        let login_success = function (res) {
            login.isLogining = false;
            toast.close();

            if (res && res.code == 200) {
                new Toast({ type: "success", msg: "密码重置成功" });
                login.cutToAccount();
            }
            // 验证码相关
            else if ([612, 609].indexOf(res.code) >= 0) {
                var tip = login.getNextTipDom(verifyDom);
                login.showTip(res.msg, tip);
                verifyDom.select();
            }
            // 账号相关
            else if ([605, 606, 608, 611, 618, 621, 622, 623, 624, 625, 650].indexOf(res.code) >= 0) {
                var tip = login.getNextTipDom(phoneDom);
                login.showTip(res.msg, tip);
                phoneDom.select();
            }
            // 密码相关
            else if ([604, 607, 610, 616].indexOf(res.code) >= 0) {
                var tip = login.getNextTipDom(passwordDom);
                login.showTip(res.msg, tip);
                passwordDom.select();
            }
            // 邮箱相关
            else if ([613, 614, 615, 617].indexOf(res.code) >= 0) {
                var tip = login.getNextTipDom(emailDom);
                login.showTip(res.msg, tip);
                emailDom.select();
            }
            else {
                var tip = login.getNextTipDom(verifyDom);
                login.showTip(res.msg, tip);
            }
        };
        let login_error = function (res) {
            toast.close();
            var tip = login.getNextTipDom(verifyDom);
            login.showTip("请求过程中发生异常，请稍后再试", tip);
            login.isLogining = false;
        }

        ServerUtil.retrievePwd(emailVal, hex_md5(passVal), verifyVal, login_success, login_error);
    },
    isOnline: function () {
        return pcUtil.isOnline()
    },
    weixin: {
        loaded: false,
        temer: false,
        init: function () {
            login.weixin.hide();

            let wxhost = ipc.sendSync('getGlobal', "wxhost");

            if (!login.weixin.loaded) {
                login.weixin.loaded = true;

                ServerUtil.getWechatQrcode(function (data) {
                    $("#weixin_dlg").removeClass("refresh");

                    if (data.code == 200) {
                        setTimeout(function () {
                            $('#weixin_dlg').html($('<div style="width: 200px; display: inline-block;" data-sceneid=' + data.data.scene_id + '>' +
                                '<img class="wechatImg" src="' + data.data.url + '" />' +
                                '</div>'));
                        }, 100)
                    } else {
                        login.weixin.loaded = false;
                        $('#weixin_dlg').find('div').text('获取二维码失败');
                    }
                }, function () {
                    login.weixin.loaded = false;
                    $('#weixin_dlg').find('div').text('获取二维码失败');
                });
                // $.ajax({
                //  url: `${wxhost}/wechat/public/get_qrcode`,
                //  type: 'GET',
                //  success: function(data) {
                //      if(data.result === 'success') {
                //          setTimeout(function() {
                //              $('#weixin_dlg').html($('<div style="width: 200px; display: inline-block;" data-sceneid=' + data.data.sceneId + '>' +
                //                  '<img class="wechatImg" src="' + data.data.QRcodeUrl + '" />' +
                //                  '</div>'));
                //          },100)
                //      } else {
                //          login.weixin.loaded = false;
                //          $('#weixin_dlg').find('div').text('获取二维码失败');
                //      }
                //  }
                // })
            }

            let n = 30;
            login.weixin.temer = setInterval(function () {
                if (n >= 0) {
                    n--;
                    get();
                }
                else {
                    login.weixin.timeout();
                    login.weixin.temer && clearInterval(login.weixin.temer);
                }
            }, 2000)
            function get() {
                var sceneId = $('#weixin_dlg').find('div[data-sceneid]').data('sceneid');

                ServerUtil.checkWechatScanPc(sceneId, function (res) {
                    if (res.code != 0) login.weixin.temer && clearInterval(login.weixin.temer);

                    // 登录用户还未扫码或扫码未进行关注操作
                    if (res.code == 0) { }
                    // 微信登录异常
                    else if (res.code == 651) new Toast({ type: "error", msg: "微信登录异常，请联系管理员" });
                    // 二维码已失效
                    else if (res.code == 640) {
                        login.weixin.timeout();
                        login.weixin.temer && clearInterval(login.weixin.temer);
            }
                    // 登录成功
                    else if (res.code == 200) {
                        const token = res.data.token;
                        window.localStorage.setItem("processon_token", token);
                        ipc.send("token", token);
                        ipc.send("set_cookie", token);
                        setTimeout(() => {
                            ServerUtil.userInfo(res => {
                                if (res.code == 200) {
                                    let { auth, user } = res.data;

                                    window.localStorage.setItem("processon_userKey", user.userId);
                                    window.localStorage.setItem("keyt", new Date().valueOf());
                                    window.localStorage.setItem("userView", auth.fileView || "icon");
                                    window.localStorage.setItem("authInfo", JSON.stringify(auth));
                                    //通知主要进程，进行页面跳转
                                    ipc.send("loginSuccess");
            }
                                else new Toast({ type: "error", msg: `登录失败, 获取用户信息失败` });
                            });
                        }, 1000)

                    }
                    else new Toast({ type: "error", msg: `登录失败, 错误码 ${res.code}` });
                }, function () {
                    new Toast({ type: "error", msg: "登录失败" });
            });

                // $.ajax({
                //  url: `${wxhost}/wechat/public/check_wechat_scan_pc`,
                //  type: 'GET',
                //  cache: false,
                //  data: {sceneId: sceneId},
                //  success: function(res) {
                //      if(res && res.result == "success") {
                //          // 登录用户还未扫码或扫码未进行关注操作
                //          if(res.data == 0) {}
                //          // 没有用户信息或用户未绑定微信
                //          else if(res.data == 1) new Toast({type: "error", msg: "用户未绑定微信"});
                //          // 用户已存在
                //          else if(res.data == 2) new Toast({type: "error", msg: "用户已存在"});
                //          // 用户绑定微信成功
                //          else if(res.data == 3) new Toast({type: "success", msg: "微信绑定成功"});
                //          // 用户验证微信成功
                //          else if(res.data == 4) new Toast({type: "error", msg: "微信验证成功"});
                //          // 微信注册成功
                //          else if(res.data == 5) new Toast({type: "success", msg: "微信注册成功"});
                //          // 登录成功
                //          else if(typeof res.data == "object" && res.data.id && res.data.id != "" && res.data.token && res.data.token != "") {
                //              login.weixin.temer && clearInterval(login.weixin.temer);
                //
                //              window.localStorage.setItem("processon_userKey", res.data.id);
                //              window.localStorage.setItem("processon_token", res.data.token);
                //              window.localStorage.setItem("keyt", new Date().valueOf());
                //              window.localStorage.setItem("userView", res.data.fileView || "icon");
                //              //通知主要进程，进行页面跳转
                //              ipc.send("loginSuccess");
                //          }
                //          else new Toast({type: "error", msg: "登录失败"});
                //      }
                //      else if(res && res.result == "error") {
                //          let msg = "登录失败";
                //          let code = { 401: "参数错误", 640: "二维码失效", 643: "获取微信信息失败", 644: "扫码结果异常" };
                //
                //          if(code[res.errorcode]) msg = code[res.errorcode];
                //          new Toast({type: "error", msg});
                //      }
                //      else new Toast({type: "error", msg: "登录失败"});
                //  }
                // })
            }
        },
        // 二维失效
        timeout: function () {
            $("#weixin_dlg").addClass("refresh");
            $("#weixin_dlg.refresh").off().on("click", function () {
                login.weixin.init();
                $("#weixin_dlg.refresh").removeClass("refresh");
            });
        },
        hide: function () {
            login.weixin.loaded = false;
            $('#weixin_dlg').find('div').html('<div style="line-height: 200px;">加载中...</div>');
        }
    },
    //获取手机验证码
    getValidCode: function (val, _dom, type = "quick_login") {
        var dom = $(_dom);
        var tk = $("#signup_ticket").val();
        var randstr = $("#randstr").val();

        ServerUtil.getValidCode(type, val, tk, randstr, function (res) {
            if (res) {
                if (res.code == 200) {
                    var span = dom.children("span");
                    let num = 61;
                    dom.addClass('notclick').css('color', '#ccc');
                    span.text(num - 1 + '秒后重新获取');
                    login.temer = setInterval(function () {
                        num--;
                        span.text(num + '秒后重新获取');
                        if (num <= 0) {
                            span.text('发送验证码');
                            dom.removeClass('notclick').css('color', '#4386f5');
                            clearInterval(login.temer);
                        }
                    }, 1000);
                    if (res.data != null && res.data.signup) {
                        $("#signup-tip").text("当前手机号首次登录，将自动为您注册成新用户").css("margin-bottom", "10px");
                        $("#login_verify").focus();
                    }
                }
                else {
                    var tip = dom.prev();
                    dom.parent().find("input").focus();
                    login.showTip(res.msg, tip);
                }
            }
        }, function (err) {
            var tip = dom.prev();
            dom.parent().find("input").focus();
            login.showTip("请求过程中发生异常，请稍后再试", tip);
        });
    },
    newId: function (n) {
        n = n || 10;
        var chars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"];
        var res = "";
        for (var i = 0; i < n; i++) {
            var id = Math.ceil(Math.random() * 62);
            res += chars[id] || "";
        }
        return res;
    },
    third_party_login_apple: function (token) {
        let toast = new Toast("login");
        login.isLogining = true;

        ServerUtil.appleLogin(token, function (res) {
            if (res.data && res.data.token != null) {
                const token = res.data.token;
                window.localStorage.setItem("processon_token", token);
                ipc.send("token", token);
                ipc.send("set_cookie", token);
                setTimeout(() => {
                    ServerUtil.userInfo(res => {
                        if (res.code == 200) {
                            let { auth, user } = res.data;
                            window.localStorage.setItem("processon_userKey", user.userId);
                            window.localStorage.setItem("keyt", new Date().valueOf());
                            window.localStorage.setItem("userView", auth.fileView || "icon");
                            window.localStorage.setItem("authInfo", JSON.stringify(user.auth));
                            ipc.send("loginSuccess");
                        }
                        else new Toast({ type: "error", msg: `登录失败, 获取用户信息失败` });
                    });
                }, 1000)
            } else {
                new Toast({ type: "error", msg: (res && res.msg) || "苹果登录失败" });
            }
            toast.close();
            login.isLogining = false;
        }, function () {
            toast.close();
            new Toast({ msg: "请求过程中发生异常，请稍后再试", type: "error" });
            login.isLogining = false;
        })
    },
    third_party_login_qq: function (token) {
        let toast = new Toast("login");
        login.isLogining = true;

        ServerUtil.qqLogin(token, function (res) {
            if (res.data && res.data.token != null) {
                const token = res.data.token;
                window.localStorage.setItem("processon_token", token);
                ipc.send("token", token);
                ipc.send("set_cookie", token);
                setTimeout(() => {
                    ServerUtil.userInfo(res => {
                        if (res.code == 200) {
                            let { auth, user } = res.data;

                            window.localStorage.setItem("processon_userKey", user.userId);
                            window.localStorage.setItem("keyt", new Date().valueOf());
                            window.localStorage.setItem("userView", auth.fileView || "icon");
                            window.localStorage.setItem("authInfo", JSON.stringify(user.auth));
                            //通知主要进程，进行页面跳转
                            ipc.send("loginSuccess");
                        }
                        else new Toast({ type: "error", msg: `登录失败, 获取用户信息失败` });
                    });
                }, 1000)
            }
            toast.close();
            login.isLogining = false;
        }, function () {
            toast.close();
            new Toast({ msg: "请求过程中发生异常，请稍后再试", type: "error" });
            login.isLogining = false;
        });
    },
    isExpire: function () {
        return new Promise((reslove) => {
            api.ipcRenderer.invoke('getAuth').then((obj) => {
                if (obj.code != 200) {
                    new Toast({ type: "warning", msg: "产品已过期" });
                    reslove(true)
                }
                else if (obj.data.REMAINAUTHDAYS <= 0) {
                    new Toast({ type: "warning", msg: "产品已过期" });
                    reslove(true)
                }
                else {
                    reslove(false)
                }
            })
        })
    },
    resetLogin() {
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
                                        this.clearToken();
                                        return;
                                    }
                                }, true);
                            }
                            else {
                                this.clearToken();
                                return;
                            }
                        }
                        else {
                            this.clearToken();
                            return;
                        }
                    }, () => {
                        this.clearToken();
                        return;
                    })
                }
                else {
                    this.clearToken();
                    return;
                }
            })
        }
        else {
            this.clearToken(false);
        }
    },
    clearToken:function(flag = true){
      window.localStorage.removeItem("processon_token");
      window.localStorage.removeItem("processon_ws_token");
      window.localStorage.removeItem("processon_userKey");
      flag && api.ipcRenderer.send('deleteUser', window.localStorage.getItem("processon_userPhone"))
      flag && window.localStorage.removeItem("processon_userPhone")
    },
    resetPhone(flag = true){
        const isAutoLogin = localStorage.getItem('isAutoLogin')
        if (isAutoLogin == null || isAutoLogin == '1') {
            $('input[name=auto_login]').prop('checked', true)
        }
        const phone = window.localStorage.getItem("processon_userPhone");
        if (phone && phone != '') {
            api.ipcRenderer.invoke('getUser', phone).then((resPhone) => {
                if (Object.hasOwn(resPhone, 'user')) {
                    $("#login_email").val(resPhone.user)
                    $("#login_pass").val(resPhone.password)
                    flag && login.cutLoginWay('pc')
                }
            })

        }
    }
};

login.init();

// 第三方登录成功
ipc.on('login', (e, msg) => {
    if (msg.type == "qq") login.third_party_login_qq(msg.access_token);
    else if (msg.type == "apple") login.third_party_login_apple(msg.code);
});

// 双击打开文件
ipc.on('associated', (e, msg) => {
    ipc.send('htmlNoComplete', msg)
});



ipc.on('closeAll', () => {
    ipc.send('closeAllow')
})


