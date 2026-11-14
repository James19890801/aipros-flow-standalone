import axios from 'axios';
// import { getCurrentInstance } from 'vue';
import UserOperation from "@/assets/js/pc/db/user.js"
import { Toast } from "@/assets/js/pc/class.js";
let _before, _error, _success, _complete;


function checkNomal(res, notice, noticeDom, noTips) {
    // const instance = getCurrentInstance();
    // const globalMethod = instance.appContext.config.globalProperties.$addComponents;

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
            $globalTopTip(noticeData)
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
                // Vue.$globalTopTip(_noticeData)
            }
        }
        switch (res.data.code) {
            case '408': // 鉴权失败
            case '407': // 无效签名
            case '403': // 无效用户标识
                // Vue.$loginOut()
                break
            case '411': // 不在授权范围内
                // Vue.$jumpTo404(411);
                break

        }
        return false
    }
    return true
}
export function init(options) {
    let options2 = typeof options === 'object' ? options : {}
    const defaultOptions = {
        before(apiOptions) {
        },
        error(err, config) {

            const rcode = err.request.status
            switch (rcode) {
                case 404:
                case 401:
                case 403:
                case 411:
                    try {
                        new Toast({ type: "error", msg: "服务器异常" });
                    } catch (error) {
                        //
                    }
                    break;
                default:
                    if (rcode >= 500) {
                        // 服务器错误
                        // errorJump.jumpTo404();
                        try {
                            new Toast({ type: "error", msg: "服务器异常" });
                        } catch (error) {
                            //
                        }
                    } else if (rcode < 200 || rcode > 300) {
                        // 其他错误
                    }
            }
            // 统一跳转到登录页
            // Vue.$jumpToLogin()
        },
        success() {

        },
        complete() {

        }
    };
    let newObj = {}
    options2 = Object.assign(newObj, defaultOptions, options);
    _before = options2.before;
    _error = options2.error;
    _success = options2.success;
    _complete = options2.complete;
}
init();

function handleError(err, config) {
    const isCanceled = err && err.message && err.message.canceled;
    if (isCanceled) return;
    _error(err, config);
}

const instance = axios.create();
// instance.defaults.headers.put['Content-Type'] = 'application/x-www-form-urlencoded';
instance.defaults.headers.get['Cache-Control'] = 'no-cache';
instance.defaults.headers.get['Pragma'] = 'no-cache';
instance.defaults.timeout = 50000;
const CancelToken = axios.CancelToken;
let cancels = [];
const singleRequestObj = {};//  防止多次请求存储请求的cancel方法
const request = (url = '', data = {}, method = 'get', options = {}) => {
    const { isCancelRepeatRequest = true } = options;
    // 
    let cancel;
    const basicConfig = {
        method,
        url,
        cancelToken: new CancelToken(c => {
            cancels.push(c);
            cancel = c;
        })
    };
    let config = basicConfig;
    let headers = {}

    // 只针对GET
    let _CancelUrl = url
    if (method === 'get') {
        _CancelUrl = url + JSON.stringify(data)
    }

    // autoToken
    if (typeof options.needToken === 'boolean' && options.needToken) {
        headers['token'] = UserOperation.getToken()
    }
    // get请求
    if (method === 'get') {
        if (JSON.stringify(data) !== '{}') {
            config.params = data;
        }
    } else {
        //  post请求 设置默认值
        headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
        if (JSON.stringify(data) !== '{}') {
            config.data = data;
        }
        if (options.isJson) {
            headers['Content-Type'] = 'application/json'
        }
        if (options.isFormData) {
            headers['Content-Type'] = 'multipart/form-data'
        }
    }
    // 自定义headers
    if (typeof options.headers === 'object') {
        // config.headers = options.headers
        for (let i in options.headers) {
            headers[i] = options.headers[i]
        }
    }
    // 默认处理
    config.headers = headers
    // post处理
    if (method === 'post' && typeof data === 'object' && data && !options.isUpload && !options.isJson && !options.isFormData) {
        let i, _data = ''
        for (i in data) {
            let _nd = data[i]
            if (typeof _nd === "string" && _nd.indexOf("&" > -1)) {
                _nd = _nd.replace(/\&/g, "%26")
            }
            _data += i + '=' + _nd + '&'
        }
        _data = _data.substr(0, _data.length - 1)
        config.data = _data
    }
    // upload
    if (options.isUpload || options.isJson || options.isFormData) {
        config.data = data
    }
    // onlyData
    if (typeof options.onlyData === 'boolean' && options.onlyData) {
        config.onlyData = true
    }
    const complete = () => {
        if (singleRequestObj[_CancelUrl]) {
            delete singleRequestObj[_CancelUrl];
        }
    };
    if (singleRequestObj[_CancelUrl] && isCancelRepeatRequest) {
        // 防止重复请求
        singleRequestObj[_CancelUrl]({ canceled: true });
    }
    _before(options);
    const request = new Promise((resolve, reject) => {
        singleRequestObj[_CancelUrl] = cancel;
        instance(config).then(res => {
            // 处理接口接口正常请求，但是非200状态，非登录状态
            if (!options.noCheck && !checkNomal(res, null, null, options.noTips)) {
                reject(res);
                return false
            }
            if (config.onlyData) {
                resolve(res.data);
            } else {
                resolve(res);
            }
            // 系统处理
            complete();
            _success(res);
            _complete();
        })
            .catch(err => {
                
                if (err.message.cancel) {
                    return false;
                }
                // resolve(err);// 这样系统会吞掉err，业务层面就不用再写catch方法处理异常了
                complete();
                // 处理接口非正常请求 400 500状态
                !options.noCheck && handleError(err, config);// 可以把请求信息抛出去
                _complete();
                // 处理业务层需要强制判断接口状态
                options.noCheck && reject(err);

            });
    });
    request.cancel = cancel;
    return request;
};

export const fetch = options => {
    return {
        get(url, data) {
            return request(url, data, 'get', options);
        },
        post(url, data) {
            return request(url, data, 'post', options);
        },
        put(url, data) {
            return request(url, data, 'put', options);
        },
        delete(url, data) {
            return request(url, data, 'delete', options);
        }
    };
};

export const cancelAllRequest = () => {
    cancels.forEach(cancel => cancel({ canceled: true }));
    cancels = [];
};





