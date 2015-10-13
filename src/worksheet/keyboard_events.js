/********************************************************
 * Event listerns for the keyboard, to deal with keypresses
 * Note that the actual listeners are in 'saneKeyboardEvents',
 * which is borrowed from the Mathquill source and is an API
 * that cleanly deals with cross-browser issues.  We feed it
 * a hidden textarea to bind events to, as well as the worksheet
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

Worksheet.open(function(_) {
  _.pasting = false;
  _.bindKeyboard = function() {
    if(this.bound) return this;
    // First create a textarea which we focus, and to which we bind all events
    var textareaSpan = this.textareaSpan = $('<span class="' + css_prefix + 'textarea"></span>');
    var textarea = $('<textarea>')[0];
    textarea = this.textarea = $(textarea).appendTo(textareaSpan);
    var richarea = $('<div>')[0];
    $(richarea).attr('contenteditable', 'true');
    $(richarea).appendTo(textareaSpan);

    // Bind keyboard events to this textarea
    var keyboardEventsShim = saneKeyboardEvents(textarea, richarea, this);
    this.selectFn = function(text) { keyboardEventsShim.select(text); };

    // Insert into the DOM, attach cut/copy listeners (paste is in saneKeyboardEvents)
    var _this = this;
    $('body').append(textareaSpan)
    .on('cut', function(e) { _this.cut(e.originalEvent); })
    .on('copy', function(e) { _this.copy(e.originalEvent); });
    
    var blurTimeout;
    var _this = this;
    textarea.focus(function() {
      if(_this.pasting) return;
      _this.blurred = false;
      if(_this.activeElement && !(_this.activeElement instanceof text)) _this.activeElement.focus();
      _this.insertJQ.find('.' + css_prefix + 'blur').removeClass(css_prefix + 'blur');
      clearTimeout(blurTimeout);
      console.log('focus');
    }).blur(function() {
      if(_this.pasting) return;
      _this.blurred = true;
      blurTimeout = setTimeout(function() { // wait for blur on window.  If its not, then run this function (in-window blur)
        if(_this.activeElement && !(_this.activeElement instanceof text)) _this.activeElement.blur();
        if(!_this.dragging && !_this.mousedown) _this.clearSelection();
        console.log('total blur');
        blur();
      });
      $(window).on('blur', windowBlur);
    });
    function windowBlur() { // blur event also fired on window, just switching
      clearTimeout(blurTimeout); // tabs/windows, not intentional blur
      _this.insertJQ.find('.' + css_prefix + 'selected').addClass(css_prefix + 'blur');
      if(_this.activeElement) _this.activeElement.windowBlur();
      blur();
      console.log('windowblur');
    }
    function blur() {
      setTimeout(function() { _this.lastActive = 0; },100);
      $(window).off('blur', windowBlur);
    }
    this.blurred = true;
    return this;
  }
  _.selectFn = function() { };
  _.unbindKeyboard = function() {
    if(this.bound) {
      $('body').off('cut').off('copy');
      this.textareaSpan.remove();
    }
    return this;
  }

  _.keystroke = function(description, evt) {
    // Total override commands:
    switch(description) {
      case 'Ctrl-Z':
      case 'Meta-Z':
        this.restoreUndoPoint();
        evt.preventDefault();
        return;
      case 'Ctrl-Y':
      case 'Meta-Y':
        this.restoreRedoPoint();
        evt.preventDefault();
        return;
      case 'Ctrl-O':
      case 'Meta-O':
        window.loadFolder();
        SwiftCalcs.giac.cancelEvaluations(); 
        evt.preventDefault();
        break;
      case 'Ctrl-S':
      case 'Meta-S':
        this.save(true);
        evt.preventDefault();
        break;
      case 'Ctrl-Shift-A':
      case 'Meta-Shift-A':
        // Select everything
        this.selectAll();
        if(this.activeElement) this.activeElement.mouseOut({});
        evt.preventDefault();
        return;
    }
    if(this.selection.length == 0) {
      if(this.activeElement) this.activeElement.keystroke(description, evt);
    } else {
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
          this.selection[0].focus(L).moveOutLeftRight(false,L);
          this.clearSelection();
          break;
        case 'Right':
          // move to end
          this.selection[this.selection.length - 1].focus(R);
          this.clearSelection();
          break;
        case 'Down':
          // move to end + 1
          this.selection[this.selection.length - 1].focus(R).moveOutLeftRight(false,R);
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
    if(this.selection.length == 0) {
      if(this.activeElement) this.activeElement.typedText(text);
    } else 
      this.replaceSelection(math(text), true);
  }
  var toClipboard = function(to_store, e) {
    if (window.clipboardData) 
      window.clipboardData.setData('Text', to_store);    
    else 
      e.clipboardData.setData('text/plain', to_store);
  }
  _.cut = function(e) {
    if(this.rights == 1) {
      e.preventDefault();
      return showNotice('Cut and Copy have been disabled for this Worksheet', 'red');
    }
    var skip_copy = false;
    if(this.selection.length == 0) {
      skip_copy = this.activeElement.cut(e);
      if(skip_copy) {
        toClipboard(this.clipboard, e);
        e.preventDefault();
      }
    } else {
      toClipboard('SWIFTCALCS:'+this.clipboard, e);
      e.preventDefault();
      this.deleteSelection(true, R);
    }
  }
  _.copy = function(e) {
    if(this.rights == 1) {
      e.preventDefault();
      return showNotice('Cut and Copy have been disabled for this Worksheet', 'red');
    }
    var skip_copy = false;
    if(this.selection.length == 0) {
      if(this.activeElement && this.activeElement.copy) {
        skip_copy = this.activeElement.copy(e);
        if(skip_copy) {
          toClipboard(this.clipboard, e);
          e.preventDefault();
        }
      }
    } else {
      toClipboard('SWIFTCALCS:'+this.clipboard, e);
      e.preventDefault();
    }
  }
  _.clipboard = "";
  _.paste = function(to_paste, html) { 
    if(this.selection.length == 0) {
      if(!this.activeElement) return;
      // See if we are pasting into a editable command block
      if(this.activeElement.focusedItem && (this.activeElement.focusedItem instanceof CommandBlock) && this.activeElement.focusedItem.editable) 
        return this.activeElement.focusedItem.paste(to_paste.replace(/\n/g,' '));
      // Nothing selected or selection is within the active element.  
      if((to_paste.slice(0,6) === 'latex{' && to_paste.slice(-1) === '}') || to_paste.match(/^[0-9\.]*$/)) {
        // This was a cut/copy -> paste from within a mathquill block, or is numeric in nature.  We should insert it into the current block, if possible, or insert it afterwards
        if(this.activeElement.focusedItem && this.activeElement.focusedItem.mathquill)
          return this.activeElement.write(to_paste);
        else {
          this.startUndoStream();
          var el = math().insertAfter(this.activeElement).show(0).focus(R).write(to_paste);
          this.endUndoStream();
          return el;
        }
      } else if(to_paste.slice(0,11) === 'SWIFTCALCS:') 
        var blocks = parse(to_paste.slice(11));
      else {
        var blocks = sanitize(html ? html : to_paste); 
      }
      this.startUndoStream();
      var after = this.activeElement;
      for(var i = 0; i < blocks.length; i++) {
        blocks[i].insertAfter(after).show(0);
        after = blocks[i];
      }
      if((this.activeElement instanceof math) && (this.activeElement.mathField.text() == '')) this.activeElement.remove(0);
      if(i > 0)
        blocks[i-1].moveInFrom(R);
      this.endUndoStream();
    } else {
      // Something was selected at paste at the element level or above...so we have to overwrite it
      if(to_paste.slice(0,6) === 'latex{' && to_paste.slice(-1) === '}') // This was a cut/copy -> paste from within a mathquill block.  We need to convert to a mathblock
        var blocks = [math(to_paste)];
      else if(to_paste.slice(0,11) === 'SWIFTCALCS:')
        var blocks = parse(to_paste.slice(11));
      else {
        var blocks = sanitize(html ? html : to_paste);
      }
      this.startUndoStream();
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
      this.endUndoStream();
    }
  }
});