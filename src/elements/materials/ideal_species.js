
var selected_ideal = P(material_holder, function(_, super_) {
  _.name = 'ideal species';
  _.data_type = 1;
  _.class_name = "selected_material";
  _.selecting_class = "idealSpecies";
  _.helpText = "<<<[VAR]> = ideal species <[name]>>>\nLoad the thermodynamic and transport data for the specified substance into the specified variable.";

  _.postInsertHandler = function() {
    super_.postInsertHandler.call(this);
    this.jQ.find('.' + css_prefix + 'focusableItems').after("<div class='explain'>Thermodynamic and transport data provided courtesy of <a href='http://www.grc.nasa.gov/WWW/CEAWeb/ceaThermoBuild.htm' target='_blank'>NASA</a></div>");
    this.setData("TEST", "TEST", {}, 2);
    return this;
  }
  /*
  _.convertData = function(data) {
    if(super_.convertData.call(this, data)) {
      // Data is raw from server, so lets transform it
      var properties = []
      var _this = this;
      $.each(data, function(k,v) {
        properties.push({name: k.charAt(0).toLowerCase() + k.slice(1), value: v.value, unit: _this.worksheet.latexToUnit(v.units)[0]})
      });
      super_.convertData.call(this, { full_name: this.full_name, name: this.name, properties: properties });
    }
  }
  */

});

// Selector:
var idealSpecies = P(material_selector, function(_, super_) {
  _.name = 'material';
  _.data_type = 1;
  _.blank_message = "Choose a Material"
  _.selected_class = selected_ideal
  _.helpText = "<<<[VAR]> = material <[name]>>>\nLoad the data for the specified material into the specified variable.";
  _.special_footer = "Material data courtesy <a href='http://www.makeitfrom.com/' target='_blank'>MakeItFrom.com</a>";

});