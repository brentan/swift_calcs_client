
var math = P(MathOutput, function(_, super_) {
	_.klass = ['math'];
	_.mathField = 0;
	_.implicit = false;

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
		}
		this.mark_for_deletion = true;
		var stream = this.worksheet.trackingStream;
		if(!stream) this.worksheet.startUndoStream();
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
			if (to_text.length > 0) el.textField.magicCommands();
		}
		this.remove(0);
		if(!stream) this.worksheet.endUndoStream();
		return true;
	}
	_.was_scoped = false;
	_.submissionHandler = function(_this) {
		return function() {
			if(_this.empty()) {
				_this.outputBox.collapse();
			}
			if(_this.needsEvaluation) {
				//console.log(_this.mathField.text());
				var to_compute = _this.mathField.text();
				if(to_compute.match(/^.*=.*=[\s]*$/)) { // Trailing = sign is a mathCad thing, use it to force output, and then remove the equal sign
					_this.mathField.moveToRightEnd().keystroke('Shift-Left',{preventDefault: function() {}}).keystroke('Del',{preventDefault: function() {}}).blur();
					_this.outputMode = 2;
					to_compute = _this.mathField.text();
				}
				if(elements[to_compute.toLowerCase()]) {
					_this.mark_for_deletion = true;
					_this.needsEvaluation = false;
					var stream = _this.worksheet.trackingStream;
					if(!stream) _this.worksheet.startUndoStream();
					elements[to_compute.toLowerCase()]().insertAfter(_this).show();
					_this.remove(0);
					if(!stream) _this.worksheet.endUndoStream();
					return;
				}
				if(to_compute.match(/(:=|\+\+|--)/)) {
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
					if(to_compute.trim() === '') {
						_this.needsEvaluation = false;
						_this.worksheet.save();
					}
				}
				_this.commands = _this.genCommand(to_compute);
				_this.evaluate();
				_this.needsEvaluation = false;
			}
		};
	}
	_.highlightError = function(error_index) {
		//this.mathField.highlightError(error_index); //commented out as it does not yet work reliably....needs to be debugged
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
});
var show_text_mode_popup = true;