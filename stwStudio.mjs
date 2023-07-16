/*!
 * Spin the Web Studio
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import fs from 'fs';
import path from 'path';
import git from 'simple-git';
import { v1 as uuid } from 'uuid';

const ROOT_DIR = process.cwd();
const SITE_DIR = path.join(ROOT_DIR, 'public');
const STUDIO_DIR = path.join(ROOT_DIR, 'studio');

export default function stwStudio(app) {
    app.get('/studio', (req, res) => {
        res.sendFile(path.join(STUDIO_DIR, 'index.html'));
    });

    app.post('/studio/wbdl/search/:lang', (req, res) => {
        let found = [],
            pattern = new RegExp(`"\\w+?":".*?${req.body.text}.*?"`,
                (req.body.ignoreCase ? 'i' : ''));

        app.webbase.index.forEach(obj => {
            let search = {
                name: obj.name,
                keywords: obj.keywords,
                description: obj.description,
                layout: obj.layout
            };
            if (JSON.stringify(search).search(pattern) != -1)
                found.push({ _id: obj._id, name: obj.name, type: obj.type });
        });
        res.json({ children: found });
    });

    app.get('/studio/wbdl/datasources/:name?', (req, res) => {
        let datasources = [];
        for (let datasource in app.webbase.datasources)
            datasources.push({
                name: datasource,
                type: 'ds',
                description: app.webbase.datasources[datasource]
            });

        if (req.params.name)
            res.json(datasources[req.params.name]);
        else
            res.json({ children: datasources });
    });

    app.get('/studio/wbdl/visibility/:_id?', (req, res) => {
        let visibility = structuredClone(app.webbase.visibility), localVisibility;
        if (!req.params || !/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(req.params._id))
            localVisibility = app.webbase.visibility;
        else
            localVisibility = app.webbase.index.get(req.params._id).visibility;

        if (req.params._id)
            for (let group in visibility)
                if (localVisibility[group] == true)
                    visibility[group] = 'LV';
                else if (localVisibility[group] == false)
                    visibility[group] = 'LI';
                else {
                    visibility[group] = 'II';
                    for (let parent = app.webbase.index.get(app.webbase.index.get(req.params._id)._idParent); parent; parent = app.webbase.index.get(parent._idParent))
                        if (parent.visibility[group]) {
                            visibility[group] = parent.visibility[group] ? 'IV' : 'II';
                            break;
                        }
                }

        res.json(visibility);
    });

    app.get('/studio/wbdl(/*)?', (req, res) => {
        res.json(req.params[1] ? app.webbase.index.get(req.params[1]) : app.webbase);
    });

    app.post('/studio/wbdl/visibility/:_id', (req, res) => {
        try {
            if (!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(req.params._id) || !app.webbase.index.get(req.params._id))
                throw 406; // 406 Not Acceptable

            let node = app.webbase.index.get(req.params._id),
                status = req.body;

            node.visibility[status.group.replace(/[^a-zA-Z]/g, '')] = status.visibility;
            if (!status.visibility)
                delete node.visibility[status.group];

            res.json({ _id: req.params._id });

        } catch (err) {
            res.end(err);
        }
    });

    app.post('/studio/wbdl/:lang/:_id/:type?', (req, res) => {
        try {
            if (!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(req.params._id) || !app.webbase.index.get(req.params._id))
                throw 406; // 406 Not Acceptable

            let node,
                newNode = req.body;

            if (req.params.type) {
                // [NOTE] If there are slugs with the same name, only the first will be considered
                node = createNode(req.params.lang, req.params.type);
                node._idParent = req.params._id;
                app.webbase.index.get(node._idParent).children.push(node);
                app.webbase.index.set(node._id, node);
            } else
                node = app.webbase.index.get(req.body._id);

            if (newNode.status === 'T' && node.status === 'T') {
                let i = app.webbase.index.get(node._idParent).children.findIndex(child => child._id === node._id);
                app.webbase.index.get(node._idParent).children.splice(i, 1);
                app.webbase.index.clear();
                app.webbase.createIndex(app.webbase);
                node = app.webbase.index.get(newNode._idParent);

            } else
                for (let obj in newNode)
                    if (typeof node[obj] != 'undefined')
                        if (node[obj] != null && typeof node[obj] === 'object')
                            node[obj] = { [req.params.lang]: newNode[obj] };
                        else
                            node[obj] = newNode[obj];

            fs.writeFile(path.join(SITE_DIR, app.webbase.path), JSON.stringify(app.webbase), err => {
                if (err)
                    throw 503; // 503 Service Unavailable
                console.log('Saved ' + app.webbase.path);
            });
            res.json(node);

        } catch (err) {
            res.end(err);
        }
    });

    app.get('/studio/fs(/:path)?', async (req, res) => {
        res.json(await getDir(req.params.path || 'public', (await git().status()).files));
    });

    app.post('/studio/fs(/*)', (req, res) => {
        fs.writeFile(path.join(SITE_DIR, req.params[1]), req.body, err => {
            if (err)
                throw 503; // 503 Service Unavailable
            console.log(`Saved ${req.params[1]}`);
        });
        res.end();
    });

    app.get('/studio/git/status', async (req, res) => {
        let files = (await git().status()).files;
        for (let i = files.length - 1; i >= 0; --i)
            if (/^[^/]*?\.(js|json|wbdl)$/.test(files[i].path))
                files.splice(i, 1);
        res.json(files);
    });

    async function getDir(dirpath = '.', gitStatus) {
        let dir = { name: dirpath, type: 'dir', children: [] };

        const files = fs.readdirSync(dirpath);
        for (let file of files) {
            let ignore = await git().checkIgnore(path.join(dirpath, file));

            if (ignore.length === 0 && file[0] !== '.' && !(dirpath === '.' && (file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.mjs')))) {
                if (fs.lstatSync(path.join(dirpath, file)).isDirectory()) {
                    let status = gitStatus.find(element => element.path.startsWith(file + '/'));
                    dir.children.push({ name: file, type: 'dir', status: status ? '●' : '', children: (await getDir(path.join(dirpath, file), gitStatus)).children });
                } else if (fs.lstatSync(path.join(dirpath, file)).isFile()) {
                    let status = gitStatus.find(element => element.path === path.join(dirpath, file).replace(/\\/g, '/'));
                    dir.children.push({ name: file, type: 'file', status: status ? status.working_dir : '' });
                }
            }
        }
        return dir;
    }

    // [TODO] Base creation on JSON schema
    function createNode(lang = 'en', type) {
        let UUID = uuid();

        let basenode = {
            _id: UUID,
            _idParent: null,
            type: type,
            status: 'M',
            name: { [lang]: 'New ' + type },
            slug: {},
            visibility: {},
            children: []
        };

        switch (type) {
            case 'site':
                return {
                    ...basenode,
                    lang: lang,
                    visibility: {
                        guests: null,
                        users: null,
                        administrators: null,
                        translators: null,
                        developers: null,
                        webmasters: null
                    }
                };
            case 'area':
                return {
                    ...basenode,
                    icon: null,
                    mainpage: null,
                    keywords: {},
                    description: {}
                };
            case 'page':
                return {
                    ...basenode,
                    icon: null,
                    template: 'index.html',
                    visible: null,
                    keywords: {},
                    description: {}
                };
            case 'content':
                return {
                    ...basenode,
                    cssclass: null,
                    section: null,
                    sequence: 1,
                    subtype: 'text',
                    dsn: null,
                    query: null,
                    parameters: null,
                    layout: {}
                };
            case 'shortcut':
                return {};
            default:
                throw 406; // 406 Not Accepatable
        }
    }
}
