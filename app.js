/*  TODO: rename every signal to have a prefix of it's game
    i.e: "horse-playerUpdate", "horse-boardUpdate", etc
    This format allows every game to be contained in this
    one file while we search for a better solution.
*/


var express = require('express');
var http = require('http');
var socket = require('socket.io');
var jade = require('jade');
var mongoose = require('mongoose');

var app = express();
var server = http.createServer(app);
var io = socket.listen(server);

//ADD YOUR GAME HERE
var horse = require('./horse/horse.js');
var coin = require('./coin/coin.js');

//heroku suggestion to use port 8080
var port = process.env.PORT || 8080;
server.listen(port);

//Models and db connection
var Game = require('./Models/game');
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/PYP');

//temp games list for testing (use DB later)
var gameList = new Array();
gameList.push({"name":"coin"});
gameList.push({"name":"horse"});

var gameChoice;

//configuration settings for express and socket.io
//production environment only
io.configure('production', function () {
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10);
  io.enable('browser client minification');
});

io.configure('test', function () {
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
app.use(express.bodyParser());

//controller routes
app.get('/', function(req, res) {
  app.set('views', __dirname + '/UI');
  console.log(JSON.stringify({games: gameList}));
  res.render('games', {games: gameList} );
});

app.get('/games', function(req, res) {
  app.set('views', __dirname + '/UI');
  Game.find({}, function(err, games) {
    if (!err) {
      res.render('games', {games: games});
    }
  });
});

//ADD YOUR GAME EXTENTION HERE!

app.get('/horse/:name', function(req, res) {
  gameChoice = '/horse/';
  app.set('views', __dirname + '/horse/UI');
  res.render('index', {"name": req.params.name});
});

app.post('/horseform', function(req, res) {
  horse.joinGame(req.body.name, req.body.suit, req.body.bet);
  res.redirect('/horse/'+req.body.name);
});

app.get('/coin/:name', function(req, res) {
  gameChoice = '/coin/';
  app.set('views', __dirname + '/coin/UI');
  res.render('index', {"name": req.params.name});
});

app.post('/coinform', function(req, res) {
  coin.joinGame(req.body.name, req.body.side, req.body.bet);
  res.redirect('/coin/'+req.body.name);
});


//look into using express.static
app.use(express.static(__dirname + '/Assets'));
app.get('/style.css', function(req, res) {
  //res.sendfile(__dirname + gameChoice + 'UI/style.css');
  res.sendfile(__dirname + '/horse/UI/style.css');
});

app.get('/connections.js', function(req, res) {
  res.sendfile(__dirname + gameChoice + 'UI/connections.js');
});

app.get('/interactions.js', function(req, res) {
  res.sendfile(__dirname + gameChoice + 'UI/interactions.js');
});

//ADD YOUR GAME HERE AS WELL
//connect to game
//THIS SWITCH SHOULD ONLY BE HERE IF WE'RE NOT PREPENDING GAME NAME IN ALL SOCKET SIGNALS
io.sockets.on('connection', function (socket) {
  horse.game(socket, io);
  coin.game(socket, io);
});


