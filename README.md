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
node ls.js input=align.json sound=audio.wav output=animation.json

### License
Licensed under [WTFPL](http://www.wtfpl.net/about/)