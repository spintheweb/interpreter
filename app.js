/*!
 * Spin the Web Spinner
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
const IS_DEV = process.env.NODE_ENV === 'development';

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import express from 'express';
import session from 'express-session';
import language from 'accept-language-parser';

import { WEBBASE, PATH, WEBO_DIR } from './stwElements/Miscellanea.mjs';
import Base from './stwElements/Base.mjs';
import Webo from './stwElements/Webo.mjs';
import stwStudio from './stwStudio.mjs';
import stwAuth from './stwAuth.mjs';

let settings = JSON.parse(fs.readFileSync(path.join(WEBO_DIR, '.settings')) || '{"protocol":"http","hostname":"127.0.0.0","port":"80"}');

const app = express();
app.disable('x-powered-by');

let webbase = path.join(WEBO_DIR, settings.webbase || '.data/webbase.json');
if (fs.existsSync(webbase))
    webbase = fs.readFileSync(webbase);
else
    webbase = '{}';

new Webo(JSON.parse(webbase));
Base[WEBBASE][PATH] = path.join(WEBO_DIR, settings.webbase || '.data/webbase.json');

app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// TODO: Set production MemoryStory
const sessionConfig = {
    secret: settings.secret || 'Spin the Web',
    name: 'stw',
    resave: true,
    saveUninitialized: false,
    cookie: { sameSite: 'strict' }
};

if (!IS_DEV) {
    app.set('trust proxy', 1);
//    sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));
app.use((req, res, next) => {
    if (!req.session.user) {
        req.session.user = IS_DEV ? 'developer' : 'guest';
        req.session.roles = IS_DEV ? ['users', 'developers'] : ['guests'];
        req.session.lang = language.pick(Base[WEBBASE].langs, req.headers['accept-language']);
        req.session.developer = IS_DEV;
        res.cookie('stwDeveloper', req.session.developer);
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

app.use('/stwStudio', stwStudio);
app.use('/stw', stwAuth);

app.get('/*', (req, res, next) => {
    let el = Base[WEBBASE].route(req.params[0], req.session.lang);
    if (el && typeof el.render === 'function')
        el.render(req, res, next);
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
    console.log(`\nSpin the Web running at ${settings.protocol}://${settings.hostname}:${settings.port}/`);
});
