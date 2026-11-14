<template v-if="nowData.chart">
  <popSlots :isShowBtns="false" id="dlgViewTemplate" :dlg-name="`dlgNomal`" :width="958" :is-showline-parent="false"
    @dlgClose="eDlgClose" :isShowTitle="false" :isShowClose="false" :isShowCustomClose="true">
    <template #dlgCustomClose style="cursor: pointer;">
      <img style="cursor: pointer;position: absolute;top:0;right:-4.23rem;pointer-events:all;"
        src="@/assets/images/icon/close.svg">
    </template>
    <template #dlgContents>
      <div style="
            white-space: normal;
            word-break: break-all;
            word-wrap: break-word;
            margin-bottom: 24px;
          ">
        <div style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 20px;
            ">
          <div style="
                color: #000000ff;
                font-size: 20px;
                font-weight: 500;
                margin-top: 24px;
              " v-if="nowData.chart">
            {{ nowData.chart.title }}
          </div>
          <div class="usedButton">
            <!-- <img class="vipIcon" src="@/assets/images/icon/vip2.svg" /> -->
            <button style="margin-top: 24px" type="primary" :class="{ 'isVip': isVip, 'nromalButton': true }"
              @click.stop="eBtnOk">
              <i v-show="isVip" class="icon po-iconfont vipIcon" v-html="'&#xe79a;'" />
              {{ computedPrice }}
            </button>
          </div>
        </div>
        <div v-html="contHtml" class="contentHtmlbox" />
      </div>
    </template>
  </popSlots>
</template>
  
<script>
import popSlots from "./dlgSlots.vue";
export default {
  name: "dlgViewTemplate",
  components: {
    popSlots,
  },
  props: {
    parentSelf: {
      type: Object,
      default: () => { },
    },
    pms: {
      type: Object,
      default: Object,
    },
    // ,
    // dlgName: {
    //   type: String,
    //   default: '请确认'
    // },
    // successName: {
    //   type: String,
    //   default: '确定'
    // }
  },
  data() {
    return {
      fileName: "",
      nowData: {},
      dlgName: "请确认",
      successName: "确定",
      contHtml: "",
    };
  },
  computed: {
    computedPrice() {
      if (
        this.nowData.chart &&
        !this.nowData.chart.ownerId &&
        this.nowData.chart.publicClonePrice > 0
      ) {
        return `VIP免费使用`;
      }

      if (
        this.nowData.chart &&
        this.nowData.chart.publicClonePrice &&
        this.nowData.chart.publicClonePrice > 0
      ) {
        return `使用 (￥${this.nowData.chart.publicClonePrice})`;
      } else {
        return "免费使用";
      }
    },
    isVip() {
      return (
        this.nowData.chart &&
        !this.nowData.chart.ownerId &&
        !this.nowData.chart.owner &&
        this.nowData.chart.publicClonePrice > 0
      );
    },
  },
  created() {
    this.$nextTick(() => {
      this.dlgInit(this.pms);
    });
  },
  // 销毁事件
  destroyed() {
    this.$emit("toDestroys", this.popName);
  },
  mounted() {
    const _this = this;
    // this.$menvHook({
    //   type: "set",
    //   envName: "click",
    //   hookName: "dlgViewTemplate",
    //   fn: (e) => {
    //     const isSelf =
    //       document.getElementById("dlgViewTemplate") &&
    //       document.getElementById("dlgViewTemplate").contains(e.target);
    //     document.getElementById("window-mask") && !isSelf && _this.eDlgClose();
    //   },
    // });
  },
  destroyed() {
    this.$menvHookDel("dlgViewTemplate", "click");
  },
  methods: {
    /** 内部方法-start */
    // 弹窗关闭
    eDlgClose() {
      this.parentSelf.emDigShow({
        name: "dlgViewTemplate",
        value: false,
      });
      // 特殊处理
      typeof this.nowData.eCancel === "function" && this.nowData.eCancel();
    },
    // 按钮确认
    eBtnOk() {
      typeof this.nowData.useTemplate === "function" &&
        this.nowData.useTemplate(this.isVip || false);
      this.eDlgClose();
    },
    // 按钮取消
    eBtnCancel() {
      this.eDlgClose();
    },
    /** 内部方法-end */
    // 弹窗初始化
    dlgInit(pms) {
      // this.fileName = pms.nowDoFileData.title
      this.nowData = pms;
      this.contHtml = pms.contHtml;
      this.dlgName = pms.dlgName ? pms.dlgName : "请确认";
      this.successName = pms.successName ? pms.successName : "确定";
    },
  },
};
</script>
  
<style scoped>
.dlgNameTemplate {
  color: #212930ff;
  font-size: 18px;
  font-weight: 400;
  box-shadow: inset 0 -1px 0 0 #e9edf2ff;
  padding: 0 24px;
  margin: 0 -24px;
}

.contentHtmlbox {
  border: 1px solid #e9edf2ff;
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 640px;
  background: #fff;
}

.usedButton {
  position: relative;
  font-weight: bold;
  font-size: 14px;
}

.nromalButton {
  width: 120px;
}

.vipIcon {
  position: absolute;
  width: 32px;
  color: #f93;
  bottom: -9px;
  left: -13px;
  z-index: 2;
  font-weight: 500;
  font-size: 15px !important;
}

.isVip {
  color: #985A10;
  font-weight: bold;
  background: linear-gradient(223.8deg, #ffc988 0%, #ffe4c2 100%);

}

.isVip:hover {
  background: linear-gradient(223.8deg, #ffc988 0%, #ffe4c2 100%);
}

.vipIcon {
  position: absolute;
  top: 15px;
  left: 0px;
  color: #985A10;
}

.nromalButton {
  background: #067bef;
  color: #fff;
  height: 30px;
  cursor: pointer;
  display: inline-block;
  vertical-align: middle;
  outline: none;
  border: none;
  font-size: 13px;
  line-height: 26px;
  text-align: center;
  text-decoration: none;
  border-radius: 4px;
  box-sizing: border-box;
  position: relative;
  background: #067bef;
  color: #fff;
}
</style>
  