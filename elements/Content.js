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
		this._wbll = wbll ? {} : undefined; // The template is WBLL

		if (template)
			this.template(lang, template);

		this._clientHandler = null; // Client side code
		this._serverHandler = null; // Server side code (TODO: Predefined CRUD handlers)
	}

	cssClass(value, lang) {
		if (typeof value === 'undefined') {
			let layout = this.template(lang);
			if (layout && layout.attrs) {
				let attrs = '';
				Object.keys(layout.attrs).forEach(key => {
					if (key === 'class' && this._cssClass)
						attrs += `class="${this._cssClass} ${layout.attrs.class}" `;
					else
						attrs += `${key}="${layout.attrs[key]}" `;
				});
				return attrs;
			}
			return `class="${this._cssClass}"`;
		}
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
	datasource(name, query, params) {
		this.query(query);
		this.params(params);
		if (typeof name === 'undefined')
			return this._datasource;
		this._datasource = name;
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}
	query(value, params) {
		this.params(params);
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
	template(lang, value) {
		if (typeof value === 'undefined')
			return this.webbase.localize(lang, typeof this._wbll === 'undefined' ? this._template : this._wbll);
		if (typeof this._wbll !== 'undefined')
			this._wbll[lang] = layout.lexer(value);
		else
			this._template[lang] = value;
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}
	clientHandler(callback) {
		if (typeof callback === 'function')
			this._clientHandler = callback;
		return this;
	}
	serverHandler(callback) {
		if (typeof callback === 'function')
			this._serverHandler = callback;
		return this;
	}
	add(child) {
		if (!child || child == this || child.constructor.name === 'Webbase')
			return this;

		if (child instanceof Content)
			child.section(this.id); //this.permalink());
		else
			child = new Reference(child);

		if (this.children.indexOf(child) === -1) {
			if (child.parent)
				child = new Reference(child);
			child.parent = this;
			this.children.push(child);
			if (typeof this.webbase.changed == 'function')
				this.webbase.changed(this);
		}
		return this;
	}
	getData(socket, callback) { // TODO: Request data asynchronously
		if (typeof this._query == 'function')
			return this._query(socket);
		return JSON.parse(this._query || '[{}]');
	}
	render(socket, renderBody) {
		if (!renderBody)
			renderBody = this.renderRow;

		let fragment = '';
		if (this.section !== '' && this.granted(socket.target.user) & 0b01) {
			socket.dataset = this.getData(socket); // TODO: Retrieve data asynchronously

			let template = this.template(this.webbase.lang());

			if (template && typeof template === 'object') {
				// TODO: Evaluate template.settings

				if (typeof template.settings.visible != 'undefined' &&
					(layout.getValue(socket, template.settings.visible) ? false : true)) // TODO: template.settings.invisible
					return '';

				if (template.settings.caption)
					fragment += `<h1 class="stwCaption">${template.settings.caption}</h1>`;
				if (template.settings.header)
					fragment += `<header class="stwHeader">${template.settings.header}</header>`;
				fragment += `<div class="stwBody">${renderBody(socket, this.id, template)}</div>`;
				if (template.settings.footer)
					fragment += `<footer class="stwFooter">${template.settings.footer}</footer>`;
			} else
				fragment = renderBody(socket, template);
		}
		return fragment;
	}
	renderRow(socket, contentId, template) {
		if (typeof template === 'object')
			return layout.renderer(socket, contentId, template);
		else
			return template;
	}

	write() {
		if (this._private)
			return '';

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
		for (let template in this._template)
			fragment += `<text lang="${template}"><![CDATA[${this._template[template]}]]></text>`;
		fragment += '</template>';

		if (this.constructor.name !== 'Reference')
			fragment += '</content>';

		return fragment;
	}

	/*
	// TODO: If developer show content info and rendering time
	log((new Date) - stopwatch, "time");
	log(new Date, "time");
	*/
}
