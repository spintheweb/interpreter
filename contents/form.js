/*!
 * form
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (stw) => {
	stw.Form = class Form extends stw.Content {
		render(req, res) {
			return super.render(req, res, () => {
				return `<div class="stwBody">${this.renderRow()}</div>`;
			});
		}
	};
};
