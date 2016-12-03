// From: https://github.com/zenorocha/select/blob/master/src/select.js
function select(element) {
    var selectedText;

    if (element.nodeName === 'SELECT') {
        element.focus();

        selectedText = element.value;
    }
    else if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
        element.focus();
        element.setSelectionRange(0, element.value.length);

        selectedText = element.value;
    }
    else {
        if (element.hasAttribute('contenteditable')) {
            element.focus();
        }

        var selection = window.getSelection();
        var range = document.createRange();

        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);

        selectedText = selection.toString();
    }

    return selectedText;
}

// Based on:
// https://www.reddit.com/r/web_design/comments/33kxgf/javascript_copying_to_clipboard_is_easier_than/
// https://github.com/zenorocha/clipboard.js/blob/294e9fcb5d80c3966d18bae635cbcccfe9cd8664/src/clipboard-action.js

function copytext(text) {
    var success = false;
    var sitePasswordField = document.getElementById('sitePassword');
    var savedValue = sitePasswordField.value;

    sitePasswordField.value = text;

    sitePasswordField.type = 'text';
    window.selectedText = select(sitePasswordField);
    success = document.execCommand('copy');
    sitePasswordField.type = 'password'

    sitePasswordField.value = savedValue;
    console.log(sitePasswordField);
    return success;
}

pw = function() {
    GenerateToTextField();
    var sitePasswordField = document.getElementById('sitePassword');
    var resultField = document.getElementById('hashedPassword');

    var success = copytext(resultField.value);
    if (success) {
        sitePasswordField.style.backgroundColor = 'lightgreen';
    } else {
        sitePasswordField.style.backgroundColor = 'pink';
    }

    console.log(success, window.selectedText);
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
