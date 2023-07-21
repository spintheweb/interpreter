/*!
 * Spin the Web Studio
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import express from 'express';
import fs from 'fs';
import path from 'path';
import git from 'simple-git';

import { WEBBASE } from './elements/Primitives.mjs';
import Area from './elements/Area.mjs';
import Page from './elements/Page.mjs';
import Content from './elements/Content.mjs';

const ROOT_DIR = process.cwd();
const SITE_DIR = path.join(ROOT_DIR, 'public');
const STUDIO_DIR = path.join(ROOT_DIR, 'studio');

const router = express.Router();

router.get('/', (req, res, next) => {
    res.sendFile(path.join(STUDIO_DIR, 'index.html'));
    next();
});

// Load /public static files
router.get('/public/*', (req, res) => {
    res.sendFile(path.join(SITE_DIR, req.params[0]));
});

router.post('/wbdl/search/:lang', (req, res) => {
    let found = [],
        pattern = new RegExp(`"\\w+?":".*?${req.body.text}.*?"`,
            (req.body.ignoreCase ? 'i' : ''));

    req.app[WEBBASE].index.forEach(obj => {
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

router.get('/wbdl/datasources/:name?', (req, res) => {
    let datasources = [];
    for (let datasource in req.app[WEBBASE].datasources)
        datasources.push({
            name: datasource,
            type: 'ds',
            description: req.app[WEBBASE].datasources[datasource]
        });

    if (req.params.name)
        res.json(datasources[req.params.name]);
    else
        res.json({ children: datasources });
});

router.get('/wbdl/visibility/:_id?', (req, res) => {
    let visibility = structuredClone(req.app[WEBBASE].visibility), localVisibility;
    if (!req.params || !/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(req.params._id))
        localVisibility = req.app[WEBBASE].visibility;
    else
        localVisibility = req.app[WEBBASE].index.get(req.params._id).visibility;

    if (req.params._id)
        for (let group in visibility)
            if (localVisibility[group] == true)
                visibility[group] = 'LV';
            else if (localVisibility[group] == false)
                visibility[group] = 'LI';
            else {
                visibility[group] = 'II';
                for (let parent = req.app[WEBBASE].index.get(req.app[WEBBASE].index.get(req.params._id)._idParent); parent; parent = req.app[WEBBASE].index.get(parent._idParent))
                    if (parent.visibility[group]) {
                        visibility[group] = parent.visibility[group] ? 'IV' : 'II';
                        break;
                    }
            }

    res.json(visibility);
});

router.get('/wbdl(/*)?', (req, res) => {
    res.json(req.params[1] ? req.app[WEBBASE].index.get(req.params[1]) : req.app[WEBBASE]);
});

router.post('/wbdl/visibility/:_id', (req, res) => {
    try {
        if (!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(req.params._id) || !req.app[WEBBASE].index.get(req.params._id))
            throw 406; // 406 Not Acceptable

        let node = req.app[WEBBASE].index.get(req.params._id),
            status = req.body;

        node.visibility[status.group.replace(/[^a-zA-Z]/g, '')] = status.visibility;
        if (!status.visibility)
            delete node.visibility[status.group];

        res.json({ _id: req.params._id });

    } catch (err) {
        res.end(err);
    }
});

router.post('/wbdl/:lang/:_id/:type?', (req, res) => {
    try {
        if (!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(req.params._id) || !req.app[WEBBASE].index.get(req.params._id))
            throw 406; // 406 Not Acceptable

        let node,
            newNode = req.body;

        if (req.params.type) {
            // [NOTE] If there are slugs with the same name, only the first will be considered
            switch (req.params.type) {
                case 'Area': node = new Area('New area'); break;
                case 'Page': node = new Page('New page'); break;
                case 'Content': node = new Content('New content'); break;
            }
            req.app[WEBBASE].add(node);

        } else
            node = req.app[WEBBASE].index.get(req.body._id);

        if (newNode.status === 'T' && node.status === 'T') {
            let i = req.app[WEBBASE].index.get(node._idParent).children.findIndex(child => child._id === node._id);
            req.app[WEBBASE].index.get(node._idParent).children.splice(i, 1);
            req.app[WEBBASE].index.clear();
            req.app[WEBBASE].createIndex(req.app[WEBBASE]);
            node = req.app[WEBBASE].index.get(newNode._idParent);

        } else
            for (let obj in newNode)
                if (typeof node[obj] != 'undefined')
                    if (node[obj] != null && typeof node[obj] === 'object')
                        node[obj] = { [req.params.lang]: newNode[obj] };
                    else
                        node[obj] = newNode[obj];

        fs.writeFile(req.app[WEBBASE].path, JSON.stringify(req.app[WEBBASE]), err => {
            if (err)
                throw 503; // 503 Service Unavailable
        });
        console.log('Saved ' + req.app[WEBBASE].path);
        res.json(node);

    } catch (err) {
        res.end(err);
    }
});

router.get('/fs(/:path)?', async (req, res) => {
    res.json(await getDir(req.params.path || 'public', (await git().status()).files));
});

router.post('/fs/public(/*)', (req, res) => {
    fs.writeFile(path.join(SITE_DIR, req.params[1]), req.body, err => {
        if (err)
            throw 503; // 503 Service Unavailable
    });
    console.log(`Saved ${req.params[1]}`);
    res.end();
});

router.get('/git/status', async (req, res) => {
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

export default router;