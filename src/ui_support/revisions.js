$(function() {
	var restoreWorksheet = window.restoreWorksheet = function() {
		if(confirm('Are you sure?  Subsequent revisions and changes will be permanently deleted.  The current worksheet version will be set as a new revision.')) {
			SwiftCalcs.pushState.navigate('/worksheets/' + SwiftCalcs.active_worksheet.hash_string + '/' + encodeURIComponent(SwiftCalcs.active_worksheet.name.replace(/ /g,'_')));
			SwiftCalcs.active_worksheet.rights = SwiftCalcs.active_worksheet.revision_rights_level;
			SwiftCalcs.active_worksheet.generateTopWarning();
			window.silentRequest('/worksheet_commands',{command: 'restore_worksheet', data: { id: SwiftCalcs.active_worksheet.server_id, revision: SwiftCalcs.active_worksheet.revision_id }})
			SwiftCalcs.active_worksheet.revision_id = 0;
			SwiftCalcs.active_worksheet.save(true);
		} 
	}
	var loadRevision = function(id) {
		hideDialogs();
    var hash_string = SwiftCalcs.active_worksheet.hash_string;
    var name = SwiftCalcs.active_worksheet.name;
		SwiftCalcs.pushState.navigate('/revisions/' + hash_string + '/' + id + '/' + encodeURIComponent(name.replace(/ /g,'_')), {trigger: true});
	}
	var loadRevisions = window.loadRevisions = function() {
    if(SwiftCalcs.active_worksheet.rights == -1) {
      showNotice('This document has no saved revisions.');
      return;
    }
		window.showLoadingOnTop();
		$.ajax({
      type: "POST",
      url: '/revisions',
      dataType: 'json',
      cache: false,
      data: { id: SwiftCalcs.active_worksheet.server_id }, 
      success: function(response) {
      	if(response.success) {
      		window.showPopupOnTop();
      		$('.popup_dialog .full').html(response.html);
          $('.popup_dialog .bottom_links').html('<button class="close">Close</button>');
          $('.popup_dialog').find('.load_revision').on('click', function(e) {
          	loadRevision($(this).attr('data-id'));
          	e.preventDefault();
          	return false;
          });
          window.resizePopup();
      	} else {
      		window.hidePopupOnTop();
      		showNotice(response.message, 'red');
      	}
      },
      error: function(err) {
      	window.hidePopupOnTop();
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
      }
    });
	}

});