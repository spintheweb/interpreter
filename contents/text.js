/*!
 * text
 * Copyright(c) 2016 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

// Plain text, i.e., renders template as plain text if there is a datasource @ and @@ substitutions are performed
module.exports = wbol => {
    wbol.Text = class extends wbol.Content {
		constructor(name, template) {
			super(name, template);
			this._cssClass = null;
		}
		
		render(req, res) {
			return super.render(req, res, () => {
				return this.template();
			});
		}
    };
};
