var plot_bar = P(barplot, function(_, super_) {
	_.plot_type = 'plot_bar';
	_.helpText = "<<bar plot>>\nPlot a Bar Graph based on data.  To assign labels to the data, click on the x-axis.\nHELP:23";

	_.innerHtml = function() {
		return super_.innerHtml.call(this).replace('YIELD','<div class="' + css_prefix + 'focusableItems" data-id="1">data:&nbsp;' + focusableHTML('MathQuill',  'eq1') + '</div>');
	}
	_.postInsertHandler = function() {
		this.eq1 = registerFocusable(MathQuill, this, 'eq1', { ghost: 'y data', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[this.eq1]];
		super_.postInsertHandler.call(this);
		var _this = this;
		this.leftJQ.append('<span class="fa fa-bar-chart"></span>');
	}
	_.getUnitsCommands = function() {
		return [
			{command: "latex(evalf(mksa_base_first(" + this.eq1.text({check_for_array: true}) + ")))", nomarkup: true},
		];
	}
	_.createCommands = function() {
		var command = "mksa_remove(evalf(" + this.eq1.text({check_for_array: true}) + "))";
		this.dependent_vars = GetDependentVars(command);
		return [
			{command: command, nomarkup: true}
		];
	}
	_.evaluationFinished = function(result) {
		if(this.parent.getUnits) {
			if(result[0].success) this.y_unit = result[0].returned;
		} else {
			if(result[0].success) {
				try {
					this.ys = '[' + result[0].returned.replace(/[^0-9\.\-,e]/g,'') + ']'; // Remove non-numeric characters
					this.ys = this.ys.replace(/,,/g,',null,').replace('[,','[null,').replace(',]',',null]');
					if(!this.ys.match(/[0-9]/)) {
						this.outputBox.setWarning('No numeric results were returned and nothing will be plotted').expand();
						return true;
					}
					this.ys = eval(this.ys);
          this.suggest_y_min = (this.y_axis == 'y' && this.parent.y_min === false) || (this.y_axis == 'y2' && this.parent.y2_min === false) ? Math.min.apply(Math, this.ys) : undefined;
          this.suggest_y_max = (this.y_axis == 'y' && this.parent.y_max === false) || (this.y_axis == 'y2' && this.parent.y2_max === false) ? Math.max.apply(Math, this.ys) : undefined;
					this.plot_me = true;
					this.outputBox.clearState().collapse();
				} catch(e) {
					this.outputBox.setError('Error evaluating function: Non-numeric results were returned and could not be plotted').expand();
				}
			} else {
				this.outputBox.setError(result[0].returned).expand();
			}
		}
		return true;
	}
});
var plot_bar_stacked = P(plot_bar, function(_, super_) {
	_.plot_type = 'plot_bar_stacked';
	_.stack = true;
});