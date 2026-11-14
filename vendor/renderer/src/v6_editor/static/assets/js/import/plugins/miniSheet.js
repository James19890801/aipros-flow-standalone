// import $ from "./jquery-1.10.2";

// require("./common");
// require("../css/miniSheet.css")
// require("common");
import {Util} from '@common/util.js'
var miniSheet = {
	cateType: '',
	chartTitle: '',
	init(){
		// alert(Util.getUrlParams('token'))
		// alert(66666)
		this.addUI()
		this.addClick()
	},
	addUI: function (){
		$('body').append('<div class="more-box">abc123</div>')
    $('body').append('<div class="more-box">' +
        '<div class="more-box-block">' +
        '<div class="more-box-title">更多</div>' +
        '<div class="more-box-item" id="fenxiang">' +
        '<div class="more-box-icon"><img src="/public/static/assets/images/miniSheet/fx.svg"/></div>' +
        '<div class="more-box-name">分享</div>' +
        '</div>' +
        '<div class="more-box-item" id="rename">' +
        '<div class="more-box-icon"><img src="/public/static/assets/images/miniSheet/bj.svg"/></div>' +
        '<div class="more-box-name">重命名</div>' +
        '</div>' +
        '<div class="more-box-item" id="xianzuo">' +
        '<div class="more-box-icon"><img src="/public/static/assets/images/miniSheet/ywxz.svg"/></div>' +
        '<div class="more-box-name">协作</div>' +
        '</div>' +
        '<div class="more-box-item" id="lishi">' +
        '<div class="more-box-icon"><img src="/public/static/assets/images/miniSheet/lsbb.svg"/></div>' +
        '<div class="more-box-name">历史版本</div>' +
        '</div>' +
        '<div class="more-box-btn"><span>取消</span></div>' +
        '</div>' +
        '</div>')
    $('body').append('<div class="alert-bg">' +
        '<div class="alert-box">' +
        '<div class="alert-content">' +
        '<div class="alert-title" id="alert-title"></div>' +
        '</div>' +
        '<div class="alert-btn">' +
        '<div class="alert-cancel-btn">取消</div>' +
        '<div class="alert-bd"></div>' +
        '<div class="alert-confirm-btn">确定</div>' +
        '</div>' +
        '</div>' +
        '</div>')
    $('body').append('<div class="alert-bg-rename">' +
        '<div class="alert-box-rename">' +
        '<div class="alert-content-rename">' +
        '<div class="alert-title-rename">修改名称</div>' +
        '<div class="alert-input-rename">' +
        '<input type="text" value="'+this.chartTitle+'" id="alert-input-rename"/>' +
        '<div class="inputClear-onNext">' +
        '<div class="input-clear" style="display: block;"><span id="del-icon" class="close ' + ((this.cateType.indexOf('mind') >= 0 || this.cateType.indexOf('outline') >= 0) ? 'mind-icons">&#xe634;' : 'icons">&#xe714;') + '</span></div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="alert-btn-rename">' +
        '<div class="alert-cancel-btn-rename">取消</div>' +
        '<div class="alert-bd-rename"></div>' +
        '<div class="alert-confirm-btn-rename">确定</div>' +
        '</div>' +
        '</div>' +
        '</div>')
    $('body').append('<div class="alert-meddile-show">' +
        '</div>')
   

	} ,
	addClick: function(){
		$('.more-box-btn span').click(function () {     //点击取消按钮关闭更多弹窗
		    $('.more-box').hide();
		    $('.more-box-block').css({
		        bottom: '-200px'
		    });
		})
		$('#show-more').click(function () {     //点击按钮打开更多弹窗
		    $('.more-box').show();
		    $('.more-box-block').css({
		        bottom: '0px'
		    });
		})
		$('.more-box').click(function (e) {         //点击背景关闭更多底部弹窗
		    if ($(e.target).hasClass('more-box')) {
		        $('.more-box').hide();
		        $('.more-box-block').css({
		            bottom: '-200px'
		        });
		    }
		});
		$('#xianzuo').click(function () {       //跳转协作页面，但需要判断是否联网
		    if (navigator.onLine) {
		        uni.navigateTo({
		            url: '/pages/cooperation/AddList?chartId='+chartId
		        });
		        miniSheet.hideMore()
		    } else {
		        showToastLoad('请链接网络')
		    }
		})
		$('#lishi').click(function () {       //跳转历史页面
			miniSheet.toPathHistory()
		})
		
		$('.input-clear').click(function () {
		    $('#alert-input-rename').val('');
		})
		$('#fenxiang').click(function () {          //点击分享按钮关闭更多弹窗打开分享弹窗
		    if (navigator.onLine) {
		        uni.navigateTo({
		            url: '/pages/ready/shareImage?chartId='+chartId,
		            animationType: "slide-in-right",
		            animationDuration: 300
		        })
		    } else {
		        showToastLoad('请链接网络')
		    }
		    miniSheet.hideMore()
		})
		
		$('.share-popup').click(function (e) {      //点击背景关闭分享底部弹窗
		    if ($(e.target).hasClass('share-popup')) {
		        $('.share-popup').hide();
		        $('.share-popup-line').css({
		            bottom: '-200px'
		        });
		    }
		});
		$('.share-cancel-btn .btn').click(function () {       //点击分享取消按钮关闭分享底部弹窗
		    $('.share-popup').hide();
		    $('.share-popup-line').css({
		        bottom: '-200px'
		    });
		})
		$('.more-box-tit').click(function () {
		    miniSheet.hideMore();
		});
		
		$('#rename').click(function (e) {
		    miniSheet.hideMore();
		    $('.alert-bg-rename').show();
		    $('#alert-input-rename').focus();
		    $('#alert-input-rename').select();
		    $('#alert-input-rename').val(chartTitle);
		});
		$('#alert-input-rename').on('keydown', function (e) {
		    e.stopPropagation();
		})
		$('.alert-cancel-btn').click(function () {
		    $('.alert-bg').hide();
		})
		$('.alert-cancel-btn-rename').click(function () {
		    $('.alert-bg-rename').hide();
		})
		$('#head_more').click(function () {
		    var $dom = $('.op-con-list');
		    mindUI.showOpconList($dom);
		    $('section.op-con-detail').css("bottom", -240).hide();
		})
		$('#flowDownload').click(function () {
		    miniSheet.hideMore();
		    $('.app-export-bg').show();
		    setTimeout(function(){
		        $('.app-export').css({
		            bottom: '0px'
		        });
		    }, 200)
		})
		$('.app-export-bg').click(function (e) {      //点击背景关闭分享底部弹窗
		    if ($(e.target).hasClass('app-export-bg')) {
		        $('.app-export-bg').hide();
		        $('.app-export').css({
		            bottom: '-100px'
		        });
		    }
		});
		$('.app-export-btn span').click(function () {
		    $('.app-export-bg').hide();
		    $('.app-export').css({
		        bottom: '-100px'
		    });
		});
		// UI.doExport('image')
		$('.alert-confirm-btn').click(function () {
		    if (isRecoverDelete == 'recover') {
		        popularView.revertHistory()
		    } else if (isRecoverDelete == 'delete') {
		        popularView.removeHistory();
		    }
		    $('.alert-bg').hide();
		})
		$('.alert-confirm-btn-rename').click(function () {
		    var _value = $('#alert-input-rename').val();
		    if (_value.trim().length<= 0) {
		        showToastLoad('请输入文件名称')
		        return;
		    } else if (_value.length > 32) {
		        showToastLoad('文件名太长，请重新输入')
		        return;
		    }
		    Util.ajax({
		            url: "/api/personal/chart/rename",
		            contentType: false,
		            processData: false,
					type: 'post' ,
		            data: {chartId: chartId,title: _value,ignore:"title"},
		            success: function(data){
		            location.reload();
		            decoment.title = _value;
		        }
		    });
		
		    $('.alert-bg-rename').hide();
		})
	},
	shareMessageSubmit: function(type) {
	    if (navigator.onLine) {
	        uni.navigateTo({
	            url: '/pages/ready/shareImage?chartId='+chartId,
	            animationType: "slide-in-right",
	            animationDuration: 300
	        })
	    } else {
	        showToastLoad('请链接网络')
	    }
	    $('.share-popup').hide();
	    $('.share-popup-line').css({
	        bottom: '-200px'
	    });
	},
	hideMore: function() {       //关闭更多弹窗
	    $('.more-box').hide();
	    $('.more-box-block').css({
	        bottom: '-200px'
	    });
	},
	showToastLoad:function(title) {
	    $('.alert-meddile-show').text(title);
	    $(".alert-meddile-show").show();
	    setTimeout(function(){
	        $(".alert-meddile-show").hide();
	    }, 2000);
	
	},
	doExportList: function(type) {
	    UI.doExport(type);
	    $('.app-export-bg').hide();
	    $('.app-export').css({
	        bottom: '-100px'
	    });
	},
	toPathHistory: function() {          // 跳转历史版本页面
	    uni.navigateTo({
	        url: '/pages/mind/HistoryChart?chartId='+chartId,
	        animationType: "slide-in-right",
	        animationDuration: 300
	    })
	    miniSheet.hideMore();
	}
}
$(function(){
    miniSheet.init();
});



