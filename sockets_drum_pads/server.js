var express = require('express'),
    app     = express(),
    server  = require('http').createServer(app),
    io      = require('socket.io').listen(server);


server.listen(9292);
console.log('the server is now listening on 9292');

app.use(express.static(__dirname));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
})

io.sockets.on('connection', function(socket){

  // event listener for drum triggers
  socket.on('buttonPress', function(buttonId){
    io.sockets.emit('playSound', buttonId);
  })

  // event listeners for keyboard events
  socket.on('keyboardDown', function(data){
    io.sockets.emit('keyboardDown', data)
  })

  socket.on('keyboardUp', function(data){
    io.sockets.emit('keyboardUp', data)
  })

  // event listener for sent message
  socket.on('send message', function(data){
    // console.log('send message');
    io.sockets.emit('new message', data);
  });
})
