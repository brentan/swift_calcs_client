/* Math output is an extension of Element that has some built in commands
   to support math output in the output box, as well as some other functionality */

var MathOutput = P(EditableBlock, function(_, super_) {
	_.lineNumber = true;
	_.evaluatable = true;
	_.unitMode = false;
	//_.savedProperties = hard-coded in to element.js, since this is an overridden class.  Add them there
	_.expectedUnits = false;
	_.approx = false;
  _.approx_set = false;
	_.factor_expand = false;
	_.pre_command = false;
	_.nomarkup = false;
	_.answerLatex = '';
	_.digits = 0;
	// Output mode has three values: 0 is auto, 1 is force hide, 2 is force show
	_.outputMode = 0

	_.init = function() {
		super_.init.call(this);
    this.skipAutoUnit = {};
    return this;
	}
  _.uniqueAnsId = function() { return ans_id += 1; }
  _.setAnswerIdCounter = function(val) {
  	ans_id = max(ans_id, val);
  }
	_.postInsertHandler = function() {
		super_.postInsertHandler.call(this);
    if(!this.approx_set) this.approx = false;
		this.outputMathBox = MathQuill.MathField(this.outputBox.jQ.find('div.answer')[0]);
		this.outputMathBox.setElement(this).setStaticMode(this);
		return this;
	}
	_.genCommand = function(to_compute) {
		//Find Independant Var:
		this.independent_vars = GetIndependentVars(to_compute);
		this.dependent_vars = GetDependentVars(to_compute);

		//Perform unit check
		var reg = /([^a-zA-Z0-9_]|^)_([a-zA-Zµ2]+)/g;
		var result;
		while((result = reg.exec(to_compute)) !== null) {
    	if(!window.checkForValidUnit(result[2])) {
    		// Invalid unit in entry
    		return [{command: to_compute, genError: "Error: Unknown unit in input (" + result[2] + ").  This is not a built-in unit.  Please express as a function of built-in units (use the 'm/s' dropdown from the menubar for a full list).", error_index: result.index}];
    	}
		}

		var to_send = [{command: to_compute, unit: this.worksheet.latexToUnit(this.expectedUnits), approx: (this.approx && this.approx_set) ? true : (this.approx_set ? false : null), digits: this.digits, simplify: this.factor_expand, nomarkup: this.nomarkup}];
		if(this.pre_command)
			to_send.pre_command = this.pre_command;
		return to_send;
	}
	_.PrependBlankItem = function(el) {
		if(el === this.focusableItems[0][0]) {
			//add a blank block just before this one
			math().insertBefore(this).show();
			this.focus(L);
			return true;
		} else
			return false;
	}
	_.evaluationFinished = function(result) {
		return this.displayResults(result);
	}
	_.displayResults = function(result) {
		this.last_result = result;
		this.outputBox.jQ.removeClass('calculating error warn unit_input hide_pulldown');
		this.outputBox.jQ.find('.warning').remove();
		this.outputBox.jQ.find('.error').remove();
		this.outputBox.jQ.find('td.answer_menu').html('');
		this.outputBox.tableJQ.next("div." + css_prefix + "calculation_stopped").slideUp({duration: 250, always: function() { $(this).remove(); } });
		if(result[0].success) {
			if((this.scoped() && (this.outputMode != 2)) || (result[0].returned.trim() === '') || (this.outputMode == 1)) {
				this.outputMathBox.clear();
				this.outputMathBox.jQ.hide();
				this.outputBox.collapse();
				if(result[0].returned.trim() !== '') {
					this.expandArrow();
				}
			} else if(this.allowOutput()) {
				this.outputMathBox.clear();
				this.outputMathBox.jQ.show();
				this.collapseArrow();
				var menu = $('<div></div>').addClass('pulldown');
				this.outputBox.jQ.find('td.answer_menu').html('<span class="fa fa-toggle-down"></span>').append($('<div></div>').addClass('pulldown_holder').append(menu));
				this.outputBox.jQ.removeClass('calculating error warn');
				this.outputBox.expand();
				if((result[0].returned.length > 3500) && !result[0].force_display) {
					// Whew that's a big answer! Warn about it and suppress output.
					menu.remove();
					this.outputBox.jQ.addClass('hide_pulldown');
					this.outputMathBox.jQ.hide();
					this.outputBox.setWarning("Long result returned, display suppressed to improve performance.  <a class='suppress_display'>Show Result</a>", true);
					this.outputBox.jQ.find('.suppress_display').on('click', function(_this) { return function() {
						_this.last_result[0].force_display = true;
						$(this).hide();
						$("<div/>").html('<span class="fa fa-spinner fa-pulse"></span><i>working...</i>').insertAfter($(this));
						window.setTimeout(function() { _this.displayResults(_this.last_result); });
					}; }(this));
				} else {
					try {
						this.outputMathBox.latex(result[0].returned);
					} catch(e) {
						this.outputMathBox.clear();
						this.outputBox.jQ.removeClass('calculating');
						if(this.outputMode != 1) {
							this.outputBox.setWarning("There was an error encountered while rendering this result.  This is a display error, you should be able to continue evaluations based on this result",false);
							this.outputBox.expand();
							this.collapseArrow();
						}
						return true;
					}
					var height = this.outputBox.jQ.find('div.answer').height();
					this.answerLatex = result[0].returned.replace(/^.*\\Longrightarrow \\whitespace/,'');
					menu.css({top: Math.floor(height/2-9) + 'px'});
					if(result[0].suppress_pulldown || !this.allow_interaction()) {
						menu.remove();
						this.outputBox.jQ.addClass('hide_pulldown');
					} else {
						// Create the pulldown menu
						menu.append('<div class="pulldown_item" data-action="copyAnswer">Copy to new line</div>');
						if(!this.scoped() && this.storeAsVariable)
							menu.append('<div class="pulldown_item" data-action="storeAsVariable">Assign to variable</div>');
						if(!(this.commands[0].command && this.commands[0].command.match(/^[\s]*[a-z][a-z0-9_]*\([a-z0-9_,]+\)[\s]*:=/i))) { // these dont do anything on function outputs
							if(result[0].returned.indexOf('\\Unit') > -1)
								menu.append('<div class="pulldown_item" data-action="enableUnitMode">Change units</div>');
							if(this.digits == 0) {
								// Use default precision
									menu.append('<div class="pulldown_item" data-action="setDigits">Change precision (current: default)</div>');
							} else {
								// Use custom precision
									menu.append('<div class="pulldown_item" data-action="setDigits">Change precision (current: ' + this.digits + ' digit' + (this.digits > 1 ? 's' : '') + ')</div>');
							}
							menu.append('<div class="pulldown_bubble">Output Display Mode</div>');
							var bubble = '<div class="pulldown_bubble"><span class="bubble_items">'
								+ '<span class="bubble_item' + ((this.approx_set && !this.approx) ? " select" : "") + '" data-action="toggleExact">Exact (1/3)</span>'
								+ '<span class="bubble_item' + (this.approx ? " select" : "") + '" data-action="toggleApprox">Approximate (0.333)</span>'
								+ '</span></div>';
							menu.append(bubble);
							menu.append('<div class="pulldown_bubble">Algebriac Manipulations</div>');
							var bubble = '<div class="pulldown_bubble"><span class="bubble_items">'
								+ '<span class="bubble_item' + ((this.factor_expand === 'simplify') ? " select" : "") + '" data-action="toggleSimplify">Simplify</span>'
								+ '<span class="bubble_item' + ((this.factor_expand === 'factor') ? " select" : "") + '" data-action="toggleFactor">Factor</span>'
								+ '<span class="bubble_item' + ((this.factor_expand === 'expand') ? " select" : "") + '" data-action="toggleExpand">Expand</span>'
								+ '</span></div>';
							menu.append(bubble);
						}
					}
				}
			}
			if(result[0].warnings.length > 0) {
				this.outputBox.jQ.removeClass('calculating');
				if(this.outputMode != 1) {
					var already_issued = [];
					for(var i = 0; i < result[0].warnings.length; i++) {
						if(already_issued.indexOf(result[0].warnings[i]) >= 0) continue;
						this.outputBox.setWarning(result[0].warnings[i],true);
						already_issued.push(result[0].warnings[i]);
					}
					this.outputBox.expand();
					this.collapseArrow();
				}
			}
		} else {
			this.highlightError(result[0].error_index);
			this.setError(result[0].returned);
		}  
		return true;
	}
	_.highlightError = function(error_index) {
		return this;
	}
	_.setError = function(error) {
		this.outputMathBox.jQ.hide();
		this.outputBox.jQ.removeClass('calculating error warn unit_input hide_pulldown');
		this.outputBox.jQ.find('.warning').remove();
		this.outputBox.jQ.find('.error').remove();
		this.outputBox.jQ.find('td.answer_menu').html('');
		this.outputBox.tableJQ.next("div." + css_prefix + "calculation_stopped").slideUp({duration: 250, always: function() { $(this).remove(); } });
		this.outputBox.setError(error, true);
		if(this.outputMode == 1) {
			this.outputMathBox.clear();
			this.outputMathBox.jQ.hide();
			this.outputBox.collapse();
			this.expandArrow();
		} else {
			this.collapseArrow();
			this.outputBox.expand();
		}
	}
	_.collapse = function() {
		this.outputMode = 1;
		this.outputBox.collapse();
		this.expandArrow();
		this.worksheet.save();
		return this;
	}
	_.expand = function() {
		this.outputMode = 2;
		this.evaluationFinished(this.last_result);
		this.worksheet.save();
		return this;
	}
	_.copyAnswer = function() {
		var latex = this.outputMathBox.getSelection();
		math().insertAfter(this).show(450).focus(L).write(latex !== '' ? latex : this.answerLatex).closePopup();
	}
	_.toggleApprox = function() {
    this.approx_set = true;
		this.approx = true;
		this.needsEvaluation = true;
		this.outputSettingsChange = true;
		this.submissionHandler(this)();
	}
	_.toggleExact = function() {
    this.approx_set = true;
		this.approx = false;
		this.needsEvaluation = true;
		this.outputSettingsChange = true;
		this.submissionHandler(this)();
	}
	_.toggleExpand = function() {
		if(this.factor_expand == 'expand') this.factor_expand = false;
		else this.factor_expand = 'expand';
		this.needsEvaluation = true;
		this.outputSettingsChange = true;
		this.submissionHandler(this)();
	}
	_.toggleFactor = function() {
		if(this.factor_expand == 'factor') this.factor_expand = false;
		else this.factor_expand = 'factor';
		this.needsEvaluation = true;
		this.outputSettingsChange = true;
		this.submissionHandler(this)();
	}
	_.toggleSimplify = function() {
		if(this.factor_expand == 'simplify') this.factor_expand = false;
		else this.factor_expand = 'simplify';
		this.needsEvaluation = true;
		this.outputSettingsChange = true;
		this.submissionHandler(this)();
	}
	_.setDigits = function() {
		var digits = prompt("Enter the number of significant digits to use for this result (delete to return to default value)", (this.digits > 0 ? this.digits+"" : ""));
		if(digits == null) return;
		if(digits.trim() == '') {
			this.digits = 0;
			this.needsEvaluation = true;
			this.outputSettingsChange = true;
			this.submissionHandler(this)();
			return;
		} 
		if(!digits.match(/^[0-9]+$/)) {
			showNotice("Invalid Entry: Please enter an integer from 1 to 14", "red");
			return;
		}
		digits = digits * 1;
		if(digits < 1) {
			showNotice("Invalid Entry: Please enter an integer from 1 to 14", "red");
			return;
		}
		if(digits > 14) {
			showNotice("Invalid Entry: Please enter an integer from 1 to 14", "red");
			return;
		}
		this.digits = digits;
		this.needsEvaluation = true;
    this.approx_set = true;
		this.approx = true;
		this.outputSettingsChange = true;
		this.submissionHandler(this)();
	}
	_.mouseUp = function(e) {
		// Test for clicks on unit box in answer, which should allow unit conversions
		if(super_.mouseUp.call(this,e)) return true;
		if((this.start_target === -1) || this.unitMode || (this.start_target !== this.outputMathBox) || (this.outputMathBox.getSelection() !== '')) return false;
		if($(e.target).closest('.mq-unit').length) 
			this.enableUnitMode();
		return false;
	}
	_.mouseClick = function(e) {
		if(super_.mouseClick.call(this,e)) return true;
		// Test for click on answer pulldown
		var $el = $(e.target);
		if($el.closest('td.' + css_prefix + 'output_box').length && !this.outputBox.jQ.hasClass('calculating') && !this.outputBox.jQ.hasClass('error') && !this.outputBox.jQ.hasClass('hide_pulldown')) {
			if(this.outputBox.jQ.hasClass('unit_input')) return false;
			if($el.closest('.pulldown_item').length) 
				this[$el.closest('.pulldown_item').attr('data-action')]();
			else if($el.closest('.bubble_item').length) 
				this[$el.closest('.bubble_item').attr('data-action')]();
			else if($el.closest('.pulldown_bubble').length) 
				return false;
			this.outputBox.jQ.addClass('hide_pulldown');
			window.setTimeout(function(box) { return function() { box.removeClass('hide_pulldown'); }; }(this.outputBox.jQ), 250);
		} else {
			if(this.outputBox.jQ.hasClass('unit_input')) {
				this.unitMode = false;
				this.outputBox.jQ.removeClass('unit_input').find(".unit_add").remove();
			}
			this.focus(R);
		}
		return false;
	}
	_.enableUnitMode = function() {
		// We want to change output units.  Temporarily change the 'answer' box to a unit input box, and pass all
		// key commands to this box.  Its onblur handler will auto-destroy this box and return to normal behavior
		this.outputBox.jQ.find('div.answer').prepend('<span class="unit_add">convert&nbsp;</span>');
		this.outputBox.jQ.find('div.answer').append('<span class="unit_add">&nbsp;to:&nbsp;</span>');
	  this.unitMode = $('<span class="unit_add ' + css_prefix + 'math"></span>');
	  this.unitMode.appendTo(this.outputBox.jQ.find('div.answer'));
		this.unitMode = MathQuill.MathField(this.unitMode[0]);
		this.unitMode.clear();
		this.unitMode.setElement(this);
		this.unitMode.setUnitMode(true);
		this.unitMode.focus();
		for(var i = 0; i < this.focusableItems.length; i++) {
			for(var j = 0; j < this.focusableItems[i].length; j++)
				if((this.focusableItems[i][j] != -1) && this.focusableItems[i][j].mathquill) this.focusableItems[i][j].hideCursor();
		}
		if(this.expectedUnits)
			this.unitMode.latex(this.expectedUnits).keystroke('Left',{preventDefault: function() { } });
		else
			this.unitMode.cmd('\\Unit');
		this.outputBox.jQ.addClass('unit_input');
	}
	_.itemChosen = function(output) {
		if(!this.unitMode) return;
		this.expectedUnits = output;
		this.outputBox.jQ.removeClass('unit_input').find(".unit_add").remove();
		this.unitMode = false;
		this.needsEvaluation = true;
		this.outputSettingsChange = true;
		this.submissionHandler(this)();
	}
	_.blur = function(to_focus) {
		if(this.unitMode) this.unitMode.blur();
		super_.blur.call(this, to_focus);
		return this;
	}

	// Callback for math elements notifying that this element has been changed
	_.changed = function(el) {
		if(this.worksheet.loaded && (this.outputMode === 1)) this.outputMode = 0;
	}
  _.keystroke = function(description, evt) { 
  	if(this.unitMode) return this.unitMode.keystroke(description, evt);
  	super_.keystroke.apply(this, arguments);
  }
  _.typedText = function(text) { 
  	if(this.unitMode) return this.unitMode.typedText(text);
  	super_.typedText.apply(this, arguments);
 	}
  _.cut = function(e) { 
  	if(this.unitMode) {
  		this.unitMode.flash();
  		return true;
  	}
  	return super_.cut.apply(this, arguments);
  }
  _.copy = function(e) { 
  	if(this.unitMode) {
  		this.unitMode.flash();
  		return true;
  	}
  	return super_.copy.apply(this, arguments);
  }
  _.paste = function(text) { 
  	if(this.unitMode) {
  		this.unitMode.flash();
  		return;
  	}
  	return super_.paste.apply(this, arguments);
  }
  _.write = function(text) { 
  	if(this.unitMode) {
  		this.unitMode.flash();
  		return this;
  	}
  	return super_.write.apply(this, arguments);
  }

});
// Mathoutput Block but also adds a [ans]= to the beggining.  The innerHTML should call wrapHTML with its HTML to add the necessary code.
var SettableMathOutput = P(MathOutput, function(_, super_) {
	//_.savedProperties = hard-coded in to element.js, since this is an overridden class.  Add them there
	_.function_of = false; 
	_.outputMode = 2;
	_.var_field_value = false; //Only used by save/load of this element.

	_.postInsertHandler = function() {
		this.varStoreField = registerFocusable(MathQuill, this, 'var_store', { ghost: 'ans', noWidth: true, handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.varStoreField.disableAutoUnit(true);
		this.command = registerFocusable(CodeBlock, this, this.code, {});
		this.focusableItems[0].unshift(this.command);
  	this.focusableItems[0].unshift(this.varStoreField);
		super_.postInsertHandler.call(this);
		return this;
	}

	_.wrapHTML = function(codeBlock, toWrap, twoLine) {
		this.code = codeBlock;
		if(twoLine === true) {
			return '<table class="' + css_prefix + 'giac_element"><tbody><tr><td class="' + css_prefix + 'var_store">'
		 	+ '<div class="' + css_prefix + 'focusableItems" data-id="0"><span class="' + css_prefix + 'var_store">' + focusableHTML('MathQuill',  'var_store') + '<span class="equality">&#8801;</span></span></td>'
		 	+ '<td class="' + css_prefix + 'content"><div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', codeBlock) + '</div><div style="margin-left:100px;">' + toWrap
		 	+ answerSpan() + '</div></td></tr></tbody></table>';
		} else {
			return '<table class="' + css_prefix + 'giac_element"><tbody><tr><td class="' + css_prefix + 'var_store">'
		 	+ '<div class="' + css_prefix + 'focusableItems" data-id="0"><span class="' + css_prefix + 'var_store">' + focusableHTML('MathQuill',  'var_store') + '<span class="equality">&#8801;</span></span>' + focusableHTML('CodeBlock', codeBlock) + '</td>'
		 	+ '<td class="' + css_prefix + 'content">' + toWrap
			+ answerSpan() + '</td></tr></tbody></table>';
		}
	}

	_.enterPressed = function(_this) {
		return function(item) {
			_this.submissionHandler(_this)();
			var next_time = false;
			var selected = false;
			for(var i = 0; i < _this.focusableItems.length; i++) {
				for(var j = 0; j < _this.focusableItems[i].length; j++) {
					if(next_time) {
						_this.focusableItems[i][j].focus(-1);
						selected = true;
						break;
					}
					if(_this.focusableItems[i][j] === item) next_time = true;
				}
				if(selected) break;
			}
			if(!selected) {
				if(_this[R] && (_this[R] instanceof math) && _this[R].empty())
					_this[R].focus(L);
				else
					math().setImplicit().insertAfter(_this).show().focus(0);
			}	
		};
	}
	_.storeAsVariable = function(var_name) {
		if(var_name) 
			this.varStoreField.paste(var_name.replace(/_(.*)/,"_{$1}"));
		else if(this.function_of)
			this.varStoreField.clear().focus(1).moveToLeftEnd().write("latex{\\operatorname{ans_{" + this.uniqueAnsId() + "}}\\left({" + this.function_of + "}\\right)}").closePopup().keystroke('Shift-Home', { preventDefault: function() { } });
		else
			this.varStoreField.clear().focus(1).moveToLeftEnd().write("latex{ans_{" + this.uniqueAnsId() + "}}").closePopup().keystroke('Shift-Home', { preventDefault: function() { } });
		this.outputBox.setWidth();
	}
	_.genCommand = function(command) {
		if(this.varStoreField.text().trim().length > 0) {
			this.var_field_value = true;
			command = this.varStoreField.text() + ' := ' + command;
		} else this.var_field_value = false;
		return super_.genCommand.call(this, command);
	}
  _.toString = function() {
  	return '{' + this.klass[0] + '}{{' + this.argumentList().join('}{') + '}}';
  }
  _.focus = function(dir) {
		if(!this.inTree) return this;
  	super_.focus.call(this, dir);
  	if(dir === 0) {
  		if(this.focusableItems[0][2]) this.focusableItems[0][2].focus(L);
  		else if(this.focusableItems[1][0]) this.focusableItems[1][0].focus(L);
  	}
  	return this;
  }
  
});