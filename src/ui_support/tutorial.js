$(function() {
	// Screen explanation will highlight various sections of the screen and show explanatory text

	var load_blackout = function() {
		$('.blackout').remove();
		$('.base_layout').addClass('tutorial_open');
		$('<div/>').addClass('blackout').addClass('screen_explanation').appendTo($('body')).on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
	}
	var highlight = function(el) {
		$(el).addClass('screen_explanation').addClass('highlight');
	}
	var setContent = function(html, css, clear, klass) {
		if(clear) window.closeScreenExplanation(true);
		html = html.replace(/\[next=([0-9]+)\]/g, "<div><a class='next button' data-next='$1'>Continue</a></div>");
		html = html.replace(/\[fa=([a-z]+)\]/g, "<i class='fa fa-chevron-$1'></i>");
		html = html.replace(/\{([^\{\}]*)\}/g, "<kbd>$1</kbd>");
		html = html.replace(/\[([^\[\]]*)\]/g, "<div class='title'>$1</div>");
		$div = $('<div/>').addClass('content').addClass('screen_explanation').html(html).css(css).appendTo($('body'));
		if(klass) $div.addClass(klass);
		$div.find('a.next.button').on('click', function(e) {
			loadStep($(this).attr('data-next')*1);
			e.preventDefault();
			return false;
		});
		return $div;
	}
	window.ScreenExplanationStep = 0;
	var loadStep = function(step) {
		if(step == 0) { step = 1; window.ScreenExplanationStep = 1}
		if(step != window.ScreenExplanationStep) return;
		window.ScreenExplanationStep = step + 1;
		switch(step) {
			case 1:
      	window.forceLoadTutorial = false;
				load_blackout();
				var message = 'You\'re moments away from performing quick, easy, human-readable calculations!<BR>Watch our 60 second introductory video below to get started.';
				var vid_id = 'dQMBQSADQXg';
				if($('div.body').hasClass('onshape'))
					vid_id = 'wu08FXE60ZQ';
				else if($('div.body').hasClass('fusion'))
					vid_id = 'TTZMYkIAhdE';
				message += "<BR><iframe type='text/html' width='640' height='360' allowfullscreen src='https://www.youtube.com/embed/" + vid_id + "?autoplay=0&autohide=1&iv_load_policy=3&modestbranding=1&rel=0&fs=1' frameborder='0'></iframe>"
				message += '<div style="text-align:center;">You can find more help documentation, including video tutorials,<BR>from the help icon at the top right of the screen.<BR>[next=2]</div>';
				if(!window.user_logged_in)
					message += "<BR><BR><div style='font-size:11px;'>Already a user?  <a href='#' style='color:white;' onclick='window.closeScreenExplanation();window.loadSigninBox();return false;'>Login to your account</a></div>";
				setContent('[Welcome to Swift Calcs]<div style="margin: 0px auto;">' + message + '</div>',{top: '40px', left: '0px', right: '0px', 'text-align':'center'},true);
				setContent('<i class="fa fa-times" style="color:white;font-size:30px;cursor:pointer;" onclick="window.closeScreenExplanation();return false;"></i>', {top: '5px', left: '5px'});
				highlight('.new_bubble.new_worksheet');
				$('.next.button').html('Get Started with Swift Calcs');
				break;
			case 2:
				window.closeScreenExplanation();
				break;
		}
	}
	window.closeScreenExplanation = function(dont_remove_blackout) { 
		$('.screen_explanation.highlight').removeClass('screen_explanation').removeClass('highlight');
		$('.screen_explanation_content').removeClass('screen_explanation_content');
		if(dont_remove_blackout === true) {
			$('.screen_explanation.content').remove();
			return;
		}
		$('.base_layout').removeClass('tutorial_open');
		$('.screen_explanation').remove(); 
	}
	window.loadNextScreenExplanation = function(step) { loadStep(step); }
	window.loadTutorial = function() { if(window.embedded) { return; } loadStep(0); };
});