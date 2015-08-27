/*
 Video's aren't really an uploaded item...we just turn youtube/vimeo links into embeds
 */

var video = P(Element, function(_, super_) {
	_.helpText = "<<video>>\nEmbed a video from youtube or vimeo into your worksheet.";
	_.klass = ['import_video'];

	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'top ' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'video') + '&nbsp;url:&nbsp;' 
			+ '<div class="' + css_prefix + 'command_border">' + focusableHTML('CommandBlock', 'video_url') + '&nbsp;</div>' + helpBlock() + '<BR>'  + answerSpan() + '</div>';
	}
	_.postInsertHandler = function() {
		super_.postInsertHandler.call(this);
		var _this = this;
		this.codeBlock = registerFocusable(CodeBlock,this, 'video', { });
		this.block = registerFocusable(CommandBlock, this, 'video_url', { editable: true, handlers: {blur: function(el) { _this.processUrl(el.toString()); } } });
		this.focusableItems = [[this.codeBlock,this.block]];
		this.leftJQ.append('<span class="fa fa-upload"></span>');
		return this;
	}
	_.focus = function(dir) {
		super_.focus.call(this);
		if(dir == L)
			this.focusableItems[0][0].focus(dir);
		else if(dir == R)
			this.focusableItems[0][1].focus(dir);
		else if(dir == 0)
			this.focusableItems[0][1].focus(dir);
		return this;
	}
	_.processUrl = function(text) {
		if(text.trim() == '') return this.outputBox.clearState().collapse();
    var vimeo_pattern = /(?:http?s?:\/\/)?(?:www\.)?(?:vimeo\.com)\/?(.+)/g;
    var youtube_pattern = /(?:http?s?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/g;
    if(vimeo_pattern.test(text)) {
			var id = text.replace(vimeo_pattern, "$1");
			var provider = 'vimeo';
    } else if(youtube_pattern.test(text)) {
      var id = text.replace(youtube_pattern, "$1");
			var provider = 'youtube';
    } else {
    	// No matching provider
    	this.outputBox.expand();
    	this.outputBox.setError('Invalid URL.  Please copy in the URL to a vimeo or youtube video.  Use the <i>Share this video</i> at YouTube or the <i>Direct Video Link</i> from the share options in Vimeo.');
    	return;
    }
    // Success: Delete this block and replace with the video
    var stream = !this.worksheet.trackingStream;
    if(stream) this.worksheet.startUndoStream();
    videoBlock().insertAfter(this).setVideo(provider, id).show();
    this.remove();
    if(stream) this.worksheet.endUndoStream();
    this.worksheet.save();
  }
  _.toString = function() {
  	return '{video}{{' + this.argumentList().join('}{') + '}}';
  }
});

var videoBlock = P(Element, function(_, super_) {
	_.klass = ['video'];
	_.savedProperties = ['provider', 'video_id'];
	_.provider = false;
	_.video_id = false;

	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'top ' + css_prefix + 'focusableItems" data-id="0"><table><tbody><tr><td>' + focusableHTML('CodeBlock', '') + '</td><td class="' + css_prefix + 'insert"></td></tr></tbody></table></div>'
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
	_.setVideo = function(provider, video_id) {
		this.provider = provider;
		this.video_id = video_id;
		var html = '';
		switch(this.provider) {
			case 'vimeo':
      	html = '<iframe width="520" height="345" src="//player.vimeo.com/video/' + this.video_id + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>';
				break;
			case 'youtube':
      	html = '<iframe width="520" height="345" src="http://www.youtube.com/embed/' + this.video_id + '" frameborder="0" allowfullscreen></iframe>';
				break;
			default:
				html = '<strong>This block is corrupted.  Delete and re-create.</strong>';
		}
		this.insertJQ.html('');
		this.insertJQ.append(html);
		return this;
	}
  _.toString = function() {
  	return '{videoBlock}{{' + this.argumentList().join('}{') + '}}';
  }
  _.parseSavedProperties = function(args) {
  	super_.parseSavedProperties.call(this, args);
  	this.setVideo(this.provider, this.video_id);
  	return this;
  }
  _.mouseClick = function() {
  	this.codeBlock.focus(L);
  	return false;
  }
});