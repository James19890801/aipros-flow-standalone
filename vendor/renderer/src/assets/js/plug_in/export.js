import { ipc1, importClass } from './ipc.js'
import FileDatabase from '../pc/operation/fileDatabase.js'
import {fileCache} from './common.js'
/**
 * @description 导出csv 实际上是xlsx
 * @param {*} definetion
 * @returns base64
 */
async function handleExportCsv(definetion) {
  try {
    if (typeof definetion !== "object") {
      throw Error("请传入json对象的思维导图文件定义");
    }

    const jsonData = definetion;
    // 创建一个工作簿
    const workbook = new ExcelJS.Workbook();
    // 添加一个工作表
    const worksheet = workbook.addWorksheet("Sheet 1");

    function generateCSV(datalist = []) {
      if (datalist.find(i => i != undefined) == undefined) {
        return
      }
      nextColumsData = [];
      // 当前列总数据
      let currnetColumnsData = datalist;
      // 循环每一项
      for (let i = 0; i < currnetColumnsData.length; i++) {
        //  1、去掉所有leftChildren push到children
        let item = currnetColumnsData[i];
        if (!item) {
          curHeight++;
          columnsValues.push(undefined);
          nextColumsData.push(undefined);
          continue;
        }
        // format一下 都变成children
        // if (item.leftChildren) {
        //   item.children ? item.children.push(...item.leftChildren) : (item.children = item.leftChildren);
        // }
        if (item.freeChildren) {
          item.children ? item.children.push(...item.freeChildren) : (item.children = item.freeChildren);
        }
        if (item.summaries) {
          item.children ? item.children.push(...item.summaries) : (item.children = item.summaries);
        }

        function formatColumns(item) {
          const title = getText(item.title)
          if (item.link && item.link.value) {
            if (item.link.title == '') {
              columnsValues.push({ text: replaceTitle(title), hyperlink: item.link.value });
            }
            else {
              columnsValues.push({ text: `${replaceTitle(title)}[${replaceTitle(item.link.title)}]`, hyperlink: item.link.value });
            }
          } else if (item.image) {
            columnsValues.push(`${replaceTitle(title)} \n [${item.image.url}]`);
          } else if (item.file && item.file.value) {
            columnsValues.push({ text: `${replaceTitle(title)}[${replaceTitle(item.file.title)}]`, hyperlink: item.file.value });
          } else if (item.note) {
            columnsValues.push(replaceTitle(title) + `[${item.note}]`);
          } else if (item.code) {
            columnsValues.push(replaceTitle(title) + `[${item.text}]`);
          }
          //   else if (item.file) {
          //     columnsValues.push(`${item.title} \n [${item.file.value}]`);
          //   }
          else {
            columnsValues.push(replaceTitle(title));
          }
        }

        // 2计算这个item的高度
        const itemHeight = handleComputedHeight(item.children);
        if (itemHeight > 0) {
          // 按开始行，开始列，结束行，结束列合并
          columnsValues = columnsValues.concat(new Array(itemHeight - 1).fill());
          formatColumns(item);
          worksheet.mergeCells(curHeight + 1, columnsIndex, curHeight + itemHeight, columnsIndex);
          curHeight += itemHeight;
        } else {
          formatColumns(item);
          curHeight += 1;
        }

        // 4如果还有children就递归计算
        if (item.children) {
          if (item.children && item.children.length > 0) {
            if (!item.collapsed) {
              nextColumsData.push(...(item.children || undefined));
            }
            else {
              if (!Object.hasOwnProperty.call(item, 'password')) {
                nextColumsData.push(...(item.children || undefined));
              }
              else {
                item.children.forEach(() => {
                  nextColumsData.push(undefined);
                })
              }
            }
          } else if (item.children && item.children.length === 0) {
            nextColumsData.push(undefined);
          }
        }
      }

      // 设置每一列的值 然后合并单元格
      worksheet.getColumn(columnsIndex).values = columnsValues;
      // 5设置这一列的样式
      worksheet.getColumn(columnsIndex).alignment = { vertical: "middle", horizontal: "left" };

      //6迭代这一列的每个单元格，计算文字宽度，并设置列宽
      worksheet.getColumn(columnsIndex).eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        // 计算文字宽度（这里简化为文字长度）
        // const cell = worksheet.getCell(curHeight + itemHeight, columnsIndex);
        // cell.style = {
        //   font: { color: { argb: "0000FF" }, underline: true },
        // };
        if (cell.value) {
          if (cell.value.hyperlink) {
            cell.style = {
              font: { color: { argb: "0000FF" }, underline: true },
              alignment: { vertical: "middle", horizontal: "left" },
            };
          }

          const textWidth = cell.value.toString().length + 10;
          // 设置列宽为文字宽度
          worksheet.getColumn(columnsIndex).width = Math.max(worksheet.getColumn(columnsIndex).width || 0, textWidth);
        }
      });
      if (nextColumsData.length) {
        columnsIndex++;
        columnsValues = [];
        curHeight = 0;
        generateCSV(nextColumsData);
      }
    }
    function getText(str) {
      if (str.indexOf('</ul>') > -1 || str.indexOf('</b>') > -1 || str.indexOf('</i>') > -1
        || str.indexOf('</font>') > -1 || str.indexOf('<br>') > -1 || str.indexOf('<br/>') > -1) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(str, 'text/html');
        const element = doc.body;
        let textContent = ''
        return getChildText(element, textContent)
      }
      else {
        return str
      }
    }
    function getChildText(element, textContent) {
      for (let i = 0; i < element.childNodes.length; i++) {
        const childNode = element.childNodes[i];
        if (childNode.nodeType === Node.TEXT_NODE) {
          // 如果子节点是文本节点，则添加到文本内容中  
          textContent += childNode.textContent;
        }
        else if (childNode.childNodes.length > 0) {
          textContent = getChildText(childNode, textContent)
        }
      }
      return textContent
    }

    function download_file(buffer, fileName) {
      let fileURL = window.URL.createObjectURL(new Blob([buffer]));
      let fileLink = document.createElement("a");
      fileLink.href = fileURL;
      fileLink.setAttribute("download", fileName);
      document.body.appendChild(fileLink);
      fileLink.click();
    }
    /**
     * @descriptiong 给我一个item 我返回这个item应该有的高度（合并单元格的数量）
     * @param {itemChildren} itemChildren
     * @returns
     */
    function handleComputedHeight(itemChildren) {
      let currItemHeight = 0;
      function computeItemHeight(itemChildren) {
        itemChildren.forEach((element) => {
          if (element.children && element.children.length == 0) {
            currItemHeight++;
          } else {
            computeItemHeight(element.children);
          }
        });
      }
      computeItemHeight(itemChildren);
      return currItemHeight;
    }

    function formatFreePos(jsonObject) {
      let appendRootItem = [];
      if (jsonObject.children && jsonObject.children.length > 0) {
        for (let i = jsonObject.children.length - 1; i >= 0; i--) {
          if (jsonObject.children[i].pos) {
            appendRootItem.push(jsonObject.children[i]);
            jsonObject.children.splice(i, 1); // 删除元素
          }
        }
      }
      return appendRootItem;
    }

    let curHeight = 0; // 当前item的高度用于计算下一个合并单元格的起始位置
    let columnsIndex = 1; // 当前列
    let columnsValues = []; // 当前列的值 [title，title,title]
    let nextColumsData = []; // 下一列的所有数据

    // 处理自由主题 要拿出来放到第一层
    const rootItemPos = formatFreePos(jsonData)
    generateCSV([jsonData, ...rootItemPos]);
    const buffer = await workbook.xlsx.writeBuffer();
    // download_file(buffer, "测试数据.csv");
    const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
    return base64;
  } catch (error) {
    throw Error(error);
  }
}
/**
 *
 * @description {*} 导出word （docx）
 * @returns base64
 */
function handleExportDocx(definetion) {
  return new Promise((reslove) => {
    let fontSize = "13";

    function createList(data, root = false) {
      let content = `<ul>`;

      data.forEach((item) => {
        const hasLink = (item.link && item.link.value) || (item.file && item.file.value);
        let inner = hasLink ? `${replaceTitle(item.title)}<a href="${item.link?.value || item.file.value}">[${item.title}]</a>` : `${replaceTitle(item.title)}`;
        // 是否有备注
        if (item.note) {
          inner += `[${item.note}]`
        }
        // 是否有代码块
        if (item.code) {
          inner += `[${item.code.text}]`
        }
        // 是否有图片？
        if (item.image) {
          inner += `<img src=${item.image.url} style="width:${item.image.w}px;height:${item.image.h}px;" alt=""/>`
        }
        content += `<li style="font-size:${root ? "20" : fontSize}px;font-weight:${root ? "bold" : "400"};">${inner}`;
        if (item.children && item.children.length > 0) {
          if (!item.collapsed) {
            content += createList(item.children);
          }
          else {
            if (!Object.hasOwnProperty.call(item, 'password')) {
              content += createList(item.children);
            }
          }
        }

        content += "</li>";
      });

      content += "</ul>";
      return content;
    }

    // format一下 都变成children
    // if (definetion.leftChildren) {
    //   definetion.children ? definetion.children.push(...definetion.leftChildren) : (definetion.children = definetion.leftChildren);
    // }
    if (definetion.freeChildren) {
      definetion.children ? definetion.children.push(...definetion.freeChildren) : (definetion.children = definetion.freeChildren);
    }
    if (definetion.summaries) {
      definetion.children ? definetion.children.push(...definetion.summaries) : (definetion.children = definetion.summaries);
    }
    const content = createList([definetion], true);

    const html = `
    <html>
      <body style="font-family:'Arial';">
        <div>${content}</div>
      </body>
    </html>
  `;
    const blob = new Blob([html], { type: "application/msword" });
    const reader = new FileReader();

    reader.onload = function () {
      const base64Data = reader.result.split(",")[1];
      reslove(base64Data);
    };

    reader.readAsDataURL(blob);

    // const link = document.createElement("a");
    // link.href = URL.createObjectURL(blob);
    // link.download = "generated-document.docx";
    // link.click();
  });
}
/**
 * @description 导出opml
 * @returns base64
 */
function handleExportOpml(defs) {
  return new Promise(async (reslove) => {
    function generateOpml(data) {
      return new Promise((reslove1) => {
        function parseObj2Opml(children, innerBody) {
          const count = children.length;
          let index = 0;
          children.forEach(function (e, i, a) {
            var itemChild = e.children || [];
            var imgattr = ''
            if (e.image) {
              try {
                if (e.image.indexOf(';base64,') == -1) {
                  imgattr = e.image ? 'image="' + encodeURI(JSON.stringify(e.image).replace(/&/g, "&amp;")) + '"' : "";
                }
                else {
                  imgattr = e.image ? 'image="' + e.image + '"' : "";
                }
              }
              catch {
                imgattr = 'image="' + encodeURI(e.image.url.replace(/&/g, "&amp;")) + '"'
              }
            }
            if (itemChild.length > 0) {
              innerBody += '<outline text="' + filterXss(e.title) + '" ' + imgattr + " >";
              innerBody += parseObj2Opml(e.children, "")
              innerBody += "</outline>";
              index++
            } else {
              innerBody += '<outline text="' + filterXss(e.title) + '" ' + imgattr + "/>";
              index++
            }
          })
          return innerBody
        }
        function parseOpmlWithBase64(children) {
          return new Promise((reslove) => {
            const count = children.length;
            let index = 0;
            children.forEach(function (e, i, a) {
              if (e.image && e.image.url.indexOf('http') == -1) {
                ipc.invoke('loadFileB64', { type: 'local', path: e.image.url.replace('file:///', '') }).then((res) => {
                  res = res.data
                  const suffix = e.image.url.substring(e.image.url.lastIndexOf('.') + 1)
                  e.image = 'data:image/' + suffix + ';base64,' + res;

                  if (e.children.length > 0) {
                    parseOpmlWithBase64(e.children, "").then((res) => {
                      e.children = res;
                      index++;
                    })
                  }
                  else index++
                })
              }
              else {
                if (e.children.length > 0) {
                  parseOpmlWithBase64(e.children, "").then((res) => {
                    e.children = res;
                    index++;
                  })
                }
                else index++
              }
            })

            const inte = setInterval(() => {
              if (count == index) {
                clearInterval(inte)
                reslove(children)
              }
            }, 100)
          })
        }

        function filterXss(val) {
          if (val == null || val == "") {
            return "";
          }
          val = val.toString();
          val = val.replace(/&/g, "&amp;");
          val = val.replace(/</g, "&lt;");
          val = val.replace(/%3C/g, "&lt;");
          val = val.replace(/%3E/g, "&gt;");
          val = val.replace(/'/g, "&#39;");
          val = val.replace(/"/g, "&quot;");
          val = val.replace(/&nbsp;/g, " ");
          return val;
        }
        var headtxt = "";
        if ((data.id = "root")) {
          headtxt = "<head><title>" + filterXss(data.title).replace(/</g, "&lt;") + "</title></head>";
        }
        var lr = data.children,
          ll = data.leftChildren || [];
        ll.forEach((d) => {
          lr.push(d)
        })
        var children = lr,
          innerBody = "";
        parseOpmlWithBase64(children).then((newchildren) => {
          newchildren = parseObj2Opml(children, innerBody)
          var opmlTxt = '<?xml version="1.0" encoding="UTF-8"?><opml version="2.0">' + headtxt + "<body>" + newchildren + "</body></opml>";

          reslove1(btoa(unescape(encodeURIComponent(opmlTxt))));
        })
      })
    }
    // if (typeof chartTitle != "undefined" && chartTitle) {
    //   outlineExport.info.title = chartTitle;
    // } else {
    //   outlineExport.info.title = outlineObj.model.data.title.substring(0, 35);
    // }
    // const base64data = await 
    generateOpml(defs).then((base64data) => {
      reslove(base64data);
    })
  });
}

/**
 * @description 导出xmind
 */
function handleExportXmind(definetion) {
  // 说明 todo 
  /**
   *  xmind文件一共需要
   */

  function convertToXmind(inputData) {
    // 初始化 xmind 数据结构
    const xmindData = [];

    // 处理根节点
    const rootTopic = createTopic(inputData);
    xmindData.push({ rootTopic, id: 'root', class: 'sheet' });

    return xmindData;
  }

  function createTopic(data) {
    // 创建一个 xmind 节点
    const topic = {
      "extensions": [],
      "class": "topic",
      "structureClass": "org.xmind.ui.map.unbalanced",
      "notes": data.note ? {
        "plain": {
          "content": data.note
        },
        "realHTML": {
          "content": `<div>${data.note.replace("\n", '<br>')}</div>`
        }
      } : {},
      "comments": [],
      "id": data.id === 'root' ? generateRandomId() : data.id,
      "title": replaceTitle(data.title),
      "markers": [],
      "labels": data.tags ? data.tags.map(tag => tag.text) : [],
    };

    // 处理链接
    if (data.link) {
      topic.href = data.link.value;
    }

    // 处理文件
    if (data.file) {
      topic.attachment = { title: data.file.title, href: data.file.value };
    }

    // 处理图片
    if (data.image) {
      topic.image = {
        "src": data.image.url,
        "w": data.image.w,
        "h": data.image.h,
        "width": data.image.width,
        "type": data.image.type,
        "url": data.image.url,
        "direction": data.image.direction,
        "height": data.image.height,
      };
    }

    // 递归处理子节点
    if (data.children && data.children.length > 0) {
      if (!data.collapsed) {
        topic.children = {
          "attached": data.children.map(child => createTopic(child)),
        };
      }
      else {
        if (!Object.hasOwnProperty.call(data, 'password')) {
          topic.children = {
            "attached": data.children.map(child => createTopic(child)),
          };
        }
      }
    }

    return topic;
  }


  function fromate(definetion) {
    let target = definetion
    if (typeof definetion == 'string') {
      target = JSON.parse(definetion)
    }

    // if (target.leftChildren && target.leftChildren.length > 0) {
    //   target.children.push(...target.leftChildren)
    // }
    if (target.freeChildren && target.freeChildren.length > 0) {
      target.children.push(...target.freeChildren)
    }
    if (target.summaries && target.summaries.length > 0) {
      target.children.push(...target.summaries)
    }
    return target
  }

  // 示例用法
  const inputData = fromate(definetion)
  const xmindResult = convertToXmind(inputData);
  console.log(JSON.stringify(xmindResult, null, 2));
  return xmindResult
}

function generateRandomId() {
  const characters = "abcdef0123456789";
  let result = "";

  for (let i = 0; i < 12; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}

function replaceTitle(str) {
  if (str.indexOf('data-equation="') > -1) {
    return matchEquality(str)
  }
  return str.replace(/<\/?span[^>]*>/g, "");
}
function matchEquality(htmlString) {
  const title = htmlString.replace(/<\/?span[^>]*>/g, "") || '';
  const equationMatch = htmlString.match(/data-equation="([^"]*)"/);
  return (equationMatch && equationMatch[1]) ? title + equationMatch[1] : title
}

// 导出ppt
const exportPPTX = {
  init(defs) {

    let pptx = new PptxGenJS();
    // 首页
    let slide = pptx.addSlide();
    let textboxText = defs.title;
    let textboxOpts = { x: '10%', y: '10%', w: '80%', h: '35%', color: "333333", align: 'center', valign: 'bottom', bold: true, fontSize: 40, fontFace: '微软雅黑', charSpacing: 4 };
    textboxOpts = this.pptxAddOn(defs, textboxOpts);
    slide.addText(textboxText, textboxOpts);
    textboxText = '演讲人';
    textboxOpts = { x: '40%', y: '65%', w: '20%', h: '5%', color: "666666", align: 'center', fontSize: 12, fontFace: '微软雅黑', charSpacing: 2 };
    slide.addText(textboxText, textboxOpts);
    textboxText = pcUtil.getCurrentTimeString(Date.now()).substring(0, 10);
    textboxOpts = { x: '40%', y: '70%', w: '20%', h: '5%', color: "666666", align: 'center', fontSize: 12, fontFace: '微软雅黑', charSpacing: 2 };
    slide.addText(textboxText, textboxOpts);

    const def = []
    defs.children.forEach((d) => {
      def.push(d)
    })
    // defs.leftChildren.forEach((d) => {
    //   def.push(d)
    // })
    defs.freeChildren && defs.freeChildren.forEach((d) => {
      def.push(d)
    })
    defs.summaries && defs.summaries.forEach((d) => {
      def.push(d)
    })
    if (Object.hasOwnProperty.call(defs, 'summaries')) {
      if (defs.summaries.length > 0) {
        defs.summaries.forEach((d) => {
          def.push(d)
        })
      }
    }

    this.pptxSlide(def, pptx, 1)

    // 尾页
    slide = pptx.addSlide();
    textboxText = '感谢聆听';
    textboxOpts = { x: '20%', y: '35%', w: '60%', h: '10%', color: "333333", align: 'center', bold: true, fontSize: 40, fontFace: '微软雅黑', charSpacing: 2 };
    slide.addText(textboxText, textboxOpts);
    pptx.write("base64")
      .then((data) => {
        const saveData = {
          type: 'save', data: data, path: window.saveName, suffix: 'pptx',
        }
        // const saveData = {
        //   type: 'local', data: data, path: 'C:/Users/孙宏帅/Downloads/1234.pptx', suffix: 'pptx',
        // }
        if (window.downType) {
          ipc.sendToHost('down')
        }
        ipc1.sendSync('saveFileB64', saveData).then((res) => {
          if (res != '') {
            new Toast({ type: 'success', msg: '保存成功' })
            console.log(Date.now())
            if (window.downType) {
              ipc.sendToHost('downed')
            }
          }
          else {
            if (window.downType) {
              ipc.sendToHost('cancel')
            }
          }
        })
      })
      .catch((err) => {
        if (window.downType) {
          ipc.sendToHost('cancel')
        }
        console.error(err);
      });
  },

  pptxSlide(def, pptx, level, parent = null) {
    // 如果不是一级子菜单
    if (level != 1) {
      // 在这之下没有子菜单
      if (def.filter(d => d.children.length != 0 || !Object.hasOwnProperty.call(d, 'summaries')).length == 0) {
        if (def.length < 7) {
          this.pptxLengthToInsert(def, parent, pptx, false)
        }
        else {
          const defCount = def.length - 1
          let defArray = []
          def.forEach((d, i) => {
            defArray.push(d)
            if (i != 0 && i % 6 == 5) {
              this.pptxInsertSix(defArray, parent, pptx, false)
              defArray = []
            }
            else if (i == defCount) {
              this.pptxLengthToInsert(defArray, parent, pptx, true)
            }
          })
        }
      }
      // 存在子菜单
      else {
        if (def.length < 7) {
          this.pptxLengthToInsert(def, parent, pptx, true)
          def.forEach((dc) => {
            // 是否可以放到一个页面中
            // 是否子菜单还存在子菜单
            console.log(level + 1)
            if (!dc.collapsed) {
              const cdef = this.pptxCountDef(dc)
              this.pptxSlide(cdef, pptx, level + 1, dc)
            }
            else {
              if (!Object.hasOwnProperty.call(dc, 'password')) {
                const cdef = this.pptxCountDef(dc)
                this.pptxSlide(cdef, pptx, level + 1, dc)
              }
            }
          })
        }
        else {
          const defCount = def.length - 1
          let defArray = []
          def.forEach((d, i) => {
            defArray.push(d)
            if (i != 0 && i % 6 == 0) {
              this.pptxInsertSix(defArray, parent, pptx, true)
              defArray.forEach((dc) => {
                // 是否可以放到一个页面中
                // 是否子菜单还存在子菜单
                console.log(level + 1)
                if (!dc.collapsed) {
                  const cdef = this.pptxCountDef(dc)
                  this.pptxSlide(cdef, pptx, level + 1, dc)
                }
                else {
                  if (!Object.hasOwnProperty.call(dc, 'password')) {
                    const cdef = this.pptxCountDef(dc)
                    this.pptxSlide(cdef, pptx, level + 1, dc)
                  }
                }
              })
              defArray = []
            }
            else if (i == defCount) {
              this.pptxLengthToInsert(defArray, parent, pptx, true)
              defArray.forEach((dc) => {
                // 是否可以放到一个页面中
                // 是否子菜单还存在子菜单
                console.log(level + 1)
                if (!dc.collapsed) {
                  const cdef = this.pptxCountDef(dc)
                  this.pptxSlide(cdef, pptx, level + 1, dc)
                }
                else {
                  if (!Object.hasOwnProperty.call(dc, 'password')) {
                    const cdef = this.pptxCountDef(dc)
                    this.pptxSlide(cdef, pptx, level + 1, dc)
                  }
                }
              })
            }
          })
        }
      }

      // this.pptxInsertLengthTooLong(def, parent, pptx, false)
    }
    // 1级子菜单
    else {
      def.forEach((d, i) => {
        // isEnd = false
        let slide = pptx.addSlide();
        const index = i < 9 ? '0' + (i + 1) : (i + 1).toString();
        let textboxText = index;
        let textboxOpts = {
          x: '17%', y: '30%', w: '9%', h: '15%', color: "ffffff", align: 'left', bold: true, fontSize: 30, fontFace: '微软雅黑', charSpacing: 2
          , fill: { color: '8eaadc' }
        };
        slide.addText(textboxText, textboxOpts);
        let lengthSize = (d.title.length / 15)
        let fontSize = 30
        if (lengthSize >= 1) {
          fontSize = fontSize - (parseInt(lengthSize) * 5)
          fontSize = fontSize < 6 ? 6 : fontSize
        }
        textboxText = replaceTitle(d.title);
        textboxOpts = { x: '16%', y: '50%', w: '60%', h: '10%', color: "333333", align: 'left', valign: 'top', bold: true, fontSize: 30, fontFace: '微软雅黑', charSpacing: 2 };
        textboxOpts = this.pptxAddOn(d, textboxOpts);
        slide.addText(textboxText, textboxOpts);
        // 如果子项只到下一级并且不长
        // if (d.children.length > 0 && d.children.length < 4 && d.children.filter(dc => dc.children.length > 0).length == 0
        //   && d.children.filter(dc => dc.title.length > 29).length == 0) {
        //   isEnd = true
        //   d.children.forEach((dc, ic) => {
        //     const dcy = (60 + (ic * 5)) + '%';
        //     textboxText = dc.title;
        //     textboxOpts = { x: '16%', y: dcy, w: '60%', h: '5%', color: "666666", align: 'left', fontSize: 12, fontFace: '微软雅黑', charSpacing: 2 };
        //     slide.addText(textboxText, textboxOpts);
        //   })
        // }
        // // 其他情况
        // else {
        if (!d.collapsed) {
          const cdef = this.pptxCountDef(d)
          this.pptxSlide(cdef, pptx, level + 1, d)
        }
        else {
          if (!Object.hasOwnProperty.call(d, 'password')) {
            const cdef = this.pptxCountDef(d)
            this.pptxSlide(cdef, pptx, level + 1, d)
          }
        }
        // }
      })
    }
  },

  pptxCountDef(dc) {

    let isSummaries = false
    if (Object.hasOwnProperty.call(dc, 'summaries')) {
      if (dc.summaries.length > 0) {
        isSummaries = true
      }
    }
    let cdef = []
    dc.children.forEach((dcc, ic) => {
      if (!Object.hasOwnProperty.call(dcc, 'password')) {
        cdef.push(dcc)
      }
      if (isSummaries) {
        dc.summaries.forEach((dcc) => {
          const range = dcc.range.split(',')
          if (range[1] == ic) {
            cdef.push(dcc)
          }
        })
      }
    })
    return cdef
  },

  pptxLengthToInsert(def, parent, pptx, isChild = false) {
    switch (def.length) {
      case 1:
        this.pptxInsertOne(def, parent, pptx, true)
        break;
      case 2:
        this.pptxInsertTwo(def, parent, pptx, true)
        break
      case 3:
        this.pptxInsertThree(def, parent, pptx, true)
        break;
      case 4:
        this.pptxInsertFour(def, parent, pptx, true)
        break;
      case 5:
        this.pptxInsertFive(def, parent, pptx, true)
        break;
      case 6:
        this.pptxInsertSix(def, parent, pptx, true)
        break;
    }
  },

  pptxInsertOne(def, parent, pptx, isChild = false) {
    if (def.filter(d => d.title.length > 10).length > 0) {
      this.pptxInsertLengthTooLong(def, parent, pptx, isChild)
    }
    else {
      if (def[0].title.length < 7) {
        this.pptxInsertDefault(def[0].title, pptx, parent.title, def[0])
      }
      else {
        // 背景图
        let slide = pptx.addSlide();
        slide.addImage({ path: '../../../../assets/images/ppt/1-1-1.png', x: 0, y: 0, w: '40%', h: '100%' }
        )
        // title
        let textboxText = replaceTitle(parent.title);
        let textboxOpts = {
          x: '25%', y: '30%', w: '65%', h: '10%', color: "333333", align: 'left', valign: 'top', bold: true, fontSize: 30, fontFace: '微软雅黑', charSpacing: 2
        };
        slide.addText(textboxText, textboxOpts);
        textboxText = replaceTitle(def[0].title);
        // 计算文本大小
        let fontSize = 15
        let lengthSize = (def[0].title.length / 100)
        if (lengthSize >= 1) {
          fontSize = fontSize - (parseInt(lengthSize) * 2)
          fontSize = fontSize < 6 ? 6 : fontSize
        }
        // 内容
        textboxOpts = {
          x: '26%', y: '45%', w: '65%', h: '30%', color: "333333", align: 'left', valign: 'top', fontSize: fontSize, fontFace: '微软雅黑', charSpacing: 2,
          lineSpacingMultiple: 1.2
        };
        this.pptxAddOn(def[0], textboxOpts);
        slide.addText(textboxText, textboxOpts);
      }
    }
  },

  pptxInsertTwo(def, parent, pptx, isChild = false) {
    if (def.filter(d => d.title.length > 10).length > 0) {
      this.pptxInsertLengthTooLong(def, parent, pptx, isChild)
    }
    else {
      let slide = pptx.addSlide();
      // 背景图1
      slide.addImage({ path: '../../../../assets/images/ppt/2-1-1.png', x: '5%', y: '5%', w: '90%', h: '90%' }
      )
      // 父主题
      let textboxText = replaceTitle(parent.title);
      let textboxOpts = {
        x: '20%', y: '15%', w: '60%', h: 1, color: "333333", align: 'center', valign: 'top', bold: true, fontSize: 30, fontFace: '微软雅黑', charSpacing: 2
      };
      slide.addText(textboxText, textboxOpts);
      def.forEach((d, i) => {
        // 背景填充1
        textboxText = '';
        textboxOpts = {
          x: (30 + (22 * i)) + '%', y: '40%', w: '17%', h: '30%', color: "ffffff", align: 'left', valign: 'top', bold: true, fontSize: 18, fontFace: '微软雅黑', charSpacing: 2, fill: { color: '8590ca' }
        };
        slide.addText(textboxText, textboxOpts);
        // 内容
        textboxText = replaceTitle(d.title);
        textboxOpts = {
          x: (31 + (22 * i)) + '%', y: '48%', w: '15%', h: '15%', color: "ffffff", align: 'left', valign: 'top', fontFace: '微软雅黑', charSpacing: 2, fit: 'shrink'
        };
        textboxOpts = this.pptxAddOn(d, textboxOpts);
        slide.addText(textboxText, textboxOpts);

        // index
        textboxText = i + 1;
        textboxOpts = {
          shape: pptx.shapes.ROUNDED_RECTANGLE,
          x: (35 + (22 * i)) + '%', y: '65%', w: 0.7, h: 0.7, color: "333333", align: 'center', bold: true, fontSize: 30, fontFace: '微软雅黑', charSpacing: 2, rectRadius: 1, fill: { color: 'ffffff' }, line: { width: '2', color: '8590ca' }
        };
        slide.addText(textboxText, textboxOpts);
      })
    }
  },

  pptxInsertThree(def, parent, pptx, isChild = false) {
    if (def.filter(d => d.title.length > 10).length > 0) {
      this.pptxInsertLengthTooLong(def, parent, pptx, isChild)
    }
    else {
      let slide = pptx.addSlide();
      // 背景图1
      // slide.addImage({ path: '../../../../assets/images/ppt/2-1-1.png', x: '5%', y: '5%', w: '90%', h: '90%' })
      // 父主题
      let textboxText = replaceTitle(parent.title);
      let textboxOpts = {
        x: '10%', y: '10%', w: '80%', h: 1, color: "333333", align: 'center', valign: 'top', bold: true, fontSize: 30, fontFace: '微软雅黑', charSpacing: 2, fit: 'shrink'
      };
      slide.addText(textboxText, textboxOpts);
      def.forEach((d, i) => {

        // index
        textboxText = "0" + (i + 1);
        textboxOpts = {
          shape: pptx.shapes.ROUNDED_RECTANGLE,
          x: (25 + (25 * i)) + '%', y: '30%', w: 0.7, h: 0.7, color: "#333d75", align: 'center', bold: true, fontSize: 12, fontFace: '微软雅黑', charSpacing: 2, rectRadius: 1, line: { width: '1', color: '8590ca' }
        };
        slide.addText(textboxText, textboxOpts);
        // index的图标1
        textboxText = '';
        textboxOpts = {
          shape: pptx.shapes.RIGHT_TRIANGLE,
          x: (24.4 + (25 * i)) + '%', y: '34.7%', w: 0.1, h: 0.1, color: "#333d75", align: 'center', bold: true, fontSize: 12, fontFace: '微软雅黑', charSpacing: 2, fill: { color: '8590ca' }, rotate: 225, line: { width: '1', color: 'ffffff' }
        };
        slide.addText(textboxText, textboxOpts);
        // index的图标2
        textboxText = '';
        textboxOpts = {
          shape: pptx.shapes.RIGHT_TRIANGLE,
          x: (31.7 + (25 * i)) + '%', y: '34.5%', w: 0.1, h: 0.1, color: "#333d75", align: 'center', bold: true, fontSize: 12, fontFace: '微软雅黑', charSpacing: 2, fill: { color: '8590ca' }, rotate: 45, line: { width: '1', color: 'ffffff' }
        };
        slide.addText(textboxText, textboxOpts);

        // 内容
        textboxText = replaceTitle(d.title);
        textboxOpts = {
          x: (18 + (25 * i)) + '%', y: '48%', w: '20%', h: '30%', color: "333333", align: 'center', valign: 'top', fontSize: 20, fontFace: '微软雅黑', charSpacing: 2, fit: 'shrink'
        };
        textboxOpts = this.pptxAddOn(d, textboxOpts);
        slide.addText(textboxText, textboxOpts);
      })
    }
  },

  pptxInsertFour(def, parent, pptx, isChild = false) {
    if (def.filter(d => d.title.length > 10).length > 0) {
      this.pptxInsertLengthTooLong(def, parent, pptx, isChild)
    }
    else {
      let slide = pptx.addSlide();
      // 父标题
      let textboxText = replaceTitle(parent.title);
      let textboxOpts = {
        x: '10%', y: '10%', w: '80%', h: 1, color: "333333", align: 'center', valign: 'top', bold: true, fontSize: 30, fontFace: '微软雅黑', charSpacing: 2, fit: 'shrink'
      };
      slide.addText(textboxText, textboxOpts);
      def.forEach((d, i) => {
        const x = 12 + (parseInt(i % 2) * 40)
        const y = 30 + (parseInt(i / 2) * 35)
        const color = i % 2 == 0 ? '8590ca' : '7e9ed7'
        // 内容
        textboxText = replaceTitle(d.title);
        textboxOpts = {
          shape: pptx.shapes.ROUNDED_RECTANGLE,
          x: x + '%', y: y + '%', w: '33%', h: '18%', color: "ffffff", align: 'center', fontSize: 16, fontFace: '微软雅黑', charSpacing: 2, fit: 'shrink', fill: { color: color }, rectRadius: 0.2,
        };
        textboxOpts = this.pptxAddOn(d, textboxOpts);
        slide.addText(textboxText, textboxOpts);
      })
    }
  },

  pptxInsertFive(def, parent, pptx, isChild = false) {
    if (def.filter(d => d.title.length > 10).length > 0) {
      this.pptxInsertLengthTooLong(def, parent, pptx, isChild)
    }
    else {
      let slide = pptx.addSlide();
      // 背景图1
      slide.addImage({ path: '../../../../assets/images/ppt/5-1-1.png', x: 0, y: 0, w: '100%', h: '10%' }
      )
      // 背景图2
      slide.addImage({ path: '../../../../assets/images/ppt/5-1-2.png', x: 0, y: '90%', w: '100%', h: '10%' }
      )
      // 父标题
      let textboxText = replaceTitle(parent.title);
      let textboxOpts = {
        x: '10%', y: '15%', w: '80%', h: 1, color: "333333", align: 'left', valign: 'top', bold: true, fontSize: 30, fontFace: '微软雅黑', charSpacing: 2, fit: 'shrink'
      };
      slide.addText(textboxText, textboxOpts);

      def.forEach((d, i) => {
        const x = 20 + (i * 15)
        const color = i % 2 == 0 ? '8590ca' : '7e9ed7'
        // index 填充
        textboxText = '';
        textboxOpts = {
          x: x + '%', y: '40%', w: 0.6, h: 0.6, color: "ffffff", align: 'center', fontSize: 20, fontFace: '微软雅黑', charSpacing: 1, fill: { color: color }, rotate: 45
        };
        slide.addText(textboxText, textboxOpts);
        // index
        textboxText = '0' + (i + 1);
        textboxOpts = {
          x: (x + 0.5) + '%', y: '41.5%', w: 0.5, h: 0.5, color: "ffffff", align: 'center', fontSize: 14, fontFace: '微软雅黑', charSpacing: 2,
        };
        slide.addText(textboxText, textboxOpts);
        // 内容
        textboxText = replaceTitle(d.title);
        textboxOpts = {
          x: (x - 3) + '%', y: '55%', w: '12%', h: '25%', color: "333333", align: 'center', valign: 'top', fontSize: 16, fontFace: '微软雅黑', charSpacing: 2
        };
        textboxOpts = this.pptxAddOn(d, textboxOpts);
        slide.addText(textboxText, textboxOpts);
      })
    }
  },

  pptxInsertSix(def, parent, pptx, isChild = false) {
    if (def.filter(d => d.title.length > 10).length > 0) {
      this.pptxInsertLengthTooLong(def, parent, pptx, isChild)
    }
    else {
      let slide = pptx.addSlide();
      // 父标题
      let textboxText = replaceTitle(parent.title);
      let textboxOpts = {
        x: '10%', y: '10%', w: '80%', h: 1, color: "333333", align: 'center', valign: 'top', bold: true, fontSize: 30, fontFace: '微软雅黑', charSpacing: 2, fit: 'shrink'
      };
      slide.addText(textboxText, textboxOpts);
      def.forEach((d, i) => {
        const x = 15 + (parseInt(i % 3) * 30)
        const y = 30 + (parseInt(i / 3) * 30)
        const color = i % 2 == 0 ? '8590ca' : '7e9ed7'
        // 内容
        textboxText = replaceTitle(d.title);
        textboxOpts = {
          shape: pptx.shapes.ROUNDED_RECTANGLE,
          x: x + '%', y: y + '%', w: 1.5, h: 1.5, color: "333333", align: 'center', fontSize: 16, fontFace: '微软雅黑', charSpacing: 2, fit: 'shrink', fill: { color: color }, rectRadius: 1,
        };
        textboxOpts = this.pptxAddOn(d, textboxOpts);
        slide.addText(textboxText, textboxOpts);
      })
    }
  },

  pptxInsertLengthTooLong(def, parent, pptx, isChild = false) {
    let slide = pptx.addSlide();
    // 父标题
    let textboxText = replaceTitle(parent.title);
    let textboxOpts = {
      x: '5%', y: '10%', w: '90%', h: '10%', color: "333333", align: 'center', valign: 'top', bold: true, fontSize: 30, fontFace: '微软雅黑', charSpacing: 2, fit: 'shrink'
    };
    slide.addText(textboxText, textboxOpts);
    def.forEach((d, i) => {
      const y = 25 + (i * (11))
      // 标志
      textboxText = '';
      textboxOpts = {
        x: '8%', y: (y + 4) + '%', w: 0.1, h: 0.1, color: "666666", align: 'left', fontSize: 14, fontFace: '微软雅黑', charSpacing: 2, fit: 'shrink', fill: { color: '8590ca' }, rotate: 45
      };
      slide.addText(textboxText, textboxOpts);
      // 内容
      textboxText = replaceTitle(d.title);
      textboxOpts = {
        x: '10%', y: y + '%', w: '70%', h: '10%', color: "666666", align: 'left', valign: 'top', fontSize: 14, fontFace: '微软雅黑', charSpacing: 2, fit: 'shrink',
      };
      textboxOpts = this.pptxAddOn(d, textboxOpts);
      slide.addText(textboxText, textboxOpts);
    })
  },

  pptxInsertDefault(title, pptx, ptitle, def) {

    let slide = pptx.addSlide();
    // 背景填充1
    let textboxText = '';
    let textboxOpts = {
      x: '5%', y: '10%', w: '90%', h: '80%', color: "333333", fill: { color: '79bb8f' }, line: { width: '2', color: '8590ca' }
    };
    slide.addText(textboxText, textboxOpts);
    // 背景填充2
    textboxText = '';
    textboxOpts = {
      x: '7%', y: '12%', w: '90%', h: '80%', color: "333333", fill: { color: 'ffffff' }, line: { width: '2', color: '8590ca' }
    };
    slide.addText(textboxText, textboxOpts);
    // )
    // 背景图1
    slide.addImage({ path: '../../../../assets/images/ppt/1-0-1.png', x: '7%', y: '12%', w: '90%', h: '80%', fill: { color: 'ffffff' } }
    )
    // 背景图3
    slide.addImage({ path: '../../../../assets/images/ppt/1-0-3.png', x: '20%', y: 0, w: '8%', h: '15%' }
    )
    // 背景图3
    slide.addImage({ path: '../../../../assets/images/ppt/1-0-3.png', x: '75%', y: 0, w: '8%', h: '15%' }
    )
    // 父名称
    textboxText = replaceTitle(ptitle);
    textboxOpts = {
      x: '15%', y: '15%', w: '70%', h: '10%', color: "4c5caf", align: 'center', valign: 'top', bold: true, fontSize: 16, fontFace: '微软雅黑', charSpacing: 2
    };
    slide.addText(textboxText, textboxOpts);
    // 内容
    textboxText = replaceTitle(title);
    textboxOpts = {
      x: '30%', y: '35%', w: '55%', h: 1, color: "4c5caf", align: 'left', valign: 'top', bold: true, fontSize: 55, fontFace: '微软雅黑', charSpacing: 2
    };
    textboxOpts = this.pptxAddOn(def, textboxOpts);
    slide.addText(textboxText, textboxOpts);
  },

  pptxAddOn(def, textboxOpts) {
    if (Object.hasOwnProperty.call(def, 'link')) {
      if (def.link.value) {
        textboxOpts.hyperlink = { url: def.link.value }
      }
    }
    return textboxOpts
  }
}
function onlineDownload(type, kData = {}, vipuuid = '') {
  if (type == 'pdfHD' || type == 'pdfhd') {
    pcUtil.ajax({
      url: '/api/personal/chart/export/get/user/power',
      type: "GET",
      data: {
        chartId: chartObj.chartId,
        exportType: type
      },
      success: function (res) {
        onlineDownloadBegin(type, kData, res.data)
      }
    })
  }
  else {
    onlineDownloadBegin(type, kData)
  }
}
async function onlineDownloadBegin(type, kData = {}, vipuuid = '') {
  const _url = chartObj.orgId
    ? '/api/org/diagram/export/mindmap'
    : '/chart_image/diagram_export/mindmap'
  let export_url = window.host + _url
  const sData = { type, title: window.saveName, chartId: chartObj.chartId || '', definition: '', source: '', width: '', height: '', canvasId: '', ignore: 'definition', powerStr: vipuuid || '' }
  let defs
  let source
  let chartData = null
  if (kData?.chart) {
    chartData = kData.chart.def || kData.chart
  } else if (kData?.def) {
    chartData = kData.def
  } else if (kData?.root || kData?.id || kData?.children) {
    chartData = kData
  }
  if (chartData) {
    defs = typeof chartData === 'string' ? chartData : JSON.stringify(chartData)
    if (chartData.title) sData.title = chartData.title
    sData.chartId = ''
    sData.canvasId = ''
    sData.source = ''
  } else if (kData.definition) {
    defs = typeof kData.definition === 'string' ? kData.definition : JSON.stringify(kData.definition)
  } else if (window.fileType === 'mind') {
    defs = JSON.stringify(editorGlobal.mindMap.getData())
    source = 'official_old_pos'
  } else if (window.fileType === 'outline') {
    defs = JSON.stringify(outlineObj.model.data)
    source = 'official_old_pos'
  } else if (window.fileType === 'markdown') {
    let pos = await PoEditorClient.getDef('pos')
    defs = pos?.diagram?.elements
    source = 'official_old_pos'
  } else {
    defs = JSON.stringify(Model.define)
    source = 'official_old_pos'
  }
  // form.append('definition', defs)
  if (type == 'pos_all' || type == 'all_pos') {
    sData.source = source
    export_url = host + '/chart_image/export/file'
    switch (window.fileType) {
      case 'flow': sData.source = 'official_flow_pos'; break;
      case 'mind': sData.source = 'official_mind_pos'; break;
      case 'outline': sData.source = 'official_outline_pos'; break;
      case 'markdown': sData.source = ''; break;
    }
  }
  else if (type == 'pdfhd' || type == 'pdfHD') {
    export_url = chartObj.orgId ? window.host + "/api/org/diagram/export/flow" : window.host + "/chart_image/diagram_export/vip/mindmap"
    sData.type = 'pdfHD'
    sData.width = 0
    sData.height = 0
    if(window.fileType === 'markdown'){
      sData.canvasId = chartObj.chartId
    }else{
      const pageData = editorGlobal.poPagination.data[editorGlobal.poPagination.pageId]
      sData.canvasId = pageData ? pageData.canvasId : editorGlobal.poPagination.pageId
    }
    delete sData.definition
    sData.powerStr = vipuuid
    // sData.definition = kData.definition
  }
  else {
    sData.definition = defs
  }

  const body = new URLSearchParams(sData).toString();
  window.fetch(export_url, {
    method: 'POST', headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body,
  }).then((res) => {
    res.arrayBuffer().then((data) => {
      let title = sData.title || window.saveName
      let suffix
      switch (type) {
        case 'xmind': suffix = 'xmind'; break;
        case 'ppt': suffix = 'pptx'; break;
        case 'pdfHD':
        case 'pdfhd':
          suffix = 'pdf'; break;
        case 'all_pos':
        case 'pos_all':
          switch (window.fileType) {
            case 'flow': suffix = 'posf'; break;
            case 'mind': suffix = 'posm'; break;
            case 'outline': suffix = 'poso'; break;
          };
          break;
        case 'word':
          suffix = 'docx'
          break
        case 'csv':
          suffix = 'csv'
          break
      }
      // 保存
      ipc1.sendSync('saveFileB64', { type: 'save', data: importClass.arrayBufferToBase64(data), path: title, suffix: suffix }).then((resPath) => {
        if (resPath != '') {
          new Toast({ type: 'success', msg: '保存成功' })
          if (window.downType) {
            ipc.sendToHost('downed')
          }
        }
        else {
          if (window.downType) {
            ipc.sendToHost('cancel')
          }
        }
      })
    })
  }).catch(function () {
    window.poExportWait && window.poExportWait.stop()
  })
}
async function patchExportStaticIconUrls(content) {
  const icons = ['file.svg', 'link.svg', 'flow_note.svg', 'note.svg']
  let out = content
  for (const icon of icons) {
    if (!out.includes(icon)) continue
    const ipcres = await ipc1.sendSync('loadFileB64', { type: 'local', path: `${webRoot}/v5_editor/source/static/images/${icon}` })
    if (!ipcres) continue
    const uri = `data:image/svg+xml;base64,${ipcres}`
    const esc = icon.replace('.', '\\.')
    out = out.split(`./../../static/images/${icon}`).join(uri)
    out = out.split(`./../../static//images/${icon}`).join(uri)
    out = out.replace(new RegExp(`https?:\\/\\/[^"'\\s>]*\\/images\\/${esc}`, 'g'), uri)
    out = out.replace(new RegExp(`file:\\/\\/[^"'\\s>]*\\/images\\/${esc}`, 'g'), uri)
  }
  return out
}
// 导出集合
const exportFile1 = {
  /**
   * 导出pos实例
   * @param {*} data 
   * {type:'pos',canvas:[{name:'123.pos',data:data}],meta:[{name:'meta.json',data:data}],chartObj:[name:'chartObj.json',data:data]}
   * {type:'pof',canvas:[{name:'123.pos',data:data}],meta:[{name:'meta.json',data:data}],chartObj:[name:'chartObj.json',data:data]}
   * {type:'posf',canvas:[{name:'123.pos',data:data}],meta:[{name:'meta.json',data:data}],chartObj:[name:'chartObj.json',data:data]}
   * {type:'posm',canvas:[{name:'123.pos',data:data}],meta:[{name:'meta.json',data:data}],chartObj:[name:'chartObj.json',data:data]}
   * {type:'poso',canvas:[{name:'123.pos',data:data}],meta:[{name:'meta.json',data:data}],chartObj:[name:'chartObj.json',data:data]}
   * @param {*} data
   * flow,mind,outline 
   */
  pos(data, type, isSave, canvas) {
    return new Promise((reslove, reject) => {
      const zip = new window.JSZip1();
      let imagesPath = [];
      let filesPath = [];
      let imagesCount = 0;
      let imagesIndex = 0;
      let filesCount = 0;
      let filesIndex = 0;
      let canvasIndex = 0;
      let canvasCount = 0
      // 压缩meta.json
      zip.file('meta.json', JSON.stringify(data.meta[0].data))
      if (data.chartObj && data.chartObj[0]) {
        zip.file('chartObj.json', JSON.stringify(data.chartObj[0].data))
      }
      // 创建图片和附件文件夹
      const imgs = zip.folder('attachment')
      const files = zip.folder('files')
      // 读取图片原有地址
      Promise.all([
        ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${data.meta[0].data.id}/attachment.json` }),
        ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${data.meta[0].data.id}/files.json` }),
        window.isMyFile && type !== 'flow' && ipc1.sendSync('loadFileB64', { type: 'cache', path: 'theme/config.json' })]).
        then((res) => {
          canvasCount = data.canvas.length
          const imagesUrls = res[0] == '' ? [] : JSON.parse(res[0])
          const filesUrls = res[1] == '' ? [] : JSON.parse(res[1])
          let themes = []
          if (window.isMyFile) {
            themes = res[2] == '' ? [] : JSON.parse(res[2])
          }
          // 根据类型导出图片和附件
          if (type == 'flow') {
            data.canvas.forEach((c) => {
              const d = exportFile1.flowImageJson(c.data.diagram.elements, imagesPath, imagesUrls)
              c.data.diagram.elements = d.data;
              imagesPath = d.imagesPath;
              zip.file(c.name, JSON.stringify(c.data))
              canvasIndex++
            })
          }
          else {
            data.canvas.forEach((c) => {
              const d = exportFile1.mindImagesFilesJson(c.data.diagram.elements, imagesPath, filesPath, imagesUrls, filesUrls)
              c.data.diagram.elements = d.data;
              imagesPath = d.imagesPath;
              filesPath = d.filesPath;
              // if (c.data.diagram.elements.theme.startsWith('customise_')) {
              //   let nowtheme = themes.find(item => item.themeId == c.data.diagram.elements.theme)
              //   if (nowtheme) {
              //     const theme = JSON.parse(nowtheme.theme)
              //     theme.thumbUrl = ''
              //     delete theme.id
              //     c.data.diagram.elements.theme = JSON.stringify(theme)
              //     zip.file(c.name, JSON.stringify(c.data))
              //     // zip.file(c.data.diagram.elements.theme, JSON.stringify(nowtheme))
              //     canvasIndex++
              //   }
              //   else {
              //     pcUtil.ajax({
              //       url: `/api/personal/mindmap/gettheme?id=${c.data.diagram.elements.theme}`,
              //       type: 'GET',
              //       success: function (data) {
              //         if (data.code == 200) {
              //           const theme = JSON.parse(data.data)
              //           theme.thumbUrl = ''
              //           delete theme.id
              //           c.data.diagram.elements.theme = JSON.stringify(theme)
              //         }
              //         zip.file(c.name, JSON.stringify(c.data))
              //         canvasIndex++
              //       },
              //       error: function () {
              //         zip.file(c.name, JSON.stringify(c.data))
              //         canvasIndex++
              //       }
              //     })
              //   }
              // }
              // else {
              zip.file(c.name, JSON.stringify(c.data))
              canvasIndex++
              // }
            })
          }
          // 压缩图片
          imagesCount = imagesPath.length;
          filesCount = filesPath.length;
          imagesPath.forEach((d) => {
            ipc1.sendSync('loadFileB64', { type: 'local', path: d.name, }).then((ipcres) => {
              if (ipcres != '') {
                imgs.file(`${d.id.replace('svg', 'png')}`, ipcres, { base64: true })
              }
              imagesIndex++;
            })
          })
          filesPath.forEach((d) => {
            ipc1.sendSync('loadFileB64', { type: 'local', path: d.name, }).then((ipcres) => {
              if (ipcres != '') {
                files.file(`${d.id}`, ipcres, { base64: true })
              }
              filesIndex++;
            })
          })
          // 定时等待其他文件压缩完成
          const inet = setInterval(() => {
            console.log(imagesCount, imagesIndex, filesCount, filesIndex)
            if (imagesCount == imagesIndex && filesCount == filesIndex && canvasIndex == canvasCount) {
              clearInterval(inet)
              // 压缩完成导出base64数据
              zip.generateAsync({ type: 'base64' }).then((content) => {
                console.log('zip-file-end', Date.now())
                let saveData;
                if (window.filepath == '' || !isSave ||
                  !(window.filepath.endsWith('.posf') || window.filepath.endsWith('.posm') || window.filepath.endsWith('.poso') || window.filepath.endsWith('.pos'))) {
                  saveData = {
                    type: 'save', data: content, path: window.saveName, suffix:
                      (data.type == 'pof' ? 'pos' : data.type),
                  }
                }
                else {
                  saveData = { type: 'local', data: content, path: window.filepath, suffix: (data.type == 'pof' ? 'pos' : window.filepath.endsWith('.pos') ? 'pos' : data.type), }
                }
                console.log('save-file-begin', Date.now())
                if (window.downType) {
                  ipc.sendToHost('down')
                }
                // 保存
                ipc1.sendSync('saveFileB64', saveData).then((res) => {
                  if (res !== '' && isSave) {
                    if (window.downType) {
                      ipc.sendToHost('downed')
                    }
                    canvas.forEach((c) => {
                      const index = window.defVersion.findIndex(d => d.id == c.canvasId)
                      if (index !== -1) {
                        window.defVersion[index].isSave = true
                      }
                      else {
                        window.defVersion.push({ id: c.canvasId, version: 1, isSave: true })
                      }
                    })
                    window.filepath = res
                    // 读取最近目录
                    ipc1.sendSync('loadFileB64', { type: 'cache', path: 'history/cache.json' }).then((resHis) => {
                      ipc.sendToHost("saveStatus", window.TABGROUPID, "saved")
                      // 制作最近数据
                      if (resHis == '') {
                        resHis = '[]'
                      }
                      let history = JSON.parse(resHis);
                      const title = res.lastIndexOf('/') > -1 ?
                        res.substring(res.lastIndexOf('/') + 1, res.lastIndexOf('.')) :
                        res.substring(res.lastIndexOf('\\') + 1, res.lastIndexOf('.'))
                      window.saveName = title
                      const historyC = {
                        "chartId": data.meta[0].data.id,
                        "title": title,
                        "category": chartObj.category,
                        //  type == 'flow' ? type : (type == 'mind' && (window.filepath == '' || window.filepath.endsWith('posm'))) ? 'mind' : 'outline',
                        "definitionId": data.meta[0].data.mainCanvasId,
                        "owner": {
                          "userId": userId,
                          "userName": fullName,
                          "fullName": fullName
                        },
                        "ownerId": "1001",
                        "description": "",
                        "thumbImage": "",
                        "lastModify": pcUtil.getCurrentTimeString(),
                        "filepath": res,
                        "type": 2
                      }
                      if (data.type != 'pof' && data.type != 'pos') {
                        if (saveData.type == 'save') {
                          if (!isSave || filepath != window.filepath) {
                            ipc1.send('setTabTitle', title)
                          }
                          // window.PoEditorClient.modifyTitle(title)
                        }
                      }

                      if (history.length > 0) {
                        const hisI = history.findIndex(hisd => hisd.chartId == data.meta[0].data.id ||
                          (hisd.chartId != data.meta[0].data.id && hisd.filepath == window.filepath))
                        // 如果已经存在则删除
                        if (hisI > -1) {
                          history.splice(hisI, 1)
                          history.push(historyC)
                          const result = importClass.stringToBase64String(JSON.stringify(history));
                          // 存储最近文件
                          ipc1.sendSync('saveFileB64',
                            { type: 'cache', data: result, path: 'history/cache.json', suffix: '' }).then(() => {
                              ipc.sendToHost('refresh')
                              fileCache.isSave(data.meta[0].data.id, true)
                              console.log(Date.now())
                            })
                        }
                        else if (filepath != window.filepath && !window.filepath.endsWith('.bak')) {
                          history.push(historyC)
                          const result = importClass.stringToBase64String(JSON.stringify(history));
                          // 存储最近文件
                          ipc1.sendSync('saveFileB64',
                            { type: 'cache', data: result, path: 'history/cache.json', suffix: '' }).then(() => {
                              ipc.sendToHost('refresh')
                              fileCache.isSave(data.meta[0].data.id, true)
                              console.log(Date.now())
                            })
                        }
                      }
                      else if (filepath != window.filepath) {
                        history.push(historyC)
                        const result = importClass.stringToBase64String(JSON.stringify(history));
                        // 存储最近文件
                        ipc1.sendSync('saveFileB64',
                          { type: 'cache', data: result, path: 'history/cache.json', suffix: '' }).then(() => {
                            ipc.sendToHost('refresh')
                            fileCache.isSave(data.meta[0].data.id, true)
                            console.log(Date.now())
                          })
                      }
                    })
                    console.log('save-file-end', Date.now())
                    new Toast({ type: 'success', msg: '保存成功' })
                    reslove(true)
                  }
                  else if (res !== '') {
                    console.log('save-file-end', Date.now())
                    new Toast({ type: 'success', msg: '保存成功' })
                    if (window.downType) {
                      ipc.sendToHost('downed')
                    }
                    reslove(true)
                  }
                  else {
                    if (window.downType) {
                      ipc.sendToHost('cancel')
                    }
                    console.log(Date.now())
                    reslove(false)
                  }
                })
              })
            }
          }, 300)
        })
    })
  },
  /**
   * @description: 导出xmind
   */
  xmind({ def }) {
    const xmindResult = handleExportXmind(def)
    console.log(xmindResult)
    /**
     * - zip 压缩生成xmind格式文件，其中包括 
     * 1、content.json 其实只有这一个是需要的
     * 2、content.xml  固定额
     * 3、manifest.json 固定的
      {
        "file-entries": {
          "content.json": {},
          "metadata.json": {}
        }
      }
 
     * 4、metadata.json 固定的 {}
     */

    const zip = new window.JSZip1();
    const contentXml = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <xmap-content xmlns="urn:xmind:xmap:xmlns:content:2.0" xmlns:fo="http://www.w3.org/1999/XSL/Format"
          xmlns:svg="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml"
          xmlns:xlink="http://www.w3.org/1999/xlink" modified-by="bruce" timestamp="1503058545540"
          version="2.0">
          <sheet id="7abtd0ssc7n4pi1nu6i7b6lsdh" modified-by="bruce" theme="0kdeemiijde6nuk97e4t0vpp54"
              timestamp="1503058545540">
              <topic id="1vr0lcte2og4t2sopiogvdmifc" modified-by="bruce"
                  structure-class="org.xmind.ui.logic.right" timestamp="1503058545417">
                  <title>Warning 警告 Attention Warnung 경고</title>
                  <children>
                      <topics type="attached">
                          <topic id="71h1aip2t1o8vvm0a41nausaar" modified-by="bruce"
                              timestamp="1503058545423">
                              <title svg:width="500">This file can not be opened normally, please do not
                                  modify and save, otherwise the contents will be permanently lost！</title>
                              <children>
                                  <topics type="attached">
                                      <topic id="428akmkh9a0tog6c91qj995qdl" modified-by="bruce"
                                          timestamp="1503058545427">
                                          <title>You can try using XMind 8 Update 3 or later version to
                                              open</title>
                                      </topic>
                                  </topics>
                              </children>
                          </topic>
                          <topic id="2kb87f8m38b3hnfhp450c7q35e" modified-by="bruce"
                              timestamp="1503058545434">
                              <title svg:width="500">该文件无法正常打开，请勿修改并保存，否则文件内容将会永久性丢失！</title>
                              <children>
                                  <topics type="attached">
                                      <topic id="3m9hoo4a09n53ofl6fohdun99f" modified-by="bruce"
                                          timestamp="1503058545438">
                                          <title>你可以尝试使用 XMind 8 Update 3 或更新版本打开</title>
                                      </topic>
                                  </topics>
                              </children>
                          </topic>
                          <topic id="7r3r4617hvh931ot9obi595r8f" modified-by="bruce"
                              timestamp="1503058545444">
                              <title svg:width="500">該文件無法正常打開，請勿修改並保存，否則文件內容將會永久性丟失！</title>
                              <children>
                                  <topics type="attached">
                                      <topic id="691pgka6gmgpgkacaa0h3f1hjb" modified-by="bruce"
                                          timestamp="1503058545448">
                                          <title>你可以嘗試使用 XMind 8 Update 3 或更新版本打開</title>
                                      </topic>
                                  </topics>
                              </children>
                          </topic>
                          <topic id="0f2e3rpkfahg4spg4nda946r0b" modified-by="bruce"
                              timestamp="1503058545453">
                              <title svg:width="500">
                                  この文書は正常に開かないので、修正して保存しないようにしてください。そうでないと、書類の内容が永久に失われます。！</title>
                              <children>
                                  <topics type="attached">
                                      <topic id="4vuubta53ksc1falk46mevge0t" modified-by="bruce"
                                          timestamp="1503058545457">
                                          <title>XMind 8 Update 3 や更新版を使って開くこともできます</title>
                                      </topic>
                                  </topics>
                              </children>
                          </topic>
                          <topic id="70n9i4u3lb89sq9l1m1bs255j5" modified-by="bruce"
                              timestamp="1503058545463">
                              <title svg:width="500">Datei kann nicht richtig geöffnet werden. Bitte
                                  ändern Sie diese Datei nicht und speichern Sie sie, sonst wird die Datei
                                  endgültig gelöscht werden.</title>
                              <children>
                                  <topics type="attached">
                                      <topic id="1qpc5ee298p2sqeqbinpca46b7" modified-by="bruce"
                                          timestamp="1503058545466">
                                          <title svg:width="500">Bitte versuchen Sie, diese Datei mit
                                              XMind 8 Update 3 oder später zu öffnen.</title>
                                      </topic>
                                  </topics>
                              </children>
                          </topic>
                          <topic id="4dmes10uc19pq7enu8sc4bmvif" modified-by="bruce"
                              timestamp="1503058545473">
                              <title svg:width="500">Ce fichier ne peut pas ouvert normalement, veuillez
                                  le rédiger et sauvegarder, sinon le fichier sera perdu en permanence. </title>
                              <children>
                                  <topics type="attached">
                                      <topic id="5f0rivgubii2launodiln7sdkt" modified-by="bruce"
                                          timestamp="1503058545476">
                                          <title svg:width="500">Vous pouvez essayer d'ouvrir avec XMind 8
                                              Update 3 ou avec une version plus récente.</title>
                                      </topic>
                                  </topics>
                              </children>
                          </topic>
                          <topic id="10pn1os1sgfsnqa8akabom5pej" modified-by="bruce"
                              timestamp="1503058545481">
                              <title svg:width="500">파일을 정상적으로 열 수 없으며, 수정 및 저장하지 마십시오. 그렇지 않으면 파일의 내용이
                                  영구적으로 손실됩니다!</title>
                              <children>
                                  <topics type="attached">
                                      <topic id="0l2nr0fq3em22rctapkj46ue58" modified-by="bruce"
                                          timestamp="1503058545484">
                                          <title svg:width="500">XMind 8 Update 3 또는 이후 버전을 사용하여</title>
                                      </topic>
                                  </topics>
                              </children>
                          </topic>
                      </topics>
                  </children>
                  <extensions>
                      <extension provider="org.xmind.ui.map.unbalanced">
                          <content>
                              <right-number>-1</right-number>
                          </content>
                      </extension>
                  </extensions>
              </topic>
              <title>Sheet 1</title>
          </sheet>
      </xmap-content>`

    let manifestJson = {
      "file-entries": {
        "content.json": {},
        "metadata.json": {}
      }
    }



    // 需要替换图片资源 当前还是本地的，如果发给别人是看不到的，等于把图片文件放到压缩包里
    ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${window.chartId}/attachment.json` }).then(res => {
      console.log("cachedata----", res)
      const imagesUrls = res == '' ? [] : JSON.parse(res)
      // 创建resources文件夹
      const resources = zip.folder('resources')
      let arr = []
      imagesUrls.forEach(d => {
        arr.push(new Promise((resolve) => {

          ipc1.sendSync('loadFileB64', { type: 'local', path: d.url, }).then((ipcres) => {
            // 存入 resources中
            resources.file(`${d.name}`, ipcres, { base64: true })
            manifestJson["file-entries"][`resources/${d.name}`] = {}
            resolve(d)
          })
        }))
      })
      Promise.all(arr).then(res => {

        console.log("result---", res)
        console.log("imagesUrls---", imagesUrls)



        let contentJson = JSON.stringify(xmindResult)
        //转换xmindResult中的路径 
        imagesUrls.forEach(item => {
          contentJson = contentJson.replaceAll(`file:///${item.url}`, `xap:resources/${item.name}`)
        })


        zip.file('content.json', contentJson)
        zip.file('content.xml', contentXml)
        zip.file('manifest.json', JSON.stringify(manifestJson))
        zip.file('metadata.json', JSON.stringify({}))

        zip.generateAsync({ type: 'base64' }).then(content => {
          console.log(content)
          if (window.downType) {
            ipc.sendToHost('down')
          }
          ipc1.sendSync('saveFileB64', {
            type: 'save', data: content, path: window.saveName, suffix: 'xmind'
          }).then((res) => {
            if (res != '') {
              new Toast({ type: 'success', msg: '保存成功' })
              if (window.downType) {
                ipc.sendToHost('downed')
              }
            }
            else {
              if (window.downType) {
                ipc.sendToHost('cancel')
              }
            }
            console.log(res)
          })
        })

      })

    })
  },
  extractSvgImageDataUrl(svg) {
    const imageEl = new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('image')
    return imageEl?.getAttribute('href')
      || imageEl?.getAttribute('xlink:href')
      || imageEl?.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
  },
  markdownImagePdf(dataUrl) {
    const scale = 3
    const img = new Image()
    img.onload = () => {
      const pw = img.width * scale
      const ph = img.height * scale
      const canvas = document.createElement('canvas')
      canvas.width = pw
      canvas.height = ph
      canvas.getContext('2d').drawImage(img, 0, 0, pw, ph)
      const png = canvas.toDataURL('image/png')
      const cfg = { unit: 'px', format: [pw, ph], orientation: pw > ph ? 'landscape' : 'portrait' }
      const doc = window.jspdf ? new jspdf.jsPDF(cfg) : new jsPDF(cfg)
      doc.addImage(png, 'PNG', 0, 0, pw, ph, '', 'FAST')
      const result = doc.output('datauristring').replace('data:application/pdf;filename=generated.pdf;base64,', '')
      const saveData = {
        type: 'save', data: result, path: window.saveName, suffix: 'pdf',
      }
      if (window.downType) {
        ipc.sendToHost('down')
      }
      ipc1.sendSync('saveFileB64', saveData).then((res) => {
        if (res != '') {
          new Toast({ type: 'success', msg: '保存成功' })
          if (window.downType) {
            ipc.sendToHost('downed')
          }
        } else if (window.downType) {
          ipc.sendToHost('cancel')
        }
      })
    }
    img.src = dataUrl
  },
  /**
   * 导出图片或者svg
   * @param {*} chartId 
   * @param {*} type 
   * @param {*} image base64图片或者svg
   * @param {*} title 
   */
  pngOrSvg(chartId, type, image, title, isPrint = false, isOnline = false, pdfConfig = {}) {
    console.log('save-png-begin', Date.now())
    let saveData;
    const pdfFormat = (pdfConfig.format || 'original').toString().toLowerCase()
    const pdfIsOriginal = pdfFormat === 'original'
    const pdfValidFormat = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5'].includes(pdfFormat) ? pdfFormat : 'a4'
    const pdfOrientation = ['landscape', 'portrait'].includes((pdfConfig.orientation || '').toLowerCase()) ? pdfConfig.orientation.toLowerCase() : 'portrait'
    const pdfInitConfig = { format: pdfValidFormat, orientation: pdfOrientation }
    const makePdfDoc = (w, h) => {
      const cfg = pdfIsOriginal
        ? { unit: 'px', format: [w, h], orientation: w > h ? 'landscape' : 'portrait' }
        : pdfInitConfig
      return window.jspdf ? new jspdf.jsPDF(cfg) : new jsPDF(cfg)
    }
    // 图片
    if (['png', 'jpg', 'pnghd'].includes(type)) {
      console.log('save-png-btoa-begin', Date.now())
      saveData = {
        type: 'save', data: image.split(',')[1], path: window.saveName, suffix: type == 'pnghd' ? 'png' : type
      }
      console.log('save-png-btoa-begin', Date.now())
      if (!isPrint) {
        if (window.downType) {
          ipc.sendToHost('down')
        }
        ipc1.sendSync('saveFileB64', saveData).then((res) => {
          if (res != '') {
            console.log('save-png-end', Date.now())
            new Toast({ type: 'success', msg: '保存成功' })
            console.log(Date.now())
            if (window.downType) {
              ipc.sendToHost('downed')
            }
          }
          else {
            if (window.downType) {
              ipc.sendToHost('cancel')
            }
          }
        })
      }
      else {
        ipc.send('print', [image.split(',')[1]])
      }
    }
    else if (['pdf'].includes(type)) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = image;
      img.onload = (res) => {
        const doc = makePdfDoc(img.width, img.height)
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();
        const width = img.width * 2;
        const height = img.height * 2;
        if (width <= pdfWidth && height <= pdfHeight) {
          doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, width, height)
        }
        else if (width > pdfWidth && height <= pdfHeight) {
          doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight)
        }
        else if (width <= pdfWidth && height > pdfHeight) {
          const ca = pdfHeight / height
          doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, (width * ca), pdfHeight)
        }
        else if (width > pdfWidth && height <= pdfHeight) {
          const ca = pdfWidth / width
          doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, (height * ca))
        }
        else {
          const ca1 = pdfWidth / width
          const ca2 = pdfHeight / height
          // const ca3 = Math.floor((ca1 > ca2 ? ca2 : ca1) * 100) / 100
          const ca3 = ca1 > ca2 ? ca2 : ca1
          doc.addImage(image, 'PNG', 0, 0, (width * ca3), (height * ca3))
          // doc.addImage(image, 'PNG', 0, 0, width, height)
        }

        const result = doc.output('datauristring').replace('data:application/pdf;filename=generated.pdf;base64,', '')
        const saveData = {
          type: 'save', data: result, path: window.saveName, suffix: type.replace('hd', '').replace('HD', ''),
        }
        if (window.downType) {
          ipc.sendToHost('down')
        }
        ipc1.sendSync('saveFileB64', saveData).then((res) => {
          if (res != '') {
            new Toast({ type: 'success', msg: '保存成功' })
            console.log(Date.now())
            if (window.downType) {
              ipc.sendToHost('downed')
            }
          }
          else {
            if (window.downType) {
              ipc.sendToHost('cancel')
            }
          }
        })
      };
    }
    else if (['pdfhd', 'pdfHD'].includes(type)) {
      // 读取图片
      Promise.all([
        ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${chartId}/attachment.json` }),
        ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${chartId}/files.json` })]).
        then((res) => {
          const imagesUrls = isOnline ? [] : res[0] == '' ? [] : JSON.parse(res[0])
          const filesUrls = isOnline ? [] : res[1] == '' ? [] : JSON.parse(res[1])
          let imagesCount = imagesUrls.length;
          let imagesIndex = 0;
          let filesCount = filesUrls.length;
          let filesIndex = 0;
          let svgCount = 0;
          let svgIndex = 0;
          let content = image
          let formulaCount = 1;
          let formulaIndex = 0;
          let fileCount = 1;
          let fileIndex = 0;
          let linkCount = 1;
          let linkIndex = 0;
          let noteCount = 1;
          let noteIndex = 0;
          let t_linkCount = 1;
          let t_linkIndex = 0;
          let commentCount = 1;
          let commentIndex = 0
          let staticIconPatchCount = 1
          let staticIconPatchIndex = 0
          patchExportStaticIconUrls(content).then((patched) => {
            content = patched
            staticIconPatchIndex++
          })
          // let content = type == 'pdfHD' ? image : image.content
          // 读取图片内容
          imagesUrls.forEach((d) => {
            ipc1.sendSync('loadFileB64', { type: 'local', path: d.url }).then((ipcres) => {
              if (ipcres != '') {
                const suffix = d.url.substring(d.url.lastIndexOf('.') + 1)
                content = content.replace(`./../../static/assetsfile:///${d.url}`, `data:image/${suffix};base64,${ipcres}`)
                content = content.replace(`./../../static//assetsfile:///${d.url}`, `data:image/${suffix};base64,${ipcres}`)
                content = content.replace(`./../../static/assetsqt:///${d.url}`, `data:image/${suffix};base64,${ipcres}`)
                content = content.replace(`file:///${d.url}`, `data:image/${suffix};base64,${ipcres}`)
              }
              imagesIndex++;
            })
          })
          // 附件处理 
          if (filesUrls.length > 0) {
            // 获取附件图标
            ipc1.sendSync('loadFileB64', { type: 'local', path: `${webRoot}/v5_editor/source/static/images/file.svg` }).then((ipcres) => {
              filesUrls.forEach((d) => {
                if (ipcres != '') {
                  content = content.replace(`./../../static/images/file.svg`, `data:image/svg+xml;base64,${ipcres}`)
                  content = content.replace(`./../../static//images/file.svg`, `data:image/svg+xml;base64,${ipcres}`)
                  content = content.replace(`file:///${d.url}`, `#`)
                }
                filesIndex++;
              })
            })
          }
          const data = xmlToJson.xml2json(image)
          if (data.defs && data.defs != '' && data.defs.pattern && typeof (data.defs.pattern) == 'object' && data.defs.pattern.length) {
            // 遍历查找矢量图
            data.defs.pattern.forEach((d) => {
              if (Object.hasOwnProperty.call(d, 'image') && d.image['xlink:href'].indexOf('.svg') > -1
						 && d.image['xlink:href'].startsWith('https://iconsapi.com') == -1) {
                svgCount++;
                const url = d.image['xlink:href'].replace('./../../static/', webRoot + '/v5_editor/source/static/')
                ipc1.sendSync('loadFileB64', { type: 'local', path: url }).then((ipcres) => {
                  if (ipcres != '') {
                    content = content.replace(d.image['xlink:href'], `data:image/svg+xml;base64,${ipcres}`)
                  }
                  svgIndex++;
                })
              }
            })
          }
          if (data.g && Object.hasOwnProperty.call(data.g, 'g')) {
            // 遍历小图标
            data.g.g.forEach((d) => {
              if (Object.hasOwnProperty.call(d, 'image')) {
                svgCount++;
                const url = d.image['xlink:href'].replace('./../../static/', webRoot + '/v5_editor/source/static/')
                ipc1.sendSync('loadFileB64', { type: 'local', path: url }).then((ipcres) => {
                  let imageSuffix = url.substring(url.lastIndexOf('.') + 1)
                  imageSuffix = imageSuffix == 'svg' ? 'svg+xml' : imageSuffix
                  image = image.replace(d.image['xlink:href'], `data:image/${imageSuffix};base64,${ipcres}`)
                  svgIndex++;
                })
              }
            })
          }
          ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${window.chartId}/formula.json` }).then((formula) => {
            if (formula != '') { formula = JSON.parse(formula); formulaCount = formula.length }
            else { formula = []; formulaCount = 0 }
            formula.forEach((f) => {
              ipc1.sendSync('loadFileB64', { type: 'local', path: f }).then((formuladata) => {
                let regex = new RegExp(`file:\/\/\/${f}`, 'gm')
                content = content.replace(regex, `data:image/png;base64,${formuladata}`)
                formulaIndex++
              })
            })
            ipc1.sendSync('saveFileB64', { type: 'cache', path: `back/${window.chartId}/formula.json`, data: '[]' })
          })
          let regex = /(\.\.\/|\.\/){3}static\/\/images\/file\.svg/g;
          let matches = content.match(regex);
          if (matches != null) {
            fileCount = matches.length;
            // 获取附件图标
            ipc1.sendSync('loadFileB64', { type: 'local', path: `${webRoot}/v5_editor/source/static/images/file.svg` }).then((ipcres) => {
              matches.forEach((d) => {
                content = content.replace(`./../../static//images/file.svg`, `data:image/svg+xml;base64,${ipcres}`)
                // image = image.replace(`file:///${d.url}`, `#`)
                fileIndex++;
              })
            })
          }
          else {
            fileCount = 0
          }
          let regex1 = /(\.\.\/|\.\/){3}static\/\/images\/link\.svg/g;
          let matches1 = content.match(regex1);
          if (matches1 != null) {
            linkCount = matches1.length;
            // 获取附件图标
            ipc1.sendSync('loadFileB64', { type: 'local', path: `${webRoot}/v5_editor/source/static/images/link.svg` }).then((ipcres) => {
              matches1.forEach((d) => {
                content = content.replace(`./../../static//images/link.svg`, `data:image/svg+xml;base64,${ipcres}`)
                // image = image.replace(`file:///${d.url}`, `#`)
                linkIndex++;
              })
            })
          }
          else {
            linkCount = 0
          }
          let regex2 = /(\.\.\/|\.\/){3}static\/\/images\/note\.svg/g;
          let matches2 = content.match(regex2);
          if (matches2 != null) {
            noteCount = matches2.length;
            // 获取附件图标
            ipc1.sendSync('loadFileB64', { type: 'local', path: `${webRoot}/v5_editor/source/static/images/note.svg` }).then((ipcres) => {
              matches2.forEach((d) => {
                content = content.replace(`./../../static//images/note.svg`, `data:image/svg+xml;base64,${ipcres}`)
                // image = image.replace(`file:///${d.url}`, `#`)
                noteIndex++;
              })
            })
          }
          else {
            noteCount = 0
          }
          let regex3 = /(\.\.\/|\.\/){3}static\/\/images\/t_link\.svg/g;
          let matches3 = content.match(regex3);
          if (matches3 != null) {
            t_linkCount = matches3.length;
            // 获取附件图标
            ipc1.sendSync('loadFileB64', { type: 'local', path: `${webRoot}/v5_editor/source/static/images/t_link.svg` }).then((ipcres) => {
              matches3.forEach((d) => {
                content = content.replace(`./../../static//images/t_link.svg`, `data:image/svg+xml;base64,${ipcres}`)
                // image = image.replace(`file:///${d.url}`, `#`)
                t_linkIndex++;
              })
            })
          }
          else {
            t_linkCount = 0
          }
          let regex4 = /(\.\.\/|\.\/){3}static\/images\/comment\.svg/g;
          let matches4 = content.match(regex4);
          if (matches4 != null) {
            commentCount = matches4.length;
            // 获取附件图标
            ipc1.sendSync('loadFileB64', {
              type: 'local',
              path: `${webRoot}/editor/v5_editor/source/static/images/comment.svg`
            }).then((ipcres) => {
              matches4.forEach((d) => {
                content = content.replace(`./../../static//images/comment.svg`, `data:image/svg+xml;base64,${ipcres}`)
                // image = image.replace(`file:///${d.url}`, `#`)
                commentIndex++;
              })
            })
          } else {
            commentCount = 0
          }
          const inet = setInterval(() => {
            // console.log(imagesCount, imagesIndex, filesCount, filesIndex)
            if (imagesCount == imagesIndex &&
              filesCount == filesIndex &&
              svgCount == svgIndex &&
              formulaCount == formulaIndex &&
              fileCount == fileIndex &&
              linkCount == linkIndex &&
              noteCount == noteIndex &&
              t_linkCount == t_linkIndex &&
              commentCount == commentIndex &&
              staticIconPatchCount == staticIconPatchIndex) {
              clearInterval(inet)

              const parser = new DOMParser();
              const svgDom = parser.parseFromString(content, "image/svg+xml").documentElement
              const serializer = new XMLSerializer();
              const svgXML = serializer.serializeToString(svgDom);
              const widthAttr = (svgDom.getAttribute('width') || '').replace('px', '')
              const heightAttr = (svgDom.getAttribute('height') || '').replace('px', '')
              const viewBox = (svgDom.getAttribute('viewBox') || '').trim().split(/\s+/)
              let svgWidth = parseFloat(widthAttr)
              let svgHeight = parseFloat(heightAttr)
              if (!svgWidth || !svgHeight) {
                if (viewBox.length === 4) {
                  svgWidth = parseFloat(viewBox[2])
                  svgHeight = parseFloat(viewBox[3])
                }
              }
              const doc = makePdfDoc(svgWidth || 800, svgHeight || 600)
              if (!svgWidth || !svgHeight) {
                svgWidth = doc.internal.pageSize.getWidth()
                svgHeight = doc.internal.pageSize.getHeight()
              }
              if (!window.isMyFile && pcUtil.isOnline()) {
                onlineDownload(type, { type: (type == "pdfhd" ? "pdfHD" : "svg"), width: svgWidth, height: svgHeight, definition: content })
              }
              else {
                const saveBegin = () => {
                  const scale = pdfConfig.rasterScale || 2
                  const useJpeg = pdfConfig.rasterScale === 1
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
                  const img = new Image();
                  const svgBlob = new Blob([svgXML], { type: 'image/svg+xml;charset=utf-8' });
                  const blobUrl = URL.createObjectURL(svgBlob);
                  img.onload = () => {
                    canvas.width = Math.ceil(svgWidth * scale);
                    canvas.height = Math.ceil(svgHeight * scale);
                    context.setTransform(scale, 0, 0, scale, 0, 0);
                    context.fillStyle = '#fff';
                    context.fillRect(0, 0, svgWidth, svgHeight);
                    context.drawImage(img, 0, 0, svgWidth, svgHeight);
                    const addImageToPdf = (imgData) => {
                      const pdfWidth = doc.internal.pageSize.getWidth();
                      const pdfHeight = doc.internal.pageSize.getHeight();
                      let drawWidth, drawHeight
                      if (pdfIsOriginal) {
                        drawWidth = pdfWidth
                        drawHeight = pdfHeight
                      } else {
                        const scaleRate = Math.min(pdfWidth / svgWidth, pdfHeight / svgHeight)
                        drawWidth = svgWidth * scaleRate
                        drawHeight = svgHeight * scaleRate
                      }
                      doc.addImage(imgData, useJpeg ? 'JPEG' : 'PNG', 0, 0, drawWidth, drawHeight, '', 'FAST');
                      const result = doc.output('datauristring').replace('data:application/pdf;filename=generated.pdf;base64,', '')
                      const saveData = {
                        type: 'save', data: result, path: window.saveName, suffix: type.replace('hd', '').replace('HD', ''),
                      }
                      if (window.downType) {
                        ipc.sendToHost('down')
                      }
                      ipc1.sendSync('saveFileB64', saveData).then((res) => {
                        if (res != '') {
                          new Toast({ type: 'success', msg: '保存成功' })
                          console.log(Date.now())
                          if (window.downType) {
                            ipc.sendToHost('downed')
                          }
                        }
                        else {
                          if (window.downType) {
                            ipc.sendToHost('cancel')
                          }
                        }
                      })
                      URL.revokeObjectURL(blobUrl);
                    }
                    if (useJpeg) {
                      canvas.toBlob((blob) => {
                        if (!blob) {
                          new Toast({ type: 'error', msg: 'SVG渲染失败' })
                          window.poExportWait && window.poExportWait.stop()
                          if (window.downType) ipc.sendToHost('cancel')
                          URL.revokeObjectURL(blobUrl)
                          return
                        }
                        const reader = new FileReader()
                        reader.onloadend = () => addImageToPdf(reader.result)
                        reader.readAsDataURL(blob)
                      }, 'image/jpeg', 0.85)
                    } else {
                      addImageToPdf(canvas.toDataURL('image/png'))
                    }
                  }
                  img.onerror = () => {
                    if (window.downType) {
                      ipc.sendToHost('cancel')
                    }
                    new Toast({ type: 'error', msg: 'SVG渲染失败' })
                    window.poExportWait && window.poExportWait.stop()
                    URL.revokeObjectURL(blobUrl);
                  }
                  img.src = blobUrl;
                }

                if (window.downType) {
                  setTimeout(() => {
                    saveBegin()
                  }, 1000);
                }
                else {
                  saveBegin()
                }
              }
            }
          }, 300)
        })
    }
    // svg
    else {
      // 读取图片
      Promise.all([
        ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${chartId}/attachment.json` }),
        ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${chartId}/files.json` })]).
        then((res) => {
          const imagesUrls = isOnline ? [] : res[0] == '' ? [] : JSON.parse(res[0])
          const filesUrls = isOnline ? [] : res[1] == '' ? [] : JSON.parse(res[1])
          let imagesCount = imagesUrls.length;
          let imagesIndex = 0;
          let filesCount = filesUrls.length;
          let filesIndex = 0;
          let svgCount = 0;
          let svgIndex = 0;
          let formulaCount = 1;
          let formulaIndex = 0;
          let fileCount = 1;
          let fileIndex = 0;
          let linkCount = 1;
          let linkIndex = 0;
          let noteCount = 1;
          let noteIndex = 0;
          let t_linkCount = 1;
          let t_linkIndex = 0;
          let commentCount = 1;
          let commentIndex = 0
          let staticIconPatchCount = 1
          let staticIconPatchIndex = 0
          patchExportStaticIconUrls(image).then((patched) => {
            image = patched
            staticIconPatchIndex++
          })
          // 读取图片内容
          imagesUrls.forEach((d) => {
            ipc1.sendSync('loadFileB64', { type: 'local', path: d.url }).then((ipcres) => {
              if (ipcres != '') {
                const suffix = d.url.substring(d.url.lastIndexOf('.') + 1)
                image = image.replace(`./../../static/assetsfile:///${d.url}`, `data:image/${suffix};base64,${ipcres}`)
                image = image.replace(`./../../static//assetsfile:///${d.url}`, `data:image/${suffix};base64,${ipcres}`)
                image = image.replace(`./../../static/assetsqt:///${d.url}`, `data:image/${suffix};base64,${ipcres}`)
                image = image.replace(`file:///${d.url}`, `data:image/${suffix};base64,${ipcres}`)
              }
              imagesIndex++;
            })
          })
          // 附件处理 
          if (filesUrls.length > 0) {
            // 获取附件图标
            ipc1.sendSync('loadFileB64', { type: 'local', path: `${webRoot}/v5_editor/source/static/images/file.svg` }).then((ipcres) => {
              filesUrls.forEach((d) => {
                if (ipcres != '') {
                  image = image.replace(`./../../static/images/file.svg`, `data:image/svg+xml;base64,${ipcres}`)
                  image = image.replace(`./../../static//images/file.svg`, `data:image/svg+xml;base64,${ipcres}`)
                  image = image.replace(`file:///${d.url}`, `#`)
                }
                filesIndex++;
              })
            })
          }
          const data = xmlToJson.xml2json(image)
          if (data.defs && data.defs.pattern && typeof (data.defs.pattern) == 'object' && data.defs.pattern.length) {
            // 遍历查找矢量图
            data.defs.pattern.forEach((d) => {
              if (Object.hasOwnProperty.call(d, 'image') && d.image['xlink:href'].indexOf('.svg') > -1
						 && d.image['xlink:href'].startsWith('https://iconsapi.com') == -1) {
                svgCount++;
                const url = d.image['xlink:href'].replace('./../../static/', webRoot + '/v5_editor/source/static/')
                ipc1.sendSync('loadFileB64', { type: 'local', path: url }).then((ipcres) => {
                  if (ipcres != '') {
                    image = image.replace(d.image['xlink:href'], `data:image/svg+xml;base64,${ipcres}`)
                  }
                  svgIndex++;
                })
              }
            })
          }
          if (data.g && Object.hasOwnProperty.call(data.g, 'g')) {
            // 遍历小图标
            data.g.g.forEach((d) => {
              if (Object.hasOwnProperty.call(d, 'image')) {
                svgCount++;
                const url = d.image['xlink:href'].replace('./../../static/', webRoot + '/v5_editor/source/static/')
                ipc1.sendSync('loadFileB64', { type: 'local', path: url }).then((ipcres) => {
                  let imageSuffix = url.substring(url.lastIndexOf('.') + 1)
                  imageSuffix = imageSuffix == 'svg' ? 'svg+xml' : imageSuffix
                  image = image.replace(d.image['xlink:href'], `data:image/${imageSuffix};base64,${ipcres}`)
                  svgIndex++;
                })
              }
            })
          }
          ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${window.chartId}/formula.json` }).then((formula) => {
            if (formula != '') { formula = JSON.parse(formula); formulaCount = formula.length }
            else { formula = []; formulaCount = 0 }
            formula.forEach((f) => {
              ipc1.sendSync('loadFileB64', { type: 'local', path: f }).then((formuladata) => {
                let regex = new RegExp(`file:\/\/\/${f}`, 'gm')
                image = image.replace(regex, `data:image/png;base64,${formuladata}`)
                formulaIndex++
              })
            })
            ipc1.sendSync('saveFileB64', { type: 'cache', path: `back/${window.chartId}/formula.json`, data: '[]' })
          })
          let regex = /(\.\.\/|\.\/){3}static\/\/images\/file\.svg/g;
          let matches = image?image.match(regex):null
          if (matches != null) {
            fileCount = matches.length;
            // 获取附件图标
            ipc1.sendSync('loadFileB64', { type: 'local', path: `${webRoot}/v5_editor/source/static/images/file.svg` }).then((ipcres) => {
              matches.forEach((d) => {
                image = image.replace(`./../../static//images/file.svg`, `data:image/svg+xml;base64,${ipcres}`)
                // image = image.replace(`file:///${d.url}`, `#`)
                fileIndex++;
              })
            })
          }
          else {
            fileCount = 0
          }
          let regex1 = /(\.\.\/|\.\/){3}static\/\/images\/link\.svg/g;
          let matches1 =image? image.match(regex1):null
          if (matches1 != null) {
            linkCount = matches1.length;
            // 获取附件图标
            ipc1.sendSync('loadFileB64', { type: 'local', path: `${webRoot}/v5_editor/source/static/images/link.svg` }).then((ipcres) => {
              matches1.forEach((d) => {
                image = image.replace(`./../../static//images/link.svg`, `data:image/svg+xml;base64,${ipcres}`)
                // image = image.replace(`file:///${d.url}`, `#`)
                linkIndex++;
              })
            })
          }
          else {
            linkCount = 0
          }
          let regex2 = /(\.\.\/|\.\/){3}static\/\/images\/note\.svg/g;
          let matches2 = image?image.match(regex2):null
          if (matches2 != null) {
            noteCount = matches2.length;
            // 获取附件图标
            ipc1.sendSync('loadFileB64', { type: 'local', path: `${webRoot}/v5_editor/source/static/images/note.svg` }).then((ipcres) => {
              matches2.forEach((d) => {
                image = image.replace(`./../../static//images/note.svg`, `data:image/svg+xml;base64,${ipcres}`)
                // image = image.replace(`file:///${d.url}`, `#`)
                noteIndex++;
              })
            })
          }
          else {
            noteCount = 0
          }
          let regex3 = /(\.\.\/|\.\/){3}static\/\/images\/t_link\.svg/g;
          let matches3 = image?image.match(regex3):null
          if (matches3 != null) {
            t_linkCount = matches3.length;
            // 获取附件图标
            ipc1.sendSync('loadFileB64', { type: 'local', path: `${webRoot}/v5_editor/source/static/images/t_link.svg` }).then((ipcres) => {
              matches3.forEach((d) => {
                image = image.replace(`./../../static//images/t_link.svg`, `data:image/svg+xml;base64,${ipcres}`)
                // image = image.replace(`file:///${d.url}`, `#`)
                t_linkIndex++;
              })
            })
          }
          else {
            t_linkCount = 0
          }
          let regex4 = /(\.\.\/|\.\/){3}static\/images\/comment\.svg/g;
          let matches4 = image?image.match(regex4):null
          if (matches4 != null) {
            commentCount = matches4.length;
            // 获取附件图标
            ipc1.sendSync('loadFileB64', {
              type: 'local',
              path: `${webRoot}/editor/v5_editor/source/static/images/comment.svg`
            }).then((ipcres) => {
              matches4.forEach((d) => {
                image = image.replace(`./../../static//images/comment.svg`, `data:image/svg+xml;base64,${ipcres}`)
                // image = image.replace(`file:///${d.url}`, `#`)
                commentIndex++;
              })
            })
          } else {
            commentCount = 0
          }
          const inet = setInterval(() => {
            // console.log(imagesCount, imagesIndex, filesCount, filesIndex)
            if (imagesCount == imagesIndex &&
              filesCount == filesIndex &&
              svgCount == svgIndex &&
              formulaCount == formulaIndex &&
              fileCount == fileIndex &&
              linkCount == linkIndex &&
              noteCount == noteIndex &&
              t_linkCount == t_linkIndex &&
              commentCount == commentIndex &&
              staticIconPatchCount == staticIconPatchIndex) {
              clearInterval(inet)
              console.log('save-svg-btoa-begin', Date.now())
              const btoaData = importClass.stringToBase64String(image)
              saveData = {
                type: 'save', data: btoaData, path: window.saveName, suffix: type,
              }
              console.log('save-svg-btoa-end', Date.now())
              if (window.downType) {
                ipc.sendToHost('down')
              }
              ipc1.sendSync('saveFileB64', saveData).then((res) => {
                if (res != '') {
                  console.log('save-svg-end', Date.now())
                  new Toast({ type: 'success', msg: '保存成功' })
                  console.log(Date.now())
                  if (window.downType) {
                    ipc.sendToHost('downed')
                  }
                }
                else {
                  if (window.downType) {
                    ipc.sendToHost('cancel')
                  }
                }
              })
            }
          }, 300)
        })
    }
  },
  svgToCanvas(svgString, callback) {
    // 创建一个临时的SVG元素  
    var tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempSvg.innerHTML = svgString;
    // 用于跟踪加载完成的图片数量  
    var imageCount = tempSvg.querySelectorAll('image').length;
    var loadedCount = 0;

    // 遍历所有<image>元素并设置onload监听器  
    tempSvg.querySelectorAll('image').forEach(function (image) {
      image.onload = function () {
        loadedCount++;
        // 检查是否所有图片都已加载完成  
        if (loadedCount === imageCount) {
          // 所有图片已加载，执行转换逻辑  
          var serializer = new XMLSerializer();
          var svgBlob = new Blob([serializer.serializeToString(tempSvg)], { type: 'image/svg+xml;charset=utf-8' });
          var url = URL.createObjectURL(svgBlob);

          var img = new Image();
          img.onload = function () {
            // 创建一个Canvas元素  
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // 清理工作  
            URL.revokeObjectURL(url);

            // 调用回调函数，传递Canvas元素  
            callback(canvas);
          };
          img.src = url;

          // 如果图片已经在缓存中，则直接触发onload  
          if (img.complete) {
            img.onload();
          }
        }
      };

      // 如果图片已经在缓存中，则手动触发onload  
      if (image.complete) {
        image.onload();
      }
    });

    // 如果没有<image>元素，则直接调用回调（假设SVG已经是可渲染的）  
    if (imageCount === 0) {
      callback(null); // 或者直接处理SVG字符串转Canvas的逻辑  
    }
  },

  /**
   * 解析流程图定义图片返回json集合
   * @param {*} data 
   * @param {*} imagesPath 
   */
  flowImageJson(data, imagesPath, imagesUrls) {
    for (const k in data.elements) {
      // 图片类型节点
      if (data.elements[k].name == 'standardImage') {
        const path = data.elements[k].fillStyle.fileId.replace('file:///', '')
        const id = path.substring(path.lastIndexOf('/') + 1)
        const name = id.replace('.svg', '.png')
        const imagesData = imagesUrls.filter(d => d.name == name)
        if (imagesData.length > 0 &&
          !(data.elements[k].fillStyle.fileId.startsWith('https://iconsapi.com')
            || data.elements[k].fillStyle.fileId.startsWith('http://iconsapi.com')
          )) {
          const images = imagesData[0].path
          data.elements[k].fillStyle.fileId = images
          if (imagesPath.length == 0) {
            imagesPath.push({
              id: id,
              name: path
            })
          }
          else {
            let a = imagesPath.filter(f => data.elements[k].fillStyle.fileId.indexOf(f.name) > -1);
            if (a.length == 0) {
              imagesPath.push({
                id: id,
                name: path
              })
            }
          }
        }
      }
    }
    return { data, imagesPath }
  },

  /**
  * 解析思维导图定义图片附件返回json集合,还有节点密码的判断
  * @param {*} data 
  * @param {*} imagesPath 
  * @param {*} filesPath 
  */
  mindImagesFilesJson(data, imagesPath, filesPath, imagesUrls, filesUrls) {
    // 是否有图片
    if (Object.hasOwnProperty.call(data, 'image') && Object.hasOwnProperty.call(data.image, 'url') && !data.image.url.startsWith('data:image')) {
      const path = data.image.url.replace('file:///', '').replace('qt:///', '')
      const id = path.substring(path.lastIndexOf('/') + 1)
      const name = id.replace('.svg', '.png')
      const filterData = imagesUrls.filter(d => d.name == name)
      if (filterData.length > 0 &&
        !(data.image.url.startsWith('https://iconsapi.com')
          || data.image.url.startsWith('http://iconsapi.com')
        )) {
        const images = imagesUrls.filter(d => d.name == name)[0].path
        data.image.url = images
        if (imagesPath.length == 0) {
          imagesPath.push({
            id: id,
            name: path,
          })
        }
        else {
          let a = imagesPath.filter(f => data.image.url.indexOf(f.name) > -1);
          if (a.length == 0) {
            imagesPath.push({
              id: id,
              name: path,
            })
          }
        }
      }
    }
    // 是否有附件
    if (Object.hasOwnProperty.call(data, 'file') && Object.hasOwnProperty.call(data.file, 'value')) {
      const path = data.file.value.replace('file:///', '').replace('qt:///', '')
      const id = path.substring(path.lastIndexOf('/') + 1)
      const name = id
      const filterData = filesUrls.filter(d => d.name == name)
      if (filterData.length > 0) {
        const files = filesUrls.filter(d => d.name == name)[0].path
        data.file.value = files
        if (filesPath.length == 0) {
          filesPath.push({
            id: id,
            name: path,
          })
        }
        else {
          let a = filesPath.filter(f => data.file.value.indexOf(f.name) > -1);
          if (a.length == 0) {
            filesPath.push({
              id: id,
              name: path,
            })
          }
        }
      }
    }
    // 是否设置节点密码
    if (Object.hasOwnProperty.call(data, 'password')) {
      data.collapsed = true
    }
    if (Object.hasOwnProperty.call(data, 'leftChildren')) {
      if (data.leftChildren.length > 0) {
        data.leftChildren.forEach((d) => {
          d = exportFile1.mindImagesFilesJson(d, imagesPath, filesPath, imagesUrls, filesUrls)
        })
      }
    }
    // 是否有节点
    if (Object.hasOwnProperty.call(data, 'children')) {
      if (data.children.length > 0) {
        data.children.forEach((d) => {
          d = exportFile1.mindImagesFilesJson(d, imagesPath, filesPath, imagesUrls, filesUrls)
        })
      }
    }
    return { data, imagesPath, filesPath }
  },
  posSaveBak() {
    return new Promise((reslove, reject) => {
      try {
        // 初始化数据集
        const data = { type: 'pos', canvas: [], meta: [], chartObj: [] }
        // 判断pos类型导出方式并获取def数据
        if (window.fileType === 'mind') {
          data.type = 'posm'

        } else if (window.fileType === 'outline') {
          data.type = 'poso'
        } else {
          data.type = 'posf'
        }
        const canvas = []
        for (const k in editorGlobal.poPagination.data) {
          canvas.push(editorGlobal.poPagination.data[k])
        }
        // meta.json
        data.meta = [
          {
            name: 'meta.json',
            data: {
              "pages": canvas,
              "mainCanvasId": canvas[0].definitionId,
              "exportTime": pcUtil.getCurrentTimeString(),
              "member": "",
              "diagramInfo": {
                "creator": "",
                "created": pcUtil.getCurrentTimeString(),
                "modified": pcUtil.getCurrentTimeString(),
                "title": chartObj.title,
                "category": chartObj.category,
              },
              "id": chartId,
              "type": "AIPROS Schema File",
              "version": "5.0"
            }
          }
        ]
        // chartObj.json
        data.chartObj = [
          {
            name: 'chartObj.json',
            data: chartObj
          }
        ]
        // 遍历画布

        Promise.all(canvas.map(async d => {
          return new Promise((reslove1) => {
            // 读取画布内容
            FileDatabase.getChartDefById(window.chartId, d.definitionId, (def) => {
              // .pos文件集合
              reslove1({
                name: `${d.definitionId}.pos`,
                data:
                {
                  "diagram": {
                    "elements": JSON.parse(def.definition)
                  },
                  "meta": {
                    "mainCanvasId": d.definitionId,
                    "exportTime": pcUtil.getCurrentTimeString(),
                    "member": "",
                    "diagramInfo": {
                      "creator": "",
                      "created": pcUtil.getCurrentTimeString(),
                      "modified": pcUtil.getCurrentTimeString(),
                      "title": chartObj.title,
                      "category": chartObj.category
                    },
                    "id": d.definitionId,
                    "type": "AIPROS Schema File",
                    "version": "5.0"
                  }
                }
              })
            })
          })
        })).then((res) => {
          data.canvas = res
          const zip = new window.JSZip1();
          let imagesPath = [];
          let filesPath = [];
          let imagesCount = 0;
          let imagesIndex = 0;
          let filesCount = 0;
          let filesIndex = 0;
          let canvasIndex = 0;
          let canvasCount = 0
          // 压缩meta.json
          zip.file('meta.json', JSON.stringify(data.meta[0].data))
          if (data.chartObj && data.chartObj[0]) {
            zip.file('chartObj.json', JSON.stringify(data.chartObj[0].data))
          }
          // 创建图片和附件文件夹
          const imgs = zip.folder('attachment')
          const files = zip.folder('files')
          // 读取图片原有地址
          Promise.all([
            ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${data.meta[0].data.id}/attachment.json` }),
            ipc1.sendSync('loadFileB64', { type: 'cache', path: `back/${data.meta[0].data.id}/files.json` }),
            ipc1.sendSync('loadFileB64', { type: 'cache', path: 'theme/config.json' })]).
            then((res) => {
              canvasCount = data.canvas.length
              const imagesUrls = res[0] == '' ? [] : JSON.parse(res[0])
              const filesUrls = res[1] == '' ? [] : JSON.parse(res[1])
              let themes = []
              if (window.isMyFile) {
                themes = res[2] == '' ? [] : JSON.parse(res[2])
              }
              // 根据类型导出图片和附件
              if (window.fileType == 'flow') {
                data.canvas.forEach((c) => {
                  const d = exportFile1.flowImageJson(c.data.diagram.elements, imagesPath, imagesUrls)
                  c.data.diagram.elements = d.data;
                  imagesPath = d.imagesPath;
                  zip.file(c.name, JSON.stringify(c.data))
                  canvasIndex++
                })
              }
              else {
                data.canvas.forEach((c) => {
                  const d = exportFile1.mindImagesFilesJson(c.data.diagram.elements, imagesPath, filesPath, imagesUrls, filesUrls)
                  c.data.diagram.elements = d.data;
                  imagesPath = d.imagesPath;
                  filesPath = d.filesPath;
                  if (typeof c.data.diagram.elements.theme == 'string' && c.data.diagram.elements.theme.startsWith('customise_')) {
                    let nowtheme = themes.find(item => item.themeId == c.data.diagram.elements.theme)
                    if (nowtheme) {
                      const theme = JSON.parse(nowtheme.theme)
                      theme.thumbUrl = ''
                      delete theme.id
                      c.data.diagram.elements.theme = JSON.stringify(theme)
                      zip.file(c.name, JSON.stringify(c.data))
                      // zip.file(c.data.diagram.elements.theme, JSON.stringify(nowtheme))
                      canvasIndex++
                    }
                    else {
                      pcUtil.ajax({
                        url: `/api/personal/mindmap/gettheme?id=${c.data.diagram.elements.theme}`,
                        type: 'GET',
                        success: function (data) {
                          const theme = JSON.parse(data.data)
                          theme.thumbUrl = ''
                          delete theme.id
                          c.data.diagram.elements.theme = JSON.stringify(theme)
                          zip.file(c.name, JSON.stringify(c.data))
                          canvasIndex++
                        },
                        error: function () {
                          zip.file(c.name, JSON.stringify(c.data))
                          canvasIndex++
                        }
                      })
                    }
                  }
                  else {
                    zip.file(c.name, JSON.stringify(c.data))
                    canvasIndex++
                  }
                })
              }
              // 压缩图片
              imagesCount = imagesPath.length;
              filesCount = filesPath.length;
              imagesPath.forEach((d) => {
                ipc1.sendSync('loadFileB64', { type: 'local', path: d.name, }).then((ipcres) => {
                  imgs.file(`${d.id.replace('svg', 'png')}`, ipcres, { base64: true })
                  imagesIndex++;
                })
              })
              filesPath.forEach((d) => {
                ipc1.sendSync('loadFileB64', { type: 'local', path: d.name, }).then((ipcres) => {
                  files.file(`${d.id}`, ipcres, { base64: true })
                  filesIndex++;
                })
              })
              // 定时等待其他文件压缩完成
              const inet = setInterval(() => {
                console.log(imagesCount, imagesIndex, filesCount, filesIndex)
                if (imagesCount == imagesIndex && filesCount == filesIndex && canvasIndex == canvasCount) {
                  clearInterval(inet)
                  // 压缩完成导出base64数据
                  zip.generateAsync({ type: 'base64' }).then((content) => {
                    console.log('zip-file-end', Date.now())
                    let saveData;
                    saveData = { type: 'local', data: content, path: `${window.cachePath}/back/${chartId}/${chartId}`, suffix: 'bak', }
                    // 保存
                    ipc1.sendSync('saveFileB64', saveData).then((res) => {
                      reslove(false)
                    })
                  })
                }
              }, 300)
            })
        })
      }
      catch {
        reject()
      }
    })
  },
  mindImagesFilesJsonByBak(data, imagesPath, filesPath, imagesUrls, filesUrls, id, imgs, files) {
    return new Promise((reslove) => {
      Promise.all(
        [
          Object.hasOwnProperty.call(data, 'image') && Object.hasOwnProperty.call(data.image, 'url') &&
          new Promise((reslove1) => {
            const path = data.image.url.replace('file:///', '').replace('qt:///', '')
            const id = path.substring(path.lastIndexOf('/') + 1)
            const name = id.replace('.svg', '.png')
            const result = imagesUrls.find(d => d.name == name)
            if (result &&
              !(data.image.url.startsWith('https://iconsapi.com')
                || data.image.url.startsWith('http://iconsapi.com')
              )) {
              const images = imagesUrls.filter(d => d.name == name)[0].path
              data.image.url = images
              if (imagesPath.length == 0) {
                imagesPath.push({
                  id: id,
                  name: path,
                })
              }
              else {
                let a = imagesPath.filter(f => data.image.url.indexOf(f.name) > -1);
                if (a.length == 0) {
                  imagesPath.push({
                    id: id,
                    name: path,
                  })
                }
              }
              reslove1()
            }
            else {
              const fileId = data.image.url.substring(data.image.url.lastIndexOf('/') + 1, data.image.url.lastIndexOf('?'))
              window.fetch(data.image.url).then((res) => {
                const contentType = res.headers.get('content-type')
                let name = ''
                switch (contentType) {
                  case 'image/svg+xml': name = `${fileId}.svg`; break;
                  default: name = `${fileId}.${contentType.replace('image/', '')}`; break;
                }
                res.arrayBuffer().then((resData) => {
                  const saveBase = importClass.arrayBufferToBase64(resData)
                  // 保存图片或者附件
                  const saveData = { type: 'cache', data: saveBase, path: `back/${id}/${name}`, suffix: '' }
                  ipc1.sendSync('saveFileB64', saveData).then((resPath) => {
                    imagesUrls.push({
                      name: fileId, path: data.image.url, url: resPath
                    })
                    data.image.url = 'file:///' + resPath

                    imagesPath.push({
                      id: id,
                      name: path,
                    })

                    imgs.file(name, saveBase, { base64: true })
                    reslove1()
                  })
                })
              })
            }
          }),
          Object.hasOwnProperty.call(data, 'file') && Object.hasOwnProperty.call(data.file, 'value') &&
          new Promise((reslove1) => {
            const result = filesUrls.find(d => d.path == data.file.value)
            if (result) {
              data.file.value = result.url
              reslove1()
            }
            else {
              window.fetch(data.file.value).then((res) => {
                const fileId = data.file.value.substring(data.file.value.lastIndexOf('/') + 1)
                const contentType = res.headers.get('content-type')
                let name = ''
                switch (contentType) {
                  case 'image/svg+xml': name = `${fileId}.svg`; break;
                  default: name = `${fileId}.${contentType.replace('image/', '')}`; break;
                }
                res.arrayBuffer().then((resData) => {
                  const saveBase = importClass.arrayBufferToBase64(resData)
                  // 保存图片或者附件
                  const saveData = { type: 'cache', data: saveBase, path: `back/${id}/${name}`, suffix: '' }
                  ipc1.sendSync('saveFileB64', saveData).then((resPath) => {
                    filesUrls.push({
                      name: fileId, path: data.file.value, url: resPath
                    })
                    data.file.value = 'file:///' + resPath
                    files.file(name, saveBase, { base64: true })
                    reslove1()
                  })
                })
              })
            }
          }),
          Object.hasOwnProperty.call(data, 'leftChildren') &&
          new Promise((reslove1) => {
            Promise.all(data.leftChildren.map((d) => {
              return new Promise((reslove11) => {
                this.getMindFile(d, imagesUrls, filesUrls, id, imgs, files).then((resData) => {
                  d = resData.data
                  reslove11()
                })
              })
            })).then(() => {
              reslove1()
            })
          }),
          Object.hasOwnProperty.call(data, 'children') &&
          new Promise((reslove1) => {
            Promise.all(data.children.map((d) => {
              return new Promise((reslove11) => {
                this.getMindFile(d, imagesUrls, filesUrls, id, imgs, files).then((resData) => {
                  d = resData.data
                  reslove11()
                })
              })
            })).then(() => {
              reslove1()
            })
          })
        ]
      ).then(() => {
        reslove({ data, imagesUrls, filesUrls })
      })
    })
  },
  markdown(isSave) {
    return new Promise(async (reslove) => {
      const def = await PoEditorClient.getDef()
      let saveData;
      if (window.filepath == '' || !isSave ||
        !(window.filepath.endsWith('.md'))
      ) {
        saveData = {
          type: 'save', data: importClass.stringToBase64String(def), path: window.saveName, suffix: 'md',
        }
      }
      else {
        saveData = { type: 'local', data: importClass.stringToBase64String(def), path: window.filepath, suffix: 'md', }
      }
      // 保存
      ipc1.sendSync('saveFileB64', saveData).then((res) => {
        if (res !== '' && isSave) {
          if (window.downType) {
            ipc.sendToHost('downed')
          }
          window.filepath = res
          // 读取最近目录
          ipc1.sendSync('loadFileB64', { type: 'cache', path: 'history/cache.json' }).then((resHis) => {
            ipc.sendToHost("saveStatus", window.TABGROUPID, "saved")
            // 制作最近数据
            if (resHis == '') {
              resHis = '[]'
            }
            let history = JSON.parse(resHis);
            const title = res.lastIndexOf('/') > -1 ?
              res.substring(res.lastIndexOf('/') + 1, res.lastIndexOf('.')) :
              res.substring(res.lastIndexOf('\\') + 1, res.lastIndexOf('.'))
            window.saveName = title
            const historyC = {
              "chartId": chartObj.chartId,
              "title": title,
              "category": chartObj.category,
              //  type == 'flow' ? type : (type == 'mind' && (window.filepath == '' || window.filepath.endsWith('posm'))) ? 'mind' : 'outline',
              "definitionId": chartObj.chartId,
              "owner": {
                "userId": userId,
                "userName": fullName,
                "fullName": fullName
              },
              "ownerId": "1001",
              "description": "",
              "thumbImage": "",
              "lastModify": pcUtil.getCurrentTimeString(),
              "filepath": res,
              "type": 2
            }
            ipc1.send('setTabTitle', title)

            if (history.length > 0) {
              const hisI = history.findIndex(hisd => hisd.chartId == chartObj.chartId ||
                (hisd.chartId != chartObj.chartId && hisd.filepath == window.filepath))
              // 如果已经存在则删除
              if (hisI > -1) {
                history.splice(hisI, 1)
                history.push(historyC)
                const result = importClass.stringToBase64String(JSON.stringify(history));
                // 存储最近文件
                ipc1.sendSync('saveFileB64',
                  { type: 'cache', data: result, path: 'history/cache.json', suffix: '' }).then(() => {
                    ipc.sendToHost('refresh')
                    fileCache.isSave(chartObj.chartId, true)
                    console.log(Date.now())
                  })
              }
              else if (filepath != window.filepath && !window.filepath.endsWith('.bak')) {
                history.push(historyC)
                const result = importClass.stringToBase64String(JSON.stringify(history));
                // 存储最近文件
                ipc1.sendSync('saveFileB64',
                  { type: 'cache', data: result, path: 'history/cache.json', suffix: '' }).then(() => {
                    ipc.sendToHost('refresh')
                    fileCache.isSave(chartObj.chartId, true)
                    console.log(Date.now())
                  })
              }
            }
            else if (filepath != window.filepath) {
              history.push(historyC)
              const result = importClass.stringToBase64String(JSON.stringify(history));
              // 存储最近文件
              ipc1.sendSync('saveFileB64',
                { type: 'cache', data: result, path: 'history/cache.json', suffix: '' }).then(() => {
                  ipc.sendToHost('refresh')
                  fileCache.isSave(chartObj.chartId, true)
                  console.log(Date.now())
                })
            }
          })
          console.log('save-file-end', Date.now())
          new Toast({ type: 'success', msg: '保存成功' })
          window.defVersion.map(d=>d.isSave = true)
          reslove(true)
        }
        else if (res !== '') {
          console.log('save-file-end', Date.now())
          new Toast({ type: 'success', msg: '保存成功' })
          if (window.downType) {
            ipc.sendToHost('downed')
          }
          reslove(true)
        }
        else {
          if (window.downType) {
            ipc.sendToHost('cancel')
          }
          console.log(Date.now())
          reslove(false)
        }
      })
    })
  }
}
// 导出集合
const xmlToJson = {

  // converts xml documents and xml text to json object
  xml2json: function (xml, extended) {
    if (!xml) return {}; // quick fail

    //### PARSER LIBRARY
    // Core function
    function parseXML(node, simple) {
      if (!node) return null;
      var txt = '', obj = null, att = null;
      var nt = node.nodeType, nn = jsVar(node.localName || node.nodeName);
      var nv = node.text || node.nodeValue || '';
      /*DBG*/ //if(window.console) console.log(['x2j',nn,nt,nv.length+' bytes']);
      if (node.childNodes) {
        if (node.childNodes.length > 0) {
          /*DBG*/ //if(window.console) console.log(['x2j',nn,'CHILDREN',node.childNodes]);
          $.each(node.childNodes, function (n, cn) {
            var cnt = cn.nodeType, cnn = jsVar(cn.localName || cn.nodeName);
            var cnv = cn.text || cn.nodeValue || '';
            /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>a',cnn,cnt,cnv]);
            if (cnt == 8) {
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>b',cnn,'COMMENT (ignore)']);
              return; // ignore comment node
            }
            else if (cnt == 3 || cnt == 4 || !cnn) {
              // ignore white-space in between tags
              if (cnv.match(/^\s+$/)) {
                /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>c',cnn,'WHITE-SPACE (ignore)']);
                return;
              };
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>d',cnn,'TEXT']);
              txt += cnv.replace(/^\s+/, '').replace(/\s+$/, '');
              // make sure we ditch trailing spaces from markup
            }
            else {
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>e',cnn,'OBJECT']);
              obj = obj || {};
              if (obj[cnn]) {
                /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>f',cnn,'ARRAY']);
                if (!obj[cnn].length) obj[cnn] = myArr(obj[cnn]);
                obj[cnn][obj[cnn].length] = parseXML(cn, true/* simple */);
                // if(obj[cnn].length){
                //   obj[cnn].length = obj[cnn].length;
                // }
              }
              else {
                /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>g',cnn,'dig deeper...']);
                obj[cnn] = parseXML(cn);
              };
            };
          });
        };//node.childNodes.length>0
      };//node.childNodes
      if (node.attributes) {
        if (node.attributes.length > 0) {
          /*DBG*/ //if(window.console) console.log(['x2j',nn,'ATTRIBUTES',node.attributes])
          att = {}; obj = obj || {};
          $.each(node.attributes, function (a, at) {
            var atn = jsVar(at.name), atv = at.value;
            att[atn] = atv;
            if (obj[atn]) {
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'attr>',atn,'ARRAY']);
              if (!obj[atn].length) obj[atn] = myArr(obj[atn]);//[ obj[ atn ] ];
              if (obj[atn][obj[atn].length]) {
                obj[atn][obj[atn].length] = atv;
                obj[atn].length = obj[atn].length;
              }
              else {
                obj[atn] = atv;
              }
            }
            else {
              /*DBG*/ //if(window.console) console.log(['x2j',nn,'attr>',atn,'TEXT']);
              obj[atn] = atv;
            };
          });
          //obj['attributes'] = att;
        };//node.attributes.length>0
      };//node.attributes
      if (obj) {
        obj = $.extend((txt != '' ? new String(txt) : {}),/* {text:txt},*/ obj || {}/*, att || {}*/);
        if (txt) {
          txt = (obj.text) ? (typeof (obj.text) == 'object' ? obj.text : [obj.text || '']).concat([txt]) : txt;
        } else {
          txt = (obj.text) ? (typeof (obj.text) == 'object' ? obj.text : [obj.text || '']) : '';
        }
        if (txt) obj.text = txt;
        txt = '';
      };
      var out = obj || txt;
      //console.log([extended, simple, out]);
      if (extended) {
        if (txt) out = {};//new String(out);
        txt = out.text || txt || '';
        if (txt) out.text = txt;
        if (!simple) out = myArr(out);
      };
      // console.log(out)
      return out;
    };// parseXML
    // Core Function End
    // Utility functions
    var jsVar = function (s) { return String(s || '').replace(/-/g, "_"); };
    var isNum = function (s) { return (typeof s == "number") || String((s && typeof s == "string") ? s : '').test(/^((-)?([0-9]*)((\.{0,1})([0-9]+))?$)/); };
    var myArr = function (o) {
      if (!o.length) o = [o]; o.length = o.length;
      // here is where you can attach additional functionality, such as searching and sorting...
      return o;
    };
    // Utility functions End
    //### PARSER LIBRARY END

    // Convert plain text to xml
    if (typeof xml == 'string') xml = this.text2xml(xml);

    // Quick fail if not xml (or if this is a node)
    if (!xml.nodeType) return;
    if (xml.nodeType == 3 || xml.nodeType == 4) return xml.nodeValue;

    // Find xml root node
    var root = (xml.nodeType == 9) ? xml.documentElement : xml;

    // Convert xml to json
    var out = parseXML(root, true /* simple */);

    // Clean-up memory
    xml = null; root = null;

    // Send output
    return out;
  },

  // Convert text to XML DOM
  text2xml: function (str) {
    // NOTE: I'd like to use jQuery for this, but jQuery makes all tags uppercase
    //return $(xml)[0];
    var out;
    try {
      var xml =
        // ($.browser.msie) ? new ActiveXObject("Microsoft.XMLDOM") : 
        new DOMParser();
      xml.async = false;
    } catch (e) { throw new Error("XML Parser could not be instantiated") };
    try {
      // if ($.browser.msie) out = (xml.loadXML(str)) ? xml : false;
      // else 
      out = xml.parseFromString(str, "text/xml");
    } catch (e) { throw new Error("Error parsing XML string") };
    return out;
  }
}

export {
  handleExportCsv,
  handleExportDocx,
  handleExportOpml,
  exportPPTX,
  onlineDownload,
  exportFile1
}