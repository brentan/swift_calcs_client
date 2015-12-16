/**
 * SwiftCalcs: http://www.swiftcalcs.com
 * by Brentan Alexander (brentan.alexander@gmail.com)
 *
 * This Source Code Form is subject to the terms of the
 * Mozilla Public License, v. 2.0. If a copy of the MPL
 * was not distributed with this file, You can obtain
 * one at http://mozilla.org/MPL/2.0/.
 */

function SwiftCalcException(message) {
   this.message = message;
   this.name = "SwiftCalcException";
}
// global variable namespace
var SwiftCalcs = {};

(function() {

	// Local variables
  var jQuery = window.jQuery,
    undefined,
    css_prefix = 'sc_',
    min = Math.min,
    max = Math.max,
    L = -1,
    R = 1;
	function noop() {}

  // Help circles.  Added to blocks that have help associated with them.  On click, a small help bubble will appear with information
  var helpBlock = function() {
    return '&nbsp;&nbsp;<a class="' + css_prefix + 'help_circle" href="#"><span class="fa fa-question-circle"></span></a>';
  }
  $('body').on('click', 'a.' + css_prefix + 'help_circle', function(e) { 
    var el = SwiftCalcs.elementById($(e.target).closest('.' + css_prefix + 'element').attr(css_prefix + 'element_id')*1)
    if(el && el.helpText) {
      SwiftCalcs.createTooltip(el.helpText, $(this));
      ahoy.track("Clicked Help Circle", {element_type: el.helpText.split('>>')[0].replace("<<","")})
    }
    return false;
  });

  // This returns the answer block which is used to show the results from a calculation
  var answerSpan = function(klass) {
    if(klass)
      klass = ' ' + css_prefix + klass;
    else
      klass = '';
    return '<div class="' + css_prefix + 'answer_table' + klass + '"><table class="' + css_prefix + 'answer_table"><tbody><tr>'
        + '<td class="' + css_prefix + 'answer_table_1t"><div class="arrow_box">&gt;</div></td>'
        + '<td rowspan=2 class="' + css_prefix + 'answer_table_2">&nbsp;</td>'
        + '<td rowspan=2 class="' + css_prefix + 'output_box"><table><tbody><tr><td><div class="answer"></div></td><td class="answer_menu"></td></tr></tbody></table></td></tr>'
        + '<tr><td class="' + css_prefix + 'answer_table_1b">&nbsp;</td></tr></tbody></table></div>';
  }
  // BRENTAN Examing HTML And pull images etc into their own blocks etc
  // Take in HTML, clean it, and then return an array of elements to insert based on the HTML
  var sanitize = function(html) {
    var output = DOMPurify.sanitize(html, {
      ALLOW_DATA_ATTR: false,
      SAFE_FOR_JQUERY: true,
      ALLOWED_TAGS: ['a','b','br','center','em',
        'h1','h2','h3','h4','h5','h6','hr','i',
        'img','li','ol','p','strike','span','div',
        'strong','sub','sup','table','tbody','td','th','tr','u','ul',],
      ALLOWED_ATTR: [
        'alt','bgcolor','border','color','cols','colspan','rows','rowspan','style','src','valign','class']
      });
    return [text(output)];
  }
  var status_bar = $('.status_bar');
  // Status bar helper functions
  var clearBar = function() {
    status_bar.removeClass(css_prefix + 'clear ' + css_prefix + 'complete ' + css_prefix + 'error ' + css_prefix + 'warn ' + css_prefix + 'manual');
    status_bar.html('');
  }
  var startProgress = function(message) {
    if(status_bar.children('.progress_bar').length > 0) return;
    clearBar();
    message = message || 'Calculating... <a href="#"><i>Abort</i></a>';
    status_bar.addClass(css_prefix + 'clear');
    status_bar.html('<div class="progress_bar"></div><div class="message_text"><i class="fa fa-spinner fa-pulse"></i>&nbsp;' + message + '</div>');
    status_bar.find('a').on('click', function(e) {
      giac.cancelEvaluations($(this));
      return false;
    });
  }
  var progressTimeout = false;
  var setProgress = function(percent) {
    if(progressTimeout) window.clearTimeout(progressTimeout);
    progressTimeout = false;
    status_bar.children('.progress_bar').css('width', Math.floor(percent * 100) + '%'); 
  }
  var setUpdateTimeout = function(start_percent, end_percent, total_time) {
    var doTimeout = function(setting) {
      progressTimeout = false;
      if(setting > end_percent) setting = end_percent;
      setProgress(setting);
      if(setting < end_percent) {
        var delay = Math.random()*100 + 350;
        var new_val = setting + (end_percent - start_percent) * delay / total_time;
        progressTimeout = window.setTimeout(function(val) { return function() { doTimeout(val); }; }(new_val), delay);
      }
    }
    doTimeout(start_percent);
  }
  var changeMessage = function(text) {
    status_bar.find('.message_text').html('<i class="fa fa-spinner fa-pulse"></i>&nbsp;' + text);
  }
  var setComplete = function() {
    clearBar();
    status_bar.addClass(css_prefix + 'complete');
    status_bar.html('Ready to Calculate');
  }
  var setWarning = function(warn) {
    clearBar();
    status_bar.addClass(css_prefix + 'warn');
    status_bar.html(warn);
  }
  var setManual = function(warn) {
    if(status_bar.hasClass(css_prefix + 'manual')) return;
    clearBar();
    status_bar.addClass(css_prefix + 'warn').addClass(css_prefix + 'manual');
    status_bar.html(warn);
  }
  var setError = function(err) {
    clearBar();
    status_bar.addClass(css_prefix + 'error');
    status_bar.html(err);
  }

  var parseLogicResult = function(result) {
    result = result.trim();
    if(result == 'false') return false;
    if(result == 'true') return true;
    if(result == '\\false') return false;
    if(result == '\\true') return true;
    if(result.match(/^[0-9\.]+$/)) 
      return ((result * 1) != 0);
    return false;
  }
    
  $(window).on('resize', function() {
    window.resizeResults();
    if(SwiftCalcs.current_toolbar) SwiftCalcs.current_toolbar.reshapeToolbar();
    if(SwiftCalcs.active_worksheet) SwiftCalcs.active_worksheet.setWidth();
  });


  RIGHTS = { NO_RIGHTS: 0, READ_ONLY: 1, READ_ONLY_WITH_DUPLICATION: 2, EDIT_RIGHTS: 3,  ADMIN_RIGHTS: 4 };
