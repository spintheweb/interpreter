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
	wbol.wbolCore = class wbolCore {
		constructor(name) {
			this.id = util.newId();
			this.parent = null;
			this.children = [];
			this._name = {}; // lang: string
			this.rbac = {}; // role: wbolAC
			this.lastmod = (new Date()).toISOString();
			
			this.name(name || this.constructor.name); // NOTE: siblings may have identical names, however, the router will select the first
		}
		name(value) {
			if (typeof value === 'undefined') return util.localize(wbol.lang(), this._name);
			this._name[wbol.lang()] = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}

		// Grant a role an access control, if no access control is specified remove the role from the RBAC list.
		grant(role, ac) {
			if (wbol.webbase.roles[role]) {
				if (this.rbac[role] && !ac) delete this.rbac[role];
				else this.rbac[role] = ac;
				this.lastmod = (new Date()).toISOString();
			}
			return this;
		}
		
		// Return the highest access control associated to the given roles
		granted() {
			var roles = wbol.webbase.users[wbol.user()].roles;
			if (this instanceof wbol.Page && wbol.webbase.document.mainpage() === this) return wbol.wbolAC.read; // Main web page always visible
			var ac = null;
			for (let i = 0; i < roles.length; ++i) {
				let role = roles[i];
				if (this.rbac[role] === wbol.wbolAC.execute) return wbol.wbolAC.execute;
				ac = Math.max(ac, this.rbac[role]);
			}
			if (isNaN(ac) || ac === null)
				if (this.parent) 
					ac = this.parent.granted();
				else if (this instanceof wbol.Content) 
					ac = wbol.wbolAC.read; // NOTE: this is a content without a parent nor a RBAC, it's in limbo! Contents referenced by Copycats
			return ac;
		}
		
		// Add child to element, note, we are adding a child not moving it
		add(child) {
			if (child && this.children.indexOf(child) === -1) {
				if (child.parent) child = new wbol.Reference(child);
				child.parent = this;
				this.children.push(child);
				this.lastmod = (new Date()).toISOString();
			}
			return this;
		}
		
		// Deep copy element, note, the web is not clonable, use export instead
		clone() {
			let obj;
			if (this instanceof wbol.Chapter) {
				obj = new wbol.Chapter();
			} else if (this instanceof wbol.Page) {
				obj = new wbol.Page();
			} else if (this instanceof wbol.Content) {
				obj = new this.constructor();
			}
			return obj;
		}
		
		// Remove element definately
		remove() {
			this.move();
		}
		
		// Move element to 
		move(parent) {
			if (this !== parent) {
				var i = this.parent.children.indexOf(this);
				if (i !== -1) this.parent.children.splice(i, 1);
				if (parent) parent.children.push(this);
				else {
					// TODO: remove shortcuts, visit all elements in the webbase
					delete this;
				}
			}
		}
		
		// Sematic URL based on element name and language
		slug(full) {
			if (full) return _slug(this);
			return this.name().replace(/\s+/g, '-').toLowerCase(); // TODO: retain only [a-z0-9-]
			
			function _slug(element) {
				if (element instanceof wbol.Document)
					return '';
				return _slug(element.parent) + '/' + element.name().replace(/\s+/g, '-').toLowerCase();
			}
		}
	};
	wbol.Chapter = class Chapter extends wbol.wbolCore {
		constructor(name) {
			super(name);
			this._mainpage = null;
		}
		mainpage(value) {
			if (typeof value === 'undefined') return this._mainpage;
			if (value instanceof wbol.Page && !(value instanceof wbol.Content))
				this._mainpage = value;
			return this;
		}

		add(child, isMain) {
			super.add(child);
			if (child instanceof wbol.Page && !(child instanceof wbol.Content) && isMain || !this.mainpage())
				this.mainpage(child);
			return this;
		}
	};
	wbol.Document = class Document extends wbol.Chapter {
		constructor(name) {
			super(name);
			this._protocol = 'http';
		}
		protocol(value) {
			if (typeof value === 'undefined') return this._protocol;
			if (value.search(/^https?$/i) !== -1)
				this._protocol = value.toLowerCase();
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		name(value) {
			if (typeof value === 'undefined') return this._name;
			this._name = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}
	};
	wbol.Page = class Page extends wbol.wbolCore {
		constructor(name, template) { // TODO: How is the page template handled? Reloading a page breaks the socket connection! Can the connection be reestablished?
			super(name);
			this._contentType = 'text/html';
			this._template = template || 'index.html';
		}
		contentType(value) {
			if (typeof value === 'undefined') return this._contentType;
			this._contentType = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		template(value) {
			if (typeof value === 'undefined') return this._template;
			this._template = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}

		render(req, res) {
			fs.readFile(`${wbol.webbase.settings.static}/${this.template()}`, (err, data) => {
				if (typeof res === 'object' && res.constructor.name === 'ServerResponse') {
					if (err) {
						res.writeHead(302); // Not found
					} else {
						res.writeHead(200, { 'Content-Type': this.contentType() }); // OK
						res.write(data);
					}
					res.end();
				} else
					res.emit('page', { url: this.slug(), contentType: this.contentType(), body: data.toString() });
			});
		}
	};
	wbol.Content = class Content extends wbol.Page {
		constructor(name, template) {
			super(name, template || '');
			this._cssClass = 'wbolContent wbol' + this.constructor.name;
			this._section = '';
			this._sequence = 1;
			this._datasource = null;
			this._query = null;
			this._params = null;
			this.data = [];
			this._template = {};
			
			this.template(template); // NOTE: string or function
			this.manage = null; // Client side code that manages content
		}
		cssClass(value) {
			if (typeof value === 'undefined') return this._cssClass;
			this._cssClass = value.toString();
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		section(value) {
			if (typeof value === 'undefined') return this._section;
			this._section = value.toString();
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		sequence(value) {
			if (typeof value === 'undefined') return this._sequence;
			this._sequence = isNaN(value) || value < 1 ? 1 : value;
			this.lastmod = (new Date()).toISOString();
			if (this.parent) // Order by section, sequence
				this.parent.children.sort((a, b) => 
					a._section + ('0000' + a._sequence.toFixed(2)).slice(-5) > b._section + ('0000' + b._sequence.toFixed(2)).slice(-5));
			return this;
		}
		datasource(value) {
			if (typeof value === 'undefined') return this._datasource;
			this._datasource = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		query(value) {
			if (typeof value === 'undefined') return this._query;
			this._query = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		params(value) {
			if (typeof value === 'undefined') return this._params;
			this._params = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		template(value) {
			if (typeof value === 'undefined') return util.localize(wbol.lang(), this._template);
			this._template[wbol.lang()] = value;
			this.lastmod = (new Date()).toISOString();
			return this;
		}
		
		add() {} // Disallow predefined add()
		getData() {
			// TODO: Request data
			return [];
		}

		render(req, res, next) {
			var fragment = '';
			if (this.section !== '' && this.granted()) {
				this.data = this.getData(); // TODO: Retrieve data asynchronously
				fragment = next(req, res);
				if (typeof this.template() === 'function') {
					// TODO: render caption, header, fragment and footer
					fragment = '<h1>caption</h1>' + '<header>header</header>' + fragment + '<footer>footer</footer>';
				}
			}
			return fragment;
		}

		renderRow(req, res) {}
	};
	wbol.Reference = class Reference extends wbol.Content {
		constructor(related) {
			super(related.name());
			this._cssClass = related._cssClass;
			this.ref = related;
		}
		render(req, res) {
			if (this.granted())
				return this.ref.render(req, res);
		}
	}; // A pointer to a wbol.Content
	
	// WBOL layout (templating) language
	require('./layout')(wbol.Content);

	// WBOL contents
	var contents = fs.readdirSync('./contents');
	contents.forEach(filename => {
		require(`./contents/${filename}`)(wbol);
	});

	// Roled Based Access Control enums
	wbol.wbolAC = {
		none: 0,
		read: 1,
		write: 2,
		execute: 3
	};
	
	class Webbase {
		constructor() {
			this.key = 'This is a wbol key'; // Cyphering key
			this.lang = 'en'; // Webbase default language
			this.datasources = {
				webbase: wbol.webbase,
				json: '',
				xml: '',
				csv: ''
			}; // Predefined datasources
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
			this.document = {};

			this.settings = {};
			
			this.sockets = {};
			this.socket = { 
				lang: wbol.webbase.lang, 
				user: 'guest' 
			};

			wbol.webbase = this;
			wbol.lang = () => wbol.webbase.socket.lang || wbol.webbase.lang;
			wbol.user = () => wbol.webbase.socket.user || 'guest';
		}
		
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
				
				if (path === '/sitemap.xml') {
					res.writeHead(200, { 'Content-Type': 'text/xml' }); // OK
					res.end(this.sitemap().toString());
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
			return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${fragment}</urlset>`;

			function _url (element) {
				if (element instanceof wbol.Chapter && element.children.length > 0)
					element.children.forEach(child => _url(child));
				else if (element instanceof wbol.Page && !(element instanceof wbol.Content) && element.granted())
					fragment += `<url><loc>${wbol.webbase.document.protocol()}://${wbol.webbase.document.name()}${element.slug(true)}</loc><lastmod>${element.lastmod}</lastmod><priority>0.5</priority></url>\n`;
			}
		}
		
		// XML persistancy
		export () {
			var fragment = '';
			_url(wbol.webbase.document);
			return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${fragment}</urlset>`;

			function _url (element) {
				if (element instanceof wbol.Chapter && element.children.length > 0)
					element.children.forEach(child => _url(child));
				else if (element instanceof wbol.Page && !(element instanceof wbol.Content) && element.granted())
					fragment += `<url><loc>${wbol.webbase.document.protocol()}//${wbol.webbase.document.name()}${element.slug(true)}</loc><lastmod>${element.lastmod}</lastmod><priority>0.5</priority></url>\n`;
			}
		}
		import (pathname) {}
	}
	return new Webbase();
})({});
