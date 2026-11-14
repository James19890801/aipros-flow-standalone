


function useGuide() {
    const guideBox = $(`
    <div class="guide-overlay" id="guide-overlay"></div>
    <div class="guide-box" id="guideBox" style="display: none;">
    <div class="guide-content">
        <div class="step-counter"></div>
        <div class="guide-text"></div>
        <div class="skip-btn">跳过</div>
        <div class="next-btn">下一步</div>
    </div>
</div>
    `)

    $('body').append(guideBox)

    const steps = [
        { title: "新建文件", dire: 'left', text: "点击新建按钮开始创建流程图、思维导图、思维笔记等空白云文件或本地桌面文件", top: 80, left: 232 },
        { title: "新建文件", dire: 'up', text: "点击页签可快捷创建流程图、思维导图、思维笔记等空白云文件或本地桌面文件", top: 14, left: pcUtil.isMac() ? 230 : 110 },
        { title: "最近", dire: 'up', text: "最近列表中新增了本地文件类型，该文件是您手动保存至桌面的文件", top: 214, left: 588 },
        { title: "最近", dire: 'up', text: "支持在离线场景下编辑已经打开过的云文件", top: 400, left: 500 },
        { title: "最近", dire: 'up', text: "当云文件数量充足时，您可将本地文件上传至云端进行协作编辑", top: 200, left: 400 },
    ];

    let currentStep = 0;

    // 初始化引导
    function showGuide(stepIndex) {
        // 完成?
        if (stepIndex == 4) {
            $('#guideBox .skip-btn').hide()
            $('#guideBox .next-btn').text('完成')
        }
        // 完成后？
        if (stepIndex >= steps.length) {
            $('#guideBox, #guide-overlay').fadeOut(); // 所有步骤完成后隐藏引导框和遮罩层
            var targetSpan = $('.file-list .col2 span').filter(function () {
                return $(this).text() === '本地文件';
            }).first();
            const uploadLi = $(targetSpan).parent().siblings('.col1').find('.menu li').eq(0)
            uploadLi.removeClass('menu_bg')
            let userId = window.localStorage.getItem("processon_userKey");
            localStorage.setItem('guideSkipped_' + userId, userId); // 记录跳过
            return;
        }

        const step = steps[stepIndex];
        $('.guide-text').text(step.text);
        $('.step-counter').html(`<strong>${step.title}</strong>（${stepIndex + 1} / ${steps.length}）`);
        if (step.dire == 'up') {
            $('.guide-box').addClass('up')
            $('.guide-box').removeClass('left');
        } else {
            $('.guide-box').addClass('left')
            $('.guide-box').removeClass('up');
        }
        if (stepIndex == 2) { // 找列表中第一个本地文件
            var targetSpan = $('.file-list .col2 span').filter(function () {
                return $(this).text() === '本地文件';
            }).first();
            const offset = targetSpan.offset()
            step.top = offset.top + 30
            step.left = offset.left
        }
        if (stepIndex == 3) { // 找列表中第一个云文件
            var targetSpan = $('.file-list .col2 span').filter(function () {
                return $(this).text() === '云文件';
            }).first();
            const offset = targetSpan.offset()
            step.top = offset.top + 30
            step.left = offset.left
        }
        if (stepIndex == 4) { // 找列表中第一个本地文件 打开列表
            var targetSpan = $('.file-list .col2 span').filter(function () {
                return $(this).text() === '本地文件';
            }).first();
            const moreDom = $(targetSpan).parent().siblings('.col1').find('.po-ops span.icons_web')
            $(moreDom).trigger('click');
            const uploadLi = $(targetSpan).parent().siblings('.col1').find('.menu li').eq(0)
            uploadLi.addClass('menu_bg')
            const offset = targetSpan.offset()
            step.top = offset.top + 60
            step.left = offset.left - 70
        }

        // 平滑移动到指定位置
        $('#guideBox').css({
            top: `${step.top}px`,
            left: `${step.left}px`
        }).fadeIn();

        $('#guide-overlay').fadeIn(); // 显示遮罩层
    }

    // 跳过引导
    $('.skip-btn').click(function () {
        $('#guideBox, #guide-overlay').fadeOut();
        let userId = window.localStorage.getItem("processon_userKey");
        localStorage.setItem('guideSkipped_' + userId, userId); // 记录跳过
    });

    // 下一步引导
    $('.next-btn').click(function () {
        currentStep++;
        showGuide(currentStep);
    });

    let userId = window.localStorage.getItem("processon_userKey");

    // 检查是否已跳过
    if (!localStorage.getItem('guideSkipped_' + userId)) {
        showGuide(currentStep); // 显示第一步引导
    }
}

export default useGuide