
var multi_regression = P(SettableMathOutput, function(_, super_) {
  _.klass = ['multi_regression'];
  _.helpText = "<<multi_regression>>\nWill find the best fit to the supplied data for a linear summation of terms:\ny=b<sub>0</sub>+b<sub>1</sub>*x<sub>1</sub>+b<sub>2</sub>*x<sub>2</sub>+...+b<sub>n</sub>*x<sub>n</sub>\nProvide the y (dependent) data, and 1 or more independent datasets (x<sub>1</sub>, x<sub>2</sub>, etc) matched with the y-data.  If each y-value should be weighted (useful if the data has been transformed, for example from log space), you can add the weights as well.  Finally, check whether to allow a non-zero constant to be included in the results (if unchecked, b<sub>0</sub>=0)";
  _.savedProperties = ['number_of_datasets','include_weights'];
  _.number_of_datasets = 1;
  _.include_weights = false;

  _.init = function() {
    this.xdata = [];
    super_.init.call(this);
  }
  _.innerHtml = function() {
    var html = '<div class="' + css_prefix + 'focusableItems" data-id="1">y<sub>data</sub><span class="equality">&#8801;</span>' + focusableHTML('MathQuill',  'ydata') + helpBlock() + '</div>'
    + '<div class="weight_link"><div class="' + css_prefix + 'add_weights ' + css_prefix + 'hide_print">Add weights to the data</div></div>'
    + '<div style="display:none;" class="weights">with data weights of ' + focusableHTML('MathQuill',  'weights') + '&nbsp;<i class="fa fa-remove ' + css_prefix + 'hide_print"></i></div>'
    + '<div class="' + css_prefix + 'focusableItems data_line" data-id="2">x<sub><span class="counter">1</span> data</sub><span class="equality">&#8801;</span>' + focusableHTML('MathQuill',  'xdata0') + '</div>'
    + '<div><div class="' + css_prefix + 'add_equation ' + css_prefix + 'hide_print">Add another independent parameter</div></div>'
    + '<div class="' + css_prefix + 'focusableItems" data-id="3">' + focusableHTML('CheckBox',  'intercept') + '</div>';
    return this.wrapHTML('multiple linear regression', html, true);
  }
  _.postInsertHandler = function() {
    this.xdata[0] = registerFocusable(MathQuill, this, 'xdata0', { ghost: '[data]', handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.ydata = registerFocusable(MathQuill, this, 'ydata', { ghost: '[data]', handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.weights = registerFocusable(MathQuill, this, 'weights', { ghost: '[weights]', handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.intercept = registerFocusable(CheckBox, this, 'intercept', { message: 'Allow non-zero constant term'});
    this.focusableItems = [[this.ydata] , [this.xdata[0]], [this.intercept]];
    this.needsEvaluation = false;
    super_.postInsertHandler.call(this);
    return this;
  }
  _.parseSavedProperties = function(args) {
    super_.parseSavedProperties.call(this, args);
    // After we do this, we want to set up the DOM correctly for the number of equations this block had, before rest of parse completes
    var equations_to_add = this.number_of_datasets;
    this.number_of_datasets = 1;
    for(var i = 1; i < equations_to_add; i++)
      this.addEquation(false, true);
    if(this.include_weights)
      this.addWeights(false, true);
    this.redoFocusableList();
    return this;
  }
  _.eq_id = 1;
  _.addEquation = function(focus, skip_focusable) {
    // Add a new equation line to the solver list
    var html = '<div class="' + css_prefix + 'focusableItems data_line">x<sub><span class="counter"></span> data</sub><span class="equality">&#8801;</span>' + focusableHTML('MathQuill',  'xdata' + this.eq_id) + '&nbsp;<i class="fa fa-remove ' + css_prefix + 'hide_print"></i></div>';
    this.jQ.find('.' + css_prefix + 'add_equation').before(html);
    this.xdata.push(registerFocusable(MathQuill, this, 'xdata' + this.eq_id, { ghost: '[data]', handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }}));
    this.eq_id++;
    this.number_of_datasets++;
    if(!skip_focusable) this.redoFocusableList();
    if(focus) this.xdata[this.number_of_datasets-1].focus(1);
  }
  _.removeEquation = function(index) {
    if((index == 2) && this.include_weights) return this.removeWeights();
    if(this.xdata[index-2].touched) this.changed();
    this.xdata.splice(index-2, 1);
    this.jQ.find('.' + css_prefix + 'content').find('.' + css_prefix + 'focusableItems').each(function() {
      var el = $(this);
      if((el.attr('data-id')*1) == index)
        el.removeClass(css_prefix + 'focusableItems').slideUp({duration: 150, always: function() { el.remove(); } });
    });
    this.number_of_datasets--;
    this.redoFocusableList();
    this.changed(false);
    this.submissionHandler(this)();
  }
  _.redoFocusableList = function() {
    var id = 0;
    var count = 1;
    // Renumber the DOM ids
    this.jQ.find('.' + css_prefix + 'content').find('.' + css_prefix + 'focusableItems').each(function() {
      $(this).attr('data-id', id);
      id++;
      if($(this).hasClass('data_line')) {
        $(this).find('span.counter').html(count);
        count++;
      }
    });
    // Recreate focusable Items array
    this.focusableItems = [[this.varStoreField, this.command],[this.ydata]];
    if(this.include_weights)
      this.focusableItems.push([this.weights]);
    for(var i = 0; i < this.number_of_datasets; i++)
      this.focusableItems.push([this.xdata[i]])
    this.focusableItems.push([this.intercept]);
  }
  _.addWeights = function(focus, skip_focusable) {
    // Add a new equation line to the solver list
    this.jQ.find('.weights').addClass(css_prefix + 'focusableItems').show();
    this.jQ.find('.weight_link').hide();
    this.include_weights = true;
    if(!skip_focusable) this.redoFocusableList();
    if(focus) this.weights.focus(1);
  }
  _.removeWeights = function() {
    this.jQ.find('.weights').removeClass(css_prefix + 'focusableItems').hide();
    this.jQ.find('.weight_link').show();
    this.include_weights = false;
    this.redoFocusableList();
    this.changed(false);
    this.submissionHandler(this)();
  }
  _.mouseClick = function(e) {
    var target = $(e.target);
    if(target.hasClass(css_prefix + 'add_equation')) {
      this.addEquation(true);
      return false;
    }
    if(target.hasClass(css_prefix + 'add_weights')) {
      this.addWeights(true);
      return false;
    }
    if(target.hasClass('fa-remove')) {
      this.removeEquation(target.closest('div.' + css_prefix + 'focusableItems').attr('data-id')*1);
      return false;
    }
    if(super_.mouseClick.call(this,e)) return true;
  }
  _.submissionHandler = function(_this) {
    return function(mathField) {
      if(_this.needsEvaluation) {
        // check for anything that is empty
        var errors = [];
        if(_this.varStoreField.text().trim().length && !_this.varStoreField.text().match(/^[a-z][a-z0-9_]*(\([a-z][a-z0-9_,]*\))?$/i))
          errors.push('Invalid variable name (' + _this.worksheet.latexToHtml(_this.varStoreField.latex()) + ').  Please enter a valid variable name');
        var xdata = _this.xdata[0].text({});
        var ydata_text = _this.ydata.text({});
        for(var i = 0; i < _this.xdata.length; i++)
          if(_this.xdata[i].empty()) errors.push('Dataset ' + (i+1) + ' is currently empty.  Please add a dataset.');
        if(_this.ydata.empty())
          errors.push('No y data provided.');
        if(_this.include_weights && _this.weights.empty())
          errors.push('No weight information provided.');

        var x_data = [];
        for(var i = 0; i < _this.xdata.length; i++) 
          x_data.push(_this.xdata[i].text({check_for_array: true}));

        var command = 'multi_regression(' + _this.ydata.text({check_for_array: true}) + ",[" + x_data.join(",") + "]," + (_this.intercept.checked ? "1" : "0");
        if(_this.include_weights)
          command += "," + _this.weights.text({check_for_array: true});
        command += ");";

        var out_command = "[val]";

        _this.commands = _this.genCommand(out_command);
        _this.commands[0].dereference = true;
        if(errors.length && _this.outputMathBox) {
          _this.worksheet.save();
          _this.outputMathBox.clear();
          _this.setError(errors.join('<BR>'));
        } else {
          // Solve the equation, with special unit mode for the solver.  Result will be inserted in place of [val] in the next computation
          _this.commands.unshift({command: command, nomarkup: true }); 
          _this.dependent_vars = GetDependentVars(command);
          _this.evaluate();
          _this.needsEvaluation = false;
        }

      }
    };
  }
  _.evaluationFinished = function(result) {
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
  // Callback for focusable items notifying that this element has been changed
  _.changed = function(el) {
    for(var i = 0; i < this.xdata.length; i++)
      if(el === this.xdata[i]) this.xdata[i].touched = true;
    if(el === this.intercept)
      this.intercept.touched = true;
    if(el === this.ydata)
      this.ydata.touched = true;
    if(this.xdata[0].touched && this.ydata.touched && !this.ydata.empty())
      this.needsEvaluation = true;
  }
});