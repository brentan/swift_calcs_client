/*
Box to create a plot.  The 'plot' element draws the plot, but its the children of the plot element that are used to set options for each dataset
*/
var plot = P(Element, function(_, super_) {
	_.lineNumber = true;
	_.klass = ['plot'];
	_.evaluatable = true;
	_.hasChildren = true;
	_.savedProperties = ['x_min','x_max','xlabel','ylabel'];
	_.x_min = '-5';
	_.x_max = '5';
	_.xlabel = false;
	_.ylabel = false;
	_.height = 300;
	_.plotBox = false;
	_.helpText = "<<plot>>\nCreate a plot of data and functions.  Insert new data to plot with the 'add another item' link, and adjust the properties of each data-set, such as color or line thickness, by clicking on the item in the plot.";

	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'plot') + helpBlock()
		   + '</div><div class="' + css_prefix + 'insert ' + css_prefix + 'hide_print"></div><div class="another_link explain ' + css_prefix + 'hide_print" style="margin-left: 60px;"><a href="#">Add another item</a></div><div class="' + css_prefix + 'plot_box"></div>';
	}
	_.postInsertHandler = function() {
		this.focusableItems = [[registerFocusable(CodeBlock,this, 'plot', { })],[-1]];
		super_.postInsertHandler.call(this);
		var _this = this;
		if(this.jQ) this.jQ.find('.another_link a').on('click', function(e) {
			plot_func().appendTo(_this).show(250).focus(L);
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
		var xs = {};
		var types = {};
		var groups = []; 
		var show_points = {};
		var marker_size = {};
		var names = {};
		var colors = {};
		var els = {};
		var children = this.children();
		var x_ticks = [];
		var x_tick_order = eval('1e' + (this.x_max - this.x_min).toExponential().replace(/^.*e/,'')*1+1);
		for(var i = 0; i <= 20; i++) 
			x_ticks.push(i*(this.x_max - this.x_min)/20 + this.x_min);
		for(var i = 0; i < children.length; i++) {
			if(!children[i].plot_me) continue;
			columns.push(children[i].xs);
			columns.push(children[i].ys);
			els['data_' + children[i].id] = children[i];
			xs['data_' + children[i].id] = 'x_' + children[i].id;
			types['data_' + children[i].id] = children[i].c3_type;
			show_points['data_' + children[i].id] = children[i].show_points;
			names['data_' + children[i].id] = children[i].name();
			marker_size['data_' + children[i].id] = children[i].marker_size;
			if(children[i].color) colors['data_' + children[i].id] = children[i].color;
			if(children[i].stack) groups.push('data_' + children[i].id);
		}
		if(columns.length) {
			this.jQ.find('.' + css_prefix + 'plot_box').html('');
			var _this = this;
			this.plotBox = c3.generate({
				bindto: this.jQ.find('.' + css_prefix + 'plot_box')[0],
				size: { height: this.height },
				axis: {
					x: { 
						tick: { values: x_ticks, format: function (d) { return Math.ceil(d * x_tick_order) /x_tick_order } },
						label: { text: (this.xlabel ? this.xlabel : 'Add a label'), position: 'outer-center'} 
					},
					y: { 
						label: { text: (this.ylabel ? this.ylabel : 'Add a label'), position: 'outer-middle'} 
					}
				},
				data: {
					xs: xs,
					columns: columns,
					types: types,
					groups: [groups],
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
		        x: { lines: [{value: 0}] },
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
			// Setup axes styling
			if(this.xlabel === false) el.find('.c3-axis-x-label').css('fill','#bbbbbb').hover(function() { $(this).css('fill','#454545').css('text-decoration', 'underline'); }, function() { $(this).css('fill', '#bbbbbb').css('text-decoration', 'none'); });
			else el.find('.c3-axis-x-label').hover(function() { $(this).css('text-decoration', 'underline'); }, function() { $(this).css('text-decoration', 'none'); });
			if(this.ylabel === false) el.find('.c3-axis-y-label').css('fill','#bbbbbb').hover(function() { $(this).css('fill','#454545').css('text-decoration', 'underline'); }, function() { $(this).css('fill', '#bbbbbb').css('text-decoration', 'none'); });
			else el.find('.c3-axis-y-label').hover(function() { $(this).css('text-decoration', 'underline'); }, function() { $(this).css('text-decoration', 'none'); });
			//if(this.y2label === false) el.find('.c3-axis-y2-label').css('fill','#bbbbbb').hover(function() { $(this).css('fill','#454545').css('text-decoration', 'underline'); }, function() { $(this).css('fill', '#bbbbbb').css('text-decoration', 'none'); });
			//else el.find('.c3-axis-y2-label').hover(function() { $(this).css('text-decoration', 'underline'); }, function() { $(this).css('text-decoration', 'none'); });
			el.find('.c3-legend-item').hover(function() { $(this).find('text').css('text-decoration', 'underline'); }, function() { $(this).find('text').css('text-decoration', 'none'); });
			$.each(this.children(), function(i, child) {
				el.find('.c3-line-data-' + child.id).css('stroke-width',child.line_weight).css('stroke-dasharray', child.line_style);
				if(child.selected)
					child.addSelectLine();
			});
		} 
		if(evaluation_id)
			this.evaluateNext(evaluation_id, this.move_to_next);
	}
});

/* object that is a child element of 'plot', allows multiple subplots on a single plot */
/* subplot is a generic class used to generate the subplot types.  It should never be called by iteself */
var subplot = P(EditableBlock, function(_, super_) {
	_.evaluatable = true;
	_.plot_me = false;
	_.stack = false;
	_.show_points = true;
	_.line_weight = 1;
	_.color = false;
	_.line_style = 'none';
	_.marker_size = 2.5;
	_.savedProperties = ['stack','show_points','line_weight','marker_size','line_style','color'];
	_.validateParent = function(parent) {
		return (parent instanceof plot);
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">Plot Type: ' + focusableHTML('SelectBox',  'plot_type') + helpBlock() + '</div>'
		  + '<div class="' + css_prefix + 'focusableItems" data-id="1">Data Label: <div class="' + css_prefix + 'command_border">' + focusableHTML('CommandBlock',  'plot_label') + '&nbsp;</div></div>YIELD' + answerSpan();
	}
	_.postInsertHandler = function() {
		this.selectBox = registerFocusable(SelectBox, this, 'plot_type', { options: 
			{ 
				plot_func: 'Function',
			 	plot_line: 'Line Plot'
			}
		});
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
			console.log('CHANGE ELEMENT'); //BRENTAN: WRITE ME
			return;
		}
		for(var i = 1; i < this.focusableItems.length; i++) {
			for(var j = 0; j < this.focusableItems[i].length; j++) {
				if(el === this.focusableItems[i][j]) this.focusableItems[i][j].touched = true;
				if(this.focusableItems[i][j].needs_touch) all_touched = all_touched && this.focusableItems[i][j].touched;
			}
		}
		if(all_touched)
			this.needsEvaluation = true;
	}
	_.addSelectLine = function() {
		var old_el = $(this.parent.plotBox.element).find('.c3-line-data-' + this.id).first();
		var new_el = old_el.clone();
		new_el.insertBefore(old_el).css('opacity',0.5).css('stroke','#aaaaaa').css('stroke-width',this.line_weight + 5).css('stroke-dasharray','none');
	}
	_.select = function() {
		this.selected = true;
		this.worksheet.attachToolbar(this, this.worksheet.toolbar.plotToolbar());
		this.addSelectLine();
		var _this = this;
		var window_click = function(e) {
			if($(e.target).closest('.toolbar').length) return; // If we click on the toolbar, we shouldn't lose the selection.
			_this.selected = false;
			_this.worksheet.blurToolbar(_this);
			$(_this.parent.plotBox.element).find('.c3-line-data-' + _this.id).first().remove();
			$(document).off('click', window_click);
		}
		window.setTimeout(function() { $(document).on('click', window_click); });
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
});
