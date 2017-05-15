var include_worksheet = P(EditableBlock, function(_, super_) {
  // TODO: Default include
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
  _.loadOptions = function() {
    this.blur();
    window.showPopupOnTop();
    $('.popup_dialog .full').html("<div style='text-align:center;'><div class='title'>Where do you want to include from?</div><table width='100%'><tbody><tr><td width='50%'><h3>Your Worksheets</h3><a class='button mine' href='#' style='margin:1px 10px;color:white;'>Include Functions and Variables from Worksheets I created or Have Access To</a></td><td width='50%'><h3>Swift Calcs Libraries</h3><a class='button sc' href='#' style='margin:1px 10px;color:white;'>Load Functions and Variables from Databases Created and Curated by Swift Calcs</a></td></tr></tbody></table></div>");
    $('.popup_dialog .bottom_links').html('<button class="close grey">Cancel</button>');
    window.resizePopup(true);
    $('.popup_dialog a.mine').on('click',function(_this) { 
      return function(e) { window.loadFilePicker(function(h,v) { _this.setData(h,v); }); e.preventDefault(); }
    }(this));
    $('.popup_dialog a.sc').on('click',function(_this) { 
      return function(e) { window.loadFilePicker(function(h,v) { _this.setData(h,v); }, 'SwiftCalcs'); e.preventDefault(); }
    }(this));
  }
  _.toString = function() {
    return '';
  }
  _.setData = function(hash_string, var_list) {
    var stream = this.worksheet.trackingStream;
    if(!stream) this.worksheet.startUndoStream();
    include_block().setData(hash_string,var_list.join(";")).insertAfter(this).show().focus(0);
    this.worksheet.removeIncludeMessage();
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
    this.worksheet.removeIncludeMessage();
    return super_.postInsertHandler.call(this);
  }
  _.getLastResult = function(varname) {
    for(var j = 0; j < this.data.length; j++) {
      if(varname == this.data[j].name) return this.data[j].latex;
    }
    return false;
  }
  _.setData = function(hash_string, var_list_string) {
    if(hash_string.length) {
      this.hash_string = hash_string;
      this.var_list_string = var_list_string;
      this.all_vars = var_list_string.split(";");
      this.independent_vars = []
      window.ajaxRequest("/worksheets/variable_list",{hash_string: this.hash_string},function(_this) { return function(response) {
        _this.data_loaded = true;
        try {
          var vars = JSON.parse(response.variables);
        } catch(e) {
          _this.all_vars = [];
          _this.outputBox.expand();
          _this.outputBox.setError("Unable to decode stored variables.  The included worksheet variable listing may be corrupt.  Open the worksheet to reset the variable list.");
          return;
        }
        _this.data = vars
        var var_list = []
        for(var i = 0; i < _this.all_vars.length; i++) 
          var_list.push(window.SwiftCalcsLatexHelper.VarNameToHTML(_this.all_vars[i]));
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
      this.all_vars = [];
    return this;
  }
  _.genCommand = function() {
    this.commands = [];
    this.independent_vars = [];
    for(var i = 0; i < this.all_vars.length; i++) {
      for(var j = 0; j < this.data.length; j++) {
        if(this.all_vars[i] == this.data[j].name) {
          this.commands.push({command: this.data[j].name + ":=" + this.data[j].data.replace(/\\n/g," "), nomarkup: true});
          this.independent_vars.push(this.data[j].name + (this.data[j].latex.match(/^function/) ? '(' : ''));
        }
      }
    }
  }
  _.continueEvaluation = function(evaluation_id) {
    if($("div.base_layout").hasClass('hobby_tier')) {
      var other_include = false;
      var el = this;
      while(true) {
        if(el[L]) {
          el = el[L];
          while(el.ends[R]) el = el.ends[R];
        } else if(el.parent) el = el.parent;
        else break;
        if((el instanceof include_block) && (el.hash_string == this.hash_string)) {
          other_include = true;
          break;
        }
      }
      if(other_include) {
        this.outputBox.expand();
        this.outputBox.setError("You have already imported variables from this worksheet above.  Your subscription level limits you to one include per source per worksheet.  <a href='#' onclick='window.loadSubscriptionSettings(1);return false;' >Upgrade your account</a> to enable multiple source includes in a worksheet.");
        this.evaluateNext(evaluation_id);
        return;
      }
    }
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