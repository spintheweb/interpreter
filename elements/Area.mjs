/*!
 * Area
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import Base from './Base.mjs';
import Page from './Page.mjs';

export default class Area extends Base {
	constructor(name, lang) {
		super(name, lang);
		this.mainpage = null;
	}
	Mainpage(value) {
		if (typeof value === 'undefined')
			return this.mainpage || this.webbase.mainpage;
		if (value instanceof Page)
			this.mainpage = value._id;
		return this;
	}

	add(child, isMain) {
		super.add(child);
		if (child instanceof Page && isMain || !this.Mainpage())
			this.Mainpage(child);
		return this;
	}

	Render(socket) {
		if (this.mainpage)
			return this.mainpage.Render(socket);
		return this.webbase._mainpage.Render(socket);
	}
}
