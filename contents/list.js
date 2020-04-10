/*!
 * list
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (webspinner) => {
	webspinner.List = class List extends webspinner.Content {
		constructor(name, template) {
			super(name, template, true);
			this._category = webspinner.stwContentCategory.ORGANIZATIONAL;

			// Code executed by the client to handle the content
			this.handler = function stwList(event) {
				alert('clicked');
			};
		}

		render(req, res) {
			return super.render(req, res, (req, template) => {
				let fragment = '<ul>';
				if (!this.datasource()) {
					_render(webspinner.webbase.roles); // Render webbase roles
				} else {
					this.data.forEach(function (row, i) {
						// TODO: render template recursively
						fragment += `<li>${row}</li>`;
					});
				}
				return fragment + '</ul>';

				function _render(roles) {
					for (let role in roles) {
						fragment += `<li class="stw${roles[role].enabled} title="${role}" onclick="stwList(event)"> ${role}</li>`;
					}
				}
			});
		}
	};
};
