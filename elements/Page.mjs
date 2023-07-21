/*!
 * Page
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from './Primitives.mjs';
import Base from './Base.mjs';

import { join } from 'path';

export default class Page extends Base {
	constructor(name, template, lang) {
		super(name, lang);
		this.keywords = {};
		this.description = {};
		this.contentType = 'text/html';
		this.template = template || 'index.html';
	}

	ContentType(value) {
		if (typeof value === 'undefined') return this.contentType;
		this.contentType = value;
		if (typeof this[WEBBASE].changed === 'function')
			this[WEBBASE].changed(this);
		return this;
	}
	Template(value) {
		if (typeof value === 'undefined')
			return this.template;
		this.template = value;
		if (typeof this[WEBBASE].changed === 'function')
			this[WEBBASE].changed(this);
		return this;
	}

	Render(req, res, next) {
		if (this.granted(req.session.roles)) {
			let contents = this.children.filter(content => content.section && content.granted(req.session.roles)).map(content => content._id);

			res.cookie('stwContents', contents.join(','));
			res.header('Content-Type', this.contentType);
			res.sendFile(join(process.cwd(), 'public', this.Template()));
		} else
			next();
	}
}
