/*
This file handles communications with giac, which lives in a webworker
*/
(function() {
	var giac_ready = SwiftCalcs.giac_ready = false;

	startProgress('Loading Computational Library');
	setProgress(.33);

  var giac = SwiftCalcs.giac = new Worker("giac_worker.js");
  giac.addEventListener("message", function (evt) {
    handleResponse(JSON.parse(evt.data));
  },false);

  var handleResponse = function(response) {
    var text = response.value
    switch(response.command) {
      case 'print': 
      	console.log(text);
        break;
      case 'printErr': 
      	setError(text);
        break;
      case 'setStatus':
        if(text === '') {
        	giac_ready = SwiftCalcs.giac_ready = true;
        	setComplete();
        	return;
        }
        var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
        var statusElement = document.getElementById('status');
        var progressElement = document.getElementById('progress');
        if (m) {
          text = m[1];
          setProgress(parseInt(m[2])/parseInt(m[4])*0.5+0.5);
        }
        changeMessage('Loading Computational Library: ' + text);
        break;
    }
  }


}());