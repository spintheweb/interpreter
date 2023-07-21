/*!
 * breadcrumbs
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../elements/Webbase.mjs';
import Content from '../elements/Content.mjs';

export default class Breadcrumbs extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	Render(socket) {
		return super.Render(socket, socket => {
			let path = [], element = this[WEBBASE].route(socket.data.url.pathname);

			// Walk up to the webbase
			for (; element.Parent(); path.unshift(element), element = element.Parent());

			let fragment = '<nav><i class="far fa-fw fa-compass"></i> ';
			fragment += path.map((element, i) => {
				if (!i)
					return `<a href="/" onclick="stwHref(event)">${element.name()}</a>`;
				return `<a href="/${element.slug}" onclick="stwHref(event)">${element.name()}</a>`;
			}).join(' <i class="fas fa-fw fa-angle-right"></i> ');
			fragment += '</nav>';
			return fragment;
		});
	}
}
