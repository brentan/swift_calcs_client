/*
	Simple block to encourage user sign in
*/

var signIn = P(Element, function(_, super_) {
	_.klass = ['sign_in'];
	_.postInsertHandler = function() {
		super_.postInsertHandler.call(this);
		this.codeBlock = registerFocusable(CodeBlock, this, '', { });
		this.focusableItems = [[this.codeBlock]];
		this.jQ.find('div.explain a.new').on('click', function(e) { 
			window.newAccountBox();
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
		this.jQ.find('div.explain a.old').on('click', function(e) { 
			window.loadSigninBox();
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
		this.jQ.find('div.social_login').on('click', function(e) { 
			window.loadSocialSigninBox($(this).attr('data-type'));
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
		return this;
	}
	_.innerHtml = function() {
		return '<table border=0><tbody><tr><td><div class="' + css_prefix + 'top ' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', '') + '</div></td>'
		+ '<td><div class="' + css_prefix + 'sign_in_box">'
		+ '<div><strong>Don\'t lose this Masterpiece!</strong></div>'
		+ '<div class="explain">Looking to save this document or share it with others?  Login with an account you already have:</div>'
		+ '<div>'
			+ '<div class="social_login facebook" data-type="facebook"><i class="fa fa-facebook-official"></i><span>Sign in with Facbook</span></div>'
			+ '<div class="social_login google" data-type="google_oauth2"><i class="fa fa-google"></i><span>Sign in with Google</span></div>'
			+ '<div class="social_login linkedin" data-type="linkedin"><i class="fa fa-linkedin"></i><span>Sign in with LinkedIn</span></div>'
		+ '</div>'
		+ '<div class="explain">Or <a class="new" href="#">Create a Swift Calcs Account</a>.  Already a member? <a class="old" href="#">Login with Swift Calcs</a></div>'
		+ '</div></td></tr></table>';
	}
	_.toString = function() {
		return '';
	}
	_.empty = function() {
		return false;
	}
  _.mouseClick = function() {
  	this.codeBlock.focus(L);
  	return false;
  }
});
