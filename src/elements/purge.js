var purge = P(Element, function(_, super_) {
	_.klass = ['purge'];
	_.needsEvaluation = false; 
	_.evaluatable = true;
	_.fullEvaluation = true; 
	_.scoped = true;
	_.lineNumber = true;
	_.helpText = "<<purge <[VARS]>>>\nPurge the variable (or comma seperated list of variables) from memory.  The values of these variables is forgotten at this step for all following calculations.";

	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'purge') + focusableHTML('MathQuill',  'var') + helpBlock();
	}
	_.postInsertHandler = function() {
		this.varField = registerFocusable(MathQuill, this, 'var', { ghost: 'variables', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[registerFocusable(CodeBlock,this, 'purge', { }), this.varField]];
		this.touched = false;
		this.needsEvaluation = false;
		super_.postInsertHandler.call(this);
		return this;
	}
	_.enterPressed = function(_this) {
		return function(item) {
			_this.submissionHandler(_this)();
			if(_this[R] && (_this[R] instanceof math) && _this[R].empty())
				_this[R].focus(L);
			else
				math().setImplicit().insertAfter(_this).show().focus(0);
		};
	}
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.needsEvaluation) {
				_this.commands = [{command: "purge(" + _this.varField.text() + ")", nomarkup: true}];				
				_this.evaluate();
				_this.needsEvaluation = false;
			}
		};
	}
  _.toString = function() {
  	return '{purge}{{' + this.argumentList().join('}{') + '}}';
  }
	// Callback for math elements notifying that this element has been changed
	_.changed = function(el) {
		if(el == this.varField) this.needsEvaluation = true;
	}

});