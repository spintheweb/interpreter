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
7. Create sitemap, based on the webbase structure, for search engine
*/
module.exports = (wbol => {
	wbol.webbase = {}; // NOTE: Single webbase setup, convert to []?
	
	// WBOL elements
	wbol.wbolCore = class wbolCore {
		constructor(name) {
			this.id = util.newId();
			this.parent = null;
			this.children = [];
			this._name = {}; // lang: string
			this.rbac = {}; // role: wbolAC
			
			this.name(name || this.constructor.name); // NOTE: siblings may have identical names, however, the router will select the first
		}
		name(value) {
			if (typeof value === 'undefined') return util.localize(wbol.lang(), this._name);
			this._name[wbol.lang()] = value;
			return this;
		}

		// Grant a role an access control, if no access control is specified remove the role from the RBAC list.
		grant(role, ac) {
			if (wbol.webbase.roles[role]) {
				if (this.rbac[role] && !ac) delete this.rbac[role];
				else this.rbac[role] = ac;
			}
			return this;
		}
		
		// Return the highest access control associated to the given roles
		granted() {
			var roles = wbol.webbase.users[wbol.user()].roles;
			if (this instanceof wbol.Page && wbol.webbase.app.mainpage() === this) return wbol.wbolAC.read; // Main app page always visible
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
				if (child.parent) child = new wbol.Copycat(child);
				child.parent = this;
				this.children.push(child);
			}
			return this;
		}
		
		// Deep copy element, note, the app is not clonable, use export instead
		clone() {
			let obj;
			if (this instanceof wbol.Area) {
				obj = new wbol.Area();
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
				if (element instanceof wbol.App)
					return '';
				return _slug(element.parent) + '/' + element.name().replace(/\s+/g, '-').toLowerCase();
			}
		}
		
		export() {
			var fragment = `<wbol:content id="${this.id}"></wbol:content>\n`;
			return fragment;
		}
		import() {}
	};
	wbol.Area = class Area extends wbol.wbolCore {
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
	wbol.App = class App extends wbol.Area {};
	wbol.Page = class Page extends wbol.wbolCore {
		constructor(name, template) {
			super(name);
			this._contentType = 'text/html';
			this._template = template || 'index.html';
		}
		contentType(value) {
			if (typeof value === 'undefined') return this._contentType;
			this._contentType = value;
			return this;
		}
		template(value) {
			if (typeof value === 'undefined') return this._template;
			this._template = value;
			return this;
		}

		render(req, res) {
			fs.readFile(`${wbol.webbase.settings.static}/${this.template()}`, (err, data) => {
				// if (this._contentType.startsWith('text'))
				// 	// TODO: Replace data variables ${variable}
				// 	data = data.toString().replace(/\${\s*(\$?[_a-zA-Z0-9]+)\s*}/gm, (match, p1) => {
				// 		return { lang: wbol.lang(), name: this.name() }[p1] || '';
				// 	});

				if (typeof res === 'object' && res.constructor.name === 'ServerResponse') {
					if (err) {
						res.statusCode = 302; // Not found
					} else {
						res.statusCode = 200; // OK
						res.setHeader('Content-Type', this.contentType());
						res.write(data);
					}
					res.end();
				} else
					res.emit('page', { url: this.slug(), contentType: this.contentType(), body: data.toString() });
			});
		}
		export() {
			return super.export(() => {
				var fragment = `<wbol:page id="${this.id}" contentType="${this.contentType()}"></wbol:page>\n`;
				return fragment;
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
			this.manage = null; // Client side code for managing content
		}
		cssClass(value) {
			if (typeof value === 'undefined') return this._cssClass;
			this._cssClass = value;
			return this;
		}
		section(value) {
			if (typeof value === 'undefined') return this._section;
			this._section = value;
			return this;
		}
		sequence(value) {
			if (typeof value === 'undefined') return this._sequence;
			this._sequence = isNaN(value) || value < 1 ? 1 : value;
			if (this.parent) // Order by section, sequence
				this.parent.children.sort((a, b) => 
					a._section + ('0000' + a._sequence.toFixed(2)).slice(-5) > b._section + ('0000' + b._sequence.toFixed(2)).slice(-5));
			return this;
		}
		datasource(value) {
			if (typeof value === 'undefined') return this._datasource;
			this._datasource = value;
			return this;
		}
		query(value) {
			if (typeof value === 'undefined') return this._query;
			this._query = value;
			return this;
		}
		params(value) {
			if (typeof value === 'undefined') return this._params;
			this._params = value;
			return this;
		}
		template(value) {
			if (typeof value === 'undefined') return util.localize(wbol.lang(), this._template);
			this._template[wbol.lang()] = value;
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
	wbol.Copycat = class Copycat extends wbol.Content {
		constructor(related) {
			super(related.name());
			this._cssClass = related._cssClass;
			this.ref = related;
		}
		render(req, res) {
			if (this.granted())
				return this.ref.render(req, res);
		}
	}; // A clone of a wbol.Content excluding its wbolCore
	
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
			this.app = {};

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
		
		listen(server) {
			// HTTP request handler
			server.addListener('request', (req, res) => {
				// Load webbase
				var hostname = url.parse(req.url).hostname || 'domain.com';
				if (!(wbol.webbase.app instanceof wbol.App) || wbol.webbase.app.name() !== hostname) { // NOTE: mmultiple app?
					try {
						fs.statSync(`${__dirname}/${hostname}/data/webbase.xml`);
						wbol.webbase.import();
					} catch (ex) {
						console.log(`Create app ${hostname}...`);
						
						wbol.webbase.lang = (util.acceptLanguage(req.headers['accept-language'] + ',en;q=0.1'))[0];
						wbol.webbase.app = require('./app')(wbol, hostname);
						wbol.webbase.settings.static = `${__dirname}/${hostname}`;
						
						// TODO: Create app directory by copying the default domain.com to ${wbol.webbase.settings.static}
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

					// Server restarted
					if (this.app.constructor.name === 'Object') {
						socket.emit('reload', { url: URL });
						return;
					}

					var element = this.route(URL.pathname), emitted = [];
					if (element instanceof wbol.Page) {
						socket.emit('page', { lang: wbol.lang(), name: element.name() });
						for (var content of element.children)
							_emit(content, true);
							
						_recurse(element.parent); // Walk up the webbase and show "shared" contents, shared contents are children of areas and are shared by the underlying pages.
						
						socket.emit('cleanup', { emitted: emitted });
					} else if (element instanceof wbol.Content)
						_emit(element, false);

					// TODO: Render syblings if requested, syblings are contents in the same section and with the same integer sequence
					function _emit(content, syblings) {
						// Avoid re-emitting the content if a content with the same section and integer sequence has already been emitted
						if (emitted.indexOf(content.section() + Math.floor(content.sequence())) !== -1)
							return false;
						
						var fragment = content.render(null, socket);
						if (fragment !== '') 
							emitted.push(content.section().toString() + Math.floor(content.sequence()));
						
						socket.emit(content instanceof wbol.Script ? 'script' : 'content', {
							id: content.id,
							section: content.section(),
							sequence: content.sequence(),
							cssClass: content.cssClass(),
							body: fragment
						});
						if (fragment && typeof content.manage === 'function') {
							socket.emit('script', {
								id: `manage${content.constructor.name}`,
								body: `(${content.manage.toString()})('${content.id}');`
							});
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
			if (!pathname || pathname === '/') return this.app.mainpage();
			var levels = pathname.split('/');
			var _route = (element, level) => {
				for (let child of element.children)
					if (child.slug() === levels[level]) {
						if (++level !== levels.length) return _route(child, level);
						return child;
					}
				return levels[level] === '' ? null : element.mainpage() || this.app.mainpage();
			};
			return _route(this.app, 1);
		}
		render(req, res) {
			if (req.method === 'GET') {
				var path = url.parse(req.url).pathname;
				fs.readFile(`${this.settings.static}${path}`, (err, data) => {
					if (err) {
						var element = this.route(path);
						if (element && element.granted())
							element.render(req, res);
					} else {
						res.writeHead(200);
						res.write(data);
						res.end();
					}
				});
			}
		}

		export (pathname) {}
		import (pathname) {}
	}
	return new Webbase();
})({});
