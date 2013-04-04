var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

//changed this to 8080 because 80 was throwing a conflict error
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
	
	var trackLength = 8; //from index.html
	
	//this is where we loop
	var data = {};
	//um, this number thing is wierd - make it true/false
	var finishLine=0;
	while (finishLine<=100)
	{
		finishLine++;
		for (var i = 0; i<Object.keys(players2).length; i++)
			data[Object.keys(players2)[i]] = players2[Object.keys(players2)[i]];
		var rnd = Math.floor(Math.random()*Object.keys(players2).length);
		players2[Object.keys(data)[rnd]]++;
		//receiveData(JSON.stringify(data));
		
		for (var j = 0; j<Object.keys(players2).length; j++)
		{
			if (players2[Object.keys(players2)[j]] >= trackLength)
			{
				finishLine=101;
			}
		}
		console.log(players2);
		socket.emit('partialBoardUpdate', players2);
		socket.broadcast.emit('partialBoardUpdate', players2);		
	}
	//send the final result to UI for updating
	//socket.emit('finalBoardUpdate', players2);
	//socket.broadcast.emit('finalBoardUpdate', players2);
	
  });
  
  
  //socket.emit('news', { hello: 'world' });
  //socket.on('giveMeData', function (data) {
  //  console.log('heres your data');
  //});
});