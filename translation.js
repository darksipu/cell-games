/**
 * Created by florin on 13/08/2017.
 */

//inData holds the incoming data from the serial
var joyx, joyy;
var futurePos;

//variables for DOM elements
var canvas;
var sheight, swidth;


//variables for communication with the server
var socket;


//gameplay Variables
var acidsgame=[], acidsintro=[];

//------Additions to work on--------------
//get a json file with the amino acid table, and get the codons in order - we push a new target when the other person
//gives us 3 letters - the baddies are randomly generated, while the actual sequence is given by the other guy
//if a mutation is introduced, we can put the seek area for the baddies as higher, so they hunt you down
//----------------------------------------

var acidlist = ["Met", "Lys", "Arg", "Leu", "Asn", "Ser", "Gln", "His", "Cys", "Glu"];
var desiredchain = ["Met", "Gly","Leu", "Asp", "Arg", "Ser", "His", "Glu", "Leu", "Gly", "Asn", "His", "Asp", "Met", "Arg", "Leu"];
var desiredchainintro = ["Met", "Gly","Leu", "Asp"];
var tRNA, lives=500;
var stage=1;

//do we need a new target?
var needTarget=true;
var nextTarget = 0;


var myFont;
var timestarted;

//DOM variables
var firstpage, gamepage, gameover, targetmes, scoremes;

//sound variables
var ouch, welcome, yes, getwrecked, happy;

function preload() {
    myFont = loadFont("assets/ensoBold.ttf");
    firstpage = select("#intro");
    gamepage = select("#game");
    gameover = select("#gameover");
    targetmes = select("#target");
    scoremes = select("#score");
    ouch = loadSound('assets/ouch.mp3');
    yes = loadSound("assets/yes.mp3");
    getwrecked = loadSound('assets/endsad.mp3');
    happy = loadSound("assets/endhappy.mp3");
    welcome = loadSound('assets/endhappy.mp3');

    //getting screen size
    sheight = screen.height;
    swidth = screen.width;

    //connecting to the server, as it runs on port
    socket = io.connect('http://localhost:3000');
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
    tRNA = new Me(300, 300, 40);
    welcome.play();
}

//---------------on START, we can start the game--------------------------


function draw() {
    clear();
    //background(51);
    socket.on("joyx", function (data) {
        futurePos.x = map(data, -1, 1, width, 0);
    });

    socket.on("joyy", function(data) {
        futurePos.y = map(data, -1, 1, height, 0);
    });

    socket.on('sequence', function(fata) {
        console.log(fata);
    });

    if (stage===1) {


        //putting a border around the canvas
        noFill();
        stroke(0);
        rect(11, 0, swidth-12, sheight-1);

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
                needTarget = true;
                nextTarget=0;
                stage=2;
                timestarted=frameCount;
            }
        }
        //increasing the time for the Perlin Noise
        ti+=0.005;
        t2i+=0.01;
    } else if (stage===2) {

        noFill();
        textFont(myFont);
        textSize(30);

        //putting a border around the canvas and displaying the life
        stroke(0);
        rect(11, 0, width-12, height-1);
        //life
        noStroke();
        fill(50, 240, 0);
        rect(750, 600, 25, -lives);

        firstpage.style("display", "none");
        gamepage.style("display", "inline-block");
        //updating the DOM elements on the page
        targetmes.html(desiredchain[nextTarget]);
        scoremes.html(nextTarget + "/9");

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
    }

    //calling the functions for the tRNA to display it and then update its position
    tRNA.display();

    //this ensures that the position moves only when we move it, by not doing anything when the joystick says it's in the middle
    if (futurePos.x <=588 || futurePos.x >=589 || futurePos.y <=353 || futurePos.y >=355) {
        tRNA.moveMe(futurePos.x, futurePos.y);
        //console.log(futurePos);
    }
    if (lives===0) {
        gameOVER(2);
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
                acids.push(new Particle(100 + ran * 50, 100 + ran * 50, 100, 0, desired[nextTarget], ra, g, b, true));
                //console.log("CATCH the " + desired[nextTarget]);
                needTarget = false;
            }
        } else if (version===2) {

            //add a couple of AAs that are not targets in the first 6s after we entered stage 2
            if (needTarget === false || frameCount < timestarted + 450) {
                console.log("Reached phase 2");
                acids.push(new Particle(100 + ran * 50, 100 + ran * 50, 100, 0, acidlist[ran], ra, g, b, false));
                console.log("Added a NORMAL");

            } else if (needTarget === true && frameCount > timestarted + 600) {

                //we first remove any acids that are the same as the next target and then add it
                for (var k = 0; k < acids.length; k++) {
                    if (acids[k].what === desired[nextTarget]) {
                        acids.splice(k, 1);
                    }
                }
                acids.push(new Particle(100 + ran * 50, 100 + ran * 50, 100, 0, desired[nextTarget], ra, g, b, true));
                console.log("CATCH the " + desired[nextTarget]);
                needTarget = false;
            }
        }
    }
}

function displaySequence(data, v) {
    //codons.push(data.what);
    if (v===1) {
        futurePos.x = map(data, 0, 1, 0, width);
    } else if (v===2) {
        futurePos.y = map(data, 0, 1, 0, height);
    }
}

function gameOVER(type) {
    stage=3;
    lives-=1;
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