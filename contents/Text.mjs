/*!
 * text
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import Content from '../elements/Content';

// Plain text, i.e., renders template as plain text if there is a datasource @ and @@ substitutions are performed
export default class Text extends Content {
	constructor(name, template, lang) {
		super(name, template, lang);
		this._cssClass = null;
	}

	Render(socket) {
		return super.Render(socket, socket => {
			return this.template(socket.target.lang);
		});
	}
}