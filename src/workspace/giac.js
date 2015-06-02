
/* object that deals with evaluations, and setting the evaluation queue */
var GiacHandler = P(function(_) {
	_.giac_ready = false;
	_.errors_encountered = false;
	// Evaluation handling functions.  Each array element keeps track of which first Gen element, by id, is currently being evaluated.  Set to false to stop evaluation or when complete
	_.init = function() {
		this.evaluations = [];
	  this.evaluation_full = [];
	}
	_.registerEvaluation = function(full) {
		this.evaluations.push(true);
		this.evaluation_full.push(full);
		this.errors_encountered = false;
		return (this.evaluations.length-1);
	}
	_.setEvaluationElement = function(eval_id, el) {
		if(this.evaluations[eval_id] === false) return this;
		this.evaluations[eval_id] = el.firstGenAncestor().id;
		if(!this.giac_ready) return this; // Don't update status bar until computation is complete!
		startProgress();
		if(this.evaluation_full[eval_id]) {
			var total = el.workspace.insertJQ.children('.' + css_prefix + 'element').length;
			var me = 0;
			for(var ell = el[L]; ell instanceof Element; ell = ell[L])
				me++;
			setProgress(me/total);
		} 
		return this;
	}
	_.shouldEvaluate = function(eval_id) {
		if(this.errors_encountered) return false;
		return (this.evaluations[eval_id] !== false);
	}
	_.cancelEvaluation = function(eval_id) {
		this.evaluations[eval_id]=false;
		return this;
	}
	_.cancelEvaluations = function() {
		var to_cancel = this.current_evaluations();
		for(var i = 0; i < to_cancel.length; i++)
			this.cancelEvaluation(to_cancel[i]); 
		return this;
	}
	_.evaluationComplete = function(eval_id) {
		this.evaluations[eval_id] = false;
		if(this.errors_encountered)
			setError('Error encountered during computation.  Please correct to continue computation.'); // BRENTAN: Add link to line number?
		else
			setComplete();
		// UPDATE VARIABLE LIST??
		return this;
	}
	_.current_evaluations = function() {
		var output = [];
		for(var i=0; i < this.evaluations.length; i++) {
			if(this.evaluations[i]) output.push(i);
		}
		return output;
	}

	/* 
	Send to GIAC
	- first option is the evaluation id
	- second is a pass-through boolean that keeps track of whether we move to the next element after the evaluation
	- third option is an array of strings, each of which is executed in turn.  
	  The response sent back from giac is an array of responses, with each element 
	  in the response associated with the same element in the request
	- fourth option is the element being evaluated
	- fifth is the name of the function in el to call (string)
	*/
	_.execute = function(eval_id, move_to_next, commands, el, callback) {
		if(this.evaluations[eval_id] === true) {
			var previous_el = el.previousScope();
			var previous_scope = (previous_el instanceof Element) ? (previous_el.workspace.id + '_' + previous_el.id) : false;
			var restart = true;
		} else {
			var previous_scope = false;
			var restart = false;
		}
		var next_scope = el.workspace.id + '_' + el.id;
		this.sendCommand(el, {eval_id: eval_id, restart: restart, scoped: el.scoped, move_to_next: move_to_next, commands: commands, previous_scope: previous_scope, next_scope: next_scope, callback_id: el.id, callback_function: callback});
	}
	_.sendCommand = function(el, hash) {
		if(this.evaluations[hash.eval_id] === false) return;
		this.setEvaluationElement(hash.eval_id, el);
		if(this.giac_ready) {
			this.worker.postMessage(JSON.stringify(hash));
		}
		else 
			window.setTimeout(function(_this) { return function() { _this.sendCommand(el, hash); }; }(this), 250);
	}
});

// Initialize the giac object
var giac = GiacHandler();

/*
This file handles communications with giac, which lives in a webworker
*/
(function(giacHandler) {

	startProgress('Loading Computational Library');
	setProgress(0);

  var giac = giacHandler.worker = new Worker("giac_worker.js");
  giac.addEventListener("message", function (evt) {
    handleResponse(JSON.parse(evt.data));
  },false);

  var handleResponse = function(response) {
    var text = response.value
    switch(response.command) {
    	case 'results':
    		Element.byId[response.callback_id].evaluationCallback(response.eval_id, response.callback_function, response.move_to_next, response.results);
    		break;
      case 'print': 
      	console.log('giac output: ' + text);
        break;
      case 'printErr': 
      	setError(text);
        break;
      case 'updateProgress':
      	setProgress(text * 1);
      	break;
      case 'setError':
      	setError(text);
      	break;
      case 'setUpdateTimeout':
      	setUpdateTimeout(response.start_val * 1, response.end_val * 1, text * 1);
      	break;
      case 'setStatus':
        if(text === '') {
        	giacHandler.giac_ready = true;
        	setComplete();
        	return;
        }
        changeMessage('Loading Computational Library: ' + text);
        break;
    }
  }


}(giac));