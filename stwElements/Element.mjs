/*!
 * contents
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from './Miscellanea.mjs';
import Base from './Base.mjs';
import Area from './Area.mjs';
import Unit from './Unit.mjs';
import Link from './Link.mjs';

/*
const contents = {};
fs.readdirSync(path.join(process.cwd(), 'contents')).forEach(async module => {
    if (module.endsWith('.mjs'))
        contents[module.replace('.mjs', '')] = await import('../stwContents/' + module);
});
*/
import Breadcrumbs from '../stwContents/Breadcrumbs.mjs';
import Languages from '../stwContents/Languages.mjs';
import Text from '../stwContents/Text.mjs';
import Menu from '../stwContents/Menu.mjs';

const contents = {
    Text: Text, // Default content
    Breadcrumbs: Breadcrumbs,
    Languages: Languages,
    Menu: Menu
}

export function createElement(parent, element) {
    element._idParent = parent._id;

    switch (element.type) {
        case 'Area':
            return new Area(element);
        case 'Unit':
            return new Unit(element);
        case 'Link':
            return new Link(element)
        case 'Content':
            let content = contents[element.subtype] || contents['Text'];
            return new content(element);
    }
    return {};
}

export function cloneElement(element) {
    if (element.constructor.name !== 'Webo')
        return new createElement(element.parent, element);
    return {};
}

export function removeElement(element) {
    let parent = element.parent;
    if (element.children)
        for (let child = element.children.pop(); child; child = element.children.pop()) {
            removeElement(child);
            Base[WEBBASE].index.delete(child._id);
        }
    parent.children.splice(parent.children.findIndex(child => child._id === element._id), 1);
    Base[WEBBASE].index.delete(element._id);
    return parent;
}

