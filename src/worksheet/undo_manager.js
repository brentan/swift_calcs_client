/*
 A basic undo/redo manager.  Whenever an item is about to be changed, it should call
 setUndoPoint.  setUndoPoint expects an element that should respond to the following 
 methods:
 		currentState(): returns an object desribing the current state of the object
 		restoreState(object): restores the element to the state described by the passed object.
 				Passed object is of the same form as returned by element's currentState method
 */
Worksheet.open(function(_) {
	var maxActions = 4; // Set the number of undo actions to track
	var undoArray = [];
	var redoArray = [];
	_.setUndoPoint = function(el, hash) {
		if(typeof hash === 'undefined') hash = el.currentState();
		undoArray.push({el: el, state: hash });
		if(undoArray.length > maxActions)
			undoArray.shift();
		redoArray = []; // Clear redo manager after a new undo point is set
	}
	_.restoreUndoPoint = function() {
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
