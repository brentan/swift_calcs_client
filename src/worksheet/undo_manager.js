/*
 A basic undo/redo manager.  Whenever an item is about to be changed, it should call
 setUndoPoint.  setUndoPoint expects an element that should respond to the following 
 methods:
 		currentState(): returns an object desribing the current state of the object
 		restoreState(object): restores the element to the state described by the passed object.
 				Passed object is of the same form as returned by element's currentState method
 Each undo action is part of an undo stream.  If one action has multiple effects (2 items deleted, for example), 
 then a call to undo should re-insert both elements.  The methods 'startUndoStream' and 'endUndoStream' should be called
 before/after the actions occur to link them together.  If startUndoStream has not been called when an undo point is 
 scheduled, it is assumed that the action is singular.  Scheduled undo points are always singular.
 */
Worksheet.open(function(_) {
	var maxActions = 6; // Set the number of undo actions to track
	var undoArray = [];
	var redoArray = [];
	var reverseAction = [];
	var fullDestroy = function(ar) {
		for(var i = 0; i < (ar.length-1); i++) { // Dont include last item, as that is the focus command
			if(ar[i].el instanceof Element) ar[i].el.destroy();
		}
	}

	_.trackingStream = false;
  _.undoTimer = false;
  _.undoHash = false;
  _.undoElement = false;
  _.activeUndo = false;
  // Schedule function works to avoid setting an undo for every letter of keypress
  _.scheduleUndoPoint = function(el) {
  	if(ajaxQueue.suppress) return; // No need to register events while loading the sheet
  	if(this.trackingStream) return this.setUndoPoint(el); // During a stream, set the undo point immediately
  	if(this.activeUndo) return; // If this was called by something being altered by an undo action, we ignore it...we already know
    if(this.undoTimer && (this.undoElement == el)) // Kill previous schedule and start a new one
      window.clearTimeout(this.undoTimer);
    else {
			if(this.undoTimer) // Previous schedule is from another element.  Execute that one now
				this.setUndoPoint(this.undoElement, this.undoHash, true);
      this.undoHash = [{el: el, state: el.currentState() }, this.getFocusForUndo() ];
  	}
  	this.undoElement = el;
    this.undoTimer = window.setTimeout(function(_this, el) { return function() { _this.setUndoPoint(el, _this.undoHash, true); }; }(this, el), 1000);
  }
	_.setUndoPoint = function(el, hash, from_scheduled) {
  	if(ajaxQueue.suppress) return; // No need to register events while loading the sheet
  	if(this.activeUndo) {
  		// This was called by something being altered by an undo/redo action.  If this is an element, we use this to populate the undo/redoArray
  		if(el instanceof Element)
  			reverseAction.push({el: el, state: hash });
  		return; 
  	}
    if(this.undoTimer && (this.undoElement == el)) {// Kill previous schedule 
      window.clearTimeout(this.undoTimer);
      this.undoTimer = false;
      this.undoHash = 0;
    } else if(this.undoTimer) // Previous schedule is from another element.  Execute that one now
			this.setUndoPoint(this.undoElement, this.undoHash, true);
		if(typeof hash === 'undefined') hash = el.currentState();
		if(this.trackingStream)
			undoArray[undoArray.length - 1].push({el: el, state: hash });
		else if(from_scheduled)
			undoArray.push(hash);
		else
			undoArray.push([{el: el, state: hash }, this.getFocusForUndo() ]);
		if(undoArray.length > maxActions) {
			fullDestroy(undoArray[0]);
			undoArray.shift();
		}
		redoArray = []; // Clear redo manager after a new undo point is set
	}
	_.startUndoStream = function() {
		if(this.trackingStream) return; // This shouldn't happen....
		if(this.undoTimer) // Previous scheduled undo.  Add to the array and then start the stream.
			this.setUndoPoint(this.undoElement, this.undoHash, true);
		this.trackingStream = true;
		undoArray.push([ this.getFocusForUndo() ]);
		if(undoArray.length > maxActions) {
			fullDestroy(undoArray[0]);
			undoArray.shift();
		}
	}
	_.endUndoStream = function() {
		if(!this.trackingStream) return;
		this.trackingStream = false;
		undoArray[undoArray.length - 1] = undoArray[undoArray.length - 1].reverse(); // Reverse so that when we undo we move through in the correct order from start to end
	}
	_.getFocusForUndo = function() {
		var el = this.activeElement || this.lastActive;
		if(el)
			var item = el.focusedItem || el.lastFocusedItem;
		else
			var item = false;
		return {
			element: el,
			item: item,
			selected: this.selection
		}
	}
	_.clearUndoStack = function() {
		while(undoArray.length)
			fullDestroy(undoArray.pop());
		while(redoArray.length)
			fullDestroy(redoArray.pop());
	}

	// Undo/Redo functions
	_.restoreUndoPoint = function() {
		if(this.undoTimer) // Something is scheduled...add it in now
			this.setUndoPoint(this.undoElement, this.undoHash, true);
		this.undoRedo(true);
	}
	_.restoreRedoPoint = function() {
		this.undoRedo(false);
	}
	_.undoRedo = function(undo) {
		if(undo && (undoArray.length == 0)) return;
		if(!undo && (redoArray.length == 0)) return;
		this.activeUndo = true;
		var action = undo ? undoArray.pop() : redoArray.pop();
		reverseAction = [this.getFocusForUndo()];  // Reverse action array is used to populate redo when this action completes
		for(var i = 0; i < (action.length - 1); i++) {
			if(!(action[i].el instanceof Element)) //FocusableItem...just grab current state
				reverseAction.push({ el: action[i].el, state: action[i].el.currentState() })
			// No else because the actual act of performing the undo/redo will create the redo/undo action for Elements
			// Restore the state:
			action[i].el.restoreState(action[i].state);
		}
		// Add the reverse action to the undo/redo array
		if(undo) {
			redoArray.push(reverseAction.reverse());
			if(redoArray.length > maxActions) {
				fullDestroy(redoArray[0]);
				redoArray.shift();
			}
		} else {
			undoArray.push(reverseAction.reverse());
			if(undoArray.length > maxActions) {
				fullDestroy(undoArray[0]);
				undoArray.shift();
			}
		}
		reverseAction = [];
		this.save();
		// Set the correct focus
		window.setTimeout(function(to_restore, worksheet) { return function() { 
			worksheet.clearSelection(); // Wipe out whatever is selected, if anything
		  if(worksheet.activeElement) worksheet.activeElement.blur(); // Blur if something else is focused
			if(to_restore.selected.length) {
				worksheet.selection = to_restore.selected;
				var to_highlight = $();
		    for(var i = 0; i < to_restore.selected.length; i++) 
		      to_highlight = to_highlight.add(to_restore.selected[i].jQ);
		    worksheet.createSelection(to_highlight); 
		    worksheet.selectionChanged(true);
			} else {
				if(to_restore.item) to_restore.item.focus();
				if(to_restore.element) to_restore.element.focus(); 
			}
		}; }(action[action.length - 1], this));
		this.activeUndo = false;
		delete action;
	}
});

/* TODO:
- Re-calculate for elements after the undo event completes
- TEST THIS
*/

