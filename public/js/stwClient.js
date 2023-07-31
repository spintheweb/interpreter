/*!
 * stwClient.js
 * Copyright(c) 2023 - Giancarlo Trevisan
 * MIT Licensed
 */

// Exit Spin the Web Studio if we are not developers
if (self != top && document.cookie.split('; ').find(row => row.startsWith('stwDeveloper='))?.split('=')[1] != 'true')
    top.location = self.location;

else {
    window.onload = () => {
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
                })
                .catch(err => {
                    console.log(err);
                });
        });
    }
    window.onkeydown = event => {
        if (self == top && event.ctrlKey && event.key === 'F12') {
            event.preventDefault();
            event.stopPropagation();
            location.href = '/studio';
        }
    }
}

