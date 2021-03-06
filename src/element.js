
/*
Element is the basic class that defines any block in the worksheet.  Blocks can contain other blocks.  Basic navigation:
[L]: left/up sibling block
[R]: right/down sibling block
parent: enclosing block or worksheet
worksheet: worksheet to which this block belongs
children: array of child blocks
ends[L]: left/upmost child block
ends[R]: right/downmost child block

All the navigation options are initialized as 0, and are updated as other blocks are added or removed.  

After initialization, a block can be added to the chain with the various insert commands.  This inserts the element into
the DOM as well, but with a display:none attribute.  Use the 'show' method to then show the object.

Most methods are chainable
*/
var Element = P(function(_) {
  _[L] = 0;
  _[R] = 0;
  _.interaction_level = INTERACTION_LEVELS.FULL; // For embed mode, what 'level' do we need to be at in order to play with this element?
  _.worksheet = 0;
  _.undo_count = 0; // Number of times this appears in the undo stack.  Used to make sure we don't destroy the element when we might want to get it back later through an undo method
  _.parent = 0;
  _.no_save = false;
  _.jQ = 0;
  _.hidden = true;
  _.disabled = false;
	_.error = false;
	_.savedProperties = [];
	_.outputBox = false;
	_.warn = false;
	_.klass = [];
	_.mark_for_deletion = false;
	_.lastFocusedItem = false;
	_.suppress_output = false; // Also will suppress children output.  Will not suppress warnings/errors
	_.depth = 0;
	_.blurred = true;
	_.toParse = false;
	_.lineNumber = false;
	_.myLineNumber = false;
	_.needsEvaluation = false; // This is whether an evaluatable element, when evaluated directly, should be evaluated
	_.evaluatable = false;     // Is this element evaluatable?  If not, just skip it
	_.hasChildren = false; // Doesn't imply there are children elements, implies children elements are allowed
	_.inTree = false;
	_.storeAsVariable = false; // Override with function that 'sets' the variable name for blocks with a '[x] = block' syntax
	_.unarchive_list_set = false;

	//Give each element a unique ID, this is just for tracking purposes
  var id = 0;
  function uniqueNodeId() { return id += 1; }
  this.byId = {};

	_.init = function() {
    this.id = uniqueNodeId();
    Element.byId[this.id] = this;

		this.ends = {};
		this.commands = [];
		this.previous_commands = [];
		this.independent_vars = [];
		this.independent_objects = [];
		this.dependent_vars = [];
		this.previous_independent_vars = [];
    this.ignored_vars = {};
		this.unarchive_list = [];
		this.autocomplete_list = {};
		this.ends[R] = 0;
		this.ends[L] = 0;

		/* Focusable items is used for item traversal when using keyboard arrows to move around.  It is assumed all
		 * focusable items will issue a callback when the cursor tries to move out of them up/down/left/right, and when this
		 * is done, we look here first to determine where to go next.  A value of '-1' indicates a placeholder for children and must exist on its own row,
		 * so if/when this is reached, the cursor will move into the child elements (if any).  When the beginning/end of the
		 * array is reached, we jump to the next neighbor focusable item, or traverse up the tree.  This should be an array of 
		 * arrays, where each row is a new actual row in the HTML representation
		 */
		this.focusableItems = [[]];
	}

	/* 
	DOM element generation functions

	regnerateHTML should generate HTML for this block, incorporating klass and all child blocks.  If this block has
	special DOM structure, that should be created with innerHTML() (which should return the markup as a valid HTML string 
	with a block in which to insert children, which should have class 'sc_insert'.  If no child with sc_insert is found, 
	it is assumed the main div is the insert block).  regenerateHTML will store the created elements as Jquery objects in
	this.jQ (the JQuery object for this element in the DOM) and this.JQinsert (the Jquery object for the div
	into which children will be placed.), and will return itself for method chaining.

	postInsertHandler is called on this block after it is attached to the document, so that event handlers can be created
	preRemoveHandler is called on this block immediately before the elements are removed from the DOM
	*/
	_.regenerateHtml = function() {
		if(this.worksheet && this.worksheet.activeUndo && this.jQ) return this;
		this.jQ = $('<div style="display:none;" ' + css_prefix + 'element_id=' + this.id + ' class="' + css_prefix + 'element ' + (!this.allow_interaction() ? (css_prefix + 'no_interaction ') : '')
			+ jQuery.map(this.klass, function(k) { return (css_prefix + k) }).join(' ') + '">'
			+ '<table class="' + css_prefix + 'element_table"><tbody><tr><td class="' + css_prefix + 'element_td">'
			+ (this.evaluatable ? '<div class="' + css_prefix + 'disabled_icon fa-stack fa-lg"><i class="fa fa-calculator fa-stack-1x"></i><i class="fa fa-ban fa-stack-2x text-danger"></i></div>' : '')
			+ '<i class="fa fa-exclamation-triangle"></i><span></span><div class="' + css_prefix + 'element_collapse">'
			+ '<div class="' + css_prefix + 'expand"><i class="fa fa-caret-right"></i></div><div class="' + css_prefix + 'collapse"><i class="fa fa-caret-down"></i></div></div></td>'
			+ '<td class="' + css_prefix + 'element_insert_td">' + this.innerHtml() + '</td></tr></tbody></table></div>');
		var parent = this;
		this.insertJQ = (this.jQ.find("." + css_prefix + "insert").length == 0) ? this.jQ.find("." + css_prefix + "element_insert_td").first() : this.jQ.find("." + css_prefix + "insert").first();
		this.leftJQ = this.jQ.find("." + css_prefix + "element_td").first();
		jQuery.each(this.children(), function(i, child) {
			if(child.jQ === 0) child.regenerateHtml();
			parent.insertJQ.append(child.jQ);
		});
		return this;
	}
	// Allow blocks to also insert their own HTML directly
	_.innerHtml = function() {
		return '';
	}
	// Allow blocks to define handlers to run after being attached.
	_.postInsertHandler = function() {
		if(this.jQ.find('.' + css_prefix + 'output_box').length) this.outputBox = outputBox(this).setWidth();
		if(this.toParse) {
			this.parse(this.toParse);
			this.toParse = false;
		}
		if(this.hasChildren && (this.children().length == 0)) { // Add default item 
			if(this.implicitType)
				this.implicitType().appendTo(this).show(0);
			else
				math().appendTo(this).show(0);
		}
		if(this.collapsed) { // If parse shows this to be collapsed, we need to immediately collapse it
			this.collapsed = false;
			this.collapse(true);
		} else if(this.hasChildren)
			this.collapseArrow();
		if(this.disabled)
			this.jQ.addClass(css_prefix + 'disabled');
		return this;
	}
	// Allow blocks to define handlers to run before being destroyed.
	_.preRemoveHandler = function() {
		jQuery.each(this.children(), function(i, child) {
			child.preRemoveHandler();
		});
		return this;
	}
	// Allow blocks to define handlers to run before being re-inserted (after a remove event, such as a deletion/undo)
	// Essentially the reverse of preRemoveHandler.
	_.preReinsertHandler = function() {
		this.mark_for_deletion = false;
		this.jQ.show();
		jQuery.each(this.children(), function(i, child) {
			child.preReinsertHandler();
		});
		return this;
	}
	/*
		Protection methods for insert.  If these methods are set, they are called when an item is inserted as a child
		or when this element is inserted into another.  If they return false, the insertion is not allowed.  These can 
		be used to ensure elements have a specific element type as a parent or child.  ImplicitType should return an 
		object to be used to insert into an empty block.  If not set, math element is used.
	*/
	_.validateParent = false;
	_.validateChild = false;
	_.implicitType = false;
	/* 
	Insert methods

	These should all be self explanatory.  All operate with this being the object being inserted, so it will
	be placed next to/into/in place of the provided target.  dont_eval is a T/F depending on whether the insert
	event should cause a recalculation of the worksheet.
	*/
	_.insertNextTo = function(sibling, location, dont_eval) {
		if(this.inTree) return this; // Already added...
		if(this.validateParent && !this.validateParent(sibling.parent)) {
			// This element cannot be inserted into a parent of this type
			showNotice('This item cannot be inserted in this location','red');
			return this;
		}
		if(sibling.parent.validateChild && !sibling.parent.validateChild(this)) {
			// Parent does not allow children of this type.  Insert at next available position
			showNotice('This item cannot be inserted here and was placed at the next allowable position');
			return this.insertNextTo(sibling.parent, R, dont_eval);
		}
		this.parent = sibling.parent;
		this.updateWorksheet(this.parent.getWorksheet());
		if(this.worksheet) this.worksheet.setUndoPoint(this, { command: 'insert', dont_eval: dont_eval });
		this.inTree = true;
		this[-location] = sibling;
		if(sibling[location] !== 0) {
			sibling[location][-location] = this;
			this[location] = sibling[location];
		} else
			this.parent.ends[location] = this;
		sibling[location] = this;
		if(this.parent.jQ) {
			this.regenerateHtml();
			if(location == L)
				this.jQ.insertBefore(sibling.jQ);
			else
				this.jQ.insertAfter(sibling.jQ);
			this.postInsert();
		}
		this.setDepth();
		if(this.implicit && (this[L] == 0) && (this[R] == 0))
			this.implicit = false;
		if(this.worksheet && !this.implicit) this.worksheet.save();
		this.setAutocomplete(this.previousUnarchivedList());
		return this;
	}
	_.insertAfter = function(sibling, dont_eval) {
		return this.insertNextTo(sibling, R, dont_eval);
	}
	_.insertBefore = function(sibling, dont_eval) {
		return this.insertNextTo(sibling, L, dont_eval);
	}
	_.insertInto = function(parent, location, dont_eval) {
		if(this.inTree) return this; // Already added...
		if(this.validateParent && !this.validateParent(parent)) {
			// This element cannot be inserted into a parent of this type
			showNotice('This item cannot be inserted in this location','red');
			return this;
		}
		if(parent.validateChild && !parent.validateChild(this)) {
			// Parent does not allow children of this type.  Insert at next available position
			showNotice('This item cannot be inserted here and was placed at the next allowable position');
			return this.insertNextTo(parent, R, dont_eval);
		}
		this.parent = parent;
		this.updateWorksheet(parent.getWorksheet());
		if(this.worksheet) this.worksheet.setUndoPoint(this, { command: 'insert', dont_eval: dont_eval });
		this.inTree = true;
		this[-location] = parent.ends[location];
		parent.ends[location] = this;
		if(parent.ends[-location] === 0) parent.ends[-location] = this;
		if(this[-location] !== 0) this[-location][location] = this;
		if(parent.jQ) {
			this.regenerateHtml();
			if(parent === this.worksheet) {
				if(location == L)
					this.jQ.insertAfter(parent.insertJQ.find('.' + css_prefix + 'element_top_spacer'));
				else
					this.jQ.insertBefore(parent.insertJQ.find('.' + css_prefix + 'element_bot_spacer'));
			} else {
				if(location == L)
					this.jQ.prependTo(parent.insertJQ);
				else
					this.jQ.appendTo(parent.insertJQ);
			}
			this.postInsert();
		}
		this.setDepth();
		if(this.implicit && (this[L] == 0) && (this[R] == 0))
			this.implicit = false;
		if(this.worksheet && !this.implicit) this.worksheet.save();
		this.setAutocomplete(this.previousUnarchivedList());
		return this;
	}
	_.prependTo = function(parent, dont_eval) {
		return this.insertInto(parent, L, dont_eval);
	}
	_.appendTo = function(parent, dont_eval) {
		return this.insertInto(parent, R, dont_eval);
	}
	_.replace = function(replaced, dont_eval) {
		var stream = !replaced.worksheet.trackingStream;
		if(stream) replaced.worksheet.startUndoStream();
		this.insertAfter(replaced, dont_eval);
		replaced.remove(0, dont_eval);
		if(stream) this.worksheet.endUndoStream();
		return this;
	}
	// Update the worksheet of this block and all children
	_.updateWorksheet = function(worksheet) {
		this.worksheet = worksheet;
		jQuery.each(this.children(), function(i, child) {
			child.updateWorksheet(worksheet);
		});
		return this;
	}
	// Update the line numbers on this block and all children
	_.numberBlock = function(start) {
		if(this.lineNumber) {
			this.myLineNumber = start;
			this.leftJQ.children('span').html(start);
			start++;
		} else this.leftJQ.children('span').html('');
		jQuery.each(this.children(), function(i, child) {
			start = child.numberBlock(start);
		});
		return start;
	}
	// Find an object by its line number.  If I’m it, return me, otherwise search children.
	_.findByLineNumber = function(line) {
		if(this.myLineNumber === line) return this;
		var child_found = undefined;
		jQuery.each(this.children(), function(i, child) {
			if(child_found) return child_found;
			child_found = child.findByLineNumber(line);
		});
		return child_found;
	}
	// Cause the background to flash.  Color and duration can be set, defaults are a yellow color for 400ms
  _.flash = function(color, duration) {
    var el = this.jQ.closest('.sc_element');
    if(typeof color === 'undefined') color = "#ffe0e0";
    if(typeof duration === 'undefined') duration = 400;
    el.stop().css("background-color", color).animate({ backgroundColor: "#FFFFFF"}, {complete: function() { $(this).css('background-color','')} , duration: duration });
    return this;
  }
	//addNotice will show a message immediately after the element.  Used to ask user about changing variable names etc
  _.addNotice = function(message, klass, buttons, show_undo) {
    this.insertJQ.children(".after_notice." + klass).remove();
    if(show_undo) 
      message += "&nbsp;<a href='#' class='undolink'>Undo</a>";
    var div = $("<div/>").addClass('after_notice').addClass(klass).html(message + (buttons.length ? "<div class='buttons'></div>" : ""));
    if(show_undo)
      div.children("a.undolink").on("click", function(_this) { return function(e) {
        _this.worksheet.restoreUndoPoint();
        _this.removeNotice(klass);
        e.preventDefault();
      }}(this));
    for(var i = 0; i < buttons.length; i++) 
      $("<button/>").addClass(buttons[i].color).html(buttons[i].name).on('click', function(_this, func) { return function() { func.apply(_this); } }(this, buttons[i].func)).appendTo(div.children('div.buttons'));
    this.insertJQ.append(div);
    div.hide().slideDown({duration: 500});
  }
  _.removeNotice = function(klass) {
    this.insertJQ.children(".after_notice." + klass).slideUp({duration: 300, always: function() { this.remove(); }});
  }

	/*
	Move commands.  Allow elements to be moved upwards, downwards, etc.
	The move command takes care of all the move related stuff, including removing the old element and reinserting at the correct
	new location.  Note that it takes a target to insert before or after, and a direction.  insertInto should be set to true to insert into 
	an element at the end based on dir.  Set dont_eval true in order to perform a move without evaluating anything
	*/
	_.move = function(target, location, insertInto, dont_eval) {
		// Check if the move is allowed
		if(insertInto) {
			if((this.validateParent && !this.validateParent(target)) || (target.validateChild && !target.validateChild(this))) {
				// This element cannot be inserted into a parent of this type
				showNotice('This item cannot be moved to the requested location','red');
				return this;
			}
		} else {
			if((this.validateParent && !this.validateParent(target.parent)) || (target.parent.validateChild && !target.parent.validateChild(this))) {
				// This element cannot be inserted into a parent of this type
				showNotice('This item cannot be moved to the requested location','red');
				return this;
			}
		}

    if(dont_eval !== true) {
      /*
      Move Evaluation Strategy
      - Find all independent vars in this item
      - Find all independent vars in skipped elements
      - Any elements in this item dependent on independent vars in skipped elements much be recalced
      - Any elements in skipped section dependent on independent vars in this item must be recalced
      */
      //Find all elements between old and new location
      var target_el = target;
      var impacted_els = [];
      //Assume moving upwards (initial guess)
      var move_up = true;
      //Adjust target_el to be the element just below where we are inserting (target_el is first impacted el)
      if(insertInto) {
        if(target_el.independent_vars.length) impacted_els.push(target_el);
        else if(target_el instanceof Loop) impacted_els.push(target_el);
        if((location === L) && (target_el.ends[L])) target_el = target_el.ends[L];
        else target_el = target_el[R];
      } else if(location === R) target_el = target_el[R];
      var first_item = target_el;
      // Start marching downwards until we reach the this item
      while(true) {
        if(target_el == 0) { move_up = false; break; } // End of the road, no match was ever found
        if(target_el.id == this.id) { break; } // Done!
        impacted_els.push(target_el);
        if(target_el.hasChildren && target_el.ends[L])
          target_el = target_el.ends[L];
        else if(target_el[R]) 
          target_el = target_el[R];
        else if(target_el.parent) {
          if(target_el.independent_vars.length) impacted_els.push(target_el.parent);
          else if(target_el instanceof Loop) impacted_els.push(target_el.parent);
          target_el = target_el.parent[R];
        } else { move_up = false; break; } // End of the road, no match was ever found
      } 
      if(!move_up) {
        // First guess was wrong!  Try again...adjust target_el to be the element just above where we are inserting (target_el is first impacted el)
        target_el = target;
        var impacted_els = [];
        var move_down = true;
        if(insertInto) {
          if(target_el.independent_vars.length) impacted_els.push(target_el);
          else if(target_el instanceof Loop) impacted_els.push(target_el);
          if((location === R) && (target_el.ends[R])) target_el = target_el.ends[R];
          else target_el = target_el[L];
        } else if(location === L) target_el = target_el[L];
        // Start marching upwards until we reach the this item
        while(true) {
          if(target_el == 0) { move_down = false; break; } // End of the road, no match was ever found
          if(target_el.id == this.id) { break; } // Done!
          impacted_els.push(target_el);
          if(target_el.hasChildren && target_el.ends[R])
            target_el = target_el.ends[R];
          else if(target_el[L]) 
            target_el = target_el[L];
          else if(target_el.parent) {
            if(target_el.independent_vars.length) impacted_els.push(target_el.parent);
            else if(target_el instanceof Loop) impacted_els.push(target_el.parent);
            target_el = target_el.parent[L];
          } else { move_down = false; break; } // End of the road, no match was ever found
        } 
      }
      if(!move_up && !move_down) {
        // THIS SHOULD NEVER HAPPEN
        impacted_els = [];
      }

      //Create a list of all independent vars in impacted els
      var impacted_el_vars = {};
      var selection_vars = {};
      var all_independent_vars = [];
      var add_vars = function(vars, impacted) {
        if(impacted) {
          for(var j=0; j<vars.length; j++) {
            impacted_el_vars[vars[j].replace("(","").trim()]=true;
            all_independent_vars.push(vars[j].trim());
          }
        } else {
          for(var j=0; j<vars.length; j++) {
            selection_vars[vars[j].replace("(","").trim()]=true;
            all_independent_vars.push(vars[j].trim());
          }
        }
      }
      for(var i = 0; i < impacted_els.length; i++)
        add_vars(impacted_els[i].independent_vars, true);
      add_vars(this.allIndependentVars(), false); // What is independent in the moved blocks?

      //Check each selection element against list to see if recalculation is needed
      var checker = function(impacted_el_vars) { return function(_this) { 
        for(var k = 0; k < _this.dependent_vars.length; k++) {
          if(impacted_el_vars[_this.dependent_vars[k].trim()]) {
            _this.altered_content = true;
            _this.previous_commands = [];
            break;
          }
        }
      }; }(impacted_el_vars);
      this.commandChildren(checker);

      //Check impacted els against list to see if recalculation is needed
      for(var i = 0; i < impacted_els.length; i++) {
        for(var k = 0; k < impacted_els[i].dependent_vars.length; k++) {
          if(selection_vars[impacted_els[i].dependent_vars[k].trim()]) {
            impacted_els[i].previous_commands = [];
            impacted_els[i].altered_content = true;
            break;
          }
        }
      }
      //Whew!  That was a mess.  But recalculation should now proceed swimmingly
      var start_el = (move_down ? impacted_els[impacted_els.length - 1] : this);
      var next_el  = (move_down ? this : impacted_els[impacted_els.length - 1]);
    }

		// First, basically remove this item from the tree
		if(this.worksheet) this.worksheet.setUndoPoint(this, { command: 'move', L: this[L], parent: this.parent, dont_eval: dont_eval === true });
		if(this[L] !== 0) 
			this[L][R] = this[R];
		else
			this.parent.ends[L] = this[R];
		if(this[R] !== 0) 
			this[R][L] = this[L];
		else
			this.parent.ends[R] = this[L];
    var old_parent = this.parent;
		this[R] = 0;
		this[L] = 0;
		// Next, insert me into/next to my target
		if(insertInto === false) {
			this.parent = target.parent;
			this.updateWorksheet(this.parent.getWorksheet());
			this[-location] = target;
			if(target[location] !== 0) {
				target[location][-location] = this;
				this[location] = target[location];
			} else
				this.parent.ends[location] = this;
			target[location] = this;
			if(location == L)
				this.jQ.detach().insertBefore(target.jQ);
			else
				this.jQ.detach().insertAfter(target.jQ);
		} else {
			this.parent = target;
			this.updateWorksheet(target.getWorksheet());
			this[-location] = target.ends[location];
			target.ends[location] = this;
			if(target.ends[-location] === 0) target.ends[-location] = this;
			if(this[-location] !== 0) this[-location][location] = this;
			if(location == L)
				this.jQ.detach().prependTo(target.insertJQ);
			else
				this.jQ.detach().appendTo(target.insertJQ);
		}
		this.setDepth();
		if(this.implicit && (this[L] == 0) && (this[R] == 0))
			this.implicit = false;
		if(this.worksheet && !this.implicit) this.worksheet.save();
    // Deal with old parent
    if((old_parent.ends[L] === 0) && (old_parent.ends[R] === 0)) {
      if(old_parent instanceof indent) 
        old_parent.remove(0,dont_eval);
      else if(old_parent.implicitType)
        old_parent.implicitType().appendTo(old_parent).show(0);
      else
        math().appendTo(old_parent).show(0);
    }

    if(dont_eval !== true) {
      var eval_id = this.worksheet.evaluate([], start_el);
      if(next_el) next_el = next_el.nextEvaluateElement();
      if(next_el) giac.add_altered(eval_id, all_independent_vars, next_el.id); // Let evaluator know about all altered vars in move operation
    }

		return this;
	}
	/* Destroy methods.
	Destroy writes this elements jQ as a 0 to fully delete it.  It assumes it has already been 
	removed from the DOM elsewhere, likely when a parent had its jQ removed.  It propagates
	to all children, and is used when an element is removed from the undoManager or when
	this worksheet is unbound

	The remove method will
	navigate the tree to update points to this object to correctly point around it
	and patch the tree.  It will also detach elements from the DOM and call any
	pre-descruction handlers.  After this is run, the only pointers
	to this object should be in the undomanager, and after removal
	from the manager there should be no references and it should be garbage collected.
	*/
	_.destroy = function() {
		if(this.hasChildren) $.each(this.children(), function(i, child) { child.destroy(); });
		if(this.inTree) this.jQ.remove();
		if(this.jQ) this.jQ.empty();
		delete Element.byId[this.id];
		delete this[L];
		delete this[R];
		delete this.ends[L];
		delete this.ends[R];
		delete this.jQ;
		return this;
	}
	_.remove = function(duration, dont_eval) {
		if(!this.inTree) return this; // Already removed...
		// Add this to the undoManager
		if(this.worksheet) this.worksheet.setUndoPoint(this, { command: 'remove', L: this[L], parent: this.parent, dont_eval: dont_eval });
		this.inTree = false;
		duration = typeof duration === 'undefined' ? 200 : duration;
		this.preRemoveHandler();
		var independent_vars = this.allIndependentVars();
		var do_eval = false;
		if(independent_vars.length) {
	    var target = this.nextEvaluateElement();
	    if(this.parent) {
	    	var eval_target = this.parent;
	    	this.parent.altered_content = true;
	    } else
	    	var eval_target = target;
	    if(target) do_eval = true;
	  }
		if(this[L] !== 0) 
			this[L][R] = this[R];
		else
			this.parent.ends[L] = this[R];
		if(this[R] !== 0) 
			this[R][L] = this[L];
		else
			this.parent.ends[R] = this[L];
		if((this.parent.ends[L] === 0) && (this.parent.ends[R] === 0)) {
      if(this.parent instanceof indent) 
        this.parent.remove(0, dont_eval);
			else if(this.parent.implicitType)
				this.parent.implicitType().appendTo(this.parent).show(0).focus(L);
			else
				math().appendTo(this.parent).show(0).focus(L);
		}
		if(this.jQ !== 0) {
			if(this.hidden || (duration == 0)) {
				this.jQ.detach();
			} else 
				this.jQ.slideUp({duration: duration, always: function() { $(this).detach(); }});
		}
		if((this[L] instanceof text) && (this[R] instanceof text) && !this[L].mark_for_deletion && !this[R].mark_for_deletion) {
			// If we delete something between text nodes, we should merge those nodes
			this[R].merge();
		}
		this[L] = 0;
		this[R] = 0;
		this.worksheet.renumber();
		if(!this.implicit) this.worksheet.save();
		if(do_eval && (dont_eval !== true)) {
			var eval_id = this.worksheet.evaluate([], eval_target);
			giac.add_altered(eval_id, independent_vars, target.id); // Let evaluator know about all altered vars in move operation
    }
		return this;
	}
	// Undo/Redo restore
	_.restoreState = function(action) {
		// The command is what was done to the item, so we should do the inverse
		switch(action.command) {
			case 'remove':
				if(action.L)
					this.insertAfter(action.L, action.dont_eval);
				else
					this.prependTo(action.parent, action.dont_eval);
        if(action.dont_eval !== true) {
  		    var eval_id = this.worksheet.evaluate([], this);
  		    var next_el = this.nextEvaluateElement();
  		    if(next_el) giac.add_altered(eval_id, this.allIndependentVars(), next_el.id); // Let evaluator know about all altered vars in restore operation
        }
				break;
			case 'insert':
				this.remove(0, action.dont_eval);
				break;
			case 'move':
				if(action.L) 
					this.move(action.L, R, false, action.dont_eval);
				else 
					this.move(action.parent, L, true, action.dont_eval);
				break;
      case 'suppress_autofunction':
        this.worksheet.suppress_autofunction = action.val
        break;
		}
	}
	/* Visibility Methods
	Change visibility, optional animation
	*/
	_.show = function(duration) {
		duration = typeof duration === 'undefined' ? 0 : duration;
		if(!this.hidden) return this;
		this.hidden = false;
		if((duration > 0) && (this.jQ !== 0))
			this.jQ.slideDown({duration: duration});
		else if(this.jQ !== 0)
			this.jQ.css('display', '');
		if(this.jQ !== 0)
			window.setTimeout(function(_this) { return function() { _this.reflow(); }; }(this), 100);
		return this;
	}
	_.reflow = function() {
		if(!this.worksheet.bound) return;
		this.setWidth();
		for(var i = 0; i < this.focusableItems.length; i++) 
			for(var j = 0; j < this.focusableItems[i].length; j++)
				if((this.focusableItems[i][j] !== -1) && this.focusableItems[i][j].reflow) this.focusableItems[i][j].reflow();
		var children = this.children();
		for(var i = 0; i < children.length; i++)
			children[i].reflow();
	}
	// Set max-width on math blocks inside this element
	_.setWidth = function() {
		if(this.outputBox) this.outputBox.setWidth();
		for(var i = 0; i < this.focusableItems.length; i++) {
			var tot = 0;
			for(var j = 0; j < this.focusableItems[i].length; j++) {
				if((this.focusableItems[i][j] !== -1) && this.focusableItems[i][j].setWidth) 
					tot++;
			}
			for(var j = 0; j < this.focusableItems[i].length; j++) {
				if((this.focusableItems[i][j] !== -1) && this.focusableItems[i][j].setWidth) 
					this.focusableItems[i][j].setWidth(max(150, (this.jQ.closest('.' + css_prefix + 'element').width() - 150) / tot));
			}
		}
		var children = this.children();
		for(var i = 0; i < children.length; i++)
			children[i].setWidth();
		return this;
	}
	_.hide = function(duration) {
		duration = typeof duration === 'undefined' ? 0 : duration;
		if(this.hidden) return this;
		this.hidden = true;
		if((duration > 0) && (this.jQ !== 0))
			this.jQ.slideUp({duration: duration});
		else 
			this.jQ.hide();
		return this;
	}
	/* Tree traversal helpers
	*/
	// List children
	_.children = function() {
		var out = [];
		if(!this.hasChildren) return out;
		if(this.ends[L]) {
			for(var ac = this.ends[L]; ac !== 0; ac = ac[R])
				out.push(ac);
		}
		return out;
	}
	// Will run the func command on myself, and then command all children with the same function
	_.commandChildren = function(func) {
		func(this);
		var children = this.children();
		for(var i = 0; i < children.length; i++)
			children[i].commandChildren(func);
		return this;
	}
	// Find the first-generation ancestor (aka search parents until find parent who is first descendant of worksheet)
	_.firstGenAncestor = function() {
		for(var w = this; !(w.parent instanceof Worksheet); w = w.parent) {}
		return w;
	}
	//Helper function: will find its current ‘depth’, aka how many parents between itself and worksheet.
	_.setDepth = function() {
		var to_run = function(_this) {
			_this.depth = 0;
			for(var w = _this; !(w.parent instanceof Worksheet); w = w.parent) { _this.depth++; }
		}
		this.commandChildren(to_run);
		this.worksheet.renumber();
		return this;
	}
	// return current worksheet
	_.getWorksheet = function() {
		return this.worksheet;
	}	

	/*
	Evaluation functions. 
	Evaluation depends on whether item is 'scoped' or not.  Scoped items alter a variable.
	Scoped evaluations start at the first_gen_ancestor of the element, and then the environment is reset.
	The environment is reloaded by finding all variables defined prior to the evaluation point (the archived variables from the previous element in the worksheet).
	From the point onwards, for any elements that have not been altered and don’t depend on an altered variable, we just skip (if not scoped) or load the archived value for the
	independent variable (if scoped).  When we hit an altered element or element dependent on an altered variable (test this.altered(eval_id)) we evaluate it and then continue to march downwards.  The list of altered variables therefore can grow as evaluation continues, and only
	lines dependent on an altered variable are then evaluated.  This continues until the end of the worksheet is reached.
	For non-scoped evaluations, only that element is evaluated, and no tree traversal is done, as the element doesn’t change any variables and therefore no other elements will depend on it.

	Most of these functions work on their own, but elements can override:
	continueEvaluation: What should happen when this element is evaluated
	evaluationFinished: the default callback from continueEvaluation, although other callbacks can be defined (assumes commands are in the 'commands' property of this element)
	childrenEvaluated: the callback that is called when all children of the element have been evaluated (if any)
	altered will check the list of dependent vars for an item against the currently altered list.  If it matches, we need to evaluate, if
	  it doesn't match, this item did not change.  If we are not scoped, we just move on, otherwise we have to unarchive the independent vars
	  for this item, which is done with the giac.skipExecute command.  callback is scopeSaved from this item.

	When continueEvaluation and childrenEvaluated are overrident, they should be called through super_, it may make sense to call them with super_ after some work is done
	The giac function 'execute' is provided to send commands to giac.  Execute is called with various options, including 
		commands to send (array), and the string name of the callback that should be called when complete
	*/
	_.altered_content = false;
	_.outputSettingsChange = false;

	// Evaluate starts an evaluation at this node.  It checks if an evaluation is needed (needsEvaluation method or force=true) 
	// This function assigns this evaluation stream a unique id, and registers it in Worksheet.  Other functions can cancel this evaluation stream with this unique id.
	// If we need an evaluation, we start at the top of the worksheet.
	_.evaluate = function(force) {
		if(typeof force === 'undefined') force = false;
		if(force === 0) force = false;
		if(this.mark_for_deletion) return;
		if(this.disabled) return;
		if(!this.needsEvaluation && (force === false)) return this;
		if(!this.newCommands() && !this.outputSettingsChange && (force === false)) return this;
		this.altered_content = true; // We called evaluate on this element, so it was altered, which will force its evaluation
		if(this.needsEvaluation) this.worksheet.save();
		if(this.outputBox) this.outputBox.calculating();

		var el = this;
		var stop_id = false;
		if((!this.outputSettingsChange && this.scoped()) || (this.inProgrammaticFunction() && this.scoped() || (this instanceof FlowControl)))
			el = this.firstGenAncestor(); // Scoped items should start at first gen ancestor
		else 
			stop_id = this.id; //not scoped, so start here and stop when we reach element with this.id
		this.outputSettingsChange = false;
		this.worksheet.evaluate([], el, stop_id);
		return this;
	}
	//Return parent program function block, if I’m in one.  Use to ensure we complile functions
	_.getProgrammaticFunction = function() {
		for(var parent = this.parent; !(parent instanceof Worksheet); parent = parent.parent)
			if (parent instanceof programmatic_function) return parent;
		return false;
	}
	//Test if this block is in a program function.  If so, its not really evaluatable, as the function needs to be compiled.
	_.inProgrammaticFunction = function() {
		return this.getProgrammaticFunction() ? true : false;
	}

  var count = 0;
	//blur the Output Box, done when a calculation starts and is in progress.
	_.blurOutputBox = function() {
		if(this.outputBox) this.outputBox.calculating();
		if(this.jQ && (typeof this.jQ.find === 'function')) {
			this.jQ.find('i.fa-spinner').remove();
			//this.jQ.find('div.' + css_prefix + 'element.error').removeClass('error');
			//this.jQ.find('div.' + css_prefix + 'element.warn').removeClass('warn');
		}
		if(this.hasChildren) {
			var children = this.children();
			for(var i = 0; i < children.length; i++) children[i].blurOutputBox();
		}
	}
	_.unblurOutputBox = function() {
		if(this.outputBox) this.outputBox.uncalculating();
		/*if(this.hasChildren) {
			var children = this.children();
			for(var i = 0; i < children.length; i++) window.setTimeout(function(i) { return function() { children[i].unblurOutputBox(); }; }(i));
		}*/
	}
	//Check to see if I should be evaluated, based on the evaulation_id.  Return false if this eval_id has been cancelled, otherwise it checks if I depend on any variables that have been changed recently.
	_.shouldBeEvaluated = function(evaluation_id) {
		giac.load_altered(evaluation_id, this);
		if(giac.evaluations[evaluation_id]) giac.evaluations[evaluation_id].active_id = this.id;
		if(!this.evaluatable || this.disabled || this.mark_for_deletion || !giac.shouldEvaluate(evaluation_id)) return false;
		if(giac.compile_mode && !this.scoped() && !(this instanceof FlowControl)) return false; // In compile mode, we only care about scoped lines
		// Logic Blocks: Make sure I'm not a children of any block that is not currently activated
		if(!giac.compile_mode) {
			for(var el = this; el instanceof Element; el = el.parent) {
				if(el.parent instanceof LogicBlock) {
					for(var el2 = el; el2 instanceof Element; el2 = el2[L]) {
						if(el2 instanceof LogicCommand) break;
					}
					if(el2 instanceof LogicCommand) {
					 	if(el2.logicResult === false) { 
					 		if(this.allowOutput()) this.jQ.addClass(css_prefix + 'greyout'); 
					 		return false; 
					 	}
					} else 
						if(el.parent.logicResult === false) { 
							if(this.allowOutput()) this.jQ.addClass(css_prefix + 'greyout'); 
							return false; 
						}
				}
			}
		} else
			this.jQ.find('.' + css_prefix + 'greyout').removeClass(css_prefix + 'greyout');
		if(this.jQ && (typeof this.jQ.removeClass === 'function'))
			this.jQ.removeClass(css_prefix + 'greyout');
		return true;
	}
	// Check to see if I’m allowed to show output (a line that is in an if/else statement, for example, may not show output if the if/else statement took a different route)
	_.allowOutput = function() {
		for(var el = this; el instanceof Element; el = el.parent)
			if(el.suppress_output) return false;
		return true;
	}
	// Add the ‘thinking’ spinner to the start of this line (and remove it from other lines)
	_.addSpinner = function(eval_id) {
		if(this.allowOutput() && this.leftJQ) {
			this.leftJQ.find('i.fa-spinner').remove();
			if((typeof eval_id !== 'undefined') && giac.evaluations[eval_id] && giac.evaluations[eval_id].manual_evaluation)
				this.leftJQ.prepend('<i class="fa fa-spinner fa-pulse"></i>'); // Manual mode spinner should not be hidden
			else
				this.leftJQ.prepend('<i class="fa fa-spinner fa-pulse calculation_spinner"></i>');
		}
	}
	// Continue evaluation is called within an evaluation chain.  It will evaluate this node then move to evaluate the next node.
	// If overriden, it MUST call 'shouldBeEvaluated' to ensure scope is loaded and if/then/else is correctly handled.
	//_.startTime = 0;
	_.continueEvaluation = function(evaluation_id) {
		if(this.shouldBeEvaluated(evaluation_id)) {
			this.addSpinner(evaluation_id);
			if(this.hasChildren) {
				if(this.ends[L])
					this.ends[L].continueEvaluation(evaluation_id, true)
				else
					this.childrenEvaluated(evaluation_id);
			} else {
				if((this.commands.length === 0) || ($.map(this.commands, function(val) { return val.command; }).join('').trim() === '')) // Nothing to evaluate...
					this.evaluateNext(evaluation_id)
				else if(this.altered(evaluation_id)) {
					//this.startTime = new Date();
					// We were altered, so lets evaluate
					giac.execute(evaluation_id, this.commands, this, 'evaluationFinished');
				} else if(this.scoped()) {
					// Not altered, but we are scoped, so we need to save scope
					giac.skipExecute(evaluation_id, this, 'scopeSaved');
				} else
					this.evaluateNext(evaluation_id)
			}
		} else 
			this.evaluateNext(evaluation_id)
	}
	// Determine if this item has changed since we last evaluated it
	_.newCommands = function() {
		var equal = true;
		if(this.commands.length == this.previous_commands.length) {
			for(var i = 0; i < this.commands.length; i++) {
				if(this.commands[i].command != this.previous_commands[i]) {
					equal = false;
					break;
				}
			}
		} else
			equal = false;
		return !equal;
	}
	// Find the next element that should be evaluated after me
	_.nextEvaluateElement = function() {
		var next_id = this;
		while(true) {
			if(next_id[R] && !(next_id[R] instanceof LogicCommand)) { next_id = next_id[R]; break; }
			else if(next_id.parent) { next_id = next_id.parent; }
			else { next_id = false; break; }
		}
		return next_id;
	}
	//Find the element I should start evaluation at.
	// Journey up parents to the worksheet.  Evaluation is linear in the first generation children of worksheet.  Below that level,
	// Children blocks may have non-linear evaluation (such as 'for' loops, etc).  We need to find our ancestor who is a worksheet
	// first generation child, then start the evaluation process there and move inwards/downwards.  
  _.findStartElement = function() {
  	var programmatic = this.getProgrammaticFunction();
  	if(programmatic) return programmatic;
    var start_element = this;
    for(var el = start_element.parent; el instanceof Element; el = el.parent)
      if(el instanceof Loop) {
        el.altered_content = true; // Force evaluation of this loop
        start_element = el;
      }
    return start_element;
  }
	// Check for altered content or dependency on current list of altered variables: only evaluate if altered
	_.altered = function(evaluation_id) {
		if(this.altered_content || giac.check_altered(evaluation_id, this)) {
			this.altered_content = false;
			// Find next element to evaluate:
			var next_id = this.nextEvaluateElement();
			// Register the variable change with the next item (why not register now? in case we hijack this evaluation with another, we need to ensure the change gets loaded)
			if(!giac.compile_mode) {
				giac.add_altered(evaluation_id, this.previous_independent_vars, next_id ? next_id.id : -1);
				giac.add_altered(evaluation_id, this.independent_vars, next_id ? next_id.id : -1);
			}
      if(this.previous_independent_vars.length && (this.previous_independent_vars.length == this.independent_vars.length) && !this.worksheet.trackingStream) {
        // Check for change of name
        for(var i = 0; i < this.previous_independent_vars.length; i++) {
          if(this.previous_independent_vars[i].match(/[a-z0-9]__[a-z0-9]/i)) continue; //System variable, ignore
          if(this.previous_independent_vars[i].replace("(","") != this.independent_vars[i].replace("(","")) {
            // Note, this won't rename things above this line but that may be below the item in the calc tree (basically, things above it but in a loop)
            var next_el = this[R];
            if(!next_el && this.parent && !(this.parent instanceof programmatic_function)) next_el = this.parent[R];
            if(!(next_el && next_el.reliesOn(this.previous_independent_vars[i].replace("(","")))) continue; //No later lines rely on this variable, so just ignore the name change
            // Variable name change!
            if(this.worksheet.undoTimer) // Previous scheduled undo.  Do it now, as if we wait it will destroy the notice we are about to post.
              this.worksheet.setUndoPoint(this.worksheet.undoElement, this.worksheet.undoHash, true);
            // Stop auto-function during recomputation
            this.worksheet.suppress_autofunction = true;
            var start_name = this.previous_independent_vars[i];
            this.addNotice((this.previous_independent_vars[i].match(/\($/) ? "Function" : "Variable") + " renamed from <i>" + window.SwiftCalcsLatexHelper.VarNameToHTML(this.previous_independent_vars[i].replace("(","")) + "</i> to <i>" + window.SwiftCalcsLatexHelper.VarNameToHTML(this.independent_vars[i].replace("(","")) + "</i>.  Update dependent lines to refer to the new name?","name_change_" + i,[{name: "Yes", color: "green", func: function(start_name, end_name, i) { return function() {
              // Get current focus
              var el = this.worksheet.activeElement || this.worksheet.lastActive;
              var was_implicit = el ? el.implicit : false;
              el.implicit = false;
              if(el)
                var item = el.focusedItem || el.lastFocusedItem;
              else
                var item = false;
              // Stop auto-function during recomputation
              this.worksheet.suppress_autofunction = true;
              // Update all mathblocks
              this.focus(L);
              this.worksheet.startUndoStream();
              var next_el = this[R];
              if(!next_el && this.parent && !(this.parent instanceof programmatic_function)) next_el = this.parent[R];
              next_el.changeVarName(start_name, end_name);
              this.worksheet.setUndoPoint(this,{command: 'suppress_autofunction', val:true});
              this.worksheet.endUndoStream();
              // Restore focus
              if(item) item.focus();
              if(el) el.focus(); 
              if(was_implicit) el.implicit = true;
              // Remove message
              this.removeNotice("name_change_" + i);
            }}(this.previous_independent_vars[i].replace("(",""), this.independent_vars[i].replace("(",""), i)},{name: "No", color: "grey", func: function(i) { return function() {
              this.removeNotice("name_change_" + i);
            }}(i)}],false);
          }
        }
      }
			this.previous_independent_vars = this.independent_vars;
			this.previous_commands = [];
			for(var i = 0; i < this.commands.length; i++) 
				this.previous_commands.push(this.commands[i].command);
//this.jQ.css("background-color", "#00ff00").animate({ backgroundColor: "#FFFFFF"}, { duration: 1500, complete: function() { $(this).css('background-color','')} } );var date = new Date();
			return true;
		}
//this.jQ.css("background-color", "#ff0000").animate({ backgroundColor: "#FFFFFF"}, { duration: 1500, complete: function() { $(this).css('background-color','')} } );
		if(giac.compile_mode) return true; // In compile mode, we need to know the commands that are sent
		giac.remove_altered(evaluation_id, this.independent_vars);
		return false; 
	}
  _.reliesOn = function(varName) { // Test if this block or any following rely on this variable
  	var programmatic = this.getProgrammaticFunction();
  	if(programmatic && programmatic.function_vars[varName]) return false;
    if(this.dependent_vars.indexOf(varName) > -1) return true;
    if(this.independent_vars.indexOf(varName) > -1) return false;
    if(this.hasChildren && this.ends[L]) return this.ends[L].reliesOn(varName);
    if(this[R]) return this[R].reliesOn(varName);
    if(this.parent && !(this.parent instanceof programmatic_function) && this.parent[R]) return this.parent[R].reliesOn(varName);
    return false;
  }
  _.changeVarName = function(varName,newName) { // Rename variable in this block and all following blocks
  	var programmatic = this.getProgrammaticFunction();
  	if(!(programmatic && programmatic.function_vars[varName])) {
	    if(this.dependent_vars.indexOf(varName) > -1) {
	      // Rename variable inside all mathquill boxes
	      for(var i = 0; i < this.focusableItems.length; i++) {
	        for(var j = 0; j < this.focusableItems[i].length; j++) {
	          if((this.focusableItems[i][j] != -1) && this.focusableItems[i][j].mathquill) this.focusableItems[i][j].renameVariable(varName, newName);
	        }
	      }
	    } else if(this.independent_vars.indexOf(varName) > -1) return; // I define this variable, which means I should stop renaming from this point downwards
	  }
    if(this.hasChildren && this.ends[L]) return this.ends[L].changeVarName(varName,newName);
    if(this[R]) return this[R].changeVarName(varName,newName);
    if(this.parent && !(this.parent instanceof programmatic_function) && this.parent[R]) return this.parent[R].changeVarName(varName,newName);
    return;
  }
	//Return a list of all independent variables in this element and its children
	_.allIndependentVars = function() {
		var arr = this.independent_vars.concat(this.previous_independent_vars);
		if(this.hasChildren) {
			var kids = this.children();
			for(var i = 0; i < kids.length; i++)
				arr = arr.concat(kids[i].allIndependentVars());
		}
		return arr;
	}
	//Scoped elements set variables (as opposed to just performing evaluations)
	_.scoped = function() {
		return this.allIndependentVars().length > 0;
	}
	//Find offset from the top of the screen.
  _.topOffset = function() {
    var top_self = this.jQ.position().top;
    if(this.parent instanceof Element) return top_self + this.parent.topOffset();
    return top_self;
  }
	//_.overrideUnarchivedListForChildren = function() {
		// To be defined by parent elements that want to pass a special list to children.
		// Example: For loop (Add in iterator)
		// Example: Function (drop all vars and only show function vars)
		// Output is the new array to pass
	//}
	// Find the nearest previous element and return its unarchive list...this is what we should be loading if this element is the start of an evaluation chain in order to restore the environment at this point in the worksheet.
	_.previousUnarchivedList = function() {
		var el = this;
		if(el[L]) el = el[L];
		else {
			for(el = el.parent; el instanceof Element; el = el.parent) {
				if(el.overrideUnarchivedListForChildren) return el.overrideUnarchivedListForChildren();
				if(el[L]) { el = el[L]; break; }
			}
			if(!(el instanceof Element)) return [];
		}
		return el.getUnarchiveList();
	}
	// Override if this element should return a different archive list for some reason (function command, mostly)
	_.getUnarchiveList = function() {
		if(this.hasChildren && this.ends[R]) return this.ends[R].getUnarchiveList();
		if(this.unarchive_list_set) return this.unarchive_list;
		return this.previousUnarchivedList();
	}

	// Callback from giac when an evaluation has completed and results are returned
	_.evaluationCallback = function(evaluation_id, evaluation_callback, results) {
		//var endTime = new Date();
		//console.log(this.leftJQ.children('span').html() + " - Elapsed Time: " + (endTime - this.startTime)/1000);
		if(this.outputBox) this.outputBox.resetErrorWarning();
		if(this[evaluation_callback](results, evaluation_id)) 
			this.evaluateNext(evaluation_id);
	}

	// Callback function.  should return true if this is the end of the element evaluation, false if more evaluation is happening
	_.evaluationFinished = function(result) {
		return true;
	}

	// Evaluate the next element
	_.evaluateNext = function(evaluation_id) {
		if(giac.compile_mode) 
			giac.compile_callback[giac.compile_callback.length-1].register_vars(this.independent_vars, this.dependent_vars);
		this.leftJQ.find('i.fa-spinner').remove();
		this.unblurOutputBox();
		this.unarchive_list = this.previousUnarchivedList().slice(0);
		this.unarchive_list_set = true;
		if(this.independent_vars.length) this.unarchive_list.push([this.worksheet.id + "_" + this.id, this.independent_vars]); // Update my unarchive list
		this.setAutocomplete(this.unarchive_list);

		var move_to_next = !giac.stopEvaluation(evaluation_id,this.id); //Should we stop calculating at this point?
    var next_el = this.custom_R ? this.custom_R() : this[R];
		if(next_el && move_to_next) 
			next_el.continueEvaluation(evaluation_id)
		else if(this.parent instanceof Element)
			this.parent.childrenEvaluated(evaluation_id);
		else 
			giac.evaluationComplete(evaluation_id);
	}

	// Called by the last child node of this element after it is evaluated.  This node should move onwards to next nodes 
	_.childrenEvaluated = function(evaluation_id) {
		// We need to save the scope?
		if(this.scoped() && giac.shouldEvaluate(evaluation_id))
			giac.skipExecute(evaluation_id, this, 'scopeSaved');
		else
			this.evaluateNext(evaluation_id);
	}
	// Called on items that weren't evaluated, but had their value retrieved via unarchive.
	_.scopeSaved = function(result) {
		// Remove grey-out
		return true;
	}

	// Disable/Enable a line.  When disabled, it will be removed from the computation tree
	_.disable = function() {
		if(!this.allow_interaction()) return;
		if(this.disabled) return;
		var independent_vars = this.allIndependentVars();
		var do_eval = false;
		if(independent_vars.length) {
	    var target = this.nextEvaluateElement();
	    if(this.parent) {
	    	var eval_target = this.parent;
	    	this.parent.altered_content = true;
	    } else
	    	var eval_target = target;
	    if(target) do_eval = true;
	  }
	  this.blurOutputBox();
		this.unarchive_list = this.previousUnarchivedList().slice(0);
		this.unarchive_list_set = true;
		this.jQ.addClass(css_prefix + 'disabled');
		this.setAutocomplete(this.unarchive_list);
		this.disabled = true;
		if(do_eval) {
			this.worksheet.suppress_autofunction = true;
			var eval_id = this.worksheet.evaluate([], eval_target);
			giac.add_altered(eval_id, independent_vars, target.id); // Let evaluator know about all altered vars in move operation
    }
		this.worksheet.save();
		window.setTimeout(function(_this) { return function() { _this.blur(); } }(this),1);
	}
	_.enable = function() {
		if(!this.allow_interaction()) return;
		if(!this.disabled) return;
		this.jQ.removeClass(css_prefix + 'disabled');
		this.disabled = false;
		this.commandChildren(function(_this) { if(_this.evaluatable) { _this.altered_content = true; _this.previous_commands = []; } });
		this.evaluate(true);
		this.worksheet.save();
	}

	// Call all post insert handlers
	_.postInsert = function() {
		if(this.worksheet && this.worksheet.activeUndo) return this.preReinsertHandler();
		var current_children = this.children();
		this.postInsertHandler();
		$.each(current_children, function(i, child) {
			child.postInsert();
		});
		return this;
	}
	/* Event Handlers

	The actual bindings are taken care of at the worksheet level, but these functions get called if this element is the target.  These functions
	are already built out with support for clicking/dragging with math blocks inside elements.  If more nuanced control is needed, these should be overwritten

	Mouse events: these are handled directly by SwiftCalcs using listeners.  The functions here are called by the listerners directly:
	contextMenu should return 'false' if the function handled the event, otherwise true will let it bubble up (similar to how bound functions stop bubbling)
	mouseDown is called when the click starts, but should not be used as the action trigger (that is mouseup).  Instead it can be used to prepare the element for the drag
	mouseMove and mouseUp returns 'true' if we want to add this entire element to the 'selected' list
	mouseOut is called when a click/drag starts in this element, but then the end target moves outside of it.  Used to take care of internal 'selection' highlighting changes
	mouseClick gets called by mouseUp when the user clicks and releases within the same non-math portion of the element (aka just a click, not click/drag).  This is usually
		what is overwitten by an element to handle click events.
    mouseUpShift gets called when a mouseUp occurs while shift is being held down, and the mouseUp event occurs in the same element as the mouseDown event.  This element checks if the mouseUp and mouseDown are in the same focusable item, and if so passes control to that item.  Return true to highlight the whole element.
	*/
	_.contextMenu = function(e) {
		// See if the click is within a math field, and if so, pass the event to it
		var math_field = $(e.target).closest('span.' + css_prefix + 'math');
    if(math_field.length) 
    	return MathQuill(math_field[0]).contextMenu(e);
    else
			return true;
	}
	_.start_target = 0;
	_.mouseMove = function(e) {
		var math_field = $(e.target).closest('span.' + css_prefix + 'math');
		var answer_field = $(e.target).closest('div.answer');
		var focusable_field = $(e.target).closest('span.' + css_prefix + 'focusable');
    if(math_field.length) 
    	var new_target = MathQuill(math_field[0]);
    else if(answer_field.length) 
    	var new_target = MathQuill(answer_field[0]);
    else if(focusable_field.length) 
    	var new_target = aFocusableItem.byId[focusable_field.attr('data-focusable-id')*1];
    else
    	var new_target = -1;
    if(this.start_target === 0) 
    	this.start_target = new_target;
    // Are we clicking/dragging within the area?
    if((this.start_target == new_target) && (this.start_target === -1)) {
    	this.worksheet.selectionChanged(true);
    	return false; //We aren't really doing anything...
    } else if(this.start_target == new_target) {
    	this.start_target.mouseMove(e);
    	// Pass control to the mathField, since we are click/dragging within it
    	return false;
    } else { //We clicked in one area and dragged to another, just select the whole element
			if(this.focusedItem) this.focusedItem.mouseOut(e);
      this.worksheet.blurToolbar();
    	return true;
    }
	}
	_.mouseDown = function(e) {
		this.start_target = -1;
		var math_field = $(e.target).closest('span.' + css_prefix + 'math');
		var answer_field = $(e.target).closest('div.answer');
		var focusable_field = $(e.target).closest('span.' + css_prefix + 'focusable');
    if(math_field.length) {
    	this.start_target = MathQuill(math_field[0]);
    	this.start_target.mouseDown(e);
	  } else if(answer_field.length) {
    	this.start_target = MathQuill(answer_field[0]);
    	this.start_target.mouseDown(e);
	  } else if(focusable_field.length) {
    	this.start_target = aFocusableItem.byId[focusable_field.attr('data-focusable-id')*1];
    	this.start_target.mouseDown(e);
    }
	}
	_.mouseUp = function(e) {
		var math_field = $(e.target).closest('span.' + css_prefix + 'math');
		var answer_field = $(e.target).closest('div.answer');
		var focusable_field = $(e.target).closest('span.' + css_prefix + 'focusable');
    if(math_field.length) 
    	var new_target = MathQuill(math_field[0]);
    else if(answer_field.length) 
    	var new_target = MathQuill(answer_field[0]);
    else if(focusable_field.length) 
    	var new_target = aFocusableItem.byId[focusable_field.attr('data-focusable-id')*1];
    else
    	var new_target = -1;
    // Are we clicking/dragging within the area?
    if((this.start_target == new_target) && (this.start_target === -1)) 
    	return this.mouseClick(e); //We aren't really doing anything...
    else if(this.start_target == new_target) {
    	this.start_target.mouseUp(e);
    	this.start_target.focus();
    	if(math_field.length)
      	this.worksheet.unblurToolbar();
    	// Pass control to the mathField, since we are click/dragging within it
    	return false;
    } else  //We clicked in one area and dragged to another, just select the whole element
    	return true;
	}
	// Called when the mouse is clicked with shift held down.  If we are doing that in the same focusable item, pass selection to its handler.  Otherwise, return false (which causes block to be selected)
	_.mouseUpShift = function(e) {
		var math_field = $(e.target).closest('span.' + css_prefix + 'math');
		var answer_field = $(e.target).closest('div.answer');
		var focusable_field = $(e.target).closest('span.' + css_prefix + 'focusable');
    if(math_field.length) 
    	var new_target = MathQuill(math_field[0]);
    else if(answer_field.length) 
    	var new_target = MathQuill(answer_field[0]);
    else if(focusable_field.length) 
    	var new_target = aFocusableItem.byId[focusable_field.attr('data-focusable-id')*1];
    else
    	var new_target = -1;
    if((this.start_target == new_target) && (new_target !== -1) && (typeof new_target.mouseUpShift !== "undefined"))
    	return this.start_target.mouseUpShift(e);
    else 
    	return true; // highlight the whole element
	}
	_.mouseOut = function(e) {
		if(this.focusedItem) this.focusedItem.mouseOut(e);
  }
	_.mouseClick = function(e) {
		if((this.start_target === -1) && $(e.target).closest('div.' + css_prefix + 'collapse').length) 
			this.collapse();
		else if((this.start_target === -1) && $(e.target).closest('div.' + css_prefix + 'expand').length) 
			this.expand();
		else if((this.start_target === -1) && $(e.target).closest('div.' + css_prefix + 'disabled_icon').length) {
			if(this.disabled) this.enable()
			else this.disable();
		} else if(this.allow_interaction() && (this.start_target === -1) && $(e.target).closest('div.' + css_prefix + 'focusableItems').length) {
			var focusable = this.getFocusableByX($(e.target).closest('div.' + css_prefix + 'focusableItems').attr('data-id')*1, e.originalEvent.pageX);
			focusable.focus(e.originalEvent.pageX);
		}
		return false;
	}
	_.collapsed = false;
	_.collapse = function(immediately) {
		if(!this.hasChildren) return this;
		if(this.collapsed) return this;
		this.expandArrow();
		this.collapsed = true;
		var expand = $('<div class="' + css_prefix + 'expand" style="display:none;"><i class="fa fa-ellipsis-v"></i></div>');
		expand.insertAfter(this.insertJQ);
		if(immediately) {
			this.insertJQ.hide();
			expand.show();
			if(this.focusableItems[this.focusableItems.length - 1][0] && this.focusableItems[this.focusableItems.length - 1][0].toString && (this.focusableItems[this.focusableItems.length - 1][0].toString() == 'end'))
				this.focusableItems[this.focusableItems.length - 1][0].jQ.closest('.' + css_prefix + 'focusableItems').hide();
		} else {
			this.insertJQ.slideUp({duration: 500});
			expand.slideDown({duration: 500});
			if(this.focusableItems[this.focusableItems.length - 1][0] && this.focusableItems[this.focusableItems.length - 1][0].toString && (this.focusableItems[this.focusableItems.length - 1][0].toString() == 'end'))
				this.focusableItems[this.focusableItems.length - 1][0].jQ.closest('.' + css_prefix + 'focusableItems').slideUp({duration: 500});
		}
		if(!immediately) this.worksheet.save();
		return this;
	}
	_.expand = function(immediately) {
		if(!this.hasChildren) return this;
		if(!this.collapsed) return this;
		this.collapseArrow();
		this.collapsed = false;
		if(immediately) {
			this.insertJQ.show();
			this.insertJQ.next('.' + css_prefix + 'expand').remove();
			if(this.focusableItems[this.focusableItems.length - 1][0] && this.focusableItems[this.focusableItems.length - 1][0].toString && (this.focusableItems[this.focusableItems.length - 1][0].toString() == 'end'))
				this.focusableItems[this.focusableItems.length - 1][0].jQ.closest('.' + css_prefix + 'focusableItems').show();
		}	else {
			this.insertJQ.slideDown({duration: 500});
			this.insertJQ.next('.' + css_prefix + 'expand').slideUp({duration: 500, always: function() { $(this).remove(); } });
			if(this.focusableItems[this.focusableItems.length - 1][0] && this.focusableItems[this.focusableItems.length - 1][0].toString && (this.focusableItems[this.focusableItems.length - 1][0].toString() == 'end'))
				this.focusableItems[this.focusableItems.length - 1][0].jQ.closest('.' + css_prefix + 'focusableItems').slideDown({duration: 500});
		}
		this.reflow();
		if(!immediately) this.worksheet.save();
		return this;
	}
	_.collapseArrow = function() {
		this.leftJQ.find('div.' + css_prefix + 'expand').removeClass('show');
		this.leftJQ.find('div.' + css_prefix + 'collapse').addClass('show');
	}
	_.expandArrow = function() {
		this.leftJQ.find('div.' + css_prefix + 'expand').addClass('show');
		this.leftJQ.find('div.' + css_prefix + 'collapse').removeClass('show');
	}
	/* Keyboard events
  Keyboard events are handled by focusable items, but they report meta-events of interest to us (namely, attempt to move the cursor)
  up/left/down/right out of the focusable item (if up/down, x_location is passed).  We take these and then move accordingly
	*/
	// Will attempt to move to the next focusable item.  Returns false on failure (aka no next item to move to!) (if 'item' is 'false', it will move out of this element in the requested direction)
	_.moveOutUpDown = function(item, dir, x_location) {
		if(item) {
			for(var i = 0; i < this.focusableItems.length; i++) {
				for(var j = 0; j < this.focusableItems[i].length; j++)
					if(this.focusableItems[i][j] == item) break;
				if(this.focusableItems[i][j] == item) break;
			}
		} else {
			var i = dir === L ? 0 : (this.focusableItems.length - 1);
			var j = dir === L ? 0 : (this.focusableItems[i].length - 1);
		}
		if(((i == 0) && (dir == L)) || ((i == (this.focusableItems.length - 1)) && (dir == R))) {
			// we are moving out of this element (left or right), so go to the next guy
			if(this[dir]) return this[dir].moveInFrom(-dir, x_location);
			// At this point, we jump to parent and look for next focusable item. Is there a parent?
			if(this.depth === 0) {
				// No parent.  
				if((dir === R) && (!(this instanceof EditableBlock) || !this.empty())) {
					if(!this.parent.allow_interaction()) return false;
					var to_insert = (this.parent.implicitType) ? this.parent.implicitType() : math().setImplicit();
					to_insert.insertAfter(this).show(0).focus(L);
					return true;
				} else
					return false;
			}
			return this.parent.focus().moveOutUpDown(-1, dir, x_location);
		} 
		// Update i, j to point to the next focusable item
		i += dir;
		var next = this.getFocusableByX(i,x_location);
		if(next !== -1) {
			next.focus(x_location);
			return true;
		} else {
			//We reached the children, we need to jump in.  If there are no children, we add an implicit block
			this.expand();
			if(this.ends[-dir] && this.ends[-dir].moveInFrom(-dir, x_location)) 
				return true;
			else if((this.ends[-dir] === 0) && this.allow_interaction()) {
				var to_insert = (this.implicitType) ? this.implicitType() : math().setImplicit();
				to_insert.appendTo(this).show().focus();
				return true;
			}
		}
		return false;
	}
	_.moveOutLeftRight = function(item, dir) {
		if(item) {
			for(var i = 0; i < this.focusableItems.length; i++) {
				for(var j = 0; j < this.focusableItems[i].length; j++)
					if(this.focusableItems[i][j] == item) break;
				if(this.focusableItems[i][j] == item) break;
			}
		} else {
			var i = dir === L ? 0 : (this.focusableItems.length - 1);
			var j = dir === L ? 0 : (this.focusableItems[i].length - 1);
		}
		if(((i == 0) && (j == 0) && (dir == L)) || ((i == (this.focusableItems.length - 1)) && (j == (this.focusableItems[this.focusableItems.length - 1].length - 1)) && (dir == R))) {
			// we are moving out of this element (left or right), so go to the next guy
			if(this[dir]) return this[dir].moveInFrom(-dir);
			// At this point, we jump to parent and look for next focusable item. Is there a parent?
			if(this.depth === 0) {
				// No parent.  
				if((dir === R) && (!(this instanceof EditableBlock) || !this.empty())) {
					if(!this.parent.allow_interaction()) return false;
					var to_insert = (this.parent.implicitType) ? this.parent.implicitType() : math().setImplicit();
					to_insert.insertAfter(this).show(0).focus(L);
					return true;
				} else
					return false;
			}
			return this.parent.focus().moveOutLeftRight(-1, dir);
		} 
		// Update i, j to point to the next focusable item
		if(((dir === L) && (j == 0)) || ((dir === R) && (j == (this.focusableItems[i].length-1)))) {
			i += dir;
			j = dir === L ? this.focusableItems[i].length-1 : 0;
		} else
			j += dir;
		if(this.focusableItems[i][j] !== -1) {
			this.focusableItems[i][j].focus(-dir);
			return true;
		} else {
			//We reached the children, we need to jump in.  If there are no children, we add an implicit block //BRENTAN: Check at some point to override what is the 'implicit' block for each type?
			this.expand();
			if(this.ends[-dir] && this.ends[-dir].moveInFrom(-dir)) 
				return true;
			else if((this.ends[-dir] === 0) && this.allow_interaction()) {
				var to_insert = (this.implicitType) ? this.implicitType() : math().setImplicit();
				to_insert.appendTo(this).show().focus();
				return true;
			}
		}
		return false;
	}
	// Will attempt to move into this element from another from the passed direction.  If x_location is passed, assume we are coming from Up/Down and need to place cursor based on this location
	_.moveInFrom = function(dir, x_location) {
		if((this.focusableItems.length == 0) || !this.allow_interaction()) //nothing to focus on, jump past me
			return (x_location ? this.moveOutUpDown(undefined, -dir, x_location) : this.moveOutLeftRight(undefined, -dir));
		this.focus(dir);
		// BRENTAN: BELOW SHOULD BE IN FOCUS IF/WHEN dir/x_location is set?
		if(this.hasChildren) this.expand();
		if(x_location) {
			// up/down entry
			var next = this.getFocusableByX(dir === L ? 0 : (this.focusableItems.length-1), x_location);
		} else if(dir === L) {
			// left entry
			var next = this.focusableItems[0][0];
		} else {
			// right entry
			var next = this.focusableItems[this.focusableItems.length - 1][this.focusableItems[this.focusableItems.length - 1].length - 1];
		}
		if(next === -1) {
			if(this.ends[dir] && this.ends[dir].moveInFrom(dir, x_location)) return true;
			else if(this.ends[dir] === 0) {
				var to_insert = (this.implicitType) ? this.implicitType() : math().setImplicit();
				to_insert.appendTo(this).show().focus();
				return true;
			}
			return false;
		}
		else
			next.focus(x_location ? x_location : dir, dir);
		return true;
	}
	_.getFocusableByX = function(i,x_location) {
		// Find the focusable item in row i by the x_location provided
		for(var j = 0; j < (this.focusableItems[i].length-1); j++) {
			if(this.focusableItems[i][j] === -1) return this.focusableItems[i][j];
			var midway = this.focusableItems[i][j].jQ.offset().left + this.focusableItems[i][j].jQ.width();
			midway = midway + (this.focusableItems[i][j+1].jQ.offset().left - midway)/2;
			if(x_location < midway) return this.focusableItems[i][j];
		}
		return this.focusableItems[i][j];
	}
	// Returns true if the item is 'empty', which means all focusableItems are clear and all children are empty as well
	_.empty = function() {
		for(var i = 0; i < this.focusableItems.length; i++) {
			for(var j = 0; j < this.focusableItems[i].length; j++) {
				if(this.focusableItems[i][j] === -1) continue;
	  		if((this.focusableItems[i][j] instanceof CommandBlock) && !this.focusableItems[i][j].editable) continue;
				if(!this.focusableItems[i][j].empty()) return false;
			}
		}
		if(this.hasChildren) {
			var kids = this.children();
			for(var i = 0; i < kids.length; i++)
				if(!kids[i].empty()) return false;
		}
		return true;
	}
	/*
	 Focus and Blur
	 The 'focusedItem' should contain the object currently in focus (if any).  That object should
	 also accept a 'focus', 'blur', 'windowBlur', and 'inFocus' method call.
	 */
	_.focusedItem = 0; 
	_.focus = function(dir) {
		if(!this.inTree) return this;
		if(!this.blurred) return this;
		this.lastFocusedItem = false;
		this.worksheet.blurToolbar(this);
		if(this.worksheet.activeElement)
			this.worksheet.activeElement.blur(this);
		this.blurred = false;
    this.worksheet.focus();
		this.worksheet.activeElement = this;
		if(this.leftJQ) this.leftJQ.addClass(css_prefix + 'focused');
		if(this.jQ) this.jQ.addClass(css_prefix + 'focused');
		if(dir === 0) { // default '0' focus is to look for first mathquill item in first row.  
			for(var i = 0; i < this.focusableItems[0].length; i++) {
				if((this.focusableItems[0][i] != -1) && this.focusableItems[0][i].mathquill) {
					this.focusableItems[0][i].focus(L);
					break;
				}
			}
		} else if(dir === L) {
			var to_focus = this.focusableItems[0][0];
			if(to_focus == -1) 
				if(this.ends[L]) this.ends[L].focus(L);
			else
				to_focus.focus(L);
		} else if(dir === R) {
			var to_focus = this.focusableItems[this.focusableItems.length-1][this.focusableItems[this.focusableItems.length - 1].length - 1];
			if(to_focus == -1)
				if(this.ends[R]) this.ends[R].focus(R);
			else
				to_focus.focus(R);
		} else if(!dir && this.focusedItem)
			this.focusedItem.focus();
		return this;
	}
	_.blur = function(to_focus) {
    this.worksheet.blurToolbar(this);
		if(this.worksheet.activeElement == this) { this.worksheet.lastActive = this; this.worksheet.activeElement = 0; }
		if(this.blurred) return this;
		this.blurred = true;
		SwiftCalcs.destroyTooltip();
  	if(this.focusedItem) {
  		this.lastFocusedItem = this.focusedItem;
  		this.focusedItem.blur();
  	}
		if(this.leftJQ) this.leftJQ.removeClass(css_prefix + 'focused');
		if(this.jQ) this.jQ.removeClass(css_prefix + 'focused');
		return this;
	}
	_.windowBlur = function() {
    this.worksheet.blurToolbar(this);
		this.blurred = true;
  	if(this.focusedItem) this.focusedItem.windowBlur();
		if(this.leftJQ) this.leftJQ.removeClass(css_prefix + 'focused');
		if(this.jQ) this.jQ.removeClass(css_prefix + 'focused');
		return this;
	}
	_.inFocus = function() { return !this.blurred; };
	// DO NOT call focus/blur on the items in the next 2 methods.
	// It's assumed the 'focus/blur' method of the object called this, so a circular loop will result if you call focus/blur here
	_.setFocusedItem = function(ob) {
		if(this.focusedItem && (this.focusedItem !== ob)) this.focusedItem.blur();
		this.focusedItem = ob;
	}
	_.clearFocusedItem = function(ob) {
		if(this.focusedItem === ob) this.focusedItem = 0;  
	}
	// Autocomplete helpers.  Overwrite if the autocomplete in this element should not populate
	_.setAutocomplete = function(list) {
		// list is assumed to have same format as unarchived_list
		this.autocomplete_list = {};
		for(var i = 0; i < list.length; i++) {
			for(var j = 0; j < list[i][1].length; j++)
				if(list[i][1][j].indexOf("__") == -1) this.autocomplete_list[list[i][1][j]] = list[i][0].replace(/^.*_([0-9]+)$/,"$1")*1;
		}
	}
	_.autocomplete = function() {
		var var_list = Object.keys(this.autocomplete_list);
		if(giac && giac.object_names) {
			for(var i = 0; i < giac.object_names.length; i++) 
				if(this.autocomplete_list[giac.object_names[i]]) var_list.push(giac.object_names[i] + ":");
		}
		return var_list;
	}
	_.autocompleteObject = function(name) {
		return giac.object_methods[name];
	}
  _.getLastResult = function(varname) {
    if(this.last_result && this.last_result[0] && this.last_result[0].success) return this.last_result[0].returned;
    return false;
  }
  _.varHelp = function(varname) {
    if(this.ignored_vars[varname]) return false;
    var defining_el = this.autocomplete_list[varname];
    if(!defining_el) defining_el = this.autocomplete_list[varname + "("];
    if(!defining_el) defining_el = this.worksheet.object_list[varname];
    if(defining_el) defining_el = Element.byId[defining_el];
    return defining_el ? defining_el : false;
  }
	/* 
	 Keyboard events.  Will forward the event to whatever item is focusable.  The focusable item should respond to:
	 If cut/copy handles the cut/copy directly, and should set worksheet.clipboard to the appropriate value and return true,
	 or return false and let the browser handle it after bubbling up
	 keystroke (description, event)
	 typedText (text)
	 cut (event)
	 copy (event)
	 paste (text)
	 */
  _.keystroke = function(description, evt) { 
  	if(this.focusedItem) this.focusedItem.keystroke(description, evt);
  }
  _.typedText = function(text) { 
  	if(this.focusedItem) this.focusedItem.typedText(text);
 	}
  _.cut = function(e) { 
  	if(this.focusedItem) this.focusedItem.cut(e);
  	return true;
  }
  _.copy = function(e) { 
  	if(this.focusedItem) this.focusedItem.copy(e);
  	return true;
  }
  _.paste = function(text) { 
  	if(this.focusedItem) this.focusedItem.paste(text);
  	return this;
  }
  _.write = function(text) { // Like paste, but no blurring afterwards
  	if(this.focusedItem) this.focusedItem.write(text);
  	return this;
  }
	_.AppendText = function() {
		if(this.hasChildren)
			text().prependTo(this).show().focus(L);
		else
			text().insertAfter(this).show().focus(L);
	}
  /*
   parse and toString are NEAR opposite methods.  toString will convert the element into a 
   string that is parse-able by the global 'parse' function (global within the SC scope).
   It uses the 'argumentList' helper method, which is the exact opposite of parse.  argumentList produces
   an array of arguments, that when passed to the 'parse' method of a blank element of the same type,
   identically reproduces the element.  Used for copy/pasting, among other things.
   Both parse and argumentList also utilize a helper property 'savedProperties', which is an array of property names that
   should also be saved and parsed with the element
   */
  // Parse must return itself as it is chained
  _.parse = function(args) {
  	if(this.jQ === 0) {
  		// Not attached yet.  delay the parse until we are attached
  		this.toParse = args;
  		return this;
  	}
  	if(!args.length) return this;
  	if(this.hasChildren || this.savedProperties.length || this.evaluatable || (this instanceof MathOutput)) {
  		this.parseSavedProperties(args[0]);
	  	var k = 1;
	  } else
	  	var k = 0;
  	var count = 0;
  	var start_index = ((this instanceof SettableMathOutput) && !this.var_field_value) ? 1 : 0; // Ignore varStoreField for SettableMathOutput, if not stored.
  	for(var i = 0; i < this.focusableItems.length; i++) {
  		for(var j = start_index; j < this.focusableItems[i].length; j++) {
	  		if((this.focusableItems[i][j] instanceof CommandBlock) && !this.focusableItems[i][j].editable) continue; //Ignore command blocks, those are created with the block and have no saveable options
	  		if(this.focusableItems[i][j] === -1) {
	  			// We are at the children.  We simply parse this and the resultant blocks become my children
	  			var blocks = parse(args[count + k]);
	  			for(var j=0; j < blocks.length; j++)
	  				blocks[j].appendTo(this).show(0);
	  		} else {
          if(this.focusableItems[i][j].suppressAutoCommands) this.focusableItems[i][j].suppressAutoCommands(true);
	  			this.focusableItems[i][j].clear().paste(args[count + k]);
        }
	  		count++;
	  	}
	  	start_index = 0;
  	}
  	return this;
  }
  // Parse the portion of the parse expression dealing with saved properties
  _.parseSavedProperties = function(args) {
		var arg_list = args.split(',');
  	for(var j = 0; j < arg_list.length; j++) {
  		var name = arg_list[j].replace(/^[\s]*([a-zA-Z0-9_]+)[\s]*:(.*)$/,"$1");
  		if(name == "scoped") name = "var_field_value"; // Backwards compatibility: used to be a parameter called scoped
  		var val = arg_list[j].replace(/^[\s]*([a-zA-Z0-9_]+)[\s]*:(.*)$/,"$2").trim();
  		if(val.match(/^[+-]?(?:\d*\.)?\d+$/)) val = 1.0 * val;
  		if(val === "false") val = false;
  		if(val === "true") val = true;
      if(name == 'skipAutoUnit') {
        var units = val.split('|');
        for(var i = 0; i < units.length; i++)
          this.skipAutoUnit[units[i]] = true;
      } else
  		  this[name] = val;
  	}
  	return this;
  }
  _.argumentList = function() {
  	var output = [];
  	var arg_list = this.hasChildren ? ['collapsed: ' + this.collapsed] : [];
  	for(var k = 0; k < this.savedProperties.length; k++) 
  		arg_list.push(this.savedProperties[k] + ": " + this[this.savedProperties[k]]);
  	if(this instanceof MathOutput) {
  		arg_list.push('expectedUnits: ' + this.expectedUnits);
      arg_list.push('approx: ' + this.approx);
  		arg_list.push('factor_expand: ' + this.factor_expand);
  		arg_list.push('outputMode: ' + this.outputMode);
  		arg_list.push('approx_set: ' + this.approx_set);
  		arg_list.push('digits: ' + this.digits);
      arg_list.push('skipAutoUnit: ' + Object.keys(this.skipAutoUnit).join("|"));
  	}
  	if(this instanceof SettableMathOutput) 
  		arg_list.push('var_field_value: ' + this.var_field_value);
  	if(this.evaluatable) arg_list.push('disabled: ' + this.disabled);
  	if(arg_list.length)
  		output.push(arg_list.join(', '));
  	var start_index = ((this instanceof SettableMathOutput) && !this.var_field_value) ? 1 : 0; // Ignore varStoreField for SettableMathOutput, if not scoped, to simplify item in storage
  	for(var i = 0; i < this.focusableItems.length; i++) {
  		for(var j = start_index; j < this.focusableItems[i].length; j++) {
	  		if((this.focusableItems[i][j] instanceof CommandBlock) && !this.focusableItems[i][j].editable) continue; //Ignore command blocks, those are created with the block and have no saveable options
	  		if(this.focusableItems[i][j] === -1) {
	  			//We need to zip up the children
	  			var child_string = '';
	  			jQuery.each(this.children(), function(n, child) {
						if(child.implicit || child.no_save) return;
	  				child_string += child.toString();
	  			});
	  			output.push(child_string);
	  		} else
	  			output.push(this.focusableItems[i][j].toString());
	  	}
	  	start_index = 0;
  	}
  	return output;
  }
  _.toString = function() {
  	throw("toString called on 'Element' type.  Element is an abtract class that should never be initialized on its own.  Only classes that extend this should ever be created.");
  }

  // Can I interact with this element?
  _.allow_interaction = function() {
  	if(this.worksheet.need_paid_plan) return false;
  	return this.interaction_level <= INTERACTION_LEVEL;
  }

	// Debug.  Print entire worksheet tree
	_.printTree = function() {
		var out = '<li>' + this.id;
		if(this.children().length > 0) {
			out += '<ul>';
			$.each(this.children(), function(i, child) {
				out += child.printTree();
			});
			out += '</ul>';
		} 
		return out + '</li>';
	}
});

// EditableBlock is a special element that means we dont need to add implicit math blocks before/after it when traversing with the keyboard or mouse hovering near its top/bottom
// By definition they only have 1 focusable item.  
var EditableBlock = P(Element, function(_, super_) {
	_.init = function() {
		super_.init.call(this);
	}
});

// Logic Blocks are special blocks: They may not evaluate all their children, based on some test criteria.  
// A logic Block will have a 'logicResult' property, that defines whether children should be evaluated up to the first
// child of type LogicCommand.  LogicCommand has a property 'logicResult' that defines whether its following siblings
// should be evaluated, up to the next LogicCommand, and so on.
// LogicBlock is responsible for setting its logicResult property, and the property of all of its child LogicCommands, 
// before the children are executed.
var FlowControl = P(Element, function(_, super_) {
	_.init = function() {
		super_.init.call(this);
	}
});
var LogicBlock = P(FlowControl, function(_, super_) {
	_.logicResult = false;
	_.init = function() {
		super_.init.call(this);
	}
});
var LogicCommand = P(FlowControl, function(_, super_) {
	_.klass = ['logic_command'];
	_.logicResult = false;
	_.init = function() {
		super_.init.call(this);
	}
});
// Loops are things like for loops or while loops that use flow control statements such as 'continue' or 'break'
var Loop = P(FlowControl, function(_, super_) {
	_.init = function() {
		super_.init.call(this);
	}
});
SwiftCalcs.elementById = function(id) {
	return Element.byId[id];
}