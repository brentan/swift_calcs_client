/*************************************************
 * Sane Keyboard Events Shim
 *
 * An abstraction layer wrapping the textarea in
 * an object with methods to manipulate and listen
 * to events on, that hides all the nasty cross-
 * browser incompatibilities behind a uniform API.
 *
 * Design goal: This is a *HARD* internal
 * abstraction barrier. Cross-browser
 * inconsistencies are not allowed to leak through
 * and be dealt with by event handlers. All future
 * cross-browser issues that arise must be dealt
 * with here, and if necessary, the API updated.
 *
 * Organization:
 * - key values map and stringify()
 * - saneKeyboardEvents()
 *    defer() and flush()
 *    event handler logic
 *    attach event handlers and export methods
 ************************************************/


// The following [key values][1] map was compiled from the
// [DOM3 Events appendix section on key codes][2] and
// [a widely cited report on cross-browser tests of key codes][3],
// except for 10: 'Enter', which I've empirically observed in Safari on iOS
// and doesn't appear to conflict with any other known key codes.
//
// [1]: http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#keys-keyvalues
// [2]: http://www.w3.org/TR/2012/WD-DOM-Level-3-Events-20120614/#fixed-virtual-key-codes
// [3]: http://unixpapa.com/js/key.html
var KEY_VALUES = {
  8: 'Backspace',
  9: 'Tab',

  10: 'Enter', // for Safari on iOS

  13: 'Enter',

  16: 'Shift',
  17: 'Control',
  18: 'Alt',
  20: 'CapsLock',

  27: 'Esc',

  32: 'Spacebar',

  33: 'PageUp',
  34: 'PageDown',
  35: 'End',
  36: 'Home',

  37: 'Left',
  38: 'Up',
  39: 'Right',
  40: 'Down',

  45: 'Insert',

  46: 'Del',

  144: 'NumLock',

  187: '='
};

// To the extent possible, create a normalized string representation
// of the key combo (i.e., key code and modifier keys).
function stringify(evt) {
  var which = evt.which || evt.keyCode;
  var keyVal = KEY_VALUES[which];
  var key;
  var modifiers = [];

  if (evt.ctrlKey) modifiers.push('Ctrl');
  if (evt.originalEvent && evt.originalEvent.metaKey) modifiers.push('Meta');
  if (evt.altKey) modifiers.push('Alt');
  if (evt.shiftKey) modifiers.push('Shift');

  key = keyVal || String.fromCharCode(which);
  if (!modifiers.length && !keyVal) return key;

  modifiers.push(key);
  return modifiers.join('-');
}

var saneKeyboardEvents = SwiftCalcs.saneKeyboardEvents = (function() {

  // create a keyboard events shim that calls callbacks at useful times
  // and exports useful public methods
  return function saneKeyboardEvents(el, rich_el, handlers) {
    var keydown = null;
    var keypress = null;

    var textarea = jQuery(el);
    var richarea = jQuery(rich_el);
    var target = jQuery(handlers.container || textarea);
    var PLACEHOLDER = "\n aaaa a\n";

    var typingResetTimeout = null;
    var typing = false;

    // checkTextareaFor() is called after keypress to
    // say "Hey, I think something was just typed" or "pasted" (resp.),
    // so that at all subsequent opportune times (next event or timeout),
    // will check for expected typed or pasted text.
    // Need to check repeatedly because #135: in Safari 5.1 (at least),
    // after selecting something and then typing, the textarea is
    // incorrectly reported as selected during the input event (but not
    // subsequently).
    var checkTextarea = noop, timeoutId;
    function checkTextareaFor(checker) {
      checkTextarea = checker;
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checker);
    }
    target.bind('keydown keypress input focusout focusout keyup', function() { if(!handlers.pasting) checkTextarea(); });


    // -*- public methods -*- //
    function select(text) {
      return resetText();
      // check textarea at least once/one last time before munging (so
      // no race condition if selection happens after keypress/paste but
      // before checkTextarea), then never again ('cos it's been munged)
      checkTextarea();
      checkTextarea = noop;
      clearTimeout(timeoutId);


      textarea.val(text);
      if (text) textarea[0].select();
      shouldBeSelected = !!text;
    }
    var shouldBeSelected = false;

    function resetText(force) {
      if(!textarea.is(":focus") && (force !== true)) return;
      if(handlers.pasting) return;
      textarea.val(PLACEHOLDER);
      textarea[0].setSelectionRange(4, 5);
    }

    // -*- helper subroutines -*- //

    // Determine whether there's a selection in the textarea.
    // This will always return false in IE < 9, which don't support
    // HTMLTextareaElement::selection{Start,End}.
    function hasSelection() {
      var dom = textarea[0];

      if (!('selectionStart' in dom)) return false;
      return dom.selectionStart !== dom.selectionEnd;
    }

    function handleKey() {
      handlers.keystroke(stringify(keydown), keydown);
    }

    // -*- event handlers -*- //
    function onKeydown(e) {
      keydown = e;
      keypress = null;

      handleKey();
      resetText();
      /*if (shouldBeSelected) checkTextareaFor(function() {
        textarea[0].select(); // re-select textarea in case it's an unrecognized
        checkTextarea = noop; // key that clears the selection, then never
        clearTimeout(timeoutId); // again, 'cos next thing might be blur
      });*/
    }

    function onKeypress(e) {
      // call the key handler for repeated keypresses.
      // This excludes keypresses that happen directly
      // after keydown.  In that case, there will be
      // no previous keypress, so we skip it here
      if (keydown && keypress) handleKey();

      keypress = e;

      checkTextareaFor(typedText);
      resetText();
    }
    function typedText() {
      // If there is a selection, the contents of the textarea couldn't
      // possibly have just been typed in.
      // This happens in browsers like Firefox and Opera that fire
      // keypress for keystrokes that are not text entry and leave the
      // selection in the textarea alone, such as Ctrl-C.
      // Note: we assume that browsers that don't support hasSelection()
      // also never fire keypress on keystrokes that are not text entry.
      // This seems reasonably safe because:
      // - all modern browsers including IE 9+ support hasSelection(),
      //   making it extremely unlikely any browser besides IE < 9 won't
      // - as far as we know IE < 9 never fires keypress on keystrokes
      //   that aren't text entry, which is only as reliable as our
      //   tests are comprehensive, but the IE < 9 way to do
      //   hasSelection() is poorly documented and is also only as
      //   reliable as our tests are comprehensive
      // If anything like #40 or #71 is reported in IE < 9, see
      // b1318e5349160b665003e36d4eedd64101ceacd8
      
      var text = textarea.val();

      if((text == PLACEHOLDER) && (textarea[0].selectionStart === 0 && textarea[0].selectionEnd === 0)) return resetText(); // IE GRR!
      if (textarea[0].selectionStart === 4 && textarea[0].selectionEnd === 5) {
        return;
      }

      if (text.substring(0, 9) == PLACEHOLDER && text.length > PLACEHOLDER.length)
          text = text.substr(9);
      else if (text.substr(0, 4) == PLACEHOLDER.substr(0, 4))
          text = text.substr(4, text.length - PLACEHOLDER.length + 1);
      else if (text.charAt(text.length - 1) == PLACEHOLDER.charAt(0))
          text = text.slice(0, -1);
      // can happen if undo in textarea isn't stopped
      if (text === "\n") {
        // Do nothing
      } else if (text.charAt(text.length - 1) == PLACEHOLDER.charAt(0))
          text = text.slice(0, -1);
      
      if (text && (text.length === 1)) 
        handlers.typedText(text);

      resetText();
      return;




      if (hasSelection()) return;
      
      var text = textarea.val();
      if (text.length === 1) {
        textarea.val('');
        handlers.typedText(text);
      } // in Firefox, keys that don't type text, just clear seln, fire keypress
      // https://github.com/mathquill/mathquill/issues/293#issuecomment-40997668
      else if (text) textarea[0].select(); // re-select if that's why we're here
    }

    function onBlur() { keydown = keypress = null; }

    function onFocus() { resetText(true); }

    function onPaste(ev) {
      var e = ev.originalEvent;
      // browsers are dumb.
      //
      // In Linux, middle-click pasting causes onPaste to be called,
      // when the textarea is not necessarily focused.  We focus it
      // here to ensure that the pasted text actually ends up in the
      // textarea.
      //
      // It's pretty nifty that by changing focus in this handler,
      // we can change the target of the default action.  (This works
      // on keydown too, FWIW).
      //
      // And by nifty, we mean dumb (but useful sometimes).
      
      // Pasting can bring formatted content (HTML), so we use the contenteditable as the paste target, then move it to the textarea immediately after the paste.
      handlers.pasting = true;
      if(e.clipboardData && e.clipboardData.getData) {
        var text = e.clipboardData.getData('text/plain');
        var html = e.clipboardData.getData('text/html');
        textarea.val(text);
        richarea.html(html);
        e.stopPropagation();
        e.preventDefault();
        window.setTimeout(pastedText,100);
      } else if(window.clipboardData) {
        //IE
        var text = window.clipboardData.getData('Text');
        textarea.val(text);
        richarea.focus();
        window.setTimeout(pastedText);
      } else {
        textarea.focus(); // Ignore HTML in these cases
        window.setTimeout(pastedText);
      }
    }
    function pastedText() {
      textarea.focus();
      handlers.pasting = false;
      var html = richarea.html();
      var text = textarea.val();
      resetText();
      richarea.html('');
      if (text) handlers.paste(text, html);
    }
    handlers.pasteHandler = onPaste;

    var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if(iOS) {
      // iOS doesn't send key code with commands for external keyboard because APPLE.  instead
      // we use this crazy PLACEHOLDER and look at how it is changed by the keypress to figure 
      // out what just happened.  STUPID!
      target.bind("keydown", function (e) {
        if (typingResetTimeout) clearTimeout(typingResetTimeout);
        typing = true;
      });
      
      target.bind("keyup", function (e) {
        typingResetTimeout = setTimeout(function () {
          typing = false;
        }, 100);
      });
      var doc_listener = function (e) {
        function ancestor(HTMLobj){
          while(HTMLobj.parentElement){HTMLobj=HTMLobj.parentElement}
          return HTMLobj;
        }
        if(ancestor(textarea[0])!==document.documentElement) {
          document.removeEventListener("selectionchange" , doc_listener);
          return;
        }
        if (document.activeElement !== textarea[0]) {
          return;
        }
        if (typing) {
          return;
        }
        var selectionStart = textarea[0].selectionStart;
        var selectionEnd = textarea[0].selectionEnd;
        textarea[0].setSelectionRange(4, 5);
        var command = false;
        if (selectionStart == selectionEnd) {
          switch (selectionStart) {
            case 0:
              command='Up';
              break;
            case 1:
              comand='Home';
              break;
            case 2:
              command='Alt-Left';
              break;
            case 4:
              command='Left';
              break;
            case 5:
              command='Right';
              break;
            case 7:
              command='Alt-Right';
              break;
            case 8:
              comand='End';
              break;
            case 9:
              command='Down';
              break;
          }
        } else {
          switch (selectionEnd) {
            case 6:
              command='Shift-Right';
              break;
            case 7:
              command='Alt-Shift-Right';
              break;
            case 8:
              command='Meta-Shift-Right';
              break;
            case 9:
              command='Shift-Down';
              break;
          }
          switch (selectionStart) {
            case 0:
              command='Shift-Up';
              break;
            case 1:
              command='Meta-Shift-Left';
              break;
            case 2:
              command='Alt-Shift-Left';
              break;
            case 3:
              command='Shift-Left';
              break;
          }
        }
        if(command) {
          handlers.keystroke(command, { preventDefault: function(e) {} });
        }
      }
      document.addEventListener("selectionchange", doc_listener);
    } 


    // -*- attach event handlers -*- //
    target.bind({
      keydown: onKeydown,
      keypress: onKeypress,
      focusout: onBlur,
      focusin: onFocus,
      paste: onPaste
    });

    // -*- export public methods -*- //
    return {
      select: select
    };
  };
}());
