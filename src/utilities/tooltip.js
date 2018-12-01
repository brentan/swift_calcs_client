// Various helper methods for creating tooltips and popups.  

$(function() { 
  var $el = $('<div/>').addClass(css_prefix + 'tooltip');
  var exposed = false;
  var help_shown = false;

  // Input html can have some basic markup.  Things between <<>> will be turned into a 'code' span block,
  // things between <[]> will be placed in a bounding box to indicate input (no nested boxes or code blocks), 
  // and things between || become an 'explanation' span.  \n changed to <br>
  var markup = function(html) {
  	return html.replace(/HELP:([0-9]+)/g,'<a href="#" class="help_item" style="color:#888888;" data-id="$1">Show Help Tutorial For This Topic</a>').replace(/<\[([^>]*)\]>/g,'<span class="box">$1</span>').replace(/<<(.*)>>/g,'<span class="code">$1</span>').replace(/\n/g,'<br>').replace(/\|(.*)\|/g,'<span class="explanation">$1</span>');
  }
  // Create a tooltip with content HTML and location topblock.  Optional leftblock can be used as a different element to use for left position.  Assumes blocks are within sc_element_container
  var createTooltip = SwiftCalcs.createTooltip = function(html, topBlock, leftBlock, high_z) {
  	destroyTooltip();
    var container = $('.sc_element_container');
  	if(typeof leftBlock === 'undefined') leftBlock = topBlock;
    var leftOffset = leftBlock.offset().left - 13;
    var topOffset = topBlock.offset().top + topBlock.height() + 4;
    var $arrow = $('<div/>').addClass(css_prefix + 'arrow');
    var $close = $('<div/>').addClass(css_prefix + 'close').html('<i class="fa fa-times-circle"></i>').on('click', function() { SwiftCalcs.destroyTooltip(); });
    $el.html(markup(html)).append($arrow).prepend($close);

    $($el).appendTo(container);
    if(window.embedded) {
      var container_offset = container.offset();
      leftOffset -= container_offset.left;
      topOffset -= container_offset.top;
    }

    if(leftOffset > ($(window).width()/2)) {
    	$arrow.addClass('right');
    	leftOffset -= ($el.width() - 26);
    } else
    	$arrow.addClass('left');
    $el.css({top: Math.ceil(topOffset) + 'px', left: Math.floor(leftOffset) + 'px', display:'none'});
    if(high_z)
      $el.addClass('high_z');
    $el.stop().fadeIn({duration: 50});
    exposed = true;
    return true;
	};

	var destroyTooltip = SwiftCalcs.destroyTooltip = function(fade) {
		if(exposed) {
      if(typeof fade === 'undefined') fade = 250;
      if(fade > 0)
			  $el.removeClass('high_z').stop().fadeOut({duration:fade, complete: function() { $(this).detach(); } });
      else
        $el.removeClass('high_z').stop().hide().detach();
			exposed = false;
		}
	}
  // Create a Help Popup with content HTML
  var createHelpPopup = SwiftCalcs.createHelpPopup = function(html, topBlock) {
    if(exposed) $el.removeClass('high_z').detach();
    var container = $('.sc_element_container');
    var leftOffset = topBlock.offset().left - 20 + Math.floor(topBlock.width()/2);
    var topOffset = topBlock.offset().top - 40;
    var $arrow = $('<div/>').addClass(css_prefix + 'arrow').addClass('down');
    var $close = $('<div/>').addClass(css_prefix + 'close').html('<i class="fa fa-times-circle"></i>').on('click', function() { SwiftCalcs.destroyTooltip(); });
    $el.html(markup(html)).append($arrow).prepend($close);
    $el.appendTo(container);
    topOffset = topOffset - $el.height();

    if(leftOffset > ($(window).width()/2)) {
      $arrow.addClass('right');
      leftOffset -= ($el.width() - 26);
    } else
      $arrow.addClass('left');
    $el.css({top: Math.ceil(topOffset) + 'px', left: Math.floor(leftOffset) + 'px', display:'none'});
    $el.stop().fadeIn({duration: 250});
    exposed = true;
    return $el;
	};

	var destroyHelpPopup = SwiftCalcs.destroyHelpPopup = function(fade) {
    destroyTooltip(fade);
	}
});