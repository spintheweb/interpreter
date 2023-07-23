/*!
 * Reference
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../elements/Miscellanea.mjs';
import Content from '../elements/Content.mjs';

export default class Reference extends Content {
	constructor(ref) {
		super(ref.name());
		this.cssClass = ref.cssClass;
		this.ref = ref;
	}

	Render(req, res, next) {
		if (this.ref.constructor.name !== 'Site' && this.granted(socket.target.user) & 0b01)
			return this.ref.Render(socket);
	}
}
