// set up querty-hancock keyboard
var keyboard = new QwertyHancock({
  id:      'keyboard',
  width:   800,
  height:  200,
  octaves: 3
})

// object to store active oscillators
var oscillators = {};

// set up web audio api
var context      = new AudioContext(),
    masterVolume = context.createGain();

// context.destination ~= master out
// chains look roughly like osc -> effects/filters -> masterVolume -> context.destination aka speakers or headphones
masterVolume.gain.value = 0.3;
masterVolume.connect(context.destination);

function Oscillator(context, wave, freq){
  this.osc = context.createOscillator();
  this.osc.type = wave;
  this.setFrequency(freq);
  this.osc.start(0);

  this.input = this.osc;
  this.output = this.osc;

}

// document.addEventListener('click', function(){
//   console.log('click!');
// })


keyboard.keyDown = function (note, frequency) {
  var osc = context.createOscillator();
  var osc2 = context.createOscillator();
  var oscVolume = context.createGain();

  osc.start(context.currentTime);
  osc2.start(context.currentTime);

  osc.type = 'square';
  osc2.type = 'sawtooth';
  osc2.gain = 0.3;

  // set gain for both oscillators
  oscVolume.gain.value = 0;
  oscVolume.gain.setTargetAtTime(1, context.currentTime, 0.001);

  osc.frequency.value  = frequency;
  osc2.frequency.value = frequency;
  osc.detune.value = -5;
  osc2.detune.value = 5;


  // (osc, osc2) -> oscVolume -> master out
  osc.connect(oscVolume);
  osc2.connect(oscVolume);
  oscVolume.connect(masterVolume);

  oscObject = {
    voices: [osc],
    volume: oscVolume
  }

  oscillators[frequency] = oscObject;

}

keyboard.keyUp = function (note, frequency) {

  oscillators[frequency].volume.gain.setTargetAtTime(0, context.currentTime, 0.5);

}
