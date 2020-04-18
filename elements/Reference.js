/*!
 * Reference
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const Content = require('./Content');

module.exports = class Reference extends Content {
	constructor(related) {
		super(related.name());
		this._cssClass = related._cssClass;
		this.ref = related;
	}

	render(req, res) {
		if (this.ref.constructor.name !== 'Webbase' && this.granted(req.user) & 0b01)
			return this.ref.render(req, res);
	}
	write() {
		let fragment;

		fragment = `<content id="${this.id}" lastmod="${this.lastmod}" type="${this.constructor.name}" ref="${this.ref.id}"`;
		fragment += super.write();
		fragment += '</content>';

		return fragment;
	}
}
