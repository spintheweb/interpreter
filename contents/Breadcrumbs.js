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

	render(socket) {
		return super.render(socket, socket => {
			let path = [], slug = '', element = this.webbase.route(socket.data.url.pathname);

			// Walk up to the webbase
			for (; element.parent; path.unshift(element), element = element.parent);

			let fragment = '<nav><i class="far fa-fw fa-compass"></i> ';
			fragment += path.map((element, i) => {
				if (!i)
					return `<a href="/" onclick="stwHref(event)">${element.name()}</a>`;
				slug += `/${element.slug()}`;
				return `<a href="${slug}" onclick="stwHref(event)">${element.name()}</a>`;
			}).join(' <i class="fas fa-fw fa-angle-right"></i> ');
			fragment += '</nav>';
			return fragment;
		});
	}
}
