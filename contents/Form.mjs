/*!
 * form
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import Content from '../elements/Content';

export default class Form extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	Render(socket) {
		return super.Render(socket, this.renderRow);
	}
}