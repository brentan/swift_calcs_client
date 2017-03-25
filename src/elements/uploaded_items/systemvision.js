/*
 Video's aren't really an uploaded item...we just turn youtube/vimeo links into embeds
 */

var systemvision = P(Element, function(_, super_) {
  _.helpText = "<<systemvision>>\nEmbed a SystemVision file.  Enter the node id (click 'embed' in SystemVision and in the embed code, look for the 'systemvision.com/node/NODE_ID' url, where NODE_ID is a number you enter here.";
  _.klass = ['import_video'];

  _.innerHtml = function() {
    return '<div class="' + css_prefix + 'top ' + css_prefix + 'focusableItems" data-id="0">' + focusableHTML('CodeBlock', 'SystemVision') + '&nbsp;node:&nbsp;' 
      + focusableHTML('CommandBlock', 'video_url') + '&nbsp;' + helpBlock() + '<BR>'  + answerSpan() + '</div>';
  }
  _.postInsertHandler = function() {
    super_.postInsertHandler.call(this);
    var _this = this;
    this.codeBlock = registerFocusable(CodeBlock,this, 'SystemVision', { });
    this.block = registerFocusable(CommandBlock, this, 'video_url', { editable: true, border: true, handlers: {blur: function(el) { _this.processUrl(el.toString()); } } });
    this.focusableItems = [[this.codeBlock,this.block]];
    this.leftJQ.append('<span class="fa fa-upload"></span>');
    return this;
  }
  _.processUrl = function(text) {
    if(text.trim() == '') return this.outputBox.clearState().collapse();
    var pattern = /^[0-9]+$/;
    if(pattern.test(text)) {
      var id = text;
    } else {
      // No matching provider
      this.outputBox.expand();
      this.outputBox.setError("Invalid Node ID.  Please copy in the node id (click 'embed' in SystemVision and in the embed code, look for the 'systemvision.com/node/NODE_ID' url, where NODE_ID is a number you enter here.");
      return;
    }
    // Success: Delete this block and replace with the video
    var stream = !this.worksheet.trackingStream;
    if(stream) this.worksheet.startUndoStream();
    systemvisionBlock().insertAfter(this).setDocument(id).show();
    this.remove();
    if(stream) this.worksheet.endUndoStream();
    this.worksheet.save();
  }
  _.toString = function() {
    return '{systemvision}{{' + this.argumentList().join('}{') + '}}';
  }
});

var systemvisionBlock = P(Element, function(_, super_) {
  _.klass = ['systemvision'];
  _.savedProperties = ['document_id'];
  _.document_id = false;

  _.innerHtml = function() {
    return '<div class="' + css_prefix + 'top ' + css_prefix + 'focusableItems" data-id="0"><table style="width:100%;"><tbody><tr><td>' + focusableHTML('CodeBlock', '') + '</td><td class="' + css_prefix + 'insert"></td></tr></tbody></table></div>'
  }
  _.postInsertHandler = function() {
    super_.postInsertHandler.call(this);
    this.codeBlock = registerFocusable(CodeBlock, this, '', { });
    this.focusableItems = [[this.codeBlock]];
    return this;
  }
  _.empty = function() {
    return false;
  }
  _.setDocument = function(document_id) {
    this.document_id = document_id;
    var html = '<iframe allowfullscreen="true" frameborder="0" width="100%" height="500" scrolling="no" src="https://systemvision.com/node/' + this.document_id + '" title="SystemVision Cloud"></iframe>';
    this.insertJQ.html('');
    this.insertJQ.append(html);
    return this;
  }
  _.toString = function() {
    return '{systemvisionBlock}{{' + this.argumentList().join('}{') + '}}';
  }
  _.parseSavedProperties = function(args) {
    super_.parseSavedProperties.call(this, args);
    this.setDocument(this.document_id);
    return this;
  }
  _.mouseClick = function() {
    this.codeBlock.focus(L);
    return false;
  }
});