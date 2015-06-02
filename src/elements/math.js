var math = P(EditableBlock, function(_, super_) {
	_.klass = ['math'];
	_.mathField = 0;
	_.implicit = false;
	_.lineNumber = true;
	_.evaluatable = true;
	_.unitMode = false;
	_.savedProperties = ['expectedUnits'];
	_.expectedUnits = false;

	_.init = function(latex) {
		super_.init.call(this);
		this.latex = latex || '';
	}
	_.innerHtml = function() {
		return mathSpan('input') + '<BR>' + answerSpan();
	}
	_.postInsertHandler = function() {
		this.mathField = registerMath(this, 'input', { handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems.push(this.mathField);
		this.mathField.write(this.latex);
		this.outputBox = this.jQ.find('.' + css_prefix + 'output_box');
		super_.postInsertHandler.call(this);
		return this;
	}
	_.enterPressed = function(_this) {
		return function(mathField) {
			_this.submissionHandler(_this)(mathField);
			math().insertAfter(_this).show().focus();
		};
	}
	_.changeToText = function(to_text) {
		this.mark_for_deletion = true;
		if(this[L] instanceof text) {
			var left = cleanHtml(this[L].toString());
			var line_break = '<br>';
			if((to_text == '') && (left.slice(-4).toLowerCase() != '<br>'))
				line_break = '<br><br>';
			if((to_text != '') && (left.slice(-4).toLowerCase() == '<br>'))
				line_break = '';
			var el = this[L].append(line_break + to_text).focus(R);
		} else 
			var el = text(to_text).insertAfter(this).show().focus(R);
		if ((to_text.length > 0) && !el.textField.magicCommands()) 
			el.append('&nbsp;').focus(R);
		this.remove(0);
	}
	_.was_scoped = false;
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.needsEvaluation) {
				//console.log(mathField.latex());
				var to_compute = mathField.text();
				if(to_compute.indexOf(':=') > -1) {
					_this.scoped = true;
					_this.was_scoped = true;
					_this.fullEvaluation = true;
				}	else if(_this.was_scoped) {
					if(_this.expectedUnits)
						to_compute = 'convert(' + to_compute + ',' + _this.expectedUnits + ')';
					_this.scoped = false;
					_this.was_scoped = false;
					_this.fullEvaluation = true;
				} else {
					if(_this.expectedUnits)
						to_compute = 'convert(' + to_compute + ',' + _this.expectedUnits + ')';
					_this.scoped = false;
					_this.fullEvaluation = false;
					if(to_compute.trim() === '')
						_this.needsEvaluation = false;
				}
				_this.commands = [to_compute];
				_this.evaluate();
				_this.needsEvaluation = false;
			}
		};
	}
	_.evaluationFinished = function(result) {
		this.outputBox.removeClass('calculating error warn unit_input');
		this.outputBox.find('.warning').remove();
		this.outputBox.find('td.answer_menu').html('');
		if(result[0].success) {
			if((this.scoped) || (result[0].returned.trim() === '')) {
				this.outputBox.find('div.answer').html('');
				// BRENTAN: Should also check if this is the child of an element that suppresses output (like a loop)?
				this.outputBox.closest('div.' + css_prefix + 'answer_table').hide(400);
			} else {
				this.outputBox.find('div.answer').html('');
				this.outputBox.find('td.answer_menu').html('<span class="fa fa-toggle-down"></span>');
				this.outputBox.removeClass('calculating error warn');
				this.outputBox.closest('div.' + css_prefix + 'answer_table').show({ duration: 400, complete: function(_this) { return function() { _this.mathField.reflow(); }; }(this)});
				var field = MathQuill.MathField(this.outputBox.find('div.answer')[0]);
				field.latex(result[0].returned.replace(/"/g,''))
			}
		} else {
			giac.errors_encountered = true;
			this.outputBox.removeClass('calculating warn').addClass('error');
			this.outputBox.closest('div.' + css_prefix + 'answer_table').show({ duration: 400, complete: function(_this) { return function() { _this.mathField.reflow(); }; }(this)});
			this.outputBox.find('div.answer').html(result[0].returned);
		}
		if(result[0].warnings.length > 0) {
			this.outputBox.removeClass('calculating').addClass('warn');
			for(var i = 0; i < result[0].warnings.length; i++) 
				this.outputBox.append('<div class="warning">' + result[0].warnings[i] + '</div>');
			this.outputBox.closest('div.' + css_prefix + 'answer_table').show({ duration: 400, complete: function(_this) { return function() { _this.mathField.reflow(); }; }(this)});
		}
		return true;
	}
	_.AppendText = function() {
		text().insertAfter(this).show().focus(L)
	}
	_.PrependBlankItem = function() {
		//add a blank block just before this one
		if(this[L] instanceof text) 
			math().insertBefore(this).show().changeToText('');
		else
			math().insertBefore(this).show();
		this.focus(L);
	}
	_.mouseClick = function(e) {
		super_.mouseClick.call(this,e);
		// Test for click on answer section
		var $el = $(e.target);
		if($el.closest('td.' + css_prefix + 'output_box').length && !this.outputBox.hasClass('calculating') && !this.outputBox.hasClass('error')) {
			if(this.outputBox.hasClass('unit_input')) return false;
			if($el.closest('.mq-unit').length) {
				this.enableUnitMode();
			}
		} else {
			if(this.outputBox.hasClass('unit_input')) {
				this.unitMode = false;
				this.outputBox.removeClass('unit_input').find(".unit_add").remove();
			}
			this.focus(R);
		}
		return false;
	}
	_.enableUnitMode = function() {
		// We want to change output units.  Temporarily change the 'answer' box to a unit input box, and pass all
		// key commands to this box.  Its onblur handler will auto-destroy this box and return to normal behavior
		this.outputBox.find('div.answer').prepend('<span class="unit_add">convert&nbsp;</span>');
		this.outputBox.find('div.answer').append('<span class="unit_add">&nbsp;to:&nbsp;</span>');
	  this.unitMode = $('<span class="unit_add ' + css_prefix + 'math"></span>');
	  this.unitMode.appendTo(this.outputBox.find('div.answer'));
		this.unitMode = MathQuill.MathField(this.unitMode[0]);
		this.unitMode.clear();
		this.unitMode.setElement(this);
		this.unitMode.setUnitMode(true);
		this.unitMode.focus();
		this.mathField.hideCursor();
		this.unitMode.cmd('\\Unit');
		this.outputBox.addClass('unit_input');
	}
	_.unitChosen = function(output) {
		if(!this.unitMode) return;
		if(output.trim() == '') this.expectedUnits = false;
		else this.expectedUnits = output;
		this.outputBox.removeClass('unit_input').find(".unit_add").remove();
		this.unitMode = false;
		this.needsEvaluation = true;
		this.submissionHandler(this)(this.mathField);
	}
	_.focus = function(dir) {
		super_.focus.call(this);
		this.mathField.focus(dir || 0);
		return this;
	}
	_.blur = function() {
		if(this.unitMode) this.unitMode.blur();
		super_.blur.call(this);
		if(this.implicit && (this.mathField.text() == ''))
			this.remove();
		return this;
	}
  _.toString = function() {
  	return '{math}{' + this.argumentList().join('}{') + '}';
  }

	// Callback for math elements notifying that this element has been changed
	_.changed = function(el) {
		this.implicit = false;
		this.needsEvaluation = true;
	}
	_.setImplicit = function() {
		if(!((this.depth == 0) && (this[L] == 0) && (this[R] == 0)))
			this.implicit = true;
		return this;
	}
  _.keystroke = function(description, evt) { 
  	if(this.unitMode) return this.unitMode.keystroke(description, evt);
  	super_.keystroke.apply(this, arguments);
  }
  _.typedText = function(text) { 
  	if(this.unitMode) return this.unitMode.typedText(text);
  	super_.typedText.apply(this, arguments);
 	}
  _.cut = function(e) { 
  	if(this.unitMode) {
  		this.unitMode.flash();
  		return true;
  	}
  	return super_.cut.apply(this, arguments);
  }
  _.copy = function(e) { 
  	if(this.unitMode) {
  		this.unitMode.flash();
  		return true;
  	}
  	return super_.copy.apply(this, arguments);
  }
  _.paste = function(text) { 
  	if(this.unitMode) {
  		this.unitMode.flash();
  		return;
  	}
  	super_.paste.apply(this, arguments);
  }
  _.write = function(text) { 
  	if(this.unitMode) {
  		this.unitMode.flash();
  		return;
  	}
  	super_.write.apply(this, arguments);
  }

});