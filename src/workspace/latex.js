/********************************************************************
 * Helper function to transform latex into HTML or evaluatable text *
 ********************************************************************/

Workspace.open(function(_) {
	var mathField = false;
	var bindMathfield = function() {
		if(mathField) return;
		var span = $('<span></span>');
		$('.background_div').append(span);
		mathField = MathQuill.MathField(span[0]);
		return this;
	}
	_.latexToHtml = function(latex) {
		bindMathfield();
		return "<span class='mq-math-mode mq-editable-field'><span class='mq-root-block'>" + mathField.clear().latex(latex).html() + "</span></span>";
	}
	_.latexToText = function(latex) {
		bindMathfield();
		return mathField.clear().latex(latex).text();
	}
	// Special, used for the unit input box
	_.latexToUnit = function(latex) {
		if(latex === false) return false;
		bindMathfield();
		var out = mathField.clear().setUnitMode(true).latex(latex).text();
		var out2 = "<span class='mq-math-mode mq-editable-field'><span class='mq-root-block'>" + mathField.html() + "</span></span>";
		mathField.setUnitMode(false);
		if(out.trim() == '') return false;
		return [out, out2];
	}
});