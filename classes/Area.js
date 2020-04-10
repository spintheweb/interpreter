/*!
 * Area
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const url = require('url'),
	fs = require('fs'),
	io = require('socket.io'),
	xmldom = require('xmldom').DOMParser, // Persist webbase in XML
	util = require('../utilities');

/// Organizer
module.exports = (webspinner) => {
    webspinner.Area = class Area extends webspinner.Base {
		constructor(name) {
			super(name);
			this._mainpage = null;
		}
		mainpage(value) {
			if (typeof value === 'undefined') return this._mainpage;
			if (value instanceof webspinner.Page && !(value instanceof webspinner.Content))
				this._mainpage = value;
			return this;
		}

		add(child, isMain) {
			super.add(child);
			if (child instanceof webspinner.Page && !(child instanceof webspinner.Content) && isMain || !this.mainpage())
				this.mainpage(child);
			return this;
		}
		
		write() {
			let fragment = '';
			
			if (!(this instanceof webspinner.Webo))
				fragment = `<area id="A${this.id}" guid="${this.guid}" lastmod="${this.lastmod}"`;

			if (this._mainpage) fragment += ` mainpage="${this._mainpage.id}"`; 

			fragment += '>\n';
			fragment += super.write();
			
			if (!(this instanceof webspinner.Webo))
				fragment += '</area>\n';

			return fragment;
		}
	};
};