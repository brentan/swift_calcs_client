
var sendMessage = function(command, valu) {
  var data = command + "=" + valu;
  window.parent.postMessage(data, '*');
}
var handshake_complete = false;
// Create the listener for postMessage between us and the parent
var receiveMessage = function(event) {
  var command = event.data.split("=");
  switch(command[0]) {
    case 'handshake':
      if(command[1] == window.sc_client_version) handshake_complete = true;
      break;
  }
}
var setHeight = window.embedSetHeight = function() {
  if(!handshake_complete) return;
  var total_height = $(".worksheet_holder_outer_box").height() + 129;
  sendMessage("setHeight", total_height);
}

$(function() { 
  if(window.sc_client_version != '0') {
    // Set listener
    window.addEventListener("message", receiveMessage, false);
    // Try handshake
    sendMessage("handshake", window.sc_client_version);
  }
  new ResizeSensor($(".worksheet_holder_outer_box"), function() {
    setHeight();
  });
});