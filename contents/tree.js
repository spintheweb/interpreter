/*!
 * tree
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (stw) => {
	stw.Tree = class Tree extends stw.Content {
		constructor(name, template) {
			super(name, template, true);

			// Code executed by the client in order to manage the content
			this.manage = null;
		}

		render(req, res) {
			return super.render(req, res, (req, template) => {
				let fragment = '<ul>';
				if (this.template() === 'webbase') {
					_render(stw.webbase.webo);
				} else {
					this.data.forEach(function (row, i) {
						// TODO: render template recursively
						fragment += `<li>${row}</li>`;
					});
				}
				return fragment + '</ul>';

				function _render(element) {
					if (!(element instanceof stw.Content) && element.children.length > 0) {
						fragment += `<li class="stw${element.constructor.name} stwAC${element.granted()}" data-ref="${element.id}" title="${element.slug(true)}">${element.name()}<ul>`;
						element.children.forEach(child => _render(child));
						fragment += '</ul></li>';
					} else
						fragment += `<li class="stw${element.constructor.name} stwAC${element.granted()}" data-ref="${element.id}" title="${element.slug(true)}"> ${element.name()}</li>`;
				}
			});
		}
	};
};
