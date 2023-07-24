/*!
 * stw-client.js
 * Copyright(c) 2017- Giancarlo Trevisan
 * MIT Licensed
 */
window.onload = function () {
    // Request page contents
    let stwContents = decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('stwContents='))?.split('=')[1]);

    stwContents.split(',').forEach(_id => {
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
