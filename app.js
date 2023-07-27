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
import stwAuth from './stwAuth.mjs';
import { WEBBASE, WEBO_DIR, STUDIO_DIR } from './elements/Miscellanea.mjs';
import Webo from './elements/Webo.mjs';

let settings = JSON.parse(fs.readFileSync(path.join(WEBO_DIR, 'settings.json')) || '{"protocol":"http","hostname":"127.0.0.0","port":"80"}');

const app = express();

app[WEBBASE] = new Webo({ webbase: path.join(WEBO_DIR, settings.webbase) });

app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const sessionConfig = {
    secret: settings.secret || 'Spin the Web',
    name: 'stw',
    resave: true,
    saveUninitialized: false,
    cookie: { sameSite: 'strict' }
};
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
    sessionConfig.cookie.secure = true;
}
app.use(session(sessionConfig));
app.use((req, res, next) => {
    if (!req.session.user) {
        req.session.user = 'guest';
        req.session.roles = ['guests'];
        req.session.lang = language.pick(req.app[WEBBASE].langs, req.headers['accept-language']);
        res.cookie('stwDeveloper', false);
    }

    const { headers: { cookie } } = req;
    if (cookie) {
        const values = cookie.split(';').reduce((res, item) => {
            const data = item.trim().split('=');
            return { ...res, [data[0]]: data[1] };
        }, {});
        res.locals.cookie = values;
    }
    else 
        res.locals.cookie = {};
    next();
});

app.use('/studio', stwStudio);
app.use('/stw', stwAuth);

app.get('/*', (req, res, next) => {
    let el = req.app[WEBBASE].route(req.params[0], req.session.lang);
    if (el && typeof el.Render === 'function')
        el.Render(req, res, next);
    else
        next();
});
app.use(express.static(WEBO_DIR));

let server;
if (settings.protocol === 'https')
    server = https.createServer({
        key: fs.readFileSync(path.join(WEBO_DIR, settings.options.key)),
        cert: fs.readFileSync(path.join(WEBO_DIR, settings.options.cert))
    }, app);
else
    server = http.createServer(app);

server.listen(settings.port, settings.hostname, () => {
    console.log(`Spin the Web running at ${settings.protocol}://${settings.hostname}:${settings.port}/`);
});
