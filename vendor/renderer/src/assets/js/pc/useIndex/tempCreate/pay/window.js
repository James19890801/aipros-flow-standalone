/**
 * 支付相关模块
 * author zhagny
 * @type
 */
// import Vue from "vue";
import UserOperation from "@/assets/js/pc/db/user.js"
var pay_type,
  price,
  chartId,
  pay_cteamId,
  errorFn,
  successFn,
  priceList,
  memberFree,
  ownerId,
  chartTitle,
  from;
export const clone = {
  payType: "clone",
  init: function (options) {
    pay_type = options.pay_type;
    price = options.price;
    priceList = price.toString().split(".");
    chartId = options.id;
    pay_cteamId = options.pay_cteamId;
    errorFn = options.errorFn;
    successFn = options.successFn;
    memberFree = options.memberFree;
    ownerId = options.ownerId;
    chartTitle = options.chartTitle;
    from = options.from;
  },
  initProduct: function () {
    //支付类型
    $(".price-paytype").on("click", function () {
      var obj = $(this);
      obj.addClass("ac").siblings().removeClass("ac");
    });
    $(".price-paytype").on("click", function () {
      var obj = $(this);
      obj.addClass("ac").siblings().removeClass("ac");
    });
    setTimeout(function () {
      $(".po-diagraming-icons").css("color", "#ffffff");
      $(".po-dialog-close").hover(
        function () {
          $(this).css("background-color", "#f3f5f91A"); //hover时效果
        },
        function () {
          $(this).css("background-color", "transparent"); //非 hover时效果
        }
      );
    }, 100);
    if (priceList.length < 2) {
      $(".pay-img-money-drop").css("display", "none");
    } else {
      $(".pay-img-money-drop").css("display", "flex");
    }

    // Util.isLongMember(function(result,member){
    if (memberFree) {
      // 该模版为付费模版，请扫码支付后下载
      $(".paySubTitle").text(
        "该模版为VIP免费模版，请扫码支付或购买会员后免费使用"
      );
      $(".pay-member-back-view").css("display", "flex");
    } else {
      $(".paySubTitle").text("该模版为付费模版，请扫码支付后使用");
      $(".pay-member-back-view").css("display", "none");
    }
    // })

    $(".pay-member-button").on("click", function () {
      // buried_point_fn(
      //   "click",
      //   "template_member_click",
      //   buried_point.visit.pageName,
      //   {
      //     模板名称: chartTitle,
      //     作者ID: ownerId,
      //     弹窗名称: memberFree ? "模板支付_引导升级" : "模板支付_零售",
      //     模板ID: chartId,
      //     模板类型: memberFree ? "VIP免费" : "付费",
      //     支付价格: $(this).find("#payPirce").text(),
      //   }
      // );
      $(".po-dialog-close.icons.po-iconfont.icon-guanbi1").trigger("click");
      // Vue.$openPay("升级享无限文件量和全部会员权益", {
      //   pointSource: "个人文件页",
      //   pointPosition: "模板支付_引导升级",
      //   "页面模块":'模板新建模块',
      // });
      // window.open(`/upgrade?page=${from}&from=viptemplate&pos=${chartId}`);
    });
    // pay-member-back-view
    //个人版支付
    $("#zhifu")
      .off()
      .on("click", function () {
        var obj = $(this),
          dlg = obj.parent().parent();
        var paytp = dlg.find(".price-paytype.ac");
        if (paytp.attr("tit").indexOf("ali") >= 0) {
          try {
            // buried_point_fn(
            //   "click",
            //   "template_pay_click",
            //   buried_point.visit.pageName,
            //   {
            //     按钮名称: "支付",
            //     支付类型: "支付宝",
            //     支付价格: $(this).find("#payPirce").text(),
            //   }
            // );
          } catch (e) {}
          clone.aliPay();
        } else if (paytp.attr("tit").indexOf("wx") >= 0) {
          document.getElementById("payimg").innerHTML = "";
          clone.wxPay();
          // buried_point_fn(
          //   "click",
          //   "template_pay_click",
          //   buried_point.visit.pageName,
          //   {
          //     按钮名称: "支付",
          //     支付类型: "微信",
          //     支付价格: $(this).find("#payPirce").text(),
          //   }
          // );
        }
      });
    // console.log(555555,from)
    // 模板页
    // 模板详情页
    // 专题详情页
    var fromName = {
      template: "模板页",
      search: "模板搜索页",
      topic: "专题详情页",
      templateDetil: "模板详情页",
      templateCreate:"模版新建页",
      templateCreateView:"模版新建预览页"
    };
    if (fromName[from]) {
      var templateForm = fromName[from];
    } else {
      var templateForm = "未知";
    }
    // buried_point_fn("click", "template_pay_show", buried_point.visit.pageName, {
    //   模板名称: chartTitle,
    //   作者ID: ownerId,
    //   弹窗名称: memberFree ? "模板支付_引导升级" : "模板支付_零售",
    //   模板ID: chartId,
    //   当前页面: templateForm,
    //   模板类型: memberFree ? "VIP免费" : "付费",
    //   支付价格: $(this).find("#payPirce").text(),
    // });
  },
  /**
   * 支付宝支付
   */
  aliPay: function () {
    var paytp = $(".price-paytype.ac");
    if (paytp.attr("tit").indexOf("alipay") < 0) {
      return;
    }

    var params = {
      orderType: "clone", // user、team、adduser、clone
      upgradeType: "", //购买时长，单位年。示例:1y、2y、3y
      coupon: "", //优惠码
      realMoney: "", //支付金额（实际后端来计算）
      orgId: "", //团队版标识（暂时不加团队版）
      teamusercount: "", //团队版时的购买人数
      orgName: "", //团队版时的名称
      chartId: chartId,
    };
    Util.ajax({
      url: "/api/personal/order/alipay/pre_order",
      data: params,
      old: true,
      success: function (data) {
        if (data.code == 200) {
          clone.getCode(data.data.order.id, "ali");
        }
      },
    });
  },
  allPay: function () {
    var params = {
      orderType: "clone", // user、team、adduser、clone
      upgradeType: "", //购买时长，单位年。示例:1y、2y、3y
      coupon: "", //优惠码
      realMoney: "", //支付金额（实际后端来计算）
      orgId: "", //团队版标识（暂时不加团队版）
      teamusercount: "", //团队版时的购买人数
      orgName: "", //团队版时的名称
      // paytp: "wxpay",
      // upgradetp: "clone",
      chartId: chartId,
      //  price: price
    };

    const { host } = ipc.sendSync('getHost')
    $.ajax({
      url:  host+"/api/personal/pay/add/po/pre/order/info",
      contentType: "application/json",
      headers: {
        token: UserOperation.getToken(),
      },
      type: "POST",
      data: JSON.stringify(params),
      success: function (data) {
        if ($("#weixinpay .po-dialog-close").length === 0) {
          $("#weixinpay").dialog({
            customClose: $(
              "<div class='po-dialog-close icons po-iconfont icon-guanbi1'></div>"
            ),
            onClose: function () {
              clearInterval(window.checkWxTimer);
            },
          });
        }
        // var result = document.location.origin + '/support/privatefile/qr_pay?uuid=' + data.data;
        var result =
          "https://www.processon.com/support/privatefile/qr_pay?uuid=" +
          data.data +
          "&from=" +
          from +
          "&memberFree=" +
          memberFree;

        
        var qrcode = new QRCode(document.getElementById("payimg"), {
          width: 120,
          height: 120
        });
        qrcode.makeCode(result);
        // window.checkWxTimer = setInterval(function(){
        // 	clone.checkAllOrder(data.data);
        // }, 2000);
        let count = 0;
        window.checkWxTimer = setInterval(function () {
          count++;
          console.log(count);
          if (count >= 30) {
            // 二维码过期
            const failDom = `
			<div class="all-pay-code-fail" >
			<span class="all-pay-code-fail-text">二维码已过期，</span>
			<span class="all-pay-code-fail-butt">刷新</span>
		    </div>`;
            $("#payimg").append(failDom);
            $(".all-pay-code-fail-butt")
              .off("click")
              .on("click", () => {
                $("#payimg").empty();
                clone.allPay();
              });
            clearInterval(window.checkWxTimer);
          }
          clone.checkAllOrder(data.data, window.checkWxTimer);
        }, 2000);
        // if(data.code == 200){
        //  clone.getCode(data.data.order.id,"wx")
        // }
      },
    });
  },
  wxPay: function () {
    var paytp = $(".price-paytype.ac");
    if (paytp.attr("tit").indexOf("wxpay") < 0) {
      return;
    }

    var params = {
      orderType: "clone", // user、team、adduser、clone
      upgradeType: "", //购买时长，单位年。示例:1y、2y、3y
      coupon: "", //优惠码
      realMoney: "", //支付金额（实际后端来计算）
      orgId: "", //团队版标识（暂时不加团队版）
      teamusercount: "", //团队版时的购买人数
      orgName: "", //团队版时的名称
      // paytp: "wxpay",
      // upgradetp: "clone",
      chartId: chartId,
      //  price: price
    };
    Util.ajax({
      // url:"/order/clone/getweixinapi",
      // url:"/api/personal/order/clone/getWeChatApi",
      // url:"/api/personal/order/wechat/pay",
      url: "/api/personal/order/wechat/pre_order",
      data: params,
      old: true,
      success: function (data) {
        if (data.code == 200) {
          clone.getCode(data.data.order.id, "wx");
        }
      },
    });
  },
  getCode: function (orderId, type) {
    $("#payimg img").remove();
    //  orderId = "62c557d9eb9fbe5df4b790b0";//会员购买订单号
    var params = {
      orderId: orderId,
    };
    if (type == "wx") {
      $("#payWindow .pay_title").text("微信扫码支付");
      $("#payWindow .pay_des").text("长按识别或微信扫描二维码完成支付");
      Util.ajax({
        url: "/api/personal/order/wechat/pay",
        data: params,
        contentType: "application/x-www-form-urlencoded;charset=UTF-8",
        old: true,
        success: function (data) {
          $("#weixinpay").dialog({
            onClose: function () {
              clearInterval(window.checkWxTimer);
            },
          });
          var result = data.data;
          var qrcode = new QRCode(document.getElementById("payimg"), {
            width: 170,
            height: 170,
          });
          qrcode.makeCode(result.code_url);
          window.checkWxTimer = setInterval(function () {
            clone.checkWxOrder(orderId, checkWxTimer, "wx");
          }, 2000);
        },
      });
    } else if (type == "ali") {
      $("#payWindow .pay_title").text("支付宝扫码支付");
      $("#payWindow .pay_des").text("长按识别或支付宝扫描二维码完成支付");
      Util.ajax({
        url: "/api/personal/order/alipay/pay",
        data: params,
        contentType: "application/x-www-form-urlencoded;charset=UTF-8",
        old: true,
        success: function (data) {
          $("#weixinpay").dialog({
            onClose: function () {
              clearInterval(window.checkWxTimer);
            },
          });
          var result = data.data;
          var qrcode = new QRCode(document.getElementById("payimg"), {
            width: 170,
            height: 170,
          });
          qrcode.makeCode(result.qrCode);
          window.checkWxTimer = setInterval(function () {
            clone.checkWxOrder(orderId, checkWxTimer, "ali");
          }, 2000);
        },
      });
    }
  },
  checkAllOrder: function (uuid, t) {
    const { host } = ipc.sendSync('getHost')
    pcUtil.ajax({
      url: host+"/api/personal/pay/get/order/status/cyclic",
      type: "GET",
      headers: {
        uuid: uuid,
        token: UserOperation.getToken(),
        contentType:"application/x-www-form-urlencoded",
      },
      data: "",
      success: function (data) {
        var res = data.data;
        // console.log(res);
        // setTimeout(() => {
        //   clearInterval(t);
        //   $(".payWindow .dialog-close").trigger("click");
        //   successFn && successFn(res);
        // }, 1800);
        // setTimeout(() => {
        //   $(".payWindow .dialog-close").trigger("click");
        // }, 2000);
        if (res && res == "success") {
          clearInterval(t);
          $(".payWindow .dialog-close").trigger("click");
          successFn && successFn(res);
        } else {
          errorFn && errorFn(res);
        }
      },
      fail: function (e) {
        errorFn && errorFn(e);
      },
    });
  },
  checkWxOrder: function (orderId, t, type) {
    if (type == "wx") {
      Util.ajax({
        url: "/api/personal/order/wechat/query",
        data: {
          orderId: orderId,
        },
        old: true,
        success: function (data) {
          var res = data.data,
            ac = data.acti;
          if (res && res.trade_state == "SUCCESS") {
            clearInterval(t);
            successFn && successFn(res);
            // if(window_type == "designer"){
            // 	payCallback("success");
            // }else{
            // 	window.location.href = "/diagraming/new?template=" + chartId + "&team=" + pay_cteamId + "&orderId=" + result.orderId;
            // }
          } else {
            errorFn && errorFn(res);
          }
        },
        fail: function (e) {
          errorFn && errorFn(e);
        },
      });
    } else if (type == "ali") {
      Util.ajax({
        url: "/api/personal/order/alipay/query",
        data: {
          orderId: orderId,
        },
        old: true,
        success: function (data) {
          var res = data.data,
            ac = data.acti;
          if (res && res.trade_state == "SUCCESS") {
            clearInterval(t);
            successFn && successFn(data);
            // if(window_type == "designer"){
            // 	payCallback("success");
            // }else{
            // 	window.location.href = "/diagraming/new?template=" + chartId + "&team=" + pay_cteamId + "&orderId=" + result.orderId;
            // }
          } else {
            errorFn && errorFn(data);
          }
        },
        fail: function (e) {
          errorFn && errorFn(e);
        },
      });
    }
  },
  cloneFree: function () {
    window.location.href =
      "/diagraming/new?template=" + chartId + "&team=" + pay_cteamId;
  },
  //判断当前时间是否过期
  compareTime: function (nowTime, expireTime) {
    var nowTime = new Date(nowTime);
    var expireTime = new Date(expireTime);
    if (nowTime.getTime() - expireTime.getTime() <= 0) {
      //未过期
      return true;
    } else {
      //已经过期
      return false;
    }
  },
  //获取优惠码
  getCoupon: function () {
    Util.ajax({
      url: "/coupon/mycoupon",
      data: { specialId: "60d063497621316fc58c8138" },
      success: function (res) {
        var coupons = res.cous;
        var usableCoupon = [];
        for (var i = 0; i < coupons.length; i++) {
          if (!coupons[i].used) {
            usableCoupon.push(coupons[i]);
          }
        }
        if (usableCoupon.length >= 1) {
          $("#price-code1").val(usableCoupon[0].code);
        } else {
          return;
        }
      },
    });
  },
  //使用优惠券
  useCoupon: function () {
    var couponCode = $("#price-code1").val();
    Util.ajax({
      url: "/coupon/exchange_coupon",
      data: { coupon: couponCode, templateId: chartId },
      success: function (res) {
        if (res.result == "success") {
          window.location.href =
            "/diagraming/new?template=" + chartId + "&team=" + pay_cteamId;
        } else if (res.result == "error") {
          Util.globalTopTip(res.msg, "top_error", 2000, $("#payWindow"), true);
        } else {
          Util.globalTopTip(res.msg, "top_error", 2000, $("#payWindow"), true);
        }
      },
    });
  },
};
