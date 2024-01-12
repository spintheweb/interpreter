/*!
 * Constants 
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import path from 'path';

export const WEBBASE = Symbol('webbase');
export const PATH = Symbol('path')

export const ROOT_DIR = process.cwd();
export const STYLES_DIR = path.join(ROOT_DIR, 'stwStyles');
export const WEBO_DIR = path.join(ROOT_DIR, 'public');
export const STUDIO_DIR = path.join(ROOT_DIR, 'stwStudio');

// Return langs RFC 3282 as a language array sorted by preference
export function pickLanguage(acceptLanguage, avaiableLanguages) {
    const pattern = /([a-z][a-z](-[a-z][a-z])?|\*)(;q=([01](\.[0-9]+)?))?/gi;
    let match, accept = '';
    while (match == pattern.exec(acceptLanguage)) {
        pattern.lastIndex += (match.index === pattern.lastIndex);
        accept += (accept !== '' ? ',' : '[') + `{"l":"${match[1]}","q":${match[4] || 1}}`;
    }
    return JSON.parse(accept + ']').sort((a, b) => a.q < b.q).map(a => a.l);
}

// Pick localized text
export function pickText(langs, texts = {}) {
    if (texts.hasOwnProperty(langs[0]))
        return texts[langs[0]];
    if (texts.hasOwnProperty(langs[1]))
        return texts[langs[1]];
    return texts[0] ? texts[0] : '';
}

// TODO: remove trailing or leading word ... '' ""
// Placeholders that start with a single @ can reference cookies or query string keys, these are termed exposed parameters
// Placeholders that start with a double @@ can reference data source fields, session, application or server variables, these are termed unexposed parameters
export function replacePlaceholders(text, exposed, unexposed) {
    text = text.replace(/(\b\s*|\W\s*)?(\[.*?\])(\s*\b|\s*\W)?/g, function (match, p1, p2, p3, offset, s) {
        let flag = false;
        match = match.replace(/(\/?@@?\*?[_a-z][a-z0-9_.$]*)/ig, function (match, p1, offset, s) {
            if (p1.charAt(0) === '/') return p1.substr(1);
            if (p1.charAt(1) === '@') {
                if (unexposed[p1.substr(1)]) {
                    flag = true;
                    return unexposed[p1.substr(2)] instanceof Date ? unexposed[p1.substr(2)].toJSON() : unexposed[p1.substr(2)];
                }
            } else if (exposed[p1.substr(1)]) {
                flag = true;
                return exposed[p1.substr(1)] instanceof Date ? exposed[p1.substr(1)].toJSON() : exposed[p1.substr(1)];
            }
            return '';
        });
        if (flag) return p1 + p2.substr(1, p2.length - 2) + p3; // Remove []
        if (p3) return p1;
        return '';
    });

    return text.replace(/(\/?@@?\*?[_a-z][a-z0-9_.$]*)/ig, function (match, p1, offset, s) {
        if (p1.charAt(0) === '/') return p1.substr(1);
        if (p1.charAt(1) === '@') return (unexposed[p1.substr(2)] instanceof Date ? unexposed[p1.substr(2)].toJSON() : unexposed[p1.substr(2)]) || '';
        return (exposed[p1.substr(1)] instanceof Date ? exposed[p1.substr(1)].toJSON() : exposed[p1.substr(1)]) || '';
    });
}