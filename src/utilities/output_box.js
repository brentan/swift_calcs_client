
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
		this.el.jQ.removeClass('warn error');
		this.tableJQ.next("div." + css_prefix + "calculation_stopped").slideUp({duration: 250, always: function() { $(this).remove(); } });
		this.jQ.addClass('calculating');
		return this;
	}
	_.setNormal = function(html, append) {
		if(!append) this.clearState();
		this.jQ.append(html);
		return this;
	}
	_.setWarning = function(html, append) {
		if(!append) this.clearState();
		this.el.jQ.addClass('warn');
		this.jQ.append('<div class="warning">' + html + '</div>');
		this.jQ.addClass('warn');
		return this;
	}
	_.setError = function(html, append) {
		if(!append) this.clearState();
		if(this.el.fullEvaluation) { // Stop evaluation on scoped items
			giac.errors_encountered = true;
			this.el.jQ.addClass('error'); 
			$('<div class="' + css_prefix + 'calculation_stopped" style="display:none;">Computation halted.  Please correct error to resume.</div>').insertAfter(this.tableJQ).slideDown({duration: 400});
		}
		this.el.jQ.addClass('error');
		this.jQ.append('<div class="error">' + html + '</div>');
		this.jQ.addClass('error');
		for(var el = this.el.parent; el instanceof Element; el = el.parent)
			el.expand();
		return this;
	}
	_.setWidth = function() {
		this.jQ.find('.mq-math-mode').css({maxWidth: max(200, this.jQ.closest('.' + css_prefix + 'element').width() - 150) + 'px', overflowX: 'auto'}).find('.mq-root-block').css('width','auto');
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