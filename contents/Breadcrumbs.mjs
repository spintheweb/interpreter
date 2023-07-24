/*!
 * breadcrumbs
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE, INDEX } from '../elements/Miscellanea.mjs';
import Content from '../elements/Content.mjs';

export default class Breadcrumbs extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	Render(req, res, next) {
		return super.Render(req, res, next, () => {
			let lang = req.session.lang;
			let element = this[WEBBASE][INDEX].get(req.res.locals.cookie.stwPage);
			let fragment = element.Name(lang);

			for (element = element.Parent(); element.type != 'Site'; element = element.Parent())
				fragment = `<a href="${element.Permalink(lang) || '/'}">${element.Name(lang)}</a><i class="fas fa-fw fa-angle-right"></i>${fragment}` 

			return `<nav ${this.CSSClass()}">${fragment}</nav>`;
		});
	}
}
