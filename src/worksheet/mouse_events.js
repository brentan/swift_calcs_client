/********************************************************
 * Event listerns for the mouse, to deal with clicking, 
 * click and dragging, etc.  Will pass to listeners within
 * each block when needed.  
 *******************************************************/

Worksheet.open(function(_) {
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
      if((el instanceof importData) && $(e_drag.target).closest('.' + css_prefix + 'dropzone_box').length) 
        el.jQ.removeClass(css_prefix + 'dropTop').removeClass(css_prefix + 'dropBot')
      else if(e_drag.originalEvent.pageY > (top + el.jQ.height()/2))
        el.jQ.removeClass(css_prefix + 'dropTop').addClass(css_prefix + 'dropBot');
      else
        el.jQ.removeClass(css_prefix + 'dropBot').addClass(css_prefix + 'dropTop');
    }
    e_drag.preventDefault();
  }

	_.bindDragging = function(e, selected_target, click_handler, drag_done_handler) {
		var _this = this;
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
    var scrollInterval = false;
    var scrollTime = 1;
    var scrollWorksheet = function(up) {
      $("body").scrollTop($("body").scrollTop() + ((up ? -10 : 10) * scrollTime));
      scrollTime = Math.min(3, scrollTime * 1.05);
    }
    function ScrollEnter(e_drag) {
      if(scrollInterval) window.clearInterval(scrollInterval);
      scrollTime = 1;
      scrollInterval = window.setInterval(function(up) { return function() { scrollWorksheet(up); } }($(e_drag.target).hasClass('top_scroll')), 50);
      e_drag.preventDefault();
    }
    function ScrollLeave(e_drag) {
      if(scrollInterval) window.clearInterval(scrollInterval);
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
      _this.dragging = true;
      $(e_drag.target).addClass('dragging');
      $(".top_scroll, .bot_scroll").show().on('dragenter', ScrollEnter).on('dragleave', ScrollLeave);
      e_drag.originalEvent.dataTransfer.setData("text/plain", "Draggable Element");
    	// We started a drag, so remove mouesup listener as we dont want it firing
      $(e.target.ownerDocument).unbind('mouseup', mouseup_drag);
      // Bind new handlers
      $(e_drag.target).on('dragend', dragEnd);
      var to_listen = _this.insertJQ.children('.' + css_prefix + 'element');
    	to_listen.on('dragenter', dragEnter);
    	//to_listen.find('table, div').on('dragenter', dragEnter); // WHY WAS THIS ADDED?  DOES NOT SEEM TO BE USEFUL
    	_this.insertJQ.on('dragenter', dragEnterWorksheet);
		}
		function dragEnd(e_drag) {
    	_this.dragging = false;
			_this.mousedown = false;
      $(e_drag.target).removeClass('dragging');
    	// Remove listeners
      if(scrollInterval) window.clearInterval(scrollInterval);
      $(".top_scroll, .bot_scroll").hide().off('dragenter', ScrollEnter).off('dragleave', ScrollLeave);
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
    // Drag from outside into worksheet handling.  These events are ignored if a selection drag/drop or drag/drop from the toolbox occurs
    var _this = this;
    function outside_dragDrop(e_drag) {
      outside_dragLeave(e_drag);
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
      _this.outside_drag_done_handler(e_drag, el, into, dir);
      e_drag.preventDefault();
    }
    function outside_dragLeave(e_drag) {
      var el = Element.byId[$(e_drag.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id') || -1];
      el.jQ.removeClass(css_prefix + 'dropTop').removeClass(css_prefix + 'dropBot');
      $(e_drag.target).off('dragover', dragOver).off('dragleave', outside_dragLeave).off('drop', outside_dragDrop);
      el.jQ.find('.' + css_prefix + 'dropTop').removeClass(css_prefix + 'dropTop');
      e_drag.preventDefault();
    }
    function outside_dragEnter(e_drag) {
      if(_this.dragging) return;
      if($(e_drag.target).closest('.' + css_prefix + 'element').length == 0) return;
      $(e_drag.target).on('dragover', dragOver).on('dragleave', outside_dragLeave).on('drop', outside_dragDrop);
      dragOver(e_drag);
      e_drag.preventDefault();
    }
    if(this.allow_interaction()) this.jQ.on('dragenter', outside_dragEnter);
    //context-menu event handling
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
      if((selected_target.length == 0) && $(e.target).closest('td.' + css_prefix + 'element_td').length && !(e.shiftKey) && !$(e.target).closest('div.' + css_prefix + 'collapse').length && !$(e.target).closest('div.' + css_prefix + 'expand').length && !$(e.target).closest('div.' + css_prefix + 'disabled_icon').length) {
        if(target.focusedItem) target.focusedItem.mouseOut(e);
        _this.clearSelection();
        _this.createSelection(target.jQ);
        _this.selection = [target];
        _this.selectionChanged();
        selected_target = target.jQ;
        force_select = true;
        window.setTimeout(function() { _this.textarea.focus(); },1);
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
          if((selection.length == 0) && (start_target == end_target) && !start_target.mouseUpShift(e)) return; // Try to let element handle it if same as last target
          start_target.mouseOut(e);
          //Journey to common generation for start/end targets
          while(start_target.depth > end_target.depth) { start_target = start_target.parent; }
          while(start_target.depth < end_target.depth) { end_target = end_target.parent; }
          while(true) {
            //We dont know if the start or end target is 'first' in the tree, so we guess start is first, and if not, do the opposite
            var success = false;
            selected_elements = $();
            selection = [];
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
            }
            if(success) break;
            // No success...this may be an issue where the start/end blocks have another block between that is at a lesser depth.  Jump to parent of both
            if(start_target.depth == 0) throw("Tree traversal failed for selection.  This shouldn't be possible");
            start_target = start_target.parent;
            end_target = end_target.parent;
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
          if(target.allow_interaction()) {
          	if(target[command](e)) {
          		selected_elements = selected_elements.add(target.jQ);
          		selection.push(target);
          	} else if(target instanceof text) return true; // Let text objects deal with their own mouse events
          } else if(command == 'mouseUp') { // Check for collapse/expand/disable
            if($(e.target).closest('div.' + css_prefix + 'collapse').length) target.collapse();
            else if($(e.target).closest('div.' + css_prefix + 'expand').length) target.expand();
            else if($(e.target).closest('div.' + css_prefix + 'disabled_icon').length) {
              if(target.disabled) target.enable()
              else target.disable();
            }
          }
      	} else { //Start and target are different elements
          selectFromTargets(target, new_target);
      	}
      	_this.createSelection(selected_elements);
      	_this.selection = selection;
      	_this.selectionChanged();
      }
    	if(_this.allow_interaction() && (force_select || (selected_target.length && _this.selection.length && !(target instanceof text) && !(e.shiftKey)))) {
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
          
		  		if(dir === R) _this.selection.reverse();
		  		var active_elements = $();
		  		for(var i = 0; i < _this.selection.length; i++) {
		  			_this.selection[i].move(el, into ? R : dir, into);
		  			active_elements = active_elements.add(_this.selection[i].jQ);
		  		}
		  		if(dir === R) _this.selection.reverse();
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
              var to_insert = (_this.implicitType) ? _this.implicitType() : math().setImplicit();
              new_target = to_insert.insertAfter(_this.ends[R]).show();
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
		      if(target.allow_interaction()) {
            target.mouseDown(e);
    	      if(!(target instanceof text)) {
    	      	// text elements handle their own mouse events, so we allow bubbling for them, and dont throw mouse events
    		      _this.focus();
    		      target.focus();
    		      e.preventDefault(); 
    		    }
          } else { e.preventDefault(); }
        } else {
          if((target != last_target) || !(target instanceof text) || target.mouseDownShift(e)) e.preventDefault(); 
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
      this.jQ.off('dragenter', outside_dragEnter);
    	return this;
    };
  }
  _.unbindMouse = function() { return this; };	
});