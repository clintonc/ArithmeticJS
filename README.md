ArithmeticJS
============

This is intended to be a library for those interested in manipulating
arithmetic and algebraic expressions in Javascript.  You speak to it in
standard typed mathematics, and it creates a syntax tree representing
the expression.  The hope is that it will be useful for the creation of
interactive mathematics software which runs in the browser, with a
modicum of computer algebra smarts.

The usage is relatively straightforward.

    var s = parse('x^2+y^2-1');  // yields computational object (ASTNode)
    console.log(s.toString());   // Gives prefix notation
    console.log(s.infix());      // Gives infix notation
    console.log(s.value({x:1, y:2}));  // Evaluates expression.

Refer to the demos folder for more examples.

