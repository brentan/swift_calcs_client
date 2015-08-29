/********************************************************
 * Helper functions that are used by shift-keyboard
 * commands that help select elements together
 * 
 * Mouse events also add/subtract from selection
 * Selected items are held in the 'selection' property
 * in the worksheet.  It is assumed that all items are
 * of the same generation in the tree (depth ==) and
 * that they are ordered from top to bottom.  Commands
 * that add or manipulate the selection array should ensure
 * compliance with this assumption
 *******************************************************/

Worksheet.open(function(_) {
	var last_dir = 0;
	_.selectDir = function(el, dir) {
		// Select up/left or down/right, depending on dir.  if nothing has been selected yet, el becomes first selection
	  this.clearSelection(true);
		if(this.selection.length == 0) {
			this.selection = [el];
			if(this.activeElement) this.activeElement.mouseOut({});
			last_dir = -dir;
		} else {
			var start_index = dir === R ? 0 : (this.selection.length - 1);
			var end_index = dir === L ? 0 : (this.selection.length - 1);
			for(var start_el = el; start_el.depth > this.selection[0].depth; start_el = start_el.parent) {}
			if((this.selection.length == 1) && (this.selection[0] === el) && (last_dir == dir)) {
				// Scenario where we were de-selecting last time, and are again de-selecting, so we should re-enter the element
				this.selection = [];
				this.unblurToolbar();
				el.focus();
			} else if(this.selection[start_index] === start_el) {
				// We are continuing to select more
				var next_item = this.selection[end_index][dir];
				if(next_item) 
					if(dir == R)
						this.selection.push(next_item);
					else
						this.selection.unshift(next_item);
				else if(this.selection[end_index].depth > 0)
					this.selection = [this.selection[end_index].parent];
			} else {
				// We had selected some, but are now selecting less
				if((this.selection.length == 1) && (this.selection[0] == el)) {
					// We are back to where we started
					this.selection = [];
					el.focus();
				} else if(this.selection.length == 1) {
					// We are back to a single node, but the original element is a child of it.  So we need to jump into it.
					for(var start_el = el; start_el.depth > (this.selection[0].depth + 1); start_el = start_el.parent) {}
					for(start_el; start_el !== 0; start_el = start_el[-dir]) this.selection.push(start_el);
					if(dir == R) this.selection.reverse();
				} else {
					// Remove the last item from the selection
					this.selection.splice(start_index, 1);
				}
			}
			last_dir = dir;
		}
		var to_select = $();
		for(var i = 0; i < this.selection.length; i++)
			to_select = to_select.add(this.selection[i].jQ);
		this.createSelection(to_select);
		return this;
	}
	_.selectToEndDir = function(el, dir) {
		var start_index = dir === R ? 0 : (this.selection.length - 1);
		var end_index = dir === L ? 0 : (this.selection.length - 1);
		for(var start_el = el; start_el.depth > this.selection[0].depth; start_el = start_el.parent) {}
		if(this.selection[start_index] == start_el) {
			// Selecting to end in same direction
			var jump_up = true;
			while(this.selection[end_index][dir]) {
				jump_up = false;
				this.selectDir(el, dir);
				end_index = dir === L ? 0 : (this.selection.length - 1);
				if(this.selection.length == 0) break;
			}
			if(jump_up)
				this.selectDir(el, dir);
		} else {
			// Unselecting backwards
			var jump_in = true;
			while(this.selection.length > 1) {
				jump_in = false;
				this.selectDir(el, dir);
				start_index = dir === R ? 0 : (this.selection.length - 1);
			}
			if(jump_in)
				this.selectDir(el, dir);
		}
		return this;
	}
	_.clearSelection = function(css_only) {
    this.insertJQ.find('.' + css_prefix + 'selected').removeClass(css_prefix + 'selected').attr('draggable', false);
    if(css_only) return this;
    this.selection = [];
    this.selectionChanged(true);
    return this;
	}
	_.createSelection = function(els) {
		els.addClass(css_prefix + "selected").attr('draggable', true);
	}
	_.selectAll = function() {
		this.clearSelection();
		var to_highlight = $();
    for(var el = this.ends[L]; el !== 0; el = el[R]) {
      this.selection.push(el);
      to_highlight = to_highlight.add(el.jQ);
    }
    this.createSelection(to_highlight); 
    this.selectionChanged(true);
		this.blurToolbar();
    return this;
  }
  _.replaceSelection = function(replacement, focus) {
  	if(this.selection.length == 0) throw("Nothing is selected to be replaced")
  	var stream = !this.trackingStream;
  	if(stream) this.startUndoStream();
  	replacement.insertBefore(this.selection[0]).show();
  	jQuery.each(this.selection, function(i,v) { v.mark_for_deletion = true; });
  	jQuery.each(this.selection, function(i,v) { v.remove(0); });
  	if(focus) replacement.focus(R);
  	this.clearSelection();
  	if(stream) this.endUndoStream();
  	return this;
  }
  _.deleteSelection = function(focus, dir) {
  	if(this.selection.length == 0) return this;
  	var stream = !this.trackingStream;
  	if(stream) this.startUndoStream();
  	if(focus) {
  		// Determine if we need to add an implicit element
  		if(!(this.selection[0][L] instanceof EditableBlock) && !(this.selection[this.selection.length - 1][R] instanceof EditableBlock)) {
  			var to_insert = (this.selection[0] && this.selection[0].parent.implicitType) ? this.selection[0].parent.implicitType() : math().setImplicit();
  			var item = this.replaceSelection(to_insert, true);
  			if(stream) this.endUndoStream();
  			return item;
  		}
  		if(dir === L) {
	  		if(this.selection[0][L]) this.selection[0][L].focus(R);
	  		else this.selection[this.selection.length - 1][R].focus(L);
	  	} else {
	  		if(this.selection[this.selection.length - 1][R]) this.selection[this.selection.length - 1][R].focus(L);
	  		else this.selection[0][L].focus(R);
	  	}
  	}
  	jQuery.each(this.selection, function(i,v) { v.mark_for_deletion = true; });
  	jQuery.each(this.selection, function(i,v) { v.remove(0); });
  	this.clearSelection();
  	if(stream) this.endUndoStream();
  	return this;
  }
  _.selectionChanged = function(force) {
  	force = (typeof force === 'undefined') ? false : force;
  	if(!force && (this.selection.length == 0)) return; // We don't want to overwrite anything that sub-focused items place in the textbox
  	// This can get called a bunch of times during click/select events, so put it in a timeout to cut down on the number of executions
    if (this.textareaSelectionTimeout === undefined) {
    	var _this = this;
      this.textareaSelectionTimeout = setTimeout(function() {
        _this.setTextareaSelection();
      });
    }
  };
  _.setTextareaSelection = function() {
    this.textareaSelectionTimeout = undefined;
    var output = '';
    for(var i=0; i < this.selection.length; i++)
    	output += this.selection[i].toString() + '\n';
    this.clipboard = output;
    this.selectFn(output);
  };
});