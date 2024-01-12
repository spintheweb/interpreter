/*!
 * script
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../stwElements/Miscellanea.mjs';
import Content from '../stwElements/Content.mjs';

export default class Script extends Content {
	constructor(params) {
		super(params);
	}

	render(socket) {
		let fragment;
		if (this.granted(socket.target.user) & 0b01) {
			fragment = this.template(socket.target.lang);
		}
		return fragment;
	}
}