/*!
 * webspinner
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const fs = require('fs');
const path = require('path');
//const url = require('url');
const mime = require('mime-types');

const Content = require('./elements/Content');

const webspinner = require('http').createServer();
const wsspinner = new (require('ws')).Server({ server: webspinner });
require('./elements/Webbase')(webspinner, path.join(__dirname, 'public', 'data', 'webbase.js'));

webspinner.on('request', (req, res) => {
    webspinner.webbase.render(req, res);
//    res.setHeader('socket', req.headers.socket || null);
});

wsspinner.on('connection', (socket, req) => {
    if (!req.headers.socket)
        req.headers.socket = req.headers['sec-websocket-key'];

    socket.onmessage = (socket, req) => {
        let data = JSON.parse(socket.data);
        if (stwHandlers.hasOwnProperty(data.message) && data.body) // Disregard undefined handlers and empty bodies
            stwHandlers[data.message](socket.target, req, data.body);
        else
            console.log('Unhandled: ', data);
    };
});

wsspinner.on('disconnect', () => {
    console.log('connect');
});

// TODO: settings
const hostname = process.env.IP || '127.0.0.1';
const port = process.env.PORT || 3000;

webspinner.listen(port, hostname, () => {
    console.log(`Web spinner listening at http://${hostname}:${port}/`);
});

let stwHandlers = {
    content: (socket, req, data) => {
        let url;
        try {
            url = new URL(data.url).pathname;
        } catch {
            url = data.url;
        }

        let element = webspinner.webbase.route(url), emitted = [];
        if (element instanceof Content) {
            if (data.children)
                for (let content of element.children) {
                    content.section(content.permalink());
                    _emit(content);
                }
            else
                _emit(element);
        } else if (element.constructor.name === 'Page') {
            socket.send(JSON.stringify({
                message: 'page',
                body: {
                    id: element.id,
                    lang: webspinner.webbase.lang(),
                    name: element.name()
                }
            }));
            for (let content of element.children)
                _emit(content);

            _recurse(element.parent); // Walk up the webbase and show "shared" contents, shared contents are children of areas and are shared by the underlying pages.

            socket.send(JSON.stringify({
                message: 'wrapup',
                body: {
                    emitted: emitted
                }
            }));
        }

        function _emit(content) {
            // Avoid re-emitting the content if a content with the same section and integer sequence has already been emitted in the current request
            if (emitted.indexOf(content.section() + Math.floor(content.sequence())) !== -1)
                return;

            // Render content
            let fragment = content.render(socket, null);
            if (fragment != undefined && fragment !== '') {
                emitted.push(content.section().toString() + Math.floor(content.sequence()));

                socket.send(JSON.stringify({
                    message: content.constructor.name === 'Script' ? 'script' : 'content',
                    body: {
                        id: content.id,
                        url: content.permalink(),
                        section: content.section(),
                        sequence: content.sequence(),
                        cssClass: content.cssClass(),
                        children: (content.children.length > 0),
                        query: data.url.query || '',
                        body: fragment.toString()
                    }
                }));
                if (typeof content.eventHandler === 'function') {
                    socket.send(JSON.stringify({
                        message: 'script',
                        body: {
                            id: content.constructor.name,
                            body: content.eventHandler.toString()
                        }
                    }));
                }
            }
        }
        function _recurse(element) {
            for (let content of element.children)
                if (content instanceof Content)
                    _emit(content, true);
            if (element.parent)
                _recurse(element.parent, true);
        }
    },
    authenticate: (socket, req, data) => {
        console.log('authenticate');
    }
}
