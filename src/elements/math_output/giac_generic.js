/* 
A simle extension of math output that we then wrap in a constructor
so that we can spin up lots of basic element types using a standard
structure:

{
	name: 'name' // name of element (used for code block and keyboard shortcut)',
	helpText: 'help text for tooltip bubble',
	function_of: 'n', //List of variables that should be added to StoreAsVariable function.  Include when function returns an algebaric expression of variable 'n'
	content: [ // An array where each item is a new row.  Items between <<>> will be tranformed into
						 // the focusableItem with the same name.  Options can be sent with a hash_string list after the focusable item name
		"text:<<MathQuill>>",
		"text2:<<SelectBox {options: { item: 'value', item2: 'value2' }}>>"
	],
	pre_command: "assume(n, DOM_INT)", // Pre-command to run before the real command, if any.  Omit if none
	command: "giac($1, $2)" // command to send to giac, with $1 the output from the first focusable item, $2 the second, etc
}
*/

var giac_elements_to_add = [];
var createGiacElement = function(options) {
	// Generate the required class variables based on the input stuct
	var focusable_list = [];
	if(typeof options.code === 'undefined') options.code = options.name;
	if(typeof options.nomarkup === 'undefined') options.nomarkup = false;
	var id = 0;
	var html = '';
	for(var i = 0; i < options.content.length; i++) {
		focusable_list.push([]);
		to_add = options.content[i].split('<<');
		html += '<div class="' + css_prefix + 'focusableItems" data-id="' + i + '">';
		html += to_add[0];
		for(var j = 1; j < to_add.length; j++) {
			var command = to_add[j].replace(/^([^>]*)>>(.*)$/,"$1");
			var options_in = command.replace(/^([a-zA-Z0-9]+)[\s]*(.*)$/,"$2");
			if(options_in == '') options_in = {};
			else options_in = $.parseJSON(options_in.replace(/([a-zA-Z0-9_\-]*)[\s]*:/g,'"$1":').replace(/'/g,'"'));
			command = command.replace(/^([a-zA-Z0-9]+)[\s]*(.*)$/,"$1");
			var klass = 'item' + id;
			id++;
			focusable_list[i].push([command, options_in, klass]);
			html += focusableHTML(command,  klass);
			html += to_add[j].replace(/^([^>]*)>>(.*)$/,"$2");
		}
		if(i == 0) html += helpBlock();
		html += "</div>";
	}
	options.two_line = (options.code.length > 12);
	giac_elements_to_add.push({key: options.name, el: P(SettableMathOutput, function(_, super_) {
		_.klass = [options.name];
		_.helpText = options.helpText;
		_.nomarkup = options.nomarkup;
		_.function_of = options.function_of ? options.function_of : false;
		_.pre_command = options.pre_command ? options.pre_command : false;
		var block_html = html;
		var to_populate = focusable_list;
		_.options = options;
		_.innerHtml = function() {
			return this.wrapHTML(this.options.code,block_html,this.options.two_line);
		}
		_.postInsertHandler = function() {
			this.focusableItems = [];
			this.items = [];
			for(var i = 0; i < to_populate.length; i++) {
				this.focusableItems.push([]);
				for(var j = 0; j < to_populate[i].length; j++) {
					if(to_populate[i][j][0] === 'MathQuill') {
						var opts = $.extend(true, {}, to_populate[i][j][1]);
						opts.handlers = {
							enter: this.enterPressed(this),
							blur: this.submissionHandler(this)
						};
						this.focusableItems[i].push(registerFocusable(MathQuill, this, to_populate[i][j][2], opts));
					} else {
						this.focusableItems[i].push(registerFocusable(eval(to_populate[i][j][0]), this, to_populate[i][j][2], to_populate[i][j][1]));
					}
					this.items.push(this.focusableItems[i][j]);
				}
			}
			if(this.options.two_line) this.focusableItems.unshift([]);
			super_.postInsertHandler.call(this);
			return this;
		}
		_.submissionHandler = function(_this) {
			return function(mathField) {
				if(_this.needsEvaluation) {
					var command = _this.options.command;
					for(var i = 0; i < _this.items.length; i++) 
						command = command.replace("$" + (i+1), _this.items[i].text());
					_this.commands = _this.genCommand(command);
					if(_this.options.protect_vars) {
						_this.commands[0].restore_vars = _this.items[_this.options.protect_vars-1].text();
						_this.commands[0].protect_vars = _this.items[_this.options.protect_vars-1].text();
					}
					_this.evaluate();
					_this.needsEvaluation = false;
				}
			};
		}
		// Callback for focusable items notifying that this element has been changed
		_.changed = function(el) {
			var all_touched = true;
			for(var i = 0; i < this.items.length; i++) {
				if(el === this.items[i]) this.items[i].touched = true;
				if(this.items[i].needs_touch) all_touched = all_touched && this.items[i].touched;
			}
			if(all_touched)
				this.needsEvaluation = true;
		}
	})});
}
