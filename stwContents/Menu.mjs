/*!
 * menu
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE, pickText } from '../stwElements/Miscellanea.mjs';
import Base from '../stwElements/Base.mjs';
import Content from '../stwElements/Content.mjs';

export default class Menu extends Content {
	constructor(params = {}) {
		super(params);
		this.options = params.options || [];
	}

	// TODO: Mega menu, add contents!
	add(child) {
		if (child.constructor.name === 'Area' || child.constructor.name === 'Unit')
			this.options.push({ _id: child._id, name: null, params: null, sequence: 0x01000000 });
		return this;
	}

	async render(req, res, next) {
		return await super.render(req, res, next, () => {
			let fragment = '', mask = 0x3F000000, level = 1, prevLevel;

			this.options.forEach((link, i) => {
				let element = Base[WEBBASE].index.get(link._id);

				if (!element)
					this.options.splice(i, 1);
				else {
					if (element.constructor.name === 'Area')
						element = Base[WEBBASE].index.get(element.mainunit);

					for (prevLevel = level, level = 1; link.sequence & (mask >> (6 * level)); ++level);

					if (prevLevel > level)
						fragment += `</li>${'</ul>'.repeat(prevLevel - level)}`;
					else if (prevLevel == level)
						fragment += '</li>';
					else
						fragment += '<ul>';

					if (link.name === '-')
						fragment += `<li><hr>`;
					else if (element.granted(req.session.roles) & 1)
						fragment += `<li><div><a href="${element.permalink(req.session.lang) + (link.params ? '?' + link.params : '')}">${pickText([req.session.lang, Base[WEBBASE].lang], link.name || element.name)}</a></div>`;
				}
			});
			fragment += `</li>${'</ul>'.repeat(level - prevLevel)}</li>`;

			if (this._layout.settings.orientation !== 'vertical')
				return `<nav class="stwHorizontal"><ul>${fragment}</ul></nav>`;

			return `<nav class="stwVertical"><ul><li><ul>${fragment}</ul></li></ul></nav>`;
		});
	}
}