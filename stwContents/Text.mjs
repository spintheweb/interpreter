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
			req.stwPublic = Object.assign({}, res.locals.cookie, req.query);
			req.stwPrivate = Object.assign({}, req.session); // TODO: Add Application

			req.stwPrivate.stwData = await this.getData(req);

			if (req.session.err) {
				this.showError(req, res);
				return;
			}

			let fragment = pickText([req.session.stwLanguage, Base[WEBBASE].lang], this.layout);

			switch (fragment) {
				case 'application/json':
					res.set('Content-Type', fragment);
					fragment = JSON.stringify(req.stwPrivate.stwData);
					break;
				case 'text/csv':
					res.set('Content-Type', fragment);
					fragment = '';
					for (let i = 0; i < req.stwPrivate.stwData.length; ++i) {
						if (!i)
							Object.keys(req.stwPrivate.stwData[i]).forEach(fld => fragment += `"${fld}",`);
						fragment += '\n';
						Object.values(req.stwPrivate.stwData[i]).forEach(fld => fragment += typeof (fld) === 'number' ? `${fld},` : `"${fld instanceof Date ? (fld.toJSON() || '') : fld}",`);
					}
					break;
				case 'application/xml':
					res.set('Content-Type', fragment);
					fragment = '<table>';
					for (let i = 0; i < req.stwPrivate.stwData.length; ++i) {
						fragment += '<row>';
						Object.keys(req.stwPrivate.stwData[i]).forEach((fld, j) => fragment += `<${fld}>${(req.stwPrivate.stwData[i][j] instanceof Date ? req.stwPrivate.stwData[i][j].toJSON() : encode(req.stwPrivate.stwData[i][j])) || ''}</${fld}>`);
						fragment += '</row>';
					}
					fragment += '</table>';
					break;
				default:
					res.set('Content-Type', 'text/html');
					let template = fragment;
					fragment = '';

					if (!req.stwPrivate.stwData.length)
						fragment = replacePlaceholders(template, req.stwPublic, req.stwPrivate);
					else
						req.stwPrivate.stwData.forEach(row => fragment += replacePlaceholders(template, req.stwPublic, Object.assign(req.stwPrivate, row)));

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