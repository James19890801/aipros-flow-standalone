import DBUtil from "./db.js";
import ServerUtil from "../server/server.js";
/**
 * 用户相关的数据库操作
 */
const UserOperation = {
	/**
	 * 获取用户 userKey
	 * @returns {"用户userKey"}
	 */
	getUk:function() {
		return window.localStorage.getItem("processon_userKey");
	},
	/**·
	 * 获取 websocket token
	 * @returns {"websocket_token"}
	 */
	getWsToken:function() {
		return window.localStorage.getItem("processon_ws_token");
	},
	/**
	 * 获取客户端 clientId
	 * @returns {"客户端clientId"}
	 */
	getClientId:function() {
		return window.localStorage.getItem("pc_clientId");
	},
	/**
	 * 获取当前登录 token
	 * @returns {"前登录token"}
	 */
	getToken:function() {
		return window.localStorage.getItem("processon_token");
	},
	/**
	 * 获取当前登录 fullName
	 * @returns {"前登录fullName"}
	 */
	getFullName:function() {
		return window.localStorage.getItem("processon_fullName");
	},
	/**
	 * 获取用户数据
	 * 		联网状态: 获取线上用户最新数据更新到本地数据库, 并返回
	 * 		断网状态: 直接获取本地数据库用户数据
	 * @param {"用户userKey"} uk [默认当前登录用户uk]
	 * @param {"回调函数"} callback [用户数据]
	 * @param {"是否优先获取线上数据"} isOnline
	 */
	getUser:function(uk, callback = function(){}, isOnline){
		uk = uk || UserOperation.getUk();
		if(pcUtil.isOnline()) {
			ServerUtil.userInfo(function(res) {
				if(res && res.code == 200 && res.data.user) {
					let data = res.data;
					let user = { id: data.user.userId, ...data.user, totalFileCount: data.auth.fileCount, auth: data.auth };
					DBUtil.put("users", user, () => {
						callback(user)
					});
					window.localStorage.setItem("processon_fullName", user.fullName);
				}
				else if(res.code == 408) {
					
					window.localStorage.removeItem("processon_token");
					window.localStorage.removeItem("processon_ws_token");
					window.localStorage.removeItem("processon_userKey");
					ipc.send("logout");
				}
				else callback(false);
			}, function(err) {
				callback(false);
			});
		}
		else {
			DBUtil.findOne("users", uk, user => {
				if(user) {
					callback(user)
				}
				else callback(false)
			});
		}
	},
	/**
	 * 保存用户数据到本地数据库
	 * @param {"用户数据"} user
	 * @param {"回调函数"} callback [用户数据]
	 */
	saveUser:function(user, callback = function(){}){
		let dbUser = { id: user.userId, ...user, totalFileCount: user.fileCount };

		DBUtil.save("users", dbUser, callback);
	},
	/**
	 * 更新本地数据库用户数据
	 * @param {"需要更新的数据"} user
	 * @param {"返回更新后的 user对象"} callback
	 */
	putUser:function(user, callback = function(){}) {
		let dbUser = { id: UserOperation.getUk(), ...user };
		// DBUtil.put("users", dbUser, callback);
		DBUtil.put("users", dbUser, callback);
	},
	/**
	 * 获取用户文件数量
	 * @param {"用户id"} userId
	 * @param {"返回 user 数据"} callback
	 * @param {"不优先请求线上数据"} isOnline
	 */
	getUserPrivilege:function(userId, callback = function(){}) {
		if(!userId || userId == "") userId = UserOperation.getUk();
		if(pcUtil.isOnline()) {
			ServerUtil.userPrivilege(function(res) {
				let data = (res && res.data) || {};
				let privilege = data.privilege || {};
				callback({...privilege,totalFileCount:privilege.fileCount})
			}, function () {
				try { callback(JSON.parse(localStorage.getItem('privilege')) || {}) } catch (e) { callback({}) }
			});
		}
		else {
			callback(JSON.parse(localStorage.getItem('privilege')))
		}
	}
};

export default UserOperation;
