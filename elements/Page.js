/*!
 * Page
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const fs = require('fs');
const path = require('path');
const Base = require('./Base');

module.exports = class Page extends Base {
	constructor(name, template) { // TODO: How is the page template handled? Reloading a page breaks the socket connection! Can the connection be reestablished?
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
		let filename = path.join(process.mainModule.path, 'public', this.template());

		fs.readFile(filename, (err, data) => {
			if (res && res.constructor.name === 'ServerResponse') {
				if (err) {
					res.writeHead(302); // Not found
				} else {
					res.writeHead(200, { 'Content-Type': this.contentType() }); // OK
					res.write(data);
				}
				res.end();
			} else
				req.emit('page', { url: this.slug(), contentType: this.contentType(), body: data.toString() });
		});
	}
	write() {
		let fragment = '';

		fragment = `<page id="${this.id}" lastmod="${this.lastmod}" template="${this._template}">`;
		fragment += super.write();
		fragment += '</page>';

		return fragment;
	}
}
