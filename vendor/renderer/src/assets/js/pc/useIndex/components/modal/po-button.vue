<template>
  <!-- .stop.prevent -->
  <!--  @click="eTsTn('click', $event)" -->
  <button ref="po-button" :class="`po-button` + (' po-btn-' + type) + checkAddClass + checkDisabled + checkNoBg"
    :style="checkStyle">
    <i v-if="icon !== ''" :class="`po-iconfont` + (iconClass !== '' ? 'po-icon-' + iconClass : '')" v-html="icon" />
    <slot>
      <span class="po-button__label">
        {{ value }}
      </span>
    </slot>
  </button>
</template>

<script type="text/javascript">
// @click.stop.prevent="$emit('onClick', $event)"
export default {
  name: "PoButton",
  props: {
    value: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    iconClass: {
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
    click: {
      type: Function,
      default: null,
    }
  },
  data() {
    return {
      PoEvents: []
    }
  },
  computed: {
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
  mounted() {
    let ts = this
    if (this.click) {
      ts.$refs['po-button'].addEventListener('click', (e) => {
        if (this.stop) {
          tevent.stopPropagation()
        }
        if (this.prevent) {
          tevent.preventDefault()
        }
        this.click(e)
        // ts.eTsTn(item, e)
      })
    }
  },
  methods: {
    // 透传
    eTsTn(eName, tevent) {
      // 'onInput', $event.target.value, $event
      this.$emit(eName, tevent)

      // 透传事件到body
      if (this.autoBodyClick) {
        this.$trigger(this.$dom('body')[0], 'click')
      }

    }
  }
}
</script>

<style lang="less" scoped>
.po_button {
  i.icon {
    font-style: normal;
  }
}
</style>
