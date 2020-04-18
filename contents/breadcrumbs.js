/*!
 * breadcrumbs
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const Content = require('../elements/Content');

module.exports = class Breadcrumbs extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	render(req, res) {
		return super.render(req, res, (req, template) => {
			let path = [], slug = '', parent = this.parent;

			// Shared content, parent refers to the session pathname
			if (parent.constructor.name === 'Area')
				parent = webbase.route(req.url.pathname);

			// Walk up to top element
			for (let element = parent; element.parent; path.unshift(element), element = element.parent);
			return '<nav>' + path.map(element => {
				slug += `/${element.slug()}`;
				return `<a href="${slug}">${element.name()}</a>`;
			}).join('/') + '</nav>';
		});
	}
}
