/*
Box to create a plot
CURRENTLY LIMITED TO LINE PLOTS, CREATED WITH C3 (in the Swift Calcs repo).  Should be updated
*/
var plot = P(Element, function(_, super_) {
	_.lineNumber = false;
	_.lineNumber = true;
	_.klass = ['plot'];
	_.evaluatable = true;
	_.plot = false;
	_.savedProperties = ['x_min','x_max'];
	_.x_min_val = -5;
	_.x_max_val = 5;
	_.x_min = '-5';
	_.x_max = '5';
	_.xminField = 0;
	_.xmaxField = 0;
	_.attached = false;
	_.helpText = "<<plot>>\nCreate a line plot from a function.  Example: Plot x^2 as a function of x";

	_.init = function() {
		super_.init.call(this);
		this.to_attach = [];
		this.subplots = [];
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'top ' + css_prefix + 'focusableItems" data-id="0">' + codeBlockHTML('plot', this.id) + 'x<sub>min</sub>:&nbsp;'
			+ mathSpan('x_min')
			+ '&nbsp;x<sub>max</sub>:&nbsp;'
			+ mathSpan('x_max')  + helpBlock() + '<BR>'  + answerSpan()
			+ '</div><div class="' + css_prefix + 'insert ' + css_prefix + 'hide_print"></div><div class="' + css_prefix + 'plot_box"></div>';
	}
	_.postInsertHandler = function() {
		this.xminField = registerMath(this, 'x_min', { handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.xmaxField = registerMath(this, 'x_max', { handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.plotBox = this.jQ.find('.' + css_prefix + 'plot_box');
		super_.postInsertHandler.call(this);
		this.xminField.latex(this.x_min);
		this.xmaxField.latex(this.x_max);
		this.focusableItems = [[registerCommand(this, 'plot', { }), this.xminField, this.xmaxField]];
		this.attached = true;
		var _this = this;
		// Add the 'another plot' link
		$('<div>Add Another Plot</div>').addClass(css_prefix + 'plot_item').addClass(css_prefix + 'plot_add').on('click', function(e) {
			_this.appendPlotOption(400, true);
			e.preventDefault();
			e.stopPropagation();
		}).appendTo(this.insertJQ);
		// If we need to attach any subplots, we do that here
		for(var i = 0; i < this.to_attach.length; i++)
			this.to_attach[i].attach();
		// If this is a blank plot box, add a first item
		if(this.subplots.length == 0)
			this.appendPlotOption(0, true);
		else
			this.redraw();
		return this;
	}
	_.appendPlotOption = function(duration, focus) {
		line_plot(this).attach(duration, focus);
	}
	_.continueEvaluation = function(evaluation_id, move_to_next) {
		var parentLoop = this.parentLoop();
		if(parentLoop && this.shouldBeEvaluated(evaluation_id)) 
			parentLoop.childrenEvaluated(evaluation_id);
		else
			this.evaluateNext(evaluation_id, move_to_next);
	}
	_.focus = function(dir) {
		super_.focus.call(this);
		if(this.subplots.length == 0)
			this.appendPlotOption(400,true);
		else if(dir == R)
			this.focusableItems[this.focusableItems.length - 1][this.focusableItems[this.focusableItems.length - 1].length - 1].focus(R);
		else if(dir == L)
			this.focusableItems[1][0].focus(L);
		else if(dir === 0)
			this.focusableItems[1][0].focus(L);
		else if(!dir && this.focusedItem)
			this.focusedItem.focus();
		this.showOptions();
		return this;
	}
	_.mouseClick = function(e) {
    if(super_.mouseClick.call(this,e)) return true;
		var target = $(e.target).closest('div.' + css_prefix + 'plot_item');
		if(target.length == 0) {
			this.focus(L);
			return false;
		}
		if(target.hasClass(css_prefix + 'plot_add')) return false;
		subplot.byId[target.attr('data-plot-id')*1].focus();
		return false;
	}
	_.enterPressed = function(_this) {
		return function(mathField) {
			_this.submissionHandler(_this)(mathField);
		};
	}
	_.submissionHandler = function(_this) {
		return function(mathField) {
			_this.x_min = _this.xminField.latex();
			_this.x_max = _this.xmaxField.latex();
			if(_this.xmaxField.text().trim() == '') return;
			if(_this.xminField.text().trim() == '') return;
			_this.redraw();
		};
	}
	_.blur = function() {
		super_.blur.call(this);
		this.hideOptions();
	}
	_.showOptions = function() {
		this.jQ.find('div.' + css_prefix + 'insert').slideDown({duration: 300});
	}
	_.hideOptions = function() {
		this.jQ.find('div.' + css_prefix + 'insert').slideUp({duration: 300});
	}
  _.toString = function() {
  	return '{plot}{{' + this.argumentList().join('}{') + '}}';
  }
  _.argumentList = function() {
  	var output = [];
  	var arg_list = [];
  	for(var k = 0; k < this.savedProperties.length; k++) 
  		arg_list.push(this.savedProperties[k] + ": " + this[this.savedProperties[k]]);
  	output.push(arg_list.join(', '));
  	for(var i = 0; i < this.subplots.length; i++) 
  		output.push(this.subplots[i].toString());
  	return output;
  }
  _.parse = function(args) {
  	if(this.jQ === 0) {
  		// Not attached yet.  delay the parse until we are attached
  		this.toParse = args;
  		return this;
  	}
		var arg_list = args[0].split(',');
  	for(var j = 0; j < arg_list.length; j++) {
  		var name = arg_list[j].replace(/^[\s]*([a-zA-Z0-9_]+)[\s]*:(.*)$/,"$1");
  		var val = arg_list[j].replace(/^[\s]*([a-zA-Z0-9_]+)[\s]*:(.*)$/,"$2").trim();
  		if(val === "false") val = false;
  		if(val === "true") val = true;
  		this[name] = val;
  	}
  	var k = 1;
  	for(var i = k; i < args.length; i++) {
  		var el = args[i].split('___');
  		if(plot_types[el[0]]) 
  			plot_types[el[0]](this).parse(el).attach();
  	}
  	this.needsEvaluation = true;
  	this.redraw();
  	return this;
  }
  _.redraw = function() {
  	if(this.needsEvaluation) {
  		this.evaluate();
  		this.needsEvaluation = false;
  	}
  }
  // Evaluation functions:
	// Continue evaluation is called within an evaluation chain.  It will evaluate this node, and if 'move_to_next' is true, then move to evaluate the next node.
	_.continueEvaluation = function(evaluation_id, move_to_next) {
		if(this.shouldBeEvaluated(evaluation_id)) {
			this.addSpinner(evaluation_id);
			this.move_to_next = move_to_next;
			if(this.subplots.length) {
				var commands = [{command: this.xminField.text(), nomarkup: true},{command: this.xmaxField.text(), nomarkup: true}];
				giac.execute(evaluation_id, true, commands, this, 'startSubplot');
			} else
				this.childrenEvaluated(evaluation_id);
		} else 
			this.evaluateNext(evaluation_id, move_to_next)
	}
	_.startSubplot = function(result, evaluation_id) {
		//HANDLE XMIN, XMAX
		var errors = [];
		if(result[0].success) {
			if(result[0].returned.match(/^[\-\+0-9\.]+$/)) {
				this.x_min_val = result[0].returned * 1;
			} else {
				errors.push('X<sub>min</sub> is non-numeric.');// Report x_min error
			}
		} else errors.push('X<sub>min</sub>: ' + result[0].returned);
		if(result[1].success) {
			if(result[1].returned.match(/^[\-\+0-9\.]+$/)) {
				this.x_max_val = result[1].returned * 1;
			} else {
				errors.push('X<sub>max</sub> is non-numeric.');// Report x_max error
			}
		} else errors.push('X<sub>max</sub>: ' + result[0].returned);
		if(errors.length) {
			this.outputBox.expand();
			this.outputBox.setError(errors.join('<BR>'));
		} else
			this.outputBox.collapse();

		// Start handling the subplots
		if(this.shouldBeEvaluated(evaluation_id)) {
			if(this.subplots.length > 0)
				this.subplots[0].continueEvaluation(evaluation_id, true);
			else
				this.childrenEvaluated(evaluation_id);
		} else
			this.childrenEvaluated(evaluation_id);
	}
	_.nextSubplot = function(result, evaluation_id) {
		var current_subplot = subplot.byId[result[0].returned * 1];
		result.splice(0,1);
		if(this.shouldBeEvaluated(evaluation_id)) // Should we try to handle the response?
			current_subplot.handle(result);
		if(this.plot) {
			this.plot.destroy();
			this.plot = false;
		}
		if(this.shouldBeEvaluated(evaluation_id)) { //Should we continue (last response produced no error that stops us?)
			for(var i = 0; i < this.subplots.length; i++)
				if(this.subplots[i] === current_subplot) break;
			i++;
			if(i >= this.subplots.length) {
				// BRENTAN: Change away from C3 (?) and add other plot types etc
				var xs = {};
				var columns = [];
				for(var i = 0; i < this.subplots.length; i++) {
					if(this.subplots[i].plotData.type == 'line') {
						xs['y' + i + ': ' + this.subplots[i].plotData.legend] = 'x' + i;
						var x = this.subplots[i].plotData.data.x;
						x.unshift('x'+i);
						var y = this.subplots[i].plotData.data.y;
						y.unshift('y' + i + ': ' + this.subplots[i].plotData.legend);
						columns.push(x);
						columns.push(y);
					}
				}
				var x_vals = [this.x_min_val];
				var step = (this.x_max_val - this.x_min_val)/10;
				for(var i = 1; i < 11; i++)
					x_vals[i] = x_vals[i-1] + step;
				this.plot = c3.generate({
	    		bindto: this.plotBox[0],
	    		height: 350,
	    		padding: { right: 20 },
	    		point: {
					  show: false
					},
			    axis: {
		        x: {
	            tick: {
                values: x_vals
	            }
		        }
			    },
			    data: {
			      xs: xs,
			      columns: columns
			    },
			    line: {
					  connectNull: true
					}
				});
				this.childrenEvaluated(evaluation_id);
			}
			else
				this.subplots[i].continueEvaluation(evaluation_id, true);
		} else
			this.childrenEvaluated(evaluation_id);
		return false;
	}
	_.changed = function(el) {
		this.needsEvaluation = true;
	}
});
var handlePlotOutput = function(input) {
	// Will transform the plot output from giac.  This is a bit ugly/hacky right now, and in the future would be nicer to clean up emgiac output directly,
	// or to parse with a better understanding of the syntax
	input = input.replace(/group\[pnt/g,'[').split('group[');
	input.splice(0,1); // First match i dont want
	for(var i = 0; i < input.length; i++) {
		input[i] = input[i].replace(/^([^\]]*)\].*$/,'$1');
	}
	input = input.join(',');
	// Now we have a list of pairs as re + im * i
	input = input.split(',');
	var data = {x: [], y: [] };
	for(var i = 0; i < input.length; i++) {
		data.x.push(input[i].replace(/^([\-+]?[\.0-9]+)[\-+\.0-9]+\*i$/,'$1')*1);
		data.y.push(input[i].replace(/^[\-\+]?[\.0-9]+([\-\+\.0-9]+)\*i$/,'$1')*1);
	}
	return data;
}
/* object that is like a child element of 'plot', allows multiple subplots on a single plot */
var subplot = P(function(_) {
	_.parent = 0;
	_.jQ = 0;
  _.outputBox = 0;

  var id = 0;
  this.byId = {};
  function uniqueNodeId() { return id += 1; }
	_.init = function(parent) {
    this.id = uniqueNodeId();
    subplot.byId[this.id] = this;
		this.parent = parent;
		this.mathField = [];
		this.plotData = {};
		this.to_parse = [];
	}
	_.attach = function(duration, focus) {
		if(this.parent.attached) {
			this.jQ = $('<div></div>').addClass(css_prefix + 'plot_item');
			this.jQ.html('<table><tbody><tr><td class="left"></td><td class="right"></td></tr></tbody></table>');
			this.jQ.find('.right').html(this.innerHtml() + '<BR>' + answerSpan());
			this.jQ.find('.left').html('<i class="fa fa-remove"></i>');
			var _this = this;
			this.jQ.find('.left i').on('click', function(e) {
				_this.remove();
			})
			this.jQ.attr('data-plot-id', this.id);
			if(duration) this.jQ.css('display','none');
			this.jQ.insertBefore(this.parent.insertJQ.find('.' + css_prefix + 'plot_add'));
			this.parent.subplots.push(this);
			this.postInsertHandler();
			if(duration) this.jQ.slideDown({duration: duration});
			if(focus) this.focus();
		} else
			this.parent.to_attach.push(this);
		return this;
	}
	_.innerHtml = function() {
		return '';
	}
	_.postInsertHandler = function() {
		this.outputBox = outputBox(this);
		this.parent.focusableItems.push(this.mathField);
		for(var i = 1; i < this.to_parse.length; i++)
			this.mathField[i-1].clear().latex(this.to_parse[i]);
	}
	_.remove = function() {
		for(var i = 0; i < this.parent.focusableItems.length; i++) {
			if(this.mathField[0] == this.parent.focusableItems[i][0]) break;
		}
		this.parent.focusableItems.splice(i,1);
		for(var i = 0; i < this.parent.subplots.length; i++) {
			if(this.parent.subplots[i] == this) {
				this.parent.subplots.splice(i,1);
				break;
			}
		}
		if(this.jQ) 
			this.jQ.slideUp({duration: 400});
		if(this.parent.subplots.length == 0)
			this.parent.appendPlotOption(400,true);
		this.parent.needsEvaluation = true;
		this.parent.redraw();
	}
	_.enterPressed = function(_this) {
		return function(mathField) {
			_this.submissionHandler(_this)(mathField);
		};
	}
	_.submissionHandler = function(_this) {
		return function(mathField) {
			for(var i = 0; i < _this.mathField.length; i++)
				if(_this.mathField[i].text().trim() == '') return;
			_this.parent.redraw();
		};
	}
	_.focus = function() {
		this.mathField[0].focus();
	}
	_.continueEvaluation = function(evaluation_id, move_to_next) {
		var commands = [{command: '' + this.id, nomarkup: true}];  // First command should simply return the id of this plot element.  This is a hack-job way to pass it around...
		if(this.parent.shouldBeEvaluated(evaluation_id)) {
			commands = this.buildCommand(commands);
			giac.execute(evaluation_id, move_to_next, commands, this.parent, 'nextSubplot');
		} else 
			this.parent.childrenEvaluated(evaluation_id);
	}
	_.buildCommand = function(commands) {
		return commands;
	}
	_.toString = function() {
		var out = []
		for(var i = 0; i < this.mathField.length; i++)
			out.push(this.mathField[i].latex());
		return out.join('___');
	}
	_.parse = function(to_parse) {
		this.to_parse = to_parse;
		return this;
	}
});
var line_plot = P(subplot, function(_, super_) {
	_.innerHtml = function() {
		return '<b>line-plot</b>: plot the function ' + mathSpan('plot' + this.id) + ' as a function of ' + mathSpan('var' + this.id);
	}
	_.postInsertHandler = function() {
		this.mathField[1] = registerMath(this.parent, 'var' + this.id, { handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.mathField[0] = registerMath(this.parent, 'plot' + this.id, { handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		super_.postInsertHandler.call(this);
		return this;
	}
	_.buildCommand = function(commands) {
		commands.push({command: 'plot(' + this.mathField[0].text() + ',' + this.mathField[1].text() + '='  + this.parent.x_min_val + '..' + this.parent.x_max_val + ')', nomarkup: true});
		return commands;
	}
	_.handle = function(result) {
		if((this.mathField[0].text() == '') || (this.mathField[1].text() == '')) {
			this.plotData = {};
			return;
		}
		if(result[0].success) {
			if(result[0].returned == '[]') {
				this.plotData = {};
				this.parent.showOptions();
				this.outputBox.expand();
				this.outputBox.setWarning('Nothing to plot.  If you are trying to plot a function, such as f(x), be sure to include the "(x)" portion in the input');
			} else {
				this.outputBox.collapse();
				this.plotData = {type: 'line', data: handlePlotOutput(result[0].returned), legend: this.mathField[0].text()};
			}
		} else {
			this.plotData = {};
			this.parent.showOptions();
			this.outputBox.expand();
			this.outputBox.setError(result[0].returned);
			this.parent.jQ.addClass('error');
		}
	}
	_.toString = function() {
		return 'line___' + super_.toString.call(this);
	}
});
var plot_types = {
	'line': line_plot
}
