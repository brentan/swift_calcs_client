/************************************************************************************
 Function is run to embed a Swift Calcs iframe into a document.
 Variables/options are:
 dev - boolean, true if we are in the dev environment
 hash_string - server hash of the worksheet or project to open in the iframe window
 worksheet - boolean, true if hash corresponds to a worksheet, false otherwise
 height - in pixels, or '0' for auto-height to match content
 autosave - boolean, true if changes made in embed window should be saved to server (assuming viewer has rights)
 interaction - 0 means no interaction, 2 allows full interaction (leaving as int for future possibilities of partial interaction, for example)
 sc_embed_version - The version number (1_00 format) of this library
*************************************************************************************/

var el = document.getElementById("SwiftCalcs_" + (worksheet ? 'w' : 'p') + "_" + hash_string);
var handshake_complete = false;

// Test for no element...shouldn't happen if using copy/paste from our embed page
if(el == null) {
  alert('Unable to insert Swift Calcs document: The insert location div was not found on this page.');
  return;
}

// We have the element, create iframe
var iframe = document.createElement('iframe');
iframe.setAttribute("src", (dev ? "http://dev.swiftcalcs.com:3000" : "https://www.swiftcalcs.com") + "/embed/" + (worksheet ? "w" : "p") + "/" + hash_string + "?" + params + "&sc_embed_version=" + sc_embed_version);
iframe.style.border = "none";
iframe.style.height = (height > 0 ? (height + "px") : "600px");
iframe.style.width = '100%';
iframe.frameBorder = '0';
iframe.setAttribute("frameBorder",'0');
iframe.scrolling = 'no';
iframe.setAttribute("scrolling",'no');

// Create the listener for postMessage between us and the frame
var receiveMessage = function(event) {
  // Origin check
  if(event.origin !== (dev ? "http://dev.swiftcalcs.com:3000" : "https://www.swiftcalcs.com")) return;
  var command = event.data.split("=");
  switch(command[0]) {
    case 'handshake':
      if(command[1] == sc_embed_version) {
        sendMessage("handshake", sc_embed_version);
        handshake_complete = true;
      }
      break;
    case 'setHeight':
      if((height == 0) || (command[1]*1 < height)) iframe.style.height = command[1] + 'px';
  }
}
window.addEventListener("message", receiveMessage, false);

// Function to send messages to the iframe
var sendMessage = function(command, valu) {
  var data = command + "=" + valu;
  iframe.contentWindow.postMessage(data, dev ? "http://dev.swiftcalcs.com:3000" : "https://www.swiftcalcs.com");
}

// Inject iframe into DOM
el.innerHTML = '';
el.appendChild(iframe);

