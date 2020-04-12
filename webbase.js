/*!
 * webbase
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

/// Create a webbase programmatically
// Note: shared contents are contents that are children of areas
module.exports = (webspinner, name) => {
	let webo, area, page, mainmenu;

	webo = new webspinner.Webo(name);
	webo.datasource('somedata', {
		id: 12,
		name: 'webo',
		dob: new Date(),
		notes: 'This is but a test'
	});

	webo.add(mainmenu = new webspinner.Menu('Main menu')
		.grant('guests', true)
		.position('header')); // Shared content
	webo.add(new webspinner.Text('Copyright', `<span>&copy; ${new Date().getFullYear()} Giancarlo Trevisan</span><span style="float:right">Spin the Web&trade;</span>`)
		.grant('guests', true)
		.position('footer')
		.cssClass('stwText')); // Shared content

	webo.add(new webspinner.Breadcrumbs()
		.grant('guests', true)
		.sequence(1).position('main'));
	area = new webspinner.Area('Private');
	webo.add(area);
	page = new webspinner.Page('Home');
	webo.mainpage(page);
	page.add(new webspinner.Form('Form', `\\s('caption="This is the caption" header="This is the header" footer="This is the footer"')l('Label')\\te(';foo;default')\\nA('http://www.domain.com')pp('param1;uno&s')p('prot')f\nt('pippo')\\a('style="color: red"')\nt('pluto')\\a('style="color: green"')e`).sequence(2).position('main'))
		.add(new webspinner.Tabs('Structure', `\\s('caption="Structure"')`)
			.position('sidebar').sequence(2)
			.add(new webspinner.Tree('<i class="fa fa-globe" title="Webbase"></i>'))
			.add(new webspinner.Text('<i class="fa fa-folder" title="File system"></i>', 'Files'))
			.add(new webspinner.Text('<i class="fa fa-database" title="Datasources"></i>', 'Datasources'))
		)
		.add(new webspinner.Tabs('Properties', `\\s('caption="Properties"')`)
			.position('sidebar').sequence(3)
			.add(new webspinner.Form('<i class="fa fa-cog" title="Properties"></i>', `l('Name')e\\nl('Position')e\\ne\\nl('Type')d('')\\nl('Datasource')e\\nl('Query')m\\nl('Parameters')e\\nl('Layout')m\\nb(';Save')`))
			.add(new webspinner.List('<i class="fas fa-shield-alt" title="Authorizations"></i>', `t('Authorizations')`))
		)
		.add(new webspinner.Keypad().sequence(3).position('main')) // Alphabet keys
		//		.add(new webspinner.Breadcrumbs()
		//			.sequence(1).position('main'))
		.add(new webspinner.Tabs('Tabs')
			.sequence(5).position('main')
			.add(new webspinner.Chart('Pie'))
			.add(new webspinner.Calendar('Calendar'))
			.add(new webspinner.Text('Tab 2', 'This is Tab 2')
				.grant('guests', false))
			.add(new webspinner.Keypad('Keypad', '123\n456\n789\n*0#')))
		.add(new webspinner.Table('Table', `\\s('caption="This is the caption" header="People" footer="This is the footer"')`)
			.sequence(6).position('main'))
	webo.add(page)
		.add(new webspinner.Page('About us'))
		.add(new webspinner.Page('Products').grant('guests', true)
			.add(new webspinner.Text('Override shared', 'This content overrides the shared footer')
				.position('footer').sequence(1)))
		.add(new webspinner.Page('Profile')
			.grant('guests', false))
		.add(new webspinner.Page('Contact us')
			.grant('guests', true)
			.add(new webspinner.Script('Code', 'alert("Welcome from webspinner!");'))
		);
	mainmenu.add(new webspinner.Text('Logo', '<img src="/media/logo-bw_64x64.png" alt="Logo webspinner">'));
	mainmenu.add(webo);
	mainmenu.add(page);

	return webo;
};
