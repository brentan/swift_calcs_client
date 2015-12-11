
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
	_.loaded = false;

  var id = 0;
  function uniqueWorksheetId() { return id += 1; }

  // Create the worksheet, pass in an optional name
	_.init = function(name, hash_string, server_id, server_version, rights, settings) { 
		if((typeof name === 'undefined') || (typeof name === 'undefined')) 
			throw "Worksheet initialized with no name or hash_string";
		if(server_id) this.server_id = server_id;
		if(server_version) ajaxQueue.known_server_version[this.server_id] = server_version;
		this.name = name;
		this.hash_string = hash_string;
		this.rights = rights;
		this.settings = settings;
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
		this.bindSettings();
		SwiftCalcs.active_worksheet = this;
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
		this.jQ.closest('.active_holder').find('.top_warning').remove();
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
				createWarningBox(els).insertAfter(this.jQ.closest('.active_holder').children('.worksheet_item'));
				this.save(); // Wont actually save, but will set the saving message to an appropriate message.
				break;
			case 1: //view-only
				var els = $('<div/>').html('<strong>File is View Only</strong>.  Any changes you make will not be saved.');
				createWarningBox(els).insertAfter(this.jQ.closest('.active_holder').children('.worksheet_item'));
				this.save(); // Wont actually save, but will set the saving message to an appropriate message.
				break;
			case 2: //view-only but can duplicate
				var els = $('<div/>').html('<strong>File is View Only</strong>.  To save changes you make to this worksheet, <a href="#" class="copy">create a copy</a>.');
				els.find('a.copy').on('click', function(e) {
					if(window.user_logged_in)
						window.newWorksheet(true);  //NEW UI: Change to copy
					else {
						showNotice("Login or create an account to make a copy of this document");
						window.loadSigninBox();
					}
					e.preventDefault();
					return false;
				});
				createWarningBox(els).insertAfter(this.jQ.closest('.active_holder').children('.worksheet_item'));
				this.save(); // Won't actually save, but will set the saving message to an appropriate message.
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
	var labelInput = function(el, _this) {
    // create ul to hold labels once entered
    $list = $('<ul />');
    $placeholder = $('<span/>').addClass('placeholder').html('Add labels to this worksheet');
    // Input box
    var $input = $('<input type="text"/>');
    // function to take content from input and push to list

    var scanInput = function() {
      $.each($input.val().replace(/;/g,',').split(','), function(i, v) {
        if(v.trim() == '') return; // Ignore blank guys
        $list.append($('<li class="labelInput"><span>' + v + '</span></li>')
          .append($('<i class="fa fa-times-circle"></i>')
            .click(function(e) {
              $(this).parent().remove();
              e.preventDefault();
            })
          )
        );
      });
      // clear input
      $input.val('');
    }
    // container div
    var $container = $('<div class="labelInput-container" />').click(function() {
      $input.focus();
    });
    // input box listeners
    $input.keyup(function(event) {
      if(event.which == 188) { //188
        // key press is enter, comma
        $(this).val($(this).val().slice(0, -1)); // remove last space/comma from value
        scanInput();
      }
      if(event.which == 13) {
        scanInput();
        event.preventDefault();
      }
    }).on("blur", function() {
      scanInput();
      $container.removeClass('focused');
      var list = [];
      $list.find('li.labelInput span').each(function() { list.push($(this).html()); });
      _this.updateLabels(list);
    }).on("focus", function() {
      $placeholder.hide();
      $container.addClass('focused');
    });
    // insert elements into DOM
    $container.append($placeholder).append($list).append($input).insertAfter(el);
    el.hide();
  }
  var rename = function(_this, name_span, e) {
  	name_span.hide();
  	var input_div = $('<span/>').addClass('name_change').html('<input type="text">').insertAfter(name_span).on('click', function(e) {
  		e.stopPropagation();
  		return false;
  	});
  	var setName = function(el) { 
  		_this.rename(el.val());
  		el.closest('span').prev('span').show().children('span').html(el.val());
  		el.closest('span').remove();
  		window.setTimeout(function() { _this.ends[-1].focus(-1); });
  	}
  	input_div.children('input').val(_this.name).on('blur', function(e) {
  		setName($(this));
  	}).on('keyup', function(e) {
  		if(e.keyCode == 13) setName($(this));
  	}).focus();
  	e.preventDefault();
  	e.stopPropagation();
  }
	// Load function is broken up since the parser can take on order of 1 second, and delay is noticeable.  Instead, have parser insert block by block so there is visual feedback to user that 
	// document is loading.
	_.load = function(response) {
		var to_parse = response.data;
		// Load the details section
		var det_div = $('<div/>').hide().addClass('details_span').html('<table><tbody>'
			+ '<tr><td class="left"><i class="fa fa-users"></i></td><td class="collaborators right"></td></tr>'
			+ '<tr><td class="left"><i class="fa fa-folder-open"></i></td><td class="projects right"></td></tr>'
			+ '<tr><td class="left"><i class="fa fa-tags"></i></td><td class="labels right"></td></tr>'
			+ '<tr><td class="left"><i class="fa fa-history"></i></td><td class="info right"></td></tr>'
			+ '<tr><td class="left"><i class="fa fa-cog"></i></td><td class="settings right"></td></tr>'
			+ '</tbody></table>');
		labelInput($('<span/>').appendTo(det_div.find('.labels')), this);
		if(response.project_path) 
			det_div.find('.projects').html(response.project_path);
		else 
			det_div.find('.projects').html('<div class="placeholder">Worksheet is not part of a project</div>').closest('tr').hide();
		det_div.find('.info').html(response.update_time);
		det_div.insertBefore(this.jQ).slideDown({duration: 200});

		det_div.find('.collaborators').html(response.collaborators);
		$('<div/>').addClass('message').html(this.setSettingsText()).appendTo(det_div.find('td.settings')).on('click', function(_this) { return function(e) {
			_this.loadSettingsPane();
		}; }(this));
		var name_span = this.jQ.closest('.active_holder').find('.worksheet_item span.name');
		if(this.rights >= 3) 
			name_span.addClass('change').children('span').on('click', function(_this, name_span) { return function(e) { rename(_this, name_span, e); }; }(this, name_span));
		ajaxQueue.save_div = $('<span/>').addClass('save_span').insertAfter(name_span);
		var auto_evaluation = giac.auto_evaluation;
		ajaxQueue.suppress = true;
		giac.auto_evaluation = false;
		var blocks = parse(to_parse);
		if(blocks.length > 0) {
			blocks[0].appendTo(this).show(200);
			if(blocks.length > 1)
    		window.setTimeout(function(_this) { return function() { _this.continueLoad(auto_evaluation, to_parse, blocks, _this.ends[-1], 1); }; }(this));
    	else
    		this.completeLoad(auto_evaluation, to_parse);
	  } else {
			math().appendTo(this).show(200);
			this.completeLoad(auto_evaluation, to_parse);
	  }
	}
	_.continueLoad = function(auto_evaluation, to_parse, blocks, after, i) {
		if(!this.bound) this.completeLoad(auto_evaluation, to_parse);
    blocks[i].insertAfter(after).show(200);
    after = blocks[i];
    i++;
    if(i == blocks.length) this.completeLoad(auto_evaluation, to_parse);
    else window.setTimeout(function(_this) { return function() { _this.continueLoad(auto_evaluation, to_parse, blocks, after, i); }; }(this));
	}
	_.completeLoad = function(auto_evaluation, to_parse) {
	  giac.auto_evaluation = auto_evaluation;
		if(!this.bound) return;
		if(giac.giac_ready) setComplete();
    if(this.jQ.next().hasClass('loader')) this.jQ.next().slideUp({duration: 200, always: function() { $(this).remove(); }});
	  this.commandChildren(function(_this) { _this.needsEvaluation = false }); // Set to false as we are loading a document and dont want to trigger a save
	  ajaxQueue.suppress = false;
	  ajaxQueue.jQ.html(ajaxQueue.save_message);
	  this.ends[L].evaluate(true, true);
	  this.updateUploads();
	  this.reset_server_base(to_parse);
	  this.loaded = true;
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
		this.unbindSettings();
		ajaxQueue.save_div.remove();
		ajaxQueue.save_div = $('<span/>');
		this.jQ.closest('.active_holder').find('.name.change').removeClass('change').children('.hover').off('click');
		this.toolbar.blurToolbar();
		this.toolbar = false;
		$('#account_bar .content').html('');
		this.bound = false;
		SwiftCalcs.active_worksheet = null;
		this.destroyChildren();
		return this;
	}
	_.destroyChildren = function() {
		if(ajaxQueue.saving && ajaxQueue.holding_pen[this.server_id]) {
			// Save is not complete, so wait to destroy children until save finishes
			return window.setTimeout(function(_this) { return function() { _this.destroyChildren(); }; }(this), 50);
		}
		var children = this.children();
		for(var i = 0; i < children.length; i++)
			children[i].destroy();
		return this;
	}
	// Focus the textarea and place a cursor
	_.focus = function() {
		window.clear_batch();
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
		this.insertJQ.css('max-width',max(300, this.jQ.closest('.worksheet_holder_box').width() + 55) + 'px');
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
	_.updateLabels = function(list) {
		console.log(list);
		//NEW UI: Need to save labels.
	}
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