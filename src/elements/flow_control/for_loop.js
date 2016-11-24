var for_loop = P(Loop, function(_, super_) {
	_.klass = ['for'];
	_.needsEvaluation = false; 
	_.evaluatable = true;
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
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'for') + focusableHTML('MathQuill',  'var') 
		+ '&nbsp;from&nbsp;' + focusableHTML('MathQuill',  'start')  
		+ '&nbsp;to&nbsp;' + focusableHTML('MathQuill',  'finish')  
		+ '&nbsp;by&nbsp;' + focusableHTML('MathQuill',  'step') + helpBlock()
		+ '<BR>' + answerSpan() + '</div><div class="' + css_prefix + 'insert"></div><div class="' + css_prefix + 'focusableItems" data-id="2">' + focusableHTML('CodeBlock', 'end') + '</div>';
	}
	_.postInsertHandler = function() {
		this.varField = registerFocusable(MathQuill, this, 'var', { ghost: 'j', handlers: {
			enter: this.enterPressed(this,1),
			blur: this.submissionHandler(this)
		}});
		this.startField = registerFocusable(MathQuill, this, 'start', { ghost: 'start', handlers: {
			enter: this.enterPressed(this,2),
			blur: this.submissionHandler(this)
		}});
		this.finishField = registerFocusable(MathQuill, this, 'finish', { ghost: 'finish', handlers: {
			enter: this.enterPressed(this,3),
			blur: this.submissionHandler(this)
		}});
		this.stepField = registerFocusable(MathQuill, this, 'step', { ghost: 'step', handlers: {
			enter: this.enterPressed(this,4),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[registerFocusable(CodeBlock,this, 'for', { }), this.varField, this.startField, this.finishField, this.stepField], [-1], [registerFocusable(CodeBlock,this, 'end', { })]];
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
					math().setImplicit().prependTo(_this).show().focus();
			}	else 
				_this.focusableItems[0][to_focus+1].focus(-1);
		};
	}
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.needsEvaluation) {
				//console.log(mathField.latex());
				// Build command list
				_this.commands = [{ command: 'evalf(' + _this.startField.text() + ')', nomarkup: true },{ command: 'evalf(' + _this.finishField.text() + ')', nomarkup: true },{ command: 'evalf(' + _this.stepField.text() + ')', nomarkup: true },{ command: _this.varField.text(), nomarkup: true }];
				_this.independent_vars = [_this.varField.text().trim()];
				_this.dependent_vars = GetDependentVars(_this.startField.text() + ' ' + _this.finishField.text() + ' ' + _this.stepField.text());
				_this.evaluate();
				_this.needsEvaluation = false;
			}
		};
	}
	// Ask every child of this if has been altered or if it depends on any of the altered variables.  If so, we need to re-evaluate the loop
	_.childNeedsEvaluation = function(evaluation_id) {
		var any_altered = false;
		var test_function = function(_this) {
			if(any_altered) return;
			if(_this.altered_content || giac.check_altered(evaluation_id, _this)) any_altered = true;
		}
		for(var el = this.ends[L]; el instanceof Element; el = el[R]) 
			el.commandChildren(test_function);
		return any_altered;
	}
	// Continue evaluation is called within an evaluation chain.  It will evaluate this node, and then move to evaluate the next node.
	_.continueEvaluation = function(evaluation_id) {
		if(this.shouldBeEvaluated(evaluation_id)) {
			if(this.altered(evaluation_id) || this.childNeedsEvaluation(evaluation_id)) {
				this.single_run = false;
				this.addSpinner(evaluation_id);
				giac.execute(evaluation_id, this.commands, this, 'evaluationFinished');
			} else {
				// Basically, nothing in the loop changed or will change, but we need to walk through to do the restore on all vars in it, so we do one pass to allow for the unarchives
				this.single_run = true;
				if(this.ends[L])
					this.ends[L].continueEvaluation(evaluation_id)
				else
					this.childrenEvaluated(evaluation_id);
			}
		} else 
			this.evaluateNext(evaluation_id);
	}
	_.evaluationFinished = function(result, evaluation_id) {
		this.iterator = this.varField.text().trim();
		var errors=[];
		if(!this.iterator.match(/^[a-z][a-z0-9_]*$/))
			errors.push('Iterator: Invalid iterator name (' + this.worksheet.latexToHtml(this.iterator) + ').  Please enter a valid variable name');
		if(result[0].success) {
			if(!result[0].returned.match(/^[0-9\.e\-]+$/))
				errors.push('Start Value: Non-numeric result encountered: ' + this.worksheet.latexToHtml(result[0].returned));
			else
				this.start_val = 1.0 * result[0].returned;
		} else
			errors.push('Start Value: ' + result[0].returned);
		if(result[1].success) {
			if(!result[1].returned.match(/^[0-9\.e\-]+$/))
				errors.push('Final Value: Non-numeric result encountered: ' + this.worksheet.latexToHtml(result[1].returned));
			else
				this.finish_val = 1.0 * result[1].returned;
		} else
			errors.push('Final Value: ' + result[1].returned);
		if(result[2].success) {
			if(!result[2].returned.match(/^[0-9\.e\-]+$/))
				errors.push('Step Size: Non-numeric result encountered: ' + this.worksheet.latexToHtml(result[2].returned));
			else
				this.step_val = 1.0 * result[2].returned;
		} else
			errors.push('Step Size: ' + result[2].returned);

		if(errors.length) {
			this.outputBox.setError(errors.join('<BR>'));
			this.outputBox.expand();
			this.evaluateNext(evaluation_id);
		} else {
			this.outputBox.collapse();
			this.start_val -= this.step_val; // Seed first iteration value
			this.count = 0;
			this.childrenEvaluated(evaluation_id);
		}
		return false;
	}
	// Called by the last child node of this element after it is evaluated.  Reloops if we have more loops to calculate
	_.childrenEvaluated = function(evaluation_id) {
		this.suppress_output = false;
		this.start_val += this.step_val;
		if(this.single_run) {
			var next_id = this.nextEvaluateElement();
			giac.add_altered(evaluation_id, [this.iterator.trim()], next_id ? next_id.id : -1); 
			giac.skipExecute(evaluation_id, this, 'scopeSaved');
		} else if(this.start_val < this.finish_val) {
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
			var next_id = this.nextEvaluateElement();
			giac.add_altered(evaluation_id, [this.iterator.trim()], next_id ? next_id.id : -1); 
			giac.skipExecute(evaluation_id, this, 'scopeSaved');
		}
	}
	_.startIteration = function(evaluation_id) {
		giac.add_altered(evaluation_id, [this.iterator.trim()], this.ends[L].id); // Add in iterator to 'altered' list
		if(this.count > 1) {
			// 2nd + iteration.  Need to load back in vars I just edited from the last iteration
			var next_id = this.nextEvaluateElement();
			giac.add_altered(evaluation_id, giac.get_and_wipe_altered(evaluation_id, next_id ? next_id.id : -1), this.ends[L].id); 
		}
		giac.execute(evaluation_id, [{ command: this.iterator + ':=' + this.start_val, nomarkup: true }], this, 'startIterationCallback');
	}
	_.startIterationCallback = function(result, evaluation_id) {
		if(!result[0].success) {
			this.outputBox.setError('Error setting iterator value: ' + result[0].returned);
			this.outputBox.expand();
		}
		if(this.ends[L])
			this.ends[L].continueEvaluation(evaluation_id)
		else
			this.childrenEvaluated(evaluation_id);
		return false;
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
	_.overrideUnarchivedListForChildren = function() {
		var list = this.previousUnarchivedList().slice(0);
		list.push([this.worksheet.id + "_" + this.id, [this.varField.text().trim()]]);
		return list;
	}

});
var continue_block = P(Element, function(_, super_) {
	_.lineNumber = true;
	_.evaluatable = true;
	_.command_name = 'continue';
	_.helpText = "<<continue>>\nWithin a loop, a continue command will immediately cease the current loop iteration and return to the start of the loop to begin the next iteration.";

	_.allIndependentVars = function() {
		return [""]; // force to appear as scoped
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', this.command_name) + helpBlock() + '<BR>' + answerSpan() + '</div>';
	}
	_.postInsertHandler = function() {
		this.focusableItems = [[registerFocusable(CodeBlock,this, this.command_name, { allowDelete: true})]];
		super_.postInsertHandler.call(this);
		return this;
	}
	_.continueEvaluation = function(evaluation_id) {
		var parentLoop = this.parentLoop();
		if(parentLoop && this.shouldBeEvaluated(evaluation_id)) {
			// Need to load the vars that I am being asked to load to the nextEvaluateElement instead (note, on next iteration the for loop will lift these and move them back to the start)
			var next_id = parentLoop.nextEvaluateElement();
			giac.add_altered(evaluation_id, giac.get_and_wipe_altered(evaluation_id, this.id), next_id ? next_id.id : -1); 
			parentLoop.childrenEvaluated(evaluation_id);
		} else
			this.evaluateNext(evaluation_id);
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
		if(!this.inTree) return this;
		super_.focus.call(this);
		this.parentLoop(true);
		if(dir === 0) {
			if(this[R])
				this[R].focus(dir);
			else
				math().setImplicit().insertAfter(this).show().focus(dir);
		} 
		return this;
	}
  _.toString = function() {
  	return '{' + this.command_name + '}{}';
  }
	_.validateParent = function(parent) {
		for(parent; !(parent instanceof Worksheet); parent = parent.parent)
			if (parent instanceof Loop) return true;
		return false;
	}
});
var break_block = P(continue_block, function(_, super_) {
	_.command_name = 'break';
	_.helpText = "<<break>>\nWithin a loop, a break command will immediately cease all iterations and exit the loop.";
	_.continueEvaluation = function(evaluation_id) {
		var parentLoop = this.parentLoop();
		if(parentLoop && this.shouldBeEvaluated(evaluation_id)) {
			parentLoop.start_val = parentLoop.finish_val; // Force loop to be complete
			// Need to load the vars that I am being asked to load to the nextEvaluateElement instead
			var next_id = parentLoop.nextEvaluateElement();
			giac.add_altered(evaluation_id, giac.get_and_wipe_altered(evaluation_id, this.id), next_id ? next_id.id : -1); 
			parentLoop.childrenEvaluated(evaluation_id);
		} else
			this.evaluateNext(evaluation_id);
	}
});