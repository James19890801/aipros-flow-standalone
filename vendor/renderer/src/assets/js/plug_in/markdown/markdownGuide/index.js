import mardownNewGuide from './guide.js'
const markdownHelpMenu = {
    init(showCutFn){
       let dom = this.renderDom()
       this.addEvent(dom)
    },
    renderDom(){
        let dom = $(`<div class="bottom-handler">
                    <i class="iconfont icon-fuhao-wenhao-wubaibian" tit="menu"></i>
                    <ul class="extend-menu header-file-extend-menu normal po-menu">
                        <li class="po-menu-item" tit="guide">
                            <div class="po-menu-item-box">
                                <span class="po-diagraming-icons po-menu-icon">&#xe7f8;</span>
                                <span class="text">新手指引</span>
                            </div>
                        </li>
                        <li class="po-menu-item" ac="export">
                            <div class="po-menu-item-box" tit="short">
                                <span class="po-diagraming-icons po-menu-icon">&#xe7f6;</span>
                                <span class="text">快捷键说明</span>
                            </div>
                        </li>
                    </ul>
                </div>`)
        $('body').append(dom)
        return dom
    },
    addEvent(dom){
        let ul = dom.find('.extend-menu')
        dom.off('click').on('click',(e)=>{
            e.stopPropagation()
            let tit = $(e.target).closest('[tit]').attr('tit')
            if (tit === 'menu') {
                if(ul.is(":hidden")) {
                    ul.show()
                } else {
                    ul.hide()
                }
            } else if(tit === 'guide') {
                mardownNewGuide.init(true)
                ul.hide()
            } else {
                PoEditorClient.showShortcut()
                ul.hide()
            }
        })
        $(document).off('click.markdownHelpMenu').on('click.markdownHelpMenu',()=>{
            ul.hide()
        })
    }
}
export {
    markdownHelpMenu,
    mardownNewGuide,
}