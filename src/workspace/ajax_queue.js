/*
The AJAX queue class provides a set of functions to organize asynchronous server communications.
Commands can be queued through this class and then commands run in batches to reduce client-server 
calls. 

The main calls are:
saveNeeded(workspace): called to indicate we should save.  After a save needed, a 2 second timer is started, after which the save occurs
if saveNeeded is again called in this timespan, the timer resets.

TODO: Error handling.  What if the server doesnt respond?  Etc.

TODO: Update all of this to rely on real-time (SSE? websockets?) and allow real-time, multi-user editing of workspaces
TODO: Better save that doesnt send up the entire workspace toString on each save
*/


var ajaxQueueClass = P(function(_) {

	_.suppress = false;
	_.saving = false;
	_.init = function() {
		this.holding_pen = {};
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
		var post_data = {
			workspace_id: id,
			name: this.holding_pen[id].workspace.name,
			hashtags: this.holding_pen[id].workspace.hashtags,
			data: this.holding_pen[id].workspace.toString()
		}
		this.holding_pen[id] = false;
		$.ajax({
      type: "POST",
      url: "/workspace_elements",
      dataType: 'json',
      cache: false,
      data: post_data, 
      success: function(response) {
      	if(response.success)
      		ajaxQueue.complete(id);
      	else {
					ajaxQueue.jQ.html('Fatal error on save.  Saving disabled.');
					ajaxQueue.jQ_fatal.show();
					ajaxQueue.suppress = true;
					ajaxQueue.saving = false;
      		showNotice('Error while saving: ' + response.message, 'red');
      	}
      },
      error: function(err) {
				ajaxQueue.jQ.html('Fatal error on save.  Saving disabled.');
				ajaxQueue.jQ_fatal.show();
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
				this.jQ.html('All changes are saved');
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
