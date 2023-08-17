/*!
 * text
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE, pickText } from '../stwElements/Miscellanea.mjs';
import Base from '../stwElements/Base.mjs';
import Content from '../stwElements/Content.mjs';

// Plain text, i.e., renders layout as plain text if there is a datasource @ and @@ substitutions are performed
export default class Text extends Content {
	constructor(params = {}) {
		super(params);
		this.cssClass = null;
	}

	render(req, res, next) {
		if (this.granted(req.session.roles) & 0b01) {
			let fragment = pickText([req.session.lang, Base[WEBBASE].lang], this.layout);

			if (this.dsn) {

			}

			if (this.cssClass)
				fragment = `<div class="${this.cssClass}">${fragment}</div>`;

			res.send({ id: this._id, section: this.section, sequence: this.sequence, body: fragment });
		} else
			res.sendStatus(204); // 204 No content
	}
}