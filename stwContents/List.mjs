/*!
 * list
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import Content from '../stwElements/Content.mjs';

export default class List extends Content {
	constructor(params) {
		super(params);
	}

	async render(req, res, next) {
		return await super.render(req, res, next, () => {
			let fragment = this._layout.settings.rownumber ? '<ol>' : '<ul>';

			for (let row = 0; row < req.dataset.length; ++row) {
				req.row = row;

				let rowAttr = this._layout.tokens.find(token => token.symbol == '\\A') || '';
				if (rowAttr)
					rowAttr = renderAttributes(req, rowAttr.attrs);
				
				fragment += `<li${rowAttr}>${this.renderRow(req)}</li>`;
			}

			return fragment + (this._layout.settings.rownumber ? '</ol>' : '</ul>');
		});
	}
}