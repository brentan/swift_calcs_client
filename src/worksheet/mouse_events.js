/********************************************************
 * Event listerns for the mouse, to deal with clicking, 
 * click and dragging, etc.  Will pass to listeners within
 * each block when needed.  
 *******************************************************/

Worksheet.open(function(_) {
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
		function dragOverWorksheet(e_drag) {
			if(!$(e_drag.target).hasClass(css_prefix + 'element_container')) return;
  		_this.ends[R].jQ.removeClass(css_prefix + 'dropTop').addClass(css_prefix + 'dropBot');
    	e_drag.preventDefault();
		}
		function dragDropWorksheet(e_drag) {
			if(!$(e_drag.target).hasClass(css_prefix + 'element_container')) return;
			dragLeaveWorksheet(e_drag);
  		drag_done_handler(_this.ends[R], false, R);
  		e_drag.preventDefault();
		}
		function dragLeaveWorksheet(e_drag) {
			if(!$(e_drag.target).hasClass(css_prefix + 'element_container')) return;
			_this.ends[R].jQ.removeClass(css_prefix + 'dropTop').removeClass(css_prefix + 'dropBot');
			_this.insertJQ.off('dragover', dragOverWorksheet).off('dragleave', dragLeaveWorksheet).off('drop', dragDropWorksheet);
			_this.ends[R].jQ.find('.' + css_prefix + 'dropTop').removeClass(css_prefix + 'dropTop');
    	e_drag.preventDefault();
		}
		function dragEnterWorksheet(e_drag) {
			if(!$(e_drag.target).hasClass(css_prefix + 'element_container')) return;
			if(_this.ends[R].jQ.hasClass(css_prefix + 'selected')) return; // Don't do drag handlers on selected elements
			_this.insertJQ.on('dragover', dragOverWorksheet).on('dragleave', dragLeaveWorksheet).on('drop', dragDropWorksheet);
			dragOverWorksheet(e_drag);
		}
		function dragStart(e_drag) {
      $(e_drag.target).addClass('dragging');
      e_drag.originalEvent.dataTransfer.setData("text/plain", "Draggable Element");
    	// We started a drag, so remove mouesup listener as we dont want it firing
      $(e.target.ownerDocument).unbind('mouseup', mouseup_drag);
      // Bind new handlers
      $(e_drag.target).on('dragend', dragEnd);
      var to_listen = _this.insertJQ.find('.' + css_prefix + 'element');
    	to_listen.on('dragenter', dragEnter);
    	//to_listen.find('table, div').on('dragenter', dragEnter); // WHY WAS THIS ADDED?  DOES NOT SEEM TO BE USEFUL
    	_this.insertJQ.on('dragenter', dragEnterWorksheet);
		}
		function dragEnd(e_drag) {
    	_this.dragging = false;
			_this.mousedown = false;
      $(e_drag.target).removeClass('dragging');
    	// Remove listeners
			$(e_drag.target).off('dragend', dragEnd);
    	_this.insertJQ.find('.' + css_prefix + 'element').off('dragenter', dragEnter);
    	_this.insertJQ.find('.' + css_prefix + 'element').find('*').off('dragenter', dragEnter);
    	_this.insertJQ.off('dragenter', dragEnterWorksheet);
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
      if(target) {
        target.focus();
        if(!(target instanceof text)) 
  		    _this.focus();
        if(!target.contextMenu(e)) {
  	      e.preventDefault(); 
  	      return false;
  	    } 
      }
      return true;
    };
    this.jQ.on('contextmenu.swiftcalcs', contextMenu);
    //click and click-drag event handling
    var mouseDown = function(e) {
    	if (e.which !== 1) return;
    	_this.mousedown = true;
      if($(e.target).closest('.mq-popup, .' + css_prefix + 'tooltip').length) {
        // Ignore mouse events for clicks on popup menu and tooltip, those are handled elsewhere
        e.preventDefault();
        return;
      }
      if($(e.target).closest('input.' + css_prefix + 'worksheet_name').length) {
        // Let the worksheet name input box handle its own click events
        _this.clearSelection();
        return;
      }
    	// First handle mousedown.  This just sets the listeners for dragging and mouseup.  
    	var selected_target = $(e.target).closest('.' + css_prefix + 'selected');
      var target = Element.byId[$(e.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1];   
      // If the click is on the left-hand side (the line number), we select the element
      var force_select = false;
      if((selected_target.length == 0) && $(e.target).closest('td.' + css_prefix + 'element_td').length && !(e.shiftKey) && !$(e.target).closest('div.' + css_prefix + 'collapse').length && !$(e.target).closest('div.' + css_prefix + 'expand').length) {
        if(target.focusedItem) target.focusedItem.mouseOut(e);
        _this.clearSelection();
        _this.createSelection(target.jQ);
        _this.selection = [target];
        _this.selectionChanged();
        selected_target = target.jQ;
        force_select = true;
      }
      var last_target = _this.activeElement || _this.lastActive;
	    var new_target;
      if(!target) {
        if($(e.target).closest('.' + css_prefix + 'element_container').length == 0) {
          // Not clicking on the document
          _this.clearSelection();
          _this.blur();
          return;
        } else {
          if($(e.target).closest('.' + css_prefix + 'element_top_spacer').length)
            target = _this.ends[L];
          else
            target = _this.ends[R];
        }
      }
      if(target === 0) throw("Somehow we have an empty worksheet, which should never be allowed to occur");
      // docmousemove and mouseup share a lot, so combine them here:
      function mousemoveup(e, command) {
        var selectFromTargets = function(start_target, end_target) {
          start_target.mouseOut(e);
          //Journey to common generation for start/end targets
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

      	_this.clearSelection(true);
      	var selected_elements = $();
    		var selection = [];
      	// Multiple cases for click-drag handling:
      	if(!new_target || !target) { //end or start target is not an element...so we do nothing
      		_this.selectionChanged(true);
        } else if(e.shiftKey && last_target) { // Holding shift should highlight from last active to current target
          selectFromTargets(last_target, new_target);
      	} else if(target.id === new_target.id) { // If start/end target are the same, we pass to that target
        	if(target[command](e)) {
        		selected_elements = selected_elements.add(target.jQ);
        		selection.push(target);
        	} else if(target instanceof text) return true; // Let text objects deal with their own mouse events
      	} else { //Start and target are different elements
          selectFromTargets(target, new_target);
      	}
      	_this.createSelection(selected_elements);
      	_this.selection = selection;
      	_this.selectionChanged();
      }
    	if(force_select || (selected_target.length && _this.selection.length && !(target instanceof text) && !(e.shiftKey))) {
    		// Clicking/dragging on selection
    		function click_handler(e_up) {
		    	// Handle full click events as mousedown and then mouseup
		      _this.clearSelection();
		    	new_target = Element.byId[$(e_up.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1];
		    	if(!new_target) {
            if($(e.target).closest('.' + css_prefix + 'element_top_spacer').length)
              new_target = _this.ends[L];
            else
              new_target = _this.ends[R];
          }
		    	target = new_target;
		      new_target.focus();
		      new_target.mouseDown(e_up);
          mousemoveup(e_up, 'mouseUp');
		    }
        function force_click_handler(e_up) {
          new_target = Element.byId[$(e_up.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1];
          if(!new_target) {
            if($(e.target).closest('.' + css_prefix + 'element_top_spacer').length)
              new_target = _this.ends[L];
            else
              new_target = _this.ends[R];
          }
          target = new_target;
          if(_this.activeElement) _this.activeElement.blur();
        }
    		function drag_done_handler(el, into, dir) {
		  		// Begin moving the selected elements to the new target
          _this.startUndoStream();
		  		_this.clearSelection(true);
          var eval_target = false;
          if(_this.selection.length > 0) {
            var full_eval = false;
            for(var i = 0; i < _this.selection.length; i++) {
              if(_this.selection[i].fullEvaluation) { full_eval = true; break; }
            }
            if(full_eval) {
              var top_move = _this.selection[0].firstGenAncestor();
              var target = el.firstGenAncestor();
              var moving_up = false;
              for(var temp_el = top_move[L]; temp_el instanceof Element; temp_el = temp_el[L]) {
                if(temp_el.id === target.id) { moving_up = true; break; }
              }
              if(!moving_up) {
                // Because we are moving downwards, we need to recompute from the original location
                var eval_target = _this.selection[_this.selection.length - 1].firstGenAncestor()[R];
              }
            }
          }

		  		if(dir === R) _this.selection.reverse();
		  		var active_elements = $();
		  		for(var i = 0; i < _this.selection.length; i++) {
		  			_this.selection[i].move(el, into ? R : dir, into);
		  			active_elements = active_elements.add(_this.selection[i].jQ);
		  		}
		  		if(dir === R) _this.selection.reverse();
          if(eval_target)
            eval_target.evaluate(true,true);
          for(var i = 0; i < _this.selection.length; i++) 
            _this.selection[i].evaluate(true); // Evaluate the moved blocks
		  		_this.createSelection(active_elements);
		  		_this.focus();
          _this.endUndoStream();
    		}
	      // We can't preventDefault on mousedown, because that will kill the draggable calls.  But by allowing it, we blur the textarea.
	      // Set 'dragging' to true so that we know we are in a situation where we are blurred.
	      _this.dragging = true;
        if(force_select)
          _this.bindDragging(e, selected_target, force_click_handler, drag_done_handler)
        else
          _this.bindDragging(e, selected_target, click_handler, drag_done_handler)
    	} else {
	  		// Clicking dragging on nothing
	      _this.clearSelection();
	      // Dragging events:
	      function mousemove(e) { 
          new_target = Element.byId[$(e.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1]; 
          if(!new_target) {
            if($(e.target).closest('.' + css_prefix + 'element_top_spacer').length)
              new_target = _this.ends[L];
            else
              new_target = _this.ends[R];
          }
        }
	      function docmousemove(e) {
	      	mousemoveup(e, 'mouseMove');
	        new_target = undefined;
	        if(_this.selection.length > 0)
		      	e.preventDefault(); 
	      }
	      function mouseup(e) {
    			_this.mousedown = false;
	      	new_target = Element.byId[$(e.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1];
          if(!new_target) {
            if($(e.target).closest('.' + css_prefix + 'element_top_spacer').length)
              new_target = _this.ends[L];
            else if((target !== _this.ends[R]) || (_this.ends[R] instanceof math))
              new_target = _this.ends[R];
            else {
              new_target = math().setImplicit().insertAfter(_this.ends[R]).show();
              new_target.start_target = -1; // Fake a 'mousedown' event on the element
              target = new_target;
            }
          }
	      	mousemoveup(e, 'mouseUp');
	        // delete the mouse handlers now that we're not dragging anymore
	        _this.jQ.unbind('mousemove', mousemove);
	        $(e.target.ownerDocument).off('mousemove', docmousemove).off('mouseup dragend', mouseup);
	      }
        if(!(e.shiftKey && last_target)) {
		      target.mouseDown(e);
  	      if(!(target instanceof text)) {
  	      	// text elements handle their own mouse events, so we allow bubbling for them, and dont throw mouse events
  		      _this.focus();
  		      target.focus();
  		      e.preventDefault(); 
  		    }
        } else
          e.preventDefault(); 
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