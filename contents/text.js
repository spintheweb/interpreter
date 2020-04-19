/*!
 * text
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const Content = require('../elements/Content');

// Plain text, i.e., renders template as plain text if there is a datasource @ and @@ substitutions are performed
module.exports = class Text extends Content {
	constructor(name, template, lang) {
		super(name, template, lang);
		this._cssClass = null;
	}

	render(req) {
		return super.render(req, (req, template) => {
			return this.template();
		});
	}
}