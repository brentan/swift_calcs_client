/********************************************************
 * Event listerns for the mouse, to deal with clicking, 
 * click and dragging, etc.  Will pass to listeners within
 * each block when needed.  
 *******************************************************/

Workspace.open(function(_) {
	_.bindDragging = function(e, selected_target, click_handler, drag_done_handler) {
		var _this = this;
		function dragOver(e_drag) {
			var el = Element.byId[$(e_drag.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1];
			var top = el.jQ.offset().top;
			// Are we an element that allows children, but doesnt have any?
			if(el && el.hasChildren && (el.children().length == 0)) {
  			if(e_drag.originalEvent.pageY > (top + el.jQ.height()*0.75)) {
  				el.jQ.removeClass(css_prefix + 'dropTop').addClass(css_prefix + 'dropBot');
  				el.insertJQ.removeClass(css_prefix + 'dropTop');
  			} else if(e_drag.originalEvent.pageY < (top + el.jQ.height()*0.25)) {
  				el.insertJQ.removeClass(css_prefix + 'dropTop');
  				el.jQ.removeClass(css_prefix + 'dropBot').addClass(css_prefix + 'dropTop');
  			} else {
  				el.insertJQ.addClass(css_prefix + 'dropTop');
  				el.jQ.removeClass(css_prefix + 'dropBot').removeClass(css_prefix + 'dropTop');
  			}
			} else {
  			if(e_drag.originalEvent.pageY > (top + el.jQ.height()/2))
  				el.jQ.removeClass(css_prefix + 'dropTop').addClass(css_prefix + 'dropBot');
  			else
  				el.jQ.removeClass(css_prefix + 'dropBot').addClass(css_prefix + 'dropTop');
  		}
    	e_drag.preventDefault();
		}
		function dragDrop(e_drag) {
			dragLeave(e_drag);
			var el = Element.byId[$(e_drag.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1];
			var top = el.jQ.offset().top;
			var into = false;
			var dir = L;
			// Are we an element that allows children, but doesnt have any?
			if(el && el.hasChildren && (el.children().length == 0)) {
  			if(e_drag.originalEvent.pageY > (top + el.jQ.height()*0.75)) 
  				dir = R;
  			else if(e_drag.originalEvent.pageY < (top + el.jQ.height()*0.25)) 
  				dir = L;
  			else 
  				into = true;
			} else {
  			if(e_drag.originalEvent.pageY > (top + el.jQ.height()/2))
  				dir = R;
  			else
  				dir = L;
  		}
  		drag_done_handler(el, into, dir);
  		e_drag.preventDefault();
		}
		function dragLeave(e_drag) {
			var el = Element.byId[$(e_drag.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1];
			el.jQ.removeClass(css_prefix + 'dropTop').removeClass(css_prefix + 'dropBot');
			$(e_drag.target).off('dragover', dragOver).off('dragleave', dragLeave).off('drop', dragDrop);
			el.jQ.find('.' + css_prefix + 'dropTop').removeClass(css_prefix + 'dropTop');
    	e_drag.preventDefault();
		}
		function dragEnter(e_drag) {
			if($(e_drag.target).closest('.' + css_prefix + 'selected').length) return; // Don't do drag handlers on selected elements
			$(e_drag.target).on('dragover', dragOver).on('dragleave', dragLeave).on('drop', dragDrop);
			dragOver(e_drag);
		}
		function dragOverWorkspace(e_drag) {
			if(!$(e_drag.target).hasClass(css_prefix + 'element_container')) return;
  		_this.ends[R].jQ.removeClass(css_prefix + 'dropTop').addClass(css_prefix + 'dropBot');
    	e_drag.preventDefault();
		}
		function dragDropWorkspace(e_drag) {
			if(!$(e_drag.target).hasClass(css_prefix + 'element_container')) return;
			dragLeaveWorkspace(e_drag);
  		drag_done_handler(_this.ends[R], false, R);
  		e_drag.preventDefault();
		}
		function dragLeaveWorkspace(e_drag) {
			if(!$(e_drag.target).hasClass(css_prefix + 'element_container')) return;
			_this.ends[R].jQ.removeClass(css_prefix + 'dropTop').removeClass(css_prefix + 'dropBot');
			_this.insertJQ.off('dragover', dragOverWorkspace).off('dragleave', dragLeaveWorkspace).off('drop', dragDropWorkspace);
			_this.ends[R].jQ.find('.' + css_prefix + 'dropTop').removeClass(css_prefix + 'dropTop');
    	e_drag.preventDefault();
		}
		function dragEnterWorkspace(e_drag) {
			if(!$(e_drag.target).hasClass(css_prefix + 'element_container')) return;
			if(_this.ends[R].jQ.hasClass(css_prefix + 'selected')) return; // Don't do drag handlers on selected elements
			_this.insertJQ.on('dragover', dragOverWorkspace).on('dragleave', dragLeaveWorkspace).on('drop', dragDropWorkspace);
			dragOverWorkspace(e_drag);
		}
		function dragStart(e_drag) {
    	// We started a drag, so remove mouesup listener as we dont want it firing
      $(e.target.ownerDocument).unbind('mouseup', mouseup_drag);
      // Bind new handlers
      $(e_drag.target).on('dragend', dragEnd);
      var to_listen = _this.insertJQ.find('.' + css_prefix + 'element');
    	to_listen.on('dragenter', dragEnter);
    	to_listen.find('*').on('dragenter', dragEnter);
    	_this.insertJQ.on('dragenter', dragEnterWorkspace);
		}
		function dragEnd(e_drag) {
    	_this.dragging = false;
			_this.mousedown = false;
    	// Remove listeners
			$(e_drag.target).off('dragend', dragEnd);
    	_this.insertJQ.find('.' + css_prefix + 'element').off('dragenter', dragEnter);
    	_this.insertJQ.find('.' + css_prefix + 'element').find('*').off('dragenter', dragEnter);
    	_this.insertJQ.off('dragenter', dragEnterWorkspace);
    	selected_target.off('dragstart', dragStart);
    	e_drag.preventDefault();
		}
    function mouseup_drag(e_up) {
    	_this.dragging = false;
			_this.mousedown = false;
    	// Remove listeners
    	selected_target.off('dragstart', dragStart);
    	click_handler(e_up);
      $(e.target.ownerDocument).unbind('mouseup', mouseup_drag);
    	e.preventDefault();
    	e_up.preventDefault();
    }
    selected_target.on('dragstart', dragStart);
    $(e.target.ownerDocument).mouseup(mouseup_drag);
	};

  _.bindMouse = function() {
  	if(this.bound) return this;
    //context-menu event handling
    var _this = this;
    var contextMenu = function(e) {
      var target = Element.byId[$(e.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id')];
      //BRENTAN: TODO: Check to see if something IS selected and if we right clicked on it...then handle appropriately
      _this.clearSelection();
      if(!target) return true;
      target.focus();
      if(!(target instanceof text)) 
		    _this.focus();
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
    	_this.mousedown = true;
    	// First handle mousedown.  This just sets the listeners for dragging and mouseup.  
    	var selected_target = $(e.target).closest('.' + css_prefix + 'selected');
      var target = Element.byId[$(e.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1];
	    var new_target;
      if(!target) target = _this.ends[R];
      if(target === 0) throw("Somehow we have an empty workspace, which should never be allowed to occur");
      // docmousemove and mouseup share a lot, so combine them here:
      function mousemoveup(e, command) {
      	_this.clearSelection(true);
      	var selected_elements = $();
    		var selection = [];
      	// Multiple cases for click-drag handling:
      	if(!new_target || !target) { //end or start target is not an element...so we do nothing
      		_this.selectionChanged(true);
      	} else if(target.id === new_target.id) { // If start/end target are the same, we pass to that target
        	if(target[command](e)) {
        		selected_elements = selected_elements.add(target.jQ);
        		selection.push(target);
        	} else if(target instanceof text) return true; // Let text objects deal with their own mouse events
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
      	_this.createSelection(selected_elements);
      	_this.selection = selection;
      	_this.selectionChanged();
      }
    	if(selected_target.length && _this.selection.length && !(target instanceof text)) {
    		// Clicking/dragging on selection
    		function click_handler(e_up) {
		    	// Handle full click events as mousedown and then mouseup
		      _this.clearSelection();
		    	new_target = Element.byId[$(e_up.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1];
		    	if(!new_target) new_target = _this.ends[R]; 
		    	target = new_target;
		      new_target.focus();
		      new_target.mouseDown(e_up);
		    	mousemoveup(e_up, 'mouseUp');
		    }
    		function drag_done_handler(el, into, dir) {
		  		// Begin moving the selected elements to the new target
		  		_this.clearSelection(true);
		  		if(dir === R) _this.selection.reverse();
		  		var active_elements = $();
		  		for(var i = 0; i < _this.selection.length; i++) {
		  			_this.selection[i].move(el, into ? R : dir, into);
		  			active_elements = active_elements.add(_this.selection[i].jQ);
		  		}
		  		if(dir === R) _this.selection.reverse();
		  		_this.createSelection(active_elements);
		  		_this.focus();
    		}
	      // We can't preventDefault on mousedown, because that will kill the draggable calls.  But by allowing it, we blur the textarea.
	      // Set 'dragging' to true so that we know we are in a situation where we are blurred.
	      _this.dragging = true;
	      _this.bindDragging(e, selected_target, click_handler, drag_done_handler)
    	} else {
	  		// Clicking dragging on nothing
	      _this.clearSelection();
	      // Dragging events:
	      function mousemove(e) { new_target = Element.byId[$(e.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1]; if(!new_target) new_target = _this.ends[R]; }
	      function docmousemove(e) {
	      	mousemoveup(e, 'mouseMove');
	        new_target = undefined;
	        if(_this.selection.length > 0)
		      	e.preventDefault(); 
	      }
	      function mouseup(e) {
    			_this.mousedown = false;
	      	new_target = Element.byId[$(e.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1];
	      	if(!new_target) new_target = _this.ends[R]; 
	      	mousemoveup(e, 'mouseUp');
	        // delete the mouse handlers now that we're not dragging anymore
	        _this.jQ.unbind('mousemove', mousemove);
	        $(e.target.ownerDocument).off('mousemove', docmousemove).off('mouseup dragend', mouseup);
	      }
		    target.mouseDown(e);
	      if(!(target instanceof text)) {
	      	// text elements handle their own mouse events, so we allow bubbling for them, and dont throw mouse events
		      _this.focus();
		      target.focus();
		      e.preventDefault(); 
		    }
	      _this.jQ.mousemove(mousemove);
	      $(e.target.ownerDocument).on('mousemove', docmousemove).on('mouseup dragend', mouseup);
	      // listen on document not just body to not only hear about mousemove and
	      // mouseup on page outside field, but even outside page, except iframes
	    }
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