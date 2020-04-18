/*!
 * Area
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const Base = require('./Base');
const Page = require('./Page');

module.exports = class Area extends Base {
	constructor(name) {
		super(name);
		this._mainpage = null;
	}
	mainpage(value) {
		if (typeof value === 'undefined')
			return this._mainpage;
		if (value instanceof Page)
			this._mainpage = value;
		return this;
	}

	add(child, isMain) {
		super.add(child);
		if (child instanceof Page && isMain || !this.mainpage())
			this.mainpage(child);
		return this;
	}

	write() {
		let fragment = '';

		if (this.constructor.name !== 'Webbase')
			fragment = `<area id="${this.id}" lastmod="${this.lastmod}"`;

		if (this._mainpage) 
			fragment += ` mainpage="${this._mainpage.id}"`;

		fragment += '>';
		fragment += super.write();

		if (this.constructor.name !== 'Webbase')
			fragment += '</area>';

		return fragment;
	}
}
