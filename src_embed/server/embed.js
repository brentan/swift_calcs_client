
var sendMessage = function(command, valu) {
  var data = "SCembed=" + window.iframe_id + "=" + command + "=" + valu;
  window.parent.postMessage(data, '*');
}
var handshake_complete = false;
// Create the listener for postMessage between us and the parent
var receiveMessage = function(event) {
  var command = event.data.split("=");
  if((command[0] != 'SCembed') || (command[1] != window.iframe_id)) return;
  switch(command[2]) {
    case 'handshake':
      if(command[3] == window.sc_client_version) handshake_complete = true;
      break;
    case 'src_url':
      var track_visit = function() {
        if(ahoy && window.data_hash.length) ahoy.track("Embedded iFrame", {src: command[3], element_type: window.data_type, element_hash: window.data_hash});
        else window.setTimeout(track_visit, 250);
      }
      track_visit();
      break;
    case 'setTextareaLocation':
      var location = command[3]*1;
      var location = Math.max(Math.min(location, $(".worksheet_holder_outer_box").height()-100),0);
      $('.sc_textarea').css('top', location + 'px');
      break;
  }
}
var setHeight = window.embedSetHeight = function() {
  if(!handshake_complete) return;
  var extra_height = 128;
  if(window.add_extra_height) extra_height += 36;
  var total_height = $(".worksheet_holder_outer_box").height() + extra_height;
  sendMessage("setHeight", total_height);
}

$(function() { 
  if(window.sc_client_version != '0') {
    // Set listener
    window.addEventListener("message", receiveMessage, false);
    // Try handshake
    sendMessage("handshake", window.sc_client_version);
  }
  var firstHeight = function() { 
    if(handshake_complete) setHeight();
    else window.setTimeout(firstHeight, 250);
  }
  firstHeight();
  new ResizeSensor($(".worksheet_holder_outer_box"), function() {
    setHeight();
  });
});