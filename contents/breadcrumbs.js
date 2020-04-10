/*!
 * breadcrumbs
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (webspinner) => {
	webspinner.Breadcrumbs = class Breadcrumbs extends webspinner.Content {
		constructor(name, template) {
			super(name, template, true);
			this._category = webspinner.stwContentCategory.NAVIGATIONAL;
		}

		render(req, res) {
			return super.render(req, res, (req, template) => {
				let path = [], slug = '', parent = this.parent;

				// Shared content, parent refers to the session pathname
				if (parent instanceof webspinner.Area)
					parent = webspinner.webbase.route(req.url.pathname);

				// Walk up to top element
				for (let element = parent; element.parent; path.unshift(element), element = element.parent);
				return '<nav>' + path.map(element => {
					slug += `/${element.slug()}`;
					return `<a href="${slug}">${element.name()}</a>`;
				}).join('/') + '</nav>';
			});
		}
	};
};
