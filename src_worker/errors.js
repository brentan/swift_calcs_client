var fix_message = function(message) {
	message = message.replace(/:.*:[ ]*/,'');
	var tester = [
		{ sequence: /^.*Expecting an expression, not a function.*$/i, update: 'Expecting an expression, not a function.  For example, to take the derivative of a function <i>f</i>, <i>df/dx</i> should instead be written as <i>d<b>f(x)</b>/dx</i>'},
		{ sequence: /^[\s]*sto.*not allowed!.*$/, update: 'Invalid Assignment.  The left side of the assignment should be a variable or function name, such as <i>x&#8802;</i> or <i>f(x)&#8802;</i>'}
	];
	for(var k = 0; k < tester.length; k++) {
		if(message.match(tester[k].sequence)) 
			return tester[k].update;
	}
	return message;
}
