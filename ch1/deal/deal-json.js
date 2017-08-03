var http = require('http');
var fs = require('fs');

var server = http.createServer();
server.on('request', function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/json'});
    fs.createReadStream('../json/resource.json').pipe(res);
});
server.listen(8080);
console.log('server running at http://localhost:8080 ---- deal with json');