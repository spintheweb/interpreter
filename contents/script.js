/*!
 * script
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (wbol) => {
	wbol.Script = class Script extends wbol.Content {
		constructor(name, template) {
			super(name, template || '');
			this._cssClass = 'clientside'; // clientside || serverside
		}
		
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
