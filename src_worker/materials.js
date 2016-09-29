
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
