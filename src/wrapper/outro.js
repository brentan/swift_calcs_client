
	SwiftCalcs.Workspace = Workspace;
	var elements = SwiftCalcs.elements = {
		'math': math,
		'text': text,
		'if': if_block,
		'else': else_block,
		'elseif': else_if_block,
		'for': for_loop,
		'continue': continue_block,
		'break': break_block,
		'plot': plot,
		'bookmark': bookmark,
		'solve': solve,
		'desolve': desolve,
		'regression': regression
	}
	for(var i = 0; i < giac_elements_to_add.length; i++) 
		elements[giac_elements_to_add[i].key] = SwiftCalcs.elements[giac_elements_to_add[i].key] = giac_elements_to_add[i].el;
}());
