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
    var sitePasswordPartial = sitePasswordField.value.substring(0, confirmPasswordField.value.length);

    if (confirmPasswordField.value.length > 0) {
        if (sitePasswordField.value == confirmPasswordField.value) {
            confirmPasswordField.style.backgroundColor = 'lightgreen';
        } else if (confirmPasswordField.value == sitePasswordPartial) {
            confirmPasswordField.style.backgroundColor = 'yellow';
        } else {
            confirmPasswordField.style.backgroundColor = 'pink';
        }
    } else {
        confirmPasswordField.style.backgroundColor = 'white';
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

    var domains = [
        'aa.com',
        'amazon.com',
        'americanexpress.com',
        'apple.com',
        'appsliced.co',
        'authy.com',
        'bankofamerica.com',
        'barclaycardus.com',
        'bkmks.com',
        'camelcamelcamel.com',
        'chase.com',
        'circle.com',
        'cloudflare.com',
        'consulting.com',
        'creditkarma.com',
        'delta.com',
        'dropbox.com',
        'ebates.com',
        'facebook.com',
        'fitbit.com',
        'gap.com',
        'google.com',
        'humblebundle.com',
        'iherb.com',
        'investor.vanguard.com',
        'kakao.com',
        'korbit.co.kr',
        'login.yahoo.com',
        'mega.nz',
        'metrotransit.org',
        'my.ebay.com',
        'myhq.com',
        'newsblur.com',
        'nid.naver.com',
        'onlinecreditcenter6.com',
        'paypal.com',
        'personalcapital.com',
        'prismmoney.com',
        'protectmyid.com',
        'reddit.com',
        'samovens.com',
        'scottrade.com',
        'simple.com',
        'simplenote.com',
        'skype.com',
        'steampowered.com',
        'trello.com',
        'tripit.com',
        'ubisoft.com',
        'udemy.com',
        'umn.edu',
        'usbank.com'
    ];

    window.ac = $('#domain').autocomplete({
        autoSelectFirst: true,
        lookup: domains,
        appendTo: '#autocompleteContainer',
        beforeRender: function (container) {
            var domainInput = $('#domain')[0];
            var style = {}
            if (window.innerWidth < 400) {
                // Mobile: @media only screen and (max-width: 400px)
                style.left = -domainInput.offsetLeft;
                style.width = window.innerWidth;
            } else {
                // Desktop: @media only screen and (min-width: 400px)
                style.width = domainInput.clientWidth
            }
            $('.autocomplete-suggestions').css(style);
        }
    });

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
