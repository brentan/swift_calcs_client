/********************************************************
 * Event listerns for the keyboard, to deal with keypresses
 * Note that the actual listeners are in 'saneKeyboardEvents',
 * which is borrowed from the Mathquill source and is an API
 * that cleanly deals with cross-browser issues.  We feed it
 * a hidden textarea to bind events to, as well as the workspace
 * to call actions on.  The actions it will call are:
 *
 * keystroke(string description, event) - Called for all
 * key presses, but is meant to handle 'special' keypresses
 * such as 'ctrl-left' that dont lead to additions to the textarea
 *
 * typedText(text) - Called when new stuff is added into the 
 * textarea (actually characters like 'a' typed)
 *
 * paste(text) - Called when a paste action occurs that sends
 * stuff into the textarea
 * 
 * cut/copy actions are NOT bound in the saneKeyboardEvent
 * file and instead are done here.
 *
 * focus/blur actions on the textarea also should be bound 
 * here
 *******************************************************/

Workspace.open(function(_) {
  _.bindKeyboard = function() {
    if(this.bound) return this;
    // First create a textarea which we focus, and to which we bind all events
    var textareaSpan = this.textareaSpan = $('<span class="' + css_prefix + 'textareaDELETE"></span>');
    var textarea = $('<textarea>')[0];
    textarea = this.textarea = $(textarea).appendTo(textareaSpan);

    // Bind keyboard events to this textarea
    var keyboardEventsShim = saneKeyboardEvents(textarea, this);
    this.selectFn = function(text) { keyboardEventsShim.select(text); };

    // Insert into the DOM, attach cut/copy listeners (paste is in saneKeyboardEvents)
    var _this = this;
    this.insertJQ.prepend(textareaSpan)
    .on('cut', function() { _this.cut(); })
    .on('copy', function() { _this.copy(); });
    
    var blurTimeout;
    var _this = this;
    textarea.focus(function() {
      _this.blurred = false;
      if(_this.activeElement) _this.activeElement.focus();
      _this.insertJQ.find('.' + css_prefix + 'blur').removeClass(css_prefix + 'blur');
      clearTimeout(blurTimeout);
    }).blur(function() {
      _this.blurred = true;
      blurTimeout = setTimeout(function() { // wait for blur on window.  If its not, then run this function (in-window blur)
        if(_this.activeElement) _this.activeElement.blur();
        if(!_this.dragging) _this.clearSelection();
        blur();
      });
      $(window).on('blur', windowBlur);
    });
    function windowBlur() { // blur event also fired on window, just switching
      clearTimeout(blurTimeout); // tabs/windows, not intentional blur
      _this.insertJQ.find('.' + css_prefix + 'selected').addClass(css_prefix + 'blur');
      if(_this.activeElement) _this.activeElement.windowBlur();
      blur();
    }
    function blur() {
      $(window).off('blur', windowBlur);
    }
    this.blurred = true;
    return this;
  }
  _.selectFn = function() { };
  _.unbindKeyboard = function() {
    if(this.bound)
      this.textareaSpan.remove();
    return this;
  }

  _.keystroke = function(description, evt) {
    // Total override commands:
    switch(description) {
      case 'Ctrl-Shift-A':
      case 'Meta-Shift-A':
        // Select everything
        this.selectAll();
        if(this.activeElement) this.activeElement.mouseOut({});
        evt.preventDefault();
        return;
    }
    if(this.selection.length == 0)
      this.activeElement.keystroke(description, evt);
    else {
      switch (description) {
        case 'Ctrl-Shift-Backspace':
        case 'Ctrl-Backspace':
        case 'Shift-Backspace':
        case 'Backspace':
          // Delete.  If nothing is left, add an implicit block
          this.deleteSelection(true, R);
          break;
        case 'Ctrl-Shift-Del':
        case 'Ctrl-Del':
        case 'Shift-Del':
        case 'Del':
          // Delete.  If nothing is left, add an implicit block
          this.deleteSelection(true, R);
          break;
        case 'Enter':
          // Replace with new line
          this.replaceSelection(math(), true);
          break;
        case 'End':
        case 'Ctrl-End':
          // Move to end
          this.selection[this.selection.length - 1].focus(R);
          this.clearSelection();
          break;
        case 'Home':
        case 'Ctrl-Home':
          // Move to start
          this.selection[0].focus(L);
          this.clearSelection();
          break;
        case 'Shift-End':
        case 'Ctrl-Shift-End':
          // Select until end of current depth.  If alraedy there, move up to next depth
          this.selectToEndDir(this.activeElement, R);
          this.selectionChanged();
          break;
        case 'Shift-Home':
        case 'Ctrl-Shift-Home':
          // Select until beginning of current depth.  If already there, move up to next depth
          this.selectToEndDir(this.activeElement, L);
          this.selectionChanged();
          break;
        case 'Left':
          // move to start
          this.selection[0].focus(L);
          this.clearSelection();
          break;
        case 'Up':
          // move to start - 1
          this.selection[0].focus(L).moveOut(false,L);
          this.clearSelection();
          break;
        case 'Right':
          // move to end
          this.selection[this.selection.length - 1].focus(R);
          this.clearSelection();
          break;
        case 'Down':
          // move to end + 1
          this.selection[this.selection.length - 1].focus(R).moveOut(false,R);
          this.clearSelection();
          break;
        case 'Shift-Left':
        case 'Shift-Up':
          // select left/up
          this.selectDir(this.activeElement, L);
          this.selectionChanged();
          break;
        case 'Shift-Right':
        case 'Shift-Down':
          // select right/down
          this.selectDir(this.activeElement, R);
          this.selectionChanged();
          break;
        default:
          return;
      }
      evt.preventDefault();
    }
  }
  _.typedText = function(text) {
    if(this.selection.length == 0)
      this.activeElement.typedText(text);
    else 
      this.replaceSelection(math(text), true);
  }
  _.cut = function(e) {
    if(this.selection.length == 0)
      this.activeElement.cut(e);
    else
      this.deleteSelection(true, R);
  }
  _.copy = function(e) {
    if(this.selection.length == 0) this.activeElement.copy(e);
  }
  _.paste = function(text) {
    if(!this.activeElement) return;
    if(this.selection.length == 0) {
      // Nothing selected or selection is within the active element.  
      if(elementType(this.activeElement) === 'text') 
        this.activeElement.split(); // If pasting into text, we 'split' this element at the current cursor position first (and remove any selecton), then insert between the 2 text blocks that we created.  BRENTAN- WRITE SPLIT
      if(text.slice(0,6) === 'latex{' && text.slice(-1) === '}') {
        // This was a cut/copy -> paste from within a mathquill block.  We should insert it into the current block, if possible, or insert it afterwards
        if(elementType(this.activeElement) === 'math')
          return this.activeElement.write(text);
        else
          return math().insertAfter(this.activeElement).show(0).focus(R);
      }
      var blocks = parse(text);
      var after = this.activeElement;
      for(var i = 0; i < blocks.length; i++) {
        blocks[i].insertAfter(after).show(0);
        after = blocks[i];
      }
      if((this.activeElement instanceof math) && (this.activeElement.mathField.text() == '')) this.activeElement.remove(0);
      if(i > 0)
        blocks[i-1].moveInFrom(R);
      // BRENTAN: Paste will be a bit weird...if we start/end with a textblock, and we are pasting next to textblocks, we will
      // need to merge them together at the end of the paste, which is sorta crazy
    } else {
      // Something was selected at paste at the element level or above...so we have to overwrite it
      if(text.slice(0,6) === 'latex{' && text.slice(-1) === '}') // This was a cut/copy -> paste from within a mathquill block.  We need to convert to a mathblock
        var blocks = [math(text)];
      else
        var blocks = parse(text);
      if(blocks.length == 0) //Nothing to paste somehow...so just remove the highlighting and refocus
        this.deleteSelection(true, R);
      else {
        var after = blocks[0];
        this.replaceSelection(after);
        for(var i = 1; i < blocks.length; i++) {
          blocks[i].insertAfter(after).show(0);
          after = blocks[i];
        }
        blocks[i-1].moveInFrom(R);
      }
    }
  }
});