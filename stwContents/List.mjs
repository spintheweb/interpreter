/*!
 * list
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../stwElements/Miscellanea.mjs';
import Base from '../stwElements/Base.mjs';
import Content from '../stwElements/Content.mjs';

export default class List extends Content {
	constructor(params = {}) {
		super(params);
	}

	render(req, res, next) {
		return super.render(req, res, next, () => {
			let fragment = '<ol>';

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

				let id = socket.data.searchParams.id || Base[WEBBASE].id;
				let el = Base[WEBBASE].getElementById(id); // Roled Based Visibility
				for (let role in Base[WEBBASE].roles) {
					let granted = el.granted(socket.target.user, role);
					fragment += `<li class="stwRBVIcn${granted}" onclick="stwListRoles(event)" data-ref="${granted}"> ${role}</li>`;
				}
			} else {
				socket.dataset.forEach(function (row, i) {
					socket.datarow = row;
					fragment += `<li>${this.renderRow(socket, this.id, template)}</li>`; // TODO: render template recursively
				});
			}

			return fragment + '</ol>';
		});
	}
}