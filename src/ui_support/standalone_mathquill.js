$(function() {
	var standaloneMathquill = window.standaloneMathquill = function(math_jQ, reset, focus, handlers) {
		// Common function to create a standalone mathquill block, with associated key/mouse listeners.
		// Note that the standalone_textarea span should be removed from the DOM when we are done with this.
		// Returns the mathquill element
		math_jQ.wrap('<div class="math_wrapper"></div>');
    if(handlers)
      var math_div = MathQuill.MathField(math_jQ[0], { handlers: handlers});
    else
      var math_div = MathQuill.MathField(math_jQ[0], {});
		math_jQ = math_jQ.parent();
		math_div.showPopups();
		//math_div.latex('\\frac{\\pi^{2}}{2}+3');
    // First create a textarea which we focus, and to which we bind all events
    var textareaSpan = $('<span class="sc_textarea standalone_textarea"></span>');
    var textarea = $('<textarea>')[0];
    textarea = this.textarea = $(textarea).appendTo(textareaSpan);
    var richarea = $('<div>')[0];
    $(richarea).attr('contenteditable', 'true');
    $(richarea).appendTo(textareaSpan);

    // Bind keyboard events to this textarea
    var keyboardEventsShim = SwiftCalcs.saneKeyboardEvents(textarea, richarea, {
    	keystroke: function(k,e) { math_div.keystroke(k, e); },
    	typedText: function(t) { math_div.typedText(t); },
    	paste: function(el, el2) { return; }
    });
    $('body').append(textareaSpan)
    textarea.focus(function() { math_div.focus(); }).blur(function() { math_div.blur(); });
    // Bind mouse events
    var mousemove = function(e) {
    	math_div.mouseMove(e);
    	e.preventDefault();
    }
    var mouseUp = function(e) {
    	math_div.mouseUp(e);
    	math_div.jQ.off('mouseup dragend', mouseUp).off('mousemove', mousemove);
    	e.preventDefault();
    }
    var mouseDown = function(e) {
    	textarea.focus();
    	math_div.mouseDown(e);
    	math_div.jQ.on('mouseup dragend', mouseUp).on('mousemove', mousemove);
    	e.preventDefault();
    };
		math_div.jQ.on('mousedown', mouseDown);
		if(reset)
			$('<button>Reset</button>').insertAfter(math_jQ.parent()).on('click', function() { math_div.clear(); textarea.focus(); });
		math_jQ.on('mousedown', function(e) {
			if($(e.target).closest('.mq-editable-field').length) return;
			textarea.focus();
			math_div.focus(1);
			e.preventDefault();
		})
		if(focus) textarea.focus();
		return math_div;
	}
});