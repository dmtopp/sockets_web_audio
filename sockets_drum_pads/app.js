var context      = new AudioContext(),
    masterVolume = context.createGain();



// set up querty-hancock keyboard
var keyboard = new QwertyHancock({
  id:      'keyboard',
  width:   800,
  height:  200,
  octaves: 3
})

// object to store active oscillators
var oscillators = {};

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

keyboard.data = {
  osc1: 'square',
  osc2: 'triangle',
  attack: 0.001,
  release: 0.5,
  filterType: 'lowpass',
  filterCutoff: 2000,
  osc1Detune: -5,
  osc2Detune: 5
}


keyboard.keyDown = function (note, frequency) {
  var osc = context.createOscillator();
  var osc2 = context.createOscillator();
  var oscVolume = context.createGain();
  var filter = context.createBiquadFilter();

  osc.start(context.currentTime);
  osc2.start(context.currentTime);

  osc.type = keyboard.data.osc1;
  osc2.type = keyboard.data.osc2;

  // set gain for both oscillators
  // start gain at 0 and then ramp up over attack time
  oscVolume.gain.value = 0;
  oscVolume.gain.setTargetAtTime(1, context.currentTime, keyboard.data.attack);

  osc.frequency.value  = frequency;
  osc2.frequency.value = frequency;
  osc.detune.value = keyboard.data.osc1Detune;
  osc2.detune.value = keyboard.data.osc2Detune;

  filter.type = keyboard.data.filterType;
  filter.frequency.value = keyboard.data.filterCutoff;



  // (osc, osc2) -> oscVolume -> master out
  osc.connect(oscVolume);
  osc2.connect(oscVolume);
  oscVolume.connect(filter);
  filter.connect(masterVolume);

  oscObject = {
    voices: [osc],
    volume: oscVolume
  }

  oscillators[frequency] = oscObject;

}

keyboard.keyUp = function (note, frequency) {

  oscillators[frequency].volume.gain.setTargetAtTime(0, context.currentTime, keyboard.data.release);

}

// code for drum pads
// ========================================

var sounds = [{
                url: "http://dab1nmslvvntp.cloudfront.net/wp-content/uploads/2014/08/1407409274kick.wav",
                buffer: ''
              },
              {
                url: "http://dab1nmslvvntp.cloudfront.net/wp-content/uploads/2014/08/1407409275snare.wav",
                buffer: ''
              },
              {
                url: "http://dab1nmslvvntp.cloudfront.net/wp-content/uploads/2014/08/1407409276tin.wav",
                buffer: ''
              },
              {
                url: "http://dab1nmslvvntp.cloudfront.net/wp-content/uploads/2014/08/1407409278hat.wav",
                buffer: ''
              }]

function loadAudio(object, url) {
  // console.log('load audio function');
  var request = new XMLHttpRequest();

  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer){
      object.buffer = buffer;
    });
  }

  request.send();
}

function addAudioProperties(object) {
  // console.log('add audio properties function');
  object.name = object.id;
  object.source = object.dataset.sound;
  loadAudio(object, object.source);
  object.play = function () {
    var s = context.createBufferSource();
    s.buffer = object.buffer;
    s.connect(context.destination);
    s.start(0);
    object.s = s;
  }
}
// ========================================
//  end code for drum pads




window.onload = function() {


// this is the part you are working on !
// ========================================
  var keyParams = document.querySelectorAll('.keyboardParams');

  for (var i = 0; i < keyParams.length; i++){
    keyParams[i].addEventListener('change', function(){
      console.log(this.name);
      console.log(this.value);
      keyboard.data[this.name] = this.value + 0.001;
    })
  }
// this is the part you are working on !
// ========================================

  console.log('the window is loaded and so am i....');

  console.log(keyboard.data);

  var pads        = document.querySelectorAll('#soundpad div'),
      sockets     = io.connect(),
      messageForm = document.getElementById('send-messages'),
      messageBox  = document.getElementById('message'),
      chat        = document.getElementById('chat'),
      username    = document.getElementById('username');

  // load our sounds from our urls
  sounds.forEach(function(sound){
    loadAudio(sound, sound.url);
    sound.play = function () {
      var s = context.createBufferSource();
      s.buffer = sound.buffer;
      s.connect(context.destination);
      s.start(0);
      sound.s = s;
    }
  })

  // add event listeners to our buttons
  for (var i = 0; i < pads.length; i++) {
    // console.log(pads[i].dataset.sound);
    console.log(pads[i]);
    // addAudioProperties(pads[i]);
    pads[i].addEventListener('click', function(){
      sockets.emit('buttonPress', this.id);
      // this.play();
    });
  }

  sockets.on('playSound', function(buttonId){
    sounds[buttonId].play();
    // console.log('wow! a sound!');
  })

  // event listener for our chat form
  messageForm.addEventListener('submit', function(e){
    e.preventDefault();
    var messageData = {
      message: messageBox.value,
      username: username.value
    };
    sockets.emit('send message', messageData);
    messageBox.value = '';
  })

  sockets.on('new message', function(data) {
    var p = document.createElement('p');
    p.innerHTML = '<b>' + data.username + ': </b>' + data.message;
    chat.appendChild(p);
  })
}
