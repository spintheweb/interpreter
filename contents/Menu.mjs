/*!
 * menu
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../elements/Miscellanea.mjs';
import Content from '../elements/Content.mjs';
import Reference from '../elements/Reference.mjs';

export default class Menu extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	add(child) {
		if (child && child !== this && this.children.indexOf(child) === -1) {
			if (child.Parent() || child.constructor.name === 'Webo')
				child = new Reference(child);
			child.Parent() = this;
			child.webbase = this.webbase;
			this.children.push(child);
		}
		return this;
	}

	Render(socket) {
		return super.Render(socket, (socket, template) => {
			let options = '';
			this.children.forEach(option => {
				if (option.constructor.name === 'Reference') {
					if (option.ref.constructor.name === 'Page') {
						if (option.granted(socket.target.user) & 0b01)
							options += `<li class="stwMenuOption"><a href="/${option.slug}" onclick="stwHref(event)">${option.name()}</a></li>`;
					} else if (['Webo', 'Area'].indexOf(option.ref.constructor.name) !== -1) {
						option.ref.children.forEach(suboption => {
							if (suboption.constructor.name === 'Page' && suboption.granted(socket.target.user) & 0b01)
								options += `<li class="stwMenuOption"><a href="/${suboption.slug}" onclick="stwHref(event)">${suboption.name()}</a></li>`;
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