/*!
 * list
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../elements/Miscellanea.mjs';
import Content from '../elements/Content.mjs';

export default class List extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	render(req, res, next) {
		return super.render(req, res, next, () => {
			let fragment = '<ul>';

			if (!this.datasource()) { // TODO: set the content datasource, query amd template
				this._clientHandler = function stwListRoles(event) {
					event.stopPropagation();
					event.preventDefault();
					let target = event.target.closest('li'), article = target.closest('article');
					stw.send(JSON.stringify({
						id: article.id, url: null, role: target.innerText, grant: [undefined, 0, 1, 1][parseInt(target.dataset.ref, 10)]
					}));
				};
				this._serverHandler = (element, socket) => {
					element.grant(socket.data.role, socket.data.grant);
					socket.emit('content', element.id);
				};

				let id = socket.data.searchParams.id || req.app[WEBBASE].id;
				let el = req.app[WEBBASE].getElementById(id); // Roled Based Visibility
				for (let role in req.app[WEBBASE].roles) {
					let granted = el.granted(socket.target.user, role);
					fragment += `<li class="stwRBVIcn${granted}" onclick="stwListRoles(event)" data-ref="${granted}"> ${role}</li>`;
				}
			} else {
				socket.dataset.forEach(function (row, i) {
					socket.datarow = row;
					fragment += `<li>${this.renderRow(socket, this.id, template)}</li>`; // TODO: render template recursively
				});
			}

			return fragment + '</ul>';
		});
	}
}