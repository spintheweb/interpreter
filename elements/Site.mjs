/*!
 * Site
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
import fs from 'fs';
import path from 'path';
import language from 'accept-language-parser';

import { WEBBASE, PATH, INDEX } from './Constants.mjs';
import Area from './Area.mjs';
import Page from './Page.mjs';
import Group from './Group.mjs';

import Text from '../contents/Text.mjs';

/*
const contents = {};
fs.readdirSync(path.join(process.cwd(), 'contents')).forEach(async module => {
    if (module.endsWith('.mjs'))
        contents[module.replace('.mjs', '')] = await import('../contents/' + module);
});
*/

export default class Site extends Area {
    constructor(params = {}) {
        super(params);
        this.langs = [params.lang];

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
        if (params.webbase && fs.existsSync(params.webbase)) {
            this[WEBBASE] = Object.assign(this[WEBBASE], JSON.parse(fs.readFileSync(params.webbase)));

            function createIndex(obj, _idParent = null) {
                obj._idParent = _idParent;
                this[WEBBASE][INDEX].set(obj._id, obj);
                if (obj.children)
                    for (let i = 0; i < obj.children.length; ++i) {
                        let typedChild;
                        if (obj.children[i].type === 'Area')
                            typedChild = new Area();
                        else if (obj.children[i].type === 'Page')
                            typedChild = new Page();
                        else if (obj.children[i].type === 'Group')
                            typedChild = new Group();
                        else
                            typedChild = new Content();

                        if (typedChild)
                            obj.children[i] = Object.assign(typedChild, obj.children[i]);

                        createIndex(obj.children[i], obj._id);
                        obj.children[i][WEBBASE] = this[WEBBASE];
                    }
            }
            createIndex(this[WEBBASE]);

        } else
            this[WEBBASE]
                .add(new Page({ name: 'Home' }))
                .add(new Text({ name: 'Hello World', layout: 'Hello World from Spin The Web&trade;!' }));
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

    // Return langs RFC 3282 as a language array sorted by preference
    acceptLanguage(langs) {
        const pattern = /([a-z][a-z](-[a-z][a-z])?|\*)(;q=([01](\.[0-9]+)?))?/gi;
        let match, accept = '';
        while (match = pattern.exec(langs)) {
            pattern.lastIndex += (match.index === pattern.lastIndex);
            accept += (accept !== '' ? ',' : '[') + `{"l":"${match[1]}","q":${match[4] || 1}}`;
        }
        return JSON.parse(accept + ']').sort((a, b) => a.q < b.q).map(a => a.l);
    }

    // Pick the preferred localized text, if pick is true return the picked locale
    localize(langs, txts, pick) {
        let _langs = Object.keys(txts);
        switch (_langs.length) {
            case 0:
                return null;
            case 1:
                return pick ? _langs[0] : txts[_langs[0]];
            default:
                for (let lang of langs)
                    if (txts[lang])
                        return pick ? lang : txts[lang];
                return pick ? langs[0] : txts[langs[0]];
        }
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
            node = node.children.find(child => (child.slug[lang] || child.slug[0]) === slugs.shift());
            if (!node || !slugs.length) {
                let clone = { ...node };
                delete clone.children;
                return clone;
            }
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
            if (['Webbase', 'Area'].indexOf(element.constructor.name) !== -1 && element.children.length > 0)
                element.children.forEach(child => _url(child));
            else if (element.constructor.name === 'Page' && element.granted(req.user) & 0b01 === 0b01)
                fragment += `<url><loc>${element.webbase.name(undefined, lang)}${element.slugSlug(true)}</loc><changefreq>always</changefreq><priority>0.5</priority></url>`;
        }
    }
}
