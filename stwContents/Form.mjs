/*!
 * form
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import Content from '../stwElements/Content.mjs';
import { renderer } from '../stwElements/WBLL.mjs';

export default class Form extends Content {
	constructor(params) {
		super(params);
	}

	async render(req, res, next) {
		return super.render(req, res, next, () => {
			return renderer(req, this.id, this._layout);
		});
	}
}