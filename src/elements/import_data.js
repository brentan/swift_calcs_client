/*
	Import Data block will create a file-uplaod dialog.  Ties in to 
	the upload file box created by the worksheet during bindUploads.
	Only one 'active' import data box is allowed on the sheet at a time
*/

var importData = P(Element, function(_, super_) {
	_.klass = ['importData','hide_print'];
	_.evaluatable = false;
	_.helpText = "<<import>>\nImport files or attach data to your worksheet.";
	_.active_items = 0;
	_.dropzone_showing = true;
	_.no_save = true;
	_.focuasableName = 'import';
	_.codeBlock = false;

	_.init = function() {
		super_.init.call(this);
		this.uploadBlocks = {};
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'top ' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', this.focuasableName) + helpBlock() 
			+ '</div><div class="' + css_prefix + 'dropzone_box ' + css_prefix + 'upload_box">Click here or drag files here to import<br><div style="font-size:0.6em; font-weight:normal; font-style: italic;">Supported File Types: Images, .CSV files</div></div><div class="' + css_prefix + 'insert ' + css_prefix + 'hide_print"></div>';
	}
	_.postInsertHandler = function() {
		this.uploadBox = this.jQ.find('.' + css_prefix + 'upload_box');
		super_.postInsertHandler.call(this);
		this.insertJQ.hide();
		this.codeBlock = registerFocusable(CodeBlock,this, this.focuasableName, { });
		this.focusableItems = [[this.codeBlock]];
		this.leftJQ.append('<span class="fa fa-upload"></span>');
		this.showDropzone();
		return this;
	}
	_.findUploadingBlock = function(id) {
		return this.uploadBlocks['id_' + id];
	}
	_.hideDropzone = function() {
    this.insertJQ.show();
		this.dropzone_showing = false;
		this.uploadBox.hide();
	}
	_.showDropzone = function() {
		this.dropzone_showing = true;
		$.each(this.uploadBlocks, function(k, v) {
			v.remove();
		});
		this.insertJQ.hide();
		this.uploadBox.show();
	}
	_.focus = function(dir) {
		super_.focus.call(this);
		if(dir)
			this.focusableItems[0][0].focus(dir);
		return this;
	}
  _.toString = function() {
  	return '{import}{{' + this.argumentList().join('}{') + '}}';
  }
	_.mouseClick = function(e) {
    if(super_.mouseClick.call(this,e)) return true;
		var target = $(e.target).closest('div.' + css_prefix + 'dropzone_box');
		if(target.length == 0) {
			this.focus(R);
			return false;
		} else {
			this.worksheet.jQ.find("input.file_uploads").trigger('click');
		}
		return false;
	}
	_.destroy = function() {
		$.each(this.uploadBlocks, function(k, v) {
			v.remove();
		});
		return super_.destroy.call(this);
	}
});


$(function () {
  $(document).bind('drop dragover', function (e) {
    e.preventDefault();
	});
	$(document).bind('dragover', function (e) {
  	var dropZone = $('.' + css_prefix + 'dropzone_box'),
      foundDropzone,
      timeout = window.dropZoneTimeout;
    if (!timeout)
    	dropZone.addClass('in');
    else
    	clearTimeout(timeout);
    var found = false,
    node = e.target;
    do {
      if ($(node).hasClass('sc_dropzone_box')) {
        found = true;
        foundDropzone = $(node);
        break;
      }
      node = node.parentNode;
    } while (node != null);
    dropZone.removeClass('in hover');
    if (found)
    	foundDropzone.addClass('hover');
    window.dropZoneTimeout = setTimeout(function () {
      window.dropZoneTimeout = null;
      dropZone.removeClass('in hover');
    }, 100);
  });
});


/*

	// Evaluate...do my job!
	_.evaluate = function(master_allow_evaluation, scope) {
		if(typeof scope === 'undefined') scope = {};
		this.scope = $.deepClone(scope);
		this.clearState();

		// Test if the provided variable name is valid
		this.iterator = this.optionsTable.getBlock(0,2).ends[dir.L].mathquill_block.text().trim();
		if(this.iterator.length == 0) 
			this.setError('No variable name provided.  Please provide a variable name to assign data to.');
		else if(this.iterator.match(/^[a-zA-Z]+[a-zA-Z_0-9]*$/) === null)
			this.setError('Invalid variable name.  Please provide a valid variable name.');
		else
			this.optionsTable.getBlock(0,2).ends[dir.L].jQ.children('.sc_mathquill').css('border-color','white');

		if(this.error !== false) 
			this.showError();
		else if(this.warn !== false) 
			new TextBlock(this.warn, ['solution', 'warn']).insertAfter(this.optionsTable).show(200);
		else {
			this.blur();
			if(this.data === false) {
				var _this = this;
				// Data has not yet been loaded.  Call ajax request and wait until we get our result
				// First re-add myself to the evaluation queue, as once data is loaded i need to be re-evaluated
				window.EvaluationQueue.queue.unshift(this);
				this.changed = true;
				// Now submit the ajax request to get the data
			  $.ajax({
			    type: "POST",
			    url: "/file",
			    dataType: 'json',
			    cache: false,
			    data: { id: this.data_id }, 
			    success: function(response) {
			    	if(response.success) {
			    		_this.data = response.data;
			    		window.EvaluationQueue.evaluateNext();
						} else {
							_this.setError('There was an error loading the file: ' + response.message);
							_this.showError();
			    		window.EvaluationQueue.setError();
						}
			    },
			    error: function(err) {
			      console.log(err);
			    	window.EvaluationQueue.setError();
			      //Depending on error, do we try again?
			      // TODO: Much better error handling!
			    }
			  });
				return this;
			} else {
				// Data already loaded.  Lets assign it
				try {
					this.result = this.scope[this.iterator] = math.matrix(this.data);
					this.setComplete();
				} catch(err) {
					this.setError(err.message.replace(/symbol/g, 'variable'));
					this.showError();
				}
			}
		}
		// Propagate
		this.evaluateNext();
		return this;
	}

	_.preRemoveHandler = function() {
		super_.preRemoveHandler.call(this);
	  $.ajax({
	    type: "POST",
	    url: "/destroy_file",
	    dataType: 'json',
	    cache: false,
	    data: { id: this.data_id }, 
	    success: function(response) {
	    	if(!response.success) {
	    		// What now?
				}
	    },
	    error: function(err) {
	      console.log(err);
	      //Depending on error, do we try again?
	      // TODO: Much better error handling!
	    }
	  });
		return this;
	}
});
*/

var UploadingBlock = P(function(_) {
	var block_id = 0;
	_.init = function(name, el) {
		this.name = name;
		this.id = block_id++;
		this.el = el;
		this.el.uploadBlocks['id_' + this.id] = this;
		this.el.active_items++;
		this.el.dropzone_showing = false;
		this.jQ = $('<div class="uploading_block_holder"><div class="progress"></div><div class="text"><span>' + this.name + '</span><span class="result"></span></div></div>');
		this.jQ.appendTo(this.el.insertJQ);
	}
	_.remove = function() {
		delete this.el.uploadBlocks['id_' + this.id];
		this.el.active_items--;
		this.jQ.remove();
		if((this.el.active_items == 0) && !this.el.dropzone_showing)
			this.el.remove();
	}
	// Update progress bar (0-100)
	_.updateProgress = function(progress) {
		if(this.jQ !== 0) 
			this.jQ.find('.progress').css('width',progress + '%');
		if(progress == 100) {
			this.jQ.find('.progress').addClass('sc_upload_complete')
			this.jQ.find('.result').html('- Upload Complete: Analyzing File...');
		}
		return this;
	}
	_.setError = function(error) {
		this.jQ.find('.progress').removeClass('sc_upload_complete').addClass('sc_error');
		this.jQ.find('.result').html(' - ' + error);
		var button = $('<span> <a href="#" class="try_again">Try Again</a></span>');
		var _this = this;
		button.find('.try_again').click(function() {
			_this.el.showDropzone();
			return false;
		});
		button.appendTo(this.jQ.find('.result'));
		return this;
	}
});
