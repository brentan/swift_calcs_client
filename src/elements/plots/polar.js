var plot_polar = P(plot_parametric_holder, function(_, super_) {
  _.plot_type = 'plot_polar';
  _.helpText = "<<polar plot>>\nPlot the provided polar function which determines the radius length as a function of the angle from the x-axis.  Provide the polar functions to plot, as well as the independant variable to plot against.  For example, plot r=<[sin(t)]> for <[t]> from <[-180]> to <[180]>.\nHELP:23";

  _.innerHtml = function() {
    return super_.innerHtml.call(this).replace('YIELD','<div class="' + css_prefix + 'focusableItems" data-id="1">plot:&nbsp;' + focusableHTML('MathQuill',  'eqr') + '</div><div class="' + css_prefix + 'focusableItems" data-id="2">for&nbsp;' + focusableHTML('MathQuill',  'var') + '&nbsp;from&nbsp;' + focusableHTML('MathQuill',  'startval') + '&nbsp;to&nbsp;' + focusableHTML('MathQuill',  'endval') + '</div>');
  }
  _.postInsertHandler = function() {
    this.eqr = registerFocusable(MathQuill, this, 'eqr', { ghost: 'r(θ)', handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.var = registerFocusable(MathQuill, this, 'var', { ghost: "θ", default: 'theta', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.startval = registerFocusable(MathQuill, this, 'startval', { ghost: '0', default: '0', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.endval = registerFocusable(MathQuill, this, 'endval', { ghost: this.worksheet.settings.angle == 'rad' ? '2⋅π' : '360', default: '(2*pi)_rad', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});

    this.focusableItems = [[this.eqr], [this.var, this.startval, this.endval]];
    super_.postInsertHandler.call(this);
    var _this = this;
    this.leftJQ.append('<span class="fa fa-line-chart"></span>');
  }
  _.getUnitsCommands = function() {
    if(this.eqr.text().trim() == '') return [];
    var command1 = "latex(at(apply(" + this.var.text() + "->(evalf(mksa_base(" + this.eqr.text() + "))),[(" + this.endval.text() + ")*1.0000000016514245]),0))"; // Evaluate at the first t to find units...add something so that we dont get evaluation at 0
    var command2 = "latex(at(apply(" + this.var.text() + "->(evalf(mksa_base(" + this.eqr.text() + "))),[(" + this.endval.text() + ")*1.0000000016514245]),0))"; // Evaluate at the first t to find units...add something so that we dont get evaluation at 0
    return [{command: command1, nomarkup: true},{command: command2, nomarkup: true}];
  }
  _.createCommands = function() {
    if(this.eqr.text().trim() == '') return [];
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
    command3 += "([(" + this.eqr.text() + ")*cos(" + this.var.text() + "),(" + this.eqr.text() + ")*sin(" + this.var.text() + ")]," + this.var.text() + "=(" + this.startval.text() + ")..(" + this.endval.text() +"),x__limits=(" + x_min + ")..(" + x_max + "),y__limits=(" + y_min + ")..(" + y_max + "),tstep=10000)"; 
    this.dependent_vars = GetDependentVars(command3, [this.var.text()]);
    var command4 = "latex(at(apply(" + this.var.text() + "->(evalf(mksa_base(" + this.eqr.text() + "))),[(" + this.endval.text() + ")*1.0000000016514245]),0))"; // Evaluate at the first t to find units...add something so that we dont get evaluation at 0
    var command5 = "latex(at(apply(" + this.var.text() + "->(evalf(mksa_base(" + this.eqr.text() + "))),[(" + this.endval.text() + ")*1.0000000016514245]),0))"; // Evaluate at the first t to find units...add something so that we dont get evaluation at 0
    return [{command: command3, nomarkup: true },{command: command4, nomarkup: true},{command: command5, nomarkup: true}]
  }
});
