/*!
 * stwClient.js
 * Copyright(c) 2023 - Giancarlo Trevisan
 * MIT Licensed
 */

window.onload = () => {
    const isDeveloper = document.cookie.indexOf('stwDeveloper=true') != -1;

    if (self != top && self.location.href.indexOf('/stwStudio') != -1) {
        self.location.href = self.location.href.replace('/stwStudio', '/');
        return;
    }
    if (!isDeveloper && top.location.href.indexOf('/stwStudio') != -1) {
        top.location.href = top.location.href.replace('/stwStudio', '/');
        return;
    }

    document.cookie = `stwBrowseURL=${location.pathname}; path=/`;

    // Request unit contents
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
            })
            .catch(err => {
                console.log(err);
            });
    });
};
window.onkeydown = event => {
    const isDeveloper = document.cookie.indexOf('stwDeveloper=true') != -1;

    if (isDeveloper && event.ctrlKey && event.key === 'F12') {
        event.preventDefault();
        event.stopPropagation();
        if (self == top)
            top.location.href = `${top.location.origin}/stwStudio${top.location.pathname}`;
        else
            top.location.href = self.location.href;

    } else if (isDeveloper && event.ctrlKey && event.key === 'l' && self != top) {
        event.preventDefault();
        event.stopPropagation();
        top.document.querySelector('[data-action="locate"]').click();
    }
};
