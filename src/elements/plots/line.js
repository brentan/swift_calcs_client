var plot_line = P(subplot, function(_, super_) {
	_.plot_type = 'plot_line';
	_.helpText = "<<line plot>>\nPlot a data set on the y-axis, with points connected by a solid line.  Optional x-axis data can be used to specify locations for each point along the x-axis, otherwise 0,1,2,3... is assumed.";

	_.innerHtml = function() {
		return super_.innerHtml.call(this)
		  + '<div class="' + css_prefix + 'focusableItems" data-id="1">y-data:&nbsp;' + focusableHTML('MathQuill',  'eq0') + '</div>'
		  + '<div class="' + css_prefix + 'focusableItems" data-id="2">x-data:&nbsp;' + focusableHTML('MathQuill',  'eq1') + '</div>';
	}
	_.postInsertHandler = function() {
		this.eq0 = registerFocusable(MathQuill, this, 'eq0', { ghost: 'y-data', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.eq1 = registerFocusable(MathQuill, this, 'eq1', { ghost: 'x-data, optional', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[this.eq0],[this.eq1]];
		super_.postInsertHandler.call(this);
		this.leftJQ.append('<span class="fa fa-area-chart"></span>');
	}
});
