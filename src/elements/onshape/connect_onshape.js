var connectOnshape = P(Element, function(_, super_) {
	_.klass = ['connectOnshape'];
	_.lineNumber = true;
	_.get = false;
	_.savedProperties = ['get'];

	_.init = function(get) {
		super_.init.call(this);
		this.get = get;
	}
	_.innerHtml = function() {
		return '<span class="fa fa-spinner fa-pulse"></span>&nbsp;<i>Connecting to Onshape</i>';
	}
	_.postInsertHandler = function() {
		super_.postInsertHandler.call(this);
		window.ajaxRequest("/onshape/get_elements", {hash_string: this.worksheet.hash_string}, function(_this) { return function(response) { _this.ajaxCallback(true, response); } }(this), function(_this) { return function(response) { _this.ajaxCallback(false, response); } }(this));
		return this;
	}
	_.ajaxCallback = function(success, response) {
		if(success) {
			if(response.part_list.length == 1)
				connectOnshape_3(this.get, response.part_list[0]["name"], response.part_list[0]["id"]).insertAfter(this).show(0).focus(R);
			else
				connectOnshape_2(this.get, response.part_list).insertAfter(this).show(0).focus(R);
		}
		this.remove(0);
	}
  _.toString = function() {
  	return '{connectOnshape}{{' + this.argumentList().join('}{') + '}}';
  }
});

var connectOnshape_2 = P(Element, function(_, super_) {
	_.klass = ['connectOnshape'];
	_.lineNumber = true;
	_.get = false;
	_.savedProperties = ['get'];

	_.init = function(get, response) {
		super_.init.call(this);
		this.get = get;
		this.parts = response; 
		this.parts_list = {};
		for(var i = 0; i < response.length; i++)
			this.parts_list["" + i] = response[i]['name'];
	}
	_.innerHtml = function() {
	 	return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', (this.get ? 'Read' : 'Set') + ' Onshape Variable') + '&nbsp;' + focusableHTML('SelectBox', 'part') + '</div>';
	}
	_.postInsertHandler = function() {
		this.part_select = registerFocusable(SelectBox, this, 'part', { blank_message: 'Choose an Onshape part', dont_grey_blank: true, options: this.parts_list});
		this.focusableItems = [[registerFocusable(CodeBlock, this, (this.get ? 'Read' : 'Set') + ' Onshape Variable', { }), this.part_select]];
		super_.postInsertHandler.call(this);
		return this;
	}
	_.changed = function(el) {
		item = this.parts[el.text()*1];
		connectOnshape_3(this.get, item["name"], item["id"]).insertAfter(this).show(0).focus(R);
		this.remove(0);
	}
  _.toString = function() {
  	return '{connectOnshape}{{' + this.argumentList().join('}{') + '}}';
  }
});

var connectOnshape_3 = P(Element, function(_, super_) {
	_.klass = ['connectOnshape'];
	_.lineNumber = true;
	_.part_name = "";
	_.part_id = "";
	_.get = false;
	_.savedProperties = ['part_name','part_id', 'get'];

	_.init = function(get, name, id) {
		super_.init.call(this);
		this.part_name = name;
		this.part_id = id;
		this.get = get;
	}

	_.innerHtml = function() {
	 	return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', (this.get ? 'Read' : 'Set') + ' Onshape Variable') + '&nbsp;from&nbsp;' + this.part_name + '</div>'
		+ '<div class="' + css_prefix + 'left_indent"><span class="fa fa-spinner fa-pulse"></span>&nbsp;<i>Connecting to Onshape</i></div>';
	}
	_.postInsertHandler = function() {
		this.focusableItems = [[registerFocusable(CodeBlock, this, (this.get ? 'Read' : 'Set') + ' Onshape Variable', { })]];
		super_.postInsertHandler.call(this);
		window.ajaxRequest("/onshape/get_variables", {hash_string: this.worksheet.hash_string, eid: this.part_id}, function(_this) { return function(response) { _this.ajaxCallback(true, response); } }(this), function(_this) { return function(response) { _this.ajaxCallback(false, response); } }(this));
		return this;
	}
	_.ajaxCallback = function(success, response) {
		if(success) {
			if(response.var_list.length == 0) {
				if(this[L]) this[L].focus(L);
				else if(this[R]) this[R].focus(L);
				showNotice('This part has no variables.  Create a variable in the part and try again.','red');
			} else
				connectOnshape_4(this.get, this.part_name, this.part_id, response.var_list).insertAfter(this).show(0).focus(R);
		}
		this.remove(0);
	}
  _.toString = function() {
  	return '{connectOnshape_3}{{' + this.argumentList().join('}{') + '}}';
  }
});

var connectOnshape_4 = P(Element, function(_, super_) {
	_.klass = ['connectOnshape'];
	_.lineNumber = true;
	_.part_name = "";
	_.part_id = "";
	_.get = false;
	_.savedProperties = ['part_name','part_id', 'get'];
	_.init = function(get, name, id, var_list) {
		super_.init.call(this);
		this.part_name = name;
		this.part_id = id;
		this.vars = var_list; 
		if(get)
			this.var_list = {};
		else
			this.var_list = {new: "Create new variable"};
		this.get = get;
		for(var i = 0; i < var_list.length; i++)
			this.var_list["" + i] = var_list[i]['name'];
	}
	_.innerHtml = function() {
	 	return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', (this.get ? 'Read' : 'Set') + ' Onshape Variable') + '&nbsp;from&nbsp;' + this.part_name + '</div>'
	 	+ '<div class="' + css_prefix + 'focusableItems ' + css_prefix + 'left_indent" data-id="1">' + focusableHTML('SelectBox', 'var') + '<span class="to_store">&nbsp;<i class="fa fa-spinner fa-pulse"></i>&nbsp;Updating Onshape</span></div>';
	}
	_.postInsertHandler = function() {
		this.var_select = registerFocusable(SelectBox, this, 'var', { blank_message: 'Choose a Variable', dont_grey_blank: true, options: this.var_list});
		this.focusableItems = [[registerFocusable(CodeBlock, this, (this.get ? 'Read' : 'Set') + ' Onshape Variable', { })],[this.var_select]];
		super_.postInsertHandler.call(this);
		return this;
	}
	_.changed = function(el) {
		if(el.text() == "new") {
			var var_name = prompt("Please enter a name for the new variable").trim();
			if(var_name.match(/^[a-z][a-z0-9]*$/i)) {
				// Create new variable
				this.jQ.find('.' + css_prefix + 'SelectBox').hide();
				this.jQ.find('.to_store').show();
				window.ajaxRequest("/onshape/create_variable", {hash_string: this.worksheet.hash_string, eid: this.part_id, fid: this.var_id, name: var_name}, function(_this) { return function(response) { 
					_this.jQ.find('.' + css_prefix + 'SelectBox').show();
					_this.jQ.find('.to_store').hide();
					setOnshapeVariable(_this.part_name, _this.part_id, var_name, response.id).insertAfter(_this).show(0).focus(0);
					_this.remove(0);
				}}(this), function(_this) { return function(response) { 
					_this.jQ.find('.' + css_prefix + 'SelectBox').show();
					_this.jQ.find('.to_store').hide();
					_this.var_select.clear();
					_this.setError(response.message)
				}});
			} else {
				this.var_select.clear();
				showNotice("Invalid variable name.  Must be letter followed by letter and/or numbers.","red")
			}
		} else {
			item = this.vars[el.text()*1];
			if(this.get)
				loadOnshapeVariable(this.part_name, this.part_id, item["name"], item["id"]).insertAfter(this).show(0).focus(0);
			else
				setOnshapeVariable(this.part_name, this.part_id, item["name"], item["id"]).insertAfter(this).show(0).focus(0);
			this.remove(0);
		}
	}
  _.toString = function() {
  	return '{connectOnshape_3}{{' + this.argumentList().join('}{') + '}}';
  }
});

