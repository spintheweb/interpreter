/*!
 * Area
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from './Miscellanea.mjs';
import Base from './Base.mjs';
import Page from './Page.mjs';
import { createElement } from './Element.mjs';

export default class Area extends Base {
	constructor(params) {
		super(params);
		this.keywords = params.keywords || {};
		this.description = params.description || {};
		this.mainpage = params.mainpage || '';

		if (this.constructor.name === 'Area' && params.children)
			for (let child of params.children)
				this.add(createElement(this, child));
	}

	patch(lang, params = {}) {
		super.patch(lang, params);
		this.keywords = { [lang]: params.keywords };
		this.description = { [lang]: params.description };

		return this;
	}

	add(child) {
		super.add(child);

		if (child instanceof Page && !this.mainpage)
			this.mainpage = child._id;

		return child;
	}

	render(req, res, next) {
		let page = Base[WEBBASE].index.get(this.mainpage);
		if (page)
			return page.render(req, res, next);

		res.sendStatus(204); // 204 No content
	}
}
