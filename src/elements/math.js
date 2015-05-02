var math = P(EditableBlock, function(_, super_) {
	_.klass = ['math'];
	_.mathField = 0;
	_.implicit = false;

	_.init = function(latex) {
		super_.init.call(this);
		this.latex = latex || '';
	}
	_.innerHtml = function() {
		return mathSpan('input');
	}
	_.postInsertHandler = function() {
		this.mathField = registerMath(this, 'input', { handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems.push(this.mathField);
		this.mathField.write(this.latex);
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
	_.submissionHandler = function(_this) {
		//BRENTAN- Evaluation must be handled!
		//console.log(mathField.text());
		return function(mathField) {

		};
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
		// BRENTAN: When we have output for these blocks, 'changed' should remove the output and all future block outputs since they are no longer valid
	}
	_.setImplicit = function() {
		if(!((this.depth == 0) && (this[L] == 0) && (this[R] == 0)))
			this.implicit = true;
		return this;
	}

});