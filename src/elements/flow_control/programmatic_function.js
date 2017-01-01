var programmatic_function = P(Element, function(_, super_) {
	_.klass = ['programmatic_function'];
	_.needsEvaluation = false; 
	_.evaluatable = true;
	_.hasChildren = true;
	_.lineNumber = true;
	_.helpText = "<<<[var]> = function>>\nProgrammatic Function Definition.  Return an output from the function based on provided inputs by following the computation put forth in the function.";

	_.init = function() {
		super_.init.call(this);
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'var') + '<span class="equality">&#8801;</span>' + focusableHTML('CodeBlock', 'function') + helpBlock()
		+ '<BR>' + answerSpan() + '</div><div class="' + css_prefix + 'insert"></div><div class="' + css_prefix + 'focusableItems" data-id="2">' + focusableHTML('CodeBlock', 'end') + '</div>';
	}
	_.postInsertHandler = function() {
		this.varField = registerFocusable(MathQuill, this, 'var', { ghost: 'f(x,y)', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[this.varField, registerFocusable(CodeBlock,this, 'function', { })], [-1], [registerFocusable(CodeBlock,this, 'end', { })]];
		this.needsEvaluation = false;
		super_.postInsertHandler.call(this);
		return this;
	}
	_.enterPressed = function(_this) {
		return function(mathField) {
			_this.submissionHandler(_this)(mathField);
			if(_this.ends[L] && (_this.ends[L] instanceof math) && _this.ends[L].empty())
				_this.ends[L].focus(L);
			else
				math().setImplicit().prependTo(_this).show().focus();
		};
	}
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.needsEvaluation) {
				// check for anything that is empty
				var errors = [];
				if(!_this.varField.text().match(/^[a-z][a-z0-9_]*\(([a-z][a-z0-9_]*,)*[a-z][a-z0-9_]*\)$/i))
					errors.push('Invalid function name (' + _this.worksheet.latexToHtml(_this.varField.latex()) + ').  Please enter a valid name, such as f(x)');
				if(errors.length && _this.outputMathBox) {
					_this.worksheet.save();
					_this.outputMathBox.clear();
					_this.setError(errors.join('<BR>'));
				} else {
					_this.evaluate();
					_this.needsEvaluation = false;
				}
			}
		};
	}
	_.continueEvaluation = function(evaluation_id) {
		if(this.shouldBeEvaluated(evaluation_id)) {
			this.command_list = [];
			giac.setCompileMode(true, this); //Enable compile mode
		}
		return super_.continueEvaluation.call(this, evaluation_id);
	}
	_.compile_line = function(commands, el, evaluation_id) {
		for(var i = 0; i < commands.length; i++) {
			if(commands[i].pre_command) this.command_list.push(commands[i].pre_command);
	    if(((i+1) < commands.length) && (commands[i+1].dereference)) { // A bit hacky, but we have to deal with the special mksavariable_mode being enabled/disabled
	    	this.command_list.push("temp__var := " + commands[i].command);
	    	this.command_list.push(commands[i+1].command.replace(/\[val\]/g, "revertSWIFTCALCSCLIENTunits(temp__var)"));
	    	this.command_list.push('purge(temp__var);');
	    	i++;
	    } else
	    	this.command_list.push(commands[i].command);
		}
		el.evaluateNext(evaluation_id);
	}
	_.childrenEvaluated = function(evaluation_id) {
		giac.setCompileMode(false, this); //Disable compile mode
		var varField = this.varField.text().trim();
		if(this.command_list.length > 0) {
			//take all the commands that were issued and stitch them together into a function, then send that to giac for compilation
			var input_vars = varField.replace(/^[\s]*[a-z][a-z0-9_]*\((.*)\)$/i, "$1").replace(/ /g,'').split(',');
			var locals = [];
			for(var i = 0; i < this.command_list.length; i++) {
				if(this.command_list[i].match(/^[\s]*[a-z][a-z0-9_]*(\([a-z0-9_,]+\))?[\s]*:=/i)) {
					var local_var = this.command_list[i].replace(/^[\s]*([a-z][a-z0-9_]*).*$/i, "$1");
					var add_to_vars = true;
					for(var j=0; (j<input_vars.length) && add_to_vars; j++)
						if(input_vars[j] == local_var) add_to_vars = false;
					if(add_to_vars) locals.push(local_var);
				}
			}
			var prog = varField + " := {\n";
			if(locals.length > 0)
				prog += "local " + locals.join(",") + ";\n"; 
			prog += this.command_list.join(";\n").replace(";;",";") + ";\n}";
		} else
			var prog = varField + " := 0;";
		this.startCompilation(evaluation_id, prog);
	}
	_.startCompilation = function(evaluation_id, prog) {
		giac.execute(evaluation_id, [{ command: prog, nomarkup: true }], this, 'compilationCallback');
	}
	_.compilationCallback = function(result, evaluation_id) {
		if(!result[0].success) {
			this.outputBox.setError('Error compiling function: ' + result[0].returned);
			this.outputBox.expand();
		}
		super_.childrenEvaluated.call(this, evaluation_id);
		return false;
	}
  _.toString = function() {
  	return '{function}{{' + this.argumentList().join('}{') + '}}';
  }
	// Callback for math elements notifying that this element has been changed
	_.changed = function(el) {
		if(el == this.varField) this.needsEvaluation = true;
	}
	_.validateChild = function(child) {
		return !(child instanceof plot);
  }
	_.validateParent = function(parent) {
		if (parent instanceof Worksheet) return true;
		return false;
	}
	// Update the line numbers on this block and all children
	_.numberBlock = function(start) {
		this.myLineNumber = start;
		this.leftJQ.children('span').html(start);
		start++;
		var cstart = 1;
		jQuery.each(this.children(), function(i, child) {
			cstart = child.numberBlock(cstart);
		});
		return start;
	}
	_.findByLineNumber = function(line) {
		if(this.myLineNumber === line) return this;
		return undefined;
	}

});
var return_block = P(Element, function(_, super_) {
	_.lineNumber = true;
	_.evaluatable = true;
	_.needsEvaluation = false;
	_.helpText = "<<return>>\nWithin a function, a return command will immediately cease execution and return the value following the call to 'return'.";
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'return') + focusableHTML('MathQuill',  'val') + helpBlock() + '<BR>' + answerSpan() + '</div>';
	}
	_.postInsertHandler = function() {
		this.valField = registerFocusable(MathQuill, this, 'val', { ghost: 'expression', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[registerFocusable(CodeBlock,this, 'return', { }), this.valField]];
		super_.postInsertHandler.call(this);
		return this;
	}
	_.enterPressed = function(_this) {
		return function(mathField) {
			_this.submissionHandler(_this)(mathField);
			if(_this[R] && (_this[R] instanceof math) && _this[R].empty())
				_this[R].focus(L);
			else
				math().setImplicit().insertAfter(_this).show().focus(0);
		};
	}
	_.validateParent = function(parent) {
		for(parent; !(parent instanceof Worksheet); parent = parent.parent)
			if (parent instanceof programmatic_function) return true;
		return false;
	}
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.needsEvaluation) {
				_this.commands = [{command: 'return(' + _this.valField.text() + ')', nomarkup: true}];
				_this.evaluate();
				_this.needsEvaluation = false;
			}
		};
	}
	_.changed = function(el) {
		if(el == this.valField) this.needsEvaluation = true;
	}
	_.focus = function(dir) {
		if(!this.inTree) return this;
		super_.focus.call(this);
		if(dir === 0) 
			this.valField.focus(dir);
		return this;
	}
  _.toString = function() {
  	return '{return}{{' + this.argumentList().join('}{') + '}}';
  }
});