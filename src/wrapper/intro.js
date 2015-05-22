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

  // This function will attach a math editable field by looking for a field with the provided class name (if provided)
  // It assumes the DOM element exists
  var registerMath = function(_this, klass, options) {
  	if(klass && (klass.length > 0))
  		klass = '.' + css_prefix + klass;
  	else
  		klass = '';
  	var defaultOptions = {handlers: {
  		deleteOutOf: function(dir, mathField) {
  			if(!(_this instanceof EditableBlock)) return; //I can only delete out of editable blocks
  			if(mathField.text() !== '') {
  				if(elementType(_this) && (elementType(_this) == elementType(_this[dir]))) {
  					// Deleting into element of the same type.  We should merge them together.  
  					if(dir == L) {// backspace
  						_this.write(_this[dir].focusableItems[0].toString());
  						_this[dir].remove(0);
  					} else {
	  					_this[dir].moveInFrom(-dir);
	  					_this[dir].write(mathField.toString());
	  					_this.remove(0);
	  				}
  				} else if(_this[dir])
  						_this.workspace.selectDir(_this[dir],dir);
  				return; 
  			}
  			if(_this.moveOut(mathField, dir)) _this.remove(0); //Only delete me if I successfully moved into a neighbor
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
