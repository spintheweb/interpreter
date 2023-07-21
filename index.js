/*!
 * webspinner
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import express from 'express';
import session from 'express-session';

import stwStudio from './stwStudio.mjs';
import stwSpinner from './stwSpinner.mjs';

const ROOT_DIR = process.cwd();
const SITE_DIR = path.join(ROOT_DIR, 'public');
const STUDIO_DIR = path.join(ROOT_DIR, 'studio');

let settings = JSON.parse(fs.readFileSync(path.join(SITE_DIR, 'settings.json')) || '{"protocol":"http","hostname":"127.0.0.0","port":"80"}');

const app = express();

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

app.use(stwSpinner(app, settings.webbase));
app.use(express.static(SITE_DIR));

let server;
if (settings.protocol === 'https')
    // $ openssl genrsa -out key.pem // Generate private key
    // $ openssl req -new -key key.pem -out csr.pem // Create certificate signin request
    // $ openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem // Generate SLL certificate (del csr.pem)
    server = https.createServer({
        key: fs.readFileSync(path.join(SITE_DIR, settings.options.key)),
        cert: fs.readFileSync(path.join(SITE_DIR, settings.options.cert))
    }, app);
else
    server = http.createServer(app);

server.listen(settings.port, settings.hostname, () => {
    console.log(`Spin the Web running at ${settings.protocol}://${settings.hostname}:${settings.port}/`);
});
