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
export const WEBO_DIR = path.join(ROOT_DIR, 'public');
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

// Pick localized text
export function localize(langs, texts = {}) {
    if (texts.hasOwnProperty(langs[0]))
        return texts[langs[0]];
    if (texts.hasOwnProperty(langs[1]))
        return texts[langs[1]];
    return texts[0] ? texts[0] : '';
}