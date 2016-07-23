
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