/**
 * Created by florin on 13/08/2017.
 */

//the control arrows
function Arrow(x, y, s, im, no) {
    this.x = x;
    this.y = y;
    this.size = s;
    this.direction = no;

    this.display = function () {
            image(im, this.x, this.y, this.size, this.size);
    }

    this.overlap = function(other) {

        var otherx = other.x;
        var othery = other.y;

        return this.x === otherx && this.y <= othery + 30 && this.y >= othery - 30;
    }

}

//the falling arrows
function DNA(x, y, s, im, no, see) {
    this.x=x;
    this.y=y;
    this.size=s;
    this.direction = no;
    this.visible = see;

    this.display = function() {
        if (this.visible === 1) {
            image(im, this.x, this.y, this.size, this.size);
            //console.log(this.visible);
        }
    }

    this.move = function (z) {
        this.y+=z;
    }

    this.offBound = function () {
        return this.y > sheight*0.75;
    }
}

//the object for messages to be displayed
function Message(x, y, mess, col) {
    this.x=x;
    this.y=y;
    this.message = mess;
    this.lifetime = 255;
    this.col = createVector(col.x, col.y, col.z);

    this.show = function() {
        textFont(myFont);
        textSize(50);
        fill(this.col.x, this.col.y, this.col.z, this.lifetime/2);
        text(this.message, this.x, this.y);
    }

    this.update = function() {
        this.lifetime -= 3;
    }

}