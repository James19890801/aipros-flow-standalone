import './inject.js'
function loadCss(url, target = window){
  return new Promise(function(resolve, reject){
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.onload = function() {
      resolve();
    };
    link.onerror = function() {
      reject()
    };
    link.href = url;
    target.document.head.appendChild(link);
  }) 
}
// 加载js
function loadScript(url, target = window) {
  return new Promise(function(resolve, reject){
    var script = document.createElement("script");
      script.type = "text/javascript";
      script.onload = function() {
        resolve();
      };
      script.onerror = function(err) {
        console.log(err)
        reject()
      };
      script.src = url;
      target.document.head.appendChild(script);
  }) 
}

async function load(cb){
  await loadScript('./../markdown-editor/share-resource/static/aiShpae/smart-editor.min.js')
  await loadScript('./../markdown-editor/share-resource/static/aiShpae/smart-editor-base-toolbar.min.js')
  await loadScript('./../markdown-editor/markdownEditor.js')
  await loadCss('./../markdown-editor/assets/css/markdownEditor.css')
  cb && cb()
}

load(function(){
  window.fileType = 'markdown'
  editorGlobalConfig.readOnly = false
  editorGlobalConfig.mindmapCSSPath = './../v5_editor/source/compile/mindmap/assets/css/view.css'
  editorGlobalConfig.mindmapJSVendorsPath = './../v5_editor/source/compile/mindmap/vendors.js'
  editorGlobalConfig.mindmapJSPath = './../v5_editor/source/compile/mindmap/view.js'
  editorGlobalConfig.mindmapCommonJSPath = './../v5_editor/source/compile/mindmap/common.js'
  if(window.location.href.indexOf('action=down') === -1){
      editorGlobalConfig.markdownShowMode = 'wysiwyg'
  }
  
  window.PoEditorClient =  new window.MarkdownEditor(editorGlobalConfig)

  // markdown宣传页面跳转
  const markdownClickName = localStorage.getItem('markdown-click-name')
  if(markdownClickName) {
      const interval = setInterval(() => {
          if($('.po-global-loading-wrap').css('display') === 'none') {
              $('.toolbar .normal .item').each(function(){
                  if($(this).find('.desc').html() === markdownClickName){
                      $(this).trigger('click')
                      clearInterval(interval)
                      localStorage.removeItem('markdown-click-name')
                  }
                })
          }
      }, 300)
  }
})

