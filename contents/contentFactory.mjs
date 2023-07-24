/*!
 * contents
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import Breadcrumbs from './Breadcrumbs.mjs';
import Text from './Text.mjs';

/*
const contents = {};
fs.readdirSync(path.join(process.cwd(), 'contents')).forEach(async module => {
    if (module.endsWith('.mjs'))
        contents[module.replace('.mjs', '')] = await import('../contents/' + module);
});
*/

// Create a content from name
const contentFactory = {
    contents: {
        Text: Text, // Default content
        Breadcrumbs: Breadcrumbs
    },
    create(name, params) {
        let content = this.contents[name] || this.contents['Text'];
        return new content(params);
    }
}

export default contentFactory;