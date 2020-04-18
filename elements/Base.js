/*!
 * Base
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const uuid = require('uuid');

module.exports = class Base {
	constructor(name) {
		this._name = { 'en': name || this.constructor.name };
		this.id = uuid.v1();
		this.webbase = this.constructor.name === 'Webbase' ? this : {};
		this.parent = null;
		this.children = [];
		this.authorizations = {}; // role: { false | true } Role Based Visibilities
		this.lastmod = (new Date()).toISOString();
	}
	name(value) {
		if (typeof value === 'undefined')
			return this.webbase.localize(this.webbase.lang(), this._name);
		this._name[this.webbase.lang()] = value;
		this.lastmod = (new Date()).toISOString();
		return this;
	}

	inRole(user, role) {
		return (this.webbase.users[user].roles || []).includes(role);
	}

	// Grant a role an access control, if no access control is specified remove the role from the RBV list.
	grant(role, ac) {
		if (this.authorizations[role] && !ac)
			delete this.authorizations[role];
		else
			this.authorizations[role] = ac ? 1 : 0;
		this.lastmod = (new Date()).toISOString();
		return this;
	}

	// Return the highest access control associated to the given roles
	granted(user = 'guest', role = null, recurse = false) {
		let ac = null;

		let roles = this.webbase.users[user].roles;
		if (this.constructor.name === 'Page' && this.webbase.mainpage() === this)
			ac = recurse ? 0b11 : 0b01; // Home page always visible

		if (role) {
			if (this.authorizations[role] !== undefined)
				ac = this.authorizations[role] ? 0b01 : 0b00;
		} else
			for (let i = 0; ac != 0b01 && i < roles.length; ++i)
				if (this.authorizations.hasOwnProperty(roles[i]))
					ac |= this.authorizations[roles[i]] ? 0b01 : 0b00;

		if (ac === null)
			if (this.parent)
				ac = 0b10 | this.parent.granted(user, role, true);
			else if (['Webbase', 'Area', 'Page'].indexOf(this.constructor.name) === -1) // Content
				ac = 0b10; // NOTE: this is a content without a parent nor a RBVC, it's in limbo! Contents referenced by Copycats

		return ac || 0b00;
	}

	// Add child to element, note, we are adding a child not moving it
	add(child) {
		if (child && child.constructor.name !== 'Webbase' && child !== this && this.children.indexOf(child) === -1) {
			if (child.parent) 
				child = new Reference(child);
			child.parent = this;
			child.webbase = this.webbase;
			_setWebbase(child);
			this.children.push(child);

			this.lastmod = (new Date()).toISOString();
		}
		return this;

		function _setWebbase(element) {
			for (let child of element.children) {
				child.webbase = element.webbase;
				_setWebbase(child);
			}
		}
	}

	// Deep copy element, note, the webbase is not clonable, use write() instead
	copy() {
		let obj;
		if (this.constructor.name !== 'Webbase')
			obj = new this.constructor();
		return obj;
	}

	// Move and Remove element
	move(parent) {
		if (this !== parent) {
			let i = this.parent.children.indexOf(this);
			if (i !== -1)
				this.parent.children.splice(i, 1);
			if (parent)
				parent.children.push(this);
			else {
				// TODO: while visiting the site remove shortcuts that point to nothing
				delete this;
				return;
			}
		}
	}
	remove() {
		this.move();
	}

	// Semantic URL based on element name and active language
	slug(full) {
		if (full)
			return _slug(this);
		return this.name().trim().toLowerCase().replace(/[^a-z0-9 _-]/g, '').replace(/\s+/g, '_');

		function _slug(element) {
			if (!element || element.constructor.name === 'Webbase')
				return '';
			return _slug(element.parent) + '/' + element.name().trim().toLowerCase().replace(/[^a-z0-9 _-]/g, '').replace(/\s+/g, '_');
		}
	}

	permalink() {
		if (this.parent)
			return this.parent.permalink() + '/' + this.slug();
		return '';
	}

	getElementById(id) { // TODO: Make index to speed-up
		if (this.id === id)
			return this;
		for (let child of this.children) {
			let el = child.getElementById(id);
			if (el)
				return el;
		}
		return null;
	}

	write() {
		let fragment;

		fragment = '<name>';
		for (let name in this._name)
			fragment += `<text lang="${name}"><![CDATA[${this._name[name]}]]></text>`;
		fragment += '</name>';

		if (this.children.length > 0) {
			fragment += '<children>';
			this.children.forEach(child => fragment += child.write());
			fragment += '</children>';
		}

		if (Object.keys(this.authorizations).length > 0) {
			fragment += '<authorizations>';
			for (let role in this.authorizations)
				fragment += `<authorize role="${role}" visible="${this.authorizations[role]}"/>`;
			fragment += '</authorizations>';
		}

		return fragment;
	}
}
