/*
A pulldown is a document element that simulates a select box
*/

var SelectBox = P(aFocusableItem, function(_, super_) {

	_.position = 0;
	_.location = 0;
	_.allow_blank = false;
	_.opened = false;

	_.init = function(span, klass, el, options) {
		super_.init.call(this, span, klass, el, options);
		this.closedJQ = $('<div/>').addClass(css_prefix + 'select_closed');
		this.openedJQ = $('<div/>').addClass(css_prefix + 'select_opened');
		this.jQ.append(this.closedJQ).append(this.openedJQ);
		this.handlers = options.handlers;
		if(options.blank_message) {
			this.allow_blank = true;
			this.blank_message = options.blank_message;
			this.needs_touch = true;
		}
		this.fillBox(options.options);
	}
	// Fill the box with available options.  Reset position to first item or 'blank' if that is allowed
	_.fillBox = function(option_list) {
		this.close();
		this.option_list = [];
		this.openedJQ.html('');
		var count = 0;
		var _this = this;
		$.each(option_list, function(k, v) {
			var el = $('<div/>').addClass(css_prefix + "select_option").html(v).on('click', function(_this, count) { return function(e) { _this.select(count); e.preventDefault(); }; }(_this, count)).on('mouseenter', function(_this, count) { return function(e) { _this.highlight(count); }; }(_this, count)).appendTo(_this.openedJQ);
			_this.option_list.push({ key: k, val: v });
			count++;
		});
		this.clear();
	}
	_.close = function() {
		this.openedJQ.hide();
		this.opened = false;
	}
	_.open = function() {
		this.openedJQ.show();
		if(this.position > -1)
			this.highlight(this.position);
		this.opened = true;
	}
	_.select = function(index) {
		if(this.position !== index) {
			this.position = index;
			this.changed();
			this.evaluateElement();
		}
		this.close();
		this.closedJQ.html(this.option_list[index].val + '<i class="fa fa-caret-down"></i>');
	}
	_.highlight = function(index) {
		this.openedJQ.find('.highlighted').removeClass('highlighted');
		this.openedJQ.children().eq(index).addClass('highlighted');
		this.location = index;
	}
	// API Functions that are called by the enclosing element //
	_.keystroke = function(description, event) {
		switch(description) {
			case 'Left':
				this.handlers.moveOutOf(L, this);
				break;
			case 'Right':
				this.handlers.moveOutOf(R, this);
				break;
			case 'Shift-Up':
			case 'Up':
				if(this.opened) {
					this.location--;
					if(this.location == -1) this.location++;
					this.highlight(this.location);
				} else
						this.handlers.upOutOf(this);
				break;
			case 'Shift-Down':
			case 'Down':
				if(this.opened) {
					this.location++;
					if(this.location == this.option_list.length) this.location--;
					this.highlight(this.location);
				} else
						this.handlers.downOutOf(this);
				break;
			case 'Shift-Left':
				this.handlers.selectOutOf(L, this);
				break;
			case 'Shift-Right':
				this.handlers.selectOutOf(R, this);
				break;
			case 'End':
			case 'Shift-End':
			case 'Ctrl-End':
			case 'Ctrl-Shift-End':
				if(this.opened) {
					this.location = this.option_list.length-1;
					this.highlight(this.location);
				}
				break;
			case 'Home': 
			case 'Shift-Home':
			case 'Ctrl-Home':
			case 'Ctrl-Shift-Home':
				if(this.opened) {
					this.location = 0;
					this.highlight(this.location);
				}
				break;
    	case 'Tab':
    	case 'Enter':
    	case 'Spacebar': 
				if(this.opened) 
					this.select(this.location);
				else if(description == 'Spacebar')
					this.open();
				else
					this.handlers.moveOutOf(R, this);
    		break;
    	case 'Shift-Tab':
				this.handlers.moveOutOf(L, this);
    		break;
    	default:
    		return;
		}
    event.preventDefault();
	}
	_.typedText = function(text) {
		// TODO: open pulldown and move to closest selection based on typed keys?
	}
	_.cut = function(event) {
		this.copy(event);
		return this;
	}
	_.copy = function(event) {
		this.element.worksheet.clipboard = this.text(); 
		this.element.worksheet.selectFn(this.text()); 
		return this;
	}
	_.write = function(text) {
		for(var i = 0; i < this.option_list.length; i++)
			if(text == this.option_list[i].key) this.select(i);
	}
	_.text = function() {
		if(this.position > -1)
			return this.option_list[this.position].key;
		return '';
	}
	_.mouseOut = function(e) {
		this.blur();
	}
	_.blur = function() {
		this.jQ.removeClass('highlighted');
		this.close();
	}
	_.focus = function(dir) {
		super_.focus.call(this, dir);
		this.jQ.addClass('highlighted');
    this.scrollToMe(dir);
	}
	_.mouseMove = function(e) {
	}
	_.mouseUp = function(e) {
		// opened events handled directly be event listeners on the pulldown divs
		if(!this.opened)
			this.open();
	}
	_.clear = function() {
		if(this.allow_blank) {
			this.position = -1;
			this.closedJQ.html('<span class="blank">' + this.blank_message + '</span><i class="fa fa-caret-down"></i>');
		} else 
			this.select(0);
		return this;
	}
});


