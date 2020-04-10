/*!
 * Base
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const url = require('url'),
	fs = require('fs'),
	io = require('socket.io'),
	xmldom = require('xmldom').DOMParser, // Used to read webbase.xml
	util = require('../utilities');

module.exports = (webspinner) => {
	webspinner.Base = class Base {
		constructor(name) {
			this.guid = null;
			this.id = util.newId();
			this.parent = null;
			this.children = [];
			this.cultures = null; // TODO: International vs Multinational concern
			this._name = {}; // lang: string
			this.rbac = {}; // role: stwAC
			this.lastmod = (new Date()).toISOString();

			this.name(name || this.constructor.name); // NOTE: siblings may have identical names, however, the router will select the first
		}
		name(value) {
			if (typeof value === 'undefined') return util.localize(webspinner.lang(), this._name);
			this._name[webspinner.lang()] = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}

		// Grant a role an access control, if no access control is specified remove the role from the RBAC list.
		grant(role, ac) {
			if (webspinner.webbase.roles[role]) {
				if (this.rbac[role] && !ac) delete this.rbac[role];
				else this.rbac[role] = ac;
				this.lastmod = (new Date()).toISOString();
			}
			return this;
		}

		// Return the highest access control associated to the given roles
		granted(recurse = false) {
			let roles = webspinner.webbase.users[webspinner.user()].roles;
			if (this instanceof webspinner.Page && webspinner.webbase.webo.mainpage() === this)
				return webspinner.stwAC.read; // Main web page always visible
			let ac = null;
			for (let i = 0; i < roles.length; ++i) {
				let role = roles[i];
				if (this.rbac[role] === webspinner.stwAC.execute)
					return webspinner.stwAC.execute;
				ac = Math.max(ac, this.rbac[role]);
			}
			if (isNaN(ac) || ac === null)
				if (this.parent)
					ac = this.parent.granted(true);
				else if (this instanceof webspinner.Content)
					ac = webspinner.stwAC.read; // NOTE: this is a content without a parent nor a RBAC, it's in limbo! Contents referenced by Copycats
			if (!recurse && isNaN(ac))
				return webspinner.stwAC.none;
			return ac;
		}

		// Add child to element, note, we are adding a child not moving it
		add(child) {
			if (child && !(child instanceof webspinner.Webo) && child !== this && this.children.indexOf(child) === -1) {
				if (child.parent) child = new webspinner.Reference(child);
				child.parent = this;
				this.children.push(child);
				this.lastmod = (new Date()).toISOString();
			}
			return this;
		}

		// Deep copy element, note, the web is not clonable, use write() instead
		clone() {
			let obj;
			if (this instanceof webspinner.Area) {
				obj = new webspinner.Area();
			} else if (this instanceof webspinner.Page) {
				obj = new webspinner.Page();
			} else if (this instanceof webspinner.Content) {
				obj = new this.constructor();
			}
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
					// TODO: remove shortcuts, visit all classes in the webbase
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
			return this.name().trim().toLowerCase().replace(/[^a-z0-9 _-]/g, '').replace(/\s+/g, '_'); // TODO: retain only [a-z0-9-]

			function _slug(element) {
				if (!element || (!(element instanceof webspinner.Area) && element instanceof webspinner.Webo))
					return '';
				return _slug(element.parent) + '/' + element.name().trim().toLowerCase().replace(/[^a-z0-9 _-]/g, '').replace(/\s+/g, '_');
			}
		}

		permalink() {
			if (this.parent)
				return this.parent.permalink() + '/' + this.slug();
			return '/' + this.slug();
		}

		write() {
			let fragment;

			fragment = '<name>\n';
			for (let name in this._name)
				fragment += `<text lang="${name}"><![CDATA[${this._name[name]}]]></text>\n`;
			fragment += '</name>\n';

			if (this.children.length > 0) {
				fragment += '<children>\n';
				this.children.forEach(child => fragment += child.write());
				fragment += '</children>\n';
			}

			if (Object.keys(this.rbac).length > 0) {
				fragment += '<authorizations>\n';
				for (let role in this.rbac)
					fragment += `<authorize role="${role}" permission="${['-', 'r', 'w', 'x'][this.rbac[role]]}"/>\n`;
				fragment += '</authorizations>\n';
			}

			return fragment;
		}
	};
};