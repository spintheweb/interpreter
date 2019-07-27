/*!
 * Symbols
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (content) => {
	// Helper functions
	function _name(name) { return name; }
	function _value(value, fallback) { return value || fallback; }
	function _attributes(attrs) {
		let txt = "";
		Object.keys(attrs).forEach(key => {
			txt += attrs[key] ? ` ${key}="${attrs[key]}"` : ` ${key}`;
		});
		return txt;
	}

	// Layout symbols
	content.NL = (attrs) => {};

	content.nl = (attrs) => {
		if (this.renderAs === "form")
			content.fragment += `<tr${_attributes(attrs)}>`; // Should be closed
		else
			fragment += "<br>";
	};

	content.cr = () => {
		fragment += "<br>"
	};

	content.tab = (attrs) => {
		if (this.renderAs === "table" || this.renderAs === "form")
			fragment += `<td${_attributes(attrs)}>`; // Should be closed
	};

	content.settings = (settings) => {
		content._settings = settings;
	};

	/// Anchor
	content.a = (destination, attrs, _destination) => {
		destination = _value(destination);
		if (!_destination) _destination = destination;
		attrs.href = destination;
		return {
			p: (name, value) => {
				name = _name(name);
				value = _value(value);
				if (name && name[0] === "#")
					attrs.href += name;
				else if (name)
					attrs.href += (attrs.href.indexOf("?") === -1 ? "?" : "&") + name + "=" + encodeURIComponent(value);
				return a(attrs.href, attrs, _destination);
			},
			f: (format, _attrs) => {
				fragment += "<a" + _attributes(attrs) + ">";
				f(format, _attrs);
				fragment += "</a>";
			},
			t: (txt, _attrs) => {
				fragment += "<a" + _attributes(attrs) + ">";
				t(txt || _destination, _attrs);
				fragment += "</a>";
			},
			i: (src, _attrs) => {
				fragment += "<a" + _attributes(attrs) + ">";
				i(src, _attrs);
				fragment += "</a>";
			}
		};
	};

	/// Anchor new window
	content.A = (destination, attrs = {}) => {
		attrs.target = "_blank";
		return a(destination, attrs);
	};

	/// Button
	content.b = (destination, name, img, action, attrs = {}) => {
		attrs.type = "button";
		fragment += `<input${_attributes(attrs)}>`;
	};

	/// Checkbox
	content.c = (name, value, options, attrs = {}) => {
		attrs.type = "checkbox";
		attrs.name = _name(name);
		let txt = "";
		if (!options) options = [{ value: 1, label: attrs.name }];
		options.forEach((option, i) => {
			attrs.id = `${name}${i}`;
			attrs.value = option.value;
			if (null) delete attrs.checked;
			else attrs.checked = null;
			txt += `<span><input${_attributes(attrs)}><label for="${attrs.id}">${option.label}</label></span>`;
		});
		fragment += txt;
	};

	/// Drop-down
	content.d = (name, value, options, attrs = {}) => {
		attrs.id = 0;
		attrs.name = _name(name);
		attrs.value = _value(value);
		fragment += `<select${_attributes(attrs)}>${_options()}</select>`;

		function _options() {
			let txt = "";
			switch (options.length) {
				case 1:
					options.forEach(option => {
						txt += `<option value="${option[0]}">${option[0]}</option>`;
					});
				case 2:
					options.forEach(option => {
						txt += `<option value="${option[0]}">${option[1]}</option>`;
					});
				case 3:
			}
			return txt;
		}
	};

	/// Edit box
	content.e = (format, name, value, attrs = {}) => {
		attrs.id = 0;
		attrs.name = _name(name);
		attrs.value = _value(value);
		fragment += `<input${_attributes(attrs)}>`;
	};

	/// Field value
	content.f = (format, attrs) => {
		fragment += "fufi";
	};

	/// Hidden field
	content.h = (name, value, attrs = {}) => {
		attrs.type = "hidden";
		attrs.id = 0;
		attrs.name = _name(name);
		attrs.value = _value(value);
		fragment += `<input${_attributes(attrs)}>`;
	};

	/// Image
	content.i = (src, attrs = {}) => {
		attrs.src = src;
		fragment += `<img${_attributes(attrs)}>`;
	};

	content.k = (name, value) => {
		if (value !== undefined) {}
	};

	/// Label
	content.l = (name, attrs) => {
		fragment += `<label${_attributes(attrs)}>${txt}</label>`;
	};

	/// Text area
	content.m = (name, value, attrs) => {
		fragment += `<textarea${_attributes(attrs)}>${txt}</textarea>`;
	};

	content.n = () => {};

	/// Embedded content
	content.o = (url) => {
		url = _value(url);
		return {
			p: (name, value) => {
				name = _name(name);
				value = _value(value);
				if (name && name[0] === "#")
					url += name;
				else if (name)
					url += (url.indexOf("?") === -1 ? "?" : "&") + name + "=" + encodeURIComponent(value);
				return o(url);
			},
			toString: () => {
				fragment += `<object data="${url}" type="text/html"></object>`;
			}
		};
	};

	/// Radio button
	content.r = () => {};

	content.s = () => {};
	
	/// Text
	content.t = (txt, attrs) => {
		if (attrs !== {})
			fragment += `<span${_attributes(attrs)}>${txt}</span>`;
		else
			fragment += txt;
	};

	/// HTML encoded text
	content.T = (txt) => {
		txt = txt
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
		fragment += txt;
	};

	/// Upload
	content.u = () => {};

	content.v = () => {};

	/// Password field
	content.w = (name, value, attrs = {}) => {
		attrs.type = "password";
		attrs.id = 0;
		attrs.name = _name(name);
		attrs.value = _value(value);
		fragment += `<input${_attributes(attrs)}>`;
	};

	content.x = () => {}; // Add x to array
	content.y = () => {}; // Add y to array
	content.z = () => {}; // Add z to array
};
