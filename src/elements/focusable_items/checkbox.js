/*
A Checkbox is a document element that simulates a check box
*/

var CheckBox = P(aFocusableItem, function(_, super_) {

  _.init = function(span, klass, el, options) {
    super_.init.call(this, span, klass, el, options);
    this.handlers = options.handlers;
    if(options.needs_touch) this.needs_touch = options.needs_touch;
    this.message = options.message;
    this.checked = options.checked ? true : false;
    this.jQ.html("<i class='fa'></i>" + this.message);
    this.updateCheckbox();
  }
  // Add appropriate class to checkbox
  _.updateCheckbox = function() {
    if(this.checked) this.jQ.children('i.fa').addClass('fa-check-square-o').removeClass('fa-square-o');
    else this.jQ.children('i.fa').removeClass('fa-check-square-o').addClass('fa-square-o');
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
      case 'Shift-Left':
      case 'Shift-Tab':
        this.handlers.moveOutOf(L, this);
        break;
      case 'Right':
      case 'Tab':
      case 'Enter':
      case 'Shift-Right':
        this.handlers.moveOutOf(R, this);
        break;
      case 'Shift-Up':
      case 'Up':
        this.handlers.upOutOf(this);
        break;
      case 'Shift-Down':
      case 'Down':
        this.handlers.downOutOf(this);
        break;
      case 'Spacebar': 
        this.checked = !this.checked;
        this.updateCheckbox();
        break;
      default:
        return;
    }
    event.preventDefault();
  }
  _.write = function(text) {
    this.checked = text == 'true';
    this.updateCheckbox();
  }
  _.text = function() {
    return this.checked ? 'true' : 'false';
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
  }
  _.mouseMove = function(e) {
  }
  _.mouseUp = function(e) {
    // opened events handled directly be event listeners on the pulldown divs
    this.checked = !this.checked;
    this.updateCheckbox();
  }
  _.clear = function() {
    this.checked = false;
    this.updateCheckbox();
    return this;
  }
  _.currentState = function() {
    return {
      checked: this.checked
    }
  }
  _.restoreState = function(data) {
    this.checked = data.checked;
    this.updateCheckbox();
  }
});


