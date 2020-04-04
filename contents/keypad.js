/*!
 * keypad
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (stw) => {
	stw.Keypad = class Keypad extends stw.Content {
		constructor (name, template) {
			super(name, template || 'abcdefghijklmnopqrstuvwxyz');
		}
		render(req, res) {
			return super.render(req, res, () => {
				var fragment = '';
				this.template().split('').forEach((c, i) => {
					if (c === '\n')
						return fragment += '<br>';
					return fragment += `<li data-ref="${c}">${c}</a></li>`;
				});
				return `<ul class="stwBody">${fragment}</ul>`;
			});
		}
	};
};
