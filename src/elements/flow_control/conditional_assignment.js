var conditional_assignment = P(MathOutput, function(_, super_) {
	_.klass = ['conditional_assignment'];
	_.needsEvaluation = false; 
	_.evaluatable = true;
	_.fullEvaluation = true; 
	_.scoped = true;
	_.lineNumber = true;
	_.number_of_conditions = 2;
	_.savedProperties = ['number_of_conditions'];

	_.helpText = "<<if <[TEST]>>>\nIf the result of TEST is true (or non-zero), the block will be evaluated.  Otherwise, the block is skipped.  Examples: if x = 2, if x > 4";

	_.init = function(latex) {
		this.eqFields = [];
		this.condFields = [];
		super_.init.call(this);
    this.latex = latex || '';
	}
	_.innerHtml = function() {
		return '<table class="' + css_prefix + 'conditional_assignment"><tbody><tr><td>'
	 	+ '<div class="' + css_prefix + 'focusableItems" data-id="0"><span>' + focusableHTML('MathQuill',  'var') + '<span class="equality">&#8801;</span></span></td><td class="' + css_prefix + 'conditional"><div></div><div></div><div></div><div></div></td>'
	 	+ '<td class="' + css_prefix + 'content"><div><div class="' + css_prefix + 'focusableItems" data-id="0"><div>' + focusableHTML('MathQuill',  'eq0') + '</div><div>' + '<span class="sc_CodeBlock sc_CommandBlock">&nbsp;if&nbsp;</span></div><div class="' + css_prefix + 'condition">' + focusableHTML('MathQuill',  'cond0') + '&nbsp;<i class="fa fa-remove ' + css_prefix + 'hide_print"></i></span></div></div>'
	 	+ '<div class="' + css_prefix + 'focusableItems" data-id="1"><div>' + focusableHTML('MathQuill',  'eq1') + '</div><div></div><div class="' + css_prefix + 'add_here">' + "<span class='sc_CodeBlock sc_CommandBlock'>&nbsp;otherwise&nbsp;</span>" + '</div></div></div>'
	 	+ '</td></tr><tr><td></td><td></td><td>'
	 	+ '<div class="' + css_prefix + 'hide_print"><div class="' + css_prefix + 'add_equation">Add another condition</div><div>'
	 	+ '</td></tr></tbody></table>' + answerSpan();
	}
	_.postInsertHandler = function() {
		this.content_td = this.jQ.find("." + css_prefix + "content");
		this.bracket_span = this.jQ.find("." + css_prefix + "conditional").children();
		this.eqFields[0] = registerFocusable(MathQuill, this, 'eq0', { ghost: 'expression', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.eqFields[1] = registerFocusable(MathQuill, this, 'eq1', { ghost: 'expression', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.condFields[0]= registerFocusable(MathQuill, this, 'cond0', { ghost: 'condition', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.varField = registerFocusable(MathQuill, this, 'var', { ghost: 'variable', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.condFields[0].setExpressionMode(true);
		this.focusableItems = [[this.varField, this.eqFields[0], this.condFields[0]] , [this.eqFields[1]]];
		this.needsEvaluation = false;
    if(this.latex.trim().length > 0)
      this.varField.write(this.latex);
		super_.postInsertHandler.call(this);
		return this;
	}
	_.mathquill_reflow = function() {
		this.bracket_span.height('6px');
		this.bracket_span.height(Math.floor(this.content_td.height()/4) + 'px');
	}
	_.reflow = function() {
		this.mathquill_reflow();
		return super_.reflow.call(this);
	}
  _.parseSavedProperties = function(args) {
  	super_.parseSavedProperties.call(this, args);
  	// After we do this, we want to set up the DOM correctly for the number of equations this block had, before rest of parse completes
  	var conditions_to_add = this.number_of_conditions;
  	this.number_of_conditions = 2;
  	for(var i = 2; i < conditions_to_add; i++)
  		this.addEquation(false, true);
  	this.redoFocusableList();
  	return this;
  }
  _.eq_id = 2;
  _.addEquation = function(focus, skip_focusable) {
  	// Add a new equation line to the solver list
  	var html_cond = focusableHTML('MathQuill',  'cond' + (this.eq_id - 1)) + '&nbsp;<i class="fa fa-remove ' + css_prefix + 'hide_print"></i>';
  	var html_new  = '<div class="' + css_prefix + 'focusableItems" data-id="' + this.eq_id + '"><div>' + focusableHTML('MathQuill',  'eq' + this.eq_id) + '</div><div></div><div class="' + css_prefix + 'add_here">' + "<span class='sc_CodeBlock sc_CommandBlock'>&nbsp;otherwise&nbsp;</span>" + '</div></div>';
		var add_jQ = this.jQ.find('.' + css_prefix + 'add_here');
		add_jQ.removeClass(css_prefix + 'add_here').addClass(css_prefix + 'condition').html(html_cond);
		add_jQ.prev().html("<span class='sc_CodeBlock sc_CommandBlock'>&nbsp;if&nbsp;</span>");
		add_jQ.parent().after(html_new);
		this.eqFields.push(registerFocusable(MathQuill, this, 'eq' + this.eq_id, { ghost: 'expression', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}}));
		this.condFields.push(registerFocusable(MathQuill, this, 'cond' + (this.eq_id-1), { ghost: 'condition', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}}));
		this.condFields[this.number_of_conditions-1].setExpressionMode(true);
		this.eq_id++;
		this.number_of_conditions++;
		if(!skip_focusable) this.redoFocusableList();
		if(focus) this.condFields[this.number_of_conditions-2].focus(1);
  }
  _.removeEquation = function(index) {
  	if(this.eqFields[index].touched || (this.condFields[index] && this.condFields[index].touched)) this.changed();
  	this.eqFields.splice(index, 1);
  	if(this.condFields[index]) this.condFields.splice(index, 1);
  	this.jQ.find('.' + css_prefix + 'content').find('.' + css_prefix + 'focusableItems').each(function() {
  		var el = $(this);
  		if((el.attr('data-id')*1) == index)
  			el.remove(0);
  	});
		this.number_of_conditions--;
		if(this.number_of_conditions == 1) {// Convert back into normal assignment
    	var new_el = math();
			var stream = this.worksheet.trackingStream;
			if(!stream) this.worksheet.startUndoStream();
			this.mark_for_deletion = true;
			this.needsEvaluation = false;
			new_el.insertAfter(this).show().focus(0);
  		new_el.paste(this.varField.latex() + '=' + this.eqFields[0].latex());
  		console.log(this.varField.latex() + '=' + this.eqFields[0].latex());
			this.remove(0);
			if(!stream) this.worksheet.endUndoStream();
		} else {
  		this.redoFocusableList();
  		if(index > 0) this.eqFields[index-1].focus(1);
  		else this.eqFields[0].focus(1);
  		this.mathquill_reflow();
		}
  }
  _.redoFocusableList = function() {
  	var id = 0;
  	// Renumber the DOM ids
  	this.jQ.find('.' + css_prefix + 'content').find('.' + css_prefix + 'focusableItems').each(function() {
  		$(this).attr('data-id', id);
  		id++;
  	});
  	// Recreate focusable Items array
		this.focusableItems = [[this.varField, this.eqFields[0], this.condFields[0]]];
		for(var i = 1; i < this.number_of_conditions; i++) {
			if((i + 1) == this.number_of_conditions)
			 this.focusableItems.push([this.eqFields[i]]);
			else
			 this.focusableItems.push([this.eqFields[i], this.condFields[i]]);
		}
  }
	_.mouseClick = function(e) {
		var target = $(e.target);
		if(target.hasClass(css_prefix + 'add_equation')) {
			this.addEquation(true);
			return false;
		}
		if(target.hasClass('fa-remove')) {
			this.removeEquation(target.closest('div.' + css_prefix + 'focusableItems').attr('data-id')*1);
			return false;
		}
    if(super_.mouseClick.call(this,e)) return true;
	}

	// Callback for focusable items notifying that this element has been changed
	_.changed = function(el) {
		for(var i = 0; i < this.eqFields.length; i++)
			if(el === this.eqFields[i]) this.eqFields[i].touched = true;
		for(var i = 0; i < this.condFields.length; i++)
			if(el === this.condFields[i]) this.condFields[i].touched = true;
		if(el === this.varField)
			this.varField.touched = true;
		var all_touched = true;
		for(var i = 0; i < this.eqFields.length; i++)
			all_touched = all_touched && this.eqFields[i].touched;
		for(var i = 0; i < this.condFields.length; i++)
			all_touched = all_touched && this.condFields[i].touched;
		if(all_touched && this.varField.touched && !this.varField.empty())
			this.needsEvaluation = true;
	}
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.needsEvaluation) {
				// check for anything that is empty
				var errors = [];
				if(!_this.varField.text().match(/^[a-z][a-z0-9_]*(\(([a-z][a-z0-9_]*,)*[a-z][a-z0-9_]*\))?$/i))
					errors.push('Invalid variable name (' + _this.worksheet.latexToHtml(_this.varField.latex()) + ').  Please enter a valid variable name');
				for(var i = 0; i < _this.eqFields.length; i++)
					if(_this.eqFields[i].empty()) errors.push('Expression ' + (i+1) + ' is currently empty.  Please add an expression.');
				for(var i = 0; i < _this.condFields.length; i++)
					if(_this.condFields[i].empty()) errors.push('Condition ' + (i+1) + ' is currently empty.  Please add a condition.');
				if(errors.length && _this.outputMathBox) {
					_this.worksheet.save();
					_this.outputMathBox.clear();
					_this.setError(errors.join('<BR>'));
				} else {
					var eqs = [];
					var conds = [];
					$.each(_this.eqFields, function(i, v) { eqs.push(v.text()); });
					$.each(_this.condFields, function(i, v) { conds.push(v.text()); });
					if(_this.varField.text().trim().match(/^[a-z][a-z0-9_]*$/i)) {
						var command = _this.varField.text() + ' := ';
						var end_command = '';
						var return_command = '';
					} else {
						var command = _this.varField.text() + ' := { ';
						var end_command = '}';
						var return_command = 'return';
					}
					for(var i = 0; i < conds.length; i++) {
						command += 'if(evalf(' + conds[i] + ')) { ' + return_command + ' (' + eqs[i] + '); } else {';
						end_command += "}";
					}
					command = command + return_command + '(' + eqs[i] + ');' + end_command;
					_this.commands = _this.genCommand(command); 
					_this.evaluate();
					_this.needsEvaluation = false;
				}
			}
		};
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
				if(_this[R] && (_this[R] instanceof math) && _this[R].empty())
					_this[R].focus(L);
				else
					math().setImplicit().insertAfter(_this).show().focus(0);
			}	
		};
	}
  _.toString = function() {
  	return '{conditional_assignment}{{' + this.argumentList().join('}{') + '}}';
  }
  _.focus = function(dir) {
    if(!this.inTree) return this;
    super_.focus.call(this, dir);
    if(dir === R) this.eqFields[this.eqFields.length - 1].focus(R);
    else if((dir === 0) || (dir === L)) this.varField.focus(L);
    return this;
  }
});