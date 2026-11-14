(function () {
  var trackInstance = null;
  var trackLoadingPromise = null;

  var _globalParams = {
    '渠道': '',
    '设备': '',
    '版本号': '',
    '客户端版本号': '',
    '编辑器版本号': '',
    '当前渠道': '',
    '版本': 'v5',
    '会员状态': '未知',
    '会员到期时间': '暂无',
    '已使用文件数': 0,
    '限制文件量': '',
    '模板数量': 0
  };

  var _paramsInitLock = false;
  var _globalParamsReadyPromise = null;

  function initGlobalParams() {
    if (_paramsInitLock) return _globalParamsReadyPromise;
    _paramsInitLock = true;

    _globalParamsReadyPromise = new Promise(function (resolve) {
      try {
        var ua = navigator.userAgent.toLowerCase();
        if (/macintosh|macintel|mac os x/.test(ua)) {
          _globalParams['设备'] = 'osx';
        } else if (/windows|win32|win64|wow32/.test(ua)) {
          _globalParams['设备'] = 'windows';
        } else {
          _globalParams['设备'] = 'unknown';
        }
        _globalParams['渠道'] = '客户端';

        var clientVersion = '';
        var editorVersion = '';
        var channelType = 'po';
        try {
          if (window.api && window.api.ipcRenderer) {
            clientVersion = window.api.ipcRenderer.sendSync('getGlobal', 'versions') || '';
            editorVersion = window.api.ipcRenderer.sendSync('getGlobal', 'editor_version') || '';
            var CONFIG = window.api.ipcRenderer.sendSync('getGlobal', 'CONFIG');
            channelType = (CONFIG && CONFIG.CHANNELTYPE) || 'po';
          }
        } catch (e) {}

        _globalParams['版本号'] = clientVersion;
        _globalParams['客户端版本号'] = clientVersion;
        _globalParams['编辑器版本号'] = editorVersion;
        _globalParams['当前渠道'] = channelType;
        resolve();
      } catch (err) {
        console.warn('全局埋点参数初始化异常', err);
        resolve();
      }
    });

    return _globalParamsReadyPromise;
  }

  initGlobalParams();

  function waitGlobalParamsReady() {
    return _globalParamsReadyPromise || Promise.resolve();
  }

  function getGlobalParams() {
    return Object.assign({}, _globalParams);
  }

  function initDataTrack() {
    if (trackInstance) {
      return Promise.resolve(trackInstance);
    }
    if (trackLoadingPromise) {
      return trackLoadingPromise;
    }

    trackLoadingPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://ana.processon.com/datatrack.js';
      script.onload = function () {
        window.DataTrack.init({
          appKey: 'ak_b5d7dfd6498d46a9a8bfce87',
          serverUrl: 'https://ana.processon.com/api/v1/track',
          autoTrack: false,
          debug: false
        });
        trackInstance = window.DataTrack;
        resolve(trackInstance);
      };
      script.onerror = function (err) {
        reject(err);
        trackLoadingPromise = null;
      };
      (document.body || document.documentElement).appendChild(script);
    });

    return trackLoadingPromise;
  }

  var TRACK_CALLBACK_DELAY = 350;

  function invokeTrackCallback(callback, options) {
    options = options || {};
    if (typeof callback !== 'function') {
      return;
    }
    var delay = typeof options.delay === 'number' ? options.delay : TRACK_CALLBACK_DELAY;
    var run = function () {
      try {
        callback();
      } catch (err) {
        console.warn('埋点回调执行失败', err);
      }
    };
    if (delay > 0) {
      setTimeout(run, delay);
    } else {
      run();
    }
  }

  function trackEvent(eventName, props, callback) {
    props = props || {};
    return waitGlobalParamsReady().then(function () {
      var baseParams = getGlobalParams();
      var finalProps = Object.assign({}, baseParams, props);
      if (trackInstance) {
        trackInstance.track(eventName, finalProps);
        invokeTrackCallback(callback);
        return;
      }
      return initDataTrack().then(function (instance) {
        instance.track(eventName, finalProps);
        invokeTrackCallback(callback);
      });
    }).catch(function (err) {
      console.warn('DataTrack SDK加载失败，事件丢弃：', eventName, props, err);
      invokeTrackCallback(callback, { delay: 0 });
    });
  }

  function getHistoryData() {
    return new Promise(function (resolve) {
      if (!window.localStorage.getItem('processon_userKey')) {
        resolve('未知');
        return;
      }
      if (!window.api || !window.api.ipcRenderer) {
        resolve('未知');
        return;
      }
      window.api.ipcRenderer.invoke('loadFileB64', {
        type: 'cache',
        path: 'history/cache.json'
      }).then(function (res) {
        if (res.code == 201) {
          resolve('未知');
          return;
        }
        try {
          var list = JSON.parse(decodeURIComponent(escape(atob(res.data))));
          list = list.filter(function (d) {
            return d.type === 2;
          });
          resolve(list.length);
        } catch (e) {
          resolve('未知');
        }
      }).catch(function () {
        resolve('未知');
      });
    });
  }

  function userVipStatus(user) {
    if (user.member) {
      return '会员用户';
    }
    if (!user.member && user.orgMember) {
      return '团队个人版';
    }
    return user.expireTime ? '会员已到期' : '免费用户';
  }

  function buildUserMerge(user, locaFileCount) {
    var expireDate = '暂无';
    if (user.expireTime) {
      expireDate = user.expireTime.split(' ')[0] || '暂无';
    }
    return {
      '会员状态': userVipStatus(user),
      '会员到期时间': expireDate,
      '已使用文件数': Number(user.usedFileCount) || 0,
      '限制文件量': (user.member || user.orgMember) ? '不限' : (user.fileCount ?? ''),
      '本地文件数': locaFileCount != null ? locaFileCount : '未知'
    };
  }

  var EVENT_FN_TYPES = ['click', 'nomal', 'page_visit', 'page_visit_time'];

  function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function buriedPointFn(eventFn, eventName, currPage, params, params1) {
    var callback = null;

    if (EVENT_FN_TYPES.indexOf(eventFn) === -1) {
      if (isPlainObject(eventName)) {
        if (typeof currPage === 'function') {
          callback = currPage;
        }
        trackEvent(eventFn, eventName, callback);
        return;
      }
      trackEvent(eventFn, {});
      return;
    }

    var finalEventName = eventName;
    var finalProps = params || {};

    switch (eventFn) {
      case 'click':
        finalEventName = eventName;
        if (currPage) {
          finalProps['当前页面'] = currPage;
        }
        break;
      case 'nomal':
        finalEventName = eventName;
        if (currPage && typeof currPage === 'object') {
          finalProps = currPage;
        } else if (currPage) {
          finalProps['当前页面'] = currPage;
        }
        break;
      case 'page_visit':
        finalEventName = params1 && params1 !== '' ? params1 + '_page_visit' : 'page_visit';
        if (currPage && typeof currPage === 'object') {
          finalProps = currPage;
        } else if (currPage) {
          finalProps['页面名称'] = currPage;
          if (params) {
            Object.assign(finalProps, params);
          }
        }
        break;
      case 'page_visit_time':
        finalEventName = 'page_visit_time';
        if (currPage && typeof currPage === 'object') {
          finalProps = currPage;
        } else if (currPage) {
          finalProps['页面名称'] = currPage;
          if (params) {
            Object.assign(finalProps, params);
          }
        }
        break;
      default:
        finalEventName = eventName;
        break;
    }

    trackEvent(finalEventName, finalProps, callback);
  }

  function identifyUser(userId, props) {
    if (!userId) {
      return Promise.resolve();
    }
    return initDataTrack().then(function (instance) {
      instance.identify(userId, props || {});
    }).catch(function () {});
  }

  window.initDataTrack = initDataTrack;
  window.buried_point_fn = buriedPointFn;
  window.identifyUser = identifyUser;

  window.poCollect = function (name, paramObj) {
    paramObj = paramObj || {};
    if (!name || typeof paramObj !== 'object') {
      return Promise.resolve();
    }
    return new Promise(function (resolve) {
      try {
        var privilege = localStorage.getItem('privilege') || '{}';
        var user = JSON.parse(privilege);
        getHistoryData().then(function (locaFileCount) {
          var merge = buildUserMerge(user, locaFileCount);
          trackEvent(name, Object.assign({}, merge, paramObj), function () {
            resolve();
          });
        });
      } catch (e) {
        resolve();
      }
    });
  };
})();
