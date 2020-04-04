/*!
 * script
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (stw) => {
	stw.Script = class Script extends stw.Content {
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
