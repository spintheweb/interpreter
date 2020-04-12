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
	util = require('./utilities'),
	uuid = require('uuid'),
	mime = require('mime-types');

const AES_METHOD = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16

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

	// Require STW classes
	['Base', 'Area', 'Webo', 'Page', 'Content', 'Reference']
		.forEach(element => { require(`./classes/${element}.js`)(webspinner); });

	// Require STW contents
	webspinner.stwContentCategory = { PRESENTATIONAL: 1, NAVIGATIONAL: 2, ORGANIZATIONAL: 3, SPECIAL: 4 };
	fs.readdirSync('./contents')
		.forEach(content => { require(`./contents/${content}`)(webspinner); });

	class WebSpinner {
		constructor() {
			this.id = uuid.v1();
			//this.cipher = crypto.createCipheriv(AES_METHOD, Buffer.from(ENCRYPTION_KEY), crypto.randomBytes(IV_LENGTH));

			this.lang = 'en'; // WebSpinner default language, eg. en-US
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
					password: null, //this.cipher.update('password', 'utf8', 'hex'),
					enabled: true,
					roles: ['administrators']
				}
			}; // Predefined users
			this.datasources = {
				webbase: webspinner.webbase
			}; // Predefined datasources
			this.webo = {};

			this.settings = {};
			this.sockets = {}; // Session management
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

		// Bootstrap, load webbase in memory and open websocket channel
		listen(server) {
			server.addListener('request', (req, res) => {
				// Load webbase
				let hostname = url.parse(req.url).hostname || 'public';
				if (!(webspinner.webbase.webo instanceof webspinner.Webo) || webspinner.webbase.webo.name() !== hostname) {
					try {
						fs.statSync(`${__dirname}/${hostname}/data/webbase.xml`);
						webspinner.webbase.import();
					} catch (ex) {
						console.log(`Load webbase for ${hostname}...`);

						webspinner.webbase.lang = (util.acceptLanguage(req.headers['accept-language'] + ',en;q=0.1'))[0];
						webspinner.webbase.webo = require('./webbase')(webspinner, hostname);
						webspinner.webbase.settings.static = `${__dirname}/${hostname}`;

						// TODO: Create directory by copying the default public to ${webspinner.webbase.settings.static}
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
					if (this.webo.constructor.name === 'Object') {
						socket.emit('reload', { url: URL });
						return;
					}

					let element = this.route(URL.pathname), emitted = [];
					if (element instanceof webspinner.Content) {
						if (URL.query === 'children')
							for (let content of element.children) {
								content.position(content.permalink());
								_emit(content, false);
							}
						else
							_emit(element, false);
					} else if (element instanceof webspinner.Page) {
						socket.emit('page', { id: element.id, lang: webspinner.lang(), name: element.name() });
						for (let content of element.children)
							_emit(content, true);

						_recurse(element.parent); // Walk up the webbase and show "shared" contents, shared contents are children of areas and are shared by the underlying pages.

						socket.emit('wrapup', { emitted: emitted });
					}

					// TODO: Render syblings if requested, syblings are contents in the same position and with the same integer sequence (see rendering paradigm)
					function _emit(content, syblings) {
						// Avoid re-emitting the content if a content with the same position and integer sequence has already been emitted in the current request
						if (emitted.indexOf(content.position() + Math.floor(content.sequence())) !== -1)
							return false;

						// Render content
						let fragment = content.render(socket, null);
						if (fragment !== '') {
							emitted.push(content.position().toString() + Math.floor(content.sequence()));

							socket.emit(content instanceof webspinner.Script ? 'script' : 'content', {
								id: content.permalink(), // content.id
								position: content.position(),
								sequence: content.sequence(),
								cssClass: content.cssClass(),
								children: (content.children.length > 0),
								body: fragment.toString()
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
			if (!pathname || pathname === '/') return this.webo.mainpage();
			let levels = pathname.split('/');
			let _route = (element, level) => {
				for (let child of element.children)
					if (child.slug() === levels[level]) {
						if (++level !== levels.length) return _route(child, level);
						return child;
					}
				return levels[level] === '' ? null : element.mainpage() || this.webo.mainpage();
			};
			return _route(this.webo, 1);
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
						//						else if (element instanceof webspinner.Area)
						//							element.mainpage.render(req, res);
					} else {
						res.writeHead(200, { 'content-type': mime.lookup(path) });
						res.end(data);
					}
				});
			} else {
				res.writeHead(405); // Method Not Allowed
				res.end();
			}
		}

		// Build a site map (see sitemaps.org) that includes the urls of the visible pages in the webo 
		sitemap() {
			let fragment = '';
			_url(webspinner.webbase.webo);
			return `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${fragment}</urlset>`;

			function _url(element) {
				if (element instanceof webspinner.Area && element.children.length > 0)
					element.children.forEach(child => _url(child));
				else if (element instanceof webspinner.Page && !(element instanceof webspinner.Content) && element.granted())
					fragment += `<url><loc>${webspinner.webbase.webo.protocol()}://${webspinner.webbase.webo.name()}${element.slug(true)}</loc><lastmod>${element.lastmod}</lastmod><priority>0.5</priority></url>\n`;
			}
		}

		// XML persistancy
		write(element) {
			let fragment = '<?xml version="1.0" encoding="utf-8"?>\n';
			fragment += '<webspinner version="1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://webspinner.org" xsi:schemaLocation="https://webspinner.org/schemas wbol.xsd">\n';
			fragment += `<!--Spin the Web (TM) webbase generated ${(new Date()).toISOString()}-->\n`;

			fragment += `<webbase id="W${this.id}" language="${this.lang}" key="${this.key}">\n`;

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

			(element || webspinner.webbase.webo).children.forEach(child => fragment += child.write());

			fragment += '</webbase>\n';
			fragment += '</webspinner>';

			return fragment;
		}
		load(pathname) { }
	}

	return new WebSpinner();
})({});
