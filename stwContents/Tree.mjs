/*!
 * tree
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import Content from '../stwElements/Content.mjs';
import { renderer, renderAttributes } from '../stwElements/WBLL.mjs';

// https://dirask.com/posts/JavaScript-convert-file-paths-to-tree-multi-level-maps-DdoPK1
const SEPARATOR_EXPRESSION = /[\\\/¥₩]+/i;

export default class Tree extends Content {
	constructor(params) {
		super(params);
	}

	async render(req, res, next) {
		return await super.render(req, res, next, () => {
			let path = (this._layout.settings.key || 'path').toLowerCase();
			path = Object.keys(req.dataset[0]).find(key => key.toLowerCase() == path);

			if (!path)
				return '';

			const tree = {};
			req.dataset.forEach((row, i) => {
				if (row[path]) {
					let node = tree;
					row[path].split(SEPARATOR_EXPRESSION).forEach(part => {
						if (part)
							node = node[part] ?? (node[part] = Object.defineProperty({}, 'row', { enumerable: false, value: i }));
					});
				}
			});

			return `<ol>${this.renderRow(req, tree)}</ol>`;
		});
	}

	renderRow(req, node, depth = 0) {
		let fragment = '';

		if (node.row === undefined) {
			for (let childnode in node)
				fragment += this.renderRow(req, node[childnode], depth);
		} else {
			req.row = node.row;

			let rowAttr = this._layout.tokens.find(token => token.symbol == '\\A') || { attrs: { class: '' }};
			rowAttr.attrs.class = rowAttr.attrs.class + ' stwToggleParent';
			rowAttr = renderAttributes(req, rowAttr.attrs);

			fragment = `<li${rowAttr}><div style="padding-left:${depth}em"><span>${Object.keys(node).length ? '<i class="fa-light fa-fw fa-angle-right"></i>' : '&emsp;'}</span>${renderer(req, this._id, this._layout)}</div>`;
			if (Object.keys(node).length) {
				fragment += '<ol class="stwToggleChild" style="display: none">';
				for (let childnode in node)
					fragment += this.renderRow(req, node[childnode], depth + 1);
				fragment += '</ol>';

			}
		}

		return !fragment ? '' : `${fragment}</li>`;
	}
}
