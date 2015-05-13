/********************************************************
 * Helper function to build a toolbar for an element
 * Two built in type for text and a mathquill box are
 * provided, and these can be augmented with more options.
 * Look to these defaults for info on structure to pass
 * to the 'attachToolbar' method
 *******************************************************/

Workspace.open(function(_) {
	_.attachToolbar = function(el, options) {
		this.detachToolbar();
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
		$('#toolbar').remove();
	}
	_.blurToolbar = function() {
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
			id: 'brackets',
			html: '<div style="position: relative; top: -3px;">(<span style="color: #888888;font-size:10px;"><span class="fa fa-square-o"></span></span>)</div>',
			title: 'Parenthesis',
			method: function(el) { el.command('('); },
			sub: [
				{html: '(<span style="color: #888888;font-size:10px;"><span class="fa fa-square-o"></span></span>)', method: function(el) { el.command('('); }, title: 'Parenthesis' },
				{html: '[<span style="color: #888888;font-size:10px;"><span class="fa fa-square-o"></span></span>]', method: function(el) { el.command('['); }, title: 'Square Bracket' },
				{html: '{<span style="color: #888888;font-size:10px;"><span class="fa fa-square-o"></span></span>}', method: function(el) { el.command('{'); }, title: 'Curly Bracket' }
			]
		},
		{
			id: 'equality',
			html: '<div style="position: relative; top: -6px;font-size:18px;padding: 0px 6px;">=</div>',
			title: 'Equality',
			sub: [
				{html: '&nbsp;&nbsp;=&nbsp;&nbsp;', method: function(el) { el.command('='); }, title: 'Equality/Assignment' },
				{html: '&nbsp;&nbsp;==&nbsp;&nbsp;', method: function(el) { el.command('\\eq'); }, title: 'Logical Equal' },
				{html: '&nbsp;&nbsp;&#8800;&nbsp;&nbsp;', method: function(el) { el.command('\\ne'); }, title: 'Not Equal' },
				{html: '&nbsp;&nbsp;&gt;&nbsp;&nbsp;', method: function(el) { el.command('>'); }, title: 'Greater Than' },
				{html: '&nbsp;&nbsp;&#8805;&nbsp;&nbsp;', method: function(el) { el.command('\\ge'); }, title: 'Greater Than or Equal To' },
				{html: '&nbsp;&nbsp;&lt;&nbsp;&nbsp;', method: function(el) { el.command('<'); }, title: 'Less Than' },
				{html: '&nbsp;&nbsp;&#8804;&nbsp;&nbsp;', method: function(el) { el.command('\\le'); }, title: 'Less Than or Equal To' },
			]
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
		{ id: '|' },
		{
			id: 'symbols',
			html: '<div style="position: relative;top:-2px;padding:0px 3px;">&#8734;</div>',
			title: 'Symbols',
			method: function(el) { el.command('\\infinity'); },
			sub: [
				{html: '&nbsp;&nbsp;&#8734;&nbsp;&nbsp;', title: 'Infinity', method: function(el) { el.command('\\infinity'); } },
				{html: '&nbsp;&nbsp;<i>i</i>&nbsp;&nbsp;', title: '-1^(1/2)', method: function(el) { el.command('i'); } },
				{html: '&nbsp;&nbsp;<i>e</i>&nbsp;&nbsp;', title: '2.71828...', method: function(el) { el.command('e'); } },
				{html: '&nbsp;&nbsp;<i>&pi;</i>&nbsp;&nbsp;', title: '3.14159...', method: function(el) { el.command('\\pi'); } },
			]
		},
		{
			id: 'greek',
			title: 'Greek Letters',
			html: '<div style="position: relative;top:-2px;padding:0px 3px;">&alpha;</div>',
			symbols: {
				func: function(el, symbol) { el.command(symbol); },
				symbols: [
					{ html: 'a', cmd: '\\alpha' },
					{ html: 'b', cmd: '\\alpha' },
					{ html: 'c', cmd: '\\alpha' },
					{ html: 'a', cmd: '\\alpha' },
					{ html: 'a', cmd: '\\alpha' },
					{ html: '1', cmd: '\\alpha' },
					{ html: '4', cmd: '\\alpha' },
					{ html: 'a', cmd: '\\alpha' },
					{ html: 'f', cmd: '\\alpha' },
					{ html: 'h', cmd: '\\alpha' },
					{ html: 'g', cmd: '\\alpha' },
					{ html: 'e', cmd: '\\alpha' },
					{ html: 'd', cmd: '\\alpha' },
				]
			}
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

});