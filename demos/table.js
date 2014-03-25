var $ = function(e,p) {
    if(typeof p === 'undefined') {
	p = document;
    }
    return p.querySelector(e,p);
}

function render() {
    var formula = $('#function').value;
    $('#lexform').innerHTML = lex(formula);
    var s = parse(formula);
    $('#prefixform').innerHTML = s.toString();
    s = s.compress(); // For efficiency?
    $('#simplifiedprefixform').innerHTML = s.toString();
    $('#infixform').innerHTML = s.infix();

    var tbody = $('#tablediv').querySelector('tbody');
    tbody.innerHTML = '';
    for(var i = 0; i < 10; i++) {
	tbody.innerHTML += '<tr><td>' + i + '</td><td>' +
	    s.value({x: i}) + '</td></tr>';
    }
    return false;
}