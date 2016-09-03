/*!
 * script
 * Copyright(c) 2016 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (wbol) => {
	wbol.Script = class Script extends wbol.Content {
		render(req, res) {
			var fragment;
			if (this.granted()) {
				this.data = []; // TODO: Retrieve data asynchronously
				fragment = this.template();
			}
			return fragment;
		}
	};
};
