/*
The AJAX queue class provides a set of functions to organize asynchronous server communications.
Commands can be queued through this class and then commands run in batches to reduce client-server 
calls. 

The main calls are:
saveNeeded(workspace): called to indicate we should save.  After a save needed, a 2 second timer is started, after which the save occurs
if saveNeeded is again called in this timespan, the timer resets.

TODO: Error handling.  What if the server doesnt respond?  Etc.

TODO: Update all of this to rely on real-time (SSE? websockets?) and allow real-time, multi-user editing of workspaces
*/


var ajaxQueueClass = P(function(_) {

	_.suppress = false;
	_.saving = false;
	_.save_message = 'All changes are saved';
	_.init = function() {
		this.holding_pen = {};
		this.server_version = {};
		this.known_server_version = {};
		this.server_version_number = {};
		this.should_be_server_version = {};
		this.jQ = $('.save_div');
		this.jQ_fatal = $('.fatal_div');
		this.running = {};
	}

	/* 
	Queue management functions
	*/

	_.commit = function(id) {
		this.running[id] = true;
		this.jQ.html('Saving...');
		this.should_be_server_version[id] = this.holding_pen[id].workspace.toString();
		// Create diff between what we have now and what we are trying to commit up
		var diff = diff_patch.diff_main(this.server_version[id], this.should_be_server_version[id], true);
	  var patch_list = diff_patch.patch_make(this.server_version[id], this.should_be_server_version[id], diff);
	  patch_list = diff_patch.patch_toText(patch_list);

		var post_data = {
			workspace_id: id,
			name: this.holding_pen[id].workspace.name,
			bookmarks: this.holding_pen[id].workspace.bookmarks,
			patch: patch_list,
			known_server_version: this.known_server_version[id]
		}
		this.holding_pen[id] = false;
		$.ajax({
      type: "POST",
      url: "/workspace_elements",
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
	Public commands.  All require an item is attached to a workspace.
	*/
	_.saveNeeded = function(workspace, force) {
		if(force) this.suppress = false;
		if(this.suppress) return;
		if(!this.saving)
			this.jQ.html('');
		this.saving = true;
		if(this.holding_pen[workspace.server_id] && this.holding_pen[workspace.server_id].timer) 
			window.clearTimeout(this.holding_pen[workspace.server_id].timer);
		if(this.running[workspace.server_id]) {
			this.holding_pen[workspace.server_id] = {
				timer: false,
				workspace: workspace
			};
		} else if(force) {
			this.holding_pen[workspace.server_id] = {
				timer: false,
				workspace: workspace
			};
			ajaxQueue.commit(workspace.server_id);
		} else {
			this.holding_pen[workspace.server_id] = {
				timer: window.setTimeout(function() { ajaxQueue.commit(workspace.server_id); }, 2000),
				workspace: workspace
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
