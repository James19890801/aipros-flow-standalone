import { initIndex, spyNetSniffer, bindIpcEvents, initTabGroup, tabGroupExtend, checkUpdate, calcCacheSize } from './useIndex/index.js'
import "@/assets/css/pc/iconfont/iconfont.css";

$(function () {

  initIndex() // 首页事件 token 样式
  bindIpcEvents() // homeipc
  spyNetSniffer() // 网络状态
  checkUpdate() // 检测更新
  calcCacheSize() // 计算可更新的缓存
  // 初始化tab
  initTabGroup()
  tabGroupExtend.addTab({
    title: '首页',
    src: './home.html',
    closable: false,
    notLoad: true
  }).then(() => {
    ipc.send('htmlComplete')

  })
  ipc.invoke('getPcName').then((res) => {
    localStorage.setItem('pcName', res)
  })


  // tabGroupExtend.showDlgSaveWebView({id:0,savepath:'未命名文件',suffix:'posf'})
})