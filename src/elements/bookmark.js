
var bookmark = P(EditableBlock, function(_, super_) {
	_.klass = ['bookmark'];
	_.helpText = "<<Bookmark>>\nCreate a bookmark at this location in the worksheet.  Find your bookmarks quickly with the <i>bookmarks</i> link at the rigth of the screen, and search for bookmarks when opening documents in the file browser.";

	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CommandBlock', '') + helpBlock() + '</div>';
	}
	_.postInsertHandler = function() {
		var _this = this;
		this.block = registerFocusable(CommandBlock, this, '', { editable: true, handlers: {onSave: function() { _this.workspace.updateBookmarks(); } } });
		this.focusableItems = [[this.block]];
		super_.postInsertHandler.call(this);
		this.leftJQ.append('<span class="fa fa-bookmark"></span>');
		return this;
	}
	_.remove = function(duration) {
		super_.remove.call(this, duration);
		this.workspace.updateBookmarks();
		return this;
	}
	_.focus = function(dir) {
		super_.focus.call(this);
		if(dir)
			this.block.focus(dir);
		else if(dir === 0) 
			this.block.focus(L);
		else if(!dir && this.focusedItem)
			this.focusedItem.focus();
		return this;
	}
  _.toString = function() {
  	return '{bookmark}{{' + this.argumentList().join('}{') + '}}';
  }
});