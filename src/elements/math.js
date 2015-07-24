var math = P(EditableBlock, function(_, super_) {
	_.klass = ['math'];
	_.mathField = 0;
	_.implicit = false;
	_.lineNumber = true;
	_.evaluatable = true;
	_.unitMode = false;
	_.savedProperties = ['expectedUnits','approx','factor_expand','outputMode'];
	_.expectedUnits = false;
	_.approx = false;
	_.factor_expand = false;
	_.answerLatex = '';
	// Output mode has three values: 0 is auto, 1 is force hide, 2 is force show
	_.outputMode = 0


  var ans_id = 0;
  function uniqueAnsId() { return ans_id += 1; }
	_.init = function(latex) {
		super_.init.call(this);
		this.latex = latex || '';
	}
	_.innerHtml = function() {
		return mathSpan('input') + '<BR>' + answerSpan();
	}
	_.postInsertHandler = function() {
		this.mathField = registerMath(this, 'input', { handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[this.mathField]];
		this.mathField.write(this.latex);
		super_.postInsertHandler.call(this);
		this.outputMathBox = MathQuill.MathField(this.outputBox.jQ.find('div.answer')[0]);
		this.outputMathBox.setElement(this).setStaticMode(this);
		return this;
	}
	_.enterPressed = function(_this) {
		return function(mathField) {
			var to_compute = mathField.text();
			if(elements[to_compute.toLowerCase()]) {
				_this.needsEvaluation = false;
				_this.mark_for_deletion = true;
				elements[to_compute.toLowerCase()]().insertAfter(_this).show().focus(0);
				_this.remove(0);
			} else {
				_this.submissionHandler(_this)(mathField);
				math().insertAfter(_this).show().setImplicit().focus(0);
			}
		};
	}
	_.changeToText = function(to_text) {
		this.mark_for_deletion = true;
		if(to_text === '#') to_text = 'bookmark';
		if(elements[to_text.toLowerCase()]) {
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
			if ((to_text.length > 0) && !el.textField.magicCommands()) 
				el.append('&nbsp;').focus(R);
		}
		this.remove(0);
	}
	_.was_scoped = false;
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.empty())
				_this.outputBox.collapse();
			if(_this.needsEvaluation) {
				//console.log(mathField.text());
				var to_compute = mathField.text();
				if(to_compute.match(/^.*=.*=[\s]*$/)) { // Trailing = sign is a mathCad thing, use it to force output, and then remove the equal sign
					mathField.moveToRightEnd().keystroke('Shift-Left',{preventDefault: function() {}}).keystroke('Del',{preventDefault: function() {}}).blur();
					_this.outputMode = 2;
					to_compute = mathField.text();
				}
				if(elements[to_compute.toLowerCase()]) {
					_this.mark_for_deletion = true;
					_this.needsEvaluation = false;
					elements[to_compute.toLowerCase()]().insertAfter(_this).show();
					_this.remove(0);
					return;
				}
				if(to_compute.indexOf(':=') > -1) {
					_this.scoped = true;
					_this.was_scoped = true;
					_this.fullEvaluation = true;
				}	else if(_this.was_scoped) {
					_this.scoped = false;
					_this.was_scoped = false;
					_this.fullEvaluation = true;
				} else {
					_this.scoped = false;
					_this.fullEvaluation = false;
					if(to_compute.trim() === '')
						_this.needsEvaluation = false;
				}
				_this.commands = [{command: to_compute, unit: _this.workspace.latexToUnit(_this.expectedUnits), approx: _this.approx, simplify: _this.factor_expand, force_output_for_scoped: (_this.outputMode == 2)}];
				_this.evaluate();
				_this.needsEvaluation = false;
			}
		};
	}
	_.evaluationFinished = function(result) {
		this.last_result = result;
		this.outputBox.jQ.removeClass('calculating error warn unit_input hide_pulldown');
		this.outputBox.jQ.find('.warning').remove();
		this.outputBox.jQ.find('.error').remove();
		this.outputBox.jQ.find('td.answer_menu').html('');
		this.outputBox.tableJQ.next("div." + css_prefix + "calculation_stopped").slideUp({duration: 250, always: function() { $(this).remove(); } });
		if(result[0].success) {
			if((this.scoped && (this.outputMode != 2)) || (result[0].returned.trim() === '') || (this.outputMode == 1)) {
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
				this.outputMathBox.latex(result[0].returned);
				var height = this.outputBox.jQ.find('div.answer').height();
				this.answerLatex = result[0].returned.replace(/^.*\\Longrightarrow \\whitespace/,'');
				menu.css({top: Math.floor(height/2-9) + 'px'});
				if(result[0].suppress_pulldown) {
					menu.remove();
					this.outputBox.jQ.addClass('hide_pulldown');
				} else {
					// Create the pulldown menu
					menu.append('<div class="pulldown_item" data-action="copyAnswer"><i class="fa fa-fw"></i>&nbsp; Copy to new line</div>');
					if(!this.scoped)
						menu.append('<div class="pulldown_item" data-action="storeAsVariable"><i class="fa fa-fw"></i>&nbsp; Assign to variable</div>');
					if(result[0].returned.indexOf('\\Unit') > -1)
						menu.append('<div class="pulldown_item" data-action="enableUnitMode"><i class="fa fa-fw"></i>&nbsp; Change units</div>');
					menu.append('<div class="pulldown_item" data-action="toggleApprox"><i class="fa fa-toggle-' + (this.approx ? 'on' : 'off') + ' fa-fw"></i>&nbsp; Approximate mode (1/2 &#8594; 0.5)</div>');
					var factor = 'off';
					var expand = 'off';
					if(this.factor_expand === 'factor') factor = 'on';
					if(this.factor_expand === 'expand') expand = 'on';
					menu.append('<div class="pulldown_item" data-action="toggleFactor"><i class="fa fa-toggle-' + factor + ' fa-fw"></i>&nbsp; Factor</div>');
					menu.append('<div class="pulldown_item" data-action="toggleExpand"><i class="fa fa-toggle-' + expand + ' fa-fw"></i>&nbsp; Expand</div>');
				}
			}
			if(result[0].warnings.length > 0) {
				this.outputBox.jQ.removeClass('calculating');
				if(this.outputMode != 1) {
					for(var i = 0; i < result[0].warnings.length; i++) 
						this.outputBox.setWarning(result[0].warnings[i],true);
					this.outputBox.expand();
					this.collapseArrow();
				}
			}
		} else {
			this.outputMathBox.jQ.hide();
			if(this.fullEvaluation) 
				if(!this.scoped) this.was_scoped = true; // Reset was scoped for next evaluation
			this.outputBox.jQ.removeClass('calculating warn');
			this.outputBox.setError(result[0].returned,true);
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
		return true;
	}
	_.collapse = function() {
		this.outputMode = 1;
		this.outputBox.collapse();
		this.expandArrow();
		this.workspace.save();
		return this;
	}
	_.expand = function() {
		this.outputMode = 2;
		this.evaluationFinished(this.last_result);
		this.workspace.save();
		return this;
	}
	_.storeAsVariable = function() {
    this.focus(-1);
    this.outputMode = 2;
    this.mathField.moveToLeftEnd().write("latex{ans_{" + uniqueAnsId() + "}=}").closePopup();
    this.mathField.keystroke('Left', { preventDefault: function() { } }).keystroke('Shift-Home', { preventDefault: function() { } });
	}
	_.copyAnswer = function() {
		var latex = this.outputMathBox.getSelection();
		math().insertAfter(this).show(450).focus(L).write(latex !== '' ? latex : this.answerLatex).closePopup();
	}
	_.closePopup = function() {
		this.mathField.closePopup();
		return this;
	}
	_.toggleApprox = function() {
		this.approx = !this.approx;
		this.needsEvaluation = true;
		this.submissionHandler(this)(this.mathField);
	}
	_.toggleExpand = function() {
		if(this.factor_expand == 'expand') this.factor_expand = false;
		else this.factor_expand = 'expand';
		this.needsEvaluation = true;
		this.submissionHandler(this)(this.mathField);
	}
	_.toggleFactor = function() {
		if(this.factor_expand == 'factor') this.factor_expand = false;
		else this.factor_expand = 'factor';
		this.needsEvaluation = true;
		this.submissionHandler(this)(this.mathField);
	}

	_.AppendText = function() {
		text().insertAfter(this).show().focus(L)
	}
	_.PrependBlankItem = function() {
		//add a blank block just before this one
		math().insertBefore(this).show();
		this.focus(L);
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
		this.mathField.hideCursor();
		if(this.expectedUnits)
			this.unitMode.latex(this.expectedUnits).keystroke('Left',{preventDefault: function() { } });
		else
			this.unitMode.cmd('\\Unit');
		this.outputBox.jQ.addClass('unit_input');
	}
	_.unitChosen = function(output) {
		if(!this.unitMode) return;
		this.expectedUnits = output;
		this.outputBox.jQ.removeClass('unit_input').find(".unit_add").remove();
		this.unitMode = false;
		this.needsEvaluation = true;
		this.submissionHandler(this)(this.mathField);
	}
	_.focus = function(dir) {
		super_.focus.call(this, dir);
		if(dir)
			this.mathField.focus(dir);
		else if(dir === 0)
			this.mathField.focus(L);
		return this;
	}
	_.blur = function() {
		if(this.unitMode) this.unitMode.blur();
		super_.blur.call(this);
		if(this.implicit && this.empty())
			this.remove();
		return this;
	}
  _.toString = function() {
  	return '{math}{{' + this.argumentList().join('}{') + '}}';
  }

	// Callback for math elements notifying that this element has been changed
	_.changed = function(el) {
		this.implicit = false;
		if(this.outputMode === 1) this.outputMode = 0;
		this.needsEvaluation = true;
	}
	_.setImplicit = function() {
		if(!((this[L] == 0) && (this[R] == 0)))
			this.implicit = true;
		return this;
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
  	super_.paste.apply(this, arguments);
  }
  _.write = function(text) { 
  	if(this.unitMode) {
  		this.unitMode.flash();
  		return this;
  	}
  	super_.write.apply(this, arguments);
  	return this;
  }

});