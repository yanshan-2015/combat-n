var  socketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function (server) {
    io = socketio.listen(server);   //启动socket IO服务器，允许她搭载在已有服务器上
   /* io.set('log level',1);*/
    io.socket.on('connection', function (socket) { //定义每个用户连接时的处理逻辑
        //连接上来时，赋予该用户访客名
        guestNumber = assingGuestName(socket, guestNumber,nickNames, namesUsed);
        joinRoom(socket, 'Lobby');

        handleMessageBroadcasting(socket, nickNames); //处理用户消息，更名，聊天室的创建、更改
        handleNameChangeAttempts(socket, nickNames, namesUsed);
        handleRoomJoining(socket);

        socket.on('rooms',function () {
            socket.emit('rooms',io.sockets.manager.rooms);
        });

        handleClientDisconnection(socket, nickNames, namesUsed);
    })
};

//分配名字
function assingGuestName(socket, guestNumber, nickNames, namesUsed) {
    var name = 'Guest'+guestNumber;
    nickNames[socket.id] = name;
    socket.emit('nameResult',{
        success: true,
        name: name
    });
    namesUsed.push(name);
    return guestNumber + 1;
}
//加入房间请求
function joinRoom(socket, room) {
    socket.join(room);
    currentRoom[socket.id] = room;
    socket.emit('joinResult', {room: room});
    socket.broadcast.to(room).emit('message', {
        text: nickNames[socket.id] + 'has joined' + room+"."
    });
    var usersInRoom = io.sockets.clients(room);
    if(usersInRoom.length>1){
        var userInRoomSummary = 'Users currently in'+ room + ':';
        for (var index in usersInRoom){
            var userSocketId = usersInRoom[index].id;
            if(index>0){
                userInRoomSummary +=',';
            }
            userInRoomSummary += nickNames[userSocketId];
        }
    }
    userInRoomSummary += '.';
    socket.emit('message', {text: userInRoomSummary});
}
//更名请求的处理逻辑
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    socket.on('nameAttempt', function (name) {
        if(name.indexOf('Guest') == 0){
            socket.emit('nameResult', {
                success: false,
                message: 'Names cannot begin with "Guest".'
            })
        }else {
            if(namesUsed.indexOf(name) == -1){
                var previousName = nickNames[socket.id];
                var previousNameIndex = namesUsed.indexOf(previousName);
                namesUsed.push(name);
                nickNames[socket.id] = name;
                delete  namesUsed[previousNameIndex];
                socket.emit('nameResult', {
                    success: true,
                    name: name
                });
                socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                    text: previousName + 'is now known as '+ name + '.'
                });
            }else {
                socket.emit('nameResult', {
                    success: false,
                    message: 'That name is already in use.'
                })
            }
        }
    })

}

//发送聊天消息
function handleMessageBroadcasting(socket) {
    socket.on('message', function (message) {
        socket.broadcast.to(message.room).emit('message', {
            text: nickNames[socket.id]+ ':' +message.text
        })
    })

}

//创建房间
function handleRoomJoining(socket) {
    socket.on('join', function (room) {
        socket.leave(currentRoom[socket.id]);
        joinRoom(socket, room.newRoom);
    })
}

//用户断开连接
function handleClientDisconnection(socket) {
    socket.on('disconnect', function () {
        var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
        delete namesUsed[nameIndex];
        delete nickNames[socket.id];
    })

}
