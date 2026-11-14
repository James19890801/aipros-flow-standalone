const loadingImg = `${staticBasePath}/wps/images/insert-loading1.gif`;

const insertEdit = {
    init:function () {
        if(fileType == "mind"){
            //写入取消、插入按钮
            $("body").append('<div id="insert-editor-button"><div data-type="cancel" class="po-button">取消</div><div data-type="insert" class="po-button primary">插入</div></div>');
        }else {
            //写入取消、插入按钮
            $("body").append('<div id="insert-editor-button"><div data-type="cancel" class="po-button">取消</div><div data-type="insert" class="po-button primary">插入</div></div>');
        }
        //接口支持导出，显示导出
        if(deviceType.indexOf('wpsclient') > -1){
            //是否支持导出预览
            WpsEditorClient.cefqueryFn.send('querySupportInterface',{},function (res) {
                if(res && res.saveBase64Img == "true" && res.openLocalFile == "true"){
                    $(".header-center span[tit=export]").show();
                }
            })
        }
        //写入打开、关闭按钮
        $(".header-right").append('<div id="top-insert-open-tab" class="header-right-item" title="在新标签页打开"><span class="mind-icons">&#xe76b;</span></div><div id="top-insert-close" class="header-right-item"><span class="mind-icons">&#xe622;</span></div>')
        //隐藏关闭按钮
        if(location.search.indexOf("withoutclose") > -1){
            $("#top-insert-close").css("visibility","hidden");
        }
        //隐藏关闭按钮和占位
        if(location.search.indexOf("hideclose") > -1){
            $("#top-insert-close").hide();
        }
        //隐藏loading
        $('#page-imgcreating').hide();
        $("#top-wps-share-btn").hide();
        this.domEvent();
        /*setTimeout(function () {
            wpsCollect("docer_processonkmini_display",{
                workboard:fileType,
                membership:wpsVipInfo.join('#')
            })
        },2000)*/
		$(window).trigger("resize.designer");//流程图footer栏高度css异步加载后 需要重新计算
    },
    domEvent:function () {
        var that = this;
        //新标签页打开
        $("#top-insert-open-tab").off("click").on("click",function () {
            WpsEditorClient.cefqueryFn.send("editFile",{
                "groupid": pageInfo.group_id,
                "fileid":pageInfo.file_id,
                "type":fileType
            })
            /*wpsCollect("docer_processonkmini_edit",{
                workboard:fileType,
                membership:wpsVipInfo.join('#'),
                btn_name:'new_tab'
            })*/
        })
        //关闭
        $("#top-insert-close").off("click").on("click",function () {
            WpsEditorClient.cefqueryFn.send("closeDialog");
            /*wpsCollect("docer_processonkmini_edit",{
                workboard:fileType,
                membership:wpsVipInfo.join('#'),
                btn_name:'close'
            })*/
        })
        $("#insert-editor-button>div").off("click").on("click",function () {
            var type = $(this).attr("data-type");
            if(type == "insert"){
                //插入
                that.createImg()
                /*wpsCollect("docer_processonkmini_edit",{
                    workboard:fileType,
                    membership:wpsVipInfo.join('#'),
                    btn_name:'insert'
                })*/
            }else {
                //取消
                WpsEditorClient.cefqueryFn.send("closeDialog");
                /*wpsCollect("docer_processonkmini_edit",{
                    workboard:fileType,
                    membership:wpsVipInfo.join('#'),
                    btn_name:'cancel'
                })*/
            }
        })
    },
    //生成图片插入
    createImg:function () {
        var that = this;
        var wpsFileId = pageInfo.file_id,
            groupid = pageInfo.group_id,
            encrypted_session = pageInfo.encrypted_session,
            pageLoading = $('#page-imgcreating');
        if(pageLoading.length == 0){
            pageLoading = $('<div id="page-imgcreating"><img src="'+loadingImg+'"><p>图片生成中，请稍候</p></div>').appendTo("body");
        }else {
            pageLoading.children("p").text("图片生成中，请稍候")
        }
        pageLoading.css("display","flex");
        const host = "/wpsapi";
        poAjax({
            type:"get",
            data: {
                file_id: wpsFileId,
                chartId: "wps",
                encrypted_session: encrypted_session,
                group_id: groupid,
            },
            cache: false,
            success: function(e){
                pageLoading.hide();
                WpsEditorClient.cefqueryFn.send('insertImage',{
                    "groupid": groupid,
                    "fileid":wpsFileId,
                    "data":e,      //base64 -- string
                    "type":fileType
                })
                poCollect('编辑器功能点击', {
                    button:'insert-template'
                });
                wpsCollect('processon_insertion', {
                    "act_type": "insert",
                });
                //关闭窗口
                //WpsEditorClient.cefqueryFn.send("closeDialog");
            },error: function(){
                $.toast({
                    type:"error",
                    text:"生成图片失败"
                });
                pageLoading.hide();
            }
        }, "wpsBase64")
    },
    /*wpsCef:{
        //客户端发送
        send:function (method,obj,callback) {
            var methodNew = method.replace(/\./g,"_");
            var params = obj ? $.extend({method:method},obj) : {method:method};
            if(callback){
                this.callback[methodNew] = function (res) {
                    res = JSON.parse(res);
                    console.log('wps收到:'+method,res);
                    callback(res)
                };
                params["callback"] = "insertEdit.wpsCef.callback."+methodNew;
            }
            console.log('wps发送',params);
            if(window.cefQuery){
                window.cefQuery({
                    request: "jsAsynCall(\"" + JSON.stringify(params) + "\")"
                });
            }
        },
        //是否支持
        support:function (api,callback) {
            var apiNew = api.replace(/\./g,"_");
            var params = {
                method:"common.util.support",
                params:{
                    api:api
                },
                callback:"wpsCef.callback.support."+apiNew
            }
            if(callback){
                this.callback.support[apiNew] = function (res) {
                    res = JSON.parse(res);
                    console.log('wps接口判断:'+api,res.result || false);
                    callback(res.result || false);
                };
            }
            if(window.cefQuery){
                window.cefQuery({
                    request: "jsAsynCall(\"" + JSON.stringify(params) + "\")"
                });
            }else {
                callback(false);
            }
        },
        //客户单回调
        callback:{
            support:{}
        }
    }*/
};
// window.onload = function () {
    insertEdit.init()
// }