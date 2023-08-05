/*!
 * Spin the Web Studio
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
*/
import express from 'express';
import fs from 'fs';
import path from 'path';
import git from 'simple-git';

import { WEBBASE, PATH, STUDIO_DIR, WEBO_DIR } from './elements/Miscellanea.mjs';
import createElement from './elements/Element.mjs';
import Base from './elements/Base.mjs';

const router = express.Router();

// Only developers are allowed to use the Spin the Web Studio API
router.all('/*', (req, res, next) => {
    if (req.session.developer)
        next();
    else
        res.redirect('/studio');
});

router.use(express.static(STUDIO_DIR));

router.get('/?', (req, res, next) => {
    res.sendFile(path.join(STUDIO_DIR, 'index.html'));
    next();
});

// Load /public static files
router.get('/public/*', (req, res) => {
    res.sendFile(path.join(WEBO_DIR, req.params[0]));
});

// Persist webbase
router.put('/wbdl/persist', (req, res, next) => {
    const webbase = JSON.stringify(Base[WEBBASE]);
    fs.writeFile(Base[WEBBASE][PATH], webbase, { flag: 'w+' }, err => {
        if (err)
            throw 503; // 503 Service Unavailable
    });
    res.sendStatus(204); // 204 No Content 
});

// Determine permalink of given element
router.get('/wbdl/permalink/:_id', (req, res) => {
    let element = Base[WEBBASE].index.get(req.params._id);
    res.send(element ? element.permalink(req.session.lang) : '');
});

// TODO: Replace
router.post('/wbdl/search/:lang', (req, res) => {
    let found = [],
        pattern = new RegExp(`"\\w+?":".*?${req.body.text}.*?"`,
            (req.body.ignoreCase ? 'i' : ''));

    Base[WEBBASE].index.forEach(obj => {
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

//#region Manage datasources
router.get('/wbdl/datasources/:name?', (req, res) => {
    let datasources = [];
    for (let datasource in Base[WEBBASE].datasources)
        datasources.push({
            name: datasource,
            type: 'ds',
            description: Base[WEBBASE].datasources[datasource]
        });

    if (req.params.name)
        res.json(datasources[req.params.name]);
    else
        res.json({ children: datasources });
});
//#endregion

//#region Manage Spin the Web content visibility
router.get('/wbdl/visibility/:_id?', (req, res) => {
    let visibility = structuredClone(Base[WEBBASE].visibility), localVisibility;
    if (!req.params || !/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(req.params._id))
        localVisibility = Base[WEBBASE].visibility;
    else
        localVisibility = Base[WEBBASE].index.get(req.params._id).visibility;

    if (req.params._id)
        for (let role in visibility)
            if (localVisibility[role] == true)
                visibility[role] = 'LV';
            else if (localVisibility[role] == false)
                visibility[role] = 'LI';
            else {
                visibility[role] = 'II';
                for (let parent = Base[WEBBASE].index.get(Base[WEBBASE].index.get(req.params._id)._idParent); parent; parent = Base[WEBBASE].index.get(parent._idParent))
                    if (parent.visibility[role]) {
                        visibility[role] = parent.visibility[role] ? 'IV' : 'II';
                        break;
                    }
            }
    res.json(visibility);
});
router.post('/wbdl/visibility/:_id', (req, res) => {
    try {
        if (!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(req.params._id) || !Base[WEBBASE].index.get(req.params._id))
            throw 406; // 406 Not Acceptable

        let node = Base[WEBBASE].index.get(req.params._id),
            status = req.body;

        status.role = status.role.replace(/[^a-zA-Z]/g, '').toLowerCase();
        node.visibility[status.role] = status.visibility;
        if (node.type !== 'Webo' && status.visibility === null)
            delete node.visibility[status.role];

        res.json({ _id: req.params._id });

    } catch (err) {
        res.end(err);
    }
});
//#endregion

//#region Manage Spin the Web elements
router.get('/wbdl(/*)?', (req, res) => {
    res.json(Base[WEBBASE].index.get(req.params[1]) || Base[WEBBASE]);
});

router.post('/wbdl/:_idParent/:type', (req, res, next) => {
    let parent = Base[WEBBASE].index.get(req.params._idParent) || Base[WEBBASE];
    let element = parent.add(createElement(parent, { type: req.params.type }));
    res.json(element);
});
router.put('/wbdl/:_idParent/:_idChild', (req, res, next) => {
    let parent = Base[WEBBASE].index.get(req.params._idParent) || Base[WEBBASE];
    let child = Base[WEBBASE].index.get(req.params._idChild);

    if (req.body === 'move') {
        child.parent.children.splice(child.parent.children.findIndex(element => element._id == req.params._idChild), 1);
        parent.children.push(child);
    } else
        child = parent.add(child.clone());
    res.json(child);
});
router.patch('/wbdl/:_id', (req, res, next) => {
    let element = Base[WEBBASE].index.get(req.params._id);
    res.json(element.patch(req.session.lang, req.body));
});
router.delete('/wbdl/:_id', (req, res, next) => {
    let element = Base[WEBBASE].index.get(req.params._id);
    if (element.status !== 'T')
        element.status = 'T'; // Trash it
    else
        element = Base.remove(element); // Move to oblivion
    res.json(element);
});
//#endregion

//#region Manage webo folder
router.get('/fs(/:path)?', async (req, res) => {
    res.json(await getDir(req.params.path || 'public', (await git().status()).files));
});
router.post('/fs/public(/*)', (req, res) => {
    fs.writeFileSync(path.join(WEBO_DIR, req.params[1]), req.body, { flag: 'w+' }, err => {
        if (err) {
            res.sendStatus(503); // 503 Service Unavailable
            return;
        }
    });
    res.sendStatus(204); // 204 No content
});
//#endregion

//#region Manage git
router.get('/git/status', async (req, res) => {
    let files = (await git().status()).files;
    for (let i = files.length - 1; i >= 0; --i)
        if (/^[^/]*?\.(js|json|wbdl)$/.test(files[i].path))
            files.splice(i, 1);
    res.json(files);
});
//#endregion

router.get('/*', (req, res) => {
    res.cookie('stwBrowseURL', req.params[0]);
    res.redirect('/studio');
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

export default router;
