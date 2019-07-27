var server = require('http').createServer();

// Spin the web listens to server
require('./webspinner').listen(server);

const hostname = process.env.IP || '127.0.0.1';
const port = process.env.PORT || 3000;
server.listen(port, hostname, () => {
    console.log(`Web spinner listening at http://${hostname}:${port}/`);
});
