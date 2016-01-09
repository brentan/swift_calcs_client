var slider = P(Element, function(_, super_) {
	_.klass = ['slider'];
	_.savedProperties = ['slider_min','slider_max','step_size','units'];
	_.slider_min = '0';
	_.slider_max = '100';
	_.step_size = '1';
	_.units = '';
	_.needsEvaluation = false; 
	_.evaluatable = true;
	_.fullEvaluation = true; 
	_.scoped = true;
	_.lineNumber = true;
	_.helpText = "<<slider>>\nThe slider provides a user visual slider that a user can click and manipulate in order to change an input.\nClick the <i class='fa fa-wrench'></i> icon to customize the minimum, maximum, step size, and units of the slider.";

	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('MathQuill',  'var_store') + '<span class="equality">&#8801;</span>' + focusableHTML('Slider', 'value') + "<span class='gear'><i class='fa fa-wrench'></i></span>" + helpBlock() + "</div>" + answerSpan();;
	}
	_.postInsertHandler = function() {
		this.varStoreField = registerFocusable(MathQuill, this, 'var_store', { ghost: 'ans', noWidth: true, handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		this.slider = registerFocusable(Slider,this, 'value', { min: this.slider_min, max: this.slider_max, step: this.step_size, unit: this.units});
		this.focusableItems = [[this.varStoreField, this.slider]];
		this.touched = false;
		this.needsEvaluation = false;
		super_.postInsertHandler.call(this);
		this.jQ.find('span.gear').on('click', function(_this) {
			return function(e) {
				_this.setSlider();
				e.preventDefault();
				e.stopPropagation();
				return false;
			};
		}(this));
		return this;
	}
  _.parseSavedProperties = function(args) {
  	super_.parseSavedProperties.call(this, args);
  	this.updateSlider();
  	return this;
  }
	_.enterPressed = function(_this) {
		return function(item) {
			_this.submissionHandler(_this)();
			if(_this[R] && (_this[R] instanceof math) && _this[R].empty())
				_this[R].focus(L);
			else
				math().setImplicit().insertAfter(_this).show().focus(0);
		};
	}
	_.submissionHandler = function(_this) {
		return function(mathField) {
			if(_this.needsEvaluation) {
				_this.commands = [{command: _this.varStoreField.text() + " := " + _this.slider.text(), nomarkup: true}];				
				_this.evaluate();
				_this.needsEvaluation = false;
			}
		};
	}
	_.evaluationFinished = function(result) {
		if(!result[0].success) {
			this.outputBox.setError(result[0].returned);
			this.outputBox.expand();
		} else
			this.outputBox.collapse();
		return true;
	}
  _.toString = function() {
  	return '{slider}{{' + this.argumentList().join('}{') + '}}';
  }
	_.PrependBlankItem = function(el) {
		if(el === this.focusableItems[0][0]) {
			//add a blank block just before this one
			math().insertBefore(this).show();
			this.focus(L);
			return true;
		} else
			return false;
	}
	// Callback for math elements notifying that this element has been changed
	_.changed = function(el) {
		if(el == this.varStoreField) this.needsEvaluation = true;
		if(el == this.slider) {
			this.needsEvaluation = true;
			this.submissionHandler(this)();
		}
	}
	_.updateSlider = function() {
		this.slider.update({
			unit: this.units,
			min: this.slider_min,
			max: this.slider_max,
			step: this.step_size
		});
	}
	_.setSlider = function() {
		window.showPopupOnTop();
		var _this = this;
		$('.popup_dialog .full').html('<div class="title">Adjust Slider</div><div>');
		$('.popup_dialog .full').append('<div><strong>Minimum Value</strong><br><input type="text" class="min"></div><div><strong>Maximum Value</strong><br><input type="text" class="max"></div><div><strong>Step Size</strong><br><input type="text" class="step"><BR><span class="explain">Leave blank for continuous slider</span></div><div><strong>Units</strong><div class="white"><span class="units"></span></div><span class="explain">Leave blank for no units</span></div>');
		$('.popup_dialog').find('input.min').val(this.slider_min);
		$('.popup_dialog').find('input.max').val(this.slider_max);
		$('.popup_dialog').find('input.step').val(this.step_size);
		var units_field = window.standaloneMathquill($('.popup_dialog').find('span.units').eq(0));
		units_field.setUnitsOnly(true);
		if(this.units)
			units_field.paste(this.units);
		else
			units_field.cmd('\\Unit');
    var links = $('.popup_dialog .bottom_links').html('');
    window.resizePopup();
    $('<button class="grey">Close</button>').on('click', function(e) {
			$('.standalone_textarea').remove();
			window.hidePopupOnTop();
    }).prependTo(links);
		$('<button class="ok">Ok</button>').on('click', function(e) {
			var min_val = $('.popup_dialog').find('input.min').val().trim();
			var max_val = $('.popup_dialog').find('input.max').val().trim();
			var step_size = $('.popup_dialog').find('input.step').val().trim();
			if(step_size == '') _this.step_size = 0; 
			else if(!step_size.match(/^[\-]?[0-9\.e]*$/)) return showNotice("Step Size is non-numeric", "red");
			else _this.step_size = step_size;
			if(!max_val.match(/^[\-]?[0-9\.e]*$/)) return showNotice("Maximum Value is non-numeric", "red");
			else _this.slider_max = max_val;
			if(!min_val.match(/^[\-]?[0-9\.e]*$/)) return showNotice("Minimum Value is non-numeric", "red");
			else _this.slider_min = min_val;
			_this.units = units_field.latex();
			if(_this.units.match(/^\\Unit\{[ ]*\}$/)) _this.units = '';
			$('.standalone_textarea').remove();
			window.hidePopupOnTop();
			_this.updateSlider();
			_this.worksheet.save();
		}).prependTo(links);
	}
});