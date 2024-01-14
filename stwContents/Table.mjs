/*!
 * table
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import Content from '../stwElements/Content.mjs';
import { renderer, renderAttributes } from '../stwElements/WBLL.mjs';

export default class Table extends Content {
	constructor(params) {
		super(params);
	}

	async render(req, res, next) {
		return await super.render(req, res, next, () => {
			let fragment = '<table>';

			// Render thead
			fragment += `<thead><tr>${this._layout.settings.rownumber ? '<th></th>' : ''}${renderer(req, this._id, this._layout, 0b0110)}</tr></thead>`;
			// TODO: Search row

			fragment += '<tbody>';
			for (let row = 0; row < req.dataset.length; ++row) {
				req.row = row;

				let rowAttr = this._layout.tokens.find(token => token.symbol == '\\A') || '';
				if (rowAttr)
					rowAttr = renderAttributes(req, rowAttr.attrs);

				// TODO: Render break
				// TODO: Editable row
				fragment += `<tr${rowAttr}>${this._layout.settings.rownumber ? '<td>' + (row + 1) + '</td>' : ''}${renderer(req, this._id, this._layout, 0b0010)}</tr>`;
			}
			fragment += '</tbody>';
			
			// Render tfoot
			fragment += '<tfoot></tfoot>';

			return fragment + '</table>';
		});
	}
}