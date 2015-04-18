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
	_.submissionHandler = function(_this) {
		//BRENTAN- Evaluation must be handled!
		//console.log(mathField.text());
		return function(mathField) {

		};
	}
	_.PrependBlankItem = function() {
		//add a blank math block just before this one
		math().insertBefore(this).show();
	}
	_.mouseClick = function(e) {
		super_.mouseClick.call(this);
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