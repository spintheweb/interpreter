/*!
 * languages
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../stwElements/Miscellanea.mjs';
import Base from '../stwElements/Base.mjs';
import Content from '../stwElements/Content.mjs';

// https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
export default class Languages extends Content {
    constructor(params) {
        super(params);
		delete this.dsn;
		delete this.query;
		delete this.params;
		delete this.layout;
    }

    // Content specific behaviors
    behaviors(req) {
        this.behavior = true;

        req.app.get('/stwc/setlanguage/:lang', (req, res, next) => {
            req.session.stwLanguage = req.params.lang;
            res.redirect('back');
        });
    }

    render(req, res, next) {
        if (!this.behavior)
            this.behaviors(req);

        return super.render(req, res, next, () => {
            if (Base[WEBBASE].langs.length == 1)
                return '';

            let fragment = '';
            if (Base[WEBBASE].langs.length <= 3)
                for (let lang of Base[WEBBASE].langs)
                    fragment += `&nbsp;<a href="/stwc/setlanguage/${lang}">${lang.toUpperCase()}</a>&nbsp;`;
            else {
                fragment += `<i class="fa-light fa-language"></i> <select onchange="location.href='/stwc/setlanguage/${lang}'">`
                for (let lang of Base[WEBBASE].langs)
                    fragment += `<option>${lang.toUpperCase()}</option>`;
                fragment += '</select>';
            }
            return `<span ${this.CSSClass(req.stwPublic.stwIsDeveloper ? 'stwInspectable' : '')}">${fragment}</span>`;
        });
    }
}
