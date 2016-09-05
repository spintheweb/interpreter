/*!
 * tree
 * Copyright(c) 2016 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (wbol) => {
	wbol.Tree = class Tree extends wbol.Content {
		constructor (name, template) {
			super(name, template);
			
			// Code executed by the client in orther to manage the content
			this.manage = null;
		}
		render(req, res) {
			return super.render(req, res, () => {
				var fragment = '<ul class="wbolBody">';
				if (this.template() === 'webbase') {
					_render(wbol.webbase.document);
				} else {
					this.data.forEach(function(row, i) {
						// TODO: render template recursively
						fragment += `<li>${row}</li>`;
					});
				}
				return fragment + '</ul>';

				function _render (element) {
					if (!(element instanceof wbol.Content) && element.children.length > 0) {
						fragment += `<li class="wbol${element.constructor.name} wbolAC${element.granted()}" data-ref="${element.id}" title="${element.slug(true)}">${element.name()}<ul>`;
						element.children.forEach(child => _render(child));
						fragment += '</ul></li>';
					} else
						fragment += `<li class="wbol${element.constructor.name} wbolAC${element.granted()}" data-ref="${element.id}" title="${element.slug(true)}"> ${element.name()}</li>`;
				}
			});
		}
	};
};
