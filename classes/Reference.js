/*!
 * Reference
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

// A stw.Reference is pointer to a stw.Content
module.exports = (webspinner) => {
	webspinner.Reference = class Reference extends webspinner.Content {
		constructor(related) {
			super(related.name());
			this._cssClass = related._cssClass;
			this.ref = related;
		}
		
		render(req, res) {
			if (!(this.ref instanceof webspinner.Webo) && this.granted() & 0b01)
				return this.ref.render(req, res);
		}
		write() {
			let fragment;
			
			fragment = `<content id="R${this.id}" lastmod="${this.lastmod}" type="${this.constructor.name}" ref="${this.ref.id}"`;
			fragment += super.write();
			fragment += '</content>\n';
			
			return fragment;
		}
	};
};