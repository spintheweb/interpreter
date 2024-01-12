/*!
 * stwClient.js
 * Copyright(c) 2023 - Giancarlo Trevisan
 * MIT Licensed
 */

const isDeveloper = document.cookie.indexOf('stwDeveloper=true') != -1;

if (self != top && !isDeveloper)
    top.location.href = location.href; // Reload top
else if (self != top && location.href.indexOf('/stwstudio') != -1)
    location.href = '/'; // Reload self

window.onload = () => {
    document.cookie = `stwBrowseURL=${location.pathname}; path=/`;

    // Request page contents
    let stwContents = decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('stwContents='))?.split('=')[1]);

    stwContents.split(',').forEach(_id => {
        // TODO: Manage sub sequence rendering

        fetch(`/${_id}?${location.search}`)
            .then(res => {
                if (res.ok)
                    return res.json();
            })
            .then(content => {
                let section = document.getElementById(content.section);
                section.insertAdjacentHTML('beforeend', content.body);

                if (document.cookie.indexOf('stwDeveloper=true') != -1) { // Developer
                    section.querySelectorAll('.stwInspector').forEach(locator => {
                        locator.classList.remove('stwInspector');
                        locator.addEventListener('click', event => {
                            if (self != top) {
                                let sitemap = top.document.querySelector('i.fa-sitemap:not([selected])');
                                if (sitemap)
                                    sitemap.click();
                                locateElement(top.document, locator.dataset.id);
                            } else
                                self.location = `/stwstudio?inspect=${locator.dataset.id}`;
                        });
                    });
                }
            })
            .catch(err => {
                console.log(err);
            });
    });

    // Used when stwStudio is accessible
    function locateElement(studio, id) {
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
};
window.onkeydown = event => {
    const isDeveloper = document.cookie.indexOf('stwDeveloper=true') != -1;

    if (isDeveloper && event.ctrlKey && event.key === 'F12') {
        event.preventDefault();
        event.stopPropagation();

        if (self == top)
            location.href = `${top.location.origin}/stwStudio`;
        else
            top.location.href = decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('stwBrowseURL='))?.split('=')[1]) || '/';

    } else if (isDeveloper && event.ctrlKey && event.key === 'l' && self != top) {
        event.preventDefault();
        event.stopPropagation();
        top.document.querySelector('[data-action="inspect"]').click();
    }
};
