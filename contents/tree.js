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

			// Code executed by the client to handle the content
			this.handler = null;
		}

		render(req, res) {
			return super.render(req, res, (req, template) => {
				let fragment = '<ul>';
				if (!this.datasource()) {
					this.handler = function stwTreeWebbase(event) {
						let target = event.target.closest('li');
						alert(target.getAttribute('data-ref'));
					};
					fragment = '<ul onclick="stwTreeWebbase(event)">';
					_webbase(webspinner.webbase.webo); // Render webbase structure
				} else {
					this.data.forEach(function (row, i) {
						// TODO: render template recursively
						fragment += `<li>${row}</li>`;
					});
				}
				return fragment + '</ul>';

				function _webbase(element) {
					if (element.children.length > 0) {
						fragment += `<li class="stw${element.constructor.name} stwAC${element.granted()}" data-ref="${element.id}" title="${element.slug(true)}"> ${element.name()}<ul>`;
						element.children.forEach(child => _webbase(child));
						fragment += '</ul></li>';
					} else {
						if (element.constructor.name == 'Content')
							fragment += `<li class="stwText stwAC${element.granted()}" data-ref="${element.id}" title="${element.slug(true)}"> ${element.name()}</li>`;
						else
							fragment += `<li class="stw${element.constructor.name} stwAC${element.granted()}" data-ref="${element.id}" title="${element.slug(true)}"> ${element.name()}</li>`;
					}
				}

				function _dir() {
					// TODO: Directory structure
				}
			});
		}
	};
};
