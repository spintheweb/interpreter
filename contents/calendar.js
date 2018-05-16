/*!
 * calendar
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

module.exports = (wbol) => {
	wbol.Calendar = class Calendar extends wbol.Content {
		render(req, res) {
			return super.render(req, res, () => {
				var fragment = '';

				var today = new Date(), date = new Date();

				// TODO: Start on the proper day and localized
				fragment += `<li class="wbolMonth">${new Intl.DateTimeFormat(wbol.lang(), { month: 'long', year: 'numeric' }).format(date)}</li><br>`;

				date = new Date(date.setDate(1));
				date = new Date(date.setDate(1 - date.getDay())); // First day alignment monthly view
				var weekday = new Date(date);
				for (var d = 0; d < 7; ++d, weekday.setDate(weekday.getDate() + 1)) {
					fragment += `<li class="wbolWeekday"><div>${new Intl.DateTimeFormat(wbol.lang(), { weekday: 'short' }).format(weekday)}</div></li>`;
				}
				fragment += '<br>';
				
				for (var d = 0; d < 42; ++d) {
					var cssDay = date.toDateString() === today.toDateString() ? 'wbolToday' : '';
						
					fragment += `<li class="wbolDay ${cssDay}" data-ref="${new Date(date.setHours(0, 0, 0, 0)).toISOString().substr(0, 10)}"><div>${date.getDate()}</div></li>${date.getDay() !== 6 ? '' : '<br>'}`;
					
					var newDate = date.setDate(date.getDate() + 1);
					date = new Date(newDate);
				}
				
				return `<ul class="wbolBody">${fragment}</ul>`;
			});
		}
	};
};
