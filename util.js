/*!
 * util
 * Copyright(c) 2016 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

// Generate a psudo id
// TODO: what if simply an incrementer?
module.exports.newId = () => {
    return new Date().getTime() + Math.random();
};

// Return langs RFC 3282 as a language array sorted by preference
module.exports.acceptLanguage = langs => {
    const pattern = /([a-z][a-z](-[a-z][a-z])?|\*)(;q=([01](\.[0-9]+)?))?/gi;
    var match, accept = '';
    while (match = pattern.exec(langs)) {
        pattern.lastIndex += (match.index === pattern.lastIndex);
        accept += (accept !== '' ? ',' : '[') + `{"l":"${match[1]}","q":${match[4] || 1}}`;
    }
    return JSON.parse(accept + ']').sort((a, b) => a.q < b.q).map(a => a.l);
};

// Pick the preferred localized text, if pick is true return the picked locale
module.exports.localize = (langs, txts, pick) => {
    var _langs = Object.keys(txts);
    switch (_langs.length) {
        case 0:
            return null;
        case 1:
            return pick ? _langs[0] : txts[_langs[0]];
        default:
            for (let lang of langs)
                if (txts[lang]) 
                    return pick ? lang : txts[lang];
            return pick ? langs[0] : txts[langs[0]];
    }
};

// if (this._contentType.startsWith('text'))
// 	// TODO: Replace data variables ${variable}
// 	data = data.toString().replace(/\${\s*(\$?[_a-zA-Z0-9]+)\s*}/gm, (match, p1) => {
// 		return { lang: wbol.lang(), name: this.name() }[p1] || '';
// 	});
