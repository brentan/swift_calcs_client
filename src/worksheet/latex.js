/********************************************************************
 * Helper function to transform latex into HTML or evaluatable text *
 ********************************************************************/
window.SwiftCalcsLatexHelper = {
	mathField: false,
	bindMathfield: function() {
		if(window.SwiftCalcsLatexHelper.mathField) return;
		var span = $('<table><tbody><tr><td><span></span></td></tr></tbody></table>');
		$('.background_div').append(span);
		window.SwiftCalcsLatexHelper.mathField = MathQuill.MathField(span.find('span')[0]);
		return this;
	},
	latexToHtml: function(latex) {
		window.SwiftCalcsLatexHelper.bindMathfield();
		try {
			return "<span class='mq-math-mode mq-editable-field'><span class='mq-root-block'>" + window.SwiftCalcsLatexHelper.mathField.clear().latex(latex).html() + "</span></span>";
		} catch(e) {
			return "<strong>DISPLAY ERROR: </strong>" + e + " (while trying to display: " + latex + ")";
		}
	},
	latexToText: function(latex) {
		window.SwiftCalcsLatexHelper.bindMathfield();
		return window.SwiftCalcsLatexHelper.mathField.clear().latex(latex).text();
	},
	// Special, used for the unit input box
	latexToUnit: function(latex) {
		if(latex === false) return false;
		window.SwiftCalcsLatexHelper.bindMathfield();
		var out = window.SwiftCalcsLatexHelper.mathField.clear().setUnitMode(true).latex(latex).text();
		var out2 = "<span class='mq-math-mode mq-editable-field'><span class='mq-root-block'>" + window.SwiftCalcsLatexHelper.mathField.html() + "</span></span>";
		window.SwiftCalcsLatexHelper.mathField.setUnitMode(false);
		if(out.trim() == '') return false;
		return [out, out2];
	}
};
Worksheet.open(function(_) {
	_.latexToHtml = function(latex) {
		return window.SwiftCalcsLatexHelper.latexToHtml(latex);
	}
	_.latexToText = function(latex) {
		return window.SwiftCalcsLatexHelper.latexToText(latex);
	}
	_.latexToUnit = function(latex) {
		return window.SwiftCalcsLatexHelper.latexToUnit(latex);
	}
});