/*
Box to create a plot
CURRENTLY LIMITED TO LINE PLOTS, CREATED WITH C3 (in the Swift Calcs repo).  Should be updated
*/
var plot = P(Element, function(_, super_) {
	_.lineNumber = false;
	_.outputBox = 0;
	_.lineNumber = true;
	_.klass = ['plot'];
	_.evaluatable = true;
	_.plot = false;

	_.init = function() {
		super_.init.call(this);
		this.to_attach = [];
		this.subplots = [];
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'code">plot</div><div class="' + css_prefix + 'insert"></div><div class="' + css_prefix + 'plot_box"></div>';
	}
	_.postInsertHandler = function() {
		this.plotBox = this.jQ.find('.' + css_prefix + 'plot_box');
		super_.postInsertHandler.call(this);
		this.focusableItems = [];
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
			this.focusableItems[this.focusableItems.length - 1].focus(R);
		else if(dir == L)
			this.focusableItems[0].focus(L);
		this.showOptions();
		return this;
	}
	_.mouseClick = function(e) {
		var target = $(e.target).closest('div.' + css_prefix + 'plot_item');
		if(target.length == 0) {
			this.focus(L);
			return false;
		}
		if(target.hasClass(css_prefix + 'plot_add')) return false;
		subplot.byId[target.attr('data-plot-id')*1].focus();
		return false;
	}
	_.blur = function() {
		super_.blur.call(this);
		this.hideOptions();
	}
	_.showOptions = function() {
		this.jQ.find('div.' + css_prefix + 'code, div.' + css_prefix + 'insert').slideDown({duration: 300});
	}
	_.hideOptions = function() {
		this.jQ.find('div.' + css_prefix + 'code, div.' + css_prefix + 'insert').slideUp({duration: 300});
	}
  _.toString = function() {
  	// BRENTAN: Enable copy/paste action here:
  	return '{plot}{}';
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
			this.addSpinner();
			this.move_to_next = move_to_next;
			if(this.subplots.length)
				this.subplots[0].continueEvaluation(evaluation_id, true)
			else
				this.childrenEvaluated(evaluation_id);
		} else 
			this.evaluateNext(evaluation_id, move_to_next)
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
						xs['data' + i] = 'x' + i;
						var x = this.subplots[i].plotData.data.x;
						x.unshift('x'+i);
						var y = this.subplots[i].plotData.data.y;
						y.unshift('data'+i);
						columns.push(x);
						columns.push(y);
					}
				}
				this.plot = c3.generate({
	    		bindto: this.plotBox[0],
	    		height: 350,
	    		padding: { right: 20 },
			    data: {
			      xs: xs,
			      columns: columns
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
	}
	_.attach = function(duration, focus) {
		if(this.parent.insertJQ) {
			// BRENTAN: add the 'X' out
			this.jQ = $('<div></div>').addClass(css_prefix + 'plot_item');
			this.jQ.html(this.innerHtml() + '<BR>' + answerSpan());
			this.jQ.attr('data-plot-id', this.id);
			if(duration) this.jQ.css('display','none');
			this.jQ.insertBefore(this.parent.insertJQ.find('.' + css_prefix + 'plot_add'));
			this.parent.subplots.push(this);
			this.postInsertHandler();
			if(duration) this.jQ.slideDown({duration: duration});
			if(focus) this.focus();
		} else
			this.parent.to_attach.push(this);
	}
	_.innerHtml = function() {
		return '';
	}
	_.postInsertHandler = function() {
		this.outputBox = this.jQ.find('.' + css_prefix + 'output_box');
		for(var i = 0; i < this.mathField.length; i++)
			this.parent.focusableItems.push(this.mathField[i]);
	}
	_.remove = function() {
		var to_remove = [];
		for(var i = 0; i < this.parent.focusableItems.length; i++) {
			for(var k = 0; k < this.mathField.length; k++)
				if(this.mathField[k] == this.parent.focusableItems[i]) to_remove.push(i);
		}
		for(var i = 0; i < to_remove.length; i++)
			this.parent.focusableItems.splice(to_remove[i],1);
		for(var i = 0; i < this.parent.subplots.length; i++) {
			if(this.parent.subplots[i] == this) {
				this.parent.subplots.splice(i,1);
				break;
			}
		}
		if(this.jQ) 
			this.jQ.slideUp({duration: 400});
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
});
var line_plot = P(subplot, function(_, super_) {
	_.innerHtml = function() {
		return 'line plot: y(' + mathSpan('var' + this.id) + ') &#8801; ' + mathSpan('plot' + this.id);
	}
	_.postInsertHandler = function() {
		this.mathField[0] = registerMath(this.parent, 'var' + this.id, { handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.mathField[1] = registerMath(this.parent, 'plot' + this.id, { handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		super_.postInsertHandler.call(this);
		return this;
	}
	_.buildCommand = function(commands) {
		commands.push({command: 'plot(' + this.mathField[1].text() + ',' + this.mathField[0].text() + ')', nomarkup: true});
		return commands;
	}
	_.handle = function(result) {
		if(result[0].success) {
			if(result[0].returned == '[]') {
				this.plotData = {};
				this.parent.showOptions();
				this.outputBox.removeClass('calculating error').addClass('warn');
				this.outputBox.closest('div.' + css_prefix + 'answer_table').show({ duration: 400 });
				this.outputBox.find('div.answer').html('<div class="warning">Nothing to plot.  If you are trying to plot a function, such as f(x), be sure to include the "(x)" portion in the input</div>');
			} else {
				this.outputBox.closest('div.' + css_prefix + 'answer_table').hide({ duration: 400 });
				this.plotData = {type: 'line', data: handlePlotOutput(result[0].returned)};
			}
		} else {
			this.plotData = {};
			this.parent.showOptions();
			giac.errors_encountered = true;
			this.outputBox.removeClass('calculating warn').addClass('error');
			this.outputBox.closest('div.' + css_prefix + 'answer_table').show({ duration: 400 });
			this.outputBox.find('div.answer').html(result[0].returned);
		}
	}
});
