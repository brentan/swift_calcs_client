/********************************************************
 * Helper function to build a toolbar for an element
 * Two built in type for text and a mathquill box are
 * provided, and these can be augmented with more options.
 * Look to these defaults for info on structure to pass
 * to the 'attachToolbar' method
 *******************************************************/

Worksheet.open(function(_) {

	_.bindToolbar = function() {
		this.toolbar = Toolbar($('#toolbar_holder'));
		this.attachToolbar(this, this.toolbar.mathToolbar()); // Add the math toolbar by default so that the toolbar is populated
		this.blurToolbar(this);
	}
	_.reshapeToolbar = function() {
		if(!this.toolbar) return;
		this.toolbar.reshapeToolbar();
	}
	_.attachToolbar = function(el, options) {
		if(!this.toolbar) return;
		this.toolbar.attachToolbar(el, options);
		this.reshapeToolbar();
	}
	_.detachToolbar = function() {
		if(!this.toolbar) return;
		this.toolbar.detachToolbar();
	}
	_.blurToolbar = function(el) {
		if(!this.toolbar) return;
		this.toolbar.blurToolbar(el);
	}
	_.unblurToolbar = function() {
		if(!this.toolbar) return;
		this.toolbar.unblurToolbar();
	}
});

var Toolbar = SwiftCalcs.toolbar = P(function(_) {

	_.toolbar = false;
	_.toolbar_holder = false;
	_.init = function(toolbar_holder) {
		this.toolbar_holder = toolbar_holder;
	}
	_.reshapeToolbar = function() {
    var menu_height = max(max(40, $("#account_bar td.middle").height()), $("#account_bar td.right").height());
    $('#account_bar').height(menu_height);
		if(window.matchMedia("only screen and (max-device-width: 480px)").matches) {
			var toolbar_height = 0;
			var extra_padding = 2;
		} else {
			var toolbar_height = this.toolbar_holder.height();
			var extra_padding = 20;
		}
		var top = menu_height;
		var bot = top + toolbar_height;
		$('.worksheet_holder_outer_box').css('padding-top', (bot + extra_padding) + 'px');
		if(!window.matchMedia("only screen and (max-device-width: 480px)").matches)
			this.toolbar_holder.css('top', top + 'px');
		$('div.sidebar').css('top', bot + 'px');
		$('div.leftbar').css('top', top + 'px');
		$('div.anonymous_message').css('top', bot + 'px');
		$('div.leftbar_top').css('height', toolbar_height + 'px');
	}
	var current_toolbar_target = 0;
	_.attachToolbar = function(el, options) {
		if(current_toolbar_target === el) this.unblurToolbar();
		this.detachToolbar();
		SwiftCalcs.current_toolbar = this;
		current_toolbar_target = el;
		// Helper function to build the toolbar.  Parses the options
		var buildMenu = function(element, toolbar) {
			var $ul = $('<ul/>');
			for(var i = 0; i < toolbar.length; i++) {
				var cur_item = toolbar[i];
				if(cur_item.skip) continue;
				if((cur_item.title === '|') && cur_item.hide_mobile) {
					$('<li class="separator hide_on_mobile"></li>').appendTo($ul);
					continue;
				}
				if(cur_item.title === '|') {
					$('<li class="separator"></li>').appendTo($ul);
					continue;
				}
				var $li = $('<li/>');
				if(cur_item.title)
					$li.attr('title', cur_item.title);
				if(cur_item.right)
					$li.addClass('right');
				var $div = $('<div/>').addClass('item').appendTo($li);
				if(cur_item.klass) $div.addClass(cur_item.klass);
				if(cur_item.hide_mobile) $div.addClass('hide_on_mobile');
				if(cur_item.html)
					if(cur_item.html) $div.html(cur_item.html);
				if(cur_item.icon)
					$('<span class="fa fa-' + cur_item.icon + ' fa-fw"></span>').prependTo($div);
				if(cur_item.method) {
					$div.on('mousedown', function(func, el) { return function(e) {
						if(!$(this).closest('ul.base').hasClass('blurred')) func(el, e);
						e.stopPropagation();
						e.preventDefault();
					};}(cur_item.method, element));
				} else {
					$div.on('mousedown', function(e) {
						e.stopPropagation();
						e.preventDefault();
					});
				}
				$div.on('mouseup', function(e) {
					forceHide(this);
				})
				if(cur_item.sub) {
					cur_item.pulldown = true;
					if(cur_item.sub_klass)
						$li.append(buildMenu(element, cur_item.sub).addClass(cur_item.sub_klass));
					else
						$li.append(buildMenu(element, cur_item.sub));
				}
				if(cur_item.colorPicker) {
					cur_item.pulldown = true;
					$li.append(simpleColorPicker(element, cur_item.colorPicker));
				}
				if(cur_item.symbols) {
					cur_item.pulldown = true;
					$li.append(simpleSymbolPicker(element, cur_item.symbols.func, cur_item.symbols.symbols));
				}
				if(cur_item.units) {
					cur_item.pulldown = true;
					$li.append(UnitPicker(element, cur_item.units));
				}
				if(cur_item.commands) {
					cur_item.pulldown = true;
					$li.append(CommandPicker(element, cur_item.commands));
				}
				if(cur_item.pulldown)
					$div.addClass('pulldown');
				$li.appendTo($ul);
			}
			return $ul;
		}
		//build up the toolbar
		this.toolbar = buildMenu(el, options);
		this.toolbar.attr('id', 'toolbar').addClass('base');
		this.toolbar_holder.html('').append(this.toolbar);
		if(el.klass && el.klass.length) 
			this.toolbar_holder.addClass(css_prefix + el.klass.join(' ' + css_prefix));
	}
	_.detachToolbar = function() {
		current_toolbar_target = false;
		var add_tutorial = this.toolbar_holder.hasClass('screen_explanation');
		this.toolbar_holder.removeClass().addClass('toolbar');
		if(add_tutorial) this.toolbar_holder.addClass('screen_explanation').addClass('highlight');
		if(this.toolbar) this.toolbar.remove();
		this.toolbar = false;
		SwiftCalcs.current_toolbar = false;
	}
	_.blurToolbar = function(el) {
		if(el && (el !== current_toolbar_target)) return;
		if(this.toolbar) {
			this.toolbar.addClass('blurred');
			this.toolbar_holder.addClass('blurred');
		}
	}
	_.unblurToolbar = function() {
		if(this.toolbar) {
			this.toolbar.removeClass('blurred');
			this.toolbar_holder.removeClass('blurred');
		}
	}
	// Batch toolbar used when selecting multiple worksheets
	_.batchToolbar = function(tot) {
		if(!window.location.href.match(/\/archive_projects\//) && !window.location.href.match(/.com(:3000)?\/archive/)) {
			// In active worksheet zone
			return [
				{
					id: 'title',
					html: "<span style='font-weight:bold;font-size:1.2em;position:relative;top:-4px;'>" + tot + " item" + (tot > 1 ? 's' : '') + " selected</span>",
					method: function(el) { el.batch('clear'); }
				},
				{
					id: 'batch_archive',
					title: 'Archive',
					icon: 'archive', 
					right: true,
					method: function(el) { el.batch('archive'); }
				},
				{
					id: 'batch_star',
					title: 'Add Star',
					icon: 'star', 
					right: true,
					method: function(el) { el.batch('add_star'); }
				},
				{
					id: 'batch_unstar',
					title: 'Remove Star',
					icon: 'star-o', 
					right: true,
					method: function(el) { el.batch('remove_star'); }
				},
				{
					id: 'batch_move',
					icon: 'share', 
					title: 'Move',
					right: true,
					method: function(el) { el.batch('move'); }
				}
			];
		} else {
			// In archive folder, only option in un-archive
			return [
				{
					id: 'title',
					html: "<span style='font-weight:bold;font-size:1.2em;position:relative;top:-4px;'>" + tot + " item" + (tot > 1 ? 's' : '') + " selected</span>",
					method: function(el) { el.batch('clear'); }
				},
				{
					id: 'batch_unarchive',
					title: 'Restore',
					icon: 'archive', 
					right: true,
					method: function(el) { el.batch('unarchive'); }
				},
				{
					id: 'batch_star',
					title: 'Add Star',
					icon: 'star', 
					right: true,
					method: function(el) { el.batch('add_star'); }
				},
				{
					id: 'batch_unstar',
					title: 'Remove Star',
					icon: 'star-o', 
					right: true,
					method: function(el) { el.batch('remove_star'); }
				}
			];
		}
	}

	// Return the default textToolbar with extra options.  To_add is appended to the menu, and to_remove will remove any items with matching id
	_.textToolbar = function(to_add, to_remove) {
		var toolbar = [
		{
			id: 'format',
			icon: 'paragraph',
			title: 'Paragraph',
			hide_mobile: true,
			sub: [
				{ html: '<h1>Large Heading</h1>', method: function(el) { el.command('H1'); } },
				{ html: '<h2>Medium Heading</h2>', method: function(el) { el.command('H2'); } },
				{ html: '<h3>Small Heading</h3>', method: function(el) { el.command('H3'); } },
				{ html: '<b>Blockquote</b>', method: function(el) { el.command('BLOCKQUOTE'); } },
				{ html: 'Normal', method: function(el) { el.command('normalFormat'); } }
			]
		},
		{ title: '|',
			hide_mobile: true },
		{
			id: 'font-family',
			icon: 'font',
			title: 'Font',
			hide_mobile: true,
			html: '<span class="fontName">Arial</span>',
			sub: [
				{ html: '<span style="font-family: sans-serif;">Arial</span>', method: function(el) { el.command('fontName', 'Arial, sans-serif'); } },
				{ html: '<span style="font-family: \'Comic Sans MS\';">Comic Sans</span>', method: function(el) { el.command('fontName', 'Comic Sans MS'); } },
				{ html: '<span style="font-family: monospace;">Courier</span>', method: function(el) { el.command('fontName', 'Courier, monospace'); } },
				{ html: '<span style="font-family: Impact;">Impact</span>', method: function(el) { el.command('fontName', 'Impact'); } },
				{ html: '<span style="font-family: Tahoma;">Tahoma</span>', method: function(el) { el.command('fontName', 'Tahoma'); } },
				{ html: '<span style="font-family: serif;">Times</span>', method: function(el) { el.command('fontName', 'Times, serif'); } }
			]
		},
		{ title: '|',
			hide_mobile: true },
		{
			id: 'text-height',
			icon: 'text-height',
			title: 'Size',
			hide_mobile: true,
			html: '<span class="fontSize">2</span>',
			sub: [
				{ html: '<span style="font-size:48px;">Font Size 7</span>', method: function(el) { el.command('fontSize', 7); } },
				{ html: '<span style="font-size:32px;">Font Size 6</span>', method: function(el) { el.command('fontSize', 6); } },
				{ html: '<span style="font-size:24px;">Font Size 5</span>', method: function(el) { el.command('fontSize', 5); } },
				{ html: '<span style="font-size:18px;">Font Size 4</span>', method: function(el) { el.command('fontSize', 4); } },
				{ html: '<span style="font-size:16px;">Font Size 3</span>', method: function(el) { el.command('fontSize', 3); } },
				{ html: '<span style="font-size:12px;">Font Size 2</span>', method: function(el) { el.command('fontSize', 2); } },
				{ html: '<span style="font-size:10px;">Font Size 1</span>', method: function(el) { el.command('fontSize', 1); } }
			]
		},
		{ title: '|',
			hide_mobile: true },
		{ 
			id: 'foreColor',
			title: 'Font Color',
			hide_mobile: true,
			html: '<span class="fa-stack" style="line-height: inherit;"><span style="font-size:1.25em;border-bottom:4px solid black;" class="fa fa-font fa-stack-2x foreColor"></span></span>',
			colorPicker: function(el, color) { el.command('foreColor', color); }
		},
		{ 
			id: 'backColor',
			hide_mobile: true,
			title: 'Background Color',
			html: '<span class="fa-stack" style="line-height: inherit;"><span class="fa fa-square fa-stack-2x" style="position:relative;top:-2px;font-size:1.35em;" ></span><span style="color: #ecf0f1;font-size:1.35em;border-bottom:4px solid white;" class="fa fa-font fa-inverse fa-stack-2x backColor"></span></span>',
			colorPicker: function(el, color) { el.command('backColor', color); }
		},
		{ title: '|',
			hide_mobile: true },
		{
			id: 'bold',
			icon: 'bold',
			klass: 'bold',
			title: 'Bold',
			method: function(el) { el.command('bold'); } 
		},
		{
			id: 'italic',
			icon: 'italic',
			klass: 'italic',
			title: 'Italic',
			method: function(el) { el.command('italic'); } 
		},
		{
			id: 'underline',
			icon: 'underline',
			klass: 'underline',
			title: 'Underline',
			method: function(el) { el.command('underline'); } 
		},
		{
			id: 'strikethrough',
			icon: 'strikethrough',
			klass: 'strikethrough',
			title: 'Srike-through',
			hide_mobile: true,
			method: function(el) { el.command('strikeThrough'); } 
		},
		{ title: '|' },
		{
			id: 'subscript',
			icon: 'subscript',
			hide_mobile: true,
			title: 'Subscript',
			method: function(el) { el.command('subscript'); } 
		},
		{
			id: 'superscript',
			icon: 'superscript',
			hide_mobile: true,
			title: 'Superscript',
			method: function(el) { el.command('superscript'); } 
		},
		{
			id: 'link',
			icon: 'link',
			hide_mobile: true,
			title: 'Create link',
			method: function(el) { el.command('createLink'); }, //BRENTAN: This needs a modal to ask the user for URL and TITLE
			sub: [
				{ icon: 'link', method: function(el) { el.command('createLink'); }, title: 'Create Link' },
				{ icon: 'unlink', method: function(el) { el.command('unlink'); }, title: 'Remove Link' },
			]
		},
		{ title: '|',
			hide_mobile: true
		 },
		{
			id: 'justifyLeft',
			icon: 'align-left',
			klass: 'justifyLeft',
			title: 'Left align',
			method: function(el) { el.command('justifyLeft'); } 
		},
		{
			id: 'justifyCenter',
			icon: 'align-center',
			klass: 'justifyCenter',
			title: 'Center align',
			method: function(el) { el.command('justifyCenter'); } 
		},
		{
			id: 'justifyRight',
			icon: 'align-right',
			klass: 'justifyRight',
			title: 'Right align',
			method: function(el) { el.command('justifyRight'); } 
		},
		{
			id: 'justifyFull',
			icon: 'align-justify',
			klass: 'justifyFull',
			title: 'Justify',
			method: function(el) { el.command('justifyFull'); } 
		},
		{ title: '|' },
		{
			id: 'unorderedList',
			icon: 'list-ul',
			title: 'Bulleted list',
			method: function(el) { el.command('insertUnorderedList'); }, 
			sub: [
				{
					id: 'unorderedList',
					icon: 'list-ul',
					title: 'Bulleted list',
					method: function(el) { el.command('insertUnorderedList'); } 
				},
				{
					id: 'orderedList',
					icon: 'list-ol',
					title: 'Numbered list',
					method: function(el) { el.command('insertOrderedList'); } 
				},
				{
					id: 'indent',
					icon: 'indent',
					title: 'Indent',
					method: function(el) { el.command('indent'); } 
				},
				{
					id: 'outdent',
					icon: 'outdent',
					title: 'Remove Indent',
					method: function(el) { el.command('outdent'); } 
				},
			]
		},
		{
			id: 'greek',
			hide_mobile: true,
			title: 'Greek Letters',
			html: '<div style="position: relative;top:-2px;padding:0px 3px;font-family: serif;">&alpha;</div>',
			symbols: {
				func: function(el, symbol) { el.command('write',symbol); },
				symbols: [
					{ html: '&alpha;', cmd: '&alpha;' },
					{ html: '&beta;', cmd: '&beta;' },
					{ html: '&gamma;', cmd: '&gamma;' },
					{ html: '&delta;', cmd: '&delta;' },
					{ html: '&#1013;', cmd: '&#1013;' },
					{ html: '&epsilon;', cmd: '&epsilon;' },
					{ html: '&zeta;', cmd: '&zeta;' },
					{ html: '&eta;', cmd: '&eta;' },
					{ html: '&theta;', cmd: '&theta;' },
					{ html: '&thetasym;', cmd: '&thetasym;' },
					{ html: '&gamma;', cmd: '&gamma;' },
					{ html: '&#989;', cmd: '&#989;' },
					{ html: '&kappa;', cmd: '&kappa;' },
					{ html: '&#1008;', cmd: '&#1008;' },
					{ html: '&lambda;', cmd: '&lambda;' },
					{ html: '&mu;', cmd: '&mu;' },
					{ html: '&nu;', cmd: '&nu;' },
					{ html: '&xi;', cmd: '&xi;' },
					{ html: '&pi;', cmd: '&pi;' },
					{ html: '&piv;', cmd: '&piv;' },
					{ html: '&rho;', cmd: '&rho;' },
					{ html: '&#1009;', cmd: '&#1009;' },
					{ html: '&sigma;', cmd: '&sigma;' },
					{ html: '&sigmaf;', cmd: '&sigmaf;' },
					{ html: '&tau;', cmd: '&tau;' },
					{ html: '&upsilon;', cmd: '&upsilon;' },
					{ html: '&#981;', cmd: '&#981;' },
					{ html: '&phi;', cmd: '&phi;' },
					{ html: '&chi;', cmd: '&chi;' },
					{ html: '&psi;', cmd: '&psi;' },
					{ html: '&omega;', cmd: '&omega;' },
					{ html: '&Gamma;', cmd: '&Gamma;' },
					{ html: '&Delta;', cmd: '&Delta;' },
					{ html: '&Theta;', cmd: '&Theta;' },
					{ html: '&Lambda;', cmd: '&Lambda;' },
					{ html: '&Xi;', cmd: '&Xi;' },
					{ html: '&Pi;', cmd: '&Pi;' },
					{ html: '&Sigma;', cmd: '&Sigma;' },
					{ html: '&Upsilon;', cmd: '&Upsilon;' },
					{ html: '&Phi;', cmd: '&Phi;' },
					{ html: '&Psi;', cmd: '&Psi;' },
					{ html: '&Omega;', cmd: '&Omega;' },
					{ html: '&gt;', cmd: '&gt;' },
					{ html: '&lt;', cmd: '&lt;' },
					{ html: '&#8805;', cmd: '&#8805;' },
					{ html: '&#8804;', cmd: '&#8804;' },
					{ html: '&#8800;', cmd: '&#8800;' },
					{ html: '&#8776;', cmd: '&#8776;' },
					{ html: '&#8734;', cmd: '&#8734;' },
					{ html: '&#8711;', cmd: '&#8711;' },
					{ html: '&plusmn;', cmd: '&plusmn;' },
					{ html: '&#8745;', cmd: '&#8745;' },
					{ html: '&#8746;', cmd: '&#8746;' },
					{ html: '&#8733;', cmd: '&#8733;' },
					{ html: '&#8764;', cmd: '&#8764;' },
					{ html: '&#8709;', cmd: '&#8709;' },
					{ html: '&#8712;', cmd: '&#8712;' },
					{ html: '&#8715;', cmd: '&#8715;' },
					{ html: '&#8713;', cmd: '&#8713;' },
					{ html: '&#8836;', cmd: '&#8836;' },
					{ html: '&#8853;', cmd: '&#8853;' },
					{ html: '&#8855;', cmd: '&#8855;' },
					{ html: '&#8834;', cmd: '&#8834;' },
					{ html: '&#8838;', cmd: '&#8838;' },
					{ html: '&#8835;', cmd: '&#8835;' },
					{ html: '&#8839;', cmd: '&#8839;' },
					{ html: '&#8756;', cmd: '&#8756;' },
					{ html: '&#171;', cmd: '&#171;' },
					{ html: '&#187;', cmd: '&#187;' },
					{ html: '&#8230;', cmd: '&#8230;' },
					{ html: '&#247;', cmd: '&#247;' },
					{ html: '&#176;', cmd: '&#176;' },
				]
			}
		},
		{ title: '|',
			hide_mobile: true },
		{
			id: 'eraser',
			icon: 'eraser',
			hide_mobile: true,
			title: 'Remove all formatting',
			method: function(el) { el.command('removeFormat'); } 
		},
		{
			id: 'mode',
			html: 'Text Mode',
			hide_mobile: true,
			klass: 'text_mode',
			right: true,
			method: function(el) { el.command('mathMode'); },
			sub: [
				{ html: '<span class="fa fa-calculator fa-fw"></span> Change to Math Mode', method: function(el) { el.command('mathMode'); } },
				{klass: 'vaporware', html: '<span class="fa fa-code fa-fw"></span> Change to Code Mode', method: function(el) { showNotice('Feature not yet available'); } },
				{klass: 'vaporware', html: '<span class="fa fa-table fa-fw"></span> Change to Spreadsheet Mode', method: function(el) { showNotice('Feature not yet available'); } },
				{klass: 'vaporware', html: '<span class="fa fa-image fa-fw"></span> Change to Drawing Mode', method: function(el) { showNotice('Feature not yet available'); } }
			]
		}
		];
		if(to_add) {
			for(var i=0; i < to_add.length; i++)
				toolbar.push(to_add[i]);
		}
		if(to_remove) {
			for(var i=0; i < toolbar.length; i++) {
				if(to_remove[toolbar[i].id])
					toolbar[i].skip = true;
			}
		}
		return toolbar;
	}
	// Return the default plot toolbar
	_.plotToolbar = function(el, to_add, to_remove) {
		var data_sets = [];
		var parent_el = (el instanceof subplot) ? el.parent : el;
		var subplots = parent_el.children();
		for(var i = 0; i < subplots.length; i++)
			data_sets.push({ html: (el.id === subplots[i].id ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;' + subplots[i].name(), method: function(id) { return function(el) { el.choose(id); }; }(subplots[i].id) });
		data_sets.push({html: '<span class="fa fa-fw"></span>&nbsp;Add Another Data Set', method: function(el) { el.choose(-1); } });
		var toolbar = [
			{
				id: 'data_series',
				icon: 'line-chart',
				html: '&nbsp;' + ((el instanceof subplot) ? el.name() : 'Data Series') + '&nbsp;',
				title: 'Data Series',
				hide_mobile: true,
				sub: data_sets
			},
			{ title: '|' },
			{
				id: 'labels',
				html: 'Chart Labels&nbsp;',
				title: 'Chart Labels',
				hide_mobile: true ,
				sub: [
					{ html: 'Chart Title', method: function() { $('.plot_title').find('span.title_span').click(); } },
					{ html: 'X Axis Label', method: function() { parent_el.setAxis(0); } },
					{ html: 'Y Axis Label', method: function() { parent_el.setAxis(1); } },
					{ html: 'Secondary Y Axis Label', method: function() { parent_el.setAxis(2); } },
				]
			},
			{
				id: 'limits',
				html: 'Limits&nbsp;',
				hide_mobile: true,
				title: 'Axis Limits',
				sub: [
					{ html: 'X Axis Limits', method: function() { parent_el.setAxis(0); } },
					{ html: 'Y Axis Limits', method: function() { parent_el.setAxis(1); } },
					{ html: 'Secondary Y Axis Limits', method: function() { parent_el.setAxis(2); } },
				]
			},
			(el.chart_type ? { title: '|', hide_mobile: true } : {skip: true}),
			(el.chart_type ? el.chart_type() : {skip: true}),
			(el.c3_type && el.c3_type.match(/^(area|line)$/) ? {
				id: 'spline',
				html: 'Splines&nbsp;',
				title: 'splines',
				hide_mobile: true,
				sub: [
					{ html: (el.spline ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;Enable', method: function(el) { el.command('spline',true); } },
					{ html: (!el.spline ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;Disable', method: function(el) { el.command('spline',false); } },
				]
			} : {skip: true}),
			{ title: '|',
				hide_mobile: true},
			{
				id: 'marker_size',
				icon: 'circle',
				title: 'Marker Size',
				sub: [
					{ html: (el.marker_size === 0 ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;No Marker', method: function(el) { el.command('marker_size',0); } },
					{ html: (el.marker_size === 2 ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="14" height="14" viewPort="0 0 14 14" version="1.1" xmlns="http://www.w3.org/2000/svg"><circle r="2" style="fill: rgb(0, 0, 0); opacity: 1;" cx="7" cy="7"></circle></svg>', method: function(el) { el.command('marker_size',2); } },
					{ html: (el.marker_size === 2.5 ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="14" height="14" viewPort="0 0 14 14" version="1.1" xmlns="http://www.w3.org/2000/svg"><circle r="2.5" style="fill: rgb(0, 0, 0); opacity: 1;" cx="7" cy="7"></circle></svg>', method: function(el) { el.command('marker_size',2.5); } },
					{ html: (el.marker_size === 3 ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="14" height="14" viewPort="0 0 14 14" version="1.1" xmlns="http://www.w3.org/2000/svg"><circle r="3" style="fill: rgb(0, 0, 0); opacity: 1;" cx="7" cy="7"></circle></svg>', method: function(el) { el.command('marker_size',3); } },
					{ html: (el.marker_size === 4 ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="14" height="14" viewPort="0 0 14 14" version="1.1" xmlns="http://www.w3.org/2000/svg"><circle r="4" style="fill: rgb(0, 0, 0); opacity: 1;" cx="7" cy="7"></circle></svg>', method: function(el) { el.command('marker_size',4); } },
					{ html: (el.marker_size === 6 ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="14" height="14" viewPort="0 0 14 14" version="1.1" xmlns="http://www.w3.org/2000/svg"><circle r="6" style="fill: rgb(0, 0, 0); opacity: 1;" cx="7" cy="7"></circle></svg>', method: function(el) { el.command('marker_size',6); } },
				],
				skip: !((el instanceof plot_line) || (el instanceof plot_func))
			},
			{
				id: 'line_weight',
				html: '<svg width="20" height="12" viewPort="0 0 20 12" version="1.1" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="0" x2="20" y2="0" style="stroke-width:1"/><line x1="0" y1="4" x2="20" y2="4" style="stroke-width:2"/><line x1="0" y1="10" x2="20" y2="10" style="stroke-width:3"/></svg>',
				title: 'Line Thickness',
				sub: [
					{ html: (el.line_weight === 0 ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;No Line', method: function(el) { el.command('line_weight',0); } },
					{ html: (el.line_weight === 1 ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="50" height="10" viewPort="0 0 50 10" version="1.1" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="50" y2="5" style="stroke-width:1"/></svg>', method: function(el) { el.command('line_weight',1); } },
					{ html: (el.line_weight === 2 ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="50" height="10" viewPort="0 0 50 10" version="1.1" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="50" y2="5" style="stroke-width:2"/></svg>', method: function(el) { el.command('line_weight',2); } },
					{ html: (el.line_weight === 3 ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="50" height="10" viewPort="0 0 50 10" version="1.1" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="4" x2="50" y2="4" style="stroke-width:3"/></svg>', method: function(el) { el.command('line_weight',3); } },
					{ html: (el.line_weight === 4 ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="50" height="10" viewPort="0 0 50 10" version="1.1" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="4" x2="50" y2="4" style="stroke-width:4"/></svg>', method: function(el) { el.command('line_weight',4); } },
					{ html: (el.line_weight === 5 ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="50" height="10" viewPort="0 0 50 10" version="1.1" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="3" x2="50" y2="3" style="stroke-width:5"/></svg>', method: function(el) { el.command('line_weight',5); } },
				],
				skip: !((el instanceof plot_line) || (el instanceof plot_func))
			},
			{
				id: 'line_style',
				html: '<svg width="20" height="12" viewPort="0 0 20 12" version="1.1" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="3" x2="20" y2="3" style="stroke-width:2"/><line stroke-dasharray="4,4" x1="0" y1="9" x2="20" y2="9" style="stroke-width:2"/></svg>',
				title: 'Line Style',
				sub: [
					{ html: (el.line_style === 'none' ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="100" height="10" viewPort="0 0 100 10" version="1.1" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="5" x2="100" y2="5" style="stroke-width:2"/></svg>', method: function(el) { el.command('line_style','none'); } },
					{ html: (el.line_style === '5_5' ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="100" height="10" viewPort="0 0 100 10" version="1.1" xmlns="http://www.w3.org/2000/svg"><line stroke-dasharray="5, 5" x1="0" y1="5" x2="100" y2="5" style="stroke-width:2"/></svg>', method: function(el) { el.command('line_style',"5_5"); } },
					{ html: (el.line_style === '10_10' ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="100" height="10" viewPort="0 0 100 10" version="1.1" xmlns="http://www.w3.org/2000/svg"><line stroke-dasharray="10, 10" x1="0" y1="5" x2="100" y2="5" style="stroke-width:2"/></svg>', method: function(el) { el.command('line_style',"10_10"); } },
					{ html: (el.line_style === '20_10_5_10' ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="100" height="10" viewPort="0 0 100 10" version="1.1" xmlns="http://www.w3.org/2000/svg"><line stroke-dasharray="20, 10, 5, 10" x1="0" y1="5" x2="100" y2="5" style="stroke-width:2"/></svg>', method: function(el) { el.command('line_style',"20_10_5_10"); } },
					{ html: (el.line_style === '20_10_5_5_5_10' ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;<svg width="100" height="10" viewPort="0 0 100 10" version="1.1" xmlns="http://www.w3.org/2000/svg"><line stroke-dasharray="20,10,5,5,5,10" x1="0" y1="5" x2="100" y2="5" style="stroke-width:2"/></svg>', method: function(el) { el.command('line_style',"20_10_5_5_5_10"); } },
				],
				skip: !((el instanceof plot_line) || (el instanceof plot_func))
			},
			{ 
				id: 'color',
				title: 'Color',
				html: '<span class="fa-stack" style="line-height: inherit;"><span style="font-size:1.25em;border-bottom:4px solid ' + (el.color ? el.color : '#ecf0f1') + ';" class="fa fa-paint-brush fa-stack-2x"></span></span>',
				colorPicker: function(el, color) { el.command('color', color); }
			},
			{ title: '|', id: 'hide_on_plot_only' },
			{
				id: 'label',
				icon: 'tag',
				title: 'Change Label',
				method: function() { 
					el.parent.expand();
					el.focus(L);
					el.label.focus(R).select();
				}
			},
			{
				id: 'y_axis',
				html: '<span class="fa-stack" style="line-height: inherit;"><span style="font-size:1.35em;color:#bbbbbb;" class="fa fa-exchange fa-stack-2x"></span><span class="fa fa-stack-1x" style="font-size:1.35em;font-weight:bold;position:relative;top:-5px;">y</span></span>',
				title: 'Y Axis',
				sub: [
					{ html: (el.y_axis === 'y' ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;Primary Y Axis', method: function(el) { el.command('y_axis','y'); } },
					{ html: (el.y_axis === 'y2' ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;Secondary Y Axis', method: function(el) { el.command('y_axis',"y2"); } },
				]
			},
			{
				id: 'rotated',
				icon: 'repeat',
				title: 'Rotate Axes',
				sub: [
					{ html: (parent_el.rotated ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;Rotated Axes', method: function(el) { (el instanceof subplot) ? el.parent.command('rotated_axes',true) : el.command('rotated_axes',true); } },
					{ html: (!parent_el.rotated ? '<span class="fa fa-fw fa-check"></span>' : '<span class="fa fa-fw"></span>') + '&nbsp;Normal Axes', method: function(el) { (el instanceof subplot) ? el.parent.command('rotated_axes',false) : el.command('rotated_axes',false); } },
				]
			},
			{
				id: 'mode',
				html: 'Plot Mode',
				klass: 'plot_mode',
				right: true,
				sub: [
					{ html: '<span class="fa fa-calculator fa-fw"></span> Change to Math Mode', method: function(el) { (el instanceof subplot) ? el.parent.command('mathMode') : el.command('mathMode'); } },
					{ html: '<span class="fa fa-font fa-fw"></span> Change to Text Mode', method: function(el) { (el instanceof subplot) ? el.parent.command('textMode') : el.command('textMode'); } },
					{klass: 'vaporware', html: '<span class="fa fa-code fa-fw"></span> Change to Code Mode', method: function(el) { showNotice('Feature not yet available'); } },
					{klass: 'vaporware', html: '<span class="fa fa-table fa-fw"></span> Change to Spreadsheet Mode', method: function(el) { showNotice('Feature not yet available'); } },
					{klass: 'vaporware', html: '<span class="fa fa-image fa-fw"></span> Change to Drawing Mode', method: function(el) { showNotice('Feature not yet available'); } }
				]
			}
		];
		if(to_add) {
			for(var i=0; i < to_add.length; i++)
				toolbar.push(to_add[i]);
		}
		if(to_remove) {
			for(var i=0; i < toolbar.length; i++) {
				if(to_remove[toolbar[i].id])
					toolbar[i].skip = true;
			}
		}
		return toolbar;
	}
	// Return the default mathToolbar with extra options.  To_add is appended to the menu, and to_remove will remove any items with matching id
	_.mathToolbar = function(to_add, to_remove) {
		var toolbar = [
		{
			id: 'fraction',
			html: '<div style="position: relative;top:-2px;padding:0px 5px;color: #888888;"><div style="padding-bottom:0px;border-bottom: 1px solid #444444;line-height:9px;font-size:9px;"><span class="fa fa-square-o"></span></div><div style="padding-top: 1px;line-height:9px;font-size:9px;"><span class="fa fa-square-o"></span></div></div>',
			title: 'Fraction',
			method: function(el) { el.command('/'); }
		},
		{
			id: 'exponent',
			html: '<span style="color: #888888;"><span class="fa fa-square-o"></span><sup><span style="position: relative; top: -3px; left: 1px;" class="fa fa-square-o"></span></sup></span>',
			title: 'Exponent',
			method: function(el) { el.command('^'); }
		},
		{
			id: 'sub',
			html: '<span style="color: #888888;"><span class="fa fa-square-o"></span><sub><span style="position: relative; top: 3px; left: 1px;" class="fa fa-square-o"></span></sub></span>',
			title: 'Subscript',
			method: function(el) { el.command('_'); }
		},
		{
			id: 'brackets',
			html: '<div style="position: relative; top: -3px;">(<span style="color: #888888;font-size:10px;"><span class="fa fa-square-o"></span></span>)</div>',
			title: 'Parenthesis',
			method: function(el) { el.command('('); },
			sub: [
				{html: '(<span style="color: #888888;font-size:10px;"><span class="fa fa-square-o"></span></span>)', method: function(el) { el.command('('); }, title: 'Parenthesis' },
				{html: '[<span style="color: #888888;font-size:10px;"><span class="fa fa-square-o"></span></span>]', method: function(el) { el.command('['); }, title: 'Square Bracket' },
				{html: '{<span style="color: #888888;font-size:10px;"><span class="fa fa-square-o"></span></span>}', method: function(el) { el.command('{'); }, title: 'Curly Bracket' },
				{html: '|<span style="color: #888888;font-size:10px;"><span class="fa fa-square-o"></span></span>|', method: function(el) { el.command('|'); }, title: 'Absolute Value' }
			]
		},
		{
			id: 'equality',
			html: '<div style="position: relative; top: -6px;padding: 0px 6px;font-size:18px;">=</div>',
			title: 'Equality',
			sub: [
				{html: '&nbsp;&nbsp;<span style="font-family: Symbola, Times, serif;">&#8801;</span>&nbsp;&nbsp;', method: function(el) { el.command('='); }, title: 'Equality/Assignment' },
				{html: '&nbsp;&nbsp;=&nbsp;&nbsp;', method: function(el) { el.command('\\eq'); }, title: 'Logical Equal' },
				{html: '&nbsp;&nbsp;&#8800;&nbsp;&nbsp;', method: function(el) { el.command('\\ne'); }, title: 'Not Equal' },
				{html: '&nbsp;&nbsp;&gt;&nbsp;&nbsp;', method: function(el) { el.command('>'); }, title: 'Greater Than' },
				{html: '&nbsp;&nbsp;&#8805;&nbsp;&nbsp;', method: function(el) { el.command('\\ge'); }, title: 'Greater Than or Equal To' },
				{html: '&nbsp;&nbsp;&lt;&nbsp;&nbsp;', method: function(el) { el.command('<'); }, title: 'Less Than' },
				{html: '&nbsp;&nbsp;&#8804;&nbsp;&nbsp;', method: function(el) { el.command('\\le'); }, title: 'Less Than or Equal To' },
			]
		},
		{ title: '|' },
		{
			id: 'symbols',
			html: '<div style="position: relative;top:-2px;padding:0px 3px;font-family: serif;">&#8734;</div>',
			title: 'Symbols',
			method: function(el) { el.command('\\infinity'); },
			sub: [
				{html: '&nbsp;&nbsp;<span style="font-family: serif;">&#8734;</span>&nbsp;&nbsp;', title: 'Infinity', method: function(el) { el.command('\\infinity'); } },
				{html: '&nbsp;&nbsp;<span style="font-family: serif;">+&#8734;</span>&nbsp;&nbsp;', title: 'Plus-Infinity', method: function(el) { el.command('+'); el.command('\\infinity'); } },
				{html: '&nbsp;&nbsp;<span style="font-family: serif;">-&#8734;</span>&nbsp;&nbsp;', title: 'Minus-Infinity', method: function(el) { el.command('-'); el.command('\\infinity'); } },
				{html: '&nbsp;&nbsp;<span style="font-family: serif;">i</span>&nbsp;&nbsp;', title: '(-1)^(1/2)', method: function(el) { el.command('i'); } },
				{html: '&nbsp;&nbsp;<span style="font-family: serif;">e</span>&nbsp;&nbsp;', title: '2.71828...', method: function(el) { el.command('e'); } },
				{html: '&nbsp;&nbsp;<span style="font-family: serif;">&pi;</span>&nbsp;&nbsp;', title: '3.14159...', method: function(el) { el.command('\\pi'); } },
			]
		},
		{
			id: 'greek',
			title: 'Greek Letters',
			html: '<div style="position: relative;top:-2px;padding:0px 3px;font-family: serif;">&alpha;</div>',
			symbols: {
				func: function(el, symbol) { el.command(symbol); },
				symbols: [
					{ html: '&alpha;', cmd: '\\alpha' },
					{ html: '&beta;', cmd: '\\beta' },
					{ html: '&gamma;', cmd: '\\gamma' },
					{ html: '&delta;', cmd: '\\delta' },
					{ html: '&#1013;', cmd: '\\epsilon' },
					{ html: '&epsilon;', cmd: '\\varepsilon' },
					{ html: '&zeta;', cmd: '\\zeta' },
					{ html: '&eta;', cmd: '\\eta' },
					{ html: '&theta;', cmd: '\\theta' },
					{ html: '&thetasym;', cmd: '\\vartheta' },
					{ html: '&gamma;', cmd: '\\gamma' },
					{ html: '&#989;', cmd: '\\digamma' },
					{ html: '&kappa;', cmd: '\\kappa' },
					{ html: '&#1008;', cmd: '\\varkappa' },
					{ html: '&lambda;', cmd: '\\lambda' },
					{ html: '&mu;', cmd: '\\mu' },
					{ html: '&nu;', cmd: '\\nu' },
					{ html: '&xi;', cmd: '\\xi' },
					{ html: '&pi;', cmd: '\\pi' },
					{ html: '&piv;', cmd: '\\varpi' },
					{ html: '&rho;', cmd: '\\rho' },
					{ html: '&#1009;', cmd: '\\varrho' },
					{ html: '&sigma;', cmd: '\\sigma' },
					{ html: '&sigmaf;', cmd: '\\varsigma' },
					{ html: '&tau;', cmd: '\\tau' },
					{ html: '&upsilon;', cmd: '\\upsilon' },
					{ html: '&#981;', cmd: '\\phi' },
					{ html: '&phi;', cmd: '\\varphi' },
					{ html: '&chi;', cmd: '\\chi' },
					{ html: '&psi;', cmd: '\\psi' },
					{ html: '&omega;', cmd: '\\omega' },
					{ html: '&Gamma;', cmd: '\\Gamma' },
					{ html: '&Delta;', cmd: '\\Delta' },
					{ html: '&Theta;', cmd: '\\Theta' },
					{ html: '&Lambda;', cmd: '\\Lambda' },
					{ html: '&Xi;', cmd: '\\Xi' },
					{ html: '&Pi;', cmd: '\\Pi' },
					{ html: '&Sigma;', cmd: '\\Sigma' },
					{ html: '&Upsilon;', cmd: '\\Upsilon' },
					{ html: '&Phi;', cmd: '\\Phi' },
					{ html: '&Psi;', cmd: '\\Psi' },
					{ html: '&Omega;', cmd: '\\Omega' },
				]
			}
		},
		{ title: '|' },
		{
			id: 'Units',
			html: '<div style="position: relative;top:-2px;padding:0px 5px;"><div style="padding-bottom:0px;border-bottom: 1px solid #444444;line-height:9px;font-size:9px;">m</div><div style="padding-top: 1px;line-height:9px;font-size:9px;">s</div></div>',
			title: 'Insert Unit',
			method: function(el) { el.command('\\Unit'); },
			units: function(el, cmd, unit) { el.command(cmd, unit); }
		},
		{ title: '|' },
		{
			id: 'roots',
			html: '&#8730;<div style="display:inline-block;border-top:1px solid #444444;padding:0px 3px;position:relative; top:1px;"><span style="color: #888888;font-size:12px;position: relative; top: -2px;"><span class="fa fa-square-o"></span></span></div>',
			title: 'Square Root',
			method: function(el) { el.command('\\sqrt'); },
			sub: [
				{html: '&#8730;<div style="display:inline-block;border-top:1px solid #444444;padding:0px 3px;position:relative; top:1px;"><span style="color: #888888;font-size:12px;position: relative; top: -2px;"><span class="fa fa-square-o"></span></span></div>', method: function(el) { el.command('\\sqrt'); }, title: 'Square Root' },
				{html: '<span style="color: #888888; font-size: 8px; position: relative; top: -8px;" class="fa fa-square-o"></span></span>&#8730;<div style="display:inline-block;border-top:1px solid #444444;padding:0px 3px;position:relative; top:1px;"><span style="color: #888888;font-size:12px;position: relative; top: -2px;"><span class="fa fa-square-o"></span></span></div>', method: function(el) { el.command('\\nthroot'); }, title: 'Nth Root' },
			]
		},
		{
			id: 'summations',
			html: '<span style="position:relative; top: -2px;">&#8721;</span><span style="color: #888888;font-size:12px;position: relative; top: -2px;"><span class="fa fa-square-o"></span></span>',
			title: 'Summation/Product',
			sub: [
				{html: '<span class="mq-math-mode" style="cursor: pointer;"><span class="mq-large-operator mq-non-leaf">&#8721;<span class="mq-from">n</span></span></span><span style="color: #888888;"><span class="fa fa-square-o"></span></span>', method: function(el) { el.command('\\sumn'); }, title: 'Infinite Sum' },
				{html: '<span class="mq-math-mode" style="cursor: pointer;"><span class="mq-large-operator mq-non-leaf"><span class="mq-to"><span style="color: #888888;font-size: 8px;"><span class="fa fa-square-o"></span></span></span>&#8721;<span class="mq-from" style="float:none;">n=<span style="color: #888888;font-size:8px;"><span class="fa fa-square-o"></span></span></span></span></span><span style="color: #888888;position:relative;top:-12px;"><span class="fa fa-square-o"></span></span>', method: function(el) { el.command('\\sum'); }, title: 'Finite Sum' },
				{html: '<span class="mq-math-mode" style="cursor: pointer;"><span class="mq-large-operator mq-non-leaf"><span class="mq-to"><span style="color: #888888;font-size: 8px;"><span class="fa fa-square-o"></span></span></span>&#8719;<span class="mq-from" style="float:none;">n=<span style="color: #888888;font-size:8px;"><span class="fa fa-square-o"></span></span></span></span></span><span style="color: #888888;position:relative;top:-12px;"><span class="fa fa-square-o"></span></span>', method: function(el) { el.command('\\prod'); }, title: 'Finite Product' },
			]
		},
		{
			id: 'integral',
			html: '<div style="padding: 0px 3px;"><span style="position:relative; top: -2px;">&#8747;</span><span style="color: #888888;font-size:12px;position: relative; top: -2px;"><span class="fa fa-square-o"></span></span></div>',
			title: 'Integral/AntiDerivative',
			sub: [
				{html: '<span class="mq-math-mode" style="cursor: pointer;"><span class="mq-large-operator mq-non-leaf">&#8747;</span></span><span style="color: #888888;font-size:10px;"><span class="fa fa-square-o"></span></span>&nbsp;d<span style="color: #888888;font-size:10px;"><span class="fa fa-square-o"></span></span>', method: function(el) { el.command('\\intn'); }, title: 'Indefinate Integral' },
				{html: '<span class="mq-math-mode" style="cursor: pointer;"><span class="mq-large-operator mq-non-leaf"><span class="mq-to"><span style="color: #888888;font-size: 8px;"><span class="fa fa-square-o"></span></span></span>&#8747;<span class="mq-from" style="float:none;"><span style="color: #888888;font-size:8px;"><span class="fa fa-square-o"></span></span></span></span></span><span style="position:relative;top:-12px;"><span style="color: #888888;font-size:10px;"><span class="fa fa-square-o"></span></span>&nbsp;d<span style="color: #888888;font-size:10px;"><span class="fa fa-square-o"></span></span></span>', method: function(el) { el.command('\\int'); }, title: 'Definate Integral' }
			]
		},
		{
			id: 'derivative',
			html: '<div style="position: relative;top:-2px;padding:0px 2px;color: #888888;"><div style="padding-bottom:0px;border-bottom: 1px solid #444444;line-height:9px;font-size:9px;">d&nbsp;<span class="fa fa-square-o"></span></div><div style="padding-top: 1px;line-height:9px;font-size:9px;">dx</div></div>',
			title: 'Derivative',
			method: function(el) { el.command('\\derivative'); },
			sub: [
				{html: '<div style="padding-bottom:0px;border-bottom: 1px solid #444444;line-height:13px;font-size:13px;display:inline-block;">d<span class="fa fa-square-o"></span></div><div style="padding-top: 1px;line-height:9px;font-size:13px;">dx</div>', method: function(el) { el.command('\\derivative'); }, title: 'Derivative' },
				{html: '<div style="padding-bottom:0px;border-bottom: 1px solid #444444;line-height:13px;font-size:13px;display:inline-block;">d<sup><span class="fa fa-square-o"></sup><span class="fa fa-square-o"></span></div><div style="padding-top: 1px;line-height:9px;font-size:13px;">dx<sup><span class="fa fa-square-o"></sup></div>', method: function(el) { el.command('\\derivatived'); }, title: 'Higher Order Derivative' },
				{html: '<div style="padding-bottom:0px;border-bottom: 1px solid #444444;line-height:13px;font-size:13px;display:inline-block;">&#8706;<span class="fa fa-square-o"></span></div><div style="padding-top: 1px;line-height:9px;font-size:13px;">&#8706;x</div>', method: function(el) { el.command('\\pderivative'); }, title: 'Partial Derivative' },
				{html: '<div style="padding-bottom:0px;border-bottom: 1px solid #444444;line-height:13px;font-size:13px;display:inline-block;">&#8706;<sup><span class="fa fa-square-o"></sup><span class="fa fa-square-o"></span></div><div style="padding-top: 1px;line-height:9px;font-size:13px;">&#8706;x<sup><span class="fa fa-square-o"></sup></div>', method: function(el) { el.command('\\pderivatived'); }, title: 'Partial Higher Order Derivative' },
			]
		},
		{
			id: 'limits',
			html: '<span style="position:relative; top: -2px;">lim</span><span style="padding-left:2px;color: #888888;font-size:12px;position: relative; top: -2px;"><span class="fa fa-square-o"></span></span>',
			title: 'Limit',
			sub: [
				{html: '<span class="mq-math-mode" style="cursor: pointer;"><span class="mq-large-operator mq-non-leaf">lim<span class="mq-from" style="float: none;">n&#8594;<span style="color: #888888;font-size: 8px;"><span class="fa fa-square-o"></span></span></span></span></span><span style="color: #888888;position: relative; top: -12px;"><span class="fa fa-square-o"></span></span>', method: function(el) { el.command('\\limit'); }, title: 'Limit' },
				{html: '<span class="mq-math-mode" style="cursor: pointer;"><span class="mq-large-operator mq-non-leaf">lim<span class="mq-from" style="float: none;">n&#8594;<span style="color: #888888;font-size: 8px;"><span class="fa fa-square-o"></span></span>+</span></span></span><span style="color: #888888;position: relative; top: -12px;"><span class="fa fa-square-o"></span></span>', method: function(el) { el.command('\\limitp'); }, title: 'Limit, Approach from Positive Side' },
				{html: '<span class="mq-math-mode" style="cursor: pointer;"><span class="mq-large-operator mq-non-leaf">lim<span class="mq-from" style="float: none;">n&#8594;<span style="color: #888888;font-size: 8px;"><span class="fa fa-square-o"></span></span>-</span></span></span><span style="color: #888888;position: relative; top: -12px;"><span class="fa fa-square-o"></span></span>', method: function(el) { el.command('\\limitn'); }, title: 'Limit, Approach from Negative Side' },
			]
		},
		{
			id: 'sciNotation',
			html: '<span style="position:relative; top: -2px;">&#215;10<sup><span style="color: #888888;font-size:8px;padding-left:1px;"><span class="fa fa-square-o"></span></span></sup></span>',
			title: 'Scientific Notation',
			method: function(el) { el.command('\\scientificNotationToolbar'); },
		},
		{ title: '|' },
		{
			id: 'matrix',
			html: '<span style="position: relative; top: -7px;padding-right:4px;"><span style="font-size:18px;">[</span><span style="font-size: 13px;color: #888888;"><span class="fa fa-th"></span></span><span style="font-size: 18px;">]</span></span>',
			title: 'Matices',
			sub_klass: 'commandPicker',
			method: function(el) { el.command('\\bmatrix'); },
			sub: [
				{html: '<kbd>[</kbd>Insert Matrix&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;', title: 'Insert Matrix', method: function(el) { el.command('\\bmatrix'); } },
				{html: '<kbd>,</kbd>Add Column Before&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;', title: 'Add Column Before', method: function(el) { el.command('matrix_add_column_before'); } },
				{html: '<kbd>,</kbd>Add Column After&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;', title: 'Add Column After', method: function(el) { el.command('matrix_add_column_after'); } },
				{html: '<kbd>;</kbd>Add Row Before&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;', title: 'Add Row Before', method: function(el) { el.command('matrix_add_row_before'); } },
				{html: '<kbd>;</kbd>Add Row After&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;', title: 'Add Row After', method: function(el) { el.command('matrix_add_row_after'); } },
				{html: '<kbd>&lt;</kbd>Remove Column', title: 'Remove Column', method: function(el) { el.command('matrix_remove_column'); } },
				{html: '<kbd>:</kbd>Remove Row', title: 'Remove Row', method: function(el) { el.command('matrix_remove_row'); } },
			]
		},
		{ title: '|' },
		{
			id: 'commands',
			html: '<div style="position: relative;top:-2px;padding:0px 3px;font-family: serif;">Command Library</div>',
			title: 'Command Library',
			hide_mobile: true,
			commands: function(el, cmd, unit) { el.command(cmd, unit); }
		},
		{
			id: 'mode',
			html: 'Math Mode',
			klass: 'math_mode',
			hide_mobile: true,
			right: true,
			method: function(el) { el.command('textMode'); },
			sub: [
				{html: '<span class="fa fa-font fa-fw"></span> Change to Text Mode', method: function(el) { el.command('textMode');} },
				{klass: 'vaporware', html: '<span class="fa fa-code fa-fw"></span> Change to Code Mode', method: function(el) { showNotice('Feature not yet available'); } },
				{klass: 'vaporware', html: '<span class="fa fa-table fa-fw"></span> Change to Spreadsheet Mode', method: function(el) { showNotice('Feature not yet available'); } },
				{klass: 'vaporware', html: '<span class="fa fa-image fa-fw"></span> Change to Drawing Mode', method: function(el) { showNotice('Feature not yet available'); } }
			]
		}
		];
		if(to_add) {
			for(var i=0; i < to_add.length; i++)
				toolbar.push(to_add[i]);
		}
		if(to_remove) {
			for(var i=0; i < toolbar.length; i++) {
				if(to_remove[toolbar[i].id])
					toolbar[i].skip = true;
			}
		}
		return toolbar;
	}
	var forceHide = function(el) {
		var $this = $(el);
		$this.closest('ul.base').find('ul').addClass('force_hide');
		window.setTimeout(function() { $this.closest('ul.base').find('ul').removeClass('force_hide') },500);
	}
	var simpleColorPicker = function(el, func) {
		var opts = {
			colorsPerLine: 8,
			colors: ['#000000', '#444444', '#666666', '#999999', '#cccccc', '#eeeeee', '#f3f3f3', '#ffffff'
					, '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#9900ff', '#ff00ff'
					, '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#cfe2f3', '#d9d2e9', '#ead1dc'
					, '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#9fc5e8', '#b4a7d6', '#d5a6bd'
					, '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6fa8dc', '#8e7cc3', '#c27ba0'
					, '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7', '#a64d79'
					, '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#0b5394', '#351c75', '#741b47'
					, '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#073763', '#20124d', '#4C1130']
		};
		var colorsMarkup = '';
		for(var i = 0; i < opts.colors.length; i++){
			var item = opts.colors[i];
			var breakLine = '';
			if (i % opts.colorsPerLine == 0)
				breakLine = 'clear: both; ';
			if (i > 0 && breakLine && $.browser && $.browser.msie && $.browser.version <= 7) {
				breakLine = '';
				colorsMarkup += '<li style="float: none; clear: both; overflow: hidden; background-color: #fff; display: block; height: 1px; line-height: 1px; font-size: 1px; margin-bottom: -2px;"></li>';
			}
			colorsMarkup += '<li class="color-box" style="' + breakLine + 'background-color: ' + item + '" title="' + item + '"></li>';
		}

		var box = $('<ul class="color-picker">' + colorsMarkup + '</ul>');
		box.find('li.color-box').on('mousedown', function(e) {
			func(el, $(this).attr('title'), e);
			e.stopPropagation();
			e.preventDefault();
		}).on('mouseup', function(e) {
			forceHide(this);
		});
		return box;
	};
	var simpleSymbolPicker = function(el, func, options) {
		var opts = {
			symbolsPerLine: 6,
			symbols: options
		};
		var symbolMarkup = '';
		for(var i = 0; i < opts.symbols.length; i++){
			var item = opts.symbols[i];
			var breakLine = '';
			if (i % opts.symbolsPerLine == 0)
				breakLine = 'clear: both; ';
			if (i > 0 && breakLine && $.browser && $.browser.msie && $.browser.version <= 7) {
				breakLine = '';
				symbolMarkup += '<li style="float: none; clear: both; overflow: hidden; background-color: #fff; display: block; height: 1px; line-height: 1px; font-size: 1px; margin-bottom: -2px;"></li>';
			}
			symbolMarkup += '<li class="symbol-box" style="' + breakLine + '" title="' + item.html + '" + data-item="' + item.cmd + '"><div class="item">' + item.html + '</div></li>';
		}

		var box = $('<ul class="symbol-picker">' + symbolMarkup + '</ul>');
		box.find('li.symbol-box').on('mousedown', function(e) {
			func(el, $(this).attr('data-item'), e);
			e.stopPropagation();
			e.preventDefault();
		}).on('mouseup', function(e) {
			forceHide(this);
		});
		return box;
	};
	var UnitPicker = function(el, func) {
		var units = [
			{
				id: 'Length',
				sub: [
					{name: 'Meter', unit: 'm'},
					{name: 'Centimeter', unit: 'cm'},
					{name: 'Millimeter', unit: 'mm'},
					{name: 'Micrometer', unit: 'µm'},
					{name: 'Kilometer', unit: 'km'},
					{name: 'Yard', unit: 'yd'},
					{name: 'Foot', unit: 'ft'},
					{name: 'Inch', unit: 'in'},
					{name: 'Mile', unit: 'mi'},
					{name: 'Parsec', unit: 'pc'},
					{name: 'Lightyear', unit: 'lyr'},
					{name: 'Astronimical Unit', unit: 'au'},
					{name: 'Nautical Mile', unit: 'nm'},
					{name: 'Chain', unit: 'chain'},
					{name: 'Rod', unit: 'rod'},
					{name: 'Fathom', unit: 'fath'},
					{name: 'Anstrom', unit: 'Angstrom'},
					{name: 'Fermi', unit: 'fermi'},
				]
			},
			{
				id: 'Area',
				sub: [
					{name: 'Square Meter', unit: 'm^2'},
					{name: 'Square Centimeter', unit: 'cm^2'},
					{name: 'Square Kilometer', unit: 'km^2'},
					{name: 'Square Foot', unit: 'ft^2'},
					{name: 'Square Yard', unit: 'yd^2'},
					{name: 'Square Inch', unit: 'in^2'},
					{name: 'Square Mile', unit: 'mi^2'},
					{name: 'Hectare', unit: 'ha'},
					{name: 'Acre', unit: 'acre'},
				]
			},
			{
				id: 'Volume',
				sub: [
					{name: 'Cubic Meter', unit: 'm^3'},
					{name: 'Cubic Centimeter', unit: 'cm^3'},
					{name: 'Cubic Yard', unit: 'yd^3'},
					{name: 'Cubic Foot', unit: 'ft^3'},
					{name: 'Cubic Inch', unit: 'in^3'},
					{name: 'Liter', unit: 'l'},
					{name: 'Milliliter', unit: 'ml'},
					{name: 'Gallon', unit: 'gal'},
					{name: 'Gallon (imperial)', unit: 'galUK'},
					{name: 'Quart', unit: 'qt'},
					{name: 'Pint', unit: 'pt'},
					{name: 'Fluid Ounce', unit: 'ozfl'},
					{name: 'Tablespoon', unit: 'tbsp'},
					{name: 'Teaspoon', unit: 'tsp'},
					{name: 'Barrel', unit: 'bbl'},
				]
			},
			{
				id: 'Time',
				sub: [
					{name: 'Year', unit: 'yr'},
					{name: 'Day', unit: 'd'},
					{name: 'Hour', unit: 'h'},
					{name: 'Minute', unit: 'mn'},
					{name: 'Second', unit: 's'},
					{name: 'Hertz', unit: 'Hz'},
					{name: 'Revelutions per Minute', unit: 'rpm'}
				]
			},
			{
				id: 'Speed',
				sub: [
					{name: 'Meters per Second', unit: 'm/s'},
					{name: 'Centimeters per Second', unit: 'cm/s'},
					{name: 'Kilometers per Hour', unit: 'kph'},
					{name: 'Miles per Hour', unit: 'mph'},
					{name: 'Feet per Second', unit: 'ft/s'},
					{name: 'Knots', unit: 'knot'},
				]
			},
			{
				id: 'Mass',
				sub: [
					{name: 'Kilogram', unit: 'kg'},
					{name: 'Gram', unit: 'g'},
					{name: 'Pound', unit: 'lb'},
					{name: 'Ounce', unit: 'oz'},
					{name: 'Slug', unit: 'slug'},
					{name: 'Ton', unit: 'ton'},
					{name: 'Ton (imperial)', unit: 'tonUK'},
					{name: 'Ton (metric)', unit: 't'},
					{name: 'Carat', unit: 'ct'},
					{name: 'Mole', unit: 'mol'},
				]
			},
			{
				id: 'Force',
				sub: [
					{name: 'Newton', unit: 'N'},
					{name: 'Dyne', unit: 'dyn'},
					{name: 'Gramforce', unit: 'gf'},
					{name: 'Kip', unit: 'kip'},
					{name: 'Poundforce', unit: 'lbf'},
					{name: 'Poundal', unit: 'pdl'},
				]
			},
			{
				id: 'Energy',
				sub: [
					{name: 'Joule', unit: 'J'},
					{name: 'Erg', unit: 'erg'},
					{name: 'Calorie', unit: 'kcal'},
					{name: 'calorie', unit: 'cal'},
					{name: 'Btu', unit: 'Btu'},
					{name: 'Therm', unit: 'therm'},
					{name: 'Watt-Hour', unit: 'Wh'},
					{name: 'Kilowatt-Hour', unit: 'kWh'},
					{name: 'Electron Volt', unit: 'eV'},
					{name: 'Barrel of Oil Equivalent', unit: 'boe'},
				]
			},
			{
				id: 'Power',
				sub: [
					{name: 'Watt', unit: 'W'},
					{name: 'Horsepower', unit: 'hp'}
				]
			},
			{
				id: 'Pressure',
				sub: [
					{name: 'Pascal', unit: 'Pa'},
					{name: 'Atmosphere', unit: 'atm'},
					{name: 'bar', unit: 'bar'},
					{name: 'Pounds per Square Inch', unit: 'psi'},
					{name: 'torr', unit: 'torr'},
					{name: 'Millimeters of Mercury', unit: 'mmHg'},
					{name: 'Inches of Mercury', unit: 'inHg'},
					{name: 'Inches of Water', unit: 'inH2O'},
				]
			},
			{
				id: 'Temperature',
				sub: [
					//{name: 'Degree Celsius', unit: 'C'},
					//{name: 'Degree Fehrenheit', unit: 'F'},
					{name: 'Kelvin', unit: 'K'},
					{name: 'Rankine', unit: 'Rankine'},
				]
			},
			{
				id: 'Electricity',
				sub: [
					{name: 'Volt', unit: 'V'},
					{name: 'Ampere', unit: 'A'},
					{name: 'Coulomb', unit: 'C'},
					{name: 'Ohm', unit: 'Ohm'},
					{name: 'Farad', unit: 'F'},
					{name: 'Henry', unit: 'H'},
					{name: 'Siemens', unit: 'S'},
					{name: 'Tesla', unit: 'T'},
					{name: 'Weber', unit: 'Wb'},
				]
			},
			{
				id: 'Angle',
				sub: [
					{name: 'Degree', unit: 'deg'},
					{name: 'Radian', unit: 'rad'},
					{name: 'Gradian', unit: 'grad'},
					{name: 'arcminute', unit: 'arcmin'},
					{name: 'arcsecond', unit: 'arcs'},
				]
			},
			{
				id: 'Light',
				sub: [
					{name: 'Flam', unit: 'flam'},
					{name: 'Candela', unit: 'cd'}
				]
			},
			{
				id: 'Radiation',
				sub: [
					{name: 'Gray', unit: 'Gy'},
					{name: 'Seviert', unit: 'Sv'},
					{name: 'Becquerel', unit: 'Bq'},
					{name: 'Curie', unit: 'Curie'}
				]
			},
		];
		var output = '';
		for(var i=0; i < units.length; i++) {
			output += '<li><div class="item ignore" style="width:160px;" title=""><span class="fa fa-caret-right"></span>' + units[i].id + '</div><ul>';
			for(var j=0; j < units[i].sub.length; j++) 
				output += '<li><div class="item unit" title="' + units[i].sub[j].unit + '"><span class="code">' + units[i].sub[j].unit.replace(/\^([0-9]+)/g,"<sup>$1</sup>") + '</span>: ' + units[i].sub[j].name + '</div></li>';
			output += '</ul></li>';
		}	
		var top_option = $('<li/>').html('<div class="item">Insert Unit Picker <kbd style="font-size:14px;">"</kbd></div>');
		top_option.on('mousedown', function(e) {
			func(el, '\\Unit');
			e.stopPropagation();
			e.preventDefault();
		}).on('mouseup', function(e) {
			forceHide(this);
		});
		var out_box = $('<ul/>').html(output);
		out_box.find('.ignore').on('mousedown', function(e) {
			e.stopPropagation();
			e.preventDefault();
		}).on('mouseenter', function(e) {
			var ul = $(this).next('ul');
			window.setTimeout(function() {
				ul.css({top: '0px', left: '100%'});
				var move_up = min(0, $( window ).height() - (ul.offset().top + ul.height()));
				var move_left = min(0, $( window ).width() - (ul.offset().left + ul.width()));
				if(move_up < 0)
					ul.css('top', move_up + 'px');
				if(move_left < 0)
					ul.css('left', move_left + 'px');
			});
		});
		out_box.find('.unit').on('mousedown', function(e) {
			func(el, 'unit', $(this).attr('title'));
			e.stopPropagation();
			e.preventDefault();
		}).on('mouseup', function(e) {
			forceHide(this);
		});
		out_box.addClass('unitPicker').prepend(top_option);
		return out_box;
	}
	var CommandPicker = function(el, func) {
		var commands = {
	    Algebra: [
	      { text: 'Approximate', giac_func: 'approx(' },
	      { text: 'Combine Fractions', giac_func: 'comDenom(' },
	      { text: 'Expand', giac_func: 'expand(' },
	      { text: 'Factor', giac_func: 'factor(' },
	      { text: 'Get Denominator', giac_func: 'denom(' },
	      { text: 'Get Numerator', giac_func: 'numer(' },
	      { text: 'Inverse', giac_func: 'inv(' },
	      { text: 'Partial Fraction Decomposition', giac_func: 'partfrac(' },
	      { text: 'Polynomial Degree', giac_func: 'degree(' },
	      { text: 'Regroup', giac_func: 'regroup(' },
	      { text: 'Simplify', giac_func: 'simplify(' },
	      { text: 'Test for Variable in Expression', giac_func: 'has(' },
	    ],
	    Calculus: [
	      { text: 'Curl', giac_func: 'curl(' },
	      { text: 'Divergence', giac_func: 'divergence(' },
	      { text: 'Gradient', giac_func: 'gradient(' },
	      { text: 'Hessian', giac_func: 'hessian(' },
	      { text: 'Laplacian', giac_func: 'laplacian(' },
	    ],
	    Complex_Numbers: [
	      { text: 'Argument of Complex Number', giac_func: 'arg(' },
	      { text: 'Complex Conjugate', giac_func: 'conj(' },
	      { text: 'Imaginary Part', giac_func: 'im(' },
	      { text: 'Real Part', giac_func: 're(' },
	    ],
	    Exponentials_and_Logs: [
	      { text: 'Antilog base 10', giac_func: 'alog10(' },
	      { text: 'Exponential', giac_func: 'exp(' },
	      { text: 'Log base 10', giac_func: 'log10(' },
	      { text: 'Log base b', giac_func: 'logb(' },
	      { text: 'Natural Log', giac_func: 'ln(' },
	      [ 'Hyperbolic Functions',
	        { text: 'Hyperbolic Sine', giac_func: 'sinh(' },
	        { text: 'Hyperbolic Cosine', giac_func: 'cosh(' },
	        { text: 'Hyperbolic Tangent', giac_func: 'tanh(' },
	        { text: 'Hyperbolic Arcsine', giac_func: 'asinh(' },
	        { text: 'Hyperbolic Arccosine', giac_func: 'acosh(' },
	        { text: 'Hyperbolic Arctangent', giac_func: 'atanh(' },
	      ],
	      [ 'Algabraic Manipulations',
	        { text: 'Convert trig -> exp', giac_func: 'trig2exp(' },
	        { text: 'Convert exp -> trig', giac_func: 'exp2trig(' },
	        { text: 'Convert atrig -> ln', giac_func: 'atrig2ln(' },
	        { text: 'Convert hyp -> exp', giac_func: 'hyp2exp(' },
	        { text: 'Convert exp -> pow', giac_func: 'exp2pow(' },
	        { text: 'Convert pow -> exp', giac_func: 'pow2exp(' }
	      ]
	    ],
	    Integer_Math: [
	      { text: 'Divisors', giac_func: 'divisors(' },
	      { text: 'Greatest Common Divisor', giac_func: 'gcd(' },
	      { text: 'Inverse', giac_func: 'inv(' },
	      { text: 'Lowest Common Multilple', giac_func: 'lcm(' },
	      { text: 'Prime Factors', giac_func: 'factors(' },
	      { text: 'Sign (+/-)', giac_func: 'sign(' },
	      { text: 'Test if Even', giac_func: 'even(' },
	      { text: 'Test if Odd', giac_func: 'odd(' },
	      [ 'Primes',
	        { text: 'Find Prime Number', giac_func: 'ithprime(' },
	        { text: 'Next Prime', giac_func: 'nextprime(' },
	        { text: 'Previous Prime', giac_func: 'prevprime(' },
	        { text: 'Prime Factors', giac_func: 'factors(' },
	        { text: 'Prime Factor Decomposition', giac_func: 'ifactor(' },
	        { text: 'Primes less than n', giac_func: 'nprimes(' },
	        { text: 'Test if Prime', giac_func: 'is_prime(' },
	      ]
	    ],
	    Logic: [
	    	{ text: 'Boolean True', giac_func: 'true(' },
	    	{ text: 'Boolean False', giac_func: 'false(' },
	    	{ text: 'Logical And', giac_func: 'and(' },
	    	{ text: 'Logical Or', giac_func: 'or(' },
	    	{ text: 'Logical Xor', giac_func: 'xor(' },
	    	{ text: 'Logical Inverse', giac_func: 'not(' },
	    ],
	    Matrices_and_Lists: [

        { text: 'Cross Product', giac_func: 'cross(' },
        { text: 'Determinant', giac_func: 'det(' },
        { text: 'Dot Product', giac_func: 'dot(' },
	      { text: 'Empty Matrix', giac_func: 'matrix(' },
	      { text: 'Make Matrix from Expression', giac_func: 'makemat(' },
	      { text: 'Random Matrix', giac_func: 'randMat(' },
	      [ 'Elementwise Math',
	      	{ text: 'Elementwise Addition', giac_func: '+'},
	      	{ text: 'Elementwise Substraction', giac_func: '-'},
	      	{ text: 'Elementwise Multiplication', giac_func: '.*'},
	      	{ text: 'Elementwise Division', giac_func: './'},
	      	{ text: 'Elementwise Power', giac_func: '.^'},
	      ],
	      [ 'Factorizations',
	        { text: 'Cholesky Decomposition', giac_func: 'cholesky(' },
	        { text: 'LU Decomposition', giac_func: 'lu(' },
	        { text: 'QR Decomposition', giac_func: 'qr(' },
	        { text: 'SVD Decomposition', giac_func: 'svd(' },
	      ],
	      [ 'Matrix Norms',
	        { text: 'Adjunct Matrix', giac_func: 'trn(' },
	        { text: 'Frobenius Norm', giac_func: 'frobenius_norm(' },
	        { text: 'Hessenberg Reduction', giac_func: 'hessenberg(' },
	        { text: 'Hilbert Matrix', giac_func: 'hilbert(' },
	        { text: 'Identity Matrix', giac_func: 'identity(' },
	        { text: 'Jordan Matrix', giac_func: 'egvl(' },
	        { text: 'L1 Norm', giac_func: 'l1norm(' },
	        { text: 'L2 Norm', giac_func: 'l2norm(' },
	        { text: 'Linfinity Norm', giac_func: 'linfnorm(' },
	        { text: 'Maximum Column l1<sub>norm</sub>', giac_func: 'colnorm(' },
	        { text: 'Maximum Row l1<sub>norm</sub>', giac_func: 'rownorm(' },
	        { text: 'Smith Normalization', giac_func: 'ismith(' },
	      ],
	      [ 'Structure',
	        { text: 'Append', giac_func: 'append(' },
	        { text: 'Concatenate', giac_func: 'concat(' },
	        { text: 'Delete Columns', giac_func: 'delcols(' },
	        { text: 'Delete Rows', giac_func: 'delrows(' },
	        { text: 'Flatten Matrix to List', giac_func: 'flatten(' },
	        { text: 'List Length', giac_func: 'length(' },
	        { text: 'Matrix Dimension', giac_func: 'dim(' },
	        { text: 'Number of Columns', giac_func: 'coldim(' },
	        { text: 'Number of Rows', giac_func: 'rowdim(' },
	        { text: 'Prepend', giac_func: 'prepend(' },
	        { text: 'Swap Columns', giac_func: 'colswap(' },
	        { text: 'Number of Columns', giac_func: 'ncols(' },
	        { text: 'Number of Rows', giac_func: 'nrows(' },
	        { text: 'Reverse List', giac_func: 'revlist(' },
	        { text: 'Rotate List', giac_func: 'rotate(' },
	        { text: 'Shift List', giac_func: 'shift(' },
	        { text: 'Swap Rows', giac_func: 'rowSwap(' },
	        { text: 'Transpose', giac_func: 'tran(' },
	      ],
	      [ 'Search',
	        { text: 'Count Elements Equal to Value', giac_func: 'count_eq(' },
	        { text: 'Count Elements Greater than Value', giac_func: 'count_sup(' },
	        { text: 'Count Elements Less Than Value', giac_func: 'count_inf(' },
	        { text: 'Find in List', giac_func: 'find(' },
	        { text: 'Get Diagonal', giac_func: 'diag(' },
	      ],
	      [ 'Statistics',
	        { text: 'Correlation', giac_func: 'correlation(' },
	        { text: 'Covariance', giac_func: 'covariance(' },
	        { text: 'Frequencies', giac_func: 'frequencies(' },
	        { text: 'Histogram', giac_func: 'histogram(' },
	        { text: 'List Variance', giac_func: 'variance(' },
	        { text: 'Maximum', giac_func: 'max(' },
	        { text: 'Mean / Average', giac_func: 'mean(' },
	        { text: 'Median', giac_func: 'median(' },
	        { text: 'Minimum', giac_func: 'min(' },
	        { text: 'Quantile', giac_func: 'quantile(' },
	        { text: '1st Quartile', giac_func: 'quartile1(' },
	        { text: '3rd Quartile', giac_func: 'quartile3(' },
	        { text: 'Standard Deviation', giac_func: 'stddev(' },
	      ],
	      [ 'Linear Algebra',
	        { text: 'Adjacent Element Difference', giac_func: 'deltalist(' },
	        { text: 'Condition Number', giac_func: 'cond(' },
	        { text: 'Cross Product', giac_func: 'cross(' },
	        { text: 'Determinant', giac_func: 'det(' },
	        { text: 'Dot Product', giac_func: 'dot(' },
	        { text: 'Eigenvalues', giac_func: 'eigenvals(' },
	        { text: 'Eigenvectors', giac_func: 'egv(' },
	        { text: 'Inverse', giac_func: 'inv(' },
	        { text: 'Matrix Rank', giac_func: 'rank(' },
	      ],
	      [ 'Polynomial List',
	        { text: 'Evaluate List as Polynomial', giac_func: 'polyEval(' },
	        { text: 'List to Polynomial', giac_func: 'poly2symb(' },
	        { text: 'Roots of Polynomial List', giac_func: 'proot(' },
	      ]
	    ],
	    Probability: [
	      { text: 'Frequencies / Histogram', giac_func: 'frequencies(' },
	      { text: 'Combinations', giac_func: 'nCr(' },
	      { text: 'Permutations', giac_func: 'nPr(' },
	      { text: 'Student T-Test', giac_func: 'studentt(' },
	      [ 'Probability Distributions',
	        { text: 'Beta Probability', giac_func: 'betad(' },
	        { text: 'Binomial Probability', giac_func: 'binomial(' },
	        { text: 'Cauchy Probability', giac_func: 'cauchy(' },
	        { text: 'Chi<sup>2</sup> Probability', giac_func: 'chisquare(' },
	        { text: 'Exponential Probability', giac_func: 'exponential(' },
	        { text: 'Fisher-Snedecor Probability', giac_func: 'fisher(' },
	        { text: 'Gamma Probability', giac_func: 'gammad(' },
	        { text: 'Geometric Probability', giac_func: 'geometric(' },
	        { text: 'Negative Binomial Probability', giac_func: 'negbinomial(' },
	        { text: 'Normal Probability', giac_func: 'normald(' },
	        { text: 'Poisson Probability', giac_func: 'poisson(' },
	        { text: 'Student Probability', giac_func: 'student(' },
	        { text: 'Uniform Probability', giac_func: 'uniform(' },
	        { text: 'Weibull Probability', giac_func: 'weilbull(' },
	      ],
	      [ 'Cumulative Distributions',
	        { text: 'Beta Cumulative Distribution Function', giac_func: 'betad_cdf(' },
	        { text: 'Binomial Cumulative Distribution Function', giac_func: 'binomial_cdf(' },
	        { text: 'Cauchy Cumulative Distribution Function', giac_func: 'cauchy_cdf(' },
	        { text: 'Chi<sup>2</sup> Cumulative Distribution Function', giac_func: 'chisquare_cdf(' },
	        { text: 'Exponential Cumulative Distribution Function', giac_func: 'exponential_cdf(' },
	        { text: 'Fisher-Snedecor Cumulative Distribution Function', giac_func: 'fisher_cdf(' },
	        { text: 'Gamma Cumulative Distribution Function', giac_func: 'gammad_cdf(' },
	        { text: 'Geometric Cumulative Distribution Function', giac_func: 'geometric_cdf(' },
	        { text: 'Negative Binomial Cumulative Distribution Function', giac_func: 'negbinomial_cdf(' },
	        { text: 'Normal Cumulative Distribution Function', giac_func: 'normald_cdf(' },
	        { text: 'Poisson Cumulative Distribution Function', giac_func: 'poisson_cdf(' },
	        { text: 'Student Cumulative Distribution Function', giac_func: 'student_cdf(' },
	        { text: 'Uniform Cumulative Distribution Function', giac_func: 'uniform_cdf(' },
	        { text: 'Weibull Cumulative Distribution Function', giac_func: 'weilbull_cdf(' },
	      ],
	      [ 'Inverse Distributions',
	        { text: 'Beta Inverse Cumulative Distribution Function', giac_func: 'betad_icdf(' },
	        { text: 'Binomial Inverse Cumulative Distribution Function', giac_func: 'binomial_icdf(' },
	        { text: 'Cauchy Inverse Cumulative Distribution Function', giac_func: 'cauchy_icdf(' },
	        { text: 'Chi<sup>2</sup> Inverse Cumulative Distribution Function', giac_func: 'chisquare_icdf(' },
	        { text: 'Exponential Inverse Cumulative Distribution Function', giac_func: 'exponential_icdf(' },
	        { text: 'Fisher-Snedecor Inverse Cumulative Distribution Function', giac_func: 'fisher_icdf(' },
	        { text: 'Gamma Inverse Cumulative Distribution Function', giac_func: 'gammad_icdf(' },
	        { text: 'Geometric Inverse Cumulative Distribution Function', giac_func: 'geometric_icdf(' },
	        { text: 'Negative Binomial Inverse Cumulative Distribution Function', giac_func: 'negbinomial_icdf(' },
	        { text: 'Normal Inverse Cumulative Distribution Function', giac_func: 'normald_icdf(' },
	        { text: 'Poisson Inverse Cumulative Distribution Function', giac_func: 'poisson_icdf(' },
	        { text: 'Student Inverse Cumulative Distribution Function', giac_func: 'student_icdf(' },
	        { text: 'Uniform Inverse Cumulative Distribution Function', giac_func: 'uniform_icdf(' },
	        { text: 'Weibull Inverse Cumulative Distribution Function', giac_func: 'weilbull_icdf(' },
	      ]
	    ],
	    Random_Numbers: [
	      { text: 'Random Number', giac_func: 'rand(' },
	      { text: 'Random Matrix', giac_func: 'randMat(' },
	      { text: 'Random Polynomial', giac_func: 'randpoly(' },
	      [ 'Other Distributions', 
	        { text: 'Random Number (Uniform Distribution)', giac_func: 'rand(' },
	        { text: 'Random Number (Binomial Distribution)', giac_func: 'randbinomial(' },
	        { text: 'Random Number (Chi<sup>2</sup> Distribution)', giac_func: 'randchisquare(' },
	        { text: 'Random Number (Exponential Distribution)', giac_func: 'randexp(' },
	        { text: 'Random Number (Fisher-Snedecor Distribution)', giac_func: 'randfisher(' },
	        { text: 'Random Number (Geometric Distribution)', giac_func: 'randgeometric(' },
	        { text: 'Random Number (Normal Distribution)', giac_func: 'randnorm(' },
	        { text: 'Random Number (Poisson Distribution)', giac_func: 'randpoisson(' },
	        { text: 'Random Number (Student Distribution)', giac_func: 'randstudent(' },
	      ]
	    ],  
	    Real_Numbers: [
	      { text: 'Bernoulli Number', giac_func: 'bernoulli(' },
	      { text: 'Beta Function', giac_func: 'Beta(' },
	      { text: 'Ceiling', giac_func: 'ceil(' },
	      { text: 'Complimentary Error Function', giac_func: 'erfc(' },
	      { text: 'Error Function', giac_func: 'erf(' },
	      { text: 'Euler\'s Function', giac_func: 'euler(' },
	      { text: 'Floor', giac_func: 'floor(' },
	      { text: 'Fractional Part', giac_func: 'fPart(' },
	      { text: 'Gamma Function', giac_func: 'Gamma(' },
	      { text: 'Integer Part', giac_func: 'iPart(' },
	      { text: 'Round', giac_func: 'round(' },
	      { text: 'Sign (+/-)', giac_func: 'sign(' },
	      { text: '1st Tchebyshev Polynomial', giac_func: 'tchebyshev1(' },
	      { text: '2nd Tchebyshev Polynomial', giac_func: 'tchebyshev2(' },
	    ],
	    Trigonometry: [
	      { text: 'Sine', giac_func: 'sin(' },
	      { text: 'Cosine', giac_func: 'cos(' },
	      { text: 'Tangent', giac_func: 'tan(' },
	      { text: 'Arcsine', giac_func: 'asin(' },
	      { text: 'Arccosine', giac_func: 'acos(' },
	      { text: 'Arctangent', giac_func: 'atan(' },
	      { text: 'Secant', giac_func: 'sec(' },
	      { text: 'Cosecant', giac_func: 'csc(' },
	      { text: 'Cotangent', giac_func: 'cot(' },
	      { text: 'Arcsecant', giac_func: 'asec(' },
	      { text: 'Arccosecant', giac_func: 'acsc(' },
	      { text: 'Arccotangent', giac_func: 'acot(' },
	      [ 'Hyperbolic Functions',
	        { text: 'Hyperbolic Sine', giac_func: 'sinh(' },
	        { text: 'Hyperbolic Cosine', giac_func: 'cosh(' },
	        { text: 'Hyperbolic Tangent', giac_func: 'tanh(' },
	        { text: 'Hyperbolic Arcsine', giac_func: 'asinh(' },
	        { text: 'Hyperbolic Arccosine', giac_func: 'acosh(' },
	        { text: 'Hyperbolic Arctangent', giac_func: 'atanh(' },
	      ],
	      [ 'Simplifications',
	        { text: 'Simplify, preference for sin', giac_func: 'trigsin(' },
	        { text: 'Simplify, preference for cos', giac_func: 'trigcos(' },
	        { text: 'Simplify, preference for tan', giac_func: 'trigtan(' },
	        { text: 'Collect sin & cos of same angle', giac_func: 'tcollect(' },
	        { text: 'Expand a trigonemetric expression', giac_func: 'texpand(' }
	      ],
	      [ 'Algabraic Manipulations',
	        { text: 'Convert cos -> sin/tan', giac_func: 'cos2sintan(' },
	        { text: 'Convert sin -> cos/tan', giac_func: 'sin2costan(' },
	        { text: 'Convert tan -> sin/cos', giac_func: 'tan2sincos(' },
	        { text: 'Convert tan -> sin/cos<sup>2</sup>', giac_func: 'tan2sincos2(' },
	        { text: 'Convert tan -> cos/sin<sup>2</sup>', giac_func: 'tan2cossin2(' },
	        { text: 'Convert trig -> exp', giac_func: 'trig2exp(' },
	        { text: 'Convert acos -> asin', giac_func: 'acos2asin(' },
	        { text: 'Convert acos -> atan', giac_func: 'acos2atan(' },
	        { text: 'Convert asin -> acos', giac_func: 'asin2acos(' },
	        { text: 'Convert asin -> atan', giac_func: 'asin2atan(' },
	        { text: 'Convert atan -> acos', giac_func: 'atan2acos(' },
	        { text: 'Convert atan -> asin', giac_func: 'atan2asin(' },
	        { text: 'Convert atrig -> ln', giac_func: 'atrig2ln(' },
	        { text: 'Convert trig(x) -> tan(x/2)', giac_func: 'halftan(' },
	        { text: 'Convert hyp -> exp', giac_func: 'hyp2exp(' }
	      ]
	    ],
	  };
		var output = '';
		$.each(commands, function(k, v) {
			output += '<li><div class="item ignore" title=""><span class="fa fa-caret-right"></span>' + k.replace(/_/g,' ') + '</div><ul>';
			for(var i = 0; i < v.length; i++) {
				if(v[i].giac_func) 
					output += '<li><div class="item command" title="' + v[i].giac_func + '"><span class="code">' + v[i].giac_func.replace(/\_([a-zA-Z0-9]+)/g,"<sub>$1</sub>").replace('(','') + ':</span> ' + v[i].text + '</div></li>';
				else {
					output += '<li><div class="item ignore" title=""><span class="fa fa-caret-right"></span>' + v[i][0] + '</div><ul>';
					for(var j = 1; j < v[i].length; j++)
						output += '<li><div class="item command" title="' + v[i][j].giac_func + '"><span class="code">' + v[i][j].giac_func.replace(/\_([a-zA-Z0-9]+)/g,"<sub>$1</sub>").replace('(','') + ':</span> ' + v[i][j].text + '</div></li>';
					output += '</ul></li>';
				}
			}
			output += '</ul></li>';
		});
		var out_box = $('<ul/>').html(output);
		out_box.find('.ignore').on('mousedown', function(e) {
			e.stopPropagation();
			e.preventDefault();
		}).on('mouseenter', function(e) {
			var ul = $(this).next('ul');
			window.setTimeout(function() {
				ul.css({top: '0px', left: '100%'});
				var move_up = min(0, $( window ).height() - (ul.offset().top + ul.height()));
				var move_left = min(0, $( window ).width() - (ul.offset().left + ul.width()));
				if(move_up < 0)
					ul.css('top', move_up + 'px');
				if(move_left < 0)
					ul.css('left', move_left + 'px');
			});
		});
		out_box.find('.command').on('mousedown', function(e) {
			func(el, 'command', $(this).attr('title'));
			e.stopPropagation();
			e.preventDefault();
		}).on('mouseup', function(e) {
			forceHide(this);
		});
		out_box.addClass('commandPicker');
		return out_box;
	}

});
