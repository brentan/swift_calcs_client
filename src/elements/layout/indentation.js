/*
  Basically an empty block with kids.  Shoves everything over one tab.  Created with 'tab' and unset with 'shift-tab'
*/

var indent = P(Element, function(_, super_) {
  _.klass = ['indent'];
  _.evaluatable = true;
  _.hasChildren = true;

  _.innerHtml = function() {
    return '<div class="' + css_prefix + 'insert"></div>';
  }
  _.postInsertHandler = function() {
    this.focusableItems = [[-1]];
    super_.postInsertHandler.call(this);
    return this;
  }
  _.toString = function() {
    return '{indent}{{' + this.argumentList().join('}{') + '}}';
  }
});

Worksheet.open(function(_) {
  _.indent = function(blocks) {
    if(!(blocks instanceof Array)) blocks = [blocks];
    // Check whether we indent this alone, or merge with a prior/later indentation
    var stream = this.trackingStream;
    if(!stream) this.startUndoStream();
    if(blocks[0][L] instanceof indent) {
      // merge into the block above!
      var target = blocks[0][L];
      for(var i = 0; i < blocks.length; i++) 
        blocks[i].move(target, R, true, true);
      // Test if we also have an indent behind me....if so, we need to merge these two guys
      if(target[R] instanceof indent) {
        var kids = target[R].children();
        for(var i = 0; i < kids.length; i++) 
          kids[i].move(target, R, true, true);
        target[R].remove(0,true);
      }
    } else if(blocks[blocks.length-1][R] instanceof indent) {
      // merge into indent below!
      var target = blocks[blocks.length-1][R]; 
      for(var i = (blocks.length-1); i >=0; i--) 
        blocks[i].move(target, L, true, true);
    } else {
      // not next to another indent block, so wrap me
      var target = new indent();
      if(blocks[0].parent.validateChild && !blocks[0].parent.validateChild(target))
        return showNotice('Children of plots, mixtures, and other objects cannot be indented.', 'red');
      target.insertNextTo(blocks[0],L,true).show();
      for(var i = 0; i < blocks.length; i++) 
        blocks[i].move(target, R, true, true);
      // Remove implicit math block that was created
      target.ends[L].hide(0).remove(0,true);
    }
    if(!stream) this.endUndoStream();
  }

  _.outdent = function(blocks_in) {
    if(!(blocks_in instanceof Array)) var blocks = [blocks_in];
    else var blocks = blocks_in.slice(0);
    // Check whether we indent this alone, or merge with a prior/later indentation
    var stream = this.trackingStream;
    if(!stream) this.startUndoStream();
    // Check if we are in a parent that is indent
    if(blocks[0].parent instanceof indent) {
      // Are we leaving anybody here?
      var full_outdent = true;
      if(blocks[0][L]) {
        full_outdent = false;
        // need to gather all prior blocks and push to a new indent
        var prior_blocks = [];
        for(var block = blocks[0][L]; block != 0; block = block[L])
          prior_blocks.push(block);
        this.indent(prior_blocks.reverse());
        blocks.unshift(blocks[0][L]); //Now refers to the new indent we just created
      }
      if(blocks[blocks.length-1][R]) {
        full_outdent = false;
        // need to gather all prior blocks and push to a new indent
        var prior_blocks = [];
        for(var block = blocks[blocks.length-1][R]; block != 0; block = block[R])
          prior_blocks.push(block);
        this.indent(prior_blocks);
        blocks.push(blocks[blocks.length-1][R]); //Now refers to the new indent we just created
      }
      if(full_outdent) {
        var target = blocks[0].parent;
        for(var i = 0; i < blocks.length; i++) 
          blocks[i].move(target, L, false, true);
        //target.remove(); -> Not needed, taken care of by the move action directly.
      } else 
        this.outdent(blocks); // Recurse with all blocks and try again!
      if(!stream) this.endUndoStream();
      return blocks_in;
    } else {
      //Not in a parent indent.  Go through all blocks and if any are indents, outdent them
      var new_select = [];
      for(var i = 0; i < blocks.length; i++) {
        if(blocks[i] instanceof indent) {
          var kids = blocks[i].children();
          this.outdent(kids);
          for(var j = 0; j < kids.length; j++)
            new_select.push(kids[j]);
        } else
          new_select.push(blocks[i]);
      }
      if(!stream) this.endUndoStream();
      return new_select;
    }
  }
});
