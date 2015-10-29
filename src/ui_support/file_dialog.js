$(function() {
	var current_folder_id = false;
	var current_folder_navigable_url = false;
	
	var showLoadingPopup = window.showLoadingPopup = function() {
		$('.file_dialog').hide();
		$('.popup_dialog_background').addClass('shown').show();
		$('.loading_box').show();
	  $('.popup_dialog').hide();
		$('#account_bar .content, #account_bar .logo').show();
		$(document).off('keydown', keyboardListener);
	}
	var showFileDialog = window.showFileDialog = function() {
		$('.base_layout').addClass('file_dialog_open');
		$('.loading_box').hide();
		$('.popup_dialog_background').removeClass('shown').hide();
		$('.file_dialog').show();
	  $('.popup_dialog').hide();
		$('#account_bar .content, #account_bar .logo').hide();
		$(document).off('keydown', keyboardListener); // Prevent double listeners
		$(document).on('keydown', keyboardListener);
		$('.feedback_link').css('left', '0px');
	}
	var hideDialogs = window.hideDialogs = function() {
		$('.base_layout').removeClass('file_dialog_open');
		$('.popup_dialog_background').removeClass('shown').hide();
		$('.loading_box').hide();
	  $('.popup_dialog').hide();
		$('.file_dialog').hide();
		$('#account_bar .content, #account_bar .logo').show();
		$(document).off('keydown', keyboardListener);
		$('.feedback_link').css('left', '25px');
	}
  var keyboardListener = function(e) {
  	if($('.popup_dialog_background').hasClass('shown')) return;
    switch(e.which) {
      case 10: // enter iOs
      case 13: // enter
      case 32: // space
      	var selected = $('.file_dialog .file_item.selected');
      	if(selected.length != 1) return;
				if(selected.attr('data-type') == 'Invite') return;
				loadItem(selected.attr('data-type'), selected.attr('data-hash_string'), selected.attr('data-name'));
      break;
      case 38: // up
      	var selected = $('.file_dialog .file_item.selected');
      	if(selected.length == 0) 
					var to_select = $('.file_dialog .file_item').eq(0);
      	else
      		var to_select = selected.eq(0).prev('.file_item');
      	if(!e.shiftKey)
      		selected.closest('.list').find('.file_item').removeClass('selected');
      	if(to_select.length == 0) 
      		to_select = $('.file_dialog .file_item').eq(0);
      	to_select.addClass('selected');
				showInfo();
      break;
      case 40: // down
      	var selected = $('.file_dialog .file_item.selected');
      	if(selected.length == 0) 
					var to_select = $('.file_dialog .file_item').eq(0);
      	else
      		var to_select = selected.last().next('.file_item');
      	if(!e.shiftKey)
      		selected.closest('.list').find('.file_item').removeClass('selected');
      	if(to_select.length == 0) 
      		to_select = $('.file_dialog .file_item').last();
      	to_select.addClass('selected');
				showInfo();
      break;
      case 65: // Ctrl-A is select all
      	if(e.ctrlKey || e.metaKey) {
      		$('.file_dialog .file_item').addClass('selected');
					showInfo();
      		break;
      	}
      default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
  }

	var setCurrentFolder = window.setCurrentFolder = function(id, url) {
		if(url && (url.trim() != '')) {
			current_folder_id = id;
			current_folder_navigable_url = url;
		}
	}
	var newItemDialog = function(prompt, suggested_name, callbackFunction, parent_folder_id) {
		if(typeof parent_folder_id === 'undefined') parent_folder_id = current_folder_id;
		var expandCollapse = function(el) {
			if(el.find('i.fa').hasClass('fa-caret-right')) {
				// Expand
				el.find('i.fa').addClass('fa-caret-down').removeClass('fa-caret-right');
				el.next('div').show();
			} else {
				// Collapse
				el.find('i.fa').removeClass('fa-caret-down').addClass('fa-caret-right');
				el.next('div').hide();
			}
		}
		window.showLoadingOnTop();
		$.ajax({
      type: "POST",
      url: "/folders/tree",
      dataType: 'json',
      cache: false,
      data: { }, 
      success: function(response) {
      	if(response.success) {
      		window.showPopupOnTop();
      		var el = $('.popup_dialog .full').html("<div class='name'><div class='title'>" + prompt + "</div><div class='input'><input type=text></div><BR></div><div class='title'>Location</div><div class='tree'></div>");
      		if(prompt == '')
      			el.find('.name').hide();
      		el.find('.input input').val(suggested_name);
      		el.find('.tree').html(response.html);
      		el.find('.expandable i.fa').on('click', function(e) {
      			expandCollapse($(this).closest('.expandable'));
      			e.preventDefault();
      		});
      		el.find('.folder').on('click', function(e) {
      			if($(this).attr('data-id')) { // Can't select 'shared' folder as a place to store documents
	      			el.find('.folder').removeClass('selected');
	      			$(this).addClass('selected');
	      		}
	      		e.preventDefault();
      		});
      		// Select current folder, if any
      		var found_one = false;
      		el.find('.folder').each(function() {
      			if($(this).attr('data-id') && ($(this).attr('data-id')*1 == parent_folder_id*1)) {
      				found_one = true;
	      			el.find('.folder').removeClass('selected');
	      			$(this).addClass('selected');
	      			var current = $(this);
	      			while(true) {
	      				if(current.parent().closest('.expandable_content').length == 0) break;
	      				current = current.parent().closest('.expandable_content');
	      				expandCollapse(current.prev());
	      			}
      			}
      		});
      		if(!found_one) 
      			el.find('.folder').eq(0).addClass('selected');
          // Create the buttons at the bottom
          buttons = $('.popup_dialog .bottom_links').html('');
          buttons.append('<button class="submit">OK</button>');
          buttons.append('<button class="close grey">Cancel</button>');
          buttons.find('button.submit').on('click', function() {
            var name = el.find('.input input').val();
            if(prompt != '' && (name.trim() == '')) return showNotice('No name provided', 'red');
            var folder_id = el.find('.selected').attr('data-id');
            window.showLoadingOnTop();
            callbackFunction(name, folder_id);
          });
          el.find('.input input').focus();
      	}	else {
      		window.showFileDialog();
      		showNotice(response.message, 'red');
      	}
      },
      error: function(err) {
      	window.showFileDialog();
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
      }
    });
	}

	var newWorksheet = window.newWorksheet = function(duplicate) {
		if(duplicate)
			newItemDialog('Please enter a name for your new worksheet', SwiftCalcs.active_worksheet.name + ' (copy)', function(name, folder_id) { processNewWorksheet(name, folder_id, true); });
		else
			newItemDialog('Please enter a name for your new worksheet', '', function(name, folder_id) { processNewWorksheet(name, folder_id, false); });
	}
	var processNewWorksheet = function(name, folder_id, duplicate) {
		window.showLoadingPopup();
		post_data = {name: name, duplicate: duplicate ? SwiftCalcs.active_worksheet.server_id : 0, revision: duplicate ? SwiftCalcs.active_worksheet.revision_id : 0 };
		if(folder_id) post_data.folder_id = folder_id;
		$.ajax({
      type: "POST",
      url: "/worksheet_commands",
      dataType: 'json',
      cache: false,
      data: { command: duplicate ? 'copy_worksheet' : 'new_worksheet', data: post_data }, 
      success: function(response) {
      	if(response.success) {
					if(duplicate) {
						window.hidePopupOnTop();
						SwiftCalcs.active_worksheet.rename(name, response.hash_string, response.worksheet_id);
						SwiftCalcs.pushState.navigate('/worksheets/' + response.hash_string + '/' + encodeURIComponent(name.replace(/ /g,'_')));
						if(SwiftCalcs.active_worksheet.rights == 2) {
							SwiftCalcs.active_worksheet.rights = 4;
							SwiftCalcs.active_worksheet.save(true);
						} else
							SwiftCalcs.active_worksheet.rights = 4;
						SwiftCalcs.active_worksheet.generateTopWarning(); 
						// Update all uploaded file references:
				    var uploads = SwiftCalcs.active_worksheet.insertJQ.find('.sc_uploadedData');
				    var ids = {};
				    uploads.each(function(i, hash_string) {
				    	hash_string = $(hash_string);
				    	var el = SwiftCalcs.elementById(hash_string.attr('sc_element_id')*1);
				    	if(el.upload_id) ids[el.upload_id] = el;
				    });
				    for(var i = 0; i < response.to_change.length; i++) {
				    	to_change = ids[response.to_change[i].old_id*1];
				    	if(to_change) {
				    		to_change.upload_id = response.to_change[i].new_id*1;
				    		to_change.url = response.to_change[i].url;
				    	}
				    }
	  				SwiftCalcs.active_worksheet.updateUploads();
				    // Set queue to reported server contents to ensure data validity moving forward
				    SwiftCalcs.active_worksheet.reset_server_base(response.data);
					} else {
      			window.hideDialogs();
						if(SwiftCalcs.active_worksheet) SwiftCalcs.active_worksheet.unbind();
						var worksheet = SwiftCalcs.Worksheet(response.name, response.hash_string, response.worksheet_id, 1, 4, response.settings);
						worksheet.reset_server_base(worksheet.toString());
						worksheet.bind($('.worksheet_holder'));
						SwiftCalcs.elements.math().appendTo(worksheet).show().focus(-1);
						window.setTimeout(function() { SwiftCalcs.active_worksheet.blur().focus();SwiftCalcs.active_worksheet.ends[-1].focus(-1); },100);
						SwiftCalcs.pushState.navigate('/worksheets/' + response.hash_string + '/' + encodeURIComponent(response.name.replace(/ /g,'_')));
					}
      	}	else {
      		window.showFileDialog();
      		showNotice(response.message, 'red');
      	}
      },
      error: function(err) {
      	window.showFileDialog();
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
      }
    });
	}

	var newFolder = window.newFolder = function() {
		newItemDialog('Please enter a name for your new folder', '', processNewFolder);
	}

	var processNewFolder = function(name, folder_id) {
    window.showFileDialog();
    $('.file_dialog .center').html('<div style="text-align:center; font-size:60px;margin-top:40px;color:#999999;"><i class="fa fa-spinner fa-pulse"></i></div>');
		post_data = { name: name };
		if(folder_id) post_data.folder_id = folder_id;
		$.ajax({
      type: "POST",
      url: "/folders/new",
      dataType: 'json',
      cache: false,
      data: post_data, 
      success: function(response) {
      	if(response.success) {
      		SwiftCalcs.pushState.navigate('/folders/' + response.hash_string + '/' + encodeURIComponent(response.name.replace(/ /g,'_')));
    			$('.file_dialog .center').html('<div style="text-align:center; margin-top:40px;"><i>This folder is empty</i></div>');
    			setCurrentFolder(response.id, response.url_end);
					$('.file_dialog .right .content').hide();
					$('.file_dialog .right .default').show();
					info_screen_id = false;
					$('.file_dialog .top').html(response.path);
      	}	else {
    			$('.file_dialog .center').html('An error occurred');
      		showNotice(response.message, 'red');
      	}
      },
      error: function(err) {
    		$('.file_dialog .center').html('An error occurred');
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
      }
    });
	}
	var loadWorksheet = window.loadWorksheet = function(hash_string, name) {
		window.hideDialogs();
		SwiftCalcs.pushState.navigate('/worksheets/' + hash_string + '/' + encodeURIComponent(name.replace(/ /g,'_')), {trigger: true});
	}
	var loadFolder = window.loadFolder = function(hash_string, name) {
		if(hash_string) {
			current_mode = 'all'; // Once we open a folder from starred view, recent, etc, it defaults back to 'all'
			SwiftCalcs.pushState.navigate('/folders/' + hash_string + '-' + current_mode + '/' + encodeURIComponent(name.replace(/ /g,'_')), {trigger: true});
		}	else if(current_folder_navigable_url)
			SwiftCalcs.pushState.navigate(current_folder_navigable_url, {trigger: true});
		else
			SwiftCalcs.pushState.navigate('/folders/', {trigger: true});
	}
	var loadBookmark = window.loadBookmark = function(encoded_name) {
		SwiftCalcs.pushState.navigate('/bookmarks/' + encoded_name, {trigger: true});
	}
	var showInfo = function() {
		// Load info based on the current selection, if any
		if($('.file_dialog .list').find('.file_item.selected').length == 1)
			loadInfo($('.file_dialog .list').find('.file_item.selected').attr('data-type'), $('.file_dialog .list').find('.file_item.selected').attr('data-id'));
		else if($('.file_dialog .list').find('.file_item.selected').length == 0) {
			$('.file_dialog .right .content').hide();
			info_screen_id = false;
			$('.file_dialog .right .default').show();
		} else {
			var items = []
			$('.file_dialog .file_item.selected').each(function() {
				if($(this).hasClass('bookmark')) return;
				items.push([$(this).attr('data-type'), $(this).attr('data-id')]);
			});
			if(items.length) {
				if(items[0][0] == 'Invite')
					$('.file_dialog .right .content').html('<div class="title"><i class="fa fa-fw fa-files-o"></i> <span class="name">Multiple Invitations Selected</span></div><div class="actions"><div class="item batch" data-command="accept_invite"><i class="fa fa-fw fa-check-circle"></i>Accept Invitations</div><div class="item batch" data-command="reject_invite"><i class="fa fa-fw fa-times-circle"></i>Reject Invitations</div></div><div class="explain">Once accepted, files are moved from this folder to the <strong>Shared With You</strong> folder.</div>');
				else {
					$('.file_dialog .right .content').html('<div class="title"><i class="fa fa-fw fa-files-o"></i> <span class="name">Multiple Items Selected</span></div><div class="actions"><div class="item batch" data-command="move"><i class="fa fa-fw fa-share"></i>Move Items</div><div class="item batch" data-command="remove"><i class="fa fa-fw fa-trash"></i>Remove Items</div></div><div class="explain">Looking to change share settings on multiple files?  Move the files into a new directory and change sharing settings on the directory.</div>');
					if(window.user_logged_in)
						$('.file_dialog .right .actions').append('<div class="item batch" data-command="add_star"><i class="fa fa-fw fa-star"></i>Add to Starred Items</div><div class="item batch" data-command="remove_star"><i class="fa fa-fw fa-star-o"></i>Remove Form Starred Items</div>');
				}
			} else
				$('.file_dialog .right .content').html('<div class="title"><i class="fa fa-fw fa-files-o"></i> <span class="name">Multiple Bookmarks Selected</span></div><div class="explain">Trying to manage bookmarks?  You can add, edit, or remove bookmarks by editing the worksheets in which they appear.</div>');
			info_screen_id = false;
		}
	}
	var loadind_worksheet = false;
	var info_load = false;
	var info_screen_type = false;
	var info_screen_id = false;
	var loadInfo = function(data_type, id) {
		if(loadind_worksheet) return;
		if((data_type == info_screen_type) && (id == info_screen_id)) return;
		$('.file_dialog .right .content').html('<div style="text-align:center;font-size:60px;margin-top:60px;color:#999999;"><i class="fa fa-spinner fa-pulse"></i></div>');
		$('.file_dialog .right .content').show();
		$('.file_dialog .right .default').hide();
		info_screen_type = data_type;
		info_screen_id = id;
		if(info_load) {
			info_load.abort();
			$('.file_dialog .right .content').html('<div style="text-align:center;font-size:60px;margin-top:60px;color:#999999;"><i class="fa fa-spinner fa-pulse"></i></div>');
			info_load = false;
		}
		info_load = $.ajax({
      type: "POST",
      url: "/folders/info",
      dataType: 'json',
      cache: false,
      data: { data_type: info_screen_type, id: info_screen_id}, 
      success: function(response) {
      	$('.file_dialog .right .content').html(response.html);
      },
      error: function(err) {
      	$('.file_dialog .right .content').html('Error: ' + err.responseText);
      }
    });
	}
	var loadItem = function(data_type, hash_string, name) {
		if(data_type == 'Worksheet') {
			if(info_load) {
				info_load.abort();
				info_load = false;
			}
			loadind_worksheet = true;
			loadWorksheet(hash_string, name);
		} else if(data_type == 'Folder')
			loadFolder(hash_string, name);
		else
			loadBookmark(hash_string);
	}
	var destroyItem = function(data_type, data_id, full_destroy) {
		if(full_destroy)
			var msg = 'Are you sure you want to delete this item?  Any users who have access to this item through the sharing settings will also lose access. This action cannot be undone.';
		else 
			var msg = 'Are you sure you want to remove this item from your shared folders?  This action cannot be undone, and you will have to request access from the document owner to gain access in the future.'
		if(confirm(msg)) {
			$('.file_dialog .right .content').hide();
			$('.file_dialog .right .default').show();
			info_screen_id = false;
			$('.file_dialog .file_item').each(function() {
				if(($(this).attr('data-type') == data_type) && ($(this).attr('data-id') == data_id))
					$(this).remove();
			});
			if((data_type == 'Folder') && (current_folder_id*1 == data_id*1)) 
				openFileDialog('','all');
			$.ajax({
	      type: "POST",
	      url: full_destroy ? "/folders/destroy" : "/folders/remove",
	      dataType: 'json',
	      cache: false,
	      data: { data_type: data_type, id: data_id }, 
	      success: function(response) {
	      	if(!response.success) {
	      		showNotice(response.message, 'red');
	      	} 
	      },
	      error: function(err) {
	      	console.log('Error: ' + err.responseText, 'red');
					showNotice('Error: There was a server error.  We have been notified', 'red');
	      }
	    });
		}
	}
	var renameItem = function(data_type, data_id, data_name, parent_id) {
		newItemDialog('Please enter a new name for this item', data_name, function(name, folder_id) { processRenameItem(data_type, data_id, name, folder_id); }, parent_id);
	}
	var moveItem = function(data_type, data_id, data_name, parent_id) {
		newItemDialog('Please select a new location for this item', data_name, function(name, folder_id) { processRenameItem(data_type, data_id, name, folder_id); }, parent_id);
	}
	var processRenameItem = function(data_type, data_id, new_name, folder_id) {
		$('.file_dialog .file_item').each(function() {
			if(($(this).attr('data-type') == data_type) && ($(this).attr('data-id')*1 == data_id*1))
				$(this).find('.name').html(new_name);
		})
		if(data_type == 'Folder') {
			$('.file_dialog .folder_item').each(function() {
				if($(this).attr('data-id')*1 == data_id*1) {
					$(this).html(new_name);
					$(this).attr('data-name',new_name);
				}
			});
		}
		$('.file_dialog .right .name').html(new_name);
		$('.file_dialog .right .actions .item').each(function() {
			if($(this).attr('data-name'))
				$(this).attr('data-name', new_name);
		});
		$.ajax({
      type: "POST",
      url: "/folders/rename",
      dataType: 'json',
      cache: false,
      data: { data_type: data_type, id: data_id, name: new_name, folder_id: folder_id }, 
      success: function(response) {
      	window.hidePopupOnTop();
      	if(response.do_remove) {
					$('.file_dialog .right .content').hide();
					$('.file_dialog .right .default').show();
					info_screen_id = false;
      		showNotice('Item has been successfully moved', 'green');
					$('.file_dialog .file_item').each(function() {
						if(($(this).attr('data-type') == data_type) && ($(this).attr('data-id')*1 == data_id*1))
							$(this).remove();
					});
					if((data_type == 'Folder') && (current_folder_id*1 == data_id*1))
						$('.file_dialog .top').html(response.path);
      	}
      	if(!response.success) {
      		showInfo();
      		showNotice(response.message, 'red');
      	}
      },
      error: function(err) {
      	window.hidePopupOnTop();
      	showInfo();
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
      }
    });
	}
	var copyItem = function(data_type, data_id, data_name) {
		newItemDialog('Please enter a name for the copy', data_name + ' (copy)', function(name, folder_id) { processCopyItem(data_type, data_id, name, folder_id); });
	}
	var processCopyItem = function(data_type, data_id, new_name, folder_id) {
		$('.file_dialog .right .content').show();
		$('.file_dialog .right .default').hide();
		$('.file_dialog .right .content').html('<div style="text-align:center;font-size:60px;margin-top:60px;color:#999999;"><i class="fa fa-spinner fa-pulse"></i></div>');
		info_screen_id = false;
		$.ajax({
      type: "POST",
      url: "/folders/duplicate",
      dataType: 'json',
      cache: false,
      data: { data_type: data_type, id: data_id, name: new_name, folder_id: folder_id }, 
      success: function(response) {
      	window.hidePopupOnTop();
      	if(response.success) {
					$('.file_dialog .file_item').removeClass('selected');
      		if((folder_id*1) == (current_folder_id*1)) {
	      		loadInfo("Worksheet", response.id);
	      		$('.file_dialog .title').after(response.html);
						$('.file_dialog .file_item').eq(0).addClass('selected');
						addFileItemEvents($('.file_dialog .file_item').eq(0));
					} else {
						$('.file_dialog .right .default').show();
						info_screen_id = false;
						$('.file_dialog .right .content').hide();
      			showNotice('Copy Successfully Created', 'green');
					}
      	} else {
      		showInfo();
      		showNotice(response.message, 'red');
      	}
      },
      error: function(err) {
      	window.hidePopupOnTop();
      	showInfo();
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
      }
    });
	}
	var batchCommand = function(command) {
		if(command == 'move')
			newItemDialog('', '', function(name, folder_id) { processBatchCommand(folder_id, command); });
		else if(command == 'remove') {
			if(confirm('Are you sure?  Items you own will be permanenty deleted, and items shared with you will be removed from your shared folders.  These actions cannot be undone.')) processBatchCommand(0, 'remove');
		} else
			processBatchCommand(0, command);
	}
	var processBatchCommand = function(folder_id, command) {
		$('.file_dialog .right .content').show();
		$('.file_dialog .right .default').hide();
		$('.file_dialog .right .content').html('<div style="text-align:center;font-size:60px;margin-top:60px;color:#999999;"><i class="fa fa-spinner fa-pulse"></i></div>');
		info_screen_id = false;
		var items = [];
		showBookmarkNotice = true;
		$('.file_dialog .file_item.selected').each(function() {
			if($(this).hasClass('bookmark')) {
				if(showBookmarkNotice) {
					showBookmarkNotice = false;
					showNotice('Bookmarks have been removed from this request.')
				}
				return;
			}
			items.push([$(this).attr('data-type'), $(this).attr('data-id')]);
		});
		if(items.length == 0) return;
		if(items[0][0] == 'Invite') {
			var count = $('.file_dialog .invite_count');
			var new_count = count.html()*1 - items.length;
			if(new_count > 0)
				count.html(new_count);
			else
				count.hide();
		}
		$.ajax({
      type: "POST",
      url: "/folders/batch",
      dataType: 'json',
      cache: false,
      data: { command: command, items: items, folder_id: folder_id }, 
      success: function(response) {
      	window.hidePopupOnTop();
      	if(response.success) {
      		$('.file_dialog .file_item').each(function() {
      			if(response.to_remove[$(this).attr('data-type') + "_" + $(this).attr('data-id')]) $(this).remove();
      		});
      		if(command == "add_star") {
	      		$('.file_dialog .file_item.selected').each(function() {
	      			$(this).find('.td.star i').removeClass('fa-spinner fa-pulse fa-star-o').addClass('fa-star');
	      		});
      		}
      		if(command == "remove_star") {
	      		$('.file_dialog .file_item.selected').each(function() {
	      			$(this).find('.td.star i').removeClass('fa-spinner fa-pulse fa-star').addClass('fa-star-o');
	      		});
      		}
      		if(response.failed_on_one)
      			showNotice('Some items could not be changed: Insufficient access rights.', 'red');
      		if(response.circular_folder)
      			showNotice('Some folders could not be moved: Cannot move folder into itself or its subfolders', 'red');
      		showInfo();
      	} else {
      		showInfo();
      		showNotice(response.message, 'red');
      	}
      },
      error: function(err) {
      	window.hidePopupOnTop();
      	showInfo();
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
      }
    });		
	}
	var addFileItemEvents = function(els) { 
		els.on('click', function(e) {
			if(e.shiftKey && $(this).closest('.list').find('.file_item.selected').length) {
				// march forward
				var to_select = [];
				var do_it = false;
				for(var el = $(this); el.length; el = el.next('.file_item')) {
					to_select.push(el);
					if(el.hasClass('selected')) { do_it = true; break; }
				}
				if(!do_it) {
					to_select = [];
					for(var el = $(this); el.length; el = el.prev('.file_item')) {
						to_select.push(el);
						if(el.hasClass('selected')) { do_it = true; break; }
					}
				}
				if(!do_it)
					to_select = [$(this)];
				$.each(to_select, function(i, v) { v.addClass('selected'); });
			} else {
				if(!e.ctrlKey && !e.metaKey) {
					$(this).closest('.list').find('.file_item').removeClass('selected');
					$(this).addClass('selected');
				} else 
					$(this).toggleClass('selected');
			}
			showInfo();
			e.preventDefault();
		});
		els.on('dblclick', function(e) {
			if($(this).attr('data-type') == 'Invite') return;
			loadItem($(this).attr('data-type'), $(this).attr('data-hash_string'), $(this).attr('data-name'));
			e.preventDefault();
		});
		els.find('.td.star i').on('click', function(e) {
			if($(this).hasClass('fa-spinner')) return;
			if($(this).hasClass('fa-star')) {
				removeStar($(this).closest('.file_item').attr('data-type'), $(this).closest('.file_item').attr('data-id'));
			} else {
				addStar($(this).closest('.file_item').attr('data-type'), $(this).closest('.file_item').attr('data-id'));
			}
			$(this).removeClass('fa-star').removeClass('fa-star-o').addClass('fa-spinner fa-pulse');
			e.preventDefault();
			e.stopPropagation();
		});
		function dragEnter(e_drag) {
			if($(e_drag.target).closest('.file_item').hasClass('selected')) return;
			if($(e_drag.target).closest('.file_item').attr('data-type') != 'Folder') return;
			$(e_drag.target).closest('.file_item').addClass('big-border');
			e_drag.preventDefault();
		}
		function dragLeave(e_drag) {
			if($(e_drag.target).closest('.file_item').hasClass('selected')) return;
			if($(e_drag.target).closest('.file_item').attr('data-type') != 'Folder') return;
			$(e_drag.target).closest('.file_item').removeClass('big-border');
		}
		function dragOver(e_drag) {
			if($(e_drag.target).closest('.file_item').hasClass('selected')) return;
			if($(e_drag.target).closest('.file_item').attr('data-type') != 'Folder') return;
			$(e_drag.target).closest('.file_item').addClass('big-border');
			e_drag.preventDefault();
		}
		function dragDrop(e_drag) {
			var target_id = $(e_drag.target).closest('.file_item').attr('data-id');
			processBatchCommand(target_id, 'move');
			dragLeave(e_drag);
		}
		function dragEnter2(e_drag) {
			if(!$(e_drag.target).attr('data-id')) return;
			$(e_drag.target).addClass('big-border');
			e_drag.preventDefault();
		}
		function dragLeave2(e_drag) {
			if(!$(e_drag.target).attr('data-id')) return;
			$(e_drag.target).removeClass('big-border');
		}
		function dragOver2(e_drag) {
			if(!$(e_drag.target).attr('data-id')) return;
			$(e_drag.target).addClass('big-border');
			e_drag.preventDefault();
		}
		function dragDrop2(e_drag) {
			var target_id = $(e_drag.target).attr('data-id');
			processBatchCommand(target_id, 'move');
			dragLeave2(e_drag);
		}
		function dragStart(e_drag) {
			if(!$(e_drag.target).closest('.file_item').hasClass('selected')) {
				$(e_drag.target).closest('.list').find('.file_item').removeClass('selected');
	      $(e_drag.target).addClass('selected');
				loadInfo($(e_drag.target).attr('data-type'), $(e_drag.target).attr('data-id'));
			}
      e_drag.originalEvent.dataTransfer.setData("text/plain", "Draggable Element");
      $(e_drag.target).on('dragend', dragEnd);
      var to_listen = $('.file_dialog .file_item');
    	to_listen.on('dragenter', dragEnter).on('dragleave', dragLeave).on('drop', dragDrop).on('dragover', dragOver);
      var to_listen2 = $('.file_dialog .folder_path.folder_item');
    	to_listen2.on('dragenter', dragEnter2).on('dragleave', dragLeave2).on('drop', dragDrop2).on('dragover', dragOver2);
		}
		function dragEnd(e_drag) {
      var to_listen = $('.file_dialog .file_item');
    	to_listen.off('dragenter', dragEnter).off('dragleave', dragLeave).off('drop', dragDrop).off('dragover', dragOver);
      var to_listen2 = $('.file_dialog .folder_path.folder_item');
    	to_listen2.off('dragenter', dragEnter2).off('dragleave', dragLeave2).off('drop', dragDrop2).off('dragover', dragOver2);
      $(e_drag.target).off('dragend', dragEnd);
		}
		els.on('dragstart', dragStart)
	}
	var addStar = window.addStar = function(data_type, data_id) {
		toggleStar(data_type, data_id, true);
	}
	var removeStar = window.removeStar = function(data_type, data_id) {
		toggleStar(data_type, data_id, false);
	}
	var toggleStar = function(data_type, data_id, add) {
		var flipStar = function(flip) {
			$('.file_dialog .file_item').each(function() {
				if(($(this).attr('data-type') == data_type) && ($(this).attr('data-id')*1 == data_id*1)) {
					if(flip) 
						$(this).find('.td.star i').removeClass('fa-spinner').removeClass('fa-pulse').removeClass('fa-star-o').addClass('fa-star');
					else
						$(this).find('.td.star i').removeClass('fa-spinner').removeClass('fa-pulse').removeClass('fa-star').addClass('fa-star-o');
				}
				if((info_screen_id*1 == data_id*1) && (info_screen_type == data_type))
					$('.file_dialog .right .item.star').html(flip ? "<i class='fa fa-fw fa-star-o'></i>Remove from Starred Items" : "<i class='fa fa-fw fa-star'></i>Add to Starred Items")
			});
		}
		$.ajax({
      type: "POST",
      url: "/folders/star",
      dataType: 'json',
      cache: false,
      data: { data_type: data_type, id: data_id, add: add }, 
      success: function(response) {
      	if(response.success) {
					flipStar(add);
      	}	else {
					flipStar(!add);
      		showNotice(response.message, 'red');
      	}
      },
      error: function(err) {
				flipStar(!add);
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
      }
    });
	}
	var current_mode = 'all';
	var openFileDialog = window.openFileDialog = function(hash_string, mode) {
		if(mode != 'search') $('.file_dialog .search input').val('');
		loadind_worksheet = false;
		current_mode = mode;
		window.showFileDialog();
    $('.file_dialog .center').html('<div style="text-align:center; font-size:60px;margin-top:40px;color:#999999;"><i class="fa fa-spinner fa-pulse"></i></div>');
		$.ajax({
      type: "POST",
      url: "/folders",
      dataType: 'json',
      cache: false,
      data: {mode: mode, hash_string: hash_string }, 
      success: function(response) {
      	if(response.success) {
      		setCurrentFolder(response.id, response.url_end);
      		$('.file_dialog .top').html(response.path);
					$('.file_dialog .center').html(response.html);
					if(response.info && (response.info != '')) {
						info_screen_type = 'Folder';
						info_screen_id = response.id;
						$('.file_dialog .right .default').hide();
						$('.file_dialog .right .content').show();
						$('.file_dialog .right .content').html(response.info);
					} else {
						info_screen_id = false;
						$('.file_dialog .right .default').show();
						$('.file_dialog .right .content').hide();
					}
					var el = $('.file_dialog');
					addFileItemEvents(el.find('.file_item'));
      	}	else {
					$('.file_dialog .center').html('An error occurred');
      		showNotice(response.message, 'red');
      	}
      },
      error: function(err) {
				$('.file_dialog .center').html('An error occurred');
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
      }
    });
	}
	var processSearch = function() {
		var search_terms = $('.file_dialog .search input').val().trim();
		if(search_terms.length < 3)
			showNotice('Please enter at least 3 characters to search', 'red');
		else {
			current_folder_navigable_url = '/folders/' + encodeURIComponent(search_terms.replace(/( |-)/g,'_')) + '-search';
			loadFolder();
		}
	}
	var acceptInvite = function(id) {
		processInvite(id, true);
		$('.file_dialog .right .content').hide();
		$('.file_dialog .right .default').show();
		info_screen_id = false;
		$('.file_dialog .file_item').each(function() {
			if(($(this).attr('data-type') == "Invite") && ($(this).attr('data-id') == id))
				$(this).slideUp({duration: 200, always: function() { $(this).remove(); } });
		});
	}
	var acceptandOpenInvite = function(id, data_type, hash_string, name) {
		processInvite(id, true, data_type, hash_string, name);
		window.showLoadingOnTop();
	}
	var rejectInvite = function(id) {
		processInvite(id, false);
		$('.file_dialog .right .content').hide();
		$('.file_dialog .right .default').show();
		info_screen_id = false;
		$('.file_dialog .file_item').each(function() {
			if(($(this).attr('data-type') == "Invite") && ($(this).attr('data-id') == id))
				$(this).slideUp({duration: 200, always: function() { $(this).remove(); } });
		});
	}
	var processInvite = function(id, accept, data_type, hash_string, name) {
		var count = $('.file_dialog .invite_count');
		var new_count = count.html()*1 - 1;
		if(new_count > 0)
			count.html(new_count);
		else
			count.hide();
		$.ajax({
      type: "POST",
      url: "/folders/invite",
      dataType: 'json',
      cache: false,
      data: {id: id, add: accept }, 
      success: function(response) {
      	if(response.success) {
      		if(data_type)
      			loadItem(data_type, hash_string, name)
      	} else
      		showNotice(response.message, 'red');
      },
      error: function(err) {
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
      }
    });
	}
	$('.file_dialog').on('click', '.invite_accept_and_open', function(e) {
		acceptandOpenInvite($(this).attr('data-id'), $(this).attr('data-type'), $(this).attr('data-hash_string'), $(this).attr('data-name'));
		e.preventDefault();
		e.stopPropagation();
	})
	$('.file_dialog').on('click', '.invite_accept', function(e) {
		acceptInvite($(this).attr('data-id'));
		e.preventDefault();
		e.stopPropagation();
	})
	$('.file_dialog').on('click', '.invite_reject', function(e) {
		rejectInvite($(this).attr('data-id'));
		e.preventDefault();
		e.stopPropagation();
	})
	$('.file_dialog .left').on('click', '.all_folders', function(e) {
		current_folder_navigable_url = 'folders/0-all/All_Files';
		loadFolder();
	});
	$('.file_dialog').on('click', '.my_folder', function(e) {
		current_folder_navigable_url = 'folders/0-mine/Your_Files';
		loadFolder();
	});
	$('.file_dialog').on('click', '.shared_folder', function(e) {
		current_folder_navigable_url = 'folders/0-shared/Shared_Files';
		loadFolder();
	});
	$('.file_dialog').on('click', '.invites', function(e) {
		current_folder_navigable_url = 'folders/0-invites/Invitations';
		loadFolder();
	});
	$('.file_dialog').on('click', '.recent_folder', function(e) {
		current_folder_navigable_url = 'folders/0-recent/Recent_Files';
		loadFolder();
	});
	$('.file_dialog').on('click', '.starred_folder', function(e) {
		current_folder_navigable_url = 'folders/0-starred/Starred_Files';
		loadFolder();
	});
	$('.file_dialog .left').on('click', '.bookmarks', function(e) {
		current_folder_navigable_url = 'folders/0-bookmarks/All_Bookmarks';
		loadFolder();
	});
	$('.file_dialog .left').on('click', 'div.fa-search', function(e) {
		processSearch();
	});
	$('.file_dialog .left').on('keydown', '.search input', function(e) {
		if((e.which == 13) || (e.which == 10)) {
			this.blur();
			processSearch();
			e.preventDefault();
		}
	});
	$('.file_dialog .right').on('click', '.item.open', function(e) {
		loadItem($(this).attr('data-type'), $(this).attr('data-hash_string'), $(this).attr('data-name'));
		e.preventDefault();
	});
	$('.file_dialog .right').on('click', '.item.destroy', function(e) {
		destroyItem($(this).attr('data-type'), $(this).attr('data-id'), true);
		e.preventDefault();
	});
	$('.file_dialog .right').on('click', '.item.remove', function(e) {
		destroyItem($(this).attr('data-type'), $(this).attr('data-id'), false);
		e.preventDefault();
	});
	$('.file_dialog .right').on('click', '.item.share', function(e) {
		window.openSharingDialog($(this).attr('data-id')*1, $(this).attr('data-type'));
		e.preventDefault();
	});
	$('.file_dialog .right').on('click', '.item.rename', function(e) {
		renameItem($(this).attr('data-type'), $(this).attr('data-id'), $(this).attr('data-name'), $(this).attr('data-parent'));
		e.preventDefault();
	});
	$('.file_dialog .right').on('click', '.item.move', function(e) {
		moveItem($(this).attr('data-type'), $(this).attr('data-id'), $(this).attr('data-name'), $(this).attr('data-parent'));
		e.preventDefault();
	});
	$('.file_dialog .right').on('click', '.item.copy', function(e) {
		copyItem($(this).attr('data-type'), $(this).attr('data-id'), $(this).attr('data-name'));
		e.preventDefault();
	});
	$('.file_dialog .right').on('click', '.item.batch', function(e) {
		batchCommand($(this).attr('data-command'));
		e.preventDefault();
	});
	$('.file_dialog .right').on('click', '.item.star', function(e) {
		if($(this).find('i.fa').hasClass('fa-spinner')) return;
		if($(this).find('i.fa').hasClass('fa-star-o')) {
			removeStar($(this).attr('data-type'), $(this).attr('data-id'));
		} else {
			addStar($(this).attr('data-type'), $(this).attr('data-id'));
		}
		$(this).html("<i class='fa fa-fw fa-spinner fa-pulse'></i>Loading...");
		e.preventDefault();
	});
	$('.file_dialog .new_worksheet').on('click', function(e) {
		newWorksheet(false);
		e.preventDefault();
	});
	$('.file_dialog .new_folder').on('click', function(e) {
		newFolder();
		e.preventDefault();
	});
	$('.file_dialog').on('click', '.folder_item', function(e) {
		loadItem("Folder", $(this).attr('data-hash_string'), $(this).attr('data-name'));
		e.preventDefault();
	});
	// Increase timeout time links 
	$('body').on('click','a.increase_timeout', function(e) {
		SwiftCalcs.giac.worker.postMessage(JSON.stringify({ increase_timeout: true }));
		var el = SwiftCalcs.elementById($(e.target).closest('.sc_element').attr('sc_element_id') || -1);
		if(el)
			el.evaluate(true);
		$(this).remove();
		return false;
	});

});