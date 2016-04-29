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

app.get('/rooms/:id', function(req, res){
  res.sendFile(__dirname + '/index.html');
  // console.log(req.params.id);

})

io.sockets.on('connection', function(socket){
  socket.on('join-room', function(room){
    if (socket.rooms) socket.rooms = {};
    socket.join(room);
  })


  // event listener for drum triggers
  socket.on('buttonPress', function(buttonId){
    console.log(socket.rooms);
    for (room in socket.rooms) {
      io.sockets.in(socket.rooms[room]).emit('playSound', buttonId);
    }

  })

  // event listeners for keyboard events
  socket.on('keyboardDown', function(data){
    for (room in socket.rooms){
      io.sockets.in(socket.rooms[room]).emit('keyboardDown', data);
    }

  })

  socket.on('keyboardUp', function(data){
    for (room in socket.rooms){
      io.sockets.in(socket.rooms[room]).emit('keyboardUp', data);
    }

  })

  // event listener for sent message
  socket.on('send message', function(data){
    for (room in socket.rooms) {
      io.sockets.in(socket.rooms[room]).emit('new message', data);
    }

  });
})
