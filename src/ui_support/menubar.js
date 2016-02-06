$(function() {
	
	$('body').on('click', '#account_bar .new', function(e) { 
		window.newWorksheet(); 
		return false; 
	});
	$('body').on('click', '#account_bar .new_project', function(e) { 
		window.newProject(); 
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

	$('body').on('click', '#account_bar .about', function(e) { window.loadToPopup('/about',{}); return false; });

	$('body').on('click', '#account_bar .shortcuts', function(e) { window.loadToPopup('/shortcuts',{}); return false; });
	$('body').on('click', '#account_bar .hide_vaporware', function(e) { $(this).parent().hide(); $(this).parent().next().show(); $('body').removeClass('show_vaporware'); return false; });
	$('body').on('click', '#account_bar .show_vaporware', function(e) { $(this).parent().hide(); $(this).parent().prev().show(); $('body').addClass('show_vaporware'); return false; });

  $('body').on('click', '.leftbar .top_title', function(e) { 
  	$('.base_layout').addClass('leftbar_hidden');
  	window.resizeResults();
		if(SwiftCalcs.current_toolbar) SwiftCalcs.current_toolbar.reshapeToolbar();
    if(SwiftCalcs.active_worksheet) SwiftCalcs.active_worksheet.setWidth();
  });
  $('body').on('click', '.leftbar_top .top_title', function(e) { 
  	$('.base_layout').removeClass('leftbar_hidden');
  	window.resizeResults();
		if(SwiftCalcs.current_toolbar) SwiftCalcs.current_toolbar.reshapeToolbar();
    if(SwiftCalcs.active_worksheet) SwiftCalcs.active_worksheet.setWidth();
  });
  $('body').on('click', '#account_bar .star_select', function(e) {
  	if($(this).hasClass('on')) {
  		$(this).removeClass('on');
			SwiftCalcs.pushState.refresh();
  	} else {
  		$(this).addClass('on');
			SwiftCalcs.pushState.refresh();
  	}
  });

});