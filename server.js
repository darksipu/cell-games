/**
 * Created by florin on 13/09/2017.
 */

var express = require("express");

var app = express();

//listening on port 30000
var server = app.listen(3000);

//using the static files from the folder public - host everything from here
app.use(express.static('public'));

//getting the socket library
var socket = require("socket.io");

var io = socket(server);

//on a new conection, we call the function to tell us what to do when we have a new connection
io.sockets.on("connection", newConnection);

/*function sendInput (input){
 AJAX localhost:
 }*/

//var dict = {};


function newConnection(socket) {
    console.log("new connection" + socket.id);

    //when we have the message letter, execute the function getLetter
    socket.on('letter', getLetter);

    function getLetter(da) {
        console.log(da);
        socket.broadcast.emit('sequence', da);
    }

    // dict["blabla"] = name;
}