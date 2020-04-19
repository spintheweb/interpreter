/*!
 * Content
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const Base = require('./Base');
const layout = require(`./WBLL`);

module.exports = class Content extends Base {
	constructor(name, template, lang = 'en', wbll = false) {
		super(name, lang);
		this._cssClass = 'stwContent stw' + this.constructor.name;
		this._section = '';
		this._sequence = 1;
		this._datasource = null;
		this._query = null;
		this._params = null;
		this._template = {};

		this.data = [];

		if (template)
			this.template(wbll, template, lang); // NOTE: text or layout functions

		this.eventHandler = null; // Client side code
		this.contentHandler = null; // Server side code
	}

	cssClass(value) {
		if (typeof value === 'undefined') return this._cssClass;
		this._cssClass = value.toString();
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}
	section(value, sequence) {
		if (typeof value === 'undefined') return this._section;
		this._section = value.toString();
		if (sequence) this.sequence(sequence);
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}
	sequence(value) {
		if (typeof value === 'undefined') return this._sequence;
		this._sequence = isNaN(value) || value < 1 ? 1 : value;
		if (this.parent) // Order by section, sequence
			this.parent.children.sort((a, b) =>
				a._section + ('0000' + a._sequence.toFixed(2)).slice(-5) > b._section + ('0000' + b._sequence.toFixed(2)).slice(-5));
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}
	datasource(value) {
		if (typeof value === 'undefined') return this._datasource;
		this._datasource = value;
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}
	query(value) {
		if (typeof value === 'undefined') return this._query;
		this._query = value;
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}
	params(value) {
		if (typeof value === 'undefined') return this._params;
		this._params = value;
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}
	template(wbll, value, lang) {
		if (typeof value === 'undefined')
			return this.webbase.localize(lang || this.webbase.lang(), this._template);
		if (wbll)
			this._template[lang || this.webbase.lang()] = layout.lexer(value);
		else
			this._template[lang || this.webbase.lang()] = value;
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}
	add(child) {
		if (!child || child == this || child.constructor.name === 'Webbase')
			return this;

		if (child instanceof Content)
			child.section(this.permalink());
		else
			child = new Reference(child);

		if (this.children.indexOf(child) === -1) {
			if (child.parent)
				child = new Reference(child);
			child.parent = this;
			this.children.push(child);
			if (typeof this.webbase.changed === 'function')
				this.webbase.changed(this);
		}
		return this;
	}
	getData(callback) { // TODO: Request data
		return [];
	}
	render(req, renderBody) {
		let fragment = '', template;
		if (this.section !== '' && this.granted(req.user) & 0b01) {
			/*
						this.getData((data) => {
			
						});
			*/
			this.data = this.getData(); // TODO: Retrieve data asynchronously

			template = this._template[this.webbase.lang()];

			if (typeof template === 'object') {
				if (template.settings.visible !== undefined && !template.settings.visible) // TODO: template.settings.invisible
					return '';

				if (template.settings.caption)
					fragment += `<h1 class="stwCaption">${template.settings.caption}</h1>`;
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
		let fragment = '';
		if (this.constructor.name !== 'Reference')
			fragment = `<content id="${this.id}" type="${this.constructor.name}"`;

		if (this._cssClass) fragment += ` cssClass="${this._cssClass}"`;
		if (this._section) fragment += ` section="${this._section}"`;
		if (this._sequence) fragment += ` sequence="${this._sequence}"`;

		fragment += '>' + super.write();

		if (this._datasource)
			fragment += `<datasource name="${this._datasource}" params="${this._params}"><![CDATA[${this._query}]]></datasource>`;

		fragment += '<template>';
		for (let template in this._template) {
			if (typeof this._template[template] === 'string')
				fragment += `<text lang="${template}"><![CDATA[${this._template[template]}]]></text>`;
		}
		fragment += '</template>';

		if (this.constructor.name !== 'Reference')
			fragment += '</content>';

		return fragment;
	}

	/*
	// TODO: If debug show content info and rendering time
	log((new Date) - stopwatch, "time");
	log(new Date, "time");
	*/
}
