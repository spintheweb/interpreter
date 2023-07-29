/*!
 * Webo
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
import path from 'path';
import language from 'accept-language-parser';

import { WEBBASE } from './Miscellanea.mjs';
import Base from './Base.mjs';
import Area from './Area.mjs';
import createElement from './Element.mjs';

export default class Webo extends Area {
    constructor(params = {}) {
        super(params);
        delete this.slug;

        this.url = params.url;
        this.lang = params.lang || 'en';
        this.langs = new Array(params.lang || 'en');

        // Predefined roles
        Object.assign(this.visibility, params.visibility, { 
            administrators: true, // Everything except development
            developers: true, // Manage webbase
            translators: false, // Modify texts in webbase
            guests: false, // Use public parts of webbase
            users: true, // Use webbase
            webmasters: false // Add data
        });
        this.datasources = params.datasources || {
            example: { mime: 'application/json', data: [{ name: 'WBDL', desc: 'Webbase Description Language' }, { name: 'WBLL', desc: 'Webbase Layout Language' }] }
        };

        for (let child of params.children)
            this.add(createElement(this, child));
    }

    // TODO: https://www.npmjs.com/package/locale
    Lang(code) {
        if (typeof code === 'undefined')
            return this.langs[0];
        if (value.search(/^[a-z][a-z](-[a-z][a-z])?$/i) !== -1)
            this.langs[0] = code.toLowerCase();
        return this;
    }

    datasource(name, obj) {
        if (!name && !obj)
            return this.datasources;
        if (name && !obj)
            return this.datasources[name];
        if (name && obj)
            this.datasources[name] = obj;
        return obj;
    }

    // Determine the requested webbase element given the url
    route(pathname, lang) {
        if (!pathname || pathname === '/')
            pathname = this.mainpage;

        if (typeof pathname === 'object')
            return pathname;

        if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(pathname))
            return Base[WEBBASE].index.get(pathname);

        return (function walk(slugs, node) {
            node = node.children.find(child => child.slug[lang] == slugs[0]);
            slugs.shift();
            if (!node)
                return undefined;
            else if (slugs.length == 0)
                return node;
            return walk(slugs, node);
        })(pathname.split('/'), this);
    }

    render(req, res, next) {
        const lang = language.pick(this.langs, req.headers['accept-language']);

        if (req.method === 'GET') {
            if (req.url === '/sitemap.xml')
                return this.sitemap(req);
            else if (req.url.search(/\.[a-z0-9]{1,4}$/i) !== -1)
                return path.join(process.cwd(), 'public', req.url);

            return (this.route(req.url, lang)).render(req, res);
        }
        next();
    }

    // Build a site map (https://www.sitemaps.org/index.html) that includes the urls of the visible pages in the webbase, if no language is specified in the url return the sitemap index
    sitemap(req, res) {
        let lang = parse(req.url).query, fragment = '';

        if (lang) {
            if (!this.langs.includes(lang))
                lang = this.Lang();
            _url(this);
            return `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${fragment}</urlset>`;
        }

        for (lang of this.langs)
            fragment += `<sitemap><loc>${this.localizedName(undefined, lang)}?${lang}</loc></sitemap>`;
        return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${fragment}</sitemapindex>`;

        function _url(element) {
            if (['Webo', 'Area'].indexOf(element.constructor.name) !== -1 && element.children.length > 0)
                element.children.forEach(child => _url(child));
            else if (element.constructor.name === 'Page' && element.granted(req.user) & 0b01 === 0b01)
                fragment += `<url><loc>${element.webbase.localizedName(undefined, lang)}${element.slugSlug(true)}</loc><changefreq>always</changefreq><priority>0.5</priority></url>`;
        }
    }
}
