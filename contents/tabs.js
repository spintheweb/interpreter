/*!
 * tabs
 * Copyright(c) 2016 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (wbol) => {
	wbol.Tabs = class Tabs extends wbol.Content {
		constructor (name, template) {
			super(name, template);
			
			// Code executed by the client in order to manage the content
			this.manage = function (id) {
				var tabs = document.getElementById(id), tab = tabs.querySelectorAll('.wbolTabLabel');
				for (var i = 0; i < tab.length; ++i) {
                    tab[i].addEventListener('click', event => {
                    	for (var i = 0; i < tab.length; ++i) {
                    		var selected = (event.target === tab[i]);
                    		tab[i].classList[selected ? 'add' : 'remove']('wbolSelected');
                    		tabs.querySelector(`.wbolTab[data-ref="${tab[i].dataset.ref}"]`).hidden = !selected;
                    	}
                    });
                }
                tabs.querySelector('.wbolTabLabel').click();
			};
		}
		
		render(req, res) {
			return super.render(req, res, () => {
				var labels = '', tabs = '';
				this.children.forEach((tab, i) => {
					if (tab.ref && tab.granted()) {
						var fragment = tab.ref.render(req, res);
						if (fragment) {
							labels += `<li class="wbolTabLabel" data-ref="${i}">${tab.name()}</li>`;
							tabs += `<li class="wbolTab" data-ref="${i}"><article id="${tab.ref.id}" lang="${wbol.lang()}" class="${tab.ref.cssClass()}">${fragment}</article></li>`;
						}
					}
				});
				return `<ul class="wbolBody">${labels}${tabs}</ul>`;
			});
		}
		add(child, name) {
			if (!(child instanceof wbol.Reference) && child instanceof wbol.Content) {
				var reference = new wbol.Reference(child);
				reference.parent = this;
				this.children.push(reference);
			}
			return this;
		}
	};
};
