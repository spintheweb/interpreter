/*!
 * Client Side Code
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE, pickText } from '../stwElements/Miscellanea.mjs';
import Base from '../stwElements/Base.mjs';
import Content from '../stwElements/Content.mjs';

// All client site code that is visible in the page is concatenated
export default class ClientSideCode extends Content {
	constructor(params) {
		super(params);
		delete this.cssClass;
        delete this.sequence;
        delete this.section;
        delete this.children;
        this.layout = params.layout || { 'js': '' }
	}

	render(req, res, next) {
		if (this.granted(req.session.stwRoles) & 0b01) {
			let fragment = this.layout.js;

			if (this.dsn) {

			}

			res.send({ id: this._id, section: this.section, sequence: this.sequence, body: fragment });
		} else
			res.sendStatus(204); // 204 No content
	}
}