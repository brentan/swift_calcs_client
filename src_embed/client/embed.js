/************************************************************************************
 Function is run to embed a Swift Calcs iframe into a document.
 Variables/options are:
 dev - boolean, true if we are in the dev environment
 hash_string - server hash of the worksheet or project to open in the iframe window
 worksheet - boolean, true if hash corresponds to a worksheet, false otherwise
 height - in pixels, or '0' for auto-height to match content
 autosave - boolean, true if changes made in embed window should be saved to server (assuming viewer has rights)
 interaction - 0 means no interaction, 1 is only form elements (sliders), 2 allows full interaction 
 sc_embed_version - The version number (1_00 format) of this library
*************************************************************************************/

var el = document.getElementById("SwiftCalcs_" + (worksheet ? 'w' : 'p') + "_" + hash_string);
var handshake_complete = false;

// Test for no element...shouldn't happen if using copy/paste from our embed page
if(el == null) {
  alert('Unable to insert Swift Calcs document: The insert location div was not found on this page.');
  return;
}

// Create the iframe id for listening so that we only interact with messages sent to 'me'
if(typeof window.SC_embed_id_counter === 'undefined') window.SC_embed_id_counter=0;
var iframe_id = window.SC_embed_id_counter++;

// We have the element, create iframe
var iframe = document.createElement('iframe');
iframe.setAttribute("src", (dev ? "http://dev.swiftcalcs.com:3000" : "https://www.swiftcalcs.com") + "/embed/" + (worksheet ? "w" : "p") + "/" + hash_string + "?" + params + "&sc_embed_version=" + sc_embed_version + "&iframe_id=" + iframe_id);
iframe.style.border = "none";
iframe.style.height = (height > 0 ? (height + "px") : "600px");
iframe.style.width = '100%';
iframe.style.backgroundColor = 'transparent';
iframe.frameBorder = '0';
iframe.setAttribute("frameBorder",'0');
iframe.scrolling = 'no';
iframe.setAttribute("scrolling",'no');
iframe.allowTransparency="true"
iframe.setAttribute("allowTransparency",'true');

// Create the listener for postMessage between us and the frame
var receiveMessage = function(event) {
  // Origin check
  if(event.origin !== (dev ? "http://dev.swiftcalcs.com:3000" : "https://www.swiftcalcs.com")) return;
  var command = event.data.split("=");
  if((command[0] != 'SCembed') || (command[1] != iframe_id)) return;
  switch(command[2]) {
    case 'handshake':
      if(command[3] == sc_embed_version) {
        sendMessage("handshake", sc_embed_version);
        sendMessage("src_url", window.location.href);
        handshake_complete = true;
      }
      break;
    case 'setHeight':
      if((height == 0) || (command[3]*1 < height)) iframe.style.height = command[3] + 'px';
  }
}
window.addEventListener("message", receiveMessage, false);

// Function to send messages to the iframe
var sendMessage = function(command, valu) {
  var data = "SCembed=" + iframe_id + "=" + command + "=" + valu;
  iframe.contentWindow.postMessage(data, dev ? "http://dev.swiftcalcs.com:3000" : "https://www.swiftcalcs.com");
}

var resetServerTextareaLocation = function() {
  // We have to send the server the scroll position and the iframe position so it can move its internal textarea div, otherwise the page
  // will jump around during focus events as it could be off-screen
  var iframe_position = iframe.getBoundingClientRect().top;
  sendMessage("setTextareaLocation",-1 * iframe_position)
}
window.addEventListener("scroll", resetServerTextareaLocation);

// Inject iframe into DOM
el.innerHTML = '';
el.appendChild(iframe);

