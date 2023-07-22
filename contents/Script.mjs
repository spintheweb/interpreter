/*!
 * script
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../elements/Constants.mjs';
import Content from '../elements/Content.mjs';

export default class Script extends Content {
	constructor(name, template, lang) {
		super(name, template || '', lang);
	}

	Render(socket) {
		let fragment;
		if (this.granted(socket.target.user) & 0b01) {
			fragment = this.template(socket.target.lang);
		}
		return fragment;
	}
}