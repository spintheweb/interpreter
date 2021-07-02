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

	render(socket) {
		let fragment;
		if (this.granted(socket.target.user) & 0b01) {
			fragment = this.template(socket.target.lang);
		}
		return fragment;
	}
}