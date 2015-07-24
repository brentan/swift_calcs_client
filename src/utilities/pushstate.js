/* object that deals with the URL, changing its properties OR hash depending on browser ability */
var PushState = P(function(_) {
  var routeStripper = /^[#\/]|\s+$/g;
  var rootStripper = /^\/+|\/+$/g;
  var pathStripper = /#.*$/;

	_.init = function() {
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
    this.root             = '/';
    this._wantsHashChange = true;
    this._hasHashChange   = 'onhashchange' in window;
    this._useHashChange   = this._wantsHashChange && this._hasHashChange;
    this._wantsPushState  = true;
    this._hasPushState    = !!(this.history && this.history.pushState);
    this._usePushState    = this._wantsPushState && this._hasPushState;
    this.fragment         = this.getFragment();
    this.root = ('/' + this.root + '/').replace(rootStripper, '/');
    if (this._wantsHashChange && this._wantsPushState) {
      if (!this._hasPushState && !this.atRoot()) {
        var root = this.root.slice(0, -1) || '/';
        this.location.replace(root + '#' + this.getPath());
        return true;
      } else if (this._hasPushState && this.atRoot()) {
        this.navigate(this.getHash(), {replace: true});
      }
    }
    var addEventListener = window.addEventListener || function (eventName, listener) {
      window.attachEvent('on' + eventName, listener);
    }; 
    if (this._usePushState) {
      addEventListener('popstate', function(_this) { return function(e) { return _this.checkUrl(e); }; }(this) , false);
    } else if (this._useHashChange && !this.iframe) {
      addEventListener('hashchange', function(_this) { return function(e) { return _this.checkUrl(e); }; }(this), false);
    } 
  }
  _.checkUrl = function(e) {
    var current = this.getFragment();
    if (current === this.fragment) return false;
    this.loadUrl();
  }
  _.loadUrl = function(fragment) {
    if (!this.matchRoot()) return false;
    fragment = this.fragment = this.getFragment(fragment);

    if(fragment.match(/worksheets\//i)) {
			$('.file_loader_background').show();
			$('.loading_box').show();
			$('.file_loader').hide();
			$.ajax({
	      type: "POST",
	      url: "/workspace_commands",
	      dataType: 'json',
	      cache: false,
	      data: { command: 'get_workspace', data: {hash: fragment.replace(/worksheets\/([a-f0-9]*).*$/i,"$1")} }, 
	      success: function(response) {
	      	if(response.success) {
						$('.file_loader_background').hide();
						$('.loading_box').hide();
						if(SwiftCalcs.active_workspace) SwiftCalcs.active_workspace.unbind();
						var workspace = SwiftCalcs.Workspace(response.name, response.hash, response.id, response.version);
						workspace.bind($('.workspace_holder'));
						workspace.load(response.data);
						window.setTimeout(function() { SwiftCalcs.active_workspace.blur().focus(); SwiftCalcs.active_workspace.ends[-1].focus(-1); });
	      	}	else {
						$('.loading_box').hide();
						$('.file_loader').show();
	      		showNotice(response.message, 'red');
	      	}
	      },
	      error: function(err) {
					$('.loading_box').hide();
					$('.file_loader').show();
	      	showNotice('Error: ' + err.responseText, 'red');
	      	console.log(err);
	      	//Depending on error, do we try again?
	      	// TODO: Much better error handling!
	      }
	    });
			return true;
		}
		return false;
  }
  _.navigate = function(fragment, options) {
    if (!options || options === true) options = {trigger: !!options};
    fragment = this.getFragment(fragment || '');
    var root = this.root;
    if (fragment === '' || fragment.charAt(0) === '?') {
      root = root.slice(0, -1) || '/';
    }
    var url = root + fragment;
    fragment = decodeFragment(fragment.replace(pathStripper, ''));

    if (this.fragment === fragment) return;
    this.fragment = fragment;

    if (this._usePushState) {
      this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

    } else if (this._wantsHashChange) {
      updateHash(this.location, fragment, options.replace);
    } else {
      return this.location.assign(url);
    }
    if (options.trigger) return this.loadUrl(fragment);
  }

  // Helper functions
  _.getFragment = function(fragment) {
    if (fragment == null) {
      if (this._usePushState || !this._wantsHashChange) {
        fragment = this.getPath();
      } else {
        fragment = this.getHash();
      }
    }
    return fragment.replace(routeStripper, '');
  }
  _.atRoot = function() {
    var path = this.location.pathname.replace(/[^\/]$/, '$&/');
    return path === this.root && !this.getSearch();
  }
  _.matchRoot = function() {
    var path = decodeFragment(this.location.pathname);
    var root = path.slice(0, this.root.length - 1) + '/';
    return root === this.root;
  }
  _.getSearch = function() {
    var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
    return match ? match[0] : '';
  }
  _.getHash = function(window) {
    var match = (window || this).location.href.match(/#(.*)$/);
    return match ? match[1] : '';
  }
  _.getPath = function() {
    var path = decodeFragment(
      this.location.pathname + this.getSearch()
    ).slice(this.root.length - 1);
    return path.charAt(0) === '/' ? path.slice(1) : path;
  }
  var updateHash = function(location, fragment, replace) {
    if (replace) {
      var href = location.href.replace(/(javascript:|#).*$/, '');
      location.replace(href + '#' + fragment);
    } else {
      location.hash = '#' + fragment;
    }
  }
  var decodeFragment = function(fragment) {
    return decodeURI(fragment.replace(/%25/g, '%2525'));
  }
});
var pushState = SwiftCalcs.pushState = PushState();