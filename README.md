## VAM Lip Sync Generator

A node command line utility to generate Virt-A-Mate lip sync animation.

Install [node.js](https://nodejs.org/en/)

### Tutorial
Instructional video:
https://imgur.com/a/pAV1wzp

### Generate Lipsync from Gentle

Go here http://gentle-demo.lowerquality.com and upload your audio sample and text transcription.

Then download the align.json file. Run the following command:

### Example Command
```
node ls.js input=align.json sound=audio.wav output=animation.json
```

### Limitations and Issues
* Only the first "Person" atom will be animated.
* The person's morphs must be set to animated before loading the animation pattern. These are:
  * Mouth Narrow
  * Mouth Open Wide 2
  * Lip Bottom Up
  * Lips Close
  * Lips Pucker Wide
* The audio must be loaded before loading the animation pattern.
* Turning off "loop" on your animation pattern will break the triggers.


### License
Licensed under [WTFPL](http://www.wtfpl.net/about/)
