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
		}

		render(req, res) {
			return super.render(req, res, (req, template) => {
				let fragment = '<ul>';
				if (!this.datasource()) {
					this.handler = function stwListRoles(event) {
						let target = event.target.closest('li');
//						target.classList.replace();
					};

					_visibilities(webspinner.webbase.roles, this.rbv); // Role based visibilities
				} else {
					this.data.forEach(function (row, i) {
						// TODO: render template recursively
						fragment += `<li>${row}</li>`;
					});
				}
				return fragment + '</ul>';

				function _visibilities(roles, rbv) {
					// TODO: get element visibilities
					for (let role in roles)
						fragment += `<li class="stwRbv${rbv[role] || null} title="${role}" onclick="stwListRoles(event)" data-ref="${rbv[role] || null}"> ${role}</li>`;
				}
			});
		}
	};
};
