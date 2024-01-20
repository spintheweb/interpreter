/*!
 * WBLL - Webbabse Layout Language
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
import { encode } from 'html-entities';
import { replacePlaceholders } from './Miscellanea.mjs';

const SYNTAX = new RegExp([
    /(\\[aAs])(?:\('([^]*?)'\))/,
    /(\\[rnt])/,
    /(?:([aAbo]))(?:\('([^]*?)'\))?((<|>|p(\('[^]*?'\))?)*)/,
    /(?:([cefhilmruwxyz]))(?:\('([^]*?)'\))?/,
    /(?:([dnsvVk]))(?:\('([^]*?)'\))/,
    /(?:([jJtT]))(?:\('([^]*?)'\))/,
    /\/\/.*$/,
    /\/\*[^]*(\*\/)?/,
    /([<>])/, // TODO: Group consecutive moves
    /(?<error>[\S])/ // Anything else is an error
].map(r => r.source).join('|'), 'gmu');

export function lexer(req, wbll = '') {
    let layout = { settings: {}, tokens: [] }, token = {}, symbol, args, params, attrs;

    if (typeof wbll != 'string')
        return layout;

    for (let expression of wbll.matchAll(SYNTAX)) {
        if (expression.groups.error !== undefined)
            throw new SyntaxError(expression.input.slice(0, expression.index) + ' >>>' + expression.input.slice(expression.index));;

        expression = expression.filter((value, i) => (value !== undefined && i));

        symbol = expression[0];
        args = [], params = undefined, attrs = undefined;

        if (symbol) {
            if (symbol == '\\a' || symbol == '\\s' || symbol == '\\A') {
                expression[1] = replacePlaceholders(expression[1], req.stwPublic, req.stwPrivate);

                attrs = {};
                for (let attr of expression[1].matchAll(/([a-zA-Z0-9-_]+)(?:=(["'])([^]*?)\2)?/gmu))
                    attrs[attr[1]] = attr[3] || 'true';
                if (symbol == '\\s') {
                    layout.settings = attrs;
                    layout.attrs = { class: '' };
                    continue;
                }
                if (layout.settings && symbol == '\\a' && !Object.keys(token).length) {
                    attrs.class = attrs.class || '';
                    layout.attrs = attrs;
                    continue;
                }
            } else if ('tTjJ'.indexOf(symbol) != -1) {
                args = [null, null, expression[1]];
            } else if (expression[1]) {
                args = symbol == 'h' ? [null] : [];
                for (let arg of (expression[1] + ';').matchAll(/(?:(=?(["']?)[^]*?\2));/gmu))
                    args.push(arg[1]);
            }
            if (expression[2] && expression[2].match('^[<>p]')) {
                params = [];
                let i = 0;
                for (let symbol of expression[2].matchAll(/(<|>|p(?:\('([^]*?)'\)?)?)/gmu)) {
                    if (symbol[2]) {
                        let pair = [...symbol[2].matchAll(/([a-zA-Z0-9-_]*)(?:;([^]*))?/gmu)][0];
                        params.push({ symbol: 'p', name: pair[1], value: pair[2] || '@@' });
                    } else
                        params.push({ symbol: symbol[0][0], value: '@@' });
                }
            }
            if (symbol == '\\a' && (token.symbol == '\\t' || token.symbol != '\\')) {
                token = layout.tokens.pop();
                if (token.content)
                    token.content.attrs = attrs;
                else
                    token.attrs = Object.assign(token.attrs || {}, attrs);
            } else if (!token.content && 'aAbB'.indexOf(token.symbol) != -1 && 'fitvxyz'.indexOf(symbol) != -1) {
                token = layout.tokens.pop();
                token.content = { symbol: symbol, args: args, params: params, attrs: attrs };
            } else {
                if (symbol == 'A') {
                    symbol = 'a';
                    attrs = { target: '_blank' };
                }
                token = { symbol: symbol, args: args || ['@@'], params: params, attrs: attrs };
            }
            layout.tokens.push(token);
        }
    }
    return layout;
}

// TODO: Used by symbols v and k to set session variables
function evaluate(req, expression) {
    return getValue(req, expression);
}

function getName(req, name = '') {
    return replacePlaceholders(name, req.stwPublic, req.stwPrivate.stwData[req.stwPrivate.stwR]) || Object.keys(req.stwPrivate.stwData[req.stwPrivate.stwR])[req.stwPrivate.stwC] || `Field${req.stwPrivate.stwC}`;
}

export function getValue(req, key) {
    try {
        if (key === '@@')
            return Object.values(req.stwPrivate.stwData[req.stwPrivate.stwR])[req.stwPrivate.stwC++] || '';
        if (key.startsWith('@@')) // dataset, req
            return req.stwPrivate.stwData[req.stwPrivate.stwR][key.replace('@@', '')] || '';
        if (key.startsWith('@')) // data
            return req.data.url.searchParams.get(key.replace('@', '')) || '';
        if (typeof req.stwPrivate.stwData[req.stwPrivate.stwR][key] === 'function')
            return req.stwPrivate.stwData[req.stwPrivate.stwR][key].toString();
        return req.stwPrivate.stwData[req.stwPrivate.stwR][key] || key;
    } catch {
        return key;
    }
}

export function renderAttributes(req, attrs) {
    let html = '';
    if (attrs)
        for (let attr in attrs)
            html += ` ${attr}="${attr === 'name' ? attrs[attr] : encode(getValue(req, attrs[attr]))}"`;
    return html;
}

function renderParameters(req, uri, params) {
    let url;
    try {
        url = new URL(getValue(req, uri));

        url.href = replacePlaceholders(url.href, req.stwPublic, req.stwPrivate.stwData[req.stwPrivate.stwR]);

        if (params)
            for (let param in params)
                url.searchParams.set(param[0] === '§' ? Object.keys(req.stwPrivate.stwData[req.stwPrivate.stwR])[req.stwPrivate.stwC] : param, getValue(req, params[param]));
        return url.href;
    } catch {
        url = new URL('https://stw.local/' + uri);
        for (let param of params) {
            if (param.symbol === 'p')
                url.searchParams.set(param.name || Object.keys(req.stwPrivate.stwData[0])[req.stwPrivate.stwC], getValue(req, param.value));
            else if (param.symbol === '>')
                ++req.stwPrivate.stwC;
            else
                --req.stwPrivate.stwC;
        }
        return url.href.replace('https://stw.local/', '');
    }
}

// flags = CELL|THEAD|TABLE|RECURSE
export function renderer(req, contentId, layout, flags = 0b0000) {
    if (typeof layout == 'string')
        return layout;

    if ((flags & 0b0001) == 0b0000) {
        req.stwPrivate.stwC = 0;
        req.stwPrivate.stwR = req.stwPrivate.stwR || 0;
    }

    if (!layout.tokens.length)
        Object.keys(req.stwPrivate.stwData[0]).forEach(i => {
            layout.tokens.push({ symbol: 'l', args: [] });
            layout.tokens.push({ symbol: 'f', args: [] });
            if ((flags & 0b0110) != 0b0110) layout.tokens.push({ symbol: '\\r', args: [] });
        });

    let html = '', thead = '', str;
    for (let token of layout.tokens)
        try {
            switch (token.symbol) {
                case '<':
                    --req.stwPrivate.stwC;
                    continue;
                case '>':
                    req.stwPrivate.stwC++;
                    continue;
                case 'a':
                    str = token.args ? token.args[0] : '@@';
                    html += `<a href="${renderParameters(req, str, token.params)}" ${renderAttributes(req, token.attrs)}>
                        ${renderer(req, contentId, { settings: layout.settings, tokens: [token.content || { symbol: 't', args: [str] }] }, 0b0001)}</a>`;
                    continue;
                case 'b':
                    // TODO: Table buttons?
                    if (token.args)
                        str = token.args[0] == '.' ? req.data.url.pathname : token.args[0];
                    else
                        str = '@@';
                    token.params.stwHandler = contentId;
                    html += `<button formaction="${renderParameters(req, str, token.params)}" ${renderAttributes(req, token.attrs)}>
                        ${renderer(req, contentId, { settings: layout.settings, tokens: [token.content || { symbol: 't', args: [''] }] } || str, 0b0001)}</button>`;
                    continue;
                case 'c':
                    token.attrs = token.attrs || {};
                    token.attrs.type = 'checkbox'
                    token.attrs.name = getName(req, token.args[0]);
                    token.attrs.value = token.args[1] || '@@';
                    for (let i = 3; i < token.args.length; i += (token.args[2] == 2 ? 2 : 1)) {
                        html += `<label><input${renderAttributes(req, token.attrs)}>`;
                    }
                    continue;
                case 'd':
                    token.attrs = token.attrs || {};
                    token.attrs.name = getName(req, token.args[0]);
                    token.attrs.value = token.args[0] || '@@';
                    html += `<select${renderAttributes(req, token.attrs)}><option></option></select>`;
                    continue;
                case 'h':
                    token.attrs = token.attrs || {};
                    token.attrs.type = 'hidden';
                case 'e':
                    token.attrs = token.attrs || {};
                    token.attrs.name = getName(req, token.args[1]);
                    token.attrs.value = token.args[1] || '@@';
                    html += `<input${renderAttributes(req, token.attrs)}>`;
                    continue;
                case 'f':
                    str = getValue(req, '@@');
                    if (!token.attrs)
                        html += ' ' + str;
                    else
                        html += `<span${renderAttributes(req, token.attrs)}>${str}</span>`;
                    continue;
                case 'i':
                    str = getValue(req, token.args[0]);
                    if (str)
                        html += `<img src="${str}"${renderAttributes(req, token.attrs)}>`;
                    continue;
                case 'j':
                    html += `<script${renderAttributes(req, token.attrs)}>${token.args[2]}</script>`;
                    continue;
                case 'l':
                    str = getName(req, token.args[0]);
                    if ((flags & 0b0010) == 0b0000) // Not table
                        html += `<label${renderAttributes(req, token.attrs)}>${str}</label>`;
                    else if ((flags & 0b0110) == 0b0110) // thead
                        thead += `<th${renderAttributes(req, token.attrs)}>${str}</th>`;
                    else // cell
                        html += ((flags & 0b1000) == 0b1000 ? '</td>' : '') + `<td${renderAttributes(req, token.attrs)}>`;
                    flags |= 0b1000;
                    continue;
                case 'm':
                    token.attrs = token.attrs || {};
                    token.attrs.name = getName(req, token.args[0]);
                    html += `<textarea${renderAttributes(req, token.attrs)}>${encode(getValue(req, token.args[0] || '@@'))}</textarea>`;
                    continue;
                case 'n':
                    continue;
                case 'o':
                    token.args.forEach(child => {
                        req.target.send(JSON.stringify({
                            message: 'request',
                            body: {
                                url: renderParameters(req, 'http://stw.local' + getValue(req, child), token.params),
                                section: `_${contentId}`
                            }
                        }));
                    });
                    html += `<article data-ref="_${contentId}"></article>`;
                    continue;
                case 'r':
                    token.attrs = token.attrs || {};
                    token.attrs.type = 'radio'
                    token.attrs.name = getName(req, token.args[0]);
                    token.attrs.value = token.args[1] || '@@';
                    for (let i = 3; i < token.args.length; i += (token.args[2] == 2 ? 2 : 1)) {
                        html += `<label><input${renderAttributes(req, token.attrs)}>`;
                    }
                    continue;
                case 's':
                    continue;
                case 't':
                case 'v':
                case 'T':
                case 'V':
                    str = 'tv'.indexOf(token.symbol) != -1 ? token.args[2] : evaluate(req, token.args[2]);
                    if (!token.attrs)
                        html += str;
                    else
                        html += `<span${renderAttributes(req, token.attrs)}>${str}</span>`;
                    continue;
                case 'u':
                    continue;
                case 'x':
                case 'y':
                case 'z':
                    continue;
                case '\\n': // TODO: Depends on content: tr+td or br
                    html += '<br>';
                    continue;
                case '\\r':
                    html += '<br>';
                    continue;
                case '\\t': // TODO: Depends on content: td
                    continue;
            }
        } catch (err) {
            throw err;
        }
    if ((flags & 0b0110) == 0b0110)
        return thead;
    return html + ((flags & 0b1000) == 0b1000 ? '</td>' : '');
}
