/*!
 * Spin the Web Spinner
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
import express from 'express';
import path from 'path';
import language from 'accept-language-parser';

import WEBBASE from './elements/Webbase.mjs';
import Site from './elements/Site.mjs';

const ROOT_DIR = process.cwd();
const SITE_DIR = path.join(ROOT_DIR, 'public');

const router = express.Router();

export default function (app, webbase) {
    Site(app, path.join(SITE_DIR, webbase)); // Load webbase

    router.all('/cert/*', (req, res, next) => {
        res.redirect('/');
    });
    router.all('/data/*', (req, res, next) => {
        res.redirect('/');
    });

    router.get('/*', (req, res, next) => {
        const lang = language.pick(req.app[WEBBASE].langs, req.headers['accept-language']);
       
        let el = req.app[WEBBASE].route(req.params[0], lang);
        if (typeof el.Render === 'function')
            el.Render(req, res, next);
        else
            next();
    });
    return router;
}
