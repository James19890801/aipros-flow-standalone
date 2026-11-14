$('#back2home').remove()
// $('.node-title.outline-title').remove()
$('.ol-icons[title="撤销"]').css('margin-left','10px')
$('.outline-item[type="fmind"]').remove()
// $('.op-context-menu li[op="flow"]').remove()
// $('.op-context-menu li[op="mind"]').remove()
$('.ol-icons.text').removeClass('text')
$('.node-title.outline-title').css('opacity', 0.5)

setTimeout(() => {
  $('.po-aigc-list-content .text').css('padding','0px')
}, 2000);


// const targetNode = document.documentElement
// const config = { childList: true, subtree: true }
// const observer = new MutationObserver((mutationsList) => {
//   for (const mutation of mutationsList) {
//     const addedNodes = mutation.addedNodes
//     for (const node of addedNodes) {
//       if (node.nodeType === 1) {
//         console.log(node)
//         if($(node).is('li[op=flow]')){
//           $(node).remove()
//         }
//         if($(node).is('li[op=mind]')){
//           $(node).remove()
//         }
//       }
//     }
//   }
// })
// observer.observe(targetNode, config)