/*!
 * Area
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from './Miscellanea.mjs';
import Base from './Base.mjs';
import Unit from './Unit.mjs';
import createElement from './Element.mjs';

export default class Area extends Base {
	constructor(params = {}) {
		super(params);
		this.keywords = params.keywords || {};
		this.description = params.description || {};
		this.mainunit = params.mainunit || '';

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

		if (child instanceof Unit && !this.mainunit)
			this.mainunit = child._id;

		return child;
	}

	render(req, res, next) {
		let unit = Base[WEBBASE].index.get(this.mainunit);
		if (unit)
			return unit.render(req, res, next);

		res.sendStatus(204); // 204 No content
	}
}
