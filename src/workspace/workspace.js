
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
	_.server_id = -1;
	_.name = '';
	_.hash = '';

  var id = 0;
  function uniqueWorkspaceId() { return id += 1; }

  // Create the workspace, pass in an optional name
	_.init = function(name, hash) { 
		if((typeof name === 'undefined') || (typeof name === 'undefined')) 
			throw "Workspace initialized with no name or hash";
		this.name = name;
		this.hash = hash;
		this.ends = {};
		this.ends[R] = 0;
		this.ends[L] = 0;
		this.hashtags = [];
		this.selection = [];
		this.id = uniqueWorkspaceId();
	}
	// Attach the workspace to the DOM and regenerate HTML
	_.bind = function(el) {
		this.jQ = $(el);
		this.jQ.html(""); // Clear the target
		this.insertJQ = $('<div/>', {"class": (css_prefix + "element_container")});
		this.jQ.append(this.insertJQ);
		this.insertJQ.append('<div class="' + css_prefix + 'element_top_spacer"></div>');
		$('#account_bar .content').html('<div class="' + css_prefix + 'workspace_name"><i class="fa fa-fw fa-file-text-o"></i><input type=text class="' + css_prefix + 'workspace_name"></div>');
		$('#account_bar input.' + css_prefix + 'workspace_name').val(this.name);
		var _this = this;
		$('#account_bar .content').find('input').on('blur', function(e) {
			_this.name = $(this).val();
			_this.save();
		}).on("keydown",function(e) {
    	if(e.keyCode == 13) 
    		$(this).blur();
    });
    this.bindToolbar();
		this.bindMouse();
		this.bindKeyboard();
		SwiftCalcs.active_workspace = this;
		this.bound = true;
		return this;
	}
	_.rename = function(new_name, new_hash) {
		if(!new_name) new_name = prompt('Please enter a new name for this Worksheet:', this.name);
		if(new_hash) this.hash = new_hash;
		if(new_name) {
			this.name = new_name;
			$('#account_bar .content').find("input." + css_prefix + "workspace_name").val(this.name);
			this.save();
		}
	}
	_.load = function(to_parse) {
		var auto_evaluation = giac.auto_evaluation;
		ajaxQueue.suppress = true;
		giac.auto_evaluation = false;
		var blocks = parse(to_parse);
		if(blocks.length > 0) {
			blocks[0].appendTo(this).show(0);
	    var after = this.ends[L];
	    for(var i = 1; i < blocks.length; i++) {
	      blocks[i].insertAfter(after).show(0);
	      after = blocks[i];
	    }
	  } else {
			math().appendTo(this).show(0);
	  }
	  this.commandChildren(function(_this) { _this.needsEvaluation = false }); // Set to false as we are loading a document and dont want to trigger a save
	  ajaxQueue.suppress = false;
	  ajaxQueue.jQ.html(ajaxQueue.save_message);
	  giac.auto_evaluation = auto_evaluation;
	  this.ends[L].evaluate(true, true);
		this.insertJQ.append('<div class="' + css_prefix + 'element_bot_spacer"></div>');
	  this.updateBookmarks();
	  return this;
	}
	// Detach method (remove from the DOM)
	_.unbind = function() {
		this.unbindMouse();
		this.unbindKeyboard();
		this.toolbar.detachToolbar();
		this.toolbar = false;
		$('#account_bar .content').html('');
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
	// Run a func on all children.  Func should be function that expects the Element to act on as input
	_.commandChildren = function(func) {
		var children = this.children();
		for(var i = 0; i < children.length; i++)
			children[i].commandChildren(func);
		return this;
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
	// Check for all bookmarks and update the bookmarks list
  _.updateBookmarks = function() {
    var bookmarks = this.insertJQ.find('.' + css_prefix + 'bookmark');
    var $bookmark = $('#bookmarks');
    $bookmark.html('');
    var _this = this;
    var marks = [];
    bookmarks.each(function(i, hash) {
    	hash = $(hash);
    	var el = Element.byId[hash.attr(css_prefix + 'element_id')*1];
    	var link = $('<a href="#">' + el.block.toString() + '</a>');
    	marks.push(el.block.toString());
    	$('<li/>').append(link).appendTo($bookmark);
    	link.on('click', function(e) {
    		var offset = hash.position().top + _this.jQ.scrollTop();
    		_this.jQ.scrollTop(offset);
    		hash.stop().css("background-color", "#ff9999").animate({ backgroundColor: "#FFFFFF"}, {complete: function() { $(this).css('background-color','')}, duration: 600});
    		return false;
    	});
    });
    this.bookmarks = marks;
  }
  _.save = function(force) {
  	ajaxQueue.saveNeeded(this, force);
  }
  _.toString = function() {
		var out = [];
		jQuery.each(this.children(), function(i, child) {
			out.push(child.toString());
		});
		return out.join("\n");
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