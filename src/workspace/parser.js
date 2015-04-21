/*
 Simple parser method.  

 parse(text)
 It takes a string and parses it based on groupings of curly braces {}
 It walks through the string in a way that ensures the start/end of each item is based on the
 matching { and }, allowing for nesting.  The output is a list of elements, in order, based on the 
 provided text, that can each then be inserted in turn into the workspace.

 The input string is assumed to be in SwiftCalcs format.  This is simply text with inline commands
 that are set apart using curly brackets (in this way, any text copy/pasted from anywhere can safely
 be passed through this parser.  It will all be recognized as text and dumped into a text element). 
 Command structure is:
 {Element}{Arguments}
 For elements with no arguments, the argument list should be blank:
 {Element}{}
 For elements with multiple arguments, they should be in their own curly braces within the argument braces:
 {Element}{{Argumen1}{Argument2}}

 When the parser identifies an Element, is initializes it, then calls its 'parse' method with the list of
 arguments as an input (an array of arguments)
 */

var parse = function(text) {
  var regex = /([\{\}])/;
  var result = [];
  //replace newlines after elements (these are added by select method when pushing to the textarea)
  text = text.replace(/\}\n/g,'}');

  var splitArguments = function(text) {
    if(text.trim() == '') return [];
    if(text[0] !== '{') return [text];
    var output = [];
    var tokens = text.split(regex);
    var depth = 0;
    var current_phrase = '';
    jQuery.each(tokens, function(i, token) {
      if(!token) return;
      if(token === "{") {
        depth++;
        if(depth < 2) return;
      } else if(token === "}") {
        depth--;
        if(depth == 0) {
          output.push(current_phrase);
          current_phrase = '';
          return;
        }
      }
      current_phrase += token;
    });
    return output;
  }
  var splitIntoTextBlocks = function(text) {
    var split_arr = text.split(/\n/);
    jQuery.each(split_arr, function(i, v) {
      if((i == (split_arr.length-1)) && (v.trim() == '')) return;
      result.push(math(v)); //BRENTAN- Change to 'text' type!
    });
  }
  // First test for a valid string (equal number of start/stop curly braces).  If
  // the string isn't balanced, assume its all text and throw it to the Text element
  if((text.match(/\{/g) || []).length !== (text.match(/\}/g) || []).length) {
    splitIntoTextBlocks(text);
    return result;
  }

  //Split the string into tokens based on { and }.  Then start walking through and rejoining based on depth.
  var depth = 0;
  var tokens = text.split(regex);
  var current_phrase = '';
  var possible_command = '';
  var argument_list = '';
  var building_argument_list = false;
  jQuery.each(tokens, function(i, token) {
    if(!token) return;
    if(token === "{") {
      depth++;
      if(depth == 1) return;
    } else if(token === "}") {
      depth--;
      if(depth == 0) {
        if(building_argument_list) {
          //Just finished creating the argument list.  
          result.push(elements[possible_command]().parse(splitArguments(argument_list)));
          possible_command = '';
          argument_list = '';
          building_argument_list = false;
        } else {
          //Just finished typing a command...is it valid?
          if(elements[possible_command]) {
            splitIntoTextBlocks(current_phrase);
            current_phrase = '';
            building_argument_list = true;
          }
          else {
            current_phrase += '{' + possible_command + '}';
            possible_command = '';
          }
        }
        return;
      }
    }
    if(depth == 0) current_phrase += token;
    else if(building_argument_list) argument_list += token;
    else possible_command += token;
  });
  return result;
};