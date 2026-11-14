export const isMac = ()=>{
    const agent = navigator.userAgent.toLowerCase()
    let isMac = /macintosh|mac os x/i.test(navigator.userAgent)
  
    if (agent.indexOf('win32') >= 0 || agent.indexOf('wow32') >= 0) {
      isMac = false
    }
    if (agent.indexOf('win64') >= 0 || agent.indexOf('wow64') >= 0) {
      isMac = false
    }
    if (isMac) {
      isMac = true
    }
    return isMac
}

export const tabGroup = document.querySelector('tab-group')

export const homeTabId = 0

// 监听网络状态
export function spyNetSniffer() {
  
    pcUtil.setOnlie(navigator.onLine)

    window.addEventListener('online', function () {
        pcUtil.setOnlie(true)
        tabGroup.getTab(homeTabId).webview.send('pong_event', { k: 'sync', args: [] })
    })
    window.addEventListener('offline', function () {
        window.localStorage.removeItem('isOnLine')
        // tabGroup.getTab(homeTabId).webview.send('pong_event', { k: 'sync', args: [] })

    })
}