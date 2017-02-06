var checkbox = P(a_input_control, function(_, super_) {
  _.klass = ['checkbox','a_input_control'];
  _.savedProperties = ['options'];
  _.options = JSON.stringify({name:'Click the wrench to the right to configure',checked_latex:'1',checked_val:'1',unchecked_latex:'0',unchecked_val:'0'}).replace(/,/g,"__COMMA__");
  _.helpText = "<<checkbox>>\nThe checkbox allows you to set the value of a variable to one of two values depending on whether a checkbox is checked.";

  _.innerHtml = function() {
    return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'var_store') + '<span class="equality">&#8801;</span>' + focusableHTML('CheckBox', 'value') + "<span class='gear'><i class='fa fa-wrench'></i></span>" + (this.worksheet.allow_interaction() ? helpBlock() : '') + "</div>" + answerSpan();;
  }
  _.postInsertHandler = function() {
    this.varStoreField = registerFocusable(MathQuill, this, 'var_store', { ghost: 'ans', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.parsed_list = {name:'Click the wrench to the right to configure',checked_latex:'1',checked_val:'1',unchecked_latex:'0',unchecked_val:'0'};
    this.varStoreField.variableEntryField(true);
    this.commandElement = registerFocusable(CheckBox,this, 'value', {message: this.parsed_list.name });
    this.focusableItems = [[this.varStoreField, this.commandElement]];
    this.touched = false;
    this.needsEvaluation = false;
    super_.postInsertHandler.call(this);
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
  _.parseSavedProperties = function(args) {
    super_.parseSavedProperties.call(this, args);
    this.updateCheckbox();
    return this;
  }
  _.updateCheckbox = function() {
    var options = JSON.parse(this.options.replace(/__COMMA__/g,","));
    this.parsed_list = options;
    this.commandElement.message = options.name;
    this.commandElement.refreshHTML();
    this.commandElement.updateCheckbox();
    this.needsEvaluation = true;
    this.submissionHandler(this)(this.commandElement);
  }
  _.submissionHandler = function(_this) {
    return function(mathField) {
      if(_this.needsEvaluation && _this.varStoreField.text().trim().length) {
        _this.commands = [{command: _this.varStoreField.text() + " := " + (_this.commandElement.checked ? _this.parsed_list.checked_val : _this.parsed_list.unchecked_val) }];  
        _this.independent_vars = [_this.varStoreField.text().trim()];
        _this.dependent_vars = GetDependentVars(_this.commandElement.checked ? _this.parsed_list.checked_val : _this.parsed_list.unchecked_val);
        _this.evaluate();
        _this.needsEvaluation = false;
      }
    };
  }
  _.setOptions = function() {
    window.showPopupOnTop();
    var _this = this;
    var options = this.parsed_list;
    var el = $('.popup_dialog .full');
    el.html('<div class="title">Adjust Options</div><div>Message to display:<BR><input type="text"><BR><BR>Value if checked:<BR><span class="mathc"></span><BR>Value if unchecked:<BR><span class="mathu"></span><BR>');
    el.find('input').val(options.name == "Click the wrench to the right to configure" ? "" : options.name);
    var mathc = window.standaloneMathquill(el.find('span.mathc').eq(0));
    var mathu = window.standaloneMathquill(el.find('span.mathu').eq(0));
    mathc.paste(options.checked_latex);
    mathu.paste(options.unchecked_latex);
    var links = $('.popup_dialog .bottom_links').html('');
    $('.popup_dialog .full').append("<div class='explain'>Enter the options you wish to show above.  The message will be displayed to the user next to the checkbox, and the value stored in the variable is chosen based on whether the box is checked or not.</div>");
    window.resizePopup();
    $('<button class="grey">Close</button>').on('click', function(e) {
      $('.standalone_textarea').remove();
      window.hidePopupOnTop();
    }).prependTo(links);
    $('<button class="ok">Ok</button>').on('click', function(e) {
      var options = {
        name: el.find('input').val(),
        checked_val: mathc.text(),
        checked_latex: mathc.latex(),
        unchecked_val: mathu.text(),
        unchecked_latex: mathu.latex()
      }
      _this.options = JSON.stringify(options).replace(/,/g,"__COMMA__");
      $('.standalone_textarea').remove();
      window.hidePopupOnTop();
      _this.updateCheckbox();
      _this.worksheet.save();
    }).prependTo(links);
  }
});
