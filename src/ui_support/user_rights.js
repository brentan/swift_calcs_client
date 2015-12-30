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
  }
  var createRightsDropdown = window.createUserRightsDropdown = function(span) {
    var id = span.attr('data-id');
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
      sel.attr('data-id', id);
    if(span.attr('data-orig'))
      sel.attr('data-orig', span.attr('data-orig'));
  }

  var submitRights = function(form) {
    // Create the post object:
    var data = {};
    data.token = form.find('.token').val();
    data.item_type = form.find('.item_type').val();
    data.item_id = form.find('.item_id').val()*1;
    // Public Rights
    data.public_rights = form.find('.public_selection input.public_rights').val()*1;
    // Changes to users already added
    data.people = [];
    form.find('.people select').each(function() {
      var val = $(this).val()*1;
      if((val == 0) && !$(this).attr('data-orig')) // 'No rights' selected for somebody with no inherited rights...so change to 'inherit' so it just removes rights for this person
        val = -1;
      data.people.push({ id: $(this).attr('data-id')*1, user_rights: val });
    });
    // New inherited user (overwrite?)
    data.inherited_people = [];
    form.find('.inherited_people select').each(function() {
      var val = $(this).val()*1;
      var orig = $(this).attr('data-orig')*1;
      if(val == orig) return;
      data.inherited_people.push({user_id: $(this).attr('data-id')*1, user_rights: val });
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
    $.ajax({
      type: "POST",
      url: "/rights/set_rights",
      dataType: 'json',
      cache: false,
      data: {rights: data}, 
      success: function(response) {
        if(response.success) {
          window.hidePopupOnTop();
          showNotice(response.message, 'green');
        } else {
          window.showPopupOnTop();
          showNotice(response.message, 'red');
        }
      },
      error: function(err) {
          window.showPopupOnTop();
        showNotice('Error: ' + err.responseText, 'red');
        console.log(err);
        //Depending on error, do we try again?
        // TODO: Much better error handling!
      }
    });
  }
  var invalidateURL = function(link, item_type, item_id) {
    $('<span><i class="fa fa-spinner fa-pulse"></i>&nbsp;Loading</span>').insertAfter(link);
    link.hide();
    $.ajax({
      type: "POST",
      url: "/rights/invalidate_url",
      dataType: 'json',
      cache: false,
      data: { item_type: item_type, item_id: item_id }, 
      success: function(response) {
        if(response.success) {
          link.show();
          link.next('span').remove();
          link.closest('form').find("input.static").attr('data-url', response.url).val(response.url);
          if(item_type == 'Folder') {
            $('.file_dialog .folder_item').each(function() {
              if($(this).attr('data-id')*1 == item_id*1) 
                $(this).attr('data-hash_string',response.hash_string);
            });
          }
          if(SwiftCalcs.active_worksheet && (item_type == 'Worksheet') && (item_id == SwiftCalcs.active_worksheet.server_id))
            SwiftCalcs.active_worksheet.rename(SwiftCalcs.active_worksheet.name, response.hash_string, SwiftCalcs.active_worksheet.server_id)
          $('.file_dialog .file_item').each(function() {
            if(($(this).attr('data-type') == item_type) && ($(this).attr('data-id')*1 == item_id*1))
              $(this).attr('data-hash_string',response.hash_string);
          })
        } else {
          link.show();
          link.next('span').remove();
          showNotice(response.message, 'red');
        }
      },
      error: function(err) {
        link.show();
        link.next('span').remove();
        showNotice('Error: ' + err.responseText, 'red');
        console.log(err);
        //Depending on error, do we try again?
        // TODO: Much better error handling!
      }
    });
  }

	var openSharingDialog = window.openSharingDialog = function(item_id, item_type) {
    if(item_id == -1) {
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
		$.ajax({
      type: "POST",
      url: "/rights",
      dataType: 'json',
      cache: false,
      data: { item_id: item_id, item_type: item_type }, 
      success: function(response) {
      	if(response.success) {
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
            invalidateURL($(this), $(this).closest('form').find('.item_type').val(), $(this).closest('form').find('.item_id').val()*1)
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
          window.resizePopup();
      	}	else {
          window.hidePopupOnTop();
      		showNotice(response.message, 'red');
      	}
      },
      error: function(err) {
        window.hidePopupOnTop();
      	showNotice('Error while communicating with the server.  We have been notified', 'red');
      	console.log(err);
      	//Depending on error, do we try again?
      	// TODO: Much better error handling!
      }
    });
	}

});