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
		delete this.dsn;
		delete this.query;
		delete this.params;
		delete this.layout;
	}

	render(req, res, next) {
		return super.render(req, res, next, () => {
			let lang = req.session.lang;
			let element = req.app[WEBBASE].index.get(res.locals.cookie.stwPage);
			let fragment = element.localizedName(lang);

			for (element = element.parent; element.type != 'Webo'; element = element.parent)
				fragment = `<a href="${element.permalink(lang) || '/'}">${element.localizedName(lang)}</a><i class="fas fa-fw fa-angle-right"></i>${fragment}` 

			return `<nav ${this.CSSClass}">${fragment}</nav>`;
		});
	}
}
