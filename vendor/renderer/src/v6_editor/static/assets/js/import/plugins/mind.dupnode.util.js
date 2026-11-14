(function () {
    /**
     * 脑图重复节点工具JS
     */
    var tmpDef = currDef;
    var errorIds = [];
    var newDataIds = [];

    /**
     * 查找脑图定义中的重复节点
     */
    function duplicateNode() {
        var dataId = [];

        var data = tmpDef;
        //获取定义中的所有节点Id
        function showData(data) {
            dataId.push(data.id);
            var children = data.children;
            if (children.length > 0) {
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    showData(child);
                }
            }
            var lcd = data.leftChildren;
            if (lcd != null && lcd.length > 0) {
                for (var i = 0; i < lcd.length; i++) {
                    var child = lcd[i];
                    showData(child);
                }
            }
            var sums = data.summaries;
            if (sums != null && sums.length > 0) {
                for (var i = 0; i < sums.length; i++) {
                    var child = sums[i];
                    showData(child);
                }
            }
        }
        showData(data);

        for (var i = 0; i < dataId.length; i++) {
            var id = dataId[i];
            if (newDataIds.indexOf(id) >= 0) {
                errorIds.push(id);
            } else {
                newDataIds.push(id);
            }
        }

        if (errorIds.length > 0) {
            console.log("重复的id个数：" + errorIds.length);
            console.log(errorIds);

            var dialog = '<div id="dup-node-error-dlg-bg" style="width: 100%; height: 100%; opacity: 0.6; z-index: 10;background: #666;position: fixed;top: 0;left: 0;"></div>' +
                '<div id="dup-node-error-dlg" class="mind-dlg" style="width:400px;display: block;z-index: 11">\n' +
                '<h3 style="padding:0 18px;margin-bottom:32px;">文件定义错误</h3>\n' +
                '<div style="padding:0 18px;margin-bottom:12px;">\n' +
                '<div class="error-des" style="font-size:14px;line-height: 28px;margin-top: -10px;">您的脑图文件存在重复节点，不能正常作图</div>\n' +
                '</div>\n' +
                '<div style="margin:10px 0;" class="mind-dlg-buttons">\n' +
                '<span id="dup-node-error-dlg-result" style="margin-right: 50px;color: red;"></span>' +
                '<a id="dup-node-error-dlg-a" style="color: #656565;margin-right: 15px;cursor: pointer;">取消</a>'+
                '<span id="dup-node-error-dlg-span" class="mind-button">立即修复</span>&nbsp;&nbsp;\n' +
                '</div>\n' +
                '<img id="dup-node-error-dlg-img" style="position: absolute;left: 25%;top: -20px; display: none;" src="https://wps.processon.com/assets/images/thumb-default.gif">' +
                '</div>';
            $('body').append(dialog);
            // 取消
            $("#dup-node-error-dlg-a").off("click").on("click",function () {
                cancelDelDupNode()
            })
            // 立即修复
            $("#dup-node-error-dlg-span").off("click").on("click",function () {
                delDupNode();
            })
        }
    }

    /**
     * 删除重复节点
     */
    function delDupNode() {
        $('#dup-node-error-dlg-img').css('display', 'block');
        $('#dup-node-error-dlg-span').css('background', 'rgb(189, 189, 189)');
        $.ajax({
            url: "/mindmap/delDupNode",
            data: {
                def: JSON.stringify(tmpDef),
                errorIds: errorIds.join(","),
                ignore: "msgStr",
                group_id: group_id,
                parent_id: parent_id,
                userId: userId,
                file_id:file_id,
                chart_title:chartTitle,
                encrypted_session: encrypted_session,
                sync: true
            },
            type: "post",
            success: function(data){
                $('#dup-node-error-dlg-img').css('display', 'none');
                if (data.result === 'success') {
                    $('#dup-node-error-dlg-result').html('修复成功');
                    setTimeout(function() {
                        window.location.reload();
                    }, 500);
                } else {
                    $('#dup-node-error-dlg-result').html('修复失败，找客服');
                }

            },error: function(jqxr){
                $('#dup-node-error-dlg-img').css('display', 'none');
                $('#dup-node-error-dlg-result').html('修复失败，找客服');
                console.log(jqxr);
            }
        });
    }

    /**
     * 取消删除重复节点
     */
    function cancelDelDupNode() {
        $('#dup-node-error-dlg-bg').remove();
        $('#dup-node-error-dlg').remove();
    }

    //查找脑图定义中的重复节点
    duplicateNode();
})()

