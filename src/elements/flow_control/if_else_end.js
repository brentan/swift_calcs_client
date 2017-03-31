var if_block = P(LogicBlock, function(_, super_) {
	_.klass = ['if', 'logic_block'];
	_.needsEvaluation = false; 
	_.evaluatable = true;
	_.hasChildren = true;
	_.mathField = 0;
	_.lineNumber = true;
	_.helpText = "<<if <[TEST]>>>\nIf the result of TEST is true (or non-zero), the block will be evaluated.  Otherwise, the block is skipped.  Examples: if x = 2, if x > 4";

	_.init = function(latex) {
		super_.init.call(this);
		this.latex = latex || '';
		this.else_blocks = [];
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'if') + focusableHTML('MathQuill',  'logic') + helpBlock() + '<BR>' + answerSpan() + '</div><div class="' + css_prefix + 'insert"></div><div class="' + css_prefix + 'focusableItems" data-id="2">' + focusableHTML('CodeBlock', 'end') + '</div>';
	}
	_.postInsertHandler = function() {
		this.mathField = registerFocusable(MathQuill, this, 'logic', { handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[registerFocusable(CodeBlock,this, 'if', { }), this.mathField], [-1], [registerFocusable(CodeBlock,this, 'end', { })]];
		this.mathField.setExpressionMode(true);
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
				_this.dependent_vars = GetDependentVars(mathField.text());
				_this.evaluate();
				_this.needsEvaluation = false;
			}
		};
	}
	_.newCommands = function() {
		var new_command = [this.mathField.text()];
		for(var el = this.ends[L]; el instanceof Element; el = el[R]) 
			if(el instanceof LogicCommand) new_command.push(el.command());
		var equal = true;
		if(new_command.length == this.previous_commands.length) {
			for(var i = 0; i < new_command.length; i++) {
				if(new_command[i] != this.previous_commands[i]) {
					equal = false;
					break;
				}
			}
		} else
			equal = false;
		return !equal;
	}
	// Continue evaluation is called within an evaluation chain.  It will evaluate this node, and then move to evaluate the next node.
	_.continueEvaluation = function(evaluation_id) {
		giac.load_altered(evaluation_id, this);
		// Build command list
		this.commands = [];
		this.else_blocks = {};
		this.all_blocks = [this];
		var new_command = [this.mathField.text()];
		if(this.altered(evaluation_id)) {
			this.else_blocks[this.id] = this.commands.length;
			this.commands.push({ command: 'evalf(' + this.mathField.text() + ')', nomarkup: true });
		}
		for(var el = this.ends[L]; el instanceof Element; el = el[R]) {
			if(el instanceof LogicCommand) new_command.push(el.command());
			if((el instanceof LogicCommand) && el.altered(evaluation_id)) {
				this.else_blocks[el.id] = this.commands.length;
				this.commands.push({ command: 'evalf(' + el.command() + ')', nomarkup: true });
				this.all_blocks.push(el);
			} else if(el instanceof LogicCommand) {
				this.all_blocks.push(el);
				if(this.allowOutput()) el.jQ.addClass(css_prefix + 'greyout');
			} else
				if(this.allowOutput()) el.jQ.addClass(css_prefix + 'greyout');
		}
		this.previous_commands = new_command;
		if(this.shouldBeEvaluated(evaluation_id) && this.commands.length) {
			this.addSpinner(evaluation_id);
			giac.execute(evaluation_id, this.commands, this, 'evaluationFinished');
		} else if(this.shouldBeEvaluated(evaluation_id)) 
			this.evaluationFinished([], evaluation_id);
		else 
			this.evaluateNext(evaluation_id);
	}
	_.lastTrueId = -1;
	_.evaluationFinished = function(result, evaluation_id) {
		var any_yet = false;
		for(var i = 0; i < this.all_blocks.length; i++) {
			if(typeof this.else_blocks[this.all_blocks[i].id] != 'undefined')
				any_yet = this.all_blocks[i].handle_response(result[this.else_blocks[this.all_blocks[i].id]], any_yet);
			else if(any_yet) 
				this.all_blocks[i].logicResult = false;
			else {
				any_yet = any_yet || this.all_blocks[i].returnedResult;
				this.all_blocks[i].logicResult = any_yet;
			}
		}
		// Find the 'true' block
		var new_true_id = -1;
		for(var i = 0; i < this.all_blocks.length; i++) {
			if(this.all_blocks[i].logicResult) { new_true_id = this.all_blocks[i].id; break; }
		}
		if(this.lastTrueId != new_true_id) {
			// New item is 'true'.  Need to mark all things after it 'altered' to make sure they are recalced
			if(new_true_id > -1) {
				var el = new_true_id == this.id ? this.ends[L] : Element.byId[new_true_id][R];
				for(el; (el instanceof Element) && !(el instanceof LogicCommand); el = el[R]) 
	    		el.commandChildren(function(_this) { if(_this.evaluatable) { _this.altered_content = true;  _this.previous_commands = []; } });
	    }
    	// Also need to go through and mark all variables that were set in old 'true' area as altered for the continuing calculation
    	if(this.lastTrueId > -1) {
				el = this.lastTrueId == this.id ? this.ends[L] : Element.byId[this.lastTrueId][R];
				for(el; (el instanceof Element) && !(el instanceof LogicCommand); el = el[R]) 
					giac.add_altered(evaluation_id, el.allIndependentVars());
			}
		}
		this.lastTrueId = new_true_id;

		if(this.ends[L])
			this.ends[L].continueEvaluation(evaluation_id)
		else
			this.childrenEvaluated(evaluation_id);
		return false;
	}
	_.handle_response = function(result, any_yet) {
		if(result.success) {
			this.returnedResult = parseLogicResult(result.returned);
			this.logicResult = this.returnedResult;
			this.outputBox.collapse();
			if(any_yet) this.logicResult = false;
		}	else {
			this.returnedResult = false;
			this.logicResult = false;
			this.outputBox.setError(result.returned);
			this.outputBox.expand();
		}
		return this.logicResult || any_yet;
	}
  _.toString = function() {
  	return '{if}{{' + this.argumentList().join('}{') + '}}';
  }
	// Callback for math elements notifying that this element has been changed
	_.changed = function(el) {
		this.needsEvaluation = true;
	}

});
var else_block = P(LogicCommand, function(_, super_) {
	_.mathField = false;
	_.helpText = "<<else>>\nIf none of the previous if or elseif blocks have been true, the commands in the else block will be evaluated";
	_.init = function() {
		super_.init.call(this);
	}
	_.validateParent = function(parent) {
		return (parent instanceof if_block);
	}
	_.command = function() {
		return 'true';
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'else') + helpBlock() + '<BR>' + answerSpan() + '</div>';
	}
	_.postInsertHandler = function() {
		this.attachItems();
		super_.postInsertHandler.call(this);
		return this;
	}
	_.attachItems = function() {
		this.focusableItems = [[registerFocusable(CodeBlock,this, 'else', { allowDelete: true})]];
	}
	_.continueEvaluation = function(evaluation_id) {
		giac.load_altered(evaluation_id, this);
		this.rightParent();
		this.evaluateNext(evaluation_id);
	}
	_.allIndependentVars = function() {
		return [""]; // force to appear as scoped
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
				this.outputBox.setWarning('Statement occurs after an <i>else</i> statement and is never reached.');
				this.outputBox.expand();
				return false;
			}
		} else {
			this.outputBox.setWarning('Statement is not within an <i>If</i> statement.  Block has been ignored.');
			this.outputBox.expand();
			return false;
		}
		this.outputBox.collapse();
		return true;
	}
	_.focus = function(dir) {
		if(!this.inTree) return this;
		super_.focus.call(this);
		this.rightParent();
		if(dir === 0) {
		  if(this[R])
				this[R].focus(dir);
			else
				math().insertAfter(this).show().focus(dir);
		} 
		return this;
	}
	_.returnedResult = true;
	_.handle_response = function(result, any_yet) {
		if(result.success) {
			this.logicResult = parseLogicResult(result.returned);
			this.outputBox.collapse();
			if(any_yet) this.logicResult = false;
		}	else {
			this.logicResult = false;
			this.outputBox.setError(result.returned);
			this.outputBox.expand();
		}
		return this.logicResult || any_yet;
	}
  _.toString = function() {
  	return '{else}{}';
  }
  _.scoped = function() {
  	return (this.parent instanceof LogicBlock) ? this.parent.scoped() : false;
  }
  _.evaluate = function() {
  	if(this.parent instanceof LogicBlock) this.parent.evaluate(true);
  }
});
var else_if_block = P(else_block, function(_, super_) {
	_.latex = '';
	_.helpText = "<<elseif <[TEST]>>>\nIf the result of TEST is true (or non-zero) and no previous if or elseif block has been true, the block will be evaluated.  Otherwise, the block is skipped.  Examples: elseif x = 2, elseif x > 4";
	_.init = function(latex) {
		super_.init.call(this);
		this.latex = latex || '';
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'elseif') + focusableHTML('MathQuill',  'logic') + helpBlock() + '<BR>' + answerSpan() + '</div>';
	}
	_.command = function() {
		return this.mathField.text();
	}
	_.attachItems = function() {
		this.mathField = registerFocusable(MathQuill, this, 'logic', { handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[registerFocusable(CodeBlock,this, 'elseif', { }), this.mathField]];
		this.mathField.setExpressionMode(true);
		this.mathField.write(this.latex);
	}
	_.enterPressed = function(_this) {
		return function(mathField) {
			_this.submissionHandler(_this)(mathField);
			if(!_this[R] || (_this[R] instanceof LogicCommand))
				math().insertAfter(_this).show().focus(L);
			else
				_this[R].focus(L);
		};
	}
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.needsEvaluation) {
				//console.log(mathField.latex());
				_this.dependent_vars = GetDependentVars(mathField.text());
				_this.altered_content = true;
				_this.evaluate();
				_this.needsEvaluation = false;
			}
		};
	}
  _.toString = function() {
  	return '{elseif}{' + this.argumentList().join('}{') + '}';
  }
	// Callback for math elements notifying that this element has been changed
	_.changed = function(el) {
		this.needsEvaluation = true;
	}
	_.focus = function(dir) {
		if(!this.inTree) return this;
		super_.focus.call(this);
		this.rightParent();
		if(dir === 0) this.mathField.focus(0);
		return this;
	}
	_.handle_response = function(result, any_yet) {
		if(result.success) {
			this.returnedResult = parseLogicResult(result.returned);
			this.logicResult = this.returnedResult;
			this.outputBox.collapse();
			if(any_yet) this.logicResult = false;
		}	else {
			this.returnedResult = false;
			this.logicResult = false;
			this.outputBox.setError(result.returned);
			this.outputBox.expand();
		}
		return this.logicResult || any_yet;
	}
});