/*  TODO: rename every signal to have a prefix of it's game
    i.e: "horse-playerUpdate", "horse-boardUpdate", etc
    This format allows every game to be contained in this
    one file while we search for a better solution.
*/


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
  app.set('views', __dirname + '/horse/UI');
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
  res.sendfile(__dirname + '/horse/UI/style.css');
});

app.get('/connections.js', function(req, res) {
  res.sendfile(__dirname + '/horse/UI/connections.js');
});

app.get('/interactions.js', function(req, res) {
  res.sendfile(__dirname + '/horse/UI/interactions.js');
});

var players = new Array();
var started = false;
var clients = 0;
var trackLength=8;
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
  
    //tell other clients that a new game is being prepared
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
    socket.emit('sendStatus', status); 
    socket.broadcast.emit('sendStatus', status);  
  
    //this is where we loop
    var cards = {0:0, 1:0, 2:0, 3:0};
    var sideLane = {};
    for (var i = 0; i < trackLength; i++)
      sideLane[i] = -1;
    
    //send initial states
    socket.emit('partialBoardUpdate', {"cards":cards, "sideLane":sideLane});
    socket.broadcast.emit('partialBoardUpdate', {"cards":cards, "sideLane":sideLane});      
    
    finished = false;
    var curSide = 1;
    var curCard;
    //loop through game operations untill full game sequence has been sent
    while (!finished)
    {
      var rnd = Math.floor(Math.random()*4);
      cards[Object.keys(cards)[rnd]]++;
      curCard=rnd;
      
      //tell client to increment this card
      console.log("incrementing: " + JSON.stringify({"card":rnd}));
      socket.emit('partialBoardUpdate', {"cards":cards, "sideLane":sideLane});
      socket.broadcast.emit('partialBoardUpdate', {"cards":cards, "sideLane":sideLane});      
      
      //check if every player passed the next line and flip a card if so
      var flip = true;
      for (var i = 0; i < Object.keys(cards).length; i++)
        if (cards[Object.keys(cards)[i]] < curSide)
          flip = false;
      
      //last horse crossed step, so flip a card and decrement (and tell clients)
      if (flip) 
      {
        var rnd2 = Math.floor(Math.random()*4);
        sideLane[trackLength-curSide] = rnd2;
        curSide++;
        cards[Object.keys(cards)[rnd2]]--; //decrementing the appropriate horse to maintain position
        console.log("Flipping: " + JSON.stringify({"card":rnd2}));
        //boolean after data to tell that flip happened
        socket.emit('partialBoardUpdate', {"cards":cards, "sideLane":sideLane}, true);
        socket.broadcast.emit('partialBoardUpdate', {"cards":cards, "sideLane":sideLane}, true); 
      }
    
      //check for end game conditions
      for (var j = 0; j<Object.keys(cards).length; j++)
        if (cards[Object.keys(cards)[j]] >= trackLength)
          finished=true;
    } //end while
    
    //send winner (last card incremented)
    console.log({"winner":curCard});
    socket.emit('winner', {"winner":curCard});
    socket.broadcast.emit('winner', {"winner":curCard}); 
    
    //reset everyone's board
    var cards = {0:0, 1:0, 2:0, 3:0};
    var sideLane = {};
    for (var i = 0; i < trackLength; i++)
      sideLane[i] = -1;
    socket.emit('partialBoardUpdate', {"cards":cards, "sideLane":sideLane});
    socket.broadcast.emit('partialBoardUpdate', {"cards":cards, "sideLane":sideLane});      
    
  }); //end 'start game'
  
  socket.on('chatMsg', function (data) {
    var msg = data["msg"];
    
    socket.emit('chatMsg', {"msg":msg});
    socket.broadcast.emit('chatMsg', {"msg":msg});
  });
  
});
