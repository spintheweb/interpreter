/*!
 * Webo
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const url = require('url'),
	fs = require('fs'),
	io = require('socket.io'),
	xmldom = require('xmldom').DOMParser, // Persist webbase in XML
	util = require('../utilities');

module.exports = (webspinner) => {
	webspinner.Webo = class Webo extends webspinner.Area {
		constructor(name) {
			super(name);
			this._protocol = 'http';
			this.lang = 'en'; // Webbase default language, eg. en-US
			this.roles = {
				administrators: {
					enabled: true
				}, // Everything
				developers: {
					enabled: true
				}, // Modify webbase
				translators: {
					enabled: false
				}, // Modify texts in webbase
				guests: {
					enabled: true
				}, // Interact webbase
				users: {
					enabled: true
				}, // Interact webbase
				webmasters: {
					enabled: false
				} // Add data
			}; // Predefined roles
			this.users = {
				guest: {
					name: 'Guest',
					enabled: true,
					roles: ['guests']
				},
				administrator: {
					name: 'Administrator',
					password: null, //this.cipher.update('password', 'utf8', 'hex'),
					enabled: true,
					roles: ['administrators']
				}
			}; // Predefined users
			this.datasources = {
				webbase: webspinner.webbase
			}; // Predefined datasources
		}

		protocol(value) {
			if (typeof value === 'undefined') return this._protocol;
			if (value.search(/^https?$/i) !== -1)
				this._protocol = value.toLowerCase();
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		name(value) {
			if (typeof value === 'undefined') return this._name;
			this._name = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		datasource(name, obj) {
			if (!name && !obj)
				return this.datasources;
			if (name && !obj)
				return this.datasources[name];
			if (name && obj)
				this.datasources[name] = obj;
			return obj;
		}

		write() {
			let fragment;
			
			fragment = `<webo id="D${this.id}" lastmod="${this.lastmod}"`;
			fragment += super.write();
			fragment += '</webo>\n';
			
			return fragment;
		}
	};
};