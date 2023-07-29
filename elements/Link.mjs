/*!
 * Link
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import Base from './Base.mjs';

export default class Link extends Base {
	constructor(ref) {
		super(ref.localizedName());
		this.ref = ref;
		delete this.children;
	}

	render(req, res, next) {
		if (this.ref.constructor.name !== 'Webo' && this.granted(socket.target.user) & 0b01)
			return this.ref.render(socket);
	}
}
