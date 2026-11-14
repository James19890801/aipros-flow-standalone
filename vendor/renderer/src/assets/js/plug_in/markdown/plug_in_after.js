window.injectExtraAsynCall = function(injectName, params, callback) {

    if(window.editorGlobalConfig && typeof window.editorGlobalConfig[injectName] == "function") {
        window.editorGlobalConfig[injectName](params, function(...params){
            callback(...params); //支持回调函数使用多个参数
        });
    }else if(window.editorGlobalConfig && typeof window.editorGlobalConfig[injectName] != "undefined"){
        return window.editorGlobalConfig[injectName]
    }else {
        if(callback){
            callback(params);
        }
    }
};

function scrollMarkdownContainerTo(el) {
  var container = document.querySelector('.pomd.wysiwyg-mode .container') || document.querySelector('.pomd .container');
  if (!container || !el) return;
  var top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
  top = Math.max(0, top);
  if (typeof container.scrollTo === 'function') {
    container.scrollTo({ top: top, behavior: 'smooth' });
  } else {
    container.scrollTop = top;
  }
  window.scrollTo(0, 0);
}

(function () {
  var nativeScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (arg) {
    var container = this.closest('.container');
    if (container && container.closest('.pomd') && container.querySelector('.ProseMirror')) {
      scrollMarkdownContainerTo(this);
      return;
    }
    return nativeScrollIntoView.call(this, arg);
  };
})();

$(function () {
  var hideIndexMenu = function () {
    ipc.sendToHost('hideTabMore')
  }
  $('body').on('click', hideIndexMenu)
  window.addEventListener('message',(e)=>{
    if(e.data == 'mind_mouseup'){
        hideIndexMenu()
    }
  })
  $(document).on('click', '.dir-tree-item', function (e) {
    if ($(e.target).closest('.dir-arrow').length) return;
    var text = $(this).find('.dir-item-text').text().trim();
    if (!text) return;
    setTimeout(function () {
      var container = document.querySelector('.pomd.wysiwyg-mode .container') || document.querySelector('.pomd .container');
      if (!container) return;
      var headings = container.querySelectorAll('.ProseMirror h1,.ProseMirror h2,.ProseMirror h3,.ProseMirror h4,.ProseMirror h5,.ProseMirror h6');
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].textContent.trim() === text) {
          scrollMarkdownContainerTo(headings[i]);
          break;
        }
      }
    }, 0);
  })
})
