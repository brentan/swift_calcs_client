/************************************************************************
 * Set settings using the settings sidebar.  Also sets settings on bind *
 ************************************************************************/

Worksheet.open(function(_) {
	var default_settings = { angle: 'rad', complex: 'on', units: 'mks', digits: '9', custom_units: false, base_units: ['m','kg','s','K'], derived_units: ['A','mol','cd','E','N','Ohm','Pa','J','T','C','F','H','Hz','V','W','Wb'] };
	var showApplyNow = function() {
		if(!$('.apply_now').hasClass('shown')) {
			$('.apply_now').hide().addClass('shown').slideDown({duration: 250});
			window.setTimeout(function() { $('.apply_now').stop().css("background-color", "#ffa0a0").animate({ backgroundColor: "#d7e0e2"}, {complete: function() { $(this).css('background-color','')} , duration: 500 }) }, 300);
		}
	}
	var setUnitSidebar = function(_this) {
		if((_this.settings.custom_units == "true") || (_this.settings.custom_units ===true)) {
	    $('div.custom_units').addClass('shown');
	    $('a.custom_units').hide();
		} else {
	    $('a.custom_units').show();
	    $('div.custom_units').removeClass('shown');
		}
		$('div.custom_units span.length').html('<span class="custom_unit_box" data-unit="' + _this.settings.base_units[0] + '">' + _this.latexToHtml("\\Unit{" + _this.settings.base_units[0] + "}") + '</span>');
		$('div.custom_units span.mass').html('<span class="custom_unit_box" data-unit="' + _this.settings.base_units[1] + '">' + _this.latexToHtml("\\Unit{" + _this.settings.base_units[1] + "}") + '</span>');
		$('div.custom_units span.time').html('<span class="custom_unit_box" data-unit="' + _this.settings.base_units[2] + '">' + _this.latexToHtml("\\Unit{" + _this.settings.base_units[2] + "}") + '</span>');
		$('div.custom_units span.temp').html('<span class="custom_unit_box" data-unit="' + _this.settings.base_units[3] + '">' + _this.latexToHtml("\\Unit{" + _this.settings.base_units[3] + "}") + '</span>');
		$('div.custom_units .added_units').html('');
		for(var i = 0; i < _this.settings.derived_units.length; i++) {
			$('<div/>').addClass('derived_unit').html('<i class="fa fa-times"></i><span><span class="custom_unit_box" data-unit="' + _this.settings.derived_units[i] + '">' + _this.latexToHtml("\\Unit{" + _this.settings.derived_units[i] + "}") + '</span></span>').appendTo($('div.custom_units .added_units'));
		}
		$('div.custom_units .added_units i.fa-times').on('click', function(e) {
			$(this).closest('.derived_unit').remove();
			_this.buildUnitSettings();
			e.preventDefault();
			e.stopPropagation();
			return false;
		})
		var mq_onblur = function(_this) {
			return function(mq) {
				$('span.standalone_textarea').remove();
				var jQ = mq.jQ;
				var unit = mq.latex();
				var unit_text = mq.text().replace(/_/g,'');
				if(!unit_text.match(/^[a-z2µ]+$/i)) {
					showNotice('Unit settings should only be single units (m, N, Pa, etc), not combined units (m/s).', 'red');
					unit_text = unit.replace(/^\\Unit\{(.*)\}$/,"$1");
				} else {
					showApplyNow();
				}
				mq.revert();
				jQ.html('');
				var span = $('<span/>').addClass('custom_unit_box');
				span.attr('data-unit', unit_text);
				jQ.append(span);
				_this.buildUnitSettings();
			}
		}
		$('span.custom_unit_box').on('click', function(e) {
			var span = $('<span/>').addClass('choose_unit').appendTo($(this).parent());
			var mq = window.standaloneMathquill(span, false, true, { blur: mq_onblur(_this) });
			mq.setUnitsOnly(true);
			mq.write("\\Unit{" + $(this).attr('data-unit') + "}");
			//mq.focus();
			mq.keystroke("Left", {preventDefault: function() {} });
			$(this).remove();
		});
	}
	_.buildUnitSettings = function() {
		this.settings.base_units[0] = $('div.custom_units span.length .custom_unit_box').attr('data-unit');
		this.settings.base_units[1] = $('div.custom_units span.mass .custom_unit_box').attr('data-unit');
		this.settings.base_units[2] = $('div.custom_units span.time .custom_unit_box').attr('data-unit');
		this.settings.base_units[3] = $('div.custom_units span.temp .custom_unit_box').attr('data-unit');
		this.settings.derived_units = [];
		var _this = this;
		$('div.custom_units .added_units .custom_unit_box').each(function() {
			_this.settings.derived_units.push($(this).attr('data-unit'));
		});
		this.settings.custom_units = $('div.custom_units').hasClass('shown');
		setUnitSidebar(this);
	}
	var handleSelectChange = function(e) {
		switch($(this).attr('id')) {
			case 'angle_mode':
				SwiftCalcs.active_worksheet.settings.angle = $(this).val();
				break;
			case 'complex_mode':
				SwiftCalcs.active_worksheet.settings.complex = $(this).val();
				break;
			case 'digits_select':
				SwiftCalcs.active_worksheet.settings.digits = $(this).val();
				break;
			case 'unit_mode':
				SwiftCalcs.active_worksheet.settings.units = $(this).val();
				switch(SwiftCalcs.active_worksheet.settings.units) {
					case 'mks':
						var base = ['m','kg','s','K'];
						var derived = ['A','mol','cd','E','N','Ohm','Pa','J','T','C','F','H','Hz','V','W','Wb'];
						break;
					case 'cgs':
						var base = ['cm','g','s','K'];
						var derived = ['mL','A','mol','cd','E','N','Ohm','Pa','J','T','C','F','H','Hz','V','W','Wb'];
						break;
					case 'ips':
						var base = ['in','lb','s','Rankine'];
						var derived = ['gal','A','mol','cd','E','lbf','Ohm','psi','Btu','T','C','F','H','Hz','V','hp','Wb'];
						break;
				}
				SwiftCalcs.active_worksheet.settings.base_units = base;
				SwiftCalcs.active_worksheet.settings.derived_units = derived;
				setUnitSidebar(SwiftCalcs.active_worksheet);
				break;
		}
		showApplyNow();
	}
	_.bindSettings = function() {
		if(!(this.settings.saved == "true") && !(this.settings.saved ===true)) 
			this.settings = default_settings;
		// Add new settings that aren't in all files
		if(typeof this.settings.digits === 'undefined') this.settings.digits = default_settings.digits;
		$('select#angle_mode').val(this.settings.angle).on('change', handleSelectChange);
		$('select#complex_mode').val(this.settings.complex).on('change', handleSelectChange);
		$('select#unit_mode').val(this.settings.units).on('change', handleSelectChange);
		$('select#digits_select').val(this.settings.digits).on('change', handleSelectChange);
		$('.apply_now').on('click', function(_this) { return function(e) { _this.settingsToGiac(true); }; }(this));
		setUnitSidebar(this);
		var _this = this;
		$('<span/>').html('Add a Unit').on('click', function(e) {
			_this.settings.derived_units.push('');
			setUnitSidebar(_this);
			$('span.custom_unit_box').last().click();
		}).appendTo('div.custom_units .add_unit');
		$('<a href="#"></a>').html('Remove all Derived Units').on('click', function(e) {
			_this.settings.derived_units = [];
			setUnitSidebar(_this);
		}).appendTo('div.custom_units .remove_units');
		this.settingsToGiac(false);
		return this;
	}
	_.unbindSettings = function() {
		$('select#angle_mode').off('change', handleSelectChange);
		$('select#complex_mode').off('change', handleSelectChange);
		$('select#unit_mode').off('change', handleSelectChange);
		$('select#digits_select').off('change', handleSelectChange);
		$('.apply_now').off('click');
		$('div.custom_units .add_unit span').remove();
		$('div.custom_units .remove_units a').remove();
		return this;
	}
	_.settingsToGiac = function(recalculate) {
		giac.sendCommand({restart_string: "DIGITS:=" + (this.settings.digits) + ";complex_mode:=" + (this.settings.complex == 'on' ? '1' : '0') + ";angle_radian:=" + (this.settings.angle == 'rad' ? '1' : '0') + ";", set_units: this.settings.base_units.concat(this.settings.derived_units)});
		if(recalculate !== false) {
			this.settings.saved = true;
			if(this.rights >= 3) window.silentRequest('/worksheet_commands', {command: 'update_settings', data: {id: this.server_id, settings: this.settings } });
			$('.apply_now').removeClass('shown').hide();
			SwiftCalcs.active_worksheet.ends[-1].evaluate(true, true); if(!SwiftCalcs.giac.auto_evaluation) { SwiftCalcs.giac.manualEvaluation(); }
		}
	}
});
