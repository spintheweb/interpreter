/*!
 * breadcrumbs
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (stw) => {
	stw.Breadcrumbs = class Breadcrumbs extends stw.Content {
		render(req, res) {
			return super.render(req, res, (req, res) => {
				let path = [], slug = '', parent = this.parent;
				
				// Shared content, parent refers to the session pathname
				if (parent instanceof stw.Chapter)
					parent = stw.webbase.route(res.url.pathname);
				
				// Walk up to top element
				for (let element = parent; element.parent; path.unshift(element), element = element.parent);
				return '<nav>' + path.map(element => {
					slug += `/${element.slug()}`;
					return `<a onclick="stw.emit('content', '${slug}')">${element.name()}</a>`;
					}).join(' / ') + '</nav>';
			});
		}
	};
};
