$(function() {
  // Setup the sidebar

  var sidebar = {
    General: [
      {left: 'fa-calculator', text: 'Math Mode', el: 'math' },
      {left: 'fa-font', text: 'Text Mode', el: 'text' },
      {left: 'x&#8801;', text: 'Define a Variable', el: 'math', option: 'latex{x=}', prepend: true, highlight: "Shift-Right"},
      {left: '&#402;(<span style="font-style: italic;">x</span>)&#8801;', text: 'Define a Function', el: 'math', option: 'latex{\\operatorname{f}\\left({}\\right)=}', prepend: true, highlight: "Right Shift-Right"},
      {left: 'fa-line-chart', text: 'Plot Function', el: 'plot'},
      {left: 'fa-upload', text: 'Import Data', el: 'import'},
      {left: 'fa-table', text: 'Table', vaporware: true},
      {left: 'fa-paint-brush', text: 'Drawing', vaporware: true}
    ],
    Data: [
      {left: 'fa-upload', text: 'Import Data', el: 'import'},
      {left: 'fa-magic', text: 'Regression / fit line', el: 'regression'},
    ],
    Expansions: [
      { left: '&#8497;a<sub>n</sub>', text: 'Fourier Series a<sub>n</sub>', el: 'fouriera' },
      { left: '&#8497;b<sub>n</sub>', text: 'Fourier Series b<sub>n</sub>', el: 'fourierb' },
      { left: '&#8497;c<sub>n</sub>', text: 'Fourier Series c<sub>n</sub>', el: 'fourierc' },
      { left: 'm/n', text: 'Pade Approximant', el: 'pade' },
      { left: '&#931;', text: 'Series Expansion', el: 'series' },
      { left: '&#8465;', text: 'Taylor Expansion', el: 'taylor' },
    ],
    Flow_Control: [
      {left: 'if', text: 'If Statement', el: 'if'},
      {left: 'elseif', text: 'Else If Statement', el: 'elseif'},
      {left: 'else', text: 'Else Statement', el: 'else'},
      {left: 'for', text: 'For Loop', el: 'for'},
      {left: 'break', text: 'Break', el: 'break'},
      {left: 'cont', text: 'Continue', el: 'continue'},
    ],
    Multimedia: [
      {left: 'fa-picture-o', text: 'Image', el: 'image'},
      {left: 'fa-youtube-play', text: 'YouTube or Vimeo', el: 'video'},
    ],
    Plots_and_Charts: [
      {left: 'fa-line-chart', text: 'Plot Function', el: 'plot'},
      {left: 'fa-area-chart', text: 'Line Plot', el: 'plot', option: 'plot_line'},
      {left: 'fa-area-chart', text: 'Area Plot', el: 'plot', option: 'plot_area'},
      {left: 'fa-area-chart', text: 'Scatter Plot', el: 'plot', option: 'plot_scatter'},
      {left: 'fa-bar-chart', text: 'Bar Chart', el: 'plot', option: 'plot_bar'},
      {left: 'fa-bar-chart', text: 'Histogram', el: 'plot', option: 'plot_histogram'},
    ],
    Solvers: [
      {left: 'x=?', text: 'Solver', el: 'solve'},
      {left: 'dx', text: 'ODE Solver', el: 'desolve'},
      {left: 'max', text: 'Function Maximum', el: 'fmax' },
      {left: 'min', text: 'Function Minimum', el: 'fmin' },
    ],
    Transforms: [
      { left: '&#8497;', text: 'Fast Fourier Transform', el: 'fft' },
      { left: '&#8497;<sup>-1</sup>', text: 'Inverse Fourier', el: 'ifft' },
      { left: '&#8466;', text: 'Laplace Tranform', el: 'laplace' },
      { left: '&#8466;<sup>-1</sup>', text: 'Inverse Laplace ', el: 'ilaplace' },
      { left: '&Zeta;', text: 'Z Transform', el: 'ztrans' },
      { left: '&Zeta;<sup>-1</sup>', text: 'Inverse Z Transform', el: 'iztrans' },
    ],
    Variables: [
      {left: 'x&#8801;', text: 'Define a Variable', el: 'math', option: 'latex{x=}', prepend: true, highlight: "Shift-Right"},
      {left: '&#402;(<span style="font-style: italic;">x</span>)&#8801;', text: 'Define a Function', el: 'math', option: 'latex{\\operatorname{f}\\left({}\\right)=}', prepend: true, highlight: "Right Shift-Right"},
      {left: 'fa-trash', text: 'Purge Variable', el: 'purge' },
    ],
  };
  var first = true;
  var $box = $('div.content.tools');
  var $menu = $('#account_bar .insert_menu');
  var options = ['el', 'option', 'prepend', 'highlight', 'append'];
  $.each(sidebar, function(k, v) {
    // Add to menubar
    var $li = $('<li/>').append($('<a><span class="fa fa-caret-right" style="float:right;"></span>' + k.replace(/_/g,' ') + '&nbsp;&nbsp;&nbsp;</a>'));
    var $ul = $('<ul/>').appendTo($li);
    // Add to toolbox in sidebar
    if(first)
      var $section = $('<div/>').addClass('section').addClass('selected').html(k.replace(/_/g,' ') + " <span class='fa fa-caret-down'></span>");
    else
      var $section = $('<div/>').addClass('section').html(k.replace(/_/g,' ') + " <span class='fa fa-caret-right'></span>");
    $box.append($section);
    var $holder = $('<div/>').addClass('box');
    if(first)
      $holder.addClass('show').css('display','block');
    var $table = $('<table/>');
    var $tbody = $('<tbody/>').appendTo($table);
    var $tr = $('<tr/>');
    var count = 0;
    for(var i = 0; i < v.length; i++) {
      // Add to menubarvar 
      var $a = $('<a href="#"></a>').html(v[i].text).addClass('tool');
      if(v[i].vaporware) $a.addClass('vaporware');
      for(var j = 0; j < options.length; j++)
        if(v[i][options[j]]) $a.attr('data-' + options[j], v[i][options[j]]);
      if(v[i].giac_func) 
        $a.attr('data-el','math').attr('data-option','latex{\\operatorname{' + v[i].giac_func.replace(/^([^_])*_(.*)$/,"$1_{$2}") + '}\\left({}\\right)}').attr('data-highlight','Left').attr('data-append',true);
      if(v[i].left.match(/^fa-[a-zA-Z_\-]+$/))
        $a.prepend('<i class="fa fa-fw ' + v[i].left + '"></i>');
      else
        $a.prepend('<i class="fa fa-fw fa-minus"></i>');
      $('<li/>').append($a).appendTo($ul);
      // Add to toolbox in sidebar
      var $item = $('<div/>').addClass('tool').attr('draggable','true');
      if(v[i].vaporware) $item.addClass('vaporware');
      for(var j = 0; j < options.length; j++)
        if(v[i][options[j]]) $item.attr('data-' + options[j], v[i][options[j]]);
      if(v[i].giac_func) 
        $item.attr('data-el','math').attr('data-option','latex{\\operatorname{' + v[i].giac_func.replace(/^([^_])*_(.*)$/,"$1_{$2}") + '}\\left({}\\right)}').attr('data-highlight','Left').attr('data-append',true);
      var $centered = $('<div/>').addClass('centered').appendTo($item);
      if(!v[i].left)
        $('<div/>').addClass('left').html('<i class="fa fa-minus"></i>').appendTo($centered);
      else if(v[i].left.match(/^fa-[a-zA-Z_\-]+$/))
        $('<div/>').addClass('left').html('<i class="fa ' + v[i].left + '"></i>').appendTo($centered);
      else
        $('<div/>').addClass('left').html(v[i].left).appendTo($centered);
      $('<span/>').html(v[i].text).appendTo($centered);
      $('<td/>').append($item).appendTo($tr);
      count++;
      if(count == 3) {
        count = 0;
        $tr.appendTo($tbody);
        $tr = $('<tr/>');
      }
    }
    if(count == 1) {
      $('<td/>').appendTo($tr);
      $('<td/>').appendTo($tr);
      $tr.appendTo($tbody);
    } else if(count == 2) {
      $('<td/>').appendTo($tr);
      $tr.appendTo($tbody);
    }
    $table.appendTo($holder);
    $holder.appendTo($box);
    $li.appendTo($menu);
    first = false;
  });
  function click_handler(_this) {
    return function(e_up) {
      if(_this.hasClass('vaporware')) {
        showNotice('This feature is not yet available');
        return;
      }
      window.closeSidebar();
      // Handle full click events as mousedown and then mouseup
      if(SwiftCalcs.active_worksheet)
        var el = SwiftCalcs.active_worksheet.lastActive;
      else
        return showNotice('Create or open a worksheet to insert this item');
      var check_for_storeAsVariable = true;
      if(el === 0) {
        el = SwiftCalcs.active_worksheet.ends[1];
        check_for_storeAsVariable = false;
      }
      else if((_this.attr('data-prepend') || _this.attr('data-append')) && (el.lastFocusedItem.mathquill) && !el.implicit) {
        // Prepend the option to a mathquill item, instead of creating a new block
        SwiftCalcs.active_worksheet.startUndoStream();
        var prepend = _this.attr('data-prepend') ? true : false;
        var math_el = el.lastFocusedItem
        el.focus(prepend ? -1 : 1);
        math_el.focus(prepend ? -1 : 1);
        if(prepend)
          math_el.moveToLeftEnd().write(_this.attr('data-option')).closePopup().moveToLeftEnd();
        else
          math_el.moveToRightEnd().write(_this.attr('data-option')).closePopup().moveToRightEnd();
        var commands = _this.attr('data-highlight').split(' ');
        for(var i = 0; i < commands.length; i++)
          math_el.keystroke(commands[i], { preventDefault: function() { } });
        SwiftCalcs.active_worksheet.endUndoStream();
        return;
      }
      SwiftCalcs.active_worksheet.startUndoStream();
      if(el.implicit) {
        // Implicit items, at this point, have already been blurred and removed from the DOM.  So find a neighbor
        if(el[-1]) el = el[-1];
        else if(el[1]) el = SwiftCalcs.elements.math().insertBefore(el[1]);
        else if(el.parent && el.parent.implicitType) el = el.parent.implicitType().prependTo(el.parent);
        else if(el.parent) el = SwiftCalcs.elements.math().prependTo(el.parent);
      }
      var replace = false;
      if(el.empty && el.empty())
        replace = true;
      var to_create = SwiftCalcs.elements[_this.attr('data-el')];
      if(_this.attr('data-option'))
        to_create = to_create(_this.attr('data-option'));
      else
        to_create = to_create();
      if(!replace && check_for_storeAsVariable && to_create.storeAsVariable && (el instanceof SwiftCalcs.elements.math) && el.mathField.text().match(/^[^=]* := *$/i)) {
        el.mark_for_deletion = true;
        var var_name = el.mathField.text().replace(/^([^=]*) :=.*$/i,"$1");
        el.needsEvaluation = false;
        to_create.insertAfter(el).show().focus(_this.attr('data-option') ? 1 : 0);
        to_create.storeAsVariable(var_name);
        el.remove(0);
      } else {
        to_create.insertAfter(el).show(150).focus(_this.attr('data-option') ? 1 : 0);
        if(replace) 
          el.remove();
        if(_this.attr('data-el') == 'text')
          to_create.textField.magicCommands();
      }
      SwiftCalcs.active_worksheet.endUndoStream();
    }
  }
	function mouseDown(e) {
		var _this = $(this);
		function drag_done_handler(el, into, dir) {
      if(_this.hasClass('vaporware')) {
        showNotice('This feature is not yet available');
        return;
      }
  		// Begin moving the selected elements to the new target
      SwiftCalcs.active_worksheet.startUndoStream();
  		var to_create = SwiftCalcs.elements[_this.attr('data-el')];
  		if(_this.attr('data-option'))
  			to_create = to_create(_this.attr('data-option'));
  		else
  			to_create = to_create();
  		if(into) 
  			to_create.insertInto(el, dir).show(150).focus(_this.attr('data-option') ? 1 : 0);
  		else
  			to_create.insertNextTo(el, dir).show(150).focus(_this.attr('data-option') ? 1 : 0);
  		if(_this.attr('data-el') == 'text')
  			to_create.textField.magicCommands();
      SwiftCalcs.active_worksheet.endUndoStream();
  		return;
		}
    if(SwiftCalcs.active_worksheet)
      SwiftCalcs.active_worksheet.bindDragging(e, $(this), click_handler(_this), drag_done_handler)
    else
      showNotice('Create or open a worksheet to insert this item');
	};
  window.closeSidebar = function() {
    $('div.sidebar').animate({width: 25}, {duration: 250, easing: 'easeOutQuad', always: function() { $('div.sidebar div.toolbox_icon').addClass('closed') }});
    $('div.sidebar_close').remove();
    $(window).off('blur', window.closeSidebar);
  }
  $('body').on('mousedown', 'div.sidebar .tool', mouseDown);
  $('body').on('click', '#account_bar .insert_menu a.tool', function(e) { var _this = $(this); click_handler(_this)(e); _this.closest('ul.insert_menu').hide(); window.setTimeout(function() { _this.closest('ul.insert_menu').css('display',''); },500); return false; });
  $('body').on('mouseover', 'div.sidebar div.toolbox_icon.closed', function(e) {
    $(this).removeClass('closed');
    $(window).on('blur', window.closeSidebar);
    $('div.sidebar').animate({width: 275}, {duration: 250, easing: 'easeOutQuad', always: function() {
      $('<div/>').addClass('sidebar_close').appendTo('.base_layout').on('mouseover', function() {
        window.closeSidebar();
      }).on('dragover', function() {
        window.closeSidebar();
      });
    }});
  });
  // Toolbox headers
  $('body').on('click', 'div.content.tools div.section', function(e) {
    var arrow = $(this).find('span').first();
    if(arrow.hasClass('fa-caret-down')) {
      // Already open
      arrow.removeClass('fa-caret-down').addClass('fa-caret-right');
      $(this).removeClass('selected');
      $(this).next('.box').addClass('show').slideUp(250);
    } else {
      // close another, then open me
      $(this).closest('div.content').find('.section.selected').removeClass('selected');
      $(this).closest('div.content').find('.fa-caret-down').removeClass('fa-caret-down').addClass('fa-caret-right');
      $(this).closest('div.content').find('.show').removeClass('show').slideUp(250);
      $(this).addClass('selected');
      $(this).next('.box').addClass('show').slideDown(250);
      arrow.addClass('fa-caret-down').removeClass('fa-caret-right');
    }
  });
  // Settings
  $('body').on('click', 'a.custom_units', function(e) {
    $('div.custom_units').addClass('shown');
    $(this).hide();
    SwiftCalcs.active_worksheet.settings.custom_units = true;
    e.preventDefault();
    e.stopPropagation();
    return false;
  });
});