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

// TODO: layout as class
class Layout {
	constructor(content) {
		this.content = content;
		this.fragment = '';
	}

	// Helper functions
	_name(name) { return name; }
	_value(value, fallback) { return value || fallback; }
	_attributes(attrs) {
		let txt = "";
		Object.keys(attrs).forEach(key => {
			txt += attrs[key] ? ` ${key}="${attrs[key]}"` : ` ${key}`;
		});
		return txt;
	}

	// Symbols to HTML
	render(req, res) {
		this.fragment = '';
		//this.content._template[req.webspinner.lang()](req, res)
		return this.fragment;
	}

	NL(attrs) {}
	nl(attrs) {
		if (this.content.renderAs === "form")
			this.fragment += `<tr${_attributes(attrs)}>`; // Should be closed
		else
			this.fragment += "<br>";
	}

	cr() {
		this.fragment += "<br>"
	};
	tab(attrs) {
		if (this.content.renderAs === "table" || this.content.renderAs === "form")
			fragment += `<td${_attributes(attrs)}>`; // Should be closed
	};

	settings(settings) {
		this.content._settings = settings;
	};

	/// Anchor
	a(destination, attrs, _destination) {
		destination = _value(destination);
		if (!_destination) _destination = destination;
		attrs.href = destination;
		return {
			p: (name, value) => {
				name = _name(name);
				value = _value(value);
				if (name && name[0] === "#")
					attrs.href += name;
				else if (name)
					attrs.href += (attrs.href.indexOf("?") === -1 ? "?" : "&") + name + "=" + encodeURIComponent(value);
				return a(attrs.href, attrs, _destination);
			},
			f: (format, _attrs) => {
				this.fragment += "<a" + _attributes(attrs) + ">";
				f(format, _attrs);
				this.fragment += "</a>";
			},
			t: (txt, _attrs) => {
				this.fragment += "<a" + _attributes(attrs) + ">";
				t(txt || _destination, _attrs);
				this.fragment += "</a>";
			},
			i: (src, _attrs) => {
				this.fragment += "<a" + _attributes(attrs) + ">";
				i(src, _attrs);
				this.fragment += "</a>";
			}
		};
	}

	/// Anchor new window
	A(destination, attrs = {}) {
		attrs.target = "_blank";
		return a(destination, attrs);
	}

	/// Text
	t(txt, attrs) {
		if (attrs !== {})
			this.fragment += `<span${_attributes(attrs)}>${txt}</span>`;
		else
			this.fragment += txt;
	};

	/// HTML encoded text
	T(txt) {
		txt = txt
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
		this.fragment += txt;
	}
}

module.exports = (webspinner) => {
	webspinner.Content = class Content extends webspinner.Page {
		constructor(name, template) {
			super(name, null);
			this._cssClass = 'stwContent stw' + this.constructor.name;
			this._section = ''; // Null section, do not render
			this._sequence = 1;
			this._datasource = null;
			this._query = null;
			this._params = null;
			this._template = {};
			this._settings = {};
			this._fragment = '';
			
			this.data = [];
			this.template(template); // NOTE: text or layout functions
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
			if (typeof value === 'undefined') 
				return util.localize(webspinner.lang(), this._template);
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
			if (typeof this._template[webspinner.lang()] === 'function') {
				let layout = new Layout(this);
//				return this._template[webspinner.lang()](req, res);
				return layout.render(req, res);
			} else
				return this._template[webspinner.lang()];
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

