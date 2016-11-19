/************************************************************************
 * Set settings using the settings sidebar.  Also sets settings on bind *
 ************************************************************************/

Worksheet.open(function(_) {
	_.settings_loaded = false;
	var default_settings = { currency_date: '0', currency_unit: 'USD', angle: 'rad', complex: 'on', approx: 'off', units: 'mks', digits: '9', custom_units: false, base_units: ['m','kg','s','K'], derived_units: ['A','mol','cd','N','Ohm','Pa','J','T','C','F','H','Hz','V','W','Wb'] };
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
			+ "Default Currency: "
			+ "<div class='select'><select class='currency_unit' data-type='currency_unit'>"
			+ "<option value='USD'>United States Dollar</option>"
      + "<option value='EUR'>Euro</option>"
      + "<option value='GBP'>British Pound Sterling</option>"
      + "<option value='CNY'>Chinese Yuan</option>"
      + "<option value='JPY'>Japanese Yen</option>"
			+ "<option value='AED'>United Arab Emirates Dirham</option>"
			+ "<option value='AFN'>Afghan Afghani</option>"
			+ "<option value='ALL'>Albanian Lek</option>"
			+ "<option value='AMD'>Armenian Dram</option>"
			+ "<option value='ANG'>Netherlands Antillean Guilder</option>"
			+ "<option value='AOA'>Angolan Kwanza</option>"
			+ "<option value='ARS'>Argentine Peso</option>"
			+ "<option value='AWG'>Aruban Florin</option>"
			+ "<option value='AZN'>Azerbaijani Manat</option>"
			+ "<option value='BAM'>Bosnia-Herzegovina Convertible Mark</option>"
			+ "<option value='BBD'>Barbadian Dollar</option>"
			+ "<option value='BDT'>Bangladeshi Taka</option>"
			+ "<option value='BGN'>Bulgarian Lev</option>"
			+ "<option value='BHD'>Bahraini Dinar</option>"
			+ "<option value='BIF'>Burundian Franc</option>"
			+ "<option value='BMD'>Bermudan Dollar</option>"
			+ "<option value='BND'>Brunei Dollar</option>"
			+ "<option value='BOB'>Bolivian Boliviano</option>"
			+ "<option value='BRL'>Brazilian Real</option>"
			+ "<option value='BSD'>Bahamian Dollar</option>"
			+ "<option value='BTC'>Bitcoin</option>"
			+ "<option value='BTN'>Bhutanese Ngultrum</option>"
			+ "<option value='BWP'>Botswanan Pula</option>"
			+ "<option value='BYN'>Belarusian Ruble</option>"
			+ "<option value='BZD'>Belize Dollar</option>"
			+ "<option value='CAD'>Canadian Dollar</option>"
			+ "<option value='CDF'>Congolese Franc</option>"
			+ "<option value='CHF'>Swiss Franc</option>"
			+ "<option value='CLP'>Chilean Peso</option>"
			+ "<option value='COP'>Colombian Peso</option>"
			+ "<option value='CRC'>Costa Rican Colón</option>"
			+ "<option value='CUC'>Cuban Convertible Peso</option>"
			+ "<option value='CUP'>Cuban Peso</option>"
			+ "<option value='CVE'>Cape Verdean Escudo</option>"
			+ "<option value='CZK'>Czech Republic Koruna</option>"
			+ "<option value='DJF'>Djiboutian Franc</option>"
			+ "<option value='DKK'>Danish Krone</option>"
			+ "<option value='DOP'>Dominican Peso</option>"
			+ "<option value='DZD'>Algerian Dinar</option>"
			+ "<option value='EEK'>Estonian Kroon</option>"
			+ "<option value='EGP'>Egyptian Pound</option>"
			+ "<option value='ERN'>Eritrean Nakfa</option>"
			+ "<option value='ETB'>Ethiopian Birr</option>"
			+ "<option value='FJD'>Fijian Dollar</option>"
			+ "<option value='FKP'>Falkland Islands Pound</option>"
			+ "<option value='GEL'>Georgian Lari</option>"
			+ "<option value='GGP'>Guernsey Pound</option>"
			+ "<option value='GHS'>Ghanaian Cedi</option>"
			+ "<option value='GIP'>Gibraltar Pound</option>"
			+ "<option value='GMD'>Gambian Dalasi</option>"
			+ "<option value='GNF'>Guinean Franc</option>"
			+ "<option value='GTQ'>Guatemalan Quetzal</option>"
			+ "<option value='GYD'>Guyanaese Dollar</option>"
			+ "<option value='HKD'>Hong Kong Dollar</option>"
			+ "<option value='HNL'>Honduran Lempira</option>"
			+ "<option value='HRK'>Croatian Kuna</option>"
			+ "<option value='HTG'>Haitian Gourde</option>"
			+ "<option value='HUF'>Hungarian Forint</option>"
			+ "<option value='IDR'>Indonesian Rupiah</option>"
			+ "<option value='ILS'>Israeli New Sheqel</option>"
			+ "<option value='IMP'>Manx pound</option>"
			+ "<option value='INR'>Indian Rupee</option>"
			+ "<option value='IQD'>Iraqi Dinar</option>"
			+ "<option value='IRR'>Iranian Rial</option>"
			+ "<option value='ISK'>Icelandic Krona</option>"
			+ "<option value='JEP'>Jersey Pound</option>"
			+ "<option value='JMD'>Jamaican Dollar</option>"
			+ "<option value='JOD'>Jordanian Dinar</option>"
			+ "<option value='KES'>Kenyan Shilling</option>"
			+ "<option value='KGS'>Kyrgystani Som</option>"
			+ "<option value='KHR'>Cambodian Riel</option>"
			+ "<option value='KMF'>Comorian Franc</option>"
			+ "<option value='KPW'>North Korean Won</option>"
			+ "<option value='KRW'>South Korean Won</option>"
			+ "<option value='KWD'>Kuwaiti Dinar</option>"
			+ "<option value='KYD'>Cayman Islands Dollar</option>"
			+ "<option value='KZT'>Kazakhstani Tenge</option>"
			+ "<option value='LAK'>Laotian Kip</option>"
			+ "<option value='LBP'>Lebanese Pound</option>"
			+ "<option value='LKR'>Sri Lankan Rupee</option>"
			+ "<option value='LRD'>Liberian Dollar</option>"
			+ "<option value='LSL'>Lesotho Loti</option>"
			+ "<option value='LTL'>Lithuanian Litas</option>"
			+ "<option value='LVL'>Latvian Lats</option>"
			+ "<option value='LYD'>Libyan Dinar</option>"
			+ "<option value='MAD'>Moroccan Dirham</option>"
			+ "<option value='MDL'>Moldovan Leu</option>"
			+ "<option value='MGA'>Malagasy Ariary</option>"
			+ "<option value='MKD'>Macedonian Denar</option>"
			+ "<option value='MMK'>Myanma Kyat</option>"
			+ "<option value='MNT'>Mongolian Tugrik</option>"
			+ "<option value='MOP'>Macanese Pataca</option>"
			+ "<option value='MRO'>Mauritanian Ouguiya</option>"
			+ "<option value='MTL'>Maltese Lira</option>"
			+ "<option value='MUR'>Mauritian Rupee</option>"
			+ "<option value='MVR'>Maldivian Rufiyaa</option>"
			+ "<option value='MWK'>Malawian Kwacha</option>"
			+ "<option value='MXN'>Mexican Peso</option>"
			+ "<option value='MYR'>Malaysian Ringgit</option>"
			+ "<option value='MZN'>Mozambican Metical</option>"
			+ "<option value='NAD'>Namibian Dollar</option>"
			+ "<option value='NGN'>Nigerian Naira</option>"
			+ "<option value='NIO'>Nicaraguan Cordoba</option>"
			+ "<option value='NOK'>Norwegian Krone</option>"
			+ "<option value='NPR'>Nepalese Rupee</option>"
			+ "<option value='NZD'>New Zealand Dollar</option>"
			+ "<option value='OMR'>Omani Rial</option>"
			+ "<option value='PAB'>Panamanian Balboa</option>"
			+ "<option value='PEN'>Peruvian Nuevo Sol</option>"
			+ "<option value='PGK'>Papua New Guinean Kina</option>"
			+ "<option value='PHP'>Philippine Peso</option>"
			+ "<option value='PKR'>Pakistani Rupee</option>"
			+ "<option value='PLN'>Polish Zloty</option>"
			+ "<option value='PYG'>Paraguayan Guarani</option>"
			+ "<option value='QAR'>Qatari Rial</option>"
			+ "<option value='RON'>Romanian Leu</option>"
			+ "<option value='RSD'>Serbian Dinar</option>"
			+ "<option value='RUB'>Russian Ruble</option>"
			+ "<option value='RWF'>Rwandan Franc</option>"
			+ "<option value='SAR'>Saudi Riyal</option>"
			+ "<option value='SBD'>Solomon Islands Dollar</option>"
			+ "<option value='SCR'>Seychellois Rupee</option>"
			+ "<option value='SDG'>Sudanese Pound</option>"
			+ "<option value='SEK'>Swedish Krona</option>"
			+ "<option value='SGD'>Singapore Dollar</option>"
			+ "<option value='SHP'>Saint Helena Pound</option>"
			+ "<option value='SLL'>Sierra Leonean Leone</option>"
			+ "<option value='SOS'>Somali Shilling</option>"
			+ "<option value='SRD'>Surinamese Dollar</option>"
			+ "<option value='SVC'>Salvadoran Colón</option>"
			+ "<option value='SYP'>Syrian Pound</option>"
			+ "<option value='SZL'>Swazi Lilangeni</option>"
			+ "<option value='THB'>Thai Baht</option>"
			+ "<option value='TJS'>Tajikistani Somoni</option>"
			+ "<option value='TMT'>Turkmenistani Manat</option>"
			+ "<option value='TND'>Tunisian Dinar</option>"
			+ "<option value='TOP'>Tongan Paanga</option>"
			+ "<option value='TRY'>Turkish Lira</option>"
			+ "<option value='TTD'>Trinidad and Tobago Dollar</option>"
			+ "<option value='TWD'>New Taiwan Dollar</option>"
			+ "<option value='TZS'>Tanzanian Shilling</option>"
			+ "<option value='UAH'>Ukrainian Hryvnia</option>"
			+ "<option value='UGX'>Ugandan Shilling</option>"
			+ "<option value='UYU'>Uruguayan Peso</option>"
			+ "<option value='UZS'>Uzbekistan Som</option>"
			+ "<option value='VEF'>Venezuelan Bolivar Fuerte</option>"
			+ "<option value='VND'>Vietnamese Dong</option>"
			+ "<option value='VUV'>Vanuatu Vatu</option>"
			+ "<option value='WST'>Samoan Tala</option>"
			+ "<option value='XAF'>CFA Franc BEAC</option>"
			+ "<option value='XAG'>Silver Ounce</option>"
			+ "<option value='XAU'>Gold Ounce</option>"
			+ "<option value='XCD'>East Caribbean Dollar</option>"
			+ "<option value='XDR'>Special Drawing Rights</option>"
			+ "<option value='XOF'>CFA Franc BCEAO</option>"
			+ "<option value='XPD'>Palladium Ounce</option>"
			+ "<option value='XPF'>CFP Franc</option>"
			+ "<option value='XPT'>Platinum Ounce</option>"
			+ "<option value='YER'>Yemeni Rial</option>"
			+ "<option value='ZAR'>South African Rand</option>"
			+ "<option value='ZMW'>Zambian Kwacha</option>"
			+ "<option value='ZWL'>Zimbabwean Dollar</option>"
			+ "</select></div>"
			+ "</div>"
			+ "<div class='section'>"
			+ "Currency Exchange Date: "
			+ "<div class='select'><input class='datepicker'></input></div>"
			+ "</div>"
			+ "<div class='section' style='border-bottom-width: 0px;'>"
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
			case 'currency_unit':
				SwiftCalcs.active_worksheet.settings.currency_unit = $(this).val();
				break;
			case 'unit_mode':
				SwiftCalcs.active_worksheet.settings.units = $(this).val();
				switch(SwiftCalcs.active_worksheet.settings.units) {
					case 'mks':
						var base = ['m','kg','s','K'];
						var derived = ['A','mol','cd','N','Ohm','Pa','J','T','C','F','H','Hz','V','W','Wb'];
						break;
					case 'cgs':
						var base = ['cm','g','s','K'];
						var derived = ['mL','A','mol','cd','N','Ohm','Pa','J','T','C','F','H','Hz','V','W','Wb'];
						break;
					case 'ips':
						var base = ['in','lb','s','Rankine'];
						var derived = ['gal','A','mol','cd','lbf','Ohm','psi','Btu','T','C','F','H','Hz','V','hp','Wb'];
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
    $('select.currency_unit').val(this.settings.currency_unit).on('change', handleSelectChange);
		$('select.unit_mode').val(this.settings.units).on('change', handleSelectChange);
		$('select.digits_select').val(this.settings.digits).on('change', handleSelectChange);
		$('input.datepicker').datepicker({autoHide: true, format: 'yyyy-mm-dd', endDate: new Date(), zIndex: 99999});
		if(this.settings.currency_date != default_settings.currency_date)
			$('input.datepicker').datepicker('setDate', this.settings.currency_date);
		$('input.datepicker').val($('input.datepicker').datepicker('getDate', true));
		var _this = this;
		$('input.datepicker').on('pick.datepicker', function (e) {
			if(e.view == 'day') {
				if($('input.datepicker').datepicker('formatDate', e.date) == $('input.datepicker').datepicker('formatDate', new Date()))
		  		_this.settings.currency_date = default_settings.currency_date;
				else
		  		_this.settings.currency_date = $('input.datepicker').datepicker('formatDate', e.date);
		  	showApplyNow();
			}
		});

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
	var error_shown = false;
	_.bindSettings = function() {
		if(!(this.settings.saved == "true") && !(this.settings.saved ===true)) 
			this.settings = default_settings;
		// Add new settings that aren't in all files
    if(typeof this.settings.digits === 'undefined') this.settings.digits = default_settings.digits;
    if(typeof this.settings.approx === 'undefined') this.settings.approx = default_settings.approx;
    if(typeof this.settings.currency_date === 'undefined') this.settings.currency_date = default_settings.currency_date;
    if(typeof this.settings.currency_unit === 'undefined') this.settings.currency_unit = default_settings.currency_unit;
		this.settingsToGiac(false);
		return this;
	}
	_.unbindSettings = function() {
		return this;
	}
	_.settingsToGiac = function(recalculate) {
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
				window.currency_conversion[_this.settings.currency_date] = default_settings.currency_date;
				_this.setCurrencyConversion(recalculate);
			});
		}
	}
	_.setCurrencyConversion = function(recalculate) {
		var data = window.currency_conversion[this.settings.currency_date]
		if(data == default_settings.currency_date) {
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
		giac.sendCommand({digits: this.settings.digits,restart_string: "complex_mode:=" + (this.settings.complex == 'on' ? '1' : '0') + ";approx_mode:=" + (this.settings.approx == 'on' ? '1' : '0') + ";angle_radian:=" + (this.settings.angle == 'rad' ? '1' : '0') + ";set_units(_" + (this.settings.angle == 'rad' ? 'rad' : 'deg') + ");", set_units: this.settings.base_units.concat(this.settings.derived_units).concat([this.settings.currency_unit])});
		this.settings_loaded = true;
		if(recalculate !== false) {
			error_shown = false;
			this.settings.saved = true;
			if(this.rights >= 3) window.silentRequest('/worksheet_commands', {command: 'update_settings', data: {hash_string: this.hash_string, settings: this.settings } });
			$('.apply_now').removeClass('shown').hide();
			if(SwiftCalcs.active_worksheet == this) 
				this.ends[-1].evaluate(true, true); if(!SwiftCalcs.giac.auto_evaluation) { SwiftCalcs.giac.manualEvaluation(); }
		}
	}
});

