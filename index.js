/*!
 * webspinner
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const Content = require('./elements/Content');
const Group = require('./elements/Group');

// TODO: Load settings
const hostname = process.env.IP || '127.0.0.1';
const port = process.env.PORT || 3000;

const webspinner = require('http').createServer();
const wsspinner = new (require('ws')).Server({ server: webspinner });
require('./elements/Webbase')(webspinner, path.join(__dirname, 'public', 'data', 'webbase.js'));

webspinner.on('request', (req, res) => {
    let rendered = webspinner.webbase.render(req);

    fs.readFile(rendered, (err, data) => {
        if (err) // If the request is not a file than it must be a webbase element
            res.end(rendered);
        else {
            res.writeHead(200, { 'content-type': mime.lookup(rendered) });
            res.end(data);
        }
    })
    console.log(`${(new Date()).toISOString()} http ${rendered.substring(0, 100)}...`);
});

wsspinner.on('connection', (socket, req) => {
    if (!req.headers.socket)
        req.headers.socket = req.headers['sec-websocket-key'];

    socket.onmessage = (socket, req) => {
        console.log(`${(new Date()).toISOString()} ws ${socket.data.substring(0, 100)}...`);

        let data = JSON.parse(socket.data), url;

        socket = socket.target;
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

            _recurse(element.parent); // Walk up the webbase and show "shared" contents, shared contents are children of areas o groups and are shared by the underlying pages.

            socket.send(JSON.stringify({
                message: 'wrapup',
                body: {
                    emitted: emitted
                }
            }));
        }

        function _emit(content, section = '', subsequence = 0) {
            // Avoid re-emitting the content if a content with the same section and integer sequence has already been emitted in the current request
            if (emitted.indexOf((content.section() || section).toString() + (Math.floor(content.sequence())) + subsequence * 1000) !== -1)
                return;

            // Render content
            let fragment = content.render(socket, null);
            if (fragment != undefined && fragment !== '') {
                emitted.push((content.section() || section).toString() + (Math.floor(content.sequence()) + subsequence * 1000));

                socket.send(JSON.stringify({
                    message: content.constructor.name === 'Script' ? 'script' : 'content',
                    body: {
                        id: content.id,
                        url: content.permalink(),
                        section: content.section() || section,
                        sequence: content.sequence() + subsequence * 1000,
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
            for (let child of element.children) {
                if (child instanceof Content)
                    _emit(child);
                else if (child instanceof Group) {
                    for (let nephew of child.children)
                        _emit(nephew, child.section(), child.sequence());
                }
            }
            if (element.parent)
                _recurse(element.parent);
        }
    }
});

webspinner.listen(port, hostname, () => {
    console.log(`Web spinner listening at http://${hostname}:${port}/`);
});
