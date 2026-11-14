<template>
  <div v-if="charts">
    <div class="tempaleGridWarp" ref="grid">
      <div class="templateItem" v-for="chart in charts" :key="charts.chartId" @mouseenter="isLised(chart)">
        <div class="templateContent" :style="`height: ${fixHight}`">
          <div class="item-module">
            <div class="item-module-img hover">
              <div class="item-module-img-item" v-imgError :data-src="$getThumbForBgClass(chart)"
                :style="{ backgroundImage: `url(${$getThumbForBgClass(chart)})` }" />
              <div class="item-shade" @click.stop="toView(chart)">
                <div class="collet-btn">
                  <!-- <span class="iconfont icon-xingbiao--tianchong"></span>收藏  -->
                  <span v-if="chart.favourite" class="iconfont shoucang icon-xingbiao--tianchong"
                    @click.stop="estart(chart)">
                    收藏</span>
                  <span v-if="!chart.favourite" class="iconfont shoucang icon-xingbiao" @click.stop="estart(chart)">
                    收藏</span>
                  <!-- <span v-if="chart.favourite" class="po-star po-iconfont is-active" @click.stop="eStar(item)">&#xe71e;</span>
                                    <span v-if="!chart.favourite && StateNav.pageName !== 'trash'" class="po-star po-iconfont" @click.stop="eStar(item)">&#xe711;</span> -->
                </div>
                <div v-if="!chart.ownerId && !chart.owner && chart.publicClonePrice > 0" class="clone-btn clone-btn-vip"
                  @click.stop="handleCloneTemplate(chart)">
                  <i class="icon po-iconfont" v-html="'&#xe75e;'" style="margin-top:2px;margin-right: 5px;" /> VIP免费使用
                </div>
                <div class="clone-btn" @click.stop="handleCloneTemplate(chart)"
                  v-else-if="chart.publicClonePrice != null && chart.publicClonePrice > 0">
                  使用 ￥{{ chart.publicClonePrice }}
                </div>

                <div v-else class="clone-btn" @click.stop="handleCloneTemplate(chart)">
                  免费使用
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="templateFooter">
          <div class="templateFooter-title">{{ chart.title }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { apiNewFiles, apiFavouriteChart } from "@/assets/js/pc/useIndex/tempCreate/api/template";
import { isLiked } from "@/assets/js/pc/useIndex/tempCreate/api/template";
import { $observeEl, $unobserveEl } from './utils'
let ob = null;

export default {
  name: "templatePods",
  // mixins:[ListMixin],
  data() {
    return {
      fixHight: 0,
      defaultBg: 'src/assets/images/tempCreate/defaultBg.png',
    };
  },
  props: {
    charts: {
      type: Array,
      default: () => [],
    },
    keyword: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "",
    },
  },
  watch: {
    keyword(n, o) {
      if (n !== o) {
        // 初始化一下高度
        this.handlefixHeight();
      }
    },
    charts(n, o) {
      if (n !== o) {
        // 重新绑定webapi
        this.$nextTick(() => {
          ob.disconnect();
          this.observerBg();
        });
      }
    },
  },
  // directives: {
  //     resize,
  // },
  computed: {
    isCategory: function () {
      return this.$route.path === "/category";
    },
  },
  create() {

  },
  mounted() {
    $observeEl(this.$refs["grid"], this.onResize);
    this.observerBg();
    // console.log('mounted')
    // ipc.on('useTemplate', (e, info) => {
    //   this.handleCloneTemplate(JSON.parse(info), "dlg");
    // })
    // this.$loadJs(["/static/js/util.js", "/static/js/qrcode.js"], function () {
    //   // window.importExport()
    // });
  },
  beforeDestroy() {
    ipc.off('useTemplate')
    $unobserveEl(this.$refs["grid"]);
  },
  methods: {
    /**
     * @deprecated
     * web api InertsectionObserver dom 和 指定视口相交触发
     * root:哪个视口
     * rootMargin:扩大范围 px
     * threshold:dom显露比例(0-1)
     */
    observerBg() {
      ob = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.style.backgroundImage = img.dataset.src;
              ob.unobserve(img);
            }
          }
        },
        {
          root: null,
          threshold: 0,
        }
      );
      const imgs = document.querySelectorAll("div[data-src]");
      imgs.forEach((i) => {
        ob.observe(i);
      });
    },
    onResize() {
      this.handlefixHeight();
    },
    handlefixHeight() {
      const homeDom = document.querySelector(".templateItem")
      let homeCardWidth, CategoryCardWidth;
      if (homeDom) {
        const { width = 0 } = window.getComputedStyle(
          document.querySelector(".templateItem")
        );
        homeCardWidth = width
      }
      const cateDom = document.querySelector(".queryCategoryContent .templateItem")
      if (cateDom) {
        const { width = 0 } = window.getComputedStyle(
          cateDom
        );
        CategoryCardWidth = width
      }
      this.$nextTick(() => {
        this.fixHight = CategoryCardWidth || homeCardWidth
      })

    },
    estart(item) {
      if (!navigator.onLine) {
        new Toast({ type: 'warning', msg: "网络已断开请检查网络", autoClose: true })
        return
      }
      let chartType = this.$checkFileType(item);
      const that = this
      apiFavouriteChart(item.chartId, chartType).then((res) => {
        if (!this.$apiCheck.checkNomal(res)) {
          return false;
        }
        // 星标
        if (!item.favourite) {
          new Toast({ type: "success", msg: "收藏成功" })
          item.favourite = true
        } else {
          item.favourite = false
          new Toast({ msg: "取消成功" })
        }
      });
    },
    checkCloneType(sourceChartId) {
      const _this = this;
      return new Promise((resolve, reject) => {
        // const {
        //   state: {
        //     StateUser: {
        //       userInfo: { auth: { teamId = "", orgId = "" } } = {},
        //     } = {},
        //   } = {},
        // } = this.$store;
        const { teamId = '', orgId = '' } = JSON.parse(localStorage.getItem("authInfo"))
        const { host } = ipc.sendSync('getHost')
        $.ajax({
          // url:"/diagraming/clone_check",
          type: "post",
          url: host + "/api/personal/diagraming/clone_check",
          data: { chartId: sourceChartId, teamId: teamId, orgId: orgId },
          headers: {
            token: _this.$getToken(),
          },
          success: function (res) {
            console.log(res);
            if (res.code === "200") {
              resolve(res.data);
            } else {
              _this.$globalTopTip({
                content: "数据异常,请稍后再试",
                type: "error",
              });
              return reject();
            }
          },
        });
      });
    },
    getPayType(item) {
      if (!item.ownerId && !item.owner && item.publicClonePrice > 0) {
        return "会员免费";
      }
      if (item.publicClonePrice && item.publicClonePrice > 0) {
        return "付费";
      }
      if (!item.publicClonePrice || item.publicClonePrice === 0) {
        return "免费";
      }
    },

    cloneTemplate({ item, isDlg = false, category, sourceChartId }) {
      let _this = this;
      let cloneNewData = { chartId: sourceChartId, category };
      if(navigator.onLine){        
				const auto_upload = localStorage.getItem('auto_upload')
				if (auto_upload && auto_upload == '1') {
          const folderId = pageContext.data.dirs[pageContext.data.dirs.length-1]?.id || 'root'
          apiNewFiles(folderId, category, sourceChartId).then((res) => {
            if(res.data.code == "913" || res.data.code === "815" || res.data.code === "509"){
              new Toast({msg:res.data.msg, autoClose: true })
              return
            }
            if (!_this.$apiCheck.checkNomal(res)) {
              return false;
            }
            cloneNewData = res.data.data.chart;
            // cloneNewData._id = cloneNewData.chartId;
            // todo
            pcUtil.openWin({
              url: this.$getFileUrl(cloneNewData),
              title: cloneNewData.title
            })

          });
        }
        else {
            pcUtil.openWin({
              url: this.$getFileUrl(cloneNewData),
              title: cloneNewData.title
            })
        }
      }
      else {
          pcUtil.openWin({
            url: this.$getFileUrl(cloneNewData),
            title: cloneNewData.title
          })
      }
    },
    payTemplate(
      { price, category, id: sourceChartId, memberFree, ownerId, title },
      isDlg = false,
      item
    ) {
      const _this = this;
      ipc.once("showPayTemplate_callback", (e, msg) => {
        console.log("payTemplate_callback", msg)
        console.log("ok");
        _this.cloneTemplate({ item, isDlg, category, sourceChartId });
      })
      ipc.sendToHost("showPayTemplate",{sourceChartId,price,title,isDlg,memberFree,ownerId})

      // new Pay({
      //   id: sourceChartId,
      //   price: price,
      //   pay_type: "", //  designer--编辑页支付模板 / ""
      //   pay_cteamId: "",
      //   memberFree,
      //   ownerId,
      //   chartTitle: title,
      //   from: isDlg ? "templateCreateView" : "templateCreate",
      //   errorFn: function (e) { },
      //   successFn: function (res) {

      //   },
      // });
      // buried_point_fn("click", "template_pay_show", "模板页", {
      //   弹窗名称: "模板支付",
      // });
    },
    toPay() {
      Window.vueP0Notification.eToPay();
    },
    async handleCloneTemplate(item, type = "") {
      let sourceChartId = item.chartId;
      let category = item.category;
      if (!navigator.onLine) {
        new Toast({ type: 'warning', msg: "网络已断开请检查网络", autoClose: true })
        return
      }
      const { result = "", price = undefined } = await this.checkCloneType(
        sourceChartId
      );
      console.log(result)
      if (!result) {
        this.$globalTopTip({
          content: "操作有误，请稍后再试",
          type: "error",
        });
      }
      // 超过文件数
      if (result === "overd") {
        console.log("overd")
        const isVip = !item.ownerId && !item.owner && item.publicClonePrice > 0
        const isClonePayButOverd = item.ownerId && item.publicClonePrice != null && item.publicClonePrice > 0
        const that = this
        if (isVip) {
          // ipc.send('openPopup')
          const pay_position = `newfile-template-viptem`
          window.poCollect('展示支付弹窗',{'触发位置':'VIP模版'})
          pageContext.files.showPayWin({
            pay_position
          })
        } else if (isClonePayButOverd) {
          // 5 类型是点击继续创建需要支付模版 

          ipc.once("isClonePayButOverd", () => {
            that.payTemplate(
              {
                price: item.publicClonePrice,
                category,
                id: sourceChartId,
                ownerId: item.ownerId,
                title: item.title,
                memberFree: !item.ownerId && !item.owner,
              },
              type === "dlg",
              item
            );
          })
          ipc.sendToHost('upgradeDlg', { dlgType: 5, pay_position:`newfile-template-ins`})

        } else {
          ipc.sendToHost('upgradeDlg', { dlgType: 1, tempId: sourceChartId, category, type: category,pay_position:`newfile-template-ins` })
        }

        // Window.vueP0Notification.eToPay("升级畅享VIP会员模板资源和更多权益", {
        //   pointPosition: "使用模板_文件数不足",
        //   页面模块: "模板新建模块",
        // });
      }
      // 免费|会员免费 直接clone
      if (result == "clone") {
        this.cloneTemplate({
          item,
          isDlg: type === "dlg",
          category,
          sourceChartId,
        });
      }
      // 付费
      if (result == "cloneBuy") {
        if (!item.ownerId && !item.owner && item.publicClonePrice > 0) {
          pageContext.files.showPayWin({pay_position:''})
          return
        }
        this.payTemplate(
          {
            price,
            category,
            id: sourceChartId,
            ownerId: item.ownerId,
            title: item.title,
            memberFree: !item.ownerId && !item.owner,
          },
          type === "dlg",
          item
        );
      }

      if (result === "chart_error") {
        this.$globalTopTip({
          content:
            "很抱歉，该模板已被作者取消公开或删除。请继续浏览并使用其他模板～",
          type: "error",
        });
      }
    },
    toView(info) {
      if (!navigator.onLine) {
        new Toast({ type: 'warning', msg: "网络已断开请检查网络", autoClose: true })
        return
      }
      const cate = (info.category.indexOf("mind") > -1 || ['fishbone', 'timeline', 'ishikawa'].includes(info.category)) ? "mind" :
        info.category.indexOf("outline") > -1 ? "outline" : "flow";
      const { host } = ipc.sendSync('getHost')
      const url = `${host}/editor/view/${cate}?fromnew=1&isTemp=true&chartId=${info.chartId}`
      const btnTitle = () => {
        if (

          !info.ownerId &&
          info.publicClonePrice > 0
        ) {
          return `VIP免费使用`;
        }

        if (
          info &&
          info.publicClonePrice &&
          info.publicClonePrice > 0
        ) {
          return `使用 (￥${info.publicClonePrice})`;
        } else {
          return "免费使用";
        }
      }
      ipc.sendToHost("dlgViewTemplate", url, info.title, btnTitle(), JSON.stringify(info))



      // const popMainInstance = this.$getComponents('popMain')
      // popMainInstance.dlgToShow('dlgViewTemplate', {
      //   name: "dlgViewTemplate",
      //   dlgName: "模板预览",
      //   chart: info,
      //   contHtml: `<iframe width="100%" height="100%" src="${host}/editor/view/${cate}?fromnew=1&amp;isTemp=true&amp;chartId=${info.chartId
      //     }" frameborder="0"></iframe>`,
      //   useTemplate: () => {
      //     this.handleCloneTemplate(info, "dlg");
      //   }
      // })
      $('#root').css({ zIndex: 3 })
    },
    isLised(chart) {
      //是否收藏
      const that = this
        isLiked({
          chartId: chart.chartId,
          userid: localStorage.getItem('processon_userKey'),
        }).then((res) => {
          if (res.code === "200") {
            const {
              data: { liked },
            } = res;
            chart.favourite = liked
            // that.$set(chart, "favourite", liked);
          }
        });
    },
  },
};
</script>
<style scoped>
.tempaleGridWarp {
  display: grid;
  grid-gap: 24px;
  grid-template-columns: repeat(auto-fill, minmax(13.38rem, 1fr));
}

@media screen and (min-width: 780px) {
  .tempaleGridWarp {
    grid-template-columns: repeat(4, minmax(11.38rem, 1fr)) !important;
  }
}

@media screen and (min-width: 1050px) {
  .tempaleGridWarp {
    grid-template-columns: repeat(5, minmax(11.67rem, 1fr)) !important;
  }
}

@media screen and (min-width: 1440px) {
  .tempaleGridWarp {
    grid-template-columns: repeat(6, minmax(13.38rem, 1fr)) !important;
  }
}

@media screen and (min-width: 1870px) {
  .tempaleGridWarp {
    grid-template-columns: repeat(auto-fill, minmax(13.38rem, 1fr)) !important;
  }
}

.templateItem {
  width: 100%;
  height: 100%;
  background: #fff;
  box-shadow: 0 0.08rem 0.38rem 0 #2129301a;
  border-radius: 4px;
  box-sizing: border-box;
  cursor: pointer;
  overflow: hidden;

}

.templateContent {
  opacity: 1;
  padding: 0.54rem 0.54rem 0 0.54rem;
}

.templateFooter {
  height: 3.15rem;
  width: 100%;
  display: flex;
  align-items: end;
  justify-content: space-between;
}

.templateFooter-title {
  color: #212930ff;
  font-size: 13px;
  font-weight: 400;
  font-family: "PingFang SC";
  max-width: calc(100% - 41px);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  margin: 0 0 0.62rem 0.62rem;
}

.templateFooter-tag {
  background: none;
  font-size: 13px;
  height: 20px;
  line-height: 21px;
  color: #9aa5b8;
  transform: scale(0.8);
  transform-origin: bottom;
  border: 1px solid #dfe2e5;
  padding: 0 5px;
}

.item-shade {
  display: none;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  position: absolute;
  top: 0;
  left: 0;
  font-size: 12px;
  color: #fff;
  text-align: center;
  border-radius: 0.15rem;
}

.collet-btn {
  float: right;
  margin: 7px 7px 0 0;
  width: 60px;
  height: 25px;
  line-height: 25px;
  background: rgba(0, 0, 0, 0.49);
  border-radius: 4px;
}

.clone-btn {
  width: 80%;
  height: 32px;
  line-height: 32px;
  background: #067bef;
  border-radius: 4px;
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clone-btn:hover {
  background: #1f88f1;
}

.clone-btn-vip {
  color: #985A10;
  font-weight: 500;
  background: linear-gradient(223.8deg, #ffc988 0%, #ffe4c2 100%);
}

.clone-btn-vip:hover {
  filter: brightness(1.02);
  background: linear-gradient(223.8deg, #ffc988 0%, #ffe4c2 100%);
}

.item-module {
  width: 100%;
  height: 100%;
}

.item-module-img {
  height: 100%;
  position: relative;
  margin: 0 auto;
  overflow: hidden;
  background-position: 50%;
  background-size: contain;
  background-repeat: no-repeat;
}

.item-module-img-item {
  width: 100%;
  height: 100%;
  background-position: 50%;
  background-size: contain;
  background-repeat: no-repeat;
}

.item-module-img .item-shade {
  display: none;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.1);
  position: absolute;
  top: 0;
  left: 0;
  font-size: 12px;
  color: #fff;
  text-align: center;
  overflow: hidden;
}

.item-module-img:hover .item-shade {
  display: block;
  z-index: 2;
}

.shoucang {
  justify-content: center;
  align-items: center;
  display: flex;
  color: #ffffffff;
  font-size: 12px;
  font-weight: 400;
}

.shoucang::before {
  font-size: 15px;
  margin-right: 3px;
}

.icon-xingbiao--tianchong::before {
  color: #ff9933;
}

.templateItem:hover {
  transform: translateY(-2px);
  transition: all 0.3s;
}

.templateContent:hover {
  box-shadow: none;
}

.temp-tag {
  position: absolute;
  top: 4px;
  left: 4px;
  display: inline-block;
  padding: 0 1px;
  background: #ffaf1b;
  color: #ffffff;
  height: 16px;
  line-height: 16px;
  font-weight: 700;
  text-align: center;
  font-size: 13px;
  border-radius: 2px;
  transform: scale(0.8);
  -webkit-transform: scale(0.8);
  -moz-transform: scale(0.8);
  -ms-transform: scale(0.8);
  -o-transform: scale(0.8);
  transform-origin: 0 0;
}
</style>
