var if_block = P(LogicBlock, function(_, super_) {
	_.savedProperties = [];
	_.klass = ['if', 'logic_block'];
	_.needsEvaluation = false; 
	_.evaluatable = true;
	_.fullEvaluation = true; 
	_.scoped = true;
	_.hasChildren = true;
	_.mathField = 0;
	_.lineNumber = true;
	_.outputBox = 0;

	_.init = function(latex) {
		super_.init.call(this);
		this.latex = latex || '';
		this.else_blocks = [];
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + codeBlockHTML('if', this.id) + mathSpan('logic') + helpBlock() + '<BR>' + answerSpan() + '</div><div class="' + css_prefix + 'insert"></div><div class="' + css_prefix + 'focusableItems" data-id="2">' + codeBlockHTML('end', this.id) + '</div>';
	}
	_.postInsertHandler = function() {
		this.mathField = registerMath(this, 'logic', { handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[registerCommand(this, 'if', { }), this.mathField], [-1], [registerCommand(this, 'end', { })]];
		this.mathField.setExpressionMode(true);
		this.outputBox = this.jQ.find('.' + css_prefix + 'output_box');
		this.mathField.write(this.latex);
		super_.postInsertHandler.call(this);
		return this;
	}
	_.enterPressed = function(_this) {
		return function(mathField) {
			_this.submissionHandler(_this)(mathField);
			if(_this.ends[L] && (_this.ends[L] instanceof math) && _this.ends[L].empty())
				_this.ends[L].focus(L);
			else
				math().prependTo(_this).show().focus();
		};
	}
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.needsEvaluation) {
				//console.log(mathField.latex());
				_this.evaluate();
				_this.needsEvaluation = false;
			}
		};
	}
	// Continue evaluation is called within an evaluation chain.  It will evaluate this node, and if 'move_to_next' is true, then move to evaluate the next node.
	_.continueEvaluation = function(evaluation_id, move_to_next) {
		// Build command list
		this.commands = [{ command: 'evalf(' + this.mathField.text() + ')' }];
		this.else_blocks = [];
		for(var el = this.ends[L]; el instanceof Element; el = el[R]) {
			if(el instanceof else_block) {
				this.else_blocks.push(el);
				this.commands.push({ command: 'evalf(' + el.command() + ')' });
			} else
				el.jQ.addClass(css_prefix + 'greyout');
		}
		if(this.shouldBeEvaluated(evaluation_id)) {
			this.addSpinner(evaluation_id);
			this.move_to_next = move_to_next;
			giac.execute(evaluation_id, move_to_next, this.commands, this, 'evaluationFinished');
		} else 
			this.evaluateNext(evaluation_id, move_to_next);
	}
	_.evaluationFinished = function(result, evaluation_id) {
		var any_yet = false;
		if(result[0].success) {
			any_yet = this.logicResult = parseLogicResult(result[0].returned)
			this.outputBox.closest('div.' + css_prefix + 'answer_table').hide({ duration: 400 });
		} else {
			this.logicResult = false;
			giac.errors_encountered = true;
			this.outputBox.removeClass('calculating warn').addClass('error');
			this.outputBox.html(result[0].returned);
			this.outputBox.closest('div.' + css_prefix + 'answer_table').show({ duration: 400 });
		}
		for(var i = 1; i < result.length; i++) 
			any_yet = this.else_blocks[i-1].handle_response(result[i], any_yet);

		// BRENTAN: If this guy is true, we should un-blur resultant stuff
		if(this.ends[L])
			this.ends[L].continueEvaluation(evaluation_id, true)
		else
			this.childrenEvaluated(evaluation_id);
		return false;
	}
  _.toString = function() {
  	return '{if}{{' + this.argumentList().join('}{') + '}}';
  }
	// Callback for math elements notifying that this element has been changed
	_.changed = function(el) {
		this.needsEvaluation = true;
	}
	_.focus = function(dir) {
		super_.focus.call(this);
		if(dir === 0)
			this.mathField.focus(L);
		else if(!dir && this.focusedItem)
			this.focusedItem.focus();
		return this;
	}

});
var else_block = P(LogicCommand, function(_, super_) {
	_.outputBox = 0;
	_.mathField = false;
	_.init = function() {
		super_.init.call(this);
	}
	_.command = function() {
		return 'true';
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + codeBlockHTML('else', this.id) + helpBlock() + '<BR>' + answerSpan() + '</div>';
	}
	_.postInsertHandler = function() {
		this.outputBox = this.jQ.find('.' + css_prefix + 'output_box');
		this.attachItems();
		super_.postInsertHandler.call(this);
		return this;
	}
	_.attachItems = function() {
		this.focusableItems = [[registerCommand(this, 'else', { allowDelete: true})]];
	}
	_.continueEvaluation = function(evaluation_id, move_to_next) {
		this.rightParent();
		this.evaluateNext(evaluation_id, move_to_next);
	}
	_.rightParent = function() {
		if(this.parent instanceof if_block) {
			// test for an 'else' before me
			var prev_else = false;
			for(var el = this[L]; el instanceof Element; el = el[L]) {
				if((el instanceof else_block) && !(el instanceof else_if_block)) {
					prev_else = true;
					break;
				}
			}
			if(prev_else) {
				this.outputBox.removeClass('calculating error').addClass('warn');
				this.outputBox.html('<div class="warning">Statement occurs after an <i>else</i> statement and is never reached.</div>');
				this.outputBox.closest('div.' + css_prefix + 'answer_table').show({ duration: 400 });
				return false;
			}
		} else {
			this.outputBox.removeClass('calculating error').addClass('warn');
			this.outputBox.html('<div class="warning">Statement is not within an <i>If</i> statement.  Block has been ignored.</div>');
			this.outputBox.closest('div.' + css_prefix + 'answer_table').show({ duration: 400 });
			return false;
		}
		this.outputBox.closest('div.' + css_prefix + 'answer_table').hide({ duration: 400 });
		return true;
	}
	_.focus = function(dir) {
		super_.focus.call(this);
		this.rightParent();
		if(dir === 0)
			this.mathField.focus(L);
		else if(!dir && this.focusedItem)
			this.focusedItem.focus();
		return this;
	}
	_.focus = function(dir) {
		super_.focus.call(this);
		this.rightParent();
		if(dir === 0) {
		  if(this[R])
				this[R].focus(dir);
			else
				math().insertAfter(this).show().focus(dir);
		} else if(!dir && this.focusedItem)
			this.focusedItem.focus();
		return this;
	}
	_.handle_response = function(result, any_yet) {
		if(result.success) {
			this.logicResult = parseLogicResult(result.returned);
			this.outputBox.closest('div.' + css_prefix + 'answer_table').hide({ duration: 400 });
			if(any_yet) this.logicResult = false;
		}	else {
			this.logicResult = false;
			giac.errors_encountered = true;
			this.outputBox.removeClass('calculating warn').addClass('error');
			this.outputBox.html(result.returned);
			this.outputBox.closest('div.' + css_prefix + 'answer_table').show({ duration: 400 });
		}
		return this.logicResult || any_yet;
	}
  _.toString = function() {
  	return '{else}{}';
  }
});
var else_if_block = P(else_block, function(_, super_) {
	_.latex = '';
	_.init = function(latex) {
		super_.init.call(this);
		this.latex = latex || '';
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + codeBlockHTML('elseif', this.id) + mathSpan('logic') + helpBlock() + '<BR>' + answerSpan() + '</div>';
	}
	_.command = function() {
		return this.mathField.text();
	}
	_.attachItems = function() {
		this.mathField = registerMath(this, 'logic', { handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[registerCommand(this, 'elseif', { }), this.mathField]];
		this.mathField.setExpressionMode(true);
		this.mathField.write(this.latex);
	}
	_.enterPressed = function(_this) {
		return function(mathField) {
			_this.submissionHandler(_this)(mathField);
			math().insertAfter(_this).show().focus();
		};
	}
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.parent instanceof if_block) 
				_this.parent.submissionHandler(_this.parent)(_this.parent.mathField);
		};
	}
  _.toString = function() {
  	return '{elseif}{' + this.argumentList().join('}{') + '}';
  }
	// Callback for math elements notifying that this element has been changed
	_.changed = function(el) {
		if(this.parent instanceof if_block)
			this.parent.needsEvaluation = true;
	}
	_.focus = function(dir) {
		super_.focus.call(this);
		this.rightParent();
		if(dir === 0)
			this.mathField.focus(L);
		else if(!dir && this.focusedItem)
			this.focusedItem.focus();
		return this;
	}
});