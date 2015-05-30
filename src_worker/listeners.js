var eval_function = function(var_name) {
  /* 
  Will receive a string, var_name, that is asking if we know its value.
  If we do, return its value as a string (and add units if you want)
  and if we dont, return an empty string ''
  */
  if(var_name === 'test')
    return '1_mm';
  return '';
}
var eval_method = function(method_name, inputs) {
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
var errors = [];
var warnings = [];
var ii = 0;
var receiveMessage = function(command) {
	if(command.restart)
		Module.caseval('restart');
	var output = [];
	errors = [];
	warnings = [];
	if(command.previous_scope)
		Module.caseval('unarchive("' + command.previous_scope + '")');
	for(ii = 0; ii < command.commands.length; ii++) {
		var to_send = command.commands[ii];
		warnings.push([]);
		if(to_send.indexOf(":=") === -1) {
			output.push({ success: true, returned: Module.caseval('latex(simplify(' + to_send + '))') });
			if(errors[ii])
				output[ii] = { success: true, returned: Module.caseval(to_send) }
		} else
			output.push({ success: true, returned: Module.caseval(to_send) });
		if(errors[ii]) 
			output[ii] = {success: false, returned: errors[ii] };
		else if(output[ii].returned.indexOf("GIAC_ERROR") > -1)
			output[ii] = {success: false, returned: output[ii].returned.replace('GIAC_ERROR:','')};
		else if(output[ii].returned == '"\\,\\mathrm{undef}\\,"') {
			output[ii] = {success: true, returned: ''}
			warnings[ii].push('Undefined result');
		}
		console.log(output[ii].returned);
		output[ii].warnings = warnings[ii];
		// BRENTAN: Error handling of some sort should go here (just stop when an error occurs?  dont stop for expressions, stop for equations)
	}
	if(command.scoped)
		Module.caseval('archive("' + command.next_scope + '")');
	//BRENTAN: At full completion of full evaluations, should update variable list and autocomplete list
	sendMessage({command: 'results', results: output, eval_id: command.eval_id, move_to_next: command.move_to_next, callback_id: command.callback_id, callback_function: command.callback_function});
}
this.addEventListener("message", function (evt) {
  receiveMessage(JSON.parse(evt.data));
},false);

var Module = {
  preRun: [],
  postRun: [],
  print: function(text) {
  	if(text.indexOf('error') > -1)
  		errors[ii] = text.replace(/:.*:[ ]*/,'');
  	else if((text.trim() != '') && (text.indexOf('Success') === -1))
  		warnings[ii].push(text.replace(/:.*:[ ]*/,''));
  },
  printErr: function(text) {
    sendMessage({command: 'printErr', value: text});
  },
  setStatus: function(text) {
    if (Module.setStatus.interval) clearInterval(Module.setStatus.interval);
    sendMessage({command: 'setStatus', value: text});
    if(text === '')
  		Module.caseval = Module.cwrap('_ZN4giac7casevalEPKc', 'string', ['string']);    
  },
  updateProgress: function(percent) {
  	sendMessage({command: 'updateProgress', value: percent});
  },
  setUpdateTimeout: function(start_val, end_val, total_time) {
  	sendMessage({command: 'setUpdateTimeout', start_val: start_val, end_val:end_val, value: total_time});
  },
  setError: function(text) {
  	sendMessage({command: 'setError', value: text});
  },
  totalDependencies: 0,
  monitorRunDependencies: function(left) {
    this.totalDependencies = Math.max(this.totalDependencies, left);
    Module.setStatus(left ? 'Loading Modules (' + (this.totalDependencies-left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
		Module.updateProgress((this.totalDependencies-left) / this.totalDependencies * 0.16 + 0.8);
  }
};
Module.setStatus('Downloading');

