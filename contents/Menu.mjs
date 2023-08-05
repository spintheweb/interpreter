/*!
 * menu
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../elements/Miscellanea.mjs';
import Content from '../elements/Content.mjs';
import Link from '../elements/Link.mjs';

export default class Menu extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	add(child) {
		if (child && child !== this && this.children.indexOf(child) === -1) {
			if (child.parent || child.constructor.name === 'Webo')
				child = new Link(child);
			child.parent = this;
			child.webbase = this.webbase;
			this.children.push(child);
		}
		return this;
	}

	render(socket) {
		return super.render(socket, (socket, template) => {
			let options = '';
			this.children.forEach(option => {
				if (option.constructor.name === 'Link') {
					if (option.ref.constructor.name === 'Unit') {
						if (option.granted(socket.target.user) & 0b01)
							options += `<li class="stwMenuOption"><a href="/${option.slug}" onclick="stwHref(event)">${option.localizedName()}</a></li>`;
					} else if (['Webo', 'Area'].indexOf(option.ref.constructor.name) !== -1) {
						option.ref.children.forEach(suboption => {
							if (suboption.constructor.name === 'Unit' && suboption.granted(socket.target.user) & 0b01)
								options += `<li class="stwMenuOption"><a href="/${suboption.slug}" onclick="stwHref(event)">${suboption.localizedName()}</a></li>`;
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