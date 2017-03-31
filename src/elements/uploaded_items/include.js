var include_worksheet = P(EditableBlock, function(_, super_) {
  _.klass = ['include'];
  _.needsEvaluation = false; 
  _.evaluatable = false;
  _.lineNumber = true;
  _.helpText = "<<include>> variables from worksheet\nLoad in variables and functions defined in another worksheet to which you have access.\nHELP:39";

  _.innerHtml = function() {
    return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', "include") + '<span class="material_name">No Worksheet Specified</span><span class="' + css_prefix + 'hide_print explain">&nbsp;&nbsp;&nbsp;<a class="change" style="cursor: pointer;">Change</a></span>' + helpBlock() + '</div>';
  }
  _.postInsertHandler = function() {
    this.codeBlock = registerFocusable(CodeBlock, this, 'include', { });
    this.focusableItems = [[this.codeBlock]];
    super_.postInsertHandler.call(this);
    this.jQ.find('a.change').on('click', function(_this) { return function(e) {
      _this.loadOptions();
      e.preventDefault();
      e.stopPropagation();
    } }(this));
    if(this.worksheet.loaded)
      this.loadOptions();
    return this;
  }
  _.loadOptions = function(parent_id) {
    this.blur();
    window.loadFilePicker(function(_this) { return function(h,v) { _this.setData(h,v); } }(this), parent_id);
  }
  _.toString = function() {
    return '';
  }
  _.setData = function(hash_string, var_list) {
    var stream = this.worksheet.trackingStream;
    if(!stream) this.worksheet.startUndoStream();
    include_block().setData(hash_string,var_list.join(";")).insertAfter(this).show().focus(0);
    this.remove(0);
    if(!stream) this.worksheet.endUndoStream();
    this.worksheet.save();
  }
});
var include_block = P(EditableBlock, function(_, super_) {
  _.klass = ['include']; 
  _.evaluatable = true;
  _.lineNumber = true;
  _.var_list_string = "";
  _.hash_string = "";
  _.savedProperties = ['hash_string','var_list_string'];
  _.helpText = "<<include>> variables from worksheet\nLoad in variables and functions defined in another worksheet to which you have access.\nHELP:39";

  _.innerHtml = function() {
    return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', "include") + '<span class="material_name">Loading Data...</span>' + helpBlock() + '</div>' + answerSpan();
  }
  _.postInsertHandler = function() {
    this.codeBlock = registerFocusable(CodeBlock, this, 'include', { });
    this.focusableItems = [[this.codeBlock]];
    return super_.postInsertHandler.call(this);
  }
  _.setData = function(hash_string, var_list_string) {
    if(hash_string.length) {
      this.hash_string = hash_string;
      this.var_list_string = var_list_string;
      this.independent_vars = var_list_string.split(";");
      window.ajaxRequest("/worksheets/variable_list",{hash_string: this.hash_string},function(_this) { return function(response) {
        _this.data_loaded = true;
        try {
          var vars = JSON.parse(response.variables);
        } catch(e) {
          _this.independent_vars = [];
          _this.outputBox.expand();
          _this.outputBox.setError("Unable to decode stored variables.  The included worksheet variable listing may be corrupt.  Open the worksheet to reset the variable list.");
          return;
        }
        _this.data = vars
        var var_list = []
        for(var i = 0; i < _this.independent_vars.length; i++) 
          var_list.push(window.SwiftCalcsLatexHelper.VarNameToHTML(_this.independent_vars[i]));
        _this.jQ.find('.material_name').html(var_list.join(", ") + " from ");
        $("<a href='#' class='worksheet_link'>" + response.name + "&nbsp;<i class='fa fa-external-link-square'></i></a>").on('click', function(e) {
          window.open('/worksheets/' + _this.hash_string, "_blank");
        }).appendTo(_this.jQ.find('.material_name'));
        $("<a href='#' class='refresh'>refresh</a>").on('click', function(e) {
          _this.setData(_this.hash_string, _this.var_list_string);
          _this.jQ.find('.material_name').html("Loading Data...");
        }).appendTo(_this.jQ.find('.material_name'));
        _this.genCommand();
        _this.evaluate(true);
      } }(this),function(_this) { return function() {
        _this.data_loaded = true;
        _this.outputBox.expand();
        _this.outputBox.setError('An Error occured while loading the variable data from the server.  Ensure you have read-level access to the worksheet you are attempting to include.');
      } }(this));
    } else
      this.independent_vars = [];
    return this;
  }
  _.genCommand = function() {
    this.commands = [];
    for(var i = 0; i < this.independent_vars.length; i++) {
      for(var j = 0; j < this.data.length; j++) {
        if(this.independent_vars[i] == this.data[j].name)
          this.commands.push({command: this.data[j].name + ":=" + this.data[j].data, nomarkup: true});
      }
    }
  }
  _.continueEvaluation = function(evaluation_id) {
    if(this.data_loaded === false) 
      return window.setTimeout(function(_this) { return function() { _this.continueEvaluation(evaluation_id); } }(this), 250); // Wait for data to load!
    super_.continueEvaluation.call(this, evaluation_id);
  }
  _.evaluationFinished = function(result) {
    var errors = [];
    for(var i = 0; i < result.length; i++) 
      if(!result[i].success) errors.push(result[i].returned);
    if(errors.length == 0)
      this.outputBox.clearState().collapse();
    else {
      this.outputBox.expand();
      this.outputBox.setError(errors.join("<BR>"));
    }
    return true;
  }
  _.empty = function() {
    return false;
  }
  _.toString = function() {
    return '{include_block}{{' + this.argumentList().join('}{') + '}}';
  }
  _.parseSavedProperties = function(args) {
    super_.parseSavedProperties.call(this, args);
    this.data_loaded = false;
    this.setData(this.hash_string, this.var_list_string);
    return this;
  }
});