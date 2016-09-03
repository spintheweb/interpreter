var server = require('http').createServer();

require('./wbol').listen(server);

const hostname = process.env.IP || '0.0.0.0';
const port = process.env.PORT || 3000;
server.listen(port, hostname, () => {
    console.log(`Spintheweb listening at http://${hostname}:${port}/`);
});
