# cell-games
#Gamifying molecular biology
--------------
This started off as a public engagement project when I was part of UCL's iGEM team during summer 2017. I built 2 games to gamify the central dogma of molecular biology and this is what the installation looked like at the London Science Museum Late event - Cellulates, September 2017: https://vimeo.com/243147845 More details about the purpose of the project: www.flogh.me

`transcription.html` is a Dance Dance Revolution-like game where one learns about how transcription happens inside bacterial cells by pairing up DNA nucleotides to turn them into mRNA

`translation.html` is an arcade game for the translation process, where you need, as a tRNA, to catch the correct Amino Acids, make proteins and fend off the other ones

The whole project is built with p5.js libraries, sockets.io and express.

Required components
---------
Currently, the 2 games also require _an analog joystick_ and a _dancepad_ to be played. I had one version of the Translation game that could be played with a mouse, but would need to find it - it's also a bit boring, as it's too easy.

You can get a joystick off Ebay for $2. A dancepad is a trickier one, as I built it myself and you can find a lot of resources online. 

Packages
---
To run the current games you will need to download and include in your project the following libraries and packages:

`node.js` and `npm`

`p5.js` https://github.com/processing/p5.js/wiki

- `p5.dom.js`
- `p5.sound.js`
- `matter.js`

`sockets.io` https://socket.io/

`Bootstrap 4`

`express` https://github.com/expressjs/express

`johhny-five` https://github.com/rwaldron/johnny-five

You may find better ways to optimize performance or use better libraries. If so, let me know! Make pull requests and fork the project.


In a previous version, I used `p5.serialcontrol` for serial communication with the Arduino: https://github.com/vanevery/p5.serialcontrol/releases , but found `johnny-five` to be much faster. If planning to use the former, also include `p5.serialcontrol.js`



Next steps
-----

The 2 games can communicate with each other via the sockets, but the gameplay needs optimizing and some function need to be faster. Welcoming suggestions on that.

In development
----

Soon (_**ETA** January 2018_), I'll upload my prototype for a live quorum sensing exercise through (hopefully), as webb app, for which I'd definitely appreciate any help/feedback.