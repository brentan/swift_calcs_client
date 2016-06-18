var getOnshape = P(Element, function(_, super_) {
	_.klass = ['getOnshape'];
	_.lineNumber = true;

	_.innerHtml = function() {
		return '<span class="fa fa-spinner fa-pulse"></span>&nbsp;<i>Connecting to Onshape</i>';
	}
	_.postInsertHandler = function() {
		super_.postInsertHandler.call(this);
		window.ajaxRequest("onshape/get_elements", {id: this.worksheet.server_id}, function(_this) { return function(response) { _this.ajaxCallback(true, response); } }(this), function(_this) { return function(response) { _this.ajaxCallback(false, response); } }(this));
		return this;
	}
	_.ajaxCallback = function(success, response) {
		if(success) {
			if(response.part_list.length == 1)
				getOnshape_3(response.part_list[0]["name"], response.part_list[0]["id"]).insertAfter(this).show(0).focus(R);
			else
				getOnshape_2(response.part_list).insertAfter(this).show(0).focus(R);
		}
		this.remove(0);
	}
  _.toString = function() {
  	return '{getOnshape}{{' + this.argumentList().join('}{') + '}}';
  }
});

var getOnshape_2 = P(Element, function(_, super_) {
	_.klass = ['getOnshape'];
	_.lineNumber = true;
	_.init = function(response) {
		super_.init.call(this);
		this.parts = response; 
		this.parts_list = {};
		for(var i = 0; i < response.length; i++)
			this.parts_list["" + i] = response[i]['name'];
	}
	_.innerHtml = function() {
	 	return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'Read Onshape Variable') + '&nbsp;' + focusableHTML('SelectBox', 'part') + '</div>';
	}
	_.postInsertHandler = function() {
		this.part_select = registerFocusable(SelectBox, this, 'part', { blank_message: 'Choose an Onshape part', dont_grey_blank: true, options: this.parts_list});
		this.focusableItems = [[registerFocusable(CodeBlock, this, 'Read Onshape Variable', { }), this.part_select]];
		super_.postInsertHandler.call(this);
		return this;
	}
	_.changed = function(el) {
		item = this.parts[el.text()*1];
		getOnshape_3(item["name"], item["id"]).insertAfter(this).show(0).focus(R);
		this.remove(0);
	}
  _.toString = function() {
  	return '{getOnshape}{{' + this.argumentList().join('}{') + '}}';
  }
});

var getOnshape_3 = P(Element, function(_, super_) {
	_.klass = ['getOnshape'];
	_.lineNumber = true;
	_.part_name = "";
	_.part_id = "";
	_.savedProperties = ['part_name','part_id'];
	_.init = function(name, id) {
		super_.init.call(this);
		this.part_name = name;
		this.part_id = id;
	}

	_.innerHtml = function() {
	 	return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'Read Onshape Variable') + '&nbsp;from&nbsp;' + this.part_name + '</div>'
		+ '<div class="' + css_prefix + 'left_indent"><span class="fa fa-spinner fa-pulse"></span>&nbsp;<i>Connecting to Onshape</i></div>';
	}
	_.postInsertHandler = function() {
		this.focusableItems = [[registerFocusable(CodeBlock, this, 'Read Onshape Variable', { })]];
		super_.postInsertHandler.call(this);
		window.ajaxRequest("onshape/get_variables", {id: this.worksheet.server_id, eid: this.part_id}, function(_this) { return function(response) { _this.ajaxCallback(true, response); } }(this), function(_this) { return function(response) { _this.ajaxCallback(false, response); } }(this));
		return this;
	}
	_.ajaxCallback = function(success, response) {
		if(success) {
			if(response.var_list.length == 0) {
				getOnshape().insertAfter(this).show(0).focus(R);
				showNotice('This part has no variables.  Create a variable in the part and try again.','red');
			} else
				getOnshape_4(this.part_name, this.part_id, response.var_list).insertAfter(this).show(0).focus(R);
		}
		this.remove(0);
	}
  _.toString = function() {
  	return '{getOnshape_3}{{' + this.argumentList().join('}{') + '}}';
  }
});

var getOnshape_4 = P(Element, function(_, super_) {
	_.klass = ['getOnshape'];
	_.lineNumber = true;
	_.part_name = "";
	_.part_id = "";
	_.savedProperties = ['part_name','part_id'];
	_.init = function(name, id, var_list) {
		super_.init.call(this);
		this.part_name = name;
		this.part_id = id;
		this.vars = var_list; 
		this.var_list = {};
		for(var i = 0; i < var_list.length; i++)
			this.var_list["" + i] = var_list[i]['name'];
	}
	_.innerHtml = function() {
	 	return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'Read Onshape Variable') + '&nbsp;from&nbsp;' + this.part_name + '</div>'
	 	+ '<div class="' + css_prefix + 'focusableItems ' + css_prefix + 'left_indent" data-id="1">' + focusableHTML('SelectBox', 'var') + "</div>";
	}
	_.postInsertHandler = function() {
		this.var_select = registerFocusable(SelectBox, this, 'var', { blank_message: 'Choose a Variable', dont_grey_blank: true, options: this.var_list});
		this.focusableItems = [[registerFocusable(CodeBlock, this, 'Read Onshape Variable', { })],[this.var_select]];
		super_.postInsertHandler.call(this);
		return this;
	}
	_.changed = function(el) {
		item = this.vars[el.text()*1];
		loadOnshapeVariable(this.part_name, this.part_id, item["name"], item["id"]).insertAfter(this).show(0).focus(0);
		this.remove(0);
	}
  _.toString = function() {
  	return '{getOnshape_3}{{' + this.argumentList().join('}{') + '}}';
  }
});



var loadOnshapeVariable = P(MathOutput, function(_, super_) {
	_.klass = ['loadOnshapeVariable'];
	_.part_name = "";
	_.part_id = "";
	_.var_name = "";
	_.var_id = "";
	_.needsEvaluation = false;
	_.fullEvaluation = true;
	_.scoped = true;
	_.savedProperties = ['expectedUnits','approx','factor_expand','outputMode','part_name','part_id','var_name','var_id'];

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
			this.submissionHandler(this)(this.varField);
			return false;
		}
    if(super_.mouseClick.call(this,e)) return true;
	}
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.needsEvaluation) {
				errors = [];
				if(!_this.varField.text().match(/^[a-z][a-z0-9_]*$/i))
					errors.push('Invalid variable name (' + _this.worksheet.latexToHtml(_this.varField.latex()) + ').  Please enter a valid variable name');
				if(errors.length) {
					_this.worksheet.save();
					_this.outputMathBox.clear();
					_this.setError(errors.join('<BR>'));
				} else {
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
		this.needsEvaluation = !this.varField.empty();
	}
	// Hijack the evaluation chain and do what I need to do
	_.continueEvaluation = function(evaluation_id, move_to_next) {
		if(this.shouldBeEvaluated(evaluation_id)) {
			this.addSpinner(evaluation_id);
			window.ajaxRequest("onshape/get_variable", {id: this.worksheet.server_id, eid: this.part_id, fid: this.var_id}, function(_this) { return function(response) { 
				console.log(response);
				if(response.var["name"]) {
					_this.jQ.find(".var_name").html(response.var["name"]);
					_this.commands = _this.genCommand(_this.varField.text() + ' := ' + response.var["value"].trim().replace(/  /g,' ').replace(/ /g,'_'));
					_this.continueEvaluation2(evaluation_id, move_to_next);
				} else {
					_this.setError("The requested variable was not found...it may have been removed.");
					_this.evaluateNext(evaluation_id, move_to_next)
				}
			}}(this), function(_this) { return function(response) { 
				_this.setError(response.message)
				_this.evaluateNext(evaluation_id, move_to_next)
			}});
		} else 
			this.evaluateNext(evaluation_id, move_to_next)
	}
	_.continueEvaluation2 = function(evaluation_id, move_to_next) {
		giac.execute(evaluation_id, move_to_next, this.commands, this, 'evaluationFinished');
	}

});