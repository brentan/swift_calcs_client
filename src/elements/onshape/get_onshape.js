var getOnshape = P(Element, function(_, super_) {
	_.lineNumber = true;

	_.postInsertHandler = function() {
		super_.postInsertHandler.call(this);
		connectOnshape(true).insertAfter(this).show(0).focus(L);
		window.setTimeout(function(_this) { return function() { _this.remove(0); } }(this));
		return this;
	}
  _.toString = function() {
  	return '{onshape_get}{{' + this.argumentList().join('}{') + '}}';
  }
});

var loadOnshapeVariable = P(MathOutput, function(_, super_) {
	_.klass = ['connectOnshape'];
	_.part_name = "";
	_.part_id = "";
	_.var_name = "";
	_.data_loaded = false;
	_.started_load = false;
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
	 	return '<table class="' + css_prefix + 'giac_element"><tbody><tr><td class="' + css_prefix + 'var_store"><div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'to_store') + '<span class="equality">&#8801;</span></div></td>'
	 	+ '<td class="' + css_prefix + 'content><div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'Onshape Variable') + '&nbsp;<span class="var_name"></span> (<span class="part_name"></span>)</div></td></tr>'
	 	+ '<tr><td></td><td style="font-size:11px;"><div class="' + css_prefix + 'hide_print"><div class="' + css_prefix + 'add_equation">refresh value</div></div></td></tr></tbody></table>'
	 	+ answerSpan();
	}
	_.postInsertHandler = function() {
		this.varField = registerFocusable(MathQuill, this, 'to_store', { ghost: 'variable', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[this.varField, registerFocusable(CodeBlock, this, 'Onshape Variable', { })]];
		super_.postInsertHandler.call(this);
		this.jQ.find('.var_name').html(this.var_name);
		this.jQ.find('.part_name').html(this.part_name);
		return this;
	}
  _.toString = function() {
  	return '{loadOnshapeVariable}{{' + this.argumentList().join('}{') + '}}';
  }
	_.mouseClick = function(e) {
		var target = $(e.target);
		if(target.hasClass(css_prefix + 'add_equation')) {
			this.needsEvaluation = true;
			this.altered_content = true;
			this.data_loaded = false;
			this.submissionHandler(this)(this.varField);
			return false;
		}
    if(super_.mouseClick.call(this,e)) return true;
	}
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.needsEvaluation) {
				errors = [];
				if(!_this.varField.text().match(/^[a-z][a-z0-9_~]*$/i))
					errors.push('Invalid variable name (' + _this.worksheet.latexToHtml(_this.varField.latex()) + ').  Please enter a valid variable name');
				if(errors.length) {
					_this.worksheet.save();
					_this.outputMathBox.clear();
					_this.setError(errors.join('<BR>'));
				} else {
					_this.independent_vars = [_this.varField.text().trim()];
					if(_this.data_loaded) {
						_this.evaluate();
						_this.needsEvaluation = false;
					} else {
						_this.started_load = true;
						window.ajaxRequest("/onshape/get_variable", {hash_string: _this.worksheet.hash_string, eid: _this.part_id, fid: _this.var_id}, function(_this) { return function(response) { 
							if(response.var["name"]) {
								_this.jQ.find(".var_name").html(response.var["name"]);
								_this.commands = _this.genCommand(_this.varField.text() + ' := ' + response.var["value"].trim().replace(/  /g,' ').replace(/ /g,'_'));
								_this.data_loaded = true;
								_this.evaluate();
								_this.needsEvaluation = false;
							} else {
								_this.setError("The requested variable was not found...it may have been removed.");
								_this.evaluateNext(evaluation_id)
							}
						}}(_this), function(_this) { return function(response) { 
							_this.setError(response.message)
						}}(_this));
					}
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
		this.needsEvaluation = !this.varField.empty();
	}
	// Hijack the evaluation chain and do what I need to do
	_.continueEvaluation = function(evaluation_id) {
		if(this.varField.empty()) return this.evaluateNext(evaluation_id);
		if(this.data_loaded) return super_.continueEvaluation.call(this, evaluation_id);
		if(!this.started_load) {
			this.needsEvaluation = true;
			this.submissionHandler(this)();
		}
		window.setTimeout(function(_this) { return function() { _this.continueEvaluation(evaluation_id); }}(this),250);
	}

});