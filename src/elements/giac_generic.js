/* 
This Element type is a build-out of Element that allows for some
basic controls/structures to surface many of giac's internal
functions
*/

var for_lokop = P(Element, function(_, super_) {
	_.klass = ['for'];
	_.needsEvaluation = false; 
	_.evaluatable = true;
	_.fullEvaluation = true; 
	_.scoped = true;
	_.hasChildren = true;
	_.varField = 0;
	_.startField = 0;
	_.finishField = 0;
	_.stepField = 0;
	_.lineNumber = true;

	_.init = function(latex_var, latex_start, latex_finish, latex_step) {
		super_.init.call(this);
		this.latex_var = latex_var || '';
		this.latex_start = latex_start || '';
		this.latex_finish = latex_finish || '';
		this.latex_step = latex_step || '';
		this.touched = [false, false, false, false];
	}
	_.innerHtml = function() {
		return '<div class="' + css_prefix + 'focusableItems" data-id="0">' + codeBlockHTML('for', this.id) + mathSpan('var') 
		+ '&nbsp;from&nbsp;' + mathSpan('start')  
		+ '&nbsp;to&nbsp;' + mathSpan('finish')  
		+ '&nbsp;by&nbsp;' + mathSpan('step') + helpBlock()
		+ '<BR>' + answerSpan() + '</div><div class="' + css_prefix + 'insert"></div><div class="' + css_prefix + 'focusableItems" data-id="2">' + codeBlockHTML('end', this.id) + '</div>';
	}
	_.postInsertHandler = function() {
		this.varField = registerMath(this, 'var', { handlers: {
			enter: this.enterPressed(this,1),
			blur: this.submissionHandler(this)
		}});
		this.startField = registerMath(this, 'start', { handlers: {
			enter: this.enterPressed(this,2),
			blur: this.submissionHandler(this)
		}});
		this.finishField = registerMath(this, 'finish', { handlers: {
			enter: this.enterPressed(this,3),
			blur: this.submissionHandler(this)
		}});
		this.stepField = registerMath(this, 'step', { handlers: {
			enter: this.enterPressed(this,4),
			blur: this.submissionHandler(this)
		}});
		this.focusableItems = [[registerCommand(this, 'for', { }), this.varField, this.startField, this.finishField, this.stepField], [-1], [registerCommand(this, 'end', { })]];
		this.varField.write(this.latex_var);
		this.startField.write(this.latex_start);
		this.finishField.write(this.latex_finish);
		this.stepField.write(this.latex_step);
		this.touched = [false, false, false, false];
		this.needsEvaluation = false;
		super_.postInsertHandler.call(this);
		return this;
	}
});