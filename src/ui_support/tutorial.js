$(function() {
	// Screen explanation will highlight various sections of the screen and show explanatory text

	var load_whiteout = function() {
		$('<div/>').addClass('whiteout').addClass('screen_explanation').appendTo($('body')).on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
	}
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
				$('.whiteout').remove();
				load_blackout();
				var message = 'You\'re moments away from performing quick, easy, human-readable calculations!<BR><BR>We rely on a proven, open-source mathematics engine, but Swift Calcs is still a <i>Beta</i> product.<BR>Help us get better: report bugs or suggest features by clicking <span style="display:inline-block;width:34px;height:30px;padding-top:4px;border-radius:17px;font-weight:bold;text-align:center;background-color:#386889"><i class="fa fa-question" style="font-size:22px;"></i></span> at the top right of any page.';
				if(!window.user_logged_in)
					message += "<BR><BR><div style='font-size:11px;'>Already a user?  <a href='#' style='color:white;' onclick='window.forceLoadTutorial=false;window.closeScreenExplanation();window.loadSigninBox();return false;'>Login to your account</a></div>";
				setContent('[Welcome to Swift Calcs]<div style="max-width:530px;margin: 0px auto;">' + message + '</div>',{top: '100px', left: '0px', right: '0px', 'text-align':'center'},true);
				setContent('[fa=right]',{right: '110px',bottom:'25px'});
				setContent('<div style="border:3px solid white;border-right-width:0px;padding:5px 20px 5px 5px;">Click the <i>New Worksheet</i> button to get started</div>',{right: '153px',bottom:'45px'}, false, 'arrow');
				highlight('.new_bubble.new_worksheet');
				break;
			case 2:
				load_blackout();
				var loc = $('.active_holder .worksheet_item').offset();
				setContent('[Name your Worksheet]No more "Do Not Erase!" in the corner of the whiteboard.  A descriptive name helps you find it later when you need it again.<div style="font-size:11px">Enter a new name and press Enter to continue</div>', {left: (loc.left + 120) + 'px', top: (75 + loc.top) + 'px', 'text-align':'left', 'max-width':'600px'}, true);
				setContent('[fa=up]',{left: (loc.left + 10) + 'px',top: (loc.top + 55) + 'px'});
				highlight('.active_holder .worksheet_item');
				break;
			case 3:
				load_blackout();
				var examples = {
					"Calculate with Units": "{2}{4} {v}{o}{l}{t} {*} {7} {a}{m}{p} {Space} {Enter}",
					"Store and Retrieve Variables": "{x} {=} {4} {^} {2}{.}{2} {Enter}<BR>{x} {/} {3}{.}{5} {Space} {+} {2} {Enter}",
					"Define and Utilize Functions": "{A}{_}{c}{(} {r} {)} {=} {p}{i} {*} {r} {^} {2} {Enter}<BR>{A}{_}{c}{(} {2}{0}{.}{2} {c}{m} {)} {Enter}"
				};
				var commands = [];
				$.each(examples, function(k, v) { commands.push(k + (window.matchMedia("only screen and (max-device-width: 480px)").matches ? "<BR>" : "</td><td>") + v.replace(/ /g,'<span class="spacer"></span>')); });
				$div = setContent('<div style="text-align:right;">[next=4]</div><div>[Sample Commands]<table class="help_table"><tbody><tr><td style="width:250px;">' + commands.join("</td></tr><tr><td>") + '</td></tr></tbody></table></div>', {'text-align':'left'}, true);
				$div.detach().insertAfter('.active_holder').css({position: 'relative', margin: '10px 0px 0px 0px;'});
				$div = setContent('<table><tbody><tr><td valign=top style="vertical-align:bottom;"><i class="fa fa-chevron-down"></i></td><td style="padding-left:20px;">[Get Calculating]Enter commands and get answers.  Swift Calcs is designed to make equation entry fast and simple.  Need inspiration?  Look to the sample commands below.</td></tr></tbody></table>', {'text-align':'left'});
				$div.detach().insertBefore('.active_holder .content').css({position: 'relative', height: '0px', top: (window.matchMedia("only screen and (max-device-width: 480px)").matches  ? '-160px' : '-110px'), color: 'white'});
				setContent('<div style="background-color: #184869;height:' + (40 + $('div.toolbar').height()) + 'px;">&nbsp;</div>', {left: '0px', right: '0px', top: '0px'});
				setContent('<i class="fa fa-chevron-down" style="font-size:26px;margin-right:10px;"></i>Use the toolbar to insert special characters or mathematical commands',{left: (window.matchMedia("only screen and (max-device-width: 480px)").matches ? '3px' : '230px'),top: '5px'});
				$('.active_holder .content').addClass('screen_explanation_content');
				highlight('div.toolbar');
				highlight('td.left div.logo');
				highlight('div.status_bar');
				$('.next.button').html('Finish the Tutorial');
				break;
			case 4:
				load_blackout();
				load_whiteout();
				setContent('[We\'re Just Getting Warmed Up]Use the expandable toolbox on the screen\'s right edge to add text, plots, videos, solvers, and more to your Worksheet.<BR><BR>[Ready to Jump In?]We\'ve just scratched the surface of the power and flexibility of Swift Calcs.  Now it\'s your turn to dive in.<BR>[next=5]',{right: (window.matchMedia("only screen and (max-device-width: 480px)").matches ? '110px' : '360px'), top: '100px', 'text-align':'right', 'max-width':'500px'}, true);
				setContent('[fa=right]',{right: (window.matchMedia("only screen and (max-device-width: 480px)").matches ? '30px' : '280px'),top: '120px'});
				highlight('div.sidebar');
				if(!window.matchMedia("only screen and (max-device-width: 480px)").matches) window.setTimeout(function() { $('div.sidebar').animate({width: 275}, {duration: 450, easing: 'easeOutQuad'}); }, 250);
				$('.next.button').html('Close Tutorial');
				break;
			case 5:
      	window.forceLoadTutorial = false;
				window.closeScreenExplanation();
				window.setTimeout(function() { SwiftCalcs.active_worksheet.ends[1].focus(1); window.closeSidebar(); });
				window.setTimeout(function() { SwiftCalcs.createTooltip("<<Help is Always Here>>\nRemember, if you run in to trouble or need a hint, click this icon and send us a note.", $('nav.accounts li.icon.help'), $('nav.accounts li.icon.help i'), true)}, 1000);
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
	window.loadTutorial = function() { loadStep(0); };
	$('body').on('click', '#account_bar .load_tutorial', function(e) { window.loadTutorial(); return false; });

	if(window.returning_user) {
		showNotice("Welcome Back!  <a href='#' onclick='window.loadTutorial();return false;'>Take a tour</a> to familiarize yourself with Swift Calcs v0.3", 'yellow', 6000);
	}
});