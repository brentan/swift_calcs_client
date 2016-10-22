
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
  Reference species for thermo calculations.  Each item is the NASA polynomials for that species
*/

var thermoReferenceSpecies = {
  'Ag': [{start:200.0, end:1000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, 33520.0237, 6.56281935]]}, {start:1000.0, end:6000.0, parameters:[true, [-330992.637, 982.008642, 1.381179917, 0.000617089999, -1.6881146e-07, 2.008826848e-11, -5.627285655e-16, 27267.19171, 14.56862733]]}, {start:6000.0, end:20000.0, parameters:[true, [-371744150.0, 275806.9172, -73.8598261, 0.00960615872, -5.39393574e-07, 1.35885673e-11, -1.272610104e-16, -2107724.971, 662.837457]]}],
'Al': [{start:200.0, end:1000.0, parameters:[true, [5006.60889, 18.61304407, 2.412531111, 0.0001987604647, -2.432362152e-07, 1.538281506e-10, -3.944375734e-14, 38874.1268, 6.086585765]]}, {start:1000.0, end:6000.0, parameters:[true, [-29208.20938, 116.7751876, 2.356906505, 7.73723152e-05, -1.529455262e-08, -9.97167026e-13, 5.053278264e-16, 38232.8865, 6.600920155]]}, {start:6000.0, end:20000.0, parameters:[true, [-504068232.0, 380232.265, -108.2347159, 0.01549444292, -1.070103856e-06, 3.5921109e-11, -4.696039394e-16, -2901050.501, 949.188316]]}],
'Ar': [{start:200.0, end:1000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 4.37967491]]}, {start:1000.0, end:6000.0, parameters:[true, [20.10538475, -0.0599266107, 2.500069401, -3.99214116e-08, 1.20527214e-11, -1.819015576e-15, 1.078576636e-19, -744.993961, 4.37918011]]}, {start:6000.0, end:20000.0, parameters:[true, [-995126508.0, 645888.726, -167.5894697, 0.02319933363, -1.721080911e-06, 6.53193846e-11, -9.740147729e-16, -5078300.34, 1465.298484]]}],
'B': [{start:200.0, end:1000.0, parameters:[true, [118.2394638, -0.0700991691, 2.500236159, -4.5842137e-07, 5.12318583e-10, -3.057217674e-13, 7.533815325e-17, 68483.5908, 4.20950192]]}, {start:1000.0, end:6000.0, parameters:[true, [-107265.961, 322.530716, 2.126407232, 0.0002106579339, -5.93712916e-08, 7.37742799e-12, -2.282443381e-16, 66434.131, 6.87706967]]}, {start:6000.0, end:20000.0, parameters:[true, [-415000131.0, 232957.6796, -47.2091371, 0.00487765596, -2.069413791e-07, 3.23351909e-12, -1.824076527e-18, -1802904.743, 443.961764]]}],
'Ba': [{start:200.0, end:1000.0, parameters:[true, [2222.563526, -34.0797785, 2.706751118, -0.000638289449, 1.063003846e-06, -9.10262427e-10, 3.148062219e-13, 21665.49702, 5.10254588]]}, {start:1000.0, end:6000.0, parameters:[true, [-19265792.28, 60065.0104, -66.3396413, 0.0350756593, -7.80760183e-06, 8.0851268e-10, -3.199486918e-14, -358966.372, 500.75834]]}, {start:6000.0, end:20000.0, parameters:[true, [348345207.0, -292555.8261, 97.7488849, -0.01345477126, 9.56723979e-07, -3.38066231e-11, 4.72739054e-16, 2250335.26, -796.844441]]}],
'Be': [{start:200.0, end:1000.0, parameters:[true, [-0.000411290152, 5.36496736e-06, 2.499999972, 7.56920369e-11, -1.097852652e-13, 8.00211024e-17, -2.303022777e-20, 38222.6459, 2.146172983]]}, {start:1000.0, end:6000.0, parameters:[true, [-692628.584, 2466.773005, -0.977661334, 0.002458939515, -9.04795042e-07, 1.587880407e-10, -9.415600603e-15, 23002.12917, 26.23234754]]}, {start:6000.0, end:20000.0, parameters:[true, [414583352.0, -225414.7519, 44.1143791, -0.003022853591, 1.178346131e-07, -2.27338765e-12, 1.196838345e-17, 1866686.325, -375.23374]]}],
'Br2': [{start:200.0, end:1000.0, parameters:[true, [7497.04754, -235.0884557, 5.49193432, -0.002227573303, 2.932401703e-06, -1.954889514e-09, 5.31230789e-13, 3521.47505, -1.96415157]]}, {start:1000.0, end:6000.0, parameters:[true, [-4311698.57, 11112.68634, -5.55577561, 0.00363051659, -2.754164226e-07, -6.21750676e-11, 7.37534162e-15, -70365.8416, 78.7847802]]}],
'C(gr)': [{start:200.0, end:600.0, parameters:[true, [113285.676, -1980.421677, 13.65384188, -0.0463609644, 0.0001021333011, -1.082893179e-07, 4.47225886e-11, 8943.85976, -72.9582474]]}, {start:600.0, end:2000.0, parameters:[true, [335600.441, -2596.528368, 6.94884191, -0.00348483609, 1.844192445e-06, -5.05520596e-10, 5.75063901e-14, 13984.12456, -44.7718304]]}, {start:2000.0, end:6000.0, parameters:[true, [202310.5106, -1138.235908, 3.7002795, -0.0001833807727, 6.34368325e-08, -7.06858948e-12, 3.33543598e-16, 5848.13485, -23.50925275]]}],
'Ca': [{start:200.0, end:1000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, 20638.92786, 4.38454833]]}, {start:1000.0, end:6000.0, parameters:[true, [7547341.24, -21486.42662, 25.30849567, -0.01103773705, 2.293249636e-06, -1.209075383e-10, -4.015333268e-15, 158586.2323, -160.9512955]]}, {start:6000.0, end:20000.0, parameters:[true, [2291781634.0, -1608862.96, 431.246636, -0.0539650899, 3.53185621e-06, -1.16440385e-10, 1.527134223e-15, 12586514.34, -3692.10161]]}],
'Cd': [{start:200.0, end:1000.0, parameters:[true, [-0.0001081751543, 1.816433041e-06, 2.499999989, 3.129989231e-11, -4.60071016e-14, 3.40704874e-17, -9.989497436e-21, 12700.99766, 5.93154976]]}, {start:1000.0, end:6000.0, parameters:[true, [-269975.7467, 786.600114, 1.628169079, 0.000459412329, -1.150420443e-07, 1.074836707e-11, 8.790199555e-17, 7675.14826, 12.20006052]]}, {start:6000.0, end:20000.0, parameters:[true, [-1336284287.0, 932094.911, -249.0956222, 0.0330287861, -2.200384347e-06, 7.42571255e-11, -1.026730246e-15, -7267528.99, 2167.946107]]}],
'Cl2': [{start:200.0, end:1000.0, parameters:[true, [34628.1724, -554.712949, 6.20759103, -0.00298963673, 3.17303416e-06, -1.79363467e-09, 4.26005863e-13, 1534.07075, -9.43835303]]}, {start:1000.0, end:6000.0, parameters:[true, [6092566.75, -19496.2688, 28.5453491, -0.0144996828, 4.46388943e-06, -6.35852403e-10, 3.32735931e-14, 121211.722, -169.077832]]}],
'Co': [{start:200.0, end:1000.0, parameters:[true, [-2598.939184, 246.1989844, -0.610605837, 0.01393005772, -2.210012979e-05, 1.623755261e-08, -4.534904351e-12, 49846.1376, 22.57584199]]}, {start:1000.0, end:6000.0, parameters:[true, [1381841.305, -3756.03668, 6.65713065, -0.001269246675, 1.464092329e-07, 6.57494657e-12, -1.102384178e-15, 74944.4291, -22.58500836]]}, {start:6000.0, end:20000.0, parameters:[true, [-546801575.0, 403770.495, -114.2413163, 0.01663014422, -1.156228007e-06, 3.86251515e-11, -5.002032746e-16, -3076031.798, 1003.028648]]}],
'Cr': [{start:200.0, end:1000.0, parameters:[true, [1335.658217, -21.02424026, 2.631908173, -0.000424626325, 7.43919416e-07, -6.76393163e-10, 2.507855625e-13, 47158.6664, 6.00542545]]}, {start:1000.0, end:6000.0, parameters:[true, [-11202207.89, 34011.6369, -36.5706217, 0.02110296902, -5.51818014e-06, 7.17360171e-10, -3.505127367e-14, -168899.344, 286.4481267]]}, {start:6000.0, end:20000.0, parameters:[true, [3900886930.0, -2462918.543, 591.563264, -0.0669712164, 3.94695779e-06, -1.166504597e-10, 1.367279456e-15, 19553819.84, -5133.51055]]}],
'Cs': [{start:200.0, end:1000.0, parameters:[true, [54.6658407, -0.827934604, 2.50494221, -1.49462069e-05, 2.425976774e-08, -2.013172322e-11, 6.704271991e-15, 8459.32139, 6.848825772]]}, {start:1000.0, end:6000.0, parameters:[true, [6166040.9, -18961.75522, 24.83229903, -0.01251977234, 3.30901739e-06, -3.35401202e-10, 9.626500908e-15, 128511.1231, -152.2942188]]}, {start:6000.0, end:20000.0, parameters:[true, [-956623172.0, 432169.042, -63.7180102, 0.00524626058, -2.366560159e-07, 5.84848848e-12, -6.169370441e-17, -3585268.84, 615.6618174]]}],
'Cu': [{start:200.0, end:1000.0, parameters:[true, [77.1313315, -1.169236206, 2.506987803, -2.116434879e-05, 3.44171471e-08, -2.862608999e-11, 9.559250991e-15, 39839.8121, 5.73081322]]}, {start:1000.0, end:6000.0, parameters:[true, [2308090.411, -8503.261, 14.67859102, -0.00846713652, 2.887821016e-06, -4.27065918e-10, 2.304265084e-14, 92075.3562, -78.5470156]]}, {start:6000.0, end:20000.0, parameters:[true, [-649059589.0, 424032.336, -102.8965806, 0.01297259934, -7.76669768e-07, 2.220446727e-11, -2.441532031e-16, -3305304.58, 919.862292]]}],
'D': [{start:200.0, end:1000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, 25921.287, 0.591714338]]}, {start:1000.0, end:6000.0, parameters:[true, [60.5001921, -0.1810766064, 2.500210817, -1.220711706e-07, 3.71517217e-11, -5.66068021e-15, 3.393920393e-19, 25922.43752, 0.590212537]]}, {start:6000.0, end:20000.0, parameters:[true, [216925977.8, -130930.9862, 33.9259505, -0.00380597381, 2.427699393e-07, -7.6779678e-12, 9.624191177e-17, 1065922.04, -272.6201602]]}],
'E': [{start:298.15, end:1000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, -745.375, -11.72081224]]}, {start:1000.0, end:6000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, -745.375, -11.72081224]]}, {start:6000.0, end:20000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, -745.375, -11.72081224]]}],
'F2': [{start:200.0, end:1000.0, parameters:[true, [10181.76308, 22.74241183, 1.97135304, 0.00815160401, -1.14896009e-05, 7.95865253e-09, -2.167079526e-12, -958.6943, 11.30600296]]}, {start:1000.0, end:6000.0, parameters:[true, [-2941167.79, 9456.5977, -7.73861615, 0.00764471299, -2.241007605e-06, 2.915845236e-10, -1.425033974e-14, -60710.0561, 84.2383508]]}],
'Fe': [{start:200.0, end:1000.0, parameters:[true, [67908.2266, -1197.218407, 9.84339331, -0.01652324828, 1.917939959e-05, -1.149825371e-08, 2.832773807e-12, 54669.9594, -33.8394626]]}, {start:1000.0, end:6000.0, parameters:[true, [-1954923.682, 6737.1611, -5.48641097, 0.00437880345, -1.116286672e-06, 1.544348856e-10, -8.023578182e-15, 7137.37006, 65.0497986]]}, {start:6000.0, end:20000.0, parameters:[true, [1216352511.0, -582856.393, 97.8963451, -0.00537070443, 3.19203792e-08, 6.26767143e-12, -1.480574914e-16, 4847648.29, -869.728977]]}],
'Ge': [{start:200.0, end:1000.0, parameters:[true, [-20592.15242, -143.2022103, 4.50600233, 0.00154718784, -8.51829655e-06, 8.24382446e-09, -2.566167305e-12, 43630.7086, -6.22526851]]}, {start:1000.0, end:6000.0, parameters:[true, [-856541.384, 3917.95866, -1.809888212, 0.002276482224, -5.36562755e-07, 5.98495809e-11, -2.541700646e-15, 19565.18798, 38.4134679]]}, {start:6000.0, end:20000.0, parameters:[true, [24239651.36, -25436.05174, 14.56087539, -0.002592562254, 2.658628502e-07, -1.122785077e-11, 1.620997559e-16, 229581.2461, -89.5358586]]}],
'H2': [{start:200.0, end:1000.0, parameters:[true, [40783.2281, -800.918545, 8.21470167, -0.0126971436, 1.75360493e-05, -1.20286016e-08, 3.36809316e-12, 2682.48438, -30.4378866]]}, {start:1000.0, end:6000.0, parameters:[true, [560812.338, -837.149134, 2.97536304, 0.00125224993, -3.74071842e-07, 5.93662825e-11, -3.60699573e-15, 5339.81585, -2.20276405]]}, {start:6000.0, end:20000.0, parameters:[true, [496671613.0, -314744.812, 79.838875, -0.00841450419, 4.75306044e-07, -1.37180973e-11, 1.6053746e-16, 2488354.66, -669.552419]]}],
'He': [{start:200.0, end:1000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 0.928723974]]}, {start:1000.0, end:6000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 0.928723974]]}, {start:6000.0, end:20000.0, parameters:[true, [3396845.42, -2194.037652, 3.080231878, -8.06895755e-05, 6.25278491e-09, -2.574990067e-13, 4.429960218e-18, 16505.1896, -4.04881439]]}],
'Hg': [{start:200.0, end:1000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, 6636.90008, 6.80020154]]}, {start:1000.0, end:6000.0, parameters:[true, [51465.7351, -168.1269855, 2.718343098, -0.0001445026192, 5.15897766e-08, -9.47248501e-12, 7.034797406e-16, 7688.68493, 5.27123609]]}, {start:6000.0, end:20000.0, parameters:[true, [535844393.0, -443385.381, 146.3223992, -0.02318441669, 1.916335174e-06, -7.419662e-11, 1.067224054e-15, 3391999.92, -1201.22599]]}],
'I2': [{start:200.0, end:1000.0, parameters:[true, [-5087.96877, -12.4958521, 4.50421909, 0.0001370962533, -1.390523014e-07, 1.174813853e-10, -2.337541043e-14, 6213.46981, 5.58383694]]}, {start:1000.0, end:6000.0, parameters:[true, [-5632594.16, 17939.6156, -17.23055169, 0.0124421408, -3.33276858e-06, 4.12547794e-10, -1.960461713e-14, -106850.5292, 160.0531883]]}],
'K': [{start:200.0, end:1000.0, parameters:[true, [9.66514393, -0.1458059455, 2.500865861, -2.601219276e-06, 4.18730658e-09, -3.43972211e-12, 1.131569009e-15, 9959.49349, 5.03582226]]}, {start:1000.0, end:6000.0, parameters:[true, [-3566422.36, 10852.89825, -10.54134898, 0.00800980135, -2.696681041e-06, 4.71529415e-10, -2.97689735e-14, -58753.3701, 97.3855124]]}, {start:6000.0, end:20000.0, parameters:[true, [920578659.0, -693530.028, 191.1270788, -0.02305931672, 1.430294866e-06, -4.40933502e-11, 5.366769166e-16, 5395082.19, -1622.158805]]}],
'Kr': [{start:200.0, end:1000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 5.49095651]]}, {start:1000.0, end:6000.0, parameters:[true, [264.3639057, -0.791005082, 2.500920585, -5.32816411e-07, 1.620730161e-10, -2.467898017e-14, 1.47858504e-18, -740.348894, 5.48439815]]}, {start:6000.0, end:20000.0, parameters:[true, [-1375531087.0, 906403.053, -240.3481435, 0.0337831203, -2.563103877e-06, 9.96978779e-11, -1.521249677e-15, -7111667.37, 2086.866326]]}],
'Li': [{start:200.0, end:1000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, 18413.90197, 2.447622965]]}, {start:1000.0, end:6000.0, parameters:[true, [1125610.652, -3463.53673, 6.56661192, -0.002260983356, 5.92228916e-07, -6.2816351e-11, 2.884948238e-15, 40346.374, -26.55918195]]}, {start:6000.0, end:20000.0, parameters:[true, [2604352623.0, -1521952.201, 345.44005, -0.0377967485, 2.222420069e-06, -6.6915708e-11, 8.088023606e-16, 12177918.47, -3006.680193]]}],
'Mg': [{start:200.0, end:1000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, 16946.58761, 3.63433014]]}, {start:1000.0, end:6000.0, parameters:[true, [-536483.155, 1973.709576, -0.36337769, 0.002071795561, -7.73805172e-07, 1.359277788e-10, -7.766898397e-15, 4829.18811, 23.39104998]]}, {start:6000.0, end:20000.0, parameters:[true, [2166012586.0, -1008355.665, 161.9680021, -0.00879013035, -1.925690961e-08, 1.725045214e-11, -4.234946112e-16, 8349525.9, -1469.355261]]}],
'Mn': [{start:200.0, end:1000.0, parameters:[true, [0.1034061359, -0.001551537349, 2.500009148, -2.723162066e-08, 4.33389743e-11, -3.51109389e-14, 1.136032201e-17, 33219.3519, 6.649325463]]}, {start:1000.0, end:6000.0, parameters:[true, [5855.15582, 883.858844, -0.0364866258, 0.002703720687, -1.324971998e-06, 2.87260329e-10, -1.92363357e-14, 28678.03487, 22.92541198]]}, {start:6000.0, end:20000.0, parameters:[true, [3936189040.0, -2353549.748, 537.72448, -0.0582481257, 3.3304751e-06, -9.68963105e-11, 1.133286034e-15, 18795301.61, -4690.09789]]}],
'Mo': [{start:200.0, end:1000.0, parameters:[true, [76.4636791, -1.159269043, 2.506929462, -2.099249725e-05, 3.41477943e-08, -2.841269591e-11, 9.492443321e-15, 78458.998, 7.60183566]]}, {start:1000.0, end:6000.0, parameters:[true, [5573271.0, -16623.65811, 21.35147077, -0.01003069377, 2.409784357e-06, -1.811267352e-10, 1.034189087e-15, 184264.6473, -127.5326434]]}, {start:6000.0, end:20000.0, parameters:[true, [6205038910.0, -3855961.6, 937.159506, -0.1108164544, 6.9291239e-06, -2.199865715e-10, 2.798315513e-15, 30621636.02, -8122.81134]]}],
'N2': [{start:200.0, end:1000.0, parameters:[true, [22103.71497, -381.846182, 6.08273836, -0.00853091441, 1.384646189e-05, -9.62579362e-09, 2.519705809e-12, 710.846086, -10.76003316]]}, {start:1000.0, end:6000.0, parameters:[true, [587712.406, -2239.249073, 6.06694922, -0.00061396855, 1.491806679e-07, -1.923105485e-11, 1.061954386e-15, 12832.10415, -15.86639599]]}, {start:6000.0, end:20000.0, parameters:[true, [831013916.0, -642073.354, 202.0264635, -0.03065092046, 2.486903333e-06, -9.70595411e-11, 1.437538881e-15, 4938707.04, -1672.099736]]}],
'Na': [{start:200.0, end:1000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, 12183.82949, 4.24402818]]}, {start:1000.0, end:6000.0, parameters:[true, [952572.338, -2623.807254, 5.16259662, -0.001210218586, 2.306301844e-07, -1.249597843e-11, 7.22677119e-16, 29129.63564, -15.19717061]]}, {start:6000.0, end:20000.0, parameters:[true, [1592533392.0, -971783.666, 223.8443963, -0.02380930558, 1.352018117e-06, -3.93697111e-11, 4.630689121e-16, 7748677.26, -1939.615505]]}],
'Nb': [{start:200.0, end:1000.0, parameters:[true, [78896.6067, -1212.813914, 10.34579819, -0.01676630056, 1.979119979e-05, -1.218224409e-08, 3.058098336e-12, 91653.1514, -35.9474285]]}, {start:1000.0, end:6000.0, parameters:[true, [-1096553.196, 2546.650713, 2.236054882, -0.001280029198, 8.46423799e-07, -1.486269508e-10, 8.714309406e-15, 68791.2455, 13.9816903]]}, {start:6000.0, end:20000.0, parameters:[true, [1818626365.0, -1032414.94, 230.8238005, -0.02445004311, 1.395626888e-06, -4.08723301e-11, 4.826490497e-16, 8359622.56, -1997.79729]]}],
'Ne': [{start:200.0, end:1000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 3.35532272]]}, {start:1000.0, end:6000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 3.35532272]]}, {start:6000.0, end:20000.0, parameters:[true, [-12382527.46, 6958.57958, 1.016709287, 0.0001424664555, -4.80393393e-09, -1.170213183e-13, 8.415153652e-18, -56639.3363, 16.48438697]]}],
'Ni': [{start:200.0, end:1000.0, parameters:[true, [-32358.1055, 601.526462, -1.079270657, 0.01089505519, -1.369578748e-05, 8.31772579e-09, -2.019206968e-12, 48138.1081, 27.188292]]}, {start:1000.0, end:6000.0, parameters:[true, [-493826.221, 1092.909991, 2.410485014, -1.599071827e-05, -1.047414069e-08, 4.62479521e-12, -4.448865218e-17, 43360.7217, 9.6771956]]}, {start:6000.0, end:20000.0, parameters:[true, [349266988.0, -165422.7575, 33.4986936, -0.0035270859, 3.24006024e-07, -1.604177606e-11, 2.935430214e-16, 1409017.848, -267.2455567]]}],
'O2': [{start:200.0, end:1000.0, parameters:[true, [-34255.6342, 484.700097, 1.119010961, 0.00429388924, -6.83630052e-07, -2.0233727e-09, 1.039040018e-12, -3391.45487, 18.4969947]]}, {start:1000.0, end:6000.0, parameters:[true, [-1037939.022, 2344.830282, 1.819732036, 0.001267847582, -2.188067988e-07, 2.053719572e-11, -8.19346705e-16, -16890.10929, 17.38716506]]}, {start:6000.0, end:20000.0, parameters:[true, [497529430.0, -286610.6874, 66.9035225, -0.00616995902, 3.016396027e-07, -7.4214166e-12, 7.27817577e-17, 2293554.027, -553.062161]]}],
'P': [{start:200.0, end:1000.0, parameters:[true, [50.4086657, -0.763941865, 2.504563992, -1.381689958e-05, 2.245585515e-08, -1.866399889e-11, 6.227063395e-15, 37324.2191, 5.359303481]]}, {start:1000.0, end:6000.0, parameters:[true, [1261794.642, -4559.83819, 8.91807931, -0.00438140146, 1.454286224e-06, -2.030782763e-10, 1.021022887e-14, 65417.2396, -39.15974795]]}, {start:6000.0, end:20000.0, parameters:[true, [-22153925.45, -45669.1118, 28.37245428, -0.00448324404, 3.57941308e-07, -1.255311557e-11, 1.590290483e-16, 337090.576, -205.6960928]]}],
'Pb': [{start:200.0, end:1000.0, parameters:[true, [1213.382285, -19.06116019, 2.619299546, -0.000382951961, 6.68818045e-07, -6.06123108e-10, 2.240022429e-13, 22820.96238, 6.2013692]]}, {start:1000.0, end:6000.0, parameters:[true, [-9084313.07, 26726.7318, -26.26244039, 0.01358282305, -2.685523566e-06, 2.3524328e-10, -7.324114532e-15, -148165.0666, 215.4011624]]}, {start:6000.0, end:20000.0, parameters:[true, [532547497.0, -275141.9152, 63.0303193, -0.00681367274, 4.44748961e-07, -1.519361678e-11, 2.043475665e-16, 2243651.683, -522.56499]]}],
'Rb': [{start:200.0, end:1000.0, parameters:[true, [13.52856616, -0.2042232679, 2.501213823, -3.6506199e-06, 5.88472267e-09, -4.84227472e-12, 1.596211946e-15, 8985.56921, 6.20700548]]}, {start:1000.0, end:6000.0, parameters:[true, [-1138274.064, 3804.04194, -2.750899258, 0.0038914607, -1.632296823e-06, 3.51189314e-10, -2.521064422e-14, -14664.54849, 42.5344237]]}, {start:6000.0, end:20000.0, parameters:[true, [324519220.0, -349385.087, 115.9097652, -0.01492843123, 9.58238506e-07, -2.996233671e-11, 3.657332046e-16, 2636178.014, -958.651723]]}],
'S': [{start:200.0, end:1000.0, parameters:[true, [-317.484182, -192.4704923, 4.68682593, -0.0058413656, 7.53853352e-06, -4.86358604e-09, 1.256976992e-12, 33235.9218, -5.71847719]]}, {start:1000.0, end:6000.0, parameters:[true, [-485424.479, 1438.830408, 1.258504116, 0.000379799043, 1.630685864e-09, -9.54709585e-12, 8.041466646e-16, 23349.9527, 15.59559533]]}, {start:6000.0, end:20000.0, parameters:[true, [-130200541.4, 69093.6202, -11.76228025, 0.00160154085, -1.05053334e-07, 4.34182902e-12, -7.675621927e-17, -526148.503, 132.2195719]]}],
'Si': [{start:200.0, end:1000.0, parameters:[true, [98.3614081, 154.6544523, 1.87643667, 0.001320637995, -1.529720059e-06, 8.95056277e-10, -1.95287349e-13, 52635.1031, 9.69828888]]}, {start:1000.0, end:6000.0, parameters:[true, [-616929.885, 2240.683927, -0.444861932, 0.001710056321, -4.10771416e-07, 4.55888478e-11, -1.889515353e-15, 39535.5876, 26.79668061]]}, {start:6000.0, end:20000.0, parameters:[true, [-928654894.0, 544398.989, -120.6739736, 0.01359662698, -7.60649866e-07, 2.149746065e-11, -2.474116774e-16, -4293792.12, 1086.382839]]}],
'Sn': [{start:200.0, end:1000.0, parameters:[true, [-124869.2263, 1618.84119, -4.60239735, 0.01045433308, 2.99826555e-06, -1.068699386e-08, 4.32342131e-12, 27483.64008, 48.0506723]]}, {start:1000.0, end:6000.0, parameters:[true, [-5145695.64, 11405.75108, -4.17963206, 0.002236390679, -3.60321977e-07, 2.440237836e-11, -2.937628285e-16, -42150.1357, 59.8145093]]}, {start:6000.0, end:20000.0, parameters:[true, [-1119787114.0, 642704.604, -137.8615913, 0.01453867222, -7.10958603e-07, 1.501409263e-11, -8.940758657e-17, -5111296.87, 1245.625545]]}],
'Sr': [{start:200.0, end:1000.0, parameters:[true, [4.19064984, -0.0630443758, 2.500373027, -1.115455943e-06, 1.785248643e-09, -1.456209589e-12, 4.750132981e-16, 18558.52648, 5.55577284]]}, {start:1000.0, end:6000.0, parameters:[true, [14894144.1, -43753.3505, 51.3726628, -0.02592566025, 6.58299e-06, -6.9496118e-10, 2.417779662e-14, 297754.5522, -345.489077]]}, {start:6000.0, end:20000.0, parameters:[true, [556223372.0, -609319.322, 210.9096848, -0.03010063957, 2.178021676e-06, -7.82400346e-11, 1.10990962e-15, 4579268.34, -1752.716908]]}],
'Ta': [{start:200.0, end:1000.0, parameters:[true, [-11509.07339, 47.8073043, 3.18558839, -0.00536652816, 1.288379705e-05, -1.045798666e-08, 3.050617695e-12, 92997.9763, 5.33605661]]}, {start:1000.0, end:6000.0, parameters:[true, [1689726.898, -5986.85466, 9.56503967, -0.002511649459, 6.44303117e-07, -7.18923725e-11, 3.11335207e-15, 130671.0983, -43.3509627]]}, {start:6000.0, end:20000.0, parameters:[true, [-841341956.0, 638150.904, -185.603185, 0.027973536, -2.073321805e-06, 7.39729917e-11, -1.017863944e-15, -4836410.62, 1607.00775]]}],
'Ti': [{start:200.0, end:1000.0, parameters:[true, [-45701.794, 660.809202, 0.429525749, 0.00361502991, -3.54979281e-06, 1.759952494e-09, -3.052720871e-13, 52709.4793, 20.26149738]]}, {start:1000.0, end:6000.0, parameters:[true, [-170478.6714, 1073.852803, 1.181955014, 0.0002245246352, 3.091697848e-07, -5.74002728e-11, 2.927371014e-15, 49780.6991, 17.40431368]]}, {start:6000.0, end:20000.0, parameters:[true, [1152797766.0, -722240.838, 177.7167465, -0.02008059096, 1.221052354e-06, -3.81145208e-11, 4.798092423e-16, 5772614.54, -1518.080466]]}],
'U': [{start:200.0, end:1000.0, parameters:[true, [69657.3775, -1070.351517, 8.07584231, -0.01060034069, 9.25654801e-06, -3.21989976e-09, 4.058048809e-13, 68665.137, -22.40521678]]}, {start:1000.0, end:6000.0, parameters:[true, [-4092498.96, 12748.88349, -12.18707506, 0.00725810568, -7.78777507e-07, -3.84435385e-11, 7.066508567e-15, -16993.72664, 115.5026301]]}, {start:6000.0, end:20000.0, parameters:[true, [-242467681.4, 102249.5503, -2.321762289, -0.000743317746, 9.67499397e-08, -4.15945228e-12, 6.313829223e-17, -813755.928, 73.33489176]]}],
'V': [{start:200.0, end:1000.0, parameters:[true, [-55353.7602, 559.333851, 2.675543482, -0.00624304963, 1.565902337e-05, -1.372845314e-08, 4.16838881e-12, 58206.6436, 9.52456749]]}, {start:1000.0, end:6000.0, parameters:[true, [1200390.3, -5027.0053, 10.58830594, -0.0050443261, 1.488547375e-06, -1.785922508e-10, 8.113013866e-15, 91707.4091, -47.6833632]]}, {start:6000.0, end:20000.0, parameters:[true, [2456040166.0, -1339992.028, 278.1039851, -0.02638937359, 1.303527149e-06, -3.21468033e-11, 3.099999094e-16, 10871520.43, -2439.95438]]}],
'W': [{start:200.0, end:1000.0, parameters:[true, [159522.3922, -2673.843928, 20.60469727, -0.0625231523, 0.0001105654838, -8.45351161e-08, 2.336187771e-11, 113964.8616, -90.118369]]}, {start:1000.0, end:6000.0, parameters:[true, [-8048745.96, 14657.00424, -0.2508531501, -0.002596486992, 1.409225475e-06, -2.233011706e-10, 1.262640862e-14, -3091.130919, 39.5582219]]}, {start:6000.0, end:20000.0, parameters:[true, [1421636486.0, -432536.555, -8.84161507, 0.0164553894, -1.908373835e-06, 8.53048289e-11, -1.360501851e-15, 3994798.75, -12.66418236]]}],
'Xe': [{start:200.0, end:1000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, -745.375, 6.16441993]]}, {start:1000.0, end:6000.0, parameters:[true, [4025.22668, -12.09507521, 2.514153347, -8.24810208e-06, 2.530232618e-09, -3.89233323e-13, 2.360439138e-17, -668.580073, 6.06367644]]}, {start:6000.0, end:20000.0, parameters:[true, [254039745.6, -110537.3774, 13.82644099, 0.001500614606, -3.93535903e-07, 2.765790584e-11, -5.943990574e-16, 928544.383, -110.9834899]]}],
'Zn': [{start:200.0, end:1000.0, parameters:[true, [0.0, 0.0, 2.5, 0.0, 0.0, 0.0, 0.0, 14938.05072, 5.11886101]]}, {start:1000.0, end:6000.0, parameters:[true, [-175559.1489, 498.413924, 1.969386292, 0.0002608808787, -5.62719508e-08, 2.723336049e-12, 4.266685808e-16, 11737.73458, 8.96108565]]}, {start:6000.0, end:20000.0, parameters:[true, [-208728796.2, 157817.8131, -36.2203311, 0.00334523002, -8.56742272e-09, -7.12254474e-12, 1.691187274e-16, -1217847.671, 345.943996]]}],
'Zr': [{start:200.0, end:1000.0, parameters:[true, [67158.9996, -943.598174, 6.35975618, -0.000979011973, -7.60822415e-06, 9.30871743e-09, -3.124675586e-12, 75880.1947, -16.65770522]]}, {start:1000.0, end:6000.0, parameters:[true, [6006771.84, -15669.60605, 17.9698235, -0.00676340965, 1.733678968e-06, -2.064699786e-10, 9.33409261e-15, 173463.6249, -105.1117377]]}, {start:6000.0, end:20000.0, parameters:[true, [520770138.0, -282565.2444, 60.7705435, -0.00508121141, 2.345845819e-07, -6.23721212e-12, 8.010718759e-17, 2351487.351, -509.318306]]}]
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
      {start: 100, end: 400, parameters: [true for 9 polynomial and false for 7, [1,2,3,4,5,6,7,8,9]]},...
    ],
    transport: {
      viscosity: {start: 100, end: 100, parameters: [1,2,3,4]},
      thermalConductivity: {start: 100, end: 100, parameters: [1,2,3,4]},...
    }, // transport is OPTIONAL
    phase: 'gas|condensed'
  }
*/
var seperator = "_";
var IdealSpecies = P(SwiftCalcsObject, function(_, super_) {
  /*
  Ideal Gas species transport functions adapted from Cantera MixtureTransport model
  T, P, are stored as variables inside giac (as var_name_T__in and var_name_P__in), everything else is calculated
  directly here.  set## are used to set T, P, H, S, and TP, etc using direct access
  */
  _.Mw = 1;
  _.id = 0;
  _.mass_i = 1;
  _.moles_i = 1;
  _.transport = false;
  _.mixture = false;
  _.name = '';
  _.title = 'Ideal Substance';
  _.formula = '';

  _.init = function(data, mixture) {
    this.name = data.full_name;
    this.data = data;
    this.mixture = mixture;
    this.setUpAtoms(data.atoms);

    //thermo data
    this.thermo_data = data.polynomials;
    this.phase = data.phase;
    if((this.phase != 'gas') && (typeof data.density === 'function'))
      this.density_i = function() { return data.density };

    if(data.hasOwnProperty('transport')) {
      this.transport = true;
      this.transport_data = data.transport;
    }
  }
  _.getT = function() {
    return this.mixture.getT();
  }
  _.getP = function() {
    var totalP = this.mixture.getP();
    if(this.phase == 'gas') totalP = totalP * this.moles_i / this.mixture.gas_moles(); // Find partial pressure if gas
    return totalP;
  }
  _.setUpAtoms = function(atom_list, reference) {
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
      _this.Mw += _this.mixture.elementTable[element]*number;
      if(!reference) {
        var weight = _this.mixture.referenceSpeciesList[element].hasOwnProperty('weight') ? (number / _this.mixture.referenceSpeciesList[element].weight) : number;
        var reference_name = _this.mixture.referenceSpeciesList[element].hasOwnProperty('name') ? _this.mixture.referenceSpeciesList[element].name : element;
        _this.referenceSpecies.push({weight: weight, parameters: thermoReferenceSpecies[reference_name]});
      }
    }
    this.formula = formula.join("");
    return this;
  }

  _.toString = function() {
    return this.name.replace(/,.*/,'').replace(/ /g, "\\whitespace ").replace(/<sub>([a-z0-9]+)<\/sub>/gi,'_{$1}').replace(/<sup>([a-z0-9/-/+]+)<\/sup>/gi,'^{$1}').replace(/\<\/?[a-z0-9]+\/?\>/gi,'') + ((this.moles_i/this.mixture.moles_i < 1) ? ("\\whitespace \\left(\\percent{" + Math.round(this.moles_i*10000/this.mixture.moles_i)/100 + "}\\right)") : "");
  }
  /*
   NASA polynomials
  */
  _.calcCp = function(data, T) {
    data = this.getThermoData(data, T);
    if(data[0]) return this.calcCp9(data[1], T);
    else return this.calcCp7(data[1], T);
  }
  _.calcEnthalpy = function(data, T) {
    data = this.getThermoData(data, T);
    if(data[0]) return this.calcEnthalpy9(data[1], T);
    else return this.calcEnthalpy7(data[1], T);
  }
  _.calcEntropy = function(data, T, P) {
    data = this.getThermoData(data, T);
    if(data[0]) return this.calcEntropy9(data[1], T, P);
    else return this.calcEntropy7(data[1], T, P);
  }
  // NASA 9 (new form)
  _.calcCp9 = function(data, T) {
    return this.mixture.GasConstant * (data[0]/(Math.pow(T,2)) + data[1]/T + data[2] + data[3]*T + data[4]*Math.pow(T,2) + data[5]*Math.pow(T,3) + data[6]*Math.pow(T,4));
  }
  _.calcEnthalpy9 = function(data, T) {
    return this.mixture.GasConstant * T * (-1*data[0]/(Math.pow(T,2)) + data[1] * Math.log(T)/T + data[2] + data[3]*T/2 + data[4]*(Math.pow(T,2))/3 + data[5]*(Math.pow(T,3))/4 + data[6]*(Math.pow(T,4))/5 + data[7]/T);
  }
  _.calcEntropy9 = function(data, T, P) {
    return this.mixture.GasConstant * (-1*data[0]/(2*Math.pow(T,2)) - data[1]/T + data[2]*Math.log(T) + data[3]*T + data[4]*(Math.pow(T,2))/2 + data[5]*(Math.pow(T,3))/3 + data[6]*(Math.pow(T,4))/4 + data[8]) - this.mixture.GasConstant * Math.log(P / 100000);
  }
  // NASA 7 (old form)
  _.calcCp7 = function(data, T) {
    return this.mixture.GasConstant * (((((data[4])*T + data[3])*T + data[2])*T + data[1])*T + data[0]);
  }
  _.calcEnthalpy7 = function(data, T) {
    return this.mixture.GasConstant * T * (data[5] / T + ((((data[4]/5)*T + data[3]/4)*T + data[2]/3)*T + data[1]/2)*T + data[0]);
  }
  _.calcEntropy7 = function(data, T) {
    return this.mixture.GasConstant * (data[6] + ((((data[4]/4)*T + data[3]/3)*T + data[2]/2)*T + data[1])*T + data[0]*Math.log(T));
  }
  /*
  Species Thermo Property Getters.  All are mole specific by default
  */
  _.moleFraction = function() { 
    return this.moles_i / this.mixture.moles_i;
  }
  _.massFraction = function() { 
    return this.mass_i / this.mixture.mass_i;
  }
  // J/K{kg|mol}
  _.Cv_i = function(mass_specific) {
    if(this.phase != 'gas') return this.Cp_i(mass_specific);
    var cv_mole = this.Cp_i()*1000 - this.mixture.GasConstant;
    if(mass_specific === true) return (cv_mole / this.Mw);
    return cv_mole/1000;
  }
  // J/K{kg|mol}
  _.Cp_i = function(mass_specific) { 
    var T = this.getT();
    var cp_mole = this.calcCp(this.thermo_data,T);
    if(mass_specific === true) return (cp_mole / this.Mw);
    return cp_mole/1000;
  }
  // J/{kg|mol}
  _.enthalpy_i = function(mass_specific) {
    var T = this.getT();
    var h_mole = this.calcEnthalpy(this.thermo_data, T);
    if(mass_specific === true) return (h_mole / this.Mw);
    return h_mole/1000;
  }
  // J/K{kg|mol}
  _.entropy_i = function(mass_specific) { 
    var T = this.getT();
    var s_mole = this.calcEntropy(this.thermo_data, T, this.getP());
    if(mass_specific === true) return (s_mole / this.Mw);
    return s_mole/1000;
  }
  // J/{kg|mol}
  _.internalEnergy_i = function(mass_specific) {
    if(this.phase == "gas")
      var u_mass = this.enthalpy_i(true) - this.getP() * this.specificVolume_i();
    else
      var u_mass = this.enthalpy_i(true); // Cp == Cv for solids/liquids, so CpdT = CvdT
    if(mass_specific === true) return u_mass;
    return (u_mass * this.Mw)/1000;
  }
  // J/{kg|mol}
  _.gibbs_i = function(mass_specific) {
    var g_mole = this.enthalpy_i() - this.getT() * this.entropy_i();
    if(mass_specific === true) return (g_mole*1000 / this.Mw);
    return g_mole;
  }
  // J/{kg|mol}
  _.enthalpyFormation_i = function(mass_specific) {
    var hf_mole = this.enthalpy_i();
    var _this = this;
    var T = this.getT();
    for(var i in this.referenceSpecies) {
      if (!this.referenceSpecies.hasOwnProperty(i)) continue;
      var species = this.referenceSpecies[i];
      hf_mole -= species.weight * this.calcEnthalpy(species.parameters, T)/1000;
    }
    if(mass_specific === true) return (hf_mole*1000 / this.Mw);
    return hf_mole;
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
      gf_mole -= species.weight * (this.calcEnthalpy(species.parameters, T) - T * this.calcEntropy(species.parameters, T, P))/1000;
    }
    if(mass_specific === true) return (gf_mole*1000 / this.Mw);
    return gf_mole;
  }
  _.logK = function() {
    return (this.gibbsFormation_i() / (-1 * this.getT() * this.mixture.GasConstant / 1000 / Math.LOG10E)) + "";
  }
  _.gas_moles = function() {
    if(this.phase == 'gas') return this.moles_i;
    return 0;
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
  _.density_i = function() {
    if(this.phase != 'gas')
      this.setError('Species is a condensed phase and density was not loaded.');
    return (this.getP() * this.Mw) / (this.mixture.GasConstant * this.getT());
  }
  // [m^3 / kg]
  _.specificVolume_i = function() {
    return 1 / this.density_i();
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
  _.setError = function(err) {
    return this.mixture.setError(err);
  }

});

/*
Mixture is a collection of Species, and is the object we interact with in Swift Calcs UI.  
Pass to the initializer:
list of species, in form [{quantity: xxx, data: data}, ...], where 'quantity' is the moles or mass of the substance, and 'data' is the data expected by the species initializer
var_name: The variable name used in SC
*/

var Mixture = P(SwiftCalcsObject, function(_, super_) {
  /*
  T, P, are stored as variables inside giac (as var_name_T__in and var_name_P__in), everything else is calculated
  directly here.  set## are used to set T, P, H, S, and TP, etc using direct access
  */
  _.id = 0;
  _.mass_i = 0; 
  _.moles_i = 0; 
  _.Mw = 0;
  _.transport = false;
  _.title = 'Mixture';

  _.init = function(data, var_name) {
    this.var_name = var_name;
    this.data = data;
    this.set_TP(298.15, 101325);
    this.species = [];
    this.setUpMixture(data);
    this.propertyList = ['h','s','g','T','P','u','v','m','M','n','k','mu','h_mole','s_mole','g_mole','u_mole','v_gas', 'rho', 'rho_gas', 'H','S','G','U','V','V_gas','entropy', 'entropy_mole', 'Entropy', 'enthalpy', 'enthalpy_mole', 'Enthalpy', 'gamma', 'Cp', 'Cp_mole', 'Cv', 'Cv_mole','specificVolume', 'specificVolume_gas', 'Volume', 'Volume_gas', 'density', 'density_gas', 'pressure', 'temperature', 'molecularMass', 'gibbs', 'gibbs_mole', 'Gibbs','internalEnergy', 'internalEnergy_mole', 'InternalEnergy','logK', 'gF', 'gF_mole','GF','gibbsFormation', 'gibbsFormation_mole', 'GibbsFormation', 'hF', 'hF_mole', 'HF','enthalpyFormation', 'enthalpyFormation_mole', 'EnthalpyFormation', 'dhF298', 'dhF298_mole', 'dHF298', 'hF298', 'hF298_mole', 'HF298', 'enthalpyFormation298', 'enthalpyFormation298_mole', 'EnthalpyFormation298', 'thermalConductivity','viscosity','mass','moles', 's_v', 'entropy_v', 'S_v', 'Entropy_v'];
    this.methodList = [];
  }
  // Deep clone...we need this to replicate myself in the scope
  _.clone = function(new_var) {
    var mix = new Mixture(this.name, this.data, new_var);
    mix.set_TP(this.getT(), this.getP());
    return mix;
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
  _.setUpMixture = function(mix_list) {
    //atoms: Use to find molecular weight
    //also find reference species that make this up, and add to an array
    for(var i = 0; i < mix_list.length; i++) {
      // Update to allow for things other than IdealSpecies in the future?
      species = new IdealSpecies(mix_list[i].data, this);
      var unit = Module.caseval("mksa_base(evalf(" + mix_list[i].quantity + "))").trim();
      var valu = Module.caseval("mksa_remove(evalf(" + mix_list[i].quantity + "))").trim();
      if(!valu.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        this.setError("Invalid Quantity for " + species.name + ": Quanitity did not evaluate to a real number.");
      else if(unit == "1_kg") 
        species.moles_i = 1000*valu/species.Mw;
      else if(unit == "1_mol")
        species.moles_i = valu*1;
      else
        this.setError("Invalid Quantity for " + species.name + ": Expecting units of moles or mass (mol, kg, lb)");
      species.mass_i = (species.moles_i * species.Mw)/1000;
      this.moles_i += species.moles_i;
      this.mass_i += species.mass_i;
      this.species.push(species);
    }
    this.Mw = 0; // Find mixture mW
    for(var i = 0; i < this.species.length; i++)
      this.Mw += this.species[i].Mw * this.species[i].moleFraction();
    return this;
  }
  _.commandSpecies = function(command, option) {
    var out = 0;
    for(var i = 0; i < this.species.length; i++)
      out += this.species[i][command](option);
    return out;
  }
  _.commandSpeciesByMole = function(command, mass_specific) {
    var out = 0;
    for(var i = 0; i < this.species.length; i++)
      out += this.species[i][command](mass_specific) * (mass_specific ? this.species[i].massFraction() : this.species[i].moleFraction());
    return out;
  }

  _.toString = function() {
    var line1 = [];
    for(var i = 0; i < this.species.length; i++)
      line1.push(this.species[i].toString());
    var output = [["\\mathbf{\\underline{" + Math.round(this.moles_i*100)/100 + "\\Unit{mol}\\whitespace of\\whitespace " + line1.join(",\\whitespace ") + "}}"]];
    output.push(["T:\\whitespace \\whitespace " + Module.caseval("latex(usimplify(" + this.var_name + seperator + "T__in))")]);
    output.push(["P:\\whitespace \\whitespace " + Module.caseval("latex(usimplify(" + this.var_name + seperator + "P__in))")]);
    output.push(["\\textcolor{#aaaaaa}{see\\whitespace help\\whitespace documentation\\whitespace for}"])
    output.push(["\\textcolor{#aaaaaa}{list\\whitespace of\\whitespace properties\\whitespace and\\whitespace methods}"])
    return toTable(output);
  }

  _.Mw_gas = function() {
    // Molecular weight only of items in the gas phase
    var out = 0;
    var gas_moles = this.gas_moles();
    for(var i = 0; i < this.species.length; i++)
      out += this.species[i].Mw * this.species[i].gas_moles() / gas_moles;
    return out;
  }
  _.gas_moles = function() {
    var out = 0;
    for(var i = 0; i < this.species.length; i++)
      out += this.species[i].gas_moles();
    return out;
  }
  /*
  Species Thermo Property Setters
  */
  // Multi-set
  _.set_TP = function(temperature, pressure) {
    if((typeof temperature === "string") && (typeof pressure === "undefined")) {
      temperature = temperature.trim().substr(1,temperature.trim().length - 2);
      temperature = temperature.split(",");
      pressure = temperature[1];
      temperature = temperature[0];
    }
    temperature = this.set_T(temperature)
    pressure = this.set_P(pressure);
    if((typeof temperature === "string") && (typeof pressure === "string"))
      return "[" + temperature + "," + pressure + "]";
    else
      return '';
  }
  _.set_hP = function(enthalpy, pressure) {
    if((typeof enthalpy === "string") && (typeof pressure === "undefined")) {
      enthalpy = enthalpy.trim().substr(1,enthalpy.trim().length - 2);
      enthalpy = enthalpy.split(",");
      pressure = enthalpy[1];
      enthalpy = enthalpy[0];
    }
    pressure = this.set_P(pressure);
    enthalpy = this.set_Enthalpy(enthalpy);
    if((typeof enthalpy === "string") && (typeof pressure === "string"))
      return "[" + enthalpy + "," + pressure + "]";
    else
      return '';
  }
  _.set_sP = function(entropy, pressure) {
    if((typeof entropy === "string") && (typeof pressure === "undefined")) {
      entropy = entropy.trim().substr(1,entropy.trim().length - 2);
      entropy = entropy.split(",");
      pressure = entropy[1];
      entropy = entropy[0];
    }
    pressure = this.set_P(pressure);
    entropy = this.set_Entropy(entropy);
    if((typeof entropy === "string") && (typeof pressure === "string"))
      return "[" + entropy + "," + pressure + "]";
    else
      return '';
  }
  _.set_sv = function(entropy, specific_volume) {
    if((typeof entropy === "string") && (typeof specific_volume === "undefined")) {
      entropy = entropy.trim().substr(1,entropy.trim().length - 2);
      entropy = entropy.split(",");
      specific_volume = entropy[1];
      entropy = entropy[0];
    }
    specific_volume = this.set_specificVolume(specific_volume);
    entropy = this.set_entropy_v(entropy)
    if((typeof entropy === "string") && (typeof specific_volume === "string"))
      return "[" + entropy + "," + specific_volume + "]";
    else
      return '';
  }
  _.set_uv = function(energy, specific_volume) {
    if((typeof temperature === "string") && (typeof specific_volume === "undefined")) {
      energy = energy.trim().substr(1,energy.trim().length - 2);
      energy = energy.split(",");
      specific_volume = energy[1];
      energy = energy[0];
    }
    specific_volume = this.set_specificVolume(specific_volume);
    energy = this.set_InternalEnergy(energy);
    if((typeof energy === "string") && (typeof specific_volume === "string"))
      return "[" + energy + "," + specific_volume + "]";
    else
      return '';
  }
  // Single
  _.set_T = _.set_temperature = function(temperature) {
    if(typeof temperature === "string") {
      if(Module.caseval("mksa_base(evalf(" + temperature + "))").trim() != "1_K") 
        return this.setError("Incompatible Units.  Expecting Temperature units (Kelvin)");
    } else
      temperature = temperature + "_K";
    Module.caseval(this.var_name + seperator + "T__in:=" + temperature);
    return temperature;
  }
  _.set_P = _.set_pressure = function(pressure) {
    if(typeof pressure === "string") {
      if(Module.caseval("mksa_base(evalf(" + pressure + "))").trim() != "1_(kg*m^-1.0*s^-2.0)") 
        return this.setError("Incompatible Units.  Expecting Pressure units (Pascal)");
    } else
      pressure = pressure + "_Pa";
    Module.caseval(this.var_name + seperator + "P__in:=" + pressure);
    return pressure;
  }
  _.set_rho = _.set_density = function(rho) {
    if(typeof rho === "string") {
      if(Module.caseval("mksa_base(evalf(" + rho + "))").trim() != "1_(kg*m^-3.0)") 
        return this.setError("Incompatible Units.  Expecting Density units (mass/volume)");
      rho = Module.caseval("mksa_remove(evalf(" + rho + "))").trim();
      if(!rho.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        return this.setError("Input did not evaluate to a real number");
      rho = rho*1;
    } 
    this.set_specificVolume(1/rho);
    return "1/(" + rho + ")*(_kg*_m^-3.0)";
  }
  _.set_v = _.set_specificVolume = function(v) {
    if(typeof v === "string") {
      if(Module.caseval("mksa_base(evalf(" + v + "))").trim() != "1_(kg^-1.0*m^3.0)") 
        return this.setError("Incompatible Units.  Expecting specific volume units (volume/mass)");
      v = Module.caseval("mksa_remove(evalf(" + v + "))").trim();
      if(!v.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        return this.setError("Input did not evaluate to a real number");
      v = v*1;
    } 
    var Mw_gas = this.Mw_gas();
    if(Mw_gas == 0) return this.setError("Mixture has no species in the gas phase");
    this.set_P((this.GasConstant * this.getT()) / (Mw_gas * v));
    return "(" + v + ")*(_m^3.0/_kg)";
  }
  _.set_V = _.set_Volume = function(v) {
    if(typeof v === "string") {
      if(Module.caseval("mksa_base(evalf(" + v + "))").trim() != "1_(m^3.0)") 
        return this.setError("Incompatible Units.  Expecting volume units");
      v = Module.caseval("mksa_remove(evalf(" + v + "))").trim();
      if(!v.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        return this.setError("Input did not evaluate to a real number");
      v = v*1;
    } 
    var Mw_gas = this.Mw_gas();
    if(Mw_gas == 0) return this.setError("Mixture has no species in the gas phase");
    return this.set_specificVolume(v / (this.gas_moles() * Mw_gas * 1000));
  }
  _.set_H = _.set_Enthalpy = _.set_h = _.set_enthalpy = function(enthalpy) {
    // To set enthalpy, we hold P constant at current pressure, then vary T until we have an enthalpy equal to the desired value
    // Utilize a newton-raphson iteration to converge on the final value.  Guess is taken as the current setpoint
    var mass_specific = false;
    if(typeof enthalpy === "string") {
      var unit = Module.caseval("mksa_base(evalf(" + enthalpy + "))").trim();
      if(unit == "1_(m^2.0*s^-2.0)") 
        mass_specific = true;
      else if(unit == "1_(kg*m^2.0*s^-2.0*mol^-1.0)")
        mass_specific = false;
      else if(unit == "1_(kg*m^2.0*s^-2.0)") {
        enthalpy = "(" + enthalpy + ")/(" + this.moles_i + "_mol)";
        mass_specific = false;
      } else
        return this.setError("Incompatible Units.  Expecting specific enthalpy units (J or J/kg or J/mol)");
      enthalpy = Module.caseval("mksa_remove(evalf(" + enthalpy + "))").trim();
      if(!enthalpy.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        return this.setError("Input did not evaluate to a real number (" + enthalpy + ")");
      enthalpy = enthalpy*1;
    } 
    var _this = this;
    this.set_T(this.rootFinder(this.getT(), function(guess) {
      _this.set_T(guess);
      return (_this.enthalpy_i(mass_specific) - enthalpy);
    }));
    return "(" + enthalpy + (mass_specific ? ")*(_J/_kg)" : ")*(_J/_mol)");
  }
  _.set_G = _.set_Gibbs = _.set_g = _.set_gibbs = function(gibbs) {
    // To set Gibbs, we hold P constant at current pressure, then vary T until we have a gibbs value equal to the desired value
    // Utilize a newton-raphson iteration to converge on the final value.  Guess is taken as the current setpoint
    var mass_specific = false;
    if(typeof gibbs === "string") {
      var unit = Module.caseval("mksa_base(evalf(" + gibbs + "))").trim();
      if(unit == "1_(m^2.0*s^-2.0)") 
        mass_specific = true;
      else if(unit == "1_(kg*m^2.0*s^-2.0*mol^-1.0)")
        mass_specific = false;
      else if(unit == "1_(kg*m^2.0*s^-2.0)") {
        gibbs = "(" + gibbs + ")/(" + this.moles_i + "_mol)";
        mass_specific = false;
      } else
        return this.setError("Incompatible Units.  Expecting specific gibbs units (J or J/kg or J/mol)");
      gibbs = Module.caseval("mksa_remove(evalf(" + gibbs + "))").trim();
      if(!gibbs.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        return this.setError("Input did not evaluate to a real number (" + gibbs + ")");
      gibbs = gibbs*1;
    } 
    var _this = this;
    this.set_T(this.rootFinder(this.getT(), function(guess) {
      _this.set_T(guess);
      return (_this.gibbs_i(mass_specific) - gibbs);
    }));
    return "(" + gibbs + (mass_specific ? ")*(_J/_kg)" : ")*(_J/_mol)");
  }
  _.set_s = _.set_entropy = _.set_S = _.set_Entropy = function(entropy) {
    // To set entropy, we hold P constant at current pressure, then vary T until we have an entropy equal to the desired value
    // Utilize a newton-raphson iteration to converge on the final value.  Guess is taken as the current setpoint
    var mass_specific = false;
    if(typeof entropy === "string") {
      var unit = Module.caseval("mksa_base(evalf(" + entropy + "))").trim();
      if(unit == "1_(m^2.0*s^-2.0*K^-1.0)") 
        mass_specific = true;
      else if(unit == "1_(kg*m^2.0*s^-2.0*K^-1.0*mol^-1.0)")
        mass_specific = false;
      else if(unit == "1_(kg*m^2.0*s^-2.0*K^-1.0)") {
        entropy = "(" + entropy + ")/(" + this.moles_i + "_mol)";
        mass_specific = false;
      } else
        return this.setError("Incompatible Units.  Expecting specific entropy units (J/K or J/(kg K) or J/(mol K))");
      entropy = Module.caseval("mksa_remove(evalf(" + entropy + "))").trim();
      if(!entropy.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        return this.setError("Input did not evaluate to a real number");
      entropy = entropy*1;
    } 
    var _this = this;
    this.set_T(this.rootFinder(this.getT(), function(guess) {
      _this.set_T(guess);
      return (_this.entropy_i(mass_specific) - entropy);
    }));
    return "(" + entropy + (mass_specific ? ")*(_J/_kg/_K)" : ")*(_J/_mol/_K)");
  }
  _.s_v = _.entropy_v = _.S_v = _.Entropy_v = function() {
    return this.error("Function is used to set entropy at constant specific volume.  To find entropy, use the 's' or 'entropy' commands.");
  }
  _.set_s_v = _.set_entropy_v = _.set_S_v = _.set_Entropy_v = function(entropy) {
    // To set entropy, we hold v constant at current specific volume, then vary T until we have an entropy equal to the desired value
    // Utilize a newton-raphson iteration to converge on the final value.  Guess is taken as the current setpoint
    var mass_specific = false;
    if(typeof entropy === "string") {
      var unit = Module.caseval("mksa_base(evalf(" + entropy + "))").trim();
      if(unit == "1_(m^2.0*s^-2.0*K^-1.0)") 
        mass_specific = true;
      else if(unit == "1_(kg*m^2.0*s^-2.0*K^-1.0*mol^-1.0)")
        mass_specific = false;
      else if(unit == "1_(kg*m^2.0*s^-2.0*K^-1.0)") {
        entropy = "(" + entropy + ")/(" + this.moles_i + "_mol)";
        mass_specific = false;
      } else
        return this.setError("Incompatible Units.  Expecting specific entropy units (J/K or J/(kg K) or J/(mol K))");
      entropy = Module.caseval("mksa_remove(evalf(" + entropy + "))").trim();
      if(!entropy.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        return this.setError("Input did not evaluate to a real number");
      entropy = entropy*1;
    } 
    var _this = this;
    if(this.Mw_gas() == 0) return this.setError("No gas phase present in mixture, cannot set a specific volume");
    this.set_T(this.rootFinder(this.getT(), function(guess) {
      var curV = _this.specificVolume_i(true);
      _this.set_T(guess);
      _this.set_specificVolume(curV);
      return (_this.entropy_i(mass_specific) - entropy);
    }));
    return "(" + entropy + (mass_specific ? ")*(_J/_kg/_K)" : ")*(_J/_mol/_K)");
  }
  _.set_u = _.set_internalEnergy = _.set_U = _.set_InternalEnergy = function(energy) {
    // To set entropy, we hold v constant at current specific volume, then vary T until we have an energy equal to the desired value
    // Utilize a newton-raphson iteration to converge on the final value.  Guess is taken as the current setpoint
    var mass_specific = false;
    if(typeof energy === "string") {
      var unit = Module.caseval("mksa_base(evalf(" + energy + "))").trim();
      if(unit == "1_(m^2.0*s^-2.0)") 
        mass_specific = true;
      else if(unit == "1_(kg*m^2.0*s^-2.0*mol^-1.0)")
        mass_specific = false;
      else if(unit == "1_(kg*m^2.0*s^-2.0)") {
        energy = "(" + energy + ")/(" + this.moles_i + "_mol)";
        mass_specific = false;
      } else
        return this.setError("Incompatible Units.  Expecting specific energy units (J or J/kg or J/mol)");
      energy = Module.caseval("mksa_remove(evalf(" + energy + "))").trim();
      if(!energy.match(/^\-?[0-9\.]+(\e[\-\+]?[0-9\.]+)?$/))
        return this.setError("Input did not evaluate to a real number");
      energy = energy*1;
    } 
    var _this = this;
    if(this.Mw_gas() == 0) return this.setError("No gas phase present in mixture, cannot set a specific volume");
    this.set_T(this.rootFinder(this.getT(), function(guess) {
      var curV = _this.specificVolume_i(true);
      _this.set_T(guess);
      _this.set_specificVolume(curV);
      return (_this.internalEnergy_i(mass_specific) - energy);
    }));
    return "(" + energy + (mass_specific ? ")*(_J/_kg)" : ")*(_J/_mol)");
  }
  // Saturation
  _.set_saturatedT = function() {
    this.setError('This fluid does not have saturation properties loaded.');
  }
  _.set_saturatedP = function() {
    this.setError('This fluid does not have saturation properties loaded.');
  }
  /*
  Species Thermo Property Getters.  All are mole specific by default
  */
  // J/K{kg|mol}
  _.Cv_i = function(mass_specific) {
    return this.commandSpeciesByMole('Cv_i', mass_specific);
  }
  _.Cv = function() {
    return "(" + this.Cv_i(true) + ")*(_J/_kg/_K)";
  }
  _.Cv_mole = function() {
    return "(" + this.Cv_i(false) + ")*(_J/_mol/_K)";
  }
  // J/K{kg|mol}
  _.Cp_i = function(mass_specific) { 
    return this.commandSpeciesByMole('Cp_i', mass_specific);
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
  _.enthalpy_i = function(mass_specific) { 
    return this.commandSpeciesByMole('enthalpy_i', mass_specific);
  }
  _.h = _.enthalpy = function() {
    return "(" + this.enthalpy_i(true) + ")*(_J/_kg)";
  }
  _.h_mole = _.enthalpy_mole = function() {
    return "(" + this.enthalpy_i(false) + ")*(_J/_mol)";
  }
  _.H = _.Enthalpy = function() {
    return "(" + this.enthalpy_i(false)*this.moles_i + ")*(_J)";
  }
  // J/K{kg|mol}
  _.entropy_i = function(mass_specific) { 
    return this.commandSpeciesByMole('entropy_i', mass_specific);
  }
  _.s = _.entropy = function() {
    return "(" + this.entropy_i(true) + ")*(_J/_K/_kg)";
  }
  _.s_mole = _.entropy_mole = function() {
    return "(" + this.entropy_i(false) + ")*(_J/_K/_mol)";
  }
  _.S = _.Entropy = function() {
    return "(" + this.entropy_i(false)*this.moles_i + ")*(_J/_K)";
  }
  // J/{kg|mol}
  _.internalEnergy_i = function(mass_specific) {
    return this.commandSpeciesByMole('internalEnergy_i', mass_specific);
  }
  _.u = _.internalEnergy = function() {
    return "(" + this.internalEnergy_i(true) + ")*(_J/_kg)";
  }
  _.u_mole = _.internalEnergy_mole = function() {
    return "(" + this.internalEnergy_i(false) + ")*(_J/_mol)";
  }
  _.U = _.InternalEnergy = function() {
    return "(" + this.internalEnergy_i(false)*this.moles_i + ")*(_J)";
  }
  // J/{kg|mol}
  _.gibbs_i = function(mass_specific) {
    return this.commandSpeciesByMole('gibbs_i', mass_specific);
  }
  _.g = _.gibbs = function() {
    return "(" + this.gibbs_i(true) + ")*(_J/_kg)";
  }
  _.g_mole = _.gibbs_mole = function() {
    return "(" + this.gibbs_i(false) + ")*(_J/_mol)";
  }
  _.G = _.Gibbs = function() {
    return "(" + this.gibbs_i(false)*this.moles_i + ")*(_J)";
  }
  // J/{kg|mol}
  _.enthalpyFormation298_i = function(mass_specific) {
    var curT = this.getT();
    this.set_T(298.15);
    var hf298_mole = this.enthalpyFormation_i();
    this.set_T(curT);
    if(mass_specific === true) return (hf298_mole*1000 / this.Mw);
    return hf298_mole;
  }
  _.hF298 = _.enthalpyFormation298 = function() {
    return "(" + this.enthalpyFormation298_i(true) + ")*(_J/_kg)";
  }
  _.hF298_mole = _.enthalpyFormation298_mole = function() {
    return "(" + this.enthalpyFormation298_i(false) + ")*(_J/_mol)";
  }
  _.HF298 = _.EnthalpyFormation298 = function() {
    return "(" + this.enthalpyFormation298_i(false)*this.moles_i + ")*(_J)";
  }
  // J/{kg|mol}
  _.dhF298_i = function(mass_specific) {
    var h_diff_mole = this.enthalpy_i() - this.enthalpyFormation298_i();
    if(mass_specific === true) return (h_diff_mole*1000 / this.Mw);
    return h_diff_mole;
  }
  _.dhF298 = function() {
    return "(" + this.dhF298_i(true) + ")*(_J/_kg)";
  }
  _.dhF298_mole = function() {
    return "(" + this.dhF298_i(false) + ")*(_J/_mol)";
  }
  _.dHF298 = _.EnthalpyFormation298 = function() {
    return "(" + this.dhF298_i(false)*this.moles_i + ")*(_J)";
  }
  // J/{kg|mol}
  _.enthalpyFormation_i = function(mass_specific) {
    return this.commandSpeciesByMole('enthalpyFormation_i', mass_specific);
  }
  _.hF = _.enthalpyFormation = function() {
    return "(" + this.enthalpyFormation_i(true) + ")*(_J/_kg)";
  }
  _.hF_mole = _.enthalpyFormation_mole = function() {
    return "(" + this.enthalpyFormation_i(false) + ")*(_J/_mol)";
  }
  _.HF = _.EnthalpyFormation = function() {
    return "(" + this.enthalpyFormation_i(false)*this.moles_i + ")*(_J)";
  }
  // J/{kg|mol}
  _.gibbsFormation_i = function(mass_specific) {
    return this.commandSpeciesByMole('gibbsFormation_i', mass_specific);
  }
  _.gF = _.gibbsFormation = function() {
    return "(" + this.gibbsFormation_i(true) + ")*(_J/_kg)";
  }
  _.gF_mole = _.gibbsFormation_mole = function() {
    return "(" + this.gibbsFormation_i(false) + ")*(_J/_mol)";
  }
  _.GF = _.GibbsFormation = function() {
    return "(" + this.gibbsFormation_i(false)*this.moles_i + ")*(_J)";
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
  _.m = _.mass = function() {
    return "(" + this.mass_i + ")*_kg";
  }
  _.n = _.moles = function() {
    return "(" + this.moles_i + ")*_mol";
  }
  // Multi-get
  _.TP = function() {
    return "[" + this.T + "," + this.P + "]";
  }
  _.hP = function() {
    return "[" + this.h + "," + this.P + "]";
  }
  _.sP = function() {
    return "[" + this.s + "," + this.P + "]";
  }
  _.sv = function() {
    return "[" + this.s + "," + this.v + "]";
  }
  _.uv = function() {
    return "[" + this.u + "," + this.v + "]";
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
  // Mixture Density [kg/m^3]
  _.density_i = function() {
    var m3 = 0;
    for(var i = 0; i < this.species.length; i++)
      m3 += this.species[i].mass_i / this.species[i].density_i();
    return this.mass_i / m3;
  }
  // Gas Density (ideal gas - other phases overwrite this in init), [kg/m^3]
  _.density_gas_i = function() {
    if(this.Mw_gas() == 0)
      this.setError('Mixture has no species in the gas phase.');
    return (this.getP() * this.Mw_gas()) / (this.GasConstant * this.getT());
  }
  _.rho = _.density = function() {
    return "(" + this.density_i() + ")*(_kg/_m^3)";
  }
  _.rho_gas = _.density_gas = function() {
    return "(" + this.density_gas_i() + ")*(_kg/_m^3)";
  }
  // [m^3 / kg]
  _.specificVolume_i = function() {
    return 1 / this.density_i();
  }
  _.v = _.specificVolume = function() {
    return "(" + this.specificVolume_i() + ")*(_m^3/_kg)";
  }
  _.specificVolume_gas_i = function() {
    return 1 / this.density_gas_i();
  }
  _.v_gas = _.specificVolume_gas = function() {
    return "(" + this.specificVolume_gas_i() + ")*(_m^3/_kg)";
  }
  _.V = _.Volume = function() {
    return "(" + this.specificVolume_i*this.mass + ")*(_m^3)";
  }
  _.V_gas = _.Volume_gas = function() {
    return "(" + this.specificVolume_gas_i*this.gas_moles()*this.Mw_gas()*1000 + ")*(_m^3)";
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
  _.referenceSpeciesList = {Ag:{}, Al:{}, Ar:{}, B:{}, Ba:{}, Be:{}, Br:{weight:2, name: 'Br2'}, C:{name:'C(gr)', }, Ca:{}, Cd:{}, Cl:{weight:2, name: 'Cl2'}, Co:{}, Cr:{}, Cs:{}, Cu:{}, E:{}, F:{weight:2, name: 'F2'}, Fe:{}, Ge:{}, H:{weight:2, name: 'H2'}, He:{}, Hg:{}, I:{weight:2, name: 'I2'}, K:{}, Kr:{}, Li:{}, Mg:{}, Mn:{}, Mo:{}, N:{weight:2, name: 'N2'}, Na:{}, Nb:{}, Ne:{}, Ni:{}, O:{weight:2, name: 'O2'}, P:{}, Pb:{}, Rb:{}, S:{}, Si:{}, Sn:{}, Sr:{}, Ta:{}, Ti:{}, U:{}, V:{}, W:{}, Xe:{}, Zn:{}, Zr:{}};
  // Universal Gas Constant. [J/kmol/K]
  _.GasConstant = 8314.4621;

});

var setMaterial = function(data) {
  if(data.last_name.length > 0)
    destroyConstant(data.last_name);
  if(!data.var_name.match(/^[a-z][a-z0-9]*(_[a-z][a-z0-9]*)?$/))
    return {success: false, returned: "Invalid variable name.  Please enter a valid variable name."};
  if(constants[data.var_name])
    return {success: false, returned: "Please choose another variable name, an object has already been assigned to this variable."};
  switch(data.data_type) {
    case 1: // Solid material
      newConstant(data.var_name, Material(data.data));
      break;
    case 2: // Ideal Species
      newConstant(data.var_name, Mixture(data.data, data.var_name));
      break;
  }
  if(constants[data.var_name].error)
    return {success: false, returned: constants[data.var_name].error};
  return {success: true, returned: '1'};
}

