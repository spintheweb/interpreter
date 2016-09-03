/*!
 * wbol-client.js
 * Copyright(c) 2016 Giancarlo Trevisan
 * MIT Licensed
 */

// TODO: Should be CDN delivered
var wbol;

(function() {
    // Load remote script then call callback
    function loadScript(url, callback) {
        var script = document.createElement('script');
        script.onload = callback;
        script.src = url;
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    loadScript('/socket.io/socket.io.js', () => {
        wbol = io.connect();

        wbol.on('connect', function(data) {});
        wbol.on('disconnect', function(data) {});
        wbol.on('reload', function(data) {
            window.location = data.url;
        });

        wbol.on('page', function(page) {
            document.querySelector('html').setAttribute('lang', page.lang);
            document.querySelector('title').innerHTML = page.name;
        });
        wbol.on('content', function(content) {
            var article = document.querySelector('article[data-ref=' + content.section.toString() + Math.floor(content.sequence).toString() + ']');
            if (article)
                article.parentElement.removeChild(article);

            var section = document.getElementById(content.section);
            if (section && content.body) {
                article = document.createElement('article');
                article.setAttribute('id', content.id);
                if (content.cssClass) 
                    article.setAttribute('class', content.cssClass);
                article.setAttribute('data-seq', content.sequence);
                article.setAttribute('data-ref', content.section.toString() + Math.floor(content.sequence).toString());
                article.innerHTML = content.body;
                
                for (var i = 0; i < section.children.length && Math.floor(section.children[i].dataset.seq) < content.sequence; ++i);
                section.insertBefore(article, section.children[i] || null);
            }
        });
        wbol.on('script', function(content) {
            var script = document.getElementById(content.id);
            if (script)
                script.parentElement.removeChild(script);
            script = document.createElement('script');
            script.setAttribute('id', content.id);
            script.text = content.body;
            document.body.appendChild(script);
        });
        wbol.on('cleanup', function(data) {
            var articles = document.querySelectorAll('article[data-ref]');
            for (var i = 0; i < articles.length; ++i) {
                if (data.emitted.indexOf(articles[i].getAttribute('data-ref')) === -1)
                    articles[i].parentElement.removeChild(articles[i]);
            }
        });

        wbol.emit('content', window.location); // Initial request of page contents
    });
})();