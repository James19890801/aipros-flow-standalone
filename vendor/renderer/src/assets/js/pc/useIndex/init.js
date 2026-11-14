
import { tabGroup, homeTabId, isMac } from './utils'
import { checkScrollableTabs } from './tab.js'
import ServerUtil from '../server/server.js'
import Setting from '../db/setting.js'
import { Alert, Toast, Updata } from '../class.js'
import HtmlStr from '../htmlStr.js'
import Notification from "../notification/notification.js";
const CONFIG = ipc.sendSync('getGlobal', 'CONFIG')

// 窗口关闭事件
function closeBrowser() {
  localStorage.setItem('isAllClose', '1')
  let flag = true
  const tabArr = JSON.parse(sessionStorage.getItem('tabArr') || '[]')
  tabGroup.getTabs().reverse().forEach((tab) => {
    const arr = tabArr.find(d => d.id == tab.id)
    if (arr) {
      if (arr.isMyFile) {
        tab.close()
        flag = false
      }
      else {
        tab.close()
      }
    }
    else if (tab.id != 0) {
      tab.close()
    }
  })
  return flag
}

function finishUpdateRestart() {
  localStorage.removeItem('pendingUpdateRestart')
  localStorage.setItem('isAllClose', '0')
  Setting.updateSetting({ awaitRestart: false }, () => ipc.send('restarApp'))
}

function restartForUpdate() {
  if (closeBrowser()) finishUpdateRestart()
  else {
    localStorage.setItem('pendingUpdateRestart', '1')
    new Toast({ type: 'main', msg: '请先保存并关闭未保存的文件' })
  }
}

window.__poRestartForUpdate = restartForUpdate
window.__poFinishUpdateRestart = finishUpdateRestart

function showSetting() {
  Setting.getSetting(false, (setting) => {
    const alertClass = new Alert({ content: HtmlStr['setAlert'], title: '设置' })
    const $alert = alertClass.$alertBox
    console.log("show Setting---", setting)
    // 托盘
    if (pcUtil.isWin()) {
      $alert.find('input#set_tray_start').attr('checked', setting.basic.includes('trayOpen'))
    }
    // 自动启动
    if (setting.basic.indexOf('auto_start') > -1)
      $alert.find('input#set_auto_start').attr('checked', true)
    else $alert.find('input#set_auto_start').attr('checked', false)
    // 自动更新
    if (setting.basic.indexOf('auto_update') > -1)
      $alert.find('input#set_auto_update').attr('checked', true)
    else $alert.find('input#set_auto_update').attr('checked', false)
    // 随系统自动切换
    if (setting.aspect == 'follow_system') {
      $alert.find('input#set_follow_system').attr('checked', true)
      $alert.find('.aspect').addClass('disabled')
    } else {
      $alert.find('input#set_follow_system').attr('checked', false)
      $alert.find('.aspect.disabled').removeClass('disabled')

      if (setting.aspect == 'light_color')
        $alert.find('input#set_light_color').attr('checked', true)
      else $alert.find('input#set_light_color').attr('checked', false)
      if (setting.aspect == 'dark_color') $alert.find('input#set_dark_color').attr('checked', true)
      else $alert.find('input#set_dark_color').attr('checked', false)

      // 深色功能暂时禁用
      $alert.find('#set_dark_color').parents('.aspect').addClass('disabled')
      $alert.find('input#set_dark_color').attr('disabled', true)
    }
    // 语言
    $alert.find('[name=language]').val(setting.language)
    // 日期格式
    $alert.find('[name=date_format]').val(setting.date_format)
    // 文件输出
    $alert
      .find('[name=file_output]')
      .attr('title', setting.file_output)
      .val(setting.file_output.replace('undefined', ''))
    // 当前版本
    $alert.find('.versions span').text(ipc.sendSync('getGlobal', 'versions'))
    // 是否已下载，等待重启
    if (setting.awaitRestart) {
      $alert.find('.software_item[data-t=version_updating] .button.checkUpdate').addClass('hide')
      $alert
        .find('.software_item[data-t=version_updating] .button.awaitRestart')
        .removeClass('hide')
    } else {
      $alert.find('.software_item[data-t=version_updating] .button.checkUpdate').removeClass('hide')
      $alert.find('.software_item[data-t=version_updating] .button.awaitRestart').addClass('hide')
    }

    // 修改基本设置
    $alert
      .find('[name=basic]')
      .off()
      .on('change', function (e, a) {
        if (e.target.id == 'set_auto_upload') {
          if (e.target.checked) {
            localStorage.setItem('auto_upload', '1')
          }
          else {
            localStorage.setItem('auto_upload', '0')
          }
        }
        else {
          const basic = []
          $.each($alert.find('[name=basic]:checked'), function () {
            basic.push($(this).val())
          })

          if (basic.indexOf('auto_start') > -1) ipc.send('auto_start')
          else ipc.send('un_auto_start')

          //重新设置是否有托盘
          if (pcUtil.isWin()) {
            ipc.send('changeTray', !!basic.indexOf('trayOpen') > -1)
          }
          const obj = e.target.id == 'set_tray_start' ? { ...setting, basic, trayOpenSeted: true } : { ...setting, basic }
          console.log("change Setting---", obj)
          Setting.updateSetting(obj)
        }
      })
    // 修改外观
    $alert
      .find('[name=aspect_follow_system]')
      .off()
      .on('change', function (e) {
        const aspect = $alert.find('[name=aspect_follow_system]:checked').val()
        Setting.updateSetting({ ...setting, aspect })
      })
    $alert
      .find('[name=aspect]')
      .off()
      .on('change', function (e) {
        const aspect = $alert.find('[name=aspect]:checked').val()
        Setting.updateSetting({ aspect })
      })
    // 修改语言
    $alert
      .find('[name=language]')
      .off()
      .on('change', function (e) {
        const language = $alert.find('[name=language]').val()
        Setting.updateSetting({ language })
      })
    // 修改日期格式
    $alert
      .find('[name=date_format]')
      .off()
      .on('change', function (e) {
        const date_format = $alert.find('[name=date_format]').val()
        Setting.updateSetting({ date_format })
      })
    // 修改文件输出
    $alert
      .find('[name=file_output]')
      .off()
      .on('mousedown', (e) => {
        e.cancelable && e.preventDefault()
        ipc.send('file_output', $alert.find('[name=file_output]').val())
      })
    // 查看文件输出
    $alert
      .find('[data-t=file_output] .button')
      .off()
      .on('click', () => ipc.send('file_output_readonly', $alert.find('[name=file_output]').val()))
    // 收到选择文件夹后的回调
    // file_output_callback = (filePaths) => {
    //   const file_output = filePaths[0]

    //   $alert.find('[name=file_output]').attr('title', file_output).val(file_output)
    //   Setting.updateSetting({ file_output })
    // }
    // 检查更新
    $alert
      .find('[data-t=version_updating] .button.checkUpdate')
      .off()
      .on('click', function () {
        checkUpdate($alert)
      })
    // 重启
    $alert
      .find('[data-t=version_updating] .button.awaitRestart')
      .off()
      .on('click', function () {
        restartForUpdate()
      })
    // 清除缓存
    $alert
      .find('#btnClearCache')
      .off()
      .on('click', function () {
        ipc.once('clearCache_callback', () => {
          $('#cacheSize').html('0B')
          $('#btnClearCache').html('清除缓存').removeAttr('style')
          new Toast({ msg: '清理成功', type: 'success' })
        })
        ipc.send('clearCache', { type: 1 })
        $('#btnClearCache').html('清理中..').attr('style', 'pointer-events: none')
      })
    $alert
      .find('.check_auto_upload_svg')
      .off()
      .on('mouseover', (e) => {
        $('.auto_upload_hoverArea').attr('style', 'display: block')
      })
      .on('mouseout', (e) => {
        $('.auto_upload_hoverArea').removeAttr('style')
      })
    $alert
      .find('.clear_cache_svg')
      .off()
      .on('mouseover', (e) => {
        $('.clear_cache_hoverArea').attr('style', 'display: block')
      })
      .on('mouseout', (e) => {
        $('.clear_cache_hoverArea').removeAttr('style')
      })
    const auto_upload = localStorage.getItem('auto_upload')
    if (auto_upload && auto_upload == '1') {
      $alert.find('input#set_auto_upload').attr('checked', true)
    }

    ipc.send('calcClearCache', { type: 1 })
    $('#btnClearCache').html('计算中..').attr('style', 'pointer-events: none')

    alertClass.open()


    // 代理
    const ProxyController = {
      // 初始化方法
      init: function (config) {
        this.cacheElements();
        this.bindEvents();
        this.update(config || {
          type: 'none',
          host: '',
          port: '',
          username: '',
          password: ''
        });
      },

      // 缓存DOM元素
      cacheElements: function () {
        this.$proxySelector = $('#proxySelector');
        this.$proxyConfigForm = $('#proxyConfigForm');
        this.$otherForm = $('#otherForm');
        this.$proxyAddress = $('#proxyAddress');
        this.$proxyPort = $('#proxyPort');
        this.$proxyUser = $('#proxyUser');
        this.$proxyPass = $('#proxyPass');
        this.$testBtn = $('#testProxyBtn');
        this.$saveProxyBtn = $('#saveProxyBtn');
        this.$saveProxyBtn1 = $('#saveProxyBtn1');
      },

      // 绑定事件
      bindEvents: function () {
        const self = this;
        this.$proxySelector.on('change', function () {
          self.updateFieldsState();
        });

        this.$testBtn.on('click', function () {
          self.testConnection();
        });

        this.$saveProxyBtn.on('click', function () {
          self.saveConnection();
        });

        this.$saveProxyBtn1.on('click', function () {
          self.saveConnection();
        });
      },

      // 更新整个控件状态
      update: function (config) {
        this.$proxySelector.val(config.type);

        if (config.type === 'http') {
          this.$proxyAddress.val(config.host || '');
          this.$proxyPort.val(config.port || '');
          this.$proxyUser.val(config.username || '');
          this.$proxyPass.val(config.password || '');
        }

        this.updateFieldsState();
      },

      // 获取当前配置
      getConfig: function () {
        return {
          type: this.$proxySelector.val(),
          host: this.$proxyAddress.val(),
          port: this.$proxyPort.val(),
          username: this.$proxyUser.val(),
          password: this.$proxyPass.val()
        };
      },

      // 更新字段状态
      updateFieldsState: function () {
        const value = this.$proxySelector.val()
        const isHttpProxy = value === 'http';
        if (isHttpProxy) {
          this.$proxyConfigForm.show();
          this.$otherForm.hide()
        } else {
          this.$proxyConfigForm.hide();
          this.$otherForm.show()
          // ipc.send('setProxy', value)
        }
      },
      // 测试连接
      testConnection: function () {
        const config = this.getConfig();

        if (!config.host || !config.port) {
          alert('请输入代理地址和端口');
          return;
        }
        new Toast({ type: 'info', msg: '测试连接中' })
        ipc.invoke('testProxy', config).then((res) => {
          console.log(res)
          if (res.success) {
            new Toast({ type: 'success', msg: '测试代理设置成功' })
          }
          else {
            new Toast({ type: 'error', msg: '测试代理设置失败' })
          }
        })

      },
      // 保存连接
      saveConnection: function () {
        const config = this.getConfig();
        localStorage.setItem('proxyData', JSON.stringify(config))
        ipc.invoke('saveProxy', config).then((res) => {
          console.log(res)
          if (res.success) {
            new Toast({ type: 'success', msg: '代理设置成功' })
          }
          else {
            new Toast({ type: 'error', msg: '代理设置失败' })
          }
        })
      }
    };

    let savedConfig = {
      type: 'none', // 'none' | 'browser' | 'http'
      host: '',
      port: '',
      username: '',
      password: ''
    };
    let ConnectionData = localStorage.getItem('proxyData')
    if (!ConnectionData) {
      ConnectionData = savedConfig
    }
    else {
      ConnectionData = JSON.parse(ConnectionData)
    }
    ProxyController.init(ConnectionData);
  })
}

function openAiPointAccountDetail() {
  ipc.invoke('open-childWindow', { section: 'orderInfo', tab: '4' })
}

function ensureAiPointPopupRuntime() {
  const host = ipc.sendSync('getGlobal', 'host')
  if (!window.__aiPointPayShim) {
    window.__aiPointPayShim = true
    const openPay = function (title, opts = {}) {
      const aiPay = !!(opts.ai_pay || opts.ai_pay_only || opts.ai_pay_times)
      if (window.tabGroupExtend && typeof window.tabGroupExtend.showDlgPayWebView === 'function') {
        window.tabGroupExtend.showDlgPayWebView({
          title: title || '升级会员',
          pay_position: opts.pointPosition || opts.pointSource || opts.pointsSource || 'AI点数menu',
          pointssource: opts.pointPosition || opts.pointSource || opts.pointSourceNew || 'AI点数menu',
          aiPay
        })
      }
    }
    window.VueRoot = window.VueRoot || {}
    window.VueRoot.$openPay = openPay
    window.insert = window.insert || {}
    window.insert.pay = window.insert.pay || {}
    window.insert.pay.init = function (opts = {}) {
      openPay(opts.title || '升级会员', opts)
    }
  }
  if (!$.toast) {
    $.toast = function (opt) {
      const msg = (opt && (opt.text || opt.msg)) || ''
      const type = (opt && opt.type) || 'error'
      try {
        new Toast({ msg, type })
      } catch (e) { }
    }
  }
  if (!window.__aiPointAjaxPatched) {
    window.__aiPointAjaxPatched = true
    const rawAjax = $.ajax
    $.ajax = function (opts) {
      if (opts && typeof opts.url === 'string' && opts.url.indexOf('http') < 0) {
        const isAiPopupApi = opts.url.indexOf('/api/personal/user/privilege') >= 0
          || opts.url.indexOf('/api/personal/ai/point/get/balance') >= 0
        if (isAiPopupApi) {
          opts.url = host + opts.url
          const token = window.localStorage.getItem('processon_token') || ''
          opts.headers = Object.assign({}, opts.headers || {}, { token })
        }
      }
      return rawAjax.apply(this, arguments)
    }
  }
  if (!window.__aiPointPopupClickPatched) {
    window.__aiPointPopupClickPatched = true
    $('body').on('click.aiPointOffline', '.ai-point-link', function (e) {
      const text = ($(this).text() || '').trim()
      if (text.includes('查看更多')) {
        e.stopImmediatePropagation()
        e.preventDefault()
        $('.float-popup').hide()
        $('.shade_user_box').hide()
        window.hideAiPointPopup && window.hideAiPointPopup()
        openAiPointAccountDetail()
        return false
      }
      if (text.includes('获取更多')) {
        e.stopImmediatePropagation()
        e.preventDefault()
        $('.float-popup').hide()
        $('.shade_user_box').hide()
        window.hideAiPointPopup && window.hideAiPointPopup()
        window.VueRoot.$openPay('升级畅享全部会员权益', {
          pointSource: 'AI点数menu',
          pointPosition: 'AI点数menu'
        })
        return false
      }
    })
    $('body').on('click.aiPointOffline', '.float-popup .purple-link:not(.disabled)', function (e) {
      e.stopImmediatePropagation()
      e.preventDefault()
      $('.float-popup').hide()
      $('.shade_user_box').hide()
      window.hideAiPointPopup && window.hideAiPointPopup()
      window.VueRoot.$openPay('升级畅享全部会员权益', {
        ai_pay: true,
        pointSource: 'AI点数menu',
        pointPosition: 'AI点数menu'
      })
      return false
    })
  }
}

function fixAiPointPopupAssets() {
  $('.float-popup .ai-point-close').each(function () {
    $(this).attr({
      src: './src/assets/images/aiPoint/close.svg',
      anewed: '1'
    })
  })
}

function wrapAiPointShowPopup() {
  if (typeof window.getAiPointShowPopup !== 'function' || window.getAiPointShowPopup.__offlineWrapped) return
  if (typeof window.createFloatPopup === 'function' && !window.createFloatPopup.__offlineWrapped) {
    const origCreate = window.createFloatPopup
    window.createFloatPopup = function (targetEl, direction, html) {
      if (typeof html === 'string') {
        html = html.replace(
          /src=(["'])\/assets\/images\/aiPoint\/close\.svg\1/g,
          'src=$1./src/assets/images/aiPoint/close.svg$1 anewed="1"'
        )
      }
      return origCreate(targetEl, direction, html)
    }
    window.createFloatPopup.__offlineWrapped = true
  }
  const orig = window.getAiPointShowPopup
  window.getAiPointShowPopup = function (el, dir) {
    const ret = orig(el, dir)
    let n = 0
    const timer = setInterval(function () {
      n++
      if ($('.float-popup:visible .ai-point-close').length || n > 40) {
        fixAiPointPopupAssets()
        clearInterval(timer)
      }
    }, 50)
    return ret
  }
  window.getAiPointShowPopup.__offlineWrapped = true
}

function showAiPointPopupOnHover(type, e) {
  if (!e || !e.currentTarget) return
  const $self = $(e.currentTarget)
  if (type) {
    const preTimer = $self.data('aiPopupTimer')
    if (preTimer) clearTimeout(preTimer)
    ensureAiPointPopupRuntime()
    const host = ipc.sendSync('getGlobal', 'host')
    const runShow = function () {
      wrapAiPointShowPopup()
      if (typeof getAiPointShowPopup === 'function') {
        getAiPointShowPopup($self, 'left')
      }
    }
    if (typeof getAiPointShowPopup !== 'function') {
      const jsUrl = host + '/assets/js/ai-point-detail-popup.js'
      const cssUrl = host + '/assets/css/ai-point-detail-popup.css'
      if (!document.querySelector('link[href*="ai-point-detail-popup.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = cssUrl
        document.head.appendChild(link)
      }
      if ($self.data('aiScriptLoading')) return
      $self.data('aiScriptLoading', true)
      const script = document.createElement('script')
      script.src = jsUrl
      script.onload = function () {
        $self.data('aiScriptLoading', false)
        if (typeof getAiPointShowPopup === 'function') {
          runShow()
        }
      }
      script.onerror = function () {
        $self.data('aiScriptLoading', false)
      }
      document.body.appendChild(script)
    } else {
      runShow()
    }
  } else {
    const timer = setTimeout(function () {
      window.hideAiPointPopup && window.hideAiPointPopup()
    }, 300)
    $self.data('aiPopupTimer', timer)
  }
}

// dom事件
function bindEvent() {
  // 头像点击
  $(document).off("click").on("click", () => {
    if ($('.shade_user_box').is(":visible")) {
      $('.shade_user_box').hide()
    }
  });

  $('.user-logo-img').off().on('click', function (e) {
    e.stopPropagation()
    $('.shade_user_box').show()
    Notification.hideMenu()
  });

  $(".icon_btn.msg").off().on("click", function (e) {
    // e.stopPropagation();
    var obj = $(this);
    Notification.renderCon(obj);
    $('.shade_user_box').hide();
  });

  ensureAiPointPopupRuntime()
  $('body').off('mouseenter.aiPointPopup').on('mouseenter.aiPointPopup', '.float-popup', function () {
    clearTimeout($('.ai-point-detail-popup').data('aiPopupTimer'))
  })
  $(document).off('mousedown.aiPointPopupHide').on('mousedown.aiPointPopupHide', function (e) {
    if (!window.hideAiPointPopup) return
    if (!$('.float-popup').is(':visible')) return
    if ($(e.target).closest('.float-popup').length > 0) return
    if ($(e.target).closest('.ai-point-detail-popup').length > 0) return
    window.hideAiPointPopup()
  })
  $('.shade_user_box .ai-point-detail-popup')
    .off('mouseenter.aiPoint mouseleave.aiPoint')
    .on('mouseenter.aiPoint', function (e) {
      showAiPointPopupOnHover(true, e)
    })
    .on('mouseleave.aiPoint', function (e) {
      showAiPointPopupOnHover(false, e)
    })

  // 头像下拉
  $('.shade_user_box').off().on('click', function (e) {
    let id = $(e.target).closest('.shade_user_item').attr('data-id') || $(e.target).attr('data-id')

    if (id == 'logout') {
      $.confirm({
        content: '您将退出登录，是否继续？',
        onConfirm: function () {
          localStorage.setItem('logout', '1')
          if (closeBrowser()) {
              ipc.send('win_opts', 'unmax')
              ServerUtil.logout()
          }
        }
      })
    } else if (id == 'setting') {
      showSetting()
    } else if (id == 'home') {
      tabGroup.getTab(0).activate()
      tabGroup.getTab(0).webview.send('showDiagrams')
    } else if (id == 'aiPoint') {
      ipc.invoke('open-childWindow', { section: 'orderInfo', tab: '4' })
    } else {
      if (id == "upgrade") {
        tabGroup.getTab(0).webview.send('openWinPage', id, { pay_position: `entrance-avatar` })

      } else {
        tabGroup.getTab(0).webview.send('openWinPage', id)

      }
    }
    $('.shade_user_box').hide()
  })



  // 窗口操作（最小化、最大化、关闭）
  $('.win_opts')
    .off()
    .on('click', function (e) {
      const id = $(e.target).attr('data-id')
      if (id == 'close') {
        closeBrowser() && ipc.send('win_opts', id)
      }
      else {
        ipc.send('win_opts', id)
      }
    })
  //双击切换最大最小窗口
  $('.etabs-tabgroup')
    .off('dblclick')
    .on('dblclick', function (e) {
      if ($(e.target).hasClass('etabs-tabgroup')) {
        ipc.send('is_win_opts')
        ipc.on('is_win_opts_callback', function () {
          if (pcUtil.isMac()) {
            $('.etabs-tabgroup[data-system=mac]').css({ 'padding-left': '100px' })
            $('.etabs-tabgroup:before').css({ width: '100px' })
          }
        })
      }
    })
  pcUtil.imgError()
}

function setOptBox() {
  if (isMac()) {
    $('.p-menu').attr('data-system', 'mac')
    $('.etabs-tabgroup').attr('data-system', 'mac')
  } else {
    $('.p-menu').attr('data-system', 'win')
    $('.etabs-tabgroup').attr('data-system', 'win')
  }
}
function setTabUpdateBarVisible(visible) {
  const $bar = $('#poUpdateBar')
  const $group = $('.etabs-tabgroup')
  if (visible) {
    $bar.removeClass('hide').attr('aria-hidden', 'false')
    $group.addClass('has-update-progress')
  } else {
    $bar.addClass('hide').attr('aria-hidden', 'true')
    $group.removeClass('has-update-progress')
    $bar.find('.po-update-bar__fill').css({ width: '0%' })
  }
  setTimeout(() => checkScrollableTabs(), 0)
}

function renderTabUpdateProgress(params, state) {
  if (!window.__poTabUpdateBar) return
  if (state === 'progressing') {
    const transferred = params?.transferred ?? params?.receive ?? 0
    const totalBytes = params?.total ?? 0
    let pct = params?.percent
    if (!Number.isFinite(pct) && totalBytes > 0) {
      pct = Math.ceil(transferred / totalBytes * 100)
    }
    pct = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0
    setTabUpdateBarVisible(true)
    $('#poUpdateBar .po-update-bar__fill').css({ width: `${pct}%` })
  } else if (state === 'update_end' || state === 'update_fail') {
    setTabUpdateBarVisible(false)
    window.__poTabUpdateBar = false
  }
}

// 所有index接收的ipc
function renderUpdateProgress(params, state) {
  renderTabUpdateProgress(params, state)
  const $box = $('#alert_box .v_upData[data-type=1] .progressBox')
  if (!$box.length) return
  if (state === 'progressing') {
    const transferred = params.transferred ?? params.receive ?? 0
    const totalBytes = params.total ?? 0
    let pct = params.percent
    if (!Number.isFinite(pct) && totalBytes > 0) {
      pct = Math.ceil(transferred / totalBytes * 100)
    }
    pct = Number.isFinite(pct) ? Math.max(0, Math.min(100, pct)) : 0
    const receive = pcUtil.byteConvert(transferred)
    const total = pcUtil.byteConvert(totalBytes)
    $box.find('.progress_line div').css({ width: `${pct}%` })
    $box.find('.progress_percentum span').css({ color: '#0078DB' }).text(`${pct}%`)
    $box.find('.progress_num .progress_now').text(`${receive.n}${receive.unit}`)
    if (totalBytes > 0) {
      $box.find('.progress_num .progress_total').text(`${total.n}${total.unit}`)
    }
  } else if (state === 'update_end') {
    $box.find('.progress_line div').css({ width: '100%' })
    $box.find('.progress_percentum span').css({ color: '#0078DB' }).text('更新成功')
    $('#alert_box .button[data-type=restart]').removeClass('hide')
  } else if (state === 'update_fail') {
    $box.find('.progress_percentum span').css({ color: '#EB5555FF' }).text(`${params || ''}失败`)
    $('#alert_box .button[data-type=restart]').addClass('hide')
  }
}

export function bindIpcEvents() {
  window.__poUpdateProgress = renderUpdateProgress

  ipc.on('progress', (_e, params) => renderUpdateProgress(params, 'progressing'))
  ipc.on('update_end', () => renderUpdateProgress(null, 'update_end'))
  ipc.on('update_fail', (_e, params) => renderUpdateProgress(params?.msg, 'update_fail'))

  // 窗口关闭事件
  ipc.on('closeAll', () => {
    closeBrowser() && ipc.send('closeAllow')
  })
  // 窗口最大化回调
  ipc.on('maximize', function () {
    $('.win_opts .opt[data-id=max]').attr('data-id', 'unmax').html('&#xe780;')
    if (pcUtil.isMac()) {
      $('.etabs-tabgroup[data-system=mac]').css({ 'padding-left': '100px' })
      $('.etabs-tabgroup:before').css({ width: '100px' })
    }
  })
  ipc.on('ping_event', (e, arg1, arg2) => {
    let targetTabId = homeTabId
    if (arg1 && !isNaN(arg1)) targetTabId = arg1
    console.log(tabGroup.getTab(targetTabId), targetTabId)
    tabGroup.getTab(targetTabId).webview.send('pong_event', arg2)
  })
  ipc.on('refresh', (e) => {
    tabGroup.getTab(Number(0)).webview.reload()
  })
  // 窗口取消最大化回调
  ipc.on('unmaximize', function () {
    // nWs.send(JSON.stringify({ k: "unFullScreen", args: [] }));
    $('.win_opts .opt[data-id=unmax]').attr('data-id', 'max').html('&#xe77e;')
    if (pcUtil.isMac()) {
      $('.etabs-tabgroup[data-system=mac]').css({ 'padding-left': '100px' })
      $('.etabs-tabgroup:before').css({ width: '100px' })
    }
  })
  // 窗口全屏回调
  ipc.on('fullScreen', function () {
    $('.win_opts .opt[data-id=fullScreen]').attr('data-id', 'unFullScreen').html('&#xe780;')
    // $(".etabs-tabgroup").hide();
    // $(".etabs-views").css({"height": "100vh"});
    if (pcUtil.isMac()) {
      $('.etabs-tabgroup[data-system=mac]').css({ 'padding-left': '100px' })
    }
  })
  // 窗口取消全屏回调
  ipc.on('unFullScreen', function (params) {
    // nWs.send(JSON.stringify({ k: "unFullScreen", args: [] }));
    $('.win_opts .opt[data-id=unFullScreen]').attr('data-id', 'fullScreen').html('&#xe77e;')
    // $(".etabs-tabgroup").show();
    // $(".etabs-views").css({"height": "calc( 100vh - 40px )"});
    if (pcUtil.isMac()) {
      $('.etabs-tabgroup[data-system=mac]').css({ 'padding-left': '100px' })
      $('.etabs-tabgroup:before').css({ width: '100px' })
    }

    tabGroup.getTabs().map((tab) => {
      tab.webview.send('pong_event', {
        k: 'unFullScreen',
        args: JSON.stringify([params]),
        isJson: true
      })
    })

    // ipc.on('preloadSetup',function(e,re){
    //   console.log('preloadSetup2')
    //   return tabGroup.activateRecentTab();
    // })
  })
  // 错误提示
  ipc.on('error', function (e, params) {
    new Toast({ msg: params, type: 'error' })
  })
  // 关闭当前页签
  ipc.on('closeTab', function () {
    tabGroupExtend.closeTab()
  })
  // ipc.on('newTab', function () {
  //     newTab()
  // })
  // CmdOrCtrl+O 快捷键打开保存文件地址
  ipc.on('openDownloadFileAddress', function (e, file) {
    const toast = new Toast(
      {
        type: 'success',
        msg: '正在导入...',
        autoClose: false,
        shadow: true,
        shadowCss: 'background: none !important'
      },
      $('.con-right')
    )
    file = { pos: JSON.parse(file) }
    tabGroup.getTab(homeTabId).webview.send('pong_event', { k: 'associated', args: [file, toast] })
  })
  // 刷新网页
  ipc.on('reloadHttpHtml', function () {
    const tab = tabGroup.getActiveTab()
    console.log('tab', tab, tab.webviewAttributes && pcUtil.isUrl(tab.webviewAttributes.src))
    if (tab.webviewAttributes && pcUtil.isUrl(tab.webviewAttributes.src)) {
      tab.webview.loadURL(tab.webview.src)
    } else {
      tab.webview.loadURL(tab.webview.src)
    }
  })
  ipc.on('localUpload_callback', function (e, res) {
    tabGroup.getTab(homeTabId).webview.send('localUpload_callback', res)
  })
  ipc.on('createChart', (e, type) => {
    tabGroup.getTab(homeTabId).webview.send('createChart', type)
  })
  ipc.on("TrayLoginOut", () => {
    ipc.send('changeTray', false)
    $.confirm({
      content: '您将退出登录，是否继续？',
      onConfirm: function () {
        localStorage.setItem('logout', '1')
        if (closeBrowser()) {
            ipc.send('win_opts', 'unmax')
            ServerUtil.logout()
        }
      }
    })
  })
}

function initTray() {
  if (pcUtil.isWin()) {
    Setting.getSetting(false, (setting) => {
      console.log("初始化第一次 判断是否有设置过trayOpenSeted", setting)
      const trayOpenSeted = setting.trayOpenSeted; //代表首次打开 没有设置过托盘
      const trayOpen = setting.basic && setting.basic.includes("trayOpen")
      ipc.send('changeTray', !trayOpenSeted ? true : trayOpen)
      if (!trayOpenSeted) {
        console.log("没设置过需要更新一个trayOpenSeted 一个 trayOpen")
        Setting.updateSetting({ trayOpenSeted: true, basic: [...setting.basic, 'trayOpen'] })
      } else {
        console.log("设置过了，保持内部的trayOpen")
      }
    })
  }
}

function updateDom(){
  if(CONFIG.CHANNELTYPE == 'opt360'){
    const dom = $('.shade_user_box')
    dom.find('div[data-id=account]').hide()
    dom.find('div[data-id=user]').hide()
    dom.find('div[data-id=payment]').hide()
    dom.find('div[data-id=coupon]').hide()
    dom.find('div[data-id=support]').hide()
  }
}

export function initIndex() {
  localStorage.removeItem('uploadingFileIds')
  indexedDB.deleteDatabase("processon")
  bindEvent() // dom event
  setOptBox() // mac windos 不同的样式
  initTray() // 获取初始化windows托盘状态
  updateDom()
}

export function checkUpdate(dom) {
  if (!navigator.onLine) {
    return
  }
  const handler = (_, msg) => {
    ipc.removeListener('checkUpdate_callback', handler)
    const { updateInfo = {}, needUpdate = false, success } = msg
    if (success) {
      if (needUpdate) {
        const notes = updateInfo.releaseNotes
        const releaseNotesStr = typeof notes === 'string'
          ? notes
          : Array.isArray(notes)
            ? notes.map((n) => n.note || n).join('<br/>')
            : ''
        new Updata({
          ...updateInfo,
          description: updateInfo.description || releaseNotesStr || '暂无',
        })
      } else if (!needUpdate && dom) {
        new Toast({ 'type': 'main', 'msg': '暂无更新' })
      }
    } else if (dom) {
      new Toast({ 'type': 'main', 'msg': '暂无更新' })
    }
  }
  ipc.on('checkUpdate_callback', handler)
  ipc.send('checkUpdate')
}

export function calcCacheSize() {
  !localStorage.getItem('auto_upload') && localStorage.setItem('auto_upload', '1')
  // ipc.on('clearCacheSize', (_ev, obj) => {
  //   localStorage.setItem('clearCacheSize', obj)
  //   $('#btnClearCache').html('清除缓存').removeAttr('style')
  //   $('#cacheSize').html(obj)
  // })
  // ipc.send('calcClearCache', { type: 1 })
  // $('#btnClearCache').html('计算中..').attr('style', 'pointer-events: none')
}