/*!
 * Page
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const path = require('path');
const Base = require('./Base');

module.exports = class Page extends Base {
	constructor(name, template) {
		super(name);
		this._contentType = 'text/html';
		this._template = template || 'index.htm';
	}

	contentType(value) {
		if (typeof value === 'undefined') return this._contentType;
		this._contentType = value;
		this.lastmod = (new Date()).toISOString();
		return this;
	}
	template(value) {
		if (typeof value === 'undefined') return this._template;
		this._template = value;
		this.lastmod = (new Date()).toISOString();
		return this;
	}

	render(req, res) {
		if (this.granted(req.user))
			return path.join(process.mainModule.path, 'public', this.template());
		return '';
	}
	write() {
		let fragment = '';

		fragment = `<page id="${this.id}" lastmod="${this.lastmod}" template="${this._template}">`;
		fragment += super.write();
		fragment += '</page>';

		return fragment;
	}
}
