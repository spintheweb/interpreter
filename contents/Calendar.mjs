/*!
 * calendar
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
import WEBBASE from '../elements/Webbase.mjs';
import Content from '../elements/Content.mjs';

export default class Calendar extends Content {
	constructor(name, template, lang) {
		super(name, template, lang, true);
	}

	Render(socket) {
		return super.Render(socket, socket => {
			let fragment = '';

			let today = new Date(), date = new Date();

			// TODO: Start on the proper day and localized
			fragment += `<li class="stwMonth">${new Intl.DateTimeFormat(this[WEBBASE].Lang(), { month: 'long', year: 'numeric' }).format(date)}</li><br>`;

			date = new Date(date.setDate(1));
			date = new Date(date.setDate(1 - date.getDay())); // First day alignment monthly view
			let weekday = new Date(date);
			for (let d = 0; d < 7; ++d, weekday.setDate(weekday.getDate() + 1)) {
				fragment += `<li class="stwWeekday"><div>${new Intl.DateTimeFormat(this[WEBBASE].Lang(), { weekday: 'short' }).format(weekday)}</div></li>`;
			}
			fragment += '<br>';

			for (let d = 0; d < 42; ++d) {
				let cssDay = date.toDateString() === today.toDateString() ? 'stwToday' : '';

				fragment += `<li class="stwDay ${cssDay}" data-ref="${new Date(date.setHours(0, 0, 0, 0)).toISOString().substr(0, 10)}"><div>${date.getDate()}</div></li>${date.getDay() !== 6 ? '' : '<br>'}`;

				let newDate = date.setDate(date.getDate() + 1);
				date = new Date(newDate);
			}

			return `<ul class="stwBody">${fragment}</ul>`;
		});
	}
}