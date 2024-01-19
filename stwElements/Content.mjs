/*!
 * Content
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE, pickText, replacePlaceholders } from './Miscellanea.mjs';
import Base from './Base.mjs';
import { lexer, getValue, renderer } from './WBLL.mjs';
import { createElement } from './Element.mjs';
import Execute from '../stwData.mjs';

export default class Content extends Base {
    static #behavior = false;

    constructor(params) {
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
        this.dsn = params.dsn;
        this.query = params.query;
        this.params = params.params;
        this.layout = { [lang]: params.layout };
        if (this._layout)
            this._layout = undefined; // Force lexer next load

        if (this.subtype != (params.subtype || 'Text'))
            return Content.changeSubtype(this, params.subtype || 'Text');

        return this;
    }

    CSSClass(cssClass = '') {
        cssClass = this.cssClass + ' ' + cssClass;
        return cssClass.trimEnd() ? `class="${cssClass}"` : '';
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
    add() {
        return null;
    }
    async getData(req) {
        let data = [{}];
        if (this.dsn) {
            try {
                data = await Execute(Base[WEBBASE].datasources[this.dsn], replacePlaceholders(this.query, req.stwPublic, req.stwPrivate));
                data = data[0];
            }
            catch (err) {
                req.session.err = err;
            }
        }
        return data;
    }
    showError(req, res) {
        let body = `<i class="fal fa-fw fa-bug" title="CONTENT: ${this.permalink(req.session.stwLanguage)}"></i>`;
        if (req.stwPublic.stwIsDeveloper) {
            body = `CONTENT: ${this.permalink(req.session.stwLanguage)}`;
            for (let property in req.session.err)
                body += `\n${property.toUpperCase()}: ${req.session.err[property]}`;
            body = `<i role="inspector" data-id="${this._id}" class="fa-kit fa-fw fa-light-bug-magnifying-glass stwInspector" title="${body}" style="position:relative"></i>`
        }
        delete req.session.err;

        // 206 Partial Content
        res.status(206).send({ id: this._id, section: this.section, sequence: this.sequence, body: body });
    }

    async render(req, res, next, body) {
        let timestamp = Date.now();

        body = body || renderer;

        let fragment = '';
        if (this.granted(req.session.stwRoles) & 0b01) {
            req.stwPublic = Object.assign({}, res.locals.cookie, req.query);
            req.stwPrivate = Object.assign({}, req.session); // TODO: Add Application parameters
            delete req.stwPrivate.cookie;

            req.stwPrivate.stwR = 0;
            req.stwPrivate.stwData = await this.getData(req);
            Object.assign(req.stwPrivate, req.stwPrivate.stwData[0]);

            if (req.session.err) {
                this.showError(req, res);
                return;
            }

            if (!this._layout) // lex once!
                try {
                    Object.defineProperty(this, '_layout', { enumerable: false, writable: true });
                    this._layout = lexer(req, pickText([req.session.stwLanguage, Base[WEBBASE].lang], this.layout));
                } catch (err) {
                    req.session.err = { "syntax error": '\n' + err.message.replace(/"/g, "''") };
                    this.showError(req, res);
                    return;
                }

            if (typeof this._layout === 'object') {
                // TODO: Evaluate layout.settings

                if (this._layout.settings.visible !== undefined &&
                    (getValue(req, this._layout.settings.visible) ? false : true)) // TODO: layout.settings.invisible
                    return '';

                if (this._layout.settings.caption)
                    fragment += `<h1>${this._layout.settings.collapsible ? '<i class="fa-light fa-fw fa-angle-down"></i>' : ''}${this._layout.settings.caption}</h1>`;
                fragment += '<div class="stwToggleChild">';
                if (this._layout.settings.header)
                    fragment += `<header>${this._layout.settings.header}</header>`;
                fragment += body(req, this.id, this._layout);
                if (this._layout.settings.footer)
                    fragment += `<footer>${this._layout.settings.footer}</footer>`;
                fragment += '</div>';
            } else
                fragment = body(req, this._layout);

            if (!fragment) {
                res.sendStatus(204); // 204 No content
                return;
            }

            res.set('Content-Type', 'text/html');
            res.set('X-Content-Type-Options', 'nosniff');
            res.set('Cache-Control', 'max-age=0, no-store');

            let cssClass = '';
            if (req.stwPublic.stwIsDeveloper == 'true')
                cssClass = 'stwInspect';
            if (this._layout.settings.collapsible == 'true')
                cssClass += ' stwToggleParent';

            res.send({ id: this._id, section: this.section, sequence: this.sequence, body: `<article id="${this._id}" ${req.stwPublic.stwIsDeveloper == 'true' ? this.CSSClass(cssClass) + ' title="Inspect content (CTRL+click)"' : this.CSSClass(cssClass)} data-ms="${Date.now() - timestamp}ms" data-seq="${this.sequence}" onclick="stwToggleContent(event)">${fragment}</article>` });

        } else
            res.sendStatus(204); // 204 No content
    }

    renderRow(req) {
        return renderer(req, this._id, this._layout);
    }
}