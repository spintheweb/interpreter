/*!
 * tree
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../stwElements/Miscellanea.mjs';
import Content from '../stwElements/Content.mjs';

export default class Tree extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	render(socket) {
		return super.render(socket, (socket, template) => {
			let fragment = '<ol>';

			if (!this.datasource()) { // TODO: set the content datasource, query and template
				this._clientHandler = function stwTreeWebbase(event) {
					event.stopPropagation();
					event.preventDefault();
					let target = event.target.closest('li').firstChild;

					if (event.type === 'click') {
						if (event.target.className.indexOf('fa-angle') !== -1) {
							if (event.target.classList.contains('fa-angle-right')) {
								target.parent.Element.lastElementChild.style.display = 'block';
								event.target.classList.replace('fa-angle-right', 'fa-angle-down');
							} else {
								target.parent.Element.lastElementChild.style.display = 'none';
								event.target.classList.replace('fa-angle-down', 'fa-angle-right');
							}
							return;
						}

						(event.currentTarget.querySelector('div.stwSelected') || event.currentTarget).classList.remove('stwSelected');
						target.classList.add('stwSelected');
						stw.send(JSON.stringify({
							url: event.ctrlKey ? target.dataset.ref : `/wboler/properties?id=${target.id}`
						}));
					} else {
						(event.currentTarget.querySelector('div.stwHover') || event.currentTarget).classList.remove('stwHover');
						if (event.type !== 'mouseleave')
							target.classList.add('stwHover');
					}
				};

				this._serverHandler = (socket) => {
					
				}

				fragment = '<ol onclick="stwTreeWebbase(event)" onmousemove="stwTreeWebbase(event)" onmouseleave="stwTreeWebbase(event)">';
				_webbase(this.webbase);

				function _webbase(element, level = 0) {
					if (element.children.length > 0) {
						fragment += `<li><div style="padding-left:${level}em" class="stwRBV${element.granted(socket.target.user)}" id="${element.id}" data-ref="${element.permalink()}"><i class="fa-solid fa-fw fa-angle-${level === 0 ? 'down' : 'right'}"></i>&#8239;<span class="stw${element.constructor.name}Icn"></span>&ensp;${element.localizedName()}</div><ol ${level > 0 ? 'style="display: none"' : ''}>`;
						element.children.forEach(child => _webbase(child, level + 1));
						fragment += '</ol></li>';
					} else {
						fragment += `<li><div style="padding-left:${level}em" class="stwRBV${element.granted(socket.target.user)}" id="${element.id}" data-ref="${element.permalink()}"><i class="fa-solid fa-fw"></i>&#8239;<span class="stw${element.constructor.name}Icn"></span>&ensp;${element.localizedName()}</div></li>`;
					}
				}
			} else {
				this.data.forEach(function (row, i) {
					// TODO: render template recursively
					fragment += `<li>${row}</li>`;
				});
			}
			return fragment + '</ol>';

			function _dir() {
				// TODO: Directory structure
			}
		});
	}
}