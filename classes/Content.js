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
	util = require('../utilities'),
	layout = require('./Layout');

module.exports = (webspinner) => {
	webspinner.Content = class Content extends webspinner.Page {
		constructor(name, template, wbll = false) {
			super(name, null);
			this._category = webspinner.stwContentCategory.PRESENTATIONAL;
			this._cssClass = 'stwContent stw' + this.constructor.name;
			this._position = '';
			this._sequence = 1;
			this._datasource = null;
			this._query = null;
			this._params = null;
			this._template = {};

			this.data = [];
			this.template(wbll, template); // NOTE: text or layout functions
			this.handler = null; // Client side code that manages content
		}

		cssClass(value) {
			if (typeof value === 'undefined') return this._cssClass;
			this._cssClass = value.toString();
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		position(value) {
			if (typeof value === 'undefined') return this._position;
			this._position = value.toString();
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		sequence(value) {
			if (typeof value === 'undefined') return this._sequence;
			this._sequence = isNaN(value) || value < 1 ? 1 : value;
			this.lastmod = (new Date()).toISOString();
			if (this.parent) // Order by position, sequence
				this.parent.children.sort((a, b) =>
					a._position + ('0000' + a._sequence.toFixed(2)).slice(-5) > b._position + ('0000' + b._sequence.toFixed(2)).slice(-5));
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
		template(wbll, value) {
			if (typeof value === 'undefined')
				return util.localize(webspinner.lang(), this._template);
			if (wbll)
				this._template[webspinner.lang()] = layout.lexer(value);
			else
				this._template[webspinner.lang()] = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		add(child) {
			if (!child || child == this || child instanceof webspinner.Webo)
				return this;

			if (child instanceof webspinner.Content)
				child.position(this.permalink());
			else
				child = new webspinner.Reference(child);

			if (this.children.indexOf(child) === -1) {
				if (child.parent) 
					child = new webspinner.Reference(child);
				child.parent = this;
				this.children.push(child);
				this.lastmod = (new Date()).toISOString();
			}
			return this;
		}
		getData() {
			// TODO: Request data
			return [];
		}
		render(req, res, renderBody) {
			let fragment = '', template;
			if (this.position !== '' && this.granted()) {
				this.data = this.getData(); // TODO: Retrieve data asynchronously

				template = this._template[webspinner.lang()];

				if (typeof template === 'object') {
					if (template.settings.caption)
						fragment += `<h1 class="stwCaption">${template.settings.caption}<i class="fas fa-fw fa-times"></i></h1>`;
					if (template.settings.header)
						fragment += `<header class="stwHeader">${template.settings.header}</header>`;
					fragment += `<div class="stwBody">${renderBody(req, template)}</div>`;
					if (template.settings.footer)
						fragment += `<footer class="stwFooter">${template.settings.footer}</footer>`;
				} else
					fragment = renderBody(req, template);
			}
			return fragment;
		}
		renderRow(req, template) {
			if (typeof template === 'object')
				return layout.renderer(req, template);
			else
				return template;
		}

		write() {
			let fragment = "";
			if (!(this instanceof webspinner.Reference))
				fragment = `<content id="C${this.id}" lastmod="${this.lastmod}" type="${this.constructor.name}"`;

			if (this._cssClass) fragment += ` cssClass="${this._cssClass}"`;
			if (this._position) fragment += ` position="${this._position}"`;
			if (this._sequence) fragment += ` sequence="${this._sequence}"`;

			fragment += super.write();

			if (this._datasource)
				fragment += `<datasource name="${this._datasource}" params="${this._params}"><![CDATA[${this._query}]]></datasource>\n`;

			fragment += '<template>\n';
			for (let template in this._template)
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

