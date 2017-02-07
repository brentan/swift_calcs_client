var a_input_control = P(Element, function(_, super_) {
  _.needsEvaluation = false; 
  _.evaluatable = true;
  _.interaction_level = INTERACTION_LEVELS.FORM_ELEMENTS;
  _.lineNumber = true;

  _.enterPressed = function(_this) {
    return function(item) {
      _this.submissionHandler(_this)();
      if(_this[R] && (_this[R] instanceof math) && _this[R].empty())
        _this[R].focus(L);
      else
        math().setImplicit().insertAfter(_this).show().focus(0);
    };
  }
  _.evaluationFinished = function(result) {
    this.last_result = result;
    if(!result[0].success) {
      this.outputBox.setError(result[0].returned);
      this.outputBox.expand();
    } else
      this.outputBox.collapse();
    return true;
  }
  _.toString = function() {
    return '{' + this.klass[0] + '}{{' + this.argumentList().join('}{') + '}}';
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
  // Callback for math elements notifying that this element has been changed
  _.changed = function(el) {
    if(el == this.varStoreField) this.needsEvaluation = true;
    if(el == this.commandElement) {
      this.needsEvaluation = true;
      this.submissionHandler(this)();
    }
  }
});