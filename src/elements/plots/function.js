var plot_func = P(subplot, function(_, super_) {
	_.plot_type = 'plot_func';
	_.show_unit = false;
	_.c3_type = 'line';
	_.x_provided = true;
	_.show_points = false;
	_.savedProperties = subplotProperties.slice(0).concat(['show_unit']);
	_.helpText = "<<function plot>>\nPlot a function.  Provide the function to plot, as well as the independant variable to plot against.  For example, plot <[cos(x)]> as a function of <[x]>.";

	_.innerHtml = function() {
		return super_.innerHtml.call(this).replace('YIELD','<div class="' + css_prefix + 'focusableItems" data-id="2">plot&nbsp;' + focusableHTML('MathQuill',  'eq0') + '&nbsp;as a function of&nbsp;' + focusableHTML('MathQuill',  'eq1') + '<span class="show_units" style="display:none;">&nbsp;with x-axis units of&nbsp;' + focusableHTML('MathQuill',  'unit_box') + '</span><span class="show_units_link explain">&nbsp;<a href="#">Add x-axis units</a></span></div>');
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
	_.continueEvaluation = function(evaluation_id, move_to_next) {
		if(this.shouldBeEvaluated(evaluation_id))
			this.commands = this.createCommands();
		return super_.continueEvaluation.call(this, evaluation_id, move_to_next);
	}
	_.createCommands = function() {
		this.plot_me = false;
		if(this.eq0.text().trim() == '') return [];
		this.xs = [];
		var resolution = 300;
		var min_val = this.parent.x_min === false ? (-5 * this.parent.x_unit_conversion) : (this.parent.x_min * this.parent.x_unit_conversion);
		var max_val = this.parent.x_max === false ? (5 * this.parent.x_unit_conversion) : (this.parent.x_max * this.parent.x_unit_conversion);
		for(var i = 0; i <= resolution; i++) 
			this.xs.push(i*(max_val - min_val)/resolution + min_val);
		var unit_command = this.show_unit && this.unit_box.text().length ? this.unit_box.text() : '1';
		var command1 = "latex(apply(" + this.eq1.text() + "->(evalf(mksa_base(" + this.eq0.text() + "))),[" + this.xs[0] + "*" + unit_command + "])[0])"; // Evaluate at the first x to find units
		var command2 = "apply(" + this.eq1.text() + "->(evalf(mksa_remove(" + this.eq0.text() + "))),[" + this.xs.join(',') + "]" + "*mksa_base(" + unit_command + "))";
		var command3 = "latex(evalf(mksa_base(" + unit_command + ")))";
		this.xs.unshift('x_' + this.id);
		return [{command: command1, nomarkup: true},{command: command2, nomarkup: true},{command: command3, nomarkup: true}]
	}
	_.evaluationFinished = function(result) {
		this.needsEvaluation = false;
		this.neverEvaluated = false;
		if(result[0].success && result[1].success) {
			this.y_unit = result[0].returned;
			this.x_unit = result[2].returned;
			try {
				this.ys = '[' + result[1].returned.replace(/[^0-9\.\-,e]/g,'') + ']'; // Remove non-numeric characters
				this.ys = this.ys.replace(/,,/g,',null,').replace('[,','[null,').replace(',]',',null]');
				if(!this.ys.match(/[0-9]/))
					this.outputBox.setWarning('No numeric results were returned and nothing will be plotted').expand();
				else {
					this.ys = eval(this.ys);
					this.ys.unshift('data_' + this.id);
					this.plot_me = true;
					this.outputBox.clearState().collapse();
				}
			} catch(e) {
				this.outputBox.setError('Error evaluating function: Non-numeric results were returned and could not be plotted').expand();
			}
		} else {
			var err = result[0].success ? result[1].returned : result[0].returned;
			if(err.match(/Incompatible units/)) {
				this.showUnits();
				this.outputBox.setError('Incompatible units.  Plrease check your equation to ensure unit balance, and if the x-axis has units, please enter the x-axis unit dimension.').expand();
			} else
				this.outputBox.setError(err).expand();
		}
		return true;
	}
});
