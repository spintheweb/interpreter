/*!
 * Page
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from './Miscellanea.mjs';
import Base from './Base.mjs';

import { join } from 'path';

export default class Page extends Base {
	constructor(params = {}) {
		super(params);
		this.keywords = params.keywords || {};
		this.description = params.description || {};
		this.contentType = params.contentType || 'text/html';
		this.template = params.template || 'index.html';
	}

	ContentType(value) {
		if (typeof value === 'undefined') return this.contentType;
		this.contentType = value;
		return this;
	}
	Template(value) {
		if (typeof value === 'undefined')
			return this.template;
		this.template = value;
		return this;
	}

	Render(req, res, next) {
		if (this.granted(req.session.roles) & 0b01 === 0b01) {
			let contents = this.children.filter(content => content.section && content.granted(req.session.roles)).map(content => content._id);

			res.cookie('stwContents', contents.join(','));
			res.header('Content-Type', this.contentType);
			res.sendFile(join(process.cwd(), 'public', this.Template()));
		} else
			next();
	}
}
