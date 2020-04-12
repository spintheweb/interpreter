/*!
 * text
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

// Plain text, i.e., renders template as plain text if there is a datasource @ and @@ substitutions are performed
module.exports = (webspinner) => {
    webspinner.Text = class Text extends webspinner.Content {
		constructor(name, template) {
			super(name, template);
			this._cssClass = null;
		}
		
		render(req, res) {
			return super.render(req, res, (req, template) => {
				return this.template();
			});
		}
    };
};
