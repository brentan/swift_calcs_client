var slider = P(Element, function(_, super_) {

	/*
		TODO: Need to add a 'gear' icon or something to allow customization of slider (min, max, step, unit)
		TODO: Need to store slider info as saved property and need to restore those into the slider where appropriate
	*/

	_.klass = ['slider'];
	_.savedProperties = [];
	_.needsEvaluation = false; 
	_.evaluatable = true;
	_.fullEvaluation = true; 
	_.scoped = true;
	_.lineNumber = true;
	_.helpText = "<<purge <[VARS]>>>\nPurge the variable (or comma seperated list of variables) from memory.  The values of these variables is forgotten at this step for all following calculations.";

	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'var_store') + '<span class="equality">&#8801;</span>' + focusableHTML('Slider', 'value') + helpBlock();
	}
	_.postInsertHandler = function() {
		this.varStoreField = registerFocusable(MathQuill, this, 'var_store', { ghost: 'ans', noWidth: true, handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.slider = registerFocusable(Slider,this, 'value', { unit: "\\Unit{in}" });
		this.focusableItems = [[this.varStoreField, this.slider]];
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
				_this.commands = [{command: "purge(" + _this.varStoreField.text() + ")", nomarkup: true}];				
				_this.evaluate();
				_this.needsEvaluation = false;
			}
		};
	}
  _.toString = function() {
  	return '{slider}{{' + this.argumentList().join('}{') + '}}';
  }
	// Callback for math elements notifying that this element has been changed
	_.changed = function(el) {
		if(el == this.varStoreField) this.needsEvaluation = true;
	}

});