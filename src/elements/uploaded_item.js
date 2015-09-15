/*
	Parent block for uploaded items.  Has the necessary hook
	to make sure the updateUploads worksheet method finds it
*/

var uploadedItem = P(Element, function(_, super_) {
	_.upload_id = false;
	_.upload_name = '';
	_.url = false;
	_.savedProperties = ['url', 'upload_id', 'upload_name']; //NOTE: Server relies on something being after both url and upload_id, in order to replace them during a copy operation

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
	_.setUploadData = function(id, name) {
		this.upload_id = id;
		this.upload_name = name;
		return this;
	}
	_.setURL = function(url) {
		this.url = url;
		return this;
	}
});
