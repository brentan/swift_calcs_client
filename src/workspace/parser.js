/*
 Simple parser method.  

 parse(to_paste)
 It takes a string and parses it based on groupings of curly braces {}
 It walks through the string in a way that ensures the start/end of each item is based on the
 matching { and }, allowing for nesting.  The output is a list of elements, in order, based on the 
 provided to_paste, that can each then be inserted in turn into the workspace.

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

var parse = function(to_paste) {
  var regex = /([\{\}])/;
  var result = [];
  //replace newlines after elements (these are added by select method when pushing to the textarea)
  to_paste = to_paste.replace(/\}\n/g,'}');

  var splitArguments = function(to_paste) {
    if(to_paste.trim() == '') return [];
    if(to_paste[0] !== '{') return [to_paste];
    var output = [];
    var tokens = to_paste.split(regex);
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
  var splitIntoTextBlocks = function(text_block) {
    if(text_block.length === 0) return;
    text_block = text_block.replace(/\n/g,'<BR>');
    if(text_block.slice(-4) == '<BR>') text_block = text_block.slice(0, -4);
    text_block = sanitize(text_block);
    for(var i = 0; i < text_block.length; i++)
      result.push(text_block[i]);
  }
  // First test for a valid string (equal number of start/stop curly braces).  If
  // the string isn't balanced, assume its all to_paste and throw it to the to_paste element
  if((to_paste.match(/\{/g) || []).length !== (to_paste.match(/\}/g) || []).length) {
    splitIntoTextBlocks(to_paste);
    return result;
  }

  //Split the string into tokens based on { and }.  Then start walking through and rejoining based on depth.
  var depth = 0;
  var tokens = to_paste.split(regex);
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
  splitIntoTextBlocks(current_phrase);
  return result;
};