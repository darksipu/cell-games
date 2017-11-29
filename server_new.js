/**
 * Created by florin on 13/09/2017.
 */
'use strict';
//getting the required libraries for the Arduino, the express server and websockets to communication
const five = require('johnny-five');
const express = require('express');
const socket = require("socket.io");

//to
const app = express();
const app2 = express();

const server = app.listen(3000);
const server2 = app2.listen(8080);

const io = socket(server);
const io2 = socket(server2);


const board = new five.Board();

var transfer;

var joyx = 0, joyy = 0;
var up = 0;
var down = 0;
var left = 0;
var right = 0;

var path = require('path');
var path2 = require('path');



//serve all the files in the root of the server
app.use(express.static(__dirname));
app2.use(express.static(__dirname));


// viewed at http://localhost:3000
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/transcription.html'));
});

// viewed at http://localhost:8080
app2.get('/', function(req, res) {
    res.sendFile(path2.join(__dirname + '/translation.html'));
});


//similar to document.ready()
board.on('ready', function() {

    console.log('Arduino is ready.');
    //All the code needed for the joystick

    // Create a new `joystick` hardware instance.
    var joystick = new five.Joystick({
        //   [ x, y ]
        pins: ["A4", "A5"]
    });

    joystick.on("change", function() {
        // console.log("Joystick");
        // console.log("  x : ", this.x);
        // console.log("  y : ", this.y);
        // console.log("--------------------------------------");
        joyx = this.x;
        joyy = this.y;
        //console.log(joyx);
        //console.log(joyy);
        io2.emit('joyx', joyx);
        io2.emit('joyy', joyy);
    });

//------------------------------------------------------------

    var buttons = new five.Buttons({
        pins: [4, 5, 6, 7],
        invert: false,
    });

    buttons.on("press", function(button) {
        //console.log("Pressed: ", button.pin);
        if (button.pin===4){
            up = 0;
            io.emit('up', up);
        } else if (button.pin===5) {
            down=0;
            io.emit('down', down);
        } else if (button.pin===6) {
            left=0;
            io.emit('left', left);
        } else if (button.pin===7) {
            right=0;
            io.emit('right', right);
        }
    });

    buttons.on("release", function(button) {
        //console.log("Released: ", button.pin);
        if (button.pin===4){
            up = 1;
            io.emit('up', up);
        } else if (button.pin===5) {
            down=1;
            io.emit('down', down);
        } else if (button.pin===6) {
            left=1;
            io.emit('left', left);
        } else if (button.pin===7) {
            right=1;
            io.emit('right', right);
        }
    });
//------------------------------------------------------------



// Listen to the web socket connection
    io.on('connection', function(client) {
        console.log("New Transcription connection: " + client.id);

        //when we receive a letter from the Transcription, send it over to the Translation client
        client.on('letter', function(letter) {
            transfer = letter;
            console.log(transfer);
            io2.emit('sequence', transfer);
        });
    });

    //sending Arduino data to the Translation client and then the transfer data from the Transcription client
    io2.on('connection', function(client) {
        console.log("New Translation connection: " + client.id);

/*        //if the transfer variable does contain an actual letter from the other game, send it to the translation client
        if (transfer!==0) {
            client.emit('sequence', transfer);
            transfer = 0;
        }*/
    });



});

