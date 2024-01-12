/*!
 * text
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE, pickText, replacePlaceholders } from '../stwElements/Miscellanea.mjs';
import { encode } from 'html-entities';
import Base from '../stwElements/Base.mjs';
import Content from '../stwElements/Content.mjs';

// Plain text, i.e., renders layout as plain text if there is a datasource @ and @@ substitutions are performed
export default class Text extends Content {
	constructor(params) {
		super(params);
		this.cssClass = null;
	}

	async render(req, res, next) {
		if (this.granted(req.session.stwRoles) & 0b01) {
			req.exposed = Object.assign(res.locals.cookie, req.query);
			req.unexposed = Object.assign(req.session); // TODO: Add Application

			req.dataset = await this.getData(req);

			if (req.session.err) {
				this.showError(req, res);
				return;
			}

			let fragment = pickText([req.session.stwLanguage, Base[WEBBASE].lang], this.layout);

			switch (fragment) {
				case 'application/json':
					res.set('Content-Type', fragment);
					fragment = JSON.stringify(req.dataset);
					break;
				case 'text/csv':
					res.set('Content-Type', fragment);
					fragment = '';
					for (let i = 0; i < req.dataset.length; ++i) {
						if (!i)
							Object.keys(req.dataset[i]).forEach(fld => fragment += `"${fld}",`);
						fragment += '\n';
						Object.values(req.dataset[i]).forEach(fld => fragment += typeof (fld) === 'number' ? `${fld},` : `"${fld instanceof Date ? (fld.toJSON() || '') : fld}",`);
					}
					break;
				case 'application/xml':
					res.set('Content-Type', fragment);
					fragment = '<table>';
					for (let i = 0; i < req.dataset.length; ++i) {
						fragment += '<row>';
						Object.keys(req.dataset[i]).forEach((fld, j) => fragment += `<${fld}>${(req.dataset[i][j] instanceof Date ? req.dataset[i][j].toJSON() : encode(req.dataset[i][j])) || ''}</${fld}>`);
						fragment += '</row>';
					}
					fragment += '</table>';
					break;
				default:
					res.set('Content-Type', 'text/html');
					let template = fragment;
					fragment = '';

					if (!req.dataset.length)
						fragment = replacePlaceholders(template, req.exposed, req.unexposed);
					else
						req.dataset.forEach(row => fragment += replacePlaceholders(template, req.exposed, Object.assign(req.unexposed, row)));

					if (this.cssClass)
						fragment = `<div class="${this.cssClass}">${fragment}</div>`;
			}

			res.set('X-Content-Type-Options', 'nosniff');
			res.set('Cache-Control', 'max-age=0, no-store');
			res.send({ id: this._id, section: this.section, sequence: this.sequence, body: fragment });
		} else
			res.sendStatus(204); // 204 No content
	}
}