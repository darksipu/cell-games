/**
 * Created by florin on 13/08/2017.
 */

//ARDUINO COMM
var serial;
//here this will change depending on what the port is called on the computer
var portName = '/dev/cu.usbmodem1421';

//inData holds the incoming data from the serial
var inData, joyx, joyy;
var futurePos;

//variables for DOM elements
var canvas;
var firstpage, gamepage, gameover, targetmes, scoremes, button, button2, input, highscore, started=false;
var sheight, swidth;


//gameplay Variables
var acidsgame=[], acidsintro=[];
var acidlist = ["Met", "Lys", "Arg", "Leu", "Asn", "Ser", "Gln", "His", "Cys", "Glu"];
var desiredchain = ["Met", "Gly","Leu", "Asp", "Arg", "Ser", "His", "Glu", "Leu", "Gly", "Asn", "His", "Asp", "Met", "Arg", "Leu"];
var desiredchainintro = ["Met", "Gly","Leu", "Asp"];
var tRNA, lives=300;
var stage=0, acids_left = desiredchain.length;

//do we need a new target?
var needTarget=true;
var nextTarget = 0;

var myFont;
var timestarted, players=[], player=[["",""]], whowins;

//sound variables
var ouch, welcome, yes, getwrecked, happy;

function preload() {
    //getting screen size
    sheight = screen.height;
    swidth = screen.width;

    //other DOM elements
    myFont = loadFont("ensoBold.ttf");
    firstpage = select("#intro");
    gamepage = select("#game");
    gameover = select("#gameover");
    targetmes = select("#target");
    scoremes = select("#score");
    ouch = loadSound('ouch.mp3');
    yes = loadSound("yes.mp3");
    getwrecked = loadSound('endsad.mp3');
    happy = loadSound("endhappy.mp3");
    welcome = loadSound('endhappy.mp3');

    //connecting to the server, as it runs on port 3000
    //socket = io.connect('http://localhost:3000');
}

//time for perlin noise
var t=0, ti=0;
var t2=0, t2i=0;

//physics variables
var friction = -0.9;
var spring = 0.03;


function setup() {
    //setting up the canvas size and its position
    canvas = createCanvas(swidth, sheight);
    canvas.position(0, 0);
    //the future position will be given by the joystick
    futurePos= createVector(300, 300);

    //the tRNA is the control in this game
    tRNA = new Me(swidth/2, sheight/2, swidth*0.05);
    //DOMs
    button2 = createButton('Play again').addClass('btn-primary').addClass('btn-lg');
    button =  createButton('Time to roll').addClass('btn-primary').addClass('btn-lg');

    button.hide();
    button2.hide();

    input = createInput();
    input.hide();

    //scores
    highscore=createArray(10,2);
    //sound
    welcome.play();

    //------------------All the needed functions and callbacks for the serial communication-------------------------
    serial = new p5.SerialPort();       // make a new instance of the serialport library
    //serial.on('list', printList);  // set a callback function for the serialport list event

    serial.on('connected', serverConnected); // callback for connecting to the server
    serial.on('open', portOpen);        // callback for the port opening
    serial.on('data', serialEvent);     // callback for when new data arrives
    serial.on('error', serialError);    // callback for errors
    serial.on('close', portClose);      // callback for the port closing

    serial.list();                      // list the serial ports
    serial.open(portName);              // open a serial port

}

//---------ARDUINO functions--------------
function serverConnected() {
    console.log('connected to server.');
}

function portOpen() {
    console.log('the serial port opened.');
}


//----------------reads each line in the serial buffer and gives us the X and Y from Arduino
function serialEvent() {
    inData = serial.readLine();
    trim(inData);

    if (inData.length > 0) {
        joyx = inData.slice(0,2);
        joyy=inData.slice(3,5);
        futurePos.x = map(joyx, 10, 18, 0, width);
        futurePos.y = map(joyy, 10, 18, 0, height);

        //completes the handshaking with the ARDUINO, which sends data only when it receives the below X
        serial.write("x");
    }
}

function serialError(err) {
    console.log('Something went wrong with the serial port. ' + err);
}

function portClose() {
    console.log('The serial port closed.');
}

//---------------on START, we can start the game--------------------------
function draw() {
    clear();
    //background(51);

    if (stage===0) {
        firstpage.style("display", "none");

        input.position(swidth*0.4, sheight*0.4);
        input.show()

        button.position(input.x+12, sheight*0.5);
        button.show();
        button.mousePressed(greet);

        //stage==1 is for trying out the controls and figuring out the rules
    } else if (stage===1) {

        //make DOM elements appear and disappear
        firstpage.style("display", "inline-block");
        input.hide();
        button.hide();

        //incoming data from the server
        //socket.on('sequence', displaySequence);
        //putting a border around the canvas
        noFill();
        stroke(0);
        rect(5, 0, swidth*0.75, sheight*0.85);

        //adding amino acids
        addAcid(acidsintro, 1, desiredchainintro);

        //for the perlin noise
        var xi = map(noise(ti), 0, 1, -.03, .03);
        var yi = map(noise(t2i), 0, 1, -.03, .03);

        //moving, displaying and applying forces to the amino acid
        for (var i = acidsintro.length - 1; i >= 0; i--) {
            acidsintro[i].display();
            acidsintro[i].applyForce(xi, yi);
            //acidsintro[i].seek();
            acidsintro[i].move();

            //checks to see if it collides and applies the necessary forces
            for (var id = i - 1; id >= 0; id--) {
                acidsintro[i].collide(id);
            }

            //remove them if their caught --NEED to count how many AAs on the screen and then end game if the last one was removed
            if (acidsintro[i].caught() && acidsintro[i].target === true && nextTarget!==desiredchainintro.length-1) {
                yes.play();
                acidsintro.splice(i, 1);
                needTarget = true;
                nextTarget += 1;
            } else if (acidsintro[i].caught() && acidsintro[i].target === true && nextTarget===desiredchainintro.length-1) {
                yes.play();
                acidsintro.splice(i, 1);
                //console.log("It happened");
                nextTarget=0;
                needTarget = true;
                timestarted=frameCount;
            }
        }
        //increasing the time for the Perlin Noise
        ti+=0.005;
        t2i+=0.01;

    } else if (stage===2) {

        firstpage.style("display", "none");

        noFill();
        textFont(myFont);
        textSize(30);


        //putting a border around the canvas and displaying the life
        stroke(0);
        rect(5, 0, swidth*0.75, sheight*0.85);
        //life
        noStroke();
        fill(50, 240, 0, 200);
        rect(swidth*0.765, sheight*0.85, 280, -lives);


        gamepage.style("display", "inline-block");
        //updating the DOM elements on the page
        targetmes.html(desiredchain[nextTarget]);
        scoremes.html(nextTarget + "/"+desiredchain.length);

        //makes the perlin noise
        var xt = map(noise(t), 0, 1, -.03, .03);
        var yt = map(noise(t2), 0, 1, -.03, .03);

        //goes through each acid, displays it, applies any necessary forces, checks for the tRNA and moves
        for (var i = acidsgame.length -1; i >= 0; i--) {
        acidsgame[i].display();
        acidsgame[i].applyForce(xt, yt);
        acidsgame[i].seek();
        acidsgame[i].move();

        //checks to see if it collides and applies the necessary forces
        for (var id=i-1; id >=0; id--) {
            acidsgame[i].collide(id);
        }

        //to control the lifetime of an acid
        acidsgame[i].lifetime+=1;

        //remove the ones that live more than 12s
        if (acidsgame[i].lifetime>1000 && acidsgame[i].target===false) {
            acidsgame.splice(i, 1);
        }

        //remove them if their caught --NEED to count how many AAs on the screen and then end game if the last one was removed
        if (acidsgame[i].caught() && acidsgame[i].target===true && nextTarget!==desiredchain.length-1) {
            yes.play();
            acidsgame.splice(i,1);
            needTarget=true;
            nextTarget+=1;
            acids_left--;
        } else if(acidsgame[i].caught() && acidsgame[i].target ===false) {
            lives-=1;
            ouch.play();
            background(250, 0, 0, 200);
        } else if (acidsgame[i].caught() && acidsgame[i].target===true && nextTarget===desiredchain.length-1) {
            yes.play();
            acidsgame.splice(i,1);
            //nextTarget=0;
            gameOVER(1);
        }
        }

    //console.log(acids.length);

    //adds new acids
        addAcid(acidsgame, 2, desiredchain);
        t+=0.005;
        t2+=0.01;
    } else if (stage===3) {

        //the title
        textSize(50);
        fill(150, 0, 50);
        textFont(myFont);
        text("TOP TEN TRANSLATORS", swidth*0.05, sheight*0.1);

        fill(0);
        textFont(myFont);
        textSize(35);
        //these had to be done 'manually', as the for loop would give flashy text
        text(highscore[0][0], swidth*0.1, sheight*0.20);
        text(highscore[0][1], swidth*0.40, sheight*0.20);

        text(highscore[1][0], swidth*0.1, sheight*0.25);
        text(highscore[1][1], swidth*0.40, sheight*0.25);

        text(highscore[2][0], swidth*0.1, sheight*0.30);
        text(highscore[2][1], swidth*0.40, sheight*0.30);

        text(highscore[3][0], swidth*0.1, sheight*0.35);
        text(highscore[3][1], swidth*0.40, sheight*0.35);

        text(highscore[4][0], swidth*0.1, sheight*0.40);
        text(highscore[4][1], swidth*0.40, sheight*0.40);

        text(highscore[5][0], swidth*0.1, sheight*0.45);
        text(highscore[5][1], swidth*0.40, sheight*0.45);

        text(highscore[6][0], swidth*0.1, sheight*0.50);
        text(highscore[6][1], swidth*0.40, sheight*0.50);

        text(highscore[7][0], swidth*0.1, sheight*0.55);
        text(highscore[7][1], swidth*0.40, sheight*0.55);

        text(highscore[8][0], swidth*0.1, sheight*0.60);
        text(highscore[8][1], swidth*0.40, sheight*0.60);

        text(highscore[9][0], swidth*0.1, sheight*0.65);
        text(highscore[9][1], swidth*0.40, sheight*0.65);
        /*            }
         }*/

        button2.position(swidth/2, sheight/2);
        button2.show();
        button2.mousePressed(playAgain);
        //checks the scores to put people into the high score board


    }
    //calling the functions for the tRNA to display it and then update its position
    tRNA.display();

    //this ensures that the position moves only when we move it, by not doing anything when the joystick says it's in the middle
    if (joyx !=14 || joyy !=14) {
        tRNA.moveMe(futurePos.x, futurePos.y);
    }

    if (lives <= 0) {
        gameOVER(2);
    } else if (acids_left===0) {//all amino acids are caught
        gameOVER(1);
    }

}

//starts the game and the song
function keyPressed() {
    if (keyCode===UP_ARROW && started===false) {
        stage = 2;
        started=true;
        input.value('');
        players.push(player);
    } else if (keyCode===DOWN_ARROW) {
        terminate=true;
        stage = 3;
        gameOVER();
    }
}

function addAcid(acids, version, desired) {
    if (frameCount===0 || frameCount%150===0) {
        //ran = Math.floor(Math.random() * 9);
        var ra = Math.floor(Math.random() * 250);
        var g = Math.floor(Math.random() * 250);
        var b = Math.floor(Math.random() * 250);

        var banned = desired[nextTarget];
        var ran = Math.floor(Math.random() * 9);

        while (acidlist[ran]===banned) {
            ran=Math.floor(Math.random() * 9);
        }

        if (version===1) {
            if (needTarget === true && frameCount > 200) {
                acids.push(new Particle(100 + ran * 50, 100 + ran * 50, swidth*0.05, 0, desired[nextTarget], ra, g, b, true));
                //console.log("CATCH the " + desired[nextTarget]);
                needTarget = false;
            }
        } else if (version===2) {

            //add a couple of AAs that are not targets in the first 6s after we entered stage 2
            if (needTarget === false || frameCount < timestarted + 450) {
                //console.log("Reached phase 2");
                acids.push(new Particle(100 + ran * 50, 100 + ran * 50, swidth*0.05, 0, acidlist[ran], ra, g, b, false));
                //console.log("Added a NORMAL");

            } else if (needTarget === true && frameCount > timestarted + 600) {

                //we first remove any acids that are the same as the next target and then add it
                for (var k = 0; k < acids.length; k++) {
                    if (acids[k].what === desired[nextTarget]) {
                        acids.splice(k, 1);
                    }
                }
                acids.push(new Particle(100 + ran * 50, 100 + ran * 50, swidth*0.05, 0, desired[nextTarget], ra, g, b, true));
                //console.log("CATCH the " + desired[nextTarget]);
                needTarget = false;
            }
        }
    }
}

function gameOVER(type) {
        lives=300;
        stage=3;

        checkScore(players);

        gameover.style("display", "flex");
        gamepage.style("display", "none");

        //ouch.pause();

        //play different tunes
        if (type===1) {
            happy.play();
        } else if (type===2) {
           getwrecked.play();
        }
        fill(250);
 }

function playAgain() {
    stage=0;
    //console.log(stage);
    clear();
    button2.hide();

    terminate=false;
    started=false;
    acids_left=desiredchain.length;


    gameover.style("display", "none");

    if(acidsintro.length>0) {
        for (var i=acidsintro.length-1; i>=0; i--) {
            acidsintro.splice(i,1);
        }
    }

    if(acidsgame.length>0) {
        for (var i=acidsgame.length-1; i>=0; i--) {
            acidsgame.splice(i,1);
        }
    }

}

//checks all the scores for players and then compiles a high score board
function checkScore(people) {
    for (var i=0; i<highscore.length; i++) {
        highscore[i]=["",""];
    }
    //console.log(highscore);

    for(var i=0; i<people.length; i++) {
        whowins = people.sort(function (a, b) {
            return b[1] - a[1]});
    }

    for (var j=0; j<whowins.length;j++) {
        highscore[j] = [whowins[j][0], whowins[j][1],1];
    }
    //console.log(people);
    //console.log(highscore);
}

function greet() {
    var name = input.value();
    player = [name,0];
    stage=1;
}

//function to create arrays of desired length
function createArray(length) {
    var arr = new Array(length || 0),
        i = length;

    if (arguments.length > 1) {
        var args = Array.prototype.slice.call(arguments, 1);
        while(i--) arr[length-1 - i] = createArray.apply(this, args);
    }

    return arr;
}