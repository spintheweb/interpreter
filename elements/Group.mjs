/*!
 * Group
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
import Base from './Base.mjs';
import Content from './Content.mjs';

export default class Group extends Base {
    constructor(name, lang) {
        super(name, lang);
		this.cssClass = 'stwGroup';
        this.section = '';
        this.sequence = 1;
    }

    CSSClass(value) {
		if (typeof value === 'undefined')
			return `class="${this.cssClass}"`;
		this.cssClass = value.toString();
		if (typeof this.webbase.changed === 'function')
			this.webbase.changed(this);
		return this;
	}
    Section(value, sequence) {
        if (typeof value === 'undefined') return this.section;
        this.section = value.toString();
        if (sequence) this.Sequence(sequence);
        if (typeof this.webbase.changed === 'function')
            this.webbase.changed(this);
        return this;
    }
    Sequence(value) {
        if (typeof value === 'undefined') return this.sequence;
        this.sequence = isNaN(value) || value < 1 ? 1 : value;
        if (this.Parent()) // Order by section, sequence
            this.Parent().children.sort((a, b) =>
                a._section + ('0000' + a._sequence.toFixed(2)).slice(-5) > b._section + ('0000' + b._sequence.toFixed(2)).slice(-5));
        if (typeof this.webbase.changed === 'function')
            this.webbase.changed(this);
        return this;
    }
    add(child) {
        super.add(child);
        if (!(child instanceof Content))
            this.remove();
        child.Section(this.id);
        return this;
    }
    Render(socket) {
        return ' ';
    }
}
