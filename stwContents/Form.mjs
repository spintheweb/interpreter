/*!
 * form
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../stwElements/Miscellanea.mjs';
import Content from '../stwElements/Content.mjs';

export default class Form extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	render(socket) {
		return super.render(socket, this.renderRow);
	}
}