import {Util} from '@common/util.js'
var phoneBind = {
    verityCodeClick: false,
    cb: function(){

    },
    init: function (cb) {
        this.cb = cb;
        this.addUI();
    },
    addInputFocus: function () {
       // $(".phone_bind_poupe").show();
       $("#phone_bind_content").dialog();
        phoneBind.tencent_btn_verify_click(0);
        $("#bind_phone").focus(function () {
            $(".error-tip-amount").text('');
            phoneBind.bindPhoneCorrectOrError(1);
        });
        $("#bind_phone").blur(function () {
            $("#bind_phone").removeClass('inputSelect');
        });
        $("#bind_phone").on('input', function () {
            if (phoneBind.isPhone($("#bind_phone").val())) {
                phoneBind.tencent_btn_verify_click(1);
            } else {
                phoneBind.tencent_btn_verify_click(0);
            }
        });
        $("#bind_code").focus(function () {
            if (!phoneBind.isPhone($("#bind_phone").val())) {
                $(".error-tip-amount").text('请输入正确的手机号');
                phoneBind.bindPhoneCorrectOrError(0);
            } else {
                phoneBind.tencent_btn_verify_click(1);
            }
            phoneBind.bindCodeCorrectOrError(1);
        });
        $("#bind_code").blur(function () {
            $("#bind_code").removeClass('inputSelect');
        });
        $(".tencent_btn_verify").off().on("click", function () {
            if ( typeof TencentCaptcha !== "function"){
                bigPipe.render({js:["https://turing.captcha.qcloud.com/TCaptcha.js"]}, function () {
                    phoneBind.tencentVerify();
                })
            }else{
                phoneBind.tencentVerify();
            }

        });
        $(".phone_bind_close").off("click").on("click", function () {
            $(".phone_bind_poupe").hide();
        });
        $(".pb_cancel_butt").off("click").on("click", function () {
            //$(".phone_bind_poupe").hide();
            //Util.phoneBindWindow("close");
            $("#phone_bind_content").dialog("close");
        });
        $(".pb_confirm_butt").off().on("click", function () {
            phoneBind.bindPhone();
        })
    },
    tencentVerify: function () {
        if (!phoneBind.isPhone($("#bind_phone").val())) {
            $(".error-tip-amount").text('请输入正确的手机号');
            phoneBind.bindPhoneCorrectOrError(0);
            return;
        }
        if (!phoneBind.verityCodeClick) {
            return;
        }
        var that = $(".tencent_btn_verify");
        num = 60;
        //腾讯安全校验
        var captcha = new TencentCaptcha('2039741519', function (res) {
            //console.log('res', res)
            if (res.ret === 0) {
                var tk = res.ticket;
                $("#signup_ticket").val(tk);
                $("#randstr").val(res.randstr);
                phoneBind.verify();
                that.addClass('notclick').css('color', '#ccc', 'font-size', '14px').text(num - 1 + '秒后重新获取');
                var temer = setInterval(function () {
                    num--;
                    phoneBind.verityCodeClick = false;
                    that.text(num + '秒后重新获取');
                    if (num <= 0) {
                        that.text('获取验证码');
                        phoneBind.verityCodeClick = true;
                        that.removeClass('notclick').css('color', '#4386f5');
                        clearInterval(temer);
                    }
                }, 1000)
            }
        });
        captcha.show(); // 显示验证码
    },
    isPhone: function (phoneStr) {
        return /^[1][3,4,5,6,7,8,9][0-9]{9}$/.test(phoneStr);
    },
    isCode: function (str) {
        if (!(/^\d{6}$/.test(str))) {
            return false;
        } else {
            return true;
        }
    },
    bindPhoneCorrectOrError: function (correct) {
        if (correct == 0) {
            $("#bind_phone").removeClass("inputSelect");
            $("#bind_phone").addClass('inputSelect_error');
        } else if (correct == 1) {
            $("#bind_phone").removeClass("inputSelect_error");
            $("#bind_phone").addClass('inputSelect');
        }
    },
    bindCodeCorrectOrError: function (correct) {
        if (correct == 0) {
            $("#bind_code").removeClass("inputSelect");
            $("#bind_code").addClass('inputSelect_error');
        } else if (correct == 1) {
            $("#bind_code").removeClass("inputSelect_error");
            $("#bind_code").addClass('inputSelect');
        }
    },
    tencent_btn_verify_click: function (canClick) {
        if (canClick == 0) {
            $(".tencent_btn_verify").css("opacity", "0.4");
            $(".tencent_btn_verify").css("pointer-events", "none");
            phoneBind.verityCodeClick = false;
        } else if (canClick == 1) {
            $(".tencent_btn_verify").css("opacity", "1");
            $(".tencent_btn_verify").css("pointer-events", "auto");
            phoneBind.verityCodeClick = true;
        }
    },
    verify: function () {
        var phone = $("#bind_phone"),
            phoneVal = $.trim(phone.val()),
            signup_ticket = $('#signup_ticket').val().trim(),
            randstr = $('#randstr').val().trim();
        Util.ajax({
            url: "/api/personal/user/v3/send/phone/code",
            data: JSON.stringify({ phone: phoneVal, type: "bind", signupTicket: signup_ticket, randstr: randstr }),
            contentType: "application/json",
            success: function (e) {
                // if (e.code == "200") {
                    $.toast({text: "验证码已发送到您手机", type: "success",target: $("#phone_bind_content")});
                // }
            },
            error: function (e) {
                //$(".error-tip-code").text(e.msg);
                $.toast({text:e.msg, type: "error",target: $("#phone_bind_content")});
            }
        })

    },
    bindPhone: function () {
        var that = this;
        var phone = $("#bind_phone"),
            phoneVal = $.trim(phone.val()),
            loginCode = $("#bind_code"),
            loginCodeVal = $.trim(loginCode.val());
        if (!phoneBind.isPhone(phoneVal)) {
            $(".error-tip-amount").text('请输入正确的手机号');
            phoneBind.bindPhoneCorrectOrError(0);
            return;
        }
        if (!phoneBind.isCode(loginCodeVal)) {
            $(".error-tip-code").text('请输入正确的验证码');
            phoneBind.bindCodeCorrectOrError(0);
            return;
        }
        Util.ajax({
            url: "/api/personal/user/setting/bindPhone",
            data: { phone: phoneVal, code: loginCodeVal },
            success: function (e) {
                //$(".phone_bind_poupe").hide();
                that.cb(phoneVal);
                $.toast({text: "绑定手机号成功", type: "success",target: $("#phone_bind_content")});
                setTimeout(() => {
                    $("#phone_bind_content").dialog("close");
                }, 2000); 
            },
            error: function (e) {
                $.toast({text:e.msg, type: "error",target: $("#phone_bind_content")});
            }
        })
    },
    addUI: function () {
        if ($("#phone_bind_content").length) {
            $("#phone_bind_content").dialog();
        } else {
            $('body').append(
                // '<div class="phone_bind_poupe">'+
                    '<div class="phone_bind_content" id="phone_bind_content">'+
                        // '<img class="phone_bind_close" src="" />' +
                        '<div class="pb_title">绑定手机号</div>' +
                        '<div class="pb_tip_title">为保证您的相关权益，请绑定手机号</div>' +
                        '<div class="pb_input_content">'+
                            '<input class="bind_input" placeholder="请输入手机号" maxlength="11" type="text" id="bind_phone" value="" />' +
                            '<div class="error-tip-amount"></div>'+
                        '</div>' +
                        '<div class="pb_input_content">' +
                            '<div class="pb_input_code">' +
                                '<input class="bind_input" placeholder="请输入验证码" maxlength="6" type="text" id="bind_code" value="" />' +
                                '<div class="tencent_btn_verify">获取验证码</div>' +
                            '</div>' +
                            '<div class="error-tip-code"></div>' +
                        '</div>' +
                        '<input name="signup_ticket" id="signup_ticket" type="hidden" />' +
                        '<input name="randstr" id="randstr" type="hidden" />' +
                        '<div class="pb_buttonContent">' +
                            '<div class="pb_cancel_butt">取消</div>' +
                            '<div class="pb_confirm_butt">确定</div>' +
                        '</div>' +
                    '</div>' 
                // '</div>'
            );
            phoneBind.addInputFocus();
        }   
    }
}
