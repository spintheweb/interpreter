/*!
 * tree
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const fs = require('fs');
const Content = require('../elements/Content');

module.exports = class Tree extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	render(socket) {
		return super.render(socket, (socket, template) => {
			let fragment = '<ul>';

			if (!this.datasource()) { // TODO: set the content datasource, query and template
				this._clientHandler = function stwTreeWebbase(event) {
					event.stopPropagation();
					event.preventDefault();
					let target = event.target.closest('li').firstChild;

					if (event.type === 'click') {
						if (event.target.className.indexOf('fa-angle') !== -1) {
							if (event.target.classList.contains('fa-angle-right')) {
								target.parentElement.lastElementChild.style.display = 'block';
								event.target.classList.replace('fa-angle-right', 'fa-angle-down');
							} else {
								target.parentElement.lastElementChild.style.display = 'none';
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

				fragment = '<ul onclick="stwTreeWebbase(event)" onmousemove="stwTreeWebbase(event)" onmouseleave="stwTreeWebbase(event)">';
				_webbase(this.webbase);

				function _webbase(element, level = 0) {
					if (element.children.length > 0) {
						fragment += `<li><div style="padding-left:${level}em" class="stwRBV${element.granted(socket.target.user)}" id="${element.id}" data-ref="${element.permalink()}" tabindex="0"><i class="fas fa-fw fa-angle-${level === 0 ? 'down' : 'right'}"></i>&#8239;<span class="stw${element.constructor.name}Icn"></span>&ensp;${element.name()}</div><ul ${level > 0 ? 'style="display: none"' : ''}>`;
						element.children.forEach(child => _webbase(child, level + 1));
						fragment += '</ul></li>';
					} else {
						fragment += `<li><div style="padding-left:${level}em" class="stwRBV${element.granted(socket.target.user)}" id="${element.id}" data-ref="${element.permalink()}"><i class="fas fa-fw"></i>&#8239;<span class="stw${element.constructor.name}Icn"></span>&ensp;${element.name()}</div></li>`;
					}
				}
			} else {
				this.data.forEach(function (row, i) {
					// TODO: render template recursively
					fragment += `<li>${row}</li>`;
				});
			}
			return fragment + '</ul>';

			function _dir() {
				// TODO: Directory structure
			}
		});
	}
}