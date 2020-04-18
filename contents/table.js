/*!
 * table
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const Content = require('../elements/Content');

module.exports = class Table extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	render(req, res) {
		return super.render(req, res, (req, template) => {
			let fragment = '<table>';
			fragment += '<thead><tr></tr></thead><tbody>'; // TODO: Special handling of l, \t and \n symbols
			this.data.forEach(function (row, i) {
				fragment += `<tr>${this.renderRow()}</tr>`;
			});
			fragment += '</tbody><tfoot><tr>';
			fragment += 'This is pager space'; // TODO: Paging
			fragment += '</tr></tfoot></table>';
			return fragment;
		});
	}
}