
//BRENTAN: Add support for fluids and gases
var SwiftCalcsObject = P(function(_) {
  _.error = false;
  // Set methodList and propertyList in init (can't define on a classwide basis here)
  /*
  Error handling
  */
  _.setError = function(error) {
    this.error = error;
    return this;
  }
  _.clearState = function() {
    this.error = false;
  }
  _.clone = function() {
    return this;
  }
  _.toString = function() {
    return "OVERRIDE ME";
  }
});
var Material = P(SwiftCalcsObject, function(_, super_) {
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
var seperator = "_";
var IdealSpecies = P(SwiftCalcsObject, function(_, super_) {
  /*
  Ideal Gas species transport functions adapted from Cantera MixtureTransport model
  T, P, are stored as variables inside giac (as var_name_T__in and var_name_P__in), everything else is calculated
  directly here.  set## are used to set T, P, H, S, and TP, etc using direct access
  */
  _.Mw = 0;
  _.id = 0;
  _.moles = 1;  // TODO: WHY FOR THE NEXT 3??
  _.totalMoles = 1;
  _.totalMass   = 1;
  _.transport = false;
  _.name = '';
  _.title = 'Ideal Substance';
  _.formula = '';

  _.init = function(name, data, var_name) {
    this.name = name;
    this.var_name = var_name;
    this.data = data;
    this.setTP(298.15, 101325);
    this.setupAtoms(data.atoms);
    this.propertyList = ['h','s','g','T','P','u','v','M','h_mole','s_mole','g_mole','u_mole','entropy', 'entropy_mole', 'enthalpy', 'enthalpy_mole', 'gamma', 'Cp', 'Cp_mole', 'Cv', 'Cv_mole','specificVolume', 'rho', 'density', 'pressure', 'temperature', 'molecularMass', 'gibbs', 'gibbs_mole', 'internalEnergy', 'internalEnergy_mole', 'logK', 'gF', 'gF_mole,gibbsFormation', 'gibbsFormation_mole', 'hF', 'hF_mole', 'enthalpyFormation', 'enthalpyFormation_mole', 'dhT298', 'dhT298_mole', 'hf298', 'hf298_mole', 'enthalpyFormation298', 'enthalpyFormation298_mole'];
    this.methodList = [];


    //thermo data
    this.thermo_data = data.polynomials;
    this.phase = data.phase;
    if(this.phase != 'gas') 
      this.density = function() { return data.density };

    if(data.hasOwnProperty('transport')) {
      this.transport = true;
      this.transport_data = data.transport;
      this.propertyList.push('thermalConductivity','viscosity');
    }
  }
  // Deep clone...we need this to replicate myself in the scope
  _.clone = function(new_var) {
    return new IdealSpecies(this.name, this.data, new_var).setTP(this.getT(), this.getP());
  }
  _.getT = function() {
    // First test that we are initialized
    if(Module.caseval("VARS").replace("[",",").replace("]",",").indexOf("," + this.var_name + seperator + "T__in,") === -1) {
      this.setError("Object has not yet been initialized.  Did you define this object further down the worksheet?");
      return 298.15; 
    }
    var T = Module.caseval("mksa_remove(evalf(" + this.var_name + seperator + "T__in))").trim();
    if(T.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
      return T*1;
    this.setError("Temperature did not evaluate to a real number");
    return 298.15;
  }
  _.getP = function() {
    // First test that we are initialized
    if(Module.caseval("VARS").replace("[",",").replace("]",",").indexOf("," + this.var_name + seperator + "P__in,") === -1) {
      this.setError("Object has not yet been initialized.  Did you define this object further down the worksheet?");
      return 101325; 
    }
    var P = Module.caseval("mksa_remove(evalf(" + this.var_name + seperator + "P__in))").trim();
    if(P.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
      return P*1;
    this.setError("Pressure did not evaluate to a real number");
    return 101325;
  }
  _.setupAtoms = function(atom_list, reference) {
    //atoms: Use to find molecular weight
    //also find reference species that make this up, and add to an array
    this.referenceSpecies = [];
    this.atoms = atom_list;
    this.Mw = 0;
    var formula = [];
    var _this = this;
    for(var element in atom_list) {
      if (!atom_list.hasOwnProperty(element)) continue;
      var number = atom_list[element];
      formula.push(element + (number == 1 ? "" : "<sub>" + number + "</sub>"));
      _this.Mw += _this.elementTable[element]*number;
      if(!reference) {
        var weight = _this.referenceSpeciesList[element].hasOwnProperty('weight') ? (number / _this.referenceSpeciesList[element].weight) : number;
        var reference_name = _this.referenceSpeciesList[element].hasOwnProperty('name') ? _this.referenceSpeciesList[element].name : element;
        _this.referenceSpecies.push({weight: weight, parameters: thermoReferenceSpecies[reference_name]});
      }
    }
    this.formula = formula.join(" ");
    this.totalMass = this.Mw;
    return this;
  }

  _.toString = function() {
    var output = [["\\mathbf{\\underline{" + this.formula.replace(/ /g, "\\whitespace ").replace(/<sub>([a-z0-9]+)<\/sub>/gi,'_{$1}').replace(/<sup>([a-z0-9]+)<\/sup>/gi,'^{$1}').replace(/\<\/?[a-z0-9]+\/?\>/gi,'') + "}}"]];
    output.push(["T:\\whitespace \\whitespace " + Module.caseval("latex(usimplify(" + this.var_name + seperator + "T__in))")]);
    output.push(["P:\\whitespace \\whitespace " + Module.caseval("latex(usimplify(" + this.var_name + seperator + "P__in))")]);
    output.push(["\\textcolor{#aaaaaa}{see\\whitespace help\\whitespace documentation\\whitespace for}"])
    output.push(["\\textcolor{#aaaaaa}{list\\whitespace of\\whitespace properties\\whitespace and\\whitespace methods}"])
    return toTable(output);
  }
  /*
  Species Thermo Property Setters
  */
  // Multi-set
  _.setTP = function(temperature, pressure) {
    this.setT(temperature).setP(pressure);
    return this;
  }
  _.setHP = function(enthalpy, pressure) {
    this.setP(pressure);
    this.setEnthalpy(enthalpy);
    return this;
  }
  _.setSP = function(entropy, pressure) {
    this.setP(pressure);
    this.setEntropy(entropy);
    return this;
  }
  _.setSV = function(entropy, specific_volumne) {
    this.setSpecificVolume(specific_volumne);
    this.setEntropy_v(entropy)
    return this;
  }
  _.setUV = function(energy, specific_volumne) {
    this.setSpecificVolume(specificVolume);
    this.setInternalEnergy(energy);
    return this;
  }
  // Single
  _.setT = _.setTemperature = function(temperature) {
    if(typeof temperature === "string") {
      if(Module.caseval("mksa_base(evalf(" + temperature + "))").trim() != "1_K") 
        return this.setError("Incompatible Units.  Expecting Temperature units (Kelvin)");
    } else
      temperature = temperature + "_K";
    Module.caseval(this.var_name + seperator + "T__in:=" + temperature);
    return this;
  }
  _.setP = _.setPressure = function(pressure) {
    if(typeof pressure === "string") {
      if(Module.caseval("mksa_base(evalf(" + pressure + "))").trim() != "1_(kg*m^-1.0*s^-2.0)") 
        return this.setError("Incompatible Units.  Expecting Pressure units (Pascal)");
    } else
      pressure = pressure + "_Pa";
    Module.caseval(this.var_name + seperator + "P__in:=" + pressure);
    return this;
  }
  _.setrho = _.setDensity = function(rho) {
    if(typeof rho === "string") {
      if(Module.caseval("mksa_base(evalf(" + rho + "))").trim() != "1_(kg*m^-3.0)") 
        return this.setError("Incompatible Units.  Expecting Density units (mass/volume)");
      rho = Module.caseval("mksa_remove(evalf(" + rho + "))").trim();
      if(!rho.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        return this.setError("Input did not evaluate to a real number");
      rho = rho*1;
    } 
    this.setSpecificVolume(1/rho);
    return this;
  }
  _.setV = _.setSpecificVolume = function(v) {
    if(this.phase != 'gas') return this.setError('Cannot set specific volume of a solid or liquid');
    if(typeof v === "string") {
      if(Module.caseval("mksa_base(evalf(" + v + "))").trim() != "1_(kg^-1.0*m^3.0)") 
        return this.setError("Incompatible Units.  Expecting specific volume units (volume/mass)");
      v = Module.caseval("mksa_remove(evalf(" + v + "))").trim();
      if(!v.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        return this.setError("Input did not evaluate to a real number");
      v = v*1;
    } 
    this.setP((this.GasConstant * this.getT()) / (this.Mw * v));
    return this;
  }
  _.seth = _.setEnthalpy = function(enthalpy) {
    // To set enthalpy, we hold P constant at current pressure, then vary T until we have an enthalpy equal to the desired value
    // Utilize a newton-raphson iteration to converge on the final value.  Guess is taken as the current setpoint
    var mass_specific = false;
    if(typeof enthalpy === "string") {
      var unit = Module.caseval("mksa_base(evalf(" + enthalpy + "))").trim();
      if(unit == "1_(m^2.0*s^-2.0)") 
        mass_specific = true;
      else if(unit == "1_(kg*m^2.0*s^-2.0*mol^-1.0)")
        mass_specific = false;
      else
        return this.setError("Incompatible Units.  Expecting specific enthalpy units (J/kg or J/mol)");
      enthalpy = Module.caseval("mksa_remove(evalf(" + enthalpy + "))").trim();
      if(!enthalpy.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        return this.setError("Input did not evaluate to a real number (" + enthalpy + ")");
      enthalpy = enthalpy*1;
    } 
    var _this = this;
    this.setT(this.rootFinder(this.getT(), function(guess) {
      _this.setT(guess);
      return (_this.enthalpy_i(mass_specific) - enthalpy);
    }));
    return this;
  }
  _sets = _.setEntropy = function(entropy) {
    // To set entropy, we hold P constant at current pressure, then vary T until we have an entropy equal to the desired value
    // Utilize a newton-raphson iteration to converge on the final value.  Guess is taken as the current setpoint
    var mass_specific = false;
    if(typeof entropy === "string") {
      var unit = Module.caseval("mksa_base(evalf(" + entropy + "))").trim();
      if(unit == "1_(m^2.0*s^-2.0*K^-1.0)") 
        mass_specific = true;
      else if(unit == "1_(kg*m^2.0*s^-2.0*K^-1.0*mol^-1.0)")
        mass_specific = false;
      else
        return this.setError("Incompatible Units.  Expecting specific entropy units (J/kg or J/mol)");
      entropy = Module.caseval("mksa_remove(evalf(" + entropy + "))").trim();
      if(!entropy.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        return this.setError("Input did not evaluate to a real number");
      entropy = entropy*1;
    } 
    var _this = this;
    this.setT(this.rootFinder(this.getT(), function(guess) {
      _this.setT(guess);
      return (_this.entropy_i(mass_specific) - entropy);
    }));
    return this;
  }
  _.sets_v = _.setEntropy_v = function(entropy) {
    // To set entropy, we hold v constant at current specific volume, then vary T until we have an entropy equal to the desired value
    // Utilize a newton-raphson iteration to converge on the final value.  Guess is taken as the current setpoint
    var mass_specific = false;
    if(typeof entropy === "string") {
      var unit = Module.caseval("mksa_base(evalf(" + entropy + "))").trim();
      if(unit == "1_(m^2.0*s^-2.0*K^-1.0)") 
        mass_specific = true;
      else if(unit == "1_(kg*m^2.0*s^-2.0*K^-1.0*mol^-1.0)")
        mass_specific = false;
      else
        return this.setError("Incompatible Units.  Expecting specific entropy units (J/kg or J/mol)");
      entropy = Module.caseval("mksa_remove(evalf(" + entropy + "))").trim();
      if(!entropy.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        return this.setError("Input did not evaluate to a real number");
      entropy = entropy*1;
    } 
    var _this = this;
    this.setT(this.rootFinder(this.getT(), function(guess) {
      var curV = _this.specificVolume();
      _this.setT(guess);
      _this.setSpecificVolume(curV);
      return (_this.entropy_i(mass_specific) - entropy);
    }));
    return this;
  }
  _.setu = _.setInternalEnergy = function(energy) {
    // To set entropy, we hold v constant at current specific volume, then vary T until we have an energy equal to the desired value
    // Utilize a newton-raphson iteration to converge on the final value.  Guess is taken as the current setpoint
    var mass_specific = false;
    if(typeof energy === "string") {
      var unit = Module.caseval("mksa_base(evalf(" + energy + "))").trim();
      if(unit == "1_(m^2.0*s^-2.0)") 
        mass_specific = true;
      else if(unit == "1_(kg*m^2.0*s^-2.0*mol^-1.0)")
        mass_specific = false;
      else
        return this.setError("Incompatible Units.  Expecting specific energy units (J/kg or J/mol)");
      energy = Module.caseval("mksa_remove(evalf(" + energy + "))").trim();
      if(!energy.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        return this.setError("Input did not evaluate to a real number");
      energy = energy*1;
    } 
    var _this = this;
    this.setT(this.rootFinder(this.getT(), function(guess) {
      var curV = _this.specificVolume();
      _this.setT(guess);
      _this.setSpecificVolume(curV);
      return (_this.internalEnergy_i(mass_specific) - energy);
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
   NASA9 polynomials
  */
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
  /*
  Species Thermo Property Getters.  All are mole specific by default
  */
  _.moleFraction = function() { // TODO: NEEDED BY MIXTURE?
    return this.moles / this.totalMoles;
  }
  _.massFraction = function() { // TODO: NEEDED BY MIXTURE?
    return (this.moles * this.Mw) / this.totalMass;
  }
  // J/K{kg|mol}
  _.Cv_i = function(mass_specific) {
    if(this.phase != 'ideal_gas') return this.cP_i(mass_specific);
    var cv_mole = this.Cp_i()*1000 - this.GasConstant;
    if(mass_specific === true) return (cv_mole / this.Mw);
    return cv_mole/1000;
  }
  _.Cv = function() {
    return "(" + this.Cv_i(true) + ")*(_J/_kg/_K)";
  }
  _.Cv_mole = function() {
    return "(" + this.Cv_i(false) + ")*(_J/_mol/_K)";
  }
  // J/K{kg|mol}
  _.Cp_i = function(mass_specific) { // TODO: Check - add units
    var T = this.getT();
    var cp_mole = this.calcCp(this.thermo_data,T);
    if(mass_specific === true) return (cp_mole / this.Mw);
    return cp_mole/1000;
  }
  _.Cp = function() {
    return "(" + this.Cp_i(true) + ")*(_J/_kg/_K)";
  }
  _.Cp_mole = function() {
    return "(" + this.Cp_i(false) + ")*(_J/_mol/_K)";
  }
  _.gamma = function() {
    return (this.Cp_i() / this.Cv_i()) + "";
  }
  // J/{kg|mol}
  _.enthalpy_i = function(mass_specific) { // TODO: Check - add units
    var T = this.getT();
    var h_mole = this.calcEnthalpy(this.thermo_data, T);
    if(mass_specific === true) return (h_mole / this.Mw);
    return h_mole/1000;
  }
  _.h = _.enthalpy = function() {
    return "(" + this.enthalpy_i(true) + ")*(_J/_kg)";
  }
  _.h_mole = _.enthalpy_mole = function() {
    return "(" + this.enthalpy_i(false) + ")*(_J/_mol)";
  }
  // J/K{kg|mol}
  _.entropy_i = function(mass_specific) { // TODO: Check - add units
    var T = this.getT();
    var s_mole = this.calcEntropy(this.thermo_data, T, this.getP());
    if(mass_specific === true) return (s_mole / this.Mw);
    return s_mole/1000;
  }
  _.s = _.entropy = function() {
    return "(" + this.entropy_i(true) + ")*(_J/_K/_kg)";
  }
  _.s_mole = _.entropy_mole = function() {
    return "(" + this.entropy_i(false) + ")*(_J/_K/_mol)";
  }
  // J/{kg|mol}
  _.internalEnergy_i = function(mass_specific) {
    var u_mass = this.enthalpy_i(true) - this.getP() * this.specificVolume();
    if(mass_specific === true) return u_mass;
    return (u_mass * this.Mw)/1000;
  }
  _.u = _.internalEnergy = function() {
    return "(" + this.internalEnergy_i(true) + ")*(_J/_K/_kg)";
  }
  _.u_mole = _.internalEnergy_mole = function() {
    return "(" + this.internalEnergy_i(false) + ")*(_J/_K/_mol)";
  }
  // J/{kg|mol}
  _.gibbs_i = function(mass_specific) {
    var g_mole = this.enthalpy_i() - this.getT() * this.entropy_i();
    if(mass_specific === true) return (g_mole*1000 / this.Mw);
    return g_mole;
  }
  _.g = _.gibbs = function() {
    return "(" + this.gibbs_i(true) + ")*(_J/_kg)";
  }
  _.g_mole = _.gibbs_mole = function() {
    return "(" + this.gibbs_i(false) + ")*(_J/_mol)";
  }
  // J/{kg|mol}
  _.enthalpyFormation298_i = function(mass_specific) {
    var curT = this.getT();
    this.setT(298.15);
    var hf298_mole = this.enthalpy_i();
    this.setT(curT);
    if(mass_specific === true) return (hf298_mole*1000 / this.Mw);
    return hf298_mole;
  }
  _.hF298 = _.enthalpyFormation298 = function() {
    return "(" + this.enthalpyFormation298_i(true) + ")*(_J/_kg)";
  }
  _.hF298_mole = _.enthalpyFormation298_mole = function() {
    return "(" + this.enthalpyFormation298_i(false) + ")*(_J/_mol)";
  }
  // J/{kg|mol}
  _.dhT298_i = function(mass_specific) {
    var h_diff_mole = this.enthalpy_i() - this.enthalpyFormation298_i();
    if(mass_specific === true) return (h_diff_mole*1000 / this.Mw);
    return h_diff_mole;
  }
  _.dhT298 = function() {
    return "(" + this.dhT298_i(true) + ")*(_J/_kg)";
  }
  _.dhT298_mole = function() {
    return "(" + this.dhT298_i(false) + ")*(_J/_mol)";
  }
  // J/{kg|mol}
  _.enthalpyFormation_i = function(mass_specific) {
    var hf_mole = this.enthalpy_i();
    var _this = this;
    var T = this.getT();
    for(var i in this.referenceSpecies) {
      if (!this.referenceSpecies.hasOwnProperty(i)) continue;
      var species = this.referenceSpecies[i];
      hf_mole -= species.weight * calcEnthalpy(species.parameters, T);
    }
    if(mass_specific === true) return (hf_mole*1000 / this.Mw);
    return hf_mole;
  }
  _.hF = _.enthalpyFormation = function() {
    return "(" + this.enthalpyFormation_i(true) + ")*(_J/_kg)";
  }
  _.hF_mole = _.enthalpyFormation_mole = function() {
    return "(" + this.enthalpyFormation_i(false) + ")*(_J/_mol)";
  }
  // J/{kg|mol}
  _.gibbsFormation_i = function(mass_specific) {
    var gf_mole = this.gibbs_i();
    var _this = this;
    var T = this.getT();
    var P = this.getP();
    for(var i in this.referenceSpecies) {
      if (!this.referenceSpecies.hasOwnProperty(i)) continue;
      var species = this.referenceSpecies[i];
      gf_mole -= species.weight * (this.calcEnthalpy(species.parameters, T) - T * this.calcEntropy(species.parameters, T, P));
    }
    if(mass_specific === true) return (gf_mole*1000 / this.Mw);
    return gf_mole;
  }
  _.gF = _.gibbsFormation = function() {
    return "(" + this.gibbsFormation_i(true) + ")*(_J/_kg)";
  }
  _.gF_mole = _.gibbsFormation_mole = function() {
    return "(" + this.gibbsFormation_i(false) + ")*(_J/_mol)";
  }
  _.logK = function() {
    return (this.gibbsFormation_i() / (-1 * this.getT() * this.GasConstant / 1000 / Math.LOG10E)) + "";
  }
  // kg/kmol
  _.M = _.molecularMass = function() {
    return "(" + this.Mw + ")*(_g/_mol)";
  }
  // K
  _.T = _.temperature = function() {
    return "(" + this.getT() + ")*_K";
  }
  // Pa
  _.P = _.pressure = function() {
    return "(" + this.getP() + ")*_Pa";
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
  // Density (ideal gas - other phases overwrite this in init), [kg/m^3]
  _.rho = _.density = function() {
    return "(" + ((this.getP() * this.Mw) / (this.GasConstant * this.getT())) + ")*(_kg/_m^3)";
  }
  // [m^3 / kg]
  _.v = _.specificVolume = function() {
    return "1 / ("+this.density()+")";
  }

  /*
  Species transport properties
  */
  // Test if transport is loaded
  _.transportAvailable = function() {
    return this.transport;
  }
  // Viscosity Definition (kinetic theory) [kg/m s]
  _.mu = _.viscosity = function() {
    if(!this.transportAvailable()) return 0;
    // TODO: NASA calc
  }
  // Thermal Conductivity Definition (kinetic theory) [W/m K]
  _.k = _.thermalConductivity = function() {
    if(!this.transportAvailable()) return 0;
    // TODO: NASA calc
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
  /*
    Brent-Dekker iteration method.  Will attempt to find root of provided function 'func'
    Pass in an initial guess, a function that takes a single input, and returns a single output.
    The iteration scheme will work to find the root of this function (input that gives output of 0).  
    Optionally, you can also pass a hash_string with the following options:
    - relative_tolerance: acceptance criteria.  If iteration produces a next guess that is within the relative tolerance of the 
      previous guess, the iteration will stop.  Default 1e-6
    - absolute_tolerance: acceptance criteria.  If the iteration produces a guess that, when evaluated in the function, results in an
      answer within the absolute_tolerance of 0, the iteration will stop.  Default 1e-6
    - maximum_iterations: If the method passes the maximum number of iterations, computation will stop and a warning will be issued.  
      Default 100.
    - minimum_x: the lower bound to start the iteration with
    - maximum_x: the upper bound with which to start the iteration
    - parameter_name: name of the parameter we change (like 'temperature', used for error messages)
    */
  _.rootFinder = function(guess, func, options) {
    // TODO: Any way to improve performance of this with the guess?
    if(typeof options === 'undefined') options = {};
    if(options.relative_tolerance === undefined) options.relative_tolerance = 1e-6;
    if(options.absolute_tolerance === undefined) options.absolute_tolerance = 1e-6;
    if(options.maximum_iterations === undefined) options.maximum_iterations = 100;
    if(options.minimum_x === undefined) options.minimum_x = 1;
    if(options.maximum_x === undefined) options.maximum_x = 20000;
    if(options.parameter_name === undefined) options.parameter_name = 'temperatures';
    // Initialize solver
    var a = options.minimum_x;
    var fa = func(options.minimum_x);
    var b = options.maximum_x;
    var fb = func(options.maximum_x);
    var count = 0
    if((fa*fb) >= 0) {
      this.setError('Solution is outside the bounds of allowable ' + options.parameter_name + ': ' + options.minimum_x + ' to ' + options.maximum_x);
      return guess;
    }
    var mflag = true;
    if(Math.abs(fa) < Math.abs(fb)) {
      var holder = a;
      var fholder = fa;
      a = b;
      fa = fb;
      b = holder;
      fb = fholder;
    }
    var c = a;
    var fc = fa;
    var d = 0;
    var fd = 0;
    var s = 0;
    var fs = 0;

    //console.log("=== START ITERATION: " + a + " => " + fa + " AND " + b + " => " + fb);

    while(true) {
      if((fa != fc) && (fb != fc)) {
        // Inverse Quadratic Interpolation
        s = a*fb*fc / ((fa - fb) * (fa - fc)) + b*fa*fa / ((fb - fa)*(fb - fc)) + c*fa*fb / ((fc - fa)*(fc-fb));
      } else {
        // Secant Method
        s = b - fb * (b-a) / (fb-fa);
      }
      if(!((((3*a+b)/4) > b)&&(((3*a+b)/4) > s)&&(s > b)) || !((((3*a+b)/4) < b)&&(((3*a+b)/4) < s)&&(s < b)) || (mflag && (Math.abs(s-b) >= (Math.abs(b-c)/2))) || (!mflag && (Math.abs(s-b) >= (Math.abs(c-d)/2))) || (mflag && (Math.abs(b-c) < Math.abs(options.relative_tolerance))) || (!mflag && (Math.abs(c-d) < Math.abs(options.relative_tolerance)))) {
        // Bisection
        s = (a+b)/2;
        mflag = true;
      } else
        mflag = false;
      fs = func(s);
      d = c;
      fd = fc;
      c = b;
      fc = fb;

      if((fa*fs) < 0) {
        b = s;
        fb = fs;
      } else {
        a = s;
        fa = fs;
      }
      if(Math.abs(fa) < Math.abs(fb)) {
        var holder = a;
        var fholder = fa;
        a = b;
        fa = fb;
        b = holder;
        fb = fholder;
      }
      //console.log(count + ": " + a + " => " + fa + " AND " + b + " => " + fb);
      if(Math.abs(b - a) < options.relative_tolerance)
        break;
      if(Math.abs(fs) < options.absolute_tolerance)
        break;
      if(count++ == options.maximum_iterations) {
        this.setError('Solution did not converge.  Please try different conditions or a small change in parameters');
        break;
      }
    }
    return s;
  }

  /*
  List of elemental weights, to determine molar mass of species
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


var setMaterial = function(data) {
  if(!data.var_name.match(/^[a-z][a-z0-9]*(_[a-z][a-z0-9]*)?$/))
    return {success: false, returned: "Invalid variable name.  Please enter a valid variable name."};
  if(constants[data.var_name])
    return {success: false, returned: "Please choose another variable name, an object has already been assigned to this variable."};
  if(data.last_name.length > 0)
    destroyConstant(data.last_name);
  switch(data.data_type) {
    case 1: // Solid material
      newConstant(data.var_name, Material(data.data));
      break;
    case 2: // Ideal Species
      newConstant(data.var_name, IdealSpecies('H2', {
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
        }, data.var_name));
      break;
  }
  return {success: true, returned: '1'};
}

