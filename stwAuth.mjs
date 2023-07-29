/*!
 * webspinner
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';

import { WEBBASE, STUDIO_DIR, WEBO_DIR } from './elements/Miscellanea.mjs';

const router = express.Router();

router.post('/logon/:_id?', async (req, res) => {
    let users = JSON.parse(fs.readFileSync(path.join(WEBO_DIR, '/.data/basicAuth.json')));

    let user = users.find(user => user.enabled && user.name === req.body.user && user.pwd == decrypt(req.body.password));
    if (user) {
        req.session.user = user.name;
        req.session.roles = user.roles;
        res.cookie('stwDeveloper', user.roles.includes('developers'));

    } else {
        req.session.user = 'guest';
        req.session.roles = ['guests'];
        res.cookie('stwDeveloper', false);
    }
    res.redirect(req.app[WEBBASE].index.get(req.params[1] || res.locals.cookie.stwPage)?.permalink(req.session.lang) || '.');
});

router.post('/logoff/:_id?', async (req, res) => {
    req.session.user = 'guest';
    req.session.roles = ['guests'];
    res.cookie('stwDeveloper', false);

    res.redirect(req.app[WEBBASE].index.get(req.params[1] || res.locals.cookie.stwPage)?.permalink(req.session.lang) || '.');
});

router.post('/setpwd/:id?', async (req, res) => {
    if (req.session.user === 'guest') {
        res.sendStatus(204); // 204 No content
        return;
    }

    let users = JSON.parse(fs.readFileSync(path.join(WEBO_DIR, '/.data/basicAuth.json')));

    let user = users.find(user => user.enabled && user.name === req.session.user);
    if (req.body.pwd1 === req.body.pwd2) {
        user.password = encrypt(req.body.pwd1);
    }
});

// TODO: Cypher password https://www.geeksforgeeks.org/node-js-crypto-createcipheriv-method/
function encrypt(text) {
    return text;
}
function decrypt(text) {
    return text;
}

export default router;