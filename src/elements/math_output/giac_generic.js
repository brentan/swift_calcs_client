/* 
A simle extension of math output that we then wrap in a constructor
so that we can spin up lots of basic element types using a standard
structure:

{
	name: 'name' // name of element (used for code block and keyboard shortcut)',
	helpText: 'help text for tooltip bubble',
	content: [ // An array where each item is a new row.  Items between <<>> will be tranformed into
						 // the focusableItem with the same name.  Options can be sent with a hash_string list after the focusable item name
		"text:<<MathQuill>>",
		"text2:<<SelectBox {options: { item: 'value', item2: 'value2' }}>>"
	],
	pre_command: "assume(n, DOM_INT)", // Pre-command to run before the real command, if any.  Omit if none
	command: "giac($1, $2)" // command to send to giac, with $1 the output from the first focusable item, $2 the second, etc
	protect_vars: 2, // index of variable entry field, will be protected from evaluation
	returns_function: 's' // if returns a function, default variable (can be $n too), requires protect_vars to be set too
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
	options.two_line = (options.code.length > 23);
	giac_elements_to_add.push({key: options.name, el: P(SettableMathOutput, function(_, super_) {
		_.klass = [options.name];
		_.helpText = options.helpText;
		_.nomarkup = options.nomarkup;
		_.no_approx = options.no_approx ? options.no_approx : false;
		_.no_algebra = options.no_algebra ? options.no_algebra : false;
		_.returns_function = options.returns_function ? options.returns_function : false;
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
					var returns_function = _this.options.returns_function;
					for(var i = 0; i < _this.items.length; i++) {
						command = command.replace("$" + (i+1), _this.items[i].text());
						if(returns_function) returns_function=returns_function.replace("$" + (i+1), _this.items[i].text());
					}
					if(_this.options.returns_function) {
	          if(_this.varStoreField.text().match(/^[a-z][a-z0-9_~]*$/i)) {
	            // Need to turn in to a function definition
	            var varName = window.SwiftCalcsLatexHelper.VarNameToLatex(_this.varStoreField.text());
	            _this.varStoreField.clear().paste("\\operatorname{" + varName + "}\\left({" + returns_function + "}\\right)");
	          }
	          if(_this.varStoreField.text().length == 0) command = command.replace("'x'","'" + returns_function + "'");
						_this.commands = _this.genCommand("[val]");
						_this.commands[0].dereference = true;
						_this.commands.unshift({command: command, nomarkup: true }); 
					} else
						_this.commands = _this.genCommand(command);
					if(_this.options.protect_vars) {
						_this.commands[_this.commands.length-1].restore_vars = _this.items[_this.options.protect_vars-1].text();
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
		_.evaluationFinished = function(result) {
			if(this.options.returns_function) {
				var to_return = super_.evaluationFinished.call(this, [result[1]]); // Transform to array with result 1 in spot 0, as that is what is expected in evaluationFinished
				this.last_result = result;
				return to_return;
			} else
				return super_.evaluationFinished.call(this, result);
		}
	})});
}
