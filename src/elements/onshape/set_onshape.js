var setOnshape = P(Element, function(_, super_) {
	_.lineNumber = true;

	_.postInsertHandler = function() {
		super_.postInsertHandler.call(this);
		connectOnshape(false).insertAfter(this).show(0).focus(L);
		window.setTimeout(function(_this) { return function() { _this.remove(0); } }(this));
		return this;
	}
  _.toString = function() {
  	return '{onshape_set}{{' + this.argumentList().join('}{') + '}}';
  }
});

var setOnshapeVariable = P(MathOutput, function(_, super_) {
	_.klass = ['connectOnshape'];
	_.part_name = "";
	_.part_id = "";
	_.var_name = "";
	_.var_id = "";
	_.needsEvaluation = false;
	_.savedProperties = ['part_name','part_id','var_name','var_id'];

	_.init = function(part_name, part_id, var_name, var_id) {
		this.part_name = part_name;
		this.part_id = part_id;
		this.var_name = var_name;
		this.var_id = var_id;
		super_.init.call(this);
	}
	_.innerHtml = function() {
	 	return '<table class="' + css_prefix + 'giac_element"><tbody><tr><td class="' + css_prefix + 'var_store"><div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'Onshape')
	 	+ '</div></td><td class="' + css_prefix + 'content"><div class="' + css_prefix + 'focusableItems" data-id="0"><span class="var_name"></span> (<span class="part_name"></span>)'
	  + '<span class="equality">&#8801;</span>' + focusableHTML('MathQuill',  'to_store') + '<span class="to_store">&nbsp;<i class="fa fa-spinner fa-pulse"></i>&nbsp;Updating Onshape</span></div></td></tr></tbody></table>'
	 	+ answerSpan();
	}
	_.postInsertHandler = function() {
		this.varField = registerFocusable(MathQuill, this, 'to_store', { ghost: 'value', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[registerFocusable(CodeBlock, this, 'Onshape', { }),this.varField]];
		super_.postInsertHandler.call(this);
		this.jQ.find('.var_name').html(this.var_name);
		this.jQ.find('.part_name').html(this.part_name);
		return this;
	}
  _.toString = function() {
  	return '{setOnshapeVariable}{{' + this.argumentList().join('}{') + '}}';
  }
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.needsEvaluation) {
				errors = [];
				if(_this.varField.empty())
					errors.push('Please enter a value to store.');
				if(errors.length) {
					if(_this.outputMathBox) {
						_this.worksheet.save();
						_this.outputMathBox.clear();
						_this.setError(errors.join('<BR>'));
					}
				} else {
					if(_this.jQ) _this.jQ.removeClass('warn error');
					_this.commands = _this.genCommand(_this.varField.text());
					_this.commands.push({command: "evalf(" + _this.varField.text() + ")", nomarkup: true});
					_this.evaluate();
					_this.needsEvaluation = false;
				}
			}
		}
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
	// Callback for focusable items notifying that this element has been changed
	_.changed = function(el) {
		this.needsEvaluation = true;
	}
	// Hijack the evaluation chain and set the variable in Onshape
	_.evaluationFinished = function(result) {
		if(result[0].success) {
			var to_store = result[1].returned.trim().replace(/_/g,' ').replace(/  /g,' ');
			if(!to_store.match(/^\-? *[0-9]*(\.[0-9]*)? *[a-z]*$/i))
				result[0] = {success: false, returned: 'Invalid Value: ' + to_store + '.  Answer must be numeric, and only units of length are allowed.'};
			else {
				this.jQ.find('.to_store').show();
				window.ajaxRequest("/onshape/set_variable", {hash_string: this.worksheet.hash_string, eid: this.part_id, fid: this.var_id, name: this.var_name, value: to_store}, function(_this) { return function(response) { 
					_this.jQ.find('.to_store').hide();
					if(!response.true_success) {
						if(response.message.indexOf("400")>=0)
							_this.setError('Invalid Value: ' + to_store + '.  Answer must be numeric, and only units of length are allowed.  Ensure variable still exists in Onshape.')
						else
						_this.setError(response.message);
					}
				}}(this), function(_this) { return function(response) { 
					_this.jQ.find('.to_store').hide();
					_this.setError(response.message)
				}});
			}
		}
		super_.evaluationFinished.call(this, result);
		return true;
	}
});