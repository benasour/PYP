var express = require('express');
var http = require('http');
var socket = require('socket.io');
var express = require('express');
var jade = require('jade');
var mongoose = require('mongoose');

var app = express();
var server = http.createServer(app);
var io = socket.listen(server);

//heroku suggestion to use port 8080
var port = process.env.PORT || 8080;
server.listen(port);

//Models and db connection
var Game = require('./Models/game');
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/PYP');

//configuration settings for express and socket.io
//production environment only
io.configure('production', function () {
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10);
  io.enable('browser client minification');
});

//development  environment only
app.configure('development', function() {
  app.locals.pretty = true;
});

//all environments
app.set('views', __dirname + '/UI');
app.set('view engine', 'jade');

//controller routes
app.get('/', function(req, res) {
  res.render('index');
});

app.get('/games', function(req, res) {
  Game.find({}, function(err, games) {
    if (!err) {
      res.render('games', {games: games});
    }
  });
});

//look into using express.static
app.get('/style.css', function(req, res) {
  res.sendfile(__dirname + '/UI/style.css');
});

app.get('/connections.js', function(req, res) {
  res.sendfile(__dirname + '/UI/connections.js');
});

app.get('/interactions.js', function(req, res) {
  res.sendfile(__dirname + '/UI/interactions.js');
});

var players = new Array();
var started = false;
var clients = 0;
var clientsWaiting = 0;
io.sockets.on('connection', function (socket) {
  console.log('A new connection has been created');
  var toSend = {};
  if (started && clients > 0) // if a game is in progress, tell this person!
  {
    toSend["status"] = "started";
    socket.emit('sendStatus', toSend);
  }
  clients++;
  toSend = {};
  toSend["players"] = players;
  console.log(toSend);
  socket.emit('playerListUpdate', toSend);
  socket.broadcast.emit('playerListUpdate', toSend);
  
  socket.on('disconnect', function(data) {
    clients--;
    console.log("disconnect, clients: " + clients);
    if (clients == 0)
    {
      cards = {};
      players = new Array();
      started = false;
    }
  });
  
  socket.on('requestPlayers', function(){
    var toSend = {};
    toSend["players"] = players;
    console.log(toSend);
    socket.emit('playerListUpdate', toSend);
    socket.broadcast.emit('playerListUpdate', toSend);
  });
  
  socket.on('join', function (name, choice, bet) {
  console.log('I am the Join function!');

  players.push({"name":name, "choice":choice, "bet":bet});
  //wrap in another layer to format it as a type for interactions.js
  var toSend = {};
  toSend["players"] = players;
  console.log(toSend);
  socket.emit('playerListUpdate', toSend);
  socket.broadcast.emit('playerListUpdate', toSend);
  });
  
  socket.on('new', function () {
  console.log('I am the new game function!');
    started = false;
    //reset the players!
    players = new Array();
  
    //tell other clients that a new game is starting
    var toSend = {};
    toSend["status"] = "new";  
    socket.emit('playerListUpdate', toSend);
    socket.broadcast.emit('playerListUpdate', toSend);
  
    //reset everyone's player lists
    toSend = {};
    toSend["players"] = players;
    console.log(toSend);
    socket.emit('playerListUpdate', toSend);
    socket.broadcast.emit('playerListUpdate', toSend);
  });
  
  socket.on('startGame', function () {
    started = true;
    console.log('I am the Start Game function!');
    var status = {};
    status["status"] = "start";
    console.log(status);
    socket.broadcast.emit('sendStatus', status);  
  
    var trackLength = 8; //from index.html
  
    //this is where we loop
    var cards = {0:0, 1:0, 2:0, 3:0};
    
    finished = false;
    var curSide = 1;
    
    //loop through game operations untill full game sequence has been sent
    while (!finished)
    {
      var rnd = Math.floor(Math.random()*4);
      cards[Object.keys(cards)[rnd]]++;
      
      
      //tell client to increment this card
      console.log("incrementing: " + JSON.stringify({"card":rnd}));
      socket.emit('incrementCard', {"card":rnd});
      socket.broadcast.emit('incrementCard', {"card":rnd});  
      
      //check if every player passed the next line and flip a card if so
      var flip = true;
      for (var i = 0; i < Object.keys(cards).length; i++)
        if (cards[Object.keys(cards)[i]] < curSide)
          flip = false;
      //someone crossed, so flip and decrement (and tell clients)
      //someone crossed, so flip and decrement (and tell clients)
      if (flip) 
      {
        curSide++;
        var rnd2 = Math.floor(Math.random()*4);
        cards[Object.keys(cards)[rnd2]]--;
        console.log("Flipping: " + JSON.stringify({"card":rnd2}));
        socket.emit('flipCard', {"card":rnd2});
        socket.broadcast.emit('flipCard', {"card":rnd2}); 
      }
    
      //check for end game conditions
      for (var j = 0; j<Object.keys(cards).length; j++)
        if (cards[Object.keys(cards)[j]] >= trackLength)
          finished=true;
      
    }
    
  });
  
});
