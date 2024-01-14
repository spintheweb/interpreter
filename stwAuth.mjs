/*!
 * webspinner authentication module
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';

import { WEBBASE, WEBO_DIR } from './stwElements/Miscellanea.mjs';
import Base from './stwElements/Base.mjs';

const router = express.Router();

router.post('/logon/:_id?', async (req, res) => {
    let users = JSON.parse(fs.readFileSync(path.join(WEBO_DIR, '/.data/basicAuth.json')));

    let user = users.find(user => user.enabled && user.name === req.body.user && user.pwd == decrypt(req.body.password));
    if (user) {
        req.session.stwUser = user.name;
        req.session.stwRoles = user.roles;
        req.session.stwIsDeveloper = user.roles.includes('developers');
        res.cookie('stwIsDeveloper', req.session.stwIsDeveloper);

    } else {
        req.session.stwUser = 'guest';
        req.session.stwRoles = ['guests'];
        req.session.stwIsDeveloper = false;
        res.cookie('stwIsDeveloper', false);
        res.statusCode = 401; // 401 Unauthorized
    }
    res.redirect(Base[WEBBASE].index.get(req.params[1] || res.locals.cookie.stwPage)?.permalink(req.session.stwLanguage) || '.');
});

router.post('/logoff/:_id?', async (req, res) => {
    req.session.stwUser = 'guest';
    req.session.stwRoles = ['guests'];
    req.session.stwIsDeveloper = false;
    res.cookie('stwIsDeveloper', false);

    res.redirect(Base[WEBBASE].index.get(req.params[1] || res.locals.cookie.stwPage)?.permalink(req.session.stwLanguage) || '.');
});

router.post('/setpwd/:id?', async (req, res) => {
    if (req.session.stwUser === 'guest') {
        res.sendStatus(204); // 204 No content
        return;
    }

    let users = JSON.parse(fs.readFileSync(path.join(WEBO_DIR, '/.data/basicAuth.json')));

    let user = users.find(user => user.enabled && user.name === req.session.stwUser && user.pwd == decrypt(req.body.oldpwd));
    if (req.body.newpwd2 === req.body.newpwd2) {
        user.pwd = encrypt(req.body.newpwd);
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