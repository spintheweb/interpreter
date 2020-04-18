/*!
 * WBLL - Webbabse Layout Language
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = {
    lexer: lexer,
    renderer: renderer
}

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

function lexer(wbll = '') {
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

function getValue(req, key) {
    try {
        let data = req.data;

        if (key === '@@')
            return data[data._cols[data._col++]] || '';
        if (key.startsWith('@@')) // dataset, session, application, server
            return data[key.replace('@@', '')] || '';
        if (key.startsWith('@')) // querystring, cookies
            return req.cookies[key.replace('@', '')] || req.query[key.replace('@', '')] || '';
        return key;
    } catch {
        return undefined;
    }
}

function renderAttributes(req, attrs) {
    let html = '';
    if (attrs)
        for (let attr of Object.keys(attrs))
            html += ` ${attr}="${getValue(req, attrs[attr])}"`;
    return html;
}

function renderParameters(req, uri, params) {
    try {
        let url = new URL(getValue(req, uri));

        if (params)
            for (let param of Object.keys(params))
                url.searchParams.set(param, getValue(req, params[param]));
        return url.href;
    } catch {
        return '/';
    }
}

function renderer(req, layout) {
    if (typeof layout == 'string')
        return layout;

    req.data = req.data || { _cols: [], _col: 0 }

    let html = '', str;
    for (let token of layout.tokens)
        try {
            switch (token.symbol) {
                case 'a':
                    str = token.args ? token.args[0] : '@@';
                    // TODO: Web socket call
                    html += `<a href="${renderParameters(req, str, token.params)}"${renderAttributes(req, token.attrs)}>${renderer(req, { settings: layout.settings, tokens: [token.content || { symbol: 't', args: [str] }] })}</a>`;
                    break;
                case 'b':
                    str = token.args ? token.args[0] : '@@';
                    // TODO: Web socket call
                    html += `<button type="submit" formaction="${renderParameters(req, str, token.params)}"${renderAttributes(req, token.attrs)}>${renderer(req, { settings: layout.settings, tokens: [token.content || { symbol: 't', args: [''] }] } || str)}</button>`;
                    break;
                case 'c':
                    token.attrs = token.attrs || {};
                    token.attrs.type = 'checkbox'
                    token.attrs.name = token.args[0] || req.data._cols[req.data._col];
                    token.attrs.value = token.args[1] || '@@';
                    for (let i = 3; i < token.args.length; i += (token.args[2] == 2 ? 2 : 1)) {
                        html += `<label><input${renderAttributes(req, token.attrs)}>`;
                    }
                    break;
                case 'd':
                    break;
                case 'h':
                    token.attrs = token.attrs || {};
                    token.attrs.type = 'hidden';
                case 'e':
                    token.attrs = token.attrs || {};
                    token.attrs.name = token.args[1] || req.data._cols[req.data._col];
                    token.attrs.value = token.args[2] || '@@';
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
                    str = token.args[0] || req.data._cols[req.data._col];
                    html += `<label${renderAttributes(req, token.attrs)}>${str}</label>`;
                    break;
                case 'm':
                    html += `<textarea${renderAttributes(req, token.attrs)}></textarea>`;
                    break;
                case 'n':
                    break;
                case 'o':
                    token.args.forEach(content => {
                        content = getValue(req, content);
                        if (content)
                            html += `<article${renderAttributes(req, token.attrs)}>${content}</article>`;
                    });
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
