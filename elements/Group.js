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
		this._cssClass = 'stwGroup';
        this._section = '';
        this._sequence = 1;
    }

    cssClass(value) {
		if (typeof value === 'undefined')
			return `class="${this._cssClass}"`;
		this._cssClass = value.toString();
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
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
        child.section(this.id);
        return this;
    }
    render(socket) {
        return ' ';
    }

    write() {
        if (this._private)
            return '';

        let fragment = `<group id="${this.id}">`;
        fragment += super.write();
        fragment += '</group>';

        return fragment;
    }
}
