import UserOperation from '../../pc/db/user.js'
import { ipc1 } from '../ipc.js'

function exportWaitWm() {
  return $('.water_mark_bg').first()
}
function showExportWait() {
  const $wm = exportWaitWm()
  if (!$wm.length) return
  $wm.data('export-wait', 1)
  $wm.find('.w_m_export_tip').addClass('is-show')
  $wm.find('.w_m_start_out,.w_m_copy_image,.w_m_pdf_split').css('pointer-events', 'none')
}
function stopExportWait() {
  const $wm = exportWaitWm()
  $wm.removeData('export-wait')
  $wm.find('.w_m_export_tip').removeClass('is-show')
  $wm.find('.w_m_start_out,.w_m_copy_image,.w_m_pdf_split').css('pointer-events', '')
}
function closeExportDialogForSave() {
  const $wm = exportWaitWm()
  if (!$wm.data('export-wait')) return
  stopExportWait()
  if (window.downType) return
  $wm.hide()
  try { PoEditorClient.exportView.clearSvg() } catch (e) {}
}
window.poExportWait = { show: showExportWait, stop: stopExportWait, closeForSave: closeExportDialogForSave }
const exportInit = {
  init: () => {
    if (window.location.href.indexOf('outline/index.html') == -1) {
      if ($('.water_mark_bg').length > 1) {
        $('.water_mark_bg').slice(1).remove()
      }
      if ($('.water_mark_bg').length) {
        if ($('.water_perview .change_water_size').length && $('.designated_canvas_list').length && $('.w_m_f_set_up_canvas').length) return
        $('.water_mark_bg').remove()
      }
      const staticPath = (window.location.href.indexOf('/markdown-editor/index.html') > -1 || window.location.href.indexOf('/markdown-editor/view.html') > -1 ) ? './../' : './../../../../'
      const html = `
<div class="water_mark_bg">
    <div class="water_mark_alert">
        <span class="icons_c w_m_close">&#xe637;</span>
        <div class="water_m_title_d">
            <div class="water_m_title">下载预览</div>
        </div>
        <div class="water_content_detail">
            <div class="water_loading_board">
                <img src="${staticPath}assets/images/login/loading.gif" class="water_loading_loading">
            </div>
            <div class="water_perview"> 
                <div class="water_image_ontainer"></div>
                <div class="change_water_size">
                    <span class="icons_c icons_add" original-title="放大" title-pos="top">&#xe7fc;</span>
                    <span class="icons_c icons_min" original-title="缩小" title-pos="top">&#xe7fd;</span>
                    <span class="icons_c icons_all" original-title="实际大小" title-pos="top">&#xe9e9;</span>
                    <span class="icons_c icons_screen" original-title="适应屏幕" title-pos="top">&#xe9e8;</span>
                </div>
            </div>
            <div class="water_mark_choose_detail">
                <div class="water_mark_form">导出格式</div>
                <div class="w_m_f_type">
                    <span class="w_m_f_type_item" data-type="png" data-name="PNG">PNG<img class="w_m_type_arrow" src="${staticPath}assets/images/watermark/wm_type_choose.svg"></span>
                    <span class="w_m_f_type_item" data-type="jpg" data-name="JPG">JPG<img class="w_m_type_arrow" src="${staticPath}assets/images/watermark/wm_type_choose.svg"></span>
                    <span class="w_m_f_type_item" data-type="svg" data-name="SVG">SVG<img class="w_m_vip" src="${staticPath}assets/images/watermark/wm_vip.svg"><img class="w_m_type_arrow" src="${staticPath}assets/images/watermark/wm_type_choose.svg"></span>
                    <span class="w_m_f_type_item" data-type="pdf" data-name="PDF">PDF<img class="w_m_vip" src="${staticPath}assets/images/watermark/wm_vip.svg"><img class="w_m_type_arrow" src="${staticPath}assets/images/watermark/wm_type_choose.svg"></span>
                </div>
                <div class="w_m_f_set_up_hd">
                    <span class="w_m_margin_label">图片质量</span>
                    <div class="w_m_radio_item_png">
                        <input type="radio" class="radio-single" name="option1" value="1">
                        <span class="radio-circle"></span>
                        <span class="w_m_radio_item_text">高清<img class="w_m_vip" src="${staticPath}assets/images/watermark/wm_vip.svg"></span>
                    </div>
                    <div class="w_m_radio_item_png">
                        <input type="radio" class="radio-single" name="option1" value="2">
                        <span class="radio-circle"></span>
                        <span class="w_m_radio_item_text">普通</span>
                    </div>
                </div>
                <div class="water_mark_form wm_set_up wm_export_quality">导出范围<span class="water_m_image_wh"><span class="water_m_image_w"></span>*<span class="water_m_image_h"></span>px</span></div>
                <div class="water_mark_current_canvas">
                    <span class="current_text">当前画布</span>
                    <span class="icons_c icons_arrow">&#xe618;</span>
                    <div class="canvas_select">
                        <span class="canvas_item active" data-canvas="current">当前画布</span>
                        <span class="canvas_item" data-canvas="all">全部画布</span>
                        <span class="canvas_item designated_canvas" data-canvas="designated">指定的画布
                            <span class="icons_c icons_arrow_canvas">&#xe618;</span>
                        </span>
                        <div class="designated_canvas_list"></div>
                        <div class="divider"></div>
                        <span class="canvas_item" data-canvas="selected-part">当前选中图形</span>
                    </div>
                </div>
                <div class="wm_export_region_block">
                <div class="water_mark_form wm_set_up wm_margin_set_up_title">导出区域</div>
                <div class="w_m_f_set_up_canvas">
                    <div class="w_m_radio_canvas_item">
                        <input type="radio" class="radio-single" name="option_canvas" value="option_canvas_1">
                        <span class="radio-circle"></span>
                        <span class="w_m_radio_item_text">按内容实际大小</span>
                    </div>
                    <div class="w_m_radio_canvas_item">
                        <input type="radio" class="radio-single" name="option_canvas" value="option_canvas_2">
                        <span class="radio-circle"></span>
                        <span class="w_m_radio_item_text">按画布大小</span>
                    </div>
                </div>
                <div class="w_m_margin_set_up">
                    <div class="w_m_margin_item">
                        <span class="w_m_margin_label">页边距</span>
                        <div class="w_m_margin_input_group">
                            <span class="w_m_margin_dir">上下</span>
                            <div class="w_m_margin_input_wrap">
                                <input type="number" class="w_m_margin_input w_m_input_up_down" value="25" min="0" max="100">
                                <span class="w_m_margin_unit">px</span>
                                <div class="w_m_margin_spinner">
                                    <div class="w_m_margin_btn w_m_margin_up" data-type="updown_up">
                                        <span class="icons_c">&#xe618;</span>
                                    </div>
                                    <div class="w_m_margin_btn w_m_margin_down" data-type="updown_down">
                                        <span class="icons_c">&#xe618;</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="w_m_margin_input_group">
                            <span class="w_m_margin_dir">左右</span>
                            <div class="w_m_margin_input_wrap">
                                <input type="number" class="w_m_margin_input w_m_input_left_right" value="25" min="0" max="100">
                                <span class="w_m_margin_unit">px</span>
                                <div class="w_m_margin_spinner">
                                    <div class="w_m_margin_btn w_m_margin_up" data-type="leftright_up">
                                        <span class="icons_c">&#xe618;</span>
                                    </div>
                                    <div class="w_m_margin_btn w_m_margin_down" data-type="leftright_down">
                                        <span class="icons_c">&#xe618;</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
                <div class="water_mark_form wm_set_up wm_set_up_watermark_title">水印</div>
                <div class="w_m_f_set_up">
                    <div class="w_m_radio_item">
                        <input type="radio" class="radio-single" name="option" value="1">
                        <span class="radio-circle"></span>
                        <span class="w_m_radio_item_text">系统水印</span>
                    </div>
                    <span class="icons_c w_m_system_tip">&#xe6ad;
                        <span class="w_m_system_tip_text"></span>
                    </span>
                    <div class="w_m_radio_item">
                        <input type="radio" class="radio-single" name="option" value="2">
                        <span class="radio-circle"></span>
                        <span class="w_m_radio_item_text">无水印<img class="w_m_vip" src="${staticPath}assets/images/watermark/wm_vip.svg"></span>
                    </div>
                    <div class="w_m_radio_item">
                        <input type="radio" class="radio-single" name="option" value="3">
                        <span class="radio-circle"></span>
                        <span class="w_m_radio_item_text">自定义<img class="w_m_vip" src="${staticPath}assets/images/watermark/wm_vip.svg"></span>
                    </div>
                </div>
                <div class="w_m_custom custom_wm_detail">
                    <div class="w_m_text">
                        <input class="w_m_input w_m_input_custom" maxlength="15" placeholder="不超过15个字">
                        <div class="icons_c input_custom_close">&#xe948;</div>
                    </div>
                   <div class="w_m_c_title">水印样式：</div>
                    <div class="w_m_type_choose">
                        <div class="w_m_type_item w_m_type_item_active">
                            <span class="w_m_only_text">严禁复制</span>
                            <img class="w_m_type_arrow" src="${staticPath}assets/images/watermark/wm_type_choose.svg">
                        </div>
                        <div class="w_m_type_item">
                            <img class="w_m_type_item_image w_m_type_item_one" data-src="${staticPath}assets/images/watermark/wm_type_1_no_text_deep.svg" data-src-sh="${staticPath}assets/images/watermark/wm_type_1_no_text_shallow.svg" src="${staticPath}assets/images/watermark/wm_type_1.svg">
                            <img class="w_m_type_arrow" src="${staticPath}assets/images/watermark/wm_type_choose.svg">
                        </div>
                        <div class="w_m_type_item">
                            <img class="w_m_type_item_image w_m_type_item_two" data-src="${staticPath}assets/images/watermark/wm_type_2_no_text_deep.svg" data-src-sh="${staticPath}assets/images/watermark/wm_type_2_no_text_shallow.svg" src="${staticPath}assets/images/watermark/wm_type_2.svg">
                            <img class="w_m_type_arrow" src="${staticPath}assets/images/watermark/wm_type_choose.svg">
                        </div>
                        <div class="w_m_type_item">
                            <img class="w_m_type_item_image w_m_type_item_three" data-src="${staticPath}assets/images/watermark/wm_type_3_no_text_deep.svg" data-src-sh="${staticPath}assets/images/watermark/wm_type_3_no_text_shallow.svg" src="${staticPath}assets/images/watermark/wm_type_3.svg">
                            <img class="w_m_type_arrow" src="${staticPath}assets/images/watermark/wm_type_choose.svg">
                        </div>
                        <div class="w_m_type_item">
                            <img class="w_m_type_item_image w_m_type_item_four" data-src="${staticPath}assets/images/watermark/wm_type_4_no_text_deep.svg" data-src-sh="${staticPath}assets/images/watermark/wm_type_4_no_text_shallow.svg" src="${staticPath}assets/images/watermark/wm_type_4.svg">
                            <img class="w_m_type_arrow" src="${staticPath}assets/images/watermark/wm_type_choose.svg">
                        </div>
                        <div class="w_m_type_item">
                            <img class="w_m_type_item_image w_m_type_item_five" data-src="${staticPath}assets/images/watermark/wm_type_5_no_text_deep.svg" data-src-sh="${staticPath}assets/images/watermark/wm_type_5_no_text_shallow.svg" src="${staticPath}assets/images/watermark/wm_type_5.svg">
                            <img class="w_m_type_arrow" src="${staticPath}assets/images/watermark/wm_type_choose.svg">
                        </div>
                    </div>
                </div>
            </div>
            <div class="w_m_r_bottom">
                <div class="w_m_copy_image">复制图片</div>
                <div class="w_m_pdf_split">
                    <div class="w_m_pdf_split_main">导出 PDF</div>
                    <div class="w_m_pdf_split_arrow">
                        <span class="w_m_pdf_caret"></span>
                        <div class="w_m_pdf_split_menu">
                            <div class="w_m_pdf_split_item">分别导出多个 PDF</div>
                        </div>
                    </div>
                </div>
                <div class="w_m_start_out">导出图片</div>
            </div>
            <div class="w_m_export_tip"><span class="w_m_export_spin"></span>正在导出，请稍候</div>
        </div>
    </div>
</div>`
      $('body').append(html)
    }
  },

  //添加水印
  async waterMarkPoupe(sufix) {
    if ($('.water_mark_bg').length > 1) {
      $('.water_mark_bg').slice(1).remove()
    }
    const $wm = $('.water_mark_bg').first()
    $wm.find('.water_image_ontainer svg').remove()
    $('.water_mark_bg').hide()
    $wm.css('display', 'flex')
    $wm.find('.water_loading_board').show()
    stopExportWait()
    $wm.find('.w_m_close').off('click').on('click', function () {
      stopExportWait()
      $wm.hide()
      $wm.find('.water_image_ontainer').css('top', '0')
      $wm.find('.water_image_ontainer').css('left', '0')
      PoEditorClient.exportView.clearSvg()
      if (window.downType) {
        ipc.sendToHost('cancel')
      }
    })
    PoEditorInsert.resetWaterMarkPoupe()
    PoEditorInsert.getCanvasDefIds()
    if (window.fileType && (window.fileType.indexOf('mind') > -1 || window.fileType === 'markdown')) {
      $wm.find('.wm_export_region_block').hide()
    } else {
      $wm.find('.wm_export_region_block').show()
    }
    if (window.downType) {
      $wm.addClass('is-outer-down').css('background', '#fff')
      $wm.find('.water_mark_alert').css('box-shadow', 'none')
      $('html,body').css({ background: '#fff', margin: 0, overflow: 'hidden' })
      $wm.find('.w_m_close').hide()
      ipc.sendToHost('downDialogReady')
    }
    $wm.find('.w_m_f_set_up_hd .radio-single, .w_m_f_set_up .radio-single').prop('checked', false)
    let openType = sufix
    if (openType === 'pdfhd' || openType === 'pdfHD') openType = 'pdf'
    if (openType === 'pnghd' || openType === 'jpghd') openType = openType.replace('hd', '')
    const isHd = sufix == 'pnghd' || sufix == 'jpghd'
    PoEditorInsert.imageSufix = openType
    PoEditorInsert.zhugeImageName = openType.replace('hd', '')
    $wm.find('.w_m_f_type_item').removeClass('w_m_f_type_item_active')
    $wm.find('.w_m_f_type_item[data-type=' + openType + ']').addClass('w_m_f_type_item_active')
    if (openType === 'svg' || openType === 'pdf') {
      $wm.find('.w_m_f_set_up_hd').hide()
      PoEditorInsert.isVipImageType = true
      PoEditorInsert.zhugeImageType = '普通'
    } else if (isHd) {
      $wm.find('.w_m_f_set_up_hd').css('display', 'flex')
      PoEditorInsert.imageSufix = openType + 'hd'
      $wm.find('.w_m_f_set_up_hd .radio-single').eq(0).prop('checked', true)
      PoEditorInsert.zhugeImageType = '高清'
      PoEditorInsert.isVipImageType = true
    } else {
      $wm.find('.w_m_f_set_up_hd').css('display', 'flex')
      $wm.find('.w_m_f_set_up_hd .radio-single').eq(1).prop('checked', true)
      PoEditorInsert.zhugeImageType = '普通'
      PoEditorInsert.isVipImageType = false
    }
    if (window.isMember()) {
      $wm.find('.w_m_f_set_up .radio-single[value="2"]').prop('checked', true)
      $wm.find('.custom_wm_detail').hide()
      PoEditorInsert.zhugeWaterType = '无水印'
      PoEditorInsert.isWaterMarkVip = true
      setTimeout(() => {
        PoEditorInsert.addWaterMarkNow('', '', 'isInit')
      }, 0)
    } else {
      $wm.find('.w_m_f_set_up .radio-single[value="1"]').prop('checked', true)
      PoEditorInsert.zhugeWaterType = '系统水印'
      PoEditorInsert.isWaterMarkVip = false
      $wm.find('.custom_wm_detail').hide()
      setTimeout(() => {
        PoEditorInsert.addWaterMarkNow($wm.find('.w_m_system_tip_text').text(), '', 'isInit')
      }, 0)
    }
    $wm.find('.w_m_input_custom').val('严禁复制')
    var def = PoEditorClient.getDef();
    if(window.fileType == 'markdown'){
      def = await PoEditorClient.getDef();
    }
    var system_wm_text = "ProcessOn.com" //editorGlobalConfig.userObj.fullName;
    if (window.chartObj && window.chartObj.category.indexOf("mind") > -1 || window.fileType.indexOf("mind") > -1) {
      system_wm_text = system_wm_text + '免费思维导图';
      PoEditorInsert.zhugeChartType = "mindedit"
      if (def.showWatermark) {
        $wm.find('.w_m_input_custom').val(def.watermark)
      }
    } else {
      PoEditorInsert.zhugeChartType = "flowedit"
      system_wm_text = system_wm_text + '免费流程图';
      if (def.page && def.page.showWatermark) {
        $wm.find('.w_m_input_custom').val(def.page.watermark)
      }
    }
    $wm.find('.w_m_system_tip_text').text(system_wm_text)
    PoEditorInsert.syncExportButtonText()
    PoEditorInsert.syncCopyImageButton()
    PoEditorInsert.syncPdfSplitButton()
    var oldBgColor = PoEditorClient.getBackground();
    var viewBgColor = PoEditorInsert.getWaterMarkBgColor(oldBgColor);
    if (viewBgColor == "shallow") {
      PoEditorInsert.isWaterTextColor = '0,0,0,0.35';
      PoEditorInsert.isWaterImageDeep = false;
    } else if (viewBgColor == "deep") {
      PoEditorInsert.isWaterTextColor = '255,255,255,0.35';
      PoEditorInsert.isWaterImageDeep = true;
    }
    //高清or 普通
    $wm.find('.w_m_radio_item_png').off('click').on('click', function () {
      var ridioVal = $wm.find('.w_m_radio_item_png').index(this)
      $wm.find('.w_m_radio_item_png').eq(ridioVal).find('.radio-single').prop('checked', true)
      if (ridioVal === 0) {
        PoEditorInsert.isVipImageType = true;
        if (PoEditorInsert.imageSufix == 'png' || PoEditorInsert.imageSufix == 'jpg') {
          PoEditorInsert.imageSufix = PoEditorInsert.imageSufix + 'hd';
        }
        PoEditorInsert.zhugeImageType = "高清";
        PoEditorInsert.zhugeImageName = PoEditorInsert.imageSufix.replace('hd', '');
        PoEditorInsert.showImageWH(2);
      } else {
        PoEditorInsert.isVipImageType = false;
        if (PoEditorInsert.imageSufix == 'pnghd' || PoEditorInsert.imageSufix == 'jpghd') {
          PoEditorInsert.imageSufix = PoEditorInsert.imageSufix.replace('hd', '');
        }
        PoEditorInsert.zhugeImageType = "普通";
        PoEditorInsert.zhugeImageName = PoEditorInsert.imageSufix.replace('hd', '');
        PoEditorInsert.showImageWH(1);
      }
    })
    //水印类型切换
    $wm.find('.w_m_radio_item').off('click').on('click', function () {
      $(this).find('.radio-single').prop('checked', true)
      var ridioVal = $(this).find('.radio-single').val()
      if (ridioVal == '1') {
        PoEditorInsert.isWaterMarkVip = false
        $wm.find('.custom_wm_detail').hide()
        PoEditorInsert.zhugeWaterType = "系统水印";
        PoEditorInsert.addWaterMarkNow($wm.find('.w_m_system_tip_text').text(), '', 'isInit')
      } else if (ridioVal == '2') {
        PoEditorInsert.isWaterMarkVip = true
        PoEditorInsert.zhugeWaterType = '无水印'
        $wm.find('.custom_wm_detail').hide()
        PoEditorInsert.addWaterMarkNow('', '', 'isInit');
      } else if (ridioVal == '3') {
        PoEditorInsert.isWaterMarkVip = true
        PoEditorInsert.zhugeWaterType = '自定义水印'
        $wm.find('.custom_wm_detail').show()
        var waterImageUrl = PoEditorInsert.getWaterImageSvg();
        PoEditorInsert.addWaterMarkNow($wm.find('.w_m_input_custom').val(), waterImageUrl, 'isInit', 85, 54)
        $wm.find('.water_mark_choose_detail').animate({ scrollTop: $wm.find('.water_mark_choose_detail').prop('scrollHeight') }, 200)
      }
      var hdSingle = $wm.find('.w_m_f_set_up_hd .radio-single').eq(0).prop('checked')
      if (hdSingle) {
        if (PoEditorInsert.imageSufix == 'png' || PoEditorInsert.imageSufix == 'jpg') {
          PoEditorInsert.imageSufix = PoEditorInsert.imageSufix + 'hd';
        }
      }
    })
    //图片类型选择
    $wm.find('.w_m_f_type_item').off('click').on('click', function () {
      var imageType = $(this).attr('data-type')
      PoEditorInsert.imageSufix = imageType
      $wm.find('.w_m_f_type_item').removeClass('w_m_f_type_item_active')
      $(this).addClass('w_m_f_type_item_active')
      PoEditorInsert.zhugeImageName = imageType
      if (imageType === 'svg' || imageType === 'pdf') {
        $wm.find('.w_m_f_set_up_hd').hide()
        PoEditorInsert.isVipImageType = true
        if (imageType === 'pdf' && window.fileType === 'markdown') {
          $wm.find('.wm_set_up_watermark_title').hide()
          $wm.find('.w_m_f_set_up').hide()
        } else {
          $wm.find('.wm_set_up_watermark_title').show()
          $wm.find('.w_m_f_set_up').show()
        }
      } else {
        $wm.find('.w_m_f_set_up_hd').css('display', 'flex')
        $wm.find('.wm_set_up_watermark_title').show()
        $wm.find('.w_m_f_set_up').show()
        const hdSingle = $wm.find('.w_m_f_set_up_hd .radio-single').eq(0).prop('checked')
        PoEditorInsert.isVipImageType = !!hdSingle
        if (hdSingle && (imageType === 'png' || imageType === 'jpg')) {
          PoEditorInsert.imageSufix = imageType + 'hd'
        }
      }
      PoEditorInsert.syncExportButtonText()
      PoEditorInsert.syncCopyImageButton()
      PoEditorInsert.syncPdfSplitButton()
    })
    $wm.find('.w_m_copy_image').off('click').on('click', function () {
      const exportType = PoEditorInsert.imageType(PoEditorInsert.imageSufix)
      if (exportType !== 'png' && exportType !== 'jpg') return
        const runCopy = () => {
        const params = PoEditorInsert.getImageParams()
        if (!params) {
          new Toast({ type: 'error', msg: '图片复制失败' }, $('.water_mark_bg'))
          return
        }
        let imageScale = PoEditorInsert.imageSufix == 'pnghd' || PoEditorInsert.imageSufix == 'jpghd' ? 2 : 1
        PoEditorClient.exportView.svgToImage(params, imageScale, PoEditorInsert.imageSufix).then(res => {
          if (!(res && res.status === 'success' && res.img)) {
            new Toast({ type: 'error', msg: '图片复制失败' }, $('.water_mark_bg'))
            return
          }
          if (window.downType) {
            ipc.sendToHost('copyDownImage', res.img)
            return
          }
          const copyIpc = (window.electron && window.electron.ipcRenderer) || ipc
          copyIpc.invoke('cliCopyImage', res.img).then((ok) => {
            new Toast({ type: ok ? 'success' : 'error', msg: ok ? '图片复制成功' : '图片复制失败' })
          }).catch(() => {
            new Toast({ type: 'error', msg: '图片复制失败' })
          })
        }).catch(() => {
          new Toast({ type: 'error', msg: '图片复制失败' }, $('.water_mark_bg'))
        })
      }
      if (PoEditorInsert.isWaterMarkVip || PoEditorInsert.isVipImageType) {
        UserOperation.getUserPrivilege(false, (user = {}) => {
          const { member, orgMember } = user
          if (!member && !orgMember) {
            ipc.sendToHost('showDlgPayWebView1', { pay_position: 'Down-Image', title: '升级会员解锁全部下载格式' })
            return
          }
          runCopy()
        })
      } else {
        runCopy()
      }
    })
    //导出
    $wm.find('.w_m_start_out').off('click').on('click', function () {
      const baseType = String(PoEditorInsert.imageSufix || '').replace(/hd$/i, '')
      if (baseType === 'svg') {
        const paramsList = PoEditorInsert.imageSvgs || []
        if (!paramsList.length) return
        const runSvg = () => {
          showExportWait()
          setTimeout(function () {
            PoEditorInsert.exportSvgFromPreview(paramsList, (window.chartObj && window.chartObj.title) || window.saveName || 'export').then((ok) => {
              if (!ok) stopExportWait()
              if (ok && window.downType) ipc.sendToHost('downed')
            })
          }, 0)
        }
        if (PoEditorInsert.isWaterMarkVip || PoEditorInsert.isVipImageType) {
          UserOperation.getUserPrivilege(false, (user = {}) => {
            const { member, orgMember } = user
            if (!member && !orgMember) {
              ipc.sendToHost('showDlgPayWebView1', { pay_position: 'Down-SVG', title: '升级会员解锁全部下载格式' })
              return
            }
            runSvg()
          })
        } else {
          runSvg()
        }
        return
      }
      if (baseType === 'pdf') {
        const paramsList = PoEditorInsert.getImageParamsList()
        if (!paramsList.length) return
        const asZip = $(this).data('pdfAsZip') === true
        $(this).removeData('pdfAsZip')
        const runPdf = () => {
          showExportWait()
          setTimeout(function () {
            PoEditorInsert.exportMultiCanvasPdf(paramsList, (window.chartObj && window.chartObj.title) || 'export', { asZip }).then((ok) => {
              if (!ok) stopExportWait()
              if (ok && window.downType) ipc.sendToHost('downed')
            })
          }, 0)
        }
        if (PoEditorInsert.isWaterMarkVip || PoEditorInsert.isVipImageType) {
          UserOperation.getUserPrivilege(false, (user = {}) => {
            const { member, orgMember } = user
            if (!member && !orgMember) {
              ipc.sendToHost('showDlgPayWebView1', { pay_position: 'Down-PDF', title: '升级会员解锁全部下载格式' })
              return
            }
            runPdf()
          })
        } else {
          runPdf()
        }
        return
      }

      const paramsList = PoEditorInsert.getImageParamsList()
      if (!paramsList.length) return
      const isMulti = paramsList.length > 1
      const doExportSingle = (params) => {
      var imageScale = params.scale || 1;
      if (PoEditorInsert.isWaterMarkVip || PoEditorInsert.isVipImageType) {
        UserOperation.getUserPrivilege(
          false,
          (user = {}) => {
            const { member, orgMember } = user
            if (!member && !orgMember) {
              var downStr = "下载"
              if (PoEditorInsert.downComeFrom == 'diagrams') {
                PoEditorInsert.zhugeChartType = 'diagrams'
              }
              else if (PoEditorInsert.downComeFrom == 'download_part') {
                downStr = "部分下载"
              }
              const imageTypePoint = PoEditorInsert.zhugeImageType == '普通' ? '' : '_hd'
              const waterTypePoint = PoEditorInsert.zhugeWaterType == '系统水印' ? '_default' : PoEditorInsert.zhugeWaterType == '无水印' ? '_nomark' : '_custommark'
              var pay_position = `Down-Image-${PoEditorInsert.imageSufix == 'jpghd' ? 'jpg' : 'jpg'}${imageTypePoint}${waterTypePoint}`
              if(PoEditorInsert.zhugeImageType == '高清'){
                window.poCollect('展示支付弹窗',{'触发位置':'导出高清图片'})
              }else if(PoEditorInsert.zhugeWaterType== '无水印'){
                window.poCollect('展示支付弹窗',{'触发位置':'导出无水印图片'})
              }else if(PoEditorInsert.zhugeWaterType== '自定义水印'){
                window.poCollect('展示支付弹窗',{'触发位置':'导出自定义水印图片'})
              }
              ipc.sendToHost('showDlgPayWebView1', { pay_position, title: '升级会员解锁全部下载格式' })
              return
            } else {
              if (window.downType) {
                ipc.sendToHost('down')
              }
              PoEditorClient.exportView.svgToImage(params, imageScale, PoEditorInsert.imageSufix).then(res => {
                if (res.status == "success") {
                  ipc1.sendSync('saveFileB64', { type: 'save', path: window.saveName, data: res.img.split(',')[1], suffix: PoEditorInsert.imageSufix.replace('hd', '') }).then((res1) => {
                    if (res1 != '') {
                      new Toast({ type: 'success', msg: '保存成功' })
                      if(window.downType){
                        ipc.sendToHost('downed')
                      }
                    }
                    else {
                      if(window.downType){
                        ipc.sendToHost('cancel')
                      }
                    }
                  })
                }
                else {
                  if (window.downType) {
                    ipc.sendToHost('cancel')
                  }
                }
              })
            }
          });
      } else {
        PoEditorClient.exportView.svgToImage(params, imageScale, PoEditorInsert.imageSufix).then(res => {
          if (res.status == "success") {
            if (!res.img) {
              new Toast({ type: 'error', msg: '有不授信图片无法下载，建议导出SVG格式' })
              return
            }
            ipc1.sendSync('saveFileB64', { type: 'save', path: window.saveName, data: res.img.split(',')[1], suffix: PoEditorInsert.imageSufix.replace('hd', '') }).then((res1) => {
              if (res1 != '') {
                new Toast({ type: 'success', msg: '保存成功' })
              }
            })
          }

        })
      }
      }
      if (isMulti) {
        PoEditorInsert.exportImagesAsZip(paramsList, (window.chartObj && window.chartObj.title) || 'export').then((blob) => {
          if (!blob) {
            new Toast({ type: 'error', msg: '导出失败' })
            return
          }
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = ((window.chartObj && window.chartObj.title) || 'export') + '.zip'
          a.click()
          URL.revokeObjectURL(url)
          if (window.downType) ipc.sendToHost('downed')
        })
        return
      }
      doExportSingle(paramsList[0])
    })
    $wm.find('.w_m_pdf_split_main').off('click').on('click', function () {
      $wm.find('.w_m_pdf_split_arrow').removeClass('is-open')
      $wm.find('.w_m_pdf_split_menu').removeClass('is-open')
      $wm.find('.w_m_start_out').trigger('click')
    })
    $wm.find('.w_m_pdf_split_item').off('click').on('click', function (e) {
      e.stopPropagation()
      $wm.find('.w_m_pdf_split_arrow').removeClass('is-open')
      $wm.find('.w_m_pdf_split_menu').removeClass('is-open')
      $wm.find('.w_m_start_out').data('pdfAsZip', true).trigger('click')
    })
    $wm.find('.w_m_pdf_split_arrow').off('click').on('click', function (e) {
      if ($(e.target).closest('.w_m_pdf_split_item').length) return
      e.stopPropagation()
      $(this).toggleClass('is-open')
      $(this).children('.w_m_pdf_split_menu').toggleClass('is-open', $(this).hasClass('is-open'))
    })
    $wm.off('click.wmPdfSplitBg').on('click.wmPdfSplitBg', function (e) {
      if (!$(e.target).closest('.w_m_pdf_split_arrow').length) {
        $wm.find('.w_m_pdf_split_arrow').removeClass('is-open')
        $wm.find('.w_m_pdf_split_menu').removeClass('is-open')
      }
    })
    $wm.find('.input_custom_close').off('mousedown').on('mousedown', function (e) {
      $wm.find('.w_m_input_custom').val('')
    })
    $wm.find('.w_m_input_custom').on('focus', function () {
      $wm.find('.input_custom_close').show()
    })

    $wm.find('.w_m_input_custom').on('blur', function (event) {
      $wm.find('.input_custom_close').hide()
      var waterImageUrl = PoEditorInsert.getWaterImageSvg()
      PoEditorInsert.addWaterMarkNow($wm.find('.w_m_input_custom').val(), waterImageUrl, 'isInit', 85, 54)
    })

    $wm.find('.w_m_type_item').off('click').on('click', function () {
      $wm.find('.w_m_type_item').removeClass('w_m_type_item_active')
      $wm.find('.w_m_type_item .w_m_type_arrow').hide()
      $(this).addClass('w_m_type_item_active')
      $(this).find('.w_m_type_arrow').show()
      var waterImageUrl = PoEditorInsert.getWaterImageSvg()
      var wmText = $wm.find('.w_m_input_custom').val()
      if (!wmText) {
        wmText = "严禁复制"
      }
      PoEditorInsert.addWaterMarkNow(wmText, waterImageUrl, 'isInit', 85, 54);
    })
    //放大图
    $wm.find('.icons_add').off('click').on('click', function () {
      PoEditorInsert.scale += PoEditorInsert.scaleFactor;
      PoEditorInsert.zoom();
    })
    //缩小图
    $wm.find('.icons_min').off('click').on('click', function () {
      PoEditorInsert.scale -= PoEditorInsert.scaleFactor;
      if (PoEditorInsert.scale < 0.2) {
        PoEditorInsert.scale = 0.2;
      }
      PoEditorInsert.zoom();
    })
    //1:1
    $wm.find('.icons_all').off('click').on('click', function () {
      PoEditorInsert.scale = 1
      PoEditorInsert.zoomAll()
      $wm.find('.icons_all').hide()
      $wm.find('.icons_screen').css('display', 'flex')
    })
    $wm.find('.icons_screen').off('click').on('click', function () {
      PoEditorInsert.scale = 1
      PoEditorInsert.zoomAll()
      PoEditorInsert.resizeSvg($wm.find('.water_perview'))
      $wm.find('.icons_all').css('display', 'flex')
      $wm.find('.icons_screen').hide()
    })
    var $imgContainer = $wm.find('.water_perview')
    var $image = $wm.find('.water_perview .water_image_ontainer')
    $imgContainer.on('wheel', function (e) {
      e.preventDefault();
      const delta = e.originalEvent.deltaY;
      if (delta > 0) {
        PoEditorInsert.scale -= PoEditorInsert.scaleFactor;
        if (PoEditorInsert.scale < PoEditorInsert.scaleFactor) PoEditorInsert.scale = PoEditorInsert.scaleFactor;
      } else {
        PoEditorInsert.scale += PoEditorInsert.scaleFactor;
      }
      PoEditorInsert.zoom();
    });

    $image.on('mousedown', function (e) {
      PoEditorInsert.longPressTimer = setTimeout(function () {
        PoEditorInsert.isDragging = true;
        PoEditorInsert.startX = e.pageX;
        PoEditorInsert.startY = e.pageY;
        PoEditorInsert.imgStartX = parseFloat($image.css('left'));
        PoEditorInsert.imgStartY = parseFloat($image.css('top'));
        $imgContainer.css('cursor', 'grabbing');
      }, 100);  // 长按时间为500毫秒
    });

    $image.on('mousemove', function (e) {
      if (!PoEditorInsert.isDragging) return;
      e.preventDefault();
      const dx = e.pageX - PoEditorInsert.startX;
      const dy = e.pageY - PoEditorInsert.startY;
      $image.css({
        left: PoEditorInsert.imgStartX + dx,
        top: PoEditorInsert.imgStartY + dy
      });
    });

    $imgContainer.on('mouseup mouseleave', function () {
      clearTimeout(PoEditorInsert.longPressTimer);
      if (PoEditorInsert.isDragging) {
        PoEditorInsert.isDragging = false;
        $imgContainer.css('cursor', 'grab');
      }
    });
    PoEditorInsert.bindWaterMarkCanvasSelect($wm)
    PoEditorInsert.bindWaterMarkExportRegion($wm)
  },
}
export default exportInit