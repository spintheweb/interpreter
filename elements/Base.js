/*!
 * Base
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const uuid = require('uuid');

module.exports = class Base {
	constructor(name, lang = 'en') {
		this.id = uuid.v1();
		this._name = {};
		this._name[lang] = name || this.constructor.name;
        this._private = false; // If private it will not be exported
		this.webbase = this.constructor.name === 'Webbase' ? this : {};
		this.parent = null;
		this.children = [];
		this.authorizations = {}; // [role: { false | true }] Role Based Visibilities
	}
	name(value, lang) {
		if (typeof value === 'undefined')
			return this.webbase.localize(lang || this.webbase.lang(), this._name);
		this._name[lang || this.webbase.lang()] = value;
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}
    private(bool) {
        if (typeof bool === 'undefined')
            return this._private;
        this._private = bool ? true : false;
        return this;
    }

	inRole(user, role) {
		return (this.webbase.users[user].roles || []).includes(role);
	}

	// Grant a role access control, if no access control is specified remove the role from the RBV list (Role Based Visibility).
	grant(role, ac) {
		if (this.authorizations[role] && !ac)
			delete this.authorizations[role];
		else
			this.authorizations[role] = ac ? 1 : 0;

		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}

	// Return the highest access control associated to the given user
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
				ac = 0b10; // NOTE: this covers a content without a parent nor a RBV, it's in limbo!

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

			if (typeof this.webbase.changed === 'function')
				this.webbase.changed(this);
		}
		return this;

		function _setWebbase(element) {
			for (let child of element.children) {
				child.webbase = element.webbase;
				_setWebbase(child);
			}
		}
	}

	// Deep copy element, note, the webbase cannot be copied, use write() instead
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

	// Semantic URL based on element name
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

	getElementById(id) { // TODO: Make indexed array to speed-up
		if (id) {
			if (this.id === id)
				return this;
			for (let child of this.children) {
				let el = child.getElementById(id);
				if (el)
					return el;
			}
		}
		return null;
	}

	write() {
		let fragment = '<name>';
		for (let name in this._name)
			fragment += `<text lang="${name}"><![CDATA[${this._name[name]}]]></text>`;
		fragment += '</name>';

		if (Object.keys(this.authorizations).length > 0) {
			fragment += '<authorizations>';
			for (let role in this.authorizations)
				fragment += `<authorize role="${role}" visible="${this.authorizations[role]}"/>`;
			fragment += '</authorizations>';
		}

		if (this.children.length > 0) {
			fragment += '<children>';
			this.children.forEach(child => fragment += child.write());
			fragment += '</children>';
		}
		return fragment;
	}
}
