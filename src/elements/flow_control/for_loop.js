var for_loop = P(Loop, function(_, super_) {
	_.klass = ['for'];
	_.needsEvaluation = false; 
	_.evaluatable = true;
	_.fullEvaluation = true; 
	_.scoped = true;
	_.hasChildren = true;
	_.varField = 0;
	_.startField = 0;
	_.finishField = 0;
	_.stepField = 0;
	_.lineNumber = true;
	_.helpText = "<<For <[J]> from <[START]> to <[FINISH]> by <[STEP]>>>\nFor loop.  Iterate over contents, with J increasing in value from START (inclusive) until FINISH (non-inclusive) with a step size of STEP.";

	_.init = function(latex_var, latex_start, latex_finish, latex_step) {
		super_.init.call(this);
		this.latex_var = latex_var || '';
		this.latex_start = latex_start || '';
		this.latex_finish = latex_finish || '';
		this.latex_step = latex_step || '';
		this.touched = [false, false, false, false];
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + codeBlockHTML('for', this.id) + mathSpan('var') 
		+ '&nbsp;from&nbsp;' + mathSpan('start')  
		+ '&nbsp;to&nbsp;' + mathSpan('finish')  
		+ '&nbsp;by&nbsp;' + mathSpan('step') + helpBlock()
		+ '<BR>' + answerSpan() + '</div><div class="' + css_prefix + 'insert"></div><div class="' + css_prefix + 'focusableItems" data-id="2">' + codeBlockHTML('end', this.id) + '</div>';
	}
	_.postInsertHandler = function() {
		this.varField = registerMath(this, 'var', { handlers: {
			enter: this.enterPressed(this,1),
			blur: this.submissionHandler(this)
		}});
		this.startField = registerMath(this, 'start', { handlers: {
			enter: this.enterPressed(this,2),
			blur: this.submissionHandler(this)
		}});
		this.finishField = registerMath(this, 'finish', { handlers: {
			enter: this.enterPressed(this,3),
			blur: this.submissionHandler(this)
		}});
		this.stepField = registerMath(this, 'step', { handlers: {
			enter: this.enterPressed(this,4),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[registerCommand(this, 'for', { }), this.varField, this.startField, this.finishField, this.stepField], [-1], [registerCommand(this, 'end', { })]];
		this.varField.write(this.latex_var);
		this.startField.write(this.latex_start);
		this.finishField.write(this.latex_finish);
		this.stepField.write(this.latex_step);
		this.touched = [false, false, false, false];
		this.needsEvaluation = false;
		super_.postInsertHandler.call(this);
		return this;
	}
	_.enterPressed = function(_this, to_focus) {
		return function(mathField) {
			_this.submissionHandler(_this)(mathField);
			if(to_focus == 4) {
				if(_this.ends[L] && (_this.ends[L] instanceof math) && _this.ends[L].empty())
					_this.ends[L].focus(L);
				else
					math().prependTo(_this).show().focus();
			}	else 
				_this.focusableItems[0][to_focus+1].focus(-1);
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
		this.commands = [{ command: 'evalf(' + this.startField.text() + ')' },{ command: 'evalf(' + this.finishField.text() + ')' },{ command: 'evalf(' + this.stepField.text() + ')' }];
		if(this.shouldBeEvaluated(evaluation_id)) {
			this.addSpinner(evaluation_id);
			this.move_to_next = move_to_next;
			giac.execute(evaluation_id, move_to_next, this.commands, this, 'evaluationFinished');
		} else 
			this.evaluateNext(evaluation_id, move_to_next);
	}
	_.evaluationFinished = function(result, evaluation_id) {
		this.iterator = this.varField.text().trim();
		var errors=[];
		if(!this.iterator.match(/^[a-z][a-z0-9_]*$/))
			errors.push('Iterator: Invalid iterator name (' + this.workspace.latexToHtml(this.iterator) + ').  Please enter a valid variable name');
		if(result[0].success) {
			if(!result[0].returned.match(/^[0-9\.e\-]+$/))
				errors.push('Start Value: Non-numeric result encountered: ' + this.workspace.latexToHtml(result[0].returned));
			else
				this.start_val = 1.0 * result[0].returned;
		} else
			errors.push('Start Value: ' + result[0].returned);
		if(result[1].success) {
			if(!result[1].returned.match(/^[0-9\.e\-]+$/))
				errors.push('Final Value: Non-numeric result encountered: ' + this.workspace.latexToHtml(result[1].returned));
			else
				this.finish_val = 1.0 * result[1].returned;
		} else
			errors.push('Final Value: ' + result[1].returned);
		if(result[2].success) {
			if(!result[2].returned.match(/^[0-9\.e\-]+$/))
				errors.push('Step Size: Non-numeric result encountered: ' + this.workspace.latexToHtml(result[2].returned));
			else
				this.step_val = 1.0 * result[2].returned;
		} else
			errors.push('Step Size: ' + result[2].returned);

		if(errors.length) {
			this.outputBox.setError(errors.join('<BR>'));
			this.outputBox.expand();
		} else {
			this.outputBox.collapse();
			this.start_val -= this.step_val; // Seed first iteration value
			this.count = 0;
		}
		this.childrenEvaluated(evaluation_id);
		return false;
	}
	// Called by the last child node of this element after it is evaluated.  Reloops if we have more loops to calculate
	_.childrenEvaluated = function(evaluation_id) {
		this.suppress_output = false;
		if(this.shouldBeEvaluated(evaluation_id)) {
			this.start_val += this.step_val;
			if(this.start_val < this.finish_val) {
				this.count++;
				if((this.start_val + this.step_val) >= this.finish_val) {
					this.outputBox.collapse();
				} else {
					if(this.count == 20) {
						this.outputBox.setWarning('Further output from this loop has been temporarily suppressed to increase computation speed.');
						this.outputBox.expand();
					}
					if(this.count >= 20)
						this.suppress_output = true;
				}
				if(this.count == 1000) {
					this.outputBox.setWarning('This loop has processed over 1,000 iterations.  <a href="#">Abort Computation</a>');
			    this.outputBox.jQinner.find('a').on('click', function(e) {
			      giac.cancelEvaluations($(this));
						$(this).closest('div.' + css_prefix + 'answer_table').hide({ duration: 400 });
			      return false;
			    });
					this.outputBox.expand();
				}
				this.startIteration(evaluation_id);
			} else {
				if(this.count == 0) {
					this.outputBox.setWarning('No iterations were performed for this loop.  Stop criterion was immediately reached.');
					this.outputBox.expand();
				} else
					this.outputBox.collapse();
				giac.execute(evaluation_id, this.move_to_next, [], this, 'scopeSaved');
			}
		} else
			this.evaluateNext(evaluation_id, this.move_to_next);
	}
	_.startIteration = function(evaluation_id) {
		giac.execute(evaluation_id, true, [{ command: this.iterator + ':=' + this.start_val }], this, 'startIterationCallback');
	}
	_.startIterationCallback = function(result, evaluation_id) {
		if(!result[0].success) {
			this.outputBox.setError('Error setting iterator value: ' + result[0].returned);
			this.outputBox.expand();
		}
		if(this.ends[L])
			this.ends[L].continueEvaluation(evaluation_id, true)
		else
			this.childrenEvaluated(evaluation_id);
		return false;
	}
	_.focus = function(dir) {
		super_.focus.call(this);
		if(dir === 0)
			this.varField.focus(L);
		else if(!dir && this.focusedItem)
			this.focusedItem.focus();
		return this;
	}
  _.toString = function() {
  	return '{for}{{' + this.argumentList().join('}{') + '}}';
  }
	// Callback for math elements notifying that this element has been changed
	_.changed = function(el) {
		if(el == this.varField) this.touched[0] = true;
		if(el == this.startField) this.touched[1] = true;
		if(el == this.finishField) this.touched[2] = true;
		if(el == this.stepField) this.touched[3] = true;
		if(this.touched[0] && this.touched[1] && this.touched[2] && this.touched[3])
			this.needsEvaluation = true;
	}

});
var continue_block = P(Element, function(_, super_) {
	_.lineNumber = true;
	_.evaluatable = true;
	_.command_name = 'continue';
	_.helpText = "<<continue>>\nWithin a loop, a continue command will immediately cease the current loop iteration and return to the start of the loop to begin the next iteration.";
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + codeBlockHTML(this.command_name, this.id) + helpBlock() + '<BR>' + answerSpan() + '</div>';
	}
	_.postInsertHandler = function() {
		this.focusableItems = [[registerCommand(this, this.command_name, { allowDelete: true})]];
		super_.postInsertHandler.call(this);
		return this;
	}
	_.continueEvaluation = function(evaluation_id, move_to_next) {
		var parentLoop = this.parentLoop();
		if(parentLoop && this.shouldBeEvaluated(evaluation_id)) 
			parentLoop.childrenEvaluated(evaluation_id);
		else
			this.evaluateNext(evaluation_id, move_to_next);
	}
	_.parentLoop = function(skip_spinner_removal) {
		var found_loop = false;
		for(var el = this.parent; el instanceof Element; el = el.parent) {
			if(el instanceof Loop) { found_loop = el; break; }
		}
		if(found_loop) {
			if(!skip_spinner_removal) {
				for(var el = this.parent; el instanceof Element; el = el.parent) {
					if(el instanceof Loop) break;
					else el.leftJQ.find('i.fa-spinner').remove(); // Remove spinners from parents that we skip (never have their childrenEvaluated callback called)
				}
			}
			this.outputBox.collapse();
			return found_loop;
		} else {
			this.outputBox.setWarning('Statement is not within a loop.  Block has been ignored.');
			this.outputBox.expand();
			return false;
		}
	}
	_.focus = function(dir) {
		super_.focus.call(this);
		this.parentLoop(true);
		if(dir === 0) {
			if(this[R])
				this[R].focus(dir);
			else
				math().insertAfter(this).show().focus(dir).setImplicit();
		} else if(!dir && this.focusedItem)
			this.focusedItem.focus();
		return this;
	}
  _.toString = function() {
  	return '{' + this.command_name + '}{}';
  }
});
var break_block = P(continue_block, function(_, super_) {
	_.command_name = 'break';
	_.helpText = "<<break>>\nWithin a loop, a break command will immediately cease all iterations and exit the loop.";
	_.continueEvaluation = function(evaluation_id, move_to_next) {
		var parentLoop = this.parentLoop();
		if(parentLoop && this.shouldBeEvaluated(evaluation_id)) {
			parentLoop.start_val = parentLoop.finish_val; // Force loop to be complete
			parentLoop.childrenEvaluated(evaluation_id);
		}	else
			this.evaluateNext(evaluation_id, move_to_next);
	}
});