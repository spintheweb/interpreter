/*!
 * map
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const Content = require('../elements/Content');

module.exports = class Map extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}
} // GIS

