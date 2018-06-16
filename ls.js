const cli = require('./src/cli');

/**
 * input
 * The output from Gentle. You can use an online version or mac-only version here:
 * https://lowerquality.com/gentle/
 *
 * Gentle is a lip-sync analysis utility that can find phoneme timings.
 * You give it the audio file (wav file only) and a transcript (text).
 * It will generate timings as a json file. This script uses JSON that
 * Gentle generates and produces VAM animated lipsync.
 */
const INPUTALIGN = cli.args.input ? cli.args.input : 'sampleinput/align.json';

/**
 * morphs
 * The set of morphs we'll be using to generate lipsync.
 * This is a raw animation pattern you can load in VAM and check out, modify.
 * If you make your own or replace this, the "displayName" of each trigger must match.
 * Using this you can make your person speak in a differently animated way.
 */
const INPUTMORPHS = cli.args.morphs ? cli.args.morphs : 'data/morphpattern.json';

/**
 * audio
 * The name of the audio clip you'll be playing alongside the lipsync.
 * This will cause a sound effect trigger to be added at the beginning of the animation pattern.
 * The audio file is not actually used for anything, only for VAM to know to load it. You still need
 * to load it from the Audio section of VAM.
 */
const SOUNDFILE = cli.args.sound ? cli.args.sound : 'ptest4.wav';

/**
 * output
 * Nam of the output
 */
const OUTJSONFILE = cli.args.output ? cli.args.output : 'output_animation_pattern_sample.json';

/**
 * maxphonemeduration
 * How long each phoneme should remain on the face.
 * A "reset to idle" expression is inserted between long durations of no motion.
 * That way the person won't hold their expressions for many seconds...
 */
const MAXPHONEMEDURATION = cli.args.maxphonemeduration ? cli.args.maxphonemeduration : 0.8;

/**
 * resetduration
 * How long it takes to reset from an expression to idle.
 */
const RESETDURATION = cli.args.resetduration ? cli.args.resetduration : 0.2;


/**
 * Whether or not we should print debugging info.
 */
const VERBOSE = cli.args.VERBOSE ? cli.args.VERBOSE : false;


const input = require('./'+INPUTALIGN);
const transitionsAtom = require('./'+INPUTMORPHS);

/**
 * A mapping of phonemes to transition actions.
 */
const phoneMapping = require('./data/phonemap.json');

/**
 * Templates of VAM's JSON format for various things.
 */
const triggerTemplate = require('./data/trigger.json');
const sfx = require('./data/sfx.json');
const animationPatternTemplate = require('./data/animationpattern');

function findById( findId ){
  return function( {id} ){
    return findId === id;
  }
}

/**
 * Collect all visemes into a lookup table
 * Key is the name and the value is a list of VAM transitions.
 */
const transitions = {};
transitionsAtom
  .atoms.find( findById('AnimationPattern') )
  .storables.find( findById('AnimationPattern') )
  .triggers
  .forEach( function( trigger ){
    const {displayName, transitionActions } = trigger;
    transitions[ displayName ] = transitionActions;
  });


/**
 * Build a list of accepted phoneme morphs and their start/end times.
 * Not all phonemes have associated morphs so we throw them out.
*/
let intermediary = input.words.reduce( function( morphTimings, word ){

  const start = word.start;
  let currentDuration = 0;

  if(VERBOSE){
    console.log(word.alignedWord);
  }

  const morphTiming = word.phones
  .map(function( phone, index ){

    //  gentle phonemes have suffixes which are too detailed for us, throw them out
    const phonePrefix = phone.phone.substring(0,phone.phone.indexOf('_'));

    const morphSet = phoneMapping[ phonePrefix ];
    if( morphSet === undefined ){
      return;
    }

    if(VERBOSE){
      console.log(phonePrefix, '--->',phoneMapping[phonePrefix]);
    }

    const timing = {
      start: start + currentDuration,
      end: start + currentDuration + phone.duration,
      morphSet: morphSet
    };

    currentDuration += phone.duration;
    return timing;
  })
  .filter(function( morphTiming ){
    return morphTiming !== undefined && morphTiming.morphSet !== undefined;
  });
  morphTimings = morphTimings.concat( morphTiming );
  return morphTimings;
}, [] );


/**
 * Go through each phoneme and find large gaps.
 * Add a reset animation to each gap.
 */
for( let i=0; i<intermediary.length-1; i++ ){
  const cur = intermediary[i];
  const next = intermediary[i+1];

  if( (next.start - cur.end) > MAXPHONEMEDURATION){
    intermediary.push({
      morphSet: 'RESET',
      start: cur.end,
      end: cur.end + RESETDURATION
    });
    i++;
  }
}

/**
 * Sort by start time.
 */
intermediary = intermediary.sort(function(a,b){
  return a.start - b.start;
});



/**
 * Compute the total duration and apply it to the animation pattern we are about to generate.
 */
const absDuration = Math.max( ...intermediary.map(function(timing){ return timing.end; }) );


/**
 * Create an SFX trigger that we'll add to the beginning of the animation.
 */
const sfxCopy = sfx;
sfxCopy.startActions[0].audioClip = SOUNDFILE;


/**
 * Create an idle animation trigger we'll add to the end of the animation.
 */
const resetCopy = Object.assign({}, triggerTemplate );
resetCopy.startTime = absDuration + 0.1;
resetCopy.endTime = absDuration + 0.25;
resetCopy.transitionActions = transitions.RESET;
resetCopy.displayName = 'RESET';



/**
 * animationPattern is the output we'll be making.
 * Create a copy from the template then fill it with our own information.
 */
const animationPattern = Object.assign( {}, animationPatternTemplate );

/**
 * Fill the animation pattern with the correct timing.
 */
const step = animationPattern
  .atoms
  .find( findById('LipSyncStep') )
  .storables
  .find( findById('Step') );

step.transitionToTime = absDuration + 1;


let triggerCount = 0;

/**
 * Finally, add all the phoneme triggers we've discovered.
 */
animationPattern
  .atoms
  .find( findById('LipSyncPattern') )
  .storables
  .find( findById('AnimationPattern') )
  .triggers = intermediary.map( function( timing ){
    const trigger = Object.assign( {}, triggerTemplate );
    trigger.displayName = timing.morphSet;
    trigger.startTime = timing.start.toString();
    trigger.endTime = timing.end.toString();
    trigger.transitionActions = transitions[ timing.morphSet ];

    triggerCount++;

    if( VERBOSE ){
      console.log(trigger.displayName, trigger.startTime, trigger.endTime);
    }
    return trigger;
  })
  .concat( sfxCopy )
  .concat( resetCopy );

/**
 * Write the file.
 */
const fs = require('fs');
fs.writeFile( 'output/' + OUTJSONFILE, JSON.stringify( animationPattern, null, 2 ), function(){} )

console.log('\nLip syncing words:\x1b[36m', input.words.reduce( function(sentence, word){
  return sentence += word.word + ' ';
}, '') );


console.log('\n\x1b[0mLip Sync Generated. Saved to file:');
console.log('\x1b[32m%s\x1b[0m', '    output/' + OUTJSONFILE);
console.log('\n\x1b[2mAnimation created with', triggerCount, 'triggers' );
console.log('\n\x1b[34mCopy the file to VAM/Saves/AnimationPattern/full folder (create it if it\'s not there).');
console.log('\nIn VAM, create an animation pattern, load preset, and select this file.');
console.log('\n\x1b[0m');
