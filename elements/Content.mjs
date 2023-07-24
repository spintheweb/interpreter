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
        this.type = 'Content';
        this.subtype = this.constructor.name;
        this.cssClass = `stw${this.constructor.name}`;
        this.section = params.section || '';
        this.sequence = params.sequence || 1;
        this.dsn = params.dsn || '';
        this.query = params.query || '';
        this.params = params.params || '';
        this.layout = { [params.lang]: params.layout };

        this._clientHandler = null; // Client side code
        this._serverHandler = null; // Server side code (TODO: Predefined CRUD handlers)
    }

    CSSClass(value, lang) {
        if (typeof value === 'undefined') {
            let layout = this.Layout(lang);
            if (layout && layout.attrs) {
                let attrs = '';
                Object.keys(layout.attrs).forEach(key => {
                    if (key === 'class' && this.cssClass)
                        attrs += `class="${this.cssClass} ${layout.attrs.class}" `;
                    else
                        attrs += `${key}="${layout.attrs[key]}" `;
                });
                return attrs;
            }
            return `class="${this.cssClass}"`;
        }
        this.cssClass = value.toString();
        return this;
    }
    Section(value, sequence) {
        if (typeof value === 'undefined') return this.section;
        this.section = value.toString();
        if (sequence) this.Sequence(sequence);
        return this;
    }
    Sequence(value) {
        if (typeof value === 'undefined') return this.sequence;
        this.sequence = isNaN(value) || value < 1 ? 1 : value;
        if (this.Parent()) // Order by section, sequence
            this.Parent().children.sort((a, b) =>
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
    Query(value, params) {
        this.Params(params);
        if (typeof value === 'undefined') return this.query;
        this.query = value;
        return this;
    }
    Params(value) {
        if (typeof value === 'undefined') return this.params;
        this.params = value;
        return this;
    }
    Layout(lang, value) {
        if (typeof value === 'undefined')
            return localize(lang, this.layout);
        this.layout[lang] = value;
        return this;
    }
    clientHandler(callback) {
        if (typeof callback === 'function')
            this._clientHandler = callback;
        return this;
    }
    serverHandler(callback) {
        switch (typeof callback) {
            case 'undefined':
                return (this._serverHandler || '').toString();
            case 'string':
                try {
                    let fn = new Function(callback);
                    this._serverHandler = fn;
                } catch (err) {
                    console.log(err);
                }
                break;
            case 'function':
                this._serverHandler = callback;
                break;
        }
        return this;
    }
    add(child) {
        if (!child || child == this || child.constructor.name === 'Site')
            return this;

        if (child instanceof Content)
            child.Section(this.id); //this.permalink());
        else
            child = new Reference(child);

        if (this.children.indexOf(child) === -1) {
            if (child.Parent())
                child = new Reference(child);
            child.Parent() = this;
            this.children.push(child);
        }
        return this;
    }
    getData(req, callback) { // TODO: Request data asynchronously
        if (typeof this.query == 'function')
            return this.query(req);
        return JSON.parse(this.query || '[{}]');
    }
    Render(req, res, next, body) {
        body = body || this.renderRow;

        let fragment = '';
        if (this.granted(req.session.roles) & 0b01) {
            req.dataset = this.getData(req); // TODO: Retrieve data asynchronously

            let layout = this.Layout(this[WEBBASE].Lang());

            if (layout && typeof layout === 'object') {
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
        }
        res.send({ type: 'text/html', id: this._id, section: this.section, sequence: this.sequence, body: fragment });
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