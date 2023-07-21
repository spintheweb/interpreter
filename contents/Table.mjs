/*!
 * table
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../elements/Webbase.mjs';
import Content from '../elements/Content.mjs';
import { renderer } from `../elements/WBLL`;

export default class Table extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	Render(socket) {
		return super.Render(socket, (socket, template) => {
			let fragment = '<table>';
			fragment += '<thead><tr></tr></thead><tbody>'; // TODO: Special handling of l, \t and \n symbols
			socket.dataset.forEach(function (row, i) {
				socket.row = i;
				fragment += `<tr>${renderer(socket, this, template)}</tr>`;
			});
			fragment += '</tbody><tfoot><tr>';
			fragment += 'This is pager space'; // TODO: Paging
			fragment += '</tr></tfoot></table>';
			return fragment;
		});
	}
}