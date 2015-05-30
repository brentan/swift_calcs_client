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
obj.open('GET','giac' + GIAC_VERSION + '.js',true);
obj.send(null);