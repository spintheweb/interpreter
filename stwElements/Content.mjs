/*!
 * Content
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE, pickText } from './Miscellanea.mjs';
import Base from './Base.mjs';
import { lexer, getValue, renderer } from './WBLL.mjs';
import { createElement } from './Element.mjs';

export default class Content extends Base {
    static #behavior = false;

    constructor(params = {}) {
        super(params);
        delete this.children;

        this.type = 'Content';
        this.subtype = this.constructor.name;
        this.cssClass = `stw${this.constructor.name}`;
        this.section = params.section || '';
        this.sequence = params.sequence || 1;
        this.dsn = params.dsn || '';
        this.query = params.query || '';
        this.params = params.params || '';
        this.layout = params.layout || {};
    }

    static changeSubtype(content, subtype) {
        Base[WEBBASE].index.delete(content._id);

        content.subtype = subtype;
        let newContent = createElement({ _id: content._idParent }, content);
        Base[WEBBASE].index.set(newContent._id, newContent);

        for (let i = 0; i < content.parent.children.length; ++i)
            if (content.parent.children[i] === content) {
                content.parent.children[i] = newContent;
                break;
            }

        return newContent;
    }

    patch(lang, params = {}) {
        super.patch(lang, params);
        this.cssClass = params.cssClass;
        this.section = params.section;
        this.Sequence(params.sequence);
        this.dns = params.dns;
        this.query = params.query;
        this.params = params.params;
        this.layout = { [lang]: params.layout };

        if (this.subtype != (params.subtype || 'Text'))
            return Content.changeSubtype(this, params.subtype || 'Text');

        return this;
    }

    get CSSClass() {
        return this.cssClass ? `class="${this.cssClass}"` : '';
    }
    Sequence(value) {
        this.sequence = isNaN(value) ? null : value;
        this.parent?.children.sort((a, b) => {
            let sa = (a.section ?? '-') + (a.sequence ?? '-'),
                sb = (b.section ?? '-') + (b.sequence ?? '-');

            if (sa > sb) return 1;
            if (sa < sb) return -1;
            return 0;
        });
    }
    Datasource(name, query, params) {
        this.Query(query);
        this.Params(params);
        if (typeof name === 'undefined')
            return this.datasource;
        this.datasource = name;
        return this;
    }
    get Query() {
        // TODO: Preprocess query
        return this.query;
    }
    Params(name) {
        // TODO: Preprocess query
        if (typeof value === 'undefined') return this.params;
        this.params = value;
        return this;
    }
    add() {
        return null;
    }
    async getData(req, callback) { // TODO: Request data asynchronously
        if (typeof this.query == 'function')
            return this.query(req);
        return JSON.parse(this.query || '[{}]');
    }
    async render(req, res, next, body) {
        let timestamp = Date.now();

        body = body || this.renderRow;

        let fragment = '';
        if (this.granted(req.session.roles) & 0b01) {
            req.dataset = await this.getData(req); // TODO: Retrieve data asynchronously

            let layout = lexer(pickText([req.session.lang, Base[WEBBASE].lang], this.layout));

            if (typeof layout === 'object') {
                // TODO: Evaluate layout.settings

                if (typeof layout.settings.visible != 'undefined' &&
                    (getValue(req, layout.settings.visible) ? false : true)) // TODO: layout.settings.invisible
                    return '';

                if (layout.settings.caption)
                    fragment += `<h1>${layout.settings.caption}</h1>`;
                if (layout.settings.header)
                    fragment += `<header>${layout.settings.header}</header>`;
                fragment += body(req, this.id, layout);
                if (layout.settings.footer)
                    fragment += `<footer>${layout.settings.footer}</footer>`;
            } else
                fragment = body(req, layout);

            res.set('Cache-Control', 'max-age=0, no-store');
            res.send({ id: this._id, section: this.section, sequence: this.sequence, body: `<article id="${this._id}" ${this.CSSClass} data-ms="${Date.now() - timestamp}ms" data-seq="${this.sequence}">${fragment}</article>` });

        } else
            res.sendStatus(204); // 204 No content
    }
    renderRow(req, contentId, layout) {
        if (typeof layout === 'object')
            return renderer(req, contentId, layout);
        else
            return layout;
    }

    /*
    // TODO: If developer show content info and rendering time
    log((new Date) - stopwatch, "time");
    log(new Date, "time");
    */
}