/*!
 * languages
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import Content from '../elements/Content';

// https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
export default class Languages extends Content {
    constructor(name, template, lang) {
        super(name, template, lang);
    }

    Render(socket) {
        return super.Render(socket, (socket, template) => {
            if (this.webbase.langs().length == 1)
                return '';

            let fragment = '';
            if (this.webbase.langs().length <= 3) {
                for (let lang of this.webbase.langs())
                    fragment += `&nbsp;<a href="/" onclick="stwHref(event)">${lang.toLowerCase()}</a>`;
            } else {
                fragment += '<select href="" onchange="stwHref(event)">'
                for (let lang of this.webbase.langs())
                    fragment += `<option>${lang.toLowerCase()}</option>`;
                fragment += '</select>';
            }
            return fragment;
        });
    }
}
