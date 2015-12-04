$(function() {
	
	$('body').on('click', '#account_bar .open', function(e) { 
		if(window.user_logged_in) {
			window.loadFolder(); 
			SwiftCalcs.giac.cancelEvaluations(); 
		} else {
			showNotice('Please login or create an account to open other documents.');
			window.loadSigninBox();
		}
		return false; 
	});
	$('body').on('click', '#account_bar .new', function(e) { 
		if(window.user_logged_in)
			window.newWorksheet(); 
		else {
			showNotice('Please login or create an account to create new documents.');
			window.loadSigninBox();
		}
		return false; 
	});
	$('body').on('click', '#account_bar .save', function(e) { 
		if(SwiftCalcs.active_worksheet) { 
			if(SwiftCalcs.active_worksheet.rights >= 3)
				SwiftCalcs.active_worksheet.save(true); 
			else if(SwiftCalcs.active_worksheet.rights == 2) {
				if(window.user_logged_in)
					window.newWorksheet(true);
				else {
					showNotice('Please login or create an account to save your changes to a copy of this document');
					window.loadSigninBox();
				}
			} else if(SwiftCalcs.active_worksheet.rights == -2) 
				window.restoreWorksheet();
			else if((SwiftCalcs.active_worksheet.rights == -1) && !window.user_logged_in) {
				showNotice('Please login or create an account to save this document');
				window.loadSigninBox();
			} else
				showNotice('This document is view only and changes cannot be saved.', 'red');
		} 
		return false; 
	});
	$('body').on('click', '#account_bar .rename', function(e) { 
		if(SwiftCalcs.active_worksheet) { 
			if(SwiftCalcs.active_worksheet.rights >= 4)
				SwiftCalcs.active_worksheet.rename(); 
			else if((SwiftCalcs.active_worksheet.rights == -1) && !window.user_logged_in) {
				showNotice('Please login or create an account to save this document.');
				window.loadSigninBox();
			} else
				showNotice('You do not have the required permissions to rename this file.','red');
		} 
		return false; 
	});
	$('body').on('click', '#account_bar .duplicate', function(e) { 
		if(SwiftCalcs.active_worksheet) { 
			if((SwiftCalcs.active_worksheet.rights >= 2) || (SwiftCalcs.active_worksheet.rights <= -1)) {
				if(window.user_logged_in)
					window.newWorksheet(true); 
				else {
					showNotice('Please login or create an account to create a copy of this document');
					window.loadSigninBox();
				}
			}	else
				showNotice('You do not have the required permissions to duplicate this file.','red');
		} 
		return false; 
	});
	$('body').on('click', '#account_bar .print', function(e) { window.print(); return false; });
	$('body').on('click', '#account_bar .delete', function(e) { 
		var msg = 'Are you sure you want to delete this item (if you are not the owner, this item will be removed from your shared folder)?  This action cannot be undone.';
		if(confirm(msg)) {
			window.showLoadingOnTop();
			$.ajax({
	      type: "POST",
	      url: "/folders/destroy",
	      dataType: 'json',
	      cache: false,
	      data: { data_type: 'Worksheet', id: SwiftCalcs.active_worksheet.server_id }, 
	      success: function(response) {
	      	if(response.success) {
	      		showNotice('Item has been removed');
						window.loadFolder();
	      	}	else {
						window.hideDialogs();
	      		showNotice(response.message, 'red');
					}
	      },
	      error: function(err) {
					window.hideDialogs();
	      	console.log('Error: ' + err.responseText, 'red');
					showNotice('Error: There was a server error.  We have been notified', 'red');
	      }
	    });
		}
		return false;
	});

	$('body').on('click', '#account_bar .undoLink', function(e) { if(SwiftCalcs.active_worksheet) { SwiftCalcs.active_worksheet.restoreUndoPoint(); } e.preventDefault(); e.stopPropagation(); return false; });
	$('body').on('click', '#account_bar .redoLink', function(e) { if(SwiftCalcs.active_worksheet) { SwiftCalcs.active_worksheet.restoreRedoPoint(); } e.preventDefault(); e.stopPropagation(); return false; });
	$('body').on('click', '#account_bar .cut', function(e) { alert('Due to browser security settings, you need to use your browser controls to cut/copy/paste.  Use the browser edit menu or keyboard shortcut Ctrl-X.'); return false; });
	$('body').on('click', '#account_bar .copy', function(e) { alert('Due to browser security settings, you need to use your browser controls to cut/copy/paste.  Use the browser edit menu or keyboard shortcut Ctrl-C.'); return false; });
	$('body').on('click', '#account_bar .paste', function(e) { alert('Due to browser security settings, you need to use your browser controls to cut/copy/paste.  Use the browser edit menu or keyboard shortcut Ctrl-V.'); return false; });

	$('body').on('click', '#account_bar .auto_off', function(e) { SwiftCalcs.giac.manual_mode(true); return false; });
	$('body').on('click', '#account_bar .auto_on', function(e) { SwiftCalcs.giac.manual_mode(false); return false; });
	$('body').on('click', '#account_bar .calc_now', function(e) { SwiftCalcs.giac.manualEvaluation(); return false; });
	$('body').on('click', '#account_bar .full_calc', function(e) { if(SwiftCalcs.active_worksheet) { window.start_time = undefined; SwiftCalcs.active_worksheet.ends[-1].evaluate(true, true); if(!SwiftCalcs.giac.auto_evaluation) { SwiftCalcs.giac.manualEvaluation(); } } return false; });

	var createBlock = function(el_type, options) {
  	var el = SwiftCalcs.active_worksheet.lastActive;
  	if(el === 0) el = SwiftCalcs.active_worksheet.ends[1];
  	var replace = false;
  	if(((el instanceof SwiftCalcs.elements.math) && (el.mathField.text() == '')) || ((el instanceof SwiftCalcs.elements.text) && ((SwiftCalcs.cleanHtml(el.textField.html()) === '') || (SwiftCalcs.cleanHtml(el.textField.html()) === '<br>')))) 
  		replace = true;
		var to_create = SwiftCalcs.elements[el_type];
		if(options)
			to_create = to_create(options);
		else
			to_create = to_create();
  	to_create.insertAfter(el).show(150).focus(options ? 1 : -1);
  	if(replace) 
  		el.remove();
		if(el_type == 'text')
			to_create.textField.magicCommands();
	}
	$('body').on('click', '#account_bar .revision_history', function(e) { window.loadRevisions(); return false; });

	$('body').on('click', '#account_bar .about', function(e) { window.loadToPopup('/about',{}); return false; });

	$('body').on('click', '#account_bar .shortcuts', function(e) { window.loadToPopup('/shortcuts',{}); return false; });
	$('body').on('click', '#account_bar .hide_vaporware', function(e) { $(this).parent().hide(); $(this).parent().next().show(); $('body').removeClass('show_vaporware'); return false; });
	$('body').on('click', '#account_bar .show_vaporware', function(e) { $(this).parent().hide(); $(this).parent().prev().show(); $('body').addClass('show_vaporware'); return false; });

  $('body').on('click', '#account_bar .sidebar_item', function(e) {
    $('.base_layout').removeClass('closed_sidebar');
    $('div.sidebar div.content.selected').removeClass('selected');
    $('div.sidebar div.content.' + $(this).attr('data-select')).addClass('selected');
    if(SwiftCalcs.active_worksheet) {
    	SwiftCalcs.active_worksheet.reshapeToolbar();
			SwiftCalcs.active_worksheet.setWidth();
		}
		var sel = $(this).attr('data-select');
		$('div.sidetabs li.item.selected').removeClass('selected');
		$('div.sidetabs li.item').each(function() {
			if($(this).attr('data-select') == sel) $(this).addClass('selected');
		});
    return false;
  });
  $('body').on('focus', 'input.search_bar', function() {
  	$(this).closest('div.search_box_holder').css('border-color', '#cccccc');
  });
  $('body').on('blur', 'input.search_bar', function() {
  	$(this).closest('div.search_box_holder').css('border-color', '#5888a9');
  });
  $('body').on('click', '.leftbar .title', function(e) { 
  	$('.base_layout').addClass('leftbar_hidden');
    if(SwiftCalcs.active_worksheet) {
    	SwiftCalcs.active_worksheet.reshapeToolbar();
			SwiftCalcs.active_worksheet.setWidth();
		}
  });
  $('body').on('click', '.leftbar_top .title', function(e) { 
  	$('.base_layout').removeClass('leftbar_hidden');
    if(SwiftCalcs.active_worksheet) {
    	SwiftCalcs.active_worksheet.reshapeToolbar();
			SwiftCalcs.active_worksheet.setWidth();
		}
  });
  $('body').on('click', '#account_bar .star_select', function(e) {
  	if($(this).hasClass('on')) {
  		$(this).removeClass('on');
  		// DO STUFF
  	} else {
  		$(this).addClass('on');
  		// DO STUFF
  	}
  });

});