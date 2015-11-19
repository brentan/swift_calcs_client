/*
	Simple block to encourage user sign in
*/

var signIn = P(Element, function(_, super_) {
	_.klass = ['sign_in'];
	_.postInsertHandler = function() {
		super_.postInsertHandler.call(this);
		this.codeBlock = registerFocusable(CodeBlock, this, '', { });
		this.focusableItems = [[this.codeBlock]];
		this.jQ.find('div.explain a.old').on('click', function(e) { 
			window.loadSigninBox();
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
		return this;
	}
	_.innerHtml = function() {
		return '<table border=0><tbody><tr><td><div class="' + css_prefix + 'top ' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', '') + '</div></td>'
		+ '<td><div class="' + css_prefix + 'sign_in_box">'
		+ '<div><span class="close_span" style="float:right;color:#999999;cursor:pointer;text-decoration:underline">Not now <i class="fa fa-times"></i></span><strong>Join Us as an Early Adopter!</strong></div><table><tbody><tr><td style="text-align:left;padding-top: 6px;"><img src="' + window.logo_words_url + '" style="width:250px;margin-bottom:5px;">'
		+ '<div class="small">We\'re looking to transform the way engineers get work done through better, faster, and smarter computational tools.  When you join us as an early adopter, you\'ll be able to:</div>'
		+ '<ul><li><b>Save and create</b> worksheets that you can access anywhere</li>'
		+ '<li><b>Share worksheets instantly</b> with anyone, anywhere</li>'
		+ '<li>Add <b>more than 10 lines</b> to a worksheet</li>'
		+ '<li><b>Interact directly with Swift Calcs developers</b> to request new features or suggest improvements</li>'
		+ '<li>And it\'s all <b>free</b></li></ul>'
		+ '</td><td style="padding-top:6px;width:460px;padding-left:30px;">'
		+ '<b>Login With</b>'
		+ '<div>'
			+ '<div class="social_login facebook" data-type="facebook"><i class="fa fa-facebook-official"></i><span>Facebook</span></div>'
			+ '<div class="social_login google" data-type="google_oauth2"><i class="fa fa-google"></i><span>Google</span></div>'
			+ '<div class="social_login linkedin" data-type="linkedin"><i class="fa fa-linkedin"></i><span>LinkedIn</span></div>'
		+ '</div>'
		+ '<div class="explain">We don\'t post to your accounts or access friend lists.</div>'
		+ '<div class="hr"><div>OR</div></div>'
		+ '<b>Create a Swift Calcs Account</b>'
		+ '<form accept-charset="UTF-8" action="/users" class="new_user" data-remote="true" id="new_user" method="post" style="text-align:center;"><div style="display:none"><input name="utf8" type="hidden" value="✓"></div>'
		+ '<div class="field"><div class="form_label"><label for="user_name">Name</label></div><div class="form_entry"><input id="user_name" name="user[name]" type="text"></div></div>'
		+ '<div class="field"><div class="form_label"><label for="user_email">Email</label></div><div class="form_entry"><input id="user_email" name="user[email]" type="text"></div></div>'
		+ '<div class="field"><div class="form_label"><label for="user_password">Password</label></div><div class="form_entry"><input id="user_password" name="user[password]" type="password"></div></div>'
		+ '<div class="actions"><input name="commit" type="submit" value="Create Account"></div></form>'
		+ '<div class="explain">Already a member? <a class="old" href="#">Login</a></div>'
		+ '<div class="explain" style="margin-top:8px">You\'re work on this page will be saved when you login or create an account.</div>'
		+ '</td></tr></tbody></table></div></td></tr></tbody></table>';
	}
	_.toString = function() {
		return '';
	}
	_.empty = function() {
		return false;
	}
  _.mouseClick = function(e) {
  	if($(e.target).is('input')) {
  		window.setTimeout(function() { $(e.target).focus(); }); 
  		return false;
  	} else if($(e.target).hasClass('close_span')) {
  		window.setTimeout(function(_this) { return function() { var n = _this[-1]; _this.remove(); if(n) { n.focus(1); } } }(this));
  		showNotice('No Problem, you can create an account later from the \'Account\' menu at the top left of the screen', 'green');
  		return false;
  	}
  	this.codeBlock.focus(L);
  	return false;
  }
});
