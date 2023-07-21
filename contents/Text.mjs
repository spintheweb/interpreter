/*!
 * text
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../elements/Primitives.mjs';
import Content from '../elements/Content.mjs';

// Plain text, i.e., renders layout as plain text if there is a datasource @ and @@ substitutions are performed
export default class Text extends Content {
	constructor(name, layout, lang) {
		super(name, layout, lang);
		this.cssClass = null;
	}

	Render(req, res, next) {
		let fragment = this.Layout(lang);

		if (this.datasource) {
			
		}

		res.send(fragment);
	}
}