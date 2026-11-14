/*! Version: 1.0.0 -  2026/3/4 10:33:30. Commit: 1ddd6cf */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["SmartUIEditorSwitchShape"] = factory();
	else
		root["SmartUIEditorSwitchShape"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 56:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ }),

/***/ 72:
/***/ ((module) => {



var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ 89:
/***/ ((module) => {



/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ }),

/***/ 113:
/***/ ((module) => {



/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ }),

/***/ 248:
/***/ ((module) => {



module.exports = function (i) {
  return i[1];
};

/***/ }),

/***/ 540:
/***/ ((module) => {



/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ }),

/***/ 659:
/***/ ((module) => {



var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ }),

/***/ 705:
/***/ ((module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   A: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(248);
/* harmony import */ var _node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(89);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_noSourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `.list-wrapper {
  width: 416px;
  height: 100%;
  padding-bottom: 16px;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-top, #FFF);
  border-right: 1px solid var(--color-line-light, rgba(33, 41, 48, 0.06));
}
.list-wrapper.hide-mode {
  width: 44px;
}
.list-wrapper.hide-mode .list-header {
  padding: 16px 0;
  justify-content: center;
}
.list-wrapper.hide-mode .list-header .list-header-title,
.list-wrapper.hide-mode .list-header .list-header-container {
  display: none !important;
}
.list-wrapper.hide-mode .list-header .list-close-btn {
  display: none !important;
}
.list-wrapper.hide-mode .list-search,
.list-wrapper.hide-mode .category-list,
.list-wrapper.hide-mode .inline-list {
  display: none !important;
}
.list-wrapper .list-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  box-sizing: border-box;
}
.list-wrapper .list-header .list-header-title {
  color: var(--color-text-primary, #212930);
  text-align: center;
  font-family: "PingFang SC";
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
}
.list-wrapper .list-header .list-header-container .header-title {
  color: var(--color-text-primary, #212930);
  font-family: "PingFang SC";
  font-size: 16px;
  font-style: normal;
  font-weight: 600;
  line-height: 150%;
  /* 24px */
}
.list-wrapper .list-header .list-header-container .header-desc {
  margin-top: 4px;
  color: var(--color-text-secondary, #6C7D8F);
  font-family: "PingFang SC";
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
  line-height: 150%;
  /* 18px */
}
.list-wrapper .list-header .list-close-btn,
.list-wrapper .list-header .list-show-btn {
  width: 28px;
  height: 28px;
  text-align: center;
  line-height: 28px;
  border-radius: 4px;
}
.list-wrapper .list-header .list-close-btn:hover,
.list-wrapper .list-header .list-show-btn:hover {
  background: #0000000f;
  cursor: pointer;
}
.list-wrapper .list-header .list-show-btn {
  z-index: 9;
}
.list-wrapper .list-header .list-show-btn.hide {
  display: none;
}
.list-wrapper .list-search {
  position: relative;
  display: flex;
  margin: 0 16px 16px;
  height: var(--height-h-9, 36px);
  padding: var(--spacing-1, 4px) var(--spacing-3, 12px);
  align-items: center;
  border-radius: var(--border-radius-rounded-md, 8px);
  border: var(--border-width-border, 1px) solid var(--color-line-regular, rgba(33, 41, 48, 0.12));
  background: var(--color-fill-base, #FFF);
  box-shadow: var(--shadow-xs-offset-x, 0) var(--shadow-xs-offset-y, 1px) var(--shadow-xs-blur-radius, 2px) var(--shadow-xs-spread-radius, 0) var(--shadow-xs-color, rgba(0, 0, 0, 0.05));
  box-sizing: border-box;
}
.list-wrapper .list-search .smart-iconfont {
  font-size: 16px;
}
.list-wrapper .list-search .list-search-icon {
  width: 16px;
  height: 16px;
  text-align: center;
  line-height: 16px;
}
.list-wrapper .list-search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  overflow: hidden;
  color: var(--color-text-primary, #212930);
  font-family: var(--font-font-sans, Geist);
  font-size: var(--text-sm-font-size, 14px);
  font-style: normal;
  font-weight: var(--font-weight-normal, 400);
  line-height: var(--text-sm-line-height, 20px);
  /* 142.857% */
}
.list-wrapper .list-search input::placeholder {
  color: var(--color-text-tertiary, #9AA5B8);
}
.list-wrapper .list-search .list-search-remove {
  display: none;
  width: 18px;
  height: 18px;
  text-align: center;
  line-height: 18px;
  border-radius: 50%;
}
.list-wrapper .list-search .list-search-remove .smart-iconfont {
  font-size: 12px;
}
.list-wrapper .list-search .list-search-remove:hover {
  background: #0000000f;
  cursor: pointer;
}
.list-wrapper .list-search .list-search-remove.show {
  display: block;
}
.list-wrapper .category-list {
  display: none;
  flex-wrap: wrap;
  padding: 0 16px;
  margin-bottom: 12px;
  gap: 12px;
}
.list-wrapper .category-list .category-item {
  display: flex;
  padding: 5px 8px;
  justify-content: center;
  align-items: center;
  border-radius: 6px;
  border: 1px solid var(--color-line-regular, rgba(33, 41, 48, 0.12));
  background: var(--color-fill-light, #F3F5F9);
  color: var(--color-text-primary, #212930);
  text-align: center;
  font-family: "PingFang SC";
  font-size: 13px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}
.list-wrapper .category-list .category-item:hover {
  border-color: var(--color-line-public, #067BEF);
  cursor: pointer;
}
.list-wrapper .category-list .category-item.active {
  border-color: var(--color-line-public, #067BEF);
}
.list-wrapper .category-list.show {
  display: flex;
}
.list-wrapper .inline-list {
  display: none;
  flex: 1;
  padding: 0 16px;
  box-sizing: border-box;
  overflow: hidden;
  overflow-y: auto;
}
.list-wrapper .inline-list::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.list-wrapper .inline-list::-webkit-scrollbar-thumb {
  border: 2px solid #fff;
  border-radius: 6px;
  background-color: #c6c6c6;
}
.list-wrapper .inline-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}
.list-wrapper .inline-list .inline-list-item[data-level="0"] {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 2px;
}
.list-wrapper .inline-list .inline-list-item[data-level="0"] .inline-list-text {
  overflow: hidden;
  color: var(--color-text-primary, #212930);
  text-overflow: ellipsis;
  font-family: "PingFang SC";
  font-size: var(--text-sm-font-size, 14px);
  font-style: normal;
  font-weight: 600;
  line-height: var(--text-sm-line-height, 20px);
  /* 142.857% */
}
.list-wrapper .inline-list .inline-list-item[data-level="0"] .inline-list-arrow {
  width: 16px;
  height: 16px;
}
.list-wrapper .inline-list .inline-list-item[data-level="0"] .inline-list-arrow .smart-iconfont {
  font-size: 16px;
}
.list-wrapper .inline-list .inline-list-item[data-level="0"] .inline-list-arrow.open {
  transform: rotate(90deg);
}
.list-wrapper .inline-list .grid-list {
  display: grid;
  grid-template-columns: 184px 184px;
  gap: 16px;
}
.list-wrapper .inline-list .grid-list .inline-list-item {
  display: flex;
  flex-direction: column;
}
.list-wrapper .inline-list .grid-list .inline-list-item .inline-list-thumb {
  width: 184px;
  height: 123px;
  border-radius: 8px;
  border: 1px solid var(--color-line-regular, rgba(33, 41, 48, 0.12));
  background: #FFF;
  box-sizing: border-box;
  filter: drop-shadow(0 2px 10px rgba(0, 0, 0, 0.08));
}
.list-wrapper .inline-list .grid-list .inline-list-item .inline-list-thumb .inline-list-thumb-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.list-wrapper .inline-list .grid-list .inline-list-item .inline-list-thumb .thumb-loading {
  width: 60px;
  height: 60px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}
.list-wrapper .inline-list .grid-list .inline-list-item .inline-list-thumb .thumb-loading .thumb-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #ddd;
  border-top-color: var(--color-line-public, #067BEF);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.list-wrapper .inline-list .grid-list .inline-list-item .inline-list-thumb .inline-list-thumb-img {
  margin: 0 auto;
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}
.list-wrapper .inline-list .grid-list .inline-list-item .inline-list-thumb-text {
  display: none;
}
.list-wrapper .inline-list .grid-list .inline-list-item:hover {
  cursor: pointer;
}
.list-wrapper .inline-list .grid-list .inline-list-item:hover .inline-list-thumb {
  border-color: var(--color-line-public, #067BEF);
}
.list-wrapper .inline-list .grid-list .inline-list-item.active .inline-list-thumb {
  border-color: var(--color-line-public, #067BEF);
}
.list-wrapper .inline-list .inline-list-children {
  display: none;
}
.list-wrapper .inline-list .inline-list-children.open {
  display: block;
}
.list-wrapper .inline-list.show {
  display: block;
}
.list-wrapper.hide-mode {
  width: 44px;
}
.list-wrapper.hide-mode .list-header {
  padding: 16px 0;
  justify-content: center;
}
.list-wrapper.hide-mode .list-header .list-header-title,
.list-wrapper.hide-mode .list-header .list-header-container {
  display: none !important;
}
.list-wrapper.hide-mode .list-header .list-close-btn {
  display: none !important;
}
.list-wrapper.hide-mode .category-list,
.list-wrapper.hide-mode .inline-list {
  display: none !important;
}
`, ""]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 825:
/***/ ((module) => {



/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/nonce */
/******/ 	(() => {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ SwitchShapeList)
});

// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js
var injectStylesIntoStyleTag = __webpack_require__(72);
var injectStylesIntoStyleTag_default = /*#__PURE__*/__webpack_require__.n(injectStylesIntoStyleTag);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/styleDomAPI.js
var styleDomAPI = __webpack_require__(825);
var styleDomAPI_default = /*#__PURE__*/__webpack_require__.n(styleDomAPI);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/insertBySelector.js
var insertBySelector = __webpack_require__(659);
var insertBySelector_default = /*#__PURE__*/__webpack_require__.n(insertBySelector);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js
var setAttributesWithoutAttributes = __webpack_require__(56);
var setAttributesWithoutAttributes_default = /*#__PURE__*/__webpack_require__.n(setAttributesWithoutAttributes);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/insertStyleElement.js
var insertStyleElement = __webpack_require__(540);
var insertStyleElement_default = /*#__PURE__*/__webpack_require__.n(insertStyleElement);
// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/styleTagTransform.js
var styleTagTransform = __webpack_require__(113);
var styleTagTransform_default = /*#__PURE__*/__webpack_require__.n(styleTagTransform);
// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./node_modules/less-loader/dist/cjs.js!./src/packages-ui/editor/panel/switch-shape-list.less
var switch_shape_list = __webpack_require__(705);
;// ./src/packages-ui/editor/panel/switch-shape-list.less

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (styleTagTransform_default());
options.setAttributes = (setAttributesWithoutAttributes_default());

      options.insert = insertBySelector_default().bind(null, "head");
    
options.domAPI = (styleDomAPI_default());
options.insertStyleElement = (insertStyleElement_default());

var update = injectStylesIntoStyleTag_default()(switch_shape_list/* default */.A, options);




       /* harmony default export */ const panel_switch_shape_list = (switch_shape_list/* default */.A && switch_shape_list/* default */.A.locals ? switch_shape_list/* default */.A.locals : undefined);

;// ./src/packages-ui/editor/panel/switch-shape-list.js

function initializeSelection({
  data = [],
  leaf = null,
  root = null
} = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      parent: null,
      root: null,
      category: null,
      leaf: null
    };
  }
  // 递归查找leaf
  const traverse = (nodes, currentRoot = null, currentParent = null, parentNode = null) => {
    if (!Array.isArray(nodes)) return null;
    for (const node of nodes) {
      if (!node) continue;
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      if (!hasChildren) {
        // 是叶子节点
        if (!leaf || node.category === leaf) {
          return {
            parent: currentParent,
            root: currentRoot,
            category: parentNode?.category || node.category,
            leaf: node.category
          };
        }
      } else {
        const found = traverse(node.children, currentRoot || node.category, currentParent || node.parent, node);
        if (found) return found;
      }
    }
    return null;
  };
  // 默认初始化第一个叶子
  const getFirstLeaf = (nodes, currentRoot = null, currentParent = null, parentNode = null) => {
    if (!Array.isArray(nodes) || nodes.length === 0) return null;
    const node = nodes[0];
    if (!node) return null;
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    if (!hasChildren) {
      return {
        parent: currentParent || node.parent,
        root: currentRoot || node.category,
        category: parentNode?.category || node.category,
        leaf: node.category
      };
    } else {
      return getFirstLeaf(node.children, currentRoot || node.category, currentParent || node.parent, node);
    }
  };
  if (root) {
    const activeItem = data.find(item => item.category === root);
    if (!activeItem) {
      return {
        parent: null,
        root: null,
        category: null,
        leaf: null
      };
    }
    let result = null;
    if (leaf) {
      result = leaf ? traverse(activeItem.children, activeItem.category, activeItem.parent, activeItem) : null;
    }
    return result || getFirstLeaf(activeItem.children, activeItem.category, activeItem.parent, activeItem) || {
      parent: null,
      root: null,
      category: null,
      leaf: null
    };
  } else {
    const foundLeaf = leaf ? traverse(data) : null;
    return foundLeaf || getFirstLeaf(data) || {
      parent: null,
      root: null,
      category: null,
      leaf: null
    };
  }
}
class SwitchShapeList {
  constructor(options = {}) {
    this.container = options.container || this.getInitContainer();
    this.data = options.data;
    this.title = options.title || '';
    this.titleDesc = options.titleDesc || '';
    this.panelType = options.panelType || 'panelType';
    this.showClose = options.showClose || false;
    this.showSearch = options.showSearch || false;
    this.thumbLoadDelay = options.thumbLoadDelay || 0;
    this.containerWidth = options.containerWidth || 416;
    this.showCategory = Object.prototype.hasOwnProperty.call(options, 'showCategory') ? this.showCategory : true;
    // 默认折叠状态
    this.isCollapsed = options.isCollapsed !== false; // 默认为 true，除非明确设置为 false
    this.openKeys = new Set();
    this.active = {
      parent: null,
      // 图形分类
      root: null,
      // 当前展开的分类
      category: null,
      // 展开的分类下的子分类
      leaf: null // 选中图形
    };
    this.onSelect = options.onSelect || (() => {});
    this.exclusive = options.exclusive || false;
    this.expandAll = options.expandAll || false;
    this.getItemThumb = options.getItemThumb || (() => Promise.resolve({}));
    if (this.exclusive) {
      this.expandAll = false;
    }
    this.canvasCache = new Map();
    this.pendingQueue = [];
    this.renderingCount = 0;
    this.observer = null;
    this.bufferScreens = 2;
    this.maxThumbRender = 20;
    // 初始化阶段的延迟 Promise，用于控制初始化时的延迟加载
    this._initialLoadDelayPromise = null;
    if (this.thumbLoadDelay > 0) {
      this._initialLoadDelayPromise = new Promise(resolve => {
        setTimeout(() => {
          this._initialLoadDelayPromise = null; // 延迟完成后清除，后续加载不再延迟
          resolve();
        }, this.thumbLoadDelay);
      });
    }
    const {
      defaultSelected
    } = options;
    if (defaultSelected?.leaf) {
      this.active.leaf = defaultSelected.leaf;
    }
    this.initActiveKey();
    this.render();

    // 只有在非折叠状态下才初始化观察器和设置激活状态
    if (!this.isCollapsed) {
      this.initObserver();
      this.setActive({
        category: this.active.root,
        leaf: this.active.leaf
      });
    }
  }
  initActiveKey() {
    this.active = initializeSelection({
      data: this.data,
      leaf: this.active.leaf
    });
  }
  getInitContainer() {
    const containerId = 'list-container';
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.setAttribute('id', containerId);
      document.body.appendChild(container);
    }
    container.innerHTML = '';
    return container;
  }
  render() {
    if (!this.container) return;
    this.container.innerHTML = '';
    // 新增：统一 wrapper
    const listWrapper = document.createElement('div');
    listWrapper.className = 'list-wrapper';

    // 如果默认折叠，添加 hide-mode 类
    if (this.isCollapsed) {
      listWrapper.classList.add('hide-mode');
    }
    if (this.title || this.showClose) {
      const header = document.createElement('div');
      header.className = 'list-header';
      if (this.titleDesc && this.title) {
        const titleContainer = document.createElement('div');
        titleContainer.className = 'list-header-container';
        titleContainer.innerHTML = `<div class='header-title'>${this.title}</div><div class='header-desc'>${this.titleDesc}</div>`;
        header.appendChild(titleContainer);
      } else if (this.title) {
        const title = document.createElement('div');
        title.className = 'list-header-title';
        title.textContent = this.title;
        header.appendChild(title);
      }
      if (this.showClose) {
        const closeBtn = document.createElement('div');
        closeBtn.className = 'list-close-btn';
        closeBtn.innerHTML = '<i class="smart-iconfont">&#xeac3;</i>';
        header.appendChild(closeBtn);
        this.showBtn = document.querySelector('.list-show-btn');
        if (!this.showBtn) {
          this.showBtn = document.createElement('div');
          this.showBtn.className = 'list-show-btn';
          this.showBtn.innerHTML = '<i class="smart-iconfont">&#xeac2;</i>';
          header.appendChild(this.showBtn);
        }
        // 如果默认折叠，显示展开按钮
        if (this.isCollapsed) {
          this.showBtn.classList.remove('hide');
        } else {
          this.showBtn.classList.add('hide');
        }
      }
      listWrapper.appendChild(header);
    }
    // =====================
    // search
    // =====================
    if (this.showSearch) {
      const search = document.createElement('div');
      search.className = 'list-search';
      search.innerHTML = `
        <div class="list-search-icon"><i class="smart-iconfont">&#xe776;</i></div>
        <input type="text" placeholder="搜索" />
        <div class="list-search-remove"><i class="smart-iconfont">&#xe6b9;</i></div>
      `;
      listWrapper.appendChild(search);
    }
    this.renderCategoryList(listWrapper);
    const rootDiv = document.createElement('div');
    rootDiv.className = `inline-list show`;
    const renderData = [];
    if (this.panelType === 'tab') {
      rootDiv.dataset.root = this.active.root;
      const activeItem = this.data.find(item => item.category === this.active.root);
      if (activeItem) {
        renderData.push({
          parent: this.active.parent,
          data: [...activeItem.children]
        });
      }
    } else {
      this.data.forEach(category => {
        const isLeafLevel = category.children.length > 0 && category.children.every(item => !item.children || item.children.length === 0);
        if (isLeafLevel) {
          renderData.push({
            parent: category.parent,
            data: [{
              category: category.category,
              name: category.name,
              children: [...category.children]
            }]
          });
        } else {
          renderData.push({
            parent: category.parent,
            data: [...category.children]
          });
        }
      });
    }
    renderData.forEach(item => {
      const listNode = this.renderList(item.data, undefined, undefined, item.parent);
      rootDiv.appendChild(listNode);
    });
    listWrapper.appendChild(rootDiv);
    // 统一挂载
    this.container.appendChild(listWrapper);
    this.bindEvents();
  }
  renderCategoryList(container) {
    const categoryList = document.createElement('div');
    categoryList.className = 'category-list' + (this.showCategory ? ' show' : '');
    this.data.forEach(category => {
      const categoryItem = document.createElement('div');
      categoryItem.className = `category-item${this.active.root === category.category ? ' active' : ''}`;
      categoryItem.dataset.category = category.category;
      categoryItem.dataset.parent = category.parent;
      categoryItem.textContent = category.name;
      categoryList.appendChild(categoryItem);
    });
    container.appendChild(categoryList);
  }
  renderList(list, level = 0, root = null, parent = null) {
    const wrapper = document.createElement('div');
    const isLeafLevel = list.length > 0 && list.every(item => !item.children || item.children.length === 0);
    if (isLeafLevel) {
      wrapper.classList.add('grid-list');
    }
    wrapper.dataset.level = level;
    list.forEach(item => {
      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
      const isLeaf = !hasChildren;
      const currentRootKey = root ? root.category : null;
      const itemNode = document.createElement('div');
      itemNode.className = 'inline-list-item';
      itemNode.dataset.category = item.category;
      if (currentRootKey) {
        itemNode.dataset.rootKey = currentRootKey;
      }
      itemNode.dataset.isLeaf = isLeaf ? 'true' : 'false';
      itemNode.dataset.hasChildren = hasChildren ? 'true' : 'false';
      itemNode.dataset.level = level;
      if (this.active.category === item.category) {
        itemNode.classList.add('active');
      }
      if (isLeaf && this.active.leaf === item.category) {
        itemNode.classList.add('active');
      }
      const contentNode = this.renderItemContent(item, parent);
      itemNode.appendChild(contentNode);
      if (this.expandAll) {
        this.openKeys.add(item.category);
      }
      this.appendArrowOrSpacer(itemNode, item, !currentRootKey, hasChildren);
      wrapper.appendChild(itemNode);
      if (hasChildren) {
        const childrenWrapper = document.createElement('div');
        childrenWrapper.className = 'inline-list-children';
        if (this.openKeys.has(item.category)) childrenWrapper.classList.add('open');
        childrenWrapper.appendChild(this.renderList(item.children, level + 1, item, parent));
        wrapper.appendChild(childrenWrapper);
      }
    });
    return wrapper;
  }
  renderItemContent(item, rootKey) {
    if (!item.children || item.children.length === 0) return this.renderThumbItem(item, rootKey);
    return this.renderTextItem(item);
  }
  renderTextItem(item) {
    const textNode = document.createElement('span');
    textNode.className = 'inline-list-text';
    textNode.textContent = item.name;
    return textNode;
  }
  renderThumbItem(item, rootKey) {
    const wrapper = document.createElement('div');
    wrapper.className = 'inline-list-thumb';
    const container = document.createElement('div');
    container.className = 'inline-list-thumb-container';
    wrapper.appendChild(container);
    const label = document.createElement('div');
    label.className = 'inline-list-thumb-text';
    label.textContent = item.name;
    wrapper.appendChild(label);
    const key = `${rootKey}-${item.category}`;
    container.dataset.thumbKey = key;
    container.dataset.rootKey = rootKey;
    container.dataset.category = item.category;
    if (this.canvasCache.has(key)) {
      container.appendChild(this.canvasCache.get(key));
      return wrapper;
    }
    container.innerHTML = `<div class="thumb-loading"><div class="thumb-spinner"></div></div>`;
    return wrapper;
  }
  destroyObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.pendingQueue = [];
    this.renderingCount = 0;
  }
  initObserver() {
    if (!this.container || this.isCollapsed) return;
    if (this.panelType === 'tab') {
      // ⚠️ 先保证旧的没了
      this.destroyObserver();
    }
    const inlineList = this.panelType === 'tab' ? this.container.querySelector(`.inline-list[data-root="${this.active.root}"]`) : this.container.querySelector(`.inline-list`);
    if (!inlineList) return;
    const thumbNode = inlineList.querySelector('.inline-list-thumb-container');
    const thumbHeight = thumbNode ? thumbNode.offsetHeight : 100;
    const visibleCount = Math.ceil(inlineList.clientHeight / thumbHeight);
    this.maxThumbRender = visibleCount * (1 + this.bufferScreens);
    this.renderingCount = 0;
    this.pendingQueue = [];
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) this.queueThumbRender(entry.target);
      });
    }, {
      root: inlineList,
      threshold: 0.1
    });
    inlineList.querySelectorAll('.inline-list-thumb-container').forEach(el => this.observer.observe(el));
  }
  async queueThumbRender(container) {
    if (!container || this.isCollapsed) return;
    const key = container.dataset.thumbKey;
    if (this.canvasCache.has(key)) {
      container.innerHTML = '';
      container.appendChild(this.canvasCache.get(key));
      return;
    }
    if (this.renderingCount >= this.maxThumbRender) {
      if (!this.pendingQueue.includes(container)) this.pendingQueue.push(container);
      return;
    }

    // 如果是在初始化阶段且有延迟设置，等待延迟 Promise
    if (this._initialLoadDelayPromise) {
      await this._initialLoadDelayPromise;
    }
    this.renderingCount++;
    const rootKey = container.dataset.rootKey;
    const category = container.dataset.category;
    try {
      const {
        type,
        url,
        instance
      } = await this.getItemThumb(container, {
        shapeType: rootKey,
        pluginType: category
      });
      container.innerHTML = '';
      let node = null;
      if (type === 'img') {
        node = document.createElement('img');
        node.src = url;
        node.alt = category;
        node.className = 'inline-list-thumb-img';
        container.appendChild(node);
        this.canvasCache.set(key, node);
      } else if (type === 'canvas' || type === 'svg') {
        node = url;
        container.appendChild(node);
        if (instance) this.canvasCache.set(key, node);
      }
    } catch (err) {
      console.error('thumb render error', key, err);
      container.innerHTML = '<div class="thumb-error">渲染失败</div>';
    } finally {
      this.renderingCount--;
      this.flushQueue();
    }
  }
  flushQueue() {
    while (this.pendingQueue.length && this.renderingCount < this.maxThumbRender) {
      const container = this.pendingQueue.shift();
      this.queueThumbRender(container);
    }
  }
  bindEvents() {
    if (!this.container) return;
    // 绑定tab切换事件
    const categoryList = this.container.querySelector('.category-list');
    if (categoryList) {
      categoryList.onclick = e => {
        const itemNode = e.target.closest('.category-item');
        if (!itemNode) return;
        const rootKey = itemNode.dataset.category;
        if (this.active.root === rootKey) return;
        const result = initializeSelection({
          data: this.data,
          root: rootKey
        });
        this.onSelect({
          root: result.parent,
          leaf: result.leaf,
          category: result.category,
          categoryRoot: result.root
        });
        this.setActive({
          leaf: result.leaf,
          category: result.root,
          scrollIntoView: true
        });
      };
    }
    // 绑定list事件
    const listNode = this.container.querySelector('.list-wrapper');
    if (listNode) {
      listNode.onclick = e => {
        const itemNode = e.target.closest('.inline-list-item');
        if (!itemNode) return;
        const isLeaf = itemNode.dataset.isLeaf === 'true';
        if (isLeaf) {
          const category = itemNode.dataset.category;
          // 用户点击只选中，不滚动
          this.setActive({
            leaf: category,
            scrollIntoView: false
          });
          this.onSelect({
            root: this.active.parent,
            leaf: category,
            category: this.active.category,
            categoryRoot: this.active.root
          });
        } else {
          const hasChildren = itemNode.dataset.hasChildren === 'true';
          const level = Number(itemNode.dataset.level);
          if (hasChildren && level === 0) {
            const childrenWrapper = itemNode.nextElementSibling;
            const isOpen = childrenWrapper?.classList.contains('open');
            if (this.exclusive) {
              this.openKeys.clear();
              this.container?.querySelectorAll('.inline-list-children.open').forEach(el => el.classList.remove('open'));
              this.container?.querySelectorAll('.inline-list-item.active').forEach(el => el.classList.remove('active'));
              this.container?.querySelectorAll('.inline-list-arrow.open').forEach(el => el.classList.remove('open'));
            }
            const category = itemNode.dataset.category;
            if (!isOpen) {
              this.openKeys.add(category);
              childrenWrapper?.classList.add('open');
              itemNode.classList.add('active');
              itemNode.querySelector('.inline-list-arrow')?.classList.add('open');
            } else {
              this.openKeys.delete(category);
              childrenWrapper?.classList.remove('open');
              itemNode.classList.remove('active');
              itemNode.querySelector('.inline-list-arrow')?.classList.remove('open');
            }
          }
        }
      };
    }
    this.bindCloseEvent();
  }
  bindCloseEvent() {
    const closeBtn = this.container.querySelector('.list-close-btn');
    const listWrapper = this.container?.querySelector(`.list-wrapper`);
    let containerAnim = null;
    let showBtnAnim = null;
    // ======================
    // showBtn 出现动画
    // ======================
    const showShowBtn = () => {
      if (!this.showBtn) return;
      this.showBtn.classList.remove('hide');
      showBtnAnim = this.showBtn.animate([{
        opacity: 0,
        transform: 'scale(0.95)'
      }, {
        opacity: 1,
        transform: 'scale(1)'
      }], {
        duration: 160,
        easing: 'ease-out',
        fill: 'forwards'
      });
    };
    // ======================
    // 收起 container
    // ======================
    if (closeBtn) {
      closeBtn.onclick = () => {
        containerAnim?.cancel();
        showBtnAnim?.cancel();
        const rect = this.container.getBoundingClientRect();
        const width = this.containerWidth || rect.width;

        // 保证宽度可动画
        this.container.style.width = `${width}px`;
        this.container.style.overflow = 'hidden';

        // 1️⃣ container 向左收起（宽度 + 位移）
        containerAnim = this.container.animate([{
          width: `${width}px`,
          transform: 'translateX(0)',
          opacity: 1
        }, {
          width: '44px',
          transform: 'translateX(calc(-100% + 44px))'
        }], {
          duration: 300,
          easing: 'ease-in-out',
          fill: 'forwards'
        });

        // 动画完成后添加 hide class
        containerAnim.finished.then(() => {
          listWrapper.classList.add('hide-mode');
          // 折叠后设置为折叠状态并停止缩略图加载
          this.isCollapsed = true;
          this.destroyObserver();
        });

        // 2️⃣ 动画后段展示 showBtn
        const SHOW_AT = 0.8;
        let shown = false;
        const tick = () => {
          if (!containerAnim || containerAnim.currentTime == null) return;
          if (!shown && containerAnim.currentTime >= 300 * SHOW_AT) {
            shown = true;
            showShowBtn();
          }
          if (!shown) requestAnimationFrame(tick);
        };
        tick();
      };
    }
    // ======================
    // 点击 showBtn 展开
    // ======================
    if (this.showBtn) {
      this.showBtn.onclick = () => {
        containerAnim?.cancel();
        showBtnAnim?.cancel();
        const rect = this.container.getBoundingClientRect();
        const targetWidth = this.containerWidth || rect.width || 240; // fallback

        this.container.style.overflow = 'hidden';

        // 1️⃣ container 展开动画
        containerAnim = this.container.animate([{
          width: '0px',
          transform: 'translateX(-100%)',
          opacity: 0
        }, {
          width: `${targetWidth}px`,
          transform: 'translateX(0)',
          opacity: 1
        }], {
          duration: 300,
          easing: 'ease-in-out',
          fill: 'forwards'
        });
        containerAnim.finished.then(() => {
          // 展开完成后移除 hide class
          listWrapper.classList.remove('hide-mode');
          // 还原，避免影响布局
          this.container.style.width = '';
          this.container.style.transform = '';
          this.container.style.opacity = '';
          this.container.style.overflow = '';

          // 展开后设置为非折叠状态并初始化缩略图加载
          this.isCollapsed = false;
          this.initObserver();
          this.setActive({
            category: this.active.root,
            leaf: this.active.leaf
          });
        });

        // 2️⃣ showBtn 消失动画
        showBtnAnim = this.showBtn.animate([{
          opacity: 1,
          transform: 'translateX(0) scale(1)'
        }, {
          opacity: 0,
          transform: 'translateX(-6px) scale(0.95)'
        }], {
          duration: 120,
          easing: 'ease-in',
          fill: 'forwards'
        });
        showBtnAnim.finished.then(() => {
          this.showBtn.classList.add('hide');
        });
      };
    }
  }
  switchTab({
    category,
    leaf = null
  } = {}) {
    if (!category || this.active.category === category) {
      return false;
    }

    // 如果面板折叠，只更新内部状态
    if (this.isCollapsed) {
      const result = initializeSelection({
        data: this.data,
        root: category,
        leaf
      });
      if (result.root) {
        this.active.category = result.category;
        this.active.leaf = result.leaf;
        this.active.root = result.root;
        this.active.parent = result.parent;
        return true;
      }
      return false;
    }
    const result = initializeSelection({
      data: this.data,
      root: category,
      leaf
    });
    if (result.root) {
      this.active.category = result.category;
      this.active.leaf = result.leaf;
      if (result.root !== this.active.root) {
        this.active.root = result.root;
        this.active.parent = result.parent;
        // 先更新tab的active
        const categoryList = this.container?.querySelector(`.category-list`);
        if (!categoryList) return;
        categoryList.querySelectorAll(`.active`).forEach(el => el.classList.remove('active'));
        categoryList.querySelector(`.category-item[data-category="${this.active.root}"]`).classList.add('active');
        // 重新渲染列表
        const listWrapper = this.container?.querySelector(`.list-wrapper`);
        if (!listWrapper) return;
        if (this.panelType === 'tab') {
          let listContainer = listWrapper.querySelector(`.inline-list[data-root="${this.active.root}"]`);
          listWrapper.querySelectorAll('.inline-list').forEach(el => el.classList.remove('show'));
          if (!listContainer) {
            listContainer = document.createElement('div');
            listContainer.className = `inline-list`;
            listContainer.dataset.root = this.active.root;
            const renderData = [];
            const activeItem = this.data.find(item => item.category === this.active.root);
            if (activeItem) {
              renderData.push(...activeItem.children);
            }
            const listNode = this.renderList(renderData, undefined, undefined, this.active.parent);
            listContainer.appendChild(listNode);
            listWrapper.appendChild(listContainer);
          }
          listContainer.classList.add('show');
        }
        this.initObserver();
      }
    }
  }
  setActive({
    category,
    leaf,
    scrollIntoView = true
  } = {}) {
    // 如果面板折叠，只更新内部状态，不执行 DOM 操作
    if (this.isCollapsed) {
      const switchTabOpts = {
        category,
        leaf
      };
      if (!switchTabOpts.category && switchTabOpts.leaf) {
        const result = initializeSelection({
          data: this.data,
          leaf
        });
        switchTabOpts.category = result.root;
        switchTabOpts.leaf = result.leaf || leaf;
      }
      // 只更新内部状态
      if (switchTabOpts.category) {
        const result = initializeSelection({
          data: this.data,
          root: switchTabOpts.category,
          leaf: switchTabOpts.leaf
        });
        if (result.root) {
          this.active.category = result.category;
          this.active.leaf = result.leaf;
          this.active.root = result.root;
          this.active.parent = result.parent;
        }
      }
      return;
    }
    const switchTabOpts = {
      category,
      leaf
    };
    if (!switchTabOpts.category && switchTabOpts.leaf) {
      const result = initializeSelection({
        data: this.data,
        leaf
      });
      switchTabOpts.category = result.root;
      switchTabOpts.leaf = result.leaf || leaf;
    }
    const switchResult = this.switchTab(switchTabOpts);
    if (!switchResult) {
      this.active.leaf = switchTabOpts.leaf;
    }
    const listContainer = this.panelType === 'tab' ? this.container.querySelector(`.inline-list[data-root="${this.active.root}"]`) : this.container.querySelector(`.inline-list`);
    if (!listContainer) return;
    const oldOpened = this.openKeys.has(this.active.category);
    if (this.exclusive) {
      this.openKeys.clear();
      listContainer?.querySelectorAll('.inline-list-children.open').forEach(el => el.classList.remove('open'));
      listContainer?.querySelectorAll('.inline-list-item.active').forEach(el => el.classList.remove('active'));
      listContainer?.querySelectorAll('.inline-list-arrow.open').forEach(el => el.classList.remove('open'));
    } else {
      listContainer.querySelectorAll('.inline-list-item[data-is-leaf="true"].active').forEach(el => el.classList.remove('active'));
    }
    const categoryNode = listContainer.querySelector(`.inline-list-item[data-category="${this.active.category}"]`);
    categoryNode?.classList.add('active');
    const childrenWrapper = categoryNode?.nextElementSibling;
    if (!oldOpened) {
      this.openKeys.add(this.active.category);
      childrenWrapper?.classList.add('open');
      const arrowNode = categoryNode?.querySelector('.inline-list-arrow');
      arrowNode?.classList.add('open');
    }
    const leafNode = listContainer.querySelector(`.inline-list-item[data-is-leaf="true"][data-category="${this.active.leaf}"]`);
    leafNode?.classList.add('active');
    scrollIntoView && this.scrollActiveIntoView();
    const onThumbReady = () => {
      scrollIntoView && this.scrollActiveIntoView();
    };
    const thumbContainer = leafNode?.querySelector('.inline-list-thumb-container');
    if (!thumbContainer) return;
    const key = `${this.active.parent}-${this.active.leaf}`;
    if (this.canvasCache.has(key)) {
      onThumbReady?.();
    } else {
      const originalQueueThumbRender = this.queueThumbRender.bind(this);
      this.queueThumbRender = async container => {
        await originalQueueThumbRender(container);
        if (container === thumbContainer) {
          onThumbReady?.();
          this.queueThumbRender = originalQueueThumbRender;
        }
      };
      this.queueThumbRender(thumbContainer);
    }
    requestAnimationFrame(() => {
      if (this.observer && !this.isCollapsed) {
        listContainer.querySelectorAll('.inline-list-thumb-container').forEach(el => this.observer.observe(el));
      }
    });
  }
  clearActive() {
    const listContainer = this.container.querySelector(`.list-wrapper`);
    if (!listContainer) return;
    listContainer.querySelectorAll('.inline-list-item.active').forEach(el => el.classList.remove('active'));
    const tabActive = listContainer.querySelector('.category-item.active');
    tabActive?.classList.remove('active');
    const categoryNode = listContainer.querySelector(`.inline-list-item[data-category="${this.active.category}"]`);
    categoryNode?.classList.add('active');
    const leafNode = listContainer.querySelector(`.inline-list-item[data-is-leaf="true"][data-category="${this.active.leaf}"]`);
    leafNode?.classList.remove('active');
    this.active = {
      parent: null,
      // 图形分类
      root: null,
      // 当前展开的分类
      category: null,
      // 展开的分类下的子分类
      leaf: null // 选中图形
    };
  }
  scrollActiveIntoView() {
    const rootDiv = this.panelType === 'tab' ? this.container.querySelector(`.inline-list[data-root="${this.active.root}"]`) : this.container.querySelector(`.inline-list`);
    if (!rootDiv) return;
    const activeEl = rootDiv.querySelector('.inline-list-item.active[data-is-leaf="true"]');
    if (!activeEl) return;
    let offset = activeEl.offsetTop;
    let parent = activeEl.offsetParent;
    while (parent && parent !== rootDiv) {
      offset += parent.offsetTop;
      parent = parent.offsetParent;
    }
    const containerHeight = rootDiv.clientHeight;
    const elHeight = activeEl.offsetHeight;
    rootDiv.scroll({
      top: offset - containerHeight / 2 + elHeight / 2,
      behavior: 'smooth'
    });
  }
  appendArrowOrSpacer(itemNode, item, isRootLevel, hasChildren) {
    if (hasChildren && isRootLevel) {
      const arrow = document.createElement('span');
      arrow.className = 'inline-list-arrow';
      arrow.innerHTML = '<i class="smart-iconfont">&#xeab4;</i>';
      if (this.openKeys.has(item.category)) arrow.classList.add('open');
      itemNode.appendChild(arrow);
    } else {
      const spacer = document.createElement('span');
      spacer.style.width = '12px';
      itemNode.appendChild(spacer);
    }
  }
  destroy() {
    const listContainer = this.container?.querySelector('.list-wrapper');
    if (listContainer) listContainer.onclick = null;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.pendingQueue = [];
    this.renderingCount = 0;
    this.canvasCache.clear();
    if (this.container) this.container.innerHTML = '';
    this.openKeys.clear();
    this.active = {
      parent: null,
      // 图形分类
      root: null,
      // 当前展开的分类
      category: null,
      // 展开的分类下的子分类
      leaf: null // 选中图形
    };
    this.data = null;
    this.onSelect = null;
    this.container = null;
  }
}
/******/ 	return __webpack_exports__;
/******/ })()
;
});