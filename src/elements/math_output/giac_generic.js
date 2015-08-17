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

var GiacGeneric = P(MathOutput, function(_, super_) {
	_.savedProperties = ['expectedUnits','approx','factor_expand','outputMode','scoped'];
	_.scoped = false;
	_.was_scoped = false;
	_.function_of = false; 
	_.init = function() {
		super_.init.call(this);
	}
  _.parseSavedProperties = function(args) {
  	super_.parseSavedProperties.call(this, args);
  	if(this.scoped) {
  		this.jQ.find('span.' + css_prefix + 'var_store').show();
  		this.varStoreField.reflow();
	  	if(this.focusableItems[0][0] !== this.varStoreField)
	  		this.focusableItems[0].unshift(this.varStoreField);
  	}
  	return this;
  }
	_.postInsertHandler = function() {
		this.varStoreField = registerFocusable(MathQuill, this, 'var_store', { ghost: 'ans', noWidth: true, handlers: {
			enter: this.enterPressed(this),
			blur: this.submissionHandler(this)
		}});
		if(this.scoped)
			this.focusableItems[0].unshift(this.varStoreField);
		super_.postInsertHandler.call(this);
		// Test for ans_n as variable assigned in this item.  If so, we need to up the ans_id count
		if(this.scoped && this.varStoreField.text().match(/ans_[{]?[0-9]+[}]?/))
			this.setAnswerIdCounter(this.varStoreField.text().replace(/^.*ans_[{]?([0-9]+)[}]?.*$/,"$1")*1);
		return this;
	}

	_.enterPressed = function(_this) {
		return function(item) {
			_this.submissionHandler(_this)();
			var next_time = false;
			var selected = false;
			for(var i = 0; i < _this.focusableItems.length; i++) {
				for(var j = 0; j < _this.focusableItems[i].length; j++) {
					if(next_time) {
						_this.focusableItems[i][j].focus(-1);
						selected = true;
						break;
					}
					if(_this.focusableItems[i][j] === item) next_time = true;
				}
				if(selected) break;
			}
			if(!selected) {
				if(_this[R] && (_this[R] instanceof math) && _this[R].empty())
					_this[R].focus(L);
				else
					math().setImplicit().insertAfter(_this).show().focus(0);
			}	
		};
	}
  _.toString = function() {
  	return '{' + this.klass[0] + '}{{' + this.argumentList().join('}{') + '}}';
  }
	_.storeAsVariable = function(var_name) {
		this.scoped = true;
    this.outputMode = 2;
		this.jQ.find('span.' + css_prefix + 'var_store').show();
  	this.varStoreField.reflow();
  	if(this.focusableItems[0][0] !== this.varStoreField)
  		this.focusableItems[0].unshift(this.varStoreField);
		if(var_name)
			this.varStoreField.paste(var_name.replace(/_(.*)/,"_{$1}"));
		else if(this.function_of)
			this.varStoreField.clear().focus(1).moveToLeftEnd().write("latex{\\operatorname{ans_{" + this.uniqueAnsId() + "}}\\left({" + this.function_of + "}\\right)}").closePopup().keystroke('Shift-Home', { preventDefault: function() { } });
		else
			this.varStoreField.clear().focus(1).moveToLeftEnd().write("latex{ans_{" + this.uniqueAnsId() + "}}").closePopup().keystroke('Shift-Home', { preventDefault: function() { } });
		this.outputBox.setWidth();
	}
	_.clearVariableStore = function(focus_next) {
		this.scoped = false;
		this.was_scoped = true;
		this.jQ.find('span.' + css_prefix + 'var_store').hide();
  	if(this.focusableItems[0][0] === this.varStoreField)
  		this.focusableItems[0].splice(0,1);
		if(focus_next) this.focusableItems[0][0].focus(L);
	}
	_.genCommand = function(command) {
		if(this.scoped) command = this.varStoreField.text() + ' := ' + command;
		return super_.genCommand.call(this, command);
	}
});

var giac_elements_to_add = [];
var createGiacElement = function(options) {
	// Generate the required class variables based on the input stuct
	var focusable_list = [];
	if(typeof options.code === 'undefined') options.code = options.name;
	var id = 0;
	var html = '<table class="' + css_prefix + 'giac_element"><tbody><tr><td class="' + css_prefix + 'var_store">'
 	+ '<div class="' + css_prefix + 'focusableItems" data-id="0"><span class="' + css_prefix + 'var_store">' + focusableHTML('MathQuill',  'var_store') + '<span class="equality">&#8801;</span></span>' + focusableHTML('CodeBlock',  options.code) + '</td>'
	+ '<td class="' + css_prefix + 'content">';
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
	html += answerSpan() + '</td></tr></tbody></table>';
	giac_elements_to_add.push({key: options.name, el: P(GiacGeneric, function(_, super_) {
		_.klass = [options.name];
		_.helpText = options.helpText;
		_.function_of = options.function_of ? options.function_of : false;
		_.pre_command = options.pre_command ? options.pre_command : false;
		var block_html = html;
		var to_populate = focusable_list;
		_.options = options;
		_.innerHtml = function() {
			return block_html;
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
			this.focusableItems[0].unshift(registerFocusable(CodeBlock, this, this.options.code, {}));
			super_.postInsertHandler.call(this);
			return this;
		}
		_.submissionHandler = function(_this) {
			return function(mathField) {
				if((mathField === _this.varStoreField) && _this.varStoreField.empty()) 
					_this.clearVariableStore();
				if(_this.needsEvaluation) {
					var command = _this.options.command;
					for(var i = 0; i < _this.items.length; i++) 
						command = command.replace("$" + (i+1), _this.items[i].text());
					_this.commands = _this.genCommand(command);
					_this.fullEvaluation = (_this.scoped || _this.was_scoped);
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
