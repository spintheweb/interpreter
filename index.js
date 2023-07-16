/*!
 * webspinner
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
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

if (settings.protocol === 'https')
    settings.options = {
        key: settings.options.key ? fs.readFileSync(path.join(SITE_DIR, settings.options.key)) : null,
        cert: settings.options.certificate ? fs.readFileSync(path.join(SITE_DIR, settings.options.certificate)) : null
    };

const app = express();

app.disable('x-powered-by');
app.use(function (req, res, next) {
    res.setHeader('charset', 'utf-8');
    res.setHeader('x-content-type-options', 'nosniff');
    res.setHeader('cache-control', 'no-cache');
    next();
});

app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'Spin the Web',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));
app.use((req, res, next) => {
    if (!req.session.user) {
        req.session.user = 'guest';
        req.session.roles = ['guests', ''];
        req.session.langs = req.headers['accept-language'];
    }
    next();
});

app.use(express.json()); // Needed for parsing application/json
app.use(express.text()); // Needed for parsing text/plain

app.use(express.static(SITE_DIR));
stwSpinner(app, settings.webbase);
app.use('/studio', express.static(STUDIO_DIR));
stwStudio(app);

app.listen(settings.port, settings.hostname, () => {
    console.log(`Spin the Web running at ${settings.protocol}://${settings.hostname}:${settings.port}/`);
});
