/*!
 * Content
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const url = require('url'),
	fs = require('fs'),
	io = require('socket.io'),
	xmldom = require('xmldom').DOMParser, // Persist webbase in XML
	util = require('../util');

module.exports = (webspinner) => {
	webspinner.Content = class Content extends webspinner.Page {
		constructor(name, template) {
			super(name, template || '');
			this._cssClass = 'wbolContent wbol' + this.constructor.name;
			this._section = ''; // Null section, do not render
			this._sequence = 1;
			this._datasource = null;
			this._query = null;
			this._params = null;
			this._template = {};
			this._settings = {};
			
			this.data = [];
			this.template(template); // NOTE: text or layout functions
			this.manage = null; // Client side code that manages content

			require('./Symbols')(webspinner);
		}

		cssClass(value) {
			if (typeof value === 'undefined') return this._cssClass;
			this._cssClass = value.toString();
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		section(value) {
			if (typeof value === 'undefined') return this._section;
			this._section = value.toString();
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		sequence(value) {
			if (typeof value === 'undefined') return this._sequence;
			this._sequence = isNaN(value) || value < 1 ? 1 : value;
			this.lastmod = (new Date()).toISOString();
			if (this.parent) // Order by section, sequence
				this.parent.children.sort((a, b) => 
					a._section + ('0000' + a._sequence.toFixed(2)).slice(-5) > b._section + ('0000' + b._sequence.toFixed(2)).slice(-5));
			return this;
		}
		datasource(value) {
			if (typeof value === 'undefined') return this._datasource;
			this._datasource = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		query(value) {
			if (typeof value === 'undefined') return this._query;
			this._query = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		params(value) {
			if (typeof value === 'undefined') return this._params;
			this._params = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		template(value) {
			if (typeof value === 'undefined') return util.localize(webspinner.lang(), this._template);
			this._template[webspinner.lang()] = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		
		add() {} // Override predefined add()
		getData() {
			// TODO: Request data
			return [];
		}
		render(req, res, next) {
			let fragment = '';
			if (this.section !== '' && this.granted()) {
				this.data = this.getData(); // TODO: Retrieve data asynchronously
				fragment = next(req, res);
				
				if (this._settings.caption) 
					fragment += `<h1>${this._settings.caption}</h1>`;
				if (this._settings.header)	
					fragment += `<header>${this._settings.header}</header>`;
				fragment += this.renderRow(req, res);
				if (this._settings.footer)	
					fragment += `<footer>${this._settings.header}</footer>`;
			}
			return fragment;
		}
		renderRow(req, res) {
			return '';
		}

		write() {
			let fragment = "";
			if (!(this instanceof webspinner.Reference))
				fragment = `<content id="C${this.id}" guid="${this.guid}" lastmod="${this.lastmod}" type="${this.constructor.name}"`;
				
			if (this._cssClass) fragment += ` cssClass="${this._cssClass}"`;
			if (this._section) fragment += ` section="${this._section}"`;
			if (this._sequence) fragment += ` sequence="${this._sequence}"`;

			fragment += super.write();

			if (this._datasource) 
				fragment += `<datasource name="${this._datasource}" params="${this._params}"><![CDATA[${this._query}]]></datasource>\n`;

			fragment += '<template>\n';
			for (var template in this._template)
				fragment += `<text lang="${template}"><![CDATA[${this._template[template]}]]></text>\n`;
			fragment += '</template>\n';

			if (!(this instanceof webspinner.Reference))
				fragment += '</content>\n';
			
			return fragment;
		}
/*
		// If debug show content info and rendering time
		log((new Date) - stopwatch, "time");
		log(new Date, "time");
*/			
	};
};

