var context = new AudioContext();

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

window.onload = function() {

  console.log('the window is loaded and so am i....');

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
    console.log('wow! a sound!');
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
