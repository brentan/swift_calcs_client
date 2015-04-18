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
  			if(mathField.text() !== '') return; //We dont allow you to delete out of a non-empty block...BRENTAN: Change to merge 2 blocks of same type!  if not same type, highlight block so that you type again to delete it
  			if(_this.moveOut(mathField, dir)) _this.remove(0); //Only delete me if I successfully moved into a neighbor
  		},
  		upOutOf: function(mathField) {
  			window.setTimeout(function() { _this.moveOut(mathField, L); });
  		},
  		downOutOf: function(mathField) {
  			window.setTimeout(function() { _this.moveOut(mathField, R); });
  		},
  		moveOutOf: function(dir, mathField) {
  			window.setTimeout(function() { _this.moveOut(mathField, dir); });
  		},
			selectOutOf: function(dir, mathField) { 
				window.setTimeout(function() { _this.workspace.selectDir(_this, dir); _this.workspace.selectionChanged(); });
			}
		}};
		jQuery.extend(true, defaultOptions, options);
  	var mathField = MathQuill.MathField(_this.jQ.children('span.' + css_prefix + 'math' + klass)[0], defaultOptions);
		mathField.setElement(_this);
		return mathField;
  }
