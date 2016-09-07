/*!
 * wbolCore
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
    wbol.wbolCore = class wbolCore {
		constructor(name) {
			this.guid = null;
			this.id = util.newId();
			this.parent = null;
			this.children = [];
			this._name = {}; // lang: string
			this.rbac = {}; // role: wbolAC
			this.lastmod = (new Date()).toISOString();
			
			this.name(name || this.constructor.name); // NOTE: siblings may have identical names, however, the router will select the first
		}
		name(value) {
			if (typeof value === 'undefined') return util.localize(wbol.lang(), this._name);
			this._name[wbol.lang()] = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}

		// Grant a role an access control, if no access control is specified remove the role from the RBAC list.
		grant(role, ac) {
			if (wbol.webbase.roles[role]) {
				if (this.rbac[role] && !ac) delete this.rbac[role];
				else this.rbac[role] = ac;
				this.lastmod = (new Date()).toISOString();
			}
			return this;
		}
		
		// Return the highest access control associated to the given roles
		granted() {
			var roles = wbol.webbase.users[wbol.user()].roles;
			if (this instanceof wbol.Page && wbol.webbase.document.mainpage() === this) return wbol.wbolAC.read; // Main web page always visible
			var ac = null;
			for (let i = 0; i < roles.length; ++i) {
				let role = roles[i];
				if (this.rbac[role] === wbol.wbolAC.execute) return wbol.wbolAC.execute;
				ac = Math.max(ac, this.rbac[role]);
			}
			if (isNaN(ac) || ac === null)
				if (this.parent) 
					ac = this.parent.granted();
				else if (this instanceof wbol.Content) 
					ac = wbol.wbolAC.read; // NOTE: this is a content without a parent nor a RBAC, it's in limbo! Contents referenced by Copycats
			return ac;
		}
		
		// Add child to element, note, we are adding a child not moving it
		add(child) {
			if (child && this.children.indexOf(child) === -1) {
				if (child.parent) child = new wbol.Reference(child);
				child.parent = this;
				this.children.push(child);
				this.lastmod = (new Date()).toISOString();
			}
			return this;
		}
		
		// Deep copy element, note, the web is not clonable, use export instead
		clone() {
			let obj;
			if (this instanceof wbol.Chapter) {
				obj = new wbol.Chapter();
			} else if (this instanceof wbol.Page) {
				obj = new wbol.Page();
			} else if (this instanceof wbol.Content) {
				obj = new this.constructor();
			}
			return obj;
		}
		
		// Move and Remove element
		move(parent) {
			if (this !== parent) {
				var i = this.parent.children.indexOf(this);
				if (i !== -1) this.parent.children.splice(i, 1);
				if (parent) parent.children.push(this);
				else {
					// TODO: remove shortcuts, visit all elements in the webbase
					delete this;
				}
			}
		}
		remove() {
			this.move();
		}

		// Semantic URL based on element name and language
		slug(full) {
			if (full) return _slug(this);
			return this.name().replace(/\s+/g, '-').toLowerCase(); // TODO: retain only [a-z0-9-]
			
			function _slug(element) {
				if (element instanceof wbol.Document)
					return '';
				return _slug(element.parent) + '/' + element.name().replace(/\s+/g, '-').toLowerCase();
			}
		}
		
		persist() {
			var fragment;
			
			fragment = '<name>\n';
			for (var name in this._name)
				fragment += `<text lang="${name}"><![CDATA[${this._name[name]}]]></text>\n`;
			fragment += '</name>\n';

			if (this.children.length > 0) { 
				fragment += '<children>\n';
				this.children.forEach(child => fragment += child.persist());
				fragment += '</children>\n';
			}

			if (Object.keys(this.rbac).length > 0) {
				fragment += '<authorizations>\n';
				for (var role in this.rbac)
					fragment += `<authorize role="${role}" permission="${this.rbac[role]}"/>\n`;
				fragment += '</authorizations>\n';
			}
			
			return fragment;
		}
	};
};