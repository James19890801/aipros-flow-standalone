var outlineExport = {
    info: {},
    init: function(){
    },
    opml: function (data) {
        var  headtxt = '';
        if(data.id = "root"){
            headtxt = '<head><title>'+ data.title +'</title></head>';
            outlineExport.info.title = data.title;
        }
        var children = data.children, innerBody = '';
        innerBody = parseObj2Opml(children,innerBody);

        var opmlTxt = '<?xml version="1.0" encoding="UTF-8"?><opml version="2.0">' + headtxt + '<body>'+ innerBody +'</body></opml>';

        this.sendExport(opmlTxt,"opml");
        function parseObj2Opml(children,innerBody){
            children.forEach(function(e, i, a){
                var itemChild = e.children || [];
                var imgattr = e.image ? 'image="'+ encodeURI(JSON.stringify(e.image).replace(/&/g, '&amp;')) +'"' :'';
                if(itemChild.length > 0){
                    innerBody += '<outline text="'+ e.title.replace(/&nbsp;/g," ").replace(/</g,'&lt;') +'" ' + imgattr + ' >';
                    innerBody += parseObj2Opml(e.children, '');
                    innerBody += '</outline>'
                }else{
                    innerBody += '<outline text="'+ e.title.replace(/&nbsp;/g," ").replace(/</g,'&lt;') +'" '+ imgattr +'/>'
                }
            });
            return innerBody
        }
    },
    png: function(){
        var _this = this;
        outlineExport.info.title = outlineObj.model.data.title;
        $(".equation-text").each(function(i, dom){
            var svgList = $(dom).find("svg");
            svgList.each(function(){
                var svgCon = $(this);
                svgCon.attr("width", svgCon.width());
                svgCon.attr("height", svgCon.height());
            })
        })
        html2canvas(document.getElementById('outline'),{
            useCORS: true
        }).then(function(canvas) {
            _this.sendExport(canvas.toDataURL(),"image");
        });
    },
    sendExport: function(data,type){
        var form = document.createElement("form");
        form.setAttribute("action", "/diagram_export/mindmap");
        form.setAttribute("method", "POST");
        form.appendChild(field("title", outlineExport.info.title));
        form.appendChild(field("type", type));
        form.appendChild(field("outline", "outline"));
        form.appendChild(field("definition", data));
        form.appendChild(field("ignore", "definition"));
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
    }
};
