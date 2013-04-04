var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(8080);

function handler (req, res) {
  fs.readFile(__dirname + '/UI/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var players = new Array();
var players2 = {};
io.sockets.on('connection', function (socket) {
  console.log('A new connection has been created');
  
  socket.on('join', function (name) {
    console.log('I am the Join function!');
	//players.push({name:name,position:0});
	players2[name]=0;
	console.log(players2);
	socket.emit('playerListUpdate', players2);
	socket.broadcast.emit('playerListUpdate', players2);
  });
  
  socket.on('startGame', function (name) {
    console.log('I am the Start Game function!');
	//this is where we loop
	var data = {};
	for (var i = 0; i<Object.keys(players2).length; i++)
		data[Object.keys(players2)[i]] = players2[Object.keys(players2)[i]];
	var rnd = Math.floor(Math.random()*Object.keys(players2).length);
	data[Object.keys(data)[rnd]]++;
	
	socket.emit('boardUpdate', data);
	socket.broadcast.emit('boardUpdate', data);
	
  });
  
  
  //socket.emit('news', { hello: 'world' });
  //socket.on('giveMeData', function (data) {
  //  console.log('heres your data');
  //});
});