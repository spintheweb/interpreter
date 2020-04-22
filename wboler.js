/*!
 * wboler - webbaselet for managing webbases
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

let stw = {};
require('./elements')(stw);
require('./contents')(stw);

module.exports = webbase => {
    let wboler, select;

    wboler = new stw.Group('wboler')
        .grant('developers', true)
        .section('sidebar');

    select = '<select>';
    for (let user in webbase.users)
        select += `<option>${user}</option>`;
    select += '</select>';
    wboler.add(new stw.Tabs('Structure', `\\s('caption="Wboler" header="<i class='fas fa-fw fa-eye'></i> ${select}"')`)
        .sequence(1)
        .add(new stw.Tree('<i class="fa fa-globe" title="Webbase"></i><span> Webbase</span>'))
        .add(new stw.Text('<i class="fa fa-database" title="Datasources"></i><span> Datasources</span>', 'Datasources'))
        .add(new stw.Text('<i class="fa fa-folder" title="File system"></i><span> Files</span>', 'Files'))
        .add(new stw.Text('<i class="fa fa-shield" title="Security"></i><span> Security</span>', 'Security'))
    );
    wboler.add(new stw.Tabs('Properties', `\\s('caption="Properties" visible="@id"')`)
        .sequence(2)
        .add(new stw.Form('<i class="fa fa-cog" title="Properties"></i><span> General</span>',
            `l('Name')e(';name')\\n
            l('Position')e(';section')e(';sequence')\\n
            l('Type')d('type')\\n
            l('Datasource')d('datasource')\\n
            l('Query')m('query')\\n
            l('Parameters')e(';parametrs')\\n
            l('Layout')m('layout')\\n
            b('.;action')p('id;@id')t('Save')`
        ).serverHandler((element, socket) => {
            element.name(socket.data.name, socket.target.lang);
            element.section(socket.data.section, socket.data.sequence);
            element.parameters = socket.data.parameters;
            element.template(socket.data.template, socket.lang);
        }))
        .add(new stw.List('<i class="fas fa-eye" title="Visibility"></i><span> Visibility</span>', `t('Visibility')`))
        .add(new stw.Form('<i class="fas fa-code" title="Code behind"></i><span> Code behind</span>', `m\\a('style="width:100%; height:100%"')`))
    );

    webbase.add(wboler);
};
