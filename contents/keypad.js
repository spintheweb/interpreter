/*!
 * keypad
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const Content = require('../elements/Content');

module.exports = class Keypad extends Content {
	constructor(name, template, lang) {
		super(name, template || 'abcdefghijklmnopqrstuvwxyz', lang);
	}

	render(socket) {
		return super.render(socket, (socket, template) => {
			let fragment = '';
			this.template().split('').forEach((c, i) => {
				if (c === '\n')
					return fragment += '<br>';
				return fragment += `<li data-ref="${c}">${c}</a></li>`;
			});
			return `<ul class="stwBody">${fragment}</ul>`;
		});
	}
}