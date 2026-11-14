const map = new WeakMap()
const ob = new ResizeObserver((entries) => {
    for (const entry of entries) {
        const handler = map.get(entry.target)
        /**
         * @description 可以拿到当前dom的位置信息
         * width:inlineSzie
         * height:box.blockSize
         * 
         * const box = entry.borderBoxSize[0]
         * 
         */
        if (handler) {
            handler()
        }
    }
})

export const $observeEl = function (el, binding) {
    ob.observe(el)
    map.set(el, binding)
}

export const $unobserveEl = function (el) {
    ob.unobserve(el)
    map.delete(el)
}