var $ = function(e,p) {
    if(typeof p === 'undefined') {
	p = document;
    }
    return p.querySelector(e,p);
}

function left_distribute(node) {
    // Only works for a product
    if(node.operator !== TokenEnum['*'])
	return node;

    // Swap and right-distribute

    node = node.compress(); // Get a new copy
    var n = node.children[0];
    node.children[0] = node.children[1];
    node.children[1] = n;
    var s = right_distribute(node);
    return s;
}

function right_distribute(node) {
    // Perform a right-distribution on the node, if it is feasible: 
    // (* (+ x y) z) == (+ (* x z) (* y z)) Note that z becomes a
    // linked copy of itself, which might seem troublesome to you.
    
    if(!(node instanceof ASTNode))
	return node;
    
    var outerOp = node.operator;
    var innerOp = node.children[0].operator;
    if((outerOp!==TokenEnum['*'] && outerOp!==TokenEnum['/']) ||
       (innerOp!==TokenEnum['+'] && innerOp!==TokenEnum['-'])) {
	return node;  // Cannot right-distribute!
    }

    
    // (* (+ x y) z) -> (+ (* x z) (* y z))
    var x = node.children[0].children[0];
    var y = node.children[0].children[1];
    var z = node.children[1];

    var retnode = new ASTNode();
    retnode.operator = innerOp;
    retnode.children[0] = new ASTNode();
    retnode.children[0].operator = outerOp;
    retnode.children[1] = new ASTNode();
    retnode.children[1].operator = outerOp;
    retnode.children[0].children = [x,z];
    retnode.children[1].children = [y,z];
    return retnode.compress();
}
	
function full_distribute(node,func) {
    if(!(node instanceof ASTNode)) {
	return node;
    }
    node = node.compress();
    var n = func(node);
    for(var i = 0; i < n.children.length; i++) {
	n.children[i] = full_distribute(n.children[i],func);
    }
    return n;
}
	
function render() {
    var formula = $('#function').value;
    var s = parse(formula);
    var text;
    
    
    $('#result').innerHTML = s.infix();
    for(var i = 0; i < 10; i++) {
	if(i%2) {
	    text = 'right';
	    s = full_distribute(s,right_distribute);
	}
	else {
	    text = 'left';
	    s = full_distribute(s,left_distribute);
	}
	$('#result').innerHTML += '<br>Expanding ' + text + ' yields ' + s.infix();
    }
    return false;
}