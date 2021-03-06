/*
The AJAX queue class provides a set of functions to organize asynchronous server communications.
Commands can be queued through this class and then commands run in batches to reduce client-server 
calls. 

The main calls are:
saveNeeded(worksheet): called to indicate we should save.  After a save needed, a 2 second timer is started, after which the save occurs
if saveNeeded is again called in this timespan, the timer resets.  Whenever a change is made in a worksheet (keypress, etc) a saveNeeded is called.  When the timer expires, a save is triggered.  Save will use the toString method of workseet to create a textual representation of the worksheet for saving.  This is then diffed against the last known saved version, and a patch created.  The patch is sent to the server.  The server applies the patch to the version is has.  A version number is returned from the server, which is updated here.  The version numbering ensures that the client/server are synced and applying diff/patch to the same versioned file.

TODO: Update all of this to rely on real-time (SSE? websockets?) and allow real-time, multi-user editing of worksheets
*/


var ajaxQueueClass = P(function(_) {

	_.suppress = false;
	_.saving = false;
	_.save_message = 'All changes are saved';
	_.init = function() {
		this.holding_pen = {};
		this.server_version = {};
		this.known_server_version = {};
		this.should_be_server_version = {};
		this.server_archive = {};
		this.should_be_server_archive = {};
		this.ignore_errors = {};
		this.save_div = $('.save_div');
		this.jQ = {
			html: function(text) {
				if(text && text.length) {
					ajaxQueue.save_div.show().html(text);
				} else {
					ajaxQueue.save_div.hide();
				}
			}
		}
		this.jQ_fatal = $('.fatal_div');
		this.running = {};
	}

	/* 
	Queue management functions
	*/

	_.commit = function(id, full) {
		this.running[id] = true;
		this.jQ.html('Saving...');
		this.should_be_server_version[id] = this.holding_pen[id].worksheet.toString();
		this.should_be_server_archive[id] = this.holding_pen[id].worksheet.archive_string;
		if((this.holding_pen[id].worksheet.ends[L] === 0) || (this.holding_pen[id].worksheet.ends[R] === 0)) {
			// This should never happen.  It indicates that the tree was corrupted.  Stop now to avoid destroying data.
			ajaxQueue.jQ.html('Fatal error on save.  Saving disabled.');
  		window.showPopupOnTop();
  		$('.popup_dialog .full').html("<div class='title'>Save Failed</div><div>There was a problem while saving your worksheet.  To avoid data-loss, saving has been disabled.  Please reload your browser window to correct this issue.</div>");
      $('.popup_dialog .bottom_links').html('<button class="grey">Close</button>');
      $('.popup_dialog .bottom_links button').on('click', function() {
	      if(SwiftCalcs.active_worksheet && (SwiftCalcs.active_worksheet.hash_string == id))
	      	SwiftCalcs.active_worksheet.FailedSaveMessage();
	      window.hidePopupOnTop();
		    return false;
	    });
		  window.resizePopup(true);
			//ajaxQueue.jQ_fatal.show();
			ajaxQueue.running[id] = false;
			ajaxQueue.suppress = true;
			ajaxQueue.saving = false;
		}
		if((this.holding_pen[id].worksheet.ends[L] == this.holding_pen[id].worksheet.ends[R]) && (this.holding_pen[id].worksheet.ends[L].empty()) && !this.holding_pen[id].worksheet.new_name) {
			// Empty worksheet.  We don't send these up to the server.
			this.holding_pen[id] = false;
  		ajaxQueue.complete(id);
	  	return this;
		}
		var post_data = {
			worksheet_hash: id,
			name: this.holding_pen[id].worksheet.name,
			uploads: this.holding_pen[id].worksheet.uploads,
			known_server_version: this.known_server_version[id]
		}
		if(full) {
			// For force saves, we push up the whole document...we do this in case something is corrupted, which shouldnt happen...so eventually we may just remove this
			post_data.full_resave = this.should_be_server_version[id];
			post_data.full_archive_string = this.should_be_server_archive[id];
		} else {
			// Create diff between what we have now and what we are trying to commit up
			if(this.should_be_server_version[id].trim() === '') {
				// Something is up....cancel the save
				this.holding_pen[id] = false;
				ajaxQueue.running[id] = false;
				ajaxQueue.suppress = true;
				ajaxQueue.saving = false;
			  if(SwiftCalcs.active_worksheet.hash_string == id) {
					ajaxQueue.jQ.html('Fatal error on save.  Saving disabled.');
					if(ajaxQueue.ignore_errors[id] === true) return;
		  		window.showPopupOnTop();
		  		$('.popup_dialog .full').html("<div class='title'>Save Failed</div><div>There was a problem while saving your worksheet.  To avoid data-loss, saving has been disabled.  Please reload your browser window to correct this issue.</div>");
		      $('.popup_dialog .bottom_links').html('<button class="grey">Close</button>');
		      $('.popup_dialog .bottom_links button').on('click', function() {
			      if(SwiftCalcs.active_worksheet && (SwiftCalcs.active_worksheet.hash_string == id))
			      	SwiftCalcs.active_worksheet.FailedSaveMessage();
		      	window.hidePopupOnTop();
		      	return false;
		      });
		      window.resizePopup(true);
		      SwiftCalcs.active_worksheet.FailedSaveMessage();
				} else {
					ajaxQueue.jQ.html('');
					return;
				}
			}
			var diff = diff_patch.diff_main(this.server_version[id], this.should_be_server_version[id], true);
		  var patch_list = diff_patch.patch_make(this.server_version[id], this.should_be_server_version[id], diff);
		  patch_list = diff_patch.patch_toText(patch_list);
		  post_data.patch = patch_list;
			var diff = diff_patch.diff_main(this.server_archive[id], this.should_be_server_archive[id], true);
		  var patch_list = diff_patch.patch_make(this.server_archive[id], this.should_be_server_archive[id], diff);
		  patch_list = diff_patch.patch_toText(patch_list);
		  post_data.archive_patch = patch_list;
		  if((post_data.archive_patch == "") && (post_data.patch == "") && !this.holding_pen[id].worksheet.new_name) {
				this.holding_pen[id] = false;
    		ajaxQueue.complete(id);
		  	return this;
		  }
		}
		this.holding_pen[id].worksheet.new_name = false;
		this.holding_pen[id] = false;
		$.ajax({
      type: "POST",
      url: "/worksheet_elements",
      dataType: 'json',
      cache: false,
      data: post_data, 
      success: function(response) {
      	if(response.success) {
		    	if((typeof response.application_version !== 'undefined') && (response.application_version != (window.Mathquill_version + "|" + window.SwiftCalcs_version + "|" + window.giac_version)) && ($("#new_version").length == 0))
		    		$("<div id='new_version'><span>A New Version of Swift Calcs is Available</span><a href='#' onclick='window.location.reload();'>Reload window</a></div>").appendTo("body");
      		ajaxQueue.known_server_version[id]++;
      		ajaxQueue.server_version[id] = ajaxQueue.should_be_server_version[id]; // Update what we know to be on the server
      		ajaxQueue.server_archive[id] = ajaxQueue.should_be_server_archive[id]; // Update what we know to be on the server
      		ajaxQueue.complete(id);
      	}
      	else {
					ajaxQueue.jQ.html('Fatal error on save.  Saving disabled.');
					//ajaxQueue.jQ_fatal.show();
					ajaxQueue.running[id] = false;
					ajaxQueue.suppress = true;
					ajaxQueue.saving = false;
					if(ajaxQueue.ignore_errors[id] === true) return;
					if(response.alert) {
			  		window.showPopupOnTop();
			  		$('.popup_dialog .full').html("<div class='title'>" + response.title + "</div><div>" + response.message + "</div>");
			      $('.popup_dialog .bottom_links').html('<button class="grey">Close</button>');
			      $('.popup_dialog .bottom_links button').on('click', function() {
			      	if(SwiftCalcs.active_worksheet && (SwiftCalcs.active_worksheet.hash_string == id))
				      	SwiftCalcs.active_worksheet.FailedSaveMessage();
			      	window.hidePopupOnTop();
			      	return false;
			      });
			      window.resizePopup(true);
					}
					else
      			showNotice('Error while saving: ' + response.message, 'red');
      	}
      },
      error: function(err) {
				ajaxQueue.jQ.html('Fatal error on save.  Saving disabled.');
				//ajaxQueue.jQ_fatal.show();
				ajaxQueue.running[id] = false;
				ajaxQueue.suppress = true;
				ajaxQueue.saving = false;
				if(ajaxQueue.ignore_errors[id] === true) return;
      	showNotice('Error while saving: ' + err.responseText, 'red');
	  		window.showPopupOnTop();
	  		$('.popup_dialog .full').html("<div class='title'>Save Failed</div><div>There was a problem while saving your worksheet.  To avoid data-loss, saving has been disabled.  Please reload your browser window to correct this issue.</div>");
	      $('.popup_dialog .bottom_links').html('<button class="grey">Close</button>');
	      $('.popup_dialog .bottom_links button').on('click', function() {
		      if(SwiftCalcs.active_worksheet && (SwiftCalcs.active_worksheet.hash_string == id))
		      	SwiftCalcs.active_worksheet.FailedSaveMessage();
		      window.hidePopupOnTop();
			    return false;
		    });
		    window.resizePopup(true);
      	console.log(err);
      	//Depending on error, do we try again?
      	// TODO: Much better error handling!
      }
    });
		return this;
	}

	// Complete Ajax
	_.complete = function(i) {
		this.running[i] = false;
		if(this.holding_pen[i]) 
			this.commit(i);
		else {
			var hide = true;
			$.each(this.running, function(key, val) {
				if(val) hide = false;
			});
			if(hide) {
				this.jQ.html(this.save_message);
				this.saving = false;
			}
		}
		return this;
	}


	/*
	Public commands.  All require an item is attached to a worksheet.
	*/
	_.killSaves = function(hash_string) {
		if(this.holding_pen[hash_string] && this.holding_pen[hash_string].timer) 
			window.clearTimeout(this.holding_pen[hash_string].timer);
		this.ignore_errors[hash_string] = true;
	}
	_.saveNeeded = function(worksheet, force) {
		if(force) this.suppress = false;
		if(this.suppress) return;
		if(!this.saving)
			this.jQ.html('');
		this.saving = true;
		if(this.holding_pen[worksheet.hash_string] && this.holding_pen[worksheet.hash_string].timer) 
			window.clearTimeout(this.holding_pen[worksheet.hash_string].timer);
		if(this.running[worksheet.hash_string]) {
			this.holding_pen[worksheet.hash_string] = {
				timer: false,
				worksheet: worksheet
			};
		} else if(force) {
			this.holding_pen[worksheet.hash_string] = {
				timer: false,
				worksheet: worksheet
			};
			ajaxQueue.commit(worksheet.hash_string, true);
		} else {
			this.holding_pen[worksheet.hash_string] = {
				timer: window.setTimeout(function() { ajaxQueue.commit(worksheet.hash_string); }, 2000),
				worksheet: worksheet
			};
		}
	}
});

/*
create queue instance
*/
var ajaxQueue = new ajaxQueueClass();
SwiftCalcs.ajaxQueue = ajaxQueue;

$(function() {
  window.addEventListener("beforeunload", function (e) {
    var confirmationMessage = 'This page contains unsaved changes.  If you leave the page now, those changes will be lost.';

    if (!ajaxQueue.saving) {
        return undefined;
    }

    (e || window.event).returnValue = confirmationMessage; //Gecko + IE
    return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
  });
});
