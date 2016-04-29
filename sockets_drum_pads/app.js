var context      = new AudioContext(),
    masterVolume = context.createGain();

// set up querty-hancock keyboard
var keyboard = new QwertyHancock({
  id:      'keyboard',
  width:   800,
  height:  200,
  octaves: 3
})

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

// object to store active oscillators
var oscillators = {};

// context.destination ~= master out
// chains look roughly like osc -> effects/filters -> masterVolume -> context.destination aka speakers or headphones
masterVolume.gain.value = 0.3;
masterVolume.connect(context.destination);

// function to play oscillators based on keyboard triggers
// the frequency parameter comes from the qwerty-hancock object,
// the 'data' parameter is synth information either from keyboard data
// or sent over via sockets
function playNote(data, frequency){
  var osc = context.createOscillator();
  var osc2 = context.createOscillator();
  var oscVolume = context.createGain();
  var filter = context.createBiquadFilter();

  osc.start(context.currentTime);
  osc2.start(context.currentTime);

  osc.type = data.osc1;
  osc2.type = data.osc2;

  // set gain for both oscillators
  // start gain at 0 and then ramp up over attack time
  oscVolume.gain.value = 0;
  oscVolume.gain.setTargetAtTime(1, context.currentTime, data.attack);

  osc.frequency.value  = frequency;
  osc2.frequency.value = frequency;
  osc.detune.value = data.osc1Detune;
  osc2.detune.value = data.osc2Detune;

  filter.type = data.filterType;
  filter.frequency.value = data.filterCutoff;

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
  console.log('the window is loaded and so am i....');

  // event listeners for our synth parameters
  var keyParams = document.querySelectorAll('.keyboardParams');

  for (var i = 0; i < keyParams.length; i++){
    keyParams[i].addEventListener('change', function(){
      switch (this.name) {
        case 'attack':
        case 'release':
          keyboard.data[this.name] = (this.value / 100) * 2 + 0.001;
          break;
        case 'filterCutoff':
          keyboard.data[this.name] = (this.value / 100) * 20000;
          break;
        case 'osc1Detune':
        case 'osc2Detune':
          keyboard.data[this.name] = (this.value / 100) * 100;
          break;
        case 'filterType':
        case 'osc1':
        case 'osc2':
          keyboard.data[this.name] = this.value;
          break;
      }
    })
  }

  // sockets for drum pads
  // =====================
  var pads        = document.querySelectorAll('#soundpad div'),
      sockets     = io.connect(),
      messageForm = document.getElementById('send-messages'),
      messageBox  = document.getElementById('message'),
      chat        = document.getElementById('chat'),
      username    = document.getElementById('username'),
      roomForm    = document.getElementById('join-room'),
      roomName    = document.getElementById('room-name');


  roomForm.addEventListener('submit', function(e){
    e.preventDefault();
    sockets.emit('join-room', roomName.value);
  })

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
    pads[i].addEventListener('click', function(){
      sockets.emit('buttonPress', this.id);
    });
  }

  sockets.on('playSound', function(buttonId){
    sounds[buttonId].play();
    // console.log('wow! a sound!');
  })

  // sockets for keyboard
  // ====================
  keyboard.keyDown = function (note, frequency) {
    // var oscSocketData = playNote(keyboard.data, frequency);
    var oscSocketData = {
      data: keyboard.data,
      frequency: frequency
    }
    // console.log(oscSocketData);
    sockets.emit('keyboardDown', oscSocketData);
  }

  keyboard.keyUp = function (note, frequency) {
    // oscillators[frequency].volume.gain.setTargetAtTime(0, context.currentTime, keyboard.data.release);
    oscSocketData = {
      data: keyboard.data,
      frequency: frequency
    }
    sockets.emit('keyboardUp', oscSocketData);
  }

  sockets.on('keyboardDown', function(keyboardData){
    // console.log('key down');
    // console.log(keyboardData.frequency);
    playNote(keyboardData.data, keyboardData.frequency);
  })

  sockets.on('keyboardUp', function(keyboardData){
    // console.log('key up');
    release = keyboardData.data.release;
    frequency = keyboardData.frequency;
    oscillators[frequency].volume.gain.setTargetAtTime(0, context.currentTime, release);
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
