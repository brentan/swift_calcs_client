/*
The AJAX queue class provides a set of functions to organize asynchronous server communications.
Commands can be queued through this class and then commands run in batches to reduce client-server 
calls. 

The main calls are:
saveNeeded(worksheet): called to indicate we should save.  After a save needed, a 2 second timer is started, after which the save occurs
if saveNeeded is again called in this timespan, the timer resets.

TODO: Error handling.  What if the server doesnt respond?  Etc.

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
		this.jQ = $('.save_div');
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
		if((this.holding_pen[id].worksheet.ends[L] === 0) && (this.holding_pen[id].worksheet.ends[R] === 0)) {
			// This should never happen.  It indicates that the tree was corrupted.  Stop now to avoid destroying data.
			ajaxQueue.jQ.html('Fatal error on save.  Saving disabled.');
			ajaxQueue.jQ_fatal.show();
			ajaxQueue.running[id] = false;
			ajaxQueue.suppress = true;
			ajaxQueue.saving = false;
		}
		var post_data = {
			worksheet_id: id,
			name: this.holding_pen[id].worksheet.name,
			bookmarks: this.holding_pen[id].worksheet.bookmarks,
			uploads: this.holding_pen[id].worksheet.uploads,
			known_server_version: this.known_server_version[id]
		}
		if(full) {
			// For force saves, we push up the whole document...we do this in case something is corrupted, which shouldnt happen...so eventually we may just remove this
			post_data.full_resave = this.should_be_server_version[id];
		} else {
			// Create diff between what we have now and what we are trying to commit up
			var diff = diff_patch.diff_main(this.server_version[id], this.should_be_server_version[id], true);
		  var patch_list = diff_patch.patch_make(this.server_version[id], this.should_be_server_version[id], diff);
		  patch_list = diff_patch.patch_toText(patch_list);
		  post_data.patch = patch_list;
		}
		this.holding_pen[id] = false;
		$.ajax({
      type: "POST",
      url: "/worksheet_elements",
      dataType: 'json',
      cache: false,
      data: post_data, 
      success: function(response) {
      	if(response.success) {
      		ajaxQueue.known_server_version[id]++;
      		ajaxQueue.server_version[id] = ajaxQueue.should_be_server_version[id]; // Update what we know to be on the server
      		ajaxQueue.complete(id);
      	}
      	else {
					ajaxQueue.jQ.html('Fatal error on save.  Saving disabled.');
					ajaxQueue.jQ_fatal.show();
					ajaxQueue.running[id] = false;
					ajaxQueue.suppress = true;
					ajaxQueue.saving = false;
					if(response.alert)
						alert(response.message);
					else
      			showNotice('Error while saving: ' + response.message, 'red');
      	}
      },
      error: function(err) {
				ajaxQueue.jQ.html('Fatal error on save.  Saving disabled.');
				ajaxQueue.jQ_fatal.show();
				ajaxQueue.running[id] = false;
				ajaxQueue.suppress = true;
				ajaxQueue.saving = false;
      	showNotice('Error while saving: ' + err.responseText, 'red');
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
	_.saveNeeded = function(worksheet, force) {
		if(force) this.suppress = false;
		if(this.suppress) return;
		if(!this.saving)
			this.jQ.html('');
		this.saving = true;
		if(this.holding_pen[worksheet.server_id] && this.holding_pen[worksheet.server_id].timer) 
			window.clearTimeout(this.holding_pen[worksheet.server_id].timer);
		if(this.running[worksheet.server_id]) {
			this.holding_pen[worksheet.server_id] = {
				timer: false,
				worksheet: worksheet
			};
		} else if(force) {
			this.holding_pen[worksheet.server_id] = {
				timer: false,
				worksheet: worksheet
			};
			ajaxQueue.commit(worksheet.server_id, true);
		} else {
			this.holding_pen[worksheet.server_id] = {
				timer: window.setTimeout(function() { ajaxQueue.commit(worksheet.server_id); }, 2000),
				worksheet: worksheet
			};
		}
	}
});

/*
create queue instance
*/
var ajaxQueue = new ajaxQueueClass();

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
