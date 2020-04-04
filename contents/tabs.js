/*!
 * tabs
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (stw) => {
	stw.Tabs = class Tabs extends stw.Content {
		constructor (name, template) {
			super(name, template);
			this._category = stw.stwContentCategory.ORGANIZATIONAL;
			
			// Code executed by the client to handle the content
			this.handler = function stwTabs(event) {
				let target = event.target; tabs = target.closest('ul').children;
				for (let i = 0; i < tabs.length / 2; ++i) {
					let tab = tabs[i];
					if (tab.classList.contains('stwTabLabel')) {
            			tab.classList[(target === tab) ? 'add' : 'remove']('stwSelected');
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
							labels += `<li class="stwTabLabel${i === 0 ? ' stwSelected' : ''}" data-ref="${i}" onclick="stwTabs(event)">${tab.name()}</li>`;
							tabs += `<li class="stwTab"${i !== 0 ? ' hidden' : ''} data-ref="${i}"><article id="${tab.ref.id}" lang="${stw.lang()}" class="${tab.ref.cssClass()}">${fragment}</article></li>`;
						}
					}
				});
				return `<ul class="stwBody">${labels}${tabs}</ul>`;
			});
		}
		add(child, name) {
			if (!(child instanceof stw.Reference) && child instanceof stw.Content) {
				let reference = new stw.Reference(child);
				reference.parent = this;
				this.children.push(reference);
			}
			return this;
		}
	};
};
