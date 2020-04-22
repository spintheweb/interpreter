/*!
 * webspinner
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const fs = require('fs');
const mime = require('mime-types');
const Content = require('./elements/Content');
const Group = require('./elements/Group');

const webspinner = require('http').createServer();
const wsspinner = new (require('ws')).Server({ server: webspinner });

// Load webbase
require('./elements/Webbase')(webspinner, require('path').join(__dirname, 'public', 'data', 'webbase.js'));

webspinner.on('request', (req, res) => {
    let requested = webspinner.webbase.render(req);

    fs.readFile(requested, (err, data) => {
        if (err) // If the request is not a file than it could be a webbase element (API request)
            res.end(requested);
        else {
            res.writeHead(200, { 'content-type': mime.lookup(requested) });
            res.end(data);
        }
    })
    console.log(`${(new Date()).toISOString()} http ${requested.substring(0, 100)}...`);
});

wsspinner.on('connection', socket => {
    socket.user = 'guest';
    socket.lang = 'en';

    socket.onmessage = socket => {
        let element, emitted = [];

        console.log(`${(new Date()).toISOString()} ws   ${socket.data.substring(0, 100)}...`);

        socket.data = JSON.parse(socket.data);

        // Execute serverHandler
        element = webspinner.webbase.getElementById(socket.data.serverHandler);
        if (element && element.granted(socket.target.user) & 0b01 == 0b01 && typeof element._serverHandler == 'function')
            try {
                element._serverHandler(element, socket);
            } catch (err) {
                console.log(`${(new Date()).toISOString()} err  ${err}`);
            }

        try {
            socket.data.url = new URL(socket.data.url);
        } catch (err) {
            socket.data.url = new URL('http://localhost' + (socket.data.url || '/'));
        }

        element = webspinner.webbase.route(socket.data.url.pathname);
        if (!element)
            return; // Abort, nothing to render

        if (element instanceof Content) {
            if (socket.data.children)
                for (let content of element.children) {
                    content.section(content.permalink());
                    _emit(content, socket.data.section);
                }
            else
                _emit(element, socket.data.section);
        } else if (element.constructor.name === 'Page') {
            socket.target.send(JSON.stringify({
                message: 'page',
                body: {
                    id: element.id,
                    lang: webspinner.webbase.lang(),
                    name: element.name()
                }
            }));
            for (let content of element.children)
                _emit(content, socket.data.section);

            _recurse(element.parent); // Walk up the webbase and emit "shared" contents: shared contents are children of areas or groups and are shared by the underlying pages.

            socket.target.send(JSON.stringify({
                message: 'wrapup',
                body: {
                    emitted: emitted
                }
            }));
        }

        // Send content to client
        function _emit(content, section = '', subsequence = 0) {
            // Avoid re-emitting the content if a content with the same section and integer sequence has already been emitted in the current request
            if (emitted.indexOf((content.section() || section).toString() + (Math.floor(content.sequence())) + subsequence * 1000) !== -1)
                return;

            let fragment = content.render(socket, null);
            if (fragment) {
                emitted.push((content.section() || section).toString() + (Math.floor(content.sequence()) + subsequence * 1000));

                socket.target.send(JSON.stringify({
                    message: content.constructor.name === 'Script' ? 'script' : 'content',
                    body: {
                        id: content.id,
                        url: content.permalink(),
                        section: content.section() || section,
                        sequence: content.sequence() + subsequence * 1000,
                        attrs: content.cssClass(undefined, socket.target.lang),
                        children: (content.children.length > 0),
                        query: socket.data.url.search.substring(1) || '',
                        body: fragment.toString()
                    }
                }));
                if (typeof content._clientHandler === 'function') {
                    socket.target.send(JSON.stringify({
                        message: 'script',
                        body: {
                            id: content.constructor.name,
                            body: content._clientHandler.toString()
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

// TODO: Load settings
const hostname = process.env.IP || '127.0.0.1';
const port = process.env.PORT || 3000;

webspinner.listen(port, hostname, () => {
    console.log(`Web spinner listening at http://${hostname}:${port}/`);
});
