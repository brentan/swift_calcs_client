var plot_func = P(subplot, function(_, super_) {
	_.plot_type = 'plot_func';
	_.show_unit = false;
	_.c3_type = 'line';
	_.x_provided = true;
	_.show_points = false;
	_.savedProperties = subplotProperties.slice(0).concat(['show_unit']);
	_.helpText = "<<function plot>>\nPlot a function.  Provide the function to plot, as well as the independant variable to plot against.  For example, plot <[cos(x)]> as a function of <[x]>.\nHELP:23";

	_.innerHtml = function() {
		return super_.innerHtml.call(this).replace('YIELD','<div class="' + css_prefix + 'focusableItems" data-id="1">plot&nbsp;' + focusableHTML('MathQuill',  'eq0') + '&nbsp;as a function of&nbsp;' + focusableHTML('MathQuill',  'eq1') + '<span class="show_units" style="display:none;">&nbsp;with x-axis units of&nbsp;' + focusableHTML('MathQuill',  'unit_box') + '</span><span class="show_units_link explain">&nbsp;<a href="#">Add x-axis units</a></span></div>');
	}
	_.postInsertHandler = function() {
		this.eq0 = registerFocusable(MathQuill, this, 'eq0', { ghost: 'expression', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.eq1 = registerFocusable(MathQuill, this, 'eq1', { ghost: 'x', default: 'x', noWidth: true, handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.eq1.variableEntryField(true);
		this.unit_box = registerFocusable(MathQuill, this, 'unit_box', { noWidth: true, handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.unit_box.setUnitsOnly(true);

		this.focusableItems = [[this.eq0, this.eq1]];
		super_.postInsertHandler.call(this);
		var _this = this;
		this.jQ.find('.show_units_link a').on('click', function(e) {
			_this.showUnits(true);
			e.preventDefault();
			e.stopPropagation();
		})
		this.leftJQ.append('<span class="fa fa-line-chart"></span>');
	}
  _.parseSavedProperties = function(args) {
  	super_.parseSavedProperties.call(this, args);
  	if(this.show_unit) this.showUnits(); 
  	return this;
  }
	_.showUnits = function(focus) {
		this.show_unit = true;
		var index = this.focusableItems.length-1;
		if(this.focusableItems[index].length == 3) return; // Already Shown
		this.jQ.find('.show_units').show();
		this.jQ.find('.show_units_link').hide();
		this.focusableItems[index].push(this.unit_box);
		if(this.unit_box.text() == '') this.unit_box.cmd('\\Unit');
		if(focus) {
			this.focus(L);
			this.unit_box.focus(L);
		}
	}
  _.getUnitsCommands = function() {
		if(this.eq0.text().trim() == '') return [];
		var unit_command = this.show_unit && this.unit_box.text().length ? this.unit_box.text() : '1';
		var command1 = "latex(at(apply(" + this.eq1.text() + "->(evalf(mksa_base(" + this.eq0.text() + "))),[0.0000000016514245*" + unit_command + "]),0))"; // Evaluate at an x to find units...add something so that we dont get evaluation at 0
		var command2 = "latex(evalf(mksa_base(" + unit_command + ")))";
    return [{command: command1, nomarkup: true},{command: command2, nomarkup: true}];
  }
	_.createCommands = function() {
		if(this.eq0.text().trim() == '') return [];
		var min_val = this.parent.x_min === false ? (this.parent.calc_x_min === false ? ((-5 + this.parent.x_unit_offset) * this.parent.x_unit_conversion) : this.parent.calc_x_min) : ((this.parent.x_min + this.parent.x_unit_offset) * this.parent.x_unit_conversion);
		var max_val = this.parent.x_max === false ? (this.parent.calc_x_max === false ? (( 5 + this.parent.x_unit_offset) * this.parent.x_unit_conversion) : this.parent.calc_x_max) : ((this.parent.x_max + this.parent.x_unit_offset) * this.parent.x_unit_conversion);
		min_val = min_val - this.parent.x_unit_offset * this.parent.x_unit_conversion; // Remove offset...it is added back in by the giac plot function (used to deal with log plots of non-zero offsets!)
		max_val = max_val - this.parent.x_unit_offset * this.parent.x_unit_conversion;
		var x_unit = this.parent.x_unit ? window.SwiftCalcsLatexHelper.latexToUnit(this.parent.x_unit) : '1';
		if(x_unit.length == 2) x_unit = x_unit[0];
		else x_unit = '1';
		var unit_command = this.show_unit && this.unit_box.text().length ? this.unit_box.text() : '1';
		if(this.y_axis == 'y') {
			var y_min = this.parent.y_min === false ? false : ((this.parent.y_min + this.parent.y_unit_offset) * this.parent.y_unit_conversion);
			var y_max = this.parent.y_max === false ? false : ((this.parent.y_max + this.parent.y_unit_offset) * this.parent.y_unit_conversion);
		} else {
			var y_min = this.parent.y2_min === false ? false : ((this.parent.y2_min + this.parent.y2_unit_offset) * this.parent.y2_unit_conversion);
			var y_max = this.parent.y2_max === false ? false : ((this.parent.y2_max + this.parent.y2_unit_offset) * this.parent.y2_unit_conversion);
		}
    if(y_min === false) y_min = 1791.583; // Hack...basically a 'null' value to send along
    if(y_max === false) y_max = 1791.583;
		if(this.parent.x_log) {
			if(min_val <= 0) min_val = 1e-15;
			if(max_val <= 0) max_val = 2e-15;
		}
		var command3 = "plotfuncoffset";
		if((this.parent.y_log && (this.y_axis == 'y')) || (this.parent.y2_log && (this.y_axis == 'y2'))) {
			if(this.parent.x_log) command3 = 'plotfuncloglog';
			else command3 = 'plotfuncylog';
		} else if(this.parent.x_log) command3 = 'plotfunclog';
		command3 += "(" + this.eq0.text() + "," + this.eq1.text() + "=(" + min_val + "*" + x_unit + ")..(" + max_val +"*" + x_unit + ")" + ",y__limits=(" + y_min + ")..(" + y_max + "),nstep=600," + (this.parent.x_unit_offset * this.parent.x_unit_conversion) + ")"; 
		var command4 = "latex(at(apply(" + this.eq1.text() + "->(evalf(mksa_base(" + this.eq0.text() + "))),[0.0000000016514245*" + unit_command + "]),0))";
		this.dependent_vars = GetDependentVars(command3, [this.eq1.text()]);
		return [{command: command3, nomarkup: true },{command: command4, nomarkup: true }]
	}
  _.submissionHandler = function(_this) {
    return function(mathField) {
      _this.ignored_vars = GetIgnoredVars([_this.eq1.text()]);
      if(_this.needsEvaluation) {
        _this.commands = _this.createCommands();
        _this.altered_content = _this.newCommands();
        _this.parent.evaluate(true);
      }
    };
  }
	_.evaluationFinished = function(result) {
    if(this.parent.getUnits) {
      if(result[0].success) this.y_unit = result[0].returned;
      if(result[1].success) this.x_unit = result[1].returned;
    } else {
			if(result[0].success && result[1].success) {
				//try {
					var output = result[0].returned.replace(/[^0-9\.\-,e\[\]]/g,''); // Remove non-numeric characters
					//output = output.replace(/,,/g,',null,').replace(/\[,/g,'[null,').replace(/,\]/g,',null]');
					if(!output.match(/[0-9]/)) 
						this.outputBox.setError('No numeric results were returned and nothing will be plotted').expand();
					else {
						output = eval(output);
						this.xs = [];
						this.ys = [];
						for(var i = 0; i < output.length; i++) {
							this.xs.push(output[i][0]); 
							this.ys.push(output[i][1]);
						}
						if(((this.y_axis == 'y') && this.parent.y_log) || ((this.y_axis == 'y2') && this.parent.y2_log)) {
							for(var j=0; j<=this.ys.length; j++) {
								if(this.ys[j] <= 0) this.ys[j] = NaN;
							}
						}		
						if((this.y_axis == 'y' && (this.parent.y_min === false || this.parent.y_max === false)) || (this.y_axis == 'y2' && (this.parent.y2_min === false || this.parent.y2_max === false))) {
							// Suggest y_min and/or y_max.  Perform a numerical range trim search to find optimal plot range for viewable interest
							var big = 10;
							var y_prime = this.ys.slice(0);
							var altered_ys = this.ys.slice(0);
							//Find approximation for y_prime:
							if(altered_ys[0]!=undefined && altered_ys[1]!=undefined) y_prime[0] = (altered_ys[1] - altered_ys[0]) / (this.xs[1] - this.xs[0]);
							else y_prime[0] = undefined;
							if(altered_ys[y_prime.length-1]!=undefined && altered_ys[y_prime.length-2]!=undefined) y_prime[y_prime.length-1] = (altered_ys[y_prime.length-1] - altered_ys[y_prime.length-2]) / (this.xs[y_prime.length-1] - this.xs[y_prime.length-2]);
							else y_prime[y_prime.length-1] = undefined;
							for(var i = 1; i < (y_prime.length-1);i++) {
								if(altered_ys[i]!=undefined) {
									if(altered_ys[i-1]!=undefined && altered_ys[i+1]!=undefined) 
										y_prime[i] = 0.5*(altered_ys[i] - altered_ys[i-1])/(this.xs[i]-this.xs[i-1]) + 0.5*(altered_ys[i+1] - altered_ys[i])/(this.xs[i+1]-this.xs[i]);
									else if(altered_ys[i-1]!=undefined) 
										y_prime[i] = (altered_ys[i] - altered_ys[i-1])/(this.xs[i]-this.xs[i-1]);
									else if(altered_ys[i+1]!=undefined) 
										y_prime[i] = (altered_ys[i+1] - altered_ys[i])/(this.xs[i+1]-this.xs[i]);
									else 
										altered_ys[i]=undefined;
								} 
							}
							while(true) {
								var indexOfMaxValue = altered_ys.reduce((iMax, x, i, arr) => arr[iMax]!=undefined ? (x > arr[iMax] ? i : iMax) : i, 0);
								var indexOfMinValue = altered_ys.reduce((iMin, x, i, arr) => arr[iMin]!=undefined ? (x < arr[iMin] ? i : iMin) : i, 0);
								if(indexOfMaxValue == indexOfMinValue) break;
								var delta = (altered_ys[indexOfMaxValue] - altered_ys[indexOfMinValue]) / (this.xs[this.xs.length-1] - this.xs[0]);
								if(Math.abs(y_prime[indexOfMinValue])/delta > big) altered_ys[indexOfMinValue]=undefined;
								if(Math.abs(y_prime[indexOfMaxValue])/delta > big) altered_ys[indexOfMaxValue]=undefined;
								if(altered_ys[indexOfMinValue]!=undefined && altered_ys[indexOfMaxValue]!=undefined) break; // Things look good!
							}
							this.suggest_y_min = undefined;
							this.suggest_y_max = undefined;
							if(this.y_axis == 'y' && this.parent.y_min === false)
								this.suggest_y_min = this.parent.y_max ? (altered_ys[indexOfMinValue] > this.parent.y_max ? undefined : altered_ys[indexOfMinValue]) : altered_ys[indexOfMinValue];
							if(this.y_axis == 'y2' && this.parent.y2_min === false)
								this.suggest_y_min = this.parent.y2_max ? (altered_ys[indexOfMinValue] > this.parent.y2_max ? undefined : altered_ys[indexOfMinValue]) : altered_ys[indexOfMinValue];
							if(this.y_axis == 'y' && this.parent.y_max === false)
								this.suggest_y_max = this.parent.y_min ? (altered_ys[indexOfMaxValue] < this.parent.y_min ? undefined : altered_ys[indexOfMaxValue]) : altered_ys[indexOfMaxValue];
							if(this.y_axis == 'y2' && this.parent.y2_max === false)
								this.suggest_y_max = this.parent.y2_min ? (altered_ys[indexOfMaxValue] < this.parent.y2_min ? undefined : altered_ys[indexOfMaxValue]) : altered_ys[indexOfMaxValue];
						} else {
							this.suggest_y_min = undefined;
							this.suggest_y_max = undefined;
						}
						this.ys.unshift('data_' + this.id);
						this.xs.unshift('x_' + this.id);
						this.plot_me = true;
						this.outputBox.clearState().collapse();
					}
				//} catch(e) {
				//	this.outputBox.setError('Error evaluating function: Non-numeric results were returned and could not be plotted').expand();
				//}
			} else {
				var err = result[0].success ? result[1].returned : result[0].returned;
				if(err.match(/Incompatible units/)) {
					this.showUnits();
					this.outputBox.setError('Incompatible units.  Please check your equation to ensure unit balance, and if the x-axis has units, please enter the x-axis unit dimension.').expand();
				} else
					this.outputBox.setError(err).expand();
			}
		}
		return true;
	}
});
