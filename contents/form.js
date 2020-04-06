/*!
 * form
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (webspinner) => {
	webspinner.Form = class Form extends webspinner.Content {
		constructor(name, template) {
			super(name, template, true);
		}

		render(req, res) {
			return super.render(req, res, this.renderRow);
		}
	};
};
