/************************************************************************
 * Set settings using the settings sidebar.  Also sets settings on bind *
 ************************************************************************/

Worksheet.open(function(_) {
	var default_settings = { angle: 'rad', complex: 'on', approx: 'off', units: 'mks', digits: '9', custom_units: false, base_units: ['m','kg','s','K'], derived_units: ['A','mol','cd','E','N','Ohm','Pa','J','T','C','F','H','Hz','V','W','Wb'] };
	var showApplyNow = function() {
		$('.popup_dialog .bottom_links button.submit').show();
	}
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
		out += this.settings.base_units[0] + ', ' + this.settings.base_units[1] + ', ' + this.settings.base_units[2] + ', ' + this.settings.base_units[3];
		return out;
	}
	var settingsHTML = "<div class='settings'>"
			+ "<div class='title'><i class='fa fa-cog'></i> Worksheet Settings</div>"
			+ "<div class='section'>"
			+ "Angle Mode: "
			+ "<div class='select'><select class='angle_mode' data-type='angle_mode'>"
			+ "<option value='rad'>Radians</option>"
			+ "<option value='deg'>Degrees</option>"
			+ "</select></div>"
			+ "</div>"
      + "<div class='section'>"
      + "Computational Mode: "
      + "<div class='select'><select class='approx_mode' data-type='approx_mode'>"
      + "<option value='off'>Exact/Symbolic Mode</option>"
      + "<option value='on'>Approximate/Numeric Mode</option>"
      + "</select></div>"
      + "</div>"
      + "<div class='section'>"
      + "Complex Mode: "
      + "<div class='select'><select class='complex_mode' data-type='complex_mode'>"
      + "<option value='on'>Enabled</option>"
      + "<option value='off'>Disabled</option>"
      + "</select></div>"
      + "</div>"
			+ "<div class='section'>"
			+ "Significant Digits: "
			+ "<div class='select'><select class='digits_select' data-type='digits_select'>"
			+ "<option value='1'>1</option>"
			+ "<option value='2'>2</option>"
			+ "<option value='3'>3</option>"
			+ "<option value='4'>4</option>"
			+ "<option value='5'>5</option>"
			+ "<option value='6'>6</option>"
			+ "<option value='7'>7</option>"
			+ "<option value='8'>8</option>"
			+ "<option value='9'>9</option>"
			+ "<option value='10'>10</option>"
			+ "<option value='11'>11</option>"
			+ "<option value='12'>12</option>"
			+ "<option value='13'>13</option>"
			+ "<option value='14'>14</option>"
			+ "</select></div>"
			+ "</div>"
			+ "<div class='section'>"
			+ "Unit System: "
			+ "<div class='select'><select class='unit_mode' data-type='unit_mode'>"
			+ "<option value='mks'>Meters-Kilograms-Seconds</option>"
			+ "<option value='cgs'>Centimeter-Grams-Seconds</option>"
			+ "<option value='ips'>Inch-Pounds-Seconds</option>"
			+ "</select>"
			+ "<div class='explain'><a class='custom_units' href='#'>customize</a></div>"
			+ "</div>"
			+ "<div class='custom_units'>"
			+ "<div><b>Base Units</b></div>"
			+ "<table border=0 width='100%'><tbody>"
			+ "<tr><td>Length: </td><td style='text-align:right;'><span class='length'></span></td></tr>"
			+ "<tr><td>Mass: </td><td style='text-align:right;'><span class='mass'></span></td></tr>"
			+ "<tr><td>Time: </td><td style='text-align:right;'><span class='time'></span></td></tr>"
			+ "<tr><td>Temperature: </td><td style='text-align:right;'><span class='temp'></span></td></tr>"
			+ "</tbody></table>"
			+ "<div><b>Derived Units</b></div>"
			+ "<div class='explain'>"
			+ "Derived units are combinations of base units.  For example, force is mass * length / time^2, but we often express in its own unit for simplicity.  Add derived units to the list below.  When found in answer, base units will be auto-simplified to the derived equivalent."
			+ "</div>"
			+ "<div class='added_units'>"
			+ "</div>"
			+ "<div class='add_unit'>"
			+ "</div>"
			+ "<div class='remove_units explain'>"
			+ "</div>"
			+ "</div>"
			+ "</div>"
			+ "</div>";
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
		switch($(this).attr('data-type')) {
			case 'angle_mode':
				SwiftCalcs.active_worksheet.settings.angle = $(this).val();
				break;
      case 'complex_mode':
        SwiftCalcs.active_worksheet.settings.complex = $(this).val();
        break;
      case 'approx_mode':
        SwiftCalcs.active_worksheet.settings.approx = $(this).val();
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
  var start_approx_mode = false;
	_.loadSettingsPane = function() {
    start_approx_mode = this.settings.approx;
		window.showPopupOnTop();
		$('.popup_dialog .full').html(settingsHTML);
    $('.popup_dialog .bottom_links').html('<button class="submit" style="display:none;">Save Settings and Recalculate</button><button class="close grey">Close</button>');
    window.resizePopup(false);
		$('select.angle_mode').val(this.settings.angle).on('change', handleSelectChange);
    $('select.complex_mode').val(this.settings.complex).on('change', handleSelectChange);
    $('select.approx_mode').val(this.settings.approx).on('change', handleSelectChange);
		$('select.unit_mode').val(this.settings.units).on('change', handleSelectChange);
		$('select.digits_select').val(this.settings.digits).on('change', handleSelectChange);
		$('.popup_dialog .bottom_links button.close').on('click', function(e) { 
			$('.popup_dialog .settings').remove();
			window.hideDialogs();
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
			_this.settingsToGiac(true); 
		}; }(this));
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
	}
	_.bindSettings = function() {
		if(!(this.settings.saved == "true") && !(this.settings.saved ===true)) 
			this.settings = default_settings;
		// Add new settings that aren't in all files
    if(typeof this.settings.digits === 'undefined') this.settings.digits = default_settings.digits;
    if(typeof this.settings.approx === 'undefined') this.settings.approx = default_settings.approx;
		this.settingsToGiac(false);
		return this;
	}
	_.unbindSettings = function() {
		return this;
	}
	_.settingsToGiac = function(recalculate) {
		giac.sendCommand({digits: this.settings.digits,restart_string: "complex_mode:=" + (this.settings.complex == 'on' ? '1' : '0') + ";approx_mode:=" + (this.settings.approx == 'on' ? '1' : '0') + ";angle_radian:=" + (this.settings.angle == 'rad' ? '1' : '0') + ";set_units(_" + (this.settings.angle == 'rad' ? 'rad' : 'deg') + ");", set_units: this.settings.base_units.concat(this.settings.derived_units)});
		if(recalculate !== false) {
			this.settings.saved = true;
			if(this.rights >= 3) window.silentRequest('/worksheet_commands', {command: 'update_settings', data: {hash_string: this.hash_string, settings: this.settings } });
			$('.apply_now').removeClass('shown').hide();
			SwiftCalcs.active_worksheet.ends[-1].evaluate(true, true); if(!SwiftCalcs.giac.auto_evaluation) { SwiftCalcs.giac.manualEvaluation(); }
		}
	}
});
