export const cssData = `.login-desc {
    font-size: 13px;
    color: #666;
    margin-top: 10px;
    width: 100%;
    text-align: center;
  }
  .po-dialog-close{
    position: absolute;
    top: 18px;
    right: 20px;
    width: 24px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    cursor: pointer;
    border-radius: 4px;
    font-size: 16px;
    font-size: @font-size-l;
    z-index: 5;
    color: black;
  }
	.po-dialog-close:hover{
		background-color: #f3f5f9 !important;
	}
	
  .price-paytype {
    display: inline-block;
    border: 1px solid #ccc;
    padding: 7px 5px 4px 5px;
    vertical-align: top;
    width: 150px;
    border-radius: 5px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    text-align: center;
  }
  .price-paytype:hover {
    border: 1px solid #aaa;
  }
  .price-paytype.ac {
    border: 1px solid #4386f5;
  }
  .price-paytype .ico {
    right: 2px;
    top: 3px;
    position: absolute;
    display: none;
    color: #fff;
    font-size: 12px;
  }
  .price-paytype.ac .ico {
    display: block;
  }
  .price-paytype.ac:before {
    position: absolute;
    content: "";
    border: 30px solid transparent;
    border-right: 30px solid #4386f5;
    right: 0px;
    top: -31px;
  }
//   .button {
//     margin-left: 15px !important;
//   }
  .price-code {
    color: #4386f5;
    text-decoration: underline;
    transition: all 0.5s;
    line-height: 36px;
    margin-left: 30px;
  }
  .dlg-item .close-code {
    position: absolute;
    left: 163px;
    font-size: 13px;
    top: 50%;
    margin-top: -7px;
    display: none;
    height: 16px;
    line-height: 16px;
  }
  /* #price-code, #price-code1 {
  width: 0;
  font-size: 13px;
  color: #555;
  letter-spacing: 1px;
  margin-right: -14px;
  opacity: 0;
  vertical-align: -1px;
  transition: all .2s;
  margin-left:30px;
  }
  #price-code, #price-code1 {
  width: 150px;
  opacity: 1;
  margin-right: 4px;
  display: inline-block;
  }
  #price-code.ac, #price-code1.ac{
  border: 0px;
  text-decoration: underline;
  outline: none;
  } */
  #price-code1 {
    width: 150px;
    height: 30px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .conversion_btn {
    margin-top: 20px;
    display: inline-block;
    min-width: 38px;
    text-align: center;
    line-height: 30px;
    padding: 0 12px;
    color: #fff;
    background: #4386f5;
    border-radius: 3px;
    cursor: pointer;
  }
  .pay-back-view{
	
  	display: flex;
  	flex-direction: column;
  	// justify-content: center;
  	align-items: center;
  }
  #payWindow .dialog-close{
	color:#212930 !important;
  }
  .pay-main-back-view{
  	display: flex;
  	flex-direction: row;
  	align-items: center;
  	width: 100%;
  	margin-top: 22px;
  }
  .pay-img-back-view{
  	display: flex;
  	flex-direction: column;
  	align-items: center;
  	// width: 200px;
  	// width: 100%;
  	height: 257px;
  	border-radius: 8px;
  	opacity: 1;
	padding-bottom: 21px;
  	background: #ffffffff;
  	flex: 1;
  	// background-color: #eb5555ff;
  }
  .pay-img-title{
  	opacity: 1;
  	 color: #212930ff;
  	 font-size: 15px;
  	 font-weight: 500;
  	 margin-top: 20px;
  
  }
  .pay-img-money-small{
  	font-size: 12px;
	margin-bottom: 3px;
  }
  .pay-img-money-big{
  	font-size: 24px;
	margin-left: 2px;
  }
  .pay-img-money{
  	 opacity: 1;
  	 color: #eb5555ff;
  	 font-weight: 600;
  	font-size: 24px;
  	display: flex;
  	flex-direction: row;
  	// justify-content: flex-end;
  	align-items: flex-end;
  	margin-top: 12px;
  }
  .pay-img-money-subTitle{
  	color: #6c7d8fff;
  	 font-size: 12px;
  	 font-weight: 400;
  	 margin-top: 19px;
  }
  .pay-member-back-view{
  	display: none;
  	flex-direction: column;
  	align-items: center;
  	flex: 2;
  	border-radius: 8px;
  	opacity: 1;
  	background: #ffffffff;
  	height: 278px;
  	margin-left: 20px;
  }
  .pay-member-title{
  	 color: #212930ff;
  	 font-size: 15px;
  	 font-weight: 500;
  	 margin-top: 20px;
  }
  .pay-member-subtitle{
  	color: #6c7d8fff;
  	 font-size: 12px;
  	 font-weight: 400;
  	 margin-top: 12px;
  }
  .pay-member-introduce-view{
  	width: 292px;
  	height: 88px;
  	border-radius: 8px;
  	// opacity: 0.5;
  	background: #eff1f988;
  	margin-top: 32px;
  	display: flex;
  	flex-direction: column;
  	// flex-wrap:wrap;
  	justify-content: center;
  	align-items: center;
  	// padding: 14px 24px;
  }
  .pay-member-introduce-row-view{
	  display: flex;
	  flex-direction: row;
	  width: calc(100% - 46px);
	  height: auto;
	  justify-content: space-between;
  }
  .pay-member-introduce-title-view{
  	display: flex;
  	flex-direction: row;
  	justify-content: center;
  	align-items: center;
	height: auto;
  	// background-color: #6c7d8fff;
  	// width: calc(50% - 24px);
  	// height: calc(50% - 14px);
  }
  .pay-member-introduce-view-img{
  	width: 24px;
  	height: 24px;
  	
  }
  .pay-member-introduce-view-title{
  	color: #6c7d8fff;
  	 font-size: 12px;
  	 font-weight: 400;
  	 margin-left: 4px;
  }
  .paySubTitle{
	color: #ffffffff; 
	font-size: 13px; 
	font-weight: 400; 
	margin-top: 12px;
  }
  .all-pay-code-fail{
	width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.95);
    position: absolute;
    top: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .all-pay-code-fail-butt{
	color: #067BEF;
    cursor: pointer;
  }
  .pay-member-button{
	  cursor: pointer;
  	width: 136px;
  	height: 30px;
  	border-radius: 4px;
  	opacity: 1;
  	background: #067befff;
  	display: flex;
  	flex-direction: row;
  	justify-content: center;
  	align-items: center;
  	margin-top: 30px;
  	 color: #ffffffff;
  	 font-size: 13px;
  	 font-weight: 400;
  }`;

export const htmlData = (
	price
) => `<div id="payWindow" style="margin-top:-120px;margin-left:-50px;padding:20px;" class="payWindow">
<div id="payWindow-content" class="loginWindow-content">
<div id="pay_type_wrap" style="text-align:center;color:#333;width:400px;padding:20px;display:none;">
<h2 class="dialog-title" style="margin-bottom: 39px; font-size:20px;">选择支付方式</h2>
<div class="dlg-content">
<div class="dlg-item" style="text-align:center;">
<div tit="wxpay" class="price-paytype ac">
<span style="font-size: 30px; color: #19c105;" class="icons">&#xe655;</span>
<span class="icons ico">&#xe658;</span>
</div>
<div tit="alipay" class="price-paytype" style="padding: 12px 5px 8px 5px; margin-left: 12px;">
<span style="font-size: 24px; color: #00aaee;" class="icons">&#xe654;</span>
<span class="icons ico">&#xe658;</span>
</div>
</div>
<div class="dlg-item " id="discounts-btn" style="text-align:left;margin-top:10px;min-height:38px;line-height:35px;">
<div style="margin-bottom:4px;">
<a team class="price-code">输入优惠码</a>&nbsp;
</div>
</div>
<div class="dlg-item" style="text-align:right;margin-top:15px;">
<span id="zhifu" style="vertical-align: middle;width:auto;" class="button">支付<label style="margin-left:5px;">¥ <span id="payPirce">${price}</span></label></span>
</div>
</div>
</div>
<div class="dialog" style="border-radius:6px;width:600px;padding:20px;background-size: 100% 100%; background-image:url('src/assets/images/pay/pay_bg.png');" id="weixinpay">
	<div class="pay-back-view">
	<div style="color: #ffffffff; font-size: 18px; font-weight: 500;">温馨提示</div>
	<div class="paySubTitle">该模版为付费模版，请扫码支付后使用</div>
	<div class="pay-main-back-view">
				<div class="pay-img-back-view">
					<div class="pay-img-title">扫码支付</div>
					<div class="pay-img-money"><div class="pay-img-money-small">¥</div><div class="pay-img-money-big">${price[0]}</div><div class="pay-img-money-small pay-img-money-drop">.${price[1]}</div></div>
					<div id="payimg" disableTitle='true' style="width:120px;height:120px; margin-top: 10px;position:relative;"></div>
					<div class="pay-img-money-subTitle"><span style="font-size: 14px; color: #09bb07" class="po-icons  iconfont icon-weixinzhifu">&#xe689;</span><span style="margin-right: 4px; font-size: 14px; color: #00aaee;" class="po-icons iconfont icon-zhifubaozhifu">&#xe652;</span>微信或支付宝扫码支付</div>
				</div>
				<div class="pay-member-back-view">
					<div class="pay-member-title">开通会员免费使用</div>
					<div class="pay-member-subtitle">畅享VIP会员模版、无限文件量和以及更多会员功能</div>
					<div class="pay-member-introduce-view">
					<div class="pay-member-introduce-row-view">
						<div class="pay-member-introduce-title-view">
							<div class="pay-member-introduce-view-img">
								<img class="pay-member-introduce-view-img" src="src/assets/images/pay/member1.png">
							</div>
							<div class="pay-member-introduce-view-title">
								不限文件数量
							</div>
						</div>
						<div class="pay-member-introduce-title-view">
							<div class="pay-member-introduce-view-img">
								<img class="pay-member-introduce-view-img" src="src/assets/images/pay/member2.png">
							</div>
							<div class="pay-member-introduce-view-title">
								多种格式导出
							</div>
						</div>
					</div>
					<div class="pay-member-introduce-row-view" style="margin-top: 12px;">
						<div class="pay-member-introduce-title-view">
							<div class="pay-member-introduce-view-img">
								<img class="pay-member-introduce-view-img" src="src/assets/images/pay/member3.png">
							</div>
							<div class="pay-member-introduce-view-title">
								不限协作人数
							</div>
						</div>
						<div class="pay-member-introduce-title-view">
							<div class="pay-member-introduce-view-img">
								<img class="pay-member-introduce-view-img" src="src/assets/images/pay/member4.png">
							</div>
							<div class="pay-member-introduce-view-title">
								会员免费模板
							</div>
						</div>
					</div>
					</div>
					<div class="pay-member-button">开通会员免费使用</div>
				</div>
	</div>
	
	</div>
</div>

<div id="conversion" style="display: none;">
<div style="text-align:center;margin-top:30px;">
<div style="margin-top:20px;">使用优惠券</div>
<div style="margin-top:20px;"><input type="text" placeholder="请输入优惠码" id="price-code1" /></div>
<div class="conversion_btn" id="conversion_btn" style="margin-top:20px;">兑换</div>
</div>
</div>
</div>
</div>`;
