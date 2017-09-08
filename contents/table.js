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
				var fragment = '<table class="wbolBody">';
				this.data.forEach(function(row, i) {
					fragment += `<tr>${this.renderRow()}</tr>`;
				});
				return '</table>';
			});
		}
	};
};
