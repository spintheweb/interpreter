/*!
 * contents
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import { WEBBASE } from './Miscellanea.mjs';
import Base from './Base.mjs';
import Area from './Area.mjs';
import Page from './Page.mjs';
import Link from './Link.mjs';

import Breadcrumbs from '../stwContents/Breadcrumbs.mjs';
import Languages from '../stwContents/Languages.mjs';
import Text from '../stwContents/Text.mjs';
import Menu from '../stwContents/Menu.mjs';
import Tabs from '../stwContents/Tabs.mjs';
import Group from '../stwContents/Group.mjs';
import List from '../stwContents/List.mjs';
import Table from '../stwContents/Table.mjs';
import Tree from '../stwContents/Tree.mjs';
import Form from '../stwContents/Form.mjs';

const contents = {
    Text: Text, // Default content
    Breadcrumbs: Breadcrumbs,
    Languages: Languages,
    Menu: Menu,
    Tabs: Tabs,
    Group: Group,
    List: List,
    Table: Table,
    Tree: Tree,
    Form: Form
}

export function createElement(parent, element) {
    element._idParent = parent._id;

    switch (element.type) {
        case 'Area':
            return new Area(element);
        case 'Page':
            return new Page(element);
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

