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

/*
const contents = {};
fs.readdirSync(path.join(process.cwd(), 'contents')).forEach(async module => {
    if (module.endsWith('.mjs'))
        contents[module.replace('.mjs', '')] = await import('../contents/' + module);
});
*/
import Breadcrumbs from '../contents/Breadcrumbs.mjs';
import Text from '../contents/Text.mjs';

const contents = {
    Text: Text, // Default content
    Breadcrumbs: Breadcrumbs
}

export default function CreateElement(parent, element) {
    element._idParent = parent._idParent;

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