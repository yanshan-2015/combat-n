var http = require('http');
var fs = require('fs');

var server = http.createServer();
server.on('request',function (req, res) {
    fs.readFile('./title.json',function (err, data) {
        if(err){
            console.log(err);
            res.end('Server Error');
        } else {
            var title = JSON.parse(data.toString());
            fs.readFile('./template.html',function (err, data) {
                if(err){
                    console.log(err);
                    res.end('Server Error');
                }else {
                    var tmpl = data.toString();
                    var html = tmpl.replace('%', title.join('<li></li>'));
                    res.writeHead(200, {'Content-Type':'text/html'})
                    res.end(html);
                }
            })
        }
    })
});
server.listen(8080);
console.log('Server running at http://localhost:8080');