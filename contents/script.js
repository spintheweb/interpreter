/*!
 * script
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (webspinner) => {
	webspinner.Script = class Script extends webspinner.Content {
		constructor(name, template) {
			super(name, template || '');
			this._cssClass = 'clientside'; // clientside || serverside
		}
		
		render(req, res) {
			let fragment;
			if (this.granted()) {
				this.data = []; // TODO: Retrieve data asynchronously
				fragment = `<script>${this.template()}</script>`;
			}
			return fragment;
		}
	};
};
