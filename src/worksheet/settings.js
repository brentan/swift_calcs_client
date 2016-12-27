/************************************************************************
 * Set settings using the settings sidebar.  Also sets settings on bind *
 ************************************************************************/

$(function() {
	if(!window.SwiftCalcsSettings) window.SwiftCalcsSettings = { };
	window.SwiftCalcsSettings.setUnitSidebar = function(item, add_new) {
		if((item.settings.custom_units == "true") || (item.settings.custom_units ===true)) {
	    $('div.custom_units').addClass('shown');
	    $('a.custom_units').hide();
		} else {
	    $('a.custom_units').show();
	    $('div.custom_units').removeClass('shown');
		}
		$('div.custom_units span.length').html('<span class="custom_unit_box" data-unit="' + item.settings.base_units[0] + '">' + window.SwiftCalcsLatexHelper.latexToHtml("\\Unit{" + item.settings.base_units[0] + "}") + '</span>');
		$('div.custom_units span.mass').html('<span class="custom_unit_box" data-unit="' + item.settings.base_units[1] + '">' + window.SwiftCalcsLatexHelper.latexToHtml("\\Unit{" + item.settings.base_units[1] + "}") + '</span>');
		$('div.custom_units span.time').html('<span class="custom_unit_box" data-unit="' + item.settings.base_units[2] + '">' + window.SwiftCalcsLatexHelper.latexToHtml("\\Unit{" + item.settings.base_units[2] + "}") + '</span>');
		var y = $('.popup_dialog .full').scrollTop(); 
		$('div.custom_units .added_units').html('');
		var new_settings = [];
		for(var i = 0; i < item.settings.derived_units.length; i++) {
			if(!add_new && (item.settings.derived_units[i].length == 0)) continue;
			new_settings.push(item.settings.derived_units[i]);
			$('<div/>').addClass('derived_unit').html('<i class="fa fa-times"></i><span><span class="custom_unit_box" data-unit="' + item.settings.derived_units[i] + '">' + window.SwiftCalcsLatexHelper.latexToHtml("\\Unit{" + item.settings.derived_units[i] + "}") + '</span></span>').appendTo($('div.custom_units .added_units'));
		}
		item.settings.derived_units = new_settings;
		$('div.custom_units .added_units i.fa-times').on('click', function(e) {
			$(this).closest('.derived_unit').remove();
			window.SwiftCalcsSettings.buildUnitSettings(item);
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
		$('<span/>').addClass('add_unit').html('Add a Unit').on('click', function(e) {
			item.settings.derived_units.push('');
			window.SwiftCalcsSettings.setUnitSidebar(item, true);
			$('div.custom_units span.custom_unit_box').last().click();
		}).appendTo('div.custom_units .added_units');
		$('.popup_dialog .full').scrollTop(y);
		var mq_onblur = function(item) {
			return function(mq) {
				$('span.standalone_textarea').remove();
				var jQ = mq.jQ;
				var unit = mq.latex();
				var unit_text = mq.text().replace(/_/g,'');
				if(unit_text.trim().length == 0) {
					$(jQ).closest('.derived_unit').remove();
					window.SwiftCalcsSettings.buildUnitSettings(item);
					return;
				}
				if(!unit_text.match(/^[a-z2µ]+$/i)) {
					showNotice('Unit settings should only be single units (m, N, Pa, etc), not combined units (m/s).', 'red');
					mq.clear().write("\\Unit{" + $(this).attr('data-unit') + "}");
					mq.keystroke("Left", {preventDefault: function() {} });
					unit_text = '';
				} else 
					window.SwiftCalcsSettings.showApplyNow();
				mq.revert();
				jQ.html('');
				var span = $('<span/>').addClass('custom_unit_box');
				span.attr('data-unit', unit_text);
				jQ.append(span);
				window.SwiftCalcsSettings.buildUnitSettings(item);
			}
		}
		$('div.custom_units span.custom_unit_box').on('click', function(e) {
			var span = $('<span/>').addClass('choose_unit').appendTo($(this).parent());
			var mq = window.standaloneMathquill(span, false, true, { blur: mq_onblur(item) });
			mq.setUnitsOnly(true);
			mq.write("\\Unit{" + $(this).attr('data-unit') + "}");
			//mq.focus();
			mq.keystroke("Left", {preventDefault: function() {} });
			$(this).remove();
			e.preventDefault();
			e.stopPropagation();
		});
	}
	window.SwiftCalcsSettings.buildUnitSettings = function(item) {
		item.settings.base_units[0] = $('div.custom_units span.length .custom_unit_box').attr('data-unit');
		item.settings.base_units[1] = $('div.custom_units span.mass .custom_unit_box').attr('data-unit');
		item.settings.base_units[2] = $('div.custom_units span.time .custom_unit_box').attr('data-unit');
		item.settings.base_units[3] = $('select.temperature').val();
		item.settings.derived_units = [];
		$('div.custom_units .added_units .custom_unit_box').each(function() {
			item.settings.derived_units.push($(this).attr('data-unit'));
		});
		item.settings.custom_units = $('div.custom_units').hasClass('shown');
		window.SwiftCalcsSettings.setUnitSidebar(item, false);
	}
	window.SwiftCalcsSettings.showApplyNow = function() {
		$('.popup_dialog .bottom_links button.submit').show();
	}
	window.SwiftCalcsSettings.loadAndAttachListeners = function(settingsHTML, item) {
		var handleSelectChange = function(e) {
			switch($(this).attr('data-type')) {
				case 'angle_mode':
					item.settings.angle = $(this).val();
					break;
	      case 'complex_mode':
	        item.settings.complex = $(this).val();
	        break;
	      case 'approx_mode':
	        item.settings.approx = $(this).val();
	        break;
				case 'digits_select':
					item.settings.digits = $(this).val();
					break;
				case 'currency_unit':
					item.settings.currency_unit = $(this).val();
					break;
				case 'thousands':
					item.settings.thousands = $(this).val();
					break;
				case 'index_mode':
					item.settings.one_indexed = $(this).val();
					break;
				case 'temperature':
					item.settings.base_units[3] = $(this).val();
					break;
				case 'unit_mode':
					item.settings.units = $(this).val();
					switch(SwiftCalcs.active_worksheet.settings.units) {
						case 'mks':
							var base = ['m','kg','s'];
							var derived = ['A','mol','cd','N','Ohm','Pa','J','T','C','F','H','Hz','V','W','Wb'];
							break;
						case 'cgs':
							var base = ['cm','g','s'];
							var derived = ['mL','A','mol','cd','N','Ohm','Pa','J','T','C','F','H','Hz','V','W','Wb'];
							break;
						case 'ips':
							var base = ['in','lb','s'];
							var derived = ['gal','A','mol','cd','lbf','Ohm','psi','Btu','T','C','F','H','Hz','V','hp','Wb'];
							break;
					}
					var current_temp = item.settings.base_units[3];
					item.settings.base_units = base;
					item.settings.base_units.push(current_temp);
					item.settings.derived_units = derived;
					window.SwiftCalcsSettings.setUnitSidebar(item, false);
					break;
			}
			window.SwiftCalcsSettings.showApplyNow();
		}
		window.showPopupOnTop();
		$('.popup_dialog .full').html(settingsHTML);
	  $('.popup_dialog .bottom_links').html('<button class="submit" style="display:none;">' + (item instanceof Worksheet ? 'Save Settings and Recalculate' : 'Save Settings') + '</button><button class="close grey">Close</button>');
	  window.resizePopup(false);
		$('select.angle_mode').val(item.settings.angle).on('change', handleSelectChange);
	  $('select.complex_mode').val(item.settings.complex).on('change', handleSelectChange);
	  $('select.approx_mode').val(item.settings.approx).on('change', handleSelectChange);
	  $('select.currency_unit').val(item.settings.currency_unit).on('change', handleSelectChange);
		$('select.unit_mode').val(item.settings.units).on('change', handleSelectChange);
		$('select.digits_select').val(item.settings.digits).on('change', handleSelectChange);
		$('select.index_mode').val(item.settings.one_indexed).on('change', handleSelectChange);
		$('select.thousands').val(item.settings.thousands).on('change', handleSelectChange);
		$('select.temperature').val(item.settings.base_units[3]).on('change', handleSelectChange);
		$('.popup_dialog .bottom_links button.close').on('click', function(e) { 
			$('.popup_dialog .settings').remove();
			window.hideDialogs();
		});
	  // Settings
	  $('a.custom_units').on('click', function(e) {
	    $('div.custom_units').addClass('shown');
	    $(this).hide();
	    item.settings.custom_units = true;
	    e.preventDefault();
	    e.stopPropagation();
	    return false;
	  });
		window.SwiftCalcsSettings.setUnitSidebar(item, false);
		$('<a href="#"></a>').html('Remove all Derived Units').on('click', function(e) {
			item.settings.derived_units = [];
			window.SwiftCalcsSettings.setUnitSidebar(item, false);
		}).appendTo('div.custom_units .remove_units');
	}
	window.SwiftCalcsSettings.load = function() {
		window.showLoadingOnTop();
		window.ajaxRequest("/users/load_settings",{}, function(response) {
			window.SwiftCalcsSettings.populate(response.html);
		}, function(err) {
			window.hidePopupOnTop();
		})
	}
	window.SwiftCalcsSettings.populate = function(html) {
		window.SwiftCalcsSettings.loadAndAttachListeners(html, window.SwiftCalcsSettings);
		$('.popup_dialog .bottom_links button.submit').on('click', function(e) { 
			window.showLoadingOnTop();
			window.ajaxRequest('/users/set_settings', {settings: window.SwiftCalcsSettings.settings }, function() {
				$('.popup_dialog .settings').remove();
				if(window.SwiftCalcsSettings.settings.thousands == 'comma')
					$('div.body').addClass('show_commas');
				else
					$('div.body').removeClass('show_commas');
				window.hideDialogs();
				showNotice("Default Settings Saved", "green");
			}, function() {
				window.hideDialogs();
			});
		});
		var setAutocomplete = function(add_new) {
			var y = $('.popup_dialog .full').scrollTop();
			$('div.single_convert_units .added_units').html('');
			var new_settings = [];
			for(var i = 0; i < window.SwiftCalcsSettings.settings.single_convert_units.length; i++) {
				if(!add_new && (window.SwiftCalcsSettings.settings.single_convert_units[i].length == 0)) continue;
				new_settings.push(window.SwiftCalcsSettings.settings.single_convert_units[i]);
				$('<div/>').addClass('derived_unit').html('<i class="fa fa-times"></i><span><span class="custom_unit_box" data-unit="' + window.SwiftCalcsSettings.settings.single_convert_units[i] + '">' + window.SwiftCalcsLatexHelper.latexToHtml("\\Unit{" + window.SwiftCalcsSettings.settings.single_convert_units[i] + "}") + '</span></span>').appendTo($('div.single_convert_units .added_units'));
			}
			window.SwiftCalcsSettings.settings.single_convert_units = new_settings;
			$('div.single_convert_units .added_units i.fa-times').on('click', function(e) {
				$(this).closest('.derived_unit').remove();
				buildAutocompleteSettings();
				e.preventDefault();
				e.stopPropagation();
				return false;
			});
			$('<span/>').addClass('add_unit').html('Add a Unit').on('click', function(e) {
				window.SwiftCalcsSettings.settings.single_convert_units.push('');
				setAutocomplete(true);
				$('div.single_convert_units span.custom_unit_box').last().click();
			}).appendTo('div.single_convert_units .added_units');
			$('.popup_dialog .full').scrollTop(y);
			var mq_onblur = function() {
				return function(mq) {
					$('span.standalone_textarea').remove();
					var jQ = mq.jQ;
					var unit = mq.latex();
					var unit_text = mq.text().replace(/_/g,'');
					if(unit_text.trim().length == 0) {
						$(jQ).closest('.derived_unit').remove();
						buildAutocompleteSettings();
						return;
					}
					if(!unit_text.match(/^[a-z]$/i)) {
						showNotice('Autocomplete settings should only be 1 letter units (m, N, s, etc), not longer units or combined units (cm, m/s).', 'red');
						mq.clear().write("\\Unit{" + $(this).attr('data-unit') + "}");
						mq.keystroke("Left", {preventDefault: function() {} });
						unit_text = '';
					} else 
						window.SwiftCalcsSettings.showApplyNow();
					mq.revert();
					jQ.html('');
					var span = $('<span/>').addClass('custom_unit_box');
					span.attr('data-unit', unit_text);
					jQ.append(span);
					buildAutocompleteSettings();
				}
			}
			$('div.single_convert_units span.custom_unit_box').on('click', function(e) {
				var span = $('<span/>').addClass('choose_unit').appendTo($(this).parent());
				var mq = window.standaloneMathquill(span, false, true, { blur: mq_onblur() });
				mq.setUnitsOnly(true);
				mq.write("\\Unit{" + $(this).attr('data-unit') + "}");
				//mq.focus();
				mq.keystroke("Left", {preventDefault: function() {} });
				$(this).remove();
				e.stopPropagation();
				e.preventDefault();
			});
		}
		var buildAutocompleteSettings = function() {
			window.SwiftCalcsSettings.settings.single_convert_units = [];
			$('div.single_convert_units .added_units .custom_unit_box').each(function() {
				window.SwiftCalcsSettings.settings.single_convert_units.push($(this).attr('data-unit'));
			});
			setAutocomplete(false);
		}
		setAutocomplete(false);
		$('<a href="#"></a>').html('Remove all').on('click', function(e) {
			window.SwiftCalcsSettings.settings.single_convert_units = [];
			setAutocomplete(false);
		}).appendTo('div.single_convert_units .remove_units');
	}
});

Worksheet.open(function(_) {
	_.settings_loaded = false;
	var default_currency_date = '0';
	_.setSettingsText = function() {
		var out = "";
		out += this.settings.angle == 'rad' ? 'Rad' : 'Deg';
		out += ", ";
    out += this.settings.complex == 'on' ? 'Cplx' : 'Real';
    out += ", ";
    //out += this.settings.approx == 'on' ? 'Approx' : 'Exact';
    //out += ", ";
		//out += this.settings.digits;
		//out += " digits, " 
		out += this.settings.base_units[0] + ', ' + this.settings.base_units[1] + ', ' + this.settings.base_units[2] + ', ' + this.settings.base_units[3].replace("deg","&deg;");
		return out;
	}
  var start_approx_mode = false;
  _.loadSettingsPane = function() {
  	window.showLoadingOnTop();
  	window.ajaxRequest("/worksheets/load_settings",{},function(_this) { return function(response) {
  		_this.populateSettingsPane(response.html);
  	}; }(this), function(err) {
  		window.hidePopupOnTop();
  	})
  }
	_.populateSettingsPane = function(settingsHTML) {
		window.SwiftCalcsSettings.loadAndAttachListeners(settingsHTML, this);
    start_approx_mode = this.settings.approx;
		$('input.datepicker').datepicker({autoHide: true, format: 'yyyy-mm-dd', endDate: new Date(), zIndex: 99999});
		if(this.settings.currency_date != default_currency_date)
			$('input.datepicker').datepicker('setDate', this.settings.currency_date);
		$('input.datepicker').val($('input.datepicker').datepicker('getDate', true));
		var _this = this;
		$('input.datepicker').on('pick.datepicker', function (e) {
			if(e.view == 'day') {
				if($('input.datepicker').datepicker('formatDate', e.date) == $('input.datepicker').datepicker('formatDate', new Date()))
		  		_this.settings.currency_date = default_currency_date;
				else
		  		_this.settings.currency_date = $('input.datepicker').datepicker('formatDate', e.date);
		  	window.SwiftCalcsSettings.showApplyNow();
			}
		});
		$('.popup_dialog .bottom_links button.submit').on('click', function(_this) { return function(e) { 
			$('.popup_dialog .settings').remove();
			window.hideDialogs();
			_this.jQ.closest('.active_holder').find('div.settings').html(_this.setSettingsText())
      if(start_approx_mode != _this.settings.approx) {
        //Approx mode changed...need to go through and reset approx mode on all items in worksheet
        _this.commandChildren(function(approx_mode) { return function(el) {
          if(el instanceof MathOutput) {
            el.approx = approx_mode;
            for(var i = 0; i < el.commands.length; i++)
              el.commands[i].approx = approx_mode;
          }
        }; }(_this.settings.approx === 'on'));
        _this.save();
      }
			_this.setSettings(true); 
		}; }(this));
	}
	var error_shown = false;
	_.bindSettings = function() {
		if(!(this.settings.saved == "true") && !(this.settings.saved ===true)) 
			this.settings = window.SwiftCalcsSettings.settings;
		// Add new settings that aren't in all files
    if(typeof this.settings.digits === 'undefined') this.settings.digits = window.SwiftCalcsSettings.settings.digits;
    if(typeof this.settings.approx === 'undefined') this.settings.approx = window.SwiftCalcsSettings.settings.approx;
    if(typeof this.settings.currency_date === 'undefined') this.settings.currency_date = default_currency_date;
    if(typeof this.settings.currency_unit === 'undefined') this.settings.currency_unit = window.SwiftCalcsSettings.settings.currency_unit;
    if(typeof this.settings.one_indexed === 'undefined') this.settings.one_indexed = window.SwiftCalcsSettings.settings.one_indexed;
		this.setSettings(false);
		return this;
	}
	_.unbindSettings = function() {
		return this;
	}
	_.setSettings = function(recalculate) {
		this.settings_loaded = false;
		if(window.currency_conversion[this.settings.currency_date]) this.setCurrencyConversion(recalculate);
		else {
			var _this = this;
			startProgress('Loading Currency Conversion Data');
			window.ajaxRequest("/currency", {date: this.settings.currency_date}, function(response) {
				window.currency_conversion[response.date] = response.data;
				setComplete();
				_this.setCurrencyConversion(recalculate);
			}, function(response) {
				error_shown = true;
				window.currency_conversion[_this.settings.currency_date] = default_currency_date;
				_this.setCurrencyConversion(recalculate);
			});
		}
	}
	_.setCurrencyConversion = function(recalculate) {
		var data = window.currency_conversion[this.settings.currency_date]
		if(data == default_currency_date) {
			data = window.currency_conversion[data];
			if(!error_shown) {
				error_shown = true;
				window.setTimeout(function(rate) { return function() { showNotice("Could not load rates for " + rate + ": Calculating with current exchange rate"); }; }(this.settings.currency_date), 1);
			}
		}
		giac.sendCommand({setCurrencyConversion: {coeff: -1, index: -1}})
		$.each(data, function(k,v) {
			giac.sendCommand({setCurrencyConversion: v});
		});
		giac.sendCommand({digits: this.settings.digits,approx_mode: this.settings.approx == 'on', restart_string: "one_index(" + this.settings.one_indexed + ");complex_mode:=" + (this.settings.complex == 'on' ? '1' : '0') + ";angle_radian:=" + (this.settings.angle == 'rad' ? '1' : '0') + ";set_units(_" + (this.settings.angle == 'rad' ? 'rad' : 'deg') + ");", set_units: this.settings.base_units.concat(this.settings.derived_units).concat([this.settings.currency_unit])});
		this.settings_loaded = true;
		if(recalculate !== false) {
			error_shown = false;
			this.settings.saved = true;
			if(this.rights >= 3) window.silentRequest('/worksheet_commands', {command: 'update_settings', data: {hash_string: this.hash_string, settings: this.settings } });
			$('.apply_now').removeClass('shown').hide();
			if(SwiftCalcs.active_worksheet == this) {
				this.save();
				this.fullEvalNeeded().evaluate(); if(!SwiftCalcs.giac.auto_evaluation) { SwiftCalcs.giac.manualEvaluation(); }
			}
		}
	}
});

