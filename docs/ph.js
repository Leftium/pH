function pw() {
    GenerateToTextField();
    var resultField = document.getElementById('hashedPassword');
    resultField.style.visibility = 'visible';
    resultField.focus();
    if (document.selection) {
        var sel = document.selection.createRange();
        sel.move(0, resultField.value.length);
        sel.select();
    }
    else {
        resultField.selectionStart = 0;
        resultField.selectionEnd = resultField.value.length;
    }
    document.execCommand('copy');
    document.getElementById('sitePassword').focus();
    document.getElementById('result').className = 'generated';
}
var extractDomain = new SPH_DomainExtractor().extractDomain
if (!window.location.origin) {
    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
}
function init() {
    var bookmarkletScript = "javascript:q=location.href;window.open('ORIGIN/#'+q,'_blank');"
    bookmarkletScript = bookmarkletScript.replace(/ORIGIN/, location.origin);
    var bookmarklet = document.getElementById('bookmarklet');
    bookmarklet.href = bookmarkletScript;

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
