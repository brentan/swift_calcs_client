var text = P(EditableBlock, function(_, super_) {
  _.klass = ['text'];
  _.textField = 0;

  _.init = function(html) {
    super_.init.call(this);
    this.html = html || '';
  }
  _.innerHtml = function() {
    return "<div class='" + css_prefix + "wysiwyg'></div>";
  }
  _.postInsertHandler = function() {
    this.textField = new WYSIWYG(this.jQ.find('.' + css_prefix + 'wysiwyg')[0], this, {});
    this.focusableItems = [[this.textField]];
    this.textField.html(this.html);
    var _this = this;
    this.textField.$editor.on('click', 'a', function(e) {
      if(_this.shft) {
        _this.shft = false;
        var url = $(this).attr('href');
        window.open(url, '_blank').focus();
      } else 
        showNotice('To open the link, hold "Shift" while clicking on the link');
      return false;
    });
    super_.postInsertHandler.call(this);
    return this;
  }
  _.focus = function(dir) {
    if(this.workspace.activeElement && (this.workspace.activeElement !== this)) {
      this.workspace.activeElement.blurred = false;
      this.workspace.activeElement.blur();
    } 
    super_.focus.call(this);
    this.workspace.attachToolbar(this, this.workspace.toolbar.textToolbar());
    this.textField.toolbar = $('#toolbar');
    this.textField.focus(dir || 0);
    return this;
  }
  _.append = function(html) {
    this.textField.html(this.textField.html() + html);
    return this;
  }
  _.prepend = function(html) {
    this.textField.html(html + this.textField.html());
    return this;
  }
  _.command = function(command, option) {
    var param = null;
    switch(command) {
      case 'normalFormat':
        var container = $(rangy.getSelection(this.textField.$editor[0]).getRangeAt(0).commonAncestorContainer);
        while(container.closest('.' + css_prefix + 'wysiwyg').length) {
          container = container.closest('h1,h2,h3,h4,h5,h6,blockquote');
          container.contents().unwrap();
        }
        this.textField.syncCode();
        return;
      case 'mathMode':
        rangy.getSelection(this.textField.$editor[0]).deleteFromDocument();
        if(cleanHtml(this.textField.html(), false) === '') {
          math().insertAfter(this).show(0).focus();
          this.remove();
        } else if(this.textField.endPosition()) {
          math().insertAfter(this).show(0).focus();
        } else if(this.textField.startPosition()) {
          math().insertBefore(this).show(0).focus();
        } else {
          this.textField.split();
          math().insertAfter(this).show(0).focus();
        }
        this.textField.syncCode();
        return;
      case 'createLink':
        param = prompt('Enter URL:');
        break;
      case 'fontSize':
        param = option;
        break;
      case 'backColor':
      case 'foreColor':
      case 'fontName':
        param = option;
        break;
      case 'H1':
      case 'H2':
      case 'H3':
      case 'BLOCKQUOTE':
        if((navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0))
          param = '<' + command + '>';
        else
          param = command;
        command = 'formatBlock';
        break;
    }
    window.document.execCommand(command, false, param);
    var font_tag = this.textField.$editor.find('font').first();
    if(font_tag.length > 0) {
      var new_tag = $('<span/>');
      var font_sizes = [0, 10, 12, 16, 18, 24, 32, 48];
      if(font_tag.attr('size')*1 > 0)
        new_tag.css('font-size', font_sizes[font_tag.attr('size')*1] + 'px');
      if(font_tag.attr('face'))
        new_tag.css('font-family', font_tag.attr('face'));
      if(font_tag.attr('color'))
        new_tag.css('color', font_tag.attr('color'));
      new_tag.html(font_tag.html());
      font_tag.replaceWith(new_tag);
      var range = rangy.createRange();
      range.selectNodeContents(new_tag[0]);
      range.select();
    }
    this.textField.syncCode();
  }
  _.changeToMath = function() {
    this.mark_for_deletion = true;
    var el = math().insertAfter(this).show().focus(R);
    this.remove(0);
  }
  _.merge = function() {
    // This assumes that the element to the left is a textelement, and will merge this element into that one, then place the cursor
    var left = cleanHtml(this[L].toString());
    var line_break = '<br>';
    var to_text = this.textField.html();
    if((to_text == '') && (left.slice(-4).toLowerCase() != '<br>'))
      to_text = '<br>';
    if((to_text != '') && (left.slice(-4).toLowerCase() == '<br>')) 
      line_break = '';
    var el = this[L].append(line_break + '<span id="place_caret"></span>' + to_text).focus();
    var $span = this[L].jQ.find('#place_caret');
    range = rangy.createRange();
    range.setStartBefore($span[0]);
    range.setEndBefore($span[0]);
    range.select();
    $span.remove();
    this.remove(0);
  }
  _.toString = function() {
    return this.textField.html();
  }
  /*
   Text mouse handling is special...text boxes are HTML5 content-editable elements, so they
   Handle everything for us.  Our only goal is to recognize when the mouse moves out of
   the element during an interaction, and when that happens, we have to handle the mouse event.  
   The 'mouse_events'.js pays attention to whether this is a text element, and if it is
   it will allow the bubble whenever 'false' is returned by these mouse events (no other element type
   can force a bubble in this way)
  */
  _.mouseMove = function(e) {
    var text_field = $(e.target).closest('div.' + css_prefix + 'wysiwyg');
    if(text_field.length) 
      var new_target = this.textField;
    else
      var new_target = -1;
    if(this.start_target === 0) 
      this.start_target = new_target;
    // Are we clicking/dragging within the area?
    if((this.start_target == new_target) && (this.start_target === -1)) {
      this.workspace.selectionChanged(true);
      return false; //We aren't really doing anything...
    } else if(this.start_target == new_target) {
      // Pass control to the textField (by returning false, we prevent bubbling), since we are click/dragging within it
      this.focus(); 
      return false;
    } else { //We clicked in one area and dragged to another, just select the whole element
      this.workspace.blurToolbar();
      return true;
    }
  }
  _.mouseDown = function(e) {
    this.start_target = -1;
    var text_field = $(e.target).closest('div.' + css_prefix + 'wysiwyg');
    if(text_field.length) {
      this.start_target = this.textField;
      this.textField.dir = 0;
    }
  }
  _.mouseUp = function(e) {
    var text_field = $(e.target).closest('div.' + css_prefix + 'wysiwyg');
    if(text_field.length) 
      var new_target = this.textField;
    else
      var new_target = -1;
    // Are we clicking/dragging within the area?
    if((this.start_target == new_target) && (this.start_target === -1)) 
      return this.mouseClick(e); //We aren't really doing anything...
    else if(this.start_target == new_target) {
      // Pass control to the textField, since we are click/dragging within it
      this.focus()
      return false;
    } else  //We clicked in one area and dragged to another, just select the whole element
      return true;
  }
  _.mouseOut = function(e) {
    this.workspace.blurToolbar();
  }
  _.mouseClick = function(e) {
    if(super_.mouseClick.call(this,e)) return true;
    this.focus(R);
    return false;
  }
  _.cut = function(e) { 
    super_.cut.call(this,e);
    return false;
  }
  _.copy = function(e) { 
    super_.copy.call(this,e);
    return false;
  }
});

/**
 * Basic WYSIWYG Editor used for 'text' blocks
 * Code developed based on:
 * Trumbowyg v1.1.6 - A lightweight WYSIWYG editor
 * Trumbowyg core file
 * ------------------------
 * @link http://alex-d.github.io/Trumbowyg
 * @license MIT
 * @author Alexandre Demode (Alex-D)
 *         Twitter : @AlexandreDemode
 *         Website : alex-d.fr
 */

var WYSIWYG = P(function(_) {
  _.blurred = true;
  _.saveOnFocus = false;
  _.init = function(editorElem, parentElement, opts) {
    var t = this;
    t.el = parentElement;
    // Get the document of the element. It use to makes the plugin
    // compatible on iframes.
    t.doc = editorElem.ownerDocument || document;
    // jQuery object of the editor
    t.$e = $(editorElem);
    t.$creator = $(editorElem);

    // Defaults Options
    t.o = $.extend(true, {}, {
    }, opts);

    t.height = t.$e.css('height');

    t.buildEditor();
  };

  _.buildEditor = function(disable) {
    var t = this,
      pfx = css_prefix;
      html = '';
    t.$box = $('<div/>', {
      class: pfx + 'box ' + pfx + 'wysiwyg_holder'
    });

    t.$editor = t.$e;
    t.$e = t.buildTextarea().val(t.$e.val());
    t.isTextarea = false;
    t.checkOnSpace = false;
    t.$e.hide().addClass(pfx + 'textarea');

    html = t.$editor.html();
    t.$box.insertAfter(t.$editor)
         .append(t.$e)
         .append(t.$editor);
    t.syncCode();

    t.$editor.addClass(pfx + 'editor')
          .attr('contenteditable', true)
          .attr('dir', 'ltr')
          .html(html);

    t.$editor 
    .on('keypress', function(e) {
      var ch = String.fromCharCode(e.which);
      if(t.el.workspace.selection.length > 0) {
        e.preventDefault();
        t.el.workspace.replaceSelection(math(ch), true);
        return;
      }
      if((ch == '.') || (ch == ':') || (ch == '-')) t.checkOnSpace = true;
    })
    .on('keydown', function(e){
      var key = stringify(e);
      if(t.el.workspace.selection.length > 0)
        return t.el.workspace.keystroke(key, e);
      if(key.match(/Shift-.*/))
        t.el.shft = true;
      switch (key) {
        case 'Ctrl-O':
        case 'Meta-O':
          window.openFileDialog();
          e.preventDefault();
          break;
        case 'Ctrl-S':
        case 'Meta-S':
          t.el.workspace.save(true);
          e.preventDefault();
          break;
        case 'Shift-Tab':
          var li_parent = t.isSelectionInsideElement('li');
          if(li_parent && rangy.getSelection(t.$editor[0]).getRangeAt(0).collapsed) {
            var range = rangy.getSelection(t.$editor[0]).getRangeAt(0).cloneRange();
            var startContainer = range.startContainer;
            var startOffset = range.startOffset;
            range.setStart(li_parent,0)
            if(cleanHtml(range.toHtml(), false).length == 0) {
              var holder = $(li_parent).parent('ul, ol');
              var ul = holder.is('ul');
              if(holder.parent('ul, ol').length > 0) {
                var previous_items = $(li_parent).prevAll();
                var next_items = $(li_parent).nextAll();
                if(previous_items.length)
                  $(ul ? '<ul></ul>' : '<ol></ol>').append(previous_items).insertBefore(holder);
                $(li_parent).insertBefore(holder);
                if(next_items.length)
                  $(ul ? '<ul></ul>' : '<ol></ol>').append(next_items).insertBefore(holder);
                range.setStart(startContainer, startOffset);
                range.collapse(true);
                range.select();
                holder.remove();
              }
            }
          }
          e.preventDefault();
          break;
        case 'Tab':
          var li_parent = t.isSelectionInsideElement('li');
          if(li_parent && rangy.getSelection(t.$editor[0]).getRangeAt(0).collapsed) {
            var range = rangy.getSelection(t.$editor[0]).getRangeAt(0).cloneRange();
            var startContainer = range.startContainer;
            var startOffset = range.startOffset;
            range.setStart(li_parent,0)
            if(cleanHtml(range.toHtml(), false).length == 0) {
              if($(li_parent).next().is('ul, ol') && $(li_parent).prev().is('ul, ol')) {
                // merge the preceeding, suceeding lists
                var next = $(li_parent).next();
                var prev = $(li_parent).prev();
                $(li_parent).appendTo(prev);
                next.children('li').appendTo(prev);
                next.remove();
              } else if($(li_parent).prev().is('ul, ol')) {
                // merge to preceeding list
                $(li_parent).appendTo($(li_parent).prev());
              } else if($(li_parent).next().is('ul, ol')) {
                // merge to suceeding list
                $(li_parent).prependTo($(li_parent).next());
              } else {
                var ul = $(li_parent).parent('ul, ol').is('ul');
                $(li_parent).wrap(ul ? '<ul></ul>' : '<ol></ol>');
              }
              range.setStart(startContainer, startOffset);
              range.collapse(true);
              range.select();
              e.preventDefault();
              break;
            }
          }
        case 'Spacebar':
          if(t.checkOnSpace && rangy.getSelection(t.$editor[0]).getRangeAt(0).collapsed && !t.isSelectionInsideElement('li') && t.magicCommands()) {
            e.preventDefault();
            break;
          }
          if(key == 'Spacebar') break;
          // This is now tab behavior
          // If there is nothing to the right, I need to add a <br> character at the end, but position cursor before it
          t.write('<span style="margin-right:40px;"></span>&nbsp;<span id="move_caret"></span>' + (t.endPosition(true) ? '<br>' : ''));
          var $span = t.$editor.find('#move_caret');
          range = rangy.createRange();
          range.setStartBefore($span[0]);
          range.setEndBefore($span[0]);
          range.select();
          $span.remove();
          e.preventDefault();
          break;
        case 'Shift-Enter':
        case 'Ctrl-Enter':
        case 'Enter':
          // Delete whatever is highlighted
          rangy.getSelection(t.$editor[0]).deleteFromDocument();
          // First see if we are in a list.  If so, enter should add a new bullet
          if(t.isSelectionInsideElement('li')) {
            break; // Default behavior is wanted within a list item
          } else if(t.startPosition()) {
            // Our behavior is dependant on where the cursor is on the line
            // Start of text box.  Insert a math box before this, but hold focus here
            math().insertBefore(t.el).show();
          } else {
            break;
            /* 
            // Attempt to handle line breaks myself, since browser do it differently.  IS THIS NEEDED??
            var range = rangy.getSelection(t.$editor[0]).getRangeAt(0).cloneRange();
            var $span = $('<span/>');
            $span.appendTo(t.$editor);
            range.setEndBefore($span[0]);
            var html = cleanHtml(range.toHtml());
            $span.remove();
            //just add a line break
            t.write('<br><span id="move_caret"></span>');
            var $span = t.$editor.find('#move_caret');
            range = rangy.createRange();
            range.setStartBefore($span[0]);
            range.setEndBefore($span[0]);
            range.select();
            $span.remove();
            */
          }
          e.preventDefault(); 
          break;
        case 'Ctrl-Shift-A':
        case 'Meta-Shift-A':
          // Select everything
          t.el.workspace.selectAll();
          t.el.mouseOut({});
          t.el.workspace.focus();
          e.preventDefault();
          break;
        case 'Ctrl-Shift-Backspace':
        case 'Ctrl-Backspace':
        case 'Shift-Backspace':
        case 'Backspace':
          if(!rangy.getSelection(t.$editor[0]).getRangeAt(0).collapsed) return;
          // Check if we are in first spot.  If so, delete backwards OR highlight block
          if(t.startPosition()) {
            if(cleanHtml(t.html(), false) === '') {
              if(t.el.moveOutLeftRight(t.el.textField, L)) 
                t.el.remove(0); //Only delete me if I successfully moved into a neighbor
              else
                t.el.changeToMath(); //Otherwise, turn me into a math block
            } else {
              if(rangy.getSelection(t.$editor[0]).getRangeAt(0).collapsed && t.isSelectionInsideElement('li')) {
                t.$editor.prepend('<span id="temp_span">&#8203;</span>');
                window.setTimeout(function() {
                  t.$editor.find('#temp_span').remove();
                });
                break;
              } else if(t.el[L]) {
                t.el.workspace.selectDir(t.el[L],L);
                t.el.workspace.focus();
              }
            }
            e.preventDefault();
          }
          break;
        case 'Ctrl-Shift-Del':
        case 'Ctrl-Del':
        case 'Shift-Del':
        case 'Del':
          if(!rangy.getSelection(t.$editor[0]).getRangeAt(0).collapsed) return;
          // Same as above, but at the end position
          if(t.endPosition()) {
            if(cleanHtml(t.html(), false) === '') {
              if(t.el.moveOutLeftRight(t.el.textField, R)) t.el.remove(0); //Only delete me if I successfully moved into a neighbor
            } else {
              if(t.el[R]) {
                t.el.workspace.selectDir(t.el[R],R);
                t.el.workspace.focus();
              }
            }
            e.preventDefault();
          }
          break;
        case 'Left':
          // If already at start, move into previous element
          if(t.startPosition() && t.el.moveOutLeftRight(t.el.textField, L))
            e.preventDefault();
          break;
        case 'Right':
          // If already at end, move into next element
          if(t.endPosition() && t.el.moveOutLeftRight(t.el.textField, R))
            e.preventDefault();
          break;
        case 'Up':
          // If on top line, move up to previous item
          if(t.firstLine() && t.el.moveOutUpDown(t.el.textField, L, t.caretOffset().left))
            e.preventDefault();
          break;
        case 'Down':
          // If on bottom line, move down to next item
          if(t.lastLine() && t.el.moveOutUpDown(t.el.textField, R, t.caretOffset().left))
            e.preventDefault();
          break;
        case 'Shift-Home':
        case 'Ctrl-Shift-Home':
        case 'Shift-Left':
        case 'Shift-Up':
          if(t.startPosition()) {
            t.el.workspace.selectDir(t.el, L);
            t.el.workspace.selectionChanged();
            t.el.workspace.activeElement = t.el;
            e.preventDefault();
          }
          break;
        case 'Shift-End':
        case 'Ctrl-Shift-End':
        case 'Shift-Down':
        case 'Shift-Right':
          if(t.endPosition()) {
            t.el.workspace.selectDir(t.el, R);
            t.el.workspace.selectionChanged();
            t.el.workspace.activeElement = t.el;
            e.preventDefault();
          }
          break;
      } 
      t.checkOnSpace = false;
    })
    .on('focus', function(){
      t.focus();
    })
    .on('blur', function(){
      t.blurred = true;
      if(!t.el.blurred) t.el.blur();
    })
    .on('keyup', function() {
      t.syncCode();
      t.el.shft = false;
    })
    .on('paste', function(e) {
      if(t.el.workspace.selection.length > 0) {
        // If something is highlighted in the workspace, just pass control up to the workspace paste handler
        t.el.workspace.pasteHandler(e);
      } else {
        if(window.clipboardData)
          var to_paste = window.clipboardData.getData('Text');
        else
          var to_paste = e.originalEvent.clipboardData.getData('text/plain');
        if((to_paste.slice(0,11) == 'SWIFTCALCS:') || (to_paste.slice(0,6) == 'latex{')) {
          // This is a paste from a mathquill elements, OR it is a Swiftcalcs selection paste. 
          if(t.html().trim() == '')
            t.el.workspace.selection = [t.el];
          else {
            t.split();
            var temp_el = text().insertAfter(t.el).show();
            t.el.workspace.selection = [temp_el];
          }
          // Redirect the paste event to the workspace textarea, which will then handle it
          t.el.workspace.pasteHandler(e);
        } else {
          // SyncCode after paste
          function syncAfterPaste() {
            t.write('<span class="caret_position" style="display:none;">&#65279;</span>');
            t.syncCode();
            t.sanitize();
            var caret = t.$editor.find('.caret_position');
            if(caret.length > 0) {
              var range = rangy.createRange();
              range.selectNode(caret[0]);
              range.select();
              rangy.getSelection(t.$editor[0]).deleteFromDocument();
              t.$editor.find('.caret_position').remove();
            }
          }
          window.setTimeout(syncAfterPaste);
        }
      }
      return true;
    }); 
  };
  _.focus = function(dir, dir2) {
    if(this.el.blurred) return this.el.focus(dir);
    this.el.workspace.unblurToolbar();
    if(this.blurred) {
      this.blurred = false;
      var start_scroll = this.el.workspace.jQ.scrollTop();
      this.$creator.focus(); 
      this.el.workspace.jQ.scrollTop(start_scroll);
    }
    try {
      if(dir === L) {
        this.select(0);
        this.scrollToMe(L);
      } else if(dir === R) {
        this.select(R);
        this.scrollToMe(R);
      } else if(dir > 1) {
        this.setCaretFromXdir(dir, dir2);
        this.scrollToMe(dir2);
      }
    } catch(e) {
    }
    this.updateToolbar();
  }
  _.scrollToMe = function(dir) {
    if(this.$editor) {
      var top = this.$editor.position().top;
      var bottom = top + this.$editor.height();
      var to_move_top = Math.min(0, top);
      var to_move_bot = Math.max(0, bottom - this.el.workspace.jQ.height()+20);
      if((to_move_bot > 0) && (to_move_top < 0)) {
        if(dir === R)
          this.el.workspace.jQ.scrollTop(this.el.workspace.jQ.scrollTop() + to_move_bot);
        else
          this.el.workspace.jQ.scrollTop(this.el.workspace.jQ.scrollTop() + to_move_top);
      } else
        this.el.workspace.jQ.scrollTop(this.el.workspace.jQ.scrollTop() + to_move_top + to_move_bot);
    }
    return this;
  }
  _.magicCommands = function() {
    // Magic Commands checks if the line conforms to one of the magic commands and if so, will
    // transform that line into the specified command.  For example '1. ' becoming a <ol>
    // Returns 'true' if a transformation was done, otherwise returns false.
    var range = rangy.getSelection(this.$editor[0]).getRangeAt(0).cloneRange();
    var $span = $('<span/>');
    $span.prependTo(this.$editor);
    range.setStartAfter($span[0]);
    var html = cleanHtml(range.toHtml()).replace(/<\/div>/gi,'').slice(-20);
    var front = '';
    $span.remove();
    if(html.match(/<(br|div)>[ \t]*[0-9]+[.\-:]$/i) || html.match(/^[ \t]*(&#8203;)?[0-9]+[.\-:]$/)) {
      if(html.match(/^[ \t]*[0-9]+[.\-:]$/)) front = '&#8203;';
      this.replaceToBeginningOfLine(front + "<ol><li><span id='caret_position'>OK</span></li></ol>");
      return true;
    } else if(html.match(/<(br|div)>[ \t]*-?[.\-:]$/i) || html.match(/^[ \t]*(&#8203;)?-?[.\-:]$/)) {
      if(html.match(/^[ \t]*-?[.\-:]$/)) front = '&#8203;';
      this.replaceToBeginningOfLine(front + "<ul><li><span id='caret_position'>OK</span></li></ul>");
      return true;
    } 
    return false;
  }
  // Will replace from the caret position to the line start with the provided HTML.  If
  // move_cursor is true, the html should contain a <span id='caret_position'></span> and
  // The caret will be inserted there (and the span removed)
  _.replaceToBeginningOfLine = function(html) {
    // Select from caret to beginning of line
    var range = rangy.getSelection(this.$editor[0]).getRangeAt(0).cloneRange();
    var $span = $('<span/>');
    $span.prependTo(this.$editor);  
    range.setStartAfter($span[0]);
    while(true) {
      var up_to = cleanHtml(range.toHtml()).replace(/<\/div>/ig, '');
      if(up_to.match(/<(br|div)\/?>$/i)) break;
      if(range.endOffset > 0)
        range.setEnd(range.endContainer, range.endOffset - 1);
      else
        range.setEndBefore(range.endContainer);
    }
    range.collapse(false);
    var cur_range = rangy.getSelection(this.$editor[0]).getRangeAt(0);
    range.setEnd(cur_range.endContainer, cur_range.endOffset);
    range.select();
    // Delete the selection
    rangy.getSelection(this.$editor[0]).deleteFromDocument();
    if(rangy.getSelection(this.$editor[0]).rangeCount == 0) {
      this.$editor.html('<span id="temp_span">&nbsp;</span>');
      // We just deleted out of the entire text editor.  I believe this occurs when the 'deleteFromDocument' range has the whole thing selected.  Try to select something at same start point
      range.selectNodeContents(this.$editor[0]);
      range.select();
    }
    this.write(html);
    this.$editor.find('#temp_span').remove();
    if(html.indexOf("caret_position") > -1) {
      range = rangy.createRange();
      var el = this.$editor.find('span#caret_position');
      range.setStartBefore(el[0]);
      range.setEndBefore(el[0]);
      range.select();
      el.remove();
    }
  }
  _.isSelectionInsideElement = function(tagName) {
    tagName = tagName.toUpperCase();
    var containerNode = rangy.getSelection(this.$editor[0]).getRangeAt(0).commonAncestorContainer;
    while (containerNode) {
      if (containerNode.nodeType == 1 && containerNode.tagName == tagName) 
        return containerNode;
      containerNode = containerNode.parentNode;
    }
    return false;
  }
  _.split = function() {
    var t = this;
    rangy.getSelection(t.$editor[0]).deleteFromDocument();
    t.select_to(R);
    var to_move = rangy.getSelection(t.$editor[0]).toHtml();
    if(cleanHtml(to_move).slice(0,4).toLowerCase() == '<br>') to_move = to_move.replace(/<[bB]+[rR]+\/?>/,'');
    rangy.getSelection(t.$editor[0]).deleteFromDocument();
    text(to_move).insertAfter(t.el).show();
    t.syncCode();
  }
  // Build the Textarea which contain HTML generated code
  _.buildTextarea = function() {
    return $('<textarea/>', {
      name: this.$e.attr('id'),
      height: this.height
    });
  };

  // Destroy the editor
  _.destroy = function(){
    var t = this,
      pfx = css_prefix,
      h = t.height,
      html = t.html();

    t.$box.after(
      t.$editor
        .css({ height: h })
        .removeClass(pfx + 'editor')
        .removeAttr('contenteditable')
        .html(html)
        .show()
    );

    t.$box.remove();
  };

  // Is the editor Empty ?
  _.empty = function(){
    return (this.$e.val().trim() == '') || (this.$e.val().trim() == '<br>');
  };

  // Function call when click on viewHTML button
  _.toggle = function(){
    var t = this,
      pfx = css_prefix
    t.syncCode(false);
    t.$editor.toggle();
    t.$e.toggle();
  };

  // HTML Code management
  _.html = function(html){
    var t = this;
    if(html){
      t.$e.val(html);
      t.syncCode(true);
      return t;
    } else
      return t.$e.val();
  };
  _.sanitize = function() {
    //BRENTAN: Sanitize breaks the browser undo stack.  We need to work with that here!
    var blocks = sanitize(this.html());
    if((blocks.length == 1) && (blocks[0] instanceof text)) {
      this.html(blocks[0].html);
    } else {
      for(var i = 0; i < blocks.length; i++)
        blocks[i].insertBefore(this.el);
      this.el.remove();
    }
  }
  _.syncCode = function(force){
    var t = this;
    if(!force && t.$editor.is(':visible')) {
      t.$e.val(t.$editor.html());
      t.el.workspace.save();
    }
    else
      t.$editor.html(t.$e.val());
    t.updateToolbar();
  };
  _.updateToolbar = function() {
    if(this.blurred) return;
    if(!this.toolbar) return;
    this.toolbar.find('.highlight').removeClass('highlight');
    if(document.queryCommandState('bold'))
      this.toolbar.find('.bold').addClass('highlight');
    if(document.queryCommandState('italic'))
      this.toolbar.find('.italic').addClass('highlight');
    if(document.queryCommandState('underline'))
      this.toolbar.find('.underline').addClass('highlight');
    if(document.queryCommandState('strikeThrough'))
      this.toolbar.find('.strikethrough').addClass('highlight');
    if(document.queryCommandState('justifyCenter'))
      this.toolbar.find('.justifyCenter').addClass('highlight');
    if(document.queryCommandState('justifyRight'))
      this.toolbar.find('.justifyRight').addClass('highlight');
    if(document.queryCommandState('justifyFull'))
      this.toolbar.find('.justifyFull').addClass('highlight');
    if(document.queryCommandState('justifyLeft'))
      this.toolbar.find('.justifyLeft').addClass('highlight');
    this.toolbar.find('.foreColor').css('border-bottom-color',document.queryCommandValue('foreColor'));
    this.toolbar.find('.backColor').css('border-bottom-color',document.queryCommandValue('backColor'));
    try { this.toolbar.find('.fontName').html(document.queryCommandValue('fontName').split(',')[0].replace(/'/g,"")); } catch(e) {}
    this.toolbar.find('.fontSize').html(document.queryCommandValue('fontSize'));

  }
  /*
   * Caret/Selection positioning functions.  These rely on the rangy.js library from Tim Down,
   * That library provides cross-browser support, but is a bit large, so I include notes on how.  
   * to remove the dependency for it (doing so however will make this IE 9+ only).
   */
  // Get the X/Y coordinates of the caret position on the page (relative to document window)...
  _.caretOffset = function() {
    var sel = rangy.getSelection(this.$editor[0]); // Replace with var sel = window.getSelection(); to remove rangy
    var span = $("<span>&#8203;</span>"); //zero width space
    sel.getRangeAt(0).insertNode(span[0]);
    var offset = span.offset();
    offset.bottom = offset.top + span.height();
    span.remove();
    return offset;
  }
  // Will return true if the caret is currently on the first line (estimated based on x,y coordinates)
  _.firstLine = function() {
    var t = this;
    var editor_offset = t.$editor.offset();
    editor_offset.bottom = editor_offset.top + t.$editor.height();
    var caret_offset  = t.caretOffset();
    return Math.abs(editor_offset.top - caret_offset.top) < 8;
  }
  // Will return true if the caret is currently on the last line (estimated based on x,y coordinates)
  _.lastLine = function() {
    var t = this;
    var editor_offset = t.$editor.offset();
    editor_offset.bottom = editor_offset.top + t.$editor.height();
    var caret_offset  = t.caretOffset();
    return Math.abs(editor_offset.bottom - caret_offset.bottom) < 8;
  }
  // True if cursor is at start
  _.startPosition = function() {
    var range = rangy.getSelection(this.$editor[0]).getRangeAt(0).cloneRange();
    range.collapse(true);
    var $span = $('<span/>');
    $span.prependTo(this.$editor);  
    range.setStartAfter($span[0]);
    var start = cleanHtml(range.toHtml(), false) == '';
    $span.remove();
    return start;
  }
  _.endPosition = function(true_end) {
    if(typeof true_end === 'undefined') true_end = false;
    var range = rangy.getSelection(this.$editor[0]).getRangeAt(0).cloneRange();
    range.collapse(false);
    var $span = $('<span/>');
    $span.appendTo(this.$editor);
    range.setEndBefore($span[0]);
    var html = cleanHtml(range.toHtml());
    var at_end = (html == '') || (!true_end && (html.toLowerCase() == '<br>'));
    $span.remove();
    return at_end;
  }
  // Insert html just after cursor location
  _.write = function(html, move_cursor) {
    var el = $('<div/>');
    el.html(html);
    var frag = document.createDocumentFragment(), node;
    while ( (node = el[0].firstChild) ) {
        lastNode = frag.appendChild(node);
    }
    var range = rangy.getSelection(this.$editor[0]).getRangeAt(0).cloneRange(); // replace 'rangy' with 'window' to remove rangy.js
    range.collapse(false);
    range.insertNode(frag);
    range.detach();
    if(move_cursor)
      range.setEndAfter(frag);
    this.syncCode();
  }
  // This function will place the cursor in the div, and select to the left or right edge based on input (1, -1)
  _.select = function(position) {
    var range = rangy.createRange();
    if(position === R) {   
      range.selectNodeContents(this.$editor[0]); 
      range.collapse(false); 
    } else {
      range.selectNodeContents(this.$editor[0]); 
      range.collapse(true);
    }
    rangy.getSelection().setSingleRange(range);
  };
  _.select_to = function(dir) {
    // Assume the cursor is already in the contenteditable.  Will select from cursor position to start/end based on input dir L/R
    var range = rangy.getSelection(this.$editor[0]).getRangeAt(0).cloneRange();
    var $span = $('<span/>');
    if(dir === L) {
      $span.prependTo(this.$editor);
      range.setStartAfter($span[0]);
    } else if (dir === R) {
      $span.appendTo(this.$editor);
      range.setEndBefore($span[0]);
    }
    rangy.getSelection().setSingleRange(range);
    $span.remove();
  }
  // Browser's havent gotten their act together yet about placing the caret based on x,y position.  So we have to do some hacky stuff to make this work
  // We do this for when we move the caret into the text area from an element above or below, which passes us the x position relative to the document
  _.setCaretFromXdir = function(x,dir) {
    var html = this.html();
    if(html.length === 0) return;
    html = html.replace(/&([#a-z0-9]+);/g, "<&$1;>"); // HTML entities, wrap in <> so we skip them, but unwrap later
    var start_pos = dir === L ? 0 : html.length;
    var new_html = '';
    var start_bracket = dir === L ? '<' : '>';
    var end_bracket = dir === R ? '<' : '>';
    var in_bracket = false;
    var new_x = dir === L ? -50 : 500000;
    var last_x = new_x;
    var offset = {};
    var new_y = dir === R ? -50 : 500000;
    var last_y = new_y;
    var use_last = false;
    var last_pos = start_pos;
    for(var pos = start_pos; true; pos = pos - dir) {
      next_char = dir === L ? html.slice(pos-1, pos) : html.slice(pos, pos+1);
      if(next_char === start_bracket) in_bracket = true;
      if(next_char === end_bracket) in_bracket = false;
      if(!in_bracket) {
        new_html = html.slice(0,pos) + '<span id="find_caret">&#8203;</span>' + html.slice(pos);
        new_html = new_html.replace(/<&([#a-z0-9]+);>/g, "&$1;");
        this.$editor.html(new_html);
        offset = this.$editor.find('#find_caret').offset();
        new_x = offset.left;
        new_y = offset.top;
        if(((dir === L) && (new_x > x)) || ((dir === R) && (new_x < x))) {
          //match!
          if(Math.abs(new_x - x) > Math.abs(last_x - x))
            use_last = true;
          break;
        } else if(((dir === L) && (new_x < last_x)) || ((dir == R) && (new_x > last_x))) {
          // reached a new line!
          use_last = true;
          break;
        } else if((new_x == last_x) && (((dir === L) && (new_y > last_y)) || ((dir === R) && (new_y < last_y)))) {
          // reached a new line!
          use_last = true;
          break;
        }
        last_pos = pos;
        last_x = new_x;
        last_y = new_y;
      }
      if((pos != start_pos) && ((pos === 0) || (pos === html.length))) 
        break;
    }
    if(use_last && (html.slice(last_pos).length > 0)) {
      pos = last_pos;
      new_html = html.slice(0,pos) + '<span id="find_caret">&#8203;</span>' + html.slice(pos);
      new_html = new_html.replace(/<&([#a-z0-9]+);>/g, "&$1;");
      this.$editor.html(new_html);
    }
    var $span = this.$editor.find('#find_caret');
    var range = rangy.createRange();
    range.setStartBefore($span[0]);
    range.setEndBefore($span[0]);
    rangy.getSelection().setSingleRange(range);
    $span.remove();
  }

});

var cleanHtml = SwiftCalcs.cleanHtml = function(html, keep_br_div) {
  if(typeof keep_br_div === 'undefined') keep_br_div = true;
  // This function strips all html elements out, except <br> and div
  if(keep_br_div) html = html.replace(/<(\/?)(br|div)\/?>/ig, "LEFT_$1$2_RIGHT");
  html = html.replace(/<[^<>]*>/g,'');
  if(keep_br_div) html = html.replace(/LEFT_(\/?)(br|div)_RIGHT/ig, "<$1$2>");
  return html;
}
