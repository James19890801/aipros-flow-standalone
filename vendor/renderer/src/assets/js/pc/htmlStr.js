/**
 * html 插入元素集合
 */
const HtmlStr = {
  "errorImage": "data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QMuaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA2LjAtYzAwMiA3OS4xNjQ0NjAsIDIwMjAvMDUvMTItMTY6MDQ6MTcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCAyMS4yIChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkVBMjY4QjAzNUEyRjExRUM4NjI4ODNDNUFEQTlGRjAzIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkVBMjY4QjA0NUEyRjExRUM4NjI4ODNDNUFEQTlGRjAzIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6RUEyNjhCMDE1QTJGMTFFQzg2Mjg4M0M1QURBOUZGMDMiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6RUEyNjhCMDI1QTJGMTFFQzg2Mjg4M0M1QURBOUZGMDMiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAGBAQEBQQGBQUGCQYFBgkLCAYGCAsMCgoLCgoMEAwMDAwMDBAMDg8QDw4MExMUFBMTHBsbGxwfHx8fHx8fHx8fAQcHBw0MDRgQEBgaFREVGh8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx//wAARCADIAMgDAREAAhEBAxEB/8QAcwABAAIDAQEAAAAAAAAAAAAAAAQFAQIDBggBAQAAAAAAAAAAAAAAAAAAAAAQAQACAQICBAsIAwEAAAAAAAABAgMRBCESMVFSBUFxkdEiMpITUxQGgaGxwUIzFRZiI1RDEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwD6pAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABi1q1jW0xEdc8AafM7f4tPagG1M2K86UvW09UTEg2AAAAAABpO4wROk5KxMeCZgGPmdv8AFp7UA6AAAAAAAAAAAAAq+95v7zHE/t6TMdXMCBpAM1m0WrNOF4mOXTp1BdTvKUy+6yxOPXTlvPqzPjBIAAABi96UrN7zFax0zIIebdWzbXNbFW1YiPRvMaax4dPsBU6QBpALfuqbztvS9WLTFPECYAAAAAAAAAAADXJix5K8uSsWr1SDj8hs/hQDfHtNtjtzUxxFvBIOl8dMlZpesWrPTEgiY5vtMtcN5m23yTpitPTWezP5AmAAxe1aVm1p0rWNZkETFiturRuM0f6o44cU9GnasCYDhOx2kzMzirrIHyGz+FUHeIiIiIjSI6IgAAAAAAAAAAAAAAAAHne8fqbFzzh2+GualZ45Lz6MzE/piPxBw/tm++Bi8tgP7ZvvgYvLYGLfVO6vWaZNtivSfWrrbjAL3uvvTb7/AAzbHE0vThkxT016vsBNAAAAAAAAAAAAAAAAAABw38ZJ2O4jH+5OO3Lp16SDwNdOWNOjTgDIAALn6Vi/8jkmvqRinn9qNAerAAAAAAAAAAAAAAAAAAABQd5/Tm0m9s+PN8vF5405eavNM/piOMA4/wBRz/8ATX2J84H9Rz/9NfYnzg1yfS1sVJyZd1EY6+tMUmZ/EF53b3dttjg5MGtuf0r5J4zaQSwAAAAAAAAAAAAAAAaZc2LFXmyWisdEag4/yWz7f3T5gbY99tcl4pW/pT0ROsa+UHXLlx4qTfJaK1jwyCNipk3OaufJWa4qfs456ZntT+QJYAFqxas1mNYnhMAhY722dvdZdZ28z/qy9n/GwJvNGnNrw6dfACNPeOzidPea+KJkD+S2fb+6fMCRW1b1i1ZiazxiYBkAAAAAAAAAAAFZ3vS/vMd//PTTXwRIK/WOsGaVte0VpxvM8IgF58pitl99k1vfhpFp1rHigHYAAAGLVras1tETWemJBEzbOMe1zVwc3px+3rrEadOnjBUawBrHWC37rpeu29KNItaZrE9QJgAAAAAAAAAAAExExpPGAa+6xdivkgGa0pX1axHigGQAAAAAAazjxzOs1iZ69IA91j7FfJANgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/9k=",
  /***
   * ”最近“ 文件列表中的时间分隔元素
   * @param {"slide元素唯一标识"} slideId
   * @param {"slide元素标题"} slideName
   * @param {"slide元素下的文件数量"} nChart
   * @param {"slide元素是否展开状态"} isShow
   * @returns {"时间分隔元素"}
   */
  "history_slide": (slideId, slideName, nChart, isShow) => {
    let classUp = "up";

    if (isShow) classUp = "";
    let s = `<div class="file-line">
						<span class="file-line-text" data-id="${slideId}">
							<span>${slideName} (${pcUtil.numAbb(nChart)})</span>
							<span class="icons slide_icons ${classUp}">&#xe61a;</span>
						</span>
						<div></div>
					</div>`;
    return s;
  },
  /***
   * ”最近“ 文件列表中的时间分隔元素对应的内容容器
   * @param {"与 history_slide 对应的id"} slideId
   * @param {"slide元素是否展开状态"} isShow
   * @returns {"时间分隔元素容器"}
   */
  "history_box": (slideId, isShow) => {
    let classUp = "up";

    if (isShow) classUp = "";
    let s = `<div class="file-list-box ${classUp}" data-id="${slideId}"></div>`;
    return s;
  },
  /**
   * "空" 状态
   * @param {"生成的元素类型"} t ["file"]
   * @returns {"空状态标签 string"}
   */
  "null": (t) => {
    let s = "";
    switch (t) {
      // 最近
      case "diagrams":
        const isSaveWindow = window.location.href.includes("saveWindow")
        s = isSaveWindow ? `<div class="null null_file">
        <img class="null_file_img" src="src/assets/images/home/emptyFile.svg"/>
        <span class="null_text">暂无云文件</span>`: `<div class="po-nofiles">
        <div>
          <div class="po-nofiles-title">
            <h4>点击下方模块快速新建</h4>
            <span>支持导入pos、xmind、txt、opml、visio等</span>
          </div>
          <div class="po-nofiles-create-list">
            <div class="nofiles-item mbr" data-btn="flow"><span class="po-create-btn-dot "><img
                  src="src/assets/images/icon/newbuild/no-files-flow.svg"></span>
              <span class="list-text">流程图</span>
            </div>
            <div class="nofiles-item mbr" data-btn="mind_free"><span class="po-create-btn-dot "><img
                  src="src/assets/images/icon/newbuild/no-files-mind.svg"></span>
              <span class="list-text">思维导图</span>
            </div>
            <div class="nofiles-item" data-btn="outline"><span class="po-create-btn-dot "><img
                  src="src/assets/images/icon/newbuild/no-files-outline.svg"></span>
              <span class="list-text">思维笔记</span>
            </div>
            <div class="nofiles-item mbr" data-btn="floder"><span class="po-create-btn-dot "><img
                  src="src/assets/images/icon/newbuild/no-files-folder.svg"></span>
              <span class="list-text">文件夹</span>
            </div>
            <div class="nofiles-item mbr" data-btn="import"><span class="po-create-btn-dot "><img
                  src="src/assets/images/icon/newbuild/no-files-import.svg"></span>
              <span class="list-text">导入</span>
            </div>
            <div class="nofiles-item" data-btn="templateCreate"><span class="po-create-btn-dot "><img
                  src="src/assets/images/icon/newbuild/no-files-tem.svg"></span>
              <span class="list-text">从模板新建</span>
            </div>
          </div>
        </div>
      </div>`;
        break
      case "history":
        s = `<div class="null null_file">
        <img class="null_file_img" src="src/assets/images/home/emptyFile.svg"/>
        <span class="null_text">暂无最近文件</span>
    </div>`;
        break;
      case "search":
        s = `<div class="null null_file">
                        <img class="null_file_img" src="src/assets/images/home/emptyFile.svg"/>
                        <span class="null_text">暂无文件</span>
                    </div>`;
        break;
      case "fav":
        s = `<div class="null null_file">
                          <img class="null_file_img" src="src/assets/images/home/empty_shoucang.svg"/>
                          <span class="null_text">暂无收藏文件</span>
                      </div>`;
        break;
      case "colla":
        s = `<div class="null null_file">
              <img class="null_file_img" src="src/assets/images/home/empty_xiezuo.svg"/>
              <span class="null_text">暂无协作文件</span>
          </div>`;
        break;
      case "trash":
        s = `<div class="null null_file">
              <img class="null_file_img" src="src/assets/images/home/empty_huishouzhan.svg"/>
              <span class="null_text">暂无文件</span>
          </div>`;
        break;
      default:
        s = `<div class="null null_file">
                        <img class="null_file_img" src="src/assets/images/home/emptyFile.svg"/>
                        <span class="null_text">暂无文件</span>
                    </div>`;
        break;
    }
    return s;
  },
  /**
   * "空" 状态
   * @param {"生成的元素类型"} t ["file"]
   * @returns {"空状态标签 string"}
   */
  "noOnline": (t) => {
    let s = `<div class="null null_file">
              <img class="null_file_img" src="src/assets/images/home/noOnline.svg"/>
              <span class="null_text">网络连接中断</span>
          </div>`;
    return s;
  },
  /**
   * 文件路径导航
   * @param {"dir 对象 {id, title}"} dirObj
   * @param {"不添加右箭头图标"} notIcon
   * @returns {"文件路径导航 string"}
   */
  "dir": (dirObj, notIcon, dirs, index) => {
    let { pageType } = pageContext.data;
    let s = "";
    if (pageType === 'colla') {
      s = ''
      return `<div id="colla_withMe" style="color:#212930;margin-right:16px;" class="item active" data-f-id="root">与我协作</div>
              <div id="colla_my" style="" class="item" data-f-id="root">我的协作</div>
      `
    }

    if (pageType == 'fav') {
      s = ''
      return `<div id="fav_file" style="color:#212930;margin-right:16px;" class="item active" data-f-id="root">文件</div>
              <div id="fav_template" style="" class="item" data-f-id="root">模板</div>
      `
    }

    let sIcon = notIcon ? '' : `<label class="icons">&#xe630;</label>`;
    dirObj.title = pcUtil.filterXss(dirObj.title);
    if (dirObj.id == "root") s = `<div id="dir_root" style="${dirs.length > 1 ? 'color: #9aa5b8' : 'color:#212930'}" class="item" data-f-id="root">${dirObj.title}</div>`;
    else s = `${sIcon}<span class="item" style="${index != dirs.length - 1 ? 'color:#9aa5b8' : 'color:#212930'}" data-f-id="${dirObj.id || dirObj.folderId}">${dirObj.title}</span>`;
    return s;
  },
  /**
   * 文件列表标题
   * @param {"展示形式 [icon, list]"} t
   * @param {"list 下标题名称"} title
   * @returns {"标题标签 string"}
   */
  "fileListTitle": (t = "icon", title = "") => {
    let s = "";

    switch (t) {
      case "localList":
        s = `<div class="list-title"><div class="col1 col1local">文件名</div><div style="color:#333" class="col2 col2local">文件类型</div><div style="color:#333" class="col3 col3local">拥有者</div><div style="color:#333" class="col4 col4local">修改时间</div></div>`;
        break;
      case "list":
        s = `<div class="list-title"><div class="col1">文件名</div><div style="color:#333" class="col2">拥有者</div><div style="color:#333" class="col3">修改时间</div></div>`;
        break;
      case "icon":
        s = `<div class='file-list-title' data-name='${title}'>${title}</div>`
        break;
    }

    return s;
  },
  /**
   * 请求超时、失败
   * @param {"类型 [timeout, error]"} t
   * @returns {"请求超时、失败 string"}
   */
  "ajaxError": (t) => {
    return `<div class="null null_file">
      <img class="null_file_img" src="src/assets/images/home/emptyFile.svg"/>
  </div>`;
  },
  /**
   * 弹窗遮罩
   * @returns {string}
   */
  "alertMask": () => {
    return `<div id="alert_mask" style="width: 100%; height: 100%;"></div>`;
  },
  /**
   * 弹窗容器
   * @returns {string}
   */
  "alertBox": () => {
    return `
                <div id="alert_box">
                    <div class="alert_head"></div>
                    <span class="alert_close icons">&#xe781;</span>
                    <div class="alert_body"></div>
                </div>
                `;
  },
  /**
   * "设置" 弹窗内容
   * @returns {string}
   */
  "setAlert": () => {
    let isWin = pcUtil.isWin();
    let sUpdataBtn = ``;
    
    sUpdataBtn = `
            <span class="button checkUpdate">检查更新</span>
            <span class="button awaitRestart hide">已更新，请重启</span>
        `;

    return `
                <div class="software_set">
                    <!--基本设置-->
                    <div class="software_item line" data-t="basic">
                        <div class="software_item_text">基本 :</div>
                        <div class="software_item_op">
                            <div class="check" style="display:flex;align-items:center">
                                <input id="set_auto_start" type="checkbox" name="basic" value="auto_start">
                                <label for="set_auto_start">开机自启动ProcessOn</label>
                            </div>
                           ${isWin ? ` <div class="check" style="display:flex;align-items:center">
                           <input id="set_tray_start" type="checkbox" name="basic" value="trayOpen">
                           <label for="set_tray_start">最小化到系统托盘</label>
                        </div>`: ''}
                            <div class="check check_auto_upload">
                                <input id="set_auto_upload" type="checkbox" name="basic" value="auto_upload">
                                <label for="set_auto_upload">新建为云文件</label>
                                <svg class="check_auto_upload_svg" data-v-71f7d169="" xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none"><path data-v-71f7d169="" d="M5.834 0.666626C2.62 0.666626 0 3.28583 0 6.49993C0 9.71413 2.62 12.3333 5.834 12.3333C9.048 12.3333 11.667 9.71413 11.667 6.49993C11.667 3.28583 9.048 0.666626 5.834 0.666626ZM5.834 9.99993C5.513 9.99993 5.25 9.73743 5.25 9.41663C5.25 9.09583 5.513 8.83333 5.834 8.83333C6.155 8.83333 6.417 9.09583 6.417 9.41663C6.417 9.73743 6.155 9.99993 5.834 9.99993ZM7.024 7.27003C6.487 7.62583 6.4 7.81833 6.388 7.85333C6.306 8.09833 6.079 8.24993 5.834 8.24993C5.77 8.24993 5.711 8.23823 5.647 8.22073C5.344 8.11573 5.18 7.78323 5.28 7.47993C5.46 6.95493 5.991 6.55243 6.376 6.29573C7.105 5.81153 7.012 5.28653 6.983 5.11743C6.901 4.65653 6.51 4.26583 6.05 4.18413C5.694 4.11993 5.355 4.21323 5.081 4.44073C4.819 4.66243 4.667 4.98913 4.667 5.33333C4.667 5.65413 4.405 5.91663 4.084 5.91663C3.763 5.91663 3.5 5.65413 3.5 5.33333C3.5 4.64493 3.804 3.99163 4.335 3.54823C4.865 3.09913 5.565 2.91833 6.254 3.03503C7.193 3.20413 7.963 3.97413 8.132 4.91333C8.295 5.84663 7.899 6.68663 7.024 7.27003Z" fill="#9AA5B8"></path></svg>
                                <div data-v-71f7d169="" class="auto_upload_hoverArea">
                                默认新建的文件类型为云文件，离线情况下新建文件将在联网后自动上传至云端
                                <svg data-v-71f7d169="" xmlns="http://www.w3.org/2000/svg" width="12" height="5" viewBox="0 0 12 5" fill="none"><path data-v-71f7d169="" d="M6 4.98828L11.1962 0.48828L0.803847 0.488281L6 4.98828Z" fill="black" fill-opacity="0.75"></path></svg></div>
                            </div>
<!--                            <div class="check">-->
<!--                                <input id="set_on_computer" type="checkbox" name="basic" value="on_computer">-->
<!--                                <label for="set_on_computer">在我的电脑中显示ProcessOn</label>-->
<!--                            </div>-->
                           <!-- <div class="check">
                                <input id="set_auto_update" type="checkbox" name="basic" value="auto_update">
                                <label for="set_auto_update">自动更新</label>
                            </div>
                            -->
                            <!--<div class="cacheDiv">
                              <div class="cacheDiv_left">
                                <div class="cacheDiv_left1">
                                  <span class="cacheDiv_left1_span1">缓存数据</span>
                                  <span class="cacheDiv_left1_span2">约<span id="cacheSize"></span></span>
                                </div>
                                <svg class="clear_cache_svg" data-v-71f7d169="" xmlns="http://www.w3.org/2000/svg" width="12" height="13" viewBox="0 0 12 13" fill="none"><path data-v-71f7d169="" d="M5.834 0.666626C2.62 0.666626 0 3.28583 0 6.49993C0 9.71413 2.62 12.3333 5.834 12.3333C9.048 12.3333 11.667 9.71413 11.667 6.49993C11.667 3.28583 9.048 0.666626 5.834 0.666626ZM5.834 9.99993C5.513 9.99993 5.25 9.73743 5.25 9.41663C5.25 9.09583 5.513 8.83333 5.834 8.83333C6.155 8.83333 6.417 9.09583 6.417 9.41663C6.417 9.73743 6.155 9.99993 5.834 9.99993ZM7.024 7.27003C6.487 7.62583 6.4 7.81833 6.388 7.85333C6.306 8.09833 6.079 8.24993 5.834 8.24993C5.77 8.24993 5.711 8.23823 5.647 8.22073C5.344 8.11573 5.18 7.78323 5.28 7.47993C5.46 6.95493 5.991 6.55243 6.376 6.29573C7.105 5.81153 7.012 5.28653 6.983 5.11743C6.901 4.65653 6.51 4.26583 6.05 4.18413C5.694 4.11993 5.355 4.21323 5.081 4.44073C4.819 4.66243 4.667 4.98913 4.667 5.33333C4.667 5.65413 4.405 5.91663 4.084 5.91663C3.763 5.91663 3.5 5.65413 3.5 5.33333C3.5 4.64493 3.804 3.99163 4.335 3.54823C4.865 3.09913 5.565 2.91833 6.254 3.03503C7.193 3.20413 7.963 3.97413 8.132 4.91333C8.295 5.84663 7.899 6.68663 7.024 7.27003Z" fill="#9AA5B8"></path></svg>
                                <div data-v-71f7d169="" class="clear_cache_hoverArea">
                                仅清除已上传的历史图片、附件、文件上云等临时数据,清除后不影响正常使用
                                <svg data-v-71f7d169="" xmlns="http://www.w3.org/2000/svg" width="12" height="5" viewBox="0 0 12 5" fill="none"><path data-v-71f7d169="" d="M6 4.98828L11.1962 0.48828L0.803847 0.488281L6 4.98828Z" fill="black" fill-opacity="0.75"></path></svg></div>
                                
                              </div>
                              <div class="cacheDiv_right"><span class="button" id="btnClearCache">清除缓存</span></div>
                            </div>-->
                        </div>
                    </div>
                    <!--外观-->
                    <!--<div class="software_item" data-t="aspect"> -->
                    <!--  <div class="software_item_text">外观 :</div> -->
                        <!--<div class="software_item_op"> -->
<!--                            <div class="check disabled">-->
<!--                                <input id="set_follow_system" type="checkbox" name="aspect_follow_system" value="follow_system" disabled>-->
<!--                                <label for="set_follow_system">随系统自动切换</label>-->
<!--                            </div>-->
                          <!--   <div class="aspects">
                                <div class="aspect">
                                    <label for="set_light_color" class="aspect_img"><img src="assets/images/bg_set_light.png"/></label>
                                    <div class="aspect_checkbox radio">
                                        <input id="set_light_color" type="radio" name="aspect" value="light_color" checked>
                                        <label for="set_light_color">浅色</label>
                                    </div>
                                </div>
                                <div class="aspect disabled">
                                    <label for="set_dark_color" class="aspect_img"><span class="aspect_expect">敬请期待</span><img src="assets/images/bg_set_dark_gray.png"/></label>
                                    <div class="aspect_checkbox radio disabled">
                                        <input id="set_dark_color" type="radio" name="aspect" value="dark_color" disabled>
                                        <label for="set_dark_color">深色</label>
                                    </div>
                                </div>
                            </div> -->
                        <!--</div> -->
                    <!--</div> -->
                    <!--语言-->
<!--                    <div class="software_item" data-t="language">-->
<!--                        <div class="software_item_text">语言 :</div>-->
<!--                        <div class="software_item_op top">-->
<!--                            <select name="language">-->
<!--                                <option value ="follow_system" disabled>跟随系统语言</option>-->
<!--                                <option value ="chinese">中文</option>-->
<!--                            </select>-->
<!--                        </div>-->
<!--                    </div>-->
                    <!--日期格式-->
<!--                    <div class="software_item" data-t="date_format">-->
<!--                        <div class="software_item_text">日期格式 :</div>-->
<!--                        <div class="software_item_op top">-->
<!--                            <select name="date_format">-->
<!--                                <option value ="YYYY-MM-DD">YYYY-MM-DD</option>-->
<!--&lt;!&ndash;                                <option value ="YYYY/MM/DD">YYYY/MM/DD</option>&ndash;&gt;-->
<!--                            </select>-->
<!--                        </div>-->
<!--                    </div>-->
                    <!--同步文件夹-->
<!--                    <div class="software_item">-->
<!--                        <div class="software_item_text">同步文件夹 :</div>-->
<!--                        <div class="software_item_op">-->
<!--                            <input type="text" name="synchronize_folder"/>-->
<!--                            <span class="button main">预览</span>-->
<!--                        </div>-->
<!--                    </div>-->
                    <!--文件输出-->
                    <!-- <div class="software_item" data-t="file_output">
                        <div class="software_item_text">文件输出 :</div>
                        <div class="software_item_op top">
                            <input type="text" name="file_output" readonly/>
                            <span class="button main">查看</span> 
                        </div>
                    </div>-->
                    <!--网络代理-->
                    <div class="software_item" style="display: flex;align-items: baseline" data-t="version_updating">
                        <div class="software_item_text">网络代理 :</div>
                        <div class="software_item_op">
                        <!-- 代理选择器 -->
                        <div style="margin-bottom: 15px; display: flex; align-items: center;">
                            <span style="width: 80px; font-size: 13px; color: #606266;">代理类型</span>
                            <select id="proxySelector" style="width: 200px; padding: 6px 8px; border: 1px solid #dcdfe6; border-radius: 4px;">
                                <option value="none">无代理</option>
                                <option value="browser">浏览器代理</option>
                                <option value="http">HTTP/HTTPS代理</option>
                            </select>
                        </div>
                        <div id="otherForm" style="text-align:right">
                                <button id="saveProxyBtn1" style="padding: 7px 15px; background: #409eff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    保存
                                </button>
                        </div>
                        <!-- 代理配置表单 -->
                        <div id="proxyConfigForm" style="display: none;">
                            <div style="margin-bottom: 15px; display: flex; align-items: baseline;">
                                <span style="width: 80px; font-size: 13px; color: #606266;">地址</span>
                                <input type="text" id="proxyAddress" placeholder="例如：192.168.1.1" 
                                       style="width: 200px; padding: 6px 8px; border: 1px solid #dcdfe6; border-radius: 4px;">
                            </div>
                            
                            <div style="margin-bottom: 15px; display: flex; align-items: center;">
                                <span style="width: 80px; font-size: 13px; color: #606266;">端口</span>
                                <input type="number" id="proxyPort" placeholder="例如：8080" min="1" max="65535"
                                       style="width: 183px; padding: 6px 8px; border: 1px solid #dcdfe6; border-radius: 4px;">
                            </div>
                            
                            <div style="margin-bottom: 15px; display: flex; align-items: center;">
                                <span style="width: 80px; font-size: 13px; color: #606266;">用户名</span>
                                <input type="text" id="proxyUser" placeholder="可选"
                                       style="width: 200px; padding: 6px 8px; border: 1px solid #dcdfe6; border-radius: 4px;">
                            </div>
                            
                            <div style="margin-bottom: 15px; display: flex; align-items: center;">
                                <span style="width: 80px; font-size: 13px; color: #606266;">密码</span>
                                <input type="password" id="proxyPass" placeholder="可选"
                                       style="width: 183px; padding: 6px 8px; border: 1px solid #dcdfe6; border-radius: 4px;">
                            </div>
                            
                            <div style="margin-bottom: 15px; display: flex; align-items: center;">
                                <span style="width: 80px;"></span>
                                <button id="testProxyBtn" style="padding: 7px 15px; background: #409eff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    测试连接
                                </button>
                                <span style="width: 59px;"></span>
                                <button id="saveProxyBtn" style="padding: 7px 15px; background: #409eff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                                    保存
                                </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    <!--版本更新-->
                    <div class="software_item" style="display: flex;align-items: center" data-t="version_updating">
                        <div class="software_item_text">版本更新 :</div>
                        <div class="software_item_op">
                            <div class="versions">当前版本 V<span></span></div>
                            ${sUpdataBtn}
                        </div>
                    </div>
                    <!--清除系统缓存-->
                    <div class="software_item hide" style="display: flex;align-items: center" data-t="clearDB">
                        <div class="software_item_text"></div>
                        <div class="software_item_op">
                            <span class="button error clearDB">清除系统缓存</span>
                        </div>
                    </div>
                </div>
                `;
  },
  "loadMore": () => {
    return `
                <div id="loadMore">
                    <img src="./src/assets/images/loading.gif"/>
                </div>
                `;
  },
  /**
   * tabGroup “新建”按钮
   * @param {"按钮文案"} newTabButtonText
   * @param {"按钮文案"} newTabTitle
   * @returns {string}
   */
  "etabsNewTab": (newTabButtonText = "", newTabTitle = "新建") => {
    return `
                <button class="etabs-tab-button-new">
                    <img class="tab_add" src="./src/assets/images/tab_add.png"/>
                    <span>${pcUtil.filterXss(newTabTitle)}</span> 
                    <img class="tab_more" src="./src/assets/images/choose.png"/>
                </button>
                `;
  },
  /**
   * 搜索结果标签页
   * @param {"默认标页"} pitch
   * @returns {string}
   */
  "searchTab": (pitch = '') => {
    if (pitch != '' && pitch != 'colla' && pitch != 'fav') pitch = 'all';

    let isOnline = pcUtil.isOnline();
    let sColla = isOnline ? `<div class="searchTab ${pitch == 'colla' ? 'active' : ''}" data-type="colla">与我协作</div>` : '';

    let s = `
            <div class="searchBox">
                <div class="searchTabs">
                   <div class="searchTab ${pitch == '' ? 'active' : ''}" data-type="">全部</div>
                    <div class="searchTab ${pitch == 'my' ? 'active' : ''}" data-type="my">我的文件</div>
                    ${sColla}
                </div>
                <div class="searchBody">
                </div>
            </div>
        `;

    return s;
  },
  "openUrlConfirm": () => {
    const webRoot = window.webRoot;
    return `
      <div id="po_open_url_confirm_mask" style="display:none;position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(17,24,39,0.32);z-index:2000;">
        <div id="po_open_url_confirm_dialog" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:460px;padding:24px 28px 20px;background:#fff;border-radius:6px;box-sizing:border-box;">
          <div style="display:flex;align-items:center;gap:8px;font-size:16px;font-weight:600;color:#212930;">
            <img src="../../../../assets/images/on.png" style="width:20px;height:20px;" />
            <span>詹</span>
          </div>
          <div style="margin-top:16px;font-size:14px;color:#212930;line-height:20px;">即将离开 ProcessOn，请注意账号财产安全</div>
          <div class="po-open-url-link" style="margin-top:8px;padding:10px 12px;background:#f7f9fc;border:1px solid #e8edf5;border-radius:4px;font-size:12px;color:#8c99ab;word-break:break-all;line-height:18px;"></div>
          <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:18px;">
            <span class="po-open-url-cancel" style="min-width:88px;height:32px;line-height:32px;text-align:center;border-radius:4px;font-size:12px;cursor:pointer;user-select:none;background:#fff;border:1px solid #d7dde8;color:#4c5a70;">取消</span>
            <span class="po-open-url-continue" style="min-width:88px;height:32px;line-height:32px;text-align:center;border-radius:4px;font-size:12px;cursor:pointer;user-select:none;background:#4285f4;border:1px solid #4285f4;color:#fff;">继续访问</span>
          </div>
        </div>
      </div>
    `;
  },
  /**
   * 软件更新弹窗
   * @param {"页面类型"} type
   * @param {"版本号"} v
   * @returns {string}
   */
  "upData": (type, v) => {
    let s = "";

    switch (type) {
      case 0:
        s = `
                <div class="v_upData" data-type="0">
                    <div class="title">检查更新</div>
                    <div class="logo">
                        <img src="src/assets/images/logo/logo.png">
                        <span class="version">${v}版本</span>
                    </div>
                    <div class="line"></div>
                    <div class="newly">
                        <div class="label">【版本描述】</div>
                        <div class="content"></div>
                    </div>
                    <div class="footer">
                        <div class="button main" data-type="update">更新</div>
                        <div class="button" data-type="cancel">取消</div>
                    </div>
                </div>
                `;
        break;
      case 1:
        s = `
                    <div class="v_upData" data-type="1">
                        <div class="title">检查更新</div>
                        <div class="logo">
                            <img src="src/assets/images/logo/logo.png">
                            <span class="version">${v}</span>
                        </div>
                        <div class="line"></div>
                        <div class="newly">
                            <div class="label">【版本描述】</div>
                            <div class="content"></div>
                        </div>
                        <div class="progressBox">
                            <div class="progress_line"><div></div></div>
                            <div class="progress_percentum"><span>0%</span></div>
                            <div class="progress_num">
                                <span class="progress_now">0M</span>/<span class="progress_total">0M</span>
                            </div>
                        </div>
                        <div class="footer">
<!--                            <div class="button" data-type="cancel">取消</div>-->
                            <div class="button hide" data-type="restart">重启软件</div>
                        </div>
                    </div>
                `;
        break;
    }
    return s;
  }
};

export default HtmlStr;
