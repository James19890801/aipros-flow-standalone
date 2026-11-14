/**
 * 此为私有化web_office独有文件
 * **/
const loadingImg = `${staticBasePath}/wps/images/insert-loading1.gif`;
const webOfficeData = {
    //js加载前
    initBefore:function () {
        this.listenMessage();
        this.replaceFn();
    },
    //页面加载后
    initAfter:function () {
        //写入取消、插入按钮
        $("body").append('<div id="insert-editor-button"><div data-type="cancel" class="po-button">取消</div><div data-type="insert" class="po-button primary">保存</div></div>');
        this.hide();
        this.domEvent();
    },
    //流程图加载默认图形(接口获取又返回，此处不需要)
    schemaDefault:function () {
        var flowSchemaDefault = ["basic","flow"];
        try {
            var flowSchema = JSON.parse(localStorage.getItem("flow_schema"));
            if(flowSchema && flowSchema.length){
                flowSchemaDefault = flowSchema;
            }
        }catch (e) {

        }
        Designer.setSchema(flowSchemaDefault)
    },
    //事件
    domEvent:function () {
        $("#insert-editor-button>div").off("click").on("click",function (e) {
            e.stopPropagation();
            const type = $(this).attr("data-type");
            // 取消
            if(type == "cancel"){
                window.parent.postMessage(JSON.stringify({eventType: 'processon', eventName: "cancel"}), "*");
                return
            }
            // 保存
            if(window.fileType == "flow"){
                const shapeLength = Object.keys(Model.define.elements).length;
                if(shapeLength == 0){
                    $.toast({
                        type:"error",
                        text:"您还没有绘制图形哦"
                    })
                    return
                }
            }
            window.parent.postMessage(JSON.stringify({eventType: 'processon', eventName: "save"}), "*");
        })
        /**脑图**/
        /*if(window.fileType == "mind"){
            $(".header-op-item[tit=mind_canvas_bgcolor],.header-op-item[tit=mind_themes]").off("click").on("click",function (e) {
                e.stopPropagation();
                var obj = $(this), tit = obj.attr("tit"), that = mind;
                if(that.opts.readonly){
                    return
                }
                switch (tit){
                    case 'mind_canvas_bgcolor':
                        mindUI.showColorBox({
                            target:obj,
                            trans: true
                        }, function(color){
                            obj.find(".color_line").css("backgroundColor", color);
                            mind.operation.setBackground.call(mind, color, true);
                        });
                        break
                    case "mind_themes":
                        var menu = $(".mind-theme-dlg");
                        mindUI.initThemeMemberIcon();
                        mindUI.showMenu(obj, menu, function() {
                            $("#mind-theme-customise").parent().hide();
                            if(mindUI.themeTopArr.length == 0) {
                                setTimeout(function() {
                                    $(".themes_con .theme_list").each(function(k, v) {
                                        var tagTop = parseInt($(v).position().top);
                                        mindUI.themeTopArr.push(tagTop);
                                    })
                                }, 300)
                            }
                            mindUI.loadCustomiseThemesOn();
                        });
                        break;
                }
            })
        }*/

    },
    //获取引入的外联js路径
    jsStr:function () {
        var jsArr = [];
        $("script").each(function () {
            var src = $(this).attr("src");
            if(src && jsArr.indexOf(src) == -1){
                jsArr.push(src)
            }
        })
        return jsArr.join(",");
    },
    //隐藏相关功能
    hide:function (){

    },
    //替换原有方法
    replaceFn:function () {
        // 屏蔽保存协作相关
        if(window.configCollaSave){
            configCollaSave.init = function () {}
            configCollaSave.publicCLBInit = function (){}
        }
        window.publicCLB = {

        }
        window.sendMessage = {
            send: function () {
                //保存成功后会重新构建鹰眼导航
                if(window.mind) {
                    mind.events.push("poNavigator");
                }
            },
            saveOnline: function () {

            }
        }
        // 快捷键Ctrl+S保存
        if(window.fileType === "flow"){
            UI.save = function () {}
        }
    },
    //监听postMessage
    listenMessage:function () {
        //监听函数
        window.addEventListener("message", function(e){
            try {
                var data = JSON.parse(e.data);
            }catch (e) {
                return false;
            }
            var eventName = data.eventName,
                dataMsg = data.data;
            if(!data || !eventName){
                return false;
            }
            if(eventName == 'getDef'){
                webOfficeData.getDef(function (def) {
                    webOfficeData.sendMessage("getDefCallback",{data:def});
                });
            }else if(eventName == 'getDefImg'){
                //是否显示loading
                if(dataMsg && dataMsg.showLoading){
                    $('<div id="page-imgcreating"><img src="'+loadingImg+'"><p>图片生成中，请稍候</p></div>').appendTo("body");
                }
                webOfficeData.getDefImg(function (def,imgStr) {
                    webOfficeData.sendMessage("getDefImgCallback",{"data": def, "img": imgStr});
                    $("#page-imgcreating").remove();
                });
            }
        }, false)
    },
    //发送
    sendMessage:function (eventName, data) {
        if (eventName) {
            var msgData = JSON.stringify({
                eventName:eventName,
                data:data
            })
            // console.log("发送", msgData);
            if(self != top){
                window.parent.postMessage(msgData, "*");
            }
        }
    },
    //获取文件定义
    getDef:function (callback) {
        if(window.fileType == "flow" && window.Utils){
            Utils.getBaseDef(function (def) {
                if(!def){
                    def = 'error';
                }
                callback && callback(def);
            })
        }else if(window.fileType == "mind" && window.mind){
            mind.util.getBaseDef(function (def) {
                if(!def){
                    def = 'error';
                }
                callback && callback(def);
            })
        }else {
            callback && callback('error');
        }
    },
    //图片生成中
    downloading: false,
    //获取base64位图片
    getDefImg: async function (callback) {
        if(webOfficeData.downloading){
            console.log("多次触发拦截");
            return
        }
        webOfficeData.downloading = true;
        // 获取base64图片
        const watermark = {};
        if(window.fileType != "flow"){
            watermark.download = mind.model.topic.showWatermark ? mind.model.topic.watermark : '';
        }else {
            watermark.download = Model.define.page.showWatermark ? Model.define.page.watermark : '';
        }
        const imgData = await WpsEditorClient.exportImg({
            wrapper:"#svg_exporter",
            type:"pnghd",
            fileType: window.fileType,
            watermark: watermark
        })
        // 获取文件定义
        webOfficeData.getDef(function (def) {
            // console.log(def)
            // console.log(imgData.img)
            callback && callback(def,imgData.img)
            webOfficeData.downloading = false;
        });
    }
}
webOfficeData.initBefore();
$(function () {
    webOfficeData.initAfter();
})