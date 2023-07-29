/*!
 * keypad
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../elements/Miscellanea.mjs';
import Content from '../elements/Content.mjs';

export default class Keypad extends Content {
	constructor(name, template, lang) {
		super(name, template || 'abcdefghijklmnopqrstuvwxyz', lang);
	}

	render(req, res, next) {
		return super.render(req, res, next, () => {
			let fragment = '';
			this.template(res.session.lang).split('').forEach((c, i) => {
				if (c === '\n')
					return fragment += '<br>';
				return fragment += `<li data-ref="${c}">${c}</a></li>`;
			});
			return `<ul class="stwBody">${fragment}</ul>`;
		});
	}
}