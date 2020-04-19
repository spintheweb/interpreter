/*!
 * webo
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

let stw = {};
require('../../elements')(stw);
require('../../contents')(stw);

// Create a webbase programmatically
module.exports = (webbase) => {
	let area, page, mainmenu;

	// TODO: Test
	webbase.datasource('somedata', {
		id: 12,
		name: 'webo',
		dob: new Date(),
		notes: 'This is but a test'
	});

	webbase.add(mainmenu = new stw.Menu('Main menu')
		.grant('guests', true)
		.section('header'));
	webbase.add(new stw.Text('Copyright', `<span>&copy; ${new Date().getFullYear()} Giancarlo Trevisan</span><span style="float:right">Spin the Web&trade;</span>`)
		.grant('guests', true)
		.section('footer')
		.cssClass('stwText'));
	webbase.add(new stw.Breadcrumbs()
		.grant('guests', true)
		.section('main', 1));
	area = new stw.Area('Private');
	webbase.add(area);
	page = new stw.Page('Home');
	webbase.mainpage(page);
	page.add(new stw.Form('Form', `\\s('caption="This is the caption" header="This is the header" footer="This is the footer"')l('Label')\\te(';foo;default')\\nA('http://www.domain.com')pp('param1;uno&s')p('prot')f\nt('pippo')\\a('style="color: red"')\nt('pluto')\\a('style="color: green"')e`)
		.section('main', 2))
		.add(new stw.Keypad().section('main', 3)) // Alphabet keys
		.add(new stw.Tabs('Tabs')
			.section('main', 5)
			.add(new stw.Chart('Pie'))
			.add(new stw.Calendar('Calendar'))
			.add(new stw.Text('Tab 2', 'This is Tab 2')
				.grant('guests', false))
			.add(new stw.Keypad('Keypad', '123\n456\n789\n*0#')))
		.add(new stw.Table('Table', `\\s('caption="This is the caption" header="People" footer="This is the footer"')`)
			.section('main', 6))
	webbase.add(page)
		.add(new stw.Page('About us'))
		.add(new stw.Page('Products')
			.grant('guests', true)
			.add(new stw.Text('Override shared', 'This content overrides the shared footer')
				.section('footer', 1)))
		.add(new stw.Page('Profile')
			.grant('guests', false))
		.add(new stw.Page('Contact us')
			.grant('guests', true)
			.add(new stw.Script('Code', 'alert("Welcome from webspinner!");'))
		);
	mainmenu.add(new stw.Text('Logo', '<img src="/media/logo-bw_64x64.png" alt="Logo webspinner">'));
	mainmenu.add(webbase);

	// https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
	let select = '<select>'
	for (let lang of ['en', 'it'])
		select += `<option>${lang}</option>`;
	select += '</select>';
	webbase.add(new stw.Text('Languages', `&nbsp;<i class='fas fa-fw fa-language'></i> ${select}`)
		.grant('guests', true)
		.section('header', 2)
	);
};
