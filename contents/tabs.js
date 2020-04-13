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
			this.eventHandler = function stwTabs(event) {
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
					if (tab.granted() & 0b1) {
						labels += `<li class="stwTabLabel${i === 0 ? ' stwSelected' : ''}" onclick="stwTabs(event)">${tab.name()}</li>`;
						tabs += `<li id="${tab.permalink()}" class="stwTab"${i !== 0 ? ' hidden' : ''} data-ref="${tab.permalink()}1"></li>`;
					}
				});
				return `<ul>${labels}${tabs}</ul>`;
			});
		}
	};
};
