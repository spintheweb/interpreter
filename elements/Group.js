/*!
 * Group
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const Base = require('./Base');
const Content = require('./Content');

module.exports = class Group extends Base {
    constructor(name, lang) {
        super(name, lang);
        this._section = '';
        this._sequence = 1;
    }

    section(value, sequence) {
		if (typeof value === 'undefined') return this._section;
		this._section = value.toString();
		if (sequence) this.sequence(sequence);
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}
	sequence(value) {
		if (typeof value === 'undefined') return this._sequence;
		this._sequence = isNaN(value) || value < 1 ? 1 : value;
		if (this.parent) // Order by section, sequence
			this.parent.children.sort((a, b) =>
				a._section + ('0000' + a._sequence.toFixed(2)).slice(-5) > b._section + ('0000' + b._sequence.toFixed(2)).slice(-5));
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}

    add(child) {
        super.add(child);
        if (!(child instanceof Content))
            this.remove();
        return this;
    }

    render(req) {
    }

    write() {
        let fragment = `<group id="${this.id}">`;
        fragment += super.write();
        fragment += '</group>';

        return fragment;
    }
}
