import { cssData, htmlData } from "./cssData";
import { clone } from "./window";
export default class Pay {
  constructor(payload) {
    this.id = payload.id;
    this.successFn = payload.successFn;
    this.errorFn = payload.errorFn;
    this.pay_type = payload.pay_type;
    this.pay_cteamId = payload.pay_cteamId;

    this.price = payload.price;
    this.priceList = payload.price.toString().split(".");
    this.xx = payload.xx;
    
    clone.init(payload);
    this.loadCss();
    this.loadHtml();
    // window.addEventListener("DOMContentLoaded", function () {
    this.loadJs();
    // }, false)
  }
  loadCss() {
    const cssid = "css-pay";
    let oCss = document.getElementById(cssid);
    if (oCss) return;
    oCss = document.createElement("style");
    oCss.innerHTML = cssData;
    document.body.appendChild(oCss);
  }
  loadHtml() {
    const htmlid = "payWindow";
    let oHtml = document.getElementById(htmlid);
    if (!oHtml) {
      oHtml = document.createElement("div");
      document.body.appendChild(oHtml);
    }
    oHtml.innerHTML = htmlData(this.priceList); //this.price
  }
  loadJs() {
    if (this.pay_type == "designer") {
      $("#pay_type_wrap").remove();
      $("#weixinpay").remove();
      // clone.designerWxPay()
      //
    } else {
      // $("#pay_type_wrap").dialog();
      clone.initProduct();
      document.getElementById("payimg").innerHTML = "";
      clone.allPay();
    }
    var showCoupon = sessionStorage.getItem("showCoupon") || "";
    if (showCoupon && showCoupon != "false" && showCoupon != "undefined") {
      $("#discounts-btn").show();
    } else {
      $("#discounts-btn").hide();
    }
    var thePirce = sessionStorage.getItem("thePirce") || "";
    if (thePirce && thePirce != "false") {
      var pirce = thePirce - 0;
      $("#payPirce").text(pirce);
      sessionStorage.removeItem("thePirce");
    }
    $(".price-code").on("click", function () {
      $("#pay_type_wrap").css("display", "none");
      $("#pay_type_wrap").siblings(".dialog").css("display", "none");
      $("#conversion").css("display", "block");
      clone.getCoupon();
    });
    $("#conversion_btn").click(function () {
      var couponCode = $("#price-code1").val();
      if (couponCode == "") {
        Util.globalTopTip(
          "优惠码不能为空",
          "top_error",
          1000,
          $("#payWindow"),
          true
        );
        return false;
      }
      clone.useCoupon();
      var url = window.location.href;
      var pageName = "";
      if (url.indexOf("/template/user-new") > -1) {
        //关注页
        pageName = "我的关注";
      } else if (url.indexOf("/template/recent") > -1) {
        pageName = "最近使用";
      } else if (url.indexOf("/template/fav") > -1) {
        pageName = "我的收藏";
      } else if (url.indexOf("/template/publish") > -1) {
        pageName = "我的发布";
      } else if (url.indexOf("/template") > -1) {
        pageName = "模板首页";
      } else if (url.indexOf("?fromnew=1") > -1) {
        pageName = "流程图预览页";
      } else if (url.indexOf("?fromnew=1#map") > -1) {
        pageName = "我的关注";
      }
    });
  }
}
