/*!
 * Webbase
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const fs = require('fs');
const url = require('url');
const path = require('path');
const Area = require('./Area');

class Webbase extends Area {
    constructor(domain = '//domain.com', lang = 'en') {
        super(domain, lang);
        this._langs = [lang];
        // this.cultures = null; // TODO: Multilingual vs Multinational concern

        this.roles = { // Predefined roles
            administrators: {
                enabled: true
            }, // Everything except development
            developers: {
                enabled: true
            }, // Manage webbase
            translators: {
                enabled: false
            }, // Modify texts in webbase
            guests: {
                enabled: true
            }, // Use public parts of webbase
            users: {
                enabled: true
            }, // Use webbase
            webmasters: {
                enabled: false
            } // Add data
        };
        this.users = { // Predefined users
            guest: {
                name: 'Guest',
                enabled: true,
                roles: ['guests', 'developers']
            },
            administrator: {
                name: 'Administrator',
                password: null, //this.cipher.update('password', 'utf8', 'hex'),
                enabled: true,
                roles: ['administrators']
            }
        };
        this.datasources = {};
    }

    lang(code) {
        if (typeof code === 'undefined')
            return this._langs[0];
        if (value.search(/^[a-z][a-z](-[a-z][a-z])?$/i) !== -1)
            this._langs[0] = code.toLowerCase();
        return this;
    }

    langs(codes) {
        if (typeof codes === 'undefined')
            return this._langs;
        if (value.search(/^[a-z][a-z](-[a-z][a-z])?$/i) !== -1 && !this.langs.includes(code))
            this._langs.push(code.toLowerCase());
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
        if (!this.roles[name])
            this.roles[name] = {};
        this.roles[name].enabled = (enabled || name === 'administrators' || name === 'guests') ? true : false;
        return 0;
    }

    // NOTE: The administrators role can change any password
    user(name, password, newpassword, enabled) {
        if (!name)
            return this.webspinner.user || 'guest';

        if (!this.users[name] && this.users[this.user()].roles.indexOf('administrators') !== -1)
            this.users[name] = {};
        else if (this.users[name].password !== password && this.users[this.user()].roles.indexOf('administrators') !== -1)
            return -1;
        else if (name === this.user() && this.users[name].password !== password)
            return -2;
        this.users[name].password = newpassword;
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
    route(pathname) {
        if (!pathname || pathname === '/')
            return this.mainpage();

        pathname = pathname.replace(/(\?.*)/, '');

        let levels = pathname.split('/');
        let _route = (element, level) => {
            for (let child of element.children)
                if (child.slug() === levels[level]) {
                    if (++level !== levels.length)
                        return _route(child, level);
                    return child;
                }
            return (levels[level] === '' || element.constructor.name !== 'Page') ? null : element.mainpage() || this.mainpage();
        };
        return _route(this, 1);
    }

    changed(element) {
        // TODO: Broadcast change
    }

    render(req) {
        if (req.method === 'GET') {
            let _path = url.parse(req.url).pathname;

            if (_path === '/webbase.xml')
                return this.write();
            else if (_path === '/sitemap.xml')
                return this.sitemap(req);
            else if (_path.search(/\.[a-z0-9]{1,4}$/i) !== -1)
                return path.join(process.mainModule.path, 'public', req.url);

            return (this.route(_path) || this._mainpage).render(req);
        }
        return null;
    }

    // Build a site map (https://www.sitemaps.org/index.html) that includes the urls of the visible pages in the webbase, if no language is specified in the url return the sitemap index
    sitemap(req) {
        let lang = url.parse(req.url).query, fragment = '';

        if (lang) {
            if (!this._langs.includes(lang))
                lang = this.lang();
            _url(this);
            return `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${fragment}</urlset>`;
        }

        for (lang of this.langs())
            fragment += `<sitemap><loc>${this.name(undefined, lang)}?${lang}</loc></sitemap>`;
        return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${fragment}</sitemapindex>`;

        function _url(element) {
            if (['Webbase', 'Area'].indexOf(element.constructor.name) !== -1 && element.children.length > 0)
                element.children.forEach(child => _url(child));
            else if (element.constructor.name === 'Page' && element.granted(req.user) & 0b01 === 0b01)
                fragment += `<url><loc>${element.webbase.name(undefined, lang)}${element.slug(true)}</loc><changefreq>always</changefreq><priority>0.5</priority></url>`;
        }
    }

    write() {
        let fragment = '<?xml version="1.0" encoding="utf-8"?>\n';
        fragment += `<webspinner version="${process.env.npm_package_version || 'debugger'}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://webspinner.org" xsi:schemaLocation="https://webspinner.org/schemas wbol.xsd">`;
        fragment += `<!--Spin the Web (TM) webbase generated ${(new Date()).toISOString()}-->`;

        fragment += `<webbase id="${this.id}" languages="${this.langs()}" key="${this.key}" homepage="${this._mainpage.id}">`;

        fragment += '<security>';
        fragment += '<roles>';
        for (let role in this.roles)
            fragment += `<role name="${role}" enabled="${this.roles[role].enabled}" description="${this.roles[role].description || ''}"/>`;
        fragment += '</roles>';
        fragment += '<users>';
        for (let user in this.users)
            fragment += `<user name="${user}" password="${this.users[user].password}" enabled="${this.users[user].enabled}" description="${this.users[user].description || ''}" roles="${this.users[user].roles}"/>`;
        fragment += '</users>';
        fragment += '</security>';

        fragment += '<datasources>';
        for (let datasource in this.datasources)
            fragment += `<datasource name="${datasource}"><![CDATA[${JSON.stringify(this.datasources[datasource])}]]></datasource>`;
        fragment += '</datasources>';

        fragment += super.write();

        fragment += '</webbase>';
        fragment += '</webspinner>';

        return fragment;
    }

    // TODO: Load XML
    // TODO: createElement()
    load(pathname) {
        //        this.add(new Page('Hello World')
        //            .add(new Text('Greating', 'Hello World from Spin the Web')));
    }
}

module.exports = (webspinner, webbase) => {
    webspinner.webbase = new Webbase();
    webspinner.webbase.webspinner = webspinner;

    require('../wboler')(webspinner.webbase); // TODO: Security concernes

    if (fs.existsSync(webbase))
        require(webbase)(webspinner.webbase);
    else
        webspinner.webbase.load(webbase);
}
