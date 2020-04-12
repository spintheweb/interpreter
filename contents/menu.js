/*!
 * menu
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (webspinner) => {
	webspinner.Menu = class Menu extends webspinner.Content {
		constructor(name, template) {
			super(name, template, true);
			this._category = webspinner.stwContentCategory.NAVIGATIONAL;
		}

		render(req, res) {
			return super.render(req, res, (req, template) => {
				let options = '';
				this.children.forEach(option => {
					if (option instanceof webspinner.Reference) {
						if (option.granted() & 0b01)
							options += `<li class="stwMenuOption"><a href="/${option.slug()}">${option.name()}</a></li>`;
					} else if (option instanceof webspinner.Content) {
						options += `<li id="${option.permalink()}" class="stwMenuOption" data-ref="${option.permalink()}1"></li>`;
					} else if (option instanceof webspinner.Area) {
						option.children.forEach(suboption => {
							if (!(suboption instanceof webspinner.Content) && suboption instanceof webspinner.Page && suboption.granted() & 0b01)
								options += `<li class="stwMenuOption"><a href="/${suboption.slug()}">${suboption.name()}</a></li>`;
						});
					}
				});
				return `<nav><ul>${options}</ul></nav>`;
			});
		}
	};
};
