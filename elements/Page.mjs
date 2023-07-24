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

			// Collect contents children of Areas and Site
			(function walk(node, contents) {
				if (!node)
					return;
				node.children.filter(content => content.section && content.granted(req.session.roles) & 0b01 == 0b01).map(content => contents.push(content._id));
				walk(node.Parent(), contents);
			})(this.Parent(), contents);

			res.cookie('stwPage', this._id);
			res.cookie('stwContents', contents.join(','));
			res.header('Content-Type', this.contentType);
			res.sendFile(join(process.cwd(), 'public', this.Template()));
		} else
			res.status(204).send({}); // 204 No content
	}
}
