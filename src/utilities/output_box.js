
var outputBox = P(function(_) {
	_.jQ = 0;
	_.el = 0;
	_.tableJQ = 0;
	_.collapsed = true; // This starts collapsed

	_.init = function(el) {
		this.el = el;
		this.jQ = el.jQ.find('.' + css_prefix + 'output_box');
		this.tableJQ = this.jQ.closest('div.' + css_prefix + 'answer_table')
	}

	_.clearState = function() {
		this.el.jQ.removeClass('warn error');
		this.jQ.removeClass('calculating warn error');
		this.tableJQ.next("div." + css_prefix + "calculation_stopped").slideUp({duration: 250, always: function() { $(this).remove(); } });
		this.jQ.html('');
		return this;
	}
	_.calculating = function() {
		this.jQ.addClass('calculating');
		return this;
	}
	_.resetErrorWarning = function() {
		this.el.jQ.removeClass('warn error');
		this.jQ.removeClass('calculating warn error');
		this.tableJQ.next("div." + css_prefix + "calculation_stopped").slideUp({duration: 250, always: function() { $(this).remove(); } });
		return this;
	}
	_.uncalculating = function() {
		this.jQ.removeClass('calculating');
		return this;
	}
	_.setNormal = function(html, append) {
		if(!append) this.clearState();
		this.jQ.append(html);
		return this;
	}
	_.setWarning = function(html, append) {
		html = html.replace(/warning[,:\-]/i, "Notice:").replace(/warning/i, "Notice");
		if(!append) this.clearState();
		this.el.jQ.addClass('warn');
		var err = $('<div/>').addClass('warning').html(html);
		$('<a href="#"><i class="fa fa-fw fa-question-circle"></i></a>').on('click', function(e) {
			window.loadToPopup('/error_help', {message: html});
			e.preventDefault();
			e.stopPropagation();
			return false;
		}).appendTo(err);
		this.jQ.append(err);
		this.jQ.addClass('warn');
		return this;
	}
	_.setError = function(html, append) {
		if(!append) this.clearState();
		window.trackEvent("Interaction", "Error", html);
		if(this.el.allIndependentVars().length) { // Stop evaluation on scoped items
			giac.errors_encountered = true;
			this.el.jQ.addClass('error'); 
			$('<div class="' + css_prefix + 'calculation_stopped" style="display:none;">Computation halted.  Please correct error to resume.</div>').insertAfter(this.tableJQ).slideDown({duration: 400});
		}
		this.el.jQ.addClass('error');
		var err = $('<div/>').addClass('error').html(html);
		$('<a href="#"><i class="fa fa-fw fa-question-circle"></i></a>').on('click', function(e) {
			window.loadToPopup('/error_help', {message: html});
			e.preventDefault();
			e.stopPropagation();
			return false;
		}).appendTo(err);
		this.jQ.append(err);
		this.jQ.addClass('error');
		for(var el = this.el.parent; el instanceof Element; el = el.parent)
			el.expand();
		return this;
	}
	_.setWidth = function() {
		this.jQ.find('.mq-math-mode').css({maxWidth: '200px'});
		var wide = this.jQ.closest('.' + css_prefix + 'content').length ? (this.jQ.closest('.' + css_prefix + 'content').width() - 60) : (this.jQ.closest('.' + css_prefix + 'element').width() - 150);
		this.jQ.find('.mq-math-mode').show().css({maxWidth: max(200, wide) + 'px', overflowX: 'auto'}).find('.mq-root-block').css('width','auto');
		return this;
	}
	_.collapse = function(immediately) {
		if(this.collapsed) return this;
		this.collapsed = true;
		if(immediately)
			this.tableJQ.hide();
		else
			this.tableJQ.hide({ duration: 400 });
		return this;
	}
	_.expand = function(immediately) {
		if(!this.collapsed) return this;
		this.setWidth();
		this.collapsed = false;
		if(immediately)
			this.tableJQ.show();
		else
			this.tableJQ.show({ duration: 400 });
		return this;
	}

});