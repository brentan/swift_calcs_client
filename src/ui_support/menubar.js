$(function() {
	
	$('body').on('click', '.menu .open', function(e) { 
		if(window.user_logged_in) {
			window.loadFolder(); 
			SwiftCalcs.giac.cancelEvaluations(); 
		} else {
			showNotice('Please login or create an account to open other documents.');
			window.loadSigninBox();
		}
		return false; 
	});
	$('body').on('click', '.menu .new', function(e) { 
		if(window.user_logged_in)
			window.newWorksheet(); 
		else {
			showNotice('Please login or create an account to create new documents.');
			window.loadSigninBox();
		}
		return false; 
	});
	$('body').on('click', '.menu .save', function(e) { 
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
	$('body').on('click', '.menu .rename', function(e) { 
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
	$('body').on('click', '.menu .duplicate', function(e) { 
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
	$('body').on('click', '.menu .print', function(e) { window.print(); return false; });
	$('body').on('click', '.menu .delete', function(e) { 
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

	$('body').on('click', '.menu .undoLink', function(e) { if(SwiftCalcs.active_worksheet) { SwiftCalcs.active_worksheet.restoreUndoPoint(); } e.preventDefault(); e.stopPropagation(); return false; });
	$('body').on('click', '.menu .redoLink', function(e) { if(SwiftCalcs.active_worksheet) { SwiftCalcs.active_worksheet.restoreRedoPoint(); } e.preventDefault(); e.stopPropagation(); return false; });
	$('body').on('click', '.menu .cut', function(e) { alert('Due to browser security settings, you need to use your browser controls to cut/copy/paste.  Use the browser edit menu or keyboard shortcut Ctrl-X.'); return false; });
	$('body').on('click', '.menu .copy', function(e) { alert('Due to browser security settings, you need to use your browser controls to cut/copy/paste.  Use the browser edit menu or keyboard shortcut Ctrl-C.'); return false; });
	$('body').on('click', '.menu .paste', function(e) { alert('Due to browser security settings, you need to use your browser controls to cut/copy/paste.  Use the browser edit menu or keyboard shortcut Ctrl-V.'); return false; });

	$('body').on('click', '.menu .auto_off', function(e) { SwiftCalcs.giac.manual_mode(true); return false; });
	$('body').on('click', '.menu .auto_on', function(e) { SwiftCalcs.giac.manual_mode(false); return false; });
	$('body').on('click', '.menu .calc_now', function(e) { SwiftCalcs.giac.manualEvaluation(); return false; });
	$('body').on('click', '.menu .full_calc', function(e) { if(SwiftCalcs.active_worksheet) { window.start_time = undefined; SwiftCalcs.active_worksheet.ends[-1].evaluate(true, true); if(!SwiftCalcs.giac.auto_evaluation) { SwiftCalcs.giac.manualEvaluation(); } } return false; });

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
	$('body').on('click', '.menu .revision_history', function(e) { window.loadRevisions(); return false; });

	$('body').on('click', '.menu .about', function(e) { window.loadToPopup('/about',{}); return false; });

	$('body').on('click', '.menu .shortcuts', function(e) { window.loadToPopup('/shortcuts',{}); return false; });
	$('body').on('click', '.menu .hide_vaporware', function(e) { $(this).parent().hide(); $(this).parent().next().show(); $('body').removeClass('show_vaporware'); return false; });
	$('body').on('click', '.menu .show_vaporware', function(e) { $(this).parent().hide(); $(this).parent().prev().show(); $('body').addClass('show_vaporware'); return false; });

  $('body').on('click', '.menu .sidebar_item', function(e) {
    $('.base_layout').removeClass('closed_sidebar');
    $('div.sidebar div.content.selected').removeClass('selected');
    $('div.sidebar div.content.' + $(this).attr('data-select')).addClass('selected');
    if(SwiftCalcs.active_worksheet) {
    	SwiftCalcs.active_worksheet.reshapeToolbar();
			SwiftCalcs.active_worksheet.setWidth();
		}
    return false;
  });

});