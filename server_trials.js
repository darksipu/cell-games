/**
 * Created by florin on 14/09/2017.
 */

var express = require('express');
var app = express();
var app2 = express();
var path = require('path');
var socket = require('socket.io');

var server = app.listen(3000);
var server2 = app2.listen(8080);

var io = socket(server);

var io2 = socket(server2);


app.use(express.static(__dirname));
app2.use(express.static(__dirname));

// viewed at http://localhost:3000
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/transcription.html'));
});

// viewed at http://localhost:3000/second
app2.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/translation.html'));
});


io.sockets.on("connection", newConnection);
io2.sockets.on("connection", newConnectionn);

function newConnection(socket) {

    console.log("new connection" + socket.id);

    socket.on("mes", function(data) {
        console.log(data);
        socket.emit("blabla", data);
        socket.emit("bla", data);
    });

    //socket.emit('text_msg', {msg: 'Welcome you are now connected.'});

    socket.emit("blabla", 12);
    socket.emit("bla", 123999);

/*    //when we have the message letter, execute the function getLetter
    socket.on('letter', getLetter);

    function getLetter(da) {
        console.log(da);
        socket.broadcast.emit('sequence', da);
    }*/
}

function newConnectionn(socket) {

    console.log("new connection" + socket.id);

    socket.on("mes", function(data) {
        console.log(data);
        socket.broadcast.emit("blabla", data);
        socket.broadcast.emit("bla", data);
    });

    //socket.emit('text_msg', {msg: 'Welcome you are now connected.'});

    socket.emit("blabla", 12);
    socket.emit("bla", 1232222);

    /*    //when we have the message letter, execute the function getLetter
     socket.on('letter', getLetter);

     function getLetter(da) {
     console.log(da);
     socket.broadcast.emit('sequence', da);
     }*/
}

