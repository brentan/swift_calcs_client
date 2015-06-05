
//BRENTAN: Significantly expand this.  Add many many more solid parameters and more materials

var Material = P(function(_) {
	_.E = 0;
	_.rho = 0;
	_.k = 0;
	_.name = '';
	// Property list and method list are used for autocomplete
	_.propertyList = ['density','modulus','thermalConductivity'];
	_.methodList = [];

	_.init = function(data) {
		this.E = data.modulus;
		this.rho = data.density;
		this.k = data.thermal_conductivity;
		this.name = data.name;
	}
	_.density = function() {
		return this.rho;
	}
	_.modulus = function() {
		return this.E;
	}
	_.thermalConductivity = function() {
		return this.k;
	}
	_.properties = function() {
		return [
			[this.name, '\\whitespace'],
			['modulus', latexUnit(this.modulus())],
			['density', latexUnit(this.density())],
			['thermalConductivity', latexUnit(this.thermalConductivity())]
		]
	}
	_.toString = function() {
		return toTable(this.properties());
	}
	_.clone = function() {
		// Used when setting another variable with an object
		return Material({
			modulus: this.E,
			density: this.rho,
			thermal_conductivity: this.k,
			name: this.name
		})
	}
});

var materials = {};
materials.Steel = {
    modulus: 200e9,
    density: 8050,
    thermal_conductivity: 54
  };

materials.Aluminum = {
    modulus: 69e9,
    density: 2700,
    thermal_conductivity: 205
       };

materials.Titanium = {
    modulus: 110e9,
    density: 4340,
    thermal_conductivity: 22
       };

materials.Oak = {
    modulus: 11e9,
    density: 750,
    thermal_conductivity: 0.17
       };
for (prop in materials) {
  if (!materials.hasOwnProperty(prop)) {
    continue;
  }
  materials[prop].modulus += ' _Pa';
  materials[prop].density += ' _kg/(_m^3)';
  materials[prop].thermal_conductivity += ' _W/(_m*_K)';
  materials[prop].name = prop;
  newConstant(prop, Material(materials[prop]));
}
