var plot_parametric = P(subplot, function(_, super_) {
  _.plot_type = 'plot_parametric';
  _.show_unit = false;
  _.c3_type = 'scatter';//'line';
  _.line_weight=0;
  _.x_provided = true;
  _.helpText = "<<parametric plot>>\nPlot two functions that determine the x and y coordinates, based on an independant variable.  Provide the x and y functions to plot, as well as the independant variable to plot against.  For example, plot x=<[cos(t)]> and y=<[sin(t)]> for <[t]> from <[-180]> to <[180]> with step size of <[1]>.\nHELP:23";

  _.innerHtml = function() {
    return super_.innerHtml.call(this).replace('YIELD','<div class="' + css_prefix + 'focusableItems" data-id="1">x:&nbsp;' + focusableHTML('MathQuill',  'eqx') + '</div><div class="' + css_prefix + 'focusableItems" data-id="2">y:&nbsp;' + focusableHTML('MathQuill',  'eqy') + '<div class="' + css_prefix + 'focusableItems" data-id="3">for&nbsp;' + focusableHTML('MathQuill',  'var') + '&nbsp;from&nbsp;' + focusableHTML('MathQuill',  'startval') + '&nbsp;to&nbsp;' + focusableHTML('MathQuill',  'endval') + '</div>');
  }
  _.postInsertHandler = function() {
    this.eqx = registerFocusable(MathQuill, this, 'eqx', { ghost: 'f(t)', handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.eqy = registerFocusable(MathQuill, this, 'eqy', { ghost: 'g(t)', handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.var = registerFocusable(MathQuill, this, 'var', { ghost: 't', default: 't', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.startval = registerFocusable(MathQuill, this, 'startval', { ghost: 'start', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.endval = registerFocusable(MathQuill, this, 'endval', { ghost: 'end', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});

    this.focusableItems = [[this.eqx], [this.eqy], [this.var, this.startval, this.endval]];
    super_.postInsertHandler.call(this);
    var _this = this;
    this.leftJQ.append('<span class="fa fa-line-chart"></span>');
  }
  _.getUnitsCommands = function() {
    if(this.eqx.text().trim() == '') return [];
    if(this.eqy.text().trim() == '') return [];
    var command1 = "latex(at(apply(" + this.var.text() + "->(evalf(mksa_base(" + this.eqx.text() + "))),[(" + this.endval.text() + ")*1.0000000016514245]),0))"; // Evaluate at the first t to find units...add something so that we dont get evaluation at 0
    var command2 = "latex(at(apply(" + this.var.text() + "->(evalf(mksa_base(" + this.eqy.text() + "))),[(" + this.endval.text() + ")*1.0000000016514245]),0))"; // Evaluate at the first t to find units...add something so that we dont get evaluation at 0
    return [{command: command1, nomarkup: true},{command: command2, nomarkup: true}];
  }
  _.submissionHandler = function(_this) {
    return function(mathField) {
      _this.ignored_vars = GetIgnoredVars([_this.var.text()]);
      if(_this.needsEvaluation) {
        _this.commands = _this.createCommands();
        _this.altered_content = _this.newCommands();
        _this.parent.evaluate(true);
      }
    };
  }
  _.createCommands = function() {
    if(this.eqx.text().trim() == '') return [];
    if(this.eqy.text().trim() == '') return [];
    if(this.y_axis == 'y') {
      var y_min = this.parent.y_min === false ? false : ((this.parent.y_min + this.parent.y_unit_offset) * this.parent.y_unit_conversion);
      var y_max = this.parent.y_max === false ? false : ((this.parent.y_max + this.parent.y_unit_offset) * this.parent.y_unit_conversion);
    } else {
      var y_min = this.parent.y2_min === false ? false : ((this.parent.y2_min + this.parent.y2_unit_offset) * this.parent.y2_unit_conversion);
      var y_max = this.parent.y2_max === false ? false : ((this.parent.y2_max + this.parent.y2_unit_offset) * this.parent.y2_unit_conversion);
    }
    var x_min = this.parent.x_min === false ? false : ((this.parent.x_min + this.parent.x_unit_offset) * this.parent.x_unit_conversion);
    var x_max = this.parent.x_max === false ? false : ((this.parent.x_max + this.parent.x_unit_offset) * this.parent.x_unit_conversion);
    if(y_min === false) y_min = 1791.583; // Hack...basically a 'null' value to send along
    if(y_max === false) y_max = 1791.583;
    if(x_min === false) x_min = 1791.583;
    if(x_max === false) x_max = 1791.583;
    var command3 = "plotparam";
    if((this.parent.y_log && (this.y_axis == 'y')) || (this.parent.y2_log && (this.y_axis == 'y2'))) {
      if(this.parent.x_log) command3 = 'plotparamloglog';
      else command3 = 'plotparamylog';
    } else if(this.parent.x_log) command3 = 'plotparamlog';
    command3 += "([" + this.eqx.text() + "," + this.eqy.text() + "]," + this.var.text() + "=(" + this.startval.text() + ")..(" + this.endval.text() +"),x__limits=(" + x_min + ")..(" + x_max + "),y__limits=(" + y_min + ")..(" + y_max + "),tstep=10000)"; 
    this.dependent_vars = GetDependentVars(command3, [this.var.text()]);
    var command4 = "latex(at(apply(" + this.var.text() + "->(evalf(mksa_base(" + this.eqx.text() + "))),[(" + this.endval.text() + ")*1.0000000016514245]),0))"; // Evaluate at the first t to find units...add something so that we dont get evaluation at 0
    var command5 = "latex(at(apply(" + this.var.text() + "->(evalf(mksa_base(" + this.eqy.text() + "))),[(" + this.endval.text() + ")*1.0000000016514245]),0))"; // Evaluate at the first t to find units...add something so that we dont get evaluation at 0
    return [{command: command3, nomarkup: true },{command: command4, nomarkup: true},{command: command5, nomarkup: true}]
  }
  _.evaluationFinished = function(result) {
    if(this.parent.getUnits) {
      if(result[0].success) this.x_unit = result[0].returned;
      if(result[1].success) this.y_unit = result[1].returned;
    } else {
      if(result[0].success && result[1].success && result[2].success) {
        try {
          var output = result[0].returned.replace(/[^0-9\.\-,e\[\]]/g,''); // Remove non-numeric characters
          //output = output.replace(/,,/g,',null,').replace(/\[,/g,'[null,').replace(/,\]/g,',null]');
          if(!output.match(/[0-9]/)) 
            this.outputBox.setError('No numeric results were returned and nothing will be plotted').expand();
          else {
            output = eval(output);
            this.xs = [];
            this.ys = [];
            for(var i = 0; i < output.length; i++) {
              // t values are output[i][0]...can we do something with this?
              this.xs.push(output[i][1]);
              this.ys.push(output[i][2]);
            }
            if(((this.y_axis == 'y') && this.parent.y_log) || ((this.y_axis == 'y2') && this.parent.y2_log)) {
              for(var j=0; j<=this.ys.length; j++) {
                if(this.ys[j] <= 0) this.ys[j] = NaN;
              }
            }
            if(this.parent.x_log) {
              for(var j=0; j<=this.xs.length; j++) {
                if(this.xs[j] <= 0) {
                  this.xs.splice(j,1);
                  this.ys.splice(j,1);
                  j = j - 1;
                }
              }
            }
            this.suggest_y_min = (this.y_axis == 'y' && this.parent.y_min === false) || (this.y_axis == 'y2' && this.parent.y2_min === false) ? Math.min.apply(Math, this.ys) : undefined;
            this.suggest_y_max = (this.y_axis == 'y' && this.parent.y_max === false) || (this.y_axis == 'y2' && this.parent.y2_max === false) ? Math.max.apply(Math, this.ys) : undefined;
            this.ys.unshift('data_' + this.id);
            this.xs.unshift('x_' + this.id);
            this.plot_me = true;
            this.outputBox.clearState().collapse();
          }
        } catch(e) {
          this.outputBox.setError('Error evaluating function: Non-numeric results were returned and could not be plotted').expand();
        }
      } else {
        var err = result[0].success ? (result[1].success ? result[2].returned : result[1].returned) : result[0].returned;
        if(err.match(/Incompatible units/)) {
          this.outputBox.setError('Incompatible units.  Please check your equations to ensure unit balance, and if the independant variable has units, please include the unit in the start, end, and step definitions.').expand();
        } else
          this.outputBox.setError(err).expand();
      }
    }
    return true;
  }
});
