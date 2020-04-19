/*!
 * list
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const querystring = require('querystring');
const Content = require('../elements/Content');

module.exports = class List extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	render(req) {
		return super.render(req, (req, template) => {
			let fragment = '<ul>';

			if (!this.datasource()) { // TODO: set the content datasource, query amd template
				this.eventHandler = function stwListRoles(event) {
					event.stopPropagation();
					event.preventDefault();
					let target = event.target.closest('li'), article = target.closest('article');
					stw.send(JSON.stringify({
						id: article.id, url: null, role: target.innerText, grant: [undefined, 0, 1, 1][parseInt(target.dataset.ref, 10)]
					}));
				};
				this.contentHandler = (req) => {
					this.grant(qs.role, qs.grant);
					req.emit('content', qs.id);
				};

				let id = /*querystring.parse(req.url.query).id ||*/ this.webbase.id;
				let el = this.webbase.getElementById(id); // Roled Based Visibility
				for (let role in this.webbase.roles) {
					let granted = el.granted(req.user, role);
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
}