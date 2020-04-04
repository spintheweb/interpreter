/*!
 * list
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (stw) => {
	stw.List = class List extends stw.Content {
		render(req, res) {
			super.render(req, res, () => {
				var fragment = '';
				this.data.forEach(function(row, i) {
					// TODO: render template
					fragment += `<li>${this.renderRow()}</li>`;
				});
				return `<ul class="stwBody">${fragment}</ul>`;
			});
		}
	};
};
