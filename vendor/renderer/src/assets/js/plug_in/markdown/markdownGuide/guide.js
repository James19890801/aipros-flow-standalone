const guide = {
    data: {
        list: [
            {
                title: '操作入门',
                img:'https://www.processon.com/assets/images/markdown/quick_start.mp4',
                content: [
                    '快捷编辑：输入 “/ ” 或点击图标插入内容，支持插入表格、公式、图表、图片',
                    '快速生成内容，脑图实时预览：可本地导入，使用底部推荐模版，AI生成',
                    // '脑图预览： markdown 直接生成思维导图，编辑过程实时用脑图查看',
                    '多格式下载：支持 Png、Jpg、Markdown、Xmind 等格式下载，全面满足需求',
                ]
            }
        ]
    },
    //初始化
    init: function (focus) {
        if (localStorage.getItem('markdonw_guide') === '1' && !focus) {
            return
        }
        if ($(".dlg_guide").length > 0) {
            $(".dlg_guide").remove();
        }
        this.renderDom();
        $(".dlg_guide").off().on("click", ".title span:not(.checked)", function () {
            $(this).addClass("checked").siblings().removeClass("checked");
            $(".dlg_guide .content .group").eq($(this).index()).show().siblings().hide();
        })
        $(".dlg_guide .title span").eq(0).trigger("click");
        $("#dlg_guide").dialog();
        $('#window-mask').css('position','fixed').css('left','0px').css('top','0px').css('z-index','1').css('background','#000').css('opacity',0.3)
        //设置localstorage
        localStorage.setItem('markdonw_guide', '1');
    },
    //渲染数据
    renderDom: function () {
        var list = this.data.list, titleDom = '', groupDom = '';
        list.map(function (item) {
            titleDom += '<span class="content-title">' + item.title + '</span>';
            groupDom += '<div class="group"><div class="img"><video src="' + item.img + '" loop autoPlay style="object-fit: fill;width: 100%;" muted></div><div class="list">';
            item.content.map(function (items) {
                groupDom += '<div class="item">' + items + '</div>'
            })
            groupDom += '</div></div>'
        })
        var guideDom = $('<div id="dlg_guide" class="dlg_guide outline-dlg">' +
            '<div class="dlg_title">玩转markdown' +
            titleDom +'</div>' +
            '<div class="outline-dlg-content">' +
                '<div class="content">' + groupDom + '</div>' +
            '</div>' +
            '</div>')
        $("body").append(guideDom);
        let width = guideDom.width()
        let targetheight = (width) / 1.47
        let videoContainer = guideDom.find('.group .img')
        videoContainer.css('height', targetheight + 'px')
        const video = videoContainer.find('video');
        video.on('loadedmetadata', () => {
            videoContainer.css('height', 'auto')
        });
    }
}
export default guide