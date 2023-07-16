/*!
 * Base
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { v1 } from 'uuid';
import Webbase from './Webbase.mjs';

export default class Base {
	constructor(name, lang = 'en') {
		this._id = v1();
		this.name = {};
		this.name[lang] = name || this.constructor.name;
        this.private = false; // If private it will not be exported
		this.children = [];
		this.visibility = {}; // [role: { false | true }] Role Based Visibilities
	}
	Name(value, lang) {
		if (typeof value === 'undefined')
			return this.webbase.localize(lang || this.webbase.Lang(), this.name);
		this.name[lang || this.webbase.Lang()] = value;
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}
    Private(bool) {
        if (typeof bool === 'undefined')
            return this.private;
        this.private = bool ? true : false;
        return this;
    }
	Parent() {
		return (this.webbase || this).route(this._idParent);
	}

	// Grant a role access control, if no access control is specified remove the role from the RBV list (Role Based Visibility).
	grant(role, ac) {
		if (this.visibility[role] && !ac)
			delete this.visibility[role];
		else
			this.visibility[role] = ac ? 1 : 0;

		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}

	// Return the highest access control associated to the given roles
	granted(roles, role = null, recurse = false) {
		let ac = null;

		if (this.constructor.name === 'Page' && this.webbase.Mainpage() === this)
			ac = recurse ? 0b11 : 0b01; // Home page always visible

		if (role) {
			if (this.visibility[role] !== undefined)
				ac = this.visibility[role] ? 0b01 : 0b00;
		} else
			for (let i = 0; ac != 0b01 && i < roles.length; ++i)
				if (this.visibility.hasOwnProperty(roles[i]))
					ac |= this.visibility[roles[i]] ? 0b01 : 0b00;

		if (ac === null) {
			let obj = this.Parent();
			if (obj && obj.type !== 'site')
				ac = 0b10 | obj.granted(roles, role, true);
			else if (['Webbase', 'Area', 'Page'].indexOf(this.constructor.name) === -1) // Content
				ac = 0b10; // NOTE: this covers a content without a parent nor a RBV, it's in limbo!
		}

		return ac || 0b00;
	}

	// Add child to element, note, we are adding a child not moving it
	add(child) {
		if (child && child.constructor.name !== 'Webbase' && child !== this && this.children.indexOf(child) === -1) {
			if (child.Parent())
				child = new Reference(child);
			child.Parent() = this;
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
			let i = this.Parent().children.indexOf(this);
			if (i !== -1)
				this.Parent().children.splice(i, 1);
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

	permalink() {
		if (this.Parent())
			return this.Parent().permalink() + '/' + this.slug;
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
}
