var radio = P(select, function(_, super_) {
  _.klass = ['radio','a_input_control'];
  _.helpText = "<<radio>>\nThe radio menu allows you to set the value of a variable based on the selected option in a list of items.";

  _.innerHtml = function() {
    return '<table border=0><tbody><tr><td style="vertical-align:top;"><div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'var_store') + '<span class="equality">&#8801;</span></div></td><td style="vertical-align:top;"><div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('Radio', 'value') + '</div></td><td style="vertical-align:top;"><div class="' + css_prefix + 'focusableItems" data-id="0"><span class="gear"><i class="fa fa-wrench"></i></span>' + (this.worksheet.allow_interaction() ? helpBlock() : '') + '</div></td></tr></tbody></table>' + answerSpan();
  }
  _.postInsertHandler = function() {
    this.varStoreField = registerFocusable(MathQuill, this, 'var_store', { ghost: 'ans', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.parsed_list = [{name:'Click the wrench to the right to configure',latex:'0',val:'0'}];
    this.varStoreField.variableEntryField(true);
    this.commandElement = registerFocusable(Radio,this, 'value', {options:{'0':'Click the wrench to the right to configure'} });
    this.focusableItems = [[this.varStoreField, this.commandElement]];
    this.touched = false;
    this.needsEvaluation = false;
    super_.postInsertHandler.call(this, true);
    if(!this.worksheet.allow_interaction()) {
      this.jQ.find('span.gear').hide();
      this.jQ.addClass(css_prefix + 'minimal_interaction');
      this.varStoreField.setStaticMode(true);
    } else this.jQ.find('span.gear').on('click', function(_this) {
      return function(e) {
        _this.setOptions();
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
    }(this));
    return this;
  }
});