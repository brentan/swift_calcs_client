/********************************************************
 * Helper function to build a toolbar for an element
 * Two built in type for text and a mathquill box are
 * provided, and these can be augmented with more options.
 * Look to these defaults for info on structure to pass
 * to the 'attachToolbar' method
 *******************************************************/

Workspace.open(function(_) {
	var current_toolbar_target = 0;
	_.attachToolbar = function(el, options) {
		if(current_toolbar_target === el) return;
		this.detachToolbar();
		current_toolbar_target = el;
		// Helper function to build the toolbar.  Parses the options
		var buildMenu = function(element, toolbar) {
			var $ul = $('<ul/>');
			for(var i = 0; i < toolbar.length; i++) {
				var cur_item = toolbar[i];
				if(cur_item.skip) continue;
				if(cur_item.id === '|') {
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
				if(cur_item.pulldown)
					$div.addClass('pulldown');
				$li.appendTo($ul);
			}
			return $ul;
		}
		//build up the toolbar
		var $ul = buildMenu(el, options);
		$ul.attr('id', 'toolbar').addClass('base');
		$('#toolbar_holder').append($ul);
	}
	_.detachToolbar = function() {
		current_toolbar_target = false;
		$('#toolbar').remove();
	}
	_.blurToolbar = function(el) {
		if(el && (el !== current_toolbar_target)) return;
		$('#toolbar').addClass('blurred');
	}
	_.unblurToolbar = function() {
		$('#toolbar').removeClass('blurred');
	}

	// Return the default textToolbar with extra options.  To_add is appended to the menu, and to_remove will remove any items with matching id
	_.textToolbar = function(to_add, to_remove) {
		var toolbar = [
		{
			id: 'format',
			icon: 'paragraph',
			title: 'Paragraph',
			sub: [
				{ html: '<h1>Large Heading</h1>', method: function(el) { el.command('H1'); } },
				{ html: '<h2>Medium Heading</h2>', method: function(el) { el.command('H2'); } },
				{ html: '<h3>Small Heading</h3>', method: function(el) { el.command('H3'); } },
				{ html: '<b>Blockquote</b>', method: function(el) { el.command('BLOCKQUOTE'); } },
				{ html: 'Normal', method: function(el) { el.command('normalFormat'); } }
			]
		},
		{ id: '|' },
		{
			id: 'font-family',
			icon: 'font',
			title: 'Font',
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
		{ id: '|' },
		{
			id: 'text-height',
			icon: 'text-height',
			title: 'Size',
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
		{ id: '|' },
		{ 
			id: 'foreColor',
			title: 'Font Color',
			html: '<span class="fa-stack" style="line-height: inherit;"><span style="font-size:1.25em;border-bottom:4px solid black;" class="fa fa-font fa-stack-2x foreColor"></span></span>',
			colorPicker: function(el, color) { el.command('foreColor', color); }
		},
		{ 
			id: 'backColor',
			title: 'Background Color',
			html: '<span class="fa-stack" style="line-height: inherit;"><span class="fa fa-square fa-stack-2x" style="position:relative;top:-2px;font-size:1.35em;" ></span><span style="color: #ecf0f1;font-size:1.35em;border-bottom:4px solid white;" class="fa fa-font fa-inverse fa-stack-2x backColor"></span></span>',
			colorPicker: function(el, color) { el.command('backColor', color); }
		},
		{ id: '|' },
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
			method: function(el) { el.command('strikeThrough'); } 
		},
		{ id: '|' },
		{
			id: 'link',
			icon: 'link',
			title: 'Create link',
			method: function(el) { el.command('createLink'); } //BRENTAN: This needs a modal to ask the user for URL and TITLE
		},
		{
			id: 'unlink',
			icon: 'unlink',
			title: 'Remove link',
			method: function(el) { el.command('unlink'); } 
		},
		{
			id: 'subscript',
			icon: 'subscript',
			title: 'Subscript',
			method: function(el) { el.command('subscript'); } 
		},
		{
			id: 'superscript',
			icon: 'superscript',
			title: 'Superscript',
			method: function(el) { el.command('superscript'); } 
		},
		{ id: '|' },
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
		{ id: '|' },
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
		{ id: '|' },
		{
			id: 'eraser',
			icon: 'eraser',
			title: 'Remove all formatting',
			method: function(el) { el.command('removeFormat'); } 
		},
		{ id: '|' },
		{
			id: 'math',
			html: 'f(x)=&frac14;<sup>x</sup>',
			title: 'Change to Math Mode',
			method: function(el) { el.command('mathMode'); }
		},
		{
			id: 'mode',
			html: '<span style="color: #888888;">Text Mode</span>',
			klass: 'static',
			right: true
		}
		];
		if(to_add) {
			for(var i=0; i < to_add.length; i++)
				toolbar.push(to_add[i]);
		}
		if(to_remove) {
			for(var i=0; i > toolbar.length; i++) {
				if(to_remove[cur_item.id])
					cur_item.skip = true;
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
		{ id: '|' },
		{
			id: 'symbols',
			html: '<div style="position: relative;top:-2px;padding:0px 3px;font-family: serif;">&#8734;</div>',
			title: 'Symbols',
			method: function(el) { el.command('\\infinity'); },
			sub: [
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
		{ id: '|' },
		{
			id: 'Units',
			html: '<div style="position: relative;top:-2px;padding:0px 5px;"><div style="padding-bottom:0px;border-bottom: 1px solid #444444;line-height:9px;font-size:9px;">m</div><div style="padding-top: 1px;line-height:9px;font-size:9px;">s</div></div>',
			title: 'Insert Unit',
			method: function(el) { el.command('\\Unit'); },
			units: function(el, cmd, unit) { el.command(cmd, unit); }
		},
		{ id: '|' },
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
				{html: '<div style="padding-bottom:0px;border-bottom: 1px solid #444444;line-height:13px;font-size:13px;display:inline-block;">d<sup>2</sup><span class="fa fa-square-o"></span></div><div style="padding-top: 1px;line-height:9px;font-size:13px;">dx<sup>2</sup></div>', method: function(el) { el.command('\\derivatived'); }, title: 'Second Derivative' },
				{html: '<div style="padding-bottom:0px;border-bottom: 1px solid #444444;line-height:13px;font-size:13px;display:inline-block;">&#8706;<span class="fa fa-square-o"></span></div><div style="padding-top: 1px;line-height:9px;font-size:13px;">&#8706;x</div>', method: function(el) { el.command('\\pderivative'); }, title: 'Partial Derivative' },
				{html: '<div style="padding-bottom:0px;border-bottom: 1px solid #444444;line-height:13px;font-size:13px;display:inline-block;">&#8706;<sup>2</sup><span class="fa fa-square-o"></span></div><div style="padding-top: 1px;line-height:9px;font-size:13px;">&#8706;x<sup>2</sup></div>', method: function(el) { el.command('\\pderivatived'); }, title: 'Partial Second Derivative' },
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
		{ id: '|' },
		{
			id: 'matrix',
			html: '<span style="position: relative; top: -7px;padding-right:4px;"><span style="font-size:18px;">[</span><span style="font-size: 13px;color: #888888;"><span class="fa fa-th"></span></span><span style="font-size: 18px;">]</span></span>',
			title: 'Matices',
			method: function(el) { el.command('\\bmatrix'); },
			sub: [
				{html: 'Insert Matrix', title: 'Insert Matrix', method: function(el) { el.command('\\bmatrix'); } },
				{html: 'Add Column Before (,)', title: 'Add Column Before', method: function(el) { el.command('matrix_add_column_before'); } },
				{html: 'Add Column After (,)', title: 'Add Column After', method: function(el) { el.command('matrix_add_column_after'); } },
				{html: 'Add Row Before (;)', title: 'Add Row Before', method: function(el) { el.command('matrix_add_row_before'); } },
				{html: 'Add Row After (;)', title: 'Add Row After', method: function(el) { el.command('matrix_add_row_after'); } },
				{html: 'Remove Column', title: 'Remove Column', method: function(el) { el.command('matrix_remove_column'); } },
				{html: 'Remove Row', title: 'Remove Row', method: function(el) { el.command('matrix_remove_row'); } },
			]
		},
		{
			id: 'matrixMath',
			html: '<div style="position: relative;top:-2px;padding:0px 3px;font-family: serif;">&#8857;</div>',
			title: 'Matrix/Vector Operations',
			sub: [
				{html: 'Elementwise Multiplication (.*)', title: 'Elementwise Multiplication', method: function(el) { el.command('.'); el.command('*'); } },
				{html: 'Elementwise Division (./)', title: 'Elementwise Division', method: function(el) { el.command('.'); el.command('/'); } },
				{html: 'Elementwise Power (.^)', title: 'Elementwise Power', method: function(el) { el.command('.'); el.command('^'); } },
				{html: 'Dot Product', title: 'Dot Product', method: function(el) { el.command('d'); el.command('o'); el.command('t'); el.command('('); } },
				{html: 'Cross Product', title: 'Cross Product', method: function(el) { el.command('c'); el.command('r'); el.command('o'); el.command('s'); el.command('s'); el.command('('); } },
				{html: 'Determinate', title: 'Determinate', method: function(el) { el.command('d'); el.command('e'); el.command('t'); el.command('('); } },
				{html: 'Transpose', title: 'Transpose', method: function(el) { el.command('t'); el.command('r'); el.command('a'); el.command('n'); el.command('('); } }
			]
		},
		{ id: '|' },
		{
			id: 'text',
			icon: 'font',
			title: 'Change to Text Mode',
			method: function(el) { el.command('textMode'); }
		},
		{
			id: 'mode',
			html: '<span style="color: #888888;">Math Mode</span>',
			klass: 'static',
			right: true
		}
		];
		if(to_add) {
			for(var i=0; i < to_add.length; i++)
				toolbar.push(to_add[i]);
		}
		if(to_remove) {
			for(var i=0; i > toolbar.length; i++) {
				if(to_remove[cur_item.id])
					cur_item.skip = true;
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
					{name: 'Degree Celsius', unit: 'C'},
					{name: 'Degree Fehrenheit', unit: 'F'},
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
			output += '<li><div class="item ignore" style="width:160px;" title="">' + units[i].id + '<span style="display:inline-block; float:right;"><span class="fa fa-caret-right"></span></span></div><ul>';
			for(var j=0; j < units[i].sub.length; j++) 
				output += '<li><div class="item unit" title="' + units[i].sub[j].unit + '">' + units[i].sub[j].name + '</div></li>';
			output += '</ul></li>';
		}	
		var top_option = $('<li/>').html('<div class="item">Insert Unit Picker (\')</div>');
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

});
