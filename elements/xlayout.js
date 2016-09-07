var doc = document, wb_sessionLang = navigator.userLanguage, wb_sessionLogin = webbase.security.users['guest'];

// TODO: Fill DOM asynchronously by inserting place holders, that will be filled when the functions completes

// Render a whole page or a single content, if url is null render the homepage
function render(url) {
	var stopwatch = new Date();
/*
	// Load xml webbase
	var client = new XMLHttpRequest();
	client.open('GET', '/data/webbase.xml');
	client.onreadystatechange = function() {
		alert(client.responseText);
	}
	client.send();
*/
	// Index pages and contents { [id|pageurl]: obj }, ex. { "/en/area-a/page-title": page }
	webbase.dns = {};
	webbase.languages.forEach(function(lang) {
		function localize(lang, obj, fallback) {
			if (obj)
				return obj[lang] || obj[webbase.languages[0]] || fallback;
			return fallback;
		}
		(function _indexWebbase(parent, url) {
			for (var child in parent.children) {
				child = parent.children[child];
				child.parent = parent; // Used by authorized()

				webbase.dns[child.id] = child; // Index ids
				if (child.id === webbase.homepage)
					webbase.dns['/' + lang] = child; // Index home without page name, fallback
				else if (child.type === 'page')
					webbase.dns[url + '/' + localize(lang, child.title, child.id).replace(/[^ a-zA-Z0-9]/g, '').replace(/ /g, '-')] = child;
				_indexWebbase(child, url + '/' + localize(lang, child.title, child.id).replace(/[^ a-zA-Z0-9]/g, '').replace(/ /g, '-'));
			}
		})(webbase, '/' + lang);
	});

	var res = webbase.dns[url] || webbase.dns[webbase.homepage]; // TODO: If page not found show homepage, how do we know if a content was requested?
	// TODO: If requested res is a page then load page template

	function authorized(res, user) {
		if (res === webbase.dns['/' + webbase.languages[0]]) // Home page always visible
			return true;
		return (function _authorized(res, user) {
			if (res) {
				var flag = (res.type === 'content');
				for (var group in user.memberof) {
					if (res.authorizations && res.authorizations[user.memberof[group]])
						flag |= res.authorizations[user.memberof[group]];
					else
						flag |= _authorized(res.parent, user);
					if (flag)
						return true;
				}
			}
			return flag;
		})(res, user);
	}

	// TODO: look for elements with data-wb attribute
	if (authorized(res, wb_sessionLogin)) {
		switch (res.type) {
			case 'page':
				// TODO: Authorized?
				for (var child in res.children) {
					var content = res.children[child];
					// TODO: Skip subchildren
					var e = doc.getElementById(content.location);
					if (e) {
						if (e.dataset.wb)
							e.appendChild(doc.createTextNode(e.dataset.wb));
						else
							e.appendChild(renderContent(content));
					}
				}
				break;
			case 'content':
				var e = doc.getElementById(res.location);
				if (e) e.appendChild(renderContent(res));
			case 'shortcut':
				break;
		}
	}

	doc.getElementsByTagName('body')[0].appendChild(doc.createTextNode('Rendering time: ' + (new Date() - stopwatch) + 'ms'));
}

function renderContent(content) {
	// TODO: The layout should be scanned once before being applyed
	// TODO: Authorized?

	var e = doc.createElement('article');
	e.setAttribute('id', content.id);
	e.setAttribute('class', content.cssclass || 'wb_' + (content.renderAs || 'text'));
	new interpretLayout(null, content, e);
	return e;
}

var interpretLayout = function(ctx, content, parent) {
	// Helpers
	function setAttributes(e, attrs) {
		for (var name in attrs)
			if (!e.hasOwnProperty(name)) {
				if (attrs[name] === '' || attrs[name]) {
					if (typeof attrs[name] !== 'function')
						e.setAttribute(name, evaluateIt('/', attrs[name]));
					else {
						; // TODO: add function to <script></script>
					}
				} else
					e.removeAttribute(name);
			}
	}
	function evaluateIt(name, value) {
		if ((!name || !value) && ctx.data[ctx.row] && ctx.col < Object.keys(ctx.data[ctx.row]).length)
			return ctx.data[ctx.row][Object.keys(ctx.data[ctx.row])[ctx.col++]] || value || '';
		if (typeof value === 'string' && value.charAt(0) === '@') {
			if (value.charAt(1) === '@') // TODO: sessionVariable, serverVariable
				return ctx.data[ctx.row][value.substr(2, value.length)] || value;
			return getQueryString(value.substr(1, value.length)) || getCookie(value.substr(1, value.length)) || value;
		}
		return value || '';
	}
	function nameIt(name) {
		if (!name && ctx.data[ctx.row] && ctx.col < Object.keys(ctx.data[ctx.row]).length)
			return Object.keys(ctx.data[ctx.row])[ctx.col];
		return name || content.id + '_F' + ctx.fld; // TODO: fld NAN
	}
	function formatIt(value, style) {
		return value;
	}
	function getCookie(name) {
		name += '=';
		var ca = doc.cookie.split(';');
		for (var i=0; i<ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) === ' ') c = c.substring(1);
				if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
		}
		return '';
	 }
	function getQueryString(name, href) {
		var pattern = new RegExp("[?&]" + name + "=([^&]*)?");
		if (!href)
			href = window.location;
		if (pattern.test(href))
			return pattern.exec(href)[1];
		return '';
	}
	function getData() {
		// TODO: dsn, query, params
		return content.query || [];
	}
	function parse(txt) {
		// TODO: incomplete, brute force better than regexp?
		txt = txt.replace(/(\w+\s*|\W\s*)?(\[.*?\])(\s*\w+|\s*\W)?/g, function (match, p1, p2, p3, offset, s) {
				var mode = 0;
				match.replace(/(\/?@@?\*?[_a-z][a-z0-9_.$]*)/ig, function (match, p1, offset, s) {
						if (p1.charAt(0) === '/') {
							mode = 1;
							return p1.substr(1);
						}
						var value = evaluateIt('/', p1);
						if (value) mode = 2;
						return value;
				});
				if (mode === 1) return match;
				if (mode === 2) return p1 + p2.substr(1, p2.length - 2) + p3; // Remove []
				if (p3) return p1 || '';
				return '';
		});
		return txt.replace(/(\/?@@?\*?[_a-z][a-z0-9_.$]*)/ig, function (match, p1, offset, s) {
				if (p1.charAt(0) === '/') return p1.substr(1);
				if (p1.charAt(1) === '@') return remotes[p1.substr(2)] || '';
				return locals[p1.substr(1)] || '';
		});
	}
	function browse() {
		// TODO: browse data
		if (content.settings.rows < ctx.data.length) {
			var e = doc.createElement('nav');
			e.className = 'wb_browse';
			e.innerHTML = 'browse data';
			parent.appendChild(e);
		}
	}

	// Symbols
	function _a(e) {
		return {
			p: function (name, value) {
				_p(nameIt(name), evaluateIt(name, value), e, 'href');
				return _a(e);
			},
			t: function (txt, attrs) {
				e.replaceChild(_t(txt, attrs), e.firstChild);
			},
			i: function (src, alt, attrs) {
				e.replaceChild(_i(src, alt, attrs, true), e.firstChild);
			},
			I: function (src, alt, attrs) {
				e.replaceChild(_i(src, alt, attrs, false), e.firstChild);
			},
			f: function (format, value, attrs) {
				e.replaceChild(_t(formatIt(evaluateIt('/', value), format), attrs), e.firstChild);
			}
		}
	}
	function _b(e) {
		return {
			p: function (name, value) {
				_p(nameIt(name), evaluateIt(name, value), e, 'formaction');
				return _b(e);
			}
		}
	}
	function _i(src, alt, attrs, force) {
		if (!attrs) attrs = {};
		attrs['src'] = force ? evaluateIt('/', src) : evaluateIt(null, src);

		if (attrs['src']) {
			attrs['alt'] = alt;
			var e = document.createElement('img');
			setAttributes(e, attrs);
			return e;
		}
	}
	function _p(name, value, e, attr) {
		var href = e.getAttribute(attr), pattern = new RegExp("[?&]" + name + "=([^&]*)?");
		if (pattern.test(href))
			href = href.replace(pattern, function(match, p1, offset, s) {
				return value ? match.replace(p1, encodeURIComponent(value)) : href;
			});
		else if (value !== '')
			href += (~href.indexOf('?') ? '&' : '?') + name + '=' + encodeURIComponent(value);
		e.setAttribute(attr, href);
	}
	function _t(txt, attrs) {
		var e = doc.createTextNode(txt);
		if (attrs) {
			e = doc.createElement('span');
			setAttributes(e, attrs);
			e.innerHTML = txt;
		}
		return e;
	};
	function _xy(name, value, attrs) {
		// TODO
	}

	if (!ctx) {
		ctx = this;
		ctx.row = 0;
		ctx.col = 0;
		ctx.fld = 0;
		ctx.data = getData();
		ctx.symbols = 0;
	}
	ctx.settings = function(attrs) {
		if (parent.className.indexOf('wb_body') !== -1 || !attrs)
			return; // Stop recursion

		if (!content.settings) {
			content.settings = {};
			for (var setting in attrs)
				content.settings[setting] = attrs[setting];
			// TODO: set defaults
			if ((content.settings.rows || 0) <= 0) content.settings.rows = (content.type === 'form') ? 1 : 25;
		}

		// settings should be the first function in the layout, if that is not the case parts have been added to the body, remove them
		for (var child = parent.lastChild; child; child = parent.lastChild)
			parent.removeChild(child);

		['caption', 'header', 'body', 'footer'].forEach(function(part) {
			if (!attrs[part] && part !== 'body')
				return; // Nothing to create

			var contentType = { list: content.settings.rownumber ? 'ol' : 'ul', table: 'table', form: 'table', calendar: 'table'}[content.type] || 'div';
			var e = doc.createElement({ caption: 'h1', body: contentType }[part] || part);
			e.setAttribute('class', 'wb_' + part);
			if (part === 'body') {
				ctx.row = 0;
				do {
					ctx.col = 0, ctx.fld = 0;
					var ep = doc.createElement({ ul: 'li', ol: 'li', table: 'tr', div: 'div' }[contentType]);
					ep.setAttribute('class', 'wb_bodypart');
					interpretLayout(ctx, content, ep);
					e.appendChild(ep);
				} while (++ctx.row < ctx.data.length && ctx.row < content.settings.rows);
				parent.appendChild(e);
				browse();
			} else if (typeof attrs[part] === 'function') {
				attrs[part]();
				parent.appendChild(e);
			} else {
				// TODO: Render inner content
				e.innerHTML = attrs[part];
				parent.appendChild(e);
			}
		});
		throw null; // Execute settings only once per layout
	};
	ctx.cr = function() {
		var e = doc.createElement('br');
		parent.appendChild(e);
	}
	ctx.lf = function(attrs) {
		if (~['form', 'table'].indexOf(content.renderAs))
			return cr();

		// TODO: Manage td, tr
		var e = doc.createElement('tr');
		setAttributes(e, attrs);
		parent.appendChild(e);
	};
	ctx.tab = function(attrs) {
		if (~['form', 'table'].indexOf(content.renderAs))
			return;

		// TODO: Close opened td
		var e = doc.createElement('td');
		setAttributes(e, attrs);
		parent.appendChild(e);
		parent = e;
	};
	ctx.A = function(href, attrs) {
		if (!attrs) attrs = {};
		attrs['_target'] = 'blank';
		ctx.a(href, attrs);
	};
	ctx.a = function(href, attrs) {
		var e = doc.createElement('a');
		if (!attrs) attrs = {};
		attrs['href'] = evaluateIt('/', href);
		setAttributes(e, attrs);
		e.appendChild(doc.createTextNode(attrs['href']));
		parent.appendChild(e);
		return _a(e);
	};
	ctx.b = function(href, name, img, action, attrs) {
		// TODO: Server side action, client events are cooded in attrs
		var e = doc.createElement('button');
		if (!attrs) attrs = {};
		attrs['formaction'] = href || window.location.pathname;
		setAttributes(e, attrs);
		if (img)
			e.appendChild(_i(img, name, {title: name}));
		else
			e.appendChild(_t(name));
		parent.appendChild(e);
		return _b(e);
	};
	ctx.B = function(href, name, img, action, attrs) {
		if (!attrs) attrs = {};
		attrs['autofocus'] = '';
		ctx.b(href, name, img, action, attrs);
	}
	ctx.c = function(name, value, options, attrs) {
		if (!attrs) attrs = {};
		attrs['type'] = 'checkbox';
		// TODO: key value pair, wrap grap in div?
		for (var i = 0; i < options.length; ++i) {
			attrs['checked'] = value & (1 << i) ? '' : null;
			ctx.e(null, name, 1 << i, attrs);
			ctx.l(options[i]);
			if (!name) --ctx.col;
		}
		if (!name) ++ctx.col;
	};
	ctx.C = function(name, value, options, attrs) {
		if (!attrs) attrs = {};
		attrs['required'] = '';
		ctx.c(name, value, options, attrs);
	};
	ctx.d = function(name, value, options, attrs) {
		var e = doc.createElement('select');
		if (!attrs) attrs = {};
		attrs['name'] = nameIt(name);
		setAttributes(e, attrs);
		// TODO: key value pair
		value = evaluateIt(name, value);
		for (var option in options) {
			var c = doc.createElement('option');
			c.setAttribute('value', options[option]);
			if (value === options[option])
				c.setAttribute('selected', '');
			c.appendChild(doc.createTextNode(options[option]));
			e.appendChild(c);
		}
		parent.appendChild(e);
		++ctx.fld;
	};
	ctx.D = function(name, value, options, attrs) {
		if (!attrs) attrs = {};
		attrs['required'] = '';
		conetxt.d(name, value, options, attrs);
	};
	ctx.e = function(format, name, value, attrs) {
		var e = doc.createElement('input');
		if (!attrs) attrs = {};
		attrs['name'] = nameIt(name);
		attrs['value'] = formatIt(evaluateIt(name, value), format);
		setAttributes(e, attrs);
		parent.appendChild(e);
		++ctx.fld;
	};
	ctx.E = function(format, name, value, attrs) {
		if (!attrs) attrs = {};
		attrs['required'] = '';
		ctx.e(name, value, options, attrs);
	};
	ctx.f = function(format, value, attrs) {
		parent.appendChild(_t(formatIt(evaluateIt('/', value) + ' ', format), attrs));
	};
	ctx.F = function(format, value, attrs) {
		var e = doc.createElement('div');
		e.appendChild(doc.createTextNode(formatIt(evaluateIt('/', value), format)));
		parent.appendChild(_t(e.innerHTML, attrs));
	};
	ctx.g = function(name) {
		// Goto named field, column or move < >
		var c = Object.keys(ctx.data[ctx.row]).indexOf(name);
		if (~c)
			return ctx.col = c;
		if (!isNaN(name))
			ctx.col = parseInt(name);
		else if (/^(>+|<+)/.test(name))
			ctx.col += (name.charAt(0) === '<' ? -1 : 1) * /^(>+|<+)/.exec(name)[0].length;
		if (ctx.col < 0)
			ctx.col = 0;
	};
	ctx.h = function(name, value) {
		var attrs = {type: 'hidden'};
		ctx.e(null, name, value, attrs);
	};
	ctx.i = function(src, alt, attrs) {
		parent.appendChild(_i(src, alt, attrs, true));
	};
	ctx.I = function(src, alt, attrs) {
		parent.appendChild(_i(src, alt, attrs, false));
	};
	ctx.l = function(label, attrs) {
		var e = doc.createElement('label');
		setAttributes(e, attrs);
		e.innerHTML = nameIt(label);
		parent.appendChild(e);
	};
	ctx.m = function(name, value, attrs) {
			var e = doc.createElement('textarea');
			attrs = (typeof attrs !== 'undefined') ? attrs : {};
			attrs['name'] = nameIt(name);
			e.innerHTML = evaluateIt(name, value);
			setAttributes(e, attrs);
			parent.appendChild(e);
			++ctx.fld;
	};
	ctx.M = function(name, value, options, attrs) {
		if (!attrs) attrs = {};
		attrs['required'] = '';
		ctx.m(name, value, options, attrs);
	};
	ctx.n = function(value, options, attrs) {
		// TODO: Multivalues
		value = evaluateIt('/', value);
		for (var option in options)
			if (value === options[option])
				parent.appendChild(doc.createTextNode(options[option]));
	};
	ctx.o = function(href) {
		// TODO
		renderContent(href);
	};
	ctx.p = function(name, value, days) { // Set @cookie or @@sessionVariable value
		if (typeof name === 'string' && name.charAt(0) === '@') {
			if (name.charAt(1) === '@') {
				return; // TODO: Set sessionVariable
			}
			var expires = '';
			if (days) {
				var date = new Date();
				date.setTime(date.getTime() + days * 86400000);
				expires = ';expires=' + date.toGMTString();
			}
			doc.cookie = name + '=' + value + expires + ';path=/';
		}
	};
	ctx.r = function(name, value, options, attrs) {
		if (!attrs) attrs = {};
		attrs['type'] = 'radio';
		// TODO: key value pair, wrap group in div?
		for (var i = 0; i < options.length; ++i) {
			attrs['checked'] = value == options[i] ? '' : null;
			ctx.e(null, name, options[i], attrs);
			ctx.l(options[i]);
			if (!name) --ctx.col;
		}
		if (!name) ++ctx.col;
	};
	ctx.R = function(name, value, options, attrs) {
		if (!attrs) attrs = {};
		attrs['required'] = '';
		ctx.r(name, value, options, attrs);
	};
	ctx.s = function(name, value, options, attrs) {
		if (!attrs) attrs = {};
		attrs['multiple'] = '';
		ctx.d(name, value, options, attrs);
	};
	ctx.S = function(name, value, options, attrs) {
		if (!attrs) attrs = {};
		attrs['required'] = '';
		ctx.s(name, value, options, attrs);
	};
	ctx.t = function(txt, attrs) {
		parent.appendChild(_t(txt, attrs));
	};
	ctx.T = function(txt, attrs) {
		var e = doc.createElement('div');
		e.appendChild(doc.createTextNode(txt));
		parent.appendChild(_t(e.innerHTML, attrs));
	};
	ctx.u = function(name, accept, multiple, filename, attrs) {
		var e = doc.createElement('input');
		if (!attrs) attrs = {};
		attrs['type'] = 'file';
		attrs['name'] = nameIt(name);
		attrs['accept'] = accept;
		attrs['mulitple'] = multiple;
		setAttributes(e, attrs);
		parent.appendChild(e);
		++ctx.fld;
	};
	ctx.w = function(name, value, attrs) {
		var attrs = {type: 'password'};
		ctx.e(null, name, value, attrs, attrs);
	};
	ctx.W = function(name, value) {
		if (!attrs) attrs = {};
		attrs['required'] = '';
		ctx.w(name, value, attrs);
	};
	ctx.x = function(label, value, attrs) {
		// TODO
		var e = doc.createElement('span');
		setAttributes(e, attrs);
		parent.appendChild(e);
	};
	ctx.y = function(label, value, attrs) {
		// TODO
		var e = doc.createElement('span');
		setAttributes(e, attrs);
		parent.appendChild(e);
	};

	try {
		var layout = (function(obj) {
				if (obj) return obj[wb_sessionLang] || obj[webbase.languages[0]];
			})(content.layout);
		if (typeof layout === 'function')
			layout.call(ctx);
		else
			ctx.t(layout);
	} catch (ex) {
		if (ex)
			throw(ex);
	}
}
