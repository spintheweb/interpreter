/*!
 * webbase
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

/// Create default webbase programmatically
// Note: shared contents are contents children of Chapters
module.exports = (webspinner, name) => {
	let book, chapter, page, mainmenu;

	book = new webspinner.Book(name);
	book.add(mainmenu = new webspinner.Menu('Main menu')
		.grant('guests', webspinner.wbolAC.read)
		.section('header')); // Shared content
	book.add(new webspinner.Text('Copyright', `<span>&copy; ${new Date().getFullYear()} Giancarlo Trevisan</span><span style="float:right">Spin the Web&trade;</span>`)
		.grant('guests', webspinner.wbolAC.read)
		.section('footer')
		.cssClass('wbolText')); // Shared content
	
	book.add(new webspinner.Breadcrumbs()
			.grant('guests', webspinner.wbolAC.read)
			.sequence(1).section('main'));
	chapter = new webspinner.Chapter('Private');
	book.add(chapter);
	page = new webspinner.Page('Home');
	book.mainpage(page);
	page.add(new webspinner.Form('A("http://www.domain.com").p().p("param1", "uno&s").p("#prot").f(); nl(); t("pippo", {style: "color: red"}); nl(); t("pluto", {style: "color: green"}); e();').sequence(2).section('main'))
		.add(new webspinner.Keypad().sequence(3).section('main')) // Alphabet keys
		// .add(new webspinner.Breadcrumbs()
		// 	.sequence(1).section('main'))
		.add(new webspinner.Tabs('Tabs')
			.sequence(5).section('main')
			.add(new webspinner.Chart('Pie'))
			.add(new webspinner.Calendar('Calendar'))
			.add(new webspinner.Text('Tab 2', 'This is Tab 2')
				.grant('guests', webspinner.wbolAC.none))
			.add(new webspinner.Keypad('Keypad', '123\n456\n789\n*0#'))
			);
	book.add(page)
		.add(new webspinner.Page('About us'))
		.add(new webspinner.Page('Products').grant('guests', webspinner.wbolAC.read)
			.add(new webspinner.Tree('Webbase', 'webbase')
				.section('sidebar').sequence(2))
			.add(new webspinner.Text('Override shared', 'This content overrides the shared footer')
				.section('footer').sequence(1)))
		.add(new webspinner.Page('Profile')
			.grant('guests', webspinner.wbolAC.none))
		.add(new webspinner.Page('Contact us')
			.grant('guests', webspinner.wbolAC.read)
			.add(new webspinner.Script('Code', 'alert("Welcome from webspinner!");'))
		);
	mainmenu.add(new webspinner.Text('Option', '<img src="/media/logo-bw_64x64.png" alt="Logo webspinner">'));
	mainmenu.add(book);
//	mainmenu.add(new webspinner.Calendar());
	
	return book;
};
