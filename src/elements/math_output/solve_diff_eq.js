
var desolve = P(SettableMathOutput, function(_, super_) {
	_.klass = ['desolve'];
	_.number_of_equations = 1;
	_.numeric_mode = false;
	_.helpTextSymbolic = "<<solve differential equation <[EXPR]> for <[FUNC]>>>\nSolve the differential equation(s) and condition(s) given (EXPR) for the function specified in FUNC.  Use apostrophes in EXPR to indicate a derivative.  Use the 'add another equation' link to add more equations or conditions.\nExample: Solve differential equation f'' + f = cos(x), f(0) = 1, f'(0) = 0 for f(x)\nHELP:22";
	_.helpTextNumeric = "<<solve differential equation y'=<[EXPR]> and y(0)=<[INIT]> for <[x]> from <[0]> to <[end]>>>\nSolve the differential equation(s) given (EXPR) numerically.  Each equation is the derivative of a value y.  Initial conditions for each y must also be provided, as well as the end value for the dependant variable to which the solution should solve.  The solver will return a matrix with value from the intial condition to the final value, with values for y in between.\nExample: Solve differential equation y' = y * cos(x), y(0) = 1, for x from 0 to 1\nHELP:22";
	_.savedProperties = ['number_of_equations', 'numeric_mode'];

	_.init = function() {
		this.eqFields = [];
		this.startFields = [];
		this.varFields = [];
		this.helpText = this.helpTextSymbolic;
		super_.init.call(this);
	}
	_.innerHtml = function() {
		var html = '<div class="' + css_prefix + 'focusableItems" data-id="1"><span class="initial_guess" style="display:none;">' + focusableHTML('MathQuill',  'var0') + '<span class="eqnum"></span></span>' + focusableHTML('MathQuill',  'eq0') + '<span class="initial_guess" style="display:none;">,&nbsp;&nbsp;&nbsp;<span class="eqinit"></span>' + focusableHTML('MathQuill',  'start0') + '</span>' + helpBlock() + '</div><div><div class="' + css_prefix + 'add_equation ' + css_prefix + 'hide_print">Add another equation</div></div>'
	 	+ '<div class="' + css_prefix + 'focusableItems" data-id="2">for&nbsp;' + focusableHTML('MathQuill',  'var') + '<span class="initial_guess" style="display:none;">&nbsp;from&nbsp;' + focusableHTML('MathQuill',  'start') + '&nbsp;to&nbsp;' + focusableHTML('MathQuill',  'final') + '&nbsp;with&nbsp;step&nbsp;of&nbsp;' + focusableHTML('MathQuill',  'step') + '</span></div>'
	  + '<div class="' + css_prefix + 'focusableItems" data-id="3">using&nbsp;' + focusableHTML('SelectBox',  'solver') + '</div>';
		return this.wrapHTML('solve differential equation', html, true);
	}
	_.postInsertHandler = function() {
		this.eqFields[0] = registerFocusable(MathQuill, this, 'eq0', { ghost: 'equation', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.startFields[0] = registerFocusable(MathQuill, this, 'start0', { ghost: 'initial value', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.varFields[0] = registerFocusable(MathQuill, this, 'var0', { ghost: 'y0', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.varFields[0].latex("y_{0}");
		this.varField = registerFocusable(MathQuill, this, 'var', { ghost: 'f(x)', default: 'x', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.startField = registerFocusable(MathQuill, this, 'start', { ghost: '0', default: '0', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.endField = registerFocusable(MathQuill, this, 'final', { ghost: 'final', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.stepField = registerFocusable(MathQuill, this, 'step', { ghost: 'step size (optional)', default: '0', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.solver = registerFocusable(SelectBox, this, 'solver', { options: { symbolic: 'Symbolic (Exact) Solver', newton_solver: 'Numeric (Approximate) Solver'}});
		this.eqFields[0].setExpressionMode(true);
		this.varField.variableEntryField(true);
		this.varFields[0].variableEntryField(true);
		this.command = registerFocusable(CodeBlock, this, 'solve differential equation', { });
		this.focusableItems = [[], [this.eqFields[0]] , [this.varField], [this.solver]];
		this.needsEvaluation = false;
		super_.postInsertHandler.call(this);
		return this;
	}
  _.parseSavedProperties = function(args) {
  	super_.parseSavedProperties.call(this, args);
  	// After we do this, we want to set up the DOM correctly for the number of equations this block had, before rest of parse completes
  	if(this.numeric_mode)
			this.changeToNumericMode();
  	var equations_to_add = this.number_of_equations;
  	this.number_of_equations = 1;
  	for(var i = 1; i < equations_to_add; i++)
  		this.addEquation(false, true);
  	this.redoFocusableList();
		this.redoNumericEquationStarters();
  	return this;
  }
  _.eq_id = 1;
  _.addEquation = function(focus, skip_focusable) {
  	// Add a new equation line to the solver list
		var html = '<div class="' + css_prefix + 'focusableItems"><span class="initial_guess" style="display:none;">' + focusableHTML('MathQuill',  'var' + this.eq_id) + '<span class="eqnum"></span></span>' + focusableHTML('MathQuill',  'eq' + this.eq_id) + '<span class="initial_guess" style="display:none;">,&nbsp;&nbsp;&nbsp;<span class="eqinit"></span>' + focusableHTML('MathQuill',  'start' + this.eq_id) + '</span>&nbsp;<i class="fa fa-remove ' + css_prefix + 'hide_print"></i></div>';
		this.jQ.find('.' + css_prefix + 'add_equation').before(html);
		this.eqFields.push(registerFocusable(MathQuill, this, 'eq' + this.eq_id, { ghost: 'equation', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}}));
		this.startFields.push(registerFocusable(MathQuill, this, 'start' + this.eq_id, { ghost: 'initial value', default: 0, handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}}));
		this.varFields.push(registerFocusable(MathQuill, this, 'var' + this.eq_id, { ghost: 'y' + this.eq_id, handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}}));
		this.varFields[this.varFields.length - 1].latex("y_{" + this.eq_id + "}");
		this.varFields[this.varFields.length - 1].variableEntryField(true);
		this.eqFields[this.number_of_equations].setExpressionMode(true);
		this.eq_id++;
		this.number_of_equations++;
		if(!skip_focusable) {
			this.redoFocusableList();
			this.redoNumericEquationStarters();
		}
		if(focus) this.eqFields[this.number_of_equations-1].focus(1);
  }
  _.removeEquation = function(index) {
  	index = index - 1;
  	if(this.eqFields[index].touched) this.changed();
  	this.eqFields.splice(index, 1);
  	this.startFields.splice(index, 1);
  	this.varFields.splice(index, 1);
  	this.jQ.find('.' + css_prefix + 'content').find('.' + css_prefix + 'focusableItems').each(function() {
  		var el = $(this);
  		if((el.attr('data-id')*1) == (index+1))
  			el.removeClass(css_prefix + 'focusableItems').slideUp({duration: 150, always: function() { el.remove(); } });
  	});
		this.number_of_equations--;
  	this.redoFocusableList();
		this.redoNumericEquationStarters();
  }
  _.redoNumericEquationStarters = function() {
  	var pre_syntax = ["'\\left(","\\right)="];
  	var init_syntax = ["\\operatorname{","}\\left({","}\\right)="];
  	var var_name = this.varField.latex() || 'x';
  	var init_cond = this.startField.latex() || '0';
  	var num = 0;
  	var _this = this;
  	var first_line = true;
  	this.jQ.find('.' + css_prefix + 'content').find('.' + css_prefix + 'focusableItems').each(function() {
  		if(first_line) { first_line = false; return; }
  		if(num >= _this.varFields.length) return;
  		$(this).find('.eqnum').html(_this.worksheet.latexToHtml(pre_syntax[0] + var_name + pre_syntax[1]));
  		$(this).find('.eqinit').html(_this.worksheet.latexToHtml(init_syntax[0] + _this.varFields[num].latex() + init_syntax[1] + init_cond + init_syntax[2]));
  		num++;
  	});
  }
  _.redoFocusableList = function() {
  	var id = 0;
  	// Renumber the DOM ids
  	this.jQ.find('.' + css_prefix + 'content').find('.' + css_prefix + 'focusableItems').each(function() {
  		$(this).attr('data-id', id);
  		id++;
  	});
  	// Recreate focusable Items array
		if(this.numeric_mode)
			this.focusableItems = [[this.varStoreField,this.command], [this.varFields[0], this.eqFields[0], this.startFields[0]]];
		else
			this.focusableItems = [[this.varStoreField,this.command], [this.eqFields[0]]];
		for(var i = 1; i < this.number_of_equations; i++) {
			if(this.numeric_mode)
				this.focusableItems.push([this.varFields[i], this.eqFields[i], this.startFields[i]]);
			else
				this.focusableItems.push([this.eqFields[i]]);
		}
		if(this.numeric_mode)
			this.focusableItems.push([this.varField, this.startField, this.endField, this.stepField]);
		else
			this.focusableItems.push([this.varField]);
		this.focusableItems.push([this.solver]);
		if(this.numeric_mode)
			this.jQ.find('.initial_guess').show();
		else
			this.jQ.find('.initial_guess').hide();
  }
	_.mouseClick = function(e) {
		var target = $(e.target);
		if(target.hasClass(css_prefix + 'add_equation')) {
			this.addEquation(true);
			return false;
		}
		if(target.hasClass('fa-remove')) {
			this.removeEquation(target.closest('div.' + css_prefix + 'focusableItems').attr('data-id')*1);
			this.needsEvaluation = true;
			this.submissionHandler(this)();
			return false;
		}
    if(super_.mouseClick.call(this,e)) return true;
	}

	_.submissionHandler = function(_this) {
		return function(mathField) {
			var step_var = _this.numeric_mode ? _this.varField.text() : _this.varField.text().replace(/^([a-z][a-z0-9_]*)\(([a-z][a-z0-9_]*)\)$/i,"$1, $2");
			_this.ignored_vars = GetIgnoredVars(step_var.split(","));
			if(_this.needsEvaluation) {
				// check for anything that is empty
				var errors = [];
				if(_this.varStoreField.text().trim().length && !_this.varStoreField.text().match(/^[a-z][a-z0-9_]*(\([a-z][a-z0-9_]*\))?$/i))
					errors.push('Invalid variable name (' + _this.worksheet.latexToHtml(_this.varStoreField.latex()) + ').  Please enter a valid variable name');
				else if(_this.varStoreField.text().trim().length && _this.numeric_mode && _this.varStoreField.text().match(/^[a-z][a-z0-9_]*\([a-z][a-z0-9_]*\)$/i)) {
					// Numeric mode does not return a function.  Drop the function declaration
          var varName = _this.varStoreField.text().replace(/^([a-z][a-z0-9_]*)\([a-z][a-z0-9_,]*\)$/i,"$1").replace(/_(.*)$/,"_{$1}");
          _this.varStoreField.clear().paste(varName);
				} else if(_this.varStoreField.text().trim().length && !_this.numeric_mode && _this.varStoreField.text().match(/^[a-z][a-z0-9_]*$/i)) {
					// Symbolic mode returns a function.  Add a function declaration
          var varName = _this.varStoreField.text().replace(/_(.*)$/,"_{$1}");
          _this.varStoreField.clear().paste("\\operatorname{" + varName + "}\\left({x}\\right)");
				}
				for(var i = 0; i < _this.eqFields.length; i++)
					if(_this.eqFields[i].empty()) errors.push('Equation ' + _this.numeric_mode ? ('y\'<sub>' + i + '</sub>') : (y+1) + ' is currently empty.  Please add an equation.');
				if(_this.numeric_mode) {
					// numeric solver odesolve
					if(!_this.varField.text().match(/^[a-z][a-z0-9_]*$/i))
						errors.push('Invalid variable name (' + _this.worksheet.latexToHtml(_this.varField.latex()) + ').  Please enter a valid dependant variable name.  Ex: x');
					for(var i = 0; i < _this.startFields.length; i++)
						if(_this.startFields[i].empty()) errors.push('Initial condition for y<sub>' + i + '</sub> is currently empty.  Please add an initial condition.');
					if(_this.endField.empty())
						errors.push('No end value provided.  Please enter a value to compute the differential equation to');
					var eqs = [];
					var eq_vars = [];
					var init_conditions = [];
					for(var i = 0; i < _this.eqFields.length; i++) {
						var v = _this.eqFields[i];
						var to_add = v.text(); 
						eqs.push(to_add); 
						if(to_add.match(/==/)) 
							errors.push("Invalid Expression for y<sub>" + i + "</sub>.  Expressions should not contain = signs."); 
						v = _this.startFields[i];
						to_add = v.text();
						init_conditions.push(to_add);
						v = _this.varFields[i];
						to_add = v.text();
						if(!to_add.match(/^[a-z][a-z0-9_]*$/i))
							errors.push("Invalid variable name (" + _this.worksheet.latexToHtml(v.latex()) + ").  Please correct this error to continue.");
						eq_vars.push(to_add);
					}
					// if they entered y(x) instead of y in the expression field, convert it:
					for(var i = 0; i < eq_vars.length; i++) {
						for(var j=0; j < eqs.length; j++) 
							eqs[j] = eqs[j].replace(new RegExp("([^a-zA-Z0-9])" + eq_vars[i] + "\\(" + step_var + "\\)",'g'),"$1" + eq_vars[i]).replace(new RegExp("^" + eq_vars[i] + "\\(" + step_var + "\\)",'g'),eq_vars[i]);
					}
					var var_command = step_var + '=' + _this.startField.text() + '..' + _this.endField.text() + ',';
					var step_command = _this.stepField.text() == '0' ? '' : (',tstep=' + _this.stepField.text());
					if(eqs.length > 1)
						var command = 'odesolve([' + eqs.join(', ') + '], ' + var_command + '[' + eq_vars.join(', ') + '],[' + init_conditions.join(', ') + ']' + step_command + ',curve)';
					else
						var command = 'odesolve(' + eqs[0].replace(/==/g,'=') + ', ' + var_command + eq_vars[0] + ',' + init_conditions[0] + step_command + ',curve)';
					// Convert answer back to input units.
					_this.commands = _this.genCommand('[val]');
					_this.commands[0].dereference = true;
					// BRENTAN: TODO: Any way to do a unit consistency check?
					// BRENTAN: TODO: The provided guess units should allow us to autoconvert the answer in to the desired units as well...*/
				} else {
					// symbolic solver desolve
					if(!_this.varField.text().match(/^[a-z][a-z0-9_]*\([a-z][a-z0-9_]*\)$/i))
						errors.push('Invalid function name (' + _this.worksheet.latexToHtml(_this.varField.latex()) + ').  Please enter a valid function with dependant variables.  Ex: f(x)');
					var eqs = [];
					$.each(_this.eqFields, function(i, v) { eqs.push(v.text()); });
					var var_command = _this.varField.text({default: 'f(x)'});
					if(eqs.length > 1)
						var command = 'desolve([' + eqs.join(', ').replace(/==/g,'=') + '], ' + var_command + ')';
					else
						var command = 'desolve(' + eqs[0].replace(/==/g,'=') + ', ' + var_command + ')';
					_this.commands = _this.genCommand('[val]');
					_this.commands[0].dereference = true;
				}
				_this.commands[0].restore_vars = step_var;
				if(errors.length && _this.outputMathBox) {
					_this.worksheet.save();
					_this.outputMathBox.clear();
					_this.setError(errors.join('<BR>'));
				} else {
					_this.dependent_vars = GetDependentVars(command, step_var.split(","));
					// Solve the equation, with special unit mode for the solver.  Result will be inserted in place of [val] in the next computation
					_this.commands.unshift({command: command, protect_vars: step_var, nomarkup: true }); 
					_this.evaluate();
					_this.needsEvaluation = false;
				}
			}
		};
	}
	_.evaluationFinished = function(result) {
		if(result[1].returned && result[1].success) {
			// Test for no result
			if(result[1].returned.match(/[\s]*\\begin{bmatrix[0-9]+}\\end{bmatrix[0-9]+}[\s]*/)) { 
				result[1].returned = ''; 
				result[1].warnings.push('No results found'); 
			} else {
				if(this.numeric_mode) {
					var to_add = "\\left\\{ " + this.varField.text({});
					for(var i = 0; i < this.number_of_equations; i++)
						to_add += ", " + this.varFields[i].latex();
					to_add += " \\right\\}"
				} else
					var to_add = this.varField.text();
				if(!result[1].returned.match(/Longrightarrow/))
					result[1].returned = to_add + " \\whitespace\\Longrightarrow \\whitespace " + result[1].returned;
			}
		}
		var to_return = super_.evaluationFinished.call(this, [result[1]]); // Transform to array with result 1 in spot 0, as that is what is expected in evaluationFinished
		this.last_result = result;
		return to_return;
	}
  _.getLastResult = function() {
    if(this.last_result && this.last_result[1] && this.last_result[1].success) return this.last_result[1].returned;
    return false;
  }
	_.changeToSymbolicMode = function() {
		this.numeric_mode = false;
		this.helpText = this.helpTextSymbolic;
		this.varField.setGhost('f(x)');
		this.redoFocusableList();
	}
	_.changeToNumericMode = function() {
		this.numeric_mode = true;
		this.helpText = this.helpTextNumeric;
		this.varField.setGhost('x');
		this.redoFocusableList();
		this.redoNumericEquationStarters();
	}
	// Callback for focusable items notifying that this element has been changed
	_.changed = function(el) {
		for(var i = 0; i < this.eqFields.length; i++)
			if(el === this.eqFields[i]) this.eqFields[i].touched = true;
		if(el === this.varField) {
			this.varField.touched = true;
			window.setTimeout(function(_this) { return function() { _this.redoNumericEquationStarters(); }; }(this));
		}
		if(el === this.startField)
			window.setTimeout(function(_this) { return function() { _this.redoNumericEquationStarters(); }; }(this));
		for(var i = 0; i < this.varFields.length; i++)
			if(el === this.varFields[i]) window.setTimeout(function(_this) { return function() { _this.redoNumericEquationStarters(); }; }(this));
		if(el === this.endField)
			this.endField.touched = true;
		if(el === this.solver) {
			if(this.solver.text() == 'symbolic') 
				this.changeToSymbolicMode();
			else 
				this.changeToNumericMode();
		}
		if(this.eqFields[0].touched && !this.eqFields[0].empty() && this.varField.touched)
			this.needsEvaluation = true;
	}
});