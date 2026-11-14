var minder = {}, info={}, Import = {}, File = {};
minder.isArray = function(arr) {
	return Object.prototype.toString.call(arr) === "[object Array]";
};
minder.newId = function(){
	function S4() {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	}
	return (S4()+S4()+""+S4()+""+S4()+""+S4());
};
minder.onerr = function(msg){
	$("#import_btn").html("<@i18n resource='user.import.add'/>");
	$("#share_upload_form .upload-contents").attr("for", "share_doc_input");
	$("#dlg_import .des-list").append("<span style='margin-right:10px;margin-top:14px;float:right;color:red'>" + msg + "</span>");
}
//获取文件信息
Import.getFile = function(file){
	File.local = file.name;
	File.extension = File.local.substr( File.local.lastIndexOf(".") );
	File.name = File.local.substr(0, File.local.lastIndexOf(".") );
};
//加载文件内容
Import.loadFile = function(file){
	$("#import_btn").html("<@i18n resource='user.import.upload'/>");
	$("#share_upload_form .upload-contents").attr("for", "");
	info.category = "mind";
	info.folder = $(".dir a:last").attr("folderid");
	try {
		info.team_id = team.teamId;
	} catch(e) {
		info.teamId = "";
	}
	Import.getFile( file );
	info.file_name = File.name;

	var type = File.extension;
	for(var i in Import) {
		if( Import[i].fileExtension == type ) {
			info.file_type = Import[i].fileDescription;
			if( Import[i].dataType == "blob" ) {
				//获取xml转json并上传
				var im = Import[i];
				im.getEntries(file).then(im.readDocument)
				.then(function(data) {
					info.content = JSON.stringify(data);
					minder.importJson();
				});
			}
			else if(Import[i].dataType == "txt" ){
				var reader = new FileReader();
				reader.onload = function(file) {
					//读取完成后执行
					var txt = this.result;
					var im = Import[i];
					var result = im.getEntries(txt);
					info.content = JSON.stringify(result);
					minder.importJson();
				};
				//异步读取
				reader.readAsText(file, "utf-8");
			}
			else if(Import[i].dataType == "pos"){
				var reader = new FileReader();
				reader.onload = function(file) {
					//读取完成后执行
					var txt = this.result;
					var im = Import[i];
					var result = im.getEntries(txt);
					if(typeof result == "string" && result == ""){
						minder.onerr("<@i18n resource='user.import.not1'/>");
						return;
					}
					if(typeof result == "object" && result.category != "mind"){
						info.category = result.category;
					}
					info.content = JSON.stringify(result.def);
					minder.importJson();
				};
				//异步读取
				reader.readAsText(file, "utf-8");
			}
			else if(Import[i].dataType == "visio") {
				$("#name_input").val(info.file_name);
				$("#team_input").val(info.team_id);
				$("#folder_input").val(info.folder);
				$("#type_input").val(type);
				$("#share_upload_form").submit();
				return;
			}
			return ;
		}
	}
	minder.onerr("<@i18n resource='user.import.not1'/>");
};
minder.importJson = function(){
	var form = document.createElement("form");
	form.setAttribute("action", "/import");
	form.setAttribute("method", "POST");
	form.appendChild(field("file_name", info.file_name));
	form.appendChild(field("file_type", info.file_type));
	form.appendChild(field("def", encodeURIComponent(info.content)));
	form.appendChild(field("team_id", info.team_id));
	form.appendChild(field("folder", ""));
	form.appendChild(field("category", 'outline'));
	form.appendChild(field("outline", "outline"));

	document.body.appendChild(form);
	form.submit();
	document.body.removeChild(form);

	function field(name, content) {
		var input = document.createElement('input');
		input.type = 'hidden';
		input.name = name;
		input.value = content;
		return input;
	}
};

/**
 * file_name：文件名
 * file_type：导入文件类型
 * content：全名
 * team_id：文件类型
 * folder：文件名
 * category：全名
 */
info = {
	file_name: "",
	file_type: "",
	content: "",
	team_id: "",
	folder: "",
	category: ""
};

/**
 * extension：文件类型
 * name：文件名
 * local：全名
 * @type {Object}
 */
File = {
	extension: "",
	name: "",
	local: ""
}
var HtmlUtil = {
    /*1.用浏览器内部转换器实现html转码*/
    htmlEncode:function (html){
        //1.首先动态创建一个容器标签元素，如DIV
        var temp = document.createElement ("div");
        //2.然后将要转换的字符串设置为这个元素的innerText(ie支持)或者textContent(火狐，google支持)
        (temp.textContent != undefined ) ? (temp.textContent = html) : (temp.innerText = html);
        //3.最后返回这个元素的innerHTML，即得到经过HTML编码转换的字符串了
        var output = temp.innerHTML;
        temp = null;
        return output;
    }
};

/**
 * pos 文件导入
 */
Import.pos = (function() {
	/**
	 * 默认定义
	 */
	var def = {
		"background" : "",
		"lines" : {},
		"theme" : "default",
		"leftChildren": []
	};
	/**
	 * 将文本解析成思维导图
	 */
	function processTopic(txt) {
		var defStr = JSON.parse(txt);
		var elements = defStr.diagram.elements;
		//脑图文件
		if(elements != null && elements.id == "root"){
			return {
				category:"mind",
				def:elements
			};
		}else if(elements != null){
			var category = defStr.meta.diagramInfo.category;
			return {
				category:category,
				def:elements
			};
		}else{
			return "";
		}
	}

	return {
		fileDescription: 'pos',
		fileExtension: '.pos',
		dataType: 'pos',
		getEntries : function(result) {
			return processTopic(result);
		}
	};
})();
Import.xmind = (function() {
	// 标签 map
	var markerMap = {
		"priority-1": ["priority", 0],
		"priority-2": ["priority", 1],
		"priority-3": ["priority", 2],
		"priority-4": ["priority", 3],
		"priority-5": ["priority", 4],
		"priority-6": ["priority", 5],
		"priority-7": ["priority", 6],
		"priority-8": ["priority", 7],
		"priority-9": ["priority", 8],

		"task-start": ["completion", 18],
		"task-oct": ["completion", 19],
		"task-quarter": ["completion", 20],
		"task-3oct": ["completion", 21],
		"task-half": ["completion", 22],
		"task-5oct": ["completion", 23],
		"task-3quar": ["completion", 24],
		"task-7oct": ["completion", 25],
		"task-done": ["completion", 26]
	};
	var def = {
		"structure" : "mind_free",
		"background" : "",
		"lines" : {},
		"theme" : "default","leftChildren": []
	};

	function processTopic(topic, obj, pid) {
		//处理文本
		obj.id = minder.newId();
		if( pid === "" && def && obj ) {
			obj.id = "root";
			var type = "";
			for (var i in def) {
				type = def[i];
				if (type) obj[i] = type;
			}
			obj.title = topic.title|| "<@i18n resource='mind.centertopic'/>";
		}
		else {
			obj.parent = pid;
			obj.title = topic.title|| "<@i18n resource='mind.fenzhitopic'/>";
		}
		obj.title = HtmlUtil.htmlEncode(obj.title);//转义特殊字符
		// 处理标签
		if (topic.marker_refs && topic.marker_refs.marker_ref) {
			var markers = topic.marker_refs.marker_ref;
			type = "";
			obj.icons = [];
			if (markers.length && markers.length > 0) {
				for (var i in markers) {
					type = markerMap[markers[i].marker_id];
					if (type) obj.icons.push( {index: type[1], name: type[0]} );
				}
			} else {
				type = markerMap[markers.marker_id];
				if (type) obj.icons.push( {index: type[1], name: type[0]} );
			}
		}
		// 处理超链接
		if (topic['xlink:href']) {
			type = "";
			if( topic['xlink:href'].substr(0, 4) == "http" )
				type = "url";
			if( type ) obj.link = { value: topic['xlink:href'], type: type };
		}
		// 处理Tag
		if(topic.labels && topic.labels.label) {
			obj.tag = topic.labels.label;
		}
		// 处理Note
		if(topic.notes && topic.notes.plain) {
			obj.note = topic.notes.plain;
		}
		//处理子节点
		var topics = topic.children && topic.children.topics;
		var subTopics = topics && (topics.topic || topics[0] && topics[0].topic);
		obj.children = [];
		if (subTopics) {
			var tmp = subTopics;
			if (tmp.length && tmp.length > 0) { //多个子节点
				for (var i in tmp) {
					if(typeof tmp[i] != "object")
						continue;
					obj.children.push({});
					processTopic(tmp[i], obj.children[i], obj.id);
				}
			} else { //一个子节点
				if(typeof tmp != "object")
					return;
				obj.children = [{}];
				processTopic(tmp, obj.children[0], obj.id);
			}
		}
	}

	function xml2pos(xml) {
		var json = $.xml2json(xml);
		var result = {};
		var sheet = json.sheet;
		var topic = minder.isArray(sheet) ? sheet[0].topic : sheet.topic;
		processTopic(topic, result, "");
		return result;
	}

	return {
		fileDescription: 'XMind',
		fileExtension: '.xmind',
		dataType: 'blob',
		getEntries : function(file) {
			return new Promise(function(resolve, reject){
				var im = this;
				zip.createReader(new zip.BlobReader(file), function(zipReader) {
					zipReader.getEntries(resolve);
				}, minder.onerr);
			});
		},
		readDocument : function(entries) {
			return new Promise(function(resolve, reject){
				var entry, json;

				// 查找文档入口
				while ((entry = entries.pop())) {
					if (entry.filename.split('/').pop() == 'content.xml') break;
					entry = null;
				}
				// 找到了读取数据
				if (entry) {
					entry.getData(new zip.TextWriter(), function(text) {
						json = xml2pos(text);
						resolve(json);
					});
				}
				// 找不到返回失败
				else {
					minder.onerr("<@i18n resource='user.import.not2'/>");
				}
			});
		}
	};
})();
Import.mindmanager = (function() {
	// 标签 map
	var markerMap = {
		"urn:mindjet:Prio1": ["priority", 1],
		"urn:mindjet:Prio2": ["priority", 2],
		"urn:mindjet:Prio3": ["priority", 3],
		"urn:mindjet:Prio4": ["priority", 4],
		"urn:mindjet:Prio5": ["priority", 5],

		"0": ["completion", 18],
		"25": ["completion", 20],
		"50": ["completion", 22],
		"75": ["completion", 24],
		"100": ["completion", 26]
	};
	var def = {
		"structure" : "mind_free",
		"background" : "",
		"lines" : {},
		"theme" : "default","leftChildren": []
	};

	function processTopic(topic, obj, pid) {
		//处理文本
		obj.id = minder.newId();
		if( pid === "" && def && obj ) {
			obj.id = "root";
			var type = "";
			for (var i in def) {
				type = def[i];
				if (type) obj[i] = type;
			}
			obj.title = topic.Text && topic.Text.PlainText || "<@i18n resource='mind.centertopic'/>";
		}
		else {
			obj.parent = pid;
			obj.title = topic.Text && topic.Text.PlainText || "<@i18n resource='mind.fenzhitopic'/>";
		}

		// 处理标签
		if (topic.Task) {
			type = "";
			obj.icons = [];
			if (topic.Task.TaskPriority) {
				type = markerMap[topic.Task.TaskPriority];
				if (type) obj.icons.push( {index: type[1], name: type[0]} );
			}

			if (topic.Task.TaskPercentage) {
				type = markerMap[topic.Task.TaskPercentage];
				if (type) obj.icons.push( {index: type[1], name: type[0]} );
			}
		}
		// 处理超链接
		if (topic.Hyperlink) {
			obj.link = { value: topic.Hyperlink.Url, type:"url" };
		}
		// 处理Tag
		if(topic.TextLabels && topic.TextLabels.TextLabel) {
			var tmp = topic.TextLabels.TextLabel;
			var tags = [];
			if (tmp.length && tmp.length > 0) { //多个子节点
				for (var i in tmp) {
					type = tmp[i].TextLabelName;
					if(type) tags.push( tmp[i].TextLabelName );
				}
			} else { //一个子节点
				type = tmp.TextLabelName;
				if(type) tags.push( tmp.TextLabelName );
			}
			obj.tag = tags.join(",");
		}
		// 处理Note
		if(topic.NotesGroup && topic.NotesGroup.NotesXhtmlData) {
			obj.note = topic.NotesGroup.NotesXhtmlData.PreviewPlainText;
		}
		//处理子节点
		obj.children = [];
		if (topic.SubTopics && topic.SubTopics.Topic) {
			var tmp = topic.SubTopics.Topic;
			if (tmp.length && tmp.length > 0) { //多个子节点
				for (var i in tmp) {
					if(typeof tmp[i] != "object")
						continue;
					obj.children.push({});
					processTopic(tmp[i], obj.children[i], obj.id);
				}
			} else { //一个子节点
				if(typeof tmp != "object")
					return;
				obj.children = [{}];
				processTopic(tmp, obj.children[0], obj.id);
			}
		}
	}
	function xml2pos(xml) {
		var json = $.xml2json(xml);
		var result = {};
		var topic = json.OneTopic.Topic;
		processTopic(topic, result, "");
		return result;
	}

	return {
		fileDescription: 'MindManager',
		fileExtension: '.mmap',
		dataType: 'blob',
		getEntries : function(file) {
			return new Promise(function(resolve, reject){
				var im = this;
				zip.createReader(new zip.BlobReader(file), function(zipReader) {
					zipReader.getEntries(resolve);
				}, minder.onerr);
			});
		},
		readDocument : function(entries) {
			return new Promise(function(resolve, reject){
				var entry, json;
				// 查找文档入口
				while ((entry = entries.pop())) {
					if (entry.filename.split('/').pop() == 'Document.xml') break;
					entry = null;
				}
				// 找到了读取数据
				if (entry) {
					entry.getData(new zip.TextWriter(), function(text) {
						var json = xml2pos(text);
						resolve(json);
					});
				}
				// 找不到返回失败
				else {
					minder.onerr("<@i18n resource='user.import.not2'/>");
				}
			});
		}
	};
})();
Import.freemind = (function() {
	// 标签 map
	var markerMap = {
		"full-1": ["priority", 0],
		"full-2": ["priority", 1],
		"full-3": ["priority", 2],
		"full-4": ["priority", 3],
		"full-5": ["priority", 4],
		"full-6": ["priority", 5],
		"full-7": ["priority", 6],
		"full-8": ["priority", 7]
	};
	var def = {
		"structure" : "mind_free",
		"background" : "",
		"lines" : {},
		"theme" : "default",
		"leftChildren": []
	};

	function processTopic(topic, obj, pid) {
		//处理文本
		obj.id = minder.newId();
		if( pid === "" && def && obj ) {
			obj.id = "root";
			var type = "";
			for (var i in def) {
				type = def[i];
				if (type) obj[i] = type;
			}
			obj.title = topic.TEXT || "<@i18n resource='mind.centertopic'/>";
		}
		else {
			obj.parent = pid;
			obj.title = topic.TEXT || "<@i18n resource='mind.fenzhitopic'/>";
		}

		// 处理标签
		if (topic.icon) {
			obj.icons = [];
			var icons = topic.icon;
			type = "";
			if (icons.length && icons.length > 0) {
				for (i in icons) {
					type = markerMap[icons[i].BUILTIN];
					if (type) obj.icons.push( {index: type[1], name: type[0]} );
				}
			} else {
				type = markerMap[icons.BUILTIN];
				if (type) obj.icons.push( {index: type[1], name: type[0]} );
			}
		}
		// 处理超链接
		if (topic.LINK) {
			obj.link = { value: topic.LINK, type:"url" };
		}
		//处理子节点
		obj.children = [];
		if (topic.node) {
			var tmp = topic.node;
			if (tmp.length && tmp.length > 0) { //多个子节点

				for (i in tmp) {
					if(typeof tmp[i] != "object")
						continue;
					obj.children.push({});
					processTopic(tmp[i], obj.children[i], obj.id);
				}
			} else { //一个子节点
				if(typeof tmp != "object")
					return;
				obj.children = [{}];
				processTopic(tmp, obj.children[0], obj.id);
			}
		}
	}
	function xml2pos(xml) {
		var json = $.xml2json(xml);
		var result = {};
		var node = json.node;
		processTopic(node, result, "");
		return result;
	}

	return {
		fileDescription: 'FreeMind',
		fileExtension: '.mm',
		dataType: 'txt',
		getEntries : function(xml) {
			return xml2pos(xml);
		}
	};
})();
Import.kityminder = (function() {
	// 标签 map
	var def = {
		"structure" : "mind_free",
		"background" : "",
		"lines" : {},
		"theme" : "default",
		leftChildren: []
	};

	function processTopic(topic, obj, pid) {
		//处理文本
		obj.id = minder.newId();
		if( pid === "" && def && obj ) {
			obj.id = "root";
			var type = "";
			for (var i in def) {
				type = def[i];
				if (type) obj[i] = type;
			}
			obj.title = topic.data.text || "<@i18n resource='mind.centertopic'/>";
		}
		else {
			obj.parent = pid;
			obj.title = topic.data.text || "<@i18n resource='mind.fenzhitopic'/>";
		}

		// 处理标签
		if (topic.data.priority || topic.data.progress) {
			obj.icons = [];
			if (topic.data.priority)
				obj.icons.push( {index: topic.data.priority - 1, name: "priority"} );

			if (topic.data.progress)
				obj.icons.push( {index: topic.data.progress + 16, name: "completion"} );
		}
		// 处理超链接
		if (topic.data.hyperlink) {
			obj.link = { value: topic.data.hyperlink, type:"url" };
		}
		//处理子节点
		obj.children = [];
		if (topic.children) {
			var tmp = topic.children;
			if (tmp.length) { //多个子节点
				for (var i in tmp) {
					if(typeof tmp[i] != "object")
						return;
					obj.children.push({});
					processTopic(tmp[i], obj.children[i], obj.id);
				}
			// } else { //一个子节点
			// 	if(typeof tmp != "object")
			// 		return;
			// 	obj.children = [{}];
			// 	processTopic(tmp, obj.children[0], obj.id);
			}
		}
	}
	function json2pos(json) {
		var result = {};
		processTopic(json.root, result, "");
		return result;
	}

	return {
		fileDescription: 'KityMinder',
		fileExtension: '.km',
		dataType: 'txt',
		getEntries : function(json) {
			return json2pos(JSON.parse(json));
		}
	};
})();

Import.txt = (function() {
	/**
	 * 默认定义
	 */
	var def = {
		"background" : "",
		"lines" : {},
		"theme" : "default",
		"leftChildren": []
	};

	var plaintext = {};
	/**
	 * 将文本内容转换成思维导图数据对象
	 */
	plaintext.from = function(data) {
		//分割换行
		var lines = data.split("\n").filter(function(line) {
//			console.log(line.match(/\S/));
			return line.match(/\S/);
		});
		var items = plaintext._parseItems(lines);
		//如果只有一个缩进，说明有中心主题
		if (items.length == 1) {
			var result = items[0];
		} else {
			//有多个没有缩进的主题，默认为分支主题
			var result = {
				title: "中心主题",
				children: items
			}
		}
		result.id = "root";
		result.structure = "mind_free";
		return result;
	}
	/**
	 * 将每行数据转义
	 */
	plaintext._parseItems = function(lines) {
		var items = [];
		if (!lines.length) {
			return items;
		}
		//记录第一行数据的空格
		var firstPrefix = plaintext._parsePrefix(lines[0]);
		var currentItem = null;
		var childLines = [];
		/* finalize a block of sub-children by converting them to items and appending */
		var convertChildLinesToChildren = function() {
			if (!currentItem || !childLines.length) {
				return;
			}
			var children = plaintext._parseItems(childLines);
			if (children.length) {
				currentItem.children = children;
			}
			childLines = [];
		}
		/**
		 * 遍历所有行
		 */
		lines.forEach(function(line, index) {
			//与第一行数据缩进量相同，可以视为同级父主题
			if (plaintext._parsePrefix(line) == firstPrefix) {
				convertChildLinesToChildren.call(this);
				currentItem = {title : line.match(/^\s*(.*)/)[1]};
				items.push(currentItem);
			} else {
				/* prepare as a future child */
				childLines.push(line);
			}
		}, this);
		convertChildLinesToChildren.call(this);
		return items;
	}

	//获取空格
	plaintext._parsePrefix = function(line) {
		return line.match(/^\s*/)[0];
	}
	/**
	 * 将转义的对象转成processon专用的对象
	 */
	plaintext._changeToTopic = function(obj, parentId){
		if(obj.id == "root"){
			obj = $.extend(obj, def);
		}else{
			obj.id = minder.newId();
			obj.parent = parentId;
			obj.collapsed = false;
		}
		var children = obj.children;
		if(children && children.length > 0){
			$.each(children, function(i, child){
				plaintext._changeToTopic(child, obj.id);
			});
		}else{
			obj.children = [];
		}
	}
	/**
	 * 将文本解析成思维导图
	 */
	function processTopic(txt) {
		var result = plaintext.from(txt);
		plaintext._changeToTopic(result);
		return result;
	}

	return {
		fileDescription: 'Text',
		fileExtension: '.txt',
		dataType: 'txt',
		getEntries : function(result) {
			return processTopic(result);
		}
	};
})();

Import.opml = (function() {
	// 标签 map
	var markerMap = {
		"full-1": ["priority", 0],
		"full-2": ["priority", 1],
		"full-3": ["priority", 2],
		"full-4": ["priority", 3],
		"full-5": ["priority", 4],
		"full-6": ["priority", 5],
		"full-7": ["priority", 6],
		"full-8": ["priority", 7]
	};
	var def = {
		"background" : "",
		"lines" : {},
		"theme" : "default",
		"leftChildren": []
	};
	/**
	 * 将转义的对象转成processon专用的对象
	 */
	var plaintext = {};
	plaintext._changeToTopic = function(obj, parentId){
		if(obj.id == "root"){
			obj = $.extend(obj, def);
		}else{
			obj.id = minder.newId();
			obj.title = (obj.text[0] || "").replace(/ /g, '&nbsp;');
			delete  obj.text;
			obj.parent = parentId;
			if(obj.image){
				var imgobj = decodeURI(obj.image);
				if(typeof imgobj == 'string'){
					imgobj = JSON.parse(imgobj);
				}
				obj.image = imgobj;
			}
			obj.collapsed = false;
		}
		obj.children = [];
		if(obj.outline){
			if(obj.outline instanceof Array){
				var len = obj.outline.length;
				if(len > 0){
					for(var i = 0; i < len; i++){
						obj.children.push(obj.outline[i]);
					}
				}
			}else{
				obj.children.push(obj.outline);
			}
			delete obj.outline;
		}
		var children = obj.children;
		if(children && children.length > 0){
			$.each(children, function(i, child){
				plaintext._changeToTopic(child, obj.id);
			});
		}
	};
	function xml2pos(xml) {
		var json = $.xml2json(xml);
		var result = $.extend(true, {}, json.body);
		result.title = (json.head.title || "").replace(/ /g, '&nbsp;');
		result.id = 'root';
		result.structure = 'mind_free';
		plaintext._changeToTopic(result);
//		console.log(result);
		return result;
	}

	return {
		fileDescription: 'OPML',
		fileExtension: '.opml',
		dataType: 'txt',
		getEntries : function(xml) {
			return xml2pos(xml);
		}
	};
})();

$(function() {
	//设置worker路径
	zip.workerScriptsPath = "/assets/js/files/";
	var imgs = "";
	var accepts = [];
	for(var i in Import) {
		if( Import[i].fileExtension ) {
			if(!Import[i].repeat){
				imgs += "<span class='mindtypes p-"+ i +"' title='" + Import[i].fileDescription + "'></span>";
			}
			accepts.push( Import[i].fileExtension );
		}
	}
	$("#share_upload_form").append("<input id='share_doc_input' class='hide file-upload' name='file' type='file'>");
	$("#share_doc_input").attr( "accept", accepts.join() ).on("change", function(){
		//加载文件内容
		Import.loadFile(this.files[0]);
	});
	if(navigator.userAgent.indexOf("Mac OS X") > 0){
		$("#sys_input").val("Mac");
	}
	$("#dlg_import .des-list").empty().html("<span style='float:left;margin-top:14px;font-size:14px;'>支持格式：</span>" + imgs );

	var dom = $("body")[0];
	dom.addEventListener("dragover", function(e) {
		e.preventDefault();
		e.stopPropagation();
	}, false);

	dom.addEventListener('drop', function(e) {
		if (e.dataTransfer.files.length) {
			e.preventDefault();
			e.stopPropagation();
			//加载文件内容
			Import.loadFile(e.dataTransfer.files[0]);
		}
	}, false);
});
