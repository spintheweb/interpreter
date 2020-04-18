/*!
 * loader
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = scope => {
    require('fs').readdirSync(require('path').join(__dirname, '.')).forEach(file => {
        if (file !== 'index.js')
            scope[file.replace('.js', '')] = require(`./${file}`);
    })
};
