
var regression = P(SettableMathOutput, function(_, super_) {
	_.klass = ['regression'];
	_.mode = 'linear';
	_.function_of = 'x';
	_.helpText = "<<regression <[data]>>>\nWill find the best fit to the supplied data for the specified regression type:\nLinear: y = m*x + b\nPolynomial: y = a<sub>n</sub> * x<sup>n</sup> + ... + a<sub>2</sub> * x<sup>2</sup> + a<sub>1</sub> * x + a<sub>0</sub>\nPower: y = m * x ^ b\nExponential: y = a * e^(b * x)\nLogarithmic: y = a * ln(x) + b\nLogit Model: Find the logistic function y(x) whose derivative y'(x) best fits the provided data for y'(x) at x<sub>0</sub>, x<sub>0</sub>+1, x<sub>0</sub>+2,... given the value of x<sub>0</sub> and y(x<sub>0</sub>)";
	_.savedProperties = ['mode'];

	_.innerHtml = function() {
		var html = '<div class="' + css_prefix + 'focusableItems" data-id="0"><span class="firstline">x</span><sub>data</sub><span class="hidden show_logit" style="display:none;"> at x<sub>0</sub>, x<sub>0</sub>+1, x<sub>0</sub>+2,...</span><span class="equality">&#8801;</span>' + focusableHTML('MathQuill',  'xdata') + helpBlock() + '</div>'
	 	+ '<div class="' + css_prefix + 'focusableItems hide_logit" data-id="1">y<sub>data</sub><span class="equality">&#8801;</span>' + focusableHTML('MathQuill',  'ydata') + '</div>'
	 	+ '<div class="' + css_prefix + 'focusableItems hidden show_polynomial" data-id="2" style="display:none;">polynomial&nbsp;order&nbsp;' + focusableHTML('MathQuill',  'order') + '</div>'
	 	+ '<div class="' + css_prefix + 'focusableItems hidden show_logit" data-id="3" style="display:none;">x<sub>0</sub><span class="equality">&#8801;</span>' + focusableHTML('MathQuill',  'xo') + '</div>'
	 	+ '<div class="' + css_prefix + 'focusableItems hidden show_logit" data-id="4" style="display:none;">y(x<sub>0</sub>)<span class="equality">&#8801;</span>' + focusableHTML('MathQuill',  'yo') + '</div>'
	  + '<div class="' + css_prefix + 'focusableItems" data-id="5">' + focusableHTML('SelectBox',  'regression_type') + '</div>';
	  return this.wrapHTML('regression', html);
	}
	_.postInsertHandler = function() {
		this.xdata = registerFocusable(MathQuill, this, 'xdata', { ghost: 'data', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.ydata = registerFocusable(MathQuill, this, 'ydata', { ghost: 'data', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.order = registerFocusable(MathQuill, this, 'order', { ghost: 'n', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.xo = registerFocusable(MathQuill, this, 'xo', { ghost: '0', default: '0', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.yo = registerFocusable(MathQuill, this, 'yo', { ghost: '0', default: '0', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.regression_type = registerFocusable(SelectBox, this, 'regression_type', { options: { 
			linear: 'Linear Regression',
			polynomial: 'Polynomial Regression',
			power: 'Power Regression',
			exponential: 'Exponential Regression',
			logarithmic: 'Logarithmic Regression',
			logistic: 'Logit Model Regression'
		}});
		this.focusableItems = [[this.xdata] , [this.ydata], [this.regression_type]];
		this.needsEvaluation = false;
		super_.postInsertHandler.call(this);
		return this;
	}
  _.parseSavedProperties = function(args) {
  	super_.parseSavedProperties.call(this, args);
  	// After we do this, we want to set up the DOM correctly for the type of regression before rest of parse completes
  	this.redoFocusableList();
  	return this;
  }
  _.redoFocusableList = function() {
  	switch(this.mode) {
  		case 'logistic':
  			this.jQ.find('.hide_logit').addClass('hidden').hide();
  			this.jQ.find('.show_logit').removeClass('hidden').show();
  			this.jQ.find('.show_polynomial').addClass('hidden').hide();
  			this.jQ.find('.firstline').html("y'");
				this.focusableItems = [[this.varStoreField, this.command, this.xdata] , [this.xo], [this.yo], [this.regression_type]];
  			break;
  		case 'polynomial':
  			this.jQ.find('.show_logit').addClass('hidden').hide();
  			this.jQ.find('.hide_logit').removeClass('hidden').show();
  			this.jQ.find('.show_polynomial').removeClass('hidden').show();
  			this.jQ.find('.firstline').html("x");
				this.focusableItems = [[this.varStoreField, this.command, this.xdata] , [this.ydata], [this.order], [this.regression_type]];
  			break;
  		default:
  			this.jQ.find('.show_logit').addClass('hidden').hide();
  			this.jQ.find('.hide_logit').removeClass('hidden').show();
  			this.jQ.find('.show_polynomial').addClass('hidden').hide();
  			this.jQ.find('.firstline').html("x");
				this.focusableItems = [[this.varStoreField, this.command, this.xdata] , [this.ydata], [this.regression_type]];
  	}
  	var num = 0;
  	this.jQ.find('.' + css_prefix + 'content').find('.' + css_prefix + 'focusableItems').each(function() {
  		if(!$(this).hasClass('hidden')) {
  			$(this).attr('data-id',num);
  			num++;
  		}
  	});
  }
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.needsEvaluation) {
				// check for anything that is empty
				var errors = [];
				if(_this.varStoreField.text().trim().length && !_this.varStoreField.text().match(/^[a-z][a-z0-9_~]*\([a-z][a-z0-9_~]*\)$/i)) {
          if(_this.varStoreField.text().match(/^[a-z][a-z0-9_~]*$/i)) {
            // Need to turn in to a function definition
            var varName = window.SwiftCalcsLatexHelper.VarNameToLatex(_this.varStoreField.text());
            _this.varStoreField.clear().paste("\\operatorname{" + varName + "}\\left({x}\\right)");
          } else
					  errors.push('Invalid function name (' + _this.worksheet.latexToHtml(_this.varStoreField.latex()) + ').  Please enter a valid variable name');
        }
				var xdata_text = _this.xdata.text({});
				var ydata_text = _this.ydata.text({});
		  	switch(_this.mode) {
		  		case 'logistic':
						if(_this.xdata.empty())
							errors.push('No data for y\' provided.');
						var command = "evalf(" + _this.xdata.text({check_for_array: true}) + "), " + _this.xo.text({}) + ", " + _this.yo.text({});
		  			break;
		  		default:
						if(_this.xdata.empty())
							errors.push('No x data provided.');
						if(_this.ydata.empty())
							errors.push('No y data provided.');
						if((_this.mode == 'polynomial') && _this.order.empty())
							errors.push('No polynomial order provided.');
						var command = 'evalf(' + _this.xdata.text({check_for_array: true}) + "), evalf(" + _this.ydata.text({check_for_array: true}) + ")";
						if(_this.mode == 'polynomial') 
							command += ", " + _this.order.text({});
		  	}
				command = _this.mode  + '_regression(' + command + ')';
				var ind_var = _this.varStoreField.text().match(/\(/) ? _this.varStoreField.text().replace(/^([a-z][a-z0-9_~]*)\(([a-z][a-z0-9_~]*)\)$/i,"$2") : "x";
				_this.commands = _this.genCommand("[val]");
				_this.commands[0].dereference = true;
				_this.commands[0].force_simplify = 'expand';
				_this.commands[0].restore_vars = ind_var;
				if(errors.length && _this.outputMathBox) {
					_this.worksheet.save();
					_this.outputMathBox.clear();
					_this.setError(errors.join('<BR>'));
				} else {

					_this.dependent_vars = GetDependentVars(command);

					// Solve the equation, with special unit mode for the solver.  Result will be inserted in place of [val] in the next computation
					_this.commands.unshift({command: command, protect_vars: ind_var, nomarkup: true }); 
					_this.evaluate();
					_this.needsEvaluation = false;
				}
			}
		};
	}
	_.evaluationFinished = function(result) {
		if(result[1].returned && result[1].success) {
			var warnings = [];
			for(var i = 0; i < result[1].warnings; i++) 
				if(!result[1].warnings[i].match(/assignation is x_unit/) && !result[1].warnings[i].match(/declared as global/))
					warnings.push(result[1].warnings[i]);
			result[1].warnings = warnings;
		}
		var to_return = super_.evaluationFinished.call(this, [result[1]]); // Transform to array with result 1 in spot 0, as that is what is expected in evaluationFinished
		this.last_result = result;
		return to_return;
	}
  _.getLastResult = function(varname) {
    if(this.last_result && this.last_result[1] && this.last_result[1].success) return this.last_result[1].returned;
    return false;
  }
	// Callback for focusable items notifying that this element has been changed
	_.changed = function(el) {
		if(el === this.regression_type) {
			this.mode = el.text();
			this.redoFocusableList();
		}
		var all_touched = true;
		for(var i = 0; i < this.focusableItems.length; i++) {
			for(var j = 0; j < this.focusableItems[i].length; j++) {
				if(el === this.focusableItems[i][j]) this.focusableItems[i][j].touched = true;
				if(this.focusableItems[i][j].needs_touch) all_touched = all_touched && this.focusableItems[i][j].touched;
			}
		}
		if(all_touched)
			this.needsEvaluation = true;
	}
});