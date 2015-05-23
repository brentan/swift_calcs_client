eval_function = function(var_name) {
  /* 
  Will receive a string, var_name, that is asking if we know its value.
  If we do, return its value as a string (and add units if you want)
  and if we dont, return an empty string ''
  */
  if(var_name === 'test')
    return '1_mm';
  return '';
}
eval_method = function(method_name, inputs) {
  /*
  Receives two strings.  The first, method_name, is the name of the function
  we are trying to call.  The second, inputs, is a string containing the
  inputs to the function as a comma seperated list (use split to blow it up)
  If we know the function, attempt to evaluate it with the inputs.  Errors should
  be cause and returned as a string with 'ERROR: ' as the first 7 characters.
  If the evaluation is successful, return the results as a string
  If no function of this name is found, return an empty string ''
  */
  if(method_name === 'testf') {
    if(inputs.match(','))
      return 'ERROR: Invalid input to ' + method_name;
    else
      return '23_mm';
  }
  return '';
}
var sendMessage = function(json) {
  postMessage(JSON.stringify(json));
}
var receiveMessage = function(json) {
  caseval = Module.cwrap('_ZN4giac7casevalEPKc', 'string', ['string']);    
  Module.print(json.value+'\n  '+caseval(json.value));
}
this.addEventListener("message", function (evt) {
  receiveMessage(JSON.parse(evt.data));
},false);

var Module = {
  preRun: [],
  postRun: [],
  print: function(text) {
    sendMessage({command: 'print', value: text});
  },
  printErr: function(text) {
    sendMessage({command: 'printErr', value: text});
  },
  setStatus: function(text) {
    if (Module.setStatus.interval) clearInterval(Module.setStatus.interval);
    sendMessage({command: 'setStatus', value: text});
  },
  totalDependencies: 0,
  monitorRunDependencies: function(left) {
    this.totalDependencies = Math.max(this.totalDependencies, left);
    Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies-left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
  }
};
Module.setStatus('Downloading...');

importScripts('giac.js');