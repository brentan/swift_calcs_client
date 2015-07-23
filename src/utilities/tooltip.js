$(function() { 
  var $el = $('<div/>').addClass(css_prefix + 'tooltip');
  var exposed = false;

  // Create a tooltip with content HTML and location topblock.  Optional leftblock can be used as a different element to use for left position
  var createTooltip = SwiftCalcs.createTooltip = function(html, topBlock, leftBlock) {
  	destroyTooltip();
  	if(typeof leftBlock === 'undefined') leftBlock = topBlock;
    var leftOffset = leftBlock.position().left;
    var topOffset = topBlock.position().top + topBlock.height() + 5;
    if(SwiftCalcs.active_workspace && SwiftCalcs.active_workspace.jQ.has(topBlock))
    	topOffset += SwiftCalcs.active_workspace.jQ.scrollTop();

    var $arrow = $('<div/>').addClass(css_prefix + 'arrow');
    $el.html(html).append($arrow);

    if(SwiftCalcs.active_workspace && SwiftCalcs.active_workspace.jQ.has(topBlock))
			$($el).appendTo(SwiftCalcs.active_workspace.jQ);
    else
			$($el).appendTo('body');

    if(leftOffset > ($(window).width()/2)) {
    	$arrow.addClass('right');
    	leftOffset -= ($el.width() - 60);
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
});