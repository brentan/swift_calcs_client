/* Use the giac_generic class, along with the createGiacElement constructor,
   to create many of the basic giac function blocks that don't require special
   controls (such as solve does) */

createGiacElement({
	name: 'fft',
	helpText: 'help text for tooltip bubble',
	content: [ 
		"text:<<MathQuill {expression_mode: true, ghost: 'test'}>>",
		"text2:<<SelectBox {options: { x: 'x', y: 'y' }}>>"
	],
	command: "solve($1, $2)" 
});