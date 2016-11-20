/* 
Parent for all material types.  Includes holder and loading box
*/
var material_holder = P(EditableBlock, function(_, super_) {
  _.klass = ['material','material_holder'];
  _.needsEvaluation = false; 
  _.evaluatable = true;
  _.scoped = true;
  _.lineNumber = true;
  _.data_type = false;
  _.data = false;
  _.string_data = false;
  _.name = false;
  _.full_name = false;
  _.special_footer = '';
  _.savedProperties = ['string_data', 'name', 'data_type', 'full_name'];
  _.last_name = "";
  _.blank_message = "";
  _.ignore_blur_eval = false;
  _.min_search_length = 3;

  _.innerHtml = function() {
    return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'var_name') + '<span class="equality">&#8801;</span>' + focusableHTML('CodeBlock', this.class_name) + '<span class="material_name">No ' + this.blank_message + ' Specified</span><span class="' + css_prefix + 'hide_print explain">&nbsp;&nbsp;&nbsp;<a class="change" style="cursor: pointer;">Change</a></span>' + helpBlock() + '</div>' + answerSpan();
  }
  _.postInsertHandler = function() {
    this.setFocusableItems();
    super_.postInsertHandler.call(this);
    if(this.string_data !== false) {
      this.setData(this.name, this.full_name, this.string_data, this.data_type);
      this.genCommand();
      this.needsEvaluation = this.varStoreField.empty() ? false : true;
    }
    this.jQ.find("a.change").on("click", function(_this) { return function() {
      _this.loadOptions();
    } }(this));
    if(this.name === false)
      this.loadOptions();
    return this;
  }
  _.setFocusableItems = function() {
    this.varStoreField = registerFocusable(MathQuill, this, 'var_name', { ghost: 'variable name', noWidth: true, handlers: {
      enter: this.enterPressed(this),
      blur: this.submissionHandler(this)
    }});
    this.varStoreField.disableAutoUnit(true);
    this.codeBlock = registerFocusable(CodeBlock, this, this.class_name, { });
    this.focusableItems = [[this.varStoreField, this.codeBlock]];
  }
  _.preRemoveHandler = function() {
    // Since this is an object, we need to unset whenever we remove the element from the tree
    super_.preRemoveHandler.call(this);
    if(this.last_name != "") {
      giac.sendCommand({destroyConstant: this.last_name});
      this.last_name = "";
    }
  }

  _.loadOptions = function(parent_id) {
    this.ignore_blur_eval = true;
    this.blur();
    this.ignore_blur_eval = false;
    window.showPopupOnTop();
    $('.popup_dialog .full').html("<div class='select_material'><div class='input_box'><input type='text'></div><div class='title'>Choose a " + this.blank_message + "</div><div class='search'><i class='fa fa-search'></i><div class='input'><input type='text' placeholder='Search'></div><i class='fa fa-times-circle'></i></div><div class='list_content'></div></div>");
    var $list_content_td = $('.popup_dialog .full div.list_content');
    var $autocomplete = $('.popup_dialog .full').find('input').eq(1);
    var $input = $('.popup_dialog .full').find('input').eq(0);
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
          _this.setData(response.name, response.full_name, response.data, _this.data_type);
          _this.show(0).focus(0);
        }, function () {
          $('.popup_dialog .full').html("");
          window.hidePopupOnTop();
        });
    }
    var populate = function(response) { 
      if(response.success) {
        $list_content_td.html("<div class='folder'></div>");
        $list_content_td.children(".folder").html(response.folder);
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
        if((response.groups.length == 0) && (response.items.length == 0))
          $list_content_td.append("<div><strong>No Results</strong></div>");
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
          $autocomplete.val('');
          lastRequest = '';
          $input.focus();
          return false;
        });
        // register input
        window.resizePopup();
        if(!$autocomplete.is(":focus"))
          $input.focus();
      } else {
        showNotice(response.message, 'red');
        window.hidePopupOnTop();
      }
    };

    var timeOut = false;
    var ajaxRequest = false;
    var lastRequest = '';
    var submitFunction = function(_this){ return function(search) {
      search = $autocomplete.val().trim();
      // Cancel the last request if valid
      if(ajaxRequest) ajaxRequest.abort();
      // Currently loading? 
      var curloading = $list_content_td.find('.fa-spinner').length > 0;
      if(!curloading && (search == lastRequest)) return;
      lastRequest = search;
      if(search == '') // blank, reload initial material listing
        return load();
      if(search.length < _this.min_search_length) {
        if(curloading) $list_content_td.html("");
        return showNotice('Please enter a search phrase of at least 3 characters');
      }
      loading();
      ajaxRequest = $.ajax({
        type: "POST",
        url: "/material_search",
        data: {query: search, data_type: _this.data_type },
        success: populate,
        error: function(err) {
          window.hidePopupOnTop();
          console.log('Error: ' + err.responseText)
          showNotice('Error: There was a server error.  We have been notified', 'red');
          SwiftCalcs.await_printing = false;
        }
      });
    }; }(this);
    $('.popup_dialog .full').find('div.search .fa-times-circle').on('click', function(evt) {
      $autocomplete.val('');
      submitFunction();
      evt.preventDefault();
    });
    $autocomplete.on("keydown", function(evt) {
      var which = evt.which || evt.keyCode;
      var search = $(this).val();
      var curloading = $list_content_td.find('.fa-spinner').length > 0;
      // It will clear the setTimeOut activity if valid.
      if(timeOut) clearTimeout(timeOut);
      if((which == 10) || (which == 13)) {
        evt.preventDefault();
        this.blur(); //Blur will submit, see 'onblur'
      }
      else if(search.length >= 3) {
        loading();
        timeOut = setTimeout(function() { submitFunction(); }, 400);// wait for quarter second.
      } else if(curloading) {
        loading();
        timeOut = setTimeout(function() { submitFunction(); }, 1200);// wait for quarter second.
      }
    }).on("blur", function(evt) {
      submitFunction();
      evt.preventDefault();
      $input.focus();
    });

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

    var load = function(parent_id) {
      loading();
      window.silentRequest('/populate_materials', { data_type: _this.data_type, parent_id: parent_id }, populate, function(response) {
        window.hidePopupOnTop();
      });
    }
    load(parent_id);
  }

  _.setData = function(name, full_name, data, data_type) {
    var re_eval = (this.name !== false);
    this.jQ.find('.material_name').html(full_name);
    this.full_name = full_name;
    this.name = name;
    this.data_type = data_type;
    this.convertData(data);
    if(re_eval) {
      if(this.last_name != "") 
        giac.sendCommand({destroyConstant: this.last_name});
      this.last_name = "";
      this.needsEvaluation = true;
      this.submissionHandler(this)();
    }
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
      if(_this.ignore_blur_eval) return;
      if(_this.needsEvaluation) {     
        _this.genCommand();
        _this.evaluate();
        _this.needsEvaluation = false;
      }
    };
  }
  _.genCommand = function() {
    this.independent_vars = this.varStoreField.text().trim();
    this.commands = [{command: "1", setMaterial: {data_type: this.data_type, var_name: this.varStoreField.text().trim(), data: this.data, last_name: this.last_name} }];    
  }
  _.shouldBeEvaluated = function(evaluation_id) {
    if(this.string_data === false) return false;
    if(super_.shouldBeEvaluated.call(this, evaluation_id))
      return (this.varStoreField.text() != this.last_name)
    return false;
  }
  _.evaluationFinished = function(result) {
    if(result[0].success) {
      this.outputBox.clearState().collapse(true);
      this.last_name = this.varStoreField.text().trim();
    } else {
      this.outputBox.setError(result[0].returned).expand(true);
    }
    return true;
  }

  _.convertData = function(data) {
    if(typeof data === "string") {
      this.data = JSON.parse(data.replace(/\|/g,','));
      this.string_data = data;
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