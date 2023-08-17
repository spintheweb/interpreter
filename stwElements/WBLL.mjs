/*!
 * WBLL - Webbabse Layout Language
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
import { encode } from 'html-entities';

const SYNTAX = new RegExp([
    /(\\[aAs])(?:\('([^]*?)'\))/,
    /(\\[rnt])/,
    /(?:([aAbo]))(?:\('([^]*?)'\))?((?:p(\('[^]*?'\))?)*)/,
    /(?:([cefhilmruwxyz]))(?:\('([^]*?)'\))?/,
    /(?:([dnsvV]))(?:\('([^]*?)'\))/,
    /(?:([jJtT]))(?:\('([^]*?)'\))/,
    /\/\/.*$/,
    /\/\*[^]*(\*\/)?/
].map(r => r.source).join('|'), 'gmu');

export function lexer(wbll = '') {
    let layout = { settings: {}, tokens: [] }, token = {}, symbol, args, params, attrs;

    if (typeof wbll != 'string')
        return layout;

    for (let expression of wbll.matchAll(SYNTAX)) {
        try {
            expression = expression.filter((value, i) => (value !== undefined && i));

            symbol = expression[0];
            args = [], params = undefined, attrs = undefined;

            if (symbol) {
                if (symbol == '\\a' || symbol == '\\s' || symbol == '\\A') {
                    attrs = {};
                    for (let attr of expression[1].matchAll(/([a-zA-Z0-9-_]+)(?:=(["'])([^]*?)\2)?/gmu))
                        attrs[attr[1]] = attr[3] || '';
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
                if (expression[2] && expression[2].startsWith('p')) {
                    params = {};
                    for (let param of expression[2].matchAll(/(?:p(?:\('([^]*?)'\))?)/gmu))
                        for (let pair of (param[1] || '').matchAll(/(([a-zA-Z0-9-_]*)(?:;((?:["']?)(?:[^])*\1))?)/gmu)) {
                            params[pair[2] || '__'] = pair[3] || '@@';
                            break;
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
        } catch (err) {
            console.log(err, JSON.stringify(expression));
        }
    }
    return layout;
}

function evaluate(req, expression) {
    // TODO: if = then javascript
    return getValue(req, expression);
}

function getName(req, name) {
    try {
        return name || req.dataset[req.row][req.col] || `Field${req.col}`;
    } catch {
        return `Field${req.col}`;
    }
}

export function getValue(req, key) {
    try {
        if (key === '@@')
            return req.dataset[req.row][Object.keys(req.dataset[req.row])[req.col++]] || '';
        if (key.startsWith('@@')) // dataset, req
            return req.dataset[req.row][key.replace('@@', '')] || '';
        if (key.startsWith('@')) // data
            return req.data.url.searchParams.get(key.replace('@', '')) || '';
        if (typeof req.dataset[req.row][key] === 'function')
            return req.dataset[req.row][key].toString();
        return req.dataset[req.row][key] || key;
    } catch {
        return key;
    }
}

function renderAttributes(req, attrs) {
    let html = '';
    if (attrs)
        for (let attr of Object.keys(attrs))
            html += ` ${attr}="${attr === 'name' ? attrs[attr] : encode(getValue(req, attrs[attr]))}"`;
    return html;
}

function renderParameters(req, uri, params) {
    let url;
    try {
        url = new URL(getValue(req, uri));

        if (params)
            for (let param of Object.keys(params))
                url.searchParams.set(param, getValue(req, params[param]));
        return url.href;
    } catch {
        url = new URL('http://stw.local' + uri);
        if (params)
            for (let param of Object.keys(params))
                url.searchParams.set(param, getValue(req, params[param]));
        return url.href.replace('http://stw.local', '');
    }
}

export function renderer(req, contentId, layout) {
    if (typeof layout == 'string')
        return layout;

    req.cols = [];
    req.col = 0;
    req.row = req.row || 0;

    let html = '', str;
    for (let token of layout.tokens)
        try {
            switch (token.symbol) {
                case 'a':
                    str = token.args ? token.args[0] : '@@';
                    html += `<a href="${renderParameters(req, str, token.params)}" onclick="stwHref(event)"${renderAttributes(req, token.attrs)}>
                        ${renderer(req, contentId, { settings: layout.settings, tokens: [token.content || { symbol: 't', args: [str] }] })}</a>`;
                    break;
                case 'b':
                    if (token.args)
                        str = token.args[0] == '.' ? req.data.url.pathname : token.args[0];
                    else
                        str = '@@';
                    token.params.stwHandler = contentId;
                    html += `<button formaction="${renderParameters(req, str, token.params)}" onclick="stwSubmit(event)"${renderAttributes(req, token.attrs)}>
                        ${renderer(req, contentId, { settings: layout.settings, tokens: [token.content || { symbol: 't', args: [''] }] } || str)}</button>`;
                    break;
                case 'c':
                    token.attrs = token.attrs || {};
                    token.attrs.type = 'checkbox'
                    token.attrs.name = getName(req, token.args[0]);
                    token.attrs.value = token.args[1] || '@@';
                    for (let i = 3; i < token.args.length; i += (token.args[2] == 2 ? 2 : 1)) {
                        html += `<label><input${renderAttributes(req, token.attrs)}>`;
                    }
                    break;
                case 'd':
                    token.attrs = token.attrs || {};
                    token.attrs.name = getName(req, token.args[0]);
                    token.attrs.value = token.args[0] || '@@';
                    html += `<select${renderAttributes(req, token.attrs)}><option></option></select>`;
                    break;
                case 'h':
                    token.attrs = token.attrs || {};
                    token.attrs.type = 'hidden';
                case 'e':
                    token.attrs = token.attrs || {};
                    token.attrs.name = getName(req, token.args[1]);
                    token.attrs.value = token.args[1] || '@@';
                    html += `<input${renderAttributes(req, token.attrs)}>`;
                    break;
                case 'f':
                    str = getValue(req, '@@');
                    if (!token.attrs)
                        html += str;
                    else
                        html += `<span${renderAttributes(req, token.attrs)}>${str}</span>`;
                    break;
                case 'i':
                    str = getValue(req, token.args[0]);
                    if (str)
                        html += `<img src="${str}"${renderAttributes(req, token.attrs)}>`;
                    break;
                case 'j':
                    html += `<script${renderAttributes(req, token.attrs)}>${token.args[2]}</script>`;
                    break;
                case 'l':
                    str = getName(req, token.args[0]);
                    html += `<label${renderAttributes(req, token.attrs)}>${str}</label>`;
                    break;
                case 'm':
                    token.attrs = token.attrs || {};
                    token.attrs.name = getName(req, token.args[0]);
                    html += `<textarea${renderAttributes(req, token.attrs)}>${encode(getValue(req, token.args[0] || '@@'))}</textarea>`;
                    break;
                case 'n':
                    break;
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
                    break;
                case 'r':
                    break;
                case 's':
                    break;
                case 't':
                case 'T':
                case 'v':
                case 'V':
                    str = 'tv'.indexOf(token.symbol) != -1 ? token.args[2] : evaluate(req, token.args[2]);
                    if (!token.attrs)
                        html += str;
                    else
                        html += `<span${renderAttributes(req, token.attrs)}>${str}</span>`;
                    break;
                case 'u':
                    break;
                case 'x':
                case 'y':
                case 'z':
                    break;
                case '\\n': // TODO: Depends on content: tr+td or br
                    html += '<br>';
                    break;
                case '\\r':
                    html += '<br>';
                    break;
                case '\\t': // TODO: Depends on content: td
                    break;
            }
        } catch (err) {
            console.log(err, JSON.stringify(token));
            break;
        }
    return html;
}
