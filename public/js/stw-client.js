/*!
 * stw-client.js
 * Copyright(c) 2017 Giancarlo Trevisan
 * MIT Licensed
 */

// TODO: Should be CDN delivered
let stw;

(function () {
    // Load remote script then call callback
    function loadScript(url, callback) {
        let script = document.createElement('script');
        script.onload = callback;
        script.src = url;
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    loadScript('/socket.io/socket.io.js', () => {
        stw = io.connect();

        stw.on('connect', function (data) { });
        stw.on('disconnect', function (data) { });
        stw.on('reload', function (data) {
            window.location = data.url;
        });

        stw.on('page', function (page) {
            document.querySelector('html').setAttribute('id', page.id);
            document.querySelector('html').setAttribute('lang', page.lang);
            document.querySelector('title').innerHTML = page.name;
        });
        stw.on('content', function (content) {
            let sequence = Math.floor(content.sequence).toString();
            let article = document.querySelector('article[data-ref="' + content.position.toString() + sequence + '"]');
            if (article)
                article.parentElement.removeChild(article);
            else
                article = document.querySelector('[data-ref="' + content.position.toString() + sequence + '"]');

            let section = document.getElementById(content.position);
            if (section && content.body) {
                article = document.createElement('article');
                article.setAttribute('id', content.id);
                if (content.cssClass) article.setAttribute('class', content.cssClass);
                article.setAttribute('data-seq', content.sequence);
                article.setAttribute('data-ref', content.position + sequence);
                article.innerHTML = content.body;

                let i = 0;
                for (; i < section.children.length && Math.floor(section.children[i].dataset.seq) < content.sequence; ++i);
                section.insertBefore(article, section.children[i] || null);
            }

            if (content.children) {
                stw.emit('content', content);
            }
        });
        stw.on('script', function (content) {
            if (!document.getElementById('stw' + content.id)) {
                let script = document.createElement('script');
                script.setAttribute('id', 'stw' + content.id);
                script.text = content.body;
                document.body.appendChild(script);
            }
        });
        stw.on('wrapup', function (data) {
            let articles = document.querySelectorAll('article[data-ref]');
            for (let i = 0; i < articles.length; ++i) {
                if (data.emitted.indexOf(articles[i].getAttribute('data-ref')) === -1)
                    articles[i].parentElement.removeChild(articles[i]);
            }
        });

        stw.emit('content', { url: window.location }); // Initial request of page contents
    });
})();