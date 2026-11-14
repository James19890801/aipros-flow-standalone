import DBUtil from "./db.js";
import UserOperation from "./user.js";

/**
 * 软件设置相关
 * software_set
 * basic: array
 * aspect, language, date_format, file_output, version_updating: string
 *
 * basic: 基本设置；[ auto_start: 开机自启动, on_computer: 在我的电脑中显示, auto_update: 自动更新 ]
 * aspect: 外观; ( follow_system: 随系统自动切换 | light_color: 浅色 | dark_color: 深色 )
 * language: 语言; ( follow_system: 跟随系统语言 | chinese: 中文 )
 * date_format: 日期格式; ( YYYY-MM-DD | YYYY/MM/DD )
 * file_output: 文件输出; "appPath/download"
 * version_updating: 版本更新; "0.0.1"
 */
const Setting = {
    isMac: function() {
        var agent = navigator.userAgent.toLowerCase();
        var isMac = /macintosh|mac os x/i.test(navigator.userAgent);

        if(agent.indexOf("win32") >= 0 || agent.indexOf("wow32") >= 0) isMac = false;
        if(agent.indexOf("win64") >= 0 || agent.indexOf("wow64") >= 0) isMac = false;

        return isMac;
    },
    /**
     * 初始化
     * 本地数据库没有 setting 数据时，构建初始设置
     * @param callback
     */
    initialize: function(callback = function(){}) {
        Setting.getSetting(callback);
    },
    /**
     * 更新设置数据
     * @param {"需要更新的数据"} newSetting
     * @param {"返回更新后的 setting 数据"} callback
     */
    updateSetting: function(newSetting = {}, callback = function(){}) {
        console.log('newSetting',newSetting)
        let uk = UserOperation.getUk();
        DBUtil.put("software_set", {id: uk, ...newSetting}, callback);
    },
    /**
     * 获取设置数据
     * @param {"需要查询的数据字段 | 空"} key
     * @param {"返回查询到的单个属性 | 整个数据对象"} callback
     */
    getSetting: function(key, callback = function(){}) {
        let uk = UserOperation.getUk();
        
        DBUtil.findOne("software_set", uk, (setting = {}) => {
            let full = true;
            let software = {
                id: uk,
                awaitRestart:false,
                trayOpenSeted:false,
                "basic": [ "on_computer", "auto_update"],
                "aspect": "light_color", "language": "chinese",
                "date_format": "YYYY-MM-DD", "file_output": `${process.env.USERPROFILE || ""}\\Downloads`,
                "version_updating": "0.0.1", 
                "awaitRestart": false,
                "proxy":{
                    type: 'none', // 'none' | 'browser' | 'http'
                    address: '',
                    port: '',
                    username: '',
                    password: ''
                }
            };
            let cb = setting => {
                if(key && typeof key == 'string') callback(setting[key]);
                else callback(setting);
            }
            Object.keys(software).map(k => {if((!setting[k] && setting[k] !== false) || setting[k] == "") full = false;});

            if(!full) {
                console.log("setting合并前",setting)
                console.log("software合并前",software)
                setting = {...software, ...setting};
                console.log("setting合并后",setting)
                if(!setting.file_output || setting.file_output == "") setting.file_output = software.file_output;
                ipc.once('get_auto_start_callback',(_evt,data)=>{
                    console.log('auto_start',data)
                    console.log('data',setting)
                    if(data && software.basic.indexOf("auto_start") ==-1){
                        software.basic.push('auto_start')
                    }
                    else if (!data && software.basic.indexOf("auto_start") >-1){
                        delete software.basic.auto_start
                    }

                    DBUtil.save("software_set", setting, setting => {
                        if(software.basic.indexOf("auto_start") >= 0) ipc.send("auto_start");
                        console.log("新的setting---",setting)
                        cb(setting);
                    });
                })
                ipc.send('get_auto_start')
            }
            else cb(setting);
        });
    }
};

export default Setting;
