
/*
A workspace is a large container block that houses more blocks, and has its own variable scope for mathjs.
Workspaces are attached/removed to/from the DOM after initialization with the 'bind'/'unbind' command

To create a workspace, you initialize an object by passing in:
- Nothing: Create new workspace, default name based on current time
- String: Create a new workspace with the passed string as its name
*/
var Workspace = P(function(_) {
	_.parent = 0;
  _[L] = 0;
  _[R] = 0;
  _.id = -1;
	_.jQ = 0;
	_.insertJQ = 0;
	_.bound = false;
	_.blurred = true;
	_.activeElement = 0;
	_.lastActive = 0;
	_.dragging = false;
	_.mousedown = false;

  var id = 0;
  function uniqueWorkspaceId() { return id += 1; }

  // Create the workspace, pass in an optional name
	_.init = function(binder) { 
		if(typeof binder === 'undefined') {
			var currentdate = new Date(); 
			binder = "Workspace from " + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + ", "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes();
		}
		this.ends = {};
		this.ends[R] = 0;
		this.ends[L] = 0;
		this.selection = [];
		this.id = uniqueWorkspaceId();
	}
	// Attach the workspace to the DOM and regenerate HTML
	_.bind = function(el) {
		this.jQ = $(el);
		this.jQ.html(""); // Clear the target
		this.insertJQ = $('<div/>', {"class": (css_prefix + "element_container")});
		this.jQ.append(this.insertJQ);
		this.bindMouse();
		this.bindKeyboard();
		SwiftCalcs.active_workspace = this;
		this.bound = true;
		return this;
	}
	// Detach method (remove from the DOM)
	_.unbind = function() {
		this.unbindMouse();
		this.unbindKeyboard();
		this.bound = false;
		return this;
	}
	// Focus the textarea and place a cursor
	_.focus = function() {
		if(this.bound && this.blurred)
			this.textarea.focus();
		return this;
	}
	// Blur the textarea
	_.blur = function() {
		if(this.bound && !this.blurred) 
			this.textarea.blur();
		return this;
	}
	// List children
	_.children = function() {
		var out = [];
		for(var ac = this.ends[L]; ac !== 0; ac = ac[R])
			out.push(ac);
		return out;
	}
	// Workspace is itself
	_.getWorkspace = function() {
		return this;
	}
	// Renumber all the lines in the workspace
	_.renumber = function() {
		var start = 1;
		jQuery.each(this.children(), function(i, child) {
			start = child.numberBlock(start);
		});
	}
	// Check for all hashtags and update the hashtag list
  _.updateHashtags = function() {
    var hashtags = this.insertJQ.find('span.' + css_prefix + 'hashtag');
    var $hashtag = $('#hashtags');
    $hashtag.html('');
    var _this = this;
    hashtags.each(function(i, hash) {
    	hash = $(hash);
    	var link = $('<a href="#">#' + hash.text() + '</a>');
    	$('<li/>').append(link).appendTo($hashtag);
    	link.on('click', function(e) {
    		var offset = hash.position().top + _this.jQ.scrollTop();
    		_this.jQ.scrollTop(offset);
    		hash.stop().css("background-color", "#ff9999").animate({ backgroundColor: "#FFFFFF"}, {complete: function() { $(this).css('background-color','')}, duration: 600});
    		return false;
    	});
    });
  }
	// Debug.  Print entire workspace tree
	_.printTree = function() {
		var out = '';
		if(this.children().length > 0) {
			out += '<ul>';
			$.each(this.children(), function(i, child) {
				out += child.printTree();
			});
			out += '</ul>';
		}
		return out;
	}
});