/*
Holder for all material types.  Should never be directly created, simply a parent class for all items in materials folder
*/
var material_selector = P(Element, function(_, super_) {
  _.klass = ['material','material_selector','hide_print'];
  _.needsEvaluation = false; 
  _.evaluatable = false;
  _.fullEvaluation = false; 
  _.scoped = false;
  _.lineNumber = true;
  _.loading = true;
  _.open_box = false;

  _.innerHtml = function() {
    return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'var_name') + '<span class="equality">&#8801;</span>' + focusableHTML('CodeBlock', this.name) + '<span class="explain"></span><span class="select_span">' + focusableHTML('SelectBox',  'options') + '</span><span class="fa fa-spinner fa-pulse fa-fw" style="display:none;"></span>' + helpBlock() + "</div>";
  }
  _.postInsertHandler = function() {
    this.varStoreField = registerFocusable(MathQuill, this, 'var_name', { ghost: 'variable name', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.codeBlock = registerFocusable(CodeBlock, this, this.name, { });
    this.select_box = registerFocusable(SelectBox, this, 'options', { blank_message: this.blank_message, options: { } });
    this.focusableItems = [[this.varStoreField, this.codeBlock]];
    super_.postInsertHandler.call(this);
    this.loadOptions();
    return this;
  }
  _.enterPressed = function(_this) {
    return function(mathField) {
      if(!_this.loading) _this.select_box.focus();
      else mathField.blur();
    };
  }
  _.storeAsVariable = function(var_name) {
    if(var_name) 
      this.varStoreField.paste(var_name.replace(/_(.*)/,"_{$1}"));
    else
      this.varStoreField.clear().focus(1).moveToLeftEnd().write("latex{ans_{" + this.uniqueAnsId() + "}}").closePopup().keystroke('Shift-Home', { preventDefault: function() { } });
  }
  _.submissionHandler = function(_this) {
    return function(mathField) {
      if(mathField === _this.select_box) {
        var val = _this.select_box.text();
        if(val.trim() === '') return;
        val = val * 1;
        _this.jQ.find('.explain').append("<span>" + _this.select_box.getSelectedText() + "<i class='fa fa-fw fa-arrow-right'></i></span>");
        if(val > 0) {
          _this.loadOptions(val);
        } else {
          // Item has been selected!
          _this.blur();
          _this.loading = true;
          _this.focusableItems = [[_this.varStoreField, _this.codeBlock]];
          if(_this.jQ) {
            _this.jQ.find(".select_span").hide();
            _this.jQ.find(".fa-spinner").show();
          }
          window.silentRequest('/get_material', { id: (-1*val) }, function(_this) {
            return function(response) {
              var mat = _this.selected_class().insertAfter(_this);
              mat.setData(response.name, response.full_name, response.data, _this.data_type);
              mat.show(0).focus(0);
              mat.varStoreField.write(_this.varStoreField.latex());
              _this.remove(0);
            }
          }(_this), function(_this) {
            return function () {
              _this.loading = false;
              _this.focusableItems = [[_this.varStoreField, _this.codeBlock, _this.select_box]];
              if(_this.jQ) {
                _this.jQ.find(".select_span").show();
                _this.jQ.find(".fa-spinner").hide();
              }
            }
          }(_this));
        }
      }
    };
  }
  _.loadOptions = function(parent_id) {
    this.blur();
    this.loading = true;
    this.focusableItems = [[this.varStoreField, this.codeBlock]];
    if(this.jQ) {
      this.jQ.find(".select_span").hide();
      this.jQ.find(".fa-spinner").show();
    }
    window.silentRequest('/populate_materials', { data_type: this.data_type, parent_id: parent_id }, function(_this) { return function(response) { 
      _this.select_box.fillBox(response.data);
      _this.loading = false;
      _this.focusableItems = [[_this.varStoreField, _this.codeBlock, _this.select_box]];
      if(_this.jQ) {
        _this.jQ.find(".select_span").show();
        _this.jQ.find(".fa-spinner").hide();
      }
      _this.focus();
      _this.select_box.focus()
      if(_this.open_box) _this.select_box.open();
      _this.open_box = true;
    } }(this), function(_this) { return function(response) {
      _this.loading = false;
      _this.focusableItems = [[_this.varStoreField, _this.codeBlock, _this.select_box]];
      if(_this.jQ) {
        _this.jQ.find(".select_span").show();
        _this.jQ.find(".fa-spinner").hide();
      }
    } }(this));
  }

  _.toString = function() {
    return '';
  }
});


var material_holder = P(Element, function(_, super_) {
  // BRENTAN: Need to deal with scenario where user removes this.  If that happens, we need to un-set the object.
  _.klass = ['material','material_holder'];
  _.needsEvaluation = false; 
  _.evaluatable = true;
  _.fullEvaluation = true; 
  _.scoped = true;
  _.lineNumber = true;
  _.data_type = false;
  _.data = false;
  _.string_data = false;
  _.name = false;
  _.full_name = false;
  _.savedProperties = ['string_data', 'name', 'data_type', 'full_name'];
  _.last_name = "";

  _.innerHtml = function() {
    return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'var_name') + '<span class="equality">&#8801;</span>' + focusableHTML('CodeBlock', this.name) + '<span class="material_name"></span>' + helpBlock() + '</div>' + answerSpan();
  }
  _.postInsertHandler = function() {
    this.varStoreField = registerFocusable(MathQuill, this, 'var_name', { ghost: 'variable name', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.codeBlock = registerFocusable(CodeBlock, this, this.name, { });
    this.focusableItems = [[this.varStoreField, this.codeBlock]];
    super_.postInsertHandler.call(this);
    if(this.string_data !== false) {
      this.setData(this.name, this.full_name, this.string_data, this.data_type);
      this.genCommand();
      this.needsEvaluation = this.varStoreField.empty() ? false : true;
    }
    return this;
  }
  _.setData = function(name, full_name, data, data_type) {
    this.jQ.find('.material_name').html(full_name);
    this.full_name = full_name;
    this.name = name;
    this.data_type = data_type;
    this.convertData(data);
  }
  _.enterPressed = function(_this) {
    return function(item) {
      _this.submissionHandler(_this)();
      if(_this[R] && (_this[R] instanceof math) && _this[R].empty())
        _this[R].focus(L);
      else
        math().setImplicit().insertAfter(_this).show().focus(0);
    };
  }
  _.submissionHandler = function(_this) {
    return function(mathField) {
      if(_this.needsEvaluation) {     
        _this.genCommand();
        _this.evaluate();
        _this.needsEvaluation = false;
      }
    };
  }
  _.genCommand = function() {
    this.commands = [{command: "1", setMaterial: {data_type: this.data_type, var_name: this.varStoreField.text().trim(), data: this.data, last_name: this.last_name} }];    
  }
  _.shouldBeEvaluated = function(evaluation_id) {
    if(super_.shouldBeEvaluated.call(this, evaluation_id))
      return (this.varStoreField.text() != this.last_name)
    return false;
  }
  _.evaluationFinished = function(result) {
    if(result[0].success) {
      this.outputBox.clearState().collapse(true);
      this.last_name = this.varStoreField.text();
    } else {
      this.outputBox.setError(result[0].returned).expand(true);
    }
    return true;
  }

  _.convertData = function(data) {
    if(typeof data === "string") {
      this.data = JSON.parse(data.replace(/\|/g,','));
      return false;
    } else {
      this.data = data;
      this.string_data = JSON.stringify(data).replace(/\,/g,'|');
      return true;
    }
  }
  _.toString = function() {
    return '{' + this.class_name + '}{{' + this.argumentList().join('}{') + '}}';
  }
  _.changed = function(el) {
    if(this.string_data !== false) this.needsEvaluation = this.varStoreField.empty() ? false : true;
  }
});