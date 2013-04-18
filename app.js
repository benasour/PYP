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

var horse = require('./horse/horse.js');

//heroku suggestion to use port 8080
var port = process.env.PORT || 8080;
server.listen(port);

//Models and db connection
var Game = require('./Models/game');
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost/PYP');

var gameChoice;

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

app.get('/horse', function(req, res) {
  gameChoice = '/horse/';
  app.set('views', __dirname + gameChoice + '/UI');
  res.render('index');
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


io.sockets.on('connection', function (socket) {
  horse.game(socket);
});


