/*!
 * breadcrumbs
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../elements/Miscellanea.mjs';
import Base from '../elements/Base.mjs';
import Content from '../elements/Content.mjs';

export default class Breadcrumbs extends Content {
	constructor(params = {}) {
		super(params);
		delete this.dsn;
		delete this.query;
		delete this.params;
		delete this.layout;
	}

	render(req, res, next) {
		return super.render(req, res, next, () => {
			let lang = req.session.lang;
			let element = Base[WEBBASE].index.get(res.locals.cookie.stwUnit);
			let fragment = element.localizedName(lang);

			for (element = element.parent; element.type != 'Webo'; element = element.parent)
				fragment = `<a href="${element.permalink(lang) || '/'}">${element.localizedName(lang)}</a>/${fragment}` 

			return `<nav ${this.CSSClass}">${fragment}</nav>`;
		});
	}
}
