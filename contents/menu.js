/*!
 * menu
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const Content = require('../elements/Content');
const Reference = require('../elements/Reference');

module.exports = class Menu extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	add(child) {
		if (child && child !== this && this.children.indexOf(child) === -1) {
			if (child.parent || child.constructor.name === 'Webbase')
				child = new Reference(child);
			child.parent = this;
			child.webbase = this.webbase;
			this.children.push(child);
			this.lastmod = (new Date()).toISOString();
		}
		return this;
	}

	render(req, res) {
		return super.render(req, res, (req, template) => {
			let options = '';
			this.children.forEach(option => {
				if (option.constructor.name === 'Reference') {
					if (option.ref.constructor.name === 'Page') {
						if (option.granted(req.user) & 0b01)
							options += `<li class="stwMenuOption"><a href="/${option.slug()}" onclick="stwHref(event)">${option.name()}</a></li>`;
					} else if (['Webbase', 'Area'].indexOf(option.ref.constructor.name) !== -1) {
						option.ref.children.forEach(suboption => {
							if (suboption.constructor.name === 'Page' && suboption.granted(req.user) & 0b01)
								options += `<li class="stwMenuOption"><a href="/${suboption.slug()}" onclick="stwHref(event)">${suboption.name()}</a></li>`;
						});
					}
				} else if (option instanceof Content) {
					options += `<li id="${option.permalink()}" class="stwMenuOption" data-ref="${option.permalink()}1"></li>`;
				}
			});
			return `<nav><ul>${options}</ul></nav>`;
		});
	}
}