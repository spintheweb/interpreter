/*!
 * Spin the Web Spinner
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import express from 'express';
import session from 'express-session';
import language from 'accept-language-parser';

import stwStudio from './stwStudio.mjs';
import { WEBBASE, SITE_DIR, STUDIO_DIR } from './elements/Miscellanea.mjs';
import Site from './elements/Site.mjs';

let settings = JSON.parse(fs.readFileSync(path.join(SITE_DIR, 'settings.json')) || '{"protocol":"http","hostname":"127.0.0.0","port":"80"}');

const app = express();

app[WEBBASE] = new Site({ webbase: path.join(SITE_DIR, settings.webbase) });

app.use(session({
    secret: settings.secret || 'Spin the Web',
    cookie: { sameSite: 'strict' }
}));
app.use((req, res, next) => {
    if (!req.session.user) {
        req.session.user = 'guest';
        req.session.roles = ['guests'];
    }
    next();
});

app.use(express.json());
app.use(express.text());

app.use('/studio', express.static(STUDIO_DIR));
app.use('/studio', stwStudio);

app.all('/cert/*', (req, res, next) => res.redirect('/'));
app.all('/data/*', (req, res, next) => res.redirect('/'));

app.get('/*', (req, res, next) => {
    const lang = language.pick(req.app[WEBBASE].langs, req.headers['accept-language']);
   
    let el = req.app[WEBBASE].route(req.params[0], lang);
    if (typeof el.Render === 'function')
        el.Render(req, res, next);
    else
        next();
});
app.use(express.static(SITE_DIR));

let server;
if (settings.protocol === 'https')
    server = https.createServer({
        key: fs.readFileSync(path.join(SITE_DIR, settings.options.key)),
        cert: fs.readFileSync(path.join(SITE_DIR, settings.options.cert))
    }, app);
else
    server = http.createServer(app);

server.listen(settings.port, settings.hostname, () => {
    console.log(`Spin the Web running at ${settings.protocol}://${settings.hostname}:${settings.port}/`);
});
