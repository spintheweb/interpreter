/*!
 * list
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (webspinner) => {
	webspinner.List = class List extends webspinner.Content {
		constructor(name, template) {
			super(name, template || 'f'.repeat(10), true);
		}

		render(req, res) {
			super.render(req, res, (req, template) => {
				let fragment = '';
				this.data.forEach(function (row, i) {
					fragment += `<li>${this.renderRow()}</li>`;
				});
				return `<ul>${fragment}</ul>`;
			});
		}
	};
};
