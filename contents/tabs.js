/*!
 * tabs
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (wbol) => {
	wbol.Tabs = class Tabs extends wbol.Content {
		constructor (name, template) {
			super(name, template);
			this._category = wbol.wbolContentCategory.ORGANIZATIONAL;
			
			// Code executed by the client in order to manage the content
			this.manage = (id) => {
				let tabs = document.getElementById(id), tab = tabs.querySelectorAll('.wbolTabLabel');
				for (let i = 0; i < tab.length; ++i) {
                    tab[i].addEventListener('click', event => {
                    	for (let i = 0; i < tab.length; ++i) {
                    		let selected = (event.target === tab[i]);
                    		tab[i].classList[selected ? 'add' : 'remove']('wbolSelected');
                    		tabs.querySelector(`.wbolTab[data-ref="${tab[i].dataset.ref}"]`).hidden = !selected;
                    	}
                    });
                }
                tabs.querySelector('.wbolTabLabel').click();
			};
		}
		
		react(event, callback) {
			if (callback)
				callback(event);

			let target = event.currentTarget.closest('.wbolTabLabel');
			if (event.type === 'click' && target) {
				// Switch tab
				let tabs = target.closest('ul').children;
				tabs.forEach((tab, i) => {
					if (tab.classList.contains('wbolTabLabel')) {
            			tab.classList[(target === tab) ? 'add' : 'remove']('wbolSelected');
            			tabs.children[2 * i + 1].hidden = (target !== tab);
					}
				});
			}
		}
		
		render(req, res) {
			return super.render(req, res, () => {
				let labels = '', tabs = '';
				this.children.forEach((tab, i) => {
					if (tab.ref && tab.granted()) {
						let fragment = tab.ref.render(req, res);
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
				let reference = new wbol.Reference(child);
				reference.parent = this;
				this.children.push(reference);
			}
			return this;
		}
	};
};
