var constants = {};
var user_vars = {};
var protected_list = {};
var timeout_length = 20;
var digits = 9;
var approx_mode = '0';
var restart_string = "complex_mode:=1;angle_radian:=1;"
// Helper to bind a new object into the constant hash
var newConstant = function(name, ob) {
	constants[name] = ob;
}
var destroyConstant = function(name) {
  delete(constants[name]);
}

// Helper to create an output table.  Will take a 2D array and turn it into latex output
var toTable = function(data) {
	var out = '\\begin{matrix0} ';
	var first_n = true;
	for(var n = 0; n < data.length; n++) {
		if(first_n)
			first_n = false;
		else
			out += ' \\\\ ';
		var first_m = true;
		for(var m = 0; m < data[n].length; m++) {
			if(first_m)
				first_m = false;
			else
				out += ' & ';
			out += data[n][m];
		}
	}
	return out + ' \\end{matrix0}';
}
// return the unique items in an array
function uniq(a) {
  var seen = {};
  var out = [];
  var len = a.length;
  var j = 0;
  for(var i = 0; i < len; i++) {
    var item = a[i];
    if(item.indexOf('SWIFTCALCSMETHOD') > -1) continue;
    if(seen[item] !== 1) {
      seen[item] = 1;
      out[j++] = item;
    }
  }
  return out;
}

var P = (function(prototype, ownProperty, undefined) {
  // helper functions that also help minification
  function isObject(o) { return typeof o === 'object'; }
  function isFunction(f) { return typeof f === 'function'; }

  // used to extend the prototypes of superclasses (which might not
  // have `.Bare`s)
	function SuperclassBare() {}

	return function P(_superclass /* = Object */, definition) {
    // handle the case where no superclass is given
    if (definition === undefined) {
    	definition = _superclass;
    	_superclass = Object;
    }

    // C is the class to be returned.
    //
    // It delegates to instantiating an instance of `Bare`, so that it
    // will always return a new instance regardless of the calling
    // context.
    //
    //  TODO: the Chrome inspector shows all created objects as `C`
    //        rather than `Object`.  Setting the .name property seems to
    //        have no effect.  Is there a way to override this behavior?
    function C() {
    	var self = new Bare;
    	if (isFunction(self.init)) self.init.apply(self, arguments);
    	return self;
    }

    // C.Bare is a class with a noop constructor.  Its prototype is the
    // same as C, so that instances of C.Bare are also instances of C.
    // New objects can be allocated without initialization by calling
    // `new MyClass.Bare`.
    function Bare() {}
    C.Bare = Bare;

    // Set up the prototype of the new class.
    var _super = SuperclassBare[prototype] = _superclass[prototype];
    var proto = Bare[prototype] = C[prototype] = C.p = new SuperclassBare;

    // other variables, as a minifier optimization
    var extensions;


    // set the constructor property on the prototype, for convenience
    proto.constructor = C;

    C.mixin = function(def) {
    	Bare[prototype] = C[prototype] = P(C, def)[prototype];
    	return C;
    }

    return (C.open = function(def) {
    	extensions = {};

    	if (isFunction(def)) {
        // call the defining function with all the arguments you need
        // extensions captures the return value.
        extensions = def.call(C, proto, _super, C, _superclass);
	    }
	    else if (isObject(def)) {
	        // if you passed an object instead, we'll take it
	        extensions = def;
	    }

      // ...and extend it
      if (isObject(extensions)) {
      	for (var ext in extensions) {
      		if (ownProperty.call(extensions, ext)) {
      			proto[ext] = extensions[ext];
      		}
      	}
      }

      // if there's no init, we assume we're inheriting a non-pjs class, so
      // we default to applying the superclass's constructor.
      if (!isFunction(proto.init)) {
      	proto.init = _superclass;
      }

      return C;
	  })(definition);
	}
  // as a minifier optimization, we've closured in a few helper functions
  // and the string 'prototype' (C[p] is much shorter than C.prototype)
})('prototype', ({}).hasOwnProperty);
