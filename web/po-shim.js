// AIPROS 流程图 — 官方编辑器浏览器 shim
// 在纯浏览器环境里模拟 Electron preload 桥（window.electron / window.api），
// 文件读写路由到 AIPROS 服务器的虚拟文件系统（/api/po/fs）。

(function () {
  'use strict'

  const log = (...a) => console.log('%c[po-shim]', 'color:#f0b429', ...a)
  log('官方编辑器引擎 shim 已加载')

  // ajax.js 会重写 window.fetch，先锁定原生版本供本 shim 使用
  const basePath = window.aiprosBasePath || ''
  const originalFetch = window.fetch.bind(window)
  const nativeFetch = (url, options = {}) => {
    if (window.aiprosUserKey && typeof url === 'string' && url.startsWith(basePath + '/api/')) {
      const headers = new Headers(options.headers || {})
      headers.set('X-AIPROS-User-Key', window.aiprosUserKey)
      return originalFetch(url, { ...options, headers })
    }
    return originalFetch(url, options)
  }
  window.aiprosNativeFetch = nativeFetch

  const pendingHandlers = {}
  const canned = {
    getGlobal: (k) => (k === 'host' ? '' : ''),
    getHost: () => ({ }),
    isUploadCopyFile: () => false,
    getMachineId: () => 'aipros-web-machine',
    SystemUserName: () => 'AIPROS 用户',
    DeviceGuid: () => 'aipros-web-device-guid',
  }

  async function poFS(op, payload) {
    try {
      const res = await nativeFetch(basePath + '/api/po/fs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op, ...payload }),
      })
      return await res.json()
    } catch (e) {
      log('poFS 网络错误', op, e)
      return { code: 500, message: String(e) }
    }
  }

  async function poDB(op, payload) {
    try {
      const res = await nativeFetch(basePath + '/api/po/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op, ...payload }),
      })
      return await res.json()
    } catch (e) {
      log('poDB 网络错误', op, e)
      return null
    }
  }

  // 导出文件 → 浏览器下载
  const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', pdf: 'application/pdf', zip: 'application/zip', pos: 'application/octet-stream', posf: 'application/octet-stream', txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', json: 'application/json', html: 'text/html' }
  function poDownload(d) {
    const suffix = String(d.suffix || 'png').replace(/^\.+/, '')
    const mime = MIME[suffix] || 'application/octet-stream'
    const name = `${String(d.path || '导出').replace(/[\\/:*?"<>|]/g, '_')}.${suffix}`
    const byteStr = atob(d.data)
    const bytes = new Uint8Array(byteStr.length)
    for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i)
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
    log('已触发浏览器下载:', name, bytes.length, 'bytes')
  }

  const listeners = {}
  const ipcRenderer = {
    on(channel, handler) {
      (listeners[channel] = listeners[channel] || []).push(handler)
    },
    once(channel, handler) { this.on(channel, handler) },
    removeAllListeners(channel) { if (channel) delete listeners[channel] },
    removeListener(channel, handler) {
      if (listeners[channel]) listeners[channel] = listeners[channel].filter(h => h !== handler)
    },
    send(channel, ...args) {
      // 上行通知，浏览器环境大多无需处理
      if (channel === 'saveFileB64' || channel === 'loadFileB64') log('send(未桥接的同步通道)', channel)
    },
    sendToHost(channel, ...args) {
      // tab 事件（标题/图标）—— 由宿主页处理
      window.dispatchEvent(new CustomEvent('po-host', { detail: { channel, args } }))
    },
    sendSync(channel, ...args) {
      if (channel in canned) return canned[channel](...args)
      log('sendSync 未实现通道:', channel, JSON.stringify(args).slice(0, 120))
      return undefined
    },
    invoke(channel, ...args) {
      switch (channel) {
        case 'loadFileB64':
        case 'loadFileUtf8B64':
          return poFS('load', args[0])
        case 'saveFileB64':
        case 'saveFileB64BYEMF': {
          const d = Array.isArray(args[0]) ? args[0][0] : args[0]
          // 导出/另存（type 'save'）→ 浏览器直接下载 + 服务器留档
          if (d && d.type === 'save' && d.data) {
            try { poDownload(d) } catch (e) { log('下载失败', e) }
          }
          return poFS('save', d)
        }
        case 'webRoot':
          return Promise.resolve(basePath + '/app/src')
        case 'saveData':
        case 'findOneData':
        case 'findData':
        case 'removeData':
        case 'putAllData':
        case 'clearData':
        case 'removeFileData': {
          const payload = Array.isArray(args[0]) ? args[0][0] : args[0]
          return poDB(channel, payload ?? {})
        }
        case 'SystemUserName':
          return Promise.resolve('AIPROS 用户')
        case 'DeviceGuid':
          return Promise.resolve('aipros-web-device-guid')
        default:
          log('invoke 未实现通道:', channel, JSON.stringify(args).slice(0, 160))
          return Promise.resolve(undefined)
      }
    },
  }

  window.electron = {
    ipcRenderer,
    process: { platform: 'darwin', env: {}, argv: [] },
  }

  window.api = {
    shell: {
      openExternal(url) { window.open(url, '_blank') },
      openPath() { return Promise.resolve('') },
      showItemInFolder() {},
    },
    path: {
      join: (...parts) => parts.filter(Boolean).join('/').replace(/\/{2,}/g, '/'),
      basename: (p) => String(p).split('/').pop(),
      dirname: (p) => String(p).split('/').slice(0, -1).join('/'),
      extname: (p) => { const b = String(p).split('/').pop(); const i = b.lastIndexOf('.'); return i > 0 ? b.slice(i) : '' },
      sep: '/',
    },
    ipcRenderer,
    wsPort: 0,
    machineIdSync: () => 'aipros-web-machine',
    __dirname: '/app/out/renderer',
    fs: null,
    setupWebview() {},
  }

  window.cefQuery = window.cefQuery || {
    saveDef() { log('cefQuery.saveDef -> 触发宿主保存') },
    postMessage() {},
    removeEventListener() {},
    addEventListener() {},
  }

  window.appConfig = window.appConfig || {
    createTab() {}, setTabTitle() {}, closeTab() {}, printImage() {},
    openFile() {}, GetPosInitData() { return Promise.resolve('') },
  }

  // 上行 host 事件转发给宿主页（AIPROS 壳）
  window.addEventListener('po-host', (ev) => {
    const { channel, args } = ev.detail || {}
    if (channel === 'setTitle') {
      document.title = BRAND_TITLE
      window.dispatchEvent(new CustomEvent('po-title', { detail: args[1] || args[0] }))
    }
  })

  // 网络在线状态（模板等在线面板按离线降级）
  // 云端版隐藏桌面客户端专属入口（立即上云：本来就在云端；分享协作：砍掉）+ 全部 VIP 标识
  const CLOUD_HIDE_STYLE = document.createElement('style')
  CLOUD_HIDE_STYLE.textContent = [
    '#po-uploadOnline-button { display: none !important; }',
    '#po-clb-button { display: none !important; }',
    '[class*="vip" i], [id*="vip" i], img[src*="vip" i], a[href*="vip" i] { display: none !important; }',
    '[class*="upgrade" i], [class*="price" i] { display: none !important; }',
    '[title="模板"], [aria-label="模板"], [data-title="模板"] { display: none !important; }',
  ].join('\n')
  ;(document.head || document.documentElement).appendChild(CLOUD_HIDE_STYLE)

  // 导出强制高清：包装 svgToImage，倍率不低于 3x
  const HD_SCALE = 3
  const hdGuard = setInterval(() => {
    try {
      const ev = window.PoEditorClient && window.PoEditorClient.exportView
      if (ev && typeof ev.svgToImage === 'function' && !ev.svgToImage._hd) {
        const orig = ev.svgToImage
        const patched = function (params, scale, suffix) {
          const s = Math.max(Number(scale) || 1, HD_SCALE)
          return orig.call(this, params, s, suffix)
        }
        patched._hd = true
        ev.svgToImage = patched
        clearInterval(hdGuard)
        log(`导出高清已启用：倍率 >= ${HD_SCALE}x`)
      }
    } catch (e) { /* 等待编辑器就绪 */ }
  }, 800)
  setTimeout(() => clearInterval(hdGuard), 60000)

  // 全功能会员：兜底覆盖（在线接口由服务器提供 canned 响应）
  try {
    window.memberObj = Object.assign({ member: true }, window.memberObj)
    const memberGuard = setInterval(() => {
      if (window.memberObj && window.memberObj.member === false) window.memberObj.member = true
      if (typeof window.isMember === 'function' && !window.isMember._zhan) {
        const orig = window.isMember
        const patched = function () { return true }
        patched._zhan = true
        patched._orig = orig
        window.isMember = patched
      }
    }, 500)
    setTimeout(() => clearInterval(memberGuard), 60000)
  } catch (e) { log('会员兜底失败', e) }

  window.poIsWeb = true

  // 图标覆盖：地址栏/标签页 favicon 换成 詹 · AIPROS 徽标（覆盖官方 ico）
  const FAVICON = "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect x='1' y='1' width='30' height='30' rx='7' fill='#1e3a5f'/><path d='M8 16h6m4 0h6M14 16c2 0 2-6 4-6s2 12 4 12' stroke='#f0b429' stroke-width='2.2' fill='none' stroke-linecap='round'/><circle cx='8' cy='16' r='2.4' fill='#f0b429'/><circle cx='24' cy='16' r='2.4' fill='#f0b429'/></svg>`
  )
  function setFavicon() {
    for (const rel of ['icon', 'shortcut icon', 'apple-touch-icon']) {
      let link = document.querySelector(`link[rel='${rel}']`)
      if (!link) { link = document.createElement('link'); link.rel = rel; document.head.appendChild(link) }
      link.href = FAVICON
    }
  }
  setFavicon()
  const faviconGuard = setInterval(() => {
    const bad = [...document.querySelectorAll("link[rel*='icon']")].filter(i => i.rel !== 'icon' && !i.href.startsWith('data:'))
    if (bad.length) { bad.forEach(i => i.remove()); setFavicon() }
  }, 800)
  setTimeout(() => clearInterval(faviconGuard), 60000)

  // 品牌渲染：官方品牌 -> 詹（持续接管动态渲染的文字 + 标签页标题）
  const BRAND_FROM = new RegExp(['Pro', 'cess', 'On'].join(''), 'g')
  const BRAND_TO = '詹'
  const BRAND_TITLE = '詹 · AIPROS 流程图'
  document.title = BRAND_TITLE
  setInterval(() => {
    if (document.title !== BRAND_TITLE) document.title = BRAND_TITLE
  }, 500)
  function rebrand(root) {
    if (!root) return
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let n
    while ((n = walker.nextNode())) {
      if (BRAND_FROM.test(n.textContent)) {
        n.textContent = n.textContent.replace(BRAND_FROM, BRAND_TO)
      }
      BRAND_FROM.lastIndex = 0
    }
    for (const el of root.querySelectorAll?.('[title], [placeholder], [alt]') || []) {
      for (const attr of ['title', 'placeholder', 'alt']) {
        const v = el.getAttribute(attr)
        if (v && BRAND_FROM.test(v)) el.setAttribute(attr, v.replace(BRAND_FROM, BRAND_TO))
      }
    }
  }
  function startRebrand() {
    if (!document.body) return setTimeout(startRebrand, 200)
    rebrand(document.body)
    killTemplateNav(document.body)
    new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'childList') m.addedNodes.forEach(n => n.nodeType === 1 ? (rebrand(n), killTemplateNav(n)) : rebrand(n.parentNode))
        else if (m.type === 'characterData' && BRAND_FROM.test(m.target.textContent)) {
          m.target.textContent = m.target.textContent.replace(BRAND_FROM, BRAND_TO)
        }
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true })
  }

  // 左侧导航"模板"入口：砍掉（模板市场暂不做）——文字按钮 + 图标按钮（title/aria-label）都猎杀
  function killTemplateNav(root) {
    if (!root || !root.querySelectorAll) return
    for (const el of root.querySelectorAll('div, span, li, a, i')) {
      if (el.childElementCount <= 2 && el.textContent.trim() === '模板') {
        const target = el.closest('li, .tab-item, .menu-item, [class*="nav-item"]') || el.parentElement || el
        if (target && target !== document.body) target.style.setProperty('display', 'none', 'important')
      }
    }
  }
  const templateBtnObserver = setInterval(() => {
    if (!document.body) return
    for (const el of document.body.querySelectorAll('[title="模板"], [aria-label="模板"], [data-title="模板"]')) {
      el.style.setProperty('display', 'none', 'important')
    }
  }, 500)
  setTimeout(() => clearInterval(templateBtnObserver), 300000)
  document.addEventListener('DOMContentLoaded', startRebrand)
})()
