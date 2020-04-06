// window.addEventListener('load', load);

function load() {
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/javascript");
}

function loadXML() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var webbase = document.createElement('div');
            webbase.innerHTML = xhttp.responseXML;
            renderWebbase(webbase.querySelector('webbase'));
        }
    };
    xhttp.open("GET", "./www.atleticarzignano.it.xml", true);
    xhttp.send();
}

function renderWebbase(node, element) {
    if (!element) {
        element = document.createElement('ul');
    } else {
        element.appendChild();
    }

    for (var i = 0; node.children.length; ++i) {
        var child = node.children[i];
        switch (child.tagName) {
            case 'webbase':
                fa = 'globe';
                break;
            case 'area':
                fa = 'folder-o';
                break;
            case 'page':
                fa = 'file-o'; // home asterisk
                break;
            case 'content':
                fa = 'sticky-note-o'; // square-o
                break;
            default:
                continue;
        }
        var li = document.createElement('li');
        li.className = child.tagName;
        li.setAttribute('id', child.getAttribute('id'));
        li.setAttribute('data-guid', child.getAttribute('guid'));
        li.innerText = child.querySelector('name>text').innerText;

        renderWebbase(child, li);

        element.appendChild(li);

    }
}

function renderProperties(element) {

}
