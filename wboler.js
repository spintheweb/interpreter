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
    let wboler, options;

    wboler = new stw.Group('wboler')
        .private(true)
        .grant('developers', true)
        .section('sidebar');

    options = '<select>';
    for (let user in webbase.users)
        options += `<option>${user}</option>`;
    options += '</select>';
    wboler.add(new stw.Tabs('Structure', `\\s('caption="Wboler" header="<i class='fas fa-fw fa-eye'></i> ${options}"')`)
        .sequence(1)
        .add(new stw.Tree('Webbase'))
        .add(new stw.Text('Datasources', 'Datasources'))
        .add(new stw.Text('Files', 'Files'))
        .add(new stw.Text('Security', 'Security'))
    );
    wboler.add(new stw.Tabs('Properties', `\\s('caption="Properties" visible="@id"')`)
        .sequence(2.1)
        .add(new stw.Form('General', `\\s('visible="@type=='Content"')
            h('id;@id')
            l('Name')e(';name')\\n
            l('Position')e(';section')\\a('style="width:calc(100% - 5em)"')t('&emsp;')e(';sequence')\\a('style="width:4em"')\\n
            l('Datasource')d('datasource;;webbase;')\\n
            l('Query')m('query')\\n
            l('Parameters')e(';params')\\n
            l('Layout')m('template')\\n
            b('/wboler')p('id;@id')t('Save')`
        ).datasource('webbase', socket => {
            if (socket.data) {
                let el = webbase.getElementById(socket.data.searchParams.id);
                if (el instanceof stw.Content)
                    return [{
                        type: el.constructor.name,
                        id: el.id,
                        name: el.name(),
                        section: el.section(),
                        sequence: el.sequence(),
                        datasource: el.datasource(),
                        query: el.query(),
                        params: el.params(),
                        template: el.template(socket.target.lang)
                    }];
            }
        }).serverHandler((data, socket) => {
            let el = webbase.getElementById(data.id);
            el.name(data.name, socket.target.lang);
            el.section(data.section, data.sequence);
            el.datasource(data.datasource);
            el.query(data.query);
            el.params(data.params);
            el.template(socket.target.lang, data.template);
        })
        ).add(new stw.List('Visibility'))
        .add(new stw.Form('Code behind',
            `m('serverHandler')\\a('style="width:100%; height:100%"')\\n
            b('/wboler')p('id;@id')t('Save')`
        ).datasource('webbase', socket => {
            let el = webbase.getElementById(socket.data.searchParams.id);
            return [{
                type: el.constructor.name,
                id: el.id,
                serverHandler: typeof el.serverHandler === 'function' ? el.serverHandler() : null
            }];

        }).serverHandler((data, socket) => {
            let el = webbase.getElementById(data.id);
            el.template(socket.target.lang, data.template);
        }))
    );

    webbase.add(wboler);
};
