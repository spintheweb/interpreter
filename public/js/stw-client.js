/*!
 * stw-client.js
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
let stw;

function stwHref(event) {
    event.preventDefault();
    event.stopPropagation();
    stw.send(JSON.stringify({ url: event.target.getAttribute('href') }));
}

function stwSubmit(event) {
    event.preventDefault();
    event.stopPropagation();
    let data = { serverHandler: (event.target.closest('article') || {}).id };
    event.target.closest('article').querySelectorAll('[name]').forEach(function (input) {
        data[input.getAttribute('name')] = input.value; // TODO: validate and file upload
    });
    stw.send(JSON.stringify(data));
}

let stwHandlers = {
    reload: function (url) {
        window.location = url;
    },
    page: function (page) {
        document.querySelector('html').setAttribute('id', page.id);
        document.querySelector('html').setAttribute('lang', page.lang);
        document.querySelector('title').innerHTML = page.name;
    },
    request: function (data) {
        stw.send(JSON.stringify(data));
    },
    content: function (content) {
        let sequence = Math.floor(content.sequence).toString();
        let article = document.querySelector('article[data-ref="' + content.section.toString() + sequence + '"]');

        if (article)
            article.parentElement.removeChild(article);
        else
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
    },
    script: function (content) {
        if (!document.getElementById('stw' + content.id)) {
            let script = document.createElement('script');
            script.setAttribute('id', 'stw' + content.id);
            script.text = content.body;
            document.body.appendChild(script);
        }
    },
    wrapup: function (data) {
        let articles = document.querySelectorAll('article[data-ref]');
        for (let i = 0; i < articles.length; ++i) {
            if (data.emitted.indexOf(articles[i].dataset.ref) === -1)
                articles[i].parentElement.removeChild(articles[i]);
        }
    }
}

window.onload = function () {
    stw = new WebSocket('ws://' + window.location.host);

    stw.onerror = function (socket) {
        console.log('Web socket error: ' + socket);
    };

    stw.onopen = function (socket) {
        console.log('Connected to web socket');
        stw.send(JSON.stringify({ url: '/' })); // Initial request of page contents
    };

    stw.onmessage = function (socket) {
        let data = JSON.parse(socket.data);
        if (stwHandlers.hasOwnProperty(data.message)) // Disregard undefined handlers
            stwHandlers[data.message](data.body);
        else
            console.log('Unknow handler: ' + data.message);
    }

    stw.onclose = function (socket) {
        console.log('Disconnected from web socket');
    };
}
