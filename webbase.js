/*!
 * webbase
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

/// Create a webbase programmatically
// Note: shared contents are contents that are children of Chapters
module.exports = (webspinner, name) => {
	let webo, area, page, mainmenu;

	webo = new webspinner.Webo(name);
	webo.add(mainmenu = new webspinner.Menu('Main menu')
		.grant('guests', webspinner.stwAC.read)
		.section('header')); // Shared content
	webo.add(new webspinner.Text('Copyright', `<span>&copy; ${new Date().getFullYear()} Giancarlo Trevisan</span><span style="float:right">Spin the Web&trade;</span>`)
		.grant('guests', webspinner.stwAC.read)
		.section('footer')
		.cssClass('stwText')); // Shared content
	
	webo.add(new webspinner.Breadcrumbs()
			.grant('guests', webspinner.stwAC.read)
			.sequence(1).section('main'));
	area = new webspinner.Area('Private');
	webo.add(area);
	page = new webspinner.Page('Home');
	webo.mainpage(page);
	page.add(new webspinner.Form('Form', `\\s('caption="This is the caption" header="This is the header" footer="This is the footer"')l('Label')\\te(';foo;default')\\nA('http://www.domain.com')pp('param1;uno&s')p('prot')f\nt('pippo')\\a('style="color: red"')\nt('pluto')\\a('style="color: green"')e`).sequence(2).section('main'))
		.add(new webspinner.Keypad().sequence(3).section('main')) // Alphabet keys
//		.add(new webspinner.Breadcrumbs()
//			.sequence(1).section('main'))
		.add(new webspinner.Tabs('Tabs')
			.sequence(5).section('main')
			.add(new webspinner.Chart('Pie'))
			.add(new webspinner.Calendar('Calendar'))
			.add(new webspinner.Text('Tab 2', 'This is Tab 2')
				.grant('guests', webspinner.stwAC.none))
			.add(new webspinner.Keypad('Keypad', '123\n456\n789\n*0#')))
		.add(new webspinner.Table('Table', `\\s('caption="This is the caption" header="People" footer="This is the footer"')`)
			.sequence(6).section('main'))
	webo.add(page)
		.add(new webspinner.Page('About us'))
		.add(new webspinner.Page('Products').grant('guests', webspinner.stwAC.read)
			.add(new webspinner.Tree('Webbase', 'webbase')
				.section('sidebar').sequence(2))
			.add(new webspinner.Text('Override shared', 'This content overrides the shared footer')
				.section('footer').sequence(1)))
		.add(new webspinner.Page('Profile')
			.grant('guests', webspinner.stwAC.none))
		.add(new webspinner.Page('Contact us')
			.grant('guests', webspinner.stwAC.read)
			.add(new webspinner.Script('Code', 'alert("Welcome from webspinner!");'))
		);
	mainmenu.add(new webspinner.Text('Option', '<img src="/media/logo-bw_64x64.png" alt="Logo webspinner">'));
	mainmenu.add(webo);
//	mainmenu.add(new webspinner.Calendar());
	
	return webo;
};
