/*!
 * table
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (wbol) => {
	wbol.Table = class Table extends wbol.Content {
		render(req, res) {
			return super.render(req, res, () => {
				let fragment =  '<table class="wbolBody">';
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
