/**
 * SwiftCalcs: http://www.swiftcalcs.com
 * by Brentan Alexander (brentan.alexander@gmail.com)
 *
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0. If a copy of the MPL
 * was not distributed with this file, You can obtain
 * one at http://mozilla.org/MPL/2.0/.
 */

function SwiftCalcException(message) {
   this.message = message;
   this.name = "SwiftCalcException";
}
// global variable namespace
var SwiftCalcs = {};

(function() {

	// Local variables
  var jQuery = window.jQuery,
    undefined,
    css_prefix = 'sc_',
    min = Math.min,
    max = Math.max,
    L = -1,
    R = 1;
	function noop() {}

	// Class helper.  Returns the type of an element
	var elementType = function(el) {
		for (var key in elements) {
		  if (elements.hasOwnProperty(key) && (el instanceof elements[key])) 
		  	return key;
		}
		return null;
	}

  /* Math helpers
   * These functions help create and register math elements.  They are used by various elements that have Math input or output secionts
   */

  // This returns a span that can be used in elements to drop in a math block.  it adds the secondary class that is passed in, if any
  var mathSpan = function(klass) {
  	if(klass)
  		klass = ' ' + css_prefix + klass;
  	else
  		klass = '';
  	return '<span class="' + css_prefix + 'math' + klass + '"></span>';
  }

  // This returns the answer block which is used to show the results from a calculation
  var answerSpan = function(klass) {
    if(klass)
      klass = ' ' + css_prefix + klass;
    else
      klass = '';
    return '<div class="' + css_prefix + 'answer_table' + klass + '"><table class="' + css_prefix + 'answer_table"><tbody><tr>'
        + '<td class="' + css_prefix + 'answer_table_1t">&nbsp;</td>'
        + '<td rowspan=2 class="' + css_prefix + 'answer_table_2"><div>&gt;</div></td>'
        + '<td rowspan=2 class="' + css_prefix + 'output_box"><table><tbody><tr><td><div class="answer"></div></td><td class="answer_menu"></td></tr></tbody></table></td></tr>'
        + '<tr><td class="' + css_prefix + 'answer_table_2b">&nbsp;</td></tr></tbody></table></div>';
  }

  // This function will attach a math editable field by looking for a field with the provided class name (if provided)
  // It assumes the DOM element exists
  var registerMath = function(_this, klass, options) {
  	if(klass && (klass.length > 0))
  		klass = '.' + css_prefix + klass;
  	else
  		klass = '';
  	var defaultOptions = {handlers: {
  		deleteOutOf: function(dir, mathField) {
        if((_this instanceof LogicBlock) || (_this instanceof LogicCommand)) {
          _this.workspace.selectDir(_this,dir);
          return;
        }
  			if(!(_this instanceof EditableBlock)) return; //I can only delete out of editable blocks
  			if(mathField.text() !== '') {
  				if(elementType(_this) && (elementType(_this) == elementType(_this[dir]))) {
  					// Deleting into element of the same type.  We should merge them together.  
  					if(dir == L) {// backspace
  						_this.write(_this[dir].focusableItems[0].toString());
  						_this[dir].remove(0);
  					} else {
              _this.mark_for_deletion = true;
	  					_this[dir].moveInFrom(-dir);
	  					_this[dir].write(mathField.toString());
	  					_this.remove(0);
	  				}
  				} else if(_this[dir])
  					_this.workspace.selectDir(_this[dir],dir);
  				return; 
  			}
        _this.mark_for_deletion = true;
  			if(_this.moveOut(mathField, dir)) 
          _this.remove(0); //Only delete me if I successfully moved into a neighbor
        else
          _this.mark_for_deletion = false;
  		},
  		upOutOf: function(mathField) {
  			window.setTimeout(function() { _this.moveOut(mathField, L, mathField.cursorX()); });
  		},
  		downOutOf: function(mathField) {
  			window.setTimeout(function() { _this.moveOut(mathField, R, mathField.cursorX()); });
  		},
  		moveOutOf: function(dir, mathField) {
  			window.setTimeout(function() { _this.moveOut(mathField, dir); });
  		},
			selectOutOf: function(dir, mathField) { 
				window.setTimeout(function() { _this.workspace.selectDir(_this, dir); _this.workspace.selectionChanged(); });
			}
		}};
		jQuery.extend(true, defaultOptions, options);
  	var mathField = MathQuill.MathField(_this.jQ.find('span.' + css_prefix + 'math' + klass)[0], defaultOptions);
		mathField.setElement(_this);
		return mathField;
  }
// BRENTAN Examing HTML And pull images etc into their own blocks etc
  // Take in HTML, clean it, and then return an array of elements to insert based on the HTML
  var sanitize = function(html) {
    var output = DOMPurify.sanitize(html, {
      ALLOW_DATA_ATTR: false,
      SAFE_FOR_JQUERY: true,
      ALLOWED_TAGS: ['a','b','br','center','em',
        'h1','h2','h3','h4','h5','h6','hr','i',
        'img','li','ol','p','strike','span','div',
        'strong','sub','sup','table','tbody','td','th','tr','u','ul',],
      ALLOWED_ATTR: [
        'alt','bgcolor','border','color','cols','colspan','rows','rowspan','style','src','valign','class']
      });
    return [text(output)];
  }

  var status_bar = $('.status_bar');
  // Status bar helper functions
  var clearBar = function() {
    status_bar.removeClass(css_prefix + 'clear ' + css_prefix + 'complete ' + css_prefix + 'error ' + css_prefix + 'warn');
    status_bar.html('');
  }
  var startProgress = function(message) {
    if(status_bar.children('.progress_bar').length > 0) return;
    message = message || 'Calculating...Please Wait';
    status_bar.addClass(css_prefix + 'clear');
    status_bar.html('<div class="progress_bar"></div><div class="message_text"><i class="fa fa-spinner fa-pulse"></i>&nbsp;' + message + '</div>');
  }
  var progressTimeout = false;
  var setProgress = function(percent) {
    if(progressTimeout) window.clearTimeout(progressTimeout);
    progressTimeout = false;
    status_bar.children('.progress_bar').css('width', Math.floor(percent * 100) + '%'); 
  }
  var setUpdateTimeout = function(start_percent, end_percent, total_time) {
    var doTimeout = function(setting) {
      progressTimeout = false;
      if(setting > end_percent) setting = end_percent;
      setProgress(setting);
      if(setting < end_percent) {
        var delay = Math.random()*100 + 350;
        var new_val = setting + (end_percent - start_percent) * delay / total_time;
        progressTimeout = window.setTimeout(function(val) { return function() { doTimeout(val); }; }(new_val), delay);
      }
    }
    doTimeout(start_percent);
  }
  var changeMessage = function(text) {
    status_bar.find('.message_text').html('<i class="fa fa-spinner fa-pulse"></i>&nbsp;' + text);
  }
  var setComplete = function() {
    clearBar();
    status_bar.addClass(css_prefix + 'complete');
    status_bar.html('Ready');
  }
  var setWarning = function(warn) {
    clearBar();
    status_bar.addClass(css_prefix + 'warn');
    status_bar.html(warn);
  }
  var setError = function(err) {
    clearBar();
    status_bar.addClass(css_prefix + 'error');
    status_bar.html(err);
  }

  var parseLogicResult = function(result) {
    result = result.trim();
    if(result == 'false') return false;
    if(result == 'true') return true;
    if(result.match(/^[0-9\.]+$/)) 
      return ((result * 1) != 0);
    return false;
  }
    
  var P = (function(prototype, ownProperty, undefined) {
    // helper functions that also help minification
    function isObject(o) { return typeof o === 'object'; }
    function isFunction(f) { return typeof f === 'function'; }

    // used to extend the prototypes of superclasses (which might not
    // have `.Bare`s)
    function SuperclassBare() {}

    return function P(_superclass /* = Object */, definition) {
      // handle the case where no superclass is given
      if (definition === undefined) {
        definition = _superclass;
        _superclass = Object;
      }

      // C is the class to be returned.
      //
      // It delegates to instantiating an instance of `Bare`, so that it
      // will always return a new instance regardless of the calling
      // context.
      //
      //  TODO: the Chrome inspector shows all created objects as `C`
      //        rather than `Object`.  Setting the .name property seems to
      //        have no effect.  Is there a way to override this behavior?
      function C() {
        var self = new Bare;
        if (isFunction(self.init)) self.init.apply(self, arguments);
        return self;
      }

      // C.Bare is a class with a noop constructor.  Its prototype is the
      // same as C, so that instances of C.Bare are also instances of C.
      // New objects can be allocated without initialization by calling
      // `new MyClass.Bare`.
      function Bare() {}
      C.Bare = Bare;

      // Set up the prototype of the new class.
      var _super = SuperclassBare[prototype] = _superclass[prototype];
      var proto = Bare[prototype] = C[prototype] = C.p = new SuperclassBare;

      // other variables, as a minifier optimization
      var extensions;


      // set the constructor property on the prototype, for convenience
      proto.constructor = C;

      C.mixin = function(def) {
        Bare[prototype] = C[prototype] = P(C, def)[prototype];
        return C;
      }

      return (C.open = function(def) {
        extensions = {};

        if (isFunction(def)) {
          // call the defining function with all the arguments you need
          // extensions captures the return value.
          extensions = def.call(C, proto, _super, C, _superclass);
        }
        else if (isObject(def)) {
            // if you passed an object instead, we'll take it
            extensions = def;
        }

        // ...and extend it
        if (isObject(extensions)) {
          for (var ext in extensions) {
            if (ownProperty.call(extensions, ext)) {
              proto[ext] = extensions[ext];
            }
          }
        }

        // if there's no init, we assume we're inheriting a non-pjs class, so
        // we default to applying the superclass's constructor.
        if (!isFunction(proto.init)) {
          proto.init = _superclass;
        }

        return C;
      })(definition);
    }
    // as a minifier optimization, we've closured in a few helper functions
    // and the string 'prototype' (C[p] is much shorter than C.prototype)
  })('prototype', ({}).hasOwnProperty);
