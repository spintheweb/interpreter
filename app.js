/*!
 * Spin the Web Spinner
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
if (process.env.NODE_ENV != 'production' && process.env.NODE_ENV != 'development') {
    console.log('Please set process.env.NODE_ENV={production | development}');
    process.exit();
}
console.log(`process.env.NODE_ENV='${process.env.NODE_ENV}'\n`);

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import express from 'express';
import session from 'express-session';
import language from 'accept-language-parser';

import { WEBBASE, PATH, WEBO_DIR } from './elements/Miscellanea.mjs';
import Base from './elements/Base.mjs';
import Webo from './elements/Webo.mjs';
import stwStudio from './stwStudio.mjs';
import stwAuth from './stwAuth.mjs';

let settings = JSON.parse(fs.readFileSync(path.join(WEBO_DIR, '.settings')) || '{"protocol":"http","hostname":"127.0.0.0","port":"80"}');

const app = express();

let webbase = path.join(WEBO_DIR, settings.webbase || '.data/webbase.json');
if (fs.existsSync(webbase))
    webbase = fs.readFileSync(webbase);
else
    webbase = '{"_id":"169ecfb0-2916-11ee-ad92-6bd31f953e80","type":"Webo","status":"M","name":{"en":"Hello World"},"slug":{"en":"Webo"},"children":[{"_id":"169ecfb1-2916-11ee-ad92-6bd31f953e80","type":"Page","status":"U","name":{"en":"Home"},"slug":{"en":"Home"},"children":[{"_id":"169ecfb2-2916-11ee-ad92-6bd31f953e80","type":"Content","status":"U","name":{"en":"Hello World"},"slug":{"en":"HelloWorld"},"children":[],"visibility":{},"subtype":"Text","cssClass":null,"section":"","sequence":1,"dsn":"","query":"","params":"","layout":{"en":"Hello World from Spin The Web&trade;!"},"_clientHandler":null,"_serverHandler":null,"_idParent":"169ecfb1-2916-11ee-ad92-6bd31f953e80"}],"visibility":{},"keywords":{},"description":{},"contentType":"text/html","template":"index.html","_idParent":"169ecfb0-2916-11ee-ad92-6bd31f953e80"}],"visibility":{"administrators":true,"developers":true,"translators":false,"guests":true,"users":true,"webmasters":false},"mainpage":"169ecfb1-2916-11ee-ad92-6bd31f953e80","langs":["en"],"datasources":{"json":{"mime":"application/json","data":{}}}}';

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

if (process.env.NODE_ENV == 'production') {
    app.set('trust proxy', 1);
//    sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));
app.use((req, res, next) => {
    if (!req.session.user) {
        req.session.user = process.env.NODE_ENV == 'development' ? 'developer' : 'guest';
        req.session.roles = process.env.NODE_ENV == 'development' ? ['users', 'developers'] : ['guests'];
        req.session.lang = language.pick(Base[WEBBASE].langs, req.headers['accept-language']);
        req.session.developer = process.env.NODE_ENV == 'development';
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

app.use('/studio', stwStudio);
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
