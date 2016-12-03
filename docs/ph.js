pw = debounce(function() {
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
}, 500);
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
// From: https://davidwalsh.name/function-debounce
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
    var timeout;
    var last = new Date();
    return function() {
        var now = new Date();
        console.log((now - last)/1000);
        last = now;

        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};
