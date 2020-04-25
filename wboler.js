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
        .private(true)
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
            `h('id;@id')
            l('Name')e(';name')\\n
            l('Position')e(';section')e(';sequence')\\n
            l('Datasource')d('datasource;;webbase')\\n
            l('Query')m('query')\\n
            l('Parameters')e(';params')\\n
            l('Layout')m('template')\\n
            b('/wboler')p('id;@id')t('Save')`
        ).datasource('webbase', socket => {
            if (socket.data) {
                let element = webbase.getElementById(socket.data.searchParams.id) || webbase;
                if (element instanceof stw.Content)
                    return [{
                        id: element.id,
                        name: element.name(),
                        section: element.section(),
                        sequence: element.sequence(),
                        datasource: element.datasource(),
                        query: element.query(),
                        params: element.params(),
                        template: element.template(socket.target.lang)
                    }];
            }
            return null;
        }).serverHandler(socket => {
            let element = webbase.getElementById(socket.data.id);
            element.name(socket.data.name, socket.target.lang);
            element.section(socket.data.section, socket.data.sequence);
            element.datasource(socket.data.datasource);
            element.query = socket.data.query;
            element.params(socket.data.params);
            element.template(socket.target.lang, socket.data.template);
        })
        )
        .add(new stw.List('<i class="fas fa-eye" title="Visibility"></i><span> Visibility</span>', `t('Visibility')`))
        .add(new stw.Form('<i class="fas fa-code" title="Code behind"></i><span> Code behind</span>', `m\\a('style="width:100%; height:100%"')`))
    );

    webbase.add(wboler);
};
