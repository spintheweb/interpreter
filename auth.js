/*!
 * webspinner
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

// openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem

const crypto = require('crypto');

const AES_METHOD = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16

// this.cipher = crypto.createCipheriv(AES_METHOD, Buffer.from(ENCRYPTION_KEY), crypto.randomBytes(IV_LENGTH));

