/*
A command block is a document element that has some command as its output,
and allows a cursor on either its left or right side.  The user can move the cursor
left or right around the element, and delete etc.  Used to simulate cursor commands
around a command block (like an 'else') so that these items can be deleted.
*/

var CommandBlock = P(function(_) {

	_.left = false;
	_.right = false;
	_.jQ = 0;
	_.location = 0;
	_.cursor = 0;
	_.element = 0;

  var id = 0;
  function uniqueCommandId() { return id += 1; }
  this.byId = {};

	_.init = function(span, el, handlers, left, right) {
		this.jQ = span;
		this.element = el;
		this.handlers = handlers;
		this.children = this.jQ.children('var');
		this.left = left;
		this.right = right;
    this.id = uniqueCommandId();
    CommandBlock.byId[this.id] = this;
    this.cursor = $('<span class="cursor">$</span>');
    this.jQ.attr('data-id', this.id);
	}

	// API Functions that are called by the enclosing element //
	_.keystroke = function(description, event) {
		switch(description) {
			case 'Left':
				this.moveCursor(L);
				break;
			case 'Right':
				this.moveCursor(R);
				break;
		}
	}
	_.typedText = function(text) {

	}
	_.cut = function(event) {

	}
	_.copy = function(event) {

	}
	_.paste = function(text) {

	}
	_.write = function(el) {

	}
	_.mouseOut = function(e) {
		this.clearCursor();
	}
	_.blur = function() {
		this.clearCursor();
	}
	_.windowBlur = function() {
		this.clearCursor();
	}
	_.focus = function(dir) {
		this.element.setFocusedItem(this);
		if(dir === R)
			this.placeCursor(this.right ? (this.children.length - 1) : this.children.length);
		else
			this.placeCursor(this.left ? 1 : 0);
	}
	_.mouseMove = function(e) {

	}
	_.mouseUp = function(e) {

	}
	_.mouseDown = function(e) {
		
	}
	_.cursorX = function() {
		return 0;
	}

	// Cursor functions //
	_.placeCursor = function(location) {
		this.clearCursor();
		this.location = location;
		if((location == 0) && this.left) {
			// Dont place cursor at root, move into the focusable item next to this
			this.handlers.moveOutOf(L, this);
		} else if(location == 0) {
			this.jQ.prepend(this.cursor);
			// START CURSOR BLINK
		} else if((location == this.children.length) && this.right) {
			// Dont place cursor at end, move into the focusable item next to this
			this.handlers.moveOutOf(R, this);
		} else {
			this.cursor.insertAfter(this.children[location-1]);
			// START CURSOR BLINK
		}
	}
	_.moveCursor = function(dir) {
		this.location += dir;
		if(this.location === -1) {
			this.handlers.moveOutOf(L, this);
		} else if(this.location === (this.children.length + 1)) {
			this.handlers.moveOutOf(R, this);
		} else
			this.placeCursor(this.location);
	}
	_.clearCursor = function() {
		// STOP CURSOR BLINK
		this.cursor.detach();
	}

});

var commandBlockHTML = function(name, id) {
	nameHTML = '<var>' + name.split('').join('</var><var>') + '</var>';
	return '<span class="' + css_prefix + "command " + css_prefix + name + id + '">' + nameHTML + '</span>';
}
var codeBlockHTML = function(name, id) {
	return commandBlockHTML(name, id).replace(css_prefix + 'command', css_prefix + 'command ' + css_prefix + 'code');
}
var registerCommand = function(_this, klass, options) {
	klass = '.' + css_prefix + klass + _this.id;
  var default_options = getDefaultOptions(_this);
	jQuery.extend(true, default_options, options);
	return CommandBlock(_this.jQ.find(klass), _this, default_options.handlers, default_options.left, default_options.right);
}

