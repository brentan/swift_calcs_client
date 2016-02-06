/* object that deals with the URL, changing its properties OR hash_string depending on browser ability */
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
    this.last_active_url  = '/';
    this.last_active_title= 'Swift Calcs';
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
  _.refresh = function(force_list) { 
    if(this.fragment.match(/inline_worksheets\//i)) {
      // This occurs if we are inline viewing, but we type something in the search bar or hit the 'star' option.
      // In that case, we need to revert to the last_active_url and navigate to it
      if(this.last_active_url.match(/^(\/)?$/)) this.last_active_url = 'active/';
      this.navigate(this.last_active_url);
      this.loadUrl(this.last_active_url, true);
    } else if((force_list === true) && (this.fragment.match(/(worksheets|revisions)\//i))) {
      // if force_list is set, we are pushing to return to a list view, so if we are in a worksheet or revision view, we go to 'active'
      this.navigate('/active', {trigger: true});
    } else
      this.loadUrl(undefined, true)
  }
  _.loadUrl = function(fragment, force_refresh) {
    if (!this.matchRoot()) return false;
    fragment = this.fragment = this.getFragment(fragment);
    if((this.last_active_url == this.fragment) && (force_refresh !== true)) {
      // This occurs if an 'inline' worksheet is opened, then a back is pressed, for example.
      window.closeActive($('.active_worksheet'), false);
      $(document).prop('title', this.last_active_title);
      return true;
    } 
    if(!fragment.match(/worksheets\//i) && !fragment.match(/revisions\//i)) this.last_active_url = this.fragment;
    if(fragment.match(/worksheets\//i) || fragment.match(/revisions\//i)) {
      var set_url = true;
      if(fragment.match(/inline_worksheets\//i)) {
        // Test if this worksheet is within the current list, and if so, just open it
        var hash_string = fragment.replace(/inline_worksheets\/([^\/]*).*$/i,"$1");
        var opened = false;
        $('.worksheet_holder').find('.worksheet_item').each(function() {
          if(opened) return;
          if($(this).attr('data-hash') == hash_string) {
            opened = true;
            window.openActive($(this));
            window.loadWorksheet($(this));
          }
        });
        if(opened) return true;
        set_url = false;
      }
      this.last_active_url = '/';
      this.last_active_title = 'Swift Calcs';
      window.closeActive($('.active_worksheet'), false);
      $('.worksheet_holder').html('');
      var box = $('<div/>').addClass('worksheet_holder_box').addClass('single_sheet').appendTo($('.worksheet_holder'));
      var loading_div = $('<div/>').addClass('worksheet_loading').addClass('worksheet_item').attr('data-id', '-1').html('<i class="fa fa-spinner fa-pulse"></i><span>Loading Worksheet...</span>').prependTo(box);
      var success = function(response) {
        var el = $('<div/>').addClass('worksheet_item').addClass('worksheet_id_' + response.id).attr('data-id', response.id).attr('data-name', response.name).attr('parent-id', response.project_id).html(worksheet_html({name: response.name, star_id: false})).insertAfter(loading_div);
        if(response.archive_id) el.addClass('archived');
        loading_div.remove();
        window.openActive(el, set_url);
        window.loadWorksheet(el, response);
      }
      var fail = function(message) {
        loading_div.html('<span>There was an error: ' + message + '</span>');
      }
      if(fragment.match(/worksheets\//i)) {
        var hash_string = fragment.replace(/(inline_)?worksheets\/([^\/]*).*$/i,"$2");
        window.ajaxRequest("/worksheet_commands", { command: 'get_worksheet', data: { hash_string: hash_string } }, success, fail);
      } else {
        var hash_string = fragment.replace(/revisions\/([^\/]*).*$/i,"$1");
        var revision = fragment.replace(/revisions\/([^\/]*)\/([0-9]+).*$/i,"$2");
        window.ajaxRequest("/worksheet_commands", { command: 'get_revision', data: { hash_string: hash_string, revision: revision } }, success, fail);
      }
      return true;
    } else if(fragment.match(/archive_projects\//i)) {
      var hash_string = fragment.replace(/archive_projects\/([a-z0-9\-]*).*$/i,"$1");
      if(hash_string.length == 0)
        window.openFileDialog('archive');
      else
        window.openFileDialog(hash_string, true);
      return true;
    } else if(fragment.match(/projects\//i)) {
      var hash_string = fragment.replace(/projects\/([a-z0-9\-]*).*$/i,"$1");
      if(hash_string.length == 0)
        window.openFileDialog('active');
      else
        window.openFileDialog(hash_string);
      return true;
    } else if(fragment.match(/labels\//i)) {
      var labels_hash = fragment.replace(/labels\/([a-z0-9\-]*).*$/i,"$1");
      if(labels_hash.length == 0)
        window.openFileDialog('active');
      else
        window.openFileDialog('active', false, labels_hash);
      return true;
    } else if(fragment.match(/project_label\//i)) {
      var hash_string = fragment.replace(/project_label\/([a-z0-9\-]*)\/([a-z0-9\-]*).*$/i,"$1");
      var labels_hash = fragment.replace(/project_label\/([a-z0-9\-]*)\/([a-z0-9\-]*).*$/i,"$2");
      if((hash_string.length == 0) || (labels_hash.length == 0))
        window.openFileDialog('active');
      else
        window.openFileDialog(hash_string, false, labels_hash);
      return true;
    } else if(fragment.match(/active/i)) {
      window.openFileDialog('active');
      return true;
    } else if(fragment.match(/archive/i)) {
      window.openFileDialog('archive');
      return true;
    } else if(fragment.match(/invites/i)) {
      window.openFileDialog('invites');
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

    if(!fragment.match(/worksheets\//i) && !fragment.match(/revisions\//i) && !(options.trigger)) this.last_active_url = this.fragment;

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
      location.hash_string = '#' + fragment;
    }
  }
  var decodeFragment = function(fragment) {
    return decodeURI(fragment.replace(/%25/g, '%2525'));
  }
});
var pushState = SwiftCalcs.pushState = PushState();
