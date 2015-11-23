
var solve = P(GiacGeneric, function(_, super_) {
	_.klass = ['solve'];
	_.number_of_equations = 1;
	_.ask_initial_guess = false;
	_.helpText = "<<solve <[EXPR]> for <[VARS]>>>\nSolve the expression(s) given (EXPR) for the variable(s) specified in VARS.  Use the 'add another equation' link to solve systems of equations.  When solving for multiple variables, enter as a comma-seperated list.  If an initial guess is requested, enter as a comma-seperated list corresponding to the variable list.\nExample: Solve x^2=4 for x with initial guess 0.2.\nExample: Solve x^2+y=6,x-y^2=-2 for x,y";
	_.savedProperties = ['expectedUnits','approx','factor_expand','outputMode','number_of_equations', 'scoped', 'ask_initial_guess'];

	_.init = function() {
		this.eqFields = [];
		super_.init.call(this);
	}
	_.innerHtml = function() {
		return '<table class="' + css_prefix + 'giac_element"><tbody><tr><td class="' + css_prefix + 'var_store">'
	 	+ '<div class="' + css_prefix + 'focusableItems" data-id="0"><span class="' + css_prefix + 'var_store">' + focusableHTML('MathQuill',  'var_store') + '<span class="equality">&#8801;</span></span>' + focusableHTML('CodeBlock', 'solve') + '</td>'
	 	+ '<td class="' + css_prefix + 'content"><div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'eq0') + helpBlock() + '</div><div class="' + css_prefix + 'hide_print"><div class="' + css_prefix + 'add_equation">Add another equation</div></div>'
	 	+ '<div class="' + css_prefix + 'focusableItems" data-id="1">for&nbsp;' + focusableHTML('MathQuill',  'var') + '<span class="initial_guess" style="display:none;">&nbsp;with initial guess&nbsp;' + focusableHTML('MathQuill',  'var_guess') + '</span></div>'
	  + '<div class="' + css_prefix + 'focusableItems" data-id="2">using&nbsp;' + focusableHTML('SelectBox',  'solver') + '</div>'
		+ answerSpan() + '</td></tr></tbody></table>';
	}
	_.postInsertHandler = function() {
		this.eqFields[0] = registerFocusable(MathQuill, this, 'eq0', { ghost: 'equation', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.varField = registerFocusable(MathQuill, this, 'var', { ghost: 'variable', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.guessField = registerFocusable(MathQuill, this, 'var_guess', { ghost: '0', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.solver = registerFocusable(SelectBox, this, 'solver', { options: { symbolic: 'Symbolic Solver', newton_solver: 'Newton-Raphson Numeric Solver'}});
		this.eqFields[0].setExpressionMode(true);
		this.command = registerFocusable(CodeBlock, this, 'solve', { });
		this.focusableItems = [[this.command, this.eqFields[0]] , [this.varField], [this.solver]];
		this.needsEvaluation = false;
		super_.postInsertHandler.call(this);
		return this;
	}
  _.parseSavedProperties = function(args) {
  	super_.parseSavedProperties.call(this, args);
  	// After we do this, we want to set up the DOM correctly for the number of equations this block had, before rest of parse completes
  	if(this.ask_initial_guess)
			this.jQ.find('.initial_guess').show();
  	var equations_to_add = this.number_of_equations;
  	this.number_of_equations = 1;
  	for(var i = 1; i < equations_to_add; i++)
  		this.addEquation(false, true);
  	this.redoFocusableList();
  	return this;
  }
  _.eq_id = 1;
  _.addEquation = function(focus, skip_focusable) {
  	// Add a new equation line to the solver list
		var html = '<div class="' + css_prefix + 'focusableItems">' + focusableHTML('MathQuill',  'eq' + this.eq_id) + '&nbsp;<i class="fa fa-remove ' + css_prefix + 'hide_print"></i></div>';
		this.jQ.find('.' + css_prefix + 'add_equation').before(html);
		this.eqFields.push(registerFocusable(MathQuill, this, 'eq' + this.eq_id, { ghost: 'equation', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}}));
		this.eqFields[this.number_of_equations].setExpressionMode(true);
		this.eq_id++;
		this.number_of_equations++;
		if(!skip_focusable) this.redoFocusableList();
		this.varField.setGhost('variable list');
		if(focus) this.eqFields[this.number_of_equations-1].focus(1);
  }
  _.removeEquation = function(index) {
  	if(this.eqFields[index].touched) this.changed();
  	this.eqFields.splice(index, 1);
  	this.jQ.find('.' + css_prefix + 'content').find('.' + css_prefix + 'focusableItems').each(function() {
  		var el = $(this);
  		if((el.attr('data-id')*1) == index)
  			el.removeClass(css_prefix + 'focusableItems').slideUp({duration: 150, always: function() { el.remove(); } });
  	});
		this.number_of_equations--;
		if(this.number_of_equations == 1)
			this.varField.setGhost('variable');
  	this.redoFocusableList();
  }
  _.redoFocusableList = function() {
  	var id = 0;
  	// Renumber the DOM ids
  	this.jQ.find('.' + css_prefix + 'content').find('.' + css_prefix + 'focusableItems').each(function() {
  		$(this).attr('data-id', id);
  		id++;
  	});
  	// Recreate focusable Items array
  	if(this.scoped)
			this.focusableItems = [[this.varStoreField, this.command, this.eqFields[0]]];
		else
			this.focusableItems = [[this.command, this.eqFields[0]]];
		for(var i = 1; i < this.number_of_equations; i++)
			this.focusableItems.push([this.eqFields[i]])
		if(this.ask_initial_guess)
			this.focusableItems.push([this.varField, this.guessField]);
		else
			this.focusableItems.push([this.varField]);
		this.focusableItems.push([this.solver]);
  }
	_.mouseClick = function(e) {
		var target = $(e.target);
		if(target.hasClass(css_prefix + 'add_equation')) {
			this.addEquation(true);
			return false;
		}
		if(target.hasClass('fa-remove')) {
			this.removeEquation(target.closest('div.' + css_prefix + 'focusableItems').attr('data-id')*1);
			return false;
		}
    if(super_.mouseClick.call(this,e)) return true;
	}

	_.submissionHandler = function(_this) {
		return function(mathField) {
			if((mathField === _this.varStoreField) && _this.varStoreField.empty()) 
				_this.clearVariableStore();
			if(_this.needsEvaluation) {
				// check for anything that is empty
				var errors = [];
				if(_this.scoped && !_this.varStoreField.text().match(/^[a-z][a-z0-9_]*$/i))
					errors.push('Invalid variable name (' + _this.worksheet.latexToHtml(_this.varStoreField.latex()) + ').  Please enter a valid variable name');
				if(!_this.varField.text().match(/^[a-z][a-z0-9_]*(,[a-z][a-z0-9_]*)*$/i))
					errors.push('Invalid variable list (' + _this.worksheet.latexToHtml(_this.varField.latex()) + ').  Please enter a valid comma-seperated list of variables');
				if(_this.ask_initial_guess && !_this.guessField.empty() && (_this.guessField.text().split(',').length !== _this.varField.text().split(',').length))
					errors.push('Invalid guesses.  Please ensure you provide 1 guess for each variable you are solving for (enter as a comma-seperated list)');
				for(var i = 0; i < _this.eqFields.length; i++)
					if(_this.eqFields[i].empty()) errors.push('Equation ' + (y+1) + ' is currently empty.  Please add an equation.');
				if(errors.length && _this.outputMathBox) {
					_this.worksheet.save();
					_this.outputMathBox.clear();
					_this.setError(errors.join('<BR>'));
				} else {
					var eqs = [];
					$.each(_this.eqFields, function(i, v) { eqs.push(v.text()); });
					var start_command = '';
					var end_command = '';
					if(_this.ask_initial_guess) {
						start_command += 'f';
						if(_this.guessField.empty() && (_this.varField.text().split(',').length > 1)) 
							end_command = ',[' + $.map(_this.varField.text().split(','), function() { return 0; }).join(',') + ']';
						else if(_this.guessField.empty())
							end_command = ',0';
						else if(_this.varField.text().split(',').length > 1) // What if there are commas within each element? like a matrix?
							end_command = ',[' + _this.guessField.text() + ']';
						else
							end_command = ',' + _this.guessField.text();
						end_command += ', newton_solver';
					}
					if(_this.varField.text().split(',').length > 1) // What if there are commas within each element? like a matrix?
						var var_command = '[\'' + _this.varField.text().split(',').join("','") + '\']';
					else
						var var_command = '\'' + _this.varField.text() + '\'';
					if(eqs.length > 1)
						var command = start_command + 'solve([' + eqs.join(', ').replace(/==/g,'=') + '], ' + var_command + end_command + ')';
					else
						var command = start_command + 'solve(' + eqs[0].replace(/==/g,'=') + ', ' + var_command + end_command + ')';
					if(_this.ask_initial_guess) {
						// Numeric solver...units were dropped, so we use the guess to restore units
						var guess_text = _this.guessField.text();
						if(guess_text.trim() == '') guess_text = (_this.varField.text().split(',').length > 1) ? $.map(_this.varField.text().split(','), function() { return 1; }).join(',') : 1;
						if(_this.varField.text().split(',').length > 1) // What if there are commas within each element? like a matrix?
							_this.commands = _this.genCommand('[val] .* [mksa_base(' + guess_text.replace(/,/g, '),mksa_base(') + ')]'); // convert answer back to appropriate units
						else
							_this.commands = _this.genCommand('[val] * mksa_base(' + guess_text + ')'); // convert answer back to appropriate units
						_this.commands[0].unit_convert = true;
						// BRENTAN: TODO: The provided guess units should allow us to autoconvert the answer in to the desired units as well...
					} else {
						// Symbolic solver
						_this.commands = _this.genCommand('[val]');
						_this.commands[0].unit_convert = true;
					}
					// Solve the equation, with special unit mode for the solver.  Result will be inserted in place of [val] in the next computation
					_this.commands.unshift({command: command, nomarkup: true, pre_command: (_this.ask_initial_guess ? 'mksareduce_mode(1);' : 'mksavariable_mode(1);') }); 

					if(_this.ask_initial_guess) // insert guess into the equations to see if it causes a unit error
						_this.commands.push({command: "((" + _this.varField.text() + ")->(" + _this.eqFields[0].text().replace(/==/g,'-') + "))(" + guess_text + ")", nomarkup: true});

					_this.fullEvaluation = (_this.scoped || _this.was_scoped);
					_this.evaluate();
					_this.needsEvaluation = false;
				}
			}
		};
	}
	_.evaluationFinished = function(result) {
		if(this.ask_initial_guess && !result[2].success) {
			if(result[2].returned.match(/Incompatible units Error/))
				result[1].warnings.push('Error during unit consistency check: Ensure your intial guess has the proper expected units, and that units in the equations balance')
			else
				result[1].warnings.push(result[2].returned);
		}
		if(result[1].returned && result[1].success) {
			this.was_scoped = false;
			// Test for no result
			if(result[1].returned.match(/[\s]*\\begin{bmatrix[0-9]+}\\end{bmatrix[0-9]+}[\s]*/)) { 
				result[1].returned = ''; 
				result[1].warnings.push('No results found'); 
			} else {
				if(this.number_of_equations > 1) 
					var to_add = "\\left\\{ " + this.varField.text() + " \\right\\}"
				else
					var to_add = this.varField.text();
				result[1].returned = to_add + " \\whitespace\\Longrightarrow \\whitespace " + result[1].returned;
			}
		}
		if(result[1].success && result[1].warnings.join(",").match(/undefined/i) && (this.number_of_equations != this.varField.text().split(',').length))
			result[1].warnings.push('The number of equations does not match the number of variables in the variable list.  If there are other independant variables in your equations, please include them in the variable list');
		var to_return = super_.evaluationFinished.call(this, [result[1]]); // Transform to array with result 1 in spot 0, as that is what is expected in evaluationFinished
		this.last_result = result;
		return to_return;
	}
	// Callback for focusable items notifying that this element has been changed
	_.changed = function(el) {
		for(var i = 0; i < this.eqFields.length; i++)
			if(el === this.eqFields[i]) this.eqFields[i].touched = true;
		if(el === this.varField)
			this.varField.touched = true;
		if(el === this.solver) {
			if(this.solver.text() == 'symbolic') {
				this.ask_initial_guess = false;
				this.jQ.find('.initial_guess').hide();
				this.redoFocusableList();
			} else {
				this.ask_initial_guess = true;
				this.jQ.find('.initial_guess').show();
				this.redoFocusableList();
			} 
		}
		if(this.eqFields[0].touched && !this.eqFields[0].empty() && this.varField.touched)
			this.needsEvaluation = true;
	}
});