<template>
  <div ref="optionUserList" :style="checkStyle" class="user-menu menu noarrow popover">
    <ul>
      <div v-for="(item, index) in list" :key="index + `_one`">
        <li :class="[activeIndex-splitSceneIndex-1 === index?'activeIndex':'']" @click="eClick(item, index + splitSceneIndex + 1)">
          {{ item.name }}
        </li>
      </div>
    </ul>
  </div>
</template>

<script type="text/javascript">
export default {
  name: "UserList",
  components: {
  },
  props: {
    teamListOffset: {
      type: Object,
      // eslint-disable-next-line vue/require-valid-default-prop
      default: {}
    },
    list: {
      type: Array,
      default: []
    },
    splitSceneIndex: {
      type: Number,
      default: 0
    },
    sceneActive:{
      type: Number,
      default: 0
    }
  },
  // data() {
  //   return {
  //     list: ['游戏', '电子竞技']
  //   }
  // },
  computed: {
    checkStyle() {
      let top = 0, left = 0
      let str = 'width: 140px; z-index: 3;'
      str += 'top:' + this.teamListOffset.top + 'px;'
      str += 'left:' + this.teamListOffset.left + 'px;'
      return str
    },
    activeIndex() {
      return this.sceneActive ? this.sceneActive :null
    }
  },
  mounted() {
  },
  methods: {
    eClick(item, index) {
      // 添加选中状态 && 搜索
      this.$emit('updateLastStatus', item, index)
    },
  }
}
</script>

<style scoped>
.activeIndex{
  background-color: #F3F5F9;
  color:rgb(5, 111, 215);
}
</style>
