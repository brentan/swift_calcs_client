var eval_function = function(var_name) {
  /* 
  Will receive a string, var_name, that is asking if we know its value.
  If we do, return its value as a string (and add units if you want)
  and if we dont, return an empty string ''
  */
  var ob = var_name.replace(/SWIFTCALCSMETHOD.*$/,'');
  var method = var_name.replace(/^.*SWIFTCALCSMETHOD/,'');
  var out = '';
  if(constants[ob]) {
  	var out = constants[ob][method];
  	if(typeof out === 'function') out = constants[ob][method]();
  }
  if(typeof out !== 'string') out = '';
  return out;
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
  if(command.varList) {
    // If we are asking for the variable list, we simply get that list and return it immediately
    var vars = Module.caseval('VARS').slice(1,-1).split(',');
    if((vars.length == 1) && (vars[0] == '')) vars = [];
    var uvars = vars.slice(0);
    var objects = {};
    for(var key in constants) {// BRENTAN: Maybe change later to 'user_vars' if the constants list grows too large?
      vars.push(key);
      vars.push(key + '.');
      objects[key] = {propertyList:constants[key].propertyList, methodList: constants[key].methodList};
    }
    for(var key in user_vars) {
      uvars.push(key);
    }
    vars = uniq(vars).sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
    uvars = uniq(uvars).sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()); });
    return sendMessage({command: 'varList', userVarList: uvars, totalVarList: vars, objects: objects})
  }
  // If we are starting a new evaluation, restart giac to reset everything
	if(command.restart)
		Module.caseval('restart');
	var output = [];
  // Errors and warnings are sometimes (but not always!) caught with Module.printErr (they are sometimes also just returned by caseval directly)
  // to deal with that we define these in the global scope and set them with printErr as things happen
	errors = [];
	warnings = [];
  // If we need to load a scope, do it here
	if(command.previous_scope)
		Module.caseval('unarchive("' + command.previous_scope + '")');
  // Iterate over the command list
	for(ii = 0; ii < command.commands.length; ii++) {
		var to_send = command.commands[ii].command.trim();
		warnings.push([]);
    // If the command is simply a variable name (or object.property transformed to object__property), 
    // and this command is in our global constants array, output its toString value directly
		if(to_send.match(/^[a-z][a-z0-9_]*$/i) && constants[to_send]) {
			output[ii] = {success: true, returned: constants[to_send].toString(), warnings: [], suppress_pulldown: true};
			continue;
		}
    // If we are setting an object into a new variable, we do this directly through the 'clone' method.
		if(to_send.match(/^[a-z][a-z0-9_]* *:= *[a-z][a-z0-9_]*$/i) && constants[to_send.replace(/^[a-z][a-z0-9_]* *:= */i,'')]) {
			var new_var = to_send.replace(/ *:= *[a-z][a-z0-9_]*$/i,'');
			var old_var = to_send.replace(/^[a-z][a-z0-9_]* *:= */i,'');
			constants[new_var] = user_vars[new_var] = constants[old_var].clone();
			output[ii] = {success: true, returned: constants[new_var].toString(), warnings: []};
			continue;
		}
    // Otherwise, lets use giac for our evaluation. 
    // Is this an expression that is setting the value of a variable?  If not, we add some simplification, unit converstion, and set output to latex
		if(!command.commands[ii].nomarkup && to_send.indexOf(":=") === -1) {
      // if to_send has units associated with it, we attempt to convert to that unit.  On failure, we revert to auto unit handling
      var simplify_command = command.commands[ii].simplify ? command.commands[ii].simplify : 'simplify';
      if(command.commands[ii].approx)
        simplify_command = 'evalf(' + simplify_command;
      else
        simplify_command = '(' + simplify_command;
      if(command.commands[ii].unit) { // If provided, this is a 2 element array.  The first is the unit in evaluatable text, the second is an HTML representation
        output.push({ success: true, returned: Module.caseval('latex(' + simplify_command + '(convert(' + to_send + ',' + command.commands[ii].unit[0] + '))))') });
        if((errors[ii] && errors[ii].indexOf('Incompatible units') > -1) || (output[ii].returned.indexOf('Incompatible units') > -1)) {
          // Perhaps the auto-unit conversion messed this up...remove it
          // BRENTAN: FUTURE, we should be 'smarter' here and try to update the expected output unit based on the order of the input.  This should all probably be updated a bit...
          errors[ii] = null;
          warnings[ii] = [];
          output[ii] = { success: true, returned: Module.caseval('latex(' + simplify_command + '(usimplify(' + to_send + '))))') };
          if(!errors[ii] && (output[ii].returned.indexOf('Incompatible units') === -1))
            warnings[ii].push('Incompatible Units: Ignoring requested conversion to ' + command.commands[ii].unit[1]);  // BRENTAN- pretty up the 'unit' output so that it is not in straight text mode
        } 
      } else 
        output.push({ success: true, returned: Module.caseval('latex(' + simplify_command + '(usimplify(' + to_send + '))))') });
      // If evaluation resulted in an error, drop all of our additions (latex, simplify, etc) and make sure that wasn't the problem
			if(errors[ii])
				output[ii] = { success: true, returned: Module.caseval(to_send) }
		} else {
      // Test for setting i
      if(to_send.match(/^[ ]*i[ ]*:=.*$/)) {
        output[ii] = {success: false, returned: 'variable name <i>i</i> is protected and defined as sqrt(-1)', warnings: []}
        continue;
      }
			output.push({ success: true, returned: Module.caseval(to_send) });
    }
    // Work through the warnings.  If any are present and suggesting a different input, lets evaluate that instead
		for(var j = 0; j < warnings[ii].length; j++) {
			if(warnings[ii][j].indexOf('Perhaps you meant') > -1) {
				// Use the cas suggestion, as we probably want to use that
				to_send = warnings[ii][j].replace('Perhaps you meant ','');
				errors[ii] = null;
				warnings[ii] = [];
				output[ii] = { success: true, returned: Module.caseval(to_send)};
				break;
			}
		}
    // If there were errors, set the output to the error.  Check both the errors array and the direct output. 
    // Also check for an undefined result, which returns a bit of a complex result from giac
		if(errors[ii]) 
			output[ii] = {success: false, returned: errors[ii] };
		else if(output[ii].returned.indexOf("GIAC_ERROR") > -1)
			output[ii] = {success: false, returned: fix_message(output[ii].returned.replace('GIAC_ERROR:',''))};
		else if(output[ii].returned == '"\\,\\mathrm{undef}\\,"') {
			output[ii] = {success: true, returned: ''}
			warnings[ii].push('Undefined result');
		}
		//console.log('GIAC OUT: ' + output[ii].returned);
    // Set any warnings to the output
		output[ii].warnings = warnings[ii];
	}
  // If we are scoped evaluation, we should save the scope now for future retreival
	if(command.scoped)
		Module.caseval('archive("' + command.next_scope + '")');
  // Return the result to the window thread
  if(command.variable)
    sendMessage({command: 'variable', results: output, callback_id: command.callback_id})
  else
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
  		errors[ii] = fix_message(text);
  	else if((text.trim() != '') && (text.indexOf('Success') === -1))
  		warnings[ii].push(fix_message(text));
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
