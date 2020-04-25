/*!
 * Area
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const Base = require('./Base');
const Page = require('./Page');

module.exports = class Area extends Base {
	constructor(name, lang) {
		super(name, lang);
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

	render(socket) {
		if (this._mainpage)
			return this._mainpage.render(socket);
		else
			return this.webbase._mainpage.render(socket);
	}

	write() {
		if (this.constructor.name === 'Webbase')
			return super.write();

		if (this._private)
			return '';

			let fragment = `<area id="${this.id}"`;
		if (this._mainpage)
			fragment += ` mainpage="${this._mainpage.id}"`;
		fragment += '>';
		fragment += super.write();
		fragment += '</area>';

		return fragment;
	}
}
