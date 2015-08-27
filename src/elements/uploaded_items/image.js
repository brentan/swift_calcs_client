
var image = P(importData, function(_, super_) {
	_.helpText = "<<image>>\nInsert an image into your worksheet from elsewhere on the internet or from your machine.";
	_.focuasableName = 'image';

	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'top ' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', this.focuasableName) + helpBlock() + '</div>'
			+ '<div class="' + css_prefix + 'focusableItems ' + css_prefix + 'upload_box" data-id="1">Insert from the web: <div class="' + css_prefix + 'command_border">' + focusableHTML('CommandBlock', 'image_url')  + '&nbsp;</div><BR>'  + answerSpan() + '</div>'
			+ '<div class="' + css_prefix + 'dropzone_box ' + css_prefix + 'upload_box">Click here or drag images to insert from your computer</div><div class="' + css_prefix + 'insert ' + css_prefix + 'hide_print"></div>';
	}
	_.postInsertHandler = function() {
		super_.postInsertHandler.call(this);
		var _this = this;
		this.block = registerFocusable(CommandBlock, this, 'image_url', { editable: true, handlers: {blur: function(el) { _this.webImage(el.toString()); } } });
		this.focusableItems = [[this.codeBlock],[this.block]];
		return this;
	}
	_.focus = function(dir) {
		super_.focus.call(this);
		if(dir == L)
			this.focusableItems[0][0].focus(dir);
		else if(dir == R)
			this.focusableItems[this.focusableItems.length - 1][0].focus(dir);
		else if((dir == 0) && (this.focusableItems.length > 1))
			this.focusableItems[1][0].focus(dir);
		return this;
	}
	_.webImage = function(text) {
		if(text.trim() == '') return this.outputBox.clearState().collapse();
		if(!text.match(/^http/)) text = 'http://' + text; // Attempt to fix urls without protocol
		if(text.match(/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i)) {
			this.block.clear();
			this.outputBox.clearState().collapse();
			this.hideDropzone();
			var _this = this;
			var item = UploadingBlock('Loading Image', this);
		  $.ajax({
		    type: "POST",
		    url: "/file_by_url",
		    dataType: 'json',
		    cache: false,
		    data: { worksheet_id: _this.worksheet.server_id, url: text }, 
		    success: function(response) {
					item.updateProgress(100);
		    	if(response.success) {
            var stream = !_this.worksheet.trackingStream;
            if(stream) _this.worksheet.startUndoStream();
		    		if(_this.worksheet) _this.worksheet.processUpload(_this, response);
		    		_this.remove();
            if(stream) _this.worksheet.endUndoStream();
					} else {
						item.setError(response.message);
					}
		    },
		    error: function(err) {
		    	console.log(err);
					item.updateProgress(100);
		    	item.setError(err.message);
		    }
		  });
		} else {
			this.outputBox.expand();
			this.outputBox.setError('Invalid Image URL');
		}
	}
	_.hideDropzone = function() {
		super_.hideDropzone.call(this);
		this.focusableItems = [[this.codeBlock]];
	}
	_.showDropzone = function() {
		super_.showDropzone.call(this);
		this.focusableItems = [[this.codeBlock],[this.block]];
	}
});

var imageBlock = P(uploadedItem, function(_, super_) {
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'top ' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', '') + '</div>'
	}
	_.postInsertHandler = function() {
		super_.postInsertHandler.call(this);
		this.codeBlock = registerFocusable(CodeBlock, this, '', { });
		this.focusableItems = [[this.codeBlock]];
		return this;
	}
	_.empty = function() {
		return false;
	}
	_.setURL = function(url) {
		this.url = url;
		this.jQ.find('.' + css_prefix + 'top').find('img').remove()
		this.jQ.find('.' + css_prefix + 'top').append('<img src="' + this.url + '">');
		return this;
	}
  _.toString = function() {
  	return '{imageBlock}{{' + this.argumentList().join('}{') + '}}';
  }
  _.parseSavedProperties = function(args) {
  	super_.parseSavedProperties.call(this, args);
  	this.setURL(this.url);
  	return this;
  }
  _.mouseClick = function() {
  	this.codeBlock.focus(L);
  	return false;
  }
});