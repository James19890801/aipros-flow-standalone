import { fetch } from "./request.js"
import Configs from './configs.js'
import UserOperation from "@/assets/js/pc/db/user.js"
let v5api = Configs.ApiPrefix


// 检查克隆是否收费
export function apiCloneCheck(data) {
    let apiUrl = v5api + "/api/personal/diagraming/clone_check"
    return fetch({
        onlyData: true,
        needToken: true
    }).post(apiUrl, data)
}
//创建
export function apiRootNew(data) {
    let apiUrl = v5api + "/api/personal/diagraming/root/new"
    return fetch({
        onlyData: true,
        needToken: true
    }).post(apiUrl, data)
}
// 从模版新建 获取模版list
export function getTemplateList(data) {
    let apiUrl = v5api + "/api/personal/search/official"
    return fetch({
        onlyData: true,
        needToken: true,
        headers: {
            'Content-Type': 'application/json'
        }
    }).post(apiUrl, data)
}

export function getCategroy(data) {
    let apiUrl = v5api + "/api/personal/template/official/config"
    return fetch({
        onlyData: true,
        needToken: true
    }).post(apiUrl, data)
}
// 最近使用 调用社区的最近使用
export function getTemplateUsed(data) {
    let apiUrl = v5api + "/api/personal/chart/getTemplateUsed"
    let opt = {
        curPage: 1,
        pageSize: 100,
        ...data
    }
    //this.$store.state.StateUser.user.userId
    return fetch({
        onlyData: true,
        needToken: true,
    }).get(apiUrl, opt)
}

// 是否收藏
export function isLiked(data) {
    let apiUrl = v5api + "/api/personal/template/liked"
    let opt = {
        ...data
    }
    //this.$store.state.StateUser.user.userId
    return fetch({
        onlyData: true,
        needToken: true,
    }).get(apiUrl, opt)
}

// 获取官方可见场景分类
export function tagsCategoryofficial(data) {
    let apiUrl = v5api + "/api/personal/tags/category/official"
    let opt = {
        ...data
    }
    return fetch({
        onlyData: true,
        needToken: true,
    }).get(apiUrl, opt)
}
// 根据场景分类 获取 官方标签
export function tagsofficial(data) {
    let apiUrl = v5api + "/api/personal/tags/official"
    let opt = {
        ...data
    }
    return fetch({
        onlyData: true,
        needToken: true,
        isJson: true
    }).post(apiUrl, opt)
}
// 模板简介-试一试AI-获取权限
export function desUsePower(data) {
    let apiUrl = v5api + "/api/personal/aigc/get/pb/temp/des/use/power"
    let opt = {
        ...data
    }
    return fetch({
        onlyData: true,
        needToken: true
    }).get(apiUrl, opt)
}

// 标记/取消标记
export function apiFavouriteChart(chartId, chartType) {
    let url = v5api + '/api/personal/view/favourite_chart',
        opt = { chartId: chartId, chartType: chartType }
    return fetch({
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            token: UserOperation.getToken()
        }
    }).post(url, opt)
}

export function apiNewFiles(folderId, category, templateId) {
    // todo
    let url = v5api + "/api/personal/diagraming/create",
        opt = {}
    opt.folderId = folderId
    if (typeof category === 'string' && category !== '') {
        opt.category = category
    }
    if (typeof templateId === 'string' && templateId !== '') {
        opt.templateId = templateId
    }
    return fetch({
        noCheck: true,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            token: UserOperation.getToken()
        }
    }).post(url, opt)
}
