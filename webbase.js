/*!
 * webbase
 * Copyright(c) 2016 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

// Creates default webbase programmatically
module.exports = (wbol, name) => {
	var web = {}, area, page, mainmenu;

	web = new wbol.Document(name);
	web.add(mainmenu = new wbol.Menu('Main menù')
		.grant('guests', wbol.wbolAC.read)
		.section('header')); // Shared content
	web.add(new wbol.Text('Copyright', '<span>(c) 2016 Giancarlo Trevisan</span><span style="float:right">Spin the Web&trade;</span>')
		.grant('guests', wbol.wbolAC.read)
		.section('footer')
		.cssClass('wbolText')); // Shared content
	web.add(new wbol.Breadcrumbs()
			.grant('guests', wbol.wbolAC.read)
			.sequence(1).section('main'));
	area = new wbol.Chapter('Private');
	web.add(area);
	page = new wbol.Page('Home');
	web.mainpage(page);
	page.add(new wbol.Form('Login', () => {
			l('User');
			e(null, 'user');
			b(null);
		}).sequence(2).section('main'))
		.add(new wbol.Keypad()
			.sequence(3).section('main')) // Alphabet keys
		// .add(new wbol.Breadcrumbs()
		// 	.sequence(1).section('main'))
		.add(new wbol.Tabs('Tabs')
			.sequence(5).section('main')
			.add(new wbol.Chart('Pie'))
			.add(new wbol.Calendar('Calendar'))
			.add(new wbol.Text('Tab 2', 'This is Tab 2')
				.grant('guests', wbol.wbolAC.none))
			.add(new wbol.Keypad('Keypad', '123\n456\n789\n*0#'))
			);
	web.add(page)
		.add(new wbol.Page('About us'))
		.add(new wbol.Page('Products').grant('guests', wbol.wbolAC.read)
			.add(new wbol.Tree('Webbase', 'webbase')
				.section('sidebar').sequence(2))
			.add(new wbol.Text('Override shared', 'This content overrides the shared footer')
				.section('footer').sequence(1)))
		.add(new wbol.Page('Profile')
			.grant('guests', wbol.wbolAC.none))
		.add(new wbol.Page('Contact us')
			.grant('guests', wbol.wbolAC.read)
			.add(new wbol.Script('Code', 'alert("Welcome from SpinTheWeb!");'))
		);
	mainmenu.add(new wbol.Text('Option', '<img src="/media/logo-bw_64x64.png" alt="Logo SpinTheWeb">'));
	mainmenu.add(web);
//	mainmenu.add(new wbol.Calendar());
	
	return web;
};
