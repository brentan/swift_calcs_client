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
			sub: [
				{ html: '<h1>Large Heading</h1>', method: function(el) { el.command('H1'); } },
				{ html: '<h2>Medium Heading</h2>', method: function(el) { el.command('H2'); } },
				{ html: '<h3>Small Heading</h3>', method: function(el) { el.command('H3'); } },
				{ html: '<b>Blockquote</b>', method: function(el) { el.command('BLOCKQUOTE'); } },
				{ html: 'Normal', method: function(el) { el.command('normalFormat'); } }
			]
		},
		{
			id: 'font-family',
			icon: 'font',
			sub: [
				{ html: '<span style="font-family: sans-serif;">Arial</span>', method: function(el) { el.command('fontName', 'sans-serif'); } },
				{ html: '<span style="font-family: \'Comic Sans MS\';">Comic Sans</span>', method: function(el) { el.command('fontName', 'Comic Sans MS'); } },
				{ html: '<span style="font-family: monospace;">Courier</span>', method: function(el) { el.command('fontName', 'monospace'); } },
				{ html: '<span style="font-family: Impact;">Impact</span>', method: function(el) { el.command('fontName', 'Impact'); } },
				{ html: '<span style="font-family: Tahoma;">Tahoma</span>', method: function(el) { el.command('fontName', 'Tahoma'); } },
				{ html: '<span style="font-family: serif;">Times New Roman</span>', method: function(el) { el.command('fontName', 'serif'); } }
			]
		},
		{
			id: 'text-height',
			icon: 'text-height',
			sub: [
				{ html: '<span style="font-size:48px;">Font Size 7</span>', method: function(el) { el.command('fontSize', 7); } },
				{ html: '<span style="font-size:36px;">Font Size 6</span>', method: function(el) { el.command('fontSize', 6); } },
				{ html: '<span style="font-size:20px;">Font Size 5</span>', method: function(el) { el.command('fontSize', 5); } },
				{ html: '<span style="font-size:16px;">Font Size 4</span>', method: function(el) { el.command('fontSize', 4); } },
				{ html: '<span style="font-size:12px;">Font Size 3</span>', method: function(el) { el.command('fontSize', 3); } },
				{ html: '<span style="font-size:10px;">Font Size 2</span>', method: function(el) { el.command('fontSize', 2); } },
				{ html: '<span style="font-size:8px;">Font Size 1</span>', method: function(el) { el.command('fontSize', 1); } }
			]
		},
		{ id: '|' },
		{ 
			id: 'foreColor',
			html: '<span class="fa-stack" style="line-height: inherit;"><span style="color: #cccccc;position:relative;top:-2px;font-size:1.55em;" class="fa fa-font fa-stack-2x"></span><span class="fa fa-paint-brush fa-stack-1x"></span></span>',
			colorPicker: function(el, color) { el.command('foreColor', color); }
		},
		{ 
			id: 'backColor',
			html: '<span class="fa-stack" style="line-height: inherit;"><span class="fa fa-square fa-stack-2x" style="color: #cccccc;position:relative;top:-2px;font-size:1.55em;" ></span><span style="color: #ecf0f1;font-size:1.55em;" class="fa fa-font fa-inverse fa-stack-2x"></span><span class="fa fa-paint-brush fa-stack-1x"></span></span>',
			colorPicker: function(el, color) { el.command('backColor', color); }
		},
		{ id: '|' },
		{
			id: 'bold',
			icon: 'bold',
			method: function(el) { el.command('bold'); } 
		},
		{
			id: 'italic',
			icon: 'italic',
			method: function(el) { el.command('italic'); } 
		},
		{
			id: 'underline',
			icon: 'underline',
			method: function(el) { el.command('underline'); } 
		},
		{
			id: 'strikethrough',
			icon: 'strikethrough',
			method: function(el) { el.command('strikeThrough'); } 
		},
		{ id: '|' },
		{
			id: 'link',
			icon: 'link',
			method: function(el) { el.command('createLink'); } //BRENTAN: This needs a modal to ask the user for URL and TITLE
		},
		{
			id: 'unlink',
			icon: 'unlink',
			method: function(el) { el.command('unlink'); } 
		},
		{
			id: 'subscript',
			icon: 'subscript',
			method: function(el) { el.command('subscript'); } 
		},
		{
			id: 'superscript',
			icon: 'superscript',
			method: function(el) { el.command('superscript'); } 
		},
		{ id: '|' },
		{
			id: 'justifyLeft',
			icon: 'align-left',
			method: function(el) { el.command('justifyLeft'); } 
		},
		{
			id: 'justifyCenter',
			icon: 'align-center',
			method: function(el) { el.command('justifyCenter'); } 
		},
		{
			id: 'justifyRight',
			icon: 'align-right',
			method: function(el) { el.command('justifyRight'); } 
		},
		{
			id: 'justifyFull',
			icon: 'align-justify',
			method: function(el) { el.command('justifyFull'); } 
		},
		{ id: '|' },
		{
			id: 'unorderedList',
			icon: 'list-ul',
			method: function(el) { el.command('insertUnorderedList'); } 
		},
		{
			id: 'orderedList',
			icon: 'list-ol',
			method: function(el) { el.command('insertOrderedList'); } 
		},
		{
			id: 'indent',
			icon: 'indent',
			method: function(el) { el.command('indent'); } 
		},
		{
			id: 'outdent',
			icon: 'outdent',
			method: function(el) { el.command('outdent'); } 
		},
		{ id: '|' },
		{
			id: 'eraser',
			icon: 'eraser',
			method: function(el) { el.command('removeFormat'); } 
		},
		{ id: '|' },
		{
			id: 'math',
			html: 'f(x)=&frac14;<sup>x</sup>',
			method: function(el) { el.command('mathMode'); }
		},
		{
			id: 'textMode',
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
		{ id: '|' },
		{
			id: 'text',
			html: 'f(x)=&frac14;<sup>x</sup>',
			method: function(el) { el.command('mathMode'); }
		},
		{
			id: 'textMode',
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

});