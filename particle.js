function Particle(x, y,r, life, letter, ra, g, b, which) {
    this.position = createVector(x, y);
    this.r = r;
    this.acceleration = createVector(0, 0);
    this.velocity = createVector(0, 0);
    this.lifetime = life;
    this.what = letter;
    this.target = which;
    this.maxSpeed = 3;
    this.maxForce = .1;

    //displays the object
    this.display = function() {
        stroke(0);
        textSize(swidth*0.025);
        fill(ra, g, b, 200);
        ellipse(this.position.x+swidth*0.021, this.position.y - swidth*0.01, this.r+8, this.r+8);
        noStroke();
        fill(250);
        text(this.what, this.position.x, this.position.y);
    }

    this.applyForce = function(a, b) {
        this.acceleration.add(a, b);
    }
    //moves the object by applying acceleration to velocity and then the velocity to the position to update it
    this.move = function() {
        //adding to the velocities
        this.velocity.add(this.acceleration);

        //collision with the walls
        if (this.position.x +swidth*0.021 + this.r/2 > swidth*0.75) {
            this.position.x = swidth*0.75 - this.r/2;
            this.velocity.x *= friction;
        }
        else if (this.position.x + swidth*0.021 - this.r/2 < 5) {
            this.position.x = this.r/2;
            this.velocity.x *= friction;
        }

        if (this.position.y - swidth*0.01 + this.r/2 > sheight*0.85) {
            this.position.y = sheight*0.85 - this.r/2;
            this.velocity.y *= friction;

        } else if (this.position.y - swidth*0.01 - this.r/2 < 0) {
            this.position.y = this.r/2;
            this.velocity.y *= friction;
        }

        //adding the velocity to the location
        this.velocity.limit(this.maxspeed);
        this.position.add(this.velocity);
        this.acceleration.mult(0);
    }


    //the collision function

    this.collide = function(id) {
        W = acidsgame[id];
        var distance = createVector(W.position.x - this.position.x, W.position.y - this.position.y);

        //var distance = Math.sqrt(Math.pow(distancex, 2)+ Math.pow(distancey,2));
       // console.log(distance);
        var minDist=W.r/2 + this.r/2+10;

        if (distance.mag() <= minDist) {
            var angle = Math.atan2(distance.y, distance.x);
            var targetX = this.position.x + Math.cos(angle)*minDist;
            var targetY = this.position.y + Math.sin(angle)*minDist;
            var ax=(targetX-W.position.x)*spring;
            var ay=(targetY-W.position.y)*spring;
            this.velocity.sub(ax, ay);
            W.position.add(ax, ay);
        }

    }


    //senses if it's caught by the mouse
    this.caught = function() {
        var dist = createVector(tRNA.position.x - this.position.x, tRNA.position.y-this.position.y);
        return dist.mag()<20;
    }
    //wants to be caught by the mouse, but it's the non-target ones
    this.seek= function() {
        var dist = createVector(tRNA.position.x - this.position.x, tRNA.position.y-this.position.y);
        if (dist.mag()<175 && this.target === false){
            var desired = createVector(tRNA.position.x - this.position.x, tRNA.position.y - this.position.y);

            if (dist.mag() < 100) {
                m=map(dist.mag(), 0, 100, 0, this.maxSpeed);
                desired.setMag(m);
            } else {
                desired.setMag(this.maxSpeed);
            }

            steer = createVector(desired.sub(this.velocity));
            steer.limit(this.maxForce);
            this.applyForce(steer.x, steer.y);
        }


    }

}

function Me(x, y, r) {
    this.position = createVector(x, y);
    this.r = r;
    this.acceleration = createVector(0, 0);
    this.velocity = createVector(0, 0);
    this.maxSpeed = 6;
    this.maxForce = .1;

    //displays the object
    this.display = function () {
        stroke(0);
        fill(150, 200);
        ellipse(this.position.x, this.position.y, this.r, this.r);
    }

    this.applyForce = function (a, b) {
        this.acceleration.add(a, b);
    }


    //wheretox and wheretoy are the X and Y where the object should move and we calculate steering forces based on that
    this.moveMe = function (wheretox, wheretoy) {

        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxspeed);

        //update the position by adding velocity
        this.position.add(this.velocity);

        //prevent the acceleration from becoming ridiculously large
        this.acceleration.mult(0);

        var distance = createVector(wheretox - this.position.x, wheretoy.y - this.position.y);

        if (distance.mag() !== 0) {

            var desiredPos = createVector(wheretox - this.position.x, wheretoy - this.position.y);

            if (distance.mag() < 20) {
                m=map(distance.mag(), 0, 20, 0, this.maxSpeed);
                desiredPos.setMag(m);
            } else {
                desiredPos.setMag(this.maxSpeed);
            }


            steerme = createVector(desiredPos.sub(this.velocity));
            steerme.limit(this.maxForce);
            this.applyForce(steerme.x, steerme.y);

        }
    }
}