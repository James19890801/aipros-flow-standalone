<template>
  <div :id="idName" ref="selfDlg" :style="dlgStyle" :class="checkNoPadding" @click="eAlldlgClick">
    <div v-if="isShowClose" class="dlg-touchbar"
      style="position:absolute;height:23px;width: 93%;left:0px;top:0px;z-index:10;cursor: move;"
      @mousedown="edlgMouseDown" @mouseup="edlgMouseUp" />
    <h2 v-if="isShowTitle" class="dlg-title">
      <slot name="dlgTitle" />
    </h2>
    <div v-if="isShowContents" class="dlg-content">
      <div v-if="isShowlineParent" class="line-parent">
        <slot name="dlgContents" />
      </div>
      <slot v-else name="dlgContents" />
    </div>
    <slot />
    <div v-if="isShowBtns" class="dlg-buttons">
      <!-- 默认按钮 -->
      <template v-if="defaultBtns">
        <button type="default" value="取消" @click.stop="eBtnCancel" />
        &nbsp;&nbsp;
        <button type="primary" value="确定" @click.stop="eBtnOk" />
      </template>
      <template v-else>
        <!-- 自定义按钮 -->
        <slot name="dlgButtons" />
      </template>
    </div>
    <div v-if="isShowClose" class="dialog-close po-iconfont" style="display: block" @click="toClose">
      &#xe728;
    </div>
    <div @click="toClose" v-if="isShowCustomClose">
      <slot style="display: block" name="dlgCustomClose" />
    </div>
  </div>
</template>

<script>

export default {
  name: "Popslots",
  components: {},
  props: {
    // 宽度
    width: {
      type: Number,
      default: 386
    },
    // 高度
    height: {
      type: Number,
      default: 443
    },
    // 是否显示标题
    isShowTitle: {
      type: Boolean,
      default: true
    },
    // 是否显示关闭
    isShowClose: {
      type: Boolean,
      default: true
    },
    // 是否显示定制化关闭
    isShowCustomClose: {
      type: Boolean,
      default: false
    },
    // 是否显底部按钮
    isShowBtns: {
      type: Boolean,
      default: true
    },
    // 是否显示内容盒子
    isShowContents: {
      type: Boolean,
      default: true
    },
    isShowlineParent: {
      type: Boolean,
      default: true
    },
    idName: {
      type: String,
      default: ""
    },
    nopadding: {
      type: Boolean,
      default: false
    },
    dlgName: {
      type: String,
      default: ""
    },
    // 父级自定义追加样式
    addClass: {
      type: String,
      default: ""
    },
    // popCont上自定义样式
    dlgSelfStyle: {
      type: String,
      default: ""
    },
    // 禁止初始化绑定 transform
    noAutoStyle: {
      type: Boolean,
      default: false
    },
    // 初始化检测时间
    timeCheck: {
      type: Number,
      default: 0
    },
    // 是否增加取消关闭按钮，默认false自定义
    defaultBtns: {
      type: Boolean,
      default: false
    },
    // 确认自动关闭
    successClose: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      popShow: true,
      isMove: false,
      nowPms: {},
      popIndex: 100
    }
  },
  computed: {
    // 计算弹窗属性
    dlgStyle() {
      let styleStr = ''
      if (this.dlgSelfStyle !== "") {
        styleStr = this.dlgSelfStyle
      } else {
        styleStr = this.getStyle()
      }
      styleStr += ' z-index:' + this.popIndex + '; -webkit-font-smoothing: antialiased;'
      // 返回style
      if (!this.noAutoStyle) {
        styleStr += 'top:50%; left: 50%; transform: translate(-50%, -50%);'
      }
      return styleStr
    },
    // checkNoPadding
    checkNoPadding() {
      let rtn = `dialog-box dialog dlgImport` + this.$props.addClass 
      if (this.nopadding) {
        rtn += ' no-padding'
      }
      return rtn
    }
  },
  created() {    
    // 
  },
  mounted() {
    let _this = this
    document.addEventListener("mousemove", function (e) {
      _this.edlgMouseMove(e)
    })
    document.addEventListener("mouseup", function (e) {
      _this.edlgMouseUp(e)
    })
    // 设置弹窗层级
    this.$refs['selfDlg'].style.zIndex = 10
    // this.$getComponents('popMain').$refs['popMask'].style.zIndex = popIndex
    // 
    // this.$getComponents('popMain').autoSetMaskLevel()
    // this.autoSetDlgStyle()
    // 全局resiez回调
    // this.$menvHook({
    //   type: 'set', envName: 'resize', hookName: 'dlgResize',
    //   fn: function (e) {
    //     // let _dlgOffset = _this.$offset(_this.$refs['selfDlg'])
    //     // // console.log('dlgresize', _dlgOffset)
    //     // _this.$setStyle(_this.$refs['selfDlg'], {
    //     //   top: '50%', left: '50%', marginTop: -(_dlgOffset.height / 2) + 'px', marginLeft: -(_dlgOffset.width / 2) + 'px',
    //     //   transform: 'none'
    //     // })
    //     _this.checkDlgResize(true)
    //   }
    // })

    // 外部检测
    if (window.top !== window.self) {
      return
    }
    setTimeout(() => {
      this.checkDlgResize()
    }, this.timeCheck)

  },
  // 销毁事件
  destroyed() {
    this.$emit("toDestroys", this.dlgName)
  },
  methods: {
    getStyle() {
      return (
        `width:` +
        this.width +
        `px;position:fixed;top: 50%;left: 50%;transform: translate(-50%, -50%);`
      )
    },
    // 检测弹窗缩放
    checkDlgResize(isResize) {
      // 外部检测
      if (window.top !== window.self) {
        return
      }
      if (!this.$refs['selfDlg']) {
        return
      }
      // 初始化
      if (!this.$refs['selfDlg'].getAttribute("_scale") && !this.$refs['selfDlg'].getAttribute("_isFirst")) {
        let _noffset = this.$offset(this.$refs['selfDlg'])
        this.$refs['selfDlg'].setAttribute("_maxHeight", _noffset.height)
        this.$refs['selfDlg'].setAttribute("_maxWidth", _noffset.width)
        this.$refs['selfDlg'].setAttribute("_isFirst", true)
        // this.maxHeight = this.$offset(this.$refs['selfDlg']).height
        // this.maxWidth = this.$offset(this.$refs['selfDlg']).width
        // this.isFirst = false
      }
      console.log('isResize', isResize)
      // document.querySelector("#pubpo_win").style.getPropertyValue("transform")
      // 取中
      if (!this.$refs['selfDlg'].getAttribute("_scale") && isResize) {

        let _dlgOffset = this.$offset(this.$refs['selfDlg']),
          maxHeight = this.$refs['selfDlg'].getAttribute("_maxHeight"), // _dlgOffset.height
          maxWidth = this.$refs['selfDlg'].getAttribute("_maxWidth") //_dlgOffset.width
        this.$setStyle(this.$refs['selfDlg'], {
          top: '50%', left: '50%', marginTop: -(maxHeight / 2) + 'px', marginLeft: -(maxWidth / 2) + 'px',
          transform: 'none'
        })
      }

      // 检测缩放
      if (this.$refs['selfDlg'].getAttribute("_isFirst") === "true") {
        let maxHeight = this.$refs['selfDlg'].getAttribute("_maxHeight"),
          maxWidth = this.$refs['selfDlg'].getAttribute("_maxwidth")

        // 基准校验
        if (window.innerHeight > maxHeight) {
          // this.isScale = false
          this.$refs['selfDlg'].removeAttribute("_scale")
          return
        }
        // this.isScale = true
        this.$refs['selfDlg'].setAttribute("_scale", "true")

        let scalePx = 1 - (maxHeight - window.innerHeight) / maxHeight - 0.1;
        console.log("resize", scalePx)
        this.$setStyle(this.$refs['selfDlg'], {
          marginTop: `-${maxHeight / 2}px`,
          marginLeft: `-${maxWidth / 2}px`,
          transform: `scale(${scalePx})` // scale(1.5)
        })
      }

    },
   
    // 窗口事件
    edlgMouseDown(e) {
      this.isMove = true
      // 
      let domPx = this.$refs["selfDlg"].getBoundingClientRect()
      this.nowPms = {
        left: domPx.left,
        top: domPx.top,
        ex: e.clientX,
        eY: e.clientY
      }
      // 
    },
    edlgMouseMove(e) {
      if (!this.isMove) {
        return false
      }
      this.$refs["selfDlg"].style.transform = "none"
      this.$refs["selfDlg"].style.marginTop = "initial"
      this.$refs["selfDlg"].style.marginLeft = "initial"
      let moveLeft = this.nowPms.left - (this.nowPms.ex - e.clientX) + "px",
        moveTop = this.nowPms.top - (this.nowPms.eY - e.clientY) + "px"
      this.$refs["selfDlg"].style.left = moveLeft
      this.$refs["selfDlg"].style.top = moveTop
      // 
    },
    // 初始化弹窗样式，针对transform可能导致元素发虚
    // autoSetDlgStyle() {
    //   let domPx = this.$refs["selfDlg"].getBoundingClientRect()
    //   this.$refs["selfDlg"].style.transform = "none"
    //   this.$refs["selfDlg"].style.marginTop = -(domPx.height / 2) + "px"
    //   this.$refs["selfDlg"].style.marginLeft = -(domPx.width / 2) + "px"
    // },
    edlgMouseUp() {
      this.isMove = false
    },
    // 弹窗关闭
    toClose() {
      this.$emit("dlgClose", this.dlgName)
      // 新版本升级,弹窗关闭自动处理，但是保留了关闭后事件回传
      // try {
      //   this.$getComponents('popMain').emDigShow({
      //     name: this.dlgName,
      //     value: false
      //   })
      // } catch (e) {
      //   console.error(e)
      // }
    },
    eAlldlgClick(){
      this.$emit("alldlgClick", this.dlgName)
    },
    eBtnCancel() {
      this.toClose()
    },
    eBtnOk() {
      this.successClose && this.toClose()
      this.$emit("dlgSuccess", this.dlgName)
    }
  }
}
</script>

<style scoped>
.dlg-title {
    text-align: left;
    font-size: 17px;
    line-height: 60px;
    color: #212930;
    height: 60px;
    margin: 0;
    padding: 0 24px 0px 0px;
    font-weight: 400;
    -moz-user-select: none;
    -webkit-user-select: none;
    -o-user-select: none;
    user-select: none;
    margin-top: -25px;
}
</style>