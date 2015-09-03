/*
Box to create a plot.  The 'plot' element draws the plot, but its the children of the plot element that are used to set options for each dataset
*/
var plot = P(Element, function(_, super_) {
	var X_AXIS = 0, Y_AXIS = 1, Y2_AXIS = 2;
	_.lineNumber = true;
	_.klass = ['plot'];
	_.evaluatable = true;
	_.hasChildren = true;
	_.savedProperties = ['chart_title', 'x_min','x_max','x_label','y_min','y_max','y_label','y2_min','y2_max','y2_label', 'x_labels'];
	_.x_min = false;
	_.x_max = false;
	_.x_label = false;
	_.x_labels = false;
	_.y_min = false;
	_.y_max = false;
	_.y_label = false;
	_.y2_min = false;
	_.y2_max = false;
	_.y2_label = false;
	_.chart_title = false;
	_.height = 300;
	_.plotBox = false;
	_.helpText = "<<plot>>\nCreate a plot of data and functions.  Insert new data to plot with the 'add another item' link, and adjust the properties of each data-set, such as color or line thickness, by clicking on the item in the plot.";

	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'plot') + helpBlock()
		   + '</div><div class="' + css_prefix + 'insert ' + css_prefix + 'hide_print"></div><div class="another_link explain ' + css_prefix + 'hide_print" style="margin-left: 60px;"><a href="#">Add another item</a></div><div class="' + css_prefix + 'plot_box"></div>';
	}
	_.init = function(default_type) {
		if(default_type)
			this.implicitType = function() { return elements[default_type](); };
		super_.init.call(this);
	}
	_.postInsertHandler = function() {
		this.focusableItems = [[registerFocusable(CodeBlock,this, 'plot', { })],[-1]];
		super_.postInsertHandler.call(this);
		var _this = this;
		if(this.jQ) this.jQ.find('.another_link a').on('click', function(e) {
			_this.implicitType().appendTo(_this).show(250).focus(L);
			e.preventDefault();
			e.stopPropagation();
		});
		return this;
	}
  _.toString = function() {
  	return '{plot}{{' + this.argumentList().join('}{') + '}}';
  }
	_.validateChild = function(child) {
		return (child instanceof subplot);
	}
	_.implicitType = function() { 
		return plot_func();
	}
	_.collapse = function(immediately) {
		this.jQ.find('.another_link').hide();
		return super_.collapse.call(this, immediately);
	}
	_.expand = function(immediately) {
		this.jQ.find('.another_link').show();
		return super_.expand.call(this, immediately);
	}
	_.blur = function(to_focus) {
		this.try_collapse(to_focus);
		return super_.blur.call(this, to_focus);
	}
	_.focus = function(dir) {
		super_.focus.call(this, dir);
		if(dir == 0)
			this.ends[L].focus(L);
		return this;
	}
	_.try_collapse = function(el) {
		// See if the el that is being focused is me or a child of me.  If so, we do not collapse
		if(this === el) return;
		if(this.jQ.hasClass(css_prefix + 'selected')) return;
		var children = this.children();
		for(var i = 0; i < children.length; i++) {
			if(children[i] === el) return;
			if(children[i].jQ.hasClass(css_prefix + 'selected')) return;
			if(children[i].jQ.hasClass('error')) return;
		}
		this.collapse();
	}
	_.addSpinner = function(eval_id) {
		super_.addSpinner.call(this, eval_id);
		if(this.plotBox)
			this.plotBox = this.plotBox.destroy();
		this.jQ.find('.' + css_prefix + 'plot_box').html('<div class="explain" style="text-align:center;margin:3px 20px;padding:10px;border:1px solid #dddddd;border-radius:6px;">Generating Plot...</div>');
	}
	_.childrenEvaluated = function(evaluation_id) {
		// Draw the plot, if there is anything to plot
		if(this.plotBox)
			this.plotBox = this.plotBox.destroy();
		var columns = [];
		this.has_bar = false;
		var ignore_custom_xs = false;
		var xs = {};
		var types = {};
		var groups_y = [];
		var groups_y2 = []; 
		var show_points = {};
		var marker_size = {};
		var names = {};
		var colors = {};
		var els = {};
		var axes = {};
		var children = this.children();
		var x_ticks = [];
		var x_max = this.x_max === false ? 5 : this.x_max; // BRENTAN: Process non function items first to determine auto x scale
		var x_min = this.x_min === false ? -5 : this.x_min;
		var x_tick_order = eval('1e' + (x_max - x_min).toExponential().replace(/^.*e/,'')*1+1);
		for(var i = 0; i <= 20; i++) 
			x_ticks.push(i*(x_max - x_min)/20 + x_min);
		var show_y2 = false;
		for(var i = 0; i < children.length; i++) {
			if(!children[i].plot_me) continue;
			if(children[i] instanceof plot_bar) {
				this.has_bar = true;
				ignore_custom_xs = true;
			}
			columns.push(children[i].ys);
			els['data_' + children[i].id] = children[i];
			if(!ignore_custom_xs) {
				xs['data_' + children[i].id] = 'x_' + children[i].id;
				columns.push(children[i].xs);
			}
			if(ignore_custom_xs && children[i].x_provided) {
				this.expand();
				children[i].outputBox.setWarning('X-data ignored.  Data is plotted with a bar chart, which assumes a monotonic x-axis.').expand();
			}
			if(children[i].spline) 
				types['data_' + children[i].id] = (children[i].c3_type === 'area') ? 'area-spline' : 'spline';
			else
				types['data_' + children[i].id] = children[i].c3_type;
			axes['data_' + children[i].id] = children[i].y_axis;
			if(children[i].y_axis == 'y2') show_y2 = true;
			show_points['data_' + children[i].id] = children[i].show_points;
			names['data_' + children[i].id] = children[i].name();
			marker_size['data_' + children[i].id] = children[i].marker_size;
			if(children[i].color) colors['data_' + children[i].id] = children[i].color;
			if(children[i].stack) {
				if(children[i].y_axis == 'y') 
					groups_y.push('data_' + children[i].id);
				else
					groups_y2.push('data_' + children[i].id);
			}
		}
		if(columns.length) {
			var _this = this;
			this.jQ.find('.' + css_prefix + 'plot_box').prev('div.plot_title').remove();
			var title_div = $('<div/>').addClass('plot_title');
			if(this.chart_title === false) {
				title_div.addClass('no_title').addClass(css_prefix + 'hide_print').html('<span class="title_span">Add a Title</span>');
			} else {
				title_div.html('<span class="title_span">' + this.chart_title + '</span>');
			}
			title_div.insertBefore(this.jQ.find('.' + css_prefix + 'plot_box'));
			title_div.find('span.title_span').on('click', function(e) {
				title_div.html('<input type="text">');
				title_div.find('input').val(_this.chart_title === false ? '' : _this.chart_title).focus().on('blur', function() {
					var title = $(this).val().trim();
					if(title == '') title = false;
					_this.chart_title = title;
					_this.childrenEvaluated();
					_this.worksheet.save();
				});
				e.preventDefault();
				e.stopPropagation();
			});
			this.jQ.find('.' + css_prefix + 'plot_box').html('');
			this.plotBox = c3.generate({
				bindto: this.jQ.find('.' + css_prefix + 'plot_box')[0],
				size: { height: this.height },
				axis: {
					x: { 
						tick: (ignore_custom_xs ? {} : { values: x_ticks, format: function (d) { return Math.ceil(d * x_tick_order) /x_tick_order } }),
						label: { text: (this.x_label ? this.x_label : 'Add a label'), position: 'outer-center'}, 
						min: ((this.x_min === false) || ignore_custom_xs ? undefined : this.x_min),
						max: ((this.x_max === false) || ignore_custom_xs ? undefined : this.x_max),
						categories: this.x_labels && this.has_bar ? this.x_labels.split('__s__') : [],
						type: this.x_labels && this.has_bar ? 'category' : 'indexed'
					},
					y: { 
						label: { text: (this.y_label ? this.y_label : 'Add a label'), position: 'outer-middle'},
						min: (this.y_min === false ? undefined : this.y_min),
						max: (this.y_max === false ? undefined : this.y_max),
					},
					y2: { 
						label: { text: (this.y2_label ? this.y2_label : 'Add a label'), position: 'outer-middle'}, 
						min: (this.y2_min === false ? undefined : this.y2_min),
						max: (this.y2_max === false ? undefined : this.y2_max),
						show: show_y2
					}
				},
				data: {
					xs: xs,
					columns: columns,
					types: types,
					groups: [groups_y, groups_y2],
					axes: axes,
					names: names,
					colors: colors,
					onclick: function(d, el) { els[d.id].select(); }
				},
				legend: {
				  item: {
				    onclick: function (id) { els[id].select(); }
				  }
				},
				point: {
					show: function(d) { if(show_points[d.id]) { return 1; } else { return 0; } },
					r: function(d) { return marker_size[d.id]; }
				},
		    grid: {
		        x: (ignore_custom_xs ? {} : { lines: [{value: 0}] }),
		        y: { lines: [{value: 0}] },
		        lines: { front: false }
		    }
			});
			var el = $(this.plotBox.element);
			el.find('.c3-axis-x, .c3-axis-y, .c3-axis-y2').find('.tick text').hover(function() {
				$(this).closest('.c3-axis').find('.tick text').css('text-decoration', 'underline');
			}, function() {
				$(this).closest('.c3-axis').find('.tick text').css('text-decoration', 'none');
			});
			el.find('.c3-axis-x, .c3-axis-y, .c3-axis-y2').on('click', function(e) { 
				var target = $(e.target);
				var axis = X_AXIS;
				if(target.closest('.c3-axis-y').length) axis = Y_AXIS;
				if(target.closest('.c3-axis-y2').length) axis = Y2_AXIS;
				_this.setAxis(axis);
				e.preventDefault();
				e.stopPropagation();
			});
			// Setup axes styling
			if(this.x_label === false) 
				el.find('.c3-axis-x-label').addClass(css_prefix + 'hide_print').css('fill','#bbbbbb').hover(function() { $(this).css('fill','#454545').css('text-decoration', 'underline'); }, function() { $(this).css('fill', '#bbbbbb').css('text-decoration', 'none'); });
			else 
				el.find('.c3-axis-x-label').hover(function() { $(this).css('text-decoration', 'underline'); }, function() { $(this).css('text-decoration', 'none'); });
			if(this.y_label === false) 
				el.find('.c3-axis-y-label').addClass(css_prefix + 'hide_print').css('fill','#bbbbbb').hover(function() { $(this).css('fill','#454545').css('text-decoration', 'underline'); }, function() { $(this).css('fill', '#bbbbbb').css('text-decoration', 'none'); });
			else 
				el.find('.c3-axis-y-label').hover(function() { $(this).css('text-decoration', 'underline'); }, function() { $(this).css('text-decoration', 'none'); });
			if(this.y2_label === false) 
				el.find('.c3-axis-y2-label').addClass(css_prefix + 'hide_print').css('fill','#bbbbbb').hover(function() { $(this).css('fill','#454545').css('text-decoration', 'underline'); }, function() { $(this).css('fill', '#bbbbbb').css('text-decoration', 'none'); });
			else 
				el.find('.c3-axis-y2-label').hover(function() { $(this).css('text-decoration', 'underline'); }, function() { $(this).css('text-decoration', 'none'); });
			el.find('.c3-legend-item').hover(function() { $(this).find('text').css('text-decoration', 'underline'); }, function() { $(this).find('text').css('text-decoration', 'none'); });
			$.each(this.children(), function(i, child) {
				el.find('.c3-line-data-' + child.id).css('stroke-width',child.line_weight).css('stroke-dasharray', child.line_style.replace(/_/g,','));
				if(child.selected)
					child.addSelectLine();
			});
			//BRENTAN: Check x_unit and y_unit of each subplot and add labels as needed.  Need ability to change unit scaling for the axis, and report for incompatible units!
		} else
			this.jQ.find('.' + css_prefix + 'plot_box explain').html('No plot data to draw.  Please setup a data series to plot.');
		if(evaluation_id)
			this.evaluateNext(evaluation_id, this.move_to_next);
	}
	_.children = function() { 
		var kids = super_.children.call(this);
		var functions = [];
		var bars = [];
		var circles = [];
		var others = [];
		for(var i = 0; i < kids.length; i++) {
			if(kids[i] instanceof plot_func) functions.push(kids[i]); 
			else if(kids[i] instanceof plot_bar) bars.push(kids[i]);
			else if(kids[i] instanceof plot_bar) circles.push(kids[i]); // BRENTAN CHANGE TO PIE
			else others.push(kids[i]);
		}
		return bars.concat(circles).concat(others).concat(functions);
	}
	_.command = function(command, value) {
		switch(command) { 
			case 'mathMode':
        math().insertAfter(this).show(0).focus(-1);
        break;
			case 'textMode':
        text().insertAfter(this).show(0).focus(-1);
        break;
		}
		this.worksheet.save();
	}
	_.mouseClick = function(e) {
		if(super_.mouseClick.call(this,e)) return true;
		// Test for click on plot pulldown
		var $el = $(e.target);
		if($el.closest('div.' + css_prefix + 'plot_box.c3').length) 
			this.worksheet.attachToolbar(this, this.worksheet.toolbar.plotToolbar(this, {}, { marker_size:true, line_weight:true, line_style:true, color:true, label:true, y_axis:true, hide_on_plot_only:true}));
		return false;
	}
	_.setAxis = function(axis) {
		window.showPopupOnTop();
		var axis_name = ['X', 'Y', 'Secondary Y'];
		var _this = this;
		$('.popup_dialog .full').html('<div class="title">' + axis_name[axis] + ' axis</div><div><strong>' + axis_name[axis] + ' Label</strong><br><input type="text" class="label"></div><BR><div><strong>' + axis_name[axis] + ' Minimum</strong><br><input type="text" class="min"><BR><span class="explain">Leave blank for auto axis</span></div><div><strong>' + axis_name[axis] + ' Maximum</strong><br><input type="text" class="max"><BR><span class="explain">Leave blank for auto axis</span></div>');
		if(this.has_bar && (axis == X_AXIS)) 
			$('.popup_dialog .full').append('<div><strong>' + axis_name[axis] + ' Data Labels</strong><br><input type="text" class="labels"><BR><span class="explain">Comma seperated list of labels for each data bar.</span></div>');
		min_vals = [this.x_min, this.y_min, this.y2_min];
		max_vals = [this.x_max, this.y_max, this.y2_max];
		labels = [this.x_label, this.y_label, this.y2_label];
		if(labels[axis] !== false) $('.popup_dialog').find('input.label').val(labels[axis]);
		if(min_vals[axis] !== false) $('.popup_dialog').find('input.min').val(min_vals[axis]);
		if(max_vals[axis] !== false) $('.popup_dialog').find('input.max').val(max_vals[axis]);
		if(this.has_bar && (axis == X_AXIS) && this.x_labels) 
			$('.popup_dialog').find('input.labels').val(this.x_labels.replace(/__s__/g,', '));
    var links = $('.popup_dialog .bottom_links').html('<button class="close grey">Close</button>');
		$('<button class="ok">Ok</button>').on('click', function(e) {
			var label = $('.popup_dialog').find('input.label').val().trim();
			var min_val = $('.popup_dialog').find('input.min').val().trim();
			var max_val = $('.popup_dialog').find('input.max').val().trim();
			if(label == '') label = false;
			if(min_val == '') min_val = false; 
			else min_val = min_val * 1;
			if(max_val == '') max_val = false; 
			else max_val = max_val * 1;
			switch(axis) {
				case X_AXIS:
					_this.x_label = label;
					_this.x_min = min_val;
					_this.x_max = max_val;
					if(_this.has_bar) {
						_this.x_labels = $('.popup_dialog').find('input.labels').val().trim().replace(/,[ ]?/g,'__s__');
						if(_this.x_labels == '') _this.x_labels = false;
					} else
						_this.x_labels = false;
					break;
				case Y_AXIS:
					_this.y_label = label;
					_this.y_min = min_val;
					_this.y_max = max_val;
					break;
				case Y2_AXIS:
					_this.y2_label = label;
					_this.y2_min = min_val;
					_this.y2_max = max_val;
					break;
			}
			window.hidePopupOnTop();
			_this.worksheet.save();
			_this.childrenEvaluated();
		}).prependTo(links);
	}
	_.choose = function(id) {
		// Select a particular child
		var children = this.children();
		var to_select = false;
		for(var i = 0; i < children.length; i++) {
			if(children[i].id == id) var to_select = children[i];
			children[i].unselect();
		}
		if(to_select === false) {
			// Add new
			this.implicitType().appendTo(this).show(0).focus(L);
			this.expand();
		} else
			to_select.select();
	}
});

/* object that is a child element of 'plot', allows multiple subplots on a single plot */
/* subplot is a generic class used to generate the subplot types.  It should never be called by iteself */
var subplotProperties = ['spline', 'show_points','line_weight','marker_size','line_style','color', 'y_axis'];
var subplot = P(EditableBlock, function(_, super_) {
	_.evaluatable = true;
	_.plot_me = false;
	_.stack = false;
	_.spline = false;
	_.show_points = true;
	_.line_weight = 1;
	_.x_provided = false;
	_.color = false;
	_.y_axis = 'y';
	_.line_style = 'none';
	_.marker_size = 2.5;
	_.savedProperties = subplotProperties;
	_.validateParent = function(parent) {
		return (parent instanceof plot);
	}
	_.choose = function(id) {
		this.parent.choose(id);
	}
	_.empty = function() {
		return false; // Since we are special type of block, we don't want auto destroyers and auto-to-math things happening
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">Plot Type: ' + focusableHTML('SelectBox',  'plot_type') + helpBlock() + '</div>'
		  + '<div class="' + css_prefix + 'focusableItems" data-id="1">Data Label: <div class="' + css_prefix + 'command_border">' + focusableHTML('CommandBlock',  'plot_label') + '&nbsp;</div></div>YIELD' + answerSpan();
	}
	_.postInsertHandler = function() {
		this.selectBox = registerFocusable(SelectBox, this, 'plot_type', { blank_message: 'Choose Plot Type', options: 
			{ 
				plot_func: 'Function',
			 	plot_line: 'Line Plot',
			 	plot_line_stacked: 'Stacked Line Plot',
			 	plot_area: 'Area Plot',
			 	plot_area_stacked: 'Stacked Area Plot',
			 	plot_scatter: 'Scatter Plot',
			 	plot_bar: 'Bar Chart',
			 	plot_bar_stacked: 'Stacked Bar Chart',
			}
		});
		this.selectBox.paste(this.plot_type);
		var _this = this;
		this.label = registerFocusable(CommandBlock, this, 'plot_label', { editable: true, handlers: {blur: function(el) { _this.parent.childrenEvaluated(); } } })
		this.focusableItems.unshift([this.label]);
		this.focusableItems.unshift([this.selectBox]);
		super_.postInsertHandler.call(this);
	}
	_.name = function() {
		var name = this.label.toString().trim();
		if(name == '') return 'data_' + this.id;
		return name;
	}
	_.enterPressed = function(_this) {
		return function(item) {
			_this.submissionHandler(_this)();
			var next_time = false;
			var selected = false;
			for(var i = 0; i < _this.focusableItems.length; i++) {
				for(var j = 0; j < _this.focusableItems[i].length; j++) {
					if(next_time) {
						_this.focusableItems[i][j].focus(-1);
						selected = true;
						break;
					}
					if(_this.focusableItems[i][j] === item) next_time = true;
				}
				if(selected) break;
			}
			if(!selected) {
				if(_this[R])
					_this[R].focus(L);
			}	
		};
	}
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.needsEvaluation) {
				_this.commands = _this.createCommands();
				_this.parent.evaluate(true);
				_this.needsEvaluation = false;
			}
		};
	}
	_.preRemoveHandler = function() {
		super_.preRemoveHandler.call(this);
		window.setTimeout(function(el) { return function() { el.childrenEvaluated(); }; }(this.parent));
	}
	_.preReinsertHandler = function() {
		super_.preReinsertHandler.call(this);
		window.setTimeout(function(el) { return function() { el.childrenEvaluated(); }; }(this.parent));
	}
  _.toString = function() {
  	return '{' + this.plot_type + '}{{' + this.argumentList().join('}{') + '}}';
  }
	_.blur = function(to_focus) {
		this.parent.try_collapse(to_focus);
		return super_.blur.call(this, to_focus);
	}
	_.changed = function(el) {
		var all_touched = true;
		if(el === this.selectBox) {
			//If we select a new plot type from the pulldown, we need to replace this block with that one and also copy info over.
			if(el.text() == this.plot_type) return;
			this.changeTo(el.text());
		}
		for(var i = 1; i < this.focusableItems.length; i++) {
			for(var j = 0; j < this.focusableItems[i].length; j++) {
				if(el === this.focusableItems[i][j]) this.focusableItems[i][j].touched = true;
				if(this.focusableItems[i][j].needs_touch) all_touched = all_touched && this.focusableItems[i][j].touched;
			}
		}
		this.worksheet.save();
		if(all_touched)
			this.needsEvaluation = true;
	}
	_.changeTo = function(type) {
		var to_change = elements[type]();
		to_change.replace(this).show(0);
		if(to_change.eq0 && this.eq0 && this.eq0.text().trim().length) { to_change.eq0.latex(this.eq0.latex()); to_change.eq0.touched = true; }
		if(to_change.eq1 && this.eq1 && this.eq1.text().trim().length) { to_change.eq1.latex(this.eq1.latex()); to_change.eq1.touched = true; }
		to_change.label.paste(this.label.toString());
		var to_move = ['line_weight','marker_size','line_style','color', 'y_axis'];
		for(var i = 0; i < to_move.length; i++)
			to_change[to_move[i]] = this[to_move[i]];
		to_change.focus(-2);
		var all_touched = true;
		for(var i = 1; i < to_change.focusableItems.length; i++) {
			for(var j = 0; j < to_change.focusableItems[i].length; j++) {
				if(to_change.focusableItems[i][j].needs_touch) all_touched = all_touched && to_change.focusableItems[i][j].touched;
			}
		}
		if(all_touched) {
			to_change.needsEvaluation = true;
			to_change.submissionHandler(to_change)();
		}
		this.worksheet.save();
		return to_change;
	}
	_.addSelectLine = function() {
		this.worksheet.attachToolbar(this, this.worksheet.toolbar.plotToolbar(this));
		if(this.parent.plotBox) {
			var old_el = $(this.parent.plotBox.element).find('.c3-line-data-' + this.id).first();
			var new_el = old_el.clone();
			new_el.insertBefore(old_el).css('opacity',0.5).css('stroke','#aaaaaa').css('stroke-width',this.line_weight + 5).css('stroke-dasharray','none');
		}
	}
	_.unselect = function() {
		if(this.selected) {
			this.selected = false;
			this.worksheet.blurToolbar(this);
			$(this.parent.plotBox.element).find('.c3-line-data-' + this.id).first().remove();
			$(document).off('click.plot_' + this.id);
		}
		return this;
	}
	_.select = function() {
		if(this.selected) return;
		this.selected = true;
		this.addSelectLine();
		var _this = this;
		var window_click = function(e) {
			if($(e.target).closest('.toolbar').length) return; // If we click on the toolbar, we shouldn't lose the selection.
			_this.unselect();
		}
		window.setTimeout(function() { $(document).on('click.plot_' + _this.id, window_click); });
	}
	_.command = function(command, value) {
		switch(command) {
			case 'marker_size':
				if(value == 0) this.show_points = false;
				else this.show_points = true;
			default:
				this[command]=value;
		}
		this.worksheet.save();
		this.parent.childrenEvaluated();
	}
	// Methods to overwrite (in addition to innerHtml and postInsertHandler)
	_.createCommands = function() {
		throw('This should not happen.  Method should be overwritten by subplot type.');
	}
	_.evaluationFinished = function(result) {
		return true;
	}
	_.focus = function(dir) {
		super_.focus.call(this, dir);
		if(dir == -2)
			this.selectBox.focus(L);
		return this;
	}
});
