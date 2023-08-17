/*!
 * keypad
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import Content from '../stwElements/Content.mjs';

export default class Keypad extends Content {
	constructor(params) {
		super(params);
	}

    // Content specific behaviors
    behaviors(req) {
        this.behavior = true;

		// TODO: Candidate socket
        req.app.get('/stwc/keypad/:key', (req, res, next) => {
            res.redirect('back'); // 206 Partial Content
        });
    }

	render(req, res, next) {
        if (!this.behavior) 
            this.behaviors(req);

		return super.render(req, res, next, () => {
			let fragment = '';
			this.template(res.session.lang).split('').forEach((c, i) => {
				if (c === '\n')
					return fragment += '<br>';
				return fragment += `<li data-ref="${c}">${c}</a></li>`;
			});
			return `<ul class="stwBody" onclick="location.href='/stwc/keypad/'">${fragment}</ul>`;
		});
	}
}