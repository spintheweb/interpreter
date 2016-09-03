/*!
 * util
 * Copyright(c) 2016 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

// Generate a psudo id
module.exports.newId = () => {
    return new Date().getTime() + Math.random();
};

// Return langs RFC 3282 as a language array sorted by preference
module.exports.acceptLanguage = (langs) => {
    const pattern = /([a-z][a-z](-[a-z][a-z])?|\*)(;q=([01](\.[0-9]+)?))?/gi;
    var match, accept = '';
    while (match = pattern.exec(langs)) {
        pattern.lastIndex += (match.index === pattern.lastIndex);
        accept += (accept !== '' ? ',' : '[') + `{"l":"${match[1]}","q":${match[4] || 1}}`;
    }
    return JSON.parse(accept + ']').sort((a, b) => a.q < b.q).map(a => a.l);
};

// Pick the preferred language translation
module.exports.localize = (langs, txts) => {
    var _langs = Object.keys(txts);
    switch (_langs.length) {
        case 0:
            return null;
        case 1:
            return txts[_langs[0]];
        default:
            for (let lang of langs)
                if (txts[lang]) 
                    return txts[lang];
            return txts[langs[0]];
    }
};
