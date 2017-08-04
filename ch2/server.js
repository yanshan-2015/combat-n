var http=require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var cache = {};

//404
function send404(res) {
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write('ERROR 404: resource not found');
    res.end();
}
// 后台根据前端的请求 send file to browser
function sendFile(res, filePath, fileContents) {
    res.writeHead(200, {'Content-Type': mime.lookup(path.basename(filePath))});
    res.end(fileContents);
}
//是否在缓存中
function serverStatic(res, cache, absPath) {
    if(cache[absPath]){     //在缓存中
        sendFile(res, absPath, cache[absPath]);     //从缓存中返回
    }else {     //不在缓存中
        fs.exists(absPath, function (exists) {      //检查文件是否存在
            if(exists){
                fs.readFile(absPath, function (err, data) {     //从硬盘中读取出来
                    if(err){
                        send404(res);
                    }else {
                        cache[absPath] = data;
                        sendFile(res, absPath, data);       //从硬盘中读取并返回
                    }
                })
            }else {
                send404(res);
            }
        })
    }
}

var server = http.createServer(function (req, res) {
    var filePath = false;
    if(req.url == '/'){
        filePath = 'public/index.html';
    }else {
        filePath = 'public'+ req.url;
    }
    var absPath = './'+ filePath;
    serverStatic(res, cache, absPath);
});

server.listen(8080,function () {
    console.log('server running at http://localhost:8080');
});


var chatServer = require('./lib/chat_server');
chatServer.listen(server);