
var mixture = P(Element, function(_, super_) {
  _.klass = ['material mixture'];
  _.lineNumber = true;
  _.hasChildren = true;
  _.evaluatable = true;
  _.data_type = 2;
  _.number_of_species = 0;
  _.last_name = "";
  _.special_footer = "Thermodynamic data from <a href='https://www.grc.nasa.gov/WWW/CEAWeb/ceaThermoBuild.htm' target='_blank'>NASA Glenn Research Center</a>";
  _.helpText = "<<<[VAR]> = mixture>>\n<<&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <[mass or moles]> of <[name]>>>\n<<&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <[mass or moles]> of <[name]>>>\nLoad the data for the specified mixture (specify components and moles/mass of each) into the specified variable.";

  _.innerHtml = function() {
    return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'var_name') + '<span class="equality">&#8801;</span>' + focusableHTML('CodeBlock', "mixture") + helpBlock() + '</div>'
     + '<div class="' + css_prefix + 'insert"></div><div class="another_link explain ' + css_prefix + 'hide_print" style="margin-left: 60px;"><a href="#" class="add_another">Add another substance</a>&nbsp;&nbsp;-&nbsp;&nbsp;' + this.special_footer + '</div>'
     + answerSpan();
  }

  _.postInsertHandler = function() {
    this.varStoreField = registerFocusable(MathQuill, this, 'var_name', { ghost: 'variable name', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.varStoreField.disableAutoUnit(true);
    this.focusableItems = [[this.varStoreField, registerFocusable(CodeBlock,this, 'mixture', { })], [-1]];
    super_.postInsertHandler.call(this);
    if(this.jQ) this.jQ.find('.another_link a.add_another').on('click', function(_this) { return function(e) {
      mixture_component().appendTo(_this).show(250).focus(L);
      e.preventDefault();
      e.stopPropagation();
    }; }(this));
    return this;
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
  _.toString = function() {
    return '{mixture}{{' + this.argumentList().join('}{') + '}}';
  }
  _.validateChild = function(child) {
    return (child instanceof mixture_component);
  }
  _.implicitType = function() { 
    return mixture_component();
  }
  _.focus = function(dir) {
    super_.focus.call(this, dir);
    if(dir == 0)
      this.ends[L].focus(L);
    return this;
  }
  _.enterPressed = function(_this) {
    return function(item) {
      _this.submissionHandler(_this)();
      if(_this.ends[L])
        _this.ends[L].focus(L);
      else
        mixture_component().appendTo(_this).show().focus(0);
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
    var species = []
    var children = this.children();
    var command = "";
    this.dependent_vars = [];
    for(var i = 0; i < children.length; i++) {
      if(children[i].data !== false) {
        var to_store = children[i].speciesData();
        species.push(to_store);
        command += to_store.quantity + "->" + to_store.data.full_name + ";";
        this.dependent_vars = this.dependent_vars.concat(GetDependentVars(to_store.quantity));
      }
    }
    var var_name = this.varStoreField.text().trim();
    this.independent_vars = [var_name, var_name + "_T__in", var_name + "_P__in"];
    this.commands = [{command: this.independent_vars.join(",") + "=" + command, setMaterial: {data_type: this.data_type, var_name: this.varStoreField.text().trim(), data: species, last_name: this.last_name} }];    
  }

  _.shouldBeEvaluated = function(evaluation_id) {
    var super_call = super_.shouldBeEvaluated.call(this, evaluation_id);
    if(this.commands.length && (this.commands[0].setMaterial.data.length == 0)) return false; // Test for valid species in mixture
    return super_call;
  }
  _.evaluationFinished = function(result) {
    this.last_name = this.varStoreField.text().trim();
    if(result[0].success) {
      this.outputBox.clearState().collapse(true);
      var children = this.children();
      this.number_of_species = children.length;
      for(var i = 0; i < children.length; i++)
        children[i].needsEvaluation = false;
    } else {
      this.outputBox.setError(result[0].returned).expand(true);
    }
    return true;
  }
  // Hijack continueEvaluation.  We have children, but we zip them up into our own commands, so we want to ignore the children at this point
  _.continueEvaluation = function(evaluation_id) {
    this.genCommand(); // Make sure we have most up to date children info
    if(this.jQ) this.insertJQ.find('i.fa-spinner').remove();
    if(this.shouldBeEvaluated(evaluation_id)) {
      this.addSpinner(evaluation_id);
      if(this.commands.length === 0) // Nothing to evaluate...
        this.evaluateNext(evaluation_id)
      else if(this.altered(evaluation_id)) {
        // We were altered, so lets evaluate
        giac.execute(evaluation_id, this.commands, this, 'evaluationFinished');
      } else {
        // Not altered, but we are scoped, so we need to save scope
        giac.skipExecute(evaluation_id, this, 'scopeSaved');
      } 
    } else 
      this.evaluateNext(evaluation_id)
  }
  _.changed = function(el) {
    this.needsEvaluation = this.varStoreField.empty() ? false : true;
  }
  _.getUnarchiveList = function() {
    if(this.unarchive_list_set) return this.unarchive_list;
    return this.previousUnarchivedList();
  }
});


var mixture_component = P(material_holder, function(_, super_) {
  _.data_type = 2;
  _.class_name = "mixture_component";
  _.blank_message = "substance"
  _.min_search_length = 2;

  _.innerHtml = function() {
    return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'var_name') + '&nbsp;of&nbsp;<span class="material_name">No ' + this.blank_message + ' Specified</span><span class="' + css_prefix + 'hide_print explain">&nbsp;&nbsp;&nbsp;<a class="change" style="cursor: pointer;">Change</a></span></div>';
  }

  _.setFocusableItems = function() {
    this.varStoreField = registerFocusable(MathQuill, this, 'var_name', { ghost: 'mass or moles', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.focusableItems = [[this.varStoreField]];
  }

  _.convertData = function(data) {
    if(super_.convertData.call(this, data)) {
      // Data is raw from server, so lets transform it
      this.data.data.full_name = this.full_name;
      super_.convertData.call(this, this.data.data);
    }
  }

  _.speciesData = function() {
    return {quantity: this.varStoreField.text().trim(), data: this.data};
  }

  _.validateParent = function(parent) {
    return (parent instanceof mixture);
  }

  // SubmissionHandler should force parent to be evaluated
  _.submissionHandler = function(_this) {
    return function(mathField) {
      if(_this.ignore_blur_eval) return;
      if(_this.needsEvaluation) {   
        _this.parent.genCommand();
        _this.parent.needsEvaluation = true;
        _this.parent.evaluate(true);
        _this.needsEvaluation = false;
      }
    };
  }
  _.enterPressed = function(_this) {
    return function(item) {
      _this.submissionHandler(_this)();
      if(_this[R]) _this[R].focus(L);
      else if(_this.parent[R] && (_this.parent[R] instanceof math) && _this.parent[R].empty())
        _this.parent[R].focus(L);
      else
        math().setImplicit().insertAfter(_this.parent).show().focus(0);
    };
  }
  // Override: since we dont actually evaluate inside we should return unarchive list of the parent, and evaluate should eval parent
  _.evaluate = function(force) {
    if(this.parent) this.parent.evaluate(force);
  }
  _.getUnarchiveList = function() {
    return this.parent ? this.parent.getUnarchiveList() : [];
  }
  _.changed = function() {
    this.needsEvaluation = true;
  }
  _.PrependBlankItem = function(el) {
    return false;
  }

});

// Update search box to show allow 2 letter searches
// Expand to mixtures
