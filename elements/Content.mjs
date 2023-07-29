/*!
 * Content
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE, pickText } from './Miscellanea.mjs';
import Base from './Base.mjs';
import { lexer, getValue, renderer } from './WBLL.mjs';
import createElement from './Element.mjs';

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
        this.layout = params.layout || {};
		this.links = params.links || [];
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
        // TODO: Preprocess query
        return this.query;
    }
    Params(name) {
        // TODO: Preprocess query
        if (typeof value === 'undefined') return this.params;
        this.params = value;
        return this;
    }
    changeSubtype(newSubtype) {
//        this.subtype = newSubtype;
//        this = createElement(this, this); // Replace
//        return this;
    }
    add(link) {
        if (!link || link == this || link.constructor.name === 'Webo')
            return this;

        if (link instanceof Content)
            link.Section(this.id); //this.permalink());
        else
            link = new Reference(link);

        if (this.children.indexOf(link) === -1) {
            if (link.parent)
                link = new Reference(link);
            link.parent = this;
            this.links.push(link);
        }
        return this;
    }
    async getData(req, callback) { // TODO: Request data asynchronously
        if (typeof this.query == 'function')
            return this.query(req);
        return JSON.parse(this.query || '[{}]');
    }
    async render(req, res, next, body) {
        body = body || this.renderRow;

        let fragment = '';
        if (this.granted(req.session.roles) & 0b01) {
            req.dataset = await this.getData(req); // TODO: Retrieve data asynchronously

            let layout = lexer(pickText([req.session.lang, req.app[WEBBASE].lang], this.layout));

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