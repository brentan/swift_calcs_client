/********************************************************
 * Event listerns for the mouse, to deal with clicking, 
 * click and dragging, etc.  Will pass to listeners within
 * each block when needed.  Blocks have the following hooks:
 * 

 *******************************************************/

Workspace.open(function(_) {
  _.bindMouse = function() {
  	if(this.bound) return this;
    //context-menu event handling
    var _this = this;
    var contextMenu = function(e) {
    	_this.focus();
      var target = Element.byId[$(e.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id')];
      //BRENTAN: TODO: Check to see if something IS selected and if we right clicked on it...then handle appropriately
      _this.clearSelection();
      if(!target) return true;
      target.focus();
      if(!target.contextMenu(e)) {
	      e.preventDefault(); // doesn't work in IE\u22648, but it's a one-line fix:
	      return false;
	    } else
	    	return true;
    };
    this.jQ.on('contextmenu.swiftcalcs', contextMenu);
    //click and click-drag event handling
    var mouseDown = function(e) {
    	if (e.which !== 1) return false;
    	_this.focus();
    	// First handle mousedown.  This just sets the listeners for dragging and mouseup.  
      var target = Element.byId[$(e.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1];
      _this.clearSelection();
      if(!target) target = _this.ends[R];
      if(target === 0) throw("Somehow we have an empty workspace, which should never be allowed to occur")
      target.focus();
      target.mouseDown(e);
      var new_target;
      var selected_elements = $();
      // Dragging events:
      function mousemove(e) { new_target = Element.byId[$(e.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1]; if(!new_target) new_target = _this.ends[R]; }
      // docmousemove and mouseup share a lot, so combine them here:
      function mousemoveup(e, command) {
      	selected_elements.removeClass(css_prefix + 'selected');
      	selected_elements = $();
    		var selection = [];
      	// Multiple cases for click-drag handling:
      	if(!new_target || !target) { //end or start target is not an element...so we do nothing
      		_this.selectionChanged(true);
      	} else if(target.id === new_target.id) { //If start/end target are the same, we pass to that target
        	if(target[command](e)) {
        		selected_elements = selected_elements.add(target.jQ);
        		selection.push(target);
        	}
      	} else { //Start and target are different elements
      		target.mouseOut(e);
      		//Journey to common generation for start/end targets
      		var start_target = target;
      		var end_target = new_target;
      		while(start_target.depth > end_target.depth) { start_target = start_target.parent; }
      		while(start_target.depth < end_target.depth) { end_target = end_target.parent; }
      		//We dont know if the start or end target is 'first' in the tree, so we guess start is first, and if not, do the opposite
      		var success = false;
      		for(var next_element = start_target; next_element !== 0; next_element = next_element[R]) {
      			selection.push(next_element);
      			selected_elements = selected_elements.add(next_element.jQ);
      			if(next_element === end_target) { success = true; break; }
      		}
      		if(!success) {
      			selected_elements = $();
      			selection = [];
	      		for(var next_element = end_target; next_element !== 0; next_element = next_element[R]) {
      				selection.push(next_element);
	      			selected_elements = selected_elements.add(next_element.jQ);
	      			if(next_element === start_target) { success = true; break; }
	      		}
	      		if(!success) throw("Tree traversal failed for selection.  This shouldn't be possible");
	      	}
      	}
      	selected_elements.addClass(css_prefix + 'selected');
      	_this.selection = selection;
      	_this.selectionChanged();
      }
      function docmousemove(e) {
      	mousemoveup(e, 'mouseMove');
        new_target = undefined;
      }
      function mouseup(e) {
      	new_target = Element.byId[$(e.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1];
      	if(!new_target) new_target = _this.ends[R]; 
      	mousemoveup(e, 'mouseUp');
        // delete the mouse handlers now that we're not dragging anymore
        _this.jQ.unbind('mousemove', mousemove);
        $(e.target.ownerDocument).unbind('mousemove', docmousemove).unbind('mouseup', mouseup);
      }
      e.preventDefault(); // doesn't work in IE≤8, but it's a one-line fix:
      e.target.unselectable = true; // http://jsbin.com/yagekiji/1

      _this.jQ.mousemove(mousemove);
      $(e.target.ownerDocument).mousemove(docmousemove).mouseup(mouseup);
      // listen on document not just body to not only hear about mousemove and
      // mouseup on page outside field, but even outside page, except iframes
      return this;
    };
    this.jQ.on('mousedown.swiftcalcs', mouseDown);
    this.unbindMouse = function() {
    	this.jQ.off('contextmenu.swiftcalcs', contextMenu);
    	this.jQ.off('mousedown.swiftcalcs', mouseDown);
    	return this;
    };
  }
  _.unbindMouse = function() { return this; };	
});