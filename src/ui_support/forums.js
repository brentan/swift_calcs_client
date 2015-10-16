$(function() {
	$("body").on('click', ".feedback_link", function(e) {
		window.loadToPopup('/forums',{});
		e.preventDefault();
		return false;
	});
});