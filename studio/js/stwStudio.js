/*!
 * stwStudio.js
 * Copyright(c) 2023 - Giancarlo Trevisan
 * MIT Licensed
 */
const stwStudio = {
    stwCopyElement: undefined,

    visibilityEnum: {
        'LV': '<i class="fas fa-fw fa-square-check" title="Local visibility"></i>',
        'LI': '<i class="fas fa-fw fa-square" title="Local invisibility"></i>',
        'IV': '<i class="far fa-fw fa-square-check" title="Inherited visibility"></i>',
        'II': '<i class="far fa-fw fa-square" title="Inherited invisibility"></i>'
    },
    setup: (settings = {}) => {
        document.getElementById('BrowseURL').value = document.location.origin;
        document.getElementById('Browse').src = document.location.origin;

        if (window.getComputedStyle(document.body).getPropertyValue('color-scheme') === 'dark')
            document.body.className = 'stwDark';
        else
            document.body.className = 'stwLight';

        ace.config.set('basePath', 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.15.0/');

        stwStudio.settings = settings;
        stwStudio.settings.lang = document.firstElementChild.getAttribute('lang') || 'en';

        if (!document.querySelector('.stwPanels i[selected]'))
            document.querySelector('.stwPanels>i').click();
        document.querySelectorAll('h1 .fa-angle-right').forEach(i => {
            i.closest('h1').nextElementSibling.style.display = 'none';
        });

        document.querySelectorAll('input[list]').forEach(dataListInput => {
            dataListInput.addEventListener('focus', event => {
                event.target.setAttribute('placeholder', dataListInput.value);
                dataListInput.value = '';
            });
            dataListInput.addEventListener('change', event => {
                event.target.setAttribute('placeholder', dataListInput.value);
                dataListInput.value = '';
            });
            dataListInput.addEventListener('blur', event => {
                if (dataListInput.value === '')
                    dataListInput.value = event.target.getAttribute('placeholder');
            });
        });
        document.getElementById('Browse').src = decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('stwBrowseURL='))?.split('=')[1]) || '/';
    },
    manageSettings: event => {
        // TODO: Persist locally
        if (event.target.name === 'theme') {
            document.body.className = event.target.value;
            document.querySelectorAll('.ace_editor').forEach(ace => {
                ace.editor.setTheme(event.target.value == 'stwDark' ? 'ace/theme/tomorrow_night' : '');
            });
        } else if (event.target.name === 'specialColor') {
            let color = parseInt(event.target.value.replace('#', ''), 16);
            document.querySelector(':root').style.setProperty('--special', `${color >> 16 & 255},${color >> 8 & 255},${color & 255}`);
        } else if (event.target.name === 'hideLabels')
            document.querySelector(':root').style.setProperty('--hideLabels', event.target.value === 'true' ? 'none' : 'inherit');
    },
    keydown: event => {
        if (event.ctrlKey && event.key === 'F12') {
            event.preventDefault();
            event.stopPropagation();
            location.href = document.getElementById('BrowseURL').value;
            return;
        }

        if (document.activeElement.className === 'ace_text-input' && event.key == 's' && event.ctrlKey) {
            event.stopPropagation();
            event.preventDefault();

            let tab = document.activeElement.parentElement;

            stwStudio.statusBar(`Save ${tab.id}...`);

            fetch(`/studio/fs/${tab.id}`,
                {
                    method: 'POST',
                    body: tab.editor.getValue(),
                    headers: { 'Content-type': 'text/plain' }
                })
                .catch(err => {
                    console.log(err);
                });
        }
        if (event.key == 'e' && event.ctrlKey && document.getElementById('properties')) {
            document.querySelector('#properties i[data-action="expand"]').click();
            event.preventDefault();
        }
        if (event.key == 'F5') {
            document.getElementById('Browse').src = document.getElementById('BrowseURL').value;
            event.preventDefault();
            event.stopPropagation();
        }
        if (event.ctrlKey && event.key == 'l') {
            document.querySelector('[data-action="locate"]').click();
            event.preventDefault();
            event.stopPropagation();
        }

        if (event.target.closest('article')?.id == 'webbase' && document.getElementById('properties')) {
            let selectedElement = document.querySelector('li[data-id][selected]');

            if (event.key == 'x' && event.ctrlKey) {
                if (stwStudio.stwCopyElement)
                    event.target.querySelector('span[class]').className = '';
                selectedElement.querySelector('div span:last-of-type').className = 'cut';
                stwStudio.stwCopyElement = selectedElement.dataset.id;
                stwStudio.statusBar('Cutting element...' + stwStudio.stwCopyElement);

            } else if (event.key == 'c' && event.ctrlKey) {
                if (stwStudio.stwCopyElement)
                    event.target.querySelector('span[class]').className = '';
                selectedElement.querySelector('div span:last-of-type').className = 'copy';
                stwStudio.stwCopyElement = selectedElement.dataset.id;
                stwStudio.statusBar('Copying element...' + stwStudio.stwCopyElement);

            } else if (stwStudio.stwCopyElement && selectedElement.dataset.type === 'Content' && event.key == 'v' && event.ctrlKey) {
                stwStudio.statusBar('Pasting link...');

            } else if (stwStudio.stwCopyElement && event.key == 'v' && event.ctrlKey) {
                stwStudio.statusBar('Pasting element...');
                // if cut then move
                // if copy then add

            } else if (event.key == 'Delete') {
                if (selectedElement.firstChild.lastChild.innerText.endsWith('T') && !confirm('Are you sure you want to delete the element permanently? There is no going back.'))
                    return;
                if (stwStudio.stwCopyElement === selectedElement.dataset.id)
                    stwStudio.stwCopyElement = undefined;
                stwStudio.statusBar('Deleting element...');
                fetch(`/studio/wbdl/${document.getElementById('properties').dataset.id}`,
                    {
                        method: 'DELETE'
                    })
                    .then(res => res.json())
                    .then(data => {
                        stwStudio.renderPanel('/studio/panels/webbase.html', data._id);
                        stwStudio.loadForm(document.querySelector('#properties form'), data);
                    })
                    .catch(err => { console.log(err) });
            }
            event.preventDefault();
            event.stopPropagation();
        }
    },
    click: event => {
        let target = event.target;

        if (!event.isTrusted && target.classList.contains('fa-angle-down'))
            return;

        if (target.tagName === 'SPAN' && target.parentElement.id === 'searchMode') {
            target.toggleAttribute('selected');
            return;
        }

        let parent = target.closest('h1') || target.closest('div');

        if (target.classList.contains('fa-angle-down')) {
            target.classList.replace('fa-angle-down', 'fa-angle-right');
            if (parent.parentElement.tagName === 'LI')
                parent.parentElement.querySelector('ul').style.display = 'none';
            else
                parent.nextElementSibling.style.display = 'none';
        } else if (target.classList.contains('fa-angle-right')) {
            target.classList.replace('fa-angle-right', 'fa-angle-down');
            if (parent.parentElement.tagName === 'LI')
                parent.parentElement.querySelector('ul').style.display = '';
            else
                parent.nextElementSibling.style.display = '';
        }
    },
    submitForm: event => {
        if (!event.target.form.reportValidity())
            return;

        stwStudio.statusBar('Save properties...');

        let data = {};
        for (let input of event.target.form)
            if (!input.hasAttribute('disabled'))
                data[input.name] = input.value;

        if (event.currentTarget)
            data.status = 'M';
        if (data.hasOwnProperty('slug') && data.slug === '')
            data.slug = data.name.toLowerCase().replace(/[^a-z]/g, '');

        fetch(`/studio/wbdl/${data._id}`,
            {
                method: 'PATCH',
                body: JSON.stringify(data),
                headers: { 'Content-type': 'application/json' }
            })
            .then(res => res.json())
            .then(data => {
                stwStudio.renderPanel('/studio/panels/webbase.html', data._idParent, data._id);
            })
            .catch(err => { console.log(err) });
    },
    loadForm: (form, data) => {
        for (let input of form.elements) {
            let li = form.querySelector(`[name="${input.name}"]`).closest('li');

            if (data[input.name] === undefined) {
                input.setAttribute('disabled', '');
                if (li) li.style.display = 'none';
            } else {
                input.removeAttribute('disabled');
                if (li) li.style.display = '';
            }

            if (input.name === 'permalink' && data.mainpage) {
                fetch(`/studio/wbdl/permalink/${data.mainpage}`)
                    .then(res => res.text())
                    .then(text => { input.value = text })
                    .catch(err => { console.log(err) });
            }

            let obj = data[input.name];
            if (!obj)
                input.value = null;
            else if (typeof obj === 'object')
                input.value = obj[stwStudio.settings.lang] || obj[Object.keys(obj)[0]] || null;
            else
                input.value = obj;
        }
        if (form.slug && form.slug.value === '')
            form.slug.value = form.name.value.toLowerCase().replace(/[^a-z]/g, '');
        else
            form.slug.value = form.slug.value.toLowerCase().replace(/[^a-z]/g, '');

        // document.querySelector('#properties .fa-trash-can').className = data.status === 'T' ? 'fa-solid fa-fw fa-trash-can' : 'fa-regular fa-fw fa-trash-can';
    },
    loadFile: (path, destination, callback) => {
        fetch(path)
            .then(res => {
                if (res.status != 200)
                    throw res.status;
                return res.text();
            })
            .then(data => {
                if (destination && destination.tagName === 'TEXTAREA')
                    document.getElementById(elementId).value = data;
                else if (destination && destination.tagName === 'SECTION') {
                    destination.innerHTML = data;
                    stwStudio.setup();
                    callback(path);
                } else if (destination) {
                    document.getElementById(path).editor = destination;
                    destination.setValue(data, -1);
                    document.querySelector(`.stwTabs .stwTabLabel[title="${path}"]`).click();
                }
            })
            .catch(err => {
                console.log(err);
            });
    },
    renderPanel: (panel, subpath, selectId) => {
        switch (panel) {
            case '/studio/panels/webbase.html':
                fetch(`/studio/wbdl${subpath ? '/' + subpath : ''}`)
                    .then(res => {
                        if (res.ok)
                            return res.json();
                    })
                    .then(json => {
                        if (subpath) {
                            let ul = document.querySelector(`[data-id="${subpath}"]`).parentElement.closest('ul');
                            for (var depth = -1; ul; ul = ul.parentElement.closest('ul'), ++depth);
                            document.querySelector(`[data-id="${subpath}"]`).insertAdjacentHTML('afterend', stwStudio.renderTree(json, depth, true));
                            document.querySelector(`[data-id="${subpath}"]`).remove();
                            document.querySelector(`[data-id="${selectId || subpath}"]>div`).click();
                        } else {
                            document.getElementById('webbase').lastElementChild.remove();
                            document.getElementById('webbase').insertAdjacentHTML('beforeend', `<ul>${stwStudio.renderTree(json)}</ul>`);
                            document.querySelector('li[data-type=Webo]>div').click();
                            document.querySelector('[data-action="locate"]').click();
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    });
                break;
            case '/studio/panels/explorer.html':
                fetch('/studio/fs')
                    .then(res => {
                        if (res.ok)
                            return res.json();
                    })
                    .then(json => {
                        document.getElementById('explorer').lastElementChild.remove();
                        document.getElementById('explorer').insertAdjacentHTML('beforeend', `<ul>${stwStudio.renderTree(json)}</ul>`);
                    })
                    .catch(err => {
                        console.log(err);
                    });
                break;
            case '/studio/panels/sourcecontrol.html':
                fetch('/studio/git/status')
                    .then(res => {
                        if (res.ok)
                            return res.json();
                    })
                    .then(files => {
                        let tree = { children: [] };
                        files.forEach(file => tree.children.push({ name: file.path, type: 'file', status: file.working_dir }));

                        document.getElementById('sourcecontrol').lastElementChild.remove();
                        document.getElementById('sourcecontrol').insertAdjacentHTML('beforeend', `<ul>${stwStudio.renderTree(tree)}</ul>`);
                    })
                    .catch(err => {
                        console.log(err);
                    });
                break;
            case '/studio/panels/datasources.html':
                fetch(`/studio/wbdl/datasources`)
                    .then(res => {
                        if (res.ok)
                            return res.json();
                    })
                    .then(json => {
                        document.getElementById('datasources').lastElementChild.remove();
                        document.getElementById('datasources').insertAdjacentHTML('beforeend', `<ul>${stwStudio.renderTree(json)}</ul>`);
                    })
                    .catch(err => {
                        console.log(err);
                    });
                break;
            case '/studio/panels/roles.html':
                fetch('/studio/wbdl/visibility')
                    .then(res => {
                        if (res.ok)
                            return res.json();
                    })
                    .then(roles => {
                        let tree = { children: [] };
                        for (let role in roles)
                            tree.children.push({ name: role, type: 'role' });

                        document.getElementById('roles').lastElementChild.remove();
                        document.getElementById('roles').insertAdjacentHTML('beforeend', `<ul>${stwStudio.renderTree(tree)}</ul>`);
                    })
                    .catch(err => {
                        console.log(err);
                    });
                break;
            case '/studio/panels/settings.html':
                let color = '#';
                document.querySelector(':root').style.getPropertyValue('--special').split(',').forEach(byte => color += parseInt(byte).toString(16));
                document.getElementById('specialColor').value = color;
                break;
        }
    },
    renderTree: (node, depth = 0, show = false) => {
        // TODO: Remember open nodes
        let html = '';

        if (!depth && !node.type) {
            for (let child of node.children)
                html += stwStudio.renderTree(child, depth);

        } else {
            let name = typeof (node.name) === 'string' ? node.name : (node.name[stwStudio.settings.lang] || node.name[Object.keys(node.name)[0]]),
                cssClass = node.status === 'T' ? 'class="stwT"' : '';

            if (node.children && node.children.length) {
                if (!depth)
                    html = `<li ${node._id ? `data-id="${node._id}" ` : ''}data-type="${node.type}"><div role="link"><span></span><span>${name}</span><span>${node.status || ''}</span></div><ul>`;
                else if (show)
                    show = false, html = `<li ${cssClass} ${node._id ? `data-id="${node._id}" ` : ''}data-type="${node.type}"><div role="link"><span>${'&emsp;'.repeat(depth - 1)}<i class="fa fa-fw fa-angle-down"></i></span><span>${name}</span><span>${node.status}</span></div><ul>`;
                else
                    html = `<li ${cssClass} ${node._id ? `data-id="${node._id}" ` : ''}data-type="${node.type}"><div role="link"><span>${'&emsp;'.repeat(depth - 1)}<i class="fa fa-fw fa-angle-right"></i></span><span>${name}</span><span>${node.status}</span></div><ul style="display:none">`;
                for (let child of node.children)
                    html += stwStudio.renderTree(child, depth + 1);
                html += '</ul>';
            } else
                html = `<li ${cssClass} ${node._id ? `data-id="${node._id}" ` : ''}data-type="${node.type}"><div role="link"><span>${'&emsp;'.repeat(depth)}&nbsp;</span><span>${name}</span><span>${node.status || ''}</span></div>`;
        }
        return `${html || '<li data-type="nothing"><div><span></span><span>Empty</span><span class="undefined"></span></div>'}</li>`;
    },
    managePanels: event => {
        let target = event.target;
        if (target.tagName === 'I' && target.hasAttribute('selected')) {
            target.removeAttribute('selected');
            event.currentTarget.nextElementSibling.innerHTML = '';

        } else if (target.tagName === 'I') {
            let selected = event.currentTarget.querySelector('[selected]');
            if (selected) selected.removeAttribute('selected');
            target.setAttribute('selected', '');
            stwStudio.loadFile(target.dataset.panel, event.currentTarget.nextElementSibling, stwStudio.renderPanel);
        }
    },
    manageWebbase: event => {
        let target = event.target.closest('h1') || (event.target.closest('ul') ? event.currentTarget.querySelector('ul') : event.target);

        if (event.target.tagName === 'H1') {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        switch (target.tagName) {
            case 'H1':
                var tree = target.nextElementSibling;
                var parent = tree.querySelector('li[selected]');

                if (event.target.dataset.action === 'refresh') {
                    stwStudio.loadFile('/studio/panels/webbase.html', document.querySelector('section.stwPanel'), stwStudio.renderPanel);

                } else if (event.target.dataset.action === 'persist') {
                    stwStudio.statusBar('Upload webbase...');
                    fetch('/studio/wbdl/persist', { method: 'PUT' })
                        .catch(err => console.log(err));

                } else if (parent) {
                    fetch(`/studio/wbdl/${parent.dataset.id}/${event.target.dataset.action}`,
                        {
                            method: 'POST'
                        })
                        .then(res => res.json())
                        .then(node => {
                            fetch(`/studio/wbdl/${node._idParent}`)
                                .then(res => res.json())
                                .then(parentNode => {
                                    let ul = parent.closest('ul');
                                    for (var depth = -1; ul; ul = ul.parentElement.closest('ul'), ++depth);

                                    parent.insertAdjacentHTML('afterend', stwStudio.renderTree(parentNode, depth, true));
                                    parent.remove();
                                })
                                .then(() => {
                                    document.querySelector(`[data-id="${node._id}"]>div`).click();
                                });
                        })
                        .catch(err => console.log(err));
                }
                break;
            case 'UL':
                let div = event.target.closest('div');
                if (div && (!div.parentElement.hasAttribute('selected') || !event.isTrusted)) {
                    if (target.querySelector('li[selected]'))
                        target.querySelector('li[selected]').removeAttribute('selected');
                    div.parentElement.setAttribute('selected', '');

                    let properties = document.getElementById('properties');
                    properties.dataset.id = div.parentElement.dataset.id;
                    delete properties.dataset.idparent;

                    // Fetch node
                    fetch(`/studio/wbdl/${properties.dataset.id}`)
                        .then(res => {
                            if (res.ok)
                                return res.json();
                        })
                        .then(node => {
                            stwStudio.loadForm(properties.querySelector('form'), node);

                            // Fetch node visibility
                            fetch(`/studio/wbdl/visibility/${node._id}`)
                                .then(res => {
                                    if (res.ok)
                                        return res.json();
                                })
                                .then(roles => {
                                    let tree = { children: [] };
                                    for (let role in roles)
                                        tree.children.push({ name: role, type: 'role', status: stwStudio.visibilityEnum[roles[role]] });

                                    document.querySelector('#visibility ul').innerHTML = stwStudio.renderTree(tree);
                                });
                        })
                        .catch(err => console.log(err));
                    properties.querySelector('h1>i').click();
                }
                break;
        }
    },
    locateElement: id => {
        let element = document.querySelector(`li[data-id="${id}"]`), li;
        if (element) {
            document.getElementById('webbase').querySelector('[selected]').removeAttribute('selected');
            element.setAttribute('selected', '');
            element.firstElementChild.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));

            element.querySelector('ul').style.display = '';
            for (let node = element; node.tagName === 'LI'; node = node.parentElement) {
                if (node.firstElementChild.firstElementChild.firstElementChild)
                    node.firstElementChild.firstElementChild.firstElementChild.classList.replace('fa-angle-right', 'fa-angle-down');
                node = node.closest('ul')
                node.style.display = '';
            }
        }
    },
    manageSearch: event => {
        // TODO: handle whole words, regex and Replace
        let form = event.target.form, settings = form.querySelector('#searchMode');
        fetch(`/studio/wbdl/search/${stwStudio.settings.lang}`, {
            method: 'POST',
            body: JSON.stringify({
                text: form.search.value,
                ignoreCase: settings.children[0].hasAttribute('selected'),
                regExp: settings.children[1].hasAttribute('selected'),
                replace: form.replace.value
            }),
            headers: { 'Content-type': 'application/json' }
        })
            .then(res => {
                if (res.ok)
                    return res.json();
            })
            .then(json => {
                document.getElementById('search').lastElementChild.remove();
                document.getElementById('search').insertAdjacentHTML('beforeend', `<ul>${stwStudio.renderTree(json)}</ul>`);
            })
            .catch(err => {
                console.log(err);
            });
    },
    manageGroups: event => {
        let target = event.target.closest('h1') || (event.target.closest('ul') ? event.currentTarget.querySelector('ul') : event.target);

        if (event.target.tagName === 'H1') {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        switch (target.tagName) {
            case 'H1':
                if (event.target.dataset.action === 'refresh') {
                    stwStudio.renderPanel('/studio/panels/roles.html');

                } else if (event.target.dataset.action === 'addGroup') {
                    alert('add role');
                }
                break;
            case 'UL':
                // TODO: Properties visible
                let div = event.target.closest('div');
                if (div && (!div.parentElement.hasAttribute('selected') || !event.isTrusted)) {
                    if (target.querySelector('li[selected]'))
                        target.querySelector('li[selected]').removeAttribute('selected');
                    div.parentElement.setAttribute('selected', '');

                    let properties = document.getElementById('properties');
                    properties.querySelector('input[name]').value = div.children[1].innerText;
                    properties.style.display = '';
                }
                break;
        }
    },
    manageDatasource: event => {
        let target = event.target.closest('h1') || (event.target.closest('ul') ? event.currentTarget.querySelector('ul') : event.target);

        if (event.target.tagName === 'H1') {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        switch (target.tagName) {
            case 'H1':
                if (event.target.dataset.action === 'refresh') {
                    stwStudio.renderPanel('/studio/panels/datasources.html');

                } else if (event.target.dataset.action === 'addDatasource') {
                    alert('add datasource');
                }
                break;
            case 'UL':
                // TODO: Properties visible
                let div = event.target.closest('div');
                if (div && (!div.parentElement.hasAttribute('selected') || !event.isTrusted)) {
                    if (target.querySelector('li[selected]'))
                        target.querySelector('li[selected]').removeAttribute('selected');
                    div.parentElement.setAttribute('selected', '');

                    let properties = document.getElementById('properties');
                    properties.querySelector('input[name]').value = div.children[1].innerText;
                    properties.style.display = '';
                }
                break;
        }
    },
    manageFiles: event => {
        let target = event.target.closest('h1') || event.target.closest('li') || event.target;

        if (target.tagName === 'LI' && target.dataset.type === 'file') {
            let filename = target.firstChild.childNodes[1].textContent;
            let path = filename;
            for (let el = target.closest('li[data-type=dir]'); el; el = el.parentElement.closest('li[data-type=dir]'))
                path = el.firstChild.children[1].innerText + '/' + path;

            if (!document.getElementById(path)) {
                document.querySelector('.stwTabs > div').insertAdjacentHTML('beforeend', `<span tabindex="0" role="link" class="stwTabLabel" title="${path}">${path}<i class="fa fa-times"></i></span>`);
                document.querySelector('.stwTabs').insertAdjacentHTML('beforeend', `<div class="stwTab"><div></div><div id="${path}"></div></div>`);

                let editor = ace.edit(path);
                if (document.body.className == 'stwDark')
                    editor.setTheme('ace/theme/tomorrow_night');
                editor.session.setMode(ace.require('ace/ext/modelist').getModeForPath(path).mode);
                stwStudio.loadFile(path, editor);
            } else
                document.querySelector(`.stwTabs .stwTabLabel[title="${path}"]`).click();
        }
    },
    manageProperties: (event, what) => {
        let target = event.target.closest('h1') || event.target;

        if (target.tagName === 'H1' && event.target.dataset.action) {
            switch (event.target.dataset.action) {
                case 'clone':
                    // TODO: Deep clone node
                    break;
                case 'expand':
                    document.getElementById('properties').classList.toggle('stwFullScreen');
                    break;
            }
        }
    },
    manageContent: event => {

    },
    manageVisibility: event => {
        if (!event.target.closest('li'))
            return;

        let status = event.target.closest('div').querySelector('i').outerHTML;
        for (let key in stwStudio.visibilityEnum)
            if (status === stwStudio.visibilityEnum[key]) {
                fetch(`/studio/wbdl/visibility/${document.getElementById('properties').dataset.id}`, {
                    method: 'POST',
                    body: JSON.stringify({
                        role: event.target.closest('div').innerText,
                        visibility: (key === 'LV') ? false : (key === 'LI') ? null : true
                    }),
                    headers: { 'Content-type': 'application/json' }
                })
                    .then(res => res.json())
                    .then(data => {
                        document.querySelector(`#webbase li[data-id="${data._id}"]>div`).click();
                    })
                    .catch(err => {
                        console.log(err);
                    });
                break;
            };
    },
    manageTab: event => {
        let target = event.target, currentTarget = event.currentTarget;
        if (target.classList.contains('fa-times')) {
            let i;
            for (i = 0; i < currentTarget.children.length && currentTarget.children[i] != target.parentElement; ++i);

            if (target.closest('.stwTabLabel').hasAttribute('selected'))
                currentTarget.firstElementChild.click();

            currentTarget.children[i].remove();
            currentTarget.parentElement.children[i + 1].remove();

        } else if (target.className === 'stwTabLabel' && !target.hasAttribute('selected')) {
            currentTarget.querySelector('.stwTabLabel[selected]').removeAttribute('selected');
            target.setAttribute('selected', '');

            let i;
            for (i = 0; i < currentTarget.children.length && currentTarget.children[i] != target; ++i);

            currentTarget.parentElement.querySelector('.stwTab[selected]').removeAttribute('selected');
            currentTarget.parentElement.children[i + 1].setAttribute('selected', '');

            let editor = currentTarget.parentElement.querySelector(`div[id="${target.innerText}"]>textarea`);
            if (editor)
                editor.focus();
        }
        event.preventDefault();
    },
    manageBrowse: event => {
        let target = event.target;
        switch (target.dataset.action) {
            case 'back':
                document.querySelector('iframe').contentWindow.history.back();
                break;
            case 'forward': // TODO: Hide when history not present
                document.querySelector('iframe').contentWindow.history.forward();
                break;
            case 'refresh':
                document.getElementById('Browse').src = document.getElementById('BrowseURL').value;
                break;
            case 'locate':
                stwStudio.locateElement(document.cookie.split('; ').find(row => row.startsWith('stwPage='))?.split('=')[1]);
                break;
            case 'home':
                document.getElementById('Browse').src = location.origin;
                break;
        }
    },
    manageContextMenu: event => {
        return;
        event.preventDefault();
        event.stopPropagation();
    },
    setURL: event => {
        let target = event.target;
        if (target.tagName === 'INPUT')
            target.parentElement.nextElementSibling.src = target.value;
        else if (target.tagName === 'IFRAME')
            target.previousElementSibling.querySelector('[name=url]').value = target.ownerDocument.location.origin;
    },
    statusTimeout: null,
    statusBar: (text, span = 1) => {
        if (stwStudio.statusTimeout && span === 1)
            clearTimeout(stwStudio.statusTimeout);
        document.getElementById('statusbar').children[span].innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> ' + text;
        if (span === 1)
            stwStudio.statusTimeout = setTimeout(() => { document.getElementById('statusbar').children[1].innerHTML = '' }, 1500);
    }
}

window.addEventListener('click', stwStudio.click);
window.addEventListener('keydown', stwStudio.keydown);
window.addEventListener('load', () => {
    stwStudio.setup();
    document.getElementById('Browse').addEventListener('load', event => {
        if (event.currentTarget.contentWindow.origin && event.currentTarget.contentWindow?.location.origin != 'null')
            document.getElementById('BrowseURL').value = event.currentTarget.contentWindow.location.href;
        else
            event.currentTarget.contentWindow.location = location.origin + '/';
    });
});
