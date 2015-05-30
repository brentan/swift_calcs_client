var math = P(EditableBlock, function(_, super_) {
	_.klass = ['math'];
	_.mathField = 0;
	_.implicit = false;
	_.lineNumber = true;
	_.evaluatable = true;

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
				console.log(mathField.latex());
				var to_compute = mathField.text();
				if(to_compute.indexOf(':=') > -1) {
					_this.scoped = true;
					_this.was_scoped = true;
					_this.fullEvaluation = true;
				}	else if(_this.was_scoped) {
					_this.scoped = false;
					_this.was_scoped = false;
					_this.fullEvaluation = true;
				} else {
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
		this.outputBox.removeClass('calculating error warn');
		this.outputBox.find('.warning').remove();
		if(result[0].success) {
			if((this.scoped) || (result[0].returned.trim() === '')) {
				// BRENTAN: Should also check if this is the child of an element that suppresses output (like a loop)?
				this.outputBox.closest('div.' + css_prefix + 'answer_table').hide(400);
			} else {
				this.children('div').html('');
				this.outputBox.removeClass('calculating error warn');
				this.outputBox.closest('div.' + css_prefix + 'answer_table').show({ duration: 400, complete: function(_this) { return function() { _this.mathField.reflow(); }; }(this)});
				var field = MathQuill.MathField(this.outputBox.children('div')[0]);
				field.latex(result[0].returned.replace(/"/g,''))
				console.log(result[0].returned.replace(/"/g,''));
			}
		} else {
			giac.errors_encountered = true;
			this.outputBox.removeClass('calculating warn').addClass('error');
			this.outputBox.closest('div.' + css_prefix + 'answer_table').show({ duration: 400, complete: function(_this) { return function() { _this.mathField.reflow(); }; }(this)});
			this.outputBox.children('div').html(result[0].returned);
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
		this.focus(R);
		return false;
	}
	_.focus = function(dir) {
		super_.focus.call(this);
		this.mathField.focus(dir || 0);
		return this;
	}
	_.blur = function() {
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
		// BRENTAN: When we have output for these blocks, 'changed' should remove the output and all future block outputs since they are no longer valid
	}
	_.setImplicit = function() {
		if(!((this.depth == 0) && (this[L] == 0) && (this[R] == 0)))
			this.implicit = true;
		return this;
	}

});