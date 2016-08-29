$(function() {

  var emailInput = window.userRightsEmailInput = function(el) {
    // create ul to hold email addresses once entered
    $list = $('<ul />');
    $placeholder = $('<span/>').addClass('placeholder').html('Email addresses of people to invite');
    // Input box
    var $input = $('<input type="text"/>');
    // function to take content from input and push to list

    var scanInput = function() {
      $.each($input.val().replace(/(;| )/g,',').split(','), function(i, v) {
        if(v.trim() == '') return; // Ignore blank guys
        var valid_email = '';
        if(!v.match(/[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/)) valid_email = ' invalid';
        $list.append($('<li class="emailInput' + valid_email + '"><span>' + v + '</span></li>')
          .append($('<i class="fa fa-times-circle"></i>')
            .click(function(e) {
              $(this).parent().remove();
              e.preventDefault();
            })
          )
        );
      });
      // clear input
      $input.val('');
    }
    // input box listeners
    $input.keyup(function(event) {
      if(event.which == 32 || event.which == 188) {
        // key press is enter, space, or comma
        $(this).val($(this).val().slice(0, -1)); // remove last space/comma from value
        scanInput();
      }
      if(event.which == 13) {
        scanInput();
        event.preventDefault();
      }
    }).on("blur", function() {
      scanInput();
    }).on("focus", function() {
      $placeholder.hide();
    });
    // container div
    var $container = $('<div class="emailInput-container" />').click(function() {
      $input.focus();
    });
    // insert elements into DOM
    $container.append($placeholder).append($list).append($input).insertAfter(el);
    el.hide();
  }
  var selectItem = function(i) {
    var tex = i.attr('data-text') || i.html().replace(/<i.*i>/g,'').trim();
    i.closest(".collapsable_item").find(".level").html(": " + tex);
    i.closest(".collapsable_item").find("i.fa-dot-circle-o").removeClass('fa-dot-circle-o').addClass('fa-circle-o');
    i.find("i.fa-circle-o").addClass('fa-dot-circle-o').removeClass('fa-circle-o');
    i.closest(".collapsable_item").find("input.public_rights").val(i.attr('data-type'));
    if(i.attr('data-type')*1 > 0) 
      i.closest(".rights_form").find(".hide_on_public").hide();
    else if(i.attr('data-type')*1 == 0)
      i.closest(".rights_form").find(".hide_on_public").show();
  }
  var createRightsDropdown = window.createUserRightsDropdown = function(span) {
    var id = span.attr('data-hash');
    var sel = $('<select/>')
      .append("<option value='1'>Can view</option>")
      .append("<option value='2'>Can view and duplicate</option>")
      .append("<option value='3'>Can edit</option>")
      .append("<option value='4'>Administrator</option>");
    if(id)
      sel.prepend("<option value='0'>No rights</option>");
    if(span.attr('data-inherit'))
      sel.prepend("<option value='-1'>Inherit from parent folder</option>");
    var to_sel = span.attr('data-val');
    span.replaceWith(sel);
    sel.val(to_sel);
    if(id) 
      sel.attr('data-hash', id);
    if(span.attr('data-orig'))
      sel.attr('data-orig', span.attr('data-orig'));
  }

  var submitRights = function(form) {
    // Create the post object:
    var data = {};
    data.token = form.find('.token').val();
    data.item_type = form.find('.item_type').val();
    data.item_hash = form.find('.item_hash').val();
    // Public Rights
    data.public_rights = form.find('.public_selection input.public_rights').val()*1;
    // Changes to users already added
    data.people = [];
    form.find('.people select').each(function() {
      var val = $(this).val()*1;
      if((val == 0) && !$(this).attr('data-orig')) // 'No rights' selected for somebody with no inherited rights...so change to 'inherit' so it just removes rights for this person
        val = -1;
      data.people.push({ hash_string: $(this).attr('data-hash'), user_rights: val });
    });
    // New inherited user (overwrite?)
    data.inherited_people = [];
    form.find('.inherited_people select').each(function() {
      var val = $(this).val()*1;
      var orig = $(this).attr('data-orig')*1;
      if(val == orig) return;
      data.inherited_people.push({user_hash: $(this).attr('data-hash'), user_rights: val });
    });
    // New invited users
    data.invite_emails = [];
    form.find('.emailInput').each(function() {
      if($(this).hasClass('invalid')) return;
      data.invite_emails.push($(this).children('span').html());
    });
    data.invite_rights = form.find('.invite_rights select').val()*1;
    data.invite_notify = form.find('.checkbox.notify').attr('data-val')*1;
    data.invite_message = form.find('textarea.add_message').val();
    window.showLoadingOnTop();
    window.ajaxRequest("/rights/set_rights", {rights: data}, function(response) {
      window.hidePopupOnTop();
      if($(".active_worksheet .worksheet_item, .active_worksheet .invitation_item").attr("data-hash") == response.hash) // Update worksheet rights list if worksheet is open
        $(".active_worksheet td.collaborators > div").html(response.rights)
      showNotice(response.message, 'green');
    }, function(err) {
      window.showPopupOnTop();
    });
  }
  var invalidateURL = function(link, item_type, item_hash) {
    $('<span><i class="fa fa-spinner fa-pulse"></i>&nbsp;Loading</span>').insertAfter(link);
    link.hide();
    window.ajaxRequest("/rights/invalidate_url", { item_type: item_type, item_hash: item_hash }, function(response) {
      link.show();
      link.next('span').remove();
      link.closest('form').find("input.static").attr('data-url', response.url).val(response.url);
      link.closest('form').find('.item_hash').val(response.hash_string);
      createEmbedCode();
      if(item_type == 'Project') {
        $('.projects_list div.item').each(function() {
          if($(this).attr('data-hash') == item_hash) 
            $(this).attr('data-hash',response.hash_string);
        });
        if(window.current_project_hash() == item_hash) 
          window.setCurrentProject(response.hash_string, response.url_end, window.current_project_onshape());
        if(SwiftCalcs.pushState.fragment.indexOf(item_hash) !== -1)
          SwiftCalcs.pushState.navigate(SwiftCalcs.pushState.fragment.replace(item_hash, response.hash_string), {trigger: false});
      }
      if(SwiftCalcs.active_worksheet && (item_type == 'Worksheet') && (item_hash == SwiftCalcs.active_worksheet.hash_string))
        SwiftCalcs.active_worksheet.rename(SwiftCalcs.active_worksheet.name, response.hash_string)
      $('.worksheet_holder_outer_box .worksheet_item').each(function() {
        if($(this).attr('data-hash') == item_hash)
          $(this).attr('data-hash',response.hash_string);
      });
    }, function(err) {
      link.show();
      link.next('span').remove();
    });
  }

  var createEmbedCode = function() {
    var el = $('.embed_span');
    var height = el.find('.embed_height').val();
    if(height == "-1") {
      var new_height = prompt("Please enter a height for the embedded document","")*1;
      el.find('.embed_height').append("<option value='" + new_height + "'>" + new_height + "</option>");
      el.find('.embed_height').val(new_height);
      height = new_height;
    }
    height = height * 1;
    var autosave = el.find('.embed_autosave').val() === '1' ? 'true' : 'false';
    var interaction = el.find('.embed_interaction').val();
    var copy_message = el.find('.embed_copy').val();
    var worksheet = el.attr('data-worksheet') === '1' ? 'w' : 'p';
    var hash_string = el.closest('form').find('.item_hash').val();
    var dev = el.attr('data-dev') === '1' ? 'true' : 'false';
    // First code should inject a div to house the iframe, and put 'loading' inside it
    var code = "<div style=\"border-width:0px;padding:0px;margin:3px;\" id=\"SwiftCalcs_" + worksheet + "_" + hash_string + "\"><div style=\"height:" + (height > 0 ? height : '600') + "px;text-align:center;font-size:24px;color:black;margin-top:50px;\">Loading...</div></div><script language='javascript'>(function() { ";
    // Next code should create the loading function for when we have the client library ready
    code += "var l=function(){window.SwiftCalcs_Embed_Iframe_" + window.sc_embed_version + "({dev:" + dev + ",hash_string:'" + hash_string + "',worksheet:" + (worksheet == 'w' ? 'true' : 'false') + ",height:" + height + ",autosave:" + autosave + ",interaction:" + interaction + ",copy_message:" + copy_message +"});};";
    // Check if we already have the script loaded, and if so, evaluate l...if not, load the library
    code += "if(window.SwiftCalcs_Embed_Iframe_" + window.sc_embed_version + "){l();}else{";
    code += "var f=document.createElement('script');f.setAttribute('type','text/javascript');f.setAttribute('src','" + (dev == 'true' ? 'http://dev.swiftcalcs.com:3000' : 'https://www.swiftcalcs.com') + "/libraries/embed/sc_client_embed" + window.sc_embed_version + ".js');document.getElementsByTagName('head')[0].appendChild(f);";
    // do timeouts to run l when we are loaded
    code += "var t=function(){if(window.SwiftCalcs_Embed_Iframe_" + window.sc_embed_version + "){l();}else{window.setTimeout(t,250);}};t();}}());</script>";
    var iframe_src = (dev == 'true' ? 'http://dev.swiftcalcs.com:3000' : 'https://www.swiftcalcs.com') + "/embed/" + worksheet + "/" + hash_string + "?height=" + (height > 0 ? height : '600') + "&autosave=" + (autosave == 'true' ? '1' : '0') + "&interaction=" + interaction + "&copy_message=" + copy_message;
    el.find('.embed_code').val(code);
    el.find('.iframe_embed input').val("<iframe width='100%' height='" + (height > 0 ? height : '600') + "' frameborder='0' allowTransparency='true' scrolling='no' style='width:100%;overflow:hidden;border-width:0px;height:" + (height > 0 ? height : '600') + "px;background-color:transparent;' src='" + iframe_src + "'></iframe>");
  }

	var openSharingDialog = window.openSharingDialog = function(item_hash, item_type) {
    if(item_hash == '') {
      if(window.user_logged_in) {
        showNotice("Save this document in order to enable sharing");
      } else {
        showNotice("Login and create an account to share this document");
        window.loadSigninBox();
      }
      return;
    }
    if(!window.user_logged_in) {
      showNotice("Login and create an account to share this document");
      window.loadSigninBox();
      return;
    }
    window.showLoadingOnTop();
    window.ajaxRequest("/rights", { item_hash: item_hash, item_type: item_type }, function(response) {
      window.showPopupOnTop();
			var el = $('.popup_dialog .full').html(response.html);
      el.find('input.static').each( function() {
        this.addEventListener('input', function() { $(this).val($(this).attr('data-url')); this.select(); });
        $(this).on('click', function() { this.focus(); this.select(); });
      });
      el.find('.collapsable_item .collapsed').on('click', function() {
        if($(this).parent().hasClass('collapsed')) {
          // Expand
          $(this).parent().removeClass('collapsed');
          $(this).find('i.fa.fa-caret-right').removeClass('fa-caret-right').addClass('fa-caret-down');
          $(this).next('.expanded').slideDown({duration: 120});
        } else {
          // Collapse
          $(this).parent().addClass('collapsed');
          $(this).find('i.fa.fa-caret-down').addClass('fa-caret-right').removeClass('fa-caret-down');
          $(this).next('.expanded').slideUp({duration: 120});
        }
      });
      el.find('.selectable').on('click', function() {
        selectItem($(this));
      });
      el.find('i.fa-dot-circle-o').closest('.selectable').each(function() {
        selectItem($(this));
      });
      el.find('span.rights_select').each(function() {
        createRightsDropdown($(this));
      });
      el.find('span.email_input').each(function() {
        emailInput($(this));
      });
      el.find('a.invalidate').on('click', function(e) {
        invalidateURL($(this), $(this).closest('form').find('.item_type').val(), $(this).closest('form').find('.item_hash').val())
        e.preventDefault();
        return false;
      })
      el.find('.checkbox').on('click', function(e) {
        var box = $(this).children('i.fa');
        if(box.hasClass('fa-check-square-o')) {
          box.removeClass('fa-check-square-o').addClass('fa-square-o');
          $(this).attr('data-val', '0');
        } else {
          box.removeClass('fa-square-o').addClass('fa-check-square-o');
          $(this).attr('data-val', '1');
        }
      });
      el.find('a.add_message').on('click', function(e) {
        var box = el.find('div.add_message');
        if(box.hasClass('shown')) {
          box.removeClass('shown');
          box.hide();
          $(this).html('Add Message');
        } else {
          box.addClass('shown');
          box.show();
          $(this).html('Discard Message');
        }
        box.find('textarea').val('');
        e.preventDefault();
        return false;
      });
      // Autogrow the textarea
      el.find('textarea').on('paste input', function () {
        if ($(this).outerHeight() > this.scrollHeight)
          $(this).height(60)
        var height = $(this).height();
        while ($(this).outerHeight() < this.scrollHeight) {
          $(this).height(height + 5);
          height += 5;
        }
        $(this).height(height + 5);
      });
      // Create the buttons at the bottom
      buttons = $('.popup_dialog .bottom_links').html('');
      if(response.assign_rights) {
        buttons.append('<button class="submit">Save Changes</button>');
        buttons.append('<button class="close grey">Cancel</button>');
      } else
        buttons.append('<button class="close">Close</button>');
      buttons.find('button.submit').on('click', function() {
        submitRights($('form.rights_form'));
      });
      // Populate embed boxes
      createEmbedCode();
      // Listen for changes to embed options
      el.find('.embed_span select').on('change', function(e) { createEmbedCode(); });
      el.find('.embed_span .iframe_code').on('click', function(e) { $(this).hide(); $(this).closest('.embed_span').find('.iframe_embed').show(); });
      window.resizePopup(); 
    }, function(err) {
      window.hidePopupOnTop();
    });
	}
  var loadCopies = window.loadCopies = function(hash_string) {
    var success = function(response) {
      window.showPopupOnTop();
      $('.popup_dialog .full').html(response.html);
      $('.popup_dialog .bottom_links').html('<button class="close">Close</button>');
      $('.popup_dialog').find('.load_worksheet_child').on('click', function(e) {
        if($(this).find(".explain").length)
          showNotice("Sorry, this user has not granted access to this worksheet","red");
        else {
          window.hideDialogs();
          SwiftCalcs.pushState.navigate('/worksheets/' + $(this).attr('data-hash'), {trigger: true});
        }
        e.preventDefault();
        return false;
      });
      window.resizePopup();
    }
    var fail = function() {
      window.hidePopupOnTop();
    }
    window.ajaxRequest("/worksheets_children", { hash_string: hash_string }, success, fail);
  }

});