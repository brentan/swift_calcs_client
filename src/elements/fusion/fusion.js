
var fusion = P(Element, function(_, super_) {
	_.klass = ['fusion'];
	_.lineNumber = true;
	_.hasChildren = true;
	_.number_of_vars = 0;
	_.evaluatable = true;
	_.vars_loaded = false;

	_.helpText = "<<fusion 360>>\nStore values in to Fusion 360 User Parameters.  Enter the user parameter name on the left and the value or expression on the right.  Click 'sync to Fusion' to store these values in to Fusion 360.";

	_.init = function() {
		this.varList = {};
		super_.init.call(this);
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'fusion 360') + helpBlock()
		+ '</div><div class="' + css_prefix + 'insert ' + css_prefix + 'hide_print"></div><div class="another_link explain ' + css_prefix + 'hide_print" style="margin-left: 60px;"><a href="#">Add another parameter</a></div><div class="' + css_prefix + 'insert"></div>'
		+ '<div class="sync ' + css_prefix + 'hide_print"></div>'
		+ '<div class="' + css_prefix + 'focusableItems" data-id="2">' + focusableHTML('CodeBlock', 'end') + '</div>';
	}
	_.postInsertHandler = function() {
		this.focusableItems = [[registerFocusable(CodeBlock,this, 'fusion 360', { })], [-1], [registerFocusable(CodeBlock,this, 'end', { })]];
		super_.postInsertHandler.call(this);
		if(this.jQ) this.jQ.find('.another_link a').on('click', function(_this) { return function(e) {
			choose_fusion_var().appendTo(_this).show(250).focus(L);
			e.preventDefault();
			e.stopPropagation();
		}; }(this));
		window.ajaxRequest("/fusion/get_vars", {hash_string: this.worksheet.hash_string}, function(_this) { return function(response) { 
			vars = response.vars.split("&");
			for(var i = 0; i < vars.length; i++) {
				var varname = vars[i].replace(/=.*$/,'')
				_this.varList[varname] = varname;
			}
			_this.varList["new+"]="Create new user parameter";
			_this.vars_loaded = true;
			_this.jQ.find('div.sync').html('<a href="#" onclick="window.open(\'fusion360://command=insert&file=na&privateInfo=SwiftCalcs_SC_load_SC_' + response.id + '_SC_' + response.docId + '_SC_\' + Math.floor(Math.random() * (1000000001)),\'_blank\');$(this).addClass(\'grey\');return false;" class="button grey">Sync to Fusion 360</a> <span class="explain">Make sure Fusion 360 is open on your machine</span>')
			var children = _this.children();
			for(var i = 0; i < children.length; i++)
				if(children[i] instanceof choose_fusion_var) children[i].loadVars(_this.varList);
		} }(this), function(_this) { return function(response) { 
			_this.remove(0);
		} }(this));
		return this;
	}
  _.toString = function() {
  	return '{fusion}{{' + this.argumentList().join('}{') + '}}';
  }
	_.validateChild = function(child) {
		return (child instanceof fusion_var) || (child instanceof choose_fusion_var);
	}
	_.implicitType = function() { 
		return choose_fusion_var();
	}
	_.focus = function(dir) {
		super_.focus.call(this, dir);
		if(dir == 0)
			this.ends[L].focus(L);
		return this;
	}
	_.childrenEvaluated = function(evaluation_id) {
		var children = this.children();
		var vars = [];
		for(var i = 0; i < children.length; i++)
			if(children[i] instanceof fusion_var) {
				if((children[i].var_name.trim().length > 0) && (children[i].var_value.trim().length > 0))
					vars.push(children[i].var_name.trim() + "=" + children[i].var_value.trim());
			}
		vars = vars.join("&");
		window.ajaxRequest("/fusion/set_vars", {hash_string: this.worksheet.hash_string, vars: vars}, function(_this) { return function(response) { 
			_this.jQ.find('div.sync a').removeClass('grey');
			if(response.duplicates)
				showNotice("Warning, some parameters are set in other Swift Calcs documents, which may cause conflicts (" + response.duplicates + ")", "red");
		} }(this), function(_this) { return function(response) { 
		} }(this));
		this.evaluateNext(evaluation_id, this.move_to_next);
	}
});

var choose_fusion_var = P(Element, function(_, super_) {
	_.klass = ['fusion'];
	_.innerHtml = function() {
	 	return '<div class="' + css_prefix + 'focusableItems" data-id="0"><div class="' + css_prefix + 'loading"><span class="fa fa-spinner fa-pulse"></span>&nbsp;<i>Loading User Parameter List</i></div><div class="' + css_prefix + 'loaded">'
	 	+ focusableHTML('SelectBox', 'var') + '</div></div>';
	}
	_.postInsertHandler = function() {
		if(this.parent && this.parent.vars_loaded) {
			this.loadVars(this.parent.varList);
			this.focusableItems[0][0].focus(0);
		}
		super_.postInsertHandler.call(this);
		return this;
	}
	_.loadVars = function(varList) {
		this.jQ.find("." + css_prefix + "loading").hide();
		this.jQ.find("." + css_prefix + "loaded").show();
		this.var_select = registerFocusable(SelectBox, this, 'var', { blank_message: 'Choose a Fusion User Parameter', dont_grey_blank: true, options: varList});
		this.focusableItems = [[this.var_select]];
	}
	_.changed = function(el) {
		if(el.text() == "new+") {
			var var_name = prompt("Please enter a name for the new parameter").trim();
			if(var_name.match(/^[a-z][a-z0-9]*$/i)) {
				fusion_var().insertAfter(this).show(0).setVarName(var_name).focus(0);
				this.remove(0);
			} else {
				this.var_select.clear();
				showNotice("Invalid variable name.  Must be letter followed by letter and/or numbers.","red")
			}
		} else {
			fusion_var().insertAfter(this).show(0).setVarName(el.text()).focus(0);
			this.remove(0);
		}
	}
	_.validateParent = function(parent) {
		return (parent instanceof fusion);
	}
	_.toString = function() {
		return '';
	}	
});

var fusion_var = P(MathOutput, function(_, super_) {
	_.klass = ['fusion'];
	_.evaluatable = true;
	_.var_name = '';
	_.var_value = '';
	_.lineNumber = false;
	_.needsEvaluation = false;
	_.savedProperties = ['var_name', 'var_value'];

	_.setVarName = function(var_name) {
		this.var_name = var_name;
		if(this.jQ) this.jQ.find('.var_name').html(this.var_name);
		return this;
	}
	_.innerHtml = function() {
		return '<table class="' + css_prefix + 'giac_element"><tbody><tr><td class="' + css_prefix + 'content">'
	 	+ '<div class="' + css_prefix + 'focusableItems" data-id="0"><span class="var_name"></span> <span class="equality">&#8801;</span> ' + focusableHTML('MathQuill',  'val') + '</div>'
	 	+ '</td></tr></tbody></table>' + answerSpan();
	}
	_.postInsertHandler = function() {
		this.varField = registerFocusable(MathQuill, this, 'val', { ghost: 'value', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[this.varField]];
		super_.postInsertHandler.call(this);
		this.jQ.find('.var_name').html(this.var_name);
		return this;
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
					_this.var_value = '';
					_this.parent.needsEvaluation = true;
					_this.parent.evaluate();
					_this.parent.needsEvaluation = false;
				}
			}
		}
	}
	_.enterPressed = function(_this) {
		return function(item) {
			_this.submissionHandler(_this)();
			if(_this[R])
				_this[R].focus(L);
			else
				math().setImplicit().insertAfter(_this.parent).show().focus(0);
		};
	}
	_.changed = function(el) {
		this.needsEvaluation = true;
	}
	_.validateParent = function(parent) {
		return (parent instanceof fusion);
	}
  _.toString = function() {
  	return '{fusion_var}{{' + this.argumentList().join('}{') + '}}';
  }
	// Hijack the evaluation chain and set the variable in Onshape
	_.evaluationFinished = function(result) {
		this.needsEvaluation = false;
		if(result[1].success && result[2].success) {
			if((result[1].returned.trim() == "1_m") || (result[1].returned.trim() == "1")) {
				var finish_unit = result[1].returned.trim() == "1_m" ? " m" : "";
				var to_store = result[2].returned.trim();
				if(!to_store.match(/^\-? *[0-9]*(\.[0-9]*)?$/i) && !to_store.match(/^\-? *[0-9]*(\.[0-9]*)? *(e|E) *(\-|+)? *[0-9]*(\.[0-9]*)?$/i))
					result[0] = {success: false, returned: 'Invalid Value: ' + to_store + '.  Answer must be numeric.'};
				else
					this.var_value = to_store + finish_unit;
			} else
				result[0] = {success: false, returned: 'Invalid Units: ' + result[1].returned.replace(/_/g,' ').replace(/^1/,'') + '.  Only units of length are allowed.'};
		}
		super_.evaluationFinished.call(this, result);
		return true;
	}
	_.genCommand = function(to_compute) {
		var out = super_.genCommand.call(this, to_compute);
		out.push({command: "mksa_base(evalf(" + to_compute + "))", nomarkup: true});
		out.push({command: "mksa_remove(evalf(" + to_compute + "))", nomarkup: true});
		return out;
	}
});