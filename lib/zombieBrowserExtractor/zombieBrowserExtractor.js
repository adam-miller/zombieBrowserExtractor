//TODO: look into handling hashtags internally

//for(var i=0; i< process.argv.length; i++){
//    console.logOverride(process.argv[i]);
//}

console.logOverride = console.log;
console.log=function(str){
    return;
}
console.warn=function(str){
    return;
}
console.error=function(str){
    return;
}
console.info=function(str){
    return;
}

if(process.argv.length<3){
    printUsage();
    process.exit();
}
var args = process.argv;
var srcUrl=null;
var hashIndex=-1;
var userAgent=null;
var preloadedPage=null;
var verbose=false;
var parseLevel=1;
var debug=false;
var timeout=300000;

args.shift();
args.shift();
while(args.length>0) {
    var key = args.shift();
    if(key.length<2)
	invalidArgument();
    if(key.substr(0,2)==='--'){
	if(key==='--help'){
	    printUsage();
	    process.exit();
	}
	if(args.length<1)
	    invalidArgument();
	    
	var value=args.shift();
	if(key==='--url')
	    srcUrl=value;
	else if(key==='--userAgent')
	    userAgent=value;
	else if(key==='--preload'){
	    //preloadedPage=decode64(value);
	    preloadedPage = JSON.parse(value);
	}
	else if(key==='--parseLevel'){
		parseLevel=value;
	}
	else if(key==='--timeout'){
		timeout=value;
	}
	else
	    invalidArgument();
    }
    else if(key.substr(0,1)==='-'){
	var flag=key.substr(1,1);
	if(flag==='?'){
	    printUsage();
	    process.exit();
	}
	else if(flag==='v')
	    verbose=true;
	else if(flag==='d')
	    debug=true;
	else
	    invalidArgument();
    }
}
if(srcUrl==='undefined' || srcUrl===null || srcUrl.length==0){
    console.logOverride("ERROR: --url required\n");
    printUsage();
    process.exit();
}



var hashIndex=srcUrl.indexOf('#');
var url="";
var hash="";
var extractedOutput = new Array();
extractedOutput.pushBase = extractedOutput.push;
extractedOutput.push = function(item){
	extractedOutput.pushBase(item);
	if(debug || verbose) {
		console.logOverride(JSON.stringify(item,null,2));
	}
	else{
		console.logOverride(JSON.stringify(item));
	}
}

function invalidArgument(){
    console.logOverride("ERROR: Invalid Argument.\n");
    printUsage();
    process.exit();
}
function printOutputAndExit(returnVal){
	// if(debug || verbose) {
	// 	console.logOverride(JSON.stringify(extractedOutput,null,2));
 //    }
 //    else {
	// 	console.logOverride(JSON.stringify(extractedOutput));
 //    }
	process.exit(returnVal);

}
function doTimeout(){
	if(debug || verbose)
		console.logOverride('timeout exceeded');
	printOutputAndExit(-5);
}
function printUsage(){
    console.logOverride("Usage:\n  node zombiescript.js [OPTION...] --url <url>");
    console.logOverride("");
    console.logOverride("Retrieves and parses the specified HTML page. Returns JSON encoded results of interest, as well as any XMLHttpRequests");
    console.logOverride("");
    console.logOverride("Help Options:\n  -?, --help	Display this usage information");
    console.logOverride("");
    console.logOverride("Application Options:\n	-v		Verbose output");
    console.logOverride("	-d		Print debug information");
    console.logOverride("	--url		The URL of the web page to be rendered");
    console.logOverride("	--userAgent	The user agent string to use. Default is inherited from zombie.js - Mozilla/5.0 Chrome/10.0.613.0 Safari/534.15 Zombie.js/#{VERSION}");
    console.logOverride("	--parseLevel	0 = don't parse; 1 = ajax requests only; 2 = basic parsing; 3 = intensive parsing");
    console.logOverride("	--timeout	Integer in milliseconds representing overall timeout. default 5mins");
    console.logOverride("	--preload	A JSON object containing http headers and file location of utf-8 encoded text to replace the initial request. Use this to keep the browser from making the initial http request");
    console.logOverride("	  example:	{\"Content-Type\":\"text/html\",\"body\":\"/tmp/fileContents.utf8.html\"}");
    console.logOverride("	  note:		escape non-alphanumeric characters with \\ ex. \\{\\\"Content\\-Type\\\"\\:\\\"text\\/html\\\"\\,\\\"body\\\"\\:\\\"\\/tmp\\/fileContents\\.utf8\\.html\\\"\\} ");
    console.logOverride("Example:\n	node zombiescript.js --url http://www.google.com");
}

// object.watch
if (!Object.prototype.watch)
    Object.prototype.watch = function (prop, handler) {
        var val = this[prop],
        getter = function () {
	    return val;
        },
        setter = function (newval) {
	    return val = handler.call(this, prop, val, newval);
        };
        if (delete this[prop]) { // can't watch constants
	    if (Object.defineProperty) // ECMAScript 5
		Object.defineProperty(this, prop, {
			get: getter,
			    set: setter
			    });
	    else if (Object.prototype.__defineGetter__ && Object.prototype.__defineSetter__) { // legacy
		Object.prototype.__defineGetter__.call(this, prop, getter);
		Object.prototype.__defineSetter__.call(this, prop, setter);
	    }
        }
    };

// object.unwatch
if (!Object.prototype.unwatch)
    Object.prototype.unwatch = function (prop) {
        var val = this[prop];
        delete this[prop]; // remove accessors
        this[prop] = val;
    };


if(hashIndex>0){
    url=srcUrl.substr(0,hashIndex);
    hash=srcUrl.substr(hashIndex,srcUrl.length-hashIndex);
    //console.logOverride(url);
    //console.logOverride(hash);
}
else{
    url=srcUrl;
    hash="";
}

require('./json2.js');
var zombie=require('zombie');
zombie.Browser.htmlParser = require("htmlparser")
zombie.Browser.loadCSS=false;
var fs = require('fs');
var browser=null;
if(userAgent ==='undefined' || userAgent===null)
    browser = new zombie.Browser({debug:debug,loadCSS:false});
else
    browser = new zombie.Browser({debug:debug,userAgent:userAgent,loadCSS:false});
browser.silent=true;

setTimeout(doTimeout,timeout);
process.on('SIGTERM', function(){
    printOutputAndExit(1);
});

if(verbose){
    console.logOverride("URL: "+url);
    if(hash.length>0)
	console.logOverride("HASH: #"+hash);
    console.logOverride("Debug: "+debug);
    console.logOverride("UserAgent: "+browser.userAgent);
    console.logOverride("ParseLevel: "+parseLevel);
    console.logOverride("preloadedPage: "+preloadedPage);
    console.logOverride("timeout: "+timeout);
}

function convertToAbsoluteUri(uri){
    if(typeof browser.document!="undefined"){
	var a = browser.document.createElement('a');
	a.href=uri;
	return a.href;
    }
    else
	return uri;
}

var JSDom=require('jsdom');
browser.window.Image=function(){
var i = new JSDom.dom.level3.html.HTMLImageElement;
i.watch('src',function(id,oldval,newval){
	if(verbose)
	    console.logOverride("Image object loaded url:"+newval);
	extractedOutput.push({"tagName":"XMLHttpRequest","url":newval});
    });
return i;
}

browser.window.console.log=function(str){
    return;
}
browser.window.console.warn=function(str){
    return;
}
browser.window.console.error=function(str){
    return;
}
browser.window.console.info=function(str){
    return;
}

browser.window.resourceLoader.loadBase = browser.window.resourceLoader.load;
browser.window.resourceLoader.load=function(element,href,callback){
    var full = browser.window.resourceLoader.resolve(element._ownerDocument,href);
    if(verbose)
	console.logOverride('Downloading: '+element+' , '+full);

    extractedOutput.push({"tagName":"XMLHttpRequest","url":full});
    return browser.window.resourceLoader.loadBase(element,href,callback);
}


browser.window.XMLHttpRequestBase = browser.window.XMLHttpRequest;
browser.window.XMLHttpRequest = function(){
    var base = new browser.window.XMLHttpRequestBase();
    
    base.openBase = base.open;
    base.open = function(sMethod, sUrl, bAsync, sUser, sPassword){
	if(verbose)
	    console.logOverride("XHR: method:"+sMethod+" url:"+sUrl);
	if(sMethod!=='undefined' && sMethod!==null && sMethod==='GET')
	    extractedOutput.push({"tagName":"XMLHttpRequest","url":sUrl});
	return base.openBase(sMethod,sUrl,bAsync,sUser,sPassword);
    };
    return base;
};
browser.resources.makeRequestBase=browser.resources._makeRequest;
browser.resources._makeRequest=function(method,url,data,headers,resource,callback){
    if(verbose)
	console.logOverride('Requesting: '+url.href);
    extractedOutput.push({"tagName":"XMLHttpRequest","url":url.href});

    if(preloadedPage!=='undefined' && preloadedPage!==null && headers && typeof headers['x-requested-with']=='undefined'){
	
	var response = {};
	response.headers={};
	for(var key in preloadedPage){
	    if(key.toUpperCase()!=="BODY")
	    response.headers[key]=preloadedPage[key];
	}
	response.redirected=false;
	response.resource=resource;
	response.statusCode=200;
	response.statusText="OK";
	response.url=url.href;

	response.body=fs.readFileSync(preloadedPage['body'],'utf-8');

	callback(null,response);

    //var requestedWith=headers['x-requested-with'];
    //if(typeof requestedWith=="undefined"){
	    //this is the base request
	if(verbose)
	    console.logOverride('Source Request url:'+url.href);

    }
    else {
		var req = browser.resources.makeRequestBase(method,url,data,headers,resource,callback);

		return req;
	}
}


browser.visit(url);
		//browser.document.addEventListener("DOMNodeInserted", function(e) {
			// console.logOverride(e.target._attributes.length);
	  		// for(var i=0;i<e.target._attributes.length; i++){
	  		// 	console.logOverride(printObj(e.target._attributes[i]));
	  		// }
		//}, false);
browser.wait(function(){
	if(hash.length>0){
	    browser.location=hash;
	    browser.wait(function(){
		    parseBrowser();
		process.exit();
	    });
	}
	else{
	    parseBrowser();
	    process.exit();
	}
    });
function parseBrowser(){
    if(parseLevel==='0')
		return;
    if(parseLevel>1){
	    var nodes = browser.xpath('//*[@href or @src or @lowsrc or @background or @cite or @longdesc or @usemap or @profile or @datasrc or @codebase or @classid or @data or @archive or @code or @value]').value;

	    for(var i=0; i< nodes.length; i++) {
		var object = {};
		object.tagName = nodes[i]._tagName;
		for(var j=0; j<nodes[i]._attributes.length; j++){
		    var key = nodes[i]._attributes[j]._nodeName;
		    var value = nodes[i]._attributes[j]._nodeValue;
		    object[key]=value;
		}
		extractedOutput.push(object);
	    }

	    if(parseLevel>2) {
		    var style = browser.xpath('//*[@style]').value;
		    for(var i=0; i<style.length; i++){
		        if(typeof style[i].style !=='undefined' && style[i].style!==null && style[i].style.length>0 ){
			    extractedOutput.push({"tagName":style[i]._tagName,"style":style[i].style.cssText});
		        }
		    }
		    style = browser.xpath('//style').value;
		    for(var i=0; i<style.length; i++){
			if(typeof style[i].textContent!=='undefined' && style[i].textContent!==null)
			    extractedOutput.push({"tagName":style[i]._tagName,"innerText":style[i].textContent.replace(/\s{2,}/g, ' ')});
		    }
		}
	    //TODO only conditional comments
	    //var comments = browser.xpath('//comment()').value;
	    //for(var i=0; i<comments.length; i++){
	    //	extractedOutput.push({"tagName":comments[i]._tagName,"value":comments[i].value});
	    //}
	    var forms = browser.xpath('//form').value;
	    for(var i=0;i<forms.length; i++){
			var method = "GET";
			var action = "";
			var form = { "tagName":"form", "method":null,"action":null};
			if(forms[i].action!=='undefined' && forms[i].action!==null){
			    action = forms[i].action;
			    if(forms[i].method!=='undefined' && forms[i].method!==null && forms[i].method.length>0){
				method=forms[i].method;
			    }
			    form["method"]=method;
			    form["action"]=action;
			    extractedOutput.push(form);
			}

	    }
    }

    process.exit();
}
function printObj(obj){
    var output = '';
    for (property in obj) {
	output += property + ': ' + obj[property]+'; ';
    }
    return output;
}

