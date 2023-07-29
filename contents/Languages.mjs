/*!
 * languages
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from '../elements/Miscellanea.mjs';
import Content from '../elements/Content.mjs';

// https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
export default class Languages extends Content {
    constructor(name, template, lang) {
        super(name, template, lang);
    }

    render(req, res, next) {
        return super.render(req, res, next, () => {
            if (req.app[WEBBASE].langs.length == 1)
                return '';

            let fragment = '';
            if (req.app[WEBBASE].langs.length <= 3) {
                for (let lang of req.app[WEBBASE].langs)
                    fragment += `&nbsp;<a href="/" onclick="stwHref(event)">${lang.toUpperCase()}</a>`;
            } else {
                fragment += '<i class="fa-solid fa-language"></i> <select onchange="">'
                for (let lang of req.app[WEBBASE].langs)
                    fragment += `<option>${lang.toUpperCase()}</option>`;
                fragment += '</select>';
            }
            return fragment;
        });
    }
}
