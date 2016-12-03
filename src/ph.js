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
    return success;
}

pw = function() {
    var hashedPassword = Generate();
    var maskedPassword = hashedPassword.substring(0,2);
    maskedPassword += new Array(hashedPassword.length - 1).join('•');

    var sitePasswordField = document.getElementById('sitePassword');
    var hashedPasswordField = document.getElementById('hashedPassword');

    hashedPasswordField.trueValue = hashedPassword;
    hashedPasswordField.maskValue = maskedPassword;
    hashedPasswordField.value = maskedPassword;

    var success = copytext(hashedPassword);
    if (success) {
        sitePasswordField.style.backgroundColor = 'lightgreen';
    } else {
        sitePasswordField.style.backgroundColor = 'pink';
    }
};

confirmPassword = function() {
    var sitePasswordField = document.getElementById('sitePassword');
    var confirmPasswordField = document.getElementById('confirmPassword');

    if (confirmPasswordField.value.length > 0) {
        if (sitePasswordField.value == confirmPasswordField.value) {
            confirmPasswordField.style.backgroundColor = 'lightgreen';
        } else {
            confirmPasswordField.style.backgroundColor = 'pink';
        }
    }
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

    confirmPasswordField = document.getElementById('confirmPassword');
    confirmPasswordField.onkeyup = confirmPassword;

    hashedPasswordField = document.getElementById('hashedPassword');
    hashedPasswordField.onfocus = function() {
        this.value = this.trueValue || '';
        select(this);
    }

    hashedPasswordField.onblur = function() {
        this.value = this.maskValue || '';
    }

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

function domainToLower() {
    var domainField = document.getElementById('domain');
    domainField.value = domainField.value.toLowerCase();
}
