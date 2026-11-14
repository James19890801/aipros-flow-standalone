import FileDatabase from "./operation/fileDatabase.js";
import ServerUtil from "./server/server.js";

/**
 * 发布和分享文件
 * @type {{publishTicket: string, publishRadom: string, publish: {source: string, execute: ProShare.publish.execute}, viewlink: {source: string, execute: ProShare.viewlink.execute}, emb: {source: string, execute: ProShare.emb.execute}, image: {source: string, execute: ProShare.image.execute}}}
 */
var ProShare = {
    publishTicket:"",
    publishRadom:"",
    publish: {
        source: '<div id="publish_toedit" class="pubpo-tab dialog-win-con">' +
        '<div class="toedit-des">当前文件已发布（公开）到ProcessOn，您可以：</div>' +
        '<div class="publish-content">' +
        '<div id="btn_submit_private">' +
        '<span class="icons">&#xe62d;</span>取消发布' +
        '</div>' +
        '<div class="item-seq">或者</div>' +
        '<div id="to_publish_edit">' +
        '<span class="icons">&#xe62e;</span>修改发布信息' +
        '</div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div id="publish_verifying" class="pubpo-tab dialog-win-con">' +
        '<div class="toedit-des">当前文件正在进行发布审核，请耐心等待</div>' +
        '<div class="publish-content">' +
        '<div id="btn_verifying">' +
        '<span class="icons">&#xe676;</span>审核中…' +
        '</div>' +
        '<div class="item-seq">或者</div>' +
        '<div id="to_publish_edit">' +
        '<span class="icons">&#xe62e;</span>修改发布信息' +
        '</div>' +
        '</div>' +
        '</div>'+
        '<div id="publish_topublic" class="pubpo-tab dialog-win-con"> ' +
        '<h3>文件信息</h3>' +
        // '<a href="/ac/210624?from=userPub" target="_blank"><img src="assets/images/special.png" class="streamer"/></a>' +
        '<ul class="form">'+
        '<li class="form-row">'+
        '<div class="text">标题</div>'+
        '<input type="text" class="txt" name="pub_title" id="pub_title" style="width:70%">'+
        '</li>'+
        '<li class="form-row">'+
        '<div class="text" style="vertical-align: top">文件描述</div>'+
        '<textarea id="publish_description" class="textarea txt" placeholder="详情描述限200字内"></textarea>'+
        '</li>'+
        '<li class="form-row">'+
        '<div class="text">分类</div>' +
        '<div class="select-box" id="industry"><input type="text" class="select" placeholder="选择所属行业" disabled><ul></ul></div>'+
        '</li>'+
        '<li class="form-row">'+
        '<div class="text">添加标签</div>'+
        '<div id="publish_addtags" class="feedTags txt">'+
        '<div id="tag_items"></div>'+
        '<input id="tag_input" class="tag-txt" type="text" placeholder="回车键添加标签，最多可添加5个标签">'+
        '</div>' +
        '<ul class="pro-tags"></ul><div class="change-tags">换一换</div>'+
        '</li>' +
        '<div style="height:1px;background:#F0F0F0;margin:23px 0"></div> ' +
        '<h3>设置文件克隆</h3>'+
        '<li class="form-row" style="padding-bottom:10px;">' +
        '<div class="text">克隆类型</div>' +
        '<div class="content" style="width:auto!important">' +
        '<div class="radio-btn-group">'+
        '<input id="public_clone_free" type="radio" class="clone-radio" name="public_clone" checked>' +
        '<label for="public_clone_free">免费克隆</label>' +
        '</div>'+
        '<div class="radio-btn-group">'+
        '<input id="public_clone_pay" type="radio" class="clone-radio " name="public_clone">' +
        '<label for="public_clone_pay">付费克隆<span>（用户克隆后，您可以获取收益）</span></label>' +
        '</div>'+
        // '<div class="radio-btn-group" title_pos="top" title="该设置模板将不被展示在模板首页，公开后请在推荐页查找此模板">'+
        '<div class="radio-btn-group" title_pos="top">'+
        '<input type="radio" name="public_clone" id="no_clone" class="clone-radio">' +
        '<label for="no_clone">不允许克隆<span>（仅可查看）</span></label>' +
        '</div>'+
        '</div>' +
        '</li>' +
        '<li class="form-row selece-price-box" style="padding-bottom:20px;">' +
        '<div class="text">克隆价格</div>'+
        '<ul class="selece-price">'+
        '<li class="select-price-item" style="width:154px;"><input id="setprice"  placeholder="请输入5元以上价格" type="text" value="" autocomplete="off"/>'+
        // '<li class="select-price-item">3</li>'+
        '<li class="select-price-item">5</li>'+
        '<li class="select-price-item">10</li>'+
        '<li class="select-price-item">15</li>'+
        '<li class="select-price-item">20</li>'+
        '</li>'+
        '</ul>'+
        '</li>'+
        '</ul>'+
        '<div class="bot-line">'+
        '<div class="agreement-group" style="display:block;margin:0; ">'+
        '<input id="agreement" type="checkbox" name="agreement" checked=""><label for="agreement">点击发布表示您同意我们的<a href="/tos" target="_blank" class="agreement-detail">《服务条款》</a></label>'+
        '</div>'+
        '<div class="dlg-buttons">'+
        '<div class="btn" id="exposure">如何提升创作曝光' +
        '<a href="https://www.processon.com/support#user-template" target="_blank"><img src="assets/images/exposure.png"></a>' +
        '</div>' +
        '<span class="pro-btn btn-close btn" data-step="close">取消</span>'+
        '<span id="btn_submit_publish" class="pro-btn default pub-btn btn btn_submit_publish" data-step="publish" style="float: none;">发布</span>'+

        '</div>'+
        '</div>'+
        '</div>',
        officialTags:[],
        getOfficialTags:function(){
            var title = $("#pub_title").val();
            pcUtil.ajax({
                url: "/api/pc/tags/official/tags",
                type:'get',
                success:function(e){
                    ProShare.publish.officialTags =[];
                    for(var i = 0;i < e.data.length;i++){
                        ProShare.publish.officialTags.push(e.data[i].tagName);
                    }
                    ProShare.publish.renderOfficialTags()
                }
            });
        },
        renderOfficialTagsCount: 0,
        renderOfficialTags:function(){
            var proTags = $(".pro-tags");
            var proTagsLiLen = proTags.find('li').length;
            var tagsSel = ProShare.publish.getRandomItem(ProShare.publish.officialTags,5);
            var active_hot = [];
			this.renderOfficialTagsCount++;
			if(this.renderOfficialTagsCount == 1){
                active_hot = ['学霸笔记'];
                for(var a = tagsSel.length - 1; a >= 0; a--){
                    if(active_hot.indexOf(tagsSel[a]) < 0){
						active_hot.push(tagsSel[a]);
					}
                }
                tagsSel = active_hot;
			}
            proTags.empty()
            for(var i = 0; i < tagsSel.length; i++){
                var liClass = "";
                if(tagsSel[i] == '暑期生活' || tagsSel[i] == '学霸笔记') {
                    liClass = 'hot';
                }
                proTags.append('<li class="'+ liClass +'">'+ tagsSel[i] +'</li>')
            }
        },
        getRandomItem:function(arr,num){
            var selectList = [], arrCopy = $.extend(true, [], arr);
            for(var i = 0; i < num; i++){
                var arrIndex =Math.floor(Math.random()*arrCopy.length);
                if(selectList.indexOf(arrCopy[arrIndex]) == -1){
                    selectList.push(arrCopy[arrIndex])
                    arrCopy.splice(arrIndex, 1)
                }
            }
            return selectList
        },
        execute: function(chartId){
            var that = this;
			that.renderOfficialTagsCount = 0;
            $("#btn_submit_publish").after($("#TencentCaptcha"));
            $("#TencentCaptcha").show();
            $("#btn_submit_publish").hide();
            //腾讯安全校验
            $("#TencentCaptcha").off("click").on("click",function () {
                new TencentCaptcha('2039741519', function(res) {
                    if(res.ret === 0){
                        ProShare.publishTicket = res.ticket;
                        ProShare.publishRadom = res.randstr;
                        $("#TencentCaptcha").hide();
                        $("#btn_submit_publish").show();
                    }else {
                        console.warn("用户主动关闭验证码");
                    }
                }).show();
            });
            //获取文件信息
            FileDatabase.getChartById(chartId, chart => {
                if(chart) {
                    //设置状态
                    setPublicStatus(chart.status);
                    $("#tag_items").children("span").remove();
                    $(".selece-price-box").hide();
                    if(chart.tags != null && chart.tags.length > 0){
                        for(var i = 0; i < chart.tags.length; i++){
                            addTag(chart.tags[i]);
                        }
                    }
                    if(chart.industry != null){
                        $("#industry .select").val(chart.industry)
                    }
                    $("#publish_description").val(Util.restoreXss(chart.description));
                    $("#pub_title").val(Util.restoreXss(chart.title)).off().on("blur", function(){
                        if($("#pub_title").val() != Util.restoreXss(chart.title)){
                            chart.title = $("#pub_title").val();
                            //修改标题时保留活动标签
                            ProShare.publish.renderOfficialTagsCount = 0;
                            ProShare.publish.getOfficialTags();
                        }
                    })
                    if(chart.template == true){
                        $("#public_clone_pay").attr("checked", true);
                        $(".selece-price-box").show();
                    }
                    if(chart.publicClone && chart.publicClonePrice > 0){
                        $("#public_clone_pay").attr("checked", true);
                        $(".selece-price-box").show();
                        $(".setprice-btn").val(chart.publicClonePrice);
                        $('#btn_submit_publish').text('提交审核');
                    }else if(!chart.publicClone && chart.status == "public"){
                        $("#no_clone").attr("checked", true);
                    }else{
                        $("#public_clone_free").attr("checked", true);
                    }
                    ProShare.publish.getOfficialTags();
                }
            });

            //跳转到编辑页面
            $('#pubpo_win').on("click","#to_publish_edit", function(){
                reloadCaptcha();
                $(".pubpo-tab").hide();
                $("#publish_topublic").show();
            });
            $("#publish_addtags").on('click', function(e) {
                $('#tag_input').focus();
            });

            $(".select-box").click(function(e){
                e.stopPropagation();
                $(this).find("ul").toggle();
            })
            $("#file_type").on("click","li",function(){
                $("#file_type .select").val($(this).text())
            })
            $("body").click(function(){
                $(".select-box ul").hide();
            })
            // 行业列表
            pcUtil.ajax({
                url: "/api/pc/meta/official/industries",
                type: "get",
                data: {},
                success:function(e){
                    for (var i in e.data.industries) {
                        $("#industry ul").append('<li>'+ e.data.industries[i] +'</li>')
                    }
                }
            });
            $("#industry").on("click","li",function(){
                $("#industry .select").val($(this).text())
            })
           // 换一换
            var proTags = $(".pro-tags");
            $(".change-tags").off().on("click",function(){
                var tagsSel = ProShare.publish.getRandomItem(ProShare.publish.officialTags,5);
                proTags.empty()
                for(var i = 0; i < tagsSel.length; i++){
                    proTags.append('<li>'+ tagsSel[i] +'</li>')
                }
            })
            // 标签选择
            proTags.off().on("click","li",function(e){
                e.stopPropagation();
                var that = $(this);
                if($("#tag_items").children("span").length < 5){
                    that.remove();
                    proTags.append('<li>'+ ProShare.publish.getRandomItem(ProShare.publish.officialTags,1)[0] +'</li>');
                    for(var i = 0; i < ProShare.publish.officialTags.length; i++){
                        if(that.text() == ProShare.publish.officialTags[i]){
                            ProShare.publish.officialTags.splice(i, 1)
                        }
                    }
                }
                addTag(that.text())

            })
            //删除标签
            $("#tag_items").find(".close-tag").die().live("click", function(){
                var $tag = $(this).parent().find("input").val();
                $(this).parent().remove();
                if($("#tag_items").children("span").length < 5){
                    $("#tag_input").val("").focus();
                }
                ProShare.publish.officialTags.push($tag)
            });
            //初始化Tag输入
            $("#tag_input").off("keyup.input").on("keyup.input", function(event){
                if($.trim($(this).val()).length > 30) {
                    $(this).val($.trim($(this).val()).substring(0, 30));
                }
                var keycode = event.which;
                // if(keycode == 13){
                //     addTag($("#tag_input").val());
                //     $("#tag_input").val("");
                // }
                if(keycode == 188){
                    addTag($("#tag_input").val().substr(0, $("#tag_input").val().length-1));
                    $("#tag_input").val("");
                }
                $("#publish_addtags").scrollTop($(".input_item_box").height());
            }).off("keydown.delete").on("keydown.delete",function(event){
                if(event.which == 8 && $("#tag_input").val() == ""){
                    $("#tag_items span:last-child").remove();
                }
            }).suggest({
                url: "/tags/suggest",
                valueField: "tagName",
                format: function(item){
                    return item.tagName;
                },
                onEnter: function(){
                    addTag();
                    $(".feedTags").scrollTop($(".input_item_box").height());
                }
            });

            $("#pubpo_win .btn-close").click(function(){
                $("#pubpo_win").dialog("close");
            });
            $("#pubpo_win .dialog-close").click(function(){
                // 发布完成后关闭弹窗执行
                if (sessionStorage.getItem("published")) {
                    sessionStorage.removeItem("published");
                    pcUtil.ajax({
                        url: "/templates/template_talent_check",
                        success:function(e){
                            if(!e.isTalent && e.satisfy){
                                confirm({
                                    content: '恭喜您，根据您的内容贡献，您已经获得模板"达人"申请资格，<br/>是否立即加入达人？获得更多官方加持。了解更多<a style="color:#4386F5" href="/ac/210319" target="_blank" onclick="window.poCollect(\'达人申请弹窗\',{\'渠道记录\':\'个人文件\'});">"达人"权益。</a>',
                                    okval: '立即加入',
                                    cancelval: '暂不加入',
                                    width:'500px',
                                    title:'ProcessOn邀请您加入"达人"',
                                    onConfirm: function () {
                                        window.open("/ac/210319?from=userPub")
                                    }
                                });
                            }
                        }
                    })
                }
            });
            function confirm(options){
                var confirmWin = $("#global_confirm_window");
                var okval = "确定";
                if(options.okval){
                    okval = options.okval;
                }
                var cancelval = "取消";
                if(options.cancelval){
                    cancelval = options.cancelval;
                }
                var title = "请确认";
                if(options.title){
                    title = options.title;
                }
                if(!confirmWin.length){
                    confirmWin = $("<div id='global_confirm_window' tabindex='-1' class='confirm-box' title='"+title+"'><div class='dlg-content'>"+options.content+"</div><div class='dlg-buttons'><span class='pro-btn default okbtn'>" + okval + "</span>&nbsp;&nbsp;<span class='pro-btn basic cancelbtn close'>"+ cancelval +"</span></div></div>").appendTo("body");
                }else{
                    confirmWin.find(".dlg-content").html(options.content);
                    confirmWin.find(".okbtn").html(okval);
                }
                if(options.width){
                    confirmWin.css("width", options.width);
                }
                if(options.height){
                    confirmWin.css("height", options.height);
                }
                if(options.hiddenOK){
                    confirmWin.find(".okbtn").css("visibility", "hidden")
                }else{
                    confirmWin.find(".okbtn").css("visibility", "visible")
                }
                if(options.hiddenCancel){
                    confirmWin.find(".cancelbtn").css("display", "none")
                }else{
                    confirmWin.find(".cancelbtn").css("visibility", "inline-block")
                }
                confirmWin.dialog();
                $(document).off('keyup.confirm').on('keyup.confirm', function(e){
                    if(e.keyCode == 13)
                        confirmWin.find(".okbtn").trigger('click');
                });
                confirmWin.find(".okbtn").off().on("click", function(){
                    confirmWin.dialog("close");
                    if(options.onConfirm){
                        options.onConfirm();
                    }
                    $(document).off('keyup.confirm');
                });
                confirmWin.find(".cancelbtn").off("click.cancel").on("click.cancel", function(){
                    if(options.onCancel){
                        options.onCancel();
                    }
                    $(document).off('keyup.confirm');
                });
            }
            //协议
            $("#agreement").on('change',function(){
                var isAgree = $(this).prop('checked'),
                    submitBtn = $("#btn_submit_publish");
                if(!isAgree){
                    submitBtn.disable();
                    return;
                }
                submitBtn.enable();
            });
            //开放克隆选择
            $(".clone-radio").off().on("change", function(){
                var ispriceChecked = $('#public_clone_pay').prop('checked'),
                    btnSubmit = $('#btn_submit_publish');
                if(ispriceChecked){
                    $('.selece-price-box').show();
                    btnSubmit.text('提交审核');
                    return;
                }
                $('.selece-price-box').hide();
                btnSubmit.text('发布');
            });
            //价格为数字
            $('.selece-price').off().on('click', '.select-price-item', function(e) {
                var $this = $(this);
                $('.select-price-item').removeClass('active');
                if($this.find('input').length > 0){
                    if($("#setprice").val() == 0) {
                        $("#setprice").val('');
                    }
                    if($(this).val() === 0) $(this).val(1);
                    $("#setprice").on("input", function(e){
                        // $(this).val($(this).val().replace(/[^\d]/g,''));
                        $(this).val($(this).val().replace(/^(\-)*(\d+)\.(\d).*$/,'$1$2.$3'));
                        if($(this).val() === 0) $(this).val(1);
                    }).on('blur', function() {
                        if($(this).val() != ''){
                            $(this).parent().addClass("active")
                        }else{
                            $(this).parent().removeClass("active")
                        }
                        $(this).parent().removeClass('ipterror');
                    });
                    return;
                }else {
                    $('.selece-price input').val('');
                    $("#setprice").parent().removeClass('ipterror');
                    $this.addClass('active');
                    return;
                }
            });
            //执行发布
            $("#btn_submit_publish").off().on("click", function(){
                var state = "verifying";
                var freeClone = $('#public_clone_free').prop('checked'),
                    noClone = $('#no_clone').prop('checked');
                if(freeClone || noClone){
                    state = "public"
                }
                doPublishOrNot(state);
            });
            //取消发布
            $("#btn_submit_private").off().on("click", function(){
                var state = "private";
                doPublishOrNot(state);
            });
            //执行发布或者取消发布
            function doPublishOrNot(state){
                var $publishDescription = $("#publish_description"),
                    cloneRadioChecked = $('.clone-radio:checked');
                var contentType = "";
                var param = {};
                param.chartId = chartId;
                param.description = $.trim($publishDescription.val());
                param.title = $.trim($("#pub_title").val());//文件主题
                param.industry = $("#industry .select").val();//文件分类
                param.tags = getTags().join(",");
                param.status = state;
                param._public_clone = ($("#no_clone")[0].checked == true)? "false" : "true";
                param._public_clone_price = parseInt($("#setprice").val() ?  $("#setprice").val() : $(".select-price-item.active").text());
                param.ignore = "description";
                if(state != "private"){
                    if(param.title == "" || param.title == "未命名文件"){
                        Toast && new Toast({type: "error", msg: `未命名文件不允许发布，请修改文件标题后再发布`}, $("#pubpo_win"));
                        $("#pub_title").focus();
                        return;
                    }
                    if(param.description == ""){
                        //提示
                        Toast && new Toast({type: "error", msg: `请输入文件描述`}, $("#pubpo_win"));
                        $publishDescription.focus();
                        return;
                    }
                    if(!param.industry){
                        Toast && new Toast({type: "error", msg: `请选择文件分类`}, $("#pubpo_win"));
                        return
                    }
                    if(param.tags.length == 0){
                        //提示
                        Toast && new Toast({type: "error", msg: `请输入文件标签`}, $("#pubpo_win"));
                        $("#publish_addtags").find("input").focus();
                        return;
                    }
                    if(cloneRadioChecked.length < 1){
                        Toast && new Toast({type: "error", msg: `您需要选择是否开放克隆`}, $("#pubpo_win"));
                        return;
                    }
                    var isPayClone = $('#public_clone_pay').prop("checked");
                    if(isPayClone){
                        var setPriceInput = $("#setprice");
                        var num = param._public_clone_price;
                        if(num == 0 || num > 99){
                            Toast && new Toast({type: "error", msg: `请您输入价格(5 - 99)`}, $("#pubpo_win"));
                            setPriceInput.focus();
                            return;
                        }else if(!/^(\d+\.\d{1,1}|\d+)$/.test(num)){
                            Toast && new Toast({type: "error", msg: `克隆价格需为数字，最多一位小数`}, $("#pubpo_win"));
                            setPriceInput.focus();
                            return;
                        }else if(num < 5){
                            Toast && new Toast({type: "error", msg: `克隆价格需大于5元`}, $("#pubpo_win"));
                            setPriceInput.focus();
                            return;
                        }
                    }
                }
                $("#btn_submit_publish").disable();
                var url = state == "verifying" ? "/api/pc/folder/verify" : "/api/pc/folder/v2/publish";
                // var url = "/api/pc/folder/publish";
                // if(url == "publish"){
                    param["signupTicket"] = ProShare.publishTicket;
                    param["randstr"] = ProShare.publishRadom;
                // }
                let pubIcon = "";
                if(state == "private") {
                    url = "/api/pc/folder/unpublish";
                    param = { chartId: chartId };
                    contentType = "application/x-www-form-urlencoded";
                }
                else {
                    contentType = "application/json";
                    param = JSON.stringify(param);
                }

                pcUtil.ajax({
                    url,
                    contentType,
                    type: "post",
                    data: param,
                    success:function(res){
                        $("#btn_submit_publish").enable();
                        if(res.code == "clone"){
                            Toast && new Toast({type: "error", msg: `克隆的文件暂不允许发布`}, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        else if(res.code == 810){
                            Toast && new Toast({type: "error", msg: `非自己文件，不允许发布`}, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        else if(res.code == 826) {
                            Toast && new Toast({type: "error", msg: `存在及其相似的文件，请保证文件原创`}, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        else if(res.code == 813){
                            Toast && new Toast({type: "error", msg: `腾讯防水墙验证失败`}, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        else if(res.code == 828){
                            Toast && new Toast({type: "error", msg: `阿里云安全校验失败`}, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        else if(res.code == "error_status"){
                            Toast && new Toast({type: "error", msg: `文件已在审核中，不允许发布`}, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        else if(res.code == 830){
                            Toast && new Toast({type: "error", msg: `该用户目前为黑名单，请联系管理员解除`}, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        else if(res.code == 814){
                            Toast && new Toast({type: "error", msg: `文件标签填写有误，请修改文件标签后再发布`}, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        else if(res.code == "rename"){
                            Toast && new Toast({type: "error", msg: `未命名文件不允许发布，请修改文件标题后再发布`}, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        else if(res.code == 811){
                            Toast && new Toast({type: "error", msg: `当前模板内容较少，请丰富后再发布~`}, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        else if (res.code == 827){
                            var msgText = ['正常','涉黄','广告','涉暴','涉政','辱骂','灌水'], msg = data.msg;
                            Toast && new Toast({type: "error", msg: `描述或标签中存在敏感词汇，请修改后再发布`}, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        else if (res.code == 'error_safe_time'){
                            Toast && new Toast({type: "error", msg: `新用户注册时间小于24小时禁止发布、请稍后再发布`}, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        else if (res.code == 'error_safe_count'){
                            Toast && new Toast({type: "error", msg: `已达到每天发布文件数量限制(默认24张)、请稍后再发布`}, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        else if(res.code == 829){
                            Toast && new Toast({type: "error", msg: `当前文件为活动投稿，请您联系 <a href='https://kefu.easemob.com/webim/im.html?configId=4a1146cf-e7d9-4dea-98bd-921192252b7c' style='font-weight:bold;'>官方客服</a> 取消公开`}, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        else if(res.code != 200) {
                            Toast && new Toast({type: "error", msg: res.msg }, $("#pubpo_win"));
                            reloadCaptcha();
                            return;
                        }
                        $("#" + chartId).find('.pubicon').remove();

                        if(state == "verifying" || state == "public"){
                            state = "verifying"
                            Toast && new Toast({type: "success", msg: `文件已经提交审核`}, $("#pubpo_win"));
                            var resource = pageContext.params.resource;
                            pubIcon = '<span class="pubicon">审核中</span>';
                            $("#" + chartId).find(".col3, .file-img-container").append(pubIcon);
                            sessionStorage.setItem("published", true);
                        }
                        else if(state == "public"){
                            Toast && new Toast({type: "success", msg: `文件已经发布成功`}, $("#pubpo_win"));
                            var resource = pageContext.params.resource;
                            pubIcon = pageContext.getPubIcon({status:"public",publicClone:param._public_clone,publicClonePrice:param._public_clone_price},resource);
                            $("#" + chartId).find(".col3, .file-img-container").append(pubIcon);
                            sessionStorage.setItem("published", true);
                        }
                        else{
                            Toast && new Toast({type: "success", msg: `文件已经取消发布，已处于私密状态`}, $("#pubpo_win"));
                        }
                       
                    }
                });
            }
            function reloadCaptcha(){
                $("#TencentCaptcha").show();
                $("#btn_submit_publish").hide();
            }
            //设置公开私有状态
            function setPublicStatus(status) {
                var pubpoTab = $('.pubpo-tab');
                //控制状态显隐
                if (status == "public") {
                    pubpoTab.hide();
                    $("#publish_toedit").show();
                }else if(status == "verifying"){
                    pubpoTab.hide();
                    $("#publish_verifying").show();
                }else{
                    pubpoTab.hide();
                    $("#publish_topublic").show();
                    $("#publish_topublic").find("textarea").focus();
                }
            }
            //添加标签
            function addTag(value){
                if(typeof value == "undefined"){
                    value = $("#tag_input").val();
                    $("#tag_input").val("");
                }
                if($("#tag_items").children("span").length >= 5){
                    //提示最多五个
                    $("#tag_input").inputTip({text:"最多添加五个标签",pos:"rightout"});
                    return;
                }
                if(value != ""){
					value = Util.filterXss(value.trim());
                    var currentItems = $("#tag_items").find(".tagitem").map(function(){
                        return $(this).find("input").val();
                    }).get();
                    if($.inArray(value, currentItems) < 0){
                        $("#tag_items").append("<span class='tagitem'><span class='close-tag icons'>&#xe637;</span><input type='hidden' name='tags' value='"+value+"'/>" + value + "</span>");
                        $("#tag_items").show();
                    }
                }
            }
            //获取文件标签
            function getTags(){
                //获取标签
                var tags = $("#tag_items").find(".tagitem").map(function(){
                    return $(this).find("input").val();
                }).get();
                return tags;
            }
        }
    },
    viewlink: {
        source: '<div class="dlg-content">' +
        '<h3><span class="tip1">创建浏览链接，分享给别人后，可以通过此链接来安全地浏览您的文件</span></h3>' +
        '<div style="margin:15px 0;">' +
        '<input type="text" id="view_link_input" class="input txt" style="width:90%;border-radius:0" readonly placeholder="您还没有给文件创建分享链接">' +
        '<span original-title="复制链接" class="icons link-icon">&#xe6de;</span>'+
        '</div>' +
        '<div class="button-line">' +
        '<div class="new-form-switch" style="margin-left:0">' +
        '<span class="switchbutton fl gray" val="false">' +
        '<span class="switch left"><span class="icons" style="color:#888;">&#xe652;</span></span>' +
        '<span class="switch-left">删除密码</span>' +
        '<span class="switch-right" style="color:#333">添加密码</span>' +
        '</span>' +
        '</div>' +
        '<input type="text" class="txt input-pw" style="margin-left:10px;display:none;height:10px;" maxlength="8" placeholder="密码" />' +
        // '<div class="clear"></div>' +
        '</div>' +
        '<div class="share-menu" style="display: none;">' +
        '分享到' +
        '<a class="share_to_a weixin" style="display:inline-block;" target="_blank" rel="nofollow" hrefs="http://api.qrserver.com/v1/create-qr-code/?data=$viewLinkId"></a>' +
        '<a class="share_to_a weibo" style="display:inline-block;" target="_blank" rel="nofollow" hrefs="http://service.weibo.com/share/share.php?appkey=4181333602&title=$title&url=https://www.processon.com&ralateUid=2711044785"></a>' +
        '<a class="share_to_a qzone" style="display:inline-block;" target="_blank" rel="nofollow" hrefs="http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?desc=$title&title=$title&url=https://www.processon.com&summary=$title"></a>' +
        '<a class="share_to_a mingdao" target="_blank" rel="nofollow" hrefs="http://www.mingdao.com/share?appkey=5967E9E0B4ADA1B9C23B1893ABAED0F&pic=http://www.processon.com/chart_image/thumb/$thumb.png&title=$title&url=https://www.processon.com"></a>' +
        '<a class="share_to_a douban" style="display:inline-block;" target="_blank" rel="nofollow" hrefs="http://www.douban.com/share/service?name=$title&href=https://www.processon.com"></a>' +

        '<a class="share_to_a facebook" style="display:inline-block;" target="_blank" rel="nofollow" hrefs="http://www.facebook.com/sharer.php?u=https://www.processon.com&t=ProcessOn"></a>' +
        '<a class="share_to_a google" style="display:inline-block;" target="_blank" rel="nofollow" hrefs="http://www.google.com/bookmarks/mark?op=add&bkmk=https://www.processon.com&title=ProcessOn"></a>' +
        '<a class="share_to_a linkedin" style="display:inline-block;" target="_blank" rel="nofollow" hrefs="http://www.linkedin.com/shareArticle?mini=true&url=https://www.processon.com&title=ProcessOn"></a>' +
        '</div>' +
        '<div class="share-del">'+
        	'<span class="pro-btn default create">创建链接</span>'+
         	'<span class=""></span><span id="del-hint" style="margin-left:20px;">删除链接后别人无法浏览你的文件，你可以选择再次创建链接</span>'+
        '</div>' +
        '</div>',
        execute: function(chartId){
            var chart = null;
            var viewLinkId = "";
            $(".dlg-content .create").disable();
            // Util.get(`/client/pc/${chartId}/share_link`, {}, function(data){
            Util.get(`/api/pc/view/add/link?chartId=${chartId}`, {}, function(data){
                var host = ipc.sendSync('getGlobal',"host");
                var chart_pass = data.data.chart_pass;
				var title = data.data.chart_title;
                viewLinkId = data.data.viewLinkId;
                var viewLinkUrl = `${host}/view/link/${viewLinkId}`
                $(".dlg-content .create").enable();
                if(viewLinkId == "" || viewLinkId == null){
                    showCreateViewLink();
                }else{
                    var state = "false";
                    var viewPassword = null;
                    if(chart_pass != null && chart_pass != ""){
						state = "true";
						viewPassword = chart_pass;
					}
                    $('.switchbutton').attr('val', state);
                    showShareViewLink(viewPassword);
                    $("#view_link_input").val(viewLinkUrl).select();
                    $('.dialog-win-left li[tit=emb]').attr('data-viewLinkUrl', viewLinkUrl)
                }
                if(locale == "zh"){
                    $('.share_to_a.weixin').attr('hrefs', $('.share_to_a.weixin').attr('hrefs').replace('$viewLinkId', viewLinkUrl)).show();
                    $('.share_to_a.weibo').attr('hrefs', $('.share_to_a.weibo').attr('hrefs').replace('$title', title)).show();
                    $('.share_to_a.qzone').attr('hrefs', $('.share_to_a.qzone').attr('hrefs').replace('$title', title)).show();
                    $('.share_to_a.mingdao').attr('hrefs', $('.share_to_a.mingdao').attr('hrefs').replace('$thumb', title)).show();
                    $('.share_to_a.douban').attr('hrefs', $('.share_to_a.douban').attr('hrefs').replace('$title', title)).show();
                    $('.share_to_a.facebook').hide();
                    $('.share_to_a.google').hide();
                    $('.share_to_a.linkedin').hide();
                }else{
                    $('.share_to_a.weixin').attr('hrefs', $('.share_to_a.weixin').attr('hrefs').replace('$viewLinkId', viewLinkId)).hide();
                    $('.share_to_a.weibo').attr('hrefs', $('.share_to_a.weibo').attr('hrefs').replace('$title', title)).hide();
                    $('.share_to_a.qzone').attr('hrefs', $('.share_to_a.qzone').attr('hrefs').replace('$title', title)).hide();
                    $('.share_to_a.mingdao').attr('hrefs', $('.share_to_a.mingdao').attr('hrefs').replace('$thumb', title)).hide();
                    $('.share_to_a.douban').attr('hrefs', $('.share_to_a.douban').attr('hrefs').replace('$title', title)).hide();
                    $('.share_to_a.facebook').show();
                    $('.share_to_a.google').show();
                    $('.share_to_a.linkedin').show();
                }
            });
            $(".share_to_a").off("mousedown").on("mousedown", function(e){
                e.stopPropagation();
                var obj = $(this);
                pcUtil.ajax({
                    // url: `/client/pc/${chartId}/share_link`,
                    url: `/view/getlink?chartId=${chartId}`,
                    type: "get",
                    async:false,
                    success: function(data){
                        if(data.viewLinkId != ""){
                            var href = obj.attr("hrefs");
                            if(href.indexOf("/view/link/") < 0){
                                obj.attr("hrefs", href.replace("=https://www.processon.com", "=" + data.viewLinkId));
                            }
                            if(obj.hasClass("weixin")){
                                var hrefs = obj.attr("hrefs").replace("https://www.processon", "http://test.processon");
                                var img = '';
                                if($('.share-to-weixin').length < 1){
                                	img = $("<div class='share-to-weixin'></div>").appendTo("body");
                                	img.css({
                                        position:"absolute",
                                        width:200,
                                        height:216,
                                        left:"50%",
                                        top:"40%",
                                        marginLeft:-100,
                                        marginTop:-100,
                                        textAlign:"center",
                                        zIndex:9999999,
                                        border:"1px solid #ccc",
                                        background:"#fff",
                                        boxShadow:"1px 1px 12px #bbb"
                                    });
                                    var qrcode = new QRCode(img[0], {
                                        width:180,
                                        height:180
                                    });
                                    img.find("img").css({
                                        width:"180px",
                                        height:"180px",
                                        marginTop:10,
                                        marginLeft:10
                                    }).after('<div>微信扫一扫 分享</div>');
                                    qrcode.makeCode(data.viewLinkId);
                                }
                                img = $('.share-to-weixin');
                                $(document).off("mousedown.weixin").on("mousedown.weixin", function(){
                                    img.remove();
                                });
                            }else{
                                window.open(obj.attr("hrefs"));
                            }
                        }
                    }
                });
            });
            $('.switchbutton').off().on('click', function(){
                var state = $(this).attr('val');
                if(state == "true"){
                    $(this).attr('val', false);
                }else{
                    $(this).attr('val', true);
                }
                changePWState(this);
            });
            $('.link-icon').off().on('click', function(){
                if(!$('#view_link_input').val().trim()){return;}
                $('#view_link_input').select();
                try{
                    if(document.execCommand('copy', false, null)){
                        Toast && new Toast({type: "success", msg: `链接已复制到剪切板`}, $("#share_win"));
                        //触发诸葛埋点事件
                    }else{
                    }
                }catch(e){
                }
            });
            $(".input-pw").off().on("change",function(e){
                var pw = $(this).val().trim();
                if(pw == ""){
                    return;
                }
                if(!/^[0-9a-zA-Z]+$/.test(pw.trim())){
                    Toast && new Toast({type: "error", msg: `只能为数字和字母的组合`}, $("#share_win"));
                    return;
                }
                addPassword(pw);
            });
            //显示创建链接
            function showCreateViewLink(){
                $(".dlg-content .create").text("创建链接").off().on("click", function(){
                    createViewLink();
                    // $('.share-menu, .button-line').show();
                    $('.button-line').show();
                    //触发诸葛埋点事件
                });
                $('.share-menu, .button-line').hide();
                $('#del-hint').hide();
                $("#view_link_input").val("").off();
            }
            //创建链接
            function createViewLink(){
                $(".input-pw").val("").hide().off();
                pcUtil.ajax({
                    url: "/api/pc/view/add/link",
                    type: 'GET',
                    data: {chartId: chartId},
                    success: function(data){
                        $('.switchbutton').attr('val', 'false');
                        showShareViewLink();

                        var link = data.data.viewLinkId;
                        var viewLinkUrl = `${ipc.sendSync('getGlobal',"host")}/view/link/${link}`;
                        $("#view_link_input").val(viewLinkUrl).select();
                        $('.dialog-win-left li[tit=emb]').attr('data-viewLinkUrl', viewLinkUrl)
                    }
                });
            }
            //显示分享链接
            function showShareViewLink(viewPassword){
                $(".dlg-content .create").text("删除链接").off().on("click", function(){
                    deleteViewLink();
                    $('.share-menu, .button-line').hide();
                })
                // $('.share-menu, .button-line').show();
                $('.button-line').show();
                $('#del-hint').show();
                changePWView(viewPassword);
            }
            function changePWView(viewPassword){
                var dom = $('.switchbutton');
                var state = dom.attr('val');
                if(state == "false"){	//没有密码
                    dom.removeClass('green').addClass('gray')
                    dom.find('.switch').removeClass('right').addClass('left');
                    dom.find('.switch .icons').show();
                    dom.find('.switch-left').hide();
                    dom.find('.switch-right').show();
                }else{	//有密码
                    dom.removeClass('gray').addClass('green')
                    dom.find('.switch').removeClass('left').addClass('right');
                    dom.find('.switch .icons').hide();
                    dom.find('.switch-left').show();
                    dom.find('.switch-right').hide();
                    if(!!viewPassword){
                        $(".input-pw").show().val(viewPassword);
                    }
                }
            }
            //删除分享链接
            function deleteViewLink(){
                pcUtil.ajax({
                    url: "/api/pc/view/del/link",
                    type: 'GET',
                    data: {chartId:chartId},
                    success: function(data){
                        showCreateViewLink();
                    }
                });
            }
            //增删改密码
            function changePWState(dom){
                var state = $(dom).attr('val');
                if(state == "true"){
                    var randomPW = Util.creatCode(4);
                    $(".input-pw").show().val(randomPW).select();
                    addPassword(randomPW);
                }else{
                    pcUtil.ajax({
                        url: "/api/pc/view/remove/password",
                        type: 'GET',
                        data: {chartId:chartId},
                        success: function(data){
                            $(".input-pw").val("").hide().off();
                            changePWView($(".input-pw").val());
                        }
                    });
                }
            }
            //添加浏览密码
            function addPassword(pw){
                pcUtil.ajax({
                    url: "/api/pc/view/add/password",
                    type: 'POST',
                    data: {viewPassword: pw, chartId:chartId},
                    success: function(data){
                        changePWView($(".input-pw").val());
                        Toast && new Toast({type: "success", msg: `密码设置成功`}, $("#share_win"));
                    }
                });
            }
        }
    },
    emb: {
        source: '<div class="embed-enable"><h3><span class="tip1">还未创建浏览链接，无法生成嵌入代码</span></h3><div class="share-del"><span class="pro-btn default create">创建链接</span></div></div>' +
        '<div class="embed-con" style="display:none;"><div class="embed-left">' +
        '<div class="embed-preview-wrap">' +
        '<div class="embed-preview"></div>' +
        '</div>' +
        '</div>' +
        '<div class="embed_attributes form">' +
        '<div id="embed_show_tip">' +
        '您可以复制下面的代码，嵌入到第三方网站中，比如：<a href="https://www.yuque.com/?chInfo=ch_processon__chsub_embed" target="_blank"><svg style="width:50px;vertical-align:-5px;" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 81 28" id="logo"><g fill="none" fill-rule="evenodd"><path d="M48.96 6.168c-.282 0-.472-.049-.57-.146-.099-.097-.148-.267-.148-.51 0-.23.05-.4.148-.508.098-.11.288-.164.57-.164h9.77c.257 0 .438.054.542.164.105.109.157.279.157.509 0 .242-.052.412-.157.51-.104.096-.285.145-.542.145h-5.336l-.442 1.855h3.68c.417 0 .748.022.994.064.245.042.426.127.542.255.117.127.19.315.221.564.03.248.046.579.046.991v1.892h1.067c.258 0 .439.054.543.164.104.109.156.279.156.509 0 .218-.052.382-.156.491-.104.11-.285.164-.543.164H48.334c-.27 0-.453-.055-.552-.164-.098-.109-.147-.273-.147-.491 0-.23.05-.4.147-.51.099-.109.283-.163.552-.163h2.282l.607-2.474H49.29c-.208 0-.365-.046-.47-.137-.103-.09-.155-.263-.155-.518 0-.424.208-.637.625-.637h2.245l.441-1.855H48.96zm10.027 13.188c0 .558-.104.956-.313 1.192-.208.236-.582.355-1.122.355h-6.77c-.553 0-.93-.119-1.132-.355-.203-.236-.304-.634-.304-1.192v-3.201c0-.546.101-.934.304-1.164.202-.23.58-.346 1.131-.346h6.771c.54 0 .914.115 1.122.346.209.23.313.618.313 1.164v3.201zM57.662 16.3c0-.206-.08-.309-.239-.309H50.91c-.147 0-.22.103-.22.31v2.946c0 .207.073.31.22.31h6.513c.16 0 .24-.103.24-.31V16.3zm-8.978 1.074c.208.17.31.348.304.536-.007.188-.132.404-.378.646-.319.328-.613.6-.883.819-.27.218-.595.467-.975.746-.245.17-.478.27-.699.3a.848.848 0 01-.589-.119 1.032 1.032 0 01-.395-.509c-.092-.23-.126-.515-.102-.855l.479-7.586c.024-.242-.08-.345-.313-.309l-1.693.182c-.355.036-.595.006-.717-.091-.123-.097-.196-.279-.22-.546-.025-.23.02-.403.137-.518.117-.115.328-.185.635-.21l1.913-.181c.589-.06 1.021.033 1.297.282.276.248.396.7.36 1.355l-.442 7.095c-.013.194.049.23.184.109a13.208 13.208 0 001.03-.928c.38-.4.736-.473 1.067-.218zm3.956-8.06l-.608 2.475h5.023V9.733c0-.182-.018-.297-.055-.345-.037-.049-.141-.073-.313-.073H52.64zm-4.968-.927c-.319.291-.687.218-1.104-.218a84.667 84.667 0 00-1.076-1.119c-.374-.382-.794-.78-1.26-1.191-.405-.34-.43-.704-.074-1.092a.557.557 0 01.47-.182c.19.012.407.128.652.346.54.473.988.888 1.343 1.246.356.358.681.7.975 1.028.233.242.356.451.368.627.013.176-.085.361-.294.555zm28.636.2c-.368.23-.745.449-1.131.655-.386.206-.776.412-1.168.619.073.072.159.188.257.345.098.206.203.43.313.673l.331.728h5.133c.233 0 .405.052.515.155.11.103.166.276.166.518 0 .425-.227.637-.68.637h-5.465v1.273h4.912c.233 0 .405.052.515.155.11.103.166.276.166.518 0 .425-.227.637-.68.637h-4.913v1.219h4.784c.233 0 .404.051.515.154.11.103.165.276.165.519 0 .242-.055.41-.165.5-.11.091-.282.137-.515.137h-4.784v1.327h5.74c.454 0 .681.23.681.692 0 .242-.055.412-.166.51-.11.096-.282.145-.515.145H67.57v.09c0 .243-.058.416-.175.519-.116.103-.291.155-.524.155-.245 0-.42-.052-.524-.155-.105-.103-.157-.276-.157-.518v-8.096a154.592 154.592 0 01-1.582.364c-.38.085-.64.091-.782.018-.141-.072-.23-.248-.267-.527-.037-.23-.003-.403.101-.519.105-.115.298-.203.58-.263a39.981 39.981 0 004.26-1.146c1.355-.449 3.412-1.252 3.412-1.304V8.235v-3.54c0-.486.233-.728.7-.728.465 0 .698.242.698.727v3.984c1.076-.566 1.842-1.002 2.3-1.31.27-.17.49-.254.663-.254.171 0 .337.109.496.327.148.206.19.397.13.573-.062.176-.258.367-.59.573zm-6.44-3.802c.197.146.298.306.304.482.007.176-.095.41-.303.7a21.526 21.526 0 01-1.693 2.065 22.174 22.174 0 01-2.079 1.956c-.319.255-.57.391-.754.41-.184.017-.356-.077-.515-.283-.147-.194-.197-.373-.147-.536.049-.164.202-.361.46-.592a21.672 21.672 0 001.968-1.855 16.81 16.81 0 001.6-1.965c.21-.303.409-.479.599-.527.19-.049.377 0 .56.145zm5.888 1.165c-.233-.23-.364-.431-.395-.6-.03-.17.04-.34.211-.51.184-.17.362-.243.534-.218.172.024.38.145.626.363.552.51 1.143 1.125 1.775 1.847.632.721 1.26 1.5 1.886 2.337.208.28.325.51.35.692.024.182-.062.345-.258.49-.22.17-.42.228-.598.174-.178-.055-.39-.246-.635-.573a38.263 38.263 0 00-1.665-2.074 30.71 30.71 0 00-1.83-1.928zM67.57 19.356h5.648V18.03H67.57v1.327zm0-5.166h5.648v-1.273H67.57v1.273zm0 2.529h5.648v-1.22H67.57v1.22zm5.39-6.349a57.34 57.34 0 01-1.526.637c-.515.206-1.049.406-1.6.6h3.624a23.08 23.08 0 00-.405-.837c-.086-.157-.117-.29-.092-.4z" fill-opacity=".85" fill="#000"></path><g><g fill="#31CC79"><path d="M31.42 3.991l-2.564-.136s-.97-3.38-5.422-3.683c-4.452-.303-7.365-.113-7.365-.113s3.303 2.088 1.979 5.813c-.983 2.01-2.54 3.652-4.198 5.539L2.882 23.84c10.21-.148 16.23-.222 18.058-.222 5.13 0 9.464-4.417 9.287-9.332-.122-3.378-1.205-4.141-1.577-5.62-.373-1.48.373-3.84 2.77-4.676z" id="logo_a"></path></g><g fill-opacity=".6" fill="url(#logo_b)"><path d="M31.42 3.991l-2.564-.136s-.97-3.38-5.422-3.683c-4.452-.303-7.365-.113-7.365-.113s3.303 2.088 1.979 5.813c-.983 2.01-2.54 3.652-4.198 5.539L2.882 23.84c10.21-.148 16.23-.222 18.058-.222 5.13 0 9.464-4.417 9.287-9.332-.122-3.378-1.205-4.141-1.577-5.62-.373-1.48.373-3.84 2.77-4.676z" id="logo_a"></path></g></g><g><g fill="#93E65C"><path d="M13.805 11.45C8.437 17.473 0 27.053 0 27.053c15.178 3.956 22.171-5.646 23.266-8.97 1.468-4.457-.606-6.631-1.78-7.34-3.98-2.405-6.934-.129-7.68.709z" id="logo_c"></path></g><g fill-opacity=".75" fill="url(#logo_d)" style="mix-blend-mode:overlay"><path d="M13.805 11.45C8.437 17.473 0 27.053 0 27.053c15.178 3.956 22.171-5.646 23.266-8.97 1.468-4.457-.606-6.631-1.78-7.34-3.98-2.405-6.934-.129-7.68.709z" id="logo_c"></path></g></g><g opacity=".448"><g fill="#60DB69"><path d="M19.203 23.678c-2.435.016-7.89.086-16.363.209l10.485-11.884.68-.768c.986-.944 3.806-2.75 7.515-.51 1.178.712 3.26 2.896 1.787 7.37-.428 1.298-1.75 3.55-4.104 5.583z" id="logo_e"></path></g><g fill-opacity=".65" fill="url(#logo_f)"><path d="M19.203 23.678c-2.435.016-7.89.086-16.363.209l10.485-11.884.68-.768c.986-.944 3.806-2.75 7.515-.51 1.178.712 3.26 2.896 1.787 7.37-.428 1.298-1.75 3.55-4.104 5.583z" id="logo_e"></path></g></g></g></svg></a> &nbsp;等' +
        '</div>' +
        '<textarea id="iframe_html" class="textarea txt" readonly="readonly" style="margin-top:10px;height:50px;width:98%;"></textarea>' +
        '<div class="embed-size">' +
        '<label class="title" for="embed_width">宽度:</label>' +
        '<input type="text" id="embed_width" name="embed_width" class="input txt" value="525"><label for="embed_width">px</label>,' +
        '<label class="title" for="embed_height">高度:</label>' +
        '<input type="text" id="embed_height" name="embed_height" class="input txt" value="245"><label for="embed_height">px</label>' +
        '</div>' +
        '<div style="margin-top:10px;">' +
        '或者直接引用以下地址：' +
        '</div>' +
        '<textarea id="iframe_html1" class="textarea txt" readonly="readonly" style="margin-top:10px;height:18px;width:98%;"></textarea>' +
        '</div></div>',
        execute: function(chartId){
        	$(".embed-con").hide();
        	$(".embed-enable").hide();
        	var viewLinkUrl = $('.dialog-win-left li[tit=emb]').attr('data-viewLinkUrl');
            if(!!viewLinkUrl){
                initEmbedCon();
            }else{
                showCreateViewLink();
                return;
            }
        	//显示创建链接
            function showCreateViewLink(){
            	$(".embed-enable").show();
                $(".embed-con").hide();
            	var pending = false;
                $(".share-del .create").text("创建链接").off().on("click", function(){
                	if(pending){
                		return;
                	}
                	pending = true;
                    pcUtil.ajax({
	                    url: "/api/pc/view/add/link",
                        type: 'GET',
	                    data: {chartId: chartId},
	                    success: function(data){
	                        var link = data.data.viewLinkId;
	                        $(".embed-enable").hide();
	                        initEmbedCon();
	                        $(".embed-con").show();
	                        pending = false;
	                    },
	                    error:function(){
	                    	pending = false;
	                    }
	                });
                });
            }
            function initEmbedCon(){
                let host = ipc.sendSync('getGlobal',"host");
	        	if(host.indexOf("http") < 0 && host.indexOf("processon.com") < 0){
	            	host = "http://" + host;
	            }else if(host.indexOf("wxmp.processon.com") >= 0){
	            	host = "https://wxmp.processon.com";
	            }else if(host.indexOf("v3.processon.com") >= 0){
	            	host = "https://v3.processon.com";
	            }else if(host.indexOf("processon.com") >= 0){
	            	host = "https://www.processon.com";
	            }
	            $("#iframe_html").val("");
	            $("#iframe_html1").val("");
	            $(".embed-preview").html("");
	            var tp = $("#" + chartId).attr("cate");
	            var embed_ = "/embed/";
	//            if(tp.indexOf("mind") >= 0){
	//                embed_ = "/embed/mind/";
	//            }
	            var w,h;
	            w = $("#embed_width").val();
	            h = $("#embed_height").val();
	            changeEmbedWH(w,h);
	            $("#iframe_html").select();
	            //调整embedHTML宽高
	            function changeEmbedWH(w,h){
                    var viewLinkUrl = $('.dialog-win-left li[tit=emb]').attr('data-viewLinkUrl') + '?embed=true';
	                // var html = '<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:' + w + 'px; height:' + h + 'px;" src="' + (host + embed_ + chartId) + '"></iframe>';
	                var html = '<iframe id="embed_dom" name="embed_dom" frameborder="0" style="display:block;width:' + w + 'px; height:' + h + 'px;" src="' + viewLinkUrl + '"></iframe>';
	                $("#iframe_html").val(html);
	                $("#iframe_html1").val(viewLinkUrl);
	                $(".embed-preview-wrap").css({"margin-top": (-h/2)+"px", "margin-left": (-w/2)+"px"});
	                $(".embed-preview").html(html);
	                var iframe = document.getElementById("embed_dom");
	                iframe.onload = iframe.onreadystatechange = function(){
	                    if (!iframe.readyState || iframe.readyState == "complete") {
	                        setTimeout(function(){
	                            $(".embed-preview .preview_dis").remove();
	                            setTimeout(function(){$(".embed_obj").fadeIn();},100);
	                        }, 400);
	                    }
	                };
	            }
	            $(".embed-size").find("input").keyup(function(){
	                var w = $.trim($("#embed_width").val())=="" ? 340 : $.trim($("#embed_width").val());
	                var h = $.trim($("#embed_height").val())=="" ? 160 : $.trim($("#embed_height").val());
	                w = parseInt(w);
	                h = parseInt(h);
	                $(".embed-preview").find("div:first").css({"width": w+"px", "height": h+"px"});
	                $(".embed-preview").find("iframe").css({"width": w+"px", "height": h+"px"});
	                changeEmbedWH(w, h);
	            });
	            $("#iframe_html,#iframe_html1").off().on("click", function(){
	                $(this).select();
	                try{
	                    if(document.execCommand('copy', false, null)){
                            Toast && new Toast({type: "success", msg: `代码已复制到剪切板`}, $("#share_win"));
	                    }else{
	                    }
	                }catch(e){
	                }
	            });
	            $(".embed-preview").keydown(function(){
	                $(".embed-size").find("input").blur();
	            });
            	$(".embed-con").show();
            }
        }
    },
    image: {
        source: '<div class="dlg-content">' +
        '<h3><span class="tip1">分享图片链接</span></h3>' +
        '<div>' +
        '<input type="text" id="img_link_input" class="input txt" readonly style="width:98%;margin-top:10px;">' +
        '<div style="clear:both;"></div>' +
        '</div>' +
        '</div>',
        execute: function(chartId){
            pcUtil.ajax({
                url: "/folder/on_line_pic/" + chartId,
                success: function(data){
                    $("#img_link_input").show().prev().hide();
                    var url = pcUtil.urlReplace(data.url, ipc.sendSync('getGlobal',"host"), ipc.sendSync('getGlobal',"shareUrl"));
                    $("#img_link_input").val(url + "?_=" + new Date().valueOf()).off().on("click", function(){
                        $(this).select();
                        try{
                            if(document.execCommand('copy', false, null)){
                                Toast && new Toast({type: "success", msg: `链接已复制到剪切板`}, $("#share_win"));
                            }else{
                            }
                        }catch(e){
                        }
                    }).select();
                }
            });
        }
    }
};

export default ProShare;
