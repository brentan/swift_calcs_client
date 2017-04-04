
var math = P(MathOutput, function(_, super_) {
	_.klass = ['math'];
	_.mathField = 0;
	_.implicit = false;
	_.not_defined_allowed = "";
	_.savedProperties = ['not_defined_allowed'];
	_.was_altered = false;

	_.init = function(latex) {
		super_.init.call(this);
		this.latex = latex || '';
	}
  
	_.innerHtml = function() {
		return focusableHTML('MathQuill',  'input') + '<BR>' + answerSpan();
	}
	_.postInsertHandler = function() {
		this.mathField = registerFocusable(MathQuill, this, 'input', { handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[this.mathField]];
		if(this.latex.trim().length > 0)
			this.mathField.write(this.latex);
		super_.postInsertHandler.call(this);
		// Test for ans_n as variable assigned in this item.  If so, we need to up the ans_id count
		if(this.mathField.text().match(/^.*ans_[{]?[0-9]+[}]?.*:=.*$/))
			this.setAnswerIdCounter(this.mathField.text().replace(/^.*ans_[{]?([0-9]+)[}]?.*:=.*$/,"$1")*1);

		return this;
	}
	_.enterPressed = function(_this) {
		return function(mathField) {
			var to_compute = mathField.text();
			if(elements[to_compute.toLowerCase()]) {
				window.trackEvent("Block", "Typed", to_compute.toLowerCase());
				_this.needsEvaluation = false;
				_this.mark_for_deletion = true;
				elements[to_compute.toLowerCase()]().insertAfter(_this).show().focus(0);
				_this.remove(0);
			} else {
				_this.submissionHandler(_this)();
				math().setImplicit().insertAfter(_this).show().focus(0);
			}
		};
	}
	_.notifyChangeToText = function(el) {
		if(show_text_mode_popup)
    	SwiftCalcs.createTooltip("<<Looking for Text Mode?>>\nDouble tap the spacebar to change to text mode.  The math written thus far will be transformed into text", el.jQ);
    show_text_mode_popup = false;
	}
	_.notifyEqualSign = function(el) {
		if(window.show_equal_explanation && (el.ctrlSeq == '=') && !$('.base_layout').hasClass('tutorial_open')) {
			window.silentRequest('/users/equal_popup');
			window.show_equal_explanation = false;
    	SwiftCalcs.createTooltip("<<What's the deal with equal?>>\n<span style='font-size:1.5em;font-family:Symbola, Times, serif;position:relative;top:2px;' class='code'>&#8801;</span> is assignment.  Example: <i>x <span style='font-family:Symbola, Times, serif;'>&#8801;</span> 4</i> stores 4 in <i>x</i>\n<span style='font-size:1.5em;font-family:Symbola, Times, serif;position:relative;top:1px;' class='code'>=</span> is logical test.  Use it to test if two values are equal.\n<i>Wrong Equal?</i> Press <[=]> again to toggle between the two.<BR>", el.jQ);
		}
	}
	_.changeToText = function(to_text) {
		if(to_text.match(/^[^=]* := [a-z0-9\.-]+$/i)) {
			// Case of var_name = command.  See if command accepts this type of format (has to allow scoped basically)
      var command = to_text.replace(/^[^=]* := ([a-z0-9\.-]*)$/i,"$1");
      if(SwiftCalcs.elements[command.toLowerCase()]) {
				window.trackEvent("Block", "Typed", command.toLowerCase());
      	var new_el = SwiftCalcs.elements[command.toLowerCase()]();
      	if(new_el.storeAsVariable) {
					var stream = this.worksheet.trackingStream;
					if(!stream) this.worksheet.startUndoStream();
      		// Good to go
					this.mark_for_deletion = true;
      		var var_name = to_text.replace(/^([^=]*) := [a-z0-9\.-]*$/i,"$1");
					this.needsEvaluation = false;
					new_el.insertAfter(this).show().focus(0);
					new_el.storeAsVariable(var_name);
					this.remove(0);
					if(!stream) this.worksheet.endUndoStream();
					return true;
      	} else
      		return false;
      } else
      	return false;
		} else if(to_text.match(/^[a-z][a-z0-9_~]*(\(([a-z][a-z0-9_~]*,)*[a-z][a-z0-9_~]*\))? := {[ ]*$/i)) {
			// Turn in to a conditional statement
			var varName = to_text.replace(/^([a-z][a-z0-9_~]*(\(([a-z][a-z0-9_~]*,)*[a-z][a-z0-9_~]*\))?) := .*$/i,"$1");
			// Fix function names
			if(varName.match(/^[a-z][a-z0-9_~]*\(([a-z][a-z0-9_~]*,)*[a-z][a-z0-9_~]*\)$/i))
				varName = varName.replace(/^([a-z][a-z0-9_~]*)\((([a-z][a-z0-9_~]*,)*[a-z][a-z0-9_~]*)\)$/i,"\\operatorname{$1}\\left({$2}\\right)");
			varName = window.SwiftCalcsLatexHelper.VarNameToLatex(varName);
			var stream = this.worksheet.trackingStream;
			if(!stream) this.worksheet.startUndoStream();
  		// Good to go
			this.mark_for_deletion = true;
			this.needsEvaluation = false;
			var new_el = conditional_assignment();
			new_el.insertAfter(this).show().focus(0);
			new_el.varField.paste(varName);
			new_el.eqFields[0].focus(0);
			this.remove(0);
			if(!stream) this.worksheet.endUndoStream();
			return true;
		}
		this.mark_for_deletion = true;
		var stream = this.worksheet.trackingStream;
		if(!stream) this.worksheet.startUndoStream();
		if(elements[to_text.toLowerCase()]) {
			window.trackEvent("Block", "Typed", to_text.toLowerCase());
			this.needsEvaluation = false;
			elements[to_text.toLowerCase()]().insertAfter(this).show().focus(0);
		}	else {
			// Not a specific command, so we turn in to a text box
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
			if (to_text.length > 0) el.textField.magicCommands();
		}
		this.remove(0);
		if(!stream) this.worksheet.endUndoStream();
		return true;
	}
	_.submissionHandler = function(_this) {
		return function() {
			if(_this.empty()) {
				_this.outputBox.collapse();
			}
			if(_this.needsEvaluation) {
				_this.was_altered = true;
				//console.log(_this.mathField.text());
				var to_compute = _this.mathField.text();
				window.trackEvent("Block", "Execute", to_compute.toLowerCase());
				if(to_compute.match(/^.*=.*=[\s]*$/)) { // Trailing = sign is a mathCad thing, use it to force output, and then remove the equal sign
					_this.mathField.moveToRightEnd().keystroke('Shift-Left',{preventDefault: function() {}}).keystroke('Del',{preventDefault: function() {}}).blur();
					_this.outputMode = 2;
					to_compute = _this.mathField.text();
				}
				if(elements[to_compute.toLowerCase()]) {
					window.trackEvent("Block", "Typed", to_compute.toLowerCase());
					_this.mark_for_deletion = true;
					_this.needsEvaluation = false;
					var stream = _this.worksheet.trackingStream;
					if(!stream) _this.worksheet.startUndoStream();
					elements[to_compute.toLowerCase()]().insertAfter(_this).show();
					_this.remove(0);
					if(!stream) _this.worksheet.endUndoStream();
					return;
				}
				_this.commands = _this.genCommand(to_compute);
				_this.evaluate();
				_this.needsEvaluation = false;
			}
		};
	}
	_.genCommand = function(to_compute) {
		var replacer = function(command) {
			var new_latex = this.mathField.latex().trim().replace(new RegExp("^\\\\operatorname\\{" + command + "\\}\\\\left\\(\\{",''),"").replace(/\}\\right\)$/,"");
			to_compute = this.mathField.clear().write(new_latex).text().trim();
			showNotice(command + " function hidden in input and applied to the output.");
		}
		// Check for algebraic manipulations or approximation, and if found, force output mode (and remove from input)
		if(to_compute.match(/^[/s]*factor\(.*\)[/s]*$/)) {
			this.factor_expand = 'factor';
			replacer.call(this, 'factor');
		} else if(to_compute.match(/^[/s]*expand\(.*\)[/s]*$/)) {
			this.factor_expand = 'expand';
			replacer.call(this, 'expand');
		} else if(to_compute.match(/^[/s]*simplify\(.*\)[/s]*$/)) {
			this.factor_expand = 'simplify';
			replacer.call(this, 'simplify');
		} else if(to_compute.match(/^[/s]*regroup\(.*\)[/s]*$/)) {
			this.factor_expand = false;
			replacer.call(this, 'regroup');
		} else if(to_compute.match(/^[/s]*normal\(.*\)[/s]*$/)) {
			this.factor_expand = 'simplify';
			replacer.call(this, 'normal');
		} else if(to_compute.match(/^[/s]*simplify\(.*\)[/s]*$/)) {
			this.factor_expand = 'simplify';
			replacer.call(this, 'simplify');
		} else if(to_compute.match(/^[/s]*evalf\(.*\)[/s]*$/)) {
			this.approx = true;
			this.approx_set = true;
			replacer.call(this, 'evalf');
		} else if(to_compute.match(/^[/s]*approx\(.*\)[/s]*$/)) {
			this.approx = true;
			this.approx_set = true;
			replacer.call(this, 'approx');
		} else if(to_compute.match(/^[/s]*exact\(.*\)[/s]*$/)) {
			this.approx = false;
			this.approx_set = true; // Exact we still actually need, as it does something, so dont call replacer
		} 
		return super_.genCommand.call(this,to_compute); 
	}
	_.highlightError = function(error_index) {
		this.mathField.highlightError(error_index);
		return this;
	}
	_.storeAsVariable = function() {
    this.focus(-1);
    this.outputMode = 2;
    this.mathField.moveToLeftEnd().write("latex{ans_{" + this.uniqueAnsId() + "}=}").closePopup();
    this.mathField.keystroke('Left', { preventDefault: function() { } }).keystroke('Shift-Home', { preventDefault: function() { } });
	}
	_.focus = function(dir) {
		if(!this.inTree) return this;
		super_.focus.call(this, dir);
		if(!this.mathField) return this;
		if(dir)
			this.mathField.focus(dir);
		else if(dir === 0)
			this.mathField.focus(L);
		return this;
	}
	_.blur = function(to_focus) {
		super_.blur.call(this, to_focus);
		if(this.implicit && this.empty() && this.inTree && !((this.parent.ends[L] === this) && (this.parent.ends[R] === this))) 
			this.remove();
		return this;
	}
	_.windowBlur = function() {
		this.implicit = false;
		return super_.windowBlur.call(this);;
	}
  _.toString = function() {
  	return '{math}{{' + this.argumentList().join('}{') + '}}';
  }
	_.setImplicit = function() {
		this.implicit = true;
		return this;
	}
	_.changed = function(el) {
		super_.changed.call(this, el);
		this.implicit = false;
		this.needsEvaluation = true;
	}
	_.closePopup = function() {
		this.mathField.closePopup();
		return this;
	}
	_.evaluateNext = function(evaluation_id) {
		super_.evaluateNext.call(this, evaluation_id);
		if(!this.scoped()) return;
		if(!this.was_altered) return;
		this.was_altered = false;
		var not_defined = [];
		for(var i = 0; i < this.dependent_vars.length; i++) 
			if(!this.autocomplete_list[this.dependent_vars[i]] 
				&& !this.autocomplete_list[this.dependent_vars[i] + "("] 
				&& !window.mathquillConfigParams.helpList[this.dependent_vars[i]]) not_defined.push(this.dependent_vars[i]);
		if(this.not_defined_allowed == not_defined.join("=")) return;
		if(not_defined.length) {
			this.not_defined_allowed = not_defined.join("=");
			if(!this.worksheet.first_eval_complete) return;
			if(this.worksheet.trackingStream) return;
			if(this.worksheet.suppress_autofunction) return;
			not_defined = $.unique(not_defined);
			// This line relies on a variable that has not been previously defined
			if(this.mathField.text().match(/^[a-z][a-z0-9_~]*(\([a-z][a-z0-9_~,]*\))?[\s]*:=/i)) {
			  //did we mean to make this a function?   
			  if(this.mathField.text().match(/^[a-z][a-z0-9_~]*[\s]*:=/i)) {         
			  	var already_func = false;
				  var varName = this.mathField.latex().replace(/^([^=]*)=.*$/i,"$1");
				  var varnametext = this.mathField.text().replace(/^([a-z][a-z0-9_~]*)[\s]*:=.*$/i,"$1");
	        var everythingElse = this.mathField.latex().replace(/^[^=]*=(.*)$/i,"$1");
	      } else {
	      	var already_func = true;
				  var varName = this.mathField.latex().replace(/^\\operatorname\{([\\ a-z0-9_~\{\}]*)\}\\left\(\{(.*)\}\\right\)[\s]*=.*$/i,"$1");  
				  var curvars = this.mathField.latex().replace(/^\\operatorname\{([\\ a-z0-9_~\{\}]*)\}\\left\(\{(.*)\}\\right\)[\s]*=.*$/i,"$2");  
				  var varnametext = this.mathField.text().replace(/^([a-z][a-z0-9_~]*)\([a-z][a-z0-9_~,]*\)[\s]*:=.*$/i,"$1");
	        var everythingElse = this.mathField.latex().replace(/^[^=]*=(.*)$/i,"$1");
	      }
        var varList = [];
        for(var i = 0; i < not_defined.length; i++)
        	varList.push(window.SwiftCalcsLatexHelper.VarNameToLatex(not_defined[i]));
        // Get current focus
				var el = this.worksheet.activeElement || this.worksheet.lastActive;
				var was_implicit = el ? el.implicit : false;
				el.implicit = false;
				if(el)
					var item = el.focusedItem || el.lastFocusedItem;
				else
					var item = false;
				// Update the mathblock
				this.focus(L);
				this.worksheet.startUndoStream();
        this.mathField.moveToRightEnd().clearSelection().clear().paste("\\operatorname{" + varName + "}\\left({" + (already_func ? (curvars + ",") : "") + varList.join(",") + "}\\right)="+everythingElse); // Clear selection sets undo point for cursor position at end
				this.worksheet.endUndoStream();
				// Restore focus
				if(item) item.focus();
				if(el) el.focus(); 
				if(was_implicit) el.implicit = true;
				// Show message
				if(!already_func)
			  	var message = "Undefined variables in expression.  Transforming <i>" + window.SwiftCalcsLatexHelper.VarNameToHTML(varnametext) + "</i> to function definition.&nbsp;&nbsp;&nbsp;<a href='#' class='help_item' data-id='31'>Learn More</a>&nbsp;|";
			  else
			  	var message = "Undefined variables in function.  Adding undefined variables to input list for <i>" + window.SwiftCalcsLatexHelper.VarNameToHTML(varnametext) + "</i>.&nbsp;&nbsp;&nbsp;<a href='#' class='help_item' data-id='31'>Learn More</a>&nbsp;|";
			  this.addNotice(message, "missing_var", [], true);
			}
		} 
	}
});
var show_text_mode_popup = true;