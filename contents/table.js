/*!
 * table
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (stw) => {
	stw.Table = class Table extends stw.Content {
		render(req, res) {
			return super.render(req, res, () => {
				let fragment =  '<table class="stwBody">';
				fragment += '<thead><tr></tr></thead><tbody>'; // Consider l and tab symbols
				this.data.forEach(function(row, i) {
					fragment += `<tr>${this.renderRow()}</tr>`;
				});
				fragment += '</tbody><tfoot><tr></tr></tfoot>'; // Consider 
				return fragment;
			});
		}
	};
};
