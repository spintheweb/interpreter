/*!
 * script
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const Content = require('../elements/Content');

module.exports = class Script extends Content {
	constructor(name, template, lang) {
		super(name, template || '', lang);
	}

	render(req, res) {
		let fragment;
		if (this.granted(req.user) & 0b01) {
			fragment = this.template();
		}
		return fragment;
	}
}