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
  _.open_box = false;
  _.special_footer = '';

  _.innerHtml = function() {
    return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'var_name') + '<span class="equality">&#8801;</span>' + focusableHTML('CodeBlock', this.name) + '<span class="explain"></span><span class="select_span"><a class="button" style="display:inline;padding:3px 5px;font-size:11px;">Choose Material</a></span>' + helpBlock() + "</div>";
  }
  _.postInsertHandler = function() {
    this.varStoreField = registerFocusable(MathQuill, this, 'var_name', { ghost: 'variable name', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.codeBlock = registerFocusable(CodeBlock, this, this.name, { });
    this.focusableItems = [[this.varStoreField, this.codeBlock]];
    super_.postInsertHandler.call(this);
    this.jQ.find('a.button').on('click', function(_this) { return function() { _this.loadOptions(); }; }(this));
    this.loadOptions();
    return this;
  }
  _.enterPressed = function(_this) {
    return function(mathField) {
      mathField.blur();
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
    window.showPopupOnTop();
    $('.popup_dialog .full').html("<div class='select_material'><div class='input_box'><input type='text'></div><div class='title'>" + this.blank_message + "</div><div class='folder'></div><div class='list_content'></div></div>");
    var $list_content_td = $('.popup_dialog .full div.list_content');
    var $folder = $('.popup_dialog .folder');
    var $input = $('.popup_dialog .full').find('input');
    $input.on("keydown", function(evt) {
      var which = evt.which || evt.keyCode;
      switch(which) {
        case 10:
        case 13:
        case 39:
          //Enter or Right
          $list_content_td.find('.selected').first().click();
        break;
        case 38:
          //Up
          var sel = $list_content_td.find('.selected').first();
          if(sel.length == 0) {
            sel = $list_content_td.find('div.list').first();
            sel.addClass('selected');
          }
          if(sel.prev('div.list').length) {
            sel.prev('div.list').addClass('selected');
            sel.removeClass('selected');
          }
        break;
        case 40:
          //Down
          var sel = $list_content_td.find('.selected').first();
          if(sel.next('div.list').length) {
            sel.next('div.list').addClass('selected');
            sel.removeClass('selected');
          }
          if(sel.length == 0) {
            sel = $list_content_td.find('div.list').first();
            sel.addClass('selected');
          }
      }
      evt.preventDefault();
    });
    var loading = function() {
      $('.popup_dialog .bottom_links').find('button.select_material').hide();
      $list_content_td.html("<div style='text-align:center;'><h1>Loading...</h1><BR><BR><i class='fa fa-spinner fa-pulse'></i></div>");
    }
    loading();
    window.resizePopup();
    var _this = this;
    var item_list = {};
    var select_material = function() {
      var val = $list_content_td.find('.selected').first();
      if(val.length == 0) 
        return showNotice("Please select a material", "red");
      loading();
      window.silentRequest('/get_material', { id: val.attr('data-id') }, function(response) {
          $('.popup_dialog .full').html("");
          window.hidePopupOnTop();
          var mat = _this.selected_class().insertAfter(_this);
          mat.setData(response.name, response.full_name, response.data, _this.data_type);
          mat.show(0).focus(0);
          mat.varStoreField.write(_this.varStoreField.latex());
          _this.remove(0);
        }, function () {
          $('.popup_dialog .full').html("");
          window.hidePopupOnTop();
        });
    }
    var populate = function(response) { 
      if(response.success) {
        $list_content_td.html("");
        $folder.html(response.folder);
        if(response.parent) {
          $list_content_td.append("<div class='list group' data-id='" + response.parent_id + "'><i class='fa fa-arrow-left'></i>Back</div>");
        }
        $.each(response.groups, function(k,v) {
          $list_content_td.append("<div class='list group' data-id='" + v.id + "'><i class='fa fa-arrow-right'></i>" + v.name + "</div>");
        });
        $.each(response.items, function(k,v) {
          $list_content_td.append("<div class='list item' data-id='" + v.id + "'>" + v.name + "</div>");
          item_list[v.id + ""] = v.data;
        });
        $('.popup_dialog .bottom_links').html('<button class="select_material" style="display:none;">Select Material</button><button class="grey close">Close</button>');
        $('.popup_dialog .bottom_links').find('button.select_material').on('click', select_material);
        // Listeners
        $list_content_td.find('.group').on('click', function() {
          if($(this).attr('data-id')*1 > 0)
            load($(this).attr('data-id'));
          else
            load();
          return false;
        });
        $list_content_td.find('.item').on('click', function() {
          if($(this).find('.detail').length) return false;
          $list_content_td.find('.selected').removeClass('selected');
          $list_content_td.find('.detail').slideUp({duration: 200, always: function() { $(this).remove(); }});
          $(this).addClass('selected');
          var detail_div = $('<div/>').addClass('detail').appendTo($(this)).hide();
          var to_add = [];
          $.each(item_list[$(this).attr('data-id') + ""], function(k, v) {
            to_add.push("<td class='item'>" + v.name + "</td><td class='item'>" + v.value + (v.units ? _this.worksheet.latexToUnit(v.units)[1] : '') + '</td>');
          });
          detail_div.html("<table><tbody><tr><td colspan=2><b>Available Properties</b></td><td rowspan=" + (to_add.length+1) + "><a class='button'>Select Material</a></td></tr><tr>" + to_add.join("</tr><tr>") + '</tr></tbody></table><div class="explain">' + _this.special_footer + '</div>').slideDown(200);
          detail_div.find('a.button').on('click', select_material);
          $('.popup_dialog .bottom_links').find('button.select_material').show();
          $input.focus();
          return false;
        });
        // register input
        window.resizePopup();
        $input.focus();
      } else {
        showNotice(response.message, 'red');
        window.hidePopupOnTop();
      }
    };
    var load = function(parent_id) {
      loading();
      window.silentRequest('/populate_materials', { data_type: _this.data_type, parent_id: parent_id }, populate, function(response) {
        window.hidePopupOnTop();
      });
    }
    load(parent_id);
  }

  _.toString = function() {
    return '';
  }
});


var material_holder = P(Element, function(_, super_) {
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
    return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'var_name') + '<span class="equality">&#8801;</span>' + focusableHTML('CodeBlock', this.name) + '<span class="material_name"></span><span class="' + css_prefix + 'hide_print explain">&nbsp;&nbsp;&nbsp;<a class="change" style="cursor: pointer;">Change</a></span>' + helpBlock() + '</div>' + answerSpan();
  }
  _.postInsertHandler = function() {
    this.varStoreField = registerFocusable(MathQuill, this, 'var_name', { ghost: 'variable name', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.varStoreField.disableAutoUnit(true);
    this.codeBlock = registerFocusable(CodeBlock, this, this.name, { });
    this.focusableItems = [[this.varStoreField, this.codeBlock]];
    super_.postInsertHandler.call(this);
    if(this.string_data !== false) {
      this.setData(this.name, this.full_name, this.string_data, this.data_type);
      this.genCommand();
      this.needsEvaluation = this.varStoreField.empty() ? false : true;
    }
    this.jQ.find("a.change").on("click", function(_this) { return function() {
      var mat = SwiftCalcs.elements[_this.selecting_class]().insertAfter(_this);
      mat.show(0).focus(0);
      mat.varStoreField.write(_this.varStoreField.latex());
      _this.remove(0);
    } }(this));
    return this;
  }
  _.preRemoveHandler = function() {
    // Since this is an object, we need to unset whenever we remove the element from the tree
    super_.preRemoveHandler.call(this);
    if(this.last_name != "") {
      giac.sendCommand({destroyConstant: this.last_name});
      this.last_name = "";
    }
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