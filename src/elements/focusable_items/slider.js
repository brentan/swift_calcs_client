/*
	A slider with min/max values and associated step size (if provided).  
	Basically HTML5 range polyfill (not actual HTML5 range so we can do our own focusing)
*/

var Slider = P(aFocusableItem, function(_, super_) {

	_.input_open = false;
	_.unit = '';
	_.unit_html = '';

	_.init = function(span, klass, el, options) {
		super_.init.call(this, span, klass, el, options);
		this.sliderJQ = $('<span/>').addClass(css_prefix + 'slider');
		this.valJQ = $('<span/>').addClass(css_prefix + 'val');
		this.jQ.html('').append(this.sliderJQ).append(this.valJQ);
		if(options.no_value) this.valJQ.hide();
		if(options.unit) {
			var unit = el.worksheet.latexToUnit(options.unit);
			this.unit = unit[0];
			this.unit_latex = options.unit;
			this.unit_html = unit[1].replace("mq-editable-field","");
		}
		this.handlers = options.handlers;
		this.initSlider(options);
		this.worksheet = el.worksheet;
	}
	_.update = function(options) {
		if(options.unit && options.unit.length) {
			var unit = this.element.worksheet.latexToUnit(options.unit);
			this.unit = unit[0];
			this.unit_latex = options.unit;
			this.unit_html = unit[1].replace("mq-editable-field","");
		} else {
			this.unit = '';
			this.unit_latex = '';
			this.unit_html = '';
		}
    this.min    = tryParseFloat(options.min, 0);
    this.max    = tryParseFloat(options.max, 100);
    this.step   = tryParseFloat(options.step, 0);
    var val = this.value;
    this.value = val + 1; // Do this to force save/re-eval
    this.write(val, true);
	}
	// API Functions that are called by the enclosing element //
	_.keystroke = function(description, event) {
		if(this.input_open !== false) {
			this.input_open.keystroke(description, event);
			return;
		}
		switch(description) {
			case 'Left':
				if(this.value <= this.min)
					this.handlers.moveOutOf(L, this);
				else if(this.step > 0)
					this.write(this.value - this.step);
				else
					this.write(this.value - (this.max-this.min)/20);
				break;
			case 'Right':
				if(this.value >= this.max)
					this.handlers.moveOutOf(R, this);
				else if(this.step > 0)
					this.write(this.value + this.step);
				else
					this.write(this.value + (this.max-this.min)/20);
				break;
			case 'Shift-Up':
				this.handlers.selectOutOf(L, this);
				break;
			case 'Up':
				this.handlers.moveOutOf(L, this);
				break;
			case 'Shift-Down':
				this.handlers.selectOutOf(R, this);
				break;
			case 'Down':
				this.handlers.moveOutOf(R, this);
				break;
			case 'Shift-Left':
				this.handlers.selectOutOf(L, this);
				break;
			case 'Shift-Right':
				this.handlers.selectOutOf(R, this);
				break;
			case 'End':
			case 'Shift-End':
			case 'Ctrl-End':
			case 'Ctrl-Shift-End':
				this.write(this.max);
				break;
			case 'Home': 
			case 'Shift-Home':
			case 'Ctrl-Home':
			case 'Ctrl-Shift-Home':
				this.write(this.min);
				break;
    	case 'Tab':
    	case 'Enter':
    	case 'Spacebar': 
				this.handlers.moveOutOf(R, this);
    		break;
    	case 'Shift-Tab':
				this.handlers.moveOutOf(L, this);
    		break;
    	default:
    		return;
		}
    event.preventDefault();
	}
	_.createTextBox = function() {
		// allow direct access by typing in a number
	  var input = $('<span class="unit_add ' + css_prefix + 'math"></span>');
	  input.appendTo(this.valJQ.html(''));
		input = MathQuill.MathField(input[0]);
		input.clear();
		input.setElement(this);
		input.setCaptiveMode(true); 
		input.focus();
		var latex = this.value + '';
		if(this.unit.length) latex = latex + " " + this.unit_latex;
		input.latex(latex).select();
		this.mathquill = true;
		this.input_open = input;
    this.valJQ.addClass('no_border');
	}
	_.itemChosen = function(output) { // Since we put the box in unit mode
		var to_execute =  "evalf(" + this.input_open.text() + ")";
		var command = [];
		if(this.unit.length > 0) 
			command.push({command: "convert(" + to_execute + "," + this.unit + ")", nomarkup: true});
		command.push({command: to_execute, nomarkup: true});
		var eval_id = giac.registerEvaluation(false);
		giac.execute(eval_id, true, command, this);
		this.setVal('<span class="fa fa-spinner fa-pulse"></span>');
	}	
	_.previousScope = function() { 
		return this.element.previousScope();
	}
	_.firstGenAncestor = function() { 
		return this.element.firstGenAncestor();
	}
	_.evaluationCallback = function(evaluation_id, evaluation_callback, move_to_next, results) { 
		giac.evaluationComplete(evaluation_id);
		var ind = 0;
		if((results.length == 2) && (!results[0].success) && (results[1].success)) //if unit conversion fails, try no conversion at all
			ind = 1;
		if(results[ind].success) {
			var val = results[ind].returned;
			if(this.unit.length > 0)
				val = val.replace(new RegExp(this.unit, "g"),'');
			if(!val.match(/^[\-]?[0-9\.e]*$/)) {
				if(results[0].returned.match(/Incompatible units/))
					this.setVal('<span class="error">Incompatible units</span>');
				else
					this.setVal('<span class="error">Non-numeric answer</span>');
			}
			else this.write(val, true);
		} else
			this.setVal('<span class="error">syntax error</span>');
	}
	_.autocomplete = function() {
		return this.element.autocomplete();
	}
	_.autocompleteObject = function(name) {
		return this.element.autocompleteObject(name);
	}
	_.typedText = function(text) {
		if(this.input_open === false) 
			this.createTextBox();
		this.input_open.typedText(text);
	}
	_.cut = function(event) {
		if(this.input_open === false)
			this.copy(event);
		else
			this.input_open.cut(event);
		return this;
	}
	_.copy = function(event) {
		if(this.input_open === false) {
			this.element.worksheet.clipboard = this.text(); 
			this.element.worksheet.selectFn(this.text()); 
		} else
			this.input_open.copy(event);
		return this;
	}
	_.paste = function(text) {
		if(this.input_open === false) {
			this.write(text, true);
		}
		else
			this.input_open.paste(text);
		return this;
	}
	_.toString = function() {
		return this.value + '';
	}
	_.write = function(text, force_remove) {
		if((force_remove === true) || (this.input_open === false)) {
	    pos = this.getPositionFromValue(text*1);
	  	this.setPosition(pos);
	  } else
			this.input_open.write(text);
		return this;
	}
	_.text = function() {
		return this.value + this.unit;
	}
	_.blur = function() {
		this.sliderJQ.children().removeClass('highlight');
		if(this.input_open !== false) 
			this.input_open.blur();
	}
	_.setVal = function(text) {
		if(typeof text === 'undefined') text = (this.value + this.unit_html);
		this.valJQ.html(text);
    this.valJQ.removeClass('no_border');
		if(this.input_open !== false) {
			this.input_open = false;
			this.mathquill = false;
		}
	}
	_.focus = function(dir) {
		super_.focus.call(this, dir);
		this.sliderJQ.children().addClass('highlight');
    this.scrollToMe(dir);
	}
	_.clear = function() {
		return this;
	}
	_.currentState = function() {
		return {
			val: this.value+''
		}
	}
	_.restoreState = function(data) {
		this.write(data.val, true);
	}



	/*! Based on rangeslider.js - v2.0.5 | (c) 2015 @andreruffert | MIT license | https://github.com/andreruffert/rangeslider.js */
  // Polyfill Number.isNaN(value)
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN
  Number.isNaN = Number.isNaN || function(value) {
      return typeof value === 'number' && value !== value;
  };

  var pluginName = 'rangeslider',
      pluginIdentifier = 0,
      defaults = {
          polyfill: true,
          orientation: 'horizontal',
          rangeClass: 'rangeslider',
          disabledClass: 'rangeslider--disabled',
          horizontalClass: 'rangeslider--horizontal',
          verticalClass: 'rangeslider--vertical',
          fillClass: 'rangeslider__fill',
          handleClass: 'rangeslider__handle',
          startEvent: ['mousedown', 'touchstart', 'pointerdown'],
          moveEvent: ['mousemove', 'touchmove', 'pointermove'],
          endEvent: ['mouseup', 'touchend', 'pointerup']
      },
      constants = {
          orientation: {
              horizontal: {
                  dimension: 'width',
                  direction: 'left',
                  directionStyle: 'left',
                  coordinate: 'x'
              },
              vertical: {
                  dimension: 'height',
                  direction: 'top',
                  directionStyle: 'bottom',
                  coordinate: 'y'
              }
          }
      };

  /**
   * Delays a function for the given number of milliseconds, and then calls
   * it with the arguments supplied.
   *
   * @param  {Function} fn   [description]
   * @param  {Number}   wait [description]
   * @return {Function}
   */
  function delay(fn, wait) {
      var args = Array.prototype.slice.call(arguments, 2);
      return setTimeout(function(){ return fn.apply(null, args); }, wait);
  }

  /**
   * Returns a debounced function that will make sure the given
   * function is not triggered too much.
   *
   * @param  {Function} fn Function to debounce.
   * @param  {Number}   debounceDuration OPTIONAL. The amount of time in milliseconds for which we will debounce the function. (defaults to 100ms)
   * @return {Function}
   */
  function debounce(fn, debounceDuration) {
      debounceDuration = debounceDuration || 100;
      return function() {
          if (!fn.debouncing) {
              var args = Array.prototype.slice.apply(arguments);
              fn.lastReturnVal = fn.apply(window, args);
              fn.debouncing = true;
          }
          clearTimeout(fn.debounceTimeout);
          fn.debounceTimeout = setTimeout(function(){
              fn.debouncing = false;
          }, debounceDuration);
          return fn.lastReturnVal;
      };
  }

  /**
   * Check if a `element` is visible in the DOM
   *
   * @param  {Element}  element
   * @return {Boolean}
   */
  function isHidden(element) {
      return (
          element && (
              element.offsetWidth === 0 ||
              element.offsetHeight === 0 ||
              // Also Consider native `<details>` elements.
              element.open === false
          )
      );
  }

  /**
   * Get hidden parentNodes of an `element`
   *
   * @param  {Element} element
   * @return {[type]}
   */
  function getHiddenParentNodes(element) {
      var parents = [],
          node    = element.parentNode;

      while (isHidden(node)) {
          parents.push(node);
          node = node.parentNode;
      }
      return parents;
  }

  /**
   * Returns dimensions for an element even if it is not visible in the DOM.
   *
   * @param  {Element} element
   * @param  {String}  key     (e.g. offsetWidth …)
   * @return {Number}
   */
  function getDimension(element, key) {
      var hiddenParentNodes       = getHiddenParentNodes(element),
          hiddenParentNodesLength = hiddenParentNodes.length,
          inlineStyle             = [],
          dimension               = element[key];

      // Used for native `<details>` elements
      function toggleOpenProperty(element) {
          if (typeof element.open !== 'undefined') {
              element.open = (element.open) ? false : true;
          }
      }

      if (hiddenParentNodesLength) {
          for (var i = 0; i < hiddenParentNodesLength; i++) {

              // Cache style attribute to restore it later.
              inlineStyle[i] = hiddenParentNodes[i].style.cssText;

              // visually hide
              if (hiddenParentNodes[i].style.setProperty) {
                  hiddenParentNodes[i].style.setProperty('display', 'block', 'important');
              } else {
                  hiddenParentNodes[i].style.cssText += ';display: block !important';
              }
              hiddenParentNodes[i].style.height = '0';
              hiddenParentNodes[i].style.overflow = 'hidden';
              hiddenParentNodes[i].style.visibility = 'hidden';
              toggleOpenProperty(hiddenParentNodes[i]);
          }

          // Update dimension
          dimension = element[key];

          for (var j = 0; j < hiddenParentNodesLength; j++) {

              // Restore the style attribute
              hiddenParentNodes[j].style.cssText = inlineStyle[j];
              toggleOpenProperty(hiddenParentNodes[j]);
          }
      }
      return dimension;
  }

  /**
   * Returns the parsed float or the default if it failed.
   *
   * @param  {String}  str
   * @param  {Number}  defaultValue
   * @return {Number}
   */
  function tryParseFloat(str, defaultValue) {
      var value = parseFloat(str);
      return Number.isNaN(value) ? defaultValue : value;
  }

  /**
   * Capitalize the first letter of string
   *
   * @param  {String} str
   * @return {String}
   */
  function ucfirst(str) {
      return str.charAt(0).toUpperCase() + str.substr(1);
  }

  /**
   * Plugin
   * @param {String} element
   * @param {Object} options
   */
  _.initSlider = function(options) {
      this.$window            = $(window);
      this.$document          = $(document);
      this.options            = $.extend( {}, defaults, options );
      this.polyfill           = this.options.polyfill;
      this.orientation        = this.options.orientation;
      this.onInit             = this.options.onInit;
      this.onSlide            = this.options.onSlide;
      this.onSlideEnd         = this.options.onSlideEnd;
      this.DIMENSION          = constants.orientation[this.orientation].dimension;
      this.DIRECTION          = constants.orientation[this.orientation].direction;
      this.DIRECTION_STYLE    = constants.orientation[this.orientation].directionStyle;
      this.COORDINATE         = constants.orientation[this.orientation].coordinate;

      this.min    = tryParseFloat(this.options.min, 0);
      this.max    = tryParseFloat(this.options.max, 100);
      this.value  = tryParseFloat(this.options.value, Math.round(this.min + (this.max-this.min)/2));
      this.step   = tryParseFloat(this.options.step, 0);

      this.identifier = 'js-' + pluginName + '-' +(pluginIdentifier++);
      this.startEvent = this.options.startEvent.join('.' + this.identifier + ' ') + '.' + this.identifier;
      this.moveEvent  = this.options.moveEvent.join('.' + this.identifier + ' ') + '.' + this.identifier;
      this.endEvent   = this.options.endEvent.join('.' + this.identifier + ' ') + '.' + this.identifier;
      this.$fill      = $('<div class="' + this.options.fillClass + '" />');
      this.$handle    = $('<div class="' + this.options.handleClass + '" />');
      this.$range     = $('<div class="' + this.options.rangeClass + ' ' + this.options[this.orientation + 'Class'] + '" id="' + this.identifier + '" />').appendTo(this.sliderJQ).prepend(this.$fill, this.$handle);

      this.handle_resize(false);

      if (this.onInit && typeof this.onInit === 'function') {
          this.onInit();
      }

      // Attach Events BRENTAN: REFLOW INSTEAD OF THIS!
      var _this = this;
  }

  _.handle_resize = function(triggerSlide) {

      this.handleDimension    = getDimension(this.$handle[0], 'offset' + ucfirst(this.DIMENSION));
      this.rangeDimension     = getDimension(this.$range[0], 'offset' + ucfirst(this.DIMENSION));
      this.maxHandlePos       = this.rangeDimension - this.handleDimension;
      this.grabPos            = this.handleDimension / 2;
      this.position           = this.getPositionFromValue(this.value);
      this.setPosition(this.position, triggerSlide);
  };

  _.mouseDown = function(e) {
  		if($(e.target).closest('.' + css_prefix + 'val').length) {
  			this.focus();
  			this.createTextBox();
  			this.element.start_target = this.input_open;
  			return;
  		}
      // If we click on the handle don't set the new position
      if ((' ' + e.target.className + ' ').replace(/[\n\t]/g, ' ').indexOf(this.options.handleClass) > -1) {
          return;
      }

      var pos         = this.getRelativePosition(e),
          rangePos    = this.$range[0].getBoundingClientRect()[this.DIRECTION],
          handlePos   = this.getPositionFromNode(this.$handle[0]) - rangePos,
          setPos      = (this.orientation === 'vertical') ? (this.maxHandlePos - (pos - this.grabPos)) : (pos - this.grabPos);
      this.changed = false;
			this.scheduleUndoPoint();
      this.setPosition(setPos, true, false);

      if (pos >= handlePos && pos < handlePos + this.handleDimension) {
          this.grabPos = pos - handlePos;
      }
  };

  _.mouseMove = function(e) {
      e.preventDefault();
      var pos = this.getRelativePosition(e);
      var setPos = (this.orientation === 'vertical') ? (this.maxHandlePos - (pos - this.grabPos)) : (pos - this.grabPos);
      this.setPosition(setPos, true, false);
  };

  _.mouseUp = function(e) {
      e.preventDefault();

      if (this.onSlideEnd && typeof this.onSlideEnd === 'function') {
          this.onSlideEnd(this.position, this.value);
      }
      if(this.changed && (this.element.changed)) this.element.changed(this);
      if(this.changed) this.element.worksheet.save();

  };

  _.cap = function(pos, min, max) {
      if (pos < min) { return min; }
      if (pos > max) { return max; }
      return pos;
  };

  _.setPosition = function(pos, triggerSlide, evaluate_immediately) {
      var value, newPos;

      if (triggerSlide === undefined) {
          triggerSlide = true;
      }
      if (evaluate_immediately === undefined) {
          evaluate_immediately = true;
      }

      // Snapping steps
      value = this.getValueFromPosition(this.cap(pos, 0, this.maxHandlePos));
      newPos = this.getPositionFromValue(value);
      // Update ui
      this.$fill[0].style[this.DIMENSION] = (newPos + this.grabPos) + 'px';
      this.$handle[0].style[this.DIRECTION_STYLE] = newPos + 'px';

      // Update globals
      this.position = newPos;
      var change = false;
      if(evaluate_immediately) {
      	if(this.value != value) {
      		change = true;
      		this.scheduleUndoPoint();
      	}
	    } else if(this.value != value)
	    	this.changed = true;
      this.value = value;
      this.setVal();
      if(change && (this.element.changed)) this.element.changed(this);
      if(change) this.element.worksheet.save();

      if (triggerSlide && this.onSlide && typeof this.onSlide === 'function') {
          this.onSlide(newPos, value);
      }
  };

  // Returns element position relative to the parent
  _.getPositionFromNode = function(node) {
      var i = 0;
      while (node !== null) {
          i += node.offsetLeft;
          node = node.offsetParent;
      }
      return i;
  };

  _.getRelativePosition = function(e) {
      // Get the offset DIRECTION relative to the viewport
      var ucCoordinate = ucfirst(this.COORDINATE),
          rangePos = this.$range[0].getBoundingClientRect()[this.DIRECTION],
          pageCoordinate = 0;

      if (typeof e['page' + ucCoordinate] !== 'undefined') {
          pageCoordinate = e['client' + ucCoordinate];
      }
      else if (typeof e.originalEvent['client' + ucCoordinate] !== 'undefined') {
          pageCoordinate = e.originalEvent['client' + ucCoordinate];
      }
      else if (e.originalEvent.touches && e.originalEvent.touches[0] && typeof e.originalEvent.touches[0]['client' + ucCoordinate] !== 'undefined') {
          pageCoordinate = e.originalEvent.touches[0]['client' + ucCoordinate];
      }
      else if(e.currentPoint && typeof e.currentPoint[this.COORDINATE] !== 'undefined') {
          pageCoordinate = e.currentPoint[this.COORDINATE];
      }

      return pageCoordinate - rangePos;
  };

  _.getPositionFromValue = function(value) {
      var percentage, pos;
      percentage = (value - this.min)/(this.max - this.min);
      pos = (!Number.isNaN(percentage)) ? percentage * this.maxHandlePos : 0;
      return pos;
  };

  _.getValueFromPosition = function(pos) {
      var percentage, value;
      percentage = ((pos) / (this.maxHandlePos || 1));
      if(this.step > 0)
      	value = this.step * Math.round(percentage * (this.max - this.min) / this.step) + this.min;
      else 
      	return (percentage * (this.max - this.min) + this.min);
      var toFixed = (this.step + '').replace('.', '').length - 1;
      return Number((value).toFixed(toFixed));
  };

});
