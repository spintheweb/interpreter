/*!
 * Page
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { join } from 'path';
import Base from './Base.mjs';

export default class Page extends Base {
	constructor(name, template, lang) {
		super(name, lang);
		this.contentType = 'text/html';
		this.template = template || 'index.htm';
	}

	ContentType(value) {
		if (typeof value === 'undefined') return this.contentType;
		this.contentType = value;
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}
	Template(value) {
		if (typeof value === 'undefined') 
			return this.template;
		this.template = value;
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}

	Render(req, res) {
		if (this.granted(req.session.roles))
			return join(process.cwd(), 'public', this.Template());
		return '';
	}
}
