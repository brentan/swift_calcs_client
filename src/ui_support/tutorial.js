$(function() {
	// Screen explanation will highlight various sections of the screen and show explanatory text

	var load_whiteout = function() {
		$('.whiteout').remove();
		$('<div/>').addClass('whiteout').addClass('screen_explanation').appendTo($('body')).on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
	}
	var load_blackout = function() {
		$('.blackout').remove();
		$('<div/>').addClass('blackout').addClass('screen_explanation').appendTo($('body')).on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
	}
	var highlight = function(el) {
		$(el).addClass('screen_explanation').addClass('highlight');
	}
	var setContent = function(html, css, clear) {
		if(clear) {
			$('.screen_explanation.content').remove();
			$('.screen_explanation.highlight').removeClass('screen_explanation').removeClass('highlight').removeClass('show_file');
		}
		html = html.replace(/\[next=([0-9]+)\]/g, "<div><a class='next button' data-next='$1'>Continue</a></div>");
		html = html.replace(/\[fa=([a-z]+)\]/g, "<i class='fa fa-chevron-$1'></i>");
		html = html.replace(/\[([^\[\]]*)\]/g, "<div class='title'>$1</div>");
		$('<div/>').addClass('content').addClass('screen_explanation').html(html).css(css).appendTo($('body')).find('a.next.button').on('click', function(e) {
			loadStep($(this).attr('data-next')*1);
			e.preventDefault();
			return false;
		});
	}
	var loadStep = function(step) {
		switch(step) {
			case 1:
				load_whiteout();
				load_blackout();
				setContent('[Welcome to Swift Calcs]<div style="max-width:530px;margin: 0px auto;">We know, you\'re eager to get started.  We\'re eager too!  Just give us a quick second to show you the place.<BR><BR>Click <i>continue</i> and we\'ll get you familiar with all things Swift Calcs in no time at all.</div>[next=2]',{top: '150px', left: '0px', right: '0px', 'text-align':'center'},true);
				break;
			/*case 5:
				setContent('<table border=0><tbody><tr><td>[It\'s Alive!]Swift Calcs computes your document as your type.  Check the status bar for information about the current computation, including computation progress or errors.</td><td valign=bottom>[next=' + (step+1) + ']</td></tr></tbody></table>',{left: '145px', bottom: '35px', 'text-align':'left', 'max-width':'750px'}, true);
				setContent('[fa=down]',{left: '50px',bottom:'35px'});
				highlight('div.status_bar');
				break;*/
			/*case 8:
				setContent('[Keep in Touch]We want to hear from you!  Report bugs or request features using the <i>Feedback</i> box on every page.[next=' + (step+1) + ']',{left: '140px', top: '335px', 'text-align':'left', 'max-width':'550px'}, true);
				setContent('[fa=left]',{left: '60px',top:'335px'});
				highlight('div.feedback_link');
				break;*/
			case 4:
				setContent('[It\'s Cloudy Out]All your files are in the cloud, accessible anywhere.  Create a new worksheet or open previous worksheets from anywhere with an internet connection.  [next=' + (step+1) + ']',{left: '190px', top: '210px', 'text-align':'left', 'max-width':'400px'}, true);
				setContent('[fa=left]',{left: '190px',top:'115px'});
				if($(window).width() > 930) {
					setContent('[Learn to Share]Click the share worksheet button to open your document up to collaborators or the world.  Choose who can view, who can edit, and who can invite others.',{right: '70px', top: '132px', 'text-align':'right', 'max-width':'250px'});
					setContent('[fa=up]',{right: '70px',top:'55px'});
				}
				highlight('div#menu_bar');
				$('div#menu_bar').addClass('show_file');
				break;
			/*case 2:
				setContent('[Let\'s Take It from the Top]Your Worksheet name is shown at the top of the page.  Click the name to change it.  [next=' + (step+1) + ']',{left: '80px', top: '112px', 'text-align':'left', 'max-width':'550px'}, true);
				setContent('[fa=up]',{left: '80px',top:'35px'});
				highlight('div#account_bar');
				break;*/
			/*case 4:
				setContent('[Add a Wingman]Click the share worksheet button to open your document up to collaborators or the world.  Choose who can view, who can edit, and who can invite others.[next=' + (step+1) + ']',{right: '70px', top: '132px', 'text-align':'right', 'max-width':'550px'}, true);
				setContent('[fa=up]',{right: '70px',top:'55px'});
				highlight('div#menu_bar');
				break;*/
			case 2:
				var height = $('div.toolbar').height();
				setContent('[Enter Math Naturally]In math mode, the toolbar holds helpers to insert various mathematical commands.  In text mode, use the toolbar to format your text.  The toolbar changes its options depending on the input mode.[next=' + (step+1) + ']',{left: '100px', top: (160 + height) + 'px', 'text-align':'left', 'max-width':'500px'}, true);
				setContent('[fa=up]',{left: '100px',top: (70 + height) + 'px'});
				highlight('div.toolbar');
				break;
			case 3:
				setContent('[Spice Up your Worksheet]Add text, plots, videos, solvers, and more to your Worksheet.  Click an item or click and drag it onto your document to use.[next=' + (step+1) + ']',{right: '360px', top: '140px', 'text-align':'right', 'max-width':'500px'}, true);
				setContent('[fa=right]',{right: '280px',top: '160px'});
				highlight('div.sidebar');
				setContent('[It\'s Alive!]Swift Calcs computes your document as your type.  Check the status bar for information about the current computation, including computation progress or errors.',{left: '145px', bottom: '35px', 'text-align':'left', 'max-width':'750px'});
				setContent('[fa=down]',{left: '50px',bottom:'35px'});
				highlight('div.status_bar');
				break;
			case 5:
				setContent('[Prepare to Jump]<div style="max-width:530px;margin: 0px auto;">Thanks for letting us show you around.  You can always find more tips and hints from the <i>help</i> menu.<BR><BR>You\'re ready...</div>[next=' + (step + 1) + ']',{top: '150px', left: '0px', right: '0px', 'text-align':'center'},true);
				$('.screen_explanation.content a.next.button').html('Let\'s Jump In!');
				break;
			case 6:
				$('.screen_explanation.highlight').removeClass('screen_explanation').removeClass('highlight');
				$('.screen_explanation').remove();
				if(SwiftCalcs.active_worksheet) SwiftCalcs.active_worksheet.ends[-1].focus(-1);
				if(window.location.href.match(/\/worksheets\/new[\s\/?]*$/) || window.loadTutorialAfterScreen) window.loadTutorial();
				break;
		}
	}
	window.loadScreenExplanation = function() { loadStep(1); }
});
$(function() {
	// tutorial will load over bottom portion of screen and show the user how to create a basic document
	var blackout = function(html, gif) {
		html = html.replace(/<a ([^<>]*)>/g, "<a href='#' class='button $1'>");
		html = html.replace(/\[next\]/g, "<div><a class='next button'>Continue</a></div>");
		html = html.replace(/\[([^\[\]]*)\]/g, "<div class='title'>$1</div>");
		html = html.replace(/\{([^\{\}]*)\}/g, "<kbd>$1</kbd>");
		html = html.replace(/\(\(([^\(\)]*)\)\)/g, "<div class='explain'>$1</div>");
		html = html.replace(/\n/g, "<br/>");
		if(gif) 
			html = "<table border=0 width='100%'><tbody><tr><td>" + html + "</td><td style='width:1px;border-left:1px solid #bbbbbb;padding: 2px;'><img src='" + window.tutorial_images[gif] + "'></td></tr></tbody></table>";
		if($(".worksheet_holder").hasClass('tutorial')) {
			$('.tutorial .content').html(html).width(Math.max(300, $('.sc_element_container').width() - 100));
		} else {
			$(".worksheet_holder").addClass('tutorial');
			var tutorial = $('<div/>').addClass('tutorial').addClass('help').appendTo($('body'));
			var content = $('<div/>').addClass('content').html(html).appendTo(tutorial);
			window.setTimeout(function() {
				$('<div/>').addClass('close').addClass('fa').addClass('fa-times-circle-o').prependTo(tutorial).on('click', function() { closeTutorial(); });
				$('<div/>').addClass('blackout_gradient').prependTo(tutorial);
				$('<div/>').addClass('blackout').prependTo(tutorial);
				content.width(Math.max(300, $('.sc_element_container').width() - 100)).slideDown({duration: 450});
			},750);
		}
		$('.tutorial .content').find('a.next').on('click', function(e) {
			window.swift_calcs_tutorial();
			e.preventDefault();
			return false;
		});
	}
	var closeTutorial = function() {
		$(".worksheet_holder").removeClass('tutorial');
		$(".tutorial .content").slideUp({duration: 300, always: function() { $(".tutorial").remove(); }});
		window.desired_tutorial_output = false;
	}
	var current_step = 1;
	window.desired_tutorial_output = false;
	window.swift_calcs_tutorial = function(step) {
		if(step) current_step = step;
		else { current_step++; step = current_step; }
		switch(step) {
			case 1:
				blackout("[Need Some Ideas?]Looking to create your first document or see what Swift Calcs can do?<div class='button_fixed_width'><a next>Walk through a simple example</a>\n<a grey>View the full list of examples</a></div>");
				$(".tutorial .content").find('a.grey').on('click', function() { window.loadToPopup('/examples/list',{}); closeTutorial(); return false; });
				$('<div><a href="#" class="direct_link">No thanks, I got this</a></div>').appendTo($(".button_fixed_width")).find('a').on('click', function() { closeTutorial(); return false; });
				break;
			case 2:
				blackout("[Let's Get Started]We will solve a simple problem: The Pythagorean Theorem.  Start by defining the first leg of the triangle:\n{a}{=}{4}{f}{t}{enter}[next]",2);
				SwiftCalcs.active_worksheet.ends[1].focus(1);
				window.desired_tutorial_output = 'a := 4*(_ft)';
				break;
			case 3:
				blackout("[Moving Right Along]And the second leg:\n{b}{=}{1}{2}{0}{c}{m}{enter}[next]",3);
				SwiftCalcs.active_worksheet.ends[1].focus(1);
				window.desired_tutorial_output = 'b := 120*(_cm)';
				break;
			case 4:
				blackout("[Drumroll Please]Time to calculate the hypotenuse:\n{s}{q}{r}{t}{(}{a}{^}{2}{space}{+}{b}{^}{2}{enter}[next]",4);
				SwiftCalcs.active_worksheet.ends[1].focus(1);
				window.desired_tutorial_output = ' sqrt(a^(2)+b^(2))';
				break;
			case 5:
				if(($('.sc_sign_in').length == 0) && !window.shown_signin) {
					window.shown_signin = true;
					window.setTimeout(function() { SwiftCalcs.elements['signin_block']().insertAfter(SwiftCalcs.active_worksheet.ends[1]).show(450); }, 1000);
				}
				blackout("[You're Just Scratching the Surface]We've got you started, and there is much more under the hood.  Check out our example worksheets and learn about defining functions, adding text, creating plots, importing data, and more.  Or head out on your own and explore all there is on offer. <div class='button_fixed_width'><a tut>View example worksheets</a>\n<a grey next>Close the tutorial</a></div>");
				$(".tutorial .content").find('a.tut').on('click', function() { window.loadToPopup('/examples/list',{}); closeTutorial(); return false; });
				SwiftCalcs.active_worksheet.ends[1].focus(1);
				break;
			case 6:
				closeTutorial();
				SwiftCalcs.active_worksheet.ends[1].focus(1);
				break;
		}
	}
	window.loadTutorial = function() { 
		window.swift_calcs_tutorial(1);
	};
	$('body').on('click', '.menu .load_tutorial', function(e) { window.loadScreenExplanation(); window.loadTutorialAfterScreen = true; return false; });
});