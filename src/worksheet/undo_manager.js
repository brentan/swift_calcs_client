/*
 A basic undo/redo manager.  Whenever an item is about to be changed, it should call
 setUndoPoint.  setUndoPoint expects an element that should respond to the following 
 methods:
 		currentState(): returns an object desribing the current state of the object
 		restoreState(object): restores the element to the state described by the passed object.
 				Passed object is of the same form as returned by element's currentState method
 */
Worksheet.open(function(_) {
	var maxActions = 10; // Set the number of undo actions to track
	var undoArray = [];
	var redoArray = [];


  _.undoTimer = false;
  _.undoHash = false;
  _.undoElement = false;
  // Schedule function works to avoid setting an undo for every letter of keypress
  _.scheduleUndoPoint = function(el) {
  	if(ajaxQueue.suppress) return; // No need to register events while loading the sheet
    if(this.undoTimer && (this.undoElement == el)) // Kill previous schedule and start a new one
      window.clearTimeout(this.undoTimer);
    else {
			if(this.undoTimer) // Previous schedule is from another element.  Execute that one now
				this.setUndoPoint(this.undoElement, this.undoHash);
      this.undoHash = el.currentState();
  	}
  	this.undoElement = el;
    this.undoTimer = window.setTimeout(function(_this, el) { return function() { _this.setUndoPoint(el, _this.undoHash); }; }(this, el), 1000);
  }
	_.setUndoPoint = function(el, hash) {
  	if(ajaxQueue.suppress) return; // No need to register events while loading the sheet
    if(this.undoTimer && (this.undoElement == el)) {// Kill previous schedule 
      window.clearTimeout(this.undoTimer);
      this.undoTimer = false;
    } else if(this.undoTimer) // Previous schedule is from another element.  Execute that one now
			this.setUndoPoint(this.undoElement, this.undoHash);
		if(typeof hash === 'undefined') hash = el.currentState();
		console.log(hash);
		undoArray.push({el: el, state: hash });
		if(undoArray.length > maxActions)
			undoArray.shift();
		redoArray = []; // Clear redo manager after a new undo point is set
	}
	_.restoreUndoPoint = function() {
		if(this.undoTimer) // Something is scheduled...add it in now
			this.setUndoPoint(this.undoElement, this.undoHash);
		if(undoArray.length == 0) return;
		var action = undoArray[undoArray.length - 1];
		undoArray.pop();
		// Add current state to redo array
		redoArray.push({ el: action.el, state: action.el.currentState() })
		if(redoArray.length > maxActions)
			redoArray.shift();
		action.el.restoreState(action.state);
		this.save();
		window.setTimeout(function() { action.el.focus(); if(action.el.element) { action.el.element.focus(); }});
	}
	_.restoreRedoPoint = function() {
		if(redoArray.length == 0) return;
		var action = redoArray[redoArray.length - 1];
		redoArray.pop();
		// Add current state to undo array
		undoArray.push({ el: action.el, state: action.el.currentState() })
		if(undoArray.length > maxActions)
			undoArray.shift();
		action.el.restoreState(action.state);
		this.save();
		window.setTimeout(function() { action.el.focus(); if(action.el.element) { action.el.element.focus(); }});
	}
});
