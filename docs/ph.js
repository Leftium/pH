function copytext(text) {
    var textField = document.createElement('textarea');
    var success = false;
    textField.innerText = text;
    document.body.appendChild(textField);

    textField.select();
    /*
    if (document.selection) {
        var sel = document.selection.createRange();
        sel.move(0, textField.value.length);
        sel.select();
    }
    else {
        textField.selectionStart = 0;
        textField.selectionEnd = resultField.value.length;
    }
    /**/

    success = document.execCommand('copy');
    textField.remove();
    return success;
}

pw = function() {
    // console.log(arguments);
    sitePasswordField = document.getElementById('sitePassword');
    sitePasswordField.style.backgroundColor = 'white';
    e = arguments[0];
    GenerateToTextField();
    var resultField = document.getElementById('hashedPassword');

    var success = copytext(resultField.value);
    /*
    // resultField.style.visibility = 'visible';
    // resultField.focus();
    if (document.selection) {
        var sel = document.selection.createRange();
        sel.move(0, resultField.value.length);
        sel.select();
    }
    else {
        resultField.selectionStart = 0;
        resultField.selectionEnd = resultField.value.length;
    }

    var success = document.execCommand('copy');
    /**/

    if (success) {
        sitePasswordField.style.backgroundColor = 'lightgreen';
    } else {
        sitePasswordField.style.backgroundColor = 'pink';
    }


    console.log(success, e.isTrusted, sitePasswordField.style.backgroundColor);

    document.getElementById('sitePassword').focus();
    document.getElementById('result').className = 'generated';
};

var extractDomain = new SPH_DomainExtractor().extractDomain
if (!window.location.origin) {
    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
}
function init() {
    var bookmarkletScript = "javascript:q=location.href;window.open('ORIGIN/#'+q,'_blank');"
    bookmarkletScript = bookmarkletScript.replace(/ORIGIN/, location.origin);
    var bookmarklet = document.getElementById('bookmarklet');
    bookmarklet.href = bookmarkletScript;

    sitePasswordField = document.getElementById('sitePassword');
    sitePasswordField.style.backgroundColor = 'cyan';
    sitePasswordField.onkeyup = pw;

    var domainField = document.getElementById('domain');
    if (navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPod/i)) {
        domainField.type = 'url';
    }
    if (location.hash) {
        domainField.value = extractDomain(location.hash.slice(1));
    }
    if (domainField.value == '') {
        domainField.focus();
    }
    else {
        document.getElementById('sitePassword').focus();
    }
}
function startOver() {
    document.getElementById('result').className = '';
    var resultField = document.getElementById('hashedPassword');
    resultField.value = '';
    resultField.style.visibility = 'hidden';
}
function domainToLower() {
    var domainField = document.getElementById('domain');
    domainField.value = domainField.value.toLowerCase();
}
