/*!
 * hyperimage
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../elements/Miscellanea.mjs';
import Content from '../elements/Content.mjs';

export default class HyperImage extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}
}