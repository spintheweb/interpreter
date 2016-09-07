/*!
 * Page
 * Copyright(c) 2016 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const url = require('url'),
	fs = require('fs'),
	io = require('socket.io'),
	xmldom = require('xmldom').DOMParser, // Persist webbase in XML
	util = require('../util');

module.exports = wbol => {
	wbol.Page = class Page extends wbol.wbolCore {
		constructor(name, template) { // TODO: How is the page template handled? Reloading a page breaks the socket connection! Can the connection be reestablished?
			super(name);
			this._contentType = 'text/html';
			this._template = template || 'index.html';
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
			fs.readFile(`${wbol.webbase.settings.static}/${this.template()}`, (err, data) => {
				if (typeof res === 'object' && res.constructor.name === 'ServerResponse') {
					if (err) {
						res.writeHead(302); // Not found
					} else {
						res.writeHead(200, { 'Content-Type': this.contentType() }); // OK
						res.write(data);
					}
					res.end();
				} else
					res.emit('page', { url: this.slug(), contentType: this.contentType(), body: data.toString() });
			});
		}
		persist() {
			var fragment = '';
			
			if (!(this instanceof wbol.Content))
				fragment = `<page id="P${this.id}" guid="${this.guid}" lastmod="${this.lastmod}" template="${this._template}"`;

			fragment += '>\n';

			fragment += super.persist();

			if (!(this instanceof wbol.Content))
				fragment += '</page>';
			
			return fragment;
		}
	};
};