/*!
 * Reference
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from './Miscellanea.mjs';
import Content from './Base.mjs';

export default class Reference extends Base {
	constructor(ref) {
		super(ref.name());
		this.ref = ref;
		delete this.children;
	}

	Render(req, res, next) {
		if (this.ref.constructor.name !== 'Site' && this.granted(socket.target.user) & 0b01)
			return this.ref.Render(socket);
	}
}
