/*!
 * Content
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
	wbol.Content = class Content extends wbol.Page {
		constructor(name, template) {
			super(name, template || '');
			this._cssClass = 'wbolContent wbol' + this.constructor.name;
			this._section = '';
			this._sequence = 1;
			this._datasource = null;
			this._query = null;
			this._params = null;
			this._template = {};
			
			this.data = [];
			this.template(template); // NOTE: string or function
			this.manage = null; // Client side code that manages content
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
			if (typeof value === 'undefined') return util.localize(wbol.lang(), this._template);
			this._template[wbol.lang()] = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		
		add() {} // Override predefined add()
		getData() {
			// TODO: Request data
			return [];
		}
		render(req, res, next) {
			var fragment = '';
			if (this.section !== '' && this.granted()) {
				this.data = this.getData(); // TODO: Retrieve data asynchronously
				fragment = next(req, res);
				if (typeof this.template() === 'function') {
					// TODO: render caption, header, fragment and footer
					fragment = '<h1>caption</h1>' + '<header>header</header>' + fragment + '<footer>footer</footer>';
				}
			}
			return fragment;
		}
		renderRow(req, res) {}
		persist() {
			var fragment = '';
			
			if (!(this instanceof wbol.Reference))
				fragment = `<content id="C${this.id}" guid="${this.guid}" lastmod="${this.lastmod}" type="${this.constructor.name}"`;
				
			if (this._cssClass) fragment += ` cssClass="${this._cssClass}"`;
			if (this._section) fragment += ` section="${this._section}"`;
			if (this._sequence) fragment += ` sequence="${this._sequence}"`;

			fragment += super.persist();

			if (this._datasource) 
				fragment += `<datasource name="${this._datasource}" params="${this._params}"><![CDATA[${this._query}]]></datasource>\n`;

			fragment += '<template>\n';
			for (var template in this._template)
				fragment += `<text lang="${template}"><![CDATA[${this._template[template]}]]></text>\n`;
			fragment += '</template>\n';
			
			if (!(this instanceof wbol.Reference))
				fragment += '</content>\n';
			
			return fragment;
		}
	};

	// WBOL layout (templating) language
	require('./layout')(wbol.Content);
};

