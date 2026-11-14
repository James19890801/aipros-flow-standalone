var Api = {
    ajax(url, params, succCb, errCb, completeCb, options){
        options = options || {};
        var defaultOptions = {
              data: params,
              success: function(data){
                 succCb && succCb(data)
              },
              error: function(data){
                 errCb && errCb(data);
              },
              complete: function(XMLHttpRequest, status){
                 completeCb && completeCb(XMLHttpRequest, status);
              }
          }
          options = {...defaultOptions, ...options}
          poAjax(options, url);
    },
    getApiLists(apiUrls){
       var apiLists = {}
       for(var i in apiUrls){
            let options = {}
            if(i == 'uploadImageForm' || i == 'uploadAtta'){
                options = { contentType: false,processData: false}
            }else if(i == 'getSliders' || i == 'getHistory'  || i == 'delTheme' || i == 'getCustomTheme' || i == 'getAIUseInfo' || i == 'updateTitle' || i == 'removeImg' || i == 'getWaterMark'){
                options = {type:"get"}
            }else if(i == 'saveVersion' || i == 'updateDef'){
                options = {contentType:'application/json'}
            }else if(i == 'getHistorys'){
                options = { cache: false, contentType : 'application/json'}
            }else if(i == 'removeHistory' || i == 'sendMsg'){
                options = { cache:false}
            }else if(i == 'getTheme'){
                options = { noToken:true, type:"get"}
            }else if(i == 'saveCustomTheme'){
               options = { noJump:true}
            }else if(i == 'uploadSVGForm'){
               options = { contentType: false,processData: false, timeout : 1000 * 60}
            }

            if(i == 'schema' || i == 'getMyshapes' || i == 'logout'){
               options = {type:"get"}
            }else if(i == 'getEmbedPages'){
                options = {type:"get", noToken: true,headers: {token: ""}}
            }
            (function(key){
               apiLists[key] = function(params, succCb, errCb, completeCb){
                   Api.ajax(key, params, succCb, errCb, completeCb, options )
               }
            })(i)
        }
        return apiLists
    }
}
window.serverApi = Api.getApiLists(poApi)
