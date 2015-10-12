$(function() {
	$('body').on('click', 'a.create_new_post', function(e) {
		var close_afterwards = $(this).hasClass('close_popup_afterwards');
		var el = $(this).closest('.new_post');
		var data = {}
		data.post = el.find('textarea').val();
		if(data.post.trim() == '')
			return showNotice('Please provide content to post', 'red');
		if(el.attr('data-thread')) data.thread = el.attr('data-thread')
		if(el.attr('data-topic')) data.topic = el.attr('data-topic')
		if(el.find('input.thread_name').length) {
			data.thread_name = el.find('input.thread_name').val();
			if(data.thread_name.trim() == '')
				return showNotice('Please provide a subject', 'red');
		}
		if(el.find('div.topic').length) {
			data.topic = el.find('div.topic select').val();
			if((data.topic == '0') || (data.topic == null))
				return showNotice('Please select a topic', 'red');
		}
		data.url = window.location.href;
		$(this).after('<i class="fa fa-spinner fa-pulse"></i>');
		$(this).hide();
		$.ajax({
      type: "POST",
      url: "/forums/create_post",
      dataType: 'json',
      cache: false,
      data: data, 
      success: function(response) {
      	if(response.success) {
      		el.find('a.create_new_post').show();
      		el.find('.fa-spinner').remove();
      		el.find('textarea').val('');
      		el.find('input').val('');
      		el.find('select').val('');
      		if(response.post_html && $('.popup_dialog').find('table').length) 
      			$('.popup_dialog').find('table').append(response.post_html);
      		else if(response.thread_html && $('.popup_dialog').find('.list.topic').length) 
      			$('.popup_dialog').find('.list.topic').append(response.thread_html);
      		showNotice('Your post has been created and has been sent to the Swift Calcs Admins', 'green');
      		if(close_afterwards)
      			window.hidePopupOnTop();
      	}	else {
      		showNotice(response.message, 'red');
      		el.find('a.create_new_post').show();
      		el.find('.fa-spinner').remove();
      	}
      },
      error: function(err) {
      	console.log('Error: ' + err.responseText, 'red');
				showNotice('Error: There was a server error.  We have been notified', 'red');
    		el.find('a.create_new_post').show();
    		el.find('.fa-spinner').remove();
      }
    });
		e.preventDefault();
		return false;
	});
	$("body").on('click', ".feedback_link", function(e) {
		window.loadToPopup('/forums',{});
		e.preventDefault();
		return false;
	});
	$('body').on('click', '.forums_link', function(e) {
		window.loadToPopup('/forums',{});
		e.preventDefault();
		return false;
	});
	$('body').on('click', '.topic_link', function(e) {
		window.loadToPopup('/forums/topic',{ id: $(this).attr('data-id') });
		e.preventDefault();
		return false;
	});
	$('body').on('click', '.thread_link', function(e) {
		window.loadToPopup('/forums/thread',{ id: $(this).attr('data-id') });
		e.preventDefault();
		return false;
	});
	$('body').on('click', 'a.edit_name', function(e) {
		var el = $(this);
		var h1 = el.prev('h1');
		h1.hide();
		el.hide();
		var div = $('<div/>').html('<table><tbody><tr><td><input type="text"></td><td><a class="button" style="display:inline-block;">Submit</a></tr></tr></tbody></table>').insertAfter(el);
		div.find('input').val(h1.html());
		div.find('a.button').click(function(e) {
			var name = div.find('input').val();
			if(name.trim() == '')
				return showNotice('Name cannot be blank', 'red');
			h1.html(name);
			var data = { id: h1.attr('data-thread'), name: name }
			h1.show();
			el.show();
			div.remove();
			$.ajax({
	      type: "POST",
	      url: "/forums/edit_thread",
	      dataType: 'json',
	      cache: false,
	      data: data, 
	      success: function(response) {
	      	if(!response.success) {
	      		showNotice(response.message, 'red');
	      	}
	      },
	      error: function(err) {
	      	console.log('Error: ' + err.responseText, 'red');
					showNotice('Error: There was a server error.  We have been notified', 'red');
	      }
	    });
			e.preventDefault();
			return false;
		});
		e.preventDefault();
		return false;
	});
	$('body').on('click', 'a.edit_post', function(e) {
		var el = $(this);
		var td = el.closest('td');
		var span = td.find('pre.content');
		span.hide();
		el.hide();
		var div = $('<div/>').html('<textarea style="width:70%;min-height:100px;"></textarea><BR><a class="button" style="display:inline-block;">Submit</a>').insertAfter(el);
		div.find('textarea').val(span.html());
		div.find('a.button').click(function(e) {
			var content = div.find('textarea').val();
			if(content.trim() == '')
				return showNotice('Content cannot be blank', 'red');
			span.html(content);
			if(td.attr('data-thread')) {
				var data = { id: td.attr('data-thread'), content: content }
				var url = 'edit_thread';
			} else {
				var data = { id: td.attr('data-post'), content: content }
				var url = 'edit_post';
			}
			span.show();
			el.show();
			div.remove();
			window.silentRequest("/forums/" + url, data);
			e.preventDefault();
			return false;
		});
		e.preventDefault();
		return false;
	});
	$('body').on('click', 'a.remove_thread', function(e) {
		if(confirm('Are you sure?  This will delete the entire thread and cannot be undone')) {
			window.silentRequest("/forums/remove_thread", {id: $(this).attr('data-thread') } );
			window.loadToPopup('/forums',{});
			showNotice('Thread Removed');
		}
		e.preventDefault();
		return false;
	});
	$('body').on('click', 'a.remove_post', function(e) {
		if(confirm('Are you sure?  This action cannot be undone')) {
			window.silentRequest("/forums/remove_post", {id: $(this).attr('data-post') } );
			$(this).closest('tr').remove();
		}
		e.preventDefault();
		return false;
	});
	$('body').on('click', 'a.subscribe_toggle', function(e) {
		var subscribe = $(this).html() == 'Subscribe';
		$('a.subscribe_toggle').html(subscribe ? 'Unsubscribe' : 'Subscribe');
		window.silentRequest("/forums/subscribe_toggle", {id: $(this).attr('data-id'), subscribe: subscribe } );
		e.preventDefault();
		return false;
	});
});