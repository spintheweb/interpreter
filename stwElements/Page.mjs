/*!
 * Page
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE, pickText, replacePlaceholders } from './Miscellanea.mjs';
import Base from './Base.mjs';
import { createElement } from './Element.mjs';

import { join } from 'node:path';
import fs from 'node:fs';

export default class Page extends Base {
	constructor(params) {
		super(params);
		this.keywords = params.keywords || {};
		this.description = params.description || {};
		this.contentType = params.contentType || 'text/html';
		this.template = params.template || 'index.html';

		if (params.children)
			for (let child of params.children)
				this.add(createElement(this, child));
	}

	patch(lang, params = {}) {
		super.patch(lang, params);
		this.keywords = { [lang]: params.keywords };
		this.description = { [lang]: params.description };
		this.contentType = params.contentType;
		this.template = params.template;

		return this;
	}

	render(req, res, next) {
		if (this.granted(req.session.stwRoles) & 0b01 === 0b01) {
			let contents = this.children.filter(content => content.section && content.granted(req.session.stwRoles)).map(content => content._id);

			// Collect contents children of Areas and Webo
			function walk(node, contents) {
				if (!node)
					return;
				node.children.filter(content => content.section && content.granted(req.session.stwRoles) & 0b01 == 0b01).map(content => contents.push(content._id));
				walk(node.parent, contents);
			}
			walk(this.parent, contents);

			res.cookie('stwPage', this._id);
			res.cookie('stwContents', contents.join(','));
			res.set('Content-Type', this.contentType);
			res.set('X-Content-Type-Options', 'nosniff');
			req.session.stwPageTitle = this.localizedName(req.session.stwLanguage);

			if (this.contentType === 'text/html') { 
				// Replace @@ placeholders
				const text = fs.readFileSync(join(process.cwd(), 'public', this.template));
				res.send(replacePlaceholders(text.toString(), {}, req.session));
			} else
				res.sendFile(join(process.cwd(), 'public', this.template));
		} else
			res.sendStatus(204); // 204 No content
	}
}
