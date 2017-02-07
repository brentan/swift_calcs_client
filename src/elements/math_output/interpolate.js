
var interpolate = P(SettableMathOutput, function(_, super_) {
  _.klass = ['interpolate'];
  _.helpText = "<<interpolate x=<[x]>, y=<[y]>, order <[n]>>>\nReturn a piecewise function representing the interpolation of the provided data with splines of order n.  Use the checkbox to specify whether extraplated values should be returned for inputs outside the dataset.";

  _.innerHtml = function() {
    var html = '<div class="' + css_prefix + 'focusableItems" data-id="0">x<sub>data</sub><span class="equality">&#8801;</span>' + focusableHTML('MathQuill',  'xdata') + helpBlock() + '</div>'
    + '<div class="' + css_prefix + 'focusableItems" data-id="1">y<sub>data</sub><span class="equality">&#8801;</span>' + focusableHTML('MathQuill',  'ydata') + '</div>'
    + '<div class="' + css_prefix + 'focusableItems" data-id="2">spline order of ' + focusableHTML('MathQuill',  'order') + '</div>'
    + '<div class="' + css_prefix + 'focusableItems" data-id="3">' + focusableHTML('CheckBox',  'extrapolate') + '</div>';
    return this.wrapHTML('interpolate', html);
  }
  _.postInsertHandler = function() {
    this.xdata = registerFocusable(MathQuill, this, 'xdata', { ghost: '[data]', handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.ydata = registerFocusable(MathQuill, this, 'ydata', { ghost: '[data]', handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.order = registerFocusable(MathQuill, this, 'order', { ghost: 'n', handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.extrapolate = registerFocusable(CheckBox, this, 'extrapolate', { message: 'Extrapolate outside of data range'});
    this.focusableItems = [[this.xdata] , [this.ydata], [this.order], [this.extrapolate]];
    this.needsEvaluation = false;
    super_.postInsertHandler.call(this);
    var all_touched = true;
    for(var i = 0; i < 3; i++) {
      for(var j = 0; j < this.focusableItems[i].length; j++) {
        if(this.focusableItems[i][j].needs_touch) all_touched = all_touched && this.focusableItems[i][j].touched;
      }
    }
    if(all_touched) {
      this.needsEvaluation = true;
      this.submissionHandler(this)(this.xdata);
    }
    return this;
  }

  _.submissionHandler = function(_this) {
    return function(mathField) {
      if(_this.needsEvaluation) {
        // check for anything that is empty
        var errors = [];
        if(_this.varStoreField.text().trim().length && !_this.varStoreField.text().match(/^[a-z][a-z0-9_~]*\([a-z][a-z0-9_~]*\)$/i)) {
          if(_this.varStoreField.text().match(/^[a-z][a-z0-9_~]*$/i)) {
            // Need to turn in to a function definition
            var varName = window.SwiftCalcsLatexHelper.VarNameToLatex(_this.varStoreField.text());
            _this.varStoreField.clear().paste("\\operatorname{" + varName + "}\\left({x}\\right)");
          } else
            errors.push('Invalid function name (' + _this.worksheet.latexToHtml(_this.varStoreField.latex()) + ').  Please enter a valid variable name');
        }
        var xdata_text = _this.xdata.text({});
        var ydata_text = _this.ydata.text({});
        if(_this.xdata.empty())
          errors.push('No x data provided.');
        if(_this.ydata.empty())
          errors.push('No y data provided.');
        if(_this.order.empty())
          errors.push('No polynomial order provided.');
        var ind_var = _this.varStoreField.text().match(/\(/) ? _this.varStoreField.text().replace(/^([a-z][a-z0-9_~]*)\(([a-z][a-z0-9_~]*)\)$/i,"$2") : "x";
        var command = 'spline(evalf(' + _this.xdata.text({check_for_array: true}) + "), evalf(" + _this.ydata.text({check_for_array: true}) + ")," + ind_var + "," + _this.order.text({}) + "," + (_this.extrapolate.checked ? "1" : "0") + ")";
        _this.commands = _this.genCommand("[val]");
        _this.commands[0].dereference = true;
        _this.commands[0].force_simplify = 'regroup';
        _this.commands[0].restore_vars = ind_var;
        if(errors.length && _this.outputMathBox) {
          _this.worksheet.save();
          _this.outputMathBox.clear();
          _this.setError(errors.join('<BR>'));
        } else {
          _this.dependent_vars = GetDependentVars(command);
          // Solve the equation, with special unit mode for the solver.  Result will be inserted in place of [val] in the next computation
          _this.commands.unshift({command: command, protect_vars: ind_var, nomarkup: true }); 
          _this.evaluate();
          _this.needsEvaluation = false;
        }
      }
    };
  }
  _.evaluationFinished = function(result) {
    // BRENTAN: Deal with different modes and rebuild them into functions, and add units along the way
    if(result[1].returned && result[1].success) {
      var warnings = [];
      for(var i = 0; i < result[1].warnings; i++) 
        if(!result[1].warnings[i].match(/assignation is x_unit/) && !result[1].warnings[i].match(/declared as global/))
          warnings.push(result[1].warnings[i]);
      result[1].warnings = warnings;
    }
    var to_return = super_.evaluationFinished.call(this, [result[1]]); // Transform to array with result 1 in spot 0, as that is what is expected in evaluationFinished
    this.last_result = result;
    return to_return;
  }
  _.getLastResult = function() {
    if(this.last_result && this.last_result[1] && this.last_result[1].success) return this.last_result[1].returned;
    return false;
  }
  _.changed = function(el) {
    var all_touched = true;
    for(var i = 0; i < 3; i++) {
      for(var j = 0; j < this.focusableItems[i].length; j++) {
        if(el === this.focusableItems[i][j]) this.focusableItems[i][j].touched = true;
        if(this.focusableItems[i][j].needs_touch) all_touched = all_touched && this.focusableItems[i][j].touched;
      }
    }
    if(all_touched)
      this.needsEvaluation = true;
  }
});