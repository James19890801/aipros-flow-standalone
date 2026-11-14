import popSlots from "../dlgSlots.vue"
import PoButton from '../po-button.vue'
// import Import from './import.js'
import "../../../../../plug_in/mermaid-parse.js"
import "./../../../../../plug_in/mdImportSdk.js"
import { Toast } from './../../../../class.js'
export default {
  name: "dlgImport",
  components: {
    popSlots,
    PoButton
  },
  props: {
    rootSelf: {
      type: Object,
      default: () => { }
    },
    parentSelf: {
      type: Object,
      default: () => { }
    },
    pms: {
      type: Object,
      default: Object
    }
  },
  data() {
    return {
      name: 'dlgImport',
      dlgName: "文件导入",
      btnName: "添加文件",
      form: {
        folderName: ''
      },
      nowData: {},
      exportType: "drag",
      mubuUrl: "",
      //  https://mubu.com/doc/3rPpsVB8cRq
      // 导入类型
      pointSource: '',
      inputContent: '',
      canCreat: true
    }
  },
  computed: {
  },
  created() {
    // 初始化创建也可以用
    let ts = this
    this.$nextTick(() => {
      this.dlgInit(this.pms)
    })
    window.v5VueCom = this
    // Import.importInit()
  },
  // 销毁事件
  destroyed() {
    this.$emit("toDestroys", this.name)
  },
  methods: {
    handleInput(event) {
      this.inputContent = event.target.value;
    },
    handleUpload() {
      this.$refs.fileInput.click();
    },
    didClickCreatButton(event) {
      event.preventDefault();

      if (this.inputContent.length == 0 || !this.canCreat) return
      if (this.exportType == 'Markdown') {
        mdToPosm({ value: this.inputContent }).then((result) => {
          // 成功处理
          minder.saveToCache([result.elements], 'md', '未命名文件').then((resPath) => {
            minder.toEditor('mind_free', resPath, '未命名文件')
          }).catch(() => {
            new Toast({ type: "error", msg: "文档无法解析" });
          })
          this.canCreat = true;
        }).catch((error) => {
          // 失败处理
          new Toast({ type: "error", msg: "文档无法解析" });
          this.canCreat = true;
        })
      } else {
        const parse = new MermaidParser()
        parse.parse({ value: this.inputContent, type: 'text' }).then((res) => {
          const def = {
            page: {
              backgroundColor: "transparent", width: 1050, height: 1000, padding: 20,
              showGrid: true, gridSize: 15, orientation: "portrait", lineJumps: false
            }, version: 0,...res
          }
          minder.saveToCache([def], 'mermaid', '未命名文件').then((resPath) => {
            minder.toEditor('flow', resPath, '未命名文件')
          }).catch(() => {
            new Toast({ type: "error", msg: "文档无法解析" });
          })
          this.canCreat = true;
        }).catch(err => {
          console.log(err)
          new Toast({ type: "error", msg: "文档无法解析" });
          this.canCreat = true;
        })
      }
      setTimeout(() => {
        this.canCreat = true;
      }, 5000)
    },
    mubuexport(e) {
      if (e.keyCode == '13') {
        document.getElementById("importmubu_btn").click();
      }
    },
    exportTab(type) {
      this.exportType = type;
    },
    /** 内部方法-start */
    // 弹窗关闭
    eDlgClose(dlgName) {
			$('#importRootCover').hide()
      window.VueImportRoot = null
      window.VueImportApp.unmount()
    },
    // 按钮确认
    eBtnOk() {
      this.eDlgClose()
      if (!this.$formCheck.isNull(this.form.folderName)) {
        this.$refs['inputFileName'].focus()
        return false
      }
      this.toDlgUpdate()
    },
    // 按钮取消
    eBtnCancel() {
      this.eDlgClose()
    },
    einputKeyup(e) {
      if (e.keyCode === 13) {
        this.eBtnOk()
      }
    },
    /** 内部方法-end */

    // 弹窗初始化
    dlgInit(pms) {
      this.name = pms.name
      this.nowData = pms
      this.pointSource = this.nowData.pointSource
    },
    // 接口
    toDlgUpdate() {
      // 成功回调
      typeof this.nowData.eSuccess === 'function' && this.nowData.eSuccess({
        name: this.name,
        pms: {
          form: this.form,
          _this: this
        }
      })
    }
  }
}