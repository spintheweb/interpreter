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
				this.children.forEach((option) => {
					switch (true) {
						case option.ref instanceof webspinner.Content:
							let fragment = option.render(req, res);
							if (fragment)
								options += `<li class="stwMenuOption"><article id="${option.ref.id}" lang="${webspinner.lang()}" class="${option.ref.cssClass()}">${fragment}</article></li>`;
							break;
						case option.ref instanceof webspinner.Page:
							if (option.granted())
								options += `<li class="stwMenuOption"><a onclick="stw.emit('content', '/${option.slug()}')">${option.name()}</a></li>`;
							break;
						case option.ref instanceof webspinner.Area:
							option.ref.children.forEach(suboption => {
								if (!(suboption instanceof webspinner.Content) && suboption instanceof webspinner.Page && suboption.granted())
									options += `<li class="stwMenuOption"><a onclick="stw.emit('content', '/${suboption.slug()}')">${suboption.name()}</a></li>`;
							});
							break;
					}
				});
				return `<nav><ul>${options}</ul></nav>`;
			});
		}
		add(child, name) {
			if (!(child instanceof webspinner.Reference) && child instanceof webspinner.Base) {
				let reference = new webspinner.Reference(child);
				reference.parent = this;
				this.children.push(reference);
			}
			return this;
		}
	};
};
