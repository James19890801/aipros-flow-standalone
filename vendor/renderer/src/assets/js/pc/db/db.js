/**
 * 数据库操作对象
 */
const DBUtil = {
	init: function (name, callback = function () { }) {
		callback()
	},
	/**
	 * 保存或者更新数据
	 * @param {name} 表名称
	 * @param {*} dbObject 索引数据，允许为空
	 * @param {*} dbValues 要保存的json对象，确保存在id的属性。
	 */
	save: function (name, dbValues, callback = function () { }) {
		window.api.ipcRenderer.invoke('saveData', { dbName: name, data: dbValues }).then((res) => {
			callback(res)
		})
	},
	// 删除数据
	remove: function (name, key, callback = function () { }) {
		window.api.ipcRenderer.invoke('removeData', { dbName: name ,key }).then((res) => {
			callback(res)
		})
	},
	// 清空用户文件数据
	removeFile: function (callback = function () { }) {
		let id = window.localStorage.getItem("processon_userKey");
		window.api.ipcRenderer.invoke('removeFileData', { userId: id }).then((res) => {
			callback(res)
		})
	},
	// 清空数据库
	clear: function (name, callback = function () { }) {
		window.api.ipcRenderer.invoke('clearData').then((res) => {
			callback(res)
		})
	},
	// 更新数据
	put: function (name, dbValues, callback = function () { }) {
		window.api.ipcRenderer.invoke('saveData', { dbName: name, data: dbValues }).then((res) => {
			callback(res)
		})
	},
	// 更新数据 包括主键 id
	putAll: function (name, oldId, dbValues, callback = function () { }) {
		window.api.ipcRenderer.invoke('putAllData', { dbName: name, oldId, data: dbValues }).then((res) => {
			callback(res)
		})
	},
	/**
	 * 获取列表
	 * @param {}} name 表名
	 * @param {*} key 表名
	 * @param {*} query 查询条件
	 * @param {*} callback 回调函数
	 */
	find: function (name, key, query, callback = function () { }) {
		window.api.ipcRenderer.invoke('findData', { dbName: name, query }).then((res) => {
			callback(res)
		})
	},
	/**
	 * 查询单条记录
	 * @param {*} name 表名
	 * @param {*} key 表名
	 * @param {*} callback 回调函数
	 */
	findOne: function (name, key, callback = function () { }) {
		window.api.ipcRenderer.invoke('findOneData', { dbName: name, key }).then((res) => {
			callback(res)
		})
	},
	util: {
		getCurrentTimeString: function (time) {
			var date = time ? new Date(time) : new Date();
			var y = date.getFullYear();
			var m = date.getMonth() + 1;
			var d = date.getDate();
			var hour = date.getHours();
			var minute = date.getMinutes();
			var seconds = date.getSeconds();

			if (m < 10) m = '0' + m;
			if (d < 10) d = '0' + d;
			if (hour < 10) hour = '0' + hour;
			if (minute < 10) minute = '0' + minute;
			if (seconds < 10) seconds = '0' + seconds;

			return y + "-" + m + "-" + d + ' ' + hour + ':' + minute + ':' + seconds;
		}
	}
};

export default DBUtil;
