
/*
Element is the basic class that defines any block in the workspace.  Blocks can contain other blocks.  Basic navigation:
[L]: left/up sibling block
[R]: right/down sibling block
parent: enclosing block or workspace
workspace: workspace to which this block belongs
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
  _.workspace = 0;
  _.parent = 0;
  _.jQ = 0;
  _.hidden = true;
	_.error = false;
	_.warn = false;
	_.klass = [];
	_.depth = 0;
	_.blurred = true;
	_.toParse = false;
	_.lineNumber = false;
	_.hasChildren = false; // Doesn't imply there are children elements, implies children elements are allowed

	//Give each element a unique ID, this is just for tracking purposes
  var id = 0;
  function uniqueNodeId() { return id += 1; }
  this.byId = {};

	_.init = function() {
    this.id = uniqueNodeId();
    Element.byId[this.id] = this;

		this.ends = {};
		this.ends[R] = 0;
		this.ends[L] = 0;

		/* Focusable items is used for item traversal when using keyboard arrows to move around.  It is assumed all
		 * focusable items will issue a callback when the cursor tries to move out of them up/down/left/right, and when this
		 * is done, we look here first to determine where to go next.  A value of '-1' indicates a placeholder for children,
		 * so if/when this is reached, the cursor will move into the child elements (if any).  When the beginning/end of the
		 * array is reached, we jump to the next neighbor focusable item, or traverse up the tree
		 */
		this.focusableItems = [];
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
		this.jQ = $('<div style="display:none;" ' + css_prefix + 'element_id=' + this.id + ' class="' + css_prefix + 'element '
			+ jQuery.map(this.klass, function(k) { return (css_prefix + k) }).join(' ') + '">'
			+ '<table class="' + css_prefix + 'element_table"><tbody><tr><td class="' + css_prefix + 'element_td"></td><td class="' + css_prefix + 'element_insert_td">'
			+ this.innerHtml() + '</td></tr></tbody></table></div>');
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
		if(this.toParse) {
			this.parse(this.toParse);
			this.toParse = false;
		}
		return this;
	}
	// Allow blocks to define handlers to run before being destroyed.
	_.preRemoveHandler = function() {
		jQuery.each(this.children(), function(i, child) {
			child.preRemoveHandler();
		});
		return this;
	}

	/* 
	Insert methods

	These should all be self explanatory.  All operate with this being the object being inserted, so it will
	be placed next to/into/in place of the provided target
	*/
	_.insertNextTo = function(sibling, location) {
		this.parent = sibling.parent;
		this.updateWorkspace(this.parent.getWorkspace());
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
		return this;
	}
	_.insertAfter = function(sibling) {
		return this.insertNextTo(sibling, R);
	}
	_.insertBefore = function(sibling) {
		return this.insertNextTo(sibling, L);
	}
	_.insertInto = function(parent, location) {
		this.parent = parent;
		this.updateWorkspace(parent.getWorkspace());
		this[-location] = parent.ends[location];
		parent.ends[location] = this;
		if(parent.ends[-location] === 0) parent.ends[-location] = this;
		if(this[-location] !== 0) this[-location][location] = this;
		if(parent.jQ) {
			this.regenerateHtml();
			if(location == L)
				this.jQ.prependTo(parent.insertJQ);
			else
				this.jQ.appendTo(parent.insertJQ);
			this.postInsert();
		}
		this.setDepth();
		return this;
	}
	_.prependTo = function(parent) {
		return this.insertInto(parent, L);
	}
	_.appendTo = function(parent) {
		return this.insertInto(parent, R);
	}
	_.replace = function(replaced) {
		this.insertAfter(replaced);
		replaced.remove();
		return this;
	}
	// Update the workspace of this block and all children
	_.updateWorkspace = function(workspace) {
		this.workspace = workspace;
		jQuery.each(this.children(), function(i, child) {
			child.updateWorkspace(workspace);
		});
		return this;
	}
	// Update the line numbers on this block and all children
	_.numberBlock = function(start) {
		if(this.lineNumber) {
			this.leftJQ.html(start);
			start++;
		} else this.leftJQ.html('');
		jQuery.each(this.children(), function(i, child) {
			start = child.numberBlock(start);
		});
		return start;
	}

	/*
	Move commands.  Allows them to be moved upwards, downwards, etc.
	The move command takes care of all the move related stuff, including removing the old element and reinserting at the correct
	new location.  Note that it takes a target to insert before or after, and a direction.  insertInto should be set to true to insert into 
	an element at the end based on dir
	*/
	_.move = function(target, location, insertInto) {
		// First, basically remove this item from the tree
		if(this[L] !== 0) 
			this[L][R] = this[R];
		else
			this.parent.ends[L] = this[R];
		if(this[R] !== 0) 
			this[R][L] = this[L];
		else
			this.parent.ends[R] = this[L];
		this[R] = 0;
		this[L] = 0;
		// Next, insert me into/next to my target
		if(insertInto === false) {
			this.parent = target.parent;
			this.updateWorkspace(this.parent.getWorkspace());
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
			//if(location === L)
			//	this.scheduleFirstGenAncestor(); // BRENTAN- evaluation update
			//else
			//	this[L].scheduleFirstGenAncestor(); // BRENTAN- evaluation update
		} else {
			this.parent = target;
			this.updateWorkspace(target.getWorkspace());
			this[-location] = target.ends[location];
			target.ends[location] = this;
			if(target.ends[-location] === 0) target.ends[-location] = this;
			if(this[-location] !== 0) this[-location][location] = this;
			if(location == L)
				this.jQ.detach().prependTo(target.insertJQ);
			else
				this.jQ.detach().appendTo(target.insertJQ);
			//this.scheduleFirstGenAncestor(); // BRENTAN- evaluation update
		}
		this.setDepth();
		return this;
	}
	/* Destroy methods.
	Detach simply writes this elements jQ as a 0.  It assumes it has already been 
	removed from the DOM elsewhere, likely when a parent had its jQ removed.  It propagates
	to all children, and is used when a workspace is unbound but kept in memory.

	The remove method is the clean destroy.  Before calling destroy, it will
	navigate the tree to update points to this object to correctly point around it
	and patch the tree.  It will also detach elements from the DOM and call any
	pre-descruction handlers.  After this is run, there should no longer be any pointers
	to this object, so it should be garbage collected.
	*/
	_.detach = function() {
		this.jQ = 0;
		$.each(this.children(), function(i, child) { child.detach(); });
		return this;
	}
	_.remove = function(duration) {
		duration = typeof duration === 'undefined' ? 200 : duration;
		this.preRemoveHandler();
		if(this[L] !== 0) 
			this[L][R] = this[R];
		else
			this.parent.ends[L] = this[R];
		if(this[R] !== 0) 
			this[R][L] = this[L];
		else
			this.parent.ends[R] = this[L];
		if(this.jQ !== 0) {
			if(this.hidden || (duration == 0)) {
				this.jQ.remove();
			} else 
				this.jQ.slideUp({duration: duration, always: function() { $(this).remove(); }});
		}
		if((this[L] instanceof text) && (this[R] instanceof text) && !this[L].mark_for_deletion && !this[R].mark_for_deletion) {
			// If we delete something between text nodes, we should merge those nodes
			this[R].merge();
		}
		this.detach();
		this.workspace.renumber();
		return this;
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
		else 
			this.jQ.css('display', '');
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
		for(var ac = this.ends[L]; ac !== 0; ac = ac[R])
			out.push(ac);
		return out;
	}
	_.firstGenAncestor = function() {
		for(var w = this; !(w.parent instanceof Workspace); w = w.parent) {}
		return w;
	}
	_.setDepth = function() {
		this.depth = 0;
		for(var w = this; !(w.parent instanceof Workspace); w = w.parent) { this.depth++; }
		jQuery.each(this.children(), function(i, child) {
			child.setDepth();
		});
		this.workspace.renumber();
		return this;
	}
	// return current workspace
	_.getWorkspace = function() {
		return this.workspace;
	}	

	// Update success level of this block.  Clear resets the block, complete is a good evaluation, warn is a non-fatal, error is fatal
	_.clearState = function() {
		this.error = false;
		this.warn = false;
		return this;
	}
	_.setComplete = function() {
		this.error = false;
		this.warn = false;
		return this;
	}
	_.setWarning = function(message) {
		this.warn = message;
		return this;
	}
	_.setError = function(message) {
		this.error = message;
		return this;
	}

	/*
	Evaluation functions. 
	*/
	_.evaluate = function() {
		return this;
	}
	// Journey up parents to the workspace.  Evaluation is linear in the first generation children of workspace.  Below that level,
	// Children blocks may have non-linear evaluation (such as 'for' loops, etc).  We need to find our ancestor who is a workspace
	// first generation child, then start the evaluation process there and move inwards/downwards.  
	// Bring/remove cursor focus to/from the block, if possible
	// Call all post insert handlers
	_.postInsert = function() {
		this.postInsertHandler();
		$.each(this.children(), function(i, child) {
			child.postInsert();
		});
		return this;
	}
	/* Event Handlers

	The actual bindings are taken care of at the workspace level, but these functions get called if this element is the target.  These functions
	are already built out with support for clicking/dragging with math blocks inside elements.  If more nuanced control is needed, these should be overwritten

	Mouse events: these are handled directly by SwiftCalcs using listeners.  The functions here are called by the listerners directly:
	contextMenu should return 'false' if the function handled the event, otherwise true will let it bubble up (similar to how bound functions stop bubbling)
	mouseDown is called when the click starts, but should not be used as the action trigger (that is mouseup).  Instead it can be used to prepare the element for the drag
	mouseMove and mouseUp returns 'true' if we want to add this entire element to the 'selected' list
	mouseOut is called when a click/drag starts in this element, but then the end target moves outside of it.  Used to take care of internal 'selection' highlighting changes
	mouseClick gets called by mouseUp when the user clicks and releases within the same non-math portion of the element (aka just a click, not click/drag).  This is usually
		what is overwitten by an element to handle click events.
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
    if(math_field.length) 
    	var new_target = MathQuill(math_field[0]);
    else
    	var new_target = -1;
    if(this.start_target === 0) 
    	this.start_target = new_target;
    // Are we clicking/dragging within the area?
    if((this.start_target == new_target) && (this.start_target === -1)) {
    	this.workspace.selectionChanged(true);
    	return false; //We aren't really doing anything...
    } else if(this.start_target == new_target) {
    	this.start_target.mouseMove(e);
    	// Pass control to the mathField, since we are click/dragging within it
    	return false;
    } else { //We clicked in one area and dragged to another, just select the whole element
			if(this.focusedItem) this.focusedItem.mouseOut(e);
      this.workspace.blurToolbar();
    	return true;
    }
	}
	_.mouseDown = function(e) {
		this.start_target = -1;
		var math_field = $(e.target).closest('span.' + css_prefix + 'math');
    if(math_field.length) {
    	this.start_target = MathQuill(math_field[0]);
    	this.start_target.mouseDown(e);
	  }
	}
	_.mouseUp = function(e) {
		var math_field = $(e.target).closest('span.' + css_prefix + 'math');
    if(math_field.length) 
    	var new_target = MathQuill(math_field[0]);
    else
    	var new_target = -1;
    // Are we clicking/dragging within the area?
    if((this.start_target == new_target) && (this.start_target === -1)) 
    	return this.mouseClick(e); //We aren't really doing anything...
    else if(this.start_target == new_target) {
    	this.start_target.mouseUp(e);
    	this.start_target.focus();
      this.workspace.unblurToolbar();
    	// Pass control to the mathField, since we are click/dragging within it
    	return false;
    } else  //We clicked in one area and dragged to another, just select the whole element
    	return true;
	}
	_.mouseOut = function(e) {
		if(this.focusedItem) this.focusedItem.mouseOut(e);
	}
	_.mouseClick = function(e) {
		return false;
	}
	/* Keyboard events
  Keyboard events are handled by focusable items, but they report meta-events of interest to us (namely, attempt to move the cursor)
  up/left/down/right out of the focusable item.  We take these and then move accordingly
	*/
	// Will attempt to move to the next focusable item.  Returns false on failure (aka no next item to move to!) (if 'item' is 'false', it will move out of this element in the requested direction)
	_.moveOut = function(item, dir, x_location) {
		if(item) {
			for(var i = 0; i < this.focusableItems.length; i++) 
				if(this.focusableItems[i] == item) break;
		} else
			var i = dir === L ? 0 : (this.focusableItems.length - 1);
		if(((i == 0) && (dir == L)) || ((i == (this.focusableItems.length - 1)) && (dir == R))) {
			// we are moving out of this element (up/left or down/right), so go to the next guy
			if(this[dir]) {
				// we must add an implicit math block if either me or the target isnt editable
				if((this instanceof EditableBlock) || (this[dir] instanceof EditableBlock))
					return this[dir].moveInFrom(-dir, x_location);
				else {
					math().insertNextTo(this,dir).show().focus().setImplicit();
					return true;
				}
			}
			// Since there is no next guy, lets see if we need to throw in an implicit math block
			if(!(this instanceof EditableBlock)) {
				math().insertNextTo(this,dir).show().focus().setImplicit();
				return true;
			}
			// At this point, we jump to parent and look for next focusable item. Is there a parent?
			if(this.depth === 0) return false;
			return this.parent.moveOut(-1, dir);
		} else if(this.focusableItems[i + dir] !== -1) {
			this.focusableItems[i + dir].focus(x_location ? x_location : -dir);
			return true;
		} else {
			//We reached the children, we need to jump in.  If there are no children, we add an implicit block //BRENTAN: Check at some point to override what is the 'implicit' block for each type?
			if(this.ends[dir] && this.ends[dir].moveInFrom(dir, x_location)) return true;
			else if(this.ends[dir] === 0) {
				math().appendTo(this).show().focus().setImplicit();
				return true;
			}
		}
		return false;
	}
	// Will attempt to move into this element from another from the passed direction
	_.moveInFrom = function(dir, x_location) {
		if(this.focusableItems.length == 0) //nothing to focus on, jump past me
			return this.moveOut(undefined, -dir);
		this.focus(dir);
		if(this.focusableItems[dir == R ? (this.focusableItems.length-1) : 0] === -1) {
			if(this.ends[dir] && this.ends[dir].moveInFrom(dir)) return true;
			else if(this.ends[dir] === 0) {
				math().appendTo(this).show().focus().setImplicit();
				return true;
			}
			return false;
		}
		else
			this.focusableItems[dir == R ? (this.focusableItems.length-1) : 0].focus(x_location ? x_location : dir, dir);
		return true;
	}
	/*
	 Focus and Blur
	 The 'focusedItem' should contain the object currently in focus (if any).  That object should
	 also accept a 'focus', 'blur', 'windowBlur', and 'inFocus' method call.
	 */
	_.focusedItem = 0; 
	_.focus = function(dir) {
		if(!this.blurred) return this;
		this.workspace.focus();
		this.workspace.detachToolbar();
		if(this.workspace.activeElement)
			this.workspace.activeElement.blur();
		this.blurred = false;
		this.workspace.activeElement = this;
		this.leftJQ.addClass(css_prefix + 'focused');
		// Check if we are in view, and if not, scroll:
		if(this instanceof text) 
			return this;
		else
			return this.scrollToMe(dir);
	}
	_.scrollToMe = function(dir) {
		console.log(this);
		var top = this.jQ.position().top;
		var bottom = top + this.jQ.height();
		var to_move_top = Math.min(0, top);
		var to_move_bot = Math.max(0, bottom - this.workspace.jQ.height()+20);
		if(dir === R)
			this.workspace.jQ.scrollTop(this.workspace.jQ.scrollTop() + to_move_bot);
		else if(dir === L)
			this.workspace.jQ.scrollTop(this.workspace.jQ.scrollTop() + to_move_top);
		else if((to_move_bot > 0) && (to_move_top < 0)) 
				this.workspace.jQ.scrollTop(this.workspace.jQ.scrollTop() + to_move_top);
		else
			this.workspace.jQ.scrollTop(this.workspace.jQ.scrollTop() + to_move_top + to_move_bot);
		return this;
	}
	_.blur = function() {
    this.workspace.blurToolbar();
		if(this.blurred) return this;
		this.blurred = true;
  	if(this.focusedItem) this.focusedItem.blur();
		if(this.workspace.activeElement == this) this.workspace.activeElement = 0;
		this.leftJQ.removeClass(css_prefix + 'focused');
		return this;
	}
	_.windowBlur = function() {
    this.workspace.blurToolbar();
		this.blurred = true;
  	if(this.focusedItem) this.focusedItem.windowBlur();
		this.leftJQ.removeClass(css_prefix + 'focused');
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
	/* 
	 Keyboard events.  Will forward the event to whatever item is focusable.  The focusable item should respond to:
	 If cut/copy handles the cut/copy directly, and should set workspace.clipboard to the appropriate value and return true,
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
  }
  _.write = function(text) { // Like paste, but no blurring afterwards
  	if(this.focusedItem) this.focusedItem.write(text);
  }
  /*
   parse and toString are NEAR opposite methods.  toString will convert the element into a 
   string that is parse-able by the global 'parse' function (global within the SC scope).
   It uses the 'argumentList' helper method, which is the exact opposite of parse.  argumentList produces
   an array of arguments, that when passed to the 'parse' method of a blank element of the same type,
   identically reproduces the element.  Used for copy/pasting, among other things.
   */
  // Parse must return itself as it is chained
  _.parse = function(args) {
  	if(this.jQ === 0) {
  		// Not attached yet.  delay the parse until we are attached
  		this.toParse = args;
  		return this;
  	}
  	for(var i = 0; i < this.focusableItems.length; i++) {
  		if(this.focusableItems[i] === -1) {
  			// We are at the children.  We simply parse this and the resultant blocks become my children
  			var blocks = parse(args[i]);
  			for(var j=0; j < blocks.length; j++)
  				blocks[j].appendTo(this);
  		} else 
  			this.focusableItems[i].clear().paste(args[i]);
  	}
  	return this;
  }
  _.argumentList = function() {
  	var output = [];
  	for(var i = 0; i < this.focusableItems.length; i++) {
  		if(this.focusableItems[i] === -1) {
  			//We need to zip up the children
  			var child_string = '';
  			jQuery.each(this.children(), function(j, child) {
  				child_string += child.toString();
  			});
  			output.push(child_string);
  		} else
  			output.push(this.focusableItems[i].toString());
  	}
  	return output;
  }
  _.toString = function() {
  	throw("toString called on 'Element' type.  Element is an abtract class that should never be initialized on its own.  Only classes that extend this should ever be created.");
  }

	// Debug.  Print entire workspace tree
	_.printTree = function() {
		var out = '';
		if(this.children().length > 0) {
			$.each(this.children(), function(i, child) {
				out += child.printTree();
			});
		} 
		return out;
	}
});

// EditableBlock is a special element that means we dont need to add implicit math blocks before/after it when traversing with the keyboard or mouse hovering near its top/bottom
// By definition they only have 1 focusable item.  
var EditableBlock = P(Element, function(_, super_) {
	_.init = function() {
		super_.init.call(this);
	}
});