/*!
 * menu
 * Copyright(c) 2016 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = wbol => {
	wbol.Menu = class Menu extends wbol.Content {
		render(req, res) {
			return super.render(req, res, () => {
				var options = '';
				this.children.forEach(option => {
					switch (true) {
						case option.ref instanceof wbol.Content:
							var fragment = option.render(req, res);
							if (fragment)
								options += `<li class="wbolMenuOption"><article id="${option.ref.id}" lang="${wbol.lang()}" class="${option.ref.cssClass()}">${fragment}</article></li>`;
							break;
						case option.ref instanceof wbol.Page:
							if (option.granted())
								options += `<li class="wbolMenuOption"><a onclick="wbol.emit('content', '/${option.slug()}')">${option.name()}</a></li>`;
							break;
						case option.ref instanceof wbol.Chapter:
							option.ref.children.forEach(suboption => {
								if (!(suboption instanceof wbol.Content) && suboption instanceof wbol.Page && suboption.granted())
									options += `<li class="wbolMenuOption"><a onclick="wbol.emit('content', '/${suboption.slug()}')">${suboption.name()}</a></li>`;
							});
							break;
					}
				});
				return `<nav><ul class="wbolBody">${options}</ul></nav>`;
			});
		}
		add(child, name) {
			if (!(child instanceof wbol.Reference) && child instanceof wbol.wbolCore) {
				var reference = new wbol.Reference(child);
				reference.parent = this;
				this.children.push(reference);
			}
			return this;
		}
	};
};
