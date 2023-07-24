/*!
 * Group
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from './Miscellanea.mjs';
import Content from './Content.mjs';

export default class Group extends Content {
    constructor(params = {}) {
        super(params);
		delete this.cssClass;
        this.section = params.section || '';
        this.sequence = params.sequence || 1;
    }

    CSSClass(value) {
		if (typeof value === 'undefined')
			return `class="${this.cssClass}"`;
		this.cssClass = value.toString();
		return this;
	}
    Section(value, sequence) {
        if (typeof value === 'undefined') return this.section;
        this.section = value.toString();
        if (sequence) this.Sequence(sequence);
        return this;
    }
    Sequence(value) {
        if (typeof value === 'undefined') return this.sequence;
        this.sequence = isNaN(value) || value < 1 ? 1 : value;
        if (this.Parent()) // Order by section, sequence
            this.Parent().children.sort((a, b) =>
                a._section + ('0000' + a._sequence.toFixed(2)).slice(-5) > b._section + ('0000' + b._sequence.toFixed(2)).slice(-5));
        return this;
    }
    add(child) {
        super.add(child);
        if (!(child instanceof Content))
            this.remove();
        child.Section(this.id);
        return this;
    }
    Render(req, res, next) {
        return ' ';
    }
}
