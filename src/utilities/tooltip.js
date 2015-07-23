$(function() { 
  var $el = $('<div/>').addClass(css_prefix + 'tooltip');
  var $help = $('<div/>').addClass(css_prefix + 'help_popup').appendTo('div.sidebar');
  var exposed = false;
  var help_shown = false;

  // Input html can have some basic markup.  Things between <<>> will be turned into a 'code' span block,
  // things between <[]> will be placed in a bounding box to indicate input (no nested boxes or code blocks), 
  // and things between || become an 'explanation' span.  \n changed to <br>
  var markup = function(html) {
  	return html.replace(/<\[([^>]*)\]>/g,'<span class="box">$1</span>').replace(/<<(.*)>>/g,'<span class="code">$1</span>').replace(/\n/g,'<br>').replace(/\|(.*)\|/g,'<span class="explanation">$1</span>');
  }
  // Create a tooltip with content HTML and location topblock.  Optional leftblock can be used as a different element to use for left position.  Assumes blocks are within sc_element_container
  var createTooltip = SwiftCalcs.createTooltip = function(html, topBlock, leftBlock) {
  	destroyTooltip();
    var container = $('.sc_element_container');
    var container_offset = container.offset();
  	if(typeof leftBlock === 'undefined') leftBlock = topBlock;
    var leftOffset = leftBlock.offset().left - 13;
    var topOffset = topBlock.offset().top  - container_offset.top + topBlock.height() + 18;

    var $arrow = $('<div/>').addClass(css_prefix + 'arrow');
    var $close = $('<div/>').addClass(css_prefix + 'close').html('Close').on('click', function() { SwiftCalcs.destroyTooltip(); });
    $el.html(markup(html)).append($arrow).append($close);

    $($el).appendTo(container);

    if(leftOffset > ($(window).width()/2)) {
    	$arrow.addClass('right');
    	leftOffset -= ($el.width() - 26);
    } else
    	$arrow.addClass('left');
    $el.css({top: Math.ceil(topOffset) + 'px', left: Math.floor(leftOffset) + 'px'});
    exposed = true;
	};

	var destroyTooltip = SwiftCalcs.destroyTooltip = function() {
		if(exposed) {
			$el.detach();
			exposed = false;
		}
	}

  // Create a Help Popup with content HTML
  var createHelpPopup = SwiftCalcs.createHelpPopup = function(html) {
  	destroyHelpPopup();
    $help.html(markup(html));
    $help.stop().slideDown({duration: 200, complete: function() { $(this).css('height','auto'); } });
    help_shown = true;
	};

	var destroyHelpPopup = SwiftCalcs.destroyHelpPopup = function() {
		if(help_shown) {
    	$help.stop().slideUp(300);
			help_shown = false;
		}
	}
});