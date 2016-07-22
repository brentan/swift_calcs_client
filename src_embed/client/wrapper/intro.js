(function() {
  var sc_embed_version = '1_00';
  if (!Object.keys) {
    Object.keys = (function() {
      'use strict';
      var hasOwnProperty = Object.prototype.hasOwnProperty,
          hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
          dontEnums = [
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
          ],
          dontEnumsLength = dontEnums.length;

      return function(obj) {
        if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
          throw new TypeError('Object.keys called on non-object');
        }

        var result = [], prop, i;

        for (prop in obj) {
          if (hasOwnProperty.call(obj, prop)) {
            result.push(prop);
          }
        }

        if (hasDontEnumBug) {
          for (i = 0; i < dontEnumsLength; i++) {
            if (hasOwnProperty.call(obj, dontEnums[i])) {
              result.push(dontEnums[i]);
            }
          }
        }
        return result;
      };
    }());
  }
  window.SwiftCalcs_Embed_Iframe_1_00 = function(options) {
    var height = options.height;
    var interaction = options.interaction;
    var autosave = options.autosave;
    var worksheet = options.worksheet;
    var hash_string = options.hash_string;
    var dev = options.dev;
    var params = "height=" + height;

    var keys = Object.keys(options);
    for(var i = 0; i < keys.length; i++) {
      if(!keys[i].match(/^(height|hash_string|dev|worksheet)$/i)) {
        if(options[keys[i]] === true)
          params += "&" + keys[i] + "=1";
        else if(options[keys[i]] === false)
          params += "&" + keys[i] + "=0";
        else
          params += "&" + keys[i] + "=" + options[keys[i]];
      }
    }
