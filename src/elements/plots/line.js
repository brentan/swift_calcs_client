var plot_line = P(subplot, function(_, super_) {
	_.plot_type = 'plot_line';
	_.show_points = true;
	_.helpText = "<<line plot>>\nPlot a line based on x and y data.  Provide the x and y data to plot.\nHELP:23";

	_.innerHtml = function() {
		return super_.innerHtml.call(this).replace('YIELD','<div class="' + css_prefix + 'focusableItems" data-id="1">x data:&nbsp;' + focusableHTML('MathQuill',  'eq0') + '</div><div class="' + css_prefix + 'focusableItems" data-id="2">y data:&nbsp;' + focusableHTML('MathQuill',  'eq1') + '</div>');
	}
	_.postInsertHandler = function() {
		this.eq0 = registerFocusable(MathQuill, this, 'eq0', { ghost: '[1,2,3,...]', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.eq1 = registerFocusable(MathQuill, this, 'eq1', { ghost: 'y data', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.eq0.touched = true;
		this.focusableItems = [[this.eq0],[this.eq1]];
		super_.postInsertHandler.call(this);
		var _this = this;
		this.leftJQ.append('<span class="fa fa-area-chart"></span>');
	}
	_.chart_type = function() {
		return {
			id: 'chart_type',
			html: 'Chart Type&nbsp;',
			title: 'Chart Type',
			sub: [
				{ html: (this.plot_type == 'plot_line' ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;Line Plot', method: function(el) { el.unselect().changeTo('plot_line').select() } },
				{ html: (this.plot_type == 'plot_area' ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;Area Plot', method: function(el) { el.unselect().changeTo('plot_area').select() } },
				{ html: (this.plot_type == 'plot_scatter' ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;Scatter Plot', method: function(el) { el.unselect().changeTo('plot_scatter').select() } },
			]
		};
	}
	_.getUnitsCommands = function() {
		var xs = this.eq0.text().trim();
		var commands = [
				{command: "latex(evalf(mksa_base_first(" + this.eq1.text({check_for_array: true}) + ")))", nomarkup: true}
			];
		if(xs.length) {
			this.x_provided = true;
			commands.push({command: "latex(evalf(mksa_base_first(" + this.eq0.text({check_for_array: true}) + ")))", nomarkup: true});
		} else
			this.x_provided = false;
		return commands;
	}
	_.createCommands = function() {
		var xs = this.eq0.text().trim();
		var commands = [
				{command: "mksa_remove(evalf(" + this.eq1.text({check_for_array: true}) + "))", nomarkup: true}
			];
		if(xs.length) {
			this.x_provided = true;
			commands.push({command: "mksa_remove(evalf(" + this.eq0.text({check_for_array: true}) + "))", nomarkup: true});
		} else
			this.x_provided = false;

		this.dependent_vars = [];
		for(var i = 0; i < commands.length; i++)
			this.dependent_vars = this.dependent_vars.concat(GetDependentVars(commands[i].command));
		return commands;
	}
	_.evaluationFinished = function(result) {
    if(this.parent.getUnits) {
      if(result[0].success) this.y_unit = result[0].returned;
      if(this.x_provided && result[1].success) this.x_unit = result[1].returned;
    } else {
			if(result[0].success && ((this.x_provided && result[1].success) || !this.x_provided)) {
				try {
					this.ys = '[' + result[0].returned.replace(/[^0-9\.\-,e]/g,'') + ']'; // Remove non-numeric characters
					this.ys = this.ys.replace(/,,/g,',null,').replace('[,','[null,').replace(',]',',null]');
					if(!this.ys.match(/[0-9]/)) {
						this.outputBox.setWarning('No numeric results were returned and nothing will be plotted').expand();
						return true;
					}
					this.ys = eval(this.ys);
					if(((this.y_axis == 'y') && this.parent.y_log) || ((this.y_axis == 'y2') && this.parent.y2_log)) {
						for(var j=0; j<=this.ys.length; j++) {
							if(this.ys[j] <= 0) this.ys[j] = NaN;
						}
					}
					if(this.x_provided) {
						this.xs = '[' + result[1].returned.replace(/[^0-9\.\-,e]/g,'') + ']'; // Remove non-numeric characters
						this.xs = this.xs.replace(/,,/g,',null,').replace('[,','[null,').replace(',]',',null]');
						if(!this.xs.match(/[0-9]/)) {
							this.outputBox.setWarning('No numeric results were returned and nothing will be plotted').expand();
							return true;
						}
						this.xs = eval(this.xs);
						if(this.parent.x_log) {
							for(var j=0; j<=this.xs.length; j++) {
								if(this.xs[j] <= 0) {
									this.xs.splice(j,1);
									this.ys.splice(j,1);
									j = j - 1;
								}
							}
						}
					} else {
						// NO x-array provided...thats ok, create one
						this.xs = [];
						for(var i = 1; i <= this.ys.length; i++)
							this.xs.push(i);
					}
					if(this.xs.length != this.ys.length) {
						this.outputBox.setWarning('Provided x and y vectors are of unequal lengths').expand();
						return true;
					}
					// Set parent x_min/x_max
					this.my_xmin = Math.min.apply(Math, this.xs);
					this.my_xmax = Math.max.apply(Math, this.xs);
					var extra = (this.my_xmax - this.my_xmin)*0.05;
					this.my_xmin = this.my_xmin - extra;
					this.my_xmax = this.my_xmax + extra;
					this.sets_x = true;
					this.parent.calc_x_min = this.parent.calc_x_min === false ? this.my_xmin : Math.min(this.my_xmin, this.parent.calc_x_min);
					this.parent.calc_x_max = this.parent.calc_x_max === false ? this.my_xmax : Math.max(this.my_xmax, this.parent.calc_x_max);
          this.suggest_y_min = (this.y_axis == 'y' && this.parent.y_min === false) || (this.y_axis == 'y2' && this.parent.y2_min === false) ? Math.min.apply(Math, this.ys) : undefined;
          this.suggest_y_max = (this.y_axis == 'y' && this.parent.y_max === false) || (this.y_axis == 'y2' && this.parent.y2_max === false) ? Math.max.apply(Math, this.ys) : undefined;
					this.plot_me = true;
					this.outputBox.clearState().collapse();
				} catch(e) {
					this.outputBox.setError('Error evaluating function: Non-numeric results were returned and could not be plotted').expand();
				}
			} else {
				var err = result[0].success ? result[1].returned : result[0].returned;
				this.outputBox.setError(err).expand();
			}
		}
		return true;
	}
});
var plot_line_stacked = P(plot_line, function(_, super_) {
	_.plot_type = 'plot_line_stacked';
	_.stack = true;
});
var plot_area = P(plot_line, function(_, super_) {
	_.plot_type = 'plot_area';
	_.area = true;
});
var plot_area_stacked = P(plot_area, function(_, super_) {
	_.plot_type = 'plot_area_stacked';
	_.stack = true;
});
var plot_scatter = P(plot_line, function(_, super_) {
	_.plot_type = 'plot_scatter';
	_.line_weight = 0;
});
