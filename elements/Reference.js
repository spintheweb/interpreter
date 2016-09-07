/*!
 * Reference
 * Copyright(c) 2016 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

// A wbol.Reference is pointer to a wbol.Content
module.exports = wbol => {
	wbol.Reference = class Reference extends wbol.Content {
		constructor(related) {
			super(related.name());
			this._cssClass = related._cssClass;
			this.ref = related;
		}
		
		render(req, res) {
			if (this.granted())
				return this.ref.render(req, res);
		}
		persist() {
			var fragment;
			
			fragment = `<content id="R${this.id}" guid="${this.guid}" lastmod="${this.lastmod}" type="${this.constructor.name}" ref="${this.ref.id}"`;
			
			fragment += super.persist();

			fragment += '</content>\n';
			
			return fragment;
		}
	};
};