/**
 * Created by zhangy on 16/10/8.
 */
var pcBigPipe = {
	jsVersion:"",
	cssVersion:"",
	//页面初始化
	count: 0,
	//计算加载的js数量
	jsCounter:0,
	//构建web js和css
	render:function(data, callback){
		//初始化全局js和css版本
		var scripts = document.getElementsByTagName("script");
		var links = document.getElementsByTagName("link");
		for(var i = 0; i < scripts.length; i++){
			var script = scripts[i], src = script.getAttribute("src");
			if(src && src.indexOf("/assets/js/") >= 0){
				if(src.indexOf("-") < 0){
					break;
				}
				var v = src.substring(src.indexOf("-"), src.indexOf(".js"));
				pcBigPipe.jsVersion = v;
				break;
			}
		}
		for(var i = 0; i < links.length; i++){
			var link = links[i], src = link.getAttribute("href");
			if(src && src.indexOf("/assets/css/") >= 0){
				if(src.indexOf("-") < 0){
					break;
				}
				var v = src.substring(src.indexOf("-"), src.indexOf(".css"));
				pcBigPipe.cssVersion = v;
				break;
			}
		}
		var css = data.css || [], js = data.js || [];
		this.jsCounter = js.length;
		for(var i = 0; i < css.length; i++){
			var cssHref = css[i];
			if(!data.notReplace) cssHref = cssHref.replace("/css/", "/css/web/");
			this.renderCss(cssHref);
		}
		if(!data.pc)
			for(var i = 0,jslen = js.length; i < jslen; i++){
				var jsSrc = js[i];
				if(!data.notReplace) jsSrc = jsSrc.replace("/js/", "/js/web/");
				this.renderJs(jsSrc, callback);
			}
		else this.renderAwaitJs(js, callback, 0);
	},
	renderCss:function(url){
		var doc = document, remoteUrl = this.cssVersion;
		var link = doc.createElement("link");
		link.setAttribute("rel", "stylesheet");
	    link.setAttribute("type", "text/css");
	    if(url.indexOf("http") >= 0){
	    	remoteUrl = "";
	    }
	    url = url.replace(".css", remoteUrl + ".css");
	    link.setAttribute("href", __dirname + url);
		var heads = doc.getElementsByTagName("head");
		if(heads.length){
			heads[0].appendChild(link);
		}else{
			doc.documentElement.appendChild(link);
		}
	},
	renderJs:function(url,callback){
		var doc = document, remoteUrl = this.jsVersion;
		var js = doc.createElement("script");
		if(url.indexOf("http") >= 0){
	    	remoteUrl = "";
	    }
	    if(url.indexOf("/plug_in/") > -1) js.setAttribute("type", "module");
	    else js.setAttribute("type", "text/javascript");
	    url = url.replace(".js", remoteUrl + ".js");
	    js.setAttribute("src", __dirname + url);
	    js.setAttribute("charset", "UTF-8");
		doc.body.appendChild(js);
		js.onload = function(){
			pcBigPipe.count++;
			pcBigPipe.handle(callback)
		}
	},
	renderAwaitJs:function(urls, callback=()=>{}, i){
		if(i < urls.length) {
			var doc = document, remoteUrl = this.jsVersion;
			var js = doc.createElement("script");
			var url = urls[i];
			if(url.indexOf("http") >= 0){
				remoteUrl = "";
			}
			if(url.indexOf("/plug_in/") > -1) js.setAttribute("type", "module");
			else js.setAttribute("type", "text/javascript");
			url = url.replace(".js", remoteUrl + ".js");
			js.setAttribute("src", __dirname + url);
			js.setAttribute("charset", "UTF-8");
			doc.body.appendChild(js);
			js.onload = function(){
				pcBigPipe.renderAwaitJs(urls, callback, ++i);
			}
		}
		else callback();
	},
	//回调处理
	handle:function(callback){
		if(this.count == this.jsCounter){
			if(callback != null){
				callback();
			}
			this.count = 0;
			this.jsCounter = 0;
		}
	},
	//防刷
	init:function(){
		var isMoved = false;
		$(document).off("mousemove.ck").on("mousemove.ck", function(){
			if(isMoved){
				return;
			}
			$.get("/popular/init");
			isMoved = true;
		})
	}
};