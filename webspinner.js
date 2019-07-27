/*!
 * webspinner
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const url = require('url'),
	fs = require('fs'),
	io = require('socket.io'),
	crypto = require('crypto'),
	xmldom = require('xmldom').DOMParser, // Persist webbase in XML
	util = require('./util');

/*
NOTES
1. Sockets allow JIT pushes, a page request pushes contents in a particular page
2. Asynchronicity is necessary only during file and data retrival, all other webspinner task are CPU dependent.
3. Individual contents may be rendered in parallel.
4. Regarding multilingual objects, there is no need to consider language preferences if there is only a language available
5. Socket namespace ide?
6. Session management?
*/
module.exports = ((webspinner) => {
	webspinner.webbase = {};
	
	// Require WBOL elements
	['wbolCore', 'Chapter', 'Book', 'Page', 'Content', 'Reference']
		.forEach(element => { require(`./elements/${element}.js`)(webspinner); });

	// Require WBOL contents
	webspinner.wbolContentCategory = { SENSORIAL: 1, NAVIGATIONAL: 2, ORGANIZATIONAL: 3, SPECIAL: 4 };
	fs.readdirSync('./contents')
		.forEach(content => { require(`./contents/${content}`)(webspinner); });

	// Enum WBOL Roled Based Access Control permissions
	webspinner.wbolAC = { none: 0, read: 1, write: 2, execute: 3 };
	
	class Webbase {
		constructor() {
			this.guid = null;
			this.id = util.newId();
			this.cipher = crypto.createCipher('aes192', 'Type a passphrase');
			this.lang = 'en'; // Webbase default language, eg. en-US
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
			this.users = {
				guest: {
					name: 'Guest',
					enabled: true,
					roles: ['guests']
				},
				administrator: {
					name: 'Administrator',
					password: this.cipher.update('password', 'utf8', 'hex'),
					enabled: true,
					roles: ['administrators']
				}
			}; // Predefined users
			this.datasources = {
				webbase: webspinner.webbase,
				json: '',
				xml: '',
				csv: ''
			}; // Predefined datasources
			this.book = {};

			this.settings = {};
			this.sockets = {};
			this.socket = { 
				lang: webspinner.webbase.lang, 
				user: 'guest' 
			};

			webspinner.webbase = this;
			// TODO: Consider cultural translation, a language can be choosen based on the dialect
			webspinner.lang = (text) => {
				return this.lang;

//				if (main && webspinner.webbase.socket.lang)
//					return webspinner.webbase.socket.lang[0];
//				return webspinner.webbase.socket.lang[0] || webspinner.webbase.lang[0];
			};
			webspinner.user = () => {
				return webspinner.webbase.socket.user || 'guest';
			};
		}
		// NOTE: Role management is allowed only to the administrators role
		role(name, enabled) {
			if (this.users[webspinner.user()].roles.indexOf('administrators') !== -1)
				return -1;
			if (!this.roles[name])
				this.roles[name] = {};
			this.roles[name].enabled = (enabled || name === 'administrators' || name === 'guests') ? true : false;
			return 0;
		}
		// NOTE: The administrators role can change any password
		user(name, password, newpassword, enabled) {
			if (!this.users[name] && this.users[webspinner.user()].roles.indexOf('administrators') !== -1)
				this.users[name] = {};
			else if (this.users[name].password !== password && this.users[webspinner.user()].roles.indexOf('administrators') !== -1)
				return -1;
			else if (name === webspinner.user() && this.users[name].password !== password)
				return -2;
			this.users[name].password = newpassword;
			return 0;
		}
		datasource() {}
		
		// Bootstrap, load webbase in memory and open websocket channel
		listen(server) {
			server.addListener('request', (req, res) => {
				// Load webbase
				let hostname = url.parse(req.url).hostname || 'domain.com';
				if (!(webspinner.webbase.book instanceof webspinner.Book) || webspinner.webbase.book.name() !== hostname) {
					try {
						fs.statSync(`${__dirname}/${hostname}/data/webbase.xml`);
						webspinner.webbase.import();
					} catch (ex) {
						console.log(`Load webbase for ${hostname}...`);
						
						webspinner.webbase.lang = (util.acceptLanguage(req.headers['accept-language'] + ',en;q=0.1'))[0];
						webspinner.webbase.book = require('./webbase')(webspinner, hostname);
						webspinner.webbase.settings.static = `${__dirname}/${hostname}`;
						
						// TODO: Create directory by copying the default domain.com to ${webspinner.webbase.settings.static}
//						fs.mkdirSync(`${webspinner.webbase.settings.static}/data`);
//						webspinner.webbase.export(`${webspinner.webbase.settings.static}/data/webbase.xml`);
					}
				}
				
				webspinner.webbase.render(req, res);
			});
			
			let listener = io.listen(server);
			listener.sockets.on('connection', socket => {
				webspinner.webbase.sockets[socket.id] = socket;
				
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
					delete webspinner.webbase.sockets[socket.id];
				});
				
				// Rendering
				socket.on('content', URL => {
					if (typeof URL !== 'object') 
						URL = url.parse(URL);
					
					webspinner.webbase.socket = socket;
					socket.url = URL;

					// Server restarted, emit page reload
					if (this.book.constructor.name === 'Object') {
						socket.emit('reload', { url: URL });
						return;
					}

					let element = this.route(URL.pathname), emitted = [];
					if (element instanceof webspinner.Page) {
						socket.emit('page', { id: element.id, lang: webspinner.lang(), name: element.name() });
						for (let content of element.children)
							_emit(content, true);
							
						_recurse(element.parent); // Walk up the webbase and show "shared" contents, shared contents are children of areas and are shared by the underlying pages.
						
						socket.emit('wrapup', { emitted: emitted });
					} else if (element instanceof webspinner.Content)
						_emit(element, false);

					// TODO: Render syblings if requested, syblings are contents in the same section and with the same integer sequence (see rendering paradigm)
					function _emit(content, syblings) {
						// Avoid re-emitting the content if a content with the same section and integer sequence has already been emitted in the current request
						if (emitted.indexOf(content.section() + Math.floor(content.sequence())) !== -1)
							return false;
						
						// Render content
						let fragment = content.render(null, socket);
						if (fragment !== '') {
							emitted.push(content.section().toString() + Math.floor(content.sequence()));
						
							socket.emit(content instanceof webspinner.Script ? 'script' : 'content', {
								id: content.id,
								section: content.section(),
								sequence: content.sequence(),
								cssClass: content.cssClass(),
								body: fragment
							});
							if (typeof content.handler === 'function') {
								socket.emit('script', {
									id: content.constructor.name,
									body: content.handler.toString()
								});
							}
						}
						return fragment !== '';
					}
					function _recurse(element) {
						for (let content of element.children)
							if (content instanceof webspinner.Content)
								_emit(content, true);
						if (element.parent)
							_recurse(element.parent, true);
					}
				});
			});
		}

		// Determine the requested webbase element given the url
		route(pathname) {
			if (!pathname || pathname === '/') return this.book.mainpage();
			let levels = pathname.split('/');
			let _route = (element, level) => {
				for (let child of element.children)
					if (child.slug() === levels[level]) {
						if (++level !== levels.length) return _route(child, level);
						return child;
					}
				return levels[level] === '' ? null : element.mainpage() || this.book.mainpage();
			};
			return _route(this.book, 1);
		}
		render(req, res) {
			if (req.method === 'GET') {
				let path = url.parse(req.url).pathname;
				
				switch (path) {
					case '/sitemap.xml':
						res.writeHead(200, { 'Content-Type': 'text/xml' }); // OK
						res.end(this.sitemap());
						return;
					case '/webbase.xml':
						res.writeHead(200, { 'Content-Type': 'text/xml' }); // OK
						res.end(this.write());
						return;
				}

				fs.readFile(`${this.settings.static}${path}`, (err, data) => {
					if (err) { // If the request is not a file than it must be a webbase element, if not return the mainpage
						let element = this.route(path);
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

		// Build a site map (see sitemaps.org) that includes the urls of the visible pages in the book 
		sitemap() {
			let fragment = '';
			_url(webspinner.webbase.book);
			return `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${fragment}</urlset>`;

			function _url(element) {
				if (element instanceof webspinner.Chapter && element.children.length > 0)
					element.children.forEach(child => _url(child));
				else if (element instanceof webspinner.Page && !(element instanceof webspinner.Content) && element.granted())
					fragment += `<url><loc>${webspinner.webbase.book.protocol()}://${webspinner.webbase.book.name()}${element.slug(true)}</loc><lastmod>${element.lastmod}</lastmod><priority>0.5</priority></url>\n`;
			}
		}
		
		// XML persistancy
		write(element) {
			let fragment;
			
			fragment = '<?xml version="1.0" encoding="utf-8"?>\n';
			fragment += '<webspinner version="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://webspinner.org" xsi:schemaLocation="https://webspinner.org/schemas webspinner.xsd">\n';
			fragment += `<!--Spin the Web (TM) webbase generated ${(new Date()).toISOString()}-->\n`;

    		fragment += `<webbase id="W${this.id}" language="${this.lang}" guid="${this.guid}" key="${this.key}">\n`;
    		
			fragment += '<security>\n';
			fragment += '<roles>\n';
			for (let role in this.roles)
				fragment += `<role name="${role}" enabled="${this.roles[role].enabled}" description="${this.roles[role].description}"/>\n`;
			fragment += '</roles>\n';
			fragment += '<users>\n';
			for (let user in this.users)
				fragment += `<user name="${user}" password="${this.users[user].password}" enabled="${this.users[user].enabled}" description="${this.users[user].description}" roles="${this.users[user].roles}"/>\n`;
			fragment += '</users>\n';
			fragment += '</security>\n';

			fragment += '<datasources>\n';
			for (let datasource in this.datasources)
				fragment += `<datasource name="${datasource}"><![CDATA[${this.datasources[datasource]}]]></datasource>\n`;
			fragment += '</datasources>\n';

			(element || webspinner.webbase.book).children.forEach(child => fragment += child.write());
			
			fragment += '</webbase>\n';
			fragment += '</webspinner>';
			
			return fragment;
		}
		load(pathname) {}
	}

	return new Webbase();
})({});
