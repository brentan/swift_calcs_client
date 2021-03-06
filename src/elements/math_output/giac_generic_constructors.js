/* Use the giac_generic class, along with the createGiacElement constructor,
   to create many of the basic giac function blocks that don't require special
   controls (such as solve does) */

createGiacElement({
	name: 'fft',
	code: 'fourier transform',
	helpText: '<<fourier transform <[DATA]>>>\nCompute the discrete fourier transform of the array provided.  If the number of elements in DATA is a power of 2, a fast fourier transform routine is used to increase computation speed.',
	content: [ 
		"<<MathQuill {ghost: 'array'}>>",
	],
	command: "fft($1)" 
});
createGiacElement({
	name: 'matrix',
	code: 'matrix',
	helpText: '<<matrix>> of size <[rows]> by <[cols]>\nwhere value(r,c)=<[EXPR]>\nCreate a matrix of size rows by cols, where each element is equal to the expression provided based on its position.  Keep in mind Swift Calcs is zero-indexed, so the first row and first column provided r and c of 0\nHELP:24',
	content: [ 
		"of size <<MathQuill {ghost: 'rows'}>> by <<MathQuill {ghost: 'columns'}>>",
		"where el[r,c] is <<MathQuill {ghost: 'expression for element at row r and column c'}>>",
	],
	command: "matrix(exact($1),exact($2),(r,c)->($3))",
	no_approx: true,
	no_algebra: true
});
createGiacElement({
	name: 'pfactor',
	code: 'prime factorization',
	helpText: '<<prime factorization <[NUMBER]>>>\nCompute the prime factors of the integer provided.',
	content: [ 
		"<<MathQuill {ghost: 'number'}>>",
	],
	command: "latex(ifactor($1))",
	nomarkup: true,
	no_approx: true,
	no_algebra: true
});
createGiacElement({
	name: 'ifft',
	code: 'inverse fourier transform',
	helpText: '<<inverse fourier transform <[DATA]>>>\nCompute the inverse fourier transform of the array provided.',
	content: [ 
		"<<MathQuill {ghost: 'array'}>>",
	],
	command: "ifft($1)" 
});
createGiacElement({
	name: 'laplace',
	code: 'laplace transform',
	helpText: '<<laplace <[EXPR]> for <[VAR]>>>\nFinds the laplace transform for the expression EXPR with variable VAR.  Result will have variable s.',
	content: [ 
		" of <<MathQuill {ghost: 'expression'}>>",
		"for <<MathQuill {ghost: 'variable', variableEntryField: true }>>"
	],
	command: "laplace($1, $2, 'x')", 
	protect_vars: 2,
	returns_function: 's'
});
createGiacElement({
	name: 'ilaplace',
	code: 'inverse laplace transform',
	helpText: '<<ilaplace <[EXPR]> for <[VAR]>>>\nFinds the laplace transform for the expression EXPR with variable VAR.  Result will have variable x.',
	content: [ 
		" of <<MathQuill {ghost: 'expression'}>>",
		"for <<MathQuill {ghost: 'variable', variableEntryField: true }>>"
	],
	command: "ilaplace($1, $2, 'x')", 
	protect_vars: 2,
	returns_function: 'x'
});
createGiacElement({
	name: 'fouriera',
	code: 'fourier coefficient a',
	helpText: '<<fourier a <[EXPR]> for <[VAR]>, period <[T]>, lower bound <[BOUND]>>>\nFinds the expression for the fourier coefficients a<sub>n</sub> for the expression EXPR with variable VAR, period T, and boundes BOUND to BOUND+T.',
	content: [ 
		" of <<MathQuill {ghost: 'expression'}>>",
		"for <<MathQuill {ghost: 'variable', variableEntryField: true }>>",
		"with period of <<MathQuill {ghost: 'T' }>>",
		"and lower bound <<MathQuill {ghost: '0', default: '0' }>>",
	],
	pre_command: "assume('x', DOM_INT)",
	command: "fourier_an($1, $2, $3, 'x', $4)", 
	protect_vars: 2,
	returns_function: 'n'
});
createGiacElement({
	name: 'fourierb',
	code: 'fourier coefficient b',
	helpText: '<<fourier b <[EXPR]> for <[VAR]>, period <[T]>, lower bound <[BOUND]>>>\nFinds the expression for the fourier coefficients b<sub>n</sub> for the expression EXPR with variable VAR, period T, and boundes BOUND to BOUND+T.',
	content: [ 
		" of <<MathQuill {ghost: 'expression'}>>",
		"for <<MathQuill {ghost: 'variable', variableEntryField: true }>>",
		"with period of <<MathQuill {ghost: 'T' }>>",
		"and lower bound <<MathQuill {ghost: '0', default: '0' }>>",
	],
	pre_command: "assume('x', DOM_INT)",
	command: "fourier_bn($1, $2, $3, 'x', $4)", 
	protect_vars: 2,
	returns_function: 'n'
});
createGiacElement({
	name: 'fourierc',
	code: 'fourier coefficient c',
	helpText: '<<fourier c <[EXPR]> for <[VAR]>, period <[T]>, lower bound <[BOUND]>>>\nFinds the expression for the fourier coefficients c<sub>n</sub> for the expression EXPR with variable VAR, period T, and boundes BOUND to BOUND+T.',
	content: [ 
		" of <<MathQuill {ghost: 'expression'}>>",
		"for <<MathQuill {ghost: 'variable', variableEntryField: true }>>",
		"with period of <<MathQuill {ghost: 'T' }>>",
		"and lower bound <<MathQuill {ghost: '0', default: '0' }>>",
	],
	pre_command: "assume('x', DOM_INT)",
	command: "fourier_cn($1, $2, $3, 'x', $4)", 
	protect_vars: 2,
	returns_function: 'n'
});
createGiacElement({
	name: 'series',
	code: 'series expansion',
	helpText: '<<series <[EXPR]> for <[VAR]> around <[VALUE]> of order <[ORDER]> <[TYPE]>>>\nFinds the series expansion of EXPR with variable VAR about point VALUE of order ORDER and direction specified by TYPE.',
	content: [ 
		" of <<MathQuill {ghost: 'expression'}>>",
		"for <<MathQuill {ghost: 'variable', variableEntryField: true }>>",
		"around <<MathQuill {ghost: '0', default: '0' }>>",
		"of order <<MathQuill {ghost: '5', default: '5'}>> <<SelectBox {options: { 0: 'Bidirectional', 1: 'Unidirectional positive', -1: 'Unidirectional negative'}}>>"
	],
	command: "series($1, $2, $3, $4, $5)", 
	protect_vars: 2,
	returns_function: '$2' 
});
createGiacElement({
	name: 'taylor',
	code: 'taylor expansion',
	helpText: '<<taylor <[EXPR]> for <[VAR]> around <[VALUE]> of order <[ORDER]> <[TYPE]>>>\nFinds the taylor expansion of EXPR with variable VAR about point VALUE of order ORDER and direction specified by TYPE.',
	content: [ 
		" of <<MathQuill {ghost: 'expression'}>>",
		"for <<MathQuill {ghost: 'variable', variableEntryField: true }>>",
		"around <<MathQuill {ghost: '0', default: '0' }>>",
		"of order <<MathQuill {ghost: '5', default: '5'}>> <<SelectBox {options: { 0: 'Bidirectional', 1: 'Unidirectional positive', -1: 'Unidirectional negative'}}>>"
	],
	command: "taylor($1, $2, $4, $3, $5)", 
	protect_vars: 2,
	returns_function: '$2' 
});
createGiacElement({
	name: 'ztrans',
	code: 'Z transform',
	helpText: '<<z transform <[EXPR]> for <[VAR]>>>\nFinds the Z transform for the expression EXPR with variable VAR.  Result will have variable z.',
	content: [ 
		" of <<MathQuill {ghost: 'expression'}>>",
		"for <<MathQuill {ghost: 'variable', variableEntryField: true }>>"
	],
	command: "ztrans($1, $2, 'x')", 
	protect_vars: 2,
	returns_function: 'z'
});
createGiacElement({
	name: 'iztrans',
	code: 'inverse Z transform',
	helpText: '<<inverse Z transform <[EXPR]> for <[VAR]>>>\nFinds the inverse Z transform for the expression EXPR with variable VAR.  Result will have variable x.',
	content: [ 
		" of <<MathQuill {ghost: 'expression'}>>",
		"for <<MathQuill {ghost: 'variable', variableEntryField: true }>>"
	],
	command: "invztrans($1, $2, 'x')", 
	protect_vars: 2,
	returns_function: 'x' 
});
createGiacElement({
	name: 'fmax',
	code: 'function maximum',
	helpText: '<<maximum of <[EXPR]> for <[VAR]> between <[START]> and <[END]>>>\nFinds the maximum value of EXPR for variable VAR between START and END.  Value returned is the value of VAR at which the maximum occurs.',
	content: [ 
		" of <<MathQuill {ghost: 'expression'}>>",
		"for <<MathQuill {ghost: 'variable', variableEntryField: true }>>",
		"between <<MathQuill {ghost: 'start' }>> and <<MathQuill {ghost: 'end' }>>"
	],
	command: "fMax($1, $2=$3..$4)", 
	protect_vars: 2 
});
createGiacElement({
	name: 'fmin',
	code: 'function minimum',
	helpText: '<<minimum of <[EXPR]> for <[VAR]> between <[START]> and <[END]>>>\nFinds the minimum value of EXPR for variable VAR between START and END.  Value returned is the value of VAR at which the minimum occurs.',
	content: [ 
		" of <<MathQuill {ghost: 'expression'}>>",
		"for <<MathQuill {ghost: 'variable', variableEntryField: true }>>",
		"between <<MathQuill {ghost: 'start' }>> and <<MathQuill {ghost: 'end' }>>"
	],
	command: "fMin($1, $2=$3..$4)", 
	protect_vars: 2 
});
createGiacElement({
	name: 'pade',
	code: 'pade approximant',
	helpText: '<<pade approximant of <[EXPR]> for <[VAR]> with numerator order <[m]> and denominator order <[m]>>>\nFinds pade approximant of EXPR with variable VAR of order [m/n]',
	content: [ 
		" of <<MathQuill {ghost: 'expression'}>>",
		"for <<MathQuill {ghost: 'variable', variableEntryField: true }>>",
		"with numerator order <<MathQuill {ghost: 'm' }>>",
		"and denominator order <<MathQuill {ghost: 'n' }>>"
	],
	command: "pade($1, '$2', $4+2, $3+1)", 
	protect_vars: 2,
	returns_function: '$2' 
});


