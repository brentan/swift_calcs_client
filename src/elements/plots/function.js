var plot_func = P(subplot, function(_, super_) {
	_.plot_type = 'plot_func';
	_.c3_type = 'line';
	_.show_points = false;
	_.helpText = "<<function plot>>\nPlot a function.  Provide the function to plot, as well as the independant variable to plot against.  For example, plot <[cos(x)]> as a function of <[x]>.";

	_.innerHtml = function() {
		return super_.innerHtml.call(this).replace('YIELD','<div class="' + css_prefix + 'focusableItems" data-id="2">plot&nbsp;' + focusableHTML('MathQuill',  'eq0') + '&nbsp;as a function of&nbsp;' + focusableHTML('MathQuill',  'eq1') + '</div>');
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
		this.focusableItems = [[this.eq0, this.eq1]];
		super_.postInsertHandler.call(this);
		this.leftJQ.append('<span class="fa fa-line-chart"></span>');
	}
	_.createCommands = function() {
		// BRENTAN: DEAL WITH UNITS!
		this.plot_me = false;
		if(this.eq0.text().trim() == '') return [];
		this.xs = [];
		var resolution = 300;
		for(var i = 0; i <= resolution; i++) 
			this.xs.push(i*(this.parent.x_max - this.parent.x_min)/resolution + this.parent.x_min);
		var command = "apply(" + this.eq1.text() + "->(evalf(" + this.eq0.text() + ")),[" + this.xs.join(',') + "])";
		this.xs.unshift('x_' + this.id);
		return [{command: command, nomarkup: true}]
	}
	_.evaluationFinished = function(result) {
		if(result[0].success) {
			// BRENTAN: UNITS!
			try {
				this.ys = '[' + result[0].returned.replace(/[^0-9\.\-,e]/g,'') + ']'; // Remove non-numeric characters
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
			this.outputBox.setError(result[0].returned).expand();
		}
		return true;
	}
});
