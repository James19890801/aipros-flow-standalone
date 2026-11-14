<template>
    <div>
        <div class="tempateCreateGirdWarp">
            <!-- 模版卡片 最多80个 不做分页 -->
            <div class="cardListWarp" ref="cardListWarp">
                <div class="crumbs">
                    <div class="cardListReturn" @click="backToTemplate">返回</div>
                    <div style="margin:0 8px">></div>
                    <div style="color: #212930">{{ query.name }}</div>
                </div>
                <TemplatePods @toView="toView" :charts="templatePods" v-if="templatePods.length"  :keyword="keyword" :type="type" />
                <div class="wrap_no" v-else>
                    <img src="@/assets/images/icon/nothing/no-content.svg" alt="">
                    <p>暂无相关内容</p>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import TemplatePods from './templatePods.vue'
import { getTemplateList } from './api/template.js'
import { NAMEMAP } from './constants'
export default {
    name: 'category',
    components: {
        TemplatePods
        // dirMbx
    },
    
    props:['query'],
    data() {
        return {
            sceneActive: 0, // 当前场景索引
            templatePods: []
        }
    },
    created() {
        // 注册组件
        this.fetchTemplate()
    },
    computed:{
        type: function () {
            return NAMEMAP[this.query.category] || ''
        },
        keyword: function () {
            return this.query.name || ''
        }
    },
    mounted() {
        const { name = '', position = 0 } = this.query
    },
    methods: {
        toView(info){
            this.$emit('toView',info)
        },
        backToTemplate(){
            this.$emit('backToTemplate')
        },
        handleChangeScene(item, index) {
            this.sceneActive = index
        },
        fetchTemplate() {
            const { name = '', category = '' } = this.query
            getTemplateList(JSON.stringify({ category, keyword: name })).then(res => {
                console.log(res)
                if (res.code === '200') {
                    console.log("res.data.rows", res.data.rows)
                    this.templatePods = res.data.rows // 冻结
                    // const charts = this.formateTemplateData(res.data.rows)
                    // this.templatePods = Object.freeze(charts) // 冻结
                }
            })
        },
        // toTemplateCommunity() {
        //     let url = this.$fns.getHost('edit') + "/template"
        //     window.open(url)
        // }
        // formateTemplateData(list){
        //     for(var i = 0; i < list.length; i++){
        //         if(list[i].thumbnail){
        //           list[i].allImagePath = this.$getThumb(list[i])
        //         }
        //     }
        //     return list
        // }
    }
}
</script>
<style scoped>
.tempateCreateGirdWarp {
    height: calc(100vh - 84px);
    overflow-y: auto;
    padding: 10px 32px 0px 32px;
    overflow-y: scroll;
}

.gridHeader {
    display: grid;
    grid-gap: 25px;
    align-content: start;
    grid-template-columns: repeat(6, minmax(130px, 1fr));
    justify-items: stretch;
    cursor: pointer;
}

.gridHeader-forText {
    display: flex;
    margin-top: 17px;

}

.gridHeader-forText-item {
    display: flex;
    height: 30px;
    color: #6C7D8F;
    border-radius: 4px;
    flex-wrap: nowrap;
    align-items: center;
    background: #ffffffff;
    padding: 0px 16px;
    margin-right: 16px;
    justify-content: space-between;
}

.gridHeader-forText-item:hover {
    cursor: pointer;
}

.gridHeader-forText-item i {
    line-height: 16px;
    text-align: center;
    font-size: 16px;
    margin-right: 2px;
    margin-top: 1px;
}

.gridHeader-forText-item p {
    display: inline-block;
    width: max-content;
    margin: 0 0 0 4px;
    font-family: "PingFang SC";
}

.gridHeader-scene {
    display: flex;
    flex-wrap: nowrap;
    margin-top: 32px;
    align-items: center;
}

.gridHeader-scene-item {
    cursor: pointer;
    border-radius: 16px;
    opacity: 1;
    padding: 6px 16px;
    margin-right: 16px;
    background: #ffffffff;
    text-align: center;
    color: #212930ff;
    font-size: 13px;
    font-weight: 400;
    display: inline-block;
}

.sceneName {
    width: max-content;
}


.gridHeader-scene-right {
    color: #067befff;
    font-size: 13px;
    font-weight: 400;
    margin-left: auto;
    cursor: pointer;
}

.crumbs {
    display: flex;
    font-size: 13px;
    width: max-content;
    color: #9AA5B8;
    justify-content: space-between;
    margin-bottom: 20px;
    cursor: pointer;
}

.wrap_no {
    width: 100px;
    height: 100px;
    position: absolute;
    margin: auto;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    color: #6C7D8F
}

.wrap_no img {
    width: 100%;
}

.wrap_no p {
    margin: 0;
    text-align: left;
}

.cardListReturn:hover {
    color: #212930;
}
</style>