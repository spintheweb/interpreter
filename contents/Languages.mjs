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

    Render(socket) {
        return super.Render(socket, (socket, template) => {
            if (this[WEBBASE].langs().length == 1)
                return '';

            let fragment = '';
            if (this[WEBBASE].langs().length <= 3) {
                for (let lang of this[WEBBASE].langs())
                    fragment += `&nbsp;<a href="/" onclick="stwHref(event)">${lang.toLowerCase()}</a>`;
            } else {
                fragment += '<select href="" onchange="stwHref(event)">'
                for (let lang of this[WEBBASE].langs())
                    fragment += `<option>${lang.toLowerCase()}</option>`;
                fragment += '</select>';
            }
            return fragment;
        });
    }
}
