window.onload = init;           // Initialize DrumMachine once everything is loaded
var audioContext, bufferLoader, kick, snare, closedhihat;
var BUFFERS = {};               // Where we store all our buffer references
var drumKit = ['media/closedhihat.wav', 'media/snare.wav', 'media/kick.wav'];
var spaceKit = ['media/HAPTIC04__27_hat.wav', 'media/HAPTIC04__43_rim.wav', 'media/HAPTIC04__02_kick.wav'];
var isPlaying = false;          // Are we currently playing?
var startTime;                  // The start time of the entire sequence.
var current16thNote;            // What note is currently last scheduled?
var tempo = 90;              // tempo (in beats per minute)
var lookahead = 25.0;           // How frequently to call scheduling function 
                                //(in milliseconds)
var scheduleAheadTime = 0.1;    // How far ahead to schedule audio (sec)
                                // This is calculated from lookahead, and overlaps 
                                // with next interval (in case the timer is late)
var nextNoteTime = 0.0;         // when the next note is due.
var noteResolution = 0;         // 0 == 16th, 1 == 8th, 2 == quarter note
var noteLength = 0.05;          // length of "beep" (in seconds)
var canvas,                     // the canvas element
    canvasContext;              // canvasContext is the canvas' context 2D
var last16thNoteDrawn = -1;     // the last "box" we drew on the screen
var notesInQueue = [];          // the notes that have been put into the web audio,
                                // and may or may not have played yet. {note, time}
var timerWorker = null;         // The Web Worker used to fire timer messages
var currentBar  = 0;            // Currently playing bar
var currentBeat = 0;            // Currently playing beat realtive to currentBar
var swing       = [0, 0, 0, 0];

function setSwing(){
    var beatLength = 60/tempo;
    swing[0] = 0;
    swing[1] = beatLength/4;
    swing[2] = beatLength/8;
    swing[3] = beatLength/3.5;
}

function init() {
    audioContext = new AudioContext();
    
    bufferLoader = new BufferLoader(
        audioContext,
        spaceKit,
        finishedLoading
    );
    bufferLoader.load();

    timerWorker = new Worker("js/metronomeworker.js");
    timerWorker.onmessage = function(e) {
        if (e.data == "tick") {
            // console.log("tick!");
            scheduler();
        }
        else
            console.log("message: " + e.data);
    };

    // setSwing();
}

function playSound(buffer, time, velocity) {

    var source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    var gainNode = audioContext.createGain();
    gainNode.gain.value = velocity;

    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (!source.start){
        source.start = source.noteOn;
    }
    source.start(time);
}

function finishedLoading(bufferList) {
    BUFFERS.closedhihat = bufferList[0];
    BUFFERS.snare       = bufferList[1];
    BUFFERS.kick        = bufferList[2];
    kick  = BUFFERS.kick;
    snare = BUFFERS.snare;
    closedhihat = BUFFERS.closedhihat;
}

function play(){
    isPlaying = !isPlaying;

    if (isPlaying) { // start playing
        current16thNote = 0;
        nextNoteTime = audioContext.currentTime;
        timerWorker.postMessage("start");
        return "start!";
    } else {
        timerWorker.postMessage("stop");
        return "stop!";
    }
}

function scheduler() {
    // while there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    while (nextNoteTime < audioContext.currentTime + scheduleAheadTime ) {
        scheduleNote( current16thNote, nextNoteTime );
        nextNote();
    }
}

function scheduleNote( beatNumber, time ) {

    // push the note on the queue, even if we're not playing.
    notesInQueue.push( { note: beatNumber, time: time } );

    if ( (noteResolution==1) && (beatNumber%2))
        return; // we're not playing non-8th 16th notes
    if ( (noteResolution==2) && (beatNumber%4))
        return; // we're not playing non-quarter 8th notes

    // create an oscillator
    // var osc = audioContext.createOscillator();
    // osc.connect( audioContext.destination );

    /*
    if (beatNumber % 16 === 0)    // beat 0 == low pitch
        // osc.frequency.value = 880.0;
        playSound(kick, time);
    else if (beatNumber % 4 === 0 )    // quarter notes = medium pitch
        // osc.frequency.value = 440.0;
        playSound(snare, time);
    else                        // other 16th notes = high pitch
        // osc.frequency.value = 220.0;
        playSound(closedhihat, time);
    */
    // osc.start( time );
    // osc.stop( time + noteLength );
    
    

    for (var instrument in drumPattern[beatNumber]) {

        if ( drumPattern[beatNumber].hasOwnProperty(instrument) ) {
            if ( drumPattern[beatNumber][instrument].isActive ) {
                var swingOffset = swing[currentBeat];
                playSound(BUFFERS[instrument], time + swingOffset, drumPattern[beatNumber][instrument].velocity);
            };
        }
    }

    // console.log(beatNumber);
    metronome.move(beatNumber);

    currentBeat++;
    if (currentBeat == 4) {
        currentBeat = 0;
        currentBar++;
        if (currentBar == 4) {
            currentBar = 0;
        };
    };

}

function nextNote() {

    // Advance current note and time by a 16th note...
    var secondsPerBeat = 60.0 / tempo;    // Notice this picks up the CURRENT
                                          // tempo value to calculate beat length.
    nextNoteTime += 0.25 * secondsPerBeat;    // Add beat length to last beat time

    current16thNote++;    // Advance the beat number, wrap to zero
    if (current16thNote == 16) {
        current16thNote = 0;
    }

}

$('.note').click(function(e){
    var $that = $(this);
    $that.toggleClass('active');
    var beatNumber = parseInt( $that.attr('data-beatNumber') );
    var instrument = $that.attr('data-instrument');
    var velocity = parseInt( $that.attr('data-velocity') );


    drumPattern[beatNumber][instrument].isActive = !drumPattern[beatNumber][instrument].isActive;
    drumPattern[beatNumber][instrument].velocity = velocity;
});