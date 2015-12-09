/* Simple AJAX script to load giac with progress bar updates */

var obj = false;
var objs = ["Microsoft.XMLHTTP","Msxml2.XMLHTTP","MSXML2.XMLHTTP.3.0","MSXML2.XMLHTTP.4.0"];
var success = false;
for (var i=0; !success && i < objs.length; i++) {
	try {
		obj = new ActiveXObject(objs[i]);
		success = true;
	} catch (e) { obj = false; }
}
if (!obj) obj = new XMLHttpRequest();
obj.onreadystatechange = function(input_module) { return function() {
	var Module = input_module;
	if(obj.readyState == 4) {
		if(obj.status == 200) {
			Module.setStatus('Initializing Environment');
			Module.updateProgress(0.52);
			Module.setUpdateTimeout(0.52,0.8, 18*1000);
			eval(obj.responseText);
			Module.updateProgress(0.8);
		}
		else 
			Module.setError('ERROR LOADING ENVIRONMENT: ' + obj.statusText + ' (' + obj.status + ')');
	}
}; }(Module);
obj.onprogress = function(input_module) { return function(e){ 
	if(e.lengthComputable) 
		input_module.updateProgress((e.loaded / e.total)*0.5);
}; }(Module);
var loadGiac = function(v) {
	var is_chrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
	if(is_chrome && ((navigator.userAgent.toLowerCase().replace(/.*chrome\/([0-9]+)\..*/,"$1")*1) > 46))
		obj.open('GET','/libraries/chrome_giac' + v + '.js',true);
	else
		obj.open('GET','/libraries/giac' + v + '.js',true);
	obj.send(null);
}
sendMessage({command: 'giac_version'});