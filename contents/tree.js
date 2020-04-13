/*!
 * tree
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const fs = require('fs');

module.exports = (webspinner) => {
	webspinner.Tree = class Tree extends webspinner.Content {
		constructor(name, template) {
			super(name, template, true);
			this._category = webspinner.stwContentCategory.ORGANIZATIONAL;
		}

		render(req, res) {
			return super.render(req, res, (req, template) => {
				let fragment = '<ul>';

				if (!this.datasource()) { // TODO: set the content datasource, query amd template
					this.eventHandler = function stwTreeWebbase(event) {
						debugger;
						let target = event.target.closest('li'), url = new URL('/properties', window.location.origin);
						stw.emit('content', { url: url, id: target.id });
					};

					fragment = '<ul onclick="stwTreeWebbase(event)">';
					_webbase(webspinner.webbase.webo);

					function _webbase(element) {
						if (element.children.length > 0) {
							fragment += `<li class="stw${element.constructor.name}Icn stwRBV${element.granted()}" id="${element.id}" data-ref="${element.permalink()}" title="${element.slug(true)}"> ${element.name()}<ul>`;
							element.children.forEach(child => _webbase(child));
							fragment += '</ul></li>';
						} else {
							if (element.constructor.name == 'Content')
								fragment += `<li class="stwTextIcn stwRBV${element.granted()}" id="${element.id}" data-ref="${element.permalink()}" title="${element.slug(true)}"> ${element.name()}</li>`;
							else
								fragment += `<li class="stw${element.constructor.name}Icn stwRBV${element.granted()}" id="${element.id}" data-ref="${element.permalink()}" title="${element.slug(true)}"> ${element.name()}</li>`;
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
	};
};
