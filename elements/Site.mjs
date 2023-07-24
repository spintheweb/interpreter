/*!
 * Site
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
import fs from 'fs';
import path from 'path';
import language from 'accept-language-parser';

import { WEBBASE, PATH, INDEX } from './Miscellanea.mjs';
import Area from './Area.mjs';
import Page from './Page.mjs';

import contentFactory from '../contents/contentFactory.mjs';

export default class Site extends Area {
    constructor(params = {}) {
        super(params);
        delete this.slug;
        this.url = params.url;
        this.lang = params.lang;
        this.langs = new Array(params.lang);

        this[WEBBASE][INDEX] = new Map();
        this[WEBBASE][PATH] = params.webbase;

        this.visibility = params.visibility || { // Predefined roles
            administrators: true, // Everything except development
            developers: true, // Manage webbase
            translators: false, // Modify texts in webbase
            guests: true, // Use public parts of webbase
            users: true, // Use webbase
            webmasters: false // Add data
        };
        this.datasources = params.datasources || {
            json: { mime: 'application/json', data: {} }
        };

        // Import webbase
        let webbase;
        if (params.webbase && fs.existsSync(params.webbase))
            webbase = fs.readFileSync(params.webbase);
        else
            webbase = '{"_id":"169ecfb0-2916-11ee-ad92-6bd31f953e80","type":"Site","status":"M","name":{"en":"Hello World"},"slug":{"en":"Site"},"children":[{"_id":"169ecfb1-2916-11ee-ad92-6bd31f953e80","type":"Page","status":"U","name":{"en":"Home"},"slug":{"en":"Home"},"children":[{"_id":"169ecfb2-2916-11ee-ad92-6bd31f953e80","type":"Content","status":"U","name":{"en":"Hello World"},"slug":{"en":"HelloWorld"},"children":[],"visibility":{},"subtype":"Text","cssClass":null,"section":"","sequence":1,"dsn":"","query":"","params":"","layout":{"en":"Hello World from Spin The Web&trade;!"},"_clientHandler":null,"_serverHandler":null,"_idParent":"169ecfb1-2916-11ee-ad92-6bd31f953e80"}],"visibility":{},"keywords":{},"description":{},"contentType":"text/html","template":"index.html","_idParent":"169ecfb0-2916-11ee-ad92-6bd31f953e80"}],"visibility":{"administrators":true,"developers":true,"translators":false,"guests":true,"users":true,"webmasters":false},"mainpage":"169ecfb1-2916-11ee-ad92-6bd31f953e80","langs":["en"],"datasources":{"json":{"mime":"application/json","data":{}}}}';

        this[WEBBASE] = Object.assign(this[WEBBASE], JSON.parse(webbase));

        let createIndex = (obj, _idParent = null) => {
            obj._idParent = _idParent;
            this[INDEX].set(obj._id, obj);
            if (obj.children)
                for (let i = 0; i < obj.children.length; ++i) {
                    let typedChild;
                    if (obj.children[i].type === 'Area')
                        typedChild = new Area();
                    else if (obj.children[i].type === 'Page')
                        typedChild = new Page();
                    else
                        typedChild = contentFactory.create(obj.children[i].subtype);

                    if (typedChild)
                        obj.children[i] = Object.assign(typedChild, obj.children[i]);

                    createIndex(obj.children[i], obj._id);
                    obj.children[i][WEBBASE] = this[WEBBASE];
                }
        }
        createIndex(this[WEBBASE]);
    }

    // [TODO] https://www.npmjs.com/package/locale
    Lang(code) {
        if (typeof code === 'undefined')
            return this.langs[0];
        if (value.search(/^[a-z][a-z](-[a-z][a-z])?$/i) !== -1)
            this.langs[0] = code.toLowerCase();
        return this;
    }

    Langs(codes) {
        if (typeof codes === 'undefined')
            return this.langs;
        if (value.search(/^[a-z][a-z](-[a-z][a-z])?$/i) !== -1 && !this.Langs.includes(code))
            this.langs.push(code.toLowerCase());
        return this;
    }

    // NOTE: Role management is allowed only to the administrators role
    role(name, enabled) {
        if (this.users[this.user()].roles.indexOf('administrators') !== -1)
            return -1;
        if (!this.visibility[name])
            this.visibility[name] = {};
        this.visibility[name].enabled = (enabled || name === 'administrators' || name === 'guests') ? true : false;
        return 0;
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
            pathname = this.Mainpage();

        if (typeof pathname === 'object')
            return pathname;

        if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(pathname))
            return this[INDEX].get(pathname);

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

    Render(req, res, next) {
        const lang = language.pick(this.langs, req.headers['accept-language']);

        if (req.method === 'GET') {
            if (req.url === '/sitemap.xml')
                return this.Sitemap(req);
            else if (req.url.search(/\.[a-z0-9]{1,4}$/i) !== -1)
                return path.join(process.cwd(), 'public', req.url);

            return (this.route(req.url, lang)).Render(req, res);
        }
        next();
    }

    // Build a site map (https://www.sitemaps.org/index.html) that includes the urls of the visible pages in the webbase, if no language is specified in the url return the sitemap index
    Sitemap(req, res) {
        let lang = parse(req.url).query, fragment = '';

        if (lang) {
            if (!this.langs.includes(lang))
                lang = this.Lang();
            _url(this);
            return `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${fragment}</urlset>`;
        }

        for (lang of this.Langs())
            fragment += `<sitemap><loc>${this.name(undefined, lang)}?${lang}</loc></sitemap>`;
        return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${fragment}</sitemapindex>`;

        function _url(element) {
            if (['Site', 'Area'].indexOf(element.constructor.name) !== -1 && element.children.length > 0)
                element.children.forEach(child => _url(child));
            else if (element.constructor.name === 'Page' && element.granted(req.user) & 0b01 === 0b01)
                fragment += `<url><loc>${element.webbase.name(undefined, lang)}${element.slugSlug(true)}</loc><changefreq>always</changefreq><priority>0.5</priority></url>`;
        }
    }
}
