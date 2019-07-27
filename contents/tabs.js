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
			
			// Code executed by the client to handle the content
			this.handler = function wbolTabs(event) {
				let target = event.target; tabs = target.closest('ul').children;
				for (let i = 0; i < tabs.length / 2; ++i) {
					let tab = tabs[i];
					if (tab.classList.contains('wbolTabLabel')) {
            			tab.classList[(target === tab) ? 'add' : 'remove']('wbolSelected');
						if (target === tab)
							tabs[tabs.length / 2 + i].removeAttribute('hidden');
						else
							tabs[tabs.length / 2 + i].setAttribute('hidden', true);
					}
				}
			};
		}
		
		render(req, res) {
			return super.render(req, res, () => {
				let labels = '', tabs = '';
				this.children.forEach((tab, i) => {
					if (tab.ref && tab.granted()) {
						let fragment = tab.ref.render(req, res);
						if (fragment) {
							labels += `<li class="wbolTabLabel${i === 0 ? ' wbolSelected' : ''}" data-ref="${i}" onclick="wbolTabs(event)">${tab.name()}</li>`;
							tabs += `<li class="wbolTab"${i !== 0 ? ' hidden' : ''} data-ref="${i}"><article id="${tab.ref.id}" lang="${wbol.lang()}" class="${tab.ref.cssClass()}">${fragment}</article></li>`;
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
