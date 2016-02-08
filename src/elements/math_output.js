/* Math output is an extension of Element that has some built in commands
   to support math output in the output box, as well as some other functionality */

var ans_id = 0;
var MathOutput = P(EditableBlock, function(_, super_) {
	_.lineNumber = true;
	_.evaluatable = true;
	_.unitMode = false;
	_.savedProperties = ['expectedUnits','approx','factor_expand','outputMode'];
	_.expectedUnits = false;
	_.approx = false;
	_.factor_expand = false;
	_.pre_command = false;
	_.nomarkup = false;
	_.answerLatex = '';
	// Output mode has three values: 0 is auto, 1 is force hide, 2 is force show
	_.outputMode = 0


  _.uniqueAnsId = function() { return ans_id += 1; }
  _.setAnswerIdCounter = function(val) {
  	ans_id = max(ans_id, val);
  }
	_.postInsertHandler = function() {
		super_.postInsertHandler.call(this);
		this.outputMathBox = MathQuill.MathField(this.outputBox.jQ.find('div.answer')[0]);
		this.outputMathBox.setElement(this).setStaticMode(this);
		return this;
	}
	_.genCommand = function(to_compute) {
		var to_send = [{command: to_compute, unit: this.worksheet.latexToUnit(this.expectedUnits), approx: this.approx, simplify: this.factor_expand, nomarkup: this.nomarkup}];
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
					if(!this.scoped && this.storeAsVariable)
						menu.append('<div class="pulldown_item" data-action="storeAsVariable"><i class="fa fa-fw"></i>&nbsp; Assign to variable</div>');
					if(result[0].returned.indexOf('\\Unit') > -1)
						menu.append('<div class="pulldown_item" data-action="enableUnitMode"><i class="fa fa-fw"></i>&nbsp; Change units</div>');
					menu.append('<div class="pulldown_item" data-action="toggleApprox"><i class="fa fa-toggle-' + (this.approx ? 'on' : 'off') + ' fa-fw"></i>&nbsp; Approximate mode (1/2 &#8594; 0.5)</div>');
					var factor = 'off';
					var expand = 'off';
					var simplify = 'off';
					if(this.factor_expand === 'factor') factor = 'on';
					if(this.factor_expand === 'expand') expand = 'on';
					if(this.factor_expand === 'simplify') simplify = 'on';
					menu.append('<div class="pulldown_item" data-action="toggleExpand"><i class="fa fa-toggle-' + expand + ' fa-fw"></i>&nbsp; Expand</div>');
					//menu.append('<div class="pulldown_item" data-action="toggleFactor"><i class="fa fa-toggle-' + factor + ' fa-fw"></i>&nbsp; Factor</div>');
					menu.append('<div class="pulldown_item" data-action="toggleSimplify"><i class="fa fa-toggle-' + simplify + ' fa-fw"></i>&nbsp; Simplify</div>');
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
		if(this.fullEvaluation && !this.scoped) this.was_scoped = true; // Reset was scoped for next evaluation.
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
		this.approx = !this.approx;
		this.needsEvaluation = true;
		this.submissionHandler(this)();
	}
	_.toggleExpand = function() {
		if(this.factor_expand == 'expand') this.factor_expand = false;
		else this.factor_expand = 'expand';
		this.needsEvaluation = true;
		this.submissionHandler(this)();
	}
	_.toggleFactor = function() {
		if(this.factor_expand == 'factor') this.factor_expand = false;
		else this.factor_expand = 'factor';
		this.needsEvaluation = true;
		this.submissionHandler(this)();
	}
	_.toggleSimplify = function() {
		if(this.factor_expand == 'simplify') this.factor_expand = false;
		else this.factor_expand = 'simplify';
		this.needsEvaluation = true;
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