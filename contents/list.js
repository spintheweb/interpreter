/*!
 * list
 * Copyright(c) 2016 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (wbol) => {
	wbol.List = class List extends wbol.Content {
		render(req, res) {
			super.render(req, res, () => {
				var fragment = '';
				this.data.forEach(function(row, i) {
					// TODO: render template
					fragment += `<li>${this.renderRow()}</li>`;
				});
				return `<ul class="wbolBody">${fragment}</ul>`;
			});
		}
	};
};
