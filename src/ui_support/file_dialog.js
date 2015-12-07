$(function() {
	var current_project_id = false;
	var current_project_navigable_url = false;
	
	var showLoadingPopup = window.showLoadingPopup = function() {
		$('.file_dialog').hide();
		$('.popup_dialog_background').addClass('shown').show();
		$('.loading_box').show();
	  $('.popup_dialog').hide();
		$('#account_bar .content, #account_bar .logo').show();
	}
	var showFileDialog = window.showFileDialog = function() {
		$('.base_layout').addClass('file_dialog_open');
		$('.loading_box').hide();
		$('.popup_dialog_background').removeClass('shown').hide();
		$('.file_dialog').show();
	  $('.popup_dialog').hide();
		$('#account_bar .content, #account_bar .logo').hide();
		$('.feedback_link').css('left', '0px');
	}
	var hideDialogs = window.hideDialogs = function() {
		$('.base_layout').removeClass('file_dialog_open');
		$('.popup_dialog_background').removeClass('shown').hide();
		$('.loading_box').hide();
	  $('.popup_dialog').hide();
		$('.file_dialog').hide();
		$('#account_bar .content, #account_bar .logo').show();
		$('.feedback_link').css('left', '25px');
	}
	var resizePopup = window.resizePopup = function(center) {
		$('.popup_dialog').css('bottom', 'auto');
		if(center === true) {
			var high = $('.popup_dialog .full').prop("scrollHeight") + 70;
			var available = Math.max(400, $(window).height());
			if(high > (available-200))
				$('.popup_dialog').css('top', 60 + 'px').css('bottom', 100 + 'px');
			else 
				$('.popup_dialog').css('top', Math.floor((available - high)/2) + 'px').css('bottom', Math.floor((available - high)/2) + 'px');
		} else
			$('.popup_dialog').css('top', 60 + 'px').css('bottom', 100 + 'px');
	}
	var openFileDialog = window.openFileDialog = function(hash_string, archive) {
    $('.worksheet_holder').html('<div style="text-align:center; font-size:60px;margin-top:40px;color:#999999;"><i class="fa fa-spinner fa-pulse"></i></div>');
    data = { hash_string: hash_string };
    if(archive) data.show_archived = true;
    if($('.star_select').hasClass('on')) data.star = true;
		$.ajax({
      type: "POST",
      url: "/projects",
      dataType: 'json',
      cache: false,
      data: data,
      success: function(response) {
      	if(response.success) {
      		window.displayWorksheetList(response.worksheets)
      		setCurrentProject(response.id, response.url_end);
      	}	else {
					$('.worksheet_holder').html('An error occurred');
      		showNotice(response.message, 'red');
      	}
      },
      error: function(err) {
				$('.worksheet_holder').html('An error occurred');
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
      }
    });
	}
	var setCurrentProject = window.setCurrentProject = function(id, url) {
		current_project_id = id;
		current_project_navigable_url = url;
	}
	var loadWorksheet = window.loadWorksheet = function(hash_string, name) {
    window.hidePopupOnTop();
		SwiftCalcs.pushState.navigate('/worksheets/' + hash_string + '/' + encodeURIComponent(name.replace(/ /g,'_')), {trigger: true});
	}
	var loadProject = window.loadProject = function(hash_string, name, archive) {
		if(hash_string && (hash_string == 'active'))
			SwiftCalcs.pushState.navigate('/active/', {trigger: true});
		else if(hash_string && (hash_string == 'archive'))
			SwiftCalcs.pushState.navigate('/archive/', {trigger: true});
		else if(hash_string && archive)
			SwiftCalcs.pushState.navigate('/archive_projects/' + hash_string + '/' + encodeURIComponent(name.replace(/ /g,'_')), {trigger: true});
		else if(hash_string)
			SwiftCalcs.pushState.navigate('/projects/' + hash_string + '/' + encodeURIComponent(name.replace(/ /g,'_')), {trigger: true});
		else if(current_project_navigable_url)
			SwiftCalcs.pushState.navigate(current_project_navigable_url, {trigger: true});
		else
			SwiftCalcs.pushState.navigate('/active/', {trigger: true});
	}
	$('body').on('click', '.project_title.expandable, .title.expandable', function(e) {
		var $container = $(this).closest('div.item');
		if($container.hasClass('closed')) {
			$container.removeClass('closed');
			$container.children('.expand').slideDown(150);
		} else {
			$container.addClass('closed');
			$container.children('.expand').slideUp(150);
		}
	});
	$('body').on('click', '.project_title', function(e) {
		var $container = $(this).closest('div.item');
		window.loadProject($container.attr('data-hash'), $container.attr('data-name'), $container.closest('.archive').length > 0);
	});

	var month_string = function(date) {
		var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		var today = new Date();
		var string = monthNames[date.getMonth()];
		if(today.getFullYear() != date.getFullYear()) string += ' ' + date.getFullYear();
		return string;
	}
	var worksheet_html = function(w) {
		return "<span class='select_box'><i class='fa fa-square-o'></i><i class='fa fa-check-square-o'></i></span>"
			+ "<span class='name'>" + w.name + "</span>"
			+ "<span class='icons'><i class='fa fa-external-link' title='Open in New Window'></i><i class='fa fa-print' title='Print'></i><i class='fa fa-files-o' title='Make a Copy'></i><i class='fa fa-archive archive' title='Archive'></i><i class='fa fa-archive unarchive' title='Restore'></i></span>"
			+ "<span class='star'><i class='fa fa-star" + (w.star_id ? '' : '-o') + "' title='Add or Remove Star'></i></span>"
			+ "<span class='menu'><i class='fa fa-ellipsis-v' title='Options Menu'></i></span>";
	}
	var displayWorksheetList = window.displayWorksheetList = function(worksheets) {
		clear_batch();
		// Assumes worksheets already sorted by date from latest to earliest
		$('.worksheet_holder').html('');
		var d = new Date();
		d.setHours(0,0,0,0);
		var in_box = false;
		var box = false;
		var index = 0;
		var time_splits = [d, d-24*3600, d-7*24*3600];
		var time_names = ['Today', 'Yesterday', 'Last Seven Days'];
		var current_month_string = '';
		for(var i = 0; i < worksheets.length; i++) {
			worksheets[i].updated_at = new Date(worksheets[i].updated_at * 1000);
			if(in_box) {
			  if((index < time_splits.length) && (worksheets[i].updated_at < d)) in_box = false;
				if((index >= time_splits.length) && (current_month_string != month_string(worksheets[i].updated_at))) in_box = false;
				if(!in_box) box.appendTo('.worksheet_holder')
			}
			if(!in_box) {
				if((index == 0) && (worksheets[i].updated_at >= time_splits[0])) {
					d = time_splits[0];
					index = 1;
					current_month_string = 'Today';
				} else if((index <= 1) && (worksheets[i].updated_at >= time_splits[1])) {
					d = time_splits[1];
					index = 2;
					current_month_string = 'Yesterday';
				} else if((index <= 2) && (worksheets[i].updated_at >= time_splits[2])) {
					d = time_splits[2];
					index = 3;
					current_month_string = 'Last Seven Days';
				} else {
					index = time_splits.length;
					current_month_string = month_string(worksheets[i].updated_at);
				}
				$('<div/>').addClass('date_box').html(current_month_string).appendTo('.worksheet_holder');
				box = $('<div/>').addClass('worksheet_holder_box');
				in_box = true;
			}
			var el = $('<div/>').addClass('worksheet_item').addClass('worksheet_id_' + worksheets[i].id).attr('data-id', worksheets[i].id).html(worksheet_html(worksheets[i])).appendTo(box);
			if(worksheets[i].archive_id) el.addClass('archived');
		}
		if(in_box) box.appendTo('.worksheet_holder')
	}
	var addStar = window.addStar = function(data_id) {
		toggleStar(data_id, true);
	}
	var removeStar = window.removeStar = function(data_id) {
		toggleStar(data_id, false);
	}
	var toggleStar = function(data_id, add) {
		var flipStar = function(flip) {
			$('.worksheet_item').each(function() {
				if($(this).attr('data-id')*1 == data_id*1) {
					if(flip) 
						$(this).find('i.star').removeClass('fa-spinner').removeClass('fa-pulse').removeClass('star').addClass('fa-star');
					else
						$(this).find('i.star').removeClass('fa-spinner').removeClass('fa-pulse').removeClass('star').addClass('fa-star-o');
				}
			});
		}
		$.ajax({
      type: "POST",
      url: "/projects/star",
      dataType: 'json',
      cache: false,
      data: { id: data_id, add: add }, 
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
	$('body').on('click', '.worksheet_item i.fa-star, .worksheet_item i.fa-star-o', function(e) {
		var w_id = $(this).closest('.worksheet_item').attr('data-id');
		if($(this).hasClass('fa-star')) {
			removeStar(w_id);
		} else {
			addStar(w_id);
		}
		$(this).removeClass('fa-star-o').removeClass('fa-star').addClass('fa-spinner').addClass('fa-pulse').addClass('star');
		e.preventDefault();
		e.stopPropagation();
	});
	// Batch (multiple select)
	var batch_toolbar = function(tot) {
		var tempBar = SwiftCalcs.toolbar($('#toolbar_holder'));
		tempBar.attachToolbar({
			klass: ['batchToolbar'],
			batch: function(command) {
				window.batchCommand(command);
			}
		}, tempBar.batchToolbar(tot));
		tempBar.reshapeToolbar();
	}
	var clear_batch = window.clear_batch = function() {
		$('.worksheet_item').removeClass('selection');
		$('.worksheet_item.selected').removeClass('selected');
		var tempBar = SwiftCalcs.toolbar($('#toolbar_holder'));
		tempBar.attachToolbar($(this), tempBar.mathToolbar());
		tempBar.blurToolbar();
		tempBar.reshapeToolbar();
	}
	$('body').on('click', '.select_box .fa-square-o', function(e) {
		$(this).closest('.worksheet_item').addClass('selected');
		$('.worksheet_item').addClass('selection');
		var tot = $('.worksheet_item.selected').length;
		if(SwiftCalcs.active_worksheet) SwiftCalcs.active_worksheet.detachToolbar();
		batch_toolbar(tot);
		e.preventDefault();
		e.stopPropagation();
	});
	$('body').on('click', '.select_box .fa-check-square-o', function(e) {
		$(this).closest('.worksheet_item').removeClass('selected');
		var tot = $('.worksheet_item.selected').length;
		if(tot > 0) batch_toolbar(tot);
		else clear_batch();
		e.preventDefault();
		e.stopPropagation();
	});
	var batchCommand = window.batchCommand = function(command) {
		if(command == 'move')
			moveDialog(function(project_id) { processBatchCommand(project_id, command); });
		else if(command == 'clear')
			clear_batch();
		else 
			processBatchCommand(0, command);
	}
	var processBatchCommand = function(project_id, command) {
		var items = [];
		$('.worksheet_item.selected').each(function() {
			items.push($(this).attr('data-id'));
		});
		if(items.length == 0) return;
		showLoadingOnTop();
		if(command == 'Invite') {
			var count = $('.leftbar .invite_count');
			var new_count = count.html()*1 - items.length;
			if(new_count > 0)
				count.html(new_count);
			else
				count.hide();
		}
		$.ajax({
      type: "POST",
      url: "/projects/batch",
      dataType: 'json',
      cache: false,
      data: { command: command, items: items, project_id: project_id, current_project_id: current_project_id }, 
      success: function(response) {
      	window.hidePopupOnTop();
      	if(response.success) {
      		$('.worksheet_item').each(function() {
      			if(response.to_remove[$(this).attr('data-id')]) {
      				$(this).removeClass('selected');
      				$(this).slideUp({ duration: 200, always: function() { $(this).remove(); } });
      			}
      		});
      		if(command == "add_star") {
	      		$('.worksheet_item.selected').each(function() {
	      			$(this).find('.fa-star-o').removeClass('fa-spinner fa-pulse fa-star-o').addClass('fa-star');
	      		});
      		}
      		if(command == "remove_star") {
	      		$('.worksheet_item.selected').each(function() {
	      			$(this).find('.fa-star').removeClass('fa-spinner fa-pulse fa-star').addClass('fa-star-o');
	      		});
      		}
      		if(response.failed_on_one)
      			showNotice('Some items could not be changed: Insufficient access rights.', 'red');
					var tot = $('.worksheet_item.selected').length;
					if(tot > 0) batch_toolbar(tot);
					else clear_batch();
      	} else {
      		showNotice(response.message, 'red');
      	}
      },
      error: function(err) {
      	window.hidePopupOnTop();
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
      }
    });		
	}
	var moveDialog = function(callbackFunction, parent_project_id) {
		if(typeof parent_project_id === 'undefined') parent_project_id = current_project_id;
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
      url: "/projects/tree",
      dataType: 'json',
      cache: false,
      data: { }, 
      success: function(response) {
      	if(response.success) {
      		window.showPopupOnTop();
      		var el = $('.popup_dialog .full').html("<div class='title'>Move into which project?</div><div class='tree'></div><div class='explain'>Only projects for which you have write permissions are shown</div>");
      		el.find('.tree').html(response.html);
      		el.find('.expandable i.fa').on('click', function(e) {
      			expandCollapse($(this).closest('.expandable'));
      			e.preventDefault();
      		});
      		el.find('.project').on('click', function(e) {
      			el.find('.project').removeClass('selected');
      			$(this).addClass('selected');
	      		e.preventDefault();
      		});
      		// Select current folder, if any
      		var found_one = false;
      		el.find('.project').each(function() {
      			if($(this).attr('data-id') && ($(this).attr('data-id')*1 == parent_project_id*1)) {
      				found_one = true;
	      			el.find('.project').removeClass('selected');
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
      			el.find('.project').eq(0).addClass('selected');
          // Create the buttons at the bottom
          buttons = $('.popup_dialog .bottom_links').html('');
          buttons.append('<button class="submit">Move</button>');
          buttons.append('<button class="close grey">Cancel</button>');
          buttons.find('button.submit').on('click', function() {
            var project_id = el.find('.selected').attr('data-id');
            window.showLoadingOnTop();
            callbackFunction(project_id);
          });
    			window.resizePopup();
      	}	else {
      		window.hidePopupOnTop();
      		showNotice(response.message, 'red');
      	}
      },
      error: function(err) {
      	window.hidePopupOnTop();
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
      }
    });
	}
	var promptDialog = function(prompt, button_text, suggested_name, callbackFunction) {
    window.showPopupOnTop();
    var el = $('.popup_dialog .full').html("<div class='title'>" + prompt + "</div><div class='input'><input type=text></div>");
    // Create the buttons at the bottom
    buttons = $('.popup_dialog .bottom_links').html('');
    buttons.append('<button class="submit">' + button_text + '</button>');
    buttons.append('<button class="close grey">Cancel</button>');
    el.find('.input input').val(suggested_name);
    buttons.find('button.submit').on('click', function() {
      var name = el.find('.input input').val();
      if(name.trim() == '') return showNotice('No name provided', 'red');
      window.showLoadingOnTop();
      callbackFunction(name);
    });
    resizePopup(true);
    el.find('input').focus();
	}
	var newProject = window.newProject = function(parent_project_id) {
		if(typeof parent_project_id === 'undefined') parent_project_id = current_project_id;
		promptDialog('Name your new project', 'Create', '', function(parent_project_id) { return function(name) { processNewProject(name, parent_project_id) }; }(parent_project_id));
	}
	var processNewProject = function(name, parent_project_id) {
		window.showLoadingOnTop();
		post_data = { name: name };
		if(parent_project_id) post_data.project_id = parent_project_id;
		$.ajax({
      type: "POST",
      url: "/projects/new",
      dataType: 'json',
      cache: false,
      data: post_data, 
      success: function(response) {
      	window.hidePopupOnTop();
      	if(response.success) {
      		showNotice('Project Created', 'green');
      		var found = false;
      		$('.project_list').find('.item').each(function() {
      			if($(this).attr('data-id') == response.parent_project_id) {
      				$(response.html).appendTo($(this).children('.expand'));
      				if($(this).closest('.archive').length) return;
      				$(this).removeClass('no_arrows').removeClass('closed');
      				$(this).children('.project_title').addClass('expandable');
      				$(this).children('.expand').show();
      			}
      		});
      		if(!found) 
      			$(response.html).appendTo('.project_list');
      	}	else {
      		showNotice(response.message, 'red');
      	}
      },
      error: function(err) {
      	window.hidePopupOnTop();
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
      }
    });
	}
	$('body').on('click', '.leftbar span.fa-plus-circle', function(e) {
		if($(this).attr('data-type') == 'project') window.newProject(null);
		// NEW UI: create new label?
		e.preventDefault();
		e.stopPropagation();
	});

	$('body').on('click', '.project_title .fa-cog', function(e) {
		var archived = $(this).closest('.archive').length > 0;
		var offset = $(this).offset();
		var top = offset.top - $(window).scrollTop();
		var left = offset.left - $(window).scrollLeft();
		var project_id = $(this).closest('.item').attr('data-id');
		var project_name = $(this).closest('.item').attr('data-name');
		var el = $(this).closest('.item');
		var closeMenu = function() {
			$('.project_menu').remove();
			$('.project_title.highlight').removeClass('highlight');
		}
		closeMenu();
		$(this).closest('.project_title').addClass('highlight');
		var menu = $('<div/>').addClass('project_menu').on('mouseleave', function(e) {
			closeMenu();
		});
		if(archived) {
			$('<div/>').html('<i class="fa fa-fw fa-archive"></i>Restore Project').on('click', function(e) {
				// Restore
				el.find('.fa-cog').removeClass('fa-cog').addClass('fa-spinner').addClass('fa-pulse');
				window.ajaxRequest("/projects/archive", { add: "false", id: project_id, data_type: 'Project'}, function(response) { 
					showNotice('Project and all sub-projects and worksheets restored.','green'); 
					$('.left_item.projects > .expand').html(response.tree); el.find('.fa-spinner').removeClass('fa-spinner').removeClass('fa-pulse').addClass('fa-cog'); 					
					if(!window.location.href.match(/\/archive_projects\//) && !window.location.href.match(/.com(:3000)?\/archive/)) {
						// Not in an archive view, so refresh
						SwiftCalcs.pushState.loadUrl();
					} else {
						// in an archive view...remove returned ids
						for(var i = 0; i < response.ids.length; i++) {
							$('.worksheet_id_' + response.ids[i]).slideUp({duration: 200, always: function() { $(this).remove(); } });
						}
					}
				}, function() { el.find('.fa-spinner').removeClass('fa-spinner').removeClass('fa-pulse').addClass('fa-cog'); });
				closeMenu();
			}).appendTo(menu);
		} else {
			$('<div/>').html('<i class="fa fa-fw fa-plus"></i>Add Sub-Project').on('click', function(e) {
				window.newProject(project_id);
				closeMenu();
			}).appendTo(menu);
			$('<div/>').html('<i class="fa fa-fw fa-user-plus"></i>Manage Sharing').on('click', function(e) {
				window.openSharingDialog(project_id*1, 'Project');
				closeMenu();
			}).appendTo(menu);
			$('<div/>').html('<i class="fa fa-fw fa-archive"></i>Archive Project').on('click', function(e) {
				// Archive
				el.find('.fa-cog').removeClass('fa-cog').addClass('fa-spinner').addClass('fa-pulse');
				window.ajaxRequest("/projects/archive", { add: "true", id: project_id, data_type: 'Project'}, function(response) { 
					el.slideUp({duration: 200, always: function() { el.remove(); } }); 
					if(!window.location.href.match(/\/archive_projects\//) && !window.location.href.match(/.com(:3000)?\/archive/)) {
						// Not in an archive view, so remove returned ids
						for(var i = 0; i < response.ids.length; i++) {
							$('.worksheet_id_' + response.ids[i]).slideUp({duration: 200, always: function() { $(this).remove(); } });
						}
					} else {
						// in an archive view...so refresh
						SwiftCalcs.pushState.loadUrl();
					}
				}, function() { el.find('.fa-spinner').removeClass('fa-spinner').removeClass('fa-pulse').addClass('fa-cog'); });
				closeMenu();
			}).appendTo(menu);
			$('<div/>').html('<i class="fa fa-fw fa-pencil-square-o"></i>Rename Project').on('click', function(e) {
				promptDialog('Rename your project', 'Rename', project_name, function(el, project_id) { return function(name) { processRename(el, project_id, name) }; }(el, project_id));
				closeMenu();
			}).appendTo(menu);
		}
		menu.appendTo('.base_layout').css('top', top + 'px').css('left', left + 'px');
		e.preventDefault();
		e.stopPropagation();
	});

	var processRename = function(el, project_id, new_name) {
		el.attr('data-name', new_name);
		el.children('.project_title').children('.name').html(new_name);
		window.ajaxRequest("/projects/rename", { id: project_id, name: new_name }, function() { 
			window.hidePopupOnTop(); 
      $('.project_list').find('.item').each(function() {
      	if($(this).attr('data-id') == project_id) 
      		$(this).children('.project_title').children('.name').html(new_name);
      });
		}, function() { window.hidePopupOnTop(); });
	}
	// Archive button
	$('body').on('click', '.worksheet_item i.fa-archive', function(e) {
		var w_id = $(this).closest('.worksheet_item').attr('data-id');
		if($(this).closest('.worksheet_item').hasClass('archived')) {
			unArchive(w_id, 'Worksheet');
		} else {
			Archive(w_id, 'Worksheet');
		}
		$(this).removeClass('fa-archive').addClass('fa-spinner').addClass('fa-pulse').addClass('archive');
		e.preventDefault();
		e.stopPropagation();
	});
	var Archive = window.Archive = function(data_id, data_type) {
		toggleArchive(data_id, data_type, true);
	}
	var unArchive = window.unArchive = function(data_id, data_type) {
		toggleArchive(data_id, data_type, false);
	}
	var toggleArchive = function(data_id, data_type, add) {
		if(data_type == 'Worksheet') {
			var flipArchive = function(flip) {
				$('.worksheet_item').each(function() {
					if($(this).attr('data-id')*1 == data_id*1) {
						if(!flip) {
							$(this).find('i.archive').removeClass('fa-spinner').removeClass('fa-pulse').removeClass('archive').addClass('fa-archive');
							return;
						} else {
							var to_rem = $(this);
							to_rem.slideUp({duration: 200, always: function() { to_rem.remove(); } });
						}
					}
				});
			}
		} else {
			var flipArchive = function(flip) {

			}
		}
		window.ajaxRequest("/projects/archive", { id: data_id, data_type: data_type, add: add }, function() { flipArchive(true); }, function() { flipArchive(false); });
	}
	$('body').on('click', '.archive_not_loaded', function(e) {
		$(this).children('.project_list').html('<i class="fa fa-spinner fa-pulse"></i>').addClass('archive_tree');
		$(this).removeClass('archive_not_loaded');
		window.ajaxRequest("/projects/archive_tree", { }, function(response) { $('.archive_tree').html(response.archive_html).removeClass('archive_tree'); }, function() { $('.archive_tree').html('An error occurred').removeClass('archive_tree').closest('.left_item').addClass('archive_not_loaded'); });
	});
	var closeActive = function(el) { 
		el.each(function() {
			var wrapper_box = $(this);
			var prev_box = wrapper_box.prev();
			wrapper_box.animate({'margin-left':0, 'margin-right': 0, 'padding-top': "-=15", 'padding-bottom': "-=15"}, {duration: 250});
			wrapper_box.children('.active_holder').children('.content').slideUp({duration: 250});
			var timeout_function = function() {};
			if(prev_box)
				window.setTimeout(function() { prev_box.removeClass('add_bottom_border'); }, 275);
			window.setTimeout(function() {
				if(wrapper_box.hasClass('add_bottom_border')) wrapper_box.children('.active_holder').children('.worksheet_item').addClass('add_bottom_border');
				wrapper_box.children('.active_holder').children('.worksheet_item').detach().insertBefore(wrapper_box);
				wrapper_box.remove();
			}, 275);
		});
		// TODO: Unbind worksheet as well
	};
	var openActive = function(el) {
		// TODO: NEED TO ADD SCROLL FIXING!
		closeActive($('.active_worksheet'));
		var before_item = el.prev();
		var after_item = el.next();
		var wrapper_box = $('<div/>').addClass('active_worksheet').insertAfter(el);
		var wrapper = $('<div/>').addClass('active_holder').appendTo(wrapper_box);
		el.detach().appendTo(wrapper);
		// TODO: if before item is a wrapper, we need to add border to it's item!
		if(before_item.length) 
			before_item.addClass('add_bottom_border');
		else 
			wrapper_box.css({'margin-top': '-10px', 'padding-top': '10px'});
		if(after_item.length == 0)
			wrapper_box.css({'margin-bottom': '-10px', 'padding-bottom': '10px'});
		$content = $('<div style="height: 300px;margin-top: 25px;" class="content">CONTENT</div>').hide();
    var menu_height = Math.max(Math.max(40, $("#account_bar td.middle").height()), $("#account_bar td.right").height()) + $('#toolbar_holder').height();
		$content.appendTo(wrapper).slideDown({duration: 250, progress: function() {
			var offset = wrapper_box.offset();
			var to_scroll = Math.max(0, $(window).scrollTop() - offset.top + menu_height);
			if(to_scroll > 0) $(window).scrollTop($(window).scrollTop() - to_scroll);
		}});
		wrapper_box.animate({'margin-left':-30, 'margin-right': -30, 'padding-top': "+=15", 'padding-bottom': "+=15"}, {duration: 250});
	}
	$('body').on('click', '.worksheet_item', function(e) {
		if($(this).closest('.active_worksheet').length) 
			closeActive($(this).closest('.active_worksheet')); 
		else {
			openActive($(this));
		}
	});
























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























	var newItemDialog = function(prompt, suggested_name, callbackFunction, parent_project_id) {
		if(typeof parent_project_id === 'undefined') parent_project_id = current_project_id;
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
      			if($(this).attr('data-id') && ($(this).attr('data-id')*1 == parent_project_id*1)) {
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
          window.resizePopup();
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

	var showInfo = function() {
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
			if((data_type == 'Folder') && (current_project_id*1 == data_id*1)) 
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
					if((data_type == 'Folder') && (current_project_id*1 == data_id*1))
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
      		if((folder_id*1) == (current_project_id*1)) {
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
	var current_mode = 'all';


	var processSearch = function() {
		var search_terms = $('.file_dialog .search input').val().trim();
		if(search_terms.length < 3)
			showNotice('Please enter at least 3 characters to search', 'red');
		else {
			current_project_navigable_url = '/folders/' + encodeURIComponent(search_terms.replace(/( |-)/g,'_')) + '-search';
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
		current_project_navigable_url = 'folders/0-all/All_Files';
		loadFolder();
	});
	$('.file_dialog').on('click', '.my_folder', function(e) {
		current_project_navigable_url = 'folders/0-mine/Your_Files';
		loadFolder();
	});
	$('.file_dialog').on('click', '.shared_folder', function(e) {
		current_project_navigable_url = 'folders/0-shared/Shared_Files';
		loadFolder();
	});
	$('.file_dialog').on('click', '.invites', function(e) {
		current_project_navigable_url = 'folders/0-invites/Invitations';
		loadFolder();
	});
	$('.file_dialog').on('click', '.recent_folder', function(e) {
		current_project_navigable_url = 'folders/0-recent/Recent_Files';
		loadFolder();
	});
	$('.file_dialog').on('click', '.starred_folder', function(e) {
		current_project_navigable_url = 'folders/0-starred/Starred_Files';
		loadFolder();
	});
	$('.file_dialog .left').on('click', '.bookmarks', function(e) {
		current_project_navigable_url = 'folders/0-bookmarks/All_Bookmarks';
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