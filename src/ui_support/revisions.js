$(function() {
	var restoreWorksheet = window.restoreWorksheet = function() {
		if(confirm('Are you sure?  Subsequent revisions and changes will be permanently deleted.  The current worksheet version will be set as a new revision.')) {
			SwiftCalcs.pushState.navigate('/worksheets/' + SwiftCalcs.active_worksheet.hash_string + '/' + encodeURIComponent(SwiftCalcs.active_worksheet.name.replace(/( |\\|\.)/g,'_')));
			SwiftCalcs.active_worksheet.rights = SwiftCalcs.active_worksheet.revision_rights_level;
			SwiftCalcs.active_worksheet.generateTopWarning();
			window.silentRequest('/worksheet_commands',{command: 'restore_worksheet', data: { hash_string: SwiftCalcs.active_worksheet.hash_string, revision: SwiftCalcs.active_worksheet.revision_hash }}, function(response) {
        $(".details_span div.revisions").html(response.message);
      });
			SwiftCalcs.active_worksheet.revision_hash = '';
			SwiftCalcs.active_worksheet.save(true);
		} 
	}
	var loadRevision = function(revision_hash, hash_string, name) {
		hideDialogs();
		SwiftCalcs.pushState.navigate('/revisions/' + hash_string + '/' + revision_hash + '/' + encodeURIComponent(name.replace(/( |\\|\.)/g,'_')), {trigger: true});
	}
	var loadRevisions = window.loadRevisions = function(hash_string, name) {
    var success = function(response) {
      window.showPopupOnTop();
      $('.popup_dialog .full').html(response.html);
      $('.popup_dialog .bottom_links').html('<button class="close">Close</button>');
      $('.popup_dialog').find('.load_revision').on('click', function(e) {
        loadRevision($(this).attr('data-hash'), hash_string, name);
        e.preventDefault();
        return false;
      });
      window.resizePopup();
    }
    var fail = function() {
      window.hidePopupOnTop();
    }
    window.ajaxRequest("/revisions", { hash_string: hash_string }, success, fail);
  }
});