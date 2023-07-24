/*!
 * Area
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE, INDEX } from './Miscellanea.mjs';
import Base from './Base.mjs';
import Page from './Page.mjs';

export default class Area extends Base {
	constructor(params = {}) {
		super(params);
		this.keywords = params.keywords || {};
		this.description = params.description || {};
		this.mainpage = params.mainpage || '';
	}
	Mainpage(value) {
		if (typeof value === 'undefined')
			return this.mainpage || this[WEBBASE].mainpage;
		if (value instanceof Page)
			this.mainpage = value._id;
		return this;
	}

	add(child, isMain) {
		super.add(child);
		if (child instanceof Page && isMain || !this.Mainpage())
			this.Mainpage(child);
		return this;
	}

	Render(req, res, next) {
		let page = req.app[WEBBASE][INDEX].get(this.mainpage);
		if (page)
			return page.Render(req, res, next);

		res.status(204).send({}); // 204 No content
	}
}
