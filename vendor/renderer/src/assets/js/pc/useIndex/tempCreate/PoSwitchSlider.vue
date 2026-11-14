<template>
  <!-- .stop.prevent -->
  <!--  @click="eTsTn('click', $event)" -->
  <div ref="po-SwitchSlider" :class="`po-SwitchSlider` + checkAddClass + checkDisabled + checkNoBg" :style="checkStyle">
    <div class="sliderItemWrap">
    <div :class="{
      sliderItem: true,
      sliderItemActiveText: ind === sliderItemActive
    }" @click="handelClick(ind)" v-for="(item, ind) in typeList" :key="item">{{ item }}</div>
   </div>
   <div class="sliderBlock" :style="{left:(blockLeft)+'px'}"></div>
  </div>
</template>

<script type="text/javascript">
export default {
  name: "PoSwitchSlider",
  props: {
    value: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    addClass: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'default' // default primary success info warning
    },
    stop: {
      type: Boolean,
      default: false
    },
    prevent: {
      type: Boolean,
      default: false
    },
    autoBodyClick: {
      type: Boolean,
      default: false
    },
    width: {
      type: Number,
      default: 0
    },
    height: {
      type: Number,
      default: 0
    },
    nobg: {
      type: Boolean,
      default: false
    },
    onchange: {
      type: Function,
      default: () => { }
    }
  },
  data() {
    return {
      typeList: ['最近使用', '流程图', '思维导图'],
      sliderItemActive: 1,
    }
  },
  computed: {
    blockLeft(){
      if(this.sliderItemActive == 0){
        return 10
      }
      if(this.sliderItemActive == 1){
        return 86
      }
      if(this.sliderItemActive == 2){
        return 162
      }
    },
    checkDisabled() {
      return this.disabled ? ' disable' : ''
    },
    checkAddClass() {
      let rtn = ''
      if (this.addClass !== '') {
        rtn += ' ' + this.addClass
      }
      if (this.value === '') {
        rtn += ' ' + 'is-just-icon'
      }
      return rtn
    },
    // 检测特殊样式
    checkStyle() {
      let rtn = ''
      if (this.width !== 0) {
        rtn += ' width:' + this.width + 'px'
      }
      if (this.height !== 0) {
        rtn += ' height:' + this.height + 'px'
      }
      return rtn
    },
    checkNoBg() {
      let rtn = ''
      if (this.nobg) {
        rtn += ' ' + 'is-nobg'
      }
      return rtn
    }
  },
  created() {
    this.$addComponents('categorySlide',this)
  },
  methods: {
    handelClick(index) {
      if (this.sliderItemActive !== index) {
        this.sliderItemActive = index
        this.$getComponents("tempCreate").fetchAll(index)
      }


    }
  }
}
</script>

<style lang="less" scoped>
.po-SwitchSlider {
  width: 16.38rem;
  height: 2.15rem;
  display: flex;
  align-items: center;
  position:relative;
}

.sliderItemWrap{
  width:100%;
  height:100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: absolute;
  z-index: 2;
}

.sliderItem {
  height: 100%;
  opacity: 1;
  color: #6C7D8F;
  font-size: 1.15rem;
  font-weight: 400;
  font-family: "PingFang SC";
  text-align: center;
  line-height: 1.54rem;
  letter-spacing: -0.08px;
  cursor: pointer;
}
.sliderItem:hover{
  color: #212930ff;
}
.sliderItem.sliderItemActiveText:hover{
  color:#212930;
}

.sliderBlock {
  position: absolute;
  bottom:0px;
  left: 4px;
  width: 41px;
  height: 2px;
  z-index: 1;
  background: #212930;
  transition: left 0.3s;
}
.sliderItemActiveText{
  font-weight: 500;
  color:#212930;
}

</style>
