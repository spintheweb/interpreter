/*!
 * Reference
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import Content from './Content.mjs';

export default class Reference extends Content {
	constructor(related) {
		super(related.name());
		this._cssClass = related._cssClass;
		this.ref = related;
	}

	Render(socket) {
		if (this.ref.constructor.name !== 'Webbase' && this.granted(socket.target.user) & 0b01)
			return this.ref.Render(socket);
	}
}
