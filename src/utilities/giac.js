
/* object that deals with evaluations, and setting the evaluation queue */
var GiacHandler = P(function(_) {
	_.auto_evaluation = true;
	// Evaluation handling functions.  Each array element keeps track of which first Gen element, by id, is currently being evaluated.  Set to false to stop evaluation or when complete
	_.init = function() {
		this.evaluations = [];
	  this.evaluation_full = [];
	  this.manual_evaluation = [];
	  this.variable_list = [];
	  this.object_list = [];
		this.giac_ready = false;
		this.aborting = false;
		this.errors_encountered = false;
		this.varCallbackCounter = 0;
	}
	_.registerEvaluation = function(full) {
		this.evaluations.push(true);
		this.manual_evaluation.push(!full); //We allow single line evaluations, even in manual mode
		this.evaluation_full.push(full);
		this.errors_encountered = false;
		return (this.evaluations.length-1);
	}
	_.setEvaluationElement = function(eval_id, el) {
		if(this.evaluations[eval_id] === false) return this;
		this.evaluations[eval_id] = el.firstGenAncestor().id;
		if(!this.giac_ready) return this; // Don't update status bar until computation is complete!
		startProgress();
		if(this.evaluation_full[eval_id] && (el.depth == 0)) {
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
	_.manualEvaluation = function() {
		var to_do = this.current_evaluations();
		for(var i = 0; i < to_do.length; i++)
			this.manual_evaluation[to_do[i]] = true; 
	}
	_.kill = function() {
		// Will totally destroy the webworker and then give a link to restart it
		this.worker.terminate();
		this.worker = false;
		this.init();
		setError('Math Engine Terminated.  All calculations are frozen.  <a href="#">Restart Math Engine and Recalculate Sheet</a>');
		$('.status_bar').find('a').on('click', function() {
			$(this).hide();
			SwiftCalcs.giac.restart();
		})
	}
	_.restart = function() {
		// Will reload the webworker if its been destroyed
		if(this.worker) return;
		loadWorker(this);
		SwiftCalcs.active_workspace.ends[L].evaluate(true, true);
	}
	_.aborting = false;
	_.cancelEvaluations = function(el) { 
		// User initiated abort.  Initiate the abort, let the user know the abort is happening, and if 10 seconds pass with no response, add option to force quit
		// If el is passed, set to 'aborting' and use that to allow for full worker kill if no response occurs
		var to_cancel = this.current_evaluations();
		for(var i = 0; i < to_cancel.length; i++)
			this.cancelEvaluation(to_cancel[i]); 
		if(el) {
			var el_new = $('<span>Aborting...</span>');
			el.replaceWith(el_new);
			this.aborting = window.setTimeout(function() { 
				el_new.html('Aborting... <strong>The math engine may be frozen: <a href="#">Kill Math Engine</a></strong>');
				el_new.find('a').on('click', function(e) { 
					$(this).hide();
					$('i.fa-spinner').remove();
					SwiftCalcs.giac.kill();
					return false;
				});
			}, 5000);
		} else
			this.aborting = 1;
		return this;
	}
	_.evaluationComplete = function(eval_id) {
		if(this.evaluations[eval_id] === false) return this;
		this.evaluations[eval_id] = false;
		if(this.errors_encountered)
			setError('Error encountered during computation.  Please correct to continue computation.'); // BRENTAN: Add link to line number?
		else {
			if(this.evaluation_full[eval_id]) {
				this.sendCommand({varList: true});
			} else
				setComplete();
		}
		//var endtime = new Date().getTime();
		//console.log(endtime - window.start_time);
		return this;
	}
	var varToLatex = function(var_name) {
		var textToGreek = function(s) {
	    switch (s.length) {
	      case 2:
	        if (s=="mu" || s=="nu" || s=="pi" || s=="xi" || s=="Xi")
	          return "\\"+s;
	        break;
	      case 3:
	        if (s=="chi" || s=="phi" || s=="Phi" || s=="eta" || s=="rho" || s=="tau" || s=="psi" || s=="Psi")
	          return "\\"+s;
	        break;
	      case 4:
	        if (s=="beta" || s=="zeta")
	          return "\\"+s;
	        break;
	      case 5:
	        if (s=="alpha" || s=="delta" || s=="Delta" || s=="gamma" || s=="Gamma" || s=="kappa" || s=="theta" || s=="Theta" || s=="sigma" || s=="Sigma" || s=="Omega" || s=="omega")
	          return "\\"+s;      
	        break;
	      case 6:
	        if (s=="lambda" || s=="Lambda")
	          return "\\"+s;      
	        break;
	      case 7:
	        if (s=="epsilon")
	          return "\\"+s;      
	      	break;
	    }
	    return s;
	  }
		var_name = var_name.split('_');	
		if(var_name.length == 1)
			return textToGreek(var_name[0]);
		else
			return textToGreek(var_name[0]) + '_{' + textToGreek(var_name[1]) + '}';
	}
	_.varListCallback = function(response) {
		this.variable_list = response.totalVarList;
		this.object_list = response.objects;
    var $vars = $('#variables');
    $vars.html('');
    var _this = this;
    $.each(response.userVarList, function(i, varr) {
    	var link = $('<div class="var_name"><span class="fa fa-fw fa-caret-right"></span>' + SwiftCalcs.active_workspace.latexToHtml(varToLatex(varr)) + '</div>');
    	link.appendTo($vars);
    	link.on('click', function(e) {
    		$(this).next('div.var_callback').remove();
    		var caret = $(this).find('span.fa');
    		if(caret.hasClass('fa-caret-right')) {
	    		caret.removeClass('fa-caret-right').addClass('fa-caret-down');
	    		$('<div id="var_callback_' + _this.varCallbackCounter + '" class="var_callback"><span class="fa fa-spinner fa-pulse"></span></div>').insertAfter($(this));
	    		var last_scope = SwiftCalcs.active_workspace.ends[R].previousScope();
	    		if(last_scope) last_scope = last_scope.workspace.id + '_' + last_scope.id;
	    		else last_scope = false;
	    		_this.sendCommand({variable: true, previous_scope: last_scope, commands: [{command: varr}], callback_id:_this.varCallbackCounter });
	    		_this.varCallbackCounter++;
	    	} else {
	    		caret.removeClass('fa-caret-down').addClass('fa-caret-right');
	    	}
    		return false;
    	});
    });
		setComplete();
	}
	_.variableCallback = function(response) {
		var $el = $('#var_callback_' + response.callback_id);
		if($el.length == 0) return;
		if(response.results[0].success)
			$el.html(SwiftCalcs.active_workspace.latexToHtml(response.results[0].returned));
		else
			$el.html('ERROR: ' + response.results[0].returned);
	}
	_.current_evaluations = function() {
		var output = [];
		for(var i=0; i < this.evaluations.length; i++) {
			if(this.evaluations[i]) output.push(i);
		}
		return output;
	}
	_.manual_mode = function(mode) {
		if(!mode) {
			// Auto mode
			$('.workspace_holder').removeClass(css_prefix + 'manual_evaluation');
			this.auto_evaluation = true;
      $('a.auto_off').closest('li').show(); 
      $('a.calc_now').closest('li').hide();
      $('a.auto_on').closest('li').hide();
		} else {
			$('.workspace_holder').addClass(css_prefix + 'manual_evaluation');
			this.auto_evaluation = false;
      $('a.auto_off').closest('li').hide(); 
      $('a.calc_now').closest('li').show();
      $('a.auto_on').closest('li').show();
		}
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
		this.sendCommand({eval_id: eval_id, restart: restart, scoped: el.scoped, move_to_next: move_to_next, commands: commands, previous_scope: previous_scope, next_scope: next_scope, callback_id: el.id, callback_function: callback}, el);
	}
	_.sendCommand = function(hash, el) {
		if(el) {
			if(this.evaluations[hash.eval_id] === false) return;
			this.setEvaluationElement(hash.eval_id, el);
		}
		if(this.giac_ready && ((typeof hash.eval_id === 'undefined') || this.auto_evaluation || this.manual_evaluation[hash.eval_id])) {
			//if(typeof window.start_time === 'undefined')
	  	//	window.start_time = new Date().getTime();
			this.worker.postMessage(JSON.stringify(hash));
		}	else {
			if(this.giac_ready) 
				setManual('Auto-Evaluation is disabled.  <a href="#" onclick="SwiftCalcs.giac.manualEvaluation();$(this).html(\'Starting...\');return false;">Recalculate Now</a> &nbsp; <a href="#" onclick="SwiftCalcs.giac.manual_mode(false);$(this).html(\'Working...\');return false;">Re-enable Auto-Evaluation</a>');
			window.setTimeout(function(_this) { return function() { _this.sendCommand(hash, el); }; }(this), 250);
		}
	}
});

// Initialize the giac object
var giac = SwiftCalcs.giac = GiacHandler();

/*
This file handles communications with giac, which lives in a webworker
*/
var loadWorker = function(giacHandler) {

	startProgress('Loading Computational Library');
	setProgress(0);

  var giac = giacHandler.worker = new Worker("/libraries/giac_worker" + window.SwiftCalcs_version + ".js");
  giac.addEventListener("message", function (evt) {
    handleResponse(JSON.parse(evt.data));
  },false);

  var cleanOutput = function(result) {
  	for(var i = 0; i < result.length; i++) {
  		if(result[i].success) result[i].returned = result[i].returned.replace(/(\\?[a-zA-Z][a-zA-Z0-9_\\]*)SWIFTCALCSMETHOD(\\?[a-zA-Z][a-zA-Z0-9_\\]*)/g,'\\functionCommand{$1}{$2}').replace(/"/g,'');
  	}
  	return result;
  }

  var handleResponse = function(response) {
    var text = response.value
		if(giacHandler.aborting) {
			window.clearTimeout(giacHandler.aborting);
			setError('This computation has been aborted by the user');
			giacHandler.aborting = false;
			$('i.fa-spinner').remove();
		}
    switch(response.command) {
    	case 'giac_version':
				giac.postMessage(JSON.stringify({giac_version: window.giac_version}));
      	return;
    	case 'results':
    		Element.byId[response.callback_id].evaluationCallback(response.eval_id, response.callback_function, response.move_to_next, cleanOutput(response.results));
    		break;
    	case 'variable':
    		response.results = cleanOutput(response.results);
    		giacHandler.variableCallback(response);
    		break;
    	case 'varList':
    		giacHandler.varListCallback(response);
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
					$('.workspace_holder').removeClass(css_prefix + 'giac_loading');
					giac.postMessage(JSON.stringify({varList: true}));
        	return;
        }
        changeMessage('Loading Computational Library: ' + text);
        break;
    }
  }


};
loadWorker(giac);