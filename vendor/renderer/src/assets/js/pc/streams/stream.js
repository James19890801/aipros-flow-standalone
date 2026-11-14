import DBUtil from "../db/db.js";
import UserOperation from "../db/user.js";
import ServerUtil from "../server/server.js";
import FileDatabase from "../operation/fileDatabase.js";

const StreamOperation = {
    pushDefStreams: function(params, callback = ()=>{}) {
        params = params || {};
        params = { ignore: "", msgStr: "[]", chartId: null, ...params };
        let defVersion = params.version || 0;
        let onlineVersion = params.onlineVersion || 0;
        let uk = UserOperation.getUk();
        let chartId = params.chartId;
        let defId = params.defId;
        let mainCanvasId = params.canvasId;
        // 推送失败的指令集合
        let errorMsgs = [];

        let botainFirst = () => {};
        let pushMsg = () => {};
        let pushEnd = () => {};
        // 将新的指令插入数据库后，提取该文件定义指令的第一个条，并在数据库中删除
        botainFirst = () => {
            return new Promise((resolve, reject) => {
                DBUtil.findOne("base_def_config", uk, base_def_config => {
                    // 获取文件定义本地指令集合
                    let msgsObj = base_def_config ? base_def_config.msgs : {};
                    let msgs = msgsObj[chartId] || [];
                    let first_base = {};
                    // 本地指令大于 100 条时，触发全量保存
                    if(msgs.length >= 0 && pcUtil.isOnline()) {
                        // 对比版本号
                        let comparisonVersion = data => {
                            // 本地版本大于线上版本, 本地全量更新，线上保存历史版本
                            // 当前阶段除流程图外走全量更新
                            console.log(`线上版本 ${data.version}, 本地版本 ${defVersion}`)
                            if(defVersion > data.version) {
                                FileDatabase.clearChartDefBase(chartId);
                                callback("fullUpdate");
                            }
                            // 线上版本大于本地版本，本地保存历史版本，线上覆盖本地
                            else if(defVersion < data.version) {
                                FileDatabase.getChartDefByChartId(chartId, chartDef => {
                                    let definition = chartDef.definition;

                                    ServerUtil.addDefVersion(chartId, "客户端同步存储", definition,mainCanvasId, () => { // todo
                                        ServerUtil.getChartDefById(
                                            chartId,
                                            defId,
                                            chartDef => {
                                                FileDatabase.clearChartDefBase(chartId);
                                                callback("fullPull", chartDef)
                                            },
                                            chartDef => {
                                                FileDatabase.clearChartDefBase(chartId);
                                                callback("fullPull", chartDef)
                                            }
                                        )
                                    })
                                })
                            }
                            else callback("equality");
                        };
                        if(params.type != "outline") {
                            console.log('chartId = ', chartId)
                            onlineVersion && comparisonVersion({ version: onlineVersion });
                            !onlineVersion && ServerUtil.getDefVersion(chartId, mainCanvasId,comparisonVersion, () => callback("getVersionError"));
                        }
                        else {
                            FileDatabase.getChartDefByChartId(chartId, chartDef => {
                                ServerUtil.getChartDefById(
                                    chartId,
                                    chartDef => {
                                        comparisonVersion(JSON.parse(chartDef.definition));
                                    },
                                    chartDef => {
                                        comparisonVersion(JSON.parse(chartDef.definition));
                                    }
                                );
                            })
                        }
                    }
                    else {
                        console.log("收到的新增指令", params)
                        console.log("获取的本地指令集合", msgs)
                        // 将新增指令添加到取出的指令集和，并清除 params 属性
                        if(params && params.msgStr && JSON.parse(params.msgStr).length) {
                            msgs.push(params);
                            params = false;
                            console.log("添加新增指令后的指令集和", msgs)
                        }

                        // 判断是否是联网状态
                        if(pcUtil.isOnline()) {
                            // 取出第一条指令后将新的指令集合更新会本地
                            if(msgs.length) {
                                first_base = msgs[0];
                                msgsObj[chartId] = msgs.slice(1);
                                console.log("取出的第一条指令", first_base)
                                console.log("取出第一条指令后的指令", msgsObj[chartId])
                                DBUtil.save("base_def_config", {id: uk, msgs: msgsObj}, base_def_config => {
                                    resolve(first_base)
                                });
                            }
                            else reject();
                        }
                        // 断网情况，直接保存指令到本地
                        else {
                            errorMsgs = msgs;
                            reject();
                            // msgsObj[chartId] = msgs;
                            // console.log("msgsObj==", msgsObj)
                            // DBUtil.save("base_def_config", {id: uk, msgs: msgsObj}, reject);
                        }
                    }
                })
            });
        };
        // 提交结束
        pushEnd = () => {
            DBUtil.findOne("base_def_config", uk, base_def_config => {
                // 获取该文件的文件定义指令集合
                let msgsObj = base_def_config ? base_def_config.msgs : {};
                msgsObj[chartId] = errorMsgs;
                console.log("提交结束后的 errorMsgs 和 msgsObj ---------", errorMsgs, msgsObj[chartId])
                DBUtil.save("base_def_config", {id: uk, msgs: msgsObj}, (data) => {
                    DBUtil.findOne("base_def_config", uk, base_def_config => {
                        console.log("pushEnd ---------------", base_def_config.msgs[chartId])
                    })
                    callback("pushConfig", data)
                });
            })
        };
        // 循环提交
        pushMsg = () => {
            botainFirst().then(first_base => {

                let data = first_base;

                let pushFn = (data) => {
                    ServerUtil.syncChartDefStreamPush(data, pushMsg, function(err) {
                        errorMsgs.push(first_base);
                        // 推送指令出现错误，触发全量保存
                        callback("fullUpdate");
                    });
                };

                // 判断指令内 chartId 是否是 dbId
                console.log("判断指令内 chartId 是否是 dbId", data.chartId, data.chartId.length < 12)
                if(data.chartId.length < 12) {
                    FileOperation.getChartById(data.chartId, chart => {
                        data.chartId = chart.chartId;
                        console.log("替换指令内 dbId 为线上 id", data)
                        pushFn(data);
                    })
                }
                else pushFn(data);
            }).catch(pushEnd);
        };
        pushMsg();
    }
 
};

export default StreamOperation;
