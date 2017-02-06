/*
A pulldown is a document element that simulates a select box
*/

var Radio = P(aFocusableItem, function(_, super_) {

  _.position = 0;
  _.location = 0;

  _.init = function(span, klass, el, options) {
    super_.init.call(this, span, klass, el, options);
    this.handlers = options.handlers;
    this.fillBox(options.options);
  }
  // Fill the box with available options.  Reset position to first item or 'blank' if that is allowed
  _.fillBox = function(option_list) {
    this.option_list = [];
    this.jQ.html('');
    var count = 0;
    var _this = this;
    if(Array.isArray(option_list)) {
      for(var i = 0; i < option_list.length; i++) {
        var el = $('<div/>').addClass(css_prefix + "radio_option").html("<i class='fa fa-circle-o'></i><i class='fa fa-check-circle-o'></i>" + option_list[i].name).on('click', function(_this, count) { return function(e) { _this.select(count); e.preventDefault(); }; }(_this, count)).appendTo(_this.jQ);
        _this.option_list.push({ key: option_list[i].val, val: option_list[i].name });
        count++;
      }
    } else {
      $.each(option_list, function(k, v) {
        var el = $('<div/>').addClass(css_prefix + "radio_option").html("<i class='fa fa-circle-o'></i><i class='fa fa-check-circle-o'></i>" + v).on('click', function(_this, count) { return function(e) { _this.select(count); e.preventDefault(); }; }(_this, count)).appendTo(_this.jQ);
        _this.option_list.push({ key: k, val: v });
        count++;
      });
    }
    this.clear();
  }
  _.select = function(index, skip_undo) {
    if(this.position !== index) {
      if(!skip_undo)
        this.scheduleUndoPoint();
      this.position = index;
      this.changed();
      this.evaluateElement();
    }
    this.jQ.find(".selected").removeClass("selected");
    this.jQ.children().eq(this.position).addClass("selected");
  }
  _.highlight = function(index) {
    this.jQ.find('.highlighted').removeClass('highlighted');
    this.jQ.children().eq(index).addClass('highlighted');
    this.location = index;
  }
  // API Functions that are called by the enclosing element //
  _.keystroke = function(description, event) {
    switch(description) {
      case 'Shift-Tab':
      case 'Up':
        this.location--;
        if(this.location == -1) {
          this.location++;
          this.handlers.upOutOf(this);
        } else
          this.highlight(this.location);
        break;
      case 'Left':
        this.handlers.moveOutOf(L, this);
        break;
      case 'Right':
        this.handlers.moveOutOf(R, this);
        break;
      case 'Tab':
      case 'Down':
        this.location++;
        if(this.location == this.option_list.length) {
          this.location--;
          this.handlers.downOutOf(this);
        } else
          this.highlight(this.location);
        break;
      case 'Shift-Up':
      case 'Shift-Left':
        this.handlers.selectOutOf(L, this);
        break;
      case 'Shift-Down':
      case 'Shift-Right':
        this.handlers.selectOutOf(R, this);
        break;
      case 'End':
      case 'Shift-End':
      case 'Ctrl-End':
      case 'Ctrl-Shift-End':
        this.location = this.option_list.length-1;
        this.highlight(this.location);
        break;
      case 'Home': 
      case 'Shift-Home':
      case 'Ctrl-Home':
      case 'Ctrl-Shift-Home':
        this.location = 0;
        this.highlight(this.location);
        break;
      case 'Enter':
      case 'Spacebar': 
        this.select(this.location);
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
  _.getSelectedText = function() {
    if(this.position > -1)
      return this.option_list[this.position].val;
    return '';
  }
  _.mouseOut = function(e) {
    this.blur();
  }
  _.blur = function() {
    this.jQ.removeClass('highlighted');
  }
  _.focus = function(dir) {
    super_.focus.call(this, dir);
    this.jQ.addClass('highlighted');
    this.scrollToMe(dir);
    if(dir == L) this.highlight(0);
    else if(dir == R) this.highlight(this.option_list.length-1);
  }
  _.mouseMove = function(e) {
  }
  _.mouseUp = function(e) {
    // click handlers are on the divs themselves
    this.jQ.find('.highlighted').removeClass('highlighted');
  }
  _.clear = function() {
    this.select(0);
    return this;
  }
  _.currentState = function() {
    return {
      position: this.position
    }
  }
  _.restoreState = function(data) {
    this.select(data.position, true);
  }
});


