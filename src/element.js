
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
  _.worksheet = 0;
  _.undo_count = 0; // Number of times this appears in the undo stack.  Used to make sure we don't destroy the element when we might want to get it back later through an undo method
  _.parent = 0;
  _.no_save = false;
  _.jQ = 0;
  _.hidden = true;
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
	_.needsEvaluation = false; // This is whether an evaluatable element, when evaluated directly (not in a queue through fullEvaluation), should be evaluated
	_.evaluatable = false;     // Is this element evaluatable?  If not, just skip it
	_.fullEvaluation = false;  // When evaluated, should this element evaluate ancestors and suceeding elements?
	_.forceFullEvaluation = false; // Used by remove method to set later blocks to act like a full evaluation block temporarily
	_.scoped = false;          // Can this element change the scope (set/change variables).  If so, we need to keep track of scope here
	_.hasChildren = false; // Doesn't imply there are children elements, implies children elements are allowed
	_.inTree = false;

	//Give each element a unique ID, this is just for tracking purposes
  var id = 0;
  function uniqueNodeId() { return id += 1; }
  this.byId = {};

	_.init = function() {
    this.id = uniqueNodeId();
    Element.byId[this.id] = this;

		this.ends = {};
		this.commands = [];
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
		if(this.worksheet && this.worksheet.activeUndo) return this;
		this.jQ = $('<div style="display:none;" ' + css_prefix + 'element_id=' + this.id + ' class="' + css_prefix + 'element '
			+ jQuery.map(this.klass, function(k) { return (css_prefix + k) }).join(' ') + '">'
			+ '<table class="' + css_prefix + 'element_table"><tbody><tr><td class="' + css_prefix + 'element_td"><i class="fa fa-exclamation-triangle"></i><span></span><div class="' + css_prefix + 'element_collapse">'
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
		this.forceFullEvaluation = false;
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
	be placed next to/into/in place of the provided target
	*/
	_.insertNextTo = function(sibling, location) {
		if(this.inTree) return this; // Already added...
		if(this.validateParent && !this.validateParent(sibling.parent)) {
			// This element cannot be inserted into a parent of this type
			showNotice('This item cannot be inserted in this location','red');
			return this;
		}
		if(sibling.parent.validateChild && !sibling.parent.validateChild(this)) {
			// Parent does not allow children of this type.  Insert at next available position
			showNotice('This item cannot be inserted here and was placed at the next allowable position');
			return this.insertNextTo(sibling.parent, R);
		}
		this.parent = sibling.parent;
		this.updateWorksheet(this.parent.getWorksheet());
		if(this.worksheet) this.worksheet.setUndoPoint(this, { command: 'insert' });
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
		return this;
	}
	_.insertAfter = function(sibling) {
		return this.insertNextTo(sibling, R);
	}
	_.insertBefore = function(sibling) {
		return this.insertNextTo(sibling, L);
	}
	_.insertInto = function(parent, location) {
		if(this.inTree) return this; // Already added...
		if(this.validateParent && !this.validateParent(parent)) {
			// This element cannot be inserted into a parent of this type
			showNotice('This item cannot be inserted in this location','red');
			return this;
		}
		if(parent.validateChild && !parent.validateChild(this)) {
			// Parent does not allow children of this type.  Insert at next available position
			showNotice('This item cannot be inserted here and was placed at the next allowable position');
			return this.insertNextTo(parent, R);
		}
		this.parent = parent;
		this.updateWorksheet(parent.getWorksheet());
		if(this.worksheet) this.worksheet.setUndoPoint(this, { command: 'insert' });
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
		return this;
	}
	_.prependTo = function(parent) {
		return this.insertInto(parent, L);
	}
	_.appendTo = function(parent) {
		return this.insertInto(parent, R);
	}
	_.replace = function(replaced) {
		var stream = !replaced.worksheet.trackingStream;
		if(stream) replaced.worksheet.startUndoStream();
		this.insertAfter(replaced);
		replaced.remove();
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
			this.leftJQ.children('span').html(start);
			start++;
		} else this.leftJQ.children('span').html('');
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
		// First, basically remove this item from the tree
		if(this.worksheet) this.worksheet.setUndoPoint(this, { command: 'move', L: this[L], parent: this.parent });
		if(this[L] !== 0) 
			this[L][R] = this[R];
		else
			this.parent.ends[L] = this[R];
		if(this[R] !== 0) 
			this[R][L] = this[L];
		else
			this.parent.ends[R] = this[L];
		if((this.parent.ends[L] === 0) && (this.parent.ends[R] === 0)) {
			if(this.parent.implicitType)
				this.parent.implicitType().appendTo(this.parent).show(0);
			else
				math().appendTo(this.parent).show(0);
		}
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
	_.remove = function(duration) {
		if(!this.inTree) return this; // Already removed...
		// Add this to the undoManager
		if(this.worksheet) this.worksheet.setUndoPoint(this, { command: 'remove', L: this[L], parent: this.parent });
		this.inTree = false;
		duration = typeof duration === 'undefined' ? 200 : duration;
		this.preRemoveHandler();
		if(this.fullEvaluation || this.forceFullEvaluation) {
			if((this.depth == 0) && this[R]) {
				var to_eval = this[R];
				if(to_eval.mark_for_deletion) to_eval.forceFullEvaluation = true;
				else window.setTimeout(function() { to_eval.evaluate(true, true); }, 100);
			} else if(this.depth > 0) {
				var to_eval = this.firstGenAncestor();
				if(to_eval.mark_for_deletion) to_eval.forceFullEvaluation = true;
				else window.setTimeout(function() { to_eval.evaluate(true, true); }, 100);
			}
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
			if(this.parent.implicitType)
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
		return this;
	}
	// Undo/Redo restore
	_.restoreState = function(action) {
		// The command is what was done to the item, so we should do the inverse
		switch(action.command) {
			case 'remove':
				if(action.L)
					this.insertAfter(action.L);
				else
					this.prependTo(action.parent);
				window.setTimeout(function(to_eval) { return function() { to_eval.evaluate(true); }; }(this), 100);
				break;
			case 'insert':
				this.remove(0);
				break;
			case 'move':
				// BRENTAN: Move restores are inefficient.  We may end up calling lots of forced full evaluations on elements
				// that get canceled out, but only after starting evaluation.  This should work more like the mouse drag
				// move, but that 'knows' about all the elements in the move, while here we only know about ourself...
				if(this.fullEvaluation) {
					//In a full evaluation scenario, we should evaluate the neighbor above as well...
					var first = this.firstGenAncestor();
					if(first == this) first = first[L];
					if(first)
						window.setTimeout(function(to_eval) { return function() { to_eval.evaluate(true, true); }; }(first), 100);
				}
				if(action.L)
					this.move(action.L, R, false);
				else
					this.move(action.parent, L, true);
				window.setTimeout(function(to_eval) { return function() { to_eval.evaluate(true); }; }(this), 100);
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
		for(var ac = this.ends[L]; ac !== 0; ac = ac[R])
			out.push(ac);
		return out;
	}
	_.commandChildren = function(func) {
		// Will run the func command on myself, and then command all children with the same function
		func(this);
		var children = this.children();
		for(var i = 0; i < children.length; i++)
			children[i].commandChildren(func);
		return this;
	}
	_.firstGenAncestor = function() {
		for(var w = this; !(w.parent instanceof Worksheet); w = w.parent) {}
		return w;
	}
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

	Most of these functions work on their own, but elements can override:
	continueEvaluation: What should happen when this element is evaluated
	evaluationFinished: the default callback from continueEvaluation, although other callbacks can be defined (assumes commands are in the 'commands' property of this element)
	childrenEvaluated: the callback that is called when all children of the element have been evaluated (if any)
	When continueEvaluation and childrenEvaluated are overrident, they should be called through super_, it may make sense to call them with super_ after some work is done
	The giac function 'execute' is provided to send commands to giac.  Execute is called with various options, including 
		commands to send (array), and the string name of the callback that should be called when complete
	*/
	_.move_to_next = false;
	// Evaluate starts an evaluation at this node.  It checks if an evaluation is needed (needsEvaluation method) and whether we also need to evaluate ancesctor/succeeding blocks (fullEvaluation)
	// This function assigns this evaluation stream a unique id, and registers it in Worksheet.  Other functions can cancel this evaluation stream with this unique id.
	_.evaluate = function(force, force_full) {
		if(typeof force === 'undefined') force = false;
		if(typeof force_full === 'undefined') force_full = false;
		if(this.mark_for_deletion) return;
		if(!this.needsEvaluation && !force) return this;
		if(this.needsEvaluation) this.worksheet.save();
		var fullEvaluation = force_full || this.fullEvaluation || this.forceFullEvaluation;

	  // Check for other evaluations in progress....if found, we should decide whether we need to evaluate, whether we should stop the other, or whether both should continue
		var current_evaluations = giac.current_evaluations();
		for(var i = 0; i < current_evaluations.length; i++) {
			var location = L;
			var current_evaluation = giac.evaluations[current_evaluations[i]];
			var current_evaluation_full = giac.evaluation_full[current_evaluations[i]];
			if(current_evaluation !== true) {
				var el = this.firstGenAncestor();
				if(el.id == current_evaluation) 
					location = 0;
				else {
					for(el = el[L]; el instanceof Element; el = el[L]) {
						if(el.id == current_evaluation) { location = R; break; }
					}
				}
			}
			if(location === L) {
				// I am above the currently evaluating block
				if(fullEvaluation) giac.cancelEvaluation(current_evaluations[i]); // Ill get to the other block through this one.
			} else if(location === 0) {
				// I am in the same parent (first gen) block as currently evaluating block
				if(current_evaluation_full && fullEvaluation) { giac.cancelEvaluation(current_evaluations[i]); } // We need to redo, as we don't know where in the block the other evaluation is
				else if(current_evaluation_full) { fullEvaluation = true; giac.cancelEvaluation(current_evaluations[i]); } // Restart the evaluation, in full, at this parent
				else if(fullEvaluation) { giac.cancelEvaluation(current_evaluations[i]); } // This evaluation will reach, fix whatever is currently being evaluated
				// Else both are independant evaluations, so let that one do its thing and this will do its thing.
			}	else {
				// I am below the currently evaluating block
				if(current_evaluation_full) return this; // The other calculation is a 'full' calculation and will eventually reach me.
			}
		}
		if(this.depth == 0) {
			//this.jQ.stop().css("background-color", "#00ff00").animate({ backgroundColor: "#FFFFFF"}, {duration: 1500, complete: function() { $(this).css('background-color','')} } );
			var eval_id = giac.registerEvaluation(fullEvaluation);
			this.continueEvaluation(eval_id, fullEvaluation);
			if(this.outputBox) this.outputBox.calculating();
			if(fullEvaluation) {
			//this.jQ.stop().css("background-color", "#ff0000").animate({ backgroundColor: "#FFFFFF"}, { duration: 1500, complete: function() { $(this).css('background-color','')} } );
				for(var el = this[R]; el !== 0; el = el[R]) {
					if(el.outputBox) el.outputBox.calculating();
					el.jQ.find('i.fa-spinner').remove();
					el.jQ.find('div.' + css_prefix + 'element.error').removeClass('error');
					el.jQ.find('div.' + css_prefix + 'element.warn').removeClass('warn');
				}
			} 
		} else {
			// If this is a 'full evaluation', we should find the first generation ancestor and do it there
			if(fullEvaluation) return this.firstGenAncestor().evaluate(true, true);
			//this.jQ.stop().css("background-color", "#00ff00").animate({ backgroundColor: "#FFFFFF"}, { duration: 1500, complete: function() { $(this).css('background-color','')} } );
			var eval_id = giac.registerEvaluation(false);
			this.continueEvaluation(eval_id, false);
			if(this.outputBox) this.outputBox.calculating();
		}
		return this;
	}
	_.shouldBeEvaluated = function(evaluation_id) {
		if(!this.evaluatable || this.mark_for_deletion || !giac.shouldEvaluate(evaluation_id)) return false;
		// Logic Blocks: Make sure I'm not a children of any block that is not currently activated
		for(var el = this; el instanceof Element; el = el.parent) {
			if(el.parent instanceof LogicBlock) {
				for(var el2 = el; el2 instanceof Element; el2 = el2[L]) {
					if(el2 instanceof LogicCommand) break;
				}
				if(el2 instanceof LogicCommand) {
				 	if(el2.logicResult === false) { this.jQ.addClass(css_prefix + 'greyout'); return false; }
				} else 
					if(el.parent.logicResult === false) { this.jQ.addClass(css_prefix + 'greyout'); return false; }
			}
		}
		if(this.jQ && (typeof this.jQ.removeClass === 'function'))
			this.jQ.removeClass(css_prefix + 'greyout');
		return true;
	}
	_.allowOutput = function() {
		for(var el = this; el instanceof Element; el = el.parent)
			if(el.suppress_output) return false;
		return true;
	}
	_.addSpinner = function(eval_id) {
		if(this.allowOutput()) {
			this.leftJQ.find('i.fa-spinner').remove();
			if((typeof eval_id !== 'undefined') && giac.manual_evaluation[eval_id])
				this.leftJQ.prepend('<i class="fa fa-spinner fa-pulse"></i>'); // Manual mode spinner should not be hidden
			else
				this.leftJQ.prepend('<i class="fa fa-spinner fa-pulse calculation_spinner"></i>');
		}
	}
	// Continue evaluation is called within an evaluation chain.  It will evaluate this node, and if 'move_to_next' is true, then move to evaluate the next node.
	_.continueEvaluation = function(evaluation_id, move_to_next) {
		if(this.shouldBeEvaluated(evaluation_id)) {
			this.addSpinner(evaluation_id);
			if(this.hasChildren) {
				this.move_to_next = move_to_next;
				if(this.ends[L])
					this.ends[L].continueEvaluation(evaluation_id, true)
				else
					this.childrenEvaluated(evaluation_id);
			} else {
				if((this.commands.length === 0) || ($.map(this.commands, function(val) { return val.command; }).join('').trim() === '')) // Nothing to evaluate...
					this.evaluateNext(evaluation_id, move_to_next)
				else
					giac.execute(evaluation_id, move_to_next, this.commands, this, 'evaluationFinished');
			}
		} else 
			this.evaluateNext(evaluation_id, move_to_next)
	}

	// Callback from giac when an evaluation has completed and results are returned
	_.evaluationCallback = function(evaluation_id, evaluation_callback, move_to_next, results) {
		if(!giac.shouldEvaluate(evaluation_id)) return;
		if(this[evaluation_callback](results, evaluation_id, move_to_next)) 
			this.evaluateNext(evaluation_id, move_to_next);
	}

	// Callback function.  should return true if this is the end of the element evaluation, false if more evaluation is happening
	_.evaluationFinished = function(result) {
		return true;
	}

	// Call the next item
	_.evaluateNext = function(evaluation_id, move_to_next) {
		this.leftJQ.find('i.fa-spinner').remove();
		if(this[R] && move_to_next)
			this[R].continueEvaluation(evaluation_id, move_to_next)
		else if(move_to_next && (this.parent instanceof Element))
			this.parent.childrenEvaluated(evaluation_id);
		else 
			giac.evaluationComplete(evaluation_id);
	}

	// Called by the last child node of this element after it is evaluated.  This node should move onwards to next nodes if 'move_to_next' is true
	_.childrenEvaluated = function(evaluation_id) {
		var move_to_next = this.move_to_next;
		// We need to save the scope?
		if(this.scoped && giac.shouldEvaluate(evaluation_id))
			giac.execute(evaluation_id, move_to_next, [], this, 'scopeSaved');
		else
			this.evaluateNext(evaluation_id, move_to_next);
	}
	_.scopeSaved = function(result) {
		return true;
	}
	// Find the nearest previous element that has a scope we should use
	_.previousScope = function() {
		var el = this;
		while(el instanceof Element) {
			if((el !== this) && el.hasChildren && el.ends[R]) el = el.ends[R]
			else if(el[L] && !(el[L] instanceof LogicCommand)) el = el[L];
			else {
				for(el = el.parent; el instanceof Element; el = el.parent) {
					if(el[L]) { el = el[L]; break; }
				}
				if(!(el instanceof Element)) return false;
			}
			if(el.scoped) return el;
		}
		return false;
	}

	// Journey up parents to the worksheet.  Evaluation is linear in the first generation children of worksheet.  Below that level,
	// Children blocks may have non-linear evaluation (such as 'for' loops, etc).  We need to find our ancestor who is a worksheet
	// first generation child, then start the evaluation process there and move inwards/downwards.  
	// Bring/remove cursor focus to/from the block, if possible
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
	_.mouseOut = function(e) {
		if(this.focusedItem) this.focusedItem.mouseOut(e);
	}
	_.mouseClick = function(e) {
		if((this.start_target === -1) && $(e.target).closest('div.' + css_prefix + 'collapse').length) 
			this.collapse();
		else if((this.start_target === -1) && $(e.target).closest('div.' + css_prefix + 'expand').length) 
			this.expand();
		else if((this.start_target === -1) && $(e.target).closest('div.' + css_prefix + 'focusableItems').length) {
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
		} else {
			this.insertJQ.slideUp({duration: 500});
			expand.slideDown({duration: 500});
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
		}	else {
			this.insertJQ.slideDown({duration: 500});
			this.insertJQ.next('.' + css_prefix + 'expand').slideUp({duration: 500, always: function() { $(this).remove(); } });
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
			else if(this.ends[-dir] === 0) {
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
			else if(this.ends[-dir] === 0) {
				var to_insert = (this.implicitType) ? this.implicitType() : math().setImplicit();
				to_insert.appendTo(this).show().focus();
				return true;
			}
		}
		return false;
	}
	// Will attempt to move into this element from another from the passed direction.  If x_location is passed, assume we are coming from Up/Down and need to place cursor based on this location
	_.moveInFrom = function(dir, x_location) {
		if(this.focusableItems.length == 0) //nothing to focus on, jump past me
			return (x_location ? this.moveOutUpDown(undefined, -dir, x_location) : this.moveOutLeftRight(undefined, -dir));
		this.focus(dir);
		// BRENTAN: BELOW SHOULD BE IN FOCUS IF/WHEN dir/x_location is set?
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
			this.expand();
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
		this.worksheet.focus();
		this.worksheet.blurToolbar(this);
		if(this.worksheet.activeElement)
			this.worksheet.activeElement.blur(this);
		this.blurred = false;
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
	_.autocomplete = function() {
		return giac.variable_list;
	}
	_.autocompleteObject = function(name) {
		return giac.object_list[name];
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
  	if(this.hasChildren || this.savedProperties.length) {
  		this.parseSavedProperties(args[0]);
	  	var k = 1;
	  } else
	  	var k = 0;
  	var count = 0;
  	for(var i = 0; i < this.focusableItems.length; i++) {
  		for(var j = 0; j < this.focusableItems[i].length; j++) {
	  		if((this.focusableItems[i][j] instanceof CommandBlock) && !this.focusableItems[i][j].editable) continue; //Ignore command blocks, those are created with the block and have no saveable options
	  		if(this.focusableItems[i][j] === -1) {
	  			// We are at the children.  We simply parse this and the resultant blocks become my children
	  			var blocks = parse(args[count + k]);
	  			for(var j=0; j < blocks.length; j++)
	  				blocks[j].appendTo(this).show(0);
	  		} else 
	  			this.focusableItems[i][j].clear().paste(args[count + k]);
	  		count++;
	  	}
  	}
  	return this;
  }
  // Parse the portion of the parse expression dealing with saved properties
  _.parseSavedProperties = function(args) {
		var arg_list = args.split(',');
  	for(var j = 0; j < arg_list.length; j++) {
  		var name = arg_list[j].replace(/^[\s]*([a-zA-Z0-9_]+)[\s]*:(.*)$/,"$1");
  		var val = arg_list[j].replace(/^[\s]*([a-zA-Z0-9_]+)[\s]*:(.*)$/,"$2").trim();
  		if(val.match(/^[+-]?(?:\d*\.)?\d+$/)) val = 1.0 * val;
  		if(val === "false") val = false;
  		if(val === "true") val = true;
  		this[name] = val;
  	}
  	return this;
  }
  _.argumentList = function() {
  	var output = [];
  	var arg_list = this.hasChildren ? ['collapsed: ' + this.collapsed] : [];
  	for(var k = 0; k < this.savedProperties.length; k++) 
  		arg_list.push(this.savedProperties[k] + ": " + this[this.savedProperties[k]]);
  	if(arg_list.length)
  		output.push(arg_list.join(', '));
  	for(var i = 0; i < this.focusableItems.length; i++) {
  		for(var j = 0; j < this.focusableItems[i].length; j++) {
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
  	}
  	return output;
  }
  _.toString = function() {
  	throw("toString called on 'Element' type.  Element is an abtract class that should never be initialized on its own.  Only classes that extend this should ever be created.");
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
var LogicBlock = P(Element, function(_, super_) {
	_.logicResult = false;
	_.init = function() {
		super_.init.call(this);
	}
});
var LogicCommand = P(Element, function(_, super_) {
	_.klass = ['logic_command'];
	_.logicResult = false;
	_.fullEvaluation = true;
	_.init = function() {
		super_.init.call(this);
	}
});
// Loops are things like for loops or while loops that use flow control statements such as 'continue' or 'break'
var Loop = P(Element, function(_, super_) {
	_.init = function() {
		super_.init.call(this);
	}
});
SwiftCalcs.elementById = function(id) {
	return Element.byId[id];
}