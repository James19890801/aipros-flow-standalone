/**
 * @description 导入 xlsx | csv
 * @returns definition
 */
function handleImportExcle(file) {
  return new Promise(async function (resolve, reject) {
    // 用 buffer 给 ExcelJS
    const arrayBuffer = await readFileAsArrayBuffer(file);
    // 创建这个文件的 workbook
    const workbook = XLSX.read(arrayBuffer);
    // const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw_data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const res = processData(raw_data);
    // await workbook.xlsx.load(arrayBuffer);

    // const worksheet = workbook.getWorksheet(1); // 获取第一个工作表

    // const hierarchy = convertToHierarchy(worksheet);

    // console.log(hierarchy);

    resolve(res);
  });
}/**
 * @description 导入 xlsx | csv
 * @returns definition
 */
function handleImportExcleByArrayBuffer(arrayBuffer,fileTitle) {
  return new Promise(async function (resolve, reject) {
    try{
      // 创建这个文件的 workbook
      const workbook = XLSX.read(arrayBuffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw_data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const res = processData(raw_data,fileTitle);
  
      resolve(res);
    }
    catch{
      reject(null)
    }
  });
}
/**
 * @description 转换数据按照层级划分
 * @param {*} worksheet
 */
function convertToHierarchy(worksheet) {
  let result = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const rowData = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      rowData.push(cell.value);
    });
    result.push(rowData);
  });

  return processData(result);
}

/**
 * @description 递归判断每行的每一个是否在当前层级 没有就添加
 * @param {*} dataList
 * @returns definition
 */
function processData(dataList, fileTitle) {
  // 最终数据
  const result = [
    {
      id: "root",
      title: fileTitle,
      parent: null,
      children: [],
      collapsed: false,
    },
  ];
  // 遍历每一行
  dataList.forEach((data, dataIndex) => {
    let currentLevel = result[0].children;
    let parentItem = result[0];
    let isUndefinedWithLine = false // 在一行中如果有undefined并且前面的数据有一个不是undefined 这个逻辑真的很强
    for (let index = 0; index < data.length; index++) {
   
      let item = data[index];
      try{
        item =decodeURIComponent(escape(item))
        if(typeof item !== 'string'){
          item = data[index];
        }
      }
      catch{}
      const frontIndex =data.slice(0, index);
      isUndefinedWithLine = !item && !!frontIndex.find(i=>i) 
      if (item !== undefined && item != 'undefined') {
        const existingItem = currentLevel.find((el) => el.title === item);
        // 不存在就创建一个 并且它是当前的parentItem
        if (!existingItem) {
          const newItem = {
            id: generateRandomId(),
            title: String(item),
            parent: parentItem ? parentItem.id : null,
            children: [],
            collapsed: false,
          };

          currentLevel.push(newItem);
          currentLevel = newItem.children;
          parentItem = newItem;
        } else {
          currentLevel = existingItem.children;
          parentItem = existingItem;
        }
      } else {
        // 只有这种情况才去找下一层
        if(!isUndefinedWithLine){
          parentItem = currentLevel[currentLevel.length - 1];
          currentLevel = parentItem.children;
        }else{
        // 其余情况是横向的合并单元格 直接继续for循环即可
          continue;
        }
      }
    }
  });

  return result;
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      resolve(arrayBuffer);
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
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
