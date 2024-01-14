/*!
 * stwClient.js
 * Copyright(c) 2023 - Giancarlo Trevisan
 * MIT Licensed
 */

const stwIsDeveloper = document.cookie.indexOf('stwIsDeveloper=true') != -1;

if (self != top && !stwIsDeveloper)
    top.location.href = location.href; // Reload top
else if (self != top && location.href.indexOf('/stwstudio') != -1)
    location.href = '/'; // Reload self

window.onload = () => {
    document.cookie = `stwBrowseURL=${location.pathname}; path=/`;

    // Request page contents
    let stwContents = decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('stwContents='))?.split('=')[1]);

    stwContents.split(',').forEach(_id => {
        // TODO: Manage sub sequence rendering

        fetch(`/${_id}${location.search}`)
            .then(res => {
                if (res.status == 200)
                    return res.json();
                return Promise.reject(`Nothing to show for /${_id}${location.search}`);
            })
            .then(content => {
                let section = document.getElementById(content.section);
                section.insertAdjacentHTML('beforeend', content.body);

                if (stwIsDeveloper) {
                    section.querySelectorAll('.stwInspector').forEach(locator => {
                        locator.classList.remove('stwInspector');
                        locator.addEventListener('click', event => {
                            if (self != top) {
                                let sitemap = top.document.querySelector('i.fa-sitemap:not([selected])');
                                if (sitemap)
                                    sitemap.click();
                                stwLocateElement(top.document, locator.dataset.id);
                            } else
                                self.location = `/stwstudio?inspect=${locator.dataset.id}`;
                        });
                    });
                }
            })
            .catch(err => {
                if (stwIsDeveloper)
                    console.log(err);
            });
    });
};

// Set of routines for stwStudio
function stwLocateElement(studio, id) {
    let element = studio.querySelector(`li[data-id="${id}"]`), li;
    if (element) {
        studio.getElementById('webbase').querySelector('[selected]').removeAttribute('selected');
        element.setAttribute('selected', '');
        element.firstElementChild.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));

        if (element.querySelector('ol'))
            element.querySelector('ol').style.display = '';
        for (let node = element; node.tagName === 'LI'; node = node.parentElement) {
            if (node.firstElementChild.firstElementChild.firstElementChild)
                node.firstElementChild.firstElementChild.firstElementChild.classList.replace('fa-angle-right', 'fa-angle-down');
            node = node.closest('ol')
            node.style.display = '';
        }
    }
}

window.onkeydown = event => {
    if (stwIsDeveloper && event.ctrlKey && event.key === 'F12') {
        event.preventDefault();
        event.stopPropagation();

        if (self == top)
            location.href = `${top.location.origin}/stwStudio`;
        else
            top.location.href = decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('stwBrowseURL='))?.split('=')[1]) || '/';

    } else if (stwIsDeveloper && event.ctrlKey && event.key === 'l' && self != top) {
        event.preventDefault();
        event.stopPropagation();
        top.document.querySelector('[data-action="inspect"]').click();
    }
};
window.onclick = event => {
    const content = event.target.closest('.stwInspect');
    if (content && event.ctrlKey) {
        event.preventDefault();
        event.stopPropagation();

        if (self != top) {
            let sitemap = top.document.querySelector('i.fa-sitemap:not([selected])');
            if (sitemap)
                sitemap.click();
            stwLocateElement(top.document, content.id);
        } else
            self.location = `/stwstudio?inspect=${content.id}`;
    }
}
function stwStudio() {
    window.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'F12' }));
}
function stwToggleContent(event) {
    const target = event.target;

    if (target.classList.contains('fa-angle-down')) {
        target.classList.replace('fa-angle-down', 'fa-angle-right');
        target.closest('.stwToggleParent').querySelector('.stwToggleChild').style.display = 'none';

    } else if (target.classList.contains('fa-angle-right')) {
        target.classList.replace('fa-angle-right', 'fa-angle-down');
        target.closest('.stwToggleParent').querySelector('.stwToggleChild').style.display = '';
    }
}