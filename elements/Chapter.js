/*!
 * Chapter
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
    wbol.Chapter = class Chapter extends wbol.wbolCore {
		constructor(name) {
			super(name);
			this._mainpage = null;
		}
		mainpage(value) {
			if (typeof value === 'undefined') return this._mainpage;
			if (value instanceof wbol.Page && !(value instanceof wbol.Content))
				this._mainpage = value;
			return this;
		}

		add(child, isMain) {
			super.add(child);
			if (child instanceof wbol.Page && !(child instanceof wbol.Content) && isMain || !this.mainpage())
				this.mainpage(child);
			return this;
		}
		
		persist() {
			var fragment = '';
			
			if (!(this instanceof wbol.Document))
				fragment = `<chapter id="A${this.id}" guid="${this.guid}" lastmod="${this.lastmod}"`;

			if (this._mainpage) fragment += ` mainpage="${this._mainpage.id}"`; 

			fragment += '>\n';
			
			fragment += super.persist();
			
			if (!(this instanceof wbol.Document))
				fragment += '</chapter>\n';

			return fragment;
		}
	};
};