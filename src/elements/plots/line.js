var plot_line = P(subplot, function(_, super_) {
	_.plot_type = 'plot_line';
	_.c3_type = 'line';
	_.show_points = true;
	_.helpText = "<<line plot>>\nPlot a line based on x and y data.  Provide the x and y data to plot.";

	_.innerHtml = function() {
		return super_.innerHtml.call(this).replace('YIELD','<div class="' + css_prefix + 'focusableItems" data-id="2">x data:&nbsp;' + focusableHTML('MathQuill',  'eq0') + '</div><div class="' + css_prefix + 'focusableItems" data-id="3">y data:&nbsp;' + focusableHTML('MathQuill',  'eq1') + '</div>');
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
				{ html: (this.plot_type == 'plot_line_stacked' ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;Stacked Line Plot', method: function(el) { el.unselect().changeTo('plot_line_stacked').select() } },
				{ html: (this.plot_type == 'plot_area' ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;Area Plot', method: function(el) { el.unselect().changeTo('plot_area').select() } },
				{ html: (this.plot_type == 'plot_area_stacked' ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;Stacked Area Plot', method: function(el) { el.unselect().changeTo('plot_area_stacked').select() } },
				{ html: (this.plot_type == 'plot_scatter' ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;Scatter Plot', method: function(el) { el.unselect().changeTo('plot_scatter').select() } },
			]
		};
	}
	_.createCommands = function() {
		this.plot_me = false;
		var xs = this.eq0.text().trim();
		var commands = [
				{command: "latex(evalf(mksa_base_first(" + this.eq1.text({check_for_array: true}) + ")))", nomarkup: true},
				{command: "mksa_remove(evalf(" + this.eq1.text({check_for_array: true}) + "))", nomarkup: true}
			];
		if(xs.length) {
			this.x_provided = true;
			commands.push({command: "latex(evalf(mksa_base_first(" + this.eq0.text({check_for_array: true}) + ")))", nomarkup: true});
			commands.push({command: "mksa_remove(evalf(" + this.eq0.text({check_for_array: true}) + "))", nomarkup: true});
		} else
			this.x_provided = false;
		return commands;
	}
	_.evaluationFinished = function(result) {
		if(result[1].success && ((this.x_provided && result[3].success) || !this.x_provided)) {
			this.y_unit = result[0].returned;
			this.x_unit = this.x_provided ? result[2].returned : '1.0';
			try {
				this.ys = '[' + result[1].returned.replace(/[^0-9\.\-,e]/g,'') + ']'; // Remove non-numeric characters
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
					this.xs = '[' + result[3].returned.replace(/[^0-9\.\-,e]/g,'') + ']'; // Remove non-numeric characters
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
				this.parent.calc_x_min = this.parent.calc_x_min === false ? Math.min.apply(Math, this.xs) : Math.min(Math.min.apply(Math, this.xs), this.parent.calc_x_min);
				this.parent.calc_x_max = this.parent.calc_x_max === false ? Math.max.apply(Math, this.xs) : Math.max(Math.max.apply(Math, this.xs), this.parent.calc_x_max);
				this.ys.unshift('data_' + this.id);
				this.xs.unshift('x_' + this.id);
				this.plot_me = true;
				this.outputBox.clearState().collapse();
			} catch(e) {
				this.outputBox.setError('Error evaluating function: Non-numeric results were returned and could not be plotted').expand();
			}
		} else {
			var err = result[1].success ? result[3].returned : result[1].returned;
			this.outputBox.setError(err).expand();
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
	_.c3_type = 'area';
});
var plot_area_stacked = P(plot_area, function(_, super_) {
	_.plot_type = 'plot_area_stacked';
	_.stack = true;
});
var plot_scatter = P(plot_line, function(_, super_) {
	_.plot_type = 'plot_scatter';
	_.c3_type = 'scatter';
	_.line_weight = 0;
});
