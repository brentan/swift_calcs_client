
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
	_.name = '';
	_.hash_string = '';
	_.server_version = 1;
	_.rights = 0;
	_.uploads = "";
	_.revision_hash = 0;
	_.loaded = false;
	_.ready_to_print = false;
  _.first_eval_complete = false;
  _.suppress_autofunction = false;

  var id = 0;
  function uniqueWorksheetId() { return id += 1; }

  // Create the worksheet, pass in an optional name
	_.init = function(inputs) { 
		if((typeof inputs === 'undefined') || (typeof inputs.name === 'undefined') || (typeof inputs.hash_string === 'undefined')) 
			throw "Worksheet initialized with no name or hash_string";
		this.name = inputs.name;
		this.hash_string = inputs.hash_string;
    if(inputs.version) ajaxQueue.known_server_version[this.hash_string] = inputs.version;
		this.rights = inputs.rights_level;
		this.settings = inputs.settings;
    this.author = inputs.author;
    this.onshape_did = inputs.onshape_did;
    this.fusion_id = inputs.fusion_id;
		this.ends = {};
    this.object_list = {};
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
    if(this.allow_interaction()) {
  		this.insertJQ.append('<div class="' + css_prefix + 'element_top_spacer"></div>');
  		this.insertJQ.append('<div class="' + css_prefix + 'element_bot_spacer"></div>');
    } else {
      this.insertJQ.append('<div class="' + css_prefix + 'element_top_spacer ' + css_prefix + 'no_interaction"></div>');
      this.insertJQ.append('<div class="' + css_prefix + 'element_bot_spacer ' + css_prefix + 'no_interaction"></div>');
    }
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
		this.jQ.closest('.active_holder').children('.worksheet_item, .invitation_item').attr('data-hash', this.hash_string);
		SwiftCalcs.active_worksheet = this;
    $('.fatal_div').hide();
    $('nav.menu').removeClass('noWorksheet');
    ajaxQueue.suppress = false;
    ajaxQueue.ignore_errors[this.hash_string] = false;
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
    if(window.embedded) {
      // Embedded windows don't show messages except the 'copy' message, if allowed
      if(window.show_copy_message && ((this.rights == 2) || ((this.rights >= 2) && window.no_save))) {
        var els = $('<div/>').html('<strong>Want your own version to edit</strong>?  <a href="#" class="copy">Create a copy</a> in your Swift Calcs account to enable editing and allow saving.');
        els.find('a.copy').on('click', function(_this) { return function(e) {
          var val = confirm("Would you like to grant the original worksheet author (" + _this.author + ") view-only access rights to your copy?  Click 'OK' to grant access, or 'cancel' to create a copy without granting access.");
          window.open("/worksheet_copy/" + _this.hash_string + "?author_rights=" + (val ? 'true' : 'false'));
          e.preventDefault();
          return false;
        }; }(this));
        createWarningBox(els).insertAfter(this.jQ.closest('.active_holder').children('.worksheet_item, .invitation_item'));
      }
    } else {
  		switch(this.rights) {
  			case -2: //revision of a worksheet
  				var els = $('<div/>').html('<strong>Revision is View Only</strong>.  <a href="#" class="copy">Copy revision into new worksheet</a>, <a href="#" class="restore">restore worksheet to this revision</a>, or <a href="#" class="back">go to the current version</a>.');
  				els.find('a.copy').on('click', function(_this) { return function(e) {
  					window.newWorksheet(true, _this.hash_string, _this.revision_hash);
  					e.preventDefault();
  					return false;
  				}; }(this));
  				els.find('a.restore').on('click', function(_this) { return function(e) {
  					window.restoreWorksheet();
  					e.preventDefault();
  					return false;
  				}; }(this));
  				els.find('a.back').on('click', function(e) {
  					pushState.navigate('/worksheets/' + SwiftCalcs.active_worksheet.hash_string + '/' + encodeURIComponent(SwiftCalcs.active_worksheet.name.replace(/ /g,'_')), {trigger: true});
  					e.preventDefault();
  					return false;
  				});
  				createWarningBox(els).insertAfter(this.jQ.closest('.active_holder').children('.worksheet_item, .invitation_item'));
  				this.save(); // Wont actually save, but will set the saving message to an appropriate message.
  				break;
  			case 1: //view-only
  				var els = $('<div/>').html('<strong>File is View Only</strong>.  Any changes you make will not be saved.');
  				createWarningBox(els).insertAfter(this.jQ.closest('.active_holder').children('.worksheet_item, .invitation_item'));
  				this.save(); // Wont actually save, but will set the saving message to an appropriate message.
  				break;
  			case 2: //view-only but can duplicate
  				var els = $('<div/>').html('<strong>File is View Only</strong>.  To save changes you make to this worksheet, <a href="#" class="copy">create a copy</a>.');
  				els.find('a.copy').on('click', function(_this) { return function(e) {
            window.createPrompt("Grant View Rights to File Author?","This file was created by " + _this.author + ".  Would you like to give this person <strong>View Only</strong> access to your copy of the worksheet?",{Yes: 1, No: 0}, function(val) {
              window.newWorksheet(true, _this.hash_string, null, val == '1');
            });
  					e.preventDefault();
  					return false;
  				}; }(this));
  				createWarningBox(els).insertAfter(this.jQ.closest('.active_holder').children('.worksheet_item, .invitation_item'));
  				this.save(); // Won't actually save, but will set the saving message to an appropriate message.
  				break;
      }
		}
    if(this.onshape_did) {
      var els = $('<div/>').html('Document Linked to Onshape - <a href="https://cad.onshape.com/documents/' + this.onshape_did + '" target="_blank">Open associated Onshape file</a>.');
      var div = $('<div/>').addClass('top_share').append(els).insertAfter(this.jQ.closest('.active_holder').children('.worksheet_item, .invitation_item'));
    }
    /*if(this.fusion_id) {
      var els = $('<div/>').html('Document Linked to Fusion 360 - <a href="https://cad.onshape.com/documents/' + this.onshape_did + '" target="_blank">Open associated Fusion 360 file</a> (requires Fusion 360 to be installed).');
      var div = $('<div/>').addClass('top_share').append(els).insertAfter(this.jQ.closest('.active_holder').children('.worksheet_item, .invitation_item'));
    }*/
	}
  _.FailedSaveMessage = function() {
		var els = $('<div/>').html('<strong>Saving Disabled</strong>.  Changes will not be saved.  <a href="#" class="reload">Reload to re-enable saving</a>.');
		var box = createWarningBox(els);
    box.hide().addClass('error').insertAfter(this.jQ.closest('.active_holder').children('.worksheet_item, .invitation_item'));
		els.find('a.reload').on('click', function(_this) { return function(e) {
			_this.unbind();
			var el = $(this).closest('.active_holder');
			el.children().each(function() {
				if($(this).hasClass('worksheet_item')) return;
				$(this).remove();
			});
			$('<div class="loader"><i class="fa fa-spinner fa-pulse"></i></div>').appendTo(el)
			window.loadWorksheet(el.children('.worksheet_item'));
			e.preventDefault();
			return false;
		}; }(this));
    window.setTimeout(function() { box.slideDown({duration: 500}); }, 250);
  }
	_.rename = function(new_name, new_hash) {
		if(!new_name) new_name = prompt('Please enter a new name for this Worksheet:', this.name);
		if(new_name) {
			this.name = new_name;
			$(document).prop('title', new_name);
			$('#account_bar .content').find("input." + css_prefix + "worksheet_name").val(this.name);
			if(new_hash) {// new hash_string and server id provided means this is a duplication event.  Do not save, just update my hash_string
        ajaxQueue.server_version[new_hash] = ajaxQueue.server_version[this.hash_string];
				this.hash_string = new_hash;
				ajaxQueue.known_server_version[this.hash_string] = 1;
    		ajaxQueue.ignore_errors[this.hash_string] = false;
			} else
				this.save();
      pushState.navigate('/worksheets/' + this.hash_string + '/' + encodeURIComponent(this.name.replace(/ /g,'_')), {trigger: false});
		}
	}
	/*
	var labelInput = function(el, _this) {
    // create ul to hold labels once entered
    $list = $('<ul />');
    $placeholder = $('<span/>').addClass('placeholder').html('Add labels to this worksheet');
    // Input box
    var $input = $('<input type="text"/>').val(el.attr('data-list'));
    if(el.attr('data-list').trim().length > 0) $placeholder.hide();
    // function to take content from input and push to list
    el.attr('data-list', null);
    var scanInput = function() {
    	$box.html('').hide();
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
    var $container = $('<div class="labelInput-container" />').addClass('active').click(function() {
      $input.focus();
    });
    var timeout = false;
    $box = $('<div/>').addClass(css_prefix + 'autocomplete').css({top: 20, left: 20}).appendTo($container).hide();
    // input box listeners
    $input.keydown(function(event) { if((event.which == 9) || (event.which == 38) || (event.which == 40)) { event.preventDefault(); } }).keyup(function(event) {
      if(event.which == 188) { 
        // comma
        $(this).val($(this).val().slice(0, -1)); // remove last space/comma from value
        scanInput();
      } else if(event.which == 40) {      	
      	// Down arrow
      	if($box.find('li.selected').length) {
      		var next = $box.find('li.selected').next('li');
      		if(next.length) {
      			$box.find('li.selected').removeClass('selected');
      			next.addClass('selected');
      		}
      	}
        event.preventDefault();
      } else if(event.which == 38) {
      	// Up arrow
      	if($box.find('li.selected').length) {
      		var next = $box.find('li.selected').prev('li');
      		if(next.length) {
      			$box.find('li.selected').removeClass('selected');
      			next.addClass('selected');
      		}
      	}
        event.preventDefault();
      } else if((event.which == 13) || (event.which == 9)) {
      	// enter or tab
      	if($box.find('li.selected').length) 
      		$input.val($box.find('li.selected').html());
        scanInput();
        event.preventDefault();
      } else if($(this).val().trim().length > 3) {
      	var search = $(this).val().trim().toLowerCase();
      	var match = [];
      	var secondary = [];
      	var checkAlreadyIn = function(label) {
      		var match = false;
      		$container.find('.labelInput span').each(function() {
      			if(match) return;
      			if(label.toLowerCase().trim() == $(this).html().toLowerCase().trim()) match = true;
      		});
      		return match;
      	}
      	for(var i = 0; i < SwiftCalcs.labelList.length; i++) {
      		if(SwiftCalcs.labelList[i].name.toLowerCase().indexOf(search) === 0) {
      			if(!checkAlreadyIn(SwiftCalcs.labelList[i].name)) match.push(SwiftCalcs.labelList[i].name)
      		}
      		else if(SwiftCalcs.labelList[i].name.toLowerCase().indexOf(search) > 0) {
      			if(!checkAlreadyIn(SwiftCalcs.labelList[i].name)) secondary.push(SwiftCalcs.labelList[i].name)
      		}
      	}
      	match = match.concat(secondary);
      	if(match.length > 0) {
      		var offset = $input.offset();
      		var offset2 = $container.offset();
      		$box.css({top: (offset.top  - offset2.top + $input.height()), left: (offset.left - offset2.left) }).html("<ul><li class='selected'>" + match.join("</li><li>") + "</li></ul>").show();
      	} else $box.html('').hide();
      } else $box.html('').hide();
    }).on("blur", function() {
      scanInput();
      $container.removeClass('focused');
      var list = [];
      $list.find('li.labelInput span').each(function() { list.push($(this).html()); });
      timeout = window.setTimeout(function() { _this.updateLabels(list); timeout = false; }, 250);
      $box.hide();
    }).on("focus", function() {
    	if(timeout) window.clearTimeout(timeout);
      $placeholder.hide();
      $container.addClass('focused');
    });
    // insert elements into DOM
    $container.append($placeholder).append($list).append($input).insertAfter(el);
    el.hide();
    scanInput();
  }
  */
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
    startProgress("Loading Worksheet");
		if(this.rights == -2) {
			this.revision_hash = response.revision_hash;
			this.revision_rights_level = response.revision_rights_level;
		}
		var to_parse = response.data;
		// Load the details section

    var det_div = $('<div/>').hide().addClass('details_span').html('<table><tbody><tr><td class="collaborators"></td><td class="settings"></td><td class="location"></td><td class="revisions"></td></tr></tbody></table>');

	  /*var det_div = $('<div/>').hide().addClass('details_span').html('<table><tbody>'
			+ '<tr><td class="left"><i class="fa fa-users"></i></td><td class="collaborators right"></td></tr>' //+ '<tr><td class="left"><i class="fa fa-tags"></i></td><td class="labels right"></td></tr>'
			+ '<tr><td class="left"><i class="fa fa-info-circle"></i></td><td class="info right"></td></tr>'
			+ '</tbody></table>');*/
		// Labels:
		/*
		if(this.rights >= 3)
			labelInput($('<span/>').attr('data-list', response.labels).appendTo(det_div.find('.labels')), this);
		else {
			var $list = $('<ul/>').appendTo($('<div class="labelInput-container" />').appendTo(det_div.find('.labels')));
			var add_message = true;
      $.each(response.labels.replace(/;/g,',').split(','), function(i, v) {
        if(v.trim() == '') return; // Ignore blank guys
        $list.append($('<li class="labelInput"><span>' + v + '</span></li>'));
        	add_message = false;
      });
      if(add_message) $('<span/>').addClass('placeholder').html('This worksheet has no labels').insertBefore($list);
		}
		*/
		// Project
		if(response.project_path) 
			det_div.find('td.location').append($('<i/>').addClass('fa').addClass('fa-folder-open')).append($('<div/>').html(response.project_path));
		else 
			det_div.find('td.location').append($('<i/>').addClass('fa').addClass('fa-folder-open')).append($('<div/>').html('No project'));
		det_div.find('td.revisions').append($('<i/>').addClass('fa').addClass('fa-history')).append($('<div/>').html(response.update_time));
		// Collaborators
		det_div.find('.collaborators').append($('<i/>').addClass('fa').addClass('fa-users')).append($('<div/>').addClass('nopadding').html(response.collaborators));
		// Settings
		$('<div/>').addClass('settings').html(this.setSettingsText()).appendTo(det_div.find('td.settings').append($('<i/>').addClass('fa').addClass('fa-gear')).on('click', function(_this) { return function(e) {
			_this.loadSettingsPane();
		}; }(this)));
    if(typeof window.embedded === 'undefined') 
		  det_div.insertBefore(this.jQ).slideDown({duration: 200});
		var name_span = this.jQ.closest('.active_holder').find('.worksheet_item span.name');
		if((this.rights >= 3))
			name_span.addClass('change').children('span').on('click', function(_this, name_span) { return function(e) { rename(_this, name_span, e); }; }(this, name_span));
		$('nav.menu .save_message span').remove();
    if(window.embedded && window.allow_save) 
      ajaxQueue.save_div = $('<span/>').addClass('save_span').appendTo($('div.header'));
    else
		  ajaxQueue.save_div = $('<span/>').addClass('save_span').insertAfter(name_span).add($('<span/>').addClass('save_span').appendTo('nav.menu .save_message'));
		ajaxQueue.suppress = true;
		giac.suppress = true;
		var blocks = parse(to_parse);
		if(blocks.length > 0) {
			blocks[0].appendTo(this).show(200);
			if(blocks.length > 1)
    		window.setTimeout(function(_this) { return function() { _this.continueLoad(to_parse, blocks, _this.ends[-1], 1); }; }(this));
    	else
    		this.completeLoad(to_parse);
	  } else {
			math().appendTo(this).show(200);
			this.completeLoad(to_parse);
	  }
	}
	_.continueLoad = function(to_parse, blocks, after, i) {
		if(!this.bound) this.completeLoad(to_parse);
    blocks[i].insertAfter(after).show(200);
    after = blocks[i];
    i++;
    //setProgress(i/blocks.length);
    if(i == blocks.length) this.completeLoad(to_parse);
    else window.setTimeout(function(_this) { return function() { _this.continueLoad(to_parse, blocks, after, i); }; }(this));
	}
	_.completeLoad = function(to_parse) {
		if(!this.bound) return;
		if(giac.giac_ready) setComplete();
    if(this.jQ.next().hasClass('loader')) this.jQ.next().slideUp({duration: 200, always: function() { $(this).remove(); }});
	  this.commandChildren(function(_this) { _this.needsEvaluation = false }); // Set to false as we are loading a document and dont want to trigger a save
	  ajaxQueue.suppress = false;
	  ajaxQueue.jQ.html(ajaxQueue.save_message);
    giac.suppress = false;
    setComplete();
	  this.fullEvalNeeded().evaluate();
	  if((this.ends[L] instanceof math) && (this.ends[L].mathField.text().trim() == "")) {
      this.ready_to_print = true;
      this.first_eval_complete = true;
    }
	  this.updateUploads();
	  this.reset_server_base(to_parse);
	  this.loaded = true;
	  return this;
	}
	_.reset_server_base = function(base) {
	  ajaxQueue.server_version[this.hash_string] = base; // Seed the diff so that we load it with the current version that we just got from the server
	}
	// Detach method (remove from the DOM)
	_.unbind = function() {
    $('nav.menu').addClass('noWorksheet');
    giac.clean_up();
		this.clearUndoStack();
		this.unbindUploads();
		this.unbindMouse();
		this.unbindKeyboard();
		this.unbindSettings();
		ajaxQueue.save_div.remove();
		ajaxQueue.save_div = $('<span/>');
		$('<span/>').addClass('save_span').html('Files are up to date').appendTo('nav.menu .save_message');
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
		if(ajaxQueue.saving && ajaxQueue.holding_pen[this.hash_string]) {
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
	_.findByLineNumber = function(line) {
		var children = this.children();
		var child_found = undefined;
		for(var i = 0; i < children.length; i++) {
			if(child_found) return child_found;
			child_found = children[i].findByLineNumber(line);
		}
		return child_found;
	}
	_.setWidth = function() {
		this.insertJQ.css('max-width',max(250, this.jQ.closest('.worksheet_holder_box').width() + 55) + 'px');
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
	/*
	_.updateLabels = function(list) {
		window.silentRequest('/worksheet_commands', {command: 'update_labels', data: { hash_string: this.hash_string, labels: list } }, function(response) {
			for(var i = 0; i < response.labels.length; i++) {
				if(SwiftCalcs.labelIds[response.labels[i].id*1] !== true) {
					SwiftCalcs.labelIds[response.labels[i].id*1] = true;
					SwiftCalcs.labelList.push({
						id: response.labels[i].id,
						name: response.labels[i].name,
						hash: response.labels[i].labels_hash
					});
					$("<div/>").addClass('item').append($("<div/>").addClass('label_title').html("<span class='fa fa-trash'></span>" + response.labels[i].name)).attr('data-id', response.labels[i].id).attr('data-name',response.labels[i].name).attr('data-hash',response.labels[i].labels_hash).appendTo($('.projects_list .left_item.labels .expand'));
					$('.projects_list .left_item.labels .explain').remove();
				}
			}
		});
	}
	*/
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
    if(window.embedded && window.no_save) return;
  	if(this.rights >= 3)
  		ajaxQueue.saveNeeded(this, force);
  	else if(this.rights == 2)
  		ajaxQueue.jQ.html('Create a duplicate to save your changes');
  	else
  		ajaxQueue.jQ.html('This document is view only.  Changes will not be saved.')
  }
  _.fullEvalNeeded = function() {
    // Set all items to altered
    this.commandChildren(function(_this) { if(_this.evaluatable) { _this.altered_content = true; } });
    return this;
  }
  // Evaluate the worksheet.  If var_list is set (array), these variables should be placed into the 'altered' list from the start
  _.evaluate = function(var_list, start_element, stop_id) {
    if(giac.suppress) return this;
    if(start_element || this.ends[L]) {
      if(!(start_element instanceof Element)) 
        start_element = this.ends[L];
      // if start element is in a loop, back up to the loop, assuming no stop_id was provided
      if(!stop_id) {
        start_element = start_element.findStartElement();
        for(var to_blur = start_element; to_blur !== 0; to_blur = to_blur[R]) 
          to_blur.blurOutputBox();
      }
      // Check for other evaluations in progress....if found, we should decide whether we need to evaluate, whether we should stop the other, or whether both should continue
      // Start by building a struct with all ids for previous elements
      var previous_element_ids = {}
      var el = start_element;
      while(true) {
        if(el[L]) {
          el = el[L];
          if(el.hasChildren && el.ends[R]) el = el.ends[R];
        } else if(el.parent) el = el.parent;
        else break;
        previous_element_ids[el.id] = true;
      }
      // Load list of all evaluations
      var current_evaluations = giac.current_evaluations();
      var eval_id = giac.registerEvaluation(stop_id, start_element, true);
      var new_evaluation = true;
      if(var_list && var_list.length) giac.add_altered(eval_id, var_list, start_element.id);
      for(var i = 0; i < current_evaluations.length; i++) {
        var current_evaluation = giac.evaluations[current_evaluations[i]];
        if(current_evaluation.active_id == -1) continue; //non worksheet related calculation, let it be
        // Determine action depending on relative location in worksheet of the two calculations:
        if(previous_element_ids[current_evaluation.active_id]) {
          // start_element is below the currently evaluating block
          if(previous_element_ids[current_evaluation.element_stop_id]) {
            // this evaluation is above me but will stop before reaching me.  I can simply ignore it
            continue;
          } else if(stop_id && current_evaluation.element_stop_id) {
            // the other evaluation will reach me.  Great!  Now I need to figure out which one has the 'later' stop id
            var el = Element.byId[current_evaluation.element_stop_id];
            var lower_stop_id = false;
            while(true) {
              if(el[L]) {
                el = el[L];
                if(el.hasChildren && el.ends[R]) el = el.ends[R];
              } else if(el.parent) el = el.parent;
              else break;
              if(el.id == stop_id) { lower_stop_id = true; break; }
              if(el.id == start_element.id)  break; 
            }
            if(!lower_stop_id) // I have the lower stop id.  I therefore need to adjust stop_id downwards
              giac.evaluations[current_evaluations[i]].element_stop_id = stop_id;
          } else if(current_evaluation.element_stop_id) {
            // Other calculation has a stop id, but i dont, so update it to not have a stop id
            giac.evaluations[current_evaluations[i]].element_stop_id = undefined;
            giac.evaluations[current_evaluations[i]].evaluation_full=true;
            giac.evaluations[current_evaluations[i]].manual_evaluation=false;
          } 
          // cancel myself evaluation, and make the requested eval look like that one
          new_evaluation = false;
          giac.cancelEvaluation(eval_id,current_evaluations[i]);
          start_element = Element.byId[current_evaluation.active_id];
          stop_id = giac.evaluations[current_evaluations[i]].element_stop_id;
          eval_id = current_evaluations[i];
        } else {
          // start_element is at or above the currently evaluating block
          if(stop_id && Element.byId[current_evaluation.active_id]) {
            // Determine if my stop id is above the current calculation
            var el = Element.byId[current_evaluation.active_id];
            var below_stop_id = false;
            while(true) {
              if(el[L]) {
                el = el[L];
                if(el.hasChildren && el.ends[R]) el = el.ends[R];
              } else if(el.parent) el = el.parent;
              else break
              if(el.id == stop_id) { below_stop_id = true; break; }
            }
            if(below_stop_id) {
              // Im above, but so is my stop id, so i will never interact with the other evaluation.  Move along...
              continue;
            } else if(current_evaluation.element_stop_id){
              // We overlap.  But which one has the later stop id?  
              var el = Element.byId[current_evaluation.element_stop_id];
              var lower_stop_id = false;
              while(true) {
                if(el[L]) {
                  el = el[L];
                  if(el.hasChildren && el.ends[R]) el = el.ends[R];
                } else if(el.parent) el = el.parent;
                else break;
                if(el.id == stop_id) { lower_stop_id = true; break; }
                if(el.id == start_element.id)  break; 
              }
              if(lower_stop_id) {// Other evaluation has the lower stop id.  Need to adjust current stop_id downwards
                giac.evaluations[eval_id].element_stop_id=current_evaluation.element_stop_id;
                stop_id = current_evaluation.element_stop_id;
              }
              // Now cancel the other evaluation.  I have either updated my stop id to match it, or my stop id already encompasses it
              giac.cancelEvaluation(current_evaluations[i], eval_id);
            } else {
              // We overlap, and other calculation will continue to end.  We kill that calculation and remove the stop id from this one
              giac.evaluations[eval_id].evaluation_full=true;
              giac.evaluations[eval_id].manual_evaluation=false;
              giac.evaluations[eval_id].element_stop_id=undefined;
              stop_id = undefined;
              giac.cancelEvaluation(current_evaluations[i], eval_id);
            }
          } else {
            // I wil reach the other calculation and do its work, whether it has a stop id or not, since this request has no stop request
            // I simply kill the other evaluation
            giac.cancelEvaluation(current_evaluations[i], eval_id);
          }
        } 
      }
      if(new_evaluation) window.setTimeout(function(start_element) { return function() { start_element.continueEvaluation(eval_id); }; }(start_element), 1);
      return eval_id;
    }
    return "-1";
  }
  _.toString = function() {
		var out = [];
    var past_first_line = false;
		jQuery.each(this.children(), function(i, child) {
			if(past_first_line && (child.implicit || child.no_save)) return;
      past_first_line = true;
			out.push(child.toString());
		});
		return out.join("\n");
  }
  _.allow_interaction = function () {
    return (INTERACTION_LEVEL >= INTERACTION_LEVELS.FULL);
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