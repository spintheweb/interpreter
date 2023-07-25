/*!
 * webspinner
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import crypto from 'crypto';
import express from 'express';
import fs from 'fs';
import path from 'path';

import { WEBBASE, PATH, INDEX, STUDIO_DIR, WEBO_DIR } from './elements/Miscellanea.mjs';

const router = express.Router();

/*
const AES_METHOD = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16

// this.cipher = crypto.createCipheriv(AES_METHOD, Buffer.from(ENCRYPTION_KEY), crypto.randomBytes(IV_LENGTH));
*/

router.post('/logon/:_id?', async (req, res) => {
    let users = JSON.parse(fs.readFileSync(path.join(WEBO_DIR, '/data/users.json')));

    let user = users.find(user => user.enabled && user.name === req.body.user && user.password == req.body.password);
    if (user) {
        req.session.user = user.name;
        req.session.roles = user.roles;
    } else {
        req.session.user = 'guest';
        req.session.roles = ['guests'];
    }
    res.redirect(req.app[WEBBASE][INDEX].get(req.params[1] || res.locals.cookie.stwPage)?.Permalink(req.session.lang) || '.');
});

router.post('/logoff/:_id?', async (req, res) => {
    req.session.user = 'guest';
    req.session.roles = ['guests'];

    res.redirect(req.app[WEBBASE][INDEX].get(req.params[1] || res.locals.cookie.stwPage)?.Permalink(req.session.lang) || '.');
});

export default router;