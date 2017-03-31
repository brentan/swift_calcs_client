$(function() {
	var current_project_hash = false;
	var current_project_no_save = false;
	var current_project_navigable_url = false;
	
	var showLoadingPopup = window.showLoadingPopup = function() {
		window.showLoadingOnTop();
	}
	var hideDialogs = window.hideDialogs = function() {
		$('.base_layout').removeClass('file_dialog_open');
		$('.popup_dialog_background').removeClass('shown').hide();
		$('.loading_box').hide();
	  $('.popup_dialog').hide();
		$('.feedback_link').css('left', '25px');
	}
	var allowNewProject = true;
	var openFileDialog = window.openFileDialog = function(hash_string, archive, starred) {
    if(SwiftCalcs.active_worksheet) SwiftCalcs.active_worksheet.unbind();
    $('.worksheet_holder').html('<div style="text-align:center; font-size:60px;margin-top:40px;color:#999999;"><i class="fa fa-spinner fa-pulse"></i></div>');
    data = { hash_string: hash_string };
    if(archive) data.show_archived = true;
    //if(labels_hash) data.labels_hash = labels_hash;
    if(starred) data.star = true;
    data.sort_by = window.sort_by;
    if($('div.search_bar input').length && ($('div.search_bar input').val().trim().length > 0)) data.search_term = $('div.search_bar input').val().trim();
		$.ajax({
      type: "POST",
      url: "/projects",
      dataType: 'json',
      cache: false,
      data: data,
      success: function(response) {
      	if(response.success) {
      		SwiftCalcs.pushState.last_active_title = response.path.replace(/(<([^>]+)>)/ig,"");
      		$(document).prop('title', SwiftCalcs.pushState.last_active_title);
      		allowNewProject = !response.onshape || response.has_parent;
      		window.displayWorksheetList(response.worksheets, response.path, response.onshape, response.fusion)
      		setCurrentProject(response.hash_string, response.url_end, response.no_save);
      	}	else {
					$('.worksheet_holder').html('An error occurred: ' + response.message);
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
	window.current_project_hash = function() {
		return current_project_hash;
	}
	window.current_project_no_save = function() {
		return current_project_no_save;
	}
	window.current_project_navigable_url = function() {
		return current_project_navigable_url;
	}
	var setCurrentProject = window.setCurrentProject = function(hash, url, no_save) {
		current_project_hash = hash;
		current_project_no_save = no_save;
		current_project_navigable_url = url;
	}
	var loadProject = window.loadProject = function(hash_string, name, archive, starred) {
		if(hash_string && (hash_string == 'active')) {
			window.trackEvent("Project", "Load", "Active");
			SwiftCalcs.pushState.navigate('/active/', {trigger: true});
		}
		else if(hash_string && (hash_string == 'starred')) {
			window.trackEvent("Stars", "Load");
			SwiftCalcs.pushState.navigate('/starred/', {trigger: true});
		}
		else if(hash_string && (hash_string == 'invites')) {
			window.trackEvent("Invite", "Load");
			SwiftCalcs.pushState.navigate('/invites/', {trigger: true});
		}
		else if(hash_string && (hash_string == 'archive')) {
			window.trackEvent("Project", "Load", "Archive");
			SwiftCalcs.pushState.navigate('/archive/', {trigger: true});
		}
		else if(hash_string && (hash_string == 'team')) {
			window.trackEvent("Project", "Load", "Team");
			SwiftCalcs.pushState.navigate('/team/', {trigger: true});
		}
		else if(hash_string && (hash_string == 'shared')) {
			window.trackEvent("Project", "Load", "Shared");
			SwiftCalcs.pushState.navigate('/shared/', {trigger: true});
		}
		else if(hash_string && (hash_string == 'my_docs')) {
			window.trackEvent("Project", "Load", "MyDocs");
			SwiftCalcs.pushState.navigate('/my_docs/', {trigger: true});
		}
		else if(hash_string && (hash_string == 'onshape_docs')) {
			window.trackEvent("Project", "Load", "onshape_docs");
			SwiftCalcs.pushState.navigate('/onshape_docs/', {trigger: true});
		}
		else if(hash_string && (hash_string == 'fusion_docs')) {
			window.trackEvent("Project", "Load", "fusion_docs");
			SwiftCalcs.pushState.navigate('/fusion_docs/', {trigger: true});
		}
		else if(hash_string && archive) {
			window.trackEvent("Project", "Load", "Archive: " + hash_string);
			SwiftCalcs.pushState.navigate('/archive_projects/' + hash_string + '/' + encodeURIComponent(name.replace(/( |\\|\.)/g,'_')), {trigger: true});
		}
		else if(hash_string && starred) {
			window.trackEvent("Project", "Load", "Stars: " + hash_string);
			SwiftCalcs.pushState.navigate('/starred_projects/' + hash_string + '/' + encodeURIComponent(name.replace(/( |\\|\.)/g,'_')), {trigger: true});
		}
		else if(hash_string) {
			window.trackEvent("Project", "Load", hash_string);
			SwiftCalcs.pushState.navigate('/projects/' + hash_string + '/' + encodeURIComponent(name.replace(/( |\\|\.)/g,'_')), {trigger: true});
		}
		else if(current_project_navigable_url) {
			window.trackEvent("Project", "Load", "Current Project");
			SwiftCalcs.pushState.navigate(current_project_navigable_url, {trigger: true});
		}
		else {
			window.trackEvent("Project", "Load", "Active");
			SwiftCalcs.pushState.navigate('/active/', {trigger: true});
		}
	}
	$('body').on('click', '.title.expandable', function(e) {
		if($(this).hasClass('project_title')) return;
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
		if(!$(this).hasClass('expandable'))
    	window.closeMobileprojects_list();
		var $container = $(this).closest('div.item');
		if($(this).hasClass('expandable') && $container.hasClass('closed')) {
			$container.removeClass('closed');
			$container.children('.expand').slideDown(150);
		} else if($(this).hasClass('expandable') && !$container.hasClass('closed') && SwiftCalcs.pushState.fragment.match(new RegExp("(^|/)" + $container.attr('data-hash') + "/","i"))) {
			$container.addClass('closed');
			$container.children('.expand').slideUp(150);
		}
		if($(this).closest('.popup_dialog').length == 0)
			window.loadProject($container.attr('data-hash'), $container.attr('data-name'), $container.closest('.archive').length > 0);
	});
	$('body').on('click', '.full_swift', function(e) {
	  var win = window.open("https://www.swiftcalcs.com/", '_blank');
	  win.focus();
		e.preventDefault();
		e.stopPropagation();
	})

	var month_string = function(date) {
		var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
		var today = new Date();
		var string = monthNames[date.getMonth()];
		if((today.getFullYear() == date.getFullYear()) && (today.getMonth() == date.getMonth())) return 'This Month';
		if(today.getFullYear() != date.getFullYear()) string += ' ' + date.getFullYear();
		return string;
	}
	var worksheet_html = window.worksheet_html = function(w) {
		return "<span class='select_box'><i class='fa fa-square-o'></i><i class='fa fa-check-square-o'></i></span>"
			+ "<span class='name'><span class='hover'>" + w.name + "</span></span>"
			+ "<span class='icons'><i class='fa fa-external-link' title='Open in New Window'></i><i class='fa fa-print' title='Print'></i><i class='fa fa-archive archive' title='Archive'></i><i class='fa fa-archive unarchive' title='Restore'></i></span>"
			+ "<span class='star'><i class='fa fa-star" + (w.star_id ? '' : '-o') + "' title='Add or Remove Star'></i></span>"
			+ "<span class='menu'><i class='fa fa-ellipsis-v' title='Options Menu'></i></span>";
	}
	var invitation_html = window.invitation_html = function(w) {
		return "<span class='file_type'><i class='fa fa-" + (w.worksheet ? "file" : "folder-open") + "'></i></span>"
			+ "<span class='name'><span class='hover'>" + w.name + "</span></span>"
			+ "<span class='invite_accept'><span class='fa fa-check-circle'></span>Accept</span>"
			+ "<span class='invite_reject'><span class='fa fa-times-circle'></span>Reject</span>"
			+ "<span class='invite_pending'><i class='fa fa-pulse fa-spinner'></i></span>";
	}
	var prepend_to_list = false;
	window.sort_by = 'date';
	var sort_by_html = function() {
		var html = "<div class='sort_by'><div>";
		if(window.sort_by == 'name')
			html += "<span data-sort='name'>Name<i class='fa fa-caret-down'></i></span><span data-sort='date'>Date</span>";
		else
			html += "<span data-sort='date'>Date<i class='fa fa-caret-down'></i></span><span data-sort='name'>Name</span>";
		html += "</div></div>";
		return html;
	}
	$('body').on('click', 'div.sort_by span', function(e) {
		if(window.sort_by != $(this).attr('data-sort')) {
			window.sort_by = $(this).attr('data-sort');
	    if(SwiftCalcs.pushState.fragment.match(/(worksheets|revisions|inline_worksheets)\//i)) {
	      if(SwiftCalcs.pushState.last_active_url.match(/^(\/)?$/)) SwiftCalcs.pushState.last_active_url = 'active/';
	      SwiftCalcs.pushState.navigate(SwiftCalcs.pushState.last_active_url);
	      SwiftCalcs.pushState.loadUrl(SwiftCalcs.pushState.last_active_url, true);
	    } else
	      SwiftCalcs.pushState.loadUrl(undefined, true)
	  }
		e.preventDefault();
	});
	var displayWorksheetList = window.displayWorksheetList = function(worksheets, path_html, onshape, fusion) {
		clear_batch();
		window.selectToolboxTab('projects_list');
		// Assumes worksheets already sorted by date from latest to earliest
		$('.worksheet_holder').html('');
		$('<div/>').addClass('active_path').html(path_html + sort_by_html()).appendTo('.worksheet_holder');
		if(prepend_to_list !== false) {
			prepend_to_list.updated_at = Math.floor(Date.now()/1000);
			prepend_to_list.invitation = false;
			worksheets.unshift(prepend_to_list);
		}
		if(worksheets.length > 0) {
			var d = new Date();
			d.setHours(0,0,0,0);
			var in_box = false;
			var box = false;
			var index = 0;
			var time_splits = [d, d-24*3600*1000, d-7*24*3600*1000];
			var current_month_string = '';
			var last_letter = '';
			for(var i = 0; i < worksheets.length; i++) {
				if(prepend_to_list && (i > 0) && (worksheets[i].hash_string == prepend_to_list.hash_string)) continue;
				if(window.sort_by == 'name') {
					var start_letter = worksheets[i].name ? worksheets[i].name.substr(0,1).toUpperCase() : 'A';
					if(in_box) {
					  if(start_letter != last_letter) in_box = false;
						if(!in_box) box.appendTo('.worksheet_holder')
					}
					if(!in_box) {
						last_letter = start_letter;
						$('<div/>').addClass('date_box').html(start_letter).appendTo('.worksheet_holder');
						box = $('<div/>').addClass('worksheet_holder_box');
						in_box = true;
					}
				} else {
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
						$('<div/>').addClass('date_box' + (index == 1 ? ' today_box' : '')).html(current_month_string).appendTo('.worksheet_holder');
						box = $('<div/>').addClass('worksheet_holder_box');
						in_box = true;
					}
				}
				var el;
				if(worksheets[i].invitation) 
					el = $('<div/>').addClass('invitation_item').addClass('rights_hash_' + worksheets[i].rights_hash).attr('data-rights-hash', worksheets[i].rights_hash).attr('data-project', worksheets[i].worksheet ? 0 : 1).attr('data-hash', worksheets[i].hash_string).attr('data-name', worksheets[i].name).html(invitation_html(worksheets[i])).appendTo(box);
				else
					el = $('<div/>').addClass('worksheet_item').addClass('worksheet_hash_' + worksheets[i].hash_string).attr('data-name', worksheets[i].name).attr('data-hash', worksheets[i].hash_string).attr('parent-hash', worksheets[i].parent_project_hash).html(worksheet_html(worksheets[i])).appendTo(box);
				if(worksheets[i].archive_id) el.addClass('archived');
			}
			if(in_box) box.appendTo('.worksheet_holder')
		} else {
	    var search_term = $('div.search_bar input').length && ($('div.search_bar input').val().trim().length > 0);
    	var fragment = SwiftCalcs.pushState.fragment || '';
	    var star = fragment.match(/^starred_projects\//i) || fragment.match(/^starred\//i);
	    var archive = fragment.match(/^archive_projects\//i) || fragment.match(/^archive/i);
	    var project = fragment.match(/^starred_projects\//i) || fragment.match(/^archive_projects\//i) || fragment.match(/^projects\//i);
	    var team = fragment.match(/^team\//i);
	    var my_docs = fragment.match(/^my_docs\//i);
	    var shared = fragment.match(/^shared\//i);
	    //var label = fragment.match(/^project_label\//i) || fragment.match(/^labels\//i);
	    if(fragment.match(/^invites/i)) {
	    	var $div = $('<div/>').addClass('no_results');
	    	$('<div/>').addClass('title').html('No pending invitations').appendTo($div);
	    	$('<div/>').addClass('explain').html('New items will appear here as others invite you to projects or worksheets.').appendTo($div);
	    } else if(!star && !search_term && !archive && !team && !my_docs && !shared) {
	    	// No active sheets (or sheets in a project), give 'welcome' message here, push them to create a new sheet
	    	var $div = $('<div/>').addClass('no_results');
    		if((project && onshape) || fragment.match(/^onshape_docs\//i)) {
	    		$('<div/>').addClass('title').html('Onshape & Swift Calcs!').appendTo($div);
	    		$('<div/>').addClass('explain').html('Swift Calcs inside Onshape enables:').appendTo($div);
	    		var $ul = $('<ul/>');
	    		$('<li/>').html('Use Swift Calcs worksheets directly in Onshape').appendTo($ul);
	    		$('<li/>').html('Control Onshape variables from your Swift Calcs worksheets').appendTo($ul);
	    		$('<li/>').html('Automatic association of Swift Calcs worksheets with their Onshape counterpart').appendTo($ul);
	    		$('<li/>').html('Security and permissions inheitance from Onshape to your Swift Calcs worksheets').appendTo($ul);
		    	$ul.appendTo($div);
	    		$('<div/>').addClass('explain').html('Click the red icon at the bottom right of the screen to get started').appendTo($div);
    		} else if((project && fusion) || fragment.match(/^fusion_docs\//i)) {
	    		$('<div/>').addClass('title').html('Fusion 360 & Swift Calcs!').appendTo($div);
	    		$('<div/>').addClass('explain').html('Swift Calcs inside Fusion 360 enables:').appendTo($div);
	    		var $ul = $('<ul/>');
	    		$('<li/>').html('Use Swift Calcs worksheets with Fusion 360').appendTo($ul);
	    		$('<li/>').html('Control Fusion 360 User Paramaters from your Swift Calcs worksheets').appendTo($ul);
	    		$('<li/>').html('Automatic association of Swift Calcs worksheets with their Fusion 360 counterpart').appendTo($ul);
	    		$('<li/>').html('Security and permissions inheitance from Onshape to your Swift Calcs worksheets').appendTo($ul);
		    	$ul.appendTo($div);
	    		$('<div/>').addClass('explain').html('Click the red icon at the bottom right of the screen to get started').appendTo($div);
    		} else if(project) {
	    		$('<div/>').addClass('title').html('This Project is Empty').appendTo($div);
	    		$('<div/>').addClass('explain').html('Consider loosening your search criteria:').appendTo($div);
	    		var $ul = $('<ul/>');
	    		$('<li/>').html('View archived sheets in this project').on('click', function(e) {
	  				var hash_string = fragment.replace(/projects\/([a-z0-9\-]*).*$/i,"$1");
	    			var name = fragment.replace(/projects\/([a-z0-9\-]*)\/(.*)$/i,"$2");
	    			window.loadProject(hash_string, name, true);
		    	}).appendTo($ul);
		    	$('<li/>').html('View all active sheets, not just sheets in this project').on('click', function(e) {
		    		window.loadProject('active');
		    	}).appendTo($ul);
		    	$ul.appendTo($div);
	    	} else {
	    		$('.active_path').hide();
	    		$('<div/>').addClass('title').html('Welcome to Swift Calcs').appendTo($div);
	    		$('<div/>').addClass('explain').html('You\'re one step away from starting your first calculation.  Click the red <strong>New Sheet</strong> icon in the bottom right to get started.').appendTo($div);
	    	}
	    	$('<div/>').addClass('new_sheet').html('Click the <strong>New Sheet</strong> button to get started').appendTo($div);
	    	$('<div/>').addClass('new_sheet_arrow').appendTo($div);
	    } else {
	    	var $div = $('<div/>').addClass('no_results');
	    	$('<div/>').addClass('title').html('No Worksheets Found').appendTo($div);
	    	$('<div/>').addClass('explain').html('Consider loosening your search criteria:').appendTo($div);
	    	var $ul = $('<ul/>')
	    	if(star) $('<li/>').html('Include non-starred worksheets in your results').on('click', function(e) {
		    		if(project) {
      				var hash_string = fragment.replace(/starred_projects\/([a-z0-9\-]*).*$/i,"$1");
      				var name = fragment.replace(/starred_projects\/([a-z0-9\-]*)\/(.*)$/i,"$2");
		    			window.loadProject(hash_string, name);
		    		}	else
		    			window.loadProject('active');
		    	}).appendTo($ul);
	    	if(search_term) $('<li/>').html('Remove your search term (' + $('div.search_bar input').val().trim() + ')').on('click', function(e) {
		    		$('div.search_bar input').val('');
		    		SwiftCalcs.pushState.refresh(true);
		    	}).appendTo($ul);
	    	if(archive) $('<li/>').html('Search in active sheets instead of in archived sheets').on('click', function(e) {
		    		if(project) {
      				var hash_string = fragment.replace(/archive_projects\/([a-z0-9\-]*).*$/i,"$1");
      				var name = fragment.replace(/archive_projects\/([a-z0-9\-]*)\/(.*)$/i,"$2");
		    			window.loadProject(hash_string, name, false, star);
		    		}	else
		    			window.loadProject(star ? 'starred' : 'active');
		    	}).appendTo($ul);
		    else $('<li/>').html('Search in archived sheets instead of in active sheets').on('click', function(e) {
		    		if(project) {
      				var hash_string = fragment.replace(/(starred_)?projects\/([a-z0-9\-]*).*$/i,"$2");
      				var name = fragment.replace(/(starred_)?projects\/([a-z0-9\-]*)\/(.*)$/i,"$3");
		    			window.loadProject(hash_string, name, true);
		    		}	else
		    			window.loadProject('archive');
		    	}).appendTo($ul);
		    if(project) $('<li/>').html('Search all active sheets, not just sheets in this project').on('click', function(e) {
		    		if(star)
		    			window.loadProject('starred');
		    		else if(archive)
		    			window.loadProject('archive');
		    		else
		    			window.loadProject('active');
		    	}).appendTo($ul);
		    else {
			    if(team) 
						$('<li/>').html('Search all active sheets, not just sheets in your team').on('click', function(e) {
			    		if(star)
			    			window.loadProject('starred');
			    		else
			    			window.loadProject('active');
			    	}).appendTo($ul);
			    else if(my_docs) 
						$('<li/>').html('Search all active sheets, not just sheets you created').on('click', function(e) {
			    		if(star)
			    			window.loadProject('starred');
			    		else
			    			window.loadProject('active');
			    	}).appendTo($ul);
			    else if(shared)
						$('<li/>').html('Search all active sheets, not just sheets shared with you').on('click', function(e) {
			    		if(star)
			    			window.loadProject('starred');
			    		else
			    			window.loadProject('active');
			    	}).appendTo($ul);
			    else if(!archive) 
						$('<li/>').html('Search in worksheets shared with you').on('click', function(e) {
			    		window.loadProject('shared');
			    	}).appendTo($ul);
			  }
		    /*
		    if(label) $('<li/>').html('Search all sheets, not just with this label').on('click', function(e) {
		    		if(project) {
      				var hash_string = fragment.replace(/project_label\/([a-z0-9\-]*)\/([a-z0-9\-]*).*$/i,"$1");
		    			window.loadProject(hash_string, '', false);
		    		}	else if(archive)
		    			window.loadProject('archive');
		    		else
		    			window.loadProject('active');
		    	}).appendTo($ul);
		    */
	    	$ul.appendTo($div);
	    }
	    $div.appendTo('.worksheet_holder')
		}
		prepend_to_list = false;
	}
	var addStar = window.addStar = function(data_hash) {
    window.trackEvent("Star", "Add", data_hash);
		toggleStar(data_hash, true);
	}
	var removeStar = window.removeStar = function(data_hash) {
    window.trackEvent("Star", "Remove", data_hash);
		toggleStar(data_hash, false);
	}
	var toggleStar = function(data_hash, add) {
		var flipStar = function(flip) {
			$('.worksheet_item').each(function() {
				if($(this).attr('data-hash') == data_hash) {
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
      data: { hash_string: data_hash, add: add }, 
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
		var w_id = $(this).closest('.worksheet_item').attr('data-hash');
		if($(this).hasClass('fa-star')) {
			removeStar(w_id);
		} else {
			addStar(w_id);
		}
		$(this).removeClass('fa-star-o').removeClass('fa-star').addClass('fa-spinner').addClass('fa-pulse').addClass('star');
		e.preventDefault();
		e.stopPropagation();
	});
	$('body').on('click', '.worksheet_item i.fa-external-link', function(e) {
		var name = $(this).closest('.worksheet_item').attr('data-name');
		var hash_string = $(this).closest('.worksheet_item').attr('data-hash');
		SwiftCalcs.pushState.navigate('/worksheets/' + hash_string + '/' + encodeURIComponent(name.replace(/( |\\|\.)/g,'_')));
    window.trackEvent("Worksheet", "Expand", '/worksheets/' + hash_string + '/' + encodeURIComponent(name.replace(/( |\\|\.)/g,'_')));
		SwiftCalcs.pushState.last_active_url = '/';
		SwiftCalcs.pushState.last_active_title = 'Swift Calcs';
		if($(this).closest('.active_worksheet').length == 0) {
			window.openActive($(this).closest('.worksheet_item'));
			window.loadWorksheet($(this).closest('.worksheet_item'));
		} else
			window.setTimeout(function() { SwiftCalcs.active_worksheet.ends[-1].focus(-1); }, 150);
		window.setTimeout(function(_this) { return function() { $(_this).closest('.active_worksheet').css({"margin":"-10px -30px", "padding-top":"25px", "padding-bottom":"25px"}); }; }(this), 350);
		var parent = $(this).closest('.worksheet_holder_box').addClass('single_sheet');
		parent.children('.worksheet_item').slideUp({duration: 250, always: function() { $(this).remove(); }});
		parent.siblings('div').slideUp({duration: 250, always: function() { $(this).remove(); }});

		$('.base_layout').addClass('toolbox_hidden');
		$(window).scrollTop(0);
		e.preventDefault();
		e.stopPropagation();
	});
	$('body').on('click', '.worksheet_item i.fa-print', function(e) {
    window.trackEvent("Worksheet", "Print");
		SwiftCalcs.await_printing = true;
		window.showLoadingPopup();
		$('.loading_box .name').html('Preparing to Print: Calculating...');
		var doPrint = function() {
			if(SwiftCalcs.await_printing !== true) {
				window.hidePopupOnTop();
				$('.loading_box .name').html('Loading');
				return;
			}
			if(SwiftCalcs.active_worksheet && SwiftCalcs.active_worksheet.loaded && (SwiftCalcs.active_worksheet.ready_to_print || !SwiftCalcs.giac.auto_evaluation)) {
				SwiftCalcs.active_worksheet.blur();
				window.setTimeout(function() { // Delay to allow animations to finish, SVG plots to be generated, etc
					window.hidePopupOnTop();
					$('.loading_box .name').html('Loading');
					window.print();
				}, 400);
			} else
				window.setTimeout(doPrint, 250);
		}
		var el = $(this).closest('.worksheet_item');
		if($(this).closest('.active_worksheet').length == 0) {
			window.openActive(el);
			window.loadWorksheet(el);
		}
		doPrint();
		e.preventDefault();
		e.stopPropagation();
	});
	// Firefox doesn't call window.resize for some reason on print, unlike all other major browsers...so deal with it here:
	window.onbeforeprint = function() {
		if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
			$('.worksheet_holder').width(670);
	    if(SwiftCalcs.current_toolbar) SwiftCalcs.current_toolbar.reshapeToolbar();
	    if(SwiftCalcs.active_worksheet) SwiftCalcs.active_worksheet.setWidth();
		}
	}
	window.onafterprint = function() {
		if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
    	window.resizeResults();
	    if(SwiftCalcs.current_toolbar) SwiftCalcs.current_toolbar.reshapeToolbar();
	    if(SwiftCalcs.active_worksheet) SwiftCalcs.active_worksheet.setWidth();
		}
	}
	window.loadFilePicker = function(callback, parent_id) {
    window.showPopupOnTop();
    var current_parent_hash = undefined;
    $('.popup_dialog .full').html("<table border=0 width='100%'><tbody><tr><td style='width:200px;' valign=top><div class='left_bar'></div></td><td valign=top><div class='select_worksheet'><div class='input_box'><input type='text'></div><div class='title'>Choose a Worksheet and Variables</div><div class='search'><i class='fa fa-search'></i><div class='input'><input type='text' placeholder='Search'></div><i class='fa fa-times-circle'></i></div><div class='list_content'></div></div></td></tr></tbody></table>");
    var $list_content_td = $('.popup_dialog .full div.list_content');
    var $leftbar = $('.popup_dialog .full div.left_bar');
    var $autocomplete = $('.popup_dialog .full').find('input').eq(1);
    var $input = $('.popup_dialog .full').find('input').eq(0);
    var loading = function() {
      $('.popup_dialog .bottom_links').find('button.select_worksheet').hide();
      $list_content_td.html("<div style='text-align:center;'><h1>Loading...</h1><BR><BR><i class='fa fa-spinner fa-pulse'></i></div>");
    }
    loading();
    window.resizePopup();
    var _this = this;
    var select_worksheet = function() {
      var val = $list_content_td.find('.selected').first();
      if(val.length == 0) 
        return showNotice("Please select a worksheet", "red");
      var selected_vars = $list_content_td.find('.selected').first().find('input:checked');
      if(selected_vars.length == 0)
      	return showNotice("Please choose at least one variable to include","red");
      var var_list = [];
      selected_vars.each(function() {
      	var_list.push($(this).attr('data-val'));
      });
      callback(val.attr('data-id'),var_list);
      window.hidePopupOnTop();
    }
    var populate = function(response) { 
      if(response.success) {
        $list_content_td.html("");
        $.each(response.worksheets, function(k,v) {
          $list_content_td.append("<div class='list item' data-id='" + v.hash_string + "'>" + v.name + "</div>");
        });
        if(response.worksheets == 0)
          $list_content_td.append("<div><strong>No Results</strong></div>");
        $('.popup_dialog .bottom_links').html('<button class="select_worksheet" style="display:none;">Include Chosen Variables</button><button class="grey close">Close</button>');
        $('.popup_dialog .bottom_links').find('button.select_worksheet').on('click', select_worksheet);
        $list_content_td.find('.item').on('click', function() {
          if($(this).find('.detail').length) return false;
      		$('.popup_dialog .bottom_links').find('button.select_worksheet').hide();
          $list_content_td.find('.selected').removeClass('selected');
          $list_content_td.find('.detail').slideUp({duration: 200, always: function() { $(this).remove(); }});
          $(this).addClass('selected');
          var detail_div = $('<div/>').addClass('detail').appendTo($(this)).hide();
          detail_div.html("<div style='text-align:center;'><h3>Loading Variable List...</h3><BR><BR><i class='fa fa-spinner fa-pulse'></i></div>").slideDown(200);
          window.ajaxRequest("/worksheets/variable_list",{hash_string: $(this).attr('data-id')},function(results) {
          	try {
          		variables = JSON.parse(results.variables);
          	} catch(err) {
			      	detail_div.html("<div style='text-align:center;'><h3>Unable to Decode Variable List</h3><div style='font-size:11px;font-weight:normal;line-height:13px;'>The worksheet variable listing may be corrupt.  Open the worksheet to reset the variable list.</div></div>");
			      	return;
          	}
          	if(variables.length == 0) {
			      	detail_div.html("<div style='text-align:center;'><h3>No Variables Were Found</h3><div style='font-size:11px;font-weight:normal;line-height:13px;'>Ensure that variables and functions are defined in this worksheet.  If you believe you are receiving this message in error, load the worksheet in a new window and verify that it calculates through completely.</div></div>");
          	} else {
          		var select_html = '';
          		for(var i = 0; i < variables.length; i++) 
          			select_html += "<tr class='hover_highlight'><td style='width:30px;border-bottom:1px solid #ccc;'><input type=checkbox style='width:auto;' data-val='" + variables[i].name + "'></td><td style='border-bottom:1px solid #ccc;font-weight:bold;'>" + window.SwiftCalcsLatexHelper.VarNameToHTML(variables[i].name) + "</td><td style='border-bottom:1px solid #ccc;'>" + (variables[i].latex.length < 250 ? window.SwiftCalcsLatexHelper.latexToHtml(variables[i].latex) : "<span class='explain'>Value too long to display</span>")+ "</td></tr>";
		          detail_div.html('<table border=0 style="width:100%;"><tbody><tr><td colspan=3 style="border-bottom:1px solid #ccc;"><b>Select Variables to Include</b></td></tr>' + select_html + '<tr><td colspan=3><a class="button" style="display:inline-block;left-margin:0px;">Include Chosen Variables</a></tr></td></tbody></table>');
		          detail_div.find('a.button').on('click', select_worksheet);
		          detail_div.find('tr.hover_highlight').on('click', function(e) {
		          	$(this).find('input').click();
		          	e.stopPropagation();
		          });
		          detail_div.find('input').on('click', function(e) {
		          	e.stopPropagation();
		          });
		          $('.popup_dialog .bottom_links').find('button.select_worksheet').show();
          	}
          }, function(response) {
			      detail_div.html("<div style='text-align:center;'><h3>Unable to load variable list</h3>Ensure you have appropriate permissions.</div>");
			    });
          $autocomplete.val('');
          lastRequest = '';
          $input.focus();
          return false;
        });
        // register input
        window.resizePopup();
        if(!$autocomplete.is(":focus"))
          $input.focus();
      } else {
        showNotice(response.message, 'red');
        window.hidePopupOnTop();
      }
    };

    var timeOut = false;
    var ajaxRequest = false;
    var lastRequest = '';
    var submitFunction = function(_this){ return function() {
      search = $autocomplete.val().trim();
      // Cancel the last request if valid
      if(ajaxRequest) ajaxRequest.abort();
      // Currently loading? 
      var curloading = $list_content_td.find('.fa-spinner').length > 0;
      if(!curloading && (search == lastRequest)) return;
      lastRequest = search;
      if(search == '') // blank, reload initial material listing
        return load();
      if(search.length < 3) {
        if(curloading) $list_content_td.html("");
        return showNotice('Please enter a search phrase of at least 3 characters');
      }
      loading();
      ajaxRequest = $.ajax({
        type: "POST",
        url: "/projects",
        data: {search_term: search, hash_string: current_parent_hash, order_by_name: true },
        success: populate,
        error: function(err) {
          window.hidePopupOnTop();
          console.log('Error: ' + err.responseText)
          showNotice('Error: There was a server error.  We have been notified', 'red');
          SwiftCalcs.await_printing = false;
        }
      });
    }; }(this);
    $('.popup_dialog .full').find('div.search .fa-times-circle').on('click', function(evt) {
      $autocomplete.val('');
      submitFunction();
      evt.preventDefault();
    });
    $autocomplete.on("keydown", function(evt) {
      var which = evt.which || evt.keyCode;
      var search = $(this).val();
      var curloading = $list_content_td.find('.fa-spinner').length > 0;
      // It will clear the setTimeOut activity if valid.
      if(timeOut) clearTimeout(timeOut);
      if((which == 10) || (which == 13)) {
        evt.preventDefault();
        this.blur(); //Blur will submit, see 'onblur'
      }
      else if(search.length >= 3) {
        loading();
        timeOut = setTimeout(function() { submitFunction(); }, 400);// wait for quarter second.
      } else if(curloading) {
        loading();
        timeOut = setTimeout(function() { submitFunction(); }, 1200);// wait for quarter second.
      }
    }).on("blur", function(evt) {
      submitFunction();
      evt.preventDefault();
      $input.focus();
    });

    $input.on("keydown", function(evt) {
      var which = evt.which || evt.keyCode;
      switch(which) {
        case 10:
        case 13:
        case 39:
          //Enter or Right
          $list_content_td.find('.selected').first().click();
        break;
        case 38:
          //Up
          var sel = $list_content_td.find('.selected').first();
          if(sel.length == 0) {
            sel = $list_content_td.find('div.list').first();
            sel.addClass('selected');
          }
          if(sel.prev('div.list').length) {
            sel.prev('div.list').addClass('selected');
            sel.removeClass('selected');
          }
        break;
        case 40:
          //Down
          var sel = $list_content_td.find('.selected').first();
          if(sel.next('div.list').length) {
            sel.next('div.list').addClass('selected');
            sel.removeClass('selected');
          }
          if(sel.length == 0) {
            sel = $list_content_td.find('div.list').first();
            sel.addClass('selected');
          }
      }
      evt.preventDefault();
    });

    var load = function(parent_id, archive, star) {
      loading();
      current_parent_hash = parent_id;
      if((typeof current_parent_hash === 'undefined') || (current_parent_hash.length == 0)) current_parent_hash = 'active';
      if(current_parent_hash == 'starred') {
      	current_parent_hash = 'active';
      	star = true;
      }
      var data = { hash_string: current_parent_hash, order_by_name: true }
      if(archive) data.show_archived = true;
      if(star) data.star = true;
      window.ajaxRequest('/projects', data , populate, function(response) {
        window.hidePopupOnTop();
      });
    }
    loading();
    window.ajaxRequest('/projects/left_bar',{}, function(response) {
    	$leftbar.html(response.html);
    	load(parent_id);
      // Listeners
		  $leftbar.on('click', '.project_title', function(e) {
		    var $container = $(this).closest('div.item');
		    load($container.attr('data-hash'), $container.closest('.archive').length > 0, false);
		  });
			$leftbar.on('click', '.star_title', function(e) {
				var $container = $(this);
				if($container.closest('.project_list').length > 0) {
					$project = $container.closest('.expand').closest('div.item');
					load($project.attr('data-hash'), false, true);
				} else
					load(undefined, false, true);
			});
  	}, function(response) {
      window.hidePopupOnTop();
    });
	}
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
			moveDialog(function(project_hash) { processBatchCommand(project_hash, command); });
		else if(command == 'clear')
			clear_batch();
		else 
			processBatchCommand(0, command);
	}
	var processBatchCommand = function(project_hash, command) {
		var items = [];
		$('.worksheet_item.selected').each(function() {
			items.push($(this).attr('data-hash'));
		});
		if(items.length == 0) return;
		showLoadingOnTop();
		if(command == 'Invite') {
			var count = $('.projects_list .invite_count');
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
      data: { command: command, items: items, project_hash: project_hash, current_project_hash: current_project_hash }, 
      success: function(response) {
      	window.hidePopupOnTop();
      	if(response.success) {
      		$('.worksheet_item').each(function() {
      			if(response.to_remove[$(this).attr('data-hash')]) {
      				$(this).removeClass('selected');
							if($(this).closest('.active_worksheet').length > 0) {
								closeActive($(this).closest('.active_worksheet'));
								$(this).addClass('closing').slideUp({duration: 400, always: function() { $(this).remove(); } });
							} else 
								$(this).addClass('closing').slideUp({duration: 200, always: function() { $(this).remove(); } });
      			}
      		});
      		$('.worksheet_holder_box').each(function() {
      			if(($(this).find('.worksheet_item').length - $(this).find('.worksheet_item.closing').length) <= 0) {
							$(this).slideUp({duration: 200, always: function() { $(this).remove(); } });
							$(this).prev('.date_box').slideUp({duration: 200, always: function() { $(this).remove(); } });
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
	var createPrompt = window.createPrompt = function(title, message, options, handler) { 
    window.showPopupOnTop();
		var el = $('.popup_dialog .full').html("<div class='title'>" + title + "</div><div>" + message + "</div>");
    var buttons = $('.popup_dialog .bottom_links').html('');
    $.each(options, function(k, v) {
    	buttons.append('<button class="submit" data-val="' + v + '">' + k.replace(/_/g,' ') + '</button>');
		});
    buttons.find('button.submit').on('click', function(e) {
    	window.hidePopupOnTop();
    	handler($(this).attr('data-val'));
    	e.preventDefault();
    });
		window.resizePopup(true);
	}
	var moveDialog = function(callbackFunction, parent_project_hash) {
		if(typeof parent_project_hash === 'undefined') parent_project_hash = current_project_hash;
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
      			if($(this).attr('data-hash') && ($(this).attr('data-hash') == parent_project_hash)) {
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
            var project_hash = el.find('.selected').attr('data-hash');
            window.showLoadingOnTop();
            callbackFunction(project_hash);
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
	var promptDialog = function(prompt, button_text, suggested_name, callbackFunction, invite_dialog) {
    window.showPopupOnTop();
    var el = $('.popup_dialog .full').html("<div class='title'>" + prompt + "</div><div class='input'><input type=text></div>");
    if(invite_dialog) {
			var $div = $("<div/>").html("<div style='margin-top:10px;' class='title'><i class='fa fa-fw fa-user-plus'></i>Add Collaborators</div><div><table border=0><tbody><tr><td><span class='email_input'></span></td><td style='width:1px;' class='invite_rights'><span class='rights_select' data-val='1'></span></td></tr></tbody></table><span class='checkbox notify' data-val='1'><i class='fa fa-fw fa-check-square-o'></i>Notify Users by Email</span> - <a href='' class='add_message'>Add Message</a><div class='add_message' style='display:none;'><textarea class='add_message'></textarea></div></div>").appendTo(el);
      el.find('span.rights_select').each(function() {
        window.createUserRightsDropdown($(this));
      });
      el.find('span.email_input').each(function() {
        window.userRightsEmailInput($(this));
      });
      el.find('.checkbox').on('click', function(e) {
        var box = $(this).children('i.fa');
        if(box.hasClass('fa-check-square-o')) {
          box.removeClass('fa-check-square-o').addClass('fa-square-o');
          $(this).attr('data-val', '0');
        } else {
          box.removeClass('fa-square-o').addClass('fa-check-square-o');
          $(this).attr('data-val', '1');
        }
      });
      el.find('a.add_message').on('click', function(e) {
        var box = el.find('div.add_message');
        if(box.hasClass('shown')) {
          box.removeClass('shown');
          box.hide();
          $(this).html('Add Message');
        } else {
          box.addClass('shown');
          box.show();
          $(this).html('Discard Message');
        }
        box.find('textarea').val('');
        e.preventDefault();
        return false;
      });
      // Autogrow the textarea
      el.find('textarea').on('paste input', function () {
        if ($(this).outerHeight() > this.scrollHeight)
          $(this).height(60)
        var height = $(this).height();
        while ($(this).outerHeight() < this.scrollHeight) {
          $(this).height(height + 5);
          height += 5;
        }
        $(this).height(height + 5);
      });
    	if(!window.user_logged_in) {
    		$div.hide();
    		$("<div/>").html("<div style='margin-top:10px;' class='title'><i class='fa fa-fw fa-user-plus'></i>Add Collaborators</div><a href='#'>Create a Swift Calcs account</a> to collaborate on projects with other users around the world.  Accounts are free and take only moments to create").appendTo(el).find('a').on('click', function(e) {
		      window.loadSigninBox();
    			e.preventDefault();
    		});
    	}
    }
    // Create the buttons at the bottom
    buttons = $('.popup_dialog .bottom_links').html('');
    buttons.append('<button class="submit">' + button_text + '</button>');
    buttons.append('<button class="close grey">Cancel</button>');
    el.find('.input input').val(suggested_name);
    buttons.find('button.submit').on('click', function() {
      var name = el.find('.input input').val();
      if(name.trim() == '') return showNotice('No name provided', 'red');
      window.showLoadingOnTop();
      if(invite_dialog) {
		    // New invited users
		    var data = {};
		    data.invite_emails = [];
		    el.find('.emailInput').each(function() {
		      if($(this).hasClass('invalid')) return;
		      data.invite_emails.push($(this).children('span').html());
		    });
		    data.invite_rights = el.find('.invite_rights select').val()*1;
		    data.invite_notify = el.find('.checkbox.notify').attr('data-val')*1;
		    data.invite_message = el.find('textarea.add_message').val();
      	callbackFunction(name, data);
      } else
      	callbackFunction(name);
    });
    window.resizePopup(invite_dialog ? false : true);
    el.find('.input input').focus();
	}
	var newProject = window.newProject = function(parent_project_hash, no_save) {
		if(typeof parent_project_hash === 'undefined') {
			parent_project_hash = current_project_hash;
			no_save = current_project_no_save;
		}
		promptDialog('Name your new project', 'Create', '', function(parent_project_hash) { return function(name, data) { processNewProject(name, data, parent_project_hash) }; }(parent_project_hash), no_save !== true);
	}
	var processNewProject = function(name, data, parent_project_hash) {
    window.trackEvent("Project", "Create", name);
		window.showLoadingOnTop();
		post_data = { name: name, rights: data };
		if(parent_project_hash) post_data.project_hash = parent_project_hash;
		var success = function(response) {
      window.hidePopupOnTop();
  		showNotice('Project Created', 'green');
  		var found = false;
  		$('.projects_list .left_item.my_docs .explain').remove();
  		$('.project_list').find('.item').each(function() {
  			if($(this).attr('data-hash') == response.parent_project_hash) {
  				$(response.html).appendTo($(this).children('.expand'));
  				if($(this).closest('.archive').length) return;
  				$(this).removeClass('no_arrows').removeClass('closed');
  				$(this).children('.project_title').addClass('expandable');
  				$(this).children('.expand').show();
  				found = true;
  			}
  		});
  		if(!found) 
  			$(response.html).appendTo('.projects_list .left_item.my_docs .project_list');
  		SwiftCalcs.pushState.navigate(response.url, {trigger: true});
		};
		var fail = function(message) {
      window.hidePopupOnTop();
		}
		window.ajaxRequest('/projects/new', post_data, success, fail);
	}
	$('body').on('click', '.projects_list span.fa-plus-circle', function(e) {
		if($(this).attr('data-type') == 'project') window.newProject(null);
		/*
		if($(this).attr('data-type') == 'label') {
  		window.showPopupOnTop();
  		$('.popup_dialog .full').html("<div class='title'>Add a new label</div><div>Labels allow you to keep track of worksheets across projects and time.  Creating a new label is easy: when viewing a worksheet, look for the labels icon <i class='fa fa-fw fa-tags'></i> at the top of the sheet and the list of labels (or the message 'add labels to this worksheet').  Simply click on the list of labels (or the 'add labels to this worksheet message') and begin typing the labels you want to add, seperated by commas.  All the labels you create will automatically be populated in the menubar on the left of the page.</div>");
      $('.popup_dialog .bottom_links').html('<button class="close">Close</button>');
      window.resizePopup(true);
		}
		*/
		if($(this).attr('data-type') == 'onshape') {
  		window.showPopupOnTop();
  		$('.popup_dialog .full').html("<div class='title'>Add a new Sub-Project</div><div>Sub-Projects help you organize the Swift Calcs worksheets in your Onshape document.  To create a new sub-project, simply click the '+' icon in the bottom left of the screen and select 'Swift Calcs' from the 'Add a Application' menu.</div>");
      $('.popup_dialog .bottom_links').html('<button class="close">Close</button>');
      window.resizePopup(true);
		}
		e.preventDefault();
		e.stopPropagation();
	});

	$('body').on('click', '.project_title .fa-cog', function(e) {
		var archived = $(this).closest('.archive').length > 0;
		var offset = $(this).offset();
		var top = offset.top - $(window).scrollTop();
		var left = offset.left - $(window).scrollLeft();
		var project_hash = $(this).closest('.item').attr('data-hash');
		var project_name = $(this).closest('.item').attr('data-name');
		var el = $(this).closest('.item');
		var closeMenu = function() {
			$('.project_menu').remove();
			$('.project_title.highlight').removeClass('highlight');
		}
		closeMenu();
		$(this).closest('.project_title').addClass('highlight');
		var menu = $('<div/>').addClass('project_menu').addClass('loading').addClass('loading_p' + project_hash).on('mouseleave', function(e) {
			closeMenu();
		});
		$('<div/>').html('<i class="fa fa-fw fa-pulse fa-spinner"></i>').appendTo(menu);		
		var fail = function(message) {
			closeMenu();
		}
		var success = function(response) {
			if($('.loading_p' + project_hash).length == 0) return;
			var menu = $('.loading_p' + project_hash).removeClass('loading_p' + project_hash).removeClass('loading').off('mouseleave');
			menu.find('div').remove();
			if(archived) {
				$('<div/>').html('<i class="fa fa-fw fa-archive"></i>Restore Project').on('click', function(e) {
					// Restore
					el.find('.fa-cog').removeClass('fa-cog').addClass('fa-spinner').addClass('fa-pulse');
					window.ajaxRequest("/projects/archive", { add: "false", hash_string: project_hash, data_type: 'Project'}, function(response) { 
						showNotice('Project and all sub-projects and worksheets restored.','green'); 
						$('.left_item.my_docs > .expand').html(response.tree); 
						$('.left_item.team > .expand').html(response.team); 
						$('.left_item.shared > .expand').html(response.shared); 
						el.find('.fa-spinner').removeClass('fa-spinner').removeClass('fa-pulse').addClass('fa-cog'); 					
						if(!window.location.href.match(/\/archive_projects\//) && !window.location.href.match(/.com(:3000)?\/archive/)) {
							// Not in an archive view, so refresh if on a listing page
							if(!SwiftCalcs.pushState.fragment.match(/^(worksheets|revisions)\//i)) SwiftCalcs.pushState.refresh();
						} else {
							// in an archive view...remove returned ids
							for(var i = 0; i < response.hashes.length; i++) {
								$('.worksheet_hash_' + response.hashes[i]).slideUp({duration: 200, always: function() { $(this).remove(); } });
							}
						}
					}, function() { el.find('.fa-spinner').removeClass('fa-spinner').removeClass('fa-pulse').addClass('fa-cog'); });
					closeMenu();
				}).appendTo(menu);
			} else {
				if((response.rights_level >= 3) && (!response.onshape_parent))
					$('<div/>').html('<i class="fa fa-fw fa-plus"></i>Add Sub-Project').on('click', function(e) {
						window.newProject(project_hash, response.onshape);
						closeMenu();
					}).appendTo(menu);
				if(response.rights_level >= 3) {
					if(response.onshape) 
						$('<div/>').html('<i class="fa fa-fw fa-user-plus"></i>Manage Collaborators').on('click', function(e) {
				  		window.showPopupOnTop();
				  		$('.popup_dialog .full').html("<div class='title'>Manage Collaborators</div><div>This Project is linked to an Onshape document.  <a href='https://cad.onshape.com/documents/" + response.onshape_did + "' target='_blank'>Open the document in Onshape</a> and manage collaborators within the Onshape window.</div>");
				      $('.popup_dialog .bottom_links').html('<button class="close">Close</button>');
				      window.resizePopup(true);
						}).appendTo(menu);
					else
						$('<div/>').html('<i class="fa fa-fw fa-user-plus"></i>Manage Collaborators').on('click', function(e) {
							window.openSharingDialog(project_hash, 'Project');
							closeMenu();
						}).appendTo(menu);
				}
				if(response.rights_level >= 1) 
					$('<div/>').html('<i class="fa fa-fw fa-code"></i>Embed Project').on('click', function(e) {
	    			window.trackEvent("Worksheet", "Embed Dialog","From Menu");
						window.openEmbedDialog(project_hash, 'Project');
						closeMenu();
					}).appendTo(menu);
				if(!response.onshape)
					$('<div/>').html('<i class="fa fa-fw fa-archive"></i>Archive Project').on('click', function(e) {
						// Archive
						el.find('.fa-cog').removeClass('fa-cog').addClass('fa-spinner').addClass('fa-pulse');
						window.ajaxRequest("/projects/archive", { add: "true", hash_string: project_hash, data_type: 'Project'}, function(response) { 
							el.slideUp({duration: 200, always: function() { el.remove(); } }); 
							if(!window.location.href.match(/\/archive_projects\//) && !window.location.href.match(/.com(:3000)?\/archive/)) {
								// Not in an archive view, so remove returned ids
								for(var i = 0; i < response.hashes.length; i++) {
									$('.worksheet_hash_' + response.hashes[i]).slideUp({duration: 200, always: function() { $(this).remove(); } });
								}
							} else {
								// in an archive view...so refresh if on listing page
								if(!SwiftCalcs.pushState.fragment.match(/^(worksheets|revisions)\//i)) SwiftCalcs.pushState.refresh();
							}
						}, function() { el.find('.fa-spinner').removeClass('fa-spinner').removeClass('fa-pulse').addClass('fa-cog'); });
						closeMenu();
					}).appendTo(menu);
				if((response.rights_level >= 3) && (!response.onshape_parent) && (!response.onshape_element))
					$('<div/>').html('<i class="fa fa-fw fa-pencil-square-o"></i>Rename Project').on('click', function(e) {
						promptDialog('Rename your project', 'Rename', project_name, function(el, project_hash) { return function(name) { processProjectRename(el, project_hash, name) }; }(el, project_hash));
						closeMenu();
					}).appendTo(menu);
				if(el.closest(".left_item.team").length == 0) {
					if(response.onshape_parent || response.onshape_element)
						$('<div/>').html('<i class="fa fa-fw fa-trash"></i>Delete Project').on('click', function(e) {
				  		window.showPopupOnTop();
				  		$('.popup_dialog .full').html("<div class='title'>Delete Project</div><div>This Project is linked to an Onshape document.  <a href='https://cad.onshape.com/documents/" + response.onshape_did + "' target='_blank'>Open the document in Onshape</a> to delete it.</div>");
				      $('.popup_dialog .bottom_links').html('<button class="close">Close</button>');
				      window.resizePopup(true);
						}).appendTo(menu);
					else if(response.rights_level >= 4) 
						$('<div/>').html('<i class="fa fa-fw fa-trash"></i>Delete Project').on('click', function(e) {
							if(confirm('Are you sure?  All worksheets inside this project will be destroyed as well.  You are the owner of this project, and it will be removed for all collaborators as well.  This action cannot be undone.')) {
		    				window.trackEvent("Project", "Remove");
								window.removeProject(el, project_hash);
								el.remove();
							}
							closeMenu();
						}).appendTo(menu);
					else  
						$('<div/>').html('<i class="fa fa-fw fa-trash"></i>Remove Project').on('click', function(e) {
							if(confirm('Are you sure?  You are not the owner of this project, it will be removed from your project list but will still be available to collaborators.  Any worksheets you own inside this project will be destroyed and cannot be recovered.  You can gain access to this project again at a later date by having a project admins re-invite you to the project.')) {
								window.trackEvent("Project", "Delete");
								window.removeProject(el, project_hash);
								el.remove();
							}
							closeMenu();
						}).appendTo(menu);
				}
			}
			menu.on('mouseleave', function(e) {
				closeMenu();
			});
		}
		window.ajaxRequest('/projects/rights_level', {hash_string: project_hash}, success, fail);
		menu.appendTo('.base_layout').css('top', top + 'px').css('left', left + 'px');
		e.preventDefault();
		e.stopPropagation();
	});

	var processProjectRename = function(el, project_hash, new_name) {
		el.attr('data-name', new_name);
		el.children('.project_title').children('.name').html(new_name);
		window.ajaxRequest("/projects/rename", { hash_string: project_hash, name: new_name }, function() { 
			window.hidePopupOnTop(); 
      $('.project_list').find('.item').each(function() {
      	if($(this).attr('data-hash') == project_hash) 
      		$(this).children('.project_title').children('.name').html(new_name);
      });
		}, function() { window.hidePopupOnTop(); });
	}
	// Archive button
	$('body').on('click', '.worksheet_item i.fa-archive', function(e) {
		var w_id = $(this).closest('.worksheet_item').attr('data-hash');
		if($(this).closest('.worksheet_item').hasClass('archived')) {
			unArchive(w_id, 'Worksheet');
		} else {
			Archive(w_id, 'Worksheet');
		}
		$(this).removeClass('fa-archive').addClass('fa-spinner').addClass('fa-pulse').addClass('archiving');
		e.preventDefault();
		e.stopPropagation();
	});
	var Archive = window.Archive = function(data_hash, data_type) {
		toggleArchive(data_hash, data_type, true);
	}
	var unArchive = window.unArchive = function(data_hash, data_type) {
		toggleArchive(data_hash, data_type, false);
	}
	var toggleArchive = function(data_hash, data_type, add) {
		if(data_type == 'Worksheet') {
    	window.trackEvent("Worksheet", add ? "Archive" : "Unarchive", data_hash);
			var flipArchive = function(flip) {
				$('.worksheet_item').each(function() {
					if($(this).attr('data-hash') == data_hash) {
						if(!flip) {
							$(this).find('i.archiving').removeClass('fa-spinner').removeClass('fa-pulse').removeClass('archiving').addClass('fa-archive');
							return;
						} else {
							var to_rem = $(this);
							if(to_rem.closest('.single_sheet').length > 0) {
								// Single item on page, don't remove me!
								to_rem.find('i.archiving').removeClass('fa-spinner').removeClass('fa-pulse').removeClass('archiving').addClass('fa-archive');
								if(add) to_rem.addClass('archived');
								else to_rem.removeClass('archived');
							} else {
								// In a list
								if(to_rem.closest('.active_worksheet').length > 0) {
									closeActive(to_rem.closest('.active_worksheet'));
									to_rem.addClass('closing').slideUp({duration: 400, always: function() { to_rem.remove(); } });
								} else 
									to_rem.addClass('closing').slideUp({duration: 200, always: function() { to_rem.remove(); } });
			      		var h = to_rem.closest('.worksheet_holder_box')
		      			if(h.find('.worksheet_item').length <= 1) {
									h.slideUp({duration: 200, always: function() { $(this).remove(); } });
									h.prev('.date_box').slideUp({duration: 200, always: function() { $(this).remove(); } });
		      			}
		      		}
						}
					}
				});
			}
		} else {
    	window.trackEvent("Project", add ? "Archive" : "Unarchive", data_hash);
			var flipArchive = function(flip) { }
		}
		window.ajaxRequest("/projects/archive", { hash_string: data_hash, data_type: data_type, add: add }, function() { flipArchive(true); }, function() { flipArchive(false); });
	}
	$('body').on('click', '.archive_not_loaded', function(e) {
		$(this).children('.project_list').html('<i class="fa fa-spinner fa-pulse"></i>').addClass('archive_tree');
		$(this).removeClass('archive_not_loaded');
		window.ajaxRequest("/projects/archive_tree", { }, function(response) { $('.archive_tree').html(response.archive_html).removeClass('archive_tree'); }, function() { $('.archive_tree').html('An error occurred').removeClass('archive_tree').closest('.left_item').addClass('archive_not_loaded'); });
	});
	$('body').on('click', '.onshape_not_loaded', function(e) {
		$(this).children('.project_list').html('<i class="fa fa-spinner fa-pulse"></i>').addClass('onshape_tree');
		$(this).removeClass('onshape_not_loaded');
		window.ajaxRequest("/projects/onshape_tree", { }, function(response) { $('.onshape_tree').html(response.onshape_html).removeClass('onshape_tree'); }, function() { $('.onshape_tree').html('An error occurred').removeClass('onshape_tree').closest('.left_item').addClass('onshape_not_loaded'); });
	});
	$('body').on('click', '.fusion_not_loaded', function(e) {
		$(this).children('.project_list').html('<i class="fa fa-spinner fa-pulse"></i>').addClass('fusion_tree');
		$(this).removeClass('fusion_not_loaded');
		window.ajaxRequest("/projects/fusion_tree", { }, function(response) { $('.fusion_tree').html(response.fusion_html).removeClass('fusion_tree'); }, function() { $('.fusion_tree').html('An error occurred').removeClass('fusion_tree').closest('.left_item').addClass('fusion_not_loaded'); });
	});
	$('body').on('click', '.team_not_loaded', function(e) {
		$(this).children('.project_list').html('<i class="fa fa-spinner fa-pulse"></i>').addClass('team_tree');
		$(this).removeClass('team_not_loaded');
		window.ajaxRequest("/projects/team_tree", { }, function(response) { $('.team_tree').html(response.team_html).removeClass('team_tree'); }, function() { $('.team_tree').html('An error occurred').removeClass('team_tree').closest('.left_item').addClass('team_not_loaded'); });
	});
	$('body').on('click', '.shared_not_loaded', function(e) {
		$(this).children('.project_list').html('<i class="fa fa-spinner fa-pulse"></i>').addClass('shared_tree');
		$(this).removeClass('shared_not_loaded');
		window.ajaxRequest("/projects/shared_tree", { }, function(response) { $('.shared_tree').html(response.shared_html).removeClass('shared_tree'); }, function() { $('.shared_tree').html('An error occurred').removeClass('shared_tree').closest('.left_item').addClass('shared_not_loaded'); });
	});
	var closeActive = window.closeActive = function(el, clear_url, dont_check_for_empty) { 
		window.selectToolboxTab('projects_list');
		$('.base_layout').removeClass('worksheet_open');
		if(SwiftCalcs.active_worksheet) SwiftCalcs.active_worksheet.unbind();
		if((dont_check_for_empty === false) && SwiftCalcs.pushState.last_active_url.match(/^(\/)?$/)) {
			// Closing a worksheet that was 'maximized', so we should load the active list but prepend this to its top
			var item = el.children('.active_holder').children('.worksheet_item');
			prepend_to_list = {
				star_id: item.find('span.star fa').hasClass('fa-star'),
				name: item.attr('data-name'),
				parent_project_hash: item.attr('parent-hash'),
				hash_string: item.attr('data-hash'),
				archive_id: item.hasClass('archived')
			}
			window.setTimeout(function() { 
			  SwiftCalcs.pushState.navigate('/');
			  loadProject('active'); 
			}, 275);
		} else if(clear_url !== false) {
			$(document).prop('title', SwiftCalcs.pushState.last_active_title);
			SwiftCalcs.pushState.navigate(SwiftCalcs.pushState.last_active_url);
		}
		el.each(function() {
			var wrapper_box = $(this);
			var prev_box = wrapper_box.prev();
			wrapper_box.animate({'margin-left':0, 'margin-right': 0, 'padding-top': "-=15", 'padding-bottom': "-=15"}, {duration: 250});
			wrapper_box.children('.active_holder').children('.content').slideUp({duration: 250});
			wrapper_box.children('.active_holder').children('.details_span').slideUp({duration: 250});
			var timeout_function = function() {};
			if(prev_box)
				window.setTimeout(function() { prev_box.removeClass('add_bottom_border'); }, 275);
			window.setTimeout(function() {
				if(wrapper_box.hasClass('add_bottom_border')) wrapper_box.children('.active_holder').children('.worksheet_item, .invitation_item').addClass('add_bottom_border');
				wrapper_box.children('.active_holder').children('.worksheet_item, .invitation_item').detach().insertBefore(wrapper_box);
				wrapper_box.remove();
			}, 275);
		});
	};
	var beginLoad = false;
	var openActive = window.openActive = function(el, set_url) {
		beginLoad = false;
		closeActive($('.active_worksheet'), false, true);
		window.selectToolboxTab('toolbox_holder');
		var name = el.attr('data-name');
		$(document).prop('title', name);
		var hash_string = el.attr('data-hash');
		if(!SwiftCalcs.pushState.fragment.match(/^(worksheets|revisions)\//i) && (set_url !== false))
			SwiftCalcs.pushState.navigate('/inline_worksheets/' + hash_string + '/' + encodeURIComponent(name.replace(/( |\\|\.)/g,'_')));
		$('.base_layout').addClass('worksheet_open');
		var before_item = el.prev();
		var after_item = el.next();
		var wrapper_box = $('<div/>').addClass('active_worksheet').insertAfter(el);
		var wrapper = $('<div/>').addClass('active_holder').appendTo(wrapper_box);
		el.detach().appendTo(wrapper);
		if(typeof window.embedded === 'undefined') {
			if(before_item.length) 
				before_item.addClass('add_bottom_border');
			else 
				wrapper_box.css({'margin-top': '-10px', 'padding-top': '10px'});
			if(after_item.length == 0)
				wrapper_box.css({'margin-bottom': '-10px', 'padding-bottom': '10px'});
		}
		$content = $('<div class="content"></div>').hide();
    var menu_height = Math.max(Math.max(40, $("#account_bar td.middle").height()), $("#account_bar td.right").height()) + $('#toolbar_holder').height();
		$content.appendTo(wrapper);
		$loader = $('<div class="loader"><i class="fa fa-spinner fa-pulse"></i></div>').appendTo(wrapper).hide().slideDown({duration: 250, progress: function() {
			var offset = wrapper_box.offset();
			var to_scroll = Math.max(0, $(window).scrollTop() - offset.top + menu_height);
			if(to_scroll > 0) $(window).scrollTop($(window).scrollTop() - to_scroll);
		}, always: function() { beginLoad = true; }});
		if(typeof window.embedded === 'undefined') {
			if(window.matchMedia("only screen and (max-device-width: 480px)").matches)
				wrapper_box.animate({'padding-top': "+=15", 'padding-bottom': "+=15"}, {duration: 250});
			else
				wrapper_box.animate({'margin-left':-30, 'margin-right': -30, 'padding-top': "+=15", 'padding-bottom': "+=15"}, {duration: 250});
		}
	}
	$('body').on('click', '.worksheet_item, .invitation_item', function(e) {
		if($(this).hasClass('worksheet_loading')) return;
		if($(this).hasClass('screen_explanation')) return;
		if($(this).closest('.active_worksheet').length) {
			closeActive($(this).closest('.active_worksheet'), false, false); 
			if(current_project_navigable_url)
				SwiftCalcs.pushState.navigate(current_project_navigable_url);
			else if(SwiftCalcs.pushState.last_active_url) {
				$(document).prop('title', SwiftCalcs.pushState.last_active_title);
				SwiftCalcs.pushState.navigate(SwiftCalcs.pushState.last_active_url);
			} else
				SwiftCalcs.pushState.navigate('/active/');
		}	else if(($(this).attr('data-project')*1) == 1) 
			window.loadProject($(this).attr('data-hash'), $(this).attr('data-name'));
		else {
			openActive($(this));
			window.loadWorksheet($(this));
		}
	});
	var loadWorksheet = window.loadWorksheet = function(el, response) {
		var hash_string = el.attr('data-hash');
    window.trackEvent("Worksheet", "Load", hash_string);
		var el_next = el.next('.content');
		if(el_next.length == 0) el_next = $('<div/>').addClass('content').insertAfter(el);
		var success = function(response) {
      if(SwiftCalcs.active_worksheet) SwiftCalcs.active_worksheet.unbind();
      var worksheet = SwiftCalcs.Worksheet(response);
      if(window.embedded) {
      	$('div.header .name').html(response.name);
      	$('div.header .fa-external-link').attr('data-type','worksheets').attr('data-hash',response.hash_string);
      }
      worksheet.bind(el_next);
      el_next.show();
      worksheet.load(response);
      worksheet.setWidth();
      if(el.hasClass('change_name')) {
      	el.removeClass('change_name');
      	el.find('.name .hover').click();
      	el.find('.name_change input').select();
      } else if(window.embedded)
      	window.setTimeout(function() { if(SwiftCalcs.active_worksheet) { SwiftCalcs.active_worksheet.blur(); } });
      else
    		window.setTimeout(function() { if(SwiftCalcs.active_worksheet) { SwiftCalcs.active_worksheet.blur().focus(); SwiftCalcs.active_worksheet.ends[-1].focus(-1); } });
      if(response.folder_hash) 
        window.setCurrentProject(response.folder_hash, response.folder_url_end, response.no_save);
		}
		var try_success = function(response) {
			if(beginLoad) success(response);
			else window.setTimeout(function() { try_success(response); }, 50);
		}
		var fail = function(response) {
			if(window.embedded) 
				$(".worksheet_holder").html("<div class='message'><h2>There was an error encountered</h2><p>" + response + "</p><p>If you are not logged in, try visiting <a href='/' target='_blank'>swiftcalcs.com</a> and logging in to resolve this problem.</p></div>");
			return;
		}
		if(typeof response == 'object')
			success(response);
		else
			window.ajaxRequest("/worksheet_commands", { command: 'get_worksheet', data: {hash_string: hash_string} }, try_success, fail);
	}
	$('body').on('click', '.project_item', function(e) {
		if($(this).closest(".details_span").length) return;
		var archive = $(this).closest('.archived').length > 0;
		window.loadProject($(this).attr('data-hash_string'), $(this).attr('data-name'), archive);
	});
	$('body').on('click', 'td.location', function(e) {
		window.moveWorksheet($(this).closest('.active_holder').children('.worksheet_item, .invitation_item'));
	});
	var moveWorksheet = window.moveWorksheet = function(el, remove_after_move) {
    window.trackEvent("Worksheet", "Move");
		var dets = el.closest('.active_holder').children('.details_span');
		var success = function(response) {
			window.hidePopupOnTop();
			el.attr('parent-hash', response.hash_string);
			if(response.path) 
				dets.find('td.location > div').html(response.path);
			else
				dets.find('td.location > div').html('No Project');
		}
		var fail = function(response) {
			window.hidePopupOnTop();
			dets.find('td.location > div').html('<div class="placeholder">An error occurred</div>');
		}
		var processMove = function(project_hash) {
			dets.find('td.location > div').html('<i class="fa fa-spinner fa-pulse"></i>');
			window.ajaxRequest("/projects/move", { data_type: 'Worksheet', hash_string: el.attr('data-hash'), project_hash: project_hash, current_view: current_project_hash}, success, fail);
		}
		moveDialog(processMove, el.attr('parent-hash'));
	}
	$('body').on('click', 'td.revisions', function(e) {
    window.trackEvent("Worksheet", "Load Revisions", "From Header");
		window.loadRevisions($(this).closest('.active_holder').children('.worksheet_item, .invitation_item').attr('data-hash'), $(this).closest('.active_holder').children('.worksheet_item, .invitation_item').attr('data-name'));
	});
	$('body').on('click', 'td.collaborators', function(e) {
    window.trackEvent("Worksheet", "Sharing Dialog","From Header");
		window.openSharingDialog($(this).closest('.active_holder').children('.worksheet_item, .invitation_item').attr('data-hash'), 'Worksheet');
	});
	$('body').on('click', 'nav.menu .share_dialog', function(e) {
		window.trackEvent("Worksheet", "Sharing Dialog","From Menu");
		if(SwiftCalcs.active_worksheet)
			window.openSharingDialog(SwiftCalcs.active_worksheet.hash_string, 'Worksheet');
		else if(current_project_hash)
			window.openSharingDialog(current_project_hash, 'Project');
		else 
			window.showNotice("Open a worksheet or Project to Share", "red");
		e.preventDefault();
		return false;
	});
	$('body').on('click', 'nav.menu .embed_dialog', function(e) {
		window.trackEvent("Worksheet", "Embed Dialog","From Menu");
		if(SwiftCalcs.active_worksheet)
			window.openEmbedDialog(SwiftCalcs.active_worksheet.hash_string, 'Worksheet');
		else if(current_project_hash)
			window.openEmbedDialog(current_project_hash, 'Project');
		else 
			window.showNotice("Open a worksheet or Project to Embed", "red");
		e.preventDefault();
		return false;
	});
	$('body').on('click', '.sharing_icon', function(e) {
		window.openSharingDialog($(this).attr('data-hash'), $(this).attr('data-type'));
		e.preventDefault();
		return false;
	});

	$('body').on('click', 'nav.menu .fileopen', function(e) {
		window.loadProject($(this).attr('data-cmd'));
		e.preventDefault();
		return false;
	});

	$('body').on('click', 'nav.menu .save', function(e) {
		if($(this).closest('nav.menu').hasClass('noWorksheet')) return false;
		if(SwiftCalcs.active_worksheet) SwiftCalcs.active_worksheet.save();
		e.preventDefault();
		return false;
	});

	$('body').on('click', 'nav.menu .closeActive', function(e) {
		if($(this).closest('nav.menu').hasClass('noWorksheet')) return false;
		window.closeActive($('.active_worksheet'), false, false);
		if(current_project_navigable_url)
			SwiftCalcs.pushState.navigate(current_project_navigable_url);
		else if(SwiftCalcs.pushState.last_active_url) {
			$(document).prop('title', SwiftCalcs.pushState.last_active_title);
			SwiftCalcs.pushState.navigate(SwiftCalcs.pushState.last_active_url);
		} else
			SwiftCalcs.pushState.navigate('/active/');
		e.preventDefault();
		return false;
	});
	$('body').on('click', 'nav.menu .print', function(e) {
		if(SwiftCalcs.active_worksheet) {
    	window.trackEvent("Worksheet", "Print");
			window.showLoadingPopup();
			$('.loading_box .name').html('Preparing to Print: Calculating...');
			var doPrint = function() {
				if(SwiftCalcs.active_worksheet && SwiftCalcs.active_worksheet.loaded && (SwiftCalcs.active_worksheet.ready_to_print || !SwiftCalcs.giac.auto_evaluation)) {
					SwiftCalcs.active_worksheet.blur();
					window.setTimeout(function() { // Delay to allow animations to finish, SVG plots to be generated, etc
						window.hidePopupOnTop();
						$('.loading_box .name').html('Loading');
						window.print();
					}, 400);
				} else
					window.setTimeout(doPrint, 250);
			}
			doPrint();
		} else window.print();
		e.preventDefault();
		return false;
	});

	window.download_pdf = function() {
		// Assume worksheet is open right now
		if(!SwiftCalcs.active_worksheet || !SwiftCalcs.active_worksheet.jQ) return;
		window.showPopupOnTop();
		$('.popup_dialog .full').html("<div class='title'>Print to PDF</div>If you have a <i>Print to PDF</i> option on your computer, we recommend using that to provide more control over the output.<BR><a class='button' style='color:white;margin:5px 50px;text-align:center;' onclick='$(\"body nav.menu .print\").click(); return false;'>Open Print Dialog to use Print to PDF</a><BR><BR><div class='title'>Email Me a PDF</div>If you do not have a <i>Print to PDF</i> capability, select your options below.  We will generage the PDF and email it to you in 3-10 minutes:<BR>Page Size: <select><option value='Letter'>US Letter</option><option value='A4'>A4</option><option value='Legal'>Legal</option></select><br><label><input type=checkbox class='pages' checked style='width:auto;'> Include Page Numbers in Footer</label><BR><a class='button grey' style='color:white;margin:5px 50px;text-align:center;' onclick='window.download_pdf2();return false;'>Generate and Email PDF</a>");
    $('.popup_dialog .bottom_links').html('');
		window.resizePopup(true);
	}
	window.download_pdf2 = function() {
		window.showLoadingPopup();
		$('.loading_box .name').html('Preparing to Convert: Preparing...');
		SwiftCalcs.active_worksheet.blur();
		SwiftCalcs.active_worksheet.jQ.closest(".worksheet_holder").width(620);
		SwiftCalcs.active_worksheet.setWidth();
		window.setTimeout(function() {
			window.download_pdf3();
		},500); // Need to delay to allow plots to re-render
	}
	window.download_pdf3 = function() {
		var pages = $('.popup_dialog .pages').is(':checked') ? '1' : '0';
		var paper = $('.popup_dialog select').val();
		window.hidePopupOnTop();
		$('.loading_box .name').html('Loading');
		if(!SwiftCalcs.active_worksheet || !SwiftCalcs.active_worksheet.jQ) return;
		var html = SwiftCalcs.active_worksheet.jQ.closest(".active_worksheet").html();
		window.resizeResults();
		SwiftCalcs.active_worksheet.setWidth();
		window.showLoadingOnTop();
		window.ajaxRequest('/worksheets/pdf/' + SwiftCalcs.active_worksheet.hash_string,{html: html, pages: pages, paper: paper},function() { window.hidePopupOnTop(); showNotice("Your request has been received.  You should receive an email in a few minutes.","green")},function() { window.hidePopupOnTop(); });
	}

	$('body').on('click', 'nav.menu .to_pdf', function(e) {
		if(SwiftCalcs.active_worksheet) {
    	window.trackEvent("Worksheet", "Download as PDF");
			window.showLoadingPopup();
			$('.loading_box .name').html('Preparing to Convert: Calculating...');
			var doPrint = function() {
				if(SwiftCalcs.active_worksheet && SwiftCalcs.active_worksheet.loaded && (SwiftCalcs.active_worksheet.ready_to_print || !SwiftCalcs.giac.auto_evaluation)) {
					window.setTimeout(function() { // Delay to allow animations to finish, SVG plots to be generated, etc
						window.hidePopupOnTop();
						$('.loading_box .name').html('Loading');
						window.download_pdf();
					}, 400);
				} else
					window.setTimeout(doPrint, 250);
			}
			if(SwiftCalcs.active_worksheet && SwiftCalcs.active_worksheet.loaded && (SwiftCalcs.active_worksheet.ready_to_print || !SwiftCalcs.giac.auto_evaluation)) 
				window.download_pdf();
			else
				doPrint();
		} else showNotice("Please open a worksheet to download as PDF","red");
		e.preventDefault();
		return false;
	});


	$('body').on('click', '.worksheet_item i.fa-ellipsis-v', function(e) {
		var archived = $(this).closest('.archive').length > 0;
		var offset = $(this).offset();
		var top = offset.top - $(window).scrollTop();
		var left = offset.left - $(window).scrollLeft();
		var worksheet_hash = $(this).closest('.worksheet_item').attr('data-hash');
		var el = $(this).closest('.worksheet_item');
		var window_touch = function(e) {
			if($(e.target).closest('.project_menu').length == 0) closeMenu();
		}
		var closeMenu = function() {
			el.removeClass('force_hover');
			$('.project_menu').remove();
			$(window).off('touchstart', window_touch);
		}
		$(window).on('touchstart', window_touch);
		closeMenu();
		el.addClass('force_hover');
		var menu = $('<div/>').addClass('project_menu').addClass('loading').addClass('loading_' + worksheet_hash).on('mouseleave', function(e) {
			closeMenu();
		});
		$('<div/>').html('<i class="fa fa-fw fa-pulse fa-spinner"></i>').appendTo(menu);
		var fail = function(message) {
			closeMenu();
		}
		var success = function(response) {
			if($('.loading_' + worksheet_hash).length == 0) return;
			el.attr('data-hash', response.hash_string);
			var menu = $('.loading_' + worksheet_hash).removeClass('loading_' + worksheet_hash).removeClass('loading').off('mouseleave');
			menu.find('div').remove();
			$('<div/>').html('<i class="fa fa-fw fa-external-link"></i>Open in Full Window').on('click', function(e) {
				el.find('.fa-external-link').click();
				closeMenu();
			}).appendTo(menu);
			if(response.rights_level >= 2) 
				$('<div/>').html('<i class="fa fa-fw fa-files-o"></i>Create a Copy').on('click', function(e) {
					window.newWorksheet(true, worksheet_hash);
					closeMenu();
				}).appendTo(menu);
			if(response.rights_level >= 3) 
				$('<div/>').html('<i class="fa fa-fw fa-share"></i>Move Worksheet').on('click', function(e) {
					window.moveWorksheet(el, true);
					closeMenu();
				}).appendTo(menu);
			if(response.rights_level >= 3) 
				$('<div/>').html('<i class="fa fa-fw fa-code-fork"></i>View Forks').on('click', function(e) {
					window.loadCopies(el.attr('data-hash'));
					closeMenu();
				}).appendTo(menu);
			if(archived) {
				$('<div/>').html('<i class="fa fa-fw fa-archive"></i>Restore Worksheet').on('click', function(e) {
					el.find('.fa.unarchive').click();
					closeMenu();
				}).appendTo(menu);
			} else {
				$('<div/>').html('<i class="fa fa-fw fa-archive"></i>Archive Worksheet').on('click', function(e) {
					el.find('.fa.archive').click();
					closeMenu();
				}).appendTo(menu);
			}
			$('<div/>').html('<i class="fa fa-fw fa-download"></i>Download as PDF').on('click', function(e) {
				closeMenu();
				if(SwiftCalcs.active_worksheet) {
		    	window.trackEvent("Worksheet", "Download as PDF");
					window.showLoadingPopup();
					$('.loading_box .name').html('Preparing to Convert: Calculating...');
					var doPrint = function() {
						if(SwiftCalcs.active_worksheet && SwiftCalcs.active_worksheet.loaded && (SwiftCalcs.active_worksheet.ready_to_print || !SwiftCalcs.giac.auto_evaluation)) {
							window.setTimeout(function() { // Delay to allow animations to finish, SVG plots to be generated, etc
								window.hidePopupOnTop();
								$('.loading_box .name').html('Loading');
								window.download_pdf();
							}, 400);
						} else
							window.setTimeout(doPrint, 250);
					}
					if(SwiftCalcs.active_worksheet && SwiftCalcs.active_worksheet.loaded && (SwiftCalcs.active_worksheet.ready_to_print || !SwiftCalcs.giac.auto_evaluation)) 
						window.download_pdf();
					else
						doPrint();
				} else showNotice("Please open a worksheet to download as PDF","red");
				e.preventDefault();
				return false;
			}).appendTo(menu);
			if(response.rights_level >= 3) 
				$('<div/>').html('<i class="fa fa-fw fa-pencil-square-o"></i>Rename').on('click', function(e) {
					if(el.closest('.active_holder').length > 0) {
						el.find('.name .hover').click();
					} else {
						promptDialog('Rename Worksheet', 'Rename', el.attr('data-name'), function(worksheet_hash, el) { return function(name) { processRename(el, name, worksheet_hash) }; }(worksheet_hash, el));
					}
					closeMenu();
				}).appendTo(menu);
			if(response.rights_level >= 3) 
				$('<div/>').html('<i class="fa fa-fw fa-user-plus"></i>Manage Collaborators').on('click', function(e) {
    			window.trackEvent("Worksheet", "Sharing Dialog","From Menu");
					window.openSharingDialog(worksheet_hash, 'Worksheet');
					closeMenu();
				}).appendTo(menu);
			if(response.rights_level >= 1) 
				$('<div/>').html('<i class="fa fa-fw fa-code"></i>Embed Worksheet').on('click', function(e) {
    			window.trackEvent("Worksheet", "Embed Dialog","From Menu");
					window.openEmbedDialog(worksheet_hash, 'Worksheet');
					closeMenu();
				}).appendTo(menu);
			if(response.rights_level >= 3) 
				$('<div/>').html('<i class="fa fa-fw fa-history"></i>View Revisions').on('click', function(e) {
    			window.trackEvent("Worksheet", "Load Revisions", "From Menu");
					window.loadRevisions(worksheet_hash, el.attr('data-name'));
					closeMenu();
				}).appendTo(menu);
			if(response.rights_level >= 4) 
				$('<div/>').html('<i class="fa fa-fw fa-trash"></i>Delete Worksheet').on('click', function(e) {
					if(confirm('Are you sure?  You are the owner of this worksheet, and it will be removed for collaborators as well.  This action cannot be undone.')) {
    				window.trackEvent("Worksheet", "Remove");
						window.removeWorksheet(el, worksheet_hash);
					}
					closeMenu();
				}).appendTo(menu);
			else  
				$('<div/>').html('<i class="fa fa-fw fa-trash"></i>Delete Worksheet').on('click', function(e) {
					if(confirm('Are you sure?  You are not the owner of this worksheet, it will be removed from your worksheet list but will still be available to collaborators.  This action can only be undone by having worksheet admins re-invite you to the worksheet.')) {
						window.trackEvent("Worksheet", "Delete");
						window.removeWorksheet(el, worksheet_hash);
					}
					closeMenu();
				}).appendTo(menu);
			menu.css('top', '0px').css('left', '0px');
			var wide = menu.width();
			menu.css('top', (top -5) + 'px').css('left', Math.max(0, left - wide + 30) + 'px').on('mouseleave', function(e) {
				closeMenu();
			});
		}
		menu.appendTo('.base_layout').css('top', '0px').css('left', '0px');
		var wide = menu.width();
		menu.css('top', (top -5) + 'px').css('left', Math.max(0, left - wide + 30) + 'px');
		window.ajaxRequest('/worksheet_commands', { command: 'rights_level', data: { hash_string: worksheet_hash } }, success, fail);
		e.preventDefault();
		e.stopPropagation();
	});
	var removeWorksheet = window.removeWorksheet = function(el, worksheet_hash) {
		SwiftCalcs.ajaxQueue.killSaves(worksheet_hash);
		el.find('.name .hover').hide();
		el.find('.name').append('<span class="fa fa-spinner fa-pulse"></span>');
		var success = function(response) {
			if(el.closest('.single_sheet').length > 0) {
				// Single item on page, delete and move!
				SwiftCalcs.pushState.navigate('/active/', { trigger: true });
			} else {
				// In a list
				if(current_project_navigable_url)
					SwiftCalcs.pushState.navigate(current_project_navigable_url);
				else
					SwiftCalcs.pushState.navigate('/active/');
				if(el.closest('.active_worksheet').length > 0) {
					closeActive(el.closest('.active_worksheet'), false, true);
					el.addClass('closing').slideUp({duration: 400, always: function() { el.remove(); } });
				} else 
					el.addClass('closing').slideUp({duration: 200, always: function() { el.remove(); } });
    		var h = el.closest('.worksheet_holder_box')
  			if(h.find('.worksheet_item').length <= 1) {
					h.slideUp({duration: 200, always: function() { $(this).remove(); } });
					h.prev('.date_box').slideUp({duration: 200, always: function() { $(this).remove(); } });
  			}
  		}
		}
		var fail = function(message) {
			el.find('.name .fa.fa-spinner').remove();
			el.find('.name .hover').show();
		}
		window.ajaxRequest("/projects/remove", { data_type: 'Worksheet', hash_string: worksheet_hash }, success, fail);
		window.hidePopupOnTop();
	}
	var removeProject = window.removeProject = function(el, project_hash) {
		var success = function(response) {
			window.hidePopupOnTop();
			ids = response.project_hashes.split(",");
			for(var i = 0; i > ids.length; i++) {
				if(ids[i] == current_project_hash) {
					window.loadProject('active');
					break;
				}
			}
		}
		var fail = function(message) {
			window.hidePopupOnTop();
			showNotice('red', message);
		}
		window.ajaxRequest("/projects/remove", { data_type: 'Project', hash_string: project_hash }, success, fail);
		window.hidePopupOnTop();
		window.showLoadingOnTop();
	}
	var processRename = function(el, name, worksheet_hash) {
		el.find('.name .hover').hide();
		el.find('.name').append('<span class="fa fa-spinner fa-pulse"></span>');
		var success = function(response) {
			el.find('.name .fa.fa-spinner').remove();
			el.find('.name .hover').html(name).show();
		}
		var fail = function(message) {
			el.find('.name .fa.fa-spinner').remove();
			el.find('.name .hover').show();
		}
		window.ajaxRequest("/worksheet_commands", { command: 'rename', data: {hash_string: el.attr('data-hash'), name: name} }, success, fail);
		window.hidePopupOnTop();
	}
	var newWorksheet = window.newWorksheet = function(duplicate, worksheet_hash, revision_hash, lend_author_rights) {
    if(duplicate && revision_hash) window.trackEvent("Worksheet", "Copy Revision", revision_hash);
    else if(duplicate) window.trackEvent("Worksheet", "Copy", worksheet_hash);
    else window.trackEvent("Worksheet", "New");
		$('.no_results').remove();
		window.closeScreenExplanation();
		closeActive($('.active_worksheet'), false, true);
		var name = "";
		post_data = {name: name, duplicate: (duplicate ? worksheet_hash : null), author_rights: (lend_author_rights ? true : false), revision: (duplicate ? revision_hash : null), project_hash: current_project_hash };
		$(window).scrollTop(0);
		var date_box = $('.today_box').first();
		if(date_box.length == 0) {
			var date_box = $('<div/>').addClass('date_box  today_box').html('Today');
			if($('.active_path').length > 0)
				date_box.insertAfter('.active_path');
			else
				date_box.prependTo('.worksheet_holder');
			date_box.hide().slideDown({duration: 150});
			$('<div/>').addClass('worksheet_holder_box').insertAfter(date_box).hide().slideDown({duration: 150});
		}
		var loading_div = $('<div/>').addClass('worksheet_loading').addClass('worksheet_item').attr('data-hash', '-1').html('<i class="fa fa-spinner fa-pulse"></i><span>' + (duplicate ? 'Copying' : 'Creating') + ' Worksheet...</span>').prependTo(date_box.next()).hide().slideDown({duration: 200});
		var success = function(response) {
			if(window.location.href.match(/\/(worksheets|revisions)\//)) SwiftCalcs.pushState.navigate('/');
			var el = $('<div/>').addClass('worksheet_item').addClass('worksheet_hash_' + response.hash_string).attr('data-hash', response.hash_string).attr('data-name', response.name).attr('parent-hash', current_project_hash).html(worksheet_html({name: response.name, star_id: false})).insertAfter(loading_div);
			if(response.archive_id) el.addClass('archived');
			loading_div.remove();
			el.addClass('change_name');
			openActive(el);
			window.loadWorksheet(el, response);
		}
		var fail = function(message) {
			loading_div.remove();
		}
		window.ajaxRequest("/worksheet_commands", { command: (duplicate ? 'copy_worksheet': 'new_worksheet'), data: post_data }, success, fail);
		window.hidePopupOnTop();
	}
	$('body').on('mouseenter', '.new_bubble.new_worksheet', function() {
		var closeBubble = function() {
			$('.new_bubble_mouseover').remove();
			$('.new_bubble.new_project').fadeOut(150);
		}
		$('.new_bubble.new_project').fadeIn(150);
		$('<div/>').addClass('new_bubble_mouseover').css({
			position: 'fixed',
			top: 0,
			left: 0,
			right: 75,
			bottom: 0,
			"z-index": 100000
		}).appendTo('body').on('mouseover', closeBubble);
		$('<div/>').addClass('new_bubble_mouseover').css({
			position: 'fixed',
			top: 0,
			left: 0,
			right: 0,
			bottom: 150,
			"z-index": 100000
		}).appendTo('body').on('mouseover', closeBubble);
		$('<div/>').addClass('new_bubble_mouseover').css({
			position: 'fixed',
			top: 0,
			width: 15,
			right: 0,
			bottom: 0,
			"z-index": 100000
		}).appendTo('body').on('mouseover', closeBubble);
		$('<div/>').addClass('new_bubble_mouseover').css({
			position: 'fixed',
			height: 35,
			width: 60,
			right: 15,
			bottom: 0,
			"z-index": 100000
		}).appendTo('body').on('mouseover', closeBubble);
	});
	$('body').on('click', '.new_bubble.new_worksheet', function(e) {
		window.newWorksheet(false);
		$('.new_bubble_mouseover').remove();
		$('.new_bubble.new_project').fadeOut(150);
	});
	$('body').on('click', '.new_bubble.new_project', function(e) {
		if(allowNewProject)
			window.newProject();
		else {
  		window.showPopupOnTop();
  		$('.popup_dialog .full').html("<div class='title'>Add a new Sub-Project</div><div>Sub-Projects help you organize the Swift Calcs worksheets in your Onshape document.  To create a new sub-project, simply click the '+' icon in the bottom left of the screen and select 'Swift Calcs' from the 'Add a Application' menu.</div>");
      $('.popup_dialog .bottom_links').html('<button class="close">Close</button>');
      window.resizePopup(true);
		}
		$('.new_bubble_mouseover').remove();
		$('.new_bubble.new_project').fadeOut(150);
	});
	$('body').on('click', '.star_title', function(e) {
		var $container = $(this);
		if($container.closest('.popup_dialog').length) return;
		if($container.closest('.project_list').length > 0) {
			$project = $container.closest('.expand').closest('div.item');
			window.loadProject($project.attr('data-hash'), $project.attr('data-name'), false, true);
		} else
			window.loadProject('starred');
	});
	/*
	$('body').on('click', '.label_title', function(e) {
		var $container = $(this).closest('div.item');
		if($container.closest('.project_list').length > 0) {
			$project = $container.closest('.expand').closest('div.item').closest('.expand').closest('div.item');
			window.loadProject($project.attr('data-hash'), $project.attr('data-name'), false, $container.attr('data-hash'), $container.attr('data-name'));
		} else if($container.attr('data-project-hash'))
			window.loadProject($container.attr('data-project-hash'), $container.attr('data-project-name'), false, $container.attr('data-hash'), $container.attr('data-name'));
		else
			window.loadProject(null, null, false, $container.attr('data-hash'), $container.attr('data-name'));
	});
	$('body').on('click', '.label_title .fa-trash', function(e) {
		if(confirm('Are you sure?  Worksheets that you labeled will have the label removed.  Worksheets labeled by another user will retain the label.  This action cannot be undone.')) {
			var $container = $(this).closest('div.item');
			data = {id: $container.attr('data-id') } 
			window.trackEvent("Label", "Destroy", data.id);
			if($container.closest('.project_list').length > 0) 
				data.project_id = $container.closest('.expand').closest('div.item').closest('.expand').closest('div.item').attr('data-id');
			$icon = $(this);
			$icon.removeClass('fa-trash').addClass('fa-spinner').addClass('fa-pulse');
			var success = function(response) {
				$container.slideUp({duration: 200, always: function() { $(this).remove(); } });
			}
			var fail = function() {
				$icon.removeClass('fa-spinner').removeClass('fa-pulse').addClass('fa-trash');
			}
			window.ajaxRequest('/labels/delete', data, success, fail);
		}
		e.preventDefault();
		e.stopPropagation();
	});
	*/
	var resizeResults = window.resizeResults = function() {
		if(window.embedded) {
			$('.embed_container').css('width','auto');
			var width = Math.min(842, Math.max($('.worksheet_holder_outer_box').width(),250));
			$('.embed_container').width(width);
		} else { 
			if(window.matchMedia("only screen and (max-device-width: 480px)").matches)
				var width = Math.min(842, Math.max($('.worksheet_holder_outer_box').width(),250));
			else if(window.matchMedia("only screen and (max-device-width: 768px)").matches)
				var width = Math.min(842, Math.max($('.worksheet_holder_outer_box').width() - 90,250));
			else
				var width = Math.min(842, Math.max($('.worksheet_holder_outer_box').width() - 140,250));
			$('.worksheet_holder').width(width);
		}
	}
	window.resizeResults();
 	$('body').on('click', 'div.search_bar .fa-times-circle', function(e) {
 		$(this).closest('div.search_bar').find('input').val('');
 		SwiftCalcs.pushState.refresh(true);
 		e.preventDefault();
 		e.stopPropagation();
 	});
 	$('body').on('blur', 'div.search_bar input', function(e) {
 		SwiftCalcs.pushState.refresh(true);
 	}).on('keyup', 'div.search_bar input', function(e) {
 		if(e.which == 13) $(this).blur();
 	});
	var acceptInvite = function(el) {
		window.trackEvent("Invite", "Accept");
		processInvite(el, true);
	}
	var rejectInvite = function(el) {
		window.trackEvent("Invite", "Reject");
		processInvite(el, false);
	}
	var processInvite = function(el, accept) {
		el.find('.invite_accept').hide();
		el.find('.invite_reject').hide();
		el.find('.invite_pending').show();
		var count = $('.left_item.invites .invite_count');
		var new_count = count.html()*1 - 1;
		if(new_count > 0)
			count.html(new_count);
		else
			count.hide();
		var success = function(response) {
			if(el.closest('.active_worksheet').length > 0) {
				closeActive(el.closest('.active_worksheet'));
				el.addClass('closing').slideUp({duration: 400, always: function() { el.remove(); } });
			} else 
				el.addClass('closing').slideUp({duration: 200, always: function() { el.remove(); } });
  		var h = el.closest('.worksheet_holder_box')
			if(h.find('.invitation_item').length <= 1) {
				h.slideUp({duration: 200, always: function() { $(this).remove(); } });
				h.prev('.date_box').slideUp({duration: 200, always: function() { $(this).remove(); } });
			}
		}
		var fail = function(message) {
		el.find('.invite_accept').show();
		el.find('.invite_reject').show();
		el.find('.invite_pending').hide();
		}
		window.ajaxRequest("/projects/invite", {hash_string: el.attr('data-rights-hash'), add: accept }, success, fail);
	}
	$('.base_layout').on('click', '.invite_accept', function(e) {
		acceptInvite($(this).closest('.invitation_item'));
		e.preventDefault();
		e.stopPropagation();
	})
	$('.base_layout').on('click', '.invite_reject', function(e) {
		rejectInvite($(this).closest('.invitation_item'));
		e.preventDefault();
		e.stopPropagation();
	});
	var window_touch = function(e) {
		if(($(e.target).closest('.toolbox').length == 0) && ($(e.target).closest('.mobile_menu').length == 0)) {
			closeMobileprojects_list();
		}
	}
	var closeMobileprojects_list = window.closeMobileprojects_list = function() {
		if($('.toolbox').hasClass('show')) {
			$('.toolbox').removeClass('show');
			$('.mobile_menu').removeClass('show');
			$(window).off('touchstart', window_touch);
		}
	}
	$('.base_layout').on('click', '.mobile_menu', function(e) {
		if($(this).hasClass('show')) {
			closeMobileprojects_list();
		} else {
			$('.toolbox').addClass('show');
			$(this).addClass('show');
			$(window).on('touchstart', window_touch);
		}
		e.preventDefault();
		e.stopPropagation();
	});
	$('.base_layout').on('click', '.top_title .mobile_close', function(e) {
		closeMobileprojects_list();
		e.preventDefault();
		e.stopPropagation();
	});


});