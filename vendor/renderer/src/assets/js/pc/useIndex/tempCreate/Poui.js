let globalVueData = {
  components: {}
}
// 公用方法与属性
let fns = {
  $type: (obj) => {
    if (obj === null) {
      return obj + ''
    }
    let temp = Object.prototype.toString.call(obj)
    temp = temp.substring(1, temp.length - 1).toLowerCase()
    return temp.split(' ')[1]
  },
  trim(text) {
    return text === null ? '' : (text + '').replace(rtrim, '')
  },
  // dom对象方法
  domMethods: {
    // 获取dom宽
    getWidth(dom, isOffset) {
      let _isOffset = typeof isOffset === 'undefined' ? false : isOffset
      return !_isOffset ? dom.clientWidth : dom.offsetWidth
    },
    // 获取dom高
    getHeight(dom, isOffset) {
      let _isOffset = typeof isOffset === 'undefined' ? false : isOffset
      return !_isOffset ? dom.clientHeight : dom.offsetHeight
    },
  },
  //自动校验style的值
  checkStyleValue(styleName, value) {
    if (!styleName || !value) { return ""; }

    if (typeof value == "number") {
      switch (styleName) {
        case "width":
          value += "px";
          break;
        case "height":
          value += "px";
          break;
        case "top":
          value += "px";
          break;
        case "bottom":
          value += "px";
          break;
        case "left":
          value += "px";
          break;
        case "right":
          value += "px";
          break;
      }
    }

    return value;
  },
  // first you know, the form check methods, if it's ok, the return value must be `true`
  formCheck: {
    isNull(val) {
      if (fns.trim(val) === '') {
        return false
      }
      return true
    },
    isMobile(str) {
      let re = /^1\d{10}$/
      if (re.test(str)) {
        return true
      } else {
        return false
      }
    },
    isTelephone(str) {
      let re = /^0\d{2,3}-?\d{7,8}$/
      if (re.test(str)) {
        return true
      } else {
        return false
      }
    },
    isMail(str) {
      let re = /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/
      if (re.test(str)) {
        return true
      } else {
        return false
      }
    },
    isCardNo: function (str) {
      // 身份证号码为15位或者18位，15位时全为数字，18位前17位为数字，最后一位是校验位，可能为数字或字符X 
      let reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
      if (reg.test(str) === false) {
        return false;
      }
      return true
    },
    isPrice: function (str) {
      let reg = /^(([1-9]\d*)|0)(\.\d{1,2})?$/
      return reg.test(str)
    }
  },
  // for api callback
  apiCheck: {
    // 一般接口回调
    checkNomal(res, notice, noticeDom, noTips) {
      notice = typeof notice === 'undefined' || notice === null ? '接口异常' : notice
      let noticeData = {}
      let _this = this
      noticeData.type = 'error'
      if (res.status !== 200) {
        noticeData.content = notice
        if (noticeDom) {
          noticeData.topdom = noticeDom
        }
        if (!noTips) {
          // Vue.$globalTopTip(noticeData)
          new Toast(noticeData)
        }

        return false
      }
      if (res.status === 200 && res.data.code !== '200') {
        noticeData.content = res.data.msg
        if (noticeDom) {
          noticeData.topdom = noticeDom
        }
        if (!noTips) {
          let _noticeData = noticeData
          // 白名单
          if (res.data.code != 411) {
            if (res.data.code == 429) {
              _noticeData = '请求过于频繁，请稍后再试'
            }
            if (res.data.code == '61672') {
              _noticeData.content = '您的账号因违反《ProcessOn服务条款-内容发布以及使用权》，已被限制相关功能及权益'
            }
            new Toast(_noticeData)
          }
        }
        switch (res.data.code) {
          case '408': // 鉴权失败
          case '407': // 无效签名
          case '403': // 无效用户标识
            Vue.$loginOut()
            break
          case '411': // 不在授权范围内
            Vue.$jumpTo404(411);
            break

        }
        return false
      }
      return true
    }
  },
  // com do something
  // register
  addComponents(comName, comOb) {
    comData.components[comName] = comOb
  },
  // get
  getComponents(comName) {
    return comData.components[comName]
  },
  // com do something - end
  /**
   * 获得host
   * @param {*} type 
   * default[默认],edit[编辑器]
   * @returns 
   */
  getHost(type) {
    let source = typeof type === 'undefined' ? 'default' : type
    let rtn = ''
    rtn = location.protocol + "//" + location.hostname
    // 测试环境
    if (location.port !== '') {
      // 识别本地开发
      if (location.port === '8686') {
        switch (source) {
          case "edit":
            rtn = "http://192.168.10.135"
            break;
          case "img":
          case "old": // 历史站点
            rtn = 'http://120.131.13.249'
            break;
          case 'face': // 头像
            rtn = "http://192.168.10.135"
            break;
          case 'login': // 登录页
            rtn = "http://192.168.10.135"
            break;
          default:
            rtn += (":" + location.port)
        }
      } else {
        // 其他代理有端口的
        rtn += (":" + location.port)
      }
    }
    return rtn
    // return "http://192.168.31.106:8080/"
    // if (location.host.indexOf('localhost') > -1) {
    //   return Configs.imgPath.dev
    // } else {
    //   return location.origin
    // }
  }
};
let globalMethods = {
  methods: {
    $addComponents(comName, comOb) {
      globalVueData.components[comName] = comOb
    },
    $getComponents(comName) {
      return globalVueData.components[comName]
    },
    $getThumbForBgClass(chart) {
      let thumbnailUrl = "https://po-img.processon.com"
      
      let _category = typeof category === 'undefined' ? chart.category : category

      let imgsrc = thumbnailUrl + "/chart_image/template/thumb/" + chart.thumbnail + ".png?tid=" + chart.chartId;
      if (_category.indexOf("board") >= 0) {
        imgsrc = chart.thumbUrl || "";
      }
      return `url(${imgsrc})`

    },
    $offset(curEle) {
      // 
      if (!curEle) return
      if (typeof curEle.getBoundingClientRect) {
        let bcr = curEle.getBoundingClientRect()
        return {
          left: bcr.left,
          top: bcr.top,
          height: bcr.height,
          width: bcr.width
        }
      }
      var totalLeft = null, totalTop = null, par = curEle.offsetParent;
      //首先把自己本身的进行累加
      totalLeft += curEle.offsetLeft;
      totalTop += curEle.offsetTop;

      //只要没有找到body，我们就把父级参照物的边框和偏移量累加
      while (par) {
        if (navigator.userAgent.indexOf("MSIE 8.0") === -1) {
          //不是标准的ie8浏览器，才进行边框累加
          //累加父级参照物边框
          totalLeft += par.clientLeft;
          totalTop += par.clientTop;
        }
        //累加父级参照物本身的偏移
        totalLeft += par.offsetLeft;
        totalTop += par.offsetTop;
        par = par.offsetParent;
      }
      return {
        left: totalLeft,
        top: totalTop,
        height: fns.domMethods.getHeight(curEle),
        width: fns.domMethods.getWidth(curEle)
      };
    },
    $setStyle(dom, pms) {
      if (!dom || fns.$type(pms) != "object") { return false; }
      let i;
      for (i in pms) {
        dom.style[i] = fns.checkStyleValue(i, pms[i]);
      }
    },
    $checkFileType(fileItem) {
      let chartType = 'chart'
      if (fileItem.publicClone && fileItem.status === 'public') {
        chartType = 'template'
      }
      return chartType
    },
    $apiCheck: fns.apiCheck,
    $getToken(){
      return localStorage.getItem('processon_token');
    },
    $globalTopTip(parms){
      new Toast(parms)
    },
    $getFileUrl(item) {
      const {url} = pageContext.getChartType(item.category)
      const {chartId} = item
      const auto_upload = localStorage.getItem('auto_upload')
      if (auto_upload && auto_upload == '1') {
        return `${url}?chartId=${chartId}&token=token&dbId=dbId`
      }
      else {
        return `${url}?chartId=&token=token&dbId=dbId&new=true&tempId=${chartId}`
      }
    }
  }
}


export default function install(app) {
  Object.keys(globalMethods.methods).forEach((methodName) => {
    app.config.globalProperties[methodName] = globalMethods.methods[methodName];
  });
}