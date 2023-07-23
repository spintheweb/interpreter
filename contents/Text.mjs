/*!
 * text
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../elements/Miscellanea.mjs';
import Content from '../elements/Content.mjs';

// Plain text, i.e., renders layout as plain text if there is a datasource @ and @@ substitutions are performed
export default class Text extends Content {
	constructor(params = {}) {
		super(params);
		this.cssClass = null;
	}

	Render(req, res, next) {
		let fragment = this.Layout(req.session.lang);

		if (this.datasource) {
			
		}

		res.send({ type: 'text/plain', id: this._id, section: this.section, sequence: this.sequence, body: fragment });
	}
}