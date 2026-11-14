<template>
    <div class="tempateCreateGirdWarp" ref="gridHeader" v-show="!showCategory" @click="checkClick">
        <!-- 滑块 -->
        <PoSwitchSlider v-show="templateView && !searchingHide" keep-alive />
        <!-- 分类-大图 -->
        <div v-show="searchingHide" style="color:#666666;font-size: 15px;margin-top: 40px;">搜索“{{ searchTitle }}”</div>
        <div class="gridHeaderWrapper" v-if="query.category !== 'history'" v-show="!searchingHide">
            <div class="gridHeader scrollable-container" v-if="gridSpecialList.length">
                <div class="scrollContainer">
                    <div class="headerImageItem image-transition" v-for="(item, index) in gridSpecialList"
                        :key="item.name + '_' + item.isHover" @mouseover="gridHeaderMouseOver(index)"
                        @mouseout="gridHeaderMouseOut(index)" @click.stop="handletoCategory(item, index)">
                        <div class="headerImageItemBg headerImageItemBg_Hover"
                            :style="{ visibility: item.isHover ? 'visible' : 'hidden', backgroundImage: `url(${item.image_hover})` }">
                        </div>
                        <div class="headerImageItemBg" :style="{ backgroundImage: `url(${item.image})` }">
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="gridHeader-scene" v-if="gridHeaderScene.length" v-show="!searchingHide">
            <div @click="handleChangeScene(item, index)" :class="['gridHeader-scene-item']"
                v-for="(item, index) in gridHeaderScene" :key="item.id" v-show="index <= splitSceneIndex" :style="{
                    color: sceneActive === index ? '#212930' : '#6C7D8F',
                    fontWeight: sceneActive === index ? 'bolder' : 'initial'
                }
                    ">
                <div :class="['sceneName', sceneActive === index ? 'gridHeader-scene-item-active' : '']"> {{ item.name }}
                </div>
            </div>
            <!-- 其他 -->
            <div v-show="splitSceneIndex && splitSceneIndex < 15 && query.category == 'flow'"
                :class="['gridHeader-scene-item']" @click.stop="showList(splitSceneIndex)">
                <div :class="['sceneName']"> 更多
                    <i :class="`iconfont ${userListIsShow ? 'icon-xiala-copy' : 'icon-xiala'}`" />
                </div>
            </div>
            <UserList v-if="userListIsShow" :team-list-offset="teamListOffset"
                :list="gridHeaderScene.slice(splitSceneIndex + 1)" :sceneActive="sceneActive"
                :splitSceneIndex="splitSceneIndex" @updateLastStatus="updateLastStatus" />
            <!-- <div class="gridHeader-scene-right" @click="toTemplateCommunity">
                <div style="width:max-content">去往模板社区</div>
            </div> -->
        </div>
        <!-- 模版卡片 最多80个 不做分页 -->
        <div class="cardListWarp" ref="cardListWarp">
            <TemplatePods ref="TemplatePodsCom" v-if="templatePods.length" :charts="templatePods" :keyword="keyword"
                :type="type" />
            <div class="wrap_no" v-if="noDataTip">
                <img src="@/assets/images/home/emptyFile.svg" alt="">
                <p style="color: #6C7D8F !important;">暂无相关内容</p>
            </div>
            <div class="footer" v-if="templatePods.length">
                <span>已经到底了</span>
            </div>
            <div v-if="empty">
                <div class="null null_file">
                    <img class="null_file_img" style="marginTop:-60px;" src="@/assets/images/home/emptyFile.svg" />
                    <p style="color: #6C7D8F !important;">暂无相关内容</p>
                </div>
            </div>
        </div>
        <!-- 模版预览 -->
    </div>
    <div v-if="showCategory" class="queryCategoryContent">
        <Category :query="query" @backToTemplate="backToTemplate" />
    </div>
    <GlobalDlg />
</template>
<script>
import TemplatePods from './templatePods.vue'
import Category from './category.vue'
import UserList from './userList.vue'
import PoSwitchSlider from './PoSwitchSlider.vue'
import { getTemplateList, getCategroy, getTemplateUsed } from './api/template.js'
import { TEPMLATE_SPECIAL_MAP, NAMEMAP } from './constants.js'
import { $observeEl } from './utils'
export default {
    name: 'tempCreate',
    components: {
        TemplatePods,
        UserList,
        PoSwitchSlider,
        Category
    },
    data() {
        return {
            empty: false,
            noOnline: false,
            showCategory: false,
            isDragging: false,
            canClick: false,
            templateView: true,
            searchTitle: '',
            query: {
                category: 'flow', // 类别
                keyword: '精选推荐' // 场景
            },
            gridSpecialList: [], // 大图
            gridHeaderScene: [], // 场景
            sceneActive: 0, // 当前场景索引
            templatePods: [], // 模板
            userListIsShow: false,
            teamListOffset: { // 下拉箭头 dropmune
                width: 100,
                height: 400,
                top: 0,
                left: 400
            },
            noDataTip: false,
            splitIndex: 0, //分割index 用作适配 780 1050 1440 三个区间的展示
            splitSceneIndex: 0, // 分割场景index 用作适配  780 1050 1440 三个区间的展示
            searchingHide: false // 搜索状态,
        }
    },
    created() {
        // 注册组件
        this.$addComponents("tempCreate", this)
        this.fetchCategory()


    },
    beforeRouteEnter(to, from, next) {
        console.log('beforeRouteEnter')
        if (from.name !== 'category') {
            next(vm => {
                vm.query = {
                    category: 'flow', // 类别
                    keyword: '精选推荐' // 场景
                }
                vm.fetchCategory()
                vm.$getComponents("categorySlide") && (vm.$getComponents("categorySlide").sliderItemActive = 1)
            })
        }
        next()

    },
    mounted() {
        let _this = this
        $('body').off('click').on('click', function (e) {
            _this.userListIsShow = false
        })
        $observeEl(this.$refs['gridHeader'], this.onResize)

        this.initScorll()
        console.log("mountedmounted")
        ipc.on('useTemplate', (e, info) => {
            this.$refs.TemplatePodsCom.handleCloneTemplate(JSON.parse(info), "dlg")
        })
    },
    computed: {
        type: function () {
            return NAMEMAP[this.query.category] || ''
        },
        keyword: function () {
            return this.query.keyword || ''
        }

    },
    beforeDestroy() {
        console.log('beforeDestroy')
        this.$unobserveEl(this.$refs['gridHeader'])
    },
    methods: {
        backToTemplate() {
            this.showCategory = false
        },
        initScorll() {
            const container = document.querySelector('.scrollable-container');
            const that = this
            let startX;
            let duringTime = 0

            const mousemoveFn = (e) => {
                if (!this.isDragging) return;
                const deltaX = e.clientX - startX;
                container.scrollLeft -= deltaX;
                startX = e.clientX;
            }

            container.addEventListener('mouseout', (e) => {
                that.gridSpecialList = that.gridSpecialList.map(item => {
                    return {
                        ...item,
                        isHover: false
                    }
                })
                container.removeEventListener('mousemove', mousemoveFn)
            });




            container.addEventListener('mousedown', (e) => {
                this.isDragging = true;
                startX = e.clientX;
                duringTime = new Date().getTime()
                container.addEventListener('mousemove', mousemoveFn);
            });


            container.addEventListener('wheel', (e) => {
                // 鼠标滚轮事件处理
                container.scrollLeft += e.deltaY;
                e.preventDefault(); // 阻止默认滚动行为
            });

            container.addEventListener('mouseup', (e) => {
                duringTime = new Date().getTime() - duringTime
                this.canClick = duringTime < 200
                container.removeEventListener('mousemove', mousemoveFn)
                e.stopPropagation();
                setTimeout(() => {
                    this.isDragging = false;
                }, 500);
            });



        },
        onResize() {
            // splitIndex 通过分割index 控制图类型、icon类型的展示
            const { innerWidth } = window
            if (!innerWidth) return

            if (innerWidth < 1050) {
                this.splitSceneIndex = 5
            }

            if (innerWidth >= 1050 && innerWidth < 1440) {
                this.splitSceneIndex = 10
            }

            if (innerWidth >= 1440) {
                this.splitSceneIndex = 18
            }
            if (innerWidth >= 1660) {
                this.splitSceneIndex = 18
            }
            console.log(this.splitSceneIndex)
        },
        handletoCategory(chart, index) {
            if (!this.canClick) {
                return
            }
            this.gridSpecialList[index].isHover = false;
            this.query = { ...chart, category: this.query.category }
            this.showCategory = true

        },
        gridHeaderMouseOver(index) {
            this.gridSpecialList[index].isHover = true;
        },
        gridHeaderMouseOut(index) {
            this.gridSpecialList[index].isHover = false;
        },
        fetchAll(index) {
            this.query.category = index ? (index === 1 ? 'flow' : 'mind') : 'history'
            this.fetchCategory()
            // this.sceneActive = index
        },
        reset() {
            this.gridSpecialList = []
            this.gridHeaderScene = []
            this.templatePods = []
            this.noDataTip = false
            this.sceneActive = 0
            this.query.keyword = this.gridHeaderScene[0] ? this.gridHeaderScene[0].name : '精选推荐'
            this.searchingHide = false
            this.searchTitle = ''
        },
        /**
         * @description 获取类别 大图、icon + 文字 + 场景
         * 切换类别一定fetchTemplate
         */
        fetchCategory() {
            let toast = new Toast('loading', $('.cardListWarp'));
            
            this.reset()
            if (this.query.category === 'history') {
                getTemplateUsed({ userId: localStorage.getItem('processon_userKey') }).then(res => {
                    if (res.code == '200') {
                        this.templatePods = res.data
                        if (!res.data.length) {
                            this.noDataTip = true
                        }
                    }
                })
            } else {
                this.mapCategory(TEPMLATE_SPECIAL_MAP[this.query.category])
                this.fetchTemplate()
            }

            toast && toast.closeAll();

            //  else {
            //     getCategroy({ category: this.query.category }).then(res => {
            //         if (res.code === '200') {
            //             this.mapCategory(res.data)
            //             this.fetchTemplate()
            //         }
            //     })
            // }

        },
        handleChangeScene(item, index) {
            this.sceneActive = index
            this.query = {
                ...this.query,
                keyword: item.name
            }
            // buried_point_fn('nomal', 'template_filter_function', {
            //     '场景': item.name,
            //     "当前页面": NAMEMAP[this.query.category]
            // })
            this.fetchTemplate()
        },
        mapSpecial(categorys = []) {
            const names = TEPMLATE_SPECIAL_MAP[this.query.category].map(item => item.name)
            this.gridSpecialList = categorys.map(item => {
                if (names.includes(item.name)) {
                    const { image = '', icon = '', image_hover = '' } = TEPMLATE_SPECIAL_MAP[this.query.category].find(items => items.name === item.name)

                    return {
                        ...item,
                        isHover: false,
                        image_hover,
                        image,
                        icon
                    }
                } else {
                    return null
                }
            }).filter(Boolean).sort((a, b) => a.position - b.position)
        },
        mapScene(scene = []) {
            this.gridHeaderScene = scene.length ? [...scene.sort((a, b) => a.position - b.position)] : []
            console.log(this.gridHeaderScene)
        },
        mapCategory(data) {
            // 有大图的
            this.mapSpecial(data.filter(item => item.type === 'special'))
            // 有icon+文字的
            // this.mapIconText(data.filter(item => item.type === 'special'))
            // 场景的
            this.mapScene(data.filter(item => item.type === 'scene'))
        },
        fetchTemplate() {
            if (!navigator.onLine) {
                this.noOnline = true
                return
                // this.empty = true
                // return
            }
            let params = {}
            if (this.searchingHide) {
                params = JSON.stringify({
                    category: this.query.category,
                    keyword: this.searchTitle
                })
            } else {
                params = JSON.stringify(this.query)
            }
            getTemplateList(params).then(res => {
                if (res.code === '200') {
                    // this.$loading({
                    //     type: 'close'
                    // })
                    this.templatePods = res.data.rows // 冻结 过滤掉单次付费
                    this.noDataTip = !res.data.rows.length


                    // 滚动到合适的位置
                    if ($('.gridHeader-scene').offset().top <= 64) {
                        const scrollDistance = $('.gridHeader').height() + $('.gridHeader-forText').height() + 29
                        document.querySelector('.tempateCreateGirdWarp').scrollTo({ top: scrollDistance, behavior: 'smooth' })
                    }
                }
            })
        },
        toTemplateCommunity() {
            let url = this.$fns.getHost('edit') + "/template?from=template_create"
            window.open(url)
        },
        // formateTemplateData(list){
        //     for(var i = 0; i < list.length; i++){
        //         if(list[i].thumbnail){
        //           list[i].allImagePath = this.$getThumb(list[i])
        //         }
        //     }
        //     return list
        // }
        showList(index) {
            const { offsetLeft } = document.querySelector(`.gridHeader-scene-item:nth-child(${index + 1})`)
            this.teamListOffset.left = offsetLeft
            this.teamListOffset.top = 37
            this.userListIsShow = true
        },
        updateLastStatus(item, index) {
            // console.log(11, item)
            console.log(index)
            // const temp = this.gridHeaderScene[this.splitSceneIndex]
            // this.gridHeaderScene[this.splitSceneIndex] = item
            // this.gridHeaderScene[index] = temp
            this.handleChangeScene(item, index)
            this.userListIsShow = false
        },
        checkClick(event) {
            console.log(event)
        }
    }
}
</script>
<style scoped>
.tempateCreateGirdWarp {
    height: calc(100vh - 84px);
    padding: 0px 32px 0px 32px;
    overflow-y: scroll;
}

.gridHeaderWrapper {
    padding: 0 1.23rem;
    margin-top: 1.85rem;
    background: linear-gradient(135deg, #e2eef7 0%, #eae2f7 100%);
    height: 10.15rem;
    border-radius: 0.92rem;
}

.gridHeader {
    opacity: 1;
    border-radius: 0.92rem;
    overflow: hidden;
    position: relative;
}

.gridHeader::-webkit-scrollbar {
    display: none;
}

.scrollContainer {
    width: max-content;
    /* 此容器宽度会根据内容自动调整 */
    white-space: nowrap;
    /* 防止内容换行 */
}


.headerImageItem {
    width: 16.46rem;
    height: 7.69rem;
    margin-right: 1.23rem;
    margin-top: 1.23rem;
    border-radius: 0.62rem;
    display: inline-block;
    background-size: cover;
    position: relative;
}

.headerImageItem:hover {
    transform: translateY(-2px);
    opacity: 0.8;
    transition: all .3s;
    animation: gradient 1s forwards;
}

.headerBg {
    width: 100%;
}

@keyframes gradient {
    0% {
        opacity: 0.5;
    }

    100% {
        opacity: 1;
    }
}


.gridHeader-forText {
    display: flex;
    flex-wrap: wrap;
    margin-top: 10px;

}

.gridHeader-forText-item {
    display: flex;
    height: 30px;
    border-radius: 4px;
    flex-wrap: nowrap;
    align-items: center;
    background: #ffffffff;
    padding: 0px 16px;
    margin-right: 12px;
    margin-bottom: 17px;
    justify-content: space-between;
}

.headerImageItemBg,
.headerImageItemBg_Hover {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    background-size: cover;
}

.headerImageItemBg_Hover {
    z-index: 3;
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
    margin-top: 2.46rem;
    align-items: center;
    position: sticky;
    top: 0px;
    z-index: 4;
    padding-bottom: 10px;
    background: #f6f7f8;

}

.gridHeader-scene-item {
    cursor: pointer;
    opacity: 1;
    margin-right: 1.23rem;
    text-align: center;
    color: #6C7D8F;
    font-size: 1rem;
    font-weight: 400;
    display: inline-block;
}

.sceneName {
    width: max-content;
}

.sceneName:hover {
    color: #212930;
}

.gridHeader-scene-item-active:hover {
    color: #212930;
}

.cardListWarp {
    margin-top: 24px;
    position: sticky;
    top: 20px;
    min-height: calc(100vh - 500px);
}

.gridHeader-scene-right {
    color: #067befff;
    font-size: 13px;
    font-weight: 400;
    margin-left: auto;
    cursor: pointer;
}

.footer {
    height: 40px;
    bottom: 0;
    text-align: center;
    display: flex;
    align-items: center;
    color: #6c7d8fff;
    font-size: 13px;
    margin: 30px;
    justify-content: center;
}

.gridHeader-scene-bottom {
    margin-left: 0;
}

.gridHeader-scene-bottom:hover,
.gridHeader-scene-right:hover {
    color: #1F88F1
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



.gridHeader-forText-wrap {
    color: #6C7D8F;
}

.gridHeader-forText-wrap:hover {
    transform: translateY(-2px);
    transition: all .3s;
    color: #212930ff
}

.wrap_no img {
    width: 100%;
}

.wrap_no p {
    margin: 0;
    text-align: left;
}

.templateCreateMask {
    width: 100%;
    position: fixed;
    top: 0;
    height: 108px;
    z-index: 3;
    overflow: hidden;
}
</style>