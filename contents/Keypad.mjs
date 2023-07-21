/*!
 * keypad
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import WEBBASE from '../elements/Webbase.mjs';
import Content from '../elements/Content.mjs';

export default class Keypad extends Content {
	constructor(name, template, lang) {
		super(name, template || 'abcdefghijklmnopqrstuvwxyz', lang);
	}

	Render(socket) {
		return super.Render(socket, (socket, template) => {
			let fragment = '';
			this.template(socket.target.lang).split('').forEach((c, i) => {
				if (c === '\n')
					return fragment += '<br>';
				return fragment += `<li data-ref="${c}">${c}</a></li>`;
			});
			return `<ul class="stwBody">${fragment}</ul>`;
		});
	}
}