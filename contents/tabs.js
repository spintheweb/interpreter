/*!
 * tabs
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (webspinner) => {
	webspinner.Tabs = class Tabs extends webspinner.Content {
		constructor(name, template) {
			super(name, template, true);
			this._category = webspinner.stwContentCategory.ORGANIZATIONAL;

			// Code executed by the client to handle the content
			this.handler = function stwTabs(event) {
				let target = event.target.closest('li'); tabs = target.closest('ul').children;
				for (let i = 0; i < tabs.length / 2; ++i) {
					let tab = tabs[i];
					if (tab.classList.contains('stwTabLabel')) {
						tab.classList[target == tab ? 'add' : 'remove']('stwSelected');
						if (target == tab)
							tabs[tabs.length / 2 + i].removeAttribute('hidden');
						else
							tabs[tabs.length / 2 + i].setAttribute('hidden', true);
					}
				}
			};
		}

		render(req, res) {
			return super.render(req, res, (req, template) => {
				let labels = '', tabs = '';
				this.children.forEach((tab, i) => {
					if (tab.ref && tab.granted()) {
						let fragment = tab.ref.render(req, res);
						if (fragment) {
							labels += `<li class="stwTabLabel${i === 0 ? ' stwSelected' : ''}" data-ref="${i}" onclick="stwTabs(event)">${tab.name()}</li>`;
							tabs += `<li id="${tab.permalink()}" class="stwTab"${i !== 0 ? ' hidden' : ''} data-ref="${i}"><article id="${tab.ref.id}" lang="${webspinner.lang()}" class="${tab.ref.cssClass()}">${fragment}</article></li>`;
						}
					}
					if (tab && tab.granted()) {
						let fragment = tab.render(req, res);
						if (fragment) {
							labels += `<li class="stwTabLabel${i === 0 ? ' stwSelected' : ''}" data-ref="${i}" onclick="stwTabs(event)">${tab.name()}</li>`;
							tabs += `<li id="${tab.permalink()}" class="stwTab"${i !== 0 ? ' hidden' : ''} data-ref="${i}"><article id="${tab.id}" lang="${webspinner.lang()}" class="${tab.cssClass()}">${fragment}</article></li>`;
						}
					}
				});
				return `<ul>${labels}${tabs}</ul>`;
			});
		}
	};
};
