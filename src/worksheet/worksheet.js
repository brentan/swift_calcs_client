
/*
A worksheet is a large container block that houses more blocks, and has its own variable scope for mathjs.
Worksheets are attached/removed to/from the DOM after initialization with the 'bind'/'unbind' command

To create a worksheet, you initialize an object by passing in:
- Nothing: Create new worksheet, default name based on current time
- String: Create a new worksheet with the passed string as its name
*/
var Worksheet = P(function(_) {
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
	_.hash_string = '';
	_.server_version = 1;
	_.rights = 0;
	_.uploads = "";
	_.revision_id = 0;

  var id = 0;
  function uniqueWorksheetId() { return id += 1; }

  // Create the worksheet, pass in an optional name
	_.init = function(name, hash_string, server_id, server_version, rights) { 
		if((typeof name === 'undefined') || (typeof name === 'undefined')) 
			throw "Worksheet initialized with no name or hash_string";
		if(server_id) this.server_id = server_id;
		if(server_version) ajaxQueue.known_server_version[this.server_id] = server_version;
		this.name = name;
		this.bookmarks = [];
		this.hash_string = hash_string;
		this.rights = rights;
		this.ends = {};
		this.ends[R] = 0;
		this.ends[L] = 0;
		this.hashtags = [];
		this.selection = [];
		this.id = uniqueWorksheetId();
	}
	// Attach the worksheet to the DOM and regenerate HTML
	_.bind = function(el) {
		ans_id = 0;
		this.jQ = $(el);
		this.jQ.html(""); // Clear the target
		this.insertJQ = $('<div/>', {"class": (css_prefix + "element_container")});
		this.jQ.append(this.insertJQ);
		this.insertJQ.append('<div class="' + css_prefix + 'element_top_spacer"></div>');
		this.insertJQ.append('<div class="' + css_prefix + 'element_bot_spacer"></div>');
		$('#account_bar .content').html('<div class="' + css_prefix + 'worksheet_name"><input type=text class="' + css_prefix + 'worksheet_name"></div>');
		$('#account_bar input.' + css_prefix + 'worksheet_name').val(this.name);
		var _this = this;
		$('#account_bar .content').find('input').on('focus', function(e) {
			if(_this.rights < 4) {
				showNotice('You do not have sufficient rights to rename this document');
				this.blur();
			}
		}).on('blur', function(e) {
			if(_this.rights < 4) return;
			_this.name = $(this).val();
			_this.save();
		}).on("keydown",function(e) {
    	if(e.keyCode == 13) 
    		$(this).blur();
    });
    this.bindToolbar();
		this.bindMouse();
		this.bindKeyboard();
		this.bindUploads();
		SwiftCalcs.active_worksheet = this;
		this.setWidth();
    $('.fatal_div').hide();
    ajaxQueue.suppress = false;
		this.bound = true;
		this.generateTopWarning();
		return this;
	}
	var createWarningBox = function(els) {
		var div = $('<div/>').addClass('top_warning').append(els);
		var close = $('<div/>').addClass('fa fa-times close').appendTo(div);
		close.on('click', function() {
			$(this).closest('div.top_warning').slideUp({duration: 300, always: function() {$(this).remove(); }});
		});
		return div;
	}
	_.generateTopWarning = function() {
		this.jQ.find('.top_warning').remove();
		switch(this.rights) {
			case -2: //revision of a worksheet
				if(window.user_logged_in) {
					var els = $('<div/>').html('<strong>File Revisions are View Only</strong>.  Any changes you make to this revision will not be saved.  You can <a href="#" class="copy">create a new worksheet from these revisions</a>, <a href="#" class="restore">restore the worksheet to this revision</a>, or <a href="#" class="back">go back to the current worksheet version</a>.');
					els.find('a.copy').on('click', function(e) {
						window.newWorksheet(true); 
						e.preventDefault();
						return false;
					});
				} else {
					var els = $('<div/>').html('<strong>File Revisions are View Only</strong>.  Any changes you make to this revision will not be saved.  You can <a href="#" class="create">login or create an account with Swift Calcs</a> to create a copy of this worksheet based on this revision, you can <a href="#" class="restore">restore the worksheet to this revision</a>, or you can <a href="#" class="back">go back to the current worksheet version</a>.');
					els.find('a.create').on('click', function(e) {
						window.loadSigninBox();
						e.preventDefault();
						return false;
					});
				}
				els.find('a.restore').on('click', function(e) {
					window.restoreWorksheet();
					e.preventDefault();
					return false;
				});
				els.find('a.back').on('click', function(e) {
					pushState.navigate('/worksheets/' + SwiftCalcs.active_worksheet.hash_string + '/' + encodeURIComponent(SwiftCalcs.active_worksheet.name.replace(/ /g,'_')), {trigger: true});
					e.preventDefault();
					return false;
				});

				this.jQ.prepend(createWarningBox(els));
				this.save(); // Wont actually save, but will set the ajaxQueue.jQ to an appropriate message.
				break;
			case -1: //new worksheet for user who is not logged in...
				var els = $('<div/>').html('<strong>Welcome to SwiftCalcs</strong>.  To save this masterpiece or share it with others, you must first <a href="#" class="create">login or create an account with Swift Calcs</a>.');
				els.find('a.create').on('click', function(e) {
					window.loadSigninBox();
					e.preventDefault();
					return false;
				});
				this.jQ.prepend(createWarningBox(els));
				this.save(); // Wont actually save, but will set the ajaxQueue.jQ to an appropriate message.
				break;
			case 1: //view-only
				var els = $('<div/>').html('<strong>File is View Only</strong>.  Any changes you make will not be saved.');
				this.jQ.prepend(createWarningBox(els));
				this.save(); // Wont actually save, but will set the ajaxQueue.jQ to an appropriate message.
				break;
			case 2: //view-only but can duplicate
				if(window.user_logged_in) {
					var els = $('<div/>').html('<strong>File is View Only</strong>.  To save any changes you have made to this worksheet, <a href="#" class="copy">create a copy of the worksheet</a> in your own folder.');
					els.find('a.copy').on('click', function(e) {
						window.newWorksheet(true); 
						e.preventDefault();
						return false;
					});
				} else {
					var els = $('<div/>').html('<strong>File is View Only</strong>.  You must <a href="#" class="create">login or create an account with Swift Calcs</a> to be able to make an editable copy of this document in order to save changes.');
					els.find('a.create').on('click', function(e) {
						window.loadSigninBox();
						e.preventDefault();
						return false;
					});
				}
				this.jQ.prepend(createWarningBox(els));
				this.save(); // Won't actually save, but will set the ajaxQueue.jQ to an appropriate message.
				break;
		}
	}
	_.rename = function(new_name, new_hash, new_server_id) {
		if(!new_name) new_name = prompt('Please enter a new name for this Worksheet:', this.name);
		if(new_name) {
			this.name = new_name;
			$('#account_bar .content').find("input." + css_prefix + "worksheet_name").val(this.name);
			if(new_hash && new_server_id) {// new hash_string and server id provided means this is a duplication event.  Do not save, just update my hash_string
				this.hash_string = new_hash;
				ajaxQueue.server_version[new_server_id] = ajaxQueue.server_version[this.server_id];
				this.server_id = new_server_id;
				ajaxQueue.known_server_version[this.server_id] = 1;
			} else
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
			math().appendTo(this).show(0).focus(-1);
	  }
	  this.commandChildren(function(_this) { _this.needsEvaluation = false }); // Set to false as we are loading a document and dont want to trigger a save
	  ajaxQueue.suppress = false;
	  ajaxQueue.jQ.html(ajaxQueue.save_message);
	  giac.auto_evaluation = auto_evaluation;
	  this.ends[L].evaluate(true, true);
	  this.updateBookmarks();
	  this.updateUploads();
	  this.reset_server_base(to_parse);
	  return this;
	}
	_.reset_server_base = function(base) {
	  ajaxQueue.server_version[this.server_id] = base; // Seed the diff so that we load it with the current version that we just got from the server
	}
	// Detach method (remove from the DOM)
	_.unbind = function() {
		this.clearUndoStack();
		this.unbindUploads();
		this.unbindMouse();
		this.unbindKeyboard();
		var children = this.children();
		for(var i = 0; i < children.length; i++)
			children[i].destroy();
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
	_.setWidth = function() {
		this.insertJQ.css('max-width',max(300, min(900, this.jQ.width()-50)) + 'px');
		this.commandChildren(function(_this) { _this.setWidth(); });
		return this;
	}
	// Worksheet is itself
	_.getWorksheet = function() {
		return this;
	}
	// Renumber all the lines in the worksheet
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
    bookmarks.each(function(i, hash_string) {
    	hash_string = $(hash_string);
    	var el = Element.byId[hash_string.attr(css_prefix + 'element_id')*1];
    	var link = $('<a href="#">' + el.block.toString() + '</a>');
    	marks.push(el.block.toString());
    	$('<li/>').append(link).appendTo($bookmark);
    	link.on('click', function(e) {
    		var offset = hash_string.position().top + _this.jQ.scrollTop();
    		_this.jQ.scrollTop(offset);
    		hash_string.stop().css("background-color", "#ff9999").animate({ backgroundColor: "#FFFFFF"}, {complete: function() { $(this).css('background-color','')}, duration: 600});
    		return false;
    	});
    });
    this.bookmarks = marks;
  }
	// Check for all bookmarks and update the bookmarks list
  _.updateUploads = function() {
    var uploads = this.insertJQ.find('.' + css_prefix + 'uploadedData');
    var ids = [];
    uploads.each(function(i, hash_string) {
    	hash_string = $(hash_string);
    	var el = Element.byId[hash_string.attr(css_prefix + 'element_id')*1];
    	if(el.upload_id) ids.push(el.upload_id);
    });
    this.uploads = ids.join(',');
  }
  _.save = function(force) {
  	if(this.rights >= 3)
  		ajaxQueue.saveNeeded(this, force);
  	else if(this.rights == 2)
  		ajaxQueue.jQ.html('Create a duplicate to save your changes');
  	else
  		ajaxQueue.jQ.html('This document is view only.  Changes will not be saved.')
  }
  _.toString = function() {
		var out = [];
		jQuery.each(this.children(), function(i, child) {
			if(child.implicit || child.no_save) return;
			out.push(child.toString());
		});
		return out.join("\n");
  }
	// Debug.  Print entire worksheet tree
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