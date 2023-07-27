/*!
 * Content
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE, localize } from './Miscellanea.mjs';
import Base from './Base.mjs';
import { lexer, getValue, renderer } from './WBLL.mjs';

export default class Content extends Base {
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
        this.layout = { [params.lang]: params.layout };
    }

    get CSSClass() {
        return this.cssClass ? `class="${this.cssClass}"` : '';
    }
    Sequence(value) {
        if (typeof value === 'undefined') return this.sequence;
        this.sequence = isNaN(value) || value < 1 ? 1 : value;
        if (this.parent) // Order by section, sequence
            this.parent.children.sort((a, b) =>
                a._section + ('0000' + a._sequence.toFixed(2)).slice(-5) > b._section + ('0000' + b._sequence.toFixed(2)).slice(-5));
        return this;
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
        // [TODO] Preprocess query
        return this.query;
    }
    Params(name) {
        // [TODO] Preprocess query
        if (typeof value === 'undefined') return this.params;
        this.params = value;
        return this;
    }
    Layout(lang) {
        if (typeof value === 'undefined')
            return localize(lang, this.layout);
        this.layout[lang] = value;
        return this;
    }
    add(child) {
        if (!child || child == this || child.constructor.name === 'Webo')
            return this;

        if (child instanceof Content)
            child.Section(this.id); //this.permalink());
        else
            child = new Reference(child);

        if (this.children.indexOf(child) === -1) {
            if (child.parent)
                child = new Reference(child);
            child.parent = this;
            this.children.push(child);
        }
        return this;
    }
    async getData(req, callback) { // TODO: Request data asynchronously
        if (typeof this.query == 'function')
            return this.query(req);
        return JSON.parse(this.query || '[{}]');
    }
    async Render(req, res, next, body) {
        body = body || this.renderRow;

        let fragment = '';
        if (this.granted(req.session.roles) & 0b01) {
            req.dataset = await this.getData(req); // TODO: Retrieve data asynchronously

            let layout = lexer(this.Layout(req.session.lang));

            if (typeof layout === 'object') {
                // TODO: Evaluate layout.settings

                if (typeof layout.settings.visible != 'undefined' &&
                    (getValue(req, layout.settings.visible) ? false : true)) // TODO: layout.settings.invisible
                    return '';

                if (layout.settings.caption)
                    fragment += `<h1>${layout.settings.caption}</h1>`;
                if (layout.settings.header)
                    fragment += `<header>${layout.settings.header}</header>`;
                fragment += `<div>${body(req, this.id, layout)}</div>`;
                if (layout.settings.footer)
                    fragment += `<footer>${layout.settings.footer}</footer>`;
            } else
                fragment = body(req, layout);

            res.set('Cache-Control', 'max-age=0, no-store');
            res.send({ id: this._id, section: this.section, sequence: this.sequence, body: fragment });

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