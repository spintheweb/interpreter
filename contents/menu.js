/*!
 * menu
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (stw) => {
	stw.Menu = class Menu extends stw.Content {
		render(req, res) {
			return super.render(req, res, () => {
				let options = '';
				this.children.forEach((option) => {
					switch (true) {
						case option.ref instanceof stw.Content:
							let fragment = option.render(req, res);
							if (fragment)
								options += `<li class="stwMenuOption"><article id="${option.ref.id}" lang="${stw.lang()}" class="${option.ref.cssClass()}">${fragment}</article></li>`;
							break;
						case option.ref instanceof stw.Page:
							if (option.granted())
								options += `<li class="stwMenuOption"><a onclick="stw.emit('content', '/${option.slug()}')">${option.name()}</a></li>`;
							break;
						case option.ref instanceof stw.Chapter:
							option.ref.children.forEach(suboption => {
								if (!(suboption instanceof stw.Content) && suboption instanceof stw.Page && suboption.granted())
									options += `<li class="stwMenuOption"><a onclick="stw.emit('content', '/${suboption.slug()}')">${suboption.name()}</a></li>`;
							});
							break;
					}
				});
				return `<nav><ul class="stwBody">${options}</ul></nav>`;
			});
		}
		add(child, name) {
			if (!(child instanceof stw.Reference) && child instanceof stw.stwCore) {
				let reference = new stw.Reference(child);
				reference.parent = this;
				this.children.push(reference);
			}
			return this;
		}
	};
};
