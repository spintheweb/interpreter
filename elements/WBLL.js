/*!
 * WBLL - Webbabse Layout Language
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const Entities = require('html-entities').AllHtmlEntities;
const HTML = new Entities();

module.exports = {
    lexer: lexer,
    renderer: renderer,
    getValue: getValue
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

function evaluate(socket, expression) {
    // TODO: if = then javascript
    return getValue(socket, expression);
}

function getName(socket, name) {
    try {
        return name || socket.dataset[socket.row][socket.col] || `Field${socket.col}`;
    } catch {
        return `Field${socket.col}`;
    }
}

function getValue(socket, key) {
    try {
        if (key === '@@')
            return socket.dataset[socket.row][Object.keys(socket.dataset[socket.row])[socket.col++]] || '';
        if (key.startsWith('@@')) // dataset, socket
            return socket.dataset[socket.row][key.replace('@@', '')] || '';
        if (key.startsWith('@')) // data
            return socket.data.url.searchParams.get(key.replace('@', '')) || '';
        if (typeof socket.dataset[socket.row][key] === 'function')
            return socket.dataset[socket.row][key].toString();
        return socket.dataset[socket.row][key] || key;
    } catch {
        return key;
    }
}

function renderAttributes(socket, attrs) {
    let html = '';
    if (attrs)
        for (let attr of Object.keys(attrs))
            html += ` ${attr}="${attr === 'name' ? attrs[attr] : HTML.encode(getValue(socket, attrs[attr]))}"`;
    return html;
}

function renderParameters(socket, uri, params) {
    let url;
    try {
        url = new URL(getValue(socket, uri));

        if (params)
            for (let param of Object.keys(params))
                url.searchParams.set(param, getValue(socket, params[param]));
        return url.href;
    } catch {
        url = new URL('http://stw.local' + uri);
        if (params)
            for (let param of Object.keys(params))
                url.searchParams.set(param, getValue(socket, params[param]));
        return url.href.replace('http://stw.local', '');
    }
}

function renderer(socket, contentId, layout) {
    if (typeof layout == 'string')
        return layout;

    socket.cols = [];
    socket.col = 0;
    socket.row = socket.row || 0;

    let html = '', str;
    for (let token of layout.tokens)
        try {
            switch (token.symbol) {
                case 'a':
                    str = token.args ? token.args[0] : '@@';
                    html += `<a href="${renderParameters(socket, str, token.params)}" onclick="stwHref(event)"${renderAttributes(socket, token.attrs)}>
                        ${renderer(socket, contentId, { settings: layout.settings, tokens: [token.content || { symbol: 't', args: [str] }] })}</a>`;
                    break;
                case 'b':
                    if (token.args)
                        str = token.args[0] == '.' ? socket.data.url.pathname : token.args[0];
                    else
                        str = '@@';
                    token.params.stwHandler = contentId;
                    html += `<button formaction="${renderParameters(socket, str, token.params)}" onclick="stwSubmit(event)"${renderAttributes(socket, token.attrs)}>
                        ${renderer(socket, contentId, { settings: layout.settings, tokens: [token.content || { symbol: 't', args: [''] }] } || str)}</button>`;
                    break;
                case 'c':
                    token.attrs = token.attrs || {};
                    token.attrs.type = 'checkbox'
                    token.attrs.name = getName(socket, token.args[0]);
                    token.attrs.value = token.args[1] || '@@';
                    for (let i = 3; i < token.args.length; i += (token.args[2] == 2 ? 2 : 1)) {
                        html += `<label><input${renderAttributes(socket, token.attrs)}>`;
                    }
                    break;
                case 'd':
                    token.attrs = token.attrs || {};
                    token.attrs.name = getName(socket, token.args[0]);
                    token.attrs.value = token.args[0] || '@@';
                    html += `<select${renderAttributes(socket, token.attrs)}><option></option></select>`;
                    break;
                case 'h':
                    token.attrs = token.attrs || {};
                    token.attrs.type = 'hidden';
                case 'e':
                    token.attrs = token.attrs || {};
                    token.attrs.name = getName(socket, token.args[1]);
                    token.attrs.value = token.args[1] || '@@';
                    html += `<input${renderAttributes(socket, token.attrs)}>`;
                    break;
                case 'f':
                    str = getValue(socket, '@@');
                    if (!token.attrs)
                        html += str;
                    else
                        html += `<span${renderAttributes(socket, token.attrs)}>${str}</span>`;
                    break;
                case 'i':
                    str = getValue(socket, token.args[0]);
                    if (str)
                        html += `<img src="${str}"${renderAttributes(socket, token.attrs)}>`;
                    break;
                case 'j':
                    html += `<script${renderAttributes(socket, token.attrs)}>${token.args[2]}</script>`;
                    break;
                case 'l':
                    str = getName(socket, token.args[0]);
                    html += `<label${renderAttributes(socket, token.attrs)}>${str}</label>`;
                    break;
                case 'm':
                    token.attrs = token.attrs || {};
                    token.attrs.name = getName(socket, token.args[0]);
                    html += `<textarea${renderAttributes(socket, token.attrs)}>${HTML.encode(getValue(socket, token.args[0] || '@@'))}</textarea>`;
                    break;
                case 'n':
                    break;
                case 'o':
                    token.args.forEach(child => {
                        socket.target.send(JSON.stringify({
                            message: 'request',
                            body: {
                                url: renderParameters(socket, 'http://stw.local' + getValue(socket, child), token.params),
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
                    str = 'tv'.indexOf(token.symbol) != -1 ? token.args[2] : evaluate(socket, token.args[2]);
                    if (!token.attrs)
                        html += str;
                    else
                        html += `<span${renderAttributes(socket, token.attrs)}>${str}</span>`;
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
