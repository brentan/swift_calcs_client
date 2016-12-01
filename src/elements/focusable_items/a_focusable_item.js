/*
	Simple class for all focusable items to extend, has some basic functionality
*/
var aFocusableItem = P(function(_) {

	_.jQ = 0;
	_.element = 0;
	_.needs_touch = false;
  var id = 0;
  function uniqueCommandId() { return id += 1; }
  this.byId = {};

  _.init = function(span, klass, el, options) {
    this.id = uniqueCommandId();
    aFocusableItem.byId[this.id] = this;
		this.jQ = span;
		this.element = el;
    this.jQ.attr('data-focusable-id', this.id);
    this.jQ.addClass(css_prefix + 'focusable');
  }
  _.flash = function() {
    var el = this.jQ.closest('.sc_element');
    el.stop().css("background-color", "#ffe0e0").animate({ backgroundColor: "#FFFFFF"}, {complete: function() { $(this).css('background-color','')} , duration: 400 });
    return this;
  }
	_.scrollToMe = function(dir) {
		if(this.jQ) {
			var top = this.jQ.position().top;
			var bottom = top + this.jQ.height();
			var to_move_top = Math.min(0, top);
			var to_move_bot = Math.max(0, bottom - this.element.worksheet.jQ.height()+20);
			if((to_move_bot > 0) && (to_move_top < 0)) {
				if(dir === R)
					this.element.worksheet.jQ.scrollTop(this.element.worksheet.jQ.scrollTop() + to_move_bot);
				else
					this.element.worksheet.jQ.scrollTop(this.element.worksheet.jQ.scrollTop() + to_move_top);
			}	else
				this.element.worksheet.jQ.scrollTop(this.element.worksheet.jQ.scrollTop() + to_move_top + to_move_bot);
		}
		return this;
	}
	_.cursorX = function() {
    if(this.cursor && this.cursor.offset()) return this.cursor.offset().left;
    return undefined;
	}
	_.evaluateElement = function() {
		if(this.element.submissionHandler) this.element.submissionHandler(this.element)(this);
	}
	_.changed = function() {
		if(this.element.changed) this.element.changed(this);
	}


	// API Functions that are called by the enclosing element and should be overwritten by class inheriting this one //
	_.keystroke = function(description, event) {
	}
	_.typedText = function(text) {
	}
	_.cut = function(event) {
		return this;
	}
	_.empty = function() { 
		return true;
	}
	_.copy = function(event) {
		return this;
	}
	_.write = function(text) {
	}
	_.paste = function(text) {
		this.write(text);
	}
	_.text = function() {
	}
  _.toString = function() {
		return this.text();
  }
	_.blur = function() {
    this.jQ.removeClass('focused');
	}
	_.windowBlur = function() {
		this.blur();
	}
	_.focus = function(dir) {
    this.jQ.addClass('focused');
		this.element.setFocusedItem(this);
	}
  _.dblclick = false;
  _.mouseOut = function(e) {
    this.dblclick = false;
  }
	_.mouseMove = function(e) {
    this.dblclick = false;
	}
	_.mouseUp = function(e) {
    if(this.dblclick) {
      this.dblclick = false;
      this.mouseDoubleClick();
    } else {
      this.dblclick = true;
      window.setTimeout(function(_this) { return function() { _this.dblclick = false; }; }(this), 500);
    }
	}
  _.mouseUpShift = function(e) {
    this.dblclick = false;
  }
	_.mouseDown = function(e) {
	}
  _.mouseDoubleClick = function() {
  }
	_.clear = function() {
		return this;
	}
	_.scheduleUndoPoint = function() {
		if(this.element && this.element.worksheet)
			this.element.worksheet.scheduleUndoPoint(this);
	}
	_.setUndoPoint = function() {
		if(this.element && this.element.worksheet)
			this.element.worksheet.setUndoPoint(this);
	}
});

var getDefaultOptions = function(_this) {
  return {handlers: {
    deleteOutOf: function(dir, field) {
      // find next focusable item, and if there isn't one or if its the children, do the appropriate action
      for(var i = 0; i < _this.focusableItems.length; i++) {
        for(var j = 0; j < _this.focusableItems[i].length; j++)
          if(_this.focusableItems[i][j] == field) break;
        if(_this.focusableItems[i][j] == field) break;
      }
      if(((dir === L) && (j == 0)) || ((dir === R) && (j == (_this.focusableItems[i].length-1)))) {
        var i_new = i + dir;
        var j_new = dir === L ? _this.focusableItems[i].length-1 : 0;
      } else {
        var i_new = i;
        var j_new = j + dir;
      }
      if(((i == 0) && (j == 0) && (dir == L)) || ((i == (_this.focusableItems.length - 1)) && (j == (_this.focusableItems[_this.focusableItems.length - 1].length - 1)) && (dir == R))) {
        // leftward or rightward delete out of element
        if((_this instanceof EditableBlock) && _this.empty() && _this.moveOutLeftRight(field, dir)) _this.remove(0);
        else if((dir === R) && ((_this instanceof uploadedItem) || (_this instanceof videoBlock))) _this.worksheet.selectDir(_this, dir);
        else if(_this[dir] && (_this[dir] instanceof EditableBlock) && _this[dir].empty()) _this[dir].remove(0);
        else if(_this[dir]) _this.worksheet.selectDir(_this[dir],dir);
        else if(_this.depth) _this.worksheet.selectDir(_this.parent,dir);
        return;
      }
      if(_this.focusableItems[i_new][j_new] === -1) {
        if(_this.ends[-dir] && (_this.ends[-dir] instanceof EditableBlock) && _this.ends[-dir].empty()) _this.ends[-dir].remove(0);
        else _this.worksheet.selectDir(_this.ends[-dir],dir);
        return;
      } 
      if((i_new == 0) && (j_new == 0) && (dir == L) && (_this.focusableItems[0][0] instanceof CommandBlock) && _this.empty()) {
        // Special case, this is where the cursor would be right after a magic command is transformed into a special block.  Backspace should revert to the magic command in a math block
        _this.mark_for_deletion = true;
        _this.moveOutLeftRight(field, dir);
        _this.focusableItems[0][0].changeToMath();
        return;
      }
      _this.moveOutLeftRight(field, dir);
      return;
    },
    upOutOf: function(field) {
      window.setTimeout(function() { _this.moveOutUpDown(field, L, field.cursorX()); });
    },
    downOutOf: function(field) {
      window.setTimeout(function() { _this.moveOutUpDown(field, R, field.cursorX()); });
    },
    moveOutOf: function(dir, field) {
      window.setTimeout(function() { _this.moveOutLeftRight(field, dir); });
    },
    selectOutOf: function(dir, field) { 
      window.setTimeout(function() { _this.worksheet.selectDir(_this, dir); _this.worksheet.selectionChanged(); });
    }
  }};
}
var registerFocusable = function(focusable, _this, klass_in, options) {  
	klass = '.' + css_prefix + klass_in.replace(/ /g, '_');
  var default_options = getDefaultOptions(_this);
	jQuery.extend(true, default_options, options);
	if(focusable === MathQuill) {
  	var mathField = MathQuill.MathField(_this.jQ.find('span.' + css_prefix + 'math' + klass)[0], default_options);
		mathField.setElement(_this);
		return mathField;
  } else
		return focusable(_this.jQ.find(klass), klass_in, _this, default_options);
}
var focusableHTML = function(focusable, name) {
	name = name.replace(/ /g, '_');
	if(focusable === 'MathQuill')
		return '<span class="' + css_prefix + 'math ' + css_prefix + name + '"></span>';
	else
		return '<span class="' + css_prefix + focusable + " " + css_prefix + name + '"></span>';
}
