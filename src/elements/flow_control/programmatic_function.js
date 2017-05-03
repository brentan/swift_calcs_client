var programmatic_function = P(Element, function(_, super_) {
	_.klass = ['programmatic_function'];
	_.needsEvaluation = false; 
	_.evaluatable = true;
	_.hasChildren = true;
	_.lineNumber = true;
	_.helpText = "<<<[var]> = program>>\nProgram definition.  A Program is a pre-compiled series of commands that then returns a value.  Enter the progarm name and input variables (ex <[ProgName(in1, in2)]>), then use normal Swift Calcs tools and commands to build your program.  Ensure a <<return>> statement is included at some point in the program to return a value from the program.  You can then use the program later in your worksheet just as you would use a function.\nHELP:40";

	_.init = function() {
		this.function_vars = {};
		super_.init.call(this);
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'var') + '<span class="equality">&#8801;</span>' + focusableHTML('CodeBlock', 'program') + "&nbsp;<span class='explain locals'></span>" + helpBlock()
		+ '<BR>' + answerSpan() + '</div><div class="' + css_prefix + 'insert"></div><div class="' + css_prefix + 'focusableItems" data-id="2">' + focusableHTML('CodeBlock', 'end') + '</div>';
	}
	_.postInsertHandler = function() {
		this.varField = registerFocusable(MathQuill, this, 'var', { ghost: 'f(x,y)', handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[this.varField, registerFocusable(CodeBlock,this, 'program', { })], [-1], [registerFocusable(CodeBlock,this, 'end', { })]];
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
				if(!_this.varField.text().match(/^[a-z][a-z0-9_~]*\(([a-z][a-z0-9_~]*,)*[a-z][a-z0-9_~]*\)$/i))
					errors.push('Invalid function name (' + _this.worksheet.latexToHtml(_this.varField.latex()) + ').  Please enter a valid name, such as f(x)');
				if(errors.length && _this.outputMathBox) {
					_this.worksheet.save();
					_this.outputMathBox.clear();
					_this.setError(errors.join('<BR>'));
				} else {
					_this.independent_vars = SwiftCalcs.GetIndependentVars(_this.varField.text() + " := 1");
					_this.commands.push([]); // Make new commands return true to force execution
					_this.evaluate();
					_this.needsEvaluation = false;
				}
			}
		};
	}
	_.continueEvaluation = function(evaluation_id) {
		if(this.shouldBeEvaluated(evaluation_id)) {
			this.command_list = [];
			this.function_vars = {};
			this.internal_independents = {};
	    if(this.varField.text().match(/^[\s]*[a-z][a-z0-9_~]*\(.*\)[\s]*$/i)) {
	      // Find function vars
	      var list = this.varField.text().replace(/^[\s]*[a-z][a-z0-9_~]*\((.*)\)[\s]*$/i,"$1").split(",");
	      for(var i = 0; i < list.length; i++) {
	      	this.function_vars[list[i].trim()] = true;
	        this.internal_independents[list[i].trim()] = true;
	      }
	    } 
			this.dependent_vars = [];
			giac.setCompileMode(true, this); //Enable compile mode
		}
		return super_.continueEvaluation.call(this, evaluation_id);
	}
  _.register_vars = function(independent_vars, dependent_vars) {
  	// Register independent and dependent vars from all blocks so that we know what external vars we depend on
  	for(var i = 0; i < dependent_vars.length; i++)
  		if((this.internal_independents[dependent_vars[i].trim()] !== true) && (this.dependent_vars.indexOf(dependent_vars[i].trim()) === -1)) this.dependent_vars.push(dependent_vars[i].trim())
  	for(var i = 0; i < independent_vars.length; i++)
  		this.internal_independents[independent_vars[i].trim()] = true;
  }
	_.compile_line = function(commands, el, evaluation_id, callback_function) {
		for(var i = 0; i < commands.length; i++) {
			if(commands[i].pre_command) this.command_list.push(commands[i].pre_command);
	    if(((i+1) < commands.length) && (commands[i+1].dereference)) { // Need to do the de-referencing directly
	    	this.command_list.push("temp__var := " + commands[i].command);
	    	this.command_list.push(commands[i+1].command.replace(/\[val\]/g, "(temp__var)"));
	    	this.command_list.push('purge(temp__var);');
	    	i++;
	    } else
	    	this.command_list.push(commands[i].command);
		}
		if(callback_function && callback_function != "evaluationFinished") {
			if(el[callback_function]([],evaluation_id)) el.evaluateNext(evaluation_id);
		}	else
			el.evaluateNext(evaluation_id);
	}
	_.childrenEvaluated = function(evaluation_id) {
		giac.setCompileMode(false, this); //Disable compile mode
		this.jQ.find('span.explain.locals').first().html('');
		var varField = this.varField.text().trim();
		if(this.command_list.length > 0) {
			//take all the commands that were issued and stitch them together into a function, then send that to giac for compilation
			var input_vars = varField.replace(/^[\s]*[a-z][a-z0-9_~]*\((.*)\)$/i, "$1").replace(/ /g,'').split(',');
			var locals = ['temp__var'];
			var added = {temp__var: true};
			for(var i = 0; i < this.command_list.length; i++) {
				if(this.command_list[i].match(/^[\s]*[a-z][a-z0-9_~]*(\([a-z0-9_~,]+\))?[\s]*:=/i)) {
					var local_var = this.command_list[i].replace(/(?:\r\n|\r|\n)/g, ' ').replace(/^[\s]*([a-z][a-z0-9_~]*).*$/i, "$1");
					var add_to_vars = true;
					for(var j=0; (j<input_vars.length) && add_to_vars; j++)
						if(input_vars[j] == local_var) add_to_vars = false;
					if(add_to_vars && (added[local_var] !== true)) locals.push(local_var);
					added[local_var] = true;
				}
			}
			var prog = varField + " := {\n";
			var html = [];
			for(var i = 0; i < locals.length; i++)
				if(locals[i].indexOf("__") == -1) html.push(window.SwiftCalcsLatexHelper.VarNameToHTML(locals[i]));
			this.jQ.find('span.explain.locals').first().html('local variables: ' + html.join(", "));
			prog += "local " + locals.join(",") + ";\n"; 
			prog += (this.command_list.join(";\n") + ";\n}").replace(/(;|\}|\{);/g,"$1");
		} else
			var prog = varField + " := 0;";
		if(prog.indexOf("return") == -1) {
			this.outputBox.setWarning('No <i>return</i> statement found in program.  Ensure your program includes a return statement.', false, true);
			this.outputBox.expand();
		} else {
			this.outputBox.clearState();
			this.outputBox.collapse();
		}
		this.startCompilation(evaluation_id, prog);
	}
	_.startCompilation = function(evaluation_id, prog) {
		this.commands = [{ command: prog, nomarkup: true }];
		if(this.newCommands()) 
			this.altered_content = true;
		this.altered(evaluation_id);
		giac.execute(evaluation_id, this.commands, this, 'compilationCallback');
	}
	_.compilationCallback = function(result, evaluation_id) {
		if(!giac.compile_mode && !result[0].success) {
			this.outputBox.setError('Error compiling function: ' + result[0].returned);
			this.outputBox.expand();
		}
		super_.childrenEvaluated.call(this, evaluation_id);
		return false;
	}
  _.toString = function() {
  	return '{program}{{' + this.argumentList().join('}{') + '}}';
  }
	// Callback for math elements notifying that this element has been changed
	_.changed = function(el) {
		if(el == this.varField) this.needsEvaluation = true;
	}
	_.validateChild = function(child) {
		return !(child instanceof plot);
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
	// Override because this element should not return the archive list of its children, which are of a different scope
	_.getUnarchiveList = function() {
		if(this.unarchive_list_set) return this.unarchive_list;
		return this.previousUnarchivedList();
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
  _.indent = function(el, indent) {
    if(el === this.focusableItems[0][0]) {
      //indent me (or un-indent)
      if(indent)
        this.worksheet.indent(this);
      else
        this.worksheet.outdent(this);
      el.focus(L);
      return true;
    } else
      return false;
  }
});
var return_block = P(FlowControl, function(_, super_) {
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