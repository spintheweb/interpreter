/*!
 * list
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const querystring = require('querystring');

module.exports = (webspinner) => {
	webspinner.List = class List extends webspinner.Content {
		constructor(name, template) {
			super(name, template, true);
			this._category = webspinner.stwContentCategory.ORGANIZATIONAL;
		}

		render(req, res) {
			return super.render(req, res, (req, template) => {
				let fragment = '<ul>';

				if (!this.datasource()) { // TODO: set the content datasource, query amd template
					this.eventHandler = function stwListRoles(event) {
						let target = event.target.closest('li'), article = target.closest('article');
						stw.emit('content', { id: article.id, url: null, role: target.innerText, grant: [undefined, 0, 1, 1][parseInt(target.getAttribute('data-ref'), 10)] });
					};
					this.contentHandler = (req, res) => {
						this.grant(qs.role, qs.grant);
						req.emit('content', qs.id);
					};

					let id = querystring.parse(req.url.query).id || webspinner.webbase.webo.id;
					let el = webspinner.webbase.webo.getElementById(id); // Roled Based Visibility
					for (let role in webspinner.webbase.roles) {
						let granted = el.granted(role);
						fragment += `<li class="stwRBVIcn${granted}" onclick="stwListRoles(event)" data-ref="${granted}"> ${role}</li>`;
					}
				} else {
					this.data.forEach(function (row, i) {
						// TODO: render template recursively
						fragment += `<li>${row}</li>`;
					});
				}

				return fragment + '</ul>';
			});
		}
	};
};
