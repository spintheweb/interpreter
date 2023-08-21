/*!
 * options
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../stwElements/Miscellanea.mjs';
import Content from '../stwElements/Content.mjs';

export default class Tabs extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);

		this.options = params.options || [];
	}

	// TODO: Render only the first selected option
	render(req, res, next) {
		return super.render(req, res, next, () => {
			let labels = '', options = '';
			this.options.forEach((option, i) => {
				if (option.granted(req.session.roles & 0b01)) {
					labels += `<li class="stwTabLabel${i === 0 ? ' stwSelected' : ''}" onclick="stwTabs(event)">${option.localizedName()}</li>`;
					options += `<li id="${option.permalink()}" class="stwTab"${i !== 0 ? ' hidden' : ''} data-ref="${option.permalink()}1"></li>`;
				}
			});
			return `<ul>${labels}${options}</ul>`;
		});
	}
}