/*!
 * stw-client.js
 * Copyright(c) 2017- Giancarlo Trevisan
 * MIT Licensed
 */
window.onload = function () {
    // Request page contents
    let stwContents = decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('stwContents='))?.split('=')[1]);

    if (stwContents === '')
        return;

    stwContents.split(',').forEach(_id => {
        fetch(`/${_id}?${location.search}`)
            .then(res => {
                if (res.ok)
                    return res.json();
            })
            .then(content => {
                let sequence = Math.floor(content.sequence).toString();
                let article = document.querySelector(`article[data-ref="${content.section}-${sequence}"]`);

                if (article) {
                    // TODO: set content.body based on diff see https://gomakethings.com/dom-diffing-with-vanilla-js-part-1/
                    article.parentElement.removeChild(article);
                } else
                    article = document.querySelector('[data-ref="' + content.section.toString() + sequence + '"]');

                let section = document.getElementById(content.section);
                if (section && content.body) {
                    article = document.createElement('div');
                    article.innerHTML = '<article id="' + content.id + '"' +
                        content.attrs +
                        ' data-seq="' + content.sequence + '"' +
                        ' data-ref="' + content.section + sequence + '">' +
                        content.body +
                        '</article>';

                    let i = 0;
                    for (; i < section.children.length && Math.floor(section.children[i].dataset.seq) < content.sequence; ++i);
                    section.insertBefore(article.firstElementChild, section.children[i] || null);
                }

                if (content.children) {
                    stw.send(JSON.stringify(content));
                }
                section = document.querySelector(`section[id="${obj.section}"]`);
                section.querySelectorAll(`article[data-seq]`);
                section.insertAdjacentText('beforeend', obj.fragment);
            })
            .catch(err => {
                console.log(err);
            });
    });
}
