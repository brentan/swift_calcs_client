// Help forums views are populated from the server side.  This function listens for the click of ‘feedback’ and
// Loads the forums in a dialog.
$(function() {
	$("body").on('click', ".feedback_link", function(e) {
		window.loadToPopup('/forums',{});
		e.preventDefault();
		return false;
	});
});