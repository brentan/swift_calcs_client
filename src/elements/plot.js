/*
Box to create a plot.  The 'plot' element draws the plot, but its the children of the plot element that are used to set options for each dataset
*/
var default_colors = [
  '#1f77b4',  // muted blue
  '#ff7f0e',  // safety orange
  '#2ca02c',  // cooked asparagus green
  '#d62728',  // brick red
  '#9467bd',  // muted purple
  '#8c564b',  // chestnut brown
  '#e377c2',  // raspberry yogurt pink
  '#7f7f7f',  // middle gray
  '#bcbd22',  // curry yellow-green
  '#17becf'   // blue-teal
];
var plot = P(Element, function(_, super_) {
	var X_AXIS = 0, Y_AXIS = 1, Y2_AXIS = 2;
	_.lineNumber = true;
	_.klass = ['plot'];
	_.evaluatable = true;
	_.hasChildren = true;
	_.savedProperties = ['chart_title', 'x_grid', 'y_grid', 'x_log', 'y_log', 'y2_log', 'x_min','x_max','x_label','y_min','y_max','y_label','y2_min','y2_max','y2_label', 'x_labels', 'x_units', 'y_units','y2_units', 'rotated'];
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
	_.x_log = false;
	_.y_log = false;
	_.y2_log = false;
	_.x_units = false;
	_.y_units = false;
	_.y2_units = false;
	_.x_grid = false;
	_.y_grid = false;
	_.calc_x_min = false;
	_.calc_x_max = false;
	_.chart_title = false;
	_.rotated = false;
	_.height = 300;
	_.plotBox = false;
	_.getUnits = false;
	_.plot_ready = false;
	_.helpText = "<<plot>>\nCreate a plot of data and functions.  Insert new data to plot with the 'add another item' link, and adjust the properties of each data-set, such as color or line thickness, by clicking on the item in the plot.\nHELP:23";

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
		if(this.allow_interaction()) this.jQ.find('.another_link').show();
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
	_.destroy = function() {
		if(this.plotBox) {
			Plotly.purge(this.plotBox);
			this.plotBox = false;
		}
		return super_.destroy.call(this);
	}
	_.blurOutputBox = function() {
		if(this.plotBox && $(this.plotBox).find('.overlay_message').length==0) {
			var children = this.children();
			for(var i = 0; i < children.length; i++) children[i].unselect();
			Plotly.restyle(this.plotBox, {
				'marker.color': '#cccccc',
				'line.color': '#cccccc'
			});
		} else
			this.jQ.find('.' + css_prefix + 'plot_box').html('<div class="explain" style="text-align:center;margin:3px 20px;padding:10px;border:1px solid #dddddd;border-radius:6px;">Generating Plot...</div>');		
	}
	_.addSpinner = function(eval_id) {
		super_.addSpinner.call(this, eval_id);
		this.blurOutputBox();
	}
	// Continue evaluation is called within an evaluation chain.  It will evaluate this node, and then move to evaluate the next node.
	_.continueEvaluation = function(evaluation_id) {
		this.calc_x_max = false;
		this.calc_x_min = false;
		if(this.shouldBeEvaluated(evaluation_id)) {
			this.plot_ready = false;
			this.addSpinner(evaluation_id);
			this.commands = [{command: [this.x_min, this.y_min, this.y2_min, this.x_max, this.y_max, this.y2_max, this.x_log, this.y_log, this.y2_log, this.x_units, this.y_units, this.y2_units].join(",")}];
			var any_altered = this.newCommands() || this.altered_content;
			this.altered_content = false;
			if(!any_altered) {
				var children = this.children();
				for(var i = 0; i < children.length; i++) 
					if(children[i].altered_content || giac.check_altered(evaluation_id, children[i])) { any_altered = true; break; }
			}
			if(any_altered) {
				this.previous_commands = [this.commands[0].command];
				this.getUnits = true;
				var kids = this.children();
				if(kids.length) 
					kids[0].continueEvaluation(evaluation_id)
				else 
					this.childrenEvaluated(evaluation_id);
			} else {
				this.drawPlot();
				this.evaluateNext(evaluation_id);
			}
		} else 
			this.evaluateNext(evaluation_id);
	}
	_.childrenEvaluated = function(evaluation_id) {
		if(this.getUnits) {
			this.getUnits = false;
			// Determine default axis units before getting plot data
			var x_unit = this.x_units ? this.x_unit : false;
			var y_unit = this.y_units ? this.y_unit : false;
			var y2_unit = this.y2_units ? this.y2_unit : false;
			var ignore_custom_xs = false;
			var children = this.children();
			for(var i = 0; i < children.length; i++) {
				if(children[i] instanceof barplot) 
					ignore_custom_xs = true;
				if(!ignore_custom_xs && (x_unit === false)) x_unit = children[i].x_unit;
				if(children[i].y_axis != 'y2') {
					if(y_unit === false) y_unit = children[i].y_unit;
				} else {
					if(y2_unit == false) y2_unit = children[i].y_unit;
				}
			}
			// Build command list
			this.commands = [];
			if(this.x_units) {
				this.commands.push({ command: 'evalf(mksa_coefficient(' + this.worksheet.latexToText(this.x_units) + '))', nomarkup: true });
				this.commands.push({ command: 'evalf(mksa_offset(' + this.worksheet.latexToText(this.x_units) + '))', nomarkup: true });
				this.commands.push({ command: 'latex(evalf(mksa_base(' + this.worksheet.latexToText(this.x_units) + ')))', nomarkup: true });
				this.commands.push({ command: '1.0', nomarkup: true});
			} else if(x_unit) {
				this.commands.push({ command: 'evalf(inv(default_units_coefficient(' + this.worksheet.latexToText(x_unit) + '))', nomarkup: true });
				this.commands.push({ command: 'evalf(-1*default_units_offset(' + this.worksheet.latexToText(x_unit) + ')', nomarkup: true });
				this.commands.push({ command: 'latex(evalf(mksa_base(' + this.worksheet.latexToText(x_unit) + ')))', nomarkup: true });
				this.commands.push({ command: 'latex(evalf(default_base(' + this.worksheet.latexToText(x_unit) + ')))', nomarkup: true });
			} else {
				this.commands.push({ command: '1.0', nomarkup: true });
				this.commands.push({ command: '0.0', nomarkup: true });
				this.commands.push({ command: 'latex(1.0)', nomarkup: true });
				this.commands.push({ command: 'latex(1.0)', nomarkup: true });
			}
			if(this.y_units) {
				this.commands.push({ command: 'evalf(mksa_coefficient(' + this.worksheet.latexToText(this.y_units) + '))', nomarkup: true });
				this.commands.push({ command: 'evalf(mksa_offset(' + this.worksheet.latexToText(this.y_units) + '))', nomarkup: true });
				this.commands.push({ command: 'latex(evalf(mksa_base(' + this.worksheet.latexToText(this.y_units) + ')))', nomarkup: true });
				this.commands.push({ command: '1.0', nomarkup: true});
			} else if(y_unit) {
				this.commands.push({ command: 'evalf(inv(default_units_coefficient(' + this.worksheet.latexToText(y_unit) + '))', nomarkup: true });
				this.commands.push({ command: 'evalf(-1*default_units_offset(' + this.worksheet.latexToText(y_unit) + ')', nomarkup: true });
				this.commands.push({ command: 'latex(evalf(mksa_base(' + this.worksheet.latexToText(y_unit) + ')))', nomarkup: true });
				this.commands.push({ command: 'latex(evalf(default_base(' + this.worksheet.latexToText(y_unit) + ')))', nomarkup: true });
			} else {
				this.commands.push({ command: '1.0', nomarkup: true });
				this.commands.push({ command: '0.0', nomarkup: true });
				this.commands.push({ command: 'latex(1.0)', nomarkup: true });
				this.commands.push({ command: 'latex(1.0)', nomarkup: true });
			}
			if(this.y2_units) {
				this.commands.push({ command: 'evalf(mksa_coefficient(' + this.worksheet.latexToText(this.y2_units) + '))', nomarkup: true });
				this.commands.push({ command: 'evalf(mksa_offset(' + this.worksheet.latexToText(this.y2_units) + '))', nomarkup: true });
				this.commands.push({ command: 'latex(evalf(mksa_base(' + this.worksheet.latexToText(this.y2_units) + ')))', nomarkup: true });
				this.commands.push({ command: '1.0', nomarkup: true});
			} else if(y2_unit) {
				this.commands.push({ command: 'evalf(inv(default_units_coefficient(' + this.worksheet.latexToText(y2_unit) + '))', nomarkup: true });
				this.commands.push({ command: 'evalf(-1*default_units_offset(' + this.worksheet.latexToText(y2_unit) + ')', nomarkup: true });
				this.commands.push({ command: 'latex(evalf(mksa_base(' + this.worksheet.latexToText(y2_unit) + ')))', nomarkup: true });
				this.commands.push({ command: 'latex(evalf(default_base(' + this.worksheet.latexToText(y2_unit) + ')))', nomarkup: true });
			} else {
				this.commands.push({ command: '1.0', nomarkup: true });
				this.commands.push({ command: '0.0', nomarkup: true });
				this.commands.push({ command: 'latex(1.0)', nomarkup: true });
				this.commands.push({ command: 'latex(1.0)', nomarkup: true });
			}
			if(this.shouldBeEvaluated(evaluation_id)) {
				giac.execute(evaluation_id, this.commands, this, 'evaluationFinished');
			} else 
				this.evaluateNext(evaluation_id);
		} else {
			// Already have units set, just ran through all children to get data
			this.drawPlot();
			this.evaluateNext(evaluation_id);
		}
	}
	_.evaluationFinished = function(result, evaluation_id) {
		this.x_unit_conversion = result[0].returned*1;
		this.x_unit_offset = result[1].returned*1;
		this.x_unit = result[2].returned;
		this.x_unit_label = this.x_units ? this.x_units : result[3].returned;
		this.y_unit_conversion = result[4].returned*1;
		this.y_unit_offset = result[5].returned*1;
		this.y_unit = result[6].returned;
		this.y_unit_label = this.y_units ? this.y_units : result[7].returned;
		this.y2_unit_conversion = result[8].returned*1;
		this.y2_unit_offset = result[9].returned*1;
		this.y2_unit = result[10].returned;
		this.y2_unit_label = this.y2_units ? this.y2_units : result[11].returned;
		var kids = this.children();
		if(kids.length) 
			kids[0].continueEvaluation(evaluation_id)
		else 
			this.childrenEvaluated(evaluation_id);
		return false;
	}
	_.setWidth = function() {
		if(this.plot_ready) this.drawPlot();
	}
	_.drawPlot = function(hide_hidden) {
		var el = this.jQ.find('.' + css_prefix + 'plot_box');
		el.css('height','auto').css('min-height', el.height() + 'px').html('');

    // Draw the plot, if there is anything to plot
    var columns = [];
    this.has_bar = false;
    this.plot_ready = true;
    var ignore_custom_xs = false;
    var els = {};
    var stack_bars = false;
    var stack_lines = false;
    var default_color_count = 0;
    var children = this.children();
    var x_max = this.x_max === false ? this.calc_x_max : ((this.x_max + this.x_unit_offset) * this.x_unit_conversion); // Convert to mksa from requested unit base
    var x_min = this.x_min === false ? this.calc_x_min : ((this.x_min + this.x_unit_offset) * this.x_unit_conversion);
    var y_min = this.y_min === false ? undefined : ((this.y_min + this.y_unit_offset) * this.y_unit_conversion);
    var y_max = this.y_max === false ? undefined : ((this.y_max + this.y_unit_offset) * this.y_unit_conversion);
    var y2_min = this.y2_min === false ? undefined : ((this.y2_min + this.y2_unit_offset) * this.y2_unit_conversion);
    var y2_max = this.y2_max === false ? undefined : ((this.y2_max + this.y2_unit_offset) * this.y2_unit_conversion);
    var x_unit = this.x_units ? this.x_unit : false;
    var y_unit = this.y_units ? this.y_unit : false;
    var y2_unit = this.y2_units ? this.y2_unit : false;
    var show_y2 = false;
    var hist_plot = false;
    var last_stack = [];
    var suggested_y_min = undefined;
    // Loop through and do some type checks and clearing.  bar stack requires this to be done before the rendering loop
    for(var i = 0; i < children.length; i++) {
      // Collapse error/warn boxes
      children[i].outputBox.jQ.find('.parent_warning').remove();
      if(children[i].outputBox.jQ.html() == '') children[i].outputBox.clearState().collapse(true);
      if(!children[i].plot_me) continue;
      if(children[i] instanceof barplot) {
        this.has_bar = true;
        ignore_custom_xs = true;
        if(children[i].stack) stack_bars = true;
      }
      if((children[i] instanceof plot_line) && (children[i].stack)) stack_lines = true;
      if(children[i] instanceof plot_histogram) {
        if(hist_plot)
          children[i].outputBox.setWarning('Histogram Plot Bin Labels ignored.  Bars have been plotted on the axis of another histogram that may have different bin sizes').expand();
        else {
          hist_plot = children[i].x_labels;
          hist_plot_unit_label = children[i].x_unit;
        }
      }
      if(children[i] instanceof plot_func) {
        if(ignore_custom_xs) {
          this.expand();
          children[i].outputBox.setWarning('Function Plot Ignored.  Function is plotted with a bar chart, which assumes a monotonic x-axis.').expand();
          continue;
        }
        if(x_min === false) x_min = (-5 + this.x_unit_offset) * this.x_unit_conversion;
        if(x_max === false) x_max = (5 + this.x_unit_offset) * this.x_unit_conversion;
      }
    }
    // Loop through all child plots and add to the plot listing
    for(var i = 0; i < children.length; i++) {
    	var current_trace = {};
      if(!children[i].plot_me) continue;
      var y_vals = children[i].ys.slice(0);
      if(children[i].y_axis == 'y2') {
        var offset = this.y2_unit_offset;
        if(y2_unit && (y2_unit != children[i].y_unit)) {
          // Check for temperature mis-matching...if I get a delta unit back, ignore the offset.
          if(children[i].y_unit && y2_unit.match(/\{(\\degC|\\degF|K|Rankine)\}/) && children[i].y_unit.match(/\{\\delta(C|F|K|Rankine)\}/)) 
            offset = 0;
        }
        for(var j = 0; j < y_vals.length; j++)
          y_vals[j] = y_vals[j] / this.y2_unit_conversion - offset;  // Convert from mksa back to requested unit base
      } else {
        var offset = this.y_unit_offset;
        if(y_unit && (y_unit != children[i].y_unit)) {
          // Check for temperature mis-matching...if I get a delta unit back, ignore the offset.
          if(children[i].y_unit && y_unit.match(/\{(\\degC|\\degF|K|Rankine)\}/) && children[i].y_unit.match(/\{\\delta(C|F|K|Rankine)\}/)) 
            offset = 0;
        }
        for(var j = 0; j < y_vals.length; j++)
          y_vals[j] = y_vals[j] / this.y_unit_conversion - offset;  // Convert from mksa back to requested unit base
      }
      if(!ignore_custom_xs) {
        if(x_unit && (x_unit != children[i].x_unit)) {
          if(!((this.x_unit_label.match(/\{(K|Rankine)\}/)) && children[i].x_unit && children[i].x_unit.match(/\{\\delta(C|F|K|Rankine)\}/))) { // Hide this for K/Rankine as base unit, as this is 'same' unit type (no offset, deltaK = K, deltaRankine = Rankine)
            this.expand();
            if((typeof children[i].x_unit === 'undefined') || (children[i].x_unit == '1.0'))
              children[i].outputBox.setWarning('Incompatible x-axis units.  Data has been plotted on an x-axis with units, but this plot has no associated x-axis units.', true).expand();
            else if(x_unit.match(/\{\\delta(C|F|K|Rankine)\}/) && children[i].x_unit.match(/\{(\\degC|\\degF|K|Rankine)\}/))
              children[i].outputBox.setWarning('Incompatible x-axis units.  Data returned units in absolute temperature (' + this.worksheet.latexToUnit(this.x_unit_label.replace("delta","deg"))[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;&deg;") + '), however x-axis is set to relative temperature (' + this.worksheet.latexToUnit(this.x_unit_label)[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;&deg;") + ').', true).expand();
            else if(children[i].x_unit.match(/\{\\delta(C|F|K|Rankine)\}/) && x_unit.match(/\{(\\degC|\\degF|K|Rankine)\}/))
              children[i].outputBox.setWarning('Incompatible x-axis units.  Data returned units in relative temperature (' + this.worksheet.latexToUnit(this.x_unit_label.replace(/\{(deg)?/,"{\\delta"))[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;&deg;") + '), however x-axis is set to absolute temperature (' + this.worksheet.latexToUnit(this.x_unit_label)[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;&deg;") + ').', true).expand();
            else if(this.worksheet.latexToUnit(children[i].x_unit)[0])
              children[i].outputBox.setWarning('Incompatible x-axis units.  Data has been plotted, but its x-axis units (' + this.worksheet.latexToUnit(children[i].x_unit)[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;") + ') are not the same as shown.', true).expand();
            else
              children[i].outputBox.setWarning('Could not determine x-axis units.  It may not be defined near the test point of x=0').expand();
            children[i].outputBox.jQ.find('.warning').last().addClass('parent_warning');
          } 
        } else
          x_unit = children[i].x_unit;
        var x_vals = children[i].xs.slice(0);
        if(children[i].plot_type == 'plot_func') {
          for(var j = 0; j < x_vals.length; j++)
            x_vals[j] = x_vals[j] / this.x_unit_conversion;  // Convert from mksa back to requested unit base (offset already removed by plotfunc)
        } else {
          for(var j = 0; j < x_vals.length; j++)
            x_vals[j] = x_vals[j] / this.x_unit_conversion - this.x_unit_offset;  // Convert from mksa back to requested unit base
        }
        if(!(children[i] instanceof plot_func)) {
          x_min = x_min === false ? Math.min.apply(Math, children[i].xs.slice(0)) : Math.min(Math.min.apply(Math, children[i].xs.slice(0)), x_min);
          x_max = x_max === false ? Math.max.apply(Math, children[i].xs.slice(0)) : Math.max(Math.max.apply(Math, children[i].xs.slice(0)), x_max);
          if(this.x_min !== false) x_min = Math.max(x_min, this.x_min);
          if(this.x_max !== false) x_max = Math.min(x_max, this.x_max);
        }
        if(this.rotated && children[i].y_axis=='y')
        	current_trace.y = x_vals;
        else
        	current_trace.x = x_vals;
      }
			// Setup x-axis labels/categories for bar plots
			if(hist_plot) {
				try {
					var x_tick_order = ((x_max - x_min)/this.x_unit_conversion).toExponential().replace(/^.*e/,'')*1-2;
				} catch(e) {
					var x_tick_order = 0;
				}
				var ceil10 = function(val, exp) {
					if (typeof exp === 'undefined' || +exp === 0) 
		    		return Math.ceil(val);
		    	val = +val;
		    	exp = +exp;
		    	val = val.toString().split('e');
		    	val = Math.ceil(+(val[0] + 'e' + (val[1] ? (+val[1] - exp) : -exp)));
		    	val = val.toString().split('e');
		    	return +(val[0] + 'e' + (val[1] ? (+val[1] + exp) : exp));
				}
			  var categories = [];
			  for(var j = 0; j < hist_plot.length; j++) 
			    categories.push(ceil10(hist_plot[j][0], x_tick_order) + ' to ' + ceil10(hist_plot[j][1], x_tick_order) + ((hist_plot_unit_label && (hist_plot_unit_label != '1.0')) ? (' [' + this.worksheet.latexToUnit(hist_plot_unit_label)[0].replace(/_/g,'').replace(/1\.0/,'') +']') : ''));
			} else if(this.x_labels && this.has_bar)
			  var categories = this.x_labels.split('__s__');
			else 
			  var categories = [];
      // Create popup labels
      var cur_x_vals = ignore_custom_xs ? (categories.length ? categories : Array.apply(null, {length: y_vals.length}).map(Number.call, Number)) : x_vals;
			y_txt=[];
			var pre_text = "";
			var load_ts = children[i].ts && children[i].ts.length;
			if(this.rotated && children[i].y_axis=='y' && !(children[i] instanceof barplot)) {
				for(var j = 0; j < y_vals.length; j++) {
					if(load_ts) pre_text = "" + children[i].ts[j] + ": ";
					y_txt.push(pre_text+y_vals[j] + ", " + cur_x_vals[j]);
				}
			} else {
				for(var j = 0; j < y_vals.length; j++) {
					if(load_ts) pre_text = "" + children[i].ts[j] + ": ";
					y_txt.push(pre_text+cur_x_vals[j] + ", " + y_vals[j]);
				}
			}
			// For stacking charts, update y_val
      if((stack_lines && (children[i] instanceof plot_line)) || (stack_bars && (children[i] instanceof barplot))) {
      	children[i].stack = true;
      	if(children[i] instanceof barplot) 
      		cur_x_vals = Array.apply(null, {length: y_vals.length}).map(Number.call, Number); // Redo numbering for y_max adjustment
      	// Add original y values to stack
      	last_stack.push({x: cur_x_vals, y:y_vals.slice(0), ax: children[i].y_axis, bar: (children[i] instanceof barplot)});
      	var orig_y_vals = y_vals.slice(0);
      	// Need to adjust y_vals to 'stack' on top of the previous stackable items
      	for(var j = 0; j < (last_stack.length-1); j++) {
      		if(last_stack[j].ax != children[i].y_axis) continue;
      		if(last_stack[j].bar != (children[i] instanceof barplot)) continue;
      		var ok = 0;
      		for(var k = 0; k < cur_x_vals.length; k++) {
      			if((cur_x_vals[k] < last_stack[j].x[ok]) && (ok == 0)) continue; // Dont touch points below range of old
      			while((cur_x_vals[k] > last_stack[j].x[ok]) && (ok < last_stack[j].x.length)) ok++;
      			if(ok == last_stack[j].x.length) break;
      			if(cur_x_vals[k] == last_stack[j].x[ok]) {
      				y_vals[k] += last_stack[j].y[ok];
      			}
      			else if(cur_x_vals[k] < last_stack[j].x[ok]) {
      				// Find linear interpolated point
      				var dy_dx = (last_stack[j].y[ok]-last_stack[j].y[ok-1])/(last_stack[j].x[ok]-last_stack[j].x[ok-1]);
      				y_vals[k] += dy_dx * (cur_x_vals[k] - last_stack[j].x[ok-1]);
      			}
      			if(children[i].suggest_y_min && (children[i].suggest_y_min > y_vals[k])) children[i].suggest_y_min = y_vals[k];
      			if(children[i].suggest_y_max && (children[i].suggest_y_max < y_vals[k])) children[i].suggest_y_max = y_vals[k];
      		}
      	}
				if(this.rotated && children[i].y_axis=='y') {
	      	if(children[i] instanceof barplot) {
	      		current_trace.orientation= 'h';
	      		current_trace.x = orig_y_vals;
	      	} else
	      		current_trace.x = y_vals;
	      } else {
	      	if(children[i] instanceof barplot) 
	      		current_trace.y = orig_y_vals;
	      	else
	      		current_trace.y = y_vals;
	      }
      } else {
      	if(this.rotated && children[i].y_axis=='y') {
	      	if(children[i] instanceof barplot) current_trace.orientation= 'h';
      		current_trace.x = y_vals;
      	} else
      		current_trace.y = y_vals;
      }
			if(ignore_custom_xs) {
      	if(this.rotated && children[i].y_axis=='y')
      		current_trace.y = categories.length ? categories : cur_x_vals; // Bar plots have categories
      	else
      		current_trace.x = categories.length ? categories : cur_x_vals; // Bar plots have categories
      }
      current_trace.text = y_txt;
			if(children[i].y_axis != 'y2') {
				if(y_unit && (y_unit != children[i].y_unit)) {
					if(!(children[i].y_unit && y_unit.match(/\{(\\degC|\\degF|K|Rankine)\}/) && children[i].y_unit.match(/\{\\delta(C|F|K|Rankine)\}/))) {
						this.expand();
						if((typeof children[i].y_unit === 'undefined') || (children[i].y_unit == '1.0'))
							children[i].outputBox.setWarning('Incompatible y-axis units.  Data has been plotted on an y-axis with units, but this plot has no associated y-axis units.', true).expand();
						else if(y_unit.match(/\{\\delta(C|F|K|Rankine)\}/) && children[i].y_unit.match(/\{(\\degC|\\degF|K|Rankine)\}/))
							children[i].outputBox.setWarning('Incompatible y-axis units.  Data returned units in absolute temperature (' + this.worksheet.latexToUnit(this.y_unit_label.replace("delta","deg"))[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;&deg;") + '), however y-axis is set to relative temperature (' + this.worksheet.latexToUnit(this.y_unit_label)[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;&deg;") + ').', true).expand();
						else if(children[i].y_unit.match(/\{\\delta(C|F|K|Rankine)\}/) && y_unit.match(/\{(\\degC|\\degF|K|Rankine)\}/))
							children[i].outputBox.setWarning('Incompatible y-axis units.  Data returned units in relative temperature (' + this.worksheet.latexToUnit(this.y_unit_label.replace(/\{(deg)?/,"{\\delta"))[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;&deg;") + '), however y-axis is set to absolute temperature (' + this.worksheet.latexToUnit(this.y_unit_label)[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;&deg;") + ').', true).expand();
						else if(this.worksheet.latexToUnit(children[i].y_unit)[0])
							children[i].outputBox.setWarning('Incompatible y-axis units.  Data has been plotted, but its y-axis units (' + this.worksheet.latexToUnit(children[i].y_unit)[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;") + ') are not the same as shown.', true).expand();
						else
							children[i].outputBox.setWarning('Could not determine y-axis units.  It may not be defined near the test point of x=0').expand();
						children[i].outputBox.jQ.find('.warning').last().addClass('parent_warning');
					}
				} else
					y_unit = children[i].y_unit;
			} else {
				if(y2_unit && (y2_unit != children[i].y_unit)) {
					if(!(children[i].y_unit && y2_unit.match(/\{(\\degC|\\degF|K|Rankine)\}/) && children[i].y_unit.match(/\{\\delta(C|F|K|Rankine)\}/))) {
						this.expand();
						if((typeof children[i].y_unit === 'undefined') || (children[i].y_unit == '1.0'))
							children[i].outputBox.setWarning('Incompatible secondary y-axis units.  Data has been plotted on an axis with units, but this plot has no associated units.', true).expand();
						else if(children[i].y_unit && y2_unit.match(/\{\\delta(C|F|K|Rankine)\}/) && children[i].y_unit.match(/\{(\\degC|\\degF|K|Rankine)\}/))
							children[i].outputBox.setWarning('Incompatible secondary y-axis units.  Data returned units in absolute temperature (' + this.worksheet.latexToUnit(this.y2_unit_label.replace("delta","deg"))[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;&deg;") + '), however secondary y-axis is set to relative temperature (' + this.worksheet.latexToUnit(this.y2_unit_label)[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;&deg;") + ').', true).expand();
						else if(children[i].y_unit && children[i].y_unit.match(/\{\\delta(C|F|K|Rankine)\}/) && y2_unit.match(/\{(\\degC|\\degF|K|Rankine)\}/))
							children[i].outputBox.setWarning('Incompatible secondary y-axis units.  Data returned units in relative temperature (' + this.worksheet.latexToUnit(this.y2_unit_label.replace(/\{(deg)?/,"{\\delta"))[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;&deg;") + '), however secondary y-axis is set to absolute temperature (' + this.worksheet.latexToUnit(this.y2_unit_label)[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;&deg;") + ').', true).expand();
						else if(this.worksheet.latexToUnit(children[i].y_unit)[0])
							children[i].outputBox.setWarning('Incompatible secondary y-axis units.  Data has been plotted, but its units (' + this.worksheet.latexToUnit(children[i].y_unit)[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"&deg;$1").replace(/delta/,"&Delta;") + ') are not the same as shown.', true).expand();
						else
							children[i].outputBox.setWarning('Could not determine secondary y-axis units.  It may not be defined near the test point of x=0').expand();
						children[i].outputBox.jQ.find('.warning').last().addClass('parent_warning');
					}
				} else
					y2_unit = children[i].y_unit;
			}
			if(ignore_custom_xs && children[i].x_provided) {
				this.expand();
				children[i].outputBox.setWarning('X-data ignored.  Data is plotted with a bar chart, which assumes a monotonic x-axis.', true).expand();
				children[i].outputBox.jQ.find('.warning').last().addClass('parent_warning');
			}
			if(children[i] instanceof barplot)
				current_trace.type = 'bar'
			else if(children[i].show_points && (children[i].line_weight > 0) && (children[i].line_style != 'none'))
				current_trace.mode = 'lines+markers'; 
			else if(children[i].show_points)
				current_trace.mode = 'markers';
			else
				current_trace.mode = 'lines';
			if(children[i].y_axis == 'y2') show_y2 = true;

			if(!(children[i] instanceof barplot)) {
				if(children[i].area && stack_lines) 
					current_trace.fill = (this.rotated && children[i].y_axis == 'y') ? 'tonextx' : 'tonexty'
				else if(children[i].area)
					current_trace.fill = (this.rotated && children[i].y_axis == 'y') ? 'tozerox' : 'tozeroy'
				else if(stack_lines) {
					current_trace.fill = (this.rotated && children[i].y_axis == 'y') ? 'tonextx' : 'tonexty'
					current_trace.fillcolor = 'rgba(0,0,0,0)'
				}
			}
			current_trace.hoverinfo = 'text';
			
			var line_dash = '';
			switch(children[i].line_style) {
				case '5_5':
					line_dash = 'dot';
					break;
				case '10_10':
					line_dash = 'dash';
					break;
				case '20_20':
					line_dash = 'longdash';
					break;
				case '20_10_5_10':
					line_dash = 'dashdot';
					break;
				case '20_10_5_5_5_10':
					line_dash = 'longdashdot'; 
					break;
				default:
					line_dash = 'solid';
					break;
			}
			current_trace.name = children[i].name();
			if(children[i].color) {
				current_trace.marker = { symbol: children[i].symbol, size: children[i].marker_size*2, color: children[i].color}
				current_trace.line = { width: children[i].line_weight, color: children[i].color, dash: line_dash}
			} else {
				current_trace.marker = { symbol: children[i].symbol, size: children[i].marker_size*2, color: default_colors[default_color_count]}
				current_trace.line = { width: children[i].line_weight, color: default_colors[default_color_count], dash: line_dash}
				default_color_count++;
				if(default_color_count == default_colors.length) default_color_count = 0;
			}
			if(children[i].y_axis == 'y2') 
				current_trace.yaxis = 'y2';
			if(children[i] instanceof plot_func) current_trace.plot_func = true;
			columns.push(current_trace);
      children[i].curveNumber = i;
      els[i] = children[i];
		} // End loop through children

    // Set y_min and y_max (if not previously defined by user) based on data/plot suggestion:
    if(y_min == undefined) {
      for(var i = 0; i < children.length; i++) {
        if(children[i].y_axis == 'y' && children[i].suggest_y_min != undefined)
          y_min = y_min == undefined ? children[i].suggest_y_min : Math.min(y_min, children[i].suggest_y_min);
      }
      suggested_y_min = y_min == undefined ? undefined : (y_min / this.y_unit_conversion - this.y_unit_offset);
    }
    var suggested_y_max = undefined;
    if(y_max == undefined) {
      for(var i = 0; i < children.length; i++) {
        if(children[i].y_axis == 'y' && children[i].suggest_y_max != undefined)
          y_max = y_max == undefined ? children[i].suggest_y_max : Math.max(y_max, children[i].suggest_y_max);
      }
      suggested_y_max = y_max == undefined ? undefined : (y_max / this.y_unit_conversion - this.y_unit_offset);
    }
    var suggested_y2_min = undefined;
    if(y2_min == undefined) {
      for(var i = 0; i < children.length; i++) {
        if(children[i].y_axis == 'y2' && children[i].suggest_y_min != undefined)
          y2_min = y2_min == undefined ? children[i].suggest_y_min : Math.min(y2_min, children[i].suggest_y_min);
      }
      suggested_y2_min = y2_min == undefined ? undefined : (y2_min / this.y2_unit_conversion - this.y2_unit_offset);
    }
    var suggested_y2_max = undefined;
    if(y2_max == undefined) {
      for(var i = 0; i < children.length; i++) {
        if(children[i].y_axis == 'y2' && children[i].suggest_y_max != undefined)
          y2_max = y2_max == undefined ? children[i].suggest_y_max : Math.max(y2_max, children[i].suggest_y_max);
      }
      suggested_y2_max = y2_max == undefined ? undefined : (y2_max / this.y2_unit_conversion - this.y2_unit_offset);
    }

		// Determine the axis labels
// Any way to make this 'pretty' with latex?
    var x_label = this.x_label ? this.x_label : (hide_hidden ? '' : 'Add a label');
    var y_label = this.y_label ? this.y_label : (hide_hidden ? '' : 'Add a label');
    var y2_label = this.y2_label ? this.y2_label : (hide_hidden ? '' : 'Add a label');
    if(!ignore_custom_xs && this.x_unit_label && (this.x_unit_label != '1.0')) x_label += ' [' + this.worksheet.latexToUnit(this.x_unit_label)[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"°$1").replace(/delta(C|F)/,"Δ°$1").replace(/delta/,'') +']';
    if(this.y_unit_label && (this.y_unit_label != '1.0')) y_label += ' [' + this.worksheet.latexToUnit(this.y_unit_label)[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"°$1").replace(/delta(C|F)/,"Δ°$1").replace(/delta/,'') +']';
    if(this.y2_unit_label && (this.y2_unit_label != '1.0')) y2_label += ' [' + this.worksheet.latexToUnit(this.y2_unit_label)[0].replace(/_/g,'').replace(/1\.0/,'').replace(/deg(C|F)/,"°$1").replace(/delta(C|F)/,"Δ°$1").replace(/delta/,'') +']';
    
    // Range wants the log of the number, so we do it here.
    var xaxis = {
			title: x_label,
			titlefont: {
				color: this.x_label === false ? 'lightgrey' : 'black',
				size: 12
			},
    	ticks: 'outside',
    	showline: true,
    	ticklen: 6,
      fixedrange: true,
    	gridcolor: '#e4e4e4',
    	zerolinecolor: '#cccccc',
			showgrid: this.x_grid,
    	nticks:  categories.length ? categories.length : (this.rotated ? 10 : 16),
			tickfont: {size: 9}
		};
		if(this.x_log) xaxis.type = 'log';
    var yaxis = {
			title: y_label,
			titlefont: {
				color: this.y_label === false ? 'lightgrey' : 'black',
				size: 12
			},
    	ticks: 'outside',
      fixedrange: true,
    	showline: true,
    	nticks: this.rotated ? 16 : 10,
    	ticklen: 6,
    	gridcolor: '#e4e4e4',
    	zerolinecolor: '#cccccc',
			showgrid: this.y_grid,
			tickfont: {size: 9}
		};
		if(this.y_log) yaxis.type = 'log';
    var y2axis = {
			title: y2_label,
    	showline: true,
			titlefont: {
				color: this.y2_label === false ? 'lightgrey' : 'black',
				size: 12
			},
    	ticks: 'outside',
    	nticks: 10,
    	ticklen: 6,
      fixedrange: true,
			showgrid: false,
			showline: true,
			zeroline: false,
			overlaying: 'y',
			side: 'right',
			tickfont: {size: 9}
		};
		if(this.y2_log) y2axis.type = 'log';
    var x_min = (this.x_min === false) ? (this.x_log ? Math.log(this.calc_x_min / this.x_unit_conversion - this.x_unit_offset) / Math.LN10 : (this.calc_x_min / this.x_unit_conversion - this.x_unit_offset)) : (this.x_log ? Math.log(this.x_min) / Math.LN10 : this.x_min);
    var x_max = (this.x_max === false) ? (this.x_log ? Math.log(this.calc_x_max / this.x_unit_conversion - this.x_unit_offset) / Math.LN10 : (this.calc_x_max / this.x_unit_conversion - this.x_unit_offset)) : (this.x_log ? Math.log(this.x_max) / Math.LN10 : this.x_max);
    if(ignore_custom_xs) x_min = false;
    if((typeof x_min == 'number') && (typeof x_max == 'number')) {
    	xaxis.autorange = false;
    	xaxis.range = [x_min, x_max];
    	// Need to trim asymptotes off...otherwise plot wont show correctly
    	for(var i = 0; i < columns.length; i++) {
    		if(columns[i].plot_func && (typeof columns[i].yaxis == 'undefined')) {
    			var test_max = x_max + (x_max - x_min)*100;
    			var test_min = x_min - (x_max - x_min)*100;
    			for(var k = 0; k < columns[i].x.length; k++) {
    				if(columns[i].x[k] > test_max) columns[i].x[k] = test_max;
    				if(columns[i].x[k] < test_min) columns[i].x[k] = test_min;
    			}
    		}
    	}
    }
    var y_min = (this.y_min === false ? (suggested_y_min == undefined ? undefined : (this.y_log ? Math.log(suggested_y_min) / Math.LN10 : suggested_y_min)) : (this.y_log ? Math.log(this.y_min) / Math.LN10 : this.y_min));
    var y_max = (this.y_max === false ? (suggested_y_max == undefined ? undefined : (this.y_log ? Math.log(suggested_y_max) / Math.LN10 : suggested_y_max)) : (this.y_log ? Math.log(this.y_max) / Math.LN10 : this.y_max));
    if((typeof y_min == 'number') && (typeof y_max == 'number')) {
    	yaxis.autorange = false;
    	var extra = 0.05 * (y_max - y_min)
    	if(this.has_bar)
				yaxis.range = [this.y_min === false ? 0 : y_min, y_max + (this.y_max === false ? extra : 0)];
    	else
    		yaxis.range = [y_min - (this.y_min === false ? extra : 0), y_max + (this.y_max === false ? extra : 0)];
    	// Need to trim asymptotes off...otherwise plot wont show correctly
    	for(var i = 0; i < columns.length; i++) {
    		if(columns[i].plot_func && (typeof columns[i].yaxis == 'undefined')) {
    			var test_max = y_max + (y_max - y_min)*100;
    			var test_min = y_min - (y_max - y_min)*100;
    			for(var k = 0; k < columns[i].y.length; k++) {
    				if(columns[i].y[k] > test_max) columns[i].y[k] = test_max;
    				if(columns[i].y[k] < test_min) columns[i].y[k] = test_min;
    			}
    		}
    	}
    }
    var y2_min = (this.y2_min === false ? (suggested_y2_min == undefined ? undefined : (this.y2_log ? Math.log(suggested_y2_min) / Math.LN10 : suggested_y2_min)) : (this.y2_log ? Math.log(this.y2_min) / Math.LN10 : this.y2_min));
    var y2_max = (this.y2_max === false ? (suggested_y2_max == undefined ? undefined : (this.y2_log ? Math.log(suggested_y2_max) / Math.LN10 : suggested_y2_max)) : (this.y2_log ? Math.log(this.y2_max) / Math.LN10 : this.y2_max));
    if((typeof y2_min == 'number') && (typeof y2_max == 'number')) {
    	y2axis.autorange = false;
    	var extra = 0.05 * (y2_max - y2_min)
    	y2axis.range = [y2_min - (this.y2_min === false ? extra : 0), y2_max + (this.y2_max === false ? extra : 0)];
    	// Need to trim asymptotes off...otherwise plot wont show correctly
    	for(var i = 0; i < columns.length; i++) {
    		if(columns[i].plot_func && (columns[i].yaxis == 'y2')) {
    			var test_max = y2_max + (y2_max - y2_min)*100;
    			var test_min = y2_min - (y2_max - y2_min)*100;
    			for(var k = 0; k < columns[i].y.length; k++) {
    				if(columns[i].y[k] > test_max) columns[i].y[k] = test_max;
    				if(columns[i].y[k] < test_min) columns[i].y[k] = test_min;
    			}
    		}
    	}
    }
    var layout = {
    	paper_bgcolor: 'rgba(0,0,0,0)',
    	plot_bgcolor: 'rgba(0,0,0,0)',
			legend: {
				orientation: "h",
				font: {size: 10},
				y: -0.21
			},
			margin: {
				t: 40,
				r: show_y2 ? 80 : 20,
				b: 80
			},
			height: 350,
			title: this.chart_title ? this.chart_title : (hide_hidden ? '' : 'Add a Title'),
			titlefont: {
				color: this.chart_title === false ? 'lightgrey' : 'black'
			},
			showlegend: columns.length > 1,
  		hovermode: 'closest'
		};
		if(this.rotated) {
			layout.yaxis = xaxis;
			layout.xaxis = yaxis;
		} else {
			layout.xaxis = xaxis;
			layout.yaxis = yaxis;
		}
		if(stack_bars) layout.barmode = 'stack';
		if(show_y2)
			layout.yaxis2 = y2axis;
    Plotly.newPlot(el[0],columns,layout,{showLink: false, displayModeBar: false});
		el[0].on('plotly_click', function(data){
			if(!(data && data.points && data.points.length > 0)) return;
			data = data.points[0]; // Get closest trace
			var id = data.curveNumber;
			if(els[id]) {
				els[id].select();
			}
		});
		this.plotBox = el[0];
		// Re-select last item
		$.each(this.children(), function(i, child) {
			if(child.selected) child.addSelectLine();
		});
		// Set hover/click effects on axes and titles 
    var _this = this;
    if(this.allow_interaction()) {
	    // Setup title styling
	    if(this.chart_title === false) 
	      el.find('text.gtitle').attr('pointer-events','all').attr("class", "gtitle " + css_prefix + 'hide_print').css('fill','#bbbbbb').css('cursor','pointer').hover(function() { $(this).css('fill','#454545').css('text-decoration', 'underline'); }, function() { $(this).css('fill', '#bbbbbb').css('text-decoration', 'none'); });
	    else 
	      el.find('text.gtitle').attr('pointer-events','all').css('cursor','pointer').hover(function() { $(this).css('text-decoration', 'underline'); }, function() { $(this).css('text-decoration', 'none'); });
	    el.find('text.gtitle').click(function(e) {
	    	_this.setTitle();
	    	e.preventDefault();
	    });
	    // Setup axes styling
	    if(this.x_label === false) 
	      el.find('text.xtitle').attr('pointer-events','all').attr("class", "xtitle " + css_prefix + 'hide_print').css('fill','#bbbbbb').css('cursor','pointer').hover(function() { $(this).css('fill','#454545').css('text-decoration', 'underline'); }, function() { $(this).css('fill', '#bbbbbb').css('text-decoration', 'none'); });
	    else 
	      el.find('text.xtitle').attr('pointer-events','all').css('cursor','pointer').hover(function() { $(this).css('text-decoration', 'underline'); }, function() { $(this).css('text-decoration', 'none'); });
	    el.find('text.xtitle').click(function(e) {
	    	_this.setAxis(0);
	    	e.preventDefault();
	    });
	    el.find('g.xaxislayer').attr('pointer-events','all').css('cursor','pointer').hover(function() {
	      $(this).find('text').css('text-decoration', 'underline');
	    }, function() {
	      $(this).find('text').css('text-decoration', 'none');
	    }).click(function(e) {
	    	_this.setAxis(0);
	    	e.preventDefault();
	    });


	    if(this.y_label === false) 
	      el.find('text.ytitle').attr('pointer-events','all').attr("class", "ytitle " + css_prefix + 'hide_print').css('fill','#bbbbbb').css('cursor','pointer').hover(function() { $(this).css('fill','#454545').css('text-decoration', 'underline'); }, function() { $(this).css('fill', '#bbbbbb').css('text-decoration', 'none'); });
	    else 
	      el.find('text.ytitle').attr('pointer-events','all').css('cursor','pointer').hover(function() { $(this).css('text-decoration', 'underline'); }, function() { $(this).css('text-decoration', 'none'); });
	    el.find('text.ytitle').click(function(e) {
	    	_this.setAxis(1);
	    	e.preventDefault();
	    });
	    el.find('g.yaxislayer').attr('pointer-events','all').css('cursor','pointer').hover(function() {
	      $(this).find('text').css('text-decoration', 'underline');
	    }, function() {
	      $(this).find('text').css('text-decoration', 'none');
	    }).click(function(e) {
	    	_this.setAxis(1);
	    	e.preventDefault();
	    });

			if(show_y2) {
		    if(this.y2_label === false) 
		      el.find('text.y2title').attr('pointer-events','all').attr("class", "y2title " + css_prefix + 'hide_print').css('fill','#bbbbbb').css('cursor','pointer').hover(function() { $(this).css('fill','#454545').css('text-decoration', 'underline'); }, function() { $(this).css('fill', '#bbbbbb').css('text-decoration', 'none'); });
		    else 
		      el.find('text.y2title').attr('pointer-events','all').css('cursor','pointer').hover(function() { $(this).css('text-decoration', 'underline'); }, function() { $(this).css('text-decoration', 'none'); });
		    el.find('text.y2title').click(function(e) {
		    	_this.setAxis(2);
	    	e.preventDefault();
		    });
		    el.find('g.overaxes').attr('pointer-events','all').css('cursor','pointer').hover(function() {
		      $(this).find('text').css('text-decoration', 'underline');
		    }, function() {
		      $(this).find('text').css('text-decoration', 'none');
		    }).click(function(e) {
		    	_this.setAxis(2);
	    	e.preventDefault();
		    });
		  }
	  } else {
	  	if(this.y2_label === false) 
	      el.find('text.y2title').remove();
	  	if(this.y_label === false) 
	      el.find('text.ytitle').remove();
	  	if(this.x_label === false) 
	      el.find('text.xtitle').remove();
	    if(this.chart_title === false)
	      el.find('text.gtitle').remove();
	  }
    // IF NO DATA:
    if(columns.length == 0) {
    	el.find('.overlay_message').remove();
      el.find('.gridlayer, .zerolinelayer, .overzero').remove();
      this.expand();
      el.append($('<div/>').addClass('overlay_message').html('<strong>No data to plot.</strong><BR>Setup a data source or check for errors.'));
    } else {
    	el.find('.print_image').remove();
      el.prepend($('<div/>').addClass('print_image').addClass(css_prefix + 'hide_print').html('<i class="fa fa-image"></i>').on('click','i',function(_this) { return function(e) {
      	if(_this.plotBox) {
	      	$('.popup_dialog .full').html("<div class='title'>Export as Image</div>Image Width (pixels):<BR><input type=text value=800 size=8 class=wide><BR><BR>Image Height (pixels):<BR><input type=text value=600 size=8 class=high>");
			    var links = $('.popup_dialog .bottom_links').html('<button class="grey close">Close</button>');
			    $('<button>Create Image</button>').on('click', function(e) {
						window.hidePopupOnTop();
						var w = $('.popup_dialog .full .wide').val()*1;
						var h = $('.popup_dialog .full .high').val()*1;
						if(w < 100) {
							w = 100;
							showNotice('Minimum Width of 100px imposed');
						}
						if(h < 100) {
							h = 100;
							showNotice('Minimum Height of 100px imposed');
						}
	      		_this.drawPlot(true);
	      		Plotly.downloadImage(_this.plotBox, {format: 'png', width: w, height: h, filename: 'SwiftCalcsChart'});
	      		_this.drawPlot(false);
			    }).prependTo(links);
			    window.showPopupOnTop();
			    window.resizePopup(true);
      	}
      	e.preventDefault();
      	e.stopPropagation();
      } }(this)));
    }
	}
	_.setTitle = function() { 
  	var title = prompt("Chart Title:",this.chart_title ? this.chart_title : '');
  	if(title == null) return;
  	title = title.trim();
    if(title == '') title = false;
    this.chart_title = title;
    this.drawPlot();
    this.worksheet.save();
  }
	_.children = function() { 
		var kids = super_.children.call(this);
		var functions = [];
		var bars = [];
		var circles = [];
		var others = [];
		for(var i = 0; i < kids.length; i++) {
			if(kids[i] instanceof plot_func) functions.push(kids[i]); 
			else if(kids[i] instanceof barplot) bars.push(kids[i]);
			else others.push(kids[i]);
		}
		return bars.concat(circles).concat(others).concat(functions);
	}
	_.command = function(command, value) {
		switch(command) { 
			case 'rotated_axes':
				this.rotated = value;
				this.drawPlot();
				break;
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
		$('.popup_dialog .full').html('<div class="title">' + axis_name[axis] + ' axis</div><div><strong>' + axis_name[axis] + ' Label</strong><br><input type="text" class="label"></div><BR>');
		if(this.has_bar && (axis == X_AXIS)) 
			$('.popup_dialog .full').append('<div><strong>' + axis_name[axis] + ' Data Labels</strong><br><input type="text" class="labels"><BR><span class="explain">Comma seperated list of labels for each data bar.</span></div>');
		else
			$('.popup_dialog .full').append('<div><strong>' + axis_name[axis] + ' Minimum</strong><br><input type="text" class="min"><BR><span class="explain">Leave blank for auto axis, add units to change default units</span></div><div><strong>' + axis_name[axis] + ' Maximum</strong><br><input type="text" class="max"><BR><span class="explain">Leave blank for auto axis</span></div><div><strong>Log Axis</strong><BR><input type="checkbox" class="log" style="width:auto;">&nbsp;Use a logarithmic scale for this axis.<BR><BR><div><strong>Grid Lines</strong><BR><input type="checkbox" class="grid" style="width:auto;">&nbsp;Overlay gridlines on the plot for this axis.<BR><BR></div><div><strong>' + axis_name[axis] + ' Units</strong><div class="white"><span class="units"></span></div><span class="explain">Leave blank for no or auto units</span></div>');
		min_vals = [this.x_min, this.y_min, this.y2_min];
		max_vals = [this.x_max, this.y_max, this.y2_max];
		log_vals = [this.x_log, this.y_log, this.y2_log];
		grid_vals = [this.x_grid, this.y_grid, false];
		units = [this.x_units, this.y_units, this.y2_units];
		labels = [this.x_label, this.y_label, this.y2_label];
		if(labels[axis] !== false) $('.popup_dialog').find('input.label').val(labels[axis]);
		if(this.has_bar && (axis == X_AXIS)) { 
			if(this.x_labels) $('.popup_dialog').find('input.labels').val(this.x_labels.replace(/__s__/g,', '));
		} else {
			if(min_vals[axis] !== false) $('.popup_dialog').find('input.min').val(min_vals[axis]);
			if(max_vals[axis] !== false) $('.popup_dialog').find('input.max').val(max_vals[axis]);
			if(log_vals[axis] !== false) $('.popup_dialog').find('input.log').prop('checked', true);
			if(grid_vals[axis] !== false) $('.popup_dialog').find('input.grid').prop('checked', true);
			if(axis == 2) $('.popup_dialog').find('input.grid').closest('div').hide();
			var units_field = window.standaloneMathquill($('.popup_dialog').find('span.units').eq(0));
			units_field.setUnitsOnly(true);
			if(units[axis])
				units_field.paste(units[axis]);
			else
				units_field.cmd('\\Unit');
		}
    var links = $('.popup_dialog .bottom_links').html('');
    window.resizePopup();
    $('<button class="grey">Close</button>').on('click', function(e) {
			$('.standalone_textarea').remove();
			window.hidePopupOnTop();
    }).prependTo(links);
		$('<button class="ok">Ok</button>').on('click', function(e) {
			var label = $('.popup_dialog').find('input.label').val().trim();
			if(!_this.has_bar || (axis != X_AXIS)) {
				var min_val = $('.popup_dialog').find('input.min').val().trim();
				var max_val = $('.popup_dialog').find('input.max').val().trim();
				var log_val = $('.popup_dialog').find('input.log').prop('checked');
				var grid_val = $('.popup_dialog').find('input.grid').prop('checked');
			}
			if(label == '') label = false;
			if(min_val == '') min_val = false; 
			else min_val = min_val * 1;
			if(max_val == '') max_val = false; 
			else max_val = max_val * 1;
			if(log_val !== true) log_val = false;
			if(grid_val !== true) grid_val = false;
			if(log_val && (min_val !== false) && (min_val <= 0)) min_val = 1e-15;
			if(log_val && (max_val !== false) && (max_val <= 0)) max_val = 2e-15;
			switch(axis) {
				case X_AXIS:
					_this.x_label = label;
					if(_this.has_bar) {
						_this.x_labels = $('.popup_dialog').find('input.labels').val().trim().replace(/,[ ]?/g,'__s__');
						if(_this.x_labels == '') _this.x_labels = false;
					} else {
						_this.x_labels = false;
						_this.x_min = min_val;
						_this.x_max = max_val;
						_this.x_log = log_val;
						_this.x_grid = grid_val;
						_this.x_units = units_field.latex();
						if(_this.x_units.match(/^\\Unit\{[ ]*\}$/)) _this.x_units = false;
						var children = _this.children();
						for(var i = 0; i < children.length; i++) {
							if(children[i].plot_me && (children[i] instanceof plot_func)) children[i].needsEvaluation = true;
							if(children[i].plot_me && (children[i] instanceof plot_parametric_holder)) children[i].needsEvaluation = true;
						}
					}
					break;
				case Y_AXIS:
					_this.y_label = label;
					_this.y_min = min_val;
					_this.y_max = max_val;
					_this.y_log = log_val;
					_this.y_grid = grid_val;
					_this.y_units = units_field.latex();
					if(_this.y_units.match(/^\\Unit\{[ ]*\}$/)) _this.y_units = false;
					var children = _this.children();
					for(var i = 0; i < children.length; i++) {
						if(children[i].plot_me && (children[i] instanceof plot_func) && (children[i].y_axis == 'y')) children[i].needsEvaluation = true;
						if(children[i].plot_me && (children[i] instanceof plot_parametric_holder) && (children[i].y_axis == 'y')) children[i].needsEvaluation = true;
					}
					break;
				case Y2_AXIS:
					_this.y2_label = label;
					_this.y2_min = min_val;
					_this.y2_max = max_val;
					_this.y2_log = log_val;
					_this.y2_units = units_field.latex();
					if(_this.y2_units.match(/^\\Unit\{[ ]*\}$/)) _this.y2_units = false;
					var children = _this.children();
					for(var i = 0; i < children.length; i++) {
						if(children[i].plot_me && (children[i] instanceof plot_func) && (children[i].y_axis == 'y2')) children[i].needsEvaluation = true;
						if(children[i].plot_me && (children[i] instanceof plot_parametric_holder) && (children[i].y_axis == 'y2')) children[i].needsEvaluation = true;
					}
					break;
			}
			$('.standalone_textarea').remove();
			window.hidePopupOnTop();
			_this.worksheet.save();
			_this.evaluate(true);
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
var subplotProperties = ['area', 'stack', 'show_points','line_weight','marker_size','line_style','color', 'y_axis', 'symbol'];
var subplot = P(EditableBlock, function(_, super_) {
	_.evaluatable = true;
	_.plot_me = false;
	_.stack = false;
	_.show_points = true;
	_.line_weight = 1;
	_.curveNumber = false;
	_.sets_x = false;
	_.area = false;
	_.x_provided = false;
	_.color = false;
	_.x_unit = '1.0';
	_.y_unit = '1.0';
	_.x_labels = false;
	_.symbol = 'circle';
	_.y_axis = 'y';
	_.line_style = 'none';
	_.marker_size = 2.5;
	_.neverEvaluated = true;
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
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">Plot Type: ' + focusableHTML('SelectBox',  'plot_type') + ' with label: ' + focusableHTML('CommandBlock',  'plot_label') + '&nbsp;' + helpBlock() + '</div>'
		  + 'YIELD' + answerSpan();
	}
	_.postInsertHandler = function() {
		this.selectBox = registerFocusable(SelectBox, this, 'plot_type', { blank_message: 'Choose Plot Type', options: 
			{ 
				plot_func: 'Function',
			 	plot_scatter: 'Scatter Plot',
			 	plot_line: 'Line Plot',
			 	plot_area: 'Area Plot',
			 	plot_parametric: 'Parametric Plot',
			 	plot_polar: 'Polar Plot',
			 	plot_bar: 'Bar Chart',
			 	plot_histogram: 'Histogram',
			}
		});
		this.selectBox.paste(this.plot_type);
		var _this = this;
		this.label = registerFocusable(CommandBlock, this, 'plot_label', { editable: true, border: true, handlers: {blur: function(el) { _this.parent.drawPlot(); } } })
		this.focusableItems.unshift([this.selectBox, this.label]);
		super_.postInsertHandler.call(this);
		// Since we play with ordering, when I am added there may be children 'lower' than me in the list.  We have to re-evaluate those.
		var text = this.name().split('');
		this.label.clear();
		for(var i = 0; i < text.length; i++) 
			$('<var/>').html(text[i]).appendTo(this.label.jQ);
		var kids = this.parent.children();
		var setEval = false;
		for(var i = 0; i < kids.length; i++) {
			if(setEval) kids[i].needsEvaluation = true;
			if(kids[i] === this) setEval = true;
		}
	}
  _.parseSavedProperties = function(args) {
  	super_.parseSavedProperties.call(this, args);
  	if((this.line_style == 'none') && !(this instanceof plot_scatter)) this.line_style = 'solid';
  	return this;
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
				_this.altered_content = _this.newCommands();
				_this.parent.evaluate(true);
			}
		};
	}
	_.evaluate = function(force) {
		this.parent.evaluate(force);
	}
	_.continueEvaluation = function(evaluation_id) {
		if(this.shouldBeEvaluated(evaluation_id)) {
			if(this.parent.getUnits)
				this.commands = this.getUnitsCommands();
			else
				this.commands = this.createCommands();
		}
		return super_.continueEvaluation.call(this, evaluation_id);
	}
	_.custom_R = function() { 
		var kids = this.parent.children();
		for(var i = 0; i < (kids.length - 1); i++)
			if(kids[i] == this) return kids[i+1];
		return 0;
	}
	_.altered = function(evaluation_id) {
		if(this.altered_content || giac.check_altered(evaluation_id, this)) {
			if(!this.parent.getUnits) {
				this.setPreviousCommands();
				this.altered_content = false;
				this.plot_me = false;
			}
			return true;
		} else if(!this.parent.getUnits && this.newCommands()) {
			this.setPreviousCommands();
			this.plot_me = false;
			return true;
		}
		if(this.sets_x) { //If we skip this block, we need to know its xmin/xmax to help with possible future blocks
			this.parent.calc_x_min = this.parent.calc_x_min === false ? this.my_xmin : Math.min(this.my_xmin, this.parent.calc_x_min);
			this.parent.calc_x_max = this.parent.calc_x_max === false ? this.my_xmax : Math.max(this.my_xmax, this.parent.calc_x_max);
		}
		return giac.compile_mode; // In compile mode, we need to know the commands that are sent...even though plots should be ignored in compile_mode, but still
	}
	_.preRemoveHandler = function() {
		super_.preRemoveHandler.call(this);
		window.setTimeout(function(el) { return function() { el.drawPlot(); }; }(this.parent));
	}
	_.preReinsertHandler = function() {
		super_.preReinsertHandler.call(this);
		window.setTimeout(function(el) { return function() { el.drawPlot(); }; }(this.parent));
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
		to_change.label.clear().paste(this.label.toString());
		var to_move = ['marker_size','line_style','color', 'y_axis','stack'];
		if((type != 'plot_scatter') && !(type == 'plot_line' && this instanceof plot_scatter)) to_move.push('line_weight');
		for(var i = 0; i < to_move.length; i++)
			to_change[to_move[i]] = this[to_move[i]];
		to_change.focus(-2);
		var all_touched = true;
		for(var i = 1; i < to_change.focusableItems.length; i++) {
			for(var j = 0; j < to_change.focusableItems[i].length; j++) {
				if(to_change.focusableItems[i][j].needs_touch) all_touched = to_change.focusableItems[i][j].touched === false ? false : all_touched;
			}
		}
		if(all_touched) {
			to_change.needsEvaluation = true;
			to_change.submissionHandler(to_change)();
		}
		this.worksheet.save();
		return to_change;
	}
	_.getUID = function() {
		if(this.parent.plotBox && (this.curveNumber !== false)) {
			if(this.parent.plotBox.data[this.curveNumber])
				return this.parent.plotBox.data[this.curveNumber].uid;
		}
		return false;
	}
	_.getColor = function() {
		if(this.color) return this.color;
		if(this.parent.plotBox && (this.curveNumber !== false)) {
			if(this.parent.plotBox.data[this.curveNumber])
				return this.parent.plotBox.data[this.curveNumber].marker.color;
		}
		return false;
	}
	_.addSelectLine = function(no_toolbar) {
		if(no_toolbar !== false) this.worksheet.attachToolbar(this, this.worksheet.toolbar.plotToolbar(this));
		if(this.parent.plotBox) {
			if(this instanceof barplot) {
				Plotly.restyle(this.parent.plotBox, {'marker.line': {color: '#000000', width: 1.5}}, this.curveNumber);
			} else {
				var els = $(this.parent.plotBox).find('.trace' + this.getUID());
				if(els.length > 1) els.first().remove();
				var old_el = $(this.parent.plotBox).find('.trace' + this.getUID()).first();
				var new_el = old_el.clone();
				new_el.attr('data-select','1').insertBefore(old_el).css('opacity',0.5).css('stroke-opacity',0.5).css('stroke','#777777').css('stroke-width',this.line_weight + 5).css('stroke-dasharray','none').find('path').not('.js-fill').css('opacity',0.5).css('stroke-opacity',0.5).css('stroke','#777777').css('stroke-width',this.line_weight + 5).css('stroke-dasharray','none');
			}
		}
	}
	_.unselect = function() {
		if(this.selected) {
			this.selected = false;
			this.worksheet.blurToolbar(this);
			if(this instanceof barplot) {
				if(this.parent.plotBox) Plotly.restyle(this.parent.plotBox, {'marker.line': {color: '#000000', width: 0}}, this.curveNumber);
			} else {
				var els = $(this.parent.plotBox).find('.trace' + this.getUID());
				if(els.length > 1) els.first().remove();
			}
			$(document).off('click.plot_' + this.id);
		}
		return this;
	}
	_.select = function() {
		if(this.selected) return;
		$.each(this.parent.children(), function(i, child) {
			if(child.selected) child.unselect();
		});
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
			case 'color':
				this.color = value;
				this.worksheet.save();
				if(this.parent.plotBox) {
					var els = $(this.parent.plotBox).find('.trace' + this.getUID());
					if(els.length > 1) els.first().remove();
					Plotly.restyle(this.parent.plotBox,{'marker.color':value, 'line.color':value},this.curveNumber);
					if(this.selected) this.addSelectLine(false);
				}
				return;
			case 'stack':
				this.stack = value;
				var children = this.parent.children();
				for(var i = 0;i < children.length; i++ ) {
					if(((this instanceof barplot) && (children[i] instanceof barplot)) || ((this instanceof plot_line) && (children[i] instanceof plot_line)))
						children[i].stack = value;
				}
				break;
			case 'line_weight':
				if((value > 0) && (this.line_style == 'none')) this.line_style = 'solid';
				this.line_weight = value;
				break;
			case 'marker_size':
				if(value == 0) this.show_points = false;
				else this.show_points = true;
			default:
				this[command]=value;
		}
		this.worksheet.save();
		this.parent.drawPlot();
		this.select();
	}
	// Methods to overwrite (in addition to innerHtml and postInsertHandler)
	_.createCommands = function() {
		throw('This should not happen.  Method should be overwritten by subplot type.');
	}
	_.evaluationFinished = function(result) {
		return true;
	}
	_.setPreviousCommands = function() {
		this.previous_commands = [];
		for(var i = 0; i < this.commands.length; i++) 
			this.previous_commands.push(this.commands[i].command);
	}
	_.focus = function(dir) {
		super_.focus.call(this, dir);
		if(dir == -2)
			this.selectBox.focus(L);
		else if(dir == L) 
			this.focusableItems[1][0].focus(L);
		return this;
	}
	_.findStartElement = function() {
		return this.parent.findStartElement();
	}
});
var barplot = P(subplot, function(_, super_) {
});
