/*!
 * stw-client.js
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */
let stw;

function stwHref(event) {
    stw.send(JSON.stringify({ message: 'content', body: { url: event.target.getAttribute('href') } }));
    return false;
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
    content: function (content) {
        let sequence = Math.floor(content.sequence).toString();
        let article = document.querySelector('article[data-ref="' + content.section.toString() + sequence + '"]');

        if (article)
            article.parentElement.removeChild(article);
        else
            article = document.querySelector('[data-ref="' + content.section.toString() + sequence + '"]');

        let section = document.getElementById(content.section);
        if (section && content.body) {
            article = document.createElement('article');
            article.setAttribute('id', content.id);
            if (content.cssClass) article.setAttribute('class', content.cssClass);
            article.setAttribute('data-seq', content.sequence);
            article.setAttribute('data-ref', content.section + sequence);
            article.innerHTML = content.body;

            let i = 0;
            for (; i < section.children.length && Math.floor(section.children[i].dataset.seq) < content.sequence; ++i);
            section.insertBefore(article, section.children[i] || null);
        }

        if (content.children) {
            stw.send(JSON.stringify({ message: 'content', body: content }));
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
        stw.send(JSON.stringify({ message: 'content', body: { url: '\\' } })); // Initial request of page contents
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
