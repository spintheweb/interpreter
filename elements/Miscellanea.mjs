/*!
 * Constants 
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import path from 'path';

export const WEBBASE = Symbol('webbase');
export const INDEX = Symbol('index');
export const PATH = Symbol('path')

export const ROOT_DIR = process.cwd();
export const SITE_DIR = path.join(ROOT_DIR, 'public');
export const STUDIO_DIR = path.join(ROOT_DIR, 'studio');

// Return langs RFC 3282 as a language array sorted by preference
export function acceptLanguage(langs) {
    const pattern = /([a-z][a-z](-[a-z][a-z])?|\*)(;q=([01](\.[0-9]+)?))?/gi;
    let match, accept = '';
    while (match = pattern.exec(langs)) {
        pattern.lastIndex += (match.index === pattern.lastIndex);
        accept += (accept !== '' ? ',' : '[') + `{"l":"${match[1]}","q":${match[4] || 1}}`;
    }
    return JSON.parse(accept + ']').sort((a, b) => a.q < b.q).map(a => a.l);
}

// Pick the preferred localized text, if pick is true return the picked locale
export function localize(langs, txts, pick) {
    let _langs = Object.keys(txts);
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
}