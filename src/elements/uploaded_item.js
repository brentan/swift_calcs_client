/*
	Parent block for uploaded items.  Has the necessary hook
	to make sure the updateUploads worksheet method finds it
*/

var uploadedItem = P(Element, function(_, super_) {
	_.upload_id = false;
	_.postInsertHandler = function() {
		super_.postInsertHandler.call(this);
		this.jQ.addClass(css_prefix + 'uploadedData');
		return this;
	}
	_.preRemoveHandler = function() {
		super_.preRemoveHandler.call(this);
		window.setTimeout(function(w) { return function() { w.updateUploads(); }; }(this.worksheet));
		return this;
	}
	_.preReinsertHandler = function() {
		super_.preReinsertHandler.call(this);
		window.setTimeout(function(w) { return function() { w.updateUploads(); }; }(this.worksheet));
		return this;
	}
});
