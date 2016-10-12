
//BRENTAN: Add support for fluids and gases
var Material = P(function(_) {
  /* 
  This is a generic material data type.  It is 'stupid' in that it has no internal 
  logic or functionality beyond returning the constant values supplied through the input
  To initialize, pass a hash with the following structure:
  {
    name: name,
    full_name: "Full Name with Spaces and Illegals ()",
    properties: [
      { name: name, value: value, unit: unit },
      ...
    ]
  }
  */
  _.methodList = [];
  _.init = function(data) {
    this.name = data.name;
    this.full_name = data.full_name;
    this.inputs = data;
    var len = data.properties.length;
    var propertyList = [];
    for(var i = 0; i < len; i++) {
      this[data.properties[i].name] = '(' + data.properties[i].value + ' * ' + data.properties[i].unit + ')';
      propertyList.push(data.properties[i].name);
    }
    this.propertyList = propertyList;
  }
  _.toString = function() {
    var output = [["\\mathbf{\\underline{" + this.full_name.replace(/ /g, "\\whitespace ").replace(/%/g,"\\percentSymbol ").replace(/<sub>([a-z0-9]+)<\/sub>/gi,'_{$1}').replace(/<sup>([a-z0-9]+)<\/sup>/gi,'^{$1}').replace(/\<\/?[a-z0-9]+\/?\>/gi,'') + "}}"]];
    for(var i = 0; i < this.propertyList.length; i++)
      output.push([this.propertyList[i]]);
    output.push(["\\textcolor{#aaaaaa}{use\\whitespace variable.property\\whitespace syntax\\whitespace to}"])
    output.push(["\\textcolor{#aaaaaa}{access\\whitespace properties\\whitespace listed\\whitespace above}"])
    return toTable(output);
  }
  _.clone = function() {
    // Used when setting another variable with an object
    return Material(this.inputs);
  }
});

var setMaterial = function(data) {
  if(!data.var_name.match(/^[a-z][a-z0-9]*(_[a-z][a-z0-9]*)?$/))
    return {success: false, returned: "Invalid variable name.  Please enter a valid variable name."};
  if(constants[data.var_name])
    return {success: false, returned: "Please choose another variable name, an object has already been assigned to this variable."};
  if(data.last_name.length > 0)
    destroyConstant(data.last_name);
  switch(data.data_type) {
    case 1:
      newConstant(data.var_name, Material(data.data));
      break;
  }
  return {success: true, returned: '1'};
}

//newConstant('testconstant', Material({name: 'test', properties: [ {name: 'test1', value: '22', unit: '_m'},{name: 'test2', value: '44', unit: '_in'}]}));

//newConstant('testname', {propertyList: ['aa','bb'], methodList: [], aa: "[1,2,3]", bb: "[4,5,6]", toString: function() { return 'hello'; }, clone: function() { return 3; }});

/*
  Reference species for thermo calculations.  Each items is simply the NASA9 polynomial, with:
*/

var thermoReferenceSpecies = {
  'H': [
      {start: 100, end: 400, parameters: [1,2,3,4,5,6,7,8,9]},
      {start: 400, end: 1000, parameters: [1,2,3,4,5,6,7,8,9]}
    ]
};

/*
  Ideal Single species for thermodynamic calculations.  A species is loaded with thermodynamic data based on the 9-parameter
  NASA polynomials generated from http://WWW.grc.nasa.gov/WWW/CEAWeb/ceaThermoBuild.htm
  Species can be loaded with optional transport properties to also calculate pure species viscosity and thermal conductivity
  as well (from NASA viscosity and thermal conductivity fits)

  data should be of form:
  {
    atoms: {
      H: 1
      O: 2
    },
    polynomials: [
      {start: 100, end: 400, parameters: [1,2,3,4,5,6,7,8,9]},...
    ],
    transport: {
      viscosity: {start: 100, end: 100, parameters: [1,2,3,4]},
      thermalConductivity: {start: 100, end: 100, parameters: [1,2,3,4]},...
    }, // transport is OPTIONAL
    phase: 'gas|liquid|solid'
  }
*/
var seperator = "SWIFTCALCSMETHOD";
var IdealSpecies = P(function(_) {
  /*
  Ideal Gas species transport functions adapted from Cantera MixtureTransport model
  */
  _.M = 0;
  _.id = 0;
  _.moles = 1;  // TODO: WHY FOR THE NEXT 3??
  _.totalMoles = 1;
  _.totalMass   = 1;
  _.transport = false;
  _.warn = false;
  _.name = '';
  _.error = false;
  _.title = 'Ideal Substance';
  // TODO: Fill these out!
  _.methodList = ['setTP'];
  _.propertyList = ['enthalpy'];

  _.init = function(name, data, var_name) {
    var _this = this;
    this.name = name;
    this.var_name = var_name;
    this.data = data;
    this.setupAtoms(data.atoms);

    //thermo data
    this.thermo_data = data.polynomials;
    this.phase = data.phase;
    if(this.phase != 'gas') 
      this.density = function() { return data.density };

    if(data.hasOwnProperty('transport')) {
      this.transport = true;
      this.transport_data = data.transport;
    }
  }
  // Deep clone...we need this to replicate myself in the scope
  _.clone = function(new_var) {
    return new IdealSpecies(this.name, this.data, new_var).setTP(this.getT(), this.getP());
  }
  _.getT = function() {
    var T = Module.caseval("mksa_remove(evalf(" + this.var_name + seperator + "T))").trim();
    if(T.match(/^\-?[0-9\.]+$/))
      return T;
    else if(T == this.var_name + seperator + "T") // User hasn't set a custom value
      return 298.15; 
    setError("Temperature did not evaluate to a real number");
    return 298.15;
  }
  _.getP = function() {
    var P = Module.caseval("mksa_remove(evalf(" + this.var_name + seperator + "P))").trim();
    if(P.match(/^\-?[0-9\.]+$/))
      return P;
    else if(P == this.var_name + seperator + "P") // User hasn't set a custom value
      return 101325; 
    setError("Pressure did not evaluate to a real number");
    return 101325;
  }
  _.setupAtoms = function(atom_list, reference) {
    //atoms: Use to find molecular weight
    //also find reference species that make this up, and add to an array
    this.referenceSpecies = [];
    this.atoms = atom_list;
    this.M = 0;
    var _this = this;
    for(var element in atom_list) {
      if (!atom_list.hasOwnProperty(element)) continue;
      var number = atom_list[element];
      _this.M += _this.elementTable[element]*number;
      if(!reference) {
        var weight = _this.referenceSpeciesList[element].hasOwnProperty('weight') ? (number / _this.referenceSpeciesList[element].weight) : number;
        var reference_name = _this.referenceSpeciesList[element].hasOwnProperty('name') ? _this.referenceSpeciesList[element].name : element;
        _this.referenceSpecies.push({weight: weight, parameters: thermoReferenceSpecies[reference_name]});
      }
    }
    this.totalMass = this.M;
    return this;
  }
  _.toString = function(only_show_key) {
    var output = '<table><tbody>'
    output += '<tr><td>' + this.title + '</td><td colspan=2>' + this.name + '</td></tr>';
    if(typeof only_show_key === 'undefined') {
      var items = this.properties();
      for(var key in items) {
        if (!items.hasOwnProperty(key)) continue;
        var value = items[key];
        output += '<tr><td>' + key + '</td><td>' + value.value + '</td><td>' + value.unit + '</td></tr>';
      }
    } else {
      var _this = this;
      for(var i in only_show_key) {
        if (!only_show_key.hasOwnProperty(i)) continue;
        var show_key = only_show_key[i];
        output += '<tr><td>' + show_key + '</td><td>' + _this.properties()[show_key].value + '</td><td>' + _this.properties()[show_key].unit + '</td></tr>';
      }
    }
    output += '</tbody></table>';
    return output;
  }
  _.properties = function() {
    return {
      Temperature: {value: this.getT(), unit: 'K'},
      Pressure: {value: this.getP(), unit: 'Pa'},
      Density: {value: this.density(), unit: 'kg/m<sup>3</sup>'},
      Enthalpy: {value: this.enthalpy(), unit: 'J/mol'},
      Entropy: {value: this.entropy(), unit: 'J/(mol K)'}
    };
  }
  /*
  Species Thermo Property Setters
  */
  // Multi-set
  _.setTP = function(temperature, pressure) {
    this.setT(temperature).setP(pressure);
    return this;
  }
  _.setHP = function(enthalpy, pressure, mass_specific) {
    this.setP(pressure);
    this.setEnthalpy(enthalpy, mass_specific);
    return this;
  }
  _.setSP = function(entropy, pressure, mass_specific) {
    this.setP(pressure);
    this.setEntropy(entropy, mass_specific);
    return this;
  }
  _.setSV = function(entropy, specific_volumne, mass_specific) {
    this.setSpecificVolume(specific_volumne);
    this.setEntropyV(entropy, mass_specific)
    return this;
  }
  _.setUV = function(energy, specific_volumne, mass_specific) {
    this.setSpecificVolume(specificVolume);
    this.setInternalEnergy(energy, mass_specific);
    return this;
  }
  // Single
  _.setT = function(temperature) {
    Module.caseval(this.var_name + seperator + "T:=" + temperature + "_K");
    return this;
  }
  _.setP = function(pressure) {
    Module.caseval(this.var_name + seperator + "P:=" + temperature + "_Pa");
    return this;
  }
  _.setDensity = function(rho) {
    this.setSpecificVolume(1/rho);
    return this;
  }
  _.setSpecificVolume = function(v) {
    if(this.phase != 'gas') this.setError('Cannot set specific volume of a solid or liquid');
    this.setP((this.GasConstant * this.getT()) / (this.M * v));
    return this;
  }
  _.setEnthalpy = function(enthalpy, mass_specific) {
    // To set enthalpy, we hold P constant at current pressure, then vary T until we have an enthalpy equal to the desired value
    // Utilize a newton-raphson iteration to converge on the final value.  Guess is taken as the current setpoint
    var _this = this;
    this.setT(this.newtonRaphson(this.getT(), this.getT() + 1, function(guess) {
      _this.setT(guess);
      return (_this.enthalpy(mass_specific) - enthalpy);
    }));
    return this;
  }
  _.setEntropy = function(entropy, mass_specific) {
    // To set entropy, we hold P constant at current pressure, then vary T until we have an entropy equal to the desired value
    // Utilize a newton-raphson iteration to converge on the final value.  Guess is taken as the current setpoint
    var _this = this;
    this.setT(this.newtonRaphson(this.getT(), this.getT() + 1, function(guess) {
      _this.setT(guess);
      return (_this.entropy(mass_specific) - entropy);
    }));
    return this;
  }
  _.setEntropyV = function(entropy, mass_specific) {
    // To set entropy, we hold v constant at current specific volume, then vary T until we have an entropy equal to the desired value
    // Utilize a newton-raphson iteration to converge on the final value.  Guess is taken as the current setpoint
    var _this = this;
    this.setT(this.newtonRaphson(this.getT(), this.getT() + 1, function(guess) {
      var curV = _this.specificVolume();
      _this.setT(guess);
      _this.setSpecificVolume(curV);
      return (_this.entropy(mass_specific) - entropy);
    }));
    return this;
  }
  _.setInternalEnergy = function(energy, mass_specific) {
    // To set entropy, we hold v constant at current specific volume, then vary T until we have an energy equal to the desired value
    // Utilize a newton-raphson iteration to converge on the final value.  Guess is taken as the current setpoint
    var _this = this;
    this.setT(this.newtonRaphson(this.getT(), this.getT() + 1, function(guess) {
      var curV = _this.specificVolume();
      _this.setT(guess);
      _this.setSpecificVolume(curV);
      return (_this.internalEnergy(mass_specific) - energy);
    }));
    return this;
  }
  // Saturation
  _.setSaturatedT = function() {
    this.setError('This fluid does not have saturation properties loaded.');
  }
  _.setSaturatedP = function() {
    this.setError('This fluid does not have saturation properties loaded.');
  }
  /*
  Species Thermo Property Getters.  All are mole specific by default
  */
  _.moleFraction = function() { // TODO: NEEDED BY MIXTURE?
    return this.moles / this.totalMoles;
  }
  _.massFraction = function() { // TODO: NEEDED BY MIXTURE?
    return (this.moles * this.M) / this.totalMass;
  }
  // J/K{kg|mol}
  _.Cv = function(mass_specific) {
    if(this.phase != 'ideal_gas') return this.cP(mass_specific);
    var cv_mole = this.Cp()*1000 - this.GasConstant;
    if(mass_specific === true) return (cv_mole / this.M);
    return cv_mole/1000;
  }
  // NASA9 polynomials
  _.calcCp = function(data, T) {
    data = this.getThermoData(data, T);
    return this.GasConstant * (data[0]/(T^2) + data[1]/T + data[2] + data[3]*T + data[4]*T^2 + data[5]*T^3 + data[6]*T^4);
  }
  _.calcEnthalpy = function(data, T) {
    data = this.getThermoData(data, T);
    return this.GasConstant * T * (-1*data[0]/(T^2) + data[1] * Math.log(T)/T + data[2] + data[3]*T/2 + data[4]*(T^2)/3 + data[5]*(T^3)/4 + data[6]*(T^4)/5 + data[7]/T);
  }
  _.calcEntropy = function(data, T, P) {
    data = this.getThermoData(data, T);
    return this.GasConstant * (-1*data[0]/(2*T^2) - data[1]/T + data[2]*Math.log(T) + data[3]*T + data[4]*(T^2)/2 + data[5]*(T^3)/3 + data[6]*(T^4)/4 + data[8]) - this.GasConstant * Math.log(P / 100000);
  }
  // J/K{kg|mol}
  _.Cp = function(mass_specific) { // TODO: Check - add units
    this.clearState();
    var T = this.getT();
    var cp_mole = this.calcCp(this.thermo_data,T);
    if(mass_specific === true) return (cp_mole / this.M);
    return cp_mole/1000;
  }
  _.gamma = function() {
    return (this.Cp() / this.Cv());
  }
  // J/{kg|mol}
  _.enthalpy = function(mass_specific) { // TODO: Check - add units
    this.clearState();
    var T = this.getT();
    var h_mole = this.calcEnthalpy(this.thermo_data, T);
    if(mass_specific === true) return (h_mole / this.M);
    return h_mole/1000;
  }
  // J/K{kg|mol}
  _.entropy = function(mass_specific) { // TODO: Check - add units
    this.clearState();
    var T = this.getT();
    var s_mole = this.calcEntropy(this.thermo_data, T, this.getP());
    if(mass_specific === true) return (s_mole / this.M);
    return s_mole/1000;
  }
  // J/{kg|mol}
  _.internalEnergy = function(mass_specific) {
    var u_mass = this.enthalpy(true) - this.getP() * this.specificVolume();
    if(mass_specific === true) return u_mass;
    return (u_mass * this.M)/1000;
  }
  // J/{kg|mol}
  _.gibbs = function(mass_specific) {
    var g_mole = this.enthalpy() - this.getT() * this.entropy();
    if(mass_specific === true) return (g_mole*1000 / this.M);
    return g_mole;
  }
  // J/{kg|mol}
  _.enthalpyFormation298 = function(mass_specific) {
    var curT = this.getT();
    this.setT(298.15);
    var hf298_mole = this.enthalpy();
    this.setT(curT);
    if(mass_specific === true) return (hf298_mole*1000 / this.M);
    return hf298_mole;
  }
  // J/{kg|mol}
  _.hT_hT298 = function(mass_specific) {
    var h_diff_mole = this.enthalpy() - this.enthalpyFormation298();
    if(mass_specific === true) return (h_diff_mole*1000 / this.M);
    return h_diff_mole;
  }
  // J/{kg|mol}
  _.enthalpyFormation = function(mass_specific) {
    var hf_mole = this.enthalpy();
    var _this = this;
    var T = this.getT();
    for(var i in this.referenceSpecies) {
      if (!this.referenceSpecies.hasOwnProperty(i)) continue;
      var species = this.referenceSpecies[i];
      hf_mole -= species.weight * calcEnthalpy(species.parameters, T);
    }
    if(mass_specific === true) return (hf_mole*1000 / this.M);
    return hf_mole;
  }
  // J/{kg|mol}
  _.gibbsFormation = function(mass_specific) {
    var gf_mole = this.gibbs();
    var _this = this;
    var T = this.getT();
    var P = this.getP();
    for(var i in this.referenceSpecies) {
      if (!this.referenceSpecies.hasOwnProperty(i)) continue;
      var species = this.referenceSpecies[i];
      gf_mole -= species.weight * (this.calcEnthalpy(species.parameters, T) - T * this.calcEntropy(species.parameters, T, P));
    }
    if(mass_specific === true) return (gf_mole*1000 / this.M);
    return gf_mole;
  }
  _.logK = function() {
    return this.gibbsFormation() / (-19.1448 * this.getT());
  }
  // kg/kmol
  _.molecularMass = function() {
    this.clearState();
    return this.M;
  }
  // K
  _.temperature = function() {
    this.clearState();
    return this.getT();
  }
  // Pa
  _.pressure = function() {
    this.clearState();
    return this.getP();
  }
  // Saturation
  _.getTsat = function() {
    this.setError('This fluid does not have saturation properties loaded.');
  }
  _.getPsat = function() {
    this.setError('This fluid does not have saturation properties loaded.');
  }
  _.vaporFraction = function() {
    this.setError('This fluid does not have saturation properties loaded.');
  }
  _.Tcrit = function() {
    this.setError('This fluid does not have saturation properties loaded.');
  }
  _.Tmin = function() {
    this.setError('This fluid does not have saturation properties loaded.');
  }
  _.Pcrit = function() {
    this.setError('This fluid does not have saturation properties loaded.');
  }
  _.Vcrit = function() {
    this.setError('This fluid does not have saturation properties loaded.');
  }

  /*
  Species transport properties
  */
  // Test if transport is loaded
  _.transportAvailable = function() {
    return this.transport;
  }
  // Viscosity Definition (kinetic theory) [kg/m s]
  _.viscosity = function() {
    this.clearState();
    if(!this.transportAvailable()) return 0;
    // TODO: NASA calc
  }
  // Thermal Conductivity Definition (kinetic theory) [W/m K]
  _.thermalConductivity = function() {
    this.clearState();
    if(!this.transportAvailable()) return 0;
    // TODO: NASA calc
  }
  // Density (ideal gas - other phases overwrite this in init), [kg/m^3]
  _.density = function() {
    this.clearState();
    return ((this.getP() * this.M) / (this.GasConstant * this.getT()));
  }
  // [m^3 / kg]
  _.specificVolume = function() {
    return 1 / this.density();
  }


  /*
  Support functions
  */
  _.getThermoData = function(data, T) {
    // If below ranges, pick the bottom range
    if(T < data[0].start) return data[0].parameters;
    // Now check all ranges
    for(var i = 0; i < data.length; i++) {
      var dataset = data[i];
      if(dataset.end >= T)
        return dataset.parameters;
    }
    // Out of all ranges, return upper range
    return data[data.length - 1].parameters;
  }
  // TODO: figure out what to do with this stuff
  _.setWarning = function(warn) {
    this.warn = warn;
  }
  _.setError = function(error) {
    this.error = error;
    console.log(error);
    throw new SwiftCalcException(error);
  }
  _.clearState = function() {
    this.warn = false;
    this.error = false;
  }
  /*
    Newton raphson iteration method.  Will attempt to find root of provided function 'func'
    Pass in two initial guesses, as well as a function that takes a single input, and returns a single output.
    The iteration scheme will work to find the root of this function (input that gives output of 0).  
    Optionally, you can also pass a hash_string with the following options:
    - relative_tolerance: acceptance criteria.  If iteration produces a next guess that is within the relative tolerance of the 
      previous guess, the iteration will stop.  Default 1e-6
    - absolute_tolerance: acceptance criteria.  If the iteration produces a guess that, when evaluated in the function, results in an
      answer within the absolute_tolerance of 0, the iteration will stop.  Default 1e-6
    - maximum_iterations: If the method passes the maximum number of iterations, computation will stop and a warning will be issued.  
      Default 100.
    */
  _.newtonRaphson = function(guess1, guess2, func, options) {
    if(typeof options === 'undefined') options = {};
    options = $.extend({relative_tolerance: 1e-6, absolute_tolerance: 1e-6, maximum_iterations: 100}, options);
    // Initialize solver
    var x_n_2 = guess1;
    var f_n_2 = func(guess1);
    var x_n_1 = guess2;
    var f_n_1 = func(guess2);
    var count = 0
    while(true) {
      x_n = x_n_1 - f_n_1 * (x_n_1 - x_n_2) / (f_n_1 - f_n_2);
      if(Math.abs(x_n - x_n_1) < options.relative_tolerance)
        break;
      f_n = func(x_n);
      if(Math.abs(f_n) < options.absolute_tolerance)
        break;
      if(count++ == options.maximum_iterations) {
        this.setWarning('Solution did not converge.  Provided value may be erroneous');
        break;
      }
      x_n_2 = x_n_1;
      f_n_2 = f_n_1;
      x_n_1 = x_n;
      f_n_1 = f_n;
    }
    return x_n;
  }

  /*
  Cantera functions used for calculation of transport properties (kinetic theory collision integral lookups)
  */
  _.elementTable = {   
    H:    1.00794,
    D:    2.0    ,
    Tr:   3.0    ,
    He:   4.002602,
    Li:   6.941  ,
    Be:   9.012182,
    B:   10.811  ,
    C:   12.011  ,
    N:   14.00674,
    O:   15.9994 ,
    F:   18.9984032,
    Ne:  20.1797 ,
    Na:  22.98977,
    Mg:  24.3050 ,
    Al:  26.98154,
    Si:  28.0855 ,
    P:   30.97376,
    S:   32.066  ,
    Cl:  35.4527 ,
    Ar:  39.948  ,
    K:   39.0983 ,
    Ca:  40.078  ,
    Sc:  44.95591,
    Ti:  47.88   ,
    V:   50.9415 ,
    Cr:  51.9961 ,
    Mn:  54.9381 ,
    Fe:  55.847  ,
    Co:  58.9332 ,
    Ni:  58.69   ,
    Cu:  63.546  ,
    Zn:  65.39   ,
    Ga:  69.723  ,
    Ge:  72.61   ,
    As:  74.92159,
    Se:  78.96   ,
    Br:  79.904  ,
    Kr:  83.80   ,
    Rb:  85.4678 ,
    Sr:  87.62   ,
    Y:   88.90585,
    Zr:  91.224  ,
    Nb:  92.90638,
    Mo:  95.94   ,
    Tc:  97.9072 ,
    Ru: 101.07   ,
    Rh: 102.9055 ,
    Pd: 106.42   ,
    Ag: 107.8682 ,
    Cd: 112.411  ,
    In: 114.82   ,
    Sn: 118.710  ,
    Sb: 121.75   ,
    Te: 127.6    ,
    I:  126.90447,
    Xe: 131.29   ,
    Cs: 132.90543,
    Ba: 137.327  ,
    La: 138.9055 ,
    Ce: 140.115  ,
    Pr: 140.90765,
    Nd: 144.24   ,
    Pm: 144.9127 ,
    Sm: 150.36   ,
    Eu: 151.965  ,
    Gd: 157.25   ,
    Tb: 158.92534,
    Dy: 162.50   ,
    Ho: 164.93032,
    Er: 167.26   ,
    Tm: 168.93421,
    Yb: 173.04   ,
    Lu: 174.967  ,
    Hf: 178.49   ,
    Ta: 180.9479 ,
    W:  183.85   ,
    Re: 186.207  ,
    Os: 190.2    ,
    Ir: 192.22   ,
    Pt: 195.08   ,
    Au: 196.96654,
    Hg: 200.59   ,
    Ti: 204.3833 ,
    Pb: 207.2    ,
    Bi: 208.98037,
    Po: 208.9824 ,
    At: 209.9871 ,
    Rn: 222.0176 ,
    Fr: 223.0197 ,
    Ra: 226.0254 ,
    Ac: 227.0279 ,
    Th: 232.0381 ,
    Pa: 231.03588,
    U:  238.0508 ,
    Np: 237.0482 ,
    Pu: 244.0482 };
  //TODO: check the reference list and update those that need to point to condensed phases
  _.referenceSpeciesList = {Ag:{}, Al:{}, Ar:{}, B:{}, Ba:{}, Be:{}, Br:{weight:2, name: 'Br2'}, C:{name:'C_gr', }, Ca:{}, Cd:{}, Cl:{weight:2, name: 'Cl2'}, Co:{}, Cr:{}, Cs:{}, Cu:{}, F:{weight:2, name: 'F2'}, Fe:{}, Ge:{}, H:{weight:2, name: 'H2'}, He:{}, Hg:{}, I:{weight:2, name: 'I2'}, K:{}, Kr:{}, Li:{}, Mg:{}, Mn:{}, Mo:{}, N:{weight:2, name: 'N2'}, Na:{}, Nb:{}, Ne:{}, Ni:{}, O:{weight:2, name: 'O2'}, P:{}, Pb:{}, Rb:{}, S:{}, Si:{}, Sn:{}, Sr:{}, Ta:{}, Th:{}, Ti:{}, U:{}, V:{}, W:{}, Xe:{}, Zn:{}, Zr:{}};
  // Universal Gas Constant. [J/kmol/K]
  _.GasConstant = 8314.4621;

});

/*newConstant('testH2', IdealSpecies('H2', {
    atoms: {
      H: 2
    },
    polynomials: [
      {start: 200, end: 1000, parameters: [  2.344331120E+00,   7.980520750E-03, 
               -1.947815100E-05,   2.015720940E-08,  -7.376117610E-12,
               -9.179351730E+02,   6.830102380E-01, 0, 0]}
    ],
    transportNO: {
      viscosity: {start: 100, end: 100, parameters: [1,2,3,4]},
      thermalConductivity: {start: 100, end: 100, parameters: [1,2,3,4]},
    },
    phase: 'gas'
  }, 'testH2'));*/
