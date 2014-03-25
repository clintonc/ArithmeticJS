////////////////////////////////////////
// Data Structures
////////////////////////////////////////


// TokenEnum includes all valid token types.
var TokenEnum = {
    // Variable types
    number: {
        type: 'number', 
        text: undefined, 
        value: undefined, 
        toString: function() {
            return "number: " + this.text;
        }},
    identifier: {type: 'identifier', 
		 text: undefined,
		 toString: function() {
		     return "identifier: " + this.text;
		 }},
    // Some constants
    pi: {type: 'constant', text: 'pi', value: 4*Math.atan(1)},
    e: {type: 'constant', text: 'e', value: Math.exp(1)},
    // Common functions
    exp: {type: 'func', text: 'exp', func: Math.exp},
    log: {type: 'func', text: 'log', func: Math.log},
    cos: {type: 'func', text: 'cos', func: Math.cos},
    sin: {type: 'func', text: 'sin', func: Math.sin},
    abs: {type: 'func', text: 'abs', func: Math.abs},
    // These two probably won't show up as tokens in the input.
    id: {type: 'unop', text: 'id', func: function (x) {return x;}},
    neg: {type: 'unop', text: 'neg', func: function (x) {return -x;}},
    // Binary operators
    '+': {type: 'binop', text: '+', func: function (x,y) {return x+y;}},
    '-': {type: 'binop', text: '-', func: function (x,y) {return x-y;}},
    '*': {type: 'binop', text: '*', func: function (x,y) {return x*y;}},
    '/': {type: 'binop', text: '/', func: function (x,y) {return x/y;}},
    '^': {type: 'binop', text: '^', func: Math.pow},
    // Delimiters
    '(': {type: 'delimiter', text: '(', counterpart: ')'},
    ')': {type: 'delimiter', text: ')', counterpart: '('},
};

function createNumberToken(value) {
    // Convenience function for creating a TokenEnum object which
    // holds a number.  Input should be a number, a string (to be
    // parsed as a float), or something whose toString method returns
    // something acceptable to parseFloat.
    var t = Object.create(TokenEnum.number);
    if(typeof value === 'number') {
        t.value = value;
        t.text = value.toString();
    } else if (typeof value === 'string') {
        t.value = parseFloat(value);
        t.text = value;
    } else {
        t.text = value.toString();
        t.value = parseFloat(t.text);
    }
    return t;
}

function ASTNode() {
    this.operator = TokenEnum['id'];
    this.children = [];
}

ASTNode.prototype.toString = function () {
    // Mainly for debugging output.  If verbose is false (or omitted),
    // do not bother generating extra output for "identity" nodes.
    out = '';
    out += '(' + this.operator.text + ' ';
    out += this.children.map(
        function (x) {
            if(x.text) {
                return x.text;
            } else {
		return x.toString();
            }
	}).join(' ') + ')';
    return out;
};

ASTNode.prototype.value = function(vardict) {
    var node = ASTNode.compress(this, vardict, false, true);
    if(typeof node.value === 'number') {
	return node.value;
    } else {
	throw new Error("Evaluated to " + node + " rather than a number");
    }
}

ASTNode.prototype.compress = function(vardict, skipConstNodes, notRoot) {
    return ASTNode.compress(this, vardict, skipConstNodes, notRoot);
}

ASTNode.compress = function(node, vardict, skipConstNodes, notRoot) {
    // Given a node, return an ASTNode representing a tree with
    // computational cruft removed and, perhaps, variables
    // substituted.
    // 
    // * No operator will be TokenEnum['id'] unless that node is at
    //   the top of the tree and the only child is a constant or an
    //   variable.
    // * If an object is provided as vardict, the identifier
    //   corresponding to the key will be replaced with a
    //   TokenEnum['number'] with the value in vardict.
    // * If skipConstNodes is false (or omitted), arithmetic
    //   operations which can be performed will be performed.
    //   Otherwise, constants remain abstract and 1+2 does not become
    //   3.
    // * If notRoot is set, then the return value may only be a valid
    //   child of an ASTNode, not necessarily an ASTNode itself.
    
    if(node.type && node.type === 'number') {
        // Not actually a node, so no compressing.        
        return node;
    }
    
    if(node.type && node.type === 'identifier') {
        if(vardict && node.text in vardict) {
            return createNumberToken(vardict[node.text]);
        } else {
            return node;
        }
    }

    if(node.type && node.type === 'constant') {
        if(!skipConstNodes) {
            return createNumberToken(node.value);
        } else {
            return node;
        }
    }

    if(!(node instanceof ASTNode)) {
        throw new Error("Cannot compress something which is not a node: " + 
                        node);
    }

    // From here, strategy is to compress the children and see if they
    // can be combined.

    var i, allChildrenPrimitive = true;
    var retNode = new ASTNode();
    var children = []

    for(i = 0; i < node.children.length; i++) {
        children[i] = ASTNode.compress(node.children[i], vardict, 
                                       skipConstNodes, true);
        if(children[i].type !== 'number') {
            allChildrenPrimitive = false;
        }
    }

    // If no children are primitive and the user asked, evaluate.
    if(allChildrenPrimitive && !skipConstNodes) {
        var value = node.operator.func.apply(
            this, children.map(function (x) {return x.value; }));
	if(notRoot) {
	    return createNumberToken(value);
	} else {
	    retNode.children[0] = createNumberToken(value);
	    return retNode;
	}
    }

    if(node.operator === TokenEnum['id'] &&  notRoot) {
        return children[0];
    }

    if(node.operator === TokenEnum['id'] && children[0] instanceof ASTNode) {
	return children[0];
    }
    
    // Otherwise, create a node and return it
    retNode.children = children;
    retNode.operator = node.operator;
    return retNode;
};

// Special node types used in the parser.
function ExpressionNode() {
    ASTNode.call(this);  // Construct
}
ExpressionNode.prototype = Object.create(ASTNode.prototype);
ExpressionNode.prototype.constructor = ASTNode;

function TermNode() {
    ASTNode.call(this);  // Construct
}
TermNode.prototype = Object.create(ASTNode.prototype);
TermNode.prototype.constructor = ASTNode;

function ExponentialNode() {
    ASTNode.call(this);  // Construct
}
ExponentialNode.prototype = Object.create(ASTNode.prototype); 
ExponentialNode.prototype.constructor = ASTNode;

function FactorNode() {
    ASTNode.call(this);
}
FactorNode.prototype = Object.create(ASTNode.prototype);
FactorNode.prototype.constructor = ASTNode;


////////////////////////////////////////
// Lexing function
////////////////////////////////////////

function lex(s) {
    // For an input of a string s, return an array of TokenEnum
    // elements.

    // This lexer is not "scientific".  It works well enough, but it
    // matches tokens in a rudimentary fashion; it is not accompanied
    // by a formal grammar.  All numbers are interpreted as positive,
    // with negative signs in front of numbers interpeted as a unary
    // negation applied to a positive number.

    var tokens = [];
    var i, str, t;

    function isNumerical (x) {
        return '0123456789.'.indexOf(x)>=0;
    }

    function isAlphanum (x) {
        var alphanum = '0123456789abcdefghijklmnopqrstuvwxyz_';
        return alphanum.indexOf(x.toLowerCase())>=0;
    }

    function isAlpha(x) {
        var alpha = 'abcdefghijklmnopqrstuvwxyz';
        return alpha.indexOf(x.toLowerCase())>=0;
    }

    function isDelimiter(x) {
        return '()[]'.indexOf(x)>=0;
    }

    function isOperator(x) {
        return '+-*/^%'.indexOf(x)>=0;
    }

    for(i = 0; i < s.length; i++) {
        // At the start of a token.  Determine type.
        while(s[i]==' ') { // Spaces separate tokens; gobble.
            i++;
        }

        if(isNumerical(s[i])) {
            // Begins with a number or decimal, so must be a number.
            str = '';
            while(i < s.length && 
                  (isNumerical(s[i]) || s[i].toLowerCase()==='e')) {
                str = str + s[i];
                i++;
            }
            i--;
            var t = Object.create(TokenEnum.number);
            t.value = parseFloat(str);
            t.text = str;
            tokens.push(t);
            continue;
        }

        if(isOperator(s[i])) {
            // Operators may be negations.
            if(s[i]=='-' && (tokens.length===0 || 
                             tokens[tokens.length-1].type === 'binop' ||
			     tokens[tokens.length-1].type === 'delimiter'))
            {
                tokens.push(TokenEnum['neg']);
            } else {
                tokens.push(TokenEnum[s[i]]);
            }
            continue;
        }

        if(isDelimiter(s[i])) {
            tokens.push(TokenEnum[s[i]]);
            continue;
        }
        
        if(isAlpha(s[i])) {
            // Beginning of an identifier or a constant.
            str = '';
            while(i<s.length && (isAlphanum(s[i]))) {
                str = str + s[i];
                i++;
            }
            i--;
            if(str in TokenEnum) {
                t = Object.create(TokenEnum[str]);
            } else {
                t = Object.create(TokenEnum['identifier']);
                t.text = str;
            }
            tokens.push(t);
            continue;
        }
        throw "Cannot understand " + s.slice(i);
    }

    tokens.toString = function () {
        return tokens.map( function (x) {
            return ['[', x.type, x.text, ']'].join(' ');
        }).join(' ');
    };
    return tokens;
}

////////////////////////////////////////
// Parsing functions
////////////////////////////////////////

// There are currently four types of ASTNode: Expression, Term,
// Exponential, and Factor.  The production rules are
// 
//   Expression  -> Expression + Term |
//                  Expression - Term |
//                  Term
//   Term        -> Term * Exponential |
//                  Term / Exponential |
//                  Exponential
//   Exponential -> Factor ^ Exponential |
//                  - Factor |
//                  Factor
//   Factor      -> Number |
//                  identifier(Expression) |
//                  (Expression)
// 
// (The Exponential node deals in unary negation, not subtraction.
// These are distinct tokens produced by the lexer.)  The following
// functions work destructively on the list of tokens; the tokens are
// consumed to create the tree.  Tokens are consumed from the right
// end of the list.

ExpressionNode.create = function (list) {
    var node = new ExpressionNode();
    if(list.length===0)
        throw new Error('Cannot create ExpressionNode from an empty list.');

    node.children[0] = TermNode.create(list);  // Might get shifted if
                                               // there is a binary
                                               // operation.

    if(list.length > 0) {
        var op = list[list.length-1];
        if(op === TokenEnum['+'] || op === TokenEnum['-']) {
            list.pop();
            node.operator = op;
            node.children[1] = node.children[0];
            node.children[0] = ExpressionNode.create(list);
        }
    }
    return node;
};


TermNode.create = function (list) {
    var node = new TermNode();
    if(list.length===0)
        throw new Error('Cannot create TermNode from an empty list.');
    node.children[0] = ExponentialNode.create(list);
    if(list.length > 0) {
        var op = list[list.length-1];
        if(op === TokenEnum['*'] || op === TokenEnum['/']) {
            list.pop();
            node.operator = op;
            node.children[1] = node.children[0];
            node.children[0] = TermNode.create(list);
        }
    }
    return node;
};

ExponentialNode.create = function (list) {
    var node = new ExponentialNode();
    if(list.length===0)
        throw new Error('Cannot create FactorNode from an empty list.');

    var F = FactorNode.create(list); // Since we might have chained
                                     // exponentials, this FactorNode
                                     // may not be a child of the
                                     // current node, but some further
                                     // descendant.  However, to avoid
                                     // complicated logic...
    node.children[0] = F;
    if(list.length > 0) {
        var op = list[list.length-1];
        if(op === TokenEnum['neg']) {
            list.pop();
            node.operator = op;
        } else if(op === TokenEnum['^']) {
            // Go back in tokens until we are down to the first
            // factor, pushing them onto the factors list.
            var factors = [F];
            do {
                list.pop();  // Have verified that this is ^
                factors.push(FactorNode.create(list));
            } while (list.length > 0 && list[list.length-1] === TokenEnum['^']);

            // Build chain of exponentials, starting from the deepest
            // and working out.  (Deepest exponents come first in the list.)
            var currentNode = node;
            currentNode.children[0] = factors.pop();
            currentNode.operator = op;
            while(factors.length > 1) {
                currentNode.children[1] = new FactorNode();
                currentNode = currentNode.children[1];
                currentNode.operator = op;
                currentNode.children[0] = factors.pop();
            }
            currentNode.children[1] = factors.pop();
        }
    }
    return node;
};

    
FactorNode.create = function (list) {
    var node = new FactorNode();
    if(list.length===0)
        throw new Error('Cannot create TermNode from an empty list.');
    var last = list.pop();
    if(last.type == 'number' || last.type == 'identifier' || 
      last.type == 'constant' ) {
        node.children[0] = last;
    } else if (last === TokenEnum[')']) {
        // March backward until parentheses match
        var i = list.length;
        var parenLevel = 1;
        while(parenLevel > 0 && i >= 0) {
            i--;
            if(list[i] === TokenEnum['('])
                parenLevel--;
            if(list[i] === TokenEnum[')'])
                parenLevel++;
        }
        if(i < 0)
            throw new Error("Unmatched parentheses: " + list);
        var slice = list.slice(i+1);
        slice.toString = list.toString;
        node.children[0] = ExpressionNode.create(slice);
        list.length=i;

        // Check if previous is a recognized function
        if(list.length > 0 && list[list.length-1].type =='func') {
            node.operator = list.pop();
        }
    }
    return node;
};


function parse(x) {
    var s = lex(x);
    var n = ExpressionNode.create(s);
    return ASTNode.compress(n, {}, true);
}

ASTNode.prototype.infix = function() {
    // Turn a tree into a valid (and suitably parenthesized) infix
    // string.  
    
    // For each binary operation, the left child must be parenthesized
    // if and only if its operation appears in the given string.
    parenthesize_left = {'+': '',
                          '-': '',
                          '*': '+-',
                          '/': '+-',
                          '^': '+-*/^'};
    // For each binary operation, the right child must be parenthesized
    // if and only if its operation appears in the given string.
    parenthesize_right = {'+': '',
                          '-': '+-',
                          '*': '+-',
                          '/': '+-*/',
                          '^': '+-*/'};
    
    function parenthesize(x, opParent, precList) {
        var opChild = x.operator
        if(opChild)
            opChild = opChild.text;
        var list = precList[opParent];
        if(x.infix)
            x = x.infix();
        else
            x = x.text;
        if(list.indexOf(opChild)>=0)
            return '(' + x + ')';
        return x;
    }
    var out = '';
    if(this.operator.type=='binop') {
        out = parenthesize(this.children[0], this.operator.text, 
                           parenthesize_left);
        out += ' ' + this.operator.text + ' ';
        out += parenthesize(this.children[1], this.operator.text, 
                           parenthesize_right);
    } else if(this.operator.type=='unop' ||
             this.operator.type=='func') {
        if(this.children[0].infix) {
            out += this.operator.text + '[' + this.children[0].infix() + ']';
        } else {
            out += this.operator.text + '[' + this.children[0].text + ']';
        }
    }
    return out;
}
