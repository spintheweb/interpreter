/*!
 * Content
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import Base from './Base.mjs';
import { lexer, getValue, renderer } from './WBLL.mjs';

export default class Content extends Base {
    constructor(name, template, lang = 'en', wbll = false) {
        super(name, lang);
        this.cssclass = 'stwContent stw' + this.constructor.name;
        this.section = '';
        this.sequence = 1;
        this.datasource = null;
        this.query = null;
        this.params = null;
        this.template = {};
        this.wbll = wbll ? {} : undefined; // The template is WBLL

        if (template)
            this.Template(lang, template);

        this._clientHandler = null; // Client side code
        this._serverHandler = null; // Server side code (TODO: Predefined CRUD handlers)
    }

    CSSClass(value, lang) {
        if (typeof value === 'undefined') {
            let layout = this.Template(lang);
            if (layout && layout.attrs) {
                let attrs = '';
                Object.keys(layout.attrs).forEach(key => {
                    if (key === 'class' && this.cssclass)
                        attrs += `class="${this.cssclass} ${layout.attrs.class}" `;
                    else
                        attrs += `${key}="${layout.attrs[key]}" `;
                });
                return attrs;
            }
            return `class="${this.cssclass}"`;
        }
        this.cssclass = value.toString();
        if (typeof this.webbase.changed === 'function')
            this.webbase.changed(this);
        return this;
    }
    Section(value, sequence) {
        if (typeof value === 'undefined') return this.section;
        this.section = value.toString();
        if (sequence) this.Sequence(sequence);
        if (typeof this.webbase.changed === 'function')
            this.webbase.changed(this);
        return this;
    }
    Sequence(value) {
        if (typeof value === 'undefined') return this.sequence;
        this.sequence = isNaN(value) || value < 1 ? 1 : value;
        if (this.Parent()) // Order by section, sequence
            this.Parent().children.sort((a, b) =>
            a._section + ('0000' + a._sequence.toFixed(2)).slice(-5) > b._section + ('0000' + b._sequence.toFixed(2)).slice(-5));
        if (typeof this.webbase.changed === 'function')
            this.webbase.changed(this);
        return this;
    }
    Datasource(name, query, params) {
        this.Query(query);
        this.Params(params);
        if (typeof name === 'undefined')
            return this.datasource;
        this.datasource = name;
        if (typeof this.webbase.changed === 'function')
            this.webbase.changed(this);
        return this;
    }
    Query(value, params) {
        this.Params(params);
        if (typeof value === 'undefined') return this.query;
        this.query = value;
        if (typeof this.webbase.changed === 'function')
            this.webbase.changed(this);
        return this;
    }
    Params(value) {
        if (typeof value === 'undefined') return this.params;
        this.params = value;
        if (typeof this.webbase.changed === 'function')
            this.webbase.changed(this);
        return this;
    }
    Template(lang, value) {
        if (typeof value === 'undefined')
            return this.webbase.localize(lang, typeof this.wbll === 'undefined' ? this.template : this.wbll);
        if (typeof this.wbll !== 'undefined')
            this.wbll[lang] = lexer(value);
        else
            this.template[lang] = value;
        if (typeof this.webbase.changed === 'function')
            this.webbase.changed(this);
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
        if (!child || child == this || child.constructor.name === 'Webbase')
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
            if (typeof this.webbase.changed == 'function')
                this.webbase.changed(this);
        }
        return this;
    }
    getData(socket, callback) { // TODO: Request data asynchronously
        return [{}];
        if (typeof this.query == 'function')
            return this.query(socket);
        return JSON.parse(this.query || '[{}]');
    }
    Render(socket, renderBody) {
        if (!renderBody)
            renderBody = this.renderRow;

        let fragment = '';
        if (this.Section !== '' && this.granted(socket.target.user) & 0b01) {
            socket.dataset = this.getData(socket); // TODO: Retrieve data asynchronously

            let template = this.Template(this.webbase.Lang());

            if (template && typeof template === 'object') {
                // TODO: Evaluate template.settings

                if (typeof template.settings.visible != 'undefined' &&
                    (getValue(socket, template.settings.visible) ? false : true)) // TODO: template.settings.invisible
                    return '';

                if (template.settings.caption)
                    fragment += `<h1>${template.settings.caption}</h1>`;
                if (template.settings.header)
                    fragment += `<header>${template.settings.header}</header>`;
                fragment += `<div>${renderBody(socket, this.id, template)}</div>`;
                if (template.settings.footer)
                    fragment += `<footer>${template.settings.footer}</footer>`;
            } else
                fragment = renderBody(socket, template);
        }
        return fragment;
    }
    renderRow(socket, contentId, template) {
        if (typeof template === 'object')
            return renderer(socket, contentId, template);
        else
            return template;
    }

    /*
    // TODO: If developer show content info and rendering time
    log((new Date) - stopwatch, "time");
    log(new Date, "time");
    */
}