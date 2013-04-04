var socket = require('socket.io');
var express = require('express');

var app = express();
var io = socket.listen(app);

app.get('/', function(req, resp) {
  resp.sendfile('index.html');
});

app.get('socket.io/socket.io.js', function(req, res) {
  res.sendfile('node_modules/socket.io/lib/socket.io.js');
});

io.sockets.on('connection', function(client) {
  console.log("a client has connected");
});

app.listen(8080);
