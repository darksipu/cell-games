/**
 * Created by florin on 13/08/2017.
 */

//ARDUINO COMM
var serial;
var portName = '/dev/cu.usbmodem1421';
//inData holds the incoming data from the serial and the individual letters are for each arrow (Up, Down, Left, Right)
var inData, u=0, d=0, l=0, r=0;

//these will tell us if the right arrows are pressed
var upress=false, dpress=false, lpress=false, rpress=false;
var sheight, swidth, sarrow, arrowspeed, arrowy, DNAy;


//variables for DOM elements
var canvas, song, input;

//audio stuff
var bands, a;
var averages;
var speeds = [30, 60, 120, 150, 210];
var yeah=false, terminate=false, whowins;

//variables for communication with the server
//var socket;

//variables for the game
var letters=[];
var arrows = [], openingarrows=[];
var patterns, c=0, up, down, left, right;
var say=["SCHWIFTYYY", "FANTASTIC", 'GREAT', 'DAAAAAAMN', 'AWESOME'];
var saynegative = ["OUCH", "MUTATION", "TRY AGAIN", "TIME TO GO HOME"];
var songduration=0;

//stage0 - enter the name
//stage1 - instructions
//stage2 - the game
//stage3 - the end
//stage4 - play again?

var stage=0, player=[["lala", 0]], highscore, started=false, players=[];

//controls the DOM for the instructions page, which will disappear when we start the game
var firstpage, scoremes, gamepage, message, button, button2, myFont2;

//mutation levels
var mutation = 0, myscore=0;

//---------------------------preloads the ids for the HTML elements
function preload() {
    //loading fonts
    myFont = loadFont("sude.ttf");
    myFont2 = loadFont("quick.otf");

    //getting screen size
    sheight = screen.height;
    swidth = screen.width;
    //the size of the arrows
    sarrow = screen.width*0.13;
    //the y coordinate for the arrow controls
    arrowy = screen.height*0.65;
    //where the DNA letters will be spawned
    DNAy = screen.height*0.05;
    //the speed with which the arrows fall
    arrowspeed = screen.height*0.007;

    //selecting the DOM elements
    firstpage = select("#intro1");
    gamepage = select("#game");
    gameover = select("#gameover");
    scoremes = select("#score");
    //telling the socket to connect to the 3000 port
    //socket = io.connect('http://localhost:3000');
    song = loadSound('trance3.mp3');

    firstpage.style("display", "none");

    for (var i = 0; i < 20; i++) {
        letters[i] = loadImage("arrow" + i + ".png");
        //console.log("Another one");
    }
    //console.log(letters.length);
}
//---------------------------this creates the canvas, positions it, loads the images, assigns objects to the control arrows
function setup() {
    canvas = createCanvas(swidth, sheight);
    canvas.position(0, 0);

    button2 = createButton('Play again').addClass('btn-primary').addClass('btn-lg');
    button =  createButton('Time to roll').addClass('btn-primary').addClass('btn-lg');
    button.hide();
    button2.hide();

    input = createInput();
    input.hide();


    left = new Arrow(swidth*0.1, arrowy, sarrow, letters[4], 0);
    up = new Arrow(swidth*0.35, arrowy, sarrow, letters[2], 2);
    down = new Arrow(swidth*0.6, arrowy, sarrow, letters[13], 3);
    right = new Arrow(swidth*0.8, arrowy, sarrow, letters[18], 1);

    fft = new p5.FFT(0, 1024);
    bands=createArray(4, 256);
    highscore=createArray(10,3);
    averages=createArray(4);
    patterns=createArray(4,4);


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
    console.log('the serial port opened.')
}

//----------------Important for serial communication - reads each line in the serial buffer and then checks whether arrow pressed
function serialEvent() {
    inData = serial.readLine();
    trim(inData);

    if (inData.length > 0) {

        //console.log(inData[0]);
        //console.log(inData[1]);
        //console.log(inData[2]);
        //console.log(inData[3]);

        u = inData[0];
        d= inData[1];
        l= inData[2];
        r= inData[3];

        if(u==='1') {
            upress=true;
        } else {
            upress=false;
        }

        if(d==='1') {
            dpress=true;
        } else {
            dpress=false;
        }

        if(l==='1') {
            lpress=true;
        } else {
            lpress=false;
        }

        if(r==='1') {
            rpress=true;
        } else {
            rpress=false;
        }

       // console.log(inData);

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

//------------On START, it adds DNA when needed and iterates through all the falling arrows to check overlap and move them--------------
function draw() {
    clear();
    //background(51);

    //stage==0 is for entering your name
    if (stage===0) {

        input.position(swidth/2, sheight/2);
        input.show();

        button.position(input.x + 40, sheight/2+100);
        button.show();
        //this happens too many times per second, that's why we have a very large players array
        button.mousePressed(greet);

        //stage==1 is for trying out the controls and figuring out the rules
    } else if (stage===1) {
        //hiding the input field and the button
        input.hide();
        button.hide();


        //displaying the instructions
        firstpage.style("display", "block");

        //doing the demo
        if(frameCount%30===0) {
            if (frameCount % 300 === 0) {
                var ran = Math.floor(Math.random()*100);
                //the first wave or 70% of the time we will get arrows that match
                if (ran>30 || frameCount===300){
                    openingarrows.push(new DNA(left.x,DNAy, sarrow, letters[7], 7, 1));
                    openingarrows.push(new DNA(up.x,DNAy, sarrow, letters[8], 8, 1));
                    openingarrows.push(new DNA(down.x,DNAy, sarrow, letters[14], 14, 1));
                    openingarrows.push(new DNA(right.x,DNAy, sarrow, letters[17], 17, 1));
                    //the following ones are ones that don't match
                } else {
                    openingarrows.push(new DNA(left.x, DNAy, sarrow, letters[6], 6, 1));
                    openingarrows.push(new DNA(up.x, DNAy, sarrow, letters[9], 9, 1));
                    openingarrows.push(new DNA(down.x, DNAy, sarrow, letters[13], 13, 1));
                    openingarrows.push(new DNA(right.x, DNAy, sarrow, letters[18], 18, 1));
                }
                //these are added but are not visible - necessary to keep the array from running out of stuff
            } else {
                openingarrows.push(new DNA(up.x, DNAy, sarrow, letters[6], 6, 0));
                openingarrows.push(new DNA(down.x, DNAy, sarrow, letters[9], 9, 0));
                openingarrows.push(new DNA(left.x, DNAy, sarrow, letters[13], 13, 0));
                openingarrows.push(new DNA(right.x, DNAy, sarrow, letters[18], 18, 0));
            }
        }

        //we go through each arrow, displaying and moving it
        //if we see press and the arrow is for that control, we check overlap
        //if overlap is good and the letter is on the screen, we remove the arrow
        //if the button is pressed but the arrow is not for that control, we show a red screen
        for (var i=openingarrows.length-1; i>=0;i--){
            openingarrows[i].display();
            openingarrows[i].move(2);

            if (upress===true && openingarrows[i].direction === 8) {

                if (up.overlap(openingarrows[i]) === true && openingarrows[i].visible === 1) {
                    openingarrows.splice(i,1);
                }
            } else if (upress===true && openingarrows[i].direction!==8) {
                if (up.overlap(openingarrows[i]) === true && openingarrows[i].visible === 1) {
                    openingarrows.splice(i,1);
                    background(250, 0, 0, 200);
                }
            }

            if (dpress===true && openingarrows[i].direction === 14) {
                if (down.overlap(openingarrows[i]) === true && openingarrows[i].visible === 1) {
                    openingarrows.splice(i,1);
                }
            } else if (dpress===true && openingarrows[i].direction!==14) {
                if (down.overlap(openingarrows[i]) === true && openingarrows[i].visible === 1) {
                    openingarrows.splice(i,1);
                    background(250, 0, 0, 200);
                }
            }

            if (lpress===true && openingarrows[i].direction === 7) {
                if (left.overlap(openingarrows[i]) === true && openingarrows[i].visible === 1) {
                    openingarrows.splice(i,1);
                }
            } else if (lpress===true && openingarrows[i].direction!==7) {
                if (left.overlap(openingarrows[i]) === true && openingarrows[i].visible === 1) {
                    openingarrows.splice(i,1);
                    background(250, 0, 0, 200);
                }
            }

            if (rpress===true && openingarrows[i].direction === 17) {
                if (right.overlap(openingarrows[i]) === true && openingarrows[i].visible === 1) {
                    openingarrows.splice(i,1);
                }
            } else if (rpress===true && openingarrows[i].direction!==17) {
                if (right.overlap(openingarrows[i]) === true && openingarrows[i].visible === 1) {
                    openingarrows.splice(i,1);
                    background(250, 0, 0, 200);
                }
            }

            if (openingarrows[i].offBound()) {
                openingarrows.splice(i, 1);
            }
        }

        //displaying the controls
        image(letters[4],left.x,arrowy, sarrow, sarrow);
        image(letters[2],up.x,arrowy, sarrow, sarrow);
        image(letters[13],down.x,arrowy, sarrow, sarrow);
        image(letters[18],right.x,arrowy, sarrow, sarrow);


        //going stage==2 - the game starts, we remove the instructions and start the music
    } else if (stage===2) {
        //timer for the song
        songduration++;

        //deals with the DOM elements
        firstpage.style("display", "none");
        gamepage.style("display", "inline-block");
        scoremes.html(mutation);

        //displays and fades the messages away
        if (yeah===true) {
            message.show();
            message.update();
        }

        //gets the FFTs into an array
        var spectrum = fft.analyze();

        //splitting the spectrum into 4 bands -- IS THIS NECESSARY?
        for (var i=0; i<spectrum.length; i++) {
            if (i<256) {
                for (var j=0; j<bands[0].length;j++) {
                    bands[0][j] = Number(spectrum[i]);
                }
            } else if (i<512 && i>=256) {
                for (var j=0; j<bands[1].length;j++) {
                    bands[1][j] = Number(spectrum[i]);
                }
            } else if (i<768 && i>=512) {
                for (var j=0; j<bands[2].length;j++) {
                    bands[2][j] = Number(spectrum[i]);
                }
            } else if (i<1024 && i>=768) {
                for (var j=0; j<bands[3].length;j++) {
                    bands[3][j] = Number(spectrum[i]);
                }
            }
        }

        //we display the control arrows
        up.display();
        down.display();
        right.display();
        left.display();

        //addPoint(bands);

        //every 240ms we generate a 4x4 matrix containing the next 4 beats for arrows to be generated
        if(frameCount===0 || frameCount%240===0){
            var time = Math.floor(musictempo(spectrum));
            patt(time);
            //console.log(time);
        }

        //will spawn arrows every half second
        spawn();

        //goes through every falling arrow, displaying it, moving it and checking for overlap
        for (var i = arrows.length - 1; i >= 0; i--) {

            // if visible, then we display
            arrows[i].display();
            arrows[i].move(4);//with a speed of 4px/frame

            //checks if the right one was pressed, if they overlap and if the direction is good
            checking(arrows,arrows[i], i);

            //removes the arrows if they are out of the screen area
            if (arrows[i].offBound()) {
                arrows.splice(i, 1);
            }

        }
    } else if (stage===3) {
        //the title
        textSize(50);
        fill(150, 0, 50);
        textFont(myFont);
        text("TOP TEN TRANSCRIBERS", swidth*0.05, sheight*0.1);

        //displaying the high scores
        fill(0);
        textFont(myFont2);
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

        button2.position(swidth/2, sheight/2);
        button2.show();
        button2.mousePressed(playAgain);
    }

    gameOVER();
}
//---------------adds falling DNA every 80ms---------------
/*
function addDNA() {
    if (frameCount===0 || frameCount%80===0) {
        ran = Math.floor(Math.random() * 4);
        if(ran===0) {

            ran2 = Math.floor(Math.random() * (8-4)+4);
            arrows.push(new DNA(left.x, 50, 100, letters[ran2], ran2));

        } else if (ran===1) {

            ran2 = Math.floor(Math.random() * (20-16)+16);
            arrows.push(new DNA(right.x, 50, 100, letters[ran2], ran2));

        } else if (ran===2) {

            ran2 = Math.floor(Math.random() * (12-8)+8);
            arrows.push(new DNA(up.x, 50, 100, letters[ran2], ran2));

        } else {

            ran2 = Math.floor(Math.random() * (16-12)+12);
            arrows.push(new DNA(down.x, 50, 100, letters[ran2], ran2));
        }

    }
}
*/

//---------------adds falling DNA according to the song---------------
/*

function addPoint(band) {
    for (var n=0; n<band.length;n++) {
        var sum=0;
        for (var k=0; k<band[n].length; k++) {
            sum+=band[n][k];
        }
        averages[n] = sum/256;
    }

    //console.log(averages);

    var y = Math.floor(0.1*averages[0] + 0.1*averages[1] + 0.4*averages[2] + 0.4*averages[3]);
    //console.log(y);
    if(y>90) {
        a=speeds[0];
    } else if (y>70 && y<=90) {
        a=speeds[1];
    } else if (y>50 && y<=70) {
        a=speeds[2];
    } else if (y>=0 && y<=50) {
        a=speeds[3];
    }
    //console.log(x);



}
*/

//gets the average of all the frequencies
function musictempo(spectrum) {
    var sum = 0;
    for (var i=0; i<spectrum.length; i++) {
        sum+=spectrum[i];
    }
    sum=sum/spectrum.length;

    return sum;
}

//function for producing arrows every 30ms and putting them in the arrows array
function spawn() {
    if(frameCount%30===0) {
        //the c tells us which row of the 4x4 matrix we should access - i.e. which beat
        //each arrow has a column, from where we know whether to display it or no (1 or 0)

        var ran = [Math.floor(Math.random()*(12-8)+8), Math.floor(Math.random()*(8-4)+4), Math.floor(Math.random()*(16-12)+12), Math.floor(Math.random()*(20-16)+16)];
        var ran2 = Math.floor(Math.random()*100);

        //in 90% of cases, add a correct DNA letter
        if (ran2>10) {
            arrows.push(new DNA(up.x,DNAy, sarrow, letters[8], 8, patterns[c][1]));
            arrows.push(new DNA(left.x,DNAy, sarrow, letters[7], 7, patterns[c][0]));
            arrows.push(new DNA(down.x, DNAy, sarrow, letters[14], 14, patterns[c][2]));
            arrows.push(new DNA(right.x, DNAy, sarrow, letters[17], 17, patterns[c][3]));
        } else {
            //otherwise, add some random ones
            arrows.push(new DNA(up.x, DNAy, sarrow, letters[ran[0]], ran[0], patterns[c][1]));
            arrows.push(new DNA(left.x, DNAy, sarrow, letters[ran[1]], ran[0], patterns[c][0]));
            arrows.push(new DNA(down.x, DNAy, sarrow, letters[ran[2]], ran[0], patterns[c][2]));
            arrows.push(new DNA(right.x, DNAy, sarrow, letters[ran[3]], ran[0], patterns[c][3]));
        }
        //console.log(patterns[c]);
        c+=1;
        //console.log(arrows);
        //we reset c after it does the last beat, to get the values again for the 4 beats
        if (c===3) {
            c=0;
        }
    }
}


//function to generate patterns for spawning arrows
//this should be activated at the start or at every 240ms (4 beats)
//at the start make sure everything in the array is at 0, then we add the 1s
function patt(ave) {

    //initializing the whole array (the matrix actually) to 0
    for (var i=0; i<patterns.length;i++) {
        for (var j=0; j<patterns[i].length;j++) {
            patterns[i][j]=0;
        }
    }
    //console.log(patterns);
    //tempo will be given by the average of all the frequencies in the song, depending on specific ranges that we'll set


    var tempo;

    //depending on the values that I predefine for each song, tempos will be given
    if (ave>120) {
        tempo = 4;
    } else if (ave>90 && ave<=120) {
        tempo=3;
    } else if (ave<=50) {
        tempo=1;
    } else if (ave > 50 && ave<=90) {
        tempo=2;
    }

    //tempo = Math.floor(Math.random()*(5-1)+1);
    //console.log(tempo);

    //when 1 arrow will be displayed in the 4 beats
    if (tempo===1) {
        var ran1 = Math.floor(Math.random()*4);
        var ran2 = Math.floor(Math.random()*4);
        patterns[ran1][ran2]=1;

        //when 2 arrows will be displayed in 4 beats
    } else if (tempo===2) {
        var coin = Math.floor(Math.random()*2);

        //two arrows will be displayed and they're not on the same row and column
        if (coin===0) {
            var ran4 = Math.floor(Math.random()*4);

            if (ran4!==3) {
                patterns[ran4][ran4+1]=1;
            } else {
                patterns[ran4][ran4-1]=1;
            }

            //getting the second arrow in the matrix
            var sec = Math.floor(Math.random()*4);
            while (sec===ran4) {
                sec = Math.floor(Math.random()*4);
            }
            //making sure we can do it for the last one
            if (sec!=3){
                patterns[sec][sec+1]=1;
            } else {
                patterns[sec][sec-1]=1;
            }

            //when you want them to jump on the left and right at the same time
        } else if (coin===1) {
            var ran3 = Math.floor(Math.random()*4);
            patterns[ran3][0]=1;
            patterns[ran3][3]=1;
        }

        //when 3 arrows are in the 4 beats
    } else if (tempo===3) {

        //get something in the first row
        var first = Math.floor(Math.random()*4);
        patterns[0][first] = 1;
        //for the next 2 ones
        for (var i = 1; i<3; i++){

            var ran5 = Math.floor(Math.random()*4);
            
            while (ran5===first) {
                ran5 = Math.floor(Math.random()*4);
            }
            patterns[i][ran5]=1;
            first=ran5;
        }

        //when 4 arrows are in the 4 beats
    } else if (tempo===4) {

        //setting the first one to a random one
        var ran7 = Math.floor(Math.random()*4);
        patterns[0][ran7] = 1;

        //for the next 3 ones, we check if the column randomly generated for the coming beat is the same as the current one
        // while that's the case, generate a new column and then register the column if you break out of the loop
        for (var i = 1; i<4; i++){
            var third = Math.floor(Math.random()*4);
            while (third===ran7) {
                third = Math.floor(Math.random()*4);
            }
            patterns[i][third]=1;
            ran7=third;
        }
    }

}


//this will check the overlap and they key presses. details inside
function checking(list, nucleotide, no) {
    //UP KEY
    if (upress===true && nucleotide.direction === 8) {

        if (up.overlap(nucleotide) === true && nucleotide.visible === 1) {
            //console.log(arrows[i].y);
            //need to take the arrow out before we display the message - making sure it only displays once
            list.splice(no, 1);
            myscore+=1;

            //getting its color to green
            var colours = createVector(0, 240, 0);

            //selecting a random nice thing to say
            var ran = Math.floor(Math.random()*say.length);
            feedback(say[ran], colours);
            yeah = true;
            //console.log(da.what);
            da.what="G";
        }

    } else if (upress===true && nucleotide.direction!==8) {
        if (up.overlap(nucleotide) === true && nucleotide.visible === 1) {
            //need to take the arrow out before we display the message - making sure it only displays once
            list.splice(no, 1);
            mutation+=1;

            var ran = Math.floor(Math.random()*saynegative.length);
            var colours = createVector(240, 0, 0);
            feedback(saynegative[ran], colours);
            yeah=true;
            da.what=nucleotide.direction;
        }
    }

    //DOWN KEY
    if (dpress===true && nucleotide.direction === 14) {

        if (down.overlap(nucleotide) === true && nucleotide.visible === 1){
            //console.log(arrows[i].y);
            //need to take the arrow out before we display the message - making sure it only displays once
            list.splice(no, 1);
            myscore+=1;

            var colours = createVector(0, 240, 0);
            var ran = Math.floor(Math.random()*say.length);
            feedback(say[ran], colours);
            yeah = true;
            //console.log(da.what);
            da.what="T";
        }

    } else if (dpress===true && nucleotide.direction!==14) {
        if (down.overlap(nucleotide) === true && nucleotide.visible === 1) {
            //need to take the arrow out before we display the message - making sure it only displays once
            list.splice(no, 1);
            mutation+=1;

            var ran = Math.floor(Math.random()*saynegative.length);
            var colours = createVector(240, 0, 0);
            feedback(saynegative[ran], colours);
            yeah=true;
            da.what=nucleotide.direction;
        }
    }

    //LEFT KEY
    if (lpress===true && nucleotide.direction === 7) {

        if(left.overlap(nucleotide) === true && nucleotide.visible === 1) {
            //console.log(arrows[i].y);
            //need to take the arrow out before we display the message - making sure it only displays once
            list.splice(no, 1);
            myscore+=1;

            var colours = createVector(0, 240, 0);
            var ran = Math.floor(Math.random()*say.length);
            feedback(say[ran], colours);
            yeah = true;
            //console.log(da.what);
            da.what="A";
        }

    } else if (lpress===true && nucleotide.direction!==7) {
        if(left.overlap(nucleotide) === true && nucleotide.visible === 1) {
            //need to take the arrow out before we display the message - making sure it only displays once
            list.splice(no, 1);
            mutation+=1;

            var ran = Math.floor(Math.random()*saynegative.length);
            var colours = createVector(240, 0, 0);
            feedback(saynegative[ran], colours);
            yeah=true;
            da.what=nucleotide.direction;
        }
    }

    //RIGHT KEY
    if (rpress===true && nucleotide.direction === 17) {

        if (right.overlap(nucleotide) === true && nucleotide.visible === 1) {
            //need to take the arrow out before we display the message - making sure it only displays once
            list.splice(no, 1);
            myscore+=1;

            var colours = createVector(0, 240, 0);
            var ran = Math.floor(Math.random()*say.length);
            feedback(say[ran], colours);
            yeah = true;
            //console.log(da.what);
            da.what = "C";
        }

    } else if (rpress===true && nucleotide.direction!==17) {
        if (right.overlap(nucleotide) === true && nucleotide.visible === 1) {
            //need to take the arrow out before we display the message - making sure it only displays once
            list.splice(no, 1);
            mutation+=1;

            var ran = Math.floor(Math.random()*saynegative.length);
            var colours = createVector(240, 0, 0);
            feedback(saynegative[ran], colours);
            yeah=true;
            da.what=nucleotide.direction;
        }
    }

    //need to emit the message here
    //socket.emit('letter', da);
}


//----------------previous function for controlling the bottom arrows  - checks the key pressed and whether they overlap-------
/*
function keyPressed() {


    for (var i=arrows.length - 1; i >= 0; i--) {

            if (keyCode === UP_ARROW && arrows[i].direction === 8) {

                if (up.overlap(arrows[i]) === true && arrows[i].visible === 1) {
                    //console.log(arrows[i].y);
                    arrows.splice(i, 1);
                    var colours = createVector(0, 240, 0);
                    feedback("GREAT JOB", colours);
                    yeah = true;
                    //console.log(da.what);
                    //da.what="G";
                } else {
                    mutation += 1;
                    var colours = createVector(240, 0, 0);
                    feedback("OUCH", colours);
                    //console.log("OUCH");
                }
            }

/!*            } else if (keyCode === UP_ARROW && up.overlap(arrows[i]) && arrows[i].direction !== 8) {
                //console.log("Not the right one");
               // mutation += 1;
                var colours = createVector(240, 0, 0);
                feedback("Not the right one", colours);
            }*!/

            if (keyCode === DOWN_ARROW && arrows[i].direction === 14) {

                if (down.overlap(arrows[i]) === true && arrows[i].visible === 1){
                    //console.log(arrows[i].y);
                    arrows.splice(i, 1);
                    var colours = createVector(0, 240, 0);
                    feedback("GREAT JOB", colours);
                    yeah = true;
                    //console.log(da.what);
                    //da.what="T";
                } else {
                    mutation += 1;
                    var colours = createVector(240, 0, 0);
                    feedback("OUCH", colours);
                    //console.log("OUCH");
                }

            }
/!*
            } else if (keyCode === DOWN_ARROW && down.overlap(arrows[i]) && arrows[i].direction !== 14) {
                //console.log("Not the right one!");
                //mutation += 1;
                var colours = createVector(240, 0, 0);
                feedback("Not the right one", colours);
            }*!/

            if (keyCode === LEFT_ARROW && arrows[i].direction === 7) {

                if(left.overlap(arrows[i]) === true && arrows[i].visible === 1) {
                    //console.log(arrows[i].y);
                    arrows.splice(i, 1);
                    var colours = createVector(0, 240, 0);
                    feedback("GREAT JOB", colours);
                    yeah = true;
                    //console.log(da.what);
                    //da.what="A";
                } else {
                    mutation += 1;
                    var colours = createVector(240, 0, 0);
                    feedback("OUCH", colours);
                    //console.log("OUCH");
                }

            }
/!*            } else if (keyCode === LEFT_ARROW && left.overlap(arrows[i]) && arrows[i].direction !== 7) {
                //console.log("Not the right one!");
               // mutation += 1;
                var colours = createVector(240, 0, 0);
                feedback("Not the right one", colours);
            }*!/

            if (keyCode === RIGHT_ARROW && arrows[i].direction === 17) {

                if (right.overlap(arrows[i]) === true && arrows[i].visible === 1) {

                    arrows.splice(i, 1);
                    var colours = createVector(0, 240, 0);
                    feedback("GREAT JOB", colours);
                    yeah = true;
                    //console.log(da.what);
                    // da.what = "C";
                } else {
                    mutation += 1;
                    var colours = createVector(240, 0, 0);
                    feedback("OUCH", colours);
                    //console.log("OUCH");
                }


            }

/!*            } else if (keyCode === RIGHT_ARROW && right.overlap(arrows[i]) && arrows[i].direction !== 17) {
                //console.log("Not the right one");
               // mutation += 1;
                var colours = createVector(240, 0, 0);
                feedback("Not the right one", colours);
            }*!/
    }

}
*/

//starts the game and the song
function keyPressed() {
    if (keyCode===UP_ARROW && started===false) {
        stage = 2;
        song.play();
        started=true;
        players.push(player);
        input.value('');
        console.log(players);
    } else if (keyCode===DOWN_ARROW) {
        terminate=true;
        gameOVER();
    }
}


function greet() {
    var name = input.value();
    player = [name,0];
    stage=1;
}

/// function to create messages during the game with the object Message - see arrows.js
function feedback(mess, colours) {
    message = new Message(Math.floor(Math.random() * (500-70)+70), Math.floor(Math.random() * (400-50)+50), mess, colours);
}

//---------displays the game over page---------
function gameOVER() {
    //this needs to change according to the duration of the song - this is too much
    if (songduration===16800 || terminate===true) {
        players[0][1]=myscore;
        //console.log(players);
        //checks the scores to put people into the high score board
        checkScore(players);
        //console.log(players);
        //moves into the third stage of the game
        song.stop();
        stage=3;
        gameover.style("display", "flex");
        gamepage.style("display", "none");
        fill(250);
        started=false;
    }
}

// function to reset all the variables to their initial state for a new player
function playAgain() {
    stage=0;
    //console.log(stage);
    clear();
    button2.hide();
    terminate=false;
    gameover.style("display", "none");


    if(arrows.length>0) {
        for (var i=arrows.length-1; i>=0; i--) {
            arrows.splice(i,1);
        }
    }
    //console.log(arrows);

    if(openingarrows.length>0) {
        for (var i=openingarrows.length-1; i>=0; i--) {
            openingarrows.splice(i,1);
        }
    }

    //console.log(openingarrows);
}

//checks all the scores for players and then compiles a high score board
function checkScore(people) {
    //making empty fields for the highscores
    for (var i=0; i<highscore.length; i++) {
        highscore[i]=["","",""];
    }

    for(var i=0; i<people.length; i++) {
        whowins = people.sort(function (a, b) {
            return b[1] - a[1]});
    }

    for (var j=0; j<whowins.length;j++) {
        highscore[j] = [whowins[j][0], whowins[j][1],1];
    }
    //console.log(people);
    //console.log(whowins);
    //console.log(highscore);
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