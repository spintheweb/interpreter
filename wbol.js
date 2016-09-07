/*!
 * wbol
 * Copyright(c) 2016 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const url = require('url'),
	fs = require('fs'),
	io = require('socket.io'),
	xmldom = require('xmldom').DOMParser, // Persist webbase in XML
	util = require('./util');

/*
NOTES
1. Sockets allow JIT pushes, a page request pushes contents in a particular page
2. Asynchronicity is necessary only during file and data retrival, all other wbol task are CPU dependent.
3. Individual contents may be rendered in parallel.
4. Regarding multilingual objects, there is no need to consider language preferences if there is only a language available
5. Socket namespace ide?
6. Session management?
*/
module.exports = (wbol => {
	wbol.webbase = {};
	
	// WBOL elements
	['wbolCore', 'Chapter', 'Document', 'Page', 'Content', 'Reference']
		.forEach(element => { require(`./elements/${element}.js`)(wbol); });

	// WBOL contents
	fs.readdirSync('./contents')
		.forEach(content => { require(`./contents/${content}`)(wbol); });

	// Roled Based Access Control permissions
	wbol.wbolAC = {
		none: 0,
		read: 1,
		write: 2,
		execute: 3
	};
	
	class Webbase {
		constructor() {
			this.guid = null;
			this.id = util.newId();
			this.key = 'Encryption key';
			this.lang = 'en'; // Webbase default language
			this.roles = {
				administrators: {
					enabled: true
				}, // Everything
				developers: {
					enabled: true
				}, // Modify webbase
				translators: {
					enabled: false
				}, // Modify texts in webbase
				guests: {
					enabled: true
				}, // Interact webbase
				users: {
					enabled: true
				}, // Interact webbase
				webmasters: {
					enabled: false
				} // Add data
	}; // Predefined roles
			this.users = { // TODO: Hash user password
				guest: {
					name: 'Guest',
					enabled: true,
					roles: ['guests']
				},
				administrator: {
					name: 'Administrator',
					password: 'password',
					enabled: true,
					roles: ['administrators']
				}
			}; // Predefined users
			this.datasources = {
				webbase: wbol.webbase,
				json: '',
				xml: '',
				csv: ''
			}; // Predefined datasources
			this.document = {};

			this.settings = {};
			this.sockets = {};
			this.socket = { 
				lang: wbol.webbase.lang, 
				user: 'guest' 
			};

			wbol.webbase = this;
			wbol.lang = top => {
				if (top && wbol.webbase.socket.lang)
					return wbol.webbase.socket.lang[0];
				return wbol.webbase.socket.lang || wbol.webbase.lang;
			};
			wbol.user = () => {
				return wbol.webbase.socket.user || 'guest';
			};
		}
		role() {}
		user() {}
		datasource() {}
		
		// Bootstrap, load webbase in memory and open duplexed websocket channel
		listen(server) {
			server.addListener('request', (req, res) => {
				// Load webbase
				var hostname = url.parse(req.url).hostname || 'domain.com';
				if (!(wbol.webbase.document instanceof wbol.Document) || wbol.webbase.document.name() !== hostname) {
					try {
						fs.statSync(`${__dirname}/${hostname}/data/webbase.xml`);
						wbol.webbase.import();
					} catch (ex) {
						console.log(`Create webbase for ${hostname}...`);
						
						wbol.webbase.lang = (util.acceptLanguage(req.headers['accept-language'] + ',en;q=0.1'))[0];
						wbol.webbase.document = require('./webbase')(wbol, hostname);
						wbol.webbase.settings.static = `${__dirname}/${hostname}`;
						
						// TODO: Create directory by copying the default domain.com to ${wbol.webbase.settings.static}
//						fs.mkdirSync(`${wbol.webbase.settings.static}/data`);
//						wbol.webbase.export(`${wbol.webbase.settings.static}/data/webbase.xml`);
					}
				}
				
				wbol.webbase.render(req, res);
			});
			
			var listener = io.listen(server);
			listener.sockets.on('connection', socket => {
				wbol.webbase.sockets[socket.id] = socket;
				
				socket.user = 'guest';
				socket.lang = util.acceptLanguage(socket.handshake.headers['accept-language']);
				socket.url = null;

				// Authentication
				socket.on('authenticate', data => {
					if (data.user === 'guest' || (this.users[socket.user] && this.users[socket.user].password === data.password)) {
						socket.user = data.user;
						return true;
					}
					socket.user = 'guest';
					return false;
				});
				socket.on('disconnect', () => {
					delete wbol.webbase.sockets[socket.id];
				});
				
				// Rendering
				socket.on('content', URL => {
					if (typeof URL !== 'object') 
						URL = url.parse(URL);
					
					wbol.webbase.socket = socket;
					socket.url = URL;

					// Server restarted, emit page reload
					if (this.document.constructor.name === 'Object') {
						socket.emit('reload', { url: URL });
						return;
					}

					var element = this.route(URL.pathname), emitted = [];
					if (element instanceof wbol.Page) {
						socket.emit('page', { id: element.id, lang: wbol.lang(), name: element.name() });
						for (var content of element.children)
							_emit(content, true);
							
						_recurse(element.parent); // Walk up the webbase and show "shared" contents, shared contents are children of areas and are shared by the underlying pages.
						
						socket.emit('wrapup', { emitted: emitted });
					} else if (element instanceof wbol.Content)
						_emit(element, false);

					// TODO: Render syblings if requested, syblings are contents in the same section and with the same integer sequence (see rendering paradigm)
					function _emit(content, syblings) {
						// Avoid re-emitting the content if a content with the same section and integer sequence has already been emitted in the current request
						if (emitted.indexOf(content.section() + Math.floor(content.sequence())) !== -1)
							return false;
						
						// Render content
						var fragment = content.render(null, socket);
						if (fragment !== '') {
							emitted.push(content.section().toString() + Math.floor(content.sequence()));
						
							socket.emit(content instanceof wbol.Script ? 'script' : 'content', {
								id: content.id,
								section: content.section(),
								sequence: content.sequence(),
								cssClass: content.cssClass(),
								body: fragment
							});
							if (typeof content.manage === 'function') {
								socket.emit('script', {
									id: `manage${content.constructor.name}`,
									body: `(${content.manage.toString()})('${content.id}');`
								});
							}
						}
						return fragment !== '';
					}
					function _recurse(element) {
						for (var content of element.children)
							if (content instanceof wbol.Content)
								_emit(content, true);
						if (element.parent)
							_recurse(element.parent, true);
					}
				});
			});
		}

		// Determine the requested webbase element given the url
		route(pathname) {
			if (!pathname || pathname === '/') return this.document.mainpage();
			var levels = pathname.split('/');
			var _route = (element, level) => {
				for (let child of element.children)
					if (child.slug() === levels[level]) {
						if (++level !== levels.length) return _route(child, level);
						return child;
					}
				return levels[level] === '' ? null : element.mainpage() || this.document.mainpage();
			};
			return _route(this.document, 1);
		}
		render(req, res) {
			if (req.method === 'GET') {
				var path = url.parse(req.url).pathname;
				
				switch (path) {
					case '/sitemap.xml':
						res.writeHead(200, { 'Content-Type': 'text/xml' }); // OK
						res.end(this.sitemap());
						return;
					case '/persist.xml':
						res.writeHead(200, { 'Content-Type': 'text/xml' }); // OK
						res.end(this.persist());
						return;
				}

				fs.readFile(`${this.settings.static}${path}`, (err, data) => {
					if (err) { // If the request is not a file than it must be a webbase element, if not return the mainpage
						var element = this.route(path);
						if (element && element.granted())
							element.render(req, res);
					} else {
						res.writeHead(200);
						res.end(data);
					}
				});
			} else {
				res.writeHead(405); // Method Not Allowed
				res.end();
			}
		}

		// Build a site map (see sitemaps.org) that includes the urls of the visible pages in the webbase.document 
		sitemap() {
			var fragment = '';
			_url(wbol.webbase.document);
			return `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${fragment}</urlset>`;

			function _url(element) {
				if (element instanceof wbol.Chapter && element.children.length > 0)
					element.children.forEach(child => _url(child));
				else if (element instanceof wbol.Page && !(element instanceof wbol.Content) && element.granted())
					fragment += `<url><loc>${wbol.webbase.document.protocol()}://${wbol.webbase.document.name()}${element.slug(true)}</loc><lastmod>${element.lastmod}</lastmod><priority>0.5</priority></url>\n`;
			}
		}
		
		// XML persistancy
		persist(element) {
			var fragment;
			
			fragment = '<?xml version="1.0" encoding="utf-8"?>\n';
			fragment += '<wbol version="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://spintheweb.org" xsi:schemaLocation="https://spintheweb.org/schemas wbol.xsd">\n';
			fragment += `<!--Spin the Web (TM) Webbase. Generated ${(new Date()).toISOString()}-->\n`;

    		fragment += `<webbase id="W${this.id}" language="${this.lang}" guid="${this.guid}" key="${this.key}">\n`;
    		
			fragment += '<security>\n';
			fragment += '<roles>\n';
			for (var role in this.roles)
				fragment += `<role name="${role}" enabled="${this.roles[role].enabled}" description="${this.roles[role].description}"/>\n`;
			fragment += '</roles>\n';
			fragment += '<users>\n';
			for (var user in this.users)
				fragment += `<user name="${user}" password="${this.users[user].password}" enabled="${this.users[user].enabled}" description="${this.users[user].description}" roles="${this.users[user].roles}"/>\n`;
			fragment += '</users>\n';
			fragment += '</security>\n';

			fragment += '<datasources>\n';
			for (var datasource in this.datasources)
				fragment += `<datasource name="${datasource}"><![CDATA[${this.datasources[datasource]}]]></datasource>\n`;
			fragment += '</datasources>\n';

			(element || wbol.webbase.document).children.forEach(child => fragment += child.persist());
			
			fragment += '</webbase>\n';
			fragment += '</wbol>';
			
			return fragment;
		}
		import (pathname) {}
	}
	return new Webbase();
})({});
