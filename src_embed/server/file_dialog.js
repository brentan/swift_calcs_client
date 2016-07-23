var param_string = "?height=" + window.autoheight + "&sc_embed_version=" + window.sc_client_version + "&interaction=" + window.interaction_level + "&iframe_id=" + window.iframe_id + "&allow_save=" + (window.allow_save ? '1' : '0') + "&parent_base=" + window.parent_base;
$('div.embed_item2').on('click', function(e) { 
  var _this = $(this);
  if(_this.attr('data-type') == 'project')
    var target_url = "/embed/p/";
  else
    var target_url = "/embed/w/";
  target_url += _this.attr('data-hash') + param_string;
  window.location.href = target_url;
  e.preventDefault();
});  
$('body').on('click', 'div.embed_item', function(e) { 
  var _this = $(this);
  window.closeActive($('.active_worksheet'));
  $('div.embed_container > .embed_item').remove();
  if(_this.attr('data-type') == 'project') {
    window.add_extra_height = false;
    $('div.embed_container > div.embed').removeClass('return_bar');
    $('.help_msg_span').show();
    $('div.header .file_logo').removeClass('fa-folder-open').removeClass('fa-file').addClass('fa-folder-open');
    $(".worksheet_holder").html('<div style="padding: 40px;text-align:center;font-size:25px;">Loading...</div>');
    var success = function(response) {
      window.current_folder_hash = response.hash_string;
      window.current_folder_name = response.name;
      $('div.header .fa-external-link').attr('data-type','projects').attr('data-hash',response.hash_string);
      $('div.header .name').html(response.name);
      $(".worksheet_holder").html(response.data);
    }
    var fail = function(response) {
      if(window.embedded) 
        $(".worksheet_holder").html("<div class='message'><h2>There was an error encountered</h2><p>" + response + "</p><p>If you are not logged in, try visiting <a href='/' target='_blank'>swiftcalcs.com</a> and logging in to resolve this problem.</p></div>");
      return;
    }
    window.ajaxRequest("/embed/p", { hash_string: _this.attr('data-hash'), parent_base: window.parent_base }, success, fail);
  } else {
    // Need to create 'back up' box to go, well, back up!
    $('.help_msg_span').hide();
    $('div.embed_container > div.embed').addClass('return_bar');
    $('div.header .file_logo').removeClass('fa-folder-open').removeClass('fa-file').addClass('fa-file');
    $('<div/>').addClass('embed_item').attr('data-type','project').attr('data-hash',window.current_folder_hash).html("<i class='fa fa-long-arrow-left'></i>Back to " + window.current_folder_name).appendTo('div.embed_container');
    window.add_extra_height = true;
    $(".worksheet_holder").html('');
    var box = $('<div/>').addClass('worksheet_holder_box').addClass('single_sheet').appendTo($('.worksheet_holder'));
    var el = $('<div/>').addClass('worksheet_item').attr('data-hash', _this.attr('data-hash')).attr('data-name','').appendTo(box);
    window.openActive(el);
    window.loadWorksheet(el);
  }
  e.preventDefault();
});