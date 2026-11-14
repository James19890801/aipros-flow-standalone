<template>
    <div>
      <!-- 遮罩 -->
      <div v-if="maskShow" id="window-mask" ref="popMask" class="window-mask" />
      <!-- 预览模版 -->
      <DlgViewTemplate
        v-if="digShow.dlgViewTemplate"
        ref="dlgViewTemplate"
        :pms="pms"
        :parent-self="parentSelf"
      />
     
    </div>
  </template>
  
  <script>
  import DlgViewTemplate from './modal/dlgViewTemplate.vue'
  export default {
    name: "Pops",
    components: {
      DlgViewTemplate
    },
    data() {
      return {
        parentSelf: this,
        digShow: {
          dlgViewTemplate: false,
        },
        // 遮罩状态
        maskShow: false,
        // 根据需求可以走传统组件传参模式
        pms: {}
      }
    },
    computed: {
    },
    created() {
    },
    mounted() {
      this.$addComponents("popMain", this)
    },
    // 销毁事件
    destroyed() {
      // this.$emit("toDestroys", this.popName)
    },
    methods: {
      // 对外方法
      dlgToShow(dlgName, pms) {
        // 弹窗状态
        this.digShow[dlgName] = true
        this.maskShow = true
        this.pms = pms
      },
      // 检测弹窗显示,用户不用关心 digShow 参数拼接
      checkDlgShow(dlgName) {
        if(typeof this.digShow[dlgName] === 'undefined') {
          this.digShow[dlgName] = false
          this.$set(this.digShow, dlgName, false)
        }
        return this.digShow[dlgName]
      },
      // 显示状态
      emDigShow(pms) {
        this.digShow[pms.name] = pms.value
        this.maskShow = pms.value
        $('#root').css({zIndex:1})
        // this.maskShow = pms.value
        // 弹窗关闭通知
        // this.cancel(pms)
        // this.$nextTick(() => {
        //   this.autoSetMaskShow()
        //   this.autoSetMaskLevel()
        // })
      },
      // 自动设置遮罩显示隐藏
      autoSetMaskShow() {
        let ObKeys = Object.keys(this.$refs), isShowMask = false
        for (let i = 0, len = ObKeys.length; i < len; i++) {
          let key = ObKeys[i]
          // 
          if (typeof this.$refs[key] !== 'undefined' && typeof this.$refs[key].$el === 'object') {
            isShowMask = true
            break
          }
        }
        this.maskShow = isShowMask
      },
      // 自动设置遮罩层级
      autoSetMaskLevel() {
        let ObKeys = Object.keys(this.$refs), autoIndex = 0
        for (let i = 0, len = ObKeys.length; i < len; i++) {
          let key = ObKeys[i]
          if (typeof this.$refs[key] !== 'undefined' && typeof this.$refs[key].$el === 'object') {
            let _autoIndex = this.$refs[key].$el.style.zIndex
            _autoIndex = parseInt(_autoIndex)
            if (_autoIndex > autoIndex) {
              autoIndex = _autoIndex
            }
          }
        }
        this.$refs['popMask'].style.zIndex = autoIndex
      },
    
    }
  }
  </script>
  
  <style></style>
  