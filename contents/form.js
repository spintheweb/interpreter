/*!
 * form
 * Copyright(c) 2016 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = wbol => {
	wbol.Form = class Form extends wbol.Content {
		render(req, res) {
			return super.render(req, res, () => {
				return `<div class="wbolBody">${this.renderRow()}</div>`;
			});
		}
	};
};
